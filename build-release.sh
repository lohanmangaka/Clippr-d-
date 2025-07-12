#!/bin/bash

# ViralityClipprx Build Script
# This script builds the release APK for the ViralityClipprx app

echo "🚀 Starting ViralityClipprx Build Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Checking dependencies..."

# Install npm dependencies
print_status "Installing npm dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install npm dependencies."
    exit 1
fi

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf android/app/build
rm -f ViralityClipprx.apk

# Navigate to android directory
cd android

# Check if gradlew exists
if [ ! -f "gradlew" ]; then
    print_error "gradlew not found. Make sure you're in a React Native project."
    exit 1
fi

# Make gradlew executable
chmod +x gradlew

# Clean gradle build
print_status "Cleaning Gradle build..."
./gradlew clean

if [ $? -ne 0 ]; then
    print_error "Gradle clean failed."
    exit 1
fi

# Build release APK
print_status "Building release APK..."
./gradlew assembleRelease

if [ $? -ne 0 ]; then
    print_error "Failed to build release APK."
    exit 1
fi

# Copy APK to project root
print_status "Copying APK to project root..."
cp app/build/outputs/apk/release/app-release.apk ../ViralityClipprx.apk

if [ $? -ne 0 ]; then
    print_error "Failed to copy APK."
    exit 1
fi

# Go back to project root
cd ..

# Get APK size
APK_SIZE=$(du -h ViralityClipprx.apk | cut -f1)

print_status "✅ Build completed successfully!"
echo ""
echo "📱 APK Details:"
echo "   File: ViralityClipprx.apk"
echo "   Size: $APK_SIZE"
echo "   Location: $(pwd)/ViralityClipprx.apk"
echo ""
echo "🎯 Next Steps:"
echo "   1. Install on device: adb install ViralityClipprx.apk"
echo "   2. Test the app thoroughly"
echo "   3. Upload to Play Store for distribution"
echo ""
echo "🎉 ViralityClipprx is ready for deployment!"

exit 0