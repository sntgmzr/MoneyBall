import {evolvePath} from '@remotion/paths';
import {interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {At, Stage, useCam} from '../camera/Camera';
import {Ficha, Glass, Title} from '../components/ui';
import {datos} from '../format';
import {useLayout} from '../layout';
import {EV} from '../timeline';
import {C, EASE, FONT, clamp, ramp, sp} from '../theme';

const ev = EV.E2;

// A scout's stat sheet that fills itself in.
const ScoutSheet = ({at, rows = 5}: {at: number; rows?: number}) => {
  const f = useCurrentFrame();
  return (
    <Glass at={at} style={{padding: 24, width: 300}}>
      {new Array(rows).fill(0).map((_, i) => (
        <div key={i} style={{display: 'flex', alignItems: 'center', gap: 12, height: 34}}>
          <div style={{width: 40, height: 10, borderRadius: 5, background: C.g2}} />
          <div style={{flex: 1, height: 10, borderRadius: 5, background: C.g1, overflow: 'hidden'}}>
            <div style={{width: `${ramp(f, at + 8 + i * 4, 24, EASE.out) * (40 + random(`sc${at}${i}`) * 60)}%`, height: '100%', background: C.g3}} />
          </div>
        </div>
      ))}
    </Glass>
  );
};

export const E02Idea = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const coins = datos.estrategia.universo;
  const BW = L.v ? 900 : 1400;
  const BH = L.v ? 1000 : 760;
  const cam = useCam({
    shots: [
      {at: 0, x: 0, y: L.cy, s: 1.5},
      {at: 2, s: L.ov, preset: 'momentum'},
      {at: ev.sort, x: L.v ? 40 : 90, preset: 'camera'},
    ],
    drift: {vx: 11, vy: 8, rot: 0.3},
    read: [[ev.title, ev.title + 60]],
  });
  // Final standings grid: 4×5 (vertical) or 5×4 (horizontal).
  const cols = L.v ? 4 : 5;
  const gx = L.v ? 190 : 230;
  const gy = L.v ? 165 : 150;
  const rows = Math.ceil(coins.length / cols);
  return (
    <Stage cam={cam} seed="e2" hud={<Title text="Decidir con datos, no con emociones." at={ev.title} />}>
      {/* Tactical board seen from above */}
      <At x={0} y={L.cy + 40}>
        <div style={{width: BW, height: BH, borderRadius: 40, border: `2px solid ${C.g2}`, background: 'rgba(255,255,255,0.6)', position: 'relative'}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: '50%', borderTop: `2px solid ${C.g1}`}} />
          <div style={{position: 'absolute', left: '50%', top: '50%', width: 220, height: 220, translate: '-50% -50%', borderRadius: 220, border: `2px solid ${C.g1}`}} />
        </div>
      </At>
      {/* Scout sheets around the board */}
      <At x={-BW / 2 - (L.v ? -150 : 220)} y={L.cy - BH / 2 - (L.v ? 120 : -120)}>
        <ScoutSheet at={40} />
      </At>
      <At x={BW / 2 + (L.v ? -150 : 220)} y={L.cy + BH / 2 + (L.v ? 120 : -140)}>
        <ScoutSheet at={52} />
      </At>
      {coins.map((sym, i) => {
        // Scattered landing spot, then rank slot.
        const jc = L.v ? 4 : 5;
        const jr = Math.ceil(coins.length / jc);
        const sx = ((i % jc) - (jc - 1) / 2) * ((BW - 160) / jc) + (random(`x${i}`) - 0.5) * 70;
        const sy = L.cy + 40 + (Math.floor(i / jc) - (jr - 1) / 2) * ((BH - 160) / jr) + (random(`y${i}`) - 0.5) * 70;
        // Decorative order: the board shows the idea of a ranking, not real data.
        const order = [...coins.keys()].sort((a, b) => Math.floor(random(`r${a}`) * 1000) * 100 + a - (Math.floor(random(`r${b}`) * 1000) * 100 + b));
        const slot = order.indexOf(i);
        const tx = ((slot % cols) - (cols - 1) / 2) * gx;
        const ty = L.cy + 40 + (Math.floor(slot / cols) - (rows - 1) / 2) * gy;
        const dropAt = ev.chipsFrom + i * ev.chipStagger;
        const drop = sp(f, fps, 'snappy', dropAt);
        const moveAt = ev.sort + slot * ev.sortStagger;
        const px = sp(f, fps, 'settle', moveAt); // separate X and Y springs
        const py = sp(f, fps, 'settle', moveAt + 1);
        const x = interpolate(px, [0, 1], [sx, tx]);
        const y = interpolate(py, [0, 1], [sy, ty]) - (1 - drop) * 60;
        const path = `M ${sx} ${sy} Q ${(sx + tx) / 2} ${Math.min(sy, ty) - 120} ${tx} ${ty}`;
        const draw = evolvePath(ramp(f, moveAt, 26, EASE.inOut), path);
        const lineO = interpolate(f, [moveAt, moveAt + 6, moveAt + 40, moveAt + 56], [0, 0.8, 0.8, 0], clamp);
        return (
          <div key={sym}>
            {/* Dotted trajectory, revealed by an evolving mask */}
            <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width="1" height="1">
              <defs>
                <mask id={`m2-${i}`} maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="6000" height="6000">
                  <path d={path} fill="none" stroke="#fff" strokeWidth="8" strokeDasharray={draw.strokeDasharray} strokeDashoffset={draw.strokeDashoffset} />
                </mask>
              </defs>
              <path d={path} fill="none" stroke={C.g3} strokeWidth="3" strokeDasharray="1 11" strokeLinecap="round" opacity={lineO} mask={`url(#m2-${i})`} />
            </svg>
            <At x={x} y={y}>
              <div style={{opacity: ramp(f, dropAt, 6), scale: 0.95 + 0.05 * drop}}>
                <Ficha sym={sym} size={L.v ? 116 : 112} ring={f > moveAt + 10 && slot < cols ? C.accent : C.g2} />
              </div>
            </At>
            <At x={tx - (L.v ? 74 : 78)} y={ty - 50}>
              <div style={{fontFamily: FONT.sans, fontWeight: 700, fontSize: 26, color: C.g3, opacity: ramp(f, moveAt + 14, 10)}}>{slot + 1}</div>
            </At>
          </div>
        );
      })}
    </Stage>
  );
};
