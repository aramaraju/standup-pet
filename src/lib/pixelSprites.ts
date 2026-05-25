/**
 * 16×16 pixel-art sprites — single source of truth for UI and tray icons.
 *
 * Each pet defines:
 *   palette  — symbol → hex color (or null for transparent)
 *   body     — 16-row template with two placeholder rows for eyes
 *   eyeIdx   — index where eye rows start (eyes occupy [eyeIdx, eyeIdx+1])
 *   eyes     — per-animation pair of rows that get spliced into the body
 *
 * Symbols used across pets:
 *   . transparent     o outline (dark)
 *   O body main       S body shadow       H body highlight
 *   W eye white       E eye pupil/closed
 *   P primary accent  M secondary accent (mouth/tongue)
 *   B bill / beak     G shell highlight   T tongue
 *   Z sleep glyph
 */

import type { PetChoice } from "./pets";
import type { AnimationKey } from "./spriteState";

export const SPRITE_SIZE = 16;

/** A single frame: 16 rows of 16 chars each. */
export type SpriteFrame = readonly string[];
/** An animation: an ordered list of frames to cycle through. */
export type FrameSequence = readonly SpriteFrame[];

export interface PetSpriteSet {
  palette: Record<string, string | null>;
  frames: Partial<Record<AnimationKey, FrameSequence>>;
}

const ANIMS: readonly AnimationKey[] = ["idle", "nudge", "happy", "sleeping"];

type EyePair = readonly [string, string];

/**
 * Build a 4-animation, single-frame-each set by splicing per-animation eye
 * rows into a shared body template. Used when an animation only needs one
 * frame; multi-frame animations are defined inline.
 */
function buildFrames(
  body: readonly string[],
  eyeIdx: number,
  eyes: Record<AnimationKey, EyePair>
): Partial<Record<AnimationKey, FrameSequence>> {
  const out: Partial<Record<AnimationKey, FrameSequence>> = {};
  for (const anim of ANIMS) {
    const rows = body.slice();
    rows[eyeIdx] = eyes[anim][0];
    rows[eyeIdx + 1] = eyes[anim][1];
    out[anim] = [rows];
  }
  return out;
}

/**
 * Wrap an animation that already has explicit multi-frame data into the
 * FrameSequence type. Use when you want a per-pet override for one
 * animation while keeping the others from buildFrames.
 */
export function multiFrame(...frames: SpriteFrame[]): FrameSequence {
  return frames;
}

/* ------------------------------------------------------------------ CAT */
/* Triangular ears, round face, pink nose, curled paws.                  */
const CAT_BODY = [
  ".oo........oo...", //  0  ear tips
  ".oOo......oOo...", //  1  ear interiors
  ".oOSoooooooSOo..", //  2  ear bases bridging to head
  "oOOOOOOOOOOOOOOo", //  3  head top
  "oOOOOOOOOOOOOOOo", //  4  EYES
  "oOOOOOOOOOOOOOOo", //  5  EYES
  "oOOOOOOPPOOOOOOo", //  6  pink nose
  "oOOOOOMMOOMMOOOo", //  7  whisker mouth
  ".oOOOOOOOOOOOOo.", //  8  jaw
  ".oOSOOOOOOOOSOo.", //  9  shoulders shaded
  ".oSOOOOOOOOOOSo.", // 10  body
  ".oOOOOOOOOOOOOo.", // 11
  "..oOOOOOOOOOOo..", // 12
  "..oOHSSSSSSHOo..", // 13  tummy with highlight edges
  "...oo......oo...", // 14  paws
  "................", // 15
];
const CAT_EYES: Record<AnimationKey, EyePair> = {
  idle:     ["oOOWWOOOOOOWWOOo", "oOOWEOOOOOOEWOOo"],
  nudge:    ["oOWWWOOOOOOWWWOo", "oOWEEOOOOOOEEWOo"],
  happy:    ["oOOEEOOOOOOEEOOo", "oOOOOOOOOOOOOOOo"],
  sleeping: ["oOOEEEOOOOEEEOOo", "oOOOOOOOOOOOOOOo"],
};

