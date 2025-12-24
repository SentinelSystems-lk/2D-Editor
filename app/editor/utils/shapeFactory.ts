import type { Shape, ShapeType, RectangleShape, CircleShape } from '../store/editorStore';

/**
 * Creates a new shape based on the type
 */
export const createShape = (
  type: ShapeType,
  x: number,
  y: number,
  id: string
): Shape => {
  const baseShape = { id, x, y };
  
  switch (type) {
    case 'rectangle':
      return {
        ...baseShape,
        type: 'rectangle',
        width: 0,
        height: 0,
      } as RectangleShape;
      
    case 'circle':
      return {
        ...baseShape,
        type: 'circle',
        radius: 0,
      } as CircleShape;
      
    default:
      throw new Error(`Unknown shape type: ${type}`);
  }
};

/**
 * Updates shape dimensions based on current mouse position
 */
export const updateShape = (
  shape: Shape,
  currentX: number,
  currentY: number
): Shape => {
  switch (shape.type) {
    case 'rectangle':
      return {
        ...shape,
        width: currentX - shape.x,
        height: currentY - shape.y,
      } as RectangleShape;
      
    case 'circle': {
      // Calculate radius from center point to current position
      const dx = currentX - shape.x;
      const dy = currentY - shape.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      return {
        ...shape,
        radius,
      } as CircleShape;
    }
    
    case 'image':
    case 'glb':
      // Image and GLB shapes don't support drawing mode
      // They are created with fixed dimensions on drop
      return shape;
      
    default:
      return shape;
  }
};