// hooks/useLineDrawing.ts
import { useRef } from "react";
import { useCanvasStore } from "../store/editorStore";
import type { LineType } from "../store/editorStore";

export function useLineDrawing(
  stageRef: React.RefObject<any>,
  isLineSelected: boolean
) {
    const draggedPointRef = useRef<{ lineId: string; pointIndex: 0 | 2 } | null>(null);
  const isLineDrawing = useRef(false);
  const {
    addLine,
    setCurrentLine,
    currentLine,
    setLineSelected,
    lines,
    updateLine,
  } = useCanvasStore();

  const handleLineMouseDown = () => {
    if (!isLineSelected) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    isLineDrawing.current = true;

    // Create a new line for live preview
    const newLine: LineType = {
      id: `line-${Date.now()}`,
      points: [
        pointerPosition.x,
        pointerPosition.y,
        pointerPosition.x,
        pointerPosition.y,
      ],
      stroke: "#000000",
      strokeWidth: 2,
    };

    setCurrentLine(newLine);
  };

  const handleLineMouseMove = () => {
    if (!isLineDrawing.current || !currentLine) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Update the end point of the line
    const x1 = currentLine.points[0];
    const y1 = currentLine.points[1];

    setCurrentLine({
      ...currentLine,
      points: [x1, y1, pointerPosition.x, pointerPosition.y],
    });
  };

  const handleLineDrag = (lineId: string, e: any) => {
    const line = lines.find((l) => l.id === lineId);
    if (!line) return;

    const node = e.target;
    // Prefer pointer movement delta when available for smooth updates
    const movementX = e.evt?.movementX ?? node.x();
    const movementY = e.evt?.movementY ?? node.y();

    const newPoints = line.points.map((coord, i) =>
      i % 2 === 0 ? coord + movementX : coord + movementY
    );

    // Reset node translation (we applied delta to points)
    node.position({ x: 0, y: 0 });
    updateLine(lineId, { points: newPoints });
  };

  const handleControlPointMouseDown = (
    e: any,
    lineId: string,
    pointIndex: 0 | 2
  ) => {
    e.cancelBubble = true
    draggedPointRef.current = { lineId, pointIndex };
  };

  const handleControlPointDragMove = (
    e: any,
    lineId: string,
    pointIndex: 0 | 2
  ) => {
    const node = e.target;
    const pos = node.getAbsolutePosition();
    const stage = stageRef.current;

    if (!stage || !pos) return;

    const line = lines.find((l) => l.id === lineId);
    if (!line) return;

    const newPoints = [...line.points];
    newPoints[pointIndex] = pos.x;
    newPoints[pointIndex + 1] = pos.y;

    updateLine(lineId, { points: newPoints });
    node.position({ x: 0, y: 0 });
  };

  const handleLineMouseUp = () => {
    if (!isLineDrawing.current || !currentLine) return;

    isLineDrawing.current = false;

    // Add the completed line to lines array
    addLine(currentLine);
    setCurrentLine(null);
    setLineSelected(false);
  };

  return {
    handleLineMouseDown,
    handleLineMouseMove,
    handleLineMouseUp,
    handleLineDrag,
    handleControlPointMouseDown,
    handleControlPointDragMove,
  };
}
