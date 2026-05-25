/**
 * Renders a 16×16 pixel-art sprite scaled up with crisp edges.
 *
 * Multi-frame animations are cycled by swapping the entire frame at a fixed
 * cadence — no CSS tweening, mirroring the Claude Code mascot ("Clawd")
 * style where each frame is a complete redraw.
 */

import type React from "react";
import { useEffect, useState } from "react";
import type { PetChoice } from "../lib/pets";
import type { AnimationKey } from "../lib/spriteState";
import { getPetDefinition } from "../lib/pets";
import {
  getFrameCount,
  getSpriteFrame,
  SPRITE_SIZE,
} from "../lib/pixelSprites";

interface PixelSpriteProps {
  pet: PetChoice;
  animation: AnimationKey;
  size?: "sm" | "lg";
  /** Per-frame dwell time. ~180 ms reads as lively without being twitchy. */
  frameMs?: number;
}

const SIZE_PX = { sm: 48, lg: 128 } as const;
const PIXEL_PX = { sm: 3, lg: 8 } as const;

export function PixelSprite({
  pet,
  animation,
  size = "lg",
  frameMs = 200,
}: PixelSpriteProps) {
  const { accent, name } = getPetDefinition(pet);
  const frameCount = getFrameCount(pet, animation);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (frameCount <= 1) return;
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
    }, frameMs);
    return () => window.clearInterval(id);
  }, [frameCount, frameMs]);

  const { palette, rows } = getSpriteFrame(pet, animation, tick % frameCount);
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
