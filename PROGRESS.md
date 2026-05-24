# Progress Log

## 2026-05-23 — Initial build

### Setup
- Installed Tauri CLI v2.11.2
- Scaffolded Tauri v2 + React + TypeScript project
- Added vitest, @testing-library/react, eslint with TypeScript plugin

### Milestones completed

#### M1 — Scaffold + core library
- Phase state machine (`src/lib/timerMachine.ts`)
  - States: `working` → `break-due` → `breaking` → `working`
  - Explicit allowed-transition table; illegal transitions throw
  - Events: TICK, I_MOVED, SNOOZE, START_BREAK, SETTINGS_CHANGED
  - `handleTimeJump` for sleep/wake clock skew
- Settings serialization (`src/lib/settings.ts`)
  - Round-trip serialize/deserialize
  - All corrupt/missing values fall back to defaults
- Sprite state mapping (`src/lib/spriteState.ts`)
  - Pure function: phase → animation key
  - Supports cat + dog × idle/nudge/happy/sleeping
- React store (`src/lib/store.ts`)
  - Context-based with mockable persistence boundary
  - Ticks every second via setInterval

#### M2 — React components
- `<Pet/>` — renders correct animation per phase
- `<Timer/>` — countdown + phase label
- `<Controls/>` — I moved / snooze / start break buttons
- `<Preferences/>` — settings UI with full dispatch wiring

### Automated verify run — GREEN ✅

```
2026-05-23 20:09
tsc --noEmit          PASS
eslint --max-warnings 0   PASS
vitest run            PASS (99 tests across 4 test files)
vite build            PASS
```

`npm run verify` exits 0. ✅

### Test coverage
- 99 unit/component tests covering:
  - Phase state machine (fake-timer driven transitions)
  - Countdown never-negative invariant
  - Off-by-one boundary guards
  - Time-jump clamping
  - Settings serialize/deserialize round-trips
  - Corrupt/missing settings fallback to defaults
  - Sprite state mapping exhaustiveness
  - React component rendering for each phase
  - Button dispatch wiring

### Manual native checklist (not yet verified)
- [ ] App launches as menu-bar item; popover opens
- [ ] Pet animates; states visibly differ
- [ ] Notification fires at break-due without stealing focus
- [ ] Launch-at-login works across a real reboot
- [ ] Settings persist across quit/relaunch
- [ ] Packaged build runs on a clean macOS user account
