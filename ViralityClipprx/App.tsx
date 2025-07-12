/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import ProcessingScreen from './src/screens/ProcessingScreen';
import PreviewScreen from './src/screens/PreviewScreen';
import { RootStackParamList } from './src/types/navigation';
import { enableScreens } from 'react-native-screens';

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" />
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'ViralityClipprx' }} />
        <Stack.Screen name="Processing" component={ProcessingScreen} options={{ title: 'Processing' }} />
        <Stack.Screen name="Preview" component={PreviewScreen} options={{ title: 'Preview Clips' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
