import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as Progress from 'react-native-progress';
import Toast from 'react-native-toast-message';

const {width} = Dimensions.get('window');

const VideoSelectScreen = ({navigation}) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentVideos, setRecentVideos] = useState([]);
  const [videoInfo, setVideoInfo] = useState(null);

  useEffect(() => {
    loadRecentVideos();
  }, []);

  const loadRecentVideos = async () => {
    try {
      // Load recently processed videos from storage
      const videosDir = `${RNFS.DocumentDirectoryPath}/recent_videos`;
      const exists = await RNFS.exists(videosDir);
      
      if (exists) {
        const files = await RNFS.readDir(videosDir);
        const videoFiles = files.filter(file => 
          file.name.endsWith('.mp4') || 
          file.name.endsWith('.mov') || 
          file.name.endsWith('.avi')
        );
        
        setRecentVideos(videoFiles.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading recent videos:', error);
    }
  };

  const selectVideo = async () => {
    try {
      setIsLoading(true);
      
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.video],
        copyTo: 'documentDirectory',
      });

      if (result && result.length > 0) {
        const video = result[0];
        console.log('Selected video:', video);
        
        // Validate video file
        const isValid = await validateVideoFile(video);
        if (!isValid) {
          Toast.show({
            type: 'error',
            text1: 'Invalid Video',
            text2: 'Please select a valid video file',
          });
          return;
        }

        // Get video information
        const info = await getVideoInfo(video.fileCopyUri || video.uri);
        
        setSelectedVideo({
          ...video,
          path: video.fileCopyUri || video.uri,
        });
        setVideoInfo(info);
        
        Toast.show({
          type: 'success',
          text1: 'Video Selected',
          text2: `${video.name} is ready for processing`,
        });
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('User cancelled video selection');
      } else {
        console.error('Error selecting video:', error);
        Toast.show({
          type: 'error',
          text1: 'Selection Error',
          text2: 'Failed to select video file',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateVideoFile = async (video) => {
    try {
      // Check file size (limit to 500MB for demo)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (video.size > maxSize) {
        Alert.alert(
          'File Too Large',
          'Please select a video file smaller than 500MB',
          [{text: 'OK'}]
        );
        return false;
      }

      // Check file extension
      const validExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.wmv'];
      const extension = video.name.toLowerCase().substring(video.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(extension)) {
        Alert.alert(
          'Unsupported Format',
          'Please select a video file with supported format (MP4, MOV, AVI, MKV, WMV)',
          [{text: 'OK'}]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating video file:', error);
      return false;
    }
  };

  const getVideoInfo = async (videoPath) => {
    try {
      // Get file stats
      const stats = await RNFS.stat(videoPath);
      
      // Mock video info - in production, you'd use FFmpeg to get actual info
      return {
        duration: '2:30', // Mock duration
        size: formatFileSize(stats.size),
        resolution: '1920x1080', // Mock resolution
        format: 'MP4',
        bitrate: '2.5 Mbps', // Mock bitrate
        fps: '30', // Mock fps
      };
    } catch (error) {
      console.error('Error getting video info:', error);
      return null;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleProcessVideo = () => {
    if (!selectedVideo) {
      Toast.show({
        type: 'error',
        text1: 'No Video Selected',
        text2: 'Please select a video first',
      });
      return;
    }

    // Navigate to processing screen
    navigation.navigate('VideoProcessing', {
      videoPath: selectedVideo.path,
      videoName: selectedVideo.name,
      videoInfo: videoInfo,
    });
  };

  const selectRecentVideo = async (video) => {
    try {
      setIsLoading(true);
      
      const info = await getVideoInfo(video.path);
      
      setSelectedVideo({
        name: video.name,
        path: video.path,
        size: video.size,
      });
      setVideoInfo(info);
      
      Toast.show({
        type: 'success',
        text1: 'Video Selected',
        text2: `${video.name} is ready for processing`,
      });
    } catch (error) {
      console.error('Error selecting recent video:', error);
      Toast.show({
        type: 'error',
        text1: 'Selection Error',
        text2: 'Failed to select video file',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Your Video</Text>
          <Text style={styles.subtitle}>
            Choose a video file to create viral clips
          </Text>
        </View>

        {/* Main Selection Button */}
        <TouchableOpacity
          style={styles.selectButton}
          onPress={selectVideo}
          disabled={isLoading}
          activeOpacity={0.8}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E8E']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.buttonGradient}>
            {isLoading ? (
              <Progress.Circle
                size={30}
                indeterminate={true}
                color="#fff"
                borderWidth={2}
              />
            ) : (
              <Icon name="video-library" size={30} color="#fff" />
            )}
            <Text style={styles.buttonText}>
              {isLoading ? 'Loading...' : 'Browse Videos'}
            </Text>
            <Text style={styles.buttonSubtext}>
              Select from your device storage
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Selected Video Info */}
        {selectedVideo && (
          <View style={styles.selectedVideoContainer}>
            <Text style={styles.sectionTitle}>Selected Video</Text>
            <View style={styles.videoInfoCard}>
              <View style={styles.videoIcon}>
                <Icon name="movie" size={24} color="#FF6B6B" />
              </View>
              <View style={styles.videoDetails}>
                <Text style={styles.videoName} numberOfLines={1}>
                  {selectedVideo.name}
                </Text>
                <Text style={styles.videoSize}>
                  {videoInfo ? videoInfo.size : formatFileSize(selectedVideo.size)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  setSelectedVideo(null);
                  setVideoInfo(null);
                }}>
                <Icon name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Video Details */}
            {videoInfo && (
              <View style={styles.videoDetailsContainer}>
                <Text style={styles.detailsTitle}>Video Information</Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{videoInfo.duration}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Resolution</Text>
                    <Text style={styles.detailValue}>{videoInfo.resolution}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Format</Text>
                    <Text style={styles.detailValue}>{videoInfo.format}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>FPS</Text>
                    <Text style={styles.detailValue}>{videoInfo.fps}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Recent Videos */}
        {recentVideos.length > 0 && (
          <View style={styles.recentVideosContainer}>
            <Text style={styles.sectionTitle}>Recent Videos</Text>
            {recentVideos.map((video, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentVideoItem}
                onPress={() => selectRecentVideo(video)}>
                <View style={styles.recentVideoIcon}>
                  <Icon name="play-circle-filled" size={24} color="#4ECDC4" />
                </View>
                <View style={styles.recentVideoInfo}>
                  <Text style={styles.recentVideoName} numberOfLines={1}>
                    {video.name}
                  </Text>
                  <Text style={styles.recentVideoDetails}>
                    {formatFileSize(video.size)}
                  </Text>
                </View>
                <Icon name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Process Button */}
        {selectedVideo && (
          <TouchableOpacity
            style={styles.processButton}
            onPress={handleProcessVideo}
            activeOpacity={0.8}>
            <LinearGradient
              colors={['#4ECDC4', '#45B7D1']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.processButtonGradient}>
              <Icon name="auto-awesome" size={24} color="#fff" />
              <Text style={styles.processButtonText}>Process Video</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>Tips for Best Results</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Icon name="lightbulb" size={16} color="#FFA726" />
              <Text style={styles.tipText}>
                Videos with clear speech work best
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="lightbulb" size={16} color="#FFA726" />
              <Text style={styles.tipText}>
                Longer videos (5+ minutes) provide more clips
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="lightbulb" size={16} color="#FFA726" />
              <Text style={styles.tipText}>
                Good lighting and audio quality improve results
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="lightbulb" size={16} color="#FFA726" />
              <Text style={styles.tipText}>
                Educational or entertaining content clips best
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
  selectButton: {
    marginBottom: 30,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: 30,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 5,
  },
  selectedVideoContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  videoInfoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  videoIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  videoDetails: {
    flex: 1,
  },
  videoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  videoSize: {
    fontSize: 14,
    color: '#aaa',
  },
  removeButton: {
    padding: 8,
  },
  videoDetailsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  recentVideosContainer: {
    marginBottom: 30,
  },
  recentVideoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  recentVideoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  recentVideoInfo: {
    flex: 1,
  },
  recentVideoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  recentVideoDetails: {
    fontSize: 12,
    color: '#aaa',
  },
  processButton: {
    marginBottom: 30,
    borderRadius: 15,
    elevation: 6,
    shadowColor: '#4ECDC4',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  processButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processButtonText: {
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

export default VideoSelectScreen;