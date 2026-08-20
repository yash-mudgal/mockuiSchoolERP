/* ==========================================================================
   rng.js — deterministic seeded pseudo-random utilities
   Every reload renders the exact same data. Never use Math.random() in the app.
   ========================================================================== */

/** mulberry32 — fast, well-distributed 32-bit PRNG. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable string -> 32-bit hash (FNV-1a). Useful for per-entity seeds. */
export function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * A seeded random helper bundle.
 * @param {number|string} seed
 */
export function makeRng(seed) {
  const s = typeof seed === 'string' ? hashString(seed) : seed;
  const rand = mulberry32(s);

  const api = {
    /** float in [0,1) */
    next: rand,
    /** float in [min,max) */
    float(min, max) { return min + rand() * (max - min); },
    /** integer in [min,max] inclusive */
    int(min, max) { return Math.floor(min + rand() * (max - min + 1)); },
    /** true with probability p (default 0.5) */
    bool(p = 0.5) { return rand() < p; },
    /** random element of arr */
    pick(arr) { return arr[Math.floor(rand() * arr.length)]; },
    /** n distinct elements of arr (or all, if n > arr.length) */
    sample(arr, n) {
      const copy = arr.slice();
      api.shuffle(copy);
      return copy.slice(0, Math.min(n, copy.length));
    },
    /** in-place Fisher-Yates */
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    },
    /**
     * Weighted pick. `pairs` is [[value, weight], ...].
     */
    weighted(pairs) {
      let total = 0;
      for (const p of pairs) total += p[1];
      let r = rand() * total;
      for (const p of pairs) {
        r -= p[1];
        if (r <= 0) return p[0];
      }
      return pairs[pairs.length - 1][0];
    },
    /**
     * Normally-distributed value (Box–Muller polar form).
     *
     * The old implementation averaged three uniforms, which is bounded at
     * mean ± 1.732·sd — it produced no tail at all. Every "normal" field in the
     * mock (attendance, CGPA, marks) came out as a hard-walled blob: no student
     * below 75% attendance, no exam failures, no toppers. A real Gaussian gives
     * the long tail those screens are built to surface.
     */
    gaussian(mean = 0, sd = 1) {
      let u = 0;
      let v = 0;
      let s2 = 0;
      do {
        u = rand() * 2 - 1;
        v = rand() * 2 - 1;
        s2 = u * u + v * v;
      } while (s2 === 0 || s2 >= 1);
      return mean + u * Math.sqrt((-2 * Math.log(s2)) / s2) * sd;
    },
    /** clamped gaussian integer */
    gaussInt(mean, sd, min, max) {
      const v = Math.round(api.gaussian(mean, sd));
      return Math.max(min, Math.min(max, v));
    },
    /** a date between two Date/ISO bounds */
    date(from, to) {
      const a = new Date(from).getTime();
      const b = new Date(to).getTime();
      return new Date(a + rand() * (b - a));
    },
    /** n items produced by fn(i) */
    times(n, fn) {
      const out = new Array(n);
      for (let i = 0; i < n; i++) out[i] = fn(i);
      return out;
    },
    /** deterministic sub-generator */
    fork(label) { return makeRng(hashString(String(label)) ^ s); },
  };
  return api;
}

/** A shared global generator used for one-off deterministic values. */
export const rng = makeRng(20260420);

export default makeRng;
