"use client";

import dynamic from "next/dynamic";

const EditorLayout = dynamic(() => import("./components/EditorLayout"), {
  ssr: false,
});

export default function EditorPage() {
  return <EditorLayout />;
}