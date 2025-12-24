// import React from 'react';
import { useCanvasStore } from "../store/editorStore";
import { GLBRenderer } from "./GLBRender";
import type { GLBShape } from "../store/editorStore";
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { SketchPicker, ColorResult } from "react-color";
import { color } from "three/tsl";
import "./PropertiesPanel.css";

function PropertiesPanel() {
  const { shapes, selectedShapeId, updateShape, deleteShape } =
    useCanvasStore();
  const [loadedGLBs, setLoadedGLBs] = useState<Map<string, HTMLCanvasElement>>(
    new Map()
  );

  const selectedShape = shapes.find((s) => s.id === selectedShapeId);

  const [showFillPicker, setShowFillPicker] = useState(false);
  const fillPickerRef = useRef<HTMLDivElement>(null);

  // Close the picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        fillPickerRef.current &&
        !fillPickerRef.current.contains(e.target as Node)
      ) {
        setShowFillPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!selectedShape) {
    return (
      <div
        className="panel p-4 bg-gray-50 border-l"
        style={{ width: "280px", height: "100%" }}
      >
        <div className="panel-title text-lg font-bold mb-4">⚙️ Properties</div>
        <p style={{ color: "#666", fontSize: "13px" }}>No object selected</p>
      </div>
    );
  }

  const handleInputChange = (property: string, value: number) => {
    updateShape(selectedShape.id, { [property]: value });
  };

  const handleDelete = () => {
    deleteShape(selectedShape.id);
  };

  const handleFillColorChange = (color: ColorResult) => {
    updateShape(selectedShape.id, {
      fill: color.hex,
      opacity: color.rgb.a ?? 1,
    });
  };

  const handleStokeWidth = (value: number) => {
    updateShape(selectedShape.id, { strokeWidth: value });
  };

  function hexToRgb(hex: string) {
    const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return res
      ? {
          r: parseInt(res[1], 16),
          g: parseInt(res[2], 16),
          b: parseInt(res[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  return (
    <div
      className="panel p-4 bg-gray-50 border-l"
      style={{ width: "300px", height: "100%", overflowY: "auto" }}
    >
      <div className="panel-title text-lg font-bold mb-4">⚙️ Properties</div>

      {/* Shape Type */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <div className="titles ">
          {selectedShape.type.charAt(0).toUpperCase() +
            selectedShape.type.slice(1)}
        </div>
        <div className="idname">ID: {selectedShape.id.slice(-6)}</div>
      </div>

      {/* Position */}
      <div>
        <h3 className="titles">Position</h3>
        <div className="positionxy">
          <div>
            <label>X:</label>
            <input
              type="number"
              value={Math.round(selectedShape.x)}
              onChange={(e) =>
                handleInputChange("x", parseFloat(e.target.value))
              }
              className="input-box"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Y:</label>
            <input
              type="number"
              value={Math.round(selectedShape.y)}
              onChange={(e) =>
                handleInputChange("y", parseFloat(e.target.value))
              }
              className="input-box"
            />
          </div>
        </div>
      </div>

      {/* Size - Rectangle */}
      {selectedShape.type === "rectangle" && (
        <div className="mb-4">
          <h3 className="titles">Size</h3>
          <div className="positionxy">
            <div>
              <label className="text-xs text-gray-600">Width:</label>
              <input
                type="number"
                value={Math.round(
                  selectedShape.width * (selectedShape.scaleX || 1)
                )}
                onChange={(e) =>
                  handleInputChange("width", parseFloat(e.target.value))
                }
                className="input-box"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Height:</label>
              <input
                type="number"
                value={Math.round(
                  selectedShape.height * (selectedShape.scaleY || 1)
                )}
                onChange={(e) =>
                  handleInputChange("height", parseFloat(e.target.value))
                }
                className="input-box"
              />
            </div>
          </div>
        </div>
      )}

      {/* Size - Circle */}
      {selectedShape.type === "circle" && (
        <div className="mb-4">
          <h3 className="titles">Size</h3>
          <div>
            <label className="subtitles">Radius:</label>
            <input
              type="number"
              value={Math.round(
                selectedShape.radius * (selectedShape.scaleX || 1)
              )}
              onChange={(e) =>
                handleInputChange("radius", parseFloat(e.target.value))
              }
              className="input-box"
            />
          </div>
        </div>
      )}

      {/* Size - Image/GLB */}
      {(selectedShape.type === "image" || selectedShape.type === "glb") && (
        <div className="mb-4">
          <h3 className="titles">Size</h3>
          <div className="positionxy">
            <div>
              <label>Width:</label>
              <input
                type="number"
                value={Math.round(
                  (selectedShape.width || 0) * (selectedShape.scaleX || 1)
                )}
                onChange={(e) =>
                  handleInputChange("width", parseFloat(e.target.value))
                }
                className="input-box"
              />
            </div>
            <div>
              <label>Height:</label>
              <input
                type="number"
                value={Math.round(
                  (selectedShape.height || 0) * (selectedShape.scaleY || 1)
                )}
                onChange={(e) =>
                  handleInputChange("height", parseFloat(e.target.value))
                }
                className="input-box"
              />
            </div>
          </div>
        </div>
      )}

      {/* Rotation */}
      <div className="mb-4">
        <h3 className="titles">Rotation</h3>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="360"
            value={selectedShape.rotation || 0}
            onChange={(e) =>
              handleInputChange("rotation", parseFloat(e.target.value))
            }
            className="input-slider"
          />
          <input
            type="number"
            value={Math.round(selectedShape.rotation || 0)}
            onChange={(e) =>
              handleInputChange("rotation", parseFloat(e.target.value))
            }
            className="input-box"
          />
          <span className="input-box">°</span>
        </div>
      </div>

      {/* Scale */}
      <div className="mb-4">
        <h3 className="titles">Scale</h3>
        <div className="space-y-2">
          <div>
            <label className="subtitles">Scale X:</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={selectedShape.scaleX || 1}
                onChange={(e) =>
                  handleInputChange("scaleX", parseFloat(e.target.value))
                }
                className="input-slider"
              />
              {/* <span className="text-xs text-gray-600 w-12">
                {((selectedShape.scaleX || 1) * 100).toFixed(0)}%
              </span> */}
            </div>
          </div>
          <div>
            <label className="subtitles">Scale Y:</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={selectedShape.scaleY || 1}
                onChange={(e) =>
                  handleInputChange("scaleY", parseFloat(e.target.value))
                }
                className="input-slider"
              />
              {/* <span className="text-xs text-gray-600 w-12">
                {((selectedShape.scaleY || 1) * 100).toFixed(0)}%
              </span> */}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="titles">Fill Color</h3>

        {/* Color Button */}
        <button
          onClick={() => setShowFillPicker(!showFillPicker)}
          style={{
            backgroundColor: selectedShape.fill || "#3b82f6",
          }}
          className="colorbtn"
        />

        {/* Color Picker */}
        {showFillPicker && (
          <div
            ref={fillPickerRef}
            style={{
              position: "absolute",
              zIndex: 100,
              marginTop: "8px",
            }}
          >
            <SketchPicker
              width="11vw"
              color={{
                r: hexToRgb(selectedShape.fill || "#3b82f6").r,
                g: hexToRgb(selectedShape.fill || "#3b82f6").g,
                b: hexToRgb(selectedShape.fill || "#3b82f6").b,
                a: selectedShape.opacity ?? 1,
              }}
              onChange={handleFillColorChange}
            />
          </div>
        )}
      </div>

      <div>
        <h3 className="titles">Stoke</h3>
        <div>
          <label className="subtitles">Width:</label>
          <input
            type="number"
            value={Math.round(selectedShape.strokeWidth || 0)}
            onChange={(e) => handleStokeWidth(parseFloat(e.target.value))}
            className="input-box"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="deletecon">
        <button
          onClick={handleDelete}
          className="deletebtn"
        >
        Delete
        </button>
      </div>

      {/* <div style={{  width: "50px", height: "50px"}}>
              {shapes
                .filter((s): s is GLBShape => s.type === "glb")
                .map((shape) => (
                  <GLBRenderer
                    key={shape.id}
                    src={shape.src}
                    width={shape.width}
                    height={shape.height}
                    onLoad={(canvas) => handleGLBLoad(shape.id, canvas)}
                  />
                ))}
            </div> */}
    </div>
  );
}

export default PropertiesPanel;
