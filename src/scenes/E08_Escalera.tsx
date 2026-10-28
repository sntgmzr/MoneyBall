import {useCurrentFrame, useVideoConfig} from 'remotion';
import {At, Stage, useCam, type Shot} from '../camera/Camera';
import {Icon} from '../components/Icon';
import {Glass, Label, Title} from '../components/ui';
import {planSteps} from '../format';
import {useLayout} from '../layout';
import {EV} from '../timeline';
import {C, EASE, ramp, sp, type} from '../theme';

const ev = EV.E8;

// Criteria from the brief (§4). Only step 1 is unlocked: it is the only one
// that has actually happened. Later locks stay closed until their data exists.
const CRITERIA = [
  'Dinero simulado y una prueba con poco dinero',
  'Checklist de 6 puntos: si no pasa 6 de 6, no avanza',
  'El gemelo de práctica sigue al lado para comparar',
  'Con números: subir, mantener o ajustar',
];

export const E08Escalera = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const c = L.cy;
  const steps = planSteps().slice(1); // D1–D3 … D7
  const dx = L.v ? 120 : 380;
  const dy = L.v ? 390 : 250;
  const W = L.v ? 840 : 660;
  const pos = steps.map((_, k) => ({x: (k - 1.5) * dx, y: c + 1.5 * dy - k * dy + 60}));
  const lockX = -W / 2 + 80;
  const ovS = L.v ? 0.66 : 0.78;
  const shots: Shot[] = [
    {at: 0, x: pos[0].x + lockX, y: pos[0].y, s: 1.6},
    {at: ev.zoomIn, x: pos[0].x, y: pos[0].y, s: 1},
    ...ev.steps.slice(1).map((at, k) => ({at, x: pos[k + 1].x, y: pos[k + 1].y, s: 1})),
    {at: ev.overview, x: 0, y: c + 60, s: ovS},
  ];
  const cam = useCam({
    shots,
    drift: {vx: 8, vy: -12, rot: -0.3},
    read: ev.steps.map((a) => [a + 15, a + 62] as const),
  });
  const pathD = 'M ' + pos.map((p) => `${p.x - W / 2 + 80} ${p.y}`).join(' L ');
  return (
    <Stage cam={cam} seed="e8" hud={<Title text="Cada paso se gana con datos." at={20} />}>
      <svg style={{position: 'absolute', overflow: 'visible'}} width="1" height="1">
        <path d={pathD} fill="none" stroke={C.g3} strokeWidth="4" strokeDasharray="2 14" strokeLinecap="round" opacity={ramp(f, 10, 20)} />
      </svg>
      {steps.map((st, k) => {
        const at = k === 0 ? 4 : ev.steps[k] - 8;
        const open = k === 0 && f >= ev.unlock;
        const pop = sp(f, fps, 'snappy', ev.unlock);
        return (
          <At key={k} x={pos[k].x} y={pos[k].y}>
            <Glass at={at} size="lg" style={{width: W, padding: L.v ? '28px 34px' : '24px 30px', display: 'flex', gap: 26, alignItems: 'center'}}>
              <div
                style={{
                  width: 92,
                  height: 92,
                  flexShrink: 0,
                  borderRadius: 92,
                  border: `5px solid ${open ? C.accent : C.ink}`,
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  scale: open ? 1 + 0.06 * (1 - pop) : 1,
                }}
              >
                <Icon name={open ? 'lockOpen' : 'lockClosed'} size={54} color={open ? C.accent : C.ink} />
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{display: 'flex', gap: 14, alignItems: 'baseline'}}>
                  <Label size={L.v ? 34 : 26} color={C.ink2} weight={700}>
                    {st.code} · {st.dates}
                  </Label>
                  {k === 0 ? (
                    <Label size={L.v ? 32 : 24} color={C.accent} weight={700} style={{opacity: ramp(f, ev.unlock, 8)}}>
                      En curso
                    </Label>
                  ) : null}
                </div>
                <div style={{...type.display, fontSize: L.v ? 58 : 46, color: C.ink, margin: '4px 0 6px'}}>{st.label}</div>
                <Label size={L.v ? 34 : 26} style={{whiteSpace: 'normal'}}>
                  {CRITERIA[k]}
                </Label>
                {k === 1 ? (
                  <div style={{display: 'flex', gap: 10, marginTop: 12}}>
                    {new Array(6).fill(0).map((_, i) => (
                      <div key={i} style={{width: 40, height: 40, borderRadius: 10, border: `3px solid ${C.ink2}`, opacity: ramp(f, ev.checklist + i * 2, 8, EASE.out), scale: 0.95 + 0.05 * sp(f, fps, 'snappy', ev.checklist + i * 2)}} />
                    ))}
                    <Label size={L.v ? 32 : 24} color={C.ink2} style={{alignSelf: 'center', marginLeft: 6, opacity: ramp(f, ev.checklist + 14, 8)}}>
                      requiere 6/6
                    </Label>
                  </div>
                ) : null}
              </div>
            </Glass>
          </At>
        );
      })}
    </Stage>
  );
};
