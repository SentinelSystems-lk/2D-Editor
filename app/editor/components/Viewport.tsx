"use client";

import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Circle } from "react-konva";

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize(); // initial size
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#1a1a1a",
      }}
    >
      {size.width > 0 && size.height > 0 && (
        <Stage
          width={size.width}
          height={size.height}
          style={{ backgroundColor: "white" }}
        >
          <Layer>
            <Rect
              x={20}
              y={50}
              width={100}
              height={100}
              fill="red"
              draggable
            />
            <Circle
              x={200}
              y={100}
              radius={50}
              fill="green"
              draggable
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
