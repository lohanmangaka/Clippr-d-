import { NativeModules } from 'react-native';

// Type definitions for returned segments
export interface WhisperSegment {
  start: number; // seconds
  end: number;   // seconds
  text: string;
  probability: number;
}

export interface TranscriptionResult {
  segments: WhisperSegment[];
  language: string;
}

/**
 * JS wrapper around native Whisper.cpp RN module.
 * For now, this file provides a fallback dummy implementation so that
 * the rest of the JS code can compile even if the native side is not yet wired.
 */
const LINKING_ERROR =
  `The package 'WhisperBridge' doesn't seem to be linked. Make sure:\n\n` +
  '- You have built the native code for Android and/or iOS\n' +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow (custom dev client is fine)';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WhisperBridge: any = NativeModules.WhisperBridge ?? {
  transcribe: () => {
    throw new Error(LINKING_ERROR);
  },
};

export async function transcribe(filePath: string, model: string = 'base.en'): Promise<TranscriptionResult> {
  return WhisperBridge.transcribe(filePath, model);
}