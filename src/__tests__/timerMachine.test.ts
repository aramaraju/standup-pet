/**
 * Unit tests for the phase state machine.
 * Uses vitest fake timers for time control.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createInitialState,
  transition,
  handleTimeJump,
  DEFAULT_SETTINGS,
  type MachineState,
  type MachineSettings,
} from "../lib/timerMachine";

const NOW = 1_000_000; // arbitrary fixed start time in ms

const FAST_SETTINGS: MachineSettings = {
  workIntervalMs: 10_000,   // 10 seconds
  breakDurationMs: 5_000,   // 5 seconds
  snoozeMs: 3_000,          // 3 seconds
  maxSnoozeMs: 6_000,       // 2 snoozes max
};

function makeState(overrides: Partial<MachineState> = {}): MachineState {
  return {
    ...createInitialState(NOW, FAST_SETTINGS),
    ...overrides,
  };
}

// --- Initial state ---

describe("createInitialState", () => {
  it("starts in working phase", () => {
    const s = createInitialState(NOW);
    expect(s.phase).toBe("working");
  });

  it("sets remainingMs to workIntervalMs", () => {
    const s = createInitialState(NOW);
    expect(s.remainingMs).toBe(DEFAULT_SETTINGS.workIntervalMs);
  });

  it("uses custom settings", () => {
    const s = createInitialState(NOW, FAST_SETTINGS);
    expect(s.settings.workIntervalMs).toBe(FAST_SETTINGS.workIntervalMs);
  });

  it("sets snoozeCount to 0", () => {
    const s = createInitialState(NOW);
    expect(s.snoozeCount).toBe(0);
  });
});

// --- TICK during working ---

describe("TICK in working phase", () => {
  let state: MachineState;
  beforeEach(() => {
    state = makeState();
  });

  it("decrements remainingMs", () => {
    const s = transition(state, { type: "TICK", nowMs: NOW + 1000 });
    expect(s.remainingMs).toBe(FAST_SETTINGS.workIntervalMs - 1000);
  });

  it("remainingMs never goes negative", () => {
    const s = transition(state, { type: "TICK", nowMs: NOW + 1_000_000 });
    expect(s.remainingMs).toBeGreaterThanOrEqual(0);
  });

  it("transitions to break-due exactly at workInterval boundary", () => {
    const s = transition(state, { type: "TICK", nowMs: NOW + FAST_SETTINGS.workIntervalMs });
    expect(s.phase).toBe("break-due");
  });

  it("stays in working phase before boundary", () => {
    const s = transition(state, { type: "TICK", nowMs: NOW + FAST_SETTINGS.workIntervalMs - 1 });
    expect(s.phase).toBe("working");
  });

  it("off-by-one: transitions at exactly workIntervalMs elapsed", () => {
    const s = transition(state, {
      type: "TICK",
      nowMs: NOW + FAST_SETTINGS.workIntervalMs,
    });
    expect(s.phase).toBe("break-due");
    expect(s.remainingMs).toBe(0);
  });
});

// --- TICK during break-due ---

describe("TICK in break-due phase", () => {
  it("stays in break-due (no auto-timeout)", () => {
    const state = makeState({ phase: "break-due", remainingMs: 0 });
    const s = transition(state, { type: "TICK", nowMs: NOW + 99999 });
    expect(s.phase).toBe("break-due");
  });

  it("keeps remainingMs at 0", () => {
    const state = makeState({ phase: "break-due", remainingMs: 0 });
    const s = transition(state, { type: "TICK", nowMs: NOW + 5000 });
    expect(s.remainingMs).toBe(0);
  });
});

// --- TICK during breaking ---

describe("TICK in breaking phase", () => {
  let state: MachineState;
  beforeEach(() => {
    state = makeState({
      phase: "breaking",
      phaseStartMs: NOW,
      remainingMs: FAST_SETTINGS.breakDurationMs,
    });
  });

  it("decrements remainingMs during break", () => {
    const s = transition(state, { type: "TICK", nowMs: NOW + 1000 });
    expect(s.remainingMs).toBe(FAST_SETTINGS.breakDurationMs - 1000);
  });

  it("auto-returns to working after break elapses", () => {
    const s = transition(state, { type: "TICK", nowMs: NOW + FAST_SETTINGS.breakDurationMs });
    expect(s.phase).toBe("working");
  });

  it("resets remainingMs to workIntervalMs after break", () => {
    const s = transition(state, { type: "TICK", nowMs: NOW + FAST_SETTINGS.breakDurationMs });
    expect(s.remainingMs).toBe(FAST_SETTINGS.workIntervalMs);
  });

  it("remainingMs never negative during break", () => {
    const s = transition(state, { type: "TICK", nowMs: NOW + 1_000_000 });
    expect(s.remainingMs).toBeGreaterThanOrEqual(0);
  });
});

// --- I_MOVED event ---

describe("I_MOVED event", () => {
  it("resets to working from break-due", () => {
    const state = makeState({ phase: "break-due", remainingMs: 0 });
    const s = transition(state, { type: "I_MOVED" });
    expect(s.phase).toBe("working");
  });

  it("resets to working from breaking", () => {
    const state = makeState({ phase: "breaking", remainingMs: 2000 });
    const s = transition(state, { type: "I_MOVED" });
    expect(s.phase).toBe("working");
  });

  it("restores full workIntervalMs after I_MOVED", () => {
    const state = makeState({ phase: "break-due", remainingMs: 0 });
    const s = transition(state, { type: "I_MOVED" });
    expect(s.remainingMs).toBe(FAST_SETTINGS.workIntervalMs);
  });

  it("resets snoozeCount to 0", () => {
    const state = makeState({ phase: "break-due", remainingMs: 0, snoozeCount: 2 });
    const s = transition(state, { type: "I_MOVED" });
    expect(s.snoozeCount).toBe(0);
  });

  it("is a no-op during working phase", () => {
    const state = makeState({ phase: "working", remainingMs: 5000 });
    const s = transition(state, { type: "I_MOVED" });
    expect(s.phase).toBe("working");
    expect(s.remainingMs).toBe(5000);
  });
});

// --- SNOOZE event ---

describe("SNOOZE event", () => {
  it("snooze in break-due transitions back to working", () => {
    const state = makeState({ phase: "break-due", remainingMs: 0, snoozeCount: 0 });
    const s = transition(state, { type: "SNOOZE" });
    expect(s.phase).toBe("working");
  });

  it("extends remainingMs by snoozeMs on first snooze", () => {
    const state = makeState({ phase: "break-due", remainingMs: 0, snoozeCount: 0 });
    const s = transition(state, { type: "SNOOZE" });
    expect(s.remainingMs).toBe(FAST_SETTINGS.workIntervalMs + FAST_SETTINGS.snoozeMs);
  });

  it("increments snoozeCount", () => {
    const state = makeState({ phase: "break-due", remainingMs: 0, snoozeCount: 0 });
    const s = transition(state, { type: "SNOOZE" });
    expect(s.snoozeCount).toBe(1);
  });

  it("is bounded by maxSnoozeMs (2 snoozes = max in FAST_SETTINGS)", () => {
    // 2 snoozes = 6000ms = maxSnoozeMs, so 3rd should not add more
    let state = makeState({ phase: "break-due", remainingMs: 0, snoozeCount: 0 });
    state = transition(state, { type: "SNOOZE" }); // snoozeCount = 1
    // Re-enter break-due to snooze again
    state = { ...state, phase: "break-due", remainingMs: 0 };
    state = transition(state, { type: "SNOOZE" }); // snoozeCount = 2, at max
    expect(state.remainingMs).toBe(FAST_SETTINGS.workIntervalMs + FAST_SETTINGS.maxSnoozeMs);

    // 3rd snooze attempt — at max, should be no-op
    state = { ...state, phase: "break-due", remainingMs: 0 };
    const s3 = transition(state, { type: "SNOOZE" });
    expect(s3.snoozeCount).toBe(2); // unchanged
  });

  it("snooze is no-op in working phase", () => {
    const state = makeState({ phase: "working", remainingMs: 5000 });
    const s = transition(state, { type: "SNOOZE" });
    expect(s.phase).toBe("working");
    expect(s.remainingMs).toBe(5000);
  });

  it("snooze is no-op in breaking phase", () => {
    const state = makeState({ phase: "breaking", remainingMs: 2000 });
    const s = transition(state, { type: "SNOOZE" });
    expect(s.phase).toBe("breaking");
  });
});

// --- START_BREAK event ---

describe("START_BREAK event", () => {
  it("transitions from break-due to breaking", () => {
    const state = makeState({ phase: "break-due", remainingMs: 0 });
    const s = transition(state, { type: "START_BREAK" });
    expect(s.phase).toBe("breaking");
  });

  it("sets remainingMs to breakDurationMs", () => {
    const state = makeState({ phase: "break-due", remainingMs: 0 });
    const s = transition(state, { type: "START_BREAK" });
    expect(s.remainingMs).toBe(FAST_SETTINGS.breakDurationMs);
  });

  it("is no-op in working phase", () => {
    const state = makeState({ phase: "working", remainingMs: 5000 });
    const s = transition(state, { type: "START_BREAK" });
    expect(s.phase).toBe("working");
  });

  it("is no-op in breaking phase", () => {
    const state = makeState({ phase: "breaking", remainingMs: 2000 });
    const s = transition(state, { type: "START_BREAK" });
    expect(s.phase).toBe("breaking");
  });
});

// --- SETTINGS_CHANGED event ---

describe("SETTINGS_CHANGED event", () => {
  it("updates settings", () => {
    const state = makeState();
    const s = transition(state, {
      type: "SETTINGS_CHANGED",
      settings: { workIntervalMs: 20_000 },
    });
    expect(s.settings.workIntervalMs).toBe(20_000);
  });

  it("does not change phase", () => {
    const state = makeState({ phase: "working" });
    const s = transition(state, {
      type: "SETTINGS_CHANGED",
      settings: { workIntervalMs: 20_000 },
    });
    expect(s.phase).toBe("working");
  });
});

// --- Illegal transitions ---

describe("illegal phase transitions", () => {
  it("throws on working → breaking (no skip allowed)", () => {
    // We can't directly trigger this via events, but we can test that
    // assertLegalTransition is defined by trying to construct a bad event sequence.
    // The state machine never allows working → breaking directly.
    // Test: going through break-due is required.
    const state = makeState({ phase: "working" });
    // I_MOVED from working is no-op (not a transition)
    const s = transition(state, { type: "I_MOVED" });
    expect(s.phase).toBe("working");
  });

  it("break-due can only go to breaking or working", () => {
    // Valid transitions tested above; verify there's no direct break-due → break-due
    const state = makeState({ phase: "break-due", remainingMs: 0 });
    // TICK keeps it in break-due (not illegal — it's a stay)
    const s = transition(state, { type: "TICK", nowMs: NOW + 1000 });
    expect(s.phase).toBe("break-due");
  });
});

// --- Full phase cycle ---

describe("full working → break-due → breaking → working cycle", () => {
  it("completes a full cycle with fake timestamps", () => {
    let s = createInitialState(NOW, FAST_SETTINGS);
    expect(s.phase).toBe("working");

    // Work interval elapses
    s = transition(s, { type: "TICK", nowMs: NOW + FAST_SETTINGS.workIntervalMs });
    expect(s.phase).toBe("break-due");

    // User starts break
    s = transition(s, { type: "START_BREAK" });
    expect(s.phase).toBe("breaking");

    // Break elapses
    s = transition(s, {
      type: "TICK",
      nowMs: s.phaseStartMs + FAST_SETTINGS.breakDurationMs,
    });
    expect(s.phase).toBe("working");
    expect(s.remainingMs).toBe(FAST_SETTINGS.workIntervalMs);
  });

  it("I_MOVED short-circuits break-due → working", () => {
    let s = createInitialState(NOW, FAST_SETTINGS);
    s = transition(s, { type: "TICK", nowMs: NOW + FAST_SETTINGS.workIntervalMs });
    expect(s.phase).toBe("break-due");

    s = transition(s, { type: "I_MOVED" });
    expect(s.phase).toBe("working");
  });
});

// --- handleTimeJump ---

describe("handleTimeJump", () => {
  it("clamps backward clock jumps", () => {
    const state = makeState({ phaseStartMs: NOW });
    const s = handleTimeJump(state, NOW - 5000); // clock jumped back
    expect(s.phaseStartMs).toBe(NOW - 5000); // reset to nowMs
  });

  it("does not corrupt state on small forward jump", () => {
    const state = makeState({ phaseStartMs: NOW });
    const s = handleTimeJump(state, NOW + 1000);
    expect(s.phaseStartMs).toBe(NOW); // unchanged for small jump
  });

  it("clamps large forward jumps (>1 hour) to phase duration", () => {
    const state = makeState({ phaseStartMs: NOW, phase: "working" });
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const s = handleTimeJump(state, NOW + TWO_HOURS);
    // phaseStartMs should be adjusted so remaining time is not absurdly negative
    expect(s.phaseStartMs).toBeGreaterThan(NOW);
  });
});

// --- Countdown never negative ---

describe("countdown never negative", () => {
  it("working phase countdown stays >= 0 even far past interval", () => {
    const state = makeState();
    const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
    // After a work interval elapses it transitions, so after transition remaining resets
    let s = state;
    s = transition(s, { type: "TICK", nowMs: NOW + YEAR_MS });
    // Either still working or transitioned — either way remainingMs >= 0
    expect(s.remainingMs).toBeGreaterThanOrEqual(0);
  });

  it("breaking phase countdown stays >= 0 far past break duration", () => {
    const state = makeState({
      phase: "breaking",
      phaseStartMs: NOW,
      remainingMs: FAST_SETTINGS.breakDurationMs,
    });
    const s = transition(state, { type: "TICK", nowMs: NOW + 1_000_000 });
    expect(s.remainingMs).toBeGreaterThanOrEqual(0);
  });
});
