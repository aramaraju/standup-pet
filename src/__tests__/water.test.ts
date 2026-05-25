import { describe, it, expect } from "vitest";
import {
  DEFAULT_WATER_SETTINGS,
  createInitialWaterState,
  sanitizeWaterSettings,
  scheduleNext,
  waterTransition,
} from "../lib/water";

const NOW = new Date("2026-05-24T10:00:00").getTime();

describe("water scheduler", () => {
  it("schedules next reminder intervalMin into the future during active hours", () => {
    const next = scheduleNext(NOW, DEFAULT_WATER_SETTINGS);
    expect(next - NOW).toBe(DEFAULT_WATER_SETTINGS.intervalMin * 60_000);
  });

  it("pushes scheduling to next day's start hour when after endHour", () => {
    const eod = new Date("2026-05-24T20:00:00").getTime();
    const next = scheduleNext(eod, DEFAULT_WATER_SETTINGS);
    const d = new Date(next);
    expect(d.getDate()).toBe(25);
    expect(d.getHours()).toBe(DEFAULT_WATER_SETTINGS.startHour);
  });

  it("TICK before nextReminderAt does not fire", () => {
    const state = createInitialWaterState(NOW, DEFAULT_WATER_SETTINGS);
    const out = waterTransition(state, DEFAULT_WATER_SETTINGS, {
      type: "TICK",
      nowMs: NOW + 1000,
    });
    expect(out.shouldFire).toBe(false);
    expect(out.state).toBe(state);
  });

  it("TICK at-or-after nextReminderAt during active hours fires", () => {
    const state = createInitialWaterState(NOW, DEFAULT_WATER_SETTINGS);
    const out = waterTransition(state, DEFAULT_WATER_SETTINGS, {
      type: "TICK",
      nowMs: state.nextReminderAt + 1000,
    });
    expect(out.shouldFire).toBe(true);
  });

  it("DRINK increments cupsToday and reschedules", () => {
    const state = createInitialWaterState(NOW, DEFAULT_WATER_SETTINGS);
    const out = waterTransition(state, DEFAULT_WATER_SETTINGS, {
      type: "DRINK",
      nowMs: NOW + 5000,
    });
    expect(out.state.cupsToday).toBe(1);
    expect(out.state.nextReminderAt).toBeGreaterThan(state.nextReminderAt);
  });

  it("SNOOZE pushes nextReminderAt by snoozeMin", () => {
    const state = createInitialWaterState(NOW, DEFAULT_WATER_SETTINGS);
    const out = waterTransition(state, DEFAULT_WATER_SETTINGS, {
      type: "SNOOZE",
      nowMs: NOW,
    });
    expect(out.state.nextReminderAt - NOW).toBe(
      DEFAULT_WATER_SETTINGS.snoozeMin * 60_000
    );
  });

  it("rolls over cupsToday on new day", () => {
    const state = {
      ...createInitialWaterState(NOW, DEFAULT_WATER_SETTINGS),
      cupsToday: 5,
    };
    const tomorrow = NOW + 86_400_000;
    const out = waterTransition(state, DEFAULT_WATER_SETTINGS, {
      type: "TICK",
      nowMs: tomorrow,
    });
    expect(out.state.cupsToday).toBe(0);
  });

  it("sanitizeWaterSettings clamps out-of-range values", () => {
    const s = sanitizeWaterSettings({
      intervalMin: -10,
      startHour: 50,
      endHour: -1,
      dailyGoalCups: 999,
      snoozeMin: 0,
    });
    expect(s.intervalMin).toBe(5);
    expect(s.startHour).toBe(23);
    expect(s.endHour).toBe(1);
    expect(s.dailyGoalCups).toBe(30);
    expect(s.snoozeMin).toBe(1);
  });

  it("disabled scheduler never fires", () => {
    const state = createInitialWaterState(NOW, DEFAULT_WATER_SETTINGS);
    const out = waterTransition(state, { ...DEFAULT_WATER_SETTINGS, enabled: false }, {
      type: "TICK",
      nowMs: state.nextReminderAt + 1000,
    });
    expect(out.shouldFire).toBe(false);
  });
});
