/** Pesos de la heurística de Pierre Dellacherie. */
export const DELLACHERIE_WEIGHTS = {
  landingHeight: -1,
  erodedPieceCells: 1,
  rowTransitions: -1,
  columnTransitions: -1,
  holes: -4,
  cumulativeWells: -1,
} as const;
