import {getPointAtLength, getLength, evolvePath} from '@remotion/paths';
import {useCurrentFrame} from 'remotion';
import {At, Stage, useCam} from '../camera/Camera';
import {CHEVRON, House, HOUSE_R} from '../components/House';
import {Icon} from '../components/Icon';
import {Glass, Label, Tag, Title, countTo} from '../components/ui';
import {useLayout} from '../layout';
import {EV} from '../timeline';
import {C, EASE, FONT, ramp, type} from '../theme';

const ev = EV.E4;

export const E04Funding = () => {
  const f = useCurrentFrame();
  const L = useLayout();
  const c = L.cy;
  const apex = {x: 0, y: c - 300};
  const houseC = {x: 0, y: apex.y + 40 + HOUSE_R};
  const houseBottom = houseC.y + HOUSE_R;
  const peopleY = c + 380;
  const people = [-300, 0, 300];
  const cam = useCam({
    shots: [
      {at: 0, x: apex.x, y: apex.y + CHEVRON.h / 2, s: 1.5},
      {at: ev.zoomOut, x: 0, y: c, s: L.v ? 0.86 : 0.74},
      {at: ev.panDown, y: c + 120},
      {at: ev.panUp, y: c - 40},
      {at: ev.toHouse, x: houseC.x, y: houseC.y, s: 1.25},
    ],
    drift: {vx: -9, vy: 10, rot: -0.3},
    read: [[ev.title, ev.title + 60]],
  });
  const paths = people.map((x) => `M ${x} ${peopleY - 70} C ${x} ${peopleY - 260}, 0 ${houseBottom + 200}, 0 ${houseBottom + 10}`);
  const side = L.v ? {x: 270, y: c - 470} : {x: 600, y: c - 120};
  return (
    <Stage cam={cam} seed="e4" hud={<Title text="Funding: cobrar la renta." at={ev.title} />}>
      <svg style={{position: 'absolute', overflow: 'visible'}} width="1" height="1">
        {paths.map((d, i) => {
          const e = evolvePath(ramp(f, ev.people + 10 + i * 4, 30, EASE.inOut), d);
          return <path key={i} d={d} fill="none" stroke={C.g2} strokeWidth="4" strokeDasharray={e.strokeDasharray} strokeDashoffset={e.strokeDashoffset} />;
        })}
        {/* Rent payments travelling to the bot */}
        {new Array(ev.payCount).fill(0).map((_, k) => {
          const at = ev.paysFrom + k * ev.payEvery;
          const t = ramp(f, at, ev.payTravel, EASE.inOut);
          if (f < at || t >= 1) return null;
          const d = paths[k % 3];
          const pt = getPointAtLength(d, getLength(d) * t);
          return <circle key={k} cx={pt!.x} cy={pt!.y} r="13" fill={C.accent} opacity={Math.min(1, t * 6)} />;
        })}
      </svg>
      <At x={apex.x} y={apex.y} style={{translate: '0 0'}}>
        <House />
      </At>
      {people.map((x, i) => (
        <At key={i} x={x} y={peopleY}>
          <Glass at={ev.people + i * 4} preset="snappy" style={{padding: '16px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
            <Icon name="person" size={84} color={C.ink2} />
            <Label size={L.v ? 34 : 28}>con préstamo</Label>
          </Glass>
        </At>
      ))}
      {/* Decorative "rent per hour" counter */}
      <At x={side.x} y={side.y}>
        <Glass at={ev.title + 10} style={{padding: '20px 26px', width: 330}}>
          <Label size={L.v ? 32 : 26}>Renta por hora</Label>
          <div style={{...type.num, fontFamily: FONT.sans, fontWeight: 700, fontSize: 52, color: C.g3}}>+{countTo(f, ev.title + 14, 120, 0, 0.0125).toFixed(4)}</div>
          <Tag at={ev.title + 16} style={{display: 'inline-block', marginTop: 8}}>ilustrativo</Tag>
        </Glass>
      </At>
      {/* Flow diagram */}
      <At x={-side.x} y={side.y}>
        <Glass at={ev.title + 18} style={{padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 14}}>
          <Icon name="person" size={56} color={C.ink2} />
          <svg width="70" height="20"><path d="M2 10H62M52 2L64 10L52 18" fill="none" stroke={C.g3} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <Icon name="drop" size={56} color={C.accent} />
          <svg width="70" height="20"><path d="M2 10H62M52 2L64 10L52 18" fill="none" stroke={C.g3} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div style={{...type.display, fontSize: 44, color: C.ink}}>Bot</div>
        </Glass>
      </At>
    </Stage>
  );
};