/* ------------------------------------------------------------------ DOG */
/* Floppy ears hanging on the sides, snout with pink tongue.            */
const DOG_BODY = [
  "................", //  0
  "....oooooooo....", //  1  head crown
  "..ooOOOOOOOOoo..", //  2  head widens
  ".oSSOOOOOOOOSSo.", //  3  ear tops blend in shadow
  ".oSSOOOOOOOOSSo.", //  4  EYES
  ".oSSOOOOOOOOSSo.", //  5  EYES
  ".oSSOOOPPPPOOSSo.".slice(0, 16), //  6  snout w/ dark nose
  ".oSSOOPMMMMPOSSo.".slice(0, 16), //  7  mouth + tongue
  ".oSSOOOOOOOOSSo.", //  8  ears finish
  "..oOOOOOOOOOOOo.", //  9  neck (asymmetric to show head turn)
  "..oOSOOOOOOOOSo.", // 10  body shoulders
  "..oOOOOOOOOOOOo.", // 11  body
  "..oOSSOOOOOOSSo.", // 12  belly shading
  "..oOOOOOOOOOOOo.", // 13
  "...oo..oo..oo...", // 14  four paws
  "................", // 15
];
const DOG_EYES: Record<AnimationKey, EyePair> = {
  idle:     [".oSSOWWOOOOWWOSo", ".oSSOWEOOOOEWOSo"],
  nudge:    [".oSWWWOOOOOOWWWo", ".oSWEEOOOOEEEWWo"],
  happy:    [".oSSOEEOOOOEEOSo", ".oSSOOOOOOOOOOSo"],
  sleeping: [".oSSOEEEOOEEEOSo", ".oSSOOOOOOOOOOSo"],
};

/* ----------------------------------------------------------------- FROG */
/* Bulging eyes on TOP of the head, wide grin, splayed legs.             */
const FROG_BODY = [
  "..oWWoo..ooWWo..", //  0  EYES (whites top)
  ".oWEEo....oEEWo.", //  1  EYES (pupils)
  ".oOOOoooooOOOOo.", //  2  head top behind eyes
  "oOOOOOOOOOOOOOOo", //  3  head
  "oOOOPOOOOOOOPOOo", //  4  cheek freckles
  "oOOOOOOOOOOOOOOo", //  5  below cheeks
  "oOOMMMMMMMMMMOOo", //  6  wide mouth
  "oOOOOOOOOOOOOOOo", //  7  jaw
  ".oOOOOOOOOOOOOo.", //  8  body narrows
  ".oOSOOOOOOOOSOo.", //  9  body shading
  ".oOSOOOOOOOOSOo.", // 10
  ".oOOOOOOOOOOOOo.", // 11
  "..oOOOOOOOOOOo..", // 12
  "..oOHSSSSSSHOo..", // 13  tummy
  ".oOo........oOo.", // 14  legs splayed outward
  "oOo..........oOo", // 15  feet
];
const FROG_EYES: Record<AnimationKey, EyePair> = {
  idle:     ["..oWWoo..ooWWo..", ".oWEEo....oEEWo."],
  nudge:    [".oWWWo....oWWWo.", ".oWEEo....oEEWo."],
  happy:    ["..oEEoo..ooEEo..", ".oOOOo....oOOOo."],
  sleeping: ["..o--oo..oo--o..", ".oOOOo....oOOOo."],
};

