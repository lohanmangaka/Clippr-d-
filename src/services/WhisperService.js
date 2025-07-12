import RNFS from 'react-native-fs';
import {RNFFmpeg} from 'react-native-ffmpeg';

class WhisperService {
  constructor() {
    this.isInitialized = false;
    this.modelPath = null;
    this.tempDir = `${RNFS.DocumentDirectoryPath}/whisper_temp`;
  }

  async initialize() {
    try {
      // Create temp directory
      await RNFS.mkdir(this.tempDir);
      
      // Copy or download Whisper model (simplified - in production you'd bundle or download)
      this.modelPath = `${RNFS.DocumentDirectoryPath}/whisper-base.bin`;
      
      // For now, we'll simulate having the model
      this.isInitialized = true;
      console.log('Whisper initialized successfully');
    } catch (error) {
      console.error('Whisper initialization error:', error);
      throw error;
    }
  }

  async extractAudio(videoPath) {
    try {
      const audioPath = `${this.tempDir}/audio_${Date.now()}.wav`;
      const command = `-i "${videoPath}" -acodec pcm_s16le -ac 1 -ar 16000 "${audioPath}"`;
      
      const execution = await RNFFmpeg.execute(command);
      
      if (execution === 0) {
        return audioPath;
      } else {
        throw new Error(`Audio extraction failed with code: ${execution}`);
      }
    } catch (error) {
      console.error('Error extracting audio:', error);
      throw error;
    }
  }

