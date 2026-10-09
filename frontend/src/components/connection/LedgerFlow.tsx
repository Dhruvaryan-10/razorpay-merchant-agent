'use client';

import { useEffect, useRef } from 'react';

/**
 * The connection screen's living ledger.
 *
 * Each order owns a ruled lane and moves through Placed → Paid → Fulfilled →
 * Settled in discrete, eased steps. A single conductor acts on a slow beat,
 * so only one or two things move at once: an order enters, another advances,
 * one pauses longer than the rest. Arrivals get a small pulse in the stage's
 * colour, a paid order briefly brightens, settled orders leave a faint trace
 * and lift the running line along the bottom; a few are cancelled and recede.
 *
 * Abstract by design (no figures, names or amounts). Deterministic: a seeded
 * RNG drives a fixed-timestep simulation, so the same story plays at any frame
 * rate. The loop stops entirely when the tab is hidden or the canvas is off
 * screen; under prefers-reduced-motion it renders one still frame.
 */

const C = {
  ground: '#0E1014',
  rule: 'rgba(236, 237, 239, 0.05)',
  column: 'rgba(236, 237, 239, 0.08)',
  label: 'rgba(236, 237, 239, 0.36)',
  bar: [236, 237, 239] as const,
  stage: ['#E2A541', '#8197FF', '#5DBE8A', '#5DBE8A'],
  stageRgb: [
    [226, 165, 65],
    [129, 151, 255],
    [93, 190, 138],
    [93, 190, 138],
  ] as const,
  cancelled: 'rgba(236, 237, 239, 0.3)',
  line: 'rgba(129, 151, 255, 0.85)',
  lineFill: 'rgba(129, 151, 255, 0.06)',
};

const STAGES = ['Placed', 'Paid', 'Fulfilled', 'Settled'];
const ROW = 30;
const PAD = 24;
const STEP = 1 / 30; // fixed simulation step, seconds
const BEAT = 1.3; // conductor rhythm, seconds
const MAX_MOVING = 2;
const OCCUPANCY = 0.68; // share of lanes holding an order
const MAX_LANES = 32;
const LINE_SAMPLES = 240;
const FAST_FORWARD = 70; // seconds simulated before the first frame
const ENTER_TIME = 1.6;
const ADVANCE_TIME = 1.9;
const SETTLE_TIME = 1.5;
const CANCEL_TIME = 2.2;
const TRACE_TIME = 8;

type Phase = 'enter' | 'dwell' | 'advance' | 'settle' | 'cancel';
type Rgb = readonly [number, number, number];

interface Order {
  lane: number;
  stage: number; // stage it is in, or moving from
  toStage: number;
  frac: number; // position within its stage, 0..1 of the usable region
  toFrac: number;
  phase: Phase;
  t: number; // seconds in the current phase
  dwellFor: number;
  width: number;
  cancelAt: number | null;
  highlight: number; // 1 → 0 after being paid
  alpha: number;
  breath: number; // phase offset for the waiting ring
}

interface Pulse {
  lane: number | null; // null: the running line's leading edge
  stage: number;
  frac: number;
  t: number;
  dur: number;
  rgb: Rgb;
}

interface Trace {
  lane: number;
  frac: number;
  t: number;
}

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const rgba = (rgb: readonly number[], a: number) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;

