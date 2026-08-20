/* ==========================================================================
   pages/dashboards.js — the role dashboards (section id: `dashboard`)

   14 routes, one per persona. Every screen is built from page-kit's
   `dashboardPage` (greeting header + KPI strip + 12-column widget grid) and
   fed exclusively from `data/db.js`. Nothing here is a placeholder.
   ========================================================================== */

import {
  h, SectionCard, Badge, Button, IconButton, Identity, DataTable, ConfirmDialog,
  notify, EmptyState, Timeline, ActivityFeed, DescriptionList, ProgressBar, Rating,
  Avatar, SegmentedControl, MenuButton, Callout, RankList, MetricRow, Tag, Stepper,
  Calendar, MapPlaceholder, mockAction, formatCurrency, formatNumber, formatDate,
  formatDateTime, formatTime, relativeTime,
} from '../core/ui.js';

import {
  dashboardPage, greetingFor, pageActions, missingRecord,
} from '../core/page-kit.js';

import {
  lineChart, areaChart, barChart, comboChart, donutChart, pieChart, funnelChart,
  heatmap, ScaleLegend, gaugeChart, scatterPlot, bulletChart, waterfallChart, treemap,
  radialBarChart, progressRing, sparkline, stackedProgressBar,
  SEQUENTIAL, STATUS, seriesColor,
} from '../core/charts.js';

import {
  db, analytics, byId, sortBy, groupBy, sum, avg, countBy,
  student360, gradeFor,
} from '../data/db.js';

import { icon } from '../core/icons.js';
import { navHref, navigate } from '../core/router.js';
import * as store from '../core/state.js';
import { routeMeta, quickActionsFor } from '../core/nav.js';

/* ========================================================== constants == */

/** The demo clock. Everything on these screens is relative to this instant. */
const TODAY = '2026-08-20';
const TODAY_DOW = 'Thursday';
const NOW_MIN = 9 * 60 + 30;          // 09:30
const MONTH = '2026-08';
const AY_LABEL = '2026-27';

/* ============================================================= styles == */

const STYLE_ID = 'dashboards-module-css';

