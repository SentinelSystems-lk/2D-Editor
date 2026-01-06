import type { Shape } from "../store/editorStore";

export const getShapeBounds = (shape: Shape) => {
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
  } else if (shape.type === "text") {
    return {
      x: shape.x,
      y: shape.y,
      width: shape.width * scaleX,
      height: shape.fontSize * 1.5 * scaleY,
      centerX: shape.x + (shape.width * scaleX) / 2,
      centerY: shape.y + (shape.fontSize * 1.5 * scaleY) / 2,
    };
  } else if (shape.type === "polygon") {
    return {
      x: shape.x,
      y: shape.y,
      width: shape.radius * 2 * scaleX,
      height: shape.radius * 2 * scaleY,
      centerX: shape.x + shape.radius * scaleX,
      centerY: shape.y + shape.radius * scaleY,
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
