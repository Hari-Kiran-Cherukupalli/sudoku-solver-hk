export type Grid = number[][];

export interface Hint {
  row: number;
  col: number;
  value: number;
  strategy: string;
  explanation: string;
}

export type CellOrigin = 'given' | 'solved' | 'hint';

export interface CellMeta {
  origin: CellOrigin;
  highlighted: boolean;
}

export type AppScreen = 'home' | 'loading' | 'solver';