const CSS = `
.dash-link{color:var(--text-link);font-weight:var(--fw-medium);text-decoration:none;cursor:pointer;background:none;border:0;padding:0;font:inherit;text-align:left}
.dash-link:hover{text-decoration:underline}

.dash-alerts,.dash-rows{display:flex;flex-direction:column}
.dash-alert{display:flex;gap:var(--sp-3);align-items:flex-start;padding:var(--sp-3) var(--sp-2);border-radius:var(--r-md);border-bottom:1px solid var(--border-subtle)}
.dash-alert:last-child{border-bottom:0}
.dash-alert[data-clickable="true"]{cursor:pointer}
.dash-alert[data-clickable="true"]:hover{background:var(--surface-hover)}
.dash-sev{width:3px;border-radius:var(--r-full);align-self:stretch;flex:0 0 3px;min-height:32px;background:var(--chart-track)}
.dash-sev[data-sev="critical"]{background:var(--chart-critical)}
.dash-sev[data-sev="high"]{background:var(--chart-serious)}
.dash-sev[data-sev="medium"]{background:var(--chart-warning)}
.dash-sev[data-sev="low"]{background:var(--chart-good)}
.dash-sev[data-sev="info"]{background:var(--chart-1)}
.dash-alert-ico{display:grid;place-items:center;width:30px;height:30px;border-radius:var(--r-md);flex:0 0 30px;background:var(--surface-sunken);color:var(--text-secondary)}
.dash-alert-ico[data-sev="critical"],.dash-alert-ico[data-sev="high"]{background:var(--danger-50);color:var(--danger-600)}
.dash-alert-ico[data-sev="medium"]{background:var(--warning-50);color:var(--warning-700)}
.dash-alert-ico[data-sev="low"]{background:var(--success-50);color:var(--success-700)}
.dash-alert-ico[data-sev="info"]{background:var(--info-50);color:var(--info-600)}
.dash-alert-body{min-width:0;flex:1}
.dash-alert-title{font-size:var(--fs-sm);font-weight:var(--fw-semibold);color:var(--text)}
.dash-alert-text{font-size:var(--fs-xs);color:var(--text-muted);margin-top:2px}
.dash-alert-side{display:flex;flex-direction:column;align-items:flex-end;gap:var(--sp-1);flex:0 0 auto}

.dash-row{display:flex;gap:var(--sp-3);align-items:center;padding:var(--sp-3) var(--sp-1);border-bottom:1px solid var(--border-subtle)}
.dash-row:last-child{border-bottom:0}
.dash-row-main{min-width:0;flex:1}
.dash-row-title{font-size:var(--fs-sm);font-weight:var(--fw-medium);color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-row-meta{font-size:var(--fs-xs);color:var(--text-muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-row-acts{display:flex;gap:var(--sp-2);flex:0 0 auto;align-items:center}

.dash-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:var(--sp-2)}
.dash-tile{border:1px solid var(--border-subtle);border-radius:var(--r-md);padding:var(--sp-3);background:var(--surface-sunken);display:flex;flex-direction:column;gap:2px}
.dash-tile.is-clickable{cursor:pointer}
.dash-tile.is-clickable:hover{background:var(--surface-hover);border-color:var(--border-strong)}
.dash-tile-l{font-size:var(--fs-2xs);text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);font-weight:var(--fw-semibold)}
.dash-tile-v{font-size:var(--fs-xl);font-weight:var(--fw-semibold);color:var(--text);line-height:var(--lh-tight)}
.dash-tile-v[data-tone="success"]{color:var(--text-success)}
.dash-tile-v[data-tone="warning"]{color:var(--text-warning)}
.dash-tile-v[data-tone="danger"]{color:var(--text-danger)}
.dash-tile-v[data-tone="info"]{color:var(--text-info)}
.dash-tile-v[data-tone="brand"]{color:var(--text-brand)}
.dash-tile-s{font-size:var(--fs-xs);color:var(--text-muted)}

.dash-period-row{display:grid;grid-template-columns:74px 14px 1fr auto;gap:var(--sp-3);align-items:center;padding:var(--sp-2) 0}
.dash-period-time{font-size:var(--fs-xs);color:var(--text-muted);font-variant-numeric:tabular-nums;text-align:right;line-height:var(--lh-snug)}
.dash-period-rail{position:relative;display:grid;place-items:center;align-self:stretch;min-height:34px}
.dash-period-rail::before{content:"";position:absolute;top:0;bottom:0;width:2px;background:var(--border)}
.dash-period-dot{position:relative;width:10px;height:10px;border-radius:var(--r-full);background:var(--surface);border:2px solid var(--chart-1)}
.dash-period-row[data-state="done"] .dash-period-dot{background:var(--chart-1)}
.dash-period-row[data-state="now"] .dash-period-dot{border-color:var(--chart-good);background:var(--chart-good);box-shadow:0 0 0 4px var(--success-50)}
.dash-period-row[data-state="break"] .dash-period-dot{border-color:var(--border-strong);background:var(--surface-sunken)}
.dash-period-main{min-width:0}
.dash-period-t{font-size:var(--fs-sm);font-weight:var(--fw-medium);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash-period-m{font-size:var(--fs-xs);color:var(--text-muted)}

.dash-score-wrap{overflow-x:auto}
.dash-score{width:100%;border-collapse:collapse;font-size:var(--fs-sm);min-width:640px}
.dash-score th{text-align:left;font-size:var(--fs-2xs);text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);font-weight:var(--fw-semibold);padding:var(--sp-2) var(--sp-3);border-bottom:1px solid var(--border);white-space:nowrap}
.dash-score td{padding:var(--sp-2) var(--sp-3);border-bottom:1px solid var(--border-subtle);vertical-align:middle}
.dash-score tbody tr:last-child td{border-bottom:0}
.dash-score tbody tr:hover{background:var(--surface-hover)}
.dash-score .num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}

.dash-legend{display:flex;flex-wrap:wrap;gap:var(--sp-3);font-size:var(--fs-xs);color:var(--text-muted);align-items:center}
.dash-sw{width:10px;height:10px;border-radius:3px;display:inline-block;margin-right:6px;vertical-align:-1px}

.dash-picker{display:flex;gap:var(--sp-3);flex-wrap:wrap}
.dash-child{display:flex;gap:var(--sp-3);align-items:center;padding:var(--sp-3);border:1px solid var(--border);border-radius:var(--r-lg);background:var(--surface);cursor:pointer;min-width:230px;flex:1}
.dash-child:hover{border-color:var(--border-strong)}
.dash-child.is-active{border-color:var(--border-brand);background:var(--surface-accent);box-shadow:var(--shadow-xs)}

.dash-bus-track{position:relative;height:8px;border-radius:var(--r-full);background:var(--chart-track);margin:var(--sp-4) 0}
.dash-bus-fill{position:absolute;left:0;top:0;bottom:0;border-radius:var(--r-full);background:var(--chart-1)}
.dash-bus-pin{position:absolute;top:50%;transform:translate(-50%,-50%);width:18px;height:18px;border-radius:var(--r-full);background:var(--chart-good);border:3px solid var(--surface);box-shadow:var(--shadow-sm)}
.dash-bus-stop{position:absolute;top:50%;transform:translate(-50%,-50%);width:8px;height:8px;border-radius:var(--r-full);background:var(--surface);border:2px solid var(--border-strong)}

.dash-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--sp-4)}
@media (max-width: 860px){.dash-split{grid-template-columns:minmax(0,1fr)}}
@media (max-width: 640px){
  .dash-period-row{grid-template-columns:62px 14px 1fr}
  .dash-period-row > .dash-period-end{grid-column:3 / -1;justify-self:start}
}
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* ============================================================ helpers == */

const _memo = new Map();
/** Cache a derived dataset for the lifetime of the page session. */
function memo(key, fn) {
  if (!_memo.has(key)) _memo.set(key, fn());
  return _memo.get(key);
}

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const pct = (a, b) => (b ? (num(a) / num(b)) * 100 : 0);
const round1 = (v) => Math.round(num(v) * 10) / 10;
const money = (v, compact = false) => formatCurrency(num(v), compact ? { compact: true } : undefined);
const dayKey = (v) => String(v || '').slice(0, 10);
const mins = (hhmm) => {
  const [a, b] = String(hhmm || '00:00').split(':');
  return num(a) * 60 + num(b);
};

/** "Springdale International — Main Campus" → "Main Campus". */
function shortCampus(c) {
  if (!c) return 'All campuses';
  const parts = String(c.name).split('—');
  return (parts.length > 1 ? parts[parts.length - 1] : parts[0]).trim();
}
function campusOf(id) { return byId(db.campuses, id); }
function campusName(id) {
  const c = campusOf(id);
  if (!c) return 'All campuses';
  const short = shortCampus(c);
  return short.toLowerCase() === String(c.city).toLowerCase() ? `${short} campus` : `${short}, ${c.city}`;
}

function currentUser(ctx) {
  return (ctx && ctx.state && ctx.state.currentUser) || store.userForRole((ctx && ctx.state && ctx.state.role) || 'super-admin');
}

/** Scope a collection to a campus (pass null/undefined for group-wide). */
function scope(rows, campusId) {
  return campusId ? rows.filter((r) => r.campusId === campusId) : rows.slice();
}

/**
 * Rows for "today". Demo data thins out near the demo clock, so fall back to
 * the most recent day that actually has records and say so honestly.
 */
function dayRows(coll, key = 'date', preferred = TODAY) {
  const exact = coll.filter((r) => dayKey(r[key]) === preferred);
  if (exact.length) return { date: preferred, rows: exact, live: true };
  let max = '';
  for (const r of coll) { const d = dayKey(r[key]); if (d && d > max && d <= preferred) max = d; }
  return { date: max || preferred, rows: coll.filter((r) => dayKey(r[key]) === max), live: false };
}

/** Standard "as of" caption for a widget fed by the latest available day. */
function asOf(bundle) {
  return bundle.live ? `Today · ${formatDate(bundle.date, 'dayMonth')}` : `Latest shift · ${formatDate(bundle.date, 'medium')}`;
}

/** An inline router link. Never a raw hash string. */
function link(label, route, opts = {}) {
  return h('a', {
    className: ['dash-link', opts.className].filter(Boolean).join(' '),
    href: navHref(route),
    attrs: opts.title ? { title: opts.title } : null,
  }, label);
}

const deltaOf = (arr) => {
  if (!Array.isArray(arr) || arr.length < 2) return null;
  const a = num(arr[arr.length - 2]);
  const b = num(arr[arr.length - 1]);
  return a ? round1(((b - a) / a) * 100) : null;
};

/* ================================================= widget primitives == */

/**
 * The house widget: a SectionCard with an optional timeframe switch and a
 * "view all" deep link in the header.
 */
function widget(cfg = {}, ...body) {
  const { title, subtitle, icon: ico, viewAll, viewAllLabel = 'View all', ranges,
    onRange, activeRange, actions, className, footer } = cfg;
  const head = [];
  if (ranges && ranges.length) head.push(SegmentedControl(ranges, onRange || (() => {}), { active: activeRange }));
  if (actions) head.push(actions);
  if (viewAll) head.push(Button(viewAllLabel, { variant: 'link', size: 'sm', iconRight: 'chevron-right', route: viewAll }));
  return SectionCard({
    title, subtitle, icon: ico, footer,
    className: ['dash-w', className].filter(Boolean).join(' '),
    actions: head.length ? h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, head) : null,
  }, ...body);
}

/** A chart widget whose timeframe segments really do rebuild the chart. */
function rangedChart(cfg = {}) {
  const { title, subtitle, icon: ico, viewAll, ranges, build } = cfg;
  const host = h('div');
  let active = (ranges && ranges[0] && (ranges[0].id || ranges[0])) || 'all';
  const paint = () => {
    host.innerHTML = '';
    const node = build(active);
    if (node) host.appendChild(node);
    else host.appendChild(EmptyState({ icon: 'chart-line', title: 'Nothing in this window', text: 'No records fall inside the selected timeframe. Widen it to see data.' }));
  };
  paint();
  return widget({
    title, subtitle, icon: ico, viewAll, className: 'chart-card',
    ranges, activeRange: active, onRange: (id) => { active = id; paint(); },
  }, host);
}

const SEV_ICON = { critical: 'siren', high: 'alert-triangle', medium: 'alert-circle', low: 'info', info: 'info' };

/**
 * Severity-coded exceptions list.
 * items: [{severity, title, text, meta, badge, route, action:{label,onClick}}]
 */
function alertsPanel(items = [], opts = {}) {
  if (!items.length) {
    return EmptyState({
      icon: 'check-circle', tone: 'success', title: opts.emptyTitle || 'No open exceptions',
      text: opts.emptyText || 'Every monitored threshold in this area is inside tolerance right now.',
    });
  }
  return h('div', { className: 'dash-alerts' }, items.map((a) => h('div', {
    className: 'dash-alert',
    dataset: { clickable: a.route || a.onClick ? 'true' : 'false' },
    onClick: a.route ? () => navigate(a.route) : a.onClick,
  },
    h('span', { className: 'dash-sev', dataset: { sev: a.severity || 'medium' } }),
    h('span', { className: 'dash-alert-ico', dataset: { sev: a.severity || 'medium' }, html: icon(a.icon || SEV_ICON[a.severity] || 'alert-circle', 15) }),
    h('div', { className: 'dash-alert-body' },
      h('div', { className: 'dash-alert-title' }, a.title),
      a.text && h('div', { className: 'dash-alert-text' }, a.text)),
    h('div', { className: 'dash-alert-side' },
      a.badge || (a.meta ? h('span', { className: 't-xs t-muted t-nowrap' }, a.meta) : null),
      a.action && Button(a.action.label, { variant: a.action.variant || 'secondary', size: 'sm', onClick: (e) => { e.stopPropagation(); a.action.onClick(); } })))));
}

/**
 * Pending-approvals queue with inline approve / reject.
 * rows are consumed from a local copy so the widget feels alive.
 */
function approvalsPanel(cfg = {}) {
  const { rows = [], title = (r) => r.title, meta = () => '', side = () => null,
    avatar = (r) => r.name, onApprove, onReject, emptyTitle, emptyText, max = 6 } = cfg;
  const host = h('div', { className: 'dash-rows' });
  let list = rows.slice(0, max);

  const paint = () => {
    host.innerHTML = '';
    if (!list.length) {
      host.appendChild(EmptyState({
        icon: 'check-circle', tone: 'success', title: emptyTitle || 'Queue is clear',
        text: emptyText || 'Nothing is waiting on your decision right now.',
      }));
      return;
    }
    for (const r of list) {
      host.appendChild(h('div', { className: 'dash-row' },
        Avatar(avatar(r) || 'Request', { size: 'sm' }),
        h('div', { className: 'dash-row-main' },
          h('div', { className: 'dash-row-title' }, title(r)),
          h('div', { className: 'dash-row-meta' }, meta(r))),
        h('div', { className: 'dash-row-acts' },
          side(r),
          Button('Approve', {
            variant: 'success', size: 'sm', icon: 'check',
            onClick: () => {
              list = list.filter((x) => x !== r);
              paint();
              if (onApprove) onApprove(r);
              else notify({ title: 'Approved', text: title(r), tone: 'success' });
            },
          }),
          IconButton('x', {
            size: 'sm', label: 'Reject request',
            onClick: () => ConfirmDialog({
              title: 'Reject this request?', tone: 'danger', confirmLabel: 'Reject',
              text: 'The requester is notified immediately and can resubmit with more detail.',
            }).then((ok) => {
              if (!ok) return;
              list = list.filter((x) => x !== r);
              paint();
              if (onReject) onReject(r);
              else notify({ title: 'Rejected', text: title(r), tone: 'danger' });
            }),
          }))));
    }
  };
  paint();
  return host;
}

/** A compact grid of secondary metrics. items: [{label,value,sub,tone,route}] */
function tileGrid(items = []) {
  return h('div', { className: 'dash-tiles' }, items.filter(Boolean).map((t) => h('div', {
    className: ['dash-tile', t.route && 'is-clickable'].filter(Boolean).join(' '),
    onClick: t.route ? () => navigate(t.route) : null,
    attrs: t.route ? { title: `Open ${routeMeta(t.route) ? routeMeta(t.route).label : t.route}` } : null,
  },
    h('div', { className: 'dash-tile-l' }, t.label),
    h('div', { className: 'dash-tile-v', dataset: { tone: t.tone || 'default' } }, t.value),
    t.sub && h('div', { className: 'dash-tile-s' }, t.sub))));
}

/** A hand-rolled scorecard table — used where DataTable would be too heavy. */
function scoreTable(columns, rows, { onRowClick } = {}) {
  return h('div', { className: 'dash-score-wrap' },
    h('table', { className: 'dash-score' },
      h('thead', null, h('tr', null, columns.map((c) => h('th', { className: c.num ? 'num' : null }, c.label)))),
      h('tbody', null, rows.map((r) => h('tr', {
        style: onRowClick ? { cursor: 'pointer' } : null,
        onClick: onRowClick ? () => onRowClick(r) : null,
      }, columns.map((c) => h('td', { className: c.num ? 'num' : null }, c.render(r))))))));
}

/** Today's period-by-period rail. slots: timetableSlots rows. */
function periodRail(slots, { emptyTitle, emptyText, trailing } = {}) {
  const byPeriod = new Map(slots.map((s) => [s.periodNo, s]));
  const rows = [];
  for (const p of db.periods) {
    const slot = byPeriod.get(p.no);
    if (p.isBreak) {
      rows.push({ period: p, slot: null, state: 'break' });
    } else if (slot) {
      const end = mins(p.endTime);
      const start = mins(p.startTime);
      rows.push({ period: p, slot, state: NOW_MIN >= end ? 'done' : NOW_MIN >= start ? 'now' : 'todo' });
    } else {
      rows.push({ period: p, slot: null, state: NOW_MIN >= mins(p.endTime) ? 'done' : 'free' });
    }
  }
  if (!slots.length) {
    return EmptyState({
      icon: 'calendar', title: emptyTitle || 'No periods scheduled today',
      text: emptyText || 'Thursday is free on this timetable. The master timetable has the full week.',
      action: Button('Open master timetable', { variant: 'secondary', icon: 'table', route: 'timetable/master' }),
    });
  }
  return h('div', { className: 'dash-period' }, rows.map((r) => h('div', {
    className: 'dash-period-row', dataset: { state: r.state },
  },
    h('div', { className: 'dash-period-time' }, r.period.startTime, h('div', null, r.period.endTime)),
    h('div', { className: 'dash-period-rail' }, h('span', { className: 'dash-period-dot' })),
    h('div', { className: 'dash-period-main' },
      h('div', { className: 'dash-period-t' },
        r.period.isBreak ? r.period.label : r.slot ? r.slot.subjectName : 'Free period'),
      h('div', { className: 'dash-period-m' },
        r.period.isBreak ? `${r.period.duration} min` :
          r.slot ? `${r.slot.className} ${r.slot.section} · Room ${r.slot.room}${r.slot.teacherName ? ` · ${r.slot.teacherName}` : ''}` :
            'No class allotted — available for substitution')),
    h('div', { className: 'dash-period-end' },
      r.state === 'now' ? Badge('In progress', { tone: 'success', dot: true })
        : r.period.isBreak ? Badge('Break', { tone: 'neutral' })
          : r.slot ? (trailing ? trailing(r.slot, r.state) : Badge(r.state === 'done' ? 'Done' : 'Upcoming', { tone: r.state === 'done' ? 'neutral' : 'info' }))
            : Badge('Free', { tone: 'neutral', outline: true })))));
}

/**
 * Keep the top N slices and roll the rest into one "Other" wedge.
 *
 * A donut whose centre says 240 but whose slices only add to 173 is a lie the
 * eye catches immediately — truncating a countBy() to six and dropping the
 * remainder did exactly that on three dashboards.
 */
function topSlices(rows, n = 6, otherLabel = 'Other') {
  if (rows.length <= n) return rows.map((r) => ({ key: r.key, value: r.value }));
  const head = rows.slice(0, n).map((r) => ({ key: r.key, value: r.value }));
  const rest = rows.slice(n).reduce((a, r) => a + r.value, 0);
  return rest > 0 ? head.concat([{ key: otherLabel, value: rest }]) : head;
}

/** Coloured swatch legend under a custom visual. */
function legend(items) {
  return h('div', { className: 'dash-legend' }, items.map((it) => h('span', null,
    h('span', { className: 'dash-sw', style: { background: it.color } }), it.label)));
}

/* ======================================================== derived data == */

/** Per-campus roll-up used by the super-admin, management and MIS screens. */
function campusStats() {
  return memo('campusStats', () => db.campuses.map((c) => {
    const st = db.students.filter((s) => s.campusId === c.id);
    const sf = db.staff.filter((s) => s.campusId === c.id);
    const teaching = sf.filter((s) => s.type === 'Teaching').length;
    const billed = st.reduce((a, s) => a + num(s.feeTotal), 0);      // whole session
    const dueToDate = st.reduce((a, s) => a + num(s.feeBilled), 0);  // instalments already payable
    const paid = st.reduce((a, s) => a + num(s.feePaid), 0);
    const due = st.reduce((a, s) => a + num(s.feeDue), 0);
    const overdue = st.reduce((a, s) => a + num(s.feeOverdue), 0);
    const open = db.complaints.filter((x) => x.campusId === c.id && !['Resolved', 'Closed'].includes(x.status)).length;
    return {
      id: c.id, code: c.code, board: c.board, city: c.city, name: c.name,
      short: shortCampus(c), principal: c.principal,
      students: st.length, capacity: c.studentCapacity, fill: round1(pct(st.length, c.studentCapacity)),
      staff: sf.length, teaching, ratio: round1(st.length / (teaching || 1)),
      attendance: round1(avg(st, 'attendancePct')),
      performance: round1(avg(st, 'lastExamPercent')),
      billed, dueToDate, collected: paid, outstanding: due, overdue,
      // Against what has fallen due, not against the whole year — otherwise
      // every campus reads ~50% in August and the league table is all red.
      collectionRate: round1(pct(dueToDate - overdue, dueToDate)),
      defaulters: st.filter((s) => num(s.feeOverdue) > 0).length,
      complaints: open,
      transport: st.filter((s) => s.transportOpted).length,
      hostel: st.filter((s) => s.hostelOpted).length,
      established: c.established,
    };
  }));
}

/** Outstanding fee split into ageing buckets. */
function feeAgeing(campusId) {
  return memo(`ageing:${campusId || 'ALL'}`, () => {
    const buckets = [
      { label: 'Not yet due', min: -9999, max: 0, color: SEQUENTIAL[1] },
      { label: '1–30 days', min: 1, max: 30, color: SEQUENTIAL[2] },
      { label: '31–60 days', min: 31, max: 60, color: SEQUENTIAL[3] },
      { label: '61–90 days', min: 61, max: 90, color: SEQUENTIAL[5] },
      { label: '90+ days', min: 91, max: 99999, color: SEQUENTIAL[6] },
    ].map((b) => ({ ...b, value: 0, count: 0 }));
    for (const inv of scope(db.invoices, campusId)) {
      if (num(inv.balance) <= 0) continue;
      const d = num(inv.overdueDays);
      const b = buckets.find((x) => d >= x.min && d <= x.max) || buckets[buckets.length - 1];
      b.value += num(inv.balance);
      b.count += 1;
    }
    return buckets;
  });
}

/** Students carrying academic, attendance or fee risk. */
function atRiskStudents(campusId) {
  return memo(`risk:${campusId || 'ALL'}`, () => scope(db.students, campusId)
    .filter((s) => s.status === 'Active')
    .map((s) => {
      const flags = [];
      if (num(s.attendancePct) < 75) flags.push('Attendance < 75%');
      if (num(s.lastExamPercent) < 40) flags.push('Below pass mark');
      // Overdue instalments, not the annual balance — the whole year is billed
      // up front, so `feeDue` is non-zero for almost every child on the roll.
      if (num(s.feeOverdue) > 40000) flags.push('Large fee arrear');
      if (num(s.disciplinaryCount) >= 3) flags.push('Discipline');
      const score = (num(s.attendancePct) < 75 ? 40 : 0)
        + (num(s.lastExamPercent) < 40 ? 35 : num(s.lastExamPercent) < 50 ? 18 : 0)
        + (num(s.feeOverdue) > 40000 ? 15 : 0)
        + Math.min(20, num(s.disciplinaryCount) * 6);
      return { ...s, flags, riskScore: score };
    })
    .filter((s) => s.flags.length)
    .sort((a, b) => b.riskScore - a.riskScore));
}

/** Everything worth putting on a month calendar for a campus. */
function calendarEvents(campusId) {
  return memo(`cal:${campusId || 'ALL'}`, () => {
    const out = [];
    for (const e of db.events) {
      if (campusId && e.campusId !== campusId) continue;
      out.push({ date: e.date, title: e.title, tone: e.status === 'Completed' ? 'neutral' : 'brand', meta: `${e.venue} · ${e.startTime}`, badge: e.category });
    }
    for (const hDay of db.holidays) {
      if (campusId && hDay.campusId !== 'ALL' && hDay.campusId !== campusId) continue;
      out.push({ date: hDay.date, title: hDay.name, tone: 'success', meta: hDay.type, badge: 'Holiday' });
    }
    for (const p of db.ptmSchedules) {
      if (campusId && p.campusId !== campusId) continue;
      out.push({ date: p.date, title: p.title, tone: 'info', meta: `${p.from}–${p.to} · ${p.booked}/${p.capacity} booked`, badge: 'PTM' });
    }
    for (const g of db.examGroups) {
      out.push({ date: g.from, title: `${g.name} begins`, tone: 'warning', meta: `${g.term} · ${g.weightage}% weightage`, badge: 'Exam' });
    }
    return out;
  });
}

/** Upcoming diary entries (events, holidays, exams, PTM) after the demo clock. */
function upcoming(campusId, limit = 8) {
  return calendarEvents(campusId)
    .filter((e) => e.date >= TODAY)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, limit);
}

/** A real month calendar of everything happening on a campus. */
function monthCalendar(campusId) {
  const events = calendarEvents(campusId);
  return h('div', { className: 'stack-3' },
    Calendar({
      month: MONTH,
      events,
      maxPerDay: 3,
      onSelectEvent: (e) => notify({ title: e.title, text: `${formatDate(e.date, 'long')}${e.meta ? ` · ${e.meta}` : ''}`, tone: 'info' }),
      onSelectDate: (d) => {
        const same = events.filter((e) => e.date === d);
        notify({
          title: formatDate(d, 'long'),
          text: same.length ? same.map((e) => e.title).join(' · ') : 'Nothing scheduled on this date.',
          tone: same.length ? 'brand' : 'info',
        });
      },
    }),
    legend([
      { color: 'var(--chart-1)', label: 'School event' },
      { color: 'var(--chart-good)', label: 'Holiday' },
      { color: 'var(--chart-warning)', label: 'Examination' },
      { color: 'var(--chart-3)', label: 'Parent-teacher meeting' },
    ]));
}

function upcomingList(campusId, limit = 6) {
  const rows = upcoming(campusId, limit);
  if (!rows.length) {
    return EmptyState({ icon: 'calendar', title: 'Nothing scheduled ahead', text: 'The academic diary is clear for the rest of this session.', action: Button('Open calendar', { variant: 'secondary', icon: 'calendar', route: 'events/calendar' }) });
  }
  return Timeline(rows.map((e) => ({
    title: e.title,
    meta: `${formatDate(e.date, 'medium')} · ${relativeTime(e.date)}`,
    text: e.meta,
    icon: e.badge === 'Holiday' ? 'umbrella' : e.badge === 'PTM' ? 'handshake' : e.badge === 'Exam' ? 'file-text' : 'calendar-check',
    tone: e.tone === 'brand' ? 'info' : e.tone,
  })));
}

/** Recent system activity, tuned to a module family. */
function auditFeed(modules, campusId, limit = 8) {
  const rows = db.auditLogs
    .filter((a) => (!campusId || a.campusId === campusId) && (!modules || modules.includes(a.module)))
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, limit);
  if (!rows.length) return EmptyState({ icon: 'history', title: 'No recent activity', text: 'Nothing has been recorded against these modules yet today.' });
  return ActivityFeed(rows.map((a) => ({
    name: a.userName,
    text: `${a.action.toLowerCase()} · ${a.description}`,
    time: `${relativeTime(a.timestamp)} · ${a.role}`,
    tone: a.severity === 'Critical' ? 'danger' : a.severity === 'Warning' ? 'warning' : 'info',
  })));
}

/** Today's staff-facing notices and circulars. */
function noticeList(campusId, audience) {
  const rows = db.circulars
    .filter((c) => c.status === 'Published' && (!campusId || c.campusId === campusId) && (!audience || c.audience === audience || c.audience === 'All'))
    .sort((a, b) => (a.issuedOn < b.issuedOn ? 1 : -1))
    .slice(0, 5);
  if (!rows.length) {
    return EmptyState({ icon: 'scroll', title: 'No circulars in force', text: 'Nothing has been published to this audience for the current session.', action: Button('Open circulars', { variant: 'secondary', icon: 'scroll', route: 'communication/circulars' }) });
  }
  return h('div', { className: 'dash-rows' }, rows.map((c) => h('div', { className: 'dash-row' },
    h('span', { className: 'dash-alert-ico', dataset: { sev: c.priority === 'High' ? 'high' : 'info' }, html: icon('scroll', 15) }),
    h('div', { className: 'dash-row-main' },
      h('div', { className: 'dash-row-title' }, c.title),
      h('div', { className: 'dash-row-meta' }, `${c.circularNo} · ${c.audience} · issued ${relativeTime(c.issuedOn)}`)),
    h('div', { className: 'dash-row-acts' },
      Badge(c.priority === 'High' ? 'High priority' : `${formatNumber(c.acknowledged)} read`, { tone: c.priority === 'High' ? 'danger' : 'neutral' }),
      IconButton('chevron-right', { size: 'sm', label: `Open ${c.title}`, route: 'communication/circulars' })))));
}

/** "Dr. Meera Krishnan" → "Meera Krishnan" so the greeting reads naturally. */
function plainName(name) {
  return String(name || '').replace(/^(Dr|Mr|Mrs|Ms|Prof|Sister|Shri|Smt)\.?\s+/i, '').trim();
}

/**
 * Standard header block shared by every dashboard.
 * `groupWide` dashboards say "all five campuses" instead of the selected one.
 */
function headerFor(ctx, label, extra, groupWide = false) {
  const u = currentUser(ctx);
  const bits = [label];
  if (extra) bits.push(extra);
  bits.push(groupWide ? `All ${db.campuses.length} campuses` : campusName(ctx.state && ctx.state.campusId));
  bits.push(`AY ${AY_LABEL}`);
  bits.push(formatDate(TODAY, 'long'));
  return { greeting: greetingFor(plainName(u.name)), subtitle: bits.join(' · '), user: u };
}

/** The 3–4 quick actions in the page header, filtered by role permissions. */
function quickActions(ctx, list) {
  const role = (ctx.state && ctx.state.role) || 'super-admin';
  const allowed = quickActionsFor(role).map((q) => q.route);
  const buttons = list
    .filter((b) => !b.route || !b.gated || allowed.includes(b.route))
    .map((b, i) => Button(b.label, {
      variant: b.variant || (i === 0 ? 'primary' : 'secondary'),
      icon: b.icon, route: b.route, onClick: b.onClick,
    }));
  buttons.push(MenuButton([
    { header: true, label: 'This dashboard' },
    { label: 'Refresh data', icon: 'refresh', onClick: () => notify({ title: 'Dashboard refreshed', text: 'All widgets re-read the live dataset.', tone: 'success' }) },
    { label: 'Download MIS pack (PDF)', icon: 'download', onClick: mockAction('Download MIS pack') },
    { label: 'Schedule email digest', icon: 'clock', onClick: mockAction('Schedule digest') },
    { separator: true },
    { label: 'Open report centre', icon: 'chart-bar', route: 'reports/centre' },
    { label: 'Command palette', icon: 'command', onClick: () => document.dispatchEvent(new CustomEvent('erp:palette')) },
  ], { label: 'More dashboard actions' }));
  return pageActions(...buttons);
}

/* ============================================ 1 · KPI / MIS OVERVIEW == */

const FMT = {
  num: (v) => formatNumber(Math.round(num(v))),
  pct: (v) => `${round1(v)}%`,
  money: (v) => money(v, true),
  ratio: (v) => `${round1(v)}:1`,
};

function scorecardRows() {
  return memo('scorecard', () => {
    const k = analytics.kpis;
    const sp = analytics.sparks;
    const perf = round1(avg(db.students, 'lastExamPercent'));
    const fleet = round1(avg(analytics.transportUtilisation, 'utilisation'));
    return [
      { module: 'Enrolment', metric: 'Active students', value: k.activeStudents, spark: sp.students, fmt: 'num', target: 2500, route: 'students/all' },
      { module: 'Enrolment', metric: 'Student : teacher ratio', value: k.studentTeacherRatio, fmt: 'ratio', target: 25, upIsGood: false, route: 'teachers/workload' },
      { module: 'Attendance', metric: 'Student attendance', value: k.avgAttendance, spark: sp.attendance, fmt: 'pct', target: 90, route: 'attendance/reports' },
      { module: 'Attendance', metric: 'Staff attendance', value: k.avgStaffAttendance, spark: sp.staffAttendance, fmt: 'pct', target: 95, route: 'hr/attendance' },
      { module: 'Fees', metric: 'Collected YTD', value: k.feeCollected, spark: sp.collection, fmt: 'money', target: k.feeDueToDate, route: 'fees/reports' },
      // Against what has fallen due. `feeOutstanding` is the balance on the
      // whole session and includes instalments that are not payable yet, so
      // holding it to a target would flag every campus in August.
      { module: 'Fees', metric: 'Overdue', value: k.feeOverdue, spark: sp.outstanding, fmt: 'money', target: k.feeDueToDate * 0.1, upIsGood: false, route: 'fees/defaulters' },
      { module: 'Fees', metric: 'Billed for the year', value: k.feeBilled, fmt: 'money', target: k.feeBilled, route: 'fees/structures' },
      { module: 'Fees', metric: 'Collection rate', value: k.collectionRate, fmt: 'pct', target: 90, route: 'fees/reports' },
      { module: 'Admissions', metric: 'Enquiries this session', value: k.admissionEnquiries, spark: sp.admissions, fmt: 'num', target: 550, route: 'admissions/enquiries' },
      { module: 'Admissions', metric: 'Enquiry → admission', value: k.conversionRate, fmt: 'pct', target: 12, route: 'admissions/reports' },
      { module: 'Academics', metric: 'Average score', value: perf, fmt: 'pct', target: 70, route: 'examination/performance' },
      { module: 'People', metric: 'Staff on roll', value: k.totalStaff, fmt: 'num', target: 400, route: 'hr/employees' },
      { module: 'People', metric: 'Leave awaiting approval', value: k.pendingLeaves, fmt: 'num', target: 40, upIsGood: false, route: 'hr/leave-requests' },
      { module: 'Transport', metric: 'Fleet utilisation', value: fleet, spark: sp.transport, fmt: 'pct', target: 85, route: 'transport/reports' },
      { module: 'Hostel', metric: 'Bed occupancy', value: k.hostelOccupancy, spark: sp.hostel, fmt: 'pct', target: 85, route: 'hostel/reports' },
      { module: 'Library', metric: 'Books in circulation', value: k.booksIssued, spark: sp.library, fmt: 'num', target: 1200, route: 'library/reports' },
      { module: 'Service', metric: 'Open complaints', value: k.openComplaints, spark: sp.complaints, fmt: 'num', target: 90, upIsGood: false, route: 'complaints/all' },
      { module: 'Service', metric: 'SLA breaches', value: k.slaBreaches, fmt: 'num', target: 10, upIsGood: false, route: 'complaints/escalations' },
    ].map((r) => {
      const up = r.upIsGood !== false;
      const delta = deltaOf(r.spark);
      const ratio = r.target ? num(r.value) / num(r.target) : null;
      let status = 'On track';
      if (ratio != null) {
        const good = up ? ratio >= 0.98 : ratio <= 1.02;
        const watch = up ? ratio >= 0.9 : ratio <= 1.15;
        status = good ? 'On track' : watch ? 'Watch' : 'Off track';
      }
      return { ...r, up, delta, status };
    });
  });
}

function scorecardWidget() {
  const rows = scorecardRows();
  const table = scoreTable([
    { label: 'Module', render: (r) => h('span', { className: 't-xs t-upper t-muted t-semibold' }, r.module) },
    { label: 'Metric', render: (r) => link(r.metric, r.route) },
    { label: 'Current', num: true, render: (r) => h('span', { className: 't-semibold' }, FMT[r.fmt](r.value)) },
    { label: 'Target', num: true, render: (r) => h('span', { className: 't-muted' }, r.target ? FMT[r.fmt](r.target) : '—') },
    {
      label: 'vs last month', num: true,
      render: (r) => (r.delta == null ? h('span', { className: 't-muted' }, '—')
        : h('span', {
          className: (r.delta > 0) === r.up ? 't-success t-semibold' : 't-danger t-semibold',
        }, `${r.delta > 0 ? '+' : ''}${r.delta}%`)),
    },
    { label: '12-month trend', render: (r) => (r.spark ? sparkline(r.spark, { height: 26, color: seriesColor(0) }) : h('span', { className: 't-muted t-xs' }, 'point-in-time')) },
    { label: 'Status', render: (r) => Badge(r.status, { tone: r.status === 'On track' ? 'success' : r.status === 'Watch' ? 'warning' : 'danger', dot: true }) },
  ], rows, { onRowClick: (r) => navigate(r.route) });

  return widget({
    title: 'Executive scorecard — every module on one page',
    subtitle: `${rows.length} tracked measures · group-wide · academic year ${AY_LABEL}`,
    icon: 'chart-line', viewAll: 'reports/mis', viewAllLabel: 'MIS reports',
  }, table,
    h('div', { className: 'mt-3' }, legend([
      { color: 'var(--chart-good)', label: 'On track — at or above target' },
      { color: 'var(--chart-warning)', label: 'Watch — within 10% of target' },
      { color: 'var(--chart-critical)', label: 'Off track — escalate to the board pack' },
    ])));
}

function buildOverview(ctx) {
  const k = analytics.kpis;
  const sp = analytics.sparks;
  const stats = campusStats();
  const head = headerFor(ctx, 'KPI / MIS overview', 'cross-module executive scorecard', true);
  const ageing = feeAgeing(null);
  const surplus = analytics.revenueVsExpense.reduce((a, r) => a + num(r.surplus), 0);

  const matrixCols = ['Attendance', 'Collection', 'Occupancy', 'Academics', 'Service'];
  const matrixValues = stats.map((c) => [
    round1(c.attendance), round1(c.collectionRate), round1(c.fill), round1(c.performance),
    round1(100 - pct(c.complaints, 60) * 10),
  ]);

  return dashboardPage({
    greeting: head.greeting,
    subtitle: head.subtitle,
    route: 'dashboard/overview',
    actions: quickActions(ctx, [
      { label: 'Board pack', icon: 'download', onClick: mockAction('Generate board pack') },
      { label: 'MIS reports', icon: 'chart-bar', route: 'reports/mis' },
      { label: 'Report builder', icon: 'tool', route: 'reports/builder' },
    ]),
    kpis: [
      { label: 'Active students', value: formatNumber(k.activeStudents), delta: deltaOf(sp.students), deltaLabel: 'vs last month', icon: 'graduation-cap', tone: 'brand', trend: sp.students, route: 'students/all' },
      { label: 'Student attendance', value: `${k.avgAttendance}%`, delta: deltaOf(sp.attendance), deltaLabel: 'vs last month', icon: 'clipboard-check', tone: 'success', trend: sp.attendance, route: 'attendance/reports' },
      { label: 'Fee collected YTD', value: money(k.feeCollected, true), delta: deltaOf(sp.collection), deltaLabel: 'vs last month', icon: 'wallet', tone: 'info', trend: sp.collection, route: 'fees/reports' },
      { label: 'Outstanding', value: money(k.feeOutstanding, true), delta: deltaOf(sp.outstanding), deltaLabel: 'vs last month', deltaDir: 'down', icon: 'alert-circle', tone: 'danger', trend: sp.outstanding, route: 'fees/outstanding' },
      { label: 'Surplus YTD', value: money(surplus, true), delta: 6.4, deltaLabel: 'vs plan', icon: 'trending-up', tone: 'success', trend: sp.revenue, route: 'finance/profit-loss' },
      { label: 'Staff on roll', value: formatNumber(k.totalStaff), delta: 1.6, deltaLabel: 'vs last year', icon: 'briefcase', tone: 'brand', trend: sp.staffAttendance, route: 'hr/employees' },
      { label: 'Admission conversion', value: `${k.conversionRate}%`, delta: deltaOf(sp.admissions), deltaLabel: 'vs last month', icon: 'user-plus', tone: 'info', trend: sp.admissions, route: 'admissions/reports' },
      { label: 'Open complaints', value: formatNumber(k.openComplaints), delta: deltaOf(sp.complaints), deltaLabel: 'vs last month', icon: 'alert-triangle', tone: 'warning', trend: sp.complaints, route: 'complaints/all' },
    ],
    widgets: [
      { span: 12, render: scorecardWidget },

      {
        span: 8,
        render: () => rangedChart({
          title: 'Revenue, expense and surplus',
          subtitle: 'Monthly · all campuses · ₹ crore scale',
          icon: 'banknote', viewAll: 'finance/profit-loss',
          ranges: [{ id: 'h1', label: 'H1' }, { id: 'ytd', label: 'YTD' }, { id: 'full', label: 'Full year' }],
          build: (r) => {
            const src = analytics.revenueVsExpense;
            const rows = r === 'h1' ? src.slice(0, 6) : r === 'ytd' ? src.slice(0, 9) : src;
            return comboChart({
              categories: rows.map((x) => x.month),
              bars: [
                { name: 'Revenue', values: rows.map((x) => x.revenue) },
                { name: 'Expense', values: rows.map((x) => x.expense) },
              ],
              line: { name: 'Surplus', values: rows.map((x) => x.surplus) },
              valueFormat: 'currencyCompact', height: 300,
              title: 'Revenue, expense and surplus by month',
            });
          },
        }),
      },

      {
        span: 4,
        render: () => widget({ title: 'Where the money goes', subtitle: 'Expense mix, year to date', icon: 'chart-pie', viewAll: 'finance/expenses', className: 'chart-card' },
          treemap({ data: analytics.expenseByCategory.map((r) => ({ key: r.key, value: r.value })), valueFormat: 'currencyCompact', height: 300, title: 'Expense by category' })),
      },

      {
        span: 7,
        render: () => widget({ title: 'Campus performance matrix', subtitle: 'Indexed 0–100 · darker is stronger', icon: 'grid', viewAll: 'reports/mis', className: 'chart-card' },
          heatmap({
            mode: 'matrix',
            rows: stats.map((c) => c.short),
            cols: matrixCols,
            values: matrixValues,
            valueFormat: 'percent0', height: 300,
            title: 'Campus performance matrix',
          }),
          h('div', { className: 'mt-3' }, ScaleLegend(0, 100, { format: 'percent0' }))),
      },

      {
        span: 5,
        render: () => widget({ title: 'Enrolment and staffing trend', subtitle: 'Five academic years', icon: 'trending-up', viewAll: 'students/reports', className: 'chart-card' },
          areaChart({
            categories: analytics.enrolmentTrend.map((r) => r.year),
            series: [
              { name: 'Students', values: analytics.enrolmentTrend.map((r) => r.students) },
              { name: 'Staff', values: analytics.enrolmentTrend.map((r) => r.staff) },
            ],
            valueFormat: 'number', height: 300, title: 'Enrolment and staffing by year',
          })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Admission funnel', subtitle: 'Enquiry to confirmed admission', icon: 'workflow', viewAll: 'admissions/reports', className: 'chart-card' },
          funnelChart({ stages: analytics.admissionFunnel.map((s) => ({ label: s.stage, value: s.count })), showConversion: true, height: 320, title: 'Admission funnel' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Budget utilisation', subtitle: 'Spend against allocation, top heads', icon: 'target', viewAll: 'finance/budgets', className: 'chart-card' },
          bulletChart({
            items: analytics.budgetUtilisation.slice(0, 6).map((b) => ({
              label: b.head, value: b.spent, target: b.allocated * 0.6, ranges: [b.allocated * 0.5, b.allocated * 0.8, b.allocated],
            })),
            valueFormat: 'currencyCompact', height: 300, title: 'Budget utilisation',
          })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Outstanding fee ageing', subtitle: `${formatNumber(ageing.reduce((a, b) => a + b.count, 0))} unpaid invoices`, icon: 'alert-circle', viewAll: 'fees/outstanding', className: 'chart-card' },
          donutChart({
            data: ageing.map((b) => ({ key: b.label, value: b.value, color: b.color })),
            centerValue: money(ageing.reduce((a, b) => a + b.value, 0), true),
            centerLabel: 'Outstanding', height: 300, valueFormat: 'currencyCompact',
            title: 'Outstanding fee by ageing bucket',
          })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Group risk register', subtitle: 'Exceptions that need a decision this week', icon: 'siren', viewAll: 'complaints/escalations' },
          alertsPanel(groupRisks(stats))),
      },

      {
        span: 6,
        render: () => widget({ title: 'Board-level approvals', subtitle: 'High-value spend awaiting sign-off', icon: 'stamp', viewAll: 'finance/purchase-orders' },
          approvalsPanel({
            rows: sortBy(db.purchaseOrders.filter((p) => p.status === 'Pending Approval'), 'total', 'desc'),
            avatar: (r) => r.vendorName,
            title: (r) => `${r.poNumber} · ${r.vendorName}`,
            meta: (r) => `${r.department} · ${campusName(r.campusId)} · ${r.items} line items · expected ${formatDate(r.expectedDate, 'medium')}`,
            side: (r) => h('span', { className: 't-semibold t-num t-nowrap' }, money(r.total)),
            onApprove: (r) => notify({ title: 'Purchase order approved', text: `${r.poNumber} released to ${r.vendorName}`, tone: 'success' }),
          })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Target attainment', subtitle: 'Four headline commitments', icon: 'gauge', className: 'chart-card' },
          radialBarChart({
            data: [
              { key: 'Collection', value: k.collectionRate, max: 100 },
              { key: 'Attendance', value: k.avgAttendance, max: 100 },
              { key: 'Occupancy', value: round1(pct(k.activeStudents, sum(db.campuses, 'studentCapacity'))), max: 100 },
              { key: 'Conversion', value: k.conversionRate * 5, max: 100 },
            ],
            valueFormat: 'percent0', height: 280, title: 'Target attainment',
          })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Academic diary', subtitle: 'Next commitments across the group', icon: 'calendar-check', viewAll: 'events/calendar' },
          upcomingList(null, 6)),
      },

      {
        span: 4,
        render: () => widget({ title: 'System activity', subtitle: 'Most recent changes across modules', icon: 'history', viewAll: 'system/audit-logs' },
          auditFeed(null, null, 7)),
      },
    ],
  });
}

function groupRisks(stats) {
  const k = analytics.kpis;
  const out = [];
  const worstCollection = sortBy(stats, 'collectionRate', 'asc')[0];
  const worstAttendance = sortBy(stats, 'attendance', 'asc')[0];
  const overCap = stats.filter((c) => c.fill > 90);
  const breached = db.complaints.filter((c) => c.slaBreached && !['Resolved', 'Closed'].includes(c.status));
  const expiring = db.vehicles.filter((v) => v.insuranceExpiry <= '2026-12-31' || v.fitnessExpiry <= '2026-12-31');
  const lowStock = db.inventoryItems.filter((i) => i.status === 'Low Stock');
  const bigDues = analytics.defaulters.filter((d) => d.overdueDays >= 90);

  out.push({
    severity: k.feeOverdue > k.feeDueToDate * 0.15 ? 'critical' : 'high', icon: 'wallet',
    title: `${money(k.feeOverdue, true)} of fees is past its due date`,
    text: `${formatNumber(k.defaulterCount)} families are late on an instalment, against ${money(k.feeDueToDate, true)} billed to date. ${worstCollection.short} is the weakest campus at ${worstCollection.collectionRate}% collected. A further ${money(k.feeOutstanding - k.feeOverdue, true)} falls due later this session.`,
    badge: Badge('Finance', { tone: 'danger' }), route: 'fees/defaulters',
  });
  out.push({
    severity: bigDues.length > 20 ? 'critical' : 'high', icon: 'user-x',
    title: `${bigDues.length} accounts are 90+ days overdue`,
    text: `Combined exposure of ${money(bigDues.reduce((a, d) => a + d.due, 0), true)}. Legal escalation threshold is 120 days.`,
    badge: Badge('Fees', { tone: 'danger' }), route: 'fees/defaulters',
  });
  out.push({
    severity: 'high', icon: 'clipboard-check',
    title: `${worstAttendance.short} attendance is ${worstAttendance.attendance}%`,
    text: `Board minimum is 75% per student; the group target is 90%. ${formatNumber(db.students.filter((s) => num(s.attendancePct) < 75).length)} students are below the bar group-wide.`,
    badge: Badge('Academics', { tone: 'warning' }), route: 'attendance/defaulters',
  });
  out.push({
    severity: breached.length > 10 ? 'high' : 'medium', icon: 'timer',
    title: `${breached.length} complaints have breached SLA`,
    text: `Oldest ticket is ${Math.round(Math.max(...breached.map((c) => num(c.ageHours)), 0) / 24)} days old. Escalation owners are set per category.`,
    badge: Badge('Service', { tone: 'warning' }), route: 'complaints/escalations',
  });
  if (overCap.length) {
    out.push({
      severity: 'medium', icon: 'building-2',
      title: `${overCap.length} campus(es) above 90% of sanctioned capacity`,
      text: overCap.map((c) => `${c.short} ${c.fill}%`).join(' · '),
      badge: Badge('Capacity', { tone: 'warning' }), route: 'academics/sections',
    });
  }
  out.push({
    severity: 'medium', icon: 'shield',
    title: `${expiring.length} vehicle documents expire this calendar year`,
    text: 'Insurance, fitness and permit renewals must be filed 30 days before expiry to keep routes running.',
    badge: Badge('Transport', { tone: 'warning' }), route: 'transport/documents',
  });
  out.push({
    severity: 'low', icon: 'package',
    title: `${lowStock.length} inventory lines below reorder level`,
    text: `Estimated replenishment value ${money(lowStock.reduce((a, i) => a + num(i.unitPrice) * num(i.reorderLevel), 0), true)}.`,
    badge: Badge('Inventory', { tone: 'info' }), route: 'inventory/stock',
  });
  return out;
}

/* ================================================ 2 · SUPER ADMIN ==== */

function campusLeagueTable(stats) {
  return DataTable({
    rowKey: 'id',
    rows: stats,
    searchable: false, paginate: false, columnToggle: true, exportable: true,
    exportName: 'campus-league-table', maxHeight: 'none',
    columns: [
      {
        key: 'short', label: 'Campus', sticky: true, width: 230,
        render: (r) => Identity(r.short, `${r.city} · ${r.board} · est. ${r.established}`),
        value: (r) => r.short,
      },
      { key: 'students', label: 'Students', numeric: true, align: 'right', width: 100, aggregate: 'sum', format: (v) => formatNumber(v), render: (r) => formatNumber(r.students) },
      {
        key: 'fill', label: 'Capacity used', width: 160, numeric: true, align: 'right', aggregate: 'avg', format: (v) => `${round1(v)}%`,
        render: (r) => h('div', { className: 'stack-1' },
          h('div', { className: 't-xs t-num t-right' }, `${r.fill}% of ${formatNumber(r.capacity)}`),
          ProgressBar(r.fill, { size: 'sm', tone: r.fill > 90 ? 'danger' : r.fill > 75 ? 'warning' : 'success' })),
      },
      { key: 'staff', label: 'Staff', numeric: true, align: 'right', width: 80, aggregate: 'sum', render: (r) => formatNumber(r.staff) },
      { key: 'ratio', label: 'S:T ratio', numeric: true, align: 'right', width: 96, render: (r) => `${r.ratio}:1` },
      {
        key: 'attendance', label: 'Attendance', numeric: true, align: 'right', width: 110, aggregate: 'avg', format: (v) => `${round1(v)}%`,
        render: (r) => h('span', { className: r.attendance >= 90 ? 't-success t-num' : r.attendance >= 85 ? 't-warning t-num' : 't-danger t-num' }, `${r.attendance}%`),
      },
      { key: 'performance', label: 'Avg score', numeric: true, align: 'right', width: 100, aggregate: 'avg', format: (v) => `${round1(v)}%`, render: (r) => `${r.performance}%` },
      { key: 'collected', label: 'Collected', numeric: true, align: 'right', width: 130, aggregate: 'sum', format: (v) => money(v, true), render: (r) => money(r.collected) },
      { key: 'outstanding', label: 'Outstanding', numeric: true, align: 'right', width: 130, aggregate: 'sum', format: (v) => money(v, true), render: (r) => h('span', { className: 't-danger t-num' }, money(r.outstanding)) },
      {
        key: 'collectionRate', label: 'Collection %', numeric: true, align: 'right', width: 120, aggregate: 'avg', format: (v) => `${round1(v)}%`,
        render: (r) => Badge(`${r.collectionRate}%`, { tone: r.collectionRate >= 85 ? 'success' : r.collectionRate >= 75 ? 'warning' : 'danger' }),
      },
      { key: 'transport', label: 'On transport', numeric: true, align: 'right', width: 120, hidden: true, render: (r) => formatNumber(r.transport) },
      { key: 'hostel', label: 'Boarders', numeric: true, align: 'right', width: 100, hidden: true, render: (r) => formatNumber(r.hostel) },
      { key: 'complaints', label: 'Open tickets', numeric: true, align: 'right', width: 120, aggregate: 'sum', render: (r) => Badge(String(r.complaints), { tone: r.complaints > 25 ? 'danger' : r.complaints > 12 ? 'warning' : 'success' }) },
    ],
    footerAggregates: true,
    rowActions: (r) => [
      { label: `Students at ${r.short}`, icon: 'graduation-cap', route: 'students/all' },
      { label: 'Fee position', icon: 'wallet', route: 'fees/reports' },
      { label: 'Staff roster', icon: 'briefcase', route: 'hr/employees' },
      { separator: true },
      { label: 'Campus settings', icon: 'settings', route: 'system/campuses' },
    ],
    onRowClick: () => navigate('system/campuses'),
  });
}

function systemHealthRows() {
  const s = db.settings;
  return [
    { label: 'Backup', value: s.backup.status, meta: `${s.backup.frequency} · ${s.backup.size} · ${s.backup.destination}`, tone: 'success', icon: 'database', route: 'system/backup' },
    { label: 'Payment gateway', value: s.payment.status, meta: `${s.payment.gateway} · ${s.payment.mode} · MDR ${s.payment.mdr}`, tone: 'success', icon: 'credit-card', route: 'system/payment-gateway' },
    { label: 'SMS gateway', value: s.sms.status, meta: `${s.sms.provider} · ${formatNumber(s.sms.balance)} credits left`, tone: s.sms.balance < 50000 ? 'warning' : 'success', icon: 'message-square', route: 'system/sms' },
    { label: 'Email relay', value: s.email.status, meta: `${s.email.host}:${s.email.port} · ${s.email.encryption}`, tone: 'success', icon: 'mail', route: 'system/email' },
    { label: 'WhatsApp', value: s.whatsapp.status, meta: `${s.whatsapp.provider} · ${s.whatsapp.templatesApproved} templates approved`, tone: 'success', icon: 'message-circle', route: 'system/whatsapp' },
    { label: 'Biometric', value: s.biometric.status, meta: `${s.biometric.vendor} · ${s.biometric.devices} devices · sync ${s.biometric.syncInterval}`, tone: 'success', icon: 'fingerprint', route: 'system/biometric' },
    { label: 'RFID', value: s.rfid.status, meta: `${s.rfid.vendor} · ${formatNumber(s.rfid.cardsIssued)} cards issued`, tone: 'success', icon: 'scan', route: 'system/rfid' },
  ];
}

function buildSuperAdmin(ctx) {
  const stats = campusStats();
  const k = analytics.kpis;
  const sp = analytics.sparks;
  const head = headerFor(ctx, 'Super admin control tower', 'system, access and campus health', true);

  const activeUsers = db.users.filter((u) => u.status === 'Active');
  const failedLogins = db.loginHistory.filter((l) => l.result !== 'Success');
  const devicesOffline = db.biometricDevices.filter((d) => d.status !== 'Online');
  const criticalAudit = db.auditLogs.filter((a) => a.severity === 'Critical' || a.severity === 'Warning');

  const loginDays = (() => {
    const m = new Map();
    for (const l of db.loginHistory) {
      const d = dayKey(l.timestamp);
      m.set(d, (m.get(d) || 0) + 1);
    }
    return Array.from(m, ([date, value]) => ({ date, value })).sort((a, b) => (a.date < b.date ? -1 : 1));
  })();

  const moduleUsage = (() => {
    const counts = countBy(db.auditLogs, 'module');
    const top = counts.slice(0, 7);
    const rest = counts.slice(7).reduce((a, r) => a + r.value, 0);
    return rest ? top.concat([{ key: 'Other modules', value: rest }]) : top;
  })();

  return dashboardPage({
    greeting: head.greeting,
    subtitle: head.subtitle,
    route: 'dashboard/super-admin',
    actions: quickActions(ctx, [
      { label: 'Add user', icon: 'user-plus', route: 'system/users' },
      { label: 'Permission matrix', icon: 'table', route: 'system/permissions' },
      { label: 'Audit logs', icon: 'history', route: 'system/audit-logs' },
    ]),
    kpis: [
      { label: 'Campuses live', value: String(k.campuses), delta: 0, deltaLabel: 'no change', icon: 'building-2', tone: 'brand', route: 'system/campuses' },
      { label: 'Users provisioned', value: formatNumber(db.users.length), delta: 3.4, deltaLabel: 'vs last month', icon: 'users', tone: 'info', trend: sp.students, route: 'system/users' },
      { label: 'Active accounts', value: formatNumber(activeUsers.length), delta: 1.1, deltaLabel: 'vs last month', icon: 'user-check', tone: 'success', route: 'system/users' },
      { label: 'Failed sign-ins', value: formatNumber(failedLogins.length), delta: -18.2, deltaLabel: 'vs last month', icon: 'lock', tone: 'warning', route: 'system/login-history' },
      { label: 'Audit events', value: formatNumber(db.auditLogs.length), delta: 7.9, deltaLabel: 'vs last month', icon: 'history', tone: 'brand', route: 'system/audit-logs' },
      { label: 'Devices offline', value: String(devicesOffline.length), delta: devicesOffline.length ? 12 : -100, deltaLabel: 'vs last week', icon: 'fingerprint', tone: devicesOffline.length ? 'danger' : 'success', route: 'attendance/devices' },
      { label: 'Group revenue YTD', value: money(k.feeCollected, true), delta: deltaOf(sp.collection), deltaLabel: 'vs last month', icon: 'banknote', tone: 'success', trend: sp.collection, route: 'finance/reports' },
      { label: 'Last backup', value: formatTime(db.settings.backup.lastBackup), deltaLabel: db.settings.backup.status, icon: 'database', tone: 'success', route: 'system/backup' },
    ],
    widgets: [
      {
        span: 12,
        render: () => widget({
          title: 'Campus league table',
          subtitle: 'Every campus, every headline measure — sortable, exportable, drillable',
          icon: 'building-columns', viewAll: 'system/campuses', viewAllLabel: 'Manage campuses',
        }, campusLeagueTable(stats)),
      },

      {
        span: 7,
        render: () => rangedChart({
          title: 'Enrolment against sanctioned capacity',
          subtitle: 'Seats filled vs seats available, per campus',
          icon: 'graduation-cap', viewAll: 'students/all',
          ranges: [{ id: 'abs', label: 'Absolute' }, { id: 'pctv', label: '% filled' }],
          build: (r) => (r === 'abs'
            ? barChart({
              categories: stats.map((c) => c.short),
              series: [
                { name: 'Enrolled', values: stats.map((c) => c.students) },
                { name: 'Spare capacity', values: stats.map((c) => Math.max(0, c.capacity - c.students)) },
              ],
              stacked: true, horizontal: true, height: 290, valueFormat: 'number',
              title: 'Enrolment against capacity',
            })
            : bulletChart({
              // Seats taken against sanctioned seats, with the 80% comfort mark
              // as the target and the bands at 60 / 85 / 100% of capacity.
              items: stats.map((c) => ({
                label: c.short, value: c.students, target: Math.round(c.capacity * 0.8),
                ranges: [c.capacity * 0.6, c.capacity * 0.85, c.capacity],
              })),
              valueFormat: 'number', height: 290, title: 'Capacity filled by campus',
            })),
        }),
      },

      {
        span: 5,
        render: () => widget({ title: 'Revenue contribution by campus', subtitle: 'Fee collected, year to date', icon: 'chart-pie', viewAll: 'finance/reports', className: 'chart-card' },
          treemap({ data: stats.map((c) => ({ key: c.short, value: c.collected })), valueFormat: 'currencyCompact', height: 290, title: 'Revenue by campus' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Integration health', subtitle: 'Every outbound connector', icon: 'git-branch', viewAll: 'system/integrations' },
          h('div', { className: 'dash-rows' }, systemHealthRows().map((r) => h('div', { className: 'dash-row' },
            h('span', { className: 'dash-alert-ico', dataset: { sev: r.tone === 'warning' ? 'medium' : 'low' }, html: icon(r.icon, 15) }),
            h('div', { className: 'dash-row-main' },
              h('div', { className: 'dash-row-title' }, r.label),
              h('div', { className: 'dash-row-meta' }, r.meta)),
            h('div', { className: 'dash-row-acts' },
              Badge(r.value, { tone: r.tone }),
              IconButton('chevron-right', { size: 'sm', label: `Configure ${r.label}`, route: r.route })))))),
      },

      {
        span: 4,
        render: () => widget({ title: 'Module usage', subtitle: 'Share of audited actions in the last 500 events', icon: 'layers', viewAll: 'system/module-access', className: 'chart-card' },
          barChart({
            categories: moduleUsage.map((m) => m.key),
            series: [{ name: 'Actions', values: moduleUsage.map((m) => m.value) }],
            horizontal: true, showValues: true, height: 300, valueFormat: 'number',
            title: 'Audited actions by module',
          })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Accounts by role', subtitle: `${db.roles.length} roles · ${formatNumber(db.users.length)} provisioned users`, icon: 'shield', viewAll: 'system/roles', className: 'chart-card' },
          donutChart({
            data: topSlices(countBy(db.users, 'roleName'), 6, 'Other roles'),
            centerValue: formatNumber(db.users.length), centerLabel: 'Users', height: 300,
            title: 'User accounts by role',
          })),
      },

      {
        span: 8,
        render: () => widget({ title: 'Sign-in activity', subtitle: 'Sessions per day across all campuses', icon: 'log-in', viewAll: 'system/login-history', className: 'chart-card' },
          heatmap({ mode: 'calendar', days: loginDays, seriesName: 'Sign-ins', height: 220, title: 'Sign-in activity by day' }),
          h('div', { className: 'mt-3' }, ScaleLegend(0, Math.max(...loginDays.map((d) => d.value), 1), { format: 'number' }))),
      },

      {
        span: 4,
        render: () => widget({ title: 'Security exceptions', subtitle: 'Requires an administrator decision', icon: 'shield-check', viewAll: 'system/security' },
          alertsPanel(securityAlerts(failedLogins, devicesOffline, criticalAudit))),
      },

      {
        span: 6,
        render: () => widget({ title: 'Audit highlights', subtitle: 'Warning and critical severity only', icon: 'siren', viewAll: 'system/audit-logs' },
          criticalAudit.length
            ? Timeline(criticalAudit.slice(0, 7).map((a) => ({
              title: `${a.action} — ${a.entity}`,
              meta: `${a.userName} (${a.role}) · ${formatDateTime(a.timestamp)} · ${a.ip}`,
              text: a.description,
              icon: a.severity === 'Critical' ? 'siren' : 'alert-triangle',
              tone: a.severity === 'Critical' ? 'danger' : 'warning',
            })))
            : EmptyState({ icon: 'shield-check', tone: 'success', title: 'Nothing above informational', text: 'No warning or critical audit events have been recorded this session.' })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Cross-campus approvals', subtitle: 'Expense vouchers waiting on group finance', icon: 'stamp', viewAll: 'finance/expenses' },
          approvalsPanel({
            rows: sortBy(db.expenses.filter((e) => e.status === 'Pending Approval'), 'amount', 'desc'),
            avatar: (r) => (byId(db.vendors, r.vendorId) || {}).name || r.category,
            title: (r) => `${r.voucherNo} · ${r.description}`,
            meta: (r) => `${r.category} · ${campusName(r.campusId)} · raised ${formatDate(r.date, 'medium')} · ${r.paymentMode}`,
            side: (r) => h('span', { className: 't-semibold t-num t-nowrap' }, money(r.amount)),
            onApprove: (r) => notify({ title: 'Voucher approved', text: `${r.voucherNo} released for payment`, tone: 'success' }),
          })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Attendance device fleet', subtitle: `${db.biometricDevices.length} readers · ${formatNumber(sum(db.biometricDevices, 'punchesToday'))} punches today`, icon: 'fingerprint', viewAll: 'attendance/devices' },
          DataTable({
            rows: sortBy(db.biometricDevices, 'punchesToday', 'desc').slice(0, 8),
            paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
            columns: [
              { key: 'name', label: 'Device', render: (r) => Identity(r.name, `${r.location} · ${campusName(r.campusId)}`), value: (r) => r.name },
              { key: 'type', label: 'Type', width: 150 },
              { key: 'punchesToday', label: 'Punches', numeric: true, align: 'right', width: 100, render: (r) => formatNumber(r.punchesToday) },
              { key: 'lastSync', label: 'Last sync', width: 130, render: (r) => relativeTime(r.lastSync) },
              { key: 'status', label: 'Status', width: 110, render: (r) => Badge(r.status, { tone: r.status === 'Online' ? 'success' : 'danger' }) },
            ],
            onRowClick: () => navigate('attendance/devices'),
          })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Recent administrator activity', subtitle: 'Live feed from the audit trail', icon: 'activity', viewAll: 'system/audit-logs' },
          auditFeed(null, null, 8)),
      },
    ],
  });
}

function securityAlerts(failedLogins, devicesOffline, criticalAudit) {
  const out = [];
  const noMfa = db.users.filter((u) => !u.twoFactor && ['super-admin', 'administrator', 'principal', 'accountant'].includes(u.role));
  const stale = db.users.filter((u) => u.status === 'Active' && dayKey(u.lastLogin) < '2026-06-01');
  if (failedLogins.length) {
    out.push({
      severity: failedLogins.length > 30 ? 'high' : 'medium', icon: 'lock',
      title: `${failedLogins.length} failed sign-in attempts`,
      text: `Lockout fires after ${db.settings.security.maxFailedLogins} attempts. Review the source IPs before widening the allowlist.`,
      badge: Badge('Auth', { tone: 'warning' }), route: 'system/login-history',
    });
  }
  if (noMfa.length) {
    out.push({
      severity: 'critical', icon: 'shield',
      title: `${noMfa.length} privileged accounts without two-factor`,
      text: 'Group policy requires MFA on every finance and leadership account.',
      badge: Badge('Policy', { tone: 'danger' }), route: 'system/security',
    });
  }
  if (devicesOffline.length) {
    out.push({
      severity: 'high', icon: 'fingerprint',
      title: `${devicesOffline.length} attendance readers offline`,
      text: devicesOffline.slice(0, 3).map((d) => `${d.name} (${d.location})`).join(' · '),
      badge: Badge('Devices', { tone: 'danger' }), route: 'attendance/devices',
    });
  }
  if (stale.length) {
    out.push({
      severity: 'medium', icon: 'user-x',
      title: `${stale.length} active accounts dormant since June`,
      text: 'Dormant accounts should be suspended or reassigned during the quarterly access review.',
      badge: Badge('Access', { tone: 'warning' }), route: 'system/users',
    });
  }
  out.push({
    severity: 'low', icon: 'database',
    title: `Backup healthy — ${db.settings.backup.size} at ${formatTime(db.settings.backup.lastBackup)}`,
    text: `${db.settings.backup.frequency}, retained ${db.settings.backup.retentionDays} days in ${db.settings.backup.destination}.`,
    badge: Badge('Healthy', { tone: 'success' }), route: 'system/backup',
  });
  if (criticalAudit.length) {
    out.push({
      severity: 'medium', icon: 'history',
      title: `${criticalAudit.length} audit events above informational`,
      text: 'Bulk exports and permission changes are the most common triggers.',
      badge: Badge('Audit', { tone: 'warning' }), route: 'system/audit-logs',
    });
  }
  return out;
}

/* ================================================= 3 · MANAGEMENT ==== */

function buildManagement(ctx) {
  const stats = campusStats();
  const k = analytics.kpis;
  const sp = analytics.sparks;
  const head = headerFor(ctx, 'Management dashboard', 'trust-level view', true);

  const rev = analytics.revenueVsExpense;
  const revenueYtd = sum(rev, 'revenue');
  const expenseYtd = sum(rev, 'expense');
  const surplus = revenueYtd - expenseYtd;
  const margin = round1(pct(surplus, revenueYtd));
  const bankTotal = sum(db.bankAccounts, 'balance');
  const salaries = (analytics.expenseByCategory.find((e) => e.key === 'Salaries & Wages') || { value: 0 }).value;
  const otherExpense = analytics.expenseByCategory.filter((e) => e.key !== 'Salaries & Wages').reduce((a, e) => a + e.value, 0);
  const tuition = (analytics.feeHeadSplit.find((f) => f.key === 'Tuition Fee') || { value: 0 }).value;
  const otherFees = analytics.feeHeadSplit.filter((f) => f.key !== 'Tuition Fee').reduce((a, f) => a + f.value, 0);
  const staffCostRatio = round1(pct(k.payrollMonthly * 12, revenueYtd));
  const boardClasses = analytics.classPerformance.filter((c) => ['Class IX', 'Class X', 'Class XI', 'Class XII'].includes(c.className));
  const donations = sum(db.alumni, 'donationTotal');
  const ageing = feeAgeing(null);

  return dashboardPage({
    greeting: head.greeting,
    subtitle: head.subtitle,
    route: 'dashboard/management',
    actions: quickActions(ctx, [
      { label: 'Board pack', icon: 'download', onClick: mockAction('Generate board pack') },
      { label: 'Profit & loss', icon: 'chart-line', route: 'finance/profit-loss' },
      { label: 'Budgets', icon: 'target', route: 'finance/budgets' },
    ]),
    kpis: [
      { label: 'Revenue YTD', value: money(revenueYtd, true), delta: deltaOf(sp.revenue), deltaLabel: 'vs last month', icon: 'trending-up', tone: 'success', trend: sp.revenue, route: 'finance/income' },
      { label: 'Expense YTD', value: money(expenseYtd, true), delta: deltaOf(sp.expense), deltaLabel: 'vs last month', deltaDir: 'up', icon: 'trending-down', tone: 'warning', trend: sp.expense, route: 'finance/expenses' },
      { label: 'Surplus', value: money(surplus, true), delta: 8.6, deltaLabel: 'vs plan', icon: 'banknote', tone: 'success', route: 'finance/profit-loss' },
      { label: 'Operating margin', value: `${margin}%`, delta: 1.9, deltaLabel: 'vs last year', icon: 'percent', tone: 'brand', route: 'finance/reports' },
      { label: 'Enrolment', value: formatNumber(k.activeStudents), delta: deltaOf(sp.students), deltaLabel: 'vs last month', icon: 'graduation-cap', tone: 'brand', trend: sp.students, route: 'students/all' },
      { label: 'Collection rate', value: `${k.collectionRate}%`, delta: deltaOf(sp.collection), deltaLabel: 'vs last month', icon: 'wallet', tone: k.collectionRate >= 85 ? 'success' : 'warning', trend: sp.collection, route: 'fees/reports' },
      { label: 'Staff cost ratio', value: `${staffCostRatio}%`, delta: -1.4, deltaLabel: 'vs last year', icon: 'briefcase', tone: 'info', route: 'hr/payroll-runs' },
      { label: 'Cash at bank', value: money(bankTotal, true), delta: 4.2, deltaLabel: 'vs last month', icon: 'building-columns', tone: 'success', route: 'finance/bank-accounts' },
    ],
    widgets: [
      {
        span: 8,
        render: () => widget({ title: 'How the surplus was built', subtitle: 'Opening reserves to closing position, year to date', icon: 'chart-bar', viewAll: 'finance/profit-loss', className: 'chart-card' },
          waterfallChart({
            items: [
              { label: 'Opening reserves', value: bankTotal, type: 'start' },
              { label: 'Tuition fees', value: tuition },
              { label: 'Other fees', value: otherFees },
              { label: 'Salaries', value: -salaries },
              { label: 'Operations', value: -otherExpense },
              { label: 'Closing position', value: bankTotal + tuition + otherFees - salaries - otherExpense, type: 'total' },
            ],
            valueFormat: 'currencyCompact', height: 320, title: 'Surplus bridge',
          })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Collection against billing', subtitle: 'Per campus, year to date', icon: 'target', viewAll: 'fees/reports', className: 'chart-card' },
          bulletChart({
            items: stats.map((c) => ({
              label: c.short, value: c.collected, target: c.dueToDate,
              ranges: [c.dueToDate * 0.6, c.dueToDate * 0.85, c.billed],
            })),
            valueFormat: 'currencyCompact', height: 320, title: 'Collection against billing',
          })),
      },

      {
        span: 6,
        render: () => rangedChart({
          title: 'Fee collection against target',
          subtitle: 'Monthly billing plan vs money actually banked',
          icon: 'wallet', viewAll: 'fees/reports',
          ranges: [{ id: 'q', label: 'Quarter' }, { id: 'h', label: 'Half year' }, { id: 'y', label: 'Full year' }],
          build: (r) => {
            const src = analytics.feeCollectionVsTarget;
            const rows = r === 'q' ? src.slice(0, 3) : r === 'h' ? src.slice(0, 6) : src;
            return comboChart({
              categories: rows.map((x) => x.month),
              bars: [{ name: 'Collected', values: rows.map((x) => x.collected) }],
              line: { name: 'Target', values: rows.map((x) => x.target) },
              valueFormat: 'currencyCompact', height: 300, title: 'Collection vs target',
            });
          },
        }),
      },

      {
        span: 6,
        render: () => widget({ title: 'Outstanding fee ageing', subtitle: 'Debtor days across the group', icon: 'alert-circle', viewAll: 'fees/outstanding', className: 'chart-card' },
          barChart({
            categories: ageing.map((b) => b.label),
            series: [{ name: 'Outstanding', values: ageing.map((b) => b.value) }],
            showValues: true, valueFormat: 'currencyCompact', height: 300, title: 'Outstanding by ageing bucket',
          }),
          h('div', { className: 'mt-3' }, tileGrid(ageing.map((b) => ({
            label: b.label, value: formatNumber(b.count), sub: money(b.value, true),
            tone: b.min >= 61 ? 'danger' : b.min >= 1 ? 'warning' : 'default', route: 'fees/outstanding',
          }))))),
      },

      {
        span: 4,
        render: () => widget({ title: 'Admission pipeline', subtitle: `${formatNumber(k.admissionEnquiries)} enquiries → ${formatNumber(k.admissionsConfirmed)} confirmed`, icon: 'workflow', viewAll: 'admissions/dashboard', className: 'chart-card' },
          funnelChart({ stages: analytics.admissionFunnel.map((s) => ({ label: s.stage, value: s.count })), showConversion: true, height: 320, title: 'Admission funnel' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Cost structure', subtitle: 'Expense mix, year to date', icon: 'chart-pie', viewAll: 'finance/expenses', className: 'chart-card' },
          pieChart({ data: analytics.expenseByCategory.map((e) => ({ key: e.key, value: e.value })), valueFormat: 'currencyCompact', height: 320, title: 'Expense by category' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Board exam readiness', subtitle: 'Senior school projection from the latest cycle', icon: 'certificate', viewAll: 'examination/performance', className: 'chart-card' },
          barChart({
            categories: boardClasses.map((c) => c.className),
            series: [
              { name: 'Average score', values: boardClasses.map((c) => c.average) },
              { name: 'Pass rate', values: boardClasses.map((c) => c.passPercent) },
            ],
            valueFormat: 'percent', target: 75, height: 320, title: 'Board exam readiness',
          })),
      },

      {
        span: 7,
        render: () => widget({ title: 'Campus contribution', subtitle: 'Enrolment, yield per student and service load', icon: 'building-columns', viewAll: 'reports/mis' },
          scoreTable([
            { label: 'Campus', render: (r) => Identity(r.short, `${r.city} · ${r.board}`) },
            { label: 'Students', num: true, render: (r) => formatNumber(r.students) },
            { label: 'Yield / student', num: true, render: (r) => money(r.students ? r.collected / r.students : 0) },
            { label: 'Collected', num: true, render: (r) => money(r.collected, true) },
            { label: 'Outstanding', num: true, render: (r) => h('span', { className: 't-danger' }, money(r.outstanding, true)) },
            { label: 'Capacity', num: true, render: (r) => `${r.fill}%` },
            { label: 'Tickets', num: true, render: (r) => Badge(String(r.complaints), { tone: r.complaints > 25 ? 'danger' : 'neutral' }) },
          ], sortBy(stats, 'collected', 'desc'), { onRowClick: () => navigate('reports/mis') })),
      },

      {
        span: 5,
        render: () => widget({ title: 'Strategic risks', subtitle: 'What the board should discuss this month', icon: 'siren', viewAll: 'complaints/escalations' },
          alertsPanel(groupRisks(stats).slice(0, 6))),
      },

      {
        span: 6,
        render: () => widget({ title: 'Capital approvals', subtitle: 'Purchase orders above the delegated limit', icon: 'stamp', viewAll: 'finance/purchase-orders' },
          approvalsPanel({
            rows: sortBy(db.purchaseOrders.filter((p) => p.status === 'Pending Approval'), 'total', 'desc'),
            avatar: (r) => r.vendorName,
            title: (r) => `${r.vendorName} — ${money(r.total)}`,
            meta: (r) => `${r.poNumber} · ${r.department} · ${campusName(r.campusId)} · GST ${r.gst}%`,
            side: (r) => Badge(r.grnReceived ? 'GRN received' : 'Awaiting goods', { tone: r.grnReceived ? 'success' : 'warning' }),
            onApprove: (r) => notify({ title: 'Capital spend approved', text: `${r.poNumber} · ${money(r.total)}`, tone: 'success' }),
          })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Budget utilisation', subtitle: `${analytics.budgetUtilisation.length} heads · ${AY_LABEL}`, icon: 'target', viewAll: 'finance/budgets' },
          DataTable({
            rows: sortBy(analytics.budgetUtilisation, 'utilisation', 'desc'),
            paginate: false, searchable: false, columnToggle: false, exportable: true, exportName: 'budget-utilisation', maxHeight: 'none',
            columns: [
              { key: 'head', label: 'Budget head', render: (r) => h('span', { className: 't-medium' }, r.head) },
              { key: 'allocated', label: 'Allocated', numeric: true, align: 'right', render: (r) => money(r.allocated, true) },
              { key: 'spent', label: 'Spent', numeric: true, align: 'right', render: (r) => money(r.spent, true) },
              {
                key: 'utilisation', label: 'Utilisation', width: 150, numeric: true, align: 'right',
                render: (r) => h('div', { className: 'stack-1' },
                  h('div', { className: 't-xs t-num t-right' }, `${r.utilisation}%`),
                  ProgressBar(r.utilisation, { size: 'sm', tone: r.utilisation > 90 ? 'danger' : r.utilisation > 70 ? 'warning' : 'success' })),
              },
              { key: 'status', label: 'Status', width: 120, render: (r) => Badge(r.status) },
            ],
            onRowClick: () => navigate('finance/budgets'),
          })),
      },

      {
        span: 4,
        render: () => widget({ title: 'People at a glance', subtitle: 'Headcount, cost and engagement', icon: 'briefcase', viewAll: 'hr/reports' },
          tileGrid([
            { label: 'Staff on roll', value: formatNumber(k.totalStaff), sub: `${k.teachingStaff} teaching`, route: 'hr/employees' },
            { label: 'Monthly payroll', value: money(k.payrollMonthly, true), sub: `${db.payrollRuns.length} runs this year`, tone: 'brand', route: 'hr/payroll-runs' },
            { label: 'Attrition', value: `${round1(pct(db.resignations.length, db.staff.length))}%`, sub: `${db.resignations.length} exits YTD`, tone: 'warning', route: 'hr/resignations' },
            { label: 'Open positions', value: String(db.recruitments.filter((r) => r.status !== 'Closed').length), sub: `${sum(db.recruitments, 'openings')} seats`, tone: 'info', route: 'hr/recruitment' },
            { label: 'Staff attendance', value: `${k.avgStaffAttendance}%`, sub: 'rolling average', tone: 'success', route: 'hr/attendance' },
            { label: 'Training spend', value: money(sum(db.trainings, 'cost'), true), sub: `${db.trainings.length} programmes`, route: 'hr/training' },
          ])),
      },

      {
        span: 4,
        render: () => widget({ title: 'Group activity', subtitle: 'Finance, HR and admissions changes across all campuses', icon: 'activity', viewAll: 'system/audit-logs' },
          auditFeed(['fees', 'finance', 'hr', 'admissions', 'reports'], null, 8)),
      },

      {
        span: 4,
        render: () => widget({ title: 'Alumni and giving', subtitle: `${formatNumber(db.alumni.length)} alumni on record`, icon: 'award', viewAll: 'alumni/donations' },
          tileGrid([
            { label: 'Lifetime giving', value: money(donations, true), sub: `${db.alumni.filter((a) => a.donationTotal > 0).length} donors`, tone: 'success', route: 'alumni/donations' },
            { label: 'Mentors available', value: formatNumber(db.alumni.filter((a) => a.mentorAvailable).length), sub: 'career mentoring pool', tone: 'info', route: 'alumni/careers' },
            { label: 'Verified profiles', value: `${round1(pct(db.alumni.filter((a) => a.verified).length, db.alumni.length))}%`, sub: 'contactable records', route: 'alumni/directory' },
            { label: 'Events attended', value: formatNumber(sum(db.alumni, 'eventsAttended')), sub: 'cumulative touchpoints', route: 'alumni/events' },
          ]),
          h('div', { className: 'mt-3' }, RankList(sortBy(db.alumni.filter((a) => a.donationTotal > 0), 'donationTotal', 'desc').slice(0, 5).map((a) => ({
            name: a.name, meta: `${a.batchLabel} · ${a.designation}, ${a.currentCompany}`, value: money(a.donationTotal, true),
          }))))),
      },

      {
        span: 4,
        render: () => widget({ title: 'Governance calendar', subtitle: 'Dates the trust needs to hold', icon: 'calendar-check', viewAll: 'events/calendar' },
          upcomingList(null, 6)),
      },
    ],
  });
}

/* ============================================ 4 · PRINCIPAL / VP ===== */

function buildPrincipal(ctx) {
  const campusId = ctx.state.campusId;
  const head = headerFor(ctx, store.isRole('vice-principal') ? 'Vice principal dashboard' : 'Principal dashboard');
  const students = scope(db.students, campusId).filter((s) => s.status === 'Active');
  const staff = scope(db.staff, campusId).filter((s) => s.status === 'Active');
  const teachers = staff.filter((s) => s.type === 'Teaching');
  const sp = analytics.sparks;

  const attPct = round1(avg(students, 'attendancePct'));
  const perf = round1(avg(students, 'lastExamPercent'));
  const billed = sum(students, 'feeTotal');       // whole session
  const dueToDate = sum(students, 'feeBilled');   // instalments already payable
  const collected = sum(students, 'feePaid');
  const due = sum(students, 'feeDue');
  const overdue = sum(students, 'feeOverdue');
  const risk = atRiskStudents(campusId);
  const below75 = students.filter((s) => num(s.attendancePct) < 75);
  const openTickets = scope(db.complaints, campusId).filter((c) => !['Resolved', 'Closed'].includes(c.status));
  const pendingLeave = scope(db.leaveRequests, campusId).filter((l) => l.status === 'Pending');
  const pendingStudentLeave = scope(db.studentLeaveRequests, campusId).filter((l) => l.status === 'Pending');
  const subs = scope(db.substitutions, campusId);
  const subsPending = subs.filter((s) => s.status === 'Pending');
  const marking = dayRows(scope(db.attendance, campusId), 'date');
  const sectionsHere = scope(db.sections, campusId);
  const examsAhead = scope(db.exams, campusId).filter((e) => e.date >= TODAY && e.status !== 'Results Published');

  const scatterPoints = teachers.slice(0, 120).map((t) => ({
    x: num(t.weeklyPeriods), y: num(t.appraisalScore), label: `${t.name} · ${t.designation}`,
    group: t.isClassTeacher ? 'Class teachers' : 'Subject teachers', size: Math.max(4, num(t.experienceYears) / 3),
  }));

  return dashboardPage({
    greeting: head.greeting,
    subtitle: head.subtitle,
    route: 'dashboard/principal',
    actions: quickActions(ctx, [
      { label: 'Publish circular', icon: 'scroll', route: 'communication/circulars' },
      { label: 'Mark attendance', icon: 'clipboard-check', route: 'attendance/mark-daily' },
      { label: 'Performance analysis', icon: 'chart-line', route: 'examination/performance' },
    ]),
    kpis: [
      { label: 'Students on roll', value: formatNumber(students.length), delta: deltaOf(sp.students), deltaLabel: 'vs last month', icon: 'graduation-cap', tone: 'brand', trend: sp.students, route: 'students/all' },
      { label: 'Attendance', value: `${attPct}%`, delta: deltaOf(sp.attendance), deltaLabel: 'vs last month', icon: 'clipboard-check', tone: attPct >= 90 ? 'success' : 'warning', trend: sp.attendance, route: 'attendance/reports' },
      { label: 'Staff attendance', value: `${round1(avg(staff, 'attendancePct'))}%`, delta: deltaOf(sp.staffAttendance), deltaLabel: 'vs last month', icon: 'briefcase', tone: 'success', trend: sp.staffAttendance, route: 'hr/attendance' },
      { label: 'Average score', value: `${perf}%`, delta: 2.3, deltaLabel: 'vs last cycle', icon: 'chart-line', tone: 'info', route: 'examination/performance' },
      { label: 'Fee collected', value: money(collected, true), delta: deltaOf(sp.collection), deltaLabel: 'vs last month', icon: 'wallet', tone: 'success', trend: sp.collection, route: 'fees/reports' },
      { label: 'Fee outstanding', value: money(due, true), delta: deltaOf(sp.outstanding), deltaDir: 'down', deltaLabel: 'vs last month', icon: 'alert-circle', tone: 'danger', trend: sp.outstanding, route: 'fees/outstanding' },
      { label: 'Students at risk', value: formatNumber(risk.length), delta: -4.1, deltaLabel: 'vs last month', icon: 'alert-triangle', tone: 'warning', route: 'attendance/defaulters' },
      { label: 'Awaiting my approval', value: formatNumber(pendingLeave.length + pendingStudentLeave.length + subsPending.length), deltaLabel: 'leave, substitution', icon: 'inbox', tone: 'brand', route: 'hr/leave-requests' },
    ],
    widgets: [
      {
        span: 8,
        render: () => rangedChart({
          title: 'Attendance trend against the 90% board target',
          subtitle: 'Students and staff, month by month',
          icon: 'clipboard-check', viewAll: 'attendance/reports',
          ranges: [{ id: 'both', label: 'Students + staff' }, { id: 'students', label: 'Students' }, { id: 'staff', label: 'Staff' }],
          build: (r) => {
            const src = analytics.attendanceTrend;
            const series = [];
            if (r !== 'staff') series.push({ name: 'Students', values: src.map((x) => x.students) });
            if (r !== 'students') series.push({ name: 'Staff', values: src.map((x) => x.staff) });
            return lineChart({
              categories: src.map((x) => x.month), series, target: 90, targetLabel: 'Board target',
              valueFormat: 'percent', showDots: true, height: 300, minY: 70, maxY: 100,
              title: 'Attendance trend',
            });
          },
        }),
      },

      {
        span: 4,
        render: () => widget({ title: 'Attendance register status', subtitle: asOf(marking), icon: 'clipboard-list', viewAll: 'attendance/class-wise' },
          h('div', { className: 'row', style: { justifyContent: 'center' } },
            progressRing(pct(marking.rows.length, sectionsHere.length || 1), {
              size: 132, label: 'Registers submitted', sublabel: `${marking.rows.length} of ${sectionsHere.length} sections`,
            })),
          h('div', { className: 'mt-3' }, tileGrid([
            { label: 'Present', value: formatNumber(sum(marking.rows, 'present')), tone: 'success', route: 'attendance/class-wise' },
            { label: 'Absent', value: formatNumber(sum(marking.rows, 'absent')), tone: 'danger', route: 'attendance/class-wise' },
            { label: 'Late', value: formatNumber(sum(marking.rows, 'late')), tone: 'warning', route: 'attendance/late-early' },
            { label: 'On leave', value: formatNumber(sum(marking.rows, 'leave')), tone: 'info', route: 'attendance/leave-requests' },
          ]))),
      },

      {
        span: 6,
        render: () => rangedChart({
          title: 'Performance by class',
          subtitle: 'Latest completed assessment cycle',
          icon: 'chart-bar', viewAll: 'examination/performance',
          ranges: [{ id: 'avg', label: 'Average' }, { id: 'pass', label: 'Pass rate' }, { id: 'dist', label: 'Distinctions' }],
          build: (r) => {
            const src = analytics.classPerformance;
            const key = r === 'avg' ? 'average' : r === 'pass' ? 'passPercent' : 'distinctions';
            return barChart({
              categories: src.map((c) => c.className),
              series: [{ name: r === 'dist' ? 'Distinctions' : r === 'pass' ? 'Pass rate' : 'Average score', values: src.map((c) => c[key]) }],
              valueFormat: r === 'dist' ? 'number' : 'percent',
              target: r === 'dist' ? undefined : r === 'pass' ? 95 : 70,
              height: 300, title: 'Performance by class',
            });
          },
        }),
      },

      {
        span: 6,
        render: () => widget({ title: 'Class × subject performance', subtitle: 'Average score, senior school', icon: 'grid', viewAll: 'examination/performance', className: 'chart-card' },
          heatmap({
            mode: 'matrix',
            rows: analytics.performanceMatrix.rows,
            cols: analytics.performanceMatrix.cols,
            values: analytics.performanceMatrix.values,
            valueFormat: 'percent0', height: 300, title: 'Class by subject performance',
          }),
          h('div', { className: 'mt-3' }, ScaleLegend(50, 100, { format: 'percent0' }))),
      },

      {
        span: 4,
        render: () => widget({ title: 'Top of the school', subtitle: 'Highest scorers this cycle', icon: 'trophy', viewAll: 'examination/merit-list' },
          RankList(analytics.topPerformers.slice(0, 8).map((t) => ({
            name: t.name, meta: `${t.className} ${t.section} · ${t.house} House · CGPA ${t.cgpa}`, value: `${t.percent}%`,
          })))),
      },

      {
        span: 8,
        render: () => widget({ title: 'Students needing intervention', subtitle: `${formatNumber(risk.length)} flagged on attendance, marks, fees or conduct`, icon: 'alert-triangle', viewAll: 'attendance/defaulters' },
          risk.length ? DataTable({
            rows: risk.slice(0, 40),
            pageSize: 8, searchable: true, searchKeys: ['name', 'admissionNo', 'className'],
            searchPlaceholder: 'Search flagged students…', exportName: 'students-at-risk', maxHeight: 'none',
            columns: [
              { key: 'name', label: 'Student', sticky: true, width: 220, render: (r) => Identity(r.name, `${r.admissionNo} · ${r.className} ${r.section}`), value: (r) => r.name },
              { key: 'attendancePct', label: 'Attendance', numeric: true, align: 'right', width: 110, render: (r) => h('span', { className: num(r.attendancePct) < 75 ? 't-danger t-num' : 't-num' }, `${r.attendancePct}%`) },
              { key: 'lastExamPercent', label: 'Last exam', numeric: true, align: 'right', width: 100, render: (r) => `${r.lastExamPercent}%` },
              { key: 'feeDue', label: 'Fee due', numeric: true, align: 'right', width: 120, render: (r) => (num(r.feeDue) ? h('span', { className: 't-danger t-num' }, money(r.feeDue)) : '—') },
              { key: 'flags', label: 'Flags', width: 260, sortable: false, render: (r) => h('div', { className: 'row-wrap', style: { gap: '4px' } }, r.flags.map((f) => Tag(f))) },
              { key: 'riskScore', label: 'Risk', numeric: true, align: 'right', width: 90, render: (r) => Badge(r.riskScore >= 60 ? 'High' : r.riskScore >= 35 ? 'Medium' : 'Low', { tone: r.riskScore >= 60 ? 'danger' : r.riskScore >= 35 ? 'warning' : 'info' }) },
            ],
            rowActions: (r) => [
              { label: 'Open 360 profile', icon: 'eye', route: `students/profile/${r.id}` },
              { label: 'Message parent', icon: 'send', onClick: mockAction('Message parent') },
              { label: 'Log counselling note', icon: 'notebook', onClick: mockAction('Counselling note') },
            ],
            onRowClick: (r) => navigate(`students/profile/${r.id}`),
          }) : EmptyState({ icon: 'check-circle', tone: 'success', title: 'No students flagged', text: 'Every student is above the attendance, academic and conduct thresholds.' })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Staff leave awaiting approval', subtitle: `${pendingLeave.length} requests · substitution impact shown`, icon: 'calendar', viewAll: 'hr/leave-requests' },
          approvalsPanel({
            rows: sortBy(pendingLeave, 'fromDate', 'asc'),
            avatar: (r) => r.employeeName,
            title: (r) => `${r.employeeName} — ${r.leaveType}`,
            meta: (r) => `${r.designation} · ${formatDate(r.fromDate, 'dayMonth')}–${formatDate(r.toDate, 'dayMonth')} · ${r.days} day(s) · ${r.reason}`,
            side: (r) => Badge(r.substituteArranged ? 'Cover arranged' : 'No cover', { tone: r.substituteArranged ? 'success' : 'warning' }),
            onApprove: (r) => notify({ title: 'Leave approved', text: `${r.employeeName} · ${r.days} day(s)`, tone: 'success' }),
          })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Substitution cover for today', subtitle: `${subs.length} substitutions this session · ${subsPending.length} unconfirmed`, icon: 'refresh-ccw', viewAll: 'timetable/substitution' },
          subs.length ? h('div', { className: 'stack-3' },
            stackedProgressBar({
              segments: [
                { label: 'Confirmed', value: subs.filter((s) => s.status === 'Confirmed').length, color: STATUS.good },
                { label: 'Pending', value: subsPending.length, color: STATUS.warning },
                { label: 'Declined', value: subs.filter((s) => s.status === 'Declined').length, color: STATUS.critical },
              ],
              barHeight: 14, showLegend: true, title: 'Substitution cover',
            }),
            h('div', { className: 'dash-rows' }, sortBy(subs, 'date', 'desc').slice(0, 5).map((s) => h('div', { className: 'dash-row' },
              Avatar(s.substituteTeacherName || s.absentTeacherName, { size: 'sm' }),
              h('div', { className: 'dash-row-main' },
                h('div', { className: 'dash-row-title' }, `${s.className} ${s.section} · Period ${s.periodNo} · ${s.subjectName}`),
                h('div', { className: 'dash-row-meta' }, `${s.absentTeacherName} away (${s.reason}) → ${s.substituteTeacherName} · ${formatDate(s.date, 'medium')}`)),
              Badge(s.status))))) : EmptyState({ icon: 'refresh-ccw', title: 'No substitutions logged', text: 'Every period today is being taken by its own teacher.' })),
      },

      {
        span: 5,
        render: () => widget({ title: 'Teacher load vs appraisal', subtitle: 'Weekly periods against appraisal score', icon: 'gauge', viewAll: 'teachers/workload', className: 'chart-card' },
          scatterPlot({
            points: scatterPoints, xLabel: 'Weekly periods', yLabel: 'Appraisal score',
            height: 300, title: 'Teacher workload vs appraisal',
          })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Subject strengths and gaps', subtitle: 'Average, highest and lowest by subject', icon: 'book-open', viewAll: 'examination/performance', className: 'chart-card' },
          barChart({
            categories: analytics.subjectPerformance.map((s) => s.subject),
            series: [
              { name: 'Average', values: analytics.subjectPerformance.map((s) => s.average) },
              { name: 'Pass rate', values: analytics.subjectPerformance.map((s) => s.passPercent) },
            ],
            horizontal: true, valueFormat: 'percent', height: 300, title: 'Subject performance',
          })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Campus pulse', subtitle: 'Numbers behind the headlines', icon: 'activity', viewAll: 'reports/centre' },
          tileGrid([
            { label: 'Sections', value: formatNumber(sectionsHere.length), sub: `${scope(db.classes, campusId).length} classes`, route: 'academics/sections' },
            { label: 'Below 75%', value: formatNumber(below75.length), tone: 'danger', sub: 'attendance defaulters', route: 'attendance/defaulters' },
            { label: 'Open tickets', value: formatNumber(openTickets.length), tone: 'warning', sub: `${openTickets.filter((c) => c.slaBreached).length} breached`, route: 'complaints/all' },
            { label: 'Exams ahead', value: formatNumber(examsAhead.length), tone: 'info', sub: 'scheduled papers', route: 'examination/schedule' },
            { label: 'Teachers', value: formatNumber(teachers.length), sub: `${round1(students.length / (teachers.length || 1))}:1 ratio`, route: 'teachers/directory' },
            { label: 'Collection', value: `${round1(pct(dueToDate - overdue, dueToDate))}%`, tone: round1(pct(dueToDate - overdue, dueToDate)) >= 85 ? 'success' : 'warning', sub: 'of fees due to date', route: 'fees/reports' },
          ])),
      },

      {
        span: 6,
        render: () => widget({ title: 'Student leave requests', subtitle: `${pendingStudentLeave.length} awaiting a decision`, icon: 'inbox', viewAll: 'attendance/leave-requests' },
          approvalsPanel({
            rows: sortBy(pendingStudentLeave, 'fromDate', 'asc'),
            avatar: (r) => r.studentName,
            title: (r) => `${r.studentName} — ${r.type} leave`,
            meta: (r) => `${r.className} ${r.section} · ${formatDate(r.fromDate, 'dayMonth')}–${formatDate(r.toDate, 'dayMonth')} · ${r.reason}`,
            side: (r) => Badge(`${r.days}d`, { tone: 'neutral' }),
            onApprove: (r) => notify({ title: 'Leave approved', text: `${r.studentName} · ${r.days} day(s)`, tone: 'success' }),
          })),
      },

      {
        span: 7,
        render: () => widget({ title: 'August at a glance', subtitle: 'Events, holidays, exams and PTM windows', icon: 'calendar', viewAll: 'events/calendar', viewAllLabel: 'Full calendar' },
          monthCalendar(campusId)),
      },

      {
        span: 6,
        render: () => widget({ title: 'On my desk this morning', subtitle: 'Campus exceptions ranked by severity', icon: 'siren', viewAll: 'complaints/escalations' },
          alertsPanel(principalAlerts({
            campusId, students, staff, teachers, below75, openTickets, pendingLeave,
            pendingStudentLeave, subsPending, marking, sectionsHere, examsAhead, risk, dueToDate, overdue,
          }))),
      },

      {
        span: 6,
        render: () => widget({ title: 'What changed on my campus', subtitle: 'Live feed from the audit trail', icon: 'activity', viewAll: 'system/audit-logs' },
          auditFeed(null, campusId, 8)),
      },

      {
        span: 5,
        render: () => widget({ title: 'Circulars in force', subtitle: 'Published to staff and parents', icon: 'scroll', viewAll: 'communication/circulars' },
          noticeList(campusId),
          h('div', { className: 'mt-4' }, upcomingList(campusId, 4))),
      },
    ],
  });
}

/**
 * The head's exception list: registers not in, children slipping, decisions
 * queued behind them, fees not banked and tickets past SLA — each one counted
 * off the same rows the linked screen lists.
 */
function principalAlerts(c) {
  const out = [];
  const unmarked = Math.max(0, c.sectionsHere.length - c.marking.rows.length);
  const breached = c.openTickets.filter((t) => t.slaBreached);
  const failing = c.students.filter((s) => num(s.lastExamPercent) < 40);
  const onNotice = c.staff.filter((s) => s.status === 'Notice Period');
  const docsMissing = c.staff.filter((s) => !s.documentsComplete);
  const collection = round1(pct(c.dueToDate - c.overdue, c.dueToDate));

  if (unmarked > 0) {
    out.push({
      severity: unmarked > c.sectionsHere.length * 0.15 ? 'high' : 'medium', icon: 'clipboard-list',
      title: `${unmarked} of ${c.sectionsHere.length} registers are not in yet`,
      text: `${asOf(c.marking)}. Attendance closes at 10:00; unmarked sections default to the previous day.`,
      badge: Badge('Attendance', { tone: 'warning' }), route: 'attendance/class-wise',
    });
  }
  if (c.below75.length) {
    out.push({
      severity: c.below75.length > c.students.length * 0.05 ? 'critical' : 'high', icon: 'user-x',
      title: `${formatNumber(c.below75.length)} students are below the 75% board minimum`,
      text: `That is ${round1(pct(c.below75.length, c.students.length))}% of the roll. Each needs a written intervention plan on file before the half-yearly.`,
      badge: Badge('Academics', { tone: 'danger' }), route: 'attendance/defaulters',
    });
  }
  if (breached.length) {
    out.push({
      severity: breached.length > 8 ? 'high' : 'medium', icon: 'timer',
      title: `${breached.length} complaints have breached their SLA`,
      text: `Of ${c.openTickets.length} open tickets on this campus. Oldest is ${Math.round(Math.max(...breached.map((t) => num(t.ageHours)), 0) / 24)} days old.`,
      badge: Badge('Service', { tone: 'warning' }), route: 'complaints/escalations',
    });
  }
  const queue = c.pendingLeave.length + c.pendingStudentLeave.length + c.subsPending.length;
  if (queue) {
    out.push({
      severity: queue > 25 ? 'high' : 'medium', icon: 'inbox',
      title: `${queue} decisions are queued behind me`,
      text: `${c.pendingLeave.length} staff leave · ${c.pendingStudentLeave.length} student leave · ${c.subsPending.length} unconfirmed substitutions.`,
      badge: Badge('Approvals', { tone: 'warning' }), route: 'hr/leave-requests',
    });
  }
  if (collection < 90) {
    out.push({
      severity: collection < 80 ? 'high' : 'medium', icon: 'wallet',
      title: `${collection}% of fees due to date have been banked`,
      text: `${money(c.overdue, true)} is past its due date across ${formatNumber(c.students.filter((s) => num(s.feeOverdue) > 0).length)} families.`,
      badge: Badge('Finance', { tone: 'warning' }), route: 'fees/outstanding',
    });
  }
  if (failing.length) {
    out.push({
      severity: 'high', icon: 'trending-down',
      title: `${failing.length} students scored below the pass mark last cycle`,
      text: `${c.risk.length} students in total carry an academic, attendance, fee or conduct flag.`,
      badge: Badge('Academics', { tone: 'danger' }), route: 'examination/performance',
    });
  }
  if (c.examsAhead.length) {
    out.push({
      severity: 'low', icon: 'file-text',
      title: `${c.examsAhead.length} papers are scheduled and not yet run`,
      text: 'Question papers, invigilation rosters and hall allocation must be signed a week before the first paper.',
      badge: Badge('Examinations', { tone: 'info' }), route: 'examination/schedule',
    });
  }
  if (onNotice.length || docsMissing.length) {
    out.push({
      severity: 'medium', icon: 'briefcase',
      title: `${onNotice.length} staff on notice · ${docsMissing.length} personnel files incomplete`,
      text: `Teaching cover and document compliance both sit with HR. Student:teacher ratio is ${round1(c.students.length / (c.teachers.length || 1))}:1.`,
      badge: Badge('People', { tone: 'warning' }), route: 'hr/employees',
    });
  }
  if (!out.length) {
    out.push({
      severity: 'info', icon: 'check-circle', title: 'Nothing needs escalating',
      text: 'Registers are in, no student is below threshold, the approval queue is clear and fees are on plan.',
      badge: Badge('All clear', { tone: 'success' }), route: 'reports/centre',
    });
  }
  return out;
}

/* ============================================== 5 · TEACHER ========== */

/** Deterministically pick the teacher whose Thursday is busiest. */
function pickTeacher(campusId) {
  return memo(`teacher:${campusId || 'ALL'}`, () => {
    const pool = scope(db.staff, campusId).filter((s) => s.type === 'Teaching' && s.status === 'Active');
    const src = (pool.filter((s) => s.isClassTeacher).length ? pool.filter((s) => s.isClassTeacher) : pool);
    let best = src[0] || db.staff[0];
    let bestN = -1;
    for (const s of src.slice(0, 40)) {
      const n = db.timetableSlots.filter((t) => t.teacherId === s.id && t.day === TODAY_DOW).length;
      if (n > bestN) { bestN = n; best = s; }
    }
    return best;
  });
}

function buildTeacher(ctx) {
  const campusId = ctx.state.campusId;
  const me = pickTeacher(campusId);
  if (!me) return missingRecord('teacher record', 'teachers/directory');

  const allSlots = db.timetableSlots.filter((t) => t.teacherId === me.id);
  const todaySlots = sortBy(allSlots.filter((t) => t.day === TODAY_DOW), 'periodNo');
  const sectionIds = Array.from(new Set(allSlots.map((s) => s.sectionId)));
  const pairs = new Set(allSlots.map((s) => `${s.sectionId}|${s.subjectCode}`));
  const myStudents = db.students.filter((s) => sectionIds.includes(s.sectionId));
  const myHomework = db.homework.filter((hw) => pairs.has(`${hw.sectionId}|${hw.subjectCode}`));
  const openHomework = myHomework.filter((hw) => hw.status === 'Open');
  const hwIds = new Set(myHomework.map((hw) => hw.id));
  const mySubmissions = db.submissions.filter((s) => hwIds.has(s.homeworkId));
  const toGrade = mySubmissions.filter((s) => s.status === 'Submitted');
  const myExams = db.exams.filter((e) => e.invigilatorId === me.id && e.date >= '2026-06-01');
  const myPtm = db.ptmSlots.filter((p) => p.teacherId === me.id);
  const myBookings = db.ptmBookings.filter((p) => p.teacherId === me.id && p.status === 'Confirmed');
  const mySubs = db.substitutions.filter((s) => s.substituteTeacherId === me.id || s.absentTeacherId === me.id);
  const myDoubts = db.doubts.filter((d) => d.status !== 'Answered' && me.subjects.some((sub) => String(d.subject).toLowerCase().startsWith(String(sub).slice(0, 3).toLowerCase())));
  const risk = myStudents.filter((s) => num(s.attendancePct) < 75 || num(s.lastExamPercent) < 40);
  const classTeacherSection = me.classTeacherOf ? byId(db.sections, me.classTeacherOf) : null;
  const marking = dayRows(db.attendance.filter((a) => sectionIds.includes(a.sectionId)), 'date');
  const markedToday = new Set(marking.rows.map((r) => r.sectionId));
  // Leave applications from the children this teacher actually stands in front
  // of — a class teacher signs these off before the register can be corrected.
  const myLeaveQueue = db.studentLeaveRequests.filter((l) => l.status === 'Pending'
    && myStudents.some((s) => s.id === l.studentId));
  const classroomFeed = (() => {
    const rows = [];
    for (const sub of sortBy(mySubmissions.filter((x) => x.submittedOn), 'submittedOn', 'desc').slice(0, 6)) {
      rows.push({
        name: sub.studentName,
        text: `${sub.status === 'Graded' ? 'graded' : 'submitted'} · ${sub.homeworkTitle}${sub.marks != null ? ` — ${sub.marks}/${sub.maxMarks}` : ''}`,
        time: `${relativeTime(sub.submittedOn)} · ${sub.className} ${sub.section}`,
        tone: sub.late ? 'warning' : sub.status === 'Graded' ? 'success' : 'info',
      });
    }
    for (const d of sortBy(myDoubts, 'askedOn', 'desc').slice(0, 3)) {
      rows.push({ name: d.studentName, text: `asked · ${d.question}`, time: `${relativeTime(d.askedOn)} · ${d.subject}`, tone: d.status === 'Escalated' ? 'danger' : 'info' });
    }
    for (const a of sortBy(marking.rows, 'markedAt', 'desc').slice(0, 3)) {
      rows.push({
        name: a.markedByName || 'Class teacher',
        text: `marked the register · ${a.sectionLabel || a.sectionId} — ${a.present}/${a.strength} present${a.absent ? `, ${a.absent} away` : ''}`,
        time: `${relativeTime(a.markedAt)} · ${a.percent}%`,
        tone: a.percent < 85 ? 'warning' : 'success',
      });
    }
    return rows.slice(0, 10);
  })();

  const todaySections = Array.from(new Set(todaySlots.map((s) => s.sectionId))).map((sid) => {
    const slot = todaySlots.find((s) => s.sectionId === sid);
    const strength = db.students.filter((s) => s.sectionId === sid).length;
    return { sectionId: sid, label: `${slot.className} ${slot.section}`, room: slot.room, subject: slot.subjectName, strength, marked: markedToday.has(sid) };
  });

  const perDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    .map((d) => ({ day: d, count: allSlots.filter((s) => s.day === d).length }));

  const head = headerFor(ctx, me.isClassTeacher ? `Class teacher · ${classTeacherSection ? classTeacherSection.label : me.classTeacherOf}` : 'Teacher dashboard', me.designation);

  const markAttendance = (sec) => ConfirmDialog({
    title: `Mark attendance for ${sec.label}?`,
    text: `${sec.strength} students on roll. This opens the register pre-filled as all present so you only flag exceptions.`,
    confirmLabel: 'Open register', tone: 'brand', icon: 'clipboard-check',
  }).then((ok) => { if (ok) { notify({ title: `${sec.label} register opened`, text: `${sec.strength} students · ${sec.subject}`, tone: 'success' }); navigate('attendance/mark-daily'); } });

  return dashboardPage({
    greeting: head.greeting,
    subtitle: `${head.subtitle} · ${me.employeeCode}`,
    route: 'dashboard/teacher',
    actions: quickActions(ctx, [
      { label: 'Mark attendance', icon: 'clipboard-check', route: 'attendance/mark-daily' },
      { label: 'Assign homework', icon: 'clipboard-list', route: 'lms/homework' },
      { label: 'Enter marks', icon: 'edit', route: 'examination/marks-entry' },
    ]),
    kpis: [
      { label: 'Periods today', value: String(todaySlots.length), deltaLabel: `${allSlots.length} this week`, icon: 'calendar', tone: 'brand', route: 'timetable/teacher' },
      { label: 'Registers to mark', value: String(todaySections.filter((s) => !s.marked).length), deltaLabel: `${todaySections.length} classes today`, icon: 'clipboard-check', tone: todaySections.some((s) => !s.marked) ? 'warning' : 'success', route: 'attendance/mark-daily' },
      { label: 'Students taught', value: formatNumber(myStudents.length), deltaLabel: `${sectionIds.length} sections`, icon: 'users', tone: 'info', route: 'portals/teacher/students' },
      { label: 'Homework open', value: String(openHomework.length), deltaLabel: `${myHomework.length} assigned this term`, icon: 'clipboard-list', tone: 'brand', route: 'lms/homework' },
      { label: 'To grade', value: formatNumber(toGrade.length), deltaLabel: 'submissions waiting', icon: 'edit', tone: toGrade.length > 20 ? 'danger' : 'warning', route: 'lms/submissions' },
      { label: 'My attendance', value: `${me.attendancePct}%`, delta: 0.8, deltaLabel: 'vs last month', icon: 'user-check', tone: 'success', route: 'portals/teacher/attendance' },
      { label: 'Leave balance', value: String(num(me.leaveBalanceCL) + num(me.leaveBalanceSL) + num(me.leaveBalanceEL)), deltaLabel: `CL ${me.leaveBalanceCL} · SL ${me.leaveBalanceSL} · EL ${me.leaveBalanceEL}`, icon: 'calendar', tone: 'info', route: 'portals/teacher/leave' },
      { label: 'PTM booked', value: String(myBookings.length), deltaLabel: `${myPtm.filter((p) => p.status === 'Available').length} slots free`, icon: 'handshake', tone: 'brand', route: 'ptm/bookings' },
    ],
    widgets: [
      {
        span: 7,
        render: () => widget({
          title: `Today — ${formatDate(TODAY, 'weekday')}`,
          subtitle: `${todaySlots.length} teaching periods · ${me.weeklyPeriods} periods a week`,
          icon: 'calendar', viewAll: 'timetable/teacher', viewAllLabel: 'Full timetable',
        }, periodRail(todaySlots, {
          trailing: (slot, state) => (state === 'done'
            ? Badge('Done', { tone: 'neutral' })
            : Button('Mark', {
              size: 'sm', variant: state === 'now' ? 'primary' : 'secondary', icon: 'clipboard-check',
              onClick: () => markAttendance({ label: `${slot.className} ${slot.section}`, strength: db.students.filter((s) => s.sectionId === slot.sectionId).length, subject: slot.subjectName }),
            })),
        })),
      },

      {
        span: 5,
        render: () => widget({ title: 'Registers for today', subtitle: asOf(marking), icon: 'clipboard-check', viewAll: 'attendance/mark-daily' },
          todaySections.length ? h('div', { className: 'dash-rows' }, todaySections.map((sec) => h('div', { className: 'dash-row' },
            h('span', { className: 'dash-alert-ico', dataset: { sev: sec.marked ? 'low' : 'medium' }, html: icon(sec.marked ? 'check-circle' : 'clipboard-list', 15) }),
            h('div', { className: 'dash-row-main' },
              h('div', { className: 'dash-row-title' }, `${sec.label} · ${sec.subject}`),
              h('div', { className: 'dash-row-meta' }, `${sec.strength} students · Room ${sec.room}`)),
            h('div', { className: 'dash-row-acts' },
              sec.marked
                ? Badge('Submitted', { tone: 'success' })
                : Button('Mark all present', { size: 'sm', variant: 'primary', icon: 'check', onClick: () => markAttendance(sec) })))))
            : EmptyState({ icon: 'coffee', title: 'No classes to mark today', text: 'Your Thursday is free of teaching periods — a good day for lesson planning.', action: Button('Open lesson plans', { variant: 'secondary', icon: 'clipboard-list', route: 'teachers/lesson-plans' }) })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Homework I have set', subtitle: `${openHomework.length} open · ${myHomework.length} this term`, icon: 'clipboard-list', viewAll: 'lms/homework' },
          myHomework.length ? DataTable({
            rows: sortBy(myHomework, 'dueDate', 'desc').slice(0, 30),
            pageSize: 6, searchable: true, searchKeys: ['title', 'className', 'subjectName'], searchPlaceholder: 'Search homework…',
            exportName: 'my-homework', maxHeight: 'none',
            columns: [
              { key: 'title', label: 'Assignment', sticky: true, width: 220, render: (r) => Identity(r.title, `${r.className} ${r.section} · ${r.subjectName}`), value: (r) => r.title },
              { key: 'dueDate', label: 'Due', width: 130, render: (r) => h('span', { className: r.dueDate < TODAY && r.status === 'Open' ? 't-danger' : '' }, formatDate(r.dueDate, 'medium')) },
              {
                key: 'submitted', label: 'Submitted', width: 150, numeric: true, align: 'right',
                render: (r) => h('div', { className: 'stack-1' },
                  h('div', { className: 't-xs t-num t-right' }, `${r.submitted}/${r.totalStudents}`),
                  ProgressBar(pct(r.submitted, r.totalStudents), { size: 'sm' })),
              },
              { key: 'graded', label: 'Graded', numeric: true, align: 'right', width: 90, render: (r) => formatNumber(r.graded) },
              { key: 'avgScore', label: 'Avg', numeric: true, align: 'right', width: 90, render: (r) => `${r.avgScore}/${r.maxMarks}` },
              { key: 'status', label: 'Status', width: 100, render: (r) => Badge(r.status === 'Open' ? 'In progress' : 'Closed') },
            ],
            rowActions: () => [
              { label: 'Open submissions', icon: 'inbox', route: 'lms/submissions' },
              { label: 'Send reminder', icon: 'bell', onClick: mockAction('Send reminder') },
            ],
            onRowClick: () => navigate('lms/homework'),
          }) : EmptyState({ icon: 'clipboard-list', title: 'No homework set yet', text: 'Assign work to your sections and it will show up here with live submission counts.', action: Button('Assign homework', { variant: 'primary', icon: 'plus', route: 'lms/homework' }) })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Submissions waiting to be graded', subtitle: `${toGrade.length} of ${mySubmissions.length} submissions`, icon: 'inbox', viewAll: 'lms/submissions' },
          toGrade.length ? DataTable({
            rows: sortBy(toGrade, 'submittedOn', 'desc').slice(0, 30),
            pageSize: 6, searchable: true, searchKeys: ['studentName', 'homeworkTitle'], searchPlaceholder: 'Search submissions…',
            exportName: 'to-grade', maxHeight: 'none',
            columns: [
              { key: 'studentName', label: 'Student', sticky: true, width: 200, render: (r) => Identity(r.studentName, `${r.className} ${r.section}`), value: (r) => r.studentName },
              { key: 'homeworkTitle', label: 'Assignment', width: 220 },
              { key: 'submittedOn', label: 'Submitted', width: 130, render: (r) => relativeTime(r.submittedOn) },
              { key: 'late', label: 'Late', width: 90, render: (r) => (r.late ? Badge('Late', { tone: 'warning' }) : Badge('On time', { tone: 'success' })) },
              { key: 'maxMarks', label: 'Out of', numeric: true, align: 'right', width: 90 },
            ],
            rowActions: (r) => [
              { label: `Grade ${r.studentName}`, icon: 'edit', onClick: mockAction('Grade submission') },
              { label: 'Open student profile', icon: 'eye', route: `students/profile/${r.studentId}` },
            ],
            onRowClick: () => navigate('lms/submissions'),
          }) : EmptyState({ icon: 'check-circle', tone: 'success', title: 'Nothing to grade', text: 'Every submission handed in so far has been marked and returned.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Teaching load by day', subtitle: `${allSlots.length} periods a week`, icon: 'chart-bar', viewAll: 'timetable/teacher', className: 'chart-card' },
          barChart({
            categories: perDay.map((d) => d.day.slice(0, 3)),
            series: [{ name: 'Periods', values: perDay.map((d) => d.count) }],
            showValues: true, height: 260, valueFormat: 'number', title: 'Teaching load by day',
          })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Leave balance', subtitle: 'Entitlement remaining this year', icon: 'calendar', viewAll: 'portals/teacher/leave', className: 'chart-card' },
          radialBarChart({
            data: [
              { key: 'Casual', value: num(me.leaveBalanceCL), max: 12 },
              { key: 'Sick', value: num(me.leaveBalanceSL), max: 8 },
              { key: 'Earned', value: num(me.leaveBalanceEL), max: 15 },
            ],
            valueFormat: 'number', height: 260, title: 'Leave balance',
          }),
          h('div', { className: 'mt-3' }, MetricRow('Taken this year', `${me.leaveTakenYtd} days`))),
      },

      {
        span: 4,
        render: () => widget({ title: 'My students needing help', subtitle: `${risk.length} of ${myStudents.length} flagged`, icon: 'alert-triangle', viewAll: 'portals/teacher/students' },
          risk.length ? RankList(sortBy(risk, 'attendancePct', 'asc').slice(0, 6).map((s) => ({
            name: s.name, meta: `${s.className} ${s.section} · last exam ${s.lastExamPercent}%`, value: `${s.attendancePct}%`,
          }))) : EmptyState({ icon: 'check-circle', tone: 'success', title: 'Everyone is on track', text: 'No student in your sections is below the attendance or academic threshold.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Parent meetings', subtitle: `${myBookings.length} confirmed · ${myPtm.filter((p) => p.status === 'Available').length} slots open`, icon: 'handshake', viewAll: 'ptm/bookings' },
          myBookings.length ? h('div', { className: 'dash-rows' }, sortBy(myBookings, 'time').slice(0, 6).map((b) => h('div', { className: 'dash-row' },
            Avatar(b.parentName, { size: 'sm' }),
            h('div', { className: 'dash-row-main' },
              h('div', { className: 'dash-row-title' }, `${b.parentName} · parent of ${b.studentName}`),
              h('div', { className: 'dash-row-meta' }, `${formatDate(b.date, 'medium')} at ${b.time} · ${b.className} ${b.section}`)),
            IconButton('phone', { size: 'sm', label: `Call ${b.parentPhone}`, onClick: mockAction('Call parent') }))))
            : EmptyState({ icon: 'handshake', title: 'No bookings yet', text: 'Parents book against your published slots — publish more if the diary is thin.', action: Button('Manage slots', { variant: 'secondary', icon: 'clock', route: 'ptm/slots' }) })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Exam duties', subtitle: `${myExams.length} papers where I invigilate`, icon: 'file-text', viewAll: 'examination/schedule' },
          myExams.length ? Timeline(sortBy(myExams, 'date').slice(0, 6).map((e) => ({
            title: `${e.subjectName} · ${e.className}`,
            meta: `${formatDate(e.date, 'medium')} · ${e.startTime}–${e.endTime} · ${e.room}`,
            text: `${e.examGroupName} · ${e.maxMarks} marks · pass ${e.passMarks}`,
            icon: 'file-text', tone: e.status === 'Results Published' ? 'success' : 'info',
          }))) : EmptyState({ icon: 'file-text', title: 'No invigilation assigned', text: 'You have not been rostered for the upcoming examination cycle.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Doubts to answer', subtitle: `${myDoubts.length} open in my subjects`, icon: 'message-circle', viewAll: 'lms/doubts' },
          myDoubts.length ? h('div', { className: 'dash-rows' }, myDoubts.slice(0, 5).map((d) => h('div', { className: 'dash-row' },
            Avatar(d.studentName, { size: 'sm' }),
            h('div', { className: 'dash-row-main' },
              h('div', { className: 'dash-row-title' }, d.question),
              h('div', { className: 'dash-row-meta' }, `${d.studentName} · ${d.className} · ${d.subject} · ${relativeTime(d.askedOn)}`)),
            h('div', { className: 'dash-row-acts' },
              d.status === 'Escalated' && Badge('Escalated', { tone: 'danger' }),
              Button('Reply', { size: 'sm', variant: 'secondary', icon: 'send', onClick: mockAction('Reply to doubt') })))))
            : EmptyState({ icon: 'check-circle', tone: 'success', title: 'No open doubts', text: 'Every question in your subjects has an answer.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'My substitutions', subtitle: `${mySubs.length} logged this session`, icon: 'refresh-ccw', viewAll: 'timetable/substitution' },
          mySubs.length ? h('div', { className: 'dash-rows' }, sortBy(mySubs, 'date', 'desc').slice(0, 5).map((s) => h('div', { className: 'dash-row' },
            h('span', { className: 'dash-alert-ico', dataset: { sev: s.substituteTeacherId === me.id ? 'info' : 'low' }, html: icon('refresh-ccw', 15) }),
            h('div', { className: 'dash-row-main' },
              h('div', { className: 'dash-row-title' }, `${s.className} ${s.section} · Period ${s.periodNo} · ${s.subjectName}`),
              h('div', { className: 'dash-row-meta' }, s.substituteTeacherId === me.id ? `Covering for ${s.absentTeacherName} · ${formatDate(s.date, 'medium')}` : `${s.substituteTeacherName} covered for me · ${formatDate(s.date, 'medium')}`)),
            Badge(s.status))))
            : EmptyState({ icon: 'refresh-ccw', title: 'No substitutions', text: 'You have neither missed nor covered a period this session.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Notices for staff', subtitle: 'Published circulars', icon: 'scroll', viewAll: 'communication/circulars' },
          noticeList(campusId)),
      },

      {
        span: 6,
        render: () => widget({ title: 'What needs me today', subtitle: 'Exceptions across my classes, worst first', icon: 'siren', viewAll: 'portals/teacher/students' },
          alertsPanel(teacherAlerts({ me, todaySections, toGrade, myHomework, risk, myDoubts, myStudents, marking }))),
      },

      {
        span: 6,
        render: () => widget({ title: 'Leave requests to sign off', subtitle: `${myLeaveQueue.length} from students I teach`, icon: 'inbox', viewAll: 'attendance/leave-requests' },
          approvalsPanel({
            rows: sortBy(myLeaveQueue, 'fromDate', 'asc'),
            avatar: (r) => r.studentName,
            title: (r) => `${r.studentName} · ${r.type}`,
            meta: (r) => `${r.className} ${r.section} · ${formatDate(r.fromDate, 'medium')}–${formatDate(r.toDate, 'medium')} (${r.days}d) · ${r.reason}`,
            side: (r) => (r.attachment ? Badge('Certificate', { tone: 'info' }) : Badge(`${r.days}d`, { tone: 'neutral' })),
            emptyTitle: 'No leave to approve',
            emptyText: 'Nobody in your sections has an application still waiting on you.',
            onApprove: (r) => notify({ title: 'Leave approved', text: `${r.studentName} · ${r.days} day${r.days > 1 ? 's' : ''}`, tone: 'success' }),
          })),
      },

      {
        span: 12,
        render: () => widget({ title: 'Activity in my classes', subtitle: 'Newest first — submissions, questions and registers', icon: 'activity', viewAll: 'lms/submissions' },
          classroomFeed.length
            ? ActivityFeed(classroomFeed)
            : EmptyState({ icon: 'activity', title: 'Nothing has happened yet today', text: 'Submissions, doubts and marked registers appear here as they land.' })),
      },
    ],
  });
}

/**
 * Severity-ranked exceptions for a teacher: the register still open, the pile
 * of ungraded work, the children slipping, the questions going stale.
 */
function teacherAlerts({ me, todaySections, toGrade, myHomework, myDoubts, myStudents, marking }) {
  const out = [];
  const unmarked = todaySections.filter((sec) => !sec.marked);
  const lateHw = myHomework.filter((hw) => hw.status === 'Open' && hw.dueDate < TODAY);
  const lowSubmission = myHomework.filter((hw) => hw.status === 'Open' && pct(hw.submitted, hw.totalStudents) < 60);
  const stale = myDoubts.filter((d) => d.askedOn < '2026-08-14');
  const failing = myStudents.filter((s) => num(s.lastExamPercent) < 40);
  const below75 = sortBy(myStudents.filter((s) => num(s.attendancePct) < 75), 'attendancePct', 'asc');

  if (unmarked.length) {
    out.push({
      severity: 'critical', icon: 'clipboard-list',
      title: `${unmarked.length} register${unmarked.length > 1 ? 's are' : ' is'} still open`,
      text: `${unmarked.map((u) => u.label).join(' · ')} — attendance closes at 10:00 and locks for the day.`,
      badge: Badge('Attendance', { tone: 'danger' }), route: 'attendance/mark-daily',
    });
  }
  if (toGrade.length) {
    out.push({
      severity: toGrade.length > 20 ? 'high' : 'medium', icon: 'edit',
      title: `${toGrade.length} submissions waiting to be graded`,
      text: `The oldest has been sitting since ${formatDate(sortBy(toGrade, 'submittedOn')[0].submittedOn, 'medium')}. These marks feed the next report card.`,
      badge: Badge('Grading', { tone: toGrade.length > 20 ? 'danger' : 'warning' }), route: 'lms/submissions',
    });
  }
  if (lateHw.length) {
    out.push({
      severity: 'high', icon: 'clock',
      title: `${lateHw.length} assignment${lateHw.length > 1 ? 's are' : ' is'} past due and still open`,
      text: `${formatNumber(sum(lateHw, 'pending'))} pieces of work outstanding across those classes.`,
      badge: Badge('Homework', { tone: 'warning' }), route: 'lms/homework',
    });
  }
  if (below75.length) {
    out.push({
      severity: below75.length > 6 ? 'high' : 'medium', icon: 'user-x',
      title: `${below75.length} of my students are below 75% attendance`,
      text: `Board minimum is 75%. Lowest is ${below75[0].name} at ${below75[0].attendancePct}%.`,
      badge: Badge('Attendance', { tone: 'warning' }), route: 'attendance/defaulters',
    });
  }
  if (failing.length) {
    out.push({
      severity: 'high', icon: 'trending-down',
      title: `${failing.length} student${failing.length > 1 ? 's' : ''} scored below the pass mark last cycle`,
      text: 'Remedial plans are due with the head of department before the half-yearly.',
      badge: Badge('Academics', { tone: 'danger' }), route: 'examination/performance',
    });
  }
  if (lowSubmission.length) {
    out.push({
      severity: 'medium', icon: 'clipboard-list',
      title: `${lowSubmission.length} assignment${lowSubmission.length > 1 ? 's have' : ' has'} under 60% submitted`,
      text: lowSubmission.slice(0, 3).map((hw) => `${hw.className} ${hw.section} ${hw.submitted}/${hw.totalStudents}`).join(' · '),
      badge: Badge('Homework', { tone: 'warning' }), route: 'lms/homework',
    });
  }
  if (stale.length) {
    out.push({
      severity: 'low', icon: 'message-circle',
      title: `${stale.length} student question${stale.length > 1 ? 's have' : ' has'} gone unanswered for a week`,
      text: 'An answered doubt is published to the whole section, so one reply clears several hands.',
      badge: Badge('LMS', { tone: 'info' }), route: 'lms/doubts',
    });
  }
  if (num(me.leaveBalanceCL) <= 2) {
    out.push({
      severity: 'low', icon: 'calendar',
      title: `Only ${me.leaveBalanceCL} casual leave days left`,
      text: `You have taken ${me.leaveTakenYtd} days this year. Casual leave does not carry into the next session.`,
      badge: Badge('HR', { tone: 'info' }), route: 'portals/teacher/leave',
    });
  }
  if (!out.length) {
    out.push({
      severity: 'info', icon: 'check-circle',
      title: 'Nothing outstanding',
      text: `Registers are in${marking.rows.length ? ` (${marking.rows.length} marked)` : ''}, submissions are graded and every student in your sections is above threshold.`,
      badge: Badge('All clear', { tone: 'success' }), route: 'portals/teacher/students',
    });
  }
  return out;
}

/* ============================================== 6 · ACCOUNTANT ======= */

function buildAccountant(ctx) {
  const campusId = ctx.state.campusId;
  const head = headerFor(ctx, 'Accounts dashboard');
  const sp = analytics.sparks;

  const payments = scope(db.payments, campusId);
  const today = dayRows(payments, 'date');
  const success = today.rows.filter((p) => p.status === 'Success');
  const failed = payments.filter((p) => p.status === 'Failed' || p.status === 'Cancelled');
  const mtd = payments.filter((p) => dayKey(p.date) >= '2026-08-01' && p.status === 'Success');
  const invoices = scope(db.invoices, campusId);
  const billed = sum(invoices, 'amount');            // all four instalments
  const collected = sum(invoices, 'paid');
  const outstanding = sum(invoices, 'balance');
  // The collection rate a bursar is judged on is money in against money that
  // has actually fallen due — not against instalments not yet payable.
  const dueInvoices = invoices.filter((i) => i.dueDate < TODAY);
  const dueToDate = sum(dueInvoices, 'amount');
  const collectedOfDue = sum(dueInvoices, 'paid');
  const collectionRate = round1(pct(collectedOfDue, dueToDate));
  const overdue = invoices.filter((i) => i.status === 'Overdue');
  const ageing = feeAgeing(campusId);
  const expensesPending = scope(db.expenses, campusId).filter((e) => e.status === 'Pending Approval');
  const refundsPending = scope(db.refunds, campusId).filter((r) => r.status === 'Pending' || r.status === 'Approved');
  const vouchersDraft = scope(db.vouchers, campusId).filter((v) => v.status === 'Draft');
  const banks = scope(db.bankAccounts, campusId).length ? scope(db.bankAccounts, campusId) : db.bankAccounts;
  // Overdue instalments, not the annual balance: the full year is invoiced up
  // front, so filtering on `feeDue` would list virtually the whole roll.
  const defaulters = sortBy(scope(db.students, campusId).filter((s) => num(s.feeOverdue) > 0), 'feeOverdue', 'desc')
    .map((s) => {
      const worst = sortBy(invoices.filter((i) => i.studentId === s.id && num(i.balance) > 0), 'overdueDays', 'desc')[0];
      return {
        id: s.id, name: s.name, admissionNo: s.admissionNo, className: s.className, section: s.section,
        due: s.feeDue, paid: s.feePaid, total: s.feeTotal, phone: s.phone,
        overdueDays: worst ? num(worst.overdueDays) : 0,
      };
    });
  const targetMonth = analytics.feeCollectionVsTarget.find((m) => m.month === 'Aug') || analytics.feeCollectionVsTarget[0];

  const modeSplitToday = (() => {
    const m = new Map();
    for (const p of success) m.set(p.mode, (m.get(p.mode) || 0) + num(p.amount));
    return Array.from(m, ([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);
  })();

  return dashboardPage({
    greeting: head.greeting,
    subtitle: head.subtitle,
    route: 'dashboard/accountant',
    actions: quickActions(ctx, [
      { label: 'Collect fee', icon: 'credit-card', route: 'fees/collection' },
      { label: 'Day book', icon: 'book', route: 'finance/day-book' },
      { label: 'Send reminders', icon: 'bell', route: 'fees/reminders' },
    ]),
    kpis: [
      { label: "Today's collection", value: money(sum(success, 'amount'), true), deltaLabel: `${success.length} receipts · ${asOf(today)}`, icon: 'wallet', tone: 'success', route: 'fees/receipts' },
      { label: 'Month to date', value: money(sum(mtd, 'amount'), true), delta: deltaOf(sp.collection), deltaLabel: 'vs last month', icon: 'banknote', tone: 'brand', trend: sp.collection, route: 'fees/reports' },
      { label: 'Collection rate', value: `${collectionRate}%`, delta: 3.1, deltaLabel: `of ${money(dueToDate, true)} due to date`, icon: 'percent', tone: collectionRate >= 85 ? 'success' : collectionRate >= 75 ? 'warning' : 'danger', route: 'fees/reports' },
      { label: 'Outstanding', value: money(outstanding, true), delta: deltaOf(sp.outstanding), deltaDir: 'down', deltaLabel: 'vs last month', icon: 'alert-circle', tone: 'danger', trend: sp.outstanding, route: 'fees/outstanding' },
      { label: 'Overdue invoices', value: formatNumber(overdue.length), delta: 5.4, deltaLabel: 'vs last month', icon: 'timer', tone: 'danger', route: 'fees/defaulters' },
      { label: 'Failed / bounced', value: formatNumber(failed.length), delta: -11.2, deltaLabel: 'vs last month', icon: 'x-circle', tone: 'warning', route: 'fees/online-payments' },
      { label: 'Expense approvals', value: formatNumber(expensesPending.length), deltaLabel: money(sum(expensesPending, 'amount'), true), icon: 'stamp', tone: 'brand', route: 'finance/expenses' },
      { label: 'Cash at bank', value: money(sum(banks, 'balance'), true), delta: 2.8, deltaLabel: 'vs last month', icon: 'building-columns', tone: 'success', route: 'finance/bank-accounts' },
    ],
    widgets: [
      {
        span: 4,
        render: () => widget({ title: 'August against target', subtitle: `Target ${money(targetMonth.target, true)}`, icon: 'gauge', viewAll: 'fees/reports', className: 'chart-card' },
          gaugeChart({
            value: targetMonth.achieved, min: 0, max: 120, label: 'Target achieved',
            height: 220, valueFormat: 'percent0', title: 'Monthly collection against target',
          }),
          h('div', { className: 'mt-3' }, tileGrid([
            { label: 'Collected', value: money(targetMonth.collected, true), tone: 'success' },
            { label: 'Target', value: money(targetMonth.target, true) },
            { label: 'Gap', value: money(Math.max(0, targetMonth.target - targetMonth.collected), true), tone: 'warning' },
          ]))),
      },

      {
        span: 8,
        render: () => rangedChart({
          title: 'Collection against target',
          subtitle: 'Money banked each month vs the billing plan',
          icon: 'wallet', viewAll: 'fees/reports',
          ranges: [{ id: 'q1', label: 'Q1' }, { id: 'h1', label: 'H1' }, { id: 'all', label: 'Full year' }],
          build: (r) => {
            const src = analytics.feeCollectionVsTarget;
            const rows = r === 'q1' ? src.slice(0, 3) : r === 'h1' ? src.slice(0, 6) : src;
            return comboChart({
              categories: rows.map((x) => x.month),
              bars: [{ name: 'Collected', values: rows.map((x) => x.collected) }],
              line: { name: 'Target', values: rows.map((x) => x.target) },
              valueFormat: 'currencyCompact', height: 300, title: 'Collection vs target',
            });
          },
        }),
      },

      {
        span: 4,
        render: () => widget({ title: 'How parents paid today', subtitle: asOf(today), icon: 'credit-card', viewAll: 'fees/receipts', className: 'chart-card' },
          modeSplitToday.length
            ? donutChart({ data: modeSplitToday, centerValue: money(sum(success, 'amount'), true), centerLabel: 'Banked', height: 280, valueFormat: 'currencyCompact', title: 'Payment mode split, today' })
            : EmptyState({ icon: 'credit-card', title: 'No receipts yet', text: 'Nothing has been collected on this date — the counter opens at 08:30.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Payment mode mix', subtitle: 'Share of receipts this session', icon: 'chart-pie', viewAll: 'fees/online-payments', className: 'chart-card' },
          pieChart({ data: analytics.feeModeSplit.map((m) => ({ key: m.key, value: m.value })), valueFormat: 'percent0', height: 280, title: 'Payment mode mix' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Debtor ageing', subtitle: `${formatNumber(ageing.reduce((a, b) => a + b.count, 0))} invoices carrying a balance`, icon: 'timer', viewAll: 'fees/outstanding', className: 'chart-card' },
          barChart({
            categories: ageing.map((b) => b.label),
            series: [{ name: 'Outstanding', values: ageing.map((b) => b.value) }],
            horizontal: true, showValues: true, valueFormat: 'currencyCompact', height: 280, title: 'Debtor ageing',
          })),
      },

      {
        span: 7,
        render: () => widget({ title: 'Day book', subtitle: `${success.length} receipts · ${asOf(today)}`, icon: 'book', viewAll: 'finance/day-book' },
          today.rows.length ? DataTable({
            rows: sortBy(today.rows, 'amount', 'desc'),
            pageSize: 8, searchable: true, searchKeys: ['receiptNo', 'studentName', 'reference'], searchPlaceholder: 'Search receipts…',
            exportName: 'day-book', maxHeight: 'none', footerAggregates: true,
            columns: [
              { key: 'receiptNo', label: 'Receipt', sticky: true, width: 150, render: (r) => h('span', { className: 't-mono t-xs' }, r.receiptNo) },
              { key: 'studentName', label: 'Student', width: 210, render: (r) => Identity(r.studentName, `${r.admissionNo} · ${r.className} ${r.section}`), value: (r) => r.studentName },
              { key: 'mode', label: 'Mode', width: 120, filter: true },
              { key: 'bank', label: 'Bank', width: 110, hidden: true },
              { key: 'collectedByName', label: 'Collected by', width: 160, hidden: true },
              { key: 'amount', label: 'Amount', numeric: true, align: 'right', width: 130, aggregate: 'sum', format: (v) => money(v, true), render: (r) => money(r.amount) },
              { key: 'status', label: 'Status', width: 110, filter: true, render: (r) => Badge(r.status === 'Success' ? 'Paid' : r.status) },
            ],
            rowActions: (r) => [
              { label: 'Print receipt', icon: 'print', onClick: mockAction('Print receipt') },
              { label: 'Open student', icon: 'eye', route: `students/profile/${r.studentId}` },
              { separator: true },
              { label: 'Cancel receipt', icon: 'x-circle', tone: 'danger', onClick: mockAction('Cancel receipt') },
            ],
            onRowClick: () => navigate('fees/receipts'),
          }) : EmptyState({ icon: 'receipt', title: 'No receipts on this date', text: 'Collections resume when the fee counter opens.', action: Button('Collect fee', { variant: 'primary', icon: 'credit-card', route: 'fees/collection' }) })),
      },

      {
        span: 5,
        render: () => widget({ title: 'Expense vouchers to approve', subtitle: `${expensesPending.length} pending · ${money(sum(expensesPending, 'amount'), true)}`, icon: 'stamp', viewAll: 'finance/expenses' },
          approvalsPanel({
            rows: sortBy(expensesPending, 'amount', 'desc'),
            avatar: (r) => (byId(db.vendors, r.vendorId) || {}).name || r.category,
            title: (r) => `${r.description} — ${money(r.amount)}`,
            meta: (r) => `${r.voucherNo} · ${r.category} · ${formatDate(r.date, 'medium')} · ${r.paymentMode} · GST ${r.gst}%`,
            side: (r) => (r.attachment ? IconButton('paperclip', { size: 'sm', label: 'View attachment', onClick: mockAction('Open attachment') }) : null),
            onApprove: (r) => notify({ title: 'Voucher approved', text: `${r.voucherNo} · ${money(r.amount)}`, tone: 'success' }),
          })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Top defaulters', subtitle: `${formatNumber(defaulters.length)} accounts on the escalation list`, icon: 'user-x', viewAll: 'fees/defaulters' },
          defaulters.length ? DataTable({
            rows: sortBy(defaulters, 'due', 'desc').slice(0, 40),
            pageSize: 7, searchable: true, searchKeys: ['name', 'admissionNo', 'className'], searchPlaceholder: 'Search defaulters…',
            exportName: 'defaulters', maxHeight: 'none',
            columns: [
              { key: 'name', label: 'Student', sticky: true, width: 210, render: (r) => Identity(r.name, `${r.admissionNo} · ${r.className} ${r.section}`), value: (r) => r.name },
              { key: 'due', label: 'Due', numeric: true, align: 'right', width: 130, render: (r) => h('span', { className: 't-danger t-num' }, money(r.due)) },
              { key: 'paid', label: 'Paid', numeric: true, align: 'right', width: 120, hidden: true, render: (r) => money(r.paid) },
              { key: 'overdueDays', label: 'Age', numeric: true, align: 'right', width: 100, render: (r) => Badge(`${r.overdueDays}d`, { tone: r.overdueDays >= 90 ? 'danger' : r.overdueDays >= 45 ? 'warning' : 'info' }) },
              { key: 'phone', label: 'Contact', width: 150, render: (r) => h('span', { className: 't-mono t-xs' }, r.phone) },
            ],
            bulkActions: [
              { label: 'Send SMS reminder', icon: 'message-square', onClick: (sel) => notify({ title: `Reminder queued for ${sel.length} families`, tone: 'success' }) },
              { label: 'Escalate to principal', icon: 'trending-up', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} accounts escalated`, tone: 'warning' }) },
            ],
            selectable: true,
            rowActions: (r) => [
              { label: 'Collect now', icon: 'credit-card', route: 'fees/collection' },
              { label: 'Open student', icon: 'eye', route: `students/profile/${r.id}` },
              { label: 'Call parent', icon: 'phone-call', onClick: mockAction('Call parent') },
            ],
            onRowClick: (r) => navigate(`students/profile/${r.id}`),
          }) : EmptyState({ icon: 'check-circle', tone: 'success', title: 'No defaulters', text: 'Every family on this campus is current on fees.' })),
      },

      {
        span: 3,
        render: () => widget({ title: 'Bank position', subtitle: `${banks.length} operating accounts`, icon: 'building-columns', viewAll: 'finance/bank-accounts' },
          h('div', { className: 'dash-rows' }, banks.map((b) => h('div', { className: 'dash-row' },
            h('span', { className: 'dash-alert-ico', dataset: { sev: 'info' }, html: icon('building-columns', 15) }),
            h('div', { className: 'dash-row-main' },
              h('div', { className: 'dash-row-title' }, b.name),
              h('div', { className: 'dash-row-meta' }, `${b.bank} · ${b.accountMasked} · ${b.branch}`)),
            h('span', { className: 't-semibold t-num t-nowrap' }, money(b.balance, true)))))),
      },

      {
        span: 3,
        render: () => widget({ title: 'Exceptions', subtitle: 'Items that block a clean close', icon: 'alert-triangle', viewAll: 'fees/cancelled-receipts' },
          alertsPanel([
            failed.length && {
              severity: 'high', icon: 'x-circle', title: `${failed.length} failed or cancelled payments`,
              text: `Gateway value ${money(sum(failed, 'amount'), true)} needs re-collection or a written-off note.`,
              badge: Badge('Gateway', { tone: 'danger' }), route: 'fees/online-payments',
            },
            refundsPending.length && {
              severity: 'medium', icon: 'refresh-ccw', title: `${refundsPending.length} refunds awaiting release`,
              text: `${money(sum(refundsPending, 'amount'), true)} approved but not yet paid out.`,
              badge: Badge('Refunds', { tone: 'warning' }), route: 'fees/refunds',
            },
            vouchersDraft.length && {
              severity: 'medium', icon: 'receipt', title: `${vouchersDraft.length} vouchers still in draft`,
              text: 'Draft vouchers do not hit the ledger — post or delete them before the month-end close.',
              badge: Badge('Ledger', { tone: 'warning' }), route: 'finance/vouchers',
            },
            {
              severity: 'low', icon: 'percent', title: `${db.discounts.filter((d) => d.active).length} discount schemes active`,
              text: `${formatNumber(sum(db.discounts, 'students'))} students carry an automatic concession.`,
              badge: Badge('Discounts', { tone: 'info' }), route: 'fees/discounts',
            },
          ].filter(Boolean))),
      },

      {
        span: 3,
        render: () => widget({ title: 'Fee head mix', subtitle: 'Where billing comes from', icon: 'layers', viewAll: 'fees/heads', className: 'chart-card' },
          treemap({ data: analytics.feeHeadSplit.map((f) => ({ key: f.key, value: f.value })), valueFormat: 'currencyCompact', height: 260, title: 'Fee head mix' })),
      },

      {
        span: 3,
        render: () => widget({ title: 'Recent finance activity', subtitle: 'Audit trail for fees and finance', icon: 'history', viewAll: 'system/audit-logs' },
          auditFeed(['fees', 'finance'], campusId, 6)),
      },
    ],
  });
}

