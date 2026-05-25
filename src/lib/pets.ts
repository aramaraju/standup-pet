/**
 * Pet catalog — inspired by Pixel Pets' roster of pixel companions.
 */

export const PET_IDS = [
  "cat",
  "dog",
  "frog",
  "turtle",
  "pig",
  "duck",
  "wolf",
  "bear",
] as const;

export type PetChoice = (typeof PET_IDS)[number];

export interface PetDefinition {
  id: PetChoice;
  name: string;
  /** Accent color for picker tile and sprite frame */
  accent: string;
}

export const PET_CATALOG: readonly PetDefinition[] = [
  { id: "cat", name: "Willow", accent: "#e8a87c" },
  { id: "dog", name: "Spot", accent: "#c9a66b" },
  { id: "frog", name: "Hopscotch", accent: "#7cb87a" },
  { id: "turtle", name: "Tyler", accent: "#6b9e8a" },
  { id: "pig", name: "Jellybean", accent: "#f0a8b8" },
  { id: "duck", name: "Waddles", accent: "#f5d76e" },
  { id: "wolf", name: "Fierce", accent: "#9aa8c4" },
  { id: "bear", name: "Polly", accent: "#b8956a" },
];

export function isPetChoice(value: unknown): value is PetChoice {
  return typeof value === "string" && (PET_IDS as readonly string[]).includes(value);
}

export function getPetDefinition(id: PetChoice): PetDefinition {
  const found = PET_CATALOG.find((p) => p.id === id);
  return found ?? PET_CATALOG[0];
}

export const DEFAULT_APP_PET: PetChoice = "cat";
