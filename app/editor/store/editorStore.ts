// store.ts
import { create } from "zustand";
import type Konva from "konva";

export type ShapeType = 'rectangle' | 'circle';

export type BaseShape = {
  id: string;
  x: number;
  y: number;
};

export type RectangleShape = BaseShape & {
  type: 'rectangle';
  width: number;
  height: number;
};

export type CircleShape = BaseShape & {
  type: 'circle';
  radius: number;
};


export type Shape = RectangleShape | CircleShape;

type CanvasStore = {
  stage: Konva.Stage | null;
  setStage: (stage: Konva.Stage | null) => void;

  // Shapes
  shapes: Shape[];
  addShape: (shape: Shape) => void;
  
  // Drawing State
  selectedShapeType: ShapeType;
  setSelectedShapeType: (type: ShapeType) => void;
  
  currentShape: Shape | null;
  setCurrentShape: (shape: Shape | null) => void;
  
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;

  isSelectClicked:boolean;
  setSelectClick: (select: boolean) => void;
  
  clearCurrentShape: () => void;
};

export const useCanvasStore = create<CanvasStore>((set) => ({
  stage: null,
  setStage: (stage) => set({ stage }),

  // Shapes
  shapes: [],
  addShape: (shape) => set((state) => ({ 
    shapes: [...state.shapes, shape] 
  })),
  
  // Drawing State
  selectedShapeType: 'rectangle',
  setSelectedShapeType: (type) => set({ selectedShapeType: type }),
  
  currentShape: null,
  setCurrentShape: (shape) => set({ currentShape: shape }),
  
  isDrawing: false,
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),

  isSelectClicked:true,
  setSelectClick: (select) => set({ isSelectClicked: select }),
  
  
  clearCurrentShape: () => set({ currentShape: null, isDrawing: false }),
}));