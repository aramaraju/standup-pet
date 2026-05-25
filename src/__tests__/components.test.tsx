/**
 * React component tests using React Testing Library.
 * Tests Pet, Timer, Controls, and Preferences components.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { StoreContext, type StoreContextValue, type StoreState } from "../lib/store";
import { createInitialState } from "../lib/timerMachine";
import { DEFAULT_APP_SETTINGS } from "../lib/settings";
import { createInitialWaterState } from "../lib/water";
import { Pet } from "../components/Pet";
import { Timer, formatMs } from "../components/Timer";
import { Controls } from "../components/Controls";
import { Preferences } from "../components/Preferences";
import { ReminderBar } from "../components/ReminderBar";
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

// --- Pet component ---

describe("<Pet/>", () => {
  it("renders idle animation for working phase", () => {
    renderWithStore(React.createElement(Pet), makeStoreState({ phase: "working" }));
    const pet = screen.getByRole("img");
    expect(pet).toHaveAttribute("data-animation", "idle");
    expect(pet).toHaveAttribute("data-phase", "working");
  });

  it("renders nudge animation for break-due phase", () => {
    renderWithStore(React.createElement(Pet), makeStoreState({ phase: "break-due" }));
    const pet = screen.getByRole("img");
    expect(pet).toHaveAttribute("data-animation", "nudge");
    expect(pet).toHaveAttribute("data-phase", "break-due");
  });

  it("renders happy animation for breaking phase", () => {
    renderWithStore(React.createElement(Pet), makeStoreState({ phase: "breaking" }));
    const pet = screen.getByRole("img");
    expect(pet).toHaveAttribute("data-animation", "happy");
    expect(pet).toHaveAttribute("data-phase", "breaking");
  });

  it("uses phaseOverride prop", () => {
    renderWithStore(
      React.createElement(Pet, { phaseOverride: "break-due" }),
      makeStoreState({ phase: "working" })
    );
    const pet = screen.getByRole("img");
    expect(pet).toHaveAttribute("data-animation", "nudge");
  });

  it("has accessible aria-label", () => {
    renderWithStore(React.createElement(Pet), makeStoreState({ phase: "working" }));
    const pet = screen.getByRole("img");
    expect(pet.getAttribute("aria-label")).toBeTruthy();
  });
});

// --- Timer component ---

describe("<Timer/>", () => {
  it("displays Working label in working phase", () => {
    renderWithStore(React.createElement(Timer), makeStoreState({ phase: "working" }));
    expect(screen.getByText("Working")).toBeInTheDocument();
  });

  it("displays break-due label in break-due phase", () => {
    renderWithStore(React.createElement(Timer), makeStoreState({ phase: "break-due" }));
    expect(screen.getByText("Time to move!")).toBeInTheDocument();
  });

  it("displays breaking label in breaking phase", () => {
    renderWithStore(React.createElement(Timer), makeStoreState({ phase: "breaking" }));
    expect(screen.getByText("On a break")).toBeInTheDocument();
  });

  it("shows countdown in working phase", () => {
    const remainingMs = 3_000_000; // 50 minutes
    renderWithStore(
      React.createElement(Timer),
      makeStoreState({ phase: "working", remainingMs })
    );
    const countdown = screen.getByTestId("timer-countdown");
    expect(countdown.textContent).toBe("50:00");
  });

  it("shows — in break-due phase", () => {
    renderWithStore(React.createElement(Timer), makeStoreState({ phase: "break-due" }));
    const countdown = screen.getByTestId("timer-countdown");
    expect(countdown.textContent).toBe("—");
  });

  it("countdown matches remainingMs value from state machine", () => {
    const remainingMs = 90_000; // 1:30
    renderWithStore(
      React.createElement(Timer),
      makeStoreState({ phase: "working", remainingMs })
    );
    const countdown = screen.getByTestId("timer-countdown");
    expect(countdown.textContent).toBe("01:30");
  });
});

// --- Controls component ---

describe("<Controls/>", () => {
  it("shows hint text in working phase (no action buttons)", () => {
    renderWithStore(React.createElement(Controls), makeStoreState({ phase: "working" }));
    expect(screen.queryByTestId("moved-btn")).toBeNull();
    expect(screen.queryByTestId("snooze-btn")).toBeNull();
  });

  it("shows hint in break-due (actions in ReminderBar)", () => {
    renderWithStore(React.createElement(Controls), makeStoreState({ phase: "break-due" }));
    expect(screen.queryByTestId("moved-btn")).toBeNull();
    expect(screen.getByText(/bar below/i)).toBeInTheDocument();
  });

  it("shows only I moved button in breaking phase", () => {
    renderWithStore(React.createElement(Controls), makeStoreState({ phase: "breaking" }));
    expect(screen.getByTestId("moved-btn")).toBeInTheDocument();
    expect(screen.queryByTestId("snooze-btn")).toBeNull();
  });

  it("I moved in breaking dispatches I_MOVED", () => {
    const { dispatch } = renderWithStore(
      React.createElement(Controls),
      makeStoreState({ phase: "breaking" })
    );
    fireEvent.click(screen.getByTestId("moved-btn"));
    expect(dispatch).toHaveBeenCalledWith({
      type: "MACHINE_EVENT",
      event: { type: "I_MOVED" },
    });
  });
});

// --- Preferences component ---

describe("<Preferences/>", () => {
  it("renders preferences panel", () => {
    renderWithStore(React.createElement(Preferences));
    expect(screen.getByTestId("preferences")).toBeInTheDocument();
  });

  it("shows current work interval in minutes", () => {
    const storeState = makeStoreState();
    renderWithStore(React.createElement(Preferences), storeState);
    const input = screen.getByTestId("work-interval-input") as HTMLInputElement;
    expect(input.value).toBe("50");
  });

  it("updating work interval dispatches UPDATE_SETTINGS", () => {
    const { dispatch } = renderWithStore(React.createElement(Preferences));
    const input = screen.getByTestId("work-interval-input");
    fireEvent.change(input, { target: { value: "25" } });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UPDATE_SETTINGS",
        settings: expect.objectContaining({ workIntervalMs: 25 * 60000 }),
      })
    );
  });

  it("updating break duration dispatches UPDATE_SETTINGS", () => {
    const { dispatch } = renderWithStore(React.createElement(Preferences));
    const input = screen.getByTestId("break-duration-input");
    fireEvent.change(input, { target: { value: "10" } });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UPDATE_SETTINGS",
        settings: expect.objectContaining({ breakDurationMs: 10 * 60000 }),
      })
    );
  });

  it("toggling sound dispatches UPDATE_SETTINGS", () => {
    const { dispatch } = renderWithStore(React.createElement(Preferences));
    const toggle = screen.getByTestId("sound-toggle");
    fireEvent.click(toggle);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UPDATE_SETTINGS",
      })
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

// --- ReminderBar component ---

describe("<ReminderBar/>", () => {
  it("hidden in working phase", () => {
    renderWithStore(React.createElement(ReminderBar), makeStoreState({ phase: "working" }));
    expect(screen.queryByTestId("reminder-bar")).toBeNull();
  });

  it("shows floating bar in break-due with actions", () => {
    renderWithStore(React.createElement(ReminderBar), makeStoreState({ phase: "break-due" }));
    expect(screen.getByTestId("reminder-bar")).toBeInTheDocument();
    expect(screen.getByTestId("reminder-start-break")).toBeInTheDocument();
    expect(screen.getByTestId("reminder-moved")).toBeInTheDocument();
    expect(screen.getByTestId("reminder-snooze")).toBeInTheDocument();
  });

  it("start break dispatches START_BREAK", () => {
    const { dispatch } = renderWithStore(
      React.createElement(ReminderBar),
      makeStoreState({ phase: "break-due" })
    );
    fireEvent.click(screen.getByTestId("reminder-start-break"));
    expect(dispatch).toHaveBeenCalledWith({
      type: "MACHINE_EVENT",
      event: { type: "START_BREAK" },
    });
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
