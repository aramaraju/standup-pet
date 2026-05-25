/**
 * Water reminder logic — pure functions, no I/O.
 * Tracks: cups consumed today + when the next reminder should fire.
 */

export interface WaterSettings {
  enabled: boolean;
  /** Minutes between reminders */
  intervalMin: number;
  /** Hour-of-day (0-23) when reminders start */
  startHour: number;
  /** Hour-of-day (0-23) when reminders stop */
  endHour: number;
  /** Daily cup goal */
  dailyGoalCups: number;
  /** Minutes to snooze when user defers */
  snoozeMin: number;
}

export const DEFAULT_WATER_SETTINGS: WaterSettings = {
  enabled: true,
  intervalMin: 45,
  startHour: 9,
  endHour: 18,
  dailyGoalCups: 8,
  snoozeMin: 10,
};

export interface WaterState {
  /** YYYY-MM-DD that `cupsToday` was last reset for */
  dateKey: string;
  cupsToday: number;
  /** Epoch ms when the next reminder should fire (0 = compute fresh) */
  nextReminderAt: number;
  /** Epoch ms when the last reminder was actually dispatched (dedupe) */
  lastFiredAt: number;
}

export function todayKey(nowMs: number): string {
  const d = new Date(nowMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function createInitialWaterState(nowMs: number, settings: WaterSettings): WaterState {
  return {
    dateKey: todayKey(nowMs),
    cupsToday: 0,
    nextReminderAt: scheduleNext(nowMs, settings),
    lastFiredAt: 0,
  };
}

function withinActiveHours(nowMs: number, settings: WaterSettings): boolean {
  const h = new Date(nowMs).getHours();
  return h >= settings.startHour && h < settings.endHour;
}

/** Next firing time, snapped forward into active hours if needed. */
export function scheduleNext(nowMs: number, settings: WaterSettings): number {
  const intervalMs = Math.max(1, settings.intervalMin) * 60_000;
  let target = nowMs + intervalMs;

  const d = new Date(target);
  if (d.getHours() < settings.startHour) {
    d.setHours(settings.startHour, 0, 0, 0);
    target = d.getTime();
  } else if (d.getHours() >= settings.endHour) {
    // push to next day's start hour
    d.setDate(d.getDate() + 1);
    d.setHours(settings.startHour, 0, 0, 0);
    target = d.getTime();
  }
  return target;
}

export type WaterEvent =
  | { type: "TICK"; nowMs: number }
  | { type: "DRINK"; nowMs: number }
  | { type: "SNOOZE"; nowMs: number }
  | { type: "FIRED"; nowMs: number }
  | { type: "SETTINGS_CHANGED"; nowMs: number; settings: WaterSettings };

export interface WaterTransition {
  state: WaterState;
  /** True iff the caller should dispatch a reminder right now. */
  shouldFire: boolean;
}

function rollOverIfNewDay(state: WaterState, nowMs: number): WaterState {
  const key = todayKey(nowMs);
  if (key !== state.dateKey) {
    return { ...state, dateKey: key, cupsToday: 0 };
  }
  return state;
}

export function waterTransition(
  state: WaterState,
  settings: WaterSettings,
  event: WaterEvent
): WaterTransition {
  switch (event.type) {
    case "TICK": {
      const rolled = rollOverIfNewDay(state, event.nowMs);
      if (!settings.enabled) {
        return { state: rolled, shouldFire: false };
      }
      if (event.nowMs < rolled.nextReminderAt) {
        return { state: rolled, shouldFire: false };
      }
      if (!withinActiveHours(event.nowMs, settings)) {
        return {
          state: { ...rolled, nextReminderAt: scheduleNext(event.nowMs, settings) },
          shouldFire: false,
        };
      }
      // Dedupe: don't fire twice within the same minute window.
      if (event.nowMs - rolled.lastFiredAt < 30_000) {
        return { state: rolled, shouldFire: false };
      }
      return { state: rolled, shouldFire: true };
    }
    case "FIRED": {
      return {
        state: {
          ...state,
          lastFiredAt: event.nowMs,
          nextReminderAt: scheduleNext(event.nowMs, settings),
        },
        shouldFire: false,
      };
    }
    case "DRINK": {
      const rolled = rollOverIfNewDay(state, event.nowMs);
      return {
        state: {
          ...rolled,
          cupsToday: Math.min(rolled.cupsToday + 1, 99),
          nextReminderAt: scheduleNext(event.nowMs, settings),
        },
        shouldFire: false,
      };
    }
    case "SNOOZE": {
      const target = event.nowMs + Math.max(1, settings.snoozeMin) * 60_000;
      return {
        state: { ...state, nextReminderAt: target },
        shouldFire: false,
      };
    }
    case "SETTINGS_CHANGED": {
      return {
        state: { ...state, nextReminderAt: scheduleNext(event.nowMs, event.settings) },
        shouldFire: false,
      };
    }
  }
}

export function sanitizeWaterSettings(input: Partial<WaterSettings> | undefined): WaterSettings {
  const s = { ...DEFAULT_WATER_SETTINGS, ...(input ?? {}) };
  return {
    enabled: typeof s.enabled === "boolean" ? s.enabled : DEFAULT_WATER_SETTINGS.enabled,
    intervalMin: clampInt(s.intervalMin, 5, 240, DEFAULT_WATER_SETTINGS.intervalMin),
    startHour: clampInt(s.startHour, 0, 23, DEFAULT_WATER_SETTINGS.startHour),
    endHour: clampInt(s.endHour, 1, 24, DEFAULT_WATER_SETTINGS.endHour),
    dailyGoalCups: clampInt(s.dailyGoalCups, 1, 30, DEFAULT_WATER_SETTINGS.dailyGoalCups),
    snoozeMin: clampInt(s.snoozeMin, 1, 120, DEFAULT_WATER_SETTINGS.snoozeMin),
  };
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, Math.round(v)));
}
