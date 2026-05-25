/**
 * Unit tests for sprite state mapping.
 */

import { describe, it, expect } from "vitest";
import {
  phaseToAnimation,
  getSpriteClass,
  getSpriteAltText,
  PHASE_ANIMATION_MAP,
} from "../lib/spriteState";
import type { Phase } from "../lib/timerMachine";

describe("phaseToAnimation", () => {
  it("working → idle", () => {
    expect(phaseToAnimation("working")).toBe("idle");
  });

  it("break-due → nudge", () => {
    expect(phaseToAnimation("break-due")).toBe("nudge");
  });

  it("breaking → happy", () => {
    expect(phaseToAnimation("breaking")).toBe("happy");
  });

  it("matches PHASE_ANIMATION_MAP exhaustively", () => {
    const phases: Phase[] = ["working", "break-due", "breaking"];
    for (const phase of phases) {
      expect(phaseToAnimation(phase)).toBe(PHASE_ANIMATION_MAP[phase]);
    }
  });
});

describe("getSpriteClass", () => {
  it("returns correct class for cat idle", () => {
    expect(getSpriteClass("cat", "idle")).toBe("sprite--cat--idle");
  });

  it("returns correct class for dog nudge", () => {
    expect(getSpriteClass("dog", "nudge")).toBe("sprite--dog--nudge");
  });

  it("returns correct class for frog idle", () => {
    expect(getSpriteClass("frog", "idle")).toBe("sprite--frog--idle");
  });

  it("returns correct class for cat happy", () => {
    expect(getSpriteClass("cat", "happy")).toBe("sprite--cat--happy");
  });
});

describe("getSpriteAltText", () => {
  it("cat idle has descriptive alt text", () => {
    const alt = getSpriteAltText("cat", "idle");
    expect(alt).toContain("Willow");
  });

  it("dog nudge has descriptive alt text", () => {
    const alt = getSpriteAltText("dog", "nudge");
    expect(alt).toContain("Spot");
    expect(alt.toLowerCase()).toContain("nudg");
  });

  it("cat happy has descriptive alt text", () => {
    const alt = getSpriteAltText("cat", "happy");
    expect(alt).toContain("Willow");
    expect(alt.toLowerCase()).toContain("break");
  });
});

describe("PHASE_ANIMATION_MAP completeness", () => {
  it("covers all phases", () => {
    const phases: Phase[] = ["working", "break-due", "breaking"];
    for (const phase of phases) {
      expect(PHASE_ANIMATION_MAP[phase]).toBeDefined();
    }
  });
});
