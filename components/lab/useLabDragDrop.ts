/**
 * useLabDragDrop — Pointer-event-based drag-and-drop hook
 * for dragging chemical bottles onto the beaker.
 */

import { useCallback, useRef, useState } from "react";
import {
    BOTTLE_W, BOTTLE_H, SHELF_Y, SHELF_H,
    DROP_ZONE, SHELF_SCROLL_BTN_W,
    type BottleLayout,
} from "@/lib/lab-sprites";

export interface DragState {
    /** Index in the bottles array, or -1 if not dragging */
    bottleIndex: number;
    /** Current pointer position on canvas */
    x: number;
    y: number;
    /** Whether the bottle is currently over the drop zone */
    overDropZone: boolean;
}

interface UseLabDragDropOptions {
    bottles: BottleLayout[];
    scrollX: number;
    canvasWidth: number;
    onDrop: (bottleIndex: number) => void;
}

function isInsideDropZone(x: number, y: number): boolean {
    return (
        x >= DROP_ZONE.x &&
        x <= DROP_ZONE.x + DROP_ZONE.w &&
        y >= DROP_ZONE.y &&
        y <= DROP_ZONE.y + DROP_ZONE.h
    );
}

export function useLabDragDrop({ bottles, scrollX, canvasWidth, onDrop }: UseLabDragDropOptions) {
    const [drag, setDrag] = useState<DragState>({
        bottleIndex: -1,
        x: 0,
        y: 0,
        overDropZone: false,
    });

    const [hoveredBottle, setHoveredBottle] = useState(-1);
    const [hoveredScrollBtn, setHoveredScrollBtn] = useState<"left" | "right" | null>(null);
    const isDragging = useRef(false);

    /** Convert a pointer event to canvas-local coordinates. */
    const toCanvasCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const scaleX = e.currentTarget.width / rect.width;
        const scaleY = e.currentTarget.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }, []);

    /** Find which bottle is at (cx, cy), accounting for scroll. */
    const bottleAt = useCallback(
        (cx: number, cy: number): number => {
            for (let i = bottles.length - 1; i >= 0; i--) {
                const b = bottles[i];
                const bx = b.x - scrollX;
                const by = b.y;
                if (
                    cx >= bx - BOTTLE_W / 2 &&
                    cx <= bx + BOTTLE_W / 2 &&
                    cy >= by - BOTTLE_H / 2 &&
                    cy <= by + BOTTLE_H / 2
                ) {
                    return i;
                }
            }
            return -1;
        },
        [bottles, scrollX]
    );

    /** Check if pointer is over a scroll button. */
    const scrollBtnAt = useCallback(
        (cx: number, cy: number): "left" | "right" | null => {
            const midY = SHELF_Y + SHELF_H / 2;
            const r = 14;
            // Left arrow
            const lx = SHELF_SCROLL_BTN_W / 2 + 20;
            if (Math.hypot(cx - lx, cy - midY) <= r) return "left";
            // Right arrow
            const rx = canvasWidth - SHELF_SCROLL_BTN_W / 2 - 20;
            if (Math.hypot(cx - rx, cy - midY) <= r) return "right";
            return null;
        },
        [canvasWidth]
    );

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLCanvasElement>) => {
            const { x, y } = toCanvasCoords(e);
            const idx = bottleAt(x, y);
            if (idx >= 0) {
                isDragging.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                setDrag({ bottleIndex: idx, x, y, overDropZone: false });
            }
        },
        [toCanvasCoords, bottleAt]
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLCanvasElement>) => {
            const { x, y } = toCanvasCoords(e);

            if (isDragging.current) {
                setDrag((prev) => ({
                    ...prev,
                    x,
                    y,
                    overDropZone: isInsideDropZone(x, y),
                }));
            } else {
                // Hover detection
                const idx = bottleAt(x, y);
                setHoveredBottle(idx);
                setHoveredScrollBtn(scrollBtnAt(x, y));
            }
        },
        [toCanvasCoords, bottleAt, scrollBtnAt]
    );

    const onPointerUp = useCallback(
        (e: React.PointerEvent<HTMLCanvasElement>) => {
            if (!isDragging.current) return;
            isDragging.current = false;
            e.currentTarget.releasePointerCapture(e.pointerId);

            const { x, y } = toCanvasCoords(e);
            if (isInsideDropZone(x, y) && drag.bottleIndex >= 0) {
                onDrop(drag.bottleIndex);
            }

            setDrag({ bottleIndex: -1, x: 0, y: 0, overDropZone: false });
        },
        [toCanvasCoords, drag.bottleIndex, onDrop]
    );

    const onPointerLeave = useCallback(() => {
        setHoveredBottle(-1);
        setHoveredScrollBtn(null);
    }, []);

    return {
        drag,
        hoveredBottle,
        hoveredScrollBtn,
        handlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerLeave,
        },
    };
}
