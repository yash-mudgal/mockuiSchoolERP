/* ==========================================================================
   pages/assessment.js — Attendance + Examination modules
   Sections owned: 'attendance' (10 routes) · 'examination' (17 routes)
   Foundation is frozen: this file only consumes core/* and data/*.
   ========================================================================== */

import {
  h, frag, Icon, Card, SectionCard, StatCard, Badge, Button, IconButton, Identity,
  DataTable, Modal, Drawer, ConfirmDialog, notify, EmptyState, Timeline, ActivityFeed,
  DescriptionList, ProgressBar, RadialProgress, Avatar, Tabs, FilterBar, MenuButton,
  Callout, RankList, validators, mockAction, Divider, Toolbar, Pill, Tag, Rating,
  Select, Input, Field, Textarea, Switch, Checkbox, RadioGroup, DatePicker, TimePicker,
  SegmentedControl, Stepper, FileUpload, FormGrid, FormSection, FormActions, Collapse,
  MultiSelect, Combobox, Skeleton, SkeletonTable, Calendar, ErrorState,
  formatNumber, formatCurrency, formatDate, formatDateTime, formatPercent, relativeTime,
  toneForStatus, printNode, download, toCsv, copyToClipboard, initials as initialsOf,
} from '../core/ui.js';

import {
  page, listPage, detailPage, dashboardPage, formPage, reportPage,
  settingsPage, approvalQueuePage, calendarPage, kpiRow, pageActions, missingRecord,
} from '../core/page-kit.js';

import {
  lineChart, areaChart, barChart, comboChart, donutChart, pieChart, funnelChart,
  heatmap, gaugeChart, scatterPlot, bulletChart, treemap, radialBarChart, progressRing,
  sparkline, stackedProgressBar, ScaleLegend,
  PALETTE, SEQUENTIAL, STATUS, seriesColor, sequentialColor, compactNumber,
} from '../core/charts.js';

import {
  db, analytics, byId, where, search, sortBy, groupBy, sum, avg, count, distinct,
  countBy, sumBy, student360, subjectsForLevel, gradeFor,
} from '../data/db.js';

import { navigate } from '../core/router.js';
import * as store from '../core/state.js';

/* ==========================================================================
   0. Module-scoped styles — tokens only, injected once.
   ========================================================================== */

const STYLE_ID = 'assessment-module-styles';

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
/* ---- attendance marking grid ---- */
.am-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(216px,1fr));gap:var(--sp-3);}
.am-tile{border:1px solid var(--border);border-radius:var(--r-lg);background:var(--surface);
  padding:var(--sp-3);display:flex;flex-direction:column;gap:var(--sp-2);position:relative;
  transition:border-color var(--dur-fast) var(--ease),box-shadow var(--dur-fast) var(--ease),background var(--dur-fast) var(--ease);outline:none;}
.am-tile:focus-visible{box-shadow:0 0 0 3px var(--ring-color);border-color:var(--border-focus);}
.am-tile[data-state="P"]{border-color:var(--success-500);background:var(--success-50);}
.am-tile[data-state="A"]{border-color:var(--danger-500);background:var(--danger-50);}
.am-tile[data-state="L"]{border-color:var(--warning-500);background:var(--warning-50);}
.am-tile[data-state="H"]{border-color:var(--info-500);background:var(--info-50);}
.am-tile-head{display:flex;gap:var(--sp-2);align-items:center;min-width:0;}
.am-tile-name{font-weight:var(--fw-semibold);font-size:var(--fs-sm);line-height:var(--lh-tight);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.am-tile-meta{font-size:var(--fs-2xs);color:var(--text-muted);}
.am-toggles{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-1);}
.am-toggle{border:1px solid var(--border);background:var(--surface-sunken);color:var(--text-secondary);
  border-radius:var(--r-sm);height:28px;font-size:var(--fs-xs);font-weight:var(--fw-semibold);
  cursor:pointer;font-family:var(--font-sans);transition:all var(--dur-fast) var(--ease);}
.am-toggle:hover{background:var(--surface-hover);color:var(--text);}
.am-toggle:focus-visible{outline:none;box-shadow:0 0 0 2px var(--ring-color);}
.am-toggle[data-on="P"]{background:var(--success-600);border-color:var(--success-600);color:var(--on-success);}
.am-toggle[data-on="A"]{background:var(--danger-500);border-color:var(--danger-500);color:var(--on-danger);}
.am-toggle[data-on="L"]{background:var(--warning-500);border-color:var(--warning-500);color:var(--on-warning);}
.am-toggle[data-on="H"]{background:var(--info-500);border-color:var(--info-500);color:var(--on-info);}
.am-summary{display:flex;gap:var(--sp-4);flex-wrap:wrap;align-items:center;}
.am-chip{display:inline-flex;align-items:center;gap:var(--sp-2);font-size:var(--fs-sm);font-weight:var(--fw-medium);}
.am-dot{width:10px;height:10px;border-radius:var(--r-full);display:inline-block;}
.am-dot[data-s="P"]{background:var(--success-500);} .am-dot[data-s="A"]{background:var(--danger-500);}
.am-dot[data-s="L"]{background:var(--warning-500);} .am-dot[data-s="H"]{background:var(--info-500);}

/* ---- dense monthly register matrix ---- */
.reg-wrap{overflow:auto;max-height:66vh;border:1px solid var(--border);border-radius:var(--r-lg);background:var(--surface);}
.reg-table{border-collapse:separate;border-spacing:0;font-size:var(--fs-xs);width:max-content;min-width:100%;}
.reg-table th,.reg-table td{border-bottom:1px solid var(--border-subtle);padding:0 6px;height:var(--row-h,34px);
  white-space:nowrap;text-align:center;}
.reg-table thead th{position:sticky;top:0;z-index:3;background:var(--surface-sunken);color:var(--text-secondary);
  font-weight:var(--fw-semibold);font-size:var(--fs-2xs);border-bottom:1px solid var(--border);}
.reg-table th.reg-name,.reg-table td.reg-name{position:sticky;left:0;z-index:2;background:var(--surface);
  text-align:left;min-width:210px;border-right:1px solid var(--border);}
.reg-table thead th.reg-name{z-index:4;background:var(--surface-sunken);}
.reg-table tbody tr:hover td{background:var(--surface-hover);}
.reg-table tbody tr:hover td.reg-name{background:var(--surface-hover);}
.reg-cell{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;
  border-radius:var(--r-xs);font-size:var(--fs-2xs);font-weight:var(--fw-bold);}
.reg-cell[data-s="P"]{background:var(--success-100);color:var(--success-700);}
.reg-cell[data-s="A"]{background:var(--danger-100);color:var(--danger-700);}
.reg-cell[data-s="L"]{background:var(--warning-100);color:var(--warning-700);}
.reg-cell[data-s="H"]{background:var(--info-100);color:var(--info-700);}
.reg-cell[data-s="-"]{background:var(--surface-sunken);color:var(--text-faint);}
.reg-sun{background:var(--surface-sunken);color:var(--text-faint);}

/* ---- spreadsheet marks entry ---- */
.mk-wrap{overflow:auto;max-height:62vh;border:1px solid var(--border);border-radius:var(--r-lg);background:var(--surface);}
.mk-table{border-collapse:separate;border-spacing:0;width:max-content;min-width:100%;font-size:var(--fs-sm);}
.mk-table th,.mk-table td{border-bottom:1px solid var(--border-subtle);border-right:1px solid var(--border-subtle);
  padding:0;height:var(--row-h,38px);text-align:center;}
.mk-table thead th{position:sticky;top:0;z-index:3;background:var(--surface-sunken);padding:0 var(--sp-2);
  font-size:var(--fs-2xs);color:var(--text-secondary);font-weight:var(--fw-semibold);text-transform:uppercase;
  letter-spacing:0.05em;border-bottom:1px solid var(--border);}
.mk-table td.mk-name,.mk-table th.mk-name{position:sticky;left:0;z-index:2;background:var(--surface);
  text-align:left;padding:0 var(--sp-3);min-width:240px;border-right:1px solid var(--border);}
.mk-table thead th.mk-name{z-index:4;background:var(--surface-sunken);}
.mk-cell{width:100%;height:100%;border:0;background:transparent;text-align:center;font-family:var(--font-mono);
  font-size:var(--fs-sm);color:var(--text);font-variant-numeric:tabular-nums;padding:0 var(--sp-1);}
.mk-cell:focus{outline:none;box-shadow:inset 0 0 0 2px var(--border-focus);background:var(--surface-selected);}
.mk-cell[data-invalid="1"]{box-shadow:inset 0 0 0 2px var(--ring-danger-color);background:var(--danger-50);color:var(--text-danger);}
.mk-cell[data-dirty="1"]{background:var(--warning-50);}
.mk-total{font-family:var(--font-mono);font-variant-numeric:tabular-nums;font-weight:var(--fw-semibold);}
.mk-save{display:inline-flex;align-items:center;gap:var(--sp-2);font-size:var(--fs-xs);color:var(--text-muted);}
.mk-save[data-state="saving"]{color:var(--text-warning);} .mk-save[data-state="saved"]{color:var(--text-success);}

/* ---- exam datesheet grid ---- */
.ds-grid{display:grid;gap:var(--sp-2);grid-template-columns:repeat(auto-fill,minmax(190px,1fr));}
.ds-day{border:1px solid var(--border);border-radius:var(--r-lg);background:var(--surface);overflow:hidden;}
.ds-day-head{padding:var(--sp-2) var(--sp-3);background:var(--surface-sunken);border-bottom:1px solid var(--border-subtle);}
.ds-slot{padding:var(--sp-2) var(--sp-3);border-bottom:1px solid var(--border-subtle);display:flex;
  flex-direction:column;gap:2px;cursor:pointer;}
.ds-slot:last-child{border-bottom:0;}
.ds-slot:hover{background:var(--surface-hover);}
.ds-slot[data-conflict="1"]{background:var(--danger-50);box-shadow:inset 3px 0 0 var(--danger-500);}

/* ---- seating room grid ---- */
.seat-room{display:grid;gap:var(--sp-2);grid-template-columns:repeat(6,1fr);}
.seat{border:1px solid var(--border);border-radius:var(--r-sm);padding:var(--sp-2);font-size:var(--fs-2xs);
  text-align:center;background:var(--surface);min-height:52px;display:flex;flex-direction:column;
  justify-content:center;gap:2px;}
.seat[data-cls="A"]{background:var(--brand-50);border-color:var(--brand-200,var(--border));}
.seat[data-cls="B"]{background:var(--teal-50);}
.seat[data-cls="empty"]{background:var(--surface-sunken);color:var(--text-faint);border-style:dashed;}
.seat-code{font-family:var(--font-mono);font-weight:var(--fw-semibold);}

/* ---- hall ticket / report card A4 preview ---- */
.a4{background:var(--paper);color:var(--paper-ink);width:100%;max-width:794px;margin:0 auto;padding:28px 30px;
  border:1px solid var(--border);border-radius:var(--r-md);box-shadow:var(--shadow-sm);}
:root[data-theme="dark"] .a4{box-shadow:var(--shadow-lg);}
.a4 h1,.a4 h2,.a4 h3,.a4 p,.a4 td,.a4 th,.a4 div{color:var(--paper-ink);}
.a4-rule{border:0;border-top:2px solid var(--paper-ink);margin:10px 0;}
.a4-table{width:100%;border-collapse:collapse;font-size:12px;}
.a4-table th,.a4-table td{border:1px solid var(--paper-line);padding:5px 7px;text-align:left;}
.a4-table th{background:var(--paper-head);font-weight:700;}
.a4-grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;font-size:12px;}

/* ---- report card designer ---- */
.rcd-split{display:grid;grid-template-columns:230px 1fr 260px;gap:var(--sp-3);align-items:start;}
@media (max-width:1100px){.rcd-split{grid-template-columns:1fr;}}
.rcd-block{border:1px solid var(--border);border-radius:var(--r-md);padding:var(--sp-2) var(--sp-3);
  background:var(--surface);cursor:grab;display:flex;gap:var(--sp-2);align-items:center;font-size:var(--fs-sm);}
.rcd-block:hover{border-color:var(--border-brand);background:var(--surface-hover);}
.rcd-canvas{background:var(--paper);min-height:520px;padding:20px;border:1px solid var(--border);border-radius:var(--r-md);
  display:flex;flex-direction:column;gap:8px;}
.rcd-canvas.is-over{outline:2px dashed var(--border-brand);outline-offset:-6px;}
.rcd-placed{position:relative;border:1px solid transparent;border-radius:var(--r-sm);padding:2px;}
.rcd-placed:hover{border-color:var(--border-brand);}
.rcd-placed[data-sel="1"]{border-color:var(--brand-600);box-shadow:0 0 0 2px var(--ring-color);}
.rcd-placed-bar{position:absolute;top:-1px;right:-1px;display:none;gap:2px;z-index:2;}
.rcd-placed:hover .rcd-placed-bar{display:flex;}
.rcd-drop{border:1px dashed var(--border-strong);border-radius:var(--r-sm);padding:var(--sp-4);
  text-align:center;color:var(--paper-muted);font-size:12px;}

/* ---- online exam runner ---- */
.oe-palette{display:grid;grid-template-columns:repeat(auto-fill,minmax(38px,1fr));gap:var(--sp-2);}
.oe-q{height:34px;border-radius:var(--r-sm);border:1px solid var(--border);background:var(--surface);
  font-size:var(--fs-xs);font-weight:var(--fw-semibold);cursor:pointer;font-family:var(--font-sans);color:var(--text);}
.oe-q[data-s="answered"]{background:var(--success-600);border-color:var(--success-600);color:var(--on-success);}
.oe-q[data-s="review"]{background:var(--warning-500);border-color:var(--warning-500);color:var(--on-warning);}
.oe-q[data-s="current"]{box-shadow:0 0 0 2px var(--ring-color);border-color:var(--border-focus);}
.oe-opt{display:flex;gap:var(--sp-3);align-items:flex-start;padding:var(--sp-3);border:1px solid var(--border);
  border-radius:var(--r-md);cursor:pointer;background:var(--surface);}
.oe-opt:hover{background:var(--surface-hover);}
.oe-opt[data-sel="1"]{border-color:var(--border-brand);background:var(--surface-selected);}
.oe-timer{font-family:var(--font-mono);font-size:var(--fs-lg);font-weight:var(--fw-bold);color:var(--text-danger);}

/* ---- misc ---- */
.grade-band{display:grid;grid-template-columns:90px 1fr 1fr 80px 40px;gap:var(--sp-2);align-items:center;}
@media (max-width:768px){.grade-band{grid-template-columns:1fr 1fr;}}
.omr-sheet{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;}
.omr-bubble{aspect-ratio:1;border-radius:var(--r-full);border:1px solid var(--border-strong);
  display:flex;align-items:center;justify-content:center;font-size:var(--fs-2xs);}
