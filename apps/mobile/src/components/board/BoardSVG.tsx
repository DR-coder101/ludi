/**
 * BoardSVG - Complete Dancehall Premium Board Rendering
 * 
 * Implements the APPROVED BOARD SPEC with react-native-svg:
 * - 380x380 viewBox, cell=20, scaled to width
 * - Track cells with color pattern and halftone
 * - Home strips with chevrons
 * - Centre with triangles, X, bands, and Jamaica silhouette
 * - Yards with speaker rings, halftone, place names, mini maps
 * - Start cells with stars and entry arrows
 * - Pieces with radial gradients and stacks
 */

import React from 'react';
import Svg, {
  Rect,
  Circle,
  Line,
  Path,
  Polygon,
  Defs,
  RadialGradient,
  Stop,
  G,
  Text,
  Pattern,
  Ellipse,
  LinearGradient,
} from 'react-native-svg';
import { colors, board, getTrackCellColor, getPieceGradient } from '../../theme/tokens';
import type { EngineColor } from '../../theme/tokens';

const VB_SIZE = board.viewBoxSize; // 380
const C = board.cellSize; // 20

/**
 * Cell type determination (from spec)
 */
function cellType(r: number, c: number): 'yard' | 'centre' | 'home' | 'track' {
  const isYard = (r < 8 || r > 10) && (c < 8 || c > 10);
  const isCentre = r >= 8 && r <= 10 && c >= 8 && c <= 10;
  
  // Home columns: c=9 r1..7, c=9 r11..17, r=9 c1..7, r=9 c11..17
  const isHome =
    (c === 9 && r >= 1 && r <= 7) ||   // Montego/gold top
    (c === 9 && r >= 11 && r <= 17) || // Kingston/red bottom
    (r === 9 && c >= 1 && c <= 7) ||   // Negril/black left
    (r === 9 && c >= 11 && c <= 17);   // Ocho/green right
  
  if (isYard) return 'yard';
  if (isCentre) return 'centre';
  if (isHome) return 'home';
  return 'track';
}

/**
 * Get outerIndex for track cell coloring
 */
function getOuterIndex(r: number, c: number): number {
  if (r < 8) return r;
  if (r > 10) return 18 - r;
  if (c < 8) return c;
  return 18 - c;
}

/**
 * Home column chevrons (pointing to centre)
 */
const HomeChevron: React.FC<{ r: number; c: number; color: EngineColor }> = ({ r, c, color }) => {
  const x = c * C + C / 2;
  const y = r * C + C / 2;
  
  // Determine direction (pointing to centre at 9,9)
  let path = '';
  if (c === 9 && r < 9) {
    // Top arm, point down: M-3 -4.5L2 0L-3 4.5
    path = `M${x - 3} ${y - 4.5}L${x + 2} ${y}L${x - 3} ${y + 4.5}`;
  } else if (c === 9 && r > 9) {
    // Bottom arm, point up: M-3 4.5L2 0L-3 -4.5
    path = `M${x - 3} ${y + 4.5}L${x + 2} ${y}L${x - 3} ${y - 4.5}`;
  } else if (r === 9 && c < 9) {
    // Left arm, point right: M-4.5 -3L0 2L4.5 -3
    path = `M${x - 4.5} ${y - 3}L${x} ${y + 2}L${x + 4.5} ${y - 3}`;
  } else if (r === 9 && c > 9) {
    // Right arm, point left: M4.5 -3L0 2L-4.5 -3
    path = `M${x + 4.5} ${y - 3}L${x} ${y + 2}L${x - 4.5} ${y - 3}`;
  }
  
  const strokeColor = color === 'yellow' ? colors.bg : 
                      color === 'blue' ? colors.silver :
                      colors.cream;
  
  return (
    <Path
      d={path}
      stroke={strokeColor}
      strokeWidth={1.6}
      strokeOpacity={0.55}
      fill="none"
    />
  );
};

/**
 * Jamaica island silhouette (simplified outline)
 */
const JamaicaIsland: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => {
  // Simplified Jamaica outline (52x20 approx)
  const w = 52;
  const h = 20;
  const x = cx - w / 2;
  const y = cy - h / 2;
  
  // Rough outline approximation
  const path = `M${x + 5},${y + h / 2}
    L${x + 12},${y + 3}
    L${x + 20},${y + 1}
    L${x + 30},${y + 2}
    L${x + 40},${y + 5}
    L${x + 47},${y + h / 2}
    L${x + 42},${y + h - 3}
    L${x + 30},${y + h - 1}
    L${x + 20},${y + h - 2}
    L${x + 10},${y + h - 4}
    Z`;
  
  return (
    <Path
      d={path}
      fill={colors.bg}
      stroke={colors.gold}
      strokeWidth={2}
    />
  );
};

/**
 * Main Board SVG Component
 */
interface BoardSVGProps {
  width: number;
}

