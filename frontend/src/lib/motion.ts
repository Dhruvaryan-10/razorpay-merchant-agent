/**
 * Ledger motion tokens for Framer Motion. Mirrors the CSS variables in
 * tokens.css: four durations and two curves. A fifth duration is a sign the
 * animation is decorative.
 */
export const duration = {
  instant: 0.1,
  quick: 0.16,
  move: 0.24,
  data: 0.48,
  reduced: 0.08,
} as const;

type Bezier = [number, number, number, number];

export const ease: { out: Bezier; inOut: Bezier } = {
  out: [0.2, 0.8, 0.2, 1],
  inOut: [0.4, 0, 0.2, 1],
};

/** Page content: fades in with a 4px rise; the shell never animates. */
export const pageEnter = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.quick, ease: ease.out },
};

/** Reduced-motion substitute: opacity only, 80ms. */
export const reducedFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: duration.reduced },
};