/* --------------------------------------------------------------- TURTLE */
/* Dome shell with hex pattern, head pokes out front-right, four feet.   */
const TURTLE_BODY = [
  "................", //  0
  "....oooooooo....", //  1  shell top
  "...oSSSSSSSSo...", //  2  shell rim
  "..oSGGSSSSGGSo..", //  3  shell pattern
  "..oSGGOSSOGGSo..", //  4  shell mid
  "..oSOSSSSSSOSo..", //  5  shell mid
  "..oSGGOSSOGGSo..", //  6  shell pattern
  ".oSSSSSSSSSSSSo.", //  7  shell base
  "oOOoOOOOOOOOOOOo", //  8  head poking out left + body
  "oOWWoOOOOOOOOOOo", //  9  EYES (head)
  "oOWEoOOOOOOOOOOo", // 10  EYES (pupil)
  "oOOOoOOOOOOOOOOo", // 11  head + body underside
  ".oOoSSSSSSSSSSo.", // 12  body underside
  "..oooooooooooo..", // 13  body outline
  "...oo......oo...", // 14  feet
  "................", // 15
];
const TURTLE_EYES: Record<AnimationKey, EyePair> = {
  idle:     ["oOWWoOOOOOOOOOOo", "oOWEoOOOOOOOOOOo"],
  nudge:    ["oWWWoOOOOOOOOOOo", "oWEEoOOOOOOOOOOo"],
  happy:    ["oOEEoOOOOOOOOOOo", "oOOOoOOOOOOOOOOo"],
  sleeping: ["oO--oOOOOOOOOOOo", "oOOOoOOOOOOOOOOo"],
};

/* ------------------------------------------------------------------ PIG */
/* Small triangle ears, round body, snout with two nostrils, hooves.    */
const PIG_BODY = [
  "...oo......oo...", //  0  ear tips
  "..oOSo....oSOo..", //  1  ears with inner shadow
  ".oOOOoooooOOOOo.", //  2  ear bases to head
  "oOOOOOOOOOOOOOOo", //  3  head
  "oOOOOOOOOOOOOOOo", //  4  EYES
  "oOOOOOOOOOOOOOOo", //  5  EYES
  "oOOOPPPPPPPPOOOo", //  6  snout outline
  "oOOPHHEPPEHHPOOo", //  7  snout with nostrils
  "oOOPPPPPPPPPPOOO".slice(0, 16), //  8  snout bottom
  ".oOOOOOOOOOOOOOO".slice(0, 16), //  9  body top
  ".oOSOOOOOOOOSOo.", // 10  body
  ".oOOOOOOOOOOOOo.", // 11
  "..oOOOOOOOOOOo..", // 12
  "..oHSSSSSSSSHo..", // 13  belly
  "...oo......oo...", // 14  hooves
  "................", // 15
];
const PIG_EYES: Record<AnimationKey, EyePair> = {
  idle:     ["oOOWWOOOOOOWWOOo", "oOOWEOOOOOOEWOOo"],
  nudge:    ["oOWWWOOOOOOWWWOo", "oOWEEOOOOOOEEWOo"],
  happy:    ["oOOEEOOOOOOEEOOo", "oOOOOOOOOOOOOOOo"],
  sleeping: ["oOOEEEOOOOEEEOOo", "oOOOOOOOOOOOOOOo"],
};

/* ----------------------------------------------------------------- DUCK */
/* Round head and body, prominent orange bill, side wing.                */
const DUCK_BODY = [
  "................", //  0
  "....oooooooo....", //  1  head crown
  "..ooOOOOOOOOoo..", //  2
  ".oOOOOOOOOOOOOo.", //  3
  ".oOOOOOOOOOOOOo.", //  4  EYES
  ".oOOOOOOOOOOOOo.", //  5  EYES
  "oBBBBBBOOOOOOOOo", //  6  orange bill base (to one side)
  "oBBBBBBBBOOOOOOo", //  7  bill extends forward
  "oBBBBBBOOOOOOOOo", //  8  bill bottom
  ".oOOOOOOOOOOOOo.", //  9  neck
  "oOOOOOOOOOOOOOOo", // 10  body widens
  "oOOSSOOOOOOOOOOo", // 11  wing shading
  "oOSSSOOOOOOOOOOo", // 12  wing detail
  ".oOSSOOOOOOOOOo.", // 13
  "..oOOOOOOOOOOOo.", // 14
  "...BB......BB...", // 15  webbed feet
];
const DUCK_EYES: Record<AnimationKey, EyePair> = {
  idle:     [".oOOWWOOOOWWOOo.", ".oOOWEOOOOEWOOo."],
  nudge:    [".oOWWWOOOOWWWOo.", ".oOWEEOOOOEEWOo."],
  happy:    [".oOOEEOOOOEEOOo.", ".oOOOOOOOOOOOOo."],
  sleeping: [".oOOEEEOOEEEOOo.", ".oOOOOOOOOOOOOo."],
};

