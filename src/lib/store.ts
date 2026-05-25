/**
 * React context-based store for standup-pet.
 * Wraps the pure state machine + water reminder logic with React hooks.
 */

import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import React from "react";
import {
  createInitialState,
  transition,
  type MachineState,
  type MachineEvent,
} from "./timerMachine";
import {
  deserializeSettings,
  serializeSettings,
  type AppSettings,
} from "./settings";
import { notifyBreakDue, notifyWater, onPhaseChange, flashBorder } from "./reminders";
import { phaseToAnimation } from "./spriteState";
import { syncTrayIcon } from "./traySync";
import {
  createInitialWaterState,
  waterTransition,
  type WaterEvent,
  type WaterState,
} from "./water";

const SETTINGS_KEY = "standup-pet-settings";
const WATER_KEY = "standup-pet-water";

export interface StoreState {
  machine: MachineState;
  settings: AppSettings;
  water: WaterState;
}

export type StoreAction =
  | { type: "MACHINE_EVENT"; event: MachineEvent }
  | { type: "WATER_EVENT"; event: WaterEvent }
  | { type: "UPDATE_SETTINGS"; settings: Partial<AppSettings> };

export interface Persistence {
  load(key: string): string | null;
  save(key: string, data: string): void;
}

export const localStoragePersistence: Persistence = {
  load(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  save(key, data) {
    try {
      localStorage.setItem(key, data);
    } catch {
      // ignore write errors
    }
  },
};

export function createStore(
  nowMs: number,
  persistence: Persistence = localStoragePersistence
): StoreState {
  const settings = deserializeSettings(persistence.load(SETTINGS_KEY) ?? undefined);
  const rawWater = persistence.load(WATER_KEY);
  let water: WaterState;
  try {
    water = rawWater ? JSON.parse(rawWater) : createInitialWaterState(nowMs, settings.water);
  } catch {
    water = createInitialWaterState(nowMs, settings.water);
  }
  return {
    machine: createInitialState(nowMs, settings),
    settings,
    water,
  };
}

function storeReducer(
  state: StoreState,
  action: StoreAction,
  persistence: Persistence
): StoreState {
  switch (action.type) {
    case "MACHINE_EVENT":
      return { ...state, machine: transition(state.machine, action.event) };
    case "WATER_EVENT": {
      const { state: nextWater } = waterTransition(
        state.water,
        state.settings.water,
        action.event
      );
      if (nextWater === state.water) return state;
      persistence.save(WATER_KEY, JSON.stringify(nextWater));
      return { ...state, water: nextWater };
    }
    case "UPDATE_SETTINGS": {
      const newSettings = { ...state.settings, ...action.settings };
      persistence.save(SETTINGS_KEY, serializeSettings(newSettings));
      // Water settings changes reschedule the next reminder.
      const { state: nextWater } = waterTransition(state.water, newSettings.water, {
        type: "SETTINGS_CHANGED",
        nowMs: Date.now(),
        settings: newSettings.water,
      });
      persistence.save(WATER_KEY, JSON.stringify(nextWater));
      return {
        ...state,
        settings: newSettings,
        water: nextWater,
        machine: { ...state.machine, settings: newSettings },
      };
    }
  }
}

export interface StoreContextValue {
  state: StoreState;
  dispatch: (action: StoreAction) => void;
}

export const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export interface StoreProviderProps {
  persistence?: Persistence;
  children: React.ReactNode;
}

export function StoreProvider({
  persistence = localStoragePersistence,
  children,
}: StoreProviderProps) {
  const [state, rawDispatch] = useReducer(
    (s: StoreState, a: StoreAction) => storeReducer(s, a, persistence),
    undefined,
    () => createStore(Date.now(), persistence)
  );

  const dispatch = useCallback((action: StoreAction) => rawDispatch(action), []);

  // Per-second tick — drives both the phase machine and the water scheduler.
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      dispatch({ type: "MACHINE_EVENT", event: { type: "TICK", nowMs: now } });
      dispatch({ type: "WATER_EVENT", event: { type: "TICK", nowMs: now } });
    }, 1000);
    return () => clearInterval(id);
  }, [dispatch]);

  // Phase-change side effects: tray icon + native notification + flash.
  const phase = state.machine.phase;
  useEffect(() => {
    onPhaseChange(phase);
    void notifyBreakDue(
      { pet: state.settings.petChoice, phase },
      state.settings.notificationsEnabled
    );
  }, [phase, state.settings.petChoice, state.settings.notificationsEnabled]);

  const trayAnimation = phaseToAnimation(phase);
  useEffect(() => {
    void syncTrayIcon(state.settings.petChoice, trayAnimation);
  }, [state.settings.petChoice, trayAnimation]);

  // Water reminder firing: check transition output via re-running it side-effect
  // free, then fire notification and mark FIRED to advance the schedule.
  useEffect(() => {
    if (!state.settings.water.enabled) return;
    const now = Date.now();
    const { shouldFire } = waterTransition(state.water, state.settings.water, {
      type: "TICK",
      nowMs: now,
    });
    if (shouldFire && state.settings.notificationsEnabled) {
      void notifyWater(state.water.cupsToday, state.settings.water.dailyGoalCups);
      dispatch({ type: "WATER_EVENT", event: { type: "FIRED", nowMs: now } });
    }
  }, [
    state.water,
    state.settings.water,
    state.settings.notificationsEnabled,
    dispatch,
  ]);

  // Manual entry-point: parent can also trigger a flash imperatively.
  useEffect(() => {
    if (phase === "breaking") void flashBorder("#34c759", 1500);
  }, [phase]);

  return React.createElement(
    StoreContext.Provider,
    { value: { state, dispatch } },
    children
  );
}
