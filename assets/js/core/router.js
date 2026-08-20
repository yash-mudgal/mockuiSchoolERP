/* ==========================================================================
   router.js — hash based router
   URLs look like:  #/students/all
                    #/students/profile/STU00042
                    #/fees/collection?class=X&status=due
   Route keys registered in registry.js are matched exactly first, then by
   longest static prefix (so 'students/profile' handles 'students/profile/ID').
   ========================================================================== */

const listeners = new Set();
let routes = {};
let notFoundHandler = null;
let beforeEach = null;
let currentCtx = null;
let started = false;

/** Register the route table (registry.js). Can be called repeatedly to extend. */
export function registerRoutes(table) {
  routes = { ...routes, ...(table || {}) };
}

/** Replace the whole route table. */
export function setRoutes(table) { routes = { ...(table || {}) }; }

/** The route table currently registered. */
export function getRoutes() { return routes; }

/** Register a fallback renderer for unknown routes. */
export function setNotFound(fn) { notFoundHandler = fn; }

/** Guard invoked before every navigation: (ctx) => false cancels. */
export function setBeforeEach(fn) { beforeEach = fn; }

/** Subscribe to navigation. fn(ctx) runs after each successful render. */
export function onNavigate(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Parse '#/a/b/c?x=1' into { route, path, params, query, hash }. */
export function parseHash(hash) {
  const raw = String(hash || location.hash || '').replace(/^#\/?/, '');
  const [pathPart, queryPart] = raw.split('?');
  const path = pathPart.replace(/\/+$/, '');
  const query = {};
  if (queryPart) {
    for (const pair of queryPart.split('&')) {
      if (!pair) continue;
      const [k, v = ''] = pair.split('=');
      query[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
    }
  }
  return { raw, path, query, segments: path ? path.split('/') : [] };
}

/** Find the best matching route key for a path. */
export function matchRoute(path) {
  if (!path) return null;
  if (routes[path]) return { key: path, params: [] };
  const segs = path.split('/');
  for (let i = segs.length - 1; i >= 1; i--) {
    const key = segs.slice(0, i).join('/');
    if (routes[key]) return { key, params: segs.slice(i) };
  }
  return null;
}

/** Current navigation context. */
export function current() { return currentCtx; }

/** Build a href for a route. navHref('students/all', {q:'x'}) -> '#/students/all?q=x' */
export function navHref(route, query) {
  const qs = query && Object.keys(query).length
    ? '?' + Object.entries(query).filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
    : '';
  return `#/${String(route).replace(/^\/+/, '')}${qs}`;
}

/** Navigate programmatically. */
export function navigate(route, query, { replace = false } = {}) {
  const href = navHref(route, query);
  if (replace) location.replace(href);
  else location.hash = href;
}

/** Re-render the current route. */
export function reload() { render(true); }

let mountEl = null;
let renderSeq = 0;

/** Start the router. mount is the element page content renders into. */
export function start(mount, opts = {}) {
  mountEl = mount;
  if (opts.routes) registerRoutes(opts.routes);
  if (opts.notFound) setNotFound(opts.notFound);
  if (opts.beforeEach) setBeforeEach(opts.beforeEach);
  if (!started) {
    started = true;
    window.addEventListener('hashchange', () => render(false));
  }
  render(false);
}

/** Change the mount element (used when the shell is rebuilt). */
export function setMount(el) { mountEl = el; }

function render(force) {
  if (!mountEl) return;
  const parsed = parseHash();
  const path = parsed.path;

  if (!path) {
    navigate(defaultRoute(), null, { replace: true });
    return;
  }

  const match = matchRoute(path);
  const def = match ? routes[match.key] : null;

  const ctx = {
    route: match ? match.key : path,
    path,
    params: match ? match.params : [],
    param: (match && match.params[0]) || null,
    query: parsed.query,
    def: def || null,
    title: def ? def.title : null,
    section: def ? def.section : null,
  };

  if (!force && currentCtx && currentCtx.path === path
      && JSON.stringify(currentCtx.query) === JSON.stringify(parsed.query)) {
    return;
  }

  if (beforeEach && beforeEach(ctx) === false) return;

  currentCtx = ctx;
  const seq = ++renderSeq;

  const done = () => {
    if (seq !== renderSeq) return;
    for (const fn of listeners) { try { fn(ctx); } catch (e) { console.error(e); } }
  };

  try {
    mountEl.scrollTop = 0;
    if (mountEl.parentElement) mountEl.parentElement.scrollTop = 0;
    if (def && typeof def.render === 'function') {
      mountEl.innerHTML = '';
      def.render(mountEl, ctx);
    } else if (notFoundHandler) {
      mountEl.innerHTML = '';
      notFoundHandler(mountEl, ctx);
    } else {
      mountEl.innerHTML = `<div class="page"><h1 class="page-title">Route not found</h1><p class="page-subtitle">${path}</p></div>`;
    }
  } catch (err) {
    console.error('[router] render failed for', path, err);
    mountEl.innerHTML = `<div class="page"><div class="card card-pad"><h2>Something went wrong</h2>
      <p class="t-muted mt-2">The page <code>${path}</code> failed to render.</p>
      <pre class="t-sm t-muted mt-3" style="white-space:pre-wrap">${String(err && err.message || err)}</pre></div></div>`;
  }
  done();
}

let defaultRouteResolver = () => 'dashboard/super-admin';
/** Provide a function returning the landing route (role aware). */
export function setDefaultRoute(fn) { defaultRouteResolver = typeof fn === 'function' ? fn : () => fn; }
export function defaultRoute() { return defaultRouteResolver(); }

export default { start, navigate, navHref, onNavigate, registerRoutes, current, reload, parseHash, matchRoute };
