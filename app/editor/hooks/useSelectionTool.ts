import { useState, useRef, useCallback } from "react";
import type Konva from "konva";
import type { Shape, LineType } from "../store/editorStore";

type SelectionRectangle = {
  visible: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

// Helper functions for rotated rectangle bounds
const degToRad = (angle: number) => (angle / 180) * Math.PI;

const getCorner = (
  pivotX: number,
  pivotY: number,
  diffX: number,
  diffY: number,
  angle: number
) => {
  const distance = Math.sqrt(diffX * diffX + diffY * diffY);
  angle += Math.atan2(diffY, diffX);
  const x = pivotX + distance * Math.cos(angle);
  const y = pivotY + distance * Math.sin(angle);
  return { x, y };
};

const getClientRect = (element: Shape) => {
  const { x, y, rotation = 0 } = element;
  let width = 0;
  let height = 0;

  if (element.type === "rectangle") {
    width = element.width * (element.scaleX || 1);
    height = element.height * (element.scaleY || 1);
  } else if (element.type === "circle") {
    const radius = element.radius * (element.scaleX || 1);
    width = radius * 2;
    height = radius * 2;
  } else if (element.type === "triangle") {
    width = element.width * (element.scaleX || 1);
    height = element.height * (element.scaleY || 1);
  } else if (element.type === "text") {
    width = element.width * (element.scaleX || 1);
    height = element.fontSize * 1.5 * (element.scaleY || 1);
  } else if (element.type === "image" || element.type === "glb") {
    width = (element.width || 0) * (element.scaleX || 1);
    height = (element.height || 0) * (element.scaleY || 1);
  } else if (element.type === "polygon") {
    const radius = element.radius * (element.scaleX || 1);
    width = radius * 2;
    height = radius * 2;
  } else {
    return { x, y, width, height };
  }

  const rad = degToRad(rotation);
  const p1 = getCorner(x, y, 0, 0, rad);
  const p2 = getCorner(x, y, width, 0, rad);
  const p3 = getCorner(x, y, width, height, rad);
  const p4 = getCorner(x, y, 0, height, rad);

  const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
  const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
  const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
  const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

const getClientRectToLine = (line: LineType) => {
  const x1 = line.points[0];
  const y1 = line.points[1];
  const x2 = line.points[2];
  const y2 = line.points[3];

  const strokeWidth = (line.strokeWidth || 1) / 2; // Half-width buffer on each side

  // Get basic bounding box
  let minX = Math.min(x1, x2) - strokeWidth;
  let maxX = Math.max(x1, x2) + strokeWidth;
  let minY = Math.min(y1, y2) - strokeWidth;
  let maxY = Math.max(y1, y2) + strokeWidth;

  // Account for line rotation if applicable
  // if (line.rotation) {
  //     const rad = degToRad(line.rotation);
  //     const cx = (x1 + x2) / 2;
  //     const cy = (y1 + y2) / 2;

  //     const p1 = getCorner(cx, cy, x1 - cx, y1 - cy, rad);
  //     const p2 = getCorner(cx, cy, x2 - cx, y2 - cy, rad);

  //     minX = Math.min(p1.x, p2.x) - strokeWidth;
  //     maxX = Math.max(p1.x, p2.x) + strokeWidth;
  //     minY = Math.min(p1.y, p2.y) - strokeWidth;
  //     maxY = Math.max(p1.y, p2.y) + strokeWidth;
  // }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

// Check if two rectangles intersect
const haveIntersection = (r1: any, r2: any) => {
  return !(
    r2.x > r1.x + r1.width ||
    r2.x + r2.width < r1.x ||
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  );
};

const isPointNearLine = (
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  threshold: number = 5
) => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;

  return Math.sqrt(dx * dx + dy * dy) <= threshold;
};

const lineIntersectsBox = (line: LineType, box: any, threshold: number = 5) => {
  const x1 = line.points[0];
  const y1 = line.points[1];
  const x2 = line.points[2];
  const y2 = line.points[3];

  // Check if either endpoint is inside the box
  if (
    (x1 >= box.x &&
      x1 <= box.x + box.width &&
      y1 >= box.y &&
      y1 <= box.y + box.height) ||
    (x2 >= box.x &&
      x2 <= box.x + box.width &&
      y2 >= box.y &&
      y2 <= box.y + box.height)
  ) {
    return true;
  }
  // Check if line passes through the box
  const boxPoints = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height },
  ];

  for (const point of boxPoints) {
    if (isPointNearLine(point.x, point.y, x1, y1, x2, y2, threshold)) {
      return true;
    }
  }

  // Check line bounds intersection with box
  const lineBounds = getClientRectToLine(line);
  return haveIntersection(box, lineBounds);
};

