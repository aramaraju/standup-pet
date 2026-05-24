/**
 * Settings serialization/deserialization for standup-pet.
 * Pure TypeScript — no native dependencies.
 */

import { DEFAULT_SETTINGS, type MachineSettings } from "./timerMachine";

export interface AppSettings extends MachineSettings {
  soundEnabled: boolean;
  launchAtLogin: boolean;
  petChoice: "cat" | "dog";
  notificationsEnabled: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  ...DEFAULT_SETTINGS,
  soundEnabled: true,
  launchAtLogin: false,
  petChoice: "cat",
  notificationsEnabled: true,
};

/**
 * Validates and sanitizes a single numeric setting value.
 * Returns the default if the value is invalid.
 */
function sanitizeMs(value: unknown, defaultValue: number): number {
  if (typeof value !== "number" || !isFinite(value) || value <= 0) {
    return defaultValue;
  }
  return value;
}

function sanitizeBoolean(value: unknown, defaultValue: boolean): boolean {
  if (typeof value !== "boolean") return defaultValue;
  return value;
}

function sanitizePetChoice(value: unknown): "cat" | "dog" {
  if (value === "cat" || value === "dog") return value;
  return DEFAULT_APP_SETTINGS.petChoice;
}

/**
 * Deserializes settings from a JSON string or plain object.
 * Bad/missing values fall back to defaults — never crashes on corrupt input.
 */
export function deserializeSettings(raw: unknown): AppSettings {
  let obj: Record<string, unknown> = {};

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        obj = parsed as Record<string, unknown>;
      }
    } catch {
      // Corrupt JSON — use all defaults
      return { ...DEFAULT_APP_SETTINGS };
    }
  } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    obj = raw as Record<string, unknown>;
  } else {
    return { ...DEFAULT_APP_SETTINGS };
  }

  return {
    workIntervalMs: sanitizeMs(obj.workIntervalMs, DEFAULT_APP_SETTINGS.workIntervalMs),
    breakDurationMs: sanitizeMs(obj.breakDurationMs, DEFAULT_APP_SETTINGS.breakDurationMs),
    snoozeMs: sanitizeMs(obj.snoozeMs, DEFAULT_APP_SETTINGS.snoozeMs),
    maxSnoozeMs: sanitizeMs(obj.maxSnoozeMs, DEFAULT_APP_SETTINGS.maxSnoozeMs),
    soundEnabled: sanitizeBoolean(obj.soundEnabled, DEFAULT_APP_SETTINGS.soundEnabled),
    launchAtLogin: sanitizeBoolean(obj.launchAtLogin, DEFAULT_APP_SETTINGS.launchAtLogin),
    petChoice: sanitizePetChoice(obj.petChoice),
    notificationsEnabled: sanitizeBoolean(
      obj.notificationsEnabled,
      DEFAULT_APP_SETTINGS.notificationsEnabled
    ),
  };
}

/**
 * Serializes settings to a JSON string.
 */
export function serializeSettings(settings: AppSettings): string {
  return JSON.stringify(settings, null, 2);
}

/**
 * Round-trip: serialize then deserialize. Used in tests to confirm fidelity.
 */
export function roundTripSettings(settings: AppSettings): AppSettings {
  return deserializeSettings(serializeSettings(settings));
}
