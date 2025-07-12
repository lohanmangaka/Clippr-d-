import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {StatusBar, Platform} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {request, PERMISSIONS} from 'react-native-permissions';

// Screens
import HomeScreen from './screens/HomeScreen';
import VideoSelectScreen from './screens/VideoSelectScreen';
import VideoProcessingScreen from './screens/VideoProcessingScreen';
import ClipPreviewScreen from './screens/ClipPreviewScreen';
import ExportScreen from './screens/ExportScreen';

// Services
import {initializeFFmpeg} from './services/FFmpegService';
import {initializeWhisper} from './services/WhisperService';

const Stack = createStackNavigator();

const App = () => {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Request necessary permissions
      if (Platform.OS === 'android') {
        await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
        await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
        await request(PERMISSIONS.ANDROID.CAMERA);
        await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
      }

      // Initialize services
      await initializeFFmpeg();
      await initializeWhisper();
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#000',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{title: 'ViralityClipprx'}} 
            />
            <Stack.Screen 
              name="VideoSelect" 
              component={VideoSelectScreen} 
              options={{title: 'Select Video'}} 
            />
            <Stack.Screen 
              name="VideoProcessing" 
              component={VideoProcessingScreen} 
              options={{title: 'Processing Video'}} 
            />
            <Stack.Screen 
              name="ClipPreview" 
              component={ClipPreviewScreen} 
              options={{title: 'Preview Clips'}} 
            />
            <Stack.Screen 
              name="Export" 
              component={ExportScreen} 
              options={{title: 'Export Clips'}} 
            />
          </Stack.Navigator>
          <Toast />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;