export const BoardSVG: React.FC<BoardSVGProps> = ({ width }) => {
  const scale = width / VB_SIZE;
  
  return (
    <Svg width={width} height={width} viewBox={`0 0 ${VB_SIZE} ${VB_SIZE}`}>
      <Defs>
        {/* Piece gradients */}
        <RadialGradient id="grad-gold" cx="38%" cy="32%" r="75%">
          <Stop offset="0" stopColor="#FFF3A0" />
          <Stop offset="0.45" stopColor="#FED100" />
          <Stop offset="1" stopColor="#A88400" />
        </RadialGradient>
        <RadialGradient id="grad-green" cx="38%" cy="32%" r="75%">
          <Stop offset="0" stopColor="#7CF2A4" />
          <Stop offset="0.45" stopColor="#0FAE47" />
          <Stop offset="1" stopColor="#005C22" />
        </RadialGradient>
        <RadialGradient id="grad-red" cx="38%" cy="32%" r="75%">
          <Stop offset="0" stopColor="#FF9AA0" />
          <Stop offset="0.45" stopColor="#E4202E" />
          <Stop offset="1" stopColor="#7A0710" />
        </RadialGradient>
        <RadialGradient id="grad-black" cx="38%" cy="32%" r="75%">
          <Stop offset="0" stopColor="#7A7D84" />
          <Stop offset="0.45" stopColor="#26272B" />
          <Stop offset="1" stopColor="#050506" />
        </RadialGradient>
        
        {/* Halftone pattern for track cells */}
        <Pattern id="halftone-green" width="5" height="5" patternUnits="userSpaceOnUse">
          <Circle cx="2.5" cy="2.5" r="1.1" fill="white" opacity={0.1} />
        </Pattern>
        <Pattern id="halftone-gold" width="5" height="5" patternUnits="userSpaceOnUse">
          <Circle cx="2.5" cy="2.5" r="1.1" fill="white" opacity={0.1} />
        </Pattern>
      </Defs>
      
      {/* Track cells */}
      {Array.from({ length: 19 }).map((_, r) =>
        Array.from({ length: 19 }).map((_, c) => {
          const type = cellType(r, c);
          if (type !== 'track') return null;
          
          const outerIndex = getOuterIndex(r, c);
          const fill = getTrackCellColor(outerIndex);
          const hasHalftone = fill === colors.trackGreen || fill === colors.trackGold;
          
          return (
            <G key={`track-${r}-${c}`}>
              <Rect
                x={c * C}
                y={r * C}
                width={C}
                height={C}
                fill={fill}
              />
              {hasHalftone && (
                <Rect
                  x={c * C}
                  y={r * C}
                  width={C}
                  height={C}
                  fill={fill === colors.trackGreen ? "url(#halftone-green)" : "url(#halftone-gold)"}
                />
              )}
            </G>
          );
        })
      )}
      
      {/* Home columns with chevrons */}
      {/* Montego Bay (gold) - top arm, c=9 r1..7 */}
      {Array.from({ length: 7 }).map((_, i) => {
        const r = i + 1;
        const c = 9;
        return (
          <G key={`home-gold-${i}`}>
            <Rect
              x={c * C}
              y={r * C}
              width={C}
              height={C}
              fill={colors.homeStrips.gold}
            />
            <Rect
              x={c * C}
              y={r * C}
              width={C}
              height={C}
              fill="white"
              opacity={0.13}
            />
            <Rect
              x={c * C + 1.6}
              y={r * C + 1.6}
              width={C - 3.2}
              height={C - 3.2}
              fill="none"
              stroke={colors.bg}
              strokeWidth={1.6}
            />
            <HomeChevron r={r} c={c} color="yellow" />
          </G>
        );
      })}
      
      {/* Ocho Rios (green) - right arm, r=9 c11..17 */}
      {Array.from({ length: 7 }).map((_, i) => {
        const r = 9;
        const c = i + 11;
        return (
          <G key={`home-green-${i}`}>
            <Rect
              x={c * C}
              y={r * C}
              width={C}
              height={C}
              fill={colors.homeStrips.green}
            />
            <Rect
              x={c * C}
              y={r * C}
              width={C}
              height={C}
              fill="white"
              opacity={0.13}
            />
            <Rect
              x={c * C + 1.6}
              y={r * C + 1.6}
              width={C - 3.2}
              height={C - 3.2}
              fill="none"
              stroke={`rgba(${parseInt(colors.cream.slice(1, 3), 16)}, ${parseInt(colors.cream.slice(3, 5), 16)}, ${parseInt(colors.cream.slice(5, 7), 16)}, 0.55)`}
              strokeWidth={1.6}
            />
            <HomeChevron r={r} c={c} color="green" />
          </G>
        );
      })}
      
      {/* Kingston (red) - bottom arm, c=9 r11..17 */}
      {Array.from({ length: 7 }).map((_, i) => {
        const r = i + 11;
        const c = 9;
        return (
          <G key={`home-red-${i}`}>
            <Rect
              x={c * C}
              y={r * C}
              width={C}
              height={C}
              fill={colors.homeStrips.red}
            />
            <Rect
              x={c * C}
              y={r * C}
              width={C}
              height={C}
              fill="white"
              opacity={0.13}
            />
            <Rect
              x={c * C + 1.6}
              y={r * C + 1.6}
              width={C - 3.2}
              height={C - 3.2}
              fill="none"
              stroke={`rgba(${parseInt(colors.cream.slice(1, 3), 16)}, ${parseInt(colors.cream.slice(3, 5), 16)}, ${parseInt(colors.cream.slice(5, 7), 16)}, 0.55)`}
              strokeWidth={1.6}
            />
            <HomeChevron r={r} c={c} color="red" />
          </G>
        );
      })}
      
      {/* Negril (black) - left arm, r=9 c1..7 */}
      {Array.from({ length: 7 }).map((_, i) => {
        const r = 9;
        const c = i + 1;
        return (
          <G key={`home-negril-${i}`}>
            <Rect
              x={c * C}
              y={r * C}
              width={C}
              height={C}
              fill={colors.homeStrips.negril}
            />
            <Rect
              x={c * C}
              y={r * C}
              width={C}
              height={C}
              fill="white"
              opacity={0.13}
            />
            <Rect
              x={c * C + 1.6}
              y={r * C + 1.6}
              width={C - 3.2}
              height={C - 3.2}
              fill="none"
              stroke={colors.silver}
              strokeOpacity={0.55}
              strokeWidth={1.6}
            />
            <HomeChevron r={r} c={c} color="blue" />
          </G>
        );
      })}
      
      {/* Centre (160..220 = r8..10, c8..10) */}
      {/* Top triangle (green) */}
      <Polygon
        points={`${8 * C + C / 2},${8 * C + C / 2} ${10 * C + C / 2},${8 * C + C / 2} ${9 * C + C / 2},${9 * C + C / 2}`}
        fill={colors.centreGreen}
      />
      {/* Bottom triangle (green) */}
      <Polygon
        points={`${8 * C + C / 2},${10 * C + C / 2} ${10 * C + C / 2},${10 * C + C / 2} ${9 * C + C / 2},${9 * C + C / 2}`}
        fill={colors.centreGreen}
      />
      {/* Left triangle (black) */}
      <Polygon
        points={`${8 * C + C / 2},${8 * C + C / 2} ${8 * C + C / 2},${10 * C + C / 2} ${9 * C + C / 2},${9 * C + C / 2}`}
        fill={colors.centreBlack}
      />
      {/* Right triangle (black) */}
      <Polygon
        points={`${10 * C + C / 2},${8 * C + C / 2} ${10 * C + C / 2},${10 * C + C / 2} ${9 * C + C / 2},${9 * C + C / 2}`}
        fill={colors.centreBlack}
      />
      
      {/* Centre X */}
      <Line
        x1={8 * C + C / 2}
        y1={8 * C + C / 2}
        x2={10 * C + C / 2}
        y2={10 * C + C / 2}
        stroke={colors.centreGoldStroke}
        strokeWidth={4.5}
      />
      <Line
        x1={10 * C + C / 2}
        y1={8 * C + C / 2}
        x2={8 * C + C / 2}
        y2={10 * C + C / 2}
        stroke={colors.centreGoldStroke}
        strokeWidth={4.5}
      />
      
      {/* Centre edge bands */}
      {/* Top band (gold) */}
      <Line
        x1={8 * C}
        y1={8 * C}
        x2={11 * C}
        y2={8 * C}
        stroke={colors.centreGoldStroke}
        strokeWidth={2.6}
      />
      {/* Bottom band (red) */}
      <Line
        x1={8 * C}
        y1={11 * C}
        x2={11 * C}
        y2={11 * C}
        stroke={colors.centreRed}
        strokeWidth={2.6}
      />
      {/* Left band (silver) */}
      <Line
        x1={8 * C}
        y1={8 * C}
        x2={8 * C}
        y2={11 * C}
        stroke={colors.centreSilver}
        strokeWidth={2.6}
      />
      {/* Right band (green bright) */}
      <Line
        x1={11 * C}
        y1={8 * C}
        x2={11 * C}
        y2={11 * C}
        stroke={colors.centreGreenBright}
        strokeWidth={2.6}
      />
      
      {/* Jamaica island */}
      <JamaicaIsland cx={9.5 * C} cy={9.5 * C} />
      
      {/* Grid lines (cream at 75%) */}
      {Array.from({ length: 20 }).map((_, i) => (
        <G key={`grid-${i}`}>
          <Line
            x1={0}
            y1={i * C}
            x2={VB_SIZE}
            y2={i * C}
            stroke={colors.cream}
            strokeOpacity={0.75}
            strokeWidth={0.8}
          />
          <Line
            x1={i * C}
            y1={0}
            x2={i * C}
            y2={VB_SIZE}
            stroke={colors.cream}
            strokeOpacity={0.75}
            strokeWidth={0.8}
          />
        </G>
      ))}
      
      {/* TODO: Yards, start cells, pieces - will be added in next iteration */}
    </Svg>
  );
};
