// store/editorStore.ts
import { create } from "zustand";
import type Konva from "konva";

// Shape Types
export type ShapeType = "rectangle" | "circle" | "triangle" | "text";

export type BaseShape = {
  id: string;
  x: number;
  y: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
};

export type RectangleShape = BaseShape & {
  type: "rectangle";
  width: number;
  height: number;
};

export type CircleShape = BaseShape & {
  type: "circle";
  radius: number;
};

export type TriangleShape = BaseShape & {
  type: "triangle";
  width: number;
  height: number;
};

export type EllipseShape = BaseShape & {
  type: "ellipse";
  radius: number;
};

export type ImageShape = BaseShape & {
  type: "image";
  src: string;
  width?: number;
  height?: number;
};

export type GLBShape = BaseShape & {
  type: "glb";
  src: string;
  width: number;
  height: number;
};

export type TextShape = BaseShape & { 
  type: "text"; 
  text: string; 
  fontSize: number; 
  width: number;
  fontFamily?: string;
  align?: string;
};

export type Shape =
  | RectangleShape
  | CircleShape
  | ImageShape
  | GLBShape
  | TextShape
  | TriangleShape;

type HistoryState = {
  shapes: Shape[];
};

// Store Type
type CanvasStore = {
  // Stage
  stage: Konva.Stage | null;
  setStage: (stage: Konva.Stage | null) => void;

  // Shapes
  shapes: Shape[];
  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;

  // Selection
  selectedShapeId: string | null;
  setSelectedShapeId: (id: string | null) => void;

  // Drawing State
  selectedShapeType: ShapeType | null;
  setSelectedShapeType: (type: ShapeType | null) => void;

  currentShape: Shape | null;
  setCurrentShape: (shape: Shape | null) => void;

  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;

  // Select Mode
  isSelectClicked: boolean;
  setSelectClick: (select: boolean) => void;

  isPenSelected: boolean;
  setPenSelected: (pen: boolean) => void;

  isDisjointMode: boolean;
  setDisjointMode: (mode: boolean) => void;

  clearCurrentShape: () => void;

  history: HistoryState[];
  historyStep: number;
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

// Create Store
export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // Stage
  stage: null,
  setStage: (stage) => set({ stage }),

  // Shapes
  shapes: [],

  // Selection
  selectedShapeId: null,
  setSelectedShapeId: (id) => set({ selectedShapeId: id }),

  // Drawing State
  selectedShapeType: null,
  setSelectedShapeType: (type) => set({ selectedShapeType: type }),

  currentShape: null,
  setCurrentShape: (shape) => set({ currentShape: shape }),

  isDrawing: false,
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),

  // Select Mode
  isSelectClicked: true,
  setSelectClick: (select) => set({ isSelectClicked: select }),

  isPenSelected: false,
  setPenSelected: (pen) => set({ isPenSelected: pen }),

  isDisjointMode: false,
  setDisjointMode: (mode) => set({ isDisjointMode: mode }),
  clearCurrentShape: () => set({ currentShape: null, isDrawing: false }),

  // History
  history: [{ shapes: [] }],
  historyStep: 0,
  canUndo: false,
  canRedo: false,

  // Save current state to history
  saveToHistory: () => {
    const state = get();
    const currentHistory = state.history.slice(0, state.historyStep + 1);
    const newHistory = [...currentHistory, { shapes: [...state.shapes] }];

    set({
      history: newHistory,
      historyStep: newHistory.length - 1,
      canUndo: true,
      canRedo: false,
    });
  },

  // Undo
  undo: () => {
    const state = get();
    if (state.historyStep === 0) return;

    const newStep = state.historyStep - 1;
    const previousState = state.history[newStep];

    set({
      shapes: [...previousState.shapes],
      historyStep: newStep,
      canUndo: newStep > 0,
      canRedo: true,
      selectedShapeId: null,
    });
  },

  // Redo
  redo: () => {
    const state = get();
    if (state.historyStep === state.history.length - 1) return;

    const newStep = state.historyStep + 1;
    const nextState = state.history[newStep];

    set({
      shapes: [...nextState.shapes],
      historyStep: newStep,
      canUndo: true,
      canRedo: newStep < state.history.length - 1,
      selectedShapeId: null,
    });
  },

  addShape: (shape) => {
    set((state) => ({
      shapes: [...state.shapes, shape],
    }));
    get().saveToHistory();
  },

  // Modified updateShape to save history
  updateShape: (id, updates) => {
    set((state) => ({
      shapes: state.shapes.map((shape) =>
        shape.id === id ? ({ ...shape, ...updates } as Shape) : shape
      ),
    }));
    get().saveToHistory();
  },

  // Modified deleteShape to save history
  deleteShape: (id) => {
    set((state) => ({
      shapes: state.shapes.filter((shape) => shape.id !== id),
      selectedShapeId:
        state.selectedShapeId === id ? null : state.selectedShapeId,
    }));
    get().saveToHistory();
  },

}));