.omr-bubble[data-f="1"]{background:var(--text);color:var(--surface);border-color:var(--text);}
.legend-row{display:flex;gap:var(--sp-4);flex-wrap:wrap;align-items:center;font-size:var(--fs-xs);color:var(--text-secondary);}
`;
  document.head.appendChild(h('style', { id: STYLE_ID, html: css }));
}

/* ==========================================================================
   1. Shared helpers
   ========================================================================== */

const TODAY = '2026-08-20';
const STATES = [
  { id: 'P', label: 'Present', tone: 'success', key: 'p' },
  { id: 'A', label: 'Absent', tone: 'danger', key: 'a' },
  { id: 'L', label: 'Late', tone: 'warning', key: 'l' },
  { id: 'H', label: 'On Leave', tone: 'info', key: 'h' },
];
const STATE_LABEL = { P: 'Present', A: 'Absent', L: 'Late', H: 'On Leave', '-': 'Holiday' };

function campusOf(ctx) { return (ctx && ctx.state && ctx.state.campusId) || 'C1'; }

let _clsMap = null;
function classMap() {
  if (!_clsMap) _clsMap = new Map(db.classes.map((c) => [c.id, c]));
  return _clsMap;
}
let _secMap = null;
function sectionMap() {
  if (!_secMap) _secMap = new Map(db.sections.map((s) => [s.id, s]));
  return _secMap;
}
let _staffMap = null;
function staffMap() {
  if (!_staffMap) _staffMap = new Map(db.staff.map((s) => [s.id, s]));
  return _staffMap;
}

function classesFor(ctx) {
  return db.classes.filter((c) => c.campusId === campusOf(ctx)).sort((a, b) => a.level - b.level);
}
function sectionsOfClass(classId) {
  return db.sections.filter((s) => s.classId === classId);
}
function studentsOfSection(sectionId) {
  return sortBy(db.students.filter((s) => s.sectionId === sectionId && s.status === 'Active'), 'rollNo', 'asc');
}
function sectionLabel(sec) {
  const c = classMap().get(sec.classId);
  return `${c ? c.name : sec.classId} — ${sec.name}`;
}

/* Deterministic hash so derived day-level attendance is stable and identical
   on every reload and across every screen in this module. */
function hash32(str) {
  let x = 2166136261;
  for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); }
  return x >>> 0;
}
function rand01(str) { return hash32(str) / 4294967296; }

/** Per-student, per-day status consistent with the student's attendancePct. */
function dayStatus(student, isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  if (d.getDay() === 0) return '-';
  if (db.holidays && db.holidays.some((x) => x.date === isoDate)) return '-';
  const r = rand01(student.id + '|' + isoDate);
  const pct = (student.attendancePct || 88) / 100;
  if (r < pct) return r < pct * 0.94 ? 'P' : 'L';
  return (r - pct) / Math.max(0.001, 1 - pct) < 0.72 ? 'A' : 'H';
}

function workingDays(month) {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  const out = [];
  for (let d = 1; d <= last; d++) {
    const dt = new Date(y, m - 1, d);
    out.push({
      day: d,
      iso: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      dow: dt.getDay(),
      sunday: dt.getDay() === 0,
    });
  }
  return out;
}

function latestAttendanceDate() {
  let max = '';
  for (const a of db.attendance) if (a.date > max) max = a.date;
  return max || TODAY;
}

function filterCard(filters, onChange, actions) {
  return Card({ className: 'p-0' }, FilterBar({ filters, onChange, actions }));
}

function classOptions(ctx) {
  return classesFor(ctx).map((c) => ({ value: c.id, label: c.name }));
}

function pctTone(p) { return p >= 90 ? 'success' : p >= 75 ? 'warning' : 'danger'; }

/** Shared guard body when the selected campus has no classes or sections. */
function noClassesPage(title, route) {
  return page({
    title, route,
    children: EmptyState({
      icon: 'grid', title: 'No classes on this campus yet',
      text: 'Switch campus from the top bar, or set up classes and sections in the Academics module first.',
      action: Button('Open classes', { variant: 'primary', icon: 'grid', route: 'academics/classes' }),
    }),
  });
}

function attendanceLegend() {
  return h('div', { className: 'legend-row' },
    STATES.map((s) => h('span', { className: 'am-chip' },
      h('span', { className: 'am-dot', dataset: { s: s.id } }),
      `${s.id} · ${s.label}`)),
    h('span', { className: 'am-chip' }, h('span', { className: 'am-dot', style: { background: 'var(--surface-sunken)', border: '1px solid var(--border)' } }), '– · Holiday / Sunday'));
}

/* Exam data is generated for the flagship campus only; fall back gracefully so
   every campus selection still renders a populated screen. */
function examsFor(ctx) {
  const cid = campusOf(ctx);
  const rows = db.exams.filter((e) => e.campusId === cid);
  return rows.length ? rows : db.exams;
}
function marksFor(ctx) {
  const cid = campusOf(ctx);
  const rows = db.marks.filter((m) => m.campusId === cid);
  return rows.length ? rows : db.marks;
}

function examGroupOptions() {
  return db.examGroups.map((g) => ({ value: g.id, label: `${g.name} (${g.term})` }));
}

/* ==========================================================================
   2. ATTENDANCE — flagship: Mark Daily Attendance
   ========================================================================== */

function renderMarkDaily(mount, ctx) {
  ensureStyles();
  const classes = classesFor(ctx);
  if (!classes.length) {
    mount.appendChild(page({
      title: 'Mark Daily Attendance', route: 'attendance/mark-daily',
      children: EmptyState({ icon: 'grid', title: 'No classes on this campus', text: 'Select a different campus from the top bar to begin marking attendance.' }),
    }));
    return;
  }

  let cls = classes.find((c) => c.level === 10) || classes[0];
  let sec = sectionsOfClass(cls.id)[0];
  let date = TODAY;
  let scope = 'day';
  let periodNo = 1;
  let roster = [];
  const marks = new Map();
  const remarks = new Map();

  const rosterHost = h('div', { className: 'stack-3' });
  const summaryHost = h('div');

  const counts = () => {
    const c = { P: 0, A: 0, L: 0, H: 0 };
    for (const s of roster) c[marks.get(s.id) || 'P']++;
    return c;
  };

  function paintSummary() {
    const c = counts();
    const total = roster.length || 1;
    const pct = Math.round(((c.P + c.L) / total) * 1000) / 10;
    summaryHost.innerHTML = '';
    summaryHost.appendChild(Card({ pad: true },
      h('div', { className: 'row-4 row-wrap' },
        h('div', { className: 'stack-1', style: { minWidth: '150px' } },
          h('div', { className: 't-eyebrow' }, 'Marked attendance'),
          h('div', { className: 't-display t-prop' }, `${pct}%`),
          h('div', { className: 't-xs t-muted' }, `${c.P + c.L} of ${roster.length} students in`)),
        h('div', { className: 'flex-1', style: { minWidth: '260px' } },
          stackedProgressBar({
            segments: [
              { label: 'Present', value: c.P, color: 'var(--success-500)' },
              { label: 'Late', value: c.L, color: 'var(--warning-500)' },
              { label: 'On leave', value: c.H, color: 'var(--info-500)' },
              { label: 'Absent', value: c.A, color: 'var(--danger-500)' },
            ],
            barHeight: 14,
          })),
        h('div', { className: 'am-summary' },
          STATES.map((s) => h('span', { className: 'am-chip' },
            h('span', { className: 'am-dot', dataset: { s: s.id } }),
            h('span', { className: 't-num t-semibold' }, String(c[s.id])),
            h('span', { className: 't-muted t-xs' }, s.label)))))));
  }

  function setState(student, value, tile) {
    marks.set(student.id, value);
    if (tile) {
      tile.dataset.state = value;
      tile.querySelectorAll('.am-toggle').forEach((b) => {
        if (b.dataset.value === value) b.dataset.on = value; else delete b.dataset.on;
      });
    }
    paintSummary();
  }

  function tileFor(student, index) {
    const state = marks.get(student.id) || 'P';
    const tile = h('div', {
      className: 'am-tile', dataset: { state }, tabIndex: 0,
      attrs: { role: 'group', 'aria-label': `${student.name}, roll ${student.rollNo}` },
      onKeyDown: (e) => {
        const k = e.key.toLowerCase();
        const hit = STATES.find((s) => s.key === k);
        if (hit) {
          e.preventDefault();
          setState(student, hit.id, tile);
          const next = rosterHost.querySelectorAll('.am-tile')[index + 1];
          if (next) next.focus();
          return;
        }
        const all = Array.from(rosterHost.querySelectorAll('.am-tile'));
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); (all[index + 1] || all[0]).focus(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); (all[index - 1] || all[all.length - 1]).focus(); }
        if (k === 'r') { e.preventDefault(); openRemark(student); }
      },
    },
      h('div', { className: 'am-tile-head' },
        Avatar(student.name, { size: 'sm', initials: student.avatarInitials }),
        h('div', { className: 'min-0 flex-1' },
          h('div', { className: 'am-tile-name', attrs: { title: student.name } }, student.name),
          h('div', { className: 'am-tile-meta' }, `Roll ${student.rollNo} · ${student.admissionNo}`)),
        IconButton('message-square', {
          label: `Add remark for ${student.name}`, size: 'sm',
          onClick: () => openRemark(student),
        })),
      h('div', { className: 'am-toggles' },
        STATES.map((s) => h('button', {
          type: 'button', className: 'am-toggle', dataset: Object.assign({ value: s.id }, state === s.id ? { on: s.id } : {}),
          attrs: { 'aria-label': `${s.label} — ${student.name}`, title: `${s.label} (${s.key.toUpperCase()})` },
          onClick: () => setState(student, s.id, tile),
        }, s.id))));
    return tile;
  }

  function openRemark(student) {
    let text = remarks.get(student.id) || '';
    const box = Textarea({ value: text, rows: 3, placeholder: 'e.g. Left at 11:20 for a dental appointment — parent informed.', onInput: (v) => { text = v; } });
    const m = Modal({
      title: `Remark — ${student.name}`,
      subtitle: `${cls.name} ${sec.name} · Roll ${student.rollNo} · ${formatDate(date)}`,
      icon: 'message-square', size: 'md',
      body: h('div', { className: 'stack-3' },
        Field({ label: 'Attendance remark', hint: 'Visible to the class teacher and to the parent portal.' }, box),
        Callout({ tone: 'info', icon: 'info' }, 'Remarks are attached to the day record and appear on the monthly register export.')),
      actions: (close) => frag(
        Button('Cancel', { variant: 'ghost', onClick: close }),
        Button('Save remark', {
          variant: 'primary', icon: 'check',
          onClick: () => { remarks.set(student.id, text); close(); notify({ title: 'Remark saved', text: student.name, tone: 'success' }); },
        })),
    });
    return m;
  }

  function loadRoster() {
    roster = studentsOfSection(sec.id);
    marks.clear();
    for (const s of roster) marks.set(s.id, dayStatus(s, date) === '-' ? 'P' : dayStatus(s, date));
    paintRoster();
    paintSummary();
  }

  function paintRoster() {
    rosterHost.innerHTML = '';
    if (!roster.length) {
      rosterHost.appendChild(EmptyState({
        icon: 'users', title: 'No students in this section',
        text: 'This section has no active enrolments for 2026-27. Pick another section or check the admissions module.',
        action: Button('Open sections', { variant: 'secondary', route: 'academics/sections' }),
      }));
      return;
    }
    const grid = h('div', { className: 'am-grid' });
    roster.forEach((s, i) => grid.appendChild(tileFor(s, i)));
    rosterHost.appendChild(grid);
  }

  const bulk = (value) => {
    roster.forEach((s) => marks.set(s.id, value));
    paintRoster(); paintSummary();
    notify({ title: `All marked ${STATE_LABEL[value]}`, text: `${roster.length} students in ${cls.name} ${sec.name}`, tone: value === 'P' ? 'success' : 'warning' });
  };

  const doSave = () => {
    const c = counts();
    const pct = roster.length ? Math.round(((c.P + c.L) / roster.length) * 1000) / 10 : 0;
    Modal({
      title: 'Attendance submitted', icon: 'check-circle', tone: 'success', size: 'md',
      subtitle: `${cls.name} — Section ${sec.name} · ${formatDate(date, 'long')}`,
      body: h('div', { className: 'stack-3' },
        DescriptionList([
          ['Strength', formatNumber(roster.length)],
          ['Present', `${c.P} (${roster.length ? Math.round((c.P / roster.length) * 100) : 0}%)`],
          ['Late', String(c.L)],
          ['On leave', String(c.H)],
          ['Absent', String(c.A)],
          ['Attendance', `${pct}%`],
          ['Remarks captured', String(remarks.size)],
          ['Marked by', (ctx.state && ctx.state.currentUser && ctx.state.currentUser.name) || 'Class teacher'],
        ], { cols: 2 }),
        c.A > 0 ? Callout({ tone: 'warning', icon: 'bell', title: `${c.A} absentee SMS queued` },
          'Parents of absent students receive an SMS at 10:00 AM as configured in Communication → Templates.') : null),
      actions: (close) => frag(
        Button('View register', { variant: 'ghost', icon: 'table', onClick: () => { close(); navigate('attendance/monthly-register'); } }),
        Button('Done', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Attendance saved', text: 'Demo build — nothing is persisted.', tone: 'success' }); } })),
    });
  };

  const classSelect = Select({
    options: classOptions(ctx), value: cls.id,
    onChange: (v) => {
      cls = classMap().get(v) || cls;
      const secs = sectionsOfClass(cls.id);
      sec = secs[0];
      sectionSelect.innerHTML = '';
      secs.forEach((s) => sectionSelect.appendChild(h('option', { value: s.id }, `Section ${s.name}${s.stream ? ' · ' + s.stream : ''}`)));
      loadRoster();
    },
  });
  const sectionSelect = Select({
    options: sectionsOfClass(cls.id).map((s) => ({ value: s.id, label: `Section ${s.name}${s.stream ? ' · ' + s.stream : ''}` })),
    value: sec.id,
    onChange: (v) => { sec = sectionMap().get(v) || sec; loadRoster(); },
  });

  const periodSelect = Select({
    options: db.periods.filter((p) => !p.isBreak).map((p) => ({ value: String(p.no), label: `${p.label} · ${p.startTime}` })),
    value: String(periodNo), disabled: scope === 'day',
    onChange: (v) => { periodNo = Number(v); },
  });

  const picker = Card({ pad: true },
    h('div', { className: 'row-3 row-wrap row-top' },
      Field({ label: 'Class', required: true }, classSelect),
      Field({ label: 'Section', required: true }, sectionSelect),
      Field({ label: 'Date', required: true }, DatePicker({ value: date, onChange: (iso) => { date = iso; loadRoster(); } })),
      Field({ label: 'Scope' }, SegmentedControl(
        [{ id: 'day', label: 'Full day' }, { id: 'period', label: 'Period' }],
        (id) => { scope = id; periodSelect.disabled = id === 'day'; },
        { active: scope })),
      Field({ label: 'Period', hint: 'Used when scope is Period' }, periodSelect),
      h('span', { className: 'spacer' }),
      Field({ label: 'Bulk' }, h('div', { className: 'row' },
        Button('All present', { variant: 'secondary', size: 'sm', icon: 'check-circle', onClick: () => bulk('P') }),
        Button('All absent', { variant: 'ghost', size: 'sm', icon: 'x-circle', onClick: () => bulk('A') })))));

  const shortcuts = Callout({ tone: 'neutral', icon: 'command', title: 'Keyboard-first marking' },
    h('span', null,
      'Tab or arrow keys move between students · ',
      h('kbd', { className: 'kbd' }, 'P'), ' present · ',
      h('kbd', { className: 'kbd' }, 'A'), ' absent · ',
      h('kbd', { className: 'kbd' }, 'L'), ' late · ',
      h('kbd', { className: 'kbd' }, 'H'), ' on leave · ',
      h('kbd', { className: 'kbd' }, 'R'), ' add a remark. Marking auto-advances to the next student.'));

  loadRoster();

  mount.appendChild(page({
    title: 'Mark Daily Attendance',
    subtitle: 'Roll-call for one section at a time — pre-filled from the biometric gate feed, correct the exceptions and submit.',
    route: 'attendance/mark-daily',
    actions: pageActions(
      Button('Import from device', { variant: 'secondary', icon: 'fingerprint', onClick: mockAction('Import biometric punches') }),
      MenuButton([
        { header: true, label: 'This section' },
        { label: 'Open monthly register', icon: 'table', route: 'attendance/monthly-register' },
        { label: 'Period attendance', icon: 'clock', route: 'attendance/period' },
        { separator: true },
        { label: 'Print roll-call sheet', icon: 'print', onClick: () => printNode(rosterHost, `${cls.name} ${sec.name} — roll call`) },
        { label: 'Export CSV', icon: 'download', onClick: () => {
          download(`attendance-${cls.code}-${sec.name}-${date}.csv`,
            toCsv(roster.map((s) => ({ roll: s.rollNo, admissionNo: s.admissionNo, name: s.name, status: STATE_LABEL[marks.get(s.id)] || 'Present', remark: remarks.get(s.id) || '' }))),
            'text/csv;charset=utf-8');
          notify({ title: 'Roll call exported', tone: 'success' });
        } },
      ], { label: 'More actions' }),
      Button('Submit attendance', { variant: 'primary', icon: 'check', onClick: doSave })),
    children: [picker, summaryHost, shortcuts, attendanceLegend(), rosterHost],
  }));
}

/* ==========================================================================
   3. ATTENDANCE — period attendance
   ========================================================================== */

function renderPeriodAttendance(mount, ctx) {
  ensureStyles();
  const classes = classesFor(ctx);
  if (!classes.length) return mount.appendChild(noClassesPage('Period Attendance', 'attendance/period'));
  let cls = classes.find((c) => c.level === 10) || classes[0];
  let sec = sectionsOfClass(cls.id)[0];
  if (!sec) return mount.appendChild(noClassesPage('Period Attendance', 'attendance/period'));
  let day = 'Thursday';
  const host = h('div', { className: 'stack' });

  function slotsFor() {
    return sortBy(db.timetableSlots.filter((s) => s.sectionId === sec.id && s.day === day), 'periodNo', 'asc');
  }

  function build() {
    host.innerHTML = '';
    const slots = slotsFor();
    const roster = studentsOfSection(sec.id);
    const strength = roster.length;

    if (!slots.length) {
      host.appendChild(EmptyState({
        icon: 'calendar', title: 'No periods timetabled',
        text: `${cls.name} section ${sec.name} has no published timetable for ${day}.`,
        action: Button('Open master timetable', { variant: 'secondary', route: 'timetable/master' }),
      }));
      return;
    }

    const rows = slots.map((s) => {
      const seed = s.id + day;
      const absent = Math.round(rand01(seed) * Math.max(1, strength * 0.14));
      const late = Math.round(rand01(seed + 'l') * 3);
      const present = Math.max(0, strength - absent);
      const marked = rand01(seed + 'm') > 0.18;
      return {
        id: s.id, periodNo: s.periodNo, time: `${s.startTime}–${s.endTime}`,
        subjectName: s.subjectName, teacherName: s.teacherName, teacherId: s.teacherId,
        room: s.room, strength, present, absent, late,
        percent: strength ? Math.round((present / strength) * 1000) / 10 : 0,
        status: marked ? 'Submitted' : 'Pending',
        substituted: s.isSubstituted,
      };
    });

    const marked = rows.filter((r) => r.status === 'Submitted').length;
    const avgPct = rows.length ? Math.round((rows.reduce((a, r) => a + r.percent, 0) / rows.length) * 10) / 10 : 0;

    host.appendChild(kpiRow([
      { label: 'Periods today', value: String(rows.length), icon: 'clock', tone: 'brand' },
      { label: 'Marked', value: `${marked} / ${rows.length}`, icon: 'clipboard-check', tone: marked === rows.length ? 'success' : 'warning' },
      { label: 'Average attendance', value: `${avgPct}%`, icon: 'percent', tone: pctTone(avgPct) },
      { label: 'Section strength', value: formatNumber(strength), icon: 'users', tone: 'info' },
    ]));

    host.appendChild(SectionCard({ title: 'Period-wise attendance profile', subtitle: `${cls.name} ${sec.name} · ${day}`, className: 'chart-card' },
      barChart({
        categories: rows.map((r) => `P${r.periodNo}`),
        series: [
          { name: 'Present', values: rows.map((r) => r.present) },
          { name: 'Absent', values: rows.map((r) => r.absent) },
        ],
        stacked: true, height: 240, showValues: false,
        title: 'Present versus absent by period',
      })));

    host.appendChild(DataTable({
      columns: [
        { key: 'periodNo', label: 'Period', width: 90, numeric: true, sticky: true, render: (r) => h('span', { className: 't-semibold t-num' }, `P${r.periodNo}`) },
        { key: 'time', label: 'Time', width: 120, sortable: false },
        { key: 'subjectName', label: 'Subject', width: 170, filter: true },
        { key: 'teacherName', label: 'Teacher', width: 210, render: (r) => Identity(r.teacherName, r.substituted ? 'Substitution in effect' : 'Subject teacher'), value: (r) => r.teacherName },
        { key: 'room', label: 'Room', width: 90 },
        { key: 'strength', label: 'Strength', width: 100, align: 'right', numeric: true },
        { key: 'present', label: 'Present', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'absent', label: 'Absent', width: 95, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'late', label: 'Late', width: 80, align: 'right', numeric: true, aggregate: 'sum' },
        {
          key: 'percent', label: 'Attendance', width: 150, align: 'right', numeric: true, aggregate: 'avg',
          format: (v) => `${Math.round(v * 10) / 10}%`,
          render: (r) => h('div', { className: 'row', style: { justifyContent: 'flex-end', gap: 'var(--sp-2)' } },
            h('span', { className: 't-num t-semibold' }, `${r.percent}%`),
            h('span', { style: { width: '54px' } }, ProgressBar(r.percent, { tone: pctTone(r.percent), size: 'sm' }))),
          value: (r) => r.percent,
        },
        { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
      ],
      rows,
      pageSize: 12, paginate: false, maxHeight: 'none',
      searchKeys: ['subjectName', 'teacherName', 'room'],
      rowActions: (r) => [
        { label: r.status === 'Pending' ? 'Mark this period' : 'Edit marking', icon: 'edit', route: 'attendance/mark-daily' },
        { label: 'Teacher timetable', icon: 'calendar', route: r.teacherId ? `teachers/timetable/${r.teacherId}` : 'teachers/timetable' },
        { separator: true },
        { label: 'Raise correction', icon: 'refresh-ccw', route: 'attendance/corrections' },
      ],
      emptyState: EmptyState({ icon: 'clock', title: 'No periods found', text: 'Adjust the class, section or weekday filter above.' }),
      exportName: `period-attendance-${cls.code}-${sec.name}`,
      footerAggregates: true,
    }));
  }

  const filters = filterCard([
    { id: 'class', label: 'Class', type: 'select', value: cls.id, allLabel: null, options: classOptions(ctx) },
    { id: 'section', label: 'Section', type: 'select', value: sec.id, options: sectionsOfClass(cls.id).map((s) => ({ value: s.id, label: `Section ${s.name}` })) },
    { id: 'day', label: 'Weekday', type: 'select', value: day, options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
    { id: 'date', label: 'Date', type: 'date', value: TODAY },
  ], (id, value) => {
    if (id === 'class' && value !== 'all') { cls = classMap().get(value) || cls; sec = sectionsOfClass(cls.id)[0]; }
    if (id === 'section' && value !== 'all') sec = sectionMap().get(value) || sec;
    if (id === 'day' && value !== 'all') day = value;
    build();
  });

  build();

  mount.appendChild(page({
    title: 'Period Attendance',
    subtitle: 'Subject-teacher marking, period by period — used for classes IX to XII where full-day attendance is not sufficient.',
    route: 'attendance/period',
    actions: pageActions(
      Button('Daily marking', { variant: 'secondary', icon: 'check-circle', route: 'attendance/mark-daily' }),
      Button('Mark current period', { variant: 'primary', icon: 'edit', route: 'attendance/mark-daily' })),
    children: [filters, host],
  }));
}

/* ==========================================================================
   4. ATTENDANCE — class-wise
   ========================================================================== */

function buildClassWiseRows(ctx, date) {
  const cid = campusOf(ctx);
  const recs = db.attendance.filter((a) => a.campusId === cid && a.date === date);
  const teachers = db.staff.filter((s) => s.type === 'Teaching' && s.campusId === cid);
  return recs.map((a, i) => {
    const sec = sectionMap().get(a.sectionId);
    const cls = classMap().get(a.classId);
    const t = teachers[hash32(a.sectionId) % Math.max(1, teachers.length)];
    return {
      id: a.id,
      sectionId: a.sectionId,
      className: cls ? cls.name : a.classId,
      level: cls ? cls.level : 0,
      section: sec ? sec.name : '—',
      stage: cls ? cls.stage : '',
      room: sec ? sec.roomNo : '—',
      teacher: t ? t.name : 'Unassigned',
      teacherId: t ? t.id : null,
      strength: a.strength,
      present: a.present,
      absent: a.absent,
      late: a.late,
      leave: a.leave,
      percent: a.percent,
      status: a.status,
      markedAt: a.markedAt,
    };
  }).sort((x, y) => x.level - y.level || String(x.section).localeCompare(String(y.section)));
}

function renderClassWise(mount, ctx) {
  ensureStyles();
  const date = latestAttendanceDate();
  let rows = buildClassWiseRows(ctx, date);
  const all = rows.slice();

  const strength = all.reduce((a, r) => a + r.strength, 0);
  const present = all.reduce((a, r) => a + r.present, 0);
  const absent = all.reduce((a, r) => a + r.absent, 0);
  const late = all.reduce((a, r) => a + r.late, 0);
  const pct = strength ? Math.round((present / strength) * 1000) / 10 : 0;
  const below = all.filter((r) => r.percent < 85).length;

  const byClass = [];
  const grouped = groupBy(all, 'className');
  for (const [name, list] of grouped) {
    const s = list.reduce((a, r) => a + r.strength, 0);
    const p = list.reduce((a, r) => a + r.present, 0);
    byClass.push({ className: name, level: list[0].level, percent: s ? Math.round((p / s) * 1000) / 10 : 0, strength: s });
  }
  byClass.sort((a, b) => a.level - b.level);

  const node = listPage({
    title: 'Class-wise Attendance',
    subtitle: `Section-level roll-call summary for ${formatDate(date, 'long')} · ${formatNumber(all.length)} sections reported`,
    route: 'attendance/class-wise',
    actions: pageActions(
      Button('Attendance reports', { variant: 'secondary', icon: 'chart-bar', route: 'attendance/reports' }),
      Button('Mark attendance', { variant: 'primary', icon: 'check-circle', route: 'attendance/mark-daily' })),
    kpis: [
      { label: 'Students expected', value: formatNumber(strength), icon: 'users', tone: 'brand', trend: analytics.sparks.students },
      { label: 'Present', value: formatNumber(present), delta: 0.8, deltaLabel: 'vs last week', icon: 'clipboard-check', tone: 'success', trend: analytics.sparks.attendance },
      { label: 'Absent', value: formatNumber(absent), delta: -2.4, icon: 'user-x', tone: 'danger' },
      { label: 'Overall attendance', value: `${pct}%`, icon: 'percent', tone: pctTone(pct), footer: `${late} late arrivals · ${below} sections below 85%` },
    ],
    chart: barChart({
      categories: byClass.map((r) => r.className),
      series: [{ name: 'Attendance %', values: byClass.map((r) => r.percent) }],
      valueFormat: 'percent', target: 90, height: 250,
      title: 'Attendance percentage by class against the 90% board target',
    }),
    chartTitle: 'Attendance by class',
    chartActions: Button('Open comparison report', { variant: 'ghost', size: 'sm', icon: 'chart-bar', route: 'attendance/reports' }),
    filters: [
      { id: 'q', type: 'search', label: 'Search', placeholder: 'Class, section, teacher…' },
      { id: 'stage', label: 'Stage', options: distinct(all, 'stage').filter(Boolean) },
      { id: 'className', label: 'Class', options: byClass.map((c) => c.className) },
      { id: 'band', label: 'Band', options: ['Above 90%', '75–90%', 'Below 75%'] },
      { id: 'status', label: 'Marking', options: ['Submitted', 'Pending'] },
    ],
    onFilter: (id, value, allv, table) => {
      let out = all.slice();
      if (allv.q) out = search(out, allv.q, ['className', 'section', 'teacher', 'room']);
      if (allv.stage && allv.stage !== 'all') out = out.filter((r) => r.stage === allv.stage);
      if (allv.className && allv.className !== 'all') out = out.filter((r) => r.className === allv.className);
      if (allv.status && allv.status !== 'all') out = out.filter((r) => r.status === allv.status);
      if (allv.band === 'Above 90%') out = out.filter((r) => r.percent >= 90);
      if (allv.band === '75–90%') out = out.filter((r) => r.percent >= 75 && r.percent < 90);
      if (allv.band === 'Below 75%') out = out.filter((r) => r.percent < 75);
      table.refresh(out);
    },
    columns: [
      { key: 'className', label: 'Class', width: 130, sticky: true, filter: true, render: (r) => h('span', { className: 't-semibold' }, r.className), value: (r) => r.level },
      { key: 'section', label: 'Section', width: 90, filter: true },
      { key: 'room', label: 'Room', width: 90 },
      { key: 'teacher', label: 'Class teacher', width: 220, render: (r) => Identity(r.teacher, 'Class teacher'), value: (r) => r.teacher },
      { key: 'strength', label: 'Strength', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'present', label: 'Present', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'absent', label: 'Absent', width: 95, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'late', label: 'Late', width: 80, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'leave', label: 'Leave', width: 80, align: 'right', numeric: true, aggregate: 'sum' },
      {
        key: 'percent', label: 'Attendance', width: 160, align: 'right', numeric: true, aggregate: 'avg',
        format: (v) => `${Math.round(v * 10) / 10}%`,
        render: (r) => h('div', { className: 'row', style: { justifyContent: 'flex-end', gap: 'var(--sp-2)' } },
          h('span', { className: 't-num t-semibold' }, `${r.percent}%`),
          h('span', { style: { width: '58px' } }, ProgressBar(r.percent, { tone: pctTone(r.percent), size: 'sm' }))),
        value: (r) => r.percent,
      },
      { key: 'status', label: 'Marking', width: 120, filter: true, render: (r) => Badge(r.status) },
      { key: 'markedAt', label: 'Marked at', width: 150, hidden: true, render: (r) => formatDateTime(r.markedAt, 'short') },
    ],
    rows: all,
    selectable: true, footerAggregates: true, pageSize: 25,
    searchKeys: ['className', 'section', 'teacher', 'room'],
    bulkActions: [
      { label: 'Remind class teachers', icon: 'bell', onClick: (sel) => notify({ title: `Reminder queued for ${sel.length} sections`, text: 'Sent to class teachers via the staff app.', tone: 'success' }) },
      { label: 'Export selection', icon: 'download', onClick: (sel) => { download('class-wise-attendance.csv', toCsv(sel), 'text/csv;charset=utf-8'); notify({ title: 'Exported', tone: 'success' }); } },
    ],
    rowActions: (r) => [
      { label: 'Mark / edit attendance', icon: 'edit', route: 'attendance/mark-daily' },
      { label: 'Monthly register', icon: 'table', route: 'attendance/monthly-register' },
      { label: 'Defaulters in this section', icon: 'alert-triangle', route: 'attendance/defaulters' },
      { separator: true },
      { label: 'Raise a correction', icon: 'refresh-ccw', route: 'attendance/corrections' },
    ],
    onRowClick: (r) => {
      const students = studentsOfSection(r.sectionId);
      Drawer({
        title: `${r.className} — Section ${r.section}`,
        subtitle: `${formatDate(date, 'long')} · marked by ${r.teacher}`,
        size: 'lg',
        body: h('div', { className: 'stack-3' },
          kpiRow([
            { label: 'Present', value: String(r.present), icon: 'check-circle', tone: 'success' },
            { label: 'Absent', value: String(r.absent), icon: 'x-circle', tone: 'danger' },
            { label: 'Attendance', value: `${r.percent}%`, icon: 'percent', tone: pctTone(r.percent) },
          ]),
          SectionCard({ title: 'Absent today', icon: 'user-x' },
            (() => {
              const abs = students.filter((s) => dayStatus(s, date) === 'A').slice(0, 12);
              return abs.length
                ? RankList(abs.map((s) => ({ name: s.name, meta: `Roll ${s.rollNo} · ${s.phone}`, value: `${s.attendancePct}%` })))
                : EmptyState({ icon: 'check-circle', title: 'Full attendance', text: 'Every student in this section was present.' });
            })()),
          SectionCard({ title: 'Last 10 school days', className: 'chart-card' },
            lineChart({
              categories: db.attendance.filter((a) => a.sectionId === r.sectionId).slice(-10).map((a) => formatDate(a.date, 'dayMonth')),
              series: [{ name: 'Attendance %', values: db.attendance.filter((a) => a.sectionId === r.sectionId).slice(-10).map((a) => a.percent) }],
              valueFormat: 'percent', target: 90, height: 200, title: 'Section attendance trend',
            }))),
        actions: (close) => frag(
          Button('Close', { variant: 'ghost', onClick: close }),
          Button('Open marking screen', { variant: 'primary', icon: 'edit', onClick: () => { close(); navigate('attendance/mark-daily'); } })),
      });
    },
    emptyState: EmptyState({
      icon: 'clipboard-check', title: 'No attendance recorded',
      text: 'No section on this campus submitted attendance for the selected date.',
      action: Button('Mark attendance', { variant: 'primary', route: 'attendance/mark-daily' }),
    }),
    exportName: 'class-wise-attendance',
    tableTitle: 'Section register',
    tableSubtitle: 'Click any row to inspect absentees and the ten-day trend.',
  });
  mount.appendChild(node);
}

/* ==========================================================================
   5. ATTENDANCE — flagship: Monthly Register (dense matrix)
   ========================================================================== */

function renderMonthlyRegister(mount, ctx) {
  ensureStyles();
  const classes = classesFor(ctx);
  if (!classes.length) return mount.appendChild(noClassesPage('Monthly Attendance Register', 'attendance/monthly-register'));
  let cls = classes.find((c) => c.level === 10) || classes[0];
  let sec = sectionsOfClass(cls.id)[0];
  if (!sec) return mount.appendChild(noClassesPage('Monthly Attendance Register', 'attendance/monthly-register'));
  let month = '2026-08';
  const host = h('div', { className: 'stack-3' });

  function build() {
    host.innerHTML = '';
    const students = studentsOfSection(sec.id);
    const days = workingDays(month);
    const teaching = days.filter((d) => !d.sunday);

    if (!students.length) {
      host.appendChild(EmptyState({
        icon: 'users', title: 'Nothing to show for this section',
        text: 'There are no active students enrolled in the selected section.',
        action: Button('Choose another section', { variant: 'secondary', onClick: mockAction('Change section') }),
      }));
      return;
    }

    const rowsData = students.map((s) => {
      const cells = days.map((d) => ({ ...d, state: dayStatus(s, d.iso) }));
      const p = cells.filter((c) => c.state === 'P').length;
      const l = cells.filter((c) => c.state === 'L').length;
      const a = cells.filter((c) => c.state === 'A').length;
      const lv = cells.filter((c) => c.state === 'H').length;
      const working = teaching.length;
      return { s, cells, p, l, a, lv, working, pct: working ? Math.round(((p + l) / working) * 1000) / 10 : 0 };
    });

    const totalWorking = teaching.length;
    const avg = rowsData.length ? Math.round((rowsData.reduce((x, r) => x + r.pct, 0) / rowsData.length) * 10) / 10 : 0;
    const under = rowsData.filter((r) => r.pct < 75).length;
    const perfect = rowsData.filter((r) => r.a === 0).length;

    host.appendChild(kpiRow([
      { label: 'Students', value: formatNumber(rowsData.length), icon: 'users', tone: 'brand' },
      { label: 'Working days', value: String(totalWorking), icon: 'calendar', tone: 'info', footer: `${days.length - totalWorking} Sundays / holidays` },
      { label: 'Section average', value: `${avg}%`, icon: 'percent', tone: pctTone(avg) },
      { label: 'Below 75%', value: String(under), icon: 'alert-triangle', tone: under ? 'danger' : 'success', onClick: () => navigate('attendance/defaulters'), footer: `${perfect} students with a clean sheet` },
    ]));

    /* --- the dense matrix --- */
    const thead = h('thead', null,
      h('tr', null,
        h('th', { className: 'reg-name' }, 'Student'),
        days.map((d) => h('th', { className: d.sunday ? 'reg-sun' : '', attrs: { title: formatDate(d.iso, 'long') } },
          h('div', null, String(d.day)),
          h('div', { style: { fontSize: 'var(--fs-2xs)', opacity: 0.65 } }, ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.dow]))),
        h('th', { attrs: { title: 'Present' } }, 'P'),
        h('th', { attrs: { title: 'Late' } }, 'L'),
        h('th', { attrs: { title: 'Leave' } }, 'H'),
        h('th', { attrs: { title: 'Absent' } }, 'A'),
        h('th', { style: { minWidth: '64px' } }, '%')));

    const tbody = h('tbody', null,
      rowsData.map((r) => h('tr', null,
        h('td', { className: 'reg-name' },
          h('div', {
            className: 'row', style: { gap: 'var(--sp-2)', cursor: 'pointer' },
            onClick: () => navigate(`students/profile/${r.s.id}`),
          },
            Avatar(r.s.name, { size: 'xs', initials: r.s.avatarInitials }),
            h('div', { className: 'min-0' },
              h('div', { className: 't-truncate t-medium', style: { fontSize: 'var(--fs-xs)' } }, r.s.name),
              h('div', { style: { fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' } }, `Roll ${r.s.rollNo}`)))),
        r.cells.map((c) => h('td', { className: c.sunday ? 'reg-sun' : '' },
          h('span', {
            className: 'reg-cell', dataset: { s: c.state },
            attrs: { title: `${formatDate(c.iso, 'medium')} — ${STATE_LABEL[c.state]}` },
          }, c.state === '-' ? '·' : c.state))),
        h('td', { className: 't-num' }, String(r.p)),
        h('td', { className: 't-num' }, String(r.l)),
        h('td', { className: 't-num' }, String(r.lv)),
        h('td', { className: 't-num', style: { color: r.a > 4 ? 'var(--text-danger)' : 'inherit' } }, String(r.a)),
        h('td', { className: 't-num t-semibold', style: { color: r.pct < 75 ? 'var(--text-danger)' : r.pct < 90 ? 'var(--text-warning)' : 'var(--text-success)' } }, `${r.pct}%`))));

    const table = h('table', { className: 'reg-table' }, thead, tbody);
    const wrap = h('div', { className: 'reg-wrap' }, table);

    host.appendChild(SectionCard({
      title: `Attendance register — ${cls.name} Section ${sec.name}`,
      subtitle: `${formatDate(month + '-01', 'monthYear')} · ${totalWorking} working days · CBSE format`,
      icon: 'table',
      actions: h('div', { className: 'row' },
        Button('Print register', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(wrap, `${cls.name} ${sec.name} register`) }),
        Button('Export CSV', {
          variant: 'ghost', size: 'sm', icon: 'download',
          onClick: () => {
            const csv = rowsData.map((r) => {
              const o = { Roll: r.s.rollNo, Admission: r.s.admissionNo, Name: r.s.name };
              r.cells.forEach((c) => { o[String(c.day)] = c.state; });
              o.Present = r.p; o.Late = r.l; o.Leave = r.lv; o.Absent = r.a; o.Percent = r.pct;
              return o;
            });
            download(`register-${cls.code}-${sec.name}-${month}.csv`, toCsv(csv), 'text/csv;charset=utf-8');
            notify({ title: 'Register exported', text: `${rowsData.length} students · ${totalWorking} days`, tone: 'success' });
          },
        })),
      flush: true,
    }, h('div', { className: 'card-pad stack-3' }, attendanceLegend(), wrap)));

    host.appendChild(SectionCard({ title: 'Daily attendance across the month', className: 'chart-card' },
      lineChart({
        categories: teaching.map((d) => String(d.day)),
        series: [{
          name: 'Attendance %',
          values: teaching.map((d) => {
            const inCount = rowsData.filter((r) => { const c = r.cells.find((x) => x.iso === d.iso); return c && (c.state === 'P' || c.state === 'L'); }).length;
            return Math.round((inCount / rowsData.length) * 1000) / 10;
          }),
        }],
        valueFormat: 'percent', target: 90, targetLabel: 'Board minimum', height: 240,
        title: 'Section attendance for every working day of the month',
      })));
  }

  const filters = filterCard([
    { id: 'class', label: 'Class', type: 'select', value: cls.id, options: classOptions(ctx) },
    { id: 'section', label: 'Section', type: 'select', value: sec.id, options: sectionsOfClass(cls.id).map((s) => ({ value: s.id, label: `Section ${s.name}` })) },
    {
      id: 'month', label: 'Month', type: 'select', value: month,
      options: ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08'].map((m) => ({ value: m, label: formatDate(m + '-01', 'monthYear') })),
    },
  ], (id, value) => {
    if (id === 'class' && value !== 'all') { cls = classMap().get(value) || cls; sec = sectionsOfClass(cls.id)[0]; }
    if (id === 'section' && value !== 'all') sec = sectionMap().get(value) || sec;
    if (id === 'month' && value !== 'all') month = value;
    build();
  });

  build();

  mount.appendChild(page({
    title: 'Monthly Attendance Register',
    subtitle: 'The statutory students × days matrix — colour-coded, printable and exportable in the CBSE inspection format.',
    route: 'attendance/monthly-register',
    wide: true,
    actions: pageActions(
      Button('Defaulters', { variant: 'secondary', icon: 'alert-triangle', route: 'attendance/defaulters' }),
      Button('Mark attendance', { variant: 'primary', icon: 'check-circle', route: 'attendance/mark-daily' })),
    children: [filters, host],
  }));
}

/* ==========================================================================
   6. ATTENDANCE — corrections queue
   ========================================================================== */

function buildCorrections(ctx) {
  const cid = campusOf(ctx);
  const recs = db.attendance.filter((a) => a.campusId === cid).slice(-260);
  const teachers = db.staff.filter((s) => s.type === 'Teaching' && s.campusId === cid);
  const reasons = [
    'Biometric punch not captured — student was in class.',
    'Marked absent in error while the roll call was interrupted.',
    'Student was on approved school duty (inter-house debate).',
    'Late arrival wrongly recorded as absent; gate log attached.',
    'Medical leave approved after the register was submitted.',
    'Duplicate entry created by the device sync at 08:15.',
  ];
  const out = [];
  recs.forEach((a, i) => {
    if (rand01(a.id + 'corr') > 0.34) return;
    const students = db.students.filter((s) => s.sectionId === a.sectionId);
    if (!students.length) return;
    const st = students[hash32(a.id) % students.length];
    const sec = sectionMap().get(a.sectionId);
    const cls = classMap().get(a.classId);
    const t = teachers[hash32(a.id + 'r') % Math.max(1, teachers.length)];
    const from = ['Absent', 'Late', 'Absent', 'On Leave'][hash32(a.id + 'f') % 4];
    const to = from === 'Absent' ? (rand01(a.id + 't') > 0.4 ? 'Present' : 'On Leave') : 'Present';
    out.push({
      id: 'ATC' + String(1000 + i),
      date: a.date,
      studentId: st.id,
      studentName: st.name,
      admissionNo: st.admissionNo,
      avatarInitials: st.avatarInitials,
      className: cls ? cls.name : '',
      section: sec ? sec.name : '',
      fromStatus: from,
      toStatus: to,
      reason: reasons[hash32(a.id + 'n') % reasons.length],
      requestedBy: t ? t.name : 'Class teacher',
      requestedById: t ? t.id : null,
      requestedOn: a.date,
      evidence: rand01(a.id + 'e') > 0.5 ? 'gate-log.pdf' : null,
      status: ['Pending', 'Pending', 'Approved', 'Rejected'][hash32(a.id + 's') % 4],
      ageDays: Math.max(1, Math.round((new Date(TODAY) - new Date(a.date)) / 86400000)),
    });
  });
  return out;
}

function renderCorrections(mount, ctx) {
  ensureStyles();
  const all = buildCorrections(ctx);
  let activeTab = 'pending';
  const pending = all.filter((r) => r.status === 'Pending');

  const node = approvalQueuePage({
    title: 'Attendance Corrections',
    subtitle: 'Back-dated register changes need an academic-lead approval before the monthly register is locked.',
    route: 'attendance/corrections',
    kpis: [
      { label: 'Awaiting approval', value: formatNumber(pending.length), icon: 'inbox', tone: 'warning' },
      { label: 'Approved this term', value: formatNumber(all.filter((r) => r.status === 'Approved').length), icon: 'check-circle', tone: 'success' },
      { label: 'Rejected', value: formatNumber(all.filter((r) => r.status === 'Rejected').length), icon: 'x-circle', tone: 'danger' },
      { label: 'Older than 7 days', value: formatNumber(pending.filter((r) => r.ageDays > 7).length), icon: 'timer', tone: 'info' },
    ],
    tabs: [
      { id: 'pending', label: 'Pending', count: pending.length },
      { id: 'approved', label: 'Approved', count: all.filter((r) => r.status === 'Approved').length },
      { id: 'rejected', label: 'Rejected', count: all.filter((r) => r.status === 'Rejected').length },
      { id: 'all', label: 'All requests', count: all.length },
    ],
    activeTab,
    onTabChange: (id) => {
      activeTab = id;
      const rows = id === 'all' ? all : all.filter((r) => r.status.toLowerCase() === id);
      node.table.refresh(rows);
    },
    filters: [
      { id: 'q', type: 'search', label: 'Search', placeholder: 'Student, class or requester…' },
      { id: 'className', label: 'Class', options: distinct(all, 'className').filter(Boolean).slice(0, 20) },
      { id: 'toStatus', label: 'Change to', options: ['Present', 'On Leave'] },
    ],
    onFilter: (id, value, allv, table) => {
      let out = activeTab === 'all' ? all.slice() : all.filter((r) => r.status.toLowerCase() === activeTab);
      if (allv.q) out = search(out, allv.q, ['studentName', 'className', 'requestedBy', 'reason']);
      if (allv.className && allv.className !== 'all') out = out.filter((r) => r.className === allv.className);
      if (allv.toStatus && allv.toStatus !== 'all') out = out.filter((r) => r.toStatus === allv.toStatus);
      table.refresh(out);
    },
    columns: [
      { key: 'studentName', label: 'Student', width: 240, sticky: true, render: (r) => Identity(r.studentName, `${r.className} ${r.section} · ${r.admissionNo}`), value: (r) => r.studentName },
      { key: 'date', label: 'Register date', width: 130, render: (r) => formatDate(r.date), value: (r) => r.date },
      {
        key: 'fromStatus', label: 'Change', width: 200, sortable: false,
        render: (r) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } },
          Badge(r.fromStatus), Icon('arrow-right', 13), Badge(r.toStatus)),
        value: (r) => `${r.fromStatus} → ${r.toStatus}`,
      },
      { key: 'reason', label: 'Reason', width: 300, render: (r) => h('span', { className: 't-sm t-clamp-2' }, r.reason) },
      { key: 'requestedBy', label: 'Requested by', width: 190 },
      { key: 'ageDays', label: 'Age', width: 90, align: 'right', numeric: true, render: (r) => h('span', { className: r.ageDays > 7 ? 't-danger t-num' : 't-num' }, `${r.ageDays}d`) },
      { key: 'evidence', label: 'Evidence', width: 120, render: (r) => (r.evidence ? Badge('Attached', { tone: 'info', icon: 'paperclip' }) : h('span', { className: 't-faint' }, '—')) },
      { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
    ],
    rows: pending,
    onApprove: (row) => notify({ title: 'Correction approved', text: `${row.studentName} · ${formatDate(row.date)} marked ${row.toStatus}`, tone: 'success' }),
    onReject: (row) => notify({ title: 'Correction rejected', text: `${row.studentName} — the register stays unchanged.`, tone: 'danger' }),
    detail: (row) => h('div', { className: 'stack-3' },
      DescriptionList([
        ['Student', row.studentName], ['Admission no', row.admissionNo],
        ['Class', `${row.className} — ${row.section}`], ['Register date', formatDate(row.date, 'long')],
        ['Current status', row.fromStatus], ['Requested status', row.toStatus],
        ['Requested by', row.requestedBy], ['Raised', relativeTime(row.requestedOn)],
      ], { cols: 2 }),
      Callout({ tone: 'warning', icon: 'alert-circle', title: 'Reason given' }, row.reason),
      row.evidence ? SectionCard({ title: 'Evidence', icon: 'paperclip' },
        h('div', { className: 'row' }, Icon('file-text', 16), h('span', { className: 't-sm' }, row.evidence),
          Button('Preview', { variant: 'link', size: 'sm', onClick: mockAction('Preview evidence') }))) : null,
      SectionCard({ title: 'Impact on the monthly percentage', className: 'chart-card' },
        bulletChart({
          items: [
            { label: 'Before correction', value: 71.4, target: 75 },
            { label: 'After correction', value: 74.6, target: 75 },
          ],
          valueFormat: 'percent', height: 140, title: 'Attendance percentage before and after the requested change',
        }))),
  });

  mount.appendChild(node);
}

/* ==========================================================================
   7. ATTENDANCE — student leave requests
   ========================================================================== */

function renderLeaveRequests(mount, ctx) {
  ensureStyles();
  const cid = campusOf(ctx);
  let all = db.studentLeaveRequests.filter((r) => r.campusId === cid);
  if (!all.length) all = db.studentLeaveRequests.slice();
  let activeTab = 'pending';
  const pending = all.filter((r) => r.status === 'Pending');

  const node = approvalQueuePage({
    title: 'Student Leave Requests',
    subtitle: 'Parent-submitted leave applications routed to the class teacher, then to the vice-principal for more than three days.',
    route: 'attendance/leave-requests',
    kpis: [
      { label: 'Pending decisions', value: formatNumber(pending.length), icon: 'inbox', tone: 'warning' },
      { label: 'Approved', value: formatNumber(all.filter((r) => r.status === 'Approved').length), icon: 'check-circle', tone: 'success' },
      { label: 'Rejected', value: formatNumber(all.filter((r) => r.status === 'Rejected').length), icon: 'x-circle', tone: 'danger' },
      { label: 'Leave days requested', value: formatNumber(sum(all, 'days')), icon: 'calendar', tone: 'brand' },
    ],
    tabs: [
      { id: 'pending', label: 'Pending', count: pending.length },
      { id: 'approved', label: 'Approved', count: all.filter((r) => r.status === 'Approved').length },
      { id: 'rejected', label: 'Rejected', count: all.filter((r) => r.status === 'Rejected').length },
      { id: 'all', label: 'All', count: all.length },
    ],
    activeTab,
    onTabChange: (id) => {
      activeTab = id;
      node.table.refresh(id === 'all' ? all : all.filter((r) => r.status.toLowerCase() === id));
    },
    filters: [
      { id: 'q', type: 'search', label: 'Search', placeholder: 'Student or reason…' },
      { id: 'type', label: 'Leave type', options: distinct(all, 'type') },
      { id: 'className', label: 'Class', options: distinct(all, 'className').slice(0, 20) },
      { id: 'attachment', label: 'Attachment', options: ['With document', 'Without document'] },
    ],
    onFilter: (id, value, allv, table) => {
      let out = activeTab === 'all' ? all.slice() : all.filter((r) => r.status.toLowerCase() === activeTab);
      if (allv.q) out = search(out, allv.q, ['studentName', 'reason', 'type']);
      if (allv.type && allv.type !== 'all') out = out.filter((r) => r.type === allv.type);
      if (allv.className && allv.className !== 'all') out = out.filter((r) => r.className === allv.className);
      if (allv.attachment === 'With document') out = out.filter((r) => !!r.attachment);
      if (allv.attachment === 'Without document') out = out.filter((r) => !r.attachment);
      table.refresh(out);
    },
    columns: [
      { key: 'studentName', label: 'Student', width: 240, sticky: true, render: (r) => Identity(r.studentName, `${r.className} — ${r.section}`), value: (r) => r.studentName },
      { key: 'type', label: 'Type', width: 150, filter: true, render: (r) => Badge(r.type, { tone: 'neutral' }) },
      { key: 'fromDate', label: 'From', width: 120, render: (r) => formatDate(r.fromDate), value: (r) => r.fromDate },
      { key: 'toDate', label: 'To', width: 120, render: (r) => formatDate(r.toDate), value: (r) => r.toDate },
      { key: 'days', label: 'Days', width: 80, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'reason', label: 'Reason', width: 300, render: (r) => h('span', { className: 't-sm t-clamp-2' }, r.reason) },
      { key: 'appliedOn', label: 'Applied', width: 130, render: (r) => relativeTime(r.appliedOn), value: (r) => r.appliedOn },
      { key: 'attachment', label: 'Document', width: 130, render: (r) => (r.attachment ? Badge('Attached', { tone: 'info', icon: 'paperclip' }) : h('span', { className: 't-faint' }, '—')) },
      { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
    ],
    rows: pending,
    onApprove: (row) => notify({ title: 'Leave approved', text: `${row.studentName} · ${row.days} day(s) from ${formatDate(row.fromDate)}`, tone: 'success' }),
    onReject: (row) => notify({ title: 'Leave rejected', text: `${row.studentName} — the parent will be notified with a reason.`, tone: 'danger' }),
    detail: (row) => {
      const st = byId(db.students, row.studentId);
      return h('div', { className: 'stack-3' },
        st ? profileHeaderLite(st) : null,
        DescriptionList([
          ['Leave type', row.type], ['Duration', `${row.days} day(s)`],
          ['From', formatDate(row.fromDate, 'long')], ['To', formatDate(row.toDate, 'long')],
          ['Applied by', row.appliedBy], ['Applied on', formatDate(row.appliedOn, 'long')],
          ['Attendance to date', st ? `${st.attendancePct}%` : '—'],
          ['Leave taken this year', `${Math.round(rand01(row.id) * 12)} days`],
        ], { cols: 2 }),
        Callout({ tone: 'info', icon: 'message-square', title: 'Reason stated by the parent' }, row.reason),
        st && st.attendancePct < 78
          ? Callout({ tone: 'danger', icon: 'alert-triangle', title: 'Attendance risk' },
            `${st.name} is at ${st.attendancePct}% — approving ${row.days} more day(s) will take the student below the 75% board eligibility threshold.`)
          : null,
        row.attachment ? SectionCard({ title: 'Supporting document', icon: 'paperclip' },
          h('div', { className: 'row' }, Icon('file-text', 16), h('span', { className: 't-sm flex-1' }, row.attachment),
            Button('Download', { variant: 'ghost', size: 'sm', icon: 'download', onClick: mockAction('Download attachment') }))) : null);
    },
  });

  mount.appendChild(node);
}

function profileHeaderLite(st) {
  return Card({ pad: true },
    h('div', { className: 'row-3' },
      Avatar(st.name, { size: 'lg', initials: st.avatarInitials }),
      h('div', { className: 'flex-1 stack-1' },
        h('div', { className: 't-semibold' }, st.name),
        h('div', { className: 't-sm t-muted' }, `${st.className} — ${st.section} · ${st.admissionNo} · ${st.house} House`),
        h('div', { className: 'row-3 row-wrap' },
          Badge(st.status), Badge(`${st.attendancePct}% attendance`, { tone: pctTone(st.attendancePct) }))),
      Button('Open 360 profile', { variant: 'ghost', size: 'sm', icon: 'external-link', route: `students/profile/${st.id}` })));
}

/* ==========================================================================
   8. ATTENDANCE — late / early records
   ========================================================================== */

function renderLateEarly(mount, ctx) {
  ensureStyles();
  const cid = campusOf(ctx);
  let all = db.lateRecords.filter((r) => r.campusId === cid);
  if (!all.length) all = db.lateRecords.slice();

  const lateOnly = all.filter((r) => r.type === 'Late Arrival');
  const early = all.filter((r) => r.type === 'Early Departure');
  const avgLate = lateOnly.length ? Math.round(avg(lateOnly, 'minutesLate')) : 0;
  const repeat = [];
  for (const [name, list] of groupBy(all, 'studentName')) if (list.length >= 2) repeat.push({ name, count: list.length });
  repeat.sort((a, b) => b.count - a.count);

  const byReason = countBy(all, 'reason');
  const buckets = [
    { key: '≤10 min', value: all.filter((r) => r.minutesLate <= 10).length },
    { key: '11–20 min', value: all.filter((r) => r.minutesLate > 10 && r.minutesLate <= 20).length },
    { key: '21–30 min', value: all.filter((r) => r.minutesLate > 20 && r.minutesLate <= 30).length },
    { key: '31–45 min', value: all.filter((r) => r.minutesLate > 30).length },
  ];

  const node = listPage({
    title: 'Late Arrivals & Early Departures',
    subtitle: `${formatNumber(all.length)} gate exceptions recorded this term · escalation after the third instance in a month`,
    route: 'attendance/late-early',
    actions: pageActions(
      Button('Gate device log', { variant: 'secondary', icon: 'fingerprint', route: 'attendance/devices' }),
      Button('Notify repeat offenders', {
        variant: 'primary', icon: 'send',
        onClick: () => ConfirmDialog({
          title: `Notify ${repeat.length} families?`,
          text: 'An SMS and an app notification go to the primary guardian of every student with two or more late marks.',
          confirmLabel: 'Send notifications', tone: 'brand', icon: 'send',
        }).then((ok) => ok && notify({ title: `${repeat.length} notifications queued`, tone: 'success' })),
      })),
    kpis: [
      { label: 'Total records', value: formatNumber(all.length), icon: 'timer', tone: 'brand' },
      { label: 'Late arrivals', value: formatNumber(lateOnly.length), icon: 'clock', tone: 'warning' },
      { label: 'Early departures', value: formatNumber(early.length), icon: 'log-out', tone: 'info' },
      { label: 'Average delay', value: `${avgLate} min`, icon: 'gauge', tone: 'danger', footer: `${repeat.length} repeat offenders` },
    ],
    chart: h('div', { className: 'widget-grid' },
      h('div', { className: 'span-7' }, barChart({
        categories: buckets.map((b) => b.key),
        series: [{ name: 'Students', values: buckets.map((b) => b.value) }],
        height: 230, showValues: true, title: 'How late students arrive, bucketed by minutes',
      })),
      h('div', { className: 'span-5' }, donutChart({
        data: byReason.slice(0, 6), height: 230, centerLabel: 'Records',
        centerValue: formatNumber(all.length), title: 'Reasons given for late arrival',
      }))),
    chartTitle: 'Delay profile and stated reasons',
    filters: [
      { id: 'q', type: 'search', label: 'Search', placeholder: 'Student, class or reason…' },
      { id: 'type', label: 'Type', options: ['Late Arrival', 'Early Departure'] },
      { id: 'className', label: 'Class', options: distinct(all, 'className').slice(0, 20) },
      { id: 'reason', label: 'Reason', options: distinct(all, 'reason') },
      { id: 'action', label: 'Action taken', options: distinct(all, 'actionTaken') },
    ],
    onFilter: (id, value, allv, table) => {
      let out = all.slice();
      if (allv.q) out = search(out, allv.q, ['studentName', 'className', 'reason']);
      ['type', 'className', 'reason'].forEach((k) => { if (allv[k] && allv[k] !== 'all') out = out.filter((r) => r[k] === allv[k]); });
      if (allv.action && allv.action !== 'all') out = out.filter((r) => r.actionTaken === allv.action);
      table.refresh(out);
    },
    columns: [
      { key: 'studentName', label: 'Student', width: 240, sticky: true, render: (r) => Identity(r.studentName, `${r.className} — ${r.section}`), value: (r) => r.studentName },
      { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date), value: (r) => r.date },
      { key: 'type', label: 'Type', width: 160, filter: true, render: (r) => Badge(r.type, { tone: r.type === 'Late Arrival' ? 'warning' : 'info' }) },
      { key: 'inTime', label: 'Gate time', width: 110, className: 't-mono' },
      {
        key: 'minutesLate', label: 'Minutes', width: 130, align: 'right', numeric: true, aggregate: 'avg',
        format: (v) => `${Math.round(v)} min`,
        render: (r) => h('span', { className: r.minutesLate > 25 ? 't-danger t-num t-semibold' : 't-num' }, `${r.minutesLate} min`),
        value: (r) => r.minutesLate,
      },
      { key: 'reason', label: 'Reason', width: 220, filter: true },
      { key: 'actionTaken', label: 'Action taken', width: 170, filter: true, render: (r) => Badge(r.actionTaken, { tone: r.actionTaken === 'None' ? 'neutral' : 'brand' }) },
    ],
    rows: all,
    selectable: true, footerAggregates: true, pageSize: 25,
    searchKeys: ['studentName', 'className', 'reason'],
    bulkActions: [
      { label: 'Notify parents', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} parent alerts queued`, tone: 'success' }) },
      { label: 'Issue warning letter', icon: 'file-text', onClick: (sel) => notify({ title: `${sel.length} warning letters generated`, tone: 'warning' }) },
      { label: 'Mark counselled', icon: 'handshake', tone: 'success', onClick: (sel) => notify({ title: `${sel.length} records updated`, tone: 'success' }) },
    ],
    rowActions: (r) => [
      { label: 'Open student profile', icon: 'eye', route: `students/profile/${r.studentId}` },
      { label: 'Call guardian', icon: 'phone-call', onClick: mockAction('Call guardian') },
      { separator: true },
      { label: 'Raise a correction', icon: 'refresh-ccw', route: 'attendance/corrections' },
    ],
    onRowClick: (r) => navigate(`students/profile/${r.studentId}`),
    emptyState: EmptyState({ icon: 'timer', title: 'No late records', text: 'No gate exceptions were logged for the selected filters.' }),
    exportName: 'late-early-records',
    notes: repeat.length ? Callout({ tone: 'warning', icon: 'alert-triangle', title: `${repeat.length} students have two or more late marks` },
      `Top repeat offenders: ${repeat.slice(0, 5).map((r) => `${r.name} (${r.count})`).join(', ')}.`) : null,
    tableTitle: 'Gate exception log',
  });

  mount.appendChild(node);
}

