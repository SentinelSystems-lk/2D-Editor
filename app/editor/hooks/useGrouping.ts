import { useCallback } from "react";
import { GroupShape, useCanvasStore } from "../store/editorStore";
import { create } from 'zustand';

export function useGrouping(){
    const {shapes, lines, addShape, deleteShape, updateShape} = useCanvasStore();

    const createGroup = useCallback((selectedIds: string[]) => {
        if (selectedIds.length < 2) return null;

        // calculate group bounds

        let minX = Infinity, minY = Infinity;

        selectedIds.forEach(id => {
            const shape = shapes.find(s => s.id === id);
            const line = lines.find(l => l.id === id);
            if(shape){
                minX = Math.min(minX, shape.x);
                minY = Math.min(minY, shape.y);
            }else if(line){
                minX = Math.min(minX, line.points[0], line.points[2]);
                minY = Math.min(minY, line.points[1], line.points[3]);
            }
        });

        const group: GroupShape = {
            id: `group-${Date.now()}`,
            type: "group",
            x: minX,
            y: minY,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            childIds: selectedIds,
        }

    },
    [shapes, lines, addShape]
    );
}