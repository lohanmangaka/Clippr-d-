import {RNFFmpeg, RNFFmpegConfig} from 'react-native-ffmpeg';
import RNFS from 'react-native-fs';

class FFmpegService {
  constructor() {
    this.isInitialized = false;
    this.outputDir = `${RNFS.DocumentDirectoryPath}/clips`;
  }

  async initialize() {
    try {
      // Create output directory
      await RNFS.mkdir(this.outputDir);
      
      // Enable logging
      RNFFmpegConfig.enableLogCallback((log) => {
        console.log('FFmpeg Log:', log.message);
      });
      
      this.isInitialized = true;
      console.log('FFmpeg initialized successfully');
    } catch (error) {
      console.error('FFmpeg initialization error:', error);
      throw error;
    }
  }

  async extractVideoInfo(videoPath) {
    try {
      const command = `-i "${videoPath}" -hide_banner`;
      const execution = await RNFFmpeg.execute(command);
      
      // Parse video information
      const info = await this.parseVideoInfo(videoPath);
      return info;
    } catch (error) {
      console.error('Error extracting video info:', error);
      throw error;
    }
  }

  async parseVideoInfo(videoPath) {
    const probeCommand = `-v quiet -print_format json -show_format -show_streams "${videoPath}"`;
    const execution = await RNFFmpeg.execute(probeCommand);
    
    // This is a simplified version - in production, you'd parse the JSON output
    return {
      duration: 0,
      width: 1920,
      height: 1080,
      fps: 30,
      format: 'mp4'
    };
  }

  async detectSceneChanges(videoPath) {
    try {
      const sceneFile = `${this.outputDir}/scenes.txt`;
      const command = `-i "${videoPath}" -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep showinfo`;
      
      await RNFFmpeg.execute(command);
      
      // Parse scene changes from output
      const scenes = await this.parseSceneChanges(sceneFile);
      return scenes;
    } catch (error) {
      console.error('Error detecting scene changes:', error);
      return [];
    }
  }

  async parseSceneChanges(sceneFile) {
    // Simplified scene detection - return mock data for now
    return [
      {timestamp: 10.5, score: 0.8},
      {timestamp: 25.2, score: 0.7},
      {timestamp: 45.8, score: 0.9},
      {timestamp: 67.1, score: 0.6},
      {timestamp: 89.3, score: 0.8}
    ];
  }

  async detectSilence(videoPath) {
    try {
      const silenceCommand = `-i "${videoPath}" -af silencedetect=noise=-30dB:d=0.5 -f null - 2>&1`;
      const execution = await RNFFmpeg.execute(silenceCommand);
      
      // Parse silence detection output
      const silenceSegments = await this.parseSilenceDetection();
      return silenceSegments;
    } catch (error) {
      console.error('Error detecting silence:', error);
      return [];
    }
  }

  async parseSilenceDetection() {
    // Simplified silence detection - return mock data for now
    return [
      {start: 5.2, end: 8.7},
      {start: 20.1, end: 22.3},
      {start: 35.5, end: 38.9},
      {start: 55.8, end: 59.2}
    ];
  }

  async extractClip(videoPath, startTime, duration, outputPath) {
    try {
      const command = `-i "${videoPath}" -ss ${startTime} -t ${duration} -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" -c:v libx264 -c:a aac -preset fast -crf 23 "${outputPath}"`;
      
      const execution = await RNFFmpeg.execute(command);
      
      if (execution === 0) {
        console.log(`Clip extracted successfully: ${outputPath}`);
        return outputPath;
      } else {
        throw new Error(`FFmpeg execution failed with code: ${execution}`);
      }
    } catch (error) {
      console.error('Error extracting clip:', error);
      throw error;
    }
  }

  async addTextOverlay(videoPath, text, outputPath) {
    try {
      const command = `-i "${videoPath}" -vf "drawtext=text='${text}':x=(w-text_w)/2:y=h-th-10:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=5" -c:a copy "${outputPath}"`;
      
      const execution = await RNFFmpeg.execute(command);
      
      if (execution === 0) {
        return outputPath;
      } else {
        throw new Error(`FFmpeg text overlay failed with code: ${execution}`);
      }
    } catch (error) {
      console.error('Error adding text overlay:', error);
      throw error;
    }
  }

  async generateThumbnail(videoPath, timestamp) {
    try {
      const thumbnailPath = `${this.outputDir}/thumb_${Date.now()}.jpg`;
      const command = `-i "${videoPath}" -ss ${timestamp} -vframes 1 -vf "scale=360:640" "${thumbnailPath}"`;
      
      const execution = await RNFFmpeg.execute(command);
      
      if (execution === 0) {
        return thumbnailPath;
      } else {
        throw new Error(`Thumbnail generation failed with code: ${execution}`);
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  }

  async analyzeAudioLevels(videoPath) {
    try {
      const command = `-i "${videoPath}" -af "volumedetect" -f null - 2>&1`;
      const execution = await RNFFmpeg.execute(command);
      
      // Parse audio level analysis
      const audioLevels = await this.parseAudioLevels();
      return audioLevels;
    } catch (error) {
      console.error('Error analyzing audio levels:', error);
      return [];
    }
  }

  async parseAudioLevels() {
    // Simplified audio level analysis - return mock data for now
    return [
      {timestamp: 0, level: -12.5},
      {timestamp: 5, level: -8.2},
      {timestamp: 10, level: -15.7},
      {timestamp: 15, level: -6.8},
      {timestamp: 20, level: -18.3}
    ];
  }

  getOutputDirectory() {
    return this.outputDir;
  }

  async cleanup() {
    try {
      const files = await RNFS.readDir(this.outputDir);
      for (const file of files) {
        if (file.name.startsWith('temp_')) {
          await RNFS.unlink(file.path);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temporary files:', error);
    }
  }
}

export const ffmpegService = new FFmpegService();

export const initializeFFmpeg = async () => {
  return ffmpegService.initialize();
};

export default ffmpegService;