import { useFonts } from 'expo-font';
// Per-weight entry points: the package index requires every Inter weight into the bundle.
import { Anton_400Regular } from '@expo-google-fonts/anton/400Regular';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';

/** Loads Anton, Archivo Black and Inter under the names in `font`. Resolves true on error so the screen still renders. */
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