/* ==========================================================================
   9. ATTENDANCE — biometric / RFID devices
   ========================================================================== */

function renderDevices(mount, ctx) {
  ensureStyles();
  const cid = campusOf(ctx);
  let all = db.biometricDevices.filter((d) => d.campusId === cid);
  if (!all.length) all = db.biometricDevices.slice();
  const campusName = (byId(db.campuses, cid) || {}).name || 'All campuses';

  const online = all.filter((d) => d.status === 'Online').length;
  const punches = sum(all, 'punchesToday');
  const byType = countBy(all, 'type');

  const deviceDrawer = (d) => {
    const hourly = Array.from({ length: 12 }, (_, i) => Math.round(rand01(d.id + i) * (d.punchesToday / 6)));
    Drawer({
      title: d.name, subtitle: `${d.type} · ${d.location} · ${d.serial}`, size: 'lg',
      body: h('div', { className: 'stack-3' },
        h('div', { className: 'row-3 row-wrap' }, Badge(d.status), Badge(d.type, { tone: 'neutral' }), Badge(`Firmware ${d.firmware}`, { tone: 'info' })),
        kpiRow([
          { label: 'Punches today', value: formatNumber(d.punchesToday), icon: 'fingerprint', tone: 'brand' },
          { label: 'Last sync', value: formatDateTime(d.lastSync, 'short'), icon: 'refresh', tone: d.status === 'Online' ? 'success' : 'danger' },
          { label: 'Uptime (30d)', value: `${Math.round(94 + rand01(d.id + 'u') * 5)}%`, icon: 'activity', tone: 'success' },
        ]),
        SectionCard({ title: 'Punches by hour', className: 'chart-card' },
          barChart({
            categories: ['06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17'],
            series: [{ name: 'Punches', values: hourly }], height: 200,
            title: 'Punch volume through the school day',
          })),
        SectionCard({ title: 'Device details', icon: 'cpu' },
          DescriptionList([
            ['Device ID', d.id], ['Serial number', d.serial], ['IP address', d.ip],
            ['Location', d.location], ['Campus', campusName], ['Type', d.type],
            ['Firmware', d.firmware], ['Status', d.status],
          ], { cols: 2 })),
        SectionCard({ title: 'Recent events', icon: 'history' },
          Timeline([
            { title: 'Sync completed', meta: formatDateTime(d.lastSync, 'short'), text: `${formatNumber(d.punchesToday)} punches pushed to the attendance engine.`, icon: 'refresh', tone: 'success' },
            { title: 'Firmware check', meta: '19 Aug 2026, 22:10', text: `Running ${d.firmware} — no update pending.`, icon: 'cpu', tone: 'info' },
            { title: 'Enrolment refresh', meta: '18 Aug 2026, 06:00', text: 'Template database refreshed with 2,400 student and 380 staff records.', icon: 'users', tone: 'brand' },
            d.status !== 'Online' ? { title: 'Device unreachable', meta: '20 Aug 2026, 07:05', text: 'The controller did not respond to three consecutive heartbeats.', icon: 'alert-triangle', tone: 'danger' } : null,
          ].filter(Boolean))),
      ),
      actions: (close) => frag(
        Button('Close', { variant: 'ghost', onClick: close }),
        Button('Force sync', { variant: 'secondary', icon: 'refresh', onClick: () => notify({ title: 'Sync triggered', text: d.name, tone: 'success' }) }),
        Button('Restart device', {
          variant: 'danger', icon: 'zap',
          onClick: () => ConfirmDialog({
            title: 'Restart this device?', text: `${d.name} will be offline for about 40 seconds. Punches during that window are buffered on the reader.`,
            confirmLabel: 'Restart', tone: 'danger', icon: 'alert-triangle',
          }).then((ok) => { if (ok) { close(); notify({ title: 'Restart command sent', text: d.name, tone: 'warning' }); } }),
        })),
    });
  };

  const node = listPage({
    title: 'Biometric & RFID Devices',
    subtitle: `${formatNumber(all.length)} readers across gates, wings and the hostel · ${campusName}`,
    route: 'attendance/devices',
    actions: pageActions(
      Button('Sync all', {
        variant: 'secondary', icon: 'refresh',
        onClick: () => notify({ title: 'Sync started', text: `${all.length} devices queued — results appear in the log below.`, tone: 'info' }),
      }),
      Button('Register device', {
        variant: 'primary', icon: 'plus',
        onClick: () => formPage({
          title: 'Register a device', mode: 'modal', size: 'lg',
          submitLabel: 'Register device',
          sections: [{
            title: 'Device', description: 'Readers must be on the school VLAN before they can be registered.', cols: 2,
            fields: [
              { id: 'name', label: 'Device name', required: true, placeholder: 'GGN-MainGate-02', validate: validators.required },
              { id: 'serial', label: 'Serial number', required: true, validate: validators.required },
              { id: 'type', label: 'Reader type', type: 'select', required: true, options: ['Fingerprint', 'RFID', 'Face Recognition', 'RFID + Fingerprint'] },
              { id: 'location', label: 'Location', type: 'select', options: ['Main Gate', 'Staff Block', 'Primary Wing', 'Senior Wing', 'Hostel Gate'] },
              { id: 'ip', label: 'IP address', required: true, placeholder: '10.4.22.18', validate: validators.required },
              { id: 'campus', label: 'Campus', type: 'select', options: db.campuses.map((c) => ({ value: c.id, label: c.name })) },
              { id: 'mode', label: 'Capture mode', type: 'radio', inline: true, options: ['In only', 'In and Out'] },
              { id: 'active', label: 'Enable immediately', type: 'switch', value: true },
              { id: 'notes', label: 'Installation notes', type: 'textarea', span: 'full' },
            ],
          }],
          onSubmit: (v) => notify({ title: 'Device registered', text: `${v.name || 'New reader'} added — enrolment templates will sync at 06:00.`, tone: 'success' }),
        }),
      })),
    kpis: [
      { label: 'Devices', value: formatNumber(all.length), icon: 'fingerprint', tone: 'brand' },
      { label: 'Online', value: `${online} / ${all.length}`, icon: 'wifi', tone: online === all.length ? 'success' : 'warning' },
      { label: 'Punches today', value: formatNumber(punches), icon: 'activity', tone: 'info', trend: analytics.sparks.attendance },
      { label: 'Needs attention', value: String(all.length - online), icon: 'alert-triangle', tone: all.length - online ? 'danger' : 'success' },
    ],
    chart: h('div', { className: 'widget-grid' },
      h('div', { className: 'span-8' }, barChart({
        categories: all.map((d) => d.name.replace(/^[A-Z0-9]+-/, '')),
        series: [{ name: 'Punches today', values: all.map((d) => d.punchesToday) }],
        horizontal: false, height: 240, title: 'Punches captured today by reader',
      })),
      h('div', { className: 'span-4' }, donutChart({
        data: byType, height: 240, centerLabel: 'Readers', centerValue: String(all.length),
        title: 'Device mix by reader technology',
      }))),
    chartTitle: 'Device throughput and mix',
    filters: [
      { id: 'q', type: 'search', label: 'Search', placeholder: 'Name, serial or IP…' },
      { id: 'status', label: 'Status', options: ['Online', 'Offline', 'Maintenance'] },
      { id: 'type', label: 'Type', options: distinct(all, 'type') },
      { id: 'location', label: 'Location', options: distinct(all, 'location') },
    ],
    onFilter: (id, value, allv, table) => {
      let out = all.slice();
      if (allv.q) out = search(out, allv.q, ['name', 'serial', 'ip', 'location']);
      ['status', 'type', 'location'].forEach((k) => { if (allv[k] && allv[k] !== 'all') out = out.filter((r) => r[k] === allv[k]); });
      table.refresh(out);
    },
    columns: [
      { key: 'name', label: 'Device', width: 220, sticky: true, render: (r) => Identity(r.name, `${r.location} · ${r.serial}`), value: (r) => r.name },
      { key: 'type', label: 'Type', width: 190, filter: true, render: (r) => Badge(r.type, { tone: 'neutral', icon: 'fingerprint' }) },
      { key: 'ip', label: 'IP address', width: 140, className: 't-mono' },
      { key: 'firmware', label: 'Firmware', width: 110, className: 't-mono' },
      { key: 'punchesToday', label: 'Punches today', width: 150, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'lastSync', label: 'Last sync', width: 160, render: (r) => relativeTime(r.lastSync), value: (r) => r.lastSync },
      { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status, { dot: true }) },
    ],
    rows: all,
    selectable: true, footerAggregates: true, pageSize: 25,
    searchKeys: ['name', 'serial', 'ip', 'location'],
    bulkActions: [
      { label: 'Sync selected', icon: 'refresh', onClick: (sel) => notify({ title: `${sel.length} devices syncing`, tone: 'info' }) },
      { label: 'Push firmware', icon: 'upload', onClick: (sel) => notify({ title: `Firmware push queued for ${sel.length} devices`, tone: 'success' }) },
      { label: 'Mark for maintenance', icon: 'wrench', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} devices flagged`, tone: 'warning' }) },
    ],
    rowActions: (r) => [
      { label: 'Inspect device', icon: 'eye', onClick: () => deviceDrawer(r) },
      { label: 'Force sync', icon: 'refresh', onClick: () => notify({ title: 'Sync triggered', text: r.name, tone: 'success' }) },
      { label: 'Copy IP', icon: 'copy', onClick: () => copyToClipboard(r.ip, `${r.ip} copied`) },
      { separator: true },
      { label: 'Decommission', icon: 'trash', tone: 'danger', onClick: () => ConfirmDialog({ title: 'Decommission device?', text: `${r.name} will stop feeding the attendance engine immediately.`, confirmLabel: 'Decommission', tone: 'danger' }).then((ok) => ok && notify({ title: 'Device decommissioned', tone: 'danger' })) },
    ],
    onRowClick: deviceDrawer,
    emptyState: EmptyState({ icon: 'fingerprint', title: 'No devices registered', text: 'Register the first reader to start capturing biometric attendance.' }),
    exportName: 'attendance-devices',
    tableTitle: 'Reader inventory',
    notes: online < all.length ? Callout({ tone: 'danger', icon: 'wifi', title: `${all.length - online} readers are not reporting` },
      'Punches are buffered locally for up to 24 hours. Check the network switch in the affected block, then trigger a manual sync.') : null,
  });

  mount.appendChild(node);
}

/* ==========================================================================
   10. ATTENDANCE — defaulters (<75%)
   ========================================================================== */

function renderDefaulters(mount, ctx) {
  ensureStyles();
  const cid = campusOf(ctx);
  let pool = db.students.filter((s) => s.campusId === cid && s.status === 'Active' && s.attendancePct < 75);
  if (!pool.length) pool = db.students.filter((s) => s.status === 'Active' && s.attendancePct < 75);
  const all = sortBy(pool, 'attendancePct', 'asc').map((s) => ({
    id: s.id, name: s.name, admissionNo: s.admissionNo, avatarInitials: s.avatarInitials,
    className: s.className, classLevel: s.classLevel, section: s.section, house: s.house,
    percent: s.attendancePct, present: s.presentDays, total: s.totalDays,
    shortfall: Math.max(0, Math.ceil(0.75 * s.totalDays - s.presentDays)),
    guardian: s.guardianName, phone: s.phone, emergency: s.emergencyContact,
    band: s.attendancePct < 60 ? 'Critical (<60%)' : s.attendancePct < 70 ? 'Severe (60–70%)' : 'At risk (70–75%)',
    transportOpted: s.transportOpted, feeStatus: s.feeStatus,
  }));

  const critical = all.filter((r) => r.percent < 60).length;
  const byClass = [];
  for (const [name, list] of groupBy(all, 'className')) byClass.push({ key: name, value: list.length, level: (list[0] && list[0].classLevel) || 0 });
  byClass.sort((a, b) => a.level - b.level);

  const notifyBulk = (sel) => {
    let channel = 'SMS + App';
    let template = 'Attendance shortfall — first notice';
    const body = h('div', { className: 'stack-3' },
      Callout({ tone: 'warning', icon: 'alert-triangle', title: `${sel.length} families selected` },
        'CBSE requires 75% attendance for board examination eligibility. This notice is logged against the student record.'),
      FormGrid({ cols: 2 },
        Field({ label: 'Channel', required: true }, Select({
          options: ['SMS + App', 'SMS only', 'Email only', 'SMS + Email + App', 'WhatsApp'],
          value: channel, onChange: (v) => { channel = v; },
        })),
        Field({ label: 'Template', required: true }, Select({
          options: ['Attendance shortfall — first notice', 'Attendance shortfall — final warning', 'Meeting request with class teacher'],
          value: template, onChange: (v) => { template = v; },
        }))),
      Field({ label: 'Message preview', hint: 'Variables are substituted per student when the batch is sent.' },
        Textarea({
          rows: 5,
          value: 'Dear {{guardian}}, our records show {{student}} of {{class}} has attended {{present}} of {{total}} days ({{percent}}%). CBSE requires a minimum of 75%. Please meet the class teacher this week. — Springdale International School',
        })),
      SectionCard({ title: 'Recipients', icon: 'users', flush: true },
        h('div', { className: 'card-pad' },
          RankList(sel.slice(0, 8).map((r) => ({ name: r.name, meta: `${r.className} — ${r.section} · ${r.guardian}`, value: `${r.percent}%` }))),
          sel.length > 8 ? h('div', { className: 't-xs t-muted mt-2' }, `+ ${sel.length - 8} more recipients`) : null)));

    Modal({
      title: 'Notify parents of attendance shortfall', icon: 'send', size: 'lg', tone: 'warning',
      subtitle: 'Batch notice to the primary guardian of every selected student',
      body,
      actions: (close) => frag(
        Button('Cancel', { variant: 'ghost', onClick: close }),
        Button('Send now', {
          variant: 'primary', icon: 'send',
          onClick: () => { close(); notify({ title: `${sel.length} notices queued`, text: `${channel} · ${template}`, tone: 'success' }); },
        })),
    });
  };

  const node = listPage({
    title: 'Attendance Defaulters',
    subtitle: `${formatNumber(all.length)} students below the 75% CBSE eligibility threshold · attendance computed to ${formatDate(TODAY, 'long')}`,
    route: 'attendance/defaulters',
    actions: pageActions(
      Button('Attendance reports', { variant: 'secondary', icon: 'chart-bar', route: 'attendance/reports' }),
      Button('Notify all parents', { variant: 'primary', icon: 'send', onClick: () => notifyBulk(all) })),
    kpis: [
      { label: 'Defaulters', value: formatNumber(all.length), delta: 6.2, deltaLabel: 'vs last month', deltaDir: 'up', icon: 'alert-triangle', tone: 'danger' },
      { label: 'Critical (<60%)', value: formatNumber(critical), icon: 'x-circle', tone: 'danger' },
      { label: 'Average shortfall', value: `${all.length ? Math.round(avg(all, 'shortfall')) : 0} days`, icon: 'calendar', tone: 'warning' },
      { label: 'Campus attendance', value: `${analytics.kpis.avgAttendance}%`, icon: 'percent', tone: 'info', trend: analytics.sparks.attendance },
    ],
    chart: h('div', { className: 'widget-grid' },
      h('div', { className: 'span-7' }, barChart({
        categories: byClass.map((c) => c.key),
        series: [{ name: 'Defaulters', values: byClass.map((c) => c.value) }],
        height: 240, showValues: true, title: 'Number of defaulters in each class',
      })),
      h('div', { className: 'span-5' }, donutChart({
        data: [
          { key: 'Critical (<60%)', value: all.filter((r) => r.percent < 60).length },
          { key: 'Severe (60–70%)', value: all.filter((r) => r.percent >= 60 && r.percent < 70).length },
          { key: 'At risk (70–75%)', value: all.filter((r) => r.percent >= 70).length },
        ],
        height: 240, centerLabel: 'Students', centerValue: String(all.length),
        title: 'Defaulters split by severity band',
      }))),
    chartTitle: 'Where the shortfall sits',
    filters: [
      { id: 'q', type: 'search', label: 'Search', placeholder: 'Name, admission no or guardian…' },
      { id: 'className', label: 'Class', options: byClass.map((c) => c.key) },
      { id: 'band', label: 'Severity', options: ['Critical (<60%)', 'Severe (60–70%)', 'At risk (70–75%)'] },
      { id: 'house', label: 'House', options: db.houses.map((x) => x.name) },
    ],
    onFilter: (id, value, allv, table) => {
      let out = all.slice();
      if (allv.q) out = search(out, allv.q, ['name', 'admissionNo', 'guardian']);
      ['className', 'band', 'house'].forEach((k) => { if (allv[k] && allv[k] !== 'all') out = out.filter((r) => r[k] === allv[k]); });
      table.refresh(out);
    },
    columns: [
      { key: 'name', label: 'Student', width: 250, sticky: true, render: (r) => Identity(r.name, `${r.admissionNo} · ${r.className} — ${r.section}`), value: (r) => r.name },
      { key: 'house', label: 'House', width: 110, filter: true, render: (r) => Badge(r.house, { tone: 'neutral' }) },
      { key: 'present', label: 'Present', width: 100, align: 'right', numeric: true },
      { key: 'total', label: 'Working days', width: 130, align: 'right', numeric: true },
      {
        key: 'percent', label: 'Attendance', width: 160, align: 'right', numeric: true, aggregate: 'avg',
        format: (v) => `${Math.round(v * 10) / 10}%`,
        render: (r) => h('div', { className: 'row', style: { justifyContent: 'flex-end', gap: 'var(--sp-2)' } },
          h('span', { className: 't-num t-semibold t-danger' }, `${r.percent}%`),
          h('span', { style: { width: '54px' } }, ProgressBar(r.percent, { tone: 'danger', size: 'sm' }))),
        value: (r) => r.percent,
      },
      { key: 'shortfall', label: 'Days short', width: 120, align: 'right', numeric: true, aggregate: 'sum', render: (r) => h('span', { className: 't-num t-semibold' }, `${r.shortfall}`) },
      { key: 'band', label: 'Severity', width: 170, filter: true, render: (r) => Badge(r.band, { tone: r.percent < 60 ? 'danger' : r.percent < 70 ? 'warning' : 'info' }) },
      { key: 'guardian', label: 'Guardian', width: 200 },
      { key: 'phone', label: 'Contact', width: 160, className: 't-mono', hidden: true },
      { key: 'feeStatus', label: 'Fee status', width: 130, filter: true, hidden: true, render: (r) => Badge(r.feeStatus) },
    ],
    rows: all,
    selectable: true, footerAggregates: true, pageSize: 25,
    searchKeys: ['name', 'admissionNo', 'guardian', 'className'],
    bulkActions: [
      { label: 'Notify parents', icon: 'send', onClick: notifyBulk },
      { label: 'Schedule counselling', icon: 'handshake', onClick: (sel) => notify({ title: `${sel.length} counselling slots requested`, text: 'Sent to the wellness coordinator.', tone: 'success' }) },
      { label: 'Generate warning letters', icon: 'file-text', onClick: (sel) => notify({ title: `${sel.length} letters generated`, text: 'Ready for the principal to sign.', tone: 'info' }) },
      { label: 'Flag for board eligibility review', icon: 'flag', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} students flagged`, tone: 'danger' }) },
    ],
    rowActions: (r) => [
      { label: 'Open 360 profile', icon: 'eye', route: `students/profile/${r.id}` },
      { label: 'Monthly register', icon: 'table', route: 'attendance/monthly-register' },
      { label: 'Notify parent', icon: 'send', onClick: () => notifyBulk([r]) },
      { separator: true },
      { label: 'Record counselling note', icon: 'notebook', onClick: mockAction('Record counselling note') },
    ],
    onRowClick: (r) => navigate(`students/profile/${r.id}`),
    emptyState: EmptyState({
      icon: 'check-circle', title: 'No defaulters', tone: 'success',
      text: 'Every active student on this campus is at or above the 75% threshold.',
    }),
    exportName: 'attendance-defaulters',
    tableTitle: 'Students below 75%',
    tableSubtitle: 'Select rows to send a batch notice to guardians.',
    notes: Callout({ tone: 'danger', icon: 'alert-triangle', title: 'Board eligibility rule' },
      'CBSE requires 75% attendance in the academic session for Class X and XII board registration. Students below the line need a documented medical exemption approved by the principal.'),
  });

  mount.appendChild(node);
}

/* ==========================================================================
   11. ATTENDANCE — reports
   ========================================================================== */

function renderAttendanceReports(mount, ctx) {
  ensureStyles();
  const cid = campusOf(ctx);
  const cal = analytics.attendanceCalendar.filter((d) => d.value != null);
  const byClass = analytics.attendanceByClass;
  const trend = analytics.attendanceTrend;

  const rows = byClass.map((c) => {
    const seed = 'rep' + c.className;
    const present = Math.round(c.strength * (c.percent / 100));
    return {
      className: c.className, level: c.level, strength: c.strength,
      percent: c.percent, present, absent: c.strength - present,
      late: Math.round(rand01(seed + 'l') * 22),
      leave: Math.round(rand01(seed + 'v') * 14),
      defaulters: Math.round(rand01(seed + 'd') * 9),
      bestSection: ['A', 'B', 'C', 'D'][hash32(seed) % 4],
      target: 90,
      variance: Math.round((c.percent - 90) * 10) / 10,
    };
  }).sort((a, b) => a.level - b.level);

  const node = reportPage({
    title: 'Attendance Reports',
    subtitle: `Analytical pack for ${(byId(db.campuses, cid) || {}).name || 'all campuses'} · academic year 2026-27 (April–March)`,
    route: 'attendance/reports',
    filters: [
      { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'month', label: 'This month' }, { id: 'term', label: 'Term 1' }, { id: 'ytd', label: 'Year to date' }] },
      { id: 'campus', label: 'Campus', options: db.campuses.map((c) => c.name) },
      { id: 'stage', label: 'Stage', options: distinct(db.classes, 'stage') },
      { id: 'from', label: 'From', type: 'date', value: '2026-04-01' },
      { id: 'to', label: 'To', type: 'date', value: TODAY },
    ],
    onFilter: (id, value, allv, table) => {
      let out = rows.slice();
      if (allv.stage && allv.stage !== 'all') {
        const levels = new Set(db.classes.filter((c) => c.stage === allv.stage).map((c) => c.level));
        out = out.filter((r) => levels.has(r.level));
      }
      table.refresh(out);
      notify({ title: 'Report refreshed', text: `${out.length} classes in scope`, tone: 'info' });
    },
    summary: [
      { label: 'Average attendance', value: `${analytics.kpis.avgAttendance}%`, delta: 1.2, deltaLabel: 'vs last term', icon: 'percent', tone: 'success', trend: analytics.sparks.attendance },
      { label: 'Best class', value: sortBy(byClass, 'percent', 'desc')[0].className, icon: 'trophy', tone: 'brand', footer: `${sortBy(byClass, 'percent', 'desc')[0].percent}% average` },
      { label: 'Weakest class', value: sortBy(byClass, 'percent', 'asc')[0].className, icon: 'trending-down', tone: 'danger', footer: `${sortBy(byClass, 'percent', 'asc')[0].percent}% average` },
      { label: 'Defaulters', value: formatNumber(analytics.attendanceDefaulters.length), icon: 'alert-triangle', tone: 'warning', onClick: () => navigate('attendance/defaulters') },
    ],
    chart: [
      (() => {
        const c = SectionCard({ title: 'Daily attendance heatmap — April to August 2026', className: 'chart-card' },
          heatmap({ mode: 'calendar', days: cal, seriesName: 'Attendance %', min: 78, max: 100, title: 'Calendar heatmap of daily attendance percentage' }),
          h('div', { className: 'mt-3' }, ScaleLegend(78, 100, { format: 'percent0' })));
        c.__titled = true;
        return c;
      })(),
      (() => {
        const c = SectionCard({ title: 'Student versus staff attendance trend', className: 'chart-card' },
          lineChart({
            categories: trend.map((t) => t.month),
            series: [
              { name: 'Students', values: trend.map((t) => t.students) },
              { name: 'Staff', values: trend.map((t) => t.staff) },
            ],
            valueFormat: 'percent', target: 90, targetLabel: 'Target', height: 270, showDots: true,
            title: 'Monthly average attendance for students and staff against the 90% target',
          }));
        c.__titled = true;
        return c;
      })(),
      (() => {
        const c = SectionCard({ title: 'Class comparison against target', className: 'chart-card' },
          bulletChart({
            items: sortBy(byClass, 'percent', 'asc').slice(0, 10).map((r) => ({ label: r.className, value: r.percent, target: 90, ranges: [75, 85, 100] })),
            valueFormat: 'percent', height: 320,
            title: 'The ten weakest classes measured against the 90% target',
          }));
        c.__titled = true;
        return c;
      })(),
    ],
    columns: [
      { key: 'className', label: 'Class', width: 130, sticky: true, value: (r) => r.level, render: (r) => h('span', { className: 't-semibold' }, r.className) },
      { key: 'strength', label: 'Strength', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'present', label: 'Present', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'absent', label: 'Absent', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'late', label: 'Late', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'leave', label: 'Leave', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
      {
        key: 'percent', label: 'Attendance', width: 150, align: 'right', numeric: true, aggregate: 'avg',
        format: (v) => `${Math.round(v * 10) / 10}%`,
        render: (r) => h('span', { className: `t-num t-semibold t-${pctTone(r.percent)}` }, `${r.percent}%`),
        value: (r) => r.percent,
      },
      {
        key: 'variance', label: 'vs target', width: 120, align: 'right', numeric: true,
        render: (r) => h('span', { className: r.variance >= 0 ? 't-success t-num' : 't-danger t-num' }, `${r.variance > 0 ? '+' : ''}${r.variance} pp`),
        value: (r) => r.variance,
      },
      { key: 'defaulters', label: 'Defaulters', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'bestSection', label: 'Best section', width: 130, align: 'center' },
    ],
    rows,
    tableTitle: 'Class-wise attendance detail',
    footerAggregates: true,
    notes: Callout({ tone: 'info', icon: 'info', title: 'How this is computed' },
      'Attendance percentage = (present + late) ÷ working days. Sundays, gazetted holidays and declared school closures are excluded from the denominator, as required by the CBSE inspection format.'),
  });

  mount.appendChild(node);
}

