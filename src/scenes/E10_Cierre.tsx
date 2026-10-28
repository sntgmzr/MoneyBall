import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {At, Stage, useCam} from '../camera/Camera';
import {Icon, type IconName} from '../components/Icon';
import {Glass} from '../components/ui';
import {datos} from '../format';
import {useLayout} from '../layout';
import {EV, SCENES} from '../timeline';
import {C, clamp, glass, ramp, sp, type} from '../theme';

const ev = EV.E10;
const TILE_ICONS: IconName[] = ['trendDown', 'person', 'trendDown', 'drop', 'umbrella', 'coins', 'clock', 'lockOpen', 'shield'];
export const DISCLAIMER =
  'Esto no es consejo de inversión. Resultados pasados, incluidos los de backtest, no garantizan resultados futuros. Puedes perder dinero. Prueba en curso.';

export const E10Cierre = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const L = useLayout();
  const c = L.cy;
  const tw = 300;
  const th = 220;
  const tiles = SCENES.slice(0, 9).map((s, i) => ({s, x: ((i % 3) - 1) * (tw + 40), y: c + (Math.floor(i / 3) - 1) * (th + 40)}));
  const last = tiles[8];
  const cam = useCam({
    shots: [
      {at: 0, x: last.x, y: last.y, s: 3.4},
      {at: ev.zoomOut, x: 0, y: c, s: L.v ? 0.95 : 0.9},
    ],
    drift: {vx: -6, vy: -4, rot: 0},
    // Nearly still for the legal notice: under 3 px/s.
    read: [[ev.logo, 260, 0.92]],
  });
  const dim = ramp(f, ev.dim, 24);
  const logo = sp(f, fps, 'settle', ev.logo);
  const words = 'Transparente. Medido. Paso a paso.'.split(' ');
  const hud = (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: L.v ? 560 : 150}}>
      <div
        style={{
          ...type.display,
          fontSize: L.v ? 104 : 120,
          color: C.ink,
          opacity: ramp(f, ev.logo, 14),
          scale: 0.94 + 0.06 * logo,
          filter: `blur(${(1 - logo) * 16}px)`,
          whiteSpace: 'nowrap',
        }}
      >
        {datos.proyecto}
      </div>
      <div style={{...type.body, fontSize: L.v ? 46 : 42, color: C.ink2, marginTop: 18, fontWeight: 500}}>
        {words.map((w, i) => (
          <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: ramp(f, ev.tagline + i * 3, 12), translate: `0px ${(1 - sp(f, fps, 'settle', ev.tagline + i * 3)) * 14}px`}}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
      <div style={{marginTop: L.v ? 90 : 60, width: L.v ? 900 : 1300}}>
        <Glass at={ev.legal} size="lg" style={{padding: L.v ? '34px 40px' : '28px 44px'}}>
          <div style={{...type.body, fontSize: L.v ? 42 : 36, color: C.ink, fontWeight: 500, textAlign: 'center'}}>{DISCLAIMER}</div>
        </Glass>
      </div>
    </div>
  );
  return (
    <Stage cam={cam} seed="e10" hud={hud}>
      <div style={{opacity: interpolate(dim, [0, 1], [1, 0.22], clamp), filter: `blur(${dim * 4}px)`}}>
        {tiles.map(({s, x, y}, i) => (
          <At key={s.id} x={x} y={y}>
            <div style={{...glass('sm'), width: tw, height: th, borderRadius: 24, padding: 22, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
              <Icon name={TILE_ICONS[i]} size={56} color={i === 8 ? C.accent : C.ink2} />
              <div style={{...type.body, fontSize: 26, fontWeight: 600, color: C.ink}}>{s.name}</div>
            </div>
          </At>
        ))}
      </div>
    </Stage>
  );
};
