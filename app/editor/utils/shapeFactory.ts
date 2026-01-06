import type { Shape, ShapeType, RectangleShape, CircleShape, TriangleShape, TextShape, PolygonShape } from '../store/editorStore';

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

    case 'triangle':
      return {
        ...baseShape,
        type: 'triangle',
        width: 0,
        height: 0,
      } as TriangleShape;

    case 'text':
      return { 
        ...baseShape, 
        type: 'text', 
        text: 'Double click to edit', 
        fontSize: 20, 
        width: 200,
        fill: '#000000',
        align: 'left',
      } as TextShape;

    case 'polygon':
      return {
        ...baseShape,
        type: 'polygon',
        radius: 0,
        sides: 5,
      } as PolygonShape;

    case 'image':
    case 'glb':

      
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

    case 'triangle':
      return {
        ...shape,
        width: currentX - shape.x,
        height: currentY - shape.y,
      } as TriangleShape;

    case 'polygon':
      return{
        ...shape,
        radius: Math.sqrt(Math.pow(currentX - shape.x, 2) + Math.pow(currentY - shape.y, 2)),
        sides: 5,
      } as PolygonShape;
      
    
    case 'image':
    case 'glb':
    case 'text':
      // Image and GLB shapes don't support drawing mode
      // They are created with fixed dimensions on drop
      return shape;
      
    default:
      return shape;
  }
};