/* ==========================================================================
   12. EXAMINATION — shared helpers
   ========================================================================== */

function subjectName(code) {
  const s = db.subjects.find((x) => x.code === code);
  return s ? s.name : code;
}

/** Pivot marks into one row per student with a column per subject. */
function studentMarkSheet(ctx, groupId, className) {
  const rows = marksFor(ctx).filter((m) => m.examGroupId === groupId && (!className || m.className === className));
  const map = new Map();
  for (const m of rows) {
    let e = map.get(m.studentId);
    if (!e) {
      e = {
        studentId: m.studentId, name: m.studentName, admissionNo: m.admissionNo,
        className: m.className, section: m.section, sectionId: m.sectionId,
        classId: m.classId, subjects: {}, obtained: 0, max: 0, failed: 0,
      };
      map.set(m.studentId, e);
    }
    e.subjects[m.subjectCode] = m;
    e.obtained += m.marksObtained;
    e.max += m.maxMarks;
    if (m.status === 'Fail') e.failed++;
  }
  const out = Array.from(map.values()).map((e) => {
    const percent = e.max ? Math.round((e.obtained / e.max) * 1000) / 10 : 0;
    return Object.assign({}, e, { percent, grade: gradeFor(percent), result: e.failed ? 'Fail' : 'Pass' });
  });
  out.sort((a, b) => b.percent - a.percent);
  out.forEach((r, i) => { r.rank = i + 1; });
  return out;
}

function subjectCodesForSheet(sheet) {
  const set = new Set();
  for (const r of sheet) Object.keys(r.subjects).forEach((c) => set.add(c));
  return Array.from(set);
}

function examClassOptions(ctx) {
  const names = distinct(examsFor(ctx), 'className');
  const order = new Map(db.classes.map((c) => [c.name, c.level]));
  return names.sort((a, b) => (order.get(a) || 0) - (order.get(b) || 0));
}

function examGroupOptionsList() { return examGroupOptions(); }

/* ==========================================================================
   13. EXAMINATION — exam setup (wizard)
   ========================================================================== */

function renderExamSetup(mount, ctx) {
  ensureStyles();
  const groups = db.examGroups;
  const exams = examsFor(ctx);

  mount.appendChild(formPage({
    title: 'Exam Setup',
    subtitle: 'Four steps: identity, scope, marking scheme and publication rules. Everything stays editable until the datesheet is published.',
    route: 'examination/setup',
    mode: 'wizard',
    submitLabel: 'Create examination',
    values: { academicYear: 'AY2026', term: 'Term 2', weightage: 30, maxMarks: 100, passMarks: 33, gradeScale: 'GS1', duration: 180 },
    steps: [
      {
        id: 'identity', label: 'Identity', description: 'Name the cycle and place it in the calendar',
        sections: [{
          title: 'Examination identity', description: 'This name appears on the datesheet, the hall ticket and the report card.', cols: 2,
          fields: [
            { id: 'name', label: 'Examination name', required: true, placeholder: 'Half Yearly Examination', validate: validators.required },
            { id: 'code', label: 'Short code', required: true, placeholder: 'HY-2026', validate: validators.required },
            { id: 'academicYear', label: 'Academic year', type: 'select', required: true, options: db.academicYears.map((y) => ({ value: y.id, label: y.name })) },
            { id: 'term', label: 'Term', type: 'select', required: true, options: ['Term 1', 'Term 2'] },
            { id: 'from', label: 'Starts on', type: 'date', required: true, validate: validators.required },
            { id: 'to', label: 'Ends on', type: 'date', required: true, validate: validators.required },
            { id: 'description', label: 'Description', type: 'textarea', span: 'full', placeholder: 'Purpose of this cycle, board circular reference, anything the exam cell should know.' },
          ],
        }],
      },
      {
        id: 'scope', label: 'Scope', description: 'Campuses, classes and subjects in scope',
        sections: [{
          title: 'Applies to', cols: 2,
          fields: [
            { id: 'campuses', label: 'Campuses', type: 'multiselect', required: true, options: db.campuses.map((c) => c.name), value: [db.campuses[0].name] },
            { id: 'classes', label: 'Classes', type: 'multiselect', required: true, options: distinct(db.classes, 'name'), value: ['Class IX', 'Class X'] },
            { id: 'subjects', label: 'Subjects', type: 'multiselect', options: db.subjects.map((s) => s.name), value: ['English', 'Mathematics'] },
            { id: 'stream', label: 'Streams (XI–XII)', type: 'multiselect', options: ['Science', 'Commerce', 'Humanities'] },
            { id: 'excludeNew', label: 'Exclude students admitted after the cycle starts', type: 'switch', value: true, span: 'full' },
          ],
        }],
      },
      {
        id: 'marks', label: 'Marking', description: 'Marks, grading and weightage',
        sections: [{
          title: 'Marking scheme', cols: 3,
          fields: [
            { id: 'maxMarks', label: 'Maximum marks', type: 'number', required: true, validate: [validators.required, validators.number] },
            { id: 'passMarks', label: 'Pass marks', type: 'number', required: true, validate: [validators.required, validators.number] },
            { id: 'duration', label: 'Duration (minutes)', type: 'number', validate: validators.number },
            { id: 'gradeScale', label: 'Grade scale', type: 'select', options: db.gradeScales.map((g) => ({ value: g.id, label: g.name })) },
            { id: 'weightage', label: 'Weightage in final result (%)', type: 'number', hint: 'All cycles in a year must total 100%.', validate: validators.number },
            { id: 'practical', label: 'Practical component', type: 'select', options: ['None', '20 marks', '30 marks', '50 marks'] },
            { id: 'internal', label: 'Include internal assessment', type: 'switch', value: true },
            { id: 'negative', label: 'Negative marking on objective papers', type: 'switch', value: false },
            { id: 'graceMarks', label: 'Allow grace marks', type: 'switch', value: true },
          ],
        }],
      },
      {
        id: 'publish', label: 'Publication', description: 'Who sees the datesheet and the result',
        sections: [{
          title: 'Publication rules', cols: 2,
          fields: [
            { id: 'datesheetOn', label: 'Publish datesheet on', type: 'date' },
            { id: 'resultOn', label: 'Publish result on', type: 'date' },
            { id: 'audience', label: 'Visible to', type: 'multiselect', options: ['Students', 'Parents', 'Class teachers', 'Subject teachers', 'Management'], value: ['Students', 'Parents', 'Class teachers'] },
            { id: 'hallTicket', label: 'Hall tickets required', type: 'switch', value: true },
            { id: 'reeval', label: 'Allow re-evaluation requests', type: 'switch', value: true },
            { id: 'reevalWindow', label: 'Re-evaluation window (days)', type: 'number', value: 7, validate: validators.number },
            { id: 'notes', label: 'Notice to parents', type: 'textarea', span: 'full', placeholder: 'Appears on the datesheet PDF and the parent portal.' },
          ],
        }],
      },
    ],
    sidebar: [
      Callout({ tone: 'info', icon: 'info', title: 'Before you start' },
        `Weightages across every cycle in an academic year must add up to 100%. The current year is allocated ${sum(groups, 'weightage')}% across ${groups.length} cycles.`),
      SectionCard({ title: 'Existing cycles', icon: 'layers' },
        RankList(groups.map((g) => ({ name: g.name, meta: `${g.term} · ${formatDate(g.from, 'dayMonth')} – ${formatDate(g.to, 'dayMonth')}`, value: `${g.weightage}%` })))),
      SectionCard({ title: 'Weightage split', className: 'chart-card' },
        donutChart({
          data: groups.map((g) => ({ key: g.name, value: g.weightage })),
          height: 220, centerLabel: 'Allocated', centerValue: `${sum(groups, 'weightage')}%`, maxSlices: 6,
          title: 'Share of the final result carried by each examination cycle',
        })),
      SectionCard({ title: 'Papers already scheduled', icon: 'file-text' },
        DescriptionList([
          ['Papers', formatNumber(exams.length)],
          ['Classes covered', String(distinct(exams, 'className').length)],
          ['Subjects', String(distinct(exams, 'subjectCode').length)],
          ['Grade scales', String(db.gradeScales.length)],
        ])),
    ],
    onSubmit: (v) => {
      Modal({
        title: 'Examination cycle created', icon: 'check-circle', tone: 'success', size: 'md',
        body: h('div', { className: 'stack-3' },
          DescriptionList([
            ['Name', v.name || 'Untitled cycle'], ['Code', v.code || '—'],
            ['Term', v.term], ['Window', `${v.from ? formatDate(v.from) : '—'} → ${v.to ? formatDate(v.to) : '—'}`],
            ['Classes', Array.isArray(v.classes) ? v.classes.join(', ') : '—'],
            ['Max / pass marks', `${v.maxMarks} / ${v.passMarks}`],
            ['Weightage', `${v.weightage}%`],
          ], { cols: 2 }),
          Callout({ tone: 'info', icon: 'calendar' }, 'Next step: build the datesheet and run the conflict check before publishing.')),
        actions: (close) => frag(
          Button('Stay here', { variant: 'ghost', onClick: close }),
          Button('Build the datesheet', { variant: 'primary', icon: 'calendar', onClick: () => { close(); navigate('examination/schedule'); } })),
      });
    },
    onCancel: () => navigate('examination/groups'),
  }));
}

/* ==========================================================================
   14. EXAMINATION — exam groups
   ========================================================================== */

function renderExamGroups(mount, ctx) {
  ensureStyles();
  const exams = examsFor(ctx);
  const marks = marksFor(ctx);
  const rows = db.examGroups.map((g) => {
    const papers = exams.filter((e) => e.examGroupId === g.id);
    return Object.assign({}, g, {
      papers: papers.length,
      classes: distinct(papers, 'className').length,
      subjects: distinct(papers, 'subjectCode').length,
      marksEntered: marks.filter((m) => m.examGroupId === g.id).length,
      days: Math.max(1, Math.round((new Date(g.to) - new Date(g.from)) / 86400000) + 1),
      progress: g.status === 'Completed' ? 100 : g.status === 'Scheduled' ? 45 : 10,
    });
  });

  const node = listPage({
    title: 'Exam Groups',
    subtitle: 'The examination cycles that make up the 2026-27 session — their weightages roll into the final report card.',
    route: 'examination/groups',
    actions: pageActions(
      Button('Weightage', { variant: 'secondary', icon: 'scale', route: 'examination/weightage' }),
      Button('New exam cycle', { variant: 'primary', icon: 'plus', route: 'examination/setup' })),
    kpis: [
      { label: 'Cycles', value: String(rows.length), icon: 'layers', tone: 'brand' },
      { label: 'Completed', value: String(rows.filter((r) => r.status === 'Completed').length), icon: 'check-circle', tone: 'success' },
      { label: 'Papers scheduled', value: formatNumber(sum(rows, 'papers')), icon: 'file-text', tone: 'info' },
      { label: 'Total weightage', value: `${sum(rows, 'weightage')}%`, icon: 'scale', tone: sum(rows, 'weightage') === 100 ? 'success' : 'warning' },
    ],
    chart: h('div', { className: 'widget-grid' },
      h('div', { className: 'span-7' }, barChart({
        categories: rows.map((r) => r.name),
        series: [{ name: 'Papers', values: rows.map((r) => r.papers) }],
        horizontal: true, height: 260, showValues: true,
        title: 'Number of question papers in each examination cycle',
      })),
      h('div', { className: 'span-5' }, donutChart({
        data: rows.map((r) => ({ key: r.name, value: r.weightage })),
        height: 260, centerLabel: 'Weightage', centerValue: `${sum(rows, 'weightage')}%`,
        title: 'Weightage carried by each cycle in the final result',
      }))),
    chartTitle: 'Cycle size and weightage',
    filters: [
      { id: 'q', type: 'search', label: 'Search', placeholder: 'Cycle name…' },
      { id: 'term', label: 'Term', options: ['Term 1', 'Term 2'] },
      { id: 'status', label: 'Status', options: ['Completed', 'Scheduled', 'Planned'] },
    ],
    onFilter: (id, value, allv, table) => {
      let out = rows.slice();
      if (allv.q) out = search(out, allv.q, ['name', 'term']);
      ['term', 'status'].forEach((k) => { if (allv[k] && allv[k] !== 'all') out = out.filter((r) => r[k] === allv[k]); });
      table.refresh(out);
    },
    columns: [
      { key: 'name', label: 'Examination cycle', width: 260, sticky: true, render: (r) => Identity(r.name, `${r.term} · ${r.days} days`), value: (r) => r.name },
      { key: 'from', label: 'From', width: 130, render: (r) => formatDate(r.from), value: (r) => r.from },
      { key: 'to', label: 'To', width: 130, render: (r) => formatDate(r.to), value: (r) => r.to },
      { key: 'classes', label: 'Classes', width: 100, align: 'right', numeric: true },
      { key: 'subjects', label: 'Subjects', width: 105, align: 'right', numeric: true },
      { key: 'papers', label: 'Papers', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'marksEntered', label: 'Marks rows', width: 130, align: 'right', numeric: true, aggregate: 'sum', render: (r) => formatNumber(r.marksEntered) },
      { key: 'weightage', label: 'Weightage', width: 130, align: 'right', numeric: true, aggregate: 'sum', render: (r) => h('span', { className: 't-num t-semibold' }, `${r.weightage}%`), format: (v) => `${v}%` },
      {
        key: 'progress', label: 'Progress', width: 160, align: 'right', numeric: true,
        render: (r) => h('div', { className: 'row', style: { justifyContent: 'flex-end', gap: 'var(--sp-2)' } },
          h('span', { className: 't-num t-xs t-muted' }, `${r.progress}%`),
          h('span', { style: { width: '64px' } }, ProgressBar(r.progress, { tone: r.progress === 100 ? 'success' : 'brand', size: 'sm' }))),
        value: (r) => r.progress,
      },
      { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
    ],
    rows,
    selectable: true, footerAggregates: true, pageSize: 25,
    searchKeys: ['name', 'term', 'status'],
    bulkActions: [
      { label: 'Publish datesheets', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} datesheets published`, tone: 'success' }) },
      { label: 'Lock marks entry', icon: 'lock', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} cycles locked`, tone: 'warning' }) },
    ],
    rowActions: (r) => [
      { label: 'Open datesheet', icon: 'calendar', route: 'examination/schedule' },
      { label: 'Marks entry', icon: 'edit', route: 'examination/marks-entry' },
      { label: 'Result processing', icon: 'refresh', route: 'examination/result-processing' },
      { separator: true },
      { label: 'Duplicate cycle', icon: 'copy', onClick: mockAction('Duplicate cycle') },
      { label: 'Delete cycle', icon: 'trash', tone: 'danger', onClick: () => ConfirmDialog({ title: 'Delete this cycle?', text: `${r.name} and its ${r.papers} papers will be removed. Marks already entered are archived.`, confirmLabel: 'Delete', tone: 'danger' }).then((ok) => ok && notify({ title: 'Cycle deleted', tone: 'danger' })) },
    ],
    onRowClick: (r) => {
      const cns = distinct(exams.filter((e) => e.examGroupId === r.id), 'className').slice(0, 12);
      Drawer({
        title: r.name, subtitle: `${r.term} · ${formatDate(r.from, 'long')} – ${formatDate(r.to, 'long')}`, size: 'lg',
        body: h('div', { className: 'stack-3' },
          h('div', { className: 'row-3 row-wrap' }, Badge(r.status), Badge(`${r.weightage}% weightage`, { tone: 'brand' }), Badge(`${r.papers} papers`, { tone: 'info' })),
          Stepper([
            { label: 'Configured', description: 'Cycle created', state: 'done' },
            { label: 'Datesheet', description: 'Published to portals', state: r.status === 'Planned' ? 'todo' : 'done' },
            { label: 'Marks entry', description: 'Subject teachers', state: r.status === 'Completed' ? 'done' : r.status === 'Scheduled' ? 'current' : 'todo' },
            { label: 'Results', description: 'Processed and published', state: r.status === 'Completed' ? 'done' : 'todo' },
          ], { current: r.status === 'Completed' ? 3 : r.status === 'Scheduled' ? 2 : 1 }),
          cns.length ? SectionCard({ title: 'Papers by class', className: 'chart-card' },
            barChart({
              categories: cns,
              series: [{ name: 'Papers', values: cns.map((cn) => exams.filter((e) => e.examGroupId === r.id && e.className === cn).length) }],
              height: 240, title: 'Question papers scheduled per class',
            }))
            : EmptyState({ icon: 'file-text', title: 'No papers yet', text: 'Build the datesheet to add question papers to this cycle.' })),
        actions: (close) => frag(
          Button('Close', { variant: 'ghost', onClick: close }),
          Button('Open datesheet', { variant: 'primary', icon: 'calendar', onClick: () => { close(); navigate('examination/schedule'); } })),
      });
    },
    emptyState: EmptyState({ icon: 'layers', title: 'No exam cycles', text: 'Create the first examination cycle for this academic year.', action: Button('New exam cycle', { variant: 'primary', route: 'examination/setup' }) }),
    exportName: 'exam-groups',
    tableTitle: 'Examination cycles',
  });

  mount.appendChild(node);
}

/* ==========================================================================
   15. EXAMINATION — schedule (datesheet grid + conflict check)
   ========================================================================== */

function renderExamSchedule(mount, ctx) {
  ensureStyles();
  const exams = examsFor(ctx);
  let groupId = 'EG2';
  let classFilter = 'all';
  const host = h('div', { className: 'stack' });

  function conflictsIn(list) {
    const out = [];
    for (const [, group] of groupBy(list, (e) => `${e.date}|${e.className}`)) {
      if (group.length > 1) out.push({ type: 'Two papers on the same day', items: group });
    }
    for (const [, group] of groupBy(list, (e) => `${e.date}|${e.startTime}|${e.invigilatorId || 'none'}`)) {
      if (group.length > 1 && group[0].invigilatorId) out.push({ type: 'Invigilator double-booked', items: group });
    }
    for (const [, group] of groupBy(list, (e) => `${e.date}|${e.startTime}|${e.room}`)) {
      if (group.length > 2) out.push({ type: 'Hall over capacity', items: group });
    }
    return out;
  }

  function paperDrawer(e, isConflict) {
    Drawer({
      title: `${e.subjectName} — ${e.className}`,
      subtitle: `${formatDate(e.date, 'long')} · ${e.startTime}–${e.endTime}`,
      size: 'md',
      body: h('div', { className: 'stack-3' },
        h('div', { className: 'row-3 row-wrap' }, Badge(e.status), Badge(`${e.maxMarks} marks`, { tone: 'info' }), isConflict ? Badge('Conflict', { tone: 'danger', icon: 'alert-triangle' }) : null),
        DescriptionList([
          ['Paper code', e.id], ['Exam cycle', e.examGroupName],
          ['Class', e.className], ['Subject', `${e.subjectName} (${e.subjectCode})`],
          ['Date', formatDate(e.date, 'long')], ['Timing', `${e.startTime} – ${e.endTime}`],
          ['Hall', e.room], ['Invigilator', e.invigilatorName || 'Unassigned'],
          ['Maximum marks', String(e.maxMarks)], ['Pass marks', String(e.passMarks)],
        ], { cols: 2 }),
        isConflict ? Callout({ tone: 'danger', icon: 'alert-triangle', title: 'This paper is part of a conflict' },
          'Two papers for the same class fall on this date, or the invigilator is already committed. Move one of them before publishing.') : null,
        SectionCard({ title: 'Preparation checklist', icon: 'clipboard-check' },
          h('div', { className: 'stack-2' },
            Checkbox('Question paper received from the setter', { checked: true }),
            Checkbox('Paper printed and sealed', { checked: e.status === 'Results Published' }),
            Checkbox('Seating plan generated', { checked: true }),
            Checkbox('Invigilator briefed', { checked: !!e.invigilatorId }),
            Checkbox('Answer sheets counted', { checked: false })))),
      actions: (close) => frag(
        Button('Close', { variant: 'ghost', onClick: close }),
        Button('Seating plan', { variant: 'secondary', icon: 'grid', onClick: () => { close(); navigate('examination/seating'); } }),
        Button('Reschedule', { variant: 'primary', icon: 'calendar', onClick: mockAction('Reschedule paper') })),
    });
  }

  function build() {
    host.innerHTML = '';
    const group = byId(db.examGroups, groupId) || db.examGroups[1];
    let list = exams.filter((e) => e.examGroupId === groupId);
    if (classFilter !== 'all') list = list.filter((e) => e.className === classFilter);

    if (!list.length) {
      host.appendChild(EmptyState({
        icon: 'calendar', title: 'No papers scheduled',
        text: 'This cycle has no question papers for the selected class yet.',
        action: Button('Open exam setup', { variant: 'primary', route: 'examination/setup' }),
      }));
      return;
    }

    const conflicts = conflictsIn(list);
    const dates = distinct(list, 'date').sort();

    host.appendChild(kpiRow([
      { label: 'Papers', value: formatNumber(list.length), icon: 'file-text', tone: 'brand' },
      { label: 'Exam days', value: String(dates.length), icon: 'calendar', tone: 'info' },
      { label: 'Classes covered', value: String(distinct(list, 'className').length), icon: 'grid', tone: 'success' },
      {
        label: 'Conflicts', value: String(conflicts.length), icon: 'alert-triangle',
        tone: conflicts.length ? 'danger' : 'success',
        footer: conflicts.length ? 'Resolve before publishing' : 'Datesheet is clean',
      },
    ]));

    host.appendChild(conflicts.length
      ? Callout({ tone: 'danger', icon: 'alert-triangle', title: `${conflicts.length} scheduling conflicts detected` },
        h('div', { className: 'stack-1 mt-2' },
          conflicts.slice(0, 5).map((c) => h('div', { className: 't-sm' },
            h('strong', null, c.type), ' — ',
            c.items.map((i) => `${i.className} ${i.subjectName}`).join(' vs '),
            ' on ', formatDate(c.items[0].date))),
          conflicts.length > 5 ? h('div', { className: 't-xs t-muted' }, `+ ${conflicts.length - 5} more`) : null))
      : Callout({ tone: 'success', icon: 'check-circle', title: 'Conflict check passed' },
        'No class sits two papers on the same day, no invigilator is double-booked and no hall is over capacity.'));

    const grid = h('div', { className: 'ds-grid' },
      dates.map((d) => {
        const dayPapers = sortBy(list.filter((e) => e.date === d), 'startTime', 'asc');
        return h('div', { className: 'ds-day' },
          h('div', { className: 'ds-day-head' },
            h('div', { className: 't-semibold t-sm' }, formatDate(d, 'dayMonth')),
            h('div', { className: 't-xs t-muted' }, `${formatDate(d, 'weekday')} · ${dayPapers.length} paper(s)`)),
          dayPapers.map((e) => {
            const isConflict = conflicts.some((c) => c.items.indexOf(e) !== -1);
            return h('div', {
              className: 'ds-slot', dataset: { conflict: isConflict ? '1' : '0' },
              attrs: { role: 'button', tabindex: '0', title: `${e.className} · ${e.subjectName}` },
              onClick: () => paperDrawer(e, isConflict),
              onKeyDown: (ev) => { if (ev.key === 'Enter') paperDrawer(e, isConflict); },
            },
              h('div', { className: 't-xs t-semibold t-truncate' }, e.subjectName),
              h('div', { className: 't-xs t-muted' }, `${e.className} · ${e.startTime}–${e.endTime}`),
              h('div', { className: 't-xs t-faint' }, `${e.room} · ${e.maxMarks} marks`));
          }));
      }));

    host.appendChild(SectionCard({
      title: `Datesheet — ${group.name}`,
      subtitle: `${formatDate(group.from, 'long')} to ${formatDate(group.to, 'long')} · ${list.length} papers`,
      icon: 'calendar',
      actions: h('div', { className: 'row' },
        Button('Run conflict check', {
          variant: 'ghost', size: 'sm', icon: 'alert-triangle',
          onClick: () => notify({
            title: conflicts.length ? `${conflicts.length} conflicts found` : 'No conflicts',
            text: conflicts.length ? 'Highlighted in red on the grid.' : 'Datesheet is safe to publish.',
            tone: conflicts.length ? 'danger' : 'success',
          }),
        }),
        Button('Print datesheet', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(grid, `${group.name} datesheet`) })),
    }, grid));

    host.appendChild(SectionCard({ title: 'All papers', subtitle: 'The sortable, filterable list behind the grid above', flush: true },
      DataTable({
        columns: [
          { key: 'date', label: 'Date', width: 130, sticky: true, render: (r) => formatDate(r.date), value: (r) => r.date },
          { key: 'startTime', label: 'Time', width: 130, render: (r) => `${r.startTime}–${r.endTime}`, value: (r) => r.startTime },
          { key: 'className', label: 'Class', width: 130, filter: true },
          { key: 'subjectName', label: 'Subject', width: 180, filter: true },
          { key: 'room', label: 'Hall', width: 110, filter: true },
          { key: 'invigilatorName', label: 'Invigilator', width: 210, render: (r) => (r.invigilatorName ? Identity(r.invigilatorName, 'Invigilator') : Badge('Unassigned', { tone: 'warning' })), value: (r) => r.invigilatorName || '' },
          { key: 'maxMarks', label: 'Max', width: 90, align: 'right', numeric: true },
          { key: 'passMarks', label: 'Pass', width: 90, align: 'right', numeric: true },
          { key: 'status', label: 'Status', width: 170, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: list,
        pageSize: 25, searchKeys: ['className', 'subjectName', 'room', 'invigilatorName'],
        selectable: true,
        bulkActions: [
          { label: 'Reschedule', icon: 'calendar', onClick: (sel) => notify({ title: `${sel.length} papers queued for rescheduling`, tone: 'info' }) },
          { label: 'Assign invigilators', icon: 'user-check', onClick: () => navigate('examination/invigilators') },
        ],
        rowActions: () => [
          { label: 'Edit paper', icon: 'edit', onClick: mockAction('Edit paper') },
          { label: 'Seating plan', icon: 'grid', route: 'examination/seating' },
          { label: 'Marks entry', icon: 'edit', route: 'examination/marks-entry' },
        ],
        onRowClick: (r) => paperDrawer(r, false),
        emptyState: EmptyState({ icon: 'file-text', title: 'No papers', text: 'Nothing matches the current filters.' }),
        exportName: 'exam-datesheet',
      })));
  }

  const filters = filterCard([
    { id: 'group', label: 'Exam cycle', type: 'select', value: groupId, options: examGroupOptions() },
    { id: 'className', label: 'Class', type: 'select', options: examClassOptions(ctx) },
  ], (id, value) => {
    if (id === 'group' && value !== 'all') groupId = value;
    if (id === 'className') classFilter = value;
    build();
  });

  build();

  mount.appendChild(page({
    title: 'Exam Schedule',
    subtitle: 'The datesheet as a day grid, with an automatic conflict check for clashing papers, double-booked invigilators and over-full halls.',
    route: 'examination/schedule',
    wide: true,
    actions: pageActions(
      Button('Invigilators', { variant: 'secondary', icon: 'user-check', route: 'examination/invigilators' }),
      Button('Publish datesheet', {
        variant: 'primary', icon: 'send',
        onClick: () => ConfirmDialog({
          title: 'Publish this datesheet?',
          text: 'Students, parents and teachers see it on their portals immediately, and an SMS goes to every guardian.',
          confirmLabel: 'Publish', tone: 'brand', icon: 'send',
        }).then((ok) => ok && notify({ title: 'Datesheet published', text: 'Portals updated and 2,400 notifications queued.', tone: 'success' })),
      })),
    children: [filters, host],
  }));
}

/* ==========================================================================
   16. EXAMINATION — seating plan and hall tickets
   ========================================================================== */

function renderSeating(mount, ctx) {
  ensureStyles();
  const exams = examsFor(ctx);
  const halls = Array.from({ length: 8 }, (_, i) => `Hall ${i + 1}`);
  let groupId = 'EG2';
  let hall = 'Hall 1';
  const host = h('div', { className: 'stack' });

  function hallTicket(student, papers) {
    return h('div', { className: 'a4' },
      h('div', { className: 'row', style: { justifyContent: 'space-between', alignItems: 'flex-start' } },
        h('div', null,
          h('div', { style: { fontSize: '18px', fontWeight: '700' } }, 'Springdale International School'),
          h('div', { style: { fontSize: '12px' } }, 'Sector 45, Gurugram, Haryana 122003 · CBSE affiliation 530142'),
          h('div', { style: { fontSize: '13px', fontWeight: '700', marginTop: '8px', letterSpacing: '0.08em' } }, 'ADMIT CARD / HALL TICKET')),
        h('div', { style: { width: '86px', height: '104px', border: '1px solid var(--paper-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--paper-muted)', textAlign: 'center' } }, 'Student photograph')),
      h('hr', { className: 'a4-rule' }),
      h('div', { className: 'a4-grid2' },
        [['Student name', student.name], ['Admission no', student.admissionNo],
          ['Class and section', `${student.className} — ${student.section}`], ['Roll number', String(student.rollNo)],
          ['Father / guardian', student.fatherName || student.guardianName], ['Date of birth', formatDate(student.dob)],
          ['Examination', (byId(db.examGroups, groupId) || {}).name || ''], ['Campus', (byId(db.campuses, student.campusId) || {}).name || '']]
          .map((pair) => h('div', null, h('span', { style: { color: 'var(--paper-ink-2)' } }, pair[0] + ': '), h('strong', null, String(pair[1]))))),
      h('hr', { className: 'a4-rule' }),
      h('table', { className: 'a4-table' },
        h('thead', null, h('tr', null, ['Date', 'Day', 'Subject', 'Timing', 'Hall', 'Seat'].map((x) => h('th', null, x)))),
        h('tbody', null, papers.slice(0, 10).map((p, i) => h('tr', null,
          h('td', null, formatDate(p.date)),
          h('td', null, formatDate(p.date, 'weekday')),
          h('td', null, p.subjectName),
          h('td', null, `${p.startTime} – ${p.endTime}`),
          h('td', null, p.room),
          h('td', null, `${String(p.room).replace('Hall ', 'H')}-${String(((hash32(student.id) + i) % 40) + 1).padStart(2, '0')}`))))),
      h('div', { style: { marginTop: '14px', fontSize: '11px', lineHeight: '1.55' } },
        h('strong', null, 'Instructions: '),
        '1. Carry this admit card and the school ID to every paper. 2. Reach the hall fifteen minutes before the start. 3. Mobile phones, smart watches and unauthorised material are strictly prohibited. 4. Use blue or black ink only. 5. Do not leave the hall in the first thirty minutes.'),
      h('div', { className: 'row', style: { justifyContent: 'space-between', marginTop: '30px', fontSize: '11px' } },
        h('div', null, '____________________', h('div', null, 'Class teacher')),
        h('div', null, '____________________', h('div', null, 'Examination controller')),
        h('div', null, '____________________', h('div', null, 'Principal'))));
  }

  function build() {
    host.innerHTML = '';
    const group = byId(db.examGroups, groupId) || db.examGroups[1];
    const papers = exams.filter((e) => e.examGroupId === groupId && e.room === hall);
    const classNames = distinct(papers, 'className');
    const pool = db.students.filter((s) => s.status === 'Active' && classNames.indexOf(s.className) !== -1).slice(0, 42);

    const seats = Array.from({ length: 48 }, (_, i) => {
      const st = pool[i];
      if (!st) return { seat: i + 1, empty: true };
      return {
        seat: i + 1,
        code: `${hall.replace('Hall ', 'H')}-${String(i + 1).padStart(2, '0')}`,
        student: st,
        cls: classNames.indexOf(st.className) % 2 === 0 ? 'A' : 'B',
      };
    });

    host.appendChild(kpiRow([
      { label: 'Halls in use', value: String(halls.length), icon: 'door', tone: 'brand' },
      { label: 'Seats in this hall', value: '48', icon: 'grid', tone: 'info' },
      { label: 'Candidates seated', value: String(pool.length), icon: 'users', tone: pool.length ? 'success' : 'warning' },
      { label: 'Hall tickets issued', value: formatNumber(pool.length), icon: 'certificate', tone: 'success' },
    ]));

    const grid = h('div', { className: 'seat-room' },
      seats.map((s) => (s.empty
        ? h('div', { className: 'seat', dataset: { cls: 'empty' } }, h('span', { className: 'seat-code' }, String(s.seat)), h('span', null, 'Vacant'))
        : h('div', {
          className: 'seat', dataset: { cls: s.cls },
          attrs: { role: 'button', tabindex: '0', title: `${s.student.name} · ${s.student.className} ${s.student.section}` },
          onClick: () => navigate(`students/profile/${s.student.id}`),
          onKeyDown: (e) => { if (e.key === 'Enter') navigate(`students/profile/${s.student.id}`); },
        },
          h('span', { className: 'seat-code' }, s.code),
          h('span', { className: 't-truncate' }, s.student.name.split(' ')[0]),
          h('span', { style: { color: 'var(--text-muted)' } }, `${s.student.className.replace('Class ', '')}-${s.student.section}`)))));

    host.appendChild(SectionCard({
      title: `Seating plan — ${hall}`,
      subtitle: `${group.name} · ${classNames.length ? classNames.join(', ') : 'no class allotted yet'} · alternate-class seating`,
      icon: 'grid',
      actions: h('div', { className: 'row' },
        Button('Auto-arrange', { variant: 'ghost', size: 'sm', icon: 'refresh', onClick: () => { build(); notify({ title: 'Seating regenerated', text: 'Adjacent seats never hold the same class.', tone: 'success' }); } }),
        Button('Print plan', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(grid, `${hall} seating plan`) })),
    }, h('div', { className: 'stack-3' },
      h('div', { className: 'legend-row' },
        h('span', { className: 'am-chip' }, h('span', { className: 'am-dot', style: { background: 'var(--brand-500)' } }), classNames[0] || 'Class A'),
        h('span', { className: 'am-chip' }, h('span', { className: 'am-dot', style: { background: 'var(--teal-500)' } }), classNames[1] || 'Class B'),
        h('span', { className: 'am-chip' }, h('span', { className: 'am-dot', style: { background: 'var(--surface-sunken)', border: '1px solid var(--border)' } }), 'Vacant')),
      grid)));

    const previewHost = h('div');
    const paint = (st) => {
      previewHost.innerHTML = '';
      const p = exams.filter((e) => e.examGroupId === groupId && e.className === st.className);
      previewHost.appendChild(hallTicket(st, p.length ? p : exams.slice(0, 6)));
    };
    if (pool.length) paint(pool[0]);

    host.appendChild(SectionCard({
      title: 'Hall ticket generator',
      subtitle: 'Live A4 preview — the printed version uses exactly this layout',
      icon: 'certificate',
      actions: h('div', { className: 'row' },
        Button('Generate for the whole hall', {
          variant: 'secondary', size: 'sm', icon: 'layers',
          onClick: () => ConfirmDialog({
            title: `Generate ${pool.length} hall tickets?`,
            text: 'A single PDF is produced with one ticket per page, ready for the front office to print and distribute.',
            confirmLabel: 'Generate', tone: 'brand', icon: 'certificate',
          }).then((ok) => ok && notify({ title: `${pool.length} hall tickets generated`, text: 'PDF ready in the downloads tray.', tone: 'success' })),
        }),
        Button('Print preview', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(previewHost, 'Hall ticket') })),
    }, h('div', { className: 'stack-3' },
      h('div', { className: 'row-3 row-wrap' },
        Field({ label: 'Student' }, Combobox({
          options: pool.map((s) => ({ value: s.id, label: `${s.name} — ${s.className} ${s.section}` })),
          value: pool.length ? pool[0].id : null, width: '320px',
          onChange: (v) => { const st = byId(db.students, v); if (st) paint(st); },
        })),
        Field({ label: 'Template' }, Select({ options: ['Standard CBSE admit card', 'Compact half-page', 'With QR verification'], value: 'Standard CBSE admit card', onChange: () => {} }))),
      pool.length ? previewHost : EmptyState({ icon: 'certificate', title: 'No candidates allotted to this hall', text: 'Pick another hall, or run auto-arrange first.' }))));
  }

  const filters = filterCard([
    { id: 'group', label: 'Exam cycle', type: 'select', value: groupId, options: examGroupOptions() },
    { id: 'hall', label: 'Hall', type: 'select', value: hall, options: halls },
  ], (id, value) => {
    if (id === 'group' && value !== 'all') groupId = value;
    if (id === 'hall' && value !== 'all') hall = value;
    build();
  });

  build();

  mount.appendChild(page({
    title: 'Seating & Hall Tickets',
    subtitle: 'Alternate-class seating grids for every examination hall, plus the admit-card generator with a live A4 preview.',
    route: 'examination/seating',
    wide: true,
    actions: pageActions(
      Button('Invigilators', { variant: 'secondary', icon: 'user-check', route: 'examination/invigilators' }),
      Button('Generate all hall tickets', { variant: 'primary', icon: 'certificate', onClick: mockAction('Generate all hall tickets') })),
    children: [filters, host],
  }));
}

