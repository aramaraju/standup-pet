# AGENTS.md

## Cursor Cloud specific instructions

### Product

**Standup Pet** is a client-only Tauri + React menu-bar companion. There is no backend, database, or Docker stack. Core logic is pure TypeScript in `src/lib/`; persistence uses browser `localStorage`.

### Dependencies

- **Node.js + npm** only for automated CI-style work (`npm run verify`, tests, builds).
- Use `npm install --legacy-peer-deps` on a clean install. Plain `npm install` fails with a peer conflict between `@eslint/js@10` and `eslint@9`.
- **Rust/Cargo** is optional here; required only for `npm run tauri dev` / `npm run tauri build`. Full menu-bar, notifications, and launch-at-login behavior need **macOS** and a packaged build (see README manual checklist).

### Common commands

See `package.json` scripts and `README.md`. Quick reference:

| Task | Command |
|------|---------|
| Full gate | `npm run verify` (typecheck → lint → test → vite build) |
| Dev UI | `npm run dev` → http://localhost:1420 (Vite strict port) |
| Desktop dev | `npm run tauri dev` (starts Vite, then Tauri shell) |

### Gotchas

- **`npm run verify` lint**: `scripts/screenshots.mjs` is linted by the global `js.configs.recommended` block but only `*.{ts,tsx}` files get Node/browser globals in `eslint.config.js`, so `npm run lint` / `verify` currently fail on that file. Typecheck, Vitest (99 tests), and `npm run build` pass independently.
- **Controls in the UI**: "I moved", Snooze, and Start break buttons render only in `break-due` / `breaking` phases, not during the default `working` phase.
- **Preferences**: `Preferences.tsx` exists but is not mounted in `App.tsx` yet, so settings UI is not reachable from the running dev app without code changes.
- **Long-running dev server**: Use a tmux session (e.g. `vite-dev-server`) for `npm run dev`; port **1420** must be free.

### Services to run for manual UI testing

1. `npm run dev` (required for browser or Tauri dev).
2. Optional: `npm run tauri dev` for native shell (Linux may open a window; macOS menu-bar features need macOS).

No other services are required.
