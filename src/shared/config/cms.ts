// ─── NetPro CMS ───────────────────────────────────────────────────────────────
// Same CMS product the UAES site uses. The address comes only from
// VITE_NETPRO_API_URL; there is deliberately no fallback, so an unset variable
// never shows another institution's content on netpro.africa.

function stripTrailingSlashes(value: string) {
  return value.replace(/\/+$/, '');
}

/** Where the CMS lives. Uploaded images are served from here. Empty when unset. */
export const cmsOrigin = stripTrailingSlashes(
  import.meta.env.VITE_NETPRO_API_URL?.trim() ?? '',
);

/** False until a CMS address is set; news hides itself and fetches nothing. */
export const isCmsConfigured = cmsOrigin !== '';

/**
 * Where API requests go. The CMS only allows its own site's origins through
 * CORS, so in development requests go to `/netpro-api` on the Vite dev server,
 * which proxies them to the CMS (see `server.proxy` in vite.config.ts).
 * Production builds call the CMS directly.
 */
export const cmsApiBaseUrl = import.meta.env.DEV ? '/netpro-api' : cmsOrigin;