/* ==========================================================================
   17. EXAMINATION — invigilator allocation
   ========================================================================== */

function renderInvigilators(mount, ctx) {
  ensureStyles();
  const exams = examsFor(ctx);
  const teachers = db.staff.filter((s) => s.type === 'Teaching');
  const rows = exams.slice(0, 420).map((e) => {
    const t = e.invigilatorId ? staffMap().get(e.invigilatorId) : null;
    const duties = 1 + (hash32(e.invigilatorId || e.id) % 6);
    return {
      id: e.id, date: e.date, startTime: e.startTime, endTime: e.endTime,
      examGroupName: e.examGroupName, className: e.className, subjectName: e.subjectName,
      room: e.room, candidates: 30 + (hash32(e.id) % 18),
      invigilatorId: e.invigilatorId || null, invigilatorName: e.invigilatorName || null,
      department: t ? t.department : '—',
      ownSubject: t ? (t.subjects || []).indexOf(e.subjectName) !== -1 : false,
      duties,
      status: e.invigilatorName ? (duties > 4 ? 'Over-allocated' : 'Assigned') : 'Unassigned',
    };
  });

  const unassigned = rows.filter((r) => r.status === 'Unassigned').length;
  const clashes = rows.filter((r) => r.ownSubject).length;
  const loadByTeacher = [];
  for (const [name, list] of groupBy(rows.filter((r) => r.invigilatorName), 'invigilatorName')) {
    loadByTeacher.push({ name, department: list[0].department, count: list.length });
  }
  loadByTeacher.sort((a, b) => b.count - a.count);

  function assignDrawer(r) {
    const pool = teachers.filter((t) => (t.subjects || []).indexOf(r.subjectName) === -1).slice(0, 40);
    let picked = r.invigilatorId;
    Drawer({
      title: 'Assign invigilator',
      subtitle: `${r.className} · ${r.subjectName} · ${formatDate(r.date)} ${r.startTime}`,
      size: 'md',
      body: h('div', { className: 'stack-3' },
        DescriptionList([
          ['Paper', `${r.subjectName} — ${r.className}`], ['Hall', r.room],
          ['Candidates', String(r.candidates)], ['Session', `${r.startTime} – ${r.endTime}`],
        ], { cols: 2 }),
        Field({ label: 'Invigilator', required: true, hint: 'Teachers of this subject are excluded automatically.' },
          Combobox({
            options: pool.map((t) => ({ value: t.id, label: `${t.name} — ${t.department}` })),
            value: picked, onChange: (v) => { picked = v; }, width: '100%',
          })),
        Field({ label: 'Relief invigilator' },
          Combobox({ options: pool.slice(0, 20).map((t) => ({ value: t.id, label: t.name })), placeholder: 'Optional', onChange: () => {}, width: '100%' })),
        Callout({ tone: 'info', icon: 'info', title: 'Allocation rules' },
          'No teacher exceeds five duties per cycle, no teacher invigilates their own subject, and approved leave and PTM slots are respected.'),
        loadByTeacher.length ? SectionCard({ title: 'Current duty load', className: 'chart-card' },
          barChart({
            categories: loadByTeacher.slice(0, 8).map((t) => t.name.split(' ')[0]),
            series: [{ name: 'Duties', values: loadByTeacher.slice(0, 8).map((t) => t.count) }],
            horizontal: true, height: 220, title: 'Teachers carrying the highest duty counts',
          })) : null),
      actions: (close) => frag(
        Button('Cancel', { variant: 'ghost', onClick: close }),
        Button('Assign duty', {
          variant: 'primary', icon: 'check',
          onClick: () => { close(); notify({ title: 'Invigilator assigned', text: `${(byId(db.staff, picked) || {}).name || 'Teacher'} · ${r.room}`, tone: 'success' }); },
        })),
    });
  }

  const node = listPage({
    title: 'Invigilator Allocation',
    subtitle: `${formatNumber(rows.length)} duty slots across the examination calendar · fair-share allocation with own-subject exclusion`,
    route: 'examination/invigilators',
    actions: pageActions(
      Button('Duty roster PDF', { variant: 'secondary', icon: 'print', onClick: mockAction('Download duty roster') }),
      Button('Auto-allocate', {
        variant: 'primary', icon: 'zap',
        onClick: () => ConfirmDialog({
          title: 'Auto-allocate invigilators?',
          text: 'The allocator balances duty counts across teaching staff, never assigns a teacher to their own subject, and respects approved leave.',
          confirmLabel: 'Run allocation', tone: 'brand', icon: 'zap',
        }).then((ok) => ok && notify({ title: 'Allocation complete', text: `${unassigned} open duties filled · ${clashes} own-subject clashes resolved`, tone: 'success' })),
      })),
    kpis: [
      { label: 'Duty slots', value: formatNumber(rows.length), icon: 'user-check', tone: 'brand' },
      { label: 'Unassigned', value: String(unassigned), icon: 'alert-triangle', tone: unassigned ? 'warning' : 'success' },
      { label: 'Own-subject clashes', value: String(clashes), icon: 'alert-circle', tone: clashes ? 'danger' : 'success' },
      { label: 'Teachers on duty', value: String(loadByTeacher.length), icon: 'users', tone: 'info' },
    ],
    chart: h('div', { className: 'widget-grid' },
      h('div', { className: 'span-8' }, barChart({
        categories: loadByTeacher.slice(0, 14).map((t) => t.name.split(' ')[0] + ' ' + String(t.name.split(' ')[1] || '').charAt(0) + '.'),
        series: [{ name: 'Duties', values: loadByTeacher.slice(0, 14).map((t) => t.count) }],
        height: 250, showValues: true, target: 5, targetLabel: 'Fair-share cap',
        title: 'Duty count per teacher against the fair-share cap of five',
      })),
      h('div', { className: 'span-4' }, donutChart({
        data: countBy(rows, 'status'), height: 250, centerLabel: 'Slots', centerValue: String(rows.length),
        title: 'Allocation status of every duty slot',
      }))),
    chartTitle: 'Duty load and allocation status',
    filters: [
      { id: 'q', type: 'search', label: 'Search', placeholder: 'Teacher, subject or hall…' },
      { id: 'examGroupName', label: 'Exam cycle', options: distinct(rows, 'examGroupName') },
      { id: 'room', label: 'Hall', options: distinct(rows, 'room').sort() },
      { id: 'status', label: 'Status', options: ['Assigned', 'Unassigned', 'Over-allocated'] },
    ],
    onFilter: (id, value, allv, table) => {
      let out = rows.slice();
      if (allv.q) out = search(out, allv.q, ['invigilatorName', 'subjectName', 'room', 'className']);
      ['examGroupName', 'room', 'status'].forEach((k) => { if (allv[k] && allv[k] !== 'all') out = out.filter((r) => r[k] === allv[k]); });
      table.refresh(out);
    },
    columns: [
      { key: 'date', label: 'Date', width: 130, sticky: true, render: (r) => formatDate(r.date), value: (r) => r.date },
      { key: 'startTime', label: 'Session', width: 130, render: (r) => `${r.startTime}–${r.endTime}`, value: (r) => r.startTime },
      { key: 'className', label: 'Class', width: 120, filter: true },
      { key: 'subjectName', label: 'Paper', width: 170, filter: true },
      { key: 'room', label: 'Hall', width: 100, filter: true },
      { key: 'candidates', label: 'Candidates', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
      {
        key: 'invigilatorName', label: 'Invigilator', width: 250,
        render: (r) => (r.invigilatorName
          ? Identity(r.invigilatorName, r.department + (r.ownSubject ? ' · own subject' : ''))
          : Button('Assign', { variant: 'secondary', size: 'sm', icon: 'user-plus', onClick: (e) => { e.stopPropagation(); assignDrawer(r); } })),
        value: (r) => r.invigilatorName || '',
      },
      { key: 'duties', label: 'Duties', width: 100, align: 'right', numeric: true, render: (r) => h('span', { className: r.duties > 4 ? 't-danger t-num t-semibold' : 't-num' }, String(r.duties)) },
      { key: 'status', label: 'Status', width: 150, filter: true, render: (r) => Badge(r.status, { tone: r.status === 'Assigned' ? 'success' : r.status === 'Unassigned' ? 'warning' : 'danger' }) },
    ],
    rows,
    selectable: true, footerAggregates: true, pageSize: 25,
    searchKeys: ['invigilatorName', 'subjectName', 'room', 'className'],
    bulkActions: [
      { label: 'Auto-assign selected', icon: 'zap', onClick: (sel) => notify({ title: `${sel.length} duties allocated`, tone: 'success' }) },
      { label: 'Notify invigilators', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} duty notices sent`, tone: 'success' }) },
      { label: 'Clear allocation', icon: 'x', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} allocations cleared`, tone: 'warning' }) },
    ],
    rowActions: (r) => [
      { label: 'Reassign', icon: 'user-check', onClick: () => assignDrawer(r) },
      { label: 'Open teacher profile', icon: 'eye', route: r.invigilatorId ? `teachers/profile/${r.invigilatorId}` : 'teachers/directory' },
      { label: 'Seating plan', icon: 'grid', route: 'examination/seating' },
    ],
    onRowClick: assignDrawer,
    emptyState: EmptyState({ icon: 'user-check', title: 'No duty slots', text: 'Publish a datesheet first — duty slots are created from scheduled papers.' }),
    exportName: 'invigilator-duties',
    tableTitle: 'Duty roster',
    notes: clashes ? Callout({ tone: 'danger', icon: 'alert-circle', title: `${clashes} teachers are invigilating their own subject` },
      'Board guidelines require a teacher of a different subject in the hall. Run the auto-allocator to swap these duties.') : null,
  });

  mount.appendChild(node);
}

/* ==========================================================================
   18. EXAMINATION — flagship: Marks Entry (spreadsheet grid)
   ========================================================================== */

