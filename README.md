# ECHO//9

A short-form browser-based sci-fi action experience where you explore a derelict transit station, manipulate time, and recover a lost signal while escaping an unstable underground world.

Live demo: https://echo9-five.vercel.app

## Overview

ECHO//9 is a client-side web game built with React, Vite, and Three.js. The player is equipped with a temporal device that rewinds nine seconds while the world remains in a shifted state. You must survive the station, coordinate with temporal echoes, solve environmental puzzles, and reach Mira before the distortions collapse the facility.

## Gameplay features

- First-person movement and camera controls
- Temporal rewind mechanic with nine-second loops
- Echo-based interactions and checkpoint progression
- Environmental puzzle logic and station traversal
- Procedural sci-fi soundtrack generation using the Web Audio API
- Settings, pause, controls, and ending states
- Responsive browser deployment for quick sharing

## Controls

- WASD: Move
- Mouse: Look
- E: Interact
- R: Rewind 9 seconds
- Esc: Pause

## Tech stack

- React 19
- Vite 8
- Three.js
- TypeScript
- Express server for local development and API support

## Local development

Prerequisites:

- Node.js 18+ recommended

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

The app runs locally at:

```text
http://localhost:3000
```

## Production build

```bash
npm run build
```

## Deployment to Vercel

From the project root:

```bash
npx vercel --prod --yes
```

This deploys the app as a public website using Vercel.

## Project structure

- src/ — game logic, world generation, player systems, UI, and music
- server.ts — local Express server and API entry point
- index.html — app shell
- vite.config.ts — Vite configuration
- README.md — project documentation

## Notes

The game is designed as a lightweight jam build and is optimized for browser play. The soundtrack is generated client-side and does not require an external API key for the base experience.

## License

This project is for demo and portfolio use. If you plan to reuse or redistribute it, please credit the original project and maintainers.