/* ----------------------------------------------------------------- WOLF */
/* Sharp pointed ears, narrow snout, fierce gaze, slim body.             */
const WOLF_BODY = [
  "oo..........oo..", //  0  pointed ear tips (offset)
  "oSo........oSo..", //  1  ear interior shadow
  "oOSo......oSOo..", //  2  ear inner
  "oOOSoooooooSOOo.", //  3  ear bases to head
  "oOOOOOOOOOOOOOOo", //  4  EYES
  "oOOOOOOOOOOOOOOo", //  5  EYES
  ".oOOOOOEEOOOOOo.", //  6  dark nose
  ".oOOSOOOOOOSOOo.", //  7  muzzle shading
  "..oOOOMMMMOOOOo.", //  8  fanged mouth
  "..oOOOOOOOOOOOo.", //  9  jaw
  "..oOSOOOOOOOSOo.", // 10  chest shading
  "..oOOOOOOOOOOOo.", // 11
  "..oOSSOOOOSSOOo.", // 12  side shading
  "..oOOOOOOOOOOOo.", // 13
  "...oo......oo...", // 14  paws
  "................", // 15
];
const WOLF_EYES: Record<AnimationKey, EyePair> = {
  idle:     ["oOOOWWOOOOWWOOOo", "oOOOWEOOOOEWOOOo"],
  nudge:    ["oOOWWWOOOOWWWOOo", "oOOWEEOOOOEEWOOo"],
  happy:    ["oOOOEEOOOOEEOOOo", "oOOOOOOOOOOOOOOo"],
  sleeping: ["oOOOEEEOOEEEOOOo", "oOOOOOOOOOOOOOOo"],
};

/* ----------------------------------------------------------------- BEAR */
/* Round semicircle ears, chunky face, lighter muzzle patch.             */
const BEAR_BODY = [
  "..oo........oo..", //  0  round ear tops
  ".oOOo......oOOo.", //  1  round ears
  ".oOSOoooooOSOOo.", //  2  ear bases to head
  "oOOOOOOOOOOOOOOo", //  3
  "oOOOOOOOOOOOOOOo", //  4  EYES
  "oOOOOOOOOOOOOOOo", //  5  EYES
  "oOOOHHHHHHHHOOOo", //  6  muzzle patch start
  "oOOOHHHEEHHHOOOo", //  7  dark nose in muzzle
  "oOOOHHHMMHHHOOOo", //  8  mouth in muzzle
  ".oOOOHHHHHHOOOo.", //  9  muzzle ends
  ".oOSOOOOOOOOSOo.", // 10  shoulders shaded
  ".oOOOOOOOOOOOOo.", // 11  body
  "..oOOOOOOOOOOo..", // 12
  "..oOHSSSSSSHOo..", // 13  belly with highlight rim
  "...oo......oo...", // 14  paws
  "................", // 15
];
const BEAR_EYES: Record<AnimationKey, EyePair> = {
  idle:     ["oOOWWOOOOOOWWOOo", "oOOWEOOOOOOEWOOo"],
  nudge:    ["oOWWWOOOOOOWWWOo", "oOWEEOOOOOOEEWOo"],
  happy:    ["oOOEEOOOOOOEEOOo", "oOOOOOOOOOOOOOOo"],
  sleeping: ["oOOEEEOOOOEEEOOo", "oOOOOOOOOOOOOOOo"],
};

