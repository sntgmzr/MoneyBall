import {useCurrentFrame, useVideoConfig} from 'remotion';
import {At, Stage, useCam} from '../camera/Camera';
import {Icon, type IconName} from '../components/Icon';
import {Glass, Label, Tag, Title} from '../components/ui';
import {corte, datos, fmtUsd} from '../format';
import {useLayout} from '../layout';
import {EV} from '../timeline';
import {C, ramp, sp, type} from '../theme';

const ev = EV.E9;
const ICONS: IconName[] = ['trendDown', 'trendDown', 'noLever', 'key', 'hand', 'paper'];

export const E09Reglas = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const c = L.cy;
  const cols = L.v ? 2 : 3;
  const cw = L.v ? 470 : 520;
  const ch = L.v ? 300 : 230;
  const gridPos = datos.reglas.map((_, i) => ({
    x: ((i % cols) - (cols - 1) / 2) * (cw + 30),
    y: c + (Math.floor(i / cols) - (Math.ceil(datos.reglas.length / cols) - 1) / 2) * (ch + 30) + 40,
  }));
  const light = L.v ? {x: 0, y: c + 1080} : {x: 1500, y: c + 20};
  const lim = L.v ? {x: 0, y: c + 2100} : {x: 3000, y: c + 20};
  const cam = useCam({
    shots: [
      {at: 0, x: L.v ? -40 : -80, y: c + 40, s: L.v ? 0.88 : 0.82},
      {at: ev.toLight, x: light.x, y: light.y, s: 1.15},
      {at: ev.toLimits, x: lim.x, y: lim.y, s: L.v ? 0.95 : 1},
    ],
    drift: {vx: 15, vy: 4, rot: 0.3},
    read: [
      [24, ev.toLight - 4],
      [ev.limits, 260],
    ],
  });
  const state = f < ev.amber ? 0 : f < ev.red ? 1 : 2;
  const lit = [C.accent, C.amber, C.neg];
  const lever = sp(f, fps, 'settle', ev.off);
  const hud = (
    <>
      <Title text="Reglas que no se rompen." at={6} until={ev.toLight} />
      <Title text="Si algo sale mal, se apaga solo." at={ev.title} until={ev.toLimits - 4} />
      <Title text="Límites honestos." at={ev.limits} />
    </>
  );
  return (
    <Stage cam={cam} seed="e9" hud={hud}>
      {datos.reglas.map((r, i) => (
        <At key={i} x={gridPos[i].x} y={gridPos[i].y}>
          <Glass at={ev.shields + i * ev.shieldStagger} preset="snappy" style={{width: cw, height: ch, padding: '22px 26px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10}}>
            <div style={{position: 'relative', width: 70, height: 70}}>
              <Icon name="shield" size={70} color={C.accent} style={{position: 'absolute'}} />
              <Icon name={ICONS[i]} size={30} color={C.ink} style={{position: 'absolute', left: 20, top: 18}} />
            </div>
            <Label size={L.v ? 44 : 32} color={C.ink} weight={600} style={{whiteSpace: 'normal', lineHeight: 1.25}}>
              {r}
            </Label>
          </Glass>
        </At>
      ))}
      {/* Traffic light + kill switch */}
      <At x={light.x - 200} y={light.y}>
        <div style={{width: 170, height: 440, borderRadius: 50, background: C.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', opacity: ramp(f, ev.toLight, 10)}}>
          {lit.map((col, k) => {
            const on = f >= ev.green && state === k;
            return <div key={k} style={{width: 110, height: 110, borderRadius: 110, background: on ? col : '#2A2B2E', boxShadow: on ? `0 0 40px ${col}` : 'none'}} />;
          })}
        </div>
      </At>
      <At x={light.x + 170} y={light.y - 40}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, opacity: ramp(f, ev.toLight + 6, 10)}}>
          <div style={{width: 120, height: 210, borderRadius: 30, border: `5px solid ${C.ink}`, position: 'relative', background: '#fff'}}>
            <div style={{position: 'absolute', left: 18, right: 18, height: 80, borderRadius: 18, background: f >= ev.off ? C.neg : C.ink, top: 18 + lever * 94}} />
          </div>
          <Label size={L.v ? 44 : 34} color={f >= ev.off ? C.neg : C.ink2} weight={700} style={{opacity: ramp(f, ev.off, 8)}}>
            se apaga solo
          </Label>
        </div>
      </At>
      <At x={light.x} y={light.y + 380}>
        <Glass at={ev.watch} style={{padding: '18px 26px', display: 'flex', alignItems: 'center', gap: 14, width: L.v ? 820 : 760}}>
          <Icon name="eye" size={52} color={C.ink2} />
          <Label size={L.v ? 36 : 28} color={C.ink} style={{whiteSpace: 'normal'}}>
            Cada mañana, una revisión automática pone el semáforo en una bitácora pública.
          </Label>
        </Glass>
      </At>
      {/* Honest limits */}
      <At x={lim.x} y={lim.y}>
        <Glass at={ev.limits} size="lg" style={{padding: L.v ? '34px 40px' : '30px 40px', width: L.v ? 900 : 1100}}>
          {[
            `${datos.estrategia.exchange} no ejecuta órdenes menores a ${fmtUsd(datos.minimo_orden_usd)}.`,
            `Con poco capital algunas órdenes se saltan: se recomienda alrededor de ${fmtUsd(datos.capital_recomendado_usd)} USD o más.`,
            'Las comisiones existen y se comen parte de la ganancia.',
            'Puede tener semanas y meses malos.',
          ].map((t, i) => (
            <div key={i} style={{display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 18, opacity: ramp(f, ev.limits + 6 + i * 4, 10)}}>
              <div style={{width: 14, height: 14, borderRadius: 14, background: C.amber, marginTop: 18, flexShrink: 0}} />
              <div style={{...type.body, fontSize: L.v ? 42 : 36, color: C.ink, fontWeight: 500}}>{t}</div>
            </div>
          ))}
          <Tag at={ev.limits + 20} style={{display: 'inline-block'}}>
            {corte}
          </Tag>
        </Glass>
      </At>
    </Stage>
  );
};
