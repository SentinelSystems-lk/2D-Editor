import { useCanvasStore } from "../store/editorStore";
import { useEffect } from "react";


function Toolbar() {
  const stage = useCanvasStore((state) => state.stage);

  const {undo, redo, canRedo, canUndo} = useCanvasStore();

  useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+Z or Cmd+Z for Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    // Ctrl+Shift+Z or Cmd+Shift+Z for Redo
    else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      redo();
    }
    // Ctrl+Y or Cmd+Y for Redo (alternative)
    else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      redo();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [undo, redo]);


  function downloadURI(uri: string, name: string): void {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleExport() {
    if (!stage) return;
    const uri = stage.toDataURL();
    // we also can save uri as file
    downloadURI(uri, "Aadhya2DImage.png");
  }

  return (
    <div
      style={{
        height: "50px",
        background: "#2a2a2a",
        borderBottom: "1px solid #3a3a3a",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "0 16px",
      }}
    >
      
      <button onClick={handleExport}>
        Download
      </button>

      {/* Undo/Redo Section */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`flex-1 px-4 py-2 rounded font-semibold transition-colors ${
            canUndo 
              ? "bg-purple-500 text-white hover:bg-purple-600" 
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          ↶ Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`flex-1 px-4 py-2 rounded font-semibold transition-colors ${
            canRedo 
              ? "bg-purple-500 text-white hover:bg-purple-600" 
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          ↷ Redo
        </button>
      </div>

    </div>
  );
}

export default Toolbar;
