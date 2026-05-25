/**
 * Unit tests for sprite state mapping.
 */

import { describe, it, expect } from "vitest";
import { phaseToAnimation, PHASE_ANIMATION_MAP } from "../lib/spriteState";
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

describe("PHASE_ANIMATION_MAP completeness", () => {
  it("covers all phases", () => {
    const phases: Phase[] = ["working", "break-due", "breaking"];
    for (const phase of phases) {
      expect(PHASE_ANIMATION_MAP[phase]).toBeDefined();
    }
  });
});
