/* ─────────────────────────────────────────────────────────────────────────────
   Ultron — Agent Mark.
   The Teambridge AI agent's generative identity mark, ported from the "Ultron
   Motion Identity" canvas study. A small <canvas> that draws a 3D sphere of
   cells riding tilted rings (orbit), a connected presence sphere (circle), a
   radial spark (lines), and more. Used for the loaders (orbit) and identity
   slots (circle) in place of the generic AILoader.

   `tone="auto"` is the default — it follows the page theme: the light palette
   (dark-slate cells, glow off — pal('light')) on light surfaces, and the dark
   palette (glowing light cells — pal('dark')) on dark ones. The choice is made
   at draw time by sampling the resolved --color-bg-primary luminance off the
   canvas element, so it honours both the prefers-color-scheme media query and
   any manual .light/.dark override. Pass an explicit tone to force a palette.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react';

export type AgentMarkKind = 'orbit' | 'circle' | 'lines' | 'magnetic' | 'pulse' | 'bands';
/** `auto` (default) follows the page theme: the light palette (dark cells, no
 *  glow) on light surfaces, the dark palette (glowing light cells) on dark
 *  ones. The explicit tones force a fixed palette regardless of theme. */
export type AgentMarkTone = 'auto' | 'light' | 'dark' | 'onblack' | 'tint';
export type AgentMarkState = 'active' | 'idle' | 'static';

interface AgentMarkProps {
  /** Which mark to draw. `orbit` = processing/live, `circle` = presence/identity. */
  mark?: AgentMarkKind;
  /** Rendered px (square). */
  size?: number;
  /** Palette. `light` (default) = dark cells, no glow — for light surfaces. */
  tone?: AgentMarkTone;
  /** `active` animates, `idle` slows, `static` paints one frozen frame. */
  state?: AgentMarkState;
  /** Animation speed multiplier (0.4–2). */
  motionSpeed?: number;
  /** Accent for glow tones. */
  accent?: string;
  /** Overrides the mark's cell/core fill with any CSS color (hex, rgb(), or a
   *  `var(--token)`). Resolved to RGB for the canvas. Use to tint a mark to a
   *  semantic token — e.g. a settled case in `var(--color-content-disabled)`. */
  color?: string;
  /** Soft halo / drop-shadow behind the core (default true). Set false for dense
   *  nav rows where the glow muddies the mark against the row background. */
  coreHalo?: boolean;
  /** When true, the core blooms into a blurred warm→magenta→violet gradient
   *  instead of the mono fill — an alert state (e.g. a risk just detected). */
  coreGradient?: boolean;
  'aria-label'?: string;
  className?: string;
}

type Pal = { dot: string; core: string; accent: string; glow: boolean };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth01 = (x: number) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
// smaller marks need proportionally larger cells to stay legible
const cellK = (sz: number) => (sz >= 48 ? 1 : sz >= 32 ? 1.2 : sz >= 24 ? 1.5 : sz >= 20 ? 1.85 : 2.3);

// Deterministic pseudo-random in [0,1) — gives every particle a stable layout
// across frames and mounts (no Math.random), so the marks animate smoothly and
// paint identically every frame / on every instance.
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function hexRGB(hex: string) {
  const h = (hex || '#96B9FF').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
}

// Resolve any CSS color (hex, rgb(), or var(--token)) to an "r,g,b" string for
// the canvas. CSS variables are looked up off the element; the result is then
// normalised through the 2D context's color parser.
function cssToRGB(ctx: CanvasRenderingContext2D, el: HTMLElement, color: string): string {
  let value = color.trim();
  const varMatch = value.match(/var\(\s*(--[^,)]+)/);
  if (varMatch) value = getComputedStyle(el).getPropertyValue(varMatch[1]).trim() || value;
  if (value.startsWith('#')) return hexRGB(value);
  // Let the canvas normalise named/rgb()/hsl() colors, then pull the channels.
  ctx.fillStyle = '#000';
  ctx.fillStyle = value;
  const resolved = ctx.fillStyle as string;
  if (resolved.startsWith('#')) return hexRGB(resolved);
  const nums = resolved.match(/[\d.]+/g);
  return nums && nums.length >= 3 ? `${+nums[0]},${+nums[1]},${+nums[2]}` : '26,30,38';
}

