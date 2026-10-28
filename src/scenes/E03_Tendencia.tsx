import {evolvePath} from '@remotion/paths';
import {interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {At, Stage, useCam} from '../camera/Camera';
import {CHEVRON, Chevron} from '../components/House';
import {Ficha, Glass, Label, Tag, Title} from '../components/ui';
import {datos} from '../format';
import {useLayout} from '../layout';
import {EV} from '../timeline';
import {C, EASE, ramp, sp} from '../theme';

const ev = EV.E3;
const BUY = [0, 2, 5, 7]; // illustrative split, labelled "ilustrativo"

export const E03Tendencia = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const c = L.cy;
  const P = {x: 0, y: c - 60};
  const A = {x: 0, y: c - 380};
  const cam = useCam({
    shots: [
      {at: 0, x: -240, y: P.y, s: 1.1},
      {at: 40, x: -60, y: P.y - 60, s: 1.3},
      {at: ev.overview, x: 0, y: c + (L.v ? 80 : 40), s: L.v ? 0.82 : 0.8},
      {at: ev.toArrow, x: A.x, y: A.y + CHEVRON.h / 2, s: 1.5},
    ],
    drift: {vx: 12, vy: -7, rot: 0.3},
    read: [[ev.title, ev.title + 60]],
  });

  const horizons = datos.estrategia.senales.filter((s) => s.startsWith('ROC'));
  const lines = horizons.map((h, k) => {
    const y0 = P.y + (k - 1) * 140;
    let y = y0;
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      pts.push(`${-480 + i * 40} ${y}`);
      y = y0 + (random(`e3l${k}${i}`) - 0.5) * 70;
    }
    return {label: h.replace('ROC ', ''), y0, d: `M ${pts.join(' L ')} C ${-80} ${y}, ${-60} ${P.y}, ${P.x} ${P.y}`};
  });
  const arrowD = `M ${P.x} ${P.y} L ${A.x} ${A.y + 6}`;
  const arrowDraw = ramp(f, ev.braid, 30, EASE.inOut);
  const chips = datos.estrategia.universo.slice(0, 8);

  return (
    <Stage cam={cam} seed="e3" hud={<Title text="Tendencia: 10, 14 y 20 días." at={ev.title} />}>
      <svg style={{position: 'absolute', overflow: 'visible'}} width="1" height="1">
        {lines.map((l, k) => {
          const e = evolvePath(ramp(f, ev.lines + k * 4, 36, EASE.inOut), l.d);
          return <path key={k} d={l.d} fill="none" stroke={k === 1 ? C.ink2 : C.g3} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={e.strokeDasharray} strokeDashoffset={e.strokeDashoffset} />;
        })}
        {(() => {
          const e = evolvePath(arrowDraw, arrowD);
          return <path d={arrowD} fill="none" stroke={C.accent} strokeWidth={CHEVRON.stroke} strokeLinecap="round" strokeDasharray={e.strokeDasharray} strokeDashoffset={e.strokeDashoffset} />;
        })()}
      </svg>
      <At x={A.x} y={A.y + CHEVRON.h / 2}>
        <div style={{opacity: arrowDraw > 0.85 ? 1 : 0}}>
          <Chevron draw={ramp(f, ev.braid + 24, 10)} />
        </div>
      </At>
      {lines.map((l, k) => (
        <At key={k} x={-480} y={l.y0 - 52} style={{translate: '0% -50%'}}>
          <Tag at={ev.lines + 6 + k * 4}>{l.label}</Tag>
        </At>
      ))}

      {/* Columns */}
      {[
        {name: 'Compra', color: C.accent, x: -250},
        {name: 'En contra', color: C.neg, x: 250},
      ].map((col) => (
        <At key={col.name} x={col.x} y={c + 430}>
          <Glass at={ev.overview + 25} size="lg" style={{width: 440, height: 380, borderTop: `6px solid ${col.color}`}}>
            <Label size={L.v ? 44 : 40} color={col.color} weight={700} style={{textAlign: 'center', marginTop: 18}}>
              {col.name}
            </Label>
          </Glass>
        </At>
      ))}
      <At x={0} y={c + 660}>
        <Tag at={ev.overview + 30}>ilustrativo</Tag>
      </At>

      {/* Chips with ROC meters travel to their column */}
      {chips.map((sym, i) => {
        const buy = BUY.includes(i);
        const k = (buy ? BUY : [0, 1, 2, 3, 4, 5, 6, 7].filter((n) => !BUY.includes(n))).indexOf(i);
        const sx = (i - 3.5) * 122;
        const sy = c + 150;
        const tx = (buy ? -250 : 250) + ((k % 2) - 0.5) * 140;
        const ty = c + 430 + 50 + (Math.floor(k / 2) - 0.5) * 120;
        const enter = sp(f, fps, 'snappy', ev.chips + i * 2);
        const go = ev.travel + i * ev.travelStagger;
        const px = sp(f, fps, 'settle', go);
        const py = sp(f, fps, 'settle', go + 2);
        // Anticipation: tilt toward the destination before leaving.
        const tilt = sp(f, fps, 'snappy', ev.tilt + i) - sp(f, fps, 'settle', go + 6);
        const meter = 0.3 + random(`roc${i}`) * 0.6;
        return (
          <At key={sym} x={interpolate(px, [0, 1], [sx, tx])} y={interpolate(py, [0, 1], [sy, ty])}>
            <div style={{opacity: ramp(f, ev.chips + i * 2, 7), scale: 0.95 + 0.05 * enter, rotate: `${(buy ? -14 : 14) * tilt}deg`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
              <Ficha sym={sym} size={100} ring={f > go + 8 ? (buy ? C.accent : C.neg) : C.g2} />
              <div style={{width: 84, height: 8, borderRadius: 4, background: C.g1, opacity: 1 - px}}>
                <div style={{width: `${meter * 100 * ramp(f, ev.chips + 10 + i * 2, 20)}%`, height: '100%', borderRadius: 4, background: C.g3}} />
              </div>
              <div style={{fontSize: 22, color: C.g3, fontWeight: 600, opacity: 1 - px}}>{buy ? '+12 %' : '−8 %'}</div>
            </div>
          </At>
        );
      })}
    </Stage>
  );
};
