import { Platform, type TextStyle } from 'react-native';

/**
 * Mockup titles ask Anton for bold. Anton is single-weight, so web and Android synthesise
 * weight. iOS has no bold face and would swap to the system font, so leave it plain there.
 */
export const antonBold: TextStyle = Platform.select({
  web: { fontWeight: '700' },
  android: { fontWeight: '700' },
  default: {},
})!;
