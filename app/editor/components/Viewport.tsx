"use client";

import type Konva from "konva";
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Image as KonvaImage,
  Transformer,
  Line,
  RegularPolygon,
} from "react-konva";
import { useCanvasStore } from "../store/editorStore";
import { createShape, updateShape } from "../utils/shapeFactory";
import type { Shape, ImageShape, GLBShape } from "../store/editorStore";
import { GLBRenderer } from "./GLBRender";

type AlignmentLine = {
  points: number[];
  orientation: "vertical" | "horizontal";
};

type PenLine = {
  tool: "pen" | "eraser";
  points: number[];
};

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const stageRef = useRef<Konva.Stage | null>(null);
  const [loadedImages, setLoadedImages] = useState<
    Map<string, HTMLImageElement>
  >(new Map());
  const [glbCanvases, setGlbCanvases] = useState<
    Map<string, HTMLCanvasElement>
  >(new Map());
  const [glbInteractionModes, setGlbInteractionModes] = useState<
    Map<string, "konva" | "threejs">
  >(new Map());
  const shapeRefs = useRef<Map<string, Konva.Node>>(new Map());
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const [alignmentLines, setAlignmentLines] = useState<AlignmentLine[]>([]);

  const [penLines, setPenLines] = useState<PenLine[]>([]);
  const isPenDrawing = useRef(false);

  const {
    shapes,
    currentShape,
    isDrawing,
    selectedShapeType,
    selectedShapeId,
    isPenSelected,
    isDisjointMode,
    setStage,
    addShape,
    setCurrentShape,
    setIsDrawing,
    clearCurrentShape,
    setSelectedShapeId,
    updateShape: updateShapeInStore,
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

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const imageShapes = shapes.filter(
      (s): s is ImageShape => s.type === "image"
    );
    imageShapes.forEach((shape) => {
      if (!loadedImages.has(shape.id)) {
        const img = new window.Image();
        img.src = shape.src;
        img.onload = () => {
          setLoadedImages((prev) => new Map(prev).set(shape.id, img));
        };
      }
    });
  }, [shapes, loadedImages]);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (selectedShapeId) {
      const shape = shapes.find((s) => s.id === selectedShapeId);

      // Don't attach transformer to GLB shapes in threejs mode
      if (
        shape?.type === "glb" &&
        glbInteractionModes.get(selectedShapeId) === "threejs"
      ) {
        transformer.nodes([]);
        transformer.getLayer()?.batchDraw();
        return;
      }

      const node = shapeRefs.current.get(selectedShapeId);
      if (node) {
        transformer.nodes([node]);
        transformer.getLayer()?.batchDraw();
      }
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedShapeId, shapes, glbInteractionModes]);

  const getShapeBounds = (shape: Shape) => {
    const scaleX = shape.scaleX || 1;
    const scaleY = shape.scaleY || 1;

    if (shape.type === "rectangle") {
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width * scaleX,
        height: shape.height * scaleY,
        centerX: shape.x + (shape.width * scaleX) / 2,
        centerY: shape.y + (shape.height * scaleY) / 2,
      };
    } else if (shape.type === "circle") {
      const diameter = shape.radius * 2 * scaleX;
      return {
        x: shape.x - shape.radius * scaleX,
        y: shape.y - shape.radius * scaleY,
        width: diameter,
        height: diameter,
        centerX: shape.x,
        centerY: shape.y,
      };
    } else if (shape.type === "triangle") {
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width * scaleX,
        height: shape.height * scaleY,
        centerX: shape.x + (shape.width * scaleX) / 2,
        centerY: shape.y + (shape.height * scaleY) / 2,
      };
    } else if (shape.type === "image" || shape.type === "glb") {
      const width = (shape.width || 0) * scaleX;
      const height = (shape.height || 0) * scaleY;
      return {
        x: shape.x,
        y: shape.y,
        width,
        height,
        centerX: shape.x + width / 2,
        centerY: shape.y + height / 2,
      };
    }

    return { x: 0, y: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  };

  const checkCollision = (bounds1: any, bounds2: any): boolean => {
    return !(
      bounds1.x + bounds1.width < bounds2.x ||
      bounds2.x + bounds2.width < bounds1.x ||
      bounds1.y + bounds1.height < bounds2.y ||
      bounds2.y + bounds2.height < bounds1.y
    );
  };

  const resolveCollision = (
    movingShape: Shape,
    staticShape: Shape
  ): { x: number; y: number } => {
    const movingBounds = getShapeBounds(movingShape);
    const staticBounds = getShapeBounds(staticShape);

    const overlapX = Math.min(
      movingBounds.x + movingBounds.width - staticBounds.x,
      staticBounds.x + staticBounds.width - movingBounds.x
    );
    const overlapY = Math.min(
      movingBounds.y + movingBounds.height - staticBounds.y,
      staticBounds.y + staticBounds.height - movingBounds.y
    );

    let newX = movingShape.x;
    let newY = movingShape.y;

    if (overlapX < overlapY) {
      if (movingBounds.x < staticBounds.x) {
        newX = movingShape.x - overlapX - 1;
      } else {
        newX = movingShape.x + overlapX + 1;
      }
    } else {
      if (movingBounds.y < staticBounds.y) {
        newY = movingShape.y - overlapY - 1;
      } else {
        newY = movingShape.y + overlapY + 1;
      }
    }

    return { x: newX, y: newY };
  };

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

  function handleMouseDown(e: any) {
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // 🖊 PEN MODE - start drawing, deselect any shapes
    if (isPenSelected) {
      setSelectedShapeId(null);
      setAlignmentLines([]);
      isPenDrawing.current = true;
      setPenLines((prev) => [
        ...prev,
        { tool: "pen", points: [pointerPosition.x, pointerPosition.y] },
      ]);
      return;
    }

    const clickedOnTransformer =
      e.target.getParent()?.className === "Transformer";
    if (clickedOnTransformer) {
      return;
    }

    const clickedOnShape = e.target !== e.target.getStage();

    if (clickedOnShape) {
      const shapeId = e.target.id();
      setSelectedShapeId(shapeId);
      return;
    }

    setSelectedShapeId(null);
    setAlignmentLines([]);

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

  function handleMouseMove() {
    // 🖊 PEN MODE - handle pen drawing
    if (isPenSelected && isPenDrawing.current) {
      const stage = stageRef.current;
      if (!stage) return;

      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      setPenLines((prev) => {
        const lastLine = prev[prev.length - 1];
        if (!lastLine) return prev;

        const updatedLine = {
          ...lastLine,
          points: lastLine.points.concat([
            pointerPosition.x,
            pointerPosition.y,
          ]),
        };
        return [...prev.slice(0, -1), updatedLine];
      });
      return;
    }

    if (!currentShape || !isDrawing) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const { x, y } = pointerPosition;
    const updatedShape = updateShape(currentShape, x, y);
    setCurrentShape(updatedShape);
  }

  function handleMouseUp() {
    if (isPenSelected) {
      isPenDrawing.current = false;
      return;
    }

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
      }

      if (isValid) {
        addShape(currentShape);
        setSelectedShapeId(currentShape.id);
      }
    }
    clearCurrentShape();
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!stageRef.current) return;

    stageRef.current.setPointersPositions(e as any);
    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];

      // Handle GLB files
      if (
        file.name.toLowerCase().endsWith(".glb") ||
        file.name.toLowerCase().endsWith(".gltf")
      ) {
        const reader = new FileReader();
        reader.onload = () => {
          const glbShape: GLBShape = {
            id: Date.now().toString(),
            type: "glb",
            x: pos.x,
            y: pos.y,
            src: reader.result as string,
            width: 200,
            height: 200,
          };
          addShape(glbShape);
          setSelectedShapeId(glbShape.id);
          setGlbInteractionModes((prev) =>
            new Map(prev).set(glbShape.id, "konva")
          );
        };
        reader.readAsDataURL(file);
        return;
      }

      // Handle image files
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          const imageShape: ImageShape = {
            id: Date.now().toString(),
            type: "image",
            x: pos.x,
            y: pos.y,
            src: reader.result as string,
          };
          addShape(imageShape);
          setSelectedShapeId(imageShape.id);
        };
        reader.readAsDataURL(file);
        return;
      }
    }

    const url = e.dataTransfer.getData("text/uri-list");
    if (url) {
      const imageShape: ImageShape = {
        id: Date.now().toString(),
        type: "image",
        x: pos.x,
        y: pos.y,
        src: url,
      };
      addShape(imageShape);
      setSelectedShapeId(imageShape.id);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // const handleTransformEnd = () => {
  //   if (!selectedShapeId) return;

  //   const node = shapeRefs.current.get(selectedShapeId);
  //   if (!node) return;

  //   updateShapeInStore(selectedShapeId, {
  //     x: node.x(),
  //     y: node.y(),
  //     rotation: node.rotation(),
  //     scaleX: node.scaleX(),
  //     scaleY: node.scaleY(),
  //   });
  // };

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

  // const handleDragEnd = (shapeId: string, node: Konva.Node) => {
  //   updateShapeInStore(shapeId, {
  //     x: node.x(),
  //     y: node.y(),
  //   });
  //   setAlignmentLines([]);
  // };


  const handleDragEnd = (shapeId: string, node: any) => {
    let finalX = node.x();
    let finalY = node.y();

    if (isDisjointMode) {
      const draggedShape = shapes.find((s) => s.id === shapeId);
      if (!draggedShape) return;

      let adjustedShape = { ...draggedShape, x: finalX, y: finalY };

      for (const otherShape of shapes) {
        if (otherShape.id === shapeId) continue;

        const draggedBounds = getShapeBounds(adjustedShape);
        const otherBounds = getShapeBounds(otherShape);

        if (checkCollision(draggedBounds, otherBounds)) {
          const resolved = resolveCollision(adjustedShape, otherShape);
          adjustedShape = { ...adjustedShape, x: resolved.x, y: resolved.y };
          finalX = resolved.x;
          finalY = resolved.y;
        }
      }
    }

    updateShapeInStore(shapeId, { x: finalX, y: finalY });
    setAlignmentLines([]);
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
      const transformedShape = shapes.find((s) => s.id === selectedShapeId);
      if (!transformedShape) return;

      let adjustedShape = { ...transformedShape, x: finalX, y: finalY, scaleX, scaleY };

      for (const otherShape of shapes) {
        if (otherShape.id === selectedShapeId) continue;

        const transformedBounds = getShapeBounds(adjustedShape);
        const otherBounds = getShapeBounds(otherShape);

        if (checkCollision(transformedBounds, otherBounds)) {
          const resolved = resolveCollision(adjustedShape, otherShape);
          adjustedShape = { ...adjustedShape, x: resolved.x, y: resolved.y };
          finalX = resolved.x;
          finalY = resolved.y;
        }
      }
    }

    updateShapeInStore(selectedShapeId, {
      x: finalX,
      y: finalY,
      rotation,
      scaleX,
      scaleY,
    });
  };


  const handleGLBModeToggle = (shapeId: string) => {
    setGlbInteractionModes((prev) => {
      const newModes = new Map(prev);
      const currentMode = newModes.get(shapeId) || "konva";
      const newMode = currentMode === "konva" ? "threejs" : "konva";
      newModes.set(shapeId, newMode);
      return newModes;
    });
  };

  const renderShape = (shape: Shape, draggable = false) => {
    const commonProps = {
      id: shape.id,
      x: shape.x,
      y: shape.y,
      rotation: shape.rotation || 0,
      scaleX: shape.scaleX || 1,
      scaleY: shape.scaleY || 1,
      draggable:
        draggable &&
        !(
          shape.type === "glb" &&
          glbInteractionModes.get(shape.id) === "threejs"
        ),
      fill: shape.fill || "#3b82f6",
      stroke: shape.stroke || "#000000ff",
      strokeWidth: shape.strokeWidth || 0,
      opacity: shape.opacity ?? 1,
      onClick: () => {
        // Only select shapes if not in pen mode
        if (!isPenSelected) {
          setSelectedShapeId(shape.id);
        }
      },
      onTap: () => {
        // Only select shapes if not in pen mode
        if (!isPenSelected) {
          setSelectedShapeId(shape.id);
        }
      },
      onDragMove: (e: any) => {
        if (!isPenSelected) {
          handleDragMove(shape.id, e.target);
        }
      },
      onDragEnd: (e: any) => {
        if (!isPenSelected) {
          handleDragEnd(shape.id, e.target);
        }
      },
      ref: (node: Konva.Node | null) => {
        if (node) {
          shapeRefs.current.set(shape.id, node);
        } else {
          shapeRefs.current.delete(shape.id);
        }
      },
    };

    if (shape.type === "rectangle") {
      return (
        <Rect {...commonProps} width={shape.width} height={shape.height} />
      );
    }

    if (shape.type === "circle") {
      return <Circle {...commonProps} radius={shape.radius} />;
    }

    if (shape.type === "triangle") {
      return (
        <RegularPolygon
          {...commonProps}
          sides={3}
          radius={shape.width}
          rotation={shape.rotation}
        />
      );
    }

    if (shape.type === "image") {
      const img = loadedImages.get(shape.id);
      if (!img) return null;

      return (
        <KonvaImage
          {...commonProps}
          image={img}
          width={shape.width || img.width}
          height={shape.height || img.height}
        />
      );
    }

    if (shape.type === "glb") {
      return (
        <Rect
          {...commonProps}
          width={shape.width}
          height={shape.height}
          fill="transparent"
          stroke={selectedShapeId === shape.id ? "#0066ff" : "transparent"}
          strokeWidth={1}
          dash={selectedShapeId === shape.id ? [4, 4] : undefined}
        />
      );
    }

    return null;
  };

  return (
    <div
      ref={containerRef}
      className="viewportContainer"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      {/* Render GLB renderers in overlay */}
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
            {/* 🖊 Pen Lines */}
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

            {shapes.map((shape) => (
              <React.Fragment key={shape.id}>
                {renderShape(shape, true)}
              </React.Fragment>
            ))}

            {currentShape && renderShape(currentShape, false)}

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
