import { useCanvasStore } from "../store/editorStore";

function LineProperties() {
  const { selectedLineId, updateLine, lines, deleteLine, alignLineToXAxis, alignToYAxis } = useCanvasStore();
  const selectedLine = lines.find((s) => s.id === selectedLineId);
  console.log(selectedLine);

  if (!selectedLineId || !selectedLine) {
    return <div>No line selected.</div>;
  }

  return (
    <>
      <div className="titles">Line</div>
      <div className="idname">ID:{selectedLine?.id}</div>
      <div>
        <label className="titles">Stroke Color</label>
        <br />
        <input
          type="color"
          value={selectedLine?.stroke}
          onChange={(e) =>
            updateLine(selectedLineId, { stroke: e.target.value })
          }
        />
      </div>
      <div style={{marginTop: 8}}>
        <label className="titles">Stroke Width</label>
        <br />
        <input
          type="number"
          value={selectedLine?.strokeWidth}
          onChange={(e) =>
            updateLine(selectedLineId, { strokeWidth: parseFloat(e.target.value) })
            }
        />
      </div>

      {/* align line to x axis */}
       <div style={{marginTop: 8}}>
        <label className="titles">Align to X Axis</label>
        <br />
        <input
          type="checkbox"
          checked={!!selectedLine?.alignToXAxis}
          onChange={(e) => {
            const checked = e.target.checked;
            if (checked && selectedLineId) {
              alignLineToXAxis(selectedLineId);
            }
            if (selectedLineId) {
              updateLine(selectedLineId, { alignToXAxis: checked });
            }
          }}
        />
      </div>

        <div style={{marginTop: 8}}>
        <label className="titles">Align to Y Axis</label>
        <br />
        <input
          type="checkbox"
          checked={!!selectedLine?.alignToYAxis}
          onChange={(e) => {
            const checked = e.target.checked;
            if (checked && selectedLineId) {
              alignToYAxis(selectedLineId);
            }
            if (selectedLineId) {
              updateLine(selectedLineId, { alignToYAxis: checked });
            }
          }}
        />
      </div>


      <div className="deletecon">
        <button
          className="deletebtn"
          onClick={() => {
            deleteLine(selectedLineId);
          }}
        >
          Delete
        </button>
      </div>
    </>
  );
}

export default LineProperties;
