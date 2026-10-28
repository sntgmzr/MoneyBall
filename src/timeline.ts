// Single source of truth for timing. Scenes and the cue sheet both read from
// here, so a sound always lands on the same frame as its visual event.
export const FPS = 30;

export type TransitionKind = 'zoomThrough' | 'whip' | 'whipDown' | 'matchCut' | 'pullBack' | 'wipe';

export const SCENES = [
  {id: 'E1', name: 'Gancho', sec: 6, out: {kind: 'zoomThrough', frames: 14}},
  {id: 'E2', name: 'La idea MoneyBall', sec: 8, out: {kind: 'whip', frames: 10}},
  {id: 'E3', name: 'Señal 1: tendencia', sec: 10, out: {kind: 'matchCut', frames: 10}},
  {id: 'E4', name: 'Señal 2: funding', sec: 8, out: {kind: 'pullBack', frames: 16}},
  {id: 'E5', name: 'Cartera balanceada', sec: 8, out: {kind: 'zoomThrough', frames: 14}},
  {id: 'E6', name: 'Evidencia: backtest', sec: 12, out: {kind: 'wipe', frames: 14}},
  {id: 'E7', name: 'Prueba en vivo', sec: 10, out: {kind: 'matchCut', frames: 10}},
  {id: 'E8', name: 'La escalera', sec: 12, out: {kind: 'whipDown', frames: 10}},
  {id: 'E9', name: 'Reglas de seguridad', sec: 8, out: {kind: 'pullBack', frames: 16}},
  {id: 'E10', name: 'Cierre', sec: 8, out: null},
] as const satisfies readonly {
  id: string;
  name: string;
  sec: number;
  out: {kind: TransitionKind; frames: number} | null;
}[];

export type SceneId = (typeof SCENES)[number]['id'];

export const TOTAL_FRAMES = SCENES.reduce((a, s) => a + s.sec * FPS, 0);

// Absolute frame where a scene's local frame 0 sits.
export const sceneStart = (id: SceneId) => {
  let t = 0;
  for (const s of SCENES) {
    if (s.id === id) return t;
    t += s.sec * FPS;
  }
  throw new Error(id);
};

// A sequence lasts its nominal time plus the outgoing transition it overlaps.
export const seqFrames = (s: (typeof SCENES)[number]) => s.sec * FPS + (s.out ? s.out.frames : 0);

// Local event frames per scene.
export const EV = {
  E1: {zoomOut: 6, text: 40, freeze: 120, dot: 126, focusDot: 140},
  E2: {chipsFrom: 18, chipStagger: 2, chipLand: 8, sort: 110, sortStagger: 2, title: 150},
  E3: {lines: 12, braid: 50, title: 70, overview: 100, chips: 105, tilt: 140, travel: 150, travelStagger: 4, toArrow: 240},
  E4: {zoomOut: 10, title: 40, people: 30, paysFrom: 60, payEvery: 14, payCount: 8, payTravel: 30, panDown: 56, panUp: 104, toHouse: 190},
  E5: {zoomOut: 2, beam: 40, title: 30, icons: 70, seal: 110, donut: 124, toSeal: 190},
  E6: {axis: 6, panToWorst: 20, barsA: 20, zoomWorst: 60, worstLabel: 66, panRight: 125, barsB: 125, overview: 180, avg: 185, riser: 170, count: 200, countDown: 250, fix: 268, title: 262, dayCard: 290},
  E7: {title: 30, draw: 20, drawEnd: 200, cards: [60, 80, 100, 120, 140], overview: 205, toTip: 240, rise: 265},
  E8: {zoomIn: 6, steps: [20, 90, 160, 230], unlock: 40, checklist: 110, riser: 280, overview: 300},
  E9: {shields: 12, shieldStagger: 4, toLight: 84, title: 90, green: 96, amber: 112, red: 128, off: 140, watch: 150, toLimits: 160, limits: 168},
  E10: {zoomOut: 2, dim: 60, logo: 60, tagline: 80, legal: 120},
} as const;