// Watch the OS color-scheme preference so `auto` marks repaint when the theme
// flips. The actual light/dark decision is made at draw time by sampling the
// resolved surface token (which also honours manual .light/.dark overrides);
// this just supplies a re-render trigger.
function usePrefersDark(): boolean {
  const [dark, setDark] = useState(() => {
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; }
  });
  useEffect(() => {
    let mq: MediaQueryList;
    try { mq = window.matchMedia('(prefers-color-scheme: dark)'); } catch { return; }
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return dark;
}

// Relative luminance (0 dark → 1 light) of an "r,g,b" channel string.
function luminance(rgb: string): number {
  const [r, g, b] = rgb.split(',').map(Number);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function pal(tone: AgentMarkTone, accent: string): Pal {
  if (tone === 'light') return { dot: '26,30,38', core: '34,40,52', accent: '68,108,255', glow: false };
  if (tone === 'onblack') return { dot: '237,243,252', core: '255,255,255', accent, glow: true };
  if (tone === 'tint') return { dot: '233,240,255', core: '255,255,255', accent: '176,201,255', glow: true };
  return { dot: '228,238,252', core: '248,251,255', accent, glow: true };
}

interface Ctx { ctx: CanvasRenderingContext2D; w: number; h: number; dpr: number; size: number; state: AgentMarkState; coreHalo: boolean; alert?: number; }

// The alert palette. The core runs orange-red at the middle out to yellow at the
// edge (a hot sun). The cells/lines run the SAME red-orange → yellow sweep,
// mapped by radial distance so the whole mark shares one gradient — but a few
// shades darker, so the structure reads against the brighter core.
const ALERT_CORE = ['234,54,38', '246,112,44', '252,172,54', '255,212,76']; // center (orange-red) → edge (yellow)
const ALERT_DOT_A = '176,58,32';  // cells/lines, near core: deep red-orange
const ALERT_DOT_B = '198,158,52'; // cells/lines, at rim: deep yellow

// Linear blend of two "r,g,b" channel strings → an "r,g,b" string.
function mixRGB(a: string, b: string, t: number): string {
  const pa = a.split(',').map(Number), pb = b.split(',').map(Number);
  return pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',');
}

function drawCore(e: Ctx, T: number, P: Pal) {
  const { ctx, w, h } = e, cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.39;
  const coreR = R * 0.2 * (0.9 + 0.14 * Math.sin(T * 1.5));
  const small = e.size < 24;
  // Eased alert amount (0 → mono, 1 → ember). Everything below interpolates by
  // it, so the core MORPHS in place (single draw) rather than crossfading two
  // layers — which keeps the mono→orange transition smooth and flicker-free.
  const alert = clamp(e.alert ?? 0, 0, 1);
  const lerp = (a: number, b: number) => a + (b - a) * alert;
  const pulse = 0.85 + 0.15 * Math.sin(T * 2.2);

  // glow / drop-shadow halo — removed at icon sizes under 24px, or when the
  // caller opts out (coreHalo=false) for dense surfaces like nav rows. Its stops
  // blend from the mono core color toward the ember orange as the alert rises.
  if (!small && e.coreHalo) {
    ctx.save();
    if (P.glow && alert < 1) {
      // dark-surface glow halo (alert never fires here, so fade it with 1-alert)
      ctx.globalAlpha = 1 - alert;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3);
      cg.addColorStop(0, 'rgba(' + P.core + ',0.55)');
      cg.addColorStop(1, 'rgba(' + P.accent + ',0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, coreR * 3, 0, 6.2832); ctx.fill();
    } else if (!P.glow) {
      const hr = coreR * lerp(3.2, 3);
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, hr);
      cg.addColorStop(0, 'rgba(' + mixRGB(P.core, ALERT_CORE[1], alert) + ',' + lerp(0.34, 0.85 * pulse) + ')');
      cg.addColorStop(0.5, 'rgba(' + mixRGB(P.core, ALERT_CORE[2], alert) + ',' + lerp(0.13, 0.42 * pulse) + ')');
      cg.addColorStop(1, 'rgba(' + mixRGB(P.core, ALERT_CORE[3], alert) + ',0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, hr, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  }

  // Core orb — one blurred radial gradient whose stops + radius + blur all
  // interpolate from the mono fill (flat P.core) to the sun gradient. Centered
  // and lightly blurred when lit, so the orange-red middle and yellow rim read
  // as distinct bands rather than washing into a uniform orange.
  const monoA = P.glow ? 1 : 0.95;
  const cr = Math.max(0.8, coreR * lerp(1, 1.5));
  const off = coreR * 0.1 * alert; // near-centered (sun), with a faint lift
  ctx.save();
  ctx.filter = 'blur(' + Math.max(0.4, coreR * lerp(0.22, 0.3)).toFixed(2) + 'px)';
  const cg = ctx.createRadialGradient(cx - off, cy - off, 0, cx, cy, cr);
  cg.addColorStop(0, 'rgba(' + mixRGB(P.core, ALERT_CORE[0], alert) + ',' + lerp(monoA, 1) + ')');
  cg.addColorStop(0.5, 'rgba(' + mixRGB(P.core, ALERT_CORE[1], alert) + ',' + lerp(monoA, 1) + ')');
  cg.addColorStop(0.82, 'rgba(' + mixRGB(P.core, ALERT_CORE[2], alert) + ',' + lerp(monoA, 0.97) + ')');
  cg.addColorStop(1, 'rgba(' + mixRGB(P.core, ALERT_CORE[3], alert) + ',' + lerp(monoA, 0.72) + ')');
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 6.2832); ctx.fill();
  ctx.restore();
}

// Orbit — processing / working: cells ride tilted great-circle rings around a
// luminous core, each trailing a long comet tail that wraps most of its ring.
// The crisp, low-element UI-mark form (per the "Agent marks for UI" spec): two
// counter-rotating rings, no background swarm or guide strokes — so it reads as
// a clean orbit at icon scale and a calm globe at hero scale. Palette-driven
// (P), so it honours light/dark + color overrides.
function drawOrbit(e: Ctx, T: number, P: Pal) {
  const { ctx, w: W, h: H } = e, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.39;
  const active = e.state !== 'idle';
  // each ring is a great circle whose plane is tilted (inc) and spun about Y (az)
  const ringDefs: [number, number][] = [[1.35, 0.3], [1.05, 2.4]];
  const yaw = T * (active ? 0.5 : 0.16);            // the whole globe spins
  const tilt = 0.42, ct = Math.cos(tilt), st = Math.sin(tilt);
  const cy0 = Math.cos(yaw), sy0 = Math.sin(yaw);
  const RR = R * 0.96;
  // project a globe-local unit point: spin about Y, then tilt about X, perspective
  const proj = (x: number, y: number, z: number) => {
    const X = x * cy0 + z * sy0, Z = -x * sy0 + z * cy0, Y = y;
    const Y2 = Y * ct - Z * st, Z2 = Y * st + Z * ct;
    const d = (Z2 + 1) / 2, persp = 0.82 + 0.18 * d;
    return { x: cx + X * RR * persp, y: cy + Y2 * RR * persp, d };
  };
  const ringPt = (theta: number, inc: number, az: number): [number, number, number] => {
    const x = Math.cos(theta), y = Math.sin(theta) * Math.cos(inc), z = Math.sin(theta) * Math.sin(inc);
    return [x * Math.cos(az) + z * Math.sin(az), y, -x * Math.sin(az) + z * Math.cos(az)];
  };

  ctx.save();
  ctx.globalCompositeOperation = P.glow ? 'lighter' : 'source-over';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Ring guides are drawn AS each cell's fading trail (100% at the cell → 0%
  // around the ring), so no separate guide stroke is needed.
  const SEG = e.size >= 24 ? 64 : 40;
  const cspd = active ? 0.9 : 0.3;                  // cells circle clockwise
  const NT = SEG;
  const span = 5.6;                                 // long comet tail wrapping most of the ring

  type Head = { ptOf: (a: number) => { x: number; y: number; d: number }; head: number; dir: number; hp: { x: number; y: number; d: number } };
  const heads: Head[] = [];
  for (let i = 0; i < ringDefs.length; i++) {
    const inc = ringDefs[i][0], az = ringDefs[i][1];
    const ptOf = (ang: number) => { const p3 = ringPt(ang, inc, az); return proj(p3[0], p3[1], p3[2]); };
    const dir = i % 2 ? 1 : -1;                     // adjacent rings circle opposite ways
    const head = i * 2.0 + dir * T * cspd;
    heads.push({ ptOf, head, dir, hp: ptOf(head) });
  }
  heads.sort((a, b) => a.hp.d - b.hp.d);            // far → near
  for (const h of heads) {
    const lw = Math.max(1.2, R * 0.05) * (0.75 + 0.35 * h.hp.d);
    // Fade along ARC LENGTH so the tail wraps most of the ring and still tapers
    // smoothly. Drawn source-over with butt caps + shared endpoints, so the fine
    // segments meet exactly — no beading, no jumping.
    const base = 0.66 * (0.45 + 0.55 * h.hp.d);
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'butt';
    ctx.lineWidth = lw;
    let pPrev = h.ptOf(h.head);
    for (let s = 1; s <= NT; s++) {
      const f = s / NT;                             // 0 at head .. 1 at tail
      const fade = 1 - f;
      const la = base * fade * fade;                // smooth quadratic falloff by arc length
      const p = h.ptOf(h.head - h.dir * f * span);
      if (la > 0.004) {
        ctx.strokeStyle = 'rgba(' + P.dot + ',' + la + ')';
        ctx.beginPath(); ctx.moveTo(pPrev.x, pPrev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      pPrev = p;
    }
    ctx.restore();
    const r = Math.max(0.9, R * 0.062 * cellK(e.size) * (0.65 + 0.5 * h.hp.d));
    const al = 0.45 + 0.55 * h.hp.d;
    if (P.glow) {
      const bg = ctx.createRadialGradient(h.hp.x, h.hp.y, 0, h.hp.x, h.hp.y, r * 4.5);
      bg.addColorStop(0, 'rgba(' + P.accent + ',' + (0.3 * al) + ')');
      bg.addColorStop(1, 'rgba(' + P.accent + ',0)');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(h.hp.x, h.hp.y, r * 4.5, 0, 6.2832); ctx.fill();
    }
    ctx.fillStyle = 'rgba(' + P.dot + ',' + Math.min(1, al + 0.1) + ')';
    ctx.beginPath(); ctx.arc(h.hp.x, h.hp.y, r, 0, 6.2832); ctx.fill();
  }

  drawCore(e, T, P);
  ctx.restore();
}

function drawCircle(e: Ctx, T: number, P: Pal) {
  const { ctx, w, h, dpr } = e, cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.39;
  const active = e.state !== 'idle';
  // Cells + links run the core's red-orange→yellow sweep, keyed to each point's
  // radial distance from center (near core → red-orange, at rim → yellow), in a
  // darker scale. 0 alert → palette mono. `dotAt` returns the "r,g,b" for a point.
  const alertAmt = clamp(e.alert ?? 0, 0, 1);
  const rr = R * 0.82;
  const dotAt = (px: number, py: number) =>
    mixRGB(P.dot, mixRGB(ALERT_DOT_A, ALERT_DOT_B, clamp(Math.hypot(px - cx, py - cy) / rr, 0, 1)), alertAmt);
  // Hero scale (the Live-landing identity) paints the full, lush Circle: a dense
  // cell sphere with extra link streams, an atmospheric halo, and an orbiting
  // particle swarm. Smaller (nav) sizes keep the clean, lighter mark unchanged.
  const hero = e.size >= 120;
  const N = hero ? 22 : e.size >= 32 ? 10 : (e.size >= 20 ? 7 : 5);
  const yaw = active ? T * 0.55 : T * 0.22, cyaw = Math.cos(yaw), syaw = Math.sin(yaw);
  const tilt = 0.42, ct = Math.cos(tilt), stt = Math.sin(tilt);
  ctx.save();
  ctx.globalCompositeOperation = P.glow ? 'lighter' : 'source-over';
  // Faint atmospheric halo behind the sphere (glow palettes / dark surfaces only).
  if (hero && P.glow) {
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.02);
    halo.addColorStop(0, 'rgba(' + P.accent + ',0.10)');
    halo.addColorStop(1, 'rgba(' + P.accent + ',0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.02, 0, 6.2832); ctx.fill();
  }
  const cells: { x: number; y: number; d: number; k: number; vec: number[] }[] = [];
  for (let k = 0; k < N; k++) {
    const yy = 1 - (k + 0.5) / N * 2, ringr = Math.sqrt(Math.max(0, 1 - yy * yy)), phi = k * 2.39996;
    const px = Math.cos(phi) * ringr, py = yy, pz = Math.sin(phi) * ringr;
    const X = px * cyaw + pz * syaw, Zr = -px * syaw + pz * cyaw;
    const Y2 = py * ct - Zr * stt, Z2 = py * stt + Zr * ct;
    const d = (Z2 + 1) / 2, persp = 0.82 + 0.18 * d;
    cells.push({ x: cx + X * rr * persp, y: cy + Y2 * rr * persp, d, k, vec: [X, Y2, Z2] });
  }
  cells.sort((p, q) => p.d - q.d);
  const projV = (v: number[]) => { const dd = (v[2] + 1) / 2, ps = 0.82 + 0.18 * dd; return { x: cx + v[0] * rr * ps, y: cy + v[1] * rr * ps, d: dd }; };
  const slerp = (a: number[], b: number[], tt: number) => {
    let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; dot = clamp(dot, -1, 1);
    const om = Math.acos(dot);
    if (om < 1e-3) return [a[0], a[1], a[2]];
    const s = Math.sin(om), w0 = Math.sin((1 - tt) * om) / s, w1 = Math.sin(tt * om) / s;
    return [a[0] * w0 + b[0] * w1, a[1] * w0 + b[1] * w1, a[2] * w0 + b[2] * w1];
  };
  const byK: Record<number, { x: number; y: number; d: number; k: number; vec: number[] }> = {};
  for (const c of cells) byK[c.k] = c;
  const hopRate = active ? 1.4 : 0.5;
  const phase = T * hopRate, hopN = Math.floor(phase), frac = phase - hopN;
  const VIS = 5, ARC = 12;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const streams = hero
    ? [{ seed: 1.7 }, { seed: 9.3 }, { seed: 21.5 }, { seed: 34.8 }, { seed: 48.2 }]
    : [{ seed: 1.7 }, { seed: 9.3 }, { seed: 21.5 }, { seed: 34.8 }];
  for (const stream of streams) {
    const ix = (i: number) => { const x = Math.sin(i * 12.9898 + stream.seed) * 43758.5453; return Math.floor((x - Math.floor(x)) * N); };
    const nodeAt = (i: number) => { let a = ix(i); if (a === ix(i - 1)) a = (a + 1) % N; return byK[a]; };
    for (let a = VIS - 1; a >= 0; a--) {
      const i = hopN - a; if (i < 0) continue;
      const A = nodeAt(i), Bn = nodeAt(i + 1); if (!A || !Bn || A === Bn) continue;
      const p = (a === 0) ? frac : 1;
      const tip = projV(slerp(A.vec, Bn.vec, p));
      const dmid = (A.d + tip.d) / 2;
      const ageFade = (a === 0) ? 1 : clamp(1 - (a - 1 + frac) / (VIS - 1), 0, 1);
      const la = (P.glow ? 0.6 : 0.72) * ageFade * (0.4 + 0.6 * dmid);
      if (la < 0.02) continue;
      const lg = ctx.createLinearGradient(A.x, A.y, tip.x, tip.y);
      lg.addColorStop(0, 'rgba(' + dotAt(A.x, A.y) + ',0)');
      lg.addColorStop(1, 'rgba(' + dotAt(tip.x, tip.y) + ',' + la + ')');
      ctx.strokeStyle = lg;
      // Hero matches the identity file's hairline links (R*0.018); nav keeps its
      // heavier line so the mark still reads at small sizes.
      ctx.lineWidth = (hero ? Math.max(1.1 * dpr, R * 0.018) : Math.max(1.2, R * 0.045)) * (0.7 + 0.4 * dmid);
      ctx.beginPath();
      for (let s = 0; s <= ARC; s++) {
        const v = projV(slerp(A.vec, Bn.vec, p * (s / ARC)));
        if (s === 0) ctx.moveTo(v.x, v.y); else ctx.lineTo(v.x, v.y);
      }
      ctx.stroke();
    }
  }
  for (const c of cells) {
    const tw = 0.5 + 0.5 * Math.sin(T * 2.0 - c.k * 0.9);
    const b = (0.18 + 0.82 * c.d) * (0.62 + 0.38 * tw);
    // Hero matches the identity file's small dpr-based cells; nav keeps its
    // larger R-relative dots so the sphere reads at small sizes.
    const r = hero
      ? Math.max(0.5, (0.9 + 0.9 * c.d) * dpr * (0.85 + 0.15 * tw))
      : R * 0.058 * cellK(e.size) * (0.6 + 0.5 * c.d);
    if (P.glow) {
      const bloomR = r * 4;
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, bloomR);
      g.addColorStop(0, 'rgba(' + P.accent + ',' + (0.24 * b) + ')');
      g.addColorStop(1, 'rgba(' + P.accent + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, bloomR, 0, 6.2832); ctx.fill();
    }
    ctx.fillStyle = 'rgba(' + dotAt(c.x, c.y) + ',' + (0.32 + 0.68 * b) + ')';
    ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(0.9, r), 0, 6.2832); ctx.fill();
  }

  // Orbiting particle swarm — the Circle identity's signature drift of cells
  // around the core. Hero only; deterministic (hash, no RNG) so it animates
  // smoothly and paints identically across frames and instances.
  if (hero) {
    const sw = active ? 1 : 0.4;
    for (let k = 0; k < 46; k++) {
      const dir = hash(k * 5.1) < 0.5 ? -1 : 1;
      const ang = hash(k * 1.7) * 6.2832 + T * (0.3 + hash(k * 3.1) * 0.6) * dir * sw;
      const wob = R * (0.04 + 0.05 * hash(k * 4.7)) * Math.sin(T * (0.8 + hash(k * 6) * 1.0) + hash(k * 7) * 6.28);
      const off = R * (0.5 + hash(k * 2.3) * 0.5) + wob;
      const x = cx + Math.cos(ang) * off, y = cy + Math.sin(ang) * off;
      const tw = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(T * (1.4 + hash(k) * 2) + hash(k * 2) * 6.28));
      const r = Math.max(0.5, (0.4 + hash(k * 8) * 1.0) * dpr * (0.55 + 0.6 * tw));
      if (P.glow) {
        const bloomR = r * 6;
        const bg = ctx.createRadialGradient(x, y, 0, x, y, bloomR);
        bg.addColorStop(0, 'rgba(' + P.accent + ',' + (tw * 0.18) + ')');
        bg.addColorStop(1, 'rgba(' + P.accent + ',0)');
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(x, y, bloomR, 0, 6.2832); ctx.fill();
      }
      ctx.fillStyle = 'rgba(' + dotAt(x, y) + ',' + (tw * (P.glow ? 0.8 : 0.42)) + ')';
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    }
  }

  drawCore(e, T, P);
  ctx.restore();
}

function drawLines(e: Ctx, T: number, P: Pal) {
  const { ctx, w, h, dpr } = e, cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.39;
  const active = e.state !== 'idle';
  const N = e.size >= 32 ? 11 : 7;
  const inner = R * 0.12, gap = R * 0.12;
  const breath = smooth01(0.5 + 0.5 * Math.sin(T * (active ? 1.0 : 0.55)));
  const ev = active ? (0.34 + 0.66 * breath) : (0.5 + 0.12 * breath);
  const lw = Math.max(1 * dpr, R * 0.052);
  const yaw = -T * (active ? 0.5 : 0.16), cyaw = Math.cos(yaw), syaw = Math.sin(yaw);
  const tilt = 0.42, ct = Math.cos(tilt), stt = Math.sin(tilt);
  ctx.save();
  ctx.globalCompositeOperation = P.glow ? 'lighter' : 'source-over';
  ctx.lineCap = 'round';
  const L = R * (0.52 + 0.44 * ev), Ls = Math.max(inner + lw, L - gap);
  const spokes: { x0: number; y0: number; x1: number; y1: number; cx2: number; cy2: number; d: number; shim: number }[] = [];
  for (let k = 0; k < N; k++) {
    const yy = 1 - (k + 0.5) / N * 2, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), phi = k * 2.39996;
    const dx = Math.cos(phi) * rr, dy = yy, dz = Math.sin(phi) * rr;
    const X = dx * cyaw + dz * syaw, Zr = -dx * syaw + dz * cyaw;
    const Y2 = dy * ct - Zr * stt, Z2 = dy * stt + Zr * ct;
    const d = (Z2 + 1) / 2, persp = 0.82 + 0.18 * d;
    const shim = 0.5 + 0.5 * Math.sin(T * 1.6 + k * 1.3);
    spokes.push({ x0: cx + X * inner * persp, y0: cy + Y2 * inner * persp, x1: cx + X * Ls * persp, y1: cy + Y2 * Ls * persp, cx2: cx + X * L * persp, cy2: cy + Y2 * L * persp, d, shim });
  }
  spokes.sort((a, b) => a.d - b.d);
  for (const s of spokes) {
    const la = (active ? (0.4 + 0.45 * ev) : 0.6) * (0.4 + 0.6 * s.d) * (0.78 + 0.22 * s.shim);
    const lg = ctx.createLinearGradient(s.x0, s.y0, s.x1, s.y1);
    lg.addColorStop(0, 'rgba(' + P.dot + ',' + la + ')');
    lg.addColorStop(1, 'rgba(' + P.accent + ',0)');
    ctx.strokeStyle = lg; ctx.lineWidth = lw * (0.7 + 0.5 * s.d);
    ctx.beginPath(); ctx.moveTo(s.x0, s.y0); ctx.lineTo(s.x1, s.y1); ctx.stroke();
    const tipR = Math.max(0.9, R * 0.058 * cellK(e.size) * (0.85 + 0.3 * ev) * (0.6 + 0.5 * s.d));
    if (P.glow) {
      const bg = ctx.createRadialGradient(s.cx2, s.cy2, 0, s.cx2, s.cy2, tipR * 5);
      bg.addColorStop(0, 'rgba(' + P.accent + ',' + (0.26 * la) + ')');
      bg.addColorStop(1, 'rgba(' + P.accent + ',0)');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(s.cx2, s.cy2, tipR * 5, 0, 6.2832); ctx.fill();
    }
    ctx.fillStyle = 'rgba(' + P.dot + ',' + Math.min(1, la + 0.1) + ')';
    ctx.beginPath(); ctx.arc(s.cx2, s.cy2, tipR, 0, 6.2832); ctx.fill();
  }
  drawCore(e, T, P);
  ctx.restore();
}