export function LedgerFlow({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const random = seeded(1048);
    const sansFont = getComputedStyle(document.documentElement).getPropertyValue('--font-geist-sans') || 'sans-serif';

    // ---- Geometry (recomputed on resize; the story itself is layout-free) ----
    let width = 0;
    let height = 0;
    let compact = false;
    let top = 76;
    let rows = 0;

    const regionStart = (i: number) => PAD + ((width - PAD) * i) / STAGES.length;
    const regionWidth = () => (width - PAD) / STAGES.length;
    const xOf = (stage: number, frac: number) => regionStart(stage) + 14 + frac * (regionWidth() - 40);
    const yOf = (lane: number) => top + lane * ROW + ROW / 2;
    const visibleLane = (lane: number) => lane < rows;

    // ---- Story state ----
    let orders: Order[] = [];
    let pulses: Pulse[] = [];
    let traces: Trace[] = [];
    const line = new Array<number>(LINE_SAMPLES).fill(0);
    let lineTarget = 0;
    let lineLevel = 0;
    let lineScroll = 0;
    let simTime = 0;
    let nextBeat = 0;

    // Most orders pause a few seconds per stage; some linger much longer.
    const pickDwell = () => (random() < 0.18 ? 13 + random() * 9 : 3.5 + random() * 6);
    const pickFrac = () => 0.05 + random() * 0.45;

    const spawn = (lane: number): Order => ({
      lane,
      stage: 0,
      toStage: 0,
      frac: -0.25,
      toFrac: pickFrac(),
      phase: 'enter',
      t: 0,
      dwellFor: pickDwell(),
      width: 26 + random() * 58,
      cancelAt: random() < 0.1 ? Math.floor(random() * 2) : null,
      highlight: 0,
      alpha: 0,
      breath: random() * Math.PI * 2,
    });

    // Seed a populated ledger: orders already part-way through their journeys.
    for (let lane = 0; lane < MAX_LANES; lane++) {
      if (random() > OCCUPANCY) continue;
      const order = spawn(lane);
      order.stage = order.toStage = Math.floor(random() * 3);
      order.frac = order.toFrac = pickFrac();
      order.phase = 'dwell';
      order.alpha = 1;
      order.t = random() * order.dwellFor;
      if (order.cancelAt !== null && order.cancelAt < order.stage) order.cancelAt = null;
      orders.push(order);
    }
    for (let i = 0; i < LINE_SAMPLES; i++) {
      lineTarget += random() < 0.3 ? 0.4 + random() : 0;
      line[i] = lineTarget;
    }
    lineLevel = lineTarget;

    const pulse = (lane: number | null, stage: number, frac: number, dur = 1.1) =>
      pulses.push({ lane, stage, frac, t: 0, dur, rgb: C.stageRgb[Math.min(stage, 3)] });

    // ---- Conductor: at most one decision per beat ----
    const conduct = () => {
      const moving = orders.filter((o) => o.phase === 'enter' || o.phase === 'advance').length;
      if (moving >= MAX_MOVING) return;

      const ready = orders
        .filter((o) => o.phase === 'dwell' && o.t >= o.dwellFor && visibleLane(o.lane))
        .sort((a, b) => b.t - b.dwellFor - (a.t - a.dwellFor));

      const free: number[] = [];
      for (let lane = 0; lane < rows; lane++) if (!orders.some((o) => o.lane === lane)) free.push(lane);
      const wantMore = orders.filter((o) => visibleLane(o.lane)).length < Math.round(rows * OCCUPANCY);

      const preferEnter = random() < 0.4;
      if ((preferEnter || !ready.length) && wantMore && free.length) {
        orders.push(spawn(free[Math.floor(random() * free.length)]));
        return;
      }
      const order = ready[0];
      if (!order) return;
      order.t = 0;
      if (order.cancelAt === order.stage) {
        order.phase = 'cancel';
      } else if (order.stage === STAGES.length - 1) {
        order.phase = 'settle';
      } else {
        order.phase = 'advance';
        order.toStage = order.stage + 1;
        order.toFrac = pickFrac();
      }
    };

    // ---- Fixed-timestep simulation: the only place random() is used ----
    const step = () => {
      simTime += STEP;
      if (simTime >= nextBeat) {
        conduct();
        nextBeat = simTime + BEAT * (0.75 + random() * 0.5);
      }

      for (const o of orders) {
        o.t += STEP;
        o.highlight = Math.max(0, o.highlight - STEP / 1.8);
        if (o.phase === 'enter') {
          o.alpha = easeOut(clamp01(o.t / ENTER_TIME));
          if (o.t >= ENTER_TIME) {
            o.frac = o.toFrac;
            o.phase = 'dwell';
            o.t = 0;
          }
        } else if (o.phase === 'advance' && o.t >= ADVANCE_TIME) {
          o.stage = o.toStage;
          o.frac = o.toFrac;
          o.phase = 'dwell';
          o.t = 0;
          o.dwellFor = pickDwell();
          if (o.stage === 1) o.highlight = 1; // the moment it's paid
          if (visibleLane(o.lane)) pulse(o.lane, o.stage, o.frac);
        } else if (o.phase === 'settle') {
          o.alpha = 1 - clamp01(o.t / SETTLE_TIME);
          if (o.t >= SETTLE_TIME) {
            traces.push({ lane: o.lane, frac: o.frac, t: 0 });
            lineTarget += 1.1;
            pulse(null, 1, 1, 1.4);
          }
        } else if (o.phase === 'cancel') {
          o.alpha = 1 - clamp01(o.t / CANCEL_TIME);
        }
      }
      orders = orders.filter(
        (o) => !((o.phase === 'settle' && o.t >= SETTLE_TIME) || (o.phase === 'cancel' && o.t >= CANCEL_TIME))
      );
      pulses = pulses.filter((p) => (p.t += STEP) < p.dur);
      traces = traces.filter((tr) => (tr.t += STEP) < TRACE_TIME);

      // The running line eases toward its level and scrolls slowly left.
      lineLevel += (lineTarget - lineLevel) * 0.04;
      line[LINE_SAMPLES - 1] = lineLevel;
      lineScroll += STEP;
      if (lineScroll >= 1.5) {
        lineScroll = 0;
        line.shift();
        line.push(lineLevel);
      }
    };

    // ---- Pointer proximity: affects drawing only, never the story ----
    let pointer: { x: number; y: number } | null = null;
    const glow = { x: -999, y: -999, a: 0 };
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onPointerLeave = () => {
      pointer = null;
    };

    // ---- Drawing ----
    const orderX = (o: Order) => {
      if (o.phase === 'advance') {
        const p = easeInOut(clamp01(o.t / ADVANCE_TIME));
        return xOf(o.stage, o.frac) + (xOf(o.toStage, o.toFrac) - xOf(o.stage, o.frac)) * p;
      }
      if (o.phase === 'enter') {
        const p = easeOut(clamp01(o.t / ENTER_TIME));
        return xOf(0, o.frac) + (xOf(0, o.toFrac) - xOf(0, o.frac)) * p;
      }
      return xOf(o.stage, o.frac);
    };

    const drawOrder = (o: Order, near: (x: number, y: number) => number) => {
      const x = orderX(o);
      const y = yOf(o.lane);
      const boost = near(x, y);
      const stageIndex = o.phase === 'advance' && o.t > ADVANCE_TIME * 0.7 ? o.toStage : o.stage;
      const rgb = C.stageRgb[stageIndex];
      ctx.globalAlpha = o.alpha;

      // Directional trail while advancing: longest at peak speed.
      if (o.phase === 'advance') {
        const len = 34 * Math.sin(clamp01(o.t / ADVANCE_TIME) * Math.PI);
        if (len > 1) {
          const grad = ctx.createLinearGradient(x - len, y, x, y);
          grad.addColorStop(0, rgba(rgb, 0));
          grad.addColorStop(1, rgba(rgb, 0.45));
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x - len, y);
          ctx.lineTo(x - 4, y);
          ctx.stroke();
        }
      }

      // The ledger "line of text" travelling with the mark.
      const settledBar = o.stage === 3 && o.phase !== 'advance';
      const barAlpha = (o.phase === 'cancel' ? 0.05 : settledBar ? 0.17 : 0.1) + o.highlight * 0.16 + boost * 0.12;
      ctx.fillStyle = rgba(C.bar, barAlpha);
      ctx.fillRect(x + 12, y - 1.5, o.width, 3);

      // Paid: a soft halo that fades.
      if (o.highlight > 0) {
        ctx.fillStyle = rgba(C.stageRgb[1], 0.18 * o.highlight);
        ctx.beginPath();
        ctx.arc(x + 3, y, 7 + 3 * (1 - o.highlight), 0, Math.PI * 2);
        ctx.fill();
      }

      const r = 3 + boost * 0.6 - (o.phase === 'settle' ? 3 * clamp01(o.t / SETTLE_TIME) : 0);
      if (o.phase === 'cancel') {
        ctx.fillStyle = C.cancelled;
        ctx.fillRect(x, y - 0.75, 6, 1.5);
      } else if (stageIndex === 0) {
        // Awaiting payment: a hollow ring that breathes very slowly.
        const breathe = 0.78 + 0.22 * Math.sin(simTime * 1.6 + o.breath);
        ctx.strokeStyle = rgba(rgb, breathe);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + 3, y, Math.max(0.5, r - 0.4), 0, Math.PI * 2);
        ctx.stroke();
      } else if (r > 0.2) {
        ctx.fillStyle = C.stage[stageIndex];
        ctx.beginPath();
        ctx.arc(x + 3, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawLine = () => {
      const baseY = height - 120;
      const span = 72;
      const min = line[0];
      const max = Math.max(min + 1, line[LINE_SAMPLES - 1]);
      const stepX = width / (LINE_SAMPLES - 1);
      const yAt = (v: number) => baseY - ((v - min) / (max - min)) * span;

      ctx.beginPath();
      line.forEach((v, i) => (i ? ctx.lineTo(i * stepX, yAt(v)) : ctx.moveTo(0, yAt(v))));
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.lineTo(width, baseY);
      ctx.lineTo(0, baseY);
      ctx.closePath();
      ctx.fillStyle = C.lineFill;
      ctx.fill();
      ctx.strokeStyle = C.rule;
      ctx.beginPath();
      ctx.moveTo(0, baseY + 0.5);
      ctx.lineTo(width, baseY + 0.5);
      ctx.stroke();

      // Leading edge, which brightens briefly when an order settles.
      const endY = yAt(line[LINE_SAMPLES - 1]);
      const endPulse = pulses.find((p) => p.lane === null);
      if (endPulse) {
        const k = endPulse.t / endPulse.dur;
        ctx.fillStyle = rgba(C.stageRgb[1], 0.22 * (1 - k));
        ctx.beginPath();
        ctx.arc(width - 3, endY, 4 + 8 * easeOut(k), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = C.stage[1];
      ctx.beginPath();
      ctx.arc(width - 3, endY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = () => {
      ctx.fillStyle = C.ground;
      ctx.fillRect(0, 0, width, height);

      if (pointer) {
        glow.x += (pointer.x - glow.x) * 0.15;
        glow.y += (pointer.y - glow.y) * 0.15;
        glow.a += (1 - glow.a) * 0.08;
      } else {
        glow.a *= 0.92;
      }
      const near = (x: number, y: number) =>
        glow.a < 0.01 ? 0 : glow.a * clamp01(1 - Math.hypot(x - glow.x, y - glow.y) / 150);

      // Ruled lanes.
      ctx.lineWidth = 1;
      ctx.strokeStyle = C.rule;
      for (let r = 0; r <= rows; r++) {
        const y = Math.round(top + r * ROW) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Stage rules and labels.
      ctx.font = `12px ${sansFont}`;
      for (let i = 0; i < STAGES.length; i++) {
        const x = Math.round(regionStart(i)) + 0.5;
        if (i > 0) {
          ctx.strokeStyle = C.column;
          ctx.beginPath();
          ctx.moveTo(x, compact ? 0 : top - 24);
          ctx.lineTo(x, top + rows * ROW);
          ctx.stroke();
        }
        if (!compact) {
          ctx.fillStyle = C.label;
          ctx.fillText(STAGES[i], x + (i > 0 ? 10 : 0), top - 14);
        }
      }

      // Faint traces left where orders settled.
      for (const tr of traces) {
        if (!visibleLane(tr.lane)) continue;
        ctx.fillStyle = rgba(C.stageRgb[3], 0.16 * (1 - tr.t / TRACE_TIME));
        ctx.fillRect(xOf(3, tr.frac) - 1, yOf(tr.lane) - 0.5, 12, 1);
      }

      for (const o of orders) if (visibleLane(o.lane)) drawOrder(o, near);

      // Arrival pulses: one ring, expanding and fading.
      ctx.lineWidth = 1;
      for (const p of pulses) {
        if (p.lane === null || !visibleLane(p.lane)) continue;
        const k = p.t / p.dur;
        ctx.strokeStyle = rgba(p.rgb, 0.45 * (1 - k));
        ctx.beginPath();
        ctx.arc(xOf(p.stage, p.frac) + 3, yOf(p.lane), 3 + 11 * easeOut(k), 0, Math.PI * 2);
        ctx.stroke();
      }

      if (!compact) drawLine();
    };

    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Short bands (phones) show lanes only: no labels, no line.
      compact = height < 320;
      top = compact ? 8 : 76;
      rows = Math.min(MAX_LANES, Math.max(1, Math.floor((height - top - (compact ? 0 : 230)) / ROW)));
    };

    // ---- Loop: exists only while the canvas is visible ----
    let raf = 0;
    let running = false;
    let last = 0;
    let carry = 0;
    let onScreen = true;

    const tick = (now: number) => {
      carry += Math.min(0.25, (now - last) / 1000);
      last = now;
      let stepped = false;
      while (carry >= STEP) {
        step();
        carry -= STEP;
        stepped = true;
      }
      // Draw at the simulation rate (30fps), not the display rate.
      if (stepped) draw();
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || reduce) return;
      running = true;
      last = performance.now();
      carry = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const sync = () => (onScreen && document.visibilityState === 'visible' ? start() : stop());

    layout();
    for (let t = 0; t < FAST_FORWARD; t += STEP) step();
    if (reduce) {
      // A still frame shouldn't freeze a transition mid-flight: land everything.
      orders = orders.filter((o) => o.phase !== 'settle' && o.phase !== 'cancel');
      for (const o of orders) {
        if (o.phase === 'advance') o.stage = o.toStage;
        if (o.phase !== 'dwell') o.frac = o.toFrac;
        o.phase = 'dwell';
        o.alpha = 1;
        o.highlight = 0;
      }
      pulses = [];
    }
    draw();
    document.fonts?.ready.then(() => draw());
    sync();

    const resize = new ResizeObserver(() => {
      layout();
      draw();
    });
    resize.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    intersection.observe(canvas);
    document.addEventListener('visibilitychange', sync);
    if (!reduce) {
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerleave', onPointerLeave);
    }

    return () => {
      stop();
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', sync);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
