"use client";

import type Konva from "konva";
import React, { useRef, useLayoutEffect } from "react";
import { Stage, Layer, Line, Transformer, Circle, Rect } from "react-konva";
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
import { useSelectionTool } from "../hooks/useSelectionTool";
import { renderShape } from "../utils/shapeRenderer";
import { handleFileDrop } from "../utils/fileHandlers";
import { useLineDrawing } from "../hooks/useLineDrawing";

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const shapeRefs = useRef<Map<string, Konva.Node>>(new Map());
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const isDraggingGroup = useRef(false);
  const dragStartPositions = useRef<Map<string, { x: number; y: number }>>(
    new Map()
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
    isSelectClicked,
    isDisjointMode,
    setStage,
    addShape,
    setSelectedShapeId,
    setSelectedLineId,
    updateShape: updateShapeInStore,
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

  // Selection Tool Hook
  const {
    selectedIds,
    setSelectedIds,
    handleSelectionClick,
    handleSelectionMouseDown,
    handleSelectionMouseMove,
    handleSelectionMouseUp,
    getSelectionBox,
  } = useSelectionTool(isSelectClicked, shapes, lines, stageRef);

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
    handleLineDragMove,
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
    transformerRef as unknown as React.RefObject<Konva.Transformer>,
    glbInteractionModes,
    selectedIds
  );

  useLayoutEffect(() => {
    if (stageRef.current) {
      setStage(stageRef.current);
    }
  }, [size.width, size.height, setStage]);

  const handleMouseDown = (e: any) => {
    // 🎯 SELECTION MODE - Multi-select with drag box
    if (isSelectClicked) {
      const clickedOnShape = e.target !== e.target.getStage();
      if (clickedOnShape) {
        const id = e.target.id();
        const isAlreadySelected = selectedIds.includes(id);

        // ✅ If clicking on an already selected shape, allow dragging
        if (isAlreadySelected) {
          return; // Don't interfere - let drag happen
        }

        const clickedLine = lines.find((line) => line.id === id);
        if (clickedLine) {
          // If line is already selected, allow dragging
          if (isAlreadySelected) {
            return; // Don't interfere - let drag happen
          }
          // Otherwise, handle line selection through the selection tool
          handleSelectionClick(e);
          handleSelectionMouseDown(e);
          return;
        }
      }
      handleSelectionClick(e);
      handleSelectionMouseDown(e);
      return;
    }

    // 🖊️ PEN MODE
    if (isPenSelected) {
      handlePenMouseDown();
      setSelectedShapeId(null);
      setSelectedLineId(null);
      setSelectedIds([]);
      clearAlignment();
      return;
    }

    // 📏 LINE MODE
    if (isLineSelected) {
      handleLineMouseDown();
      setSelectedShapeId(null);
      setSelectedLineId(null);
      setSelectedIds([]);
      clearAlignment();
      return;
    }

    // Don't deselect when clicking transformer
    const clickedOnTransformer =
      e.target.getParent()?.className === "Transformer";
    if (clickedOnTransformer) return;

    // Check if clicked on a shape or line
    const clickedOnShape = e.target !== e.target.getStage();
    if (clickedOnShape) {
      const id = e.target.id();

      // Check if clicked on a line
      const clickedLine = lines.find((line) => line.id === id);
      if (clickedLine) {
        setSelectedLineId(id);
        setSelectedShapeId(null);
        setSelectedIds([]);
        return;
      }

      // Otherwise it's a shape
      setSelectedShapeId(id);
      setSelectedLineId(null);
      setSelectedIds([]);
      return;
    }

    // Clicked on empty canvas
    setSelectedShapeId(null);
    setSelectedLineId(null);
    setSelectedIds([]);
    clearAlignment();
    handleDrawingMouseDown();
  };

  const handleMouseMove = (e: any) => {
    // 🎯 SELECTION MODE - Update drag box
    if (isSelectClicked) {
      handleSelectionMouseMove(e);
      return;
    }

    // 🖊️ PEN MODE
    if (isPenSelected) {
      handlePenMouseMove();
      return;
    }

    // 📏 LINE MODE
    if (isLineSelected) {
      handleLineMouseMove();
      return;
    }

    // 🎨 SHAPE DRAWING MODE
    handleDrawingMouseMove();
  };

  const handleMouseUp = () => {
    // 🎯 SELECTION MODE - Finalize selection
    if (isSelectClicked) {
      handleSelectionMouseUp();
      return;
    }

    // 🖊️ PEN MODE
    if (isPenSelected) {
      handlePenMouseUp();
      return;
    }

    // 📏 LINE MODE
    if (isLineSelected) {
      handleLineMouseUp();
      return;
    }

    // 🎨 SHAPE DRAWING MODE
    handleDrawingMouseUp();
  };

  const handleDragMove = (shapeId: string, node: Konva.Node) => {
    // Check if this is a line
    const isLine = lines.some((l) => l.id === shapeId);

    if (isLine) {
      // Lines are dragged via onDragMove on the Line component itself
      // The 'node' here would be the Line, and we get its position differently
      const draggedLine = lines.find((l) => l.id === shapeId);
      if (!draggedLine) return;

      // Handle line multi-selection dragging
      if (selectedIds.length > 1 && selectedIds.includes(shapeId)) {
        if (!isDraggingGroup.current) {
          // First move: Save all starting positions
          isDraggingGroup.current = true;
          selectedIds.forEach((id) => {
            const shape = shapes.find((sh) => sh.id === id);
            const line = lines.find((l) => l.id === id);

            if (shape) {
              dragStartPositions.current.set(id, { x: shape.x, y: shape.y });
            } else if (line) {
              // For lines, store the first point as reference
              dragStartPositions.current.set(id, {
                x: line.points[0],
                y: line.points[1],
              });
            }
          });
        }

        const startPos = dragStartPositions.current.get(shapeId);
        if (!startPos) return;

        // ✅ Calculate delta from the dragged line's current position
        const deltaX = draggedLine.points[0] + node.x() - startPos.x;
        const deltaY = draggedLine.points[1] + node.y() - startPos.y;

        // const deltaX = node.x();
        // const deltaY = node.y();

        // Calculate delta based on current node position
        // const deltaX =
        //   currentNodeX - startPos.x + draggedLine.points[0] - startPos.x;
        // const deltaY =
        //   currentNodeY - startPos.y + draggedLine.points[1] - startPos.y;

        // Move ALL other selected items by the same amount
        selectedIds.forEach((id) => {
          if (id === shapeId) return; // Skip the one being dragged

          const otherStartPos = dragStartPositions.current.get(id);
          if (!otherStartPos) return;

          const otherShape = shapes.find((s) => s.id === id);
          const otherLine = lines.find((l) => l.id === id);

          if (otherShape) {
            const otherNode = shapeRefs.current.get(id);
            if (otherNode) {
              otherNode.x(otherStartPos.x + deltaX);
              otherNode.y(otherStartPos.y + deltaY);
            }
          } else if (otherLine) {
            // Move line by calculating new points
            const originalWidth = otherLine.points[2] - otherLine.points[0];
            const originalHeight = otherLine.points[3] - otherLine.points[1];

            const newPoints = [
              otherStartPos.x + deltaX,
              otherStartPos.y + deltaY,
              otherStartPos.x + deltaX + originalWidth,
              otherStartPos.y + deltaY + originalHeight,
            ];

            useCanvasStore.getState().updateLine(id, { points: newPoints });
          }
        });
      }

      // Check alignment for the dragged line
      const [x1, y1, x2, y2] = draggedLine.points;
      const x = Math.min(x1, x2) + node.x();
      const y = Math.min(y1, y2) + node.y();
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);

      checkAlignment({
        id: shapeId,
        type: "rectangle",
        x,
        y,
        width,
        height,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        fill: "",
        stroke: "",
      } as Shape);

      return;
    }

    // ===== SHAPE DRAGGING LOGIC =====

    // Handle shape multi-selection dragging
    if (selectedIds.length > 1 && selectedIds.includes(shapeId)) {
      if (!isDraggingGroup.current) {
        // First move: Save all starting positions
        isDraggingGroup.current = true;
        selectedIds.forEach((id) => {
          const shape = shapes.find((sh) => sh.id === id);
          const line = lines.find((l) => l.id === id);

          if (shape) {
            dragStartPositions.current.set(id, { x: shape.x, y: shape.y });
          } else if (line) {
            dragStartPositions.current.set(id, {
              x: line.points[0],
              y: line.points[1],
            });
          }
        });
      }

      // Calculate how much the dragged shape moved
      const startPos = dragStartPositions.current.get(shapeId);
      if (!startPos) return;

      const deltaX = node.x() - startPos.x;
      const deltaY = node.y() - startPos.y;

      // Move ALL other selected items by the same amount
      selectedIds.forEach((id) => {
        if (id === shapeId) return; // Skip the one being dragged

        const otherStartPos = dragStartPositions.current.get(id);
        if (!otherStartPos) return;

        const otherShape = shapes.find((s) => s.id === id);
        const otherLine = lines.find((l) => l.id === id);

        if (otherShape) {
          const otherNode = shapeRefs.current.get(id);
          if (otherNode) {
            otherNode.x(otherStartPos.x + deltaX);
            otherNode.y(otherStartPos.y + deltaY);
          }
        } else if (otherLine) {
          // Calculate delta relative to original line position
          const originalDeltaX = otherLine.points[2] - otherLine.points[0];
          const originalDeltaY = otherLine.points[3] - otherLine.points[1];

          const newPoints = [
            otherStartPos.x + deltaX,
            otherStartPos.y + deltaY,
            otherStartPos.x + deltaX + originalDeltaX,
            otherStartPos.y + deltaY + originalDeltaY,
          ];

          useCanvasStore.getState().updateLine(id, { points: newPoints });
        }
      });
    }

    // Get shape for alignment check
    const shape = shapes.find((s) => s.id === shapeId);
    if (!shape) return;

    const updatedShape: Shape = {
      ...shape,
      x: node.x(),
      y: node.y(),
    };

    // Check alignment
    checkAlignment(updatedShape);
  };

  const handleDragEnd = (shapeId: string, node: any) => {
    const isLine = lines.some((l) => l.id === shapeId);

    if (isLine) {
      // Handle line drag end
      if (selectedIds.length > 1 && selectedIds.includes(shapeId)) {
        const draggedLine = lines.find((l) => l.id === shapeId);
        if (!draggedLine) return;

        const startPos = dragStartPositions.current.get(shapeId);
        if (startPos) {
          // Calculate delta from node position (not stored points)
          const deltaX = draggedLine.points[0] + node.x() - startPos.x;
          const deltaY = draggedLine.points[1] + node.y() - startPos.y;

          // Update ALL selected items in the store
          selectedIds.forEach((id) => {
            const otherStartPos = dragStartPositions.current.get(id);
            if (!otherStartPos) return;

            const otherShape = shapes.find((s) => s.id === id);
            const otherLine = lines.find((l) => l.id === id);

            if (otherShape) {
              let newX = otherStartPos.x + deltaX;
              let newY = otherStartPos.y + deltaY;

              // Apply collision detection if enabled
              if (isDisjointMode) {
                const resolved = resolveCollisions(id, newX, newY);
                newX = resolved.x;
                newY = resolved.y;
              }

              updateShapeInStore(id, { x: newX, y: newY });
            } else if (otherLine) {
              const originalLine = lines.find((l) => l.id === id);
              if (!originalLine) return;

              // Get original dimensions when drag started
              const originalWidth =
                originalLine.points[2] - originalLine.points[0];
              const originalHeight =
                originalLine.points[3] - originalLine.points[1];

              const newPoints = [
                otherStartPos.x + deltaX,
                otherStartPos.y + deltaY,
                otherStartPos.x + deltaX + originalWidth,
                otherStartPos.y + deltaY + originalHeight,
              ];

              useCanvasStore.getState().updateLine(id, { points: newPoints });
            }
          });

          node.x(0);
          node.y(0);

          isDraggingGroup.current = false;
          dragStartPositions.current.clear();
        }
      }
      // Single line drag end is handled by handleLineDragEnd

      clearAlignment();
      return;
    }

    // ===== SHAPE DRAG END LOGIC =====

    let finalX = node.x();
    let finalY = node.y();

    if (selectedIds.length > 1 && selectedIds.includes(shapeId)) {
      const startPos = dragStartPositions.current.get(shapeId);
      if (startPos) {
        // Apply collision to dragged shape first
        if (isDisjointMode) {
          const resolved = resolveCollisions(shapeId, finalX, finalY);
          finalX = resolved.x;
          finalY = resolved.y;
          node.x(finalX);
          node.y(finalY);
        }

        const deltaX = finalX - startPos.x;
        const deltaY = finalY - startPos.y;

        // Update ALL selected items in the store
        selectedIds.forEach((id) => {
          const otherStartPos = dragStartPositions.current.get(id);
          if (!otherStartPos) return;

          const otherShape = shapes.find((s) => s.id === id);
          const otherLine = lines.find((l) => l.id === id);

          if (otherShape) {
            let newX = otherStartPos.x + deltaX;
            let newY = otherStartPos.y + deltaY;

            // Apply collision detection if enabled
            if (isDisjointMode) {
              const resolved = resolveCollisions(id, newX, newY);
              newX = resolved.x;
              newY = resolved.y;
            }

            updateShapeInStore(id, { x: newX, y: newY });
          } else if (otherLine) {
            // Preserve line shape by maintaining distance between endpoints
            const originalDeltaX = otherLine.points[2] - otherLine.points[0];
            const originalDeltaY = otherLine.points[3] - otherLine.points[1];

            const newPoints = [
              otherStartPos.x + deltaX,
              otherStartPos.y + deltaY,
              otherStartPos.x + deltaX + originalDeltaX,
              otherStartPos.y + deltaY + originalDeltaY,
            ];

            useCanvasStore.getState().updateLine(id, { points: newPoints });
          }
        });

        isDraggingGroup.current = false;
        dragStartPositions.current.clear();
      }
    } else {
      // Single shape update
      if (isDisjointMode) {
        const resolved = resolveCollisions(shapeId, finalX, finalY);
        finalX = resolved.x;
        finalY = resolved.y;
        node.x(finalX);
        node.y(finalY);
      }

      updateShapeInStore(shapeId, { x: finalX, y: finalY });
    }

    clearAlignment();
  };

  const handleLineDragMoveWithAlignment = (e: any) => {
    handleLineDragMove(e);

    const lineId = e.target.id();
    const updated = lines.find((l) => l.id === lineId);
    if (!updated) return;

    const [x1, y1, x2, y2] = updated.points;
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    // Create temporary shape for alignment
    checkAlignment({
      id: lineId,
      type: "rectangle",
      x,
      y,
      width,
      height,
      scaleX: 1,
      scaleY: 1,
    } as any);
  };

  const handleLineDragEndWithAlignment = (lineId: string, e: any) => {
    handleLineDragEnd(lineId, e);
    clearAlignment();
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

    // Check alignment for the dragged point
    checkAlignment({
      id: lineId,
      type: "rectangle",
      x: px,
      y: py,
      width: 0,
      height: 0,
      scaleX: 1,
      scaleY: 1,
    } as any);
  };

  const handleControlPointDragEndWithAlignment = (e: any) => {
    handleControlPointDragEnd();
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
      const resolved = resolveCollisions(
        selectedShapeId,
        finalX,
        finalY,
        scaleX,
        scaleY
      );
      finalX = resolved.x;
      finalY = resolved.y;

      // Update node position after collision resolution
      node.x(finalX);
      node.y(finalY);
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
              const isInMultiSelect = selectedIds.includes(line.id);

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
                      !isPenSelected &&
                      (!isSelectClicked || selectedIds.includes(line.id)) && // ✅ Allow drag if in selectedIds
                      !isControlPointDragging.current
                    }
                    onDragMove={(e) => {
                      // ✅ If line is in multi-selection, use the main drag handler
                      if (
                        selectedIds.length > 1 &&
                        selectedIds.includes(line.id)
                      ) {
                        handleDragMove(line.id, e.target);
                      } else {
                        // Single line drag - use line-specific handler
                        handleLineDragMoveWithAlignment(e);
                      }
                    }}
                    onDragEnd={(e) => {
                      // ✅ If line is in multi-selection, use the main drag end handler
                      if (
                        selectedIds.length > 1 &&
                        selectedIds.includes(line.id)
                      ) {
                        handleDragEnd(line.id, e.target);
                      } else {
                        // Single line drag - use line-specific handler
                        handleLineDragEndWithAlignment(line.id, e);
                      }
                    }}
                    onClick={() => {
                      if (!isSelectClicked) {
                        setSelectedLineId(line.id);
                        setSelectedShapeId(null);
                        setSelectedIds([]);
                      }
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage()?.container();
                      if (container) {
                        container.style.cursor = "move";
                      }
                    }}
                    onMouseLeave={(e) => {
                      const container = e.target.getStage()?.container();
                      if (container) {
                        container.style.cursor = "default";
                      }
                    }}
                    shadowColor={
                      isSelected || isInMultiSelect ? "#0066ff" : undefined
                    }
                    shadowBlur={isSelected || isInMultiSelect ? 10 : 0}
                    opacity={isInMultiSelect ? 0.8 : 1}
                  />

                  {selectedLineId === line.id && !isInMultiSelect && (
                    <>
                      {/* START POINT */}
                      <Circle
                        x={x1}
                        y={y1}
                        radius={6}
                        fill="#0066ff8a"
                        stroke="#fff"
                        strokeWidth={2}
                        draggable
                        onMouseDown={(e) =>
                          handleControlPointMouseDown(e, line.id, 0)
                        }
                        onDragMove={(e) =>
                          handleControlPointDragMoveWithAlignment(e, line.id, 0)
                        }
                        onDragEnd={handleControlPointDragEndWithAlignment}
                        onMouseEnter={(e) => {
                          const container = e.target.getStage()?.container();
                          if (container) {
                            container.style.cursor = "pointer";
                          }
                        }}
                        onMouseLeave={(e) => {
                          const container = e.target.getStage()?.container();
                          if (container) {
                            container.style.cursor = "default";
                          }
                        }}
                      />

                      {/* END POINT */}
                      <Circle
                        x={x2}
                        y={y2}
                        radius={6}
                        fill="#0066ff8a"
                        stroke="#fff"
                        strokeWidth={2}
                        draggable
                        onMouseDown={(e) =>
                          handleControlPointMouseDown(e, line.id, 2)
                        }
                        onDragMove={(e) =>
                          handleControlPointDragMoveWithAlignment(e, line.id, 2)
                        }
                        onDragEnd={handleControlPointDragEndWithAlignment}
                        onMouseEnter={(e) => {
                          const container = e.target.getStage()?.container();
                          if (container) {
                            container.style.cursor = "pointer";
                          }
                        }}
                        onMouseLeave={(e) => {
                          const container = e.target.getStage()?.container();
                          if (container) {
                            container.style.cursor = "default";
                          }
                        }}
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
                  draggable:
                    !isPenSelected &&
                    (!isSelectClicked || selectedIds.includes(shape.id)),
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

            {/* Selection Rectangle */}
            {isSelectClicked && getSelectionBox() && (
              <Rect
                x={getSelectionBox()!.x}
                y={getSelectionBox()!.y}
                width={getSelectionBox()!.width}
                height={getSelectionBox()!.height}
                fill="rgba(0, 102, 255, 0.2)"
                stroke="#0066ff"
                strokeWidth={1}
                dash={[4, 4]}
                listening={false}
              />
            )}

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
