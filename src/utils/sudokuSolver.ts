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

// ─── Hint engine ─────────────────────────────────────────────────────────────

export function getNextHint(grid: Grid): Hint | null {

  // ── Strategy 1: Naked Single ────────────────────────────────────────────
  // A cell has only one possible candidate — nothing else can go there.
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const possible = getPossibleValues(grid, r, c);
        if (possible.size === 1) {
          const value = [...possible][0];
          return {
            row: r, col: c, value,
            strategy: 'Naked Single',
            explanation:
              `Cell [Row ${r + 1}, Col ${c + 1}] can only be ${value}. ` +
              `Every other digit (1–9) already appears in its row, column, or 3×3 box, ` +
              `leaving ${value} as the sole option.`,
          };
        }
      }
    }
  }

  // ── Strategy 2: Hidden Single in Row ─────────────────────────────────────
  // Only one cell in the row can accept a particular digit.
  for (let r = 0; r < 9; r++) {
    for (let v = 1; v <= 9; v++) {
      const cols: number[] = [];
      for (let c = 0; c < 9; c++)
        if (grid[r][c] === 0 && getPossibleValues(grid, r, c).has(v)) cols.push(c);
      if (cols.length === 1) {
        const c = cols[0];
        return {
          row: r, col: c, value: v,
          strategy: 'Hidden Single (Row)',
          explanation:
            `In Row ${r + 1}, the digit ${v} can only go in Column ${c + 1}. ` +
            `Every other empty cell in this row is already blocked from containing ${v} ` +
            `because ${v} appears in their column or 3×3 box.`,
        };
      }
    }
  }

  // ── Strategy 3: Hidden Single in Column ──────────────────────────────────
  for (let c = 0; c < 9; c++) {
    for (let v = 1; v <= 9; v++) {
      const rows: number[] = [];
      for (let r = 0; r < 9; r++)
        if (grid[r][c] === 0 && getPossibleValues(grid, r, c).has(v)) rows.push(r);
      if (rows.length === 1) {
        const r = rows[0];
        return {
          row: r, col: c, value: v,
          strategy: 'Hidden Single (Column)',
          explanation:
            `In Column ${c + 1}, the digit ${v} can only go in Row ${r + 1}. ` +
            `Every other empty cell in this column is already blocked from containing ${v} ` +
            `because ${v} appears in their row or 3×3 box.`,
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
            row: r, col: c, value: v,
            strategy: 'Hidden Single (Box)',
            explanation:
              `In the 3×3 box (rows ${br * 3 + 1}–${br * 3 + 3}, ` +
              `columns ${bc * 3 + 1}–${bc * 3 + 3}), ` +
              `the digit ${v} can only fit in [Row ${r + 1}, Col ${c + 1}]. ` +
              `All other empty cells in this box are blocked from having ${v} ` +
              `by their row or column.`,
          };
        }
      }
    }
  }

  // ── Strategy 5: Naked Pair ────────────────────────────────────────────────
  // Two cells in the same unit share exactly the same two candidates.
  // Those two values are locked to those two cells, so they can be eliminated
  // from every other cell in the unit — which may expose a Naked Single.
  const nakedPairHint = findNakedPairHint(grid);
  if (nakedPairHint) return nakedPairHint;

  // ── Strategy 6: Box-Line Reduction (Pointing Pair / Triple) ─────────────
  // If a digit within a box can only appear in one row (or column), that digit
  // is eliminated from the rest of that row (column) outside the box.
  // This may expose a Naked Single elsewhere.
  const boxLineHint = findBoxLineHint(grid);
  if (boxLineHint) return boxLineHint;

  // ── Fallback: Trial & Error ───────────────────────────────────────────────
  // None of the logical strategies found a move. Use backtracking to determine
  // the answer, then explain WHY the wrong candidates fail.
  return findTrialAndErrorHint(grid);
}

// ─── Strategy 5 implementation ───────────────────────────────────────────────

