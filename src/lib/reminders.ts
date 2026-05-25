/**
 * Break reminders — Raycast Focus–style: subtle, non-intrusive, actionable.
 * Uses passive system notifications when available; never steals focus.
 */

import type { Phase } from "./timerMachine";
import { getPetDefinition, type PetChoice } from "./pets";

export interface ReminderPayload {
  pet: PetChoice;
  phase: Phase;
}

let lastNotifiedPhase: Phase | null = null;

export function resetReminderState(): void {
  lastNotifiedPhase = null;
}

function buildBreakDueCopy(pet: PetChoice): { title: string; body: string } {
  const { name } = getPetDefinition(pet);
  return {
    title: "Time to stand up",
    body: `${name} is nudging you — take a short movement break.`,
  };
}

/**
 * Shows a passive notification when entering break-due.
 * Returns true if a notification was attempted.
 */
export async function notifyBreakDue(
  payload: ReminderPayload,
  enabled: boolean
): Promise<boolean> {
  if (!enabled || payload.phase !== "break-due") return false;
  if (lastNotifiedPhase === "break-due") return false;

  lastNotifiedPhase = "break-due";
  const { title, body } = buildBreakDueCopy(payload.pet);

  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        tag: "standup-pet-break-due",
        silent: false,
      });
      return true;
    }
  }

  return false;
}

/** Clear dedupe when leaving break-due so the next cycle can notify again. */
export function onPhaseChange(phase: Phase): void {
  if (phase !== "break-due") {
    lastNotifiedPhase = null;
  }
}
