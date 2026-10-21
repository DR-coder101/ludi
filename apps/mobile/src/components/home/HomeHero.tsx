import React from 'react';
import { Image, Platform, StyleSheet, Text, View, type ImageStyle } from 'react-native';
import { color, font } from '../../theme/tokens';
import { antonBold } from '../../theme/antonBold';

export const HERO = { width: 390, height: 248 } as const;

const DICE = require('../../../assets/home/dice.png');
const PIECES = require('../../../assets/home/pieces-row.png');

const DICE_W = 176;
const DICE_H = Math.round((DICE_W * 597) / 1016);
const PIECES_W = 250;
const PIECES_H = Math.round((PIECES_W * 435) / 1580);

const renderShadow: ImageStyle = Platform.select({
  web: { filter: 'drop-shadow(0 12px 18px rgba(0, 0, 0, 0.62))' } as ImageStyle,
  default: {
    shadowColor: color.bg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
});

export function HomeHero() {
  return (
    <View
      style={styles.hero}
      accessibilityRole="header"
      accessibilityLabel="Ludi. Jamaican Rules. Four corners, one board."
    >
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
        <Image
          source={DICE}
          style={styles.dice}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <Image
          source={PIECES}
          style={styles.pieces}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 2,
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
    height: DICE_H + PIECES_H - 28,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  dice: {
    position: 'absolute',
    top: 0,
    width: DICE_W,
    height: DICE_H,
    transform: [{ translateX: 17 }],
    ...renderShadow,
  },
  pieces: {
    width: PIECES_W,
    height: PIECES_H,
    transform: [{ translateX: 9 }],
    zIndex: 2,
    ...renderShadow,
  },
});
