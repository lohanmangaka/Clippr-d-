// Directory helpers for ViralityClipprx
import RNFS from 'react-native-fs';

// Root folders the app will use. Using DocumentDirectoryPath ensures the files
// survive across app launches and are visible to the user if needed.
export const ROOT_DIR = `${RNFS.DocumentDirectoryPath}/ViralityClipprx`;

// Where final clips will be exported.
export const OUTPUT_DIR = `${ROOT_DIR}/output`;

// Cache + temp data that can be safely removed.
export const CACHE_DIR = `${RNFS.CachesDirectoryPath}/ViralityClipprx`;
export const TEMP_DIR = `${CACHE_DIR}/temp`;

/**
 * Ensures all required folders exist. Safe to call multiple times.
 */
export async function ensureDirectories(): Promise<void> {
  const dirs = [ROOT_DIR, OUTPUT_DIR, CACHE_DIR, TEMP_DIR];
  await Promise.all(
    dirs.map(async (path) => {
      const exists = await RNFS.exists(path);
      if (!exists) {
        try {
          await RNFS.mkdir(path);
        } catch (err) {
          console.warn(`[ViralityClipprx] Failed to create dir ${path}:`, err);
        }
      }
    })
  );
}