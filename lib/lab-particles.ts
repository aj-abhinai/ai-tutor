/**
 * Lab Particles — Lightweight particle system for canvas-drawn
 * reaction effects: bubbles, precipitate, smoke, heat glow.
 */

import { BEAKER_X, BEAKER_Y, BEAKER_W, BEAKER_H, BEAKER_RIM_H, BEAKER_CORNER } from "./lab-sprites";

export type ParticleKind = "bubble" | "precipitate" | "smoke" | "heat-glow";

export interface Particle {
    kind: ParticleKind;
    x: number;
    y: number;
    vx: number;
    vy: number;
    r: number;         // radius
    life: number;       // 0–1, decreasing
    decay: number;      // life decrease per frame
    color: string;
    opacity: number;
}

/** Active particle pool */
let particles: Particle[] = [];

// ── Beaker inner bounds ────────────────────────────────────
const innerLeft = BEAKER_X - BEAKER_W / 2 + 6;
const innerRight = BEAKER_X + BEAKER_W / 2 - 6;
const innerTop = BEAKER_Y - BEAKER_H / 2 + BEAKER_RIM_H + 8;
const innerBottom = BEAKER_Y + BEAKER_H / 2 - BEAKER_CORNER + 4;

function randomBetween(a: number, b: number): number {
    return a + Math.random() * (b - a);
}

// ── Spawn helpers ──────────────────────────────────────────

export function spawnBubbles(count: number = 3) {
    for (let i = 0; i < count; i++) {
        particles.push({
            kind: "bubble",
            x: randomBetween(innerLeft + 10, innerRight - 10),
            y: innerBottom - 4,
            vx: randomBetween(-0.3, 0.3),
            vy: randomBetween(-1.2, -0.5),
            r: randomBetween(2.5, 5),
            life: 1,
            decay: randomBetween(0.008, 0.016),
            color: "rgba(255,255,255,0.7)",
            opacity: 1,
        });
    }
}

export function spawnPrecipitate(count: number = 2) {
    for (let i = 0; i < count; i++) {
        particles.push({
            kind: "precipitate",
            x: randomBetween(innerLeft + 15, innerRight - 15),
            y: randomBetween(innerTop + 30, innerBottom - 30),
            vx: randomBetween(-0.15, 0.15),
            vy: randomBetween(0.3, 0.8),
            r: randomBetween(2, 4),
            life: 1,
            decay: randomBetween(0.004, 0.008),
            color: "rgba(245,245,245,0.9)",
            opacity: 1,
        });
    }
}

export function spawnSmoke(count: number = 2) {
    const topCenter = BEAKER_X;
    const topY = BEAKER_Y - BEAKER_H / 2 + BEAKER_RIM_H - 2;
    for (let i = 0; i < count; i++) {
        particles.push({
            kind: "smoke",
            x: topCenter + randomBetween(-20, 20),
            y: topY,
            vx: randomBetween(-0.4, 0.4),
            vy: randomBetween(-1.0, -0.4),
            r: randomBetween(6, 14),
            life: 1,
            decay: randomBetween(0.01, 0.02),
            color: "rgba(148,163,184,0.25)",
            opacity: 0.6,
        });
    }
}

export function spawnHeatGlow(heat: "exothermic" | "endothermic") {
    const color = heat === "exothermic"
        ? "rgba(251,146,60,0.18)"
        : "rgba(96,165,250,0.15)";
    particles.push({
        kind: "heat-glow",
        x: BEAKER_X,
        y: BEAKER_Y,
        vx: 0,
        vy: 0,
        r: BEAKER_W / 2 + 10,
        life: 1,
        decay: 0.006,
        color,
        opacity: 0.5,
    });
}

// ── Pour stream particles ──────────────────────────────────

export function spawnPourStream(
    fromX: number,
    fromY: number,
    color: string,
    count: number = 4
) {
    const targetX = BEAKER_X;
    const targetY = BEAKER_Y - BEAKER_H / 2 + BEAKER_RIM_H;
    for (let i = 0; i < count; i++) {
        const t = i / count;
        particles.push({
            kind: "bubble", // reuse bubble kind but different visual
            x: fromX + (targetX - fromX) * t + randomBetween(-3, 3),
            y: fromY + (targetY - fromY) * t + randomBetween(-3, 3),
            vx: randomBetween(-0.2, 0.2),
            vy: randomBetween(0.5, 1.5),
            r: randomBetween(2, 3.5),
            life: 1,
            decay: 0.06,
            color,
            opacity: 0.7,
        });
    }
}

// ── Update & Draw ──────────────────────────────────────────

export function updateParticles() {
    for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.opacity = Math.max(0, p.life);

        // Bubbles: slight wobble
        if (p.kind === "bubble") {
            p.vx += randomBetween(-0.05, 0.05);
        }

        // Precipitate: settle at bottom
        if (p.kind === "precipitate" && p.y >= innerBottom - 6) {
            p.vy = 0;
            p.vx *= 0.9;
        }

        // Smoke: expand
        if (p.kind === "smoke") {
            p.r += 0.15;
        }

        // Heat glow: pulse
        if (p.kind === "heat-glow") {
            p.r += Math.sin(Date.now() * 0.005) * 0.3;
        }
    }

    // Remove dead particles
    particles = particles.filter(p => p.life > 0);
}

export function drawParticles(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of particles) {
        ctx.globalAlpha = p.opacity;

        if (p.kind === "heat-glow") {
            // Radial glow
            const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            grd.addColorStop(0, p.color);
            grd.addColorStop(1, "transparent");
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

export function clearParticles() {
    particles = [];
}

export function getParticleCount(): number {
    return particles.length;
}
