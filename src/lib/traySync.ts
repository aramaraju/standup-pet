/**
 * Sync macOS menu bar tray icon to the current pet + animation.
 */

import { invoke } from "@tauri-apps/api/core";
import type { PetChoice } from "./pets";
import type { AnimationKey } from "./spriteState";

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function syncTrayIcon(
  pet: PetChoice,
  animation: AnimationKey
): Promise<void> {
  if (!isTauri()) return;
  try {
    await invoke("set_tray_icon", { pet, animation });
  } catch {
    // Tray may not exist in web-only dev
  }
}
