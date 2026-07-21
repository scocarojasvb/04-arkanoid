# SPEC 03 — Efectos de sonido y niveles

> **Estado:** Implemented
> **Depende de:** 01-mvp-jugable, 02-animacion-explosion-bloques
> **Fecha:** 2026-07-21
> **Objetivo:** Añadir efectos de sonido (rebote y bloque roto, con mute persistente) y progresión de 3 niveles con layouts distintos, manteniendo puntaje y vidas acumulados entre niveles.

## Scope

**In:**

- Efecto de sonido `ball-bounce.mp3` en cada rebote de la bola contra paredes o pala (no contra bloques).
- Efecto de sonido `break-sound.mp3` al romper un bloque (reemplaza cualquier sonido de rebote en ese impacto).
- Reproducción superpuesta: cada evento crea su propia instancia de audio, sin límite ni throttle.
- Tecla `M` para alternar mute/sonido activado, con indicador visual en pantalla del estado actual.
- Persistencia de la preferencia de mute en `localStorage`, respetada al recargar la página.
- 3 niveles con layout de bloques distinto cada uno (misma resistencia de 1 golpe y mismo puntaje de 10 por bloque que en spec 01; misma velocidad de bola constante).
- Al completar un nivel (todos los bloques `alive = false` y sin explosiones activas), se muestra el mensaje "Nivel X completado" durante ~3 segundos y luego arranca automáticamente el siguiente nivel.
- Puntaje y vidas se acumulan entre niveles (no se resetean al pasar de nivel).
- Al completar el nivel 3 (último), se muestra una pantalla nueva de "¡Completaste el juego!" (distinta de la pantalla de victoria de un solo nivel), con opción de iniciar nueva partida.
- Al llegar a 0 vidas en cualquier nivel, se muestra "Game Over" y al reiniciar el juego vuelve siempre al nivel 1 con puntaje y vidas en cero.
- Al reiniciar el nivel/bola tras perder una vida, se reinicia igual que en spec 01 (bola y pala a posición inicial), sin afectar el nivel actual ni el puntaje acumulado.

**Out of scope (for future specs):**

- Sonido en pantallas de game over o victoria (no hay assets dedicados para esos eventos).
- Control de volumen granular (solo mute on/off, no un slider).
- Velocidad de bola creciente entre niveles.
- Bloques con más de 1 golpe de resistencia.
- Más de 3 niveles / selector de nivel.
- Guardar el nivel alcanzado como parte del highscore (el highscore sigue siendo solo el mejor puntaje, spec 01).

## Data model

```js
// Nuevos campos en el estado del juego
state.level = 1; // 1 | 2 | 3
state.muted = false; // cargado desde localStorage al iniciar
state.levelMessage = null; // { text, startTime } mientras se muestra "Nivel X completado"; null en juego normal

// Layouts de nivel (reemplaza el layout fijo del spec 01)
const LEVELS = [
  { rows: 5, cols: 8, colorPattern: ['red', 'yellow', 'cyan', 'magenta', 'hotpink'] },
  { rows: 6, cols: 8, colorPattern: ['cyan', 'magenta', 'yellow', 'red', 'hotpink', 'cyan'] },
  { rows: 6, cols: 10, colorPattern: ['hotpink', 'red', 'magenta', 'yellow', 'cyan', 'red'] },
];
```

Convenciones:

- `colorPattern[i]` es el color fijo de la fila `i`; se repite/recorre según `rows`.
- `state.bricks` se regenera desde `LEVELS[state.level - 1]` tanto al iniciar partida como al avanzar de nivel (mismo criterio de posicionamiento que en spec 01: 1 golpe de resistencia, 10 puntos por bloque).
- Al avanzar de nivel, `state.status` pasa brevemente a `'levelComplete'` mientras `state.levelMessage` está activo; al vencer los ~3000ms, se limpia `levelMessage`, se incrementa `state.level`, se regeneran `state.bricks` y `state.status` vuelve a `'playing'`.
- Al completar el nivel 3, `state.status` pasa a `'gameComplete'` (pantalla nueva, distinta de `'won'`).
- Clave de `localStorage` para mute: `arkanoid:muted:v1` (string `'true'` / `'false'`).
- Reproducción de audio: cada evento (rebote pared/pala, bloque roto) instancia un `new Audio(src)` y llama a `.play()` independiente; no se reutiliza ni se pausa una instancia compartida, permitiendo solapamiento natural. Si `state.muted` es `true`, no se llama a `.play()`.

## Implementation plan

1. Crear función `playSound(src)` en `game.js` que instancia `new Audio(src)` y llama a `.play()`; usarla en el rebote de bola contra pared/pala (`ball-bounce.mp3`) y en la colisión bola-bloque (`break-sound.mp3`, reemplazando cualquier sonido de rebote en ese impacto). Sin mute todavía: el sonido siempre suena.
2. Agregar `state.muted = false` y la tecla `M` que alterna su valor; mostrar un indicador visual simple en pantalla ("Sonido: ON/OFF"). `playSound` no reproduce nada si `state.muted` es `true`. Sin persistencia todavía.
3. Persistir `state.muted` en `localStorage` bajo `arkanoid:muted:v1`: leer al iniciar el juego y guardar cada vez que cambie con la tecla `M`.
4. Extraer la generación de bloques del spec 01 a una función `generateBricks(levelConfig)` que reciba `{ rows, cols, colorPattern }` y devuelva el array de bloques; usarla con `LEVELS[0]` para mantener el comportamiento actual (nivel 1) sin cambios visibles.
5. Agregar el array `LEVELS` (los 3 layouts) y `state.level = 1`; la condición de victoria existente (todos los bloques `alive = false` y sin explosiones) ahora, si `state.level < 3`, dispara el paso 6 en vez de mostrar directamente la pantalla de "¡Ganaste!".
6. Implementar la transición de nivel: al cumplirse la condición del paso 5, poner `state.status = 'levelComplete'` y `state.levelMessage = { text: 'Nivel X completado', startTime: performance.now() }`; en el render, mostrar el mensaje mientras `elapsed < 3000`; al vencer, incrementar `state.level`, regenerar `state.bricks` con `generateBricks(LEVELS[state.level - 1])`, limpiar `levelMessage` y volver `state.status` a `'playing'`.
7. Si la condición de victoria se cumple con `state.level === 3`, cambiar `state.status` a `'gameComplete'` y mostrar una pantalla nueva "¡Completaste el juego!" con opción de iniciar nueva partida (reinicia `level`, `score`, `lives` y regenera bloques del nivel 1).
8. Verificar/ajustar el flujo de "Game Over" (spec 01) para que el reinicio siempre resetee `state.level = 1` además de `score` y `lives`, regenerando los bloques del nivel 1.

