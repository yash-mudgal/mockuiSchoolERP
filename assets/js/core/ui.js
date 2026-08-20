/* ==========================================================================
   ui.js — DOM helper + component kit
   Everything returns REAL DOM NODES (not HTML strings) unless documented.
   Import from a page module:
       import { h, Card, DataTable, Button, formatCurrency } from '../core/ui.js';
   ========================================================================== */

import { icon } from './icons.js';
import * as state from './state.js';
import { navHref } from './router.js';

/* ======================================================== hyperscript === */

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_TAGS = new Set(['svg', 'g', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'defs', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'pattern',
  'ellipse', 'use', 'mask', 'title', 'desc', 'foreignObject', 'marker']);

function appendChild(parent, child) {
  if (child == null || child === false || child === true) return;
  if (Array.isArray(child)) { for (const c of child) appendChild(parent, c); return; }
  if (child instanceof Node) { parent.appendChild(child); return; }
  parent.appendChild(document.createTextNode(String(child)));
}

/**
 * Hyperscript. h('div', {className:'card'}, 'text', h('span', null, 'x'))
 * Props:
 *   className / class  -> class attribute
 *   style              -> object of CSS props (or a string)
 *   dataset            -> object of data-* values
 *   attrs              -> object of raw attributes
 *   html               -> innerHTML (use sparingly; never with untrusted text)
 *   on<Event>          -> addEventListener (onClick, onInput, onKeyDown, ...)
 *   ref                -> callback receiving the node
 *   anything else      -> set as a property when possible, else an attribute
 * @returns {HTMLElement|SVGElement}
 */
export function h(tag, props, ...children) {
  const el = SVG_TAGS.has(tag)
    ? document.createElementNS(SVG_NS, tag)
    : document.createElement(tag);
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value == null || value === false) continue;
      if (key === 'className' || key === 'class') {
        const cls = Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value);
        if (el instanceof SVGElement) el.setAttribute('class', cls); else el.className = cls;
      } else if (key === 'style') {
        if (typeof value === 'string') el.setAttribute('style', value);
        else for (const [p, v] of Object.entries(value)) {
          if (v == null) continue;
          if (p.startsWith('--')) el.style.setProperty(p, v); else el.style[p] = v;
        }
      } else if (key === 'dataset') {
        for (const [p, v] of Object.entries(value)) if (v != null) el.setAttribute('data-' + p, v);
      } else if (key === 'attrs') {
        for (const [p, v] of Object.entries(value)) if (v != null && v !== false) el.setAttribute(p, v === true ? '' : v);
      } else if (key === 'html') {
        el.innerHTML = value;
      } else if (key === 'ref') {
        if (typeof value === 'function') value(el);
      } else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'value' && 'value' in el) {
        el.value = value;
      } else if (key === 'checked' || key === 'disabled' || key === 'selected' || key === 'readOnly') {
        el[key] = !!value;
      } else if (el instanceof SVGElement) {
        el.setAttribute(key, value);
      } else if (key in el && typeof el[key] !== 'function') {
        try { el[key] = value; } catch (e) { el.setAttribute(key, value); }
      } else {
        el.setAttribute(key, value === true ? '' : value);
      }
    }
  }
  for (const child of children) appendChild(el, child);
  applyClickA11y(el, tag, props);
  return el;
}

/* Tags that are already keyboard-operable, so we must not touch them. */
const NATIVE_INTERACTIVE = new Set(['button', 'a', 'input', 'select', 'textarea', 'summary', 'label', 'option']);
/* Table/list semantics must survive — give these keyboard reach but no new role. */
const KEEP_ROLE = new Set(['tr', 'td', 'th', 'li', 'option', 'tbody', 'thead']);
const NESTED_CONTROL = 'button, a[href], input, select, textarea, [role="button"], [role="link"], [tabindex]';

/**
 * A non-native element carrying an onClick must be reachable and operable by
 * keyboard. Adds tabindex + Enter/Space activation, and role="button" only when
 * that will not clobber existing semantics or wrap another control.
 * Never overrides a role/tabindex the caller set explicitly.
 */
function applyClickA11y(el, tag, props) {
  if (!props || typeof props.onClick !== 'function') return;
  if (SVG_TAGS.has(tag) || NATIVE_INTERACTIVE.has(tag)) return;
  if (el.hasAttribute('tabindex') || el.hasAttribute('role')) return;
  if (el.getAttribute('aria-hidden') === 'true') return;

  el.setAttribute('tabindex', '0');
  if (!KEEP_ROLE.has(tag) && !el.querySelector(NESTED_CONTROL)) el.setAttribute('role', 'button');

  el.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ' && ev.key !== 'Spacebar') return;
    if (ev.target !== el) return;            // let nested controls handle their own keys
    ev.preventDefault();                      // Space must not scroll the page
    el.click();
  });
}

/** Alias of h(). */
export const el = h;

/** A DocumentFragment containing the arguments. */
export function frag(...children) {
  const f = document.createDocumentFragment();
  for (const c of children) appendChild(f, c);
  return f;
}

/** Replace the contents of `node` with html/nodes. Returns the node. */
export function mount(node, content) {
  node.innerHTML = '';
  if (typeof content === 'string') node.innerHTML = content;
  else appendChild(node, content);
  return node;
}

/** Remove a node safely. */
export function unmount(node) { if (node && node.parentNode) node.parentNode.removeChild(node); }

/* Parsing SVG markup is the single most repeated cost in the shell (the sidebar
   alone renders ~800 icons), so parse each variant once and clone thereafter. */
const iconCache = new Map();

/** An <svg> element built from an icon name — handy inside h(). */
export function Icon(name, size = 16, opts = {}) {
  const key = `${name}|${size}|${opts.strokeWidth || ''}|${opts.className || ''}|${opts.title || ''}`;
  let proto = iconCache.get(key);
  if (!proto) {
    const span = document.createElement('span');
    span.innerHTML = icon(name, size, opts);
    proto = span.firstElementChild;
    if (!proto) return span;
    iconCache.set(key, proto);
  }
  return proto.cloneNode(true);
}

/** Escape a string for safe interpolation into an HTML template. */
export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ========================================================== formatters == */

const NUM_IN = new Intl.NumberFormat('en-IN');
const NUM_IN_2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1234567 -> "12,34,567" */
export function formatNumber(n, decimals) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return decimals ? NUM_IN_2.format(Number(n)) : NUM_IN.format(Math.round(Number(n)));
}

/**
 * INR formatting, lakh/crore aware.
 * formatCurrency(1250)          -> "₹1,250"
 * formatCurrency(4820000, {compact:true}) -> "₹48.2 L"
 * formatCurrency(92400000, {compact:true}) -> "₹9.24 Cr"
 */
export function formatCurrency(n, { compact = false, decimals = 0, symbol = '₹', sign = false } = {}) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  const v = Number(n);
  const abs = Math.abs(v);
  const pre = sign && v > 0 ? '+' : v < 0 ? '-' : '';
  if (compact) {
    if (abs >= 1e7) return `${pre}${symbol}${(abs / 1e7).toFixed(abs >= 1e8 ? 1 : 2)} Cr`;
    if (abs >= 1e5) return `${pre}${symbol}${(abs / 1e5).toFixed(abs >= 1e6 ? 1 : 2)} L`;
    if (abs >= 1e3) return `${pre}${symbol}${(abs / 1e3).toFixed(abs >= 1e4 ? 0 : 1)}K`;
    return `${pre}${symbol}${formatNumber(abs)}`;
  }
  return `${pre}${symbol}${decimals ? NUM_IN_2.format(abs) : NUM_IN.format(Math.round(abs))}`;
}

