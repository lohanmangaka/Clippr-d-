import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  progress: number; // 0..1
}

const ProgressBar: React.FC<Props> = ({ progress }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.bar, { width: `${Math.min(Math.max(progress,0),1)*100}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 8,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 12,
  },
  bar: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
});

export default ProgressBar;