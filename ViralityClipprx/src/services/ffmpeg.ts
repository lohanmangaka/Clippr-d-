import { FFmpegKit, FFprobeKit, ReturnCode } from 'ffmpeg-kit-react-native';

/**
 * Executes an FFmpeg command and resolves to true/false depending on success.
 * All logs are printed to the native FFmpeg kit logger automatically.
 */
export async function runFFmpeg(command: string): Promise<boolean> {
  try {
    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();

    if (ReturnCode.isSuccess(returnCode)) {
      return true;
    }

    const failStackTrace = await session.getFailStackTrace();
    console.warn('[FFmpeg] Command failed', failStackTrace);
    return false;
  } catch (error) {
    console.error('[FFmpeg] Unexpected error', error);
    return false;
  }
}

/**
 * Returns basic media information for a given file path using FFprobe.
 */
export async function getMediaInfo(path: string): Promise<Record<string, any> | null> {
  try {
    const session = await FFprobeKit.getMediaInformation(path);
    const info = await session.getMediaInformation();
    return info ? info.getAllProperties() : null;
  } catch (err) {
    console.error('[FFprobe] Failed to retrieve media info', err);
    return null;
  }
}