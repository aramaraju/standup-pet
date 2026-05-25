/**
 * <FlashOverlay/> — fullscreen, click-through, transparent window that paints
 * a colored glow around the screen edges, then fades out. Triggered by the
 * Rust `flash_border` command which emits a `flash:play` event.
 */

import { useEffect, useState, type CSSProperties } from "react";
import { listen } from "@tauri-apps/api/event";

interface FlashPayload {
  color: string;
  durationMs: number;
}

interface ActiveFlash {
  color: string;
  durationMs: number;
  key: number;
}

export function FlashOverlay() {
  const [flash, setFlash] = useState<ActiveFlash | null>(null);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const dispose = await listen<FlashPayload>("flash:play", (event) => {
        setFlash({
          color: event.payload.color,
          durationMs: event.payload.durationMs,
          key: Date.now(),
        });
      });
      if (cancelled) {
        dispose();
      } else {
        unlisten = dispose;
      }
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), flash.durationMs + 100);
    return () => window.clearTimeout(id);
  }, [flash]);

  if (!flash) return null;

  // Layered radial glows feathered inward from each edge.
  const style = {
    "--flash-color": flash.color,
    "--flash-duration": `${flash.durationMs}ms`,
  } as CSSProperties;

  return <div key={flash.key} className="flash-overlay" style={style} aria-hidden />;
}
