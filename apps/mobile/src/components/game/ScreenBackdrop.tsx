import React from 'react';
import { Image, StyleSheet } from 'react-native';

/**
 * `.screen.grain` + `.marble` from the design pack, pre-rendered (backdrop.jpg, 390×844 @2x).
 * The pack builds the marble with SVG feTurbulence, which react-native-svg does not render on device.
 */
const BACKDROP = require('../../../assets/board/backdrop.jpg');

export function ScreenBackdrop() {
  return <Image source={BACKDROP} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />;
}