/** 0.8342 -> "83.4%"  (pass alreadyPercent=true for 83.42) */
export function formatPercent(n, decimals = 1, alreadyPercent = true) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  const v = alreadyPercent ? Number(n) : Number(n) * 100;
  return `${v.toFixed(decimals)}%`;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDate(d) {
  if (d instanceof Date) return d;
  if (typeof d === 'number') return new Date(d);
  if (!d) return null;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * formatDate('2026-08-20')            -> "20 Aug 2026"
 * formatDate(d, 'short')              -> "20/08/26"
 * formatDate(d, 'long')               -> "Thursday, 20 August 2026"
 * formatDate(d, 'dayMonth')           -> "20 Aug"
 * formatDate(d, 'iso')                -> "2026-08-20"
 */
export function formatDate(d, style = 'medium') {
  const date = toDate(d);
  if (!date) return '—';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  switch (style) {
    case 'short': return `${dd}/${mm}/${String(yyyy).slice(2)}`;
    case 'numeric': return `${dd}/${mm}/${yyyy}`;
    case 'iso': return `${yyyy}-${mm}-${dd}`;
    case 'dayMonth': return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
    case 'monthYear': return `${MONTHS_SHORT[date.getMonth()]} ${yyyy}`;
    case 'long': return `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]}, ${date.getDate()} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][date.getMonth()]} ${yyyy}`;
    case 'weekday': return `${DAYS_SHORT[date.getDay()]}, ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
    default: return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${yyyy}`;
  }
}

/** "20 Aug 2026, 09:45" */
export function formatDateTime(d, style = 'medium') {
  const date = toDate(d);
  if (!date) return '—';
  return `${formatDate(date, style)}, ${formatTime(date)}`;
}

/** "09:45 AM" (24h with {h24:true}) */
export function formatTime(d, { h24 = false } = {}) {
  const date = toDate(d);
  if (!date) return '—';
  const hh = date.getHours();
  const mm = String(date.getMinutes()).padStart(2, '0');
  if (h24) return `${String(hh).padStart(2, '0')}:${mm}`;
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${String(h12).padStart(2, '0')}:${mm} ${ampm}`;
}

/** "3 days ago" / "in 2 hours" — relative to `now` (default: the demo clock). */
export const DEMO_NOW = new Date('2026-08-20T09:30:00');
export function relativeTime(d, now = DEMO_NOW) {
  const date = toDate(d);
  if (!date) return '—';
  const diff = date.getTime() - toDate(now).getTime();
  const abs = Math.abs(diff);
  const future = diff > 0;
  const units = [
    [31536000000, 'year'], [2592000000, 'month'], [604800000, 'week'],
    [86400000, 'day'], [3600000, 'hour'], [60000, 'minute'], [1000, 'second'],
  ];
  for (const [ms, name] of units) {
    if (abs >= ms) {
      const v = Math.floor(abs / ms);
      const label = `${v} ${name}${v > 1 ? 's' : ''}`;
      return future ? `in ${label}` : `${label} ago`;
    }
  }
  return 'just now';
}

/** "Meera Krishnan" -> "MK" */
export function initials(name, max = 2) {
  return String(name || '')
    .replace(/^(Dr|Mr|Mrs|Ms|Prof|Sister)\.?\s+/i, '')
    .split(/\s+/).filter(Boolean).slice(0, max)
    .map((w) => w[0]).join('').toUpperCase();
}

const TONE_MAP = {
  success: ['active', 'paid', 'approved', 'completed', 'present', 'success', 'verified', 'resolved', 'delivered', 'passed', 'pass',
    'published', 'on track', 'available', 'in use', 'confirmed', 'admitted', 'converted', 'good', 'excellent', 'connected',
    'healthy', 'online', 'on duty', 'fit', 'qualified', 'returned', 'joined', 'posted', 'accepted', 'graded', 'checked out',
    'in stock', 'granted', 'attended', 'promoted', 'disbursed', 'processed', 'closed',
    'on time', 'on file', 'within sla', 'informed', 'returned to class'],
  warning: ['pending', 'partial', 'partially paid', 'in progress', 'under review', 'pending approval', 'on leave', 'half day',
    'at risk', 'low stock', 'maintenance', 'waiting', 'idle', 'submitted', 'notice period', 'planned',
    'partially occupied', 'needs improvement', 'needs repair', 'under observation', 'under investigation', 'in transit',
    'clearance pending', 'renewed', 'reserved', 'late', 'shortlisted', 'interviewing', 'open', 'unclaimed', 'ongoing',
    'unassigned', 'mandatory', 'sent home', 'substituted', 'due'],
  danger: ['overdue', 'rejected', 'failed', 'absent', 'unpaid', 'cancelled', 'suspended', 'critical', 'high',
    'expired', 'lost', 'damaged', 'blacklisted', 'out of stock', 'over budget', 'breached', 'escalated', 'offline',
    'out of service', 'not qualified', 'fail', 'missed', 'no show', 'defaulter', 'locked', 'poor', 'disposed', 'terminated',
    'missing', 'not submitted', 'sla breached'],
  info: ['new', 'issued', 'assigned', 'contacted', 'offered', 'applied', 'screening', 'in process', 'in store', 'upcoming',
    'moderate', 'medium', 'requested', 'transferred', 'archived', 'alumni', 'inside', 'on route', 'received', 'scheduled'],
  brand: ['featured', 'primary', 'default', 'starred', 'recommended', 'class teacher', 'rte', 'scholarship'],
  /* Draft / Inactive / Optional are lifecycle resting states, not problems — they stay neutral. */
  neutral: ['draft', 'inactive', 'optional', 'not applicable', 'n/a', 'none', 'unknown'],
};

/** Map a status string to a tone token: success | warning | danger | info | brand | neutral */
export function toneForStatus(status) {
  const s = String(status || '').toLowerCase().trim();
  for (const [tone, list] of Object.entries(TONE_MAP)) if (list.includes(s)) return tone;
  return 'neutral';
}

/** Trigger a client-side file download. */
export function download(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename, style: { display: 'none' } });
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); unmount(a); }, 0);
}

/** Convert an array of objects to CSV text. */
export function toCsv(rows, columns) {
  const cols = columns || (rows.length ? Object.keys(rows[0]).map((k) => ({ key: k, label: k })) : []);
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = cols.map((c) => esc(c.label || c.key)).join(',');
  const body = rows.map((r) => cols.map((c) => esc(typeof c.value === 'function' ? c.value(r) : r[c.key])).join(',')).join('\n');
  return `${head}\n${body}`;
}

/** Open a print window containing a copy of `node`. */
export function printNode(node, title = 'Springdale ERP') {
  const win = window.open('', '_blank', 'width=1024,height=768');
  if (!win) { notify({ title: 'Pop-up blocked', text: 'Allow pop-ups to print this page.', tone: 'warning' }); return; }
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((l) => `<link rel="stylesheet" href="${l.href}">`).join('');
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  win.document.write(`<!doctype html><html data-theme="${theme}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>${styles}
    <style>body{overflow:auto;padding:24px;background:#fff}</style></head><body>${node.outerHTML}</body></html>`);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 350);
}

/** Copy text to the clipboard and toast. */
export function copyToClipboard(text, message = 'Copied to clipboard') {
  if (navigator.clipboard) navigator.clipboard.writeText(String(text)).then(() => notify({ title: message, tone: 'success' }));
  else notify({ title: 'Clipboard unavailable', tone: 'warning' });
}

/** Debounce a function. */
export function debounce(fn, ms = 200) {
  let t;
  return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
}

/** A stable numeric hue bucket (1..6) for avatar colouring. */
export function hueFor(str) {
  let hash = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return (hash % 6) + 1;
}

/* ============================================================ primitives = */

/**
 * Card container.
 * Card({className, pad, raised, flat, accent, onClick}, ...children)
 */
export function Card(props = {}, ...children) {
  const { className, pad = false, raised = false, flat = false, accent = false, ...rest } = props;
  return h('div', {
    className: ['card', pad && 'card-pad', raised && 'card-raised', flat && 'card-flat',
      accent && 'card-accent', rest.onClick && 'card-interactive', className].filter(Boolean).join(' '),
    ...rest,
  }, ...children);
}

/**
 * Card with a header bar.
 * SectionCard({title, subtitle, icon, actions, footer, bodyClass, flush}, ...body)
 */
export function SectionCard({ title, subtitle, icon: ico, actions, footer, bodyClass, flush = false, className, ...rest } = {}, ...body) {
  const head = (title || subtitle || actions || ico) ? h('div', { className: 'card-head' },
    ico && Icon(ico, 16),
    h('div', { className: 'card-head-titles' },
      title && h('div', { className: 'card-title' }, title),
      subtitle && h('div', { className: 'card-sub' }, subtitle)),
    actions && h('div', { className: 'card-head-actions' }, actions)) : null;
  return h('div', { className: ['card', className].filter(Boolean).join(' '), ...rest },
    head,
    h('div', { className: ['card-body', flush && 'card-body-flush', bodyClass].filter(Boolean).join(' ') }, ...body),
    footer && h('div', { className: 'card-foot' }, footer));
}

/**
 * KPI / stat tile.
 * StatCard({label, value, delta, deltaLabel, deltaDir, trend[], icon, tone, hero, onClick, footer})
 * `trend` is an array of numbers rendered as a sparkline.
 */
/* Metrics where a FALLING number is good news. Used to colour deltas correctly
   without every call site having to remember; pass `invert` to override. */
const LOWER_IS_BETTER = [
  'outstanding', 'overdue', 'arrear', 'unpaid', 'due', 'defaulter', 'dues',
  'at risk', 'risk', 'dropout', 'attrition', 'absent', 'absence', 'leave taken',
  'delayed', 'delay', 'late', 'breakdown', 'out of service', 'off road',
  'complaint', 'grievance', 'incident', 'escalation', 'alert', 'backlog',
  'pending', 'awaiting', 'unresolved', 'open ticket', 'fine', 'penalty',
  'lost', 'damaged', 'expiring', 'expired', 'shortage', 'reorder', 'vacancy',
  'expense', 'cost', 'spend', 'deficit', 'rejected', 'failed', 'failure',
  'below', 'shortfall', 'no-show', 'cancellation', 'cancelled', 'refund',
];
function isLowerBetter(label) {
  if (!label) return false;
  const s = String(label).toLowerCase();
  return LOWER_IS_BETTER.some((k) => s.includes(k));
}

/**
 * StatCard. `invert: true` marks a metric where DOWN is good — fee outstanding,
 * students at risk, attrition, trips delayed. Inferred from the label when not
 * given. The arrow still points the way the number moved; only the colour flips.
 */
export function StatCard({ label, value, delta, deltaLabel, deltaDir, trend, icon: ico, tone = 'brand',
  invert, hero = false, onClick, footer, route, className } = {}) {
  const dir = deltaDir || (delta == null ? null : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat');
  const inv = invert === undefined ? isLowerBetter(label) : Boolean(invert);
  const mood = dir == null || dir === 'flat' ? 'flat'
    : (dir === 'up') !== inv ? 'good' : 'bad';
  const node = h('div', {
    className: ['stat', onClick || route ? 'is-clickable' : '', className].filter(Boolean).join(' '),
    onClick: route ? () => { location.hash = navHref(route); } : onClick,
  },
    h('div', { className: 'stat-top' },
      h('div', { className: 'stat-label' }, label),
      ico && h('div', { className: 'stat-icon', dataset: { tone }, html: icon(ico, 16) })),
    h('div', { className: ['stat-value', hero && 'is-hero'].filter(Boolean).join(' ') }, value),
    (delta != null || deltaLabel || footer) && h('div', { className: 'stat-foot' },
      delta != null && h('span', { className: 'stat-delta', dataset: { dir, mood } },
        Icon(dir === 'up' ? 'trending-up' : dir === 'down' ? 'trending-down' : 'trending-flat', 13),
        typeof delta === 'number' ? `${delta > 0 ? '+' : ''}${delta}%` : delta),
      deltaLabel && h('span', { className: 'stat-delta-note' }, deltaLabel),
      footer),
    trend && trend.length ? h('div', { className: 'stat-spark', ref: (n) => { requestAnimationFrame(() => renderSpark(n, trend, mood)); } }) : null);
  return node;
}

function renderSpark(node, values, mood) {
  // Deferred import avoids a hard cycle between ui.js and charts.js.
  import('./charts.js').then(({ sparkline }) => {
    if (!node.isConnected) return;
    node.innerHTML = '';
    node.appendChild(sparkline(values, {
      height: 34,
      color: mood === 'bad' ? 'var(--chart-critical)' : 'var(--chart-1)',
      fill: true,
    }));
  });
}

/** Status chip. Badge(text, {tone, icon, dot, outline, size}) */
export function Badge(text, { tone, icon: ico, dot = false, outline = false, size } = {}) {
  const t = tone || toneForStatus(text);
  return h('span', {
    className: ['badge', outline && 'is-outline', size === 'lg' && 'is-lg'].filter(Boolean).join(' '),
    dataset: { tone: t },
  },
    dot && h('span', { className: 'badge-dot' }),
    ico && Icon(ico, 12),
    text);
}

/** Alias with the same signature — reads better next to a status column. */
export const StatusChip = Badge;

/** Pill(text, {active, onClose, onClick, icon}) */
export function Pill(text, { active = false, onClose, onClick, icon: ico } = {}) {
  return h('span', { className: ['pill', active && 'is-active'].filter(Boolean).join(' '), onClick },
    ico && Icon(ico, 13),
    text,
    onClose && h('button', {
      className: 'pill-close', attrs: { 'aria-label': 'Remove' },
      onClick: (e) => { e.stopPropagation(); onClose(e); },
      html: icon('x', 11),
    }));
}

/** Tag(text, {icon}) — a quieter Pill. */
export function Tag(text, { icon: ico } = {}) {
  return h('span', { className: 'tag' }, ico && Icon(ico, 11), text);
}

/**
 * Avatar(name, {src, size:'xs|sm|md|lg|xl|2xl', status, ring, hue})
 */
export function Avatar(name, { src, size = 'md', status, ring = false, hue, initials: init } = {}) {
  return h('span', {
    className: ['avatar', ring && 'avatar-ring'].filter(Boolean).join(' '),
    dataset: { size, hue: hue || hueFor(name) },
    attrs: { title: name || '' },
  },
    src ? h('img', { src, alt: name || '' }) : (init || initials(name)),
    status && h('span', { className: 'avatar-status', dataset: { state: status } }));
}

/** AvatarStack(names[], {size, max}) */
export function AvatarStack(names = [], { size = 'sm', max = 4 } = {}) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return h('span', { className: 'avatar-stack' },
    shown.map((n) => Avatar(typeof n === 'string' ? n : n.name, { size, src: n.src })),
    rest > 0 && h('span', {
      className: 'avatar avatar-more', dataset: { size },
      attrs: { title: names.slice(max).map((n) => (typeof n === 'string' ? n : n.name)).join(', ') },
    }, `+${rest}`));
}

/** Identity(name, meta, {size, src, status}) — avatar + two lines, used in tables. */
export function Identity(name, meta, { size = 'sm', src, status, onClick } = {}) {
  return h('div', { className: 'identity', onClick, style: onClick ? { cursor: 'pointer' } : null },
    Avatar(name, { size, src, status }),
    h('div', { className: 'identity-text' },
      h('div', { className: 'identity-name' }, name),
      meta && h('div', { className: 'identity-meta' }, meta)));
}

/**
 * Button(label, {variant, size, icon, iconRight, loading, disabled, onClick, block, route, type})
 * variant: primary | secondary | ghost | subtle | danger | success | link
 */
export function Button(label, opts = {}) {
  const { variant = 'secondary', size = 'md', icon: ico, iconRight, loading = false,
    disabled = false, onClick, block = false, route, href, className, type = 'button', ...rest } = opts;
  const props = {
    className: ['btn', `btn-${variant}`, loading && 'is-loading', className].filter(Boolean).join(' '),
    dataset: { size, block: block ? 'true' : null },
    disabled: disabled || loading,
    onClick: route ? (e) => { e.preventDefault(); location.hash = navHref(route); } : onClick,
    ...rest,
  };
  if (route || href) {
    return h('a', { ...props, href: href || navHref(route) },
      ico && Icon(ico, size === 'sm' ? 13 : 15), label, iconRight && Icon(iconRight, size === 'sm' ? 13 : 15));
  }
  return h('button', { ...props, type },
    ico && Icon(ico, size === 'sm' ? 13 : 15), label, iconRight && Icon(iconRight, size === 'sm' ? 13 : 15));
}

/** ButtonGroup(buttons[]) */
export function ButtonGroup(buttons = []) {
  return h('div', { className: 'btn-group' }, buttons);
}

/** IconButton(iconName, {label, size, onClick, active, bordered, route, tone}) */
export function IconButton(name, { label, size = 'md', onClick, active = false, bordered = false, route, className, ...rest } = {}) {
  const props = {
    className: ['icon-btn', active && 'is-active', bordered && 'is-bordered', className].filter(Boolean).join(' '),
    dataset: { size },
    attrs: { 'aria-label': label || name, title: label || '' },
    onClick: route ? () => { location.hash = navHref(route); } : onClick,
    html: icon(name, size === 'sm' ? 14 : 16),
    ...rest,
  };
  return h('button', props);
}

/** Keyboard hint: Kbd('Ctrl','K') */
export function Kbd(...keys) {
  return h('span', { className: 'kbd-hint' }, keys.map((k) => h('kbd', { className: 'kbd' }, k)));
}

/* ============================================================ navigation = */

/**
 * Tabs(items, onChange, {active, className, size})
 * items: [{id, label, icon, count, disabled}]
 * Returns the tab bar element; it manages its own active styling.
 */
export function Tabs(items = [], onChange, { active, className } = {}) {
  let current = active || (items[0] && items[0].id);
  const bar = h('div', { className: ['tabs', className].filter(Boolean).join(' '), attrs: { role: 'tablist' } });
  const render = () => {
    bar.innerHTML = '';
    for (const it of items) {
      const btn = h('button', {
        className: ['tab', it.id === current && 'is-active'].filter(Boolean).join(' '),
        attrs: { role: 'tab', 'aria-selected': it.id === current ? 'true' : 'false' },
        disabled: it.disabled,
        onClick: () => { if (it.id === current) return; current = it.id; render(); if (onChange) onChange(it.id, it); },
      },
        it.icon && Icon(it.icon, 14),
        it.label,
        it.count != null && h('span', { className: 'tab-count' }, formatNumber(it.count)));
      bar.appendChild(btn);
    }
  };
  render();
  bar.setActive = (id) => { current = id; render(); };
  bar.getActive = () => current;
  return bar;
}

/** SegmentedControl(options, onChange, {active}) — options: [{id,label,icon}] or strings */
export function SegmentedControl(options = [], onChange, { active, className } = {}) {
  const opts = options.map((o) => (typeof o === 'string' ? { id: o, label: o } : o));
  let current = active || (opts[0] && opts[0].id);
  const wrap = h('div', { className: ['segmented', className].filter(Boolean).join(' ') });
  const render = () => {
    wrap.innerHTML = '';
    for (const o of opts) {
      wrap.appendChild(h('button', {
        className: ['segmented-opt', o.id === current && 'is-active'].filter(Boolean).join(' '),
        onClick: () => { if (o.id === current) return; current = o.id; render(); if (onChange) onChange(o.id, o); },
      }, o.icon && Icon(o.icon, 13), o.label));
    }
  };
  render();
  wrap.setActive = (id) => { current = id; render(); };
  wrap.getActive = () => current;
  return wrap;
}

/** Toolbar(...children) — a flex row that wraps. */
export function Toolbar(...children) {
  return h('div', { className: 'toolbar' }, ...children);
}

export function ToolbarSep() { return h('span', { className: 'toolbar-sep' }); }

/** SearchInput({placeholder, value, onInput, onEnter, width}) */
export function SearchInput({ placeholder = 'Search…', value = '', onInput, onEnter, width, size, className } = {}) {
  let input;
  const clear = h('button', {
    className: 'search-clear', attrs: { 'aria-label': 'Clear' },
    style: { display: value ? 'grid' : 'none' },
    onClick: () => { input.value = ''; clear.style.display = 'none'; if (onInput) onInput(''); input.focus(); },
    html: icon('x', 12),
  });
  input = h('input', {
    className: 'input', type: 'search', placeholder, value, dataset: { size },
    onInput: debounce((e) => { clear.style.display = e.target.value ? 'grid' : 'none'; if (onInput) onInput(e.target.value); }, 180),
    onKeyDown: (e) => { if (e.key === 'Enter' && onEnter) onEnter(e.target.value); },
  });
  return h('div', {
    className: ['search-input', className].filter(Boolean).join(' '),
    style: width ? { flex: `0 1 ${width}` } : null,
  },
    Icon('search', 15, { className: 'search-ico' }),
    input, clear);
}

/**
 * FilterBar({filters, onChange, actions, chips, saved})
 * filters: [{id, label, type:'select'|'search'|'date'|'segment', options:[{value,label}], value, placeholder}]
 * Calls onChange(id, value, allValues).
 */
export function FilterBar({ filters = [], onChange, actions, saved = [], className } = {}) {
  const values = {};
  for (const f of filters) values[f.id] = f.value != null ? f.value : (f.type === 'select' ? 'all' : '');
  const emit = (id, v) => { values[id] = v; if (onChange) onChange(id, v, { ...values }); };

  const controls = filters.map((f) => {
    if (f.type === 'search') {
      return SearchInput({ placeholder: f.placeholder || f.label, value: values[f.id], width: f.width || '260px', onInput: (v) => emit(f.id, v) });
    }
    if (f.type === 'date') {
      return h('input', { className: 'input', type: 'date', value: values[f.id], style: { width: '150px' }, onChange: (e) => emit(f.id, e.target.value) });
    }
    if (f.type === 'segment') {
      return SegmentedControl(f.options, (v) => emit(f.id, v), { active: values[f.id] });
    }
    const opts = [{ value: 'all', label: f.allLabel || `All ${f.label}` }].concat(
      (f.options || []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o)));
    return h('select', {
      className: 'select', style: { width: f.width || 'auto', minWidth: '130px' },
      value: values[f.id],
      onChange: (e) => emit(f.id, e.target.value),
    }, opts.map((o) => h('option', { value: o.value }, o.label)));
  });

  return h('div', { className: ['filterbar', className].filter(Boolean).join(' ') },
    controls,
    saved.length ? h('div', { className: 'filterbar-chips' },
      saved.map((s) => Pill(s.label, { active: s.active, onClick: s.onClick }))) : null,
    h('span', { className: 'spacer' }),
    actions);
}

/** Accordion(items, {multi, openIds}) — items: [{id,title,icon,render()|body,badge}] */
export function Accordion(items = [], { multi = true, openIds = [] } = {}) {
  const wrap = h('div', { className: 'accordion' });
  const open = new Set(openIds);
  const render = () => {
    wrap.innerHTML = '';
    for (const it of items) {
      const isOpen = open.has(it.id);
      wrap.appendChild(h('div', { className: 'acc-item', dataset: { open: String(isOpen) } },
        h('button', {
          className: 'acc-head',
          onClick: () => {
            if (open.has(it.id)) open.delete(it.id);
            else { if (!multi) open.clear(); open.add(it.id); }
            render();
          },
        },
          it.icon && Icon(it.icon, 15),
          h('span', null, it.title),
          it.badge != null && Badge(String(it.badge), { tone: 'neutral' }),
          h('span', { className: 'acc-caret', html: icon('chevron-right', 15) })),
        h('div', { className: 'acc-body' }, isOpen ? (typeof it.render === 'function' ? it.render() : it.body) : null)));
    }
  };
  render();
  return wrap;
}

/** Collapse({title, open, children}) — a single disclosure. */
export function Collapse({ title, open = false, icon: ico } = {}, ...children) {
  return Accordion([{ id: 'c', title, icon: ico, body: frag(...children) }], { openIds: open ? ['c'] : [] });
}

/**
 * Stepper(steps, {current, vertical})
 * steps: [{id,label,description,state:'done'|'current'|'todo'|'rejected'}]
 */
export function Stepper(steps = [], { current = 0 } = {}) {
  const nodes = [];
  steps.forEach((s, i) => {
    const st = s.state || (i < current ? 'done' : i === current ? 'current' : 'todo');
    nodes.push(h('div', { className: ['step', `is-${st}`].filter(Boolean).join(' ') },
      h('div', { className: 'step-mark' },
        st === 'done' ? Icon('check', 13) : st === 'rejected' ? Icon('x', 13) : String(i + 1)),
      h('div', { className: 'step-text' },
        h('div', { className: 'step-label' }, s.label),
        s.description && h('div', { className: 'step-desc' }, s.description))));
    if (i < steps.length - 1) nodes.push(h('div', { className: ['step-bar', i < current && 'is-done'].filter(Boolean).join(' ') }));
  });
  return h('div', { className: 'stepper' }, nodes);
}

/** ApprovalTrail(entries) — a vertical approval chain built on Timeline. */
export function ApprovalTrail(entries = []) {
  return Timeline(entries.map((e) => ({
    title: e.label || e.title,
    meta: [e.by, e.date && formatDate(e.date)].filter(Boolean).join(' · '),
    text: e.note,
    icon: e.state === 'approved' ? 'check' : e.state === 'rejected' ? 'x' : 'clock',
    tone: e.state === 'approved' ? 'success' : e.state === 'rejected' ? 'danger' : 'warning',
  })));
}

/* ============================================================== display = */

/** Timeline(items) — items: [{title, meta, text, icon, tone, render()}] */
export function Timeline(items = []) {
  return h('div', { className: 'timeline' },
    items.map((it) => h('div', { className: 'tl-item' },
      h('div', { className: 'tl-rail' },
        h('div', { className: 'tl-dot', dataset: { tone: it.tone || 'default' }, html: icon(it.icon || 'circle-fallback', 12) }),
        h('div', { className: 'tl-line' })),
      h('div', { className: 'tl-body' },
        h('div', { className: 'tl-title' }, it.title),
        it.meta && h('div', { className: 'tl-meta' }, it.meta),
        it.text && h('div', { className: 'tl-text' }, it.text),
        it.render && it.render()))));
}

/** ActivityFeed(items) — items: [{name, text, time, icon, tone, avatar}] */
export function ActivityFeed(items = []) {
  return h('div', { className: 'feed' },
    items.map((it) => h('div', { className: 'feed-item' },
      it.avatar !== false ? Avatar(it.name || it.title, { size: 'sm' }) : h('div', { className: 'noti-ico', dataset: { tone: it.tone }, html: icon(it.icon || 'activity', 14) }),
      h('div', { className: 'feed-body' },
        h('div', { className: 'feed-text' },
          it.name && h('strong', null, it.name + ' '),
          it.text),
        it.time && h('div', { className: 'feed-time' }, it.time)))));
}

/** CommentThread(comments, {onSubmit}) — comments: [{author, time, text}] */
export function CommentThread(comments = [], { onSubmit, placeholder = 'Write a comment…' } = {}) {
  const list = h('div', { className: 'stack-2' },
    comments.map((c) => h('div', { className: 'comment' },
      Avatar(c.author, { size: 'sm' }),
      h('div', { className: 'comment-bubble' },
        h('div', { className: 'comment-head' },
          h('span', { className: 'comment-author' }, c.author),
          h('span', { className: 'comment-time' }, c.time)),
        h('div', { className: 'comment-text' }, c.text)))));
  let input;
  return h('div', { className: 'stack-3' },
    list,
    onSubmit && h('div', { className: 'row' },
      (input = h('input', { className: 'input', placeholder, onKeyDown: (e) => { if (e.key === 'Enter' && input.value.trim()) { onSubmit(input.value.trim()); input.value = ''; } } })),
      Button('Post', { variant: 'primary', onClick: () => { if (input.value.trim()) { onSubmit(input.value.trim()); input.value = ''; } } })));
}

/** DescriptionList(pairs, {cols}) — pairs: [[label, value]] or [{label, value}] */
export function DescriptionList(pairs = [], { cols = 1, className } = {}) {
  const list = pairs.map((p) => (Array.isArray(p) ? { label: p[0], value: p[1] } : p)).filter((p) => p && p.label != null);
  return h('dl', { className: ['dl', className].filter(Boolean).join(' '), dataset: { cols: String(cols) } },
    list.flatMap((p) => [h('dt', null, p.label), h('dd', null, p.value == null || p.value === '' ? '—' : p.value)]));
}

/** EmptyState({icon, title, text, action, tone}) */
export function EmptyState({ icon: ico = 'inbox', title = 'Nothing here yet', text, action, tone } = {}) {
  return h('div', { className: 'empty', dataset: { tone } },
    h('div', { className: 'empty-ico', html: icon(ico, 24) }),
    h('div', { className: 'empty-title' }, title),
    text && h('div', { className: 'empty-text' }, text),
    action);
}

/** ErrorState({title, text, onRetry}) */
export function ErrorState({ title = 'Could not load this view', text = 'An unexpected error occurred while preparing this page.', onRetry } = {}) {
  return EmptyState({
    icon: 'alert-triangle', tone: 'danger', title, text,
    action: onRetry ? Button('Try again', { variant: 'secondary', icon: 'refresh', onClick: onRetry }) : null,
  });
}

/** Skeleton({width, height, circle, className}) */
export function Skeleton({ width = '100%', height = 12, circle = false, className, radius } = {}) {
  return h('div', {
    className: ['skeleton', circle && 'skeleton-circle', className].filter(Boolean).join(' '),
    style: { width: typeof width === 'number' ? width + 'px' : width, height: typeof height === 'number' ? height + 'px' : height, borderRadius: radius },
  });
}

/** SkeletonText(lines) */
export function SkeletonText(lines = 3) {
  return h('div', { className: 'stack-2' },
    Array.from({ length: lines }, (_, i) => Skeleton({ height: 11, width: i === lines - 1 ? '62%' : '100%' })));
}

/** SkeletonTable({rows, cols}) */
export function SkeletonTable({ rows = 8, cols = 5 } = {}) {
  return h('div', { className: 'card-pad stack-3' },
    h('div', { className: 'row-3' }, Array.from({ length: cols }, () => Skeleton({ height: 10, width: `${Math.floor(100 / cols)}%` }))),
    Array.from({ length: rows }, () => h('div', { className: 'row-3' },
      Array.from({ length: cols }, (_, c) => Skeleton({ height: 14, width: c === 0 ? '24%' : `${Math.floor(70 / cols)}%` })))));
}

/** ProgressBar(value, {max, tone, size, label, showValue}) */
export function ProgressBar(value, { max = 100, tone, size, label, showValue = false } = {}) {
  const pct = Math.max(0, Math.min(100, (Number(value) / max) * 100));
  const t = tone || (pct >= 90 ? 'success' : pct >= 60 ? 'info' : pct >= 35 ? 'warning' : 'danger');
  const bar = h('div', { className: 'progress', dataset: { size }, attrs: { role: 'progressbar', 'aria-valuenow': String(Math.round(pct)) } },
    h('div', { className: 'progress-fill', dataset: { tone: t }, style: { width: pct + '%' } }));
  if (!label && !showValue) return bar;
  return h('div', { className: 'stack-1' },
    (label || showValue) && h('div', { className: 'metric-row' },
      h('span', { className: 'metric-k' }, label),
      showValue && h('span', { className: 'metric-v' }, `${pct.toFixed(0)}%`)),
    bar);
}

/** StackedProgressBar(segments) — segments: [{value, color, label}] */
export function StackedProgressBar(segments = []) {
  const total = segments.reduce((a, s) => a + Number(s.value || 0), 0) || 1;
  return h('div', { className: 'stacked-bar' },
    segments.map((s) => h('span', {
      style: { width: `${(s.value / total) * 100}%`, background: s.color || 'var(--chart-1)' },
      attrs: { title: `${s.label}: ${formatNumber(s.value)}` },
    })));
}

/** Rating(value, {max, size, showValue}) */
export function Rating(value, { max = 5, showValue = false } = {}) {
  return h('span', { className: 'row', style: { gap: '6px' } },
    h('span', { className: 'rating' },
      Array.from({ length: max }, (_, i) => h('span', {
        className: i < Math.round(value) ? '' : 'is-off',
        html: icon(i < Math.round(value) ? 'star-filled' : 'star', 15),
      }))),
    showValue && h('span', { className: 't-sm t-muted t-num' }, Number(value).toFixed(1)));
}

/** Callout({tone, icon, title}, ...children) */
export function Callout({ tone = 'info', icon: ico, title } = {}, ...children) {
  const defaultIco = { info: 'info', success: 'check-circle', warning: 'alert-triangle', danger: 'alert-circle', brand: 'sparkles' }[tone] || 'info';
  return h('div', { className: 'callout', dataset: { tone } },
    Icon(ico || defaultIco, 16),
    h('div', null, title && h('div', { className: 't-semibold' }, title), ...children));
}

/** PhotoGrid(items) — items: [{caption, icon}] (mock tiles, no external images) */
export function PhotoGrid(items = []) {
  return h('div', { className: 'photo-grid' },
    items.map((it) => h('div', { className: 'photo-tile' },
      Icon(it.icon || 'camera', 24),
      it.caption && h('div', { className: 'photo-cap' }, it.caption))));
}

/** FileList(files, {onDownload, onRemove}) — files: [{name, size, type, date}] */
export function FileList(files = [], { onDownload, onRemove } = {}) {
  const typeIcon = (t) => ({ pdf: 'file-text', jpg: 'camera', png: 'camera', doc: 'file-text', xls: 'table', csv: 'table' }[String(t || '').toLowerCase()] || 'file-text');
  return h('div', { className: 'file-list' },
    files.map((f) => h('div', { className: 'file-row' },
      h('div', { className: 'file-ico', html: icon(typeIcon(f.type), 16) }),
      h('div', { className: 'flex-1' },
        h('div', { className: 'file-name' }, f.name),
        h('div', { className: 'file-meta' }, [f.type && String(f.type).toUpperCase(), f.size, f.date && formatDate(f.date)].filter(Boolean).join(' · '))),
      f.status && Badge(f.status),
      onDownload && IconButton('download', { size: 'sm', label: 'Download', onClick: () => onDownload(f) }),
      onRemove && IconButton('trash', { size: 'sm', label: 'Remove', onClick: () => onRemove(f) }))));
}

/** NotificationItem(n, {onClick}) */
export function NotificationItem(n, { onClick } = {}) {
  return h('div', {
    className: ['noti', n.unread && 'is-unread'].filter(Boolean).join(' '),
    onClick: () => { if (onClick) onClick(n); if (n.route) location.hash = navHref(n.route); },
  },
    h('div', { className: 'noti-ico', dataset: { tone: n.tone || 'info' }, html: icon(n.icon || 'bell', 14) }),
    h('div', { className: 'noti-body' },
      h('div', { className: 'noti-title' }, n.title),
      n.text && h('div', { className: 'noti-text' }, n.text),
      n.time && h('div', { className: 'noti-time' }, n.time)));
}

/** MetricRow(label, value) — a compact key/value line. */
export function MetricRow(label, value, extra) {
  return h('div', { className: 'metric-row' },
    h('span', { className: 'metric-k' }, label),
    h('span', { className: 'row', style: { gap: '8px' } }, extra, h('span', { className: 'metric-v' }, value)));
}

/** RankList(items) — items: [{name, meta, value, avatar}] */
export function RankList(items = []) {
  return h('ul', { className: 'list-plain' },
    items.map((it, i) => h('li', null,
      h('span', { className: 'rank-num', dataset: { rank: String(i + 1) } }, String(i + 1)),
      it.avatar !== false && Avatar(it.name, { size: 'sm' }),
      h('div', { className: 'flex-1' },
        h('div', { className: 't-medium t-truncate' }, it.name),
        it.meta && h('div', { className: 't-sm t-muted t-truncate' }, it.meta)),
      h('span', { className: 't-semibold t-num' }, it.value))));
}

/* ============================================================ DataTable = */

/**
 * DataTable — the workhorse list component.
 *
 * DataTable({
 *   columns: [{ key, label, width, align:'left|right|center', sortable, sticky,
 *               filter:true|['a','b'], hidden, aggregate:'sum'|'avg'|'count'|fn,
 *               render(row, i) -> Node|string, value(row) -> sortable/exportable value,
 *               className }],
 *   rows: [...],
 *   rowKey: 'id',
 *   searchable: true, searchKeys: ['name','admissionNo'], searchPlaceholder,
 *   sortBy: 'name', sortDir: 'asc',
 *   paginate: true, pageSize: 25, pageSizes: [10,25,50,100],
 *   selectable: false, bulkActions: [{label, icon, tone, onClick(rows)}],
 *   rowActions: (row) => [{label, icon, tone, onClick}],
 *   onRowClick(row), expandable: (row) => Node, groupBy: 'className',
 *   footerAggregates: true, columnToggle: true, exportable: true, printable: true,
 *   toolbar: Node|[Node], loading, error, emptyState, responsive: true, stickyHeader: true,
 *   maxHeight: '520px', density
 * })
 * @returns {HTMLElement} card-like table element with .refresh(newRows) and .getRows()
 */
export function DataTable(config = {}) {
  const cfg = {
    columns: [], rows: [], rowKey: 'id',
    searchable: true, searchKeys: null, searchPlaceholder: 'Search…',
    sortBy: null, sortDir: 'asc',
    paginate: true, pageSize: 25, pageSizes: [10, 25, 50, 100, 250],
    selectable: false, bulkActions: [], rowActions: null,
    onRowClick: null, expandable: null, groupBy: null,
    footerAggregates: false, columnToggle: true, exportable: true, printable: false,
    toolbar: null, loading: false, error: null, emptyState: null,
    responsive: true, stickyHeader: true, maxHeight: null, exportName: 'export',
    ...config,
  };

  let rows = cfg.rows.slice();
  let sortKey = cfg.sortBy;
  let sortDir = cfg.sortDir;
  let page = 1;
  let pageSize = cfg.pageSize;
  let term = '';
  const colFilters = {};
  const hidden = new Set(cfg.columns.filter((c) => c.hidden).map((c) => c.key));
  const selected = new Set();
  const expanded = new Set();

  const root = h('div', { className: ['dt', 'card', cfg.responsive && 'is-responsive'].filter(Boolean).join(' ') });
  const toolbarEl = h('div', { className: 'filterbar' });
  const bulkEl = h('div', { style: { display: 'none' } });
  const scrollEl = h('div', {
    className: 'dt-scroll',
    style: cfg.maxHeight ? { maxHeight: cfg.maxHeight === 'none' ? 'none' : cfg.maxHeight } : null,
  });
  const cardsEl = h('div', { className: 'dt-cards' });
  const footEl = h('div', { className: 'dt-foot' });

  const visibleCols = () => cfg.columns.filter((c) => !hidden.has(c.key));
  const cellValue = (col, row) => (typeof col.value === 'function' ? col.value(row) : row[col.key]);

  /* ---------------------------------------------------------- pipeline */
  function processed() {
    let out = rows;
    if (term) {
      const q = term.toLowerCase();
      const keys = cfg.searchKeys || cfg.columns.map((c) => c.key);
      out = out.filter((r) => keys.some((k) => {
        const v = r[k];
        return v != null && typeof v !== 'object' && String(v).toLowerCase().includes(q);
      }));
    }
    for (const [key, val] of Object.entries(colFilters)) {
      if (!val || val === 'all') continue;
      out = out.filter((r) => String(r[key]) === String(val));
    }
    if (sortKey) {
      const col = cfg.columns.find((c) => c.key === sortKey);
      const mul = sortDir === 'desc' ? -1 : 1;
      out = out.slice().sort((a, b) => {
        const x = col ? cellValue(col, a) : a[sortKey];
        const y = col ? cellValue(col, b) : b[sortKey];
        if (x == null && y == null) return 0;
        if (x == null) return 1;
        if (y == null) return -1;
        if (typeof x === 'number' && typeof y === 'number') return (x - y) * mul;
        return String(x).localeCompare(String(y), 'en', { numeric: true, sensitivity: 'base' }) * mul;
      });
    }
    return out;
  }

  function pageRows(all) {
    if (!cfg.paginate) return all;
    const pages = Math.max(1, Math.ceil(all.length / pageSize));
    if (page > pages) page = pages;
    return all.slice((page - 1) * pageSize, page * pageSize);
  }

  /* --------------------------------------------------------- rendering */
  function renderToolbar() {
    toolbarEl.innerHTML = '';
    if (cfg.searchable) {
      toolbarEl.appendChild(SearchInput({
        placeholder: cfg.searchPlaceholder, value: term, width: '280px',
        onInput: (v) => { term = v; page = 1; renderAll(); },
      }));
    }
    for (const col of cfg.columns) {
      if (!col.filter) continue;
      const opts = Array.isArray(col.filter)
        ? col.filter
        : Array.from(new Set(rows.map((r) => r[col.key]).filter((v) => v != null && v !== ''))).sort();
      toolbarEl.appendChild(h('select', {
        className: 'select', style: { minWidth: '128px', maxWidth: '190px' },
        value: colFilters[col.key] || 'all',
        onChange: (e) => { colFilters[col.key] = e.target.value; page = 1; renderAll(); },
      },
        h('option', { value: 'all' }, `All ${col.label}`),
        opts.map((o) => h('option', { value: String(o) }, String(o)))));
    }
    if (cfg.toolbar) appendChild(toolbarEl, cfg.toolbar);
    toolbarEl.appendChild(h('span', { className: 'spacer' }));
    const tools = [];
    if (cfg.columnToggle) {
      tools.push(IconButton('columns', {
        label: 'Columns',
        onClick: (e) => openMenu(e.currentTarget, cfg.columns.map((c) => ({
          label: c.label, icon: hidden.has(c.key) ? 'eye-off' : 'eye', checked: !hidden.has(c.key),
          onClick: () => { if (hidden.has(c.key)) hidden.delete(c.key); else hidden.add(c.key); renderAll(); },
        })), { title: 'Toggle columns' }),
      }));
    }
    if (cfg.exportable) {
      tools.push(IconButton('download', {
        label: 'Export CSV',
        onClick: () => {
          const cols = visibleCols().map((c) => ({ key: c.key, label: c.label, value: c.value }));
          download(`${cfg.exportName}-${formatDate(new Date(), 'iso')}.csv`, toCsv(processed(), cols), 'text/csv;charset=utf-8');
          notify({ title: 'Export started', text: `${processed().length} rows exported to CSV.`, tone: 'success' });
        },
      }));
    }
    if (cfg.printable) tools.push(IconButton('print', { label: 'Print', onClick: () => printNode(root, cfg.exportName) }));
    if (tools.length) toolbarEl.appendChild(h('div', { className: 'row' }, tools));
  }

  function renderBulk() {
    if (!cfg.selectable || !selected.size) { bulkEl.style.display = 'none'; bulkEl.innerHTML = ''; return; }
    bulkEl.style.display = '';
    bulkEl.innerHTML = '';
    const chosen = rows.filter((r) => selected.has(r[cfg.rowKey]));
    bulkEl.appendChild(h('div', { className: 'bulkbar' },
      h('span', { className: 'bulkbar-count' }, `${selected.size} selected`),
      (cfg.bulkActions || []).map((a) => Button(a.label, {
        variant: a.tone === 'danger' ? 'danger' : 'secondary', size: 'sm', icon: a.icon,
        onClick: () => a.onClick(chosen),
      })),
      h('span', { className: 'spacer' }),
      Button('Clear', { variant: 'ghost', size: 'sm', onClick: () => { selected.clear(); renderAll(); } })));
  }

  function sortIcon(col) {
    if (sortKey !== col.key) return icon('chevrons-up-down', 12);
    return icon(sortDir === 'asc' ? 'chevron-up' : 'chevron-down', 12);
  }

  function renderTable(all, view) {
    scrollEl.innerHTML = '';
    const cols = visibleCols();
    const table = h('table', { className: 'dt-table' });

    /* head */
    const headRow = h('tr', null);
    if (cfg.selectable) {
      const allChecked = view.length > 0 && view.every((r) => selected.has(r[cfg.rowKey]));
      headRow.appendChild(h('th', { className: 'col-check' },
        h('label', { className: 'check' }, h('input', {
          type: 'checkbox', checked: allChecked,
          onChange: (e) => {
            if (e.target.checked) view.forEach((r) => selected.add(r[cfg.rowKey]));
            else view.forEach((r) => selected.delete(r[cfg.rowKey]));
            renderAll();
          },
        }))));
    }
    if (cfg.expandable) headRow.appendChild(h('th', { style: { width: '34px' } }));
    for (const col of cols) {
      headRow.appendChild(h('th', {
        className: [col.sortable !== false && 'is-sortable', sortKey === col.key && 'is-sorted',
          col.align === 'right' && 'a-right', col.align === 'center' && 'a-center',
          col.sticky && 'is-sticky-col'].filter(Boolean).join(' '),
        style: col.width ? { width: typeof col.width === 'number' ? col.width + 'px' : col.width } : null,
        onClick: col.sortable === false ? null : () => {
          if (sortKey === col.key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
          else { sortKey = col.key; sortDir = 'asc'; }
          renderAll();
        },
      }, h('span', { className: 'dt-th-inner' }, col.label,
        col.sortable !== false && h('span', { className: 'dt-sort-ico', html: sortIcon(col) }))));
    }
    if (cfg.rowActions) headRow.appendChild(h('th', { className: 'col-actions' }));
    table.appendChild(h('thead', null, headRow));

    /* body */
    const tbody = h('tbody', null);
    let lastGroup = null;
    const colSpan = cols.length + (cfg.selectable ? 1 : 0) + (cfg.expandable ? 1 : 0) + (cfg.rowActions ? 1 : 0);

    view.forEach((row, i) => {
      if (cfg.groupBy) {
        const g = typeof cfg.groupBy === 'function' ? cfg.groupBy(row) : row[cfg.groupBy];
        if (g !== lastGroup) {
          lastGroup = g;
          tbody.appendChild(h('tr', { className: 'dt-group-row' }, h('td', { attrs: { colspan: colSpan } }, String(g))));
        }
      }
      const key = row[cfg.rowKey];
      const tr = h('tr', {
        className: [cfg.onRowClick && 'is-clickable', selected.has(key) && 'is-selected', expanded.has(key) && 'is-expanded'].filter(Boolean).join(' '),
        onClick: cfg.onRowClick ? (e) => { if (e.target.closest('button,a,input,select,label')) return; cfg.onRowClick(row, i); } : null,
      });
      if (cfg.selectable) {
        tr.appendChild(h('td', { className: 'col-check' },
          h('label', { className: 'check' }, h('input', {
            type: 'checkbox', checked: selected.has(key),
            onChange: (e) => { if (e.target.checked) selected.add(key); else selected.delete(key); renderAll(); },
          }))));
      }
      if (cfg.expandable) {
        tr.appendChild(h('td', null, h('button', {
          className: 'icon-btn', dataset: { size: 'sm' },
          attrs: { 'aria-label': 'Expand row' },
          onClick: (e) => { e.stopPropagation(); if (expanded.has(key)) expanded.delete(key); else expanded.add(key); renderAll(); },
          html: icon(expanded.has(key) ? 'chevron-down' : 'chevron-right', 14),
        })));
      }
      cols.forEach((col, ci) => {
        const content = col.render ? col.render(row, i) : cellValue(col, row);
        tr.appendChild(h('td', {
          className: [ci === 0 && 'is-primary', col.align === 'right' && 'a-right', col.align === 'center' && 'a-center',
            col.numeric && 'is-num', col.sticky && 'is-sticky-col', col.className].filter(Boolean).join(' '),
        }, content == null || content === '' ? '—' : content));
      });
      if (cfg.rowActions) {
        tr.appendChild(h('td', { className: 'col-actions' }, IconButton('more-horizontal', {
          size: 'sm', label: 'Row actions',
          onClick: (e) => { e.stopPropagation(); openMenu(e.currentTarget, cfg.rowActions(row) || []); },
        })));
      }
      tbody.appendChild(tr);
      if (cfg.expandable && expanded.has(key)) {
        tbody.appendChild(h('tr', { className: 'dt-expand-row' },
          h('td', { attrs: { colspan: colSpan } }, h('div', { className: 'dt-expand-inner' }, cfg.expandable(row)))));
      }
    });
    table.appendChild(tbody);

    /* footer aggregates */
    if (cfg.footerAggregates && all.length) {
      const ftr = h('tr', null);
      if (cfg.selectable) ftr.appendChild(h('td', null));
      if (cfg.expandable) ftr.appendChild(h('td', null));
      cols.forEach((col, ci) => {
        let content = ci === 0 ? 'Total' : '';
        if (col.aggregate) {
          const vals = all.map((r) => Number(cellValue(col, r)) || 0);
          if (typeof col.aggregate === 'function') content = col.aggregate(all);
          else if (col.aggregate === 'sum') content = col.format ? col.format(vals.reduce((a, b) => a + b, 0)) : formatNumber(vals.reduce((a, b) => a + b, 0));
          else if (col.aggregate === 'avg') content = col.format ? col.format(vals.reduce((a, b) => a + b, 0) / (vals.length || 1)) : formatNumber(vals.reduce((a, b) => a + b, 0) / (vals.length || 1), 1);
          else if (col.aggregate === 'count') content = formatNumber(all.length);
        }
        ftr.appendChild(h('td', { className: [col.align === 'right' && 'a-right', col.align === 'center' && 'a-center'].filter(Boolean).join(' ') }, content));
      });
      if (cfg.rowActions) ftr.appendChild(h('td', null));
      table.appendChild(h('tfoot', null, ftr));
    }

    scrollEl.appendChild(table);
  }

  function renderCards(view) {
    cardsEl.innerHTML = '';
    const cols = visibleCols();
    for (const row of view) {
      const card = h('div', {
        className: 'dt-card',
        onClick: cfg.onRowClick ? () => cfg.onRowClick(row) : null,
      });
      cols.forEach((col, i) => {
        const content = col.render ? col.render(row) : cellValue(col, row);
        if (i === 0) card.appendChild(h('div', { className: 'dt-card-head' }, content));
        else card.appendChild(h('div', { className: 'dt-card-row' },
          h('span', { className: 'dt-card-key' }, col.label),
          h('span', { className: 'dt-card-val' }, content == null || content === '' ? '—' : content)));
      });
      /* Card mode is the only view a phone ever sees, so it has to carry the
         row menu too — otherwise every per-row action is unreachable there. */
      if (cfg.rowActions) {
        card.appendChild(h('div', { className: 'dt-card-actions' }, IconButton('more-horizontal', {
          size: 'sm', label: 'Row actions',
          onClick: (e) => { e.stopPropagation(); openMenu(e.currentTarget, cfg.rowActions(row) || []); },
        })));
      }
      cardsEl.appendChild(card);
    }
  }

  function renderFoot(all) {
    footEl.innerHTML = '';
    if (!all.length) { footEl.style.display = 'none'; return; }
    footEl.style.display = '';
    const pages = Math.max(1, Math.ceil(all.length / pageSize));
    const from = cfg.paginate ? (page - 1) * pageSize + 1 : 1;
    const to = cfg.paginate ? Math.min(page * pageSize, all.length) : all.length;
    footEl.appendChild(h('span', { className: 'dt-count' }, `${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(all.length)}`));
    footEl.appendChild(h('span', { className: 'spacer' }));
    if (cfg.paginate) {
      footEl.appendChild(h('div', { className: 'row', style: { gap: '6px' } },
        h('span', { className: 't-sm t-muted' }, 'Rows'),
        h('select', {
          className: 'select', dataset: { size: 'sm' }, style: { width: '72px' }, value: String(pageSize),
          onChange: (e) => { pageSize = Number(e.target.value); page = 1; renderAll(); },
        }, cfg.pageSizes.map((s) => h('option', { value: String(s) }, String(s))))));
      const pager = h('div', { className: 'pager' });
      const goto = (p) => { page = Math.min(Math.max(1, p), pages); renderAll(); };
      pager.appendChild(h('button', { className: 'pager-btn', disabled: page === 1, onClick: () => goto(1), html: icon('chevrons-left', 14), attrs: { 'aria-label': 'First page' } }));
      pager.appendChild(h('button', { className: 'pager-btn', disabled: page === 1, onClick: () => goto(page - 1), html: icon('chevron-left', 14), attrs: { 'aria-label': 'Previous page' } }));
      const nums = [];
      const push = (p) => nums.push(p);
      if (pages <= 7) { for (let p = 1; p <= pages; p++) push(p); }
      else {
        push(1);
        if (page > 3) nums.push('…');
        for (let p = Math.max(2, page - 1); p <= Math.min(pages - 1, page + 1); p++) push(p);
        if (page < pages - 2) nums.push('…');
        push(pages);
      }
      for (const n of nums) {
        if (n === '…') pager.appendChild(h('span', { className: 'pager-gap' }, '…'));
        else pager.appendChild(h('button', { className: ['pager-btn', n === page && 'is-active'].filter(Boolean).join(' '), onClick: () => goto(n) }, String(n)));
      }
      pager.appendChild(h('button', { className: 'pager-btn', disabled: page === pages, onClick: () => goto(page + 1), html: icon('chevron-right', 14), attrs: { 'aria-label': 'Next page' } }));
      pager.appendChild(h('button', { className: 'pager-btn', disabled: page === pages, onClick: () => goto(pages), html: icon('chevrons-right', 14), attrs: { 'aria-label': 'Last page' } }));
      footEl.appendChild(pager);
    }
  }

  function renderAll() {
    root.innerHTML = '';
    if (cfg.loading) {
      root.appendChild(SkeletonTable({ rows: 8, cols: Math.min(6, cfg.columns.length || 5) }));
      return;
    }
    if (cfg.error) {
      root.appendChild(ErrorState({ text: String(cfg.error), onRetry: cfg.onRetry }));
      return;
    }
    renderToolbar();
    renderBulk();
    const all = processed();
    const view = pageRows(all);
    root.appendChild(toolbarEl);
    root.appendChild(bulkEl);
    if (!all.length) {
      root.appendChild(cfg.emptyState || EmptyState({
        icon: 'search', title: term ? 'No matching records' : 'No records yet',
        text: term ? `Nothing matched “${term}”. Try a different search or clear the filters.` : 'Records will appear here once they are added.',
      }));
      return;
    }
    renderTable(all, view);
    renderCards(view);
    renderFoot(all);
    root.appendChild(scrollEl);
    root.appendChild(cardsEl);
    root.appendChild(footEl);
  }

  renderAll();

  /** Replace the data set and re-render. */
  root.refresh = (newRows) => { if (newRows) rows = newRows.slice(); selected.clear(); page = 1; renderAll(); };
  /** The rows after search/filter/sort (not paginated). */
  root.getRows = () => processed();
  /** Currently selected row objects. */
  root.getSelected = () => rows.filter((r) => selected.has(r[cfg.rowKey]));
  root.setLoading = (v) => { cfg.loading = v; renderAll(); };
  root.setSearch = (v) => { term = v; page = 1; renderAll(); };
  return root;
}

/* ============================================================== overlays = */

let openMenuEl = null;

/**
 * openMenu(anchorEl, items, {align:'left'|'right', title})
 * items: [{label, icon, onClick, route, tone, checked, shortcut, disabled}]
 *        | {separator:true} | {header:true, label}
 */
export function openMenu(anchor, items = [], { align = 'right', title, minWidth } = {}) {
  closeMenu();
  const menu = h('div', { className: 'menu popover', style: minWidth ? { minWidth } : null });
  if (title) menu.appendChild(h('div', { className: 'menu-label' }, title));
  for (const it of items) {
    if (!it) continue;
    if (it.separator) { menu.appendChild(h('div', { className: 'menu-sep' })); continue; }
    if (it.header) { menu.appendChild(h('div', { className: 'menu-label' }, it.label)); continue; }
    menu.appendChild(h('button', {
      className: ['menu-item', it.checked && 'is-checked'].filter(Boolean).join(' '),
      dataset: { tone: it.tone || null },
      disabled: it.disabled,
      onClick: (e) => { closeMenu(); if (it.onClick) it.onClick(e); if (it.route) location.hash = navHref(it.route); },
    },
      it.icon && Icon(it.icon, 15),
      h('span', { className: 'flex-1' }, it.label),
      it.checked && Icon('check', 14),
      it.shortcut && h('span', { className: 'menu-right' }, it.shortcut)));
  }
  document.body.appendChild(menu);
  const rect = anchor.getBoundingClientRect();
  const mw = menu.offsetWidth;
  const mh = menu.offsetHeight;
  let left = align === 'right' ? rect.right - mw : rect.left;
  left = Math.max(8, Math.min(left, window.innerWidth - mw - 8));
  let top = rect.bottom + 6;
  if (top + mh > window.innerHeight - 8) top = Math.max(8, rect.top - mh - 6);
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  openMenuEl = menu;
  setTimeout(() => {
    document.addEventListener('click', outsideMenu, true);
    document.addEventListener('keydown', escMenu, true);
  }, 0);
  return menu;
}

function outsideMenu(e) { if (openMenuEl && !openMenuEl.contains(e.target)) closeMenu(); }
function escMenu(e) { if (e.key === 'Escape') closeMenu(); }

/** Close any open dropdown menu. */
export function closeMenu() {
  if (!openMenuEl) return;
  unmount(openMenuEl);
  openMenuEl = null;
  document.removeEventListener('click', outsideMenu, true);
  document.removeEventListener('keydown', escMenu, true);
}

/** A "..." button that opens a menu. items may be an array or a function. */
export function MenuButton(items, { icon: ico = 'more-horizontal', label = 'More actions', size = 'md', align = 'right' } = {}) {
  return IconButton(ico, {
    size, label,
    onClick: (e) => { e.stopPropagation(); openMenu(e.currentTarget, typeof items === 'function' ? items() : items, { align }); },
  });
}

/** Free-form floating panel anchored to an element. Returns close(). */
export function Popover(anchor, content, { align = 'right', width = 300 } = {}) {
  const pop = h('div', { className: 'popover', style: { width: typeof width === 'number' ? width + 'px' : width, padding: '12px' } }, content);
  document.body.appendChild(pop);
  const rect = anchor.getBoundingClientRect();
  let left = align === 'right' ? rect.right - pop.offsetWidth : rect.left;
  left = Math.max(8, Math.min(left, window.innerWidth - pop.offsetWidth - 8));
  pop.style.left = left + 'px';
  pop.style.top = Math.min(rect.bottom + 6, window.innerHeight - pop.offsetHeight - 8) + 'px';
  const close = () => { unmount(pop); document.removeEventListener('click', onDoc, true); document.removeEventListener('keydown', onKey, true); };
  const onDoc = (e) => { if (!pop.contains(e.target) && !anchor.contains(e.target)) close(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  setTimeout(() => { document.addEventListener('click', onDoc, true); document.addEventListener('keydown', onKey, true); }, 0);
  return close;
}

/**
 * Modal({title, subtitle, body, actions, size:'sm|md|lg|xl|full', icon, tone,
 *        closable, onClose, dismissOnScrim}) -> { close(), el }
 * `body` and `actions` may be a Node or a function receiving close().
 */
export function Modal({ title, subtitle, body, actions, size = 'md', icon: ico, tone = 'brand',
  closable = true, onClose, dismissOnScrim = true } = {}) {
  const scrim = h('div', { className: 'scrim' });
  const wrap = h('div', { className: 'modal-wrap' });
  const close = () => {
    unmount(scrim); unmount(wrap);
    document.removeEventListener('keydown', onKey, true);
    if (onClose) onClose();
  };
  const onKey = (e) => { if (e.key === 'Escape' && closable) { e.stopPropagation(); close(); } };

  const modal = h('div', {
    className: 'modal', dataset: { size },
    attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': title || 'Dialog' },
  },
    (title || ico) && h('div', { className: 'modal-head' },
      ico && h('div', { className: 'modal-icon', dataset: { tone }, html: icon(ico, 19) }),
      h('div', { className: 'flex-1' },
        title && h('div', { className: 'modal-title' }, title),
        subtitle && h('div', { className: 'modal-sub' }, subtitle)),
      closable && IconButton('x', { label: 'Close', size: 'sm', onClick: close })),
    h('div', { className: 'modal-body' }, typeof body === 'function' ? body(close) : body),
    actions && h('div', { className: 'modal-foot' }, h('span', { className: 'spacer' }),
      typeof actions === 'function' ? actions(close) : actions));

  wrap.appendChild(modal);
  if (dismissOnScrim && closable) wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
  document.body.appendChild(scrim);
  document.body.appendChild(wrap);
  document.addEventListener('keydown', onKey, true);
  const focusable = modal.querySelector('input,select,textarea');
  if (focusable) setTimeout(() => focusable.focus(), 60);
  return { close, el: modal };
}

/**
 * Drawer({side:'right'|'left', title, subtitle, body, actions, size:'md|lg|xl',
 *         onClose, flush, closable}) -> { close(), el }
 */
export function Drawer({ side = 'right', title, subtitle, body, actions, size = 'md',
  onClose, flush = false, closable = true } = {}) {
  const scrim = h('div', { className: 'scrim' });
  const close = () => {
    unmount(scrim); unmount(panel);
    document.removeEventListener('keydown', onKey, true);
    if (onClose) onClose();
  };
  const onKey = (e) => { if (e.key === 'Escape' && closable) { e.stopPropagation(); close(); } };
  const panel = h('aside', {
    className: 'drawer', dataset: { side, size },
    attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': title || 'Panel' },
  },
    h('div', { className: 'drawer-head' },
      h('div', { className: 'flex-1' },
        title && h('div', { className: 'modal-title' }, title),
        subtitle && h('div', { className: 'modal-sub' }, subtitle)),
      closable && IconButton('x', { label: 'Close', onClick: close })),
    h('div', { className: ['drawer-body', flush && 'drawer-body-flush'].filter(Boolean).join(' ') },
      typeof body === 'function' ? body(close) : body),
    actions && h('div', { className: 'drawer-foot' }, h('span', { className: 'spacer' }),
      typeof actions === 'function' ? actions(close) : actions));
  scrim.addEventListener('mousedown', () => { if (closable) close(); });
  document.body.appendChild(scrim);
  document.body.appendChild(panel);
  document.addEventListener('keydown', onKey, true);
  return { close, el: panel };
}

/**
 * ConfirmDialog({title, text, confirmLabel, cancelLabel, tone, onConfirm})
 * -> Promise<boolean>
 */
export function ConfirmDialog({ title = 'Are you sure?', text = 'This action cannot be undone.',
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'danger', icon: ico, onConfirm } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (v) => { if (settled) return; settled = true; resolve(v); };
    Modal({
      title, subtitle: text, size: 'sm', tone,
      icon: ico || (tone === 'danger' ? 'alert-triangle' : tone === 'warning' ? 'alert-circle' : 'help-circle'),
      body: null,
      onClose: () => finish(false),
      actions: (close) => frag(
        Button(cancelLabel, { variant: 'secondary', onClick: () => { finish(false); close(); } }),
        Button(confirmLabel, {
          variant: tone === 'danger' ? 'danger' : 'primary',
          onClick: async () => { finish(true); if (onConfirm) await onConfirm(); close(); },
        })),
    });
  });
}

/* ---------------------------------------------------------------- toasts */

let toastStack = null;
function ensureToastStack() {
  if (toastStack && toastStack.isConnected) return toastStack;
  toastStack = h('div', { className: 'toast-stack', attrs: { 'aria-live': 'polite' } });
  document.body.appendChild(toastStack);
  return toastStack;
}

/**
 * notify({title, text, tone:'success|danger|warning|info|brand', icon, duration, action})
 * -> { dismiss(), el }.  Alias: Toast().
 */
export function notify({ title, text, tone = 'info', icon: ico, duration = 4200, action } = {}) {
  const stack = ensureToastStack();
  const defaultIco = { success: 'check-circle', danger: 'x-circle', warning: 'alert-triangle', info: 'info', brand: 'sparkles' }[tone] || 'info';
  let timer;
  const dismiss = () => {
    clearTimeout(timer);
    node.classList.add('is-leaving');
    setTimeout(() => unmount(node), 170);
  };
  const node = h('div', { className: 'toast', dataset: { tone }, attrs: { role: 'status' } },
    h('div', { className: 'toast-ico', html: icon(ico || defaultIco, 16) }),
    h('div', { className: 'toast-body' },
      title && h('div', { className: 'toast-title' }, title),
      text && h('div', { className: 'toast-text' }, text),
      action && h('div', { className: 'mt-2' }, action)),
    h('button', { className: 'toast-close', attrs: { 'aria-label': 'Dismiss' }, onClick: () => dismiss(), html: icon('x', 14) }));
  node.addEventListener('mouseenter', () => clearTimeout(timer));
  node.addEventListener('mouseleave', () => { timer = setTimeout(dismiss, 1600); });
  stack.appendChild(node);
  if (duration) timer = setTimeout(dismiss, duration);
  return { dismiss, el: node };
}

export const Toast = notify;
export const toastSuccess = (title, text) => notify({ title, text, tone: 'success' });
export const toastError = (title, text) => notify({ title, text, tone: 'danger' });
export const toastInfo = (title, text) => notify({ title, text, tone: 'info' });
export const toastWarning = (title, text) => notify({ title, text, tone: 'warning' });

/** Handler for demo-only actions: shows an explanatory toast. */
export function mockAction(label = 'Action') {
  return () => notify({ title: `${label} — demo only`, text: 'This is a UI prototype; no data was changed.', tone: 'info', duration: 2600 });
}

/* ============================================================== form kit = */

/**
 * Field({label, required, hint, error, success, htmlFor, className}, control)
 * Wraps any control with a label, hint and validation text.
 */
export function Field({ label, required = false, hint, error, success, htmlFor, className } = {}, control) {
  return h('div', { className: ['field', className].filter(Boolean).join(' ') },
    label && h('label', { className: 'field-label', attrs: htmlFor ? { for: htmlFor } : null },
      label, required && h('span', { className: 'field-req' }, '*')),
    control,
    error ? h('div', { className: 'field-error' }, Icon('alert-circle', 12), error)
      : success ? h('div', { className: 'field-success' }, success)
        : hint ? h('div', { className: 'field-hint' }, hint) : null);
}

/** Input({type, value, placeholder, onInput, onChange, disabled, invalid, size, numeric, ...}) */
export function Input({ type = 'text', value = '', placeholder, onInput, onChange, disabled = false,
  invalid = false, size, numeric = false, id, name, min, max, step, maxLength, readOnly, className, prefix, suffix } = {}) {
  const input = h('input', {
    className: ['input', numeric && 'is-num', className].filter(Boolean).join(' '),
    type, value, placeholder, disabled, id, name, min, max, step, maxLength, readOnly,
    dataset: { size },
    attrs: invalid ? { 'aria-invalid': 'true' } : null,
    onInput: onInput ? (e) => onInput(e.target.value, e) : null,
    onChange: onChange ? (e) => onChange(e.target.value, e) : null,
  });
  if (!prefix && !suffix) return input;
  return h('div', { className: 'input-group' },
    prefix && h('span', { className: 'input-prefix' }, prefix),
    input,
    suffix && h('span', { className: 'input-addon' }, suffix));
}

/** Textarea({value, rows, placeholder, onInput, invalid, maxLength}) */
export function Textarea({ value = '', rows = 4, placeholder, onInput, onChange, disabled = false,
  invalid = false, maxLength, id, name } = {}) {
  return h('textarea', {
    className: 'textarea', rows, placeholder, disabled, maxLength, id, name,
    attrs: invalid ? { 'aria-invalid': 'true' } : null,
    value,
    onInput: onInput ? (e) => onInput(e.target.value, e) : null,
    onChange: onChange ? (e) => onChange(e.target.value, e) : null,
  }, value);
}

/**
 * Select({options, value, onChange, placeholder, disabled, size})
 * options: ['A','B'] or [{value,label,disabled}] or [{group, options:[...]}]
 */
export function Select({ options = [], value, onChange, placeholder, disabled = false, invalid = false, size, id, name, className } = {}) {
  const opt = (o) => (typeof o === 'string' || typeof o === 'number'
    ? h('option', { value: String(o), selected: String(o) === String(value) }, String(o))
    : h('option', { value: String(o.value), selected: String(o.value) === String(value), disabled: o.disabled }, o.label));
  return h('select', {
    className: ['select', className].filter(Boolean).join(' '),
    disabled, id, name, dataset: { size },
    attrs: invalid ? { 'aria-invalid': 'true' } : null,
    onChange: onChange ? (e) => onChange(e.target.value, e) : null,
  },
    placeholder && h('option', { value: '', selected: value == null || value === '' , disabled: true }, placeholder),
    options.map((o) => (o && o.group
      ? h('optgroup', { attrs: { label: o.group } }, o.options.map(opt))
      : opt(o))));
}

/**
 * Combobox({options, value, onChange, placeholder, searchable})
 * A custom single-select with a search box — no native <select> limitations.
 */
export function Combobox({ options = [], value, onChange, placeholder = 'Select…', searchable = true, width } = {}) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  let selected = opts.find((o) => String(o.value) === String(value)) || null;
  let open = false;
  let cursor = 0;
  let filter = '';

  const valueEl = h('span', { className: selected ? 'combo-value' : 'combo-placeholder' }, selected ? selected.label : placeholder);
  const panel = h('div', { className: 'combo-panel', style: { display: 'none' } });
  const root = h('div', { className: 'combo', style: width ? { width } : null },
    h('div', {
      className: 'combo-control', attrs: { tabindex: '0', role: 'combobox', 'aria-expanded': 'false' },
      onClick: () => toggle(!open),
      onKeyDown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(!open); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) toggle(true); else move(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
        else if (e.key === 'Escape') toggle(false);
      },
    }, valueEl, h('span', { className: 'combo-caret', html: icon('chevron-down', 15) })),
    panel);

  function visible() {
    const q = filter.toLowerCase();
    return q ? opts.filter((o) => String(o.label).toLowerCase().includes(q)) : opts;
  }
  function move(d) {
    const list = visible();
    cursor = Math.max(0, Math.min(list.length - 1, cursor + d));
    renderPanel();
  }
  function choose(o) {
    selected = o;
    valueEl.textContent = o.label;
    valueEl.className = 'combo-value';
    toggle(false);
    if (onChange) onChange(o.value, o);
  }
  function renderPanel() {
    panel.innerHTML = '';
    if (searchable) {
      panel.appendChild(h('div', { className: 'combo-search' },
        h('input', {
          className: 'input', dataset: { size: 'sm' }, placeholder: 'Search…', value: filter,
          onInput: (e) => { filter = e.target.value; cursor = 0; renderPanel(); },
          onKeyDown: (e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
            else if (e.key === 'Enter') { e.preventDefault(); const l = visible(); if (l[cursor]) choose(l[cursor]); }
            else if (e.key === 'Escape') toggle(false);
          },
          ref: (n) => setTimeout(() => n.focus(), 20),
        })));
    }
    const list = visible();
    if (!list.length) panel.appendChild(h('div', { className: 'combo-empty' }, 'No matches'));
    list.forEach((o, i) => panel.appendChild(h('div', {
      className: ['combo-opt', selected && String(selected.value) === String(o.value) && 'is-selected', i === cursor && 'is-cursor'].filter(Boolean).join(' '),
      onClick: () => choose(o),
    }, o.icon && Icon(o.icon, 14), h('span', { className: 'flex-1' }, o.label), h('span', { className: 'tick', html: icon('check', 14) }))));
  }
  function toggle(next) {
    open = next;
    panel.style.display = open ? '' : 'none';
    root.classList.toggle('is-open', open);
    root.querySelector('.combo-control').setAttribute('aria-expanded', String(open));
    if (open) { filter = ''; cursor = 0; renderPanel(); document.addEventListener('click', onDoc, true); }
    else document.removeEventListener('click', onDoc, true);
  }
  function onDoc(e) { if (!root.contains(e.target)) toggle(false); }

  root.getValue = () => (selected ? selected.value : null);
  root.setValue = (v) => { const o = opts.find((x) => String(x.value) === String(v)); if (o) choose(o); };
  return root;
}

