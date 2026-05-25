/**
 * <Preferences/> — settings with Pixel Pets–style pet picker.
 */

import { useStore } from "../lib/store";
import type { AppSettings } from "../lib/settings";
import { PetPicker } from "./PetPicker";

export function Preferences() {
  const { state, dispatch } = useStore();
  const { settings } = state;

  const update = (partial: Partial<AppSettings>) => {
    dispatch({ type: "UPDATE_SETTINGS", settings: partial });
  };

  const workMinutes = Math.round(settings.workIntervalMs / 60000);
  const breakMinutes = Math.round(settings.breakDurationMs / 60000);

  return (
    <div className="preferences" data-testid="preferences">
      <h2 className="preferences__title">Settings</h2>

      <PetPicker
        value={settings.petChoice}
        onChange={(petChoice) => update({ petChoice })}
      />

      <div className="preferences__section">
        <h3 className="preferences__section-title">Intervals</h3>

        <label className="preferences__field">
          <span>Work (min)</span>
          <input
            type="number"
            min={1}
            max={120}
            value={workMinutes}
            data-testid="work-interval-input"
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val > 0) {
                update({ workIntervalMs: val * 60000 });
              }
            }}
          />
        </label>

        <label className="preferences__field">
          <span>Break (min)</span>
          <input
            type="number"
            min={1}
            max={60}
            value={breakMinutes}
            data-testid="break-duration-input"
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val > 0) {
                update({ breakDurationMs: val * 60000 });
              }
            }}
          />
        </label>
      </div>

      <div className="preferences__section">
        <h3 className="preferences__section-title">Reminders</h3>
        <p className="preferences__hint">
          Gentle nudges like Raycast Focus — in-app bar plus optional system alerts that won&apos;t steal focus.
        </p>

        <label className="preferences__field preferences__field--toggle">
          <span>System notifications</span>
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            data-testid="notifications-toggle"
            onChange={(e) => update({ notificationsEnabled: e.target.checked })}
          />
        </label>

        <label className="preferences__field preferences__field--toggle">
          <span>Sound</span>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            data-testid="sound-toggle"
            onChange={(e) => update({ soundEnabled: e.target.checked })}
          />
        </label>
      </div>

      <label className="preferences__field preferences__field--toggle">
        <span>Launch at login</span>
        <input
          type="checkbox"
          checked={settings.launchAtLogin}
          data-testid="launch-at-login-toggle"
          onChange={(e) => update({ launchAtLogin: e.target.checked })}
        />
      </label>
    </div>
  );
}