/* ============================================================ MOTION HELPERS */
/* Multi-frame sequencing — Claude Code "Clawd" mascot style: each frame is a   */
/* complete redraw, no tweening. Per pet we add: glasses + blink to idle, a Z  */
/* bubble cycle to sleeping. Defined here so the per-pet table below stays     */
/* compact.                                                                    */

function paint(row: string, cells: Array<[number, string]>): string {
  const chars = row.split("");
  for (const [i, ch] of cells) {
    if (i >= 0 && i < chars.length) chars[i] = ch;
  }
  return chars.join("");
}

function withCells(
  frame: SpriteFrame,
  cells: Array<[number, number, string]>
): SpriteFrame {
  const rows = frame.slice();
  const byRow = new Map<number, Array<[number, string]>>();
  for (const [y, x, ch] of cells) {
    if (y < 0 || y >= rows.length) continue;
    const list = byRow.get(y) ?? [];
    list.push([x, ch]);
    byRow.set(y, list);
  }
  for (const [y, ops] of byRow) {
    rows[y] = paint(rows[y], ops);
  }
  return rows;
}

/** Eyes at [[leftStart, leftEnd], [rightStart, rightEnd]] (inclusive cols). */
type EyeBounds = readonly [readonly [number, number], readonly [number, number]];

interface GlassesSpec {
  /** Row directly above the eye-top row — frame tops go here. */
  topRow: number;
  eyes: EyeBounds;
}

/** Draw round specs: outline pixels framing each eye plus a bridge dot. */
function addGlasses(frame: SpriteFrame, spec: GlassesSpec): SpriteFrame {
  const [[l0, l1], [r0, r1]] = spec.eyes;
  const bridgeCol = Math.floor((l1 + r0) / 2);
  return withCells(frame, [
    // Frame tops on the row above the eyes
    [spec.topRow, l0 - 1, "o"],
    [spec.topRow, l1 + 1, "o"],
    [spec.topRow, r0 - 1, "o"],
    [spec.topRow, r1 + 1, "o"],
    [spec.topRow, bridgeCol, "o"],
    // Frame sides on the eye-top row itself
    [spec.topRow + 1, l0 - 1, "o"],
    [spec.topRow + 1, l1 + 1, "o"],
    [spec.topRow + 1, r0 - 1, "o"],
    [spec.topRow + 1, r1 + 1, "o"],
  ]);
}

interface ZSpec {
  /** Top-left corner of the Z bubble; pixels grow down/right from here. */
  row: number;
  col: number;
}

/** Add a growing sleep-bubble Z. size 0 = nothing, 1 = single dot, 2 = larger. */
function withZ(frame: SpriteFrame, size: 0 | 1 | 2, spec: ZSpec): SpriteFrame {
  if (size === 0) return frame;
  const { row, col } = spec;
  if (size === 1) {
    return withCells(frame, [[row, col, "W"]]);
  }
  return withCells(frame, [
    [row - 1, col, "W"],
    [row - 1, col + 1, "W"],
    [row, col + 1, "W"],
    [row + 1, col, "W"],
    [row + 1, col + 1, "W"],
  ]);
}

interface PetMotion {
  glasses?: GlassesSpec;
  z: ZSpec;
}

const PET_MOTION: Record<PetChoice, PetMotion> = {
  cat:    { glasses: { topRow: 3, eyes: [[3, 4], [11, 12]] }, z: { row: 1, col: 14 } },
  dog:    { glasses: { topRow: 3, eyes: [[5, 6], [11, 12]] }, z: { row: 1, col: 14 } },
  frog:   { /* eyes are on top — skip glasses */                 z: { row: 4, col: 14 } },
  turtle: { /* single side-eye on the poking head */             z: { row: 2, col: 13 } },
  pig:    { glasses: { topRow: 3, eyes: [[3, 4], [11, 12]] }, z: { row: 1, col: 14 } },
  duck:   { glasses: { topRow: 3, eyes: [[4, 5], [10, 11]] }, z: { row: 1, col: 14 } },
  wolf:   { glasses: { topRow: 3, eyes: [[4, 5], [10, 11]] }, z: { row: 1, col: 14 } },
  bear:   { glasses: { topRow: 3, eyes: [[3, 4], [11, 12]] }, z: { row: 1, col: 14 } },
};

