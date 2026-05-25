/**
 * Generates 32×32 tray PNGs from pixelSprites.ts into src-tauri/icons/tray/
 *
 * Usage: npx tsx scripts/generate-tray-icons.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { PET_IDS } from "../src/lib/pets.ts";
import { spriteToRgba } from "../src/lib/pixelSprites.ts";
import type { AnimationKey } from "../src/lib/spriteState.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../src-tauri/icons/tray");
const TRAY_ANIMS: AnimationKey[] = ["idle", "nudge", "sleeping"];
const TRAY_SCALE = 2; // 16px art → 32px for Retina menu bar

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out[4] = type.charCodeAt(0);
  out[5] = type.charCodeAt(1);
  out[6] = type.charCodeAt(2);
  out[7] = type.charCodeAt(3);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4 + 1;
  const raw = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * stride + 1);
  }

  const idat = deflateSync(raw, { level: 9 });
  const parts = [
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    Buffer.from(chunk("IHDR", ihdr)),
    Buffer.from(chunk("IDAT", new Uint8Array(idat))),
    Buffer.from(chunk("IEND", new Uint8Array(0))),
  ];
  return Buffer.concat(parts);
}

mkdirSync(OUT_DIR, { recursive: true });

for (const pet of PET_IDS) {
  for (const animation of TRAY_ANIMS) {
    const { width, height, data } = spriteToRgba(pet, animation, TRAY_SCALE);
    const png = encodePng(width, height, data);
    const out = join(OUT_DIR, `${pet}-${animation}.png`);
    writeFileSync(out, png);
    console.log(`wrote ${out}`);
  }
}

console.log(`\nTray icons saved to ${OUT_DIR}`);
