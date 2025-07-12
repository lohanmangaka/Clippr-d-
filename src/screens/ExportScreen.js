import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  Dimensions,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as Progress from 'react-native-progress';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import Toast from 'react-native-toast-message';
import videoProcessingService from '../services/VideoProcessingService';

const {width} = Dimensions.get('window');

const ExportScreen = ({navigation, route}) => {
  const {selectedClips, allClips, originalVideo, analysis} = route.params;
  
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedClips, setExportedClips] = useState([]);
  const [currentExportIndex, setCurrentExportIndex] = useState(0);
  const [exportQuality, setExportQuality] = useState('high');
  const [exportFormat, setExportFormat] = useState('mp4');
  const [addWatermark, setAddWatermark] = useState(false);
  const [addSubtitles, setAddSubtitles] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);
        
        if (granted['android.permission.WRITE_EXTERNAL_STORAGE'] !== PermissionsAndroid.RESULTS.GRANTED) {
          Toast.show({
            type: 'error',
            text1: 'Permission Required',
            text2: 'Storage permission is required to export clips',
          });
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportedClips([]);
      setCurrentExportIndex(0);

      const exportedPaths = [];
      
      for (let i = 0; i < selectedClips.length; i++) {
        const clip = selectedClips[i];
        setCurrentExportIndex(i);
        
        const exportPath = await exportClip(clip, i);
        if (exportPath) {
          exportedPaths.push(exportPath);
          setExportedClips(prev => [...prev, {
            ...clip,
            exportPath,
            exported: true
          }]);
        }
        
        setExportProgress((i + 1) / selectedClips.length * 100);
      }

      setIsExporting(false);
      
      Toast.show({
        type: 'success',
        text1: 'Export Complete!',
        text2: `${exportedPaths.length} clips exported successfully`,
      });

      // Show export success dialog
      showExportSuccessDialog(exportedPaths);
      
    } catch (error) {
      setIsExporting(false);
      console.error('Export error:', error);
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: error.message,
      });
    }
  };

  const exportClip = async (clip, index) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `ViralityClip_${index + 1}_${timestamp}.${exportFormat}`;
      
      let exportPath;
      if (Platform.OS === 'android') {
        exportPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      } else {
        exportPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      }

      // Copy the clip to the export location
      await RNFS.copyFile(clip.path, exportPath);
      
      // Apply enhancements if selected
      if (addSubtitles && clip.text) {
        const enhancedPath = await videoProcessingService.enhanceClip(exportPath, {
          addSubtitles: true,
          text: clip.text
        });
        exportPath = enhancedPath;
      }

      return exportPath;
    } catch (error) {
      console.error('Error exporting clip:', error);
      return null;
    }
  };

  const showExportSuccessDialog = (exportedPaths) => {
    Alert.alert(
      'Export Complete',
      `${exportedPaths.length} clips have been exported successfully!`,
      [
        {
          text: 'Share',
          onPress: () => shareClips(exportedPaths),
        },
        {
          text: 'View Files',
          onPress: () => showExportedFiles(exportedPaths),
        },
        {
          text: 'Done',
          style: 'default',
        },
      ]
    );
  };

  const shareClips = async (exportedPaths) => {
    try {
      if (exportedPaths.length === 1) {
        await Share.open({
          url: `file://${exportedPaths[0]}`,
          type: 'video/mp4',
          title: 'Share Viral Clip',
        });
      } else {
        await Share.open({
          urls: exportedPaths.map(path => `file://${path}`),
          type: 'video/mp4',
          title: 'Share Viral Clips',
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      Toast.show({
        type: 'error',
        text1: 'Share Failed',
        text2: 'Could not share the clips',
      });
    }
  };

  const showExportedFiles = (exportedPaths) => {
    Alert.alert(
      'Exported Files',
      `Files saved to:\n${exportedPaths.map(path => path.split('/').pop()).join('\n')}`,
      [{text: 'OK'}]
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEstimatedSize = () => {
    const avgSizePerSecond = 1024 * 1024; // 1MB per second (rough estimate)
    const totalDuration = selectedClips.reduce((sum, clip) => sum + clip.duration, 0);
    return formatFileSize(totalDuration * avgSizePerSecond);
  };

  const renderClipItem = ({item, index}) => {
    const isExported = exportedClips.find(c => c.id === item.id);
    
    return (
      <View style={styles.clipItem}>
        <View style={styles.clipIcon}>
          {isExported ? (
            <Icon name="check-circle" size={24} color="#4ECDC4" />
          ) : (
            <Icon name="movie" size={24} color="#666" />
          )}
        </View>
        
        <View style={styles.clipInfo}>
          <Text style={styles.clipTitle} numberOfLines={1}>
            {item.text || `Clip ${index + 1}`}
          </Text>
          <Text style={styles.clipDetails}>
            Duration: {Math.round(item.duration)}s • Score: {Math.round(item.score * 100)}%
          </Text>
        </View>
        
        <View style={styles.clipStatus}>
          {isExported ? (
            <Text style={styles.statusText}>Exported</Text>
          ) : currentExportIndex === index && isExporting ? (
            <Text style={styles.statusText}>Exporting...</Text>
          ) : (
            <Text style={styles.statusText}>Pending</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Export Clips</Text>
          <Text style={styles.subtitle}>
            {selectedClips.length} clips ready for export
          </Text>
        </View>

        {/* Export Settings */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Export Settings</Text>
          
          {/* Quality Selection */}
          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>Quality</Text>
            <View style={styles.optionsRow}>
              {['low', 'medium', 'high'].map(quality => (
                <TouchableOpacity
                  key={quality}
                  style={[
                    styles.optionButton,
                    exportQuality === quality && styles.selectedOption
                  ]}
                  onPress={() => setExportQuality(quality)}>
                  <Text style={[
                    styles.optionText,
                    exportQuality === quality && styles.selectedOptionText
                  ]}>
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Format Selection */}
          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>Format</Text>
            <View style={styles.optionsRow}>
              {['mp4', 'mov'].map(format => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.optionButton,
                    exportFormat === format && styles.selectedOption
                  ]}
                  onPress={() => setExportFormat(format)}>
                  <Text style={[
                    styles.optionText,
                    exportFormat === format && styles.selectedOptionText
                  ]}>
                    {format.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Enhancement Options */}
          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>Enhancements</Text>
            
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAddSubtitles(!addSubtitles)}>
              <Icon 
                name={addSubtitles ? 'check-box' : 'check-box-outline-blank'} 
                size={24} 
                color={addSubtitles ? '#4ECDC4' : '#666'} 
              />
              <Text style={styles.checkboxLabel}>Add Subtitles</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAddWatermark(!addWatermark)}>
              <Icon 
                name={addWatermark ? 'check-box' : 'check-box-outline-blank'} 
                size={24} 
                color={addWatermark ? '#4ECDC4' : '#666'} 
              />
              <Text style={styles.checkboxLabel}>Add Watermark</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Export Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Export Summary</Text>
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Clips:</Text>
              <Text style={styles.summaryValue}>{selectedClips.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Duration:</Text>
              <Text style={styles.summaryValue}>
                {Math.round(selectedClips.reduce((sum, clip) => sum + clip.duration, 0))}s
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Size:</Text>
              <Text style={styles.summaryValue}>{getEstimatedSize()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Export Location:</Text>
              <Text style={styles.summaryValue}>
                {Platform.OS === 'android' ? 'Downloads' : 'Documents'}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress */}
        {isExporting && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressTitle}>
              Exporting... ({currentExportIndex + 1}/{selectedClips.length})
            </Text>
            <Progress.Bar
              progress={exportProgress / 100}
              width={width - 40}
              height={8}
              color="#4ECDC4"
              unfilledColor="#333"
              borderWidth={0}
              borderRadius={4}
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {Math.round(exportProgress)}% complete
            </Text>
          </View>
        )}

        {/* Clips List */}
        <View style={styles.clipsContainer}>
          <Text style={styles.sectionTitle}>Clips to Export</Text>
          <FlatList
            data={selectedClips}
            renderItem={renderClipItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={[styles.exportButton, isExporting && styles.disabledButton]}
          onPress={handleExport}
          disabled={isExporting}
          activeOpacity={0.8}>
          <LinearGradient
            colors={isExporting ? ['#666', '#666'] : ['#4ECDC4', '#45B7D1']}
            style={styles.exportButtonGradient}>
            {isExporting ? (
              <Progress.Circle
                size={24}
                indeterminate={true}
                color="#fff"
                borderWidth={2}
              />
            ) : (
              <Icon name="file-download" size={24} color="#fff" />
            )}
            <Text style={styles.exportButtonText}>
              {isExporting ? 'Exporting...' : 'Start Export'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Export Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>Export Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Icon name="info" size={16} color="#4ECDC4" />
              <Text style={styles.tipText}>
                Clips are exported in TikTok-ready 9:16 format
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="folder" size={16} color="#4ECDC4" />
              <Text style={styles.tipText}>
                Files are saved to your {Platform.OS === 'android' ? 'Downloads' : 'Documents'} folder
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="share" size={16} color="#4ECDC4" />
              <Text style={styles.tipText}>
                You can share clips directly after export
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="high-quality" size={16} color="#4ECDC4" />
              <Text style={styles.tipText}>
                Higher quality exports take longer but look better
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
  },
  settingsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  settingGroup: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#4ECDC4',
  },
  optionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  selectedOptionText: {
    color: '#000',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 10,
  },
  summaryContainer: {
    marginBottom: 20,
  },
  summaryContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  summaryValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  progressBar: {
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#aaa',
  },
  clipsContainer: {
    marginBottom: 20,
  },
  clipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
  },
  clipIcon: {
    marginRight: 15,
  },
  clipInfo: {
    flex: 1,
  },
  clipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  clipDetails: {
    fontSize: 12,
    color: '#aaa',
  },
  clipStatus: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  separator: {
    height: 10,
  },
  exportButton: {
    borderRadius: 15,
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#4ECDC4',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  disabledButton: {
    elevation: 0,
    shadowOpacity: 0,
  },
  exportButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 15,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  tipsContainer: {
    marginBottom: 30,
  },
  tipsList: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 12,
    flex: 1,
  },
});

export default ExportScreen;