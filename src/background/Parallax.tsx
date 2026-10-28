import {useVideoConfig} from 'remotion';
import type {Cam} from '../camera/Camera';
import {C} from '../theme';

const DEPTH_FAR = 0.3;

// Far layer: a 2 px dot every 32 px, moving at 0.3× the camera.
export const DotGrid = ({cam}: {cam: Cam}) => {
  const {width, height} = useVideoConfig();
  const s = 1 + (cam.s - 1) * DEPTH_FAR;
  const size = 32 * s;
  const ox = (((width / 2 - cam.x * DEPTH_FAR * s) % size) + size) % size;
  const oy = (((height / 2 - cam.y * DEPTH_FAR * s) % size) + size) % size;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(circle, ${C.g1} ${1.1 * s}px, transparent ${1.4 * s}px)`,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `${ox}px ${oy}px`,
      }}
    />
  );
};
