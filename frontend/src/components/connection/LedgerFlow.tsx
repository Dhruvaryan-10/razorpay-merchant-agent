'use client';

import { useEffect, useRef } from 'react';

/**
 * The connection screen's living ledger. Order marks drift along ruled rows
 * through the lifecycle columns, changing state as they cross each rule
 * (hollow amber → solid blue → green). Settled entries feed a slowly rising
 * cumulative line along the bottom; a few are cancelled and recede.
 *
 * Abstract by design: no figures, names or amounts, so nothing reads as data.
 * Deterministic (seeded), DPR-aware, paused when hidden or offscreen, and a
 * single still frame under prefers-reduced-motion.
 */

const COLORS = {
  ground: '#0E1014',
  rule: 'rgba(236, 237, 239, 0.055)',
  column: 'rgba(236, 237, 239, 0.08)',
  label: 'rgba(236, 237, 239, 0.34)',
  bar: 'rgba(236, 237, 239, 0.10)',
  barSettled: 'rgba(236, 237, 239, 0.16)',
  pending: '#E2A541',
  processing: '#8197FF',
  completed: '#5DBE8A',
  cancelled: 'rgba(236, 237, 239, 0.28)',
  line: 'rgba(129, 151, 255, 0.85)',
  lineFill: 'rgba(129, 151, 255, 0.07)',
};

const STAGES = ['Placed', 'Paid', 'Fulfilled', 'Settled'];
const ROW = 30;
const PAD = 24;