## Acceptance criteria

- [x] Cada rebote de la bola contra pared o pala reproduce `ball-bounce.mp3`.
- [x] Al romper un bloque se reproduce `break-sound.mp3` y **no** suena `ball-bounce.mp3` en ese mismo impacto.
- [x] Romper dos o más bloques en rápida sucesión reproduce los sonidos superpuestos, sin cortarse entre sí.
- [x] Presionar `M` silencia todos los sonidos; un segundo `M` los reactiva, con el indicador en pantalla reflejando el estado actual.
- [x] La preferencia de mute persiste tras recargar la página (`localStorage`, clave `arkanoid:muted:v1`).
- [x] El nivel 1 usa el layout de 5x8 (igual al spec 01); los niveles 2 y 3 usan layouts distintos entre sí y respecto al nivel 1.
- [x] Al romper todos los bloques del nivel 1 o 2 (sin explosiones activas), se muestra "Nivel X completado" ~3 segundos y luego arranca el siguiente nivel automáticamente, sin input del jugador.
- [x] El puntaje y las vidas restantes se mantienen (no se resetean) al pasar de un nivel al siguiente.
- [x] Al romper todos los bloques del nivel 3 (sin explosiones activas), se muestra la pantalla "¡Completaste el juego!" (distinta de la pantalla de victoria de un solo nivel), con opción de iniciar nueva partida.
- [x] Al llegar a 0 vidas en cualquier nivel, se muestra "Game Over"; al reiniciar, el juego vuelve al nivel 1 con puntaje en 0 y 3 vidas.
- [x] El resto del juego (pala, bola, explosiones, pausa, highscore) sigue funcionando igual que en los specs 01 y 02, sin regresiones.

## Decisions

- **No:** dividir en dos specs separados (sonido / niveles). El usuario prefirió mantenerlos juntos en un solo spec pese a ser dominios distintos.
- **Sí:** el rebote contra bloque no reproduce `ball-bounce.mp3`, solo `break-sound.mp3`. Evita sonido duplicado/confuso en el mismo impacto.
- **No:** sonido en pantallas de game over/victoria/nivel completado. No existen assets dedicados para esos eventos; se deja para un spec futuro si se agregan nuevos sonidos.
- **Sí:** mute con tecla `M`, consistente con el patrón de una sola letra ya usado por `P` (pausa).
- **No:** control de volumen granular (slider). Fuera de scope; solo on/off.
- **Sí:** persistir mute en `localStorage` (`arkanoid:muted:v1`), mismo patrón que el highscore del spec 01.
- **Sí:** cada sonido se reproduce con una instancia nueva de `Audio` (sin pool ni cola), permitiendo solapamiento natural sin lógica adicional de mezcla.
- **Sí:** 3 niveles, diferenciados solo por layout de bloques (filas/columnas/colores). Mantiene velocidad de bola constante y resistencia de 1 golpe, decisiones ya tomadas en el spec 01 y no reabiertas aquí.
- **No:** velocidad de bola creciente ni bloques con más de 1 golpe de resistencia entre niveles. Cambiaría reglas centrales del spec 01; se deja para un spec futuro si se decide agregar dificultad progresiva.
- **Sí:** puntaje y vidas se acumulan entre niveles (no se resetean). Refuerza la sensación de progresión continua.
- **Sí:** transición automática entre niveles (mensaje ~3s, sin input) en vez de requerir una tecla. Menor fricción para el jugador.
- **Sí:** pantalla nueva "¡Completaste el juego!" al terminar el nivel 3, distinta de la pantalla de "¡Ganaste!" de un solo nivel/spec 01. Comunica claramente que fue el fin del contenido, no solo de un nivel.
- **Sí:** game over siempre reinicia desde el nivel 1 con puntaje y vidas en cero. Mismo comportamiento simple que el spec 01, sin guardar progreso parcial de nivel.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Políticas de autoplay del navegador pueden bloquear el primer sonido si no hubo interacción previa del usuario | El primer input del jugador (click/tecla para iniciar partida) ya ocurre antes de cualquier rebote, por lo que el contexto de audio queda habilitado a tiempo |
| Crear un `Audio` nuevo por evento en rachas rápidas de bloques rotos podría acumular objetos en memoria | El navegador libera las instancias no referenciadas tras terminar de reproducirse; dado el volumen bajo de eventos por partida, no requiere pool explícito |

## What is **not** in this spec

- Sonido en pantallas de game over, victoria o nivel completado.
- Control de volumen granular (slider).
- Velocidad de bola creciente entre niveles.
- Bloques con más de 1 golpe de resistencia.
- Más de 3 niveles / selector de nivel.
- Guardar el nivel alcanzado como parte del highscore.

Cada uno de estos, si se implementa, va en su propio spec.
