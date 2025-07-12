# Clipprd Mobile App

A React Native mobile application built with Expo.

## Features

- Navigation between screens
- Profile management
- Settings configuration
- Modern UI design

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on specific platform:
```bash
# For iOS
npm run ios

# For Android
npm run android

# For web
npm run web
```

## Project Structure

```
├── App.tsx                 # Main app component
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── babel.config.js       # Babel configuration
├── src/
│   └── screens/          # Screen components
│       ├── HomeScreen.tsx
│       ├── ProfileScreen.tsx
│       └── SettingsScreen.tsx
└── assets/               # App assets (icons, images)
```

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser
- `npm test` - Run tests

## Technologies Used

- React Native
- Expo
- TypeScript
- React Navigation
- Expo Status Bar

## License

This project is licensed under the MIT License.