import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'menu'
  | 'users'
  | 'mic'
  | 'chat'
  | 'smile'
  | 'dice'
  | 'gear'
  | 'user'
  | 'globe'
  | 'phone'
  | 'chevron'
  | 'back'
  | 'copy'
  | 'share'
  | 'video'
  | 'check'
  | 'plus'
  | 'lock';

/** Stroke icons from the design pack (24×24, round caps). */
function glyph(name: IconName) {
  switch (name) {
    case 'menu':
      return <Path d="M4 7h16M4 12h16M4 17h16" />;
    case 'users':
      return (
        <>
          <Circle cx={9} cy={8} r={3.2} />
          <Path d="M3 19c.6-3.3 3-5 6-5s5.4 1.7 6 5" />
          <Circle cx={17} cy={9} r={2.4} />
          <Path d="M16.5 14c2.4.2 4 1.7 4.5 4.5" />
        </>
      );
    case 'mic':
      return (
        <>
          <Rect x={9} y={3} width={6} height={11} rx={3} />
          <Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
        </>
      );
    case 'chat':
      return (
        <>
          <Path d="M4 5h16v11H9l-5 4z" />
          <Path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" strokeWidth={2.6} />
        </>
      );
    case 'smile':
      return (
        <>
          <Circle cx={12} cy={12} r={8.5} />
          <Path d="M8.5 14c1 1.5 2.1 2.2 3.5 2.2s2.5-.7 3.5-2.2M9 9.5h.01M15 9.5h.01" strokeWidth={2} />
        </>
      );
    case 'dice':
      return (
        <>
          <Rect x={4} y={4} width={16} height={16} rx={3.5} />
          <Path d="M8.5 8.5h.01M15.5 15.5h.01M12 12h.01M15.5 8.5h.01M8.5 15.5h.01" strokeWidth={2.8} />
        </>
      );
    case 'gear':
      return (
        <>
          <Circle cx={12} cy={12} r={3} />
          <Path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
          <Circle cx={12} cy={12} r={6.3} />
        </>
      );
    case 'user':
      return (
        <>
          <Circle cx={12} cy={8.5} r={3.8} />
          <Path d="M4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6" />
        </>
      );
    case 'globe':
      return (
        <>
          <Circle cx={12} cy={12} r={8.5} />
          <Path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5s1.2-6.1 3.8-8.5z" />
        </>
      );
    case 'phone':
      return (
        <>
          <Rect x={7} y={2.8} width={10} height={18.4} rx={2.4} />
          <Path d="M11 18h2" />
        </>
      );
    case 'chevron':
      return <Path d="M9 5l7 7-7 7" />;
    case 'back':
      return <Path d="M15 5l-7 7 7 7" />;
    case 'copy':
      return (
        <>
          <Rect x={8} y={8} width={12} height={12} rx={2.5} />
          <Path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
        </>
      );
    case 'share':
      return (
        <>
          <Path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" />
          <Path d="M5 12v7h14v-7" />
        </>
      );
    case 'video':
      return (
        <>
          <Rect x={3} y={6.5} width={12.5} height={11} rx={2.5} />
          <Path d="M15.5 10.5l5-3v9l-5-3z" />
        </>
      );
    case 'check':
      return <Path d="M5 12.5l4.5 4.5L19 7.5" />;
    case 'plus':
      return <Path d="M12 5v14M5 12h14" />;
    case 'lock':
      return (
        <>
          <Rect x={5} y={10.5} width={14} height={10} rx={2.5} />
          <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        </>
      );
  }
}

export function Icon({ name, size = 22, color, strokeWidth = 1.8 }: { name: IconName; size?: number; color: string; strokeWidth?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyph(name)}
    </Svg>
  );
}
