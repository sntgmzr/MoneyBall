import {interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {At, Stage, useCam} from '../camera/Camera';
import {useLayout} from '../layout';
import {EV} from '../timeline';
import {C, FONT, glass, ramp, sp, type} from '../theme';

const ev = EV.E1;
const PW = 380;
const PH = 260;

// One chaotic chart panel. Values jump every 5 frames until the freeze.
const Panel = ({seed, fc, target}: {seed: string; fc: number; target: boolean}) => {
  const tick = Math.floor(fc / 5);
  const pct = (random(`${seed}p${tick}`) - 0.5) * 24;
  return (
    <div style={{width: PW, height: PH, borderRadius: 22, background: '#fff', border: `1.5px solid ${C.g1}`, padding: 18, boxSizing: 'border-box'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT.sans, fontWeight: 700, fontSize: 26, color: C.g3}}>
        <span>{['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA'][Math.floor(random(seed) * 6)]}</span>
        <span style={{color: pct > 0 ? C.accent : C.neg, ...type.num}}>
          {pct > 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
        </span>
      </div>
      <svg width={PW - 36} height={170} style={{marginTop: 10}}>
        {new Array(12).fill(0).map((_, i) => {
          const h = 20 + random(`${seed}h${i}${tick}`) * 110;
          const y = 10 + random(`${seed}y${i}${tick}`) * (150 - h);
          const flash = random(`${seed}f${i}${tick}`);
          const isTarget = target && i === 6;
          const color = isTarget ? C.neg : flash > 0.9 ? C.neg : flash > 0.8 ? C.accent : C.g2;
          const blink = isTarget && fc < 36 ? (Math.floor(fc / 6) % 2 === 0 ? 1 : 0.35) : 1;
          return (
            <g key={i} opacity={blink}>
              <line x1={i * 28 + 12} x2={i * 28 + 12} y1={y - 10} y2={y + h + 10} stroke={color} strokeWidth="2" />
              <rect x={i * 28 + 4} y={y} width="16" height={h} rx="3" fill={color} />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const E01Gancho = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const textY = L.cy - 40;
  const dotY = L.cy + (L.v ? 230 : 170);
  // Target candle sits in the panel at grid (0,0): candle 6 of 12.
  const tx = -PW / 2 + 18 + 6 * 28 + 12;
  const ty = -PH / 2 + 100;
  const cam = useCam({
    shots: [
      {at: 0, x: tx, y: ty, s: 3},
      {at: ev.zoomOut, x: 0, y: L.cy, s: 1, preset: 'camera'},
      {at: ev.focusDot, x: 0, y: dotY, s: 1.02, preset: 'camera'},
    ],
    drift: {vx: -10, vy: -8, rot: -0.4},
    read: [[ev.text, ev.freeze]],
  });
  const fc = Math.min(f, ev.freeze);
  const gray = ramp(f, ev.freeze, 12);
  const words = '¿Y si en vez de corazonadas usamos estadística?'.split(' ');
  const dot = sp(f, fps, 'snappy', ev.dot);
  const panels = [];
  for (let i = -4; i <= 4; i++) {
    for (let j = -5; j <= 5; j++) {
      panels.push(
        <At key={`${i}${j}`} x={i * (PW + 40) + (j % 2 ? 60 : 0)} y={j * (PH + 40)}>
          <Panel seed={`e1-${i}-${j}`} fc={fc} target={i === 0 && j === 0} />
        </At>,
      );
    }
  }
  return (
    <Stage cam={cam} seed="e1">
      {/* The wall of chaos: freezes and desaturates at 4 s */}
      <div style={{filter: `grayscale(${gray})`, opacity: interpolate(gray, [0, 1], [1, 0.45])}}>{panels}</div>
      <At x={0} y={textY}>
        <div
          style={{
            ...glass('lg'),
            borderRadius: 36,
            padding: L.v ? '40px 46px' : '36px 60px',
            width: L.v ? 860 : 1160,
            textAlign: 'center',
            ...type.display,
            fontSize: L.v ? 80 : 84,
            color: C.ink,
            opacity: ramp(f, ev.text - 6, 10),
          }}
        >
          {words.map((w, i) => {
            const s = ev.text + i * 3;
            const p = sp(f, fps, 'settle', s);
            return (
              <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: ramp(f, s, 12), translate: `0px ${(1 - p) * 0.35}em`, filter: `blur(${(1 - p) * 6}px)`}}>
                {w}
                {i < words.length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </div>
      </At>
      {/* The black dot the camera will dive into */}
      <At x={0} y={dotY}>
        <div style={{width: 52, height: 52, borderRadius: 52, background: C.ink, opacity: ramp(f, ev.dot, 6), scale: 0.95 + 0.05 * dot}} />
      </At>
    </Stage>
  );
};
