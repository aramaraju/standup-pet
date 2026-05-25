/**
 * Renders a 16×16 pixel-art sprite scaled up with crisp edges.
 */

import type React from "react";
import type { PetChoice } from "../lib/pets";
import type { AnimationKey } from "../lib/spriteState";
import { getPetDefinition } from "../lib/pets";
import { getSpriteFrame, SPRITE_SIZE } from "../lib/pixelSprites";

interface PixelSpriteProps {
  pet: PetChoice;
  animation: AnimationKey;
  size?: "sm" | "lg";
}

const SIZE_PX = { sm: 48, lg: 128 } as const;
const PIXEL_PX = { sm: 3, lg: 8 } as const;

export function PixelSprite({ pet, animation, size = "lg" }: PixelSpriteProps) {
  const { accent, name } = getPetDefinition(pet);
  const { palette, rows } = getSpriteFrame(pet, animation);
  const box = SIZE_PX[size];
  const pixel = PIXEL_PX[size];

  return (
    <div
      className={`pixel-sprite pixel-sprite--${size} pixel-sprite--${animation}`}
      style={{ "--pet-accent": accent } as React.CSSProperties}
      aria-hidden="true"
    >
      <div
        className="pixel-sprite__frame"
        style={{ width: box, height: box }}
      >
        <div
          className="pixel-sprite__grid"
          style={{
            width: SPRITE_SIZE * pixel,
            height: SPRITE_SIZE * pixel,
            gridTemplateColumns: `repeat(${SPRITE_SIZE}, ${pixel}px)`,
            gridTemplateRows: `repeat(${SPRITE_SIZE}, ${pixel}px)`,
          }}
        >
          {rows.flatMap((row, y) =>
            [...row].map((ch, x) => {
              const color = palette[ch] ?? "transparent";
              return (
                <span
                  key={`${y}-${x}`}
                  className="pixel-sprite__pixel"
                  style={{ backgroundColor: color }}
                />
              );
            })
          )}
        </div>
      </div>
      {size === "lg" && (
        <span className="pixel-sprite__name">{name}</span>
      )}
    </div>
  );
}
