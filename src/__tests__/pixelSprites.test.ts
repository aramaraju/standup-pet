import { describe, it, expect } from "vitest";
import { SPRITE_SIZE, getSpriteFrame, spriteToRgba } from "../lib/pixelSprites";
import { PET_IDS } from "../lib/pets";
import type { AnimationKey } from "../lib/spriteState";

const ANIMS: AnimationKey[] = ["idle", "nudge", "happy", "sleeping"];

describe("pixelSprites", () => {
  for (const pet of PET_IDS) {
    it(`${pet} frames normalize to ${SPRITE_SIZE}×${SPRITE_SIZE}`, () => {
      for (const anim of ANIMS) {
        const { rows } = getSpriteFrame(pet, anim);
        expect(rows).toHaveLength(SPRITE_SIZE);
        for (const row of rows) {
          expect(row).toHaveLength(SPRITE_SIZE);
        }
      }
    });
  }

  it("spriteToRgba produces opaque pixels for cat idle", () => {
    const { width, height, data } = spriteToRgba("cat", "idle", 2);
    expect(width).toBe(32);
    expect(height).toBe(32);
    let opaque = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) opaque++;
    }
    expect(opaque).toBeGreaterThan(20);
  });

  it("getSpriteFrame falls back to idle", () => {
    const { rows } = getSpriteFrame("dog", "sleeping");
    expect(rows).toHaveLength(16);
  });
});
