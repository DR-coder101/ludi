import React, { type ReactNode, useId } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { CARD_3D, card3DShadow, type Card3DTone } from '../../theme/threeD';
import { cssShadow } from '../home/cssShadow';
import { triggerHaptic } from '../../utils/gameAudio';
import { FaceFill } from './FaceFill';

export function Card3D({
  tone,
  label,
  onPress,
  style,
  children,
}: {
  tone: Card3DTone;
  label?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const recipe = CARD_3D[tone];
  const gid = useId().replace(/:/g, '');
  const depth =
    Platform.OS === 'web'
      ? ({ boxShadow: card3DShadow(tone) } as ViewStyle)
      : cssShadow(0, recipe.glowY, recipe.glowBlur, recipe.glowColor, recipe.glowOpacity, recipe.lip ? 10 : 8);
  const body = (
    <View style={[{ borderRadius: recipe.radius, marginBottom: recipe.lipRest }, depth, style]}>
      {Platform.OS === 'web' || !recipe.lip ? null : (
        <View
          pointerEvents="none"
          style={[
            styles.lip,
            {
              backgroundColor: recipe.lip,
              borderRadius: recipe.radius,
              bottom: -recipe.lipRest,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.face,
          {
            borderRadius: recipe.radius,
            borderWidth: recipe.borderWidth,
            borderColor: recipe.border,
            padding: recipe.padding,
            backgroundColor: recipe.face[recipe.face.length - 1]?.color,
          },
        ]}
      >
        <FaceFill id={`card3d-${tone}-${gid}`} stops={recipe.face} axis={recipe.axis} />
        <View pointerEvents="none" style={[styles.highlight, { backgroundColor: recipe.highlight, borderRadius: recipe.radius }]} />
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        triggerHaptic.light();
        onPress();
      }}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 6,
  },
  face: {
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: 2,
    height: 3,
  },
  content: {
    zIndex: 1,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
});