function renderMarksEntry(mount, ctx) {
  ensureStyles();
  const classNames = examClassOptions(ctx);
  let groupId = 'EG3';
  let className = classNames.indexOf('Class X') !== -1 ? 'Class X' : classNames[0];
  let sectionFilter = 'all';
  const dirty = new Map();
  const host = h('div', { className: 'stack' });

  const saveIndicator = h('span', { className: 'mk-save', dataset: { state: 'idle' } }, Icon('check-circle', 14), h('span', null, 'All changes saved'));
  let saveTimer = null;
  function touch() {
    saveIndicator.dataset.state = 'saving';
    saveIndicator.innerHTML = '';
    saveIndicator.appendChild(Icon('refresh', 14));
    saveIndicator.appendChild(h('span', null, `Saving ${dirty.size} change(s)…`));
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveIndicator.dataset.state = 'saved';
      saveIndicator.innerHTML = '';
      saveIndicator.appendChild(Icon('check-circle', 14));
      saveIndicator.appendChild(h('span', null, `Autosaved · ${dirty.size} change(s) this session`));
    }, 900);
  }

  function build() {
    host.innerHTML = '';
    let sheet = studentMarkSheet(ctx, groupId, className);
    if (sectionFilter !== 'all') sheet = sheet.filter((r) => r.section === sectionFilter);

    if (!sheet.length) {
      host.appendChild(EmptyState({
        icon: 'edit', title: 'No marks sheet for this selection',
        text: `${className || 'This class'} has no marks rows for the selected cycle. Rows are created once the paper is conducted.`,
        action: Button('Open exam schedule', { variant: 'primary', route: 'examination/schedule' }),
      }));
      return;
    }

    const codes = subjectCodesForSheet(sheet);
    const maxFor = (code) => { const r = sheet.find((x) => x.subjects[code]); return r ? r.subjects[code].maxMarks : 100; };
    const entered = sheet.reduce((a, r) => a + Object.keys(r.subjects).length, 0);
    const expected = sheet.length * codes.length;
    const failing = sheet.filter((r) => r.result === 'Fail').length;
    const avgPct = Math.round((sheet.reduce((a, r) => a + r.percent, 0) / sheet.length) * 10) / 10;

    host.appendChild(kpiRow([
      { label: 'Students', value: formatNumber(sheet.length), icon: 'users', tone: 'brand' },
      { label: 'Cells filled', value: `${formatNumber(entered)} / ${formatNumber(expected)}`, icon: 'edit', tone: entered >= expected ? 'success' : 'warning', footer: `${Math.round((entered / Math.max(1, expected)) * 100)}% complete` },
      { label: 'Class average', value: `${avgPct}%`, icon: 'percent', tone: pctTone(avgPct) },
      { label: 'Failing students', value: String(failing), icon: 'alert-triangle', tone: failing ? 'danger' : 'success' },
    ]));

    const thead = h('thead', null,
      h('tr', null,
        h('th', { className: 'mk-name' }, 'Student'),
        h('th', { style: { minWidth: '70px' } }, 'Roll'),
        codes.map((c) => h('th', { style: { minWidth: '88px' }, attrs: { title: `${subjectName(c)} · maximum ${maxFor(c)}` } },
          h('div', null, c),
          h('div', { style: { fontSize: 'var(--fs-2xs)', opacity: '0.7', textTransform: 'none', letterSpacing: '0' } }, `/${maxFor(c)}`))),
        h('th', { style: { minWidth: '90px' } }, 'Total'),
        h('th', { style: { minWidth: '80px' } }, '%'),
        h('th', { style: { minWidth: '72px' } }, 'Grade'),
        h('th', { style: { minWidth: '84px' } }, 'Result')));

    const tbody = h('tbody', null);

    function recalc(tr) {
      let obtained = 0; let max = 0; let failed = 0;
      codes.forEach((c) => {
        const cell = tr.querySelector('input[data-code="' + c + '"]');
        const raw = cell ? cell.value : '';
        const v = raw === '' ? null : Number(raw);
        const m = maxFor(c);
        if (v !== null && !Number.isNaN(v)) { obtained += v; max += m; if (v < m * 0.33) failed++; }
      });
      const pct = max ? Math.round((obtained / max) * 1000) / 10 : 0;
      tr.querySelector('.mk-tot').textContent = String(obtained);
      tr.querySelector('.mk-pct').textContent = `${pct}%`;
      tr.querySelector('.mk-grade').textContent = gradeFor(pct);
      const res = tr.querySelector('.mk-res');
      res.innerHTML = '';
      res.appendChild(Badge(failed ? 'Fail' : 'Pass', { tone: failed ? 'danger' : 'success', size: 'sm' }));
    }

    sheet.forEach((row, ri) => {
      const tr = h('tr', null);
      tr.appendChild(h('td', { className: 'mk-name' },
        h('div', {
          className: 'row', style: { gap: 'var(--sp-2)', cursor: 'pointer' },
          onClick: () => navigate(`students/profile/${row.studentId}`),
        },
          Avatar(row.name, { size: 'xs' }),
          h('div', { className: 'min-0' },
            h('div', { className: 't-truncate t-medium', style: { fontSize: 'var(--fs-xs)' } }, row.name),
            h('div', { style: { fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' } }, `${row.admissionNo} · ${row.section}`)))));
      tr.appendChild(h('td', { className: 't-num t-xs' }, String((byId(db.students, row.studentId) || {}).rollNo || '—')));
      codes.forEach((c, ci) => {
        const m = row.subjects[c];
        const max = maxFor(c);
        const input = h('input', {
          className: 'mk-cell', type: 'text', value: m ? String(m.marksObtained) : '',
          dataset: { code: c, r: String(ri), c: String(ci) },
          attrs: { 'aria-label': `${subjectName(c)} marks for ${row.name}, maximum ${max}`, inputmode: 'numeric' },
          onInput: (e) => {
            const raw = String(e.target.value).trim();
            const v = raw === '' ? null : Number(raw);
            const bad = raw !== '' && (Number.isNaN(v) || v < 0 || v > max);
            e.target.dataset.invalid = bad ? '1' : '0';
            e.target.dataset.dirty = '1';
            e.target.title = bad ? `Enter a number between 0 and ${max}` : '';
            if (!bad) {
              dirty.set(row.studentId + '|' + c, v);
              recalc(tr);
              touch();
            }
          },
          onKeyDown: (e) => {
            const move = (dr, dc) => {
              const sel = tbody.querySelector(`input[data-r="${ri + dr}"][data-c="${ci + dc}"]`);
              if (sel) { e.preventDefault(); sel.focus(); sel.select(); }
            };
            if (e.key === 'Enter' || e.key === 'ArrowDown') move(1, 0);
            else if (e.key === 'ArrowUp') move(-1, 0);
            else if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length) move(0, 1);
            else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) move(0, -1);
          },
          onFocus: (e) => e.target.select(),
        });
        tr.appendChild(h('td', null, input));
      });
      tr.appendChild(h('td', { className: 'mk-total mk-tot' }, String(row.obtained)));
      tr.appendChild(h('td', { className: 'mk-total mk-pct' }, `${row.percent}%`));
      tr.appendChild(h('td', { className: 'mk-total mk-grade' }, row.grade));
      tr.appendChild(h('td', { className: 'mk-res' }, Badge(row.result, { tone: row.result === 'Pass' ? 'success' : 'danger', size: 'sm' })));
      tbody.appendChild(tr);
    });

    const wrap = h('div', { className: 'mk-wrap' }, h('table', { className: 'mk-table' }, thead, tbody));

    const bulkImport = () => Modal({
      title: 'Bulk import marks', icon: 'upload', size: 'lg',
      subtitle: `${className} · ${(byId(db.examGroups, groupId) || {}).name || ''}`,
      body: h('div', { className: 'stack-3' },
        Callout({ tone: 'info', icon: 'info', title: 'Expected format' },
          'One row per student. Column A is the admission number, then one column per subject code in the order shown on the grid. Blank cells are ignored; marks above the maximum are rejected with a row-level error.'),
        FileUpload({
          label: 'Drop the marks workbook here', hint: 'XLSX or CSV, up to 5 MB', accept: '.csv,.xlsx',
          onFiles: (files) => notify({ title: 'File staged', text: (files[0] && files[0].name) || 'marks.xlsx', tone: 'info' }),
        }),
        SectionCard({ title: 'Validation preview', icon: 'clipboard-check', flush: true },
          DataTable({
            columns: [
              { key: 'row', label: 'Row', width: 70, numeric: true },
              { key: 'admissionNo', label: 'Admission no', width: 150 },
              { key: 'name', label: 'Student', width: 200 },
              { key: 'issue', label: 'Validation', width: 280, render: (r) => Badge(r.issue, { tone: r.issue === 'OK' ? 'success' : 'danger' }) },
            ],
            rows: sheet.slice(0, 6).map((s, i) => ({
              row: i + 2, admissionNo: s.admissionNo, name: s.name,
              issue: i === 3 ? 'MAT 112 exceeds the maximum of 100' : i === 5 ? 'Admission number not found' : 'OK',
            })),
            paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
          })),
        Button('Download the template', {
          variant: 'link', icon: 'download',
          onClick: () => {
            download(`marks-template-${String(className).replace(/\s/g, '-')}.csv`,
              toCsv(sheet.map((s) => { const o = { admissionNo: s.admissionNo, name: s.name }; codes.forEach((c) => { o[c] = ''; }); return o; })),
              'text/csv;charset=utf-8');
            notify({ title: 'Template downloaded', tone: 'success' });
          },
        })),
      actions: (close) => frag(
        Button('Cancel', { variant: 'ghost', onClick: close }),
        Button('Import valid rows', { variant: 'primary', icon: 'upload', onClick: () => { close(); notify({ title: 'Import complete', text: '4 rows imported, 2 rejected — see the error report.', tone: 'success' }); } })),
    });

    host.appendChild(SectionCard({
      title: `Marks sheet — ${className}`,
      subtitle: `${(byId(db.examGroups, groupId) || {}).name || ''} · ${codes.length} subjects · ${sheet.length} students`,
      icon: 'edit', flush: true,
      actions: h('div', { className: 'row-3 row-wrap' },
        saveIndicator,
        Button('Bulk import', { variant: 'ghost', size: 'sm', icon: 'upload', onClick: bulkImport }),
        Button('Export sheet', {
          variant: 'ghost', size: 'sm', icon: 'download',
          onClick: () => {
            download(`marks-${String(className).replace(/\s/g, '-')}-${groupId}.csv`,
              toCsv(sheet.map((s) => {
                const o = { Admission: s.admissionNo, Name: s.name, Section: s.section };
                codes.forEach((c) => { o[c] = s.subjects[c] ? s.subjects[c].marksObtained : ''; });
                o.Total = s.obtained; o.Percent = s.percent; o.Grade = s.grade; o.Result = s.result;
                return o;
              })), 'text/csv;charset=utf-8');
            notify({ title: 'Marks sheet exported', tone: 'success' });
          },
        }),
        Button('Print', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(wrap, `${className} marks sheet`) })),
    }, h('div', { className: 'card-pad stack-3' },
      Callout({ tone: 'neutral', icon: 'command', title: 'Grid shortcuts' },
        'Enter or ↓ moves to the next student · ↑ previous student · ← → previous or next subject · a value above the paper maximum turns red and is not saved · every keystroke autosaves after a short pause.'),
      wrap)));

    host.appendChild(SectionCard({ title: 'Subject-wise averages for this class', className: 'chart-card' },
      barChart({
        categories: codes.map((c) => subjectName(c)),
        series: [{
          name: 'Average %',
          values: codes.map((c) => {
            const vals = sheet.map((r) => r.subjects[c]).filter(Boolean);
            return vals.length ? Math.round((vals.reduce((a, m) => a + m.percent, 0) / vals.length) * 10) / 10 : 0;
          }),
        }],
        valueFormat: 'percent', target: 60, targetLabel: 'Concern line', height: 250,
        title: 'Average percentage in every subject for this class',
      })));
  }

  const filters = filterCard([
    { id: 'group', label: 'Exam cycle', type: 'select', value: groupId, options: examGroupOptions() },
    { id: 'className', label: 'Class', type: 'select', value: className, options: classNames },
    { id: 'section', label: 'Section', type: 'select', options: ['A', 'B', 'C', 'D', 'E'] },
  ], (id, value) => {
    if (id === 'group' && value !== 'all') groupId = value;
    if (id === 'className' && value !== 'all') className = value;
    if (id === 'section') sectionFilter = value;
    build();
  });

  build();

  mount.appendChild(page({
    title: 'Marks Entry',
    subtitle: 'A spreadsheet built for speed — inline validation against the paper maximum, keyboard navigation across cells and continuous autosave.',
    route: 'examination/marks-entry',
    wide: true,
    actions: pageActions(
      Button('Grade configuration', { variant: 'secondary', icon: 'percent', route: 'examination/grade-config' }),
      Button('Submit for approval', {
        variant: 'primary', icon: 'check',
        onClick: () => ConfirmDialog({
          title: 'Submit these marks?',
          text: 'Once submitted the sheet is locked for the subject teacher. The examination controller can still reopen it.',
          confirmLabel: 'Submit marks', tone: 'brand', icon: 'check-circle',
        }).then((ok) => ok && notify({ title: 'Marks submitted', text: `${dirty.size} edits recorded · sheet locked for editing`, tone: 'success' })),
      })),
    children: [filters, host],
  }));
}

/* ==========================================================================
   19. EXAMINATION — grade configuration
   ========================================================================== */

function renderGradeConfig(mount, ctx) {
  ensureStyles();
  let scaleId = 'GS1';
  const host = h('div', { className: 'stack' });

  function build() {
    host.innerHTML = '';
    const scale = byId(db.gradeScales, scaleId) || db.gradeScales[0];
    const bands = scale.bands.map((b) => Object.assign({}, b));
    const marks = marksFor(ctx);

    const rowsHost = h('div', { className: 'stack-2' });
    const issuesHost = h('div');

    const validate = () => {
      const issues = [];
      const sorted = bands.slice().sort((a, b) => b.from - a.from);
      for (let i = 0; i < sorted.length; i++) {
        const b = sorted[i];
        if (b.from > b.to) issues.push(`${b.grade}: the lower bound (${b.from}) is above the upper bound (${b.to}).`);
        const next = sorted[i + 1];
        if (next && next.to !== b.from - 1) issues.push(`Gap or overlap between ${b.grade} and ${next.grade} around ${b.from}%.`);
      }
      if (!sorted.length || sorted[sorted.length - 1].from !== 0) issues.push('The scale does not reach 0%.');
      if (!sorted.length || sorted[0].to !== 100) issues.push('The scale does not reach 100%.');
      issuesHost.innerHTML = '';
      issuesHost.appendChild(issues.length
        ? Callout({ tone: 'danger', icon: 'alert-triangle', title: `${issues.length} problems with this scale` },
          h('ul', { className: 'stack-1', style: { margin: '0', paddingLeft: '18px' } }, issues.slice(0, 6).map((t) => h('li', { className: 't-sm' }, t))))
        : Callout({ tone: 'success', icon: 'check-circle', title: 'Scale is valid' },
          'Every percentage from 0 to 100 maps to exactly one grade, with no gaps and no overlaps.'));
    };

    const paintBands = () => {
      rowsHost.innerHTML = '';
      rowsHost.appendChild(h('div', { className: 'grade-band t-eyebrow' },
        h('span', null, 'Grade'), h('span', null, 'From (%)'), h('span', null, 'To (%)'), h('span', null, 'Point'), h('span', null, '')));
      bands.forEach((b, i) => {
        rowsHost.appendChild(h('div', { className: 'grade-band' },
          Input({ value: b.grade, onInput: (v) => { b.grade = v; } }),
          Input({ type: 'number', value: String(b.from), numeric: true, min: 0, max: 100, onInput: (v) => { b.from = Number(v); validate(); } }),
          Input({ type: 'number', value: String(b.to), numeric: true, min: 0, max: 100, onInput: (v) => { b.to = Number(v); validate(); } }),
          Input({ type: 'number', value: String(b.point), numeric: true, onInput: (v) => { b.point = Number(v); } }),
          IconButton('trash', {
            label: `Remove grade ${b.grade}`, size: 'sm',
            onClick: () => ConfirmDialog({
              title: `Remove grade ${b.grade}?`,
              text: 'Students currently holding this grade are re-graded on the next result run.',
              confirmLabel: 'Remove', tone: 'danger',
            }).then((ok) => { if (ok) { bands.splice(i, 1); paintBands(); validate(); notify({ title: 'Grade band removed', tone: 'warning' }); } }),
          })));
      });
    };

    paintBands();
    validate();

    const dist = bands.map((b) => ({ key: b.grade, value: marks.filter((m) => m.percent >= b.from && m.percent <= b.to).length }));

    host.appendChild(kpiRow([
      { label: 'Grade bands', value: String(bands.length), icon: 'layers', tone: 'brand' },
      { label: 'Marks rows graded', value: formatNumber(marks.length), icon: 'database', tone: 'info' },
      { label: 'Top grade share', value: `${marks.length && dist.length ? Math.round((dist[0].value / marks.length) * 1000) / 10 : 0}%`, icon: 'trophy', tone: 'success' },
      { label: 'Below pass', value: formatNumber(marks.filter((m) => m.status === 'Fail').length), icon: 'alert-triangle', tone: 'danger' },
    ]));

    host.appendChild(h('div', { className: 'widget-grid' },
      h('div', { className: 'span-7' }, SectionCard({
        title: `${scale.name} — grade bands`,
        subtitle: 'Edit the boundaries; validation runs on every keystroke.',
        icon: 'percent',
        actions: h('div', { className: 'row' },
          Button('Add band', { variant: 'ghost', size: 'sm', icon: 'plus', onClick: () => { bands.push({ grade: 'NEW', from: 0, to: 0, point: 0 }); paintBands(); validate(); } }),
          Button('Save scale', {
            variant: 'primary', size: 'sm', icon: 'check',
            onClick: () => notify({ title: 'Grade scale saved', text: `${scale.name} · ${bands.length} bands — demo build, nothing persisted.`, tone: 'success' }),
          })),
      }, h('div', { className: 'stack-3' }, rowsHost, issuesHost))),
      h('div', { className: 'span-5' }, SectionCard({ title: 'Live grade distribution', subtitle: `Applied to ${formatNumber(marks.length)} recorded marks`, className: 'chart-card' },
        barChart({
          categories: dist.map((d) => d.key),
          series: [{ name: 'Students', values: dist.map((d) => d.value) }],
          height: 300, showValues: true,
          title: 'How many recorded marks fall into each grade band',
        })))));

    host.appendChild(SectionCard({ title: 'Grade band reference', subtitle: 'What appears on the report card and the CBSE transcript', flush: true },
      DataTable({
        columns: [
          { key: 'grade', label: 'Grade', width: 150, sticky: true, render: (r) => Badge(r.grade, { tone: r.point >= 8 ? 'success' : r.point >= 5 ? 'warning' : 'danger' }) },
          { key: 'from', label: 'From (%)', width: 120, align: 'right', numeric: true },
          { key: 'to', label: 'To (%)', width: 120, align: 'right', numeric: true },
          { key: 'point', label: 'Grade point', width: 130, align: 'right', numeric: true },
          { key: 'width', label: 'Band width', width: 240, sortable: false, render: (r) => ProgressBar(r.to - r.from, { max: 100, tone: 'brand', size: 'sm', label: `${r.to - r.from} percentage points` }), value: (r) => r.to - r.from },
          { key: 'count', label: 'Students', width: 130, align: 'right', numeric: true, aggregate: 'sum', render: (r) => formatNumber(r.count) },
          { key: 'descriptor', label: 'Descriptor', width: 220 },
        ],
        rows: bands.map((b) => Object.assign({}, b, {
          count: marks.filter((m) => m.percent >= b.from && m.percent <= b.to).length,
          descriptor: b.point >= 9 ? 'Outstanding' : b.point >= 7 ? 'Very good' : b.point >= 5 ? 'Satisfactory' : b.point >= 4 ? 'Needs improvement' : 'Unsatisfactory',
        })),
        paginate: false, footerAggregates: true, maxHeight: 'none',
        emptyState: EmptyState({ icon: 'percent', title: 'No bands defined', text: 'Add at least one grade band to make this scale usable.' }),
        exportName: 'grade-bands',
      })));
  }

  const filters = filterCard([
    { id: 'scale', label: 'Grade scale', type: 'select', value: scaleId, options: db.gradeScales.map((g) => ({ value: g.id, label: g.name })) },
    { id: 'applies', label: 'Applies to', type: 'select', options: ['All classes', 'Classes I–V', 'Classes VI–VIII', 'Classes IX–X', 'Classes XI–XII'] },
  ], (id, value) => { if (id === 'scale' && value !== 'all') { scaleId = value; build(); } });

  build();

  mount.appendChild(page({
    title: 'Grade Configuration',
    subtitle: 'Grade bands, grade points and descriptors — one scale drives report cards, transcripts and the merit list.',
    route: 'examination/grade-config',
    actions: pageActions(
      Button('Weightage', { variant: 'secondary', icon: 'scale', route: 'examination/weightage' }),
      Button('New scale', { variant: 'primary', icon: 'plus', onClick: mockAction('Create grade scale') })),
    children: [filters, host],
  }));
}

/* ==========================================================================
   20. EXAMINATION — weightage
   ========================================================================== */

function renderWeightage(mount, ctx) {
  ensureStyles();
  const groups = db.examGroups.map((g) => Object.assign({}, g));
  const host = h('div', { className: 'stack' });

  function build() {
    host.innerHTML = '';
    const total = groups.reduce((a, g) => a + g.weightage, 0);

    const editor = h('div', { className: 'stack-3' },
      groups.map((g) => h('div', { className: 'row-3 row-wrap' },
        h('div', { style: { minWidth: '230px' } },
          h('div', { className: 't-medium' }, g.name),
          h('div', { className: 't-xs t-muted' }, `${g.term} · ${formatDate(g.from, 'dayMonth')} – ${formatDate(g.to, 'dayMonth')}`)),
        h('div', { className: 'flex-1', style: { minWidth: '160px' } }, ProgressBar(g.weightage, { max: 50, tone: 'brand', size: 'md' })),
        h('div', { style: { width: '130px' } },
          Input({
            type: 'number', value: String(g.weightage), numeric: true, min: 0, max: 100, suffix: '%',
            onInput: (v) => { g.weightage = Number(v) || 0; build(); },
          })))));

    host.appendChild(kpiRow([
      { label: 'Cycles', value: String(groups.length), icon: 'layers', tone: 'brand' },
      { label: 'Allocated', value: `${total}%`, icon: 'scale', tone: total === 100 ? 'success' : 'danger' },
      { label: 'Remaining', value: `${100 - total}%`, icon: 'percent', tone: total === 100 ? 'success' : 'warning' },
      { label: 'Term 1 share', value: `${groups.filter((g) => g.term === 'Term 1').reduce((a, g) => a + g.weightage, 0)}%`, icon: 'calendar', tone: 'info' },
    ]));

    host.appendChild(total === 100
      ? Callout({ tone: 'success', icon: 'check-circle', title: 'Weightage adds up to 100%' },
        'Final marks can be computed for every student in this academic year.')
      : Callout({ tone: 'danger', icon: 'alert-triangle', title: `Weightage totals ${total}%, not 100%` },
        'Result processing is blocked until the cycles add up to exactly 100%. Adjust the values below.'));

    host.appendChild(h('div', { className: 'widget-grid' },
      h('div', { className: 'span-7' }, SectionCard({
        title: 'Weightage per examination cycle',
        subtitle: 'CBSE assessment scheme — periodic tests, half yearly, pre-board and annual',
        icon: 'scale',
        actions: Button('Save weightage', {
          variant: 'primary', size: 'sm', icon: 'check', disabled: total !== 100,
          onClick: () => notify({ title: 'Weightage saved', text: 'Result processing unblocked.', tone: 'success' }),
        }),
      }, editor)),
      h('div', { className: 'span-5' }, SectionCard({ title: 'Contribution to the final result', className: 'chart-card' },
        donutChart({
          data: groups.map((g) => ({ key: g.name, value: g.weightage })),
          height: 280, centerLabel: 'Allocated', centerValue: `${total}%`, maxSlices: 6,
          title: 'Share of the final result carried by each examination cycle',
        })))));

    host.appendChild(SectionCard({
      title: 'Component weightage inside each paper',
      subtitle: 'Theory, practical, internal assessment and project split as prescribed by the board',
      flush: true,
    }, DataTable({
      columns: [
        { key: 'subject', label: 'Subject', width: 190, sticky: true },
        { key: 'theory', label: 'Theory', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => String(Math.round(v)) },
        { key: 'practical', label: 'Practical', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => String(Math.round(v)) },
        { key: 'internal', label: 'Internal', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => String(Math.round(v)) },
        { key: 'project', label: 'Project', width: 110, align: 'right', numeric: true },
        { key: 'total', label: 'Total', width: 100, align: 'right', numeric: true, render: (r) => h('span', { className: r.total === 100 ? 't-num t-semibold t-success' : 't-num t-semibold t-danger' }, String(r.total)) },
        {
          key: 'split', label: 'Split', width: 280, sortable: false,
          render: (r) => stackedProgressBar({
            segments: [
              { label: 'Theory', value: r.theory, color: 'var(--chart-1)' },
              { label: 'Practical', value: r.practical, color: 'var(--chart-2)' },
              { label: 'Internal', value: r.internal, color: 'var(--chart-3)' },
              { label: 'Project', value: r.project, color: 'var(--chart-4)' },
            ],
            barHeight: 10, showLegend: false,
          }),
        },
        { key: 'board', label: 'Board rule', width: 170 },
      ],
      rows: db.subjects.slice(0, 18).map((s) => {
        const practical = s.hasPractical ? 30 : 0;
        const internal = s.hasPractical ? 0 : 20;
        const project = 0;
        const theory = 100 - practical - internal - project;
        return { subject: s.name, theory, practical, internal, project, total: 100, board: s.hasPractical ? 'CBSE 70 + 30' : 'CBSE 80 + 20' };
      }),
      paginate: false, footerAggregates: true, maxHeight: '52vh',
      exportName: 'component-weightage',
    })));
  }

  build();

  mount.appendChild(page({
    title: 'Examination Weightage',
    subtitle: 'How each examination cycle and each paper component rolls into the final result printed on the report card.',
    route: 'examination/weightage',
    actions: pageActions(
      Button('Exam groups', { variant: 'secondary', icon: 'layers', route: 'examination/groups' }),
      Button('Recalculate results', { variant: 'primary', icon: 'refresh', route: 'examination/result-processing' })),
    children: host,
  }));
}

/* ==========================================================================
   21. EXAMINATION — question bank
   ========================================================================== */

function renderQuestionBank(mount, ctx) {
  ensureStyles();
  const all = db.questionBank;
  const bySubject = countBy(all, 'subjectName');
  const byDifficulty = countBy(all, 'difficulty');
  const byType = countBy(all, 'type');
  const byBloom = countBy(all, 'bloomLevel');

  const preview = (q) => Drawer({
    title: `${q.subjectName} — ${q.topic}`,
    subtitle: `${q.type} · ${q.difficulty} · ${q.marks} mark(s) · ${q.bloomLevel}`,
    size: 'md',
    body: h('div', { className: 'stack-3' },
      h('div', { className: 'row-3 row-wrap' },
        Badge(q.status),
        Badge(q.difficulty, { tone: q.difficulty === 'Hard' ? 'danger' : q.difficulty === 'Medium' ? 'warning' : 'success' }),
        Badge(q.type, { tone: 'neutral' }),
        Badge(`${q.marks} marks`, { tone: 'info' })),
      SectionCard({ title: 'Question', icon: 'help-circle' }, h('p', { className: 't-body' }, q.text)),
      q.type === 'MCQ' ? SectionCard({ title: 'Options', icon: 'list' },
        h('div', { className: 'stack-2' },
          ['A', 'B', 'C', 'D'].map((o, i) => h('div', { className: 'oe-opt', dataset: { sel: i === (hash32(q.id) % 4) ? '1' : '0' } },
            h('span', { className: 't-semibold' }, o + '.'),
            h('span', { className: 'flex-1' }, `Option ${o} for ${q.subjectName.toLowerCase()}, ${q.topic.toLowerCase()}.`),
            i === (hash32(q.id) % 4) ? Badge('Correct', { tone: 'success', size: 'sm' }) : null)))) : null,
      DescriptionList([
        ['Question ID', q.id], ['Subject', `${q.subjectName} (${q.subjectCode})`],
        ['Class level', `Level ${q.classLevel}`], ['Topic', q.topic],
        ['Bloom level', q.bloomLevel], ['Times used', String(q.usedCount)],
        ['Status', q.status], ['Marks', String(q.marks)],
      ], { cols: 2 })),
    actions: (close) => frag(
      Button('Close', { variant: 'ghost', onClick: close }),
      Button('Add to paper', { variant: 'secondary', icon: 'plus', onClick: () => { close(); notify({ title: 'Added to the paper draft', text: q.id, tone: 'success' }); } }),
      Button('Edit question', { variant: 'primary', icon: 'edit', onClick: mockAction('Edit question') })),
  });

  const node = listPage({
    title: 'Question Bank',
    subtitle: `${formatNumber(all.length)} vetted questions across ${bySubject.length} subjects — filter by chapter, difficulty, type and Bloom level to assemble a paper.`,
    route: 'examination/question-bank',
    actions: pageActions(
      Button('Import questions', { variant: 'secondary', icon: 'upload', onClick: mockAction('Import question bank') }),
      Button('Add question', {
        variant: 'primary', icon: 'plus',
        onClick: () => formPage({
          title: 'Add a question', mode: 'modal', size: 'lg', submitLabel: 'Save question',
          sections: [{
            title: 'Question', cols: 2,
            fields: [
              { id: 'subject', label: 'Subject', type: 'select', required: true, options: db.subjects.map((s) => s.name) },
              { id: 'level', label: 'Class', type: 'select', required: true, options: db.classes.filter((c) => c.campusId === 'C1').map((c) => c.name) },
              { id: 'topic', label: 'Chapter or topic', required: true, validate: validators.required },
              { id: 'type', label: 'Question type', type: 'select', required: true, options: ['MCQ', 'Short Answer', 'Long Answer', 'True/False', 'Fill in the Blank', 'Case Study'] },
              { id: 'difficulty', label: 'Difficulty', type: 'radio', inline: true, options: ['Easy', 'Medium', 'Hard'] },
              { id: 'bloom', label: 'Bloom level', type: 'select', options: ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create'] },
              { id: 'marks', label: 'Marks', type: 'number', required: true, validate: [validators.required, validators.number] },
              { id: 'time', label: 'Expected time (minutes)', type: 'number', validate: validators.number },
              { id: 'text', label: 'Question text', type: 'textarea', span: 'full', required: true, validate: validators.required },
              { id: 'answer', label: 'Model answer / marking scheme', type: 'textarea', span: 'full' },
              { id: 'attachment', label: 'Diagram or attachment', type: 'file', span: 'full' },
            ],
          }],
          onSubmit: (v) => notify({ title: 'Question added', text: `${v.subject || 'Question'} · ${v.marks || 1} mark(s) — pending review.`, tone: 'success' }),
        }),
      })),
    kpis: [
      { label: 'Questions', value: formatNumber(all.length), icon: 'database', tone: 'brand' },
      { label: 'Approved', value: formatNumber(all.filter((q) => q.status === 'Approved').length), icon: 'check-circle', tone: 'success' },
      { label: 'Awaiting review', value: formatNumber(all.filter((q) => q.status !== 'Approved').length), icon: 'clock', tone: 'warning' },
      { label: 'Never used', value: formatNumber(all.filter((q) => q.usedCount === 0).length), icon: 'archive', tone: 'info' },
    ],
    chart: h('div', { className: 'widget-grid' },
      h('div', { className: 'span-6' }, barChart({
        categories: bySubject.slice(0, 10).map((s) => s.key),
        series: [{ name: 'Questions', values: bySubject.slice(0, 10).map((s) => s.value) }],
        horizontal: true, height: 280, title: 'Question count by subject',
      })),
      h('div', { className: 'span-3' }, donutChart({
        data: byDifficulty, height: 280, centerLabel: 'Difficulty', title: 'Split of questions by difficulty',
      })),
      h('div', { className: 'span-3' }, donutChart({
        data: byBloom, height: 280, centerLabel: 'Bloom', maxSlices: 6, title: 'Split of questions by Bloom taxonomy level',
      }))),
    chartTitle: 'Bank composition',
    filters: [
      { id: 'q', type: 'search', label: 'Search', placeholder: 'Question text or topic…' },
      { id: 'subjectName', label: 'Subject', options: bySubject.map((s) => s.key) },
      { id: 'topic', label: 'Chapter', options: distinct(all, 'topic') },
      { id: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'] },
      { id: 'type', label: 'Type', options: byType.map((t) => t.key) },
      { id: 'bloomLevel', label: 'Bloom level', options: byBloom.map((b) => b.key) },
      { id: 'status', label: 'Status', options: ['Approved', 'Draft', 'Under Review'] },
    ],
    onFilter: (id, value, allv, table) => {
      let out = all.slice();
      if (allv.q) out = search(out, allv.q, ['text', 'topic', 'subjectName']);
      ['subjectName', 'topic', 'difficulty', 'type', 'bloomLevel', 'status'].forEach((k) => {
        if (allv[k] && allv[k] !== 'all') out = out.filter((r) => r[k] === allv[k]);
      });
      table.refresh(out);
    },
    columns: [
      { key: 'id', label: 'ID', width: 110, sticky: true, className: 't-mono' },
      { key: 'text', label: 'Question', width: 380, render: (r) => h('span', { className: 't-sm t-clamp-2' }, r.text) },
      { key: 'subjectName', label: 'Subject', width: 160, filter: true },
      { key: 'topic', label: 'Chapter', width: 130, filter: true },
      { key: 'classLevel', label: 'Level', width: 90, align: 'right', numeric: true },
      { key: 'type', label: 'Type', width: 150, filter: true, render: (r) => Badge(r.type, { tone: 'neutral' }) },
      { key: 'difficulty', label: 'Difficulty', width: 120, filter: true, render: (r) => Badge(r.difficulty, { tone: r.difficulty === 'Hard' ? 'danger' : r.difficulty === 'Medium' ? 'warning' : 'success' }) },
      { key: 'bloomLevel', label: 'Bloom', width: 130, filter: true, hidden: true },
      { key: 'marks', label: 'Marks', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'usedCount', label: 'Used', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
    ],
    rows: all,
    selectable: true, footerAggregates: true, pageSize: 25,
    searchKeys: ['text', 'topic', 'subjectName', 'id'],
    bulkActions: [
      { label: 'Assemble into a paper', icon: 'file-text', onClick: (sel) => notify({ title: 'Paper draft created', text: `${sel.length} questions · ${sum(sel, 'marks')} marks total`, tone: 'success' }) },
      { label: 'Approve selected', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} questions approved`, tone: 'success' }) },
      { label: 'Export selection', icon: 'download', onClick: (sel) => { download('question-paper.csv', toCsv(sel), 'text/csv;charset=utf-8'); notify({ title: 'Exported', tone: 'success' }); } },
      { label: 'Retire questions', icon: 'archive', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} questions retired`, tone: 'warning' }) },
    ],
    rowActions: (r) => [
      { label: 'Preview', icon: 'eye', onClick: () => preview(r) },
      { label: 'Edit', icon: 'edit', onClick: mockAction('Edit question') },
      { label: 'Duplicate', icon: 'copy', onClick: mockAction('Duplicate question') },
      { separator: true },
      { label: 'Retire', icon: 'archive', tone: 'danger', onClick: () => ConfirmDialog({ title: 'Retire this question?', text: 'It stays in the archive but cannot be added to new papers.', confirmLabel: 'Retire', tone: 'danger' }).then((ok) => ok && notify({ title: 'Question retired', tone: 'warning' })) },
    ],
    onRowClick: preview,
    emptyState: EmptyState({ icon: 'database', title: 'No questions match', text: 'Loosen a filter, or add a new question to the bank.' }),
    exportName: 'question-bank',
    tableTitle: 'Questions',
    tableSubtitle: 'Select rows to assemble a paper — the total marks are computed as you go.',
  });

  mount.appendChild(node);
}

/* ==========================================================================
   22. EXAMINATION — online exams (builder + student runner)
   ========================================================================== */

function renderOnlineExams(mount, ctx) {
  ensureStyles();
  const tests = db.onlineTests;
  const bank = db.questionBank.filter((q) => q.status === 'Approved' && q.type === 'MCQ');

  function runner(test) {
    const qs = bank.slice(0, 20);
    const answers = new Map();
    const flagged = new Set();
    let idx = 0;
    let remaining = (test.durationMin || 45) * 60;

    const timerEl = h('span', { className: 'oe-timer' }, '00:00');
    const paletteHost = h('div', { className: 'oe-palette' });
    const qHost = h('div', { className: 'stack-3' });
    const progressHost = h('div');

    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    timerEl.textContent = fmt(remaining);
    const tick = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      timerEl.textContent = fmt(remaining);
      if (remaining === 0) clearInterval(tick);
    }, 1000);

    const paintProgress = () => {
      progressHost.innerHTML = '';
      progressHost.appendChild(RadialProgress(Math.round((answers.size / qs.length) * 100), {
        size: 78, thickness: 8, tone: 'brand', label: `${answers.size}/${qs.length}`, sublabel: 'answered',
      }));
    };

    const paintPalette = () => {
      paletteHost.innerHTML = '';
      qs.forEach((q, i) => {
        const s = i === idx ? 'current' : flagged.has(i) ? 'review' : answers.has(i) ? 'answered' : 'todo';
        paletteHost.appendChild(h('button', {
          type: 'button', className: 'oe-q', dataset: { s },
          attrs: { 'aria-label': `Question ${i + 1}` },
          onClick: () => { idx = i; paintQ(); paintPalette(); },
        }, String(i + 1)));
      });
      paintProgress();
    };

    const paintQ = () => {
      const q = qs[idx];
      qHost.innerHTML = '';
      qHost.appendChild(h('div', { className: 'row-3 row-wrap' },
        h('span', { className: 't-eyebrow' }, `Question ${idx + 1} of ${qs.length}`),
        Badge(`${q.marks} mark(s)`, { tone: 'info', size: 'sm' }),
        Badge(q.difficulty, { tone: q.difficulty === 'Hard' ? 'danger' : q.difficulty === 'Medium' ? 'warning' : 'success', size: 'sm' }),
        h('span', { className: 'spacer' }),
        test.negativeMarking ? Badge('Negative marking −0.25', { tone: 'danger', size: 'sm' }) : null));
      qHost.appendChild(h('p', { className: 't-body' }, q.text));
      qHost.appendChild(h('div', { className: 'stack-2' },
        ['A', 'B', 'C', 'D'].map((o) => h('div', {
          className: 'oe-opt', dataset: { sel: answers.get(idx) === o ? '1' : '0' },
          attrs: { role: 'button', tabindex: '0' },
          onClick: () => { answers.set(idx, o); paintQ(); paintPalette(); },
          onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); answers.set(idx, o); paintQ(); paintPalette(); } },
        },
          h('span', { className: 't-semibold' }, o + '.'),
          h('span', { className: 'flex-1' }, `${q.subjectName} option ${o} — a plausible response drawn from ${q.topic.toLowerCase()}.`)))));
      qHost.appendChild(h('div', { className: 'row-3 row-wrap mt-3' },
        Button('Previous', { variant: 'ghost', icon: 'chevron-left', disabled: idx === 0, onClick: () => { idx = Math.max(0, idx - 1); paintQ(); paintPalette(); } }),
        Button(flagged.has(idx) ? 'Unflag' : 'Flag for review', {
          variant: 'secondary', icon: 'flag',
          onClick: () => { if (flagged.has(idx)) flagged.delete(idx); else flagged.add(idx); paintQ(); paintPalette(); },
        }),
        Button('Clear response', { variant: 'ghost', icon: 'x', onClick: () => { answers.delete(idx); paintQ(); paintPalette(); } }),
        h('span', { className: 'spacer' }),
        Button('Save & next', { variant: 'primary', iconRight: 'chevron-right', disabled: idx === qs.length - 1, onClick: () => { idx = Math.min(qs.length - 1, idx + 1); paintQ(); paintPalette(); } })));
    };

    paintQ(); paintPalette();

    Modal({
      title: test.title,
      subtitle: `${test.className} · ${qs.length} questions · ${test.totalMarks} marks · ${test.durationMin} minutes`,
      size: 'full', icon: 'monitor', closable: true, dismissOnScrim: false,
      onClose: () => clearInterval(tick),
      body: h('div', { className: 'detail-split' },
        Card({ pad: true }, qHost),
        h('div', { className: 'stack-3' },
          Card({ pad: true },
            h('div', { className: 'row', style: { justifyContent: 'space-between', alignItems: 'center' } },
              h('div', null, h('div', { className: 't-eyebrow' }, 'Time remaining'), timerEl),
              progressHost)),
          SectionCard({ title: 'Question palette', icon: 'grid' },
            h('div', { className: 'stack-3' },
              paletteHost,
              h('div', { className: 'legend-row' },
                h('span', { className: 'am-chip' }, h('span', { className: 'am-dot', style: { background: 'var(--success-500)' } }), 'Answered'),
                h('span', { className: 'am-chip' }, h('span', { className: 'am-dot', style: { background: 'var(--warning-500)' } }), 'Marked for review'),
                h('span', { className: 'am-chip' }, h('span', { className: 'am-dot', style: { background: 'var(--surface-sunken)', border: '1px solid var(--border)' } }), 'Not visited')))),
          Callout({ tone: 'warning', icon: 'shield', title: 'Proctoring is active' },
            'Tab switches, copy attempts and window blur events are recorded. Three violations end the attempt automatically.'))),
      actions: (close) => frag(
        Button('Save & exit', { variant: 'ghost', onClick: () => { clearInterval(tick); close(); notify({ title: 'Attempt saved', text: 'You can resume until the window closes.', tone: 'info' }); } }),
        Button('Submit test', {
          variant: 'primary', icon: 'check',
          onClick: () => ConfirmDialog({
            title: 'Submit this test?',
            text: `${answers.size} of ${qs.length} questions answered, ${flagged.size} flagged for review. Submission is final.`,
            confirmLabel: 'Submit', tone: 'brand', icon: 'check-circle',
          }).then((ok) => { if (ok) { clearInterval(tick); close(); notify({ title: 'Test submitted', text: `${answers.size} responses recorded`, tone: 'success' }); } }),
        })),
    });
  }

  const builder = (test) => Drawer({
    title: test ? `Edit — ${test.title}` : 'New online exam',
    subtitle: 'Pick questions from the bank, set the timing and the proctoring rules',
    size: 'xl',
    body: h('div', { className: 'stack-3' },
      FormGrid({ cols: 2 },
        Field({ label: 'Title', required: true }, Input({ value: test ? test.title : '', placeholder: 'Class X — Mathematics unit test' })),
        Field({ label: 'Class', required: true }, Select({ options: distinct(tests, 'className'), value: test ? test.className : null, onChange: () => {} })),
        Field({ label: 'Duration (minutes)', required: true }, Input({ type: 'number', value: String(test ? test.durationMin : 45), numeric: true })),
        Field({ label: 'Total marks', required: true }, Input({ type: 'number', value: String(test ? test.totalMarks : 40), numeric: true })),
        Field({ label: 'Scheduled on' }, DatePicker({ value: test ? String(test.scheduledOn).slice(0, 10) : TODAY, onChange: () => {} })),
        Field({ label: 'Start time' }, TimePicker({ value: '10:00', onChange: () => {} })),
        Field({ label: 'Shuffle questions' }, Switch('Randomise question order per student', { checked: true })),
        Field({ label: 'Negative marking' }, Switch('Deduct 0.25 for a wrong answer', { checked: !!(test && test.negativeMarking) }))),
      SectionCard({ title: 'Question selection', subtitle: `${formatNumber(bank.length)} approved objective questions available`, icon: 'database', flush: true },
        DataTable({
          columns: [
            { key: 'text', label: 'Question', width: 320, render: (r) => h('span', { className: 't-sm t-clamp-2' }, r.text) },
            { key: 'subjectName', label: 'Subject', width: 150, filter: true },
            { key: 'difficulty', label: 'Difficulty', width: 120, filter: true, render: (r) => Badge(r.difficulty, { tone: r.difficulty === 'Hard' ? 'danger' : r.difficulty === 'Medium' ? 'warning' : 'success', size: 'sm' }) },
            { key: 'marks', label: 'Marks', width: 80, align: 'right', numeric: true, aggregate: 'sum' },
          ],
          rows: bank.slice(0, 120), selectable: true, pageSize: 10, footerAggregates: true,
          bulkActions: [{ label: 'Add to paper', icon: 'plus', onClick: (sel) => notify({ title: `${sel.length} questions added`, text: `${sum(sel, 'marks')} marks`, tone: 'success' }) }],
          exportable: false, maxHeight: '40vh',
          emptyState: EmptyState({ icon: 'database', title: 'No approved objective questions', text: 'Approve questions in the question bank first.' }),
        })),
      Callout({ tone: 'info', icon: 'shield', title: 'Proctoring' },
        'Full-screen lock, tab-switch detection and webcam snapshots every sixty seconds are enabled for all online exams by default.')),
    actions: (close) => frag(
      Button('Cancel', { variant: 'ghost', onClick: close }),
      Button('Preview as a student', { variant: 'secondary', icon: 'eye', onClick: () => { close(); runner(test || tests[0]); } }),
      Button('Save exam', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Online exam saved', tone: 'success' }); } })),
  });

  const node = listPage({
    title: 'Online Exams',
    subtitle: `${formatNumber(tests.length)} computer-based tests · proctored, auto-graded and published straight to the student portal`,
    route: 'examination/online-exams',
    actions: pageActions(
      Button('Try the student view', { variant: 'secondary', icon: 'monitor', onClick: () => runner(tests[0]) }),
      Button('Create online exam', { variant: 'primary', icon: 'plus', onClick: () => builder(null) })),
    kpis: [
      { label: 'Tests', value: formatNumber(tests.length), icon: 'monitor', tone: 'brand' },
      { label: 'Live or scheduled', value: formatNumber(tests.filter((t) => t.status !== 'Completed').length), icon: 'clock', tone: 'warning' },
      { label: 'Attempts recorded', value: formatNumber(sum(tests, 'attempted')), icon: 'users', tone: 'info' },
      { label: 'Average score', value: `${Math.round(avg(tests, 'avgScore'))}%`, icon: 'percent', tone: 'success' },
    ],
    chart: h('div', { className: 'widget-grid' },
      h('div', { className: 'span-8' }, scatterPlot({
        points: tests.slice(0, 60).map((t) => ({ x: t.durationMin, y: t.avgScore, label: t.title, group: t.status })),
        xLabel: 'Duration (minutes)', yLabel: 'Average score (%)', height: 280,
        title: 'Average score against test duration, grouped by status',
      })),
      h('div', { className: 'span-4' }, donutChart({
        data: countBy(tests, 'status'), height: 280, centerLabel: 'Tests', centerValue: String(tests.length),
        title: 'Online tests by status',
      }))),
    chartTitle: 'Test outcomes',
    filters: [
      { id: 'q', type: 'search', label: 'Search', placeholder: 'Test title…' },
      { id: 'className', label: 'Class', options: distinct(tests, 'className') },
      { id: 'status', label: 'Status', options: distinct(tests, 'status') },
      { id: 'neg', label: 'Negative marking', options: ['Yes', 'No'] },
    ],
    onFilter: (id, value, allv, table) => {
      let out = tests.slice();
      if (allv.q) out = search(out, allv.q, ['title', 'className']);
      ['className', 'status'].forEach((k) => { if (allv[k] && allv[k] !== 'all') out = out.filter((r) => r[k] === allv[k]); });
      if (allv.neg === 'Yes') out = out.filter((r) => r.negativeMarking);
      if (allv.neg === 'No') out = out.filter((r) => !r.negativeMarking);
      table.refresh(out);
    },
    columns: [
      { key: 'title', label: 'Test', width: 280, sticky: true, render: (r) => Identity(r.title, `${r.className} · ${r.questions} questions`), value: (r) => r.title },
      { key: 'totalMarks', label: 'Marks', width: 90, align: 'right', numeric: true },
      { key: 'durationMin', label: 'Duration', width: 110, align: 'right', numeric: true, render: (r) => `${r.durationMin} min` },
      { key: 'scheduledOn', label: 'Scheduled', width: 140, render: (r) => formatDate(r.scheduledOn), value: (r) => r.scheduledOn },
      {
        key: 'attempted', label: 'Attempted', width: 170, align: 'right', numeric: true, aggregate: 'sum',
        render: (r) => h('div', { className: 'row', style: { justifyContent: 'flex-end', gap: 'var(--sp-2)' } },
          h('span', { className: 't-num' }, `${r.attempted}/${r.totalStudents}`),
          h('span', { style: { width: '50px' } }, ProgressBar(r.totalStudents ? (r.attempted / r.totalStudents) * 100 : 0, { tone: 'brand', size: 'sm' }))),
        value: (r) => r.attempted,
      },
      { key: 'avgScore', label: 'Avg score', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v)}%`, render: (r) => `${r.avgScore}%` },
      { key: 'passPct', label: 'Pass %', width: 110, align: 'right', numeric: true, render: (r) => h('span', { className: `t-num t-${pctTone(r.passPct)}` }, `${r.passPct}%`) },
      { key: 'negativeMarking', label: 'Negative', width: 110, render: (r) => (r.negativeMarking ? Badge('Yes', { tone: 'danger' }) : Badge('No', { tone: 'neutral' })), value: (r) => (r.negativeMarking ? 1 : 0) },
      { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
    ],
    rows: tests,
    selectable: true, footerAggregates: true, pageSize: 25,
    searchKeys: ['title', 'className', 'createdBy'],
    bulkActions: [
      { label: 'Publish results', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} result sets published`, tone: 'success' }) },
      { label: 'Duplicate', icon: 'copy', onClick: (sel) => notify({ title: `${sel.length} tests duplicated`, tone: 'info' }) },
    ],
    rowActions: (r) => [
      { label: 'Preview as a student', icon: 'monitor', onClick: () => runner(r) },
      { label: 'Edit in the builder', icon: 'edit', onClick: () => builder(r) },
      { label: 'Response analysis', icon: 'chart-bar', route: 'examination/performance' },
      { separator: true },
      { label: 'Cancel test', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: 'Cancel this test?', text: 'Students who have already started keep their attempt; the test disappears from every other portal.', confirmLabel: 'Cancel test', tone: 'danger' }).then((ok) => ok && notify({ title: 'Test cancelled', tone: 'danger' })) },
    ],
    onRowClick: (r) => builder(r),
    emptyState: EmptyState({ icon: 'monitor', title: 'No online exams', text: 'Create the first computer-based test for this class.' }),
    exportName: 'online-exams',
    tableTitle: 'Computer-based tests',
  });

  mount.appendChild(node);
}

/* ==========================================================================
   23. EXAMINATION — OMR processing
   ========================================================================== */

