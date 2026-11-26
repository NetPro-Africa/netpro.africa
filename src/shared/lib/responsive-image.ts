// Smaller copies of the big images, written by scripts/image-variants.mjs
// (keep the widths in step). With `srcSet` + `sizes` the browser downloads the
// one that fits the space on screen instead of the full-size file.

import { assetUrl } from '@/shared/config/site';

/** srcset URLs are split on spaces, so file names with spaces must be encoded. */
const entry = (url: string, width: number) => `${encodeURI(url)} ${width}w`;

/** Product screenshots: 1600×900 originals with 480w and 960w copies. */
export function productImageSrcSet(src: string) {
  // Only the product screenshots have copies; anything else keeps its src.
  if (!/\/assets\/netpro\/(?!project-|logo|background)[^/]+\.webp$/.test(src)) {
    return undefined;
  }

  const base = src.replace(/\.webp$/, '');
  return [
    entry(`${base}-480w.webp`, 480),
    entry(`${base}-960w.webp`, 960),
    entry(src, 1600),
  ].join(', ');
}

/** The home page hero background (2000×3000), shown full width. */
export const heroImage = {
  src: assetUrl('/assets/netpro/background.webp'),
  srcSet: [
    entry(assetUrl('/assets/netpro/background-750w.webp'), 750),
    entry(assetUrl('/assets/netpro/background-1280w.webp'), 1280),
    entry(assetUrl('/assets/netpro/background.webp'), 2000),
  ].join(', '),
  sizes: '100vw',
};
