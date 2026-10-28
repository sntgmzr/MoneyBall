import type React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Ambient} from '../background/Ambient';
import {DotGrid} from '../background/Parallax';
import {C, clamp, sp, type Preset} from '../theme';

export type Shot = {at: number; x?: number; y?: number; s?: number; r?: number; preset?: Preset};
export type Drift = {vx: number; vy: number; rot?: number};
// [from, to, strength]. Inside a reading window the drift slows to 30 % (or less).
export type ReadWindow = readonly [number, number, number?];
export type Cam = {x: number; y: number; s: number; r: number};

const readFactor = (f: number, read: readonly ReadWindow[]) => {
  let slow = 0;
  for (const [a, b, k = 0.7] of read) {
    slow = Math.max(slow, k * interpolate(f, [a - 8, a, b, b + 8], [0, 1, 1, 0], clamp));
  }
  return 1 - slow;
};

/**
 * Two layers that add up (brief §5.1):
 * 1. Moves: each shot re-targets with a spring. Shots are summed as deltas
 *    ("additive animation", like iOS), so a new move starts from the current
 *    position AND velocity of the previous one — no brick wall. x, y, scale and
 *    rotation are independent springs. Scale is interpolated in log space so a
 *    zoom feels even.
 * 2. Drift: linear, one direction per scene, never stops. It slows inside
 *    reading windows so key numbers and long text stay still enough to read.
 */
export const useCam = ({
  shots,
  drift,
  read = [],
  follow,
}: {
  shots: Shot[];
  drift: Drift;
  read?: readonly ReadWindow[];
  follow?: (f: number) => {x: number; y: number; w: number};
}): Cam => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: d} = useVideoConfig();

  const first = shots[0];
  let x = first.x ?? 0;
  let y = first.y ?? 0;
  let ls = Math.log(first.s ?? 1);
  let r = first.r ?? 0;
  let px = x;
  let py = y;
  let pls = ls;
  let pr = r;
  for (let i = 1; i < shots.length; i++) {
    const sh = shots[i];
    const p = sp(f, fps, sh.preset ?? 'camera', sh.at);
    const tx = sh.x ?? px;
    const ty = sh.y ?? py;
    const tls = sh.s !== undefined ? Math.log(sh.s) : pls;
    const tr = sh.r ?? pr;
    x += (tx - px) * p;
    y += (ty - py) * p;
    ls += (tls - pls) * p;
    r += (tr - pr) * p;
    px = tx;
    py = ty;
    pls = tls;
    pr = tr;
  }

  // Integrate drift speed so reading windows slow it without a jump.
  let t = 0;
  let total = 0;
  for (let k = 0; k < d; k++) {
    const v = readFactor(k, read);
    if (k < f) t += v;
    total += v;
  }
  x += (drift.vx * t) / fps;
  y += (drift.vy * t) / fps;
  ls += Math.log(1 + 0.05 * (t / total)); // push-in 1.00 → 1.05 per scene
  r += (drift.rot ?? 0) * (t / total); // ≤ ±0.6°

  if (follow) {
    const o = follow(f);
    x += o.x * o.w;
    y += o.y * o.w;
  }
  return {x, y, s: Math.exp(ls), r};
};

// World container: whatever is inside is placed in world coordinates.
export const World = ({cam, children}: {cam: Cam; children: React.ReactNode}) => {
  const {width, height} = useVideoConfig();
  return (
    <div
      style={{
        position: 'absolute',
        left: width / 2,
        top: height / 2,
        width: 0,
        height: 0,
        transform: `rotate(${cam.r}deg) scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px)`,
      }}
    >
      {children}
    </div>
  );
};

// A scene stage: far dots (×0.3), ambient infographics (×0.6), content (×1), HUD.
export const Stage = ({
  cam,
  seed,
  children,
  hud,
}: {
  cam: Cam;
  seed: string;
  children: React.ReactNode;
  hud?: React.ReactNode;
}) => (
  <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
    <DotGrid cam={cam} />
    <Ambient cam={cam} seed={seed} />
    <World cam={cam}>{children}</World>
    {hud}
  </AbsoluteFill>
);

// Place a child centered on a world point.
export const At = ({
  x,
  y,
  children,
  style,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <div style={{position: 'absolute', left: x, top: y, translate: '-50% -50%', ...style}}>{children}</div>
);
