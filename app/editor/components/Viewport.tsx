"use client";

import type Konva from "konva";
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { Stage, Layer, Rect, Circle, Image as KonvaImage, Transformer } from "react-konva";
import { useCanvasStore } from "../store/editorStore";
import { createShape, updateShape } from "../utils/shapeFactory";
import type { Shape, ImageShape, GLBShape } from "../store/editorStore";
import { GLBRenderer } from './GLBRender';

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const stageRef = useRef<Konva.Stage | null>(null);
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [loadedGLBs, setLoadedGLBs] = useState<Map<string, HTMLCanvasElement>>(new Map());
  const shapeRefs = useRef<Map<string, Konva.Node>>(new Map());
  const transformerRef = useRef<Konva.Transformer | null>(null);

  const {
    shapes,
    currentShape,
    isDrawing,
    selectedShapeType,
    selectedShapeId,
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
    const imageShapes = shapes.filter((s): s is ImageShape => s.type === "image");
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

  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (selectedShapeId) {
      const node = shapeRefs.current.get(selectedShapeId);
      if (node) {
        transformer.nodes([node]);
        transformer.getLayer()?.batchDraw();
      }
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedShapeId]);

  function handleMouseDown(e: any) {
    // Check if clicking on transformer or its anchors
    const clickedOnTransformer = e.target.getParent()?.className === 'Transformer';
    if (clickedOnTransformer) {
      return;
    }

    const clickedOnShape = e.target !== e.target.getStage();
    
    if (clickedOnShape) {
      const shapeId = e.target.id();
      setSelectedShapeId(shapeId);
      return;
    }

    // Clicking on empty space - deselect and start drawing
    setSelectedShapeId(null);

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const { x, y } = pointerPosition;
    const newShape = createShape(selectedShapeType, x, y, Date.now().toString());

    setCurrentShape(newShape);
    setIsDrawing(true);
  }

  function handleMouseMove() {
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
    if (currentShape) {
      addShape(currentShape);
      setSelectedShapeId(currentShape.id);
    }
    clearCurrentShape();
  }

  const handleGLBLoad = (id: string, canvas: HTMLCanvasElement) => {
    setLoadedGLBs((prev) => new Map(prev).set(id, canvas));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!stageRef.current) return;

    stageRef.current.setPointersPositions(e as any);
    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];

      if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
        const reader = new FileReader();
        reader.onload = () => {
          const glbShape: GLBShape = {
            id: Date.now().toString(),
            type: 'glb',
            x: pos.x,
            y: pos.y,
            src: reader.result as string,
            width: 300,
            height: 300,
          };
          addShape(glbShape);
          setSelectedShapeId(glbShape.id);
        };
        reader.readAsDataURL(file);
        return;
      }

      if (!file.type.startsWith("image/")) return;

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

  const handleTransformEnd = () => {
    if (!selectedShapeId) return;
    
    const node = shapeRefs.current.get(selectedShapeId);
    if (!node) return;

    updateShapeInStore(selectedShapeId, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
    });
  };

  const handleDragEnd = (shapeId: string, node: Konva.Node) => {
    updateShapeInStore(shapeId, {
      x: node.x(),
      y: node.y(),
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
      draggable: draggable,
      onClick: () => setSelectedShapeId(shape.id),
      onTap: () => setSelectedShapeId(shape.id),
      onDragEnd: (e: any) => handleDragEnd(shape.id, e.target),
      ref: (node: Konva.Node | null) => {
        if (node) {
          shapeRefs.current.set(shape.id, node);
        } else {
          shapeRefs.current.delete(shape.id);
        }
      },
    };
    
    if (shape.type === 'rectangle') {
      return (
        <Rect
          {...commonProps}
          width={shape.width}
          height={shape.height}
          fill="blue"
          opacity={draggable ? 0.7 : 0.5}
        />
      );
    }
    
    if (shape.type === 'circle') {
      return (
        <Circle
          {...commonProps}
          radius={shape.radius}
          fill="blue"
          opacity={draggable ? 0.7 : 0.5}
        />
      );
    }

    if (shape.type === 'image') {
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

    if (shape.type === 'glb') {
      const canvas = loadedGLBs.get(shape.id);
      if (!canvas) return null;
      
      return (
        <KonvaImage
          {...commonProps}
          image={canvas}
          width={shape.width}
          height={shape.height}
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
    >
      {/* Hidden GLB renderers */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        {shapes
          .filter((s): s is GLBShape => s.type === 'glb')
          .map((shape) => (
            <GLBRenderer
              key={shape.id}
              src={shape.src}
              width={shape.width}
              height={shape.height}
              onLoad={(canvas) => handleGLBLoad(shape.id, canvas)}
            />
          ))}
      </div>

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

            {/* Transformer for selected shape */}
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
                'top-left',
                'top-center',
                'top-right',
                'middle-right',
                'middle-left',
                'bottom-left',
                'bottom-center',
                'bottom-right',
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