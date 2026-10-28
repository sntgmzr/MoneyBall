import {evolvePath, getLength, getPointAtLength} from '@remotion/paths';
import {interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {At, Stage, useCam} from '../camera/Camera';
import {Icon} from '../components/Icon';
import {Glass, Label, Tag, Title, countTo} from '../components/ui';
import {corte, datos, fmtUsd, isPending} from '../format';
import {useLayout} from '../layout';
import {EV} from '../timeline';
import {C, FONT, clamp, ramp, sp, type} from '../theme';

const ev = EV.E7;
const pp = datos.paper;
const bt = datos.backtest;
const DAYS = 2;
const N = 48;

// Example equity path (PENDIENTE): seeded walk that ends at the real result.
const curve = (() => {
  const raw = pp.curva as unknown;
  if (Array.isArray(raw)) return raw as number[];
  const pts: number[] = [];
  let v = 0;
  for (let i = 0; i <= N; i++) {
    pts.push(v);
    v += (random(`pc${i}`) - 0.48) * 0.12;
  }
  const end = pts[N];
  return pts.map((p, i) => p + ((pp.resultado_pct - end) * i) / N);
})();

export const E07Paper = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const c = L.cy;
  const base = c + (L.v ? 330 : 120);
  const X0 = -760;
  const X1 = 760;
  const kY = L.v ? 150 : 120; // px per 1 %
  const xOf = (i: number) => X0 + ((X1 - X0) * i) / (curve.length - 1);
  // Normal lane from the backtest: ± one daily sigma × √days.
  const band = (t: number) => bt.desv_diaria_pct_costos_doble * Math.sqrt(Math.max(0.02, t));
  const lanePts = new Array(25).fill(0).map((_, i) => {
    const t = (i / 24) * DAYS;
    return {x: X0 + ((X1 - X0) * i) / 24, hi: base - (bt.media_diaria_pct_costos_doble * t + band(t)) * kY, lo: base - (bt.media_diaria_pct_costos_doble * t - band(t)) * kY};
  });
  const laneD = 'M ' + lanePts.map((p) => `${p.x} ${p.hi}`).join(' L ') + ' L ' + [...lanePts].reverse().map((p) => `${p.x} ${p.lo}`).join(' L ') + ' Z';
  const d = 'M ' + curve.map((v, i) => `${xOf(i)} ${base - v * kY}`).join(' L ');
  const prog = interpolate(f, [ev.draw, ev.drawEnd], [0, 1], clamp); // linear: a progress line
  const tip = getPointAtLength(d, getLength(d) * Math.max(0.001, prog))!;
  const e = evolvePath(prog, d);
  const end = {x: xOf(curve.length - 1), y: base - curve[curve.length - 1] * kY};
  const ox = L.v ? 0 : 280;
  const oy = L.v ? -230 : 40;
  const cam = useCam({
    shots: [
      {at: 0, x: ox, y: base + oy, s: 1.3},
      {at: ev.overview, x: ox / 0.8, y: base + oy - 40, s: L.v ? 0.62 : 0.66},
      {at: ev.toTip, x: end.x, y: end.y - 70, s: 1.6},
    ],
    drift: {vx: 10, vy: -9, rot: -0.3},
    read: [[ev.title, ev.cards[4] + 30]],
    follow: (fr) => ({x: tip.x, y: (tip.y - base) * 0.5, w: 1 - sp(fr, fps, 'camera', ev.overview)}),
  });
  const rise = sp(f, fps, 'settle', ev.rise);
  const card = (i: number, big: React.ReactNode, small: string, accent = false) => (
    <Glass at={ev.cards[i]} style={{padding: L.v ? '20px 26px' : '16px 24px', width: L.v ? 440 : 400}}>
      <div style={{...type.display, ...type.num, fontSize: L.v ? 68 : 56, color: accent ? C.accent : C.ink}}>{big}</div>
      <Label size={L.v ? 36 : 28}>{small}</Label>
    </Glass>
  );
  const n = (i: number, to: number, dec = 0) => countTo(f, ev.cards[i], 24, 0, to).toFixed(dec);
  const hud = (
    <>
      <Title text={`Prueba con ${fmtUsd(pp.capital_inicial_usd)} simulados: dentro del carril.`} at={ev.title} size={L.v ? 64 : 60} />
      <div
        style={{
          position: 'absolute',
          display: 'grid',
          gridTemplateColumns: L.v ? '1fr 1fr' : '1fr',
          gap: 18,
          ...(L.v ? {top: 450, left: 80, right: 80} : {top: 200, right: 70}),
        }}
      >
        {card(0, n(0, pp.ordenes), 'órdenes')}
        {card(
          1,
          <span style={{display: 'flex', alignItems: 'center', gap: 10}}>
            {n(1, pp.rechazadas)}
            <Icon name="check" size={L.v ? 54 : 46} color={C.accent} />
          </span>,
          'rechazadas',
        )}
        {card(2, `${pp.resultado_pct > 0 ? '+' : ''}${n(2, pp.resultado_pct, 2)} %`, `${fmtUsd(pp.capital_inicial_usd)} → ${fmtUsd(Math.round(countTo(f, ev.cards[2], 24, pp.capital_inicial_usd, pp.valor_usd)))}`, true)}
        {card(3, fmtUsd(Number(n(3, pp.comisiones_usd, 2)), 2), 'en comisiones')}
      </div>
      <div style={{position: 'absolute', display: 'flex', gap: 14, ...(L.v ? {top: 1370, left: 0, right: 0, justifyContent: 'center'} : {top: 175, left: 80})}}>
        <Tag at={ev.title}>{corte}</Tag>
        {isPending(pp.curva) ? (
          <Tag at={ev.title + 4} tone="warn">
            Curva de ejemplo
          </Tag>
        ) : null}
      </div>
    </>
  );
  return (
    <Stage cam={cam} seed="e7" hud={hud}>
      <svg style={{position: 'absolute', overflow: 'visible'}} width="1" height="1">
        <path d={laneD} fill={C.g1} opacity={ramp(f, 4, 16)} />
        <line x1={X0} x2={X1} y1={base} y2={base} stroke={C.g3} strokeWidth="2" strokeDasharray="6 10" />
        <path d={d} fill="none" stroke={C.ink} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={e.strokeDasharray} strokeDashoffset={e.strokeDashoffset} />
        {/* Pulsing tip */}
        {prog > 0 && f < ev.rise
          ? (() => {
              const t = ((f - ev.draw) % 24) / 24;
              return <circle cx={tip.x} cy={tip.y} r={13 + t * 26} fill="none" stroke={C.accent} strokeWidth="3" opacity={1 - t} />;
            })()
          : null}
        {prog > 0 ? <circle cx={tip.x} cy={tip.y - 70 * rise} r={13 + 21 * rise} fill={rise > 0.02 ? '#fff' : C.accent} stroke={rise > 0.02 ? C.ink : 'none'} strokeWidth={8 * rise} /> : null}
      </svg>
      <At x={X1 - 300} y={lanePts[24].lo + 60}>
        <Label size={L.v ? 40 : 30} style={{opacity: ramp(f, 10, 12)}}>
          Carril normal según el backtest
        </Label>
      </At>
      {/* Daily rebalance clock */}
      <At x={X0 + 60} y={base - (L.v ? 400 : 330)}>
        <Glass at={40} preset="snappy" style={{padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12}}>
          <Icon name="clock" size={50} color={C.ink2} />
          <Label size={L.v ? 36 : 28} color={C.ink}>
            Rebalanceo {datos.estrategia.rebalanceo.replace(/^Diario /, '').replace(' (México)', '')}
          </Label>
        </Glass>
      </At>
      {/* Order ticker (illustrative, no amounts) */}
      <At x={X0 + 620} y={base - (L.v ? 300 : 240)}>
        <div style={{width: 560, height: 150, overflow: 'hidden', opacity: ramp(f, 50, 12) * 0.9}}>
          <div style={{translate: `0px ${-((f * 1.2) % 50)}px`}}>
            {new Array(6).fill(0).map((_, i) => {
              const k = Math.floor(f / 42) + i;
              const sym = datos.estrategia.universo[Math.floor(random(`o${k}`) * 20)];
              return (
                <div key={i} style={{display: 'flex', gap: 22, height: 50, alignItems: 'center', fontFamily: FONT.sans, fontSize: 30, color: C.ink2}}>
                  <span style={{fontWeight: 700, color: C.ink, width: 110}}>{sym}</span>
                  <span style={{width: 130}}>{random(`b${k}`) > 0.5 ? 'compra' : 'venta'}</span>
                  <span style={{color: C.accent}}>ok</span>
                </div>
              );
            })}
          </div>
        </div>
      </At>
      <At x={X0 + 620} y={base - (L.v ? 190 : 130)}>
        <Tag at={52}>órdenes · ilustrativo</Tag>
      </At>
    </Stage>
  );
};