/**
 * MultiSelect({options, values, onChange, placeholder, max})
 * Renders selected values as removable pills.
 */
export function MultiSelect({ options = [], values = [], onChange, placeholder = 'Select…', width } = {}) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  let chosen = values.slice().map(String);
  let open = false;
  let filter = '';

  const control = h('div', { className: 'combo-control', attrs: { tabindex: '0' }, onClick: () => toggle(!open) });
  const panel = h('div', { className: 'combo-panel', style: { display: 'none' } });
  const root = h('div', { className: 'combo', style: width ? { width } : null }, control,
    h('span', { className: 'combo-caret', html: icon('chevron-down', 15) }), panel);

  function renderControl() {
    control.innerHTML = '';
    if (!chosen.length) control.appendChild(h('span', { className: 'combo-placeholder' }, placeholder));
    for (const v of chosen) {
      const o = opts.find((x) => String(x.value) === v) || { label: v };
      control.appendChild(Pill(o.label, {
        onClose: (e) => { e.stopPropagation(); chosen = chosen.filter((c) => c !== v); renderControl(); renderPanel(); if (onChange) onChange(chosen.slice()); },
      }));
    }
  }
  function renderPanel() {
    panel.innerHTML = '';
    panel.appendChild(h('div', { className: 'combo-search' },
      h('input', {
        className: 'input', dataset: { size: 'sm' }, placeholder: 'Search…', value: filter,
        onInput: (e) => { filter = e.target.value; renderPanel(); },
      })));
    const q = filter.toLowerCase();
    const list = q ? opts.filter((o) => String(o.label).toLowerCase().includes(q)) : opts;
    if (!list.length) panel.appendChild(h('div', { className: 'combo-empty' }, 'No matches'));
    for (const o of list) {
      const on = chosen.includes(String(o.value));
      panel.appendChild(h('div', {
        className: ['combo-opt', on && 'is-selected'].filter(Boolean).join(' '),
        onClick: (e) => {
          e.stopPropagation();
          if (on) chosen = chosen.filter((c) => c !== String(o.value));
          else chosen = chosen.concat(String(o.value));
          renderControl(); renderPanel();
          if (onChange) onChange(chosen.slice());
        },
      }, h('span', { className: 'flex-1' }, o.label), h('span', { className: 'tick', html: icon('check', 14) })));
    }
  }
  function toggle(next) {
    open = next;
    panel.style.display = open ? '' : 'none';
    root.classList.toggle('is-open', open);
    if (open) { renderPanel(); document.addEventListener('click', onDoc, true); }
    else document.removeEventListener('click', onDoc, true);
  }
  function onDoc(e) { if (!root.contains(e.target)) toggle(false); }

  renderControl();
  root.getValue = () => chosen.slice();
  root.setValue = (v) => { chosen = v.map(String); renderControl(); };
  return root;
}

