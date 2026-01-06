import type Konva from "konva";
import { useEffect } from "react";
import type { Shape } from "../store/editorStore";

export function useShapeSelection(
  selectedShapeId: string | null,
  shapes: Shape[],
  shapeRefs: React.MutableRefObject<Map<string, Konva.Node>>,
  transformerRef: React.RefObject<Konva.Transformer>,
  glbInteractionModes: Map<string, "konva" | "threejs">,
  selectedIds?: string[]  // ✅ Add multi-select support
) {
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    // ✅ MULTI-SELECTION MODE
    if (selectedIds && selectedIds.length > 0) {
      const nodes = selectedIds
        .map((id) => shapeRefs.current.get(id))
        .filter((node): node is Konva.Node => node !== undefined);
      
      transformer.nodes(nodes);
      transformer.getLayer()?.batchDraw();
      return;
    }

    // ✅ SINGLE SELECTION MODE
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
  }, [selectedShapeId, selectedIds, shapes, shapeRefs, transformerRef, glbInteractionModes]);
}