/** @type {import('tailwindcss').Config} */

// Ledger tokens live in src/styles/tokens.css as RGB channels.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

const ledgerColors = {
  canvas: token('canvas'),
  rail: token('rail'),
  sheet: token('sheet'),
  well: token('well'),
  line: token('line'),
  'line-strong': token('line-strong'),
  mute: token('mute'),
  ink: token('ink'),
  'ink-2': token('ink-2'),
  'ink-3': token('ink-3'),
  'ink-4': token('ink-4'),
  'on-ink': token('on-ink'),
  accent: token('accent'),
  'accent-strong': token('accent-strong'),
  'accent-tint': token('accent-tint'),
  positive: token('positive'),
  'positive-tint': token('positive-tint'),
  caution: token('caution'),
  'caution-tint': token('caution-tint'),
  critical: token('critical'),
  'critical-tint': token('critical-tint'),
  scrim: token('scrim'),
};

module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/hooks/**/*.{js,ts,jsx,tsx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ...ledgerColors,
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      // Type scale: text steps sit close together for density, then jump for
      // figures, because a merchant reads numbers before words.
      fontSize: {
        'figure-xl': ['48px', { lineHeight: '52px', letterSpacing: '-0.035em', fontWeight: '500' }],
        'figure-l': ['28px', { lineHeight: '32px', letterSpacing: '-0.025em', fontWeight: '500' }],
        'figure-m': ['20px', { lineHeight: '24px', letterSpacing: '-0.015em', fontWeight: '500' }],
        title: ['22px', { lineHeight: '28px', letterSpacing: '-0.02em', fontWeight: '540' }],
        heading: ['15px', { lineHeight: '20px', letterSpacing: '-0.01em', fontWeight: '560' }],
        body: ['14px', { lineHeight: '20px' }],
        cell: ['13px', { lineHeight: '20px' }],
        meta: ['12px', { lineHeight: '16px' }],
        label: ['11px', { lineHeight: '16px', letterSpacing: '0.06em', fontWeight: '550' }],
        code: ['12.5px', { lineHeight: '20px' }],
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        strong: '540',
        heavy: '560',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '10px',
      },
      boxShadow: {
        e1: 'var(--shadow-e1)',
        e2: 'var(--shadow-e2)',
        raise: 'var(--shadow-raise)',
      },
      transitionDuration: {
        instant: 'var(--dur-instant)',
        quick: 'var(--dur-quick)',
        move: 'var(--dur-move)',
        data: 'var(--dur-data)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
      },
      maxWidth: {
        measure: '68ch',
      },
      width: {
        sidebar: '232px',
        drawer: '420px',
        palette: '640px',
      },
    },
  },
  plugins: [],
};
