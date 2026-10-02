import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { color, font } from '../../theme/tokens';
import { PressScale } from './PressScale';
import { cssShadow, topHighlightPath } from './cssShadow';

interface StripButton {
  label: string;
  a11y: string;
  onPress?: () => void;
}

interface AccountStripProps {
  lead: string;
  body: string;
  outline: StripButton;
  solid: StripButton;
}

const BUTTON_HEIGHT = 46;
const BUTTON_RADIUS = 14;

/** `.acct`: frosted card with a two-button row (outlined cream, solid Jamaica green). */
export function AccountStrip({ lead, body, outline, solid }: AccountStripProps) {
  return (
    <View style={styles.strip}>
      <Text style={styles.text}>
        <Text style={styles.lead}>{lead}</Text> {body}
      </Text>
      <View style={styles.row}>
        <PressScale label={outline.a11y} onPress={outline.onPress} containerStyle={styles.cell} style={styles.radius}>
          {() => (
            <View style={[styles.button, styles.outline]}>
              <Text style={styles.label}>{outline.label}</Text>
            </View>
          )}
        </PressScale>
        <PressScale label={solid.a11y} onPress={solid.onPress} containerStyle={styles.cell} style={[styles.radius, styles.greenShadow]}>
          {() => (
            <View style={[styles.button, styles.solid]}>
              <SolidHighlight />
              <Text style={[styles.label, styles.solidLabel]}>{solid.label}</Text>
            </View>
          )}
        </PressScale>
      </View>
    </View>
  );
}

/** `inset 0 1px 0 rgba(255,255,255,.25)`, stretched to the button width. */
function SolidHighlight() {
  const [w, setW] = React.useState(0);
  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setW(e.nativeEvent.layout.width)} pointerEvents="none">
      {w > 0 ? (
        <Svg width={w} height={BUTTON_HEIGHT}>
          <Path d={topHighlightPath(w, BUTTON_HEIGHT, BUTTON_RADIUS)} fill={color.white} fillOpacity={0.25} fillRule="evenodd" />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    marginTop: 4,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: color.line,
  },
  text: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
    color: 'rgba(246,239,217,0.78)',
  },
  lead: {
    fontFamily: font.bodyBold,
    color: color.cream,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cell: {
    flex: 1,
  },
  radius: {
    borderRadius: BUTTON_RADIUS,
  },
  greenShadow: cssShadow(0, 6, 16, color.green, 0.35, 6),
  button: {
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1.5,
    borderColor: 'rgba(246,239,217,0.55)',
  },
  solid: {
    backgroundColor: color.green,
  },
  label: {
    fontFamily: font.sticker,
    fontSize: 13,
    lineHeight: 15,
    letterSpacing: 1,
    color: color.cream,
  },
  solidLabel: {
    color: color.white,
  },
});
