/**
 * Lab Sprites — Layout constants and Canvas drawing helpers
 * for the 2D interactive chemistry lab bench.
 */

// ── Canvas dimensions ──────────────────────────────────────
export const CANVAS_W = 900;
export const CANVAS_H = 560;

// ── Shelf / Bottles ────────────────────────────────────────
export const SHELF_Y = 20;
export const SHELF_H = 180;
export const BOTTLE_W = 52;
export const BOTTLE_H = 78;
export const BOTTLE_GAP = 14;
export const BOTTLE_LABEL_FONT = "bold 9px Inter, system-ui, sans-serif";
export const SHELF_SCROLL_BTN_W = 36;

// ── Beaker ─────────────────────────────────────────────────
export const BEAKER_X = CANVAS_W / 2;
export const BEAKER_Y = 360;
export const BEAKER_W = 130;
export const BEAKER_H = 170;
export const BEAKER_RIM_H = 14;
export const BEAKER_CORNER = 20;

// ── Drop zone (hit-test area for beaker) ───────────────────
export const DROP_ZONE = {
    x: BEAKER_X - BEAKER_W / 2 - 50,
    y: BEAKER_Y - BEAKER_H / 2 - 40,
    w: BEAKER_W + 100,
    h: BEAKER_H + 80,
};

// ── Colour palette for bottles ─────────────────────────────
const BOTTLE_COLORS = [
    "#6db6ff", "#4ade80", "#f472b6", "#fbbf24", "#a78bfa",
    "#fb923c", "#38bdf8", "#f87171", "#34d399", "#c084fc",
    "#e879f9", "#22d3ee", "#facc15", "#fb7185", "#818cf8",
    "#2dd4bf", "#f97316", "#a3e635", "#e11d48", "#6366f1",
    "#14b8a6", "#eab308", "#ec4899", "#8b5cf6", "#06b6d4",
    "#84cc16", "#ef4444", "#3b82f6", "#10b981", "#f59e0b",
];

export interface BottleLayout {
    id: number;
    label: string;
    shortLabel: string;
    color: string;
    x: number;
    y: number;
}

function makeShortLabel(name: string): string {
    const sym = name.match(/\(([^)]+)\)/);
    if (sym?.[1]) return sym[1];
    return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

/** Build the shelf layout for all chemicals, starting from the left. */
export function buildBottleLayouts(chemicals: string[]): BottleLayout[] {
    const startX = SHELF_SCROLL_BTN_W + BOTTLE_GAP * 2 + BOTTLE_W / 2;
    return chemicals.map((chem, i) => ({
        id: i,
        label: chem,
        shortLabel: makeShortLabel(chem),
        color: BOTTLE_COLORS[i % BOTTLE_COLORS.length],
        x: startX + i * (BOTTLE_W + BOTTLE_GAP),
        y: SHELF_Y + 40 + BOTTLE_H / 2,
    }));
}

/** Total shelf content width (used for scroll clamping). */
export function shelfContentWidth(count: number): number {
    return SHELF_SCROLL_BTN_W * 2 + BOTTLE_GAP * 3 + count * (BOTTLE_W + BOTTLE_GAP);
}

// ── Drawing helpers ────────────────────────────────────────

export function drawShelfBackground(ctx: CanvasRenderingContext2D, _scrollX: number, visibleWidth: number) {
    ctx.save();

    // Outer shadow
    ctx.shadowColor = "rgba(0,0,0,0.08)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;

    // Shelf panel with warm wood gradient
    const grad = ctx.createLinearGradient(0, SHELF_Y, 0, SHELF_Y + SHELF_H);
    grad.addColorStop(0, "#f5ebe0");
    grad.addColorStop(0.3, "#eddfcc");
    grad.addColorStop(0.7, "#dbc9ab");
    grad.addColorStop(1, "#c9b18e");
    ctx.fillStyle = grad;
    roundRect(ctx, 24, SHELF_Y, visibleWidth - 48, SHELF_H, 14);
    ctx.fill();

    ctx.shadowColor = "transparent";

    // Shelf planks (horizontal lines)
    ctx.strokeStyle = "rgba(139,115,85,0.12)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
        const y = SHELF_Y + (SHELF_H / 3) * i;
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(visibleWidth - 40, y);
        ctx.stroke();
    }

    // Bottom shelf ledge
    ctx.fillStyle = "rgba(139,115,85,0.15)";
    roundRect(ctx, 28, SHELF_Y + SHELF_H - 8, visibleWidth - 56, 8, 4);
    ctx.fill();

    // Inner border
    ctx.strokeStyle = "rgba(139,115,85,0.18)";
    ctx.lineWidth = 1;
    roundRect(ctx, 24, SHELF_Y, visibleWidth - 48, SHELF_H, 14);
    ctx.stroke();

    ctx.restore();
}

