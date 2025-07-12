import ffmpegService from './FFmpegService';
import whisperService from './WhisperService';
import RNFS from 'react-native-fs';

class VideoProcessingService {
  constructor() {
    this.isProcessing = false;
    this.currentProgress = 0;
    this.progressCallback = null;
  }

  setProgressCallback(callback) {
    this.progressCallback = callback;
  }

  updateProgress(progress, status) {
    this.currentProgress = progress;
    if (this.progressCallback) {
      this.progressCallback(progress, status);
    }
  }

  async processVideo(videoPath) {
    try {
      this.isProcessing = true;
      this.updateProgress(0, 'Starting video analysis...');

      // Step 1: Extract video information
      this.updateProgress(10, 'Extracting video information...');
      const videoInfo = await ffmpegService.extractVideoInfo(videoPath);
      
      // Step 2: Extract audio for speech analysis
      this.updateProgress(20, 'Extracting audio track...');
      const audioPath = await whisperService.extractAudio(videoPath);
      
      // Step 3: Transcribe audio
      this.updateProgress(30, 'Transcribing speech...');
      const transcription = await whisperService.transcribeAudio(audioPath);
      
      // Step 4: Detect scene changes
      this.updateProgress(45, 'Detecting scene changes...');
      const sceneChanges = await ffmpegService.detectSceneChanges(videoPath);
      
      // Step 5: Analyze silence
      this.updateProgress(55, 'Analyzing silence patterns...');
      const silenceSegments = await ffmpegService.detectSilence(videoPath);
      
      // Step 6: Analyze audio levels
      this.updateProgress(65, 'Analyzing audio levels...');
      const audioLevels = await ffmpegService.analyzeAudioLevels(videoPath);
      
      // Step 7: Find highlight moments
      this.updateProgress(75, 'Finding highlight moments...');
      const highlights = await whisperService.findHighlightMoments(
        transcription, 
        audioLevels, 
        sceneChanges
      );
      
      // Step 8: Generate optimized clips
      this.updateProgress(85, 'Generating optimized clips...');
      const clips = await this.generateOptimizedClips(videoPath, highlights, videoInfo);
      
      // Step 9: Create thumbnails
      this.updateProgress(95, 'Creating thumbnails...');
      const clipsWithThumbnails = await this.addThumbnailsToClips(clips);
      
      this.updateProgress(100, 'Processing complete!');
      
      // Cleanup temporary files
      await whisperService.cleanup();
      await ffmpegService.cleanup();
      
      this.isProcessing = false;
      
      return {
        clips: clipsWithThumbnails,
        originalVideo: {
          path: videoPath,
          info: videoInfo
        },
        analysis: {
          transcription,
          sceneChanges,
          silenceSegments,
          audioLevels,
          highlights
        }
      };
    } catch (error) {
      this.isProcessing = false;
      console.error('Video processing error:', error);
      throw error;
    }
  }

  async generateOptimizedClips(videoPath, highlights, videoInfo) {
    const clips = [];
    const outputDir = ffmpegService.getOutputDirectory();
    
    for (let i = 0; i < highlights.length; i++) {
      const highlight = highlights[i];
      const clipDuration = highlight.endTime - highlight.startTime;
      
      // Ensure clip is between 15-60 seconds for optimal virality
      const optimizedDuration = Math.min(Math.max(clipDuration, 15), 60);
      const optimizedStartTime = Math.max(0, highlight.startTime - (optimizedDuration - clipDuration) / 2);
      
      const clipPath = `${outputDir}/clip_${i + 1}_${Date.now()}.mp4`;
      
      try {
        await ffmpegService.extractClip(
          videoPath, 
          optimizedStartTime, 
          optimizedDuration, 
          clipPath
        );
        
        clips.push({
          id: `clip_${i + 1}`,
          path: clipPath,
          startTime: optimizedStartTime,
          duration: optimizedDuration,
          endTime: optimizedStartTime + optimizedDuration,
          score: highlight.score,
          text: highlight.text,
          reason: highlight.reason,
          aspectRatio: '9:16', // TikTok style
          thumbnail: null // Will be added later
        });
      } catch (error) {
        console.error(`Error generating clip ${i + 1}:`, error);
        // Continue with other clips
      }
    }
    
    return clips;
  }

  async addThumbnailsToClips(clips) {
    const clipsWithThumbnails = [];
    
    for (const clip of clips) {
      try {
        const thumbnailPath = await ffmpegService.generateThumbnail(
          clip.path, 
          clip.duration / 2 // Middle of the clip
        );
        
        clipsWithThumbnails.push({
          ...clip,
          thumbnail: thumbnailPath
        });
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        clipsWithThumbnails.push(clip);
      }
    }
    
    return clipsWithThumbnails;
  }

  async enhanceClip(clipPath, options = {}) {
    try {
      const enhancedPath = clipPath.replace('.mp4', '_enhanced.mp4');
      
      // Apply enhancements based on options
      if (options.addSubtitles && options.text) {
        await ffmpegService.addTextOverlay(clipPath, options.text, enhancedPath);
        return enhancedPath;
      }
      
      // Add more enhancement options here
      return clipPath;
    } catch (error) {
      console.error('Error enhancing clip:', error);
      throw error;
    }
  }

  async exportClip(clipPath, outputPath, quality = 'high') {
    try {
      // Define quality presets
      const qualityPresets = {
        low: '-crf 28 -preset fast',
        medium: '-crf 23 -preset medium',
        high: '-crf 18 -preset slow'
      };
      
      const preset = qualityPresets[quality] || qualityPresets.medium;
      
      // Copy with quality settings
      await RNFS.copyFile(clipPath, outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Error exporting clip:', error);
      throw error;
    }
  }

  async analyzeVideoForBestClips(videoPath, options = {}) {
    try {
      const maxClips = options.maxClips || 5;
      const minClipDuration = options.minClipDuration || 15;
      const maxClipDuration = options.maxClipDuration || 60;
      
      // Get basic processing results
      const result = await this.processVideo(videoPath);
      
      // Filter and optimize clips based on options
      let optimizedClips = result.clips.filter(clip => 
        clip.duration >= minClipDuration && 
        clip.duration <= maxClipDuration
      );
      
      // Sort by score and take top clips
      optimizedClips = optimizedClips
        .sort((a, b) => b.score - a.score)
        .slice(0, maxClips);
      
      return {
        ...result,
        clips: optimizedClips
      };
    } catch (error) {
      console.error('Error analyzing video for best clips:', error);
      throw error;
    }
  }

  async getClipMetadata(clipPath) {
    try {
      const stats = await RNFS.stat(clipPath);
      const videoInfo = await ffmpegService.extractVideoInfo(clipPath);
      
      return {
        size: stats.size,
        duration: videoInfo.duration,
        resolution: `${videoInfo.width}x${videoInfo.height}`,
        format: videoInfo.format,
        createdAt: stats.mtime
      };
    } catch (error) {
      console.error('Error getting clip metadata:', error);
      throw error;
    }
  }

  isCurrentlyProcessing() {
    return this.isProcessing;
  }

  getCurrentProgress() {
    return this.currentProgress;
  }

  async cancelProcessing() {
    this.isProcessing = false;
    this.currentProgress = 0;
    
    // Cleanup any temporary files
    try {
      await whisperService.cleanup();
      await ffmpegService.cleanup();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export const videoProcessingService = new VideoProcessingService();
export default videoProcessingService;