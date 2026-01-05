import type { ImageShape, GLBShape } from "../store/editorStore";

export const handleFileDrop = (
  e: React.DragEvent,
  stageRef: React.RefObject<any>,
  addShape: (shape: ImageShape | GLBShape) => void,
  setSelectedShapeId: (id: string) => void,
  glbInteractionModes: Map<string, "konva" | "threejs">
) => {
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

  // Handle URL drop
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