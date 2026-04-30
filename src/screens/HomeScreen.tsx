import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
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
        throw new Error('Backend server is not reachable. See README for setup instructions.');
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
    setLoadingMsg('Loading sample puzzle…');
    try {
      const healthy = await checkBackendHealth();
      const grid = healthy
        ? await fetchSampleGrid()
        : OFFLINE_SAMPLE;
      onGridReady(cloneGrid(grid));
    } catch {
      onGridReady(cloneGrid(OFFLINE_SAMPLE));
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
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
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🧩</Text>
        <Text style={styles.title}>Sudoku Solver</Text>
        <Text style={styles.subtitle}>Snap a puzzle and let AI do the heavy lifting</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => pickAndProcess('camera')} activeOpacity={0.85}>
          <Text style={styles.btnIcon}>📷</Text>
          <Text style={styles.btnText}>Take a Photo</Text>
          <Text style={styles.btnSub}>Open camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => pickAndProcess('gallery')} activeOpacity={0.85}>
          <Text style={styles.btnIcon}>🖼️</Text>
          <Text style={styles.btnText}>Upload from Gallery</Text>
          <Text style={[styles.btnSub, { color: '#1a237e' }]}>Choose existing photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={loadSample} activeOpacity={0.85}>
          <Text style={styles.btnIcon}>✏️</Text>
          <Text style={[styles.btnText, { color: '#555' }]}>Try a Sample Puzzle</Text>
          <Text style={[styles.btnSub, { color: '#888' }]}>Test without a photo</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.tip}>
        💡 Tip: Make sure the entire grid is inside the frame and well-lit for best results.
      </Text>
    </View>
  );
}

// Fallback puzzle used when backend is offline
const OFFLINE_SAMPLE: Grid = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
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
    marginBottom: 48,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 34,
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
    gap: 14,
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
  },
  btnIcon: {
    fontSize: 26,
    marginRight: 14,
  },
  btnText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  btnSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  tip: {
    marginTop: 36,
    fontSize: 13,
    color: '#78909c',
    textAlign: 'center',
    lineHeight: 20,
  },
});
