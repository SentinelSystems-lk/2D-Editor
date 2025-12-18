"use client";

import type Konva from "konva";
import React, { use, useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Circle } from "react-konva";
import { useCanvasStore } from "../store/editorStore";
import { useLayoutEffect } from "react";
import { createShape, updateShape } from "../utils/shapeFactory";
import type { Shape } from "../store/editorStore";

type RectType = {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
};

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  // const [rects, setRects] = useState<RectType[]>([]);
  // const [newRect, setNewRect] = useState<RectType | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  // const [isDrawing, setIsDrawing] = useState(false);
  // const setStage = useCanvasStore((state) => state.setStage);
  const select = useCanvasStore((state) => state.isSelectClicked);

  const {
    shapes,
    currentShape,
    isDrawing,
    selectedShapeType,
    setStage,
    addShape,
    setCurrentShape,
    setIsDrawing,
    clearCurrentShape,
  } = useCanvasStore();

  useLayoutEffect(() => {
    if (stageRef.current) {
      setStage(stageRef.current);
    }
  }, [size.width, size.height, setStage]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize(); // initial size
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  function handleMouseDown(e:any) {

    if(select){
      return;
    }


    if (e.target !== e.target.getStage()) {
      return;
    }
    const stage = stageRef.current;
    if (stage) {
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        const { x, y } = pointerPosition;
        const newShape = createShape(
          selectedShapeType,
          x,
          y,
          Date.now().toString()
        );
        setCurrentShape(newShape);
        setIsDrawing(true);
      }
    }
  }

  function handleMouseMove() {
    if (!currentShape || !isDrawing) return;
    const stage = stageRef.current;
    if (stage) {
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        const { x, y } = pointerPosition;
        const updatedShape = updateShape(currentShape, x, y);
        setCurrentShape(updatedShape);
      }
      setIsDrawing(true);
    }
  }
  function handleMouseUp() {
    if (currentShape) {
      addShape(currentShape);
    }
    clearCurrentShape();
  }

  const renderShape = (shape: Shape, draggable = false) => {
    const commonProps = {
      key: shape.id,
      x: shape.x,
      y: shape.y,
      fill: "blue",
      draggable,
      opacity: 0.7,
    };

    switch (shape.type) {
      case "rectangle":
        return (
          <Rect
            key={shape.id}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill="blue"
            opacity={0.7}
            draggable
          />
        );

      case "circle":
        return (
          <Circle
            key={shape.id}
            x={shape.x}
            y={shape.y}
            radius={shape.radius}
            fill="blue"
            opacity={0.7}
            draggable
          />
        );

      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="viewportContainer">
      {size.width > 0 && size.height > 0 && (
        <Stage
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          width={size.width}
          height={size.height}
          className="canvas"
          ref={stageRef}
        >
          <Layer>
            {/* Render all finished shapes (draggable) */}
            {shapes.map((shape) => (
              <React.Fragment key={shape.id}>
                {renderShape(shape, true)}
              </React.Fragment>
            ))}

            {/* Render current shape being drawn (not draggable) */}
            {currentShape && renderShape(currentShape, false)}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
