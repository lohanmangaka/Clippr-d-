import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  Modal,
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Slider from '@react-native-community/slider';
import Toast from 'react-native-toast-message';

const {width, height} = Dimensions.get('window');

const ClipPreviewScreen = ({navigation, route}) => {
  const {clips, originalVideo, analysis} = route.params;
  
  const [selectedClip, setSelectedClip] = useState(clips[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [showDetails, setShowDetails] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  const videoRef = useRef(null);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value) => {
    videoRef.current?.seek(value);
    setCurrentTime(value);
  };

  const handleClipSelect = (clip) => {
    setSelectedClip(clip);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleExport = (clip) => {
    navigation.navigate('Export', {
      selectedClips: [clip],
      allClips: clips,
      originalVideo,
      analysis,
    });
  };

  const handleExportAll = () => {
    navigation.navigate('Export', {
      selectedClips: clips,
      allClips: clips,
      originalVideo,
      analysis,
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score) => {
    if (score > 0.8) return '#4ECDC4';
    if (score > 0.6) return '#FFA726';
    return '#FF6B6B';
  };

  const getScoreLabel = (score) => {
    if (score > 0.8) return 'Excellent';
    if (score > 0.6) return 'Good';
    return 'Fair';
  };

  const renderClipCard = (clip, index) => {
    const isSelected = selectedClip?.id === clip.id;
    
    return (
      <TouchableOpacity
        key={clip.id}
        style={[styles.clipCard, isSelected && styles.selectedClipCard]}
        onPress={() => handleClipSelect(clip)}
        activeOpacity={0.8}>
        <View style={styles.clipThumbnail}>
          {clip.thumbnail ? (
            <Image source={{uri: clip.thumbnail}} style={styles.thumbnailImage} />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Icon name="movie" size={24} color="#666" />
            </View>
          )}
          <View style={styles.clipDuration}>
            <Text style={styles.durationText}>{formatTime(clip.duration)}</Text>
          </View>
        </View>
        
        <View style={styles.clipInfo}>
          <Text style={styles.clipTitle} numberOfLines={2}>
            {clip.text || `Clip ${index + 1}`}
          </Text>
          <Text style={styles.clipReason}>{clip.reason}</Text>
          
          <View style={styles.clipMetrics}>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={[styles.scoreValue, {color: getScoreColor(clip.score)}]}>
                {(clip.score * 100).toFixed(0)}%
              </Text>
            </View>
            
            <View style={styles.timeContainer}>
              <Text style={styles.timeLabel}>Time</Text>
              <Text style={styles.timeValue}>
                {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => handleExport(clip)}>
          <Icon name="file-download" size={20} color="#4ECDC4" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const VideoModal = () => (
    <Modal
      visible={showVideoModal}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={() => setShowVideoModal(false)}>
      <View style={styles.videoModalContainer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowVideoModal(false)}>
          <Icon name="close" size={30} color="#fff" />
        </TouchableOpacity>
        
        <Video
          ref={videoRef}
          source={{uri: selectedClip.path}}
          style={styles.fullscreenVideo}
          resizeMode="contain"
          paused={!isPlaying}
          volume={volume}
          onLoad={(data) => setDuration(data.duration)}
          onProgress={(data) => setCurrentTime(data.currentTime)}
          onEnd={() => setIsPlaying(false)}
        />
        
        <View style={styles.videoControls}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}>
            <Icon 
              name={isPlaying ? 'pause' : 'play-arrow'} 
              size={30} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.volumeButton}
            onPress={() => setVolume(volume > 0 ? 0 : 1)}>
            <Icon 
              name={volume > 0 ? 'volume-up' : 'volume-off'} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.seekBarContainer}>
          <Slider
            style={styles.seekBar}
            minimumValue={0}
            maximumValue={duration}
            value={currentTime}
            onValueChange={handleSeek}
            minimumTrackTintColor="#4ECDC4"
            maximumTrackTintColor="#333"
            thumbStyle={styles.sliderThumb}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Generated Clips</Text>
          <Text style={styles.subtitle}>
            {clips.length} viral clips ready for export
          </Text>
        </View>

        {/* Selected Clip Preview */}
        <View style={styles.previewContainer}>
          <TouchableOpacity
            style={styles.videoContainer}
            onPress={() => setShowVideoModal(true)}
            activeOpacity={0.8}>
            <Video
              ref={videoRef}
              source={{uri: selectedClip.path}}
              style={styles.previewVideo}
              resizeMode="cover"
              paused={!isPlaying}
              volume={volume}
              onLoad={(data) => setDuration(data.duration)}
              onProgress={(data) => setCurrentTime(data.currentTime)}
              onEnd={() => setIsPlaying(false)}
            />
            
            <View style={styles.videoOverlay}>
              <TouchableOpacity
                style={styles.playOverlay}
                onPress={handlePlayPause}>
                <Icon 
                  name={isPlaying ? 'pause' : 'play-arrow'} 
                  size={50} 
                  color="#fff" 
                />
              </TouchableOpacity>
              
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle} numberOfLines={2}>
                  {selectedClip.text || `Clip ${clips.indexOf(selectedClip) + 1}`}
                </Text>
                <Text style={styles.videoScore}>
                  {getScoreLabel(selectedClip.score)} • {(selectedClip.score * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.fullscreenButton}
            onPress={() => setShowVideoModal(true)}>
            <Icon name="fullscreen" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Clip Details */}
        <View style={styles.detailsContainer}>
          <TouchableOpacity
            style={styles.detailsToggle}
            onPress={() => setShowDetails(!showDetails)}>
            <Text style={styles.detailsTitle}>Clip Details</Text>
            <Icon 
              name={showDetails ? 'expand-less' : 'expand-more'} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          {showDetails && (
            <View style={styles.detailsContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>{formatTime(selectedClip.duration)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Original Time:</Text>
                <Text style={styles.detailValue}>
                  {formatTime(selectedClip.startTime)} - {formatTime(selectedClip.endTime)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Aspect Ratio:</Text>
                <Text style={styles.detailValue}>{selectedClip.aspectRatio}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reason:</Text>
                <Text style={styles.detailValue}>{selectedClip.reason}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Engagement Score:</Text>
                <Text style={[styles.detailValue, {color: getScoreColor(selectedClip.score)}]}>
                  {(selectedClip.score * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* All Clips List */}
        <View style={styles.clipsContainer}>
          <Text style={styles.sectionTitle}>All Clips</Text>
          {clips.map((clip, index) => renderClipCard(clip, index))}
        </View>

        {/* Export Actions */}
        <View style={styles.exportContainer}>
          <TouchableOpacity
            style={styles.exportCurrentButton}
            onPress={() => handleExport(selectedClip)}
            activeOpacity={0.8}>
            <LinearGradient
              colors={['#4ECDC4', '#45B7D1']}
              style={styles.exportButtonGradient}>
              <Icon name="file-download" size={20} color="#fff" />
              <Text style={styles.exportButtonText}>Export Current Clip</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.exportAllButton}
            onPress={handleExportAll}
            activeOpacity={0.8}>
            <LinearGradient
              colors={['#FF6B6B', '#FF8E8E']}
              style={styles.exportButtonGradient}>
              <Icon name="library-add" size={20} color="#fff" />
              <Text style={styles.exportButtonText}>Export All Clips</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Analysis Summary */}
        <View style={styles.analysisContainer}>
          <Text style={styles.sectionTitle}>Analysis Summary</Text>
          <View style={styles.analysisSummary}>
            <View style={styles.summaryItem}>
              <Icon name="record-voice-over" size={20} color="#4ECDC4" />
              <Text style={styles.summaryLabel}>Speech Analysis</Text>
              <Text style={styles.summaryValue}>
                {analysis.transcription?.segments?.length || 0} segments
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="auto-awesome" size={20} color="#FF6B6B" />
              <Text style={styles.summaryLabel}>Scene Changes</Text>
              <Text style={styles.summaryValue}>
                {analysis.sceneChanges?.length || 0} detected
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="volume-up" size={20} color="#FFA726" />
              <Text style={styles.summaryLabel}>Audio Levels</Text>
              <Text style={styles.summaryValue}>
                {analysis.audioLevels?.length || 0} points
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <VideoModal />
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
  previewContainer: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  videoContainer: {
    width: '100%',
    height: 400,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 35,
    padding: 15,
  },
  videoInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  videoScore: {
    fontSize: 14,
    color: '#4ECDC4',
  },
  fullscreenButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  detailsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    marginBottom: 20,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  clipsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  clipCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedClipCard: {
    borderColor: '#4ECDC4',
    borderWidth: 2,
  },
  clipThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#333',
    marginRight: 15,
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  clipDuration: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  durationText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  clipInfo: {
    flex: 1,
    marginRight: 10,
  },
  clipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  clipReason: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 10,
  },
  clipMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#aaa',
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeContainer: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 10,
    color: '#aaa',
  },
  timeValue: {
    fontSize: 12,
    color: '#fff',
  },
  exportButton: {
    padding: 10,
  },
  exportContainer: {
    marginBottom: 20,
  },
  exportCurrentButton: {
    borderRadius: 15,
    marginBottom: 10,
  },
  exportAllButton: {
    borderRadius: 15,
  },
  exportButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  analysisContainer: {
    marginBottom: 30,
  },
  analysisSummary: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 12,
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '600',
  },
  videoModalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
  },
  fullscreenVideo: {
    width: width,
    height: height * 0.7,
  },
  videoControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  playButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 10,
  },
  timeInfo: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  timeText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  volumeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  seekBarContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
  seekBar: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#4ECDC4',
    width: 20,
    height: 20,
  },
});

export default ClipPreviewScreen;