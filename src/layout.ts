import {useVideoConfig} from 'remotion';

// One script, two frames. World (0,0) sits at the screen center.
export const useLayout = () => {
  const {width: W, height: H} = useVideoConfig();
  const v = H > W;
  return {
    W,
    H,
    v,
    // Vertical center of the usable area, after Instagram/WhatsApp safe zones
    // (220 px top, 300 px bottom) and the subtitle card.
    cy: v ? -150 : -40,
    // Camera scale that fits a scene's overview.
    ov: v ? 0.95 : 0.8,
    titleTop: v ? 250 : 64,
    titleSize: v ? 76 : 70,
    subBottom: v ? 300 : 44,
    small: v ? 46 : 32, // ≥ 40 px on screen even when the camera is at ~0.85
  };
};
export type Layout = ReturnType<typeof useLayout>;