/** Checkbox(label, {checked, onChange, indeterminate, disabled}) */
export function Checkbox(label, { checked = false, onChange, indeterminate = false, disabled = false, name, value } = {}) {
  const input = h('input', {
    type: 'checkbox', checked, disabled, name, value,
    onChange: onChange ? (e) => onChange(e.target.checked, e) : null,
    ref: (n) => { n.indeterminate = indeterminate; },
  });
  return h('label', { className: 'check' }, input, label && h('span', null, label));
}

/** RadioGroup(options, {name, value, onChange, inline}) */
export function RadioGroup(options = [], { name = 'radio', value, onChange, inline = false } = {}) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return h('div', { className: inline ? 'row-4 row-wrap' : 'stack-2' },
    opts.map((o) => h('label', { className: 'radio-opt' },
      h('input', {
        type: 'radio', name, value: String(o.value), checked: String(o.value) === String(value), disabled: o.disabled,
        onChange: onChange ? () => onChange(o.value, o) : null,
      }),
      h('span', null, o.label))));
}

/** Switch(label, {checked, onChange, description}) */
export function Switch(label, { checked = false, onChange, description } = {}) {
  const track = h('span', { className: ['switch', checked && 'is-on'].filter(Boolean).join(' ') },
    h('input', {
      type: 'checkbox', checked,
      onChange: (e) => { track.classList.toggle('is-on', e.target.checked); if (onChange) onChange(e.target.checked, e); },
    }));
  if (!label && !description) return track;
  return h('label', { className: 'switch-wrap' }, track,
    h('span', null,
      label && h('span', { className: 't-medium' }, label),
      description && h('span', { className: 'field-hint', style: { display: 'block' } }, description)));
}

