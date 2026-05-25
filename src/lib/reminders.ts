/**
 * Native notification bridge + green-edge flash trigger.
 * Uses macOS Notification Center via tauri-plugin-notification; falls back to
 * the browser Notification API in headless tests.
 */

import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { invoke } from "@tauri-apps/api/core";
import type { Phase } from "./timerMachine";
import { getPetDefinition, type PetChoice } from "./pets";

export interface ReminderPayload {
  pet: PetChoice;
  phase: Phase;
}

let lastNotifiedPhase: Phase | null = null;
let permissionChecked = false;
let permissionGranted = false;

async function ensurePermission(): Promise<boolean> {
  if (permissionChecked) return permissionGranted;
  try {
    permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const result = await requestPermission();
      permissionGranted = result === "granted";
    }
  } catch {
    permissionGranted = false;
  }
  permissionChecked = true;
  return permissionGranted;
}

export function resetReminderState(): void {
  lastNotifiedPhase = null;
  permissionChecked = false;
  permissionGranted = false;
}

async function notify(title: string, body: string): Promise<boolean> {
  try {
    if (await ensurePermission()) {
      await sendNotification({ title, body });
      return true;
    }
  } catch {
    // fall through to browser API (jsdom tests)
  }
  if (typeof window !== "undefined" && "Notification" in window) {
    try {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
      if (Notification.permission === "granted") {
        new Notification(title, { body });
        return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
}

const FLASH_GREEN = "#34c759";
const FLASH_BLUE = "#4a9cf5";

export async function flashBorder(
  color: string = FLASH_GREEN,
  durationMs = 1800
): Promise<void> {
  try {
    await invoke("flash_border", { color, durationMs });
  } catch {
    // Browser/test environment — skip silently.
  }
}

function buildBreakDueCopy(pet: PetChoice): { title: string; body: string } {
  const { name } = getPetDefinition(pet);
  return {
    title: "Time to stand up",
    body: `${name} is nudging you — take a short movement break.`,
  };
}

export async function notifyBreakDue(
  payload: ReminderPayload,
  enabled: boolean
): Promise<boolean> {
  if (!enabled || payload.phase !== "break-due") return false;
  if (lastNotifiedPhase === "break-due") return false;
  lastNotifiedPhase = "break-due";
  const { title, body } = buildBreakDueCopy(payload.pet);
  void flashBorder(FLASH_GREEN);
  return notify(title, body);
}

export async function notifyWater(cupsToday: number, goal: number): Promise<boolean> {
  const remaining = Math.max(0, goal - cupsToday);
  const body =
    remaining > 0
      ? `Sip up. ${cupsToday}/${goal} cups so far — ${remaining} to go.`
      : `Nice — you've hit ${cupsToday}/${goal} cups today.`;
  void flashBorder(FLASH_BLUE);
  return notify("Hydration check", body);
}

export function onPhaseChange(phase: Phase): void {
  if (phase !== "break-due") {
    lastNotifiedPhase = null;
  }
}
