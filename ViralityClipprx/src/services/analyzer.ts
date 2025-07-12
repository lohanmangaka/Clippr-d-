import { executeWithLogs } from './ffmpeg';
import { ClipWindow } from './videoProcessor';
import RNFS from 'react-native-fs';
import uuid from 'react-native-uuid';
import { ensureDirectories, CACHE_DIR } from '../config/directories';

/** Helper to run FFmpeg command and return full console output */
async function runAndGetOutput(cmd: string): Promise<string> {
  const { ok, logs } = await executeWithLogs(cmd);
  if (!ok) console.warn('FFmpeg analysis command failed', cmd);
  return logs;
}

/** Silence detection to produce speech sections using silencedetect logs */
export async function detectSpeechSections(path: string, noiseThreshold = -35, silenceDuration = 0.4): Promise<Array<[number, number]>> {
  const cmd = `-vn -i "${path}" -af silencedetect=noise=${noiseThreshold}dB:d=${silenceDuration} -f null -`;
  let logs = '';
  try {
    logs = await runAndGetOutput(cmd);
  } catch (e) {
    console.warn('silencedetect failed', e);
    return [];
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
  return speechSections.filter(([s, e]) => e - s > 1 && s >= 0);
}

/** Scene change detection extracting pts_time values where scene threshold exceeded */
export async function detectSceneChanges(path: string, threshold = 0.35): Promise<number[]> {
  const cmd = `-i "${path}" -vf select='gt(scene,${threshold})',showinfo -f null -`;
  let logs = '';
  try {
    logs = await runAndGetOutput(cmd);
  } catch (e) {
    console.warn('scene detect failed', e);
    return [];
  }

  const times: number[] = [];
  const regex = /showinfo.*pts_time:([0-9]+\.?[0-9]*)/;
  logs.split(/\r?\n/).forEach((line) => {
    const m = line.match(regex);
    if (m) {
      times.push(parseFloat(m[1]));
    }
  });
  return times.sort((a,b)=>a-b);
}

/** Generate thumbnail images (jpg) at provided timestamps */
export async function generateThumbnails(path: string, times: number[]): Promise<string[]> {
  await ensureDirectories();
  const outputPaths: string[] = [];

  for (const t of times) {
    const outPath = `${CACHE_DIR}/thumb_${uuid.v4()}.jpg`;
    const cmd = `-y -ss ${t} -i "${path}" -vf scale=320:-1 -frames:v 1 -q:v 3 "${outPath}"`;
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
  const speechWeight = 1;
  const sceneWeight = 2.5;
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
      const score = speechCoverage * speechWeight + sceneCount * sceneWeight;
      candidates.push({ window: { start: winStart, duration: windowSize }, score });
    }
  });

  // Sort and pick topK without heavy overlap (>50% overlap)
  candidates.sort((a, b) => b.score - a.score);
  const selected: ClipWindow[] = [];

  for (const c of candidates) {
    if (selected.length >= topK) break;
    const overlaps = selected.some((w) =>
      Math.min(w.start + w.duration, c.window.start + c.window.duration) - Math.max(w.start, c.window.start) > windowSize / 2,
    );
    if (!overlaps) {
      selected.push(c.window);
    }
  }

  return selected;
}