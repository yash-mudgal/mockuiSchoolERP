/* ==========================================================================
   registry.js — the single route table for the whole product.

   Every page module under assets/js/pages/ exports a `routes` object whose
   keys are route strings matching core/nav.js exactly, and whose values are
   page definitions of the shape:

       { title, subtitle?, section?, render(mount, ctx) }

   This file merges them into one flat map and is the only thing app.js needs
   to know about pages. Adding a module is a two-line change: import it here
   and spread it into `routes`.

   ── Integration status ────────────────────────────────────────────────────
   403 route strings in core/nav.js · 404 implemented · 0 missing · 0 duplicate
   route keys across the ten page modules. The one extra key
   (`portals/mobile-app`) is intentional: it has no sidebar entry and is
   reached from the "Mobile app preview" chip in each portal hero.

   Because there are no gaps, there is no pages/_fill.js — nothing falls
   through to notFoundPage() from the navigation tree.
   ========================================================================== */

import { routes as dashboards }  from './pages/dashboards.js';
import { routes as admissions }  from './pages/admissions.js';
import { routes as students }    from './pages/students.js';
import { routes as academics }   from './pages/academics.js';
import { routes as assessment }  from './pages/assessment.js';
import { routes as finance }     from './pages/finance.js';
import { routes as hr }          from './pages/hr.js';
import { routes as operations }  from './pages/operations.js';
import { routes as engagement }  from './pages/engagement.js';
import { routes as portals }     from './pages/portals.js';

import { notFoundPage } from './core/page-kit.js';
import { routeMeta } from './core/nav.js';
import * as store from './core/state.js';
import { db } from './data/db.js';

/* The order below is the order of the sidebar sections. Later spreads win on
   a key collision — see `duplicateRoutes()` for the audit hook. */
const MODULES = [
  ['dashboards', dashboards],
  ['admissions', admissions],
  ['students', students],
  ['academics', academics],
  ['assessment', assessment],
  ['finance', finance],
  ['hr', hr],
  ['operations', operations],
  ['engagement', engagement],
  ['portals', portals],
];

/**
 * Which module each live route came from — used by `duplicateRoutes()` and by
 * the dev console helper `__erp.registry`.
 * @type {Map<string, string>}
 */
const origin = new Map();

/**
 * Collisions detected while merging: route -> [moduleName, ...] in the order
 * they were seen. Empty in a healthy build.
 * @type {Map<string, string[]>}
 */
const collisions = new Map();

/**
 * A page definition is "more complete" when it renders more code and declares
 * more of the optional metadata. Used to resolve a duplicate key in favour of
 * the fuller implementation rather than letting spread order decide silently.
 */
function completeness(def) {
  if (!def || typeof def.render !== 'function') return -1;
  let score = 0;
  try { score += String(def.render).length; } catch { /* bound/native fn */ }
  if (def.title) score += 200;
  if (def.subtitle) score += 200;
  if (def.section) score += 200;
  return score;
}

function merge() {
  const table = {};
  for (const [name, mod] of MODULES) {
    for (const [route, def] of Object.entries(mod || {})) {
      if (route in table) {
        const seen = collisions.get(route) || [origin.get(route)];
        seen.push(name);
        collisions.set(route, seen);
        /* Keep the more complete implementation, not simply the later one. */
        if (completeness(def) > completeness(table[route])) {
          table[route] = def;
          origin.set(route, name);
        }
        continue;
      }
      table[route] = def;
      origin.set(route, name);
    }
  }
  return table;
}

/** The merged route table: every screen in the product, keyed by route. */
export const routes = merge();

/* Surface any collision loudly in the console — it is always a bug in a
   module's route keys, never something to live with. */
if (collisions.size) {
  console.warn(
    `[registry] ${collisions.size} duplicate route key(s) merged; kept the more complete implementation:`,
    Object.fromEntries(collisions),
  );
}

/** Audit hook: `{ route: [moduleA, moduleB] }` for every key seen twice. */
export function duplicateRoutes() {
  return Object.fromEntries(collisions);
}

/** Which page module owns a live route. */
export function moduleFor(route) {
  return origin.get(route) || null;
}

/** Route count per module, for the About screen and the README. */
export function moduleCounts() {
  const out = {};
  for (const [name] of MODULES) out[name] = 0;
  for (const name of origin.values()) out[name] += 1;
  return out;
}

/**
 * Guarantee the page context documented in CONTRACT.md.
 *
 * core/router.js builds a navigation ctx ({route, path, params, query, …}) but
 * knows nothing about the store or the mock database; app.js is what adds
 * `state` and `db` when it wraps the table in its skeleton loader. Pages are
 * entitled to both — several read `ctx.state.campusId` or
 * `ctx.state.currentUser` unguarded — so anything that renders a page def
 * outside app.js has to supply them too. Filling them in here means `resolve()`
 * is safe to call with a bare router ctx.
 */
function withPageContext(ctx) {
  if (ctx && ctx.state && ctx.db) return ctx;
  return { ...ctx, state: (ctx && ctx.state) || store.get(), db: (ctx && ctx.db) || db };
}

/**
 * Resolve a route string to a page definition.
 *
 * Always returns something renderable: a real page when the route is
 * registered, otherwise a synthetic definition that renders page-kit's
 * notFoundPage() — which itself distinguishes "known to nav.js but not yet
 * built" from "no such route".
 *
 * The returned def renders with the full page context, so callers only need
 * the navigation ctx that core/router.js produces.
 *
 * @param {string} route
 * @returns {{title:string, subtitle?:string, section?:string, notFound?:boolean, render:Function}}
 */
export function resolve(route) {
  const def = routes[route];
  if (def) {
    return {
      ...def,
      render(mount, ctx) { return def.render(mount, withPageContext(ctx)); },
    };
  }

  const meta = routeMeta(route);
  return {
    title: meta ? meta.label : 'Page not found',
    subtitle: meta ? meta.sectionLabel : `No module is registered for “${route}”`,
    section: meta ? meta.sectionId : undefined,
    notFound: true,
    render(mount, ctx) {
      mount.appendChild(notFoundPage({ ...withPageContext(ctx), route }));
    },
  };
}

export default routes;
