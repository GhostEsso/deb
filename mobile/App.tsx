import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from '@/navigation/app-navigator';
import { AuthProvider } from '@/services/auth.context';
import { UpdateModal } from './src/components/update-modal';
import { useFonts, Urbanist_400Regular, Urbanist_500Medium, Urbanist_600SemiBold, Urbanist_700Bold, Urbanist_800ExtraBold } from '@expo-google-fonts/urbanist';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';

// On empêche le splash screen de se cacher automatiquement
SplashScreen.preventAutoHideAsync().catch(() => { });

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'UrbanistRegular': Urbanist_400Regular,
    'UrbanistMedium': Urbanist_500Medium,
    'UrbanistSemiBold': Urbanist_600SemiBold,
    'UrbanistBold': Urbanist_700Bold,
    'UrbanistExtraBold': Urbanist_800ExtraBold,
  });

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setIsReady(true);
    }
    // Sécurité : on force l'état prêt après 5s
    const timer = setTimeout(() => setIsReady(true), 5000);
    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [isReady]);

  if (!isReady) {
    return null; // Le splash screen reste visible
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="dark" translucent backgroundColor="transparent" />
            <UpdateModal />
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
