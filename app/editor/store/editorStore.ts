// store/editorStore.ts
import { create } from "zustand";
import type Konva from "konva";

// Shape Types
export type ShapeType = "rectangle" | "circle" | "triangle" | "text" | "image" | "glb" | "polygon";

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

export type PolygonShape = BaseShape &{
  type: "polygon";
  radius: number;
  sides: number;
}

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
  | TriangleShape
  | PolygonShape;



export type LineType = {
  alignToXAxis: any;
  alignToYAxis: any;
  id: string;
  points: number[]; // [x1, y1, x2, y2]
  stroke: string;
  strokeWidth: number;
  opacity?: number;
};

// History Type

type HistoryState = {
  shapes: Shape[];
  lines: LineType[];
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

  //Lines
  lines: LineType[];
  addLine: (line: LineType) => void;
  updateLine: (id: string, updates: Partial<LineType>) => void;
  deleteLine: (id: string) => void;
  alignLineToXAxis: (id: string) => void;
  alignToYAxis: (id: string) => void;

  // Selection
  selectedShapeId: string | null;
  setSelectedShapeId: (id: string | null) => void;

  selectedLineId: string | null;
  setSelectedLineId: (id: string | null) => void;


  // Drawing State
  selectedShapeType: ShapeType | null;
  setSelectedShapeType: (type: ShapeType | null) => void;

  currentShape: Shape | null;
  setCurrentShape: (shape: Shape | null) => void;

  currentLine: LineType | null;
  setCurrentLine: (line: LineType | null) => void;

  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;

  // Select Mode
  isSelectClicked: boolean;
  setSelectClick: (select: boolean) => void;

  isPenSelected: boolean;
  setPenSelected: (pen: boolean) => void;

  isLineSelected: boolean;
  setLineSelected: (line: boolean) => void;

  isPenDrawing: boolean;
  setIsPenDrawing: (drawing: boolean) => void;

  isLineDrawing: boolean;
  setIsLineDrawing: (drawing: boolean) => void;

  isDisjointMode: boolean;
  setDisjointMode: (mode: boolean) => void;

  clearCurrentShape: () => void;
  clearCurrentLine: () => void;

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

  // Lines
  lines: [],

  // Selection
  selectedShapeId: null,
  setSelectedShapeId: (id) => set({ selectedShapeId: id }),

  selectedLineId: null,
  setSelectedLineId: (id) => set({ selectedLineId: id }),

  // Drawing State
  selectedShapeType: null,
  setSelectedShapeType: (type) => set({ selectedShapeType: type }),

  currentShape: null,
  setCurrentShape: (shape) => set({ currentShape: shape }),

  currentLine: null,
  setCurrentLine: (line) => set({ currentLine: line }),

  isDrawing: false,
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),

  // Select Mode
  isSelectClicked: true,
  setSelectClick: (select) => set({ isSelectClicked: select }),

  isPenSelected: false,
  setPenSelected: (pen) => set({ isPenSelected: pen }),

  isPenDrawing: false,
  setIsPenDrawing: (drawing) => set({ isPenDrawing: drawing }),

  isLineDrawing: false,
  setIsLineDrawing: (drawing) => set({ isLineDrawing: drawing }),

  isLineSelected: false,
  setLineSelected: (line) => set({ isLineSelected: line }),

  isDisjointMode: false,
  setDisjointMode: (mode) => set({ isDisjointMode: mode }),
  clearCurrentShape: () => set({ currentShape: null, isDrawing: false }),
  clearCurrentLine: () => set({ currentLine: null, isDrawing: false }),

  // History
  history: [{ shapes: [] , lines: []}],
  historyStep: 0,
  canUndo: false,
  canRedo: false,

  // Save current state to history
  saveToHistory: () => {
    const state = get();
    const currentHistory = state.history.slice(0, state.historyStep + 1);
    const newHistory = [...currentHistory, { shapes: [...state.shapes] , lines: [...state.lines]}];

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
      selectedLineId: null,
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
      selectedLineId: null,
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

  // Line operations
  addLine: (line) => {
    set((state) => ({
      lines: [...state.lines, line],
    }));
    get().saveToHistory();
  },

  updateLine: (id, updates) => {
    set((state) => ({
      lines: state.lines.map((line) =>
        line.id === id ? { ...line, ...updates } : line
      ),
    }));
    get().saveToHistory();
  },

  // Align a line horizontally (make it parallel to X axis)
  alignLineToXAxis: (id: string) => {
    set((state) => {
      const line = state.lines.find((l) => l.id === id);
      if (!line) return {} as Partial<CanvasStore>;

      // Compute average Y of the two endpoints (points: [x1,y1,x2,y2])
      const points = [...line.points];
      if (points.length >= 4) {
        const y1 = points[1];
        const y2 = points[3];
        const avgY = (y1 + y2) / 2;
        points[1] = avgY;
        points[3] = avgY;
      }

      return {
        lines: state.lines.map((l) => (l.id === id ? { ...l, points } : l)),
      } as Partial<CanvasStore>;
    });
    get().saveToHistory();
  },

  alignToYAxis: (id: string) => {
    set((state) => {
      const line = state.lines.find((l) => l.id === id);
      if (!line) return {} as Partial<CanvasStore>;

      // Compute average X of the two endpoints (points: [x1,y1,x2,y2])
      const points = [...line.points];
      if (points.length >= 4) {
        const x1 = points[0];
        const x2 = points[2];
        const avgX = (x1 + x2) / 2;
        points[0] = avgX;
        points[2] = avgX;
      }

      return {
        lines: state.lines.map((l) => (l.id === id ? { ...l, points } : l)),
      } as Partial<CanvasStore>;
    });
    get().saveToHistory();
  },


  deleteLine: (id) => {
    set((state) => ({
      lines: state.lines.filter((line) => line.id !== id),
      selectedLineId: state.selectedLineId === id ? null : state.selectedLineId,
    }));
    get().saveToHistory();
  },

}));
