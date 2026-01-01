"use client";

import React from 'react';
import { useCanvasStore } from '../store/editorStore';
import type { ShapeType } from '../store/editorStore';

function ShapeDropdown() {
  const { selectedShapeType, setSelectedShapeType } = useCanvasStore();
  const select = useCanvasStore((state) => state.isSelectClicked);
  const{isSelectClicked, setSelectClick} = useCanvasStore();
  const{isPenSelected, setPenSelected} = useCanvasStore();
  
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

  function handlepen(){
    setPenSelected(!isPenSelected);
    console.log(isPenSelected);
  }


  return (
    <div className="mb-4">
      <button onClick={handlepen}>Pen</button>
      <br />
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
        <option value="triangle">Triangle</option>
      </select>
      <p className="text-xs text-gray-500 mt-1">
        Current: <span className="font-semibold">{selectedShapeType}</span>
      </p>
    </div>
  );
}

function Outliner() {
  

  return (
    <div className="panel p-4 bg-gray-50 border-r" style={{ width: "250px", height: "100%" }}>
      <h2 className="panel-title text-lg font-bold mb-4">🛠️ Tools</h2>
      
      <ShapeDropdown />
      
     
    </div>
  );
}

export default Outliner;