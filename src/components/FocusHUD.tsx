/**
 * <FocusHUD/> — Raycast-style floating timer pill.
 *
 * Frosted dark card with mono countdown, mini pet sprite, and hover-revealed
 * controls. Drag-region covers the whole card so the user can slide it
 * anywhere on screen.
 */

import { useStore } from "../lib/store";
import { phaseToAnimation } from "../lib/spriteState";
import { formatMs } from "../lib/time";
import { PixelSprite } from "./PixelSprite";
import { invoke } from "@tauri-apps/api/core";

const PHASE_LABEL: Record<string, string> = {
  working: "Focus",
  "break-due": "Stand up!",
  breaking: "Break",
};

export function FocusHUD() {
  const { state, dispatch } = useStore();
  const { machine, settings } = state;
  const phase = machine.phase;
  const animation = phaseToAnimation(phase);
  const display = phase === "break-due" ? "--:--" : formatMs(machine.remainingMs);

  const onOpenSettings = () => {
    void invoke("show_main_window").catch(() => {});
  };

  const onSnooze = () => {
    dispatch({ type: "MACHINE_EVENT", event: { type: "SNOOZE" } });
  };

  const onMoved = () => {
    dispatch({ type: "MACHINE_EVENT", event: { type: "I_MOVED" } });
  };

  const onStartBreak = () => {
    dispatch({ type: "MACHINE_EVENT", event: { type: "START_BREAK" } });
  };

  return (
    <div className={`focus-hud focus-hud--${phase}`} data-tauri-drag-region>
      <div className="focus-hud__sprite" data-tauri-drag-region>
        <PixelSprite pet={settings.petChoice} animation={animation} size="sm" />
      </div>
      <div className="focus-hud__center" data-tauri-drag-region>
        <span className="focus-hud__label" data-tauri-drag-region>
          {PHASE_LABEL[phase] ?? phase}
        </span>
        <span className="focus-hud__time" data-tauri-drag-region>
          {display}
        </span>
      </div>
      <div className="focus-hud__actions">
        {phase === "break-due" ? (
          <>
            <button
              type="button"
              className="focus-hud__btn focus-hud__btn--primary"
              onClick={onStartBreak}
              title="Start break"
            >
              Break
            </button>
            <button
              type="button"
              className="focus-hud__btn"
              onClick={onSnooze}
              title="Snooze 5 min"
            >
              5m
            </button>
          </>
        ) : phase === "breaking" ? (
          <button
            type="button"
            className="focus-hud__btn focus-hud__btn--primary"
            onClick={onMoved}
            title="Done — back to work"
          >
            Done
          </button>
        ) : (
          <button
            type="button"
            className="focus-hud__btn focus-hud__btn--ghost"
            onClick={onOpenSettings}
            title="Open settings"
            aria-label="Open settings"
          >
            ⚙
          </button>
        )}
      </div>
    </div>
  );
}
