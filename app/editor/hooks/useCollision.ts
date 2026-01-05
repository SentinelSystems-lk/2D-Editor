import type { Shape } from "../store/editorStore";
import { getShapeBounds } from "../utils/shapeUtils";

export function useCollision(shapes: Shape[]) {
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

  const resolveCollisions = (
    shapeId: string,
    x: number,
    y: number,
    scaleX = 1,
    scaleY = 1
  ): { x: number; y: number } => {
    const shape = shapes.find((s) => s.id === shapeId);
    if (!shape) return { x, y };

    let adjustedShape = { ...shape, x, y, scaleX, scaleY };

    for (const otherShape of shapes) {
      if (otherShape.id === shapeId) continue;

      const adjustedBounds = getShapeBounds(adjustedShape);
      const otherBounds = getShapeBounds(otherShape);

      if (checkCollision(adjustedBounds, otherBounds)) {
        const resolved = resolveCollision(adjustedShape, otherShape);
        adjustedShape = { ...adjustedShape, x: resolved.x, y: resolved.y };
        x = resolved.x;
        y = resolved.y;
      }
    }

    return { x, y };
  };

  return {
    resolveCollisions,
  };
}