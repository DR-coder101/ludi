import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName = 'menu' | 'user' | 'users' | 'mic' | 'chat' | 'smile' | 'dice' | 'gear';

interface IconProps {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

/** Line icons from the design pack (24-unit grid, round caps). */
export function Icon({ name, size = 22, color, strokeWidth = 1.8 }: IconProps) {
  const common = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'menu' ? <Path {...common} d="M4 7h16M4 12h16M4 17h16" /> : null}
      {name === 'user' ? (
        <>
          <Circle {...common} cx={12} cy={8.5} r={3.8} />
          <Path {...common} d="M4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6" />
        </>
      ) : null}
      {name === 'users' ? (
        <>
          <Circle {...common} cx={9} cy={8} r={3.2} />
          <Path {...common} d="M3 19c.6-3.3 3-5 6-5s5.4 1.7 6 5" />
          <Circle {...common} cx={17} cy={9} r={2.4} />
          <Path {...common} d="M16.5 14c2.4.2 4 1.7 4.5 4.5" />
        </>
      ) : null}
      {name === 'mic' ? (
        <>
          <Rect {...common} x={9} y={3} width={6} height={11} rx={3} />
          <Path {...common} d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
        </>
      ) : null}
      {name === 'chat' ? (
        <>
          <Path {...common} d="M4 5h16v11H9l-5 4z" />
          <Path {...common} strokeWidth={2.6} d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" />
        </>
      ) : null}
      {name === 'smile' ? (
        <>
          <Circle {...common} cx={12} cy={12} r={8.5} />
          <Path {...common} strokeWidth={2} d="M8.5 14c1 1.5 2.1 2.2 3.5 2.2s2.5-.7 3.5-2.2M9 9.5h.01M15 9.5h.01" />
        </>
      ) : null}
      {name === 'dice' ? (
        <>
          <Rect {...common} x={4} y={4} width={16} height={16} rx={3.5} />
          <Path {...common} strokeWidth={2.8} d="M8.5 8.5h.01M15.5 15.5h.01M12 12h.01M15.5 8.5h.01M8.5 15.5h.01" />
        </>
      ) : null}
      {name === 'gear' ? (
        <>
          <Circle {...common} cx={12} cy={12} r={3} />
          <Path
            {...common}
            d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"
          />
          <Circle {...common} cx={12} cy={12} r={6.3} />
        </>
      ) : null}
    </Svg>
  );
}
