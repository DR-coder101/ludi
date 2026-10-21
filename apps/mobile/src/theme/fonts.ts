import { useFonts } from 'expo-font';
// Per-weight entry points: the package index requires every Inter weight into the bundle.
import { Anton_400Regular } from '@expo-google-fonts/anton/400Regular';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black/400Regular';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Montserrat_600SemiBold } from '@expo-google-fonts/montserrat/600SemiBold';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat/700Bold';
import { Montserrat_900Black } from '@expo-google-fonts/montserrat/900Black';

/** Loads board and legacy faces. Resolves true on error so the screen still renders. */
export function useLudiFonts(): boolean {
  const [loaded, error] = useFonts({
    Anton_400Regular,
    ArchivoBlack_400Regular,
    BebasNeue_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_900Black,
  });
  return loaded || error != null;
}
