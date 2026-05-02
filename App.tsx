import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import SolverScreen from './src/screens/SolverScreen';
import { Grid } from './src/types';

type PuzzleState = {
  originalGrid: Grid;   // locked "given" cells
  prefilledGrid?: Grid; // pre-filled but editable cells (OCR results)
} | null;

export default function App() {
  const [puzzle, setPuzzle] = useState<PuzzleState>(null);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" backgroundColor="#1a237e" />
      {puzzle ? (
        <SolverScreen
          originalGrid={puzzle.originalGrid}
          prefilledGrid={puzzle.prefilledGrid}
          onReset={() => setPuzzle(null)}
        />
      ) : (
        <HomeScreen
          onGridReady={(original, prefill) =>
            setPuzzle({ originalGrid: original, prefilledGrid: prefill })
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a237e' },
});
