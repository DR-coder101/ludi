import { Platform, type ViewStyle } from 'react-native';

/**
 * A CSS `box-shadow: x y blur color` as React Native shadow props. react-native-web writes
 * `shadowRadius` straight into the CSS blur; iOS draws a blur about twice its shadowRadius.
 */
export function cssShadow(x: number, y: number, blur: number, shadowColor: string, opacity: number, elevation: number): ViewStyle {
  return {
    shadowColor,
    shadowOffset: { width: x, height: y },
    shadowOpacity: opacity,
    shadowRadius: Platform.OS === 'web' ? blur : blur / 2,
    elevation,
  };
}

/** `inset 0 1px 0`: the sliver between a rounded rect and the same rect moved down 1px. */
export function topHighlightPath(w: number, h: number, r: number): string {
  const rect = (y: number) =>
    `M${r} ${y}H${w - r}A${r} ${r} 0 0 1 ${w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${w - r} ${y + h}H${r}A${r} ${r} 0 0 1 0 ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${r} ${y}Z`;
  return rect(0) + rect(1);
}