  async transcribeAudio(audioPath) {
    try {
      // Simulate Whisper transcription
      // In production, you'd use react-native-whisper or similar
      const transcription = await this.simulateWhisperTranscription(audioPath);
      return transcription;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  async simulateWhisperTranscription(audioPath) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock transcription data with timestamps
    return {
      segments: [
        {
          start: 0.0,
          end: 5.2,
          text: "Welcome to this amazing video tutorial",
          confidence: 0.95,
          words: [
            {start: 0.0, end: 0.8, text: "Welcome", confidence: 0.98},
            {start: 0.8, end: 1.0, text: "to", confidence: 0.99},
            {start: 1.0, end: 1.5, text: "this", confidence: 0.97},
            {start: 1.5, end: 2.3, text: "amazing", confidence: 0.94},
            {start: 2.3, end: 2.8, text: "video", confidence: 0.96},
            {start: 2.8, end: 3.5, text: "tutorial", confidence: 0.93}
          ]
        },
        {
          start: 5.2,
          end: 12.8,
          text: "Today we're going to learn about some incredible techniques",
          confidence: 0.92,
          words: [
            {start: 5.2, end: 5.6, text: "Today", confidence: 0.98},
            {start: 5.6, end: 6.0, text: "we're", confidence: 0.95},
            {start: 6.0, end: 6.4, text: "going", confidence: 0.97},
            {start: 6.4, end: 6.6, text: "to", confidence: 0.99},
            {start: 6.6, end: 7.0, text: "learn", confidence: 0.94},
            {start: 7.0, end: 7.5, text: "about", confidence: 0.96},
            {start: 7.5, end: 8.0, text: "some", confidence: 0.93},
            {start: 8.0, end: 8.8, text: "incredible", confidence: 0.91},
            {start: 8.8, end: 9.5, text: "techniques", confidence: 0.89}
          ]
        },
        {
          start: 15.3,
          end: 22.1,
          text: "Make sure to follow along and practice these steps",
          confidence: 0.88,
          words: [
            {start: 15.3, end: 15.7, text: "Make", confidence: 0.95},
            {start: 15.7, end: 16.1, text: "sure", confidence: 0.97},
            {start: 16.1, end: 16.3, text: "to", confidence: 0.99},
            {start: 16.3, end: 16.8, text: "follow", confidence: 0.92},
            {start: 16.8, end: 17.2, text: "along", confidence: 0.94},
            {start: 17.2, end: 17.4, text: "and", confidence: 0.98},
            {start: 17.4, end: 18.0, text: "practice", confidence: 0.90},
            {start: 18.0, end: 18.5, text: "these", confidence: 0.93},
            {start: 18.5, end: 19.0, text: "steps", confidence: 0.87}
          ]
        }
      ],
      fullText: "Welcome to this amazing video tutorial. Today we're going to learn about some incredible techniques. Make sure to follow along and practice these steps.",
      language: "en",
      duration: 22.1
    };
  }

  async analyzeTranscription(transcription) {
    try {
      const analysis = {
        keyPhrases: [],
        emotionalTones: [],
        speechIntensity: [],
        engagementScore: []
      };

      // Analyze each segment
      for (const segment of transcription.segments) {
        // Detect key phrases
        const keyPhrases = this.detectKeyPhrases(segment.text);
        analysis.keyPhrases.push({
          timestamp: segment.start,
          phrases: keyPhrases
        });

        // Analyze emotional tone
        const tone = this.analyzeEmotionalTone(segment.text);
        analysis.emotionalTones.push({
          timestamp: segment.start,
          tone: tone,
          intensity: Math.random() * 0.5 + 0.5 // Mock intensity
        });

        // Calculate speech intensity based on confidence and word density
        const wordDensity = segment.words.length / (segment.end - segment.start);
        const avgConfidence = segment.words.reduce((sum, word) => sum + word.confidence, 0) / segment.words.length;
        const intensity = (wordDensity * avgConfidence) / 10; // Normalize
        
        analysis.speechIntensity.push({
          timestamp: segment.start,
          intensity: Math.min(intensity, 1.0)
        });

        // Calculate engagement score
        const engagementScore = this.calculateEngagementScore(segment.text, segment.confidence);
        analysis.engagementScore.push({
          timestamp: segment.start,
          score: engagementScore
        });
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing transcription:', error);
      throw error;
    }
  }

  detectKeyPhrases(text) {
    const keyWords = [
      'amazing', 'incredible', 'awesome', 'fantastic', 'wonderful',
      'important', 'crucial', 'essential', 'key', 'significant',
      'tutorial', 'learn', 'technique', 'method', 'strategy',
      'follow', 'practice', 'step', 'process', 'guide'
    ];

    const phrases = [];
    const words = text.toLowerCase().split(' ');
    
    for (const word of words) {
      if (keyWords.includes(word.replace(/[^a-zA-Z]/g, ''))) {
        phrases.push(word);
      }
    }

    return phrases;
  }

  analyzeEmotionalTone(text) {
    const positiveWords = ['amazing', 'incredible', 'awesome', 'fantastic', 'wonderful', 'great', 'excellent'];
    const excitementWords = ['wow', 'amazing', 'incredible', 'fantastic', 'awesome'];
    const instructionalWords = ['learn', 'follow', 'practice', 'step', 'guide', 'tutorial'];

    const lowerText = text.toLowerCase();
    
    if (positiveWords.some(word => lowerText.includes(word))) {
      return 'positive';
    } else if (excitementWords.some(word => lowerText.includes(word))) {
      return 'excited';
    } else if (instructionalWords.some(word => lowerText.includes(word))) {
      return 'instructional';
    } else {
      return 'neutral';
    }
  }

  calculateEngagementScore(text, confidence) {
    let score = confidence * 0.5; // Base score from confidence
    
    // Add points for engaging words
    const engagingWords = ['amazing', 'incredible', 'awesome', 'wow', 'fantastic'];
    const lowerText = text.toLowerCase();
    
    for (const word of engagingWords) {
      if (lowerText.includes(word)) {
        score += 0.1;
      }
    }

    // Add points for questions
    if (text.includes('?')) {
      score += 0.15;
    }

    // Add points for exclamations
    if (text.includes('!')) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  async findHighlightMoments(transcription, audioLevels, sceneChanges) {
    try {
      const highlights = [];
      const analysis = await this.analyzeTranscription(transcription);

      // Combine different metrics to find highlights
      for (let i = 0; i < transcription.segments.length; i++) {
        const segment = transcription.segments[i];
        const engagement = analysis.engagementScore[i]?.score || 0;
        const speechIntensity = analysis.speechIntensity[i]?.intensity || 0;
        
        // Find corresponding audio level
        const audioLevel = audioLevels.find(level => 
          Math.abs(level.timestamp - segment.start) < 2.5
        );
        const audioScore = audioLevel ? Math.min(Math.abs(audioLevel.level) / 20, 1.0) : 0;

        // Find nearby scene changes
        const sceneChange = sceneChanges.find(scene => 
          Math.abs(scene.timestamp - segment.start) < 3.0
        );
        const sceneScore = sceneChange ? sceneChange.score : 0;

        // Calculate combined score
        const combinedScore = (engagement * 0.4) + (speechIntensity * 0.3) + (audioScore * 0.2) + (sceneScore * 0.1);

        if (combinedScore > 0.6) { // Threshold for highlights
          highlights.push({
            startTime: Math.max(0, segment.start - 2), // Add buffer
            endTime: Math.min(segment.end + 2, transcription.duration),
            score: combinedScore,
            text: segment.text,
            reason: this.getHighlightReason(engagement, speechIntensity, audioScore, sceneScore)
          });
        }
      }

      // Sort by score and return top highlights
      return highlights.sort((a, b) => b.score - a.score).slice(0, 5);
    } catch (error) {
      console.error('Error finding highlight moments:', error);
      return [];
    }
  }

  getHighlightReason(engagement, speechIntensity, audioLevel, sceneChange) {
    if (engagement > 0.8) return 'High engagement content';
    if (speechIntensity > 0.7) return 'Intense speech pattern';
    if (audioLevel > 0.6) return 'Strong audio presence';
    if (sceneChange > 0.7) return 'Significant scene change';
    return 'Multiple factors';
  }

  async cleanup() {
    try {
      const files = await RNFS.readDir(this.tempDir);
      for (const file of files) {
        await RNFS.unlink(file.path);
      }
    } catch (error) {
      console.error('Error cleaning up Whisper temp files:', error);
    }
  }
}

export const whisperService = new WhisperService();

export const initializeWhisper = async () => {
  return whisperService.initialize();
};

export default whisperService;