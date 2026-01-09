import React from "react";
import type Konva from "konva";
import { Rect, Circle, RegularPolygon, Text, Image as KonvaImage } from "react-konva";
import type { Shape, TextShape } from "../store/editorStore";

type RenderShapeProps = {
  shape: Shape;
  draggable: boolean;
  loadedImages: Map<string, HTMLImageElement>;
  selectedShapeId: string | null;
  glbInteractionModes: Map<string, "konva" | "threejs">;
  isPenSelected: boolean;
  shapeRefs: React.MutableRefObject<Map<string, Konva.Node>>;
  setSelectedShapeId: (id: string | null) => void;
  handleDragMove: (shapeId: string, node: Konva.Node) => void;
  handleDragEnd: (shapeId: string, node: any) => void;
  updateShapeInStore: (id: string, updates: Partial<Shape>) => void;
};

export const renderShape = ({
  shape,
  draggable,
  loadedImages,
  selectedShapeId,
  glbInteractionModes,
  isPenSelected,
  shapeRefs,
  setSelectedShapeId,
  handleDragMove,
  handleDragEnd,
  updateShapeInStore,
}: RenderShapeProps) => {
  const baseProps: any = {
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
    onClick: () => {
      if (!isPenSelected) {
        setSelectedShapeId(shape.id);
      }
    },
    onTap: () => {
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

  // Only add paint-related props for non-group shapes so TypeScript
  // doesn't allow accessing paint properties on GroupShape.
  if (shape.type !== "group") {
    baseProps.fill = shape.fill || "#3b82f6";
    baseProps.stroke = shape.stroke || "#000000ff";
    baseProps.strokeWidth = shape.strokeWidth || 0;
    baseProps.opacity = shape.opacity ?? 1;
  }

  const commonProps = baseProps as any;

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

  if (shape.type === "polygon") {
    return (
      <RegularPolygon
        {...commonProps}
        sides={shape.sides}
        radius={shape.radius}
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

  if (shape.type === "text") {
    const handleTextDblClick = (textShape: TextShape) => {
      const textNode = shapeRefs.current.get(textShape.id);
      if (!textNode) return;

      textNode.hide();
      
      const textPosition = textNode.absolutePosition();
      const stage = textNode.getStage();
      if (!stage) return;
      
      const stageBox = stage.container().getBoundingClientRect();

      const areaPosition = {
        x: stageBox.left + textPosition.x,
        y: stageBox.top + textPosition.y,
      };

      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      textarea.value = textShape.text;
      textarea.style.position = "absolute";
      textarea.style.top = areaPosition.y + "px";
      textarea.style.left = areaPosition.x + "px";
      textarea.style.width = textShape.width * (textShape.scaleX || 1) + "px";
      textarea.style.fontSize = textShape.fontSize + "px";
      textarea.style.border = "none";
      textarea.style.padding = "0px";
      textarea.style.margin = "0px";
      textarea.style.overflow = "hidden";
      textarea.style.background = "none";
      textarea.style.outline = "none";
      textarea.style.resize = "none";
      textarea.style.fontFamily = textShape.fontFamily || "Arial";
      textarea.style.transformOrigin = "left top";
      textarea.style.textAlign = textShape.align || "left";
      textarea.style.color = textShape.fill || "#000000";
      textarea.style.lineHeight = "1.2";

      const rotation = textShape.rotation || 0;
      if (rotation) {
        textarea.style.transform = "rotateZ(" + rotation + "deg)";
      }

      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + 3 + "px";
      textarea.focus();

      function removeTextarea() {
        textarea.parentNode?.removeChild(textarea);
        window.removeEventListener("click", handleOutsideClick);
        if (textNode && typeof textNode.show === "function") {
          textNode.show();
        }
      }

      textarea.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          updateShapeInStore(textShape.id, { text: textarea.value });
          removeTextarea();
        }
        if (e.key === "Escape") {
          removeTextarea();
        }
      });

      textarea.addEventListener("input", function () {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + 3 + "px";
      });

      function handleOutsideClick(e: MouseEvent) {
        if (e.target !== textarea) {
          updateShapeInStore(textShape.id, { text: textarea.value });
          removeTextarea();
        }
      }

      setTimeout(() => {
        window.addEventListener("click", handleOutsideClick);
      }, 100);
    };

    return (
      <Text
        {...commonProps}
        text={shape.text}
        fontSize={shape.fontSize}
        fontFamily={shape.fontFamily || "Arial"}
        align={shape.align || "left"}
        width={shape.width}
        onDblClick={() => handleTextDblClick(shape)}
        onDblTap={() => handleTextDblClick(shape)}
        onTransform={(e: any) => {
          const node = e.target;
          node.setAttrs({
            width: node.width() * node.scaleX(),
            scaleX: 1,
          });
        }}
      />
    );
  }

  return null;
};