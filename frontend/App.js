import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import DeliveryTrackingScreen from './src/screens/DeliveryTrackingScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor="#FFF3DC" />
        <Stack.Navigator
          initialRouteName="DeliveryTracking"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#FFF3DC',
            },
            headerTintColor: '#482E1D',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="DeliveryTracking"
            component={DeliveryTrackingScreen}
            options={{
              title: 'Live Tracking',
              headerShown: true,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
} 