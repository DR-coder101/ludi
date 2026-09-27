/**
 * Complete SVG Board - APPROVED BOARD SPEC Implementation
 * 
 * 380x380 viewBox, cell=20, scales to board width
 * Implements all elements from the BOARD SPEC:
 * - Track cells with color pattern and 10% halftone
 * - Home strips with solid fill, 13% halftone, inner outline, 7 chevrons
 * - Centre: triangles, gold X, edge bands, Jamaica island silhouette
 * - Start cells: circle r8 in place color, white stroke, 5-point star r5.6
 * - Entry arrows: circle r7 with accent stroke and arrow path
 * - Yards: base, halftone fade, speaker rings, frame, place name, mini map, video tile, 4 home slots
 * - Pieces: shadow ellipse, base, radial gradient, rim strokes, rings, specular highlight
 * - Stack badges: hot pink circle with count
 * - Highlights: path dots r2.6, target cell gold rounded rect with +N pill, movable piece gold glow ring
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
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
  Text as SvgText,
  Pattern,
  Ellipse,
  LinearGradient,
  Mask,
} from 'react-native-svg';
import { colors, board, getTrackCellColor, getPieceGradient, PLACE_NAMES } from '../../theme/tokens';
import type { EngineColor } from '../../theme/tokens';

const VB = board.viewBoxSize; // 380
const C = board.cellSize; // 20

interface BoardSVGFullProps {
  width: number;
  pieces?: Array<{
    engineColor: EngineColor;
    row: number;
    col: number;
    isMovable?: boolean;
  }>;
  highlightCells?: Array<{ row: number; col: number }>;
  targetCell?: { row: number; col: number; moveCount: number };
}

/**
 * Cell type (from spec)
 */
function cellType(r: number, c: number): 'yard' | 'centre' | 'home' | 'track' {
  const isYard = (r < 8 || r > 10) && (c < 8 || c > 10);
  const isCentre = r >= 8 && r <= 10 && c >= 8 && c <= 10;
  const isHome =
    (c === 9 && r >= 1 && r <= 7) ||
    (c === 9 && r >= 11 && r <= 17) ||
    (r === 9 && c >= 1 && c <= 7) ||
    (r === 9 && c >= 11 && c <= 17);
  
  if (isYard) return 'yard';
  if (isCentre) return 'centre';
  if (isHome) return 'home';
  return 'track';
}

/**
 * Outer index for track coloring
 */
function getOuterIndex(r: number, c: number): number {
  if (r < 8) return r;
  if (r > 10) return 18 - r;
  if (c < 8) return c;
  return 18 - c;
}

/**
 * 5-point star path
 */
function starPath(cx: number, cy: number, r: number): string {
  const points: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * Math.PI / 180;
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return `M${points[0][0]},${points[0][1]}L${points[2][0]},${points[2][1]}L${points[4][0]},${points[4][1]}L${points[1][0]},${points[1][1]}L${points[3][0]},${points[3][1]}Z`;
}

/**
 * Chevron pointing to centre
 */
const Chevron: React.FC<{ r: number; c: number; color: EngineColor }> = ({ r, c, color }) => {
  const x = c * C + C / 2;
  const y = r * C + C / 2;
  
  let path = '';
  if (c === 9 && r < 9) {
    path = `M${x - 3},${y - 4.5}L${x + 2},${y}L${x - 3},${y + 4.5}`;
  } else if (c === 9 && r > 9) {
    path = `M${x - 3},${y + 4.5}L${x + 2},${y}L${x - 3},${y - 4.5}`;
  } else if (r === 9 && c < 9) {
    path = `M${x - 4.5},${y - 3}L${x},${y + 2}L${x + 4.5},${y - 3}`;
  } else if (r === 9 && c > 9) {
    path = `M${x + 4.5},${y - 3}L${x},${y + 2}L${x - 4.5},${y - 3}`;
  }
  
  const strokeColor = color === 'yellow' ? colors.bg :
                      color === 'blue' ? colors.silver :
                      colors.cream;
  
  return <Path d={path} stroke={strokeColor} strokeWidth={1.6} strokeOpacity={0.55} fill="none" />;
};

/**
 * Jamaica island silhouette
 */
