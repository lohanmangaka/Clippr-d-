import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';

const {width, height} = Dimensions.get('window');

const HomeScreen = ({navigation}) => {
  const [recentClips, setRecentClips] = useState([]);
  const [appStats, setAppStats] = useState({
    totalClips: 0,
    totalVideosProcessed: 0,
  });

  useEffect(() => {
    loadRecentClips();
    loadAppStats();
  }, []);

  const loadRecentClips = async () => {
    try {
      const clipsDir = `${RNFS.DocumentDirectoryPath}/clips`;
      const exists = await RNFS.exists(clipsDir);
      
      if (exists) {
        const files = await RNFS.readDir(clipsDir);
        const clipFiles = files.filter(file => file.name.endsWith('.mp4'));
        
        // Get recent clips (last 5)
        const recent = clipFiles
          .sort((a, b) => new Date(b.mtime) - new Date(a.mtime))
          .slice(0, 5);
        
        setRecentClips(recent);
      }
    } catch (error) {
      console.error('Error loading recent clips:', error);
    }
  };

  const loadAppStats = async () => {
    try {
      const clipsDir = `${RNFS.DocumentDirectoryPath}/clips`;
      const exists = await RNFS.exists(clipsDir);
      
      if (exists) {
        const files = await RNFS.readDir(clipsDir);
        const clipFiles = files.filter(file => file.name.endsWith('.mp4'));
        
        setAppStats({
          totalClips: clipFiles.length,
          totalVideosProcessed: Math.ceil(clipFiles.length / 3), // Estimate
        });
      }
    } catch (error) {
      console.error('Error loading app stats:', error);
    }
  };

  const handleStartClipping = () => {
    navigation.navigate('VideoSelect');
  };

  const handleViewClip = (clipPath) => {
    navigation.navigate('ClipPreview', {clipPath});
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <LinearGradient
        colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.appTitle}>ViralityClipprx</Text>
          <Text style={styles.appSubtitle}>
            Intelligent Video Clipping • Fully Offline
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Icon name="video-library" size={40} color="#fff" />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Action Button */}
        <TouchableOpacity
          style={styles.mainActionButton}
          onPress={handleStartClipping}
          activeOpacity={0.8}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E8E']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.buttonGradient}>
            <Icon name="video-call" size={30} color="#fff" />
            <Text style={styles.buttonText}>Start Clipping</Text>
            <Text style={styles.buttonSubtext}>
              Select a video to create viral clips
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="movie" size={24} color="#4ECDC4" />
            <Text style={styles.statNumber}>{appStats.totalClips}</Text>
            <Text style={styles.statLabel}>Total Clips</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="video-library" size={24} color="#45B7D1" />
            <Text style={styles.statNumber}>{appStats.totalVideosProcessed}</Text>
            <Text style={styles.statLabel}>Videos Processed</Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Icon name="offline-bolt" size={20} color="#4ECDC4" />
              <Text style={styles.featureText}>100% Offline Processing</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="smart-toy" size={20} color="#FF6B6B" />
              <Text style={styles.featureText}>AI-Powered Highlight Detection</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="aspect-ratio" size={20} color="#45B7D1" />
              <Text style={styles.featureText}>TikTok-Style 9:16 Format</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="record-voice-over" size={20} color="#FFA726" />
              <Text style={styles.featureText}>Speech-to-Text Analysis</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="auto-awesome" size={20} color="#AB47BC" />
              <Text style={styles.featureText}>Scene Change Detection</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="volume-up" size={20} color="#66BB6A" />
              <Text style={styles.featureText}>Audio Level Analysis</Text>
            </View>
          </View>
        </View>

        {/* Recent Clips */}
        {recentClips.length > 0 && (
          <View style={styles.recentClipsContainer}>
            <Text style={styles.sectionTitle}>Recent Clips</Text>
            {recentClips.map((clip, index) => (
              <TouchableOpacity
                key={index}
                style={styles.clipItem}
                onPress={() => handleViewClip(clip.path)}>
                <View style={styles.clipThumbnail}>
                  <Icon name="play-circle-filled" size={24} color="#FF6B6B" />
                </View>
                <View style={styles.clipInfo}>
                  <Text style={styles.clipName} numberOfLines={1}>
                    {clip.name}
                  </Text>
                  <Text style={styles.clipDetails}>
                    {formatFileSize(clip.size)} • {formatDate(clip.mtime)}
                  </Text>
                </View>
                <Icon name="chevron-right" size={24} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* How It Works */}
        <View style={styles.howItWorksContainer}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Select your video file</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>AI analyzes speech and scenes</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Get viral-ready clips automatically</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>Preview, edit, and export</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flex: 1,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  headerIcon: {
    marginLeft: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mainActionButton: {
    marginTop: 30,
    marginBottom: 30,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: 25,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 20,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 5,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  featuresList: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 15,
  },
  recentClipsContainer: {
    marginBottom: 30,
  },
  clipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  clipThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  clipInfo: {
    flex: 1,
  },
  clipName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  clipDetails: {
    fontSize: 12,
    color: '#aaa',
  },
  howItWorksContainer: {
    marginBottom: 30,
  },
  stepsList: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepText: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
});

export default HomeScreen;