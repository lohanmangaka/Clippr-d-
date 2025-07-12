# ViralityClipprx

**The Complete Offline Video Clipping Solution**

ViralityClipprx is a fully offline, production-ready mobile app built with React Native that intelligently clips only the best, most engaging parts of user-selected videos and formats them in a TikTok-style vertical (9:16) aspect ratio.

## 🚀 Features

- **100% Offline Processing** - No internet connection, API keys, or paid services required
- **AI-Powered Highlight Detection** - Automatically identifies the most engaging moments
- **TikTok-Style 9:16 Format** - Perfect for social media platforms
- **Speech-to-Text Analysis** - Uses embedded Whisper.cpp for offline transcription
- **Scene Change Detection** - Identifies visual transitions and cuts
- **Audio Level Analysis** - Detects speech intensity and silence patterns
- **Smart Clipping Algorithm** - Combines multiple factors for optimal clip selection
- **Real-time Processing** - Live progress updates during video analysis
- **Professional Export Options** - Multiple quality settings and enhancement options
- **Direct Sharing** - Export and share clips immediately
- **Beautiful Modern UI** - Clean, intuitive interface with smooth animations

## 🛠 Technical Stack

- **React Native** - Cross-platform mobile development
- **FFmpeg** - Video processing and manipulation
- **Whisper.cpp** - Offline speech-to-text transcription
- **React Navigation** - Screen navigation and routing
- **React Native Reanimated** - Smooth animations and gestures
- **React Native Vector Icons** - Beautiful icon library
- **React Native Video** - Video playback and preview
- **React Native FS** - File system operations
- **React Native Document Picker** - File selection
- **React Native Share** - Social sharing capabilities

## 📱 How It Works

1. **Select Video** - Choose any video file from your device
2. **AI Analysis** - The app automatically:
   - Extracts and analyzes audio track
   - Transcribes speech using Whisper.cpp
   - Detects scene changes and transitions
   - Analyzes audio levels and silence patterns
   - Identifies highlight moments using engagement scoring
3. **Generate Clips** - Creates optimized 15-60 second clips in 9:16 format
4. **Preview & Export** - Review clips and export in various quality settings
5. **Share** - Directly share to social media or save to device

## 🔧 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/viralityclipprx.git
   cd viralityclipprx
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install native dependencies (Android):**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

4. **Run the app:**
   ```bash
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   ```

### Building for Production

#### Android APK

1. **Build the release APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **Generate signed APK:**
   ```bash
   npm run build-apk
   ```

The APK will be generated as `ViralityClipprx.apk` in the project root.

#### Play Store Release

1. **Create a signed AAB:**
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

2. **Upload to Play Store** using the generated AAB file.

## 🎯 Key Components

### Core Services

- **FFmpegService** - Video processing, scene detection, audio analysis
- **WhisperService** - Speech-to-text transcription and analysis
- **VideoProcessingService** - Orchestrates the entire processing pipeline

### Main Screens

- **HomeScreen** - App dashboard with recent clips and stats
- **VideoSelectScreen** - Video file selection and validation
- **VideoProcessingScreen** - Real-time processing progress
- **ClipPreviewScreen** - Preview and organize generated clips
- **ExportScreen** - Export settings and clip finalization

### Smart Features

- **Engagement Scoring** - Combines speech confidence, audio levels, and scene changes
- **Automatic Optimization** - Ensures clips are 15-60 seconds for maximum virality
- **Multi-factor Analysis** - Uses speech, visual, and audio cues for best results
- **Quality Presets** - Low, medium, and high quality export options

## 🎨 UI/UX Features

- **Dark Theme** - Modern black interface with colorful accents
- **Gradient Buttons** - Beautiful gradient-based interactive elements
- **Smooth Animations** - Reanimated-powered transitions and effects
- **Progress Indicators** - Real-time feedback during processing
- **Responsive Design** - Works perfectly on all screen sizes
- **Intuitive Navigation** - Easy-to-use navigation flow

## 🔍 Processing Pipeline

1. **Video Information Extraction** - Duration, resolution, format analysis
2. **Audio Track Extraction** - Separate audio for speech analysis
3. **Speech Transcription** - Whisper.cpp offline transcription
4. **Scene Change Detection** - Visual transition identification
5. **Silence Analysis** - Audio level and silence pattern detection
6. **Highlight Moment Identification** - AI-powered engagement scoring
7. **Clip Generation** - Optimized clip creation with 9:16 formatting
8. **Thumbnail Generation** - Preview images for each clip

## 📊 Performance

- **Offline Processing** - No internet required after installation
- **Efficient Algorithms** - Optimized for mobile performance
- **Memory Management** - Smart cleanup of temporary files
- **Battery Optimization** - Efficient processing to preserve battery life
- **Storage Optimization** - Automatic cleanup of temporary files

## 🔐 Privacy & Security

- **Complete Privacy** - No data sent to external servers
- **Local Processing** - All analysis happens on device
- **No API Keys** - No external service dependencies
- **Secure File Handling** - Proper file permissions and access control

## 🎯 Use Cases

- **Content Creators** - Quickly generate viral clips from longer videos
- **Social Media Managers** - Create engaging content for multiple platforms
- **Educators** - Extract key moments from educational content
- **Marketers** - Generate promotional clips from presentations
- **Personal Use** - Create shareable moments from personal videos

## 🔄 Updates & Maintenance

- **Modular Architecture** - Easy to update individual components
- **Version Control** - Semantic versioning for releases
- **Error Handling** - Comprehensive error reporting and recovery
- **Performance Monitoring** - Built-in analytics for optimization

## 📈 Future Enhancements

- **Custom Filters** - Video filters and effects
- **Batch Processing** - Process multiple videos simultaneously
- **Cloud Sync** - Optional cloud backup for clips
- **Advanced AI** - Enhanced engagement detection algorithms
- **Multi-language Support** - Transcription in multiple languages

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please:
1. Check the [FAQ](FAQ.md)
2. Search existing [Issues](https://github.com/yourusername/viralityclipprx/issues)
3. Create a new issue if needed

## 🙏 Acknowledgments

- **FFmpeg** - For powerful video processing capabilities
- **Whisper.cpp** - For offline speech recognition
- **React Native Community** - For excellent libraries and tools
- **Contributors** - Thank you to all who helped build this app

---

**ViralityClipprx** - Turn your videos into viral content, completely offline! 🎬✨