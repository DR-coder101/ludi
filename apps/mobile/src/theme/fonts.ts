/**
 * Font loading utility for Dancehall Premium theme
 */

import { useFonts } from 'expo-font';
import {
  Anton_400Regular,
} from '@expo-google-fonts/anton';
import {
  ArchivoBlack_400Regular,
} from '@expo-google-fonts/archivo-black';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

/**
 * Hook to load all required fonts for the app
 */
export function useDancehallFonts() {
  const [fontsLoaded, fontError] = useFonts({
    Anton_400Regular,
    ArchivoBlack_400Regular,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return { fontsLoaded, fontError };
}
