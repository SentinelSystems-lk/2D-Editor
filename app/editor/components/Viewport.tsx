"use client";

import type Konva from "konva";
import React, { useRef, useLayoutEffect } from "react";
import { Stage, Layer, Line, Transformer, Circle } from "react-konva";
import { useCanvasStore } from "../store/editorStore";
import type { Shape, GLBShape } from "../store/editorStore";
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
import { useLineDrawing } from "../hooks/useLineDrawing";

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const shapeRefs = useRef<Map<string, Konva.Node>>(new Map());
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const draggedPointRef = useRef<{ lineId: string; pointIndex: 0 | 2 } | null>(
    null
  );

  const {
    shapes,
    lines,
    currentShape,
    currentLine,
    selectedShapeId,
    selectedLineId,
    isPenSelected,
    isLineSelected,
    isDisjointMode,
    setStage,
    addShape,
    setSelectedShapeId,
    setSelectedLineId,
    updateShape: updateShapeInStore,
    updateLine,
  } = useCanvasStore();

  const { size } = useCanvasSize(containerRef);
  const { loadedImages } = useImageLoader(shapes);
  const {
    glbInteractionModes,
    glbCanvases,
    setGlbCanvases,
    handleGLBModeToggle,
  } = useGLBInteraction();

  const { alignmentLines, checkAlignment, clearAlignment } = useAlignment(
    shapes,
    size
  );
  const { resolveCollisions } = useCollision(shapes);

  const { penLines, handlePenMouseDown, handlePenMouseMove, handlePenMouseUp } =
    usePenDrawing(stageRef, isPenSelected);

  const {
    handleLineMouseDown,
    handleLineMouseMove,
    handleLineMouseUp,
    handleLineDrag,
    handleLineDragEnd,
    handleControlPointMouseDown,
    handleControlPointDragMove,
    handleControlPointDragEnd,
    isControlPointDragging,
  } = useLineDrawing(stageRef, isLineSelected);


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
      setSelectedLineId(null);
      clearAlignment();
      return;
    }
    if (isLineSelected) {
      handleLineMouseDown();
      setSelectedShapeId(null);
      setSelectedLineId(null);
      clearAlignment();
      return;
    }

    const clickedOnTransformer =
      e.target.getParent()?.className === "Transformer";
    if (clickedOnTransformer) return;

    const clickedOnShape = e.target !== e.target.getStage();
    if (clickedOnShape) {
      const id = e.target.id();

      // Check if clicked on a line
      const clickedLine = lines.find((line) => line.id === id);
      if (clickedLine) {
        setSelectedLineId(id);
        setSelectedShapeId(null);
        return;
      }

      // Otherwise it's a shape
      setSelectedShapeId(id);
      setSelectedLineId(null);
      return;
    }

    setSelectedShapeId(null);
    setSelectedLineId(null);
    clearAlignment();
    handleDrawingMouseDown();
  };

  const handleMouseMove = () => {
    if (isPenSelected) {
      handlePenMouseMove();
      return;
    }
    if (isLineSelected) {
      handleLineMouseMove();
      return;
    }
    handleDrawingMouseMove();
  };

  const handleMouseUp = () => {
    if (isPenSelected) {
      handlePenMouseUp();
      return;
    }
    if (isLineSelected) {
      handleLineMouseUp();
      return;
    }
    handleDrawingMouseUp();
    draggedPointRef.current = null;
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
    checkAlignment({ id: lineId, type: "rectangle", x, y, width, height, scaleX: 1, scaleY: 1 } as any);
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
    checkAlignment({ id: lineId, type: "rectangle", x: px, y: py, width: 0, height: 0, scaleX: 1, scaleY: 1 } as any);
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
      const resolved = resolveCollisions(
        selectedShapeId,
        finalX,
        finalY,
        scaleX,
        scaleY
      );
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
    handleFileDrop(
      e,
      stageRef,
      addShape,
      setSelectedShapeId,
      glbInteractionModes
    );
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

            {/* Drawn Lines (with dragging and selection) */}
            {lines.map((line) => {
              const [x1, y1, x2, y2] = line.points;
              const isSelected = selectedLineId === line.id;

              return (
                <React.Fragment key={line.id}>
                    <Line
                    id={line.id}
                    points={line.points}
                    stroke={line.stroke}
                    strokeWidth={line.strokeWidth}
                    lineCap="round"
                    lineJoin="round"
                    draggable={
                      !isPenSelected && !isControlPointDragging.current
                    }
                    onDragMove={(e) => handleLineDragWithAlignment(line.id, e)}
                    onDragEnd={handleLineDragEnd}
                    onClick={() => {
                      setSelectedLineId(line.id);
                      setSelectedShapeId(null);
                    }}
                    shadowColor={isSelected ? "#0066ff" : undefined}
                    shadowBlur={isSelected ? 10 : 0}
                  />

                  {isSelected && (
                    <>
                      {/* START POINT */}
                      <Circle
                        x={x1}
                        y={y1}
                        radius={6}
                        fill="#0066ff"
                        stroke="#fff"
                        strokeWidth={2}
                        draggable
                        onMouseDown={(e) =>
                          handleControlPointMouseDown(e, line.id, 0)
                        }
                        onDragMove={(e) =>
                          handleControlPointDragMoveWithAlignment(e, line.id, 0)
                        }
                        onDragEnd={handleControlPointDragEnd}
                      />

                      {/* END POINT */}
                      <Circle
                        x={x2}
                        y={y2}
                        radius={6}
                        fill="#0066ff"
                        stroke="#fff"
                        strokeWidth={2}
                        draggable
                        onMouseDown={(e) =>
                          handleControlPointMouseDown(e, line.id, 2)
                        }
                        onDragMove={(e) =>
                          handleControlPointDragMoveWithAlignment(e, line.id, 2)
                        }
                        onDragEnd={handleControlPointDragEnd}
                      />
                    </>
                  )}
                </React.Fragment>
              );
            })}

            {/* Current Line Preview */}
            {currentLine && (
              <Line
                points={currentLine.points}
                stroke={currentLine.stroke}
                strokeWidth={currentLine.strokeWidth}
                lineCap="round"
                lineJoin="round"
                listening={false}
                opacity={0.7}
                dash={[5, 5]}
              />
            )}

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
            {currentShape &&
              renderShape({
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
