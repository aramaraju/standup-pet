/**
 * Sprite/animation state mapping for standup-pet.
 * Pure function — maps phase to animation key.
 */

import type { Phase } from "./timerMachine";

export type AnimationKey = "idle" | "nudge" | "happy" | "sleeping";

export type PetChoice = "cat" | "dog";

/**
 * Maps a phase to the animation key to display.
 *
 * working   → "idle"      (pet quietly working alongside you)
 * break-due → "nudge"     (pet actively nudging you to move)
 * breaking  → "happy"     (pet happy you're taking a break)
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

/**
 * Returns the CSS class / asset path fragment for a given pet + animation.
 */
export function getSpriteClass(pet: PetChoice, animation: AnimationKey): string {
  return `sprite--${pet}--${animation}`;
}

/**
 * Returns the alt text for accessibility.
 */
export function getSpriteAltText(pet: PetChoice, animation: AnimationKey): string {
  const petName = pet === "cat" ? "Cat" : "Dog";
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

/**
 * All valid phase → animation mappings as a lookup table.
 * Used for exhaustive test assertions.
 */
export const PHASE_ANIMATION_MAP: Record<Phase, AnimationKey> = {
  working: "idle",
  "break-due": "nudge",
  breaking: "happy",
};
