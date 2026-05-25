/**
 * Phase state machine for standup-pet.
 * Pure TypeScript — no native dependencies — fully unit-testable headlessly.
 */

export type Phase = "working" | "break-due" | "breaking";

export type MachineEvent =
  | { type: "TICK"; nowMs: number }
  | { type: "I_MOVED" }
  | { type: "SNOOZE" }
  | { type: "START_BREAK" }
  | { type: "PAUSE"; nowMs: number }
  | { type: "RESUME"; nowMs: number }
  | { type: "RESET"; nowMs: number }
  | { type: "SETTINGS_CHANGED"; settings: Partial<MachineSettings> };

export interface MachineSettings {
  workIntervalMs: number;
  breakDurationMs: number;
  snoozeMs: number;
  maxSnoozeMs: number;
}

export interface MachineState {
  phase: Phase;
  phaseStartMs: number;
  /** Ms remaining in current phase (never negative) */
  remainingMs: number;
  /** How many snooze steps have been applied since last phase change */
  snoozeCount: number;
  /** Epoch ms when paused, else null. While paused, TICK is a no-op. */
  pausedAt: number | null;
  settings: MachineSettings;
}

export const DEFAULT_SETTINGS: MachineSettings = {
  workIntervalMs: 50 * 60 * 1000, // 50 minutes
  breakDurationMs: 7 * 60 * 1000,  // 7 minutes
  snoozeMs: 5 * 60 * 1000,         // 5 minutes per snooze
  maxSnoozeMs: 15 * 60 * 1000,     // max 15 minutes total snooze
};

/**
 * Allowed transitions: from phase → allowed target phases.
 * Anything not listed is an illegal transition.
 */
const ALLOWED_TRANSITIONS: Record<Phase, Phase[]> = {
  working: ["break-due"],
  "break-due": ["breaking", "working"],
  breaking: ["working"],
};

function assertLegalTransition(from: Phase, to: Phase): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new Error(`Illegal phase transition: ${from} → ${to}`);
  }
}

export function createInitialState(
  nowMs: number,
  settings: Partial<MachineSettings> = {}
): MachineState {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  return {
    phase: "working",
    phaseStartMs: nowMs,
    remainingMs: merged.workIntervalMs,
    snoozeCount: 0,
    pausedAt: null,
    settings: merged,
  };
}

/**
 * Pure transition function — returns a new state (never mutates).
 * All time arithmetic is done via the event's nowMs to support fake timers.
 */
export function transition(state: MachineState, event: MachineEvent): MachineState {
  switch (event.type) {
    case "TICK": {
      if (state.pausedAt != null) {
        // Frozen — don't advance the clock until RESUME.
        return state;
      }
      const { nowMs } = event;
      const elapsed = Math.max(0, nowMs - state.phaseStartMs);

      switch (state.phase) {
        case "working": {
          const totalWork =
            state.settings.workIntervalMs +
            Math.min(state.snoozeCount * state.settings.snoozeMs, state.settings.maxSnoozeMs);
          const remaining = Math.max(0, totalWork - elapsed);
          if (remaining === 0) {
            assertLegalTransition("working", "break-due");
            return {
              ...state,
              phase: "break-due",
              phaseStartMs: nowMs,
              remainingMs: 0,
              snoozeCount: 0,
            };
          }
          return { ...state, remainingMs: remaining };
        }

        case "break-due": {
          // break-due has no timeout — user must act (I_MOVED or START_BREAK)
          return { ...state, remainingMs: 0 };
        }

        case "breaking": {
          const remaining = Math.max(
            0,
            state.settings.breakDurationMs - elapsed
          );
          if (remaining === 0) {
            assertLegalTransition("breaking", "working");
            return {
              ...state,
              phase: "working",
              phaseStartMs: nowMs,
              remainingMs: state.settings.workIntervalMs,
              snoozeCount: 0,
            };
          }
          return { ...state, remainingMs: remaining };
        }
      }
      break;
    }

    case "I_MOVED": {
      if (state.phase !== "break-due" && state.phase !== "breaking") {
        // I_MOVED is a no-op in working phase (user can hit it accidentally)
        return state;
      }
      const toPhase: Phase = "working";
      assertLegalTransition(state.phase, toPhase);
      // Use the last known time: since we don't have nowMs here, we'll use phaseStartMs
      // The caller should always send a TICK before I_MOVED, but we handle it gracefully.
      return {
        ...state,
        phase: "working",
        phaseStartMs: state.phaseStartMs, // Will be updated on next TICK
        remainingMs: state.settings.workIntervalMs,
        snoozeCount: 0,
      };
    }

    case "SNOOZE": {
      if (state.phase !== "break-due") {
        // Snooze only valid in break-due
        return state;
      }
      const alreadySnoozed = state.snoozeCount * state.settings.snoozeMs;
      if (alreadySnoozed >= state.settings.maxSnoozeMs) {
        // Already at max snooze — clamp, don't add more
        return state;
      }
      return {
        ...state,
        snoozeCount: state.snoozeCount + 1,
        // Transition back to working with extended interval via snoozeCount
        phase: "working",
        phaseStartMs: state.phaseStartMs,
        remainingMs:
          state.settings.workIntervalMs +
          Math.min(
            (state.snoozeCount + 1) * state.settings.snoozeMs,
            state.settings.maxSnoozeMs
          ),
      };
    }

    case "START_BREAK": {
      if (state.phase !== "break-due") {
        return state;
      }
      assertLegalTransition("break-due", "breaking");
      return {
        ...state,
        phase: "breaking",
        phaseStartMs: state.phaseStartMs,
        remainingMs: state.settings.breakDurationMs,
        snoozeCount: 0,
      };
    }

    case "PAUSE": {
      if (state.pausedAt != null) return state;
      return { ...state, pausedAt: event.nowMs };
    }

    case "RESUME": {
      if (state.pausedAt == null) return state;
      const shift = Math.max(0, event.nowMs - state.pausedAt);
      return {
        ...state,
        phaseStartMs: state.phaseStartMs + shift,
        pausedAt: null,
      };
    }

    case "RESET": {
      // Restart the working phase from scratch (cancel break/break-due).
      return {
        ...state,
        phase: "working",
        phaseStartMs: event.nowMs,
        remainingMs: state.settings.workIntervalMs,
        snoozeCount: 0,
        pausedAt: null,
      };
    }

    case "SETTINGS_CHANGED": {
      const newSettings = { ...state.settings, ...event.settings };
      return { ...state, settings: newSettings };
    }
  }
  return state;
}

/**
 * Handle a time jump (sleep/wake, clock skew).
 * Clamps the phase-start to prevent negative remaining time.
 */
export function handleTimeJump(state: MachineState, nowMs: number): MachineState {
  // If the clock jumped backward, reset phaseStartMs to nowMs
  if (nowMs < state.phaseStartMs) {
    return { ...state, phaseStartMs: nowMs };
  }
  // If the clock jumped forward by more than 1 hour, clamp elapsed to phase limit
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const elapsed = nowMs - state.phaseStartMs;
  if (elapsed > ONE_HOUR_MS) {
    // Clamp: treat as if exactly the phase duration passed
    const phaseDuration =
      state.phase === "working"
        ? state.settings.workIntervalMs
        : state.phase === "breaking"
        ? state.settings.breakDurationMs
        : 0;
    return {
      ...state,
      phaseStartMs: nowMs - Math.min(elapsed, phaseDuration + 1000),
    };
  }
  return state;
}
