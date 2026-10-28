import {random, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Cam} from '../camera/Camera';
import {C, FONT} from '../theme';

// Mid layer (0.6× camera): grey "ambient" infographics. They are decorative
// only: seeded random values, blurred, no accent color, never real bot data.
const DEPTH_MID = 0.6;
const CELL_W = 560;
const CELL_H = 460;
const COINS = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'LINK', 'SUI', 'TAO'];

const stroke = C.g2;

const Candles = ({seed, f}: {seed: string; f: number}) => {
  const n = 14;
  const shift = (f * 0.4) % 20;
  let p = 60;
  return (
    <svg width="280" height="140" style={{overflow: 'hidden'}}>
      <g transform={`translate(${-shift} 0)`}>
        {new Array(n).fill(0).map((_, i) => {
          const o = p;
          p = Math.max(20, Math.min(120, p + (random(`${seed}c${i}`) - 0.5) * 40));
          const top = Math.min(o, p);
          const h = Math.max(4, Math.abs(o - p));
          return (
            <g key={i}>
              <line x1={i * 20 + 8} x2={i * 20 + 8} y1={top - 8} y2={top + h + 8} stroke={stroke} strokeWidth="1.6" />
              <rect x={i * 20 + 3} y={top} width="10" height={h} fill={i % 3 ? stroke : 'none'} stroke={stroke} strokeWidth="1.6" />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

const Spark = ({seed, f}: {seed: string; f: number}) => {
  let y = 50;
  const pts = new Array(40).fill(0).map((_, i) => {
    y = Math.max(8, Math.min(92, y + (random(`${seed}s${i}`) - 0.5) * 18));
    return `${i * 12 - ((f * 0.5) % 12)},${y}`;
  });
  return (
    <svg width="300" height="100" style={{overflow: 'hidden'}}>
      <polyline points={pts.join(' ')} fill="none" stroke={stroke} strokeWidth="2" />
      <line x1="0" x2="300" y1="98" y2="98" stroke={C.g1} strokeWidth="2" />
    </svg>
  );
};

const Ticker = ({seed, f}: {seed: string; f: number}) => {
  const rows = 9;
  const off = (f * 0.6) % 26;
  return (
    <div style={{height: 150, overflow: 'hidden', fontFamily: FONT.sans, fontSize: 18, color: stroke, filter: 'blur(1.6px)'}}>
      <div style={{translate: `0px ${-off}px`}}>
        {new Array(rows).fill(0).map((_, i) => (
          <div key={i} style={{display: 'flex', gap: 26, height: 26}}>
            <span>{COINS[Math.floor(random(`${seed}t${i}`) * COINS.length)]}</span>
            <span>{(random(`${seed}v${i}`) * 90).toFixed(2)}</span>
            <span>{(random(`${seed}w${i}`) * 9).toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Radar = ({f}: {f: number}) => (
  <svg width="170" height="170" viewBox="-85 -85 170 170">
    {[30, 55, 80].map((r) => (
      <circle key={r} r={r} fill="none" stroke={stroke} strokeWidth="1.6" />
    ))}
    <line x1="-80" x2="80" y1="0" y2="0" stroke={C.g1} strokeWidth="1.6" />
    <line y1="-80" y2="80" x1="0" x2="0" stroke={C.g1} strokeWidth="1.6" />
    <line x1="0" y1="0" x2="80" y2="0" stroke={stroke} strokeWidth="2" transform={`rotate(${f * 1.2})`} />
  </svg>
);

const Pill = ({seed}: {seed: string}) => (
  <div style={{display: 'flex', gap: 12, fontFamily: FONT.sans, fontWeight: 600, fontSize: 24, color: stroke}}>
    <span style={{border: `1.6px solid ${stroke}`, borderRadius: 20, padding: '4px 14px'}}>
      {COINS[Math.floor(random(`${seed}p`) * COINS.length)]}
    </span>
    <span style={{filter: 'blur(1.6px)', padding: '4px 0'}}>
      {random(`${seed}q`) > 0.5 ? '+' : '−'}
      {(random(`${seed}r`) * 9).toFixed(1)}%
    </span>
  </div>
);

const KINDS = [Candles, Spark, Ticker, Radar, Pill] as const;

export const Ambient = ({cam, seed}: {cam: Cam; seed: string}) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const s = 1 + (cam.s - 1) * DEPTH_MID;
  const cx = cam.x * DEPTH_MID;
  const cy = cam.y * DEPTH_MID;
  const hw = width / 2 / s + CELL_W;
  const hh = height / 2 / s + CELL_H;
  const cells = [];
  for (let i = Math.floor((cx - hw) / CELL_W); i <= Math.ceil((cx + hw) / CELL_W); i++) {
    for (let j = Math.floor((cy - hh) / CELL_H); j <= Math.ceil((cy + hh) / CELL_H); j++) {
      const k = `${seed}:${i}:${j}`;
      if (random(k) < 0.35) continue; // leave air
      const Kind = KINDS[Math.floor(random(k + 'k') * KINDS.length)];
      cells.push(
        <div
          key={k}
          data-role="decorativo"
          style={{
            position: 'absolute',
            left: i * CELL_W + random(k + 'x') * 200,
            top: j * CELL_H + random(k + 'y') * 180,
            opacity: 0.4 + random(k + 'o') * 0.2,
            filter: 'blur(0.8px)',
          }}
        >
          <Kind seed={k} f={f} />
        </div>,
      );
    }
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: width / 2,
        top: height / 2,
        transform: `rotate(${cam.r * DEPTH_MID}deg) scale(${s}) translate(${-cx}px, ${-cy}px)`,
      }}
    >
      {cells}
    </div>
  );
};
