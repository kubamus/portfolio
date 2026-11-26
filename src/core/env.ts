/** Capability and preference detection, evaluated once at boot. */

export const DESKTOP_QUERY = '(min-width: 960px) and (min-height: 540px)';
export const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

export interface Env {
  webgl: boolean;
  reduced: boolean;
  desktop: boolean;
  finePointer: boolean;
}

function hasWebGL2(): boolean {
  if (new URLSearchParams(location.search).has('nogl')) return false;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function detectEnv(): Env {
  const env: Env = {
    webgl: hasWebGL2(),
    reduced: matchMedia(REDUCED_QUERY).matches,
    desktop: matchMedia(DESKTOP_QUERY).matches,
    finePointer: matchMedia('(pointer: fine)').matches,
  };
  const root = document.documentElement;
  root.classList.toggle('no-webgl', !env.webgl);
  root.classList.toggle('is-reduced', env.reduced);
  return env;
}
