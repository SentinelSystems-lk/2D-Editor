import { useState } from "react";
import type { Shape } from "../store/editorStore";
import { getShapeBounds } from "../utils/shapeUtils";

type AlignmentLine = {
  points: number[];
  orientation: "vertical" | "horizontal";
};

export function useAlignment(
  shapes: Shape[],
  size: { width: number; height: number }
) {
  const [alignmentLines, setAlignmentLines] = useState<AlignmentLine[]>([]);

  const checkAlignment = (draggedShape: Shape) => {
    const SNAP_THRESHOLD = 5;
    const lines: AlignmentLine[] = [];
    const draggedBounds = getShapeBounds(draggedShape);

    const canvasCenterX = size.width / 2;
    const canvasCenterY = size.height / 2;

    lines.push({
      points: [canvasCenterX, 0, canvasCenterX, size.height],
      orientation: "vertical",
    });

    lines.push({
      points: [0, canvasCenterY, size.width, canvasCenterY],
      orientation: "horizontal",
    });

    shapes.forEach((shape) => {
      if (shape.id === draggedShape.id) return;

      const bounds = getShapeBounds(shape);

      if (Math.abs(draggedBounds.x - bounds.x) < SNAP_THRESHOLD) {
        lines.push({
          points: [bounds.x, 0, bounds.x, size.height],
          orientation: "vertical",
        });
      }
      if (Math.abs(draggedBounds.centerX - bounds.centerX) < SNAP_THRESHOLD) {
        lines.push({
          points: [bounds.centerX, 0, bounds.centerX, size.height],
          orientation: "vertical",
        });
      }
      if (
        Math.abs(
          draggedBounds.x + draggedBounds.width - (bounds.x + bounds.width)
        ) < SNAP_THRESHOLD
      ) {
        const x = bounds.x + bounds.width;
        lines.push({
          points: [x, 0, x, size.height],
          orientation: "vertical",
        });
      }

      if (Math.abs(draggedBounds.y - bounds.y) < SNAP_THRESHOLD) {
        lines.push({
          points: [0, bounds.y, size.width, bounds.y],
          orientation: "horizontal",
        });
      }
      if (Math.abs(draggedBounds.centerY - bounds.centerY) < SNAP_THRESHOLD) {
        lines.push({
          points: [0, bounds.centerY, size.width, bounds.centerY],
          orientation: "horizontal",
        });
      }
      if (
        Math.abs(
          draggedBounds.y + draggedBounds.height - (bounds.y + bounds.height)
        ) < SNAP_THRESHOLD
      ) {
        const y = bounds.y + bounds.height;
        lines.push({
          points: [0, y, size.width, y],
          orientation: "horizontal",
        });
      }
    });

    setAlignmentLines(lines);
  };

  const clearAlignment = () => {
    setAlignmentLines([]);
  };

  return {
    alignmentLines,
    checkAlignment,
    clearAlignment,
  };
}