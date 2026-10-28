import {Pie} from '@remotion/shapes';
import {random, useCurrentFrame, useVideoConfig} from 'remotion';
import {At, Stage, useCam} from '../camera/Camera';
import {House} from '../components/House';
import {Icon} from '../components/Icon';
import {Ficha, Glass, Label, Tag, Title} from '../components/ui';
import {datos} from '../format';
import {useLayout} from '../layout';
import {EV} from '../timeline';
import {C, EASE, FONT, ramp, sp, type} from '../theme';

const ev = EV.E5;
const ARM = 380;
const STRING = 230;
const deg = Math.PI / 180;

export const E05Cartera = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const c = L.cy;
  const pivot = {x: 0, y: c - 260};
  // Off balance, then settles with `momentum` (it really was swinging).
  const theta = 9 * (1 - sp(f, fps, 'momentum', ev.beam));
  const end = (side: -1 | 1) => ({x: side * ARM * Math.cos(theta * deg), y: pivot.y + side * ARM * Math.sin(theta * deg)});
  const panL = {x: end(-1).x, y: end(-1).y + STRING};
  const panR = {x: end(1).x, y: end(1).y + STRING};
  const seal = {x: 0, y: c + 440};
  const startPan = {x: -ARM * Math.cos(9 * deg), y: pivot.y - ARM * Math.sin(9 * deg) + STRING};
  const cam = useCam({
    shots: [
      {at: 0, x: startPan.x, y: startPan.y - 95, s: 2.6},
      {at: ev.zoomOut, x: 0, y: c + 110, s: L.v ? 0.86 : 0.7},
      {at: ev.toSeal, x: seal.x, y: seal.y, s: 1.4},
    ],
    drift: {vx: 10, vy: 8, rot: 0.5},
    read: [[ev.title, ev.title + 80]],
  });
  const u = datos.estrategia.universo;
  const houseOut = ramp(f, 26, 12);
  const chipsIn = (k: number) => sp(f, fps, 'snappy', 34 + k * 2);
  const Pan = ({p, syms, color, label}: {p: {x: number; y: number}; syms: string[]; color: string; label: string}) => (
    <>
      <svg style={{position: 'absolute', overflow: 'visible'}} width="1" height="1">
        <line x1={p.x} y1={p.y - STRING} x2={p.x - 120} y2={p.y} stroke={C.g3} strokeWidth="3" />
        <line x1={p.x} y1={p.y - STRING} x2={p.x + 120} y2={p.y} stroke={C.g3} strokeWidth="3" />
        <path d={`M ${p.x - 150} ${p.y} Q ${p.x} ${p.y + 70} ${p.x + 150} ${p.y} Z`} fill="#fff" stroke={C.ink} strokeWidth="5" />
      </svg>
      <At x={p.x} y={p.y - 45}>
        <div style={{display: 'flex', gap: 6}}>
          {syms.map((s, k) => (
            <div key={s} style={{opacity: ramp(f, 34 + k * 2, 7), scale: 0.95 + 0.05 * chipsIn(k)}}>
              <Ficha sym={s} size={80} ring={color} />
            </div>
          ))}
        </div>
      </At>
      <At x={p.x} y={p.y + 80}>
        <Label size={L.v ? 40 : 34} color={color} weight={700} style={{opacity: ramp(f, 44, 10)}}>
          {label}
        </Label>
      </At>
    </>
  );
  const stamp = sp(f, fps, 'snappy', ev.seal);
  return (
    <Stage cam={cam} seed="e5" hud={<Title text="Compra a los fuertes. Apuesta contra los débiles." at={ev.title} size={L.v ? 64 : 62} />}>
      {/* Beam */}
      <At x={pivot.x} y={pivot.y}>
        <div style={{width: ARM * 2 + 20, height: 14, borderRadius: 7, background: C.ink, rotate: `${theta}deg`}} />
      </At>
      <At x={pivot.x} y={pivot.y + 130}>
        <svg width="120" height="260" style={{overflow: 'visible'}}>
          <path d="M60 0 L60 230 M10 250 H110" stroke={C.ink} strokeWidth="10" strokeLinecap="round" />
        </svg>
      </At>
      <At x={pivot.x} y={pivot.y}>
        <div style={{width: 34, height: 34, borderRadius: 34, background: '#fff', border: `8px solid ${C.ink}`}} />
      </At>
      <Pan p={panL} syms={[u[0], u[2], u[8]]} color={C.accent} label="Compra" />
      <Pan p={panR} syms={[u[5], u[18], u[19]]} color={C.neg} label="En contra" />
      {/* The house from E4 is the left pan's first load */}
      <At x={panL.x} y={panL.y - 160} style={{opacity: 1 - houseOut}}>
        <div style={{width: 0, height: 0, scale: 0.42}}>
          <House />
        </div>
      </At>
      {/* Line icons */}
      {[
        {icon: 'umbrella' as const, text: 'Protección', x: -230, at: ev.icons},
        {icon: 'glasses' as const, text: 'Sin depender del mercado', x: 230, at: ev.icons + 6},
      ].map((it) => (
        <At key={it.icon} x={it.x} y={c + 200}>
          <Glass at={it.at} preset="snappy" style={{padding: '18px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: L.v ? 380 : 420}}>
            <Icon name={it.icon} size={70} color={C.ink} />
            <Label size={L.v ? 34 : 30} color={C.ink} style={{whiteSpace: 'normal', textAlign: 'center'}}>
              {it.text}
            </Label>
          </Glass>
        </At>
      ))}
      {/* 50/50 donut */}
      <At x={-330} y={seal.y}>
        <div style={{opacity: ramp(f, ev.donut, 8), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
          <svg width="190" height="190" viewBox="-95 -95 190 190" style={{overflow: 'visible'}}>
            <circle r="80" fill="none" stroke={C.g1} strokeWidth="22" />
            <g transform="translate(-80 -80)">
              <Pie radius={80} progress={0.5 * ramp(f, ev.donut, 30, EASE.inOut)} closePath={false} fill="none" stroke={C.accent} strokeWidth={22} rotation={-Math.PI / 2} />
            </g>
            <g transform="translate(-80 -80)">
              <Pie radius={80} progress={0.5 * ramp(f, ev.donut + 8, 30, EASE.inOut)} closePath={false} fill="none" stroke={C.neg} strokeWidth={22} rotation={Math.PI / 2} />
            </g>
          </svg>
          <Label size={L.v ? 36 : 30} color={C.ink} weight={600}>
            50 / 50
          </Label>
        </div>
      </At>
      {/* Weight per coin */}
      <At x={330} y={seal.y}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 12, width: 200, opacity: ramp(f, ev.donut + 6, 8)}}>
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <div key={k} style={{height: 10, borderRadius: 5, background: C.g1}}>
              <div style={{height: '100%', borderRadius: 5, width: `${(30 + random(`w${k}`) * 60) * ramp(f, ev.donut + 10 + k * 2, 18)}%`, background: k < 3 ? C.accent : C.neg, opacity: 0.8}} />
            </div>
          ))}
          <Tag at={ev.donut + 14} style={{alignSelf: 'flex-start'}}>ilustrativo</Tag>
        </div>
      </At>
      {/* 1x seal — the camera will dive into it */}
      <At x={seal.x} y={seal.y}>
        <div
          style={{
            width: 280,
            height: 280,
            borderRadius: 280,
            border: `8px solid ${C.ink}`,
            boxShadow: `inset 0 0 0 10px #fff, inset 0 0 0 13px ${C.ink}`,
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: ramp(f, ev.seal, 6),
            scale: 0.95 + 0.05 * stamp,
            rotate: `${-8 + 4 * stamp}deg`,
          }}
        >
          <div style={{...type.display, fontSize: 110, lineHeight: 0.9, color: C.ink}}>{datos.estrategia.apalancamiento}</div>
          <div style={{fontFamily: FONT.sans, fontWeight: 700, fontSize: 26, lineHeight: 1.1, letterSpacing: '0.01em', color: C.ink, textAlign: 'center', maxWidth: 210}}>sin apalancamiento</div>
        </div>
      </At>
    </Stage>
  );
};
