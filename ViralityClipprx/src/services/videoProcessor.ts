import { ensureDirectories, TEMP_DIR, OUTPUT_DIR } from '../config/directories';
import { runFFmpeg } from './ffmpeg';
import RNFS from 'react-native-fs';
import uuid from 'react-native-uuid';

export interface ClipWindow {
  /** seconds */
  start: number;
  /** seconds */
  duration: number;
}

/**
 * Creates individual highlight clips given an input video and desired windows.
 * Returns absolute paths to the generated clips.
 */
export async function generateHighlightClips(
  inputPath: string,
  windows: ClipWindow[],
): Promise<string[]> {
  await ensureDirectories();

  const results: string[] = [];
  for (const window of windows) {
    const outputPath = `${TEMP_DIR}/clip_${uuid.v4()}.mp4`;
    const ffCmd = `-y -i "${inputPath}" -ss ${window.start} -t ${window.duration} -c copy "${outputPath}"`;
    const ok = await runFFmpeg(ffCmd);
    if (ok) {
      results.push(outputPath);
    }
  }
  return results;
}

/**
 * Concatenates an array of clip paths into a single vertical 9:16 video.
 * The result is stored under OUTPUT_DIR and its path is returned.
 */
export async function concatAndFormatVertical(clips: string[]): Promise<string | null> {
  if (clips.length === 0) return null;
  await ensureDirectories();

  // Write a concat list file
  const listFile = `${TEMP_DIR}/concat_${Date.now()}.txt`;
  const concatContent = clips.map((c) => `file '${c}'`).join('\n');
  await RNFS.writeFile(listFile, concatContent, 'utf8');

  const outputFinal = `${OUTPUT_DIR}/highlight_${Date.now()}.mp4`;

  // Scale & crop to 9:16 (assumes landscape source; adjust as needed)
  const filter = "scale=1080:-2,crop=1080:1920";
  const cmd = `-y -f concat -safe 0 -i "${listFile}" -vf ${filter} -c:v libx264 -preset veryfast -crf 23 -c:a copy "${outputFinal}"`;

  const ok = await runFFmpeg(cmd);
  return ok ? outputFinal : null;
}