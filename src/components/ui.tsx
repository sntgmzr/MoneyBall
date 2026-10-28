import type React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {useLayout} from '../layout';
import {C, EASE, FONT, clamp, glass, ramp, sp, type, type Preset} from '../theme';

// Entrances start from scale 0.95 + opacity 0 — never from scale(0).
export const useEnter = (at: number, preset: Preset = 'settle', fade = 12) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = sp(f, fps, preset, at);
  return {p, o: ramp(f, at, fade), scale: 0.95 + 0.05 * p};
};

// "Materialize, don't just fade": scale, opacity, blur and the glass blur together.
export const Glass = ({
  at,
  size = 'sm',
  preset = 'settle',
  style,
  children,
  fromX = 0,
  fromY = 24,
}: {
  at: number;
  size?: 'sm' | 'lg';
  preset?: Preset;
  style?: React.CSSProperties;
  children: React.ReactNode;
  fromX?: number;
  fromY?: number;
}) => {
  const f = useCurrentFrame();
  const {p, o, scale} = useEnter(at, preset);
  const blur = interpolate(p, [0, 1], [18, 0]);
  return (
    <div
      style={{
        ...glass(size),
        backdropFilter: `blur(${18 * p}px) saturate(${100 + 80 * p}%)`,
        WebkitBackdropFilter: `blur(${18 * p}px) saturate(${100 + 80 * p}%)`,
        borderRadius: size === 'lg' ? 36 : 26,
        opacity: o,
        scale,
        translate: `${fromX * (1 - p)}px ${fromY * (1 - p)}px`,
        filter: f < at + 30 ? `blur(${blur * 0.4}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// HUD title: serif, word by word (3-frame stagger), fixed in the top safe area
// so the camera never moves text that has to be read.
export const Title = ({
  text,
  at,
  until,
  size,
  color = C.ink,
}: {
  text: string;
  at: number;
  until?: number;
  size?: number;
  color?: string;
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const out = until !== undefined ? ramp(f, until, 10) : 0;
  return (
    <>
    {/* Scroll-edge effect: soft white fade where the title floats over the world */}
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: L.titleTop + (L.v ? 260 : 170),
        background: 'linear-gradient(rgba(255,255,255,0.92) 55%, rgba(255,255,255,0))',
        opacity: ramp(f, at - 4, 10) * (1 - out),
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: L.titleTop,
        left: L.v ? 70 : 160,
        right: L.v ? 70 : 160,
        textAlign: 'center',
        ...type.display,
        fontSize: size ?? L.titleSize,
        color,
        opacity: 1 - out,
        translate: `0px ${-14 * out}px`,
      }}
    >
      {text.split(' ').map((w, i) => {
        const s = at + i * 3;
        const p = sp(f, fps, 'settle', s);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              opacity: ramp(f, s, 12),
              translate: `0px ${(1 - p) * 0.35}em`,
              filter: `blur(${(1 - p) * 6}px)`,
            }}
          >
            {w}
            {i < text.split(' ').length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </div>
    </>
  );
};

export const Label = ({children, size, color = C.ink2, weight = 500, style}: {children: React.ReactNode; size?: number; color?: string; weight?: number; style?: React.CSSProperties}) => {
  const L = useLayout();
  return (
    <div style={{...type.body, fontSize: size ?? L.small, color, fontWeight: weight, whiteSpace: 'nowrap', ...style}}>{children}</div>
  );
};

// Small honest tags: "Datos al …", "Datos de ejemplo", "ilustrativo".
export const Tag = ({children, at = 0, tone = 'neutral', style}: {children: React.ReactNode; at?: number; tone?: 'neutral' | 'warn'; style?: React.CSSProperties}) => {
  const L = useLayout();
  const {o, scale} = useEnter(at, 'snappy', 8);
  return (
    <div
      style={{
        ...type.body,
        fontSize: L.v ? 36 : 26,
        fontWeight: 600,
        color: tone === 'warn' ? '#8A5A12' : C.ink2,
        background: tone === 'warn' ? '#FBF1E1' : C.g1,
        borderRadius: 999,
        padding: '6px 18px',
        whiteSpace: 'nowrap',
        opacity: o,
        scale,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Coin chip with the ticker from datos.json.
export const Ficha = ({sym, size = 96, ring = C.g2, style}: {sym: string; size?: number; ring?: string; style?: React.CSSProperties}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size,
      background: '#fff',
      border: `${Math.max(2, size * 0.035)}px solid ${ring}`,
      boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT.sans,
      fontWeight: 700,
      fontSize: size * (sym.length > 4 ? 0.22 : sym.length > 3 ? 0.26 : 0.3),
      color: C.ink,
      letterSpacing: '-0.01em',
      ...style,
    }}
  >
    {sym}
  </div>
);

// Number that counts with easeOut; tabular digits so it never dances.
export const countTo = (f: number, at: number, dur: number, from: number, to: number) =>
  interpolate(f, [at, at + dur], [from, to], {...clamp, easing: EASE.out});
