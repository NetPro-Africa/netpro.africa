// Writes smaller copies of the large WebP images in public/assets/netpro, so
// the browser can download one the size it actually shows (see
// src/shared/lib/responsive-image.ts). Run after adding or replacing an image:
//
//   node scripts/image-variants.mjs
//
// Needs `cwebp` (brew install webp). The copies are committed with the
// originals, so builds don't need it. `photo.webp` gets `photo-480w.webp`
// and `photo-960w.webp`; the hero background gets phone and tablet sizes.

import { execFileSync } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const dir = path.resolve('public/assets/netpro');

// Keep in step with src/shared/lib/responsive-image.ts.
const WIDTHS = { 'background.webp': [750, 1280], default: [480, 960] };
const QUALITY = 72;

/** Pixel width from the WebP header (VP8X, VP8 or VP8L). */
function webpWidth(buffer) {
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X') return 1 + buffer.readUIntLE(24, 3);
  if (chunk === 'VP8 ') return buffer.readUInt16LE(26) & 0x3fff;
  if (chunk === 'VP8L') return 1 + (buffer.readUInt32LE(21) & 0x3fff);
  throw new Error('not a WebP file');
}

const isVariant = (file) => /-\d+w\.webp$/.test(file);
let written = 0;

for (const file of (await readdir(dir)).filter((f) => f.endsWith('.webp') && !isVariant(f))) {
  const source = path.join(dir, file);
  const width = webpWidth(await readFile(source));
  const sourceTime = (await stat(source)).mtimeMs;

  for (const target of WIDTHS[file] ?? WIDTHS.default) {
    if (target >= width) continue; // never upscale

    const output = path.join(dir, file.replace(/\.webp$/, `-${target}w.webp`));
    const upToDate = await stat(output).then((s) => s.mtimeMs >= sourceTime, () => false);
    if (upToDate) continue;

    execFileSync('cwebp', ['-quiet', '-q', String(QUALITY), '-resize', String(target), '0', source, '-o', output]);
    written += 1;
  }
}

console.log(`Image variants: ${written} written.`);
