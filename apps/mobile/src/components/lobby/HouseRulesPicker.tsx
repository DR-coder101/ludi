import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { HouseRules } from '@ludi/protocol';
import { color, font } from '../../theme/tokens';
import { Icon, type IconName } from '../game/Icon';
import { triggerHaptic } from '../../utils/gameAudio';
import { ToggleSwitch } from './LobbyControls';
import { maxSixesLabel, nextMaxConsecutiveSixes } from './lobbyModel';

const PANEL = '#151517';

type BooleanRule = 'extraRollOnCapture' | 'exactFinishBonus' | 'playForPlacements';

const BOOLEAN_RULES: { key: BooleanRule; label: string; icon: IconName }[] = [
  { key: 'extraRollOnCapture', label: 'Extra roll on capture', icon: 'refresh' },
  { key: 'exactFinishBonus', label: 'Exact finish bonus', icon: 'home' },
  { key: 'playForPlacements', label: 'Play for placements', icon: 'crown' },
];

interface HouseRulesPickerProps {
  houseRules: HouseRules;
  onChange?: (houseRules: HouseRules) => void;
}

export function HouseRulesPicker({ houseRules, onChange }: HouseRulesPickerProps) {
  const lockedHint = onChange ? undefined : 'Only the host can change house rules';
  const sixesLabel = maxSixesLabel(houseRules.maxConsecutiveSixes);

  return (
    <View style={styles.panel}>
      <Pressable
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={`Max sixes, ${sixesLabel}`}
        accessibilityHint={lockedHint}
        accessibilityState={{ disabled: !onChange }}
        disabled={!onChange}
        onPress={() => {
          triggerHaptic.light();
          onChange?.({
            ...houseRules,
            maxConsecutiveSixes: nextMaxConsecutiveSixes(houseRules.maxConsecutiveSixes),
          });
        }}
      >
        <View style={styles.label}>
          <Icon name="dice" size={16} color={color.cream} />
          <Text style={styles.labelText}>Max sixes</Text>
        </View>
        <Text style={styles.value}>{sixesLabel}</Text>
      </Pressable>
      {BOOLEAN_RULES.map((rule) => (
        <Pressable
          key={rule.key}
          style={styles.row}
          accessibilityRole="switch"
          accessibilityLabel={rule.label}
          accessibilityHint={lockedHint}
          accessibilityState={{ checked: houseRules[rule.key], disabled: !onChange }}
          disabled={!onChange}
          onPress={() => {
            triggerHaptic.light();
            onChange?.({ ...houseRules, [rule.key]: !houseRules[rule.key] });
          }}
        >
          <View style={styles.label}>
            <Icon name={rule.icon} size={16} color={color.cream} />
            <Text style={styles.labelText}>{rule.label}</Text>
          </View>
          <ToggleSwitch on={houseRules[rule.key]} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 8,
  },
  row: {
    height: 38,
    borderRadius: 12,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: color.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  labelText: {
    fontFamily: font.bodySemi,
    fontSize: 12,
    lineHeight: 15,
    color: color.cream,
  },
  value: {
    fontFamily: font.bodyBold,
    fontSize: 12,
    lineHeight: 15,
    color: color.gold,
  },
});
