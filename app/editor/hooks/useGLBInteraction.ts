import { useState } from "react";

export function useGLBInteraction() {
  const [glbInteractionModes, setGlbInteractionModes] = useState<
    Map<string, "konva" | "threejs">
  >(new Map());
  const [glbCanvases, setGlbCanvases] = useState<Map<string, HTMLCanvasElement>>(
    new Map()
  );

  const handleGLBModeToggle = (shapeId: string) => {
    setGlbInteractionModes((prev) => {
      const newModes = new Map(prev);
      const currentMode = newModes.get(shapeId) || "konva";
      const newMode = currentMode === "konva" ? "threejs" : "konva";
      newModes.set(shapeId, newMode);
      return newModes;
    });
  };

  return {
    glbInteractionModes,
    glbCanvases,
    setGlbCanvases,
    handleGLBModeToggle,
  };
}