function findNakedPairHint(grid: Grid): Hint | null {
  // Build all 27 units (9 rows + 9 cols + 9 boxes)
  const units: [number, number][][] = [];
  for (let r = 0; r < 9; r++)
    units.push(Array.from({ length: 9 }, (_, c) => [r, c] as [number, number]));
  for (let c = 0; c < 9; c++)
    units.push(Array.from({ length: 9 }, (_, r) => [r, c] as [number, number]));
  for (let br = 0; br < 3; br++)
    for (let bc = 0; bc < 3; bc++) {
      const box: [number, number][] = [];
      for (let r = br * 3; r < br * 3 + 3; r++)
        for (let c = bc * 3; c < bc * 3 + 3; c++)
          box.push([r, c]);
      units.push(box);
    }

  for (const unit of units) {
    // Get candidates for every empty cell in this unit
    const empties = unit
      .filter(([r, c]) => grid[r][c] === 0)
      .map(([r, c]) => ({ r, c, cands: getPossibleValues(grid, r, c) }));

    // Find pairs: cells with exactly 2 candidates
    const pairs = empties.filter((x) => x.cands.size === 2);

    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const a = pairs[i];
        const b = pairs[j];
        const aList = [...a.cands].sort();
        const bList = [...b.cands].sort();

        if (aList[0] !== bList[0] || aList[1] !== bList[1]) continue; // different pairs

        // aList === bList — naked pair found!
        const pairVals = aList;

        // Describe the unit
        const isRow = unit[0][0] === unit[8][0];
        const isCol = unit[0][1] === unit[8][1];
        const unitLabel = isRow
          ? `Row ${unit[0][0] + 1}`
          : isCol
          ? `Column ${unit[0][1] + 1}`
          : `the 3×3 box`;

        // Check if eliminating pairVals from other cells creates a Naked Single
        for (const { r, c, cands } of empties) {
          if ((r === a.r && c === a.c) || (r === b.r && c === b.c)) continue;

          const reduced = new Set([...cands].filter((v) => !pairVals.includes(v)));
          if (reduced.size === 1) {
            const singleValue = [...reduced][0];
            return {
              row: r, col: c, value: singleValue,
              strategy: 'Naked Pair',
              explanation:
                `Cells [R${a.r + 1},C${a.c + 1}] and [R${b.r + 1},C${b.c + 1}] ` +
                `in ${unitLabel} both contain only the candidates {${pairVals.join(', ')}}. ` +
                `One cell must be ${pairVals[0]} and the other ${pairVals[1]}, ` +
                `so neither value can appear in any other cell of ${unitLabel}. ` +
                `Removing ${pairVals.join(' and ')} from the remaining cells in ${unitLabel} ` +
                `leaves Cell [Row ${r + 1}, Col ${c + 1}] with only one option: ${singleValue}.`,
            };
          }
        }
      }
    }
  }

  return null;
}

// ─── Strategy 6 implementation ───────────────────────────────────────────────