export function drawBottle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    shortLabel: string,
    isHighlighted: boolean,
    alpha: number = 1
) {
    ctx.save();
    ctx.globalAlpha = alpha;

    const bx = x - BOTTLE_W / 2;
    const by = y - BOTTLE_H / 2;
    const bodyH = BOTTLE_H * 0.68;
    const neckH = BOTTLE_H * 0.32;
    const neckW = BOTTLE_W * 0.32;

    // Drop shadow
    if (isHighlighted) {
        ctx.shadowColor = "rgba(14,165,233,0.35)";
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 4;
    } else {
        ctx.shadowColor = "rgba(0,0,0,0.12)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;
    }

    // Body — glass gradient
    const bodyGrad = ctx.createLinearGradient(bx, by + neckH, bx + BOTTLE_W, by + neckH + bodyH);
    bodyGrad.addColorStop(0, lightenColor(color, 0.2));
    bodyGrad.addColorStop(0.5, color);
    bodyGrad.addColorStop(1, darkenColor(color, 0.15));
    ctx.fillStyle = bodyGrad;
    roundRect(ctx, bx, by + neckH, BOTTLE_W, bodyH, 8);
    ctx.fill();

    ctx.shadowColor = "transparent";

    // Neck
    const neckX = x - neckW / 2;
    const neckGrad = ctx.createLinearGradient(neckX, by, neckX + neckW, by + neckH);
    neckGrad.addColorStop(0, lightenColor(color, 0.15));
    neckGrad.addColorStop(1, color);
    ctx.fillStyle = neckGrad;
    roundRect(ctx, neckX, by + 6, neckW, neckH, 4);
    ctx.fill();

    // Cap
    const capGrad = ctx.createLinearGradient(neckX - 3, by, neckX - 3, by + 10);
    capGrad.addColorStop(0, "#64748b");
    capGrad.addColorStop(1, "#334155");
    ctx.fillStyle = capGrad;
    roundRect(ctx, neckX - 3, by, neckW + 6, 10, 4);
    ctx.fill();

    // Glass shine (left highlight)
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    roundRect(ctx, bx + 4, by + neckH + 5, 5, bodyH - 14, 3);
    ctx.fill();

    // Glass shine (top right highlight)
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    roundRect(ctx, bx + BOTTLE_W - 10, by + neckH + 8, 4, bodyH * 0.4, 2);
    ctx.fill();

    // Liquid fill (lower 50% of body) — darker shade
    const liquidH = bodyH * 0.5;
    const liquidY = by + neckH + bodyH - liquidH;
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillStyle = darkenColor(color, 0.2);
    roundRect(ctx, bx + 3, liquidY, BOTTLE_W - 6, liquidH - 4, 6);
    ctx.fill();
    ctx.globalAlpha = alpha;

    // Label background (small white strip)
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    const lblH = 16;
    const lblY = by + neckH + bodyH / 2 - lblH / 2 + 2;
    roundRect(ctx, bx + 5, lblY, BOTTLE_W - 10, lblH, 3);
    ctx.fill();

    // Label text
    ctx.fillStyle = "#1e293b";
    ctx.font = BOTTLE_LABEL_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(shortLabel, x, lblY + lblH / 2, BOTTLE_W - 14);

    // Highlight ring
    if (isHighlighted) {
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        roundRect(ctx, bx - 3, by - 2, BOTTLE_W + 6, BOTTLE_H + 4, 10);
        ctx.stroke();
    }

    ctx.restore();
}

