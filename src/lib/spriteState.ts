/**
 * Sprite/animation state mapping for standup-pet.
 * Pure function — maps phase to animation key.
 */

import type { Phase } from "./timerMachine";
import { getPetDefinition, type PetChoice } from "./pets";

export type { PetChoice } from "./pets";
export type AnimationKey = "idle" | "nudge" | "happy" | "sleeping";

/**
 * Maps a phase to the animation key to display.
 */
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

export function getSpriteClass(pet: PetChoice, animation: AnimationKey): string {
  return `sprite--${pet}--${animation}`;
}

export function getSpriteAltText(pet: PetChoice, animation: AnimationKey): string {
  const petName = getPetDefinition(pet).name;
  switch (animation) {
    case "idle":
      return `${petName} sitting quietly`;
    case "nudge":
      return `${petName} nudging you to stand up`;
    case "happy":
      return `${petName} happy you're taking a break`;
    case "sleeping":
      return `${petName} sleeping`;
  }
}

export const PHASE_ANIMATION_MAP: Record<Phase, AnimationKey> = {
  working: "idle",
  "break-due": "nudge",
  breaking: "happy",
};
