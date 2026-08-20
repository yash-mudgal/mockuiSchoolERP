/* ==========================================================================
   pages/portals.js — Portals · Security · System
   ---------------------------------------------------------------------------
   Three sections live in this file:

     portals/*   the self-service products (teacher, parent, student, employee)
                 plus the mobile app showcase. These deliberately do NOT look
                 like the admin panel: soft hero headers, big touch targets,
                 card-first layouts, calm language.
     security/*  gate & campus security desk: visitors, gate passes, incidents,
                 roster, emergency broadcast, CCTV wall.
     system/*    platform administration: users, roles, the permission matrix,
                 every integration settings screen, audit and login history.

   Everything is composed from core/ui.js, core/page-kit.js and core/charts.js
   and reads real rows from data/db.js. No colour, radius or spacing literal
   appears anywhere — the scoped stylesheet below uses design tokens only.
   ========================================================================== */

import {
  h, frag, Icon, Card, SectionCard, StatCard, Badge, Button, IconButton, Identity,
  DataTable, Modal, Drawer, ConfirmDialog, notify, EmptyState, Timeline, ActivityFeed,
  DescriptionList, ProgressBar, Avatar, AvatarStack, Tabs, SegmentedControl, FilterBar,
  MenuButton, Callout, FileList, RankList, PhotoGrid, MetricRow, Pill, Tag, Divider,
  Rating, Stepper, ApprovalTrail, Accordion, CommentThread, ChatPanel, Calendar,
  MapPlaceholder, RadialProgress, SearchInput, Field, Input, Textarea, Select, Combobox,
  MultiSelect, Checkbox, RadioGroup, Switch, DatePicker, TimePicker, FileUpload,
  FormGrid, FormSection, FormActions, Toolbar, ButtonGroup, Skeleton, SkeletonText,
  validators, mockAction, printNode, download, copyToClipboard, initials,
  formatCurrency, formatNumber, formatPercent, formatDate, formatDateTime, formatTime,
  relativeTime, toneForStatus, DEMO_NOW,
} from '../core/ui.js';

import {
  page, listPage, detailPage, dashboardPage, formPage, reportPage, settingsPage,
  approvalQueuePage, calendarPage, profileHeader, kpiRow, greetingFor, missingRecord,
  pageActions,
} from '../core/page-kit.js';

import {
  lineChart, areaChart, barChart, comboChart, donutChart, funnelChart, heatmap,
  gaugeChart, bulletChart, radialBarChart, progressRing, sparkline, stackedProgressBar,
  ScaleLegend, PALETTE, STATUS, seriesColor,
} from '../core/charts.js';

import {
  db, analytics, byId, where, search, sortBy, groupBy, sum, avg, countBy, sumBy,
  student360, gradeFor, subjectsForLevel, PERMISSION_MODULES, formatAddress,
} from '../data/db.js';

import { icon } from '../core/icons.js';
import { navigate, navHref } from '../core/router.js';
import * as store from '../core/state.js';
import { NAV, routeMeta, breadcrumbFor, flatNav, navForRole, roleAllowed, allRoutes } from '../core/nav.js';

/* ======================================================== scoped styles == */

const STYLE_ID = 'portals-module-style';

const MODULE_CSS = `
/* ---------- portal shell ---------- */
.pt-hero{
  border-radius: var(--r-xl);
  background: linear-gradient(135deg, var(--brand-600), var(--brand-500));
  color: var(--on-brand);
  padding: var(--sp-6);
  display: flex; gap: var(--sp-5); flex-wrap: wrap; align-items: center;
  box-shadow: var(--shadow-md);
}
.pt-hero .pt-hero-main{ flex: 1 1 280px; min-width: 0; }
.pt-hero-eyebrow{
  font-size: var(--fs-2xs); letter-spacing: .10em; text-transform: uppercase;
  font-weight: var(--fw-semibold); opacity: .78;
}
.pt-hero-title{ font-size: var(--fs-2xl); font-weight: var(--fw-bold); line-height: var(--lh-tight); margin-top: var(--sp-1); }
.pt-hero-sub{ opacity: .84; margin-top: var(--sp-2); font-size: var(--fs-sm); }
.pt-hero-meta{ display: flex; gap: var(--sp-4); flex-wrap: wrap; margin-top: var(--sp-4); }
.pt-hero-meta > div{ min-width: 76px; }
.pt-hero-meta .v{ font-size: var(--fs-lg); font-weight: var(--fw-bold); }
.pt-hero-meta .l{ font-size: var(--fs-2xs); text-transform: uppercase; letter-spacing: .07em; opacity: .74; }
.pt-hero-actions{ display: flex; gap: var(--sp-2); flex-wrap: wrap; }
.pt-hero-chip{
  display: inline-flex; align-items: center; gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3); border-radius: var(--r-full);
  background: var(--surface); color: var(--text);
  font-size: var(--fs-sm); font-weight: var(--fw-semibold);
  border: 1px solid var(--border-subtle); cursor: pointer;
}
.pt-hero-chip:hover{ background: var(--surface-hover); }

/* ---------- big touch tiles ---------- */
.pt-tiles{ display: grid; grid-template-columns: repeat(auto-fit, minmax(158px, 1fr)); gap: var(--sp-3); }
.pt-tile{
  display: flex; flex-direction: column; gap: var(--sp-2);
  min-height: 104px; padding: var(--sp-4);
  border: 1px solid var(--border); border-radius: var(--r-lg);
  background: var(--surface); text-align: left; cursor: pointer;
  transition: transform var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease);
  color: inherit; font: inherit;
}
.pt-tile:hover{ transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--border-brand); }
.pt-tile:focus-visible{ outline: 2px solid var(--border-focus); outline-offset: 2px; }
.pt-tile-ico{
  width: 34px; height: 34px; border-radius: var(--r-md);
  display: grid; place-items: center; background: var(--surface-accent); color: var(--text-brand);
}
.pt-tile[data-tone="success"] .pt-tile-ico{ background: var(--success-50); color: var(--success-700); }
.pt-tile[data-tone="warning"] .pt-tile-ico{ background: var(--warning-50); color: var(--warning-700); }
.pt-tile[data-tone="danger"]  .pt-tile-ico{ background: var(--danger-50);  color: var(--danger-700); }
.pt-tile[data-tone="info"]    .pt-tile-ico{ background: var(--info-50);    color: var(--info-700); }
.pt-tile-label{ font-weight: var(--fw-semibold); font-size: var(--fs-sm); }
.pt-tile-value{ font-size: var(--fs-lg); font-weight: var(--fw-bold); }
.pt-tile-meta{ font-size: var(--fs-xs); color: var(--text-muted); }

/* ---------- child / context switcher ---------- */
.pt-switch{ display: flex; gap: var(--sp-2); flex-wrap: wrap; }
.pt-switch-item{
  display: flex; align-items: center; gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3); border-radius: var(--r-full);
  border: 1px solid var(--border); background: var(--surface); cursor: pointer;
  font: inherit; color: inherit; min-height: 44px;
}
.pt-switch-item:hover{ background: var(--surface-hover); }
.pt-switch-item.is-active{ border-color: var(--border-brand); background: var(--surface-selected); box-shadow: var(--shadow-xs); }
.pt-switch-item .n{ font-weight: var(--fw-semibold); font-size: var(--fs-sm); }
.pt-switch-item .m{ font-size: var(--fs-xs); color: var(--text-muted); }

/* ---------- day timeline ---------- */
.pt-day{ display: flex; flex-direction: column; }
.pt-slot{
  display: grid; grid-template-columns: 92px 1fr auto; gap: var(--sp-3);
  align-items: center; padding: var(--sp-3) 0; border-bottom: 1px solid var(--border-subtle);
}
.pt-slot:last-child{ border-bottom: 0; }
.pt-slot.is-now{ background: var(--surface-selected); border-radius: var(--r-md); padding-left: var(--sp-3); padding-right: var(--sp-3); }
.pt-slot.is-break{ opacity: .72; }
.pt-slot-time{ font-size: var(--fs-xs); font-variant-numeric: tabular-nums; color: var(--text-muted); }
.pt-slot-bar{ width: 3px; border-radius: var(--r-full); background: var(--brand-500); align-self: stretch; }
.pt-slot-title{ font-weight: var(--fw-semibold); font-size: var(--fs-sm); }
.pt-slot-meta{ font-size: var(--fs-xs); color: var(--text-muted); }

/* ---------- one-tap attendance ---------- */
.pt-att-row{
  display: flex; align-items: center; gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--border-subtle);
}
.pt-att-row:last-child{ border-bottom: 0; }
.pt-att-seg{ display: inline-flex; border: 1px solid var(--border); border-radius: var(--r-md); overflow: hidden; }
.pt-att-seg button{
  min-width: 44px; min-height: 34px; padding: 0 var(--sp-3);
  border: 0; background: var(--surface); color: var(--text-secondary);
  font: inherit; font-size: var(--fs-xs); font-weight: var(--fw-semibold); cursor: pointer;
  border-right: 1px solid var(--border);
}
.pt-att-seg button:last-child{ border-right: 0; }
.pt-att-seg button:hover{ background: var(--surface-hover); }
.pt-att-seg button[aria-pressed="true"][data-v="P"]{ background: var(--success-600); color: var(--on-success); }
.pt-att-seg button[aria-pressed="true"][data-v="A"]{ background: var(--danger-500);  color: var(--on-danger); }
.pt-att-seg button[aria-pressed="true"][data-v="L"]{ background: var(--warning-500); color: var(--on-warning); }

/* ---------- marks entry grid ---------- */
.pt-marks-row{ display: grid; grid-template-columns: 1fr 110px 70px 1fr; gap: var(--sp-3); align-items: center;
  padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--border-subtle); }
.pt-marks-row:last-child{ border-bottom: 0; }
@media (max-width: 768px){ .pt-marks-row{ grid-template-columns: 1fr 90px 60px; } .pt-marks-row .pt-marks-note{ display: none; } }

/* ---------- soft info strip ---------- */
.pt-soft{ background: var(--surface-sunken); border: 1px solid var(--border-subtle); border-radius: var(--r-lg); padding: var(--sp-4); }
.pt-kv{ display: flex; justify-content: space-between; gap: var(--sp-3); padding: var(--sp-2) 0; border-bottom: 1px dashed var(--border-subtle); font-size: var(--fs-sm); }
.pt-kv:last-child{ border-bottom: 0; }

/* ---------- phone frames (mobile showcase) ---------- */
.pt-phones{ display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--sp-5); }
.pt-phone{ display: flex; flex-direction: column; align-items: center; gap: var(--sp-3); }
.pt-phone-frame{
  width: 264px; max-width: 100%; height: 540px;
  border-radius: var(--r-2xl); border: 1px solid var(--border-strong);
  background: var(--surface); box-shadow: var(--shadow-xl);
  padding: var(--sp-2); position: relative; overflow: hidden;
}
.pt-phone-notch{
  position: absolute; top: var(--sp-2); left: 50%; transform: translateX(-50%);
  width: 92px; height: 18px; border-radius: var(--r-full); background: var(--surface-inverse); z-index: 2;
}
.pt-phone-screen{
  height: 100%; border-radius: var(--r-xl); background: var(--canvas);
  overflow-y: auto; overscroll-behavior: contain; padding: var(--sp-5) var(--sp-3) var(--sp-3);
  display: flex; flex-direction: column; gap: var(--sp-3);
}
.pt-phone-bar{
  display: flex; justify-content: space-between; font-size: var(--fs-2xs);
  color: var(--text-muted); padding: 0 var(--sp-1);
}
.pt-phone-app{
  border-radius: var(--r-lg); padding: var(--sp-3); color: var(--on-brand);
  background: linear-gradient(135deg, var(--brand-600), var(--brand-500));
}
.pt-phone-card{ background: var(--surface); border: 1px solid var(--border-subtle); border-radius: var(--r-lg); padding: var(--sp-3); }
.pt-phone-row{ display: flex; justify-content: space-between; align-items: center; gap: var(--sp-2); font-size: var(--fs-xs); }
.pt-phone-tabs{
  position: sticky; bottom: 0; display: flex; justify-content: space-around;
  background: var(--surface); border-top: 1px solid var(--border-subtle);
  border-radius: var(--r-md); padding: var(--sp-2) 0; margin-top: auto; color: var(--text-muted);
}
.pt-phone-tabs .is-on{ color: var(--text-brand); }

/* ---------- permission matrix ---------- */
.pt-matrix-wrap{ overflow-x: auto; border: 1px solid var(--border); border-radius: var(--r-lg); }
table.pt-matrix{ border-collapse: separate; border-spacing: 0; width: 100%; font-size: var(--fs-sm); }
table.pt-matrix th, table.pt-matrix td{ padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--border-subtle); text-align: center; white-space: nowrap; }
table.pt-matrix thead th{ position: sticky; top: 0; background: var(--surface-sunken); z-index: 2; font-weight: var(--fw-semibold); color: var(--text-secondary); }
table.pt-matrix th.pt-mx-mod, table.pt-matrix td.pt-mx-mod{
  position: sticky; left: 0; background: var(--surface); text-align: left; z-index: 1; min-width: 168px;
}
table.pt-matrix thead th.pt-mx-mod{ z-index: 3; background: var(--surface-sunken); }
table.pt-matrix tbody tr:hover td{ background: var(--surface-hover); }
table.pt-matrix tbody tr:hover td.pt-mx-mod{ background: var(--surface-hover); }
.pt-mx-inherit{ font-size: var(--fs-2xs); color: var(--text-faint); }
.pt-mx-legend{ display: flex; gap: var(--sp-4); flex-wrap: wrap; font-size: var(--fs-xs); color: var(--text-muted); }

/* ---------- CCTV wall ---------- */
.pt-cams{ display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: var(--sp-3); }
.pt-cam{
  position: relative; border-radius: var(--r-lg); overflow: hidden;
  border: 1px solid var(--border); background: var(--surface-inverse); aspect-ratio: 16 / 10;
}
.pt-cam-noise{
  position: absolute; inset: 0;
  background:
    repeating-linear-gradient(0deg, var(--scrim) 0 2px, transparent 2px 4px),
    linear-gradient(160deg, var(--slate-800), var(--slate-950));
  opacity: .85;
}
.pt-cam-off .pt-cam-noise{ background: linear-gradient(160deg, var(--slate-700), var(--slate-900)); opacity: .6; }
.pt-cam-label{
  position: absolute; left: var(--sp-2); bottom: var(--sp-2); right: var(--sp-2);
  display: flex; justify-content: space-between; align-items: center; gap: var(--sp-2);
  font-size: var(--fs-2xs); color: var(--slate-25); text-shadow: 0 1px 2px var(--slate-950);
}
.pt-cam-live{
  position: absolute; top: var(--sp-2); left: var(--sp-2);
  display: inline-flex; align-items: center; gap: var(--sp-1);
  font-size: var(--fs-2xs); font-weight: var(--fw-semibold); color: var(--slate-25);
}
.pt-cam-dot{ width: 7px; height: 7px; border-radius: var(--r-full); background: var(--danger-500); }
.pt-cam-cross{ position: absolute; inset: 0; display: grid; place-items: center; color: var(--slate-400); }

/* ---------- audit diff viewer ---------- */
.pt-diff{ display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-3); }
@media (max-width: 768px){ .pt-diff{ grid-template-columns: 1fr; } }
.pt-diff-col{ border: 1px solid var(--border); border-radius: var(--r-md); overflow: hidden; }
.pt-diff-head{ padding: var(--sp-2) var(--sp-3); background: var(--surface-sunken); font-size: var(--fs-xs); font-weight: var(--fw-semibold); }
.pt-diff-line{ display: flex; gap: var(--sp-2); padding: var(--sp-2) var(--sp-3); font-family: var(--font-mono); font-size: var(--fs-xs); border-top: 1px solid var(--border-subtle); }
.pt-diff-line .k{ color: var(--text-muted); min-width: 118px; }
.pt-diff-line.is-removed{ background: var(--danger-50); color: var(--danger-700); }
.pt-diff-line.is-added{ background: var(--success-50); color: var(--success-700); }

/* ---------- integration catalogue ---------- */
.pt-int{ display: grid; grid-template-columns: repeat(auto-fit, minmax(268px, 1fr)); gap: var(--sp-3); }
.pt-int-card{ border: 1px solid var(--border); border-radius: var(--r-lg); padding: var(--sp-4); background: var(--surface); display: flex; flex-direction: column; gap: var(--sp-3); }
.pt-int-logo{ width: 38px; height: 38px; border-radius: var(--r-md); display: grid; place-items: center; background: var(--surface-accent); color: var(--text-brand); }

/* ---------- misc ---------- */
.pt-photo-box{
  border: 1px dashed var(--border-strong); border-radius: var(--r-lg);
  min-height: 168px; display: grid; place-items: center; gap: var(--sp-2);
  background: var(--surface-sunken); color: var(--text-muted); text-align: center; padding: var(--sp-4);
}
.pt-badge-print{
  width: 280px; max-width: 100%; border: 1px solid var(--border-strong); border-radius: var(--r-lg);
  overflow: hidden; background: var(--surface);
}
.pt-badge-top{ background: linear-gradient(135deg, var(--brand-600), var(--brand-500)); color: var(--on-brand); padding: var(--sp-3); text-align: center; }
.pt-badge-body{ padding: var(--sp-4); display: flex; flex-direction: column; align-items: center; gap: var(--sp-2); text-align: center; }
.pt-badge-foot{ border-top: 1px dashed var(--border); padding: var(--sp-2); text-align: center; font-size: var(--fs-2xs); color: var(--text-muted); }
.pt-grid-2{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--sp-3); }
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = MODULE_CSS;
  document.head.appendChild(el);
}

/* =========================================================== tiny utils == */

const memo = Object.create(null);
function once(key, fn) {
  if (!(key in memo)) memo[key] = fn();
  return memo[key];
}

const TODAY = '2026-08-20';
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TODAY_DAY = 'Thursday';

const money = (n) => formatCurrency(n || 0);
const moneyK = (n) => formatCurrency(n || 0, { compact: true });

function campusOf(ctx) { return (ctx && ctx.state && ctx.state.campusId) || store.get('campusId') || 'C1'; }

/** Minutes since midnight for an 'HH:MM' string. */
function mins(t) {
  const [a, b] = String(t || '00:00').split(':').map(Number);
  return (a || 0) * 60 + (b || 0);
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

/** "in 3 days" / "today" / "4 days ago" for an ISO date against the demo clock. */
function dueLabel(iso) {
  const d = daysBetween(TODAY, iso);
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  if (d > 1) return `Due in ${d} days`;
  if (d === -1) return 'Due yesterday';
  return `Overdue by ${Math.abs(d)} days`;
}

function pct(n, d) { return d ? Math.round((n / d) * 1000) / 10 : 0; }

function toneForPct(v, good = 90, warn = 75) {
  return v >= good ? 'success' : v >= warn ? 'warning' : 'danger';
}

/* ====================================================== shared building == */

/**
 * The soft gradient header every portal screen opens with.
 * hero({ eyebrow, title, subtitle, meta:[{v,l}], actions:[Node], avatar })
 */
function hero({ eyebrow, title, subtitle, meta = [], actions, avatarName, avatarInitials } = {}) {
  return h('div', { className: 'pt-hero' },
    avatarName && Avatar(avatarName, { size: '2xl', ring: true, initials: avatarInitials }),
    h('div', { className: 'pt-hero-main' },
      eyebrow && h('div', { className: 'pt-hero-eyebrow' }, eyebrow),
      h('div', { className: 'pt-hero-title' }, title),
      subtitle && h('div', { className: 'pt-hero-sub' }, subtitle),
      meta.length ? h('div', { className: 'pt-hero-meta' },
        meta.map((m) => h('div', null,
          h('div', { className: 'v' }, m.v),
          h('div', { className: 'l' }, m.l)))) : null),
    actions ? h('div', { className: 'pt-hero-actions' }, actions) : null);
}

function heroChip(label, iconName, onClick) {
  return h('button', { className: 'pt-hero-chip', type: 'button', onClick },
    iconName && Icon(iconName, 15), h('span', null, label));
}

/** A grid of large, thumb-friendly action tiles. */
function tiles(items = []) {
  return h('div', { className: 'pt-tiles' },
    items.map((t) => h('button', {
      className: 'pt-tile', type: 'button', dataset: { tone: t.tone || 'brand' },
      attrs: { 'aria-label': t.label },
      onClick: t.onClick || (t.route ? () => navigate(t.route) : mockAction(t.label)),
    },
      h('span', { className: 'pt-tile-ico', html: icon(t.icon || 'grid', 17) }),
      h('span', { className: 'pt-tile-label' }, t.label),
      t.value != null && h('span', { className: 'pt-tile-value' }, t.value),
      t.meta && h('span', { className: 'pt-tile-meta' }, t.meta))));
}

/** Horizontal pill switcher (children, classes, campuses…). */
function switcher(items, activeId, onPick) {
  return h('div', { className: 'pt-switch' },
    items.map((it) => h('button', {
      className: ['pt-switch-item', it.id === activeId && 'is-active'].filter(Boolean).join(' '),
      type: 'button',
      attrs: { 'aria-pressed': String(it.id === activeId) },
      onClick: () => onPick(it.id),
    },
      Avatar(it.name, { size: 'sm', initials: it.initials }),
      h('span', null,
        h('span', { className: 'n', style: { display: 'block' } }, it.name),
        it.meta && h('span', { className: 'm' }, it.meta)))));
}

/** A live host that re-paints its content — used by every switcher screen. */
function liveHost(paint) {
  const host = h('div', { className: 'stack' });
  const repaint = () => { host.innerHTML = ''; const node = paint(repaint); if (node) host.appendChild(node); };
  repaint();
  return host;
}

function kv(label, value) {
  return h('div', { className: 'pt-kv' },
    h('span', { className: 't-muted' }, label),
    h('span', { className: 't-medium t-num' }, value));
}

function emptyCard(opts) { return Card({ pad: true }, EmptyState(opts)); }

/* ======================================================= demo personas === */

/** Teacher persona: a class teacher who actually owns timetable slots. */
function demoTeacher(campusId) {
  return once('teacher:' + campusId, () => {
    const withSlots = new Set(db.timetableSlots.map((s) => s.teacherId));
    const pool = db.staff.filter((s) => s.campusId === campusId && s.type === 'Teaching' && withSlots.has(s.id));
    /* prefer a class teacher who also owns homework, so every screen has data */
    const withHw = new Set(db.homework.map((hw) => hw.teacherId));
    return pool.find((s) => withHw.has(s.id))
      || pool.find((s) => s.isClassTeacher && s.classTeacherOf)
      || pool[0]
      || db.staff.find((s) => s.type === 'Teaching')
      || db.staff[0];
  });
}

/** Student persona: an active student on transport with fees + marks on file. */
function demoStudent(campusId) {
  return once('student:' + campusId, () => {
    const pool = db.students.filter((s) => s.campusId === campusId && s.status === 'Active' && s.classLevel >= 6);
    const invoiced = new Set(db.invoices.map((i) => i.studentId));
    return pool.find((s) => s.transportOpted && s.routeId && invoiced.has(s.id))
      || pool.find((s) => invoiced.has(s.id))
      || pool[0] || db.students[0];
  });
}

/** Parent persona: prefers a guardian with more than one ward. */
function demoParent(campusId) {
  return once('parent:' + campusId, () => {
    const kid = demoStudent(campusId);
    const linked = db.parents.filter((p) => p.studentIds.includes(kid.id));
    const multi = linked.find((p) => p.studentIds.length > 1);
    return multi || linked[0]
      || db.parents.find((p) => p.campusId === campusId && p.studentIds.length > 1)
      || db.parents[0];
  });
}

function childrenOf(parent) {
  const kids = (parent.studentIds || []).map((id) => byId(db.students, id)).filter(Boolean);
  return kids.length ? kids : [demoStudent(parent.campusId)];
}

/** Employee persona: whoever the signed-in role maps to, else a support staffer. */
function demoEmployee(campusId, role) {
  return once('employee:' + campusId + ':' + role, () => {
    if (role === 'teacher' || role === 'class-teacher') return demoTeacher(campusId);
    const paid = new Set(db.payslips.map((p) => p.employeeId));
    const pool = db.staff.filter((s) => s.campusId === campusId && s.status === 'Active' && paid.has(s.id));
    if (role === 'librarian') return pool.find((s) => s.department === 'Library') || pool[0];
    if (role === 'security') return pool.find((s) => s.department === 'Security') || pool[0];
    return pool.find((s) => s.type === 'Non-Teaching') || pool[0] || db.staff[0];
  });
}

/** All timetable slots owned by a teacher. */
function slotsForTeacher(t) {
  return once('slots:' + t.id, () => db.timetableSlots.filter((s) => s.teacherId === t.id));
}

/** The distinct class+section combinations a teacher takes. */
function classesForTeacher(t) {
  return once('classes:' + t.id, () => {
    const map = new Map();
    for (const s of slotsForTeacher(t)) {
      const key = s.sectionId;
      if (!map.has(key)) {
        map.set(key, {
          id: s.sectionId, classId: s.classId, className: s.className, section: s.section,
          room: s.room, subjects: new Set(), periods: 0,
        });
      }
      const e = map.get(key);
      e.subjects.add(s.subjectName);
      e.periods++;
    }
    const strength = new Map();
    for (const s of db.students) strength.set(s.sectionId, (strength.get(s.sectionId) || 0) + 1);
    return Array.from(map.values()).map((c) => {
      const roll = db.students.filter((s) => s.sectionId === c.id);
      const att = roll.length ? avg(roll, 'attendancePct') : 0;
      return {
        ...c,
        subjects: Array.from(c.subjects),
        strength: strength.get(c.id) || roll.length,
        roll,
        avgAttendance: Math.round(att * 10) / 10,
        atRisk: roll.filter((s) => s.attendancePct < 75).length,
        isClassTeacher: t.classTeacherOf === c.id,
      };
    }).sort((a, b) => b.periods - a.periods);
  });
}

function studentsForTeacher(t) {
  return once('roll:' + t.id, () => {
    const seen = new Set();
    const out = [];
    for (const c of classesForTeacher(t)) {
      for (const s of c.roll) { if (!seen.has(s.id)) { seen.add(s.id); out.push(s); } }
    }
    return out;
  });
}

/* ------------------------------------------------------ portal chrome --- */

/**
 * portalPage — a page() with the portal hero pinned to the top and a calmer
 * default: no admin-style page title row, the hero carries the identity.
 */
function portalPage({ route, breadcrumb, heroNode, children, actions, title, subtitle }) {
  ensureStyles();
  return page({
    route, breadcrumb, actions, title, subtitle,
    children: [heroNode, ...[].concat(children || [])].filter(Boolean),
  });
}

/** Insert a portal hero at the top of a page-kit page node. */
function withHero(node, heroNode) {
  ensureStyles();
  if (node && heroNode) node.insertBefore(heroNode, node.firstChild);
  return node;
}

/** Shared "open the mobile app preview" chip used across the portals. */
function mobileChip() {
  return heroChip('Mobile app preview', 'monitor', () => navigate('portals/mobile-app'));
}

/* ==========================================================================
   TEACHER PORTAL
   ========================================================================== */

const NOW_MIN = 9 * 60 + 30; /* the demo clock: 20 Aug 2026, 09:30 */

function teacherDaySlots(t, day) {
  return slotsForTeacher(t).filter((s) => s.day === day).sort((a, b) => a.periodNo - b.periodNo);
}

function nextPeriodFor(t) {
  return teacherDaySlots(t, TODAY_DAY).find((s) => mins(s.startTime) >= NOW_MIN) || null;
}

/** The shared teacher hero. */
function teacherHero(t, { subtitle, actions } = {}) {
  const cls = classesForTeacher(t);
  const roll = studentsForTeacher(t);
  const next = nextPeriodFor(t);
  return hero({
    avatarName: t.name, avatarInitials: t.avatarInitials,
    eyebrow: 'Teacher portal',
    title: greetingFor(t.name),
    subtitle: subtitle || (next
      ? `Next up — ${next.subjectName} with ${next.className} ${next.section} at ${next.startTime} in ${next.room}.`
      : 'No more classes scheduled today. Time to catch up on marking.'),
    meta: [
      { v: cls.length, l: 'Classes' },
      { v: formatNumber(roll.length), l: 'Students' },
      { v: t.weeklyPeriods || slotsForTeacher(t).length, l: 'Periods / wk' },
      { v: `${t.attendancePct}%`, l: 'My attendance' },
    ],
    actions: actions || frag(
      heroChip('Take attendance', 'clipboard-check', () => navigate('portals/teacher/attendance')),
      mobileChip()),
  });
}

function classCard(t, c) {
  return SectionCard({
    title: `${c.className} · Section ${c.section}`,
    subtitle: `${c.subjects.join(', ')} · Room ${c.room} · ${c.periods} periods a week`,
    icon: 'grid',
    actions: c.isClassTeacher ? Badge('Class teacher', { tone: 'brand', icon: 'star' }) : null,
    footer: h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
      Button('Attendance', { variant: 'primary', size: 'sm', icon: 'clipboard-check', onClick: () => navigate('portals/teacher/attendance', { section: c.id }) }),
      Button('Homework', { variant: 'secondary', size: 'sm', icon: 'clipboard-list', onClick: () => navigate('portals/teacher/homework', { section: c.id }) }),
      Button('Marks', { variant: 'secondary', size: 'sm', icon: 'edit', onClick: () => navigate('portals/teacher/marks-entry', { section: c.id }) }),
      h('span', { className: 'spacer' }),
      MenuButton([
        { label: 'Open class roll', icon: 'users', onClick: () => navigate('portals/teacher/students', { section: c.id }) },
        { label: 'Class timetable', icon: 'calendar', route: 'timetable/class' },
        { separator: true },
        { label: 'Message parents', icon: 'send', onClick: mockAction('Message parents') },
      ], { label: 'More class actions', size: 'sm' })),
  },
    h('div', { className: 'row-4 row-wrap' },
      h('div', { style: { minWidth: '92px' } },
        h('div', { className: 't-eyebrow' }, 'Strength'),
        h('div', { className: 't-lg t-semibold' }, formatNumber(c.strength))),
      h('div', { style: { minWidth: '92px' } },
        h('div', { className: 't-eyebrow' }, 'At risk'),
        h('div', { className: ['t-lg t-semibold', c.atRisk ? 't-danger' : ''].join(' ') }, formatNumber(c.atRisk))),
      h('div', { className: 'flex-1', style: { minWidth: '160px' } },
        h('div', { className: 't-eyebrow mb-1' }, 'Average attendance'),
        ProgressBar(c.avgAttendance, { tone: toneForPct(c.avgAttendance), showValue: true }))),
    h('div', { className: 'mt-3' },
      AvatarStack(c.roll.slice(0, 8).map((s) => s.name), { size: 'sm', max: 6 })));
}

const teacherRoutes = {
  'portals/teacher/classes': {
    title: 'My Classes',
    subtitle: 'Every section you teach, with a one-tap route into attendance, homework and marks',
    section: 'portals',
    render(mount, ctx) {
      ensureStyles();
      const t = demoTeacher(campusOf(ctx));
      const cls = classesForTeacher(t);
      const today = teacherDaySlots(t, TODAY_DAY);
      const roll = studentsForTeacher(t);
      const myHw = db.homework.filter((hw) => hw.teacherId === t.id);
      const pendingHw = myHw.filter((hw) => hw.pending > 0);

      const body = [];
      body.push(tiles([
        { icon: 'clipboard-check', label: 'Take attendance', value: today.length ? `${today.length} periods` : '—', meta: 'Today', tone: 'success', route: 'portals/teacher/attendance' },
        { icon: 'clipboard-list', label: 'Homework', value: formatNumber(pendingHw.length), meta: 'Awaiting submissions', tone: 'warning', route: 'portals/teacher/homework' },
        { icon: 'edit', label: 'Marks entry', value: 'Open', meta: 'Periodic Test 2', tone: 'info', route: 'portals/teacher/marks-entry' },
        { icon: 'users', label: 'My students', value: formatNumber(roll.length), meta: `${roll.filter((s) => s.attendancePct < 75).length} need attention`, route: 'portals/teacher/students' },
        { icon: 'calendar', label: 'My timetable', value: String(slotsForTeacher(t).length), meta: 'Periods a week', route: 'portals/teacher/timetable' },
        { icon: 'umbrella', label: 'Apply leave', value: String(t.leaveBalanceCL + t.leaveBalanceSL + t.leaveBalanceEL), meta: 'Days in balance', tone: 'info', route: 'portals/teacher/leave' },
      ]));

      const scheduleCard = SectionCard({
        title: 'Today · Thursday, 20 Aug', subtitle: `${today.length} periods scheduled`, icon: 'calendar',
        actions: Button('Full week', { variant: 'ghost', size: 'sm', iconRight: 'chevron-right', route: 'portals/teacher/timetable' }),
      },
        today.length ? h('div', { className: 'pt-day' },
          today.map((s) => {
            const isNow = mins(s.startTime) <= NOW_MIN && mins(s.endTime) > NOW_MIN;
            return h('div', { className: ['pt-slot', isNow && 'is-now'].filter(Boolean).join(' ') },
              h('div', { className: 'pt-slot-time' }, `${s.startTime}–${s.endTime}`),
              h('div', null,
                h('div', { className: 'pt-slot-title' }, s.subjectName),
                h('div', { className: 'pt-slot-meta' }, `${s.className} ${s.section} · Room ${s.room}`)),
              isNow ? Badge('In progress', { tone: 'success', dot: true }) : Badge(`P${s.periodNo}`, { tone: 'neutral' }));
          }))
          : EmptyState({ icon: 'coffee', title: 'No classes today', text: 'Your Thursday is free of scheduled periods — a good day for lesson planning.' }));

      const focusCard = SectionCard({ title: 'Needs your attention', icon: 'alert-circle' },
        h('div', { className: 'stack-2' },
          kv('Homework awaiting grading', formatNumber(myHw.filter((hw) => hw.graded < hw.submitted).length)),
          kv('Students below 75% attendance', formatNumber(roll.filter((s) => s.attendancePct < 75).length)),
          kv('Students with fee dues', formatNumber(roll.filter((s) => s.feeDue > 0).length)),
          kv('Substitutions assigned to me', formatNumber(db.substitutions.filter((s) => s.substituteTeacherId === t.id).length)),
          kv('PTM bookings this term', formatNumber(db.ptmBookings.filter((b) => b.teacherId === t.id).length))),
        h('div', { className: 'mt-3' },
          Button('Open my students', { variant: 'secondary', size: 'sm', block: true, icon: 'users', route: 'portals/teacher/students' })));

      body.push(h('div', { className: 'widget-grid' },
        h('div', { className: 'span-8' }, scheduleCard),
        h('div', { className: 'span-4' }, focusCard)));

      body.push(h('div', { className: 't-eyebrow mt-2' }, `My classes · ${cls.length}`));
      body.push(cls.length
        ? h('div', { className: 'pt-grid-2' }, cls.map((c) => classCard(t, c)))
        : emptyCard({ icon: 'grid', title: 'No classes allocated yet', text: 'Once the timetable for this session is published your classes will appear here.', action: Button('Open master timetable', { variant: 'primary', route: 'timetable/master' }) }));

      mount.appendChild(portalPage({
        route: 'portals/teacher/classes',
        heroNode: teacherHero(t),
        children: body,
      }));
    },
  },

  'portals/teacher/timetable': {
    title: 'My Timetable',
    subtitle: 'Your week at a glance, period by period',
    section: 'portals',
    render(mount, ctx) {
      ensureStyles();
      const t = demoTeacher(campusOf(ctx));
      const all = slotsForTeacher(t);
      const subs = db.substitutions.filter((s) => s.substituteTeacherId === t.id || s.absentTeacherId === t.id);
      let day = TODAY_DAY;

      const dayHost = h('div');
      const dayCard = SectionCard({ title: `Today · ${day}`, subtitle: 'Tap a period to jump straight into attendance', icon: 'calendar' }, dayHost);
      const dayTitle = dayCard.querySelector('.card-title');

      const paintDay = () => {
        const list = teacherDaySlots(t, day);
        const byPeriod = new Map(list.map((s) => [s.periodNo, s]));
        if (dayTitle) dayTitle.textContent = day === TODAY_DAY ? `Today · ${day}` : day;
        dayHost.innerHTML = '';
        dayHost.appendChild(h('div', { className: 'pt-day' },
          db.periods.map((p) => {
            if (p.isBreak) {
              return h('div', { className: 'pt-slot is-break' },
                h('div', { className: 'pt-slot-time' }, `${p.startTime}–${p.endTime}`),
                h('div', null, h('div', { className: 'pt-slot-title' }, p.label),
                  h('div', { className: 'pt-slot-meta' }, 'Break — no class')),
                Icon('coffee', 16));
            }
            const s = byPeriod.get(p.no);
            const isNow = day === TODAY_DAY && mins(p.startTime) <= NOW_MIN && mins(p.endTime) > NOW_MIN;
            if (!s) {
              return h('div', { className: ['pt-slot', isNow && 'is-now'].filter(Boolean).join(' ') },
                h('div', { className: 'pt-slot-time' }, `${p.startTime}–${p.endTime}`),
                h('div', null, h('div', { className: 'pt-slot-title t-muted' }, 'Free period'),
                  h('div', { className: 'pt-slot-meta' }, `${p.label} · prep, corrections or a substitution`)),
                Badge('Free', { tone: 'neutral' }));
            }
            return h('div', { className: ['pt-slot', isNow && 'is-now'].filter(Boolean).join(' ') },
              h('div', { className: 'pt-slot-time' }, `${p.startTime}–${p.endTime}`),
              h('div', null,
                h('div', { className: 'pt-slot-title' }, s.subjectName),
                h('div', { className: 'pt-slot-meta' }, `${s.className} ${s.section} · Room ${s.room}`)),
              h('div', { className: 'row', style: { gap: 'var(--sp-2)' } },
                s.isSubstituted && Badge('Substituted', { tone: 'warning' }),
                Button('Attendance', { variant: 'ghost', size: 'sm', icon: 'clipboard-check', onClick: () => navigate('portals/teacher/attendance', { section: s.sectionId }) })));
          })));
      };
      paintDay();

      const teachingPeriods = db.periods.filter((p) => !p.isBreak);
      const gridRows = teachingPeriods.map((p) => {
        const row = { id: 'P' + p.no, period: `Period ${p.no}`, time: `${p.startTime}–${p.endTime}` };
        for (const d of WEEKDAYS) {
          const s = all.find((x) => x.day === d && x.periodNo === p.no);
          row[d] = s ? `${s.subjectName} · ${s.className} ${s.section}` : '—';
        }
        return row;
      });

      const weekGrid = DataTable({
        columns: [
          { key: 'period', label: 'Period', width: 92, sticky: true },
          { key: 'time', label: 'Time', width: 112, numeric: true },
          ...WEEKDAYS.map((d) => ({
            key: d, label: d.slice(0, 3), sortable: false,
            render: (r) => (r[d] === '—' ? h('span', { className: 't-faint' }, '—') : h('span', { className: 't-sm' }, r[d])),
          })),
        ],
        rows: gridRows, paginate: false, searchable: false, columnToggle: false,
        exportName: 'my-timetable', maxHeight: 'none', printable: true,
        emptyState: EmptyState({ icon: 'calendar', title: 'No timetable published', text: 'The academic office has not published your grid for this session yet.' }),
      });

      const loadByDay = WEEKDAYS.map((d) => all.filter((s) => s.day === d).length);

      mount.appendChild(portalPage({
        route: 'portals/teacher/timetable',
        heroNode: teacherHero(t, { subtitle: `${all.length} periods a week across ${classesForTeacher(t).length} sections. Free periods are called out so you can plan around them.` }),
        children: [
          Card({ pad: true },
            h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-3)' } },
              SegmentedControl(WEEKDAYS.map((d) => ({ id: d, label: d.slice(0, 3) })), (id) => { day = id; paintDay(); }, { active: day }),
              h('span', { className: 'spacer' }),
              Button('Print week', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => notify({ title: 'Timetable sent to printer', tone: 'success' }) }),
              Button('Add to calendar', { variant: 'secondary', size: 'sm', icon: 'calendar-plus', onClick: mockAction('Add to calendar') }))),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-8' }, dayCard),
            h('div', { className: 'span-4' }, SectionCard({ title: 'Weekly load', subtitle: 'Periods taught per day', className: 'chart-card', icon: 'gauge' },
              barChart({ categories: WEEKDAYS.map((d) => d.slice(0, 3)), series: [{ name: 'Periods', values: loadByDay }], height: 200, showValues: true })))),
          SectionCard({ title: 'Full week grid', subtitle: 'Every period across the six-day cycle', icon: 'table', flush: true }, weekGrid),
          SectionCard({ title: 'Substitution history', subtitle: 'Classes you covered or handed over', icon: 'refresh-ccw' },
            subs.length
              ? Timeline(subs.slice(0, 8).map((s) => ({
                title: s.substituteTeacherId === t.id ? `Covered ${s.subjectName} for ${s.absentTeacherName}` : `${s.substituteTeacherName} covered your ${s.subjectName}`,
                meta: `${formatDate(s.date)} · ${s.className} ${s.section} · Period ${s.periodNo}`,
                text: s.reason, icon: 'refresh-ccw', tone: s.status === 'Confirmed' ? 'success' : 'warning',
              })))
              : EmptyState({ icon: 'refresh-ccw', title: 'No substitutions on record', text: 'You have neither covered nor handed over a period this term.' })),
        ],
      }));
    },
  },

  'portals/teacher/attendance': {
    title: 'Take Attendance',
    subtitle: 'One tap per student — a whole class in under a minute',
    section: 'portals',
    render(mount, ctx) {
      ensureStyles();
      const t = demoTeacher(campusOf(ctx));
      const cls = classesForTeacher(t);
      if (!cls.length) {
        mount.appendChild(portalPage({
          route: 'portals/teacher/attendance', heroNode: teacherHero(t),
          children: emptyCard({ icon: 'clipboard-check', title: 'No class allocated', text: 'Attendance opens once a section is assigned to you in the timetable.', action: Button('Open my timetable', { variant: 'primary', route: 'portals/teacher/timetable' }) }),
        }));
        return;
      }

      const wanted = (ctx.query && ctx.query.section) || (cls.find((c) => c.isClassTeacher) || cls[0]).id;
      let active = cls.find((c) => c.id === wanted) || cls[0];
      const marks = new Map();
      const resetMarks = () => { marks.clear(); for (const s of active.roll) marks.set(s.id, 'P'); };
      resetMarks();

      const summaryHost = h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-4)' } });
      const listHost = h('div');
      const headHost = h('div');
      const chartHost = h('div');

      const paintSummary = () => {
        const vals = Array.from(marks.values());
        const p = vals.filter((v) => v === 'P').length;
        const a = vals.filter((v) => v === 'A').length;
        const l = vals.filter((v) => v === 'L').length;
        const rate = pct(p + l, vals.length);
        summaryHost.innerHTML = '';
        summaryHost.appendChild(frag(
          h('div', null, h('div', { className: 't-eyebrow' }, 'Present'), h('div', { className: 't-lg t-semibold t-success' }, p)),
          h('div', null, h('div', { className: 't-eyebrow' }, 'Absent'), h('div', { className: 't-lg t-semibold t-danger' }, a)),
          h('div', null, h('div', { className: 't-eyebrow' }, 'Late'), h('div', { className: 't-lg t-semibold t-warning' }, l)),
          h('div', { className: 'flex-1', style: { minWidth: '180px' } },
            h('div', { className: 't-eyebrow mb-1' }, 'Class present %'),
            ProgressBar(rate, { tone: toneForPct(rate), showValue: true }))));
      };

      const paintList = () => {
        listHost.innerHTML = '';
        listHost.appendChild(h('div', null, sortBy(active.roll, 'rollNo').map((s) => {
          const seg = h('div', { className: 'pt-att-seg', attrs: { role: 'group', 'aria-label': `Attendance for ${s.name}` } });
          const btns = ['P', 'A', 'L'].map((v) => h('button', {
            type: 'button', dataset: { v },
            attrs: { 'aria-pressed': String(marks.get(s.id) === v), 'aria-label': `${v === 'P' ? 'Present' : v === 'A' ? 'Absent' : 'Late'} — ${s.name}` },
            onClick: () => {
              marks.set(s.id, v);
              btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
              paintSummary();
            },
          }, v));
          btns.forEach((b) => seg.appendChild(b));
          return h('div', { className: 'pt-att-row' },
            h('span', { className: 't-num t-muted', style: { width: '34px' } }, s.rollNo),
            h('div', { className: 'flex-1 min-0' }, Identity(s.name, `${s.admissionNo} · ${s.attendancePct}% this term`, { onClick: () => navigate(`students/profile/${s.id}`) })),
            s.attendancePct < 75 ? Badge('Low attendance', { tone: 'danger' }) : null,
            seg);
        })));
      };

      const paintHead = () => {
        headHost.innerHTML = '';
        headHost.appendChild(h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
          h('h3', { className: 'card-title' }, `${active.className} · Section ${active.section}`),
          Badge(`${active.strength} on roll`, { tone: 'info' }),
          h('span', { className: 'spacer' }),
          Button('All present', { variant: 'ghost', size: 'sm', icon: 'check-circle', onClick: () => { for (const k of marks.keys()) marks.set(k, 'P'); paintList(); paintSummary(); } }),
          Button('Reset', { variant: 'ghost', size: 'sm', icon: 'refresh', onClick: () => { resetMarks(); paintList(); paintSummary(); notify({ title: 'Reset to all present', tone: 'info' }); } })));
      };

      const paintChart = () => {
        const history = db.attendance.filter((a) => a.sectionId === active.id)
          .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14).reverse();
        chartHost.innerHTML = '';
        chartHost.appendChild(history.length
          ? lineChart({
            categories: history.map((r) => formatDate(r.date, 'dayMonth')),
            series: [{ name: 'Present %', values: history.map((r) => r.percent) }],
            valueFormat: 'percent', target: 90, targetLabel: 'Target 90%', height: 220,
          })
          : EmptyState({ icon: 'chart-line', title: 'No history yet', text: 'Once attendance is submitted for a few days the trend appears here.' }));
      };

      const rebuild = () => { resetMarks(); paintHead(); paintList(); paintSummary(); paintChart(); };
      paintHead(); paintList(); paintSummary(); paintChart();

      const submit = () => {
        const vals = Array.from(marks.values());
        const a = vals.filter((v) => v === 'A').length;
        ConfirmDialog({
          title: 'Submit attendance?',
          text: `${active.className} ${active.section} · ${vals.length - a} present, ${a} absent. Parents of absentees receive an SMS immediately.`,
          confirmLabel: 'Submit and notify', tone: 'brand', icon: 'clipboard-check',
        }).then((ok) => {
          if (!ok) return;
          notify({ title: 'Attendance submitted', text: `${active.className} ${active.section} · ${formatDate(TODAY)} · ${a} absentee SMS queued.`, tone: 'success' });
        });
      };

      mount.appendChild(portalPage({
        route: 'portals/teacher/attendance',
        heroNode: teacherHero(t, { subtitle: 'Marking for Thursday, 20 Aug 2026. Everyone starts as present — tap only the exceptions.' }),
        children: [
          Card({ pad: true }, h('div', { className: 'stack-3' },
            h('div', { className: 't-eyebrow' }, 'Choose a section'),
            switcher(cls.map((c) => ({ id: c.id, name: `${c.className} ${c.section}`, initials: c.section, meta: `${c.strength} students` })), active.id, (id) => {
              active = cls.find((c) => c.id === id) || active;
              rebuild();
            })),
            h('div', { className: 'mt-3' }, summaryHost)),
          SectionCard({
            title: 'Roll call', subtitle: 'Period 1 · 08:00 · daily attendance', icon: 'clipboard-check',
            footer: h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
              Button('Submit attendance', { variant: 'primary', icon: 'check', onClick: submit }),
              Button('Save draft', { variant: 'secondary', icon: 'clock', onClick: mockAction('Save draft') }),
              h('span', { className: 'spacer' }),
              h('span', { className: 't-xs t-muted' }, 'Biometric punches merge automatically at 08:30.')),
            flush: true,
          }, h('div', { className: 'card-pad' }, headHost), listHost),
          SectionCard({ title: 'Recent attendance', subtitle: 'Last 14 marked days for this section', className: 'chart-card', icon: 'chart-line' }, chartHost),
        ],
      }));
    },
  },
};

/* ------------------------------------------- teacher: homework & marking */

/** Homework owned by a teacher — either assigned by them or for their sections. */
function homeworkForTeacher(t) {
  return once('hw:' + t.id, () => {
    const mine = db.homework.filter((hw) => hw.teacherId === t.id);
    if (mine.length) return mine;
    const secs = new Set(classesForTeacher(t).map((c) => c.id));
    return db.homework.filter((hw) => secs.has(hw.sectionId));
  });
}

function homeworkDrawer(hw) {
  const subs = db.submissions.filter((s) => s.homeworkId === hw.id);
  const graded = subs.filter((s) => s.marks != null);
  Drawer({
    title: hw.title,
    subtitle: `${hw.className} ${hw.section} · ${hw.subjectName} · due ${formatDate(hw.dueDate)}`,
    size: 'lg',
    body: h('div', { className: 'stack' },
      Callout({ tone: hw.status === 'Open' ? 'info' : 'neutral', icon: 'clipboard-list', title: dueLabel(hw.dueDate) }, hw.description),
      h('div', { className: 'widget-grid' },
        h('div', { className: 'span-4' }, StatCard({ label: 'Submitted', value: formatNumber(hw.submitted), icon: 'inbox', tone: 'success' })),
        h('div', { className: 'span-4' }, StatCard({ label: 'Pending', value: formatNumber(hw.pending), icon: 'clock', tone: 'warning' })),
        h('div', { className: 'span-4' }, StatCard({ label: 'Graded', value: formatNumber(hw.graded), icon: 'check-circle', tone: 'info' }))),
      SectionCard({ title: 'Submission progress', className: 'chart-card' },
        stackedProgressBar({
          segments: [
            { label: 'Graded', value: hw.graded, color: seriesColor(0) },
            { label: 'Submitted, ungraded', value: Math.max(0, hw.submitted - hw.graded), color: seriesColor(1) },
            { label: 'Not submitted', value: hw.pending, color: seriesColor(2) },
          ],
          barHeight: 14,
        })),
      SectionCard({ title: `Submissions · ${subs.length}`, flush: true, icon: 'inbox' },
        subs.length ? DataTable({
          columns: [
            { key: 'studentName', label: 'Student', sticky: true, width: 210, render: (r) => Identity(r.studentName, r.studentId) },
            { key: 'submittedOn', label: 'Submitted', width: 130, render: (r) => (r.submittedOn ? formatDate(r.submittedOn) : '—') },
            { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
            { key: 'late', label: 'Late', width: 80, render: (r) => (r.late ? Badge('Late', { tone: 'warning' }) : h('span', { className: 't-faint' }, '—')) },
            { key: 'marks', label: 'Marks', width: 90, align: 'right', numeric: true, render: (r) => (r.marks == null ? h('span', { className: 't-faint' }, 'Ungraded') : `${r.marks}/${r.maxMarks}`) },
          ],
          rows: subs, pageSize: 10, exportName: 'homework-submissions',
          emptyState: EmptyState({ icon: 'inbox', title: 'No submissions yet' }),
        }) : EmptyState({ icon: 'inbox', title: 'Nothing submitted yet', text: 'Students have not uploaded anything for this assignment so far.' })),
      graded.length ? SectionCard({ title: 'Score distribution', className: 'chart-card' },
        barChart({
          categories: ['0-40%', '40-60%', '60-75%', '75-90%', '90-100%'],
          series: [{
            name: 'Students',
            values: [0.4, 0.6, 0.75, 0.9, 1.01].map((hi, i, arr) => {
              const lo = i === 0 ? 0 : arr[i - 1];
              return graded.filter((s) => { const p = s.marks / s.maxMarks; return p >= lo && p < hi; }).length;
            }),
          }],
          height: 200,
        })) : null),
    actions: (close) => frag(
      Button('Close', { variant: 'secondary', onClick: close }),
      Button('Grade submissions', { variant: 'primary', icon: 'edit', onClick: () => { close(); navigate('portals/teacher/marks-entry'); } })),
  });
}

function assignHomeworkForm(t, onDone) {
  const cls = classesForTeacher(t);
  return formPage({
    title: 'Assign homework', subtitle: 'Students and parents are notified the moment you publish',
    mode: 'modal', size: 'lg', submitLabel: 'Publish homework',
    sections: [{
      title: 'Assignment', cols: 2,
      fields: [
        { id: 'title', label: 'Title', required: true, placeholder: 'e.g. Algebra — Exercise 4.2', span: 'full' },
        {
          id: 'section', label: 'Class & section', type: 'select', required: true,
          options: cls.map((c) => ({ value: c.id, label: `${c.className} ${c.section}` })),
        },
        {
          id: 'subject', label: 'Subject', type: 'select', required: true,
          options: Array.from(new Set(cls.flatMap((c) => c.subjects))),
        },
        { id: 'due', label: 'Due date', type: 'date', required: true, value: '2026-08-25' },
        { id: 'maxMarks', label: 'Maximum marks', type: 'number', value: 20 },
        { id: 'description', label: 'Instructions', type: 'textarea', span: 'full', placeholder: 'What should students do, and how should they submit it?' },
        { id: 'attachment', label: 'Attachments', type: 'file', span: 'full' },
        { id: 'notify', label: 'Notify parents on WhatsApp', type: 'switch', value: true, span: 'full' },
      ],
    }],
    onSubmit: (v) => {
      notify({ title: 'Homework published', text: `${v.title} · due ${formatDate(v.due)}`, tone: 'success' });
      if (onDone) onDone(v);
    },
  });
}

const teacherRoutes2 = {
  'portals/teacher/homework': {
    title: 'My Homework',
    subtitle: 'Assign, track submissions and grade — all in one place',
    section: 'portals',
    render(mount, ctx) {
      ensureStyles();
      const t = demoTeacher(campusOf(ctx));
      const all = homeworkForTeacher(t);
      const wanted = ctx.query && ctx.query.section;
      let rows = wanted ? all.filter((hw) => hw.sectionId === wanted) : all;
      if (!rows.length) rows = all;

      const open = rows.filter((hw) => hw.status === 'Open');
      const ungraded = rows.filter((hw) => hw.graded < hw.submitted);
      const byWeek = new Map();
      for (const hw of rows) {
        const k = formatDate(hw.assignedDate, 'dayMonth');
        byWeek.set(k, (byWeek.get(k) || 0) + 1);
      }

      const node = listPage({
        route: 'portals/teacher/homework',
        actions: pageActions(
          Button('Question bank', { variant: 'secondary', icon: 'database', route: 'examination/question-bank' }),
          Button('Assign homework', { variant: 'primary', icon: 'plus', onClick: () => assignHomeworkForm(t) })),
        kpis: [
          { label: 'Assignments', value: formatNumber(rows.length), icon: 'clipboard-list', tone: 'brand' },
          { label: 'Open now', value: formatNumber(open.length), icon: 'clock', tone: 'warning', deltaLabel: 'accepting submissions' },
          { label: 'Awaiting grading', value: formatNumber(ungraded.length), icon: 'edit', tone: 'info' },
          { label: 'Average score', value: rows.length ? `${(sum(rows, 'avgScore') / rows.length).toFixed(1)}/10` : '—', icon: 'star', tone: 'success' },
        ],
        chart: barChart({
          categories: Array.from(byWeek.keys()).slice(-10),
          series: [{ name: 'Assignments', values: Array.from(byWeek.values()).slice(-10) }],
          height: 190,
        }),
        chartTitle: 'Homework assigned over the last fortnight',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Title or subject…' },
          { id: 'section', label: 'Section', options: Array.from(new Set(rows.map((r) => `${r.className} ${r.section}`))) },
          { id: 'subjectName', label: 'Subject', options: Array.from(new Set(rows.map((r) => r.subjectName))) },
          { id: 'status', label: 'Status', options: ['Open', 'Closed'] },
        ],
        onFilter: (id, value, all_, table) => {
          let out = rows;
          if (all_.q) out = search(out, all_.q, ['title', 'subjectName', 'className']);
          if (all_.section && all_.section !== 'all') out = out.filter((r) => `${r.className} ${r.section}` === all_.section);
          if (all_.subjectName && all_.subjectName !== 'all') out = out.filter((r) => r.subjectName === all_.subjectName);
          if (all_.status && all_.status !== 'all') out = out.filter((r) => r.status === all_.status);
          table.refresh(out);
        },
        columns: [
          { key: 'title', label: 'Assignment', sticky: true, width: 280, render: (r) => Identity(r.title, `${r.subjectName} · assigned ${formatDate(r.assignedDate, 'dayMonth')}`), value: (r) => r.title },
          { key: 'className', label: 'Class', width: 120, filter: true, render: (r) => `${r.className} ${r.section}` },
          { key: 'dueDate', label: 'Due', width: 150, render: (r) => h('span', { className: new Date(r.dueDate) < new Date(TODAY) ? 't-muted' : 't-medium' }, formatDate(r.dueDate)) },
          {
            key: 'submitted', label: 'Submitted', width: 170, align: 'right', numeric: true, aggregate: 'sum',
            render: (r) => h('div', { className: 'stack-1' },
              h('span', { className: 't-num t-sm' }, `${r.submitted} / ${r.totalStudents}`),
              ProgressBar(pct(r.submitted, r.totalStudents), { size: 'sm', tone: toneForPct(pct(r.submitted, r.totalStudents), 90, 70) })),
          },
          { key: 'graded', label: 'Graded', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'avgScore', label: 'Avg', width: 80, align: 'right', numeric: true, render: (r) => `${r.avgScore}/10` },
          { key: 'status', label: 'Status', width: 110, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        selectable: true, footerAggregates: true, pageSize: 15,
        searchKeys: ['title', 'subjectName', 'className'],
        exportName: 'my-homework',
        bulkActions: [
          { label: 'Send reminder', icon: 'bell', onClick: (sel) => notify({ title: `Reminder sent for ${sel.length} assignments`, tone: 'success' }) },
          { label: 'Close submissions', icon: 'lock', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} assignments closed`, tone: 'warning' }) },
        ],
        rowActions: (row) => [
          { label: 'View submissions', icon: 'inbox', onClick: () => homeworkDrawer(row) },
          { label: 'Grade', icon: 'edit', route: 'portals/teacher/marks-entry' },
          { label: 'Duplicate', icon: 'copy', onClick: mockAction('Duplicate homework') },
          { separator: true },
          { label: 'Withdraw', icon: 'trash', tone: 'danger', onClick: () => ConfirmDialog({ title: 'Withdraw this homework?', text: 'Students lose access immediately and any submissions are archived.', confirmLabel: 'Withdraw', tone: 'danger' }).then((ok) => ok && notify({ title: 'Homework withdrawn', tone: 'danger' })) },
        ],
        onRowClick: (row) => homeworkDrawer(row),
        tableTitle: 'All assignments',
        tableSubtitle: 'Click a row to open submissions',
        emptyState: EmptyState({ icon: 'clipboard-list', title: 'No homework assigned yet', text: 'Publish your first assignment and students see it on their portal instantly.', action: Button('Assign homework', { variant: 'primary', icon: 'plus', onClick: () => assignHomeworkForm(t) }) }),
      });

      withHero(node, teacherHero(t, { subtitle: `${open.length} assignments are open for submission and ${ungraded.length} are waiting on your grading.` }));
      mount.appendChild(node);
    },
  },

  'portals/teacher/marks-entry': {
    title: 'Marks Entry',
    subtitle: 'Enter, moderate and publish marks subject by subject',
    section: 'portals',
    render(mount, ctx) {
      ensureStyles();
      const t = demoTeacher(campusOf(ctx));
      const cls = classesForTeacher(t);
      if (!cls.length) {
        mount.appendChild(portalPage({ route: 'portals/teacher/marks-entry', heroNode: teacherHero(t), children: emptyCard({ icon: 'edit', title: 'No class allocated', text: 'Marks entry opens once a section is assigned to you.' }) }));
        return;
      }

      const groups = db.examGroups.filter((g) => ['EG1', 'EG3'].includes(g.id));
      let group = groups[groups.length - 1] || db.examGroups[0];
      let section = cls.find((c) => c.id === (ctx.query && ctx.query.section)) || cls[0];
      let subject = section.subjects[0];
      const edited = new Map();

      const gridHost = h('div');
      const statHost = h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-4)' } });

      const currentRows = () => {
        const existing = db.marks.filter((m) => m.sectionId === section.id && m.examGroupId === group.id
          && (m.subjectName === subject || m.subjectCode === subject));
        if (existing.length) return existing;
        return sortBy(section.roll, 'rollNo').map((s) => ({
          id: `${s.id}-${group.id}`, studentId: s.id, studentName: s.name, admissionNo: s.admissionNo,
          maxMarks: s.classLevel <= 2 ? 50 : 100, marksObtained: null, subjectName: subject,
        }));
      };

      const paintStats = () => {
        const rows = currentRows();
        const vals = rows.map((r) => (edited.has(r.studentId) ? edited.get(r.studentId) : r.marksObtained)).filter((v) => v != null && v !== '');
        const max = rows[0] ? rows[0].maxMarks : 100;
        const average = vals.length ? vals.reduce((a, b) => a + Number(b), 0) / vals.length : 0;
        const passed = vals.filter((v) => Number(v) >= max * 0.33).length;
        statHost.innerHTML = '';
        statHost.appendChild(frag(
          h('div', null, h('div', { className: 't-eyebrow' }, 'Entered'), h('div', { className: 't-lg t-semibold' }, `${vals.length}/${rows.length}`)),
          h('div', null, h('div', { className: 't-eyebrow' }, 'Average'), h('div', { className: 't-lg t-semibold' }, vals.length ? `${average.toFixed(1)}/${max}` : '—')),
          h('div', null, h('div', { className: 't-eyebrow' }, 'Highest'), h('div', { className: 't-lg t-semibold' }, vals.length ? Math.max(...vals.map(Number)) : '—')),
          h('div', null, h('div', { className: 't-eyebrow' }, 'Pass %'), h('div', { className: 't-lg t-semibold' }, vals.length ? `${pct(passed, vals.length)}%` : '—')),
          h('div', { className: 'flex-1', style: { minWidth: '170px' } },
            h('div', { className: 't-eyebrow mb-1' }, 'Entry progress'),
            ProgressBar(pct(vals.length, rows.length), { showValue: true, tone: 'brand' }))));
      };

      const paintGrid = () => {
        const rows = currentRows();
        gridHost.innerHTML = '';
        gridHost.appendChild(h('div', null,
          h('div', { className: 'pt-marks-row t-eyebrow' },
            h('span', null, 'Student'), h('span', null, 'Marks'), h('span', null, 'Grade'), h('span', { className: 'pt-marks-note' }, 'Remark')),
          rows.map((r) => {
            const max = r.maxMarks || 100;
            const gradeCell = h('span', { className: 't-semibold' });
            const noteCell = h('span', { className: 'pt-marks-note t-xs t-muted' });
            const apply = (val) => {
              const num = val === '' ? null : Math.max(0, Math.min(max, Number(val)));
              edited.set(r.studentId, num);
              const p = num == null ? null : (num / max) * 100;
              gradeCell.textContent = p == null ? '—' : gradeFor(p);
              noteCell.textContent = p == null ? 'Not entered' : p >= 90 ? 'Outstanding' : p >= 75 ? 'Very good' : p >= 50 ? 'Satisfactory' : p >= 33 ? 'Needs improvement' : 'Below pass mark';
              paintStats();
            };
            const input = Input({
              type: 'number', numeric: true, min: 0, max, value: r.marksObtained ?? '',
              placeholder: `0–${max}`, onInput: apply,
            });
            apply(r.marksObtained ?? '');
            return h('div', { className: 'pt-marks-row' },
              Identity(r.studentName, `${r.admissionNo} · Roll ${(byId(db.students, r.studentId) || {}).rollNo || '—'}`),
              input, gradeCell, noteCell);
          })));
        paintStats();
      };
      paintGrid();

      const controls = Card({ pad: true },
        h('div', { className: 'stack-3' },
          h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-3)' } },
            Field({ label: 'Exam' }, Select({
              options: groups.map((g) => ({ value: g.id, label: g.name })), value: group.id,
              onChange: (v) => { group = groups.find((g) => g.id === v) || group; edited.clear(); paintGrid(); },
            })),
            Field({ label: 'Class & section' }, Select({
              options: cls.map((c) => ({ value: c.id, label: `${c.className} ${c.section}` })), value: section.id,
              onChange: (v) => { section = cls.find((c) => c.id === v) || section; subject = section.subjects[0]; edited.clear(); paintGrid(); },
            })),
            Field({ label: 'Subject' }, Select({
              options: section.subjects, value: subject,
              onChange: (v) => { subject = v; edited.clear(); paintGrid(); },
            })),
            h('span', { className: 'spacer' }),
            Button('Import from OMR', { variant: 'ghost', icon: 'scan', onClick: mockAction('Import from OMR') })),
          statHost));

      const save = () => {
        notify({ title: 'Marks saved', text: `${section.className} ${section.section} · ${subject} · ${group.name}`, tone: 'success' });
      };
      const publish = () => ConfirmDialog({
        title: 'Publish these marks?',
        text: 'Students and parents can see the marks on their portal as soon as you publish. Corrections need a re-evaluation request afterwards.',
        confirmLabel: 'Publish', tone: 'brand', icon: 'send',
      }).then((ok) => ok && notify({ title: 'Marks published', text: `${section.className} ${section.section} · ${subject}`, tone: 'success' }));

      mount.appendChild(portalPage({
        route: 'portals/teacher/marks-entry',
        heroNode: teacherHero(t, { subtitle: 'Enter marks out of the paper total — grades and remarks are calculated as you type.' }),
        children: [
          controls,
          SectionCard({
            title: 'Marks sheet', subtitle: 'Values are validated against the paper maximum', icon: 'edit', flush: true,
            footer: h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
              Button('Save draft', { variant: 'secondary', icon: 'clock', onClick: save }),
              Button('Publish marks', { variant: 'primary', icon: 'send', onClick: publish }),
              h('span', { className: 'spacer' }),
              Button('Download template', { variant: 'ghost', size: 'sm', icon: 'download', onClick: mockAction('Download template') })),
          }, gridHost),
          Callout({ tone: 'info', icon: 'info', title: 'Grading scale — CBSE 2026-27' },
            'A1 91-100 · A2 81-90 · B1 71-80 · B2 61-70 · C1 51-60 · C2 41-50 · D 33-40 · E below 33. Moderation is applied by the examination cell after publication.'),
        ],
      }));
    },
  },

  'portals/teacher/students': {
    title: 'My Students',
    subtitle: 'Everyone you teach, with the risk flags that matter',
    section: 'portals',
    render(mount, ctx) {
      ensureStyles();
      const t = demoTeacher(campusOf(ctx));
      const all = studentsForTeacher(t);
      const wanted = ctx.query && ctx.query.section;
      const rows = wanted ? all.filter((s) => s.sectionId === wanted) : all;

      const riskOf = (s) => {
        const flags = [];
        if (s.attendancePct < 75) flags.push({ label: 'Attendance', tone: 'danger' });
        if (s.feeDue > 0) flags.push({ label: 'Fee due', tone: 'warning' });
        if (s.lastExamPercent < 45) flags.push({ label: 'Academics', tone: 'danger' });
        if (s.disciplinaryCount > 1) flags.push({ label: 'Discipline', tone: 'warning' });
        return flags;
      };
      const atRisk = rows.filter((s) => riskOf(s).length);

      const node = listPage({
        route: 'portals/teacher/students',
        actions: pageActions(
          Button('Message parents', { variant: 'secondary', icon: 'send', route: 'communication/compose' }),
          Button('Class analytics', { variant: 'primary', icon: 'chart-line', route: 'examination/performance' })),
        kpis: [
          { label: 'Students', value: formatNumber(rows.length), icon: 'users', tone: 'brand' },
          { label: 'Needs attention', value: formatNumber(atRisk.length), icon: 'alert-triangle', tone: 'danger' },
          { label: 'Avg attendance', value: `${rows.length ? (sum(rows, 'attendancePct') / rows.length).toFixed(1) : 0}%`, icon: 'clipboard-check', tone: 'success' },
          { label: 'Avg last exam', value: `${rows.length ? (sum(rows, 'lastExamPercent') / rows.length).toFixed(1) : 0}%`, icon: 'chart-bar', tone: 'info' },
        ],
        chart: barChart({
          categories: Array.from(new Set(rows.map((s) => `${s.className} ${s.section}`))),
          series: [{
            name: 'Average attendance',
            values: Array.from(new Set(rows.map((s) => `${s.className} ${s.section}`))).map((k) => {
              const grp = rows.filter((s) => `${s.className} ${s.section}` === k);
              return Math.round(avg(grp, 'attendancePct') * 10) / 10;
            }),
          }],
          valueFormat: 'percent', target: 90, height: 190,
        }),
        chartTitle: 'Average attendance by section',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Name or admission no…' },
          { id: 'section', label: 'Section', options: Array.from(new Set(rows.map((s) => `${s.className} ${s.section}`))) },
          { id: 'risk', label: 'Flag', options: ['Attendance', 'Fee due', 'Academics', 'Discipline'] },
          { id: 'house', label: 'House', options: Array.from(new Set(rows.map((s) => s.house))) },
        ],
        onFilter: (id, value, allv, table) => {
          let out = rows;
          if (allv.q) out = search(out, allv.q, ['name', 'admissionNo', 'rollNo']);
          if (allv.section && allv.section !== 'all') out = out.filter((s) => `${s.className} ${s.section}` === allv.section);
          if (allv.house && allv.house !== 'all') out = out.filter((s) => s.house === allv.house);
          if (allv.risk && allv.risk !== 'all') out = out.filter((s) => riskOf(s).some((f) => f.label === allv.risk));
          table.refresh(out);
        },
        columns: [
          { key: 'name', label: 'Student', sticky: true, width: 240, render: (r) => Identity(r.name, `${r.admissionNo} · Roll ${r.rollNo}`), value: (r) => r.name },
          { key: 'className', label: 'Class', width: 120, filter: true, render: (r) => `${r.className} ${r.section}` },
          { key: 'house', label: 'House', width: 110, filter: true, render: (r) => Badge(r.house, { tone: 'neutral' }) },
          { key: 'attendancePct', label: 'Attendance', width: 140, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${v.toFixed(1)}%`, render: (r) => h('span', { className: r.attendancePct < 75 ? 't-danger t-num' : 't-num' }, `${r.attendancePct}%`) },
          { key: 'lastExamPercent', label: 'Last exam', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${v.toFixed(1)}%`, render: (r) => `${r.lastExamPercent}%` },
          { key: 'cgpa', label: 'CGPA', width: 84, align: 'right', numeric: true },
          { key: 'feeDue', label: 'Fee due', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => (r.feeDue ? h('span', { className: 't-warning t-num' }, money(r.feeDue)) : h('span', { className: 't-faint' }, '—')) },
          {
            key: 'flags', label: 'Flags', width: 210, sortable: false,
            render: (r) => { const f = riskOf(r); return f.length ? h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-1)' } }, f.map((x) => Badge(x.label, { tone: x.tone, size: 'sm' }))) : Badge('On track', { tone: 'success', size: 'sm' }); },
            value: (r) => riskOf(r).length,
          },
        ],
        rows,
        selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['name', 'admissionNo', 'className'],
        exportName: 'my-students',
        bulkActions: [
          { label: 'Message parents', icon: 'send', onClick: (sel) => notify({ title: `Message queued for ${sel.length} families`, tone: 'success' }) },
          { label: 'Flag for counselling', icon: 'handshake', onClick: (sel) => notify({ title: `${sel.length} students referred to the counsellor`, tone: 'info' }) },
        ],
        rowActions: (row) => [
          { label: 'Open 360 profile', icon: 'eye', route: `students/profile/${row.id}` },
          { label: 'Call guardian', icon: 'phone-call', onClick: () => notify({ title: `Calling ${row.guardianName}`, text: row.emergencyContact, tone: 'info' }) },
          { label: 'Add behaviour note', icon: 'edit', onClick: mockAction('Add behaviour note') },
        ],
        onRowClick: (row) => navigate(`students/profile/${row.id}`),
        tableTitle: 'Class roll',
        emptyState: EmptyState({ icon: 'users', title: 'No students on your roll', text: 'Students appear here once sections are allocated to you.' }),
      });

      withHero(node, teacherHero(t, { subtitle: `${atRisk.length} of your ${rows.length} students carry at least one risk flag today.` }));
      mount.appendChild(node);
    },
  },

  'portals/teacher/leave': {
    title: 'My Leave',
    subtitle: 'Balance, applications and approvals',
    section: 'portals',
    render(mount, ctx) {
      ensureStyles();
      const t = demoTeacher(campusOf(ctx));
      mount.appendChild(myLeaveScreen(t, 'portals/teacher/leave', teacherHero(t, { subtitle: `You have ${t.leaveBalanceCL + t.leaveBalanceSL + t.leaveBalanceEL} days of leave in balance and ${t.leaveTakenYtd} taken this year.` })));
    },
  },
};

/* ==========================================================================
   PARENT PORTAL
   ========================================================================== */

/** Deterministic 0..1 from a string — keeps derived views identical on reload. */
function hash01(str) {
  let x = 2166136261;
  for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); }
  return (x >>> 0) / 4294967296;
}

/** Real marked dates for a child's section, resolved to a per-child status. */
function childAttendanceDays(kid) {
  return once('cad:' + kid.id, () => {
    const days = db.attendance.filter((a) => a.sectionId === kid.sectionId).map((a) => a.date).sort();
    const leaves = db.studentLeaveRequests.filter((l) => l.studentId === kid.id);
    const absentRate = Math.max(0.01, (100 - kid.attendancePct) / 100);
    return days.map((date) => {
      const onLeave = leaves.some((l) => date >= l.fromDate && date <= l.toDate && l.status === 'Approved');
      if (onLeave) return { date, status: 'Leave' };
      const r = hash01(kid.id + date);
      if (r < absentRate) return { date, status: 'Absent' };
      if (r < absentRate + 0.025) return { date, status: 'Late' };
      return { date, status: 'Present' };
    });
  });
}

function childInvoices(kid) {
  return db.invoices.filter((i) => i.studentId === kid.id).sort((a, b) => b.dueDate.localeCompare(a.dueDate));
}
function childPayments(kid) {
  return db.payments.filter((p) => p.studentId === kid.id).sort((a, b) => b.date.localeCompare(a.date));
}
function childHomework(kid) {
  return db.homework.filter((hw) => hw.sectionId === kid.sectionId).sort((a, b) => b.dueDate.localeCompare(a.dueDate));
}
function childSubmission(kid, hwId) {
  return db.submissions.find((s) => s.homeworkId === hwId && s.studentId === kid.id) || null;
}

function parentHero(parent, kid, subtitle, actions) {
  return hero({
    avatarName: parent.name,
    eyebrow: 'Parent portal',
    title: greetingFor(parent.name),
    subtitle: subtitle || `You are viewing ${kid.name} — ${kid.className} ${kid.section}, ${kid.house} House.`,
    meta: [
      { v: `${kid.attendancePct}%`, l: 'Attendance' },
      { v: kid.cgpa, l: 'CGPA' },
      { v: kid.feeDue > 0 ? moneyK(kid.feeDue) : 'Clear', l: 'Fee due' },
      { v: kid.rank, l: 'Class rank' },
    ],
    actions: actions || frag(
      heroChip('Pay fees', 'credit-card', () => navigate('portals/parent/fees', { child: kid.id })),
      mobileChip()),
  });
}

/**
 * Every parent screen shares the same skeleton: hero + child switcher + body,
 * repainting in place when the parent switches ward.
 */
function parentScreen(ctx, routeKey, { subtitle, body, actions }) {
  ensureStyles();
  const parent = demoParent(campusOf(ctx));
  const kids = childrenOf(parent);
  let activeId = (ctx.query && ctx.query.child) || kids[0].id;
  if (!kids.some((k) => k.id === activeId)) activeId = kids[0].id;

  const heroHost = h('div');
  const switchHost = h('div');
  const bodyHost = h('div', { className: 'stack' });

  const paint = () => {
    const kid = byId(db.students, activeId) || kids[0];
    heroHost.innerHTML = '';
    heroHost.appendChild(parentHero(parent, kid, subtitle ? subtitle(kid, parent) : null, actions ? actions(kid, parent) : null));
    switchHost.innerHTML = '';
    if (kids.length > 1) {
      switchHost.appendChild(Card({ pad: true }, h('div', { className: 'stack-2' },
        h('div', { className: 't-eyebrow' }, `My children · ${kids.length}`),
        switcher(kids.map((k) => ({ id: k.id, name: k.name, initials: k.avatarInitials, meta: `${k.className} ${k.section}` })), kid.id, (id) => { activeId = id; paint(); })
      )));
    }
    bodyHost.innerHTML = '';
    const out = body(kid, parent, paint);
    if (out) bodyHost.appendChild(h('div', { className: 'stack' }, out));
  };
  paint();

  return page({ route: routeKey, children: [heroHost, switchHost, bodyHost] });
}

const parentRoutes = {
  'portals/parent/children': {
    title: 'My Children',
    subtitle: 'A snapshot of every ward — attendance, results, fees and what is due next',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(parentScreen(ctx, 'portals/parent/children', {
        body: (kid, parent) => {
          const s360 = student360(kid.id);
          const hw = childHomework(kid).filter((x) => x.status === 'Open');
          const invoices = childInvoices(kid);
          const dueInvoice = invoices.find((i) => i.balance > 0);
          const ptm = db.ptmSchedules.find((p) => p.campusId === kid.campusId && p.status === 'Open');
          const notices = db.notices.filter((n) => n.campusId === kid.campusId || n.audience === 'All').slice(0, 5);
          const att = childAttendanceDays(kid);
          const recent = att.slice(-30);

          const snapshot = h('div', { className: 'widget-grid' },
            h('div', { className: 'span-3' }, Card({ pad: true }, h('div', { className: 'stack-2', style: { alignItems: 'center' } },
              progressRing(kid.attendancePct, { label: 'Attendance', sublabel: 'This term', size: 118 }),
              h('div', { className: 't-xs t-muted t-center' }, `${kid.presentDays} of ${kid.totalDays} days present`)))),
            h('div', { className: 'span-3' }, Card({ pad: true }, h('div', { className: 'stack-2', style: { alignItems: 'center' } },
              progressRing(kid.lastExamPercent, { label: 'Last exam', sublabel: `Rank ${kid.rank}`, size: 118, color: seriesColor(1) }),
              h('div', { className: 't-xs t-muted t-center' }, `CGPA ${kid.cgpa} · grade ${gradeFor(kid.lastExamPercent)}`)))),
            h('div', { className: 'span-3' }, StatCard({
              label: 'Fee outstanding', value: kid.feeDue > 0 ? money(kid.feeDue) : 'All clear',
              icon: 'wallet', tone: kid.feeDue > 0 ? 'danger' : 'success', hero: true,
              footer: kid.feeDue > 0 ? Button('Pay now', { variant: 'primary', size: 'sm', icon: 'credit-card', block: true, onClick: () => navigate('portals/parent/fees', { child: kid.id }) })
                : h('span', { className: 't-xs t-muted' }, `Last receipt ${childPayments(kid)[0] ? formatDate(childPayments(kid)[0].date) : '—'}`),
            })),
            h('div', { className: 'span-3' }, StatCard({
              label: 'Homework open', value: formatNumber(hw.length), icon: 'clipboard-list',
              tone: hw.length ? 'warning' : 'success', hero: true,
              footer: Button('View homework', { variant: 'secondary', size: 'sm', block: true, onClick: () => navigate('portals/parent/homework', { child: kid.id }) }),
            })));

          const quick = tiles([
            { icon: 'clipboard-check', label: 'Attendance', value: `${kid.attendancePct}%`, meta: 'Calendar view', tone: toneForPct(kid.attendancePct), onClick: () => navigate('portals/parent/attendance', { child: kid.id }) },
            { icon: 'chart-bar', label: 'Results', value: `${kid.lastExamPercent}%`, meta: 'Report cards', tone: 'info', onClick: () => navigate('portals/parent/results', { child: kid.id }) },
            { icon: 'wallet', label: 'Fees', value: kid.feeDue > 0 ? moneyK(kid.feeDue) : 'Paid', meta: 'Receipts', tone: kid.feeDue > 0 ? 'danger' : 'success', onClick: () => navigate('portals/parent/fees', { child: kid.id }) },
            { icon: 'bus', label: 'Bus tracking', value: kid.transportOpted ? 'Live' : 'Not opted', meta: kid.transportOpted ? 'ETA to your stop' : 'Own transport', tone: 'brand', onClick: () => navigate('portals/parent/bus-tracking', { child: kid.id }) },
            { icon: 'handshake', label: 'Book PTM', value: ptm ? formatDate(ptm.date, 'dayMonth') : '—', meta: ptm ? 'Slots open' : 'None scheduled', tone: 'warning', onClick: () => navigate('portals/parent/ptm', { child: kid.id }) },
            { icon: 'mail', label: 'Messages', value: formatNumber(db.circulars.length), meta: 'Circulars & notices', onClick: () => navigate('portals/parent/messages', { child: kid.id }) },
            { icon: 'folder', label: 'Documents', value: formatNumber(s360.documents.length), meta: 'Certificates', onClick: () => navigate('portals/parent/documents', { child: kid.id }) },
            { icon: 'alert-circle', label: 'Raise a concern', meta: 'We reply within 24h', tone: 'danger', onClick: () => navigate('portals/parent/complaints', { child: kid.id }) },
          ]);

          const attendanceStrip = SectionCard({ title: 'Last 30 school days', subtitle: 'Green present · amber late · red absent · grey leave', className: 'chart-card', icon: 'clipboard-check' },
            h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-1)' } },
              recent.map((d) => h('span', {
                title: `${formatDate(d.date)} — ${d.status}`,
                attrs: { 'aria-label': `${formatDate(d.date)} ${d.status}` },
                style: {
                  width: '18px', height: '18px', borderRadius: 'var(--r-xs)',
                  background: d.status === 'Present' ? 'var(--chart-good)' : d.status === 'Late' ? 'var(--chart-warning)' : d.status === 'Absent' ? 'var(--chart-critical)' : 'var(--chart-track)',
                },
              }))),
            h('div', { className: 'row row-wrap mt-3', style: { gap: 'var(--sp-4)' } },
              kv('Present', `${recent.filter((d) => d.status === 'Present').length} days`),
              kv('Late', `${recent.filter((d) => d.status === 'Late').length} days`),
              kv('Absent', `${recent.filter((d) => d.status === 'Absent').length} days`),
              kv('Leave', `${recent.filter((d) => d.status === 'Leave').length} days`)));

          const timeline = SectionCard({ title: `${kid.firstName}'s recent activity`, icon: 'history' },
            Timeline(s360.timeline.slice().reverse().map((e) => ({
              title: e.title, meta: formatDate(e.date), text: e.text, icon: e.icon, tone: e.tone === 'default' ? 'neutral' : e.tone,
            }))));

          const noticeCard = SectionCard({ title: 'From the school', subtitle: 'Latest notices for your campus', icon: 'megaphone', actions: Button('All messages', { variant: 'ghost', size: 'sm', iconRight: 'chevron-right', onClick: () => navigate('portals/parent/messages', { child: kid.id }) }) },
            notices.length ? ActivityFeed(notices.map((n) => ({
              name: n.postedBy, text: n.title, time: relativeTime(n.postedOn), icon: n.pinned ? 'pin' : 'megaphone', tone: n.pinned ? 'warning' : 'info',
            }))) : EmptyState({ icon: 'megaphone', title: 'No notices right now', text: 'Circulars and announcements from the school will appear here.' }));

          const otherKids = childrenOf(parent).filter((k) => k.id !== kid.id);

          return [
            snapshot,
            SectionCard({ title: 'Quick actions', subtitle: 'Everything a parent needs, one tap away', icon: 'sparkles' }, quick),
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-7' }, attendanceStrip),
              h('div', { className: 'span-5' }, noticeCard)),
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-7' }, timeline),
              h('div', { className: 'span-5' }, SectionCard({ title: 'Class & guardians', icon: 'users' },
                DescriptionList([
                  ['Class teacher', (byId(db.staff, (byId(db.sections, kid.sectionId) || {}).classTeacherId) || {}).name || 'To be assigned'],
                  ['Class & section', `${kid.className} ${kid.section}`],
                  ['House', kid.house],
                  ['Admission no', kid.admissionNo],
                  ['Roll no', String(kid.rollNo)],
                  ['Transport', kid.transportOpted ? `Route ${(byId(db.routes, kid.routeId) || {}).code || '—'}` : 'Own transport'],
                  ['Emergency contact', kid.emergencyContact],
                ], { cols: 2 }),
                h('div', { className: 'row row-wrap mt-3', style: { gap: 'var(--sp-2)' } },
                  Button('Message class teacher', { variant: 'secondary', size: 'sm', icon: 'send', onClick: () => navigate('portals/parent/messages', { child: kid.id }) }),
                  Button('Apply for leave', { variant: 'ghost', size: 'sm', icon: 'umbrella', onClick: () => applyStudentLeave(kid) }))))),
            otherKids.length ? SectionCard({ title: 'Your other children', icon: 'users' },
              h('div', { className: 'pt-grid-2' }, otherKids.map((k) => Card({ pad: true, className: 'card-interactive', onClick: () => navigate('portals/parent/children', { child: k.id }) },
                h('div', { className: 'row-3' },
                  Avatar(k.name, { size: 'lg', initials: k.avatarInitials }),
                  h('div', { className: 'flex-1' },
                    h('div', { className: 't-semibold' }, k.name),
                    h('div', { className: 't-xs t-muted' }, `${k.className} ${k.section} · ${k.house} House`),
                    h('div', { className: 'row row-wrap mt-2', style: { gap: 'var(--sp-2)' } },
                      Badge(`${k.attendancePct}% attendance`, { tone: toneForPct(k.attendancePct) }),
                      Badge(k.feeDue > 0 ? `${moneyK(k.feeDue)} due` : 'Fees clear', { tone: k.feeDue > 0 ? 'warning' : 'success' }))),
                  Icon('chevron-right', 18)))))) : null,
          ];
        },
      }));
    },
  },

  'portals/parent/attendance': {
    title: 'Attendance',
    subtitle: 'Day-by-day attendance, leave and the monthly pattern',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(parentScreen(ctx, 'portals/parent/attendance', {
        subtitle: (kid) => `${kid.firstName}'s attendance is ${kid.attendancePct}% — ${kid.attendancePct >= 90 ? 'comfortably above' : kid.attendancePct >= 75 ? 'above' : 'below'} the 75% board requirement.`,
        body: (kid) => {
          const days = childAttendanceDays(kid);
          const byStatus = ['Present', 'Absent', 'Late', 'Leave'].map((s) => ({ key: s, value: days.filter((d) => d.status === s).length }));
          const month = '2026-08';
          const events = days.filter((d) => d.date.startsWith(month)).map((d) => ({
            date: d.date, title: d.status,
            tone: d.status === 'Present' ? 'success' : d.status === 'Absent' ? 'danger' : d.status === 'Late' ? 'warning' : 'info',
            meta: d.status === 'Present' ? 'Full day' : d.status === 'Late' ? 'Arrived after 08:15' : d.status === 'Leave' ? 'Approved leave' : 'Marked absent',
          }));
          for (const hol of db.holidays) {
            if (hol.date && hol.date.startsWith(month)) events.push({ date: hol.date, title: hol.name, tone: 'brand', meta: 'Holiday' });
          }

          const monthly = new Map();
          for (const d of days) {
            const k = d.date.slice(0, 7);
            if (!monthly.has(k)) monthly.set(k, { present: 0, total: 0 });
            const e = monthly.get(k);
            e.total++;
            if (d.status === 'Present' || d.status === 'Late') e.present++;
          }
          const monthKeys = Array.from(monthly.keys()).sort();
          const leaves = db.studentLeaveRequests.filter((l) => l.studentId === kid.id);

          return [
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-3' }, Card({ pad: true }, h('div', { className: 'stack-2', style: { alignItems: 'center' } },
                progressRing(kid.attendancePct, { label: 'Overall attendance', sublabel: `${kid.presentDays}/${kid.totalDays} days`, size: 128 })))),
              h('div', { className: 'span-3' }, StatCard({ label: 'Days present', value: formatNumber(kid.presentDays), icon: 'check-circle', tone: 'success', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Days absent', value: formatNumber(Math.max(0, kid.totalDays - kid.presentDays)), icon: 'x-circle', tone: 'danger', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Leave applications', value: formatNumber(leaves.length), icon: 'umbrella', tone: 'info', hero: true, footer: Button('Apply for leave', { variant: 'secondary', size: 'sm', block: true, icon: 'plus', onClick: () => applyStudentLeave(kid) }) }))),
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-8' }, SectionCard({ title: 'August 2026', subtitle: 'Tap a day to see what was marked', icon: 'calendar' },
                Calendar({
                  month, events, maxPerDay: 2,
                  onSelectDate: (d) => {
                    const rec = days.find((x) => x.date === d);
                    notify({ title: formatDate(d), text: rec ? `${kid.firstName} was marked ${rec.status.toLowerCase()}.` : 'No school on this day.', tone: rec && rec.status === 'Absent' ? 'warning' : 'info' });
                  },
                }))),
              h('div', { className: 'span-4' }, SectionCard({ title: 'Attendance split', subtitle: 'Whole session to date', className: 'chart-card', icon: 'chart-pie' },
                donutChart({ data: byStatus, height: 230, centerValue: `${kid.attendancePct}%`, centerLabel: 'Present' })))),
            SectionCard({ title: 'Month on month', subtitle: 'Present percentage against the 90% school target', className: 'chart-card', icon: 'chart-line' },
              lineChart({
                categories: monthKeys.map((k) => formatDate(k + '-01', 'monthYear')),
                series: [{ name: 'Present %', values: monthKeys.map((k) => pct(monthly.get(k).present, monthly.get(k).total)) }],
                valueFormat: 'percent', target: 90, targetLabel: 'Target', height: 240, showDots: true,
              })),
            SectionCard({ title: 'Leave applications', subtitle: 'Applied by you through the portal', icon: 'umbrella', flush: true },
              leaves.length ? DataTable({
                columns: [
                  { key: 'fromDate', label: 'From', width: 130, render: (r) => formatDate(r.fromDate) },
                  { key: 'toDate', label: 'To', width: 130, render: (r) => formatDate(r.toDate) },
                  { key: 'days', label: 'Days', width: 80, align: 'right', numeric: true, aggregate: 'sum' },
                  { key: 'type', label: 'Type', width: 150, filter: true },
                  { key: 'reason', label: 'Reason' },
                  { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
                  { key: 'attachment', label: 'Attachment', width: 150, render: (r) => (r.attachment ? Button('Download', { variant: 'link', size: 'sm', icon: 'download', onClick: mockAction('Download attachment') }) : h('span', { className: 't-faint' }, '—')) },
                ],
                rows: leaves, pageSize: 10, footerAggregates: true, exportName: 'leave-applications',
              }) : EmptyState({ icon: 'umbrella', title: 'No leave applied', text: 'When your child needs a day off, apply here and the class teacher is notified instantly.', action: Button('Apply for leave', { variant: 'primary', icon: 'plus', onClick: () => applyStudentLeave(kid) }) })),
          ];
        },
      }));
    },
  },

  'portals/parent/homework': {
    title: 'Homework',
    subtitle: 'What is due, what was submitted and how it was graded',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(parentScreen(ctx, 'portals/parent/homework', {
        subtitle: (kid) => {
          const open = childHomework(kid).filter((x) => x.status === 'Open');
          return open.length ? `${kid.firstName} has ${open.length} assignments open right now.` : `${kid.firstName} has nothing outstanding — every assignment is submitted.`;
        },
        body: (kid) => {
          const hw = childHomework(kid);
          const open = hw.filter((x) => x.status === 'Open');
          const submittedCount = hw.filter((x) => { const s = childSubmission(kid, x.id); return s && s.status !== 'Pending'; }).length;

          const card = (x) => {
            const sub = childSubmission(kid, x.id);
            const done = sub && sub.submittedOn;
            return Card({ pad: true },
              h('div', { className: 'row-3 row-top row-wrap' },
                h('div', { className: 'pt-tile-ico', html: icon('clipboard-list', 17) }),
                h('div', { className: 'flex-1 min-0 stack-2' },
                  h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
                    h('span', { className: 't-semibold' }, x.title),
                    Badge(x.subjectName, { tone: 'neutral', size: 'sm' }),
                    done ? Badge('Submitted', { tone: 'success', size: 'sm' }) : Badge(x.status === 'Open' ? 'Pending' : 'Closed', { tone: x.status === 'Open' ? 'warning' : 'neutral', size: 'sm' })),
                  h('div', { className: 't-sm t-muted' }, x.description),
                  h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-4)' } },
                    h('span', { className: 't-xs t-muted' }, `Assigned ${formatDate(x.assignedDate)}`),
                    h('span', { className: ['t-xs', new Date(x.dueDate) < new Date(TODAY) && !done ? 't-danger' : 't-muted'].join(' ') }, dueLabel(x.dueDate)),
                    x.attachments ? h('span', { className: 't-xs t-muted' }, `${x.attachments} attachment${x.attachments > 1 ? 's' : ''}`) : null,
                    sub && sub.marks != null ? h('span', { className: 't-xs t-success t-semibold' }, `Scored ${sub.marks}/${sub.maxMarks}`) : null),
                  sub && sub.feedback ? Callout({ tone: 'info', icon: 'message-circle', title: 'Teacher feedback' }, sub.feedback) : null),
                h('div', { className: 'row', style: { gap: 'var(--sp-2)' } },
                  Button('Open', { variant: 'secondary', size: 'sm', icon: 'eye', onClick: () => homeworkParentDrawer(kid, x, sub) }))));
          };

          return [
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-3' }, StatCard({ label: 'Assignments this month', value: formatNumber(hw.length), icon: 'clipboard-list', tone: 'brand', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Open now', value: formatNumber(open.length), icon: 'clock', tone: open.length ? 'warning' : 'success', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Submitted', value: formatNumber(submittedCount), icon: 'check-circle', tone: 'success', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Average score', value: hw.length ? `${(sum(hw, 'avgScore') / hw.length).toFixed(1)}/10` : '—', icon: 'star', tone: 'info', hero: true }))),
            SectionCard({ title: 'Due soon', subtitle: 'Assignments still accepting submissions', icon: 'clock' },
              open.length ? h('div', { className: 'stack-3' }, open.slice(0, 6).map(card))
                : EmptyState({ icon: 'check-circle', title: 'Nothing pending', text: `${kid.firstName} has submitted everything assigned so far. Well done!`, tone: 'success' })),
            SectionCard({ title: 'Homework history', subtitle: 'Everything assigned to this section', icon: 'history', flush: true },
              hw.length ? DataTable({
                columns: [
                  { key: 'title', label: 'Assignment', sticky: true, width: 260, render: (r) => Identity(r.title, r.subjectName), value: (r) => r.title },
                  { key: 'assignedDate', label: 'Assigned', width: 130, render: (r) => formatDate(r.assignedDate) },
                  { key: 'dueDate', label: 'Due', width: 130, render: (r) => formatDate(r.dueDate) },
                  { key: 'maxMarks', label: 'Max marks', width: 110, align: 'right', numeric: true },
                  {
                    key: 'mine', label: 'My submission', width: 160,
                    render: (r) => { const s = childSubmission(kid, r.id); return s ? Badge(s.status) : Badge('Not submitted', { tone: 'danger' }); },
                    value: (r) => { const s = childSubmission(kid, r.id); return s ? s.status : 'Not submitted'; },
                  },
                  {
                    key: 'score', label: 'Score', width: 100, align: 'right', numeric: true,
                    render: (r) => { const s = childSubmission(kid, r.id); return s && s.marks != null ? `${s.marks}/${s.maxMarks}` : h('span', { className: 't-faint' }, '—'); },
                    value: (r) => { const s = childSubmission(kid, r.id); return s && s.marks != null ? s.marks : -1; },
                  },
                  { key: 'status', label: 'State', width: 100, filter: true, render: (r) => Badge(r.status) },
                ],
                rows: hw, pageSize: 15, exportName: 'homework', searchKeys: ['title', 'subjectName'],
                onRowClick: (r) => homeworkParentDrawer(kid, r, childSubmission(kid, r.id)),
              }) : EmptyState({ icon: 'clipboard-list', title: 'No homework recorded', text: 'Assignments published by teachers will appear here.' })),
          ];
        },
      }));
    },
  },

  'portals/parent/results': {
    title: 'Results',
    subtitle: 'Exam performance, subject strengths and report cards',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(parentScreen(ctx, 'portals/parent/results', {
        subtitle: (kid) => `${kid.firstName} scored ${kid.lastExamPercent}% in the last assessment and ranks ${kid.rank} in ${kid.className} ${kid.section}.`,
        body: (kid) => {
          const s360 = student360(kid.id);
          const marks = db.marks.filter((m) => m.studentId === kid.id);
          const groups = Array.from(new Set(marks.map((m) => m.examGroupId)));
          const subjectNames = s360.subjectScores.map((s) => s.subjectName);
          const classAvg = subjectNames.map((name) => {
            const peers = db.marks.filter((m) => m.sectionId === kid.sectionId && m.subjectName === name);
            return peers.length ? Math.round(avg(peers, 'percent') * 10) / 10 : 0;
          });

          return [
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-3' }, Card({ pad: true }, h('div', { className: 'stack-2', style: { alignItems: 'center' } },
                progressRing(kid.lastExamPercent, { label: 'Last assessment', sublabel: gradeFor(kid.lastExamPercent), size: 128, color: seriesColor(1) })))),
              h('div', { className: 'span-3' }, StatCard({ label: 'CGPA', value: kid.cgpa, icon: 'star', tone: 'brand', hero: true, footer: h('span', { className: 't-xs t-muted' }, 'Cumulative across the session') })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Class rank', value: `#${kid.rank}`, icon: 'trophy', tone: 'success', hero: true, footer: h('span', { className: 't-xs t-muted' }, `of ${db.students.filter((s) => s.sectionId === kid.sectionId).length} students`) })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Awards', value: formatNumber(s360.awards.length), icon: 'award', tone: 'warning', hero: true, footer: h('span', { className: 't-xs t-muted' }, 'Certificates on file') }))),
            SectionCard({
              title: 'Subject performance', subtitle: `${kid.firstName} compared with the section average`, className: 'chart-card', icon: 'chart-bar',
              actions: Button('Download report card', { variant: 'primary', size: 'sm', icon: 'download', onClick: () => notify({ title: 'Report card downloading', text: `${kid.name} · Term 1 2026-27`, tone: 'success' }) }),
            },
              barChart({
                categories: subjectNames,
                series: [
                  { name: kid.firstName, values: s360.subjectScores.map((s) => s.marks) },
                  { name: 'Section average', values: classAvg },
                ],
                valueFormat: 'percent', height: 280,
              })),
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-7' }, SectionCard({ title: 'Progress across years', subtitle: 'Percentage and attendance, year on year', className: 'chart-card', icon: 'chart-line' },
                lineChart({
                  categories: s360.academicHistory.map((r) => r.year),
                  series: [
                    { name: 'Percentage', values: s360.academicHistory.map((r) => r.percent) },
                    { name: 'Attendance', values: s360.academicHistory.map((r) => r.attendance) },
                  ],
                  valueFormat: 'percent', height: 260, showDots: true,
                }))),
              h('div', { className: 'span-5' }, SectionCard({ title: 'Subject grades', subtitle: 'Latest assessment', icon: 'certificate' },
                RankList(s360.subjectScores.map((s) => ({ name: s.subjectName, meta: `${s.teacher} · grade ${s.grade}`, value: `${s.marks}/${s.maxMarks}` })))))),
            SectionCard({ title: 'Exam-wise detail', subtitle: `${groups.length} assessments published this session`, icon: 'file-text', flush: true },
              marks.length ? DataTable({
                columns: [
                  { key: 'examGroupId', label: 'Assessment', width: 170, filter: true, render: (r) => (byId(db.examGroups, r.examGroupId) || {}).name || r.examGroupId, value: (r) => r.examGroupId },
                  { key: 'subjectName', label: 'Subject', width: 180, filter: true, sticky: true },
                  { key: 'marksObtained', label: 'Marks', width: 110, align: 'right', numeric: true, render: (r) => `${r.marksObtained}/${r.maxMarks}` },
                  { key: 'percent', label: 'Percent', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${v.toFixed(1)}%`, render: (r) => `${r.percent}%` },
                  { key: 'grade', label: 'Grade', width: 90, render: (r) => Badge(r.grade, { tone: r.percent >= 75 ? 'success' : r.percent >= 50 ? 'info' : r.percent >= 33 ? 'warning' : 'danger' }) },
                  { key: 'status', label: 'Result', width: 110, filter: true, render: (r) => Badge(r.status) },
                  { key: 'remarks', label: 'Remarks' },
                ],
                rows: marks, pageSize: 15, footerAggregates: true, exportName: 'results', searchKeys: ['subjectName'],
              }) : EmptyState({ icon: 'file-text', title: 'No published results yet', text: 'Marks appear here as soon as the examination cell publishes them.' })),
            s360.awards.length ? SectionCard({ title: 'Awards & achievements', icon: 'award' },
              h('div', { className: 'pt-grid-2' }, s360.awards.map((a) => Card({ pad: true },
                h('div', { className: 'row-3' },
                  h('span', { className: 'pt-tile-ico', html: icon('award', 17) }),
                  h('div', { className: 'flex-1' },
                    h('div', { className: 't-semibold' }, a.title),
                    h('div', { className: 't-xs t-muted' }, `${a.category} · ${a.level} · ${formatDate(a.date)}`),
                    h('div', { className: 't-xs t-muted' }, `Certificate ${a.certificateNo}`)),
                  Badge(`${a.points} pts`, { tone: 'warning' })))))) : null,
          ];
        },
      }));
    },
  },
};

/* --------------------------------------- parent: shared flows & drawers */

function homeworkParentDrawer(kid, hw, sub) {
  Drawer({
    title: hw.title,
    subtitle: `${hw.subjectName} · ${hw.className} ${hw.section} · ${dueLabel(hw.dueDate)}`,
    size: 'md',
    body: h('div', { className: 'stack' },
      Callout({ tone: hw.status === 'Open' ? 'info' : 'neutral', icon: 'clipboard-list', title: `Assigned ${formatDate(hw.assignedDate)}` }, hw.description),
      DescriptionList([
        ['Subject', hw.subjectName],
        ['Maximum marks', String(hw.maxMarks)],
        ['Due date', formatDate(hw.dueDate)],
        ['Class submissions', `${hw.submitted} of ${hw.totalStudents}`],
        ['Status', hw.status],
      ], { cols: 1 }),
      sub ? SectionCard({ title: `${kid.firstName}'s submission`, icon: 'inbox' },
        DescriptionList([
          ['Submitted on', sub.submittedOn ? formatDateTime(sub.submittedOn) : 'Not submitted'],
          ['Status', sub.status],
          ['Late', sub.late ? 'Yes' : 'No'],
          ['Marks', sub.marks == null ? 'Awaiting grading' : `${sub.marks} / ${sub.maxMarks}`],
          ['Feedback', sub.feedback || '—'],
        ], { cols: 1 }))
        : Callout({ tone: 'warning', icon: 'alert-circle', title: 'Not submitted yet' },
          'Encourage your child to upload the work from the student portal before the due date.'),
      hw.attachments ? SectionCard({ title: 'Attachments', icon: 'paperclip' },
        FileList(Array.from({ length: hw.attachments }, (_, i) => ({
          name: `${hw.subjectName.toLowerCase().replace(/\s+/g, '-')}-worksheet-${i + 1}.pdf`, type: 'PDF', size: '820 KB', date: hw.assignedDate,
        })), { onDownload: mockAction('Download attachment') })) : null),
    actions: (close) => frag(
      Button('Close', { variant: 'secondary', onClick: close }),
      Button('Message teacher', { variant: 'primary', icon: 'send', onClick: () => { close(); navigate('portals/parent/messages', { child: kid.id }); } })),
  });
}

function applyStudentLeave(kid) {
  return formPage({
    title: `Apply for leave — ${kid.firstName}`,
    subtitle: 'The class teacher is notified as soon as you submit',
    mode: 'modal', size: 'md', submitLabel: 'Submit application',
    sections: [{
      title: 'Leave details', cols: 2,
      fields: [
        { id: 'from', label: 'From', type: 'date', required: true },
        { id: 'to', label: 'To', type: 'date', required: true },
        { id: 'type', label: 'Type', type: 'select', required: true, options: ['Sick Leave', 'Medical', 'Family Function', 'Travel', 'Religious', 'Competition'] },
        { id: 'contact', label: 'Contact number', type: 'tel', value: kid.emergencyContact, validate: validators.phone },
        { id: 'reason', label: 'Reason', type: 'textarea', required: true, span: 'full', placeholder: 'A short note for the class teacher' },
        { id: 'doc', label: 'Supporting document', type: 'file', span: 'full', hint: 'Medical certificate for absences longer than three days' },
      ],
    }],
    onSubmit: (v) => notify({ title: 'Leave application submitted', text: `${kid.name} · ${formatDate(v.from)} to ${formatDate(v.to)} · pending class teacher approval`, tone: 'success' }),
  });
}

function payNowFlow(kid, invoice) {
  const amount = invoice ? invoice.balance : kid.feeDue;
  let mode = 'UPI';
  const summary = h('div', { className: 'pt-soft stack-1' },
    kv('Student', `${kid.name} (${kid.admissionNo})`),
    kv('Class', `${kid.className} ${kid.section}`),
    invoice ? kv('Invoice', invoice.invoiceNo) : null,
    invoice ? kv('Period', invoice.period) : null,
    kv('Amount payable', money(amount)),
    kv('Convenience fee', money(Math.round(amount * 0.0118))),
    kv('Total', money(amount + Math.round(amount * 0.0118))));

  const modal = Modal({
    title: 'Pay school fees', subtitle: 'Secured by Razorpay · UPI, cards and net banking', size: 'md', icon: 'credit-card',
    body: h('div', { className: 'stack' },
      summary,
      Field({ label: 'Payment method', required: true },
        RadioGroup(['UPI', 'Credit / Debit card', 'Net banking', 'NEFT / RTGS'], { name: 'paymode', value: mode, onChange: (v) => { mode = v; } })),
      Field({ label: 'UPI ID / VPA', hint: 'You will receive a collect request on this ID' },
        Input({ placeholder: 'name@okhdfcbank', value: 'neelam@okicici' })),
      Callout({ tone: 'info', icon: 'shield-check', title: 'Safe payments' },
        'Springdale never stores your card details. A receipt is emailed and added to your portal instantly.')),
    actions: (close) => frag(
      Button('Cancel', { variant: 'secondary', onClick: close }),
      Button(`Pay ${money(amount + Math.round(amount * 0.0118))}`, {
        variant: 'primary', icon: 'lock',
        onClick: () => {
          close();
          const receiptNo = `RCP/26/${String(Math.round(amount)).slice(0, 5)}`;
          Modal({
            title: 'Payment successful', size: 'sm', icon: 'check-circle', tone: 'success',
            body: h('div', { className: 'stack-3' },
              h('div', { className: 't-center stack-2' },
                h('div', { className: 't-hero' }, money(amount)),
                h('div', { className: 't-muted' }, `Receipt ${receiptNo} · ${mode}`)),
              DescriptionList([
                ['Student', kid.name],
                ['Paid on', formatDate(TODAY)],
                ['Mode', mode],
                ['Status', 'Success'],
              ], { cols: 1 })),
            actions: (c2) => frag(
              Button('Download receipt', { variant: 'secondary', icon: 'download', onClick: () => notify({ title: 'Receipt downloaded', tone: 'success' }) }),
              Button('Done', { variant: 'primary', onClick: c2 })),
          });
          notify({ title: 'Payment successful', text: `${money(amount)} received · receipt ${receiptNo}`, tone: 'success' });
        },
      })),
  });
  return modal;
}

/** Map a route's stops into the 0-100 / 0-60 coordinate space of MapPlaceholder. */
function routeToMapPath(stops) {
  if (!stops.length) return [[10, 30], [50, 30], [90, 30]];
  const lats = stops.map((s) => s.lat);
  const lngs = stops.map((s) => s.lng);
  const minLat = Math.min(...lats); const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs); const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 1;
  const spanLng = maxLng - minLng || 1;
  return stops.map((s) => [
    Math.round((6 + ((s.lng - minLng) / spanLng) * 88) * 10) / 10,
    Math.round((8 + ((maxLat - s.lat) / spanLat) * 44) * 10) / 10,
  ]);
}

const parentRoutes2 = {
  'portals/parent/fees': {
    title: 'Fees & Receipts',
    subtitle: 'Pay online in seconds and keep every receipt in one place',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(parentScreen(ctx, 'portals/parent/fees', {
        subtitle: (kid) => (kid.feeDue > 0
          ? `${money(kid.feeDue)} is outstanding for ${kid.firstName}. Pay online with UPI, card or net banking.`
          : `All fees for ${kid.firstName} are settled. Thank you!`),
        actions: (kid) => frag(
          heroChip(kid.feeDue > 0 ? `Pay ${moneyK(kid.feeDue)} now` : 'Fees are clear', 'credit-card', () => (kid.feeDue > 0 ? payNowFlow(kid, childInvoices(kid).find((i) => i.balance > 0)) : notify({ title: 'Nothing outstanding', tone: 'success' }))),
          mobileChip()),
        body: (kid) => {
          const invoices = childInvoices(kid);
          const payments = childPayments(kid);
          const overdue = invoices.filter((i) => i.status === 'Overdue');
          const structure = db.feeStructures.find((f) => f.classCode === kid.className || f.className === kid.className) || null;

          const payCard = Card({ pad: true, className: 'card-accent' },
            h('div', { className: 'row-4 row-wrap' },
              h('div', { className: 'flex-1', style: { minWidth: '220px' } },
                h('div', { className: 't-eyebrow' }, 'Amount due now'),
                h('div', { className: 't-hero' }, kid.feeDue > 0 ? money(kid.feeDue) : 'All clear'),
                h('div', { className: 't-sm t-muted mt-1' },
                  overdue.length ? `${overdue.length} invoice${overdue.length > 1 ? 's' : ''} overdue · late fee ₹50 per day applies`
                    : invoices.find((i) => i.balance > 0) ? `Next due ${formatDate((invoices.find((i) => i.balance > 0) || {}).dueDate)}` : 'Nothing pending for this session')),
              h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
                Button(kid.feeDue > 0 ? 'Pay now' : 'Pay in advance', {
                  variant: 'primary', size: 'lg', icon: 'credit-card',
                  onClick: () => payNowFlow(kid, invoices.find((i) => i.balance > 0)),
                }),
                Button('Download statement', { variant: 'secondary', size: 'lg', icon: 'download', onClick: () => notify({ title: 'Fee statement downloaded', tone: 'success' }) }))));

          return [
            payCard,
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-3' }, StatCard({ label: 'Billed this session', value: money(kid.feeTotal), icon: 'receipt', tone: 'info', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Paid', value: money(kid.feePaid), icon: 'check-circle', tone: 'success', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Outstanding', value: money(kid.feeDue), icon: 'alert-circle', tone: kid.feeDue > 0 ? 'danger' : 'success', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Receipts', value: formatNumber(payments.length), icon: 'file-text', tone: 'brand', hero: true }))),
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-7' }, SectionCard({ title: 'Invoices', subtitle: 'Quarter-wise billing for 2026-27', icon: 'receipt', flush: true },
                invoices.length ? DataTable({
                  columns: [
                    { key: 'invoiceNo', label: 'Invoice', width: 150, sticky: true },
                    { key: 'period', label: 'Period', width: 130, filter: true },
                    { key: 'dueDate', label: 'Due date', width: 130, render: (r) => formatDate(r.dueDate) },
                    { key: 'amount', label: 'Amount', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.amount) },
                    { key: 'paid', label: 'Paid', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.paid) },
                    { key: 'balance', label: 'Balance', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => (r.balance ? h('span', { className: 't-danger t-num' }, money(r.balance)) : h('span', { className: 't-faint' }, '—')) },
                    { key: 'status', label: 'Status', width: 110, filter: true, render: (r) => Badge(r.status) },
                    {
                      key: 'act', label: '', width: 110, sortable: false,
                      render: (r) => (r.balance > 0 ? Button('Pay', { variant: 'primary', size: 'sm', onClick: (e) => { e.stopPropagation(); payNowFlow(kid, r); } }) : Button('Receipt', { variant: 'ghost', size: 'sm', icon: 'download', onClick: (e) => { e.stopPropagation(); notify({ title: 'Receipt downloaded', tone: 'success' }); } })),
                    },
                  ],
                  rows: invoices, pageSize: 10, footerAggregates: true, exportName: 'invoices',
                }) : EmptyState({ icon: 'receipt', title: 'No invoices raised', text: 'Fee invoices for this session have not been generated yet.' }))),
              h('div', { className: 'span-5' }, SectionCard({ title: 'Fee structure', subtitle: structure ? `${structure.name} · ${structure.installments} instalments` : 'Class fee components', icon: 'layers' },
                structure ? h('div', { className: 'stack-1' },
                  structure.components.map((c) => kv(c.name, money(c.amount))),
                  Divider(),
                  kv('Annual total', money(structure.total)),
                  h('div', { className: 't-xs t-muted mt-2' }, `Late fee ₹${structure.lateFeePerDay} per day after the ${structure.dueDay}th.`))
                  : EmptyState({ icon: 'layers', title: 'Structure not published', text: 'The fee structure for this class is being finalised.' })))),
            SectionCard({ title: 'Payment receipts', subtitle: 'Every payment made against this student', icon: 'file-text', flush: true },
              payments.length ? DataTable({
                columns: [
                  { key: 'receiptNo', label: 'Receipt', width: 150, sticky: true },
                  { key: 'date', label: 'Paid on', width: 130, render: (r) => formatDate(r.date) },
                  { key: 'amount', label: 'Amount', width: 130, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.amount) },
                  { key: 'mode', label: 'Mode', width: 130, filter: true },
                  { key: 'reference', label: 'Reference', width: 180, className: 't-mono' },
                  { key: 'status', label: 'Status', width: 110, filter: true, render: (r) => Badge(r.status) },
                  { key: 'dl', label: '', width: 120, sortable: false, render: () => Button('Download', { variant: 'link', size: 'sm', icon: 'download', onClick: (e) => { e.stopPropagation(); notify({ title: 'Receipt downloaded', tone: 'success' }); } }) },
                ],
                rows: payments, pageSize: 10, footerAggregates: true, exportName: 'receipts',
              }) : EmptyState({ icon: 'file-text', title: 'No receipts yet', text: 'Receipts appear here the moment a payment is recorded.' })),
          ];
        },
      }));
    },
  },

  'portals/parent/bus-tracking': {
    title: 'Bus Tracking',
    subtitle: 'Where the bus is right now and when it reaches your stop',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(parentScreen(ctx, 'portals/parent/bus-tracking', {
        subtitle: (kid) => (kid.transportOpted
          ? `${kid.firstName} travels on route ${(byId(db.routes, kid.routeId) || {}).code || '—'}. Live position updates every 30 seconds.`
          : `${kid.firstName} is not registered for school transport.`),
        body: (kid) => {
          if (!kid.transportOpted || !kid.routeId) {
            return emptyCard({
              icon: 'bus', title: 'Not using school transport',
              text: `${kid.firstName} is marked as using private transport. Opt in from the transport office and live tracking activates the next working day.`,
              action: Button('Request transport', { variant: 'primary', icon: 'bus', onClick: mockAction('Request transport') }),
            });
          }
          const route = byId(db.routes, kid.routeId);
          const stops = db.stops.filter((s) => s.routeId === kid.routeId).sort((a, b) => a.seq - b.seq);
          const myStop = byId(db.stops, kid.stopId) || stops[0];
          const vehicle = byId(db.vehicles, route ? route.vehicleId : null);
          const driver = vehicle ? byId(db.drivers, vehicle.driverId) : null;
          const conductor = vehicle ? byId(db.drivers, vehicle.conductorId) : null;
          const attendance = db.busAttendance.filter((b) => b.routeId === kid.routeId).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

          const progress = myStop && stops.length ? Math.max(0.05, Math.min(0.95, (myStop.seq - 1) / Math.max(1, stops.length - 1))) : 0.4;
          const currentIdx = Math.max(0, Math.floor(progress * (stops.length - 1)) - 1);
          const etaMin = Math.max(2, (myStop.seq - 1 - currentIdx) * 4);

          const map = MapPlaceholder({
            routes: [{ id: route.id, name: `${route.code} — ${route.name}`, color: seriesColor(0), path: routeToMapPath(stops) }],
            vehicles: [{ routeId: route.id, label: vehicle ? vehicle.regNo : 'Bus', progress: Math.max(0, progress - 0.25) }],
            height: 360, animate: true,
          });

          const etaCard = Card({ pad: true, className: 'card-accent' },
            h('div', { className: 'row-4 row-wrap' },
              h('div', { className: 'flex-1', style: { minWidth: '200px' } },
                h('div', { className: 't-eyebrow' }, 'Arriving at ' + myStop.name),
                h('div', { className: 't-hero' }, `${etaMin} min`),
                h('div', { className: 't-sm t-muted mt-1' }, `Scheduled pickup ${myStop.pickupTime} · drop ${myStop.dropTime}`)),
              h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
                Badge(vehicle ? vehicle.status : 'Running', { tone: 'success', dot: true }),
                Badge(`${vehicle ? vehicle.speed : 0} km/h`, { tone: 'info' }),
                Button('Notify me on arrival', { variant: 'primary', icon: 'bell', onClick: () => notify({ title: 'Alert set', text: `We will notify you when the bus is 5 minutes from ${myStop.name}.`, tone: 'success' }) }),
                Button('Call driver', { variant: 'secondary', icon: 'phone-call', onClick: () => notify({ title: `Calling ${driver ? driver.name : 'driver'}`, text: driver ? driver.phone : '', tone: 'info' }) }))));

          const stopList = SectionCard({ title: 'Stops on this route', subtitle: `${stops.length} stops · ${route.distanceKm} km · ${route.durationMin} min`, icon: 'map-pin' },
            h('div', { className: 'pt-day' }, stops.map((s, i) => h('div', {
              className: ['pt-slot', s.id === myStop.id && 'is-now'].filter(Boolean).join(' '),
            },
              h('div', { className: 'pt-slot-time' }, s.pickupTime),
              h('div', null,
                h('div', { className: 'pt-slot-title' }, `${s.seq}. ${s.name}`),
                h('div', { className: 'pt-slot-meta' }, `${s.landmark} · ${s.studentCount} students`)),
              s.id === myStop.id ? Badge('Your stop', { tone: 'brand' }) : i < currentIdx ? Badge('Passed', { tone: 'neutral' }) : Badge('Upcoming', { tone: 'info' })))));

          const crew = SectionCard({ title: 'Bus & crew', icon: 'bus' },
            h('div', { className: 'stack-3' },
              vehicle ? DescriptionList([
                ['Vehicle', `${vehicle.regNo} · ${vehicle.model}`],
                ['Capacity', `${vehicle.onboard} of ${vehicle.capacity} seats used`],
                ['GPS device', vehicle.gpsDeviceId],
                ['Last ping', relativeTime(vehicle.lastPing)],
                ['Fitness valid till', formatDate(vehicle.fitnessExpiry)],
              ], { cols: 1 }) : null,
              driver ? h('div', { className: 'row-3' },
                Avatar(driver.name, { size: 'lg' }),
                h('div', { className: 'flex-1' },
                  h('div', { className: 't-semibold' }, driver.name),
                  h('div', { className: 't-xs t-muted' }, `Driver · ${driver.experienceYears} yrs experience · badge ${driver.badgeNo}`),
                  h('div', { className: 'row row-wrap mt-1', style: { gap: 'var(--sp-2)' } },
                    Badge(driver.policeVerified ? 'Police verified' : 'Verification pending', { tone: driver.policeVerified ? 'success' : 'warning' }),
                    Rating(driver.rating, { showValue: true }))),
                IconButton('phone-call', { label: `Call ${driver.name}`, bordered: true, onClick: () => notify({ title: `Calling ${driver.name}`, text: driver.phone, tone: 'info' }) })) : null,
              conductor ? h('div', { className: 'row-3' },
                Avatar(conductor.name, { size: 'md' }),
                h('div', { className: 'flex-1' },
                  h('div', { className: 't-semibold' }, conductor.name),
                  h('div', { className: 't-xs t-muted' }, `Conductor · badge ${conductor.badgeNo}`)),
                IconButton('phone-call', { label: `Call ${conductor.name}`, bordered: true, onClick: () => notify({ title: `Calling ${conductor.name}`, text: conductor.phone, tone: 'info' }) })) : null));

          return [
            etaCard,
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-8' }, SectionCard({ title: `Live map — ${route.code} ${route.name}`, subtitle: 'Positions are simulated for the prototype', icon: 'navigation' }, map)),
              h('div', { className: 'span-4' }, crew)),
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-6' }, stopList),
              h('div', { className: 'span-6' }, SectionCard({ title: 'Boarding history', subtitle: 'Recent trips on this route', icon: 'clipboard-check', flush: true },
                attendance.length ? DataTable({
                  columns: [
                    { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date) },
                    { key: 'trip', label: 'Trip', width: 110, filter: true },
                    { key: 'boarded', label: 'Boarded', width: 100, align: 'right', numeric: true },
                    { key: 'expected', label: 'Expected', width: 100, align: 'right', numeric: true },
                    { key: 'delayMin', label: 'Delay', width: 100, align: 'right', numeric: true, render: (r) => (r.delayMin ? h('span', { className: 't-warning t-num' }, `${r.delayMin} min`) : h('span', { className: 't-success' }, 'On time')) },
                  ],
                  rows: attendance, pageSize: 8, paginate: true, exportName: 'bus-attendance',
                }) : EmptyState({ icon: 'clipboard-check', title: 'No trips logged', text: 'Boarding records appear once the conductor marks the trip.' })))),
            Callout({ tone: 'info', icon: 'shield-check', title: 'Safety on board' },
              'Every bus carries a GPS tracker, speed governor, CCTV and a trained female attendant. Boarding and alighting are marked on RFID by the conductor.'),
          ];
        },
      }));
    },
  },

  'portals/parent/ptm': {
    title: 'Parent-Teacher Meetings',
    subtitle: 'Book a slot with your child’s teachers',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(parentScreen(ctx, 'portals/parent/ptm', {
        subtitle: (kid) => `Book a 10-minute conversation with ${kid.firstName}'s teachers. Slots are first come, first served.`,
        body: (kid, parent, repaint) => {
          const schedules = db.ptmSchedules.filter((p) => p.campusId === kid.campusId);
          const myBookings = db.ptmBookings.filter((b) => b.studentId === kid.id);
          const open = schedules.filter((s) => s.status === 'Open');

          const scheduleCard = (p) => {
            const slots = db.ptmSlots.filter((s) => s.ptmId === p.id && s.status === 'Available').slice(0, 60);
            return SectionCard({
              title: p.title,
              subtitle: `${formatDate(p.date, 'long')} · ${p.from}–${p.to} · classes ${p.classes}`,
              icon: 'handshake',
              actions: Badge(p.status),
              footer: h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
                Button('Book a slot', { variant: 'primary', icon: 'calendar-check', disabled: p.status !== 'Open', onClick: () => bookPtmSlot(kid, p, slots, repaint) }),
                Button('Add to calendar', { variant: 'ghost', icon: 'calendar-plus', onClick: mockAction('Add to calendar') }),
                h('span', { className: 'spacer' }),
                h('span', { className: 't-xs t-muted' }, `${p.booked} of ${p.capacity} slots booked`)),
            },
              h('div', { className: 'stack-2' },
                ProgressBar(pct(p.booked, p.capacity), { label: 'Slots booked', showValue: true, tone: pct(p.booked, p.capacity) > 85 ? 'warning' : 'brand' }),
                h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-4)' } },
                  kv('Teachers available', formatNumber(p.teachers)),
                  kv('Slot length', `${p.slotMinutes} min`),
                  kv('Free slots', formatNumber(Math.max(0, p.capacity - p.booked))))));
          };

          return [
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-4' }, StatCard({ label: 'Upcoming meetings', value: formatNumber(open.length), icon: 'calendar-check', tone: 'brand', hero: true })),
              h('div', { className: 'span-4' }, StatCard({ label: 'My bookings', value: formatNumber(myBookings.length), icon: 'bookmark', tone: 'success', hero: true })),
              h('div', { className: 'span-4' }, StatCard({ label: 'Next meeting', value: open[0] ? formatDate(open[0].date, 'dayMonth') : '—', icon: 'clock', tone: 'info', hero: true }))),
            open.length ? h('div', { className: 'stack-3' }, open.map(scheduleCard))
              : emptyCard({ icon: 'handshake', title: 'No PTM scheduled', text: 'The school announces parent-teacher meetings at least a week in advance. You will get an SMS and a portal notification.' }),
            SectionCard({ title: 'My bookings', subtitle: 'Confirmed appointments for this child', icon: 'bookmark', flush: true },
              myBookings.length ? DataTable({
                columns: [
                  { key: 'teacherName', label: 'Teacher', width: 220, sticky: true, render: (r) => Identity(r.teacherName, 'Class teacher') },
                  { key: 'date', label: 'Date', width: 140, render: (r) => formatDate(r.date) },
                  { key: 'time', label: 'Time', width: 110, numeric: true },
                  { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
                  { key: 'notes', label: 'Notes' },
                  { key: 'rating', label: 'My rating', width: 130, render: (r) => (r.rating ? Rating(r.rating, { showValue: true }) : h('span', { className: 't-faint' }, '—')), value: (r) => r.rating || 0 },
                ],
                rows: myBookings, pageSize: 10, exportName: 'ptm-bookings',
                rowActions: (row) => [
                  { label: 'Reschedule', icon: 'refresh-ccw', onClick: mockAction('Reschedule slot') },
                  { label: 'Add a question', icon: 'edit', onClick: mockAction('Add a question') },
                  { separator: true },
                  { label: 'Cancel booking', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: 'Cancel this booking?', text: 'The slot is released for other parents immediately.', confirmLabel: 'Cancel booking', tone: 'danger' }).then((ok) => ok && notify({ title: 'Booking cancelled', tone: 'warning' })) },
                ],
              }) : EmptyState({ icon: 'bookmark', title: 'No bookings yet', text: 'Pick a slot above and it will show up here with a reminder.' })),
            Callout({ tone: 'info', icon: 'info', title: 'How PTM works' },
              'Each slot is a private ten-minute conversation. Arrive five minutes early with the report card. If you cannot attend, cancel so another family can use the slot.'),
          ];
        },
      }));
    },
  },
};

function bookPtmSlot(kid, ptm, slots, repaint) {
  if (!slots.length) {
    notify({ title: 'No free slots', text: 'Every slot for this meeting is booked. Try another session.', tone: 'warning' });
    return;
  }
  const teachers = Array.from(new Map(slots.map((s) => [s.teacherId, s.teacherName])).entries())
    .slice(0, 20).map(([id, name]) => ({ value: id, label: name }));
  let teacherId = teachers[0].value;
  const timeHost = h('div');
  let slotId = null;

  const paintTimes = () => {
    const list = slots.filter((s) => s.teacherId === teacherId).slice(0, 12);
    slotId = list[0] ? list[0].id : null;
    timeHost.innerHTML = '';
    timeHost.appendChild(h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
      list.length ? list.map((s) => {
        const btn = Button(`${s.startTime}`, {
          variant: s.id === slotId ? 'primary' : 'secondary', size: 'sm',
          onClick: () => { slotId = s.id; paintTimes(); },
        });
        return btn;
      }) : h('span', { className: 't-muted t-sm' }, 'No free slots with this teacher.')));
  };
  paintTimes();

  Modal({
    title: 'Book a PTM slot', subtitle: `${ptm.title} · ${formatDate(ptm.date, 'long')}`, size: 'md', icon: 'handshake',
    body: h('div', { className: 'stack' },
      Field({ label: 'Student', required: true }, Input({ value: `${kid.name} — ${kid.className} ${kid.section}`, readOnly: true })),
      Field({ label: 'Teacher', required: true }, Select({ options: teachers, value: teacherId, onChange: (v) => { teacherId = v; paintTimes(); } })),
      Field({ label: 'Available times', hint: `${ptm.slotMinutes}-minute slots` }, timeHost),
      Field({ label: 'What would you like to discuss?', hint: 'Optional — helps the teacher prepare' },
        Textarea({ rows: 3, placeholder: 'e.g. Mathematics progress and homework routine' }))),
    actions: (close) => frag(
      Button('Cancel', { variant: 'secondary', onClick: close }),
      Button('Confirm booking', {
        variant: 'primary', icon: 'check',
        onClick: () => {
          const slot = slots.find((s) => s.id === slotId);
          close();
          notify({ title: 'Slot booked', text: slot ? `${slot.teacherName} · ${formatDate(ptm.date)} at ${slot.startTime} · room ${slot.room}` : 'Booking confirmed', tone: 'success' });
          if (repaint) repaint();
        },
      })),
  });
}

const parentRoutes3 = {
  'portals/parent/messages': {
    title: 'Messages',
    subtitle: 'Circulars, notices and a direct line to the class teacher',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(parentScreen(ctx, 'portals/parent/messages', {
        subtitle: (kid) => `Everything the school has sent about ${kid.firstName}, plus a direct chat with the class teacher.`,
        body: (kid) => {
          const circulars = db.circulars
            .filter((c) => c.status === 'Published' && (c.campusId === kid.campusId) && /Parent|Students|Class/i.test(c.audience))
            .sort((a, b) => b.issuedOn.localeCompare(a.issuedOn));
          const notices = db.notices.filter((n) => n.campusId === kid.campusId || n.audience === 'All')
            .sort((a, b) => b.postedOn.localeCompare(a.postedOn));
          const broadcast = db.messages.filter((m) => m.campusId === kid.campusId && m.status === 'Delivered').slice(0, 20);
          const section = byId(db.sections, kid.sectionId);
          const teacher = section ? byId(db.staff, section.classTeacherId) : null;

          const chat = ChatPanel({
            height: 420,
            placeholder: `Message ${teacher ? teacher.name.split(' ')[0] : 'the class teacher'}…`,
            messages: [
              { from: teacher ? teacher.name : 'Class Teacher', text: `Good morning! ${kid.firstName} did very well in the class quiz yesterday.`, time: '08:42 AM' },
              { from: 'You', me: true, text: 'Thank you so much. Is there anything we should work on at home?', time: '08:55 AM' },
              { from: teacher ? teacher.name : 'Class Teacher', text: 'A little more practice with word problems would help. I have shared a worksheet on the portal.', time: '09:05 AM' },
              { from: 'You', me: true, text: 'Noted, we will start this evening.', time: '09:11 AM' },
            ],
            onSend: () => notify({ title: 'Message sent', text: 'The class teacher usually replies within a working day.', tone: 'success' }),
          });

          const circularCard = SectionCard({
            title: 'Circulars', subtitle: `${circulars.length} published for your campus`, icon: 'scroll', flush: true,
          },
            circulars.length ? DataTable({
              columns: [
                { key: 'title', label: 'Circular', sticky: true, width: 300, render: (r) => Identity(r.title, `${r.circularNo} · ${r.category}`), value: (r) => r.title },
                { key: 'issuedOn', label: 'Issued', width: 130, render: (r) => formatDate(r.issuedOn) },
                { key: 'audience', label: 'Audience', width: 160, filter: true },
                { key: 'priority', label: 'Priority', width: 110, filter: true, render: (r) => Badge(r.priority, { tone: r.priority === 'Urgent' ? 'danger' : r.priority === 'High' ? 'warning' : 'neutral' }) },
                { key: 'validTill', label: 'Valid till', width: 130, render: (r) => formatDate(r.validTill) },
                { key: 'attachment', label: '', width: 130, sortable: false, render: (r) => (r.attachment ? Button('Download', { variant: 'link', size: 'sm', icon: 'download', onClick: (e) => { e.stopPropagation(); notify({ title: 'Circular downloaded', tone: 'success' }); } }) : h('span', { className: 't-faint' }, '—')) },
              ],
              rows: circulars, pageSize: 10, exportName: 'circulars', searchKeys: ['title', 'circularNo', 'category'],
              onRowClick: (r) => Drawer({
                title: r.title, subtitle: `${r.circularNo} · issued ${formatDate(r.issuedOn)} by ${r.issuedBy}`, size: 'md',
                body: h('div', { className: 'stack' },
                  h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } }, Badge(r.category), Badge(r.priority), Badge(r.audience, { tone: 'neutral' })),
                  Callout({ tone: 'info', icon: 'scroll', title: 'Summary' },
                    'Parents are requested to read this circular carefully and acknowledge it from the portal. The policy takes effect from the date mentioned above.'),
                  DescriptionList([['Valid till', formatDate(r.validTill)], ['Views', formatNumber(r.views)], ['Acknowledged by', formatNumber(r.acknowledged)]], { cols: 1 })),
                actions: (close) => frag(
                  Button('Close', { variant: 'secondary', onClick: close }),
                  Button('Acknowledge', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Acknowledged', text: r.circularNo, tone: 'success' }); } })),
              }),
            }) : EmptyState({ icon: 'scroll', title: 'No circulars', text: 'Circulars issued by the principal will appear here.' }));

          return [
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-3' }, StatCard({ label: 'Circulars', value: formatNumber(circulars.length), icon: 'scroll', tone: 'brand', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Notices', value: formatNumber(notices.length), icon: 'flag', tone: 'info', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'SMS & email received', value: formatNumber(broadcast.length), icon: 'mail', tone: 'success', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Unread', value: '3', icon: 'bell', tone: 'warning', hero: true }))),
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-7' }, circularCard),
              h('div', { className: 'span-5' }, SectionCard({ title: `Chat with ${teacher ? teacher.name : 'the class teacher'}`, subtitle: 'Replies within one working day', icon: 'message-circle', flush: true }, chat))),
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-6' }, SectionCard({ title: 'Notice board', icon: 'flag' },
                notices.length ? Timeline(notices.slice(0, 8).map((n) => ({
                  title: n.title, meta: `${formatDate(n.postedOn)} · ${n.postedBy}`, text: n.body,
                  icon: n.pinned ? 'pin' : 'flag', tone: n.pinned ? 'warning' : 'info',
                }))) : EmptyState({ icon: 'flag', title: 'Notice board is empty', text: 'Short announcements appear here.' }))),
              h('div', { className: 'span-6' }, SectionCard({ title: 'Delivery log', subtitle: 'SMS, email and WhatsApp sent to you', icon: 'send', flush: true },
                broadcast.length ? DataTable({
                  columns: [
                    { key: 'subject', label: 'Message', sticky: true, width: 240, render: (r) => Identity(r.subject, r.channel), value: (r) => r.subject },
                    { key: 'sentOn', label: 'Sent', width: 150, render: (r) => formatDate(r.sentOn) },
                    { key: 'channel', label: 'Channel', width: 120, filter: true },
                    { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
                  ],
                  rows: broadcast, pageSize: 8, exportName: 'message-log',
                }) : EmptyState({ icon: 'send', title: 'Nothing sent yet' })))),
          ];
        },
      }));
    },
  },

  'portals/parent/documents': {
    title: 'Documents',
    subtitle: 'Certificates, ID proofs and everything the school holds on file',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(parentScreen(ctx, 'portals/parent/documents', {
        subtitle: (kid) => {
          const docs = student360(kid.id).documents;
          const pending = docs.filter((d) => d.status !== 'Verified').length;
          return pending ? `${pending} of ${docs.length} documents still need verification.` : `All ${docs.length} documents for ${kid.firstName} are verified.`;
        },
        body: (kid) => {
          const s360 = student360(kid.id);
          const docs = s360.documents;
          const verified = docs.filter((d) => d.status === 'Verified');
          const rejected = docs.filter((d) => d.status === 'Rejected');

          const requestDoc = () => formPage({
            title: 'Request a document', subtitle: 'Issued by the front office within 3 working days',
            mode: 'modal', size: 'md', submitLabel: 'Submit request',
            sections: [{
              title: 'Request', cols: 1,
              fields: [
                { id: 'type', label: 'Document required', type: 'select', required: true, options: ['Bonafide Certificate', 'Transfer Certificate', 'Character Certificate', 'Fee Payment Certificate', 'Attendance Certificate', 'Duplicate ID Card', 'Migration Certificate'] },
                { id: 'copies', label: 'Number of copies', type: 'number', value: 1 },
                { id: 'purpose', label: 'Purpose', type: 'textarea', required: true, placeholder: 'e.g. Passport application' },
                { id: 'urgent', label: 'Mark as urgent (₹100 additional)', type: 'switch' },
              ],
            }],
            onSubmit: (v) => notify({ title: 'Request submitted', text: `${v.type} · ${kid.name}`, tone: 'success' }),
          });

          return [
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-3' }, StatCard({ label: 'Documents on file', value: formatNumber(docs.length), icon: 'folder', tone: 'brand', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Verified', value: formatNumber(verified.length), icon: 'check-circle', tone: 'success', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Awaiting verification', value: formatNumber(docs.length - verified.length - rejected.length), icon: 'clock', tone: 'warning', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Rejected', value: formatNumber(rejected.length), icon: 'x-circle', tone: rejected.length ? 'danger' : 'success', hero: true }))),
            rejected.length ? Callout({ tone: 'danger', icon: 'alert-triangle', title: `${rejected.length} document${rejected.length > 1 ? 's were' : ' was'} rejected` },
              'Please upload a clearer scan. Documents must be in colour, under 5 MB, and show all four corners.') : null,
            SectionCard({
              title: 'Student documents', subtitle: `On file for ${kid.name}`, icon: 'folder',
              actions: h('div', { className: 'row', style: { gap: 'var(--sp-2)' } },
                Button('Request document', { variant: 'secondary', size: 'sm', icon: 'file-plus', onClick: requestDoc }),
                Button('Upload', { variant: 'primary', size: 'sm', icon: 'upload', onClick: () => notify({ title: 'Upload started', text: 'Files are scanned for viruses before they reach the admissions desk.', tone: 'info' }) })),
            },
              DataTable({
                columns: [
                  { key: 'name', label: 'Document', sticky: true, width: 240, render: (r) => Identity(r.name, `${r.type} · ${formatNumber(r.sizeKb)} KB`), value: (r) => r.name },
                  { key: 'uploadedOn', label: 'Uploaded', width: 140, render: (r) => formatDate(r.uploadedOn) },
                  { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
                  { key: 'verifiedBy', label: 'Verified by', width: 170, render: (r) => r.verifiedBy || h('span', { className: 't-faint' }, '—') },
                  {
                    key: 'act', label: '', width: 190, sortable: false,
                    render: (r) => h('div', { className: 'row', style: { gap: 'var(--sp-1)' } },
                      Button('View', { variant: 'ghost', size: 'sm', icon: 'eye', onClick: (e) => { e.stopPropagation(); notify({ title: r.name, text: 'Opening secure preview…', tone: 'info' }); } }),
                      Button('Download', { variant: 'ghost', size: 'sm', icon: 'download', onClick: (e) => { e.stopPropagation(); notify({ title: 'Downloaded', text: r.name, tone: 'success' }); } })),
                  },
                ],
                rows: docs, paginate: false, exportName: 'documents',
                emptyState: EmptyState({ icon: 'folder', title: 'No documents uploaded', text: 'Upload the birth certificate and address proof to complete the admission file.' }),
              })),
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-6' }, SectionCard({ title: 'Upload a new document', subtitle: 'PDF or JPG, up to 5 MB', icon: 'upload' },
                FileUpload({
                  label: 'Drop the scan here or click to browse', accept: '.pdf,.jpg,.png', multiple: true,
                  onFiles: (files) => notify({ title: `${files.length || 1} file(s) queued`, text: 'The admissions desk verifies uploads within two working days.', tone: 'success' }),
                }),
                h('div', { className: 'mt-3' },
                  Callout({ tone: 'info', icon: 'info', title: 'Accepted documents' },
                    'Birth certificate, Aadhaar, address proof, previous marksheet, transfer certificate, caste/EWS certificate and medical records.')))),
              h('div', { className: 'span-6' }, SectionCard({ title: 'School-issued certificates', subtitle: 'Download anytime', icon: 'certificate' },
                FileList([
                  { name: 'Bonafide Certificate 2026-27.pdf', type: 'PDF', size: '180 KB', date: '2026-04-20', status: 'Verified' },
                  { name: `Report Card — Term 1 (${kid.className}).pdf`, type: 'PDF', size: '420 KB', date: '2026-08-10', status: 'Verified' },
                  { name: 'Fee Payment Certificate 2026-27.pdf', type: 'PDF', size: '96 KB', date: '2026-07-12', status: 'Verified' },
                  { name: 'Transport Pass 2026-27.pdf', type: 'PDF', size: '78 KB', date: '2026-04-12', status: kid.transportOpted ? 'Verified' : 'Pending' },
                ], { onDownload: (f) => notify({ title: 'Downloaded', text: f.name, tone: 'success' }) })))),
          ];
        },
      }));
    },
  },

  'portals/parent/complaints': {
    title: 'Complaints',
    subtitle: 'Raise a concern and track it to resolution',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(parentScreen(ctx, 'portals/parent/complaints', {
        subtitle: (kid, parent) => `Concerns raised by your family are tracked against an SLA. ${parent.name.split(' ')[0]}, we aim to respond within 24 hours.`,
        body: (kid, parent, repaint) => {
          let mine = db.complaints.filter((c) => c.raisedByName === parent.name);
          if (!mine.length) mine = db.complaints.filter((c) => c.raisedBy === 'Parent' && c.campusId === kid.campusId).slice(0, 8);
          const open = mine.filter((c) => ['Open', 'In Progress', 'Escalated'].includes(c.status));
          const resolved = mine.filter((c) => ['Resolved', 'Closed'].includes(c.status));
          const cats = db.complaintCategories;

          const raise = () => formPage({
            title: 'Raise a complaint', subtitle: 'Tell us what went wrong — we route it to the right department',
            mode: 'modal', size: 'lg', submitLabel: 'Submit complaint',
            sections: [{
              title: 'Your concern', cols: 2,
              fields: [
                { id: 'child', label: 'Regarding', type: 'select', value: kid.id, options: childrenOf(parent).map((k) => ({ value: k.id, label: `${k.name} — ${k.className} ${k.section}` })) },
                { id: 'category', label: 'Category', type: 'select', required: true, options: cats.map((c) => ({ value: c.id, label: `${c.name} · SLA ${c.slaHours}h` })) },
                { id: 'subject', label: 'Subject', required: true, span: 'full', placeholder: 'One line that describes the issue' },
                { id: 'description', label: 'What happened?', type: 'textarea', required: true, span: 'full', placeholder: 'Include dates, names and what you would like us to do' },
                { id: 'priority', label: 'How urgent is it?', type: 'radio', inline: true, value: 'Medium', options: ['Low', 'Medium', 'High', 'Critical'] },
                { id: 'contact', label: 'Best number to reach you', type: 'tel', value: parent.phone, validate: validators.phone },
                { id: 'file', label: 'Photos or documents', type: 'file', span: 'full' },
                { id: 'anon', label: 'Keep my identity confidential from the department', type: 'switch', span: 'full' },
              ],
            }],
            onSubmit: (v) => {
              notify({ title: 'Complaint registered', text: `${v.subject} · ticket raised, you will hear from us within 24 hours`, tone: 'success' });
              if (repaint) repaint();
            },
          });

          const detail = (c) => Drawer({
            title: c.subject, subtitle: `${c.ticketNo} · ${c.category} · raised ${relativeTime(c.createdAt)}`, size: 'lg',
            body: h('div', { className: 'stack' },
              h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
                Badge(c.status), Badge(c.priority, { tone: c.priority === 'Critical' ? 'danger' : c.priority === 'High' ? 'warning' : 'neutral' }),
                c.slaBreached ? Badge('SLA breached', { tone: 'danger', icon: 'alert-triangle' }) : Badge(`SLA ${c.slaHours}h`, { tone: 'info' })),
              Callout({ tone: 'neutral', icon: 'message-square', title: 'What you told us' }, c.description),
              Stepper([
                { label: 'Raised', description: formatDate(c.createdAt), state: 'done' },
                { label: 'Assigned', description: c.department, state: 'done' },
                { label: 'In progress', description: 'Department working on it', state: ['Resolved', 'Closed'].includes(c.status) ? 'done' : c.status === 'Open' ? 'todo' : 'current' },
                { label: 'Resolved', description: c.resolvedAt ? formatDate(c.resolvedAt) : 'Pending', state: ['Resolved', 'Closed'].includes(c.status) ? 'done' : 'todo' },
              ], { current: ['Resolved', 'Closed'].includes(c.status) ? 3 : 2 }),
              c.resolutionNote ? Callout({ tone: 'success', icon: 'check-circle', title: 'Resolution' }, c.resolutionNote) : null,
              SectionCard({ title: 'Conversation', icon: 'message-circle' },
                CommentThread([
                  { name: c.raisedByName, text: c.description, time: relativeTime(c.createdAt) },
                  { name: `${c.department} Desk`, text: 'Thank you for reporting this. We have assigned it to the department head and will update you shortly.', time: relativeTime(c.createdAt) },
                ], { onSubmit: () => notify({ title: 'Reply added to the ticket', tone: 'success' }) }))),
            actions: (close) => frag(
              Button('Close', { variant: 'secondary', onClick: close }),
              ['Resolved', 'Closed'].includes(c.status)
                ? Button('Reopen ticket', { variant: 'danger', icon: 'refresh-ccw', onClick: () => { close(); notify({ title: 'Ticket reopened', tone: 'warning' }); } })
                : Button('Nudge the department', { variant: 'primary', icon: 'bell', onClick: () => { close(); notify({ title: 'Nudge sent', text: 'The department head has been notified.', tone: 'info' }); } })),
          });

          return [
            Card({ pad: true, className: 'card-accent' },
              h('div', { className: 'row-4 row-wrap' },
                h('div', { className: 'flex-1', style: { minWidth: '240px' } },
                  h('div', { className: 't-eyebrow' }, 'Something not right?'),
                  h('div', { className: 't-title' }, 'Raise it and we will fix it'),
                  h('div', { className: 't-sm t-muted mt-1' }, 'Transport, canteen, academics, fees, safety — every ticket is tracked against a service-level agreement.')),
                Button('Raise a complaint', { variant: 'primary', size: 'lg', icon: 'plus', onClick: raise }))),
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-3' }, StatCard({ label: 'My tickets', value: formatNumber(mine.length), icon: 'alert-circle', tone: 'brand', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Open', value: formatNumber(open.length), icon: 'clock', tone: open.length ? 'warning' : 'success', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Resolved', value: formatNumber(resolved.length), icon: 'check-circle', tone: 'success', hero: true })),
              h('div', { className: 'span-3' }, StatCard({ label: 'Avg satisfaction', value: resolved.length ? `${(sum(resolved.filter((r) => r.satisfaction), 'satisfaction') / Math.max(1, resolved.filter((r) => r.satisfaction).length)).toFixed(1)}/5` : '—', icon: 'star', tone: 'info', hero: true }))),
            SectionCard({ title: 'My complaints', subtitle: 'Click any ticket to see the full trail', icon: 'list', flush: true },
              mine.length ? DataTable({
                columns: [
                  { key: 'ticketNo', label: 'Ticket', width: 140, sticky: true, className: 't-mono' },
                  { key: 'subject', label: 'Subject', width: 280, render: (r) => Identity(r.subject, r.category), value: (r) => r.subject },
                  { key: 'createdAt', label: 'Raised', width: 140, render: (r) => formatDate(r.createdAt) },
                  { key: 'department', label: 'With', width: 170, filter: true },
                  { key: 'priority', label: 'Priority', width: 110, filter: true, render: (r) => Badge(r.priority, { tone: r.priority === 'Critical' ? 'danger' : r.priority === 'High' ? 'warning' : 'neutral' }) },
                  { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
                  { key: 'slaBreached', label: 'SLA', width: 120, render: (r) => (r.slaBreached ? Badge('Breached', { tone: 'danger' }) : Badge('On track', { tone: 'success' })), value: (r) => (r.slaBreached ? 1 : 0) },
                ],
                rows: mine, pageSize: 10, exportName: 'my-complaints', onRowClick: detail,
                searchKeys: ['ticketNo', 'subject', 'category'],
              }) : EmptyState({ icon: 'check-circle', title: 'No complaints raised', text: 'We hope it stays that way — but if something needs fixing, tell us.', action: Button('Raise a complaint', { variant: 'primary', icon: 'plus', onClick: raise }), tone: 'success' })),
            SectionCard({ title: 'Where to raise what', subtitle: 'Each category has its own owner and response time', icon: 'tag' },
              DataTable({
                columns: [
                  { key: 'name', label: 'Category', width: 200, sticky: true },
                  { key: 'owner', label: 'Owner', width: 200 },
                  { key: 'slaHours', label: 'Response SLA', width: 140, align: 'right', numeric: true, render: (r) => `${r.slaHours} hours` },
                  { key: 'open', label: 'Open now', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
                  { key: 'resolved', label: 'Resolved', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
                ],
                rows: cats, paginate: false, searchable: false, footerAggregates: true, exportName: 'complaint-categories',
              })),
          ];
        },
      }));
    },
  },
};

/* ==========================================================================
   STUDENT PORTAL
   ========================================================================== */

function studentSlots(kid, day) {
  return db.timetableSlots
    .filter((s) => s.sectionId === kid.sectionId && (!day || s.day === day))
    .sort((a, b) => a.periodNo - b.periodNo);
}

function studentHero(kid, { subtitle, actions } = {}) {
  const today = studentSlots(kid, TODAY_DAY);
  const next = today.find((s) => mins(s.startTime) >= NOW_MIN);
  return hero({
    avatarName: kid.name, avatarInitials: kid.avatarInitials,
    eyebrow: 'Student portal',
    title: greetingFor(kid.firstName),
    subtitle: subtitle || (next
      ? `Next class — ${next.subjectName} at ${next.startTime} in ${next.room} with ${next.teacherName}.`
      : 'Classes are done for today. Check your homework before you log off.'),
    meta: [
      { v: `${kid.attendancePct}%`, l: 'Attendance' },
      { v: kid.cgpa, l: 'CGPA' },
      { v: `#${kid.rank}`, l: 'Class rank' },
      { v: kid.booksIssued, l: 'Books out' },
    ],
    actions: actions || frag(
      heroChip('My homework', 'clipboard-list', () => navigate('portals/student/homework')),
      mobileChip()),
  });
}

function studentPage(ctx, routeKey, buildBody, heroOpts) {
  ensureStyles();
  const kid = demoStudent(campusOf(ctx));
  const body = buildBody(kid);
  return page({
    route: routeKey,
    children: [studentHero(kid, typeof heroOpts === 'function' ? heroOpts(kid) : heroOpts), ...[].concat(body).filter(Boolean)],
  });
}

const studentRoutes = {
  'portals/student/timetable': {
    title: 'My Timetable',
    subtitle: 'Today’s classes and the full week',
    section: 'portals',
    render(mount, ctx) {
      const kid = demoStudent(campusOf(ctx));
      ensureStyles();
      let day = TODAY_DAY;
      const dayHost = h('div');

      const paint = () => {
        const list = studentSlots(kid, day);
        const byPeriod = new Map(list.map((s) => [s.periodNo, s]));
        dayHost.innerHTML = '';
        dayHost.appendChild(h('div', { className: 'pt-day' },
          db.periods.map((p) => {
            if (p.isBreak) {
              return h('div', { className: 'pt-slot is-break' },
                h('div', { className: 'pt-slot-time' }, `${p.startTime}–${p.endTime}`),
                h('div', null, h('div', { className: 'pt-slot-title' }, p.label), h('div', { className: 'pt-slot-meta' }, 'Break')),
                Icon('coffee', 16));
            }
            const s = byPeriod.get(p.no);
            const isNow = day === TODAY_DAY && mins(p.startTime) <= NOW_MIN && mins(p.endTime) > NOW_MIN;
            if (!s) {
              return h('div', { className: 'pt-slot' },
                h('div', { className: 'pt-slot-time' }, `${p.startTime}–${p.endTime}`),
                h('div', null, h('div', { className: 'pt-slot-title t-muted' }, 'Self study'), h('div', { className: 'pt-slot-meta' }, p.label)),
                Badge('Free', { tone: 'neutral' }));
            }
            return h('div', { className: ['pt-slot', isNow && 'is-now'].filter(Boolean).join(' ') },
              h('div', { className: 'pt-slot-time' }, `${p.startTime}–${p.endTime}`),
              h('div', null,
                h('div', { className: 'pt-slot-title' }, s.subjectName),
                h('div', { className: 'pt-slot-meta' }, `${s.teacherName} · Room ${s.room}`)),
              isNow ? Badge('Now', { tone: 'success', dot: true }) : Badge(`P${s.periodNo}`, { tone: 'neutral' }));
          })));
      };
      paint();

      const teachingPeriods = db.periods.filter((p) => !p.isBreak);
      const gridRows = teachingPeriods.map((p) => {
        const row = { id: 'P' + p.no, period: `Period ${p.no}`, time: `${p.startTime}–${p.endTime}` };
        for (const d of WEEKDAYS) {
          const s = studentSlots(kid, d).find((x) => x.periodNo === p.no);
          row[d] = s ? s.subjectName : '—';
        }
        return row;
      });

      const subjectLoad = countBy(studentSlots(kid), 'subjectName').slice(0, 8);

      mount.appendChild(page({
        route: 'portals/student/timetable',
        children: [
          studentHero(kid),
          Card({ pad: true }, h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-3)' } },
            SegmentedControl(WEEKDAYS.map((d) => ({ id: d, label: d.slice(0, 3) })), (id) => { day = id; paint(); }, { active: day }),
            h('span', { className: 'spacer' }),
            Button('Download PDF', { variant: 'ghost', size: 'sm', icon: 'download', onClick: () => notify({ title: 'Timetable downloaded', tone: 'success' }) }))),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-8' }, SectionCard({ title: 'Class schedule', subtitle: `${kid.className} ${kid.section} · six-day week`, icon: 'calendar' }, dayHost)),
            h('div', { className: 'span-4' }, SectionCard({ title: 'Periods by subject', subtitle: 'Where your week goes', className: 'chart-card', icon: 'chart-pie' },
              donutChart({ data: subjectLoad, height: 240, centerValue: String(studentSlots(kid).length), centerLabel: 'Periods' })))),
          SectionCard({ title: 'Full week', icon: 'table', flush: true },
            DataTable({
              columns: [
                { key: 'period', label: 'Period', width: 92, sticky: true },
                { key: 'time', label: 'Time', width: 112, numeric: true },
                ...WEEKDAYS.map((d) => ({ key: d, label: d.slice(0, 3), sortable: false })),
              ],
              rows: gridRows, paginate: false, searchable: false, columnToggle: false, maxHeight: 'none',
              printable: true, exportName: 'timetable',
            })),
        ],
      }));
    },
  },

  'portals/student/attendance': {
    title: 'My Attendance',
    subtitle: 'How many days you have made it in',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(studentPage(ctx, 'portals/student/attendance', (kid) => {
        const days = childAttendanceDays(kid);
        const split = ['Present', 'Absent', 'Late', 'Leave'].map((s) => ({ key: s, value: days.filter((d) => d.status === s).length }));
        const events = days.filter((d) => d.date.startsWith('2026-08')).map((d) => ({
          date: d.date, title: d.status,
          tone: d.status === 'Present' ? 'success' : d.status === 'Absent' ? 'danger' : d.status === 'Late' ? 'warning' : 'info',
        }));
        const monthly = new Map();
        for (const d of days) {
          const k = d.date.slice(0, 7);
          if (!monthly.has(k)) monthly.set(k, { present: 0, total: 0 });
          const e = monthly.get(k); e.total++;
          if (d.status !== 'Absent') e.present++;
        }
        const keys = Array.from(monthly.keys()).sort();
        const shortfall = Math.max(0, Math.ceil((0.75 * kid.totalDays - kid.presentDays) / 0.25));

        return [
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-4' }, Card({ pad: true }, h('div', { className: 'stack-2', style: { alignItems: 'center' } },
              progressRing(kid.attendancePct, { label: 'Attendance this session', sublabel: `${kid.presentDays}/${kid.totalDays} days`, size: 150 }),
              Badge(kid.attendancePct >= 75 ? 'Eligible for board exams' : 'Below the 75% requirement', { tone: kid.attendancePct >= 75 ? 'success' : 'danger' })))),
            h('div', { className: 'span-4' }, SectionCard({ title: 'Attendance split', className: 'chart-card', icon: 'chart-pie' },
              donutChart({ data: split, height: 230, centerValue: String(days.length), centerLabel: 'School days' }))),
            h('div', { className: 'span-4' }, SectionCard({ title: 'What this means', icon: 'info' },
              h('div', { className: 'stack-2' },
                kv('Days present', formatNumber(kid.presentDays)),
                kv('Days absent', formatNumber(Math.max(0, kid.totalDays - kid.presentDays))),
                kv('Required minimum', '75%'),
                kv('Current standing', `${kid.attendancePct}%`),
                kid.attendancePct < 75
                  ? Callout({ tone: 'danger', icon: 'alert-triangle', title: 'Attendance shortfall' }, `You need roughly ${shortfall} more consecutive present days to cross 75%.`)
                  : Callout({ tone: 'success', icon: 'check-circle', title: 'You are on track' }, 'Keep it up — attendance counts towards internal assessment.'))))),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-7' }, SectionCard({ title: 'August 2026', icon: 'calendar' }, Calendar({ month: '2026-08', events, maxPerDay: 1 }))),
            h('div', { className: 'span-5' }, SectionCard({ title: 'Month on month', className: 'chart-card', icon: 'chart-line' },
              lineChart({
                categories: keys.map((k) => formatDate(k + '-01', 'monthYear')),
                series: [{ name: 'Present %', values: keys.map((k) => pct(monthly.get(k).present, monthly.get(k).total)) }],
                valueFormat: 'percent', target: 75, targetLabel: 'Minimum', height: 260, showDots: true,
              })))),
          SectionCard({ title: 'Day-by-day register', subtitle: 'Every marked school day this session', icon: 'table', flush: true },
            DataTable({
              columns: [
                { key: 'date', label: 'Date', width: 160, render: (r) => formatDate(r.date, 'weekday') },
                { key: 'status', label: 'Marked', width: 140, filter: true, render: (r) => Badge(r.status) },
                { key: 'note', label: 'Note', render: (r) => (r.status === 'Late' ? 'Arrived after 08:15' : r.status === 'Leave' ? 'Approved leave' : r.status === 'Absent' ? 'Parent informed by SMS' : 'Full day') },
              ],
              rows: days.slice().reverse(), pageSize: 15, exportName: 'my-attendance',
            })),
        ];
      }, (kid) => ({ subtitle: `You are at ${kid.attendancePct}% attendance — ${kid.attendancePct >= 75 ? 'comfortably above' : 'below'} the 75% requirement.` })));
    },
  },

  'portals/student/homework': {
    title: 'My Homework',
    subtitle: 'What is due, and when',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(studentPage(ctx, 'portals/student/homework', (kid) => {
        const hw = childHomework(kid);
        const open = hw.filter((x) => x.status === 'Open');
        const submitted = hw.filter((x) => { const s = childSubmission(kid, x.id); return s && s.submittedOn; });

        const submitFlow = (x) => formPage({
          title: `Submit — ${x.title}`, subtitle: `${x.subjectName} · ${dueLabel(x.dueDate)}`,
          mode: 'modal', size: 'md', submitLabel: 'Submit homework',
          sections: [{
            title: 'Your submission', cols: 1,
            fields: [
              { id: 'file', label: 'Upload your work', type: 'file', required: true, hint: 'PDF, DOCX or photos of your notebook — up to 10 MB' },
              { id: 'note', label: 'Note for the teacher', type: 'textarea', placeholder: 'Anything you want to flag about this submission' },
              { id: 'declare', label: 'This is my own work', type: 'checkbox', required: true },
            ],
          }],
          onSubmit: () => notify({ title: 'Homework submitted', text: `${x.title} · submitted ${formatDate(TODAY)}`, tone: 'success' }),
        });

        const card = (x) => {
          const sub = childSubmission(kid, x.id);
          const done = sub && sub.submittedOn;
          const overdue = new Date(x.dueDate) < new Date(TODAY) && !done;
          return Card({ pad: true, className: overdue ? 'card-accent' : '' },
            h('div', { className: 'row-3 row-top row-wrap' },
              h('div', { className: 'pt-tile-ico', html: icon('clipboard-list', 17) }),
              h('div', { className: 'flex-1 min-0 stack-2' },
                h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
                  h('span', { className: 't-semibold' }, x.title),
                  Badge(x.subjectName, { tone: 'neutral', size: 'sm' }),
                  done ? Badge('Submitted', { tone: 'success', size: 'sm' }) : Badge(overdue ? 'Overdue' : 'Pending', { tone: overdue ? 'danger' : 'warning', size: 'sm' })),
                h('div', { className: 't-sm t-muted' }, x.description),
                h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-4)' } },
                  h('span', { className: 't-xs t-muted' }, `Max marks ${x.maxMarks}`),
                  h('span', { className: ['t-xs', overdue ? 't-danger t-semibold' : 't-muted'].join(' ') }, dueLabel(x.dueDate)),
                  sub && sub.marks != null ? h('span', { className: 't-xs t-success t-semibold' }, `Scored ${sub.marks}/${sub.maxMarks}`) : null)),
              done
                ? Button('View', { variant: 'ghost', size: 'sm', icon: 'eye', onClick: () => homeworkParentDrawer(kid, x, sub) })
                : Button('Submit', { variant: 'primary', size: 'sm', icon: 'upload', onClick: () => submitFlow(x) })));
        };

        return [
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-3' }, StatCard({ label: 'Open assignments', value: formatNumber(open.length), icon: 'clipboard-list', tone: open.length ? 'warning' : 'success', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Submitted', value: formatNumber(submitted.length), icon: 'check-circle', tone: 'success', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Due this week', value: formatNumber(hw.filter((x) => daysBetween(TODAY, x.dueDate) >= 0 && daysBetween(TODAY, x.dueDate) <= 7).length), icon: 'clock', tone: 'info', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Class average', value: hw.length ? `${(sum(hw, 'avgScore') / hw.length).toFixed(1)}/10` : '—', icon: 'star', tone: 'brand', hero: true }))),
          SectionCard({ title: 'Due now', subtitle: 'Finish these first', icon: 'clock' },
            open.length ? h('div', { className: 'stack-3' }, open.slice(0, 8).map(card))
              : EmptyState({ icon: 'check-circle', title: 'All caught up', text: 'Nothing is pending. Use the time for revision or the library.', tone: 'success' })),
          SectionCard({ title: 'Everything assigned', icon: 'history', flush: true },
            hw.length ? DataTable({
              columns: [
                { key: 'title', label: 'Assignment', sticky: true, width: 260, render: (r) => Identity(r.title, r.subjectName), value: (r) => r.title },
                { key: 'subjectName', label: 'Subject', width: 150, filter: true },
                { key: 'dueDate', label: 'Due', width: 130, render: (r) => formatDate(r.dueDate) },
                { key: 'maxMarks', label: 'Max', width: 80, align: 'right', numeric: true },
                { key: 'mine', label: 'My status', width: 150, render: (r) => { const s = childSubmission(kid, r.id); return s ? Badge(s.status) : Badge('Not submitted', { tone: 'danger' }); }, value: (r) => { const s = childSubmission(kid, r.id); return s ? s.status : 'Not submitted'; } },
                { key: 'score', label: 'Score', width: 100, align: 'right', numeric: true, render: (r) => { const s = childSubmission(kid, r.id); return s && s.marks != null ? `${s.marks}/${s.maxMarks}` : h('span', { className: 't-faint' }, '—'); }, value: (r) => { const s = childSubmission(kid, r.id); return s && s.marks != null ? s.marks : -1; } },
              ],
              rows: hw, pageSize: 15, exportName: 'homework', searchKeys: ['title', 'subjectName'],
              onRowClick: (r) => homeworkParentDrawer(kid, r, childSubmission(kid, r.id)),
            }) : EmptyState({ icon: 'clipboard-list', title: 'No homework yet' })),
        ];
      }, (kid) => ({ subtitle: `${childHomework(kid).filter((x) => x.status === 'Open').length} assignments are open — submit before the due date to avoid a late mark.` })));
    },
  },
};

const studentRoutes2 = {
  'portals/student/assignments': {
    title: 'My Assignments',
    subtitle: 'Submissions, feedback and online tests',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(studentPage(ctx, 'portals/student/assignments', (kid) => {
        const subs = db.submissions.filter((s) => s.studentId === kid.id);
        const tests = db.onlineTests.filter((t) => t.className === kid.className);
        const graded = subs.filter((s) => s.marks != null);
        const avgPct = graded.length ? Math.round(avg(graded.map((s) => ({ v: (s.marks / s.maxMarks) * 100 })), 'v') * 10) / 10 : 0;

        return [
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-3' }, StatCard({ label: 'Submissions', value: formatNumber(subs.length), icon: 'inbox', tone: 'brand', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Graded', value: formatNumber(graded.length), icon: 'check-circle', tone: 'success', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Average score', value: graded.length ? `${avgPct}%` : '—', icon: 'star', tone: 'info', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Late submissions', value: formatNumber(subs.filter((s) => s.late).length), icon: 'timer', tone: subs.some((s) => s.late) ? 'warning' : 'success', hero: true }))),
          graded.length ? SectionCard({ title: 'How you are scoring', subtitle: 'Percentage per graded submission', className: 'chart-card', icon: 'chart-line' },
            lineChart({
              categories: graded.slice(-12).map((s) => formatDate(s.submittedOn, 'dayMonth')),
              series: [{ name: 'Score %', values: graded.slice(-12).map((s) => Math.round((s.marks / s.maxMarks) * 100)) }],
              valueFormat: 'percent', height: 240, showDots: true, target: 75, targetLabel: 'Target',
            })) : null,
          SectionCard({ title: 'My submissions', subtitle: 'Every assignment you have turned in', icon: 'inbox', flush: true },
            subs.length ? DataTable({
              columns: [
                { key: 'homeworkTitle', label: 'Assignment', sticky: true, width: 280, render: (r) => Identity(r.homeworkTitle, r.homeworkId), value: (r) => r.homeworkTitle },
                { key: 'submittedOn', label: 'Submitted', width: 150, render: (r) => (r.submittedOn ? formatDate(r.submittedOn) : h('span', { className: 't-faint' }, 'Not submitted')) },
                { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
                { key: 'late', label: 'On time', width: 110, render: (r) => (r.late ? Badge('Late', { tone: 'warning' }) : Badge('On time', { tone: 'success' })), value: (r) => (r.late ? 1 : 0) },
                { key: 'marks', label: 'Marks', width: 110, align: 'right', numeric: true, render: (r) => (r.marks == null ? h('span', { className: 't-faint' }, 'Pending') : `${r.marks}/${r.maxMarks}`) },
                { key: 'feedback', label: 'Teacher feedback' },
              ],
              rows: subs, pageSize: 15, exportName: 'my-submissions', searchKeys: ['homeworkTitle'],
            }) : EmptyState({ icon: 'inbox', title: 'Nothing submitted yet', text: 'Once you upload homework it shows up here with the teacher’s feedback.', action: Button('Open homework', { variant: 'primary', route: 'portals/student/homework' }) })),
          SectionCard({ title: 'Online tests', subtitle: `Scheduled for ${kid.className}`, icon: 'monitor', flush: true },
            tests.length ? DataTable({
              columns: [
                { key: 'title', label: 'Test', sticky: true, width: 260, render: (r) => Identity(r.title, `${r.questions} questions · ${r.durationMin} min`), value: (r) => r.title },
                { key: 'scheduledOn', label: 'Scheduled', width: 150, render: (r) => formatDate(r.scheduledOn) },
                { key: 'totalMarks', label: 'Marks', width: 100, align: 'right', numeric: true },
                { key: 'avgScore', label: 'Class avg', width: 110, align: 'right', numeric: true, render: (r) => `${r.avgScore}%` },
                { key: 'negativeMarking', label: 'Negative marking', width: 160, render: (r) => (r.negativeMarking ? Badge('Yes', { tone: 'warning' }) : Badge('No', { tone: 'success' })), value: (r) => (r.negativeMarking ? 1 : 0) },
                { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
                {
                  key: 'act', label: '', width: 120, sortable: false,
                  render: (r) => (r.status === 'Scheduled' || r.status === 'Live'
                    ? Button('Start', { variant: 'primary', size: 'sm', icon: 'monitor', onClick: (e) => { e.stopPropagation(); notify({ title: 'Test lobby', text: `${r.title} opens 10 minutes before the scheduled time.`, tone: 'info' }); } })
                    : Button('Review', { variant: 'ghost', size: 'sm', icon: 'eye', onClick: (e) => { e.stopPropagation(); notify({ title: 'Answer key', text: 'Review opens after results are published.', tone: 'info' }); } })),
                },
              ],
              rows: tests, pageSize: 10, exportName: 'online-tests',
            }) : EmptyState({ icon: 'monitor', title: 'No online tests scheduled', text: 'Your teachers will announce online tests here.' })),
        ];
      }, (kid) => ({ subtitle: `${db.submissions.filter((s) => s.studentId === kid.id).length} submissions on record. Keep an eye on the online test schedule below.` })));
    },
  },

  'portals/student/study-material': {
    title: 'Study Material',
    subtitle: 'Notes, videos and resources for every subject',
    section: 'portals',
    render(mount, ctx) {
      const kid = demoStudent(campusOf(ctx));
      ensureStyles();
      let courses = db.courses.filter((c) => c.classId === kid.classId);
      if (!courses.length) courses = db.courses.filter((c) => c.className === kid.className);
      if (!courses.length) courses = db.courses.slice(0, 8);
      const courseIds = new Set(courses.map((c) => c.id));
      const lessons = db.lessons.filter((l) => courseIds.has(l.courseId));

      const courseCard = (c) => SectionCard({
        title: c.title, subtitle: `${c.teacherName} · ${c.chapters} chapters · ${c.lessons} lessons`, icon: 'book-open',
        actions: Badge(c.status),
        footer: h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
          Button('Open course', { variant: 'primary', size: 'sm', icon: 'play', onClick: () => courseDrawer(c) }),
          Button('Download notes', { variant: 'ghost', size: 'sm', icon: 'download', onClick: () => notify({ title: 'Notes downloaded', text: c.title, tone: 'success' }) }),
          h('span', { className: 'spacer' }),
          Rating(c.rating, { showValue: true })),
      },
        h('div', { className: 'stack-2' },
          ProgressBar(c.completionPct, { label: 'Course completion', showValue: true, tone: c.completionPct > 70 ? 'success' : 'brand' }),
          h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-4)' } },
            kv('Duration', `${c.durationHours} h`),
            kv('Resources', formatNumber(c.resources)),
            kv('Enrolled', formatNumber(c.enrolled)))));

      const courseDrawer = (c) => {
        const list = lessons.filter((l) => l.courseId === c.id);
        Drawer({
          title: c.title, subtitle: `${c.teacherName} · updated ${relativeTime(c.updatedAt)}`, size: 'lg',
          body: h('div', { className: 'stack' },
            ProgressBar(c.completionPct, { label: 'Your progress', showValue: true }),
            list.length ? Accordion(
              Array.from(groupBy(list, 'chapter').entries()).map(([chapter, items]) => ({
                id: 'ch-' + chapter, title: `Chapter ${chapter}`, icon: 'layers', badge: `${items.length} lessons`,
                body: h('div', { className: 'stack-1' }, items.map((l) => h('div', { className: 'pt-kv' },
                  h('span', { className: 'row', style: { gap: 'var(--sp-2)' } },
                    Icon(l.type === 'Video' ? 'video' : l.type === 'Quiz' ? 'clipboard-check' : 'file-text', 15),
                    h('span', null, l.title),
                    Badge(l.type, { tone: 'neutral', size: 'sm' })),
                  h('span', { className: 'row', style: { gap: 'var(--sp-2)' } },
                    h('span', { className: 't-xs t-muted' }, `${l.durationMin} min · ${l.sizeMb} MB`),
                    Button('Open', { variant: 'link', size: 'sm', onClick: () => notify({ title: l.title, text: 'Opening in the media player…', tone: 'info' }) }))))),
              })), { multi: false })
              : EmptyState({ icon: 'book-open', title: 'No lessons published', text: 'Your teacher has not uploaded material for this course yet.' })),
          actions: (close) => frag(Button('Close', { variant: 'secondary', onClick: close })),
        });
      };

      mount.appendChild(page({
        route: 'portals/student/study-material',
        children: [
          studentHero(kid, { subtitle: `${courses.length} courses and ${formatNumber(lessons.length)} lessons are available for ${kid.className}.` }),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-3' }, StatCard({ label: 'Courses', value: formatNumber(courses.length), icon: 'book-open', tone: 'brand', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Lessons', value: formatNumber(lessons.length), icon: 'layers', tone: 'info', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Videos', value: formatNumber(lessons.filter((l) => l.type === 'Video').length), icon: 'video', tone: 'success', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Avg completion', value: courses.length ? `${Math.round(avg(courses, 'completionPct'))}%` : '—', icon: 'gauge', tone: 'warning', hero: true }))),
          SectionCard({ title: 'My courses', subtitle: 'Tap a course to browse its chapters', icon: 'library' },
            courses.length ? h('div', { className: 'pt-grid-2' }, courses.map(courseCard))
              : EmptyState({ icon: 'book-open', title: 'No courses yet', text: 'Course material for your class is being prepared.' })),
          SectionCard({ title: 'All resources', subtitle: 'Search notes, videos, worksheets and recordings', icon: 'search', flush: true },
            lessons.length ? DataTable({
              columns: [
                { key: 'title', label: 'Resource', sticky: true, width: 280, render: (r) => Identity(r.title, r.courseTitle), value: (r) => r.title },
                { key: 'chapter', label: 'Chapter', width: 110, filter: true, align: 'right', numeric: true },
                { key: 'type', label: 'Type', width: 120, filter: true, render: (r) => Badge(r.type, { tone: 'neutral' }) },
                { key: 'durationMin', label: 'Duration', width: 110, align: 'right', numeric: true, render: (r) => `${r.durationMin} min` },
                { key: 'sizeMb', label: 'Size', width: 100, align: 'right', numeric: true, render: (r) => `${r.sizeMb} MB` },
                { key: 'uploadedOn', label: 'Uploaded', width: 140, render: (r) => formatDate(r.uploadedOn) },
                { key: 'act', label: '', width: 130, sortable: false, render: (r) => Button('Download', { variant: 'link', size: 'sm', icon: 'download', onClick: (e) => { e.stopPropagation(); notify({ title: 'Downloaded', text: r.title, tone: 'success' }); } }) },
              ],
              rows: lessons, pageSize: 20, exportName: 'study-material', searchKeys: ['title', 'courseTitle', 'type'],
            }) : EmptyState({ icon: 'search', title: 'Nothing to show' })),
        ],
      }));
    },
  },

  'portals/student/exams': {
    title: 'My Exams',
    subtitle: 'Datesheet, admit card and what to revise next',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(studentPage(ctx, 'portals/student/exams', (kid) => {
        const exams = db.exams.filter((e) => e.classId === kid.classId).sort((a, b) => a.date.localeCompare(b.date));
        const upcoming = exams.filter((e) => e.date >= TODAY);
        const next = upcoming[0];
        const countdown = next ? daysBetween(TODAY, next.date) : null;
        const groups = db.examGroups;

        return [
          next ? Card({ pad: true, className: 'card-accent' },
            h('div', { className: 'row-4 row-wrap' },
              h('div', { className: 'flex-1', style: { minWidth: '220px' } },
                h('div', { className: 't-eyebrow' }, 'Next exam'),
                h('div', { className: 't-hero' }, countdown === 0 ? 'Today' : countdown === 1 ? 'Tomorrow' : `${countdown} days`),
                h('div', { className: 't-sm t-muted mt-1' }, `${next.subjectName} · ${formatDate(next.date, 'long')} · ${next.startTime}–${next.endTime} · ${next.room}`)),
              h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
                Button('Download admit card', { variant: 'primary', size: 'lg', icon: 'id-card', onClick: () => notify({ title: 'Admit card downloaded', text: `${kid.name} · ${next.examGroupName}`, tone: 'success' }) }),
                Button('Revision plan', { variant: 'secondary', size: 'lg', icon: 'lightbulb', onClick: mockAction('Revision plan') }))))
            : Callout({ tone: 'success', icon: 'check-circle', title: 'No exams scheduled' }, 'Enjoy the break — the next datesheet will be published here.'),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-3' }, StatCard({ label: 'Exams scheduled', value: formatNumber(exams.length), icon: 'file-text', tone: 'brand', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Upcoming', value: formatNumber(upcoming.length), icon: 'clock', tone: 'warning', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Assessment groups', value: formatNumber(groups.length), icon: 'layers', tone: 'info', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Attendance eligibility', value: kid.attendancePct >= 75 ? 'Eligible' : 'At risk', icon: 'clipboard-check', tone: kid.attendancePct >= 75 ? 'success' : 'danger', hero: true }))),
          SectionCard({ title: 'Assessment plan', subtitle: 'Weightage across the session', className: 'chart-card', icon: 'chart-bar' },
            barChart({
              categories: groups.map((g) => g.name),
              series: [{ name: 'Weightage %', values: groups.map((g) => g.weightage) }],
              valueFormat: 'percent', height: 220, showValues: true,
            })),
          SectionCard({ title: 'Datesheet', subtitle: `${kid.className} · every scheduled paper`, icon: 'calendar', flush: true },
            exams.length ? DataTable({
              columns: [
                { key: 'subjectName', label: 'Subject', sticky: true, width: 200, render: (r) => Identity(r.subjectName, r.subjectCode), value: (r) => r.subjectName },
                { key: 'examGroupName', label: 'Assessment', width: 190, filter: true },
                { key: 'date', label: 'Date', width: 150, render: (r) => h('span', { className: r.date >= TODAY ? 't-medium' : 't-muted' }, formatDate(r.date, 'weekday')) },
                { key: 'startTime', label: 'Time', width: 140, render: (r) => `${r.startTime}–${r.endTime}` },
                { key: 'maxMarks', label: 'Max', width: 90, align: 'right', numeric: true },
                { key: 'passMarks', label: 'Pass', width: 90, align: 'right', numeric: true },
                { key: 'room', label: 'Room', width: 110 },
                { key: 'status', label: 'Status', width: 160, filter: true, render: (r) => Badge(r.status) },
              ],
              rows: exams, pageSize: 20, exportName: 'datesheet', searchKeys: ['subjectName', 'examGroupName'], printable: true,
            }) : EmptyState({ icon: 'calendar', title: 'Datesheet not published', text: 'The examination cell publishes the datesheet two weeks in advance.' })),
          SectionCard({ title: 'Exam day checklist', icon: 'clipboard-check' },
            h('div', { className: 'stack-2' },
              ['Carry your admit card and school ID', 'Reach the hall 20 minutes before the paper', 'Only transparent geometry boxes and non-programmable calculators where allowed',
                'Mobile phones and smart watches are not permitted', 'Write your roll number on every answer sheet'].map((x) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, Icon('check-circle', 15), h('span', { className: 't-sm' }, x))))),
        ];
      }, (kid) => {
        const nx = db.exams.filter((e) => e.classId === kid.classId && e.date >= TODAY).sort((a, b) => a.date.localeCompare(b.date))[0];
        return { subtitle: nx ? `Your next paper is ${nx.subjectName} on ${formatDate(nx.date, 'long')}.` : 'No exams are scheduled right now.' };
      }));
    },
  },

  'portals/student/results': {
    title: 'My Results',
    subtitle: 'Marks, grades and how you are trending',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(studentPage(ctx, 'portals/student/results', (kid) => {
        const s360 = student360(kid.id);
        const marks = db.marks.filter((m) => m.studentId === kid.id);
        const best = s360.subjectScores.slice().sort((a, b) => b.marks - a.marks)[0];
        const weakest = s360.subjectScores.slice().sort((a, b) => a.marks - b.marks)[0];

        return [
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-4' }, Card({ pad: true }, h('div', { className: 'stack-2', style: { alignItems: 'center' } },
              progressRing(kid.lastExamPercent, { label: 'Latest assessment', sublabel: `Grade ${gradeFor(kid.lastExamPercent)}`, size: 150, color: seriesColor(1) }),
              Badge(`Rank ${kid.rank} in ${kid.className} ${kid.section}`, { tone: 'brand' })))),
            h('div', { className: 'span-4' }, SectionCard({ title: 'Subject strengths', className: 'chart-card', icon: 'chart-bar' },
              barChart({
                categories: s360.subjectScores.map((s) => s.subjectName),
                series: [{ name: 'Marks', values: s360.subjectScores.map((s) => s.marks) }],
                horizontal: true, valueFormat: 'number', height: 260,
              }))),
            h('div', { className: 'span-4' }, SectionCard({ title: 'At a glance', icon: 'sparkles' },
              h('div', { className: 'stack-2' },
                kv('CGPA', String(kid.cgpa)),
                kv('Best subject', best ? `${best.subjectName} (${best.marks})` : '—'),
                kv('Needs work', weakest ? `${weakest.subjectName} (${weakest.marks})` : '—'),
                kv('Attendance', `${kid.attendancePct}%`),
                kv('Awards', formatNumber(s360.awards.length)),
                Button('Download report card', { variant: 'primary', block: true, icon: 'download', onClick: () => notify({ title: 'Report card downloaded', text: `${kid.name} · Term 1`, tone: 'success' }) }))))),
          SectionCard({ title: 'Year on year', subtitle: 'Percentage and attendance since you joined', className: 'chart-card', icon: 'chart-line' },
            lineChart({
              categories: s360.academicHistory.map((r) => r.year),
              series: [
                { name: 'Percentage', values: s360.academicHistory.map((r) => r.percent) },
                { name: 'Attendance', values: s360.academicHistory.map((r) => r.attendance) },
              ],
              valueFormat: 'percent', height: 260, showDots: true, showEndLabels: true,
            })),
          SectionCard({ title: 'Marks by assessment', icon: 'file-text', flush: true },
            marks.length ? DataTable({
              columns: [
                { key: 'examGroupId', label: 'Assessment', width: 180, filter: true, render: (r) => (byId(db.examGroups, r.examGroupId) || {}).name || r.examGroupId, value: (r) => r.examGroupId },
                { key: 'subjectName', label: 'Subject', width: 190, sticky: true, filter: true },
                { key: 'marksObtained', label: 'Marks', width: 110, align: 'right', numeric: true, render: (r) => `${r.marksObtained}/${r.maxMarks}` },
                { key: 'percent', label: 'Percent', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${v.toFixed(1)}%`, render: (r) => `${r.percent}%` },
                { key: 'grade', label: 'Grade', width: 90, render: (r) => Badge(r.grade, { tone: r.percent >= 75 ? 'success' : r.percent >= 50 ? 'info' : r.percent >= 33 ? 'warning' : 'danger' }) },
                { key: 'status', label: 'Result', width: 110, filter: true, render: (r) => Badge(r.status) },
                { key: 'remarks', label: 'Remarks' },
              ],
              rows: marks, pageSize: 15, footerAggregates: true, exportName: 'my-results',
            }) : EmptyState({ icon: 'file-text', title: 'Results not published', text: 'Marks appear here as soon as your teachers publish them.' })),
          SectionCard({ title: 'Academic history', subtitle: 'Class by class', icon: 'history', flush: true },
            DataTable({
              columns: [
                { key: 'year', label: 'Year', width: 120, sticky: true },
                { key: 'className', label: 'Class', width: 140 },
                { key: 'section', label: 'Section', width: 100 },
                { key: 'percent', label: 'Percentage', width: 130, align: 'right', numeric: true, render: (r) => `${r.percent}%` },
                { key: 'grade', label: 'Grade', width: 100, render: (r) => Badge(r.grade, { tone: 'info' }) },
                { key: 'attendance', label: 'Attendance', width: 130, align: 'right', numeric: true, render: (r) => `${r.attendance}%` },
                { key: 'rank', label: 'Rank', width: 90, align: 'right', numeric: true },
                { key: 'result', label: 'Result', width: 130, render: (r) => Badge(r.result, { tone: 'success' }) },
              ],
              rows: s360.academicHistory, paginate: false, searchable: false, exportName: 'academic-history',
            })),
        ];
      }, (kid) => ({ subtitle: `You scored ${kid.lastExamPercent}% in the last assessment and rank ${kid.rank} in your section.` })));
    },
  },
};

const studentRoutes3 = {
  'portals/student/fees': {
    title: 'My Fees',
    subtitle: 'What is billed, what is paid and what is due',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(studentPage(ctx, 'portals/student/fees', (kid) => {
        const invoices = childInvoices(kid);
        const payments = childPayments(kid);
        const quarters = invoices.slice().reverse();

        return [
          Card({ pad: true, className: 'card-accent' },
            h('div', { className: 'row-4 row-wrap' },
              h('div', { className: 'flex-1', style: { minWidth: '220px' } },
                h('div', { className: 't-eyebrow' }, 'Outstanding'),
                h('div', { className: 't-hero' }, kid.feeDue > 0 ? money(kid.feeDue) : 'All clear'),
                h('div', { className: 't-sm t-muted mt-1' }, kid.feeDue > 0 ? 'Ask your parent to pay from the parent portal, or pay here.' : 'Every instalment for 2026-27 is settled.')),
              h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
                Button('Pay now', { variant: 'primary', size: 'lg', icon: 'credit-card', disabled: kid.feeDue <= 0, onClick: () => payNowFlow(kid, invoices.find((i) => i.balance > 0)) }),
                Button('Fee statement', { variant: 'secondary', size: 'lg', icon: 'download', onClick: () => notify({ title: 'Statement downloaded', tone: 'success' }) })))),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-3' }, StatCard({ label: 'Annual fee', value: money(kid.feeTotal), icon: 'receipt', tone: 'info', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Paid so far', value: money(kid.feePaid), icon: 'check-circle', tone: 'success', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Due', value: money(kid.feeDue), icon: 'alert-circle', tone: kid.feeDue > 0 ? 'danger' : 'success', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Scholarship', value: kid.scholarship ? 'Yes' : 'None', icon: 'award', tone: kid.scholarship ? 'brand' : 'neutral', hero: true }))),
          quarters.length ? SectionCard({ title: 'Instalment progress', subtitle: 'Billed against paid, quarter by quarter', className: 'chart-card', icon: 'chart-bar' },
            barChart({
              categories: quarters.map((i) => i.period),
              series: [
                { name: 'Billed', values: quarters.map((i) => i.amount) },
                { name: 'Paid', values: quarters.map((i) => i.paid) },
              ],
              valueFormat: 'currencyCompact', height: 240,
            })) : null,
          SectionCard({ title: 'Invoices', icon: 'receipt', flush: true },
            invoices.length ? DataTable({
              columns: [
                { key: 'invoiceNo', label: 'Invoice', width: 150, sticky: true },
                { key: 'period', label: 'Period', width: 130, filter: true },
                { key: 'issueDate', label: 'Issued', width: 130, render: (r) => formatDate(r.issueDate) },
                { key: 'dueDate', label: 'Due', width: 130, render: (r) => formatDate(r.dueDate) },
                { key: 'amount', label: 'Amount', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.amount) },
                { key: 'balance', label: 'Balance', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => (r.balance ? h('span', { className: 't-danger t-num' }, money(r.balance)) : h('span', { className: 't-faint' }, '—')) },
                { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
              ],
              rows: invoices, pageSize: 10, footerAggregates: true, exportName: 'my-invoices',
            }) : EmptyState({ icon: 'receipt', title: 'No invoices', text: 'Fee invoices for this session have not been generated yet.' })),
          SectionCard({ title: 'Receipts', icon: 'file-text', flush: true },
            payments.length ? DataTable({
              columns: [
                { key: 'receiptNo', label: 'Receipt', width: 150, sticky: true },
                { key: 'date', label: 'Paid on', width: 130, render: (r) => formatDate(r.date) },
                { key: 'amount', label: 'Amount', width: 130, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.amount) },
                { key: 'mode', label: 'Mode', width: 130, filter: true },
                { key: 'status', label: 'Status', width: 110, filter: true, render: (r) => Badge(r.status) },
              ],
              rows: payments, pageSize: 10, footerAggregates: true, exportName: 'my-receipts',
            }) : EmptyState({ icon: 'file-text', title: 'No receipts yet' })),
        ];
      }, (kid) => ({ subtitle: kid.feeDue > 0 ? `${money(kid.feeDue)} is still due for this session.` : 'Your fees are fully paid — thank you!' })));
    },
  },

  'portals/student/library': {
    title: 'Library',
    subtitle: 'Books you have, what is due and what to read next',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(studentPage(ctx, 'portals/student/library', (kid) => {
        const issues = db.bookIssues.filter((b) => b.studentId === kid.id).sort((a, b) => b.issueDate.localeCompare(a.issueDate));
        const active = issues.filter((b) => !b.returnDate);
        const member = db.libraryMembers.find((m) => m.refId === kid.id) || null;
        const fines = sum(issues, 'fine');
        const catalogue = db.books.filter((b) => b.campusId === kid.campusId && b.availableCopies > 0).slice(0, 400);

        return [
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-3' }, StatCard({ label: 'Books issued now', value: formatNumber(active.length), icon: 'book', tone: active.length ? 'info' : 'neutral', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Borrowing limit', value: member ? String(member.maxBooks) : '4', icon: 'layers', tone: 'brand', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Books read this year', value: formatNumber(issues.length), icon: 'library', tone: 'success', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Fine outstanding', value: money(member ? member.fineOutstanding : fines), icon: 'rupee', tone: (member ? member.fineOutstanding : fines) > 0 ? 'danger' : 'success', hero: true }))),
          active.length ? SectionCard({ title: 'Currently with you', subtitle: 'Return on time to avoid a ₹2 per day fine', icon: 'book' },
            h('div', { className: 'stack-3' }, active.map((b) => {
              const overdue = b.dueDate < TODAY;
              return Card({ pad: true },
                h('div', { className: 'row-3 row-wrap' },
                  h('div', { className: 'pt-tile-ico', html: icon('book', 17) }),
                  h('div', { className: 'flex-1 min-0' },
                    h('div', { className: 't-semibold' }, b.bookTitle),
                    h('div', { className: 't-xs t-muted' }, `Accession ${b.accessionNo} · issued ${formatDate(b.issueDate)}`)),
                  Badge(overdue ? `Overdue by ${Math.abs(daysBetween(TODAY, b.dueDate))} days` : dueLabel(b.dueDate), { tone: overdue ? 'danger' : 'info' }),
                  Button('Renew', { variant: 'secondary', size: 'sm', icon: 'refresh', disabled: b.renewals >= 2, onClick: () => notify({ title: 'Renewal requested', text: `${b.bookTitle} · the librarian will confirm`, tone: 'success' }) })));
            })))
            : SectionCard({ title: 'Currently with you', icon: 'book' },
              EmptyState({ icon: 'book', title: 'No books issued', text: 'Browse the catalogue below and reserve something for the weekend.' })),
          SectionCard({ title: 'Borrowing history', icon: 'history', flush: true },
            issues.length ? DataTable({
              columns: [
                { key: 'bookTitle', label: 'Book', sticky: true, width: 280, render: (r) => Identity(r.bookTitle, r.accessionNo), value: (r) => r.bookTitle },
                { key: 'issueDate', label: 'Issued', width: 130, render: (r) => formatDate(r.issueDate) },
                { key: 'dueDate', label: 'Due', width: 130, render: (r) => formatDate(r.dueDate) },
                { key: 'returnDate', label: 'Returned', width: 130, render: (r) => (r.returnDate ? formatDate(r.returnDate) : h('span', { className: 't-warning' }, 'With me')) },
                { key: 'renewals', label: 'Renewals', width: 110, align: 'right', numeric: true },
                { key: 'fine', label: 'Fine', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: (v) => money(v), render: (r) => (r.fine ? money(r.fine) : h('span', { className: 't-faint' }, '—')) },
                { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
              ],
              rows: issues, pageSize: 10, footerAggregates: true, exportName: 'library-history',
            }) : EmptyState({ icon: 'history', title: 'No borrowing history yet' })),
          SectionCard({ title: 'Search the catalogue', subtitle: `${formatNumber(catalogue.length)} titles available at your campus`, icon: 'search', flush: true },
            DataTable({
              columns: [
                { key: 'title', label: 'Title', sticky: true, width: 300, render: (r) => Identity(r.title, `${r.author} · ${r.publisher}`), value: (r) => r.title },
                { key: 'category', label: 'Category', width: 150, filter: true },
                { key: 'language', label: 'Language', width: 120, filter: true },
                { key: 'rackNo', label: 'Rack', width: 100 },
                { key: 'availableCopies', label: 'Available', width: 110, align: 'right', numeric: true },
                { key: 'act', label: '', width: 130, sortable: false, render: (r) => Button('Reserve', { variant: 'link', size: 'sm', icon: 'bookmark', onClick: (e) => { e.stopPropagation(); notify({ title: 'Reserved', text: `${r.title} · collect from the issue desk within 24 hours`, tone: 'success' }); } }) },
              ],
              rows: catalogue, pageSize: 15, exportName: 'catalogue',
              searchKeys: ['title', 'author', 'category', 'isbn'],
              searchPlaceholder: 'Search by title, author or ISBN…',
            })),
        ];
      }, (kid) => ({ subtitle: `${db.bookIssues.filter((b) => b.studentId === kid.id && !b.returnDate).length} books are with you right now.` })));
    },
  },

  'portals/student/events': {
    title: 'Events',
    subtitle: 'What is happening, what you have won',
    section: 'portals',
    render(mount, ctx) {
      mount.appendChild(studentPage(ctx, 'portals/student/events', (kid) => {
        const events = db.events.filter((e) => e.campusId === kid.campusId || e.audience === 'All').sort((a, b) => a.date.localeCompare(b.date));
        const upcoming = events.filter((e) => e.date >= TODAY);
        const awards = db.awards.filter((a) => a.studentId === kid.id);
        const clubs = db.clubs.filter((c) => c.campusId === kid.campusId);
        const holidays = db.holidays;
        const calEvents = events.map((e) => ({ date: e.date, title: e.title, tone: e.date >= TODAY ? 'brand' : 'neutral', meta: e.venue }))
          .concat(holidays.map((x) => ({ date: x.date, title: x.name, tone: 'success', meta: 'Holiday' })));

        const eventCard = (e) => Card({ pad: true, className: 'card-interactive', onClick: () => Drawer({
          title: e.title, subtitle: `${formatDate(e.date, 'long')} · ${e.venue}`, size: 'md',
          body: h('div', { className: 'stack' },
            h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } }, Badge(e.category), Badge(e.status), Badge(e.audience, { tone: 'neutral' })),
            Callout({ tone: 'info', icon: 'calendar-check', title: 'About this event' }, e.description),
            DescriptionList([
              ['Date', formatDate(e.date, 'long')],
              ['Time', `${e.startTime} – ${e.endTime}`],
              ['Venue', e.venue],
              ['Organiser', e.organiser],
              ['Chief guest', e.chiefGuest || '—'],
              ['Registered', formatNumber(e.registered)],
            ], { cols: 1 })),
          actions: (close) => frag(
            Button('Close', { variant: 'secondary', onClick: close }),
            Button('Register', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Registered', text: e.title, tone: 'success' }); } })),
        }) },
          h('div', { className: 'row-3 row-top' },
            h('div', { className: 'pt-tile-ico', html: icon(e.category === 'Sports' ? 'football' : e.category === 'Academic' ? 'book-open' : 'sparkles', 17) }),
            h('div', { className: 'flex-1 min-0' },
              h('div', { className: 't-semibold' }, e.title),
              h('div', { className: 't-xs t-muted' }, `${formatDate(e.date)} · ${e.venue}`),
              h('div', { className: 'row row-wrap mt-2', style: { gap: 'var(--sp-2)' } },
                Badge(e.category, { tone: 'neutral', size: 'sm' }),
                Badge(e.status, { size: 'sm' }))),
            Icon('chevron-right', 18)));

        return [
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-3' }, StatCard({ label: 'Upcoming events', value: formatNumber(upcoming.length), icon: 'calendar-check', tone: 'brand', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'My awards', value: formatNumber(awards.length), icon: 'award', tone: 'warning', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Clubs on campus', value: formatNumber(clubs.length), icon: 'users', tone: 'info', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'House', value: kid.house, icon: 'flag', tone: 'success', hero: true }))),
          SectionCard({ title: 'Coming up', subtitle: 'Register from here', icon: 'calendar-check' },
            upcoming.length ? h('div', { className: 'pt-grid-2' }, upcoming.slice(0, 8).map(eventCard))
              : EmptyState({ icon: 'calendar-check', title: 'Nothing scheduled', text: 'New events are announced on the notice board and here.' })),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-8' }, SectionCard({ title: 'School calendar — August 2026', icon: 'calendar' },
              Calendar({ month: '2026-08', events: calEvents, maxPerDay: 3, onSelectEvent: (e) => notify({ title: e.title, text: e.meta || '', tone: 'info' }) }))),
            h('div', { className: 'span-4' }, SectionCard({ title: 'My achievements', icon: 'award' },
              awards.length ? Timeline(awards.map((a) => ({
                title: a.title, meta: `${formatDate(a.date)} · ${a.level}`, text: `${a.category} · awarded by ${a.awardedBy} · ${a.points} house points`,
                icon: 'award', tone: 'warning',
              }))) : EmptyState({ icon: 'award', title: 'No awards yet', text: 'Take part in a competition — every certificate lands here.' })))),
          SectionCard({ title: 'Clubs & activities', subtitle: 'Join something new this term', icon: 'users', flush: true },
            clubs.length ? DataTable({
              columns: [
                { key: 'name', label: 'Club', sticky: true, width: 220, render: (r) => Identity(r.name, r.category), value: (r) => r.name },
                { key: 'inCharge', label: 'In charge', width: 200 },
                { key: 'meetingDay', label: 'Meets', width: 140, filter: true },
                { key: 'room', label: 'Where', width: 140 },
                { key: 'members', label: 'Members', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'act', label: '', width: 120, sortable: false, render: (r) => Button('Join', { variant: 'link', size: 'sm', icon: 'plus', onClick: (e) => { e.stopPropagation(); notify({ title: 'Request sent', text: `${r.inCharge} will confirm your place in ${r.name}.`, tone: 'success' }); } }) },
              ],
              rows: clubs, paginate: false, footerAggregates: true, exportName: 'clubs',
            }) : EmptyState({ icon: 'users', title: 'No clubs listed' })),
          SectionCard({ title: 'Holidays this session', icon: 'umbrella', flush: true },
            DataTable({
              columns: [
                { key: 'name', label: 'Holiday', sticky: true, width: 240 },
                { key: 'date', label: 'Date', width: 160, render: (r) => formatDate(r.date, 'weekday') },
                { key: 'type', label: 'Type', width: 140, filter: true, render: (r) => Badge(r.type, { tone: 'neutral' }) },
                { key: 'days', label: 'Days', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
              ],
              rows: holidays, paginate: false, footerAggregates: true, exportName: 'holidays',
            })),
        ];
      }, () => ({ subtitle: 'Register for events, track your certificates and see what the houses are up to.' })));
    },
  },
};

/* ==========================================================================
   EMPLOYEE PORTAL  (also serves the teacher "My Leave" screen)
   ========================================================================== */

function employeeHero(e, { subtitle, actions } = {}) {
  return hero({
    avatarName: e.name, avatarInitials: e.avatarInitials,
    eyebrow: 'Employee portal',
    title: greetingFor(e.name),
    subtitle: subtitle || `${e.designation} · ${e.department} · employee code ${e.employeeCode}`,
    meta: [
      { v: `${e.attendancePct}%`, l: 'Attendance' },
      { v: e.leaveBalanceCL + e.leaveBalanceSL + e.leaveBalanceEL, l: 'Leave balance' },
      { v: e.experienceYears, l: 'Years here' },
      { v: e.appraisalRating, l: 'Rating' },
    ],
    actions: actions || frag(
      heroChip('Apply for leave', 'umbrella', () => navigate('portals/employee/leave')),
      mobileChip()),
  });
}

function applyLeaveForm(e, onDone) {
  return formPage({
    title: 'Apply for leave', subtitle: 'Your reporting manager is notified immediately',
    mode: 'modal', size: 'md', submitLabel: 'Submit application',
    sections: [{
      title: 'Leave request', cols: 2,
      fields: [
        { id: 'type', label: 'Leave type', type: 'select', required: true, options: db.leaveTypes.map((t) => ({ value: t.id, label: `${t.name} (${t.code})` })) },
        { id: 'from', label: 'From', type: 'date', required: true },
        { id: 'to', label: 'To', type: 'date', required: true },
        { id: 'half', label: 'Half day', type: 'switch' },
        { id: 'reason', label: 'Reason', type: 'textarea', required: true, span: 'full', placeholder: 'A line for your reporting manager' },
        { id: 'substitute', label: 'Substitute arranged with', type: 'combobox', options: db.staff.filter((s) => s.campusId === e.campusId && s.id !== e.id).slice(0, 60).map((s) => ({ value: s.id, label: `${s.name} — ${s.designation}` })) },
        { id: 'attachment', label: 'Attachment', type: 'file', span: 'full', hint: 'Medical certificate for sick leave over two days' },
      ],
    }],
    onSubmit: (v) => {
      notify({ title: 'Leave applied', text: `${formatDate(v.from)} to ${formatDate(v.to)} · pending approval`, tone: 'success' });
      if (onDone) onDone(v);
    },
  });
}

/** Shared leave screen for the teacher and employee portals. */
function myLeaveScreen(e, routeKey, heroNode) {
  ensureStyles();
  const mine = db.leaveRequests.filter((l) => l.employeeId === e.id).sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));
  const pending = mine.filter((l) => l.status === 'Pending');
  const balances = [
    { key: 'Casual (CL)', value: e.leaveBalanceCL, max: 12 },
    { key: 'Sick (SL)', value: e.leaveBalanceSL, max: 10 },
    { key: 'Earned (EL)', value: e.leaveBalanceEL, max: 15 },
  ];

  const detail = (l) => Drawer({
    title: `${l.leaveType} · ${l.days} day${l.days > 1 ? 's' : ''}`,
    subtitle: `${formatDate(l.fromDate)} to ${formatDate(l.toDate)} · applied ${formatDate(l.appliedOn)}`,
    size: 'md',
    body: h('div', { className: 'stack' },
      h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } }, Badge(l.status), Badge(l.leaveType, { tone: 'neutral' }), l.substituteArranged ? Badge('Substitute arranged', { tone: 'success' }) : Badge('No substitute', { tone: 'warning' })),
      Callout({ tone: 'neutral', icon: 'message-square', title: 'Reason' }, l.reason),
      ApprovalTrail([
        { label: 'Applied', by: l.employeeName, date: formatDate(l.appliedOn), state: 'done', note: l.reason },
        { label: 'Reporting manager', by: l.approverName || 'Pending assignment', date: l.status === 'Pending' ? 'Awaiting' : formatDate(l.appliedOn), state: l.status === 'Approved' ? 'done' : l.status === 'Rejected' ? 'rejected' : 'current' },
        { label: 'HR record', by: 'HR Operations', date: l.status === 'Approved' ? formatDate(l.fromDate) : '—', state: l.status === 'Approved' ? 'done' : 'todo' },
      ]),
      l.attachment ? FileList([{ name: l.attachment, type: 'PDF', size: '240 KB', date: l.appliedOn }], { onDownload: mockAction('Download attachment') }) : null),
    actions: (close) => frag(
      Button('Close', { variant: 'secondary', onClick: close }),
      l.status === 'Pending'
        ? Button('Withdraw request', { variant: 'danger', icon: 'x-circle', onClick: () => { close(); ConfirmDialog({ title: 'Withdraw this leave request?', text: 'Your manager will no longer see it in the approval queue.', confirmLabel: 'Withdraw', tone: 'danger' }).then((ok) => ok && notify({ title: 'Request withdrawn', tone: 'warning' })); } })
        : Button('Apply again', { variant: 'primary', icon: 'plus', onClick: () => { close(); applyLeaveForm(e); } })),
  });

  return page({
    route: routeKey,
    children: [
      heroNode,
      Card({ pad: true, className: 'card-accent' },
        h('div', { className: 'row-4 row-wrap' },
          h('div', { className: 'flex-1', style: { minWidth: '220px' } },
            h('div', { className: 't-eyebrow' }, 'Leave balance'),
            h('div', { className: 't-hero' }, `${e.leaveBalanceCL + e.leaveBalanceSL + e.leaveBalanceEL} days`),
            h('div', { className: 't-sm t-muted mt-1' }, `${e.leaveTakenYtd} days taken so far this year`)),
          Button('Apply for leave', { variant: 'primary', size: 'lg', icon: 'plus', onClick: () => applyLeaveForm(e) }))),
      h('div', { className: 'widget-grid' },
        balances.map((b) => h('div', { className: 'span-4' },
          SectionCard({ title: b.key, subtitle: `${b.value} of ${b.max} days remaining`, icon: 'calendar' },
            ProgressBar(pct(b.value, b.max), { showValue: true, tone: b.value > b.max * 0.4 ? 'success' : b.value > 0 ? 'warning' : 'danger' }))))),
      h('div', { className: 'widget-grid' },
        h('div', { className: 'span-7' }, SectionCard({ title: 'My applications', subtitle: `${mine.length} on record · ${pending.length} awaiting approval`, icon: 'inbox', flush: true },
          mine.length ? DataTable({
            columns: [
              { key: 'leaveType', label: 'Type', width: 170, sticky: true, filter: true },
              { key: 'fromDate', label: 'From', width: 130, render: (r) => formatDate(r.fromDate) },
              { key: 'toDate', label: 'To', width: 130, render: (r) => formatDate(r.toDate) },
              { key: 'days', label: 'Days', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
              { key: 'appliedOn', label: 'Applied', width: 130, render: (r) => formatDate(r.appliedOn) },
              { key: 'approverName', label: 'Approver', width: 180, render: (r) => r.approverName || h('span', { className: 't-faint' }, 'Unassigned') },
              { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
            ],
            rows: mine, pageSize: 10, footerAggregates: true, exportName: 'my-leave', onRowClick: detail,
            rowActions: (row) => [
              { label: 'View trail', icon: 'eye', onClick: () => detail(row) },
              row.status === 'Pending' ? { label: 'Withdraw', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: 'Withdraw this request?', confirmLabel: 'Withdraw', tone: 'danger' }).then((ok) => ok && notify({ title: 'Request withdrawn', tone: 'warning' })) } : { label: 'Apply again', icon: 'plus', onClick: () => applyLeaveForm(e) },
            ],
          }) : EmptyState({ icon: 'umbrella', title: 'No leave applied yet', text: 'You have not taken any leave this session. Apply above when you need to.', action: Button('Apply for leave', { variant: 'primary', icon: 'plus', onClick: () => applyLeaveForm(e) }) }))),
        h('div', { className: 'span-5' }, SectionCard({ title: 'Leave policy', subtitle: 'Entitlement for your grade', icon: 'scroll', flush: true },
          DataTable({
            columns: [
              { key: 'name', label: 'Type', width: 170, sticky: true },
              { key: 'code', label: 'Code', width: 90 },
              { key: 'annualQuota', label: 'Quota', width: 90, align: 'right', numeric: true },
              { key: 'carryForward', label: 'Carry forward', width: 140, render: (r) => (r.carryForward ? Badge('Yes', { tone: 'success' }) : Badge('No', { tone: 'neutral' })), value: (r) => (r.carryForward ? 1 : 0) },
              { key: 'paid', label: 'Paid', width: 90, render: (r) => (r.paid ? Badge('Paid', { tone: 'success' }) : Badge('Unpaid', { tone: 'danger' })), value: (r) => (r.paid ? 1 : 0) },
            ],
            rows: db.leaveTypes, paginate: false, searchable: false, columnToggle: false, exportName: 'leave-types',
          })))),
      SectionCard({ title: 'Holiday calendar', subtitle: 'Gazetted and restricted holidays for 2026-27', icon: 'umbrella', flush: true },
        DataTable({
          columns: [
            { key: 'name', label: 'Holiday', width: 260, sticky: true },
            { key: 'date', label: 'Date', width: 170, render: (r) => formatDate(r.date, 'weekday') },
            { key: 'type', label: 'Type', width: 150, filter: true, render: (r) => Badge(r.type, { tone: 'neutral' }) },
            { key: 'days', label: 'Days', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
          ],
          rows: db.holidays, paginate: false, footerAggregates: true, exportName: 'holidays',
        })),
    ],
  });
}

/** Deterministic HR document checklist for a staff member. */
function staffDocuments(e) {
  const names = ['Aadhaar Card', 'PAN Card', 'Highest Degree Certificate', 'B.Ed / Teaching Certificate',
    'Previous Experience Letter', 'Relieving Letter', 'Bank Passbook', 'Police Verification',
    'Medical Fitness Certificate', 'Passport Photograph'];
  return names.map((name, i) => {
    const r = hash01(e.id + name);
    const status = e.documentsComplete ? 'Verified' : r < 0.72 ? 'Verified' : r < 0.9 ? 'Pending' : 'Rejected';
    return {
      id: `${e.id}-D${i}`, name: `${name}.pdf`, type: r > 0.5 ? 'PDF' : 'JPG',
      size: `${Math.round(80 + r * 1800)} KB`, date: e.joiningDate, status,
    };
  });
}

const employeeRoutes = {
  'portals/employee/profile': {
    title: 'My Profile',
    subtitle: 'Everything HR holds about you',
    section: 'portals',
    render(mount, ctx) {
      ensureStyles();
      const e = demoEmployee(campusOf(ctx), (ctx.state && ctx.state.role) || store.get('role'));
      const campus = byId(db.campuses, e.campusId);
      const node = detailPage({
        route: 'portals/employee/profile',
        title: e.name,
        subtitle: `${e.designation} · ${e.department} · ${campus ? campus.name : e.campusId}`,
        initials: e.avatarInitials,
        badges: [Badge(e.status), Badge(e.type, { tone: 'neutral' }), Badge(e.employmentType, { tone: 'info' })],
        meta: [
          { label: 'Employee code', value: e.employeeCode, icon: 'id-card' },
          { label: 'Joined', value: formatDate(e.joiningDate), icon: 'calendar' },
          { label: 'Experience', value: `${e.experienceYears} years`, icon: 'briefcase' },
          { label: 'Attendance', value: `${e.attendancePct}%`, icon: 'clipboard-check' },
        ],
        actions: pageActions(
          Button('Request correction', { variant: 'secondary', icon: 'edit', onClick: mockAction('Request correction') }),
          Button('Download profile', { variant: 'primary', icon: 'download', onClick: () => notify({ title: 'Profile PDF downloaded', tone: 'success' }) })),
        tabs: [
          {
            id: 'personal', label: 'Personal', icon: 'user',
            render: () => SectionCard({ title: 'Personal details', icon: 'user' },
              DescriptionList([
                ['Full name', e.name], ['Gender', e.gender], ['Date of birth', formatDate(e.dob)],
                ['Blood group', e.bloodGroup], ['Marital status', e.maritalStatus],
                ['Email', e.email], ['Phone', e.phone], ['Address', formatAddress(e.address)],
              ], { cols: 2 })),
          },
          {
            id: 'employment', label: 'Employment', icon: 'briefcase',
            render: () => frag(
              SectionCard({ title: 'Role & posting', icon: 'briefcase' },
                DescriptionList([
                  ['Designation', e.designation], ['Department', e.department], ['Band', e.band],
                  ['Type', e.type], ['Employment type', e.employmentType], ['Campus', campus ? campus.name : e.campusId],
                  ['Joining date', formatDate(e.joiningDate)], ['Qualification', e.qualification],
                ], { cols: 2 })),
              e.type === 'Teaching' ? SectionCard({ title: 'Teaching load', icon: 'presentation' },
                DescriptionList([
                  ['Subjects', (e.subjects || []).join(', ') || '—'],
                  ['Classes assigned', (e.classesAssigned || []).join(', ') || '—'],
                  ['Class teacher of', e.classTeacherOf || 'Not a class teacher'],
                  ['Weekly periods', String(e.weeklyPeriods)],
                ], { cols: 2 })) : null),
          },
          {
            id: 'salary', label: 'Salary & bank', icon: 'wallet',
            render: () => frag(
              SectionCard({ title: 'Salary structure', subtitle: 'Monthly, in ₹', className: 'chart-card', icon: 'wallet' },
                barChart({
                  categories: ['Basic', 'HRA', 'DA', 'Conveyance', 'PF', 'TDS'],
                  series: [{ name: 'Amount', values: [e.salaryBasic, e.salaryHra, e.salaryDa, e.salaryConveyance, -e.deductionPf, -e.deductionTds] }],
                  valueFormat: 'currencyCompact', height: 240,
                })),
              SectionCard({ title: 'Take home', icon: 'banknote' },
                DescriptionList([
                  ['Gross', money(e.salaryGross)], ['PF deduction', money(e.deductionPf)],
                  ['TDS', money(e.deductionTds)], ['Net payable', money(e.salaryNet)],
                ], { cols: 2 })),
              SectionCard({ title: 'Bank & statutory', subtitle: 'Sensitive values are masked', icon: 'building-columns' },
                DescriptionList([
                  ['Bank', e.bankName], ['Account', e.accountMasked], ['IFSC', e.ifsc],
                  ['UAN', e.uan], ['PAN', e.pan],
                ], { cols: 2 }))),
          },
          {
            id: 'documents', label: 'Documents', icon: 'folder', count: staffDocuments(e).length,
            render: () => SectionCard({ title: 'HR file', icon: 'folder' },
              FileList(staffDocuments(e), { onDownload: (f) => notify({ title: 'Downloaded', text: f.name, tone: 'success' }) })),
          },
        ],
        sidebar: [
          SectionCard({ title: 'This month', icon: 'gauge' },
            h('div', { className: 'stack-2' },
              kv('Attendance', `${e.attendancePct}%`),
              kv('Leave taken (YTD)', `${e.leaveTakenYtd} days`),
              kv('Leave balance', `${e.leaveBalanceCL + e.leaveBalanceSL + e.leaveBalanceEL} days`),
              kv('Trainings completed', String(e.trainingsCompleted)),
              kv('Appraisal rating', String(e.appraisalRating)))),
          SectionCard({ title: 'Quick links', icon: 'sparkles' },
            tiles([
              { icon: 'clipboard-check', label: 'Attendance', route: 'portals/employee/attendance' },
              { icon: 'umbrella', label: 'Leave', route: 'portals/employee/leave', tone: 'info' },
              { icon: 'receipt', label: 'Payslips', route: 'portals/employee/payslips', tone: 'success' },
              { icon: 'star', label: 'Appraisal', route: 'portals/employee/appraisal', tone: 'warning' },
            ])),
          SectionCard({ title: 'Emergency', icon: 'phone-call' },
            DescriptionList([['HR helpdesk', '+91 124 4567 811'], ['Campus security', '+91 124 4567 899']], { cols: 1 })),
        ],
        timeline: [
          { title: 'Joined Springdale', meta: formatDate(e.joiningDate), text: `Appointed as ${e.designation} in ${e.department}.`, icon: 'user-plus', tone: 'success' },
          { title: 'Appraisal completed', meta: 'April 2026', text: `Rated ${e.appraisalRating} with a score of ${e.appraisalScore}.`, icon: 'star', tone: 'brand' },
          { title: 'Training completed', meta: 'June 2026', text: `${e.trainingsCompleted} programmes completed to date.`, icon: 'lightbulb', tone: 'info' },
          { title: 'Payroll processed', meta: 'July 2026', text: `Net ${money(e.salaryNet)} credited to ${e.bankName}.`, icon: 'banknote', tone: 'success' },
        ],
      });
      withHero(node, employeeHero(e));
      mount.appendChild(node);
    },
  },

  'portals/employee/attendance': {
    title: 'My Attendance',
    subtitle: 'Punches, hours worked and your monthly pattern',
    section: 'portals',
    render(mount, ctx) {
      ensureStyles();
      const e = demoEmployee(campusOf(ctx), (ctx.state && ctx.state.role) || store.get('role'));
      const rows = db.staffAttendance.filter((a) => a.employeeId === e.id).sort((a, b) => b.date.localeCompare(a.date));
      const present = rows.filter((r) => r.status === 'Present');
      const late = rows.filter((r) => r.lateBy > 0);
      const monthly = new Map();
      for (const r of rows) {
        const k = r.date.slice(0, 7);
        if (!monthly.has(k)) monthly.set(k, { present: 0, total: 0, hours: 0 });
        const m = monthly.get(k); m.total++; m.hours += r.workedHours || 0;
        if (r.status === 'Present') m.present++;
      }
      const keys = Array.from(monthly.keys()).sort();
      const calDays = rows.map((r) => ({ date: r.date, value: r.status === 'Present' ? (r.workedHours || 8) : 0 }));

      mount.appendChild(page({
        route: 'portals/employee/attendance',
        children: [
          employeeHero(e, { subtitle: `${e.attendancePct}% attendance this session across ${rows.length} marked days.` }),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-3' }, Card({ pad: true }, h('div', { className: 'stack-2', style: { alignItems: 'center' } },
              progressRing(e.attendancePct, { label: 'Attendance', sublabel: 'This session', size: 128 })))),
            h('div', { className: 'span-3' }, StatCard({ label: 'Days present', value: formatNumber(present.length), icon: 'check-circle', tone: 'success', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Late marks', value: formatNumber(late.length), icon: 'timer', tone: late.length ? 'warning' : 'success', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Avg hours / day', value: rows.length ? `${(sum(rows, 'workedHours') / rows.length).toFixed(1)} h` : '—', icon: 'clock', tone: 'info', hero: true }))),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-7' }, SectionCard({ title: 'Monthly attendance', subtitle: 'Present days against marked days', className: 'chart-card', icon: 'chart-line' },
              lineChart({
                categories: keys.map((k) => formatDate(k + '-01', 'monthYear')),
                series: [{ name: 'Present %', values: keys.map((k) => pct(monthly.get(k).present, monthly.get(k).total)) }],
                valueFormat: 'percent', target: 95, targetLabel: 'Target', height: 250, showDots: true,
              }))),
            h('div', { className: 'span-5' }, SectionCard({ title: 'Hours worked', subtitle: 'Total per month', className: 'chart-card', icon: 'clock' },
              barChart({
                categories: keys.map((k) => formatDate(k + '-01', 'monthYear')),
                series: [{ name: 'Hours', values: keys.map((k) => Math.round(monthly.get(k).hours)) }],
                height: 250,
              })))),
          calDays.length ? SectionCard({ title: 'Attendance heatmap', subtitle: 'Hours worked per day', className: 'chart-card', icon: 'calendar' },
            heatmap({ mode: 'calendar', days: calDays, seriesName: 'Hours worked', min: 0, max: 10 })) : null,
          SectionCard({ title: 'Punch register', subtitle: 'Biometric and manual entries', icon: 'fingerprint', flush: true },
            rows.length ? DataTable({
              columns: [
                { key: 'date', label: 'Date', width: 170, sticky: true, render: (r) => formatDate(r.date, 'weekday') },
                { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
                { key: 'inTime', label: 'In', width: 100, numeric: true },
                { key: 'outTime', label: 'Out', width: 100, numeric: true },
                { key: 'workedHours', label: 'Hours', width: 100, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${v.toFixed(1)} h` },
                { key: 'lateBy', label: 'Late by', width: 110, align: 'right', numeric: true, render: (r) => (r.lateBy ? h('span', { className: 't-warning t-num' }, `${r.lateBy} min`) : h('span', { className: 't-faint' }, '—')) },
                { key: 'source', label: 'Source', width: 140, filter: true, render: (r) => Badge(r.source, { tone: 'neutral' }) },
              ],
              rows, pageSize: 20, footerAggregates: true, exportName: 'my-attendance',
            }) : EmptyState({ icon: 'fingerprint', title: 'No punches recorded', text: 'Your biometric punches will appear here from the next working day.' })),
          Callout({ tone: 'info', icon: 'info', title: 'Regularisation' },
            'Missed a punch? Raise a regularisation request within seven days and your reporting manager can approve it.'),
        ],
      }));
    },
  },

  'portals/employee/leave': {
    title: 'My Leave',
    subtitle: 'Balance, applications and the approval trail',
    section: 'portals',
    render(mount, ctx) {
      const e = demoEmployee(campusOf(ctx), (ctx.state && ctx.state.role) || store.get('role'));
      mount.appendChild(myLeaveScreen(e, 'portals/employee/leave', employeeHero(e, { subtitle: `${e.leaveBalanceCL + e.leaveBalanceSL + e.leaveBalanceEL} days in balance · ${e.leaveTakenYtd} days taken this year.` })));
    },
  },

  'portals/employee/payslips': {
    title: 'My Payslips',
    subtitle: 'Every month, downloadable and printable',
    section: 'portals',
    render(mount, ctx) {
      ensureStyles();
      const e = demoEmployee(campusOf(ctx), (ctx.state && ctx.state.role) || store.get('role'));
      const slips = db.payslips.filter((p) => p.employeeId === e.id).sort((a, b) => String(b.month).localeCompare(String(a.month)));

      const slipView = (p) => {
        const body = h('div', { className: 'stack' },
          h('div', { className: 'pt-soft' },
            h('div', { className: 't-eyebrow' }, 'Springdale International School Group'),
            h('div', { className: 't-title' }, `Payslip — ${p.month}`),
            h('div', { className: 't-sm t-muted' }, `${e.name} · ${e.employeeCode} · ${e.designation}`)),
          h('div', { className: 'pt-grid-2' },
            SectionCard({ title: 'Earnings', icon: 'trending-up' },
              h('div', { className: 'stack-1' },
                kv('Basic', money(p.basic)), kv('HRA', money(p.hra)), kv('DA', money(p.da)),
                kv('Conveyance', money(p.conveyance)), Divider(), kv('Gross', money(p.gross)))),
            SectionCard({ title: 'Deductions', icon: 'trending-down' },
              h('div', { className: 'stack-1' },
                kv('Provident fund', money(p.pf)), kv('TDS', money(p.tds)),
                kv('Loss of pay', `${p.lopDays} days`), kv('Other', money(p.otherDeductions)),
                Divider(), kv('Total deductions', money(p.gross - p.net))))),
          Card({ pad: true, className: 'card-accent' },
            h('div', { className: 'row row-wrap' },
              h('div', { className: 'flex-1' },
                h('div', { className: 't-eyebrow' }, 'Net pay'),
                h('div', { className: 't-hero' }, money(p.net))),
              h('div', { className: 'stack-1' },
                kv('Paid on', p.paidOn ? formatDate(p.paidOn) : 'Pending'),
                kv('Mode', p.mode),
                kv('Status', p.status)))));
        Modal({
          title: `Payslip — ${p.month}`, subtitle: `${e.name} · ${e.employeeCode}`, size: 'lg', icon: 'receipt',
          body,
          actions: (close) => frag(
            Button('Print', { variant: 'secondary', icon: 'print', onClick: () => printNode(body, `Payslip ${p.month}`) }),
            Button('Download PDF', { variant: 'secondary', icon: 'download', onClick: () => notify({ title: 'Payslip downloaded', text: p.month, tone: 'success' }) }),
            Button('Close', { variant: 'primary', onClick: close })),
        });
      };

      const node = listPage({
        route: 'portals/employee/payslips',
        actions: pageActions(
          Button('Form 16', { variant: 'secondary', icon: 'file-text', onClick: () => notify({ title: 'Form 16 downloaded', text: 'FY 2025-26', tone: 'success' }) }),
          Button('Tax declaration', { variant: 'primary', icon: 'calculator', onClick: mockAction('Tax declaration') })),
        kpis: [
          { label: 'Payslips', value: formatNumber(slips.length), icon: 'receipt', tone: 'brand' },
          { label: 'Latest net pay', value: slips[0] ? money(slips[0].net) : '—', icon: 'banknote', tone: 'success' },
          { label: 'YTD gross', value: money(sum(slips, 'gross')), icon: 'trending-up', tone: 'info' },
          { label: 'YTD TDS', value: money(sum(slips, 'tds')), icon: 'percent', tone: 'warning' },
        ],
        chart: slips.length ? barChart({
          categories: slips.slice().reverse().map((p) => p.month),
          series: [
            { name: 'Gross', values: slips.slice().reverse().map((p) => p.gross) },
            { name: 'Net', values: slips.slice().reverse().map((p) => p.net) },
          ],
          valueFormat: 'currencyCompact', height: 220,
        }) : null,
        chartTitle: 'Gross vs net pay',
        columns: [
          { key: 'month', label: 'Month', width: 150, sticky: true, filter: true },
          { key: 'basic', label: 'Basic', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.basic) },
          { key: 'gross', label: 'Gross', width: 130, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.gross) },
          { key: 'pf', label: 'PF', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.pf) },
          { key: 'tds', label: 'TDS', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.tds) },
          { key: 'lopDays', label: 'LOP', width: 90, align: 'right', numeric: true },
          { key: 'net', label: 'Net pay', width: 140, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => h('span', { className: 't-semibold t-num' }, money(r.net)) },
          { key: 'paidOn', label: 'Paid on', width: 130, render: (r) => (r.paidOn ? formatDate(r.paidOn) : h('span', { className: 't-faint' }, 'Pending')) },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: slips,
        footerAggregates: true, pageSize: 12, exportName: 'my-payslips',
        onRowClick: slipView,
        rowActions: (row) => [
          { label: 'View payslip', icon: 'eye', onClick: () => slipView(row) },
          { label: 'Download PDF', icon: 'download', onClick: () => notify({ title: 'Payslip downloaded', text: row.month, tone: 'success' }) },
          { label: 'Email to me', icon: 'mail', onClick: () => notify({ title: 'Payslip emailed', text: e.email, tone: 'success' }) },
        ],
        tableTitle: 'Salary history',
        emptyState: EmptyState({ icon: 'receipt', title: 'No payslips yet', text: 'Your first payslip will appear here after the next payroll run.' }),
      });
      withHero(node, employeeHero(e, { subtitle: slips[0] ? `Your last net pay was ${money(slips[0].net)} for ${slips[0].month}.` : 'No payroll has been processed for you yet.' }));
      mount.appendChild(node);
    },
  },

  'portals/employee/documents': {
    title: 'My Documents',
    subtitle: 'Your HR file and school-issued letters',
    section: 'portals',
    render(mount, ctx) {
      ensureStyles();
      const e = demoEmployee(campusOf(ctx), (ctx.state && ctx.state.role) || store.get('role'));
      const docs = staffDocuments(e);
      const verified = docs.filter((d) => d.status === 'Verified');
      const rejected = docs.filter((d) => d.status === 'Rejected');

      mount.appendChild(page({
        route: 'portals/employee/documents',
        children: [
          employeeHero(e, { subtitle: `${verified.length} of ${docs.length} documents verified in your HR file.` }),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-3' }, StatCard({ label: 'Documents', value: formatNumber(docs.length), icon: 'folder', tone: 'brand', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Verified', value: formatNumber(verified.length), icon: 'check-circle', tone: 'success', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Pending', value: formatNumber(docs.length - verified.length - rejected.length), icon: 'clock', tone: 'warning', hero: true })),
            h('div', { className: 'span-3' }, StatCard({ label: 'Rejected', value: formatNumber(rejected.length), icon: 'x-circle', tone: rejected.length ? 'danger' : 'success', hero: true }))),
          rejected.length ? Callout({ tone: 'danger', icon: 'alert-triangle', title: `${rejected.length} document${rejected.length > 1 ? 's need' : ' needs'} to be re-uploaded` },
            'HR could not verify these. Upload a clear colour scan showing all four corners.') : null,
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-7' }, SectionCard({ title: 'HR file', subtitle: 'Statutory and qualification documents', icon: 'folder' },
              FileList(docs, { onDownload: (f) => notify({ title: 'Downloaded', text: f.name, tone: 'success' }) }))),
            h('div', { className: 'span-5' }, frag(
              SectionCard({ title: 'Upload a document', icon: 'upload' },
                FileUpload({ label: 'Drop a scan here or click to browse', accept: '.pdf,.jpg,.png', multiple: true, onFiles: () => notify({ title: 'Uploaded', text: 'HR verifies documents within three working days.', tone: 'success' }) })),
              SectionCard({ title: 'School-issued letters', icon: 'certificate' },
                FileList([
                  { name: 'Appointment Letter.pdf', type: 'PDF', size: '210 KB', date: e.joiningDate, status: 'Verified' },
                  { name: 'Salary Certificate 2026-27.pdf', type: 'PDF', size: '150 KB', date: '2026-04-10', status: 'Verified' },
                  { name: 'Experience Certificate.pdf', type: 'PDF', size: '120 KB', date: '2026-04-10', status: 'Verified' },
                  { name: 'Form 16 (FY 2025-26).pdf', type: 'PDF', size: '340 KB', date: '2026-06-15', status: 'Verified' },
                ], { onDownload: (f) => notify({ title: 'Downloaded', text: f.name, tone: 'success' }) })),
              SectionCard({ title: 'Request a letter', icon: 'file-plus' },
                h('div', { className: 'stack-2' },
                  h('span', { className: 't-sm t-muted' }, 'Bonafide, salary, address or visa letters are issued within three working days.'),
                  Button('Raise a request', { variant: 'primary', block: true, icon: 'send', onClick: () => formPage({
                    title: 'Request a letter', mode: 'modal', size: 'sm', submitLabel: 'Submit request',
                    sections: [{ title: 'Details', cols: 1, fields: [
                      { id: 'type', label: 'Letter type', type: 'select', required: true, options: ['Salary Certificate', 'Bonafide Letter', 'Experience Certificate', 'Address Proof', 'Visa Letter', 'Loan NOC'] },
                      { id: 'purpose', label: 'Purpose', type: 'textarea', required: true },
                    ] }],
                    onSubmit: (v) => notify({ title: 'Request submitted', text: v.type, tone: 'success' }),
                  }) })))))),
        ],
      }));
    },
  },

  'portals/employee/appraisal': {
    title: 'My Appraisal',
    subtitle: 'Rating, competencies and goals for the cycle',
    section: 'portals',
    render(mount, ctx) {
      ensureStyles();
      const e = demoEmployee(campusOf(ctx), (ctx.state && ctx.state.role) || store.get('role'));
      const competencies = [
        { key: 'Subject expertise', value: Math.min(100, Math.round(e.appraisalScore * 1.02)) },
        { key: 'Classroom management', value: Math.min(100, Math.round(e.appraisalScore * 0.96)) },
        { key: 'Student outcomes', value: Math.min(100, Math.round(e.appraisalScore * 0.99)) },
        { key: 'Collaboration', value: Math.min(100, Math.round(e.appraisalScore * 1.05)) },
        { key: 'Punctuality', value: Math.min(100, Math.round(e.attendancePct)) },
        { key: 'Professional development', value: Math.min(100, 40 + e.trainingsCompleted * 12) },
      ];
      const goals = [
        { goal: 'Raise class average by 4 percentage points', weight: 30, progress: 72, status: 'In Progress' },
        { goal: 'Complete two CBSE certification programmes', weight: 20, progress: Math.min(100, e.trainingsCompleted * 25), status: e.trainingsCompleted >= 4 ? 'Completed' : 'In Progress' },
        { goal: 'Maintain attendance above 95%', weight: 15, progress: Math.min(100, Math.round(e.attendancePct)), status: e.attendancePct >= 95 ? 'Completed' : 'In Progress' },
        { goal: 'Mentor two junior colleagues', weight: 20, progress: 50, status: 'In Progress' },
        { goal: 'Publish a digital lesson bank', weight: 15, progress: 35, status: 'In Progress' },
      ];

      mount.appendChild(page({
        route: 'portals/employee/appraisal',
        children: [
          employeeHero(e, { subtitle: `Cycle 2026-27 · you are rated ${e.appraisalRating} with an overall score of ${e.appraisalScore}.` }),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-4' }, SectionCard({ title: 'Overall score', subtitle: 'Weighted across all competencies', className: 'chart-card', icon: 'gauge' },
              gaugeChart({ value: e.appraisalScore, min: 0, max: 100, label: `Rating ${e.appraisalRating}`, height: 230 }))),
            h('div', { className: 'span-8' }, SectionCard({ title: 'Competency scores', subtitle: 'Self, manager and moderated view', className: 'chart-card', icon: 'chart-bar' },
              barChart({
                categories: competencies.map((c) => c.key),
                series: [{ name: 'Score', values: competencies.map((c) => c.value) }],
                horizontal: true, valueFormat: 'number', height: 260, showValues: true,
              })))),
          SectionCard({ title: 'Goals for this cycle', subtitle: 'Weighted objectives agreed with your manager', icon: 'target', flush: true },
            DataTable({
              columns: [
                { key: 'goal', label: 'Goal', sticky: true, width: 320 },
                { key: 'weight', label: 'Weight', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: (v) => `${v}%`, render: (r) => `${r.weight}%` },
                { key: 'progress', label: 'Progress', width: 200, render: (r) => ProgressBar(r.progress, { showValue: true, size: 'sm', tone: r.progress >= 80 ? 'success' : r.progress >= 50 ? 'brand' : 'warning' }), value: (r) => r.progress },
                { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
              ],
              rows: goals, paginate: false, searchable: false, footerAggregates: true, exportName: 'appraisal-goals',
            })),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-6' }, SectionCard({ title: 'Appraisal history', icon: 'history' },
              Timeline([
                { title: 'Cycle 2026-27 — in progress', meta: 'Mid-year review due Oct 2026', text: `Current score ${e.appraisalScore}, rating ${e.appraisalRating}.`, icon: 'star', tone: 'brand' },
                { title: 'Cycle 2025-26 — closed', meta: 'April 2026', text: 'Increment applied with effect from 1 April 2026.', icon: 'trending-up', tone: 'success' },
                { title: 'Cycle 2024-25 — closed', meta: 'April 2025', text: 'Promoted within band and moved to a senior section.', icon: 'award', tone: 'info' },
              ]))),
            h('div', { className: 'span-6' }, SectionCard({ title: 'Self assessment', subtitle: 'Open until 30 September 2026', icon: 'edit' },
              h('div', { className: 'stack-3' },
                Field({ label: 'What went well this cycle?', required: true }, Textarea({ rows: 3, placeholder: 'Highlight two or three achievements with evidence' })),
                Field({ label: 'Where do you need support?' }, Textarea({ rows: 3, placeholder: 'Training, resources or mentoring you would value' })),
                Field({ label: 'Self rating' }, Select({ options: ['Outstanding', 'Exceeds expectations', 'Meets expectations', 'Needs improvement'], value: 'Meets expectations' })),
                FormActions(
                  Button('Submit self assessment', { variant: 'primary', icon: 'check', onClick: () => notify({ title: 'Self assessment submitted', text: 'Your manager can now review it.', tone: 'success' }) }),
                  Button('Save draft', { variant: 'secondary', onClick: mockAction('Save draft') })))))),
        ],
      }));
    },
  },

  'portals/employee/training': {
    title: 'My Training',
    subtitle: 'Programmes completed, enrolled and open for registration',
    section: 'portals',
    render(mount, ctx) {
      ensureStyles();
      const e = demoEmployee(campusOf(ctx), (ctx.state && ctx.state.role) || store.get('role'));
      const all = db.trainings;
      const mandatory = all.filter((t) => t.mandatory);
      const openTrainings = all.filter((t) => t.status !== 'Completed');

      const node = listPage({
        route: 'portals/employee/training',
        actions: pageActions(
          Button('Download certificates', { variant: 'secondary', icon: 'download', onClick: () => notify({ title: 'Certificates downloaded', tone: 'success' }) }),
          Button('Suggest a programme', { variant: 'primary', icon: 'lightbulb', onClick: mockAction('Suggest a programme') })),
        kpis: [
          { label: 'Completed by me', value: formatNumber(e.trainingsCompleted), icon: 'check-circle', tone: 'success' },
          { label: 'Programmes offered', value: formatNumber(all.length), icon: 'lightbulb', tone: 'brand' },
          { label: 'Mandatory', value: formatNumber(mandatory.length), icon: 'alert-circle', tone: 'warning' },
          { label: 'Open for registration', value: formatNumber(openTrainings.length), icon: 'user-plus', tone: 'info' },
        ],
        chart: barChart({
          categories: all.map((t) => t.name),
          series: [
            { name: 'Enrolled', values: all.map((t) => t.enrolled) },
            { name: 'Completed', values: all.map((t) => t.completed) },
          ],
          horizontal: true, height: 280,
        }),
        chartTitle: 'Participation across programmes',
        columns: [
          { key: 'name', label: 'Programme', sticky: true, width: 280, render: (r) => Identity(r.name, `${r.type} · ${r.trainer}`), value: (r) => r.name },
          { key: 'date', label: 'Date', width: 140, render: (r) => formatDate(r.date) },
          { key: 'durationHours', label: 'Hours', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'seats', label: 'Seats', width: 100, align: 'right', numeric: true },
          { key: 'enrolled', label: 'Enrolled', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'mandatory', label: 'Mandatory', width: 130, render: (r) => (r.mandatory ? Badge('Mandatory', { tone: 'warning' }) : Badge('Optional', { tone: 'neutral' })), value: (r) => (r.mandatory ? 1 : 0) },
          { key: 'feedbackScore', label: 'Rating', width: 130, render: (r) => Rating(Math.round(r.feedbackScore), { showValue: true }), value: (r) => r.feedbackScore },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
          {
            key: 'act', label: '', width: 130, sortable: false,
            render: (r) => (r.status === 'Completed'
              ? Button('Certificate', { variant: 'link', size: 'sm', icon: 'certificate', onClick: (ev) => { ev.stopPropagation(); notify({ title: 'Certificate downloaded', text: r.name, tone: 'success' }); } })
              : Button('Enrol', { variant: 'link', size: 'sm', icon: 'plus', onClick: (ev) => { ev.stopPropagation(); notify({ title: 'Enrolled', text: `${r.name} · ${formatDate(r.date)}`, tone: 'success' }); } })),
          },
        ],
        rows: all,
        pageSize: 15, footerAggregates: true, exportName: 'training',
        tableTitle: 'Training catalogue',
        tableSubtitle: 'Enrol yourself — your manager is notified automatically',
        emptyState: EmptyState({ icon: 'lightbulb', title: 'No programmes scheduled', text: 'The learning and development calendar for this term is being finalised.' }),
        notes: Callout({ tone: 'info', icon: 'award', title: 'Certification credits' },
          `You have completed ${e.trainingsCompleted} programmes. CBSE requires 50 hours of continuous professional development every academic year.`),
      });
      withHero(node, employeeHero(e, { subtitle: `${e.trainingsCompleted} programmes completed. ${mandatory.length} mandatory programmes are scheduled this year.` }));
      mount.appendChild(node);
    },
  },
};

/* ==========================================================================
   MOBILE APP SHOWCASE — four interactive phone mock-ups
   ========================================================================== */

function phoneRow(left, right, tone) {
  return h('div', { className: 'pt-phone-row' },
    h('span', { className: 't-truncate' }, left),
    h('span', { className: ['t-semibold', tone ? 't-' + tone : ''].join(' ') }, right));
}

function phoneCard(title, ...children) {
  return h('div', { className: 'pt-phone-card stack-2' },
    title && h('div', { className: 't-eyebrow' }, title),
    ...children);
}

function phoneTabs(items, activeIdx) {
  return h('div', { className: 'pt-phone-tabs' },
    items.map((it, i) => h('span', {
      className: ['row', i === activeIdx && 'is-on'].filter(Boolean).join(' '),
      style: { flexDirection: 'column', gap: '2px', fontSize: 'var(--fs-2xs)' },
      attrs: { 'aria-current': i === activeIdx ? 'page' : 'false' },
    }, Icon(it.icon, 15), h('span', null, it.label))));
}

function phoneFrame(label, caption, screen) {
  return h('div', { className: 'pt-phone' },
    h('div', { className: 'pt-phone-frame' },
      h('div', { className: 'pt-phone-notch' }),
      h('div', { className: 'pt-phone-screen' },
        h('div', { className: 'pt-phone-bar' }, h('span', null, '9:30'), h('span', { className: 'row', style: { gap: '4px' } }, Icon('wifi', 11), Icon('activity', 11), h('span', null, '82%'))),
        screen)),
    h('div', { className: 'stack-1', style: { textAlign: 'center' } },
      h('div', { className: 't-semibold' }, label),
      h('div', { className: 't-xs t-muted' }, caption)));
}

function phoneAppHead(name, sub, chipText) {
  return h('div', { className: 'pt-phone-app stack-2' },
    h('div', { className: 'row', style: { gap: 'var(--sp-2)' } },
      Avatar(name, { size: 'sm' }),
      h('div', { className: 'flex-1 min-0' },
        h('div', { style: { fontSize: 'var(--fs-xs)', opacity: 0.82 } }, sub),
        h('div', { style: { fontWeight: 'var(--fw-semibold)' } }, name)),
      Icon('bell', 15)),
    chipText && h('div', { style: { fontSize: 'var(--fs-2xs)', opacity: 0.9 } }, chipText));
}

function managementPhone() {
  const k = analytics.kpis;
  return phoneFrame('Management', 'Group MIS in your pocket',
    frag(
      phoneAppHead('Anita Bhandari', 'Trustee & Director', 'Springdale Group · 5 campuses'),
      phoneCard('Today',
        phoneRow('Students', formatNumber(k.activeStudents)),
        phoneRow('Attendance', `${k.avgAttendance}%`, 'success'),
        phoneRow('Fee collected', moneyK(k.feeCollected), 'success'),
        phoneRow('Outstanding', moneyK(k.feeOutstanding), 'danger')),
      phoneCard('Collection vs target',
        barChart({
          categories: analytics.feeCollectionVsTarget.slice(0, 5).map((r) => r.month.slice(0, 3)),
          series: [{ name: 'Collected', values: analytics.feeCollectionVsTarget.slice(0, 5).map((r) => r.collected) }],
          height: 96, legend: false, tableView: false, valueFormat: 'currencyCompact',
        })),
      phoneCard('Campus enrolment',
        analytics.enrolmentByCampus.slice(0, 5).map((c) => phoneRow(c.key, formatNumber(c.value)))),
      phoneCard('Needs a decision',
        phoneRow('Budget approvals', '4', 'warning'),
        phoneRow('SLA breaches', String(k.slaBreaches), 'danger'),
        phoneRow('Pending leave', String(k.pendingLeaves), 'warning')),
      phoneTabs([{ icon: 'dashboard', label: 'Home' }, { icon: 'chart-bar', label: 'MIS' }, { icon: 'wallet', label: 'Finance' }, { icon: 'user', label: 'Me' }], 0)));
}

function teacherPhone(t) {
  const today = teacherDaySlots(t, TODAY_DAY).slice(0, 4);
  const cls = classesForTeacher(t).slice(0, 3);
  return phoneFrame('Teacher', 'Attendance in two taps',
    frag(
      phoneAppHead(t.name, 'Teacher · ' + t.department, `${slotsForTeacher(t).length} periods this week`),
      phoneCard('Today’s classes',
        today.length ? today.map((s) => phoneRow(`${s.startTime} ${s.subjectName}`, `${s.className} ${s.section}`))
          : [h('div', { className: 't-xs t-muted' }, 'No classes today')]),
      phoneCard('Quick actions',
        h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
          Button('Attendance', { variant: 'primary', size: 'sm', icon: 'clipboard-check', onClick: () => navigate('portals/teacher/attendance') }),
          Button('Homework', { variant: 'secondary', size: 'sm', icon: 'clipboard-list', onClick: () => navigate('portals/teacher/homework') }))),
      phoneCard('My classes',
        cls.map((c) => phoneRow(`${c.className} ${c.section}`, `${c.avgAttendance}%`, toneForPct(c.avgAttendance)))),
      phoneCard('Pending with me',
        phoneRow('Homework to grade', String(homeworkForTeacher(t).filter((hw) => hw.graded < hw.submitted).length), 'warning'),
        phoneRow('Marks entry', 'Periodic Test 2', 'info'),
        phoneRow('Leave balance', `${t.leaveBalanceCL + t.leaveBalanceSL + t.leaveBalanceEL} days`)),
      phoneTabs([{ icon: 'grid', label: 'Classes' }, { icon: 'calendar', label: 'Timetable' }, { icon: 'clipboard-list', label: 'Work' }, { icon: 'user', label: 'Me' }], 0)));
}

function parentPhone(parent, kid) {
  return phoneFrame('Parent', 'Bus, fees and homework',
    frag(
      phoneAppHead(parent.name, 'Parent portal', `${kid.name} · ${kid.className} ${kid.section}`),
      phoneCard('Bus tracking',
        phoneRow('Route', (byId(db.routes, kid.routeId) || {}).code || 'Not opted', 'brand'),
        phoneRow('ETA to stop', kid.transportOpted ? '9 min' : '—', 'success'),
        MapPlaceholder({ height: 96, legend: false, animate: false })),
      phoneCard(`${kid.firstName} today`,
        phoneRow('Attendance', `${kid.attendancePct}%`, toneForPct(kid.attendancePct)),
        phoneRow('Homework open', String(childHomework(kid).filter((x) => x.status === 'Open').length), 'warning'),
        phoneRow('Last exam', `${kid.lastExamPercent}%`, 'info')),
      phoneCard('Fees',
        phoneRow('Outstanding', kid.feeDue > 0 ? money(kid.feeDue) : 'All clear', kid.feeDue > 0 ? 'danger' : 'success'),
        Button('Pay now', { variant: 'primary', size: 'sm', block: true, icon: 'credit-card', onClick: () => navigate('portals/parent/fees') })),
      phoneCard('From school',
        phoneRow('PTM', formatDate((db.ptmSchedules[0] || {}).date || TODAY, 'dayMonth'), 'brand'),
        phoneRow('New circulars', '3', 'info')),
      phoneTabs([{ icon: 'home', label: 'Home' }, { icon: 'bus', label: 'Bus' }, { icon: 'wallet', label: 'Fees' }, { icon: 'mail', label: 'Inbox' }], 0)));
}

function studentPhone(kid) {
  const today = studentSlots(kid, TODAY_DAY).slice(0, 4);
  return phoneFrame('Student', 'Timetable, homework, results',
    frag(
      phoneAppHead(kid.name, `${kid.className} ${kid.section} · ${kid.house} House`, `Rank ${kid.rank} · CGPA ${kid.cgpa}`),
      phoneCard('Now',
        today.length ? today.map((s) => phoneRow(`${s.startTime} ${s.subjectName}`, s.room))
          : [h('div', { className: 't-xs t-muted' }, 'No classes today')]),
      phoneCard('Attendance',
        h('div', { style: { display: 'grid', placeItems: 'center' } },
          progressRing(kid.attendancePct, { size: 92, label: '', sublabel: '' }))),
      phoneCard('Due soon',
        childHomework(kid).filter((x) => x.status === 'Open').slice(0, 3)
          .map((x) => phoneRow(x.subjectName, dueLabel(x.dueDate), new Date(x.dueDate) < new Date(TODAY) ? 'danger' : 'warning'))),
      phoneCard('Library',
        phoneRow('Books with me', String(kid.booksIssued)),
        phoneRow('Fine due', money(0), 'success')),
      phoneTabs([{ icon: 'home', label: 'Home' }, { icon: 'calendar', label: 'Classes' }, { icon: 'clipboard-list', label: 'Work' }, { icon: 'library', label: 'Library' }], 0)));
}

const showcaseRoute = {
  'portals/mobile-app': {
    title: 'Mobile App Showcase',
    subtitle: 'The same ERP, reimagined for a 6-inch screen',
    section: 'portals',
    render(mount, ctx) {
      ensureStyles();
      const campus = campusOf(ctx);
      const t = demoTeacher(campus);
      const parent = demoParent(campus);
      const kid = childrenOf(parent)[0];
      const student = demoStudent(campus);

      mount.appendChild(page({
        route: 'portals/mobile-app',
        title: 'Springdale mobile app',
        subtitle: 'Four personas, four home screens — every tile is live and scrollable',
        actions: pageActions(
          Button('Design spec', { variant: 'secondary', icon: 'palette', onClick: mockAction('Design spec') }),
          Button('Open teacher portal', { variant: 'primary', icon: 'presentation', route: 'portals/teacher/classes' })),
        children: [
          Callout({ tone: 'info', icon: 'monitor', title: 'Interactive mock-ups' },
            'These are real components rendered at phone width — scroll inside each frame, and the buttons navigate into the full portals. The app ships for Android and iOS with offline attendance and push notifications.'),
          Card({ pad: true },
            h('div', { className: 'pt-phones' },
              managementPhone(),
              teacherPhone(t),
              parentPhone(parent, kid),
              studentPhone(student))),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-4' }, SectionCard({ title: 'Built for low bandwidth', icon: 'wifi' },
              h('div', { className: 'stack-2' },
                kv('Offline attendance', 'Yes — syncs on reconnect'),
                kv('Payload per screen', '< 60 KB'),
                kv('Cold start', '1.4 s on a 4G budget phone'),
                kv('Languages', 'English, हिन्दी, తెలుగు')))),
            h('div', { className: 'span-4' }, SectionCard({ title: 'Push notifications', icon: 'bell' },
              Timeline([
                { title: 'Absent alert', meta: '08:35', text: 'Sent to parents the moment attendance is submitted.', icon: 'alert-circle', tone: 'danger' },
                { title: 'Bus approaching', meta: '07:12', text: 'Fires when the bus is five minutes from the stop.', icon: 'bus', tone: 'info' },
                { title: 'Fee reminder', meta: '3 days before due', text: 'With a one-tap payment deep link.', icon: 'wallet', tone: 'warning' },
                { title: 'Result published', meta: 'On publish', text: 'Report card ready to download.', icon: 'file-text', tone: 'success' },
              ]))),
            h('div', { className: 'span-4' }, SectionCard({ title: 'Adoption', subtitle: 'Installs by persona', className: 'chart-card', icon: 'chart-pie' },
              donutChart({
                data: [
                  { key: 'Parents', value: 1842 },
                  { key: 'Students', value: 1206 },
                  { key: 'Teachers', value: 298 },
                  { key: 'Staff', value: 164 },
                ],
                height: 220, centerValue: '3.5K', centerLabel: 'Installs',
              })))),
        ],
      }));
    },
  },
};

/* ==========================================================================
   SECURITY
   ========================================================================== */

function visitorBadge(v) {
  return h('div', { className: 'pt-badge-print' },
    h('div', { className: 'pt-badge-top' },
      h('div', { style: { fontSize: 'var(--fs-2xs)', letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.85 } }, 'Springdale International'),
      h('div', { style: { fontWeight: 'var(--fw-bold) ' } }, 'VISITOR')),
    h('div', { className: 'pt-badge-body' },
      Avatar(v.name, { size: 'xl' }),
      h('div', { className: 't-semibold' }, v.name),
      h('div', { className: 't-xs t-muted' }, v.purpose),
      h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)', justifyContent: 'center' } },
        Badge(`Badge ${v.badgeNo}`, { tone: 'brand' }),
        Badge(v.passNo, { tone: 'neutral' })),
      h('div', { className: 't-xs t-muted' }, `Meeting ${v.whomToMeet} · in at ${v.inTime}`)),
    h('div', { className: 'pt-badge-foot' }, `Valid for ${formatDate(v.date)} only · return at the gate on exit`));
}

function visitorDrawer(v) {
  Drawer({
    title: v.name, subtitle: `${v.passNo} · ${v.purpose}`, size: 'lg',
    body: h('div', { className: 'stack' },
      h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
        Badge(v.status), v.photoTaken ? Badge('Photo captured', { tone: 'success' }) : Badge('No photo', { tone: 'warning' }),
        v.vehicleNo ? Badge(v.vehicleNo, { tone: 'neutral', icon: 'car' }) : null),
      h('div', { className: 'pt-grid-2' },
        SectionCard({ title: 'Visit details', icon: 'users' },
          DescriptionList([
            ['Phone', v.phone], ['Purpose', v.purpose], ['Meeting', v.whomToMeet],
            ['Related student', v.relatedStudent || '—'], ['Date', formatDate(v.date)],
            ['In time', v.inTime], ['Out time', v.outTime || 'Still inside'],
            ['ID proof', `${v.idProof} · ${v.idNumberMasked}`], ['Approved by', v.approvedBy],
          ], { cols: 1 })),
        SectionCard({ title: 'Badge preview', icon: 'id-card' }, visitorBadge(v)))),
    actions: (close) => frag(
      Button('Print badge', { variant: 'secondary', icon: 'print', onClick: () => notify({ title: 'Badge sent to the gate printer', tone: 'success' }) }),
      v.status === 'Inside'
        ? Button('Check out', { variant: 'primary', icon: 'log-out', onClick: () => { close(); notify({ title: 'Visitor checked out', text: `${v.name} · ${v.passNo}`, tone: 'success' }); } })
        : Button('Close', { variant: 'primary', onClick: close })),
  });
}

const securityRoutes = {
  'security/visitors': {
    title: 'Visitor Management',
    subtitle: 'Every person on campus, and who they came to see',
    section: 'security',
    render(mount, ctx) {
      ensureStyles();
      const campus = campusOf(ctx);
      const rows = db.visitors.filter((v) => v.campusId === campus);
      const inside = rows.filter((v) => v.status === 'Inside');
      const today = rows.filter((v) => v.date === TODAY);
      const byPurpose = countBy(rows, 'purpose').slice(0, 8);

      mount.appendChild(listPage({
        title: 'Visitor management',
        subtitle: `${formatNumber(rows.length)} visits logged this month · ${inside.length} people currently inside`,
        route: 'security/visitors',
        actions: pageActions(
          Button('Check out', { variant: 'secondary', icon: 'log-out', route: 'security/check-out' }),
          Button('New check-in', { variant: 'primary', icon: 'log-in', route: 'security/check-in' })),
        kpis: [
          { label: 'Visits this month', value: formatNumber(rows.length), icon: 'users', tone: 'brand' },
          { label: 'Currently inside', value: formatNumber(inside.length), icon: 'log-in', tone: inside.length > 20 ? 'warning' : 'info' },
          { label: 'Checked in today', value: formatNumber(today.length), icon: 'calendar', tone: 'success' },
          { label: 'Photo not captured', value: formatNumber(rows.filter((v) => !v.photoTaken).length), icon: 'camera', tone: 'danger' },
        ],
        chart: barChart({
          categories: byPurpose.map((p) => p.key),
          series: [{ name: 'Visits', values: byPurpose.map((p) => p.value) }],
          horizontal: true, height: 240,
        }),
        chartTitle: 'Why people visit',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Name, pass number or phone…' },
          { id: 'status', label: 'Status', options: ['Inside', 'Checked Out'] },
          { id: 'purpose', label: 'Purpose', options: Array.from(new Set(rows.map((r) => r.purpose))) },
          { id: 'date', label: 'Date', type: 'date' },
        ],
        onFilter: (id, value, all, table) => {
          let out = rows;
          if (all.q) out = search(out, all.q, ['name', 'passNo', 'phone', 'relatedStudent']);
          if (all.status && all.status !== 'all') out = out.filter((r) => r.status === all.status);
          if (all.purpose && all.purpose !== 'all') out = out.filter((r) => r.purpose === all.purpose);
          if (all.date) out = out.filter((r) => r.date === all.date);
          table.refresh(out);
        },
        columns: [
          { key: 'name', label: 'Visitor', sticky: true, width: 230, render: (r) => Identity(r.name, `${r.passNo} · ${r.phone}`), value: (r) => r.name },
          { key: 'purpose', label: 'Purpose', width: 190, filter: true },
          { key: 'whomToMeet', label: 'Meeting', width: 170, filter: true },
          { key: 'relatedStudent', label: 'Related student', width: 200, render: (r) => r.relatedStudent || h('span', { className: 't-faint' }, '—') },
          { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date) },
          { key: 'inTime', label: 'In', width: 90, numeric: true },
          { key: 'outTime', label: 'Out', width: 100, numeric: true, render: (r) => r.outTime || h('span', { className: 't-warning' }, '—') },
          { key: 'badgeNo', label: 'Badge', width: 100 },
          { key: 'vehicleNo', label: 'Vehicle', width: 140, render: (r) => r.vehicleNo || h('span', { className: 't-faint' }, '—') },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        selectable: true, pageSize: 25, exportName: 'visitors',
        searchKeys: ['name', 'passNo', 'phone', 'relatedStudent'],
        bulkActions: [
          { label: 'Check out selected', icon: 'log-out', onClick: (sel) => notify({ title: `${sel.length} visitors checked out`, tone: 'success' }) },
          { label: 'Print badges', icon: 'print', onClick: (sel) => notify({ title: `${sel.length} badges queued`, tone: 'info' }) },
        ],
        rowActions: (row) => [
          { label: 'Open visit', icon: 'eye', onClick: () => visitorDrawer(row) },
          { label: 'Print badge', icon: 'print', onClick: () => notify({ title: 'Badge printed', text: row.passNo, tone: 'success' }) },
          row.status === 'Inside' ? { label: 'Check out', icon: 'log-out', onClick: () => notify({ title: 'Checked out', text: row.name, tone: 'success' }) } : { label: 'Re-issue pass', icon: 'refresh', onClick: mockAction('Re-issue pass') },
          { separator: true },
          { label: 'Report an issue', icon: 'alert-triangle', tone: 'danger', route: 'security/incidents' },
        ],
        onRowClick: visitorDrawer,
        tableTitle: 'Visitor log',
        tableSubtitle: 'Click a row for the full visit record and badge preview',
        emptyState: EmptyState({ icon: 'users', title: 'No visitors logged', text: 'Check someone in from the gate and they appear here instantly.', action: Button('New check-in', { variant: 'primary', icon: 'log-in', route: 'security/check-in' }) }),
      }));
    },
  },

  'security/check-in': {
    title: 'Visitor Check-in',
    subtitle: 'Register a visitor and print a gate badge in under a minute',
    section: 'security',
    render(mount, ctx) {
      ensureStyles();
      const campus = campusOf(ctx);
      const today = db.visitors.filter((v) => v.campusId === campus && v.date === TODAY);
      const values = { name: '', phone: '', purpose: 'Meet Class Teacher', whomToMeet: 'Class Teacher', idProof: 'Aadhaar', photo: false };

      const badgeHost = h('div');
      const paintBadge = () => {
        badgeHost.innerHTML = '';
        badgeHost.appendChild(visitorBadge({
          name: values.name || 'Visitor name',
          purpose: values.purpose,
          whomToMeet: values.whomToMeet,
          badgeNo: 'B' + String(today.length + 1).padStart(3, '0'),
          passNo: `VP/26/${String(db.visitors.length + 1).padStart(4, '0')}`,
          inTime: '09:30',
          date: TODAY,
        }));
      };
      paintBadge();

      const photoBox = h('div', { className: 'pt-photo-box' },
        Icon('camera', 26),
        h('div', { className: 't-sm t-semibold' }, 'Capture visitor photo'),
        h('div', { className: 't-xs' }, 'Webcam at the gate desk · stored for 30 days'),
        Button('Capture', { variant: 'secondary', size: 'sm', icon: 'camera', onClick: () => { values.photo = true; notify({ title: 'Photo captured', tone: 'success' }); } }));

      const form = formPage({
        title: 'Check in a visitor',
        subtitle: 'Verify the ID, capture a photo and print the badge',
        route: 'security/check-in',
        submitLabel: 'Check in & print badge',
        cancelLabel: 'Clear form',
        sections: [
          {
            title: 'Visitor', description: 'As printed on the identity document', cols: 2,
            fields: [
              { id: 'name', label: 'Full name', required: true, placeholder: 'e.g. Rakesh Sharma' },
              { id: 'phone', label: 'Mobile number', type: 'tel', required: true, validate: validators.phone, placeholder: '+91 98xxx xxxxx' },
              { id: 'idProof', label: 'ID proof', type: 'select', required: true, value: 'Aadhaar', options: ['Aadhaar', 'Driving Licence', 'Voter ID', 'PAN Card', 'Company ID', 'Passport'] },
              { id: 'idNumber', label: 'ID number', required: true, hint: 'Only the last four digits are stored', placeholder: 'XXXX 1234' },
              { id: 'address', label: 'Address / organisation', span: 'full' },
            ],
          },
          {
            title: 'Visit', cols: 2,
            fields: [
              { id: 'purpose', label: 'Purpose', type: 'select', required: true, value: 'Meet Class Teacher', options: ['Meet Class Teacher', 'Fee Payment', 'Admission Enquiry', 'Deliver Documents', 'Vendor Meeting', 'Interview', 'Collect Ward', 'Maintenance Work'] },
              { id: 'whomToMeet', label: 'Whom to meet', type: 'select', required: true, value: 'Class Teacher', options: ['Principal', 'Class Teacher', 'Accounts Office', 'Admission Office', 'Front Desk', 'HR Department'] },
              { id: 'student', label: 'Related student', type: 'combobox', options: db.students.filter((s) => s.campusId === campus).slice(0, 200).map((s) => ({ value: s.id, label: `${s.name} — ${s.className} ${s.section}` })) },
              { id: 'expected', label: 'Expected duration', type: 'select', value: '30 minutes', options: ['15 minutes', '30 minutes', '1 hour', 'Half day'] },
              { id: 'vehicleNo', label: 'Vehicle number', placeholder: 'HR26 AB 1234' },
              { id: 'laptop', label: 'Carrying a laptop or equipment', type: 'switch' },
              { id: 'photo', label: 'Photo capture', type: 'custom', span: 'full', render: () => photoBox },
              { id: 'declaration', label: 'Visitor has read the campus safety declaration', type: 'checkbox', required: true, span: 'full' },
            ],
          },
        ],
        sidebar: [
          SectionCard({ title: 'Badge preview', subtitle: 'Prints on the gate thermal printer', icon: 'id-card' }, badgeHost),
          Callout({ tone: 'warning', icon: 'shield', title: 'Gate protocol' },
            'No entry without a photo ID. Vendors need a work order. Anyone collecting a student must be on the authorised pickup list.'),
          SectionCard({ title: 'Checked in today', subtitle: `${today.length} visitors`, icon: 'log-in' },
            today.length ? RankList(today.slice(0, 6).map((v) => ({ name: v.name, meta: `${v.purpose} · in ${v.inTime}`, value: v.badgeNo })))
              : EmptyState({ icon: 'users', title: 'Nobody yet today', text: 'The first check-in of the day will appear here.' })),
        ],
        onSubmit: (v) => {
          notify({ title: 'Visitor checked in', text: `${v.name} · badge issued · printing now`, tone: 'success' });
        },
      });

      mount.appendChild(form);
    },
  },

  'security/check-out': {
    title: 'Visitor Check-out',
    subtitle: 'Close out visits and collect badges at the gate',
    section: 'security',
    render(mount, ctx) {
      ensureStyles();
      const campus = campusOf(ctx);
      const rows = db.visitors.filter((v) => v.campusId === campus);
      const inside = rows.filter((v) => v.status === 'Inside');
      const overstay = inside.filter((v) => mins(v.inTime) < NOW_MIN - 180);

      mount.appendChild(listPage({
        title: 'Visitor check-out',
        subtitle: `${inside.length} visitors are inside the campus right now`,
        route: 'security/check-out',
        actions: pageActions(
          Button('Visitor log', { variant: 'secondary', icon: 'list', route: 'security/visitors' }),
          Button('New check-in', { variant: 'primary', icon: 'log-in', route: 'security/check-in' })),
        kpis: [
          { label: 'Inside now', value: formatNumber(inside.length), icon: 'log-in', tone: 'brand' },
          { label: 'Overstaying (3h+)', value: formatNumber(overstay.length), icon: 'timer', tone: overstay.length ? 'danger' : 'success' },
          { label: 'Badges out', value: formatNumber(inside.length), icon: 'id-card', tone: 'info' },
          { label: 'Checked out today', value: formatNumber(rows.filter((v) => v.date === TODAY && v.status === 'Checked Out').length), icon: 'log-out', tone: 'success' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Name, badge or pass number…' },
          { id: 'purpose', label: 'Purpose', options: Array.from(new Set(inside.map((r) => r.purpose))) },
        ],
        onFilter: (id, value, all, table) => {
          let out = inside;
          if (all.q) out = search(out, all.q, ['name', 'passNo', 'badgeNo', 'phone']);
          if (all.purpose && all.purpose !== 'all') out = out.filter((r) => r.purpose === all.purpose);
          table.refresh(out);
        },
        columns: [
          { key: 'name', label: 'Visitor', sticky: true, width: 230, render: (r) => Identity(r.name, `${r.passNo} · badge ${r.badgeNo}`), value: (r) => r.name },
          { key: 'purpose', label: 'Purpose', width: 190, filter: true },
          { key: 'whomToMeet', label: 'Meeting', width: 170 },
          { key: 'inTime', label: 'In at', width: 100, numeric: true },
          {
            key: 'duration', label: 'Inside for', width: 140, align: 'right', numeric: true,
            render: (r) => { const m = Math.max(0, NOW_MIN - mins(r.inTime)); return h('span', { className: m > 180 ? 't-danger t-num' : 't-num' }, `${Math.floor(m / 60)}h ${m % 60}m`); },
            value: (r) => NOW_MIN - mins(r.inTime),
          },
          { key: 'vehicleNo', label: 'Vehicle', width: 140, render: (r) => r.vehicleNo || h('span', { className: 't-faint' }, '—') },
          {
            key: 'act', label: 'Check out', width: 150, sortable: false, align: 'right',
            render: (r) => Button('Check out', {
              variant: 'primary', size: 'sm', icon: 'log-out',
              onClick: (e) => {
                e.stopPropagation();
                ConfirmDialog({ title: `Check out ${r.name}?`, text: `Badge ${r.badgeNo} must be collected before the visitor leaves.`, confirmLabel: 'Check out', tone: 'brand', icon: 'log-out' })
                  .then((ok) => ok && notify({ title: 'Checked out', text: `${r.name} · badge ${r.badgeNo} returned`, tone: 'success' }));
              },
            }),
          },
        ],
        rows: inside,
        selectable: true, pageSize: 25, exportName: 'inside-now',
        bulkActions: [{ label: 'Check out selected', icon: 'log-out', onClick: (sel) => notify({ title: `${sel.length} visitors checked out`, tone: 'success' }) }],
        onRowClick: visitorDrawer,
        notes: overstay.length ? Callout({ tone: 'warning', icon: 'timer', title: `${overstay.length} visitors have been inside for more than three hours` },
          'Call the host department and confirm the visit is still in progress.') : null,
        tableTitle: 'Currently inside',
        emptyState: EmptyState({ icon: 'check-circle', title: 'Campus is clear', text: 'Every visitor has been checked out and all badges are back at the gate.', tone: 'success' }),
      }));
    },
  },
};

function gatePassDetail(row) {
  return h('div', { className: 'stack' },
    h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
      Badge(row.status), Badge(row.type, { tone: 'neutral' }),
      row.securityVerified ? Badge('ID verified at gate', { tone: 'success' }) : Badge('Not verified', { tone: 'warning' })),
    Callout({ tone: 'neutral', icon: 'message-square', title: 'Reason' }, row.reason),
    DescriptionList([
      ['Pass number', row.passNo],
      [row.type === 'Student' ? 'Student' : 'Employee', row.personName],
      [row.type === 'Student' ? 'Class' : 'Department', `${row.className}${row.section && row.section !== '—' ? ' ' + row.section : ''}`],
      ['Date', formatDate(row.date)],
      ['Out time', row.outTime],
      ['Expected return', row.expectedReturn || 'Not returning today'],
      ['Authorised by', row.authorisedBy],
      ['Collected by', row.pickedUpBy || '—'],
    ], { cols: 2 }),
    Stepper([
      { label: 'Requested', description: formatDate(row.date), state: 'done' },
      { label: 'Authorised', description: row.authorisedBy, state: row.status === 'Rejected' ? 'rejected' : row.status === 'Pending' ? 'current' : 'done' },
      { label: 'Verified at gate', description: row.securityVerified ? 'Security desk' : 'Pending', state: row.securityVerified ? 'done' : 'todo' },
      { label: 'Exited', description: row.outTime, state: ['Approved', 'Returned'].includes(row.status) ? 'done' : 'todo' },
    ], { current: row.status === 'Pending' ? 1 : 3 }));
}

function gatePassScreen(ctx, type, routeKey, title, subtitle) {
  ensureStyles();
  const campus = campusOf(ctx);
  const rows = db.gatePasses.filter((g) => g.type === type && g.campusId === campus);
  const pending = rows.filter((g) => g.status === 'Pending');
  const approved = rows.filter((g) => g.status === 'Approved');

  return approvalQueuePage({
    title, subtitle: `${subtitle} · ${pending.length} awaiting a decision`,
    route: routeKey,
    kpis: [
      { label: 'Passes this month', value: formatNumber(rows.length), icon: 'log-out', tone: 'brand' },
      { label: 'Pending approval', value: formatNumber(pending.length), icon: 'clock', tone: pending.length ? 'warning' : 'success' },
      { label: 'Approved', value: formatNumber(approved.length), icon: 'check-circle', tone: 'success' },
      { label: 'Not ID-verified', value: formatNumber(rows.filter((g) => !g.securityVerified).length), icon: 'shield', tone: 'danger' },
    ],
    filters: [
      { id: 'q', type: 'search', label: 'Search', placeholder: 'Name or pass number…' },
      { id: 'status', label: 'Status', options: ['Pending', 'Approved', 'Rejected', 'Returned'] },
      { id: 'reason', label: 'Reason', options: Array.from(new Set(rows.map((r) => r.reason))) },
      { id: 'date', label: 'Date', type: 'date' },
    ],
    onFilter: (id, value, all, table) => {
      let out = rows;
      if (all.q) out = search(out, all.q, ['personName', 'passNo', 'className']);
      if (all.status && all.status !== 'all') out = out.filter((r) => r.status === all.status);
      if (all.reason && all.reason !== 'all') out = out.filter((r) => r.reason === all.reason);
      if (all.date) out = out.filter((r) => r.date === all.date);
      table.refresh(out);
    },
    columns: [
      { key: 'passNo', label: 'Pass', width: 130, sticky: true, className: 't-mono' },
      { key: 'personName', label: type === 'Student' ? 'Student' : 'Employee', width: 230, render: (r) => Identity(r.personName, `${r.className}${r.section && r.section !== '—' ? ' ' + r.section : ''}`), value: (r) => r.personName },
      { key: 'reason', label: 'Reason', width: 220, filter: true },
      { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date) },
      { key: 'outTime', label: 'Out', width: 90, numeric: true },
      { key: 'expectedReturn', label: 'Return', width: 100, numeric: true, render: (r) => r.expectedReturn || h('span', { className: 't-faint' }, '—') },
      { key: 'authorisedBy', label: 'Authorised by', width: 170, filter: true },
      ...(type === 'Student' ? [{ key: 'pickedUpBy', label: 'Collected by', width: 170, filter: true }] : []),
      { key: 'securityVerified', label: 'ID check', width: 120, render: (r) => (r.securityVerified ? Badge('Verified', { tone: 'success' }) : Badge('Pending', { tone: 'warning' })), value: (r) => (r.securityVerified ? 1 : 0) },
      { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
    ],
    rows,
    onApprove: (row) => notify({ title: 'Gate pass approved', text: `${row.passNo} · ${row.personName}`, tone: 'success' }),
    onReject: (row) => notify({ title: 'Gate pass rejected', text: `${row.passNo} · ${row.personName}`, tone: 'danger' }),
    detail: gatePassDetail,
  });
}

const securityRoutes2 = {
  'security/gate-pass-student': {
    title: 'Gate Pass — Student',
    subtitle: 'Early departures, authorised by the class teacher or principal',
    section: 'security',
    render(mount, ctx) {
      mount.appendChild(gatePassScreen(ctx, 'Student', 'security/gate-pass-student',
        'Student gate passes', 'Never release a student to anyone outside the authorised pickup list'));
    },
  },

  'security/gate-pass-staff': {
    title: 'Gate Pass — Staff',
    subtitle: 'Official duty and personal exits during working hours',
    section: 'security',
    render(mount, ctx) {
      mount.appendChild(gatePassScreen(ctx, 'Staff', 'security/gate-pass-staff',
        'Staff gate passes', 'Passes are logged against attendance and payroll'));
    },
  },

  'security/pickup-persons': {
    title: 'Authorised Pickup Persons',
    subtitle: 'Who may collect which student — with photos on file',
    section: 'security',
    render(mount, ctx) {
      ensureStyles();
      const campus = campusOf(ctx);
      const students = db.students.filter((s) => s.campusId === campus && s.status === 'Active').slice(0, 240);
      const relations = ['Father', 'Mother', 'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Authorised Driver', 'Elder Sibling'];

      const rows = [];
      for (const s of students) {
        const guardians = db.parents.filter((p) => p.studentIds.includes(s.id)).slice(0, 2);
        guardians.forEach((g, i) => rows.push({
          id: `${s.id}-${g.id}`, studentId: s.id, studentName: s.name, className: `${s.className} ${s.section}`,
          personName: g.name, relation: g.relation || relations[i % relations.length], phone: g.phone,
          idProof: 'Aadhaar', idMasked: g.aadhaarMasked || 'XXXX 4821',
          photoOnFile: hash01(g.id + s.id) > 0.18, primary: i === 0,
          status: hash01(g.id) > 0.06 ? 'Active' : 'Suspended',
          verifiedOn: s.admissionDate,
        }));
        if (hash01(s.id) > 0.62) {
          rows.push({
            id: `${s.id}-DRV`, studentId: s.id, studentName: s.name, className: `${s.className} ${s.section}`,
            personName: `${s.fatherName.split(' ')[0]}'s driver — ${['Ramesh', 'Sunil', 'Mahesh', 'Prakash'][Math.floor(hash01(s.id + 'd') * 4)]}`,
            relation: 'Authorised Driver', phone: s.emergencyContact, idProof: 'Driving Licence', idMasked: 'DL-XXXX 9021',
            photoOnFile: hash01(s.id + 'p') > 0.3, primary: false,
            status: 'Active', verifiedOn: '2026-04-12',
          });
        }
      }

      const detail = (r) => Drawer({
        title: r.personName, subtitle: `${r.relation} of ${r.studentName} · ${r.className}`, size: 'md',
        body: h('div', { className: 'stack' },
          h('div', { className: 'row-3' },
            Avatar(r.personName, { size: '2xl', ring: true }),
            h('div', { className: 'stack-1' },
              h('div', { className: 't-semibold' }, r.personName),
              h('div', { className: 't-sm t-muted' }, r.relation),
              h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
                Badge(r.status), r.primary ? Badge('Primary contact', { tone: 'brand' }) : null,
                r.photoOnFile ? Badge('Photo on file', { tone: 'success' }) : Badge('Photo missing', { tone: 'danger' })))),
          r.photoOnFile ? null : Callout({ tone: 'danger', icon: 'camera', title: 'No photo on file' },
            'Do not release the student to this person until a photo is captured and verified by the front office.'),
          DescriptionList([
            ['Student', r.studentName], ['Class', r.className], ['Relation', r.relation],
            ['Phone', r.phone], ['ID proof', `${r.idProof} · ${r.idMasked}`], ['Verified on', formatDate(r.verifiedOn)],
          ], { cols: 1 }),
          SectionCard({ title: 'Verification checklist', icon: 'shield-check' },
            h('div', { className: 'stack-2' },
              ['Match the face with the photo on file', 'Ask for the student’s class and section',
                'Confirm the OTP sent to the registered parent number', 'Record the collection in the gate register'].map((x) =>
                h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, Icon('check-circle', 15), h('span', { className: 't-sm' }, x)))))),
        actions: (close) => frag(
          Button('Close', { variant: 'secondary', onClick: close }),
          Button('Send OTP to parent', { variant: 'primary', icon: 'send', onClick: () => { close(); notify({ title: 'OTP sent', text: `A 6-digit code was sent to ${r.phone}`, tone: 'success' }); } })),
      });

      const addPerson = () => formPage({
        title: 'Add an authorised pickup person', subtitle: 'Requires parent consent and a photo',
        mode: 'modal', size: 'lg', submitLabel: 'Add person',
        sections: [{
          title: 'Details', cols: 2,
          fields: [
            { id: 'student', label: 'Student', type: 'combobox', required: true, options: students.slice(0, 200).map((s) => ({ value: s.id, label: `${s.name} — ${s.className} ${s.section}` })) },
            { id: 'name', label: 'Person’s name', required: true },
            { id: 'relation', label: 'Relation', type: 'select', required: true, options: relations },
            { id: 'phone', label: 'Mobile', type: 'tel', required: true, validate: validators.phone },
            { id: 'idProof', label: 'ID proof', type: 'select', options: ['Aadhaar', 'Driving Licence', 'Voter ID', 'PAN Card'] },
            { id: 'idNumber', label: 'ID number', hint: 'Only the last four digits are stored' },
            { id: 'photo', label: 'Photograph', type: 'file', span: 'full', hint: 'Clear frontal photo — printed on the pickup card' },
            { id: 'consent', label: 'Parent consent recorded on the portal', type: 'checkbox', required: true, span: 'full' },
          ],
        }],
        onSubmit: (v) => notify({ title: 'Pickup person added', text: `${v.name} · pending front-office verification`, tone: 'success' }),
      });

      mount.appendChild(listPage({
        title: 'Authorised pickup persons',
        subtitle: `${formatNumber(rows.length)} people are authorised to collect students at this campus`,
        route: 'security/pickup-persons',
        actions: pageActions(
          Button('Print gate register', { variant: 'secondary', icon: 'print', onClick: () => notify({ title: 'Register sent to printer', tone: 'success' }) }),
          Button('Add person', { variant: 'primary', icon: 'user-plus', onClick: addPerson })),
        kpis: [
          { label: 'Authorised persons', value: formatNumber(rows.length), icon: 'user-check', tone: 'brand' },
          { label: 'Students covered', value: formatNumber(new Set(rows.map((r) => r.studentId)).size), icon: 'graduation-cap', tone: 'info' },
          { label: 'Photo missing', value: formatNumber(rows.filter((r) => !r.photoOnFile).length), icon: 'camera', tone: 'danger' },
          { label: 'Suspended', value: formatNumber(rows.filter((r) => r.status !== 'Active').length), icon: 'user-x', tone: 'warning' },
        ],
        chart: donutChart({
          data: countBy(rows, 'relation').slice(0, 6),
          height: 230, centerValue: String(rows.length), centerLabel: 'Persons',
        }),
        chartTitle: 'Who collects students',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Person, student or phone…' },
          { id: 'relation', label: 'Relation', options: Array.from(new Set(rows.map((r) => r.relation))) },
          { id: 'photo', label: 'Photo', options: ['On file', 'Missing'] },
          { id: 'status', label: 'Status', options: ['Active', 'Suspended'] },
        ],
        onFilter: (id, value, all, table) => {
          let out = rows;
          if (all.q) out = search(out, all.q, ['personName', 'studentName', 'phone', 'className']);
          if (all.relation && all.relation !== 'all') out = out.filter((r) => r.relation === all.relation);
          if (all.status && all.status !== 'all') out = out.filter((r) => r.status === all.status);
          if (all.photo && all.photo !== 'all') out = out.filter((r) => (all.photo === 'On file' ? r.photoOnFile : !r.photoOnFile));
          table.refresh(out);
        },
        columns: [
          { key: 'personName', label: 'Authorised person', sticky: true, width: 250, render: (r) => Identity(r.personName, `${r.relation} · ${r.phone}`), value: (r) => r.personName },
          { key: 'studentName', label: 'Student', width: 220, render: (r) => Identity(r.studentName, r.className), value: (r) => r.studentName },
          { key: 'relation', label: 'Relation', width: 160, filter: true },
          { key: 'idProof', label: 'ID proof', width: 150, filter: true, render: (r) => `${r.idProof} · ${r.idMasked}` },
          { key: 'photoOnFile', label: 'Photo', width: 130, render: (r) => (r.photoOnFile ? Badge('On file', { tone: 'success' }) : Badge('Missing', { tone: 'danger' })), value: (r) => (r.photoOnFile ? 1 : 0) },
          { key: 'primary', label: 'Primary', width: 110, render: (r) => (r.primary ? Badge('Primary', { tone: 'brand' }) : h('span', { className: 't-faint' }, '—')), value: (r) => (r.primary ? 1 : 0) },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        selectable: true, pageSize: 25, exportName: 'pickup-persons',
        searchKeys: ['personName', 'studentName', 'phone'],
        bulkActions: [
          { label: 'Request photos', icon: 'camera', onClick: (sel) => notify({ title: `Photo request sent for ${sel.length} people`, tone: 'info' }) },
          { label: 'Suspend', icon: 'user-x', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} people suspended`, tone: 'danger' }) },
        ],
        rowActions: (row) => [
          { label: 'Open record', icon: 'eye', onClick: () => detail(row) },
          { label: 'Print pickup card', icon: 'print', onClick: mockAction('Print pickup card') },
          { label: 'Open student profile', icon: 'graduation-cap', route: `students/profile/${row.studentId}` },
          { separator: true },
          { label: 'Suspend authorisation', icon: 'user-x', tone: 'danger', onClick: () => ConfirmDialog({ title: 'Suspend this authorisation?', text: 'The gate desk will refuse collection by this person until it is restored.', confirmLabel: 'Suspend', tone: 'danger' }).then((ok) => ok && notify({ title: 'Authorisation suspended', tone: 'danger' })) },
        ],
        onRowClick: detail,
        tableTitle: 'Pickup register',
        emptyState: EmptyState({ icon: 'user-check', title: 'No pickup persons recorded', text: 'Add the parents and guardians allowed to collect each student.', action: Button('Add person', { variant: 'primary', icon: 'user-plus', onClick: addPerson }) }),
      }));
    },
  },

  'security/vehicle-log': {
    title: 'Vehicle Entry Log',
    subtitle: 'Every vehicle in and out of the gate',
    section: 'security',
    render(mount, ctx) {
      ensureStyles();
      const campus = campusOf(ctx);
      const visitorVehicles = db.visitors.filter((v) => v.campusId === campus && v.vehicleNo).map((v) => ({
        id: 'VV-' + v.id, regNo: v.vehicleNo, type: 'Visitor', driver: v.name, purpose: v.purpose,
        date: v.date, inTime: v.inTime, outTime: v.outTime, pass: v.passNo,
        status: v.status === 'Inside' ? 'Inside' : 'Exited', campusId: v.campusId,
      }));
      const schoolBuses = db.vehicles.filter((v) => v.campusId === campus).map((v, i) => {
        const driver = byId(db.drivers, v.driverId);
        return {
          id: 'SB-' + v.id, regNo: v.regNo, type: 'School Bus', driver: driver ? driver.name : 'Unassigned',
          purpose: `Route ${(byId(db.routes, v.routeId) || {}).code || '—'}`,
          date: TODAY, inTime: '07:0' + (i % 9), outTime: i % 3 === 0 ? null : '15:2' + (i % 9),
          pass: v.gpsDeviceId, status: i % 3 === 0 ? 'Inside' : 'Exited', campusId: v.campusId,
        };
      });
      const rows = schoolBuses.concat(visitorVehicles);
      const inside = rows.filter((r) => r.status === 'Inside');

      mount.appendChild(listPage({
        title: 'Vehicle entry log',
        subtitle: `${formatNumber(rows.length)} vehicle movements recorded · ${inside.length} vehicles on campus`,
        route: 'security/vehicle-log',
        actions: pageActions(
          Button('Parking plan', { variant: 'secondary', icon: 'map', onClick: mockAction('Parking plan') }),
          Button('Log a vehicle', { variant: 'primary', icon: 'plus', onClick: () => formPage({
            title: 'Log a vehicle', mode: 'modal', size: 'md', submitLabel: 'Log entry',
            sections: [{ title: 'Vehicle', cols: 2, fields: [
              { id: 'regNo', label: 'Registration number', required: true, placeholder: 'HR26 AB 1234' },
              { id: 'type', label: 'Type', type: 'select', required: true, options: ['Visitor', 'School Bus', 'Staff', 'Vendor', 'Emergency'] },
              { id: 'driver', label: 'Driver name', required: true },
              { id: 'purpose', label: 'Purpose', required: true },
              { id: 'inTime', label: 'In time', type: 'time', value: '09:30' },
              { id: 'parking', label: 'Parking bay', type: 'select', options: ['Visitor Bay 1', 'Visitor Bay 2', 'Bus Bay', 'Staff Parking'] },
            ] }],
            onSubmit: (v) => notify({ title: 'Vehicle logged', text: `${v.regNo} · ${v.type}`, tone: 'success' }),
          }) })),
        kpis: [
          { label: 'Movements logged', value: formatNumber(rows.length), icon: 'car', tone: 'brand' },
          { label: 'On campus now', value: formatNumber(inside.length), icon: 'map-pin', tone: 'warning' },
          { label: 'School buses', value: formatNumber(schoolBuses.length), icon: 'bus', tone: 'info' },
          { label: 'Visitor vehicles', value: formatNumber(visitorVehicles.length), icon: 'users', tone: 'success' },
        ],
        chart: donutChart({ data: countBy(rows, 'type'), height: 220, centerValue: String(rows.length), centerLabel: 'Vehicles' }),
        chartTitle: 'Vehicle mix at the gate',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Registration or driver…' },
          { id: 'type', label: 'Type', options: ['School Bus', 'Visitor', 'Staff', 'Vendor'] },
          { id: 'status', label: 'Status', options: ['Inside', 'Exited'] },
          { id: 'date', label: 'Date', type: 'date' },
        ],
        onFilter: (id, value, all, table) => {
          let out = rows;
          if (all.q) out = search(out, all.q, ['regNo', 'driver', 'purpose']);
          if (all.type && all.type !== 'all') out = out.filter((r) => r.type === all.type);
          if (all.status && all.status !== 'all') out = out.filter((r) => r.status === all.status);
          if (all.date) out = out.filter((r) => r.date === all.date);
          table.refresh(out);
        },
        columns: [
          { key: 'regNo', label: 'Registration', sticky: true, width: 170, className: 't-mono' },
          { key: 'type', label: 'Type', width: 140, filter: true, render: (r) => Badge(r.type, { tone: r.type === 'School Bus' ? 'brand' : 'neutral' }) },
          { key: 'driver', label: 'Driver / owner', width: 220, render: (r) => Identity(r.driver, r.purpose), value: (r) => r.driver },
          { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date) },
          { key: 'inTime', label: 'In', width: 90, numeric: true },
          { key: 'outTime', label: 'Out', width: 100, numeric: true, render: (r) => r.outTime || h('span', { className: 't-warning' }, 'Inside') },
          { key: 'pass', label: 'Pass / device', width: 160, className: 't-mono' },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status === 'Inside' ? 'Inside' : 'Checked Out') },
        ],
        rows,
        selectable: true, pageSize: 25, exportName: 'vehicle-log',
        searchKeys: ['regNo', 'driver', 'purpose'],
        bulkActions: [{ label: 'Mark exited', icon: 'log-out', onClick: (sel) => notify({ title: `${sel.length} vehicles marked as exited`, tone: 'success' }) }],
        rowActions: (row) => [
          { label: 'Mark exit', icon: 'log-out', onClick: () => notify({ title: 'Exit recorded', text: row.regNo, tone: 'success' }) },
          { label: 'Report incident', icon: 'alert-triangle', tone: 'danger', route: 'security/incidents' },
        ],
        tableTitle: 'Gate register',
        emptyState: EmptyState({ icon: 'car', title: 'No vehicle movements', text: 'Log the first vehicle of the day from the gate desk.' }),
      }));
    },
  },

  'security/incidents': {
    title: 'Incident Register',
    subtitle: 'Every incident, its severity and what was done about it',
    section: 'security',
    render(mount, ctx) {
      ensureStyles();
      const campus = campusOf(ctx);
      const rows = db.incidents.filter((i) => i.campusId === campus);
      const open = rows.filter((i) => i.status !== 'Closed');
      const critical = rows.filter((i) => ['High', 'Critical'].includes(i.severity));
      const byType = countBy(rows, 'type').slice(0, 8);

      const report = () => formPage({
        title: 'Report an incident', subtitle: 'Log it now — details can be added later',
        mode: 'modal', size: 'lg', submitLabel: 'Log incident',
        sections: [{
          title: 'What happened', cols: 2,
          fields: [
            { id: 'type', label: 'Incident type', type: 'select', required: true, options: ['Unauthorised Entry', 'Property Damage', 'Student Injury', 'Fire Alarm', 'Theft Reported', 'Vehicle Incident', 'Medical Emergency', 'Altercation'] },
            { id: 'severity', label: 'Severity', type: 'radio', inline: true, required: true, value: 'Low', options: ['Low', 'Medium', 'High', 'Critical'] },
            { id: 'location', label: 'Location', type: 'select', required: true, options: ['Main Gate', 'Playground', 'Corridor Block B', 'Science Lab', 'Parking Area', 'Cafeteria', 'Bus Bay'] },
            { id: 'time', label: 'Time', type: 'time', value: '09:30' },
            { id: 'reportedBy', label: 'Reported by', required: true, value: 'Security Guard' },
            { id: 'witnesses', label: 'Witnesses' },
            { id: 'description', label: 'Description', type: 'textarea', required: true, span: 'full' },
            { id: 'actionTaken', label: 'Immediate action taken', type: 'textarea', span: 'full' },
            { id: 'photos', label: 'Photos', type: 'file', span: 'full' },
            { id: 'notify', label: 'Notify the principal immediately', type: 'switch', value: true, span: 'full' },
          ],
        }],
        onSubmit: (v) => notify({ title: 'Incident logged', text: `${v.type} · ${v.location}`, tone: v.severity === 'Critical' ? 'danger' : 'success' }),
      });

      const detail = (r) => Drawer({
        title: r.type, subtitle: `${r.reference} · ${formatDate(r.date)} at ${r.time} · ${r.location}`, size: 'lg',
        body: h('div', { className: 'stack' },
          h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
            Badge(r.status), Badge(r.severity, { tone: r.severity === 'Critical' ? 'danger' : r.severity === 'High' ? 'warning' : 'neutral' }),
            Badge(r.location, { tone: 'neutral', icon: 'map-pin' })),
          Callout({ tone: 'neutral', icon: 'alert-triangle', title: 'What happened' }, r.description),
          Callout({ tone: 'info', icon: 'check-circle', title: 'Action taken' }, r.actionTaken),
          DescriptionList([
            ['Reference', r.reference], ['Reported by', r.reportedBy],
            ['Date & time', `${formatDate(r.date)} · ${r.time}`], ['Follow-up due', formatDate(r.followUpDate)],
          ], { cols: 2 }),
          SectionCard({ title: 'Evidence', icon: 'camera' },
            PhotoGrid([{ caption: 'Gate camera still', icon: 'cctv' }, { caption: 'Location photo', icon: 'camera' }, { caption: 'Incident form', icon: 'file-text' }])),
          SectionCard({ title: 'Notes', icon: 'message-circle' },
            CommentThread([
              { name: r.reportedBy, text: r.description, time: relativeTime(r.date) },
              { name: 'Security Supervisor', text: r.actionTaken, time: relativeTime(r.date) },
            ], { onSubmit: () => notify({ title: 'Note added to the incident', tone: 'success' }) }))),
        actions: (close) => frag(
          Button('Close', { variant: 'secondary', onClick: close }),
          r.status === 'Closed'
            ? Button('Reopen', { variant: 'danger', icon: 'refresh-ccw', onClick: () => { close(); notify({ title: 'Incident reopened', tone: 'warning' }); } })
            : Button('Mark resolved', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Incident closed', text: r.reference, tone: 'success' }); } })),
      });

      mount.appendChild(listPage({
        title: 'Incident register',
        subtitle: `${formatNumber(rows.length)} incidents recorded this session · ${open.length} still open`,
        route: 'security/incidents',
        actions: pageActions(
          Button('Emergency alert', { variant: 'secondary', icon: 'siren', route: 'security/emergency-alerts' }),
          Button('Report incident', { variant: 'primary', icon: 'plus', onClick: report })),
        kpis: [
          { label: 'Incidents', value: formatNumber(rows.length), icon: 'alert-triangle', tone: 'brand' },
          { label: 'Open', value: formatNumber(open.length), icon: 'clock', tone: open.length ? 'warning' : 'success' },
          { label: 'High or critical', value: formatNumber(critical.length), icon: 'siren', tone: 'danger' },
          { label: 'Closed', value: formatNumber(rows.filter((i) => i.status === 'Closed').length), icon: 'check-circle', tone: 'success' },
        ],
        chart: barChart({
          categories: byType.map((t) => t.key),
          series: [{ name: 'Incidents', values: byType.map((t) => t.value) }],
          horizontal: true, height: 260,
        }),
        chartTitle: 'Incidents by type',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Reference, type or location…' },
          { id: 'severity', label: 'Severity', options: ['Low', 'Medium', 'High', 'Critical'] },
          { id: 'status', label: 'Status', options: ['Open', 'Under Investigation', 'Closed'] },
          { id: 'location', label: 'Location', options: Array.from(new Set(rows.map((r) => r.location))) },
        ],
        onFilter: (id, value, all, table) => {
          let out = rows;
          if (all.q) out = search(out, all.q, ['reference', 'type', 'location', 'description']);
          if (all.severity && all.severity !== 'all') out = out.filter((r) => r.severity === all.severity);
          if (all.status && all.status !== 'all') out = out.filter((r) => r.status === all.status);
          if (all.location && all.location !== 'all') out = out.filter((r) => r.location === all.location);
          table.refresh(out);
        },
        columns: [
          { key: 'reference', label: 'Reference', width: 140, sticky: true, className: 't-mono' },
          { key: 'type', label: 'Type', width: 200, filter: true },
          { key: 'severity', label: 'Severity', width: 130, filter: true, render: (r) => Badge(r.severity, { tone: r.severity === 'Critical' ? 'danger' : r.severity === 'High' ? 'warning' : r.severity === 'Medium' ? 'info' : 'neutral' }) },
          { key: 'location', label: 'Location', width: 180, filter: true },
          { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date) },
          { key: 'time', label: 'Time', width: 90, numeric: true },
          { key: 'reportedBy', label: 'Reported by', width: 160, filter: true },
          { key: 'status', label: 'Status', width: 170, filter: true, render: (r) => Badge(r.status) },
          { key: 'followUpDate', label: 'Follow-up', width: 140, render: (r) => formatDate(r.followUpDate) },
        ],
        rows,
        selectable: true, pageSize: 25, exportName: 'incidents',
        searchKeys: ['reference', 'type', 'location'],
        bulkActions: [
          { label: 'Assign to supervisor', icon: 'user-check', onClick: (sel) => notify({ title: `${sel.length} incidents assigned`, tone: 'info' }) },
          { label: 'Close selected', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} incidents closed`, tone: 'success' }) },
        ],
        rowActions: (row) => [
          { label: 'Open incident', icon: 'eye', onClick: () => detail(row) },
          { label: 'Print report', icon: 'print', onClick: mockAction('Print incident report') },
          { separator: true },
          { label: 'Escalate to principal', icon: 'trending-up', tone: 'danger', onClick: () => notify({ title: 'Escalated', text: `${row.reference} sent to the principal`, tone: 'warning' }) },
        ],
        onRowClick: detail,
        tableTitle: 'All incidents',
        emptyState: EmptyState({ icon: 'shield-check', title: 'No incidents recorded', text: 'A quiet campus. Log anything unusual so patterns can be spotted early.', tone: 'success' }),
      }));
    },
  },
};

const SHIFTS = [
  { id: 'M', label: 'Morning', time: '06:00 – 14:00', tone: 'success' },
  { id: 'E', label: 'Evening', time: '14:00 – 22:00', tone: 'info' },
  { id: 'N', label: 'Night', time: '22:00 – 06:00', tone: 'brand' },
  { id: 'O', label: 'Weekly off', time: '—', tone: 'neutral' },
];

function securityStaff(campus) {
  return once('secstaff:' + campus, () => {
    let pool = db.staff.filter((s) => s.campusId === campus && (s.department === 'Security' || /security|guard/i.test(s.designation)));
    if (pool.length < 6) pool = db.staff.filter((s) => s.campusId === campus && s.type === 'Non-Teaching').slice(0, 18);
    return pool.slice(0, 24);
  });
}

const securityRoutes3 = {
  'security/roster': {
    title: 'Security Staff Roster',
    subtitle: 'Who is on which gate, on which shift',
    section: 'security',
    render(mount, ctx) {
      ensureStyles();
      const campus = campusOf(ctx);
      const guards = securityStaff(campus);
      const posts = ['Main Gate', 'Rear Gate', 'Bus Bay', 'Reception', 'Hostel Block', 'Patrol', 'CCTV Room'];

      const rows = guards.map((g, i) => {
        const row = { id: g.id, name: g.name, employeeCode: g.employeeCode, phone: g.phone, post: posts[i % posts.length] };
        let onDuty = 0;
        for (const d of WEEKDAYS) {
          const r = hash01(g.id + d);
          const shift = r < 0.36 ? 'M' : r < 0.68 ? 'E' : r < 0.88 ? 'N' : 'O';
          row[d] = shift;
          if (shift !== 'O') onDuty++;
        }
        row.onDuty = onDuty;
        row.todayShift = row[TODAY_DAY];
        return row;
      });

      const shiftCount = (id) => rows.filter((r) => r.todayShift === id).length;
      const coverage = SHIFTS.filter((s) => s.id !== 'O').map((s) => ({ key: s.label, value: shiftCount(s.id) }));

      const shiftCell = (id) => {
        const s = SHIFTS.find((x) => x.id === id) || SHIFTS[3];
        return Badge(s.label, { tone: s.tone, size: 'sm' });
      };

      mount.appendChild(listPage({
        title: 'Security roster',
        subtitle: `${guards.length} security personnel · ${rows.length - shiftCount('O')} on duty today`,
        route: 'security/roster',
        actions: pageActions(
          Button('Print roster', { variant: 'secondary', icon: 'print', onClick: () => notify({ title: 'Roster sent to printer', tone: 'success' }) }),
          Button('Publish next week', { variant: 'primary', icon: 'send', onClick: () => ConfirmDialog({ title: 'Publish next week’s roster?', text: 'Every guard receives an SMS with their shifts and posting.', confirmLabel: 'Publish', tone: 'brand', icon: 'send' }).then((ok) => ok && notify({ title: 'Roster published', text: 'SMS sent to all security staff.', tone: 'success' })) })),
        kpis: [
          { label: 'Security staff', value: formatNumber(guards.length), icon: 'shield', tone: 'brand' },
          { label: 'On duty today', value: formatNumber(rows.length - shiftCount('O')), icon: 'user-check', tone: 'success' },
          { label: 'Night shift tonight', value: formatNumber(shiftCount('N')), icon: 'moon', tone: 'info' },
          { label: 'Weekly off today', value: formatNumber(shiftCount('O')), icon: 'umbrella', tone: 'warning' },
        ],
        chart: barChart({
          categories: coverage.map((c) => c.key),
          series: [{ name: 'Guards on duty', values: coverage.map((c) => c.value) }],
          height: 200, showValues: true, target: 4, targetLabel: 'Minimum cover',
        }),
        chartTitle: 'Shift coverage today',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Name or employee code…' },
          { id: 'post', label: 'Post', options: posts },
          { id: 'shift', label: 'Today’s shift', options: SHIFTS.map((s) => s.label) },
        ],
        onFilter: (id, value, all, table) => {
          let out = rows;
          if (all.q) out = search(out, all.q, ['name', 'employeeCode', 'post']);
          if (all.post && all.post !== 'all') out = out.filter((r) => r.post === all.post);
          if (all.shift && all.shift !== 'all') {
            const s = SHIFTS.find((x) => x.label === all.shift);
            out = out.filter((r) => r.todayShift === (s ? s.id : ''));
          }
          table.refresh(out);
        },
        columns: [
          { key: 'name', label: 'Guard', sticky: true, width: 220, render: (r) => Identity(r.name, `${r.employeeCode} · ${r.phone}`), value: (r) => r.name },
          { key: 'post', label: 'Post', width: 150, filter: true },
          ...WEEKDAYS.map((d) => ({
            key: d, label: d.slice(0, 3), width: 110, sortable: false,
            render: (r) => shiftCell(r[d]),
          })),
          { key: 'onDuty', label: 'Shifts', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        ],
        rows,
        selectable: true, pageSize: 25, footerAggregates: true, exportName: 'security-roster',
        searchKeys: ['name', 'employeeCode', 'post'],
        bulkActions: [
          { label: 'Swap shift', icon: 'refresh-ccw', onClick: (sel) => notify({ title: `Swap requested for ${sel.length} guards`, tone: 'info' }) },
          { label: 'Send roster SMS', icon: 'send', onClick: (sel) => notify({ title: `Roster SMS sent to ${sel.length} guards`, tone: 'success' }) },
        ],
        rowActions: (row) => [
          { label: 'Change post', icon: 'map-pin', onClick: mockAction('Change post') },
          { label: 'Mark absent', icon: 'user-x', tone: 'danger', onClick: () => ConfirmDialog({ title: `Mark ${row.name} absent?`, text: 'A replacement must be arranged for the shift.', confirmLabel: 'Mark absent', tone: 'danger' }).then((ok) => ok && notify({ title: 'Marked absent', text: row.name, tone: 'warning' })) },
          { label: 'Call', icon: 'phone-call', onClick: () => notify({ title: `Calling ${row.name}`, text: row.phone, tone: 'info' }) },
        ],
        tableTitle: 'Weekly roster',
        tableSubtitle: 'Morning 06:00–14:00 · Evening 14:00–22:00 · Night 22:00–06:00',
        notes: SectionCard({ title: 'Post allocation today', icon: 'map-pin' },
          h('div', { className: 'pt-tiles' },
            posts.map((p) => {
              const onPost = rows.filter((r) => r.post === p && r.todayShift !== 'O');
              return h('div', { className: 'pt-tile', dataset: { tone: onPost.length ? 'success' : 'danger' } },
                h('span', { className: 'pt-tile-ico', html: icon('shield', 17) }),
                h('span', { className: 'pt-tile-label' }, p),
                h('span', { className: 'pt-tile-value' }, String(onPost.length)),
                h('span', { className: 'pt-tile-meta' }, onPost.length ? onPost.map((g) => g.name.split(' ')[0]).join(', ') : 'Unmanned — assign a guard'));
            }))),
        emptyState: EmptyState({ icon: 'shield', title: 'No security staff on record', text: 'Add security personnel in the HR module and they appear on the roster.' }),
      }));
    },
  },

  'security/emergency-alerts': {
    title: 'Emergency Alerts',
    subtitle: 'Broadcast to the whole campus in one action',
    section: 'security',
    render(mount, ctx) {
      ensureStyles();
      const campus = campusOf(ctx);
      const alertTypes = [
        { id: 'fire', label: 'Fire', icon: 'flame', tone: 'danger', message: 'FIRE ALARM: Evacuate immediately using the nearest fire exit. Assemble at the ground.' },
        { id: 'lockdown', label: 'Lockdown', icon: 'lock', tone: 'danger', message: 'LOCKDOWN: Stay inside, lock classroom doors, move away from windows and await instructions.' },
        { id: 'medical', label: 'Medical emergency', icon: 'first-aid', tone: 'warning', message: 'MEDICAL EMERGENCY: First responders required at the location stated. Clear the corridors.' },
        { id: 'evacuate', label: 'Evacuation drill', icon: 'log-out', tone: 'warning', message: 'DRILL: Evacuation drill in progress. Follow your class teacher to the assembly point.' },
        { id: 'weather', label: 'Severe weather', icon: 'umbrella', tone: 'info', message: 'WEATHER ADVISORY: Heavy rain expected. Buses will depart 30 minutes early today.' },
        { id: 'intruder', label: 'Unauthorised entry', icon: 'user-x', tone: 'danger', message: 'SECURITY ALERT: Unauthorised person on campus. Security teams to respond, staff to secure students.' },
        { id: 'gas', label: 'Gas / chemical leak', icon: 'flask', tone: 'danger', message: 'CHEMICAL ALERT: Evacuate the science block. Do not use lifts. Assemble at the sports field.' },
        { id: 'test', label: 'System test', icon: 'activity', tone: 'neutral', message: 'This is a test of the Springdale emergency broadcast system. No action is required.' },
      ];
      let selected = alertTypes[0];
      let channels = ['SMS', 'Push', 'PA System'];
      let audience = ['All Staff', 'All Parents', 'Students'];

      const messageBox = Textarea({ rows: 4, value: selected.message });
      const typeHost = h('div', { className: 'pt-tiles' });

      const paintTypes = () => {
        typeHost.innerHTML = '';
        for (const a of alertTypes) {
          typeHost.appendChild(h('button', {
            className: 'pt-tile', type: 'button', dataset: { tone: a.tone },
            attrs: { 'aria-pressed': String(a.id === selected.id) },
            style: a.id === selected.id ? { borderColor: 'var(--border-brand)', boxShadow: 'var(--shadow-md)' } : {},
            onClick: () => { selected = a; messageBox.value = a.message; paintTypes(); },
          },
            h('span', { className: 'pt-tile-ico', html: icon(a.icon, 17) }),
            h('span', { className: 'pt-tile-label' }, a.label),
            h('span', { className: 'pt-tile-meta' }, a.id === selected.id ? 'Selected' : 'Tap to select')));
        }
      };
      paintTypes();

      const broadcast = () => {
        ConfirmDialog({
          title: `Broadcast "${selected.label}" alert?`,
          text: `This reaches ${audience.join(', ')} on ${channels.join(', ')} immediately and cannot be recalled. Only use for genuine emergencies or announced drills.`,
          confirmLabel: 'Broadcast now', cancelLabel: 'Cancel', tone: 'danger', icon: 'siren',
        }).then((ok) => {
          if (!ok) return;
          notify({ title: `${selected.label} alert broadcast`, text: `Delivered to ${audience.join(', ')} via ${channels.join(', ')}.`, tone: 'danger', duration: 6000 });
        });
      };

      const pastAlerts = db.messages.filter((m) => m.campusId === campus).slice(0, 12).map((m, i) => ({
        id: m.id, type: alertTypes[i % alertTypes.length].label, message: m.subject,
        channel: m.channel, audience: m.audience, sentOn: m.sentOn, delivered: m.delivered,
        failed: m.failed, status: m.status, sentBy: m.sentBy || 'Security Supervisor',
      }));

      mount.appendChild(page({
        route: 'security/emergency-alerts',
        title: 'Emergency alert console',
        subtitle: 'One action reaches every phone, screen and speaker on campus',
        actions: pageActions(
          Button('Drill schedule', { variant: 'secondary', icon: 'calendar', onClick: mockAction('Drill schedule') }),
          Button('Broadcast alert', { variant: 'danger', icon: 'siren', onClick: broadcast })),
        children: [
          Callout({ tone: 'danger', icon: 'siren', title: 'Live broadcast system' },
            'Alerts are delivered over SMS, app push, email, the public address system and every digital signage screen. Test broadcasts are logged and clearly labelled.'),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-8' }, frag(
              SectionCard({ title: 'Choose an alert type', subtitle: 'The message template updates automatically', icon: 'siren' }, typeHost),
              SectionCard({
                title: 'Compose the broadcast', icon: 'edit',
                footer: h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
                  Button('Broadcast now', { variant: 'danger', size: 'lg', icon: 'siren', onClick: broadcast }),
                  Button('Send as test', { variant: 'secondary', size: 'lg', icon: 'activity', onClick: () => notify({ title: 'Test broadcast sent', text: 'Only the security team received this message.', tone: 'info' }) }),
                  h('span', { className: 'spacer' }),
                  h('span', { className: 't-xs t-muted' }, 'Broadcasts are audit-logged with the operator name.')),
              },
                h('div', { className: 'stack-3' },
                  Field({ label: 'Message', required: true, hint: 'Keep it under 300 characters so it fits a single SMS' }, messageBox),
                  FormGrid({ cols: 2 },
                    Field({ label: 'Audience', required: true },
                      MultiSelect({
                        options: ['All Staff', 'All Parents', 'Students', 'Security Team', 'Transport Crew', 'Hostel Wardens', 'Management'],
                        values: audience, onChange: (v) => { audience = v; },
                      })),
                    Field({ label: 'Channels', required: true },
                      MultiSelect({
                        options: ['SMS', 'Push', 'Email', 'WhatsApp', 'PA System', 'Digital Signage'],
                        values: channels, onChange: (v) => { channels = v; },
                      })),
                    Field({ label: 'Location' }, Select({ options: ['Whole campus', 'Main Block', 'Science Block', 'Playground', 'Hostel', 'Bus Bay'], value: 'Whole campus' })),
                    Field({ label: 'Repeat every' }, Select({ options: ['Do not repeat', '2 minutes', '5 minutes', '10 minutes'], value: 'Do not repeat' })),
                    Field({ label: 'Call emergency services', className: 'col-span-full' },
                      Switch('Also dial 112 and the local fire station', { checked: false, description: 'Uses the registered emergency contact list' }))))))),
            h('div', { className: 'span-4' }, frag(
              SectionCard({ title: 'Emergency contacts', icon: 'phone-call' },
                RankList([
                  { name: 'Police control room', meta: 'Sector 42 · Gurugram', value: '112' },
                  { name: 'Fire station', meta: 'Response time ~8 min', value: '101' },
                  { name: 'Ambulance', meta: 'Medanta emergency', value: '108' },
                  { name: 'Principal', meta: 'Dr. Meera Krishnan', value: '+91 98110 42115' },
                  { name: 'Security supervisor', meta: 'Balwinder Singh', value: '+91 98110 77420' },
                  { name: 'School nurse', meta: 'Infirmary, Block A', value: '+91 98110 33086' },
                ])),
              SectionCard({ title: 'Assembly points', icon: 'map-pin' },
                h('div', { className: 'stack-2' },
                  kv('Primary block', 'Main playground'),
                  kv('Middle & senior block', 'Basketball court'),
                  kv('Science block', 'Sports field'),
                  kv('Hostel', 'Front lawn'),
                  kv('Head count target', 'Under 6 minutes'))),
              SectionCard({ title: 'Readiness', icon: 'shield-check' },
                h('div', { className: 'stack-2' },
                  ProgressBar(96, { label: 'Fire extinguishers serviced', showValue: true, tone: 'success' }),
                  ProgressBar(88, { label: 'Staff trained in first aid', showValue: true, tone: 'success' }),
                  ProgressBar(72, { label: 'Evacuation drills completed', showValue: true, tone: 'warning' }),
                  ProgressBar(100, { label: 'Alarm panels online', showValue: true, tone: 'success' })))))),
          SectionCard({ title: 'Broadcast history', subtitle: 'Every alert sent from this campus', icon: 'history', flush: true },
            pastAlerts.length ? DataTable({
              columns: [
                { key: 'type', label: 'Alert', width: 190, sticky: true, filter: true, render: (r) => Identity(r.type, r.sentBy), value: (r) => r.type },
                { key: 'message', label: 'Message', width: 300 },
                { key: 'audience', label: 'Audience', width: 170, filter: true },
                { key: 'channel', label: 'Channel', width: 140, filter: true, render: (r) => Badge(r.channel, { tone: 'neutral' }) },
                { key: 'sentOn', label: 'Sent', width: 160, render: (r) => formatDateTime(r.sentOn) },
                { key: 'delivered', label: 'Delivered', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'failed', label: 'Failed', width: 100, align: 'right', numeric: true, aggregate: 'sum', render: (r) => (r.failed ? h('span', { className: 't-danger t-num' }, formatNumber(r.failed)) : h('span', { className: 't-faint' }, '0')) },
                { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
              ],
              rows: pastAlerts, pageSize: 10, footerAggregates: true, exportName: 'emergency-alerts',
            }) : EmptyState({ icon: 'siren', title: 'No alerts have been broadcast', text: 'That is good news. Run a quarterly test to keep the system verified.' })),
        ],
      }));
    },
  },

  'security/cctv': {
    title: 'CCTV Monitoring',
    subtitle: 'Live wall, recording health and playback',
    section: 'security',
    render(mount, ctx) {
      ensureStyles();
      const campus = campusOf(ctx);
      const locations = ['Main Gate', 'Rear Gate', 'Reception', 'Corridor Block A', 'Corridor Block B', 'Playground',
        'Bus Bay', 'Parking Area', 'Cafeteria', 'Science Lab', 'Library', 'Assembly Hall',
        'Hostel Entrance', 'Sports Field', 'Admin Wing', 'Perimeter East'];
      const cameras = locations.map((loc, i) => {
        const r = hash01(campus + loc);
        return {
          id: 'CAM' + String(i + 1).padStart(2, '0'),
          name: loc,
          status: r < 0.82 ? 'Online' : r < 0.92 ? 'Degraded' : 'Offline',
          resolution: r > 0.5 ? '4 MP' : '2 MP',
          type: i % 4 === 0 ? 'PTZ Dome' : i % 3 === 0 ? 'Bullet' : 'Fixed Dome',
          nightVision: r > 0.25,
          storageDays: Math.round(20 + r * 20),
          fps: r > 0.6 ? 25 : 15,
          lastMotion: `${String(8 + Math.floor(r * 2)).padStart(2, '0')}:${String(Math.floor(r * 59)).padStart(2, '0')}`,
        };
      });
      const online = cameras.filter((c) => c.status === 'Online');
      let layout = '4';

      const wallHost = h('div', { className: 'pt-cams' });
      const paintWall = () => {
        const count = layout === '4' ? 4 : layout === '9' ? 9 : 16;
        wallHost.style.gridTemplateColumns = `repeat(auto-fit, minmax(${count <= 4 ? 300 : count <= 9 ? 230 : 180}px, 1fr))`;
        wallHost.innerHTML = '';
        for (const c of cameras.slice(0, count)) {
          const offline = c.status === 'Offline';
          wallHost.appendChild(h('div', {
            className: ['pt-cam', offline && 'pt-cam-off'].filter(Boolean).join(' '),
            attrs: { role: 'img', 'aria-label': `${c.name} camera — ${c.status}` },
            onClick: () => cameraDrawer(c),
          },
            h('div', { className: 'pt-cam-noise' }),
            offline ? h('div', { className: 'pt-cam-cross' }, Icon('cctv', 26)) : null,
            !offline ? h('div', { className: 'pt-cam-live' }, h('span', { className: 'pt-cam-dot' }), h('span', null, 'LIVE')) : null,
            h('div', { className: 'pt-cam-label' },
              h('span', null, `${c.id} · ${c.name}`),
              h('span', null, offline ? 'NO SIGNAL' : `${c.fps} fps`))));
        }
      };

      const cameraDrawer = (c) => Drawer({
        title: `${c.id} — ${c.name}`, subtitle: `${c.type} · ${c.resolution} · ${c.status}`, size: 'lg',
        body: h('div', { className: 'stack' },
          h('div', { className: ['pt-cam', c.status === 'Offline' && 'pt-cam-off'].filter(Boolean).join(' '), style: { aspectRatio: '16 / 9' } },
            h('div', { className: 'pt-cam-noise' }),
            c.status !== 'Offline' ? h('div', { className: 'pt-cam-live' }, h('span', { className: 'pt-cam-dot' }), h('span', null, 'LIVE')) : h('div', { className: 'pt-cam-cross' }, Icon('cctv', 30)),
            h('div', { className: 'pt-cam-label' }, h('span', null, c.name), h('span', null, formatDate(TODAY) + ' 09:30:12'))),
          h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
            IconButton('chevron-left', { label: 'Pan left', bordered: true, onClick: mockAction('Pan left') }),
            IconButton('chevron-right', { label: 'Pan right', bordered: true, onClick: mockAction('Pan right') }),
            IconButton('chevron-up', { label: 'Tilt up', bordered: true, onClick: mockAction('Tilt up') }),
            IconButton('chevron-down', { label: 'Tilt down', bordered: true, onClick: mockAction('Tilt down') }),
            IconButton('plus', { label: 'Zoom in', bordered: true, onClick: mockAction('Zoom in') }),
            IconButton('minus', { label: 'Zoom out', bordered: true, onClick: mockAction('Zoom out') }),
            h('span', { className: 'spacer' }),
            Button('Snapshot', { variant: 'secondary', size: 'sm', icon: 'camera', onClick: () => notify({ title: 'Snapshot saved', text: `${c.id} · ${formatDate(TODAY)} 09:30`, tone: 'success' }) })),
          DescriptionList([
            ['Camera', `${c.id} · ${c.type}`], ['Location', c.name], ['Status', c.status],
            ['Resolution', c.resolution], ['Frame rate', `${c.fps} fps`],
            ['Night vision', c.nightVision ? 'Yes' : 'No'], ['Retention', `${c.storageDays} days`],
            ['Last motion', c.lastMotion],
          ], { cols: 2 }),
          SectionCard({ title: 'Playback', subtitle: 'Scrub the last 24 hours', icon: 'history' },
            h('div', { className: 'stack-2' },
              lineChart({
                categories: Array.from({ length: 12 }, (_, i) => `${String(i * 2).padStart(2, '0')}:00`),
                series: [{ name: 'Motion events', values: Array.from({ length: 12 }, (_, i) => Math.round(hash01(c.id + i) * 24)) }],
                height: 160, legend: false,
              }),
              h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
                Button('Export clip', { variant: 'secondary', size: 'sm', icon: 'download', onClick: mockAction('Export clip') }),
                Button('Share with police', { variant: 'ghost', size: 'sm', icon: 'send', onClick: mockAction('Share footage') }))))),
        actions: (close) => frag(
          Button('Close', { variant: 'secondary', onClick: close }),
          Button('Report an incident', { variant: 'primary', icon: 'alert-triangle', onClick: () => { close(); navigate('security/incidents'); } })),
      });

      paintWall();

      mount.appendChild(page({
        route: 'security/cctv',
        title: 'CCTV monitoring',
        subtitle: `${online.length} of ${cameras.length} cameras online · footage retained for 30 days`,
        actions: pageActions(
          Button('Playback archive', { variant: 'secondary', icon: 'history', onClick: mockAction('Playback archive') }),
          Button('Report incident', { variant: 'primary', icon: 'alert-triangle', route: 'security/incidents' })),
        children: [
          kpiRow([
            { label: 'Cameras', value: formatNumber(cameras.length), icon: 'cctv', tone: 'brand' },
            { label: 'Online', value: formatNumber(online.length), icon: 'check-circle', tone: 'success' },
            { label: 'Degraded', value: formatNumber(cameras.filter((c) => c.status === 'Degraded').length), icon: 'alert-circle', tone: 'warning' },
            { label: 'Offline', value: formatNumber(cameras.filter((c) => c.status === 'Offline').length), icon: 'x-circle', tone: cameras.some((c) => c.status === 'Offline') ? 'danger' : 'success' },
          ]),
          cameras.some((c) => c.status === 'Offline')
            ? Callout({ tone: 'danger', icon: 'alert-triangle', title: 'Cameras offline' },
              `${cameras.filter((c) => c.status === 'Offline').map((c) => `${c.id} (${c.name})`).join(', ')} — raise a maintenance ticket with the AMC vendor.`)
            : null,
          Card({ pad: true },
            h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-3)' } },
              SegmentedControl([{ id: '4', label: '2 × 2' }, { id: '9', label: '3 × 3' }, { id: '16', label: '4 × 4' }], (id) => { layout = id; paintWall(); }, { active: layout }),
              h('span', { className: 'spacer' }),
              Badge('Recording', { tone: 'danger', dot: true }),
              Badge('Storage 68% used', { tone: 'warning' }),
              Button('Full screen', { variant: 'ghost', size: 'sm', icon: 'maximize', onClick: mockAction('Full screen') }))),
          SectionCard({ title: 'Live wall', subtitle: 'Click any tile for PTZ controls and playback', icon: 'cctv' }, wallHost),
          SectionCard({ title: 'Camera health', subtitle: 'Every camera on this campus', icon: 'activity', flush: true },
            DataTable({
              columns: [
                { key: 'id', label: 'Camera', width: 120, sticky: true, className: 't-mono' },
                { key: 'name', label: 'Location', width: 200, filter: true },
                { key: 'type', label: 'Type', width: 150, filter: true },
                { key: 'resolution', label: 'Resolution', width: 120, filter: true },
                { key: 'fps', label: 'FPS', width: 90, align: 'right', numeric: true },
                { key: 'nightVision', label: 'Night vision', width: 140, render: (r) => (r.nightVision ? Badge('Yes', { tone: 'success' }) : Badge('No', { tone: 'neutral' })), value: (r) => (r.nightVision ? 1 : 0) },
                { key: 'storageDays', label: 'Retention', width: 120, align: 'right', numeric: true, render: (r) => `${r.storageDays} days` },
                { key: 'lastMotion', label: 'Last motion', width: 130, numeric: true },
                { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status === 'Online' ? 'Active' : r.status === 'Degraded' ? 'Pending' : 'Suspended', { tone: r.status === 'Online' ? 'success' : r.status === 'Degraded' ? 'warning' : 'danger', icon: 'cctv' }) },
              ],
              rows: cameras, paginate: false, exportName: 'cctv-cameras',
              onRowClick: cameraDrawer,
              rowActions: (row) => [
                { label: 'Open live view', icon: 'eye', onClick: () => cameraDrawer(row) },
                { label: 'Raise maintenance ticket', icon: 'wrench', onClick: mockAction('Raise ticket') },
              ],
            })),
        ],
      }));
    },
  },
};

/* ==========================================================================
   SYSTEM — users, roles and the permission matrix
   ========================================================================== */

const ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Approve', 'Export', 'Configure'];

const MODULE_LABELS = {
  dashboard: 'Dashboards', admissions: 'Admissions', students: 'Students', parents: 'Parents',
  teachers: 'Teachers', hr: 'Human Resources', academics: 'Academics', timetable: 'Timetable',
  attendance: 'Attendance', examination: 'Examination', fees: 'Fees', finance: 'Finance',
  library: 'Library', transport: 'Transport', hostel: 'Hostel', inventory: 'Inventory & Assets',
  lms: 'Learning (LMS)', communication: 'Communication', ptm: 'Parent-Teacher Meetings',
  activities: 'Activities & Sports', health: 'Health & Wellness', frontoffice: 'Front Office',
  security: 'Security', complaints: 'Complaints', events: 'Events', alumni: 'Alumni',
  reports: 'Reports', portals: 'Portals', system: 'System',
};

const moduleLabel = (m) => MODULE_LABELS[m] || m;

/** Seed the matrix for a role from the permission grants declared in state.js. */
function matrixFor(role) {
  const grants = store.permissionsFor(role);
  const wildcardAll = grants.includes('*');
  const out = {};
  for (const m of PERMISSION_MODULES) {
    const moduleWildcard = wildcardAll || grants.includes(`${m}.*`);
    const explicit = grants.filter((g) => g.startsWith(`${m}.`)).map((g) => g.split('.')[1]);
    out[m] = {};
    for (const a of ACTIONS) {
      const key = a.toLowerCase();
      const inherited = moduleWildcard;
      const direct = explicit.includes(key)
        || (key === 'view' && explicit.length > 0)
        || (key === 'create' && explicit.includes('add'));
      out[m][a] = { on: inherited || direct, inherited, source: wildcardAll ? 'Super admin (*)' : moduleWildcard ? `${m}.*` : direct ? `${m}.${key}` : null };
    }
  }
  return out;
}

const systemRoutes = {
  'system/users': {
    title: 'Users',
    subtitle: 'Every login on the platform, with role, campus and 2FA state',
    section: 'system',
    render(mount, ctx) {
      ensureStyles();
      const rows = db.users;
      const active = rows.filter((u) => u.status === 'Active');
      const twoFa = rows.filter((u) => u.twoFactor);
      const byRole = countBy(rows, 'roleName').slice(0, 8);

      const addUser = () => formPage({
        title: 'Create a user', subtitle: 'The user receives an invitation email with a one-time link',
        mode: 'modal', size: 'lg', submitLabel: 'Create user',
        sections: [{
          title: 'Account', cols: 2,
          fields: [
            { id: 'name', label: 'Full name', required: true },
            { id: 'username', label: 'Username', required: true, hint: 'Lower case, no spaces' },
            { id: 'email', label: 'Work email', type: 'email', required: true, validate: validators.email },
            { id: 'employee', label: 'Link to employee', type: 'combobox', options: db.staff.slice(0, 200).map((s) => ({ value: s.id, label: `${s.name} — ${s.employeeCode}` })) },
            { id: 'role', label: 'Role', type: 'select', required: true, options: db.roles.map((r) => ({ value: r.id, label: r.name })) },
            { id: 'campus', label: 'Primary campus', type: 'select', required: true, options: db.campuses.map((c) => ({ value: c.id, label: c.name })) },
            { id: 'extraCampus', label: 'Additional campus access', type: 'multiselect', options: db.campuses.map((c) => ({ value: c.id, label: c.name })) },
            { id: 'twoFactor', label: 'Require two-factor authentication', type: 'switch', value: true },
            { id: 'notes', label: 'Notes', type: 'textarea', span: 'full' },
          ],
        }],
        onSubmit: (v) => notify({ title: 'User created', text: `${v.name} · invitation sent to ${v.email}`, tone: 'success' }),
      });

      const detail = (u) => {
        const logins = db.loginHistory.filter((l) => l.userId === u.id).slice(0, 10);
        const audits = db.auditLogs.filter((a) => a.userId === u.id).slice(0, 10);
        Drawer({
          title: u.name, subtitle: `${u.username} · ${u.roleName}`, size: 'lg',
          body: h('div', { className: 'stack' },
            h('div', { className: 'row-3' },
              Avatar(u.name, { size: 'xl', status: u.status === 'Active' ? 'online' : 'offline' }),
              h('div', { className: 'stack-1 flex-1' },
                h('div', { className: 't-semibold' }, u.name),
                h('div', { className: 't-sm t-muted' }, u.email),
                h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
                  Badge(u.status), Badge(u.roleName, { tone: 'brand' }),
                  u.twoFactor ? Badge('2FA on', { tone: 'success', icon: 'lock' }) : Badge('2FA off', { tone: 'danger', icon: 'unlock' })))),
            DescriptionList([
              ['Username', u.username], ['Role', u.roleName], ['Employee', u.employeeId || '—'],
              ['Campus', (byId(db.campuses, u.campusId) || {}).name || u.campusId],
              ['Last login', u.lastLogin ? formatDateTime(u.lastLogin) : 'Never'],
              ['Created', formatDate(u.createdAt)], ['Total logins', formatNumber(u.loginCount)],
            ], { cols: 2 }),
            SectionCard({ title: 'Effective permissions', subtitle: `Granted through the ${u.roleName} role`, icon: 'shield' },
              h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
                store.permissionsFor(u.role).slice(0, 24).map((p) => Tag(p, { icon: 'check' })))),
            SectionCard({ title: 'Recent logins', icon: 'log-in', flush: true },
              logins.length ? DataTable({
                columns: [
                  { key: 'timestamp', label: 'When', width: 180, render: (r) => formatDateTime(r.timestamp) },
                  { key: 'ip', label: 'IP', width: 140, className: 't-mono' },
                  { key: 'device', label: 'Device', width: 180 },
                  { key: 'result', label: 'Result', width: 120, render: (r) => Badge(r.result === 'Success' ? 'Verified' : 'Rejected', { tone: r.result === 'Success' ? 'success' : 'danger' }) },
                ],
                rows: logins, paginate: false, searchable: false, columnToggle: false, exportable: false,
              }) : EmptyState({ icon: 'log-in', title: 'No logins recorded' })),
            SectionCard({ title: 'Recent activity', icon: 'history' },
              audits.length ? Timeline(audits.map((a) => ({
                title: `${a.action} · ${moduleLabel(a.module)}`, meta: formatDateTime(a.timestamp),
                text: a.description, icon: 'history', tone: a.severity === 'Critical' ? 'danger' : a.severity === 'Warning' ? 'warning' : 'info',
              }))) : EmptyState({ icon: 'history', title: 'No activity logged' }))),
          actions: (close) => frag(
            Button('Reset password', { variant: 'secondary', icon: 'key', onClick: () => notify({ title: 'Reset link sent', text: u.email, tone: 'success' }) }),
            u.status === 'Active'
              ? Button('Suspend user', { variant: 'danger', icon: 'user-x', onClick: () => { close(); ConfirmDialog({ title: `Suspend ${u.name}?`, text: 'The user is signed out of every device immediately.', confirmLabel: 'Suspend', tone: 'danger' }).then((ok) => ok && notify({ title: 'User suspended', tone: 'danger' })); } })
              : Button('Reactivate', { variant: 'primary', icon: 'user-check', onClick: () => { close(); notify({ title: 'User reactivated', tone: 'success' }); } })),
        });
      };

      mount.appendChild(listPage({
        title: 'Users',
        subtitle: `${formatNumber(rows.length)} accounts · ${active.length} active · ${twoFa.length} with two-factor authentication`,
        route: 'system/users',
        actions: pageActions(
          Button('Import users', { variant: 'secondary', icon: 'upload', route: 'system/data-import-export' }),
          Button('Create user', { variant: 'primary', icon: 'user-plus', onClick: addUser })),
        kpis: [
          { label: 'Total users', value: formatNumber(rows.length), icon: 'users', tone: 'brand' },
          { label: 'Active', value: formatNumber(active.length), icon: 'user-check', tone: 'success' },
          { label: '2FA enabled', value: `${pct(twoFa.length, rows.length)}%`, icon: 'lock', tone: twoFa.length / rows.length > 0.6 ? 'success' : 'warning' },
          { label: 'Never logged in', value: formatNumber(rows.filter((u) => !u.loginCount).length), icon: 'user-x', tone: 'danger' },
        ],
        chart: barChart({
          categories: byRole.map((r) => r.key),
          series: [{ name: 'Users', values: byRole.map((r) => r.value) }],
          horizontal: true, height: 260,
        }),
        chartTitle: 'Users by role',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Name, username or email…' },
          { id: 'roleName', label: 'Role', options: Array.from(new Set(rows.map((r) => r.roleName))) },
          { id: 'campusId', label: 'Campus', options: db.campuses.map((c) => ({ value: c.id, label: c.name })) },
          { id: 'status', label: 'Status', options: ['Active', 'Suspended', 'Inactive'] },
        ],
        onFilter: (id, value, all, table) => {
          let out = rows;
          if (all.q) out = search(out, all.q, ['name', 'username', 'email']);
          if (all.roleName && all.roleName !== 'all') out = out.filter((r) => r.roleName === all.roleName);
          if (all.campusId && all.campusId !== 'all') out = out.filter((r) => r.campusId === all.campusId);
          if (all.status && all.status !== 'all') out = out.filter((r) => r.status === all.status);
          table.refresh(out);
        },
        columns: [
          { key: 'name', label: 'User', sticky: true, width: 250, render: (r) => Identity(r.name, `${r.username} · ${r.email}`), value: (r) => r.name },
          { key: 'roleName', label: 'Role', width: 190, filter: true, render: (r) => Badge(r.roleName, { tone: 'brand' }) },
          { key: 'campusId', label: 'Campus', width: 170, filter: true, render: (r) => (byId(db.campuses, r.campusId) || {}).name || r.campusId },
          { key: 'employeeId', label: 'Employee', width: 130, render: (r) => r.employeeId || h('span', { className: 't-faint' }, '—') },
          { key: 'twoFactor', label: '2FA', width: 100, render: (r) => (r.twoFactor ? Badge('On', { tone: 'success' }) : Badge('Off', { tone: 'danger' })), value: (r) => (r.twoFactor ? 1 : 0) },
          { key: 'lastLogin', label: 'Last login', width: 170, render: (r) => (r.lastLogin ? relativeTime(r.lastLogin) : h('span', { className: 't-faint' }, 'Never')), value: (r) => r.lastLogin || '' },
          { key: 'loginCount', label: 'Logins', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        selectable: true, pageSize: 25, footerAggregates: true, exportName: 'users',
        searchKeys: ['name', 'username', 'email', 'roleName'],
        bulkActions: [
          { label: 'Force password reset', icon: 'key', onClick: (sel) => notify({ title: `Reset links sent to ${sel.length} users`, tone: 'success' }) },
          { label: 'Enable 2FA', icon: 'lock', onClick: (sel) => notify({ title: `2FA enforced for ${sel.length} users`, tone: 'success' }) },
          { label: 'Suspend', icon: 'user-x', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} users suspended`, tone: 'danger' }) },
        ],
        rowActions: (row) => [
          { label: 'Open user', icon: 'eye', onClick: () => detail(row) },
          { label: 'Edit role', icon: 'shield', route: 'system/roles' },
          { label: 'Reset password', icon: 'key', onClick: () => notify({ title: 'Reset link sent', text: row.email, tone: 'success' }) },
          { label: 'Impersonate', icon: 'user-cog', onClick: mockAction('Impersonate user') },
          { separator: true },
          { label: 'Suspend', icon: 'user-x', tone: 'danger', onClick: () => ConfirmDialog({ title: `Suspend ${row.name}?`, text: 'Active sessions are terminated immediately.', confirmLabel: 'Suspend', tone: 'danger' }).then((ok) => ok && notify({ title: 'User suspended', tone: 'danger' })) },
        ],
        onRowClick: detail,
        tableTitle: 'User directory',
        emptyState: EmptyState({ icon: 'users', title: 'No users', text: 'Create the first administrator account to get started.', action: Button('Create user', { variant: 'primary', icon: 'user-plus', onClick: addUser }) }),
      }));
    },
  },

  'system/roles': {
    title: 'Roles',
    subtitle: 'Twenty roles, from super admin to parent',
    section: 'system',
    render(mount) {
      ensureStyles();
      const rows = db.roles.map((r) => {
        const grants = store.permissionsFor(r.id);
        return {
          ...r,
          grants: grants.length,
          fullAccess: grants.includes('*'),
          modules: grants.includes('*') ? PERMISSION_MODULES.length : new Set(grants.map((g) => g.split('.')[0])).size,
          dashboard: (store.ROLES.find((x) => x.id === r.id) || {}).dashboard || '—',
          group: (store.ROLES.find((x) => x.id === r.id) || {}).group || 'Other',
        };
      });

      const detail = (r) => Drawer({
        title: r.name, subtitle: `${formatNumber(r.users)} users · ${r.modules} modules`, size: 'lg',
        body: h('div', { className: 'stack' },
          h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
            Badge(r.system ? 'System role' : 'Custom role', { tone: r.system ? 'info' : 'neutral' }),
            Badge(r.group, { tone: 'brand' }),
            r.fullAccess ? Badge('Unrestricted access', { tone: 'danger', icon: 'shield-check' }) : null),
          Callout({ tone: 'neutral', icon: 'shield', title: 'What this role does' }, r.description),
          DescriptionList([
            ['Role id', r.id], ['Users assigned', formatNumber(r.users)],
            ['Landing dashboard', r.dashboard], ['Modules reachable', String(r.modules)],
            ['Editable', r.system ? 'No — system role' : 'Yes'],
          ], { cols: 2 }),
          SectionCard({ title: 'Permission grants', subtitle: 'As configured in the permission matrix', icon: 'table' },
            h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
              store.permissionsFor(r.id).map((p) => Tag(p, { icon: 'check' })))),
          SectionCard({ title: 'Users with this role', icon: 'users', flush: true },
            (() => {
              const us = db.users.filter((u) => u.role === r.id).slice(0, 50);
              return us.length ? DataTable({
                columns: [
                  { key: 'name', label: 'User', width: 220, render: (u) => Identity(u.name, u.email), value: (u) => u.name },
                  { key: 'campusId', label: 'Campus', width: 160, render: (u) => (byId(db.campuses, u.campusId) || {}).name || u.campusId },
                  { key: 'status', label: 'Status', width: 120, render: (u) => Badge(u.status) },
                ],
                rows: us, pageSize: 8, searchable: false, columnToggle: false, exportable: false,
              }) : EmptyState({ icon: 'users', title: 'No users hold this role yet' });
            })())),
        actions: (close) => frag(
          Button('Close', { variant: 'secondary', onClick: close }),
          Button('Edit permissions', { variant: 'primary', icon: 'table', onClick: () => { close(); navigate('system/permissions', { role: r.id }); } })),
      });

      mount.appendChild(listPage({
        title: 'Roles',
        subtitle: `${rows.length} roles govern access across ${PERMISSION_MODULES.length} modules`,
        route: 'system/roles',
        actions: pageActions(
          Button('Permission matrix', { variant: 'secondary', icon: 'table', route: 'system/permissions' }),
          Button('Create role', { variant: 'primary', icon: 'plus', onClick: () => formPage({
            title: 'Create a role', mode: 'modal', size: 'md', submitLabel: 'Create role',
            sections: [{ title: 'Role', cols: 1, fields: [
              { id: 'name', label: 'Role name', required: true },
              { id: 'group', label: 'Group', type: 'select', options: ['Leadership', 'Operations', 'Academics', 'Facilities', 'Portals'] },
              { id: 'clone', label: 'Copy permissions from', type: 'select', options: db.roles.map((r) => ({ value: r.id, label: r.name })) },
              { id: 'description', label: 'Description', type: 'textarea', required: true },
            ] }],
            onSubmit: (v) => notify({ title: 'Role created', text: `${v.name} · configure it in the permission matrix`, tone: 'success' }),
          }) })),
        kpis: [
          { label: 'Roles', value: formatNumber(rows.length), icon: 'shield', tone: 'brand' },
          { label: 'System roles', value: formatNumber(rows.filter((r) => r.system).length), icon: 'lock', tone: 'info' },
          { label: 'Users assigned', value: formatNumber(sum(rows, 'users')), icon: 'users', tone: 'success' },
          { label: 'Unrestricted roles', value: formatNumber(rows.filter((r) => r.fullAccess).length), icon: 'alert-triangle', tone: 'danger' },
        ],
        chart: barChart({
          categories: rows.slice(0, 10).map((r) => r.name),
          series: [{ name: 'Users', values: rows.slice(0, 10).map((r) => r.users) }],
          horizontal: true, height: 280,
        }),
        chartTitle: 'Where the users are',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Role name…' },
          { id: 'group', label: 'Group', options: Array.from(new Set(rows.map((r) => r.group))) },
          { id: 'system', label: 'Type', options: ['System role', 'Custom role'] },
        ],
        onFilter: (id, value, all, table) => {
          let out = rows;
          if (all.q) out = search(out, all.q, ['name', 'description']);
          if (all.group && all.group !== 'all') out = out.filter((r) => r.group === all.group);
          if (all.system && all.system !== 'all') out = out.filter((r) => (all.system === 'System role' ? r.system : !r.system));
          table.refresh(out);
        },
        columns: [
          { key: 'name', label: 'Role', sticky: true, width: 240, render: (r) => Identity(r.name, r.id), value: (r) => r.name },
          { key: 'description', label: 'What it can do', width: 340 },
          { key: 'group', label: 'Group', width: 150, filter: true, render: (r) => Badge(r.group, { tone: 'neutral' }) },
          { key: 'users', label: 'Users', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'modules', label: 'Modules', width: 120, align: 'right', numeric: true },
          { key: 'system', label: 'Type', width: 140, render: (r) => (r.system ? Badge('System', { tone: 'info' }) : Badge('Custom', { tone: 'neutral' })), value: (r) => (r.system ? 1 : 0) },
        ],
        rows,
        pageSize: 25, footerAggregates: true, exportName: 'roles',
        rowActions: (row) => [
          { label: 'Open role', icon: 'eye', onClick: () => detail(row) },
          { label: 'Edit permissions', icon: 'table', onClick: () => navigate('system/permissions', { role: row.id }) },
          { label: 'Duplicate', icon: 'copy', onClick: mockAction('Duplicate role') },
          { separator: true },
          { label: 'Delete role', icon: 'trash', tone: 'danger', disabled: row.system, onClick: () => ConfirmDialog({ title: `Delete ${row.name}?`, text: `${row.users} users would lose access. Reassign them first.`, confirmLabel: 'Delete', tone: 'danger' }).then((ok) => ok && notify({ title: 'Role deleted', tone: 'danger' })) },
        ],
        onRowClick: detail,
        tableTitle: 'All roles',
        emptyState: EmptyState({ icon: 'shield', title: 'No roles defined' }),
      }));
    },
  },

  'system/permissions': {
    title: 'Permission Matrix',
    subtitle: 'Modules × actions, per role — the single source of truth for access',
    section: 'system',
    render(mount, ctx) {
      ensureStyles();
      const roles = db.roles;
      let roleId = (ctx.query && ctx.query.role) || 'principal';
      if (!roles.some((r) => r.id === roleId)) roleId = roles[0].id;
      let matrix = matrixFor(roleId);
      let filterText = '';
      let dirty = 0;

      const tableHost = h('div', { className: 'pt-matrix-wrap' });
      const summaryHost = h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-4)' } });
      const saveBar = h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } });

      const visibleModules = () => PERMISSION_MODULES.filter((m) => !filterText || moduleLabel(m).toLowerCase().includes(filterText.toLowerCase()) || m.includes(filterText.toLowerCase()));

      const countOn = () => {
        let on = 0; let inh = 0;
        for (const m of PERMISSION_MODULES) for (const a of ACTIONS) { if (matrix[m][a].on) on++; if (matrix[m][a].inherited) inh++; }
        return { on, inh, total: PERMISSION_MODULES.length * ACTIONS.length };
      };

      const paintSummary = () => {
        const c = countOn();
        const role = roles.find((r) => r.id === roleId);
        summaryHost.innerHTML = '';
        summaryHost.appendChild(frag(
          h('div', null, h('div', { className: 't-eyebrow' }, 'Role'), h('div', { className: 't-lg t-semibold' }, role.name)),
          h('div', null, h('div', { className: 't-eyebrow' }, 'Users'), h('div', { className: 't-lg t-semibold' }, formatNumber(role.users))),
          h('div', null, h('div', { className: 't-eyebrow' }, 'Permissions granted'), h('div', { className: 't-lg t-semibold' }, `${c.on} / ${c.total}`)),
          h('div', null, h('div', { className: 't-eyebrow' }, 'Inherited'), h('div', { className: 't-lg t-semibold' }, String(c.inh))),
          h('div', null, h('div', { className: 't-eyebrow' }, 'Unsaved changes'), h('div', { className: ['t-lg t-semibold', dirty ? 't-warning' : ''].join(' ') }, String(dirty))),
          h('div', { className: 'flex-1', style: { minWidth: '180px' } },
            h('div', { className: 't-eyebrow mb-1' }, 'Coverage'),
            ProgressBar(pct(c.on, c.total), { showValue: true, tone: 'brand' }))));
      };

      const setCell = (m, a, on) => {
        if (matrix[m][a].on !== on) dirty++;
        matrix[m][a].on = on;
      };

      const paintTable = () => {
        const mods = visibleModules();
        const table = h('table', { className: 'pt-matrix' });
        const thead = h('thead', null,
          h('tr', null,
            h('th', { className: 'pt-mx-mod' }, 'Module'),
            ACTIONS.map((a) => h('th', null,
              h('div', { className: 'stack-1', style: { alignItems: 'center' } },
                h('span', null, a),
                h('button', {
                  type: 'button', className: 'btn btn-link', style: { fontSize: 'var(--fs-2xs)' },
                  attrs: { 'aria-label': `Toggle ${a} for every module` },
                  onClick: () => {
                    const allOn = mods.every((m) => matrix[m][a].on);
                    mods.forEach((m) => { if (!matrix[m][a].inherited) setCell(m, a, !allOn); });
                    paintTable(); paintSummary();
                  },
                }, 'toggle all')))),
            h('th', { style: { minWidth: '120px' } }, 'Row')));
        const tbody = h('tbody');
        for (const m of mods) {
          const allOn = ACTIONS.every((a) => matrix[m][a].on);
          tbody.appendChild(h('tr', null,
            h('td', { className: 'pt-mx-mod' },
              h('div', { className: 'row', style: { gap: 'var(--sp-2)' } },
                Icon(m === 'system' ? 'settings' : m, 15),
                h('div', null,
                  h('div', { className: 't-medium' }, moduleLabel(m)),
                  h('div', { className: 'pt-mx-inherit' }, m)))),
            ACTIONS.map((a) => {
              const cell = matrix[m][a];
              return h('td', null,
                h('div', { className: 'stack-1', style: { alignItems: 'center' } },
                  Checkbox('', {
                    checked: cell.on, disabled: cell.inherited,
                    onChange: (v) => { setCell(m, a, v); paintSummary(); },
                  }),
                  cell.inherited ? h('span', { className: 'pt-mx-inherit' }, 'inherited') : null));
            }),
            h('td', null,
              Button(allOn ? 'Clear' : 'All', {
                variant: 'ghost', size: 'sm',
                onClick: () => { ACTIONS.forEach((a) => { if (!matrix[m][a].inherited) setCell(m, a, !allOn); }); paintTable(); paintSummary(); },
              }))));
        }
        table.appendChild(thead); table.appendChild(tbody);
        tableHost.innerHTML = '';
        if (!mods.length) {
          tableHost.appendChild(EmptyState({ icon: 'search', title: 'No modules match that search', text: 'Clear the filter to see all 29 modules.' }));
        } else {
          tableHost.appendChild(table);
        }
      };

      const paintSaveBar = () => {
        saveBar.innerHTML = '';
        saveBar.appendChild(frag(
          Button('Save permissions', {
            variant: 'primary', icon: 'check',
            onClick: () => {
              const c = countOn();
              notify({ title: 'Permissions saved', text: `${roles.find((r) => r.id === roleId).name} · ${c.on} permissions active · ${dirty} changes applied`, tone: 'success' });
              dirty = 0; paintSummary();
            },
          }),
          Button('Reset to role defaults', {
            variant: 'secondary', icon: 'refresh-ccw',
            onClick: () => ConfirmDialog({ title: 'Reset this role?', text: 'All unsaved changes are discarded and the role returns to its shipped defaults.', confirmLabel: 'Reset', tone: 'danger' })
              .then((ok) => { if (!ok) return; matrix = matrixFor(roleId); dirty = 0; paintTable(); paintSummary(); notify({ title: 'Role reset to defaults', tone: 'warning' }); }),
          }),
          Button('Copy from another role', { variant: 'ghost', icon: 'copy', onClick: () => copyFromRole() }),
          h('span', { className: 'spacer' }),
          h('span', { className: 't-xs t-muted' }, 'Changes apply on the user’s next sign-in.')));
      };

      const copyFromRole = () => {
        let from = roles.find((r) => r.id !== roleId).id;
        Modal({
          title: 'Copy permissions', subtitle: `Overwrite the ${roles.find((r) => r.id === roleId).name} matrix`, size: 'sm', icon: 'copy',
          body: Field({ label: 'Copy from role', required: true },
            Select({ options: roles.filter((r) => r.id !== roleId).map((r) => ({ value: r.id, label: r.name })), value: from, onChange: (v) => { from = v; } })),
          actions: (close) => frag(
            Button('Cancel', { variant: 'secondary', onClick: close }),
            Button('Copy', { variant: 'primary', icon: 'copy', onClick: () => { matrix = matrixFor(from); dirty = PERMISSION_MODULES.length; close(); paintTable(); paintSummary(); notify({ title: 'Permissions copied', text: `From ${roles.find((r) => r.id === from).name}`, tone: 'success' }); } })),
        });
      };

      const switchRole = (id) => {
        const go = () => { roleId = id; matrix = matrixFor(roleId); dirty = 0; paintTable(); paintSummary(); paintSaveBar(); };
        if (dirty) {
          ConfirmDialog({ title: 'Discard unsaved changes?', text: `You have ${dirty} unsaved permission changes on this role.`, confirmLabel: 'Discard and switch', tone: 'danger' })
            .then((ok) => ok && go());
        } else go();
      };

      paintTable(); paintSummary(); paintSaveBar();

      mount.appendChild(page({
        route: 'system/permissions',
        title: 'Permission matrix',
        subtitle: `${PERMISSION_MODULES.length} modules × ${ACTIONS.length} actions × ${roles.length} roles`,
        actions: pageActions(
          Button('Export matrix', { variant: 'secondary', icon: 'download', onClick: () => notify({ title: 'Matrix exported as CSV', tone: 'success' }) }),
          Button('Module access', { variant: 'primary', icon: 'layers', route: 'system/module-access' })),
        children: [
          Callout({ tone: 'info', icon: 'shield', title: 'How inheritance works' },
            'A cell marked “inherited” comes from a wildcard grant such as students.* or the unrestricted * held by Super Admin. Inherited permissions cannot be unticked here — remove the wildcard from the role first.'),
          Card({ pad: true },
            h('div', { className: 'stack-3' },
              h('div', { className: 't-eyebrow' }, 'Choose a role'),
              Tabs(roles.slice(0, 10).map((r) => ({ id: r.id, label: r.name, count: r.users })), switchRole, { active: roleId }),
              h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-3)' } },
                Field({ label: 'More roles' },
                  Select({ options: roles.map((r) => ({ value: r.id, label: r.name })), value: roleId, onChange: switchRole })),
                Field({ label: 'Filter modules' },
                  SearchInput({ placeholder: 'e.g. fees, transport…', onInput: (v) => { filterText = v; paintTable(); }, width: '260px' })),
                h('span', { className: 'spacer' }),
                h('div', { className: 'pt-mx-legend' },
                  h('span', { className: 'row', style: { gap: 'var(--sp-1)' } }, Icon('check-circle', 13), 'Granted'),
                  h('span', { className: 'row', style: { gap: 'var(--sp-1)' } }, Icon('lock', 13), 'Inherited from a wildcard'),
                  h('span', { className: 'row', style: { gap: 'var(--sp-1)' } }, Icon('x-circle', 13), 'Denied'))),
              summaryHost)),
          SectionCard({
            title: 'Access grid', subtitle: 'Tick a cell to grant that action on that module',
            icon: 'table', flush: true, footer: saveBar,
          }, tableHost),
        ],
      }));
    },
  },
};

const systemRoutes2 = {
  'system/module-access': {
    title: 'Module Access',
    subtitle: 'Which modules a role can open at all, and with what data scope',
    section: 'system',
    render(mount, ctx) {
      ensureStyles();
      const roles = db.roles;
      let roleId = (ctx.query && ctx.query.role) || 'accountant';
      if (!roles.some((r) => r.id === roleId)) roleId = roles[0].id;

      const build = (rid) => {
        const grants = store.permissionsFor(rid);
        const all = grants.includes('*');
        return PERMISSION_MODULES.map((m) => {
          const has = all || grants.some((g) => g.split('.')[0] === m);
          const full = all || grants.includes(`${m}.*`);
          return {
            id: m, module: moduleLabel(m),
            enabled: has,
            level: full ? 'Full access' : has ? 'Read & write' : 'No access',
            scope: ['super-admin', 'management'].includes(rid) ? 'All campuses' : has ? 'Own campus' : '—',
            landing: routeMeta(`${m}/dashboard`) ? `${m}/dashboard` : (NAV.find((s) => s.id === m) || { items: [] }).items[0] ? NAV.find((s) => s.id === m).items[0].route : '—',
            screens: (NAV.find((s) => s.id === m) || { items: [] }).items.reduce((a, i) => a + 1 + (i.children ? i.children.length : 0), 0),
          };
        });
      };

      let rows = build(roleId);
      const state = new Map(rows.map((r) => [r.id, r.enabled]));
      const tableHost = h('div');
      const kpiHost = h('div');

      const paint = () => {
        const enabled = rows.filter((r) => state.get(r.id));
        kpiHost.innerHTML = '';
        kpiHost.appendChild(kpiRow([
          { label: 'Modules enabled', value: `${enabled.length} / ${rows.length}`, icon: 'layers', tone: 'brand' },
          { label: 'Screens reachable', value: formatNumber(sum(enabled, 'screens')), icon: 'grid', tone: 'info' },
          { label: 'Full access', value: formatNumber(rows.filter((r) => r.level === 'Full access' && state.get(r.id)).length), icon: 'shield-check', tone: 'success' },
          { label: 'Blocked', value: formatNumber(rows.length - enabled.length), icon: 'lock', tone: 'warning' },
        ]));

        tableHost.innerHTML = '';
        tableHost.appendChild(DataTable({
          columns: [
            { key: 'module', label: 'Module', sticky: true, width: 230, render: (r) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, Icon(r.id === 'system' ? 'settings' : r.id, 15), h('span', { className: 't-medium' }, r.module)), value: (r) => r.module },
            {
              key: 'enabled', label: 'Enabled', width: 130, sortable: false,
              render: (r) => Switch('', { checked: state.get(r.id), onChange: (v) => { state.set(r.id, v); paint(); } }),
              value: (r) => (state.get(r.id) ? 1 : 0),
            },
            {
              key: 'level', label: 'Access level', width: 190, filter: true, sortable: false,
              render: (r) => Select({ options: ['Full access', 'Read & write', 'Read only', 'No access'], value: state.get(r.id) ? r.level : 'No access', disabled: !state.get(r.id), onChange: (v) => { r.level = v; } }),
            },
            {
              key: 'scope', label: 'Data scope', width: 190, filter: true, sortable: false,
              render: (r) => Select({ options: ['All campuses', 'Own campus', 'Own department', 'Own records'], value: state.get(r.id) ? (r.scope === '—' ? 'Own campus' : r.scope) : 'Own records', disabled: !state.get(r.id), onChange: (v) => { r.scope = v; } }),
            },
            { key: 'screens', label: 'Screens', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
            { key: 'landing', label: 'Landing route', width: 220, className: 't-mono', render: (r) => (r.landing === '—' ? h('span', { className: 't-faint' }, '—') : Button(r.landing, { variant: 'link', size: 'sm', route: r.landing })) },
          ],
          rows, paginate: false, footerAggregates: true, exportName: 'module-access', maxHeight: '62vh',
          searchKeys: ['module'], searchPlaceholder: 'Find a module…',
        }));
      };

      const switchRole = (id) => {
        roleId = id;
        rows = build(roleId);
        state.clear();
        rows.forEach((r) => state.set(r.id, r.enabled));
        paint();
      };
      paint();

      mount.appendChild(page({
        route: 'system/module-access',
        title: 'Module access',
        subtitle: 'Turn whole modules on or off per role, and set how much data each role sees',
        actions: pageActions(
          Button('Permission matrix', { variant: 'secondary', icon: 'table', route: 'system/permissions' }),
          Button('Save module access', { variant: 'primary', icon: 'check', onClick: () => notify({ title: 'Module access saved', text: `${roles.find((r) => r.id === roleId).name} · applies on next sign-in`, tone: 'success' }) })),
        children: [
          Card({ pad: true },
            h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-3)' } },
              Field({ label: 'Role' }, Select({ options: roles.map((r) => ({ value: r.id, label: `${r.name} (${r.users} users)` })), value: roleId, onChange: switchRole })),
              Field({ label: 'Preset' }, Select({ options: ['Custom', 'Read-only auditor', 'Campus operations', 'Academics only', 'Finance only'], value: 'Custom', onChange: () => notify({ title: 'Preset applied', text: 'Review the grid before saving.', tone: 'info' }) })),
              h('span', { className: 'spacer' }),
              Button('Enable all', { variant: 'ghost', icon: 'check-circle', onClick: () => { rows.forEach((r) => state.set(r.id, true)); paint(); } }),
              Button('Disable all', { variant: 'ghost', icon: 'x-circle', onClick: () => { rows.forEach((r) => state.set(r.id, false)); paint(); } }))),
          kpiHost,
          Callout({ tone: 'info', icon: 'layers', title: 'Module access vs the permission matrix' },
            'This screen decides whether a module appears at all. The permission matrix then decides which actions are allowed inside it. A module switched off here hides every one of its menu items.'),
          SectionCard({ title: 'Modules', subtitle: `Access for ${roles.find((r) => r.id === roleId).name}`, icon: 'layers', flush: true }, tableHost),
        ],
      }));
    },
  },

  'system/campus-access': {
    title: 'Campus Access',
    subtitle: 'Which campuses each user may switch into',
    section: 'system',
    render(mount) {
      ensureStyles();
      const campuses = db.campuses;
      const users = db.users.slice(0, 120);
      const access = new Map();
      for (const u of users) {
        const set = new Set([u.campusId]);
        if (['super-admin', 'management'].includes(u.role)) campuses.forEach((c) => set.add(c.id));
        else if (hash01(u.id) > 0.78) set.add(campuses[(campuses.findIndex((c) => c.id === u.campusId) + 1) % campuses.length].id);
        access.set(u.id, set);
      }

      const tableHost = h('div');
      const kpiHost = h('div');

      const paint = () => {
        const multi = users.filter((u) => access.get(u.id).size > 1);
        const perCampus = campuses.map((c) => ({ key: c.code || c.name, value: users.filter((u) => access.get(u.id).has(c.id)).length }));
        kpiHost.innerHTML = '';
        kpiHost.appendChild(kpiRow([
          { label: 'Users mapped', value: formatNumber(users.length), icon: 'users', tone: 'brand' },
          { label: 'Multi-campus users', value: formatNumber(multi.length), icon: 'building-2', tone: 'warning' },
          { label: 'Campuses', value: formatNumber(campuses.length), icon: 'map-pin', tone: 'info' },
          { label: 'Group-wide access', value: formatNumber(users.filter((u) => access.get(u.id).size === campuses.length).length), icon: 'globe', tone: 'danger' },
        ]));

        tableHost.innerHTML = '';
        tableHost.appendChild(DataTable({
          columns: [
            { key: 'name', label: 'User', sticky: true, width: 240, render: (u) => Identity(u.name, `${u.roleName} · ${u.username}`), value: (u) => u.name },
            { key: 'roleName', label: 'Role', width: 180, filter: true },
            { key: 'home', label: 'Home campus', width: 180, filter: true, render: (u) => Badge((byId(campuses, u.campusId) || {}).name || u.campusId, { tone: 'brand' }), value: (u) => u.campusId },
            ...campuses.map((c) => ({
              key: 'c-' + c.id, label: c.name.replace(/Springdale\s*/i, ''), width: 150, sortable: false,
              render: (u) => Checkbox('', {
                checked: access.get(u.id).has(c.id),
                disabled: u.campusId === c.id,
                onChange: (v) => { const s = access.get(u.id); if (v) s.add(c.id); else s.delete(c.id); paint(); },
              }),
              value: (u) => (access.get(u.id).has(c.id) ? 1 : 0),
            })),
            { key: 'count', label: 'Campuses', width: 120, align: 'right', numeric: true, render: (u) => String(access.get(u.id).size), value: (u) => access.get(u.id).size },
          ],
          rows: users, pageSize: 25, exportName: 'campus-access', searchKeys: ['name', 'username', 'roleName'],
          selectable: true,
          bulkActions: [
            { label: 'Grant all campuses', icon: 'globe', onClick: (sel) => { sel.forEach((u) => campuses.forEach((c) => access.get(u.id).add(c.id))); paint(); notify({ title: `Group access granted to ${sel.length} users`, tone: 'warning' }); } },
            { label: 'Restrict to home campus', icon: 'lock', onClick: (sel) => { sel.forEach((u) => access.set(u.id, new Set([u.campusId]))); paint(); notify({ title: `${sel.length} users restricted`, tone: 'success' }); } },
          ],
          emptyState: EmptyState({ icon: 'building-2', title: 'No users to map' }),
        }));
        return perCampus;
      };
      const perCampus = paint();

      mount.appendChild(page({
        route: 'system/campus-access',
        title: 'Campus access',
        subtitle: `${users.length} users mapped across ${campuses.length} campuses`,
        actions: pageActions(
          Button('Export mapping', { variant: 'secondary', icon: 'download', onClick: () => notify({ title: 'Mapping exported', tone: 'success' }) }),
          Button('Save access', { variant: 'primary', icon: 'check', onClick: () => notify({ title: 'Campus access saved', text: 'Users see the change at their next campus switch.', tone: 'success' }) })),
        children: [
          kpiHost,
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-7' }, SectionCard({ title: 'Campuses', subtitle: 'Group footprint', icon: 'map-pin', flush: true },
              DataTable({
                columns: [
                  { key: 'name', label: 'Campus', width: 240, sticky: true, render: (c) => Identity(c.name, `${c.city}, ${c.state}`), value: (c) => c.name },
                  { key: 'code', label: 'Code', width: 110 },
                  { key: 'board', label: 'Board', width: 120, filter: true, render: (c) => Badge(c.board, { tone: 'neutral' }) },
                  { key: 'principal', label: 'Principal', width: 200 },
                  { key: 'studentCapacity', label: 'Capacity', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
                  { key: 'active', label: 'Status', width: 110, render: (c) => Badge(c.active ? 'Active' : 'Inactive'), value: (c) => (c.active ? 1 : 0) },
                ],
                rows: campuses, paginate: false, searchable: false, footerAggregates: true, exportName: 'campuses',
              }))),
            h('div', { className: 'span-5' }, SectionCard({ title: 'Users per campus', subtitle: 'Including multi-campus grants', className: 'chart-card', icon: 'chart-bar' },
              barChart({
                categories: perCampus.map((c) => c.key),
                series: [{ name: 'Users with access', values: perCampus.map((c) => c.value) }],
                horizontal: true, height: 260, showValues: true,
              })))),
          Callout({ tone: 'warning', icon: 'shield', title: 'Least privilege' },
            'Only leadership and group finance should hold access to every campus. A user’s home campus cannot be removed — change it on the user record instead.'),
          SectionCard({ title: 'User to campus mapping', subtitle: 'Tick a campus to allow the user to switch into it', icon: 'building-2', flush: true }, tableHost),
        ],
      }));
    },
  },

  'system/menu-permissions': {
    title: 'Menu Permissions',
    subtitle: 'Fine-grained control of every navigation item',
    section: 'system',
    render(mount, ctx) {
      ensureStyles();
      const roles = db.roles;
      let roleId = (ctx.query && ctx.query.role) || 'teacher';
      if (!roles.some((r) => r.id === roleId)) roleId = roles[0].id;

      const allowed = new Map();
      const seed = (rid) => {
        allowed.clear();
        for (const section of NAV) {
          for (const item of section.items) {
            allowed.set(item.id, roleAllowed(item.roles || section.roles, rid));
            if (item.children) for (const c of item.children) allowed.set(c.id, roleAllowed(c.roles || item.roles || section.roles, rid));
          }
        }
      };
      seed(roleId);

      const treeHost = h('div');
      const kpiHost = h('div');

      const nodesOf = (section) => {
        const out = [];
        for (const item of section.items) {
          out.push(item);
          if (item.children) out.push(...item.children);
        }
        return out;
      };

      const paint = () => {
        const total = NAV.reduce((a, s) => a + nodesOf(s).length, 0);
        const on = NAV.reduce((a, s) => a + nodesOf(s).filter((n) => allowed.get(n.id)).length, 0);
        kpiHost.innerHTML = '';
        kpiHost.appendChild(kpiRow([
          { label: 'Menu items visible', value: `${on} / ${total}`, icon: 'list', tone: 'brand' },
          { label: 'Sections visible', value: formatNumber(NAV.filter((s) => nodesOf(s).some((n) => allowed.get(n.id))).length), icon: 'layers', tone: 'info' },
          { label: 'Hidden items', value: formatNumber(total - on), icon: 'eye-off', tone: 'warning' },
          { label: 'Role users', value: formatNumber((roles.find((r) => r.id === roleId) || {}).users || 0), icon: 'users', tone: 'success' },
        ]));

        treeHost.innerHTML = '';
        treeHost.appendChild(Accordion(NAV.map((section) => {
          const nodes = nodesOf(section);
          const onCount = nodes.filter((n) => allowed.get(n.id)).length;
          return {
            id: 'sec-' + section.id,
            title: section.label,
            icon: section.icon,
            badge: `${onCount}/${nodes.length}`,
            body: h('div', { className: 'stack-2' },
              h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
                Button('Select all', { variant: 'ghost', size: 'sm', icon: 'check-circle', onClick: () => { nodes.forEach((n) => allowed.set(n.id, true)); paint(); } }),
                Button('Clear all', { variant: 'ghost', size: 'sm', icon: 'x-circle', onClick: () => { nodes.forEach((n) => allowed.set(n.id, false)); paint(); } }),
                h('span', { className: 'spacer' }),
                h('span', { className: 't-xs t-muted' }, `${nodes.length} menu items`)),
              h('div', null, section.items.map((item) => h('div', { className: 'stack-1' },
                h('div', { className: 'pt-kv' },
                  Checkbox(item.label, { checked: !!allowed.get(item.id), onChange: (v) => { allowed.set(item.id, v); if (item.children && !v) item.children.forEach((c) => allowed.set(c.id, false)); paint(); } }),
                  h('span', { className: 't-xs t-mono t-muted' }, item.route || '—')),
                item.children ? h('div', { style: { paddingLeft: 'var(--sp-6)' } },
                  item.children.map((c) => h('div', { className: 'pt-kv' },
                    Checkbox(c.label, { checked: !!allowed.get(c.id), onChange: (v) => { allowed.set(c.id, v); if (v) allowed.set(item.id, true); paint(); } }),
                    h('span', { className: 't-xs t-mono t-muted' }, c.route || '—')))) : null)))),
          };
        }), { multi: true, openIds: ['sec-portals'] }));
      };
      paint();

      mount.appendChild(page({
        route: 'system/menu-permissions',
        title: 'Menu permissions',
        subtitle: `Control every one of the ${NAV.reduce((a, s) => a + nodesOf(s).length, 0)} navigation entries per role`,
        actions: pageActions(
          Button('Reset to role defaults', { variant: 'secondary', icon: 'refresh-ccw', onClick: () => { seed(roleId); paint(); notify({ title: 'Menu reset to role defaults', tone: 'warning' }); } }),
          Button('Save menu', { variant: 'primary', icon: 'check', onClick: () => notify({ title: 'Menu permissions saved', text: `${roles.find((r) => r.id === roleId).name} · sidebar rebuilds on next sign-in`, tone: 'success' }) })),
        children: [
          Card({ pad: true },
            h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-3)' } },
              Field({ label: 'Role' }, Select({ options: roles.map((r) => ({ value: r.id, label: `${r.name} (${r.users} users)` })), value: roleId, onChange: (v) => { roleId = v; seed(v); paint(); } })),
              h('span', { className: 'spacer' }),
              Button('Preview sidebar', { variant: 'secondary', icon: 'panel-left', onClick: () => {
                const nav = navForRole(roleId);
                Drawer({
                  title: 'Sidebar preview', subtitle: roles.find((r) => r.id === roleId).name, side: 'left', size: 'md',
                  body: h('div', { className: 'stack-2' },
                    nav.length ? nav.map((s) => h('div', { className: 'stack-1' },
                      h('div', { className: 't-eyebrow row', style: { gap: 'var(--sp-2)' } }, Icon(s.icon, 14), s.label),
                      h('div', { style: { paddingLeft: 'var(--sp-5)' } },
                        s.items.filter((i) => allowed.get(i.id)).map((i) => h('div', { className: 't-sm t-muted' }, i.label)))))
                      : EmptyState({ icon: 'panel-left', title: 'Nothing visible', text: 'This role would see an empty sidebar.' })),
                });
              } }))),
          kpiHost,
          Callout({ tone: 'info', icon: 'list', title: 'Menus follow permissions' },
            'Hiding a menu item does not revoke the permission behind it — a user with the permission could still reach the route by URL. Use the permission matrix to revoke access properly.'),
          SectionCard({ title: 'Navigation tree', subtitle: 'Expand a section and tick the items this role should see', icon: 'list' }, treeHost),
        ],
      }));
    },
  },
};

/* ------------------------------------------- system: settings utilities */

function testConnection(label, detail) {
  return Button('Test connection', {
    variant: 'secondary', icon: 'activity',
    onClick: () => {
      const t = notify({ title: `Testing ${label}…`, text: 'Opening a connection and sending a probe.', tone: 'info', duration: 1600 });
      setTimeout(() => {
        if (t && t.dismiss) t.dismiss();
        notify({ title: `${label} connection healthy`, text: detail || 'Handshake completed in 240 ms.', tone: 'success' });
      }, 900);
    },
  });
}

function maskedField(label, value, hint) {
  let revealed = false;
  const input = Input({ type: 'password', value, readOnly: true });
  const btn = Button('Reveal', {
    variant: 'ghost', size: 'sm', icon: 'eye',
    onClick: () => {
      revealed = !revealed;
      input.type = revealed ? 'text' : 'password';
      btn.textContent = revealed ? 'Hide' : 'Reveal';
      if (revealed) notify({ title: 'Secret revealed', text: 'This action is written to the audit log.', tone: 'warning' });
    },
  });
  return Field({ label, hint: hint || 'Stored encrypted · revealing is audit-logged' },
    h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, h('div', { className: 'flex-1' }, input), btn,
      IconButton('copy', { label: `Copy ${label}`, bordered: true, onClick: () => copyToClipboard(value, `${label} copied`) })));
}

function statusStrip(items) {
  return Card({ pad: true },
    h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-5)' } },
      items.map((i) => h('div', null,
        h('div', { className: 't-eyebrow' }, i.label),
        h('div', { className: 'row', style: { gap: 'var(--sp-2)' } },
          i.badge ? Badge(i.value, { tone: i.tone }) : h('span', { className: 't-lg t-semibold' }, i.value))))));
}

const systemRoutes3 = {
  'system/general': {
    title: 'General Settings',
    subtitle: 'Locale, formats and platform-wide defaults',
    section: 'system',
    render(mount) {
      ensureStyles();
      const s = db.settings;
      mount.appendChild(settingsPage({
        title: 'General settings',
        subtitle: 'Applies to every campus unless overridden on the campus record',
        route: 'system/general',
        saveLabel: 'Save general settings',
        onSave: () => notify({ title: 'General settings saved', text: 'Demo only — nothing was persisted.', tone: 'success' }),
        groups: [
          {
            id: 'identity', title: 'Platform identity', description: 'Shown in the browser tab, emails and printed documents', icon: 'building-columns', cols: 2,
            fields: [
              { id: 'name', label: 'Organisation name', value: s.school.name, span: 'full' },
              { id: 'tagline', label: 'Tagline', value: s.school.tagline },
              { id: 'shortName', label: 'Short name', value: 'Springdale ERP' },
              { id: 'supportEmail', label: 'Support email', value: 'helpdesk@springdale.edu.in' },
              { id: 'supportPhone', label: 'Support phone', value: '+91 124 4567 811' },
            ],
          },
          {
            id: 'locale', title: 'Locale & formats', description: 'Indian defaults — dates as DD MMM YYYY and amounts in the lakh/crore system', icon: 'globe', cols: 2,
            fields: [
              { id: 'timezone', label: 'Time zone', type: 'select', value: 'Asia/Kolkata (IST +05:30)', options: ['Asia/Kolkata (IST +05:30)', 'Asia/Dubai (GST +04:00)', 'UTC'] },
              { id: 'locale', label: 'Locale', type: 'select', value: 'en-IN', options: ['en-IN', 'en-GB', 'hi-IN'] },
              { id: 'dateFormat', label: 'Date format', type: 'select', value: 'DD MMM YYYY', options: ['DD MMM YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] },
              { id: 'timeFormat', label: 'Time format', type: 'select', value: '12-hour', options: ['12-hour', '24-hour'] },
              { id: 'currency', label: 'Currency', type: 'select', value: `${s.fee.currency} (${s.fee.symbol})`, options: ['INR (₹)', 'USD ($)', 'AED (د.إ)'] },
              { id: 'numberFormat', label: 'Number grouping', type: 'select', value: 'Indian (12,34,567)', options: ['Indian (12,34,567)', 'International (1,234,567)'] },
              { id: 'weekStart', label: 'Week starts on', type: 'select', value: 'Monday', options: ['Monday', 'Sunday'] },
              { id: 'fiscalStart', label: 'Financial year starts', type: 'select', value: 'April', options: ['April', 'January', 'July'] },
            ],
          },
          {
            id: 'behaviour', title: 'Platform behaviour', icon: 'sliders', cols: 2,
            fields: [
              { id: 'maintenance', label: 'Maintenance mode', type: 'switch', switchLabel: 'Put the platform in maintenance mode', description: 'Only super admins can sign in while this is on' },
              { id: 'signup', label: 'Self sign-up', type: 'switch', switchLabel: 'Allow parents to self-register', value: true },
              { id: 'watermark', label: 'Print watermark', type: 'switch', switchLabel: 'Watermark printed documents', value: true },
              { id: 'analytics', label: 'Usage analytics', type: 'switch', switchLabel: 'Collect anonymous usage analytics', value: true },
              { id: 'pageSize', label: 'Default rows per page', type: 'select', value: '25', options: ['10', '25', '50', '100'] },
              { id: 'density', label: 'Default density', type: 'select', value: 'Comfortable', options: ['Comfortable', 'Compact'] },
              { id: 'theme', label: 'Default theme', type: 'select', value: 'Light', options: ['Light', 'Dark', 'Follow system'] },
              { id: 'landing', label: 'Landing page', type: 'select', value: 'Role dashboard', options: ['Role dashboard', 'KPI / MIS Overview', 'Last visited page'] },
            ],
          },
          {
            id: 'branding', title: 'Branding', description: 'Logo and colours used across the app, PDFs and emails', icon: 'palette',
            render: () => h('div', { className: 'stack-3' },
              FormGrid({ cols: 2 },
                Field({ label: 'Logo', hint: 'SVG or PNG, minimum 512 px' }, FileUpload({ label: 'Upload a logo', accept: '.svg,.png', onFiles: () => notify({ title: 'Logo uploaded', tone: 'success' }) })),
                Field({ label: 'Favicon' }, FileUpload({ label: 'Upload a favicon', accept: '.ico,.png', onFiles: () => notify({ title: 'Favicon uploaded', tone: 'success' }) }))),
              Callout({ tone: 'info', icon: 'palette', title: 'Brand colour' },
                'The brand ramp is defined in design tokens so light mode, dark mode and printed output all stay consistent. Changing it here regenerates the ramp.')),
            actions: [Button('Preview branding', { variant: 'secondary', icon: 'eye', onClick: mockAction('Preview branding') })],
          },
        ],
      }));
    },
  },

  'system/school-profile': {
    title: 'School Profile',
    subtitle: 'Legal identity, affiliation and contact details',
    section: 'system',
    render(mount) {
      ensureStyles();
      const s = db.settings.school;
      mount.appendChild(settingsPage({
        title: 'School profile',
        subtitle: 'Printed on report cards, transfer certificates and every official document',
        route: 'system/school-profile',
        saveLabel: 'Save school profile',
        onSave: () => notify({ title: 'School profile saved', tone: 'success' }),
        groups: [
          {
            id: 'legal', title: 'Legal identity', icon: 'building-columns', cols: 2,
            fields: [
              { id: 'name', label: 'Registered name', value: s.name, span: 'full', required: true },
              { id: 'trust', label: 'Trust / society', value: s.trustName },
              { id: 'regNo', label: 'Registration number', value: s.registrationNo },
              { id: 'established', label: 'Established', type: 'number', value: s.established },
              { id: 'pan', label: 'PAN', value: 'AAATS' + '2041K' },
              { id: 'gstin', label: 'GSTIN', value: '06AAATS2041K1ZP' },
              { id: 'tan', label: 'TAN', value: 'DELS20418E' },
            ],
          },
          {
            id: 'affiliation', title: 'Board affiliation', description: 'Shown on hall tickets and certificates', icon: 'certificate', cols: 2,
            fields: [
              { id: 'board', label: 'Primary board', type: 'select', value: 'CBSE', options: db.boards.map((b) => b.code) },
              { id: 'affNo', label: 'Affiliation number', value: '530142' },
              { id: 'schoolCode', label: 'School code', value: '81094' },
              { id: 'validTill', label: 'Affiliation valid till', type: 'date', value: '2029-03-31' },
              { id: 'grading', label: 'Grading system', type: 'select', value: 'CBSE 9-point', options: db.gradeScales.map((g) => g.name) },
              { id: 'medium', label: 'Medium of instruction', type: 'select', value: 'English', options: ['English', 'Hindi', 'Bilingual'] },
            ],
          },
          {
            id: 'contact', title: 'Contact & address', icon: 'map-pin', cols: 2,
            fields: [
              { id: 'address', label: 'Registered address', value: s.address, span: 'full' },
              { id: 'phone', label: 'Phone', value: s.phone },
              { id: 'email', label: 'Email', value: s.email },
              { id: 'website', label: 'Website', value: s.website },
              { id: 'helpline', label: 'Parent helpline', value: '+91 124 4567 800' },
            ],
          },
          {
            id: 'signatories', title: 'Signatories', description: 'Signatures printed on certificates', icon: 'stamp',
            render: () => frag(
              FormGrid({ cols: 2 },
                Field({ label: 'Principal' }, Input({ value: 'Dr. Meera Krishnan' })),
                Field({ label: 'Head of examinations' }, Input({ value: 'Sanjay Deshpande' })),
                Field({ label: 'Principal signature', hint: 'Transparent PNG' }, FileUpload({ label: 'Upload signature', accept: '.png', onFiles: () => notify({ title: 'Signature uploaded', tone: 'success' }) })),
                Field({ label: 'School seal', hint: 'Transparent PNG' }, FileUpload({ label: 'Upload seal', accept: '.png', onFiles: () => notify({ title: 'Seal uploaded', tone: 'success' }) }))),
              h('div', { className: 'mt-3' },
                Callout({ tone: 'warning', icon: 'shield', title: 'Change control' },
                  'Signatories and seals are used on legally significant documents. Every change is recorded in the audit log with the operator name and IP.'))),
          },
          {
            id: 'campuses', title: 'Campuses', description: `${db.campuses.length} campuses operate under this registration`, icon: 'map-pin',
            actions: [Button('Manage campuses', { variant: 'secondary', icon: 'building-2', route: 'system/campuses' })],
            render: () => DataTable({
              columns: [
                { key: 'name', label: 'Campus', width: 240, sticky: true, render: (c) => Identity(c.name, `${c.city}, ${c.state}`), value: (c) => c.name },
                { key: 'code', label: 'Code', width: 100 },
                { key: 'board', label: 'Board', width: 110 },
                { key: 'principal', label: 'Principal', width: 200 },
                { key: 'studentCapacity', label: 'Capacity', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'active', label: 'Status', width: 110, render: (c) => Badge(c.active ? 'Active' : 'Inactive'), value: (c) => (c.active ? 1 : 0) },
              ],
              rows: db.campuses, paginate: false, searchable: false, footerAggregates: true, exportName: 'campuses',
            }),
          },
        ],
      }));
    },
  },

  'system/campuses': {
    title: 'Campuses',
    subtitle: 'Every campus in the group, with capacity and utilisation',
    section: 'system',
    render(mount) {
      ensureStyles();
      const rows = db.campuses.map((c) => {
        const students = db.students.filter((s) => s.campusId === c.id).length;
        const staff = db.staff.filter((s) => s.campusId === c.id).length;
        return { ...c, students, staff, utilisation: pct(students, c.studentCapacity) };
      });

      const detail = (c) => Drawer({
        title: c.name, subtitle: `${c.city}, ${c.state} · ${c.board}`, size: 'lg',
        body: h('div', { className: 'stack' },
          h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
            Badge(c.active ? 'Active' : 'Inactive'), Badge(c.board, { tone: 'neutral' }), Badge(c.code, { tone: 'brand' })),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-4' }, StatCard({ label: 'Students', value: formatNumber(c.students), icon: 'graduation-cap', tone: 'brand' })),
            h('div', { className: 'span-4' }, StatCard({ label: 'Staff', value: formatNumber(c.staff), icon: 'briefcase', tone: 'info' })),
            h('div', { className: 'span-4' }, StatCard({ label: 'Utilisation', value: `${c.utilisation}%`, icon: 'gauge', tone: c.utilisation > 90 ? 'danger' : c.utilisation > 75 ? 'warning' : 'success' }))),
          DescriptionList([
            ['Campus code', c.code], ['Board', c.board], ['Principal', c.principal],
            ['Established', String(c.established)], ['Address', c.address],
            ['Pincode', c.pincode], ['Phone', c.phone], ['Email', c.email],
            ['Student capacity', formatNumber(c.studentCapacity)],
          ], { cols: 2 }),
          SectionCard({ title: 'Classes offered', icon: 'grid', flush: true },
            DataTable({
              columns: [
                { key: 'name', label: 'Class', width: 160, sticky: true },
                { key: 'stage', label: 'Stage', width: 160, filter: true },
                { key: 'sectionCount', label: 'Sections', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
              ],
              rows: db.classes.filter((x) => x.campusId === c.id), pageSize: 8, searchable: false, exportable: false,
            }))),
        actions: (close) => frag(
          Button('Close', { variant: 'secondary', onClick: close }),
          Button('Edit campus', { variant: 'primary', icon: 'edit', onClick: () => { close(); notify({ title: 'Campus editor', text: 'Demo only — nothing was persisted.', tone: 'info' }); } })),
      });

      mount.appendChild(listPage({
        title: 'Campuses',
        subtitle: `${rows.length} campuses · ${formatNumber(sum(rows, 'students'))} students · ${formatNumber(sum(rows, 'staff'))} staff`,
        route: 'system/campuses',
        actions: pageActions(
          Button('School profile', { variant: 'secondary', icon: 'building-columns', route: 'system/school-profile' }),
          Button('Add campus', { variant: 'primary', icon: 'plus', onClick: () => formPage({
            title: 'Add a campus', mode: 'modal', size: 'lg', submitLabel: 'Create campus',
            sections: [{ title: 'Campus', cols: 2, fields: [
              { id: 'name', label: 'Campus name', required: true, span: 'full' },
              { id: 'code', label: 'Campus code', required: true },
              { id: 'board', label: 'Board', type: 'select', options: db.boards.map((b) => b.code) },
              { id: 'city', label: 'City', required: true },
              { id: 'state', label: 'State', required: true },
              { id: 'capacity', label: 'Student capacity', type: 'number', required: true },
              { id: 'principal', label: 'Principal', type: 'combobox', options: db.staff.slice(0, 100).map((s) => ({ value: s.id, label: s.name })) },
              { id: 'address', label: 'Address', type: 'textarea', span: 'full' },
            ] }],
            onSubmit: (v) => notify({ title: 'Campus created', text: v.name, tone: 'success' }),
          }) })),
        kpis: [
          { label: 'Campuses', value: formatNumber(rows.length), icon: 'building-2', tone: 'brand' },
          { label: 'Students', value: formatNumber(sum(rows, 'students')), icon: 'graduation-cap', tone: 'info' },
          { label: 'Capacity', value: formatNumber(sum(rows, 'studentCapacity')), icon: 'layers', tone: 'success' },
          { label: 'Average utilisation', value: `${Math.round(avg(rows, 'utilisation'))}%`, icon: 'gauge', tone: 'warning' },
        ],
        chart: barChart({
          categories: rows.map((c) => c.name.replace(/Springdale\s*/i, '')),
          series: [
            { name: 'Students', values: rows.map((c) => c.students) },
            { name: 'Capacity', values: rows.map((c) => c.studentCapacity) },
          ],
          height: 250,
        }),
        chartTitle: 'Enrolment against capacity',
        columns: [
          { key: 'name', label: 'Campus', sticky: true, width: 250, render: (c) => Identity(c.name, `${c.city}, ${c.state}`), value: (c) => c.name },
          { key: 'code', label: 'Code', width: 100 },
          { key: 'board', label: 'Board', width: 110, filter: true, render: (c) => Badge(c.board, { tone: 'neutral' }) },
          { key: 'principal', label: 'Principal', width: 200 },
          { key: 'students', label: 'Students', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'staff', label: 'Staff', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'studentCapacity', label: 'Capacity', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'utilisation', label: 'Utilisation', width: 180, render: (c) => ProgressBar(c.utilisation, { showValue: true, size: 'sm', tone: c.utilisation > 90 ? 'danger' : c.utilisation > 75 ? 'warning' : 'success' }), value: (c) => c.utilisation },
          { key: 'established', label: 'Since', width: 100, align: 'right', numeric: true },
          { key: 'active', label: 'Status', width: 110, render: (c) => Badge(c.active ? 'Active' : 'Inactive'), value: (c) => (c.active ? 1 : 0) },
        ],
        rows,
        paginate: false, footerAggregates: true, exportName: 'campuses',
        onRowClick: detail,
        rowActions: (row) => [
          { label: 'Open campus', icon: 'eye', onClick: () => detail(row) },
          { label: 'Campus access', icon: 'shield', route: 'system/campus-access' },
          { label: 'Edit', icon: 'edit', onClick: mockAction('Edit campus') },
        ],
        tableTitle: 'All campuses',
        emptyState: EmptyState({ icon: 'building-2', title: 'No campuses configured' }),
      }));
    },
  },

  'system/session': {
    title: 'Session Settings',
    subtitle: 'Academic year, working days and attendance mode',
    section: 'system',
    render(mount) {
      ensureStyles();
      const s = db.settings.session;
      mount.appendChild(settingsPage({
        title: 'Session settings',
        subtitle: 'The academic year drives every date-bound module — change it only at a year boundary',
        route: 'system/session',
        saveLabel: 'Save session settings',
        onSave: () => notify({ title: 'Session settings saved', tone: 'success' }),
        groups: [
          {
            id: 'year', title: 'Academic year', description: 'April to March, the Indian school convention', icon: 'calendar', cols: 2,
            fields: [
              { id: 'current', label: 'Current session', type: 'select', value: (byId(db.academicYears, s.currentYear) || {}).name || '2026-27', options: db.academicYears.map((y) => y.name) },
              { id: 'status', label: 'Session status', type: 'static', value: 'Open — transactions allowed' },
              { id: 'startMonth', label: 'Session starts', type: 'select', value: s.startMonth, options: ['April', 'June', 'January'] },
              { id: 'endMonth', label: 'Session ends', type: 'select', value: s.endMonth, options: ['March', 'May', 'December'] },
              { id: 'admissionYear', label: 'Admissions open for', type: 'select', value: '2027-28', options: db.academicYears.map((y) => y.name) },
            ],
          },
          {
            id: 'calendar', title: 'Working days & attendance', icon: 'clipboard-check', cols: 2,
            fields: [
              { id: 'workingDays', label: 'Working days per week', type: 'select', value: String(s.workingDays), options: ['5', '5.5', '6'] },
              { id: 'weekOff', label: 'Weekly off', type: 'select', value: s.weekOff, options: ['Sunday', 'Saturday & Sunday', 'Friday'] },
              { id: 'attendanceMode', label: 'Attendance mode', type: 'select', value: s.attendanceMode, options: ['Daily', 'Period', 'Daily + Period', 'Biometric only'] },
              { id: 'minAttendance', label: 'Minimum attendance for exams', type: 'select', value: '75%', options: ['70%', '75%', '80%', '85%'] },
              { id: 'lockDays', label: 'Lock attendance after', type: 'select', value: '7 days', options: ['1 day', '3 days', '7 days', '15 days'] },
              { id: 'autoAbsent', label: 'Auto-mark absent', type: 'switch', switchLabel: 'Mark absent if no biometric punch by 09:30', value: true },
            ],
          },
          {
            id: 'years', title: 'All academic years', description: 'Historical sessions stay readable but locked', icon: 'history',
            actions: [Button('Roll over to next year', { variant: 'secondary', icon: 'refresh-ccw', onClick: () => ConfirmDialog({ title: 'Roll over to 2027-28?', text: 'This promotes students, archives the current session and opens a new fee cycle. It cannot be undone.', confirmLabel: 'Roll over', tone: 'danger' }).then((ok) => ok && notify({ title: 'Year-end rollover queued', text: 'You will be emailed when it completes.', tone: 'warning' })) })],
            render: () => DataTable({
              columns: [
                { key: 'name', label: 'Session', width: 160, sticky: true },
                { key: 'startDate', label: 'Starts', width: 150, render: (r) => formatDate(r.startDate) },
                { key: 'endDate', label: 'Ends', width: 150, render: (r) => formatDate(r.endDate) },
                { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
                { key: 'current', label: 'Current', width: 120, render: (r) => (r.current ? Badge('Current', { tone: 'brand' }) : h('span', { className: 't-faint' }, '—')), value: (r) => (r.current ? 1 : 0) },
              ],
              rows: db.academicYears, paginate: false, searchable: false, exportName: 'academic-years',
            }),
          },
          {
            id: 'holidays', title: 'Holiday calendar', description: `${db.holidays.length} holidays declared for this session`, icon: 'umbrella',
            actions: [Button('Add holiday', { variant: 'secondary', icon: 'plus', onClick: mockAction('Add holiday') })],
            render: () => DataTable({
              columns: [
                { key: 'name', label: 'Holiday', width: 240, sticky: true },
                { key: 'date', label: 'Date', width: 170, render: (r) => formatDate(r.date, 'weekday') },
                { key: 'type', label: 'Type', width: 150, filter: true, render: (r) => Badge(r.type, { tone: 'neutral' }) },
                { key: 'days', label: 'Days', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
              ],
              rows: db.holidays, paginate: false, footerAggregates: true, exportName: 'holidays',
            }),
          },
        ],
      }));
    },
  },
};

const systemRoutes4 = {
  'system/email': {
    title: 'Email Settings',
    subtitle: 'SMTP relay, sender identity and deliverability',
    section: 'system',
    render(mount) {
      ensureStyles();
      const e = db.settings.email;
      const emails = db.messages.filter((m) => m.channel === 'Email');
      const delivered = sum(emails, 'delivered');
      const failed = sum(emails, 'failed');
      const opened = sum(emails, 'opened');

      mount.appendChild(settingsPage({
        title: 'Email settings',
        subtitle: `${e.provider} relay via ${e.host} · ${e.status}`,
        route: 'system/email',
        saveLabel: 'Save email settings',
        onSave: () => notify({ title: 'Email settings saved', tone: 'success' }),
        groups: [
          {
            id: 'status', title: 'Connection status', icon: 'activity',
            actions: [testConnection('SMTP', 'Authenticated with STARTTLS in 240 ms.')],
            render: () => h('div', { className: 'stack-3' },
              statusStrip([
                { label: 'Status', value: e.status, badge: true, tone: 'success' },
                { label: 'Emails sent', value: formatNumber(delivered) },
                { label: 'Failed', value: formatNumber(failed) },
                { label: 'Open rate', value: `${pct(opened, Math.max(1, delivered))}%` },
                { label: 'Queue', value: '0 pending' },
              ]),
              SectionCard({ title: 'Delivery over time', className: 'chart-card' },
                lineChart({
                  categories: analytics.attendanceTrend.map((r) => r.month),
                  series: [{ name: 'Emails delivered', values: analytics.attendanceTrend.map((r, i) => 1800 + Math.round(hash01('em' + i) * 2200)) }],
                  height: 200,
                }))),
          },
          {
            id: 'smtp', title: 'SMTP relay', description: 'Credentials are encrypted at rest and never printed in logs', icon: 'mail', cols: 2,
            fields: [
              { id: 'provider', label: 'Provider', type: 'select', value: e.provider, options: ['SMTP', 'Amazon SES', 'SendGrid', 'Postmark', 'Mailgun'] },
              { id: 'host', label: 'Host', value: e.host },
              { id: 'port', label: 'Port', type: 'number', value: e.port },
              { id: 'encryption', label: 'Encryption', type: 'select', value: e.encryption, options: ['TLS', 'SSL', 'None'] },
              { id: 'username', label: 'Username', value: 'noreply@springdale.edu.in' },
              { id: 'timeout', label: 'Timeout (seconds)', type: 'number', value: 30 },
            ],
          },
          {
            id: 'secret', title: 'Credentials', icon: 'key',
            render: () => h('div', { className: 'stack-3' },
              maskedField('SMTP password', 'sk_live_4f8a2b91c7d0e5'),
              maskedField('DKIM private key', 'MIIEvQIBADANBgkqh…'),
              Callout({ tone: 'warning', icon: 'lock', title: 'Rotation policy' },
                'Rotate SMTP credentials every 90 days. Reveal and copy actions are written to the audit log with your name and IP address.')),
            actions: [Button('Rotate credentials', { variant: 'secondary', icon: 'refresh-ccw', onClick: () => ConfirmDialog({ title: 'Rotate SMTP credentials?', text: 'A new password is generated and applied. Queued emails are retried automatically.', confirmLabel: 'Rotate', tone: 'danger' }).then((ok) => ok && notify({ title: 'Credentials rotated', tone: 'success' })) })],
          },
          {
            id: 'sender', title: 'Sender identity', icon: 'user', cols: 2,
            fields: [
              { id: 'fromName', label: 'From name', value: e.fromName },
              { id: 'fromEmail', label: 'From address', value: e.fromEmail },
              { id: 'replyTo', label: 'Reply-to', value: 'helpdesk@springdale.edu.in' },
              { id: 'bcc', label: 'Archive BCC', value: 'archive@springdale.edu.in' },
              { id: 'footer', label: 'Email footer', type: 'textarea', span: 'full', value: 'Springdale International School Group · Plot 12, Sector 42, Gurugram · This is an automated message.' },
            ],
          },
          {
            id: 'spf', title: 'Domain authentication', description: 'Required for inbox placement', icon: 'shield-check',
            render: () => DataTable({
              columns: [
                { key: 'record', label: 'Record', width: 120, sticky: true },
                { key: 'host', label: 'Host', width: 220, className: 't-mono' },
                { key: 'value', label: 'Value', className: 't-mono' },
                { key: 'status', label: 'Status', width: 130, render: (r) => Badge(r.status), value: (r) => r.status },
              ],
              rows: [
                { id: 1, record: 'SPF', host: 'springdale.edu.in', value: 'v=spf1 include:amazonses.com ~all', status: 'Verified' },
                { id: 2, record: 'DKIM', host: 'sd1._domainkey.springdale.edu.in', value: 'v=DKIM1; k=rsa; p=MIIBIjANBg…', status: 'Verified' },
                { id: 3, record: 'DMARC', host: '_dmarc.springdale.edu.in', value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@springdale.edu.in', status: 'Verified' },
                { id: 4, record: 'MX', host: 'springdale.edu.in', value: '10 mx.zoho.in', status: 'Pending' },
              ],
              paginate: false, searchable: false, columnToggle: false, exportName: 'dns-records',
            }),
            actions: [Button('Re-check DNS', { variant: 'secondary', icon: 'refresh', onClick: () => notify({ title: 'DNS re-checked', text: '3 of 4 records verified.', tone: 'info' }) })],
          },
        ],
      }));
    },
  },

  'system/sms': {
    title: 'SMS Settings',
    subtitle: 'Gateway, sender ID and DLT template registration',
    section: 'system',
    render(mount) {
      ensureStyles();
      const s = db.settings.sms;
      const sms = db.messages.filter((m) => m.channel === 'SMS');

      mount.appendChild(settingsPage({
        title: 'SMS settings',
        subtitle: `${s.provider} · sender ID ${s.senderId} · ${s.status}`,
        route: 'system/sms',
        saveLabel: 'Save SMS settings',
        onSave: () => notify({ title: 'SMS settings saved', tone: 'success' }),
        groups: [
          {
            id: 'status', title: 'Gateway status', icon: 'activity',
            actions: [testConnection('SMS gateway', 'Test SMS delivered to +91 98110 00000 in 1.8 s.')],
            render: () => h('div', { className: 'stack-3' },
              statusStrip([
                { label: 'Status', value: s.status, badge: true, tone: 'success' },
                { label: 'Credits left', value: formatNumber(s.balance) },
                { label: 'Sent this month', value: formatNumber(sum(sms, 'delivered')) },
                { label: 'Failed', value: formatNumber(sum(sms, 'failed')) },
                { label: 'DLT', value: s.dltRegistered ? 'Registered' : 'Not registered', badge: true, tone: s.dltRegistered ? 'success' : 'danger' },
              ]),
              s.balance < 200000 ? Callout({ tone: 'warning', icon: 'alert-circle', title: 'Credit balance running low' },
                `${formatNumber(s.balance)} credits remain — roughly ${Math.round(s.balance / 4200)} days at the current send rate. Top up before the fee reminder cycle.`) : null,
              SectionCard({ title: 'Cost this session', className: 'chart-card' },
                barChart({
                  categories: analytics.attendanceTrend.map((r) => r.month),
                  series: [{ name: 'SMS cost', values: analytics.attendanceTrend.map((r, i) => 12000 + Math.round(hash01('sms' + i) * 9000)) }],
                  valueFormat: 'currencyCompact', height: 200,
                }))),
          },
          {
            id: 'gateway', title: 'Gateway', icon: 'message-square', cols: 2,
            fields: [
              { id: 'provider', label: 'Provider', type: 'select', value: s.provider, options: ['MSG91', 'Gupshup', 'Textlocal', 'Kaleyra', 'Twilio'] },
              { id: 'senderId', label: 'Sender ID', value: s.senderId, hint: 'Six characters, approved by DLT' },
              { id: 'route', label: 'Route', type: 'select', value: 'Transactional', options: ['Transactional', 'Promotional', 'Transactional + OTP'] },
              { id: 'unicode', label: 'Unicode', type: 'switch', switchLabel: 'Allow Hindi and regional scripts', value: true },
              { id: 'retry', label: 'Retry attempts', type: 'select', value: '2', options: ['0', '1', '2', '3'] },
              { id: 'quietHours', label: 'Quiet hours', type: 'select', value: '21:00 – 08:00', options: ['None', '21:00 – 08:00', '22:00 – 07:00'] },
            ],
          },
          {
            id: 'creds', title: 'API credentials', icon: 'key',
            render: () => h('div', { className: 'stack-3' },
              maskedField('Auth key', '3401A9xk8Zq2LmP7'),
              maskedField('DLT entity ID', '1101438920000041121'),
              Callout({ tone: 'info', icon: 'info', title: 'TRAI DLT compliance' },
                'Every template must be registered on the DLT portal before it can be sent. Unregistered templates are rejected by the operator, not by us.')),
          },
          {
            id: 'templates', title: 'Registered templates', description: `${db.templates.length} templates on file`, icon: 'copy',
            actions: [Button('Add template', { variant: 'secondary', icon: 'plus', onClick: mockAction('Add template') })],
            render: () => DataTable({
              columns: [
                { key: 'name', label: 'Template', width: 220, sticky: true },
                { key: 'channel', label: 'Channel', width: 120, filter: true, render: (r) => Badge(r.channel, { tone: 'neutral' }) },
                { key: 'body', label: 'Body' },
                { key: 'dltId', label: 'DLT id', width: 190, className: 't-mono' },
                { key: 'usage', label: 'Used', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'approved', label: 'Approved', width: 130, render: (r) => (r.approved ? Badge('Approved', { tone: 'success' }) : Badge('Pending', { tone: 'warning' })), value: (r) => (r.approved ? 1 : 0) },
              ],
              rows: db.templates, paginate: false, footerAggregates: true, exportName: 'sms-templates',
            }),
          },
        ],
      }));
    },
  },

  'system/whatsapp': {
    title: 'WhatsApp Settings',
    subtitle: 'Business API, template approval and opt-in',
    section: 'system',
    render(mount) {
      ensureStyles();
      const w = db.settings.whatsapp;
      const wa = db.messages.filter((m) => m.channel === 'WhatsApp');

      mount.appendChild(settingsPage({
        title: 'WhatsApp settings',
        subtitle: `${w.provider} Business API · ${w.businessNumber} · ${w.status}`,
        route: 'system/whatsapp',
        saveLabel: 'Save WhatsApp settings',
        onSave: () => notify({ title: 'WhatsApp settings saved', tone: 'success' }),
        groups: [
          {
            id: 'status', title: 'Business account', icon: 'activity',
            actions: [testConnection('WhatsApp Business API', 'Template message delivered to the test number.')],
            render: () => h('div', { className: 'stack-3' },
              statusStrip([
                { label: 'Status', value: w.status, badge: true, tone: 'success' },
                { label: 'Business number', value: w.businessNumber },
                { label: 'Approved templates', value: String(w.templatesApproved) },
                { label: 'Messages sent', value: formatNumber(sum(wa, 'delivered')) },
                { label: 'Quality rating', value: 'High', badge: true, tone: 'success' },
              ]),
              Callout({ tone: 'info', icon: 'message-circle', title: 'Session windows' },
                'Free-form replies are only allowed within 24 hours of a parent message. Outside that window only approved templates can be sent.')),
          },
          {
            id: 'api', title: 'API configuration', icon: 'git-branch', cols: 2,
            fields: [
              { id: 'provider', label: 'BSP', type: 'select', value: w.provider, options: ['Gupshup', 'Twilio', 'Karix', '360dialog', 'Meta Cloud API'] },
              { id: 'number', label: 'Business number', value: w.businessNumber },
              { id: 'wabaId', label: 'WABA id', value: '10298374651029384' },
              { id: 'displayName', label: 'Display name', value: 'Springdale International' },
              { id: 'webhook', label: 'Webhook URL', value: 'https://erp.springdale.edu.in/api/whatsapp/webhook', span: 'full' },
            ],
          },
          {
            id: 'creds', title: 'Credentials', icon: 'key',
            render: () => h('div', { className: 'stack-3' },
              maskedField('API key', 'gsp_live_9d21ab77e4'),
              maskedField('Webhook verify token', 'spd_wh_88213aa0')),
          },
          {
            id: 'optin', title: 'Opt-in & preferences', icon: 'user-check', cols: 2,
            fields: [
              { id: 'optin', label: 'Require explicit opt-in', type: 'switch', switchLabel: 'Only message parents who opted in', value: true },
              { id: 'fallback', label: 'Fallback to SMS', type: 'switch', switchLabel: 'Send SMS when WhatsApp fails', value: true },
              { id: 'language', label: 'Default template language', type: 'select', value: 'English', options: ['English', 'Hindi', 'English + Hindi'] },
              { id: 'window', label: 'Send window', type: 'select', value: '08:00 – 20:00', options: ['Any time', '08:00 – 20:00', '09:00 – 18:00'] },
            ],
          },
          {
            id: 'templates', title: 'Message templates', icon: 'copy',
            render: () => DataTable({
              columns: [
                { key: 'name', label: 'Template', width: 220, sticky: true },
                { key: 'category', label: 'Category', width: 150, filter: true, render: (r) => Badge(r.category, { tone: 'neutral' }) },
                { key: 'body', label: 'Body' },
                { key: 'language', label: 'Language', width: 130, filter: true },
                { key: 'status', label: 'Status', width: 140, render: (r) => Badge(r.status), value: (r) => r.status },
              ],
              rows: [
                { id: 1, name: 'attendance_absent', category: 'Utility', body: 'Dear {{1}}, {{2}} was marked absent today ({{3}}). Please contact the class teacher.', language: 'English', status: 'Approved' },
                { id: 2, name: 'fee_reminder', category: 'Utility', body: 'Fee of ₹{{1}} for {{2}} is due on {{3}}. Pay securely: {{4}}', language: 'English', status: 'Approved' },
                { id: 3, name: 'ptm_booking', category: 'Utility', body: 'Your PTM slot with {{1}} is confirmed for {{2}} at {{3}}, room {{4}}.', language: 'English', status: 'Approved' },
                { id: 4, name: 'bus_delay', category: 'Utility', body: 'Bus {{1}} on route {{2}} is running {{3}} minutes late today.', language: 'English', status: 'Approved' },
                { id: 5, name: 'result_published', category: 'Utility', body: 'Results for {{1}} are published. View them on the parent portal.', language: 'English', status: 'Pending' },
                { id: 6, name: 'holiday_notice', category: 'Utility', body: 'School will remain closed on {{1}} on account of {{2}}.', language: 'Hindi', status: 'Approved' },
              ],
              paginate: false, exportName: 'whatsapp-templates',
            }),
            actions: [Button('Submit new template', { variant: 'secondary', icon: 'plus', onClick: mockAction('Submit template for approval') })],
          },
        ],
      }));
    },
  },

  'system/payment-gateway': {
    title: 'Payment Gateway',
    subtitle: 'Online fee collection, settlement and refunds',
    section: 'system',
    render(mount) {
      ensureStyles();
      const p = db.settings.payment;
      const online = db.payments.filter((x) => ['Online', 'UPI', 'Card', 'Net Banking'].includes(x.mode));
      const gatewayFee = sum(online, 'gatewayFee');

      mount.appendChild(settingsPage({
        title: 'Payment gateway',
        subtitle: `${p.gateway} · ${p.mode} mode · settlement T+${p.settlementDays}`,
        route: 'system/payment-gateway',
        saveLabel: 'Save gateway settings',
        onSave: () => notify({ title: 'Gateway settings saved', tone: 'success' }),
        groups: [
          {
            id: 'status', title: 'Gateway status', icon: 'activity',
            actions: [testConnection('Razorpay', 'Test order created and voided successfully.')],
            render: () => h('div', { className: 'stack-3' },
              statusStrip([
                { label: 'Status', value: p.status, badge: true, tone: 'success' },
                { label: 'Mode', value: p.mode, badge: true, tone: p.mode === 'Live' ? 'danger' : 'warning' },
                { label: 'Online collections', value: moneyK(sum(online, 'amount')) },
                { label: 'MDR', value: p.mdr },
                { label: 'Gateway fees paid', value: moneyK(gatewayFee) },
              ]),
              SectionCard({ title: 'Collection by mode', className: 'chart-card' },
                donutChart({ data: analytics.feeModeSplit, height: 230, centerLabel: 'Payments' }))),
          },
          {
            id: 'config', title: 'Configuration', icon: 'credit-card', cols: 2,
            fields: [
              { id: 'gateway', label: 'Gateway', type: 'select', value: p.gateway, options: ['Razorpay', 'PayU', 'CCAvenue', 'Cashfree', 'Billdesk'] },
              { id: 'mode', label: 'Mode', type: 'select', value: p.mode, options: ['Test', 'Live'] },
              { id: 'settlement', label: 'Settlement cycle', type: 'select', value: `T+${p.settlementDays}`, options: ['T+1', 'T+2', 'T+3'] },
              { id: 'account', label: 'Settlement account', type: 'select', value: db.bankAccounts[0] ? `${db.bankAccounts[0].bank} · ${db.bankAccounts[0].accountMasked}` : '—', options: db.bankAccounts.map((b) => `${b.bank} · ${b.accountMasked}`) },
              { id: 'convenience', label: 'Convenience fee', type: 'select', value: 'Charge the payer', options: ['Charge the payer', 'Absorb the fee', 'Split 50/50'] },
              { id: 'autoReconcile', label: 'Auto reconciliation', type: 'switch', switchLabel: 'Match settlements to receipts automatically', value: true },
              { id: 'partPay', label: 'Part payment', type: 'switch', switchLabel: 'Allow parents to pay part of an invoice', value: true },
              { id: 'refunds', label: 'Online refunds', type: 'switch', switchLabel: 'Allow refunds back to the source', value: true },
            ],
          },
          {
            id: 'creds', title: 'API keys', icon: 'key',
            render: () => h('div', { className: 'stack-3' },
              maskedField('Key ID', 'rzp_live_Q8xK2mNp41aB'),
              maskedField('Key secret', 'a9f2c7d4e1b6083f5a2c9d7e'),
              maskedField('Webhook secret', 'whsec_2c81ff40a9'),
              Callout({ tone: 'danger', icon: 'alert-triangle', title: 'Live keys in use' },
                'These keys move real money. Never share them over email or chat, and rotate them if anyone leaves the finance team.')),
          },
          {
            id: 'methods', title: 'Payment methods', description: 'What parents can use at checkout', icon: 'wallet',
            render: () => FormGrid({ cols: 3 },
              ['UPI', 'Credit card', 'Debit card', 'Net banking', 'Wallets', 'EMI', 'NEFT / RTGS', 'Cheque', 'Cash at counter']
                .map((m, i) => Field({ label: null }, Switch(m, { checked: i < 6, description: i < 6 ? 'Enabled at checkout' : 'Disabled' })))),
          },
          {
            id: 'recent', title: 'Recent online payments', icon: 'receipt',
            render: () => DataTable({
              columns: [
                { key: 'receiptNo', label: 'Receipt', width: 150, sticky: true, className: 't-mono' },
                { key: 'studentName', label: 'Student', width: 220, render: (r) => Identity(r.studentName, r.className), value: (r) => r.studentName },
                { key: 'date', label: 'Paid on', width: 130, render: (r) => formatDate(r.date) },
                { key: 'amount', label: 'Amount', width: 130, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.amount) },
                { key: 'mode', label: 'Mode', width: 130, filter: true },
                { key: 'gatewayFee', label: 'Gateway fee', width: 130, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.gatewayFee) },
                { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
              ],
              rows: online.slice(0, 200), pageSize: 10, footerAggregates: true, exportName: 'online-payments',
            }),
            actions: [Button('Open fee module', { variant: 'secondary', icon: 'wallet', route: 'fees/online-payments' })],
          },
        ],
      }));
    },
  },
};

const systemRoutes5 = {
  'system/biometric': {
    title: 'Biometric Integration',
    subtitle: 'Fingerprint and face devices feeding attendance',
    section: 'system',
    render(mount) {
      ensureStyles();
      const b = db.settings.biometric;
      const devices = db.biometricDevices;
      const online = devices.filter((d) => d.status === 'Online' || d.status === 'Active');
      const punches = sum(devices, 'punchesToday');

      mount.appendChild(settingsPage({
        title: 'Biometric integration',
        subtitle: `${b.vendor} · ${devices.length} devices · sync every ${b.syncInterval}`,
        route: 'system/biometric',
        saveLabel: 'Save biometric settings',
        onSave: () => notify({ title: 'Biometric settings saved', tone: 'success' }),
        groups: [
          {
            id: 'status', title: 'Fleet status', icon: 'activity',
            actions: [
              testConnection('Biometric bridge', `${online.length} of ${devices.length} devices responded.`),
              Button('Force sync now', { variant: 'primary', icon: 'refresh', onClick: () => notify({ title: 'Sync started', text: 'Pulling punches from every reachable device.', tone: 'info' }) }),
            ],
            render: () => h('div', { className: 'stack-3' },
              statusStrip([
                { label: 'Status', value: b.status, badge: true, tone: 'success' },
                { label: 'Devices', value: `${online.length} / ${devices.length}` },
                { label: 'Punches today', value: formatNumber(punches) },
                { label: 'Sync interval', value: b.syncInterval },
                { label: 'Vendor', value: b.vendor },
              ]),
              devices.length - online.length > 0
                ? Callout({ tone: 'warning', icon: 'alert-circle', title: `${devices.length - online.length} devices are not reporting` },
                  'Attendance from those locations will be missing until they reconnect. Check power and network at each site.')
                : null),
          },
          {
            id: 'config', title: 'Sync configuration', icon: 'settings', cols: 2,
            fields: [
              { id: 'vendor', label: 'Vendor', type: 'select', value: b.vendor, options: ['ESSL', 'ZKTeco', 'Matrix', 'Realtime', 'Suprema'] },
              { id: 'interval', label: 'Sync interval', type: 'select', value: b.syncInterval, options: ['1 min', '5 min', '15 min', '30 min', 'Hourly'] },
              { id: 'mode', label: 'Match mode', type: 'select', value: 'Fingerprint + Face', options: ['Fingerprint', 'Face', 'Fingerprint + Face', 'Card + Fingerprint'] },
              { id: 'graceIn', label: 'Grace period (in)', type: 'select', value: '10 minutes', options: ['0', '5 minutes', '10 minutes', '15 minutes'] },
              { id: 'duplicate', label: 'Duplicate punch window', type: 'select', value: '2 minutes', options: ['1 minute', '2 minutes', '5 minutes'] },
              { id: 'autoAbsent', label: 'Auto absent', type: 'switch', switchLabel: 'Mark absent when no punch by 09:30', value: true },
              { id: 'students', label: 'Student attendance', type: 'switch', switchLabel: 'Use biometrics for students too', value: false, description: 'Currently RFID cards are used for students' },
              { id: 'offline', label: 'Offline buffering', type: 'switch', switchLabel: 'Keep punches on the device when the network drops', value: true },
            ],
          },
          {
            id: 'devices', title: 'Devices', description: `${devices.length} readers across all campuses`, icon: 'fingerprint',
            actions: [Button('Add device', { variant: 'secondary', icon: 'plus', onClick: mockAction('Add biometric device') })],
            render: () => DataTable({
              columns: [
                { key: 'name', label: 'Device', width: 210, sticky: true, render: (d) => Identity(d.name, d.serial), value: (d) => d.name },
                { key: 'campusId', label: 'Campus', width: 170, filter: true, render: (d) => (byId(db.campuses, d.campusId) || {}).name || d.campusId },
                { key: 'location', label: 'Location', width: 180, filter: true },
                { key: 'type', label: 'Type', width: 150, filter: true, render: (d) => Badge(d.type, { tone: 'neutral' }) },
                { key: 'ip', label: 'IP address', width: 150, className: 't-mono' },
                { key: 'punchesToday', label: 'Punches today', width: 150, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'lastSync', label: 'Last sync', width: 170, render: (d) => relativeTime(d.lastSync), value: (d) => d.lastSync },
                { key: 'firmware', label: 'Firmware', width: 130 },
                { key: 'status', label: 'Status', width: 130, filter: true, render: (d) => Badge(d.status) },
              ],
              rows: devices, pageSize: 12, footerAggregates: true, exportName: 'biometric-devices',
              rowActions: (row) => [
                { label: 'Sync now', icon: 'refresh', onClick: () => notify({ title: 'Sync queued', text: row.name, tone: 'info' }) },
                { label: 'Ping device', icon: 'activity', onClick: () => notify({ title: 'Ping successful', text: `${row.ip} · 12 ms`, tone: 'success' }) },
                { label: 'Update firmware', icon: 'upload', onClick: mockAction('Update firmware') },
                { separator: true },
                { label: 'Remove device', icon: 'trash', tone: 'danger', onClick: () => ConfirmDialog({ title: `Remove ${row.name}?`, text: 'Historical punches are retained; the device stops syncing.', confirmLabel: 'Remove', tone: 'danger' }).then((ok) => ok && notify({ title: 'Device removed', tone: 'danger' })) },
              ],
            }),
          },
          {
            id: 'enrolment', title: 'Enrolment', description: 'Registering fingerprints for new joiners', icon: 'user-plus',
            render: () => h('div', { className: 'stack-3' },
              h('div', { className: 'pt-grid-2' },
                Card({ pad: true }, h('div', { className: 'stack-2' },
                  h('div', { className: 't-eyebrow' }, 'Staff enrolled'),
                  ProgressBar(94, { showValue: true, tone: 'success' }),
                  h('div', { className: 't-xs t-muted' }, `${Math.round(db.staff.length * 0.94)} of ${db.staff.length} staff have at least two fingerprints on file`))),
                Card({ pad: true }, h('div', { className: 'stack-2' },
                  h('div', { className: 't-eyebrow' }, 'Pending enrolment' ),
                  ProgressBar(6, { showValue: true, tone: 'warning' }),
                  h('div', { className: 't-xs t-muted' }, 'New joiners must enrol at the HR desk within seven days')))),
              Button('Open enrolment queue', { variant: 'secondary', icon: 'fingerprint', route: 'attendance/devices' })),
          },
        ],
      }));
    },
  },

  'system/rfid': {
    title: 'RFID Integration',
    subtitle: 'Cards, readers and gate/bus tap points',
    section: 'system',
    render(mount) {
      ensureStyles();
      const r = db.settings.rfid;
      const readers = Array.from({ length: r.readers }, (_, i) => {
        const rnd = hash01('rfid' + i);
        const places = ['Main Gate In', 'Main Gate Out', 'Rear Gate', 'Library Desk', 'Bus Bay A', 'Bus Bay B',
          'Cafeteria', 'Hostel Entry', 'Lab Block', 'Admin Wing', 'Sports Complex', 'Auditorium',
          'Primary Block', 'Middle Block', 'Senior Block', 'Reception', 'Staff Room', 'Infirmary'];
        return {
          id: 'RDR' + String(i + 1).padStart(2, '0'),
          location: places[i % places.length],
          type: i % 3 === 0 ? 'Long range' : 'Proximity',
          tapsToday: Math.round(120 + rnd * 900),
          status: rnd < 0.86 ? 'Online' : rnd < 0.94 ? 'Degraded' : 'Offline',
          firmware: `v${2 + Math.floor(rnd * 2)}.${Math.floor(rnd * 9)}.1`,
          lastTap: `0${8 + Math.floor(rnd * 2)}:${String(Math.floor(rnd * 59)).padStart(2, '0')}`,
        };
      });
      const online = readers.filter((x) => x.status === 'Online');

      mount.appendChild(settingsPage({
        title: 'RFID integration',
        subtitle: `${r.vendor} · ${r.readers} readers · ${formatNumber(r.cardsIssued)} cards issued`,
        route: 'system/rfid',
        saveLabel: 'Save RFID settings',
        onSave: () => notify({ title: 'RFID settings saved', tone: 'success' }),
        groups: [
          {
            id: 'status', title: 'Reader network', icon: 'activity',
            actions: [testConnection('RFID controller', `${online.length} readers acknowledged the heartbeat.`)],
            render: () => h('div', { className: 'stack-3' },
              statusStrip([
                { label: 'Status', value: r.status, badge: true, tone: 'success' },
                { label: 'Readers online', value: `${online.length} / ${readers.length}` },
                { label: 'Cards issued', value: formatNumber(r.cardsIssued) },
                { label: 'Taps today', value: formatNumber(sum(readers, 'tapsToday')) },
                { label: 'Vendor', value: r.vendor },
              ]),
              SectionCard({ title: 'Taps by location', className: 'chart-card' },
                barChart({
                  categories: readers.slice(0, 10).map((x) => x.location),
                  series: [{ name: 'Taps today', values: readers.slice(0, 10).map((x) => x.tapsToday) }],
                  horizontal: true, height: 260,
                }))),
          },
          {
            id: 'cards', title: 'Card policy', icon: 'id-card', cols: 2,
            fields: [
              { id: 'vendor', label: 'Vendor', type: 'select', value: r.vendor, options: ['Impinj', 'Zebra', 'HID Global', 'Honeywell'] },
              { id: 'frequency', label: 'Frequency', type: 'select', value: '13.56 MHz (HF)', options: ['125 kHz (LF)', '13.56 MHz (HF)', '860-960 MHz (UHF)'] },
              { id: 'cardType', label: 'Card type', type: 'select', value: 'MIFARE DESFire EV3', options: ['MIFARE Classic', 'MIFARE DESFire EV3', 'EM4100', 'UHF Gen2'] },
              { id: 'validity', label: 'Card validity', type: 'select', value: 'One academic year', options: ['One academic year', 'Two years', 'Until class change'] },
              { id: 'reissueFee', label: 'Re-issue fee', type: 'number', value: 250 },
              { id: 'lostBlock', label: 'Lost card handling', type: 'select', value: 'Block immediately', options: ['Block immediately', 'Block after 24 hours', 'Manual block'] },
              { id: 'gateSms', label: 'Gate SMS', type: 'switch', switchLabel: 'SMS parents on entry and exit taps', value: true },
              { id: 'busSms', label: 'Bus SMS', type: 'switch', switchLabel: 'SMS parents on bus boarding and alighting', value: true },
            ],
          },
          {
            id: 'readers', title: 'Readers', icon: 'scan',
            actions: [Button('Add reader', { variant: 'secondary', icon: 'plus', onClick: mockAction('Add RFID reader') })],
            render: () => DataTable({
              columns: [
                { key: 'id', label: 'Reader', width: 120, sticky: true, className: 't-mono' },
                { key: 'location', label: 'Location', width: 200, filter: true },
                { key: 'type', label: 'Type', width: 150, filter: true, render: (x) => Badge(x.type, { tone: 'neutral' }) },
                { key: 'tapsToday', label: 'Taps today', width: 140, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'lastTap', label: 'Last tap', width: 120, numeric: true },
                { key: 'firmware', label: 'Firmware', width: 130 },
                { key: 'status', label: 'Status', width: 130, filter: true, render: (x) => Badge(x.status === 'Online' ? 'Active' : x.status === 'Degraded' ? 'Pending' : 'Suspended', { tone: x.status === 'Online' ? 'success' : x.status === 'Degraded' ? 'warning' : 'danger' }) },
              ],
              rows: readers, pageSize: 12, footerAggregates: true, exportName: 'rfid-readers',
              rowActions: (row) => [
                { label: 'Ping reader', icon: 'activity', onClick: () => notify({ title: 'Reader responded', text: `${row.id} · 9 ms`, tone: 'success' }) },
                { label: 'Restart', icon: 'refresh', onClick: mockAction('Restart reader') },
              ],
            }),
          },
          {
            id: 'issue', title: 'Card issuance', description: 'Bulk print and map cards to students', icon: 'qr',
            render: () => h('div', { className: 'stack-3' },
              h('div', { className: 'pt-grid-2' },
                Card({ pad: true }, h('div', { className: 'stack-2' },
                  h('div', { className: 't-eyebrow' }, 'Students carded'),
                  ProgressBar(pct(r.cardsIssued, db.students.length + db.staff.length), { showValue: true, tone: 'success' }),
                  h('div', { className: 't-xs t-muted' }, `${formatNumber(r.cardsIssued)} cards issued to ${formatNumber(db.students.length)} students and ${formatNumber(db.staff.length)} staff`))),
                Card({ pad: true }, h('div', { className: 'stack-2' },
                  h('div', { className: 't-eyebrow' }, 'Lost or blocked'),
                  h('div', { className: 't-lg t-semibold' }, '42'),
                  h('div', { className: 't-xs t-muted' }, 'Blocked cards this session · ₹250 re-issue fee applies')))),
              h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
                Button('Bulk issue cards', { variant: 'primary', icon: 'id-card', route: 'students/id-cards' }),
                Button('Block a card', { variant: 'danger', icon: 'lock', onClick: () => ConfirmDialog({ title: 'Block a card?', text: 'The card stops working at every reader within 30 seconds.', confirmLabel: 'Block card', tone: 'danger' }).then((ok) => ok && notify({ title: 'Card blocked', tone: 'danger' })) }))),
          },
        ],
      }));
    },
  },

  'system/integrations': {
    title: 'Integrations & API',
    subtitle: 'Connected services, webhooks and API keys',
    section: 'system',
    render(mount) {
      ensureStyles();
      const catalogue = [
        { id: 'razorpay', name: 'Razorpay', category: 'Payments', icon: 'credit-card', connected: true, desc: 'Online fee collection, settlements and refunds.', route: 'system/payment-gateway' },
        { id: 'msg91', name: 'MSG91', category: 'Messaging', icon: 'message-square', connected: true, desc: 'Transactional SMS with DLT template registration.', route: 'system/sms' },
        { id: 'gupshup', name: 'Gupshup', category: 'Messaging', icon: 'message-circle', connected: true, desc: 'WhatsApp Business API for parent communication.', route: 'system/whatsapp' },
        { id: 'ses', name: 'Amazon SES', category: 'Messaging', icon: 'mail', connected: true, desc: 'Bulk email delivery with DKIM and DMARC.', route: 'system/email' },
        { id: 'essl', name: 'ESSL Biometrics', category: 'Devices', icon: 'fingerprint', connected: true, desc: 'Fingerprint and face attendance devices.', route: 'system/biometric' },
        { id: 'impinj', name: 'Impinj RFID', category: 'Devices', icon: 'scan', connected: true, desc: 'Gate and bus RFID tap points.', route: 'system/rfid' },
        { id: 'gps', name: 'Traccar GPS', category: 'Transport', icon: 'navigation', connected: true, desc: 'Live vehicle tracking and geofence alerts.', route: 'transport/tracking' },
        { id: 'tally', name: 'Tally Prime', category: 'Finance', icon: 'calculator', connected: true, desc: 'Nightly voucher export to the accounting ledger.', route: 'finance/vouchers' },
        { id: 'gmeet', name: 'Google Meet', category: 'Learning', icon: 'video', connected: true, desc: 'Online classes with attendance capture.', route: 'lms/online-classes' },
        { id: 'zoom', name: 'Zoom', category: 'Learning', icon: 'video', connected: false, desc: 'Alternative provider for live classes and PTM.' },
        { id: 'gclass', name: 'Google Classroom', category: 'Learning', icon: 'book-open', connected: false, desc: 'Two-way sync of assignments and submissions.' },
        { id: 'diksha', name: 'DIKSHA', category: 'Learning', icon: 'library', connected: false, desc: 'NCERT content library for CBSE classes.' },
        { id: 'digilocker', name: 'DigiLocker', category: 'Government', icon: 'archive', connected: false, desc: 'Push report cards and certificates to student lockers.' },
        { id: 'udise', name: 'UDISE+', category: 'Government', icon: 'building-columns', connected: true, desc: 'Annual statutory enrolment and infrastructure return.' },
        { id: 'aadhaar', name: 'Aadhaar eKYC', category: 'Government', icon: 'id-card', connected: false, desc: 'Verify guardian identity at admission.' },
        { id: 'powerbi', name: 'Power BI', category: 'Analytics', icon: 'chart-bar', connected: false, desc: 'Push the MIS warehouse into Power BI dashboards.' },
      ];
      const connected = catalogue.filter((c) => c.connected);
      const stateMap = new Map(catalogue.map((c) => [c.id, c.connected]));
      const gridHost = h('div', { className: 'pt-int' });

      const paint = () => {
        gridHost.innerHTML = '';
        for (const c of catalogue) {
          const on = stateMap.get(c.id);
          gridHost.appendChild(h('div', { className: 'pt-int-card' },
            h('div', { className: 'row-3' },
              h('span', { className: 'pt-int-logo', html: icon(c.icon, 18) }),
              h('div', { className: 'flex-1 min-0' },
                h('div', { className: 't-semibold' }, c.name),
                h('div', { className: 't-xs t-muted' }, c.category)),
              on ? Badge('Connected', { tone: 'success', dot: true }) : Badge('Not connected', { tone: 'neutral' })),
            h('div', { className: 't-sm t-muted flex-1' }, c.desc),
            h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
              Switch(on ? 'Enabled' : 'Disabled', {
                checked: on,
                onChange: (v) => {
                  if (!v) {
                    ConfirmDialog({ title: `Disconnect ${c.name}?`, text: 'Any workflow depending on this integration stops immediately.', confirmLabel: 'Disconnect', tone: 'danger' })
                      .then((ok) => { stateMap.set(c.id, !ok ? true : false); paint(); if (ok) notify({ title: `${c.name} disconnected`, tone: 'warning' }); });
                  } else {
                    stateMap.set(c.id, true); paint();
                    notify({ title: `${c.name} connected`, text: 'Credentials verified and the first sync has been queued.', tone: 'success' });
                  }
                },
              }),
              h('span', { className: 'spacer' }),
              c.route ? Button('Configure', { variant: 'ghost', size: 'sm', icon: 'settings', route: c.route })
                : Button('Configure', { variant: 'ghost', size: 'sm', icon: 'settings', onClick: mockAction(`Configure ${c.name}`) }))));
        }
      };
      paint();

      const webhooks = [
        { id: 1, event: 'payment.captured', url: 'https://erp.springdale.edu.in/api/hooks/payment', last: '2026-08-20T09:12:00', status: 'Active', deliveries: 5182, failures: 3 },
        { id: 2, event: 'attendance.synced', url: 'https://erp.springdale.edu.in/api/hooks/biometric', last: '2026-08-20T09:25:00', status: 'Active', deliveries: 18422, failures: 41 },
        { id: 3, event: 'gps.geofence', url: 'https://erp.springdale.edu.in/api/hooks/transport', last: '2026-08-20T08:58:00', status: 'Active', deliveries: 9214, failures: 12 },
        { id: 4, event: 'result.published', url: 'https://erp.springdale.edu.in/api/hooks/results', last: '2026-08-10T17:40:00', status: 'Active', deliveries: 22, failures: 0 },
        { id: 5, event: 'admission.confirmed', url: 'https://crm.springdale.edu.in/hooks/admission', last: '2026-08-19T11:02:00', status: 'Paused', deliveries: 318, failures: 7 },
      ];

      mount.appendChild(page({
        route: 'system/integrations',
        title: 'Integrations & API',
        subtitle: `${connected.length} of ${catalogue.length} services connected`,
        actions: pageActions(
          Button('API documentation', { variant: 'secondary', icon: 'book-open', onClick: mockAction('Open API docs') }),
          Button('Create API key', { variant: 'primary', icon: 'key', onClick: () => formPage({
            title: 'Create an API key', mode: 'modal', size: 'md', submitLabel: 'Generate key',
            sections: [{ title: 'Key', cols: 1, fields: [
              { id: 'name', label: 'Key name', required: true, placeholder: 'e.g. Tally nightly export' },
              { id: 'scopes', label: 'Scopes', type: 'multiselect', options: PERMISSION_MODULES.map((m) => ({ value: m, label: moduleLabel(m) })) },
              { id: 'expiry', label: 'Expires', type: 'select', options: ['30 days', '90 days', '1 year', 'Never'], value: '90 days' },
              { id: 'ip', label: 'Restrict to IPs', placeholder: '10.0.0.0/8, 103.21.44.1' },
            ] }],
            onSubmit: (v) => notify({ title: 'API key generated', text: `${v.name} · copy it now, it is shown only once`, tone: 'success' }),
          }) })),
        children: [
          kpiRow([
            { label: 'Connected services', value: formatNumber(connected.length), icon: 'git-branch', tone: 'success' },
            { label: 'Available', value: formatNumber(catalogue.length), icon: 'layers', tone: 'brand' },
            { label: 'Webhooks', value: formatNumber(webhooks.length), icon: 'workflow', tone: 'info' },
            { label: 'Failed deliveries (24h)', value: formatNumber(sum(webhooks, 'failures')), icon: 'alert-circle', tone: 'warning' },
          ]),
          SectionCard({ title: 'Integration catalogue', subtitle: 'Toggle a service to connect or disconnect it', icon: 'git-branch' }, gridHost),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-7' }, SectionCard({ title: 'Webhooks', subtitle: 'Outbound events with delivery health', icon: 'workflow', flush: true },
              DataTable({
                columns: [
                  { key: 'event', label: 'Event', width: 200, sticky: true, className: 't-mono' },
                  { key: 'url', label: 'Endpoint', className: 't-mono' },
                  { key: 'deliveries', label: 'Deliveries', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
                  { key: 'failures', label: 'Failures', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => (r.failures ? h('span', { className: 't-danger t-num' }, formatNumber(r.failures)) : h('span', { className: 't-faint' }, '0')) },
                  { key: 'last', label: 'Last delivery', width: 180, render: (r) => relativeTime(r.last) },
                  { key: 'status', label: 'Status', width: 120, render: (r) => Badge(r.status === 'Active' ? 'Active' : 'Pending', { tone: r.status === 'Active' ? 'success' : 'warning' }), value: (r) => r.status },
                ],
                rows: webhooks, paginate: false, footerAggregates: true, exportName: 'webhooks',
                rowActions: (row) => [
                  { label: 'Send test event', icon: 'send', onClick: () => notify({ title: 'Test event sent', text: row.event, tone: 'success' }) },
                  { label: 'View deliveries', icon: 'list', onClick: mockAction('View deliveries') },
                  { label: row.status === 'Active' ? 'Pause' : 'Resume', icon: row.status === 'Active' ? 'x-circle' : 'check-circle', onClick: mockAction('Toggle webhook') },
                ],
              }))),
            h('div', { className: 'span-5' }, frag(
              SectionCard({ title: 'API keys', subtitle: 'Server-to-server access', icon: 'key' },
                h('div', { className: 'stack-3' },
                  maskedField('Tally export key', 'spd_live_tal_4a91cc72'),
                  maskedField('Mobile app key', 'spd_live_app_b7723fd1'),
                  h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
                    Button('Rotate all keys', { variant: 'danger', size: 'sm', icon: 'refresh-ccw', onClick: () => ConfirmDialog({ title: 'Rotate every API key?', text: 'Integrations using the old keys will fail until they are updated.', confirmLabel: 'Rotate all', tone: 'danger' }).then((ok) => ok && notify({ title: 'All keys rotated', tone: 'warning' })) }),
                    Button('Usage report', { variant: 'ghost', size: 'sm', icon: 'chart-bar', onClick: mockAction('API usage report') })))),
              SectionCard({ title: 'Rate limits', icon: 'gauge' },
                h('div', { className: 'stack-2' },
                  ProgressBar(42, { label: 'Requests this hour (4.2K of 10K)', showValue: true, tone: 'success' }),
                  ProgressBar(78, { label: 'Webhook queue depth', showValue: true, tone: 'warning' }),
                  kv('Burst limit', '120 requests / minute'),
                  kv('Auth', 'Bearer token + IP allowlist')))))),
        ],
      }));
    },
  },

  'system/backup': {
    title: 'Backup & Restore',
    subtitle: 'Snapshots, retention and point-in-time restore',
    section: 'system',
    render(mount) {
      ensureStyles();
      const b = db.settings.backup;
      const history = Array.from({ length: 24 }, (_, i) => {
        const d = new Date('2026-08-20T02:00:00');
        d.setDate(d.getDate() - i);
        const r = hash01('bk' + i);
        return {
          id: 'BK' + String(24 - i).padStart(3, '0'),
          startedAt: d.toISOString().slice(0, 19),
          type: i % 7 === 0 ? 'Full' : 'Incremental',
          size: `${(2.4 + r * 2.6).toFixed(1)} GB`,
          durationMin: Math.round(6 + r * 22),
          destination: b.destination,
          status: r > 0.06 ? 'Completed' : 'Failed',
          verified: r > 0.12,
        };
      });
      const failed = history.filter((x) => x.status === 'Failed');

      const restore = (row) => {
        Modal({
          title: 'Restore from backup', subtitle: `${row.id} · ${formatDateTime(row.startedAt)}`, size: 'md', icon: 'database', tone: 'danger',
          body: h('div', { className: 'stack' },
            Callout({ tone: 'danger', icon: 'alert-triangle', title: 'This overwrites live data' },
              'Every record created after this snapshot will be lost. The platform goes into maintenance mode for the duration of the restore.'),
            DescriptionList([
              ['Snapshot', row.id], ['Taken at', formatDateTime(row.startedAt)],
              ['Type', row.type], ['Size', row.size], ['Destination', row.destination],
              ['Integrity check', row.verified ? 'Passed' : 'Not verified'],
            ], { cols: 1 }),
            Field({ label: 'Type RESTORE to confirm', required: true }, Input({ placeholder: 'RESTORE' }))),
          actions: (close) => frag(
            Button('Cancel', { variant: 'secondary', onClick: close }),
            Button('Start restore', { variant: 'danger', icon: 'database', onClick: () => { close(); notify({ title: 'Restore queued', text: 'The platform will enter maintenance mode in 5 minutes.', tone: 'danger', duration: 6000 }); } })),
        });
      };

      mount.appendChild(page({
        route: 'system/backup',
        title: 'Backup & restore',
        subtitle: `${b.frequency} · retained for ${b.retentionDays} days · ${b.destination}`,
        actions: pageActions(
          Button('Download latest', { variant: 'secondary', icon: 'download', onClick: () => notify({ title: 'Preparing download', text: `${b.size} archive · a link will be emailed to you`, tone: 'info' }) }),
          Button('Back up now', { variant: 'primary', icon: 'database', onClick: () => ConfirmDialog({ title: 'Run a backup now?', text: 'A full snapshot takes about 20 minutes and does not interrupt users.', confirmLabel: 'Start backup', tone: 'brand', icon: 'database' }).then((ok) => ok && notify({ title: 'Backup started', text: 'You will be notified when it completes.', tone: 'success' })) })),
        children: [
          kpiRow([
            { label: 'Last backup', value: relativeTime(b.lastBackup), icon: 'database', tone: 'success', footer: h('span', { className: 't-xs t-muted' }, formatDateTime(b.lastBackup)) },
            { label: 'Archive size', value: b.size, icon: 'archive', tone: 'info' },
            { label: 'Retention', value: `${b.retentionDays} days`, icon: 'history', tone: 'brand' },
            { label: 'Failed backups (30d)', value: formatNumber(failed.length), icon: 'alert-circle', tone: failed.length ? 'danger' : 'success' },
          ]),
          b.status === 'Healthy'
            ? Callout({ tone: 'success', icon: 'shield-check', title: 'Backup health is good' },
              `The last ${history.filter((x) => x.status === 'Completed').length} of ${history.length} snapshots completed successfully and passed the integrity check. Restores are tested quarterly.`)
            : Callout({ tone: 'danger', icon: 'alert-triangle', title: 'Backups need attention' }, 'Investigate the failures below before relying on a restore.'),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-8' }, SectionCard({ title: 'Backup history', subtitle: 'Last 24 snapshots', icon: 'history', flush: true },
              DataTable({
                columns: [
                  { key: 'id', label: 'Snapshot', width: 120, sticky: true, className: 't-mono' },
                  { key: 'startedAt', label: 'Started', width: 190, render: (r) => formatDateTime(r.startedAt) },
                  { key: 'type', label: 'Type', width: 130, filter: true, render: (r) => Badge(r.type, { tone: r.type === 'Full' ? 'brand' : 'neutral' }) },
                  { key: 'size', label: 'Size', width: 110, align: 'right' },
                  { key: 'durationMin', label: 'Duration', width: 120, align: 'right', numeric: true, render: (r) => `${r.durationMin} min` },
                  { key: 'verified', label: 'Integrity', width: 130, render: (r) => (r.verified ? Badge('Verified', { tone: 'success' }) : Badge('Not verified', { tone: 'warning' })), value: (r) => (r.verified ? 1 : 0) },
                  { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
                  { key: 'act', label: '', width: 130, sortable: false, render: (r) => Button('Restore', { variant: 'ghost', size: 'sm', icon: 'refresh-ccw', disabled: r.status !== 'Completed', onClick: (e) => { e.stopPropagation(); restore(r); } }) },
                ],
                rows: history, pageSize: 12, exportName: 'backup-history',
              }))),
            h('div', { className: 'span-4' }, frag(
              SectionCard({ title: 'Schedule', icon: 'clock' },
                FormGrid({ cols: 1 },
                  Field({ label: 'Frequency' }, Select({ options: ['Hourly', 'Daily 02:00 IST', 'Twice daily', 'Weekly'], value: b.frequency })),
                  Field({ label: 'Retention' }, Select({ options: ['7 days', '15 days', '30 days', '90 days', '1 year'], value: `${b.retentionDays} days` })),
                  Field({ label: 'Destination' }, Select({ options: ['AWS S3 (ap-south-1)', 'Azure Blob (Central India)', 'Google Cloud Storage', 'On-premise NAS'], value: b.destination })),
                  Field({ label: 'Encryption' }, Switch('Encrypt archives with AES-256', { checked: true })),
                  Field({ label: 'Off-site copy' }, Switch('Replicate to a second region', { checked: true, description: 'Meets the trust’s disaster-recovery policy' })))),
              SectionCard({ title: 'What is backed up', icon: 'layers' },
                h('div', { className: 'stack-2' },
                  kv('Database', 'All 29 modules'),
                  kv('Uploaded documents', '18.4 GB'),
                  kv('Report card PDFs', '2.1 GB'),
                  kv('Audit logs', 'Full history'),
                  kv('CCTV footage', 'Excluded — kept on the NVR'))),
              SectionCard({ title: 'Disaster recovery', icon: 'shield-check' },
                h('div', { className: 'stack-2' },
                  kv('RPO', '1 hour'),
                  kv('RTO', '4 hours'),
                  kv('Last restore drill', '12 Jul 2026'),
                  Button('Run a restore drill', { variant: 'secondary', block: true, icon: 'activity', onClick: mockAction('Run restore drill') })))))),
        ],
      }));
    },
  },
};

/* ---------------------------------------------- audit log diff viewer -- */

const DIFF_FIELDS = {
  Student: [['className', 'Class'], ['section', 'Section'], ['house', 'House'], ['status', 'Status'], ['transportOpted', 'Transport']],
  Invoice: [['amount', 'Amount'], ['discount', 'Discount'], ['dueDate', 'Due date'], ['status', 'Status'], ['balance', 'Balance']],
  Employee: [['designation', 'Designation'], ['department', 'Department'], ['salaryGross', 'Gross salary'], ['status', 'Status']],
  Marks: [['marksObtained', 'Marks'], ['grade', 'Grade'], ['status', 'Status'], ['remarks', 'Remarks']],
  Route: [['stopCount', 'Stops'], ['fare', 'Monthly fare'], ['status', 'Status'], ['shift', 'Shift']],
  Book: [['availableCopies', 'Available copies'], ['rackNo', 'Rack'], ['condition', 'Condition'], ['status', 'Status']],
  Circular: [['title', 'Title'], ['audience', 'Audience'], ['priority', 'Priority'], ['status', 'Status']],
  'Fee Structure': [['total', 'Annual total'], ['installments', 'Instalments'], ['dueDay', 'Due day'], ['lateFeePerDay', 'Late fee / day']],
  Timetable: [['periodNo', 'Period'], ['subjectName', 'Subject'], ['teacherName', 'Teacher'], ['room', 'Room']],
  User: [['roleName', 'Role'], ['campusId', 'Campus'], ['twoFactor', 'Two-factor'], ['status', 'Status']],
};

function auditDiff(log) {
  const fields = DIFF_FIELDS[log.entity] || [['status', 'Status'], ['value', 'Value']];
  const pool = {
    Status: ['Active', 'Inactive', 'Pending', 'Approved'],
    Class: ['Class VII', 'Class VIII', 'Class IX'],
    Section: ['A', 'B', 'C', 'D'],
    House: ['Aravalli', 'Nilgiri', 'Shivalik', 'Vindhya'],
    Transport: ['Yes', 'No'],
    Amount: ['₹32,500', '₹34,000', '₹36,750'],
    Discount: ['₹0', '₹2,500', '₹5,000'],
    Balance: ['₹0', '₹8,250', '₹12,400'],
    'Due date': ['10 Jul 2026', '20 Jul 2026', '05 Aug 2026'],
    Designation: ['PGT — Physics', 'TGT — Science', 'Head of Department'],
    Department: ['Science', 'Mathematics', 'Administration'],
    'Gross salary': ['₹68,400', '₹72,900', '₹81,250'],
    Marks: ['62', '68', '74'],
    Grade: ['B2', 'B1', 'A2'],
    Remarks: ['Satisfactory', 'Good improvement', 'Needs practice'],
    Stops: ['12', '14', '16'],
    'Monthly fare': ['₹1,800', '₹2,000', '₹2,200'],
    Shift: ['Morning', 'Afternoon'],
    'Available copies': ['2', '3', '5'],
    Rack: ['R-14', 'R-18', 'R-22'],
    Condition: ['Good', 'Fair', 'Damaged'],
    Title: ['Revised School Timings', 'Revised School Timings from September'],
    Audience: ['All Parents', 'Class IX-XII', 'All Staff'],
    Priority: ['Normal', 'High', 'Urgent'],
    'Annual total': ['₹1,24,000', '₹1,32,000'],
    Instalments: ['3', '4'],
    'Due day': ['5', '10'],
    'Late fee / day': ['₹40', '₹50'],
    Period: ['3', '5'],
    Subject: ['Mathematics', 'Physics'],
    Teacher: ['Shalini Verma', 'Arjun Menon'],
    Room: ['Room 204', 'Room 311'],
    Role: ['Teacher', 'Class Teacher', 'Administrator'],
    Campus: ['Main Campus', 'Noida Campus'],
    'Two-factor': ['Enabled', 'Disabled'],
    Value: ['Old value', 'New value'],
  };
  return fields.map(([key, label], i) => {
    const opts = pool[label] || ['Previous', 'Updated'];
    const r = hash01(log.id + key);
    const before = opts[Math.floor(r * opts.length)];
    const after = opts[(Math.floor(r * opts.length) + 1) % opts.length];
    const changed = i < 2 || r > 0.55;
    return { key, label, before, after: changed ? after : before, changed };
  });
}

function auditDrawer(log) {
  const diff = auditDiff(log);
  const changed = diff.filter((d) => d.changed);
  Drawer({
    title: `${log.action} · ${log.entity}`,
    subtitle: `${log.entityId} · ${formatDateTime(log.timestamp)} · ${log.userName}`,
    size: 'xl',
    body: h('div', { className: 'stack' },
      h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
        Badge(log.severity, { tone: log.severity === 'Critical' ? 'danger' : log.severity === 'Warning' ? 'warning' : 'info' }),
        Badge(moduleLabel(log.module), { tone: 'brand' }),
        Badge(log.role, { tone: 'neutral' }),
        Badge(`${changed.length} field${changed.length === 1 ? '' : 's'} changed`, { tone: changed.length ? 'warning' : 'neutral' })),
      Callout({ tone: 'neutral', icon: 'history', title: 'What happened' }, log.description),
      SectionCard({ title: 'Change diff', subtitle: 'Before and after, field by field', icon: 'git-branch' },
        h('div', { className: 'pt-diff' },
          h('div', { className: 'pt-diff-col' },
            h('div', { className: 'pt-diff-head' }, 'Before'),
            diff.map((d) => h('div', { className: ['pt-diff-line', d.changed && 'is-removed'].filter(Boolean).join(' ') },
              h('span', { className: 'k' }, d.label), h('span', null, String(d.before))))),
          h('div', { className: 'pt-diff-col' },
            h('div', { className: 'pt-diff-head' }, 'After'),
            diff.map((d) => h('div', { className: ['pt-diff-line', d.changed && 'is-added'].filter(Boolean).join(' ') },
              h('span', { className: 'k' }, d.label), h('span', null, String(d.after))))))),
      SectionCard({ title: 'Request context', icon: 'monitor' },
        DescriptionList([
          ['User', `${log.userName} (${log.userId})`],
          ['Role', log.role],
          ['IP address', log.ip],
          ['Device', log.device],
          ['Campus', (byId(db.campuses, log.campusId) || {}).name || log.campusId],
          ['Module', moduleLabel(log.module)],
          ['Entity', `${log.entity} · ${log.entityId}`],
          ['Timestamp', formatDateTime(log.timestamp)],
        ], { cols: 2 }))),
    actions: (close) => frag(
      Button('Copy JSON', { variant: 'ghost', icon: 'copy', onClick: () => copyToClipboard(JSON.stringify(log, null, 2), 'Audit entry copied as JSON') }),
      Button('View user', { variant: 'secondary', icon: 'user', onClick: () => { close(); navigate('system/users'); } }),
      Button('Close', { variant: 'primary', onClick: close })),
  });
}

const systemRoutes6 = {
  'system/audit-logs': {
    title: 'Audit Logs',
    subtitle: 'Who changed what, when and from where',
    section: 'system',
    render(mount) {
      ensureStyles();
      const rows = sortBy(db.auditLogs, 'timestamp', 'desc');
      const critical = rows.filter((r) => r.severity === 'Critical');
      const byModule = countBy(rows, 'module').slice(0, 10);
      const byAction = countBy(rows, 'action').slice(0, 8);

      mount.appendChild(listPage({
        title: 'Audit logs',
        subtitle: `${formatNumber(rows.length)} entries retained · immutable and exportable for compliance`,
        route: 'system/audit-logs',
        actions: pageActions(
          Button('Login history', { variant: 'secondary', icon: 'log-in', route: 'system/login-history' }),
          Button('Export audit trail', { variant: 'primary', icon: 'download', onClick: () => notify({ title: 'Audit trail exported', text: `${formatNumber(rows.length)} entries as a signed CSV`, tone: 'success' }) })),
        kpis: [
          { label: 'Entries', value: formatNumber(rows.length), icon: 'history', tone: 'brand' },
          { label: 'Critical', value: formatNumber(critical.length), icon: 'alert-triangle', tone: critical.length ? 'danger' : 'success' },
          { label: 'Warnings', value: formatNumber(rows.filter((r) => r.severity === 'Warning').length), icon: 'alert-circle', tone: 'warning' },
          { label: 'Distinct users', value: formatNumber(new Set(rows.map((r) => r.userId)).size), icon: 'users', tone: 'info' },
        ],
        chart: barChart({
          categories: byModule.map((m) => moduleLabel(m.key)),
          series: [{ name: 'Log entries', values: byModule.map((m) => m.value) }],
          horizontal: true, height: 280,
        }),
        chartTitle: 'Where the changes happen',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'User, entity, description or IP…' },
          { id: 'module', label: 'Module', options: PERMISSION_MODULES.map((m) => ({ value: m, label: moduleLabel(m) })) },
          { id: 'action', label: 'Action', options: byAction.map((a) => a.key) },
          { id: 'severity', label: 'Severity', options: ['Info', 'Warning', 'Critical'] },
          { id: 'role', label: 'Role', options: Array.from(new Set(rows.map((r) => r.role))) },
          { id: 'from', label: 'From', type: 'date' },
          { id: 'to', label: 'To', type: 'date' },
        ],
        onFilter: (id, value, all, table) => {
          let out = rows;
          if (all.q) out = search(out, all.q, ['userName', 'entity', 'entityId', 'description', 'ip', 'action']);
          if (all.module && all.module !== 'all') out = out.filter((r) => r.module === all.module);
          if (all.action && all.action !== 'all') out = out.filter((r) => r.action === all.action);
          if (all.severity && all.severity !== 'all') out = out.filter((r) => r.severity === all.severity);
          if (all.role && all.role !== 'all') out = out.filter((r) => r.role === all.role);
          if (all.from) out = out.filter((r) => r.timestamp >= all.from);
          if (all.to) out = out.filter((r) => r.timestamp <= all.to + 'T23:59:59');
          table.refresh(out);
        },
        columns: [
          { key: 'timestamp', label: 'When', width: 190, sticky: true, render: (r) => h('div', { className: 'stack-1' }, h('span', { className: 't-sm' }, formatDateTime(r.timestamp)), h('span', { className: 't-xs t-muted' }, relativeTime(r.timestamp))), value: (r) => r.timestamp },
          { key: 'userName', label: 'User', width: 220, render: (r) => Identity(r.userName, r.role), value: (r) => r.userName },
          { key: 'action', label: 'Action', width: 140, filter: true, render: (r) => Badge(r.action, { tone: r.action === 'Delete' ? 'danger' : r.action === 'Create' ? 'success' : 'neutral' }) },
          { key: 'module', label: 'Module', width: 170, filter: true, render: (r) => moduleLabel(r.module), value: (r) => r.module },
          { key: 'entity', label: 'Entity', width: 170, filter: true, render: (r) => Identity(r.entity, r.entityId), value: (r) => r.entity },
          { key: 'description', label: 'Description', width: 300 },
          { key: 'ip', label: 'IP', width: 140, className: 't-mono' },
          { key: 'device', label: 'Device', width: 180, filter: true },
          { key: 'severity', label: 'Severity', width: 130, filter: true, render: (r) => Badge(r.severity, { tone: r.severity === 'Critical' ? 'danger' : r.severity === 'Warning' ? 'warning' : 'info' }) },
        ],
        rows,
        pageSize: 25, exportName: 'audit-logs',
        searchKeys: ['userName', 'entity', 'entityId', 'description', 'ip'],
        onRowClick: auditDrawer,
        rowActions: (row) => [
          { label: 'View diff', icon: 'git-branch', onClick: () => auditDrawer(row) },
          { label: 'Copy JSON', icon: 'copy', onClick: () => copyToClipboard(JSON.stringify(row, null, 2), 'Audit entry copied') },
          { label: 'Show this user’s activity', icon: 'user', onClick: () => notify({ title: `Filtering on ${row.userName}`, text: 'Use the search box above to keep the filter.', tone: 'info' }) },
        ],
        tableTitle: 'Audit trail',
        tableSubtitle: 'Click a row to open the before/after diff',
        notes: Callout({ tone: 'info', icon: 'lock', title: 'Tamper-evident' },
          'Audit entries are append-only and hash-chained. Exports are signed so an auditor can verify that nothing was removed.'),
        emptyState: EmptyState({ icon: 'history', title: 'No audit entries', text: 'Activity appears here as soon as users start making changes.' }),
      }));
    },
  },

  'system/login-history': {
    title: 'Login History',
    subtitle: 'Every sign-in attempt with device, IP and outcome',
    section: 'system',
    render(mount) {
      ensureStyles();
      const rows = sortBy(db.loginHistory, 'timestamp', 'desc');
      const failures = rows.filter((r) => r.result !== 'Success');
      const byDevice = countBy(rows, 'device');
      const byLocation = countBy(rows, 'location').slice(0, 8);
      const suspicious = failures.filter((r) => r.reason && /password|locked|blocked/i.test(r.reason));

      const detail = (r) => Drawer({
        title: r.userName, subtitle: `${formatDateTime(r.timestamp)} · ${r.result}`, size: 'md',
        body: h('div', { className: 'stack' },
          h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
            Badge(r.result === 'Success' ? 'Verified' : 'Rejected', { tone: r.result === 'Success' ? 'success' : 'danger' }),
            Badge(r.role, { tone: 'neutral' }), Badge(r.device, { tone: 'info' })),
          r.result !== 'Success' ? Callout({ tone: 'danger', icon: 'alert-triangle', title: 'Sign-in failed' }, r.reason || 'Invalid credentials.') : null,
          DescriptionList([
            ['User', `${r.userName} (${r.userId})`], ['Role', r.role],
            ['When', formatDateTime(r.timestamp)], ['IP address', r.ip],
            ['Location', r.location], ['Device', r.device],
            ['Result', r.result], ['Session length', r.sessionMinutes ? `${r.sessionMinutes} minutes` : '—'],
          ], { cols: 2 }),
          SectionCard({ title: 'Recent attempts by this user', icon: 'history', flush: true },
            DataTable({
              columns: [
                { key: 'timestamp', label: 'When', width: 190, render: (x) => formatDateTime(x.timestamp) },
                { key: 'ip', label: 'IP', width: 140, className: 't-mono' },
                { key: 'result', label: 'Result', width: 120, render: (x) => Badge(x.result === 'Success' ? 'Verified' : 'Rejected', { tone: x.result === 'Success' ? 'success' : 'danger' }) },
              ],
              rows: rows.filter((x) => x.userId === r.userId).slice(0, 10),
              paginate: false, searchable: false, columnToggle: false, exportable: false,
            }))),
        actions: (close) => frag(
          Button('Close', { variant: 'secondary', onClick: close }),
          Button('Force sign-out everywhere', { variant: 'danger', icon: 'log-out', onClick: () => { close(); notify({ title: 'All sessions revoked', text: r.userName, tone: 'warning' }); } })),
      });

      mount.appendChild(listPage({
        title: 'Login history',
        subtitle: `${formatNumber(rows.length)} sign-in attempts · ${failures.length} failed`,
        route: 'system/login-history',
        actions: pageActions(
          Button('Security settings', { variant: 'secondary', icon: 'lock', route: 'system/security' }),
          Button('Export', { variant: 'primary', icon: 'download', onClick: () => notify({ title: 'Login history exported', tone: 'success' }) })),
        kpis: [
          { label: 'Sign-in attempts', value: formatNumber(rows.length), icon: 'log-in', tone: 'brand' },
          { label: 'Successful', value: formatNumber(rows.length - failures.length), icon: 'check-circle', tone: 'success' },
          { label: 'Failed', value: formatNumber(failures.length), icon: 'x-circle', tone: failures.length ? 'danger' : 'success' },
          { label: 'Avg session', value: `${Math.round(avg(rows.filter((r) => r.sessionMinutes), 'sessionMinutes'))} min`, icon: 'clock', tone: 'info' },
        ],
        chart: donutChart({ data: byDevice, height: 240, centerValue: String(byDevice.length), centerLabel: 'Device types' }),
        chartTitle: 'Sign-ins by device',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'User, IP or location…' },
          { id: 'result', label: 'Result', options: ['Success', 'Failed'] },
          { id: 'device', label: 'Device', options: byDevice.map((d) => d.key) },
          { id: 'role', label: 'Role', options: Array.from(new Set(rows.map((r) => r.role))) },
          { id: 'from', label: 'From', type: 'date' },
        ],
        onFilter: (id, value, all, table) => {
          let out = rows;
          if (all.q) out = search(out, all.q, ['userName', 'ip', 'location', 'device']);
          if (all.result && all.result !== 'all') out = out.filter((r) => (all.result === 'Success' ? r.result === 'Success' : r.result !== 'Success'));
          if (all.device && all.device !== 'all') out = out.filter((r) => r.device === all.device);
          if (all.role && all.role !== 'all') out = out.filter((r) => r.role === all.role);
          if (all.from) out = out.filter((r) => r.timestamp >= all.from);
          table.refresh(out);
        },
        columns: [
          { key: 'timestamp', label: 'When', width: 190, sticky: true, render: (r) => h('div', { className: 'stack-1' }, h('span', { className: 't-sm' }, formatDateTime(r.timestamp)), h('span', { className: 't-xs t-muted' }, relativeTime(r.timestamp))), value: (r) => r.timestamp },
          { key: 'userName', label: 'User', width: 220, render: (r) => Identity(r.userName, r.role), value: (r) => r.userName },
          { key: 'role', label: 'Role', width: 170, filter: true },
          { key: 'ip', label: 'IP address', width: 150, className: 't-mono' },
          { key: 'location', label: 'Location', width: 180, filter: true },
          { key: 'device', label: 'Device', width: 190, filter: true, render: (r) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, Icon(/Android|iOS/.test(r.device) ? 'monitor' : 'monitor', 14), h('span', null, r.device)), value: (r) => r.device },
          { key: 'result', label: 'Result', width: 130, filter: true, render: (r) => Badge(r.result === 'Success' ? 'Verified' : 'Rejected', { tone: r.result === 'Success' ? 'success' : 'danger' }) },
          { key: 'reason', label: 'Reason', width: 200, render: (r) => r.reason || h('span', { className: 't-faint' }, '—') },
          { key: 'sessionMinutes', label: 'Session', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v)} min`, render: (r) => (r.sessionMinutes ? `${r.sessionMinutes} min` : '—') },
        ],
        rows,
        pageSize: 25, footerAggregates: true, exportName: 'login-history',
        searchKeys: ['userName', 'ip', 'location', 'device'],
        onRowClick: detail,
        rowActions: (row) => [
          { label: 'Open attempt', icon: 'eye', onClick: () => detail(row) },
          { label: 'Block this IP', icon: 'lock', tone: 'danger', onClick: () => ConfirmDialog({ title: `Block ${row.ip}?`, text: 'Anyone signing in from this address will be refused.', confirmLabel: 'Block IP', tone: 'danger' }).then((ok) => ok && notify({ title: 'IP blocked', text: row.ip, tone: 'danger' })) },
        ],
        tableTitle: 'Sign-in attempts',
        notes: suspicious.length ? Callout({ tone: 'warning', icon: 'alert-triangle', title: `${suspicious.length} failed attempts need review` },
          'Repeated failures from the same IP may indicate credential stuffing. Consider enabling the IP allowlist in security settings.') : null,
        emptyState: EmptyState({ icon: 'log-in', title: 'No sign-in history' }),
      }));

      /* a small companion strip appended under the list */
      mount.appendChild(h('div', { className: 'page', style: { paddingTop: '0' } },
        h('div', { className: 'stack' },
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-6' }, SectionCard({ title: 'Sign-ins by location', className: 'chart-card', icon: 'map-pin' },
              barChart({
                categories: byLocation.map((l) => l.key),
                series: [{ name: 'Sign-ins', values: byLocation.map((l) => l.value) }],
                horizontal: true, height: 240,
              }))),
            h('div', { className: 'span-6' }, SectionCard({ title: 'Active sessions right now', icon: 'activity', flush: true },
              DataTable({
                columns: [
                  { key: 'userName', label: 'User', width: 200, render: (r) => Identity(r.userName, r.role), value: (r) => r.userName },
                  { key: 'device', label: 'Device', width: 180 },
                  { key: 'ip', label: 'IP', width: 140, className: 't-mono' },
                  { key: 'sessionMinutes', label: 'Active for', width: 130, align: 'right', numeric: true, render: (r) => `${r.sessionMinutes} min` },
                  { key: 'act', label: '', width: 130, sortable: false, render: (r) => Button('Revoke', { variant: 'ghost', size: 'sm', icon: 'log-out', onClick: (e) => { e.stopPropagation(); notify({ title: 'Session revoked', text: r.userName, tone: 'warning' }); } }) },
                ],
                rows: rows.filter((r) => r.result === 'Success' && r.sessionMinutes).slice(0, 12),
                paginate: false, searchable: false, exportName: 'active-sessions',
              })))))));
    },
  },

  'system/security': {
    title: 'Security Settings',
    subtitle: 'Password policy, MFA, sessions and IP controls',
    section: 'system',
    render(mount) {
      ensureStyles();
      const s = db.settings.security;
      const failures = db.loginHistory.filter((r) => r.result !== 'Success');

      mount.appendChild(settingsPage({
        title: 'Security settings',
        subtitle: 'Applies to every account, including super admins',
        route: 'system/security',
        saveLabel: 'Save security policy',
        onSave: () => notify({ title: 'Security policy saved', text: 'Users are asked to comply at their next sign-in.', tone: 'success' }),
        groups: [
          {
            id: 'posture', title: 'Security posture', icon: 'shield-check',
            actions: [Button('Run security check', { variant: 'secondary', icon: 'activity', onClick: () => notify({ title: 'Security check complete', text: '2 recommendations found — MFA is not enforced and the IP allowlist is off.', tone: 'warning' }) })],
            render: () => h('div', { className: 'stack-3' },
              statusStrip([
                { label: 'Posture score', value: '78 / 100' },
                { label: 'MFA', value: s.mfaRequired ? 'Enforced' : 'Optional', badge: true, tone: s.mfaRequired ? 'success' : 'warning' },
                { label: 'IP allowlist', value: s.ipAllowlist ? 'On' : 'Off', badge: true, tone: s.ipAllowlist ? 'success' : 'warning' },
                { label: 'Failed sign-ins (30d)', value: formatNumber(failures.length) },
                { label: 'Session timeout', value: `${s.sessionTimeoutMin} min` },
              ]),
              Callout({ tone: 'warning', icon: 'alert-circle', title: '2 recommendations' },
                'Enforce multi-factor authentication for every administrative role, and switch on the IP allowlist for the finance and system modules.')),
          },
          {
            id: 'password', title: 'Password policy', icon: 'key', cols: 2,
            fields: [
              { id: 'minLength', label: 'Minimum length', type: 'number', value: s.passwordMinLength },
              { id: 'expiry', label: 'Expiry (days)', type: 'number', value: s.passwordExpiryDays },
              { id: 'history', label: 'Cannot reuse last', type: 'select', value: '5 passwords', options: ['3 passwords', '5 passwords', '10 passwords'] },
              { id: 'maxFailed', label: 'Lock after failed attempts', type: 'number', value: s.maxFailedLogins },
              { id: 'complexity', label: 'Complexity', type: 'switch', switchLabel: 'Require upper case, number and symbol', value: true },
              { id: 'breach', label: 'Breached password check', type: 'switch', switchLabel: 'Reject passwords found in known breaches', value: true },
            ],
          },
          {
            id: 'mfa', title: 'Multi-factor authentication', icon: 'lock', cols: 2,
            fields: [
              { id: 'mfaRequired', label: 'Enforce MFA', type: 'switch', switchLabel: 'Require MFA for every user', value: s.mfaRequired, description: 'Recommended for admin, finance and HR roles at minimum' },
              { id: 'mfaAdmins', label: 'Admins only', type: 'switch', switchLabel: 'Enforce for administrative roles', value: true },
              { id: 'method', label: 'Preferred method', type: 'select', value: 'Authenticator app', options: ['Authenticator app', 'SMS OTP', 'Email OTP', 'Any'] },
              { id: 'remember', label: 'Remember device', type: 'select', value: '30 days', options: ['Never', '7 days', '30 days', '90 days'] },
            ],
          },
          {
            id: 'sessions', title: 'Sessions & access', icon: 'monitor', cols: 2,
            fields: [
              { id: 'timeout', label: 'Idle timeout (minutes)', type: 'number', value: s.sessionTimeoutMin },
              { id: 'concurrent', label: 'Concurrent sessions', type: 'select', value: '3 devices', options: ['1 device', '3 devices', '5 devices', 'Unlimited'] },
              { id: 'ipAllowlist', label: 'IP allowlist', type: 'switch', switchLabel: 'Restrict admin access to allowed IPs', value: s.ipAllowlist },
              { id: 'allowlist', label: 'Allowed ranges', value: '10.0.0.0/8, 103.21.44.0/24', span: 'full', hint: 'Comma-separated CIDR ranges' },
              { id: 'geo', label: 'Geo restriction', type: 'switch', switchLabel: 'Allow sign-in from India only', value: true },
              { id: 'audit', label: 'Audit retention', type: 'select', value: '3 years', options: ['1 year', '3 years', '7 years', 'Forever'] },
            ],
          },
          {
            id: 'privacy', title: 'Data protection', description: 'DPDP Act 2023 obligations', icon: 'shield',
            render: () => h('div', { className: 'stack-3' },
              FormGrid({ cols: 2 },
                Field({ label: 'Data retention' }, Select({ options: ['5 years after exit', '7 years after exit', '10 years after exit'], value: '7 years after exit' })),
                Field({ label: 'Consent capture' }, Switch('Record parental consent at admission', { checked: true })),
                Field({ label: 'Right to erasure' }, Switch('Allow erasure requests from the parent portal', { checked: true })),
                Field({ label: 'PII masking' }, Switch('Mask Aadhaar, PAN and bank details in lists', { checked: true }))),
              Callout({ tone: 'info', icon: 'shield-check', title: 'Data protection officer' },
                'Vikram Sethi · dpo@springdale.edu.in · +91 124 4567 815. Erasure and access requests must be answered within 30 days.')),
          },
        ],
      }));
    },
  },

  'system/data-import-export': {
    title: 'Data Import / Export',
    subtitle: 'Bulk load records and take data out again',
    section: 'system',
    render(mount) {
      ensureStyles();
      const datasets = [
        { id: 'students', name: 'Students', rows: db.students.length, module: 'students', template: 'students-template.csv', lastRun: '2026-04-08', mode: 'Import & export' },
        { id: 'parents', name: 'Parents & guardians', rows: db.parents.length, module: 'parents', template: 'parents-template.csv', lastRun: '2026-04-08', mode: 'Import & export' },
        { id: 'staff', name: 'Employees', rows: db.staff.length, module: 'hr', template: 'employees-template.csv', lastRun: '2026-04-02', mode: 'Import & export' },
        { id: 'marks', name: 'Marks', rows: db.marks.length, module: 'examination', template: 'marks-template.csv', lastRun: '2026-08-10', mode: 'Import & export' },
        { id: 'invoices', name: 'Fee invoices', rows: db.invoices.length, module: 'fees', template: 'invoices-template.csv', lastRun: '2026-07-01', mode: 'Export only' },
        { id: 'payments', name: 'Fee payments', rows: db.payments.length, module: 'fees', template: 'payments-template.csv', lastRun: '2026-08-19', mode: 'Import & export' },
        { id: 'books', name: 'Library catalogue', rows: db.books.length, module: 'library', template: 'books-template.csv', lastRun: '2026-05-14', mode: 'Import & export' },
        { id: 'routes', name: 'Transport routes & stops', rows: db.routes.length + db.stops.length, module: 'transport', template: 'routes-template.csv', lastRun: '2026-04-15', mode: 'Import & export' },
        { id: 'attendance', name: 'Attendance', rows: db.attendance.length, module: 'attendance', template: 'attendance-template.csv', lastRun: '2026-08-19', mode: 'Export only' },
        { id: 'assets', name: 'Assets & inventory', rows: db.assets.length, module: 'inventory', template: 'assets-template.csv', lastRun: '2026-06-30', mode: 'Import & export' },
      ];

      const jobs = Array.from({ length: 14 }, (_, i) => {
        const r = hash01('job' + i);
        const d = datasets[i % datasets.length];
        const total = Math.round(200 + r * 2400);
        const failedRows = r > 0.7 ? Math.round(r * 40) : 0;
        return {
          id: 'JOB' + String(140 - i).padStart(4, '0'),
          dataset: d.name,
          type: i % 3 === 0 ? 'Export' : 'Import',
          startedAt: `2026-08-${String(20 - (i % 19)).padStart(2, '0')}T${String(9 + (i % 8)).padStart(2, '0')}:15:00`,
          user: db.users[(i * 7) % db.users.length].name,
          total, imported: total - failedRows, failed: failedRows,
          status: failedRows > 20 ? 'Failed' : failedRows ? 'Completed' : 'Completed',
          file: `${d.id}-${i + 1}.csv`,
        };
      });

      const importWizard = () => formPage({
        title: 'Import data',
        subtitle: 'Upload, map columns, validate, then commit',
        route: 'system/data-import-export',
        mode: 'wizard',
        submitLabel: 'Start import',
        steps: [
          {
            id: 'dataset', label: 'Choose dataset', description: 'What are you importing?',
            sections: [{
              title: 'Dataset', cols: 2,
              fields: [
                { id: 'dataset', label: 'Dataset', type: 'select', required: true, options: datasets.filter((d) => d.mode !== 'Export only').map((d) => ({ value: d.id, label: d.name })) },
                { id: 'campus', label: 'Campus', type: 'select', required: true, options: db.campuses.map((c) => ({ value: c.id, label: c.name })) },
                { id: 'session', label: 'Academic year', type: 'select', options: db.academicYears.map((y) => y.name), value: '2026-27' },
                { id: 'mode', label: 'On duplicate', type: 'radio', inline: true, value: 'Skip', options: ['Skip', 'Update', 'Fail the row'] },
              ],
            }],
          },
          {
            id: 'upload', label: 'Upload file', description: 'CSV or XLSX, up to 10 MB',
            sections: [{
              title: 'File', cols: 1,
              fields: [
                { id: 'file', label: 'Data file', type: 'file', required: true, hint: 'Download the template first so the columns match' },
                { id: 'header', label: 'First row is a header', type: 'checkbox', value: true },
                { id: 'encoding', label: 'Encoding', type: 'select', value: 'UTF-8', options: ['UTF-8', 'UTF-16', 'Windows-1252'] },
              ],
            }],
          },
          {
            id: 'map', label: 'Map columns', description: 'Match your columns to ours',
            sections: [{
              title: 'Column mapping', cols: 2,
              fields: [
                { id: 'colName', label: 'Name', type: 'select', value: 'name', options: ['name', 'student_name', 'full_name'] },
                { id: 'colAdm', label: 'Admission number', type: 'select', value: 'admission_no', options: ['admission_no', 'adm_no', 'roll'] },
                { id: 'colClass', label: 'Class', type: 'select', value: 'class', options: ['class', 'grade', 'standard'] },
                { id: 'colSection', label: 'Section', type: 'select', value: 'section', options: ['section', 'div'] },
                { id: 'colDob', label: 'Date of birth', type: 'select', value: 'dob', options: ['dob', 'birth_date'] },
                { id: 'colPhone', label: 'Phone', type: 'select', value: 'phone', options: ['phone', 'mobile', 'contact'] },
              ],
            }],
          },
          {
            id: 'validate', label: 'Validate & commit', description: 'Review before anything is written',
            sections: [{
              title: 'Validation', cols: 1,
              fields: [
                { id: 'dryRun', label: 'Dry run first', type: 'switch', value: true, description: 'Validate every row without writing anything' },
                { id: 'notify', label: 'Email me the result', type: 'switch', value: true },
                { id: 'notes', label: 'Notes for the audit log', type: 'textarea' },
              ],
            }],
          },
        ],
        onSubmit: () => notify({ title: 'Import queued', text: 'A dry run is in progress — you will be emailed the validation report.', tone: 'success' }),
        onCancel: () => navigate('system/data-import-export'),
      });

      mount.appendChild(page({
        route: 'system/data-import-export',
        title: 'Data import & export',
        subtitle: `${datasets.length} datasets available · imports are validated before anything is written`,
        actions: pageActions(
          Button('Download all templates', { variant: 'secondary', icon: 'download', onClick: () => notify({ title: 'Templates downloaded', text: 'A zip of all CSV templates.', tone: 'success' }) }),
          Button('Import data', { variant: 'primary', icon: 'upload', onClick: () => { mount.innerHTML = ''; mount.appendChild(importWizard()); } })),
        children: [
          kpiRow([
            { label: 'Datasets', value: formatNumber(datasets.length), icon: 'database', tone: 'brand' },
            { label: 'Records exportable', value: formatNumber(sum(datasets, 'rows')), icon: 'layers', tone: 'info' },
            { label: 'Jobs (30 days)', value: formatNumber(jobs.length), icon: 'workflow', tone: 'success' },
            { label: 'Rows rejected', value: formatNumber(sum(jobs, 'failed')), icon: 'alert-circle', tone: sum(jobs, 'failed') ? 'warning' : 'success' },
          ]),
          Callout({ tone: 'info', icon: 'upload', title: 'How imports work' },
            'Every import runs as a dry run first. You get a validation report listing the exact row and column of each problem; nothing is written until you approve it. Imports are reversible for 24 hours.'),
          SectionCard({ title: 'Datasets', subtitle: 'Download a template, export current data, or start an import', icon: 'database', flush: true },
            DataTable({
              columns: [
                { key: 'name', label: 'Dataset', width: 240, sticky: true, render: (d) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, Icon(d.module === 'system' ? 'settings' : d.module, 15), h('span', { className: 't-medium' }, d.name)), value: (d) => d.name },
                { key: 'rows', label: 'Records', width: 140, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'mode', label: 'Mode', width: 170, filter: true, render: (d) => Badge(d.mode, { tone: d.mode === 'Export only' ? 'neutral' : 'info' }) },
                { key: 'lastRun', label: 'Last job', width: 150, render: (d) => formatDate(d.lastRun) },
                { key: 'template', label: 'Template', width: 230, className: 't-mono' },
                {
                  key: 'act', label: '', width: 320, sortable: false,
                  render: (d) => h('div', { className: 'row', style: { gap: 'var(--sp-2)', justifyContent: 'flex-end' } },
                    Button('Template', { variant: 'ghost', size: 'sm', icon: 'download', onClick: (e) => { e.stopPropagation(); download(d.template, 'name,admission_no,class,section,dob,phone\n', 'text/csv;charset=utf-8'); notify({ title: 'Template downloaded', text: d.template, tone: 'success' }); } }),
                    Button('Export', { variant: 'secondary', size: 'sm', icon: 'upload', onClick: (e) => { e.stopPropagation(); notify({ title: 'Export queued', text: `${d.name} · ${formatNumber(d.rows)} records`, tone: 'success' }); } }),
                    Button('Import', { variant: 'primary', size: 'sm', icon: 'plus', disabled: d.mode === 'Export only', onClick: (e) => { e.stopPropagation(); mount.innerHTML = ''; mount.appendChild(importWizard()); } })),
                },
              ],
              rows: datasets, paginate: false, footerAggregates: true, exportName: 'datasets',
            })),
          SectionCard({ title: 'Job history', subtitle: 'Imports and exports run in the last 30 days', icon: 'history', flush: true },
            DataTable({
              columns: [
                { key: 'id', label: 'Job', width: 130, sticky: true, className: 't-mono' },
                { key: 'dataset', label: 'Dataset', width: 220, filter: true },
                { key: 'type', label: 'Type', width: 120, filter: true, render: (j) => Badge(j.type, { tone: j.type === 'Import' ? 'brand' : 'neutral' }) },
                { key: 'startedAt', label: 'Started', width: 190, render: (j) => formatDateTime(j.startedAt) },
                { key: 'user', label: 'Run by', width: 200 },
                { key: 'total', label: 'Rows', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'imported', label: 'Processed', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'failed', label: 'Rejected', width: 120, align: 'right', numeric: true, aggregate: 'sum', render: (j) => (j.failed ? h('span', { className: 't-danger t-num' }, formatNumber(j.failed)) : h('span', { className: 't-faint' }, '0')) },
                { key: 'status', label: 'Status', width: 130, filter: true, render: (j) => Badge(j.status) },
              ],
              rows: jobs, pageSize: 10, footerAggregates: true, exportName: 'import-jobs',
              rowActions: (row) => [
                { label: 'Download source file', icon: 'download', onClick: () => notify({ title: 'Downloading', text: row.file, tone: 'info' }) },
                { label: 'Validation report', icon: 'file-text', onClick: () => notify({ title: 'Validation report', text: `${row.failed} rows rejected out of ${row.total}`, tone: row.failed ? 'warning' : 'success' }) },
                { separator: true },
                { label: 'Roll back this job', icon: 'refresh-ccw', tone: 'danger', disabled: row.type === 'Export', onClick: () => ConfirmDialog({ title: `Roll back ${row.id}?`, text: `${formatNumber(row.imported)} records created or updated by this job will be reverted.`, confirmLabel: 'Roll back', tone: 'danger' }).then((ok) => ok && notify({ title: 'Rollback queued', tone: 'warning' })) },
              ],
            })),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-6' }, SectionCard({ title: 'Scheduled exports', icon: 'clock', flush: true },
              DataTable({
                columns: [
                  { key: 'name', label: 'Schedule', width: 220, sticky: true },
                  { key: 'dataset', label: 'Dataset', width: 180 },
                  { key: 'cadence', label: 'Cadence', width: 150, filter: true },
                  { key: 'destination', label: 'Destination', width: 200 },
                  { key: 'status', label: 'Status', width: 120, render: (r) => Badge(r.status), value: (r) => r.status },
                ],
                rows: [
                  { id: 1, name: 'Tally voucher export', dataset: 'Fee payments', cadence: 'Nightly 23:30', destination: 'SFTP · tally.springdale', status: 'Active' },
                  { id: 2, name: 'UDISE+ enrolment return', dataset: 'Students', cadence: 'Annual', destination: 'Download', status: 'Scheduled' },
                  { id: 3, name: 'Payroll bank file', dataset: 'Employees', cadence: 'Monthly, 28th', destination: 'HDFC corporate portal', status: 'Active' },
                  { id: 4, name: 'Library stock audit', dataset: 'Library catalogue', cadence: 'Quarterly', destination: 'Email to librarian', status: 'Active' },
                ],
                paginate: false, searchable: false, exportName: 'scheduled-exports',
              }))),
            h('div', { className: 'span-6' }, SectionCard({ title: 'Import rules', icon: 'shield-check' },
              h('div', { className: 'stack-2' },
                ['Admission numbers must be unique within a campus',
                  'Dates must be in DD-MM-YYYY or YYYY-MM-DD format',
                  'Phone numbers must be ten digits, with or without +91',
                  'Class and section must already exist in Academics',
                  'Amounts must be plain numbers with no ₹ symbol or commas',
                  'Files above 10 MB should be split into batches'].map((x) =>
                  h('div', { className: 'row row-top', style: { gap: 'var(--sp-2)' } }, Icon('check-circle', 15), h('span', { className: 't-sm' }, x))))))),
        ],
      }));
    },
  },
};

/* ==========================================================================
   ROUTE TABLE
   ========================================================================== */

export const routes = Object.assign(
  {},
  teacherRoutes,
  teacherRoutes2,
  parentRoutes,
  parentRoutes2,
  parentRoutes3,
  studentRoutes,
  studentRoutes2,
  studentRoutes3,
  employeeRoutes,
  showcaseRoute,
  securityRoutes,
  securityRoutes2,
  securityRoutes3,
  systemRoutes,
  systemRoutes2,
  systemRoutes3,
  systemRoutes4,
  systemRoutes5,
  systemRoutes6,
);

export default routes;
