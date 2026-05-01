import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { checkBackendHealth, fetchSampleGrid, processImage } from '../api/api';
import { Grid } from '../types';
import { cloneGrid } from '../utils/sudokuSolver';

interface Props {
  onGridReady: (grid: Grid) => void;
}

// 10 different sample puzzles (varying difficulty)
const SAMPLE_PUZZLES: Grid[] = [
  // Easy
  [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ],
  // Easy
  [
    [0, 0, 3, 0, 2, 0, 6, 0, 0],
    [9, 0, 0, 3, 0, 5, 0, 0, 1],
    [0, 0, 1, 8, 0, 6, 4, 0, 0],
    [0, 0, 8, 1, 0, 2, 9, 0, 0],
    [7, 0, 0, 0, 0, 0, 0, 0, 8],
    [0, 0, 6, 7, 0, 8, 2, 0, 0],
    [0, 0, 2, 6, 0, 9, 5, 0, 0],
    [8, 0, 0, 2, 0, 3, 0, 0, 9],
    [0, 0, 5, 0, 1, 0, 3, 0, 0],
  ],
  // Medium
  [
    [0, 0, 0, 2, 6, 0, 7, 0, 1],
    [6, 8, 0, 0, 7, 0, 0, 9, 0],
    [1, 9, 0, 0, 0, 4, 5, 0, 0],
    [8, 2, 0, 1, 0, 0, 0, 4, 0],
    [0, 0, 4, 6, 0, 2, 9, 0, 0],
    [0, 5, 0, 0, 0, 3, 0, 2, 8],
    [0, 0, 9, 3, 0, 0, 0, 7, 4],
    [0, 4, 0, 0, 5, 0, 0, 3, 6],
    [7, 0, 3, 0, 1, 8, 0, 0, 0],
  ],
  // Medium
  [
    [0, 2, 0, 6, 0, 8, 0, 0, 0],
    [5, 8, 0, 0, 0, 9, 7, 0, 0],
    [0, 0, 0, 0, 4, 0, 0, 0, 0],
    [3, 7, 0, 0, 0, 0, 5, 0, 0],
    [6, 0, 0, 0, 0, 0, 0, 0, 4],
    [0, 0, 8, 0, 0, 0, 0, 1, 3],
    [0, 0, 0, 0, 2, 0, 0, 0, 0],
    [0, 0, 9, 8, 0, 0, 0, 3, 6],
    [0, 0, 0, 3, 0, 6, 0, 9, 0],
  ],
  // Medium
  [
    [0, 0, 0, 0, 0, 0, 9, 0, 7],
    [0, 0, 0, 4, 2, 0, 1, 8, 0],
    [0, 0, 0, 7, 0, 5, 0, 2, 6],
    [1, 0, 0, 9, 0, 4, 0, 0, 0],
    [0, 5, 0, 0, 0, 0, 0, 4, 0],
    [0, 0, 0, 5, 0, 7, 0, 0, 9],
    [9, 2, 0, 1, 0, 8, 0, 0, 0],
    [0, 3, 4, 0, 5, 9, 0, 0, 0],
    [5, 0, 7, 0, 0, 0, 0, 0, 0],
  ],
  // Hard
  [
    [0, 0, 0, 0, 0, 0, 0, 1, 2],
    [0, 0, 0, 0, 3, 5, 0, 0, 0],
    [0, 0, 0, 6, 0, 0, 0, 7, 0],
    [7, 0, 0, 0, 0, 0, 3, 0, 0],
    [0, 0, 0, 4, 0, 0, 8, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 2, 0, 0, 0, 0],
    [0, 8, 0, 0, 0, 0, 0, 4, 0],
    [0, 5, 0, 0, 0, 0, 6, 0, 0],
  ],
  // Hard
  [
    [0, 0, 1, 0, 0, 2, 0, 0, 0],
    [0, 0, 5, 0, 0, 0, 0, 0, 0],
    [4, 0, 0, 0, 0, 1, 0, 9, 0],
    [0, 0, 0, 0, 8, 0, 0, 0, 0],
    [0, 7, 0, 0, 0, 0, 6, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 2, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 3],
    [0, 0, 2, 0, 0, 0, 0, 0, 4],
  ],
  // Medium
  [
    [0, 0, 0, 0, 9, 4, 0, 3, 0],
    [0, 0, 0, 5, 1, 0, 0, 0, 7],
    [0, 8, 9, 0, 0, 0, 4, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 7, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 6, 0, 8, 0],
    [0, 0, 2, 6, 0, 0, 0, 1, 0],
    [0, 3, 0, 0, 0, 0, 0, 0, 5],
    [9, 0, 0, 0, 7, 0, 0, 6, 0],
  ],
  // Easy
  [
    [1, 0, 0, 4, 8, 9, 0, 0, 6],
    [7, 3, 0, 0, 0, 0, 0, 4, 0],
    [0, 0, 0, 0, 0, 1, 2, 9, 5],
    [0, 0, 7, 1, 2, 0, 6, 0, 0],
    [5, 0, 0, 7, 0, 3, 0, 0, 8],
    [0, 0, 6, 0, 9, 5, 7, 0, 0],
    [9, 1, 4, 6, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 0, 0, 0, 3, 7],
    [8, 0, 0, 5, 1, 2, 0, 0, 4],
  ],
  // Medium
  [
    [0, 0, 5, 3, 0, 0, 0, 0, 0],
    [8, 0, 0, 0, 0, 0, 0, 2, 0],
    [0, 7, 0, 0, 1, 0, 5, 0, 0],
    [4, 0, 0, 0, 0, 5, 3, 0, 0],
    [0, 1, 0, 0, 7, 0, 0, 0, 6],
    [0, 0, 3, 2, 0, 0, 0, 8, 0],
    [0, 6, 0, 5, 0, 0, 0, 0, 9],
    [0, 0, 4, 0, 0, 0, 0, 3, 0],
    [0, 0, 0, 0, 0, 9, 7, 0, 0],
  ],
];

