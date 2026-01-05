// hooks/useLineDrawing.ts
import { useRef } from "react";
import { useCanvasStore } from "../store/editorStore";
import type { LineType } from "../store/editorStore";

export function useLineDrawing(
  stageRef: React.RefObject<any>,
  isLineSelected: boolean
) {
  const isLineDrawing = useRef(false);
  const isControlPointDragging = useRef(false);
  const lastLineDragPos = useRef<{ x: number; y: number } | null>(null);

  const {
    addLine,
    setCurrentLine,
    currentLine,
    setLineSelected,
    lines,
    updateLine,
  } = useCanvasStore();

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

  const handleLineDragEnd = (e: any) => {
    const node = e.target;
    node.position({ x: 0, y: 0 });
    lastLineDragPos.current = null;
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
  };
}
