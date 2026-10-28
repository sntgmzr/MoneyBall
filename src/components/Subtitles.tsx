import {useCurrentFrame} from 'remotion';
import {useLayout} from '../layout';
import {C, glass, ramp, type} from '../theme';
import {voiceFrames} from '../voice';

// Burned-in subtitles on a glass card, synced to the voice script.
export const Subtitles = () => {
  const f = useCurrentFrame();
  const L = useLayout();
  const cur = voiceFrames.find((v) => f >= v.f0 && f < v.f1 + 6);
  if (!cur) return null;
  const inP = ramp(f, cur.f0, 8);
  const outP = ramp(f, cur.f1, 6);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: L.subBottom,
        display: 'flex',
        justifyContent: 'center',
        opacity: inP * (1 - outP),
        translate: `0px ${(1 - inP) * 12}px`,
      }}
    >
      <div
        style={{
          ...glass('sm'),
          ...type.body,
          fontSize: L.v ? 42 : 34,
          fontWeight: 600,
          color: C.ink,
          textAlign: 'center',
          maxWidth: L.v ? 940 : 1300,
          padding: L.v ? '18px 30px' : '14px 30px',
          borderRadius: 24,
        }}
      >
        {cur.text}
      </div>
    </div>
  );
};
