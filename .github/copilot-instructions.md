# Copilot / AI agent instructions — TouchVizWeb_2.0

This file contains concise, actionable instructions for AI coding agents working on the TouchVizWeb_2.0 codebase. Focus on the files and patterns below to become productive quickly.

1) Quick dev / build commands
- Start dev server (vite, hot reload): `npm run dev` (maps to `vite`).
- Build and type-check: `npm run build` (runs `vue-tsc -b && vite build`). This project relies on that step for static type checks.
- Preview production build: `npm run preview`.
- Vite listens on all interfaces (host: true) and default port 5173 (see `vite.config.ts`).

2) Big-picture architecture
- Frontend SPA using Vue 3 + TypeScript + Vite. Entry: `src/main.ts` which loads project/unit data then mounts `App.vue`.
- 3D rendering is done with Babylon.js. The canvas and render loop are managed by `src/components/BabylonViewport.vue` and `src/core/EngineManager.ts` (singleton `EngineManager.getInstance(canvas)`).
- Scene logic is split into Level classes under `src/levels/` (e.g. `exterior.ts`, `InteriorTourLevel.ts`). Levels extend `LevelBase` in `src/core/LevelBase.ts` and are opened/closed with `EngineManager.OpenLevel()` / `CloseLevel()`.
- Managers (singletons) live in `src/managers/` and centralize data and selection logic: `ProjectDataManager.ts`, `UnitManager.ts`, `actorManager.ts`, `SelectionManager.ts`.
- Lightweight event bus: `src/core/eventBus.ts` exports `eventBus = new EventTarget()` — use `addEventListener` / `dispatchEvent(new CustomEvent('name', { detail }))` for cross-component communication.

3) Data flow & assets
- Project JSON and 3D assets are under `public/assets/` (e.g. `project.json`, `gltf/...`). `ProjectDataManager.load(url)` fetches project JSON and caches it.
- Unit data is loaded from a remote JSON (see `src/core/fetchUnits.ts` — the code expects a root object with `Apartments` array and maps to `UnitObject` instances).
- Levels request assets via `ProjectDataManager` and `UnitManager` — change asset paths carefully and update `public/assets` accordingly.

4) Conventions & notable patterns
- Singleton managers: getInstance() / exported singletons are used extensively (see `ProjectDataManager`, `EngineManager`, `unitManager` usage in `src/main.ts`). Prefer updating the singleton rather than creating new instances.
- Types are stored in `src/types/` (e.g. `unitObject.ts`, `apartment.ts`) and used throughout. Keep types in sync with fetched JSON shapes.
- Vue SFCs use `<script setup lang="ts">` and `defineExpose()` when exposing methods (see `BabylonViewport.vue` exposing `OpenExteriorLevel` and `OpenInteriorTourLevel`).
- Rendering lifecycle: Engines and scenes must be disposed when closing a level (`engine.stopRenderLoop()` and `scene.dispose()` — see `EngineManager.CloseLevel`). Follow that pattern to avoid memory leaks.

5) Event & UI integration examples
- Emit a global event: `eventBus.dispatchEvent(new CustomEvent('unit:selected', { detail: unitId }))`.
- Listen in any module/component: `eventBus.addEventListener('unit:selected', (e) => { const id = (e as CustomEvent).detail; })`.
- Open a level from UI: `EngineManager.getInstance(canvas).OpenLevel(new LevelExterior(engine))` — ensure a canvas exists before calling `getInstance` (first call requires canvas parameter).

6) External dependencies & integration
- Babylon.js (+ loaders) (see `package.json`). Keep major versions in sync with existing usage. Many Level classes rely on specific APIs from the installed Babylon.js version.
- Remote data endpoint used in `src/core/fetchUnits.ts` (Firebase REST URL). Treat as external and network-dependent; guard fetches with try/catch.

7) When changing behavior
- Update the corresponding manager singleton and its consumers. For example, changing how project JSON is shaped requires updating `ProjectDataManager.load`, the `TypeData` interface in `ProjectDataManager.ts`, and places that call `getType()`.
- If adding new global events, document the event name and payload shape near `src/core/eventBus.ts` and register listeners with consistent naming (e.g. `entity:action` or `unit:selected`).

8) Files to inspect first (highest signal):
- `src/main.ts` — app startup and data loading order
- `src/components/BabylonViewport.vue` — canvas init & level switch examples
- `src/core/EngineManager.ts` — render loop & level lifecycle
- `src/core/eventBus.ts` — global EventTarget instance
- `src/core/fetchUnits.ts` — remote unit data format expectation
- `src/managers/ProjectDataManager.ts` — how project JSON is loaded and typed
- `src/levels/*` — concrete Level implementations and patterns for loading scenes

9) Quick debugging tips
- If the canvas is blank, check console for asset load errors or that `EngineManager.getInstance(canvas)` was called with a non-null canvas.
- Network/JSON structure errors will often surface during startup (see `startup()` in `src/main.ts`). Reproduce by running `npm run dev` and watching console logs.
- Use `engine.getDeltaTime()` and `Level.Update(dt)` calls inside `EngineManager.RunRenderLoop` to reason about per-frame updates when profiling.

If anything here is unclear or you want more detail on a particular area (levels, asset pipeline, or managers), tell me which part to expand and I will iterate.
