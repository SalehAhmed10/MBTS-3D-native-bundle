import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from 'expo-router';
import { LogBox, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SPEECH_HEALTH_ENDPOINT } from '@/config';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  LogBox.ignoreAllLogs();

  useEffect(() => {
    fetch(SPEECH_HEALTH_ENDPOINT).catch(() => {});
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Slot />
    </ThemeProvider>
  );
}
