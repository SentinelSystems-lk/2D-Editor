"use client";

import type Konva from "konva";
import React, { use, useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Circle } from "react-konva";
import { useCanvasStore } from "../store/editorStore";
import { useLayoutEffect } from "react";

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
  const [rects, setRects] = useState<RectType[]>([]);
  const [newRect, setNewRect] = useState<RectType | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const setStage = useCanvasStore((state) => state.setStage);

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

  function handleMouseDown() {
    const stage = stageRef.current;
    if (stage) {
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        const { x, y } = pointerPosition;
        setNewRect({ x, y, width: 0, height: 0, id: Date.now().toString() });
        setIsDrawing(true);
      }
    }
  }

  function handleMouseMove() {
    if (!newRect || !isDrawing) return;
    const stage = stageRef.current;
    if (stage) {
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        const { x, y } = pointerPosition;
        setNewRect({
          ...newRect,
          width: x - newRect.x,
          height: y - newRect.y,
        });
        setIsDrawing(true);
      }
    }
  }

  function handleMouseUp() {
    if (newRect) {
      setRects((prev) => [...prev, newRect]);
    }
    setNewRect(null);
    setIsDrawing(false);
  }

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
            {rects.map((rect) => (
              <Rect key={rect.id} {...rect} fill="blue" draggable />
            ))}

            {newRect && <Rect {...newRect} fill="blue" />}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
