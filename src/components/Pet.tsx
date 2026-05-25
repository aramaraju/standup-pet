/**
 * <Pet/> — pixel companion for the current phase.
 */

import { useStore } from "../lib/store";
import { phaseToAnimation, getSpriteClass, getSpriteAltText } from "../lib/spriteState";
import type { Phase } from "../lib/timerMachine";
import { PixelSprite } from "./PixelSprite";

interface PetProps {
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
      data-pet={pet}
    >
      <PixelSprite pet={pet} animation={animation} size="lg" />
    </div>
  );
}
