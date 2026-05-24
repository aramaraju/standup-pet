/**
 * <Preferences/> component — settings UI.
 */

import { useStore } from "../lib/store";
import type { AppSettings } from "../lib/settings";

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
      <h2 className="preferences__title">Preferences</h2>

      <label className="preferences__field">
        <span>Work interval (minutes)</span>
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
        <span>Break duration (minutes)</span>
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

      <label className="preferences__field">
        <span>Sound</span>
        <input
          type="checkbox"
          checked={settings.soundEnabled}
          data-testid="sound-toggle"
          onChange={(e) => update({ soundEnabled: e.target.checked })}
        />
      </label>

      <label className="preferences__field">
        <span>Notifications</span>
        <input
          type="checkbox"
          checked={settings.notificationsEnabled}
          data-testid="notifications-toggle"
          onChange={(e) => update({ notificationsEnabled: e.target.checked })}
        />
      </label>

      <label className="preferences__field">
        <span>Launch at login</span>
        <input
          type="checkbox"
          checked={settings.launchAtLogin}
          data-testid="launch-at-login-toggle"
          onChange={(e) => update({ launchAtLogin: e.target.checked })}
        />
      </label>

      <label className="preferences__field">
        <span>Pet</span>
        <select
          value={settings.petChoice}
          data-testid="pet-select"
          onChange={(e) => update({ petChoice: e.target.value as "cat" | "dog" })}
        >
          <option value="cat">Cat</option>
          <option value="dog">Dog</option>
        </select>
      </label>
    </div>
  );
}
