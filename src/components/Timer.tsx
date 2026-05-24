/**
 * <Timer/> component — displays phase name and countdown.
 */

import { useStore } from "../lib/store";
import type { Phase } from "../lib/timerMachine";

function formatMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function phaseLabel(phase: Phase): string {
  switch (phase) {
    case "working":   return "Working";
    case "break-due": return "Time to move!";
    case "breaking":  return "On a break";
  }
}

export function Timer() {
  const { state } = useStore();
  const { phase, remainingMs } = state.machine;

  return (
    <div className="timer" data-phase={phase}>
      <div className="timer__label">{phaseLabel(phase)}</div>
      <div className="timer__countdown" data-testid="timer-countdown">
        {phase === "break-due" ? "—" : formatMs(remainingMs)}
      </div>
    </div>
  );
}

export { formatMs };