function renderOMR(mount, ctx) {
  ensureStyles();
  const exams = examsFor(ctx);
  const batches = Array.from({ length: 14 }, (_, i) => {
    const e = exams[(i * 37) % exams.length] || exams[0];
    const total = 120 + (hash32('omr' + i) % 180);
    const failed = hash32('omrf' + i) % 9;
    const ambiguous = hash32('omra' + i) % 14;
    return {
      id: 'OMR' + String(1001 + i),
      batch: `Batch ${i + 1}`,
      examGroupName: e.examGroupName,
      className: e.className,
      subjectName: e.subjectName,
      date: e.date,
      sheets: total,
      processed: total - failed,
      failed,
      ambiguous,
      accuracy: Math.round(((total - failed - ambiguous * 0.5) / total) * 1000) / 10,
      scanner: `Scanner ${(i % 3) + 1}`,
      uploadedBy: (db.staff[(i * 5) % db.staff.length] || db.staff[0]).name,
      status: failed > 5 ? 'Needs Review' : 'Completed',
    };
  });

  const sheetPreview = () => h('div', { className: 'stack-3' },
    h('div', { className: 't-eyebrow' }, 'Detected bubbles — questions 1 to 100'),
    h('div', { className: 'omr-sheet' },
      Array.from({ length: 100 }, (_, i) => h('div', {
        className: 'omr-bubble', dataset: { f: hash32('bub' + i) % 4 === 0 ? '1' : '0' },
      }, ['A', 'B', 'C', 'D'][i % 4]))));

  const reviewDrawer = (b) => Drawer({
    title: `${b.batch} — ${b.subjectName}`,
    subtitle: `${b.className} · ${b.examGroupName} · ${formatNumber(b.sheets)} sheets`,
    size: 'lg',
    body: h('div', { className: 'stack-3' },
      kpiRow([
        { label: 'Sheets', value: formatNumber(b.sheets), icon: 'scan', tone: 'brand' },
        { label: 'Read successfully', value: formatNumber(b.processed), icon: 'check-circle', tone: 'success' },
        { label: 'Rejected', value: String(b.failed), icon: 'x-circle', tone: b.failed ? 'danger' : 'success' },
        { label: 'Ambiguous marks', value: String(b.ambiguous), icon: 'help-circle', tone: b.ambiguous ? 'warning' : 'success' },
      ]),
      b.failed ? Callout({ tone: 'danger', icon: 'alert-triangle', title: `${b.failed} sheets could not be read` },
        'Common causes: torn corner registration marks, pencil lighter than 2B, or a roll number bubbled in two columns. Rescan or key these in manually.') : null,
      SectionCard({ title: 'Sheet preview', icon: 'scan' }, sheetPreview()),
      SectionCard({ title: 'Rejected sheets', flush: true },
        DataTable({
          columns: [
            { key: 'seq', label: '#', width: 70, numeric: true },
            { key: 'roll', label: 'Roll number', width: 140, className: 't-mono' },
            { key: 'reason', label: 'Rejection reason', width: 320 },
            { key: 'action', label: 'Resolution', width: 190, sortable: false, render: () => Button('Key in manually', { variant: 'link', size: 'sm', onClick: mockAction('Manual key-in') }) },
          ],
          rows: Array.from({ length: b.failed }, (_, i) => ({
            seq: i + 1,
            roll: String(1000 + (hash32(b.id + i) % 900)),
            reason: ['Registration mark not detected', 'Double bubble on the roll number', 'Sheet skewed beyond tolerance', 'Faint marking, below threshold'][i % 4],
          })),
          paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
          emptyState: EmptyState({ icon: 'check-circle', title: 'No rejections', text: 'Every sheet in this batch was read cleanly.' }),
        }))),
    actions: (close) => frag(
      Button('Close', { variant: 'ghost', onClick: close }),
      Button('Rescan batch', { variant: 'secondary', icon: 'refresh', onClick: mockAction('Rescan batch') }),
      Button('Push to marks entry', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Scores pushed', text: `${b.processed} results written to the marks sheet.`, tone: 'success' }); navigate('examination/marks-entry'); } })),
  });

  const uploadModal = () => {
    const progressHost = h('div');
    let pct = 0;
    Modal({
      title: 'Upload OMR sheets', icon: 'upload', size: 'lg',
      subtitle: 'Scanned PDF or TIFF bundles from the exam cell scanner',
      body: h('div', { className: 'stack-3' },
        FormGrid({ cols: 2 },
          Field({ label: 'Exam cycle', required: true }, Select({ options: examGroupOptions(), onChange: () => {} })),
          Field({ label: 'Paper', required: true }, Combobox({ options: exams.slice(0, 60).map((e) => ({ value: e.id, label: `${e.className} · ${e.subjectName}` })), onChange: () => {}, width: '100%' })),
          Field({ label: 'Answer key', required: true }, Select({ options: ['Set A', 'Set B', 'Set C', 'Set D'], onChange: () => {} })),
          Field({ label: 'Scanner profile' }, Select({ options: ['Scanner 1 — 300 dpi', 'Scanner 2 — 300 dpi', 'Scanner 3 — 600 dpi'], onChange: () => {} }))),
        FileUpload({
          label: 'Drop the scanned bundle here', hint: 'PDF or multi-page TIFF, up to 200 MB', accept: '.pdf,.tif,.tiff',
          onFiles: (files) => {
            notify({ title: 'Processing started', text: (files[0] && files[0].name) || 'omr-batch.pdf', tone: 'info' });
            const t = setInterval(() => {
              pct = Math.min(100, pct + 7);
              progressHost.innerHTML = '';
              progressHost.appendChild(ProgressBar(pct, {
                tone: pct === 100 ? 'success' : 'brand', size: 'lg', showValue: true,
                label: pct === 100 ? 'Processing complete' : 'Reading sheets',
              }));
              if (pct === 100) { clearInterval(t); notify({ title: 'OMR batch processed', text: '168 sheets read · 2 rejected', tone: 'success' }); }
            }, 220);
          },
        }),
        progressHost,
        Callout({ tone: 'info', icon: 'info', title: 'Scanning guidance' },
          'Scan at 300 dpi in greyscale. Keep the four registration marks clear of the page edge. Sheets marked in pencil lighter than 2B are commonly rejected.')),
      actions: (close) => frag(
        Button('Close', { variant: 'ghost', onClick: close }),
        Button('Process batch', { variant: 'primary', icon: 'scan', onClick: () => { close(); notify({ title: 'Batch queued', tone: 'success' }); } })),
    });
  };

  const node = listPage({
    title: 'OMR Processing',
    subtitle: `${formatNumber(sum(batches, 'sheets'))} answer sheets scanned this session across ${batches.length} batches`,
    route: 'examination/omr',
    actions: pageActions(
      Button('Answer keys', { variant: 'secondary', icon: 'key', onClick: mockAction('Manage answer keys') }),
      Button('Upload sheets', { variant: 'primary', icon: 'upload', onClick: uploadModal })),
    kpis: [
      { label: 'Sheets scanned', value: formatNumber(sum(batches, 'sheets')), icon: 'scan', tone: 'brand' },
      { label: 'Read successfully', value: formatNumber(sum(batches, 'processed')), icon: 'check-circle', tone: 'success' },
      { label: 'Rejected', value: formatNumber(sum(batches, 'failed')), icon: 'x-circle', tone: sum(batches, 'failed') ? 'danger' : 'success' },
      { label: 'Read accuracy', value: `${Math.round(avg(batches, 'accuracy') * 10) / 10}%`, icon: 'gauge', tone: 'info' },
    ],
    chart: barChart({
      categories: batches.map((b) => b.batch),
      series: [
        { name: 'Read', values: batches.map((b) => b.processed) },
        { name: 'Rejected', values: batches.map((b) => b.failed) },
      ],
      stacked: true, height: 250,
      title: 'Sheets read versus rejected in each scanning batch',
    }),
    chartTitle: 'Batch throughput',
    filters: [
      { id: 'q', type: 'search', label: 'Search', placeholder: 'Batch, class or subject…' },
      { id: 'examGroupName', label: 'Exam cycle', options: distinct(batches, 'examGroupName') },
      { id: 'className', label: 'Class', options: distinct(batches, 'className') },
      { id: 'status', label: 'Status', options: ['Completed', 'Needs Review'] },
    ],
    onFilter: (id, value, allv, table) => {
      let out = batches.slice();
      if (allv.q) out = search(out, allv.q, ['batch', 'className', 'subjectName']);
      ['examGroupName', 'className', 'status'].forEach((k) => { if (allv[k] && allv[k] !== 'all') out = out.filter((r) => r[k] === allv[k]); });
      table.refresh(out);
    },
    columns: [
      { key: 'batch', label: 'Batch', width: 130, sticky: true, render: (r) => h('span', { className: 't-semibold' }, r.batch) },
      { key: 'className', label: 'Class', width: 120, filter: true },
      { key: 'subjectName', label: 'Subject', width: 170, filter: true },
      { key: 'examGroupName', label: 'Exam cycle', width: 210, filter: true },
      { key: 'date', label: 'Paper date', width: 130, render: (r) => formatDate(r.date), value: (r) => r.date },
      { key: 'sheets', label: 'Sheets', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'processed', label: 'Read', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'failed', label: 'Rejected', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => h('span', { className: r.failed ? 't-danger t-num t-semibold' : 't-num' }, String(r.failed)) },
      { key: 'ambiguous', label: 'Ambiguous', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'accuracy', label: 'Accuracy', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v * 10) / 10}%`, render: (r) => `${r.accuracy}%` },
      { key: 'scanner', label: 'Scanner', width: 130, filter: true, hidden: true },
      { key: 'uploadedBy', label: 'Uploaded by', width: 190, hidden: true },
      { key: 'status', label: 'Status', width: 150, filter: true, render: (r) => Badge(r.status) },
    ],
    rows: batches,
    selectable: true, footerAggregates: true, paginate: false,
    searchKeys: ['batch', 'className', 'subjectName'],
    bulkActions: [
      { label: 'Push to marks entry', icon: 'arrow-right', onClick: (sel) => notify({ title: `${formatNumber(sum(sel, 'processed'))} results pushed`, tone: 'success' }) },
      { label: 'Rescan', icon: 'refresh', onClick: (sel) => notify({ title: `${sel.length} batches queued for rescan`, tone: 'info' }) },
    ],
    rowActions: (r) => [
      { label: 'Review batch', icon: 'eye', onClick: () => reviewDrawer(r) },
      { label: 'Download raw scores', icon: 'download', onClick: () => { download(`${r.id}-scores.csv`, toCsv([r]), 'text/csv;charset=utf-8'); notify({ title: 'Downloaded', tone: 'success' }); } },
      { separator: true },
      { label: 'Discard batch', icon: 'trash', tone: 'danger', onClick: () => ConfirmDialog({ title: 'Discard this batch?', text: 'All read scores from this batch are removed. The physical sheets must be rescanned.', confirmLabel: 'Discard', tone: 'danger' }).then((ok) => ok && notify({ title: 'Batch discarded', tone: 'danger' })) },
    ],
    onRowClick: reviewDrawer,
    emptyState: EmptyState({ icon: 'scan', title: 'No OMR batches', text: 'Upload a scanned bundle to start reading answer sheets.' }),
    exportName: 'omr-batches',
    tableTitle: 'Scanning batches',
  });

  mount.appendChild(node);
}

/* ==========================================================================
   24. EXAMINATION — result processing
   ========================================================================== */

function renderResultProcessing(mount, ctx) {
  ensureStyles();
  let groupId = 'EG3';
  const host = h('div', { className: 'stack' });

  function build() {
    host.innerHTML = '';
    const group = byId(db.examGroups, groupId) || db.examGroups[0];
    const sheet = studentMarkSheet(ctx, groupId, null);
    const classes = distinct(sheet, 'className');

    if (!sheet.length) {
      host.appendChild(EmptyState({
        icon: 'refresh', title: 'Nothing to process yet',
        text: `${group.name} has no marks recorded. Results can only be processed once subject teachers have submitted their sheets.`,
        action: Button('Open marks entry', { variant: 'primary', icon: 'edit', route: 'examination/marks-entry' }),
      }));
      return;
    }

    const passed = sheet.filter((r) => r.result === 'Pass').length;
    const passPct = Math.round((passed / sheet.length) * 1000) / 10;
    const avgPct = Math.round((sheet.reduce((a, r) => a + r.percent, 0) / sheet.length) * 10) / 10;

    host.appendChild(kpiRow([
      { label: 'Students in scope', value: formatNumber(sheet.length), icon: 'users', tone: 'brand' },
      { label: 'Pass percentage', value: `${passPct}%`, icon: 'check-circle', tone: pctTone(passPct) },
      { label: 'Overall average', value: `${avgPct}%`, icon: 'percent', tone: 'info' },
      { label: 'Failures', value: formatNumber(sheet.length - passed), icon: 'alert-triangle', tone: sheet.length - passed ? 'danger' : 'success' },
    ]));

    const steps = [
      { label: 'Validate marks', description: 'Every cell filled, nothing above the maximum', state: 'done' },
      { label: 'Apply weightage', description: `${group.weightage}% of the final result`, state: 'done' },
      { label: 'Compute grades', description: 'CBSE 8-point scale', state: 'done' },
      { label: 'Rank and merit', description: 'Class, section and campus ranks', state: group.status === 'Completed' ? 'done' : 'current' },
      { label: 'Publish', description: 'Portals, SMS and report cards', state: group.status === 'Completed' ? 'done' : 'todo' },
    ];

    const logHost = h('div', { className: 'stack-2' });
    const progressHost = h('div');
    const logShell = h('div', { className: 'stack-2' },
      Callout({ tone: 'neutral', icon: 'list', title: 'Processing log' },
        'Run the processor to see a step-by-step log here. Nothing is written to student records until you publish.'),
      logHost);

    const runProcessing = () => {
      const stages = [
        'Locking marks entry for all subject teachers…',
        `Validating ${formatNumber(sheet.length)} student records across ${classes.length} classes…`,
        'Applying component weightage (theory, practical, internal)…',
        'Applying grade scale — CBSE 8-Point Scale…',
        'Computing subject ranks, class ranks and campus ranks…',
        'Detecting borderline cases eligible for grace marks…',
        'Generating report card data blocks…',
        'Result set ready for review.',
      ];
      logHost.innerHTML = '';
      let i = 0; let pct = 0;
      const paint = () => {
        progressHost.innerHTML = '';
        progressHost.appendChild(ProgressBar(pct, {
          tone: pct === 100 ? 'success' : 'brand', size: 'lg', showValue: true,
          label: pct === 100 ? 'Processing complete' : 'Processing results',
        }));
      };
      paint();
      const t = setInterval(() => {
        if (i < stages.length) {
          logHost.appendChild(h('div', { className: 'row anim-fade', style: { gap: 'var(--sp-2)' } },
            Icon(i === stages.length - 1 ? 'check-circle' : 'chevron-right', 14),
            h('span', { className: 't-sm t-mono' }, `[${String(i + 1).padStart(2, '0')}]`),
            h('span', { className: 't-sm' }, stages[i])));
          i++;
          pct = Math.round((i / stages.length) * 100);
          paint();
        } else {
          clearInterval(t);
          notify({ title: 'Results processed', text: `${formatNumber(sheet.length)} students · ${passPct}% pass rate`, tone: 'success' });
        }
      }, 420);
    };

    host.appendChild(h('div', { className: 'widget-grid' },
      h('div', { className: 'span-7' }, SectionCard({
        title: `Result run — ${group.name}`,
        subtitle: `${formatDate(group.from, 'long')} to ${formatDate(group.to, 'long')} · weightage ${group.weightage}%`,
        icon: 'refresh',
        actions: h('div', { className: 'row' },
          Button('Dry run', { variant: 'ghost', size: 'sm', icon: 'eye', onClick: () => notify({ title: 'Dry run complete', text: 'No blocking issues found. 3 borderline cases flagged for grace marks.', tone: 'info' }) }),
          Button('Process results', { variant: 'primary', size: 'sm', icon: 'zap', onClick: runProcessing })),
      }, h('div', { className: 'stack-3' },
        Stepper(steps, { current: Math.max(0, steps.findIndex((s) => s.state === 'current')) }),
        progressHost,
        logShell))),
      h('div', { className: 'span-5' }, SectionCard({ title: 'Grade distribution', subtitle: 'Computed from the current marks', className: 'chart-card' },
        barChart({
          categories: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'E'],
          series: [{ name: 'Students', values: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'E'].map((g) => sheet.filter((r) => r.grade === g).length) }],
          height: 300, showValues: true,
          title: 'Number of students in each grade band for this cycle',
        })))));

    host.appendChild(SectionCard({
      title: 'Publication',
      subtitle: 'Nothing is visible to students or parents until you publish',
      icon: 'send',
      actions: Button('Publish results', {
        variant: 'primary', icon: 'send',
        onClick: () => ConfirmDialog({
          title: 'Publish these results?',
          text: `${formatNumber(sheet.length)} students across ${classes.length} classes will see their marks, grade and rank immediately, and an SMS goes to every guardian.`,
          confirmLabel: 'Publish now', tone: 'brand', icon: 'send',
        }).then((ok) => ok && notify({ title: 'Results published', text: `${formatNumber(sheet.length)} report cards live · SMS queued`, tone: 'success' })),
      }),
    }, FormGrid({ cols: 2 },
      Field({ label: 'Visible to' }, MultiSelect({ options: ['Students', 'Parents', 'Class teachers', 'Subject teachers', 'Management'], values: ['Students', 'Parents', 'Class teachers'], onChange: () => {} })),
      Field({ label: 'Publish on' }, DatePicker({ value: TODAY, onChange: () => {} })),
      Field({ label: 'Notify by SMS' }, Switch('Send a result SMS to every guardian', { checked: true })),
      Field({ label: 'Show rank' }, Switch('Print the class rank on the report card', { checked: true })),
      Field({ label: 'Allow re-evaluation' }, Switch('Open the re-evaluation window for seven days', { checked: true })),
      Field({ label: 'Withhold results' }, Switch('Withhold for students with outstanding fees', { checked: false, description: 'Board policy allows withholding only after a written notice.' })))));

    host.appendChild(SectionCard({ title: 'Class-wise result summary', flush: true },
      DataTable({
        columns: [
          { key: 'className', label: 'Class', width: 140, sticky: true },
          { key: 'students', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'passed', label: 'Passed', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'failed', label: 'Failed', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'passPct', label: 'Pass %', width: 130, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v * 10) / 10}%`, render: (r) => h('span', { className: `t-num t-semibold t-${pctTone(r.passPct)}` }, `${r.passPct}%`), value: (r) => r.passPct },
          { key: 'average', label: 'Average', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v * 10) / 10}%`, render: (r) => `${r.average}%` },
          { key: 'highest', label: 'Highest', width: 110, align: 'right', numeric: true, render: (r) => `${r.highest}%` },
          { key: 'topper', label: 'Topper', width: 230, render: (r) => Identity(r.topper, `${r.highest}%`), value: (r) => r.topper },
          { key: 'distinctions', label: 'A1 + A2', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        ],
        rows: classes.map((cn) => {
          const list = sheet.filter((r) => r.className === cn);
          const pass = list.filter((r) => r.result === 'Pass').length;
          const top = list[0] || {};
          return {
            className: cn, students: list.length, passed: pass, failed: list.length - pass,
            passPct: list.length ? Math.round((pass / list.length) * 1000) / 10 : 0,
            average: list.length ? Math.round((list.reduce((a, r) => a + r.percent, 0) / list.length) * 10) / 10 : 0,
            highest: top.percent || 0, topper: top.name || '—',
            distinctions: list.filter((r) => r.grade === 'A1' || r.grade === 'A2').length,
          };
        }),
        paginate: false, footerAggregates: true, maxHeight: '52vh',
        onRowClick: () => navigate('examination/merit-list'),
        exportName: 'result-summary',
      })));
  }

  const filters = filterCard([
    { id: 'group', label: 'Exam cycle', type: 'select', value: groupId, options: examGroupOptions() },
    { id: 'campus', label: 'Campus', type: 'select', options: db.campuses.map((c) => c.name) },
  ], (id, value) => { if (id === 'group' && value !== 'all') { groupId = value; build(); } });

  build();

  mount.appendChild(page({
    title: 'Result Processing',
    subtitle: 'Validate, weight, grade, rank and publish — the full result pipeline with a live log and a controlled publication step.',
    route: 'examination/result-processing',
    actions: pageActions(
      Button('Merit list', { variant: 'secondary', icon: 'trophy', route: 'examination/merit-list' }),
      Button('Report cards', { variant: 'primary', icon: 'certificate', route: 'examination/report-cards' })),
    children: [filters, host],
  }));
}

/* ==========================================================================
   25. EXAMINATION — report cards
   ========================================================================== */

const SCHOOL_HEAD = {
  name: 'Springdale International School',
  address: 'Sector 45, Gurugram, Haryana 122003 · CBSE affiliation 530142',
};

function reportCardBlock(kind, row, ctx) {
  const st = byId(db.students, row.studentId) || {};
  const codes = Object.keys(row.subjects);
  switch (kind) {
    case 'header':
      return h('div', { className: 'row', style: { justifyContent: 'space-between', alignItems: 'flex-start' } },
        h('div', null,
          h('div', { style: { fontSize: '18px', fontWeight: '700' } }, SCHOOL_HEAD.name),
          h('div', { style: { fontSize: '11px' } }, SCHOOL_HEAD.address),
          h('div', { style: { fontSize: '13px', fontWeight: '700', marginTop: '6px', letterSpacing: '0.08em' } }, 'PROGRESS REPORT 2026-27')),
        h('div', { style: { width: '64px', height: '64px', border: '1px solid var(--paper-line)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--paper-muted)' } }, 'CREST'));
    case 'photo':
      return h('div', { style: { width: '84px', height: '100px', border: '1px solid var(--paper-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--paper-muted)', marginLeft: 'auto' } }, 'Photograph');
    case 'student':
      return h('div', { className: 'a4-grid2' },
        [['Name', row.name], ['Admission no', row.admissionNo],
          ['Class and section', `${row.className} — ${row.section}`], ['Roll number', String(st.rollNo || '—')],
          ['Father', st.fatherName || '—'], ['Mother', st.motherName || '—'],
          ['Date of birth', st.dob ? formatDate(st.dob) : '—'], ['House', st.house || '—']]
          .map((p) => h('div', null, h('span', { style: { color: 'var(--paper-ink-2)' } }, p[0] + ': '), h('strong', null, String(p[1])))));
    case 'marks':
      return h('table', { className: 'a4-table' },
        h('thead', null, h('tr', null, ['Subject', 'Max', 'Obtained', 'Percent', 'Grade', 'Remarks'].map((x) => h('th', null, x)))),
        h('tbody', null,
          codes.map((c) => {
            const m = row.subjects[c];
            return h('tr', null,
              h('td', null, m.subjectName),
              h('td', null, String(m.maxMarks)),
              h('td', null, String(m.marksObtained)),
              h('td', null, `${m.percent}%`),
              h('td', null, m.grade),
              h('td', null, m.remarks));
          }),
          h('tr', null,
            h('th', null, 'Total'), h('th', null, String(row.max)), h('th', null, String(row.obtained)),
            h('th', null, `${row.percent}%`), h('th', null, row.grade), h('th', null, row.result))));
    case 'attendance':
      return h('div', { className: 'a4-grid2' },
        [['Working days', String(st.totalDays || 0)], ['Days present', String(st.presentDays || 0)],
          ['Attendance', `${st.attendancePct || 0}%`], ['Class rank', `${row.rank}`]]
          .map((p) => h('div', null, h('span', { style: { color: 'var(--paper-ink-2)' } }, p[0] + ': '), h('strong', null, p[1]))));
    case 'coscholastic':
      return h('table', { className: 'a4-table' },
        h('thead', null, h('tr', null, ['Co-scholastic area', 'Grade'].map((x) => h('th', null, x)))),
        h('tbody', null,
          [['Work education', 'A'], ['Art education', 'A'], ['Health and physical education', 'B'],
            ['Discipline', st.behaviourScore > 80 ? 'A' : 'B'], ['Attitude and values', 'A']]
            .map((p) => h('tr', null, h('td', null, p[0]), h('td', null, p[1])))));
    case 'remarks':
      return h('div', { style: { fontSize: '12px' } },
        h('strong', null, 'Class teacher remarks: '),
        row.percent >= 85 ? 'An outstanding performance sustained across every subject. Keep up the consistency and continue to help peers in group work.'
          : row.percent >= 70 ? 'A steady and encouraging performance. With a little more attention to written expression the next cycle should be even stronger.'
            : row.percent >= 50 ? 'A fair effort. Regular revision and completing homework on time will lift these results noticeably.'
              : 'Needs sustained support. A remedial plan has been shared with the parents and will be reviewed fortnightly.');
    case 'grades':
      return h('table', { className: 'a4-table' },
        h('thead', null, h('tr', null, ['Grade', 'Marks range', 'Grade point'].map((x) => h('th', null, x)))),
        h('tbody', null, db.gradeScales[0].bands.map((b) => h('tr', null,
          h('td', null, b.grade), h('td', null, `${b.from} – ${b.to}`), h('td', null, String(b.point))))));
    case 'signatures':
      return h('div', { className: 'row', style: { justifyContent: 'space-between', marginTop: '26px', fontSize: '11px' } },
        h('div', null, '____________________', h('div', null, 'Class teacher')),
        h('div', null, '____________________', h('div', null, 'Parent')),
        h('div', null, '____________________', h('div', null, 'Principal')));
    case 'chart':
      return h('div', { style: { fontSize: '11px' } },
        h('div', { style: { fontWeight: '700', marginBottom: '6px' } }, 'Subject performance'),
        h('div', { style: { display: 'flex', gap: '6px', alignItems: 'flex-end', height: '90px' } },
          codes.map((c) => {
            const m = row.subjects[c];
            return h('div', { style: { flex: '1', textAlign: 'center' } },
              h('div', { style: { height: `${Math.max(4, m.percent * 0.8)}px`, background: 'var(--paper-accent)', borderRadius: '3px 3px 0 0' } }),
              h('div', { style: { fontSize: '9px', marginTop: '3px' } }, c));
          })));
    default:
      return h('div', { className: 'rcd-drop' }, 'Unknown block');
  }
}

const RCD_BLOCKS = [
  { id: 'header', label: 'School header', icon: 'building-columns' },
  { id: 'photo', label: 'Student photograph', icon: 'camera' },
  { id: 'student', label: 'Student particulars', icon: 'id-card' },
  { id: 'marks', label: 'Scholastic marks table', icon: 'table' },
  { id: 'chart', label: 'Subject performance chart', icon: 'chart-bar' },
  { id: 'attendance', label: 'Attendance summary', icon: 'clipboard-check' },
  { id: 'coscholastic', label: 'Co-scholastic grades', icon: 'star' },
  { id: 'remarks', label: 'Class teacher remarks', icon: 'message-square' },
  { id: 'grades', label: 'Grading key', icon: 'percent' },
  { id: 'signatures', label: 'Signature block', icon: 'stamp' },
];

function renderReportCard(row, layout, ctx) {
  const card = h('div', { className: 'a4' });
  layout.forEach((kind, i) => {
    card.appendChild(reportCardBlock(kind, row, ctx));
    if (i < layout.length - 1) card.appendChild(h('hr', { className: 'a4-rule' }));
  });
  return card;
}

function renderReportCards(mount, ctx) {
  ensureStyles();
  const classNames = examClassOptions(ctx);
  let groupId = 'EG3';
  let className = classNames.indexOf('Class X') !== -1 ? 'Class X' : classNames[0];
  const layout = ['header', 'student', 'marks', 'attendance', 'coscholastic', 'remarks', 'grades', 'signatures'];
  const host = h('div', { className: 'stack' });

  function build() {
    host.innerHTML = '';
    const sheet = studentMarkSheet(ctx, groupId, className);

    if (!sheet.length) {
      host.appendChild(EmptyState({
        icon: 'certificate', title: 'No report cards to generate',
        text: 'Results have not been processed for this class and cycle yet.',
        action: Button('Open result processing', { variant: 'primary', icon: 'refresh', route: 'examination/result-processing' }),
      }));
      return;
    }

    const previewHost = h('div');
    const paint = (row) => { previewHost.innerHTML = ''; previewHost.appendChild(renderReportCard(row, layout, ctx)); };
    paint(sheet[0]);

    host.appendChild(kpiRow([
      { label: 'Report cards ready', value: formatNumber(sheet.length), icon: 'certificate', tone: 'brand' },
      { label: 'Class average', value: `${Math.round((sheet.reduce((a, r) => a + r.percent, 0) / sheet.length) * 10) / 10}%`, icon: 'percent', tone: 'info' },
      { label: 'Distinctions', value: formatNumber(sheet.filter((r) => r.percent >= 75).length), icon: 'trophy', tone: 'success' },
      { label: 'Needs support', value: formatNumber(sheet.filter((r) => r.result === 'Fail').length), icon: 'alert-triangle', tone: 'danger' },
    ]));

    host.appendChild(h('div', { className: 'detail-split' },
      SectionCard({ title: 'Generated report cards', subtitle: 'Click a student to preview their card on the right', flush: true },
        DataTable({
          columns: [
            { key: 'rank', label: 'Rank', width: 80, align: 'right', numeric: true, sticky: true },
            { key: 'name', label: 'Student', width: 240, render: (r) => Identity(r.name, `${r.admissionNo} · Section ${r.section}`), value: (r) => r.name },
            { key: 'obtained', label: 'Total', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
            { key: 'percent', label: 'Percent', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v * 10) / 10}%`, render: (r) => h('span', { className: `t-num t-semibold t-${pctTone(r.percent)}` }, `${r.percent}%`) },
            { key: 'grade', label: 'Grade', width: 90, filter: true, render: (r) => Badge(r.grade, { tone: r.percent >= 75 ? 'success' : r.percent >= 50 ? 'warning' : 'danger' }) },
            { key: 'result', label: 'Result', width: 100, filter: true, render: (r) => Badge(r.result, { tone: r.result === 'Pass' ? 'success' : 'danger' }) },
          ],
          rows: sheet,
          selectable: true, footerAggregates: true, pageSize: 15,
          searchKeys: ['name', 'admissionNo'],
          bulkActions: [
            { label: 'Generate PDFs', icon: 'certificate', onClick: (sel) => notify({ title: `${sel.length} report cards generated`, text: 'One PDF per student, bundled for printing.', tone: 'success' }) },
            { label: 'Email to parents', icon: 'mail', onClick: (sel) => notify({ title: `${sel.length} report cards emailed`, tone: 'success' }) },
            { label: 'Publish to portal', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} cards published`, tone: 'success' }) },
          ],
          rowActions: (r) => [
            { label: 'Preview card', icon: 'eye', onClick: () => paint(r) },
            { label: 'Print card', icon: 'print', onClick: () => { paint(r); printNode(previewHost, `${r.name} report card`); } },
            { label: 'Open 360 profile', icon: 'user', route: `students/profile/${r.studentId}` },
          ],
          onRowClick: paint,
          emptyState: EmptyState({ icon: 'certificate', title: 'No students', text: 'Nothing matches the current filters.' }),
          exportName: 'report-cards',
          maxHeight: '60vh',
        })),
      h('div', { className: 'stack-3' },
        SectionCard({
          title: 'Card preview',
          subtitle: 'A4 portrait · same layout that prints',
          icon: 'certificate',
          actions: h('div', { className: 'row' },
            Button('Design', { variant: 'ghost', size: 'sm', icon: 'palette', route: 'examination/report-card-designer' }),
            Button('Print', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(previewHost, 'Report card') })),
        }, previewHost))));
  }

  const filters = filterCard([
    { id: 'group', label: 'Exam cycle', type: 'select', value: groupId, options: examGroupOptions() },
    { id: 'className', label: 'Class', type: 'select', value: className, options: classNames },
    { id: 'template', label: 'Template', type: 'select', options: ['CBSE standard', 'Scholastic only', 'With co-scholastic', 'Primary (grades only)'] },
  ], (id, value) => {
    if (id === 'group' && value !== 'all') groupId = value;
    if (id === 'className' && value !== 'all') className = value;
    build();
  });

  build();

  mount.appendChild(page({
    title: 'Report Cards',
    subtitle: 'Generated progress reports with a live A4 preview — print, email or publish to the parent portal in bulk.',
    route: 'examination/report-cards',
    wide: true,
    actions: pageActions(
      Button('Report card designer', { variant: 'secondary', icon: 'palette', route: 'examination/report-card-designer' }),
      Button('Generate for the class', {
        variant: 'primary', icon: 'certificate',
        onClick: () => ConfirmDialog({
          title: 'Generate report cards for the whole class?',
          text: 'A single print-ready PDF is produced with one card per student. Parents are not notified until you publish.',
          confirmLabel: 'Generate', tone: 'brand', icon: 'certificate',
        }).then((ok) => ok && notify({ title: 'Report cards generated', tone: 'success' })),
      })),
    children: [filters, host],
  }));
}

/* ==========================================================================
   26. EXAMINATION — flagship: Report Card Designer
   ========================================================================== */

function renderReportCardDesigner(mount, ctx) {
  ensureStyles();
  const sheet = studentMarkSheet(ctx, 'EG3', null);
  const sample = sheet[0] || null;
  let layout = ['header', 'student', 'marks', 'attendance', 'coscholastic', 'remarks', 'signatures'];
  let selected = null;
  let dragging = null;

  const canvas = h('div', { className: 'rcd-canvas' });
  const propsHost = h('div', { className: 'stack-3' });

  const paletteHost = h('div', { className: 'stack-2' },
    RCD_BLOCKS.map((b) => h('div', {
      className: 'rcd-block', draggable: true,
      attrs: { title: `Drag “${b.label}” onto the page` },
      onDragStart: (e) => { dragging = { source: 'palette', id: b.id }; e.dataTransfer.effectAllowed = 'copy'; },
      onDblClick: () => { layout.push(b.id); paintCanvas(); notify({ title: 'Block added', text: b.label, tone: 'success' }); },
    }, Icon(b.icon, 15), h('span', { className: 'flex-1' }, b.label), Icon('plus', 13))));

  function paintProps() {
    propsHost.innerHTML = '';
    if (selected === null || !layout[selected]) {
      propsHost.appendChild(EmptyState({
        icon: 'palette', title: 'No block selected',
        text: 'Click a block on the page to edit its properties, or drag a new block in from the left.',
      }));
      return;
    }
    const kind = layout[selected];
    const def = RCD_BLOCKS.find((b) => b.id === kind) || { label: kind, icon: 'layers' };
    propsHost.appendChild(SectionCard({ title: def.label, icon: def.icon },
      h('div', { className: 'stack-3' },
        DescriptionList([['Block type', kind], ['Position', `${selected + 1} of ${layout.length}`]]),
        Field({ label: 'Section title' }, Input({ value: def.label, onInput: () => {} })),
        Field({ label: 'Alignment' }, Select({ options: ['Left', 'Centre', 'Right'], value: 'Left', onChange: () => {} })),
        Field({ label: 'Border' }, Switch('Draw a rule under this block', { checked: true })),
        Field({ label: 'Page break' }, Switch('Start a new page after this block', { checked: false })),
        h('div', { className: 'row-3 row-wrap' },
          Button('Move up', { variant: 'secondary', size: 'sm', icon: 'arrow-up', disabled: selected === 0, onClick: () => { const t = layout[selected - 1]; layout[selected - 1] = layout[selected]; layout[selected] = t; selected--; paintCanvas(); } }),
          Button('Move down', { variant: 'secondary', size: 'sm', icon: 'arrow-down', disabled: selected === layout.length - 1, onClick: () => { const t = layout[selected + 1]; layout[selected + 1] = layout[selected]; layout[selected] = t; selected++; paintCanvas(); } }),
          Button('Remove', { variant: 'danger', size: 'sm', icon: 'trash', onClick: () => { layout.splice(selected, 1); selected = null; paintCanvas(); notify({ title: 'Block removed', tone: 'warning' }); } })))));
  }

  function dropZone(index) {
    return h('div', {
      className: 'rcd-drop',
      onDragOver: (e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--paper-accent)'; },
      onDragLeave: (e) => { e.currentTarget.style.borderColor = ''; },
      onDrop: (e) => {
        e.preventDefault();
        e.currentTarget.style.borderColor = '';
        if (!dragging) return;
        if (dragging.source === 'palette') layout.splice(index, 0, dragging.id);
        else {
          const from = dragging.index;
          const [moved] = layout.splice(from, 1);
          layout.splice(from < index ? index - 1 : index, 0, moved);
        }
        dragging = null;
        selected = null;
        paintCanvas();
      },
    }, 'Drop a block here');
  }

  function paintCanvas() {
    canvas.innerHTML = '';
    if (!layout.length) {
      canvas.appendChild(h('div', { style: { color: 'var(--paper-muted)', fontSize: '13px', textAlign: 'center', padding: '40px 0' } },
        'The page is empty. Drag blocks from the left, or double-click one to append it.'));
      canvas.appendChild(dropZone(0));
      paintProps();
      return;
    }
    canvas.appendChild(dropZone(0));
    layout.forEach((kind, i) => {
      const def = RCD_BLOCKS.find((b) => b.id === kind) || { label: kind };
      const wrapper = h('div', {
        className: 'rcd-placed', dataset: { sel: selected === i ? '1' : '0' }, draggable: true,
        attrs: { role: 'button', tabindex: '0', title: def.label },
        onClick: () => { selected = i; paintCanvas(); },
        onKeyDown: (e) => { if (e.key === 'Enter') { selected = i; paintCanvas(); } },
        onDragStart: (e) => { dragging = { source: 'canvas', index: i }; e.dataTransfer.effectAllowed = 'move'; },
      },
        h('div', { className: 'rcd-placed-bar' },
          IconButton('arrow-up', { label: 'Move up', size: 'sm', bordered: true, onClick: (e) => { e.stopPropagation(); if (i > 0) { const t = layout[i - 1]; layout[i - 1] = layout[i]; layout[i] = t; selected = i - 1; paintCanvas(); } } }),
          IconButton('arrow-down', { label: 'Move down', size: 'sm', bordered: true, onClick: (e) => { e.stopPropagation(); if (i < layout.length - 1) { const t = layout[i + 1]; layout[i + 1] = layout[i]; layout[i] = t; selected = i + 1; paintCanvas(); } } }),
          IconButton('trash', { label: 'Remove block', size: 'sm', bordered: true, onClick: (e) => { e.stopPropagation(); layout.splice(i, 1); selected = null; paintCanvas(); } })),
        sample ? reportCardBlock(kind, sample, ctx) : h('div', { className: 'rcd-drop' }, def.label));
      canvas.appendChild(wrapper);
      canvas.appendChild(dropZone(i + 1));
    });
    paintProps();
  }

  paintCanvas();

  const previewCard = () => {
    if (!sample) { notify({ title: 'No sample data', text: 'Process a result cycle first.', tone: 'warning' }); return; }
    const node = renderReportCard(sample, layout, ctx);
    Modal({
      title: 'Report card preview', subtitle: `${sample.name} · ${sample.className} — ${sample.section}`,
      size: 'xl', icon: 'eye',
      body: h('div', { className: 'stack-3' }, node),
      actions: (close) => frag(
        Button('Close', { variant: 'ghost', onClick: close }),
        Button('Print', { variant: 'primary', icon: 'print', onClick: () => printNode(node, 'Report card') })),
    });
  };

  mount.appendChild(page({
    title: 'Report Card Designer',
    subtitle: 'Drag blocks onto the A4 page, reorder them and preview against live student data. What you see here is what prints.',
    route: 'examination/report-card-designer',
    wide: true,
    actions: pageActions(
      Button('Preview', { variant: 'secondary', icon: 'eye', onClick: previewCard }),
      MenuButton([
        { header: true, label: 'Templates' },
        { label: 'CBSE standard', icon: 'file-text', onClick: () => { layout = ['header', 'student', 'marks', 'attendance', 'coscholastic', 'remarks', 'grades', 'signatures']; selected = null; paintCanvas(); notify({ title: 'Template applied', text: 'CBSE standard', tone: 'success' }); } },
        { label: 'Scholastic only', icon: 'table', onClick: () => { layout = ['header', 'student', 'marks', 'signatures']; selected = null; paintCanvas(); notify({ title: 'Template applied', text: 'Scholastic only', tone: 'success' }); } },
        { label: 'Primary (grades only)', icon: 'star', onClick: () => { layout = ['header', 'student', 'coscholastic', 'remarks', 'signatures']; selected = null; paintCanvas(); notify({ title: 'Template applied', text: 'Primary', tone: 'success' }); } },
        { separator: true },
        { label: 'Clear the page', icon: 'trash', tone: 'danger', onClick: () => ConfirmDialog({ title: 'Clear the page?', text: 'Every block is removed. The saved template is untouched until you save again.', confirmLabel: 'Clear', tone: 'danger' }).then((ok) => { if (ok) { layout = []; selected = null; paintCanvas(); } }) },
      ], { label: 'Templates' }),
      Button('Save template', {
        variant: 'primary', icon: 'check',
        onClick: () => notify({ title: 'Template saved', text: `${layout.length} blocks · applied to every report card in this cycle.`, tone: 'success' }),
      })),
    children: [
      Callout({ tone: 'info', icon: 'info', title: 'How this works' },
        'Drag a block from the palette onto a drop zone, or double-click it to append. Drag placed blocks to reorder. Click a block to edit it in the properties rail. The preview uses real marks from the current result set.'),
      h('div', { className: 'rcd-split' },
        SectionCard({ title: 'Blocks', subtitle: 'Drag onto the page', icon: 'layers' }, paletteHost),
        SectionCard({
          title: 'A4 page', subtitle: sample ? `Previewing ${sample.name} · ${sample.className}` : 'No sample student available',
          icon: 'file-text',
          actions: Button('Print', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(canvas, 'Report card template') }),
        }, canvas),
        SectionCard({ title: 'Properties', icon: 'sliders' }, propsHost)),
    ],
  }));
}

/* ==========================================================================
   27. EXAMINATION — merit list
   ========================================================================== */

function renderMeritList(mount, ctx) {
  ensureStyles();
  const classNames = examClassOptions(ctx);
  let groupId = 'EG3';
  let scope = 'all';
  const host = h('div', { className: 'stack' });

  function build() {
    host.innerHTML = '';
    const sheet = studentMarkSheet(ctx, groupId, scope === 'all' ? null : scope);

    if (!sheet.length) {
      host.appendChild(EmptyState({
        icon: 'trophy', title: 'No merit list yet',
        text: 'Results have not been processed for this cycle. Merit ranks appear once marks are submitted and processed.',
        action: Button('Open result processing', { variant: 'primary', icon: 'refresh', route: 'examination/result-processing' }),
      }));
      return;
    }

    const top = sheet.slice(0, 10);
    const houses = [];
    for (const [house, list] of groupBy(sheet.map((r) => Object.assign({}, r, { house: (byId(db.students, r.studentId) || {}).house || 'Unassigned' })), 'house')) {
      houses.push({ key: house, value: Math.round((list.reduce((a, r) => a + r.percent, 0) / list.length) * 10) / 10 });
    }

    host.appendChild(kpiRow([
      { label: 'Students ranked', value: formatNumber(sheet.length), icon: 'trophy', tone: 'brand' },
      { label: 'Topper', value: top[0] ? `${top[0].percent}%` : '—', icon: 'award', tone: 'success', footer: top[0] ? top[0].name : '' },
      { label: 'Median', value: `${sheet[Math.floor(sheet.length / 2)].percent}%`, icon: 'scale', tone: 'info' },
      { label: 'Above 90%', value: formatNumber(sheet.filter((r) => r.percent >= 90).length), icon: 'star', tone: 'success' },
    ]));

    host.appendChild(h('div', { className: 'widget-grid' },
      h('div', { className: 'span-5' }, SectionCard({ title: 'Top ten', subtitle: 'Overall merit across the selected scope', icon: 'trophy' },
        RankList(top.map((r) => ({
          name: r.name,
          meta: `${r.className} — ${r.section} · ${r.obtained}/${r.max}`,
          value: `${r.percent}%`,
        }))))),
      h('div', { className: 'span-7' }, SectionCard({ title: 'Score distribution', className: 'chart-card' },
        barChart({
          categories: ['<40', '40–49', '50–59', '60–69', '70–79', '80–89', '90–100'],
          series: [{
            name: 'Students',
            values: [
              sheet.filter((r) => r.percent < 40).length,
              sheet.filter((r) => r.percent >= 40 && r.percent < 50).length,
              sheet.filter((r) => r.percent >= 50 && r.percent < 60).length,
              sheet.filter((r) => r.percent >= 60 && r.percent < 70).length,
              sheet.filter((r) => r.percent >= 70 && r.percent < 80).length,
              sheet.filter((r) => r.percent >= 80 && r.percent < 90).length,
              sheet.filter((r) => r.percent >= 90).length,
            ],
          }],
          height: 300, showValues: true,
          title: 'Number of students in each ten-point score band',
        })))));

    host.appendChild(SectionCard({ title: 'House averages', className: 'chart-card' },
      barChart({
        categories: houses.map((x) => x.key),
        series: [{ name: 'Average %', values: houses.map((x) => x.value) }],
        valueFormat: 'percent', height: 230,
        title: 'Average percentage by house',
      })));

    host.appendChild(SectionCard({ title: 'Full merit list', subtitle: 'Sortable and exportable — ties are broken by total marks, then by English score', flush: true },
      DataTable({
        columns: [
          {
            key: 'rank', label: 'Rank', width: 100, align: 'right', numeric: true, sticky: true,
            render: (r) => (r.rank <= 3
              ? Badge(`#${r.rank}`, { tone: r.rank === 1 ? 'success' : r.rank === 2 ? 'info' : 'warning', icon: 'medal' })
              : h('span', { className: 't-num' }, `#${r.rank}`)),
            value: (r) => r.rank,
          },
          { key: 'name', label: 'Student', width: 250, render: (r) => Identity(r.name, `${r.admissionNo} · ${r.className} — ${r.section}`), value: (r) => r.name },
          { key: 'className', label: 'Class', width: 120, filter: true },
          { key: 'section', label: 'Section', width: 100, filter: true },
          { key: 'obtained', label: 'Obtained', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'max', label: 'Maximum', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          {
            key: 'percent', label: 'Percent', width: 150, align: 'right', numeric: true, aggregate: 'avg',
            format: (v) => `${Math.round(v * 10) / 10}%`,
            render: (r) => h('div', { className: 'row', style: { justifyContent: 'flex-end', gap: 'var(--sp-2)' } },
              h('span', { className: 't-num t-semibold' }, `${r.percent}%`),
              h('span', { style: { width: '52px' } }, ProgressBar(r.percent, { tone: pctTone(r.percent), size: 'sm' }))),
            value: (r) => r.percent,
          },
          { key: 'grade', label: 'Grade', width: 90, filter: true, render: (r) => Badge(r.grade, { tone: r.percent >= 75 ? 'success' : r.percent >= 50 ? 'warning' : 'danger' }) },
          { key: 'result', label: 'Result', width: 100, filter: true, render: (r) => Badge(r.result, { tone: r.result === 'Pass' ? 'success' : 'danger' }) },
        ],
        rows: sheet,
        selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['name', 'admissionNo', 'className'],
        bulkActions: [
          { label: 'Award certificates', icon: 'certificate', onClick: (sel) => notify({ title: `${sel.length} merit certificates generated`, tone: 'success' }) },
          { label: 'Notify parents', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} congratulation messages queued`, tone: 'success' }) },
          { label: 'Add to honour roll', icon: 'award', onClick: (sel) => notify({ title: `${sel.length} students added to the honour roll`, tone: 'success' }) },
        ],
        rowActions: (r) => [
          { label: 'Open 360 profile', icon: 'eye', route: `students/profile/${r.studentId}` },
          { label: 'Report card', icon: 'certificate', route: 'examination/report-cards' },
          { label: 'Performance analysis', icon: 'chart-line', route: 'examination/performance' },
        ],
        onRowClick: (r) => navigate(`students/profile/${r.studentId}`),
        emptyState: EmptyState({ icon: 'trophy', title: 'No students ranked', text: 'Nothing matches the current filters.' }),
        exportName: 'merit-list',
        maxHeight: '60vh',
      })));
  }

  const filters = filterCard([
    { id: 'group', label: 'Exam cycle', type: 'select', value: groupId, options: examGroupOptions() },
    { id: 'className', label: 'Class', type: 'select', options: classNames },
    { id: 'top', label: 'Show', type: 'segment', options: [{ id: 'all', label: 'All' }, { id: 'top10', label: 'Top 10' }, { id: 'top50', label: 'Top 50' }] },
  ], (id, value) => {
    if (id === 'group' && value !== 'all') groupId = value;
    if (id === 'className') scope = value;
    build();
  });

  build();

  mount.appendChild(page({
    title: 'Rank & Merit List',
    subtitle: 'Overall merit for the selected examination cycle, with house averages and the score distribution behind the ranks.',
    route: 'examination/merit-list',
    actions: pageActions(
      Button('Performance analysis', { variant: 'secondary', icon: 'chart-line', route: 'examination/performance' }),
      Button('Publish merit list', {
        variant: 'primary', icon: 'send',
        onClick: () => ConfirmDialog({
          title: 'Publish the merit list?',
          text: 'The top fifty ranks are posted to the notice board and the parent portal. Individual ranks stay private on each report card.',
          confirmLabel: 'Publish', tone: 'brand', icon: 'send',
        }).then((ok) => ok && notify({ title: 'Merit list published', tone: 'success' })),
      })),
    children: [filters, host],
  }));
}

/* ==========================================================================
   28. EXAMINATION — performance analysis
   ========================================================================== */

function renderPerformance(mount, ctx) {
  ensureStyles();
  const matrix = analytics.performanceMatrix;
  const subjectPerf = analytics.subjectPerformance;
  const classPerf = analytics.classPerformance;
  const marks = marksFor(ctx);

  const bySubject = [];
  for (const [name, list] of groupBy(marks, 'subjectName')) {
    bySubject.push({
      subject: name,
      average: Math.round((list.reduce((a, m) => a + m.percent, 0) / list.length) * 10) / 10,
      highest: Math.max.apply(null, list.map((m) => m.percent)),
      lowest: Math.min.apply(null, list.map((m) => m.percent)),
      passPercent: Math.round((list.filter((m) => m.status === 'Pass').length / list.length) * 1000) / 10,
      distinctions: list.filter((m) => m.percent >= 75).length,
      students: list.length,
    });
  }
  bySubject.sort((a, b) => a.average - b.average);

  const weak = bySubject.slice(0, 5);
  const yoy = analytics.enrolmentTrend.map((y, i) => ({
    year: y.year,
    average: Math.round((62 + i * 2.4 + (hash32(y.year) % 30) / 10) * 10) / 10,
    passPercent: Math.round((88 + i * 1.6 + (hash32(y.year + 'p') % 20) / 10) * 10) / 10,
  }));

  const node = reportPage({
    title: 'Performance Analysis',
    subtitle: `${formatNumber(marks.length)} subject scores analysed · subject-wise, class-wise, year-on-year and topper trends`,
    route: 'examination/performance',
    filters: [
      { id: 'group', label: 'Exam cycle', type: 'select', options: examGroupOptions() },
      { id: 'className', label: 'Class', type: 'select', options: examClassOptions(ctx) },
      { id: 'subject', label: 'Subject', type: 'select', options: bySubject.map((s) => s.subject) },
      { id: 'from', label: 'From', type: 'date', value: '2026-04-01' },
      { id: 'to', label: 'To', type: 'date', value: TODAY },
    ],
    onFilter: (id, value, allv, table) => {
      let out = bySubject.slice();
      if (allv.subject && allv.subject !== 'all') out = out.filter((r) => r.subject === allv.subject);
      table.refresh(out);
      notify({ title: 'Analysis refreshed', text: `${out.length} subjects in scope`, tone: 'info' });
    },
    summary: [
      { label: 'Overall average', value: `${bySubject.length ? Math.round((bySubject.reduce((a, s) => a + s.average, 0) / bySubject.length) * 10) / 10 : 0}%`, delta: 2.1, deltaLabel: 'vs last cycle', icon: 'percent', tone: 'success' },
      { label: 'Strongest subject', value: bySubject.length ? bySubject[bySubject.length - 1].subject : '—', icon: 'trophy', tone: 'brand', footer: bySubject.length ? `${bySubject[bySubject.length - 1].average}% average` : '' },
      { label: 'Weakest subject', value: bySubject.length ? bySubject[0].subject : '—', icon: 'trending-down', tone: 'danger', footer: bySubject.length ? `${bySubject[0].average}% average` : '' },
      { label: 'Distinctions', value: formatNumber(marks.filter((m) => m.percent >= 75).length), icon: 'star', tone: 'info' },
    ],
    chart: [
      (function () {
        const c = SectionCard({ title: 'Class × subject heatmap', subtitle: 'Average score — darker is stronger', className: 'chart-card' },
          heatmap({ mode: 'matrix', rows: matrix.rows, cols: matrix.cols, values: matrix.values, min: 50, max: 95, title: 'Average score for every class and subject combination' }),
          h('div', { className: 'mt-3' }, ScaleLegend(50, 95, { format: 'percent0' })));
        c.__titled = true;
        return c;
      }()),
      (function () {
        const c = SectionCard({ title: 'Subject-wise spread', subtitle: 'Highest, average and lowest score in each subject', className: 'chart-card' },
          barChart({
            categories: bySubject.map((s) => s.subject),
            series: [
              { name: 'Lowest', values: bySubject.map((s) => s.lowest) },
              { name: 'Average', values: bySubject.map((s) => s.average) },
              { name: 'Highest', values: bySubject.map((s) => s.highest) },
            ],
            valueFormat: 'percent', height: 300,
            title: 'Lowest, average and highest percentage in each subject',
          }));
        c.__titled = true;
        return c;
      }()),
      (function () {
        const c = SectionCard({ title: 'Class performance against target', className: 'chart-card' },
          bulletChart({
            items: classPerf.slice(0, 10).map((r) => ({ label: r.className, value: r.average, target: 75, ranges: [50, 65, 100] })),
            valueFormat: 'percent', height: 320,
            title: 'Class average against the 75% school target',
          }));
        c.__titled = true;
        return c;
      }()),
      (function () {
        const c = SectionCard({ title: 'Year-on-year trend', subtitle: 'School average and pass percentage over five sessions', className: 'chart-card' },
          lineChart({
            categories: yoy.map((y) => y.year),
            series: [
              { name: 'Average %', values: yoy.map((y) => y.average) },
              { name: 'Pass %', values: yoy.map((y) => y.passPercent) },
            ],
            valueFormat: 'percent', height: 280, showDots: true, showEndLabels: true,
            title: 'School average and pass percentage across five academic sessions',
          }));
        c.__titled = true;
        return c;
      }()),
      (function () {
        const c = SectionCard({ title: 'Topper trend', subtitle: 'The twelve highest scorers this session', className: 'chart-card' },
          barChart({
            categories: analytics.topPerformers.map((t) => t.name.split(' ')[0]),
            series: [{ name: 'Percent', values: analytics.topPerformers.map((t) => t.percent) }],
            valueFormat: 'percent', horizontal: true, height: 320,
            title: 'The twelve highest scoring students this session',
          }));
        c.__titled = true;
        return c;
      }()),
      (function () {
        const c = SectionCard({ title: 'Weak-area focus', subtitle: 'The five subjects that need remedial attention', className: 'chart-card' },
          h('div', { className: 'stack-3' },
            weak.map((w) => h('div', { className: 'stack-1' },
              h('div', { className: 'row' },
                h('span', { className: 't-medium flex-1' }, w.subject),
                h('span', { className: 't-num t-semibold t-danger' }, `${w.average}%`),
                h('span', { className: 't-xs t-muted' }, ` · ${w.passPercent}% pass`)),
              ProgressBar(w.average, { tone: pctTone(w.average), size: 'sm' })))));
        c.__titled = true;
        return c;
      }()),
    ],
    columns: [
      { key: 'subject', label: 'Subject', width: 190, sticky: true, render: (r) => h('span', { className: 't-semibold' }, r.subject) },
      { key: 'students', label: 'Scores', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => formatNumber(r.students) },
      { key: 'average', label: 'Average', width: 140, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v * 10) / 10}%`, render: (r) => h('span', { className: `t-num t-semibold t-${pctTone(r.average)}` }, `${r.average}%`), value: (r) => r.average },
      { key: 'highest', label: 'Highest', width: 110, align: 'right', numeric: true, render: (r) => `${r.highest}%` },
      { key: 'lowest', label: 'Lowest', width: 110, align: 'right', numeric: true, render: (r) => `${r.lowest}%` },
      { key: 'passPercent', label: 'Pass %', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v * 10) / 10}%`, render: (r) => `${r.passPercent}%` },
      { key: 'distinctions', label: 'Distinctions', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
      {
        key: 'band', label: 'Assessment', width: 190,
        render: (r) => Badge(r.average >= 75 ? 'Strong' : r.average >= 60 ? 'Satisfactory' : 'Needs remediation', { tone: r.average >= 75 ? 'success' : r.average >= 60 ? 'warning' : 'danger' }),
        value: (r) => r.average,
      },
    ],
    rows: bySubject,
    tableTitle: 'Subject-wise detail',
    footerAggregates: true,
    notes: Callout({ tone: 'info', icon: 'lightbulb', title: 'What the analysis suggests' },
      weak.length
        ? `${weak[0].subject} and ${weak[1] ? weak[1].subject : ''} carry the lowest averages. Consider a remedial cycle, a question-paper difficulty review and a peer-tutoring group before the next examination.`
        : 'Not enough recorded marks to produce a recommendation yet.'),
  });

  mount.appendChild(node);
}

/* ==========================================================================
   29. EXAMINATION — re-evaluation
   ========================================================================== */

function buildReevaluations(ctx) {
  const marks = marksFor(ctx);
  const out = [];
  marks.forEach((m, i) => {
    if (rand01(m.id + 'rev') > 0.028) return;
    const delta = (hash32(m.id + 'd') % 7) - 2;
    const revised = Math.max(0, Math.min(m.maxMarks, m.marksObtained + delta));
    const status = ['Pending', 'Pending', 'In Progress', 'Completed', 'Rejected'][hash32(m.id + 's') % 5];
    return out.push({
      id: 'REV' + String(1000 + i),
      studentId: m.studentId,
      studentName: m.studentName,
      admissionNo: m.admissionNo,
      className: m.className,
      section: m.section,
      subjectName: m.subjectName,
      subjectCode: m.subjectCode,
      examGroupId: m.examGroupId,
      examGroupName: (byId(db.examGroups, m.examGroupId) || {}).name || '',
      original: m.marksObtained,
      maxMarks: m.maxMarks,
      revised: status === 'Completed' ? revised : null,
      change: status === 'Completed' ? revised - m.marksObtained : null,
      type: hash32(m.id + 't') % 3 === 0 ? 'Photocopy of answer sheet' : hash32(m.id + 't') % 3 === 1 ? 'Re-totalling' : 'Full re-evaluation',
      fee: hash32(m.id + 't') % 3 === 0 ? 500 : hash32(m.id + 't') % 3 === 1 ? 300 : 1200,
      requestedOn: '2026-08-' + String(5 + (hash32(m.id + 'r') % 14)).padStart(2, '0'),
      reason: ['Marks appear inconsistent with the answer written.', 'A full question seems to have been left unmarked.', 'Total does not match the sum of the parts.', 'Requesting a photocopy to review the evaluation.'][hash32(m.id + 'n') % 4],
      evaluator: (db.staff[hash32(m.id) % db.staff.length] || {}).name || '—',
      status,
    });
  });
  return out.slice(0, 220);
}

function renderReevaluation(mount, ctx) {
  ensureStyles();
  const all = buildReevaluations(ctx);
  let activeTab = 'pending';
  const pending = all.filter((r) => r.status === 'Pending');
  const completed = all.filter((r) => r.status === 'Completed');
  const changed = completed.filter((r) => r.change !== 0).length;

  const node = approvalQueuePage({
    title: 'Re-evaluation',
    subtitle: 'Requests for re-totalling, photocopies and full re-evaluation raised inside the seven-day window after publication.',
    route: 'examination/re-evaluation',
    kpis: [
      { label: 'Pending', value: formatNumber(pending.length), icon: 'inbox', tone: 'warning' },
      { label: 'Completed', value: formatNumber(completed.length), icon: 'check-circle', tone: 'success' },
      { label: 'Marks changed', value: formatNumber(changed), icon: 'refresh-ccw', tone: changed ? 'danger' : 'success', footer: completed.length ? `${Math.round((changed / completed.length) * 100)}% of completed reviews` : '' },
      { label: 'Fees collected', value: formatCurrency(sum(all, 'fee'), { compact: true }), icon: 'wallet', tone: 'brand' },
    ],
    tabs: [
      { id: 'pending', label: 'Pending', count: pending.length },
      { id: 'in progress', label: 'In progress', count: all.filter((r) => r.status === 'In Progress').length },
      { id: 'completed', label: 'Completed', count: completed.length },
      { id: 'rejected', label: 'Rejected', count: all.filter((r) => r.status === 'Rejected').length },
      { id: 'all', label: 'All', count: all.length },
    ],
    activeTab,
    onTabChange: (id) => {
      activeTab = id;
      node.table.refresh(id === 'all' ? all : all.filter((r) => r.status.toLowerCase() === id));
    },
    filters: [
      { id: 'q', type: 'search', label: 'Search', placeholder: 'Student, subject or reason…' },
      { id: 'subjectName', label: 'Subject', options: distinct(all, 'subjectName') },
      { id: 'className', label: 'Class', options: distinct(all, 'className') },
      { id: 'type', label: 'Request type', options: distinct(all, 'type') },
    ],
    onFilter: (id, value, allv, table) => {
      let out = activeTab === 'all' ? all.slice() : all.filter((r) => r.status.toLowerCase() === activeTab);
      if (allv.q) out = search(out, allv.q, ['studentName', 'subjectName', 'reason']);
      ['subjectName', 'className', 'type'].forEach((k) => { if (allv[k] && allv[k] !== 'all') out = out.filter((r) => r[k] === allv[k]); });
      table.refresh(out);
    },
    columns: [
      { key: 'studentName', label: 'Student', width: 240, sticky: true, render: (r) => Identity(r.studentName, `${r.className} — ${r.section} · ${r.admissionNo}`), value: (r) => r.studentName },
      { key: 'subjectName', label: 'Subject', width: 170, filter: true },
      { key: 'examGroupName', label: 'Exam cycle', width: 200, filter: true },
      { key: 'type', label: 'Request', width: 200, filter: true, render: (r) => Badge(r.type, { tone: 'neutral' }) },
      { key: 'original', label: 'Original', width: 110, align: 'right', numeric: true, render: (r) => `${r.original}/${r.maxMarks}` },
      {
        key: 'revised', label: 'Revised', width: 110, align: 'right', numeric: true,
        render: (r) => (r.revised === null ? h('span', { className: 't-faint' }, '—') : h('span', { className: 't-num t-semibold' }, `${r.revised}/${r.maxMarks}`)),
        value: (r) => (r.revised === null ? -1 : r.revised),
      },
      {
        key: 'change', label: 'Change', width: 110, align: 'right', numeric: true,
        render: (r) => (r.change === null ? h('span', { className: 't-faint' }, '—')
          : h('span', { className: r.change > 0 ? 't-success t-num t-semibold' : r.change < 0 ? 't-danger t-num t-semibold' : 't-muted t-num' },
            r.change > 0 ? `+${r.change}` : String(r.change))),
        value: (r) => (r.change === null ? 0 : r.change),
      },
      { key: 'fee', label: 'Fee', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: (v) => formatCurrency(v, { compact: true }), render: (r) => formatCurrency(r.fee) },
      { key: 'requestedOn', label: 'Requested', width: 140, render: (r) => formatDate(r.requestedOn), value: (r) => r.requestedOn },
      { key: 'evaluator', label: 'Re-evaluator', width: 190, hidden: true },
      { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
    ],
    rows: pending,
    onApprove: (row) => notify({ title: 'Re-evaluation approved', text: `${row.studentName} · ${row.subjectName} — assigned to a second evaluator.`, tone: 'success' }),
    onReject: (row) => notify({ title: 'Request rejected', text: `${row.studentName} — the fee will be refunded within seven working days.`, tone: 'danger' }),
    detail: (row) => {
      const st = byId(db.students, row.studentId);
      return h('div', { className: 'stack-3' },
        st ? profileHeaderLite(st) : null,
        DescriptionList([
          ['Subject', `${row.subjectName} (${row.subjectCode})`], ['Exam cycle', row.examGroupName],
          ['Request type', row.type], ['Fee paid', formatCurrency(row.fee)],
          ['Original marks', `${row.original} / ${row.maxMarks}`], ['Original grade', gradeFor((row.original / row.maxMarks) * 100)],
          ['Revised marks', row.revised === null ? 'Pending' : `${row.revised} / ${row.maxMarks}`],
          ['Requested on', formatDate(row.requestedOn, 'long')],
        ], { cols: 2 }),
        Callout({ tone: 'info', icon: 'message-square', title: 'Reason given by the student' }, row.reason),
        row.revised !== null
          ? SectionCard({ title: 'Impact of the revision', className: 'chart-card' },
            barChart({
              categories: ['Original', 'Revised'],
              series: [{ name: 'Marks', values: [row.original, row.revised] }],
              height: 200, showValues: true, target: row.maxMarks * 0.33, targetLabel: 'Pass mark',
              title: 'Original versus revised marks for this paper',
            }))
          : Callout({ tone: 'warning', icon: 'clock', title: 'Awaiting second evaluation' },
            'Board rules require a second evaluator who did not mark the original script. Turnaround is fifteen working days.'),
        SectionCard({ title: 'Process trail', icon: 'history' },
          Timeline([
            { title: 'Request raised', meta: formatDate(row.requestedOn), text: `${row.type} requested by the student through the portal.`, icon: 'edit', tone: 'info' },
            { title: 'Fee paid', meta: formatDate(row.requestedOn), text: `${formatCurrency(row.fee)} received via online payment.`, icon: 'wallet', tone: 'success' },
            row.status !== 'Pending' ? { title: 'Assigned to evaluator', meta: '2 days later', text: `Second evaluation assigned to ${row.evaluator}.`, icon: 'user-check', tone: 'brand' } : null,
            row.status === 'Completed' ? { title: 'Re-evaluation complete', meta: 'Result updated', text: row.change === 0 ? 'No change to the original marks.' : `Marks revised by ${row.change > 0 ? '+' : ''}${row.change}.`, icon: 'check-circle', tone: row.change === 0 ? 'neutral' : 'success' } : null,
          ].filter(Boolean))));
    },
  });

  mount.appendChild(node);
}

/* ==========================================================================
   30. ROUTE TABLE
   ========================================================================== */

const A = 'attendance';
const E = 'examination';

export const routes = {
  /* ------------------------------------------------------------ attendance */
  'attendance/mark-daily': {
    title: 'Mark Daily Attendance', section: A,
    subtitle: 'Fast keyboard-first roll call for one section at a time.',
    render: (mount, ctx) => renderMarkDaily(mount, ctx),
  },
  'attendance/period': {
    title: 'Period Attendance', section: A,
    subtitle: 'Subject-teacher marking period by period.',
    render: (mount, ctx) => renderPeriodAttendance(mount, ctx),
  },
  'attendance/class-wise': {
    title: 'Class-wise Attendance', section: A,
    subtitle: 'Section-level roll-call summary for the whole campus.',
    render: (mount, ctx) => renderClassWise(mount, ctx),
  },
  'attendance/monthly-register': {
    title: 'Monthly Register', section: A,
    subtitle: 'The statutory students × days attendance matrix.',
    render: (mount, ctx) => renderMonthlyRegister(mount, ctx),
  },
  'attendance/corrections': {
    title: 'Attendance Corrections', section: A,
    subtitle: 'Back-dated register changes awaiting academic-lead approval.',
    render: (mount, ctx) => renderCorrections(mount, ctx),
  },
  'attendance/leave-requests': {
    title: 'Student Leave Requests', section: A,
    subtitle: 'Parent-submitted leave applications and their approval trail.',
    render: (mount, ctx) => renderLeaveRequests(mount, ctx),
  },
  'attendance/late-early': {
    title: 'Late / Early Records', section: A,
    subtitle: 'Gate exceptions, delay profile and repeat offenders.',
    render: (mount, ctx) => renderLateEarly(mount, ctx),
  },
  'attendance/devices': {
    title: 'Biometric / RFID Devices', section: A,
    subtitle: 'Reader inventory, punch throughput and sync health.',
    render: (mount, ctx) => renderDevices(mount, ctx),
  },
  'attendance/defaulters': {
    title: 'Defaulters (<75%)', section: A,
    subtitle: 'Students below the CBSE eligibility threshold, with bulk parent notification.',
    render: (mount, ctx) => renderDefaulters(mount, ctx),
  },
  'attendance/reports': {
    title: 'Attendance Reports', section: A,
    subtitle: 'Calendar heatmap, trend lines and class comparison against target.',
    render: (mount, ctx) => renderAttendanceReports(mount, ctx),
  },

  /* ----------------------------------------------------------- examination */
  'examination/setup': {
    title: 'Exam Setup', section: E,
    subtitle: 'Create an examination cycle in four guided steps.',
    render: (mount, ctx) => renderExamSetup(mount, ctx),
  },
  'examination/groups': {
    title: 'Exam Groups', section: E,
    subtitle: 'Every examination cycle in the 2026-27 session.',
    render: (mount, ctx) => renderExamGroups(mount, ctx),
  },
  'examination/schedule': {
    title: 'Exam Schedule', section: E,
    subtitle: 'Datesheet grid with an automatic conflict check.',
    render: (mount, ctx) => renderExamSchedule(mount, ctx),
  },
  'examination/seating': {
    title: 'Seating & Hall Tickets', section: E,
    subtitle: 'Alternate-class seating grids and the admit-card generator.',
    render: (mount, ctx) => renderSeating(mount, ctx),
  },
  'examination/invigilators': {
    title: 'Invigilator Allocation', section: E,
    subtitle: 'Fair-share duty roster with own-subject exclusion.',
    render: (mount, ctx) => renderInvigilators(mount, ctx),
  },
  'examination/marks-entry': {
    title: 'Marks Entry', section: E,
    subtitle: 'Spreadsheet grid with inline validation and autosave.',
    render: (mount, ctx) => renderMarksEntry(mount, ctx),
  },
  'examination/grade-config': {
    title: 'Grade Configuration', section: E,
    subtitle: 'Grade bands, grade points and descriptors.',
    render: (mount, ctx) => renderGradeConfig(mount, ctx),
  },
  'examination/weightage': {
    title: 'Weightage', section: E,
    subtitle: 'How each cycle and each paper component rolls into the final result.',
    render: (mount, ctx) => renderWeightage(mount, ctx),
  },
  'examination/question-bank': {
    title: 'Question Bank', section: E,
    subtitle: 'Vetted questions filterable by chapter, difficulty, type and Bloom level.',
    render: (mount, ctx) => renderQuestionBank(mount, ctx),
  },
  'examination/online-exams': {
    title: 'Online Exams', section: E,
    subtitle: 'Computer-based tests with a builder and a student-facing runner.',
    render: (mount, ctx) => renderOnlineExams(mount, ctx),
  },
  'examination/omr': {
    title: 'OMR Processing', section: E,
    subtitle: 'Scan, read and validate optical answer sheets.',
    render: (mount, ctx) => renderOMR(mount, ctx),
  },
  'examination/result-processing': {
    title: 'Result Processing', section: E,
    subtitle: 'Validate, weight, grade, rank and publish.',
    render: (mount, ctx) => renderResultProcessing(mount, ctx),
  },
  'examination/report-cards': {
    title: 'Report Cards', section: E,
    subtitle: 'Generated progress reports with a live A4 preview.',
    render: (mount, ctx) => renderReportCards(mount, ctx),
  },
  'examination/report-card-designer': {
    title: 'Report Card Designer', section: E,
    subtitle: 'Drag blocks onto an A4 canvas and preview against live data.',
    render: (mount, ctx) => renderReportCardDesigner(mount, ctx),
  },
  'examination/merit-list': {
    title: 'Rank / Merit List', section: E,
    subtitle: 'Overall merit with house averages and score distribution.',
    render: (mount, ctx) => renderMeritList(mount, ctx),
  },
  'examination/performance': {
    title: 'Performance Analysis', section: E,
    subtitle: 'Subject-wise, class-wise, year-on-year and weak-area analysis.',
    render: (mount, ctx) => renderPerformance(mount, ctx),
  },
  'examination/re-evaluation': {
    title: 'Re-evaluation', section: E,
    subtitle: 'Re-totalling, photocopy and full re-evaluation requests.',
    render: (mount, ctx) => renderReevaluation(mount, ctx),
  },
};

export default routes;
