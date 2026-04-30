import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import SolverScreen from './src/screens/SolverScreen';
import { Grid } from './src/types';

export default function App() {
  const [grid, setGrid] = useState<Grid | null>(null);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" backgroundColor="#1a237e" />
      {grid ? (
        <SolverScreen
          originalGrid={grid}
          onReset={() => setGrid(null)}
        />
      ) : (
        <HomeScreen onGridReady={setGrid} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1a237e',
  },
});