/**
 * DatePicker({value:'YYYY-MM-DD', onChange, placeholder, min, max}) — no deps.
 */
export function DatePicker({ value = '', onChange, placeholder = 'Select date', width = '180px' } = {}) {
  let selected = value ? new Date(value) : null;
  let viewDate = selected ? new Date(selected) : new Date('2026-08-01');
  let open = false;

  const input = h('input', {
    className: 'input', readOnly: true, placeholder,
    value: selected ? formatDate(selected) : '',
    onClick: () => toggle(!open),
  });
  const panel = h('div', { className: 'dp-panel', style: { display: 'none' } });
  const root = h('div', { className: 'datepick', style: { width } }, input, panel);

  function pick(d) {
    selected = d;
    input.value = formatDate(d);
    toggle(false);
    if (onChange) onChange(formatDate(d, 'iso'), d);
  }
  function renderPanel() {
    panel.innerHTML = '';
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    panel.appendChild(h('div', { className: 'dp-head' },
      IconButton('chevron-left', { size: 'sm', label: 'Previous month', onClick: () => { viewDate = new Date(y, m - 1, 1); renderPanel(); } }),
      h('div', { className: 'dp-title' }, `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m]} ${y}`),
      IconButton('chevron-right', { size: 'sm', label: 'Next month', onClick: () => { viewDate = new Date(y, m + 1, 1); renderPanel(); } })));
    const grid = h('div', { className: 'dp-grid' });
    for (const d of ['S', 'M', 'T', 'W', 'T', 'F', 'S']) grid.appendChild(h('div', { className: 'dp-dow' }, d));
    const first = new Date(y, m, 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const inMonth = d.getMonth() === m;
      const isToday = formatDate(d, 'iso') === formatDate(DEMO_NOW, 'iso');
      const isSel = selected && formatDate(d, 'iso') === formatDate(selected, 'iso');
      grid.appendChild(h('button', {
        className: ['dp-day', !inMonth && 'is-muted', isToday && 'is-today', isSel && 'is-selected'].filter(Boolean).join(' '),
        onClick: () => pick(d),
      }, String(d.getDate())));
    }
    panel.appendChild(grid);
    panel.appendChild(h('div', { className: 'dp-foot' },
      Button('Today', { variant: 'ghost', size: 'sm', onClick: () => pick(new Date(DEMO_NOW)) }),
      h('span', { className: 'spacer' }),
      Button('Clear', { variant: 'ghost', size: 'sm', onClick: () => { selected = null; input.value = ''; toggle(false); if (onChange) onChange('', null); } })));
  }
  function toggle(next) {
    open = next;
    panel.style.display = open ? '' : 'none';
    if (open) { renderPanel(); document.addEventListener('click', onDoc, true); }
    else document.removeEventListener('click', onDoc, true);
  }
  function onDoc(e) { if (!root.contains(e.target)) toggle(false); }

  root.getValue = () => (selected ? formatDate(selected, 'iso') : '');
  return root;
}

