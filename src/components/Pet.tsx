/**
 * <Pet/> component — renders the pixel-art sprite for the current phase.
 */

import { useStore } from "../lib/store";
import { phaseToAnimation, getSpriteClass, getSpriteAltText } from "../lib/spriteState";
import type { Phase } from "../lib/timerMachine";

interface PetProps {
  /** Override phase for testing / Storybook */
  phaseOverride?: Phase;
}

export function Pet({ phaseOverride }: PetProps) {
  const { state } = useStore();
  const phase = phaseOverride ?? state.machine.phase;
  const pet = state.settings.petChoice;
  const animation = phaseToAnimation(phase);
  const spriteClass = getSpriteClass(pet, animation);
  const altText = getSpriteAltText(pet, animation);

  return (
    <div
      className={`pet ${spriteClass}`}
      role="img"
      aria-label={altText}
      data-phase={phase}
      data-animation={animation}
    >
      {/* Pixel art rendered via CSS background-image on the className */}
      <span className="pet__emoji" aria-hidden="true">
        {getPetEmoji(pet, animation)}
      </span>
    </div>
  );
}

function getPetEmoji(pet: "cat" | "dog", animation: "idle" | "nudge" | "happy" | "sleeping"): string {
  if (pet === "cat") {
    switch (animation) {
      case "idle":    return "🐱";
      case "nudge":   return "😾";
      case "happy":   return "😺";
      case "sleeping": return "😴";
    }
  } else {
    switch (animation) {
      case "idle":    return "🐶";
      case "nudge":   return "🐕";
      case "happy":   return "🐩";
      case "sleeping": return "😴";
    }
  }
}
