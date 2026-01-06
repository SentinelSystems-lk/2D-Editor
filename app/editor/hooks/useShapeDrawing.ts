import { useCanvasStore } from "../store/editorStore";
import { createShape, updateShape } from "../utils/shapeFactory";

export function useShapeDrawing(stageRef: React.RefObject<any>) {
  const {
    currentShape,
    isDrawing,
    selectedShapeType,
    setSelectedShapeType,
    addShape,
    setCurrentShape,
    setIsDrawing,
    clearCurrentShape,
    setSelectedShapeId,
  } = useCanvasStore();

  const handleDrawingMouseDown = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const { x, y } = pointerPosition;
    if (!selectedShapeType) return;

    const newShape = createShape(selectedShapeType, x, y, Date.now().toString());
    setCurrentShape(newShape);
    setIsDrawing(true);
  };

  const handleDrawingMouseMove = () => {
    if (!currentShape || !isDrawing) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const { x, y } = pointerPosition;
    const updatedShape = updateShape(currentShape, x, y);
    setCurrentShape(updatedShape);
  };

  const handleDrawingMouseUp = () => {
    if (currentShape) {
      let isValid = false;

      if (currentShape.type === "rectangle") {
        isValid =
          Math.abs(currentShape.width) > 5 && Math.abs(currentShape.height) > 5;
      } else if (currentShape.type === "circle") {
        isValid = currentShape.radius > 5;
      } else if (currentShape.type === "triangle") {
        isValid =
          Math.abs(currentShape.width) > 5 && Math.abs(currentShape.height) > 5;
      } else if (currentShape.type === "polygon") {
        // polygon uses radius
        isValid = (currentShape as any).radius > 5;
      } else if (currentShape.type === "text") {
        isValid = true;
      }

      if (isValid) {
        addShape(currentShape);
        setSelectedShapeId(currentShape.id);
        setSelectedShapeType(null);
      }
    }
    clearCurrentShape();
  };

  return {
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
  };
}