/** DateRangePicker({from, to, onChange}) — two DatePickers with a separator. */
export function DateRangePicker({ from = '', to = '', onChange } = {}) {
  const state_ = { from, to };
  const emit = () => onChange && onChange({ ...state_ });
  return h('div', { className: 'row' },
    DatePicker({ value: from, placeholder: 'From', width: '150px', onChange: (v) => { state_.from = v; emit(); } }),
    h('span', { className: 't-muted' }, '→'),
    DatePicker({ value: to, placeholder: 'To', width: '150px', onChange: (v) => { state_.to = v; emit(); } }));
}

/** TimePicker({value:'HH:MM', onChange, step}) — a select of quarter-hour slots. */
export function TimePicker({ value = '', onChange, step = 15, from = 6, to = 21, width = '130px' } = {}) {
  const options = [];
  for (let hh = from; hh <= to; hh++) {
    for (let mm = 0; mm < 60; mm += step) {
      const v = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      const ampm = hh >= 12 ? 'PM' : 'AM';
      const h12 = hh % 12 === 0 ? 12 : hh % 12;
      options.push({ value: v, label: `${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}` });
    }
  }
  return Select({ options, value, onChange, placeholder: 'Select time', className: null, ...(width ? {} : {}) });
}

/** FileUpload({label, hint, accept, multiple, onFiles}) — drag & drop mock. */
export function FileUpload({ label = 'Drop files here or click to browse',
  hint = 'PDF, JPG or PNG · up to 10 MB each', accept, multiple = true, onFiles } = {}) {
  const listEl = h('div', { className: 'file-list mt-3' });
  const files = [];
  const addFiles = (fileList) => {
    for (const f of Array.from(fileList || [])) {
      files.push({ name: f.name, size: `${(f.size / 1024).toFixed(0)} KB`, type: (f.name.split('.').pop() || '').toLowerCase(), date: new Date() });
    }
    renderList();
    if (onFiles) onFiles(files.slice());
  };
  const renderList = () => {
    listEl.innerHTML = '';
    if (!files.length) return;
    listEl.appendChild(FileList(files, { onRemove: (f) => { const i = files.indexOf(f); if (i >= 0) files.splice(i, 1); renderList(); } }));
  };
  const input = h('input', { type: 'file', accept, multiple, style: { display: 'none' }, onChange: (e) => addFiles(e.target.files) });
  const zone = h('div', {
    className: 'upload',
    onClick: () => input.click(),
    onDragOver: (e) => { e.preventDefault(); zone.classList.add('is-drag'); },
    onDragLeave: () => zone.classList.remove('is-drag'),
    onDrop: (e) => { e.preventDefault(); zone.classList.remove('is-drag'); addFiles(e.dataTransfer.files); },
  },
    Icon('upload', 26),
    h('div', { className: 't-medium' }, label),
    hint && h('div', { className: 'field-hint mt-1' }, hint));
  return h('div', null, zone, input, listEl);
}

