import datos from '../data/datos.json';
import {FPS} from './timeline';

// Voice-over script (es-MX). Times in seconds of the full video. Subtitles are
// burned in from these same chunks, max two lines each.
export const VOICE: {scene: string; from: number; to: number; text: string}[] = [
  {scene: 'E1', from: 0.5, to: 3.3, text: 'En cripto casi todos operan por corazonada.'},
  {scene: 'E1', from: 3.5, to: 5.6, text: 'Nosotros quisimos hacerlo distinto.'},
  {scene: 'E2', from: 6.6, to: 9.6, text: 'Como un entrenador que arma su equipo con estadística,'},
  {scene: 'E2', from: 9.8, to: 13.2, text: 'el bot revisa veinte criptomonedas cada mañana.'},
  {scene: 'E3', from: 14.6, to: 18.2, text: 'Primero mira quién viene en racha y quién va en picada,'},
  {scene: 'E3', from: 18.5, to: 21.8, text: 'usando tres plazos para no depender de uno solo.'},
  {scene: 'E4', from: 24.8, to: 26.6, text: 'Luego busca cobrar la renta'},
  {scene: 'E4', from: 26.8, to: 30.2, text: 'que pagan quienes apuestan con dinero prestado.'},
  {scene: 'E5', from: 32.5, to: 35.3, text: 'Compra a los fuertes y apuesta contra los débiles.'},
  {scene: 'E5', from: 35.5, to: 37.8, text: 'Así no depende de que todo el mercado suba.'},
  {scene: 'E5', from: 38.0, to: 39.6, text: 'Y nunca usa apalancamiento.'},
  {scene: 'E6', from: 40.6, to: 43.0, text: `Lo probamos con ${datos.backtest.meses} meses de historia,`},
  {scene: 'E6', from: 43.2, to: 46.2, text: 'y con comisiones al doble para no engañarnos.'},
  {scene: 'E6', from: 47.0, to: 50.4, text: 'Hubo meses malos, pero muchos más buenos.'},
  {scene: 'E7', from: 52.6, to: 55.0, text: 'Ahora corre en vivo con dinero simulado.'},
  {scene: 'E7', from: 55.2, to: 58.0, text: 'Hasta hoy, cero errores y dentro de lo esperado.'},
  {scene: 'E7', from: 58.3, to: 61.6, text: 'Dos días no prueban nada; por eso seguimos midiendo.'},
  {scene: 'E8', from: 62.8, to: 65.0, text: 'No pedimos que confíes en promesas.'},
  {scene: 'E8', from: 65.4, to: 67.4, text: 'Cada paso se gana con datos:'},
  {scene: 'E8', from: 67.8, to: 70.4, text: 'si no pasa la revisión, no avanza.'},
  {scene: 'E9', from: 74.8, to: 78.2, text: 'Y si algo sale mal, hay reglas que lo apagan solo.'},
  {scene: 'E9', from: 79.4, to: 81.8, text: 'También tiene límites: con poco capital, algunas órdenes se saltan.'},
  {scene: 'E10', from: 83.0, to: 86.0, text: 'Trading MoneyBall: transparente, medido y paso a paso.'},
];

export const voiceFrames = VOICE.map((v) => ({...v, f0: Math.round(v.from * FPS), f1: Math.round(v.to * FPS)}));