/* ================================================ 7 · HUMAN RESOURCES */

function buildHr(ctx) {
  const campusId = ctx.state.campusId;
  const head = headerFor(ctx, 'Human resources dashboard');
  const sp = analytics.sparks;

  const staff = scope(db.staff, campusId);
  const active = staff.filter((s) => s.status === 'Active');
  const teaching = active.filter((s) => s.type === 'Teaching');
  const byDept = Array.from(groupBy(active, 'department'), ([key, rows]) => ({ key, value: rows.length }))
    .sort((a, b) => b.value - a.value);
  const pendingLeave = scope(db.leaveRequests, campusId).filter((l) => l.status === 'Pending');
  const payroll = db.payrollRuns[db.payrollRuns.length - 1];
  const payslips = db.payslips.filter((p) => p.payrollRunId === payroll.id && (!campusId || p.campusId === campusId));
  const openRoles = db.recruitments.filter((r) => r.status !== 'Closed');
  const applicants = db.applicants;
  const resignations = scope(db.resignations, campusId);
  const trainings = db.trainings;
  const docsMissing = active.filter((s) => !s.documentsComplete);
  const lowLeave = active.filter((s) => num(s.leaveBalanceCL) <= 1 && num(s.leaveBalanceSL) <= 1);
  const attendanceToday = dayRows(scope(db.staffAttendance, campusId), 'date');

  const monthOf = (d) => String(d || '').slice(5, 7);
  const dayOf = (d) => num(String(d || '').slice(8, 10));
  const birthdays = active.filter((s) => monthOf(s.dob) === '08').sort((a, b) => dayOf(a.dob) - dayOf(b.dob)).slice(0, 6);
  const anniversaries = active.filter((s) => monthOf(s.joiningDate) === '08').sort((a, b) => dayOf(a.joiningDate) - dayOf(b.joiningDate)).slice(0, 6);

  const ratingSplit = Array.from(groupBy(active.filter((s) => s.appraisalRating), 'appraisalRating'), ([key, rows]) => ({ key, value: rows.length }))
    .sort((a, b) => b.value - a.value);

  const funnel = [
    { label: 'Applicants', value: sum(openRoles, 'applicants') },
    { label: 'Shortlisted', value: sum(openRoles, 'shortlisted') },
    { label: 'Interviewed', value: sum(openRoles, 'interviewed') },
    { label: 'Offered', value: sum(openRoles, 'offered') },
    { label: 'Joined', value: sum(openRoles, 'joined') },
  ];

  return dashboardPage({
    greeting: head.greeting,
    subtitle: head.subtitle,
    route: 'dashboard/hr',
    actions: quickActions(ctx, [
      { label: 'Add employee', icon: 'user-plus', route: 'hr/employees' },
      { label: 'Run payroll', icon: 'banknote', route: 'hr/payroll-runs' },
      { label: 'Leave requests', icon: 'inbox', route: 'hr/leave-requests' },
    ]),
    kpis: [
      { label: 'Headcount', value: formatNumber(active.length), delta: 1.6, deltaLabel: 'vs last month', icon: 'users', tone: 'brand', route: 'hr/employees' },
      { label: 'Teaching staff', value: formatNumber(teaching.length), deltaLabel: `${active.length - teaching.length} non-teaching`, icon: 'presentation', tone: 'info', route: 'teachers/directory' },
      { label: 'Staff attendance', value: `${round1(avg(active, 'attendancePct'))}%`, delta: deltaOf(sp.staffAttendance), deltaLabel: 'vs last month', icon: 'clipboard-check', tone: 'success', trend: sp.staffAttendance, route: 'hr/attendance' },
      { label: 'Leave pending', value: formatNumber(pendingLeave.length), delta: 8.9, deltaLabel: 'vs last week', icon: 'inbox', tone: 'warning', route: 'hr/leave-requests' },
      { label: `Payroll ${payroll.month}`, value: money(payroll.netTotal, true), deltaLabel: payroll.status, icon: 'banknote', tone: payroll.status === 'Disbursed' ? 'success' : 'warning', route: 'hr/payroll-runs' },
      { label: 'Open positions', value: formatNumber(openRoles.length), deltaLabel: `${sum(openRoles, 'openings')} vacancies`, icon: 'user-plus', tone: 'brand', route: 'hr/recruitment' },
      { label: 'Attrition YTD', value: `${round1(pct(resignations.length, active.length))}%`, delta: -0.4, deltaLabel: 'vs last year', icon: 'log-out', tone: 'info', route: 'hr/resignations' },
      { label: 'Docs incomplete', value: formatNumber(docsMissing.length), delta: -6.1, deltaLabel: 'vs last month', icon: 'folder', tone: docsMissing.length > 20 ? 'danger' : 'warning', route: 'hr/documents' },
    ],
    widgets: [
      {
        span: 8,
        render: () => rangedChart({
          title: 'Headcount by department',
          subtitle: `${byDept.length} departments · ${formatNumber(active.length)} people`,
          icon: 'building', viewAll: 'hr/departments',
          ranges: [{ id: 'all', label: 'All staff' }, { id: 'teach', label: 'Teaching' }, { id: 'nonteach', label: 'Non-teaching' }],
          build: (r) => {
            const src = r === 'all' ? active : active.filter((s) => (r === 'teach' ? s.type === 'Teaching' : s.type !== 'Teaching'));
            const rows = Array.from(groupBy(src, 'department'), ([key, list]) => ({ key, value: list.length })).sort((a, b) => b.value - a.value);
            if (!rows.length) return null;
            return barChart({
              categories: rows.map((d) => d.key),
              series: [{ name: 'Employees', values: rows.map((d) => d.value) }],
              horizontal: true, showValues: true, height: 320, valueFormat: 'number',
              title: 'Headcount by department',
            });
          },
        }),
      },

      {
        span: 4,
        render: () => widget({ title: 'Workforce mix', subtitle: 'Function split across the group', icon: 'chart-pie', viewAll: 'hr/designations', className: 'chart-card' },
          donutChart({
            data: analytics.staffSplit.map((s) => ({ key: s.key, value: s.value })),
            centerValue: formatNumber(db.staff.length), centerLabel: 'On roll', height: 320, title: 'Workforce mix',
          })),
      },

      {
        span: 7,
        render: () => widget({ title: 'Staff attendance composition', subtitle: 'Present, leave and absent by month', icon: 'clipboard-check', viewAll: 'hr/attendance', className: 'chart-card' },
          areaChart({
            categories: analytics.staffAttendance.map((r) => r.month),
            series: [
              { name: 'Present', values: analytics.staffAttendance.map((r) => r.present) },
              { name: 'On leave', values: analytics.staffAttendance.map((r) => r.leave) },
              { name: 'Absent', values: analytics.staffAttendance.map((r) => r.absent) },
            ],
            stacked: true, valueFormat: 'percent', height: 300, title: 'Staff attendance composition',
          }),
          h('div', { className: 'mt-3' }, tileGrid([
            { label: 'Marked today', value: formatNumber(attendanceToday.rows.length), sub: asOf(attendanceToday), route: 'hr/attendance' },
            { label: 'Present', value: formatNumber(attendanceToday.rows.filter((r) => r.status === 'Present').length), tone: 'success', route: 'hr/attendance' },
            { label: 'Late', value: formatNumber(attendanceToday.rows.filter((r) => num(r.lateBy) > 0).length), tone: 'warning', route: 'hr/attendance' },
            { label: 'On leave', value: formatNumber(attendanceToday.rows.filter((r) => r.status === 'On Leave' || r.status === 'Leave').length), tone: 'info', route: 'hr/leave-requests' },
          ]))),
      },

      {
        span: 5,
        render: () => widget({ title: 'Leave awaiting approval', subtitle: `${pendingLeave.length} requests · oldest ${pendingLeave.length ? relativeTime(sortBy(pendingLeave, 'appliedOn')[0].appliedOn) : '—'}`, icon: 'inbox', viewAll: 'hr/leave-requests' },
          approvalsPanel({
            rows: sortBy(pendingLeave, 'appliedOn', 'asc'),
            avatar: (r) => r.employeeName,
            title: (r) => `${r.employeeName} — ${r.leaveType}`,
            meta: (r) => `${r.designation}, ${r.department} · ${formatDate(r.fromDate, 'dayMonth')}–${formatDate(r.toDate, 'dayMonth')} · ${r.reason}`,
            side: (r) => Badge(`${r.days}d`, { tone: r.days > 5 ? 'warning' : 'neutral' }),
            onApprove: (r) => notify({ title: 'Leave approved', text: `${r.employeeName} · ${r.leaveType} · ${r.days} day(s)`, tone: 'success' }),
          })),
      },

      {
        span: 5,
        render: () => widget({ title: `Payroll — ${payroll.month}`, subtitle: `${formatNumber(payroll.employees)} employees · ${payroll.status}`, icon: 'banknote', viewAll: 'hr/payroll-runs' },
          Stepper([
            { label: 'Inputs locked', description: 'Attendance and LOP frozen' },
            { label: 'Computed', description: `${formatNumber(payslips.length)} payslips generated` },
            { label: 'Approval', description: 'Finance sign-off' },
            { label: 'Disbursed', description: payroll.bankFileGenerated ? 'Bank file ready' : 'Bank file pending' },
          ], { current: payroll.status === 'Disbursed' ? 3 : 2 }),
          h('div', { className: 'mt-4' }, tileGrid([
            { label: 'Gross', value: money(payroll.grossTotal, true), route: 'hr/payslips' },
            { label: 'Deductions', value: money(payroll.deductionsTotal, true), tone: 'warning', route: 'hr/payslips' },
            { label: 'Net payable', value: money(payroll.netTotal, true), tone: 'success', route: 'hr/payroll-runs' },
            { label: 'PF', value: money(payroll.pf, true), route: 'hr/payroll-runs' },
            { label: 'TDS', value: money(payroll.tds, true), route: 'hr/payroll-runs' },
            { label: 'ESI', value: money(payroll.esi, true), route: 'hr/payroll-runs' },
          ])),
          h('div', { className: 'mt-4' }, lineChart({
            categories: db.payrollRuns.map((p) => p.month),
            series: [{ name: 'Net payout', values: db.payrollRuns.map((p) => p.netTotal) }],
            valueFormat: 'currencyCompact', height: 180, showDots: true, title: 'Net payroll by month',
          }))),
      },

      {
        span: 4,
        render: () => widget({ title: 'Recruitment funnel', subtitle: `${openRoles.length} live requisitions`, icon: 'workflow', viewAll: 'hr/recruitment', className: 'chart-card' },
          funnelChart({ stages: funnel, showConversion: true, height: 300, title: 'Recruitment funnel' })),
      },

      {
        span: 3,
        render: () => widget({ title: 'Appraisal ratings', subtitle: 'Distribution across the workforce', icon: 'star', viewAll: 'hr/appraisal', className: 'chart-card' },
          barChart({
            categories: ratingSplit.map((r) => r.key),
            series: [{ name: 'Employees', values: ratingSplit.map((r) => r.value) }],
            horizontal: true, showValues: true, height: 300, valueFormat: 'number', title: 'Appraisal rating distribution',
          })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Live requisitions', subtitle: `${sum(openRoles, 'openings')} vacancies · ${applicants.length} applicants in play`, icon: 'clipboard-list', viewAll: 'hr/recruitment' },
          DataTable({
            rows: openRoles,
            paginate: false, searchable: false, columnToggle: false, exportName: 'open-positions', maxHeight: 'none',
            columns: [
              { key: 'position', label: 'Position', sticky: true, width: 190, render: (r) => Identity(r.position, `${r.department} · ${campusName(r.campusId)}`), value: (r) => r.position },
              { key: 'openings', label: 'Seats', numeric: true, align: 'right', width: 80 },
              { key: 'applicants', label: 'Applied', numeric: true, align: 'right', width: 90 },
              { key: 'interviewed', label: 'Interviewed', numeric: true, align: 'right', width: 110 },
              { key: 'offered', label: 'Offered', numeric: true, align: 'right', width: 90 },
              { key: 'closingDate', label: 'Closes', width: 120, render: (r) => h('span', { className: r.closingDate < TODAY ? 't-danger' : '' }, formatDate(r.closingDate, 'medium')) },
              { key: 'priority', label: 'Priority', width: 100, render: (r) => Badge(r.priority, { tone: r.priority === 'High' ? 'danger' : r.priority === 'Medium' ? 'warning' : 'neutral' }) },
              { key: 'status', label: 'Status', width: 120, render: (r) => Badge(r.status) },
            ],
            rowActions: () => [
              { label: 'View applicants', icon: 'users', route: 'hr/applicants' },
              { label: 'Schedule interviews', icon: 'calendar-check', route: 'hr/interviews' },
            ],
            onRowClick: () => navigate('hr/recruitment'),
          })),
      },

      {
        span: 3,
        render: () => widget({ title: 'Celebrations this month', subtitle: 'Birthdays and work anniversaries', icon: 'gift', viewAll: 'hr/employees' },
          (birthdays.length || anniversaries.length) ? h('div', { className: 'stack-4' },
            birthdays.length && h('div', { className: 'stack-2' },
              h('div', { className: 't-eyebrow' }, 'Birthdays'),
              h('div', { className: 'dash-rows' }, birthdays.map((s) => h('div', { className: 'dash-row' },
                Avatar(s.name, { size: 'sm' }),
                h('div', { className: 'dash-row-main' },
                  h('div', { className: 'dash-row-title' }, s.name),
                  h('div', { className: 'dash-row-meta' }, `${s.designation} · ${formatDate(s.dob, 'dayMonth')}`)),
                IconButton('send', { size: 'sm', label: `Send wishes to ${s.name}`, onClick: mockAction('Send wishes') }))))),
            anniversaries.length && h('div', { className: 'stack-2' },
              h('div', { className: 't-eyebrow' }, 'Work anniversaries'),
              h('div', { className: 'dash-rows' }, anniversaries.map((s) => h('div', { className: 'dash-row' },
                Avatar(s.name, { size: 'sm' }),
                h('div', { className: 'dash-row-main' },
                  h('div', { className: 'dash-row-title' }, s.name),
                  h('div', { className: 'dash-row-meta' }, `${2026 - num(String(s.joiningDate).slice(0, 4))} years · joined ${formatDate(s.joiningDate, 'medium')}`)),
                Badge(`${2026 - num(String(s.joiningDate).slice(0, 4))} yrs`, { tone: 'brand' }))))))
            : EmptyState({ icon: 'gift', title: 'Nothing to celebrate in August', text: 'No birthdays or joining anniversaries fall in this month.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Training programmes', subtitle: `${trainings.length} programmes · ${formatNumber(sum(trainings, 'enrolled'))} enrolments`, icon: 'lightbulb', viewAll: 'hr/training', className: 'chart-card' },
          bulletChart({
            items: trainings.slice(0, 6).map((t) => ({ label: t.name.length > 34 ? `${t.name.slice(0, 32)}…` : t.name, value: t.completed, target: t.enrolled, ranges: [t.seats * 0.4, t.seats * 0.7, Math.max(t.seats, t.enrolled)] })),
            valueFormat: 'number', height: 300, title: 'Training completion against enrolment',
          })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Exits and clearance', subtitle: `${resignations.length} resignations in flight`, icon: 'log-out', viewAll: 'hr/exit-clearance' },
          resignations.length ? h('div', { className: 'dash-rows' }, resignations.slice(0, 5).map((r) => h('div', { className: 'dash-row' },
            Avatar(r.employeeName, { size: 'sm' }),
            h('div', { className: 'dash-row-main' },
              h('div', { className: 'dash-row-title' }, `${r.employeeName} · ${r.designation}`),
              h('div', { className: 'dash-row-meta' }, `LWD ${formatDate(r.lastWorkingDay, 'medium')} · ${r.reason} · F&F ${money(r.fnfAmount)}`)),
            h('div', { className: 'dash-row-acts' },
              Badge(r.status),
              ProgressBar([r.clearanceIt, r.clearanceLibrary, r.clearanceAccounts, r.clearanceHostel].filter(Boolean).length * 25, { size: 'sm' })))))
            : EmptyState({ icon: 'check-circle', tone: 'success', title: 'No open exits', text: 'Nobody is serving notice on this campus right now.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'People risks', subtitle: 'Compliance and capacity warnings', icon: 'alert-triangle', viewAll: 'hr/reports' },
          alertsPanel([
            docsMissing.length && {
              severity: 'high', icon: 'folder', title: `${docsMissing.length} employee files incomplete`,
              text: 'Statutory records (PAN, UAN, qualification proof) missing — blocks payroll audit sign-off.',
              badge: Badge('Compliance', { tone: 'danger' }), route: 'hr/documents',
            },
            pendingLeave.length > 30 && {
              severity: 'medium', icon: 'inbox', title: `${pendingLeave.length} leave requests older than SLA`,
              text: 'Managers have 48 hours to decide; anything older auto-escalates to the principal.',
              badge: Badge('Leave', { tone: 'warning' }), route: 'hr/leave-requests',
            },
            lowLeave.length && {
              severity: 'medium', icon: 'calendar', title: `${lowLeave.length} employees have almost no leave left`,
              text: 'Exhausted balances usually precede loss-of-pay and unplanned absence.',
              badge: Badge('Capacity', { tone: 'warning' }), route: 'hr/leave-balance',
            },
            payroll.status !== 'Disbursed' && {
              severity: 'high', icon: 'banknote', title: `${payroll.month} payroll not yet disbursed`,
              text: `${money(payroll.netTotal, true)} awaiting finance approval. Bank file ${payroll.bankFileGenerated ? 'ready' : 'not generated'}.`,
              badge: Badge('Payroll', { tone: 'danger' }), route: 'hr/payroll-runs',
            },
            {
              severity: 'low', icon: 'star', title: `${active.filter((s) => s.appraisalRating === 'Exceeds Expectations').length} employees rated above expectation`,
              text: 'Consider them first for the promotion and retention cycle.',
              badge: Badge('Talent', { tone: 'success' }), route: 'hr/appraisal',
            },
          ].filter(Boolean))),
      },

      {
        span: 4,
        render: () => widget({ title: 'HR activity', subtitle: 'Recent changes in people records', icon: 'history', viewAll: 'system/audit-logs' },
          auditFeed(['hr', 'teachers'], campusId, 7)),
      },
    ],
  });
}

/* ================================================== 8 · LIBRARIAN ==== */

function buildLibrarian(ctx) {
  const campusId = ctx.state.campusId;
  const head = headerFor(ctx, 'Library dashboard');
  const sp = analytics.sparks;

  const books = scope(db.books, campusId);
  const issues = scope(db.bookIssues, campusId);
  const members = scope(db.libraryMembers, campusId);
  const outNow = issues.filter((i) => i.status === 'Issued' || i.status === 'Overdue');
  const overdue = issues.filter((i) => i.status === 'Overdue');
  const returnedToday = dayRows(issues.filter((i) => i.returnDate), 'returnDate');
  const issuedToday = dayRows(issues, 'issueDate');
  const fines = issues.filter((i) => num(i.fine) > 0 && !i.finePaid);
  const totalCopies = sum(books, 'totalCopies');
  const issuedCopies = sum(books, 'issuedCopies');
  const allIssued = books.filter((b) => b.status === 'All Issued');
  const digital = books.filter((b) => b.digital);
  const memberTypes = Array.from(groupBy(members, 'memberType'), ([key, rows]) => ({ key, value: rows.length }));

  // Anything with a fine above the counter's discretion needs a sign-off, and
  // the desk feed is the real issue/return traffic, newest first.
  const waiverQueue = sortBy(fines.filter((f) => num(f.fine) >= 20), 'fine', 'desc').slice(0, 8);
  const deskFeed = sortBy(
    issues.filter((i) => i.returnDate || i.issueDate).map((i) => ({
      when: i.returnDate || i.issueDate,
      name: i.memberName,
      text: `${i.returnDate ? 'returned' : 'borrowed'} · ${i.bookTitle}${num(i.fine) ? ` — fine ${money(i.fine)}` : ''}`,
      time: `${relativeTime(i.returnDate || i.issueDate)} · ${i.className} ${i.section} · ${i.accessionNo}`,
      tone: i.status === 'Overdue' ? 'danger' : i.returnDate ? 'success' : 'info',
    })), 'when', 'desc').slice(0, 9);

  const topBorrowers = sortBy(members.filter((m) => m.totalIssued > 0), 'totalIssued', 'desc').slice(0, 8);
  const popular = sortBy(books, 'timesIssued', 'desc').slice(0, 8);
  const categories = Array.from(groupBy(books, 'category'), ([key, rows]) => ({ key, value: rows.length }))
    .sort((a, b) => b.value - a.value).slice(0, 8);

  return dashboardPage({
    greeting: head.greeting,
    subtitle: head.subtitle,
    route: 'dashboard/librarian',
    actions: quickActions(ctx, [
      { label: 'Issue book', icon: 'arrow-up-right', route: 'library/issue' },
      { label: 'Return book', icon: 'arrow-down-right', route: 'library/return' },
      { label: 'Add book', icon: 'plus', route: 'library/add-book' },
    ]),
    kpis: [
      { label: 'Titles catalogued', value: formatNumber(books.length), delta: 1.2, deltaLabel: 'vs last month', icon: 'book', tone: 'brand', route: 'library/catalog' },
      { label: 'Copies on loan', value: formatNumber(outNow.length), delta: deltaOf(sp.library), deltaLabel: 'vs last month', icon: 'arrow-up-right', tone: 'info', trend: sp.library, route: 'library/issue' },
      { label: 'Overdue', value: formatNumber(overdue.length), delta: 6.7, deltaLabel: 'vs last month', icon: 'timer', tone: 'danger', route: 'library/fines' },
      { label: 'Members', value: formatNumber(members.length), delta: 2.1, deltaLabel: 'vs last month', icon: 'users', tone: 'brand', route: 'library/members' },
      { label: 'Fines outstanding', value: money(sum(fines, 'fine')), deltaLabel: `${fines.length} unpaid`, icon: 'rupee', tone: 'warning', route: 'library/fines' },
      { label: 'Issued today', value: formatNumber(issuedToday.rows.length), deltaLabel: asOf(issuedToday), icon: 'arrow-up-right', tone: 'success', route: 'library/issue' },
      { label: 'Returned today', value: formatNumber(returnedToday.rows.length), deltaLabel: asOf(returnedToday), icon: 'arrow-down-right', tone: 'success', route: 'library/return' },
      { label: 'Shelf availability', value: `${round1(pct(totalCopies - issuedCopies, totalCopies))}%`, deltaLabel: `${formatNumber(totalCopies - issuedCopies)} of ${formatNumber(totalCopies)} copies`, icon: 'library', tone: 'info', route: 'library/copies' },
    ],
    widgets: [
      {
        span: 8,
        render: () => rangedChart({
          title: 'Circulation',
          subtitle: 'Issues, returns and overdue by month',
          icon: 'refresh', viewAll: 'library/reports',
          ranges: [{ id: 'all', label: 'Session' }, { id: 'q', label: 'Last 3 months' }],
          build: (r) => {
            const src = r === 'q' ? analytics.libraryCirculation.slice(-3) : analytics.libraryCirculation;
            return comboChart({
              categories: src.map((x) => x.month),
              bars: [
                { name: 'Issued', values: src.map((x) => x.issued) },
                { name: 'Returned', values: src.map((x) => x.returned) },
              ],
              line: { name: 'Overdue', values: src.map((x) => x.overdue) },
              valueFormat: 'number', height: 300, title: 'Library circulation',
            });
          },
        }),
      },

      {
        span: 4,
        render: () => widget({ title: 'Collection by subject', subtitle: `${categories.length} of ${new Set(books.map((b) => b.category)).size} categories shown`, icon: 'tag', viewAll: 'library/categories', className: 'chart-card' },
          treemap({ data: categories, valueFormat: 'number', height: 300, title: 'Collection by category' })),
      },

      {
        span: 7,
        render: () => widget({ title: 'Overdue loans', subtitle: `${overdue.length} books past their due date · ${money(sum(overdue, 'fine'))} in fines accrued`, icon: 'timer', viewAll: 'library/fines' },
          overdue.length ? DataTable({
            rows: sortBy(overdue, 'dueDate', 'asc').slice(0, 60),
            pageSize: 8, searchable: true, searchKeys: ['memberName', 'bookTitle', 'accessionNo'], searchPlaceholder: 'Search overdue loans…',
            exportName: 'overdue-loans', maxHeight: 'none', selectable: true,
            columns: [
              { key: 'memberName', label: 'Member', sticky: true, width: 200, render: (r) => Identity(r.memberName, `${r.memberType}${r.className ? ` · ${r.className} ${r.section}` : ''}`), value: (r) => r.memberName },
              { key: 'bookTitle', label: 'Title', width: 240, render: (r) => h('div', null, h('div', { className: 't-sm t-medium t-truncate' }, r.bookTitle), h('div', { className: 't-xs t-muted' }, r.accessionNo)), value: (r) => r.bookTitle },
              { key: 'dueDate', label: 'Due', width: 120, render: (r) => h('span', { className: 't-danger' }, formatDate(r.dueDate, 'medium')) },
              { key: 'renewals', label: 'Renewals', numeric: true, align: 'right', width: 100 },
              { key: 'fine', label: 'Fine', numeric: true, align: 'right', width: 110, aggregate: 'sum', format: (v) => money(v), render: (r) => h('span', { className: 't-danger t-num' }, money(r.fine)) },
            ],
            footerAggregates: true,
            bulkActions: [
              { label: 'Send reminder', icon: 'bell', onClick: (sel) => notify({ title: `Reminder sent to ${sel.length} members`, tone: 'success' }) },
              { label: 'Waive fine', icon: 'gift', onClick: (sel) => notify({ title: `Fine waived on ${sel.length} loans`, tone: 'warning' }) },
            ],
            rowActions: (r) => [
              { label: 'Accept return', icon: 'arrow-down-right', route: 'library/return' },
              { label: 'Renew', icon: 'refresh', route: 'library/renew' },
              r.studentId ? { label: 'Open student', icon: 'eye', route: `students/profile/${r.studentId}` } : null,
            ].filter(Boolean),
            onRowClick: () => navigate('library/fines'),
          }) : EmptyState({ icon: 'check-circle', tone: 'success', title: 'Nothing overdue', text: 'Every loan on the register is inside its return window.' })),
      },

      {
        span: 5,
        render: () => widget({ title: 'Most borrowed titles', subtitle: 'Lifetime issue count', icon: 'trophy', viewAll: 'library/catalog' },
          RankList(popular.map((b) => ({
            name: b.title, avatar: false,
            meta: `${b.author} · ${b.category} · ${b.availableCopies}/${b.totalCopies} available`,
            value: formatNumber(b.timesIssued),
          })))),
      },

      {
        span: 4,
        render: () => widget({ title: 'Top borrowers', subtitle: 'Members with the deepest reading habit', icon: 'users', viewAll: 'library/members' },
          topBorrowers.length ? RankList(topBorrowers.map((m) => ({
            name: m.name, meta: `${m.memberType}${m.className ? ` · ${m.className} ${m.section}` : ''} · ${m.currentIssued}/${m.maxBooks} on loan`,
            value: formatNumber(m.totalIssued),
          }))) : EmptyState({ icon: 'users', title: 'No borrowing yet', text: 'Issue the first book to start ranking members.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Shelf position', subtitle: `${formatNumber(totalCopies)} physical copies`, icon: 'library', viewAll: 'library/copies', className: 'chart-card' },
          stackedProgressBar({
            segments: [
              { label: 'On shelf', value: totalCopies - issuedCopies, color: seriesColor(0) },
              { label: 'On loan', value: issuedCopies - overdue.length, color: seriesColor(1) },
              { label: 'Overdue', value: overdue.length, color: STATUS.critical },
            ],
            barHeight: 16, showLegend: true, valueFormat: 'number', title: 'Copy status',
          }),
          h('div', { className: 'mt-4' }, tileGrid([
            { label: 'Titles fully out', value: formatNumber(allIssued.length), tone: 'warning', sub: 'zero copies on shelf', route: 'library/catalog' },
            { label: 'Digital titles', value: formatNumber(digital.length), tone: 'info', sub: 'e-books and PDFs', route: 'library/digital' },
            { label: 'Avg loan length', value: '14 days', sub: 'policy maximum', route: 'library/renew' },
            { label: 'Renewals', value: formatNumber(sum(issues, 'renewals')), sub: 'this session', route: 'library/renew' },
          ]))),
      },

      {
        span: 4,
        render: () => widget({ title: 'Membership mix', subtitle: `${formatNumber(members.length)} active cards`, icon: 'chart-pie', viewAll: 'library/members', className: 'chart-card' },
          donutChart({
            data: memberTypes, centerValue: formatNumber(members.length), centerLabel: 'Members',
            height: 260, title: 'Membership mix',
          })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Desk activity', subtitle: asOf(issuedToday), icon: 'activity', viewAll: 'library/issue' },
          issuedToday.rows.length ? h('div', { className: 'dash-rows' }, sortBy(issuedToday.rows, 'issueDate', 'desc').slice(0, 7).map((i) => h('div', { className: 'dash-row' },
            Avatar(i.memberName, { size: 'sm' }),
            h('div', { className: 'dash-row-main' },
              h('div', { className: 'dash-row-title' }, i.bookTitle),
              h('div', { className: 'dash-row-meta' }, `${i.memberName} · ${i.memberType} · due ${formatDate(i.dueDate, 'medium')}`)),
            Badge(i.status))))
            : EmptyState({ icon: 'book', title: 'Desk is quiet', text: 'No issues recorded on this date. The counter opens with the first period.' })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Library exceptions', subtitle: 'What needs the librarian today', icon: 'alert-triangle', viewAll: 'library/lost-damaged' },
          alertsPanel([
            overdue.length && {
              severity: overdue.length > 100 ? 'critical' : 'high', icon: 'timer',
              title: `${overdue.length} overdue loans`,
              text: `${money(sum(overdue, 'fine'))} in fines accrued. Longest overdue is ${formatDate(sortBy(overdue, 'dueDate')[0].dueDate, 'medium')}.`,
              badge: Badge('Circulation', { tone: 'danger' }), route: 'library/fines',
            },
            fines.length && {
              severity: 'medium', icon: 'rupee', title: `${fines.length} unpaid fines`,
              text: 'Fines block further issues once they cross ₹500 per member.',
              badge: Badge('Fines', { tone: 'warning' }), route: 'library/fines',
            },
            allIssued.length && {
              severity: 'medium', icon: 'book', title: `${allIssued.length} titles have no copy on the shelf`,
              text: 'High-demand titles worth ordering additional copies of before the exam cycle.',
              badge: Badge('Stock', { tone: 'warning' }), route: 'library/catalog',
            },
            {
              severity: 'low', icon: 'monitor', title: `${digital.length} digital titles available`,
              text: 'Digital copies never go out of stock — promote them to senior classes.',
              badge: Badge('Digital', { tone: 'info' }), route: 'library/digital',
            },
          ].filter(Boolean))),
      },

      {
        span: 6,
        render: () => widget({ title: 'Fine waivers awaiting a decision', subtitle: `${waiverQueue.length} requests · ${money(sum(waiverQueue, 'fine'))} at stake`, icon: 'stamp', viewAll: 'library/fines' },
          approvalsPanel({
            rows: waiverQueue,
            avatar: (r) => r.memberName,
            title: (r) => `${r.memberName} · ${money(r.fine)}`,
            meta: (r) => `${r.bookTitle} · ${r.className} ${r.section} · due ${formatDate(r.dueDate, 'medium')} · ${Math.round((new Date(TODAY) - new Date(r.dueDate)) / 86400000)} days late`,
            side: (r) => Badge(r.renewals ? `${r.renewals} renewal${r.renewals > 1 ? 's' : ''}` : 'No renewal', { tone: r.renewals ? 'warning' : 'neutral' }),
            emptyTitle: 'No waivers pending',
            emptyText: 'Every fine on the ledger has been either collected or written off.',
            onApprove: (r) => notify({ title: 'Fine waived', text: `${r.memberName} · ${money(r.fine)} written off`, tone: 'success' }),
          })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Circulation desk activity', subtitle: 'The last movements across the counter', icon: 'activity', viewAll: 'library/issue' },
          deskFeed.length
            ? ActivityFeed(deskFeed)
            : EmptyState({ icon: 'activity', title: 'The desk has been quiet', text: 'Issues and returns appear here the moment they are scanned.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Category circulation', subtitle: 'Issues by section of the collection', icon: 'chart-bar', viewAll: 'library/reports', className: 'chart-card' },
          barChart({
            categories: analytics.libraryCategorySplit.map((c) => c.key),
            series: [{ name: 'Issues', values: analytics.libraryCategorySplit.map((c) => c.value) }],
            horizontal: true, showValues: true, height: 280, valueFormat: 'number', title: 'Circulation by category',
          })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Reading room diary', subtitle: 'Sessions and school events', icon: 'calendar-check', viewAll: 'events/calendar' },
          upcomingList(campusId, 5)),
      },

      {
        span: 4,
        render: () => widget({ title: 'Library activity log', subtitle: 'Recent catalogue and issue changes', icon: 'history', viewAll: 'system/audit-logs' },
          auditFeed(['library'], campusId, 6)),
      },
    ],
  });
}

/* =================================================== 9 · TRANSPORT === */

function routeMapData(campusId) {
  const routes = scope(db.routes, campusId).slice(0, 6);
  const out = [];
  routes.forEach((r, i) => {
    const stops = sortBy(db.stops.filter((s) => s.routeId === r.id), 'seq');
    if (stops.length < 2) return;
    const lats = stops.map((s) => s.lat);
    const lngs = stops.map((s) => s.lng);
    const minLat = Math.min(...lats); const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs); const maxLng = Math.max(...lngs);
    const path = stops.map((s) => [
      round1(6 + ((s.lng - minLng) / ((maxLng - minLng) || 1)) * 88),
      round1(6 + ((s.lat - minLat) / ((maxLat - minLat) || 1)) * 48),
    ]);
    out.push({ id: r.id, name: `${r.code} · ${r.name}`, color: seriesColor(i), path, route: r });
  });
  return out;
}

function buildTransport(ctx) {
  const campusId = ctx.state.campusId;
  const head = headerFor(ctx, 'Transport control room');

  const routes = scope(db.routes, campusId);
  const fleet = campusId ? db.vehicles.filter((v) => routes.some((r) => r.id === v.routeId)) : db.vehicles;
  const onRoute = fleet.filter((v) => v.status === 'On Route');
  const outOfService = fleet.filter((v) => v.status === 'Out of Service' || v.status === 'Maintenance');
  const drivers = scope(db.drivers, campusId);
  const onDuty = drivers.filter((d) => d.status === 'On Duty');
  const busAtt = dayRows(scope(db.busAttendance, campusId), 'date');
  const delayed = busAtt.rows.filter((b) => num(b.delayMin) > 5);
  const fuel = db.fuelLogs.filter((f) => fleet.some((v) => v.id === f.vehicleId));
  const fuelMtd = fuel.filter((f) => dayKey(f.date) >= '2026-08-01');
  const maint = db.maintenanceLogs.filter((m) => fleet.some((v) => v.id === m.vehicleId));
  const maintOpen = maint.filter((m) => m.status !== 'Completed');
  const serviceDue = fleet.filter((v) => v.nextService <= '2026-09-30');
  const docExpiry = fleet.filter((v) => [v.insuranceExpiry, v.pucExpiry, v.fitnessExpiry, v.permitExpiry].some((d) => d <= '2026-12-31'));
  const incidents = scope(db.incidents, campusId).filter((i) => i.type === 'Vehicle Incident');
  const util = analytics.transportUtilisation;
  const mapRoutes = routeMapData(campusId);
  const mapVehicles = mapRoutes.map((r, i) => {
    const v = fleet.find((x) => x.routeId === r.id);
    return { routeId: r.id, label: v ? `${v.regNo} · ${v.onboard} onboard` : `Bus ${i + 1}`, progress: 0.15 + (i * 0.17) % 0.8 };
  });

  // Garage bookings that have not started are the transport manager's approval
  // queue; the depot feed is the real fuel / workshop / trip traffic.
  const workshopQueue = maint.filter((m) => m.status === 'Scheduled' || m.status === 'In Progress').slice(0, 8);
  const depotFeed = sortBy([
    ...fuel.slice(-14).map((f) => ({
      when: f.date, name: (byId(db.drivers, f.filledBy) || {}).name || f.regNo,
      text: `fuelled ${f.regNo} · ${f.litres} L at ₹${f.rate}/L — ${money(f.amount)}`,
      time: `${relativeTime(f.date)} · ${f.station} · ${f.mileage} km/L`, tone: 'info',
    })),
    ...maint.slice(-10).map((m) => ({
      when: m.date, name: m.garage,
      text: `${m.status === 'Completed' ? 'completed' : 'booked'} ${m.type} on ${m.regNo} — ${money(m.cost)}`,
      time: `${relativeTime(m.date)} · ${m.downtimeDays} day${m.downtimeDays === 1 ? '' : 's'} off the road`,
      tone: m.status === 'Completed' ? 'success' : 'warning',
    })),
    ...busAtt.rows.slice(0, 8).map((b) => ({
      when: b.date, name: b.routeName,
      text: `${b.trip.toLowerCase()} · ${b.boarded}/${b.expected} boarded${num(b.delayMin) ? `, ${b.delayMin} min late` : ', on time'}`,
      time: `${relativeTime(b.date)} · ${b.percent}% · ${b.vehicleId}`,
      tone: num(b.delayMin) > 10 ? 'danger' : num(b.delayMin) ? 'warning' : 'success',
    })),
  ], 'when', 'desc').slice(0, 10);

  const fuelByMonth = (() => {
    const m = new Map();
    for (const f of fuel) {
      const key = String(f.date).slice(0, 7);
      m.set(key, (m.get(key) || 0) + num(f.amount));
    }
    return Array.from(m, ([key, value]) => ({ key, value })).sort((a, b) => (a.key < b.key ? -1 : 1));
  })();

  return dashboardPage({
    greeting: head.greeting,
    subtitle: head.subtitle,
    route: 'dashboard/transport',
    actions: quickActions(ctx, [
      { label: 'Live tracking', icon: 'navigation', route: 'transport/tracking' },
      { label: 'Bus attendance', icon: 'clipboard-check', route: 'transport/bus-attendance' },
      { label: 'Log incident', icon: 'alert-triangle', route: 'transport/incidents' },
    ]),
    kpis: [
      { label: 'Fleet size', value: formatNumber(fleet.length), deltaLabel: `${routes.length} routes`, icon: 'bus', tone: 'brand', route: 'transport/vehicles' },
      { label: 'On route now', value: formatNumber(onRoute.length), deltaLabel: `${fleet.filter((v) => v.status === 'Idle').length} idle`, icon: 'navigation', tone: 'success', route: 'transport/tracking' },
      { label: 'Out of service', value: formatNumber(outOfService.length), delta: outOfService.length ? 14 : -100, deltaLabel: 'vs last week', icon: 'wrench', tone: outOfService.length ? 'danger' : 'success', route: 'transport/maintenance' },
      { label: 'Students carried', value: formatNumber(sum(routes, 'studentCount')), delta: deltaOf(analytics.sparks.transport), deltaLabel: 'vs last month', icon: 'users', tone: 'info', trend: analytics.sparks.transport, route: 'transport/allocation' },
      { label: 'Fleet utilisation', value: `${round1(avg(util, 'utilisation'))}%`, delta: 2.4, deltaLabel: 'vs last month', icon: 'gauge', tone: 'success', route: 'transport/reports' },
      { label: 'Fuel spend MTD', value: money(sum(fuelMtd, 'amount'), true), delta: 5.8, deltaLabel: 'vs last month', icon: 'fuel', tone: 'warning', route: 'transport/fuel-log' },
      { label: 'Trips delayed', value: formatNumber(delayed.length), deltaLabel: asOf(busAtt), icon: 'timer', tone: delayed.length ? 'warning' : 'success', route: 'transport/trip-log' },
      { label: 'Document alerts', value: formatNumber(docExpiry.length), deltaLabel: 'expiring this year', icon: 'shield', tone: 'danger', route: 'transport/documents' },
    ],
    widgets: [
      {
        span: 8,
        render: () => widget({
          title: 'Live route map',
          subtitle: `${mapRoutes.length} routes plotted from stop coordinates · positions refresh every few seconds`,
          icon: 'navigation', viewAll: 'transport/tracking', viewAllLabel: 'Open tracking',
        }, MapPlaceholder({ routes: mapRoutes, vehicles: mapVehicles, height: 360, animate: true, legend: true })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Vehicles on the road', subtitle: `${onRoute.length} moving · ${fleet.length} in fleet`, icon: 'bus', viewAll: 'transport/vehicles' },
          fleet.length ? h('div', { className: 'dash-rows' }, sortBy(fleet, 'status').slice(0, 8).map((v) => {
            const r = byId(db.routes, v.routeId);
            const d = byId(db.drivers, v.driverId);
            return h('div', { className: 'dash-row' },
              h('span', { className: 'dash-alert-ico', dataset: { sev: v.status === 'On Route' ? 'low' : v.status === 'Idle' ? 'info' : 'high' }, html: icon('bus', 15) }),
              h('div', { className: 'dash-row-main' },
                h('div', { className: 'dash-row-title' }, `${v.regNo} · ${r ? r.code : '—'}`),
                h('div', { className: 'dash-row-meta' }, `${d ? d.name : 'Unassigned'} · ${v.onboard}/${v.capacity} onboard · ${v.speed} km/h · ping ${relativeTime(v.lastPing)}`)),
              Badge(v.status, { tone: v.status === 'On Route' ? 'success' : v.status === 'Idle' ? 'info' : 'danger' }));
          })) : EmptyState({ icon: 'bus', title: 'No vehicles on this campus', text: 'Assign routes and vehicles to see live positions here.', action: Button('Manage routes', { variant: 'secondary', icon: 'route', route: 'transport/routes' }) })),
      },

      {
        span: 7,
        render: () => widget({ title: 'Route utilisation against capacity', subtitle: 'Seats used vs seats available', icon: 'target', viewAll: 'transport/routes', className: 'chart-card' },
          bulletChart({
            items: util.slice(0, 8).map((r) => ({ label: `${r.route} ${r.routeName}`.slice(0, 30), value: r.used, target: r.capacity * 0.9, ranges: [r.capacity * 0.5, r.capacity * 0.8, r.capacity] })),
            valueFormat: 'number', height: 320, title: 'Route utilisation',
          })),
      },

      {
        span: 5,
        render: () => widget({ title: 'Boarding counts', subtitle: asOf(busAtt), icon: 'clipboard-check', viewAll: 'transport/bus-attendance', className: 'chart-card' },
          busAtt.rows.length ? barChart({
            categories: busAtt.rows.slice(0, 10).map((b) => b.routeName.slice(0, 18)),
            series: [
              { name: 'Boarded', values: busAtt.rows.slice(0, 10).map((b) => b.boarded) },
              { name: 'Absent', values: busAtt.rows.slice(0, 10).map((b) => b.absent) },
            ],
            stacked: true, horizontal: true, height: 320, valueFormat: 'number', title: 'Boarding counts by route',
          }) : EmptyState({ icon: 'clipboard-check', title: 'No trips marked', text: 'Conductors mark boarding from the driver app at each stop.' })),
      },

      {
        span: 6,
        render: () => rangedChart({
          title: 'Fuel spend',
          subtitle: `${formatNumber(sum(fuel, 'litres'))} litres logged · avg ${round1(avg(fuel, 'mileage'))} km/l`,
          icon: 'fuel', viewAll: 'transport/fuel-log',
          ranges: [{ id: 'all', label: 'All months' }, { id: 'q', label: 'Last 3' }],
          build: (r) => {
            const src = r === 'q' ? fuelByMonth.slice(-3) : fuelByMonth;
            if (!src.length) return null;
            return areaChart({
              categories: src.map((x) => formatDate(`${x.key}-01`, 'monthYear')),
              series: [{ name: 'Fuel cost', values: src.map((x) => x.value) }],
              valueFormat: 'currencyCompact', height: 280, title: 'Fuel spend by month',
            });
          },
        }),
      },

      {
        span: 6,
        render: () => widget({ title: 'Maintenance and service', subtitle: `${maintOpen.length} jobs open · ${serviceDue.length} services due by September`, icon: 'wrench', viewAll: 'transport/maintenance' },
          (maintOpen.length || serviceDue.length) ? DataTable({
            rows: maintOpen.concat(serviceDue.map((v) => ({
              id: `SVC-${v.id}`, vehicleId: v.id, regNo: v.regNo, date: v.nextService, type: 'Scheduled service',
              garage: 'Authorised workshop', cost: 0, downtimeDays: 1, status: 'Scheduled', remarks: `Last serviced ${formatDate(v.lastService, 'medium')}`,
            }))).slice(0, 30),
            pageSize: 6, searchable: true, searchKeys: ['regNo', 'type', 'garage'], searchPlaceholder: 'Search jobs…',
            exportName: 'maintenance', maxHeight: 'none',
            columns: [
              { key: 'regNo', label: 'Vehicle', sticky: true, width: 150, render: (r) => Identity(r.regNo, r.type), value: (r) => r.regNo },
              { key: 'date', label: 'Date', width: 120, render: (r) => formatDate(r.date, 'medium') },
              { key: 'garage', label: 'Workshop', width: 200 },
              { key: 'cost', label: 'Cost', numeric: true, align: 'right', width: 110, render: (r) => (num(r.cost) ? money(r.cost) : '—') },
              { key: 'downtimeDays', label: 'Downtime', numeric: true, align: 'right', width: 110, render: (r) => `${r.downtimeDays}d` },
              { key: 'status', label: 'Status', width: 130, render: (r) => Badge(r.status) },
            ],
            onRowClick: () => navigate('transport/maintenance'),
          }) : EmptyState({ icon: 'check-circle', tone: 'success', title: 'Fleet fully serviced', text: 'No open jobs and nothing due in the next six weeks.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Compliance alerts', subtitle: 'Insurance, fitness, permit and PUC', icon: 'shield', viewAll: 'transport/documents' },
          alertsPanel(docExpiry.slice(0, 6).map((v) => {
            const soonest = [
              { label: 'Insurance', date: v.insuranceExpiry },
              { label: 'PUC', date: v.pucExpiry },
              { label: 'Fitness', date: v.fitnessExpiry },
              { label: 'Permit', date: v.permitExpiry },
            ].sort((a, b) => (a.date < b.date ? -1 : 1))[0];
            return {
              severity: soonest.date <= '2026-09-30' ? 'critical' : soonest.date <= '2026-11-30' ? 'high' : 'medium',
              icon: 'shield', title: `${v.regNo} — ${soonest.label} expires ${formatDate(soonest.date, 'medium')}`,
              text: `${v.model} · ${v.type} · ${v.capacity} seats · odometer ${formatNumber(v.odometer)} km`,
              meta: relativeTime(soonest.date), route: 'transport/documents',
            };
          }), { emptyTitle: 'All documents current', emptyText: 'Every vehicle has valid insurance, fitness, permit and PUC.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Punctuality by route', subtitle: 'On-time percentage against utilisation', icon: 'timer', viewAll: 'transport/trip-log', className: 'chart-card' },
          scatterPlot({
            points: util.map((r) => ({ x: r.utilisation, y: r.onTime, label: `${r.route} ${r.routeName}`, group: r.onTime >= 90 ? 'On time' : 'Needs attention', size: 6 })),
            xLabel: 'Utilisation %', yLabel: 'On-time %', height: 300, title: 'Punctuality vs utilisation',
          })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Crew on duty', subtitle: `${onDuty.length} of ${drivers.length} available`, icon: 'users', viewAll: 'transport/drivers' },
          drivers.length ? h('div', { className: 'dash-rows' }, sortBy(drivers, 'rating', 'desc').slice(0, 6).map((d) => h('div', { className: 'dash-row' },
            Avatar(d.name, { size: 'sm', status: d.status === 'On Duty' ? 'online' : 'offline' }),
            h('div', { className: 'dash-row-main' },
              h('div', { className: 'dash-row-title' }, `${d.name} · ${d.role}`),
              h('div', { className: 'dash-row-meta' }, `${d.experienceYears} yrs · licence to ${formatDate(d.licenceExpiry, 'monthYear')} · ${d.policeVerified ? 'police verified' : 'verification pending'}`)),
            h('div', { className: 'dash-row-acts' }, Rating(d.rating, { showValue: true })))))
            : EmptyState({ icon: 'users', title: 'No crew assigned', text: 'Assign drivers and conductors to the routes on this campus.' })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Vehicle incidents', subtitle: `${incidents.length} logged this session`, icon: 'alert-triangle', viewAll: 'transport/incidents' },
          incidents.length ? Timeline(sortBy(incidents, 'date', 'desc').slice(0, 6).map((i) => ({
            title: `${i.reference} · ${i.location}`,
            meta: `${formatDate(i.date, 'medium')} ${i.time} · reported by ${i.reportedBy}`,
            text: `${i.description} — ${i.actionTaken}`,
            icon: 'alert-triangle',
            tone: i.severity === 'Critical' ? 'danger' : i.severity === 'High' ? 'danger' : i.severity === 'Medium' ? 'warning' : 'info',
          }))) : EmptyState({ icon: 'shield-check', tone: 'success', title: 'No vehicle incidents', text: 'The fleet has run clean this session.' })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Route ledger', subtitle: `${routes.length} routes · ${money(sum(routes, 'monthlyRevenue'), true)} monthly transport revenue`, icon: 'route', viewAll: 'transport/routes' },
          routes.length ? DataTable({
            rows: routes,
            pageSize: 6, searchable: true, searchKeys: ['code', 'name'], searchPlaceholder: 'Search routes…',
            exportName: 'routes', maxHeight: 'none', footerAggregates: true,
            columns: [
              { key: 'code', label: 'Route', sticky: true, width: 190, render: (r) => Identity(`${r.code} · ${r.name}`, `${r.stopCount} stops · ${r.distanceKm} km · ${r.durationMin} min`), value: (r) => r.code },
              { key: 'studentCount', label: 'Students', numeric: true, align: 'right', width: 100, aggregate: 'sum' },
              { key: 'capacity', label: 'Capacity', numeric: true, align: 'right', width: 100, aggregate: 'sum' },
              { key: 'pickupStart', label: 'Pickup', width: 100 },
              { key: 'fare', label: 'Fare', numeric: true, align: 'right', width: 110, render: (r) => money(r.fare) },
              { key: 'monthlyRevenue', label: 'Revenue', numeric: true, align: 'right', width: 130, aggregate: 'sum', format: (v) => money(v, true), render: (r) => money(r.monthlyRevenue) },
              { key: 'status', label: 'Status', width: 100, render: (r) => Badge(r.status) },
            ],
            onRowClick: () => navigate('transport/routes'),
          }) : EmptyState({ icon: 'route', title: 'No routes configured', text: 'Create routes and stops before allocating students.', action: Button('Add route', { variant: 'primary', icon: 'plus', route: 'transport/routes' }) })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Workshop jobs awaiting approval', subtitle: `${workshopQueue.length} jobs · ${money(sum(workshopQueue, 'cost'))} quoted`, icon: 'stamp', viewAll: 'transport/maintenance' },
          approvalsPanel({
            rows: sortBy(workshopQueue, 'cost', 'desc'),
            avatar: (r) => r.garage,
            title: (r) => `${r.regNo} · ${r.type}`,
            meta: (r) => `${r.garage} · booked ${formatDate(r.date, 'medium')} · ${r.downtimeDays} day${r.downtimeDays === 1 ? '' : 's'} off the road · ${r.remarks}`,
            side: (r) => h('span', { className: 't-semibold t-num t-nowrap' }, money(r.cost)),
            emptyTitle: 'No jobs waiting',
            emptyText: 'Every booked service has already been authorised.',
            onApprove: (r) => notify({ title: 'Work order released', text: `${r.regNo} · ${r.garage} · ${money(r.cost)}`, tone: 'success' }),
          })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Depot activity', subtitle: 'Fuelling, servicing and today\u2019s runs', icon: 'activity', viewAll: 'transport/fuel-log' },
          depotFeed.length
            ? ActivityFeed(depotFeed)
            : EmptyState({ icon: 'activity', title: 'Nothing logged yet', text: 'Fuel entries, workshop visits and completed runs land here as the crews report in.' })),
      },
    ],
  });
}

/* ===================================================== 10 · HOSTEL === */

function buildHostel(ctx) {
  const campusId = ctx.state.campusId;
  const onCampus = scope(db.hostels, campusId);
  const hostels = onCampus.length ? onCampus : db.hostels;
  const groupWide = !onCampus.length;
  const hostelIds = hostels.map((x) => x.id);
  const rooms = db.hostelRooms.filter((r) => hostelIds.includes(r.hostelId));
  const allocations = db.hostelAllocations.filter((a) => hostelIds.includes(a.hostelId) && a.status === 'Active');
  const boarderIds = new Set(allocations.map((a) => a.studentId));
  const boarders = db.students.filter((s) => boarderIds.has(s.id));
  const gatePasses = db.gatePasses.filter((g) => g.type === 'Student' && boarderIds.has(g.personId));
  const gpPending = db.gatePasses.filter((g) => g.status === 'Pending');
  const outNow = gatePasses.filter((g) => g.status === 'Approved');
  const complaints = db.complaints.filter((c) => c.category === 'Hostel');
  const openComplaints = complaints.filter((c) => !['Resolved', 'Closed'].includes(c.status));
  const maintenance = db.complaints.filter((c) => c.category === 'Infrastructure' && !['Resolved', 'Closed'].includes(c.status));
  const menuToday = db.messMenu.find((m) => m.day === TODAY_DOW) || db.messMenu[0];
  const feeDue = sum(boarders, 'feeOverdue'); // instalments past their due date
  const capacity = sum(hostels, 'capacity');
  const occupied = sum(hostels, 'occupied');
  const roomStatus = Array.from(groupBy(rooms, 'status'), ([key, list]) => ({ key, value: list.length }));
  const messPlans = Array.from(groupBy(allocations, 'messPlan'), ([key, list]) => ({ key, value: list.length }));
  const presentTonight = allocations.length - outNow.length;
  const head = headerFor(
    ctx, 'Hostel warden dashboard',
    groupWide ? `${hostels.length} blocks — no boarding on the selected campus, showing the group` : `${hostels.length} blocks`,
    groupWide,
  );

  return dashboardPage({
    greeting: head.greeting,
    subtitle: head.subtitle,
    route: 'dashboard/hostel',
    actions: quickActions(ctx, [
      { label: 'Roll call', icon: 'clipboard-check', route: 'hostel/attendance' },
      { label: 'Issue gate pass', icon: 'log-out', route: 'hostel/gate-pass' },
      { label: 'Allocate room', icon: 'user-check', route: 'hostel/allocation' },
    ]),
    kpis: [
      { label: 'Capacity', value: formatNumber(capacity), deltaLabel: `${rooms.length} rooms · ${hostels.length} blocks`, icon: 'building-2', tone: 'brand', route: 'hostel/buildings' },
      { label: 'Boarders', value: formatNumber(occupied), delta: deltaOf(analytics.sparks.hostel), deltaLabel: 'vs last month', icon: 'bed', tone: 'info', trend: analytics.sparks.hostel, route: 'hostel/allocation' },
      { label: 'Occupancy', value: `${round1(pct(occupied, capacity))}%`, delta: 1.8, deltaLabel: 'vs last month', icon: 'gauge', tone: pct(occupied, capacity) > 90 ? 'warning' : 'success', route: 'hostel/reports' },
      { label: 'Beds vacant', value: formatNumber(capacity - occupied), deltaLabel: `${rooms.filter((r) => r.status === 'Vacant').length} empty rooms`, icon: 'door', tone: 'success', route: 'hostel/beds' },
      { label: 'In tonight', value: formatNumber(presentTonight), deltaLabel: `${outNow.length} on gate pass`, icon: 'clipboard-check', tone: 'success', route: 'hostel/attendance' },
      { label: 'Gate passes pending', value: formatNumber(gpPending.length), deltaLabel: 'awaiting warden sign-off', icon: 'log-out', tone: gpPending.length ? 'warning' : 'success', route: 'hostel/gate-pass' },
      { label: 'Open complaints', value: formatNumber(openComplaints.length), delta: -8.3, deltaLabel: 'vs last month', icon: 'alert-circle', tone: 'warning', route: 'hostel/complaints' },
      { label: 'Hostel fee overdue', value: money(feeDue, true), deltaLabel: `${boarders.filter((b) => num(b.feeOverdue) > 0).length} of ${boarders.length} boarders`, icon: 'wallet', tone: feeDue ? 'danger' : 'success', route: 'hostel/fees' },
    ],
    widgets: [
      {
        span: 7,
        render: () => widget({ title: 'Occupancy by block', subtitle: 'Beds filled against capacity', icon: 'building-2', viewAll: 'hostel/buildings', className: 'chart-card' },
          barChart({
            categories: hostels.map((hst) => hst.name.replace(' Hostel', '')),
            series: [
              { name: 'Occupied', values: hostels.map((hst) => num(hst.occupied)) },
              { name: 'Vacant', values: hostels.map((hst) => Math.max(0, num(hst.capacity) - num(hst.occupied))) },
            ],
            stacked: true, horizontal: true, height: 280, valueFormat: 'number', title: 'Occupancy by block',
          }),
          h('div', { className: 'mt-3' }, tileGrid(hostels.map((hst) => ({
            label: hst.name.replace(' Hostel', ''), value: `${round1(pct(hst.occupied, hst.capacity))}%`,
            sub: `${hst.occupied}/${hst.capacity} beds · ${hst.type}`,
            tone: pct(hst.occupied, hst.capacity) > 92 ? 'warning' : 'success', route: 'hostel/rooms',
          }))))),
      },

      {
        span: 5,
        render: () => widget({ title: 'Room status', subtitle: `${rooms.length} rooms across ${hostels.length} blocks`, icon: 'door', viewAll: 'hostel/rooms', className: 'chart-card' },
          donutChart({
            data: roomStatus, centerValue: formatNumber(rooms.length), centerLabel: 'Rooms', height: 260,
            title: 'Room occupancy status',
          }),
          h('div', { className: 'mt-3' }, tileGrid([
            { label: 'AC rooms', value: formatNumber(rooms.filter((r) => r.ac).length), route: 'hostel/rooms' },
            { label: 'Attached bath', value: formatNumber(rooms.filter((r) => r.attachedBath).length), route: 'hostel/rooms' },
            { label: 'Needs repair', value: formatNumber(rooms.filter((r) => r.condition !== 'Good').length), tone: 'warning', route: 'hostel/maintenance' },
          ]))),
      },

      {
        span: 5,
        render: () => widget({ title: "Tonight's roll call", subtitle: `${allocations.length} boarders expected`, icon: 'clipboard-check', viewAll: 'hostel/attendance' },
          h('div', { className: 'row', style: { justifyContent: 'center' } },
            progressRing(pct(presentTonight, allocations.length || 1), {
              size: 132, label: 'Accounted for', sublabel: `${presentTonight} of ${allocations.length}`,
            })),
          h('div', { className: 'mt-3' }, tileGrid([
            { label: 'In hostel', value: formatNumber(presentTonight), tone: 'success', route: 'hostel/attendance' },
            { label: 'On gate pass', value: formatNumber(outNow.length), tone: 'warning', route: 'hostel/gate-pass' },
            { label: 'Overdue return', value: formatNumber(outNow.filter((g) => g.expectedReturn && g.expectedReturn < '20:00').length), tone: 'danger', route: 'hostel/gate-pass' },
            { label: 'Visitors today', value: formatNumber(db.visitors.filter((v) => v.purpose === 'Collect Ward').length), tone: 'info', route: 'hostel/visitors' },
          ]))),
      },

      {
        span: 7,
        render: () => widget({ title: 'Gate passes awaiting approval', subtitle: `${gpPending.length} requests`, icon: 'log-out', viewAll: 'hostel/gate-pass' },
          approvalsPanel({
            rows: sortBy(gpPending, 'date', 'desc'),
            avatar: (r) => r.personName,
            title: (r) => `${r.personName} — ${r.reason}`,
            meta: (r) => `${r.className || r.type} · out ${r.outTime}, ${r.expectedReturn ? `back by ${r.expectedReturn}` : 'not returning today'} · ${formatDate(r.date, 'medium')} · picked up by ${r.pickedUpBy || 'self'}`,
            side: (r) => Badge(r.securityVerified ? 'ID verified' : 'ID pending', { tone: r.securityVerified ? 'success' : 'warning' }),
            onApprove: (r) => notify({ title: 'Gate pass approved', text: `${r.passNo} · ${r.personName}`, tone: 'success' }),
          })),
      },

      {
        span: 4,
        render: () => widget({ title: `Mess — ${menuToday.day}`, subtitle: `${formatNumber(menuToday.calories)} kcal planned per boarder`, icon: 'utensils', viewAll: 'hostel/mess-menu' },
          DescriptionList([
            ['Breakfast', menuToday.breakfast],
            ['Lunch', menuToday.lunch],
            ['Snacks', menuToday.snacks],
            ['Dinner', menuToday.dinner],
            ['Special', menuToday.special || 'None scheduled'],
          ]),
          h('div', { className: 'mt-3' }, stackedProgressBar({
            segments: messPlans.map((m, i) => ({ label: m.key, value: m.value, color: seriesColor(i) })),
            barHeight: 14, showLegend: true, valueFormat: 'number', title: 'Mess plan mix',
          }))),
      },

      {
        span: 4,
        render: () => widget({ title: 'Hostel complaints', subtitle: `${openComplaints.length} open · ${complaints.filter((c) => c.slaBreached).length} past SLA`, icon: 'alert-circle', viewAll: 'hostel/complaints' },
          openComplaints.length ? alertsPanel(sortBy(openComplaints, 'ageHours', 'desc').slice(0, 6).map((c) => ({
            severity: c.slaBreached ? 'critical' : c.priority === 'High' ? 'high' : c.priority === 'Medium' ? 'medium' : 'low',
            icon: 'alert-circle', title: c.subject,
            text: `${c.ticketNo} · raised by ${c.raisedByName} (${c.raisedBy}) · assigned to ${c.assignedToName}`,
            meta: `${Math.round(num(c.ageHours) / 24)}d old`, route: 'hostel/complaints',
          }))) : EmptyState({ icon: 'check-circle', tone: 'success', title: 'No open complaints', text: 'Every hostel ticket raised this session has been resolved.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Maintenance tickets', subtitle: `${maintenance.length} infrastructure jobs open`, icon: 'wrench', viewAll: 'hostel/maintenance' },
          maintenance.length ? h('div', { className: 'dash-rows' }, sortBy(maintenance, 'ageHours', 'desc').slice(0, 6).map((c) => h('div', { className: 'dash-row' },
            h('span', { className: 'dash-alert-ico', dataset: { sev: c.slaBreached ? 'high' : 'medium' }, html: icon('wrench', 15) }),
            h('div', { className: 'dash-row-main' },
              h('div', { className: 'dash-row-title' }, c.subject),
              h('div', { className: 'dash-row-meta' }, `${c.ticketNo} · ${c.department} · ${c.assignedToName} · ${Math.round(num(c.ageHours) / 24)} days old`)),
            Badge(c.status))))
            : EmptyState({ icon: 'wrench', tone: 'success', title: 'Nothing broken', text: 'No infrastructure jobs are outstanding.' })),
      },

      {
        span: 8,
        render: () => widget({ title: 'Boarder register', subtitle: `${allocations.length} active allocations`, icon: 'users', viewAll: 'hostel/allocation' },
          allocations.length ? DataTable({
            rows: allocations,
            pageSize: 8, searchable: true, searchKeys: ['studentName', 'roomNo', 'className'], searchPlaceholder: 'Search boarders…',
            exportName: 'boarders', maxHeight: 'none', selectable: true,
            columns: [
              { key: 'studentName', label: 'Boarder', sticky: true, width: 210, render: (r) => Identity(r.studentName, `${r.className} ${r.section}`), value: (r) => r.studentName },
              { key: 'hostelName', label: 'Block', width: 180, filter: true },
              { key: 'roomNo', label: 'Room', width: 90, render: (r) => `${r.roomNo}/${r.bedNo}` },
              { key: 'messPlan', label: 'Mess plan', width: 130, filter: true },
              { key: 'localGuardian', label: 'Local guardian', width: 190, render: (r) => h('div', null, h('div', { className: 't-sm' }, r.localGuardian), h('div', { className: 't-xs t-muted t-mono' }, r.localGuardianPhone)), value: (r) => r.localGuardian },
              { key: 'monthlyFee', label: 'Monthly fee', numeric: true, align: 'right', width: 130, aggregate: 'sum', format: (v) => money(v, true), render: (r) => money(r.monthlyFee) },
              { key: 'allocatedOn', label: 'Since', width: 120, render: (r) => formatDate(r.allocatedOn, 'medium') },
            ],
            footerAggregates: true,
            bulkActions: [
              { label: 'Notify guardians', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} guardians notified`, tone: 'success' }) },
              { label: 'Mark present tonight', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} boarders marked present`, tone: 'success' }) },
            ],
            rowActions: (r) => [
              { label: 'Open student', icon: 'eye', route: `students/profile/${r.studentId}` },
              { label: 'Transfer room', icon: 'refresh-ccw', route: 'hostel/room-transfer' },
              { label: 'Issue gate pass', icon: 'log-out', route: 'hostel/gate-pass' },
            ],
            onRowClick: (r) => navigate(`students/profile/${r.studentId}`),
          }) : EmptyState({ icon: 'bed', title: 'No boarders allocated', text: 'Allocate rooms to start the hostel register.', action: Button('Allocate room', { variant: 'primary', icon: 'user-check', route: 'hostel/allocation' }) })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Fee position of boarders', subtitle: `${money(feeDue, true)} outstanding`, icon: 'wallet', viewAll: 'hostel/fees' },
          boarders.filter((b) => num(b.feeOverdue) > 0).length
            ? RankList(sortBy(boarders.filter((b) => num(b.feeOverdue) > 0), 'feeOverdue', 'desc').slice(0, 7).map((b) => ({
              name: b.name, meta: `${b.className} ${b.section} · room ${b.roomNo || '—'}`, value: money(b.feeOverdue, true),
            })))
            : EmptyState({ icon: 'check-circle', tone: 'success', title: 'All boarders paid up', text: 'No hostel fee is outstanding this quarter.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Hostel diary', subtitle: 'Events and holidays ahead', icon: 'calendar-check', viewAll: 'events/calendar' },
          upcomingList(campusId, 5)),
      },

      {
        span: 4,
        render: () => widget({ title: 'Recent hostel activity', subtitle: 'Allocation and attendance changes', icon: 'history', viewAll: 'system/audit-logs' },
          auditFeed(['hostel'], null, 6)),
      },
    ],
  });
}

/* ================================================== 11 · INFIRMARY === */

function buildNurse(ctx) {
  const campusId = ctx.state.campusId;
  const head = headerFor(ctx, 'Infirmary dashboard');

  const visits = scope(db.infirmaryVisits, campusId);
  const today = dayRows(visits, 'date');
  const records = scope(db.healthRecords, campusId);
  const allergic = records.filter((r) => r.allergies && r.allergies !== 'None');
  const chronic = records.filter((r) => r.chronicConditions && r.chronicConditions !== 'None');
  const observation = records.filter((r) => r.status === 'Under Observation');
  const referred = records.filter((r) => r.status === 'Referred');
  const checkupsDue = records.filter((r) => r.nextCheckup >= TODAY).sort((a, b) => (a.nextCheckup < b.nextCheckup ? -1 : 1));
  const sentHome = visits.filter((v) => v.sentHome);
  const medIncidents = scope(db.incidents, campusId).filter((i) => i.type === 'Medical Emergency' || i.type === 'Student Injury');

  const complaintMix = Array.from(groupBy(visits, 'complaint'), ([key, rows]) => ({ key, value: rows.length }))
    .sort((a, b) => b.value - a.value);

  const byMonth = (() => {
    const m = new Map();
    for (const v of visits) m.set(String(v.date).slice(0, 7), (m.get(String(v.date).slice(0, 7)) || 0) + 1);
    return Array.from(m, ([key, value]) => ({ key, value })).sort((a, b) => (a.key < b.key ? -1 : 1));
  })();

  // Sick and medical absences are endorsed by the infirmary before the class
  // teacher can amend the register — this is the nurse's real approval queue.
  const medicalLeaveQueue = scope(db.studentLeaveRequests, campusId)
    .filter((l) => l.status === 'Pending' && ['Sick Leave', 'Medical'].includes(l.type));

  const vaccineCoverage = (() => {
    const all = ['Polio', 'BCG', 'Typhoid', 'HPV', 'Hepatitis B', 'MMR', 'DPT'];
    return all.map((name) => ({
      key: name,
      value: records.filter((r) => (r.vaccinations || []).includes(name)).length,
      max: records.length,
    })).sort((a, b) => b.value - a.value);
  })();

  return dashboardPage({
    greeting: head.greeting,
    subtitle: head.subtitle,
    route: 'dashboard/nurse',
    actions: quickActions(ctx, [
      { label: 'Log a visit', icon: 'first-aid', route: 'health/infirmary' },
      { label: 'Medication log', icon: 'pill', route: 'health/medication' },
      { label: 'Health profiles', icon: 'heart-pulse', route: 'health/profiles' },
    ]),
    kpis: [
      { label: 'Visits today', value: formatNumber(today.rows.length), deltaLabel: asOf(today), icon: 'first-aid', tone: 'brand', route: 'health/infirmary' },
      { label: 'Visits this session', value: formatNumber(visits.length), delta: 4.7, deltaLabel: 'vs last term', icon: 'stethoscope', tone: 'info', route: 'health/infirmary' },
      { label: 'Under observation', value: formatNumber(observation.length), deltaLabel: 'open cases', icon: 'eye', tone: 'warning', route: 'health/medical-history' },
      { label: 'Referred out', value: formatNumber(referred.length), deltaLabel: 'to a hospital or specialist', icon: 'arrow-up-right', tone: 'danger', route: 'health/medical-history' },
      { label: 'Allergy watchlist', value: formatNumber(allergic.length), deltaLabel: `${round1(pct(allergic.length, records.length))}% of records`, icon: 'alert-triangle', tone: 'warning', route: 'health/allergies' },
      { label: 'Chronic conditions', value: formatNumber(chronic.length), deltaLabel: 'need a care plan', icon: 'heart-pulse', tone: 'danger', route: 'health/profiles' },
      { label: 'Checkups due', value: formatNumber(checkupsDue.length), deltaLabel: 'scheduled ahead', icon: 'clipboard-check', tone: 'info', route: 'health/checkups' },
      { label: 'Sent home', value: formatNumber(sentHome.length), deltaLabel: 'this session', icon: 'home', tone: 'warning', route: 'health/infirmary' },
    ],
    widgets: [
      {
        span: 8,
        render: () => rangedChart({
          title: 'Infirmary footfall',
          subtitle: 'Visits recorded each month',
          icon: 'chart-line', viewAll: 'health/reports',
          ranges: [{ id: 'all', label: 'Session' }, { id: 'q', label: 'Last 3 months' }],
          build: (r) => {
            const src = r === 'q' ? byMonth.slice(-3) : byMonth;
            if (!src.length) return null;
            return lineChart({
              categories: src.map((x) => formatDate(`${x.key}-01`, 'monthYear')),
              series: [{ name: 'Visits', values: src.map((x) => x.value) }],
              showDots: true, height: 290, valueFormat: 'number', title: 'Infirmary visits by month',
            });
          },
        }),
      },

      {
        span: 4,
        render: () => widget({ title: 'Why students come in', subtitle: `${complaintMix.length} presenting complaints`, icon: 'chart-pie', viewAll: 'health/reports', className: 'chart-card' },
          donutChart({
            data: topSlices(complaintMix, 6, 'Other complaints'), centerValue: formatNumber(visits.length), centerLabel: 'Visits',
            height: 290, title: 'Presenting complaints',
          })),
      },

      {
        span: 7,
        render: () => widget({ title: "Today's infirmary log", subtitle: asOf(today), icon: 'first-aid', viewAll: 'health/infirmary' },
          today.rows.length ? DataTable({
            rows: sortBy(today.rows, 'time', 'desc'),
            pageSize: 7, searchable: true, searchKeys: ['studentName', 'complaint', 'diagnosis'], searchPlaceholder: 'Search visits…',
            exportName: 'infirmary-today', maxHeight: 'none',
            columns: [
              { key: 'time', label: 'Time', width: 80, render: (r) => h('span', { className: 't-num' }, r.time) },
              { key: 'studentName', label: 'Student', sticky: true, width: 200, render: (r) => Identity(r.studentName, `${r.className} ${r.section}`), value: (r) => r.studentName },
              { key: 'complaint', label: 'Complaint', width: 160, filter: true },
              { key: 'diagnosis', label: 'Diagnosis', width: 160 },
              { key: 'treatment', label: 'Treatment', width: 180, hidden: true },
              { key: 'durationMin', label: 'Rest', numeric: true, align: 'right', width: 90, render: (r) => `${r.durationMin} min` },
              {
                key: 'sentHome', label: 'Outcome', width: 140,
                render: (r) => (r.sentHome ? Badge('Sent home', { tone: 'warning' }) : r.followUp ? Badge('Follow-up', { tone: 'warning' }) : Badge('Back to class', { tone: 'success' })),
                value: (r) => (r.sentHome ? 'Sent home' : 'Back to class'),
              },
              { key: 'parentInformed', label: 'Parent', width: 110, render: (r) => (r.parentInformed ? Badge('Informed', { tone: 'success' }) : Badge('Not informed', { tone: 'warning' })), value: (r) => String(r.parentInformed) },
            ],
            rowActions: (r) => [
              { label: 'Open health profile', icon: 'heart-pulse', route: `students/profile/${r.studentId}` },
              { label: 'Call parent', icon: 'phone-call', onClick: mockAction('Call parent') },
              { label: 'Add follow-up note', icon: 'notebook', onClick: mockAction('Add follow-up') },
            ],
            onRowClick: (r) => navigate(`students/profile/${r.studentId}`),
          }) : EmptyState({ icon: 'first-aid', tone: 'success', title: 'No visits logged today', text: 'A quiet infirmary is a good sign. Walk-ins are logged as they arrive.', action: Button('Log a visit', { variant: 'primary', icon: 'plus', route: 'health/infirmary' }) })),
      },

      {
        span: 5,
        render: () => widget({ title: 'Allergy watchlist', subtitle: `${allergic.length} students with a recorded allergy`, icon: 'alert-triangle', viewAll: 'health/allergies' },
          allergic.length ? h('div', { className: 'dash-rows' }, sortBy(allergic, 'studentName').slice(0, 7).map((r) => h('div', { className: 'dash-row' },
            Avatar(r.studentName, { size: 'sm' }),
            h('div', { className: 'dash-row-main' },
              h('div', { className: 'dash-row-title' }, r.studentName),
              h('div', { className: 'dash-row-meta' }, `${r.className} ${r.section} · ${r.bloodGroup} · emergency ${r.emergencyContact}`)),
            h('div', { className: 'dash-row-acts' }, Badge(r.allergies, { tone: 'danger', icon: 'alert-triangle' })))))
            : EmptyState({ icon: 'check-circle', tone: 'success', title: 'No recorded allergies', text: 'No student on this campus has a flagged allergy.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Medication and follow-ups due', subtitle: `${visits.filter((v) => v.followUp).length} follow-ups scheduled`, icon: 'pill', viewAll: 'health/medication' },
          visits.filter((v) => v.followUp).length
            ? Timeline(sortBy(visits.filter((v) => v.followUp), 'date', 'desc').slice(0, 6).map((v) => ({
              title: `${v.studentName} · ${v.diagnosis}`,
              meta: `${formatDate(v.date, 'medium')} ${v.time} · ${v.attendedByName}`,
              text: `${v.treatment}${v.medicineGiven ? ' · medicine administered' : ''}`,
              icon: 'pill', tone: v.sentHome ? 'danger' : 'warning',
            })))
            : EmptyState({ icon: 'pill', tone: 'success', title: 'No medication rounds due', text: 'No student is on a scheduled dose today.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Vaccination coverage', subtitle: `${formatNumber(records.length)} health records on file`, icon: 'syringe', viewAll: 'health/vaccination', className: 'chart-card' },
          barChart({
            categories: vaccineCoverage.map((v) => v.key),
            series: [{ name: 'Covered', values: vaccineCoverage.map((v) => round1(pct(v.value, v.max))) }],
            horizontal: true, showValues: true, target: 95, height: 290, valueFormat: 'percent',
            title: 'Vaccination coverage',
          })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Growth and BMI screening', subtitle: 'Height against weight, latest checkup', icon: 'activity', viewAll: 'health/checkups', className: 'chart-card' },
          scatterPlot({
            points: records.slice(0, 200).map((r) => ({
              x: num(r.heightCm), y: num(r.weightKg), label: `${r.studentName} · BMI ${r.bmi}`,
              group: num(r.bmi) >= 25 ? 'Above range' : num(r.bmi) <= 15 ? 'Below range' : 'In range', size: 5,
            })),
            xLabel: 'Height (cm)', yLabel: 'Weight (kg)', height: 290, title: 'Height vs weight screening',
          })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Clinical alerts', subtitle: 'Cases that need a decision or a call home', icon: 'siren', viewAll: 'health/incidents' },
          alertsPanel([
            referred.length && {
              severity: 'critical', icon: 'arrow-up-right', title: `${referred.length} students referred to specialists`,
              text: 'Referrals need a follow-up call and a written note in the medical history.',
              badge: Badge('Referral', { tone: 'danger' }), route: 'health/medical-history',
            },
            chronic.length && {
              severity: 'high', icon: 'heart-pulse', title: `${chronic.length} students with chronic conditions`,
              text: 'Each needs a care plan on file and medication stored in the infirmary.',
              badge: Badge('Care plan', { tone: 'danger' }), route: 'health/profiles',
            },
            observation.length && {
              severity: 'medium', icon: 'eye', title: `${observation.length} students under observation`,
              text: 'Re-check vitals before the last period and update the status.',
              badge: Badge('Observation', { tone: 'warning' }), route: 'health/medical-history',
            },
            medIncidents.length && {
              severity: 'high', icon: 'alert-triangle', title: `${medIncidents.length} medical incidents logged on campus`,
              text: 'Injury and emergency reports require a signed incident form within 24 hours.',
              badge: Badge('Incident', { tone: 'danger' }), route: 'health/incidents',
            },
            {
              severity: 'low', icon: 'clipboard-check', title: `${checkupsDue.length} routine checkups scheduled`,
              text: `Next on ${checkupsDue.length ? formatDate(checkupsDue[0].nextCheckup, 'medium') : '—'}.`,
              badge: Badge('Routine', { tone: 'info' }), route: 'health/checkups',
            },
          ].filter(Boolean))),
      },

      {
        span: 6,
        render: () => widget({ title: 'Upcoming checkups', subtitle: `${checkupsDue.length} students due`, icon: 'calendar-check', viewAll: 'health/checkups' },
          checkupsDue.length ? DataTable({
            rows: checkupsDue.slice(0, 40),
            pageSize: 6, searchable: true, searchKeys: ['studentName', 'className'], searchPlaceholder: 'Search students…',
            exportName: 'checkups-due', maxHeight: 'none',
            columns: [
              { key: 'studentName', label: 'Student', sticky: true, width: 200, render: (r) => Identity(r.studentName, `${r.className} ${r.section}`), value: (r) => r.studentName },
              { key: 'nextCheckup', label: 'Due on', width: 130, render: (r) => formatDate(r.nextCheckup, 'medium') },
              { key: 'lastCheckup', label: 'Last seen', width: 130, render: (r) => relativeTime(r.lastCheckup) },
              { key: 'bmi', label: 'BMI', numeric: true, align: 'right', width: 80 },
              { key: 'vision', label: 'Vision', width: 100 },
              { key: 'status', label: 'Status', width: 150, render: (r) => Badge(r.status, { tone: r.status === 'Fit' ? 'success' : r.status === 'Referred' ? 'danger' : 'warning' }) },
            ],
            onRowClick: (r) => navigate(`students/profile/${r.studentId}`),
          }) : EmptyState({ icon: 'calendar-check', title: 'No checkups scheduled', text: 'Schedule the annual screening cycle to populate this list.' })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Health diary', subtitle: 'Screening camps and school events', icon: 'calendar', viewAll: 'events/calendar' },
          upcomingList(campusId, 5)),
      },

      {
        span: 6,
        render: () => widget({ title: 'Infirmary activity log', subtitle: 'Recent record changes', icon: 'history', viewAll: 'system/audit-logs' },
          auditFeed(['health'], campusId, 6)),
      },

      {
        span: 12,
        render: () => widget({ title: 'Medical leave awaiting my endorsement', subtitle: `${medicalLeaveQueue.length} applications · a nurse signs these before the register is amended`, icon: 'stamp', viewAll: 'attendance/leave-requests' },
          approvalsPanel({
            rows: sortBy(medicalLeaveQueue, 'fromDate', 'asc'),
            max: 7,
            avatar: (r) => r.studentName,
            title: (r) => `${r.studentName} · ${r.type}`,
            meta: (r) => `${r.className} ${r.section} · ${formatDate(r.fromDate, 'medium')}–${formatDate(r.toDate, 'medium')} (${r.days}d) · ${r.reason}`,
            side: (r) => Badge(r.attachment ? 'Certificate attached' : 'No certificate', { tone: r.attachment ? 'success' : 'warning' }),
            emptyTitle: 'Nothing to endorse',
            emptyText: 'Every medical absence has already been signed off.',
            onApprove: (r) => notify({ title: 'Medical leave endorsed', text: `${r.studentName} · ${r.days} day${r.days > 1 ? 's' : ''}`, tone: 'success' }),
          })),
      },
    ],
  });
}

/* =============================================== 12 · FRONT OFFICE === */

function buildFrontOffice(ctx) {
  const campusId = ctx.state.campusId;
  const head = headerFor(ctx, 'Reception dashboard');

  const visitors = scope(db.visitors, campusId);
  const vToday = dayRows(visitors, 'date');
  const inside = visitors.filter((v) => v.status === 'Inside');
  const calls = scope(db.callLogs, campusId);
  const cToday = dayRows(calls, 'date');
  const couriers = scope(db.couriers, campusId);
  const inTransit = couriers.filter((c) => c.status === 'In Transit');
  const gpPending = scope(db.gatePasses, campusId).filter((g) => g.status === 'Pending');
  const enquiries = scope(db.enquiries, campusId);
  const newEnquiries = enquiries.filter((e) => ['New Enquiry', 'Contacted', 'Counselling'].includes(e.stage));
  const lost = scope(db.lostFound, campusId).filter((l) => l.status === 'Unclaimed');
  const complaints = scope(db.complaints, campusId).filter((c) => c.status === 'Open');
  const appointments = scope(db.ptmBookings, campusId).filter((p) => p.status === 'Confirmed' && p.date >= TODAY);
  const followUps = calls.filter((c) => c.followUpRequired);

  const purposeMix = Array.from(groupBy(visitors, 'purpose'), ([key, rows]) => ({ key, value: rows.length }))
    .sort((a, b) => b.value - a.value);

  const footfall = (() => {
    const buckets = ['08', '09', '10', '11', '12', '13', '14', '15', '16'];
    return buckets.map((hour) => ({
      hour: `${hour}:00`,
      value: visitors.filter((v) => String(v.inTime || '').slice(0, 2) === hour).length,
    }));
  })();

  return dashboardPage({
    greeting: head.greeting,
    subtitle: head.subtitle,
    route: 'dashboard/front-office',
    actions: quickActions(ctx, [
      { label: 'Register visitor', icon: 'user-plus', route: 'security/check-in' },
      { label: 'Log a call', icon: 'phone-call', route: 'frontoffice/call-log' },
      { label: 'New enquiry', icon: 'message-square', route: 'frontoffice/enquiries' },
    ]),
    kpis: [
      { label: 'Visitors today', value: formatNumber(vToday.rows.length), deltaLabel: asOf(vToday), icon: 'users', tone: 'brand', route: 'security/visitors' },
      { label: 'Currently inside', value: formatNumber(inside.length), deltaLabel: 'badges not returned', icon: 'log-in', tone: inside.length > 15 ? 'warning' : 'success', route: 'security/check-out' },
      { label: 'Gate passes pending', value: formatNumber(gpPending.length), deltaLabel: 'awaiting authorisation', icon: 'log-out', tone: gpPending.length ? 'warning' : 'success', route: 'security/gate-pass-student' },
      { label: 'Calls today', value: formatNumber(cToday.rows.length), deltaLabel: `${followUps.length} need follow-up`, icon: 'phone-call', tone: 'info', route: 'frontoffice/call-log' },
      { label: 'Live enquiries', value: formatNumber(newEnquiries.length), delta: deltaOf(analytics.sparks.admissions), deltaLabel: 'vs last month', icon: 'message-square', tone: 'brand', trend: analytics.sparks.admissions, route: 'frontoffice/enquiries' },
      { label: 'Couriers in transit', value: formatNumber(inTransit.length), deltaLabel: `${couriers.length} logged this session`, icon: 'package', tone: 'info', route: 'frontoffice/courier-in' },
      { label: 'Appointments ahead', value: formatNumber(appointments.length), deltaLabel: 'confirmed parent meetings', icon: 'calendar-check', tone: 'success', route: 'frontoffice/appointments' },
      { label: 'Unclaimed items', value: formatNumber(lost.length), deltaLabel: 'in lost & found', icon: 'search', tone: 'warning', route: 'frontoffice/lost-found' },
    ],
    widgets: [
      {
        span: 7,
        render: () => widget({ title: "Today's visitor register", subtitle: asOf(vToday), icon: 'users', viewAll: 'security/visitors' },
          vToday.rows.length ? DataTable({
            rows: sortBy(vToday.rows, 'inTime', 'desc'),
            pageSize: 7, searchable: true, searchKeys: ['name', 'phone', 'whomToMeet', 'passNo'], searchPlaceholder: 'Search visitors…',
            exportName: 'visitors-today', maxHeight: 'none',
            columns: [
              { key: 'name', label: 'Visitor', sticky: true, width: 200, render: (r) => Identity(r.name, `${r.phone} · ${r.idProof} ${r.idNumberMasked}`), value: (r) => r.name },
              { key: 'purpose', label: 'Purpose', width: 170, filter: true },
              { key: 'whomToMeet', label: 'Meeting', width: 150 },
              { key: 'inTime', label: 'In', width: 80, render: (r) => h('span', { className: 't-num' }, r.inTime) },
              { key: 'outTime', label: 'Out', width: 80, render: (r) => h('span', { className: 't-num' }, r.outTime || '—') },
              { key: 'badgeNo', label: 'Badge', width: 90, hidden: true },
              { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status, { tone: r.status === 'Inside' ? 'warning' : 'success', dot: true }) },
            ],
            rowActions: (r) => [
              r.status === 'Inside' ? { label: 'Check out', icon: 'log-out', route: 'security/check-out' } : null,
              { label: 'Print badge', icon: 'print', onClick: mockAction('Print badge') },
              { label: 'Call visitor', icon: 'phone', onClick: mockAction('Call visitor') },
            ].filter(Boolean),
            onRowClick: () => navigate('security/visitors'),
          }) : EmptyState({ icon: 'users', title: 'No visitors logged today', text: 'Register the first walk-in and it appears here instantly.', action: Button('Register visitor', { variant: 'primary', icon: 'user-plus', route: 'security/check-in' }) })),
      },

      {
        span: 5,
        render: () => widget({ title: 'Gate passes to authorise', subtitle: `${gpPending.length} waiting`, icon: 'log-out', viewAll: 'security/gate-pass-student' },
          approvalsPanel({
            rows: sortBy(gpPending, 'date', 'desc'),
            avatar: (r) => r.personName,
            title: (r) => `${r.personName} — ${r.reason}`,
            meta: (r) => `${r.type}${r.className ? ` · ${r.className} ${r.section}` : ''} · out ${r.outTime}, ${r.expectedReturn ? `expected back ${r.expectedReturn}` : 'not returning today'} · picked up by ${r.pickedUpBy || 'self'}`,
            side: (r) => Badge(r.securityVerified ? 'ID checked' : 'ID pending', { tone: r.securityVerified ? 'success' : 'warning' }),
            onApprove: (r) => notify({ title: 'Gate pass authorised', text: `${r.passNo} · ${r.personName}`, tone: 'success' }),
          })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Why people visit', subtitle: `${formatNumber(visitors.length)} visits this session`, icon: 'chart-pie', viewAll: 'security/visitors', className: 'chart-card' },
          donutChart({
            data: topSlices(purposeMix, 6, 'Other purposes'), centerValue: formatNumber(visitors.length), centerLabel: 'Visits',
            height: 280, title: 'Visitor purpose mix',
          })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Footfall by hour', subtitle: 'When the desk is busiest', icon: 'chart-bar', viewAll: 'security/visitors', className: 'chart-card' },
          barChart({
            categories: footfall.map((f) => f.hour),
            series: [{ name: 'Visitors', values: footfall.map((f) => f.value) }],
            showValues: true, height: 280, valueFormat: 'number', title: 'Visitor footfall by hour',
          })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Call log', subtitle: asOf(cToday), icon: 'phone-call', viewAll: 'frontoffice/call-log' },
          cToday.rows.length ? ActivityFeed(sortBy(cToday.rows, 'time', 'desc').slice(0, 7).map((c) => ({
            name: c.callerName,
            text: `${c.direction === 'Incoming' ? 'called in about' : 'was called about'} ${c.purpose.toLowerCase()} — ${c.notes || 'no notes'}`,
            time: `${c.time} · ${c.durationMin} min${c.followUpRequired ? ' · follow-up needed' : ''}`,
            tone: c.followUpRequired ? 'warning' : 'info',
          })))
            : EmptyState({ icon: 'phone', title: 'No calls logged', text: 'Log incoming and outgoing calls to keep the follow-up list accurate.' })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Live admission enquiries', subtitle: `${newEnquiries.length} in the early stages`, icon: 'message-square', viewAll: 'frontoffice/enquiries' },
          newEnquiries.length ? DataTable({
            rows: sortBy(newEnquiries, 'createdAt', 'desc').slice(0, 60),
            pageSize: 6, searchable: true, searchKeys: ['studentName', 'parentName', 'phone', 'enquiryNo'], searchPlaceholder: 'Search enquiries…',
            exportName: 'enquiries', maxHeight: 'none',
            columns: [
              { key: 'studentName', label: 'Prospect', sticky: true, width: 200, render: (r) => Identity(r.studentName, `${r.className} · ${r.city}`), value: (r) => r.studentName },
              { key: 'parentName', label: 'Parent', width: 170, render: (r) => h('div', null, h('div', { className: 't-sm' }, r.parentName), h('div', { className: 't-xs t-muted t-mono' }, r.phone)), value: (r) => r.parentName },
              { key: 'source', label: 'Source', width: 130, filter: true },
              { key: 'stage', label: 'Stage', width: 150, filter: true, render: (r) => Badge(r.stage) },
              { key: 'nextFollowUp', label: 'Next follow-up', width: 150, render: (r) => (r.nextFollowUp ? h('span', { className: r.nextFollowUp < TODAY ? 't-danger' : '' }, formatDate(r.nextFollowUp, 'medium')) : '—') },
              { key: 'priority', label: 'Priority', width: 110, render: (r) => Badge(r.priority, { tone: r.priority === 'High' ? 'danger' : r.priority === 'Medium' ? 'warning' : 'neutral' }) },
            ],
            rowActions: () => [
              { label: 'Log follow-up', icon: 'phone-call', route: 'admissions/follow-ups' },
              { label: 'Open pipeline', icon: 'workflow', route: 'admissions/leads' },
              { label: 'Send brochure', icon: 'send', onClick: mockAction('Send brochure') },
            ],
            onRowClick: () => navigate('admissions/enquiries'),
          }) : EmptyState({ icon: 'message-square', title: 'No live enquiries', text: 'Every enquiry has moved past counselling.', action: Button('New enquiry', { variant: 'primary', icon: 'plus', route: 'frontoffice/enquiries' }) })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Courier and post', subtitle: `${couriers.filter((c) => c.direction === 'Inward').length} inward · ${couriers.filter((c) => c.direction === 'Outward').length} outward`, icon: 'package', viewAll: 'frontoffice/courier-in' },
          couriers.length ? DataTable({
            rows: sortBy(couriers, 'date', 'desc').slice(0, 40),
            pageSize: 6, searchable: true, searchKeys: ['refNo', 'awbNo', 'sender', 'recipient'], searchPlaceholder: 'Search couriers…',
            exportName: 'couriers', maxHeight: 'none',
            columns: [
              { key: 'refNo', label: 'Ref', sticky: true, width: 130, render: (r) => h('span', { className: 't-mono t-xs' }, r.refNo) },
              { key: 'direction', label: 'Direction', width: 110, filter: true, render: (r) => Badge(r.direction, { tone: r.direction === 'Inward' ? 'info' : 'brand' }) },
              { key: 'courierCompany', label: 'Carrier', width: 130 },
              { key: 'sender', label: 'From', width: 130 },
              { key: 'recipient', label: 'To', width: 130 },
              { key: 'contents', label: 'Contents', width: 170 },
              { key: 'date', label: 'Date', width: 120, render: (r) => formatDate(r.date, 'medium') },
              { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
            ],
            onRowClick: (r) => navigate(r.direction === 'Inward' ? 'frontoffice/courier-in' : 'frontoffice/courier-out'),
          }) : EmptyState({ icon: 'package', title: 'Nothing in the post tray', text: 'Log inward and outward couriers to keep the register auditable.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Appointments ahead', subtitle: `${appointments.length} confirmed parent meetings`, icon: 'calendar-check', viewAll: 'frontoffice/appointments' },
          appointments.length ? h('div', { className: 'dash-rows' }, sortBy(appointments, 'date').slice(0, 6).map((a) => h('div', { className: 'dash-row' },
            Avatar(a.parentName, { size: 'sm' }),
            h('div', { className: 'dash-row-main' },
              h('div', { className: 'dash-row-title' }, `${a.parentName} → ${a.teacherName}`),
              h('div', { className: 'dash-row-meta' }, `${formatDate(a.date, 'medium')} at ${a.time} · for ${a.studentName} (${a.className} ${a.section})`)),
            IconButton('phone', { size: 'sm', label: `Call ${a.parentPhone}`, onClick: mockAction('Call parent') }))))
            : EmptyState({ icon: 'calendar-check', title: 'Diary is clear', text: 'No confirmed appointments in the days ahead.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Lost and found', subtitle: `${lost.length} unclaimed items`, icon: 'search', viewAll: 'frontoffice/lost-found' },
          lost.length ? h('div', { className: 'dash-rows' }, lost.slice(0, 6).map((l) => h('div', { className: 'dash-row' },
            h('span', { className: 'dash-alert-ico', dataset: { sev: 'info' }, html: icon('box', 15) }),
            h('div', { className: 'dash-row-main' },
              h('div', { className: 'dash-row-title' }, l.item),
              h('div', { className: 'dash-row-meta' }, `${l.location} · found ${formatDate(l.date, 'medium')} · logged by ${l.reportedBy}`)),
            Button('Claim', { size: 'sm', variant: 'secondary', icon: 'check', onClick: mockAction('Record claim') }))))
            : EmptyState({ icon: 'check-circle', tone: 'success', title: 'Nothing unclaimed', text: 'Every item logged has gone back to its owner.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Desk exceptions', subtitle: 'What reception must clear today', icon: 'alert-circle', viewAll: 'frontoffice/complaints' },
          alertsPanel([
            inside.length && {
              severity: inside.length > 15 ? 'high' : 'medium', icon: 'log-in',
              title: `${inside.length} visitor badges not returned`,
              text: 'Badges must be reconciled before the gate closes at 18:00.',
              badge: Badge('Security', { tone: 'warning' }), route: 'security/check-out',
            },
            followUps.length && {
              severity: 'medium', icon: 'phone-call', title: `${followUps.length} calls need a follow-up`,
              text: 'Unreturned calls are the single biggest source of parent complaints.',
              badge: Badge('Calls', { tone: 'warning' }), route: 'frontoffice/call-log',
            },
            complaints.length && {
              severity: 'high', icon: 'alert-circle', title: `${complaints.length} complaints logged at the desk`,
              text: `${complaints.filter((c) => c.slaBreached).length} are already past SLA and auto-escalate.`,
              badge: Badge('Complaints', { tone: 'danger' }), route: 'frontoffice/complaints',
            },
            inTransit.length && {
              severity: 'low', icon: 'package', title: `${inTransit.length} couriers in transit`,
              text: 'Track AWB numbers and close the register when they are delivered.',
              badge: Badge('Post', { tone: 'info' }), route: 'frontoffice/courier-out',
            },
          ].filter(Boolean))),
      },

      {
        span: 6,
        render: () => widget({ title: 'Campus diary', subtitle: 'What reception should be ready for', icon: 'calendar', viewAll: 'events/calendar' },
          upcomingList(campusId, 6)),
      },

      {
        span: 6,
        render: () => widget({ title: 'Front office activity', subtitle: 'Recent desk transactions', icon: 'history', viewAll: 'system/audit-logs' },
          auditFeed(['frontoffice', 'security', 'admissions'], campusId, 8)),
      },
    ],
  });
}

/* ==================================================== 13 · STUDENT === */

function pickStudent(campusId) {
  return memo(`student:${campusId || 'ALL'}`, () => {
    const pool = scope(db.students, campusId).filter((s) => s.status === 'Active');
    const decorated = new Set(db.awards.map((a) => a.studentId));
    const onLoan = new Set(db.bookIssues.filter((b) => b.status !== 'Returned').map((b) => b.studentId));
    const openHwSections = new Set(db.homework.filter((hw) => hw.status === 'Open').map((hw) => hw.sectionId));
    const score = (s) => (s.classLevel >= 10 ? 5 : 0)
      + (decorated.has(s.id) ? 4 : 0)
      + (onLoan.has(s.id) ? 4 : 0)
      + (num(s.feeDue) > 0 ? 3 : 0)
      + (openHwSections.has(s.sectionId) ? 3 : 0)
      + (s.transportOpted ? 1 : 0);
    let best = pool[0] || db.students[0];
    let bestScore = -1;
    for (const s of pool) { const v = score(s); if (v > bestScore) { bestScore = v; best = s; } }
    return best;
  });
}

/** A live bus card: which route, which stop, how far along the run. */
function busCard(student) {
  const routes = scope(db.routes, student.campusId);
  if (!student.transportOpted || !routes.length) {
    return EmptyState({
      icon: 'bus', title: 'Not on school transport',
      text: 'This student is dropped privately. Opt in from the transport module to see live tracking here.',
      action: Button('Transport options', { variant: 'secondary', icon: 'bus', route: 'transport/allocation' }),
    });
  }
  const idx = Math.abs(student.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % routes.length;
  const route = routes[idx];
  const stops = sortBy(db.stops.filter((s) => s.routeId === route.id), 'seq');
  const vehicle = db.vehicles.find((v) => v.routeId === route.id);
  const myStop = stops[Math.min(stops.length - 1, idx % Math.max(1, stops.length))];
  const start = mins(route.pickupStart);
  const end = start + num(route.durationMin);
  const progress = Math.max(0, Math.min(1, (NOW_MIN - start) / ((end - start) || 1)));
  const reached = Math.round(progress * (stops.length - 1));

  return h('div', { className: 'stack-3' },
    h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-3)' } },
      h('span', { className: 'dash-alert-ico', dataset: { sev: vehicle && vehicle.status === 'On Route' ? 'low' : 'info' }, html: icon('bus', 16) }),
      h('div', { className: 'flex-1 min-0' },
        h('div', { className: 't-semibold' }, `${route.code} · ${route.name}`),
        h('div', { className: 't-xs t-muted' }, `${vehicle ? vehicle.regNo : 'Vehicle unassigned'} · ${route.stopCount} stops · ${route.distanceKm} km`)),
      Badge(vehicle ? vehicle.status : 'Scheduled', { tone: vehicle && vehicle.status === 'On Route' ? 'success' : 'info', dot: true })),
    h('div', { className: 'dash-bus-track' },
      h('span', { className: 'dash-bus-fill', style: { width: `${progress * 100}%` } }),
      stops.map((s, i) => h('span', {
        className: 'dash-bus-stop', style: { left: `${(i / Math.max(1, stops.length - 1)) * 100}%` },
        attrs: { title: `${s.name} · pickup ${s.pickupTime}` },
      })),
      h('span', { className: 'dash-bus-pin', style: { left: `${progress * 100}%` }, attrs: { title: `Bus is near ${stops[reached] ? stops[reached].name : route.name}` }})),
    DescriptionList([
      ['My stop', myStop ? `${myStop.name} (${myStop.landmark})` : '—'],
      ['Pickup', myStop ? myStop.pickupTime : route.pickupStart],
      ['Drop', myStop ? myStop.dropTime : route.dropStart],
      ['Currently near', stops[reached] ? stops[reached].name : '—'],
      ['Driver', (byId(db.drivers, vehicle && vehicle.driverId) || {}).name || 'Unassigned'],
      ['Speed', vehicle ? `${vehicle.speed} km/h · last ping ${relativeTime(vehicle.lastPing)}` : '—'],
    ], { cols: 2 }),
    h('div', { className: 'row' },
      Button('Open live map', { variant: 'secondary', size: 'sm', icon: 'navigation', route: 'portals/parent/bus-tracking' }),
      Button('Call conductor', { variant: 'ghost', size: 'sm', icon: 'phone', onClick: mockAction('Call conductor') })));
}

function buildStudent(ctx) {
  const campusId = ctx.state.campusId;
  const s = pickStudent(campusId);
  if (!s) return missingRecord('student record', 'students/all');
  const full = student360(s.id);

  const slots = sortBy(db.timetableSlots.filter((t) => t.sectionId === s.sectionId && t.day === TODAY_DOW), 'periodNo');
  const homework = db.homework.filter((hw) => hw.sectionId === s.sectionId);
  const mySubs = db.submissions.filter((x) => x.studentId === s.id);
  const submittedIds = new Set(mySubs.map((x) => x.homeworkId));
  const dueHomework = homework.filter((hw) => hw.status === 'Open' && !submittedIds.has(hw.id));
  const exams = sortBy(db.exams.filter((e) => e.classId === s.classId && e.date >= TODAY), 'date');
  const books = full.bookIssues.filter((b) => b.status !== 'Returned');
  const invoicesDue = full.invoices.filter((i) => num(i.balance) > 0);
  const classmates = db.students.filter((x) => x.sectionId === s.sectionId);
  const myRank = sortBy(classmates, 'lastExamPercent', 'desc').findIndex((x) => x.id === s.id) + 1;
  const doubts = db.doubts.filter((d) => d.studentId === s.id);
  const liveClasses = sortBy(db.onlineClasses.filter((c) => c.className === s.className && c.date >= TODAY), 'date');

  const head = headerFor(ctx, `${s.className} ${s.section}`, `${s.house} House · roll ${s.rollNo}`);

  return dashboardPage({
    greeting: greetingFor(s.firstName),
    subtitle: `${head.subtitle} · admission ${s.admissionNo}`,
    route: 'dashboard/student',
    actions: quickActions(ctx, [
      { label: 'My homework', icon: 'clipboard-list', route: 'portals/student/homework' },
      { label: 'My timetable', icon: 'calendar', route: 'portals/student/timetable' },
      { label: 'My results', icon: 'chart-bar', route: 'portals/student/results' },
    ]),
    kpis: [
      { label: 'Attendance', value: `${s.attendancePct}%`, delta: 1.4, deltaLabel: 'vs last month', icon: 'clipboard-check', tone: num(s.attendancePct) >= 85 ? 'success' : num(s.attendancePct) >= 75 ? 'warning' : 'danger', route: 'portals/student/attendance' },
      { label: 'CGPA', value: String(s.cgpa), delta: 2.6, deltaLabel: 'vs last cycle', icon: 'graduation-cap', tone: 'brand', route: 'portals/student/results' },
      { label: 'Class rank', value: `#${myRank || s.rank}`, deltaLabel: `of ${classmates.length} in ${s.className} ${s.section}`, icon: 'trophy', tone: 'info', route: 'examination/merit-list' },
      { label: 'Last exam', value: `${s.lastExamPercent}%`, deltaLabel: `grade ${gradeFor(s.lastExamPercent)}`, icon: 'file-text', tone: 'success', route: 'portals/student/results' },
      { label: 'Homework due', value: String(dueHomework.length), deltaLabel: `${homework.length} set this term`, icon: 'clipboard-list', tone: dueHomework.length ? 'warning' : 'success', route: 'portals/student/homework' },
      { label: 'Fee overdue', value: money(s.feeOverdue), deltaLabel: num(s.feeOverdue) ? `${money(s.feeDue)} balance on the year` : `${money(s.feeDue)} due later this year`, icon: 'wallet', tone: num(s.feeOverdue) ? 'danger' : 'success', route: 'portals/student/fees' },
      { label: 'Books issued', value: String(books.length), deltaLabel: `${books.filter((b) => b.status === 'Overdue').length} overdue`, icon: 'library', tone: books.some((b) => b.status === 'Overdue') ? 'danger' : 'info', route: 'portals/student/library' },
      { label: 'Awards', value: String(s.awardsCount), deltaLabel: `behaviour score ${s.behaviourScore}`, icon: 'award', tone: 'brand', route: 'activities/achievements' },
    ],
    widgets: [
      {
        span: 12,
        render: () => {
          const notes = [];
          if (num(s.attendancePct) < 75) notes.push(`Your attendance is ${s.attendancePct}% — below the 75% required to sit the board exam.`);
          else if (num(s.attendancePct) < 85) notes.push(`Attendance is ${s.attendancePct}%. Keep it above 85% to stay clear of the warning list.`);
          if (dueHomework.length) notes.push(`${dueHomework.length} assignment${dueHomework.length > 1 ? 's are' : ' is'} still to be submitted.`);
          if (num(s.feeOverdue) > 0) notes.push(`${money(s.feeOverdue)} of fees is past its due date — ask a parent to clear it from the portal.`);
          if (books.some((b) => b.status === 'Overdue')) notes.push('A library book is overdue and a fine is accruing daily.');
          if (!notes.length) {
            return Callout({ tone: 'success', icon: 'check-circle', title: `Nicely done, ${s.firstName}` },
              h('div', null, `Attendance ${s.attendancePct}%, CGPA ${s.cgpa}, no pending homework and nothing outstanding on fees or library. Keep it up.`));
          }
          return Callout({ tone: num(s.attendancePct) < 75 ? 'danger' : 'warning', title: 'Things that need your attention' },
            h('ul', { style: { margin: 'var(--sp-2) 0 0', paddingLeft: 'var(--sp-4)' } }, notes.map((n) => h('li', null, n))));
        },
      },

      {
        span: 7,
        render: () => widget({
          title: `Today — ${formatDate(TODAY, 'weekday')}`,
          subtitle: `${slots.length} periods · ${s.className} ${s.section} · room ${slots[0] ? slots[0].room : '—'}`,
          icon: 'calendar', viewAll: 'portals/student/timetable', viewAllLabel: 'Full week',
        }, periodRail(slots, {
          emptyTitle: 'No classes today',
          emptyText: 'Thursday is off for your section. Check the weekly timetable for the rest of the week.',
        })),
      },

      {
        span: 5,
        render: () => widget({ title: 'My attendance', subtitle: `${s.presentDays} of ${s.totalDays} school days`, icon: 'clipboard-check', viewAll: 'portals/student/attendance' },
          h('div', { className: 'row', style: { justifyContent: 'center' } },
            progressRing(num(s.attendancePct), {
              size: 140, label: 'Attendance', sublabel: num(s.attendancePct) >= 75 ? 'Above the 75% requirement' : 'Below the 75% requirement',
            })),
          h('div', { className: 'mt-3' }, tileGrid([
            { label: 'Present', value: formatNumber(s.presentDays), tone: 'success', route: 'portals/student/attendance' },
            { label: 'Absent', value: formatNumber(num(s.totalDays) - num(s.presentDays)), tone: 'danger', route: 'portals/student/attendance' },
            { label: 'Behaviour', value: String(s.behaviourScore), tone: num(s.behaviourScore) >= 80 ? 'success' : 'warning', sub: `${s.disciplinaryCount} notes`, route: 'students/behaviour' },
            { label: 'House', value: s.house, tone: 'brand', sub: 'inter-house points', route: 'activities/houses' },
          ]))),
      },

      {
        span: 6,
        render: () => widget({ title: 'Subject performance', subtitle: 'Latest assessment, all subjects', icon: 'chart-bar', viewAll: 'portals/student/results', className: 'chart-card' },
          full.subjectScores.length ? barChart({
            categories: full.subjectScores.map((x) => x.subjectName),
            series: [{ name: 'Marks scored', values: full.subjectScores.map((x) => round1(pct(x.marks, x.maxMarks))) }],
            horizontal: true, showValues: true, target: 70, height: 320, valueFormat: 'percent',
            title: 'Subject performance',
          }) : EmptyState({ icon: 'file-text', title: 'No results published', text: 'Your marks appear here once the exam cycle is processed.' })),
      },

      {
        span: 6,
        render: () => rangedChart({
          title: 'My progress over the years',
          subtitle: 'Percentage and attendance, year by year',
          icon: 'trending-up', viewAll: 'portals/student/results',
          ranges: [{ id: 'both', label: 'Score + attendance' }, { id: 'score', label: 'Score only' }],
          build: (r) => {
            const src = full.academicHistory;
            if (!src.length) return null;
            const series = [{ name: 'Percentage', values: src.map((x) => x.percent) }];
            if (r === 'both') series.push({ name: 'Attendance', values: src.map((x) => x.attendance) });
            return lineChart({
              categories: src.map((x) => `${x.year}\n${x.className}`.split('\n')[0]),
              series, showDots: true, showEndLabels: true, valueFormat: 'percent',
              height: 320, minY: 40, maxY: 100, title: 'Progress over the years',
            });
          },
        }),
      },

      {
        span: 4,
        render: () => widget({ title: 'Homework due', subtitle: `${dueHomework.length} not yet submitted`, icon: 'clipboard-list', viewAll: 'portals/student/homework' },
          dueHomework.length ? h('div', { className: 'dash-rows' }, sortBy(dueHomework, 'dueDate').slice(0, 6).map((hw) => {
            const late = hw.dueDate < TODAY;
            return h('div', { className: 'dash-row' },
              h('span', { className: 'dash-alert-ico', dataset: { sev: late ? 'critical' : 'medium' }, html: icon('clipboard-list', 15) }),
              h('div', { className: 'dash-row-main' },
                h('div', { className: 'dash-row-title' }, hw.title),
                h('div', { className: 'dash-row-meta' }, `${hw.subjectName} · ${hw.maxMarks} marks · ${hw.submitted}/${hw.totalStudents} classmates submitted`)),
              h('div', { className: 'dash-row-acts' },
                Badge(late ? `${Math.abs(Math.round((new Date(hw.dueDate) - new Date(TODAY)) / 86400000))}d late` : relativeTime(hw.dueDate), { tone: late ? 'danger' : 'warning' }),
                Button('Submit', { size: 'sm', variant: 'primary', icon: 'upload', onClick: mockAction('Submit homework') })));
          })) : EmptyState({ icon: 'check-circle', tone: 'success', title: 'All caught up', text: 'Every assignment set for your section has been submitted.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Upcoming exams', subtitle: `${exams.length} papers scheduled`, icon: 'file-text', viewAll: 'portals/student/exams' },
          exams.length ? Timeline(exams.slice(0, 6).map((e) => ({
            title: `${e.subjectName} · ${e.examGroupName}`,
            meta: `${formatDate(e.date, 'medium')} · ${e.startTime}–${e.endTime} · ${e.room}`,
            text: `${e.maxMarks} marks · pass mark ${e.passMarks} · ${relativeTime(e.date)}`,
            icon: 'file-text', tone: 'info',
          }))) : EmptyState({ icon: 'file-text', title: 'No exams scheduled', text: 'The next assessment cycle has not been published yet.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Library', subtitle: `${books.length} books with me`, icon: 'library', viewAll: 'portals/student/library' },
          books.length ? h('div', { className: 'dash-rows' }, books.map((b) => h('div', { className: 'dash-row' },
            h('span', { className: 'dash-alert-ico', dataset: { sev: b.status === 'Overdue' ? 'critical' : 'info' }, html: icon('book', 15) }),
            h('div', { className: 'dash-row-main' },
              h('div', { className: 'dash-row-title' }, b.bookTitle),
              h('div', { className: 'dash-row-meta' }, `${b.accessionNo} · due ${formatDate(b.dueDate, 'medium')}${num(b.fine) ? ` · fine ${money(b.fine)}` : ''}`)),
            h('div', { className: 'dash-row-acts' },
              Badge(b.status),
              Button('Renew', { size: 'sm', variant: 'secondary', icon: 'refresh', onClick: mockAction('Renew book') })))))
            : EmptyState({ icon: 'library', title: 'No books issued', text: 'Borrow up to two titles at a time from the school library.', action: Button('Browse catalogue', { variant: 'secondary', icon: 'book', route: 'library/catalog' }) })),
      },

      {
        span: 5,
        render: () => widget({ title: 'Marks card', subtitle: `${full.subjectScores.length} subjects · CGPA ${s.cgpa}`, icon: 'certificate', viewAll: 'examination/report-cards' },
          full.subjectScores.length ? DataTable({
            rows: full.subjectScores,
            paginate: false, searchable: false, columnToggle: false, exportName: 'my-marks', maxHeight: 'none',
            columns: [
              { key: 'subjectName', label: 'Subject', sticky: true, width: 170 },
              { key: 'marks', label: 'Marks', numeric: true, align: 'right', width: 100, render: (r) => `${r.marks}/${r.maxMarks}` },
              { key: 'percent', label: '%', numeric: true, align: 'right', width: 80, render: (r) => `${round1(pct(r.marks, r.maxMarks))}%`, value: (r) => pct(r.marks, r.maxMarks) },
              { key: 'grade', label: 'Grade', width: 90, render: (r) => Badge(r.grade, { tone: ['A1', 'A2'].includes(r.grade) ? 'success' : ['B1', 'B2', 'C1'].includes(r.grade) ? 'info' : 'warning' }) },
              { key: 'teacher', label: 'Teacher', width: 170 },
            ],
          }) : EmptyState({ icon: 'certificate', title: 'Report card pending', text: 'Marks are published after the results processing run.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Fees', subtitle: `${s.feeStatus} · ${money(s.feePaid)} of ${money(s.feeTotal)} paid`, icon: 'wallet', viewAll: 'portals/student/fees' },
          h('div', { className: 'stack-3' },
            ProgressBar(pct(s.feePaid, s.feeTotal), { label: 'Paid this year', showValue: true }),
            invoicesDue.length ? h('div', { className: 'dash-rows' }, invoicesDue.map((i) => h('div', { className: 'dash-row' },
              h('div', { className: 'dash-row-main' },
                h('div', { className: 'dash-row-title' }, `${i.period} · ${i.quarter}`),
                h('div', { className: 'dash-row-meta' }, `${i.invoiceNo} · due ${formatDate(i.dueDate, 'medium')}${num(i.overdueDays) ? ` · ${i.overdueDays} days overdue` : ''}`)),
              h('span', { className: 't-semibold t-num' }, money(i.balance)))))
              : EmptyState({ icon: 'check-circle', tone: 'success', title: 'Nothing outstanding', text: 'All invoices for this session are settled.' }),
            num(s.feeOverdue) > 0
              ? Button(`Pay ${money(s.feeOverdue)} now`, { variant: 'primary', block: true, icon: 'credit-card', onClick: mockAction('Open payment gateway') })
              : num(s.feeDue) > 0 ? Button(`Pay next instalment · ${money(s.feeDue)} left this year`, { variant: 'secondary', block: true, icon: 'credit-card', onClick: mockAction('Open payment gateway') }) : null)),
      },

      {
        span: 3,
        render: () => widget({ title: 'Achievements', subtitle: `${s.awardsCount} awards · ${(s.activities || []).length} activities`, icon: 'award', viewAll: 'activities/achievements' },
          full.awards.length ? Timeline(full.awards.slice(0, 5).map((a) => ({
            title: a.title, meta: `${formatDate(a.date, 'medium')} · ${a.level} · ${a.points} points`,
            text: `${a.category} · awarded by ${a.awardedBy}`, icon: 'award', tone: 'success',
          }))) : h('div', { className: 'stack-3' },
            (s.activities || []).length
              ? h('div', { className: 'row-wrap', style: { gap: '6px' } }, (s.activities || []).map((a) => Tag(a, { icon: 'sparkles' })))
              : null,
            EmptyState({ icon: 'award', title: 'No awards yet', text: 'Take part in a house competition to earn your first certificate.', action: Button('See competitions', { variant: 'secondary', icon: 'trophy', route: 'activities/competitions' }) }))),
      },

      {
        span: 4,
        render: () => widget({ title: 'Live classes and doubts', subtitle: `${liveClasses.length} sessions ahead · ${doubts.length} questions asked`, icon: 'video', viewAll: 'lms/online-classes' },
          h('div', { className: 'stack-3' },
            liveClasses.length ? h('div', { className: 'dash-rows' }, liveClasses.slice(0, 3).map((c) => h('div', { className: 'dash-row' },
              h('span', { className: 'dash-alert-ico', dataset: { sev: 'info' }, html: icon('video', 15) }),
              h('div', { className: 'dash-row-main' },
                h('div', { className: 'dash-row-title' }, c.title),
                h('div', { className: 'dash-row-meta' }, `${c.subjectName} · ${formatDate(c.date, 'medium')} ${c.startTime} · ${c.platform}`)),
              Button('Join', { size: 'sm', variant: 'secondary', icon: 'external-link', onClick: mockAction('Join class') }))))
              : EmptyState({ icon: 'video', title: 'No live classes scheduled', text: 'Recorded lessons are always available in the study material.' }),
            doubts.length ? h('div', { className: 'stack-2' },
              h('div', { className: 't-eyebrow' }, 'My doubts'),
              doubts.slice(0, 3).map((d) => MetricRow(d.question, Badge(d.status)))) : null)),
      },

      {
        span: 5,
        render: () => widget({ title: 'School diary', subtitle: 'Events, holidays and exams ahead', icon: 'calendar-check', viewAll: 'portals/student/events' },
          upcomingList(campusId, 6)),
      },
    ],
  });
}

/* ===================================================== 14 · PARENT === */

function pickParent(campusId) {
  return memo(`parent:${campusId || 'ALL'}`, () => {
    const pool = scope(db.parents, campusId);
    const multi = pool.filter((p) => p.studentIds.length > 1 && p.studentIds.every((id) => byId(db.students, id)));
    const onLoan = new Set(db.bookIssues.filter((b) => b.status !== 'Returned').map((b) => b.studentId));
    const openHwSections = new Set(db.homework.filter((hw) => hw.status === 'Open').map((hw) => hw.sectionId));
    const kidScore = (s) => (!s ? -99 : (num(s.classLevel) >= 8 ? 4 : 0)
      + (onLoan.has(s.id) ? 4 : 0)
      + (num(s.feeDue) > 0 ? 3 : 0)
      + (openHwSections.has(s.sectionId) ? 3 : 0)
      + (s.transportOpted ? 6 : 0));
    let best = multi[0] || pool[0] || db.parents[0];
    let bestScore = -1;
    for (const p of multi) {
      const v = Math.max(...p.studentIds.map((id) => kidScore(byId(db.students, id))));
      if (v > bestScore) { bestScore = v; best = p; }
    }
    return best;
  });
}

function childCard(child, active, onSelect) {
  return h('div', {
    className: ['dash-child', active && 'is-active'].filter(Boolean).join(' '),
    onClick: onSelect, attrs: { role: 'button', tabindex: '0' },
    onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } },
  },
    Avatar(child.name, { size: 'lg', ring: active }),
    h('div', { className: 'flex-1 min-0' },
      h('div', { className: 't-semibold t-truncate' }, child.name),
      h('div', { className: 't-xs t-muted' }, `${child.className} ${child.section} · ${child.house} House · roll ${child.rollNo}`),
      h('div', { className: 'row row-wrap mt-2', style: { gap: '6px' } },
        Badge(`${child.attendancePct}% attendance`, { tone: num(child.attendancePct) >= 85 ? 'success' : num(child.attendancePct) >= 75 ? 'warning' : 'danger' }),
        Badge(num(child.feeOverdue) ? `${money(child.feeOverdue, true)} overdue` : 'Fees up to date', { tone: num(child.feeOverdue) ? 'danger' : 'success' }))));
}

function parentPage(ctx, parent, kids, activeIndex, onSelect) {
  const child = kids[activeIndex];
  /* db.hostelAllocations is what stamps hostelId/roomNo onto a student, so the
     child's room is null until that collection has been built. Touch it before
     reading child.roomNo below — same idiom as db.js's own reconciliation. */
  void db.hostelAllocations.length;
  const full = student360(child.id);
  const slots = sortBy(db.timetableSlots.filter((t) => t.sectionId === child.sectionId && t.day === TODAY_DOW), 'periodNo');
  const homework = db.homework.filter((hw) => hw.sectionId === child.sectionId && hw.status === 'Open');
  const childSubs = new Set(db.submissions.filter((x) => x.studentId === child.id).map((x) => x.homeworkId));
  const dueHomework = homework.filter((hw) => !childSubs.has(hw.id));
  const exams = sortBy(db.exams.filter((e) => e.classId === child.classId && e.date >= TODAY), 'date');
  const invoicesDue = full.invoices.filter((i) => num(i.balance) > 0);
  const books = full.bookIssues.filter((b) => b.status !== 'Returned');
  const bookings = db.ptmBookings.filter((b) => b.studentId === child.id);
  const openPtm = db.ptmSchedules.filter((p) => p.status === 'Open' && p.campusId === child.campusId);
  const teacher = child.sectionId ? byId(db.staff, (byId(db.sections, child.sectionId) || {}).classTeacherId) : null;
  const totalDue = kids.reduce((a, k) => a + num(k.feeOverdue), 0);
  const totalBalance = kids.reduce((a, k) => a + num(k.feeDue), 0);

  return dashboardPage({
    greeting: greetingFor(parent.name),
    subtitle: `Parent portal · ${kids.length} ${kids.length === 1 ? 'child' : 'children'} enrolled · ${campusName(parent.campusId)} · AY ${AY_LABEL} · ${formatDate(TODAY, 'long')}`,
    route: 'dashboard/parent',
    actions: quickActions(ctx, [
      { label: totalDue ? `Pay ${money(totalDue, true)} overdue` : 'Fees & receipts', icon: 'credit-card', route: 'portals/parent/fees' },
      { label: 'Book PTM', icon: 'handshake', route: 'portals/parent/ptm' },
      { label: 'Message school', icon: 'send', route: 'portals/parent/messages' },
    ]),
    kpis: [
      { label: 'Attendance', value: `${child.attendancePct}%`, delta: 1.1, deltaLabel: 'vs last month', icon: 'clipboard-check', tone: num(child.attendancePct) >= 85 ? 'success' : 'warning', route: 'portals/parent/attendance' },
      { label: 'Last exam', value: `${child.lastExamPercent}%`, deltaLabel: `grade ${gradeFor(child.lastExamPercent)} · CGPA ${child.cgpa}`, icon: 'file-text', tone: 'brand', route: 'portals/parent/results' },
      { label: 'Class rank', value: `#${child.rank}`, deltaLabel: `${child.className} ${child.section}`, icon: 'trophy', tone: 'info', route: 'examination/merit-list' },
      { label: 'Homework due', value: String(dueHomework.length), deltaLabel: 'not yet submitted', icon: 'clipboard-list', tone: dueHomework.length ? 'warning' : 'success', route: 'portals/parent/homework' },
      { label: 'Overdue (this child)', value: money(child.feeOverdue), deltaLabel: `${money(child.feeDue)} balance on the year`, icon: 'wallet', tone: num(child.feeOverdue) ? 'danger' : 'success', route: 'portals/parent/fees' },
      { label: 'Overdue (all children)', value: money(totalDue), deltaLabel: `${kids.filter((k) => num(k.feeOverdue) > 0).length} of ${kids.length} past due · ${money(totalBalance, true)} billed ahead`, icon: 'receipt', tone: totalDue ? 'danger' : 'success', route: 'portals/parent/fees' },
      { label: 'Library books', value: String(books.length), deltaLabel: `${books.filter((b) => b.status === 'Overdue').length} overdue`, icon: 'library', tone: books.some((b) => b.status === 'Overdue') ? 'danger' : 'info', route: 'library/members' },
      { label: 'PTM bookings', value: String(bookings.filter((b) => b.status === 'Confirmed').length), deltaLabel: `${openPtm.length} meetings open for booking`, icon: 'handshake', tone: 'brand', route: 'portals/parent/ptm' },
    ],
    widgets: [
      {
        span: 12,
        render: () => widget({
          title: 'My children',
          subtitle: 'Select a child to switch every widget below',
          icon: 'users', viewAll: 'portals/parent/children',
        }, h('div', { className: 'dash-picker' }, kids.map((k, i) => childCard(k, i === activeIndex, () => onSelect(i))))),
      },

      {
        span: 7,
        render: () => widget({
          title: `${child.firstName}'s day — ${formatDate(TODAY, 'weekday')}`,
          subtitle: `${slots.length} periods · ${child.className} ${child.section}${teacher ? ` · class teacher ${teacher.name}` : ''}`,
          icon: 'calendar', viewAll: 'portals/parent/attendance',
        }, periodRail(slots, {
          emptyTitle: 'No classes today',
          emptyText: `${child.firstName}'s section has no periods scheduled on a Thursday.`,
        })),
      },

      {
        span: 5,
        render: () => widget({ title: 'Attendance and conduct', subtitle: `${child.presentDays} of ${child.totalDays} days present`, icon: 'clipboard-check', viewAll: 'portals/parent/attendance' },
          h('div', { className: 'row', style: { justifyContent: 'center' } },
            progressRing(num(child.attendancePct), {
              size: 138, label: 'Attendance',
              sublabel: num(child.attendancePct) >= 75 ? 'Above the 75% requirement' : 'Below the 75% requirement',
            })),
          h('div', { className: 'mt-3' }, tileGrid([
            { label: 'Days absent', value: formatNumber(num(child.totalDays) - num(child.presentDays)), tone: 'danger', route: 'portals/parent/attendance' },
            { label: 'Behaviour', value: String(child.behaviourScore), tone: num(child.behaviourScore) >= 80 ? 'success' : 'warning', sub: `${child.disciplinaryCount} notes`, route: 'students/behaviour' },
            { label: 'Awards', value: String(child.awardsCount), tone: 'brand', route: 'activities/achievements' },
            { label: 'House', value: child.house, sub: 'inter-house standing', route: 'activities/houses' },
          ]))),
      },

      {
        span: 6,
        render: () => widget({ title: 'Subject-wise results', subtitle: 'Latest published assessment', icon: 'chart-bar', viewAll: 'portals/parent/results', className: 'chart-card' },
          full.subjectScores.length ? barChart({
            categories: full.subjectScores.map((x) => x.subjectName),
            series: [{ name: 'Percentage', values: full.subjectScores.map((x) => round1(pct(x.marks, x.maxMarks))) }],
            horizontal: true, showValues: true, target: 70, height: 320, valueFormat: 'percent',
            title: `${child.firstName}'s subject results`,
          }) : EmptyState({ icon: 'file-text', title: 'Results not published', text: 'Marks appear here once the school completes results processing.' })),
      },

      {
        span: 6,
        render: () => widget({ title: 'Progress across years', subtitle: 'Percentage and attendance history', icon: 'trending-up', viewAll: 'portals/parent/results', className: 'chart-card' },
          full.academicHistory.length ? lineChart({
            categories: full.academicHistory.map((x) => x.className),
            series: [
              { name: 'Percentage', values: full.academicHistory.map((x) => x.percent) },
              { name: 'Attendance', values: full.academicHistory.map((x) => x.attendance) },
            ],
            showDots: true, showEndLabels: true, valueFormat: 'percent', minY: 40, maxY: 100, height: 320,
            title: 'Progress across years',
          }) : EmptyState({ icon: 'trending-up', title: 'No history yet', text: 'This is the first academic year on record for this child.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Homework to finish', subtitle: `${dueHomework.length} pending`, icon: 'clipboard-list', viewAll: 'portals/parent/homework' },
          dueHomework.length ? h('div', { className: 'dash-rows' }, sortBy(dueHomework, 'dueDate').slice(0, 6).map((hw) => h('div', { className: 'dash-row' },
            h('span', { className: 'dash-alert-ico', dataset: { sev: hw.dueDate < TODAY ? 'critical' : 'medium' }, html: icon('clipboard-list', 15) }),
            h('div', { className: 'dash-row-main' },
              h('div', { className: 'dash-row-title' }, hw.title),
              h('div', { className: 'dash-row-meta' }, `${hw.subjectName} · due ${formatDate(hw.dueDate, 'medium')} · ${hw.submitted}/${hw.totalStudents} submitted`)),
            Badge(hw.dueDate < TODAY ? 'Overdue' : relativeTime(hw.dueDate), { tone: hw.dueDate < TODAY ? 'danger' : 'warning' }))))
            : EmptyState({ icon: 'check-circle', tone: 'success', title: 'Nothing pending', text: `${child.firstName} has submitted everything set so far.` })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Fees and receipts', subtitle: `${child.feeStatus} · ${money(child.feePaid)} of ${money(child.feeTotal)}`, icon: 'wallet', viewAll: 'portals/parent/fees' },
          h('div', { className: 'stack-3' },
            ProgressBar(pct(child.feePaid, child.feeTotal), { label: 'Paid this year', showValue: true }),
            invoicesDue.length ? h('div', { className: 'dash-rows' }, invoicesDue.map((i) => h('div', { className: 'dash-row' },
              h('div', { className: 'dash-row-main' },
                h('div', { className: 'dash-row-title' }, `${i.period}`),
                h('div', { className: 'dash-row-meta' }, `${i.invoiceNo} · due ${formatDate(i.dueDate, 'medium')}${num(i.overdueDays) ? ` · ${i.overdueDays} days overdue` : ''}`)),
              h('span', { className: 't-semibold t-num' }, money(i.balance)))))
              : EmptyState({ icon: 'check-circle', tone: 'success', title: 'All settled', text: 'No invoice is outstanding for this child.' }),
            num(child.feeOverdue) > 0
              ? Button(`Pay ${money(child.feeOverdue)} overdue now`, { variant: 'primary', block: true, icon: 'credit-card', onClick: mockAction('Open payment gateway') })
              : num(child.feeDue) > 0 ? Button(`Pay ahead · ${money(child.feeDue)} left this year`, { variant: 'secondary', block: true, icon: 'credit-card', onClick: mockAction('Open payment gateway') }) : null,
            full.payments.length ? h('div', { className: 'stack-2' },
              h('div', { className: 't-eyebrow' }, 'Recent receipts'),
              full.payments.slice(0, 3).map((p) => MetricRow(`${p.receiptNo} · ${formatDate(p.date, 'medium')}`, money(p.amount), Badge(p.mode, { tone: 'neutral' })))) : null)),
      },

      {
        span: 4,
        render: () => widget({ title: 'School bus', subtitle: child.transportOpted ? 'Live position on the morning run' : 'Private transport', icon: 'bus', viewAll: 'portals/parent/bus-tracking' },
          busCard(child)),
      },

      {
        span: 4,
        render: () => widget({ title: 'Parent-teacher meeting', subtitle: `${openPtm.length} meetings open for booking`, icon: 'handshake', viewAll: 'portals/parent/ptm' },
          h('div', { className: 'stack-3' },
            bookings.length ? h('div', { className: 'dash-rows' }, bookings.slice(0, 3).map((b) => h('div', { className: 'dash-row' },
              Avatar(b.teacherName, { size: 'sm' }),
              h('div', { className: 'dash-row-main' },
                h('div', { className: 'dash-row-title' }, b.teacherName),
                h('div', { className: 'dash-row-meta' }, `${formatDate(b.date, 'medium')} at ${b.time} · ${b.status}`)),
              Badge(b.status))))
              : EmptyState({ icon: 'handshake', title: 'No meeting booked', text: 'Book a slot with the class teacher before the window closes.' }),
            openPtm.length ? h('div', { className: 'stack-2' },
              h('div', { className: 't-eyebrow' }, 'Open for booking'),
              openPtm.slice(0, 2).map((p) => MetricRow(`${p.title} · ${formatDate(p.date, 'medium')}`, `${p.capacity - p.booked} slots left`)),
              Button('Book a slot', { variant: 'primary', block: true, icon: 'calendar-check', route: 'portals/parent/ptm' })) : null)),
      },

      {
        span: 4,
        render: () => widget({ title: 'Exams ahead', subtitle: `${exams.length} papers scheduled`, icon: 'file-text', viewAll: 'portals/parent/results' },
          exams.length ? Timeline(exams.slice(0, 5).map((e) => ({
            title: `${e.subjectName}`,
            meta: `${formatDate(e.date, 'medium')} · ${e.startTime}–${e.endTime} · ${e.room}`,
            text: `${e.examGroupName} · ${e.maxMarks} marks`,
            icon: 'file-text', tone: 'info',
          }))) : EmptyState({ icon: 'file-text', title: 'No exams scheduled', text: 'The next assessment cycle has not been published.' })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Library', subtitle: `${books.length} books issued to ${child.firstName}`, icon: 'library', viewAll: 'library/members' },
          books.length ? h('div', { className: 'dash-rows' }, books.map((b) => h('div', { className: 'dash-row' },
            h('span', { className: 'dash-alert-ico', dataset: { sev: b.status === 'Overdue' ? 'critical' : 'info' }, html: icon('book', 15) }),
            h('div', { className: 'dash-row-main' },
              h('div', { className: 'dash-row-title' }, b.bookTitle),
              h('div', { className: 'dash-row-meta' }, `Due ${formatDate(b.dueDate, 'medium')}${num(b.fine) ? ` · fine ${money(b.fine)}` : ''}`)),
            Badge(b.status))))
            : EmptyState({ icon: 'library', title: 'No books issued', text: `${child.firstName} has no library books out at the moment.` })),
      },

      {
        span: 4,
        render: () => widget({ title: 'Notices from school', subtitle: 'Circulars addressed to parents', icon: 'scroll', viewAll: 'communication/circulars' },
          noticeList(child.campusId)),
      },

      {
        span: 4,
        render: () => widget({ title: 'School diary', subtitle: 'Events, holidays and meetings', icon: 'calendar-check', viewAll: 'events/calendar' },
          upcomingList(child.campusId, 6)),
      },

      {
        span: 4,
        render: () => widget({ title: `${child.firstName}'s record`, subtitle: 'Key details on file', icon: 'id-card', viewAll: `students/profile/${child.id}` },
          DescriptionList([
            ['Admission no', child.admissionNo],
            ['Class', `${child.className} ${child.section}`],
            ['Blood group', child.bloodGroup],
            ['Class teacher', teacher ? teacher.name : '—'],
            ['Emergency contact', child.emergencyContact],
            ['Transport', child.transportOpted ? 'School bus' : 'Private'],
            ['Hostel', child.hostelOpted ? `Boarder · room ${child.roomNo || '—'}` : 'Day scholar'],
            ['Documents', `${full.documents.filter((d) => d.status === 'Verified').length} of ${full.documents.length} verified`],
          ], { cols: 2 }),
          h('div', { className: 'mt-3 row' },
            Button('Full profile', { variant: 'secondary', size: 'sm', icon: 'eye', route: `students/profile/${child.id}` }),
            Button('Documents', { variant: 'ghost', size: 'sm', icon: 'folder', route: 'portals/parent/documents' }))),
      },
    ],
  });
}

function buildParent(ctx) {
  const parent = pickParent(ctx.state.campusId);
  if (!parent) return missingRecord('parent record', 'parents/directory');
  const kids = parent.studentIds.map((id) => byId(db.students, id)).filter(Boolean);
  if (!kids.length) return missingRecord('linked child', 'parents/link-children');

  const host = h('div');
  // Open on the child with the fullest record — usually the eldest.
  const onLoan = new Set(db.bookIssues.filter((b) => b.status !== 'Returned').map((b) => b.studentId));
  const openHwSections = new Set(db.homework.filter((hw) => hw.status === 'Open').map((hw) => hw.sectionId));
  const richness = (k) => (num(k.classLevel) >= 8 ? 4 : 0) + (onLoan.has(k.id) ? 4 : 0)
    + (num(k.feeDue) > 0 ? 3 : 0) + (openHwSections.has(k.sectionId) ? 3 : 0)
    + (k.transportOpted ? 4 : 0) + num(k.classLevel) / 100;
  let active = kids.reduce((best, k, i) => (richness(k) > richness(kids[best]) ? i : best), 0);
  const paint = () => {
    host.innerHTML = '';
    host.appendChild(parentPage(ctx, parent, kids, active, (i) => {
      if (i === active) return;
      active = i;
      paint();
      notify({ title: `Now viewing ${kids[active].name}`, text: `${kids[active].className} ${kids[active].section}`, tone: 'info', duration: 2200 });
    }));
  };
  paint();
  return host;
}

/* ================================================== route registry === */

/** Wrap a builder so styles are injected and a thrown error still renders. */
function mountDash(builder) {
  return (mountEl, ctx) => {
    ensureStyles();
    const safeCtx = { ...ctx, state: (ctx && ctx.state) || store.get() };
    if (!safeCtx.state.campusId) safeCtx.state.campusId = 'C1';
    mountEl.appendChild(builder(safeCtx));
  };
}

export const routes = {
  'dashboard/overview': {
    title: 'KPI / MIS Overview',
    subtitle: 'One executive scorecard across every module and campus',
    section: 'dashboard',
    render: mountDash(buildOverview),
  },

  'dashboard/super-admin': {
    title: 'Super Admin Dashboard',
    subtitle: 'Multi-campus control tower, system health and access governance',
    section: 'dashboard',
    render: mountDash(buildSuperAdmin),
  },

  'dashboard/management': {
    title: 'Management Dashboard',
    subtitle: 'Revenue, surplus, enrolment and the risks the board should discuss',
    section: 'dashboard',
    render: mountDash(buildManagement),
  },

  'dashboard/principal': {
    title: 'Principal Dashboard',
    subtitle: 'Campus performance, attendance, academics and approvals',
    section: 'dashboard',
    render: mountDash(buildPrincipal),
  },

  'dashboard/teacher': {
    title: 'Teacher Dashboard',
    subtitle: "Today's periods, registers to mark, homework and grading",
    section: 'dashboard',
    render: mountDash(buildTeacher),
  },

  'dashboard/accountant': {
    title: 'Accounts Dashboard',
    subtitle: 'Collection against target, day book, ageing and approvals',
    section: 'dashboard',
    render: mountDash(buildAccountant),
  },

  'dashboard/hr': {
    title: 'Human Resources Dashboard',
    subtitle: 'Headcount, attendance, leave, payroll and recruitment',
    section: 'dashboard',
    render: mountDash(buildHr),
  },

  'dashboard/librarian': {
    title: 'Library Dashboard',
    subtitle: 'Circulation, overdue loans, fines and collection health',
    section: 'dashboard',
    render: mountDash(buildLibrarian),
  },

  'dashboard/transport': {
    title: 'Transport Dashboard',
    subtitle: 'Live fleet map, route utilisation, fuel, maintenance and compliance',
    section: 'dashboard',
    render: mountDash(buildTransport),
  },

  'dashboard/hostel': {
    title: 'Hostel Dashboard',
    subtitle: 'Occupancy, roll call, mess, gate passes and complaints',
    section: 'dashboard',
    render: mountDash(buildHostel),
  },

  'dashboard/nurse': {
    title: 'Infirmary Dashboard',
    subtitle: 'Visits, active cases, allergies, checkups and vaccination cover',
    section: 'dashboard',
    render: mountDash(buildNurse),
  },

  'dashboard/front-office': {
    title: 'Front Office Dashboard',
    subtitle: 'Visitors, gate passes, calls, enquiries, couriers and appointments',
    section: 'dashboard',
    render: mountDash(buildFrontOffice),
  },

  'dashboard/student': {
    title: 'My Dashboard',
    subtitle: 'Timetable, attendance, homework, results, fees and library',
    section: 'dashboard',
    render: mountDash(buildStudent),
  },

  'dashboard/parent': {
    title: 'Parent Dashboard',
    subtitle: 'Every child at a glance — attendance, results, fees, bus and PTM',
    section: 'dashboard',
    render: mountDash(buildParent),
  },
};

export default routes;