/** FormSection({title, description}, ...fields) */
export function FormSection({ title, description } = {}, ...children) {
  return h('div', { className: 'form-section' },
    (title || description) && h('div', { className: 'form-section-head' },
      title && h('h3', null, title),
      description && h('div', { className: 'card-sub mt-1' }, description)),
    ...children);
}

/** FormGrid({cols}, ...fields) */
export function FormGrid({ cols = 2 } = {}, ...children) {
  return h('div', { className: 'form-grid', dataset: { cols: String(cols) } }, ...children);
}

/** FormActions(...buttons) */
export function FormActions(...children) {
  return h('div', { className: 'form-actions' }, ...children);
}

/**
 * unsavedGuard(formEl, {message}) — warns before leaving a dirty form.
 * Returns a release() function; call it after a successful save.
 */
export function unsavedGuard(formEl, { message = 'You have unsaved changes. Leave this page?' } = {}) {
  let dirty = false;
  const markDirty = () => { dirty = true; };
  formEl.addEventListener('input', markDirty);
  formEl.addEventListener('change', markDirty);
  const onHash = (e) => {
    if (!dirty) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(message)) { e.preventDefault(); location.hash = e.oldURL.split('#')[1] ? '#' + e.oldURL.split('#')[1] : ''; }
    else dirty = false;
  };
  const onBeforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
  window.addEventListener('hashchange', onHash);
  window.addEventListener('beforeunload', onBeforeUnload);
  return () => {
    dirty = false;
    window.removeEventListener('hashchange', onHash);
    window.removeEventListener('beforeunload', onBeforeUnload);
  };
}

