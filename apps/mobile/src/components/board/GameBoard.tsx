import React, { useMemo, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, Polygon } from 'react-native-svg';
import type { GameState, TokenPos } from '@ludi/rules';
import {
  TRACK_CELLS,
  YARDS,
  HOME_COLUMNS,
  CENTER_TRIANGLES,
  SAFE_CELLS,
  START_CELLS,
  BOARD_SIZE,
  COLORS,
  THEME,
  COUNTY_NAMES,
  type Color,
  type CellPosition,
} from './boardLayout';
import { Token } from './Token';
import { AnimatedToken } from './AnimatedToken';
import { gameAudio, triggerHaptic } from '../../utils/gameAudio';

interface GameBoardProps {
  width: number;
  gameState: GameState;
  legalTokenIndices: number[];
  onTokenPress: (tokenIndex: number) => void;
  animatingToken?: {
    tokenIndex: number;
    from: TokenPos;
    to: TokenPos;
  } | null;
  capturedToken?: {
    tokenIndex: number;
    pos: TokenPos;
  } | null;
  onAnimationComplete?: () => void;
}

const COLORS_ARRAY: Color[] = ['red', 'green', 'yellow', 'blue'];

const MemoizedTrackCell = memo<{
  cell: CellPosition;
  index: number;
  cellSize: number;
  isSafe: boolean;
  isStart: boolean;
}>(({ cell, index, cellSize, isSafe, isStart }) => (
  <React.Fragment key={`track-${index}`}>
    <Rect
      x={cell.col * cellSize}
      y={cell.row * cellSize}
      width={cellSize}
      height={cellSize}
      fill={isStart ? THEME.comeOut : THEME.board}
      stroke={THEME.grid}
      strokeWidth={1}
      opacity={isStart ? 1 : 0.3}
    />
    {isSafe && !isStart && (
      <Circle
        cx={cell.col * cellSize + cellSize / 2}
        cy={cell.row * cellSize + cellSize / 2}
        r={cellSize * 0.2}
        fill={THEME.safe}
      />
    )}
  </React.Fragment>
));

MemoizedTrackCell.displayName = 'MemoizedTrackCell';

