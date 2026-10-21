import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { boardFont, color } from '../../theme/tokens';
import { Button3D } from '../ui/Button3D';
import { Card3D } from '../ui/Card3D';
import { Icon } from './Icon';

export function LeaveConfirm({
  body,
  onLeave,
  onStay,
}: {
  body: string;
  onLeave?: () => void;
  onStay: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Stay in game" onPress={onStay} style={styles.dim}>
      <Pressable onPress={(e) => e.stopPropagation()} style={styles.cardWrap}>
        <Card3D tone="carbon" style={styles.card}>
          <View style={styles.iconRing}>
            <Icon name="leave" size={28} color={color.red} strokeWidth={2.5} />
          </View>
          <Text style={styles.title}>LEAVE GAME?</Text>
          <Text style={styles.body}>{body}</Text>
          <View style={styles.row}>
            <Button3D tone="red" compact label="Leave" onPress={onLeave} style={styles.btn}>
              <Text style={styles.leaveLabel}>LEAVE</Text>
            </Button3D>
            <Button3D tone="gold" compact label="Stay" onPress={onStay} style={styles.btn}>
              <Text style={styles.stayLabel}>STAY</Text>
            </Button3D>
          </View>
        </Card3D>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 20,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 320,
  },
  card: {
    width: '100%',
  },
  iconRing: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: color.red,
    backgroundColor: 'rgba(230,26,53,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 12,
    fontFamily: boardFont.display,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: 1.2,
    color: color.gold,
    textAlign: 'center',
  },
  body: {
    marginTop: 8,
    fontFamily: boardFont.body,
    fontSize: 12,
    lineHeight: 16,
    color: '#D4D4D4',
    textAlign: 'center',
  },
  row: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
  },
  leaveLabel: {
    fontFamily: boardFont.display,
    fontSize: 20,
    letterSpacing: 1,
    color: color.white,
  },
  stayLabel: {
    fontFamily: boardFont.display,
    fontSize: 20,
    letterSpacing: 1,
    color: color.bg,
  },
});