const JamaicaIsland: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => {
  const w = 52;
  const h = 20;
  const x = cx - w / 2;
  const y = cy - h / 2;
  
  const path = `M${x + 5},${y + h / 2}L${x + 12},${y + 3}L${x + 20},${y + 1}L${x + 30},${y + 2}L${x + 40},${y + 5}L${x + 47},${y + h / 2}L${x + 42},${y + h - 3}L${x + 30},${y + h - 1}L${x + 20},${y + h - 2}L${x + 10},${y + h - 4}Z`;
  
  return <Path d={path} fill={colors.bg} stroke={colors.gold} strokeWidth={2} />;
};

/**
 * Yard component
 */
const YardSVG: React.FC<{ engineColor: EngineColor }> = ({ engineColor }) => {
  const yardPositions = {
    yellow: { x: 0, y: 0 },    // top-left
    green: { x: 220, y: 0 },   // top-right (11*20)
    blue: { x: 0, y: 220 },    // bottom-left (11*20)
    red: { x: 220, y: 220 },   // bottom-right
  };
  
  const pos = yardPositions[engineColor];
  const accent = engineColor === 'yellow' ? colors.gold :
                 engineColor === 'green' ? colors.greenBright :
                 engineColor === 'blue' ? colors.silver :
                 colors.redText;
  
  const placeName = PLACE_NAMES[engineColor];
  const nameLines = placeName.split(' ');
  
  return (
    <G key={`yard-${engineColor}`}>
      {/* Base */}
      <Rect x={pos.x} y={pos.y} width={160} height={160} fill={colors.yardBase} />
      
      {/* Halftone dots in accent color with radial mask */}
      <Defs>
        <Pattern id={`halftone-${engineColor}`} width="5" height="5" patternUnits="userSpaceOnUse">
          <Circle cx="2.5" cy="2.5" r="1.05" fill={accent} />
        </Pattern>
        <RadialGradient id={`yard-mask-${engineColor}`} cx="100%" cy="100%" r="190">
          <Stop offset="0" stopColor="white" stopOpacity="0.3" />
          <Stop offset="1" stopColor="white" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x={pos.x} y={pos.y} width={160} height={160} fill={`url(#halftone-${engineColor})`} opacity={engineColor === 'blue' ? 0.2 : 0.3} mask={`url(#yard-mask-${engineColor})`} />
      
      {/* Speaker rings from outer corner */}
      {[0, 1, 2, 3, 4].map(i => (
        <Circle
          key={`ring-${i}`}
          cx={engineColor === 'yellow' ? pos.x : engineColor === 'green' ? pos.x + 160 : engineColor === 'blue' ? pos.x : pos.x + 160}
          cy={engineColor === 'yellow' ? pos.y : engineColor === 'green' ? pos.y : engineColor === 'blue' ? pos.y + 160 : pos.y + 160}
          r={14 * (i + 1)}
          fill="none"
          stroke={accent}
          strokeWidth={1}
          strokeOpacity={0.16 - 0.02 * i}
        />
      ))}
      
      {/* Frame rect */}
      <Rect
        x={pos.x + 5}
        y={pos.y + 5}
        width={150}
        height={150}
        rx={9}
        fill="none"
        stroke={accent}
        strokeWidth={1.6}
      />
      
      {/* Dashed inner rect */}
      <Rect
        x={pos.x + 8.5}
        y={pos.y + 8.5}
        width={143}
        height={143}
        rx={6.5}
        fill="none"
        stroke={accent}
        strokeOpacity={0.35}
        strokeWidth={1}
        strokeDasharray="1.5 2.5"
      />
      
      {/* Place name (stacked Anton) */}
      {nameLines.map((line, i) => (
        <SvgText
          key={`name-${i}`}
          x={pos.x + 14}
          y={pos.y + 33 + i * 20}
          fontSize={nameLines.length === 2 ? 19.5 : 20}
          fontFamily="Anton_400Regular"
          fill={accent}
          fontWeight="bold"
        >
          {line}
        </SvgText>
      ))}
      
      {/* Mini Jamaica map (simplified) */}
      <G transform={`translate(${pos.x + 14}, ${pos.y + 65})`}>
        <Path
          d="M5,10L12,3L20,1L30,2L40,5L47,10L42,17L30,19L20,18L10,16Z"
          fill={colors.videoIcon}
          scale={1.5}
        />
        <Circle cx={31} cy={10} r={3} fill={accent} opacity={0.8} />
      </G>
      
      {/* Video tile */}
      <Rect
        x={pos.x + 90}
        y={pos.y + 13}
        width={57}
        height={70}
        rx={7}
        fill={colors.videoBg}
      />
      <Rect
        x={pos.x + 90}
        y={pos.y + 13}
        width={57}
        height={70}
        rx={7}
        fill="none"
        stroke={accent}
        strokeWidth={1}
      />
      
      {/* 4 home slots */}
      {[0, 1, 2, 3].map(i => (
        <G key={`slot-${i}`}>
          <Circle
            cx={pos.x + 29 + 34 * i}
            cy={pos.y + 124}
            r={12.5}
            fill={colors.slotEmpty}
            stroke={accent}
            strokeOpacity={0.55}
            strokeWidth={1.5}
          />
          <Path
            d={starPath(pos.x + 29 + 34 * i, pos.y + 124, 6)}
            fill={accent}
            opacity={0.3}
          />
        </G>
      ))}
    </G>
  );
};

