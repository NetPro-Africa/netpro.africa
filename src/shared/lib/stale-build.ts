const RELOAD_GUARD_KEY = 'np-stale-build-reload';
const RELOAD_GUARD_MS = 10_000;

/**
 * After a deploy, a tab opened earlier asks for page files that no longer
 * exist. One fresh load fixes that. The guard stops a reload loop when the
 * file is genuinely missing (or the connection is down).
 */
export function canReloadForNewVersion() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY));
    return !last || Date.now() - last >= RELOAD_GUARD_MS;
  } catch {
    return true; // Storage blocked (private mode): still worth one reload.
  }
}

export function reloadForNewVersion() {
  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // Ignore: see canReloadForNewVersion.
  }
  window.location.reload();
}

export function isStaleBuildError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(
    message,
  );
}