function drawMagnetic(e: Ctx, T: number, P: Pal) {
  const { ctx, w, h } = e, cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.39;
  const active = e.state !== 'idle';
  const N = e.size >= 32 ? 58 : (e.size >= 20 ? 32 : 18);
  const rr = R * 0.78;
  const yaw = active ? T * 0.5 : T * 0.2, cyaw = Math.cos(yaw), syaw = Math.sin(yaw);
  const tilt = 0.42, ct = Math.cos(tilt), stt = Math.sin(tilt);
  const sp = active ? 1 : 0.4;
  const mk = (th: number, ph: number) => [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
  const A = [mk(1.4 + 0.5 * Math.sin(T * 0.5 * sp), T * 0.6 * sp), mk(1.9 + 0.4 * Math.cos(T * 0.4 * sp), -T * 0.5 * sp + 2.0)];
  const sig = 0.36;
  ctx.save();
  ctx.globalCompositeOperation = P.glow ? 'lighter' : 'source-over';
  const dots: { x: number; y: number; d: number; inf: number }[] = [];
  for (let k = 0; k < N; k++) {
    const yy = 1 - (k + 0.5) / N * 2, ringr = Math.sqrt(Math.max(0, 1 - yy * yy)), phi = k * 2.39996;
    const px = Math.cos(phi) * ringr, py = yy, pz = Math.sin(phi) * ringr;
    let inf = 0;
    for (const at of A) { const dx = px - at[0], dy = py - at[1], dz = pz - at[2]; inf += Math.exp(-(dx * dx + dy * dy + dz * dz) / (2 * sig * sig)); }
    inf = clamp(inf, 0, 1);
    const X = px * cyaw + pz * syaw, Zr = -px * syaw + pz * cyaw;
    const Y2 = py * ct - Zr * stt, Z2 = py * stt + Zr * ct;
    const d = (Z2 + 1) / 2, persp = 0.82 + 0.18 * d;
    dots.push({ x: cx + X * rr * persp, y: cy + Y2 * rr * persp, d, inf });
  }
  dots.sort((p, q) => p.d - q.d);
  for (const dt of dots) {
    const ex = smooth01(dt.inf);
    const r = Math.max(0.6, R * (0.05 + 0.06 * ex) * cellK(e.size) * (0.55 + 0.5 * dt.d));
    const al = (0.16 + 0.84 * dt.d) * (0.45 + 0.55 * ex);
    const f = Math.abs(2 * dt.d - 1);
    const ang = Math.atan2(dt.y - cy, dt.x - cx);
    ctx.fillStyle = 'rgba(' + P.dot + ',' + al + ')';
    ctx.beginPath();
    ctx.ellipse(dt.x, dt.y, Math.max(0.35, r * f), r, ang, 0, 6.2832);
    ctx.fill();
  }
  drawCore(e, T, P);
  ctx.restore();
}

// Pulse — waiting / ready: only the breathing core, no cells or trails.
function drawPulse(e: Ctx, T: number, P: Pal) {
  drawCore(e, T, P);
}

const DRAW: Record<AgentMarkKind, (e: Ctx, T: number, P: Pal) => void> = {
  orbit: drawOrbit, circle: drawCircle, lines: drawLines, magnetic: drawMagnetic, pulse: drawPulse, bands: drawCircle,
};

export function AgentMark({
  mark = 'orbit', size = 16, tone = 'auto', state = 'active',
  motionSpeed = 1, accent = '#96B9FF', color, coreHalo = true, coreGradient = false, className, 'aria-label': ariaLabel,
}: AgentMarkProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  // Repaint trigger when the OS theme flips (the light/dark choice itself is
  // resolved below by sampling the surface the mark actually sits on).
  const prefersDark = usePrefersDark();
  // Eased alert amount (0 → mono, 1 → colored). The paint loop glides it toward
  // its target each frame, so toggling `coreGradient` fades the colors in/out.
  const alertRef = useRef(0);
  const alertTargetRef = useRef(0);
  alertTargetRef.current = coreGradient ? 1 : 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.max(2, Math.round(size * dpr)), H = W;
    el.width = W; el.height = H;
    const e: Ctx = { ctx, w: W, h: H, dpr, size, state, coreHalo, alert: alertRef.current };
    // `auto` follows the page theme: sample the resolved page surface token off
    // this element (which honours both the prefers-color-scheme media query and
    // any manual .light/.dark override) and pick the matching palette — light
    // cells with glow on dark surfaces, dark cells without on light ones.
    const effectiveTone: AgentMarkTone = tone === 'auto'
      ? (luminance(cssToRGB(ctx, el, 'var(--color-bg-primary)')) < 0.5 ? 'dark' : 'light')
      : tone;
    // Each tone paints directly with its palette. `light` resolves to dark-slate
    // cells with glow off (see pal()), so the mark draws crisp on the transparent
    // canvas — no render-on-black + luminance-key pass.
    const P = pal(effectiveTone, hexRGB(accent));
    // Optional explicit tint — recolors the cells/core (e.g. a settled case in
    // content-disabled) while keeping the tone's glow behaviour.
    if (color) { const rgb = cssToRGB(ctx, el, color); P.dot = rgb; P.core = rgb; }
    const draw = DRAW[mark] ?? drawOrbit;

    const paint = (T: number) => {
      // Glide the alert amount toward its target so the color swap eases in/out.
      alertRef.current += (alertTargetRef.current - alertRef.current) * 0.06;
      if (Math.abs(alertRef.current - alertTargetRef.current) < 0.001) alertRef.current = alertTargetRef.current;
      e.alert = alertRef.current;
      ctx.clearRect(0, 0, W, H);
      const tt = state === 'static' ? 0.62 : T;
      draw(e, tt, P);
    };

    const reduced = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
    const sp = clamp(motionSpeed, 0.4, 2);

    // No animation loop → snap the alert to its target so the color still applies.
    if (reduced || state === 'static') alertRef.current = alertTargetRef.current;
    // first frame immediately (rAF can be throttled before on-screen)
    paint(1.15);
    if (reduced || state === 'static') return;

    let raf = 0;
    const loop = (now: number) => { paint((now / 1000) * sp); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mark, size, tone, state, motionSpeed, accent, color, coreHalo, coreGradient, prefersDark]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{ width: size, height: size, display: 'block', flexShrink: 0 }}
      className={className}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
