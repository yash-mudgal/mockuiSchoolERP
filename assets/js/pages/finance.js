/* ==========================================================================
   pages/finance.js — Fees · Finance · Reports
   Owns three nav sections:
     fees     (18 routes)  — heads, structures, collection, receipts, dues …
     finance  (15 routes)  — chart of accounts, vouchers, ledger, P&L …
     reports  (14 routes)  — report centre, domain reports, builder, scheduler
   Everything is composed from core/page-kit.js, core/ui.js and core/charts.js
   and reads real records out of data/db.js.
   ========================================================================== */

import {
  h, frag, Icon, Card, SectionCard, StatCard, Badge, Button, IconButton, Identity,
  DataTable, Modal, Drawer, ConfirmDialog, notify, EmptyState, Timeline, DescriptionList,
  ProgressBar, Avatar, Tabs, FilterBar, MenuButton, Callout, FileList, RankList,
  validators, mockAction, formatCurrency, formatNumber, formatDate, formatDateTime,
  formatPercent, relativeTime, toneForStatus, Field, Input, Select, Combobox,
  MultiSelect, Checkbox, RadioGroup, Switch, DatePicker, DateRangePicker, Textarea,
  FormGrid, FormSection, FormActions, SearchInput, SegmentedControl, Accordion,
  Stepper, ApprovalTrail, Divider, MetricRow, Toolbar, StackedProgressBar,
  RadialProgress, Skeleton, SkeletonTable, ErrorState, Rating, CommentThread,
  printNode, download, toCsv, copyToClipboard, debounce, initials, Pill, Tag,
  escapeHtml, ActivityFeed, AvatarStack, Collapse,
} from '../core/ui.js';

import {
  page, listPage, detailPage, dashboardPage, formPage, reportPage, settingsPage,
  approvalQueuePage, kanbanPage, calendarPage, profileHeader, kpiRow, greetingFor,
  missingRecord, pageActions, setBreadcrumb,
} from '../core/page-kit.js';

import {
  lineChart, areaChart, barChart, comboChart, donutChart, pieChart, funnelChart,
  heatmap, gaugeChart, scatterPlot, bulletChart, waterfallChart, treemap,
  radialBarChart, progressRing, sparkline, stackedProgressBar, ScaleLegend,
  PALETTE, SEQUENTIAL, ORDINAL, STATUS, seriesColor, compactNumber,
} from '../core/charts.js';

import {
  db, analytics, query, byId, where, search, sortBy, paginate, groupBy,
  sum, avg, count, distinct, countBy, sumBy, student360,
} from '../data/db.js';

import { icon } from '../core/icons.js';
import { navHref, navigate } from '../core/router.js';
import * as store from '../core/state.js';
import { routeMeta, breadcrumbFor } from '../core/nav.js';

/* ========================================================================== */
/*  Module stylesheet — tokens only, no literal colours / sizes               */
/* ========================================================================== */

const MODULE_CSS = `
.fin-scroll { overflow-x: auto; }
.fin-matrix { width: 100%; border-collapse: separate; border-spacing: 0; }
.fin-matrix th, .fin-matrix td {
  padding: var(--cell-pad-y) var(--cell-pad-x);
  border-bottom: 1px solid var(--border-subtle);
  text-align: right; white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.fin-matrix thead th {
  position: sticky; top: 0; z-index: 2;
  background: var(--surface-sunken); color: var(--text-secondary);
  font-weight: var(--fw-semibold); font-size: var(--fs-xs);
  text-transform: uppercase; letter-spacing: .06em;
}
.fin-matrix th:first-child, .fin-matrix td:first-child {
  text-align: left; position: sticky; left: 0; z-index: 1;
  background: var(--surface); border-right: 1px solid var(--border-subtle);
  font-weight: var(--fw-medium);
}
.fin-matrix thead th:first-child { z-index: 3; background: var(--surface-sunken); }
.fin-matrix tbody tr:hover td { background: var(--surface-hover); }
.fin-matrix tfoot td {
  background: var(--surface-sunken); font-weight: var(--fw-semibold);
  border-top: 1px solid var(--border-strong);
}
.fin-cell {
  width: 104px; text-align: right; font: inherit; color: var(--text);
  background: transparent; border: 1px solid transparent;
  border-radius: var(--r-sm); padding: var(--sp-1) var(--sp-2);
  font-variant-numeric: tabular-nums;
}
.fin-cell:hover { border-color: var(--border); background: var(--surface-hover); }
.fin-cell:focus-visible, .fin-cell:focus {
  outline: none; border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--ring-color); background: var(--surface);
}
.fin-cell[data-dirty="true"] { color: var(--text-brand); font-weight: var(--fw-semibold); }

/* ---- chart of accounts tree ---- */
.fin-tree { display: flex; flex-direction: column; }
.fin-node {
  display: flex; align-items: center; gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  border-bottom: 1px solid var(--border-subtle);
  border-radius: var(--r-sm);
}
.fin-node:hover { background: var(--surface-hover); }
.fin-node[data-group="true"] { font-weight: var(--fw-semibold); }
.fin-node-code {
  font-family: var(--font-mono); font-size: var(--fs-xs);
  color: var(--text-muted); min-width: 52px;
}
.fin-node-bal { margin-left: auto; font-variant-numeric: tabular-nums; }
.fin-twist {
  display: inline-grid; place-items: center; width: 20px; height: 20px;
  border-radius: var(--r-sm); color: var(--text-muted); background: transparent;
  border: 0; cursor: pointer; transition: transform var(--dur-fast) var(--ease);
}
.fin-twist[data-open="true"] { transform: rotate(90deg); }
.fin-twist:hover { background: var(--surface-active); color: var(--text); }

/* ---- ageing buckets ---- */
.fin-buckets { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--sp-3); }
.fin-bucket {
  border: 1px solid var(--border); border-radius: var(--r-lg);
  padding: var(--sp-4); background: var(--surface);
  display: flex; flex-direction: column; gap: var(--sp-2);
}
.fin-bucket[data-tone="ok"]    { border-left: 3px solid var(--chart-good); }
.fin-bucket[data-tone="warn"]  { border-left: 3px solid var(--chart-warning); }
.fin-bucket[data-tone="bad"]   { border-left: 3px solid var(--chart-serious); }
.fin-bucket[data-tone="worst"] { border-left: 3px solid var(--chart-critical); }

/* ---- fee collection workbench ---- */
.fin-picker-list { max-height: 320px; overflow-y: auto; }
.fin-picker-row {
  display: flex; align-items: center; gap: var(--sp-3); width: 100%;
  padding: var(--sp-2) var(--sp-3); border: 0; background: transparent;
  border-radius: var(--r-md); cursor: pointer; text-align: left; color: inherit;
}
.fin-picker-row:hover { background: var(--surface-hover); }
.fin-picker-row[data-active="true"] { background: var(--surface-selected); }
.fin-summary-rail { position: sticky; top: var(--sp-4); }
.fin-sum-line { display: flex; align-items: baseline; gap: var(--sp-3); }
.fin-sum-line > span:last-child { margin-left: auto; font-variant-numeric: tabular-nums; }
.fin-sum-total {
  border-top: 1px solid var(--border-strong); margin-top: var(--sp-2);
  padding-top: var(--sp-3); font-size: var(--fs-lg); font-weight: var(--fw-bold);
}
.fin-mode-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: var(--sp-3); }

/* ---- A4 receipt ---- */
.fin-receipt {
  background: var(--surface); color: var(--text);
  border: 1px solid var(--border); border-radius: var(--r-md);
  padding: var(--sp-7); max-width: 780px; margin: 0 auto;
}
.fin-rc-head {
  display: flex; gap: var(--sp-4); align-items: flex-start;
  border-bottom: 2px solid var(--brand-600); padding-bottom: var(--sp-4);
}
.fin-rc-crest {
  width: 56px; height: 56px; flex: 0 0 56px; border-radius: var(--r-md);
  display: grid; place-items: center;
  background: var(--brand-600); color: var(--on-brand);
}
.fin-rc-school { font-size: var(--fs-xl); font-weight: var(--fw-bold); letter-spacing: -.01em; }
.fin-rc-strip {
  display: flex; flex-wrap: wrap; gap: var(--sp-6);
  margin-top: var(--sp-4); padding: var(--sp-3) 0;
  border-bottom: 1px dashed var(--border);
}
.fin-rc-table { width: 100%; border-collapse: collapse; margin-top: var(--sp-4); }
.fin-rc-table th, .fin-rc-table td {
  padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--border-subtle);
  font-size: var(--fs-sm); text-align: left;
}
.fin-rc-table th {
  background: var(--surface-sunken); color: var(--text-secondary);
  font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: .06em;
}
.fin-rc-table td.num, .fin-rc-table th.num { text-align: right; font-variant-numeric: tabular-nums; }
.fin-rc-table tfoot td { font-weight: var(--fw-bold); border-top: 2px solid var(--border-strong); }
.fin-rc-sign {
  display: flex; justify-content: space-between; align-items: flex-end;
  margin-top: var(--sp-8); gap: var(--sp-6);
}
.fin-rc-sign-line { border-top: 1px solid var(--text-muted); padding-top: var(--sp-2); min-width: 180px; text-align: center; }
.fin-rc-stamp {
  border: 2px solid var(--success-600); color: var(--success-700);
  border-radius: var(--r-md); padding: var(--sp-2) var(--sp-4);
  font-weight: var(--fw-bold); letter-spacing: .1em; text-transform: uppercase;
  transform: rotate(-6deg);
}
@media print {
  @page { size: A4; margin: 14mm; }
  .fin-receipt { border: 0; padding: 0; max-width: none; }
  .no-print, .modal-foot, .drawer-foot { display: none !important; }
}

/* ---- report centre catalogue ---- */
.fin-cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--sp-4); }
.fin-cat-card {
  display: flex; flex-direction: column; gap: var(--sp-2);
  padding: var(--sp-4); border: 1px solid var(--border); border-radius: var(--r-lg);
  background: var(--surface); cursor: pointer; text-align: left; color: inherit;
  transition: border-color var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
}
.fin-cat-card:hover { border-color: var(--border-brand); box-shadow: var(--shadow-md); transform: translateY(-2px); }
.fin-cat-card:focus-visible { outline: none; border-color: var(--border-focus); box-shadow: 0 0 0 3px var(--ring-color); }
.fin-cat-ico {
  width: 34px; height: 34px; border-radius: var(--r-md); display: grid; place-items: center;
  background: var(--surface-accent); color: var(--text-brand);
}
.fin-cat-title { font-weight: var(--fw-semibold); line-height: var(--lh-snug); }

/* ---- misc ---- */
.fin-ledger-run { font-variant-numeric: tabular-nums; }
.fin-statement { width: 100%; border-collapse: collapse; }
.fin-statement td, .fin-statement th { padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--border-subtle); }
.fin-statement td.num { text-align: right; font-variant-numeric: tabular-nums; }
.fin-statement tr[data-level="head"] td {
  background: var(--surface-sunken); font-weight: var(--fw-semibold);
  text-transform: uppercase; font-size: var(--fs-xs); letter-spacing: .06em;
}
.fin-statement tr[data-level="total"] td {
  font-weight: var(--fw-bold); border-top: 2px solid var(--border-strong);
  border-bottom: 3px double var(--border-strong);
}
.fin-statement tr[data-level="sub"] td:first-child { padding-left: var(--sp-6); }
@media (max-width: 768px) {
  .fin-rc-strip { gap: var(--sp-3); }
  .fin-receipt { padding: var(--sp-4); }
}
`;

let _cssDone = false;
function ensureStyles() {
  if (_cssDone || document.getElementById('fin-module-css')) { _cssDone = true; return; }
  _cssDone = true;
  document.head.appendChild(h('style', { id: 'fin-module-css', html: MODULE_CSS }));
}

/* ========================================================================== */
/*  Small helpers                                                             */
/* ========================================================================== */

const TODAY = '2026-08-20';
const AY_LABEL = '2026-27';

const money = (n, o) => formatCurrency(Number(n) || 0, o);
const cmoney = (n) => formatCurrency(Number(n) || 0, { compact: true });
const num = (n) => formatNumber(Number(n) || 0);

function campusOf(ctx) {
  return (ctx && ctx.state && ctx.state.campusId) || store.get('campusId') || 'C1';
}
function byCampus(rows, ctx) {
  const c = campusOf(ctx);
  return c && c !== 'all' ? rows.filter((r) => r.campusId === c) : rows.slice();
}
function campusName(id) {
  const c = byId(db.campuses, id);
  return c ? c.name : 'All campuses';
}
function campusOptions() {
  return db.campuses.map((c) => ({ value: c.id, label: c.name }));
}
function classOptions() {
  return distinct(db.classes, 'name');
}
const CAMPUS_MAP = () => Object.fromEntries(db.campuses.map((c) => [c.id, c.name]));

/** Money column factory for DataTable. */
function moneyCol(key, label, extra = {}) {
  return {
    key, label, align: 'right', numeric: true, width: extra.width || 130,
    render: (r) => money(r[key]),
    value: (r) => Number(r[key]) || 0,
    aggregate: extra.aggregate === undefined ? 'sum' : extra.aggregate,
    format: (v) => cmoney(v),
    ...extra,
  };
}
function dateCol(key, label, width = 120) {
  return { key, label, width, render: (r) => (r[key] ? formatDate(r[key]) : '—'), value: (r) => r[key] || '' };
}
function statusCol(key = 'status', label = 'Status', width = 140) {
  return { key, label, width, filter: true, render: (r) => Badge(r[key]) };
}
function studentCol(nameKey = 'studentName', metaFn) {
  return {
    key: nameKey, label: 'Student', sticky: true, width: 230,
    render: (r) => Identity(r[nameKey], metaFn ? metaFn(r) : (r.admissionNo || r.className || ''), { size: 'sm' }),
    value: (r) => r[nameKey],
  };
}

/* Indian amount → words, for receipts. */
const W_ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const W_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n) {
  if (n < 20) return W_ONES[n];
  return (W_TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + W_ONES[n % 10] : '')).trim();
}
function threeDigits(n) {
  const out = [];
  if (n > 99) { out.push(W_ONES[Math.floor(n / 100)], 'Hundred'); n %= 100; }
  if (n) out.push(twoDigits(n));
  return out.join(' ');
}
/** amountInWords(125400) → 'Rupees One Lakh Twenty Five Thousand Four Hundred Only' */
function amountInWords(value) {
  let n = Math.round(Math.abs(Number(value) || 0));
  if (!n) return 'Rupees Zero Only';
  const parts = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) parts.push(threeDigits(crore), 'Crore');
  if (lakh) parts.push(threeDigits(lakh), 'Lakh');
  if (thousand) parts.push(threeDigits(thousand), 'Thousand');
  if (n) parts.push(threeDigits(n));
  return 'Rupees ' + parts.join(' ').replace(/\s+/g, ' ').trim() + ' Only';
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

/** Print a node in a window that also carries this module's stylesheet. */
function printDocument(node, title = 'Springdale International School') {
  const win = window.open('', '_blank', 'width=1024,height=768');
  if (!win) {
    notify({ title: 'Pop-up blocked', text: 'Allow pop-ups for this site to print.', tone: 'warning' });
    return;
  }
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((l) => `<link rel="stylesheet" href="${l.href}">`).join('');
  const theme = 'light'; // receipts always print on white
  win.document.write(
    `<!doctype html><html data-theme="${theme}"><head><meta charset="utf-8">` +
    `<title>${escapeHtml(title)}</title>${links}<style>${MODULE_CSS}</style>` +
    `<style>body{padding:0;margin:0;background:white}</style></head><body>${node.outerHTML}</body></html>`);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 400);
}

/** Toolbar of export buttons shared by report screens. */
function exportBar(name, rows, columns, rootRef) {
  return frag(
    Button('Excel', {
      variant: 'secondary', icon: 'download',
      onClick: () => {
        download(`${name}.csv`, toCsv(rows, columns.map((c) => ({ key: c.key, label: c.label, value: c.value }))), 'text/csv;charset=utf-8');
        notify({ title: 'Export ready', text: `${name}.csv · ${num(rows.length)} rows`, tone: 'success' });
      },
    }),
    Button('PDF', { variant: 'secondary', icon: 'file-text', onClick: mockAction('Export PDF') }),
    Button('Print', { variant: 'secondary', icon: 'print', onClick: () => (rootRef && rootRef.node ? printNode(rootRef.node, name) : window.print()) }),
    Button('Schedule', { variant: 'ghost', icon: 'clock', onClick: () => scheduleReportModal(name) }));
}

function scheduleReportModal(reportName) {
  return formPage({
    mode: 'modal', size: 'md',
    title: 'Schedule report',
    subtitle: reportName,
    submitLabel: 'Schedule',
    sections: [{
      title: 'Delivery', cols: 2, fields: [
        { id: 'freq', label: 'Frequency', type: 'select', required: true, value: 'Weekly', options: ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly'] },
        { id: 'day', label: 'Run on', type: 'select', value: 'Monday', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', '1st of month', 'Last day of month'] },
        { id: 'time', label: 'Time', type: 'time', value: '07:00' },
        { id: 'format', label: 'Format', type: 'select', value: 'Excel', options: ['Excel', 'PDF', 'CSV'] },
        { id: 'to', label: 'Recipients', span: 'full', required: true, placeholder: 'principal@springdale.edu.in, accounts@springdale.edu.in', validate: validators.required },
        { id: 'note', label: 'Covering note', type: 'textarea', span: 'full', placeholder: 'Optional message included in the email body' },
      ],
    }],
    onSubmit: (v) => notify({ title: 'Report scheduled', text: `${reportName} · ${v.freq} at ${v.time || '07:00'}`, tone: 'success' }),
  });
}

/* ---------------------------------------------------------------- fee maths */

/** The published fee structure that applies to a student. */
function structureFor(student) {
  if (!student) return null;
  return db.feeStructures.find((f) => f.campusId === student.campusId && f.className === student.className) || null;
}

/** Invoices raised against a student, newest first. */
function invoicesFor(studentId) {
  return sortBy(db.invoices.filter((i) => i.studentId === studentId), 'dueDate', 'asc');
}

/** Payments recorded against a student. */
function paymentsFor(studentId) {
  return sortBy(db.payments.filter((p) => p.studentId === studentId), 'date', 'desc');
}

/** Split an invoice amount across the fee heads of the applicable structure. */
function headSplit(student, amount) {
  const st = structureFor(student);
  if (!st || !st.total) return [{ headId: 'FH01', name: 'Tuition Fee', amount }];
  return st.components
    .filter((c) => c.amount > 0)
    .map((c) => ({ headId: c.headId, name: c.name, frequency: c.frequency, amount: Math.round((c.amount / st.total) * amount) }));
}

/** Ageing bucket for an overdue invoice. */
function ageBucket(days) {
  if (days <= 0) return 'Not due';
  if (days <= 30) return '0-30 days';
  if (days <= 60) return '31-60 days';
  if (days <= 90) return '61-90 days';
  return '90+ days';
}
const BUCKETS = ['0-30 days', '31-60 days', '61-90 days', '90+ days'];
const BUCKET_TONE = { '0-30 days': 'ok', '31-60 days': 'warn', '61-90 days': 'bad', '90+ days': 'worst' };

/** Outstanding invoice rows enriched with ageing information. */
function outstandingRows(ctx) {
  return byCampus(db.invoices, ctx)
    .filter((i) => i.balance > 0)
    .map((i) => ({
      ...i,
      payable: i.balance + i.lateFee - i.discount,
      bucket: ageBucket(i.overdueDays),
    }));
}

/** KPI tiles reused across the fee screens. */
function feeKpis(ctx) {
  const k = analytics.kpis;
  return [
    { label: 'Billed (YTD)', value: cmoney(k.feeBilled), icon: 'receipt', tone: 'info', trend: analytics.sparks.revenue, deltaLabel: 'vs last year', delta: 9.4 },
    { label: 'Collected', value: cmoney(k.feeCollected), icon: 'wallet', tone: 'success', delta: 8.1, deltaLabel: 'vs last year', trend: analytics.sparks.collection },
    { label: 'Outstanding', value: cmoney(k.feeOutstanding), icon: 'alert-circle', tone: 'danger', delta: -3.2, deltaLabel: 'vs last month', trend: analytics.sparks.outstanding },
    { label: 'Collection rate', value: `${k.collectionRate}%`, icon: 'percent', tone: 'brand', delta: 1.6, footer: `${num(k.defaulterCount)} students with dues` },
  ];
}

/** Standard campus + class + status filter row. */
function commonFilters(extra = []) {
  return [
    { id: 'q', type: 'search', label: 'Search', placeholder: 'Name, admission no or receipt…', width: '280px' },
    { id: 'campusId', label: 'Campus', options: campusOptions() },
    { id: 'className', label: 'Class', options: classOptions() },
    ...extra,
  ];
}

/** Apply the common filter values to a row set. */
function applyFilters(rows, all, opts = {}) {
  let out = rows;
  for (const [key, value] of Object.entries(all || {})) {
    if (value === undefined || value === null || value === '' || value === 'all') continue;
    if (key === 'q') { out = search(out, value, opts.searchKeys); continue; }
    if (key === 'from') { out = out.filter((r) => !r[opts.dateKey || 'date'] || r[opts.dateKey || 'date'] >= value); continue; }
    if (key === 'to') { out = out.filter((r) => !r[opts.dateKey || 'date'] || r[opts.dateKey || 'date'] <= value); continue; }
    out = out.filter((r) => String(r[key]) === String(value));
  }
  return out;
}

/** Empty state used by the fee lists. */
function emptyFor(title, text, action) {
  return EmptyState({ icon: 'wallet', title, text, action });
}

/* ========================================================================== */
/*  ROUTE TABLE                                                               */
/* ========================================================================== */

export const routes = {};

/* ======================================================= fees/heads ======= */

function headUsage() {
  const strength = new Map();
  for (const s of db.students) {
    if (s.status !== 'Active') continue;
    const k = s.campusId + '|' + s.className;
    strength.set(k, (strength.get(k) || 0) + 1);
  }
  const usage = new Map();
  for (const st of db.feeStructures) {
    const n = strength.get(st.campusId + '|' + st.className) || 0;
    for (const c of st.components) {
      if (!c.amount) continue;
      const cur = usage.get(c.headId) || { structures: 0, students: 0, annual: 0, min: Infinity, max: 0 };
      cur.structures += 1;
      cur.students += n;
      cur.annual += c.amount * n;
      cur.min = Math.min(cur.min, c.amount);
      cur.max = Math.max(cur.max, c.amount);
      usage.set(c.headId, cur);
    }
  }
  return usage;
}

function feeHeadForm(head) {
  return formPage({
    mode: 'modal', size: 'lg',
    title: head ? `Edit ${head.name}` : 'New fee head',
    subtitle: head ? `Head code ${head.id} · academic year ${AY_LABEL}` : 'Fee heads are the building blocks of every fee structure',
    submitLabel: head ? 'Save changes' : 'Create fee head',
    values: head || {},
    sections: [
      {
        title: 'Head details', cols: 2,
        fields: [
          { id: 'name', label: 'Head name', required: true, placeholder: 'e.g. Tuition Fee', validate: validators.required },
          { id: 'type', label: 'Type', type: 'select', required: true, options: ['Recurring', 'One-time', 'Penalty', 'Deposit'] },
          { id: 'frequency', label: 'Billing frequency', type: 'select', required: true, options: ['Monthly', 'Quarterly', 'Term', 'Annual', 'One-time', 'On Demand'] },
          { id: 'ledger', label: 'Mapped ledger', type: 'combobox', required: true, options: db.accounts.filter((a) => !a.group).map((a) => ({ value: a.name, label: `${a.code} · ${a.name}` })) },
          { id: 'refundable', label: 'Refundable', type: 'switch', switchLabel: 'This head is refunded on exit', description: 'Security deposits and caution money are usually refundable.' },
          { id: 'taxable', label: 'GST applicable', type: 'switch', switchLabel: 'Charge 18% GST', description: 'Applies to transport, mess and merchandise heads.' },
          { id: 'notes', label: 'Internal notes', type: 'textarea', span: 'full', placeholder: 'Visible to the accounts team only' },
        ],
      },
    ],
    onSubmit: (v) => notify({ title: head ? 'Fee head updated' : 'Fee head created', text: v.name, tone: 'success' }),
  });
}

routes['fees/heads'] = {
  title: 'Fee Heads',
  subtitle: 'Every chargeable component that can appear on a fee structure',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const usage = headUsage();
    const rows = db.feeHeads.map((f) => {
      const u = usage.get(f.id) || { structures: 0, students: 0, annual: 0, min: 0, max: 0 };
      return {
        ...f,
        structures: u.structures,
        students: u.students,
        annual: u.annual,
        minAmount: u.min === Infinity ? 0 : u.min,
        maxAmount: u.max,
        status: u.structures ? 'Active' : 'Unused',
      };
    });

    mount.appendChild(listPage({
      title: 'Fee Heads',
      subtitle: `${rows.length} heads mapped to ${distinct(db.feeHeads, 'ledger').length} income ledgers · ${AY_LABEL}`,
      route: 'fees/heads',
      actions: [
        Button('Import heads', { variant: 'secondary', icon: 'upload', onClick: mockAction('Import fee heads') }),
        Button('New fee head', { variant: 'primary', icon: 'plus', onClick: () => feeHeadForm(null) }),
      ],
      kpis: [
        { label: 'Fee heads', value: rows.length, icon: 'layers', tone: 'brand', footer: `${rows.filter((r) => r.type === 'Recurring').length} recurring · ${rows.filter((r) => r.type === 'One-time').length} one-time` },
        { label: 'Annual billing value', value: cmoney(sum(rows, 'annual')), icon: 'banknote', tone: 'info', delta: 9.4, deltaLabel: 'vs last year' },
        { label: 'Refundable heads', value: rows.filter((r) => r.refundable).length, icon: 'refresh-ccw', tone: 'warning', footer: 'Security deposit returned on TC' },
        { label: 'GST applicable', value: rows.filter((r) => r.taxable).length, icon: 'percent', tone: 'success', footer: 'Transport, mess and merchandise' },
      ],
      chart: donutChart({
        data: analytics.feeHeadSplit,
        height: 250,
        valueFormat: 'currencyCompact',
        centerValue: cmoney(sum(analytics.feeHeadSplit, 'value')),
        centerLabel: 'Billed YTD',
      }),
      chartTitle: 'Revenue mix by fee head',
      chartActions: Button('Open fee reports', { variant: 'ghost', size: 'sm', iconRight: 'arrow-right', route: 'fees/reports' }),
      columns: [
        { key: 'name', label: 'Fee head', sticky: true, width: 220, render: (r) => h('div', { className: 'stack-1' },
          h('span', { className: 't-medium' }, r.name),
          h('span', { className: 't-xs t-muted' }, r.id + ' · ' + r.ledger)) },
        { key: 'type', label: 'Type', width: 110, filter: true },
        { key: 'frequency', label: 'Frequency', width: 120, filter: true },
        moneyCol('minAmount', 'Lowest slab', { aggregate: null }),
        moneyCol('maxAmount', 'Highest slab', { aggregate: null }),
        { key: 'structures', label: 'Structures', align: 'right', numeric: true, width: 100, aggregate: 'sum' },
        { key: 'students', label: 'Students', align: 'right', numeric: true, width: 110, render: (r) => num(r.students), value: (r) => r.students, aggregate: 'sum', format: (v) => num(v) },
        moneyCol('annual', 'Annual value', { width: 150 }),
        { key: 'refundable', label: 'Refundable', width: 110, render: (r) => Badge(r.refundable ? 'Yes' : 'No', { tone: r.refundable ? 'info' : 'neutral' }), value: (r) => (r.refundable ? 'Yes' : 'No') },
        { key: 'taxable', label: 'GST', width: 90, render: (r) => (r.taxable ? Badge('18%', { tone: 'warning' }) : h('span', { className: 't-muted' }, '—')), value: (r) => (r.taxable ? 18 : 0) },
        statusCol('status', 'Status', 110),
      ],
      rows,
      footerAggregates: true,
      selectable: true,
      searchKeys: ['name', 'ledger', 'type', 'id'],
      bulkActions: [
        { label: 'Map to ledger', icon: 'link', onClick: (sel) => notify({ title: `${sel.length} heads remapped`, text: 'Ledger mapping updated.', tone: 'success' }) },
        { label: 'Deactivate', icon: 'x-circle', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Deactivate ${sel.length} fee heads?`, text: 'They stay on historic invoices but cannot be added to new structures.', tone: 'danger', confirmLabel: 'Deactivate' }).then((ok) => ok && notify({ title: 'Fee heads deactivated', tone: 'warning' })) },
      ],
      rowActions: (row) => [
        { label: 'Edit head', icon: 'edit', onClick: () => feeHeadForm(row) },
        { label: 'Where used', icon: 'grid', route: 'fees/structures' },
        { label: 'Class-wise amounts', icon: 'table', route: 'fees/class-wise' },
        { separator: true },
        { label: 'Deactivate', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: `Deactivate ${row.name}?`, text: 'Existing invoices are untouched.', tone: 'danger', confirmLabel: 'Deactivate' }).then((ok) => ok && notify({ title: `${row.name} deactivated`, tone: 'warning' })) },
      ],
      onRowClick: (row) => feeHeadForm(row),
      tableTitle: 'Fee head master',
      tableSubtitle: 'Slabs are the lowest and highest amount across all 75 published structures',
      exportName: 'fee-heads',
      emptyState: emptyFor('No fee heads yet', 'Fee heads describe what you charge. Create the first one to start building structures.', Button('New fee head', { variant: 'primary', icon: 'plus', onClick: () => feeHeadForm(null) })),
    }));
  },
};

/* ================================================== fees/structures ======= */

function structureForm(existing) {
  const heads = db.feeHeads.filter((f) => f.type !== 'Penalty');
  return formPage({
    mode: 'modal', size: 'xl',
    title: existing ? `Edit ${existing.name}` : 'New fee structure',
    subtitle: `Academic year ${AY_LABEL} · amounts are annual and split across installments`,
    submitLabel: existing ? 'Save structure' : 'Publish structure',
    values: existing ? { name: existing.name, campusId: existing.campusId, className: existing.className, installments: String(existing.installments), dueDay: String(existing.dueDay), lateFeePerDay: String(existing.lateFeePerDay) } : { installments: '4', dueDay: '10', lateFeePerDay: '50' },
    sections: [
      {
        title: 'Applies to', cols: 3,
        fields: [
          { id: 'name', label: 'Structure name', span: 2, required: true, placeholder: 'Class VIII — MAIN — 2026-27', validate: validators.required },
          { id: 'campusId', label: 'Campus', type: 'select', required: true, options: campusOptions() },
          { id: 'className', label: 'Class', type: 'combobox', required: true, options: classOptions() },
          { id: 'stream', label: 'Stream (senior classes)', type: 'select', options: ['All streams', 'Science', 'Commerce', 'Humanities'] },
          { id: 'effective', label: 'Effective from', type: 'date', value: '2026-04-01' },
        ],
      },
      {
        title: 'Components', description: 'Annual amount for each fee head. Leave blank to exclude the head.', cols: 3,
        fields: heads.map((hd) => ({
          id: 'h_' + hd.id,
          label: hd.name,
          type: 'number',
          hint: hd.frequency,
          value: existing ? String((existing.components.find((c) => c.headId === hd.id) || {}).amount || '') : '',
        })),
      },
      {
        title: 'Billing rules', cols: 3,
        fields: [
          { id: 'installments', label: 'Installments', type: 'select', required: true, options: ['1', '2', '3', '4', '6', '12'] },
          { id: 'dueDay', label: 'Due day of month', type: 'number', required: true, hint: '1-28' },
          { id: 'lateFeePerDay', label: 'Late fee per day (INR)', type: 'number', hint: 'Capped at 3,000 per invoice' },
          { id: 'graceDays', label: 'Grace period (days)', type: 'number', value: '7' },
          { id: 'autoInvoice', label: 'Auto-invoice', type: 'switch', switchLabel: 'Raise invoices automatically', description: 'Invoices generate 10 days before the due date.' },
          { id: 'notifyParents', label: 'Notify parents', type: 'switch', switchLabel: 'Send SMS + email on publish' },
        ],
      },
    ],
    onSubmit: (v) => notify({ title: existing ? 'Structure updated' : 'Structure published', text: `${v.name} · ${v.installments} installments`, tone: 'success' }),
  });
}

function structureDetail(st) {
  const strength = db.students.filter((s) => s.campusId === st.campusId && s.className === st.className && s.status === 'Active').length;
  return h('div', { className: 'stack-3' },
    DescriptionList([
      ['Campus', campusName(st.campusId)],
      ['Class', st.className],
      ['Academic year', AY_LABEL],
      ['Installments', `${st.installments} per year`],
      ['Due day', `${st.dueDay}th of the billing month`],
      ['Late fee', `${money(st.lateFeePerDay)} per day (max ${money(3000)})`],
      ['Students on this structure', num(strength)],
      ['Annual value', money(st.total * strength)],
    ], { cols: 2 }),
    DataTable({
      columns: [
        { key: 'name', label: 'Fee head', width: 220 },
        { key: 'frequency', label: 'Frequency', width: 130 },
        moneyCol('amount', 'Annual amount'),
        { key: 'per', label: `Per installment (${st.installments})`, align: 'right', numeric: true, width: 170, render: (r) => money(Math.round(r.amount / st.installments)), value: (r) => Math.round(r.amount / st.installments) },
        { key: 'share', label: 'Share', align: 'right', numeric: true, width: 90, render: (r) => formatPercent((r.amount / st.total) * 100), value: (r) => (r.amount / st.total) * 100 },
      ],
      rows: st.components.filter((c) => c.amount > 0),
      paginate: false, searchable: false, columnToggle: false, exportable: false,
      footerAggregates: true, maxHeight: 'none',
    }));
}

routes['fees/structures'] = {
  title: 'Fee Structures',
  subtitle: 'Published class-wise fee plans for the current academic year',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const strengthOf = (st) => db.students.filter((s) => s.campusId === st.campusId && s.className === st.className && s.status === 'Active').length;
    const rows = byCampus(db.feeStructures, ctx).map((st) => {
      const strength = strengthOf(st);
      return { ...st, campusName: campusName(st.campusId), strength, annual: st.total * strength, perInstallment: Math.round(st.total / st.installments) };
    });
    const byClass = sortBy(rows, 'classLevel', 'asc');
    const searchKeys = ['name', 'className', 'campusName', 'id'];

    mount.appendChild(listPage({
      title: 'Fee Structures',
      subtitle: `${rows.length} structures · ${campusName(campusOf(ctx))} · ${AY_LABEL}`,
      route: 'fees/structures',
      actions: [
        Button('Class-wise matrix', { variant: 'secondary', icon: 'table', route: 'fees/class-wise' }),
        Button('Copy from last year', { variant: 'secondary', icon: 'copy', onClick: () => ConfirmDialog({ title: 'Copy 2025-26 structures?', text: 'All structures are cloned into 2026-27 with a 6% inflation uplift. You can edit them before publishing.', confirmLabel: 'Copy & uplift', tone: 'brand', icon: 'copy' }).then((ok) => ok && notify({ title: '75 structures copied', text: 'Saved as drafts in 2026-27.', tone: 'success' })) }),
        Button('New structure', { variant: 'primary', icon: 'plus', onClick: () => structureForm(null) }),
      ],
      kpis: [
        { label: 'Structures', value: rows.length, icon: 'grid', tone: 'brand', footer: `${distinct(rows, 'className').length} classes covered` },
        { label: 'Average annual fee', value: cmoney(rows.length ? avg(rows, 'total') : 0), icon: 'banknote', tone: 'info', delta: 6.0, deltaLabel: 'inflation uplift' },
        { label: 'Highest slab', value: cmoney(rows.length ? Math.max(...rows.map((r) => r.total)) : 0), icon: 'trending-up', tone: 'warning', footer: 'Senior secondary, IB stream' },
        { label: 'Students mapped', value: num(sum(rows, 'strength')), icon: 'graduation-cap', tone: 'success', footer: 'Every active student has a structure' },
      ],
      chart: barChart({
        categories: byClass.map((r) => r.className.replace('Class ', '')),
        series: [{ name: 'Annual fee', values: byClass.map((r) => r.total) }],
        valueFormat: 'currencyCompact', height: 260,
      }),
      chartTitle: 'Annual fee by class',
      columns: [
        { key: 'name', label: 'Structure', sticky: true, width: 250, render: (r) => h('div', { className: 'stack-1' },
          h('span', { className: 't-medium' }, r.className),
          h('span', { className: 't-xs t-muted' }, `${r.id} · ${r.campusName}`)), value: (r) => r.name },
        { key: 'campusName', label: 'Campus', width: 170, filter: true, hidden: true },
        { key: 'classLevel', label: 'Level', width: 80, align: 'right', numeric: true },
        { key: 'headCount', label: 'Heads', width: 90, align: 'right', numeric: true, render: (r) => r.components.filter((c) => c.amount > 0).length, value: (r) => r.components.filter((c) => c.amount > 0).length },
        moneyCol('total', 'Annual fee', { width: 140 }),
        { key: 'installments', label: 'Installments', width: 110, align: 'right', numeric: true, filter: true },
        moneyCol('perInstallment', 'Per installment', { width: 150, aggregate: null }),
        { key: 'strength', label: 'Students', width: 100, align: 'right', numeric: true, render: (r) => num(r.strength), value: (r) => r.strength, aggregate: 'sum', format: (v) => num(v) },
        moneyCol('annual', 'Annual value', { width: 150 }),
        { key: 'lateFeePerDay', label: 'Late fee/day', width: 120, align: 'right', numeric: true, render: (r) => money(r.lateFeePerDay) },
        statusCol('status', 'Status', 120),
      ],
      rows,
      selectable: true,
      footerAggregates: true,
      searchKeys,
      expandable: (row) => structureDetail(row),
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Class or structure id...', width: '260px' },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'className', label: 'Class', options: classOptions() },
        { id: 'installments', label: 'Installments', options: ['2', '3', '4'] },
      ],
      onFilter: (id, value, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys })),
      bulkActions: [
        { label: 'Publish', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} structures published`, text: 'Parents can see the revised plan on the portal.', tone: 'success' }) },
        { label: 'Apply uplift %', icon: 'trending-up', onClick: (sel) => notify({ title: 'Uplift applied', text: `${sel.length} structures increased by 6%.`, tone: 'info' }) },
        { label: 'Archive', icon: 'archive', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Archive ${sel.length} structures?`, tone: 'danger', confirmLabel: 'Archive' }).then((ok) => ok && notify({ title: 'Structures archived', tone: 'warning' })) },
      ],
      rowActions: (row) => [
        { label: 'Edit structure', icon: 'edit', onClick: () => structureForm(row) },
        { label: 'View components', icon: 'layers', onClick: () => Drawer({ title: row.name, subtitle: `${row.components.filter((c) => c.amount > 0).length} heads · ${money(row.total)} per year`, size: 'lg', body: structureDetail(row), actions: (close) => frag(Button('Close', { variant: 'secondary', onClick: close }), Button('Edit', { variant: 'primary', icon: 'edit', onClick: () => { close(); structureForm(row); } })) }) },
        { label: 'Installment plan', icon: 'calendar', route: 'fees/installments' },
        { label: 'Assign to students', icon: 'user-check', route: 'fees/assignment' },
        { separator: true },
        { label: 'Duplicate', icon: 'copy', onClick: () => notify({ title: 'Structure duplicated', text: `${row.name} (copy)`, tone: 'success' }) },
        { label: 'Archive', icon: 'archive', tone: 'danger', onClick: () => ConfirmDialog({ title: `Archive ${row.className}?`, text: 'Archived structures cannot be assigned to new students.', tone: 'danger', confirmLabel: 'Archive' }).then((ok) => ok && notify({ title: 'Structure archived', tone: 'warning' })) },
      ],
      tableTitle: 'Published structures',
      tableSubtitle: 'Expand a row for the head-wise break-up and per-installment amounts',
      exportName: 'fee-structures',
      emptyState: emptyFor('No structures for this campus', 'Create a structure or copy last year plan to get started.', Button('New structure', { variant: 'primary', icon: 'plus', onClick: () => structureForm(null) })),
    }));
  },
};

/* =================================================== fees/class-wise ====== */

routes['fees/class-wise'] = {
  title: 'Class-wise Fees',
  subtitle: 'Fee head x class matrix with inline editing',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    let campusId = campusOf(ctx);
    const heads = db.feeHeads.filter((f) => db.feeStructures.some((s) => s.components.some((c) => c.headId === f.id && c.amount > 0)));
    const edits = new Map();
    const host = h('div', { className: 'stack' });

    const dirtyLabel = h('span', { className: 't-sm t-muted' }, 'No unsaved changes');
    const saveBtn = Button('Save changes', {
      variant: 'primary', icon: 'check', disabled: true,
      onClick: () => {
        const n = edits.size;
        ConfirmDialog({
          title: `Publish ${n} amended amounts?`,
          text: 'Students already invoiced on the old amounts are not re-billed. Future invoices use the new values.',
          confirmLabel: 'Publish changes', tone: 'brand', icon: 'check-circle',
        }).then((ok) => { if (!ok) return; edits.clear(); notify({ title: `${n} amounts published`, text: `Fee structures updated for ${AY_LABEL}.`, tone: 'success' }); paint(); });
      },
    });

    function dirtyBar() {
      const n = edits.size;
      dirtyLabel.textContent = n ? `${n} unsaved cell${n > 1 ? 's' : ''}` : 'No unsaved changes';
      dirtyLabel.className = n ? 't-sm t-warning t-semibold' : 't-sm t-muted';
      saveBtn.disabled = !n;
    }

    function buildMatrix(structures) {
      const valueOf = (st, hd) => {
        const key = st.id + '|' + hd.id;
        if (edits.has(key)) return edits.get(key);
        const c = st.components.find((x) => x.headId === hd.id);
        return c ? c.amount : 0;
      };
      const rowTotalCells = new Map();
      const colTotalCells = new Map();
      const grandCell = h('td', { className: 't-num' });

      const repaintTotals = () => {
        let grand = 0;
        const col = new Map();
        for (const st of structures) {
          let t = 0;
          for (const hd of heads) { const v = valueOf(st, hd); t += v; col.set(hd.id, (col.get(hd.id) || 0) + v); }
          const cell = rowTotalCells.get(st.id);
          if (cell) cell.textContent = money(t);
          grand += t;
        }
        for (const hd of heads) { const c = colTotalCells.get(hd.id); if (c) c.textContent = money(col.get(hd.id) || 0); }
        grandCell.textContent = money(grand);
      };

      const body = structures.map((st) => {
        const totalCell = h('td', { className: 't-num t-semibold' });
        rowTotalCells.set(st.id, totalCell);
        return h('tr', null,
          h('td', null, h('div', { className: 'stack-1' },
            h('span', { className: 't-medium' }, st.className),
            h('span', { className: 't-xs t-muted' }, `${st.installments} installments · due ${st.dueDay}th`))),
          heads.map((hd) => h('td', null, h('input', {
            className: 'fin-cell', type: 'text', inputMode: 'numeric',
            value: formatNumber(valueOf(st, hd)),
            attrs: { 'aria-label': `${hd.name} for ${st.className}` },
            onFocus: (e) => { e.target.value = String(valueOf(st, hd)); e.target.select(); },
            onBlur: (e) => {
              const raw = Math.max(0, Math.round(Number(String(e.target.value).replace(/[^0-9.]/g, '')) || 0));
              const original = (st.components.find((x) => x.headId === hd.id) || {}).amount || 0;
              if (raw === original) edits.delete(st.id + '|' + hd.id); else edits.set(st.id + '|' + hd.id, raw);
              e.target.dataset.dirty = String(raw !== original);
              e.target.value = formatNumber(raw);
              repaintTotals(); dirtyBar();
            },
            onKeyDown: (e) => { if (e.key === 'Enter') e.target.blur(); },
          }))),
          totalCell);
      });

      const foot = h('tr', null,
        h('td', null, 'Total across classes'),
        heads.map((hd) => { const c = h('td', { className: 't-num' }); colTotalCells.set(hd.id, c); return c; }),
        grandCell);

      const table = h('table', { className: 'fin-matrix' },
        h('thead', null, h('tr', null,
          h('th', null, 'Class'),
          heads.map((hd) => h('th', { attrs: { title: `${hd.type} · ${hd.frequency}` } }, hd.name)),
          h('th', null, 'Annual total'))),
        h('tbody', null, body),
        h('tfoot', null, foot));

      repaintTotals();
      return table;
    }

    function paint() {
      host.innerHTML = '';
      const structures = sortBy(db.feeStructures.filter((s) => s.campusId === campusId), 'classLevel', 'asc');

      host.appendChild(kpiRow([
        { label: 'Classes', value: structures.length, icon: 'grid', tone: 'brand' },
        { label: 'Fee heads in use', value: heads.length, icon: 'layers', tone: 'info' },
        { label: 'Lowest annual fee', value: cmoney(structures.length ? Math.min(...structures.map((s) => s.total)) : 0), icon: 'trending-down', tone: 'success' },
        { label: 'Highest annual fee', value: cmoney(structures.length ? Math.max(...structures.map((s) => s.total)) : 0), icon: 'trending-up', tone: 'warning' },
      ]));

      host.appendChild(Card({ className: 'p-0' }, FilterBar({
        filters: [{ id: 'campusId', label: 'Campus', options: campusOptions(), value: campusId, allLabel: 'Pick a campus' }],
        onChange: (id, v) => { if (id === 'campusId' && v !== 'all') { campusId = v; edits.clear(); paint(); } },
        actions: h('div', { className: 'row' }, dirtyLabel, saveBtn),
      })));

      host.appendChild(Callout({ tone: 'info', icon: 'info', title: 'Inline editing' },
        'Click any amount to edit it. Amended cells stay highlighted until you publish, and totals recalculate as you type.'));

      if (!structures.length) {
        host.appendChild(Card({ pad: true }, emptyFor('No structures on this campus', 'Publish a fee structure for this campus and it will appear in the matrix.',
          Button('New structure', { variant: 'primary', icon: 'plus', route: 'fees/structures' }))));
        dirtyBar();
        return;
      }

      const card = SectionCard({
        title: `Fee matrix — ${campusName(campusId)}`,
        subtitle: `${structures.length} classes x ${heads.length} heads · annual amounts in rupees`,
        icon: 'table', flush: true,
        actions: h('div', { className: 'row' },
          Button('Export', { variant: 'ghost', size: 'sm', icon: 'download', onClick: () => {
            const rows = structures.map((st) => {
              const o = { Class: st.className };
              for (const hd of heads) o[hd.name] = (st.components.find((c) => c.headId === hd.id) || {}).amount || 0;
              o.Total = st.total;
              return o;
            });
            download('class-wise-fees.csv', toCsv(rows), 'text/csv;charset=utf-8');
            notify({ title: 'Matrix exported', tone: 'success' });
          } }),
          Button('Bulk uplift', { variant: 'ghost', size: 'sm', icon: 'trending-up', onClick: () => notify({ title: 'Uplift staged', text: 'All tuition amounts raised by 6%. Review before publishing.', tone: 'info' }) })),
      });
      card.querySelector('.card-body').appendChild(h('div', { className: 'fin-scroll' }, buildMatrix(structures)));
      host.appendChild(card);

      host.appendChild(SectionCard({ title: 'Fee load by class', subtitle: 'Annual fee, junior to senior', className: 'chart-card' },
        barChart({
          categories: structures.map((s) => s.className.replace('Class ', '')),
          series: [{ name: 'Annual fee', values: structures.map((s) => s.total) }],
          valueFormat: 'currencyCompact', height: 240,
        })));
      dirtyBar();
    }

    paint();

    mount.appendChild(page({
      title: 'Class-wise Fees',
      subtitle: 'Edit any amount inline — the matrix is the fastest way to review a whole campus',
      route: 'fees/class-wise',
      actions: [
        Button('Fee heads', { variant: 'secondary', icon: 'layers', route: 'fees/heads' }),
        Button('Structures', { variant: 'secondary', icon: 'grid', route: 'fees/structures' }),
      ],
      children: host,
    }));
  },
};

/* =================================================== fees/assignment ====== */

routes['fees/assignment'] = {
  title: 'Student Fee Assignment',
  subtitle: 'Map students to a fee structure and apply concessions in bulk',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const invoiced = new Set(db.invoices.map((i) => i.studentId));
    const students = byCampus(db.students, ctx).filter((s) => s.status === 'Active');
    const rows = students.map((s) => {
      const st = structureFor(s);
      return {
        id: s.id,
        name: s.name,
        admissionNo: s.admissionNo,
        className: s.className,
        section: s.section,
        campusId: s.campusId,
        structureName: st ? st.id + ' · ' + st.className : '—',
        annual: st ? st.total : s.feeTotal,
        installments: st ? st.installments : 4,
        concession: s.rte ? 'RTE — Full Waiver' : s.scholarship ? 'Merit Scholarship (25%)' : '—',
        transportOpted: s.transportOpted ? 'Yes' : 'No',
        hostelOpted: s.hostelOpted ? 'Yes' : 'No',
        assignment: invoiced.has(s.id) ? 'Assigned' : 'Pending',
        feeStatus: s.feeStatus,
      };
    });
    const searchKeys = ['name', 'admissionNo', 'className', 'structureName'];
    const classCounts = sortBy(countBy(rows, 'className'), 'key', 'asc').slice(0, 14);

    const assignModal = (sel) => formPage({
      mode: 'modal', size: 'lg',
      title: `Assign fee structure to ${sel.length} student${sel.length > 1 ? 's' : ''}`,
      subtitle: 'The structure applies from the effective date; already-issued invoices are untouched.',
      submitLabel: 'Assign & raise invoices',
      values: { effective: '2026-04-01', installments: '4' },
      sections: [{
        title: 'Assignment', cols: 2,
        fields: [
          { id: 'structureId', label: 'Fee structure', type: 'combobox', required: true, span: 'full',
            options: db.feeStructures.filter((s) => s.campusId === campusOf(ctx)).map((s) => ({ value: s.id, label: `${s.className} — ${money(s.total)} — ${s.installments} installments` })) },
          { id: 'effective', label: 'Effective from', type: 'date', required: true },
          { id: 'installments', label: 'Override installments', type: 'select', options: ['2', '3', '4', '6', '12'] },
          { id: 'concession', label: 'Apply concession', type: 'select', options: db.discounts.filter((d) => d.active).map((d) => ({ value: d.id, label: `${d.name} (${d.type === 'Percentage' ? d.value + '%' : money(d.value)})` })) },
          { id: 'transport', label: 'Include transport fee', type: 'switch', switchLabel: 'Add route fare where opted' },
          { id: 'raise', label: 'Raise invoices now', type: 'switch', switchLabel: 'Generate Q1-Q4 invoices immediately', span: 'full', description: 'Otherwise invoices are raised by the nightly job 10 days before each due date.' },
          { id: 'note', label: 'Note for the audit trail', type: 'textarea', span: 'full', placeholder: 'e.g. Mid-year structure correction approved by the Principal' },
        ],
      }],
      onSubmit: () => notify({ title: `${sel.length} students assigned`, text: 'Invoices queued for generation.', tone: 'success' }),
    });

    mount.appendChild(listPage({
      title: 'Student Fee Assignment',
      subtitle: `${num(rows.length)} active students · ${campusName(campusOf(ctx))} · ${AY_LABEL}`,
      route: 'fees/assignment',
      actions: [
        Button('Import mapping', { variant: 'secondary', icon: 'upload', onClick: mockAction('Import assignment sheet') }),
        Button('Bulk assign', { variant: 'primary', icon: 'user-check', onClick: () => assignModal(rows.filter((r) => r.assignment === 'Pending').slice(0, 50)) }),
      ],
      kpis: [
        { label: 'Students', value: num(rows.length), icon: 'graduation-cap', tone: 'brand' },
        { label: 'Assigned', value: num(rows.filter((r) => r.assignment === 'Assigned').length), icon: 'check-circle', tone: 'success', footer: 'Invoices already raised' },
        { label: 'Pending assignment', value: num(rows.filter((r) => r.assignment === 'Pending').length), icon: 'clock', tone: 'warning', footer: 'Mostly mid-session admissions' },
        { label: 'On concession', value: num(rows.filter((r) => r.concession !== '—').length), icon: 'gift', tone: 'info', footer: 'RTE, merit and staff wards' },
      ],
      chart: barChart({
        categories: classCounts.map((r) => r.key.replace('Class ', '')),
        series: [{ name: 'Students', values: classCounts.map((r) => r.value) }],
        height: 220,
      }),
      chartTitle: 'Students by class on this campus',
      tabs: [
        { id: 'all', label: 'All', count: rows.length },
        { id: 'Pending', label: 'Pending', count: rows.filter((r) => r.assignment === 'Pending').length },
        { id: 'Assigned', label: 'Assigned', count: rows.filter((r) => r.assignment === 'Assigned').length },
      ],
      activeTab: 'all',
      onTabChange: tabRefresh(mount, rows, (r, id) => r.assignment === id),
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Name or admission no...', width: '280px' },
        { id: 'className', label: 'Class', options: classOptions() },
        { id: 'assignment', label: 'Assignment', options: ['Assigned', 'Pending'] },
        // db.students[].feeStatus only ever takes these three values; the old
        // list offered 'Overdue' and 'Pending', which matched nothing.
        { id: 'feeStatus', label: 'Fee status', options: ['Paid', 'Partial', 'Unpaid'] },
      ],
      onFilter: (id, value, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys })),
      columns: [
        studentCol('name', (r) => `${r.admissionNo} · ${r.className}-${r.section}`),
        { key: 'className', label: 'Class', width: 110, filter: true },
        { key: 'structureName', label: 'Structure', width: 190 },
        moneyCol('annual', 'Annual fee', { width: 140 }),
        { key: 'installments', label: 'Installments', width: 110, align: 'right', numeric: true },
        { key: 'concession', label: 'Concession', width: 190, filter: true, render: (r) => (r.concession === '—' ? h('span', { className: 't-muted' }, '—') : Badge(r.concession, { tone: 'info' })) },
        { key: 'transportOpted', label: 'Transport', width: 100, filter: true },
        { key: 'hostelOpted', label: 'Hostel', width: 90, filter: true, hidden: true },
        { key: 'assignment', label: 'Assignment', width: 130, filter: true, render: (r) => Badge(r.assignment, { tone: r.assignment === 'Assigned' ? 'success' : 'warning' }) },
        statusCol('feeStatus', 'Fee status', 120),
      ],
      rows,
      selectable: true,
      footerAggregates: true,
      searchKeys,
      pageSize: 50,
      bulkActions: [
        { label: 'Assign structure', icon: 'user-check', onClick: (sel) => assignModal(sel) },
        { label: 'Apply concession', icon: 'gift', onClick: (sel) => notify({ title: `Concession applied to ${sel.length} students`, tone: 'success' }) },
        { label: 'Raise invoices', icon: 'receipt', onClick: (sel) => notify({ title: `${sel.length} invoice sets queued`, text: 'Q1-Q4 invoices will be generated tonight.', tone: 'info' }) },
        { label: 'Remove assignment', icon: 'x-circle', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Remove assignment for ${sel.length} students?`, text: 'Unpaid invoices will be cancelled and the students will show as unassigned.', tone: 'danger', confirmLabel: 'Remove' }).then((ok) => ok && notify({ title: 'Assignment removed', tone: 'warning' })) },
      ],
      rowActions: (row) => [
        { label: 'Open student 360', icon: 'eye', route: `students/profile/${row.id}` },
        { label: 'Collect fee', icon: 'credit-card', route: `fees/collection/${row.id}` },
        { label: 'Change structure', icon: 'edit', onClick: () => assignModal([row]) },
        { separator: true },
        { label: 'View invoices', icon: 'receipt', route: 'fees/receipts' },
      ],
      onRowClick: (row) => navigate(`fees/collection/${row.id}`),
      tableTitle: 'Assignment register',
      exportName: 'fee-assignment',
      emptyState: emptyFor('No students match these filters', 'Clear a filter or switch campus to see students.'),
    }));
  },
};

/* ================================================= fees/installments ====== */

routes['fees/installments'] = {
  title: 'Installment Plans',
  subtitle: 'Design how an annual fee is split across the year',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const structures = sortBy(byCampus(db.feeStructures, ctx), 'classLevel', 'asc');
    if (!structures.length) {
      mount.appendChild(page({ title: 'Installment Plans', route: 'fees/installments', children: Card({ pad: true }, emptyFor('No structures on this campus', 'Publish a fee structure first, then design its installment plan.', Button('Fee structures', { variant: 'primary', route: 'fees/structures' }))) }));
      return;
    }

    let current = structures[0];
    let count = current.installments;
    const MONTHS = ['2026-04-10', '2026-05-10', '2026-06-10', '2026-07-10', '2026-08-10', '2026-09-10',
      '2026-10-10', '2026-11-10', '2026-12-10', '2027-01-10', '2027-02-10', '2027-03-10'];
    let plan = [];

    const buildPlan = () => {
      const step = Math.floor(12 / count);
      plan = Array.from({ length: count }, (_, i) => ({
        no: i + 1,
        label: `Installment ${i + 1}`,
        share: Math.round((100 / count) * 100) / 100,
        dueDate: MONTHS[Math.min(11, i * step)],
        amount: Math.round(current.total / count),
        graceDays: 7,
        lateFeePerDay: current.lateFeePerDay,
      }));
      const drift = current.total - plan.reduce((a, p) => a + p.amount, 0);
      if (plan.length) plan[plan.length - 1].amount += drift;
    };
    buildPlan();

    const host = h('div', { className: 'stack' });

    function planTable() {
      const totalCell = h('td', { className: 't-num t-semibold' });
      const shareCell = h('td', { className: 't-num t-semibold' });
      const sync = () => {
        totalCell.textContent = money(plan.reduce((a, p) => a + p.amount, 0));
        shareCell.textContent = formatPercent(plan.reduce((a, p) => a + p.share, 0));
      };
      const body = plan.map((p) => h('tr', null,
        h('td', null, h('div', { className: 'stack-1' },
          h('span', { className: 't-medium' }, p.label),
          h('span', { className: 't-xs t-muted' }, `Grace ${p.graceDays} days · late fee ${money(p.lateFeePerDay)}/day`))),
        h('td', null, h('input', {
          className: 'fin-cell', type: 'text', value: String(p.share),
          attrs: { 'aria-label': `Share for ${p.label}` },
          onBlur: (e) => {
            const v = Math.max(0, Math.min(100, Number(String(e.target.value).replace(/[^0-9.]/g, '')) || 0));
            p.share = v; p.amount = Math.round((current.total * v) / 100);
            e.target.value = String(v); e.target.dataset.dirty = 'true';
            const row = e.target.closest('tr');
            const amtCell = row && row.querySelector('[data-amt]');
            if (amtCell) amtCell.textContent = money(p.amount);
            sync();
          },
        })),
        h('td', { className: 't-num', dataset: { amt: '1' } }, money(p.amount)),
        h('td', null, h('input', {
          className: 'fin-cell', type: 'date', value: p.dueDate, style: { width: '150px' },
          attrs: { 'aria-label': `Due date for ${p.label}` },
          onChange: (e) => { p.dueDate = e.target.value; e.target.dataset.dirty = 'true'; },
        })),
        h('td', { className: 't-num' }, formatDate(p.dueDate, 'medium'))));

      const table = h('table', { className: 'fin-matrix' },
        h('thead', null, h('tr', null,
          h('th', null, 'Installment'), h('th', null, 'Share %'), h('th', null, 'Amount'),
          h('th', null, 'Due date'), h('th', null, 'Reads as'))),
        h('tbody', null, body),
        h('tfoot', null, h('tr', null, h('td', null, 'Total'), shareCell, totalCell, h('td', null, ''), h('td', null, ''))));
      sync();
      return table;
    }

    function paint() {
      host.innerHTML = '';

      host.appendChild(Card({ className: 'p-0' }, FilterBar({
        filters: [
          { id: 'structure', label: 'Structure', width: '300px',
            options: structures.map((s) => ({ value: s.id, label: `${s.className} — ${money(s.total)}` })), value: current.id, allLabel: 'Pick a structure' },
          { id: 'count', label: 'Installments', options: ['2', '3', '4', '6', '12'], value: String(count) },
        ],
        onChange: (id, v) => {
          if (id === 'structure' && v !== 'all') { current = byId(structures, v) || current; count = current.installments; buildPlan(); paint(); }
          if (id === 'count' && v !== 'all') { count = Number(v); buildPlan(); paint(); }
        },
        actions: h('div', { className: 'row' },
          Button('Reset', { variant: 'ghost', size: 'sm', icon: 'refresh', onClick: () => { buildPlan(); paint(); notify({ title: 'Plan reset to equal splits', tone: 'info' }); } }),
          Button('Save plan', { variant: 'primary', size: 'sm', icon: 'check', onClick: () => notify({ title: 'Installment plan saved', text: `${current.className} · ${count} installments`, tone: 'success' }) })),
      })));

      host.appendChild(kpiRow([
        { label: 'Annual fee', value: money(current.total), icon: 'banknote', tone: 'brand', footer: current.className },
        { label: 'Installments', value: count, icon: 'calendar', tone: 'info', footer: `First due ${formatDate(plan[0].dueDate)}` },
        { label: 'Per installment', value: money(Math.round(current.total / count)), icon: 'receipt', tone: 'success' },
        { label: 'Late fee', value: `${money(current.lateFeePerDay)}/day`, icon: 'timer', tone: 'warning', footer: `Capped at ${money(3000)}` },
      ]));

      const designer = SectionCard({
        title: 'Installment designer',
        subtitle: 'Edit the share or the due date — amounts recalculate against the annual fee',
        icon: 'sliders', flush: true,
      });
      designer.querySelector('.card-body').appendChild(h('div', { className: 'fin-scroll' }, planTable()));
      host.appendChild(designer);

      host.appendChild(h('div', { className: 'widget-grid' },
        h('div', { className: 'span-7' }, SectionCard({ title: 'Cash-flow profile', subtitle: 'Expected collection by due month', className: 'chart-card' },
          barChart({
            categories: plan.map((p) => formatDate(p.dueDate, 'monthYear')),
            series: [{ name: 'Due', values: plan.map((p) => p.amount) }],
            valueFormat: 'currencyCompact', showValues: true, height: 250,
          }))),
        h('div', { className: 'span-5' }, SectionCard({ title: 'Share of annual fee', className: 'chart-card' },
          donutChart({
            data: plan.map((p) => ({ key: p.label, value: p.amount })),
            height: 250, valueFormat: 'currencyCompact',
            centerValue: money(current.total), centerLabel: 'Annual',
          })))));

      host.appendChild(SectionCard({ title: 'Plans in use', subtitle: 'How many classes use each split across the campus', icon: 'layers' },
        DataTable({
          columns: [
            { key: 'key', label: 'Installments per year', width: 200 },
            { key: 'value', label: 'Classes', align: 'right', numeric: true, width: 120 },
            { key: 'share', label: 'Share', align: 'right', numeric: true, width: 120, render: (r) => formatPercent((r.value / structures.length) * 100), value: (r) => (r.value / structures.length) * 100 },
            { key: 'bar', label: 'Distribution', sortable: false, render: (r) => ProgressBar((r.value / structures.length) * 100, { tone: 'brand', size: 'sm' }) },
          ],
          rows: countBy(structures, 'installments'),
          paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
        })));
    }

    paint();

    mount.appendChild(page({
      title: 'Installment Plans',
      subtitle: 'Split the annual fee into installments, set due dates and grace periods',
      route: 'fees/installments',
      actions: [
        Button('Fee structures', { variant: 'secondary', icon: 'grid', route: 'fees/structures' }),
        Button('Publish to parents', { variant: 'primary', icon: 'send', onClick: () => ConfirmDialog({ title: 'Publish installment plan?', text: 'Parents will see the revised due dates on the portal and receive an SMS.', confirmLabel: 'Publish', tone: 'brand', icon: 'send' }).then((ok) => ok && notify({ title: 'Plan published', text: 'SMS queued to 2,286 parents.', tone: 'success' })) }),
      ],
      children: host,
    }));
  },
};

/* ============================================ fees/collection (flagship) == */

const PAY_MODES = [
  { id: 'Cash', label: 'Cash', icon: 'banknote' },
  { id: 'Cheque', label: 'Cheque', icon: 'file-text' },
  { id: 'DD', label: 'Demand Draft', icon: 'building-columns' },
  { id: 'Card', label: 'Card', icon: 'credit-card' },
  { id: 'UPI', label: 'UPI', icon: 'qr' },
  { id: 'Net Banking', label: 'Net Banking', icon: 'globe' },
];

const BANK_NAMES = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank', 'Yes Bank'];

/** The printable A4 receipt. */
function receiptNode(data) {
  const c = byId(db.campuses, data.student.campusId) || db.campuses[0];
  return h('div', { className: 'fin-receipt' },
    h('div', { className: 'fin-rc-head' },
      h('div', { className: 'fin-rc-crest', html: icon('graduation-cap', 28) }),
      h('div', { className: 'flex-1' },
        h('div', { className: 'fin-rc-school' }, 'Springdale International School'),
        h('div', { className: 't-sm t-secondary' }, c.name),
        h('div', { className: 't-xs t-muted' }, `${c.address || 'Sector 44'}, ${c.city} ${c.pincode || ''} · ${c.phone || '+91 124 400 1200'}`),
        h('div', { className: 't-xs t-muted' }, `Affiliated to ${c.board || 'CBSE'} · Affiliation No. 2130${c.code || 'MAIN'} · ${c.email || 'accounts@springdale.edu.in'}`)),
      h('div', { className: 't-right' },
        h('div', { className: 't-eyebrow' }, 'Fee Receipt'),
        h('div', { className: 't-lg t-semibold t-mono' }, data.receiptNo),
        h('div', { className: 't-xs t-muted' }, formatDate(data.date, 'medium')),
        h('div', { className: 't-xs t-muted' }, `Academic year ${AY_LABEL}`))),

    h('div', { className: 'fin-rc-strip' },
      [['Student', data.student.name], ['Admission no', data.student.admissionNo],
        ['Class & section', `${data.student.className} — ${data.student.section}`], ['Roll no', String(data.student.rollNo)],
        ['Father / Guardian', data.student.fatherName || data.student.guardianName], ['Contact', data.student.phone]]
        .map(([k, v]) => h('div', null,
          h('div', { className: 't-xs t-muted' }, k),
          h('div', { className: 't-sm t-medium' }, v || '—')))),

    h('table', { className: 'fin-rc-table' },
      h('thead', null, h('tr', null,
        h('th', { style: { width: '46px' } }, '#'),
        h('th', null, 'Particulars'),
        h('th', null, 'Period'),
        h('th', { className: 'num' }, 'Amount'))),
      h('tbody', null, data.lines.map((l, i) => h('tr', null,
        h('td', null, String(i + 1)),
        h('td', null, l.name),
        h('td', null, l.period || data.period || '—'),
        h('td', { className: 'num' }, money(l.amount))))),
      h('tfoot', null,
        data.lateFee > 0 ? h('tr', null, h('td', null, ''), h('td', { attrs: { colspan: '2' } }, 'Late fee'), h('td', { className: 'num' }, money(data.lateFee))) : null,
        data.discount > 0 ? h('tr', null, h('td', null, ''), h('td', { attrs: { colspan: '2' } }, 'Less: discount'), h('td', { className: 'num' }, '- ' + money(data.discount))) : null,
        data.concession > 0 ? h('tr', null, h('td', null, ''), h('td', { attrs: { colspan: '2' } }, `Less: concession${data.concessionName ? ' — ' + data.concessionName : ''}`), h('td', { className: 'num' }, '- ' + money(data.concession))) : null,
        h('tr', null, h('td', null, ''), h('td', { attrs: { colspan: '2' } }, 'Total received'), h('td', { className: 'num' }, money(data.paid))))),

    h('div', { className: 'mt-3 t-sm' },
      h('span', { className: 't-muted' }, 'Amount in words: '),
      h('span', { className: 't-semibold' }, amountInWords(data.paid))),

    h('div', { className: 'mt-4' },
      DescriptionList([
        ['Payment mode', data.mode],
        ['Reference', data.reference || '—'],
        ['Bank / Instrument', data.bank || '—'],
        ['Received by', data.collectedBy],
        ['Balance after this receipt', money(data.balanceAfter)],
        ['Next due date', data.nextDue ? formatDate(data.nextDue) : 'No further dues this year'],
      ], { cols: 2 })),

    h('div', { className: 'fin-rc-sign' },
      h('div', { className: 'stack-1' },
        h('div', { className: 'fin-rc-stamp' }, data.paid > 0 ? 'Paid' : 'Pending'),
        h('div', { className: 't-xs t-muted mt-2' }, 'This is a computer-generated receipt.'),
        h('div', { className: 't-xs t-muted' }, 'Fees once paid are non-refundable except as per school policy.')),
      h('div', { className: 'fin-rc-sign-line t-sm' }, 'Authorised Signatory')),

    h('div', { className: 't-xs t-muted mt-4 t-center' },
      `Annual fee ${money(data.student.feeTotal)} · Paid till date ${money(data.student.feePaid + data.paid)} · Generated ${formatDateTime(TODAY + 'T09:30')}`));
}

function openReceipt(data) {
  const node = receiptNode(data);
  return Modal({
    title: 'Fee receipt ' + data.receiptNo,
    subtitle: `${data.student.name} · ${money(data.paid)} received by ${data.mode}`,
    size: 'xl', icon: 'receipt', tone: 'success',
    body: node,
    actions: (close) => frag(
      Button('Close', { variant: 'secondary', onClick: close }),
      Button('Email to parent', { variant: 'ghost', icon: 'mail', onClick: () => notify({ title: 'Receipt emailed', text: data.student.email, tone: 'success' }) }),
      Button('Download', { variant: 'secondary', icon: 'download', onClick: () => { download(`${data.receiptNo.replace(/\//g, '-')}.txt`, node.innerText, 'text/plain'); notify({ title: 'Receipt downloaded', tone: 'success' }); } }),
      Button('Print receipt', { variant: 'primary', icon: 'print', onClick: () => printDocument(node, 'Fee Receipt ' + data.receiptNo) })),
  });
}

routes['fees/collection'] = {
  title: 'Collect Fee',
  subtitle: 'Search a student, pick the installments to settle and issue a printed receipt',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const pool = byCampus(db.students, ctx).filter((s) => s.status === 'Active');
    let student = ctx.param ? (byId(db.students, ctx.param) || null) : null;
    let term = '';

    const model = {
      selected: new Set(),
      discountId: 'none',
      concession: 0,
      waiveLate: false,
      touched: false,
      mode: 'Cash',
      fields: {},
      payDate: TODAY,
      remarks: '',
    };

    const host = h('div', { className: 'stack' });
    const user = store.get('currentUser');
    const collector = (user && user.name) || 'Accounts counter';

    /* ------------------------------------------------------------ picker */
    function pickerCard() {
      const resultHost = h('div', { className: 'fin-picker-list stack-1' });
      const paintResults = () => {
        resultHost.innerHTML = '';
        const matches = (term
          ? search(pool, term, ['name', 'admissionNo', 'rollNo', 'className', 'phone'])
          : sortBy(pool.filter((s) => s.feeDue > 0), 'feeDue', 'desc')).slice(0, 10);
        if (!matches.length) {
          resultHost.appendChild(EmptyState({ icon: 'search', title: 'No student found', text: `Nothing matches "${term}". Try an admission number such as ${pool[0] ? pool[0].admissionNo : 'ADM2026001'}.` }));
          return;
        }
        for (const s of matches) {
          resultHost.appendChild(h('button', {
            className: 'fin-picker-row', type: 'button',
            dataset: { active: String(!!(student && student.id === s.id)) },
            onClick: () => { student = s; model.touched = false; model.selected.clear(); paint(); },
          },
            Avatar(s.name, { size: 'sm' }),
            h('div', { className: 'flex-1 min-0' },
              h('div', { className: 't-medium t-truncate' }, s.name),
              h('div', { className: 't-xs t-muted' }, `${s.admissionNo} · ${s.className}-${s.section} · Roll ${s.rollNo}`)),
            h('div', { className: 't-right' },
              h('div', { className: 't-sm t-semibold t-num' }, money(s.feeDue)),
              h('div', { className: 't-xs t-muted' }, s.feeDue > 0 ? 'due' : 'cleared')),
            Badge(s.feeStatus)));
        }
      };
      paintResults();

      return SectionCard({
        title: 'Find a student',
        subtitle: 'Search by name, admission number, roll number or parent phone',
        icon: 'search',
        actions: Button('Scan ID card', { variant: 'ghost', size: 'sm', icon: 'scan', onClick: mockAction('Scan student ID card') }),
      },
        h('div', { className: 'stack-3' },
          SearchInput({
            placeholder: 'e.g. Aarav Sharma, ADM2026114 or 98xxxxxx21',
            value: term, width: '100%',
            onInput: (v) => { term = v; paintResults(); },
          }),
          h('div', { className: 't-eyebrow' }, term ? 'Search results' : 'Highest outstanding on this campus'),
          resultHost));
    }

    /* ------------------------------------------------------------- dues */
    function duesModel() {
      const invs = invoicesFor(student.id);
      const open = invs.filter((i) => i.balance > 0);
      if (!model.selected.size && open.length && !model.touched) model.selected.add(open[0].id);
      return { invs, open };
    }

    function totalsFor(open) {
      const chosen = open.filter((i) => model.selected.has(i.id));
      const gross = chosen.reduce((a, i) => a + i.balance, 0);
      const structuralDiscount = chosen.reduce((a, i) => a + i.discount, 0);
      const lateFee = model.waiveLate ? 0 : chosen.reduce((a, i) => a + i.lateFee, 0);
      const d = model.discountId !== 'none' ? byId(db.discounts, model.discountId) : null;
      const schemeConcession = d ? (d.type === 'Percentage' ? Math.round((gross * d.value) / 100) : Math.min(gross, d.value)) : 0;
      const concession = Math.min(gross, schemeConcession + (Number(model.concession) || 0));
      const payable = Math.max(0, gross + lateFee - structuralDiscount - concession);
      return { chosen, gross, structuralDiscount, lateFee, concession, schemeName: d ? d.name : '', payable };
    }

    function duesCard(open, onChange) {
      if (!open.length) {
        return SectionCard({ title: 'Outstanding installments', icon: 'receipt' },
          EmptyState({ icon: 'check-circle', tone: 'success', title: 'All dues cleared', text: `${student.name} has no outstanding installments for ${AY_LABEL}.`, action: Button('View receipts', { variant: 'secondary', icon: 'receipt', route: 'fees/receipts' }) }));
      }
      const rows = open.map((i) => h('tr', null,
        h('td', { style: { textAlign: 'left' } }, Checkbox('', {
          checked: model.selected.has(i.id),
          onChange: (v) => { model.touched = true; if (v) model.selected.add(i.id); else model.selected.delete(i.id); onChange(); },
        })),
        h('td', { style: { textAlign: 'left' } }, h('div', { className: 'stack-1' },
          h('span', { className: 't-medium' }, `${i.quarter} · ${i.invoiceNo}`),
          h('span', { className: 't-xs t-muted' }, i.period))),
        h('td', { style: { textAlign: 'left' } }, h('div', { className: 'stack-1' },
          h('span', null, formatDate(i.dueDate)),
          i.overdueDays > 0 ? h('span', { className: 't-xs t-danger' }, `${i.overdueDays} days overdue`) : h('span', { className: 't-xs t-muted' }, 'within term'))),
        h('td', null, money(i.amount)),
        h('td', null, i.discount ? '- ' + money(i.discount) : '—'),
        h('td', null, i.lateFee ? money(i.lateFee) : '—'),
        h('td', null, money(i.paid)),
        h('td', { className: 't-semibold' }, money(i.balance)),
        h('td', { style: { textAlign: 'left' } }, Badge(i.status))));

      const table = h('table', { className: 'fin-matrix' },
        h('thead', null, h('tr', null,
          h('th', { style: { textAlign: 'left', width: '44px' } }, ''),
          h('th', { style: { textAlign: 'left' } }, 'Installment'),
          h('th', { style: { textAlign: 'left' } }, 'Due'),
          h('th', null, 'Amount'), h('th', null, 'Discount'), h('th', null, 'Late fee'),
          h('th', null, 'Paid'), h('th', null, 'Balance'),
          h('th', { style: { textAlign: 'left' } }, 'Status'))),
        h('tbody', null, rows));

      const card = SectionCard({
        title: 'Outstanding installments',
        subtitle: `${open.length} open · tick the installments this receipt settles`,
        icon: 'receipt', flush: true,
        actions: h('div', { className: 'row' },
          Button('Select all', { variant: 'ghost', size: 'sm', onClick: () => { open.forEach((i) => model.selected.add(i.id)); paint(); } }),
          Button('Clear', { variant: 'ghost', size: 'sm', onClick: () => { model.touched = true; model.selected.clear(); paint(); } })),
      });
      card.querySelector('.card-body').appendChild(h('div', { className: 'fin-scroll' }, table));
      return card;
    }

    function headCard(totals) {
      const lines = totals.gross > 0 ? headSplit(student, totals.gross) : [];
      return SectionCard({ title: 'Head-wise break-up', subtitle: 'How the selected amount is apportioned across fee heads', icon: 'layers' },
        lines.length ? h('div', { className: 'stack-2' },
          lines.map((l) => MetricRow(l.name, money(l.amount), l.frequency || '')),
          Divider(),
          MetricRow(h('span', { className: 't-semibold' }, 'Selected total'), h('span', { className: 't-semibold' }, money(totals.gross))))
          : EmptyState({ icon: 'layers', title: 'Nothing selected', text: 'Tick at least one installment above to see the head-wise split.' }));
    }

    /* ------------------------------------------------------- adjustments */
    function adjustCard(rerender) {
      return SectionCard({ title: 'Concessions & adjustments', icon: 'gift' },
        FormGrid({ cols: 3 },
          Field({ label: 'Concession scheme', hint: 'Auto-applied schemes are pre-selected' },
            Select({
              options: [{ value: 'none', label: 'No scheme' }].concat(db.discounts.filter((d) => d.active).map((d) => ({ value: d.id, label: `${d.name} · ${d.type === 'Percentage' ? d.value + '%' : money(d.value)}` }))),
              value: model.discountId,
              onChange: (v) => { model.discountId = v; rerender(); },
            })),
          Field({ label: 'Additional concession', hint: 'Above 10,000 needs principal approval' },
            Input({ type: 'number', numeric: true, prefix: '₹', value: String(model.concession || ''), placeholder: '0', onChange: (v) => { model.concession = Number(v) || 0; rerender(); } })),
          Field({ label: 'Late fee' },
            Switch('Waive late fee for this receipt', { checked: model.waiveLate, onChange: (v) => { model.waiveLate = v; rerender(); } })),
          Field({ label: 'Remarks', className: 'col-span-full', hint: 'Printed on the receipt footer and stored in the audit trail' },
            Textarea({ value: model.remarks, rows: 2, placeholder: 'e.g. Part payment agreed with the parent, balance by 30 Sep', onInput: (v) => { model.remarks = v; } }))));
    }

    /* ------------------------------------------------------ payment mode */
    function modeCard(rerender) {
      const f = model.fields;
      const set = (k) => (v) => { f[k] = v; };
      let extra;
      if (model.mode === 'Cash') {
        extra = [
          Field({ label: 'Cash tendered' }, Input({ type: 'number', numeric: true, prefix: '₹', placeholder: '0', onInput: set('tendered') })),
          Field({ label: 'Change returned' }, Input({ type: 'number', numeric: true, prefix: '₹', placeholder: '0', onInput: set('change') })),
          Field({ label: 'Counter' }, Select({ options: ['Counter 1 — Main gate', 'Counter 2 — Admin block', 'Counter 3 — Junior wing'], value: 'Counter 1 — Main gate', onChange: set('counter') })),
        ];
      } else if (model.mode === 'Cheque' || model.mode === 'DD') {
        extra = [
          Field({ label: model.mode === 'DD' ? 'DD number' : 'Cheque number', required: true }, Input({ placeholder: '6 digit instrument number', onInput: set('instrument') })),
          Field({ label: 'Drawn on bank', required: true }, Combobox({ options: BANK_NAMES, placeholder: 'Select bank', onChange: set('bank') })),
          Field({ label: 'Branch' }, Input({ placeholder: 'e.g. Sector 44, Gurugram', onInput: set('branch') })),
          Field({ label: 'Instrument date', required: true }, DatePicker({ value: TODAY, onChange: set('instrumentDate') })),
          Field({ label: 'Deposit into' }, Select({ options: db.bankAccounts.map((b) => ({ value: b.id, label: `${b.name} · ${b.accountMasked}` })), onChange: set('depositTo') })),
          Field({ label: 'Clearing', hint: 'Receipt is provisional until the instrument clears' }, Switch('Mark as realised immediately', { onChange: set('realised') })),
        ];
      } else if (model.mode === 'Card') {
        extra = [
          Field({ label: 'Card type', required: true }, Select({ options: ['Credit Card', 'Debit Card'], value: 'Credit Card', onChange: set('cardType') })),
          Field({ label: 'Card network' }, Select({ options: ['Visa', 'Mastercard', 'RuPay', 'American Express'], onChange: set('network') })),
          Field({ label: 'Last 4 digits', required: true }, Input({ maxLength: 4, placeholder: '4821', onInput: set('last4') })),
          Field({ label: 'Approval code', required: true }, Input({ placeholder: 'e.g. 004512', onInput: set('auth') })),
          Field({ label: 'Terminal / POS id' }, Input({ placeholder: 'POS-ADM-02', onInput: set('terminal') })),
          Field({ label: 'MDR charged', hint: 'Borne by the school, not the parent' }, Input({ type: 'number', numeric: true, prefix: '₹', placeholder: '0', onInput: set('mdr') })),
        ];
      } else if (model.mode === 'UPI') {
        extra = [
          Field({ label: 'UPI transaction id', required: true }, Input({ placeholder: '12 digit UTR / RRN', onInput: set('utr') })),
          Field({ label: 'Payer VPA' }, Input({ placeholder: 'parent@okhdfcbank', onInput: set('vpa') })),
          Field({ label: 'UPI app' }, Select({ options: ['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay', 'Other'], onChange: set('app') })),
          Field({ label: 'Collected on' }, Select({ options: db.bankAccounts.map((b) => ({ value: b.id, label: b.name })), onChange: set('depositTo') })),
        ];
      } else {
        extra = [
          Field({ label: 'Bank', required: true }, Combobox({ options: BANK_NAMES, placeholder: 'Select bank', onChange: set('bank') })),
          Field({ label: 'Reference / UTR', required: true }, Input({ placeholder: 'NEFT or IMPS reference', onInput: set('utr') })),
          Field({ label: 'Value date' }, DatePicker({ value: TODAY, onChange: set('valueDate') })),
          Field({ label: 'Credited to' }, Select({ options: db.bankAccounts.map((b) => ({ value: b.id, label: `${b.name} · ${b.accountMasked}` })), onChange: set('depositTo') })),
        ];
      }

      return SectionCard({ title: 'Payment mode', icon: 'credit-card', subtitle: 'Mode-specific details print on the receipt and drive bank reconciliation' },
        h('div', { className: 'stack-4' },
          SegmentedControl(PAY_MODES.map((m) => ({ id: m.id, label: m.label, icon: m.icon })), (v) => { model.mode = v; model.fields = {}; rerender(); }, { active: model.mode }),
          h('div', { className: 'fin-mode-fields' }, extra),
          h('div', { className: 'fin-mode-fields' },
            Field({ label: 'Payment date' }, DatePicker({ value: model.payDate, onChange: (v) => { model.payDate = v; } })),
            Field({ label: 'Collected by' }, Input({ value: collector, readOnly: true })),
            Field({ label: 'Receipt series' }, Select({ options: ['RCP/26 — Main counter', 'RCP/26/ONL — Online', 'RCP/26/HST — Hostel'], value: 'RCP/26 — Main counter' })))));
    }

    /* --------------------------------------------------------- summary */
    function summaryCard(totals, open) {
      const line = (label, value) => h('div', { className: 'fin-sum-line' },
        h('span', { className: 't-sm t-muted' }, label), h('span', { className: 't-sm' }, value));

      const collect = Button(`Collect ${money(totals.payable)}`, {
        variant: 'primary', size: 'lg', block: true, icon: 'check-circle',
        onClick: () => {
          if (!totals.chosen.length) { notify({ title: 'Nothing selected', text: 'Tick at least one installment to collect.', tone: 'warning' }); return; }
          if ((model.mode === 'Cheque' || model.mode === 'DD') && !model.fields.instrument) { notify({ title: 'Instrument number required', text: `Enter the ${model.mode} number before issuing the receipt.`, tone: 'warning' }); return; }
          if (model.mode === 'Card' && !model.fields.auth) { notify({ title: 'Approval code required', text: 'Enter the POS approval code.', tone: 'warning' }); return; }
          if (model.mode === 'UPI' && !model.fields.utr) { notify({ title: 'UPI reference required', text: 'Enter the UTR / RRN from the payment app.', tone: 'warning' }); return; }
          if (model.mode === 'Net Banking' && !model.fields.utr) { notify({ title: 'Reference required', text: 'Enter the NEFT / IMPS reference.', tone: 'warning' }); return; }

          const seq = 900000 + (hashOf(student.id + model.payDate) % 90000);
          const nextOpen = open.find((i) => !model.selected.has(i.id));
          const lines = headSplit(student, totals.gross).map((l) => ({ ...l, period: totals.chosen.map((c) => c.quarter).join(', ') }));
          const data = {
            student,
            receiptNo: `RCP/26/${seq}`,
            date: model.payDate,
            period: totals.chosen.map((c) => `${c.quarter} ${c.period}`).join(' · '),
            lines,
            lateFee: totals.lateFee,
            discount: totals.structuralDiscount,
            concession: totals.concession,
            concessionName: totals.schemeName,
            paid: totals.payable,
            mode: model.mode,
            reference: model.fields.utr || model.fields.instrument || model.fields.auth || (model.mode === 'Cash' ? 'Cash counter' : '—'),
            bank: model.fields.bank || (model.mode === 'Cash' ? 'Cash in hand' : '—'),
            collectedBy: collector,
            balanceAfter: Math.max(0, student.feeDue - totals.payable),
            nextDue: nextOpen ? nextOpen.dueDate : null,
          };
          notify({ title: 'Payment recorded', text: `${money(totals.payable)} received from ${student.name}`, tone: 'success', icon: 'check-circle' });
          openReceipt(data);
        },
      });

      return h('div', { className: 'fin-summary-rail stack-3' },
        SectionCard({ title: 'Receipt summary', icon: 'calculator' },
          h('div', { className: 'stack-2' },
            line('Installments selected', String(totals.chosen.length)),
            line('Gross amount', money(totals.gross)),
            line('Structural discount', totals.structuralDiscount ? '- ' + money(totals.structuralDiscount) : '—'),
            line('Concession' + (totals.schemeName ? ` · ${totals.schemeName}` : ''), totals.concession ? '- ' + money(totals.concession) : '—'),
            line('Late fee', model.waiveLate ? 'Waived' : (totals.lateFee ? money(totals.lateFee) : '—')),
            h('div', { className: 'fin-sum-line fin-sum-total' }, h('span', null, 'Payable now'), h('span', { className: 't-num' }, money(totals.payable))),
            h('div', { className: 't-xs t-muted' }, amountInWords(totals.payable)),
            h('div', { className: 'stack-2 mt-3' },
              collect,
              Button('Save as draft', { variant: 'ghost', block: true, icon: 'clipboard', onClick: () => notify({ title: 'Draft saved', text: 'Resume it from the receipts screen.', tone: 'info' }) })))),

        SectionCard({ title: 'Year to date', icon: 'chart-line' },
          h('div', { className: 'stack-2' },
            MetricRow('Total billed', money(student.feeTotal)),
            MetricRow('Paid so far', money(student.feePaid)),
            MetricRow('Outstanding', money(student.feeDue)),
            ProgressBar((student.feePaid / Math.max(1, student.feeTotal)) * 100, { tone: student.feeDue > 0 ? 'warning' : 'success', label: 'Collected', showValue: true }))),

        SectionCard({ title: 'Recent receipts', icon: 'history', actions: Button('All', { variant: 'ghost', size: 'sm', route: 'fees/receipts' }) },
          (() => {
            const pays = paymentsFor(student.id).slice(0, 5);
            return pays.length
              ? Timeline(pays.map((p) => ({ title: money(p.amount) + ' · ' + p.mode, meta: formatDate(p.date), text: `${p.receiptNo} · ${p.status}`, icon: 'receipt', tone: p.status === 'Success' ? 'success' : 'warning' })))
              : EmptyState({ icon: 'receipt', title: 'No receipts yet', text: 'This will be the first receipt for this student.' });
          })()));
    }

    /* ----------------------------------------------------------- paint */
    function paint() {
      host.innerHTML = '';

      if (!student) {
        host.appendChild(kpiRow(feeKpis(ctx)));
        host.appendChild(h('div', { className: 'widget-grid' },
          h('div', { className: 'span-7' }, pickerCard()),
          h('div', { className: 'span-5' }, SectionCard({ title: 'Counter activity', subtitle: 'Collections logged on ' + formatDate(TODAY), icon: 'wallet' },
            h('div', { className: 'stack-3' },
              kpiRow([
                { label: 'Receipts issued', value: '38', icon: 'receipt', tone: 'brand' },
                { label: 'Cash in drawer', value: cmoney(184500), icon: 'banknote', tone: 'success' },
              ]),
              h('div', { className: 't-eyebrow' }, 'Share of receipts by mode'),
              RankList(analytics.feeModeSplit.slice(0, 5).map((m) => ({ name: m.key, meta: 'of all receipts', value: m.value + '%' }))))))));

        host.appendChild(SectionCard({ title: 'Top outstanding on this campus', subtitle: 'Click a row to load the student into the counter', icon: 'alert-circle', flush: true },
          DataTable({
            columns: [
              studentCol('name', (r) => `${r.admissionNo} · ${r.className}`),
              { key: 'className', label: 'Class', width: 110, filter: true },
              moneyCol('feeTotal', 'Billed'),
              moneyCol('feePaid', 'Paid'),
              moneyCol('feeDue', 'Outstanding'),
              statusCol('feeStatus', 'Status', 120),
            ],
            rows: sortBy(pool.filter((s) => s.feeDue > 0), 'feeDue', 'desc').slice(0, 200),
            pageSize: 10, footerAggregates: true, searchKeys: ['name', 'admissionNo'],
            onRowClick: (row) => { student = row; model.touched = false; model.selected.clear(); paint(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
            emptyState: emptyFor('No dues on this campus', 'Every active student has cleared their fees.'),
          })));
        return;
      }

      const { open } = duesModel();
      const rerender = () => paint();
      const totals = totalsFor(open);

      host.appendChild(Card({ pad: true },
        h('div', { className: 'row-4 row-wrap' },
          Avatar(student.name, { size: 'lg' }),
          h('div', { className: 'flex-1 stack-1', style: { minWidth: '220px' } },
            h('div', { className: 'row-3 row-wrap' },
              h('h2', null, student.name),
              Badge(student.feeStatus),
              student.rte ? Badge('RTE', { tone: 'brand' }) : null,
              student.scholarship ? Badge('Scholarship', { tone: 'brand' }) : null),
            h('div', { className: 't-sm t-muted' },
              `${student.admissionNo} · ${student.className}-${student.section} · Roll ${student.rollNo} · ${student.house} House · ${campusName(student.campusId)}`),
            h('div', { className: 't-sm t-muted' },
              `Guardian ${student.fatherName || student.guardianName} · ${student.phone} · ${student.email}`)),
          h('div', { className: 'page-actions' },
            Button('Student 360', { variant: 'ghost', icon: 'eye', route: `students/profile/${student.id}` }),
            Button('Change student', { variant: 'secondary', icon: 'refresh-ccw', onClick: () => { student = null; term = ''; model.touched = false; model.selected.clear(); paint(); } })))));

      const main = h('div', { className: 'stack' },
        duesCard(open, rerender),
        headCard(totals),
        adjustCard(rerender),
        modeCard(rerender));

      host.appendChild(h('div', { className: 'detail-split' }, main, summaryCard(totals, open)));
    }

    paint();

    mount.appendChild(page({
      title: 'Collect Fee',
      subtitle: `Counter collection · ${campusName(campusOf(ctx))} · ${AY_LABEL}`,
      route: 'fees/collection',
      actions: [
        Button('Receipts', { variant: 'secondary', icon: 'receipt', route: 'fees/receipts' }),
        Button('Outstanding', { variant: 'secondary', icon: 'alert-circle', route: 'fees/outstanding' }),
        MenuButton([
          { header: true, label: 'Counter' },
          { label: 'Day-end cash summary', icon: 'calculator', onClick: mockAction('Day-end cash summary') },
          { label: 'Reprint last receipt', icon: 'print', onClick: mockAction('Reprint last receipt') },
          { label: 'Cancelled receipts', icon: 'x-circle', route: 'fees/cancelled-receipts', tone: 'danger' },
        ], { icon: 'more-horizontal', label: 'More actions' }),
      ],
      children: host,
    }));
  },
};

/* ==================================================== fees/receipts ======= */

function receiptFromPayment(p) {
  const s = byId(db.students, p.studentId) || db.students[0];
  const inv = byId(db.invoices, p.invoiceId);
  return {
    student: s,
    receiptNo: p.receiptNo,
    date: p.date,
    period: inv ? `${inv.quarter} ${inv.period}` : AY_LABEL,
    lines: headSplit(s, p.amount),
    lateFee: inv ? inv.lateFee : 0,
    discount: inv ? inv.discount : 0,
    concession: 0,
    concessionName: '',
    paid: p.amount,
    mode: p.mode,
    reference: p.reference,
    bank: p.bank,
    collectedBy: p.collectedByName || 'Accounts counter',
    balanceAfter: inv ? inv.balance : 0,
    nextDue: inv ? inv.dueDate : null,
  };
}

/** Shared cancel-with-reason flow used by receipts and the cancellation register. */
function cancelReceiptFlow(p) {
  return formPage({
    mode: 'modal', size: 'md',
    title: 'Cancel receipt ' + p.receiptNo,
    subtitle: `${p.studentName} · ${money(p.amount)} · ${formatDate(p.date)}`,
    submitLabel: 'Cancel receipt',
    sections: [{
      title: 'Audit reason',
      description: 'Cancellations are irreversible and are written to the audit log with your user id.',
      cols: 1,
      fields: [
        { id: 'reason', label: 'Reason', type: 'select', required: true, options: ['Cheque bounced', 'Duplicate entry', 'Wrong student selected', 'Wrong amount entered', 'Payment reversed by gateway', 'Parent requested cancellation'] },
        { id: 'note', label: 'Explanatory note', type: 'textarea', required: true, placeholder: 'What happened, and what was done to correct it?', validate: validators.required },
        { id: 'reverse', label: 'Reverse the ledger entry', type: 'switch', switchLabel: 'Post a contra voucher automatically' },
        { id: 'notifyParent', label: 'Notify parent', type: 'switch', switchLabel: 'Send an SMS explaining the cancellation' },
      ],
    }],
    onSubmit: (v) => notify({ title: 'Receipt cancelled', text: `${p.receiptNo} · ${v.reason}`, tone: 'danger', icon: 'x-circle' }),
  });
}

routes['fees/receipts'] = {
  title: 'Receipts',
  subtitle: 'Every receipt issued this academic year',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const rows = byCampus(db.payments, ctx).map((p) => ({ ...p, campus: campusName(p.campusId) }));
    const searchKeys = ['receiptNo', 'studentName', 'admissionNo', 'reference', 'mode'];
    const byMonth = groupBy(rows, 'month');
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const monthly = months.map((m) => ({ m, value: (byMonth.get(m) || []).reduce((a, p) => a + p.amount, 0) })).filter((x) => x.value > 0);

    const preview = (p) => {
      const node = receiptNode(receiptFromPayment(p));
      Drawer({
        title: 'Receipt ' + p.receiptNo,
        subtitle: `${p.studentName} · ${money(p.amount)} · ${formatDate(p.date)}`,
        size: 'xl', body: node,
        actions: (close) => frag(
          Button('Close', { variant: 'secondary', onClick: close }),
          Button('Cancel receipt', { variant: 'ghost', icon: 'x-circle', onClick: () => { close(); cancelReceiptFlow(p); } }),
          Button('Print', { variant: 'primary', icon: 'print', onClick: () => printDocument(node, 'Receipt ' + p.receiptNo) })),
      });
    };

    mount.appendChild(listPage({
      title: 'Receipts',
      subtitle: `${num(rows.length)} receipts · ${cmoney(sum(rows, 'amount'))} collected · ${campusName(campusOf(ctx))}`,
      route: 'fees/receipts',
      actions: [
        Button('Day book', { variant: 'secondary', icon: 'book', route: 'finance/day-book' }),
        Button('Collect fee', { variant: 'primary', icon: 'credit-card', route: 'fees/collection' }),
      ],
      kpis: [
        { label: 'Receipts', value: num(rows.length), icon: 'receipt', tone: 'brand', trend: analytics.sparks.collection },
        { label: 'Collected', value: cmoney(sum(rows, 'amount')), icon: 'wallet', tone: 'success', delta: 8.1, deltaLabel: 'vs last year' },
        { label: 'Average receipt', value: cmoney(rows.length ? avg(rows, 'amount') : 0), icon: 'calculator', tone: 'info' },
        { label: 'Gateway fees', value: cmoney(sum(rows, 'gatewayFee')), icon: 'percent', tone: 'warning', footer: 'Absorbed by the school' },
      ],
      chart: comboChart({
        categories: monthly.map((x) => x.m),
        bars: [{ name: 'Collected', values: monthly.map((x) => x.value) }],
        line: { name: 'Target', values: analytics.feeCollectionVsTarget.slice(0, monthly.length).map((x) => x.target) },
        valueFormat: 'currencyCompact', height: 250,
      }),
      chartTitle: 'Monthly collection against target',
      tabs: [
        { id: 'all', label: 'All receipts', count: rows.length },
        { id: 'Success', label: 'Realised', count: rows.filter((r) => r.status === 'Success').length },
        { id: 'Pending', label: 'Pending clearance', count: rows.filter((r) => r.status === 'Pending').length },
        { id: 'Cancelled', label: 'Cancelled', count: rows.filter((r) => r.status === 'Cancelled').length },
      ],
      activeTab: 'all',
      onTabChange: tabRefresh(mount, rows, (r, id) => r.status === id),
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Receipt no, student or reference...', width: '280px' },
        { id: 'mode', label: 'Mode', options: ['UPI', 'Net Banking', 'Credit Card', 'Debit Card', 'Cash', 'Cheque', 'NEFT/RTGS'] },
        { id: 'status', label: 'Status', options: ['Success', 'Pending', 'Failed', 'Cancelled'] },
        { id: 'from', label: 'From', type: 'date' },
        { id: 'to', label: 'To', type: 'date' },
      ],
      onFilter: (id, value, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys, dateKey: 'date' })),
      columns: [
        { key: 'receiptNo', label: 'Receipt no', sticky: true, width: 160, render: (r) => h('span', { className: 't-mono t-sm' }, r.receiptNo) },
        dateCol('date', 'Date'),
        studentCol('studentName', (r) => `${r.admissionNo} · ${r.className}-${r.section}`),
        { key: 'className', label: 'Class', width: 110, filter: true, hidden: true },
        moneyCol('amount', 'Amount', { width: 140 }),
        { key: 'mode', label: 'Mode', width: 130, filter: true, render: (r) => Badge(r.mode, { tone: r.mode === 'Cash' ? 'neutral' : 'info' }) },
        { key: 'reference', label: 'Reference', width: 170, render: (r) => h('span', { className: 't-mono t-xs' }, r.reference) },
        { key: 'bank', label: 'Bank', width: 130, filter: true, hidden: true },
        { key: 'collectedByName', label: 'Collected by', width: 170, filter: true },
        moneyCol('gatewayFee', 'Gateway fee', { width: 130 }),
        statusCol('status', 'Status', 130),
      ],
      rows,
      selectable: true,
      footerAggregates: true,
      searchKeys,
      pageSize: 50,
      bulkActions: [
        { label: 'Email receipts', icon: 'mail', onClick: (sel) => notify({ title: `${sel.length} receipts emailed`, tone: 'success' }) },
        { label: 'Print batch', icon: 'print', onClick: (sel) => notify({ title: `Printing ${sel.length} receipts`, tone: 'info' }) },
        { label: 'Export for bank', icon: 'download', onClick: (sel) => notify({ title: 'Bank file generated', text: `${sel.length} rows`, tone: 'success' }) },
      ],
      rowActions: (row) => [
        { label: 'View receipt', icon: 'eye', onClick: () => preview(row) },
        { label: 'Print', icon: 'print', onClick: () => printDocument(receiptNode(receiptFromPayment(row)), 'Receipt ' + row.receiptNo) },
        { label: 'Email to parent', icon: 'mail', onClick: () => notify({ title: 'Receipt emailed', tone: 'success' }) },
        { label: 'Open student', icon: 'graduation-cap', route: `students/profile/${row.studentId}` },
        { separator: true },
        { label: 'Cancel receipt', icon: 'x-circle', tone: 'danger', onClick: () => cancelReceiptFlow(row) },
      ],
      onRowClick: preview,
      tableTitle: 'Receipt register',
      tableSubtitle: 'Click any row for a print-ready copy of the receipt',
      exportName: 'fee-receipts',
      emptyState: emptyFor('No receipts yet', 'Receipts appear here the moment a payment is recorded at the counter.', Button('Collect fee', { variant: 'primary', icon: 'credit-card', route: 'fees/collection' })),
    }));
  },
};

/* ---------------------------------------------- deterministic derivations */

function hashOf(str) {
  let x = 2166136261;
  const s = String(str);
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
  return x >>> 0;
}
const pickFor = (arr, seed) => arr[hashOf(seed) % arr.length];
const intFor = (seed, min, max) => min + (hashOf(seed) % (max - min + 1));

/* ================================================== fees/outstanding ====== */

function bucketCards(rows, onPick) {
  const totals = BUCKETS.map((b) => {
    const set = rows.filter((r) => r.bucket === b);
    return { bucket: b, count: set.length, value: set.reduce((a, r) => a + r.payable, 0) };
  });
  const grand = totals.reduce((a, t) => a + t.value, 0) || 1;
  return h('div', { className: 'fin-buckets' },
    totals.map((t) => h('button', {
      className: 'fin-bucket', type: 'button', dataset: { tone: BUCKET_TONE[t.bucket] },
      onClick: () => onPick(t.bucket),
      attrs: { 'aria-label': `Filter to ${t.bucket}` },
    },
      h('span', { className: 't-eyebrow' }, t.bucket),
      h('span', { className: 't-display t-num' }, cmoney(t.value)),
      h('span', { className: 't-sm t-muted' }, `${num(t.count)} invoices · ${formatPercent((t.value / grand) * 100)} of dues`),
      ProgressBar((t.value / grand) * 100, { size: 'sm', tone: t.bucket === '90+ days' ? 'danger' : t.bucket === '61-90 days' ? 'warning' : 'brand' }))));
}

routes['fees/outstanding'] = {
  title: 'Due / Outstanding',
  subtitle: 'Ageing analysis of every unpaid installment',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const rows = outstandingRows(ctx);
    const searchKeys = ['studentName', 'admissionNo', 'invoiceNo', 'className'];
    const host = h('div', { className: 'stack' });

    const table = DataTable({
      columns: [
        studentCol('studentName', (r) => `${r.admissionNo} · ${r.className}-${r.section}`),
        { key: 'invoiceNo', label: 'Invoice', width: 150, render: (r) => h('span', { className: 't-mono t-xs' }, r.invoiceNo) },
        { key: 'quarter', label: 'Quarter', width: 90, filter: true },
        { key: 'period', label: 'Period', width: 140, hidden: true },
        dateCol('dueDate', 'Due date'),
        { key: 'overdueDays', label: 'Overdue', width: 110, align: 'right', numeric: true, render: (r) => (r.overdueDays ? h('span', { className: 't-danger t-semibold' }, `${r.overdueDays} d`) : h('span', { className: 't-muted' }, 'Not due')) },
        { key: 'bucket', label: 'Ageing', width: 120, filter: true, render: (r) => Badge(r.bucket, { tone: r.bucket === '90+ days' ? 'danger' : r.bucket === '61-90 days' ? 'warning' : r.bucket === '31-60 days' ? 'warning' : 'info' }) },
        moneyCol('amount', 'Billed'),
        moneyCol('paid', 'Paid'),
        moneyCol('lateFee', 'Late fee', { width: 120 }),
        moneyCol('payable', 'Outstanding', { width: 150 }),
        statusCol('status', 'Status', 130),
      ],
      rows,
      selectable: true, footerAggregates: true, searchKeys, pageSize: 50,
      exportName: 'outstanding-ageing',
      bulkActions: [
        { label: 'Send reminder', icon: 'bell', onClick: (sel) => notify({ title: `Reminders queued for ${sel.length} invoices`, text: 'SMS + email to the registered guardian.', tone: 'success' }) },
        { label: 'Apply late fee', icon: 'timer', onClick: (sel) => notify({ title: `Late fee applied to ${sel.length} invoices`, tone: 'warning' }) },
        { label: 'Write off', icon: 'x-circle', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Write off ${sel.length} invoices?`, text: 'Write-offs need management approval and appear in the P&L as bad debt.', tone: 'danger', confirmLabel: 'Request write-off' }).then((ok) => ok && notify({ title: 'Write-off requested', tone: 'warning' })) },
      ],
      rowActions: (row) => [
        { label: 'Collect now', icon: 'credit-card', route: `fees/collection/${row.studentId}` },
        { label: 'Student 360', icon: 'eye', route: `students/profile/${row.studentId}` },
        { label: 'Send reminder', icon: 'bell', onClick: () => notify({ title: 'Reminder sent', text: row.studentName, tone: 'success' }) },
        { separator: true },
        { label: 'Reschedule due date', icon: 'calendar', onClick: mockAction('Reschedule due date') },
      ],
      onRowClick: (row) => navigate(`fees/collection/${row.studentId}`),
      emptyState: emptyFor('Nothing outstanding', 'Every invoice on this campus has been settled.'),
    });

    host.appendChild(kpiRow([
      { label: 'Total outstanding', value: cmoney(sum(rows, 'payable')), icon: 'alert-circle', tone: 'danger', trend: analytics.sparks.outstanding, delta: -3.2 },
      { label: 'Open invoices', value: num(rows.length), icon: 'receipt', tone: 'warning', footer: `${num(distinct(rows, 'studentId').length)} students` },
      { label: 'Over 90 days', value: cmoney(rows.filter((r) => r.bucket === '90+ days').reduce((a, r) => a + r.payable, 0)), icon: 'timer', tone: 'danger', footer: 'Escalate to the principal' },
      { label: 'Late fee accrued', value: cmoney(sum(rows, 'lateFee')), icon: 'percent', tone: 'info', footer: `${money(50)} per day per invoice` },
    ]));

    host.appendChild(Card({ className: 'p-0' }, FilterBar({
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Student, invoice or admission no...', width: '280px' },
        { id: 'className', label: 'Class', options: classOptions() },
        { id: 'bucket', label: 'Ageing', options: BUCKETS },
        { id: 'quarter', label: 'Quarter', options: ['Q1', 'Q2', 'Q3', 'Q4'] },
        { id: 'status', label: 'Status', options: ['Overdue', 'Partially Paid', 'Pending'] },
      ],
      onChange: (id, v, all2) => table.refresh(applyFilters(rows, all2, { searchKeys })),
      actions: Button('Email ageing pack', { variant: 'secondary', size: 'sm', icon: 'mail', onClick: () => notify({ title: 'Ageing pack emailed', text: 'Sent to the Principal and Head of Accounts.', tone: 'success' }) }),
    })));

    host.appendChild(SectionCard({ title: 'Ageing buckets', subtitle: 'Click a bucket to filter the register below', icon: 'timer' },
      bucketCards(rows, (b) => { table.refresh(rows.filter((r) => r.bucket === b)); notify({ title: `Filtered to ${b}`, tone: 'info' }); })));

    const byClass = sortBy(sumBy(rows, 'className', 'payable'), 'value', 'desc').slice(0, 12);
    host.appendChild(h('div', { className: 'widget-grid' },
      h('div', { className: 'span-7' }, SectionCard({ title: 'Outstanding by class', subtitle: 'Top 12 classes by unpaid balance', className: 'chart-card' },
        barChart({ categories: byClass.map((r) => r.key.replace('Class ', '')), series: [{ name: 'Outstanding', values: byClass.map((r) => r.value) }], valueFormat: 'currencyCompact', height: 270 }))),
      h('div', { className: 'span-5' }, SectionCard({ title: 'Ageing mix', className: 'chart-card' },
        donutChart({
          data: BUCKETS.map((b) => ({ key: b, value: rows.filter((r) => r.bucket === b).reduce((a, r) => a + r.payable, 0) })),
          height: 270, valueFormat: 'currencyCompact',
          centerValue: cmoney(sum(rows, 'payable')), centerLabel: 'Outstanding',
        })))));

    const wrap = SectionCard({ title: 'Outstanding register', subtitle: 'Every unpaid installment with its ageing bucket', flush: true });
    wrap.querySelector('.card-body').appendChild(table);
    host.appendChild(wrap);

    mount.appendChild(page({
      title: 'Due / Outstanding',
      subtitle: `${num(rows.length)} open invoices worth ${cmoney(sum(rows, 'payable'))} · ${campusName(campusOf(ctx))}`,
      route: 'fees/outstanding',
      actions: [
        Button('Defaulters', { variant: 'secondary', icon: 'user-x', route: 'fees/defaulters' }),
        Button('Send reminders', { variant: 'primary', icon: 'bell', route: 'fees/reminders' }),
      ],
      children: host,
    }));
  },
};

/* =================================================== fees/discounts ======= */

function discountForm(d) {
  return formPage({
    mode: 'modal', size: 'lg',
    title: d ? `Edit ${d.name}` : 'New discount',
    subtitle: 'Discounts reduce the billed amount before an invoice is raised',
    submitLabel: d ? 'Save discount' : 'Create discount',
    values: d ? { name: d.name, type: d.type, value: String(d.value), appliesTo: d.appliesTo, autoApply: d.autoApply, active: d.active } : { type: 'Percentage', active: true },
    sections: [{
      title: 'Rule', cols: 2,
      fields: [
        { id: 'name', label: 'Discount name', required: true, span: 'full', validate: validators.required, placeholder: 'e.g. Sibling Discount' },
        { id: 'type', label: 'Type', type: 'radio', inline: true, options: ['Percentage', 'Fixed'], required: true },
        { id: 'value', label: 'Value', type: 'number', required: true, hint: 'Percent, or rupees for a fixed discount' },
        { id: 'appliesTo', label: 'Applies to', type: 'select', required: true, options: ['Total Fee', 'Tuition Fee', 'Transport Fee', 'Hostel Fee', 'Development Fee'] },
        { id: 'cap', label: 'Maximum benefit (₹)', type: 'number', hint: 'Leave blank for no cap' },
        { id: 'eligibility', label: 'Eligibility rule', type: 'textarea', span: 'full', placeholder: 'e.g. Second and subsequent child studying in the same campus' },
        { id: 'autoApply', label: 'Automation', type: 'switch', switchLabel: 'Apply automatically at invoicing' },
        { id: 'active', label: 'Status', type: 'switch', switchLabel: 'Active for 2026-27' },
      ],
    }],
    onSubmit: (v) => notify({ title: d ? 'Discount updated' : 'Discount created', text: v.name, tone: 'success' }),
  });
}

routes['fees/discounts'] = {
  title: 'Discounts',
  subtitle: 'Rule-based reductions applied before invoicing',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const avgFee = avg(db.feeStructures, 'total');
    const rows = db.discounts.map((d) => ({
      ...d,
      valueLabel: d.type === 'Percentage' ? d.value + '%' : money(d.value),
      annualCost: Math.round(d.type === 'Percentage' ? (avgFee * d.value / 100) * d.students : d.value * d.students),
      status: d.active ? 'Active' : 'Inactive',
      automation: d.autoApply ? 'Automatic' : 'Manual approval',
    }));

    mount.appendChild(listPage({
      title: 'Discounts',
      subtitle: `${rows.filter((r) => r.active).length} active rules covering ${num(sum(rows, 'students'))} student enrolments`,
      route: 'fees/discounts',
      actions: [
        Button('Concessions', { variant: 'secondary', icon: 'gift', route: 'fees/concessions' }),
        Button('New discount', { variant: 'primary', icon: 'plus', onClick: () => discountForm(null) }),
      ],
      kpis: [
        { label: 'Active rules', value: rows.filter((r) => r.active).length, icon: 'percent', tone: 'brand', footer: `${rows.filter((r) => r.autoApply).length} applied automatically` },
        { label: 'Students benefiting', value: num(sum(rows, 'students')), icon: 'users', tone: 'info' },
        { label: 'Annual cost', value: cmoney(sum(rows, 'annualCost')), icon: 'banknote', tone: 'warning', delta: 4.8, deltaLabel: 'vs last year' },
        { label: 'Largest scheme', value: 'RTE — Full Waiver', icon: 'award', tone: 'success', footer: `${num(118)} students · statutory` },
      ],
      chart: barChart({
        categories: sortBy(rows, 'annualCost', 'desc').map((r) => r.name),
        series: [{ name: 'Annual cost', values: sortBy(rows, 'annualCost', 'desc').map((r) => r.annualCost) }],
        horizontal: true, valueFormat: 'currencyCompact', height: 280,
      }),
      chartTitle: 'Cost of each discount scheme',
      columns: [
        { key: 'name', label: 'Discount', sticky: true, width: 240, render: (r) => h('div', { className: 'stack-1' }, h('span', { className: 't-medium' }, r.name), h('span', { className: 't-xs t-muted' }, r.id + ' · ' + r.appliesTo)) },
        { key: 'type', label: 'Type', width: 110, filter: true },
        { key: 'valueLabel', label: 'Value', width: 100, align: 'right', numeric: true, value: (r) => r.value },
        { key: 'appliesTo', label: 'Applies to', width: 150, filter: true },
        { key: 'automation', label: 'Automation', width: 160, filter: true, render: (r) => Badge(r.automation, { tone: r.autoApply ? 'success' : 'warning' }) },
        { key: 'students', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => num(r.students), value: (r) => r.students, format: (v) => num(v) },
        moneyCol('annualCost', 'Annual cost', { width: 150 }),
        statusCol('status', 'Status', 110),
      ],
      rows,
      selectable: true, footerAggregates: true, searchKeys: ['name', 'appliesTo', 'type'],
      bulkActions: [
        { label: 'Activate', icon: 'check-circle', onClick: (sel) => notify({ title: `${sel.length} discounts activated`, tone: 'success' }) },
        { label: 'Deactivate', icon: 'x-circle', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} discounts deactivated`, tone: 'warning' }) },
      ],
      rowActions: (row) => [
        { label: 'Edit rule', icon: 'edit', onClick: () => discountForm(row) },
        { label: 'View beneficiaries', icon: 'users', route: 'fees/assignment' },
        { label: 'Simulate impact', icon: 'calculator', onClick: () => Modal({ title: 'Impact simulation — ' + row.name, size: 'md', icon: 'calculator', body: h('div', { className: 'stack-3' }, DescriptionList([['Students in scope', num(row.students)], ['Average annual fee', money(Math.round(avgFee))], ['Benefit per student', row.type === 'Percentage' ? money(Math.round(avgFee * row.value / 100)) : money(row.value)], ['Total annual cost', money(row.annualCost)], ['Share of fee income', formatPercent((row.annualCost / analytics.kpis.feeBilled) * 100, 2)]], { cols: 1 }), Callout({ tone: 'info', icon: 'info' }, 'Simulation uses the current published structures and active enrolment.')), actions: (close) => Button('Close', { variant: 'primary', onClick: close }) }) },
        { separator: true },
        { label: 'Deactivate', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: `Deactivate ${row.name}?`, text: 'Invoices already raised keep the discount.', tone: 'danger', confirmLabel: 'Deactivate' }).then((ok) => ok && notify({ title: 'Discount deactivated', tone: 'warning' })) },
      ],
      onRowClick: (row) => discountForm(row),
      tableTitle: 'Discount rules',
      exportName: 'fee-discounts',
      emptyState: emptyFor('No discount rules', 'Create a rule to start offering sibling, staff-ward or merit reductions.', Button('New discount', { variant: 'primary', icon: 'plus', onClick: () => discountForm(null) })),
    }));
  },
};

/* ------------------------------------------ scholarship / concession data */

const SCHOLARSHIP_TYPES = ['Merit — Academic Top 3', 'Merit — Olympiad Medalist', 'Sports Excellence', 'Single Parent Support',
  'Staff Ward Waiver', 'RTE Statutory Waiver', 'Alumni Ward Grant', 'Financial Hardship Grant'];
const CONCESSION_REASONS = ['Loss of family income', 'Medical emergency in the family', 'Sibling already on concession',
  'Transfer mid-session', 'Natural calamity relief', 'Parent in armed forces'];

function scholarshipRows(ctx) {
  const pool = byCampus(db.students, ctx).filter((s) => s.scholarship || s.rte || s.category !== 'General');
  return pool.slice(0, 220).map((s, i) => {
    const seed = 'sch' + s.id;
    const st = structureFor(s);
    const pct = [10, 15, 20, 25, 50, 100][hashOf(seed) % 6];
    const amount = Math.round(((st ? st.total : s.feeTotal) * pct) / 100);
    return {
      id: 'SCH' + String(1000 + i),
      studentId: s.id,
      studentName: s.name,
      admissionNo: s.admissionNo,
      className: s.className,
      section: s.section,
      campusId: s.campusId,
      type: s.rte ? 'RTE Statutory Waiver' : pickFor(SCHOLARSHIP_TYPES, seed),
      percent: s.rte ? 100 : pct,
      amount: s.rte ? (st ? st.total : s.feeTotal) : amount,
      appliedOn: `2026-0${1 + (hashOf(seed + 'd') % 4)}-${String(5 + (hashOf(seed + 'e') % 20)).padStart(2, '0')}`,
      sponsor: pickFor(['School Corpus', 'Alumni Trust', 'State Government', 'CSR — Nova IT Systems', 'Founder Endowment'], seed + 's'),
      cgpa: s.cgpa,
      attendancePct: s.attendancePct,
      annualIncome: intFor(seed + 'i', 180000, 1400000),
      status: s.rte ? 'Approved' : pickFor(['Approved', 'Pending', 'Under Review', 'Approved', 'Rejected'], seed + 'st'),
      reviewer: pickFor(['Principal', 'Vice Principal', 'Scholarship Committee', 'Head of Accounts'], seed + 'r'),
    };
  });
}

function scholarshipDetail(row) {
  const s = byId(db.students, row.studentId);
  return h('div', { className: 'stack-4' },
    profileHeader({
      name: row.studentName, size: 'lg',
      subtitle: `${row.className}-${row.section} · ${row.admissionNo} · ${campusName(row.campusId)}`,
      badges: [Badge(row.status), Badge(row.type, { tone: 'info' })],
      meta: [
        { label: 'CGPA', value: String(row.cgpa), icon: 'chart-line' },
        { label: 'Attendance', value: row.attendancePct + '%', icon: 'clipboard-check' },
        { label: 'Family income', value: money(row.annualIncome), icon: 'wallet' },
      ],
    }),
    DescriptionList([
      ['Scholarship type', row.type],
      ['Benefit', `${row.percent}% · ${money(row.amount)} per year`],
      ['Sponsor', row.sponsor],
      ['Applied on', formatDate(row.appliedOn)],
      ['Reviewer', row.reviewer],
      ['Current fee status', s ? s.feeStatus : '—'],
      ['Outstanding today', s ? money(s.feeDue) : '—'],
      ['Siblings in school', s && s.siblingIds ? String(s.siblingIds.length) : '0'],
    ], { cols: 2 }),
    SectionCard({ title: 'Approval trail', icon: 'workflow' },
      ApprovalTrail([
        { label: 'Application received', by: row.studentName, date: formatDate(row.appliedOn), state: 'done', note: 'Submitted through the parent portal with income proof.' },
        { label: 'Documents verified', by: 'Accounts — Verification desk', date: formatDate(row.appliedOn), state: 'done', note: 'Income certificate and last report card checked.' },
        { label: 'Committee review', by: row.reviewer, date: row.status === 'Pending' ? 'Awaiting' : formatDate('2026-07-18'), state: row.status === 'Pending' ? 'current' : row.status === 'Rejected' ? 'rejected' : 'done' },
        { label: 'Principal sign-off', by: 'Dr. Meera Krishnan', date: row.status === 'Approved' ? formatDate('2026-07-22') : 'Pending', state: row.status === 'Approved' ? 'done' : 'todo' },
      ])),
    Callout({ tone: row.status === 'Approved' ? 'success' : 'info', icon: 'info', title: 'Renewal policy' },
      'Merit scholarships are renewed each year subject to 85% attendance and a CGPA of 8.0 or above. RTE waivers continue until Class VIII.'));
}

routes['fees/scholarships'] = {
  title: 'Scholarships',
  subtitle: 'Applications, approvals and the annual scholarship budget',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const rows = scholarshipRows(ctx);
    const pending = rows.filter((r) => r.status === 'Pending' || r.status === 'Under Review');

    mount.appendChild(approvalQueuePage({
      title: 'Scholarships',
      subtitle: `${num(rows.length)} applications · ${cmoney(rows.filter((r) => r.status === 'Approved').reduce((a, r) => a + r.amount, 0))} awarded this year`,
      route: 'fees/scholarships',
      kpis: [
        { label: 'Applications', value: num(rows.length), icon: 'award', tone: 'brand' },
        { label: 'Awaiting decision', value: num(pending.length), icon: 'clock', tone: 'warning', footer: 'SLA: 7 working days' },
        { label: 'Awarded value', value: cmoney(rows.filter((r) => r.status === 'Approved').reduce((a, r) => a + r.amount, 0)), icon: 'banknote', tone: 'success' },
        { label: 'Budget utilised', value: '78.4%', icon: 'gauge', tone: 'info', footer: `Budget ${cmoney(42000000)}` },
      ],
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Student or admission no...', width: '260px' },
        { id: 'type', label: 'Type', options: SCHOLARSHIP_TYPES },
        { id: 'className', label: 'Class', options: classOptions() },
        { id: 'status', label: 'Status', options: ['Approved', 'Pending', 'Under Review', 'Rejected'] },
      ],
      onFilter: (id, v, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys: ['studentName', 'admissionNo', 'type'] })),
      columns: [
        studentCol('studentName', (r) => `${r.admissionNo} · ${r.className}-${r.section}`),
        { key: 'type', label: 'Scholarship', width: 210, filter: true },
        { key: 'percent', label: 'Benefit', width: 100, align: 'right', numeric: true, render: (r) => r.percent + '%' },
        moneyCol('amount', 'Annual value', { width: 150 }),
        { key: 'sponsor', label: 'Sponsor', width: 180, filter: true },
        { key: 'cgpa', label: 'CGPA', width: 90, align: 'right', numeric: true },
        { key: 'attendancePct', label: 'Attendance', width: 110, align: 'right', numeric: true, render: (r) => r.attendancePct + '%' },
        dateCol('appliedOn', 'Applied'),
        statusCol('status', 'Status', 130),
      ],
      rows,
      onApprove: (row) => notify({ title: 'Scholarship approved', text: `${row.studentName} · ${money(row.amount)}`, tone: 'success' }),
      onReject: (row) => notify({ title: 'Scholarship rejected', text: row.studentName, tone: 'danger' }),
      detail: (row) => scholarshipDetail(row),
    }));
  },
};

/* ================================================= fees/concessions ======= */

routes['fees/concessions'] = {
  title: 'Concessions',
  subtitle: 'Case-by-case fee relief with a documented approval trail',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const pool = byCampus(db.students, ctx).filter((s) => s.feeDue > 0 || s.rte);
    const rows = pool.slice(0, 180).map((s, i) => {
      const seed = 'con' + s.id;
      const pct = [5, 10, 15, 20, 25, 30][hashOf(seed) % 6];
      return {
        id: 'CNC' + String(2000 + i),
        studentId: s.id,
        studentName: s.name,
        admissionNo: s.admissionNo,
        className: s.className,
        section: s.section,
        campusId: s.campusId,
        reason: pickFor(CONCESSION_REASONS, seed),
        head: pickFor(['Tuition Fee', 'Transport Fee', 'Development Fee', 'Hostel Fee', 'Total Fee'], seed + 'h'),
        percent: pct,
        amount: Math.round((s.feeTotal * pct) / 100),
        period: pickFor(['Q2 2026-27', 'Q3 2026-27', 'Full year 2026-27', 'Q2-Q3 2026-27'], seed + 'p'),
        requestedBy: s.fatherName || s.guardianName,
        requestedOn: `2026-0${5 + (hashOf(seed + 'm') % 4)}-${String(2 + (hashOf(seed + 'd') % 26)).padStart(2, '0')}`,
        approver: pickFor(['Principal', 'Vice Principal', 'Head of Accounts', 'Management Committee'], seed + 'a'),
        status: pickFor(['Approved', 'Pending', 'Under Review', 'Rejected', 'Approved'], seed + 's'),
        documents: 1 + (hashOf(seed + 'doc') % 4),
      };
    });

    mount.appendChild(approvalQueuePage({
      title: 'Concessions',
      subtitle: `${num(rows.length)} requests · ${cmoney(rows.filter((r) => r.status === 'Approved').reduce((a, r) => a + r.amount, 0))} approved relief`,
      route: 'fees/concessions',
      kpis: [
        { label: 'Requests', value: num(rows.length), icon: 'gift', tone: 'brand' },
        { label: 'Pending', value: num(rows.filter((r) => r.status === 'Pending').length), icon: 'clock', tone: 'warning' },
        { label: 'Approved value', value: cmoney(rows.filter((r) => r.status === 'Approved').reduce((a, r) => a + r.amount, 0)), icon: 'banknote', tone: 'success' },
        { label: 'Rejection rate', value: formatPercent((rows.filter((r) => r.status === 'Rejected').length / Math.max(1, rows.length)) * 100), icon: 'x-circle', tone: 'danger' },
      ],
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Student, reason or request id...', width: '260px' },
        { id: 'reason', label: 'Reason', options: CONCESSION_REASONS },
        { id: 'head', label: 'Fee head', options: ['Tuition Fee', 'Transport Fee', 'Development Fee', 'Hostel Fee', 'Total Fee'] },
        { id: 'status', label: 'Status', options: ['Approved', 'Pending', 'Under Review', 'Rejected'] },
      ],
      onFilter: (id, v, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys: ['studentName', 'admissionNo', 'reason', 'id'] })),
      columns: [
        { key: 'id', label: 'Request', width: 120, render: (r) => h('span', { className: 't-mono t-xs' }, r.id) },
        studentCol('studentName', (r) => `${r.admissionNo} · ${r.className}-${r.section}`),
        { key: 'reason', label: 'Reason', width: 230, filter: true },
        { key: 'head', label: 'Applies to', width: 150, filter: true },
        { key: 'percent', label: 'Relief', width: 90, align: 'right', numeric: true, render: (r) => r.percent + '%' },
        moneyCol('amount', 'Value', { width: 140 }),
        { key: 'period', label: 'Period', width: 150, filter: true },
        dateCol('requestedOn', 'Requested'),
        { key: 'approver', label: 'Approver', width: 160, filter: true },
        statusCol('status', 'Status', 130),
      ],
      rows,
      onApprove: (row) => notify({ title: 'Concession approved', text: `${row.studentName} · ${money(row.amount)} relief`, tone: 'success' }),
      onReject: (row) => notify({ title: 'Concession rejected', text: row.studentName, tone: 'danger' }),
      detail: (row) => h('div', { className: 'stack-4' },
        DescriptionList([
          ['Request id', row.id], ['Student', row.studentName], ['Class', `${row.className}-${row.section}`],
          ['Reason', row.reason], ['Applies to', row.head], ['Relief', `${row.percent}% · ${money(row.amount)}`],
          ['Period', row.period], ['Requested by', row.requestedBy], ['Requested on', formatDate(row.requestedOn)],
          ['Approver', row.approver],
        ], { cols: 2 }),
        SectionCard({ title: 'Supporting documents', icon: 'folder' },
          FileList(Array.from({ length: row.documents }, (_, i) => ({
            name: ['Income certificate.pdf', 'Medical report.pdf', 'Parent request letter.pdf', 'Aadhaar copy.pdf'][i],
            size: `${120 + i * 45} KB`, type: 'PDF', date: formatDate(row.requestedOn), status: 'Verified',
          })), { onDownload: mockAction('Download document') })),
        SectionCard({ title: 'Approval trail', icon: 'workflow' },
          ApprovalTrail([
            { label: 'Request raised', by: row.requestedBy, date: formatDate(row.requestedOn), state: 'done' },
            { label: 'Documents verified', by: 'Accounts desk', date: formatDate(row.requestedOn), state: 'done' },
            { label: `${row.approver} decision`, by: row.approver, date: row.status === 'Pending' ? 'Awaiting' : formatDate('2026-08-04'), state: row.status === 'Pending' ? 'current' : row.status === 'Rejected' ? 'rejected' : 'done' },
          ]))),
    }));
  },
};

/* =================================================== fees/late-fees ======= */

routes['fees/late-fees'] = {
  title: 'Late Fees',
  subtitle: 'Penalties accrued on overdue installments, and waivers',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const rows = byCampus(db.invoices, ctx).filter((i) => i.lateFee > 0).map((i) => ({
      ...i,
      perDay: 50,
      days: Math.max(1, Math.round(i.lateFee / 50)),
      capped: i.lateFee >= 3000,
      bucket: ageBucket(i.overdueDays),
    }));
    const searchKeys = ['studentName', 'admissionNo', 'invoiceNo'];

    const waive = (list) => ConfirmDialog({
      title: `Waive late fee on ${list.length} invoice${list.length > 1 ? 's' : ''}?`,
      text: `${money(list.reduce((a, r) => a + r.lateFee, 0))} will be written back. The waiver is logged against your user id.`,
      confirmLabel: 'Waive late fee', tone: 'warning', icon: 'timer',
    }).then((ok) => ok && notify({ title: 'Late fee waived', text: `${list.length} invoices updated`, tone: 'success' }));

    mount.appendChild(listPage({
      title: 'Late Fees',
      subtitle: `${num(rows.length)} invoices carrying a penalty · ${cmoney(sum(rows, 'lateFee'))} accrued`,
      route: 'fees/late-fees',
      actions: [
        Button('Late fee policy', { variant: 'secondary', icon: 'sliders', onClick: () => Modal({
          title: 'Late fee policy', subtitle: 'Applies to every campus unless overridden on the structure', size: 'md', icon: 'sliders',
          body: h('div', { className: 'stack-3' },
            DescriptionList([
              ['Grace period', '7 days after the due date'],
              ['Rate', `${money(50)} per day per invoice`],
              ['Cap', `${money(3000)} per invoice`],
              ['Compounding', 'None — simple daily accrual'],
              ['Auto-waiver', 'RTE and staff-ward students are exempt'],
              ['Approval to waive', 'Head of Accounts up to ₹2,000; Principal above'],
            ], { cols: 1 }),
            Callout({ tone: 'info', icon: 'info' }, 'Changing the policy affects future accrual only — penalties already posted stay on the invoice.')),
          actions: (close) => frag(Button('Close', { variant: 'secondary', onClick: close }), Button('Edit policy', { variant: 'primary', icon: 'edit', onClick: () => { close(); mockAction('Edit late fee policy')(); } })),
        }) }),
        Button('Recalculate now', { variant: 'primary', icon: 'refresh', onClick: () => notify({ title: 'Late fees recalculated', text: `${num(rows.length)} invoices re-evaluated against today's date.`, tone: 'success' }) }),
      ],
      kpis: [
        { label: 'Penalty accrued', value: cmoney(sum(rows, 'lateFee')), icon: 'timer', tone: 'danger' },
        { label: 'Invoices affected', value: num(rows.length), icon: 'receipt', tone: 'warning', footer: `${num(distinct(rows, 'studentId').length)} students` },
        { label: 'At the cap', value: num(rows.filter((r) => r.capped).length), icon: 'alert-triangle', tone: 'danger', footer: `${money(3000)} maximum per invoice` },
        { label: 'Average penalty', value: money(rows.length ? Math.round(avg(rows, 'lateFee')) : 0), icon: 'calculator', tone: 'info' },
      ],
      chart: barChart({
        categories: BUCKETS,
        series: [{ name: 'Late fee', values: BUCKETS.map((b) => rows.filter((r) => r.bucket === b).reduce((a, r) => a + r.lateFee, 0)) }],
        valueFormat: 'currencyCompact', showValues: true, height: 230,
      }),
      chartTitle: 'Penalty accrued by ageing bucket',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Student or invoice...', width: '260px' },
        { id: 'className', label: 'Class', options: classOptions() },
        { id: 'bucket', label: 'Ageing', options: BUCKETS },
        { id: 'quarter', label: 'Quarter', options: ['Q1', 'Q2', 'Q3', 'Q4'] },
      ],
      onFilter: (id, v, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys })),
      columns: [
        studentCol('studentName', (r) => `${r.admissionNo} · ${r.className}-${r.section}`),
        { key: 'invoiceNo', label: 'Invoice', width: 150, render: (r) => h('span', { className: 't-mono t-xs' }, r.invoiceNo) },
        { key: 'quarter', label: 'Quarter', width: 90, filter: true },
        dateCol('dueDate', 'Due date'),
        { key: 'overdueDays', label: 'Overdue', width: 100, align: 'right', numeric: true, render: (r) => `${r.overdueDays} d` },
        { key: 'perDay', label: 'Rate/day', width: 110, align: 'right', numeric: true, render: (r) => money(r.perDay) },
        moneyCol('lateFee', 'Penalty', { width: 130 }),
        { key: 'capped', label: 'Capped', width: 100, render: (r) => (r.capped ? Badge('At cap', { tone: 'danger' }) : h('span', { className: 't-muted' }, '—')), value: (r) => (r.capped ? 1 : 0) },
        moneyCol('balance', 'Balance', { width: 140 }),
        statusCol('status', 'Status', 130),
      ],
      rows,
      selectable: true, footerAggregates: true, searchKeys, pageSize: 50,
      bulkActions: [
        { label: 'Waive late fee', icon: 'timer', onClick: (sel) => waive(sel) },
        { label: 'Send warning SMS', icon: 'message-square', onClick: (sel) => notify({ title: `${sel.length} warnings queued`, tone: 'info' }) },
      ],
      rowActions: (row) => [
        { label: 'Collect now', icon: 'credit-card', route: `fees/collection/${row.studentId}` },
        { label: 'Waive penalty', icon: 'timer', onClick: () => waive([row]) },
        { label: 'Student 360', icon: 'eye', route: `students/profile/${row.studentId}` },
      ],
      onRowClick: (row) => navigate(`fees/collection/${row.studentId}`),
      tableTitle: 'Penalty register',
      exportName: 'late-fees',
      emptyState: emptyFor('No late fees', 'Nothing on this campus is past its grace period.'),
    }));
  },
};

/* ===================================================== fees/refunds ======= */

routes['fees/refunds'] = {
  title: 'Refunds',
  subtitle: 'Deposit returns, duplicate payments and cancellation refunds',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const rows = byCampus(db.refunds, ctx).map((r) => ({
      ...r,
      campus: campusName(r.campusId),
      ageDays: Math.max(0, daysBetween(r.requestDate, TODAY)),
      approver: pickFor(['Head of Accounts', 'Principal', 'Management Committee'], r.id),
      account: pickFor(db.bankAccounts.map((b) => b.name), r.id + 'b'),
    }));

    const refundForm = (existing) => formPage({
      mode: 'modal', size: 'lg',
      title: existing ? 'Process refund ' + existing.id : 'New refund request',
      subtitle: existing ? `${existing.studentName} · ${money(existing.amount)}` : 'Refunds are paid only to the registered bank account of the guardian',
      submitLabel: existing ? 'Process refund' : 'Raise request',
      values: existing ? { amount: String(existing.amount), reason: existing.reason, mode: existing.mode } : { mode: 'NEFT' },
      sections: [{
        title: 'Refund details', cols: 2,
        fields: [
          { id: 'student', label: 'Student', type: 'combobox', required: true, span: 'full',
            value: existing ? existing.studentId : undefined,
            options: byCampus(db.students, ctx).slice(0, 400).map((s) => ({ value: s.id, label: `${s.name} — ${s.admissionNo} — ${s.className}` })) },
          { id: 'amount', label: 'Refund amount (₹)', type: 'number', required: true, validate: validators.number },
          { id: 'reason', label: 'Reason', type: 'select', required: true, options: ['Transfer certificate issued', 'Security deposit refund', 'Duplicate payment', 'Transport discontinued', 'Admission cancelled', 'Excess collection'] },
          { id: 'mode', label: 'Refund mode', type: 'select', required: true, options: ['NEFT', 'Cheque', 'Adjustment against next installment'] },
          { id: 'account', label: 'Pay from account', type: 'select', options: db.bankAccounts.map((b) => ({ value: b.id, label: `${b.name} · ${b.accountMasked}` })) },
          { id: 'beneficiary', label: 'Beneficiary name', placeholder: 'As per bank records' },
          { id: 'ifsc', label: 'IFSC', placeholder: 'HDFC0001234' },
          { id: 'note', label: 'Note', type: 'textarea', span: 'full', placeholder: 'Reference to the original receipt, deductions applied, etc.' },
        ],
      }],
      onSubmit: (v) => notify({ title: existing ? 'Refund processed' : 'Refund request raised', text: money(Number(v.amount) || 0), tone: 'success' }),
    });

    mount.appendChild(listPage({
      title: 'Refunds',
      subtitle: `${num(rows.length)} requests · ${cmoney(sum(rows, 'amount'))} in scope · ${campusName(campusOf(ctx))}`,
      route: 'fees/refunds',
      actions: [
        Button('Refund policy', { variant: 'secondary', icon: 'scroll', onClick: mockAction('Open refund policy') }),
        Button('New refund', { variant: 'primary', icon: 'plus', onClick: () => refundForm(null) }),
      ],
      kpis: [
        { label: 'Requests', value: num(rows.length), icon: 'refresh-ccw', tone: 'brand' },
        { label: 'Awaiting approval', value: num(rows.filter((r) => r.status === 'Pending').length), icon: 'clock', tone: 'warning', footer: 'SLA: 5 working days' },
        { label: 'Processed value', value: cmoney(rows.filter((r) => r.status === 'Processed').reduce((a, r) => a + r.amount, 0)), icon: 'banknote', tone: 'success' },
        { label: 'Average turnaround', value: `${Math.round(avg(rows, 'ageDays'))} days`, icon: 'timer', tone: 'info' },
      ],
      chart: donutChart({
        data: countBy(rows, 'reason').map((r) => ({ key: r.key, value: r.value })),
        height: 250, centerValue: String(rows.length), centerLabel: 'Requests',
      }),
      chartTitle: 'Why refunds are requested',
      tabs: [
        { id: 'all', label: 'All', count: rows.length },
        { id: 'Pending', label: 'Pending', count: rows.filter((r) => r.status === 'Pending').length },
        { id: 'Approved', label: 'Approved', count: rows.filter((r) => r.status === 'Approved').length },
        { id: 'Processed', label: 'Processed', count: rows.filter((r) => r.status === 'Processed').length },
      ],
      activeTab: 'all',
      onTabChange: tabRefresh(mount, rows, (r, id) => r.status === id),
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Student or request id...', width: '260px' },
        { id: 'reason', label: 'Reason', options: distinct(rows, 'reason') },
        { id: 'mode', label: 'Mode', options: ['NEFT', 'Cheque', 'Adjustment'] },
        { id: 'status', label: 'Status', options: ['Pending', 'Approved', 'Processed', 'Rejected'] },
      ],
      onFilter: (id, v, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys: ['studentName', 'id', 'reason'] })),
      columns: [
        { key: 'id', label: 'Request', width: 110, render: (r) => h('span', { className: 't-mono t-xs' }, r.id) },
        studentCol('studentName', (r) => `${r.className} · ${r.campus}`),
        { key: 'reason', label: 'Reason', width: 230, filter: true },
        moneyCol('amount', 'Amount', { width: 140 }),
        { key: 'mode', label: 'Mode', width: 130, filter: true },
        { key: 'account', label: 'Pay from', width: 200, hidden: true },
        dateCol('requestDate', 'Requested'),
        { key: 'ageDays', label: 'Age', width: 90, align: 'right', numeric: true, render: (r) => `${r.ageDays} d` },
        { key: 'approver', label: 'Approver', width: 170, filter: true },
        statusCol('status', 'Status', 130),
      ],
      rows,
      selectable: true, footerAggregates: true, searchKeys: ['studentName', 'id', 'reason'],
      bulkActions: [
        { label: 'Approve selected', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} refunds approved`, tone: 'success' }) },
        { label: 'Generate bank file', icon: 'download', onClick: (sel) => notify({ title: 'NEFT file generated', text: `${sel.length} beneficiaries · ${money(sel.reduce((a, r) => a + r.amount, 0))}`, tone: 'success' }) },
        { label: 'Reject selected', icon: 'x', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Reject ${sel.length} refunds?`, tone: 'danger', confirmLabel: 'Reject' }).then((ok) => ok && notify({ title: 'Refunds rejected', tone: 'danger' })) },
      ],
      rowActions: (row) => [
        { label: 'Process refund', icon: 'banknote', onClick: () => refundForm(row) },
        { label: 'Student 360', icon: 'eye', route: `students/profile/${row.studentId}` },
        { label: 'View original receipts', icon: 'receipt', route: 'fees/receipts' },
        { separator: true },
        { label: 'Reject', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: `Reject refund ${row.id}?`, text: 'The guardian will be notified with the reason you provide next.', tone: 'danger', confirmLabel: 'Reject' }).then((ok) => ok && notify({ title: 'Refund rejected', tone: 'danger' })) },
      ],
      onRowClick: (row) => refundForm(row),
      tableTitle: 'Refund register',
      exportName: 'fee-refunds',
      emptyState: emptyFor('No refund requests', 'Refund requests raised by parents or the accounts team will appear here.', Button('New refund', { variant: 'primary', icon: 'plus', onClick: () => refundForm(null) })),
    }));
  },
};

/* ========================================== fees/cancelled-receipts ======= */

routes['fees/cancelled-receipts'] = {
  title: 'Cancelled Receipts',
  subtitle: 'Every cancellation with its audit reason and reversal entry',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const rows = byCampus(db.payments, ctx)
      .filter((p) => p.status === 'Cancelled' || p.status === 'Failed')
      .map((p) => ({
        ...p,
        reason: pickFor(['Cheque bounced', 'Duplicate entry', 'Wrong student selected', 'Wrong amount entered', 'Payment reversed by gateway', 'Parent requested cancellation'], p.id),
        cancelledBy: pickFor(['Ritu Malhotra — Accountant', 'Suresh Iyer — Head of Accounts', 'System — gateway webhook'], p.id + 'c'),
        cancelledOn: p.date,
        reversalVoucher: 'JOU/26/' + String(1000 + (hashOf(p.id) % 8999)),
        reversed: hashOf(p.id + 'r') % 10 > 1,
      }));
    const searchKeys = ['receiptNo', 'studentName', 'reason', 'reversalVoucher'];

    mount.appendChild(listPage({
      title: 'Cancelled Receipts',
      subtitle: `${num(rows.length)} cancellations · ${cmoney(sum(rows, 'amount'))} reversed · ${campusName(campusOf(ctx))}`,
      route: 'fees/cancelled-receipts',
      actions: [
        Button('Audit log', { variant: 'secondary', icon: 'history', route: 'system/audit-logs' }),
        Button('Receipts', { variant: 'primary', icon: 'receipt', route: 'fees/receipts' }),
      ],
      kpis: [
        { label: 'Cancellations', value: num(rows.length), icon: 'x-circle', tone: 'danger', footer: formatPercent((rows.length / Math.max(1, db.payments.length)) * 100, 2) + ' of all receipts' },
        { label: 'Value reversed', value: cmoney(sum(rows, 'amount')), icon: 'refresh-ccw', tone: 'warning' },
        { label: 'Bounced cheques', value: num(rows.filter((r) => r.reason === 'Cheque bounced').length), icon: 'file-text', tone: 'danger', footer: `${money(500)} bounce charge levied` },
        { label: 'Reversal posted', value: num(rows.filter((r) => r.reversed).length), icon: 'check-circle', tone: 'success', footer: 'Contra vouchers in the day book' },
      ],
      chart: barChart({
        categories: countBy(rows, 'reason').map((r) => r.key),
        series: [{ name: 'Cancellations', values: countBy(rows, 'reason').map((r) => r.value) }],
        horizontal: true, height: 250,
      }),
      chartTitle: 'Cancellation reasons',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Receipt no, student or voucher...', width: '280px' },
        { id: 'reason', label: 'Reason', options: distinct(rows, 'reason') },
        { id: 'mode', label: 'Mode', options: distinct(rows, 'mode') },
        { id: 'status', label: 'Status', options: ['Cancelled', 'Failed'] },
      ],
      onFilter: (id, v, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys, dateKey: 'date' })),
      columns: [
        { key: 'receiptNo', label: 'Receipt no', sticky: true, width: 160, render: (r) => h('span', { className: 't-mono t-sm' }, r.receiptNo) },
        dateCol('date', 'Issued'),
        studentCol('studentName', (r) => `${r.admissionNo} · ${r.className}`),
        moneyCol('amount', 'Amount', { width: 140 }),
        { key: 'mode', label: 'Mode', width: 120, filter: true },
        { key: 'reason', label: 'Audit reason', width: 230, filter: true, render: (r) => Badge(r.reason, { tone: 'danger', outline: true }) },
        { key: 'cancelledBy', label: 'Cancelled by', width: 220, filter: true },
        { key: 'reversalVoucher', label: 'Reversal voucher', width: 160, render: (r) => (r.reversed ? h('a', { href: navHref('finance/vouchers'), className: 't-mono t-xs' }, r.reversalVoucher) : h('span', { className: 't-muted t-xs' }, 'Not posted')) },
        statusCol('status', 'Status', 120),
      ],
      rows,
      selectable: true, footerAggregates: true, searchKeys, pageSize: 50,
      bulkActions: [
        { label: 'Post reversals', icon: 'refresh-ccw', onClick: (sel) => notify({ title: `${sel.length} contra vouchers posted`, tone: 'success' }) },
        { label: 'Export audit pack', icon: 'download', onClick: (sel) => notify({ title: 'Audit pack exported', text: `${sel.length} cancellations`, tone: 'success' }) },
      ],
      rowActions: (row) => [
        { label: 'View original receipt', icon: 'eye', onClick: () => Drawer({ title: 'Cancelled receipt ' + row.receiptNo, subtitle: row.reason, size: 'xl', body: h('div', { className: 'stack-3' }, Callout({ tone: 'danger', icon: 'x-circle', title: 'This receipt was cancelled' }, `${row.reason} · cancelled by ${row.cancelledBy} on ${formatDate(row.cancelledOn)}`), receiptNode(receiptFromPayment(row))), actions: (close) => Button('Close', { variant: 'primary', onClick: close }) }) },
        { label: 'Open student', icon: 'graduation-cap', route: `students/profile/${row.studentId}` },
        { label: 'Re-collect', icon: 'credit-card', route: `fees/collection/${row.studentId}` },
        { separator: true },
        { label: 'Post reversal voucher', icon: 'refresh-ccw', onClick: () => notify({ title: 'Reversal posted', text: row.reversalVoucher, tone: 'success' }) },
      ],
      tableTitle: 'Cancellation register',
      tableSubtitle: 'Cancellations are irreversible and always carry a reason and a user id',
      exportName: 'cancelled-receipts',
      emptyState: emptyFor('No cancellations', 'Nothing has been cancelled on this campus this year — that is a good sign.'),
    }));
  },
};

/* =================================================== fees/reminders ======= */

/**
 * How many guardians each automation rule would message right now, counted from
 * db.invoices rather than written down. Every number here is reproducible on
 * the defaulters and outstanding screens.
 */
function reminderRuleRows() {
  const open = db.invoices.filter((i) => Number(i.balance) > 0);
  const days = (i) => Number(i.overdueDays) || 0;
  const notYetDue = open.filter((i) => i.dueDate > TODAY);
  const soon = notYetDue.filter((i) => (new Date(i.dueDate) - new Date(TODAY)) / 86400000 <= 7);
  const uniq = (rows) => new Set(rows.map((i) => i.studentId)).size;
  const paidThisMonth = db.payments.filter((p) => p.status === 'Success' && String(p.date).slice(0, 7) === TODAY.slice(0, 7));
  const bounced = db.payments.filter((p) => p.status === 'Failed' || p.status === 'Cancelled');
  return [
    { id: 'A1', trigger: '7 days before due date', channel: 'SMS', template: 'Gentle nudge', audience: uniq(soon), active: true },
    { id: 'A2', trigger: 'On the due date', channel: 'WhatsApp', template: 'Due today', audience: uniq(open.filter((i) => i.dueDate === TODAY)), active: true },
    { id: 'A3', trigger: '3 days overdue', channel: 'SMS + Email', template: 'Overdue notice', audience: uniq(open.filter((i) => days(i) >= 3)), active: true },
    { id: 'A4', trigger: '15 days overdue', channel: 'SMS + Email', template: 'Overdue — 15 days', audience: uniq(open.filter((i) => days(i) >= 15)), active: true },
    { id: 'A5', trigger: '45 days overdue', channel: 'Email + Call task', template: 'Final notice', audience: uniq(open.filter((i) => days(i) >= 45)), active: true },
    { id: 'A6', trigger: 'Payment received', channel: 'SMS', template: 'Thank you', audience: new Set(paidThisMonth.map((p) => p.studentId)).size, active: true },
    { id: 'A7', trigger: 'Cheque bounced', channel: 'Call task', template: 'Bounce follow-up', audience: new Set(bounced.map((p) => p.studentId)).size, active: false },
  ];
}

const REMINDER_TEMPLATES = [
  { id: 'RT1', name: 'Gentle nudge — 7 days before due', channel: 'SMS', tone: 'info', body: 'Dear {parent}, the {quarter} fee of Rs {amount} for {student} ({class}) is due on {dueDate}. Pay online at springdale.edu.in/fees. — Springdale International' },
  { id: 'RT2', name: 'Due today', channel: 'WhatsApp', tone: 'warning', body: 'Dear {parent}, the {quarter} fee of Rs {amount} for {student} is due today. Kindly pay to avoid a late fee of Rs 50 per day.' },
  { id: 'RT3', name: 'Overdue — 15 days', channel: 'SMS + Email', tone: 'danger', body: 'Dear {parent}, the {quarter} fee for {student} is overdue by {days} days. Outstanding including late fee: Rs {amount}. Please clear it at the earliest.' },
  { id: 'RT4', name: 'Final notice — 45 days', channel: 'Email', tone: 'danger', body: 'Dear {parent}, despite earlier reminders the fee of Rs {amount} for {student} remains unpaid. Kindly meet the accounts office before {dueDate}.' },
  { id: 'RT5', name: 'Thank you — payment received', channel: 'SMS', tone: 'success', body: 'Thank you. We have received Rs {amount} towards the {quarter} fee for {student}. Receipt {receipt}.' },
];

routes['fees/reminders'] = {
  title: 'Reminders',
  subtitle: 'Automated and manual fee reminder campaigns',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const dues = outstandingRows(ctx);
    const students = distinct(dues, 'studentId').length;

    const campaigns = db.messages.slice(0, 60).map((m, i) => ({
      id: m.id,
      name: pickFor(['Q2 fee due reminder', 'Overdue 15-day notice', 'Final notice — Q1 dues', 'Transport fee reminder', 'Installment 3 advance notice'], m.id),
      channel: m.channel,
      audience: 'Parents with dues',
      recipients: m.recipients,
      delivered: m.delivered,
      failed: m.failed,
      opened: m.opened,
      sentOn: m.sentOn,
      cost: m.cost,
      status: m.status,
      collected: Math.round(m.delivered * intFor(m.id, 400, 2600)),
    }));

    const composer = (rows) => {
      let template = REMINDER_TEMPLATES[2];
      const preview = h('div', { className: 'callout', dataset: { tone: 'info' } }, template.body);
      return Modal({
        title: 'Send fee reminders',
        subtitle: `${num(rows.length)} guardians selected · ${cmoney(rows.reduce((a, r) => a + (r.payable || r.feeDue || 0), 0))} outstanding`,
        size: 'lg', icon: 'bell',
        body: h('div', { className: 'stack-4' },
          FormGrid({ cols: 2 },
            Field({ label: 'Template', required: true },
              Select({
                options: REMINDER_TEMPLATES.map((t) => ({ value: t.id, label: `${t.name} · ${t.channel}` })),
                value: template.id,
                onChange: (v) => { template = byId(REMINDER_TEMPLATES, v) || template; preview.textContent = template.body; },
              })),
            Field({ label: 'Channels', hint: 'DLT-approved sender: SPRNDL' },
              MultiSelect({ options: ['SMS', 'Email', 'WhatsApp', 'App push'], values: ['SMS', 'Email'], onChange: () => {} })),
            Field({ label: 'Send at' }, Select({ options: ['Immediately', 'Today 6:00 PM', 'Tomorrow 9:00 AM', 'Schedule…'], value: 'Immediately' })),
            Field({ label: 'Repeat' }, Select({ options: ['One-off', 'Every 3 days until paid', 'Weekly until paid'], value: 'One-off' })),
            Field({ label: 'Message preview', className: 'col-span-full', hint: 'Merge fields are replaced per recipient' }, preview)),
          Callout({ tone: 'warning', icon: 'alert-triangle', title: 'Cost estimate' },
            `${num(rows.length)} SMS at ₹0.18 and ${num(rows.length)} emails · approximately ${money(Math.round(rows.length * 0.18))} of SMS credit will be used.`)),
        actions: (close) => frag(
          Button('Cancel', { variant: 'secondary', onClick: close }),
          Button('Send test to me', { variant: 'ghost', icon: 'send', onClick: () => notify({ title: 'Test message sent', tone: 'info' }) }),
          Button('Send reminders', { variant: 'primary', icon: 'bell', onClick: () => { close(); notify({ title: `${num(rows.length)} reminders queued`, text: `${template.name} · ${template.channel}`, tone: 'success' }); } })),
      });
    };

    const host = h('div', { className: 'stack' });

    host.appendChild(kpiRow([
      { label: 'Guardians with dues', value: num(students), icon: 'users', tone: 'danger', footer: `${num(dues.length)} open invoices` },
      { label: 'Reminders sent (30 d)', value: num(sum(campaigns, 'recipients')), icon: 'bell', tone: 'brand' },
      { label: 'Delivery rate', value: formatPercent((sum(campaigns, 'delivered') / Math.max(1, sum(campaigns, 'recipients'))) * 100), icon: 'check-circle', tone: 'success' },
      { label: 'Collected after reminder', value: cmoney(sum(campaigns, 'collected')), icon: 'wallet', tone: 'info', footer: 'Within 7 days of send' },
    ]));

    host.appendChild(SectionCard({
      title: 'Automation rules',
      subtitle: 'Reminders that run without anyone pressing a button',
      icon: 'workflow',
      actions: Button('New rule', { variant: 'secondary', size: 'sm', icon: 'plus', onClick: mockAction('New automation rule') }),
    },
      DataTable({
        columns: [
          { key: 'trigger', label: 'Trigger', width: 260 },
          { key: 'channel', label: 'Channel', width: 160, filter: true },
          { key: 'template', label: 'Template', width: 260 },
          { key: 'audience', label: 'Audience', width: 200, align: 'right', numeric: true, render: (r) => num(r.audience), value: (r) => r.audience },
          { key: 'active', label: 'Status', width: 120, render: (r) => Badge(r.active ? 'Active' : 'Paused', { tone: r.active ? 'success' : 'warning' }) },
        ],
        // Audience sizes are counted off the live invoice book, so a rule cannot
        // claim to be chasing 338 families while the defaulter list shows 700.
        rows: reminderRuleRows(),
        paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
        rowActions: (row) => [
          { label: row.active ? 'Pause rule' : 'Activate rule', icon: row.active ? 'bell-off' : 'bell', onClick: () => notify({ title: row.active ? 'Rule paused' : 'Rule activated', text: row.trigger, tone: row.active ? 'warning' : 'success' }) },
          { label: 'Edit template', icon: 'edit', onClick: mockAction('Edit reminder template') },
          { label: 'Preview audience', icon: 'users', route: 'fees/defaulters' },
        ],
      })));

    const dueRows = sortBy(dues, 'payable', 'desc');
    const table = DataTable({
      columns: [
        studentCol('studentName', (r) => `${r.admissionNo} · ${r.className}-${r.section}`),
        { key: 'invoiceNo', label: 'Invoice', width: 150, render: (r) => h('span', { className: 't-mono t-xs' }, r.invoiceNo) },
        dateCol('dueDate', 'Due date'),
        { key: 'overdueDays', label: 'Overdue', width: 100, align: 'right', numeric: true, render: (r) => `${r.overdueDays} d` },
        { key: 'bucket', label: 'Ageing', width: 120, filter: true, render: (r) => Badge(r.bucket, { tone: r.bucket === '90+ days' ? 'danger' : 'warning' }) },
        moneyCol('payable', 'Outstanding', { width: 150 }),
        { key: 'lastReminder', label: 'Last reminder', width: 150, render: (r) => h('span', { className: 't-sm t-muted' }, relativeTime(new Date(Date.parse(r.dueDate) + 86400000 * (hashOf(r.id) % 20)))) },
        { key: 'reminders', label: 'Sent', width: 90, align: 'right', numeric: true, render: (r) => String(1 + (hashOf(r.id + 'n') % 5)), value: (r) => 1 + (hashOf(r.id + 'n') % 5) },
      ],
      rows: dueRows,
      selectable: true, footerAggregates: true, pageSize: 25,
      searchKeys: ['studentName', 'admissionNo', 'invoiceNo'],
      exportName: 'reminder-audience',
      bulkActions: [
        { label: 'Send reminder', icon: 'bell', onClick: (sel) => composer(sel) },
        { label: 'Create call tasks', icon: 'phone-call', onClick: (sel) => notify({ title: `${sel.length} call tasks created`, text: 'Assigned to the accounts desk.', tone: 'success' }) },
        { label: 'Escalate to principal', icon: 'trending-up', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} cases escalated`, tone: 'warning' }) },
      ],
      rowActions: (row) => [
        { label: 'Send reminder now', icon: 'bell', onClick: () => composer([row]) },
        { label: 'Collect fee', icon: 'credit-card', route: `fees/collection/${row.studentId}` },
        { label: 'Student 360', icon: 'eye', route: `students/profile/${row.studentId}` },
      ],
      emptyState: emptyFor('Nobody to remind', 'Every invoice on this campus is settled.'),
    });

    const audience = SectionCard({
      title: 'Reminder audience',
      subtitle: 'Select the invoices you want to chase, then send in one go',
      icon: 'users', flush: true,
      actions: Button('Send to everyone listed', { variant: 'primary', size: 'sm', icon: 'bell', onClick: () => composer(dueRows) }),
    });
    audience.querySelector('.card-body').appendChild(table);
    host.appendChild(audience);

    host.appendChild(SectionCard({
      title: 'Campaign history',
      subtitle: 'Delivery and the money that arrived within seven days of the send',
      icon: 'history', flush: true,
    },
      DataTable({
        columns: [
          { key: 'name', label: 'Campaign', width: 240 },
          { key: 'channel', label: 'Channel', width: 130, filter: true, render: (r) => Badge(r.channel, { tone: 'info' }) },
          dateCol('sentOn', 'Sent on'),
          { key: 'recipients', label: 'Recipients', width: 120, align: 'right', numeric: true, aggregate: 'sum', render: (r) => num(r.recipients), value: (r) => r.recipients, format: (v) => num(v) },
          { key: 'delivered', label: 'Delivered', width: 120, align: 'right', numeric: true, aggregate: 'sum', render: (r) => num(r.delivered), value: (r) => r.delivered, format: (v) => num(v) },
          { key: 'failed', label: 'Failed', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'opened', label: 'Opened', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          moneyCol('collected', 'Collected after', { width: 160 }),
          moneyCol('cost', 'Cost', { width: 110 }),
          statusCol('status', 'Status', 120),
        ],
        rows: campaigns,
        pageSize: 10, footerAggregates: true, searchKeys: ['name', 'channel'],
        exportName: 'reminder-campaigns',
        emptyState: emptyFor('No campaigns yet', 'Send your first reminder batch from the audience table above.'),
      })));

    mount.appendChild(page({
      title: 'Reminders',
      subtitle: `${num(students)} guardians owe ${cmoney(sum(dues, 'payable'))} · ${campusName(campusOf(ctx))}`,
      route: 'fees/reminders',
      actions: [
        Button('Templates', { variant: 'secondary', icon: 'copy', route: 'communication/templates' }),
        Button('Send reminders', { variant: 'primary', icon: 'bell', onClick: () => composer(dueRows) }),
      ],
      children: host,
    }));
  },
};

/* =============================================== fees/online-payments ===== */

routes['fees/online-payments'] = {
  title: 'Online Payments',
  subtitle: 'Payment gateway transaction log and reconciliation',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const online = byCampus(db.payments, ctx).filter((p) => ['UPI', 'Net Banking', 'Credit Card', 'Debit Card'].includes(p.mode));
    const rows = online.map((p) => {
      const settled = p.status === 'Success' && hashOf(p.id + 'set') % 10 > 1;
      return {
        ...p,
        gateway: pickFor(['Razorpay', 'PayU', 'CCAvenue', 'BillDesk'], p.id),
        txnId: 'pay_' + (hashOf(p.id).toString(36) + hashOf(p.id + 'x').toString(36)).slice(0, 14),
        settlementDate: settled ? p.date : null,
        settlementUtr: settled ? 'UTR' + (700000000 + (hashOf(p.id + 'u') % 99999999)) : null,
        reconciliation: p.status !== 'Success' ? 'Not applicable' : settled ? 'Reconciled' : 'Unreconciled',
        netAmount: p.amount - p.gatewayFee,
      };
    });
    const searchKeys = ['receiptNo', 'studentName', 'txnId', 'settlementUtr', 'gateway'];
    const unrec = rows.filter((r) => r.reconciliation === 'Unreconciled');

    mount.appendChild(listPage({
      title: 'Online Payments',
      subtitle: `${num(rows.length)} gateway transactions · ${cmoney(sum(rows, 'amount'))} gross · ${cmoney(sum(rows, 'gatewayFee'))} in fees`,
      route: 'fees/online-payments',
      actions: [
        Button('Gateway settings', { variant: 'secondary', icon: 'settings', route: 'system/payment-gateway' }),
        Button('Import bank statement', { variant: 'secondary', icon: 'upload', onClick: mockAction('Import bank statement') }),
        Button('Run reconciliation', { variant: 'primary', icon: 'refresh', onClick: () => ConfirmDialog({ title: 'Reconcile gateway settlements?', text: `${num(unrec.length)} transactions will be matched against the latest bank statement.`, confirmLabel: 'Reconcile now', tone: 'brand', icon: 'refresh' }).then((ok) => ok && notify({ title: 'Reconciliation complete', text: `${num(unrec.length)} transactions matched`, tone: 'success' })) }),
      ],
      kpis: [
        { label: 'Transactions', value: num(rows.length), icon: 'globe', tone: 'brand', footer: formatPercent((rows.length / Math.max(1, byCampus(db.payments, ctx).length)) * 100) + ' of all receipts' },
        { label: 'Gross value', value: cmoney(sum(rows, 'amount')), icon: 'wallet', tone: 'success' },
        { label: 'Gateway charges', value: cmoney(sum(rows, 'gatewayFee')), icon: 'percent', tone: 'warning', footer: 'UPI is zero-MDR' },
        { label: 'Unreconciled', value: num(unrec.length), icon: 'alert-circle', tone: 'danger', footer: cmoney(sum(unrec, 'amount')) + ' awaiting settlement' },
      ],
      chart: donutChart({
        data: countBy(rows, 'gateway').map((r) => ({ key: r.key, value: r.value })),
        height: 250, centerValue: num(rows.length), centerLabel: 'Transactions',
      }),
      chartTitle: 'Transactions by gateway',
      tabs: [
        { id: 'all', label: 'All', count: rows.length },
        { id: 'Reconciled', label: 'Reconciled', count: rows.filter((r) => r.reconciliation === 'Reconciled').length },
        { id: 'Unreconciled', label: 'Unreconciled', count: unrec.length },
        { id: 'Failed', label: 'Failed', count: rows.filter((r) => r.status === 'Failed').length },
      ],
      activeTab: 'all',
      onTabChange: tabRefresh(mount, rows, (r, id) => (id === 'Failed' ? r.status : r.reconciliation) === id),
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Txn id, UTR, receipt or student...', width: '300px' },
        { id: 'gateway', label: 'Gateway', options: ['Razorpay', 'PayU', 'CCAvenue', 'BillDesk'] },
        { id: 'mode', label: 'Method', options: ['UPI', 'Net Banking', 'Credit Card', 'Debit Card'] },
        { id: 'reconciliation', label: 'Reconciliation', options: ['Reconciled', 'Unreconciled', 'Not applicable'] },
        { id: 'status', label: 'Status', options: ['Success', 'Pending', 'Failed', 'Cancelled'] },
      ],
      onFilter: (id, v, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys, dateKey: 'date' })),
      columns: [
        { key: 'txnId', label: 'Gateway txn', sticky: true, width: 180, render: (r) => h('span', { className: 't-mono t-xs' }, r.txnId) },
        dateCol('date', 'Date'),
        studentCol('studentName', (r) => `${r.admissionNo} · ${r.className}`),
        { key: 'gateway', label: 'Gateway', width: 120, filter: true },
        { key: 'mode', label: 'Method', width: 130, filter: true, render: (r) => Badge(r.mode, { tone: 'info' }) },
        moneyCol('amount', 'Gross', { width: 130 }),
        moneyCol('gatewayFee', 'Fee', { width: 110 }),
        moneyCol('netAmount', 'Net credit', { width: 140 }),
        { key: 'settlementUtr', label: 'Settlement UTR', width: 170, render: (r) => (r.settlementUtr ? h('span', { className: 't-mono t-xs' }, r.settlementUtr) : h('span', { className: 't-muted t-xs' }, 'Pending')) },
        { key: 'reconciliation', label: 'Reconciliation', width: 150, filter: true, render: (r) => Badge(r.reconciliation, { tone: r.reconciliation === 'Reconciled' ? 'success' : r.reconciliation === 'Unreconciled' ? 'warning' : 'neutral' }) },
        { key: 'receiptNo', label: 'Receipt', width: 150, render: (r) => h('span', { className: 't-mono t-xs' }, r.receiptNo) },
        statusCol('status', 'Status', 120),
      ],
      rows,
      selectable: true, footerAggregates: true, searchKeys, pageSize: 50,
      bulkActions: [
        { label: 'Mark reconciled', icon: 'check-circle', onClick: (sel) => notify({ title: `${sel.length} transactions reconciled`, tone: 'success' }) },
        { label: 'Raise dispute', icon: 'alert-triangle', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} disputes raised with the gateway`, tone: 'warning' }) },
        { label: 'Export settlement file', icon: 'download', onClick: (sel) => notify({ title: 'Settlement file exported', text: `${sel.length} rows`, tone: 'success' }) },
      ],
      rowActions: (row) => [
        { label: 'View receipt', icon: 'receipt', onClick: () => Drawer({ title: 'Receipt ' + row.receiptNo, size: 'xl', body: receiptNode(receiptFromPayment(row)), actions: (close) => Button('Close', { variant: 'primary', onClick: close }) }) },
        { label: 'Copy transaction id', icon: 'copy', onClick: () => copyToClipboard(row.txnId, 'Transaction id copied') },
        { label: 'Open in gateway', icon: 'external-link', onClick: mockAction('Open in gateway dashboard') },
        { separator: true },
        { label: 'Initiate refund', icon: 'refresh-ccw', tone: 'danger', route: 'fees/refunds' },
      ],
      tableTitle: 'Gateway transaction log',
      tableSubtitle: 'Net credit is gross less the gateway fee; UTR appears once the settlement lands',
      exportName: 'online-payments',
      emptyState: emptyFor('No online payments', 'Once parents pay through the portal the transactions appear here in real time.'),
    }));
  },
};

/* =================================================== fees/defaulters ====== */

routes['fees/defaulters'] = {
  title: 'Defaulter List',
  subtitle: 'Students carrying unpaid dues, ready for bulk follow-up',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const dueByStudent = new Map();
    for (const inv of byCampus(db.invoices, ctx)) {
      if (inv.balance <= 0) continue;
      const cur = dueByStudent.get(inv.studentId) || { due: 0, lateFee: 0, invoices: 0, oldest: 0 };
      cur.due += inv.balance;
      cur.lateFee += inv.lateFee;
      cur.invoices += 1;
      cur.oldest = Math.max(cur.oldest, inv.overdueDays);
      dueByStudent.set(inv.studentId, cur);
    }
    const rows = Array.from(dueByStudent.entries()).map(([sid, agg]) => {
      const s = byId(db.students, sid);
      return {
        id: sid,
        name: s.name,
        admissionNo: s.admissionNo,
        className: s.className,
        section: s.section,
        campusId: s.campusId,
        house: s.house,
        guardian: s.fatherName || s.guardianName,
        phone: s.phone,
        email: s.email,
        billed: s.feeTotal,
        paid: s.feePaid,
        due: agg.due,
        lateFee: agg.lateFee,
        invoices: agg.invoices,
        overdueDays: agg.oldest,
        bucket: ageBucket(agg.oldest),
        transportOpted: s.transportOpted ? 'Yes' : 'No',
        attendancePct: s.attendancePct,
        feeStatus: s.feeStatus,
      };
    });
    const sorted = sortBy(rows, 'due', 'desc');
    const searchKeys = ['name', 'admissionNo', 'guardian', 'phone', 'className'];

    const blast = (sel, channel) => Modal({
      title: `Send ${channel} to ${num(sel.length)} guardians`,
      subtitle: `${cmoney(sel.reduce((a, r) => a + r.due, 0))} outstanding across ${num(sel.reduce((a, r) => a + r.invoices, 0))} invoices`,
      size: 'lg', icon: channel === 'SMS' ? 'message-square' : 'mail',
      body: h('div', { className: 'stack-4' },
        FormGrid({ cols: 2 },
          Field({ label: 'Template', required: true }, Select({ options: REMINDER_TEMPLATES.map((t) => t.name), value: REMINDER_TEMPLATES[2].name })),
          Field({ label: 'Send at' }, Select({ options: ['Immediately', 'Today 6:00 PM', 'Tomorrow 9:00 AM'], value: 'Immediately' })),
          Field({ label: 'Message', className: 'col-span-full', hint: 'Merge fields: {parent} {student} {class} {amount} {days} {dueDate}' },
            Textarea({ rows: 4, value: REMINDER_TEMPLATES[2].body }))),
        Callout({ tone: 'info', icon: 'info', title: 'Delivery window' },
          'TRAI rules block promotional SMS between 9 PM and 9 AM. Transactional fee reminders are exempt but we still queue them for 9 AM.')),
      actions: (close) => frag(
        Button('Cancel', { variant: 'secondary', onClick: close }),
        Button(`Send ${channel}`, { variant: 'primary', icon: 'send', onClick: () => { close(); notify({ title: `${num(sel.length)} ${channel} messages queued`, tone: 'success' }); } })),
    });

    mount.appendChild(listPage({
      title: 'Defaulter List',
      subtitle: `${num(rows.length)} students owe ${cmoney(sum(rows, 'due'))} · ${campusName(campusOf(ctx))}`,
      route: 'fees/defaulters',
      actions: [
        Button('Ageing report', { variant: 'secondary', icon: 'timer', route: 'fees/outstanding' }),
        Button('Bulk SMS', { variant: 'secondary', icon: 'message-square', onClick: () => blast(sorted, 'SMS') }),
        Button('Bulk email', { variant: 'primary', icon: 'mail', onClick: () => blast(sorted, 'Email') }),
      ],
      kpis: [
        { label: 'Defaulters', value: num(rows.length), icon: 'user-x', tone: 'danger', trend: analytics.sparks.outstanding },
        { label: 'Total due', value: cmoney(sum(rows, 'due')), icon: 'wallet', tone: 'warning' },
        { label: 'Average per student', value: money(rows.length ? Math.round(avg(rows, 'due')) : 0), icon: 'calculator', tone: 'info' },
        { label: 'Beyond 90 days', value: num(rows.filter((r) => r.bucket === '90+ days').length), icon: 'alert-triangle', tone: 'danger', footer: 'Escalation required' },
      ],
      chart: barChart({
        categories: sortBy(sumBy(rows, 'className', 'due'), 'value', 'desc').slice(0, 12).map((r) => r.key.replace('Class ', '')),
        series: [{ name: 'Outstanding', values: sortBy(sumBy(rows, 'className', 'due'), 'value', 'desc').slice(0, 12).map((r) => r.value) }],
        valueFormat: 'currencyCompact', height: 240,
      }),
      chartTitle: 'Defaulter value by class',
      tabs: [
        { id: 'all', label: 'All', count: rows.length },
        ...BUCKETS.map((b) => ({ id: b, label: b, count: rows.filter((r) => r.bucket === b).length })),
      ],
      activeTab: 'all',
      onTabChange: tabRefresh(mount, sorted, (r, id) => r.bucket === id),
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Student, guardian or phone...', width: '280px' },
        { id: 'className', label: 'Class', options: classOptions() },
        { id: 'bucket', label: 'Ageing', options: BUCKETS },
        { id: 'transportOpted', label: 'Transport', options: ['Yes', 'No'] },
      ],
      onFilter: (id, v, all2, table) => table.refresh(applyFilters(sorted, all2, { searchKeys })),
      columns: [
        studentCol('name', (r) => `${r.admissionNo} · ${r.className}-${r.section}`),
        { key: 'guardian', label: 'Guardian', width: 180 },
        { key: 'phone', label: 'Phone', width: 150, render: (r) => h('a', { href: `tel:${r.phone}`, className: 't-mono t-xs' }, r.phone) },
        { key: 'invoices', label: 'Invoices', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        moneyCol('billed', 'Billed', { width: 140 }),
        moneyCol('paid', 'Paid', { width: 140 }),
        moneyCol('due', 'Outstanding', { width: 150 }),
        moneyCol('lateFee', 'Late fee', { width: 120 }),
        { key: 'overdueDays', label: 'Oldest', width: 100, align: 'right', numeric: true, render: (r) => `${r.overdueDays} d` },
        { key: 'bucket', label: 'Ageing', width: 120, filter: true, render: (r) => Badge(r.bucket, { tone: r.bucket === '90+ days' ? 'danger' : 'warning' }) },
        { key: 'attendancePct', label: 'Attendance', width: 110, align: 'right', numeric: true, render: (r) => r.attendancePct + '%', hidden: true },
      ],
      rows: sorted,
      selectable: true, footerAggregates: true, searchKeys, pageSize: 50,
      bulkActions: [
        { label: 'Send SMS', icon: 'message-square', onClick: (sel) => blast(sel, 'SMS') },
        { label: 'Send email', icon: 'mail', onClick: (sel) => blast(sel, 'Email') },
        { label: 'Print notice letters', icon: 'print', onClick: (sel) => notify({ title: `${sel.length} notice letters queued`, text: 'Collect them from the office printer.', tone: 'info' }) },
        { label: 'Block hall ticket', icon: 'lock', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Block hall tickets for ${sel.length} students?`, text: 'They will not be able to download exam admit cards until dues are cleared. The principal is notified.', tone: 'danger', confirmLabel: 'Block' }).then((ok) => ok && notify({ title: 'Hall tickets blocked', tone: 'warning' })) },
      ],
      rowActions: (row) => [
        { label: 'Collect fee', icon: 'credit-card', route: `fees/collection/${row.id}` },
        { label: 'Student 360', icon: 'eye', route: `students/profile/${row.id}` },
        { label: 'Call guardian', icon: 'phone-call', onClick: () => notify({ title: 'Dialling ' + row.phone, text: row.guardian, tone: 'info' }) },
        { label: 'Send reminder', icon: 'bell', onClick: () => blast([row], 'SMS') },
        { separator: true },
        { label: 'Record a promise to pay', icon: 'handshake', onClick: mockAction('Record promise to pay') },
      ],
      onRowClick: (row) => navigate(`fees/collection/${row.id}`),
      tableTitle: 'Defaulter register',
      exportName: 'fee-defaulters',
      emptyState: emptyFor('No defaulters', 'Every student on this campus is up to date. Well done.'),
    }));
  },
};

/* ===================================================== fees/reports ======= */

routes['fees/reports'] = {
  title: 'Fee Reports',
  subtitle: 'Collection, outstanding and head-wise analysis',
  section: 'fees',
  render(mount, ctx) {
    ensureStyles();
    const invoices = byCampus(db.invoices, ctx);
    const byClass = new Map();
    for (const i of invoices) {
      const cur = byClass.get(i.className) || { className: i.className, billed: 0, discount: 0, lateFee: 0, collected: 0, outstanding: 0, students: new Set() };
      cur.billed += i.amount;
      cur.discount += i.discount;
      cur.lateFee += i.lateFee;
      cur.collected += i.paid;
      cur.outstanding += i.balance;
      cur.students.add(i.studentId);
      byClass.set(i.className, cur);
    }
    const rows = Array.from(byClass.values()).map((r) => ({
      className: r.className,
      students: r.students.size,
      billed: r.billed,
      discount: r.discount,
      lateFee: r.lateFee,
      collected: r.collected,
      outstanding: r.outstanding,
      rate: Math.round((r.collected / Math.max(1, r.billed)) * 1000) / 10,
    }));
    const sorted = sortBy(rows, 'outstanding', 'desc');
    const totals = {
      billed: sum(rows, 'billed'), collected: sum(rows, 'collected'), outstanding: sum(rows, 'outstanding'),
    };

    const node = reportPage({
      title: 'Fee Reports',
      subtitle: `Class-wise collection performance · ${campusName(campusOf(ctx))} · ${AY_LABEL}`,
      route: 'fees/reports',
      filters: [
        { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'q1', label: 'Q1' }, { id: 'q2', label: 'Q2' }, { id: 'ytd', label: 'YTD' }] },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'className', label: 'Class', options: classOptions() },
      ],
      onFilter: (id, v, all2, table) => table && table.refresh(applyFilters(sorted, all2, { searchKeys: ['className'] })),
      summary: [
        { label: 'Billed', value: cmoney(totals.billed), icon: 'receipt', tone: 'info' },
        { label: 'Collected', value: cmoney(totals.collected), delta: 8.1, icon: 'wallet', tone: 'success' },
        { label: 'Outstanding', value: cmoney(totals.outstanding), delta: -3.2, icon: 'alert-circle', tone: 'danger' },
        { label: 'Collection rate', value: formatPercent((totals.collected / Math.max(1, totals.billed)) * 100), icon: 'percent', tone: 'brand' },
      ],
      chart: [
        comboChart({
          categories: analytics.feeCollectionVsTarget.map((r) => r.month),
          bars: [{ name: 'Collected', values: analytics.feeCollectionVsTarget.map((r) => r.collected) }],
          line: { name: 'Target', values: analytics.feeCollectionVsTarget.map((r) => r.target) },
          valueFormat: 'currencyCompact', height: 280,
        }),
        waterfallChart({
          items: [
            { label: 'Billed', value: totals.billed, type: 'start' },
            { label: 'Discounts', value: -sum(rows, 'discount') },
            { label: 'Late fee', value: sum(rows, 'lateFee') },
            { label: 'Collected', value: -totals.collected },
            { label: 'Outstanding', value: totals.outstanding, type: 'total' },
          ],
          valueFormat: 'currencyCompact', height: 280,
        }),
      ],
      chartTitle: 'Collection against target, month by month',
      columns: [
        { key: 'className', label: 'Class', sticky: true, width: 150 },
        { key: 'students', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => num(r.students), value: (r) => r.students, format: (v) => num(v) },
        moneyCol('billed', 'Billed', { width: 150 }),
        moneyCol('discount', 'Discounts', { width: 140 }),
        moneyCol('lateFee', 'Late fee', { width: 130 }),
        moneyCol('collected', 'Collected', { width: 150 }),
        moneyCol('outstanding', 'Outstanding', { width: 150 }),
        { key: 'rate', label: 'Collection %', width: 150, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v), render: (r) => h('div', { className: 'stack-1', style: { minWidth: '110px' } }, h('span', { className: 't-num t-sm' }, formatPercent(r.rate)), ProgressBar(r.rate, { size: 'sm', tone: r.rate > 90 ? 'success' : r.rate > 75 ? 'warning' : 'danger' })) },
      ],
      rows: sorted,
      tableTitle: 'Class-wise collection detail',
      footerAggregates: true,
      notes: Callout({ tone: 'info', icon: 'info', title: 'How these numbers are built' },
        'Billed is the sum of every raised invoice. Collected is money actually received against those invoices. Outstanding excludes invoices that have not yet been raised for Q3 and Q4.'),
    });
    mount.appendChild(node);
  },
};

/* ========================================================================== */
/*  FINANCE                                                                   */
/* ========================================================================== */

const ACCOUNT_TONE = { Asset: 'info', Liability: 'warning', Income: 'success', Expense: 'danger', Equity: 'brand' };

function accountChildren(parentId) {
  return db.accounts.filter((a) => a.parent === parentId);
}

/** All non-group ledgers, for pickers. */
function ledgerOptions() {
  return db.accounts.filter((a) => !a.group).map((a) => ({ value: a.id, label: `${a.code} · ${a.name}` }));
}

/* ============================================ finance/chart-of-accounts === */

routes['finance/chart-of-accounts'] = {
  title: 'Chart of Accounts',
  subtitle: 'The ledger hierarchy every voucher posts into',
  section: 'finance',
  render(mount, ctx) {
    ensureStyles();
    const open = new Set(db.accounts.filter((a) => !a.parent).map((a) => a.id));
    const treeHost = h('div', { className: 'fin-tree' });

    const accountForm = (acc) => formPage({
      mode: 'modal', size: 'lg',
      title: acc ? `Edit ${acc.name}` : 'New ledger account',
      subtitle: 'Accounts follow the standard school chart: 1000 assets, 2000 liabilities, 3000 income, 4000 expenses',
      submitLabel: acc ? 'Save account' : 'Create account',
      values: acc ? { code: acc.code, name: acc.name, type: acc.type, parent: acc.parent, opening: String(acc.balance) } : {},
      sections: [{
        title: 'Account', cols: 2,
        fields: [
          { id: 'code', label: 'Account code', required: true, placeholder: '4800', validate: validators.required },
          { id: 'name', label: 'Account name', required: true, placeholder: 'e.g. Staff Welfare', validate: validators.required },
          { id: 'type', label: 'Type', type: 'select', required: true, options: ['Asset', 'Liability', 'Income', 'Expense', 'Equity'] },
          { id: 'parent', label: 'Parent group', type: 'combobox', options: db.accounts.filter((a) => a.group).map((a) => ({ value: a.id, label: `${a.code} · ${a.name}` })) },
          { id: 'opening', label: 'Opening balance', type: 'number', prefix: '₹' },
          { id: 'isGroup', label: 'Group account', type: 'switch', switchLabel: 'This is a heading, not a posting ledger' },
          { id: 'notes', label: 'Notes', type: 'textarea', span: 'full', placeholder: 'What belongs in this ledger?' },
        ],
      }],
      onSubmit: (v) => notify({ title: acc ? 'Account updated' : 'Account created', text: `${v.code} · ${v.name}`, tone: 'success' }),
    });

    const paintTree = () => {
      treeHost.innerHTML = '';
      const walk = (parentId, depth) => {
        for (const a of accountChildren(parentId)) {
          const kids = accountChildren(a.id);
          const isOpen = open.has(a.id);
          treeHost.appendChild(h('div', {
            className: 'fin-node', dataset: { group: String(!!a.group) },
            style: { paddingLeft: `calc(var(--sp-3) + ${depth * 22}px)` },
          },
            kids.length
              ? h('button', {
                className: 'fin-twist', type: 'button', dataset: { open: String(isOpen) },
                attrs: { 'aria-label': `${isOpen ? 'Collapse' : 'Expand'} ${a.name}`, 'aria-expanded': String(isOpen) },
                onClick: () => { if (isOpen) open.delete(a.id); else open.add(a.id); paintTree(); },
                html: icon('chevron-right', 14),
              })
              : h('span', { className: 'fin-twist' }),
            h('span', { className: 'fin-node-code' }, a.code),
            h('span', { className: 'flex-1 t-truncate' }, a.name),
            Badge(a.type, { tone: ACCOUNT_TONE[a.type] || 'neutral', outline: true, size: 'sm' }),
            a.group ? Badge(`${kids.length} ledgers`, { tone: 'neutral', size: 'sm' }) : null,
            h('span', { className: 'fin-node-bal t-num t-medium' }, money(a.balance)),
            MenuButton([
              { label: 'Open ledger', icon: 'notebook', route: 'finance/ledger' },
              { label: 'Edit account', icon: 'edit', onClick: () => accountForm(a) },
              { label: 'Add child account', icon: 'plus', onClick: () => accountForm(null) },
              { separator: true },
              { label: 'Deactivate', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: `Deactivate ${a.name}?`, text: 'Accounts with a non-zero balance cannot be deactivated.', tone: 'danger', confirmLabel: 'Deactivate' }).then((ok) => ok && notify({ title: 'Account deactivated', tone: 'warning' })) },
            ], { icon: 'more-horizontal', size: 'sm', label: 'Account actions', align: 'right' })));
          if (kids.length && isOpen) walk(a.id, depth + 1);
        }
      };
      walk(null, 0);
    };
    paintTree();

    const byType = ['Asset', 'Liability', 'Income', 'Expense'].map((t) => ({
      key: t, value: db.accounts.filter((a) => a.type === t && !a.parent).reduce((s, a) => s + a.balance, 0),
    }));

    mount.appendChild(page({
      title: 'Chart of Accounts',
      subtitle: `${db.accounts.length} accounts · ${db.accounts.filter((a) => a.group).length} groups · ${db.accounts.filter((a) => !a.group).length} posting ledgers`,
      route: 'finance/chart-of-accounts',
      actions: [
        Button('Trial balance', { variant: 'secondary', icon: 'scale', route: 'finance/trial-balance' }),
        Button('New account', { variant: 'primary', icon: 'plus', onClick: () => accountForm(null) }),
      ],
      children: [
        kpiRow([
          { label: 'Total assets', value: cmoney(byType[0].value), icon: 'building-columns', tone: 'info' },
          { label: 'Total liabilities', value: cmoney(byType[1].value), icon: 'scale', tone: 'warning' },
          { label: 'Income (YTD)', value: cmoney(byType[2].value), icon: 'trending-up', tone: 'success' },
          { label: 'Expenses (YTD)', value: cmoney(byType[3].value), icon: 'trending-down', tone: 'danger' },
        ]),
        h('div', { className: 'widget-grid' },
          h('div', { className: 'span-8' }, (() => {
            const card = SectionCard({
              title: 'Ledger hierarchy',
              subtitle: 'Click the chevron to expand a group; balances are cumulative for the year',
              icon: 'layers', flush: true,
              actions: h('div', { className: 'row' },
                Button('Expand all', { variant: 'ghost', size: 'sm', onClick: () => { db.accounts.forEach((a) => open.add(a.id)); paintTree(); } }),
                Button('Collapse all', { variant: 'ghost', size: 'sm', onClick: () => { open.clear(); db.accounts.filter((a) => !a.parent).forEach((a) => open.add(a.id)); paintTree(); } }),
                Button('Export', { variant: 'ghost', size: 'sm', icon: 'download', onClick: () => { download('chart-of-accounts.csv', toCsv(db.accounts, [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'type', label: 'Type' }, { key: 'balance', label: 'Balance' }]), 'text/csv;charset=utf-8'); notify({ title: 'Chart exported', tone: 'success' }); } })),
            });
            card.querySelector('.card-body').appendChild(h('div', { className: 'fin-scroll' }, treeHost));
            return card;
          })()),
          h('div', { className: 'span-4' }, h('div', { className: 'stack-3' },
            SectionCard({ title: 'Balance by account type', className: 'chart-card' },
              donutChart({ data: byType, height: 240, valueFormat: 'currencyCompact', centerLabel: 'Accounts', centerValue: String(db.accounts.length) })),
            SectionCard({ title: 'Largest ledgers', icon: 'sort-desc' },
              RankList(sortBy(db.accounts.filter((a) => !a.group), 'balance', 'desc').slice(0, 8)
                .map((a) => ({ name: a.name, meta: `${a.code} · ${a.type}`, value: cmoney(a.balance) })))),
            Callout({ tone: 'info', icon: 'info', title: 'Posting rules' },
              'Only leaf accounts accept vouchers. Group accounts roll up their children and are used for the trial balance and P&L.')))),
      ],
    }));
  },
};

/* ==================================================== finance/income ====== */

routes['finance/income'] = {
  title: 'Income',
  subtitle: 'Every rupee received, mapped to an income ledger',
  section: 'finance',
  render(mount, ctx) {
    ensureStyles();
    const campusMap = CAMPUS_MAP();
    const ledgerFor = (p) => (p.mode === 'Cash' ? 'Tuition Fee Income' : pickFor(['Tuition Fee Income', 'Tuition Fee Income', 'Tuition Fee Income', 'Transport Income', 'Hostel & Mess Income', 'Other Income'], p.id));
    const rows = db.payments.filter((p) => p.status === 'Success').slice(0, 2400).map((p) => ({
      id: p.id,
      date: p.date,
      month: p.month,
      voucherNo: p.receiptNo,
      source: 'Fee collection',
      ledger: ledgerFor(p),
      party: p.studentName,
      studentId: p.studentId,
      className: p.className,
      campusId: p.campusId,
      campus: campusMap[p.campusId],
      amount: p.amount,
      mode: p.mode,
      reference: p.reference,
      status: 'Posted',
    }));
    const searchKeys = ['voucherNo', 'party', 'ledger', 'reference'];
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const byMonth = months.map((m) => rows.filter((r) => r.month === m).reduce((a, r) => a + r.amount, 0));

    mount.appendChild(listPage({
      title: 'Income',
      subtitle: `${num(rows.length)} receipts posted · ${cmoney(sum(rows, 'amount'))} recognised this year`,
      route: 'finance/income',
      actions: [
        Button('Ledger', { variant: 'secondary', icon: 'notebook', route: 'finance/ledger' }),
        Button('Record other income', { variant: 'primary', icon: 'plus', onClick: () => formPage({
          mode: 'modal', size: 'lg', title: 'Record other income',
          subtitle: 'Hall rentals, sponsorships, donations and interest income',
          submitLabel: 'Post entry',
          sections: [{ title: 'Receipt', cols: 2, fields: [
            { id: 'date', label: 'Date', type: 'date', required: true, value: TODAY },
            { id: 'ledger', label: 'Income ledger', type: 'combobox', required: true, options: db.accounts.filter((a) => a.type === 'Income' && !a.group).map((a) => ({ value: a.id, label: a.name })) },
            { id: 'party', label: 'Received from', required: true, validate: validators.required },
            { id: 'amount', label: 'Amount', type: 'number', required: true, prefix: '₹', validate: validators.number },
            { id: 'mode', label: 'Mode', type: 'select', options: ['Cash', 'Cheque', 'NEFT', 'UPI'] },
            { id: 'bank', label: 'Deposit into', type: 'select', options: db.bankAccounts.map((b) => ({ value: b.id, label: b.name })) },
            { id: 'narration', label: 'Narration', type: 'textarea', span: 'full', required: true, validate: validators.required },
          ] }],
          onSubmit: (v) => notify({ title: 'Income posted', text: money(Number(v.amount) || 0), tone: 'success' }),
        }) }),
      ],
      kpis: [
        { label: 'Income YTD', value: cmoney(sum(rows, 'amount')), icon: 'trending-up', tone: 'success', trend: analytics.sparks.revenue, delta: 8.1 },
        { label: 'Fee income', value: cmoney(rows.filter((r) => r.ledger === 'Tuition Fee Income').reduce((a, r) => a + r.amount, 0)), icon: 'wallet', tone: 'brand' },
        { label: 'Transport & hostel', value: cmoney(rows.filter((r) => r.ledger !== 'Tuition Fee Income' && r.ledger !== 'Other Income').reduce((a, r) => a + r.amount, 0)), icon: 'bus', tone: 'info' },
        { label: 'Other income', value: cmoney(rows.filter((r) => r.ledger === 'Other Income').reduce((a, r) => a + r.amount, 0)), icon: 'gift', tone: 'warning' },
      ],
      chart: comboChart({
        categories: analytics.revenueVsExpense.slice(0, 5).map((r) => r.month),
        bars: [
          { name: 'Revenue', values: analytics.revenueVsExpense.slice(0, 5).map((r) => r.revenue) },
          { name: 'Expense', values: analytics.revenueVsExpense.slice(0, 5).map((r) => r.expense) },
        ],
        line: { name: 'Surplus', values: analytics.revenueVsExpense.slice(0, 5).map((r) => r.surplus) },
        valueFormat: 'currencyCompact', height: 270,
      }),
      chartTitle: 'Revenue against expense, month by month',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Voucher, party or reference...', width: '280px' },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'ledger', label: 'Ledger', options: distinct(rows, 'ledger') },
        { id: 'mode', label: 'Mode', options: distinct(rows, 'mode') },
        { id: 'from', label: 'From', type: 'date' },
        { id: 'to', label: 'To', type: 'date' },
      ],
      onFilter: (id, v, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys, dateKey: 'date' })),
      columns: [
        { key: 'voucherNo', label: 'Voucher', sticky: true, width: 160, render: (r) => h('span', { className: 't-mono t-xs' }, r.voucherNo) },
        dateCol('date', 'Date'),
        { key: 'ledger', label: 'Income ledger', width: 200, filter: true },
        { key: 'party', label: 'Received from', width: 200, render: (r) => Identity(r.party, r.className, { size: 'sm' }) },
        { key: 'campus', label: 'Campus', width: 170, filter: true },
        { key: 'mode', label: 'Mode', width: 130, filter: true, render: (r) => Badge(r.mode, { tone: 'info' }) },
        { key: 'reference', label: 'Reference', width: 160, render: (r) => h('span', { className: 't-mono t-xs' }, r.reference), hidden: true },
        moneyCol('amount', 'Amount', { width: 150 }),
        statusCol('status', 'Status', 110),
      ],
      rows,
      selectable: true, footerAggregates: true, searchKeys, pageSize: 50,
      bulkActions: [
        { label: 'Export to Tally', icon: 'download', onClick: (sel) => notify({ title: 'Tally XML generated', text: `${sel.length} vouchers`, tone: 'success' }) },
        { label: 'Reclassify ledger', icon: 'layers', onClick: (sel) => notify({ title: `${sel.length} entries reclassified`, tone: 'info' }) },
      ],
      rowActions: (row) => [
        { label: 'Open receipt', icon: 'receipt', route: 'fees/receipts' },
        { label: 'Open student', icon: 'graduation-cap', route: `students/profile/${row.studentId}` },
        { label: 'View in ledger', icon: 'notebook', route: 'finance/ledger' },
      ],
      tableTitle: 'Income register',
      tableSubtitle: `Monthly totals: ${months.map((m, i) => `${m} ${cmoney(byMonth[i])}`).join(' · ')}`,
      exportName: 'finance-income',
      emptyState: emptyFor('No income posted', 'Fee receipts post here automatically as soon as they are issued.'),
    }));
  },
};

/* ================================================== finance/expenses ====== */

function expenseForm(existing) {
  return formPage({
    mode: 'modal', size: 'lg',
    title: existing ? 'Edit ' + existing.voucherNo : 'New expense voucher',
    subtitle: 'Expenses above ₹50,000 route to the Principal for approval',
    submitLabel: existing ? 'Save voucher' : 'Submit for approval',
    values: existing ? { date: existing.date, category: existing.category, amount: String(existing.amount), vendorId: existing.vendorId, description: existing.description, paymentMode: existing.paymentMode } : { date: TODAY, paymentMode: 'NEFT' },
    sections: [
      {
        title: 'Voucher', cols: 2,
        fields: [
          { id: 'date', label: 'Date', type: 'date', required: true },
          { id: 'category', label: 'Expense head', type: 'select', required: true, options: ['Salaries & Wages', 'Utilities', 'Transport Operations', 'Maintenance & Repairs', 'Academic Supplies', 'Marketing & Admissions', 'Administrative Overheads'] },
          { id: 'vendorId', label: 'Vendor', type: 'combobox', options: db.vendors.map((v) => ({ value: v.id, label: `${v.name} · ${v.category}` })) },
          { id: 'campusId', label: 'Campus', type: 'select', options: campusOptions() },
          { id: 'amount', label: 'Amount (before GST)', type: 'number', required: true, prefix: '₹', validate: validators.number },
          { id: 'gst', label: 'GST %', type: 'select', options: ['0', '5', '12', '18', '28'], value: '18' },
          { id: 'description', label: 'Description', type: 'textarea', span: 'full', required: true, validate: validators.required, placeholder: 'What was purchased, and for which department?' },
        ],
      },
      {
        title: 'Payment', cols: 2,
        fields: [
          { id: 'paymentMode', label: 'Payment mode', type: 'select', required: true, options: ['NEFT', 'Cheque', 'UPI', 'Cash', 'Corporate Card'] },
          { id: 'bankAccount', label: 'Pay from', type: 'select', options: db.bankAccounts.map((b) => ({ value: b.id, label: `${b.name} · ${b.accountMasked}` })) },
          { id: 'tds', label: 'TDS deducted', type: 'switch', switchLabel: 'Deduct TDS under 194C / 194J' },
          { id: 'budgetHead', label: 'Budget head', type: 'select', options: db.budgets.map((b) => ({ value: b.id, label: b.head })) },
          { id: 'attachment', label: 'Invoice / bill', type: 'file', span: 'full' },
        ],
      },
    ],
    onSubmit: (v) => notify({ title: existing ? 'Voucher updated' : 'Expense submitted', text: `${v.category} · ${money(Number(v.amount) || 0)}`, tone: 'success' }),
  });
}

routes['finance/expenses'] = {
  title: 'Expenses',
  subtitle: 'Expense vouchers, approvals and category analysis',
  section: 'finance',
  render(mount, ctx) {
    ensureStyles();
    const campusMap = CAMPUS_MAP();
    const rows = db.expenses.map((e) => ({
      ...e,
      campus: campusMap[e.campusId],
      vendorName: (byId(db.vendors, e.vendorId) || {}).name || '—',
      gstAmount: Math.round((e.amount * e.gst) / 100),
      total: e.amount + Math.round((e.amount * e.gst) / 100),
    }));
    const searchKeys = ['voucherNo', 'description', 'vendorName', 'category'];
    const pending = rows.filter((r) => r.status === 'Pending Approval');

    mount.appendChild(listPage({
      title: 'Expenses',
      subtitle: `${num(rows.length)} vouchers · ${cmoney(sum(rows, 'total'))} incurred · ${num(pending.length)} awaiting approval`,
      route: 'finance/expenses',
      actions: [
        Button('Budgets', { variant: 'secondary', icon: 'target', route: 'finance/budgets' }),
        Button('Vendors', { variant: 'secondary', icon: 'truck', route: 'finance/vendors' }),
        Button('New expense', { variant: 'primary', icon: 'plus', onClick: () => expenseForm(null) }),
      ],
      kpis: [
        { label: 'Expenses YTD', value: cmoney(sum(rows, 'total')), icon: 'trending-down', tone: 'danger', trend: analytics.sparks.expense, delta: 5.7 },
        { label: 'Awaiting approval', value: num(pending.length), icon: 'clock', tone: 'warning', footer: cmoney(sum(pending, 'total')) + ' in the queue' },
        { label: 'Paid', value: cmoney(rows.filter((r) => r.status === 'Paid').reduce((a, r) => a + r.total, 0)), icon: 'check-circle', tone: 'success' },
        { label: 'Input GST credit', value: cmoney(sum(rows, 'gstAmount')), icon: 'percent', tone: 'info', footer: 'Claimable where the vendor files' },
      ],
      chart: barChart({
        categories: analytics.expenseByCategory.map((r) => r.key),
        series: [{ name: 'Spend', values: analytics.expenseByCategory.map((r) => r.value) }],
        horizontal: true, valueFormat: 'currencyCompact', height: 280,
      }),
      chartTitle: 'Spend by expense head',
      tabs: [
        { id: 'all', label: 'All', count: rows.length },
        { id: 'Pending Approval', label: 'Pending approval', count: pending.length },
        { id: 'Approved', label: 'Approved', count: rows.filter((r) => r.status === 'Approved').length },
        { id: 'Paid', label: 'Paid', count: rows.filter((r) => r.status === 'Paid').length },
        { id: 'Rejected', label: 'Rejected', count: rows.filter((r) => r.status === 'Rejected').length },
      ],
      activeTab: 'all',
      onTabChange: tabRefresh(mount, rows, (r, id) => r.status === id),
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Voucher, vendor or description...', width: '280px' },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'category', label: 'Head', options: distinct(rows, 'category') },
        { id: 'paymentMode', label: 'Mode', options: distinct(rows, 'paymentMode') },
        { id: 'status', label: 'Status', options: ['Approved', 'Paid', 'Pending Approval', 'Rejected'] },
        { id: 'from', label: 'From', type: 'date' },
        { id: 'to', label: 'To', type: 'date' },
      ],
      onFilter: (id, v, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys, dateKey: 'date' })),
      columns: [
        { key: 'voucherNo', label: 'Voucher', sticky: true, width: 140, render: (r) => h('span', { className: 't-mono t-xs' }, r.voucherNo) },
        dateCol('date', 'Date'),
        { key: 'category', label: 'Head', width: 190, filter: true },
        { key: 'vendorName', label: 'Vendor', width: 200, filter: true },
        { key: 'description', label: 'Description', width: 260 },
        { key: 'campus', label: 'Campus', width: 170, filter: true, hidden: true },
        moneyCol('amount', 'Base', { width: 140 }),
        moneyCol('gstAmount', 'GST', { width: 120 }),
        moneyCol('total', 'Total', { width: 150 }),
        { key: 'paymentMode', label: 'Mode', width: 130, filter: true },
        { key: 'attachment', label: 'Bill', width: 90, render: (r) => (r.attachment ? IconButton('paperclip', { label: 'View bill', size: 'sm', onClick: mockAction('Open attachment') }) : h('span', { className: 't-muted' }, '—')), value: (r) => (r.attachment ? 'Yes' : 'No') },
        statusCol('status', 'Status', 150),
      ],
      rows,
      selectable: true, footerAggregates: true, searchKeys, pageSize: 50,
      bulkActions: [
        { label: 'Approve selected', icon: 'check', onClick: (sel) => ConfirmDialog({ title: `Approve ${sel.length} vouchers?`, text: `${money(sel.reduce((a, r) => a + r.total, 0))} will be released for payment.`, confirmLabel: 'Approve', tone: 'brand', icon: 'check-circle' }).then((ok) => ok && notify({ title: `${sel.length} vouchers approved`, tone: 'success' })) },
        { label: 'Mark as paid', icon: 'banknote', onClick: (sel) => notify({ title: `${sel.length} vouchers marked paid`, tone: 'success' }) },
        { label: 'Reject', icon: 'x', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Reject ${sel.length} vouchers?`, tone: 'danger', confirmLabel: 'Reject' }).then((ok) => ok && notify({ title: 'Vouchers rejected', tone: 'danger' })) },
      ],
      rowActions: (row) => [
        { label: 'Open voucher', icon: 'eye', onClick: () => Drawer({
          title: row.voucherNo, subtitle: `${row.category} · ${money(row.total)}`, size: 'lg',
          body: h('div', { className: 'stack-4' },
            DescriptionList([
              ['Date', formatDate(row.date)], ['Head', row.category], ['Vendor', row.vendorName],
              ['Campus', row.campus], ['Description', row.description], ['Base amount', money(row.amount)],
              ['GST', `${row.gst}% · ${money(row.gstAmount)}`], ['Total', money(row.total)],
              ['Payment mode', row.paymentMode], ['Status', Badge(row.status)],
            ], { cols: 2 }),
            SectionCard({ title: 'Approval trail', icon: 'workflow' },
              ApprovalTrail([
                { label: 'Voucher raised', by: 'Accounts executive', date: formatDate(row.date), state: 'done' },
                { label: 'Head of Accounts', by: 'Suresh Iyer', date: formatDate(row.date), state: row.status === 'Pending Approval' ? 'current' : 'done' },
                { label: 'Principal sign-off', by: 'Dr. Meera Krishnan', date: row.status === 'Paid' || row.status === 'Approved' ? formatDate(row.date) : 'Pending', state: row.status === 'Rejected' ? 'rejected' : (row.status === 'Paid' || row.status === 'Approved') ? 'done' : 'todo' },
                { label: 'Payment released', by: 'Bank — HDFC Current', date: row.status === 'Paid' ? formatDate(row.date) : 'Pending', state: row.status === 'Paid' ? 'done' : 'todo' },
              ])),
            row.attachment ? SectionCard({ title: 'Attachments', icon: 'paperclip' }, FileList([{ name: row.attachment, size: '184 KB', type: 'PDF', date: formatDate(row.date), status: 'Verified' }], { onDownload: mockAction('Download bill') })) : null),
          actions: (close) => frag(
            Button('Close', { variant: 'secondary', onClick: close }),
            Button('Reject', { variant: 'ghost', icon: 'x', onClick: () => { close(); notify({ title: 'Voucher rejected', tone: 'danger' }); } }),
            Button('Approve', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Voucher approved', text: row.voucherNo, tone: 'success' }); } })),
        }) },
        { label: 'Edit', icon: 'edit', onClick: () => expenseForm(row) },
        { label: 'Open vendor', icon: 'truck', route: 'finance/vendors' },
        { separator: true },
        { label: 'Delete voucher', icon: 'trash', tone: 'danger', onClick: () => ConfirmDialog({ title: `Delete ${row.voucherNo}?`, text: 'This cannot be undone and is written to the audit log.', tone: 'danger', confirmLabel: 'Delete' }).then((ok) => ok && notify({ title: 'Voucher deleted', tone: 'danger' })) },
      ],
      tableTitle: 'Expense register',
      exportName: 'finance-expenses',
      emptyState: emptyFor('No expenses recorded', 'Raise the first expense voucher to start tracking spend against budget.', Button('New expense', { variant: 'primary', icon: 'plus', onClick: () => expenseForm(null) })),
    }));
  },
};

/* ================================================== finance/vouchers ====== */

function voucherEntryForm() {
  const lines = [
    { account: '', debit: 0, credit: 0 },
    { account: '', debit: 0, credit: 0 },
  ];
  const totalsEl = h('div', { className: 'row-4 row-wrap' });
  const linesHost = h('div', { className: 'stack-2' });

  const syncTotals = () => {
    const dr = lines.reduce((a, l) => a + (Number(l.debit) || 0), 0);
    const cr = lines.reduce((a, l) => a + (Number(l.credit) || 0), 0);
    totalsEl.innerHTML = '';
    totalsEl.appendChild(MetricRow('Total debit', h('span', { className: 't-num t-semibold' }, money(dr))));
    totalsEl.appendChild(MetricRow('Total credit', h('span', { className: 't-num t-semibold' }, money(cr))));
    totalsEl.appendChild(MetricRow('Difference', h('span', { className: dr === cr ? 't-num t-success t-semibold' : 't-num t-danger t-semibold' }, money(Math.abs(dr - cr)))));
    totalsEl.appendChild(Badge(dr === cr && dr > 0 ? 'Balanced' : 'Out of balance', { tone: dr === cr && dr > 0 ? 'success' : 'danger' }));
  };

  const paintLines = () => {
    linesHost.innerHTML = '';
    lines.forEach((l, idx) => {
      linesHost.appendChild(h('div', { className: 'fin-mode-fields' },
        Field({ label: idx === 0 ? 'Account' : null },
          Combobox({ options: ledgerOptions(), value: l.account, placeholder: 'Select ledger', onChange: (v) => { l.account = v; } })),
        Field({ label: idx === 0 ? 'Debit' : null },
          Input({ type: 'number', numeric: true, prefix: '₹', placeholder: '0', onInput: (v) => { l.debit = Number(v) || 0; syncTotals(); } })),
        Field({ label: idx === 0 ? 'Credit' : null },
          Input({ type: 'number', numeric: true, prefix: '₹', placeholder: '0', onInput: (v) => { l.credit = Number(v) || 0; syncTotals(); } })),
        Field({ label: idx === 0 ? ' ' : null },
          Button('Remove', { variant: 'ghost', icon: 'trash', disabled: lines.length <= 2, onClick: () => { lines.splice(idx, 1); paintLines(); syncTotals(); } }))));
    });
  };
  paintLines();
  syncTotals();

  return Modal({
    title: 'New voucher',
    subtitle: 'Double-entry: total debits must equal total credits before the voucher can be posted',
    size: 'xl', icon: 'receipt',
    body: h('div', { className: 'stack-4' },
      FormGrid({ cols: 4 },
        Field({ label: 'Voucher type', required: true }, Select({ options: ['Payment', 'Receipt', 'Journal', 'Contra', 'Credit Note', 'Debit Note'], value: 'Journal' })),
        Field({ label: 'Date', required: true }, DatePicker({ value: TODAY })),
        Field({ label: 'Voucher no' }, Input({ value: 'JOU/26/0261', readOnly: true })),
        Field({ label: 'Campus' }, Select({ options: campusOptions() }))),
      SectionCard({ title: 'Entries', icon: 'layers', actions: Button('Add line', { variant: 'ghost', size: 'sm', icon: 'plus', onClick: () => { lines.push({ account: '', debit: 0, credit: 0 }); paintLines(); syncTotals(); } }) },
        h('div', { className: 'stack-3' }, linesHost, Divider(), totalsEl)),
      Field({ label: 'Narration', required: true },
        Textarea({ rows: 2, placeholder: 'Being ... (this text prints on the voucher and appears in the day book)' }))),
    actions: (close) => frag(
      Button('Cancel', { variant: 'secondary', onClick: close }),
      Button('Save as draft', { variant: 'ghost', icon: 'clipboard', onClick: () => { close(); notify({ title: 'Voucher saved as draft', tone: 'info' }); } }),
      Button('Post voucher', { variant: 'primary', icon: 'check', onClick: () => {
        const dr = lines.reduce((a, l) => a + (Number(l.debit) || 0), 0);
        const cr = lines.reduce((a, l) => a + (Number(l.credit) || 0), 0);
        if (!dr || dr !== cr) { notify({ title: 'Voucher is out of balance', text: 'Debits and credits must match before posting.', tone: 'danger' }); return; }
        close();
        notify({ title: 'Voucher posted', text: `${money(dr)} across ${lines.length} lines`, tone: 'success' });
      } })),
  });
}

routes['finance/vouchers'] = {
  title: 'Vouchers',
  subtitle: 'Payment, receipt, journal and contra vouchers',
  section: 'finance',
  render(mount, ctx) {
    ensureStyles();
    const campusMap = CAMPUS_MAP();
    const rows = db.vouchers.map((v) => ({ ...v, campus: campusMap[v.campusId], preparedByName: pickFor(['Ritu Malhotra', 'Suresh Iyer', 'Anand Nair', 'Kavita Rao'], v.id) }));
    const searchKeys = ['voucherNo', 'narration', 'debitAccount', 'creditAccount'];

    mount.appendChild(listPage({
      title: 'Vouchers',
      subtitle: `${num(rows.length)} vouchers · ${cmoney(sum(rows, 'amount'))} posted · ${AY_LABEL}`,
      route: 'finance/vouchers',
      actions: [
        Button('Day book', { variant: 'secondary', icon: 'book', route: 'finance/day-book' }),
        Button('New voucher', { variant: 'primary', icon: 'plus', onClick: () => voucherEntryForm() }),
      ],
      kpis: [
        { label: 'Vouchers', value: num(rows.length), icon: 'receipt', tone: 'brand' },
        { label: 'Posted value', value: cmoney(rows.filter((r) => r.status === 'Posted').reduce((a, r) => a + r.amount, 0)), icon: 'check-circle', tone: 'success' },
        { label: 'Drafts', value: num(rows.filter((r) => r.status === 'Draft').length), icon: 'clipboard', tone: 'warning', footer: 'Not yet in the ledger' },
        { label: 'Cancelled', value: num(rows.filter((r) => r.status === 'Cancelled').length), icon: 'x-circle', tone: 'danger' },
      ],
      chart: donutChart({
        data: countBy(rows, 'type').map((r) => ({ key: r.key, value: r.value })),
        height: 250, centerValue: num(rows.length), centerLabel: 'Vouchers',
      }),
      chartTitle: 'Vouchers by type',
      tabs: [
        { id: 'all', label: 'All', count: rows.length },
        { id: 'Payment', label: 'Payment', count: rows.filter((r) => r.type === 'Payment').length },
        { id: 'Receipt', label: 'Receipt', count: rows.filter((r) => r.type === 'Receipt').length },
        { id: 'Journal', label: 'Journal', count: rows.filter((r) => r.type === 'Journal').length },
        { id: 'Contra', label: 'Contra', count: rows.filter((r) => r.type === 'Contra').length },
      ],
      activeTab: 'all',
      onTabChange: tabRefresh(mount, rows, (r, id) => r.type === id),
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Voucher no, narration or account...', width: '300px' },
        { id: 'type', label: 'Type', options: distinct(rows, 'type') },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'status', label: 'Status', options: ['Posted', 'Draft', 'Cancelled'] },
        { id: 'from', label: 'From', type: 'date' },
        { id: 'to', label: 'To', type: 'date' },
      ],
      onFilter: (id, v, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys, dateKey: 'date' })),
      columns: [
        { key: 'voucherNo', label: 'Voucher no', sticky: true, width: 150, render: (r) => h('span', { className: 't-mono t-xs' }, r.voucherNo) },
        { key: 'type', label: 'Type', width: 120, filter: true, render: (r) => Badge(r.type, { tone: r.type === 'Receipt' ? 'success' : r.type === 'Payment' ? 'warning' : 'info' }) },
        dateCol('date', 'Date'),
        { key: 'debitAccount', label: 'Debit', width: 220, filter: true },
        { key: 'creditAccount', label: 'Credit', width: 220, filter: true },
        moneyCol('amount', 'Amount', { width: 150 }),
        { key: 'narration', label: 'Narration', width: 300 },
        { key: 'campus', label: 'Campus', width: 170, filter: true, hidden: true },
        { key: 'preparedByName', label: 'Prepared by', width: 160, hidden: true },
        statusCol('status', 'Status', 120),
      ],
      rows,
      selectable: true, footerAggregates: true, searchKeys, pageSize: 50,
      expandable: (row) => h('div', { className: 'fin-scroll' },
        h('table', { className: 'fin-statement' },
          h('thead', null, h('tr', null, h('th', null, 'Particulars'), h('th', { className: 'num' }, 'Debit'), h('th', { className: 'num' }, 'Credit'))),
          h('tbody', null,
            h('tr', null, h('td', null, row.debitAccount), h('td', { className: 'num' }, money(row.amount)), h('td', { className: 'num' }, '—')),
            h('tr', { dataset: { level: 'sub' } }, h('td', null, 'To ' + row.creditAccount), h('td', { className: 'num' }, '—'), h('td', { className: 'num' }, money(row.amount)))),
          h('tfoot', null, h('tr', { dataset: { level: 'total' } }, h('td', null, row.narration), h('td', { className: 'num' }, money(row.amount)), h('td', { className: 'num' }, money(row.amount)))))),
      bulkActions: [
        { label: 'Post selected', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} vouchers posted`, tone: 'success' }) },
        { label: 'Print', icon: 'print', onClick: (sel) => notify({ title: `Printing ${sel.length} vouchers`, tone: 'info' }) },
        { label: 'Cancel', icon: 'x-circle', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Cancel ${sel.length} vouchers?`, text: 'A reversing entry is posted for each.', tone: 'danger', confirmLabel: 'Cancel vouchers' }).then((ok) => ok && notify({ title: 'Vouchers cancelled', tone: 'warning' })) },
      ],
      rowActions: (row) => [
        { label: 'Print voucher', icon: 'print', onClick: mockAction('Print voucher') },
        { label: 'View in ledger', icon: 'notebook', route: 'finance/ledger' },
        { label: 'Duplicate', icon: 'copy', onClick: () => notify({ title: 'Voucher duplicated as draft', tone: 'success' }) },
        { separator: true },
        { label: 'Cancel voucher', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: `Cancel ${row.voucherNo}?`, text: 'A reversing journal entry will be posted on today’s date.', tone: 'danger', confirmLabel: 'Cancel voucher' }).then((ok) => ok && notify({ title: 'Voucher cancelled', tone: 'warning' })) },
      ],
      tableTitle: 'Voucher register',
      tableSubtitle: 'Expand a row to see the double-entry posting',
      exportName: 'finance-vouchers',
      emptyState: emptyFor('No vouchers', 'Post the first voucher to open the books for this year.', Button('New voucher', { variant: 'primary', icon: 'plus', onClick: () => voucherEntryForm() })),
    }));
  },
};

/* ==================================================== finance/ledger ====== */

function ledgerEntries(accountName) {
  const out = [];
  for (const v of db.vouchers) {
    if (v.status === 'Cancelled') continue;
    if (v.debitAccount === accountName) out.push({ id: v.id + 'd', date: v.date, voucherNo: v.voucherNo, type: v.type, particulars: v.creditAccount, narration: v.narration, debit: v.amount, credit: 0 });
    if (v.creditAccount === accountName) out.push({ id: v.id + 'c', date: v.date, voucherNo: v.voucherNo, type: v.type, particulars: v.debitAccount, narration: v.narration, debit: 0, credit: v.amount });
  }
  for (const e of db.expenses) {
    const acc = byId(db.accounts, e.accountId);
    if (acc && acc.name === accountName) {
      out.push({ id: e.id, date: e.date, voucherNo: e.voucherNo, type: 'Payment', particulars: (byId(db.vendors, e.vendorId) || {}).name || 'Vendor', narration: e.description, debit: e.amount, credit: 0 });
    }
  }
  return sortBy(out, 'date', 'asc');
}

routes['finance/ledger'] = {
  title: 'Ledger',
  subtitle: 'Account-wise entries with a running balance',
  section: 'finance',
  render(mount, ctx) {
    ensureStyles();
    const ledgers = db.accounts.filter((a) => !a.group);
    let current = byId(ledgers, ctx.param) || ledgers.find((a) => a.name === 'Tuition Fee Income') || ledgers[0];
    const host = h('div', { className: 'stack' });

    function paint() {
      host.innerHTML = '';
      const entries = ledgerEntries(current.name);
      let running = current.balance - entries.reduce((a, e) => a + e.debit - e.credit, 0);
      const rows = entries.map((e) => {
        running += e.debit - e.credit;
        return { ...e, balance: running };
      });

      host.appendChild(Card({ className: 'p-0' }, FilterBar({
        filters: [
          { id: 'account', label: 'Ledger', width: '320px', value: current.id, allLabel: 'Pick a ledger',
            options: ledgers.map((a) => ({ value: a.id, label: `${a.code} · ${a.name}` })) },
          { id: 'from', label: 'From', type: 'date' },
          { id: 'to', label: 'To', type: 'date' },
        ],
        onChange: (id, v) => { if (id === 'account' && v !== 'all') { current = byId(ledgers, v) || current; paint(); } },
        actions: h('div', { className: 'row' },
          Button('Print ledger', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(host, `${current.name} — Ledger`) }),
          Button('Export', { variant: 'secondary', size: 'sm', icon: 'download', onClick: () => { download(`ledger-${current.code}.csv`, toCsv(rows, [{ key: 'date', label: 'Date' }, { key: 'voucherNo', label: 'Voucher' }, { key: 'particulars', label: 'Particulars' }, { key: 'debit', label: 'Debit' }, { key: 'credit', label: 'Credit' }, { key: 'balance', label: 'Balance' }]), 'text/csv;charset=utf-8'); notify({ title: 'Ledger exported', tone: 'success' }); } })),
      })));

      host.appendChild(kpiRow([
        { label: 'Account', value: current.code, icon: 'notebook', tone: 'brand', footer: current.name },
        { label: 'Total debit', value: cmoney(sum(rows, 'debit')), icon: 'arrow-down-right', tone: 'info' },
        { label: 'Total credit', value: cmoney(sum(rows, 'credit')), icon: 'arrow-up-right', tone: 'warning' },
        { label: 'Closing balance', value: cmoney(current.balance), icon: 'scale', tone: ACCOUNT_TONE[current.type] || 'brand', footer: `${current.type} account` },
      ]));

      if (!rows.length) {
        host.appendChild(Card({ pad: true }, EmptyState({
          icon: 'notebook', title: 'No entries in this ledger yet',
          text: `${current.name} carries an opening balance of ${money(current.balance)} but has no transactions in ${AY_LABEL}.`,
          action: Button('Post a voucher', { variant: 'primary', icon: 'plus', onClick: () => voucherEntryForm() }),
        })));
        return;
      }

      host.appendChild(SectionCard({ title: 'Balance movement', subtitle: 'Running balance after each entry', className: 'chart-card' },
        lineChart({
          categories: rows.map((r) => formatDate(r.date, 'dayMonth')),
          series: [{ name: 'Balance', values: rows.map((r) => r.balance) }],
          valueFormat: 'currencyCompact', height: 240, baselineZero: false,
        })));

      const wrap = SectionCard({
        title: `${current.code} · ${current.name}`,
        subtitle: `${rows.length} entries · ${current.type} account · ${AY_LABEL}`,
        icon: 'notebook', flush: true,
      });
      wrap.querySelector('.card-body').appendChild(DataTable({
        columns: [
          dateCol('date', 'Date'),
          { key: 'voucherNo', label: 'Voucher', width: 150, render: (r) => h('span', { className: 't-mono t-xs' }, r.voucherNo) },
          { key: 'type', label: 'Type', width: 110, filter: true },
          { key: 'particulars', label: 'Particulars', width: 230 },
          { key: 'narration', label: 'Narration', width: 300 },
          moneyCol('debit', 'Debit', { width: 140 }),
          moneyCol('credit', 'Credit', { width: 140 }),
          { key: 'balance', label: 'Balance', width: 150, align: 'right', numeric: true, className: 'fin-ledger-run', render: (r) => money(r.balance), value: (r) => r.balance, aggregate: null },
        ],
        rows,
        pageSize: 50, footerAggregates: true,
        searchKeys: ['voucherNo', 'particulars', 'narration'],
        exportName: `ledger-${current.code}`,
        rowActions: (row) => [
          { label: 'Open voucher', icon: 'receipt', route: 'finance/vouchers' },
          { label: 'Day book for this date', icon: 'book', route: 'finance/day-book' },
        ],
      }));
      host.appendChild(wrap);
    }

    paint();

    mount.appendChild(page({
      title: 'Ledger',
      subtitle: 'Pick an account to see every posting against it with a running balance',
      route: 'finance/ledger',
      actions: [
        Button('Chart of accounts', { variant: 'secondary', icon: 'layers', route: 'finance/chart-of-accounts' }),
        Button('New voucher', { variant: 'primary', icon: 'plus', onClick: () => voucherEntryForm() }),
      ],
      children: host,
    }));
  },
};

/* ============================================== finance/bank-accounts ===== */

routes['finance/bank-accounts'] = {
  title: 'Bank Accounts',
  subtitle: 'Operating accounts, balances and reconciliation status',
  section: 'finance',
  render(mount, ctx) {
    ensureStyles();
    const accounts = db.bankAccounts.map((b) => {
      const unrec = 3 + (hashOf(b.id) % 12);
      return {
        ...b,
        campus: campusName(b.campusId),
        unreconciled: unrec,
        unreconciledValue: intFor(b.id + 'v', 180000, 2400000),
        lastReconciled: `2026-08-${String(10 + (hashOf(b.id + 'd') % 8)).padStart(2, '0')}`,
        statementBalance: b.balance + intFor(b.id + 's', -1200000, 1800000),
      };
    });

    const statementRows = accounts.flatMap((b) => Array.from({ length: 14 }, (_, i) => {
      const seed = b.id + 'tx' + i;
      const credit = hashOf(seed) % 2 === 0;
      const amt = intFor(seed + 'a', 24000, 1800000);
      return {
        id: seed,
        bankId: b.id,
        bank: b.name,
        date: `2026-08-${String(1 + (hashOf(seed + 'dt') % 19)).padStart(2, '0')}`,
        description: credit
          ? pickFor(['Fee collection sweep — Razorpay', 'NEFT from parent', 'Cash deposit — main counter', 'Interest credited', 'Transport fee sweep'], seed)
          : pickFor(['Salary disbursement', 'Vendor payment — NEFT', 'Electricity bill', 'Diesel purchase', 'AMC payment'], seed),
        reference: 'UTR' + (500000000 + (hashOf(seed + 'u') % 499999999)),
        debit: credit ? 0 : amt,
        credit: credit ? amt : 0,
        matched: hashOf(seed + 'm') % 10 > 2,
      };
    }));

    const host = h('div', { className: 'stack' });

    host.appendChild(kpiRow([
      { label: 'Bank balance', value: cmoney(sum(accounts, 'balance')), icon: 'building-columns', tone: 'brand', footer: `${accounts.length} operating accounts` },
      { label: 'Cash in hand', value: cmoney(842000), icon: 'wallet', tone: 'info', footer: 'Across five counters' },
      { label: 'Unreconciled items', value: num(sum(accounts, 'unreconciled')), icon: 'alert-circle', tone: 'warning', footer: cmoney(sum(accounts, 'unreconciledValue')) },
      { label: 'Last reconciled', value: formatDate('2026-08-18', 'dayMonth'), icon: 'check-circle', tone: 'success', footer: 'HDFC Current — Main' },
    ]));

    host.appendChild(h('div', { className: 'widget-grid' },
      accounts.map((b) => h('div', { className: 'span-6' },
        SectionCard({
          title: b.name,
          subtitle: `${b.bank} · ${b.branch}`,
          icon: 'building-columns',
          actions: b.primary ? Badge('Primary', { tone: 'brand' }) : null,
        },
          h('div', { className: 'stack-3' },
            DescriptionList([
              ['Account number', b.accountMasked],
              ['IFSC', b.ifsc],
              ['Type', b.type],
              ['Campus', b.campus],
              ['Book balance', money(b.balance)],
              ['Statement balance', money(b.statementBalance)],
            ], { cols: 2 }),
            stackedProgressBar({
              segments: [
                { label: 'Reconciled', value: Math.max(0, b.balance - b.unreconciledValue), color: 'var(--chart-1)' },
                { label: 'Unreconciled', value: b.unreconciledValue, color: 'var(--chart-4)' },
              ],
              barHeight: 10, showLegend: true,
            }),
            h('div', { className: 'row-3 row-wrap' },
              Button('Reconcile', { variant: 'primary', size: 'sm', icon: 'refresh', onClick: () => notify({ title: 'Reconciliation started', text: `${b.name} · ${b.unreconciled} items to match`, tone: 'info' }) }),
              Button('Statement', { variant: 'secondary', size: 'sm', icon: 'file-text', onClick: mockAction('Download statement') }),
              Button('Ledger', { variant: 'ghost', size: 'sm', icon: 'notebook', route: 'finance/ledger' }))))))));

    host.appendChild(SectionCard({
      title: 'Bank reconciliation',
      subtitle: 'Statement lines matched against the book entries',
      icon: 'scale', flush: true,
      actions: Button('Auto-match', { variant: 'secondary', size: 'sm', icon: 'zap', onClick: () => notify({ title: 'Auto-match complete', text: `${statementRows.filter((r) => !r.matched).length} items still need attention`, tone: 'success' }) }),
    },
      DataTable({
        columns: [
          dateCol('date', 'Date'),
          { key: 'bank', label: 'Account', width: 220, filter: true },
          { key: 'description', label: 'Description', width: 260 },
          { key: 'reference', label: 'Reference', width: 170, render: (r) => h('span', { className: 't-mono t-xs' }, r.reference) },
          moneyCol('debit', 'Debit', { width: 140 }),
          moneyCol('credit', 'Credit', { width: 140 }),
          { key: 'matched', label: 'Reconciliation', width: 150, filter: true, render: (r) => Badge(r.matched ? 'Matched' : 'Unmatched', { tone: r.matched ? 'success' : 'warning' }), value: (r) => (r.matched ? 'Matched' : 'Unmatched') },
        ],
        rows: sortBy(statementRows, 'date', 'desc'),
        selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['description', 'reference', 'bank'],
        exportName: 'bank-reconciliation',
        bulkActions: [
          { label: 'Mark matched', icon: 'check-circle', onClick: (sel) => notify({ title: `${sel.length} lines matched`, tone: 'success' }) },
          { label: 'Create voucher', icon: 'plus', onClick: () => voucherEntryForm() },
        ],
        emptyState: emptyFor('No statement lines', 'Import a bank statement to begin reconciliation.'),
      })));

    mount.appendChild(page({
      title: 'Bank Accounts',
      subtitle: `${cmoney(sum(accounts, 'balance'))} across ${accounts.length} accounts · ${AY_LABEL}`,
      route: 'finance/bank-accounts',
      actions: [
        Button('Import statement', { variant: 'secondary', icon: 'upload', onClick: mockAction('Import bank statement') }),
        Button('Add account', { variant: 'primary', icon: 'plus', onClick: () => formPage({
          mode: 'modal', size: 'lg', title: 'Add bank account', submitLabel: 'Add account',
          sections: [{ title: 'Account details', cols: 2, fields: [
            { id: 'name', label: 'Display name', required: true, validate: validators.required },
            { id: 'bank', label: 'Bank', type: 'combobox', required: true, options: BANK_NAMES },
            { id: 'branch', label: 'Branch', required: true },
            { id: 'number', label: 'Account number', required: true },
            { id: 'ifsc', label: 'IFSC', required: true, validate: validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid 11-character IFSC') },
            { id: 'type', label: 'Type', type: 'select', options: ['Current', 'Savings', 'Fixed Deposit'] },
            { id: 'campusId', label: 'Campus', type: 'select', options: campusOptions() },
            { id: 'opening', label: 'Opening balance', type: 'number', prefix: '₹' },
            { id: 'primary', label: 'Primary account', type: 'switch', switchLabel: 'Use as the default collection account', span: 'full' },
          ] }],
          onSubmit: (v) => notify({ title: 'Bank account added', text: v.name, tone: 'success' }),
        }) }),
      ],
      children: host,
    }));
  },
};

/* ================================================= finance/cash-book ====== */

routes['finance/cash-book'] = {
  title: 'Cash Book',
  subtitle: 'Cash receipts and payments with a running cash balance',
  section: 'finance',
  render(mount, ctx) {
    ensureStyles();
    const campusMap = CAMPUS_MAP();
    const receipts = db.payments.filter((p) => p.mode === 'Cash' && p.status === 'Success').map((p) => ({
      id: p.id, date: p.date, voucherNo: p.receiptNo, particulars: p.studentName,
      narration: `Fee collected — ${p.className}`, receipt: p.amount, payment: 0,
      campusId: p.campusId, campus: campusMap[p.campusId], type: 'Receipt',
    }));
    const payments = db.expenses.filter((e) => e.paymentMode === 'Cash').map((e) => ({
      id: e.id, date: e.date, voucherNo: e.voucherNo, particulars: (byId(db.vendors, e.vendorId) || {}).name || 'Vendor',
      narration: e.description, receipt: 0, payment: e.amount,
      campusId: e.campusId, campus: campusMap[e.campusId], type: 'Payment',
    }));
    const all = sortBy(receipts.concat(payments), 'date', 'asc');
    const opening = 620000;
    let run = opening;
    const rows = all.map((r) => { run += r.receipt - r.payment; return { ...r, balance: run }; });
    const closing = run;
    const searchKeys = ['voucherNo', 'particulars', 'narration'];

    const byDay = groupBy(rows, 'date');
    const days = Array.from(byDay.keys()).sort().slice(-30);

    const host = h('div', { className: 'stack' });

    host.appendChild(kpiRow([
      { label: 'Opening balance', value: money(opening), icon: 'wallet', tone: 'info', footer: '1 April 2026' },
      { label: 'Cash receipts', value: cmoney(sum(rows, 'receipt')), icon: 'arrow-down-right', tone: 'success', footer: `${num(receipts.length)} entries` },
      { label: 'Cash payments', value: cmoney(sum(rows, 'payment')), icon: 'arrow-up-right', tone: 'danger', footer: `${num(payments.length)} entries` },
      { label: 'Closing balance', value: money(closing), icon: 'banknote', tone: 'brand', footer: formatDate(TODAY) },
    ]));

    host.appendChild(SectionCard({ title: 'Cash position, last 30 days', subtitle: 'Closing cash balance each day', className: 'chart-card' },
      areaChart({
        categories: days.map((d) => formatDate(d, 'dayMonth')),
        series: [{ name: 'Cash balance', values: days.map((d) => { const list = byDay.get(d); return list[list.length - 1].balance; }) }],
        valueFormat: 'currencyCompact', height: 250, baselineZero: false,
      })));

    const wrap = SectionCard({
      title: 'Cash book',
      subtitle: 'Every cash movement in date order with the running balance',
      icon: 'wallet', flush: true,
      actions: h('div', { className: 'row' },
        Button('Day-end closing', { variant: 'ghost', size: 'sm', icon: 'lock', onClick: () => ConfirmDialog({ title: 'Close the cash book for today?', text: `Closing balance ${money(closing)} will be frozen. Entries after this need a supervisor override.`, confirmLabel: 'Close day', tone: 'brand', icon: 'lock' }).then((ok) => ok && notify({ title: 'Cash book closed', text: formatDate(TODAY), tone: 'success' })) }),
        Button('Print', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(host, 'Cash Book') })),
    });
    wrap.querySelector('.card-body').appendChild(DataTable({
      columns: [
        dateCol('date', 'Date'),
        { key: 'voucherNo', label: 'Voucher', width: 160, render: (r) => h('span', { className: 't-mono t-xs' }, r.voucherNo) },
        { key: 'particulars', label: 'Particulars', width: 220 },
        { key: 'narration', label: 'Narration', width: 280 },
        { key: 'campus', label: 'Campus', width: 170, filter: true, hidden: true },
        { key: 'type', label: 'Type', width: 110, filter: true, render: (r) => Badge(r.type, { tone: r.type === 'Receipt' ? 'success' : 'warning' }) },
        moneyCol('receipt', 'Receipt', { width: 150 }),
        moneyCol('payment', 'Payment', { width: 150 }),
        { key: 'balance', label: 'Balance', width: 150, align: 'right', numeric: true, render: (r) => money(r.balance), value: (r) => r.balance },
      ],
      rows: rows.slice().reverse(),
      pageSize: 50, footerAggregates: true, searchKeys,
      exportName: 'cash-book',
      emptyState: emptyFor('No cash movements', 'Cash receipts and cash expense vouchers appear here automatically.'),
    }));
    host.appendChild(wrap);

    mount.appendChild(page({
      title: 'Cash Book',
      subtitle: `Opening ${money(opening)} · closing ${money(closing)} · ${AY_LABEL}`,
      route: 'finance/cash-book',
      actions: [
        Button('Day book', { variant: 'secondary', icon: 'book', route: 'finance/day-book' }),
        Button('New voucher', { variant: 'primary', icon: 'plus', onClick: () => voucherEntryForm() }),
      ],
      children: host,
    }));
  },
};

/* ================================================== finance/day-book ====== */

routes['finance/day-book'] = {
  title: 'Day Book',
  subtitle: 'Every transaction posted, in chronological order',
  section: 'finance',
  render(mount, ctx) {
    ensureStyles();
    const campusMap = CAMPUS_MAP();
    const entries = [];
    for (const p of db.payments.slice(0, 1600)) {
      entries.push({ id: p.id, date: p.date, voucherNo: p.receiptNo, type: 'Receipt', particulars: p.studentName,
        narration: `Fee received — ${p.className} · ${p.mode}`, debit: p.amount, credit: 0,
        campusId: p.campusId, campus: campusMap[p.campusId], status: p.status === 'Success' ? 'Posted' : p.status });
    }
    for (const e of db.expenses) {
      entries.push({ id: e.id, date: e.date, voucherNo: e.voucherNo, type: 'Payment', particulars: (byId(db.vendors, e.vendorId) || {}).name || 'Vendor',
        narration: `${e.category} — ${e.description}`, debit: 0, credit: e.amount,
        campusId: e.campusId, campus: campusMap[e.campusId], status: e.status === 'Paid' ? 'Posted' : e.status });
    }
    for (const v of db.vouchers) {
      entries.push({ id: v.id, date: v.date, voucherNo: v.voucherNo, type: v.type, particulars: `${v.debitAccount} / ${v.creditAccount}`,
        narration: v.narration, debit: v.amount, credit: v.amount,
        campusId: v.campusId, campus: campusMap[v.campusId], status: v.status });
    }
    const rows = sortBy(entries, 'date', 'desc');
    const searchKeys = ['voucherNo', 'particulars', 'narration', 'type'];

    const today = rows.filter((r) => r.date === TODAY);
    const byType = countBy(rows, 'type');

    mount.appendChild(listPage({
      title: 'Day Book',
      subtitle: `${num(rows.length)} entries posted this year · ${num(today.length)} today`,
      route: 'finance/day-book',
      actions: [
        Button('Cash book', { variant: 'secondary', icon: 'wallet', route: 'finance/cash-book' }),
        Button('Ledger', { variant: 'secondary', icon: 'notebook', route: 'finance/ledger' }),
        Button('New voucher', { variant: 'primary', icon: 'plus', onClick: () => voucherEntryForm() }),
      ],
      kpis: [
        { label: 'Entries', value: num(rows.length), icon: 'book', tone: 'brand' },
        { label: 'Receipts', value: cmoney(rows.filter((r) => r.type === 'Receipt').reduce((a, r) => a + r.debit, 0)), icon: 'arrow-down-right', tone: 'success' },
        { label: 'Payments', value: cmoney(rows.filter((r) => r.type === 'Payment').reduce((a, r) => a + r.credit, 0)), icon: 'arrow-up-right', tone: 'danger' },
        { label: 'Journals', value: num(rows.filter((r) => r.type === 'Journal' || r.type === 'Contra').length), icon: 'refresh-ccw', tone: 'info' },
      ],
      chart: barChart({
        categories: byType.map((r) => r.key),
        series: [{ name: 'Entries', values: byType.map((r) => r.value) }],
        height: 220, showValues: true,
      }),
      chartTitle: 'Entries by voucher type',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Voucher, party or narration...', width: '300px' },
        { id: 'type', label: 'Type', options: byType.map((r) => r.key) },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'status', label: 'Status', options: ['Posted', 'Draft', 'Cancelled', 'Pending Approval'] },
        { id: 'from', label: 'From', type: 'date' },
        { id: 'to', label: 'To', type: 'date' },
      ],
      onFilter: (id, v, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys, dateKey: 'date' })),
      columns: [
        dateCol('date', 'Date'),
        { key: 'voucherNo', label: 'Voucher', sticky: true, width: 160, render: (r) => h('span', { className: 't-mono t-xs' }, r.voucherNo) },
        { key: 'type', label: 'Type', width: 120, filter: true, render: (r) => Badge(r.type, { tone: r.type === 'Receipt' ? 'success' : r.type === 'Payment' ? 'warning' : 'info' }) },
        { key: 'particulars', label: 'Particulars', width: 240 },
        { key: 'narration', label: 'Narration', width: 320 },
        { key: 'campus', label: 'Campus', width: 170, filter: true, hidden: true },
        moneyCol('debit', 'Debit', { width: 140 }),
        moneyCol('credit', 'Credit', { width: 140 }),
        statusCol('status', 'Status', 130),
      ],
      rows,
      selectable: true, footerAggregates: true, searchKeys, pageSize: 50,
      groupBy: null,
      bulkActions: [
        { label: 'Print day book', icon: 'print', onClick: (sel) => notify({ title: `Printing ${sel.length} entries`, tone: 'info' }) },
        { label: 'Export to Tally', icon: 'download', onClick: (sel) => notify({ title: 'Tally XML generated', text: `${sel.length} vouchers`, tone: 'success' }) },
      ],
      rowActions: (row) => [
        { label: 'Open voucher', icon: 'receipt', route: 'finance/vouchers' },
        { label: 'Open ledger', icon: 'notebook', route: 'finance/ledger' },
      ],
      tableTitle: 'Day book',
      tableSubtitle: 'Newest first — receipts, payments and journals in one chronological register',
      exportName: 'day-book',
      emptyState: emptyFor('Nothing posted', 'The day book fills up as receipts and vouchers are recorded.'),
    }));
  },
};

/* =================================================== finance/vendors ====== */

routes['finance/vendors'] = {
  title: 'Vendors',
  subtitle: 'Supplier master, payment terms and outstanding balances',
  section: 'finance',
  render(mount, ctx) {
    ensureStyles();
    const spendByVendor = new Map();
    for (const e of db.expenses) spendByVendor.set(e.vendorId, (spendByVendor.get(e.vendorId) || 0) + e.amount);
    const poByVendor = new Map();
    for (const p of db.purchaseOrders) poByVendor.set(p.vendorId, (poByVendor.get(p.vendorId) || 0) + p.total);

    const rows = db.vendors.map((v) => ({
      ...v,
      ytdSpend: spendByVendor.get(v.id) || 0,
      openPo: poByVendor.get(v.id) || 0,
      city: (v.address && v.address.city) || '—',
    }));
    const searchKeys = ['name', 'category', 'contactPerson', 'gstin', 'phone'];

    const vendorForm = (existing) => formPage({
      mode: 'modal', size: 'lg',
      title: existing ? `Edit ${existing.name}` : 'Onboard a vendor',
      subtitle: 'GSTIN and PAN are verified before the first payment is released',
      submitLabel: existing ? 'Save vendor' : 'Onboard vendor',
      values: existing ? { name: existing.name, category: existing.category, contactPerson: existing.contactPerson, phone: existing.phone, email: existing.email, gstin: existing.gstin, paymentTerms: existing.paymentTerms } : { paymentTerms: 'Net 30' },
      sections: [
        {
          title: 'Vendor', cols: 2,
          fields: [
            { id: 'name', label: 'Vendor name', required: true, span: 'full', validate: validators.required },
            { id: 'category', label: 'Category', type: 'select', required: true, options: ['Stationery', 'Furniture', 'Sports', 'Housekeeping', 'Catering', 'Lab Equipment', 'Printing', 'Uniforms', 'Security', 'Books', 'IT', 'Maintenance'] },
            { id: 'paymentTerms', label: 'Payment terms', type: 'select', options: ['Advance', 'Net 15', 'Net 30', 'Net 45'] },
            { id: 'contactPerson', label: 'Contact person', required: true },
            { id: 'phone', label: 'Phone', type: 'tel', required: true, validate: validators.phone },
            { id: 'email', label: 'Email', type: 'email', validate: validators.email },
            { id: 'gstin', label: 'GSTIN', placeholder: '06AABCU9603R1ZX' },
            { id: 'pan', label: 'PAN', placeholder: 'AABCU9603R' },
            { id: 'address', label: 'Address', type: 'textarea', span: 'full' },
          ],
        },
        {
          title: 'Banking & compliance', cols: 2,
          fields: [
            { id: 'bank', label: 'Bank name', type: 'combobox', options: BANK_NAMES },
            { id: 'account', label: 'Account number' },
            { id: 'ifsc', label: 'IFSC' },
            { id: 'msme', label: 'MSME registered', type: 'switch', switchLabel: 'Pay within 45 days as per the MSMED Act' },
            { id: 'docs', label: 'Documents', type: 'file', span: 'full', hint: 'GST certificate, cancelled cheque, PAN card' },
          ],
        },
      ],
      onSubmit: (v) => notify({ title: existing ? 'Vendor updated' : 'Vendor onboarded', text: v.name, tone: 'success' }),
    });

    mount.appendChild(listPage({
      title: 'Vendors',
      subtitle: `${rows.length} suppliers · ${cmoney(sum(rows, 'ytdSpend'))} spent this year · ${cmoney(sum(rows, 'outstanding'))} payable`,
      route: 'finance/vendors',
      actions: [
        Button('Purchase orders', { variant: 'secondary', icon: 'shopping-cart', route: 'finance/purchase-orders' }),
        Button('Onboard vendor', { variant: 'primary', icon: 'plus', onClick: () => vendorForm(null) }),
      ],
      kpis: [
        { label: 'Active vendors', value: rows.filter((r) => r.status === 'Active').length, icon: 'truck', tone: 'brand', footer: `${rows.filter((r) => r.status === 'Blacklisted').length} blacklisted` },
        { label: 'Spend YTD', value: cmoney(sum(rows, 'ytdSpend')), icon: 'trending-down', tone: 'danger' },
        { label: 'Payable', value: cmoney(sum(rows, 'outstanding')), icon: 'alert-circle', tone: 'warning', footer: 'Open vendor balances' },
        { label: 'Average rating', value: (avg(rows, 'rating')).toFixed(1) + ' / 5', icon: 'star', tone: 'success', footer: 'Quality and delivery score' },
      ],
      chart: barChart({
        categories: sortBy(rows, 'ytdSpend', 'desc').slice(0, 12).map((r) => r.name),
        series: [{ name: 'Spend', values: sortBy(rows, 'ytdSpend', 'desc').slice(0, 12).map((r) => r.ytdSpend) }],
        horizontal: true, valueFormat: 'currencyCompact', height: 300,
      }),
      chartTitle: 'Top vendors by spend',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Vendor, GSTIN or contact...', width: '280px' },
        { id: 'category', label: 'Category', options: distinct(rows, 'category') },
        { id: 'paymentTerms', label: 'Terms', options: ['Advance', 'Net 15', 'Net 30', 'Net 45'] },
        { id: 'status', label: 'Status', options: ['Active', 'Inactive', 'Blacklisted'] },
      ],
      onFilter: (id, v, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys })),
      columns: [
        { key: 'name', label: 'Vendor', sticky: true, width: 250, render: (r) => Identity(r.name, `${r.category} · ${r.city}`, { size: 'sm' }), value: (r) => r.name },
        { key: 'contactPerson', label: 'Contact', width: 180 },
        { key: 'phone', label: 'Phone', width: 150, render: (r) => h('a', { href: `tel:${r.phone}`, className: 't-mono t-xs' }, r.phone) },
        { key: 'gstin', label: 'GSTIN', width: 180, render: (r) => h('span', { className: 't-mono t-xs' }, r.gstin), hidden: true },
        { key: 'category', label: 'Category', width: 150, filter: true },
        { key: 'paymentTerms', label: 'Terms', width: 110, filter: true },
        { key: 'totalOrders', label: 'Orders', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        moneyCol('ytdSpend', 'Spend YTD', { width: 150 }),
        moneyCol('openPo', 'Open POs', { width: 140 }),
        moneyCol('outstanding', 'Payable', { width: 140 }),
        { key: 'rating', label: 'Rating', width: 130, render: (r) => Rating(Math.round(r.rating), { max: 5, showValue: true }), value: (r) => r.rating },
        statusCol('status', 'Status', 130),
      ],
      rows,
      selectable: true, footerAggregates: true, searchKeys, pageSize: 25,
      bulkActions: [
        { label: 'Release payment', icon: 'banknote', onClick: (sel) => notify({ title: `Payment released to ${sel.length} vendors`, text: money(sel.reduce((a, r) => a + r.outstanding, 0)), tone: 'success' }) },
        { label: 'Request GST certificate', icon: 'mail', onClick: (sel) => notify({ title: `${sel.length} requests emailed`, tone: 'info' }) },
        { label: 'Blacklist', icon: 'x-circle', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Blacklist ${sel.length} vendors?`, text: 'No new purchase orders can be raised against them.', tone: 'danger', confirmLabel: 'Blacklist' }).then((ok) => ok && notify({ title: 'Vendors blacklisted', tone: 'danger' })) },
      ],
      rowActions: (row) => [
        { label: 'Vendor profile', icon: 'eye', onClick: () => Drawer({
          title: row.name, subtitle: `${row.category} · ${row.paymentTerms} · onboarded ${formatDate(row.onboardedOn)}`, size: 'lg',
          body: h('div', { className: 'stack-4' },
            DescriptionList([
              ['Contact', row.contactPerson], ['Phone', row.phone], ['Email', row.email],
              ['GSTIN', row.gstin], ['Payment terms', row.paymentTerms], ['Rating', `${row.rating} / 5`],
              ['Total orders', num(row.totalOrders)], ['Lifetime value', money(row.totalValue)],
              ['Spend this year', money(row.ytdSpend)], ['Outstanding', money(row.outstanding)],
            ], { cols: 2 }),
            SectionCard({ title: 'Recent purchase orders', icon: 'shopping-cart' },
              (() => {
                const pos = db.purchaseOrders.filter((p) => p.vendorId === row.id).slice(0, 6);
                return pos.length ? DataTable({
                  columns: [
                    { key: 'poNumber', label: 'PO', width: 150 },
                    dateCol('date', 'Date'),
                    moneyCol('total', 'Value'),
                    statusCol('status', 'Status', 150),
                  ],
                  rows: pos, paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
                }) : EmptyState({ icon: 'shopping-cart', title: 'No purchase orders', text: 'Nothing has been ordered from this vendor yet.' });
              })()),
            SectionCard({ title: 'Recent bills', icon: 'receipt' },
              (() => {
                const bills = db.expenses.filter((e) => e.vendorId === row.id).slice(0, 6);
                return bills.length ? Timeline(bills.map((b) => ({ title: money(b.amount) + ' · ' + b.category, meta: formatDate(b.date), text: b.description, icon: 'receipt', tone: b.status === 'Paid' ? 'success' : 'warning' })))
                  : EmptyState({ icon: 'receipt', title: 'No bills booked', text: 'Bills appear once an expense voucher is raised against this vendor.' });
              })())),
          actions: (close) => frag(
            Button('Close', { variant: 'secondary', onClick: close }),
            Button('Raise PO', { variant: 'ghost', icon: 'shopping-cart', onClick: () => { close(); navigate('finance/purchase-orders'); } }),
            Button('Pay outstanding', { variant: 'primary', icon: 'banknote', onClick: () => { close(); notify({ title: 'Payment scheduled', text: `${money(row.outstanding)} to ${row.name}`, tone: 'success' }); } })),
        }) },
        { label: 'Edit vendor', icon: 'edit', onClick: () => vendorForm(row) },
        { label: 'Raise purchase order', icon: 'shopping-cart', route: 'finance/purchase-orders' },
        { separator: true },
        { label: 'Blacklist', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: `Blacklist ${row.name}?`, text: 'Existing POs stay open but no new orders can be raised.', tone: 'danger', confirmLabel: 'Blacklist' }).then((ok) => ok && notify({ title: 'Vendor blacklisted', tone: 'danger' })) },
      ],
      tableTitle: 'Vendor master',
      exportName: 'vendors',
      emptyState: emptyFor('No vendors', 'Onboard your first supplier to raise purchase orders and book bills.', Button('Onboard vendor', { variant: 'primary', icon: 'plus', onClick: () => vendorForm(null) })),
    }));
  },
};

/* =========================================== finance/purchase-orders ====== */

routes['finance/purchase-orders'] = {
  title: 'Purchase Orders',
  subtitle: 'Orders raised on vendors, from draft to goods received',
  section: 'finance',
  render(mount, ctx) {
    ensureStyles();
    const campusMap = CAMPUS_MAP();
    const rows = db.purchaseOrders.map((p) => ({
      ...p,
      campus: campusMap[p.campusId],
      pendingDays: Math.max(0, daysBetween(p.date, TODAY)),
      grn: p.grnReceived ? 'Received' : 'Awaited',
    }));
    const searchKeys = ['poNumber', 'vendorName', 'department'];
    const pending = rows.filter((r) => r.status === 'Pending Approval');

    const poForm = (existing) => formPage({
      mode: 'modal', size: 'xl',
      title: existing ? 'Edit ' + existing.poNumber : 'New purchase order',
      subtitle: 'POs above ₹2,00,000 need management approval before they are sent to the vendor',
      submitLabel: existing ? 'Save PO' : 'Raise purchase order',
      values: existing ? { vendorId: existing.vendorId, department: existing.department, quantity: String(existing.quantity), rate: String(existing.rate) } : { gst: '18', date: TODAY },
      sections: [
        {
          title: 'Order', cols: 3,
          fields: [
            { id: 'vendorId', label: 'Vendor', type: 'combobox', required: true, span: 2, options: db.vendors.filter((v) => v.status === 'Active').map((v) => ({ value: v.id, label: `${v.name} · ${v.category}` })) },
            { id: 'date', label: 'PO date', type: 'date', required: true },
            { id: 'department', label: 'Department', type: 'select', required: true, options: db.departments.map((d) => d.name) },
            { id: 'campusId', label: 'Campus', type: 'select', options: campusOptions() },
            { id: 'expectedDate', label: 'Expected delivery', type: 'date' },
          ],
        },
        {
          title: 'Items', cols: 4,
          fields: [
            { id: 'item', label: 'Item description', span: 2, required: true, validate: validators.required },
            { id: 'quantity', label: 'Quantity', type: 'number', required: true, validate: validators.number },
            { id: 'rate', label: 'Rate', type: 'number', required: true, prefix: '₹', validate: validators.number },
            { id: 'gst', label: 'GST %', type: 'select', options: ['0', '5', '12', '18', '28'] },
            { id: 'budgetHead', label: 'Budget head', type: 'select', span: 2, options: db.budgets.map((b) => ({ value: b.id, label: `${b.head} · ${cmoney(b.remaining)} left` })) },
            { id: 'terms', label: 'Delivery terms', type: 'select', options: ['Ex-works', 'FOR school', 'Door delivery'] },
            { id: 'notes', label: 'Notes to vendor', type: 'textarea', span: 'full' },
          ],
        },
      ],
      onSubmit: (v) => notify({ title: existing ? 'PO updated' : 'Purchase order raised', text: money((Number(v.quantity) || 0) * (Number(v.rate) || 0)), tone: 'success' }),
    });

    mount.appendChild(listPage({
      title: 'Purchase Orders',
      subtitle: `${num(rows.length)} orders · ${cmoney(sum(rows, 'total'))} committed · ${num(pending.length)} awaiting approval`,
      route: 'finance/purchase-orders',
      actions: [
        Button('Vendors', { variant: 'secondary', icon: 'truck', route: 'finance/vendors' }),
        Button('Goods receipt', { variant: 'secondary', icon: 'check-circle', route: 'inventory/grn' }),
        Button('New PO', { variant: 'primary', icon: 'plus', onClick: () => poForm(null) }),
      ],
      kpis: [
        { label: 'Purchase orders', value: num(rows.length), icon: 'shopping-cart', tone: 'brand' },
        { label: 'Committed value', value: cmoney(sum(rows, 'total')), icon: 'banknote', tone: 'info' },
        { label: 'Pending approval', value: num(pending.length), icon: 'clock', tone: 'warning', footer: cmoney(sum(pending, 'total')) },
        { label: 'Awaiting GRN', value: num(rows.filter((r) => !r.grnReceived && r.status !== 'Cancelled').length), icon: 'package', tone: 'danger', footer: 'Goods not yet received' },
      ],
      chart: barChart({
        categories: countBy(rows, 'status').map((r) => r.key),
        series: [{ name: 'Orders', values: countBy(rows, 'status').map((r) => r.value) }],
        height: 230, showValues: true,
      }),
      chartTitle: 'Purchase orders by status',
      tabs: [
        { id: 'all', label: 'All', count: rows.length },
        { id: 'Pending Approval', label: 'Pending approval', count: pending.length },
        { id: 'Approved', label: 'Approved', count: rows.filter((r) => r.status === 'Approved').length },
        { id: 'Partially Received', label: 'Partially received', count: rows.filter((r) => r.status === 'Partially Received').length },
        { id: 'Delivered', label: 'Delivered', count: rows.filter((r) => r.status === 'Delivered').length },
      ],
      activeTab: 'all',
      onTabChange: tabRefresh(mount, rows, (r, id) => r.status === id),
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'PO number, vendor or department...', width: '280px' },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'department', label: 'Department', options: distinct(rows, 'department') },
        { id: 'status', label: 'Status', options: distinct(rows, 'status') },
        { id: 'grn', label: 'GRN', options: ['Received', 'Awaited'] },
      ],
      onFilter: (id, v, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys, dateKey: 'date' })),
      columns: [
        { key: 'poNumber', label: 'PO number', sticky: true, width: 170, render: (r) => h('span', { className: 't-mono t-xs' }, r.poNumber) },
        dateCol('date', 'Raised'),
        { key: 'vendorName', label: 'Vendor', width: 230, filter: true },
        { key: 'department', label: 'Department', width: 190, filter: true },
        { key: 'items', label: 'Items', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'quantity', label: 'Qty', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
        moneyCol('subtotal', 'Subtotal', { width: 140 }),
        { key: 'gst', label: 'GST %', width: 90, align: 'right', numeric: true },
        moneyCol('total', 'Total', { width: 150 }),
        dateCol('expectedDate', 'Expected'),
        { key: 'grn', label: 'GRN', width: 110, filter: true, render: (r) => Badge(r.grn, { tone: r.grnReceived ? 'success' : 'warning' }) },
        statusCol('status', 'Status', 150),
      ],
      rows,
      selectable: true, footerAggregates: true, searchKeys, pageSize: 50,
      bulkActions: [
        { label: 'Approve', icon: 'check', onClick: (sel) => ConfirmDialog({ title: `Approve ${sel.length} purchase orders?`, text: `${money(sel.reduce((a, r) => a + r.total, 0))} will be committed against the budget.`, confirmLabel: 'Approve', tone: 'brand', icon: 'check-circle' }).then((ok) => ok && notify({ title: `${sel.length} POs approved`, tone: 'success' })) },
        { label: 'Email to vendors', icon: 'mail', onClick: (sel) => notify({ title: `${sel.length} POs emailed`, tone: 'success' }) },
        { label: 'Cancel', icon: 'x-circle', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Cancel ${sel.length} POs?`, tone: 'danger', confirmLabel: 'Cancel POs' }).then((ok) => ok && notify({ title: 'Purchase orders cancelled', tone: 'warning' })) },
      ],
      rowActions: (row) => [
        { label: 'View PO', icon: 'eye', onClick: () => Drawer({
          title: row.poNumber, subtitle: `${row.vendorName} · ${money(row.total)}`, size: 'lg',
          body: h('div', { className: 'stack-4' },
            DescriptionList([
              ['Vendor', row.vendorName], ['Department', row.department], ['Campus', row.campus],
              ['Raised on', formatDate(row.date)], ['Expected', formatDate(row.expectedDate)],
              ['Items', String(row.items)], ['Quantity', num(row.quantity)], ['Rate', money(row.rate)],
              ['Subtotal', money(row.subtotal)], ['GST', `${row.gst}%`], ['Total', money(row.total)],
              ['GRN', row.grn],
            ], { cols: 2 }),
            SectionCard({ title: 'Progress', icon: 'workflow' },
              Stepper([
                { label: 'Drafted', description: formatDate(row.date) },
                { label: 'Approved', description: row.status === 'Draft' || row.status === 'Pending Approval' ? 'Pending' : 'Done' },
                { label: 'Sent to vendor', description: row.status === 'Draft' ? 'Not sent' : 'Sent' },
                { label: 'Goods received', description: row.grn },
                { label: 'Bill booked', description: row.status === 'Delivered' ? 'Booked' : 'Pending' },
              ], { current: row.status === 'Delivered' ? 4 : row.status === 'Partially Received' ? 3 : row.status === 'Approved' ? 2 : 1 }))),
          actions: (close) => frag(
            Button('Close', { variant: 'secondary', onClick: close }),
            Button('Print PO', { variant: 'ghost', icon: 'print', onClick: mockAction('Print purchase order') }),
            Button('Approve', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'PO approved', text: row.poNumber, tone: 'success' }); } })),
        }) },
        { label: 'Edit', icon: 'edit', onClick: () => poForm(row) },
        { label: 'Open vendor', icon: 'truck', route: 'finance/vendors' },
        { label: 'Record GRN', icon: 'check-circle', route: 'inventory/grn' },
        { separator: true },
        { label: 'Cancel PO', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: `Cancel ${row.poNumber}?`, text: 'The committed budget is released back.', tone: 'danger', confirmLabel: 'Cancel PO' }).then((ok) => ok && notify({ title: 'PO cancelled', tone: 'warning' })) },
      ],
      tableTitle: 'Purchase order register',
      exportName: 'purchase-orders',
      emptyState: emptyFor('No purchase orders', 'Raise a PO against an active vendor to start the procurement trail.', Button('New PO', { variant: 'primary', icon: 'plus', onClick: () => poForm(null) })),
    }));
  },
};

/* =================================================== finance/budgets ====== */

routes['finance/budgets'] = {
  title: 'Budgets',
  subtitle: 'Allocation against actual spend, head by head',
  section: 'finance',
  render(mount, ctx) {
    ensureStyles();
    const rows = db.budgets.map((b) => ({
      ...b,
      available: b.allocated - b.spent - b.committed,
      variance: b.allocated - b.spent,
      variancePct: Math.round(((b.allocated - b.spent) / Math.max(1, b.allocated)) * 1000) / 10,
    }));
    const searchKeys = ['head', 'owner', 'status'];

    const host = h('div', { className: 'stack' });

    host.appendChild(kpiRow([
      { label: 'Allocated', value: cmoney(sum(rows, 'allocated')), icon: 'target', tone: 'brand', footer: `${AY_LABEL} annual budget` },
      { label: 'Spent', value: cmoney(sum(rows, 'spent')), icon: 'trending-down', tone: 'danger', delta: 5.7, deltaLabel: 'vs plan' },
      { label: 'Committed', value: cmoney(sum(rows, 'committed')), icon: 'shopping-cart', tone: 'warning', footer: 'Open purchase orders' },
      { label: 'Available', value: cmoney(sum(rows, 'available')), icon: 'wallet', tone: 'success', footer: `${rows.filter((r) => r.status === 'Over Budget').length} heads over budget` },
    ]));

    host.appendChild(SectionCard({
      title: 'Budget against actual',
      subtitle: 'The bar is spend, the marker is the allocation',
      className: 'chart-card',
    },
      bulletChart({
        items: sortBy(rows, 'allocated', 'desc').map((r) => ({ label: r.head, value: r.spent, target: r.allocated })),
        valueFormat: 'currencyCompact', height: 340,
      })));

    host.appendChild(h('div', { className: 'widget-grid' },
      h('div', { className: 'span-7' }, SectionCard({ title: 'Utilisation by head', subtitle: 'Percentage of the allocation consumed', className: 'chart-card' },
        barChart({
          categories: sortBy(rows, 'utilisation', 'desc').map((r) => r.head),
          series: [{ name: 'Utilisation', values: sortBy(rows, 'utilisation', 'desc').map((r) => r.utilisation) }],
          horizontal: true, valueFormat: 'percent0', target: 100, height: 320,
        }))),
      h('div', { className: 'span-5' }, SectionCard({ title: 'Allocation mix', className: 'chart-card' },
        treemap({
          data: sortBy(rows, 'allocated', 'desc').map((r) => ({ key: r.head, value: r.allocated })),
          height: 320, valueFormat: 'currencyCompact',
        })))));

    const wrap = SectionCard({
      title: 'Budget register',
      subtitle: 'Available equals allocation less spend and open commitments',
      icon: 'target', flush: true,
      actions: Button('Request revision', { variant: 'secondary', size: 'sm', icon: 'edit', onClick: () => formPage({
        mode: 'modal', size: 'md', title: 'Request a budget revision', submitLabel: 'Submit request',
        subtitle: 'Revisions go to the management committee with a justification',
        sections: [{ title: 'Revision', cols: 1, fields: [
          { id: 'head', label: 'Budget head', type: 'select', required: true, options: rows.map((r) => r.head) },
          { id: 'amount', label: 'Additional amount', type: 'number', required: true, prefix: '₹', validate: validators.number },
          { id: 'source', label: 'Fund from', type: 'select', options: ['Contingency reserve', 'Reallocation from another head', 'Corpus'] },
          { id: 'why', label: 'Justification', type: 'textarea', required: true, validate: validators.required },
        ] }],
        onSubmit: (v) => notify({ title: 'Revision requested', text: `${v.head} · ${money(Number(v.amount) || 0)}`, tone: 'success' }),
      }) }),
    });
    wrap.querySelector('.card-body').appendChild(DataTable({
      columns: [
        { key: 'head', label: 'Budget head', sticky: true, width: 230 },
        { key: 'owner', label: 'Owner', width: 200, filter: true },
        moneyCol('allocated', 'Allocated', { width: 150 }),
        moneyCol('spent', 'Spent', { width: 150 }),
        moneyCol('committed', 'Committed', { width: 150 }),
        moneyCol('available', 'Available', { width: 150 }),
        { key: 'utilisation', label: 'Utilisation', width: 170, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v),
          render: (r) => h('div', { className: 'stack-1', style: { minWidth: '130px' } },
            h('span', { className: 't-num t-sm' }, formatPercent(r.utilisation)),
            ProgressBar(Math.min(100, r.utilisation), { size: 'sm', tone: r.utilisation > 100 ? 'danger' : r.utilisation > 85 ? 'warning' : 'success' })) },
        statusCol('status', 'Status', 150),
      ],
      rows,
      paginate: false, footerAggregates: true, searchKeys, maxHeight: 'none',
      exportName: 'budgets',
      rowActions: (row) => [
        { label: 'View spend detail', icon: 'receipt', route: 'finance/expenses' },
        { label: 'Request revision', icon: 'edit', onClick: mockAction('Request budget revision') },
        { label: 'Freeze head', icon: 'lock', tone: 'danger', onClick: () => ConfirmDialog({ title: `Freeze ${row.head}?`, text: 'No further vouchers can be booked against this head until it is unfrozen.', tone: 'danger', confirmLabel: 'Freeze' }).then((ok) => ok && notify({ title: 'Budget head frozen', tone: 'warning' })) },
      ],
      emptyState: emptyFor('No budgets set', 'Allocate a budget per head to track spend against plan.'),
    }));
    host.appendChild(wrap);

    mount.appendChild(page({
      title: 'Budgets',
      subtitle: `${cmoney(sum(rows, 'allocated'))} allocated · ${formatPercent((sum(rows, 'spent') / Math.max(1, sum(rows, 'allocated'))) * 100)} consumed · ${AY_LABEL}`,
      route: 'finance/budgets',
      actions: [
        Button('Expenses', { variant: 'secondary', icon: 'trending-down', route: 'finance/expenses' }),
        Button('New allocation', { variant: 'primary', icon: 'plus', onClick: () => formPage({
          mode: 'modal', size: 'md', title: 'New budget allocation', submitLabel: 'Allocate',
          sections: [{ title: 'Allocation', cols: 2, fields: [
            { id: 'head', label: 'Budget head', required: true, validate: validators.required },
            { id: 'owner', label: 'Owner department', type: 'select', options: db.departments.map((d) => d.name) },
            { id: 'allocated', label: 'Annual allocation', type: 'number', required: true, prefix: '₹', validate: validators.number },
            { id: 'year', label: 'Academic year', type: 'select', options: db.academicYears.map((y) => y.name), value: AY_LABEL },
            { id: 'notes', label: 'Notes', type: 'textarea', span: 'full' },
          ] }],
          onSubmit: (v) => notify({ title: 'Budget allocated', text: `${v.head} · ${money(Number(v.allocated) || 0)}`, tone: 'success' }),
        }) }),
      ],
      children: host,
    }));
  },
};

/* ============================================== finance/depreciation ====== */

routes['finance/depreciation'] = {
  title: 'Asset Depreciation',
  subtitle: 'Written-down value schedule for the fixed asset register',
  section: 'finance',
  render(mount, ctx) {
    ensureStyles();
    const campusMap = CAMPUS_MAP();
    const rows = db.assets.filter((a) => a.status !== 'Disposed').map((a) => {
      const yearDep = Math.round(a.currentValue * (a.depreciationRate / 100));
      return {
        ...a,
        campus: campusMap[a.campusId],
        openingValue: a.currentValue + yearDep,
        yearDepreciation: yearDep,
        closingValue: a.currentValue,
        accumulated: a.purchaseCost - a.currentValue,
        vendorName: (byId(db.vendors, a.vendorId) || {}).name || '—',
      };
    });
    const searchKeys = ['tag', 'name', 'category', 'location', 'assignedTo'];
    const byCategory = sortBy(sumBy(rows, 'category', 'yearDepreciation'), 'value', 'desc');

    mount.appendChild(listPage({
      title: 'Asset Depreciation',
      subtitle: `${num(rows.length)} assets · ${cmoney(sum(rows, 'purchaseCost'))} at cost · ${cmoney(sum(rows, 'closingValue'))} written-down value`,
      route: 'finance/depreciation',
      actions: [
        Button('Asset register', { variant: 'secondary', icon: 'archive', route: 'inventory/assets' }),
        Button('Post depreciation', { variant: 'primary', icon: 'check', onClick: () => ConfirmDialog({
          title: 'Post depreciation for 2026-27?',
          text: `${money(sum(rows, 'yearDepreciation'))} will be charged to the P&L and credited to accumulated depreciation. This can only be run once per year.`,
          confirmLabel: 'Post depreciation', tone: 'brand', icon: 'calculator',
        }).then((ok) => ok && notify({ title: 'Depreciation posted', text: money(sum(rows, 'yearDepreciation')), tone: 'success' })) }),
      ],
      kpis: [
        { label: 'Gross block', value: cmoney(sum(rows, 'purchaseCost')), icon: 'archive', tone: 'brand' },
        { label: 'Accumulated depreciation', value: cmoney(sum(rows, 'accumulated')), icon: 'trending-down', tone: 'warning' },
        { label: 'This year charge', value: cmoney(sum(rows, 'yearDepreciation')), icon: 'calculator', tone: 'danger', footer: 'WDV method at 15%' },
        { label: 'Net block', value: cmoney(sum(rows, 'closingValue')), icon: 'scale', tone: 'success' },
      ],
      chart: barChart({
        categories: byCategory.map((r) => r.key),
        series: [{ name: 'Depreciation', values: byCategory.map((r) => r.value) }],
        horizontal: true, valueFormat: 'currencyCompact', height: 260,
      }),
      chartTitle: 'Depreciation charge by asset category',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Tag, asset or location...', width: '280px' },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'category', label: 'Category', options: distinct(rows, 'category') },
        { id: 'condition', label: 'Condition', options: distinct(rows, 'condition') },
        { id: 'status', label: 'Status', options: distinct(rows, 'status') },
      ],
      onFilter: (id, v, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys, dateKey: 'purchaseDate' })),
      columns: [
        { key: 'tag', label: 'Asset tag', sticky: true, width: 160, render: (r) => h('span', { className: 't-mono t-xs' }, r.tag) },
        { key: 'name', label: 'Asset', width: 200 },
        { key: 'category', label: 'Category', width: 150, filter: true },
        { key: 'campus', label: 'Campus', width: 170, filter: true, hidden: true },
        { key: 'location', label: 'Location', width: 190, hidden: true },
        dateCol('purchaseDate', 'Purchased'),
        { key: 'ageYears', label: 'Age', width: 90, align: 'right', numeric: true, render: (r) => `${r.ageYears} y` },
        moneyCol('purchaseCost', 'Cost', { width: 140 }),
        moneyCol('openingValue', 'Opening WDV', { width: 150 }),
        { key: 'depreciationRate', label: 'Rate', width: 90, align: 'right', numeric: true, render: (r) => r.depreciationRate + '%' },
        moneyCol('yearDepreciation', 'Depreciation', { width: 150 }),
        moneyCol('closingValue', 'Closing WDV', { width: 150 }),
        { key: 'condition', label: 'Condition', width: 130, filter: true, render: (r) => Badge(r.condition, { tone: r.condition === 'Poor' ? 'danger' : r.condition === 'Fair' ? 'warning' : 'success' }) },
      ],
      rows,
      selectable: true, footerAggregates: true, searchKeys, pageSize: 50,
      bulkActions: [
        { label: 'Revalue', icon: 'calculator', onClick: (sel) => notify({ title: `${sel.length} assets queued for revaluation`, tone: 'info' }) },
        { label: 'Mark for disposal', icon: 'trash', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Mark ${sel.length} assets for disposal?`, text: 'Written-down value will be transferred to loss on disposal.', tone: 'danger', confirmLabel: 'Mark for disposal' }).then((ok) => ok && notify({ title: 'Assets marked for disposal', tone: 'warning' })) },
      ],
      rowActions: (row) => [
        { label: 'Depreciation schedule', icon: 'chart-line', onClick: () => Modal({
          title: row.name + ' — depreciation schedule',
          subtitle: `${row.tag} · purchased ${formatDate(row.purchaseDate)} for ${money(row.purchaseCost)}`,
          size: 'lg', icon: 'chart-line',
          body: (() => {
            let v = row.purchaseCost;
            const sched = Array.from({ length: 8 }, (_, i) => {
              const dep = Math.round(v * (row.depreciationRate / 100));
              const openv = v; v -= dep;
              return { year: `Year ${i + 1}`, opening: openv, depreciation: dep, closing: v };
            });
            return h('div', { className: 'stack-3' },
              lineChart({ categories: sched.map((s) => s.year), series: [{ name: 'Written-down value', values: sched.map((s) => s.closing) }], valueFormat: 'currencyCompact', height: 220 }),
              DataTable({
                columns: [
                  { key: 'year', label: 'Year', width: 100 },
                  moneyCol('opening', 'Opening'),
                  moneyCol('depreciation', 'Depreciation'),
                  moneyCol('closing', 'Closing'),
                ],
                rows: sched, paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
              }));
          })(),
          actions: (close) => Button('Close', { variant: 'primary', onClick: close }),
        }) },
        { label: 'Open asset', icon: 'archive', route: 'inventory/assets' },
        { label: 'Maintenance history', icon: 'wrench', route: 'inventory/asset-maintenance' },
      ],
      tableTitle: 'Depreciation schedule 2026-27',
      tableSubtitle: 'Written-down value method at 15% per annum, as per the Companies Act schedule adopted by the trust',
      exportName: 'asset-depreciation',
      emptyState: emptyFor('No assets to depreciate', 'Add assets to the register and they appear in the schedule automatically.'),
    }));
  },
};

/* ============================================= finance/trial-balance ====== */

routes['finance/trial-balance'] = {
  title: 'Trial Balance',
  subtitle: 'Debit and credit balances of every ledger as on 20 Aug 2026',
  section: 'finance',
  render(mount, ctx) {
    ensureStyles();
    const rows = db.accounts.filter((a) => !a.group).map((a) => ({
      code: a.code,
      name: a.name,
      type: a.type,
      group: (byId(db.accounts, a.parent) || {}).name || '—',
      debit: a.type === 'Asset' || a.type === 'Expense' ? a.balance : 0,
      credit: a.type === 'Liability' || a.type === 'Income' || a.type === 'Equity' ? a.balance : 0,
    }));
    const totalDebit = sum(rows, 'debit');
    const totalCredit = sum(rows, 'credit');
    const balanced = Math.abs(totalDebit - totalCredit) < 1;

    const node = reportPage({
      title: 'Trial Balance',
      subtitle: `As on ${formatDate(TODAY, 'long')} · academic year ${AY_LABEL}`,
      route: 'finance/trial-balance',
      filters: [
        { id: 'asOn', label: 'As on', type: 'date', value: TODAY },
        { id: 'type', label: 'Account type', options: ['Asset', 'Liability', 'Income', 'Expense'] },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
      ],
      onFilter: (id, v, all2, table) => table && table.refresh(applyFilters(rows, all2, { searchKeys: ['name', 'code', 'group'] })),
      summary: [
        { label: 'Total debit', value: cmoney(totalDebit), icon: 'arrow-down-right', tone: 'info' },
        { label: 'Total credit', value: cmoney(totalCredit), icon: 'arrow-up-right', tone: 'warning' },
        { label: 'Difference', value: cmoney(Math.abs(totalDebit - totalCredit)), icon: 'scale', tone: balanced ? 'success' : 'danger' },
        { label: 'Ledgers', value: rows.length, icon: 'notebook', tone: 'brand', footer: `${db.accounts.filter((a) => a.group).length} groups` },
      ],
      chart: barChart({
        categories: ['Asset', 'Liability', 'Income', 'Expense'],
        series: [
          { name: 'Debit', values: ['Asset', 'Liability', 'Income', 'Expense'].map((t) => rows.filter((r) => r.type === t).reduce((a, r) => a + r.debit, 0)) },
          { name: 'Credit', values: ['Asset', 'Liability', 'Income', 'Expense'].map((t) => rows.filter((r) => r.type === t).reduce((a, r) => a + r.credit, 0)) },
        ],
        valueFormat: 'currencyCompact', height: 280,
      }),
      chartTitle: 'Debit and credit by account type',
      columns: [
        { key: 'code', label: 'Code', sticky: true, width: 100, render: (r) => h('span', { className: 't-mono t-xs' }, r.code) },
        { key: 'name', label: 'Ledger', width: 260 },
        { key: 'group', label: 'Group', width: 190, filter: true },
        { key: 'type', label: 'Type', width: 130, filter: true, render: (r) => Badge(r.type, { tone: ACCOUNT_TONE[r.type], outline: true }) },
        moneyCol('debit', 'Debit', { width: 180 }),
        moneyCol('credit', 'Credit', { width: 180 }),
      ],
      rows: sortBy(rows, 'code', 'asc'),
      tableTitle: 'Trial balance detail',
      footerAggregates: true,
      notes: Callout({
        tone: balanced ? 'success' : 'danger', icon: balanced ? 'check-circle' : 'alert-triangle',
        title: balanced ? 'The books balance' : 'The books do not balance',
      }, balanced
        ? `Total debits of ${money(totalDebit)} equal total credits. The trial balance can be carried into the P&L and balance sheet.`
        : `There is a difference of ${money(Math.abs(totalDebit - totalCredit))}. Check for unposted or one-sided vouchers in the day book before closing the period.`),
    });
    mount.appendChild(node);
  },
};

/* ================================================ finance/profit-loss ===== */

routes['finance/profit-loss'] = {
  title: 'Profit & Loss',
  subtitle: 'Income and expenditure statement for the year to date',
  section: 'finance',
  render(mount, ctx) {
    ensureStyles();
    const income = db.accounts.filter((a) => a.type === 'Income' && !a.group);
    const expense = db.accounts.filter((a) => a.type === 'Expense' && !a.group);
    const totalIncome = income.reduce((a, r) => a + r.balance, 0);
    const totalExpense = expense.reduce((a, r) => a + r.balance, 0);
    const surplus = totalIncome - totalExpense;

    const statement = h('table', { className: 'fin-statement' },
      h('tbody', null,
        h('tr', { dataset: { level: 'head' } }, h('td', null, 'Income'), h('td', { className: 'num' }, 'Amount'), h('td', { className: 'num' }, '% of income')),
        income.map((a) => h('tr', { dataset: { level: 'sub' } },
          h('td', null, a.name),
          h('td', { className: 'num' }, money(a.balance)),
          h('td', { className: 'num' }, formatPercent((a.balance / totalIncome) * 100)))),
        h('tr', { dataset: { level: 'total' } }, h('td', null, 'Total income'), h('td', { className: 'num' }, money(totalIncome)), h('td', { className: 'num' }, '100.0%')),

        h('tr', { dataset: { level: 'head' } }, h('td', null, 'Expenditure'), h('td', { className: 'num' }, 'Amount'), h('td', { className: 'num' }, '% of income')),
        expense.map((a) => h('tr', { dataset: { level: 'sub' } },
          h('td', null, a.name),
          h('td', { className: 'num' }, money(a.balance)),
          h('td', { className: 'num' }, formatPercent((a.balance / totalIncome) * 100)))),
        h('tr', { dataset: { level: 'total' } }, h('td', null, 'Total expenditure'), h('td', { className: 'num' }, money(totalExpense)), h('td', { className: 'num' }, formatPercent((totalExpense / totalIncome) * 100))),

        h('tr', { dataset: { level: 'total' } },
          h('td', null, surplus >= 0 ? 'Surplus for the year' : 'Deficit for the year'),
          h('td', { className: 'num' }, money(Math.abs(surplus))),
          h('td', { className: 'num' }, formatPercent((surplus / totalIncome) * 100)))));

    const host = h('div', { className: 'stack' });

    host.appendChild(kpiRow([
      { label: 'Total income', value: cmoney(totalIncome), icon: 'trending-up', tone: 'success', delta: 8.1, deltaLabel: 'vs last year' },
      { label: 'Total expenditure', value: cmoney(totalExpense), icon: 'trending-down', tone: 'danger', delta: 5.7, deltaLabel: 'vs last year' },
      { label: surplus >= 0 ? 'Surplus' : 'Deficit', value: cmoney(Math.abs(surplus)), icon: 'scale', tone: surplus >= 0 ? 'brand' : 'danger' },
      { label: 'Operating margin', value: formatPercent((surplus / Math.max(1, totalIncome)) * 100), icon: 'percent', tone: 'info', footer: 'Surplus as a share of income' },
    ]));

    host.appendChild(SectionCard({ title: 'From income to surplus', subtitle: 'Where the money goes', className: 'chart-card' },
      waterfallChart({
        items: [
          { label: 'Total income', value: totalIncome, type: 'start' },
          ...sortBy(expense, 'balance', 'desc').slice(0, 6).map((a) => ({ label: a.name, value: -a.balance })),
          { label: 'Surplus', value: surplus, type: 'total' },
        ],
        valueFormat: 'currencyCompact', height: 320,
      })));

    host.appendChild(h('div', { className: 'widget-grid' },
      h('div', { className: 'span-7' }, (() => {
        const card = SectionCard({
          title: 'Income & expenditure statement',
          subtitle: `For the period 1 April 2026 to ${formatDate(TODAY, 'long')}`,
          icon: 'file-text', flush: true,
          actions: h('div', { className: 'row' },
            Button('Export', { variant: 'ghost', size: 'sm', icon: 'download', onClick: () => { download('profit-and-loss.csv', toCsv(income.concat(expense).map((a) => ({ Type: a.type, Ledger: a.name, Amount: a.balance }))), 'text/csv;charset=utf-8'); notify({ title: 'P&L exported', tone: 'success' }); } }),
            Button('Print', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(statement, 'Profit and Loss Statement') })),
        });
        card.querySelector('.card-body').appendChild(h('div', { className: 'fin-scroll' }, statement));
        return card;
      })()),
      h('div', { className: 'span-5' }, h('div', { className: 'stack-3' },
        SectionCard({ title: 'Income mix', className: 'chart-card' },
          donutChart({ data: income.map((a) => ({ key: a.name, value: a.balance })), height: 240, valueFormat: 'currencyCompact', centerValue: cmoney(totalIncome), centerLabel: 'Income' })),
        SectionCard({ title: 'Expenditure mix', className: 'chart-card' },
          donutChart({ data: sortBy(expense, 'balance', 'desc').map((a) => ({ key: a.name, value: a.balance })), height: 240, valueFormat: 'currencyCompact', centerValue: cmoney(totalExpense), centerLabel: 'Expense' })),
        Callout({ tone: 'info', icon: 'info', title: 'Basis of preparation' },
          'Prepared on the accrual basis. Depreciation for the year has been charged. Figures are unaudited and cover the period to date.')))));

    host.appendChild(SectionCard({ title: 'Revenue and expense trend', subtitle: 'Monthly, current academic year', className: 'chart-card' },
      comboChart({
        categories: analytics.revenueVsExpense.slice(0, 5).map((r) => r.month),
        bars: [
          { name: 'Revenue', values: analytics.revenueVsExpense.slice(0, 5).map((r) => r.revenue) },
          { name: 'Expense', values: analytics.revenueVsExpense.slice(0, 5).map((r) => r.expense) },
        ],
        line: { name: 'Surplus', values: analytics.revenueVsExpense.slice(0, 5).map((r) => r.surplus) },
        valueFormat: 'currencyCompact', height: 300,
      })));

    mount.appendChild(page({
      title: 'Profit & Loss',
      subtitle: `${cmoney(totalIncome)} income · ${cmoney(totalExpense)} expenditure · ${cmoney(Math.abs(surplus))} ${surplus >= 0 ? 'surplus' : 'deficit'}`,
      route: 'finance/profit-loss',
      actions: [
        Button('Trial balance', { variant: 'secondary', icon: 'scale', route: 'finance/trial-balance' }),
        Button('Export pack', { variant: 'primary', icon: 'download', onClick: () => notify({ title: 'Financial pack exported', text: 'P&L, trial balance and schedules bundled as one workbook.', tone: 'success' }) }),
      ],
      children: host,
    }));
  },
};

/* =================================================== finance/reports ====== */

routes['finance/reports'] = {
  title: 'Financial Reports',
  subtitle: 'Statutory and management reporting pack',
  section: 'finance',
  render(mount, ctx) {
    ensureStyles();
    const campusMap = CAMPUS_MAP();
    const rows = db.campuses.map((c) => {
      const income = db.payments.filter((p) => p.campusId === c.id && p.status === 'Success').reduce((a, p) => a + p.amount, 0);
      const expense = db.expenses.filter((e) => e.campusId === c.id).reduce((a, e) => a + e.amount, 0);
      const students = db.students.filter((s) => s.campusId === c.id && s.status === 'Active').length;
      return {
        campusId: c.id,
        campus: c.name,
        city: c.city,
        board: c.board,
        students,
        income,
        expense,
        surplus: income - expense,
        margin: Math.round(((income - expense) / Math.max(1, income)) * 1000) / 10,
        perStudent: Math.round(income / Math.max(1, students)),
        costPerStudent: Math.round(expense / Math.max(1, students)),
      };
    });

    const node = reportPage({
      title: 'Financial Reports',
      subtitle: `Campus-wise income, expenditure and surplus · ${AY_LABEL}`,
      route: 'finance/reports',
      filters: [
        { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'q1', label: 'Q1' }, { id: 'q2', label: 'Q2' }, { id: 'ytd', label: 'YTD' }] },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'board', label: 'Board', options: distinct(db.campuses, 'board') },
      ],
      onFilter: (id, v, all2, table) => table && table.refresh(applyFilters(rows, all2, { searchKeys: ['campus', 'city'] })),
      summary: [
        { label: 'Income', value: cmoney(sum(rows, 'income')), icon: 'trending-up', tone: 'success', delta: 8.1 },
        { label: 'Expenditure', value: cmoney(sum(rows, 'expense')), icon: 'trending-down', tone: 'danger', delta: 5.7 },
        { label: 'Surplus', value: cmoney(sum(rows, 'surplus')), icon: 'scale', tone: 'brand' },
        { label: 'Revenue per student', value: money(Math.round(sum(rows, 'income') / Math.max(1, sum(rows, 'students')))), icon: 'graduation-cap', tone: 'info' },
      ],
      chart: [
        barChart({
          categories: rows.map((r) => r.campus.split('—').pop().trim()),
          series: [
            { name: 'Income', values: rows.map((r) => r.income) },
            { name: 'Expenditure', values: rows.map((r) => r.expense) },
          ],
          valueFormat: 'currencyCompact', height: 280,
        }),
        scatterPlot({
          points: rows.map((r) => ({ x: r.students, y: r.perStudent, label: r.campus, group: r.board })),
          xLabel: 'Students', yLabel: 'Revenue per student', height: 280,
        }),
      ],
      chartTitle: 'Income against expenditure by campus',
      columns: [
        { key: 'campus', label: 'Campus', sticky: true, width: 240 },
        { key: 'city', label: 'City', width: 140, filter: true },
        { key: 'board', label: 'Board', width: 110, filter: true },
        { key: 'students', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => num(r.students), value: (r) => r.students, format: (v) => num(v) },
        moneyCol('income', 'Income', { width: 160 }),
        moneyCol('expense', 'Expenditure', { width: 160 }),
        moneyCol('surplus', 'Surplus', { width: 160 }),
        { key: 'margin', label: 'Margin', width: 130, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v), render: (r) => formatPercent(r.margin) },
        moneyCol('perStudent', 'Revenue / student', { width: 170, aggregate: 'avg' }),
        moneyCol('costPerStudent', 'Cost / student', { width: 160, aggregate: 'avg' }),
      ],
      rows,
      tableTitle: 'Campus-wise financial summary',
      footerAggregates: true,
      notes: Callout({ tone: 'info', icon: 'info', title: 'Reading this report' },
        'Income is money actually received against fee invoices. Expenditure is booked vouchers excluding depreciation. Margin is surplus as a share of income.'),
    });
    mount.appendChild(node);
  },
};

/* ========================================================================== */
/*  REPORTS                                                                   */
/* ========================================================================== */

const REPORT_CATALOG = [
  /* --- Students & academics --- */
  { id: 'R01', name: 'Class performance summary', category: 'Academics', icon: 'chart-bar', route: 'reports/academic', desc: 'Average, pass rate and distinctions for every class.', owner: 'Vice Principal', popular: true },
  { id: 'R02', name: 'Subject-wise performance', category: 'Academics', icon: 'book-open', route: 'reports/academic', desc: 'Highest, lowest and mean marks per subject.' },
  { id: 'R03', name: 'Term comparison', category: 'Academics', icon: 'trending-up', route: 'reports/academic', desc: 'Term 1 against Term 2 for each class and stream.' },
  { id: 'R04', name: 'Grade distribution', category: 'Academics', icon: 'percent', route: 'reports/academic', desc: 'A1 to E spread across classes and subjects.' },
  { id: 'R05', name: 'Merit list', category: 'Academics', icon: 'trophy', route: 'examination/merit-list', desc: 'Rank order by aggregate percentage.' },
  { id: 'R06', name: 'Improvement and decline', category: 'Academics', icon: 'activity', route: 'reports/academic', desc: 'Students who moved most between assessments.' },
  { id: 'R07', name: 'Syllabus coverage', category: 'Academics', icon: 'clipboard-list', route: 'academics/syllabus-tracker', desc: 'Planned against completed topics by subject.' },
  { id: 'R08', name: 'Learning outcome attainment', category: 'Academics', icon: 'target', route: 'academics/learning-outcomes', desc: 'Percentage attainment against each outcome.' },

  /* --- Attendance --- */
  { id: 'R10', name: 'Daily attendance register', category: 'Attendance', icon: 'clipboard-check', route: 'reports/attendance', desc: 'Section-wise present, absent and late counts.', popular: true },
  { id: 'R11', name: 'Monthly attendance summary', category: 'Attendance', icon: 'calendar', route: 'reports/attendance', desc: 'Working days, present days and percentage per student.' },
  { id: 'R12', name: 'Attendance defaulters (<75%)', category: 'Attendance', icon: 'alert-triangle', route: 'attendance/defaulters', desc: 'Students below the board eligibility threshold.' },
  { id: 'R13', name: 'Class-wise attendance', category: 'Attendance', icon: 'grid', route: 'reports/attendance', desc: 'Compare attendance across every class.' },
  { id: 'R14', name: 'Late arrival analysis', category: 'Attendance', icon: 'timer', route: 'attendance/late-early', desc: 'Repeat late arrivals with minutes lost.' },
  { id: 'R15', name: 'Staff attendance', category: 'Attendance', icon: 'briefcase', route: 'reports/hr', desc: 'Present, leave and absent days by department.' },

  /* --- Admissions --- */
  { id: 'R20', name: 'Admission funnel', category: 'Admissions', icon: 'workflow', route: 'reports/admissions', desc: 'Enquiry to enrolment conversion at each stage.', popular: true },
  { id: 'R21', name: 'Source attribution', category: 'Admissions', icon: 'globe', route: 'reports/admissions', desc: 'Which channels bring the most admissions.' },
  { id: 'R22', name: 'Class-wise seat fill', category: 'Admissions', icon: 'grid', route: 'reports/admissions', desc: 'Seats, applications and admissions per class.' },
  { id: 'R23', name: 'Counsellor performance', category: 'Admissions', icon: 'users', route: 'admissions/reports', desc: 'Enquiries handled and conversion by officer.' },
  { id: 'R24', name: 'Lost enquiry analysis', category: 'Admissions', icon: 'user-x', route: 'admissions/reports', desc: 'Reasons parents did not proceed.' },

  /* --- Fees --- */
  { id: 'R30', name: 'Fee collection summary', category: 'Fees', icon: 'wallet', route: 'reports/fees', desc: 'Billed, collected and outstanding by class.', popular: true },
  { id: 'R31', name: 'Daily collection register', category: 'Fees', icon: 'receipt', route: 'fees/receipts', desc: 'Counter-wise receipts issued each day.' },
  { id: 'R32', name: 'Outstanding ageing', category: 'Fees', icon: 'timer', route: 'fees/outstanding', desc: 'Dues bucketed 0-30, 31-60, 61-90 and 90+ days.', popular: true },
  { id: 'R33', name: 'Defaulter list', category: 'Fees', icon: 'user-x', route: 'fees/defaulters', desc: 'Students with unpaid installments and contacts.' },
  { id: 'R34', name: 'Head-wise collection', category: 'Fees', icon: 'layers', route: 'reports/fees', desc: 'Tuition, transport, hostel and other heads.' },
  { id: 'R35', name: 'Mode-wise collection', category: 'Fees', icon: 'credit-card', route: 'reports/fees', desc: 'Cash, cheque, UPI, card and net banking split.' },
  { id: 'R36', name: 'Concession and scholarship cost', category: 'Fees', icon: 'gift', route: 'fees/scholarships', desc: 'Value of every waiver granted this year.' },
  { id: 'R37', name: 'Refunds issued', category: 'Fees', icon: 'refresh-ccw', route: 'fees/refunds', desc: 'Refund requests, approvals and payouts.' },
  { id: 'R38', name: 'Cancelled receipts audit', category: 'Fees', icon: 'x-circle', route: 'fees/cancelled-receipts', desc: 'Cancellations with the reason and user id.' },
  { id: 'R39', name: 'Online payment reconciliation', category: 'Fees', icon: 'globe', route: 'fees/online-payments', desc: 'Gateway settlements matched to the bank.' },

  /* --- Finance --- */
  { id: 'R40', name: 'Income & expenditure', category: 'Finance', icon: 'scale', route: 'reports/finance', desc: 'Monthly revenue against expense with surplus.', popular: true },
  { id: 'R41', name: 'Trial balance', category: 'Finance', icon: 'notebook', route: 'finance/trial-balance', desc: 'Debit and credit balance of every ledger.' },
  { id: 'R42', name: 'Profit & loss statement', category: 'Finance', icon: 'chart-line', route: 'finance/profit-loss', desc: 'Income and expenditure account for the year.' },
  { id: 'R43', name: 'Budget vs actual', category: 'Finance', icon: 'target', route: 'finance/budgets', desc: 'Utilisation and variance by budget head.' },
  { id: 'R44', name: 'Cash book', category: 'Finance', icon: 'wallet', route: 'finance/cash-book', desc: 'Cash receipts and payments with running balance.' },
  { id: 'R45', name: 'Day book', category: 'Finance', icon: 'book', route: 'finance/day-book', desc: 'Every posting in chronological order.' },
  { id: 'R46', name: 'Vendor payables', category: 'Finance', icon: 'truck', route: 'finance/vendors', desc: 'Outstanding balances and ageing by supplier.' },
  { id: 'R47', name: 'Purchase order status', category: 'Finance', icon: 'shopping-cart', route: 'finance/purchase-orders', desc: 'Open, partially received and closed orders.' },
  { id: 'R48', name: 'Asset depreciation schedule', category: 'Finance', icon: 'archive', route: 'finance/depreciation', desc: 'Written-down value asset by asset.' },
  { id: 'R49', name: 'GST input credit', category: 'Finance', icon: 'percent', route: 'finance/expenses', desc: 'Input tax claimable from vendor bills.' },

  /* --- HR & payroll --- */
  { id: 'R50', name: 'Employee master', category: 'HR & Payroll', icon: 'users', route: 'reports/hr', desc: 'Headcount by department, band and type.', popular: true },
  { id: 'R51', name: 'Payroll register', category: 'HR & Payroll', icon: 'banknote', route: 'hr/payroll-runs', desc: 'Gross, deductions and net for each month.' },
  { id: 'R52', name: 'Leave balance', category: 'HR & Payroll', icon: 'calendar', route: 'hr/leave-balance', desc: 'CL, SL and EL balances by employee.' },
  { id: 'R53', name: 'Attrition analysis', category: 'HR & Payroll', icon: 'log-out', route: 'reports/hr', desc: 'Resignations and reasons over time.' },
  { id: 'R54', name: 'Appraisal ratings', category: 'HR & Payroll', icon: 'star', route: 'hr/appraisal', desc: 'Rating distribution across departments.' },
  { id: 'R55', name: 'Teacher workload', category: 'HR & Payroll', icon: 'gauge', route: 'teachers/workload', desc: 'Weekly periods per teacher against the norm.' },
  { id: 'R56', name: 'Statutory compliance', category: 'HR & Payroll', icon: 'shield-check', route: 'reports/hr', desc: 'PF, ESI and TDS remittance summary.' },

  /* --- Transport --- */
  { id: 'R60', name: 'Route utilisation', category: 'Transport', icon: 'route', route: 'reports/transport', desc: 'Seats used against capacity for every route.', popular: true },
  { id: 'R61', name: 'Vehicle running cost', category: 'Transport', icon: 'fuel', route: 'reports/transport', desc: 'Fuel, maintenance and cost per kilometre.' },
  { id: 'R62', name: 'Bus attendance', category: 'Transport', icon: 'clipboard-check', route: 'transport/bus-attendance', desc: 'Boarded against expected per trip.' },
  { id: 'R63', name: 'Document expiry', category: 'Transport', icon: 'shield', route: 'transport/documents', desc: 'Insurance, PUC, fitness and permit due dates.' },
  { id: 'R64', name: 'Transport fee collection', category: 'Transport', icon: 'wallet', route: 'transport/fees', desc: 'Route-wise transport fee realisation.' },

  /* --- Hostel --- */
  { id: 'R70', name: 'Hostel occupancy', category: 'Hostel', icon: 'bed', route: 'reports/hostel', desc: 'Beds occupied and vacant by block and floor.', popular: true },
  { id: 'R71', name: 'Mess consumption', category: 'Hostel', icon: 'utensils', route: 'hostel/mess-attendance', desc: 'Meals served against residents on roll.' },
  { id: 'R72', name: 'Hostel fee status', category: 'Hostel', icon: 'wallet', route: 'hostel/fees', desc: 'Hostel and mess dues by resident.' },
  { id: 'R73', name: 'Gate pass register', category: 'Hostel', icon: 'log-out', route: 'hostel/gate-pass', desc: 'Outings, returns and overdue passes.' },

  /* --- Library --- */
  { id: 'R80', name: 'Circulation summary', category: 'Library', icon: 'library', route: 'reports/library', desc: 'Issued, returned and overdue by month.', popular: true },
  { id: 'R81', name: 'Overdue and fines', category: 'Library', icon: 'rupee', route: 'library/fines', desc: 'Books overdue with fine accrued.' },
  { id: 'R82', name: 'Category-wise stock', category: 'Library', icon: 'book', route: 'reports/library', desc: 'Titles and copies held per category.' },
  { id: 'R83', name: 'Most issued titles', category: 'Library', icon: 'trending-up', route: 'reports/library', desc: 'The books students actually borrow.' },
  { id: 'R84', name: 'Member activity', category: 'Library', icon: 'users', route: 'library/members', desc: 'Issues per member and dormant accounts.' },

  /* --- Inventory --- */
  { id: 'R90', name: 'Stock valuation', category: 'Inventory', icon: 'box', route: 'reports/inventory', desc: 'Closing stock value by category and store.', popular: true },
  { id: 'R91', name: 'Reorder alert', category: 'Inventory', icon: 'alert-circle', route: 'inventory/stock', desc: 'Items at or below the reorder level.' },
  { id: 'R92', name: 'Stock movement', category: 'Inventory', icon: 'refresh-ccw', route: 'inventory/stock', desc: 'Receipts and issues over the period.' },
  { id: 'R93', name: 'Asset register', category: 'Inventory', icon: 'archive', route: 'inventory/assets', desc: 'Every asset with location and condition.' },
  { id: 'R94', name: 'Consumption by department', category: 'Inventory', icon: 'building', route: 'reports/inventory', desc: 'Who consumes the most stock.' },

  /* --- Management --- */
  { id: 'R99', name: 'MIS management pack', category: 'Management', icon: 'chart-line', route: 'reports/mis', desc: 'The single board-level pack across every module.', popular: true },
  { id: 'R98', name: 'Enrolment trend', category: 'Management', icon: 'trending-up', route: 'reports/mis', desc: 'Five-year student and staff growth.' },
  { id: 'R97', name: 'Campus scorecard', category: 'Management', icon: 'building-columns', route: 'finance/reports', desc: 'Compare all five campuses on one page.' },
  { id: 'R96', name: 'Complaint and SLA', category: 'Management', icon: 'alert-circle', route: 'complaints/reports', desc: 'Tickets raised, resolved and SLA breaches.' },
  { id: 'R95', name: 'Custom report builder', category: 'Management', icon: 'tool', route: 'reports/builder', desc: 'Build your own report from any module.' },
];

const REPORT_CATEGORIES = ['All', ...Array.from(new Set(REPORT_CATALOG.map((r) => r.category)))];

/* ==================================================== reports/centre ====== */

routes['reports/centre'] = {
  title: 'Report Centre',
  subtitle: 'Every report in the system, in one searchable catalogue',
  section: 'reports',
  render(mount, ctx) {
    ensureStyles();
    let term = '';
    let category = 'All';
    let onlyPopular = false;
    const grid = h('div', { className: 'fin-cat-grid' });
    const countLabel = h('div', { className: 't-sm t-muted' });

    const paintGrid = () => {
      grid.innerHTML = '';
      let list = REPORT_CATALOG;
      if (category !== 'All') list = list.filter((r) => r.category === category);
      if (onlyPopular) list = list.filter((r) => r.popular);
      if (term) {
        const t = term.toLowerCase();
        list = list.filter((r) => (r.name + ' ' + r.desc + ' ' + r.category).toLowerCase().includes(t));
      }
      countLabel.textContent = `${list.length} of ${REPORT_CATALOG.length} reports`;

      if (!list.length) {
        grid.appendChild(EmptyState({
          icon: 'search', title: 'No report matches that search',
          text: `Nothing in the catalogue matches "${term}". Try a module name such as fees, attendance or payroll.`,
          action: Button('Clear filters', { variant: 'secondary', icon: 'refresh', onClick: () => { term = ''; category = 'All'; onlyPopular = false; paint(); } }),
        }));
        return;
      }

      for (const r of list) {
        grid.appendChild(h('button', {
          className: 'fin-cat-card', type: 'button',
          attrs: { 'aria-label': `Open ${r.name}` },
          onClick: () => navigate(r.route),
        },
          h('div', { className: 'row-3' },
            h('span', { className: 'fin-cat-ico', html: icon(r.icon, 18) }),
            h('span', { className: 'spacer' }),
            r.popular ? Badge('Popular', { tone: 'brand', size: 'sm' }) : null),
          h('div', { className: 'fin-cat-title' }, r.name),
          h('div', { className: 't-sm t-muted t-clamp-2' }, r.desc),
          h('div', { className: 'row-3 mt-2' },
            Badge(r.category, { tone: 'neutral', size: 'sm' }),
            h('span', { className: 'spacer' }),
            h('span', { className: 't-xs t-muted t-mono' }, r.id))));
      }
    };

    const host = h('div', { className: 'stack' });

    function paint() {
      host.innerHTML = '';

      host.appendChild(kpiRow([
        { label: 'Reports available', value: REPORT_CATALOG.length, icon: 'grid', tone: 'brand', footer: `${REPORT_CATEGORIES.length - 1} categories` },
        { label: 'Scheduled', value: 18, icon: 'clock', tone: 'info', footer: 'Delivered by email automatically', onClick: () => navigate('reports/scheduled') },
        { label: 'Run this month', value: num(1284), icon: 'activity', tone: 'success', delta: 12.4, deltaLabel: 'vs last month' },
        { label: 'Custom reports', value: 9, icon: 'tool', tone: 'warning', footer: 'Built with the report builder', onClick: () => navigate('reports/builder') },
      ]));

      host.appendChild(Card({ className: 'p-0' }, FilterBar({
        filters: [
          { id: 'q', type: 'search', label: 'Search reports', placeholder: 'Search 60+ reports by name or module...', width: '340px', value: term },
          { id: 'category', label: 'Category', options: REPORT_CATEGORIES.filter((c) => c !== 'All'), value: category === 'All' ? 'all' : category },
        ],
        onChange: (id, v) => {
          if (id === 'q') { term = v; paintGrid(); }
          if (id === 'category') { category = v === 'all' ? 'All' : v; paintGrid(); }
        },
        actions: h('div', { className: 'row' },
          countLabel,
          Button(onlyPopular ? 'Showing popular' : 'Popular only', { variant: onlyPopular ? 'primary' : 'ghost', size: 'sm', icon: 'star', onClick: () => { onlyPopular = !onlyPopular; paint(); } }),
          Button('Report builder', { variant: 'secondary', size: 'sm', icon: 'tool', route: 'reports/builder' })),
      })));

      host.appendChild(SectionCard({
        title: category === 'All' ? 'All reports' : category + ' reports',
        subtitle: 'Click a card to open the report with its filters, chart and export actions',
        icon: 'grid',
      }, grid));

      host.appendChild(h('div', { className: 'widget-grid' },
        h('div', { className: 'span-6' }, SectionCard({ title: 'Reports by category', className: 'chart-card' },
          barChart({
            categories: REPORT_CATEGORIES.filter((c) => c !== 'All'),
            series: [{ name: 'Reports', values: REPORT_CATEGORIES.filter((c) => c !== 'All').map((c) => REPORT_CATALOG.filter((r) => r.category === c).length) }],
            horizontal: true, showValues: true, height: 320,
          }))),
        h('div', { className: 'span-6' }, SectionCard({ title: 'Most-run reports this month', icon: 'trending-up' },
          RankList(REPORT_CATALOG.filter((r) => r.popular).map((r, i) => ({
            name: r.name, meta: r.category, value: num(420 - i * 37),
          })))))));

      paintGrid();
    }

    paint();

    mount.appendChild(page({
      title: 'Report Centre',
      subtitle: `${REPORT_CATALOG.length} reports across ${REPORT_CATEGORIES.length - 1} modules · ${campusName(campusOf(ctx))}`,
      route: 'reports/centre',
      actions: [
        Button('Scheduled reports', { variant: 'secondary', icon: 'clock', route: 'reports/scheduled' }),
        Button('Build a report', { variant: 'primary', icon: 'tool', route: 'reports/builder' }),
      ],
      children: host,
    }));
  },
};

/* =================================================== reports/builder ====== */

const BUILDER_MODULES = {
  Students: { collection: () => db.students, fields: ['name', 'admissionNo', 'className', 'section', 'gender', 'house', 'category', 'attendancePct', 'cgpa', 'feeTotal', 'feePaid', 'feeDue', 'feeStatus', 'status'] },
  Staff: { collection: () => db.staff, fields: ['name', 'employeeCode', 'department', 'designation', 'type', 'band', 'experienceYears', 'qualification', 'salaryGross', 'salaryNet', 'attendancePct', 'appraisalRating', 'status'] },
  Invoices: { collection: () => db.invoices, fields: ['invoiceNo', 'studentName', 'className', 'quarter', 'issueDate', 'dueDate', 'amount', 'discount', 'lateFee', 'paid', 'balance', 'status'] },
  Payments: { collection: () => db.payments, fields: ['receiptNo', 'studentName', 'className', 'date', 'amount', 'mode', 'bank', 'collectedByName', 'status'] },
  Expenses: { collection: () => db.expenses, fields: ['voucherNo', 'date', 'category', 'description', 'amount', 'gst', 'paymentMode', 'status'] },
  Attendance: { collection: () => db.attendance, fields: ['date', 'strength', 'present', 'absent', 'late', 'leave', 'percent', 'status'] },
  Marks: { collection: () => db.marks, fields: ['studentName', 'className', 'section', 'subjectName', 'maxMarks', 'marksObtained', 'percent', 'grade', 'status'] },
  Books: { collection: () => db.books, fields: ['accessionNo', 'title', 'author', 'publisher', 'category', 'language', 'year', 'price', 'totalCopies', 'issuedCopies', 'status'] },
  Vehicles: { collection: () => db.vehicles, fields: ['regNo', 'model', 'type', 'capacity', 'onboard', 'utilisation', 'fuelType', 'mileage', 'odometer', 'status'] },
};

routes['reports/builder'] = {
  title: 'Custom Report Builder',
  subtitle: 'Pick a module, choose fields, add filters and preview instantly',
  section: 'reports',
  render(mount, ctx) {
    ensureStyles();
    let moduleName = 'Students';
    let fields = ['name', 'className', 'attendancePct', 'feeDue', 'feeStatus'];
    let groupField = 'none';
    let sortField = 'name';
    let limit = 50;
    const filterRows = [{ field: 'status', op: 'is', value: 'Active' }];

    const previewHost = h('div', { className: 'stack-3' });
    const host = h('div', { className: 'stack' });

    const OPS = ['is', 'is not', 'contains', 'greater than', 'less than'];

    function computeRows() {
      const def = BUILDER_MODULES[moduleName];
      let rows = def.collection();
      for (const f of filterRows) {
        if (!f.field || f.value === '' || f.value == null) continue;
        rows = rows.filter((r) => {
          const v = r[f.field];
          switch (f.op) {
            case 'is': return String(v) === String(f.value);
            case 'is not': return String(v) !== String(f.value);
            case 'contains': return String(v || '').toLowerCase().includes(String(f.value).toLowerCase());
            case 'greater than': return Number(v) > Number(f.value);
            case 'less than': return Number(v) < Number(f.value);
            default: return true;
          }
        });
      }
      if (sortField && sortField !== 'none') rows = sortBy(rows, sortField, 'asc');
      return rows;
    }

    function paintPreview() {
      previewHost.innerHTML = '';
      const rows = computeRows();
      const shown = rows.slice(0, limit);

      if (!fields.length) {
        previewHost.appendChild(EmptyState({ icon: 'columns', title: 'Pick at least one field', text: 'Choose the columns you want in the report and the preview appears here.' }));
        return;
      }
      if (!rows.length) {
        previewHost.appendChild(EmptyState({ icon: 'filter', title: 'No rows match those filters', text: 'Relax a filter — the module has data but nothing satisfies every condition.', action: Button('Clear filters', { variant: 'secondary', icon: 'refresh', onClick: () => { filterRows.length = 0; filterRows.push({ field: '', op: 'is', value: '' }); paint(); } }) }));
        return;
      }

      previewHost.appendChild(h('div', { className: 'row-3 row-wrap' },
        Badge(`${num(rows.length)} rows`, { tone: 'brand' }),
        Badge(`${fields.length} columns`, { tone: 'info' }),
        groupField !== 'none' ? Badge(`Grouped by ${groupField}`, { tone: 'neutral' }) : null,
        h('span', { className: 'spacer' }),
        h('span', { className: 't-xs t-muted' }, `Previewing the first ${Math.min(limit, rows.length)} rows`)));

      if (groupField !== 'none') {
        const groups = groupBy(shown, groupField);
        previewHost.appendChild(barChart({
          categories: Array.from(groups.keys()).slice(0, 12).map(String),
          series: [{ name: 'Rows', values: Array.from(groups.values()).slice(0, 12).map((g) => g.length) }],
          height: 220, showValues: true,
        }));
      }

      previewHost.appendChild(DataTable({
        columns: fields.map((f) => ({
          key: f,
          label: f.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
          numeric: typeof (shown[0] || {})[f] === 'number',
          align: typeof (shown[0] || {})[f] === 'number' ? 'right' : 'left',
          aggregate: typeof (shown[0] || {})[f] === 'number' ? 'sum' : null,
          render: (r) => (/fee|amount|salary|price|balance|paid|total/i.test(f) && typeof r[f] === 'number' ? money(r[f]) : String(r[f] ?? '—')),
          value: (r) => r[f],
        })),
        rows: shown,
        pageSize: 25, footerAggregates: true, groupBy: groupField !== 'none' ? groupField : null,
        exportName: `custom-${moduleName.toLowerCase()}`,
      }));
    }

    function filterEditor() {
      const def = BUILDER_MODULES[moduleName];
      const rowsHost = h('div', { className: 'stack-2' });
      const paintFilters = () => {
        rowsHost.innerHTML = '';
        filterRows.forEach((f, idx) => {
          rowsHost.appendChild(h('div', { className: 'fin-mode-fields' },
            Field({ label: idx === 0 ? 'Field' : null },
              Select({ options: def.fields, value: f.field, placeholder: 'Field', onChange: (v) => { f.field = v; paintPreview(); } })),
            Field({ label: idx === 0 ? 'Condition' : null },
              Select({ options: OPS, value: f.op, onChange: (v) => { f.op = v; paintPreview(); } })),
            Field({ label: idx === 0 ? 'Value' : null },
              Input({ value: f.value, placeholder: 'Value', onInput: debounce((v) => { f.value = v; paintPreview(); }, 300) })),
            Field({ label: idx === 0 ? ' ' : null },
              Button('Remove', { variant: 'ghost', icon: 'trash', onClick: () => { filterRows.splice(idx, 1); paintFilters(); paintPreview(); } }))));
        });
        if (!filterRows.length) rowsHost.appendChild(h('div', { className: 't-sm t-muted' }, 'No filters — every row in the module is included.'));
      };
      paintFilters();
      return SectionCard({
        title: '3 · Filters',
        subtitle: 'All conditions must be true for a row to appear',
        icon: 'filter',
        actions: Button('Add filter', { variant: 'ghost', size: 'sm', icon: 'plus', onClick: () => { filterRows.push({ field: def.fields[0], op: 'is', value: '' }); paintFilters(); paintPreview(); } }),
      }, rowsHost);
    }

    function paint() {
      host.innerHTML = '';
      const def = BUILDER_MODULES[moduleName];

      host.appendChild(Callout({ tone: 'brand', icon: 'tool', title: 'Build a report in four steps' },
        'Choose a data module, tick the fields you want, add filters and grouping, then save or schedule it. Nothing is persisted in this prototype.'));

      host.appendChild(h('div', { className: 'widget-grid' },
        h('div', { className: 'span-4' }, SectionCard({ title: '1 · Data module', subtitle: 'Where the rows come from', icon: 'database' },
          h('div', { className: 'stack-2' },
            Select({
              options: Object.keys(BUILDER_MODULES).map((m) => ({ value: m, label: `${m} · ${num(BUILDER_MODULES[m].collection().length)} rows` })),
              value: moduleName,
              onChange: (v) => { moduleName = v; fields = BUILDER_MODULES[v].fields.slice(0, 5); sortField = BUILDER_MODULES[v].fields[0]; filterRows.length = 0; paint(); },
            }),
            h('div', { className: 't-sm t-muted' }, `${num(def.collection().length)} rows available · ${def.fields.length} fields`)))),
        h('div', { className: 'span-8' }, SectionCard({ title: '2 · Fields', subtitle: 'Columns that appear in the report, in order', icon: 'columns' },
          MultiSelect({
            options: def.fields,
            values: fields,
            placeholder: 'Pick the columns…',
            onChange: (v) => { fields = v; paintPreview(); },
          })))));

      host.appendChild(filterEditor());

      host.appendChild(SectionCard({ title: '4 · Group, sort and limit', icon: 'sliders' },
        FormGrid({ cols: 3 },
          Field({ label: 'Group by' }, Select({ options: [{ value: 'none', label: 'No grouping' }].concat(def.fields.map((f) => ({ value: f, label: f }))), value: groupField, onChange: (v) => { groupField = v; paintPreview(); } })),
          Field({ label: 'Sort by' }, Select({ options: def.fields, value: sortField, onChange: (v) => { sortField = v; paintPreview(); } })),
          Field({ label: 'Preview rows' }, Select({ options: ['25', '50', '100', '250'], value: String(limit), onChange: (v) => { limit = Number(v); paintPreview(); } })))));

      host.appendChild(SectionCard({
        title: 'Live preview',
        subtitle: 'Updates as you change any option above',
        icon: 'eye',
        actions: h('div', { className: 'row' },
          Button('Export CSV', { variant: 'ghost', size: 'sm', icon: 'download', onClick: () => {
            const rows = computeRows().slice(0, limit);
            download(`custom-${moduleName.toLowerCase()}.csv`, toCsv(rows, fields.map((f) => ({ key: f, label: f }))), 'text/csv;charset=utf-8');
            notify({ title: 'Report exported', text: `${rows.length} rows`, tone: 'success' });
          } }),
          Button('Schedule', { variant: 'ghost', size: 'sm', icon: 'clock', onClick: () => scheduleReportModal(`Custom — ${moduleName}`) }),
          Button('Save report', { variant: 'primary', size: 'sm', icon: 'check', onClick: () => formPage({
            mode: 'modal', size: 'md', title: 'Save custom report', submitLabel: 'Save to Report Centre',
            sections: [{ title: 'Report', cols: 1, fields: [
              { id: 'name', label: 'Report name', required: true, value: `${moduleName} report`, validate: validators.required },
              { id: 'desc', label: 'Description', type: 'textarea', placeholder: 'What question does this report answer?' },
              { id: 'category', label: 'Category', type: 'select', options: REPORT_CATEGORIES.filter((c) => c !== 'All') },
              { id: 'share', label: 'Visibility', type: 'radio', inline: true, options: ['Only me', 'My department', 'Everyone'] },
            ] }],
            onSubmit: (v) => notify({ title: 'Report saved', text: `${v.name} added to the Report Centre`, tone: 'success' }),
          }) })),
      }, previewHost));

      paintPreview();
    }

    paint();

    mount.appendChild(page({
      title: 'Custom Report Builder',
      subtitle: `${Object.keys(BUILDER_MODULES).length} data modules · build, preview, save and schedule`,
      route: 'reports/builder',
      actions: [
        Button('Report Centre', { variant: 'secondary', icon: 'grid', route: 'reports/centre' }),
        Button('Scheduled reports', { variant: 'secondary', icon: 'clock', route: 'reports/scheduled' }),
      ],
      children: host,
    }));
  },
};

/* ================================================= reports/scheduled ====== */

routes['reports/scheduled'] = {
  title: 'Scheduled Reports',
  subtitle: 'Reports that are generated and emailed automatically',
  section: 'reports',
  render(mount, ctx) {
    ensureStyles();
    const FREQ = ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly'];
    const rows = REPORT_CATALOG.slice(0, 22).map((r, i) => {
      const seed = 'sch' + r.id;
      const freq = pickFor(FREQ, seed);
      return {
        id: 'SCH' + String(100 + i),
        report: r.name,
        category: r.category,
        route: r.route,
        frequency: freq,
        nextRun: `2026-08-${String(21 + (hashOf(seed + 'n') % 8)).padStart(2, '0')}`,
        lastRun: `2026-08-${String(12 + (hashOf(seed + 'l') % 7)).padStart(2, '0')}`,
        time: `0${6 + (hashOf(seed + 't') % 4)}:00`,
        format: pickFor(['Excel', 'PDF', 'CSV'], seed + 'f'),
        recipients: 1 + (hashOf(seed + 'r') % 6),
        owner: pickFor(['Principal', 'Head of Accounts', 'HR Manager', 'Vice Principal', 'Transport Manager'], seed + 'o'),
        runs: 4 + (hashOf(seed + 'c') % 40),
        status: pickFor(['Active', 'Active', 'Active', 'Paused', 'Failed'], seed + 's'),
      };
    });
    const searchKeys = ['report', 'category', 'owner', 'frequency'];

    mount.appendChild(listPage({
      title: 'Scheduled Reports',
      subtitle: `${rows.filter((r) => r.status === 'Active').length} active schedules · ${num(sum(rows, 'runs'))} deliveries this year`,
      route: 'reports/scheduled',
      actions: [
        Button('Report Centre', { variant: 'secondary', icon: 'grid', route: 'reports/centre' }),
        Button('New schedule', { variant: 'primary', icon: 'plus', onClick: () => scheduleReportModal('Select a report') }),
      ],
      kpis: [
        { label: 'Schedules', value: rows.length, icon: 'clock', tone: 'brand', footer: `${rows.filter((r) => r.status === 'Paused').length} paused` },
        { label: 'Due in 24 hours', value: rows.filter((r) => r.nextRun <= '2026-08-21').length, icon: 'calendar-check', tone: 'info' },
        { label: 'Recipients', value: num(sum(rows, 'recipients')), icon: 'mail', tone: 'success', footer: 'Unique inboxes' },
        { label: 'Failed last run', value: rows.filter((r) => r.status === 'Failed').length, icon: 'alert-triangle', tone: 'danger', footer: 'Check the recipient list' },
      ],
      chart: barChart({
        categories: FREQ,
        series: [{ name: 'Schedules', values: FREQ.map((f) => rows.filter((r) => r.frequency === f).length) }],
        height: 220, showValues: true,
      }),
      chartTitle: 'Schedules by frequency',
      tabs: [
        { id: 'all', label: 'All', count: rows.length },
        { id: 'Active', label: 'Active', count: rows.filter((r) => r.status === 'Active').length },
        { id: 'Paused', label: 'Paused', count: rows.filter((r) => r.status === 'Paused').length },
        { id: 'Failed', label: 'Failed', count: rows.filter((r) => r.status === 'Failed').length },
      ],
      activeTab: 'all',
      onTabChange: tabRefresh(mount, rows, (r, id) => r.status === id),
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Report, owner or category...', width: '280px' },
        { id: 'category', label: 'Category', options: REPORT_CATEGORIES.filter((c) => c !== 'All') },
        { id: 'frequency', label: 'Frequency', options: FREQ },
        { id: 'format', label: 'Format', options: ['Excel', 'PDF', 'CSV'] },
        { id: 'status', label: 'Status', options: ['Active', 'Paused', 'Failed'] },
      ],
      onFilter: (id, v, all2, table) => table.refresh(applyFilters(rows, all2, { searchKeys })),
      columns: [
        { key: 'report', label: 'Report', sticky: true, width: 260, render: (r) => h('div', { className: 'stack-1' }, h('span', { className: 't-medium' }, r.report), h('span', { className: 't-xs t-muted' }, r.id + ' · ' + r.category)) },
        { key: 'frequency', label: 'Frequency', width: 130, filter: true, render: (r) => Badge(r.frequency, { tone: 'info' }) },
        { key: 'time', label: 'Run at', width: 100 },
        dateCol('nextRun', 'Next run'),
        dateCol('lastRun', 'Last run'),
        { key: 'format', label: 'Format', width: 100, filter: true },
        { key: 'recipients', label: 'Recipients', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'owner', label: 'Owner', width: 180, filter: true },
        { key: 'runs', label: 'Deliveries', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
        statusCol('status', 'Status', 120),
      ],
      rows,
      selectable: true, footerAggregates: true, searchKeys, pageSize: 25,
      bulkActions: [
        { label: 'Run now', icon: 'zap', onClick: (sel) => notify({ title: `${sel.length} reports queued`, text: 'Delivery emails go out within a minute.', tone: 'success' }) },
        { label: 'Pause', icon: 'bell-off', onClick: (sel) => notify({ title: `${sel.length} schedules paused`, tone: 'warning' }) },
        { label: 'Delete', icon: 'trash', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Delete ${sel.length} schedules?`, text: 'Recipients will stop receiving these reports.', tone: 'danger', confirmLabel: 'Delete' }).then((ok) => ok && notify({ title: 'Schedules deleted', tone: 'danger' })) },
      ],
      rowActions: (row) => [
        { label: 'Open report', icon: 'eye', route: row.route },
        { label: 'Run now', icon: 'zap', onClick: () => notify({ title: 'Report queued', text: row.report, tone: 'success' }) },
        { label: 'Edit schedule', icon: 'edit', onClick: () => scheduleReportModal(row.report) },
        { label: 'Delivery history', icon: 'history', onClick: () => Drawer({
          title: 'Delivery history — ' + row.report, subtitle: `${row.frequency} at ${row.time} · ${row.format}`, size: 'lg',
          body: Timeline(Array.from({ length: 8 }, (_, i) => ({
            title: `Delivered to ${row.recipients} recipients`,
            meta: formatDate(`2026-0${8 - Math.floor(i / 4)}-${String(18 - (i * 2)).padStart(2, '0')}`) + ' · ' + row.time,
            text: `${row.format} attachment · generated in ${2 + (i % 5)}.${i}s`,
            icon: 'mail', tone: i === 2 && row.status === 'Failed' ? 'danger' : 'success',
          }))),
          actions: (close) => Button('Close', { variant: 'primary', onClick: close }),
        }) },
        { separator: true },
        { label: row.status === 'Paused' ? 'Resume' : 'Pause', icon: row.status === 'Paused' ? 'bell' : 'bell-off', onClick: () => notify({ title: row.status === 'Paused' ? 'Schedule resumed' : 'Schedule paused', text: row.report, tone: row.status === 'Paused' ? 'success' : 'warning' }) },
        { label: 'Delete schedule', icon: 'trash', tone: 'danger', onClick: () => ConfirmDialog({ title: `Delete the schedule for ${row.report}?`, tone: 'danger', confirmLabel: 'Delete' }).then((ok) => ok && notify({ title: 'Schedule deleted', tone: 'danger' })) },
      ],
      tableTitle: 'Schedule register',
      exportName: 'scheduled-reports',
      emptyState: emptyFor('Nothing scheduled', 'Schedule any report from the Report Centre and it will land in inboxes automatically.', Button('Report Centre', { variant: 'primary', icon: 'grid', route: 'reports/centre' })),
    }));
  },
};

/* ================================================== reports/academic ====== */

routes['reports/academic'] = {
  title: 'Academic Reports',
  subtitle: 'Class and subject performance across the examination cycle',
  section: 'reports',
  render(mount, ctx) {
    ensureStyles();
    const rows = analytics.classPerformance.map((r) => ({
      ...r,
      grade: r.average >= 85 ? 'A1' : r.average >= 75 ? 'A2' : r.average >= 65 ? 'B1' : r.average >= 55 ? 'B2' : 'C1',
      band: r.average >= 80 ? 'Above target' : r.average >= 70 ? 'On target' : 'Below target',
    }));
    const matrix = analytics.performanceMatrix;

    mount.appendChild(reportPage({
      title: 'Academic Reports',
      subtitle: `Class performance for ${AY_LABEL} · ${campusName(campusOf(ctx))}`,
      route: 'reports/academic',
      filters: [
        { id: 'term', label: 'Term', type: 'segment', options: [{ id: 't1', label: 'Term 1' }, { id: 't2', label: 'Term 2' }, { id: 'ytd', label: 'Full year' }] },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'className', label: 'Class', options: rows.map((r) => r.className) },
        { id: 'band', label: 'Band', options: ['Above target', 'On target', 'Below target'] },
      ],
      onFilter: (id, v, all2, table) => table && table.refresh(applyFilters(rows, all2, { searchKeys: ['className', 'band'] })),
      summary: [
        { label: 'Classes assessed', value: rows.length, icon: 'grid', tone: 'brand' },
        { label: 'Average score', value: formatPercent(avg(rows, 'average')), icon: 'chart-bar', tone: 'info', delta: 1.8, deltaLabel: 'vs Term 1' },
        { label: 'Pass percentage', value: formatPercent(avg(rows, 'passPercent')), icon: 'check-circle', tone: 'success' },
        { label: 'Distinctions', value: num(sum(rows, 'distinctions')), icon: 'award', tone: 'warning', footer: '90% and above' },
      ],
      chart: [
        barChart({
          categories: rows.map((r) => r.className.replace('Class ', '')),
          series: [
            { name: 'Average', values: rows.map((r) => r.average) },
            { name: 'Pass %', values: rows.map((r) => r.passPercent) },
          ],
          valueFormat: 'percent', target: 75, height: 290,
        }),
        heatmap({
          mode: 'matrix', rows: matrix.rows, cols: matrix.cols, values: matrix.values,
          min: 40, max: 100, cellSize: 46, height: 300,
        }),
      ],
      chartTitle: 'Average and pass rate by class',
      columns: [
        { key: 'className', label: 'Class', sticky: true, width: 150 },
        { key: 'level', label: 'Level', width: 90, align: 'right', numeric: true },
        { key: 'strength', label: 'Strength', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => num(r.strength), value: (r) => r.strength, format: (v) => num(v) },
        { key: 'average', label: 'Average', width: 150, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v),
          render: (r) => h('div', { className: 'stack-1', style: { minWidth: '110px' } },
            h('span', { className: 't-num t-sm' }, formatPercent(r.average)),
            ProgressBar(r.average, { size: 'sm', tone: r.average >= 80 ? 'success' : r.average >= 70 ? 'warning' : 'danger' })) },
        { key: 'passPercent', label: 'Pass %', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v), render: (r) => formatPercent(r.passPercent) },
        { key: 'distinctions', label: 'Distinctions', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'grade', label: 'Grade band', width: 120, filter: true, render: (r) => Badge(r.grade, { tone: 'info' }) },
        { key: 'band', label: 'Against target', width: 150, filter: true, render: (r) => Badge(r.band, { tone: r.band === 'Above target' ? 'success' : r.band === 'On target' ? 'warning' : 'danger' }) },
      ],
      rows,
      tableTitle: 'Class performance detail',
      footerAggregates: true,
      notes: SectionCard({ title: 'Subject performance', subtitle: 'Mean, highest and lowest score per subject', className: 'chart-card' },
        barChart({
          categories: analytics.subjectPerformance.map((s) => s.subject),
          series: [
            { name: 'Average', values: analytics.subjectPerformance.map((s) => s.average) },
            { name: 'Highest', values: analytics.subjectPerformance.map((s) => s.highest) },
            { name: 'Lowest', values: analytics.subjectPerformance.map((s) => s.lowest) },
          ],
          valueFormat: 'percent', height: 280,
        })),
    }));
  },
};

/* ================================================ reports/attendance ====== */

routes['reports/attendance'] = {
  title: 'Attendance Reports',
  subtitle: 'Class-wise attendance, trends and defaulters',
  section: 'reports',
  render(mount, ctx) {
    ensureStyles();
    const rows = analytics.attendanceByClass.map((r) => ({
      ...r,
      presentDays: Math.round((r.percent / 100) * 96),
      workingDays: 96,
      absentDays: 96 - Math.round((r.percent / 100) * 96),
      band: r.percent >= 90 ? 'Excellent' : r.percent >= 80 ? 'Acceptable' : r.percent >= 75 ? 'Watch' : 'Below eligibility',
    }));

    mount.appendChild(reportPage({
      title: 'Attendance Reports',
      subtitle: `96 working days to ${formatDate(TODAY)} · ${campusName(campusOf(ctx))}`,
      route: 'reports/attendance',
      filters: [
        { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'month', label: 'This month' }, { id: 'term', label: 'This term' }, { id: 'ytd', label: 'Year to date' }] },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'className', label: 'Class', options: rows.map((r) => r.className) },
        { id: 'band', label: 'Band', options: ['Excellent', 'Acceptable', 'Watch', 'Below eligibility'] },
      ],
      onFilter: (id, v, all2, table) => table && table.refresh(applyFilters(rows, all2, { searchKeys: ['className', 'band'] })),
      summary: [
        { label: 'Average attendance', value: `${analytics.kpis.avgAttendance}%`, icon: 'clipboard-check', tone: 'success', delta: 1.2, trend: analytics.sparks.attendance },
        { label: 'Below 75%', value: num(analytics.attendanceDefaulters.length), icon: 'alert-triangle', tone: 'danger', footer: 'Board eligibility at risk' },
        { label: 'Staff attendance', value: `${analytics.kpis.avgStaffAttendance}%`, icon: 'briefcase', tone: 'info', trend: analytics.sparks.staffAttendance },
        { label: 'Working days', value: '96', icon: 'calendar', tone: 'brand', footer: '1 April to 20 August' },
      ],
      chart: [
        lineChart({
          categories: analytics.attendanceTrend.map((r) => r.month),
          series: [
            { name: 'Students', values: analytics.attendanceTrend.map((r) => r.students) },
            { name: 'Staff', values: analytics.attendanceTrend.map((r) => r.staff) },
          ],
          valueFormat: 'percent', target: 90, targetLabel: 'Target 90%', height: 280, baselineZero: false,
        }),
        heatmap({
          mode: 'calendar', days: analytics.attendanceCalendar, seriesName: 'Daily attendance %',
          min: 75, max: 100, height: 220,
        }),
      ],
      chartTitle: 'Attendance trend against the 90% target',
      columns: [
        { key: 'className', label: 'Class', sticky: true, width: 150 },
        { key: 'level', label: 'Level', width: 90, align: 'right', numeric: true },
        { key: 'strength', label: 'Strength', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => num(r.strength), value: (r) => r.strength, format: (v) => num(v) },
        { key: 'workingDays', label: 'Working days', width: 130, align: 'right', numeric: true },
        { key: 'presentDays', label: 'Avg present', width: 130, align: 'right', numeric: true, aggregate: 'avg' },
        { key: 'absentDays', label: 'Avg absent', width: 130, align: 'right', numeric: true, aggregate: 'avg' },
        { key: 'percent', label: 'Attendance', width: 160, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v),
          render: (r) => h('div', { className: 'stack-1', style: { minWidth: '120px' } },
            h('span', { className: 't-num t-sm' }, formatPercent(r.percent)),
            ProgressBar(r.percent, { size: 'sm', tone: r.percent >= 90 ? 'success' : r.percent >= 75 ? 'warning' : 'danger' })) },
        { key: 'band', label: 'Band', width: 170, filter: true, render: (r) => Badge(r.band, { tone: r.band === 'Excellent' ? 'success' : r.band === 'Acceptable' ? 'info' : r.band === 'Watch' ? 'warning' : 'danger' }) },
      ],
      rows,
      tableTitle: 'Class-wise attendance detail',
      footerAggregates: true,
      notes: SectionCard({ title: 'Attendance defaulters', subtitle: 'Below the 75% board eligibility threshold', icon: 'alert-triangle', flush: true },
        DataTable({
          columns: [
            studentCol('name', (r) => `${r.className}-${r.section}`),
            { key: 'className', label: 'Class', width: 120, filter: true },
            { key: 'present', label: 'Present', width: 110, align: 'right', numeric: true },
            { key: 'total', label: 'Total days', width: 120, align: 'right', numeric: true },
            { key: 'percent', label: 'Attendance', width: 130, align: 'right', numeric: true, render: (r) => h('span', { className: 't-danger t-semibold t-num' }, formatPercent(r.percent)) },
          ],
          rows: analytics.attendanceDefaulters,
          pageSize: 10, searchKeys: ['name', 'className'], exportName: 'attendance-defaulters',
          onRowClick: (r) => navigate(`students/profile/${r.id}`),
          emptyState: EmptyState({ icon: 'check-circle', title: 'No defaulters', text: 'Every student is above the 75% threshold.' }),
        })),
    }));
  },
};

/* ================================================ reports/admissions ====== */

routes['reports/admissions'] = {
  title: 'Admission Reports',
  subtitle: 'Funnel conversion, source attribution and seat fill',
  section: 'reports',
  render(mount, ctx) {
    ensureStyles();
    const rows = analytics.admissionsByClass.map((r) => ({
      ...r,
      fillRate: Math.round((r.admitted / Math.max(1, r.seats)) * 1000) / 10,
      conversion: Math.round((r.admitted / Math.max(1, r.applications)) * 1000) / 10,
      waitlist: Math.max(0, r.applications - r.seats),
    }));

    mount.appendChild(reportPage({
      title: 'Admission Reports',
      subtitle: `${num(analytics.kpis.admissionEnquiries)} enquiries · ${num(analytics.kpis.admissionsConfirmed)} admitted · ${analytics.kpis.conversionRate}% conversion`,
      route: 'reports/admissions',
      filters: [
        { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'q1', label: 'Q1' }, { id: 'q2', label: 'Q2' }, { id: 'ytd', label: 'Session' }] },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'className', label: 'Class', options: rows.map((r) => r.className) },
      ],
      onFilter: (id, v, all2, table) => table && table.refresh(applyFilters(rows, all2, { searchKeys: ['className'] })),
      summary: [
        { label: 'Enquiries', value: num(analytics.kpis.admissionEnquiries), icon: 'message-square', tone: 'brand', trend: analytics.sparks.admissions, delta: 8.4 },
        { label: 'Admitted', value: num(analytics.kpis.admissionsConfirmed), icon: 'user-check', tone: 'success', delta: 6.2 },
        { label: 'Conversion', value: `${analytics.kpis.conversionRate}%`, icon: 'percent', tone: 'info' },
        { label: 'Seats filled', value: formatPercent(avg(rows, 'fillRate')), icon: 'grid', tone: 'warning' },
      ],
      chart: [
        funnelChart({
          stages: analytics.admissionFunnel.map((f) => ({ label: f.stage, value: f.count })),
          showConversion: true, height: 320,
        }),
        comboChart({
          categories: analytics.admissionTrend.map((r) => r.month),
          bars: [
            { name: 'Enquiries', values: analytics.admissionTrend.map((r) => r.enquiries) },
            { name: 'Applications', values: analytics.admissionTrend.map((r) => r.applications) },
          ],
          line: { name: 'Admitted', values: analytics.admissionTrend.map((r) => r.admitted) },
          height: 280,
        }),
      ],
      chartTitle: 'Admission funnel, enquiry to enrolment',
      columns: [
        { key: 'className', label: 'Class', sticky: true, width: 150 },
        { key: 'seats', label: 'Seats', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'applications', label: 'Applications', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'admitted', label: 'Admitted', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'waitlist', label: 'Waitlist', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'fillRate', label: 'Seat fill', width: 160, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v),
          render: (r) => h('div', { className: 'stack-1', style: { minWidth: '120px' } },
            h('span', { className: 't-num t-sm' }, formatPercent(r.fillRate)),
            ProgressBar(Math.min(100, r.fillRate), { size: 'sm', tone: r.fillRate >= 90 ? 'success' : r.fillRate >= 70 ? 'warning' : 'danger' })) },
        { key: 'conversion', label: 'Conversion', width: 130, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v), render: (r) => formatPercent(r.conversion) },
      ],
      rows,
      tableTitle: 'Class-wise seat fill',
      footerAggregates: true,
      notes: SectionCard({ title: 'Where admissions come from', subtitle: 'Source attribution for the current session', className: 'chart-card' },
        donutChart({ data: analytics.admissionSourceSplit, height: 260, centerLabel: 'Enquiries', centerValue: num(analytics.kpis.admissionEnquiries) })),
    }));
  },
};

/* ===================================================== reports/fees ======= */

routes['reports/fees'] = {
  title: 'Fee Reports',
  subtitle: 'Collection, head-wise mix and outstanding position',
  section: 'reports',
  render(mount, ctx) {
    ensureStyles();
    const invoices = byCampus(db.invoices, ctx);
    const byQuarter = ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
      const list = invoices.filter((i) => i.quarter === q);
      const billed = list.reduce((a, i) => a + i.amount, 0);
      const collected = list.reduce((a, i) => a + i.paid, 0);
      return {
        quarter: q,
        period: (list[0] || {}).period || '—',
        invoices: list.length,
        billed,
        discount: list.reduce((a, i) => a + i.discount, 0),
        lateFee: list.reduce((a, i) => a + i.lateFee, 0),
        collected,
        outstanding: list.reduce((a, i) => a + i.balance, 0),
        rate: billed ? Math.round((collected / billed) * 1000) / 10 : 0,
      };
    }).filter((r) => r.invoices > 0);

    const k = analytics.kpis;

    mount.appendChild(reportPage({
      title: 'Fee Reports',
      subtitle: `Quarter-wise collection · ${campusName(campusOf(ctx))} · ${AY_LABEL}`,
      route: 'reports/fees',
      filters: [
        { id: 'quarter', label: 'Quarter', options: ['Q1', 'Q2', 'Q3', 'Q4'] },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'from', label: 'From', type: 'date' },
        { id: 'to', label: 'To', type: 'date' },
      ],
      onFilter: (id, v, all2, table) => table && table.refresh(applyFilters(byQuarter, all2, { searchKeys: ['quarter', 'period'] })),
      summary: [
        { label: 'Billed', value: cmoney(k.feeBilled), icon: 'receipt', tone: 'info' },
        { label: 'Collected', value: cmoney(k.feeCollected), delta: 8.1, icon: 'wallet', tone: 'success', trend: analytics.sparks.collection },
        { label: 'Outstanding', value: cmoney(k.feeOutstanding), delta: -3.2, icon: 'alert-circle', tone: 'danger', trend: analytics.sparks.outstanding },
        { label: 'Collection rate', value: `${k.collectionRate}%`, icon: 'percent', tone: 'brand' },
      ],
      chart: [
        comboChart({
          categories: analytics.feeCollectionVsTarget.map((r) => r.month),
          bars: [{ name: 'Collected', values: analytics.feeCollectionVsTarget.map((r) => r.collected) }],
          line: { name: 'Target', values: analytics.feeCollectionVsTarget.map((r) => r.target) },
          valueFormat: 'currencyCompact', height: 280,
        }),
        donutChart({
          data: analytics.feeHeadSplit, height: 280, valueFormat: 'currencyCompact',
          centerValue: cmoney(sum(analytics.feeHeadSplit, 'value')), centerLabel: 'Billed',
        }),
      ],
      chartTitle: 'Monthly collection against target',
      columns: [
        { key: 'quarter', label: 'Quarter', sticky: true, width: 110 },
        { key: 'period', label: 'Period', width: 170 },
        { key: 'invoices', label: 'Invoices', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => num(r.invoices), value: (r) => r.invoices, format: (v) => num(v) },
        moneyCol('billed', 'Billed', { width: 160 }),
        moneyCol('discount', 'Discounts', { width: 150 }),
        moneyCol('lateFee', 'Late fee', { width: 140 }),
        moneyCol('collected', 'Collected', { width: 160 }),
        moneyCol('outstanding', 'Outstanding', { width: 160 }),
        { key: 'rate', label: 'Collection %', width: 160, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v),
          render: (r) => h('div', { className: 'stack-1', style: { minWidth: '120px' } },
            h('span', { className: 't-num t-sm' }, formatPercent(r.rate)),
            ProgressBar(r.rate, { size: 'sm', tone: r.rate > 90 ? 'success' : r.rate > 70 ? 'warning' : 'danger' })) },
      ],
      rows: byQuarter,
      tableTitle: 'Quarter-wise collection',
      footerAggregates: true,
      notes: SectionCard({ title: 'Top defaulters', subtitle: 'The 40 largest outstanding balances', icon: 'user-x', flush: true },
        DataTable({
          columns: [
            studentCol('name', (r) => `${r.admissionNo} · ${r.className}`),
            { key: 'className', label: 'Class', width: 120, filter: true },
            { key: 'phone', label: 'Phone', width: 150, render: (r) => h('span', { className: 't-mono t-xs' }, r.phone) },
            moneyCol('total', 'Billed'),
            moneyCol('paid', 'Paid'),
            moneyCol('due', 'Outstanding'),
            { key: 'overdueDays', label: 'Overdue', width: 110, align: 'right', numeric: true, render: (r) => `${r.overdueDays} d` },
          ],
          rows: analytics.defaulters,
          pageSize: 10, footerAggregates: true, searchKeys: ['name', 'admissionNo'],
          exportName: 'top-defaulters',
          onRowClick: (r) => navigate(`fees/collection/${r.id}`),
          emptyState: EmptyState({ icon: 'check-circle', title: 'No defaulters', text: 'Everything billed has been collected.' }),
        })),
    }));
  },
};

/* ================================================== reports/finance ======= */

routes['reports/finance'] = {
  title: 'Finance Reports',
  subtitle: 'Revenue, expenditure and surplus month by month',
  section: 'reports',
  render(mount, ctx) {
    ensureStyles();
    const rows = analytics.revenueVsExpense.filter((r) => r.revenue > 0).map((r) => ({
      ...r,
      margin: Math.round((r.surplus / Math.max(1, r.revenue)) * 1000) / 10,
      ratio: Math.round((r.expense / Math.max(1, r.revenue)) * 1000) / 10,
    }));
    const totalRev = sum(rows, 'revenue');
    const totalExp = sum(rows, 'expense');

    mount.appendChild(reportPage({
      title: 'Finance Reports',
      subtitle: `Income and expenditure to ${formatDate(TODAY, 'long')} · all campuses`,
      route: 'reports/finance',
      filters: [
        { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'q1', label: 'Q1' }, { id: 'q2', label: 'Q2' }, { id: 'ytd', label: 'Year to date' }] },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'month', label: 'Month', options: rows.map((r) => r.month) },
      ],
      onFilter: (id, v, all2, table) => table && table.refresh(applyFilters(rows, all2, { searchKeys: ['month'] })),
      summary: [
        { label: 'Revenue', value: cmoney(totalRev), icon: 'trending-up', tone: 'success', trend: analytics.sparks.revenue, delta: 8.1 },
        { label: 'Expenditure', value: cmoney(totalExp), icon: 'trending-down', tone: 'danger', trend: analytics.sparks.expense, delta: 5.7 },
        { label: 'Surplus', value: cmoney(totalRev - totalExp), icon: 'scale', tone: 'brand' },
        { label: 'Expense ratio', value: formatPercent((totalExp / Math.max(1, totalRev)) * 100), icon: 'percent', tone: 'info', footer: 'Expenditure as a share of revenue' },
      ],
      chart: [
        comboChart({
          categories: rows.map((r) => r.month),
          bars: [
            { name: 'Revenue', values: rows.map((r) => r.revenue) },
            { name: 'Expense', values: rows.map((r) => r.expense) },
          ],
          line: { name: 'Surplus', values: rows.map((r) => r.surplus) },
          valueFormat: 'currencyCompact', height: 300,
        }),
        barChart({
          categories: analytics.expenseByCategory.map((r) => r.key),
          series: [{ name: 'Spend', values: analytics.expenseByCategory.map((r) => r.value) }],
          horizontal: true, valueFormat: 'currencyCompact', height: 300,
        }),
      ],
      chartTitle: 'Revenue, expense and surplus',
      columns: [
        { key: 'month', label: 'Month', sticky: true, width: 120 },
        moneyCol('revenue', 'Revenue', { width: 170 }),
        moneyCol('expense', 'Expenditure', { width: 170 }),
        moneyCol('surplus', 'Surplus', { width: 170 }),
        { key: 'margin', label: 'Margin', width: 140, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v), render: (r) => h('span', { className: r.margin >= 0 ? 't-success t-num' : 't-danger t-num' }, formatPercent(r.margin)) },
        { key: 'ratio', label: 'Expense ratio', width: 150, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v), render: (r) => formatPercent(r.ratio) },
      ],
      rows,
      tableTitle: 'Monthly income and expenditure',
      footerAggregates: true,
      notes: SectionCard({ title: 'Budget utilisation', subtitle: 'Spend against allocation by head', className: 'chart-card' },
        bulletChart({
          items: analytics.budgetUtilisation.map((b) => ({ label: b.head, value: b.spent, target: b.allocated })),
          valueFormat: 'currencyCompact', height: 320,
        })),
    }));
  },
};

/* ======================================================= reports/hr ======= */

routes['reports/hr'] = {
  title: 'HR & Payroll Reports',
  subtitle: 'Headcount, payroll cost, leave and attrition',
  section: 'reports',
  render(mount, ctx) {
    ensureStyles();
    const byDept = new Map();
    for (const s of db.staff) {
      const cur = byDept.get(s.department) || { department: s.department, headcount: 0, teaching: 0, gross: 0, net: 0, pf: 0, tds: 0, attendance: 0, leaveTaken: 0, rating: 0 };
      cur.headcount += 1;
      if (s.type === 'Teaching') cur.teaching += 1;
      cur.gross += s.salaryGross;
      cur.net += s.salaryNet;
      cur.pf += s.deductionPf;
      cur.tds += s.deductionTds;
      cur.attendance += s.attendancePct;
      cur.leaveTaken += s.leaveTakenYtd;
      cur.rating += s.appraisalScore || 0;
      byDept.set(s.department, cur);
    }
    const rows = Array.from(byDept.values()).map((r) => ({
      ...r,
      attendance: Math.round((r.attendance / r.headcount) * 10) / 10,
      avgRating: Math.round((r.rating / r.headcount) * 10) / 10,
      avgSalary: Math.round(r.gross / r.headcount),
    }));

    mount.appendChild(reportPage({
      title: 'HR & Payroll Reports',
      subtitle: `${num(db.staff.length)} employees across ${rows.length} departments · ${AY_LABEL}`,
      route: 'reports/hr',
      filters: [
        { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'month', label: 'This month' }, { id: 'qtr', label: 'Quarter' }, { id: 'ytd', label: 'Year to date' }] },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'department', label: 'Department', options: rows.map((r) => r.department) },
      ],
      onFilter: (id, v, all2, table) => table && table.refresh(applyFilters(rows, all2, { searchKeys: ['department'] })),
      summary: [
        { label: 'Headcount', value: num(db.staff.length), icon: 'users', tone: 'brand', footer: `${num(analytics.kpis.teachingStaff)} teaching` },
        { label: 'Monthly payroll', value: cmoney(sum(rows, 'gross')), icon: 'banknote', tone: 'danger', delta: 4.2, deltaLabel: 'vs last month' },
        { label: 'Staff attendance', value: `${analytics.kpis.avgStaffAttendance}%`, icon: 'clipboard-check', tone: 'success', trend: analytics.sparks.staffAttendance },
        { label: 'Student-teacher ratio', value: `${analytics.kpis.studentTeacherRatio}:1`, icon: 'graduation-cap', tone: 'info', footer: 'CBSE norm is 30:1' },
      ],
      chart: [
        barChart({
          categories: sortBy(rows, 'headcount', 'desc').map((r) => r.department),
          series: [
            { name: 'Teaching', values: sortBy(rows, 'headcount', 'desc').map((r) => r.teaching) },
            { name: 'Non-teaching', values: sortBy(rows, 'headcount', 'desc').map((r) => r.headcount - r.teaching) },
          ],
          horizontal: true, stacked: true, height: 320,
        }),
        lineChart({
          categories: analytics.staffAttendance.map((r) => r.month),
          series: [
            { name: 'Present', values: analytics.staffAttendance.map((r) => r.present) },
            { name: 'On leave', values: analytics.staffAttendance.map((r) => r.leave) },
            { name: 'Absent', values: analytics.staffAttendance.map((r) => r.absent) },
          ],
          valueFormat: 'percent', height: 280, baselineZero: false,
        }),
      ],
      chartTitle: 'Headcount by department',
      columns: [
        { key: 'department', label: 'Department', sticky: true, width: 220 },
        { key: 'headcount', label: 'Headcount', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'teaching', label: 'Teaching', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        moneyCol('gross', 'Gross payroll', { width: 170 }),
        moneyCol('net', 'Net payroll', { width: 170 }),
        moneyCol('pf', 'PF', { width: 140 }),
        moneyCol('tds', 'TDS', { width: 140 }),
        moneyCol('avgSalary', 'Average salary', { width: 170, aggregate: 'avg' }),
        { key: 'attendance', label: 'Attendance', width: 130, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v), render: (r) => formatPercent(r.attendance) },
        { key: 'leaveTaken', label: 'Leave days', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'avgRating', label: 'Avg appraisal', width: 140, align: 'right', numeric: true, aggregate: 'avg', render: (r) => r.avgRating.toFixed(1) },
      ],
      rows,
      tableTitle: 'Department-wise HR summary',
      footerAggregates: true,
      notes: Callout({ tone: 'info', icon: 'info', title: 'Payroll basis' },
        'Gross payroll is the sum of basic, HRA, DA and conveyance for active employees. Statutory deductions shown are the employee contribution only.'),
    }));
  },
};

/* ================================================ reports/transport ======= */

routes['reports/transport'] = {
  title: 'Transport Reports',
  subtitle: 'Route utilisation, running cost and punctuality',
  section: 'reports',
  render(mount, ctx) {
    ensureStyles();
    const fuelByVehicle = new Map();
    for (const f of db.fuelLogs) fuelByVehicle.set(f.vehicleId, (fuelByVehicle.get(f.vehicleId) || 0) + f.amount);
    const maintByVehicle = new Map();
    for (const m of db.maintenanceLogs) maintByVehicle.set(m.vehicleId, (maintByVehicle.get(m.vehicleId) || 0) + m.cost);

    const rows = analytics.transportUtilisation.map((r) => {
      const route = db.routes.find((x) => x.code === r.route);
      const vehicle = route ? byId(db.vehicles, route.vehicleId) : null;
      const fuel = vehicle ? (fuelByVehicle.get(vehicle.id) || 0) : 0;
      const maint = vehicle ? (maintByVehicle.get(vehicle.id) || 0) : 0;
      return {
        ...r,
        regNo: vehicle ? vehicle.regNo : '—',
        distanceKm: route ? route.distanceKm : 0,
        fare: route ? route.fare : 0,
        revenue: route ? route.monthlyRevenue : 0,
        fuelCost: fuel,
        maintenanceCost: maint,
        runningCost: fuel + maint,
        costPerStudent: Math.round((fuel + maint) / Math.max(1, r.used)),
        surplus: (route ? route.monthlyRevenue : 0) - Math.round((fuel + maint) / 5),
      };
    });

    mount.appendChild(reportPage({
      title: 'Transport Reports',
      subtitle: `${num(analytics.kpis.routes)} routes · ${num(analytics.kpis.vehicles)} vehicles · ${num(analytics.kpis.transportStudents)} students on transport`,
      route: 'reports/transport',
      filters: [
        { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'month', label: 'This month' }, { id: 'qtr', label: 'Quarter' }, { id: 'ytd', label: 'Year to date' }] },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'route', label: 'Route', options: rows.map((r) => r.route) },
      ],
      onFilter: (id, v, all2, table) => table && table.refresh(applyFilters(rows, all2, { searchKeys: ['route', 'routeName', 'regNo'] })),
      summary: [
        { label: 'Average utilisation', value: formatPercent(avg(rows, 'utilisation')), icon: 'gauge', tone: 'brand', trend: analytics.sparks.transport },
        { label: 'On-time performance', value: formatPercent(avg(rows, 'onTime')), icon: 'timer', tone: 'success' },
        { label: 'Running cost', value: cmoney(sum(rows, 'runningCost')), icon: 'fuel', tone: 'danger', footer: 'Fuel plus maintenance, year to date' },
        { label: 'Transport revenue', value: cmoney(sum(rows, 'revenue')), icon: 'wallet', tone: 'info', footer: 'Monthly fare collection' },
      ],
      chart: [
        barChart({
          categories: rows.map((r) => r.route),
          series: [
            { name: 'Seats used', values: rows.map((r) => r.used) },
            { name: 'Capacity', values: rows.map((r) => r.capacity) },
          ],
          height: 280,
        }),
        scatterPlot({
          points: rows.map((r) => ({ x: r.utilisation, y: r.costPerStudent, label: r.routeName })),
          xLabel: 'Utilisation %', yLabel: 'Running cost per student', height: 280,
        }),
      ],
      chartTitle: 'Seats used against capacity by route',
      columns: [
        { key: 'route', label: 'Route', sticky: true, width: 110 },
        { key: 'routeName', label: 'Route name', width: 220 },
        { key: 'regNo', label: 'Vehicle', width: 140, render: (r) => h('span', { className: 't-mono t-xs' }, r.regNo) },
        { key: 'capacity', label: 'Capacity', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'used', label: 'Seats used', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'utilisation', label: 'Utilisation', width: 160, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v),
          render: (r) => h('div', { className: 'stack-1', style: { minWidth: '120px' } },
            h('span', { className: 't-num t-sm' }, formatPercent(r.utilisation)),
            ProgressBar(r.utilisation, { size: 'sm', tone: r.utilisation > 85 ? 'success' : r.utilisation > 60 ? 'warning' : 'danger' })) },
        { key: 'distanceKm', label: 'Distance', width: 110, align: 'right', numeric: true, render: (r) => `${r.distanceKm} km` },
        { key: 'onTime', label: 'On time', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v), render: (r) => formatPercent(r.onTime) },
        moneyCol('fuelCost', 'Fuel', { width: 140 }),
        moneyCol('maintenanceCost', 'Maintenance', { width: 150 }),
        moneyCol('revenue', 'Monthly revenue', { width: 170 }),
        moneyCol('costPerStudent', 'Cost / student', { width: 160, aggregate: 'avg' }),
      ],
      rows,
      tableTitle: 'Route economics',
      footerAggregates: true,
      notes: Callout({ tone: 'warning', icon: 'alert-triangle', title: 'Under-utilised routes' },
        `${rows.filter((r) => r.utilisation < 60).length} routes run below 60% occupancy. Consolidating two of them would save roughly ${money(240000)} a year in fuel and driver cost.`),
    }));
  },
};

/* =================================================== reports/hostel ======= */

routes['reports/hostel'] = {
  title: 'Hostel Reports',
  subtitle: 'Occupancy, room condition and mess coverage',
  section: 'reports',
  render(mount, ctx) {
    ensureStyles();
    const rows = analytics.hostelOccupancy.map((r) => {
      const hostel = db.hostels.find((x) => x.name === r.hostel);
      const rooms = hostel ? db.hostelRooms.filter((x) => x.hostelId === hostel.id) : [];
      return {
        ...r,
        type: hostel ? hostel.type : '—',
        rooms: rooms.length,
        acRooms: rooms.filter((x) => x.ac).length,
        underRepair: rooms.filter((x) => x.status === 'Under Maintenance' || x.condition === 'Poor').length,
        monthlyFee: rooms.length ? Math.round(avg(rooms, 'monthlyFee')) : 0,
        revenue: rooms.reduce((a, x) => a + x.monthlyFee * x.occupied, 0),
      };
    });

    mount.appendChild(reportPage({
      title: 'Hostel Reports',
      subtitle: `${db.hostels.length} blocks · ${num(db.hostelRooms.length)} rooms · ${analytics.kpis.hostelOccupancy}% occupancy`,
      route: 'reports/hostel',
      filters: [
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'hostel', label: 'Block', options: rows.map((r) => r.hostel) },
        { id: 'type', label: 'Type', options: distinct(db.hostels, 'type') },
      ],
      onFilter: (id, v, all2, table) => table && table.refresh(applyFilters(rows, all2, { searchKeys: ['hostel', 'type'] })),
      summary: [
        { label: 'Capacity', value: num(sum(rows, 'capacity')), icon: 'bed', tone: 'brand' },
        { label: 'Occupied', value: num(sum(rows, 'occupied')), icon: 'users', tone: 'success', trend: analytics.sparks.hostel },
        { label: 'Vacant beds', value: num(sum(rows, 'vacant')), icon: 'door', tone: 'warning' },
        { label: 'Monthly revenue', value: cmoney(sum(rows, 'revenue')), icon: 'wallet', tone: 'info' },
      ],
      chart: [
        barChart({
          categories: rows.map((r) => r.hostel),
          series: [
            { name: 'Occupied', values: rows.map((r) => r.occupied) },
            { name: 'Vacant', values: rows.map((r) => r.vacant) },
          ],
          stacked: true, height: 280,
        }),
        radialBarChart({
          data: rows.slice(0, 5).map((r) => ({ key: r.hostel, value: r.occupied, max: r.capacity })),
          height: 280,
        }),
      ],
      chartTitle: 'Occupied and vacant beds by block',
      columns: [
        { key: 'hostel', label: 'Block', sticky: true, width: 200 },
        { key: 'type', label: 'Type', width: 120, filter: true },
        { key: 'rooms', label: 'Rooms', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'acRooms', label: 'AC rooms', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'capacity', label: 'Capacity', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'occupied', label: 'Occupied', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'vacant', label: 'Vacant', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'occupancy', label: 'Occupancy', width: 160, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v),
          render: (r) => h('div', { className: 'stack-1', style: { minWidth: '120px' } },
            h('span', { className: 't-num t-sm' }, formatPercent(r.occupancy)),
            ProgressBar(r.occupancy, { size: 'sm', tone: r.occupancy > 90 ? 'danger' : r.occupancy > 70 ? 'success' : 'warning' })) },
        { key: 'underRepair', label: 'Under repair', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
        moneyCol('monthlyFee', 'Avg room fee', { width: 150, aggregate: 'avg' }),
        moneyCol('revenue', 'Monthly revenue', { width: 170 }),
      ],
      rows,
      tableTitle: 'Block-wise occupancy',
      footerAggregates: true,
      notes: Callout({ tone: 'info', icon: 'info', title: 'Occupancy planning' },
        `Blocks above 90% occupancy have no room for mid-session admissions. ${num(sum(rows, 'vacant'))} beds are free overall, but they are not evenly spread across boys and girls blocks.`),
    }));
  },
};

/* ================================================== reports/library ======= */

routes['reports/library'] = {
  title: 'Library Reports',
  subtitle: 'Circulation, stock and member activity',
  section: 'reports',
  render(mount, ctx) {
    ensureStyles();
    const rows = analytics.libraryCirculation.map((r) => ({
      ...r,
      returnRate: Math.round((r.returned / Math.max(1, r.issued)) * 1000) / 10,
      overdueRate: Math.round((r.overdue / Math.max(1, r.issued)) * 1000) / 10,
    }));
    const topBooks = sortBy(db.books.slice(0, 3000), 'timesIssued', 'desc').slice(0, 12);

    mount.appendChild(reportPage({
      title: 'Library Reports',
      subtitle: `${num(analytics.kpis.booksTotal)} titles · ${num(db.bookIssues.length)} issues this year`,
      route: 'reports/library',
      filters: [
        { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'month', label: 'This month' }, { id: 'term', label: 'This term' }, { id: 'ytd', label: 'Year to date' }] },
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'month', label: 'Month', options: rows.map((r) => r.month) },
      ],
      onFilter: (id, v, all2, table) => table && table.refresh(applyFilters(rows, all2, { searchKeys: ['month'] })),
      summary: [
        { label: 'Titles held', value: num(analytics.kpis.booksTotal), icon: 'library', tone: 'brand' },
        { label: 'Books issued', value: num(sum(rows, 'issued')), icon: 'arrow-up-right', tone: 'info', trend: analytics.sparks.library },
        { label: 'Overdue', value: num(sum(rows, 'overdue')), icon: 'timer', tone: 'danger', footer: `${money(sum(db.bookIssues, 'fine'))} fine accrued` },
        { label: 'Return rate', value: formatPercent(avg(rows, 'returnRate')), icon: 'check-circle', tone: 'success' },
      ],
      chart: [
        comboChart({
          categories: rows.map((r) => r.month),
          bars: [
            { name: 'Issued', values: rows.map((r) => r.issued) },
            { name: 'Returned', values: rows.map((r) => r.returned) },
          ],
          line: { name: 'Overdue', values: rows.map((r) => r.overdue) },
          height: 280,
        }),
        donutChart({
          data: analytics.libraryCategorySplit, height: 280,
          centerValue: num(sum(analytics.libraryCategorySplit, 'value')), centerLabel: 'Copies',
        }),
      ],
      chartTitle: 'Monthly circulation',
      columns: [
        { key: 'month', label: 'Month', sticky: true, width: 120 },
        { key: 'issued', label: 'Issued', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'returned', label: 'Returned', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'overdue', label: 'Overdue', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'returnRate', label: 'Return rate', width: 150, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v), render: (r) => formatPercent(r.returnRate) },
        { key: 'overdueRate', label: 'Overdue rate', width: 150, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatPercent(v), render: (r) => h('span', { className: r.overdueRate > 8 ? 't-danger t-num' : 't-num' }, formatPercent(r.overdueRate)) },
      ],
      rows,
      tableTitle: 'Circulation by month',
      footerAggregates: true,
      notes: SectionCard({ title: 'Most issued titles', subtitle: 'What students actually borrow', icon: 'trending-up', flush: true },
        DataTable({
          columns: [
            { key: 'title', label: 'Title', width: 300 },
            { key: 'author', label: 'Author', width: 200 },
            { key: 'category', label: 'Category', width: 170, filter: true },
            { key: 'totalCopies', label: 'Copies', width: 100, align: 'right', numeric: true },
            { key: 'issuedCopies', label: 'On loan', width: 110, align: 'right', numeric: true },
            { key: 'timesIssued', label: 'Times issued', width: 140, align: 'right', numeric: true },
          ],
          rows: topBooks,
          paginate: false, searchable: false, columnToggle: false, exportable: true,
          exportName: 'top-titles', maxHeight: 'none',
        })),
    }));
  },
};

/* ================================================ reports/inventory ======= */

routes['reports/inventory'] = {
  title: 'Inventory Reports',
  subtitle: 'Stock valuation, reorder alerts and consumption',
  section: 'reports',
  render(mount, ctx) {
    ensureStyles();
    const items = db.inventoryItems;
    const byCategory = new Map();
    for (const it of items) {
      const cur = byCategory.get(it.category) || { category: it.category, items: 0, stock: 0, value: 0, belowReorder: 0, consumable: 0 };
      cur.items += 1;
      cur.stock += it.stock;
      cur.value += it.value;
      if (it.stock <= it.reorderLevel) cur.belowReorder += 1;
      if (it.consumable) cur.consumable += 1;
      byCategory.set(it.category, cur);
    }
    const rows = Array.from(byCategory.values()).map((r) => ({ ...r, avgValue: Math.round(r.value / Math.max(1, r.items)) }));
    const lowStock = items.filter((it) => it.stock <= it.reorderLevel);

    mount.appendChild(reportPage({
      title: 'Inventory Reports',
      subtitle: `${num(items.length)} items · ${cmoney(sum(items, 'value'))} closing stock value`,
      route: 'reports/inventory',
      filters: [
        { id: 'campusId', label: 'Campus', options: campusOptions() },
        { id: 'category', label: 'Category', options: rows.map((r) => r.category) },
        { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'month', label: 'This month' }, { id: 'qtr', label: 'Quarter' }, { id: 'ytd', label: 'Year to date' }] },
      ],
      onFilter: (id, v, all2, table) => table && table.refresh(applyFilters(rows, all2, { searchKeys: ['category'] })),
      summary: [
        { label: 'Stock value', value: cmoney(sum(items, 'value')), icon: 'box', tone: 'brand' },
        { label: 'Line items', value: num(items.length), icon: 'package', tone: 'info', footer: `${rows.length} categories` },
        { label: 'Below reorder', value: num(lowStock.length), icon: 'alert-circle', tone: 'danger', footer: 'Raise a purchase request' },
        { label: 'Movements', value: num(db.stockMovements.length), icon: 'refresh-ccw', tone: 'success', footer: 'Receipts and issues this year' },
      ],
      chart: [
        treemap({
          data: sortBy(rows, 'value', 'desc').map((r) => ({ key: r.category, value: r.value })),
          height: 300, valueFormat: 'currencyCompact',
        }),
        barChart({
          categories: sortBy(rows, 'belowReorder', 'desc').map((r) => r.category),
          series: [{ name: 'Items below reorder', values: sortBy(rows, 'belowReorder', 'desc').map((r) => r.belowReorder) }],
          horizontal: true, showValues: true, height: 300,
        }),
      ],
      chartTitle: 'Stock value by category',
      columns: [
        { key: 'category', label: 'Category', sticky: true, width: 200 },
        { key: 'items', label: 'Items', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'stock', label: 'Units in stock', width: 140, align: 'right', numeric: true, aggregate: 'sum', render: (r) => num(r.stock), value: (r) => r.stock, format: (v) => num(v) },
        moneyCol('value', 'Stock value', { width: 170 }),
        moneyCol('avgValue', 'Average per item', { width: 170, aggregate: 'avg' }),
        { key: 'consumable', label: 'Consumables', width: 140, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'belowReorder', label: 'Below reorder', width: 150, align: 'right', numeric: true, aggregate: 'sum', render: (r) => (r.belowReorder ? h('span', { className: 't-danger t-semibold t-num' }, String(r.belowReorder)) : h('span', { className: 't-muted' }, '0')) },
      ],
      rows,
      tableTitle: 'Category-wise stock summary',
      footerAggregates: true,
      notes: SectionCard({ title: 'Reorder alert', subtitle: 'Items at or below the reorder level', icon: 'alert-circle', flush: true },
        DataTable({
          columns: [
            { key: 'code', label: 'Code', width: 120, render: (r) => h('span', { className: 't-mono t-xs' }, r.code) },
            { key: 'name', label: 'Item', width: 240 },
            { key: 'category', label: 'Category', width: 170, filter: true },
            { key: 'stock', label: 'In stock', width: 110, align: 'right', numeric: true },
            { key: 'reorderLevel', label: 'Reorder at', width: 120, align: 'right', numeric: true },
            moneyCol('unitPrice', 'Unit price', { width: 130, aggregate: null }),
            { key: 'store', label: 'Store', width: 160, filter: true },
            statusCol('status', 'Status', 130),
          ],
          rows: lowStock,
          pageSize: 10, searchKeys: ['name', 'code', 'category'], exportName: 'reorder-alert',
          emptyState: EmptyState({ icon: 'check-circle', title: 'Nothing to reorder', text: 'Every item is above its reorder level.' }),
        })),
    }));
  },
};

/* ====================================================== reports/mis ======= */

routes['reports/mis'] = {
  title: 'MIS / Management Reports',
  subtitle: 'The board-level pack: one page across every module',
  section: 'reports',
  render(mount, ctx) {
    ensureStyles();
    const k = analytics.kpis;

    mount.appendChild(dashboardPage({
      title: 'Management information pack',
      subtitle: `All campuses · ${AY_LABEL} · data as on ${formatDate(TODAY, 'long')}`,
      route: 'reports/mis',
      actions: pageActions(
        Button('Schedule monthly', { variant: 'secondary', icon: 'clock', onClick: () => scheduleReportModal('MIS management pack') }),
        Button('Export pack', { variant: 'primary', icon: 'download', onClick: () => notify({ title: 'MIS pack exported', text: 'All 12 exhibits bundled into one workbook.', tone: 'success' }) })),
      kpis: [
        { label: 'Students', value: num(k.activeStudents), delta: 4.4, deltaLabel: 'vs last year', icon: 'graduation-cap', tone: 'brand', trend: analytics.sparks.students, route: 'students/all' },
        { label: 'Staff', value: num(k.totalStaff), delta: 2.1, icon: 'briefcase', tone: 'info', footer: `${k.studentTeacherRatio}:1 ratio` },
        { label: 'Attendance', value: `${k.avgAttendance}%`, delta: 1.2, icon: 'clipboard-check', tone: 'success', trend: analytics.sparks.attendance },
        { label: 'Fee collected', value: cmoney(k.feeCollected), delta: 8.1, icon: 'wallet', tone: 'success', trend: analytics.sparks.collection, route: 'fees/reports' },
        { label: 'Outstanding', value: cmoney(k.feeOutstanding), delta: -3.2, icon: 'alert-circle', tone: 'danger', trend: analytics.sparks.outstanding, route: 'fees/outstanding' },
        { label: 'Open complaints', value: num(k.openComplaints), delta: -12, icon: 'alert-triangle', tone: 'warning', trend: analytics.sparks.complaints },
      ],
      widgets: [
        { span: 8, render: () => SectionCard({ title: 'Fee collection against target', subtitle: 'Monthly, current academic year', className: 'chart-card' },
          comboChart({
            categories: analytics.feeCollectionVsTarget.map((r) => r.month),
            bars: [{ name: 'Collected', values: analytics.feeCollectionVsTarget.map((r) => r.collected) }],
            line: { name: 'Target', values: analytics.feeCollectionVsTarget.map((r) => r.target) },
            valueFormat: 'currencyCompact', height: 280,
          })) },
        { span: 4, render: () => SectionCard({ title: 'Enrolment by campus', className: 'chart-card' },
          donutChart({ data: analytics.enrolmentByCampus, height: 280, centerValue: num(k.activeStudents), centerLabel: 'Students' })) },
        { span: 6, render: () => SectionCard({ title: 'Revenue against expenditure', className: 'chart-card' },
          comboChart({
            categories: analytics.revenueVsExpense.slice(0, 5).map((r) => r.month),
            bars: [
              { name: 'Revenue', values: analytics.revenueVsExpense.slice(0, 5).map((r) => r.revenue) },
              { name: 'Expense', values: analytics.revenueVsExpense.slice(0, 5).map((r) => r.expense) },
            ],
            line: { name: 'Surplus', values: analytics.revenueVsExpense.slice(0, 5).map((r) => r.surplus) },
            valueFormat: 'currencyCompact', height: 280,
          })) },
        { span: 6, render: () => SectionCard({ title: 'Admission funnel', subtitle: 'Enquiry to enrolment', className: 'chart-card' },
          funnelChart({ stages: analytics.admissionFunnel.map((f) => ({ label: f.stage, value: f.count })), showConversion: true, height: 280 })) },
        { span: 5, render: () => SectionCard({ title: 'Five-year growth', subtitle: 'Students and staff', className: 'chart-card' },
          lineChart({
            categories: analytics.enrolmentTrend.map((r) => r.year),
            series: [
              { name: 'Students', values: analytics.enrolmentTrend.map((r) => r.students) },
              { name: 'Staff', values: analytics.enrolmentTrend.map((r) => r.staff) },
            ],
            height: 260, showDots: true, baselineZero: false,
          })) },
        { span: 7, render: () => SectionCard({ title: 'Budget utilisation', subtitle: 'Spend against allocation', className: 'chart-card' },
          bulletChart({
            items: analytics.budgetUtilisation.slice(0, 8).map((b) => ({ label: b.head, value: b.spent, target: b.allocated })),
            valueFormat: 'currencyCompact', height: 260,
          })) },
        { span: 4, render: () => SectionCard({ title: 'Attendance trend', className: 'chart-card' },
          lineChart({
            categories: analytics.attendanceTrend.map((r) => r.month),
            series: [
              { name: 'Students', values: analytics.attendanceTrend.map((r) => r.students) },
              { name: 'Staff', values: analytics.attendanceTrend.map((r) => r.staff) },
            ],
            valueFormat: 'percent', target: 90, height: 250, baselineZero: false,
          })) },
        { span: 4, render: () => SectionCard({ title: 'Complaints and SLA', className: 'chart-card' },
          comboChart({
            categories: analytics.complaintTrend.map((r) => r.month),
            bars: [
              { name: 'Raised', values: analytics.complaintTrend.map((r) => r.raised) },
              { name: 'Resolved', values: analytics.complaintTrend.map((r) => r.resolved) },
            ],
            line: { name: 'SLA breached', values: analytics.complaintTrend.map((r) => r.breached) },
            height: 250,
          })) },
        { span: 4, render: () => SectionCard({ title: 'Operations at a glance', icon: 'activity' },
          h('div', { className: 'stack-2' },
            MetricRow('Transport students', num(k.transportStudents), `${k.routes} routes`),
            MetricRow('Hostel residents', num(k.hostelStudents), `${k.hostelOccupancy}% full`),
            MetricRow('Books on loan', num(k.booksIssued), `${num(k.booksTotal)} titles`),
            MetricRow('Pending leave requests', num(k.pendingLeaves), 'HR queue'),
            MetricRow('SLA breaches', num(k.slaBreaches), 'Complaints'),
            MetricRow('Upcoming events', num(k.upcomingEvents), 'Next 30 days'),
            MetricRow('Alumni on record', num(k.alumni), 'Since 1998'))) },
        { span: 6, render: () => SectionCard({ title: 'Top performers', subtitle: 'Highest aggregate in the last assessment', icon: 'trophy' },
          RankList(analytics.topPerformers.slice(0, 8).map((t) => ({ name: t.name, meta: `${t.className} · ${t.house} House`, value: `${t.percent}%` })))) },
        { span: 6, render: () => SectionCard({ title: 'Largest outstanding balances', subtitle: 'Escalate these first', icon: 'alert-circle', flush: true },
          DataTable({
            columns: [
              studentCol('name', (r) => `${r.admissionNo} · ${r.className}`),
              moneyCol('due', 'Outstanding'),
              { key: 'overdueDays', label: 'Overdue', width: 100, align: 'right', numeric: true, render: (r) => `${r.overdueDays} d` },
            ],
            rows: analytics.defaulters.slice(0, 8),
            paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
            onRowClick: (r) => navigate(`fees/collection/${r.id}`),
          })) },
      ],
    }));
  },
};


/** Tab handler for listPage: refreshes the embedded DataTable in place. */
function tabRefresh(mountEl, rows, pred) {
  return (id) => {
    const t = mountEl.querySelector('.dt');
    if (t && typeof t.refresh === 'function') t.refresh(id === 'all' ? rows : rows.filter((r) => pred(r, id)));
  };
}