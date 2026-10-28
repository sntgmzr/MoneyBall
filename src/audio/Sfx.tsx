import {Audio} from '@remotion/media';
import {interpolate, Sequence, staticFile} from 'remotion';
import cues from '../../data/cue_sheet.json';
import {voiceFrames} from '../voice';

// Every effect comes from cue_sheet.json, placed on its exact frame.
export const Sfx = () => (
  <>
    {cues.map((c: {frame: number; sfx: string; vol: number; evento: string; dur?: number}, i) => (
      <Sequence key={i} name={`SFX ${c.evento}`} from={c.frame} durationInFrames={c.dur ?? 150} layout="none">
        <Audio src={staticFile(`sfx/${c.sfx}.wav`)} volume={c.vol} />
      </Sequence>
    ))}
    <Music />
  </>
);

const MUSIC = 10 ** (-24 / 20); // −24 dB under the voice
const DUCK = 10 ** (-4 / 20); // another −4 dB while someone speaks

const Music = () => (
  <Audio
    src={staticFile('audio/music.wav')}
    volume={(f) => {
      let duck = 0;
      for (const v of voiceFrames) duck = Math.max(duck, interpolate(f, [v.f0 - 6, v.f0, v.f1, v.f1 + 6], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
      return MUSIC * (1 - duck * (1 - DUCK));
    }}
  />
);
