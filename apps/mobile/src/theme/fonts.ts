import { useFonts } from 'expo-font';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import {
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

/** Loads Anton, Inter and Archivo Black under the names in `fontFamily`. */
export function useLudiFonts(): boolean {
  const [loaded, error] = useFonts({
    Anton_400Regular,
    ArchivoBlack_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  return loaded || error != null;
}
