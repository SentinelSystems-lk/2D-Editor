import { useCanvasStore } from "../store/editorStore";

function Toolbar() {
  const stage = useCanvasStore((state) => state.stage);
  console.log(stage);


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
    </div>
  );
}

export default Toolbar;
