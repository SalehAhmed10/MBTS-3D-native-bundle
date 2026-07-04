import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from 'expo-router';
import { LogBox, useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SPEECH_HEALTH_ENDPOINT } from '@/config';

const queryClient = new QueryClient();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  LogBox.ignoreAllLogs();

  useEffect(() => {
    fetch(SPEECH_HEALTH_ENDPOINT).catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Slot />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