type Entry = {
  row: number;
  x: number;
  speed: number;
  width: number;
  cancelAt: number | null; // column index where it is cancelled, if any
  fade: number; // 1 → 0 once cancelled or settled off-screen
  settled: boolean;
};

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function LedgerFlow({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const random = seeded(1048);
    const sansFont = getComputedStyle(document.documentElement).getPropertyValue('--font-geist-sans') || 'sans-serif';

    let width = 0;
    let height = 0;
    let compact = false;
    let top = 76;
    let rows = 0;
    let entries: Entry[] = [];
    let settledCount = 0;
    let line: number[] = [];
    let scroll = 0;
    let frame = 0;
    let last = performance.now();
    let visible = true;

    // Each stage is a region; rules sit on the boundaries between regions.
    const regionStart = (i: number) => PAD + ((width - PAD) * i) / STAGES.length;
    const stageAt = (x: number) => {
      let stage = 0;
      for (let i = 1; i < STAGES.length; i++) if (x > regionStart(i)) stage = i;
      return stage;
    };

    const spawn = (row: number, x: number): Entry => ({
      row,
      x,
      speed: 7 + random() * 12,
      width: 22 + random() * 64,
      cancelAt: random() < 0.12 ? 1 + Math.floor(random() * 2) : null,
      fade: 1,
      settled: false,
    });

    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Short bands (phones) show rows only: no labels, no line.
      compact = height < 320;
      top = compact ? 8 : 76;
      rows = Math.max(1, Math.floor((height - top - (compact ? 0 : 230)) / ROW));
      entries = [];
      for (let r = 0; r < rows; r++) {
        let x = -random() * 200;
        while (x < width) {
          entries.push(spawn(r, x));
          x += 140 + random() * 260;
        }
      }
      // A plausible-looking history for the cumulative line; it only ever rises.
      line = [];
      let level = 0;
      for (let i = 0; i < Math.ceil(width / 6) + 2; i++) {
        level += random() < 0.35 ? random() * 1.4 : 0;
        line.push(level);
      }
    };

    const markAt = (entry: Entry) => {
      const stage = stageAt(entry.x);
      if (entry.cancelAt !== null && stage >= entry.cancelAt) return 'cancelled';
      if (stage === 0) return 'pending';
      if (stage === 1) return 'processing';
      return 'completed';
    };

    const draw = () => {
      ctx.fillStyle = COLORS.ground;
      ctx.fillRect(0, 0, width, height);

      // Ruled lines, like a ledger page.
      ctx.strokeStyle = COLORS.rule;
      ctx.lineWidth = 1;
      for (let r = 0; r <= rows; r++) {
        const y = Math.round(top + r * ROW) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Lifecycle regions: rules on the boundaries, a label at each region's start.
      ctx.font = `12px ${sansFont}`;
      ctx.textBaseline = 'alphabetic';
      for (let i = 0; i < STAGES.length; i++) {
        const x = Math.round(regionStart(i)) + 0.5;
        if (i > 0) {
          ctx.strokeStyle = COLORS.column;
          ctx.beginPath();
          ctx.moveTo(x, compact ? 0 : top - 24);
          ctx.lineTo(x, top + rows * ROW);
          ctx.stroke();
        }
        if (!compact) {
          ctx.fillStyle = COLORS.label;
          ctx.fillText(STAGES[i], x + (i > 0 ? 10 : 0), top - 14);
        }
      }

      // Entries: a mark plus a ledger "line of text".
      for (const entry of entries) {
        const y = top + entry.row * ROW + ROW / 2;
        const kind = markAt(entry);
        ctx.globalAlpha = entry.fade;
        ctx.fillStyle = stageAt(entry.x) === STAGES.length - 1 ? COLORS.barSettled : COLORS.bar;
        ctx.fillRect(entry.x + 12, y - 1.5, entry.width, 3);

        if (kind === 'pending') {
          ctx.strokeStyle = COLORS.pending;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(entry.x + 3, y, 2.6, 0, Math.PI * 2);
          ctx.stroke();
        } else if (kind === 'cancelled') {
          ctx.fillStyle = COLORS.cancelled;
          ctx.fillRect(entry.x, y - 0.75, 6, 1.5);
        } else {
          ctx.fillStyle = kind === 'processing' ? COLORS.processing : COLORS.completed;
          ctx.beginPath();
          ctx.arc(entry.x + 3, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      if (compact) return;

      // Cumulative settled line, above the caption area.
      const baseY = height - 120;
      const span = 72;
      const max = Math.max(1, line[line.length - 1] - line[0]);
      ctx.beginPath();
      line.forEach((v, i) => {
        const x = i * 6;
        const y = baseY - ((v - line[0]) / max) * span;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.lineTo(width, baseY);
      ctx.lineTo(0, baseY);
      ctx.closePath();
      ctx.fillStyle = COLORS.lineFill;
      ctx.fill();
      ctx.strokeStyle = COLORS.rule;
      ctx.beginPath();
      ctx.moveTo(0, baseY + 0.5);
      ctx.lineTo(width, baseY + 0.5);
      ctx.stroke();
    };

    const step = (dt: number) => {
      const lastColumn = regionStart(STAGES.length - 1);
      for (const entry of entries) {
        entry.x += entry.speed * dt;
        if (markAt(entry) === 'cancelled') entry.fade = Math.max(0, entry.fade - dt * 0.6);
        if (!entry.settled && entry.x > lastColumn && entry.cancelAt === null) {
          entry.settled = true;
          settledCount += 1;
        }
      }
      // Recycle entries that left the page or faded out.
      entries = entries.map((entry) =>
        entry.x > width + 40 || entry.fade === 0 ? spawn(entry.row, -entry.width - random() * 160) : entry
      );
      // Each settled entry nudges the line up; the line scrolls slowly left.
      if (settledCount > 0) {
        line[line.length - 1] += settledCount * 0.6;
        settledCount = 0;
      }
      scroll += dt * 4;
      while (scroll >= 6) {
        scroll -= 6;
        line.shift();
        line.push(line[line.length - 1]);
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible && document.visibilityState === 'visible') {
        step(dt);
        draw();
      }
      frame = requestAnimationFrame(loop);
    };

    layout();
    // Labels use Geist; draw again once the font is ready.
    document.fonts?.ready.then(() => draw());
    if (reduce) {
      // One still frame, advanced so every column has entries in it.
      for (let i = 0; i < 40; i++) step(0.05);
      draw();
    } else {
      draw();
      frame = requestAnimationFrame(loop);
    }

    const resize = new ResizeObserver(() => {
      layout();
      draw();
    });
    resize.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      last = performance.now();
    });
    intersection.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