// Blank grid for manual entry
const BLANK_GRID: Grid = Array(9).fill(null).map(() => Array(9).fill(0));

let lastSampleIndex = -1;

function getNextSample(): Grid {
  let idx;
  do {
    idx = Math.floor(Math.random() * SAMPLE_PUZZLES.length);
  } while (idx === lastSampleIndex && SAMPLE_PUZZLES.length > 1);
  lastSampleIndex = idx;
  return SAMPLE_PUZZLES[idx];
}

export default function HomeScreen({ onGridReady }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [loadingMsg, setLoadingMsg] = React.useState('');

  async function pickAndProcess(source: 'camera' | 'gallery') {
    const perms =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perms.granted) {
      Alert.alert(
        'Permission Required',
        `Please grant ${source === 'camera' ? 'camera' : 'photo library'} access in Settings.`
      );
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.9 })
        : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.9 });

    if (result.canceled || !result.assets[0]?.base64) return;

    setLoading(true);
    setLoadingMsg('Connecting to server…');

    try {
      const healthy = await checkBackendHealth();
      if (!healthy) {
        setLoading(false);
        setLoadingMsg('');
        Alert.alert(
          '📡 OCR Server Offline',
          'The image-recognition server is not running.\n\nYou can still:\n• Try a sample puzzle\n• Enter the sudoku manually',
          [
            { text: 'Try Sample', onPress: loadSample },
            { text: 'Enter Manually', onPress: enterManually },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      setLoadingMsg('Analysing sudoku…');
      const grid = await processImage(result.assets[0].base64);
      onGridReady(grid);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  }

  async function loadSample() {
    setLoading(true);
    setLoadingMsg('Loading puzzle…');
    try {
      const healthy = await checkBackendHealth();
      const grid = healthy ? await fetchSampleGrid() : getNextSample();
      onGridReady(cloneGrid(grid));
    } catch {
      onGridReady(cloneGrid(getNextSample()));
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  }

  function enterManually() {
    onGridReady(cloneGrid(BLANK_GRID));
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>{loadingMsg}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.emoji}>🧩</Text>
        <Text style={styles.title}>Sudoku Solver - HK</Text>
        <Text style={styles.subtitle}>Snap a puzzle and let AI do the heavy lifting</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => pickAndProcess('camera')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>📷</Text>
          <View style={styles.btnLabels}>
            <Text style={styles.btnText}>Take a Photo</Text>
            <Text style={styles.btnSub}>Snap your sudoku puzzle</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => pickAndProcess('gallery')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>🖼️</Text>
          <View style={styles.btnLabels}>
            <Text style={[styles.btnText, { color: '#1a237e' }]}>Upload from Gallery</Text>
            <Text style={[styles.btnSub, { color: '#546e7a' }]}>Choose an existing photo</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or play without a photo</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.btn, styles.btnOutline]}
          onPress={loadSample}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>🎲</Text>
          <View style={styles.btnLabels}>
            <Text style={[styles.btnText, { color: '#333' }]}>Try a Sample Puzzle</Text>
            <Text style={[styles.btnSub, { color: '#888' }]}>10 puzzles · easy to hard</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnManual]}
          onPress={enterManually}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>✏️</Text>
          <View style={styles.btnLabels}>
            <Text style={[styles.btnText, { color: '#333' }]}>Enter Manually</Text>
            <Text style={[styles.btnSub, { color: '#888' }]}>Tap cells and type numbers</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.tip}>
        💡 Tip: Make sure the entire grid is inside the frame and well-lit for best results.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4ff',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#1a237e',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1a237e',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#546e7a',
    marginTop: 6,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  btnPrimary: {
    backgroundColor: '#1a237e',
  },
  btnSecondary: {
    backgroundColor: '#e3eaf7',
  },
  btnOutline: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#cfd8dc',
    elevation: 1,
  },
  btnManual: {
    backgroundColor: '#fff8e1',
    borderWidth: 1.5,
    borderColor: '#ffe082',
    elevation: 1,
  },
  btnIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  btnLabels: {
    flex: 1,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  btnSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#cfd8dc',
  },
  dividerText: {
    fontSize: 12,
    color: '#90a4ae',
  },
  tip: {
    marginTop: 28,
    fontSize: 13,
    color: '#78909c',
    textAlign: 'center',
    lineHeight: 20,
  },
});
