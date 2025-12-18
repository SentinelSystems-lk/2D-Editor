// store.ts
import { create } from "zustand";
import type Konva from "konva";

type CanvasStore = {
  stage: Konva.Stage | null;
  setStage: (stage: Konva.Stage | null) => void;
};

export const useCanvasStore = create<CanvasStore>((set) => ({
  stage: null,
  setStage: (stage) => set({ stage }),
}));