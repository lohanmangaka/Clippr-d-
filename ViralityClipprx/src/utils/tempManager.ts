import RNFS from 'react-native-fs';

const tempFiles: Set<string> = new Set();

export const registerTemp = (path: string) => {
  tempFiles.add(path);
};

export const cleanupTemps = async () => {
  const deletions = Array.from(tempFiles).map(async (p) => {
    try {
      if (await RNFS.exists(p)) await RNFS.unlink(p);
    } catch (_) {}
  });
  await Promise.all(deletions);
  tempFiles.clear();
};