import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { PrimaryButton } from '../components';
import { concatAndFormatVertical } from '../services/videoProcessor';
import { Share } from 'react-native';

export type PreviewScreenProps = NativeStackScreenProps<RootStackParamList, 'Preview'>;

const PreviewScreen: React.FC<PreviewScreenProps> = ({ route, navigation }) => {
  const { clips, thumbs } = route.params;
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const out = await concatAndFormatVertical(clips);
      if (out) {
        await Share.share({ url: out, message: 'Here is my clipped video!' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const thumb = thumbs?.[index];
    return (
      <TouchableOpacity style={styles.clipItem} onPress={() => {}}>
        {thumb ? (
          <View style={styles.thumbRow}>
            <Text style={styles.clipText}>{index + 1}.</Text>
            <Text numberOfLines={1} style={[styles.clipText, { flex: 1 }]}> {item}</Text>
          </View>
        ) : (
          <Text numberOfLines={1} style={styles.clipText}>{item}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generated Clips</Text>
      <FlatList data={clips} keyExtractor={(i) => i} renderItem={({ item, index }) => renderItem({ item, index })} />
      <PrimaryButton title={exporting ? 'Exporting...' : 'Export'} disabled={exporting} onPress={handleExport} />
      <PrimaryButton title="Done" onPress={() => navigation.popToTop()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  clipItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
  },
  clipText: {
    fontSize: 14,
  },
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default PreviewScreen;