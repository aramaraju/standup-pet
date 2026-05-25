/**
 * Sprite/animation state mapping for standup-pet.
 * Pure function — maps phase to animation key.
 */

import type { Phase } from "./timerMachine";

export type { PetChoice } from "./pets";
export type AnimationKey = "idle" | "nudge" | "happy" | "sleeping";

export function phaseToAnimation(phase: Phase): AnimationKey {
  switch (phase) {
    case "working":
      return "idle";
    case "break-due":
      return "nudge";
    case "breaking":
      return "happy";
  }
}

export const PHASE_ANIMATION_MAP: Record<Phase, AnimationKey> = {
  working: "idle",
  "break-due": "nudge",
  breaking: "happy",
};
