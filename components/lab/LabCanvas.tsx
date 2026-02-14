"use client";

/**
 * LabCanvas â€” 2D interactive chemistry lab bench.
 *
 * Renders a canvas with:
 * - A shelf of draggable chemical bottles (scrollable)
 * - A central beaker/flask (drop zone)
 * - Drag-and-drop interaction to add chemicals
 * - Canvas-drawn particle effects for reactions
 * - Tooltip on bottle hover
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    CANVAS_W, CANVAS_H,
    SHELF_Y, SHELF_H, SHELF_SCROLL_BTN_W,
    BOTTLE_W, BOTTLE_GAP,
    BEAKER_X, BEAKER_Y, BEAKER_H, BEAKER_RIM_H,
    buildBottleLayouts, shelfContentWidth,
    drawShelfBackground, drawBottle, drawBeaker,
    drawLabBench, drawDropZoneHighlight, drawScrollArrow,
} from "@/lib/lab-sprites";
import {
    spawnBubbles, spawnPrecipitate, spawnSmoke, spawnHeatGlow,
    spawnPourStream,
    updateParticles, drawParticles, clearParticles,
} from "@/lib/lab-particles";
import { buildSimulationPlan } from "@/lib/simulation-engine";
import { useLabDragDrop } from "./useLabDragDrop";
import type { Reaction } from "@/lib/reactions";

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type LabPhase = "idle" | "pouring-a" | "pouring-b" | "reacting" | "done";

interface GuidedStep {
    expectedChemical: string;
    onCorrectDrop: () => void;
    onWrongDrop: (droppedChemical: string) => void;
}

interface LabCanvasProps {
    chemicals: string[];
    onMix: (chemicalA: string, chemicalB: string) => void;
    reaction: Reaction | null;
    isReacting: boolean;
    onReset: () => void;
    guidedStep?: GuidedStep | null;
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function LabCanvas({ chemicals, onMix, reaction, isReacting, onReset, guidedStep }: LabCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);

    // Bottle layouts
    const bottles = useMemo(() => buildBottleLayouts(chemicals), [chemicals]);
    const totalShelfW = useMemo(() => shelfContentWidth(chemicals.length), [chemicals.length]);

    // Scroll state
    const [scrollX, setScrollX] = useState(0);
    const maxScroll = Math.max(0, totalShelfW - CANVAS_W);

    // Beaker state
    const [addedChemicals, setAddedChemicals] = useState<number[]>([]); // bottle indices
    const [phase, setPhase] = useState<LabPhase>("idle");
    const [liquidColor, setLiquidColor] = useState("#dbeafe");
    const [liquidLevel, setLiquidLevel] = useState(0);
    const phaseRef = useRef<LabPhase>("idle");
    const pourTimerRef = useRef<number>(0);

    // Tooltip
    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

    // â”€â”€ Particle spawning timers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const particleIntervalRef = useRef<number>(0);

    // --- Drag and drop ---
    const handleDrop = useCallback(
        (bottleIndex: number) => {
            if (phase !== "idle" && phase !== "done") return;
            if (addedChemicals.length >= 2) return;
            if (addedChemicals.includes(bottleIndex)) return;

            const bottle = bottles[bottleIndex];
            if (!bottle) return;

            // Guided mode validation
            if (guidedStep) {
                if (bottle.label !== guidedStep.expectedChemical) {
                    guidedStep.onWrongDrop(bottle.label);
                    return; // reject — don't add to beaker
                }
                guidedStep.onCorrectDrop();
            }

            const newAdded = [...addedChemicals, bottleIndex];
            setAddedChemicals(newAdded);

            // Pour animation
            const pourPhase = newAdded.length === 1 ? "pouring-a" : "pouring-b";
            setPhase(pourPhase);
            phaseRef.current = pourPhase;
            setLiquidLevel(prev => Math.min(prev + 0.35, 0.8));

            // Pour stream particles
            const pourTimer = window.setInterval(() => {
                spawnPourStream(
                    BEAKER_X,
                    BEAKER_Y - BEAKER_H / 2 + BEAKER_RIM_H - 30,
                    bottle.color + "aa",
                    3
                );
            }, 80);
            pourTimerRef.current = pourTimer;

            // End pour after a beat
            window.setTimeout(() => {
                window.clearInterval(pourTimer);

                if (newAdded.length === 2) {
                    // Trigger mix
                    const chemA = bottles[newAdded[0]].label;
                    const chemB = bottles[newAdded[1]].label;
                    setPhase("reacting");
                    phaseRef.current = "reacting";
                    onMix(chemA, chemB);
                } else {
                    setPhase("idle");
                    phaseRef.current = "idle";
                }
            }, 800);
        },
        [addedChemicals, bottles, onMix, phase, guidedStep]
    );

    const { drag, hoveredBottle, hoveredScrollBtn, handlers } = useLabDragDrop({
        bottles,
        scrollX,
        canvasWidth: CANVAS_W,
        onDrop: handleDrop,
    });

    // â”€â”€ React to reaction result â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        if (!isReacting && reaction !== undefined && phaseRef.current === "reacting") {
            const plan = buildSimulationPlan(reaction);
            setLiquidColor(plan.liquid.finalColor);
            setLiquidLevel(0.7);

            // Start particle effects
            if (particleIntervalRef.current) {
                window.clearInterval(particleIntervalRef.current);
            }

            const spawnEffects = () => {
                if (plan.effects.bubbles) spawnBubbles(2);
                if (plan.effects.precipitate) spawnPrecipitate(1);
                if (plan.effects.smoke) spawnSmoke(1);
            };

            // Heat glow once
            if (plan.effects.heat !== "none") {
                spawnHeatGlow(plan.effects.heat);
            }

            // Continuous particle spawning for a few seconds
            spawnEffects();
            particleIntervalRef.current = window.setInterval(spawnEffects, 300);

            window.setTimeout(() => {
                window.clearInterval(particleIntervalRef.current);
                particleIntervalRef.current = 0;
            }, 4000);

            setPhase("done");
            phaseRef.current = "done";
        }
    }, [isReacting, reaction]);

    // â”€â”€ Handle reset â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleReset = useCallback(() => {
        setAddedChemicals([]);
        setPhase("idle");
        phaseRef.current = "idle";
        setLiquidColor("#dbeafe");
        setLiquidLevel(0);
        clearParticles();
        if (particleIntervalRef.current) {
            window.clearInterval(particleIntervalRef.current);
            particleIntervalRef.current = 0;
        }
        if (pourTimerRef.current) {
            window.clearInterval(pourTimerRef.current);
            pourTimerRef.current = 0;
        }
        onReset();
    }, [onReset]);

    // â”€â”€ Scroll handling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const scrollBy = useCallback(
        (delta: number) => {
            setScrollX((prev) => Math.max(0, Math.min(maxScroll, prev + delta)));
        },
        [maxScroll]
    );

    // Click on scroll arrows
    const handleCanvasClick = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const scaleX = e.currentTarget.width / rect.width;
            const scaleY = e.currentTarget.height / rect.height;
            const cx = (e.clientX - rect.left) * scaleX;
            const cy = (e.clientY - rect.top) * scaleY;

            const shelfMidY = SHELF_Y + SHELF_H / 2;
            const r = 14;

            // Left arrow
            const lx = SHELF_SCROLL_BTN_W / 2 + 20;
            if (Math.hypot(cx - lx, cy - shelfMidY) <= r && scrollX > 0) {
                scrollBy(-(BOTTLE_W + BOTTLE_GAP) * 3);
                return;
            }
            // Right arrow
            const rx = CANVAS_W - SHELF_SCROLL_BTN_W / 2 - 20;
            if (Math.hypot(cx - rx, cy - shelfMidY) <= r && scrollX < maxScroll) {
                scrollBy((BOTTLE_W + BOTTLE_GAP) * 3);
                return;
            }
        },
        [scrollX, maxScroll, scrollBy]
    );

    // Wheel scroll on shelf
    const handleWheel = useCallback(
        (e: React.WheelEvent<HTMLCanvasElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const scaleY = e.currentTarget.height / rect.height;
            const cy = (e.clientY - rect.top) * scaleY;
            if (cy >= SHELF_Y && cy <= SHELF_Y + SHELF_H) {
                e.preventDefault();
                scrollBy(e.deltaY > 0 ? 80 : -80);
            }
        },
        [scrollBy]
    );

    // â”€â”€ Hover tooltip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        if (hoveredBottle >= 0 && drag.bottleIndex < 0) {
            const b = bottles[hoveredBottle];
            if (b) {
                setTooltip({
                    text: b.label,
                    x: b.x - scrollX,
                    y: b.y - BOTTLE_W / 2 - 18,
                });
            }
        } else {
            setTooltip(null);
        }
    }, [hoveredBottle, drag.bottleIndex, bottles, scrollX]);

    // â”€â”€ Render loop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const render = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = CANVAS_W * dpr;
            canvas.height = CANVAS_H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // Clear
            ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

            // Background gradient â€” soft lab wall
            const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
            bgGrad.addColorStop(0, "#eef2ff");
            bgGrad.addColorStop(0.35, "#e8edf8");
            bgGrad.addColorStop(0.65, "#e2ddd4");
            bgGrad.addColorStop(1, "#cfc4b0");
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

            // Subtle tile grid on wall (behind shelf)
            ctx.strokeStyle = "rgba(0,0,0,0.02)";
            ctx.lineWidth = 1;
            for (let gx = 40; gx < CANVAS_W; gx += 60) {
                ctx.beginPath();
                ctx.moveTo(gx, 0);
                ctx.lineTo(gx, CANVAS_H);
                ctx.stroke();
            }
            for (let gy = 0; gy < CANVAS_H; gy += 60) {
                ctx.beginPath();
                ctx.moveTo(0, gy);
                ctx.lineTo(CANVAS_W, gy);
                ctx.stroke();
            }

            // Lab bench
            drawLabBench(ctx, CANVAS_W, CANVAS_H);

            // Shelf background
            drawShelfBackground(ctx, scrollX, CANVAS_W);

            // Shelf bottles (clipped to shelf area)
            ctx.save();
            ctx.beginPath();
            ctx.rect(SHELF_SCROLL_BTN_W + 20, SHELF_Y, CANVAS_W - (SHELF_SCROLL_BTN_W + 20) * 2, SHELF_H);
            ctx.clip();

            for (let i = 0; i < bottles.length; i++) {
                const b = bottles[i];
                const screenX = b.x - scrollX;

                // Skip if off-screen
                if (screenX < -BOTTLE_W || screenX > CANVAS_W + BOTTLE_W) continue;

                // Skip if being dragged
                if (drag.bottleIndex === i) continue;

                // Dim if already added
                const isAdded = addedChemicals.includes(i);
                const isHovered = hoveredBottle === i && drag.bottleIndex < 0;

                drawBottle(ctx, screenX, b.y, b.color, b.shortLabel, isHovered, isAdded ? 0.35 : 1);
            }
            ctx.restore();

            // Scroll arrows
            const leftArrowX = SHELF_SCROLL_BTN_W / 2 + 20;
            const rightArrowX = CANVAS_W - SHELF_SCROLL_BTN_W / 2 - 20;
            const arrowY = SHELF_Y + SHELF_H / 2;
            if (scrollX > 0) {
                drawScrollArrow(ctx, leftArrowX, arrowY, "left", hoveredScrollBtn === "left");
            }
            if (scrollX < maxScroll) {
                drawScrollArrow(ctx, rightArrowX, arrowY, "right", hoveredScrollBtn === "right");
            }

            // Drop zone highlight (when dragging)
            drawDropZoneHighlight(ctx, drag.bottleIndex >= 0);

            // Beaker
            drawBeaker(ctx, liquidColor, liquidLevel);

            // Chemical labels below beaker (pill badge)
            if (addedChemicals.length > 0) {
                ctx.save();
                ctx.font = "bold 11px Inter, system-ui, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                const labelY = BEAKER_Y + BEAKER_H / 2 + 32;
                const labels = addedChemicals.map(i => bottles[i]?.shortLabel ?? "?");
                const labelText = labels.length === 1 ? labels[0] : `${labels[0]}  +  ${labels[1]}`;
                const tw = ctx.measureText(labelText).width;
                const pillW = tw + 20;
                const pillH = 22;
                // Pill background
                ctx.fillStyle = "rgba(255,255,255,0.85)";
                ctx.beginPath();
                ctx.moveTo(BEAKER_X - pillW / 2 + pillH / 2, labelY - pillH / 2);
                ctx.lineTo(BEAKER_X + pillW / 2 - pillH / 2, labelY - pillH / 2);
                ctx.arc(BEAKER_X + pillW / 2 - pillH / 2, labelY, pillH / 2, -Math.PI / 2, Math.PI / 2);
                ctx.lineTo(BEAKER_X - pillW / 2 + pillH / 2, labelY + pillH / 2);
                ctx.arc(BEAKER_X - pillW / 2 + pillH / 2, labelY, pillH / 2, Math.PI / 2, -Math.PI / 2);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = "rgba(100,116,139,0.2)";
                ctx.lineWidth = 1;
                ctx.stroke();
                // Text
                ctx.fillStyle = "#334155";
                ctx.fillText(labelText, BEAKER_X, labelY);
                ctx.restore();
            }

            // Particles (inside beaker and above)
            updateParticles();
            drawParticles(ctx);

            // Phase indicator text â€” larger, more visible
            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const phaseLabel =
                phase === "idle" && addedChemicals.length === 0
                    ? "Drag a bottle to the beaker"
                    : phase === "idle" && addedChemicals.length === 1
                        ? "Add one more chemical"
                        : phase === "pouring-a" || phase === "pouring-b"
                            ? "Pouring..."
                            : phase === "reacting"
                                ? "Mixing..."
                                : "";
            if (phaseLabel) {
                const iy = BEAKER_Y - BEAKER_H / 2 - 22;
                // Background pill
                ctx.font = "600 13px Inter, system-ui, sans-serif";
                const iw = ctx.measureText(phaseLabel).width + 24;
                ctx.fillStyle = "rgba(255,255,255,0.7)";
                ctx.beginPath();
                ctx.moveTo(BEAKER_X - iw / 2 + 10, iy - 12);
                ctx.lineTo(BEAKER_X + iw / 2 - 10, iy - 12);
                ctx.arc(BEAKER_X + iw / 2 - 10, iy, 12, -Math.PI / 2, Math.PI / 2);
                ctx.lineTo(BEAKER_X - iw / 2 + 10, iy + 12);
                ctx.arc(BEAKER_X - iw / 2 + 10, iy, 12, Math.PI / 2, -Math.PI / 2);
                ctx.closePath();
                ctx.fill();
                // Text
                ctx.fillStyle = "#475569";
                ctx.fillText(phaseLabel, BEAKER_X, iy);
            }
            ctx.restore();

            // Tooltip
            if (tooltip) {
                drawTooltip(ctx, tooltip.text, tooltip.x, tooltip.y);
            }

            // Dragged bottle (follows pointer)
            if (drag.bottleIndex >= 0) {
                const b = bottles[drag.bottleIndex];
                if (b) {
                    drawBottle(ctx, drag.x, drag.y, b.color, b.shortLabel, true, 0.85);
                }
            }

            animFrameRef.current = requestAnimationFrame(render);
        };

        animFrameRef.current = requestAnimationFrame(render);
        return () => {
            cancelAnimationFrame(animFrameRef.current);
        };
    }, [
        bottles, scrollX, maxScroll, drag, hoveredBottle, hoveredScrollBtn,
        addedChemicals, liquidColor, liquidLevel, phase, tooltip,
    ]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (particleIntervalRef.current) window.clearInterval(particleIntervalRef.current);
            if (pourTimerRef.current) window.clearInterval(pourTimerRef.current);
        };
    }, []);

    // Cursor style
    const cursorStyle =
        drag.bottleIndex >= 0
            ? "grabbing"
            : hoveredBottle >= 0
                ? "grab"
                : hoveredScrollBtn
                    ? "pointer"
                    : "default";

    return (
        <div className="relative mx-auto w-full max-w-[900px] rounded-2xl border border-slate-200/90 bg-white/75 p-2 shadow-[0_16px_36px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-3">
            <div className="mb-2 flex items-center justify-between px-1 sm:px-2">
                <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Drag bottles into the beaker
                </p>
                <p className="text-[11px] font-medium text-slate-500">
                    {addedChemicals.length}/2 selected
                </p>
            </div>
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
                    cursor: cursorStyle,
                    borderRadius: 16,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
                }}
                {...handlers}
                onClick={handleCanvasClick}
                onWheel={handleWheel}
            />
            {/* Reset button (shown when done or has chemicals) */}
            {(phase === "done" || addedChemicals.length > 0) && (
                <button
                    onClick={handleReset}
                    className="absolute bottom-3 right-3 rounded-full bg-white/95 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-md hover:bg-white hover:text-sky-700 transition-colors backdrop-blur-sm border border-slate-200"
                >
                    Clear beaker
                </button>
            )}
            <p className="mt-2 px-1 sm:px-2 text-[11px] text-slate-500">
                Tip: use shelf arrows or mouse wheel to browse chemicals.
            </p>
        </div>
    );
}

