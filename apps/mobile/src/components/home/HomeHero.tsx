import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { color, font } from '../../theme/tokens';
import { antonBold } from '../../theme/antonBold';

export const HERO = { width: 390, height: 220 } as const;

const DICE = require('../../../assets/home/dice.png');
const PIECES = require('../../../assets/home/pieces-row.png');

export function HomeHero() {
  return (
    <View
      style={styles.hero}
      accessibilityRole="header"
      accessibilityLabel="Ludi. Jamaican Rules. Four corners, one board."
    >
      <View style={styles.glow} />
      <View style={styles.sticker}>
        <Text style={styles.stickerText}>JAMAICAN RULES</Text>
      </View>
      <View style={styles.wordWrap}>
        <Text style={styles.wordShadowGreen}>LUDI</Text>
        <Text style={styles.wordShadowInk}>LUDI</Text>
        <Text style={styles.word}>LUDI</Text>
      </View>
      <Text style={styles.tagline}>
        FOUR CORNERS <Text style={styles.tagDot}>•</Text> ONE BOARD
      </Text>
      <View style={styles.stage}>
        <Image source={DICE} style={styles.dice} resizeMode="contain" accessibilityIgnoresInvertColors />
        <Image source={PIECES} style={styles.pieces} resizeMode="contain" accessibilityIgnoresInvertColors />
        <View style={styles.stageFloor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
  },
  glow: {
    position: 'absolute',
    top: 72,
    width: 280,
    height: 160,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 208, 0, 0.12)',
  },
  sticker: {
    zIndex: 2,
    marginBottom: -10,
    transform: [{ rotate: '-3deg' }],
    backgroundColor: color.magenta,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 204, 0.5)',
  },
  stickerText: {
    fontFamily: font.sticker,
    fontSize: 11,
    letterSpacing: 1.6,
    color: color.white,
  },
  wordWrap: {
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
  },
  word: {
    fontFamily: font.display,
    ...antonBold,
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -1,
    color: color.goldArcade,
    textAlign: 'center',
  },
  wordShadowGreen: {
    position: 'absolute',
    fontFamily: font.display,
    ...antonBold,
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -1,
    color: color.greenDeep,
    transform: [{ translateX: 4 }, { translateY: 4 }],
  },
  wordShadowInk: {
    position: 'absolute',
    fontFamily: font.display,
    ...antonBold,
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -1,
    color: color.bg,
    transform: [{ translateX: 7 }, { translateY: 7 }],
  },
  tagline: {
    marginTop: 2,
    fontFamily: font.bodyBold,
    fontSize: 11,
    letterSpacing: 3.2,
    color: color.silver,
  },
  tagDot: {
    color: color.emerald,
  },
  stage: {
    width: 320,
    height: 140,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dice: {
    position: 'absolute',
    top: 4,
    width: 150,
    height: 74,
    transform: [{ translateX: 12 }],
  },
  pieces: {
    width: 210,
    height: 78,
    transform: [{ translateX: 6 }],
    zIndex: 2,
  },
  stageFloor: {
    position: 'absolute',
    bottom: 4,
    width: 220,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 208, 0, 0.12)',
  },
});
