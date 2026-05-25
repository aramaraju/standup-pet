/**
 * <WaterPanel/> — daily cup counter + reminder config, shown in the main
 * settings window.
 */

import { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import type { WaterSettings } from "../lib/water";

export function WaterPanel() {
  const { state, dispatch } = useStore();
  const { water, settings } = state;
  const cfg = settings.water;

  const update = (partial: Partial<WaterSettings>) => {
    dispatch({
      type: "UPDATE_SETTINGS",
      settings: { water: { ...cfg, ...partial } },
    });
  };

  const onDrink = () => {
    dispatch({ type: "WATER_EVENT", event: { type: "DRINK", nowMs: Date.now() } });
  };

  const onSnooze = () => {
    dispatch({ type: "WATER_EVENT", event: { type: "SNOOZE", nowMs: Date.now() } });
  };

  const cups = Math.min(water.cupsToday, cfg.dailyGoalCups);
  const remaining = Math.max(0, cfg.dailyGoalCups - water.cupsToday);
  const pct = Math.round((cups / Math.max(1, cfg.dailyGoalCups)) * 100);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const nextIn = Math.max(0, water.nextReminderAt - now);
  const nextLabel = formatNextIn(nextIn);

  return (
    <section className="water-panel" data-testid="water-panel">
      <header className="water-panel__head">
        <h3 className="water-panel__title">Hydration</h3>
        <span className="water-panel__count">
          {water.cupsToday} / {cfg.dailyGoalCups} cups
        </span>
      </header>

      <div className="water-panel__bar" aria-hidden>
        <div className="water-panel__bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="water-panel__cups" role="list">
        {Array.from({ length: cfg.dailyGoalCups }).map((_, i) => (
          <span
            key={i}
            role="listitem"
            className={
              "water-panel__cup " +
              (i < water.cupsToday ? "water-panel__cup--filled" : "")
            }
            aria-label={i < water.cupsToday ? "cup drunk" : "cup pending"}
          >
            {i < water.cupsToday ? "●" : "○"}
          </span>
        ))}
      </div>

      <p className="water-panel__hint">
        {remaining > 0
          ? `${remaining} cup${remaining === 1 ? "" : "s"} left today · next nudge in ${nextLabel}`
          : `Goal reached. Next nudge in ${nextLabel}.`}
      </p>

      <div className="water-panel__actions">
        <button
          type="button"
          className="controls__btn controls__btn--primary"
          onClick={onDrink}
          data-testid="water-drink"
        >
          + Cup
        </button>
        <button
          type="button"
          className="controls__btn"
          onClick={onSnooze}
          data-testid="water-snooze"
        >
          Snooze {cfg.snoozeMin}m
        </button>
      </div>

      <div className="water-panel__config">
        <label className="preferences__field preferences__field--toggle">
          <span>Water reminders</span>
          <input
            type="checkbox"
            checked={cfg.enabled}
            data-testid="water-enabled"
            onChange={(e) => update({ enabled: e.target.checked })}
          />
        </label>

        <label className="preferences__field">
          <span>Interval (min)</span>
          <input
            type="number"
            min={5}
            max={240}
            value={cfg.intervalMin}
            data-testid="water-interval"
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (Number.isFinite(n)) update({ intervalMin: n });
            }}
          />
        </label>

        <label className="preferences__field">
          <span>Daily goal (cups)</span>
          <input
            type="number"
            min={1}
            max={30}
            value={cfg.dailyGoalCups}
            data-testid="water-goal"
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (Number.isFinite(n)) update({ dailyGoalCups: n });
            }}
          />
        </label>

        <label className="preferences__field">
          <span>Active hours</span>
          <span className="water-panel__hours">
            <input
              type="number"
              min={0}
              max={23}
              value={cfg.startHour}
              data-testid="water-start-hour"
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (Number.isFinite(n)) update({ startHour: n });
              }}
            />
            <span aria-hidden>–</span>
            <input
              type="number"
              min={1}
              max={24}
              value={cfg.endHour}
              data-testid="water-end-hour"
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (Number.isFinite(n)) update({ endHour: n });
              }}
            />
          </span>
        </label>

        <label className="preferences__field">
          <span>Snooze (min)</span>
          <input
            type="number"
            min={1}
            max={120}
            value={cfg.snoozeMin}
            data-testid="water-snooze-min"
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (Number.isFinite(n)) update({ snoozeMin: n });
            }}
          />
        </label>
      </div>
    </section>
  );
}

function formatNextIn(ms: number): string {
  if (ms <= 0) return "now";
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
