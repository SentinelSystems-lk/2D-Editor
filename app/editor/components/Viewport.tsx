"use client";

import type Konva from "konva";
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { Stage, Layer, Line, Transformer } from "react-konva";
import { useCanvasStore } from "../store/editorStore";
import type { Shape, ImageShape, GLBShape } from "../store/editorStore";
import { GLBRenderer } from "./GLBRender";
import { useCanvasSize } from "../hooks/useCanvasSize";
import { useImageLoader } from "../hooks/useImageLoader";
import { useShapeSelection } from "../hooks/useShapeSelection";
import { usePenDrawing } from "../hooks/usePenDrawing";
import { useShapeDrawing } from "../hooks/useShapeDrawing";
import { useAlignment } from "../hooks/useAlignment";
import { useCollision } from "../hooks/useCollision";
import { useGLBInteraction } from "../hooks/useGLBInteraction";
import { renderShape } from "../utils/shapeRenderer";
import { handleFileDrop } from "../utils/fileHandlers";

// SUPPORTING FILES TO CREATE:
// See artifacts for complete implementation files

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const shapeRefs = useRef<Map<string, Konva.Node>>(new Map());
  const transformerRef = useRef<Konva.Transformer | null>(null);

  const {
    shapes,
    currentShape,
    selectedShapeId,
    isPenSelected,
    isDisjointMode,
    setStage,
    addShape,
    setSelectedShapeId,
    updateShape: updateShapeInStore,
  } = useCanvasStore();

  const { size } = useCanvasSize(containerRef);
  const { loadedImages } = useImageLoader(shapes);
  const { glbInteractionModes, glbCanvases, setGlbCanvases, handleGLBModeToggle } = useGLBInteraction();
  
  const { alignmentLines, checkAlignment, clearAlignment } = useAlignment(shapes, size);
  const { resolveCollisions } = useCollision(shapes);
  
  const { penLines, handlePenMouseDown, handlePenMouseMove, handlePenMouseUp } = usePenDrawing(
    stageRef,
    isPenSelected
  );

  const {
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
  } = useShapeDrawing(stageRef);

  useShapeSelection(
    selectedShapeId,
    shapes,
    shapeRefs,
    transformerRef,
    glbInteractionModes
  );

  useLayoutEffect(() => {
    if (stageRef.current) {
      setStage(stageRef.current);
    }
  }, [size.width, size.height, setStage]);

  const handleMouseDown = (e: any) => {
    if (isPenSelected) {
      handlePenMouseDown();
      setSelectedShapeId(null);
      clearAlignment();
      return;
    }

    const clickedOnTransformer = e.target.getParent()?.className === "Transformer";
    if (clickedOnTransformer) return;

    const clickedOnShape = e.target !== e.target.getStage();
    if (clickedOnShape) {
      const shapeId = e.target.id();
      setSelectedShapeId(shapeId);
      return;
    }

    setSelectedShapeId(null);
    clearAlignment();
    handleDrawingMouseDown();
  };

  const handleMouseMove = () => {
    if (isPenSelected) {
      handlePenMouseMove();
      return;
    }
    handleDrawingMouseMove();
  };

  const handleMouseUp = () => {
    if (isPenSelected) {
      handlePenMouseUp();
      return;
    }
    handleDrawingMouseUp();
  };

  const handleDragMove = (shapeId: string, node: Konva.Node) => {
    const shape = shapes.find((s) => s.id === shapeId);
    if (!shape) return;

    const updatedShape: Shape = {
      ...shape,
      x: node.x(),
      y: node.y(),
    };

    checkAlignment(updatedShape);
  };

  const handleDragEnd = (shapeId: string, node: any) => {
    let finalX = node.x();
    let finalY = node.y();

    if (isDisjointMode) {
      const resolved = resolveCollisions(shapeId, finalX, finalY);
      finalX = resolved.x;
      finalY = resolved.y;
    }

    updateShapeInStore(shapeId, { x: finalX, y: finalY });
    clearAlignment();
  };

  const handleTransformEnd = () => {
    if (!selectedShapeId) return;
    const node = shapeRefs.current.get(selectedShapeId);
    if (!node) return;

    let finalX = node.x();
    let finalY = node.y();
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    if (isDisjointMode) {
      const resolved = resolveCollisions(selectedShapeId, finalX, finalY, scaleX, scaleY);
      finalX = resolved.x;
      finalY = resolved.y;
    }

    updateShapeInStore(selectedShapeId, {
      x: finalX,
      y: finalY,
      rotation,
      scaleX,
      scaleY,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    handleFileDrop(e, stageRef, addShape, setSelectedShapeId, glbInteractionModes);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      className="viewportContainer"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {/* GLB Renderers Overlay */}
      {shapes
        .filter((s): s is GLBShape => s.type === "glb")
        .map((shape) => {
          const scaleX = shape.scaleX || 1;
          const scaleY = shape.scaleY || 1;
          const width = shape.width * scaleX;
          const height = shape.height * scaleY;
          const mode = glbInteractionModes.get(shape.id) || "konva";

          return (
            <div
              key={shape.id}
              style={{
                position: "absolute",
                left: shape.x,
                top: shape.y,
                width,
                height,
                transform: `rotate(${shape.rotation || 0}deg)`,
                transformOrigin: "top left",
                pointerEvents: mode === "threejs" ? "auto" : "none",
                zIndex: 10,
              }}
              onClick={(e) => {
                if (mode === "konva" && !isPenSelected) {
                  e.stopPropagation();
                  setSelectedShapeId(shape.id);
                }
              }}
            >
              <GLBRenderer
                src={shape.src}
                width={width}
                height={height}
                isSelected={selectedShapeId === shape.id}
                interactionMode={mode}
                onModeToggle={() => handleGLBModeToggle(shape.id)}
                onLoad={(canvas) => {
                  setGlbCanvases((prev) => new Map(prev).set(shape.id, canvas));
                }}
              />
            </div>
          );
        })}

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
            {/* Pen Lines */}
            {penLines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke="#df4b26"
                strokeWidth={5}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === "eraser" ? "destination-out" : "source-over"
                }
                listening={false}
              />
            ))}

            {/* All Shapes */}
            {shapes.map((shape) => (
              <React.Fragment key={shape.id}>
                {renderShape({
                  shape,
                  draggable: true,
                  loadedImages,
                  selectedShapeId,
                  glbInteractionModes,
                  isPenSelected,
                  shapeRefs,
                  setSelectedShapeId,
                  handleDragMove,
                  handleDragEnd,
                  updateShapeInStore,
                })}
              </React.Fragment>
            ))}

            {/* Current Drawing Shape */}
            {currentShape && renderShape({
              shape: currentShape,
              draggable: false,
              loadedImages,
              selectedShapeId,
              glbInteractionModes,
              isPenSelected,
              shapeRefs,
              setSelectedShapeId,
              handleDragMove,
              handleDragEnd,
              updateShapeInStore,
            })}

            {/* Alignment Lines */}
            {alignmentLines.map((line, index) => (
              <Line
                key={index}
                points={line.points}
                stroke="#FF00FF"
                strokeWidth={1}
                dash={[4, 4]}
                listening={false}
              />
            ))}

            <Transformer
              ref={transformerRef}
              onTransformEnd={handleTransformEnd}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
              enabledAnchors={[
                "top-left",
                "top-center",
                "top-right",
                "middle-right",
                "middle-left",
                "bottom-left",
                "bottom-center",
                "bottom-right",
              ]}
              rotateEnabled={true}
              borderStroke="#0066ff"
              borderStrokeWidth={2}
              borderDash={[4, 4]}
              anchorFill="#ffffff"
              anchorStroke="#0066ff"
              anchorStrokeWidth={2}
              anchorSize={10}
              anchorCornerRadius={5}
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}