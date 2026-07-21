# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arkanoid game built with HTML, CSS and vanilla JavaScript, zero dependencies. The game itself is **not implemented yet** — this repo currently only contains assets and the spec-driven workflow tooling. There is no build, lint, or test tooling set up; none will exist until specs are implemented.

## Workflow: spec-driven development

This repo uses two custom slash commands (defined under `.claude/skills/` and `.agents/skills/`, synced via `skills-lock.json` from `Klerith/fernando-skills`) to drive all feature work:

- **`/spec`** — designs a spec through guided clarifying questions, section by section, and saves it to `specs/NN-slug.md`. Never writes code.
- **`/spec-impl NN-slug`** — implements an **Approved** spec: creates/switches to branch `spec-NN-slug`, then implements the plan step by step, pausing for review after each step.

Practical implications for any Claude instance working here:

- Do not write feature code without a spec. If asked to build a feature directly, prefer routing through `/spec` first.
- A spec can only be implemented once its `Status`/`Estado` field reads `Approved` (or the equivalent in another language). Draft specs must not be implemented — see `.agents/skills/spec-impl/SKILL.md` for the full state table.
- Branch creation on implementation is controlled by `AutoCreateBranch` in `specs/.spec-config.yml` (defaults to `true`).
- The spec template lives at `.agents/skills/spec/template.md`.

## Assets

- `assets/spritesheet-breakout.png` — sprite sheet for paddle, ball, and colored blocks (gray, red, yellow, cyan, magenta, hotpink, green), plus per-color explosion animation frames.
- `assets/spritesheet.js` — loads the sprite sheet onto an offscreen canvas and exposes `loadSpritesheet(cb)`, `drawSprite(ctx, name, x, y, w, h)`, and `drawFrame(ctx, frame, x, y, w, h)`. Block sprites are addressed as `block_<color>` (e.g. `block_red`). This is the only game-related JS in the repo so far; future game code should load and draw through these helpers rather than re-slicing the spritesheet.
- `assets/sounds/` — `ball-bounce.mp3`, `break-sound.mp3`.

## Language

Project content (README, specs) is authored in Spanish. Match that language when writing specs or user-facing text for this repo.