/** Layer per-pet motion (glasses + sleep-Z cycle) onto a base single-frame set. */
function applyMotion(set: PetSpriteSet, motion: PetMotion): PetSpriteSet {
  const out: Partial<Record<AnimationKey, FrameSequence>> = {};

  // Idle: 4-frame cycle of [open, open, open, blink]. Glasses on every frame
  // so they don't pop. Blink reuses the closed-eye sleeping frame's eye rows.
  const idle0 = set.frames.idle?.[0];
  const blinkSrc = set.frames.sleeping?.[0];
  if (idle0) {
    const open = motion.glasses ? addGlasses(idle0, motion.glasses) : idle0;
    const blinkBase = blinkSrc ?? idle0;
    const blink = motion.glasses ? addGlasses(blinkBase, motion.glasses) : blinkBase;
    out.idle = [open, open, open, blink];
  }

  // Sleeping: 4-frame Z-bubble cycle, growing from nothing → big → small.
  const sleep0 = set.frames.sleeping?.[0];
  if (sleep0) {
    out.sleeping = [
      withZ(sleep0, 0, motion.z),
      withZ(sleep0, 1, motion.z),
      withZ(sleep0, 2, motion.z),
      withZ(sleep0, 1, motion.z),
    ];
  }

  // Nudge/happy: keep as-is.
  if (set.frames.nudge) out.nudge = set.frames.nudge;
  if (set.frames.happy) out.happy = set.frames.happy;

  return { palette: set.palette, frames: out };
}

const RAW_PET_SPRITES: Record<PetChoice, PetSpriteSet> = {
  cat: {
    palette: {
      ".": null,
      o: "#1a1208",
      O: "#e89858",
      S: "#b87038",
      H: "#f4b888",
      W: "#fff8ee",
      E: "#1a1208",
      P: "#f0a8b8",
      M: "#8b4a2b",
      "-": "#1a1208",
    },
    frames: buildFrames(CAT_BODY, 4, CAT_EYES),
  },
  dog: {
    palette: {
      ".": null,
      o: "#1a1208",
      O: "#d9b070",
      S: "#9b7842",
      H: "#efd0a0",
      W: "#fff8ee",
      E: "#1a1208",
      P: "#1a1208",
      M: "#d8688a",
      "-": "#1a1208",
    },
    frames: buildFrames(DOG_BODY, 4, DOG_EYES),
  },
  frog: {
    palette: {
      ".": null,
      o: "#1a3818",
      O: "#7cc05a",
      S: "#4a8a3a",
      H: "#a8d888",
      W: "#fff8ee",
      E: "#1a1208",
      P: "#4a8a3a",
      M: "#6b3838",
      "-": "#1a1208",
    },
    frames: buildFrames(FROG_BODY, 0, FROG_EYES),
  },
  turtle: {
    palette: {
      ".": null,
      o: "#1f2e22",
      O: "#a8d8a0",
      S: "#6b9e5e",
      G: "#3a6b48",
      H: "#cfe8b8",
      W: "#fff8ee",
      E: "#1a1208",
      P: "#cfe8b8",
      M: "#3a6b48",
      "-": "#1a1208",
    },
    frames: buildFrames(TURTLE_BODY, 9, TURTLE_EYES),
  },
  pig: {
    palette: {
      ".": null,
      o: "#2a1a1a",
      O: "#f4b6c6",
      S: "#d088a0",
      H: "#fce0e8",
      W: "#fff8ee",
      E: "#2a1a1a",
      P: "#e8889a",
      M: "#a85868",
      "-": "#2a1a1a",
    },
    frames: buildFrames(PIG_BODY, 4, PIG_EYES),
  },
  duck: {
    palette: {
      ".": null,
      o: "#2a1f08",
      O: "#f5d76e",
      S: "#c9a830",
      H: "#fceea8",
      W: "#fff8ee",
      E: "#2a1f08",
      B: "#f09030",
      P: "#f09030",
      M: "#c96820",
      "-": "#2a1f08",
    },
    frames: buildFrames(DUCK_BODY, 4, DUCK_EYES),
  },
  wolf: {
    palette: {
      ".": null,
      o: "#1a1e28",
      O: "#9aa8c4",
      S: "#5a6a88",
      H: "#c4cfe2",
      W: "#fff8ee",
      E: "#1a1e28",
      P: "#1a1e28",
      M: "#7a3848",
      "-": "#1a1e28",
    },
    frames: buildFrames(WOLF_BODY, 4, WOLF_EYES),
  },
  bear: {
    palette: {
      ".": null,
      o: "#2a1808",
      O: "#a87848",
      S: "#704a28",
      H: "#d8b088",
      W: "#fff8ee",
      E: "#2a1808",
      P: "#2a1808",
      M: "#4a2818",
      "-": "#2a1808",
    },
    frames: buildFrames(BEAR_BODY, 4, BEAR_EYES),
  },
};