function findBoxLineHint(grid: Grid): Hint | null {
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      for (let v = 1; v <= 9; v++) {
        // Find all empty cells in this box that can hold v
        const cells: [number, number][] = [];
        for (let r = br * 3; r < br * 3 + 3; r++)
          for (let c = bc * 3; c < bc * 3 + 3; c++)
            if (grid[r][c] === 0 && getPossibleValues(grid, r, c).has(v))
              cells.push([r, c]);

        if (cells.length < 2 || cells.length > 3) continue;

        const cellLabel = cells.map(([r, c]) => `[R${r + 1},C${c + 1}]`).join(', ');

        // All cells in the same row?
        const rowSet = new Set(cells.map(([r]) => r));
        if (rowSet.size === 1) {
          const row = [...rowSet][0];
          // Look for an outside-box cell in this row where elimination creates a single
          for (let c = 0; c < 9; c++) {
            if (Math.floor(c / 3) === bc) continue; // still in the box
            if (grid[row][c] !== 0) continue;
            const cands = getPossibleValues(grid, row, c);
            if (!cands.has(v)) continue;
            const reduced = new Set([...cands].filter((x) => x !== v));
            if (reduced.size === 1) {
              const single = [...reduced][0];
              return {
                row, col: c, value: single,
                strategy: 'Box-Line Reduction',
                explanation:
                  `In the 3×3 box (rows ${br * 3 + 1}–${br * 3 + 3}, ` +
                  `cols ${bc * 3 + 1}–${bc * 3 + 3}), ` +
                  `the digit ${v} can only go in Row ${row + 1} (at ${cellLabel}). ` +
                  `Because ${v} is confined to that row within the box, ` +
                  `it cannot appear anywhere else in Row ${row + 1}. ` +
                  `Removing ${v} from Cell [Row ${row + 1}, Col ${c + 1}] ` +
                  `leaves only ${single} as its candidate.`,
              };
            }
          }
        }

        // All cells in the same column?
        const colSet = new Set(cells.map(([_, c]) => c));
        if (colSet.size === 1) {
          const col = [...colSet][0];
          for (let r = 0; r < 9; r++) {
            if (Math.floor(r / 3) === br) continue; // still in the box
            if (grid[r][col] !== 0) continue;
            const cands = getPossibleValues(grid, r, col);
            if (!cands.has(v)) continue;
            const reduced = new Set([...cands].filter((x) => x !== v));
            if (reduced.size === 1) {
              const single = [...reduced][0];
              return {
                row: r, col, value: single,
                strategy: 'Box-Line Reduction',
                explanation:
                  `In the 3×3 box (rows ${br * 3 + 1}–${br * 3 + 3}, ` +
                  `cols ${bc * 3 + 1}–${bc * 3 + 3}), ` +
                  `the digit ${v} can only go in Column ${col + 1} (at ${cellLabel}). ` +
                  `Because ${v} is confined to that column within the box, ` +
                  `it cannot appear anywhere else in Column ${col + 1}. ` +
                  `Removing ${v} from Cell [Row ${r + 1}, Col ${col + 1}] ` +
                  `leaves only ${single} as its candidate.`,
              };
            }
          }
        }
      }
    }
  }

  return null;
}

// ─── Fallback: Trial & Error ─────────────────────────────────────────────────

function findTrialAndErrorHint(grid: Grid): Hint | null {
  const solved = solveSudoku(grid);
  if (!solved) return null;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== 0) continue;

      const correct = solved[r][c];
      const candidates = [...getPossibleValues(grid, r, c)].sort((a, b) => a - b);
      const wrong = candidates.filter((v) => v !== correct);

      let explanation: string;

      if (candidates.length === 2) {
        // Simple binary choice — explain clearly
        const other = wrong[0];
        explanation =
          `Cell [Row ${r + 1}, Col ${c + 1}] has two candidates: ${candidates.join(' or ')}. ` +
          `If you try ${other}, you will eventually reach a cell elsewhere in the puzzle ` +
          `that has no valid digit left — a contradiction. ` +
          `So ${other} is ruled out, and the answer is ${correct}.`;
      } else if (wrong.length === 1) {
        explanation =
          `Cell [Row ${r + 1}, Col ${c + 1}] has candidates: ${candidates.join(', ')}. ` +
          `Testing ${wrong[0]} leads to a dead end — somewhere later in the puzzle a cell ` +
          `becomes impossible to fill. The only value that keeps the puzzle solvable is ${correct}.`;
      } else {
        explanation =
          `Cell [Row ${r + 1}, Col ${c + 1}] has ${candidates.length} candidates: ` +
          `${candidates.join(', ')}. ` +
          `Each of ${wrong.join(', ')} was tested and leads to a contradiction elsewhere. ` +
          `Only ${correct} results in a valid, complete solution. ` +
          `This technique — placing a value and checking whether it causes a conflict — ` +
          `is called Trial & Error (or Bifurcation).`;
      }

      return {
        row: r, col: c, value: correct,
        strategy: 'Trial & Error',
        explanation,
      };
    }
  }

  return null;
}
