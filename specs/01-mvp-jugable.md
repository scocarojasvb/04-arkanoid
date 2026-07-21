# SPEC 01 — MVP jugable de Arkanoid

> **Estado:** Draft
> **Depende de:** Ninguno
> **Fecha:** 2026-07-21
> **Objetivo:** Construir un Arkanoid jugable de principio a fin (pala, bola, bloques, vidas, puntaje, victoria/derrota y highscore) usando los assets existentes.

## Scope

**In:**

- Pala controlable con mouse y con teclado (flechas / A-D).
- Bola con física simple de rebote (paredes, pala, bloques) a velocidad constante.
- Un único layout de bloques (5 filas x 8 columnas), todos con 1 golpe de resistencia y 10 puntos cada uno, usando los sprites `block_<color>` existentes.
- Sistema de vidas: 3 vidas, pierde una al caer la bola fuera del área jugable.
- Puntaje en pantalla, sumando 10 puntos por bloque roto.
- Un bloque roto desaparece inmediatamente (sin animación).
- Pausa con la tecla `P`.
- Pantalla de victoria al romper todos los bloques, con opción de iniciar nueva partida.
- Pantalla de game over al perder las 3 vidas, con opción de reiniciar.
- Persistencia del mejor puntaje (highscore) en `localStorage`, visible en pantalla.
- Canvas fijo de 800x600 px.

**Out of scope (for future specs):**

- Múltiples niveles / progresión de niveles.
- Power-ups.
- Sonido (`ball-bounce.mp3`, `break-sound.mp3`).
- Animación de explosión al romper bloques.
- Bloques con más de un golpe de resistencia o puntajes distintos por color.
- Velocidad de bola variable o creciente.
- Diseño responsive del canvas.
- Tabla de highscores con múltiples entradas (solo se guarda el mejor puntaje).

## Data model

```js
// Estado del juego
const state = {
  status: 'playing', // 'playing' | 'paused' | 'won' | 'gameover'
  score: 0,
  lives: 3,
  highScore: 0, // cargado desde localStorage al iniciar
  paddle: { x: 320, y: 560, w: 100, h: 14 },
  ball: { x: 400, y: 300, vx: 4, vy: -4, radius: 8 },
  bricks: [/* { x, y, w, h, color, alive } */],
};
```

Convenciones:

- Origen de coordenadas: esquina superior izquierda.
- Velocidades en píxeles/frame.
- `bricks` se genera al iniciar partida: 5 filas x 8 columnas, un color fijo por fila (usando los 5 colores: `red`, `yellow`, `cyan`, `magenta`, `hotpink`).
- Clave de `localStorage`: `arkanoid:highscore:v1` (string numérico).

## Implementation plan

1. Crear `index.html`, `style.css` y `game.js` con el esqueleto: canvas de 800x600, carga del spritesheet (`loadSpritesheet`), y un loop de render que solo dibuja el fondo.
2. Dibujar el estado inicial estático: pala centrada y las 5 filas x 8 columnas de bloques con `drawSprite`, sin movimiento todavía.
3. Implementar el movimiento de la pala con mouse y con teclado (flechas / A-D), limitado a los bordes del canvas.
4. Implementar el movimiento de la bola y su rebote contra las paredes (izquierda, derecha, arriba); si cae por abajo, por ahora solo se detiene.
5. Implementar la colisión bola-pala (rebote con ángulo según punto de impacto).
6. Implementar la colisión bola-bloques: al impactar, el bloque desaparece (`alive = false`) y suma 10 puntos al `score` mostrado en pantalla.
7. Implementar el sistema de vidas: al caer la bola por abajo, resta una vida y reinicia la posición de bola/pala; al llegar a 0 vidas, muestra pantalla de "Game Over" con botón/tecla para reiniciar partida.
8. Implementar la condición de victoria: cuando todos los bloques están `alive = false`, muestra pantalla de "¡Ganaste!" con opción de iniciar nueva partida.
9. Implementar la pausa con la tecla `P`, que detiene el loop de física/render y muestra un indicador de "Pausado".
10. Implementar la persistencia del highscore: leer `arkanoid:highscore:v1` de `localStorage` al iniciar, actualizarlo y guardarlo cuando `score` lo supere, y mostrarlo en pantalla.

## Acceptance criteria

- [ ] El juego carga en el navegador sin errores en consola.
- [ ] La pala se mueve tanto con el mouse como con las flechas / A-D, sin salirse del canvas.
- [ ] La bola rebota correctamente contra paredes y pala.
- [ ] Al golpear un bloque, este desaparece inmediatamente y el puntaje aumenta en 10.
- [ ] Al caer la bola fuera del área jugable, se resta una vida y la bola/pala se reinician.
- [ ] Al llegar a 0 vidas, se muestra la pantalla de "Game Over" con opción de reiniciar, y al reiniciar el juego vuelve a un estado jugable desde cero.
- [ ] Al romper todos los bloques, se muestra la pantalla de "¡Ganaste!" con opción de iniciar una nueva partida.
- [ ] Presionar `P` pausa el juego (bola y pala dejan de moverse) y un segundo `P` lo reanuda.
- [ ] El mejor puntaje se muestra en pantalla y persiste tras recargar la página (usando `localStorage`).
- [ ] Si el puntaje de la partida actual supera el highscore guardado, este se actualiza.

## Decisions

- **Sí:** control de pala con mouse y teclado simultáneamente. Cubre ambas preferencias sin costo extra de implementación.
- **Sí:** un solo layout de bloques fijo (5x8, mismo golpe/puntaje). Simplifica el MVP; niveles y variedad de bloques quedan para otro spec.
- **No:** power-ups en este MVP. Añade complejidad de estado y colisiones que no aportan a validar el "juego jugable" base.
- **No:** sonido en este MVP. Se deja explícitamente para otro spec, aunque los assets ya existen.
- **No:** animación de explosión al romper bloques. El bloque desaparece de inmediato; la animación se añadirá en un spec futuro.
- **Sí:** velocidad de bola constante durante toda la partida. Evita ajustar curvas de dificultad antes de tener el core jugable.
- **Sí:** canvas fijo en 800x600 px. Evita lidiar con responsive/escalado en el MVP.
- **Sí:** persistencia de highscore único vía `localStorage` con clave versionada `arkanoid:highscore:v1`. Simple y permite migrar el esquema después sin romper el guardado existente.
- **No:** tabla con múltiples highscores. Solo se guarda el mejor puntaje; una lista de puntajes es un spec aparte.

## What is **not** in this spec

- Múltiples niveles / progresión de niveles.
- Power-ups.
- Sonido (`ball-bounce.mp3`, `break-sound.mp3`).
- Animación de explosión al romper bloques.
- Bloques con más de un golpe de resistencia o puntajes distintos por color.
- Velocidad de bola variable o creciente.
- Diseño responsive del canvas.
- Tabla de highscores con múltiples entradas.

Cada uno de estos, si se implementa, va en su propio spec.
