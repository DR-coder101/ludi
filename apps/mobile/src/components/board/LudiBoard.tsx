import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, Polygon } from 'react-native-svg';
import {
  TRACK_CELLS,
  YARDS,
  HOME_COLUMNS,
  CENTER_TRIANGLES,
  SAFE_CELLS,
  START_CELLS,
  BOARD_SIZE,
  COLORS,
  type Color,
} from './boardLayout';
import { Token } from './Token';

interface LudiBoardProps {
  width: number;
}

const COLORS_ARRAY: Color[] = ['red', 'green', 'yellow', 'blue'];

export const LudiBoard: React.FC<LudiBoardProps> = ({ width }) => {
  const cellSize = width / BOARD_SIZE;
  const boardHeight = BOARD_SIZE * cellSize;

  const renderGrid = () => {
    const lines = [];
    for (let i = 0; i <= BOARD_SIZE; i++) {
      lines.push(
        <Rect
          key={`h-${i}`}
          x={0}
          y={i * cellSize}
          width={width}
          height={0.5}
          fill="#ccc"
        />
      );
      lines.push(
        <Rect
          key={`v-${i}`}
          x={i * cellSize}
          y={0}
          width={0.5}
          height={boardHeight}
          fill="#ccc"
        />
      );
    }
    return lines;
  };

  const renderYards = () => {
    return COLORS_ARRAY.map((color) => {
      const yard = YARDS[color];
      return (
        <Rect
          key={`yard-${color}`}
          x={yard.topLeft.col * cellSize}
          y={yard.topLeft.row * cellSize}
          width={cellSize * 8}
          height={cellSize * 8}
          fill={COLORS[color]}
          opacity={0.3}
          stroke={COLORS[color]}
          strokeWidth={2}
        />
      );
    });
  };

  const renderHomeColumns = () => {
    return COLORS_ARRAY.map((color) => {
      const column = HOME_COLUMNS[color];
      return column.cells.map((cell, index) => (
        <Rect
          key={`home-${color}-${index}`}
          x={cell.col * cellSize}
          y={cell.row * cellSize}
          width={cellSize}
          height={cellSize}
          fill={COLORS[color]}
          opacity={0.4}
        />
      ));
    });
  };

  const renderCenterTriangles = () => {
    return COLORS_ARRAY.map((color) => {
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
          fill={COLORS[color]}
          opacity={0.6}
        />
      );
    });
  };

  const renderTrackCells = () => {
    return TRACK_CELLS.map((cell, index) => {
      const isSafe = SAFE_CELLS.includes(index);
      const isStart = Object.values(START_CELLS).includes(index);

      return (
        <React.Fragment key={`track-${index}`}>
          <Rect
            x={cell.col * cellSize}
            y={cell.row * cellSize}
            width={cellSize}
            height={cellSize}
            fill={isSafe ? '#FFD700' : isStart ? '#FFA500' : '#fff'}
            stroke="#888"
            strokeWidth={1}
          />
          {isSafe && (
            <Circle
              cx={cell.col * cellSize + cellSize / 2}
              cy={cell.row * cellSize + cellSize / 2}
              r={cellSize * 0.15}
              fill="#fff"
            />
          )}
        </React.Fragment>
      );
    });
  };

  const renderTokens = () => {
    const tokens: JSX.Element[] = [];
    COLORS_ARRAY.forEach((color, colorIndex) => {
      const yard = YARDS[color];
      yard.tokenPositions.forEach((pos, tokenIndex) => {
        tokens.push(
          <Token
            key={`token-${color}-${tokenIndex}`}
            color={color}
            x={pos.col}
            y={pos.row}
            cellSize={cellSize}
          />
        );
      });
    });
    return tokens;
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
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
  },
});
