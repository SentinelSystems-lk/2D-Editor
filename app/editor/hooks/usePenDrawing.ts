import { useRef, useState } from "react";

type PenLine = {
  tool: "pen" | "eraser";
  points: number[];
};

export function usePenDrawing(
  stageRef: React.RefObject<any>,
  isPenSelected: boolean
) {
  const [penLines, setPenLines] = useState<PenLine[]>([]);
  const isPenDrawing = useRef(false);

  const handlePenMouseDown = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    isPenDrawing.current = true;
    setPenLines((prev) => [
      ...prev,
      { tool: "pen", points: [pointerPosition.x, pointerPosition.y] },
    ]);
  };

  const handlePenMouseMove = () => {
    if (!isPenDrawing.current) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    setPenLines((prev) => {
      const lastLine = prev[prev.length - 1];
      if (!lastLine) return prev;

      const updatedLine = {
        ...lastLine,
        points: lastLine.points.concat([pointerPosition.x, pointerPosition.y]),
      };
      return [...prev.slice(0, -1), updatedLine];
    });
  };

  const handlePenMouseUp = () => {
    isPenDrawing.current = false;
  };

  return {
    penLines,
    handlePenMouseDown,
    handlePenMouseMove,
    handlePenMouseUp,
  };
}