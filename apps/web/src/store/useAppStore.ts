import { create } from 'zustand';
import type { Spark, Concept } from '../types';

interface AppState {
  // Capture modal
  captureOpen: boolean;
  openCapture: () => void;
  closeCapture: () => void;

  // Quick filter state for browse view
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;

  // Cached graph/index data freshness
  indexStale: boolean;
  graphStale: boolean;
  markIndexStale: () => void;
  markGraphStale: () => void;
  clearStale: () => void;

  // Selected spark (for detail panel, not full-page)
  selectedSpark: Spark | null;
  setSelectedSpark: (spark: Spark | null) => void;

  // Selected concept
  selectedConcept: Concept | null;
  setSelectedConcept: (concept: Concept | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  captureOpen: false,
  openCapture: () => set({ captureOpen: true }),
  closeCapture: () => set({ captureOpen: false }),

  activeTag: null,
  setActiveTag: (tag) => set({ activeTag: tag }),

  indexStale: false,
  graphStale: false,
  markIndexStale: () => set({ indexStale: true }),
  markGraphStale: () => set({ graphStale: true }),
  clearStale: () => set({ indexStale: false, graphStale: false }),

  selectedSpark: null,
  setSelectedSpark: (spark) => set({ selectedSpark: spark }),

  selectedConcept: null,
  setSelectedConcept: (concept) => set({ selectedConcept: concept }),
}));
