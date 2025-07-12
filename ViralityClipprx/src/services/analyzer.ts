import { executeWithLogs, tail } from './ffmpeg';
import { ClipWindow } from './videoProcessor';
import RNFS from 'react-native-fs';
import { generateId } from '../utils/id';
import { registerTemp } from '../utils/tempManager';
import { ensureDirectories, CACHE_DIR } from '../config/directories';
import weights from '../config/weights.json';
export const WEIGHTS = weights as { speech: number; scene: number; balancePenalty: number };

/** Helper to run FFmpeg command and return full console output */
async function runAndGetOutput(cmd: string): Promise<string> {
  const { ok, logs } = await executeWithLogs(cmd);
  if (!ok) throw new Error(`FFmpeg analysis failed\n${tail(logs)}`);
  return logs;
}

/** Measure average loudness using ffmpeg volumedetect, returns mean volume in dBFS (negative) */
async function getMeanVolume(path: string): Promise<number | null> {
  const cmd = `-i "${path}" -af volumedetect -f null -`;
  try {
    const logs = await runAndGetOutput(cmd);
    const match = logs.match(/mean_volume:\s*(-?\d+\.?\d*) dB/);
    if (match) return parseFloat(match[1]);
  } catch (e) {
    console.warn('volumedetect failed', e);
  }
  return null;
}

/** Silence detection to produce speech sections using silencedetect logs */
export async function detectSpeechSections(path: string): Promise<Array<[number, number]>> {
  const adaptive = await getMeanVolume(path);
  const thresholds = adaptive !== null ? [adaptive - 10, adaptive - 15, adaptive - 20] : [-35, -40, -45];
  const silenceDuration = 0.4;

  for (const noiseThreshold of thresholds) {
    const cmd = `-vn -i "${path}" -af silencedetect=noise=${noiseThreshold}dB:d=${silenceDuration} -f null -`;
    let logs = '';
    try {
      logs = await runAndGetOutput(cmd);
    } catch (e) {
      console.warn('silencedetect failed at threshold', noiseThreshold, e);
      continue;
    }

    const speechSections: Array<[number, number]> = [];
    let lastSilenceEnd = 0;
    const silenceStartRegex = /silence_start: (\d+(?:\.\d+)?)/;
    const silenceEndRegex = /silence_end: (\d+(?:\.\d+)?)/;

    const lines = logs.split(/\r?\n/);
    let currentSilenceStart: number | null = null;

    for (const line of lines) {
      let match = line.match(silenceStartRegex);
      if (match) {
        const silenceStart = parseFloat(match[1]);
        // speech is from lastSilenceEnd to silenceStart
        if (silenceStart > lastSilenceEnd) {
          speechSections.push([lastSilenceEnd, silenceStart]);
        }
        currentSilenceStart = silenceStart;
        continue;
      }

      match = line.match(silenceEndRegex);
      if (match) {
        const silenceEnd = parseFloat(match[1]);
        lastSilenceEnd = silenceEnd;
        currentSilenceStart = null;
      }
    }

    // Handle tail speech after last silence
    speechSections.push([lastSilenceEnd, Number.MAX_SAFE_INTEGER]);

    // Filter out zero-length segments and clamp negatives
    const result = speechSections.filter(([s, e]) => e - s > 1 && s >= 0);
    if (result.length > 0) {
      return result;
    }
  }
  // fallback empty
  return [];
}

/** Scene change detection extracting pts_time values where scene threshold exceeded */
export async function detectSceneChanges(path: string): Promise<number[]> {
  const thresholds = [0.35, 0.3, 0.25];
  for (const threshold of thresholds) {
    const cmd = `-i "${path}" -vf select='gt(scene,${threshold})',showinfo -f null -`;
    let logs = '';
    try {
      logs = await runAndGetOutput(cmd);
    } catch (e) {
      console.warn('scene detect failed', e);
      continue;
    }

    const times: number[] = [];
    const regex = /showinfo.*pts_time:([0-9]+\.?[0-9]*)/;
    logs.split(/\r?\n/).forEach((line) => {
      const m = line.match(regex);
      if (m) {
        times.push(parseFloat(m[1]));
      }
    });
    if (times.length > 0) return times.sort((a, b) => a - b);
  }
  return [];
}

/** Generate thumbnail images (jpg) at provided timestamps */
export async function generateThumbnails(path: string, times: number[]): Promise<string[]> {
  await ensureDirectories();
  const outputPaths: string[] = [];

  for (const t of times) {
    const outPath = `${CACHE_DIR}/thumb_${generateId()}.jpg`;
    registerTemp(outPath);
    const cmd = `-y -ss ${t} -i "${path}" -vf scale=480:-1:flags=lanczos -frames:v 1 -q:v 2 "${outPath}"`;
    const logs = await runAndGetOutput(cmd);
    if (await RNFS.exists(outPath)) {
      outputPaths.push(outPath);
    }
  }

  return outputPaths;
}

/** Improved highlight scoring algorithm combining speech density gaps and scene changes */
export function scoreHighlightWindows(
  speechSections: Array<[number, number]>,
  sceneTimes: number[],
  windowSize = 30,
  topK = 5,
): ClipWindow[] {
  const { speech: speechWeight, scene: sceneWeight, balancePenalty: balanceFactor } = WEIGHTS;
  const candidates: { window: ClipWindow; score: number }[] = [];

  speechSections.forEach(([startSpeech, endSpeech]) => {
    const speechDuration = endSpeech - startSpeech;
    if (speechDuration <= 1) return; // ignore tiny speech

    // slide windows across speech section
    const step = windowSize / 2;
    for (let winStart = startSpeech; winStart < endSpeech; winStart += step) {
      const winEnd = winStart + windowSize;
      const sceneCount = sceneTimes.filter((t) => t >= winStart && t <= winEnd).length;
      const speechCoverage = Math.min(endSpeech, winEnd) - winStart;
      const score = speechCoverage * speechWeight + sceneCount * sceneWeight - balanceFactor * Math.abs(sceneCount - speechCoverage / windowSize);
      candidates.push({ window: { start: winStart, duration: windowSize }, score });
    }
  });

  // Sort high→low
  candidates.sort((a, b) => b.score - a.score);

  // Non-max suppression (60 % overlap)
  const selected: ClipWindow[] = [];
  const overlapThresh = 0.6;

  for (const c of candidates) {
    if (selected.length >= topK) break;
    const overlaps = selected.some((w) => {
      const inter = Math.min(w.start + w.duration, c.window.start + c.window.duration) - Math.max(w.start, c.window.start);
      return inter / windowSize > overlapThresh;
    });
    if (!overlaps) selected.push(c.window);
  }

  return selected;
}