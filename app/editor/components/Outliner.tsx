"use client";

import React from 'react';
import { useCanvasStore } from '../store/editorStore';
import type { ShapeType } from '../store/editorStore';

function ShapeDropdown() {
  const { selectedShapeType, setSelectedShapeType } = useCanvasStore();
  const select = useCanvasStore((state) => state.isSelectClicked);
  const{isSelectClicked, setSelectClick} = useCanvasStore();
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ShapeType;
    if (value) {
      setSelectedShapeType(value);
      setSelectClick(false);
    }
  };
  
  
  function handleSelect(){
    setSelectClick(!isSelectClicked);
    console.log(select);
  }

  return (
    <div className="mb-4">
      <button onClick={handleSelect} className={`Selectbtn ${isSelectClicked ? "active" : "inactive"}`}>Select</button>
      <br />
      <label className="block text-sm font-medium mb-2">
        Select Shape Tool
      </label>
      <select 
        className="dropdown w-full p-2 border rounded bg-white"
        value={selectedShapeType}
        onChange={handleChange}
      >
        <option value="rectangle">Rectangle</option>
        <option value="circle">Circle</option>
      </select>
      <p className="text-xs text-gray-500 mt-1">
        Current: <span className="font-semibold">{selectedShapeType}</span>
      </p>
    </div>
  );
}

function Outliner() {
  const shapes = useCanvasStore((state) => state.shapes);

  return (
    <div className="panel p-4 bg-gray-50 border-r" style={{ width: "250px", height: "100%" }}>
      <h2 className="text-lg font-bold mb-4">Tools</h2>
      
      <ShapeDropdown />
      
      <div className="mt-6">
        <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
          <span>Layers</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {shapes.length}
          </span>
        </h3>
        
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {shapes.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">
              No shapes yet. Draw one!
            </p>
          ) : (
            shapes.map((shape, index) => (
              <div 
                key={shape.id} 
                className="text-xs p-2 bg-white border rounded hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">
                    {shape.type}
                  </span>
                  <span className="text-gray-400">
                    #{shapes.length - index}
                  </span>
                </div>
                {shape.type === 'rectangle' && (
                  <div className="text-gray-500 mt-1">
                    {Math.round(shape.width)} × {Math.round(shape.height)}
                  </div>
                )}
                {shape.type === 'circle' && (
                  <div className="text-gray-500 mt-1">
                    r: {Math.round(shape.radius)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Outliner;