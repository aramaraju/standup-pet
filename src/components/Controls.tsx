/**
 * <Controls/> component — "I moved" and snooze buttons.
 */

import { useStore } from "../lib/store";

export function Controls() {
  const { state, dispatch } = useStore();
  const { phase } = state.machine;

  const handleMoved = () => {
    dispatch({ type: "MACHINE_EVENT", event: { type: "I_MOVED" } });
  };

  const handleSnooze = () => {
    dispatch({ type: "MACHINE_EVENT", event: { type: "SNOOZE" } });
  };

  const handleStartBreak = () => {
    dispatch({ type: "MACHINE_EVENT", event: { type: "START_BREAK" } });
  };

  if (phase === "working") {
    return (
      <div className="controls controls--working">
        <p className="controls__hint">Keep it up! Your pet is waiting.</p>
      </div>
    );
  }

  if (phase === "break-due") {
    return (
      <div className="controls controls--break-due">
        <button
          className="controls__btn controls__btn--primary"
          onClick={handleStartBreak}
          data-testid="start-break-btn"
        >
          Start break
        </button>
        <button
          className="controls__btn controls__btn--moved"
          onClick={handleMoved}
          data-testid="moved-btn"
        >
          I moved
        </button>
        <button
          className="controls__btn controls__btn--snooze"
          onClick={handleSnooze}
          data-testid="snooze-btn"
        >
          Snooze 5 min
        </button>
      </div>
    );
  }

  // breaking
  return (
    <div className="controls controls--breaking">
      <button
        className="controls__btn controls__btn--moved"
        onClick={handleMoved}
        data-testid="moved-btn"
      >
        I moved — back to work
      </button>
    </div>
  );
}