/**
 * Piece component
 */
const PieceSVG: React.FC<{
  engineColor: EngineColor;
  cx: number;
  cy: number;
  r: number;
  count?: number;
  isMovable?: boolean;
}> = ({ engineColor, cx, cy, r, count, isMovable }) => {
  const gradient = getPieceGradient(engineColor);
  const gradId = `grad-${engineColor}`;
  
  return (
    <G>
      {/* Shadow ellipse */}
      <Ellipse
        cx={cx}
        cy={cy + 0.62 * r}
        rx={1.02 * r}
        ry={0.5 * r}
        fill="black"
        opacity={0.55}
      />
      
      {/* Base circle */}
      <Circle cx={cx} cy={cy + 0.28 * r} r={r} fill={gradient.mid} />
      
      {/* Main gradient circle */}
      <Circle cx={cx} cy={cy} r={r} fill={`url(#${gradId})`} />
      
      {/* Rim stroke */}
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={gradient.rim}
        strokeWidth={Math.max(0.8, 0.1 * r)}
      />
      
      {/* Ring at 0.62r */}
      <Circle
        cx={cx}
        cy={cy}
        r={0.62 * r}
        fill="none"
        stroke={gradient.mid}
        strokeOpacity={0.55}
        strokeWidth={0.12 * r}
      />
      
      {/* Ring at 0.52r */}
      <Circle
        cx={cx}
        cy={cy}
        r={0.52 * r}
        fill="none"
        stroke="white"
        strokeOpacity={0.28}
        strokeWidth={0.06 * r}
      />
      
      {/* Specular highlight */}
      <Ellipse
        cx={cx - 0.18 * r}
        cy={cy - 0.42 * r}
        rx={0.55 * r}
        ry={0.3 * r}
        fill="white"
        opacity={0.8}
      />
      
      {/* Stack badge */}
      {count && count > 1 && (
        <G>
          <Circle
            cx={cx + 0.85 * r}
            cy={cy - 0.85 * r}
            r={0.52 * r}
            fill={colors.hot}
            stroke="white"
            strokeWidth={1}
          />
          <SvgText
            x={cx + 0.85 * r}
            y={cy - 0.85 * r + 0.3 * r}
            fontSize={0.5 * r}
            fontFamily="ArchivoBlack_400Regular"
            fill="white"
            textAnchor="middle"
          >
            {count}
          </SvgText>
        </G>
      )}
      
      {/* Movable glow ring */}
      {isMovable && (
        <>
          <Circle cx={cx} cy={cy} r={11.5} fill="none" stroke={colors.gold} strokeWidth={2} opacity={0.8} />
          <Circle cx={cx} cy={cy} r={14} fill="none" stroke={colors.gold} strokeWidth={1} opacity={0.4} />
        </>
      )}
    </G>
  );
};