/* Apply per-pet motion (glasses + sleep-Z cycle) once at module load. */
export const PET_SPRITES: Record<PetChoice, PetSpriteSet> = Object.fromEntries(
  (Object.keys(RAW_PET_SPRITES) as PetChoice[]).map((pet) => [
    pet,
    applyMotion(RAW_PET_SPRITES[pet], PET_MOTION[pet]),
  ])
) as Record<PetChoice, PetSpriteSet>;

function normalizeRow(row: string): string {
  if (row.length >= SPRITE_SIZE) return row.slice(0, SPRITE_SIZE);
  return row.padEnd(SPRITE_SIZE, ".");
}

/** Number of frames the given pet's animation has (≥1). */
export function getFrameCount(pet: PetChoice, animation: AnimationKey): number {
  const sequence =
    PET_SPRITES[pet].frames[animation] ?? PET_SPRITES[pet].frames.idle;
  return sequence ? Math.max(1, sequence.length) : 1;
}

export function getSpriteFrame(
  pet: PetChoice,
  animation: AnimationKey,
  frameIdx = 0
): { palette: Record<string, string | null>; rows: readonly string[] } {
  const set = PET_SPRITES[pet];
  const sequence =
    set.frames[animation] ??
    set.frames.idle ??
    PET_SPRITES.cat.frames.idle!;
  const frame = sequence[frameIdx % sequence.length] ?? sequence[0];
  const rows = frame.map(normalizeRow);
  return { palette: set.palette, rows };
}

/** Flat RGBA buffer for PNG export (tray icons). Uses frame 0 by default. */
export function spriteToRgba(
  pet: PetChoice,
  animation: AnimationKey,
  scale = 1,
  frameIdx = 0
): { width: number; height: number; data: Uint8Array } {
  const { palette, rows } = getSpriteFrame(pet, animation, frameIdx);
  const base = SPRITE_SIZE;
  const width = base * scale;
  const height = base * scale;
  const data = new Uint8Array(width * height * 4);

  for (let y = 0; y < base; y++) {
    for (let x = 0; x < base; x++) {
      const ch = rows[y]?.[x] ?? ".";
      const hex = palette[ch] ?? null;
      const r = hex ? parseInt(hex.slice(1, 3), 16) : 0;
      const g = hex ? parseInt(hex.slice(3, 5), 16) : 0;
      const b = hex ? parseInt(hex.slice(5, 7), 16) : 0;
      const a = hex ? 255 : 0;

      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const px = x * scale + sx;
          const py = y * scale + sy;
          const i = (py * width + px) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = a;
        }
      }
    }
  }

  return { width, height, data };
}
