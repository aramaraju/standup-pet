/**
 * Component + utility tests for the main popover surface.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { StoreContext, type StoreContextValue, type StoreState } from "../lib/store";
import { createInitialState } from "../lib/timerMachine";
import { DEFAULT_APP_SETTINGS } from "../lib/settings";
import { createInitialWaterState } from "../lib/water";
import { formatMs } from "../lib/time";
import { Preferences } from "../components/Preferences";
import { PetPicker } from "../components/PetPicker";

const NOW = 1_000_000;

function makeStoreState(overrides: Partial<StoreState["machine"]> = {}): StoreState {
  const machine = {
    ...createInitialState(NOW, {
      workIntervalMs: 50 * 60 * 1000,
      breakDurationMs: 7 * 60 * 1000,
      snoozeMs: 5 * 60 * 1000,
      maxSnoozeMs: 15 * 60 * 1000,
    }),
    ...overrides,
  };
  return {
    machine,
    settings: { ...DEFAULT_APP_SETTINGS },
    water: createInitialWaterState(NOW, DEFAULT_APP_SETTINGS.water),
  };
}

function renderWithStore(
  ui: React.ReactElement,
  storeState?: StoreState,
  dispatchFn?: (action: Parameters<StoreContextValue["dispatch"]>[0]) => void
) {
  const dispatch = dispatchFn ?? vi.fn();
  const state = storeState ?? makeStoreState();
  const contextValue: StoreContextValue = { state, dispatch };

  return {
    ...render(
      React.createElement(StoreContext.Provider, { value: contextValue }, ui)
    ),
    dispatch,
    state,
  };
}

// --- formatMs utility ---

describe("formatMs", () => {
  it("formats 0ms as 00:00", () => {
    expect(formatMs(0)).toBe("00:00");
  });

  it("formats 90000ms (90s) as 01:30", () => {
    expect(formatMs(90_000)).toBe("01:30");
  });

  it("formats 3600000ms (60 min) as 60:00", () => {
    expect(formatMs(3_600_000)).toBe("60:00");
  });

  it("never returns negative", () => {
    expect(formatMs(-5000)).toBe("00:00");
  });
});

// --- Preferences component ---

describe("<Preferences/>", () => {
  it("renders preferences panel", () => {
    renderWithStore(React.createElement(Preferences));
    expect(screen.getByTestId("preferences")).toBeInTheDocument();
  });

  it("shows current work interval in minutes", () => {
    renderWithStore(React.createElement(Preferences));
    const input = screen.getByTestId("work-interval-input") as HTMLInputElement;
    expect(input.value).toBe("50");
  });

  it("updating work interval dispatches UPDATE_SETTINGS", () => {
    const { dispatch } = renderWithStore(React.createElement(Preferences));
    fireEvent.change(screen.getByTestId("work-interval-input"), {
      target: { value: "25" },
    });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UPDATE_SETTINGS",
        settings: expect.objectContaining({ workIntervalMs: 25 * 60000 }),
      })
    );
  });

  it("updating break duration dispatches UPDATE_SETTINGS", () => {
    const { dispatch } = renderWithStore(React.createElement(Preferences));
    fireEvent.change(screen.getByTestId("break-duration-input"), {
      target: { value: "10" },
    });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UPDATE_SETTINGS",
        settings: expect.objectContaining({ breakDurationMs: 10 * 60000 }),
      })
    );
  });

  it("toggling sound dispatches UPDATE_SETTINGS", () => {
    const { dispatch } = renderWithStore(React.createElement(Preferences));
    fireEvent.click(screen.getByTestId("sound-toggle"));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "UPDATE_SETTINGS" })
    );
  });

  it("renders pet picker grid", () => {
    renderWithStore(React.createElement(Preferences));
    expect(screen.getByTestId("pet-picker")).toBeInTheDocument();
    expect(screen.getByTestId("pet-tile-dog")).toBeInTheDocument();
    expect(screen.getByTestId("pet-tile-frog")).toBeInTheDocument();
  });

  it("selecting pet tile dispatches UPDATE_SETTINGS with petChoice", () => {
    const { dispatch } = renderWithStore(React.createElement(Preferences));
    fireEvent.click(screen.getByTestId("pet-tile-dog"));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UPDATE_SETTINGS",
        settings: expect.objectContaining({ petChoice: "dog" }),
      })
    );
  });
});

// --- PetPicker component ---

describe("<PetPicker/>", () => {
  it("calls onChange when tile clicked", () => {
    const onChange = vi.fn();
    renderWithStore(
      React.createElement(PetPicker, { value: "cat", onChange }),
      makeStoreState()
    );
    fireEvent.click(screen.getByTestId("pet-tile-bear"));
    expect(onChange).toHaveBeenCalledWith("bear");
  });
});
