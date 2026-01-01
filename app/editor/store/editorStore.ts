// store/editorStore.ts
import { create } from "zustand";
import type Konva from "konva";

// Shape Types
export type ShapeType = "rectangle" | "circle" | "triangle" ;

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

export type Shape = RectangleShape | CircleShape | ImageShape | GLBShape | TriangleShape;

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
  selectedShapeType: ShapeType;
  setSelectedShapeType: (type: ShapeType) => void;

  currentShape: Shape | null;
  setCurrentShape: (shape: Shape | null) => void;

  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;

  // Select Mode
  isSelectClicked: boolean;
  setSelectClick: (select: boolean) => void;

  isPenSelected: boolean;
  setPenSelected: (pen: boolean) => void;

  clearCurrentShape: () => void;
};

// Create Store
export const useCanvasStore = create<CanvasStore>((set) => ({
  // Stage
  stage: null,
  setStage: (stage) => set({ stage }),

  // Shapes
  shapes: [],
  addShape: (shape) =>
    set((state) => ({
      shapes: [...state.shapes, shape],
    })),
  updateShape: (id, updates) =>
    set((state) => ({
      shapes: state.shapes.map((shape) =>
        shape.id === id ? ({ ...shape, ...updates } as Shape) : shape
      ),
    })),
  deleteShape: (id) =>
    set((state) => ({
      shapes: state.shapes.filter((shape) => shape.id !== id),
      selectedShapeId:
        state.selectedShapeId === id ? null : state.selectedShapeId,
    })),

  // Selection
  selectedShapeId: null,
  setSelectedShapeId: (id) => set({ selectedShapeId: id }),

  // Drawing State
  selectedShapeType: "rectangle",
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

  clearCurrentShape: () => set({ currentShape: null, isDrawing: false }),
}));