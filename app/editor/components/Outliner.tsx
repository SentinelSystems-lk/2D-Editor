"use client";

import React from 'react';
import { useCanvasStore } from '../store/editorStore';
import type { ShapeType } from '../store/editorStore';

function ShapeDropdown() {
  const { selectedShapeType, setSelectedShapeType } = useCanvasStore();
  const select = useCanvasStore((state) => state.isSelectClicked);
  const{isSelectClicked, setSelectClick} = useCanvasStore();
  const{isPenSelected, setPenSelected} = useCanvasStore();
  const{isDisjointMode, setDisjointMode} = useCanvasStore();
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPenSelected(false);
    const value = e.target.value as ShapeType;
    if (value) {
      setSelectedShapeType(value);
      setSelectClick(false);
    }
  };
  
  
  function handleSelect(){
    setPenSelected(false);
    setSelectClick(!isSelectClicked);
    console.log(select);
  }

  function handlepen(){
    setSelectClick(false);
    setPenSelected(!isPenSelected);
    console.log(isPenSelected);
  }

  function handleDisjoint() {
    setDisjointMode(!isDisjointMode);
  }


  return (
    <div className="mb-4">
      <button onClick={handlepen} className={`Selectbtn ${isPenSelected ? "active" : "inactive"}`}>🖊️</button>
      <br />
      <button onClick={handleSelect} className={`Selectbtn ${isSelectClicked ? "active" : "inactive"}`}>Select</button>
      <br />
      <button
          onClick={handleDisjoint}
          className={`w-full mb-2 px-4 py-2 rounded font-semibold transition-colors ${
            isDisjointMode ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          🚫 Disjoint Mode {isDisjointMode ? "ON" : "OFF"}
        </button>
      <br />
      {/* <label className="block text-sm font-medium mb-2">
        Select Shape Tool
      </label> */}
      <select 
        className="dropdown w-full p-2 border rounded bg-white"
        value={selectedShapeType || ""}
        onChange={handleChange}
      >
        <option value="" disabled>
          Choose a shape
        </option>
        <option value="rectangle">■</option>
        <option value="circle">⬤</option>
        <option value="triangle">▲</option>
      </select>
      <div>
        <button
          onClick={() => {
            setPenSelected(false);
            setSelectedShapeType("text");
            setSelectClick(false);
          }}
        >
          Text
        </button>
      </div>
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