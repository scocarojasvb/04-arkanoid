# SPEC 02 — Animación de explosión al romper bloques

> **Estado:** Implementado
> **Depende de:** 01-mvp-jugable
> **Fecha:** 2026-07-21
> **Objetivo:** Reemplazar la desaparición instantánea de bloques por una animación de explosión de 4 frames (ya definida en `assets/spritesheet.js`), soportando múltiples explosiones simultáneas y retrasando la pantalla de victoria hasta que la última termine.

## Scope

**In:**

- Al romper un bloque, este desaparece del área jugable de inmediato (`alive = false`, como hoy) y se dibuja encima una animación de explosión de 4 frames usando `EXPLOSION_FRAMES[color]` y `drawFrame`.
- La animación dura `EXPLOSION_DURATION` (150ms) en total, avanzando de frame según tiempo transcurrido (delta ms), no por conteo de frames del loop.
- Soporte para múltiples explosiones activas simultáneamente (ej. varios bloques rotos en rebotes rápidos consecutivos).
- La pantalla de "¡Ganaste!" se muestra solo cuando todos los bloques están `alive = false` **y** no quedan explosiones activas en curso.

**Out of scope (for future specs):**

- Sonido (`break-sound.mp3`) al romper un bloque.
- Animaciones adicionales (pala, bola, vidas).
- Cambios a las reglas de puntaje, vidas o game over existentes.
- Cambios al layout de bloques o a su resistencia/puntaje.

## Data model

```js
// Nuevo array en el estado del juego
state.explosions = [
  // { x, y, color, startTime } — x,y = posición del bloque roto (esquina superior izquierda), color = uno de los 5 colores de bloque
];
```

Convenciones:

- `startTime` se guarda con `performance.now()` en el momento en que el bloque se rompe.
- En cada frame de render, para cada explosión activa se calcula `elapsed = performance.now() - startTime`.
- El índice de frame a dibujar es `Math.floor(elapsed / (EXPLOSION_DURATION / EXPLOSION_FRAMES[color].length))`, con el mínimo entre ese índice y el último frame válido.
- Una explosión se elimina de `state.explosions` cuando `elapsed >= EXPLOSION_DURATION`.
- El tamaño de dibujo de cada frame es el mismo `w`/`h` del bloque roto (32x16 escalado al tamaño del bloque en pantalla).

## Implementation plan

1. En `game.js`, agregar `explosions: []` al estado inicial (`state.explosions`), sin cambiar nada más — el juego sigue funcionando igual (sin animación aún).
2. En la colisión bola-bloque, al marcar el bloque `alive = false`, además hacer `push` a `state.explosions` con `{ x, y, color, startTime: performance.now() }` usando la posición y color del bloque roto.
3. En el loop de render, después de dibujar bloques vivos, iterar `state.explosions`: calcular el frame correspondiente según tiempo transcurrido y dibujarlo con `drawFrame`.
4. En el mismo loop (o inmediatamente después de renderizar), filtrar `state.explosions` para eliminar las que ya completaron `EXPLOSION_DURATION`.
5. Modificar la condición de victoria: en vez de verificar solo que todos los bloques estén `alive = false`, verificar también que `state.explosions.length === 0` antes de cambiar `state.status` a `'won'`.

## Acceptance criteria

- [x] Al romper un bloque, este desaparece de inmediato y se ve una animación de explosión de 4 frames en su posición, usando los colores/frames definidos en `EXPLOSION_FRAMES`.
- [x] La animación completa dura ~150ms (`EXPLOSION_DURATION`) y no depende del FPS del navegador.
- [x] Si se rompen dos o más bloques en un lapso corto, se ven las explosiones correspondientes simultáneamente, cada una en su propia posición y color.
- [x] Cada explosión desaparece del estado (`state.explosions`) al terminar su animación, sin dejar residuos dibujados.
- [x] Al romper el último bloque, la pantalla de "¡Ganaste!" no aparece hasta que la última explosión visible haya terminado.
- [x] El resto del juego (vidas, puntaje, pausa, game over, highscore) sigue funcionando igual que en el spec 01, sin regresiones.

## Decisions

- **Sí:** el bloque desaparece al instante del impacto y la explosión se dibuja como capa visual encima. Es el comportamiento actual (spec 01), minimiza el cambio de lógica de colisión/puntaje.
- **Sí:** reutilizar `EXPLOSION_DURATION` (150ms) y `EXPLOSION_FRAMES` ya definidos en `assets/spritesheet.js`, sin duplicar ni modificar esa constante.
- **Sí:** soportar múltiples explosiones activas simultáneamente vía un array `state.explosions`. Es el comportamiento natural en Arkanoid y no agrega complejidad significativa.
- **Sí:** avance de frame por tiempo transcurrido (`performance.now()`), no por conteo de frames del loop. Evita que la velocidad de la animación dependa del FPS.
- **Sí:** la pantalla de victoria espera a que termine la última explosión activa. Da un cierre visual más pulido a la partida.
- **No:** sonido (`break-sound.mp3`) en este spec. Queda para un spec futuro, igual que en el spec 01.
- **No:** animaciones para pala, bola o vidas. Fuera de scope; este spec cubre solo la explosión de bloques.

## What is **not** in this spec

- Sonido (`break-sound.mp3`) al romper un bloque.
- Animaciones adicionales (pala, bola, vidas).
- Cambios a las reglas de puntaje, vidas o game over existentes.
- Cambios al layout de bloques o a su resistencia/puntaje.

Cada uno de estos, si se implementa, va en su propio spec.
