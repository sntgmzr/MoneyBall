# Trading MoneyBall: video de motion graphics

Video explicativo de unos 90 s hecho con Remotion (React + TypeScript), en dos formatos:

- `out/trading-moneyball-9x16.mp4`: 1080×1920, 30 fps. Es el formato principal, para WhatsApp e Instagram.
- `out/trading-moneyball-16x9.mp4`: 1920×1080, 30 fps.

## Renderizar de nuevo

```bash
npm install
python3 scripts/make_sfx.py          # vuelve a generar los sonidos (solo si los cambias)
npx tsx scripts/build-cues.ts        # regenera data/cue_sheet.json y guion_voz.txt
npx remotion studio                  # vista previa en el navegador

npx remotion render TradingMoneyBall-9x16 out/trading-moneyball-9x16.mp4
npx remotion render TradingMoneyBall-16x9 out/trading-moneyball-16x9.mp4
```

Si Remotion no puede descargar su Chrome, pásale uno local con `--browser-executable=/ruta/a/chrome`.

## Cambiar números

Todos los números del video salen de `data/datos.json`. No hay cifras escritas dentro de los componentes.

1. Edita `data/datos.json` y cambia `fecha_corte`. La leyenda "Datos al …" se actualiza sola.
2. **Serie mensual del backtest:** reemplaza el texto `"PENDIENTE…"` de `backtest.mensual` por un arreglo como `[{"mes": "2024-08", "costos_x2_pct": 1.2}, …]`, con un elemento por mes. La etiqueta "Datos de ejemplo" desaparece sola.
3. **Curva del paper trading:** reemplaza `paper.curva` por un arreglo de valores en %, por ejemplo `[0, 0.1, -0.05, …, 0.64]`. La etiqueta "Curva de ejemplo" desaparece sola.
4. Vuelve a renderizar.

Mientras un dato diga `PENDIENTE`, el video muestra barras o una curva neutras, con la etiqueta visible. Las barras de ejemplo marcan como peor mes el que dice `peor_mes`, pero su altura es inventada. La curva de ejemplo termina en el `resultado_pct` real.

## Reemplazar sonidos

- Los efectos están en `public/sfx/*.wav` y la música en `public/audio/music.wav`. Para reemplazar uno, deja un archivo con el mismo nombre.
- **Cuándo suena cada efecto:** está en `data/cue_sheet.json`, que es la fuente única. Se genera desde `scripts/build-cues.ts`, que lee los mismos frames de evento que usan las escenas (`src/timeline.ts`). Así el sonido cae en el mismo frame que su imagen.
- El generador aplica la regla de máximo 3 efectos por segundo y deja fuera los de menor prioridad.
- Los ticks del contador son un solo archivo (`tick_roll.wav`, 25 ticks por segundo), así que cuentan como un efecto, no como 25.

**Origen y licencia:** todos los sonidos y la música los genera `scripts/make_sfx.py` con síntesis simple en numpy. Son originales y de dominio público (CC0). No hay muestras de terceros.

**Mezcla:**
- Efectos entre −22 y −28 dB.
- Música a −24 dB, que baja otros −4 dB mientras hay voz (ducking según `src/voice.ts`).
- La voz en off no viene incluida. El guion con tiempos está en `guion_voz.txt`. Cuando la grabes, agrégala como `<Audio>` en `src/audio/Sfx.tsx` a −14 LUFS.

## Voz y subtítulos

`src/voice.ts` tiene el guion por escena, con tiempos. De ahí salen los subtítulos quemados y `guion_voz.txt`. Si cambias una frase, vuelve a correr `npx tsx scripts/build-cues.ts`.

## Cómo está construido

| Archivo | Qué hace |
|---|---|
| `src/theme.ts` | Colores, fuentes, curvas y los 4 presets de resorte. Conversión de Apple (damping ratio + response) a Remotion (stiffness, damping). |
| `src/timeline.ts` | Duración de cada escena, transiciones y frames de cada evento. |
| `src/camera/Camera.tsx` | Cámara viva: deriva lineal más movimientos con resorte que se suman (animación aditiva), de modo que un movimiento nuevo arranca con la velocidad del anterior. X, Y, escala y giro van por separado. Frena en las ventanas de lectura. |
| `src/background/*` | Fondo con paralaje: cuadrícula de puntos (×0.3), infografías decorativas en gris (×0.6) y contenido (×1). |
| `src/transitions/presentations.tsx` | Zoom-through, whip pan, alejamiento revelador, match cut y wipe. |
| `src/scenes/E01…E10` | Una escena por archivo. |

### Diferencias con el brief

- **Fuentes:** Fraunces e Inter se cargan con `@remotion/fonts` desde `public/fonts`, no con `@remotion/google-fonts`. Son los mismos archivos con licencia OFL, empaquetados desde Fontsource. El motivo es que el render en la nube no tenía salida a Google Fonts.
- **Motion blur:** `<CameraMotionBlur>` (6 muestras) se activa solo durante los whip pans y los zoom-through. El whip pan suma además un desenfoque direccional SVG.
- **Títulos:** los textos que hay que leer viven en una capa fija (HUD), así que la cámara nunca los mueve. Detrás llevan un degradado suave, como el efecto de borde de Apple.
- **Escalera (E8):** solo se abre el candado del peldaño 1, porque es el único que ya ocurrió. Los demás quedan cerrados con su criterio a la vista. Abrirlos daría a entender pruebas que todavía no pasaron.
- **Duración:** 90 s. A E9 se le sumaron 2 s para la tarjeta de "Límites honestos", que lleva su propia frase de voz.
