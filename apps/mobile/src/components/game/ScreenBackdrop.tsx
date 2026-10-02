import React from 'react';
import { Image, StyleSheet } from 'react-native';

/**
 * `.screen.grain` + `.marble` from the design pack, pre-rendered (backdrop.jpg, 390×844 @2x).
 * The pack builds the marble with SVG feTurbulence, which react-native-svg does not render on device.
 */
const BACKDROP = require('../../../assets/board/backdrop.jpg');

export function ScreenBackdrop() {
  return <Image source={BACKDROP} style={styles.fill} resizeMode="cover" accessibilityIgnoresInvertColors />;
}

const styles = StyleSheet.create({
  // A required image defaults to its intrinsic size (780×1688), which beats left/right/top/bottom alone.
  fill: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
});
