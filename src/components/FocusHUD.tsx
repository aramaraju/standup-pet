/**
 * <FocusHUD/> — Raycast-style floating timer pill with quick actions.
 *
 * Frosted dark card with mono countdown and a mini animated pet. A row of
 * quick-action icon buttons sits on the right: pause/resume, advance to the
 * next phase, log a cup of water, open settings. The whole card is a drag
 * region so the user can park it anywhere on screen.
 */

import type { MouseEvent } from "react";
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
  const { machine, settings, water } = state;
  const phase = machine.phase;
  const isPaused = machine.pausedAt != null;
  const animation = isPaused ? "sleeping" : phaseToAnimation(phase);

  const display = phase === "break-due" ? "--:--" : formatMs(machine.remainingMs);

  // Quick-action handlers. Each stops propagation so the drag region above
  // doesn't swallow the click.
  const stop = (e: MouseEvent) => e.stopPropagation();

  const togglePause = (e: MouseEvent) => {
    stop(e);
    dispatch({
      type: "MACHINE_EVENT",
      event: { type: isPaused ? "RESUME" : "PAUSE", nowMs: Date.now() },
    });
  };

  const onAdvance = (e: MouseEvent) => {
    stop(e);
    // Phase-aware "complete now":
    //  working → jump to break-due via I_MOVED then START_BREAK (skip flow)
    //  break-due → START_BREAK
    //  breaking → I_MOVED (end break early)
    if (phase === "working") {
      dispatch({ type: "MACHINE_EVENT", event: { type: "RESET", nowMs: Date.now() } });
    } else if (phase === "break-due") {
      dispatch({ type: "MACHINE_EVENT", event: { type: "START_BREAK" } });
    } else {
      dispatch({ type: "MACHINE_EVENT", event: { type: "I_MOVED" } });
    }
  };

  const onSnooze = (e: MouseEvent) => {
    stop(e);
    dispatch({ type: "MACHINE_EVENT", event: { type: "SNOOZE" } });
  };

  const onStartBreak = (e: MouseEvent) => {
    stop(e);
    dispatch({ type: "MACHINE_EVENT", event: { type: "START_BREAK" } });
  };

  const onDone = (e: MouseEvent) => {
    stop(e);
    dispatch({ type: "MACHINE_EVENT", event: { type: "I_MOVED" } });
  };

  const onDrink = (e: MouseEvent) => {
    stop(e);
    dispatch({ type: "WATER_EVENT", event: { type: "DRINK", nowMs: Date.now() } });
  };

  const onOpenSettings = (e: MouseEvent) => {
    stop(e);
    void invoke("show_main_window").catch(() => {});
  };

  const advanceLabel =
    phase === "working" ? "Reset focus" : phase === "break-due" ? "Start break" : "End break";
  const advanceIcon = phase === "breaking" ? "⤒" : "⏭";

  return (
    <div
      className={`focus-hud focus-hud--${phase}${isPaused ? " focus-hud--paused" : ""}`}
      data-tauri-drag-region
    >
      <div
        className="focus-hud__sprite"
        data-tauri-drag-region
        data-animation={animation}
        data-pet={settings.petChoice}
      >
        <PixelSprite pet={settings.petChoice} animation={animation} size="sm" />
      </div>

      <div className="focus-hud__center" data-tauri-drag-region>
        <span className="focus-hud__label" data-tauri-drag-region>
          {isPaused ? "Paused" : PHASE_LABEL[phase] ?? phase}
        </span>
        <span className="focus-hud__time" data-tauri-drag-region>
          {display}
        </span>
      </div>

      <div className="focus-hud__actions" onMouseDown={stop}>
        {phase === "break-due" && (
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
              title={`Snooze ${Math.round(settings.snoozeMs / 60000)} min`}
            >
              {Math.round(settings.snoozeMs / 60000)}m
            </button>
          </>
        )}
        {phase === "breaking" && (
          <button
            type="button"
            className="focus-hud__btn focus-hud__btn--primary"
            onClick={onDone}
            title="Done — back to work"
          >
            Done
          </button>
        )}

        <div className="focus-hud__icons" aria-label="Quick actions">
          <button
            type="button"
            className="focus-hud__icon"
            onClick={togglePause}
            title={isPaused ? "Resume" : "Pause"}
            aria-label={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? "▶" : "❚❚"}
          </button>
          <button
            type="button"
            className="focus-hud__icon"
            onClick={onAdvance}
            title={advanceLabel}
            aria-label={advanceLabel}
          >
            {advanceIcon}
          </button>
          <button
            type="button"
            className="focus-hud__icon focus-hud__icon--water"
            onClick={onDrink}
            title={`Log a cup of water (${water.cupsToday}/${settings.water.dailyGoalCups})`}
            aria-label="Log a cup of water"
          >
            <span aria-hidden>💧</span>
            <span className="focus-hud__icon-count">{water.cupsToday}</span>
          </button>
          <button
            type="button"
            className="focus-hud__icon"
            onClick={onOpenSettings}
            title="Open settings"
            aria-label="Open settings"
          >
            ⚙
          </button>
        </div>
      </div>
    </div>
  );
}