// â”€â”€ Tooltip drawing helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function drawTooltip(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
    ctx.save();
    ctx.font = "12px Inter, system-ui, sans-serif";
    const metrics = ctx.measureText(text);
    const padX = 10;
    const padY = 6;
    const w = metrics.width + padX * 2;
    const h = 24;
    const tx = Math.max(w / 2, Math.min(CANVAS_W - w / 2, x));
    const ty = Math.max(h, y);

    // Background
    ctx.fillStyle = "rgba(30,41,59,0.9)";
    ctx.beginPath();
    const r = 6;
    ctx.moveTo(tx - w / 2 + r, ty - h);
    ctx.lineTo(tx + w / 2 - r, ty - h);
    ctx.quadraticCurveTo(tx + w / 2, ty - h, tx + w / 2, ty - h + r);
    ctx.lineTo(tx + w / 2, ty - r);
    ctx.quadraticCurveTo(tx + w / 2, ty, tx + w / 2 - r, ty);
    ctx.lineTo(tx - w / 2 + r, ty);
    ctx.quadraticCurveTo(tx - w / 2, ty, tx - w / 2, ty - r);
    ctx.lineTo(tx - w / 2, ty - h + r);
    ctx.quadraticCurveTo(tx - w / 2, ty - h, tx - w / 2 + r, ty - h);
    ctx.closePath();
    ctx.fill();

    // Arrow
    ctx.beginPath();
    ctx.moveTo(tx - 5, ty);
    ctx.lineTo(tx, ty + 5);
    ctx.lineTo(tx + 5, ty);
    ctx.fill();

    // Text
    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, tx, ty - h / 2);
    ctx.restore();
}

