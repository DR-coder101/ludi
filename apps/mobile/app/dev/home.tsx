import { Platform } from 'react-native';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { HomeLanding } from '../../src/components/home/HomeLanding';

/** iPhone 14 safe area, so web screenshots line up with the 390×844 mockup. */
const PHONE_INSETS = { top: 47, bottom: 34 };
const ENABLED = __DEV__ || process.env.EXPO_PUBLIC_DEV_ROUTES === '1';

/** Visual QA for the home screen: /dev/home, or /dev/home?state=signedin for the account variant. */
export default function HomePreview() {
  const router = useRouter();
  const params = useLocalSearchParams<{ state?: string }>();

  if (!ENABLED) return <Redirect href="/" />;

  return (
    <HomeLanding
      signedIn={params.state === 'signedin'}
      onOnline={() => router.push('/')}
      onLocal={() => router.push('/game?colors=red,green,yellow,blue')}
      onSignIn={() => router.push('/auth/signin')}
      onSignUp={() => router.push('/auth/signup')}
      onProfile={() => router.push('/profile')}
      onHistory={() => router.push('/history')}
      insets={Platform.OS === 'web' ? PHONE_INSETS : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
    </HomeLanding>
  );
}
