import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, font, layout } from '../../theme/tokens';
import { RoundButton, type RoundButtonTone } from './RoundButton';
import type { IconName } from './Icon';

export interface RailItem {
  key: string;
  icon: IconName;
  label: string;
  /** Second label line (bold); green unless `subTone` says otherwise. */
  sub?: string;
  subTone?: 'green' | 'cream' | 'muted';
  tone?: RoundButtonTone;
  badge?: number;
  /** Spoken label when it differs from the visible one. */
  a11y?: string;
  onPress?: () => void;
}

const SUB_COLOR = { green: color.greenBright, cream: color.cream, muted: color.creamMuted } as const;

export function SideRail({ items }: { items: RailItem[] }) {
  return (
    <View style={styles.rail}>
      {items.map((item) => (
        <View key={item.key} style={styles.item}>
          <RoundButton
            icon={item.icon}
            size={layout.railButton}
            tone={item.tone}
            badge={item.badge}
            label={item.a11y ?? item.label}
            onPress={item.onPress}
          />
          <Text style={styles.label}>
            {item.label}
            {item.sub ? (
              <Text style={[styles.sub, { color: SUB_COLOR[item.subTone ?? 'green'] }]}>{`\n${item.sub}`}</Text>
            ) : null}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    alignItems: 'center',
    gap: layout.railGap,
  },
  item: {
    width: layout.railWidth,
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontFamily: font.bodySemi,
    fontSize: 10.5,
    lineHeight: 12.6,
    color: color.creamMuted,
    textAlign: 'center',
  },
  sub: {
    fontFamily: font.bodyBold,
  },
});