export function drawBeaker(
    ctx: CanvasRenderingContext2D,
    liquidColor: string,
    liquidLevel: number,
    opacity: number = 0.85
) {
    ctx.save();
    const bx = BEAKER_X - BEAKER_W / 2;
    const by = BEAKER_Y - BEAKER_H / 2;

    // Outer shadow
    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 6;

    // Beaker body — visible glass
    const glassGrad = ctx.createLinearGradient(bx, by, bx + BEAKER_W, by + BEAKER_H);
    glassGrad.addColorStop(0, "rgba(241,245,249,0.65)");
    glassGrad.addColorStop(0.5, "rgba(226,232,240,0.55)");
    glassGrad.addColorStop(1, "rgba(203,213,225,0.45)");
    ctx.fillStyle = glassGrad;
    roundRect(ctx, bx, by + BEAKER_RIM_H, BEAKER_W, BEAKER_H - BEAKER_RIM_H, BEAKER_CORNER);
    ctx.fill();

    ctx.shadowColor = "transparent";

    // Body outline
    ctx.strokeStyle = "rgba(100,116,139,0.45)";
    ctx.lineWidth = 2.5;
    roundRect(ctx, bx, by + BEAKER_RIM_H, BEAKER_W, BEAKER_H - BEAKER_RIM_H, BEAKER_CORNER);
    ctx.stroke();

    // Rim / lip
    const rimGrad = ctx.createLinearGradient(bx - 6, by, bx - 6, by + BEAKER_RIM_H);
    rimGrad.addColorStop(0, "rgba(226,232,240,0.9)");
    rimGrad.addColorStop(1, "rgba(203,213,225,0.7)");
    ctx.fillStyle = rimGrad;
    roundRect(ctx, bx - 6, by, BEAKER_W + 12, BEAKER_RIM_H, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(100,116,139,0.35)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx - 6, by, BEAKER_W + 12, BEAKER_RIM_H, 6);
    ctx.stroke();

    // Spout
    ctx.fillStyle = "rgba(203,213,225,0.7)";
    ctx.beginPath();
    ctx.moveTo(bx - 6, by + 5);
    ctx.lineTo(bx - 18, by - 6);
    ctx.lineTo(bx + 8, by + 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(100,116,139,0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Measurement lines
    ctx.strokeStyle = "rgba(100,116,139,0.25)";
    ctx.lineWidth = 1;
    ctx.font = "8px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(100,116,139,0.3)";
    ctx.textAlign = "left";
    const innerH = BEAKER_H - BEAKER_RIM_H - BEAKER_CORNER;
    for (let i = 1; i <= 4; i++) {
        const lineY = by + BEAKER_RIM_H + BEAKER_CORNER / 2 + (innerH / 5) * i;
        ctx.beginPath();
        ctx.moveTo(bx + 8, lineY);
        ctx.lineTo(bx + 30, lineY);
        ctx.stroke();
        ctx.fillText(`${(5 - i) * 50}`, bx + 10, lineY - 3);
    }

    // Liquid fill
    if (liquidLevel > 0) {
        const maxLiquidH = BEAKER_H - BEAKER_RIM_H - 8;
        const liqH = maxLiquidH * Math.min(liquidLevel, 1);
        const liqY = by + BEAKER_H - liqH;

        ctx.globalAlpha = opacity;

        // Liquid gradient
        const liqGrad = ctx.createLinearGradient(bx, liqY, bx, by + BEAKER_H);
        liqGrad.addColorStop(0, lightenColor(liquidColor, 0.1));
        liqGrad.addColorStop(1, darkenColor(liquidColor, 0.05));
        ctx.fillStyle = liqGrad;
        roundRect(ctx, bx + 4, liqY, BEAKER_W - 8, liqH - BEAKER_CORNER + 6, BEAKER_CORNER - 6);
        ctx.fill();

        // Surface line
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx + 10, liqY + 1);
        ctx.lineTo(bx + BEAKER_W - 10, liqY + 1);
        ctx.stroke();

        // Meniscus (curved surface)
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx + 6, liqY + 3);
        ctx.quadraticCurveTo(bx + BEAKER_W / 2, liqY - 2, bx + BEAKER_W - 6, liqY + 3);
        ctx.stroke();

        ctx.globalAlpha = 1;
    }

    // Glass shine — left edge
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(bx + BEAKER_W - 12, by + BEAKER_RIM_H + 12, 4, BEAKER_H - BEAKER_RIM_H - 36);

    // Glass shine — subtle
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(ctx, bx + 6, by + BEAKER_RIM_H + 8, 8, BEAKER_H - BEAKER_RIM_H - 30, 4);
    ctx.fill();

    ctx.restore();
}

