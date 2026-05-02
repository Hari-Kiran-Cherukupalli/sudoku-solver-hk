/**
 * On-device Sudoku OCR — Google ML Kit Text Recognition (works 100% offline).
 *
 * Pipeline:
 *  1. Preprocess the image (resize to standard size for consistent coordinates)
 *  2. Run ML Kit to get all text elements + bounding-box coordinates
 *  3. Filter to single digits 1-9, correct common OCR character mistakes
 *  4. Use gap-based clustering to infer the 9 column positions and 9 row positions
 *  5. Assign each digit to its (row, col) cell using nearest-cluster matching
 */

import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as ImageManipulator from 'expo-image-manipulator';
import { Grid } from '../types';

type DigitBox = { value: number; cx: number; cy: number };

// ─── Image preprocessing ─────────────────────────────────────────────────────

async function preprocessImage(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }], // standardise resolution
      { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch {
    return uri; // fall back to original if manipulation fails
  }
}

// ─── Gap-based 1-D clustering ────────────────────────────────────────────────
//
// Strategy: sort the positions, find the N-1 largest gaps between consecutive
// values, use those gap positions as cluster boundaries, then return the mean
// of each cluster as its representative centre.
//
// This is far more robust than simple (min + k * cellSize) arithmetic because
// it does not require knowing the grid extents up-front.

function clusterPositions(positions: number[], targetGroups: number): number[] {
  if (positions.length === 0) return [];

  // Round to integers and deduplicate before clustering
  const sorted = [...new Set(positions.map((p) => Math.round(p)))].sort(
    (a, b) => a - b
  );

  if (sorted.length <= targetGroups) {
    // Fewer unique positions than expected groups — return as-is
    return sorted;
  }

  // Build list of gaps between consecutive sorted values
  const gaps: { gap: number; afterIndex: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push({ gap: sorted[i] - sorted[i - 1], afterIndex: i });
  }

  // Pick the (targetGroups - 1) largest gaps as cluster boundaries
  gaps.sort((a, b) => b.gap - a.gap);
  const splitSet = new Set(
    gaps.slice(0, targetGroups - 1).map((g) => g.afterIndex)
  );

  // Build clusters
  const clusters: number[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    if (splitSet.has(i)) clusters.push([]);
    clusters[clusters.length - 1].push(sorted[i]);
  }

  // Return sorted cluster centres
  return clusters
    .map((c) => c.reduce((a, b) => a + b, 0) / c.length)
    .sort((a, b) => a - b);
}

// ─── Nearest-centre matching ─────────────────────────────────────────────────

function nearestIndex(value: number, centres: number[]): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < centres.length; i++) {
    const d = Math.abs(value - centres[i]);
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return best;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function recognizeSudokuFromPhoto(imageUri: string): Promise<Grid> {
  // Step 1 — preprocess
  const processedUri = await preprocessImage(imageUri);

  // Step 2 — run ML Kit OCR
  const result = await TextRecognition.recognize(processedUri);

  // Step 3 — collect single digits with bounding-box centres
  const digits: DigitBox[] = [];

  for (const block of result.blocks) {
    for (const line of block.lines) {
      for (const element of line.elements) {
        let raw = element.text.trim();

        // Fix common OCR substitutions
        raw = raw
          .replace(/[oO]/g, '0')   // 'o'  → 0  (then filtered below)
          .replace(/[lI|]/g, '1')  // 'l'  → 1
          .replace(/[Ss]/g, '5')   // 'S'  → 5
          .replace(/[Zz]/g, '2')   // 'Z'  → 2
          .replace(/[Bb]/g, '8');  // 'B'  → 8

        if (/^[1-9]$/.test(raw) && element.frame) {
          const f = element.frame;
          digits.push({
            value: parseInt(raw, 10),
            cx: f.left + f.width / 2,
            cy: f.top + f.height / 2,
          });
        }
      }
    }
  }

  // Step 4 — validate digit count (a valid sudoku has at least 17 clues)
  if (digits.length < 17) {
    throw new Error(
      `Only ${digits.length} digit${digits.length === 1 ? '' : 's'} detected.\n\n` +
        'For a better result:\n' +
        '• Hold the phone directly above the puzzle\n' +
        '• Make sure all 4 corners of the grid are visible\n' +
        '• Use bright, even lighting — avoid shadows\n' +
        '• Keep the camera steady to avoid blur\n\n' +
        'Tip: You can also use "Enter Manually" to type in the puzzle.'
    );
  }

  // Step 5 — cluster x-centres into 9 column positions
  //          cluster y-centres into 9 row positions
  const colCentres = clusterPositions(digits.map((d) => d.cx), 9);
  const rowCentres = clusterPositions(digits.map((d) => d.cy), 9);

  if (colCentres.length < 7 || rowCentres.length < 7) {
    throw new Error(
      `Detected ${rowCentres.length} row(s) and ${colCentres.length} column(s) — ` +
        'the grid is not fully visible.\n' +
        'Make sure the entire sudoku grid fits inside the camera frame and try again.'
    );
  }

  // Step 6 — map each digit to its (row, col) cell
  const grid: Grid = Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));

  for (const digit of digits) {
    const col = nearestIndex(digit.cx, colCentres);
    const row = nearestIndex(digit.cy, rowCentres);

    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
      // Keep the first digit detected per cell (most confident)
      if (grid[row][col] === 0) {
        grid[row][col] = digit.value;
      }
    }
  }

  return grid;
}
