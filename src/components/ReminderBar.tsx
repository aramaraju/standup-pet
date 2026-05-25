/**
 * Raycast Focus–style floating reminder bar.
 * Subtle bottom pill when break is due — quick actions without stealing focus.
 */

import { useStore } from "../lib/store";
import { getPetDefinition } from "../lib/pets";
import { PixelSprite } from "./PixelSprite";
import { phaseToAnimation } from "../lib/spriteState";

export function ReminderBar() {
  const { state, dispatch } = useStore();
  const { phase } = state.machine;
  const pet = state.settings.petChoice;

  if (phase !== "break-due") return null;

  const { name } = getPetDefinition(pet);
  const animation = phaseToAnimation(phase);

  const handleMoved = () => {
    dispatch({ type: "MACHINE_EVENT", event: { type: "I_MOVED" } });
  };

  const handleSnooze = () => {
    dispatch({ type: "MACHINE_EVENT", event: { type: "SNOOZE" } });
  };

  const handleStartBreak = () => {
    dispatch({ type: "MACHINE_EVENT", event: { type: "START_BREAK" } });
  };

  return (
    <div
      className="reminder-bar"
      role="status"
      aria-live="polite"
      data-testid="reminder-bar"
    >
      <div className="reminder-bar__inner">
        <div className="reminder-bar__icon">
          <PixelSprite pet={pet} animation={animation} size="sm" />
        </div>
        <div className="reminder-bar__copy">
          <span className="reminder-bar__title">Time to move</span>
          <span className="reminder-bar__subtitle">{name} is nudging you</span>
        </div>
        <div className="reminder-bar__actions">
          <button
            type="button"
            className="reminder-bar__btn reminder-bar__btn--primary"
            data-testid="reminder-start-break"
            onClick={handleStartBreak}
          >
            Break
          </button>
          <button
            type="button"
            className="reminder-bar__btn"
            data-testid="reminder-moved"
            onClick={handleMoved}
          >
            Moved
          </button>
          <button
            type="button"
            className="reminder-bar__btn reminder-bar__btn--ghost"
            data-testid="reminder-snooze"
            onClick={handleSnooze}
          >
            Snooze
          </button>
        </div>
      </div>
    </div>
  );
}