export function drawLabBench(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    const benchY = BEAKER_Y + BEAKER_H / 2 + 24;

    // Bench surface — richer wood
    const grad = ctx.createLinearGradient(0, benchY, 0, height);
    grad.addColorStop(0, "#a08060");
    grad.addColorStop(0.04, "#8b6e50");
    grad.addColorStop(0.2, "#7a5f42");
    grad.addColorStop(0.6, "#6b4f36");
    grad.addColorStop(1, "#5a4230");
    ctx.fillStyle = grad;
    ctx.fillRect(0, benchY, width, height - benchY);

    // Top edge highlight
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(0, benchY, width, 2);

    // Edge shadow
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, benchY + 2, width, 3);

    // Wood grain
    ctx.strokeStyle = "rgba(0,0,0,0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
        const gy = benchY + 12 + i * 12 + Math.sin(i * 1.5) * 3;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        // Slightly curved grain
        ctx.quadraticCurveTo(width / 2, gy + Math.sin(i) * 4, width, gy);
        ctx.stroke();
    }

    // Knot (decorative)
    ctx.fillStyle = "rgba(90,66,48,0.15)";
    ctx.beginPath();
    ctx.ellipse(width * 0.7, benchY + 40, 12, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

export function drawDropZoneHighlight(ctx: CanvasRenderingContext2D, active: boolean) {
    if (!active) return;
    ctx.save();

    // Glowing dashed border
    ctx.strokeStyle = "rgba(2,132,199,0.45)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 5]);
    roundRect(ctx, DROP_ZONE.x, DROP_ZONE.y, DROP_ZONE.w, DROP_ZONE.h, 18);
    ctx.stroke();

    // Soft fill
    const grd = ctx.createRadialGradient(
        DROP_ZONE.x + DROP_ZONE.w / 2, DROP_ZONE.y + DROP_ZONE.h / 2, 20,
        DROP_ZONE.x + DROP_ZONE.w / 2, DROP_ZONE.y + DROP_ZONE.h / 2, DROP_ZONE.w / 2
    );
    grd.addColorStop(0, "rgba(2,132,199,0.08)");
    grd.addColorStop(1, "rgba(2,132,199,0.02)");
    ctx.fillStyle = grd;
    roundRect(ctx, DROP_ZONE.x, DROP_ZONE.y, DROP_ZONE.w, DROP_ZONE.h, 18);
    ctx.fill();

    ctx.restore();
}

export function drawScrollArrow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    direction: "left" | "right",
    hovered: boolean
) {
    ctx.save();
    const r = 16;

    // Background circle
    const bgGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
    if (hovered) {
        bgGrad.addColorStop(0, "rgba(14,165,233,0.2)");
        bgGrad.addColorStop(1, "rgba(14,165,233,0.08)");
    } else {
        bgGrad.addColorStop(0, "rgba(148,163,184,0.15)");
        bgGrad.addColorStop(1, "rgba(148,163,184,0.05)");
    }
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = hovered ? "rgba(2,132,199,0.4)" : "rgba(148,163,184,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Arrow
    ctx.strokeStyle = hovered ? "#0284c7" : "#94a3b8";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (direction === "left") {
        ctx.moveTo(x + 4, y - 7);
        ctx.lineTo(x - 4, y);
        ctx.lineTo(x + 4, y + 7);
    } else {
        ctx.moveTo(x - 4, y - 7);
        ctx.lineTo(x + 4, y);
        ctx.lineTo(x - 4, y + 7);
    }
    ctx.stroke();
    ctx.restore();
}

// ── Colour utilities ───────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace("#", "");
    return [
        parseInt(h.substring(0, 2), 16),
        parseInt(h.substring(2, 4), 16),
        parseInt(h.substring(4, 6), 16),
    ];
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("");
}

function lightenColor(hex: string, amount: number): string {
    const [r, g, b] = hexToRgb(hex);
    return rgbToHex(
        r + (255 - r) * amount,
        g + (255 - g) * amount,
        b + (255 - b) * amount,
    );
}

function darkenColor(hex: string, amount: number): string {
    const [r, g, b] = hexToRgb(hex);
    return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

// ── Utility: rounded rectangle ─────────────────────────────
function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
