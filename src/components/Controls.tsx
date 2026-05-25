/**
 * <Controls/> — phase hints; break-due actions live in ReminderBar (Raycast Focus style).
 */

import { useStore } from "../lib/store";

export function Controls() {
  const { state, dispatch } = useStore();
  const { phase } = state.machine;

  const handleMoved = () => {
    dispatch({ type: "MACHINE_EVENT", event: { type: "I_MOVED" } });
  };

  if (phase === "working") {
    return (
      <div className="controls controls--working">
        <p className="controls__hint">Your companion is keeping you company.</p>
      </div>
    );
  }

  if (phase === "break-due") {
    return (
      <div className="controls controls--break-due">
        <p className="controls__hint">Use the bar below when you&apos;re ready.</p>
      </div>
    );
  }

  return (
    <div className="controls controls--breaking">
      <button
        className="controls__btn controls__btn--primary"
        onClick={handleMoved}
        data-testid="moved-btn"
      >
        Back to work
      </button>
    </div>
  );
}
