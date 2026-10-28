// Builds data/cue_sheet.json and guion_voz.txt from src/timeline.ts and
// src/voice.ts, so sounds land on the same frame as their visual event.
// Run: npx tsx scripts/build-cues.ts
import {writeFileSync} from 'node:fs';
import {EV, SCENES, sceneStart, type SceneId} from '../src/timeline';
import {VOICE} from '../src/voice';

type Cue = {frame: number; sfx: string; vol: number; evento: string; dur?: number; priority?: number};
const cues: Cue[] = [];
const at = (id: SceneId, local: number, sfx: string, vol: number, evento: string, extra: Partial<Cue> = {}) =>
  cues.push({frame: sceneStart(id) + local, sfx, vol, evento: `${id} ${evento}`, ...extra});

// dB → linear. SFX between −22 and −28 dB.
const db = (d: number) => Math.round(10 ** (d / 20) * 1000) / 1000;

// Transitions
SCENES.forEach((s, i) => {
  if (!s.out) return;
  const next = SCENES[i + 1];
  const f = sceneStart(next.id);
  if (s.out.kind === 'whip' || s.out.kind === 'whipDown') cues.push({frame: f, sfx: 'whoosh_corto', vol: db(-22), evento: `${s.id}→${next.id} whip pan`, priority: 1});
  if (s.out.kind === 'zoomThrough') cues.push({frame: f, sfx: 'whoosh_largo', vol: db(-22), evento: `${s.id}→${next.id} zoom-through`, priority: 1});
  if (s.out.kind === 'pullBack') cues.push({frame: f, sfx: 'whoosh_largo', vol: db(-28), evento: `${s.id}→${next.id} alejamiento`, priority: 1});
});

// E1
at('E1', 0, 'murmullo', db(-24), 'murmullo de mercado (se corta en seco al congelarse)', {dur: EV.E1.freeze, priority: 2});
at('E1', EV.E1.dot, 'tuc_grave', db(-22), 'aparece el punto negro', {priority: 1});
// E2: one chip in three, capped below
[0, 9, 18].forEach((i) => at('E2', EV.E2.chipsFrom + i * EV.E2.chipStagger + EV.E2.chipLand, 'clic_suave', db(-26), `ficha ${i + 1} aterriza`));
at('E2', EV.E2.sort, 'whoosh_corto', db(-26), 'las fichas se ordenan');
// E3
at('E3', EV.E3.braid, 'tono_asc', db(-24), 'las líneas se trenzan en la flecha', {priority: 1});
[0, 3, 6].forEach((i) => at('E3', EV.E3.travel + i * EV.E3.travelStagger, 'swish', db(-28), `ficha ${i + 1} cambia de columna`));
// E4
for (let k = 0; k < EV.E4.payCount; k++) at('E4', EV.E4.paysFrom + k * EV.E4.payEvery + EV.E4.payTravel, 'gota', db(-26), `pago ${k + 1} llega al bot`);
// E5
at('E5', EV.E5.beam + 10, 'clunk_madera', db(-22), 'la balanza se asienta', {priority: 1});
at('E5', EV.E5.seal, 'stamp_sordo', db(-22), 'sello 1x', {priority: 1});
// E6
at('E6', EV.E6.worstLabel, 'tono_menor', db(-24), 'zoom al peor mes', {priority: 1});
at('E6', EV.E6.riser, 'riser_suave', db(-26), 'antes de revelar el Sharpe', {priority: 1});
at('E6', EV.E6.count, 'tick_roll', db(-28), 'contador sube a 1.63', {dur: 26});
at('E6', EV.E6.countDown, 'tick_roll', db(-28), 'contador baja a 1.12', {dur: 18});
at('E6', EV.E6.fix, 'pop_grave', db(-22), 'se fija 1.12', {priority: 1});
// E7
at('E7', EV.E7.cards[0], 'blip', db(-26), 'contador órdenes');
at('E7', EV.E7.cards[1], 'tono_confirm', db(-24), '0 rechazadas', {priority: 1});
at('E7', EV.E7.cards[2], 'blip', db(-26), 'contador resultado');
at('E7', EV.E7.cards[3], 'blip', db(-26), 'contador comisiones');
// E8: one pentatonic note per step, lock clack only where a lock opens
['tono_c', 'tono_d', 'tono_e', 'tono_g'].forEach((n, k) => at('E8', EV.E8.steps[k] + 12, n, db(-24), `peldaño ${k + 1}`, {priority: 1}));
at('E8', EV.E8.unlock, 'clack_candado', db(-22), 'se abre el candado del peldaño 1', {priority: 1});
at('E8', EV.E8.riser, 'riser_suave', db(-26), 'antes del alejamiento de la escalera', {priority: 1});
// E9
[0, 2, 4].forEach((i) => at('E9', EV.E9.shields + i * EV.E9.shieldStagger, 'tuc_grave', db(-26), `escudo ${i + 1}`));
at('E9', EV.E9.off, 'clic_grave', db(-22), 'interruptor de apagado', {priority: 1});
// E10
at('E10', EV.E10.logo, 'acorde_final', db(-24), 'logo se materializa', {priority: 1});

// Utility rule: never more than 3 sounds in any 1-second window.
cues.sort((a, b) => a.frame - b.frame || (b.priority ?? 0) - (a.priority ?? 0));
const kept: Cue[] = [];
for (const c of cues) {
  const recent = kept.filter((k) => k.frame > c.frame - 30);
  if (recent.length >= 3) {
    const weakest = recent.find((k) => (k.priority ?? 0) < (c.priority ?? 0));
    if (!weakest) continue;
    kept.splice(kept.indexOf(weakest), 1);
  }
  kept.push(c);
}
const out = kept.map(({priority: _p, ...c}) => c);
writeFileSync('data/cue_sheet.json', JSON.stringify(out, null, 2) + '\n');
console.log(`cue_sheet.json: ${out.length} cues (${cues.length - out.length} dropped by the 3-per-second rule)`);

// Voice script with times.
const mmss = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
let txt = 'Trading MoneyBall — guion de voz en off (español de México)\n';
txt += 'Formato: escena · inicio → fin · texto. Voz a −14 LUFS; música −24 dB con ducking de −4 dB.\n\n';
for (const s of SCENES) {
  txt += `${s.id} · ${s.name}\n`;
  for (const v of VOICE.filter((x) => x.scene === s.id)) txt += `  ${mmss(v.from)} → ${mmss(v.to)}  ${v.text}\n`;
  if (s.id === 'E10') txt += '  1:26.0 → 1:30.0  (Sin voz. Aviso legal en pantalla; solo música bajando.)\n';
  txt += '\n';
}
writeFileSync('guion_voz.txt', txt);
console.log('guion_voz.txt written');
