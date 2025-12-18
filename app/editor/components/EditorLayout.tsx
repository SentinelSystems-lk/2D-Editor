"use client";

import Toolbar from "./Toolbar";
import Outliner from "./Outliner";
import Viewport from "./Viewport";
import PropertiesPanel from "./PropertiesPanel";
import BottomBar from "./BottomBar";

export default function EditorLayout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Toolbar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Outliner />
        <Viewport />
        <PropertiesPanel />
      </div>
      <BottomBar />
    </div>
  );
}