function getTokenCoordinates(pos: TokenPos, color: Color): CellPosition | null {
  if (pos.zone === 'yard') {
    const yard = YARDS[color];
    return yard.tokenPositions[0];
  }
  
  if (pos.zone === 'track') {
    return TRACK_CELLS[pos.cell];
  }
  
  if (pos.zone === 'homeColumn') {
    const column = HOME_COLUMNS[color];
    return column.cells[pos.step - 1];
  }
  
  if (pos.zone === 'home') {
    const centerPos: Record<Color, CellPosition> = {
      red: { row: 9.5, col: 9 },
      green: { row: 9, col: 9.5 },
      yellow: { row: 8.5, col: 9 },
      blue: { row: 9, col: 8.5 },
    };
    return centerPos[color];
  }
  
  return null;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  width,
  gameState,
  legalTokenIndices,
  onTokenPress,
  animatingToken,
  capturedToken,
  onAnimationComplete,
}) => {
  const cellSize = width / BOARD_SIZE;
  const boardHeight = BOARD_SIZE * cellSize;

  const tokenPositions = useMemo(() => {
    const positions: Map<string, { color: Color; tokenIndex: number; count: number }[]> = new Map();
    
    gameState.tokens.forEach((token, index) => {
      const coords = getTokenCoordinates(token.pos, token.color);
      if (!coords) return;
      
      const key = `${coords.row},${coords.col}`;
      const existing = positions.get(key) || [];
      existing.push({ color: token.color, tokenIndex: index, count: existing.length });
      positions.set(key, existing);
    });
    
    return positions;
  }, [gameState.tokens]);

  const renderGrid = () => {
    const lines = [];
    for (let i = 0; i <= BOARD_SIZE; i++) {
      lines.push(
        <Rect
          key={`h-${i}`}
          x={0}
          y={i * cellSize}
          width={width}
          height={1}
          fill={THEME.grid}
          opacity={0.2}
        />
      );
      lines.push(
        <Rect
          key={`v-${i}`}
          x={i * cellSize}
          y={0}
          width={1}
          height={boardHeight}
          fill={THEME.grid}
          opacity={0.2}
        />
      );
    }
    return lines;
  };

  const renderYards = () => {
    return null;
  };

  const renderHomeColumns = () => {
    return COLORS_ARRAY.map((color) => {
      if (!gameState.config.playerColors.includes(color)) return null;
      const column = HOME_COLUMNS[color];
      return column.cells.map((cell, index) => {
        const patternIndex = index % THEME.homePattern.length;
        return (
          <Rect
            key={`home-${color}-${index}`}
            x={cell.col * cellSize}
            y={cell.row * cellSize}
            width={cellSize}
            height={cellSize}
            fill={THEME.homePattern[patternIndex]}
          />
        );
      });
    });
  };

  const renderCenterTriangles = () => {
    const colorMap: Record<Color, string> = {
      red: THEME.centerTopBottom,
      green: THEME.centerLeftRight,
      yellow: THEME.centerTopBottom,
      blue: THEME.centerLeftRight,
    };
    
    return COLORS_ARRAY.map((color) => {
      if (!gameState.config.playerColors.includes(color)) return null;
      const triangle = CENTER_TRIANGLES[color];
      const points = triangle
        .map((cell) => {
          const x = cell.col * cellSize + cellSize / 2;
          const y = cell.row * cellSize + cellSize / 2;
          return `${x},${y}`;
        })
        .join(' ');

      return (
        <Polygon
          key={`triangle-${color}`}
          points={points}
          fill={colorMap[color]}
        />
      );
    });
  };

  const renderTrackCells = () => {
    return TRACK_CELLS.map((cell, index) => {
      const isSafe = SAFE_CELLS.includes(index);
      const isStart = Object.values(START_CELLS).includes(index);

      return (
        <MemoizedTrackCell
          key={`track-${index}`}
          cell={cell}
          index={index}
          cellSize={cellSize}
          isSafe={isSafe}
          isStart={isStart}
        />
      );
    });
  };

  const renderTokens = () => {
    const tokens: JSX.Element[] = [];
    
    gameState.tokens.forEach((token, index) => {
      if (animatingToken && animatingToken.tokenIndex === index) {
        return;
      }
      
      if (capturedToken && capturedToken.tokenIndex === index) {
        return;
      }
      
      const coords = getTokenCoordinates(token.pos, token.color);
      if (!coords) return;
      
      const key = `${coords.row},${coords.col}`;
      const stackInfo = tokenPositions.get(key);
      const stackIndex = stackInfo?.findIndex(t => t.tokenIndex === index) ?? 0;
      const stackCount = stackInfo?.length ?? 1;
      
      let offsetX = coords.col;
      let offsetY = coords.row;
      
      if (stackCount > 1 && token.pos.zone === 'yard') {
        const yard = YARDS[token.color];
        const yardToken = yard.tokenPositions[stackIndex % 4];
        offsetX = yardToken.col;
        offsetY = yardToken.row;
      } else if (stackCount > 1) {
        const angle = (stackIndex / stackCount) * Math.PI * 2;
        offsetX += Math.cos(angle) * 0.15;
        offsetY += Math.sin(angle) * 0.15;
      }
      
      const isLegal = legalTokenIndices.includes(index);
      
      tokens.push(
        <Token
          key={`token-${token.color}-${token.index}-${index}`}
          color={token.color}
          x={offsetX}
          y={offsetY}
          cellSize={cellSize}
          isLegal={isLegal}
          onPress={isLegal ? () => onTokenPress(index) : undefined}
        />
      );
    });
    
    return tokens;
  };

  const renderAnimations = () => {
    const animations: JSX.Element[] = [];
    
    if (animatingToken) {
      const token = gameState.tokens[animatingToken.tokenIndex];
      const fromCoords = getTokenCoordinates(animatingToken.from, token.color);
      const toCoords = getTokenCoordinates(animatingToken.to, token.color);
      
      if (fromCoords && toCoords) {
        animations.push(
          <AnimatedToken
            key={`anim-${animatingToken.tokenIndex}`}
            color={token.color}
            startX={fromCoords.col}
            startY={fromCoords.row}
            endX={toCoords.col}
            endY={toCoords.row}
            cellSize={cellSize}
            onAnimationComplete={onAnimationComplete}
          />
        );
      }
    }
    
    if (capturedToken) {
      const token = gameState.tokens[capturedToken.tokenIndex];
      const coords = getTokenCoordinates(capturedToken.pos, token.color);
      
      if (coords) {
        animations.push(
          <AnimatedToken
            key={`capture-${capturedToken.tokenIndex}`}
            color={token.color}
            startX={coords.col}
            startY={coords.row}
            endX={coords.col}
            endY={coords.row}
            cellSize={cellSize}
            isCaptured={true}
            onAnimationComplete={onAnimationComplete}
          />
        );
      }
    }
    
    return animations;
  };

  return (
    <View style={styles.container}>
      <Svg width={width} height={boardHeight}>
        {renderGrid()}
        {renderYards()}
        {renderHomeColumns()}
        {renderCenterTriangles()}
        {renderTrackCells()}
        {renderTokens()}
        {renderAnimations()}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.board,
    borderRadius: 8,
  },
});
