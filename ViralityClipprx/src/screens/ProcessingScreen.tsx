import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { generateHighlightClips, concatAndFormatVertical } from '../services/videoProcessor';
import {
  detectSpeechSections,
  detectSceneChanges,
  scoreHighlightWindows,
  generateThumbnails,
} from '../services/analyzer';
import { getMediaInfo } from '../services/ffmpeg';
import { ClipWindow } from '../services/videoProcessor';
import { ProgressBar } from '../components';

export type ProcessingScreenProps = NativeStackScreenProps<RootStackParamList, 'Processing'>;

const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ route, navigation }) => {
  const { videoUri } = route.params;
  const [progressText, setProgressText] = useState('Starting...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepsTotal = 6;

    const advance = (step: number, text: string) => {
      setProgressText(text);
      setProgress(step / stepsTotal);
    };

    const process = async () => {
      try {
        advance(0, 'Retrieving metadata...');
        // get video duration to clamp windows later
        const info = await getMediaInfo(videoUri);
        const durationSec = info?.duration ? parseFloat(info.duration) : undefined;

        // Silence Detection
        advance(1, 'Detecting silence...');
        const speechSections = await detectSpeechSections(videoUri);
        if (durationSec) {
          // clamp MAX_SAFE_INTEGER markers
          speechSections.forEach((sec) => {
            if (sec[1] === Number.MAX_SAFE_INTEGER) sec[1] = durationSec;
          });
        }

        // Scene Changes
        advance(2, 'Detecting scene changes...');
        const sceneTimes = await detectSceneChanges(videoUri);

        // Score windows
        advance(3, 'Scoring highlights...');
        const windows: ClipWindow[] = scoreHighlightWindows(speechSections, sceneTimes, 30, 5);

        // Generate Clips
        advance(4, 'Generating clips...');
        const clips = await generateHighlightClips(videoUri, windows);

        // Generate thumbnails at start times
        advance(5, 'Generating thumbnails...');
        const thumbTimes = windows.map((w) => w.start + 0.5);
        const thumbs = await generateThumbnails(videoUri, thumbTimes);

        // Optionally concatenate into one vertical video
        // const finalPath = await concatAndFormatVertical(clips);

        advance(6, 'Done');
        navigation.replace('Preview', { clips, thumbs });
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Processing failed');
      }
    };

    process();
  }, [videoUri, navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>{progressText}</Text>
      <ProgressBar progress={progress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
  },
});

export default ProcessingScreen;