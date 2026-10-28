import {loadFont} from '@remotion/fonts';
import {Easing, interpolate, spring, staticFile} from 'remotion';

// Art direction (brief §9).
export const C = {
  bg: '#FFFFFF',
  ink: '#0B0B0C',
  ink2: '#5F6368',
  accent: '#1F8A70',
  neg: '#D1495B',
  amber: '#E8A33D',
  g1: '#ECEEF0',
  g2: '#D9DCE0',
  g3: '#B8BCC2',
};

// Fonts are bundled from Fontsource (same OFL files Google Fonts serves) so the
// render works offline. See README.
export const FONT = {serif: 'Fraunces', sans: 'Inter'};
loadFont({family: FONT.serif, url: staticFile('fonts/fraunces.woff2'), weight: '100 900'});
loadFont({family: FONT.sans, url: staticFile('fonts/inter.woff2'), weight: '100 900'});

// Apple thinks in damping ratio + response; Remotion's spring() wants
// mass/stiffness/damping. With mass = 1:
//   stiffness = (2π / response)²   damping = 4π · ratio / response
const apple = (ratio: number, response: number) => ({
  mass: 1,
  stiffness: (2 * Math.PI / response) ** 2,
  damping: (4 * Math.PI * ratio) / response,
});

// The only four presets allowed (brief §5.2).
export const SPRINGS = {
  settle: apple(1.0, 0.4), // 246.7 / 31.4 — default, no bounce
  snappy: apple(1.0, 0.3), // 438.6 / 41.9 — small things
  momentum: apple(0.8, 0.3), // 438.6 / 33.5 — only after a whip pan or zoom-through
  camera: apple(1.0, 0.6), // 109.7 / 20.9 — big camera moves
};
export type Preset = keyof typeof SPRINGS;

export const sp = (frame: number, fps: number, preset: Preset = 'settle', delay = 0) =>
  spring({frame: frame - delay, fps, config: SPRINGS[preset]});

// The only curves allowed (brief §5.3). Never ease-in on something visible.
export const EASE = {
  out: Easing.bezier(0.23, 1, 0.32, 1),
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
  drawer: Easing.bezier(0.32, 0.72, 0, 1),
  linear: Easing.linear,
};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// 0→1 over [start, start + dur] with one of the allowed curves.
export const ramp = (frame: number, start: number, dur: number, easing = EASE.out) =>
  interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing});

export const glass = (size: 'sm' | 'lg' = 'sm') => ({
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(18px) saturate(180%)',
  WebkitBackdropFilter: 'blur(18px) saturate(180%)',
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: size === 'lg' ? '0 18px 50px rgba(0,0,0,0.10)' : '0 8px 30px rgba(0,0,0,0.08)',
});

// Size-specific tracking (brief §9).
export const type = {
  display: {fontFamily: FONT.serif, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.05},
  body: {fontFamily: FONT.sans, fontWeight: 500, letterSpacing: '0.01em', lineHeight: 1.4},
  num: {fontVariantNumeric: 'tabular-nums' as const},
};
