import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import DocumentPicker, { types } from 'react-native-document-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { PrimaryButton } from '../components';

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const handlePickVideo = async () => {
    try {
      const res = await DocumentPicker.pickSingle({ type: [types.video] });
      if (res.uri) {
        navigation.navigate('Processing', { videoUri: res.uri });
      }
    } catch (err: any) {
      if (DocumentPicker.isCancel(err)) {
        // user cancelled
      } else {
        console.error(err);
        Alert.alert('Error', 'Failed to pick video');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ViralityClipprx</Text>
      <PrimaryButton title="Select Video" onPress={handlePickVideo} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
});

export default HomeScreen;