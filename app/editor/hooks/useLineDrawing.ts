// hooks/useLineDrawing.ts
import { useRef } from "react";
import { useCanvasStore } from "../store/editorStore";
import type { LineType } from "../store/editorStore";
import { useAlignment } from "./useAlignment";
import { useCollision } from "./useCollision";
import { useCanvasSize } from "../hooks/useCanvasSize";
import { useImageLoader } from "../hooks/useImageLoader";

export function useLineDrawing(
  stageRef: React.RefObject<any>,
  isLineSelected: boolean
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLineDrawing = useRef(false);
  const isControlPointDragging = useRef(false);
  const lastLineDragPos = useRef<{ x: number; y: number } | null>(null);
  const { size } = useCanvasSize(containerRef);

  const {
    addLine,
    setCurrentLine,
    currentLine,
    setLineSelected,
    setSelectedLineId,
    lines,
    updateLine,
    shapes,
  } = useCanvasStore();

  const { alignmentLines, checkAlignment, clearAlignment } = useAlignment(
    shapes,
    size
  );
  const { resolveCollisions } = useCollision(shapes);

  /* ================= LINE DRAWING ================= */

  const handleLineMouseDown = () => {
    if (!isLineSelected) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    isLineDrawing.current = true;


    const newLine: LineType = {
      id: `line-${Date.now()}`,
      points: [pos.x, pos.y, pos.x, pos.y],
      stroke: "#000000",
      strokeWidth: 2,
      alignToXAxis: undefined,
      alignToYAxis: undefined
    };

    setCurrentLine(newLine);
  };

  const handleLineMouseMove = () => {
    if (!isLineDrawing.current || !currentLine) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const [x1, y1] = currentLine.points;

    setCurrentLine({
      ...currentLine,
      points: [x1, y1, pos.x, pos.y],
    });
  };

  const handleLineMouseUp = () => {
    if (!isLineDrawing.current || !currentLine) return;

    isLineDrawing.current = false;
    addLine(currentLine);
    // select the newly created line
    if (currentLine?.id) {
      setSelectedLineId(currentLine.id);
    }
    setCurrentLine(null);
    setLineSelected(false);
    isControlPointDragging.current = false;
  };

  /* ================= LINE DRAG ================= */

  const handleLineDrag = (lineId: string, e: any) => {
    if (isControlPointDragging.current) return;

    const line = lines.find((l) => l.id === lineId);
    if (!line) return;

    const node = e.target;
    const pos = node.position();

    // First drag frame
    if (!lastLineDragPos.current) {
      lastLineDragPos.current = { x: pos.x, y: pos.y };
      return;
    }

    const dx = pos.x - lastLineDragPos.current.x;
    const dy = pos.y - lastLineDragPos.current.y;

    lastLineDragPos.current = { x: pos.x, y: pos.y };

    const newPoints = line.points.map((v, i) =>
      i % 2 === 0 ? v + dx : v + dy
    );

    updateLine(lineId, { points: newPoints });
  };

  const handleLineDragMove = (e: any) => {
  // Let Konva handle movement internally
};

  const handleLineDragEnd = (lineId: string, e: any) => {
  const line = lines.find((l) => l.id === lineId);
  if (!line) return;

  const node = e.target;
  const dx = node.x();
  const dy = node.y();

  if (dx === 0 && dy === 0) return;

  const newPoints = line.points.map((v, i) =>
    i % 2 === 0 ? v + dx : v + dy
  );

  // Reset node position
  node.position({ x: 0, y: 0 });

  updateLine(lineId, { points: newPoints });
};

  /* ================= CONTROL POINTS ================= */

  const handleControlPointMouseDown = (
    e: any,
    _lineId: string,
    _pointIndex: 0 | 2
  ) => {
    e.cancelBubble = true;
    isControlPointDragging.current = true;
  };

  const handleControlPointDragMove = (
    e: any,
    lineId: string,
    pointIndex: 0 | 2
  ) => {
    e.cancelBubble = true;

    const node = e.target;
    const line = lines.find((l) => l.id === lineId);
    if (!line) return;

    const newPoints = [...line.points];
    newPoints[pointIndex] = node.x();
    newPoints[pointIndex + 1] = node.y();

    updateLine(lineId, { points: newPoints });
  };

  const handleControlPointDragEnd = () => {
    isControlPointDragging.current = false;
  };

  const handleLineDragWithAlignment = (lineId: string, e: any) => {
    // perform the line drag update (updates store)
    handleLineDrag(lineId, e);

    // read updated line from store and compute bounds for alignment
    const updated = lines.find((l) => l.id === lineId);
    if (!updated) return;
    const [x1, y1, x2, y2] = updated.points;
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    // craft a temporary rectangle-like object for alignment checks
    checkAlignment({
      id: lineId,
      type: "rectangle",
      x,
      y,
      width,
      height,
      scaleX: 1,
      scaleY: 1,
    } as any);
  };

  const handleControlPointDragMoveWithAlignment = (
    e: any,
    lineId: string,
    pointIndex: 0 | 2
  ) => {
    handleControlPointDragMove(e, lineId, pointIndex);

    const updated = lines.find((l) => l.id === lineId);
    if (!updated) return;
    const px = updated.points[pointIndex];
    const py = updated.points[pointIndex + 1];

    // treat the dragged point as a zero-size rect/point for alignment
    checkAlignment({
      id: lineId,
      type: "rectangle",
      x: px,
      y: py,
      width: 0,
      height: 0,
      scaleX: 1,
      scaleY: 1,
    } as any);
  };

  return {
    handleLineMouseDown,
    handleLineMouseMove,
    handleLineMouseUp,
    handleLineDrag,
    handleControlPointMouseDown,
    handleControlPointDragMove,
    handleControlPointDragEnd,
    handleLineDragEnd,
    isControlPointDragging,
    handleLineDragWithAlignment,
    handleControlPointDragMoveWithAlignment,
    handleLineDragMove,
  };
}
