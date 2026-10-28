import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import type React from 'react';
import {interpolate, useVideoConfig} from 'remotion';
import {C, clamp} from '../theme';

type P = TransitionPresentationComponentProps<Record<string, never>>;
const make = (component: React.FC<P>): TransitionPresentation<Record<string, never>> => ({component, props: {}});

const full: React.CSSProperties = {position: 'absolute', inset: 0};

// 1. Zoom-through: the camera dives into a circle at the screen center (a dot,
// a seal) and the next scene lives inside it. The circle opens as a portal
// instead of filling the screen, so there is no brightness jump.
const ZoomThrough: React.FC<P> = ({children, presentationDirection, presentationProgress: p}) => {
  const {width, height} = useVideoConfig();
  if (presentationDirection === 'exiting') {
    return (
      <div style={{...full, scale: interpolate(p, [0, 1], [1, 3.2])}}>{children}</div>
    );
  }
  const r = interpolate(p, [0, 1], [26, Math.hypot(width, height) / 2 + 10], clamp);
  return (
    <div style={full}>
      <div style={{...full, clipPath: `circle(${r}px at 50% 50%)`, scale: interpolate(p, [0, 1], [1.35, 1])}}>{children}</div>
      <div
        style={{
          position: 'absolute',
          left: width / 2 - r,
          top: height / 2 - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          border: `${interpolate(p, [0, 1], [10, 0])}px solid ${C.ink}`,
          opacity: 1 - p,
        }}
      />
    </div>
  );
};
export const zoomThrough = () => make(ZoomThrough);

// 2. Whip pan: fast slide with directional blur that grows with speed.
const whipMaker = (axis: 'x' | 'y') => {
  const Whip: React.FC<P> = ({children, presentationDirection, presentationProgress: p}) => {
    const {width, height} = useVideoConfig();
    const size = axis === 'x' ? width : height;
    const off = presentationDirection === 'exiting' ? -p * size : (1 - p) * size;
    const blur = Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, p)))) * 28;
    const id = `whip-${axis}-${presentationDirection}`;
    return (
      <div style={full}>
        <svg width="0" height="0" style={{position: 'absolute'}}>
          <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={axis === 'x' ? `${blur} 0` : `0 ${blur}`} />
          </filter>
        </svg>
        <div style={{...full, translate: axis === 'x' ? `${off}px 0px` : `0px ${off}px`, filter: blur > 0.5 ? `url(#${id})` : undefined}}>
          {children}
        </div>
      </div>
    );
  };
  return Whip;
};
const WhipX = whipMaker('x');
const WhipY = whipMaker('y');
export const whip = (axis: 'x' | 'y' = 'x') => make(axis === 'x' ? WhipX : WhipY);

// 3. Pull-back reveal: the old scene shrinks into a piece of the new one,
// whose camera starts zoomed in on that same piece and pulls out.
const PullBack: React.FC<P> = ({children, presentationDirection, presentationProgress: p}) => {
  if (presentationDirection === 'exiting') {
    return (
      <div style={{...full, scale: interpolate(p, [0, 1], [1, 0.4]), opacity: interpolate(p, [0.35, 1], [1, 0], clamp)}}>
        {children}
      </div>
    );
  }
  return <div style={{...full, opacity: interpolate(p, [0, 0.55], [0, 1], clamp)}}>{children}</div>;
};
export const pullBack = () => make(PullBack);

// 4. Match cut by shape: both scenes put the shared shape at the center; a
// short cross-dissolve hands one shape to the other.
const MatchCut: React.FC<P> = ({children, presentationDirection, presentationProgress: p}) =>
  presentationDirection === 'exiting' ? (
    <div style={{...full, opacity: 1 - p, scale: 1 + 0.04 * p}}>{children}</div>
  ) : (
    <div style={{...full, opacity: p, scale: 0.97 + 0.03 * p}}>{children}</div>
  );
export const matchCut = () => make(MatchCut);

// 5. Clean clip-path wipe, led by a band of the accent color at 8 %.
const Wipe: React.FC<P> = ({children, presentationDirection, presentationProgress: p}) => {
  const {width} = useVideoConfig();
  if (presentationDirection === 'exiting') return <div style={full}>{children}</div>;
  const edge = p * (width + 160);
  return (
    <div style={full}>
      <div style={{...full, clipPath: `inset(0 ${Math.max(0, width - edge)}px 0 0)`}}>{children}</div>
      <div style={{position: 'absolute', top: 0, bottom: 0, left: edge - 160, width: 160, background: 'rgba(31,138,112,0.08)'}} />
    </div>
  );
};
export const wipe = () => make(Wipe);
