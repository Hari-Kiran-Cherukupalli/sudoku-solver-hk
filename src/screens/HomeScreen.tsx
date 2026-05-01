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
import { Grid } from '../types';
import { cloneGrid } from '../utils/sudokuSolver';
import { recognizeSudokuFromPhoto } from '../utils/offlineOcr';

interface Props {
  onGridReady: (grid: Grid) => void;
}

// ─── 10 built-in sample puzzles (easy → hard) ────────────────────────────────
const SAMPLE_PUZZLES: Grid[] = [
  // 1 · Easy (classic)
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
  // 2 · Easy
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
  // 3 · Easy
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
  // 4 · Medium
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
  // 5 · Medium
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
  // 6 · Medium
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
  // 7 · Medium
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
  // 8 · Hard
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
  // 9 · Hard
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
  // 10 · Hard
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
];

const BLANK_GRID: Grid = Array(9)
  .fill(null)
  .map(() => Array(9).fill(0));

let lastSampleIndex = -1;
function getNextSample(): Grid {
  let idx: number;
  do {
    idx = Math.floor(Math.random() * SAMPLE_PUZZLES.length);
  } while (idx === lastSampleIndex && SAMPLE_PUZZLES.length > 1);
  lastSampleIndex = idx;
  return SAMPLE_PUZZLES[idx];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HomeScreen({ onGridReady }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [loadingMsg, setLoadingMsg] = React.useState('');

  async function pickAndProcess(source: 'camera' | 'gallery') {
    // 1. Request permissions
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

    // 2. Launch picker
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.9 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setLoading(true);
    setLoadingMsg('Reading puzzle with on-device AI…');

    try {
      // 3. Run ML Kit OCR entirely on-device — no server needed
      const grid = await recognizeSudokuFromPhoto(result.assets[0].uri);
      onGridReady(grid);
    } catch (err: any) {
      Alert.alert(
        '🔍 Could Not Read Puzzle',
        err?.message ?? 'Recognition failed.',
        [
          { text: 'Try Again', style: 'default' },
          { text: 'Enter Manually', onPress: enterManually },
          { text: 'Try Sample', onPress: loadSample },
        ]
      );
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  }

  function loadSample() {
    onGridReady(cloneGrid(getNextSample()));
  }

  function enterManually() {
    onGridReady(cloneGrid(BLANK_GRID));
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>{loadingMsg}</Text>
        <Text style={styles.loadingSubText}>Running on your device · no internet needed</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.emoji}>🧩</Text>
        <Text style={styles.title}>Sudoku Solver - HK</Text>
        <Text style={styles.subtitle}>Snap a puzzle and let AI do the heavy lifting</Text>
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineBadgeText}>✅ Works 100% Offline</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => pickAndProcess('camera')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>📷</Text>
          <View style={styles.btnLabels}>
            <Text style={styles.btnText}>Take a Photo</Text>
            <Text style={styles.btnSub}>Point camera at the puzzle</Text>
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
            <Text style={[styles.btnSub, { color: '#888' }]}>10 puzzles · easy to hard · random each time</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnManual]}
          onPress={enterManually}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>✏️</Text>
          <View style={styles.btnLabels}>
            <Text style={[styles.btnText, { color: '#5d4037' }]}>Enter Manually</Text>
            <Text style={[styles.btnSub, { color: '#8d6e63' }]}>Tap cells and type numbers</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.tip}>
        💡 Tip: For best photo results, hold the camera directly above the puzzle with good lighting and make sure all 4 corners are visible.
      </Text>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f0f4ff' },
  container: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4ff',
    gap: 12,
    paddingHorizontal: 32,
  },
  loadingText: { fontSize: 16, color: '#1a237e', fontWeight: '600' },
  loadingSubText: { fontSize: 13, color: '#78909c', textAlign: 'center' },
  hero: { alignItems: 'center', marginBottom: 36 },
  emoji: { fontSize: 60, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '800', color: '#1a237e', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#546e7a', marginTop: 6, textAlign: 'center' },
  offlineBadge: {
    marginTop: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#a5d6a7',
  },
  offlineBadgeText: { fontSize: 12, color: '#2e7d32', fontWeight: '600' },
  actions: { gap: 12 },
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
  btnPrimary: { backgroundColor: '#1a237e' },
  btnSecondary: { backgroundColor: '#e3eaf7' },
  btnOutline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#cfd8dc', elevation: 1 },
  btnManual: { backgroundColor: '#fff8e1', borderWidth: 1.5, borderColor: '#ffe082', elevation: 1 },
  btnIcon: { fontSize: 28, marginRight: 14 },
  btnLabels: { flex: 1 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  btnSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 4, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#cfd8dc' },
  dividerText: { fontSize: 12, color: '#90a4ae' },
  tip: { marginTop: 28, fontSize: 12, color: '#78909c', textAlign: 'center', lineHeight: 19 },
});
