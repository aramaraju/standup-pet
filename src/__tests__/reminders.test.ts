/**
 * Reminder notification tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { notifyBreakDue, onPhaseChange, resetReminderState } from "../lib/reminders";

describe("notifyBreakDue", () => {
  beforeEach(() => {
    resetReminderState();
    onPhaseChange("working");
  });

  it("returns false when notifications disabled", async () => {
    const result = await notifyBreakDue({ pet: "cat", phase: "break-due" }, false);
    expect(result).toBe(false);
  });

  it("returns false when not in break-due phase", async () => {
    const result = await notifyBreakDue({ pet: "cat", phase: "working" }, true);
    expect(result).toBe(false);
  });

  it("dedupes repeated break-due notifications", async () => {
    const mockNotification = vi.fn();
    vi.stubGlobal("Notification", mockNotification);
    Object.defineProperty(mockNotification, "permission", { value: "granted" });

    await notifyBreakDue({ pet: "dog", phase: "break-due" }, true);
    await notifyBreakDue({ pet: "dog", phase: "break-due" }, true);

    expect(mockNotification).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("allows notify again after leaving break-due", async () => {
    const mockNotification = vi.fn();
    vi.stubGlobal("Notification", mockNotification);
    Object.defineProperty(mockNotification, "permission", { value: "granted" });

    await notifyBreakDue({ pet: "frog", phase: "break-due" }, true);
    onPhaseChange("working");
    await notifyBreakDue({ pet: "frog", phase: "break-due" }, true);

    expect(mockNotification).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
});
