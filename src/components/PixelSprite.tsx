/**
 * CSS pixel-art style sprite — emoji in a crisp pixel frame with optional bounce.
 */

import type React from "react";
import type { PetChoice } from "../lib/pets";
import type { AnimationKey } from "../lib/spriteState";
import { getPetDefinition } from "../lib/pets";

interface PixelSpriteProps {
  pet: PetChoice;
  animation: AnimationKey;
  size?: "sm" | "lg";
}

export function PixelSprite({ pet, animation, size = "lg" }: PixelSpriteProps) {
  const { accent, name } = getPetDefinition(pet);
  const glyph = getPetGlyph(pet, animation);

  return (
    <div
      className={`pixel-sprite pixel-sprite--${size} pixel-sprite--${animation}`}
      style={{ "--pet-accent": accent } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="pixel-sprite__frame">
        <span className="pixel-sprite__glyph">{glyph}</span>
      </div>
      {size === "lg" && (
        <span className="pixel-sprite__name">{name}</span>
      )}
    </div>
  );
}

function getPetGlyph(pet: PetChoice, animation: AnimationKey): string {
  const table: Record<PetChoice, Record<AnimationKey, string>> = {
    cat: { idle: "🐱", nudge: "😾", happy: "😺", sleeping: "😴" },
    dog: { idle: "🐶", nudge: "🐕", happy: "🐩", sleeping: "😴" },
    frog: { idle: "🐸", nudge: "🐸", happy: "🐸", sleeping: "😴" },
    turtle: { idle: "🐢", nudge: "🐢", happy: "🐢", sleeping: "😴" },
    pig: { idle: "🐷", nudge: "🐷", happy: "🐷", sleeping: "😴" },
    duck: { idle: "🦆", nudge: "🦆", happy: "🦆", sleeping: "😴" },
    wolf: { idle: "🐺", nudge: "🐺", happy: "🐺", sleeping: "😴" },
    bear: { idle: "🐻", nudge: "🐻", happy: "🐻", sleeping: "😴" },
  };
  return table[pet][animation];
}
