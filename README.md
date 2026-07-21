# Juego de Arkanoid

Arkanoid jugable hecho con HTML, CSS y JavaScript vanilla, sin dependencias.

## Cómo jugar

Abre `index.html` en el navegador.

- **Mover la pala:** mouse, o flechas `←`/`→` (también `A`/`D`).
- **Pausar/reanudar:** `P`.
- **Silenciar/activar sonido:** `M` (se guarda entre recargas).
- **Reiniciar** (tras game over o completar el juego): `Enter`.

## Features

- Física de rebote de la bola contra paredes, pala (el ángulo de rebote depende de dónde golpea la pala) y bloques.
- 3 niveles con layouts distintos, cada uno con su propio patrón de colores; puntaje y vidas se acumulan entre niveles.
- Animación de explosión de 4 frames al romper un bloque, con sonido (`break-sound.mp3`) y sonido de rebote (`ball-bounce.mp3`).
- Sistema de 3 vidas, puntaje y highscore persistido en `localStorage`.
- Pantallas de nivel completado, juego completado y game over, todas con opción de reiniciar.

## Estructura

- `index.html` / `style.css` — canvas y estilos base.
- `game.js` — todo el estado y la lógica del juego (definición de niveles, física, dibujo, input).
- `assets/spritesheet.js` — carga el spritesheet y expone `drawSprite`/`drawFrame` para dibujar pala, bola, bloques y frames de explosión.
- `assets/sounds/` — efectos de sonido.

## Desarrollo

Este proyecto sigue un flujo de desarrollo dirigido por specs (ver `specs/` y `CLAUDE.md`). Cada feature nueva se diseña primero como spec antes de tocar código.
