import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Grid } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_SIZE = SCREEN_WIDTH - 32;
const CELL_SIZE = GRID_SIZE / 9;

interface Props {
  originalGrid: Grid;
  currentGrid: Grid;
  hintRow?: number;
  hintCol?: number;
  hintCells: Set<number>;   // cells revealed by hints or manually entered
  solvedCells: Set<number>; // cells from full-solve
  onCellPress?: (row: number, col: number) => void;
  selectedCell?: { row: number; col: number } | null;
}

const COLORS = {
  given: '#1a1a2e',
  hint: '#c0580a',       // darker orange — clearly visible on white
  solved: '#1565c0',     // stronger blue
  selected: '#dbeafe',   // soft blue highlight
  highlighted: '#fff3e0',
  boxBorder: '#1a1a2e',
  cellBorder: '#b0bec5',
  background: '#ffffff',
};

export default function SudokuGrid({
  originalGrid,
  currentGrid,
  hintRow,
  hintCol,
  hintCells,
  solvedCells,
  onCellPress,
  selectedCell,
}: Props) {
  return (
    <View style={styles.grid}>
      {currentGrid.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((value, c) => {
            const key = r * 9 + c;
            const isGiven = originalGrid[r][c] !== 0;
            const isHintHighlight = r === hintRow && c === hintCol;
            const isHintCell = hintCells.has(key);
            const isSolvedCell = solvedCells.has(key);
            const isSelected = selectedCell?.row === r && selectedCell?.col === c;

            // Background
            let bgColor = COLORS.background;
            if (isHintHighlight) bgColor = COLORS.highlighted;
            else if (isSelected)  bgColor = COLORS.selected;

            // Text colour
            let textColor = COLORS.given;
            if (isHintHighlight || isHintCell) textColor = COLORS.hint;
            else if (isSolvedCell)             textColor = COLORS.solved;

            // Border weights for 3×3 box boundaries
            const rightBorder =
              (c + 1) % 3 === 0 && c !== 8
                ? { borderRightWidth: 2,   borderRightColor:  COLORS.boxBorder }
                : { borderRightWidth: 0.5, borderRightColor:  COLORS.cellBorder };

            const bottomBorder =
              (r + 1) % 3 === 0 && r !== 8
                ? { borderBottomWidth: 2,   borderBottomColor: COLORS.boxBorder }
                : { borderBottomWidth: 0.5, borderBottomColor: COLORS.cellBorder };

            // Bold for: given cells, hint highlights, hint cells (manually entered
            // or revealed by hint engine), solved cells — everything with a value
            const isBold = isGiven || isHintHighlight || isHintCell || isSolvedCell;

            return (
              <TouchableOpacity
                key={c}
                style={[styles.cell, rightBorder, bottomBorder, { backgroundColor: bgColor }]}
                onPress={() => onCellPress?.(r, c)}
                activeOpacity={0.7}
              >
                {value !== 0 && (
                  <Text
                    style={[
                      styles.cellText,
                      { color: textColor },
                      isBold && styles.boldText,
                    ]}
                  >
                    {value}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderWidth: 2.5,
    borderColor: '#1a1a2e',
    backgroundColor: '#ecf0f1',
    alignSelf: 'center',
  },
  row: { flexDirection: 'row' },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: CELL_SIZE * 0.52,
    lineHeight: CELL_SIZE * 0.58,
  },
  boldText: {
    fontWeight: '700',
  },
});
