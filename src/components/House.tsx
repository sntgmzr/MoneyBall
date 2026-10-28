import {C, FONT} from '../theme';

// The arrowhead / roof chevron shared by E3 and E4 (match cut by shape).
export const CHEVRON = {w: 120, h: 60, stroke: 22};
export const Chevron = ({color = C.accent, draw = 1}: {color?: string; draw?: number}) => (
  <svg width={CHEVRON.w + CHEVRON.stroke * 2} height={CHEVRON.h + CHEVRON.stroke * 2} viewBox={`${-CHEVRON.w / 2 - CHEVRON.stroke} ${-CHEVRON.stroke} ${CHEVRON.w + CHEVRON.stroke * 2} ${CHEVRON.h + CHEVRON.stroke * 2}`} style={{overflow: 'visible'}}>
    <polyline
      points={`${-CHEVRON.w / 2},${CHEVRON.h} 0,0 ${CHEVRON.w / 2},${CHEVRON.h}`}
      fill="none"
      stroke={color}
      strokeWidth={CHEVRON.stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - draw}
    />
  </svg>
);

// Coin-shaped house: the bot that collects the rent. Apex of the roof at (0,0).
export const HOUSE_R = 130;
export const House = ({scale = 1, label = 'Bot'}: {scale?: number; label?: string}) => (
  <div style={{position: 'relative', width: 0, height: 0, scale}}>
    <div style={{position: 'absolute', left: -CHEVRON.w / 2 - CHEVRON.stroke, top: -CHEVRON.stroke}}>
      <Chevron />
    </div>
    <div
      style={{
        position: 'absolute',
        left: -HOUSE_R,
        top: 40,
        width: HOUSE_R * 2,
        height: HOUSE_R * 2,
        borderRadius: HOUSE_R * 2,
        background: '#fff',
        border: `10px solid ${C.ink}`,
        boxSizing: 'border-box',
        boxShadow: '0 18px 50px rgba(0,0,0,0.10), inset 0 0 0 14px #fff, inset 0 0 0 17px ' + C.g2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT.serif,
        fontWeight: 600,
        fontSize: 64,
        color: C.ink,
      }}
    >
      {label}
    </div>
  </div>
);