export function useSelectionTool(
  isSelectClicked: boolean,
  shapes: Shape[],
  lines: LineType[],
  stageRef: React.RefObject<any>
) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionRectangle, setSelectionRectangle] =
    useState<SelectionRectangle>({
      visible: false,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
    });

  const isSelecting = useRef(false);

  // Handle click on stage or shapes or lines
  const handleSelectionClick = useCallback(
    (e: any) => {
      if (!isSelectClicked) return;

      // If we are selecting with rect, do nothing
      if (selectionRectangle.visible) {
        return;
      }

      // If click on empty area - remove all selections
      if (e.target === e.target.getStage()) {
        setSelectedIds([]);
        return;
      }

      const clickedId = e.target.id();

      if (!clickedId) return;

      // Check if clicked on a shape
      const clickedShape = shapes.find((s) => s.id === clickedId);
      if (clickedShape) {
        // Check if modifier keys are pressed (Shift/Ctrl/Cmd)
        const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        const isSelected = selectedIds.includes(clickedId);

        if (!metaPressed && !isSelected) {
          // Single selection
          setSelectedIds([clickedId]);
        } else if (metaPressed && isSelected) {
          // Remove from selection
          setSelectedIds(selectedIds.filter((id) => id !== clickedId));
        } else if (metaPressed && !isSelected) {
          // Add to selection
          setSelectedIds([...selectedIds, clickedId]);
        }
        return;
      }

      // Check if clicked on a line
      const clickedLine = lines.find((l) => l.id === clickedId);
      if (clickedLine) {
        const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        const isSelected = selectedIds.includes(clickedId);

        if (!metaPressed && !isSelected) {
          // Single selection
          setSelectedIds([clickedId]);
        } else if (metaPressed && isSelected) {
          // Remove from selection
          setSelectedIds(selectedIds.filter((id) => id !== clickedId));
        } else if (metaPressed && !isSelected) {
          // Add to selection
          setSelectedIds([...selectedIds, clickedId]);
        }
        return;
      }
      // Clicked on something else - do nothing
      return;
    },
    [isSelectClicked, selectionRectangle.visible, shapes, selectedIds, lines]
  );

  // Start drag selection
  const handleSelectionMouseDown = useCallback(
    (e: any) => {
      if (!isSelectClicked) return;

      // Check if we clicked on an already selected shape/line
      const clickedOnShape = e.target !== e.target.getStage();
      if (clickedOnShape) {
        const id = e.target.id();
        if (selectedIds.includes(id)) {
          // Clicking on already selected item - don't start selection box
          return;
        }
      }

      // Do nothing if we mousedown on any shape
      if (e.target !== e.target.getStage()) {
        return;
      }

      const stage = stageRef.current;
      if (!stage) return;

      isSelecting.current = true;
      const pos = stage.getPointerPosition();

      setSelectionRectangle({
        visible: true,
        x1: pos.x,
        y1: pos.y,
        x2: pos.x,
        y2: pos.y,
      });
    },
    [isSelectClicked, stageRef, selectedIds]
  );

  // Update drag selection rectangle
  const handleSelectionMouseMove = useCallback(
  (e: any) => {
    if (!isSelectClicked || !isSelecting.current) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return; // Add null check for pointer position

    setSelectionRectangle((prev) => ({
      ...prev,
      x2: pos.x,
      y2: pos.y,
    }));
  },
  [isSelectClicked, stageRef]
);

  // Finish drag selection
  const handleSelectionMouseUp = useCallback(() => {
    if (!isSelectClicked || !isSelecting.current) return;

    isSelecting.current = false;

    // Update visibility in timeout to prevent click event
    setTimeout(() => {
      setSelectionRectangle((prev) => ({
        ...prev,
        visible: false,
      }));
    });

    // Calculate selection box
    const selBox = {
      x: Math.min(selectionRectangle.x1, selectionRectangle.x2),
      y: Math.min(selectionRectangle.y1, selectionRectangle.y2),
      width: Math.abs(selectionRectangle.x2 - selectionRectangle.x1),
      height: Math.abs(selectionRectangle.y2 - selectionRectangle.y1),
    };

    // Find all shapes and that intersect with selection box
    const selected = shapes.filter((shape) => {
      return haveIntersection(selBox, getClientRect(shape));
    });

    // Find all lines that intersect with selection box
    const selectedLines = lines.filter((line) => {
      return lineIntersectsBox(line, selBox);
    });

    setSelectedIds([
      ...selected.map((shape) => shape.id),
      ...selectedLines.map((line) => line.id),
    ]);
  }, [isSelectClicked, selectionRectangle, shapes, lines]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Select all shapes
  const selectAll = useCallback(() => {
    const allIds = [...shapes.map((s) => s.id), ...lines.map((l) => l.id)];
    setSelectedIds(allIds);
  }, [shapes, lines]);

  // Get selection box coordinates for rendering
  const getSelectionBox = useCallback(() => {
    if (!selectionRectangle.visible) return null;

    return {
      x: Math.min(selectionRectangle.x1, selectionRectangle.x2),
      y: Math.min(selectionRectangle.y1, selectionRectangle.y2),
      width: Math.abs(selectionRectangle.x2 - selectionRectangle.x1),
      height: Math.abs(selectionRectangle.y2 - selectionRectangle.y1),
    };
  }, [selectionRectangle]);

  return {
    selectedIds,
    setSelectedIds,
    selectionRectangle,
    handleSelectionClick,
    handleSelectionMouseDown,
    handleSelectionMouseMove,
    handleSelectionMouseUp,
    clearSelection,
    selectAll,
    getSelectionBox,
  };
}
