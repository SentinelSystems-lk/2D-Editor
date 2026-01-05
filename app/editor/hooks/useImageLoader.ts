import { useEffect, useState } from "react";
import type { Shape, ImageShape } from "../store/editorStore";

export function useImageLoader(shapes: Shape[]) {
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(
    new Map()
  );

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

  return { loadedImages };
}