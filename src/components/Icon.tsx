import type React from 'react';
import {C} from '../theme';

// Line icons, 24-unit grid, 1.6 stroke, drawn by hand.
const P: Record<string, React.ReactNode> = {
  umbrella: (
    <>
      <path d="M3 12a9 9 0 0 1 18 0Z" />
      <path d="M12 12v7a2 2 0 0 1-4 0" />
      <path d="M12 3v0.5" />
    </>
  ),
  glasses: (
    <>
      <path d="M2 10h20" />
      <path d="M3.5 10l1 5a3 3 0 0 0 3 2.4h0.6a3 3 0 0 0 3-2.6L11.5 10" />
      <path d="M12.5 10l0.4 4.8a3 3 0 0 0 3 2.6h0.6a3 3 0 0 0 3-2.4l1-5" />
    </>
  ),
  lockClosed: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <path d="M12 15v2" />
    </>
  ),
  lockOpen: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 7.6-1.8" />
      <path d="M12 15v2" />
    </>
  ),
  shield: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6Z" />,
  drop: <path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11Z" />,
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l8-8M16 7l2 2M14 9l1.5 1.5" />
    </>
  ),
  hand: (
    <>
      <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M14 11.5V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6 7-2.5 0-4-1.2-5.5-3.5L4 13.5a1.5 1.5 0 0 1 2.5-1.6L8 14" />
    </>
  ),
  paper: (
    <>
      <path d="M6 3h9l4 4v14H6Z" />
      <path d="M15 3v4h4M9 12h7M9 15.5h7" />
    </>
  ),
  noLever: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
      <path d="M5.6 5.6l12.8 12.8" />
    </>
  ),
  trendDown: (
    <>
      <path d="M3 7l6 6 4-4 8 8" />
      <path d="M15 17h6v-6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M5 21v-1.5A5.5 5.5 0 0 1 10.5 14h3a5.5 5.5 0 0 1 5.5 5.5V21" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  coins: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5h3.5a1.75 1.75 0 0 1 0 3.5h-2a1.75 1.75 0 0 0 0 3.5h3.5" />
    </>
  ),
};

export type IconName = keyof typeof P;

export const Icon = ({name, size = 64, color = C.ink, style}: {name: IconName; size?: number; color?: string; style?: React.CSSProperties}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {P[name]}
  </svg>
);
