import {CameraMotionBlur} from '@remotion/motion-blur';
import {linearTiming, springTiming, TransitionSeries} from '@remotion/transitions';
import type React from 'react';
import {Fragment} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sfx} from './audio/Sfx';
import {Subtitles} from './components/Subtitles';
import {SCENE_COMPONENTS} from './scenes';
import {SPRINGS, EASE} from './theme';
import {SCENES, sceneStart, seqFrames, type TransitionKind} from './timeline';
import {matchCut, pullBack, wipe, whip, zoomThrough} from './transitions/presentations';

const presentation = (kind: TransitionKind) => {
  switch (kind) {
    case 'zoomThrough':
      return zoomThrough();
    case 'whip':
      return whip('x');
    case 'whipDown':
      return whip('y');
    case 'matchCut':
      return matchCut();
    case 'pullBack':
      return pullBack();
    case 'wipe':
      return wipe();
  }
};

const timing = (kind: TransitionKind, frames: number) =>
  kind === 'whip' || kind === 'whipDown'
    ? // Whip pans land with the `momentum` spring: there really was momentum.
      springTiming({config: SPRINGS.momentum, durationInFrames: frames})
    : linearTiming({durationInFrames: frames, easing: kind === 'wipe' ? EASE.drawer : EASE.inOut});

// Fast moves (whip pans, zoom-throughs) get real camera motion blur.
const FAST = SCENES.flatMap((s, i) => {
  if (!s.out || !['whip', 'whipDown', 'zoomThrough'].includes(s.out.kind)) return [];
  const next = SCENES[i + 1];
  const at = sceneStart(next.id);
  return [[at, at + s.out.frames] as const];
});

const Series = () => (
  <TransitionSeries>
    {SCENES.map((s) => {
      const Comp = SCENE_COMPONENTS[s.id];
      return (
        <Fragment key={s.id}>
          <TransitionSeries.Sequence name={`${s.id} ${s.name}`} durationInFrames={seqFrames(s)}>
            <Comp />
          </TransitionSeries.Sequence>
          {s.out ? <TransitionSeries.Transition presentation={presentation(s.out.kind)} timing={timing(s.out.kind, s.out.frames)} /> : null}
        </Fragment>
      );
    })}
  </TransitionSeries>
);

const MaybeBlur = ({children}: {children: React.ReactNode}) => {
  const f = useCurrentFrame();
  const fast = FAST.some(([a, b]) => f >= a && f < b);
  return fast ? (
    <CameraMotionBlur samples={6} shutterAngle={120}>
      {children}
    </CameraMotionBlur>
  ) : (
    <>{children}</>
  );
};

export const TradingMoneyBall = () => (
  <AbsoluteFill style={{background: '#fff'}}>
    <MaybeBlur>
      <Series />
    </MaybeBlur>
    <Subtitles />
    <Sfx />
  </AbsoluteFill>
);
