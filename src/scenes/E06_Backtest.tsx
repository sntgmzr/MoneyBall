import {evolvePath} from '@remotion/paths';
import {interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {At, Stage, useCam} from '../camera/Camera';
import {Glass, Label, Tag, Title, countTo} from '../components/ui';
import {backtestMonths, corte, datos, fmtMonth, fmtMonthShort, fmtPct, isPending} from '../format';
import {useLayout} from '../layout';
import {EV} from '../timeline';
import {C, EASE, clamp, ramp, sp, type} from '../theme';

const ev = EV.E6;
const bt = datos.backtest;

// Monthly series: real data when exported, neutral example bars otherwise.
const months = backtestMonths();
const worst = months.indexOf(bt.peor_mes);
const series: number[] = (() => {
  const raw = bt.mensual as unknown;
  if (Array.isArray(raw)) return raw.map((m: {costos_x2_pct: number}) => m.costos_x2_pct);
  const vals = months.map((_, i) => (random(`bt${i}`) - 0.32) * 7);
  vals[worst] = Math.min(...vals) - 2.5;
  return vals;
})();
const example = isPending(bt.mensual);

export const E06Backtest = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const c = L.cy;
  const g = 66;
  const k = L.v ? 62 : 52; // px per 1 %
  const base = c + 60;
  const xOf = (i: number) => (i - (months.length - 1) / 2) * g;
  const hw = series[worst] * k; // negative
  const ovS = L.v ? 0.56 : 0.62;
  const cam = useCam({
    shots: [
      {at: 0, x: xOf(0) + 260, y: base - 80, s: 1.25},
      {at: ev.panToWorst, x: xOf(worst), y: base - 20},
      {at: ev.zoomWorst, y: base - hw * 0.5 + 40, s: 1.7},
      {at: ev.panRight, x: xOf(months.length - 1) - 260, y: base - 80, s: 1.25},
      {at: ev.overview, x: L.v ? 0 : -300 / ovS, y: base + 40, s: ovS},
    ],
    drift: {vx: 14, vy: -5, rot: 0.25},
    read: [
      [ev.zoomWorst, ev.zoomWorst + 60],
      [ev.fix - 6, ev.fix + 80],
    ],
  });
  const growAt = (i: number) => (i <= worst ? ev.barsA + i * 3 : ev.barsB + (i - worst - 1) * 2);
  const ma = series.map((_, i) => {
    const w = series.slice(Math.max(0, i - 2), i + 1);
    return {x: xOf(i), y: base - (w.reduce((a, b) => a + b, 0) / w.length) * k};
  });
  const maD = 'M ' + ma.map((p) => `${p.x} ${p.y}`).join(' L ');
  const maE = evolvePath(ramp(f, ev.avg, 40, EASE.inOut), maD);
  const axis = ramp(f, ev.axis, 24, EASE.inOut);
  const val = f < ev.countDown ? countTo(f, ev.count, 26, 0, bt.sharpe_costos_normales) : countTo(f, ev.countDown, 18, bt.sharpe_costos_normales, bt.sharpe_costos_doble);
  const fixed = f >= ev.fix;
  const swap = ramp(f, ev.countDown, 10);
  const hud = (
    <>
      <Title text={`Backtest: ${fmtMonth(bt.inicio)} – ${fmtMonth(bt.fin)}`} at={4} until={ev.title - 10} />
      <Title text={`${bt.meses} meses · Sharpe ${bt.sharpe_costos_doble.toFixed(2)} con costos al doble.`} at={ev.title} size={L.v ? 66 : 60} />
      <div style={{position: 'absolute', ...(L.v ? {top: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center'} : {top: 230, left: 80})}}>
        <Glass at={ev.count - 8} size="lg" style={{padding: L.v ? '26px 40px' : '24px 34px', width: L.v ? 760 : 470}}>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
            <div style={{...type.display, ...type.num, fontSize: L.v ? 130 : 110, color: fixed ? C.accent : C.ink, scale: fixed ? 1 + 0.04 * (1 - sp(f, fps, 'settle', ev.fix)) : 1}}>{val.toFixed(2)}</div>
            <Label size={L.v ? 46 : 36} color={C.ink} weight={600}>
              Sharpe
            </Label>
          </div>
          <div style={{position: 'relative', height: L.v ? 66 : 50}}>
            <Label size={L.v ? 40 : 30} style={{position: 'absolute', opacity: 1 - swap}}>
              costos normales ({bt.costo_normal_bps} pb)
            </Label>
            <Label size={L.v ? 40 : 30} color={C.accent} weight={600} style={{position: 'absolute', opacity: swap, translate: `0px ${(1 - swap) * 10}px`}}>
              comisiones al doble ({bt.costo_doble_bps} pb)
            </Label>
          </div>
          <Label size={L.v ? 32 : 24} style={{marginTop: 6, whiteSpace: 'normal'}}>
            Cuánto gana por cada unidad de susto. Arriba de 1 es bueno.
          </Label>
        </Glass>
      </div>
      <div style={{position: 'absolute', ...(L.v ? {top: 1130, left: 0, right: 0, display: 'flex', justifyContent: 'center'} : {top: 660, left: 80})}}>
        <Glass at={ev.dayCard} style={{padding: '22px 30px', width: L.v ? 760 : 470}}>
          <Label size={L.v ? 40 : 30} color={C.ink} weight={600} style={{whiteSpace: 'normal'}}>
            Día promedio {fmtPct(bt.media_diaria_pct_costos_doble, 4)}, pero un día típico se mueve ±{bt.desv_diaria_pct_costos_doble.toFixed(3)} %.
          </Label>
          <Label size={L.v ? 36 : 28} style={{whiteSpace: 'normal', marginTop: 8}}>
            Por eso pocos días no dicen nada.
          </Label>
        </Glass>
      </div>
      <div style={{position: 'absolute', ...(L.v ? {top: 1380, left: 0, right: 0, display: 'flex', justifyContent: 'center'} : {top: 175, right: 80})}}>
        <Tag at={ev.count}>{corte}</Tag>
      </div>
    </>
  );
  return (
    <Stage cam={cam} seed="e6" hud={hud}>
      <svg style={{position: 'absolute', overflow: 'visible'}} width="1" height="1">
        {/* Axis: the "1x" from the last scene opens into the baseline */}
        <line x1={xOf(0) - 60} x2={xOf(0) - 60 + (months.length * g + 60) * axis} y1={base} y2={base} stroke={C.ink} strokeWidth="4" strokeLinecap="round" />
        {series.map((v, i) => {
          const p = ramp(f, growAt(i), 14);
          const h = v * k * p;
          return <rect key={i} x={xOf(i) - 22} y={h > 0 ? base - h : base} width="44" height={Math.abs(h)} rx="8" fill={v >= 0 ? C.accent : C.neg} opacity={i === worst ? 1 : v >= 0 ? 0.85 : 0.6} />;
        })}
        <path d={maD} fill="none" stroke={C.ink2} strokeWidth="3" strokeDasharray={maE.strokeDasharray} strokeDashoffset={maE.strokeDashoffset} />
      </svg>
      {/* Month ruler */}
      {months.map((m, i) =>
        (L.v ? i % 6 === 0 : i % 3 === 0) || i === worst ? (
          <At key={m} x={xOf(i)} y={base - Math.min(...series) * k + 60}>
            <div style={{...type.body, fontSize: L.v ? 62 : 40, fontWeight: i === worst ? 700 : 500, color: i === worst ? C.neg : C.ink2, opacity: ramp(f, growAt(i), 10), whiteSpace: 'nowrap'}}>{fmtMonthShort(m)}</div>
          </At>
        ) : null,
      )}
      {/* Worst month gets its own time on screen */}
      <At x={xOf(worst) + 210} y={base - hw + 10}>
        <Glass at={ev.worstLabel} preset="snappy" style={{padding: '16px 24px', borderLeft: `6px solid ${C.neg}`}} fromX={-20} fromY={0}>
          <Label size={L.v ? 40 : 32} color={C.neg} weight={700}>
            Peor mes
          </Label>
          <Label size={L.v ? 36 : 28}>{fmtMonth(bt.peor_mes)}</Label>
        </Glass>
      </At>
      <At x={xOf(0) + 120} y={base - Math.max(...series) * k - 60}>
        {example ? (
          <Tag at={ev.barsA} tone="warn">
            Datos de ejemplo
          </Tag>
        ) : null}
      </At>
      <At x={xOf(months.length - 1) - 110} y={base - Math.max(...series) * k - 60}>
        <div style={{opacity: interpolate(f, [ev.avg, ev.avg + 10], [0, 1], clamp), display: 'flex', alignItems: 'center', gap: 10}}>
          <svg width="50" height="8">
            <line x1="0" x2="50" y1="4" y2="4" stroke={C.ink2} strokeWidth="3" />
          </svg>
          <Label size={L.v ? 36 : 28}>media móvil</Label>
        </div>
      </At>
    </Stage>
  );
};
