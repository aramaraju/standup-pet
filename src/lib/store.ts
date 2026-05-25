/**
 * React context-based store for standup-pet.
 * Wraps the pure state machine with React hooks.
 */

import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
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
import { notifyBreakDue, onPhaseChange } from "./reminders";

const SETTINGS_KEY = "standup-pet-settings";

export interface StoreState {
  machine: MachineState;
  settings: AppSettings;
}

export type StoreAction =
  | { type: "MACHINE_EVENT"; event: MachineEvent }
  | { type: "UPDATE_SETTINGS"; settings: Partial<AppSettings> };

// Persistence boundary — can be mocked in tests
export interface Persistence {
  load(): string | null;
  save(data: string): void;
}

export const localStoragePersistence: Persistence = {
  load() {
    try {
      return localStorage.getItem(SETTINGS_KEY);
    } catch {
      return null;
    }
  },
  save(data: string) {
    try {
      localStorage.setItem(SETTINGS_KEY, data);
    } catch {
      // ignore write errors
    }
  },
};

export function createStore(
  nowMs: number,
  persistence: Persistence = localStoragePersistence
): StoreState {
  const rawSettings = persistence.load();
  const settings = deserializeSettings(rawSettings ?? undefined);
  return {
    machine: createInitialState(nowMs, settings),
    settings,
  };
}

function storeReducer(
  state: StoreState,
  action: StoreAction,
  persistence: Persistence
): StoreState {
  switch (action.type) {
    case "MACHINE_EVENT": {
      return {
        ...state,
        machine: transition(state.machine, action.event),
      };
    }
    case "UPDATE_SETTINGS": {
      const newSettings = { ...state.settings, ...action.settings };
      persistence.save(serializeSettings(newSettings));
      return {
        ...state,
        settings: newSettings,
        machine: {
          ...state.machine,
          settings: newSettings,
        },
      };
    }
  }
}

// --- React integration ---

import React from "react";

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

export function StoreProvider({ persistence = localStoragePersistence, children }: StoreProviderProps) {
  const [state, rawDispatch] = useReducer(
    (s: StoreState, a: StoreAction) => storeReducer(s, a, persistence),
    undefined,
    () => createStore(Date.now(), persistence)
  );

  const dispatch = useCallback((action: StoreAction) => rawDispatch(action), []);

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => {
      dispatch({
        type: "MACHINE_EVENT",
        event: { type: "TICK", nowMs: Date.now() },
      });
    }, 1000);
    return () => clearInterval(id);
  }, [dispatch]);

  // Passive break-due reminders (Raycast Focus style — no focus steal)
  const phase = state.machine.phase;
  useEffect(() => {
    onPhaseChange(phase);
    void notifyBreakDue(
      { pet: state.settings.petChoice, phase },
      state.settings.notificationsEnabled
    );
  }, [phase, state.settings.petChoice, state.settings.notificationsEnabled]);

  return React.createElement(StoreContext.Provider, { value: { state, dispatch } }, children);
}
