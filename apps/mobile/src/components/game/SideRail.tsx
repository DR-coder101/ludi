import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RoundButton } from './RoundButton';
import type { IconName } from './Icon';
import { fontFamily, palette, space } from '../../theme/tokens';

export interface RailItem {
  key: string;
  icon: IconName;
  label: string;
  /** Second label line, e.g. "4/4" or "On". */
  detail?: string;
  detailColor?: string;
  onPress?: () => void;
  hot?: boolean;
  iconColor?: string;
  borderColor?: string;
  badge?: number;
}

export function SideRail({ items }: { items: RailItem[] }) {
  return (
    <View style={styles.rail}>
      {items.map((item) => (
        <View key={item.key} style={styles.item}>
          <RoundButton
            icon={item.icon}
            label={item.detail ? `${item.label} ${item.detail}` : item.label}
            onPress={item.onPress}
            hot={item.hot}
            iconColor={item.iconColor}
            borderColor={item.borderColor}
            badge={item.badge}
          />
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
          {item.detail ? (
            <Text style={[styles.detail, { color: item.detailColor ?? palette.greenBright }]}>{item.detail}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { width: space.railWidth, alignItems: 'center', gap: 14 },
  item: { width: space.railWidth, alignItems: 'center' },
  label: {
    marginTop: 5,
    fontFamily: fontFamily.bodySemi,
    fontSize: 10.5,
    lineHeight: 13,
    color: 'rgba(246,239,217,0.78)',
    textAlign: 'center',
  },
  detail: { fontFamily: fontFamily.bodyBold, fontSize: 10.5, lineHeight: 13, textAlign: 'center' },
});
