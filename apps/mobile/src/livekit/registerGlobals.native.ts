import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  isTestRuntime,
  shouldRegisterLiveKitGlobals,
} from './liveKitRuntime';

export function registerLiveKitGlobals(): void {
  if (
    !shouldRegisterLiveKitGlobals({
      os: Platform.OS,
      appOwnership: Constants.appOwnership ?? null,
      executionEnvironment: Constants.executionEnvironment ?? null,
      isTest: isTestRuntime(),
    })
  ) {
    return;
  }

  try {
    // Native WebRTC is missing in Expo Go. A static import would throw at load time.
    const { registerGlobals } = require('@livekit/react-native') as typeof import('@livekit/react-native');
    registerGlobals();
  } catch {
    // Incomplete native binary (Expo Go or a JS-only test host).
  }
}