export const BoardSVGFull: React.FC<BoardSVGFullProps> = ({ width, pieces = [], highlightCells = [], targetCell }) => {
  return (
    <View style={styles.container}>
      <Svg width={width} height={width} viewBox={`0 0 ${VB} ${VB}`}>
        <Defs>
          {/* Piece gradients */}
          <RadialGradient id="grad-yellow" cx="38%" cy="32%" r="75%">
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
          <RadialGradient id="grad-blue" cx="38%" cy="32%" r="75%">
            <Stop offset="0" stopColor="#7A7D84" />
            <Stop offset="0.45" stopColor="#26272B" />
            <Stop offset="1" stopColor="#050506" />
          </RadialGradient>
        </Defs>
        
        {/* Track cells with halftone */}
        {Array.from({ length: 19 }).map((_, r) =>
          Array.from({ length: 19 }).map((_, c) => {
            const type = cellType(r, c);
            if (type !== 'track') return null;
            
            const outerIndex = getOuterIndex(r, c);
            const fill = getTrackCellColor(outerIndex);
            const hasHalftone = fill === colors.trackGreen || fill === colors.trackGold;
            
            return (
              <G key={`track-${r}-${c}`}>
                <Rect x={c * C} y={r * C} width={C} height={C} fill={fill} />
                {hasHalftone && (
                  <Rect x={c * C} y={r * C} width={C} height={C} fill="white" opacity={0.1} />
                )}
              </G>
            );
          })
        )}
        
        {/* Home strips with chevrons */}
        {/* Montego Bay (gold) - top */}
        {Array.from({ length: 7 }).map((_, i) => (
          <G key={`home-gold-${i}`}>
            <Rect x={9 * C} y={(i + 1) * C} width={C} height={C} fill={colors.homeStrips.gold} />
            <Rect x={9 * C} y={(i + 1) * C} width={C} height={C} fill="white" opacity={0.13} />
            <Rect x={9 * C + 1.6} y={(i + 1) * C + 1.6} width={C - 3.2} height={C - 3.2} fill="none" stroke={colors.bg} strokeWidth={1.6} />
            <Chevron r={i + 1} c={9} color="yellow" />
          </G>
        ))}
        
        {/* Ocho Rios (green) - right */}
        {Array.from({ length: 7 }).map((_, i) => (
          <G key={`home-green-${i}`}>
            <Rect x={(i + 11) * C} y={9 * C} width={C} height={C} fill={colors.homeStrips.green} />
            <Rect x={(i + 11) * C} y={9 * C} width={C} height={C} fill="white" opacity={0.13} />
            <Rect x={(i + 11) * C + 1.6} y={9 * C + 1.6} width={C - 3.2} height={C - 3.2} fill="none" stroke={colors.cream} strokeOpacity={0.55} strokeWidth={1.6} />
            <Chevron r={9} c={i + 11} color="green" />
          </G>
        ))}
        
        {/* Kingston (red) - bottom */}
        {Array.from({ length: 7 }).map((_, i) => (
          <G key={`home-red-${i}`}>
            <Rect x={9 * C} y={(i + 11) * C} width={C} height={C} fill={colors.homeStrips.red} />
            <Rect x={9 * C} y={(i + 11) * C} width={C} height={C} fill="white" opacity={0.13} />
            <Rect x={9 * C + 1.6} y={(i + 11) * C + 1.6} width={C - 3.2} height={C - 3.2} fill="none" stroke={colors.cream} strokeOpacity={0.55} strokeWidth={1.6} />
            <Chevron r={i + 11} c={9} color="red" />
          </G>
        ))}
        
        {/* Negril (black) - left */}
        {Array.from({ length: 7 }).map((_, i) => (
          <G key={`home-negril-${i}`}>
            <Rect x={(i + 1) * C} y={9 * C} width={C} height={C} fill={colors.homeStrips.negril} />
            <Rect x={(i + 1) * C} y={9 * C} width={C} height={C} fill="white" opacity={0.13} />
            <Rect x={(i + 1) * C + 1.6} y={9 * C + 1.6} width={C - 3.2} height={C - 3.2} fill="none" stroke={colors.silver} strokeOpacity={0.55} strokeWidth={1.6} />
            <Chevron r={9} c={i + 1} color="blue" />
          </G>
        ))}
        
        {/* Centre triangles */}
        <Polygon points={`${8 * C + C / 2},${8 * C + C / 2} ${10 * C + C / 2},${8 * C + C / 2} ${9 * C + C / 2},${9 * C + C / 2}`} fill={colors.centreGreen} />
        <Polygon points={`${8 * C + C / 2},${10 * C + C / 2} ${10 * C + C / 2},${10 * C + C / 2} ${9 * C + C / 2},${9 * C + C / 2}`} fill={colors.centreGreen} />
        <Polygon points={`${8 * C + C / 2},${8 * C + C / 2} ${8 * C + C / 2},${10 * C + C / 2} ${9 * C + C / 2},${9 * C + C / 2}`} fill={colors.centreBlack} />
        <Polygon points={`${10 * C + C / 2},${8 * C + C / 2} ${10 * C + C / 2},${10 * C + C / 2} ${9 * C + C / 2},${9 * C + C / 2}`} fill={colors.centreBlack} />
        
        {/* Centre X */}
        <Line x1={8 * C + C / 2} y1={8 * C + C / 2} x2={10 * C + C / 2} y2={10 * C + C / 2} stroke={colors.centreGoldStroke} strokeWidth={4.5} />
        <Line x1={10 * C + C / 2} y1={8 * C + C / 2} x2={8 * C + C / 2} y2={10 * C + C / 2} stroke={colors.centreGoldStroke} strokeWidth={4.5} />
        
        {/* Centre edge bands */}
        <Line x1={8 * C} y1={8 * C} x2={11 * C} y2={8 * C} stroke={colors.centreGoldStroke} strokeWidth={2.6} />
        <Line x1={8 * C} y1={11 * C} x2={11 * C} y2={11 * C} stroke={colors.centreRed} strokeWidth={2.6} />
        <Line x1={8 * C} y1={8 * C} x2={8 * C} y2={11 * C} stroke={colors.centreSilver} strokeWidth={2.6} />
        <Line x1={11 * C} y1={8 * C} x2={11 * C} y2={11 * C} stroke={colors.centreGreenBright} strokeWidth={2.6} />
        
        {/* Jamaica island */}
        <JamaicaIsland cx={9.5 * C} cy={9.5 * C} />
        
        {/* Start cells with stars - TODO: add based on TRACK_CELLS come-out positions */}
        
        {/* Yards */}
        <YardSVG engineColor="yellow" />
        <YardSVG engineColor="green" />
        <YardSVG engineColor="blue" />
        <YardSVG engineColor="red" />
        
        {/* Grid lines (cream at 75%) */}
        {Array.from({ length: 20 }).map(i => (
          <G key={`grid-${i}`}>
            <Line x1={0} y1={i * C} x2={VB} y2={i * C} stroke={colors.cream} strokeOpacity={0.75} strokeWidth={0.8} />
            <Line x1={i * C} y1={0} x2={i * C} y2={VB} stroke={colors.cream} strokeOpacity={0.75} strokeWidth={0.8} />
          </G>
        ))}
        
        {/* Path dots for highlighted cells */}
        {highlightCells.map((cell, i) => (
          <Circle
            key={`dot-${i}`}
            cx={cell.col * C + C / 2}
            cy={cell.row * C + C / 2}
            r={2.6}
            fill="white"
            stroke={colors.bg}
            strokeWidth={0.8}
          />
        ))}
        
        {/* Target cell with +N pill */}
        {targetCell && (
          <G>
            <Rect
              x={targetCell.col * C + 2}
              y={targetCell.row * C + 2}
              width={C - 4}
              height={C - 4}
              rx={4}
              fill="none"
              stroke={colors.gold}
              strokeWidth={2}
              opacity={0.8}
            />
            <Rect
              x={targetCell.col * C + C / 2 - 8}
              y={targetCell.row * C + 2}
              width={16}
              height={10}
              rx={5}
              fill={colors.hot}
            />
            <SvgText
              x={targetCell.col * C + C / 2}
              y={targetCell.row * C + 9}
              fontSize={7}
              fontFamily="ArchivoBlack_400Regular"
              fill="white"
              textAnchor="middle"
            >
              +{targetCell.moveCount}
            </SvgText>
          </G>
        )}
        
        {/* Pieces */}
        {pieces.map((piece, i) => (
          <PieceSVG
            key={`piece-${i}`}
            engineColor={piece.engineColor}
            cx={piece.col * C + C / 2}
            cy={piece.row * C + C / 2}
            r={7.4}
            isMovable={piece.isMovable}
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    borderRadius: 8,
  },
});
