import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  BackHandler,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as Progress from 'react-native-progress';
import videoProcessingService from '../services/VideoProcessingService';
import Toast from 'react-native-toast-message';

const {width, height} = Dimensions.get('window');

const VideoProcessingScreen = ({navigation, route}) => {
  const {videoPath, videoName, videoInfo} = route.params;
  
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Starting analysis...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState(null);
  const [error, setError] = useState(null);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startProcessing();
    setupAnimations();
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
      videoProcessingService.cancelProcessing();
    };
  }, []);

  const setupAnimations = () => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotate animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Scale animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startProcessing = async () => {
    try {
      setIsProcessing(true);
      setStartTime(Date.now());
      
      // Set up progress callback
      videoProcessingService.setProgressCallback((progress, status) => {
        setProgress(progress);
        setCurrentStep(status);
        
        // Calculate estimated time left
        if (progress > 0) {
          const elapsed = Date.now() - startTime;
          const totalEstimated = (elapsed / progress) * 100;
          const timeLeft = totalEstimated - elapsed;
          setEstimatedTimeLeft(Math.max(0, timeLeft));
        }
      });

      // Start processing
      const result = await videoProcessingService.analyzeVideoForBestClips(videoPath, {
        maxClips: 5,
        minClipDuration: 15,
        maxClipDuration: 60,
      });

      setProcessingResult(result);
      setIsProcessing(false);
      
      Toast.show({
        type: 'success',
        text1: 'Processing Complete!',
        text2: `Generated ${result.clips.length} viral clips`,
      });

      // Navigate to preview screen after a short delay
      setTimeout(() => {
        navigation.replace('ClipPreview', {
          clips: result.clips,
          originalVideo: result.originalVideo,
          analysis: result.analysis,
        });
      }, 1500);

    } catch (error) {
      console.error('Processing error:', error);
      setError(error.message);
      setIsProcessing(false);
      
      Toast.show({
        type: 'error',
        text1: 'Processing Failed',
        text2: error.message,
      });
    }
  };

  const handleBackPress = () => {
    if (isProcessing) {
      Alert.alert(
        'Cancel Processing?',
        'Are you sure you want to cancel the video processing?',
        [
          {text: 'No', style: 'cancel'},
          {
            text: 'Yes',
            style: 'destructive',
            onPress: () => {
              videoProcessingService.cancelProcessing();
              navigation.goBack();
            },
          },
        ]
      );
      return true;
    }
    return false;
  };

  const handleCancel = () => {
    handleBackPress();
  };

  const handleRetry = () => {
    setError(null);
    setProgress(0);
    setCurrentStep('Starting analysis...');
    startProcessing();
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getStepIcon = (step) => {
    if (step.includes('Starting')) return 'play-arrow';
    if (step.includes('Extracting video')) return 'info';
    if (step.includes('Extracting audio')) return 'audiotrack';
    if (step.includes('Transcribing')) return 'record-voice-over';
    if (step.includes('Detecting scene')) return 'auto-awesome';
    if (step.includes('Analyzing silence')) return 'volume-off';
    if (step.includes('Analyzing audio')) return 'volume-up';
    if (step.includes('Finding highlight')) return 'star';
    if (step.includes('Generating')) return 'movie-creation';
    if (step.includes('Creating thumbnails')) return 'image';
    if (step.includes('complete')) return 'check-circle';
    return 'settings';
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error" size={80} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Processing Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E8E']}
                style={styles.retryButtonGradient}>
                <Icon name="refresh" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>Retry</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Processing Video</Text>
        <Text style={styles.subtitle}>{videoName}</Text>
      </View>

      <View style={styles.progressContainer}>
        {/* Main Progress Circle */}
        <View style={styles.progressCircleContainer}>
          <Animated.View
            style={[
              styles.progressCircle,
              {
                transform: [
                  {scale: pulseAnim},
                  {rotate: spin},
                ],
              },
            ]}>
            <Progress.Circle
              size={150}
              progress={progress / 100}
              color="#4ECDC4"
              unfilledColor="#333"
              borderWidth={0}
              thickness={8}
              showsText={false}
            />
            <View style={styles.progressCenter}>
              <Animated.View style={{transform: [{scale: scaleAnim}]}}>
                <Icon 
                  name={getStepIcon(currentStep)} 
                  size={40} 
                  color="#4ECDC4" 
                />
              </Animated.View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          </Animated.View>
        </View>

        {/* Current Step */}
        <View style={styles.stepContainer}>
          <Text style={styles.stepText}>{currentStep}</Text>
          {estimatedTimeLeft && (
            <Text style={styles.timeText}>
              Estimated time left: {formatTime(estimatedTimeLeft)}
            </Text>
          )}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <Progress.Bar
            progress={progress / 100}
            width={width - 40}
            height={8}
            color="#4ECDC4"
            unfilledColor="#333"
            borderWidth={0}
            borderRadius={4}
          />
        </View>

        {/* Processing Steps */}
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>Processing Steps</Text>
          <View style={styles.stepsList}>
            {[
              'Extract video information',
              'Extract audio track',
              'Transcribe speech',
              'Detect scene changes',
              'Analyze silence patterns',
              'Analyze audio levels',
              'Find highlight moments',
              'Generate optimized clips',
              'Create thumbnails',
            ].map((step, index) => {
              const stepProgress = (progress / 100) * 9;
              const isCompleted = stepProgress > index;
              const isActive = Math.floor(stepProgress) === index;
              
              return (
                <View key={index} style={styles.stepItem}>
                  <View style={[
                    styles.stepIndicator,
                    isCompleted && styles.stepCompleted,
                    isActive && styles.stepActive,
                  ]}>
                    <Text style={[
                      styles.stepNumber,
                      (isCompleted || isActive) && styles.stepNumberActive,
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={[
                    styles.stepLabel,
                    (isCompleted || isActive) && styles.stepLabelActive,
                  ]}>
                    {step}
                  </Text>
                  {isCompleted && (
                    <Icon name="check" size={16} color="#4ECDC4" />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Cancel Button */}
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
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
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  progressCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  progressCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  stepContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  timeText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  progressBarContainer: {
    marginBottom: 30,
  },
  stepsContainer: {
    width: '100%',
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  stepsList: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepCompleted: {
    backgroundColor: '#4ECDC4',
  },
  stepActive: {
    backgroundColor: '#FF6B6B',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  stepLabelActive: {
    color: '#fff',
  },
  cancelButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 20,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 30,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  retryButton: {
    flex: 1,
    marginRight: 10,
    borderRadius: 15,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
});

export default VideoProcessingScreen;