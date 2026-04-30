import { Grid, Hint } from '../types';

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

export function getPossibleValues(grid: Grid, row: number, col: number): Set<number> {
  if (grid[row][col] !== 0) return new Set();

  const used = new Set<number>();

  for (let c = 0; c < 9; c++) if (grid[row][c]) used.add(grid[row][c]);
  for (let r = 0; r < 9; r++) if (grid[r][col]) used.add(grid[r][col]);

  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      if (grid[r][c]) used.add(grid[r][c]);

  const result = new Set<number>();
  for (let n = 1; n <= 9; n++) if (!used.has(n)) result.add(n);
  return result;
}

function solveHelper(grid: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        for (const val of getPossibleValues(grid, r, c)) {
          grid[r][c] = val;
          if (solveHelper(grid)) return true;
          grid[r][c] = 0;
        }
        return false;
      }
    }
  }
  return true;
}

export function solveSudoku(grid: Grid): Grid | null {
  const copy = cloneGrid(grid);
  return solveHelper(copy) ? copy : null;
}

export function isComplete(grid: Grid): boolean {
  return grid.every((row) => row.every((cell) => cell !== 0));
}

export function getNextHint(grid: Grid): Hint | null {
  // ── Strategy 1: Naked Single ──────────────────────────────────────────────
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const possible = getPossibleValues(grid, r, c);
        if (possible.size === 1) {
          const value = [...possible][0];
          return {
            row: r,
            col: c,
            value,
            strategy: 'Naked Single',
            explanation:
              `Cell [Row ${r + 1}, Col ${c + 1}] can only be ${value}. ` +
              `Every other digit (1–9) already appears in its row, column, or 3×3 box, ` +
              `leaving ${value} as the only valid option.`,
          };
        }
      }
    }
  }

  // ── Strategy 2: Hidden Single in Row ─────────────────────────────────────
  for (let r = 0; r < 9; r++) {
    for (let v = 1; v <= 9; v++) {
      const cols = [];
      for (let c = 0; c < 9; c++)
        if (grid[r][c] === 0 && getPossibleValues(grid, r, c).has(v)) cols.push(c);
      if (cols.length === 1) {
        const c = cols[0];
        return {
          row: r,
          col: c,
          value: v,
          strategy: 'Hidden Single (Row)',
          explanation:
            `In Row ${r + 1}, the digit ${v} can only be placed in Column ${c + 1}. ` +
            `All other empty cells in this row are blocked from having ${v} ` +
            `by their respective columns or boxes.`,
        };
      }
    }
  }

  // ── Strategy 3: Hidden Single in Column ──────────────────────────────────
  for (let c = 0; c < 9; c++) {
    for (let v = 1; v <= 9; v++) {
      const rows = [];
      for (let r = 0; r < 9; r++)
        if (grid[r][c] === 0 && getPossibleValues(grid, r, c).has(v)) rows.push(r);
      if (rows.length === 1) {
        const r = rows[0];
        return {
          row: r,
          col: c,
          value: v,
          strategy: 'Hidden Single (Column)',
          explanation:
            `In Column ${c + 1}, the digit ${v} can only be placed in Row ${r + 1}. ` +
            `All other empty cells in this column are blocked from having ${v} ` +
            `by their respective rows or boxes.`,
        };
      }
    }
  }

  // ── Strategy 4: Hidden Single in Box ─────────────────────────────────────
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      for (let v = 1; v <= 9; v++) {
        const cells: [number, number][] = [];
        for (let r = br * 3; r < br * 3 + 3; r++)
          for (let c = bc * 3; c < bc * 3 + 3; c++)
            if (grid[r][c] === 0 && getPossibleValues(grid, r, c).has(v))
              cells.push([r, c]);
        if (cells.length === 1) {
          const [r, c] = cells[0];
          return {
            row: r,
            col: c,
            value: v,
            strategy: 'Hidden Single (Box)',
            explanation:
              `In the 3×3 box covering rows ${br * 3 + 1}–${br * 3 + 3} and columns ` +
              `${bc * 3 + 1}–${bc * 3 + 3}, the digit ${v} can only fit in ` +
              `[Row ${r + 1}, Col ${c + 1}]. Every other empty cell in this box ` +
              `already has ${v} ruled out.`,
          };
        }
      }
    }
  }

  // ── Fallback: backtracking ────────────────────────────────────────────────
  const solved = solveSudoku(grid);
  if (solved) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          const v = solved[r][c];
          const possible = [...getPossibleValues(grid, r, c)].sort((a, b) => a - b);
          return {
            row: r,
            col: c,
            value: v,
            strategy: 'Advanced Technique',
            explanation:
              `Cell [Row ${r + 1}, Col ${c + 1}] is ${v}. This step requires advanced ` +
              `solving techniques beyond basic elimination. The cell has ${possible.length} ` +
              `candidate(s): ${possible.join(', ')}. Through a chain of logical deductions, ` +
              `${v} is the only value that leads to a valid complete solution.`,
          };
        }
      }
    }
  }

  return null;
}
