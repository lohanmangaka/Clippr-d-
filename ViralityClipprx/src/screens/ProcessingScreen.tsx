import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { generateHighlightClips, concatAndFormatVertical, ClipWindow } from '../services/videoProcessor';

export type ProcessingScreenProps = NativeStackScreenProps<RootStackParamList, 'Processing'>;

const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ route, navigation }) => {
  const { videoUri } = route.params;
  const [progressText, setProgressText] = useState('Starting...');

  useEffect(() => {
    const process = async () => {
      try {
        setProgressText('Analyzing video...');
        // TODO: run silence / scene analysis to build windows.
        // For now produce a single 30s clip starting at 0.
        const windows: ClipWindow[] = [{ start: 0, duration: 30 }];

        setProgressText('Generating clips...');
        const clips = await generateHighlightClips(videoUri, windows);

        setProgressText('Concatenating & formatting...');
        const finalPath = await concatAndFormatVertical(clips);

        navigation.replace('Preview', { clips: finalPath ? [finalPath] : clips });
      } catch (err) {
        console.error(err);
        setProgressText('Processing failed');
      }
    };

    process();
  }, [videoUri, navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>{progressText}</Text>
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