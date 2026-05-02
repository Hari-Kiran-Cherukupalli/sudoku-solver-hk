import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import HintCard from '../components/HintCard';
import NumberPad from '../components/NumberPad';
import SudokuGrid from '../components/SudokuGrid';
import { Grid, Hint } from '../types';
import { cloneGrid, getNextHint, isComplete, solveSudoku } from '../utils/sudokuSolver';

interface Props {
  /** Locked "given" cells (all-zero for OCR / manual-entry puzzles). */
  originalGrid: Grid;
  /**
   * Optional pre-filled cells that are editable (used for OCR results).
   * When supplied, these values are shown as hint-coloured but can be changed.
   */
  prefilledGrid?: Grid;
  onReset: () => void;
}

export default function SolverScreen({ originalGrid, prefilledGrid, onReset }: Props) {
  // Start with prefilledGrid (OCR result) if provided, otherwise the given grid
  const [currentGrid, setCurrentGrid] = useState<Grid>(() =>
    cloneGrid(prefilledGrid ?? originalGrid)
  );

  // Track which cells were entered by the user or revealed by hints
  const [hintCells, setHintCells] = useState<Set<number>>(() => {
    if (!prefilledGrid) return new Set();
    const s = new Set<number>();
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (prefilledGrid[r][c] !== 0) s.add(r * 9 + c);
    return s;
  });

  const [solvedCells, setSolvedCells] = useState<Set<number>>(new Set());
  const [activeHint, setActiveHint] = useState<Hint | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [isSolved, setIsSolved] = useState(false);

  const hintCardAnim = useRef(new Animated.Value(0)).current;

  // Animate hint card in/out
  useEffect(() => {
    Animated.spring(hintCardAnim, {
      toValue: activeHint ? 1 : 0,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
    }).start();
  }, [activeHint]);

  // ── "Solve the Sudoku" ─────────────────────────────────────────────────────
  const handleSolveAll = useCallback(() => {
    const solved = solveSudoku(currentGrid);
    if (!solved) {
      Alert.alert('No Solution', 'This puzzle has no valid solution. Please check the numbers you entered.');
      return;
    }

    const newSolvedCells = new Set(solvedCells);
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (originalGrid[r][c] === 0 && !hintCells.has(r * 9 + c))
          newSolvedCells.add(r * 9 + c);

    setCurrentGrid(solved);
    setSolvedCells(newSolvedCells);
    setActiveHint(null);
    setSelectedCell(null);
    setIsSolved(true);
  }, [currentGrid, originalGrid, hintCells, solvedCells]);

  // ── "Give One Number" ──────────────────────────────────────────────────────
  const handleGiveHint = useCallback(() => {
    if (isComplete(currentGrid)) {
      Alert.alert('Complete!', 'The puzzle is already solved. 🎉');
      return;
    }

    const hint = getNextHint(currentGrid);
    if (!hint) {
      Alert.alert('Stuck', 'Could not find a next move. Please check the puzzle for errors.');
      return;
    }

    const newGrid = cloneGrid(currentGrid);
    newGrid[hint.row][hint.col] = hint.value;

    const key = hint.row * 9 + hint.col;
    const newHintCells = new Set(hintCells);
    newHintCells.add(key);

    setCurrentGrid(newGrid);
    setHintCells(newHintCells);
    setActiveHint(hint);
    setSelectedCell(null);

    if (isComplete(newGrid))
      setTimeout(() => Alert.alert('Solved! 🎉', 'The puzzle is complete!'), 400);
  }, [currentGrid, hintCells]);

  // ── Cell tap ───────────────────────────────────────────────────────────────
  const handleCellPress = useCallback(
    (row: number, col: number) => {
      // Locked cells: only those that are "given" in the originalGrid
      if (originalGrid[row][col] !== 0) return;
      if (isSolved) return;
      setSelectedCell((prev) =>
        prev?.row === row && prev?.col === col ? null : { row, col }
      );
      setActiveHint(null);
    },
    [originalGrid, isSolved]
  );

  // ── Number pad ─────────────────────────────────────────────────────────────
  const handleNumberPad = useCallback(
    (value: number | null) => {
      if (!selectedCell) return;
      const { row, col } = selectedCell;
      if (originalGrid[row][col] !== 0) return;

      const newGrid = cloneGrid(currentGrid);
      newGrid[row][col] = value ?? 0;
      setCurrentGrid(newGrid);

      const key = row * 9 + col;
      const newHintCells = new Set(hintCells);
      if (value) {
        newHintCells.add(key);
      } else {
        newHintCells.delete(key);
      }
      setHintCells(newHintCells);

      // Keep the cell selected so the user can see and verify what they typed.
      // Tap another cell or the same cell again to deselect.

      if (value && isComplete(newGrid)) {
        setTimeout(() => Alert.alert('Solved! 🎉', 'You completed the puzzle!'), 200);
        setIsSolved(true);
        setSelectedCell(null);
      }
    },
    [selectedCell, currentGrid, originalGrid, hintCells]
  );

  const emptyCells = currentGrid.flat().filter((v) => v === 0).length;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onReset} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>New Puzzle</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sudoku Solver</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {isSolved ? '✓ Done' : `${emptyCells} left`}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* OCR review note — shown when puzzle came from camera/gallery */}
        {prefilledGrid && !isSolved && (
          <View style={styles.reviewBanner}>
            <Text style={styles.reviewText}>
              📋 Review the recognised numbers. Tap any orange cell to correct a mistake, then solve!
            </Text>
          </View>
        )}

        {/* Grid */}
        <View style={styles.gridWrapper}>
          <SudokuGrid
            originalGrid={originalGrid}
            currentGrid={currentGrid}
            hintRow={activeHint?.row}
            hintCol={activeHint?.col}
            hintCells={hintCells}
            solvedCells={solvedCells}
            onCellPress={handleCellPress}
            selectedCell={selectedCell}
          />
        </View>

        {/* Number pad — shown when a cell is selected */}
        {selectedCell && !isSolved && (
          <View style={styles.padWrapper}>
            <Text style={styles.padLabel}>
              Row {selectedCell.row + 1}, Col {selectedCell.col + 1} — tap a number or ✕ to clear
            </Text>
            <NumberPad onPress={handleNumberPad} />
          </View>
        )}

        {/* Action buttons */}
        {!isSolved && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.solveBtn]}
              onPress={handleSolveAll}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnIcon}>⚡</Text>
              <Text style={styles.actionBtnText}>Solve the Sudoku</Text>
              <Text style={styles.actionBtnSub}>Fill entire grid instantly</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.hintBtn]}
              onPress={handleGiveHint}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnIcon}>💡</Text>
              <Text style={[styles.actionBtnText, { color: '#1a237e' }]}>Give One Number</Text>
              <Text style={[styles.actionBtnSub, { color: '#546e7a' }]}>
                Next step with explanation
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Solved banner */}
        {isSolved && (
          <View style={styles.solvedBanner}>
            <Text style={styles.solvedEmoji}>🎉</Text>
            <Text style={styles.solvedTitle}>Puzzle Solved!</Text>
            <TouchableOpacity style={styles.newPuzzleBtn} onPress={onReset}>
              <Text style={styles.newPuzzleBtnText}>Try Another Puzzle</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Hint card */}
        {activeHint && (
          <Animated.View
            style={{
              opacity: hintCardAnim,
              transform: [
                {
                  translateY: hintCardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <HintCard hint={activeHint} />
          </Animated.View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <LegendItem color="#1a1a2e" label="Given" />
          <LegendItem color="#c0580a" label="Entered / Hint" />
          <LegendItem color="#1565c0" label="Solved" />
        </View>
      </ScrollView>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f4ff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1a237e',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  backIcon: { fontSize: 28, color: '#fff', lineHeight: 30, marginRight: 2 },
  backText: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  reviewBanner: {
    margin: 12,
    marginBottom: 0,
    backgroundColor: '#fff8e1',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  reviewText: { fontSize: 13, color: '#78350f', lineHeight: 19 },
  gridWrapper: {
    marginTop: 16,
    marginHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  padWrapper: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    elevation: 2,
  },
  padLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: '#78909c',
    marginBottom: 4,
  },
  actions: { marginTop: 16, marginHorizontal: 16, gap: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  solveBtn: { backgroundColor: '#1a237e' },
  hintBtn: {
    backgroundColor: '#fff3e0',
    borderWidth: 1.5,
    borderColor: '#e67e22',
  },
  actionBtnIcon: { fontSize: 24, marginRight: 12 },
  actionBtnText: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff' },
  actionBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  solvedBanner: {
    margin: 16,
    padding: 24,
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#a5d6a7',
  },
  solvedEmoji: { fontSize: 48, marginBottom: 8 },
  solvedTitle: { fontSize: 22, fontWeight: '800', color: '#2e7d32', marginBottom: 16 },
  newPuzzleBtn: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 30,
  },
  newPuzzleBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#78909c' },
});
