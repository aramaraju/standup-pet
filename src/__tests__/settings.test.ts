/**
 * Unit tests for settings serialization/deserialization.
 */

import { describe, it, expect } from "vitest";
import {
  deserializeSettings,
  serializeSettings,
  roundTripSettings,
  DEFAULT_APP_SETTINGS,
} from "../lib/settings";

describe("deserializeSettings", () => {
  it("returns defaults when given null/undefined", () => {
    expect(deserializeSettings(null)).toEqual(DEFAULT_APP_SETTINGS);
    expect(deserializeSettings(undefined)).toEqual(DEFAULT_APP_SETTINGS);
  });

  it("returns defaults for empty object", () => {
    expect(deserializeSettings({})).toEqual(DEFAULT_APP_SETTINGS);
  });

  it("returns defaults for corrupt JSON string", () => {
    expect(deserializeSettings("{not valid json{{")).toEqual(DEFAULT_APP_SETTINGS);
  });

  it("returns defaults for array (wrong type)", () => {
    expect(deserializeSettings([1, 2, 3])).toEqual(DEFAULT_APP_SETTINGS);
  });

  it("returns defaults for primitive", () => {
    expect(deserializeSettings(42)).toEqual(DEFAULT_APP_SETTINGS);
    expect(deserializeSettings("hello")).toEqual(DEFAULT_APP_SETTINGS);
  });

  it("parses valid JSON string correctly", () => {
    const custom = { workIntervalMs: 30_000, breakDurationMs: 2_000 };
    const json = JSON.stringify(custom);
    const result = deserializeSettings(json);
    expect(result.workIntervalMs).toBe(30_000);
    expect(result.breakDurationMs).toBe(2_000);
    // Other fields fall back to defaults
    expect(result.soundEnabled).toBe(DEFAULT_APP_SETTINGS.soundEnabled);
  });

  it("sanitizes negative workIntervalMs to default", () => {
    const result = deserializeSettings({ workIntervalMs: -1000 });
    expect(result.workIntervalMs).toBe(DEFAULT_APP_SETTINGS.workIntervalMs);
  });

  it("sanitizes zero to default", () => {
    const result = deserializeSettings({ workIntervalMs: 0 });
    expect(result.workIntervalMs).toBe(DEFAULT_APP_SETTINGS.workIntervalMs);
  });

  it("sanitizes Infinity to default", () => {
    const result = deserializeSettings({ breakDurationMs: Infinity });
    expect(result.breakDurationMs).toBe(DEFAULT_APP_SETTINGS.breakDurationMs);
  });

  it("sanitizes NaN to default", () => {
    const result = deserializeSettings({ snoozeMs: NaN });
    expect(result.snoozeMs).toBe(DEFAULT_APP_SETTINGS.snoozeMs);
  });

  it("sanitizes string-typed number to default", () => {
    const result = deserializeSettings({ workIntervalMs: "3000" });
    expect(result.workIntervalMs).toBe(DEFAULT_APP_SETTINGS.workIntervalMs);
  });

  it("sanitizes invalid petChoice to default", () => {
    const result = deserializeSettings({ petChoice: "hamster" });
    expect(result.petChoice).toBe(DEFAULT_APP_SETTINGS.petChoice);
  });

  it("accepts valid petChoice 'dog'", () => {
    const result = deserializeSettings({ petChoice: "dog" });
    expect(result.petChoice).toBe("dog");
  });

  it("sanitizes non-boolean soundEnabled to default", () => {
    const result = deserializeSettings({ soundEnabled: "yes" });
    expect(result.soundEnabled).toBe(DEFAULT_APP_SETTINGS.soundEnabled);
  });

  it("accepts false for boolean fields", () => {
    const result = deserializeSettings({ soundEnabled: false, launchAtLogin: false });
    expect(result.soundEnabled).toBe(false);
    expect(result.launchAtLogin).toBe(false);
  });
});

describe("serializeSettings", () => {
  it("serializes to valid JSON", () => {
    const json = serializeSettings(DEFAULT_APP_SETTINGS);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("includes all required fields", () => {
    const json = serializeSettings(DEFAULT_APP_SETTINGS);
    const obj = JSON.parse(json);
    expect(obj).toHaveProperty("workIntervalMs");
    expect(obj).toHaveProperty("breakDurationMs");
    expect(obj).toHaveProperty("soundEnabled");
    expect(obj).toHaveProperty("petChoice");
  });
});

describe("roundTripSettings", () => {
  it("round-trips default settings unchanged", () => {
    const result = roundTripSettings(DEFAULT_APP_SETTINGS);
    expect(result).toEqual(DEFAULT_APP_SETTINGS);
  });

  it("round-trips custom settings unchanged", () => {
    const custom = {
      ...DEFAULT_APP_SETTINGS,
      workIntervalMs: 25 * 60 * 1000,
      petChoice: "dog" as const,
      soundEnabled: false,
    };
    const result = roundTripSettings(custom);
    expect(result).toEqual(custom);
  });
});