/** Validation helpers used by formPage(). */
export const validators = {
  required: (v) => (v == null || String(v).trim() === '' ? 'This field is required' : null),
  email: (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Enter a valid email address'),
  phone: (v) => (!v || /^(\+91[\s-]?)?[6-9]\d{9}$/.test(String(v).replace(/[\s-]/g, '')) ? null : 'Enter a valid 10-digit Indian mobile number'),
  number: (v) => (!v || !Number.isNaN(Number(v)) ? null : 'Enter a valid number'),
  min: (n) => (v) => (Number(v) >= n ? null : `Must be at least ${n}`),
  max: (n) => (v) => (Number(v) <= n ? null : `Must be at most ${n}`),
  pattern: (re, msg) => (v) => (!v || re.test(v) ? null : msg || 'Invalid format'),
};

/* ======================================================= rich components = */

/**
 * Calendar({month:'2026-08', events, onSelectDate, onSelectEvent, view:'month'|'agenda'})
 * events: [{date:'YYYY-MM-DD', title, tone, meta}]
 */
export function Calendar({ month, events = [], onSelectDate, onSelectEvent, view = 'month', maxPerDay = 3 } = {}) {
  let viewDate = month ? new Date(month + '-01') : new Date('2026-08-01');
  let mode = view;
  const byDate = new Map();
  for (const e of events) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date).push(e);
  }
  const root = h('div', { className: 'stack-3' });

  function renderMonth() {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const cal = h('div', { className: 'cal' });
    const head = h('div', { className: 'cal-head' });
    for (const d of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) head.appendChild(h('div', { className: 'cal-dow' }, d));
    cal.appendChild(head);
    const grid = h('div', { className: 'cal-grid' });
    const first = new Date(y, m, 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    const todayIso = formatDate(DEMO_NOW, 'iso');
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const isoStr = formatDate(d, 'iso');
      const dayEvents = byDate.get(isoStr) || [];
      const cell = h('div', {
        className: ['cal-cell', d.getMonth() !== m && 'is-muted', isoStr === todayIso && 'is-today'].filter(Boolean).join(' '),
        onClick: onSelectDate ? () => onSelectDate(isoStr, dayEvents) : null,
      }, h('div', { className: 'cal-date' }, String(d.getDate())));
      dayEvents.slice(0, maxPerDay).forEach((e) => cell.appendChild(h('div', {
        className: 'cal-ev', dataset: { tone: e.tone || 'brand' },
        attrs: { title: e.title },
        onClick: (ev) => { ev.stopPropagation(); if (onSelectEvent) onSelectEvent(e); },
      }, e.title)));
      if (dayEvents.length > maxPerDay) cell.appendChild(h('div', { className: 'cal-more' }, `+${dayEvents.length - maxPerDay} more`));
      grid.appendChild(cell);
    }
    cal.appendChild(grid);
    return cal;
  }

  function renderAgenda() {
    const upcoming = events.slice().sort((a, b) => a.date.localeCompare(b.date));
    if (!upcoming.length) return EmptyState({ icon: 'calendar', title: 'No events scheduled' });
    const wrap = h('div', null);
    for (const e of upcoming) {
      const d = new Date(e.date);
      wrap.appendChild(h('div', { className: 'agenda-day', onClick: onSelectEvent ? () => onSelectEvent(e) : null },
        h('div', { className: 'agenda-date' },
          h('div', { className: 'agenda-dnum' }, String(d.getDate())),
          h('div', { className: 'agenda-dow' }, formatDate(d, 'monthYear'))),
        h('div', { className: 'flex-1' },
          h('div', { className: 't-medium' }, e.title),
          e.meta && h('div', { className: 't-sm t-muted' }, e.meta)),
        e.tone && Badge(e.badge || 'Event', { tone: e.tone })));
    }
    return wrap;
  }

  function render() {
    root.innerHTML = '';
    root.appendChild(h('div', { className: 'row' },
      IconButton('chevron-left', { label: 'Previous month', onClick: () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1); render(); } }),
      h('div', { className: 't-subtitle', style: { minWidth: '150px', textAlign: 'center' } }, formatDate(viewDate, 'monthYear')),
      IconButton('chevron-right', { label: 'Next month', onClick: () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1); render(); } }),
      h('span', { className: 'spacer' }),
      SegmentedControl([{ id: 'month', label: 'Month', icon: 'grid' }, { id: 'agenda', label: 'Agenda', icon: 'list' }],
        (v) => { mode = v; render(); }, { active: mode })));
    root.appendChild(mode === 'month' ? renderMonth() : renderAgenda());
  }
  render();
  return root;
}

/**
 * KanbanBoard({columns, cards, onMove, renderCard})
 * columns: [{id, title, color, limit}]
 * cards:   [{id, columnId, title, meta, tags, avatar, ...}]
 * onMove(cardId, toColumnId)
 */
export function KanbanBoard({ columns = [], cards = [], onMove, renderCard, onCardClick } = {}) {
  const board = h('div', { className: 'kanban' });
  let data = cards.slice();

  function render() {
    board.innerHTML = '';
    for (const col of columns) {
      const items = data.filter((c) => c.columnId === col.id);
      const list = h('div', {
        className: 'kan-list',
        onDragOver: (e) => { e.preventDefault(); list.classList.add('is-over'); },
        onDragLeave: () => list.classList.remove('is-over'),
        onDrop: (e) => {
          e.preventDefault();
          list.classList.remove('is-over');
          const id = e.dataTransfer.getData('text/plain');
          const card = data.find((c) => String(c.id) === id);
          if (card && card.columnId !== col.id) {
            card.columnId = col.id;
            render();
            if (onMove) onMove(card.id, col.id, card);
          }
        },
      });
      for (const card of items) {
        const node = renderCard ? renderCard(card) : h('div', { className: 'kan-card' },
          h('div', { className: 'kan-card-title' }, card.title),
          h('div', { className: 'kan-card-meta' },
            card.meta && h('span', null, card.meta),
            card.badge && Badge(card.badge, { tone: card.tone }),
            card.avatar && Avatar(card.avatar, { size: 'xs' })));
        node.classList.add('kan-card');
        node.setAttribute('draggable', 'true');
        node.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', String(card.id)); node.classList.add('is-dragging'); });
        node.addEventListener('dragend', () => node.classList.remove('is-dragging'));
        if (onCardClick) node.addEventListener('click', () => onCardClick(card));
        list.appendChild(node);
      }
      if (!items.length) list.appendChild(h('div', { className: 't-sm t-faint t-center p-3' }, 'Drop cards here'));
      board.appendChild(h('div', { className: 'kan-col' },
        h('div', { className: 'kan-head' },
          col.color && h('span', { className: 'kan-dot', style: { background: col.color } }),
          h('span', { className: 'kan-title' }, col.title),
          h('span', { className: 'spacer' }),
          Badge(String(items.length), { tone: col.limit && items.length > col.limit ? 'danger' : 'neutral' })),
        list));
    }
  }
  render();
  board.refresh = (newCards) => { data = newCards.slice(); render(); };
  return board;
}

/** RadialProgress(value, {size, thickness, tone, label, sublabel}) */
export function RadialProgress(value, { size = 120, thickness = 10, tone, label, sublabel, max = 100 } = {}) {
  const pct = Math.max(0, Math.min(100, (Number(value) / max) * 100));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const colour = tone === 'success' ? 'var(--chart-good)' : tone === 'warning' ? 'var(--chart-warning)'
    : tone === 'danger' ? 'var(--chart-critical)' : 'var(--chart-1)';
  const svg = h('svg', { viewBox: `0 0 ${size} ${size}`, width: size, height: size, attrs: { role: 'img', 'aria-label': `${label || 'Progress'}: ${pct.toFixed(0)}%` } },
    h('title', null, `${label || 'Progress'}: ${pct.toFixed(0)}%`),
    h('circle', { className: 'ch-ring-track', cx: size / 2, cy: size / 2, r, 'stroke-width': thickness }),
    h('circle', {
      className: 'ch-ring-fill', cx: size / 2, cy: size / 2, r,
      stroke: colour, 'stroke-width': thickness,
      'stroke-dasharray': `${c} ${c}`, 'stroke-dashoffset': c * (1 - pct / 100),
      transform: `rotate(-90 ${size / 2} ${size / 2})`,
    }),
    h('text', { className: 'ch-value-lg', x: size / 2, y: size / 2 + 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, `${pct.toFixed(0)}%`),
    sublabel && h('text', { className: 'ch-value-sub', x: size / 2, y: size / 2 + 20, 'text-anchor': 'middle' }, sublabel));
  return h('div', { className: 'stack-2', style: { alignItems: 'center' } }, svg,
    label && h('div', { className: 't-sm t-muted t-center' }, label));
}

/**
 * MapPlaceholder({routes, vehicles, height, animate})
 * A stylised SVG route map. routes: [{id, name, color, path:[[x,y],...]}] with
 * coordinates in a 0-100 space. vehicles: [{routeId, label, progress:0..1}]
 */
export function MapPlaceholder({ routes = [], vehicles = [], height = 340, animate = true, legend = true } = {}) {
  const W = 100;
  const H = 60;
  const defaultRoutes = routes.length ? routes : [
    { id: 'r1', name: 'Route R01', color: 'var(--chart-1)', path: [[6, 52], [22, 44], [34, 30], [52, 26], [70, 18], [88, 12]] },
    { id: 'r2', name: 'Route R02', color: 'var(--chart-2)', path: [[8, 12], [24, 20], [40, 22], [56, 36], [74, 42], [92, 50]] },
    { id: 'r3', name: 'Route R03', color: 'var(--chart-3)', path: [[10, 32], [30, 34], [48, 46], [66, 48], [86, 34]] },
  ];
  const toPath = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
  const pointAt = (pts, t) => {
    const i = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)));
    const local = t * (pts.length - 1) - i;
    return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * local, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * local];
  };

  const grid = [];
  for (let x = 0; x <= W; x += 10) grid.push(h('line', { x1: x, y1: 0, x2: x, y2: H, stroke: 'var(--chart-grid)', 'stroke-width': 0.2 }));
  for (let y = 0; y <= H; y += 10) grid.push(h('line', { x1: 0, y1: y, x2: W, y2: y, stroke: 'var(--chart-grid)', 'stroke-width': 0.2 }));

  const marks = [];
  const svg = h('svg', { viewBox: `0 0 ${W} ${H}`, attrs: { role: 'img', 'aria-label': 'School transport route map' }, preserveAspectRatio: 'none' },
    h('title', null, 'School transport route map'),
    h('rect', { x: 0, y: 0, width: W, height: H, fill: 'var(--surface-sunken)' }),
    grid,
    defaultRoutes.map((r) => h('path', { d: toPath(r.path), fill: 'none', stroke: r.color, 'stroke-width': 0.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.9 })),
    defaultRoutes.flatMap((r) => r.path.map((p) => h('circle', { cx: p[0], cy: p[1], r: 0.7, fill: 'var(--surface)', stroke: r.color, 'stroke-width': 0.4 }))),
    h('g', { transform: 'translate(48 28)' },
      h('circle', { r: 2.2, fill: 'var(--brand-600)' }),
      h('circle', { r: 3.4, fill: 'none', stroke: 'var(--brand-500)', 'stroke-width': 0.4, opacity: 0.6 })),
    (vehicles.length ? vehicles : defaultRoutes.map((r, i) => ({ routeId: r.id, label: `Bus ${i + 1}`, progress: 0.3 + i * 0.2 })))
      .map((v) => {
        const rt = defaultRoutes.find((r) => r.id === v.routeId) || defaultRoutes[0];
        const [x, y] = pointAt(rt.path, Math.max(0, Math.min(1, v.progress)));
        const g = h('g', { className: 'map-bus', transform: `translate(${x} ${y})` },
          h('circle', { r: 1.7, fill: rt.color, stroke: 'var(--surface)', 'stroke-width': 0.5 }),
          h('title', null, `${v.label} — ${rt.name}`));
        marks.push({ g, rt, v });
        return g;
      }));

  const wrap = h('div', { className: 'mapbox', style: { height: typeof height === 'number' ? height + 'px' : height } }, svg,
    legend && h('div', { className: 'map-legend' },
      defaultRoutes.map((r) => h('span', { className: 'row', style: { gap: '5px' } },
        h('span', { style: { width: '10px', height: '2px', background: r.color, borderRadius: '2px' } }), r.name))));

  if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let t = 0;
    const timer = setInterval(() => {
      if (!wrap.isConnected) { clearInterval(timer); return; }
      t += 0.012;
      for (const mk of marks) {
        const p = (mk.v.progress + t) % 1;
        const [x, y] = pointAt(mk.rt.path, p);
        mk.g.setAttribute('transform', `translate(${x} ${y})`);
      }
    }, 900);
  }
  return wrap;
}

/**
 * ChatPanel({messages, onSend, placeholder})
 * messages: [{from, text, time, me:boolean}]
 */
export function ChatPanel({ messages = [], onSend, placeholder = 'Type a message…', height = 420 } = {}) {
  const log = h('div', { className: 'chat-log' });
  const render = () => {
    log.innerHTML = '';
    for (const m of messages) {
      log.appendChild(h('div', { className: ['chat-msg', m.me && 'is-me'].filter(Boolean).join(' ') },
        !m.me && Avatar(m.from, { size: 'sm' }),
        h('div', null,
          h('div', { className: 'chat-bubble' }, m.text),
          h('div', { className: 'chat-time' }, m.time || ''))));
    }
    log.scrollTop = log.scrollHeight;
  };
  render();
  let input;
  const send = () => {
    const v = input.value.trim();
    if (!v) return;
    messages.push({ from: 'You', text: v, time: formatTime(DEMO_NOW), me: true });
    input.value = '';
    render();
    if (onSend) onSend(v);
  };
  return h('div', { className: 'chat', style: { height: typeof height === 'number' ? height + 'px' : height } },
    log,
    h('div', { className: 'chat-compose' },
      (input = h('input', { className: 'input', placeholder, onKeyDown: (e) => { if (e.key === 'Enter') send(); } })),
      Button('Send', { variant: 'primary', icon: 'send', onClick: send })));
}

/** Divider({label}) */
export function Divider({ label } = {}) {
  if (!label) return h('hr', { className: 'divider' });
  return h('div', { className: 'row', style: { gap: '10px' } },
    h('hr', { className: 'divider flex-1' }),
    h('span', { className: 't-xs t-muted t-upper' }, label),
    h('hr', { className: 'divider flex-1' }));
}

/** Re-exported so pages can read theme/role without importing state.js. */
export { state };
export { icon };
export { navHref };
