/**
 * On-device sudoku OCR using Google ML Kit Text Recognition.
 * Works 100% offline — no server needed.
 *
 * Strategy:
 *  1. Run ML Kit on the full image → get all recognised text elements + bounding boxes
 *  2. Keep only single-digit strings (1-9)
 *  3. Infer the 9×9 grid bounds from the spread of digit centres
 *  4. Map each digit's centre to a (row, col) cell
 */

import TextRecognition from '@react-native-ml-kit/text-recognition';
import { Grid } from '../types';

type DigitBox = { value: number; cx: number; cy: number };

export async function recognizeSudokuFromPhoto(imageUri: string): Promise<Grid> {
  const result = await TextRecognition.recognize(imageUri);

  const digits: DigitBox[] = [];

  for (const block of result.blocks) {
    for (const line of block.lines) {
      for (const element of line.elements) {
        // Normalise: OCR sometimes confuses 'O'/'o' with '0' — drop those
        const raw = element.text.trim();
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

  // A valid sudoku puzzle needs at least 17 clues
  if (digits.length < 17) {
    throw new Error(
      `Only ${digits.length} digit${digits.length === 1 ? '' : 's'} detected.\n\n` +
        'Tips for a better photo:\n' +
        '• Hold the camera directly above the puzzle\n' +
        '• Make sure all 4 corners of the grid are visible\n' +
        '• Use good lighting and avoid shadows\n' +
        '• Keep the phone steady'
    );
  }

  // Infer grid bounding box from the digit centres
  const xs = digits.map((d) => d.cx);
  const ys = digits.map((d) => d.cy);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // Cell size estimated from the digit spread (digits sit at cell centres)
  // The outermost digit centres are ~half a cell in from the grid edge
  const cellW = (maxX - minX) / 8;
  const cellH = (maxY - minY) / 8;

  // Grid origin (top-left corner)
  const originX = minX - cellW / 2;
  const originY = minY - cellH / 2;

  const grid: Grid = Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));

  for (const digit of digits) {
    const col = Math.round((digit.cx - originX) / cellW - 0.5);
    const row = Math.round((digit.cy - originY) / cellH - 0.5);

    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
      // If two digits land in the same cell, keep the first detected
      if (grid[row][col] === 0) {
        grid[row][col] = digit.value;
      }
    }
  }

  return grid;
}
