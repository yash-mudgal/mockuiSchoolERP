/* ==========================================================================
   pages/students.js — Students · Parents · Alumni
   Owns every route in the `students`, `parents` and `alumni` nav sections.

   Flagship screens
     • students/profile   — the Student 360 (15 tabs + summary rail)
     • students/promote   — multi-step bulk promotion wizard
     • students/id-cards  — ID card designer with live preview
     • students/bulk-import — column mapping + validation preview
     • parents/link-children — two-pane family linking
   ========================================================================== */

import {
  h, frag, Icon, Card, SectionCard, StatCard, Badge, Button, IconButton, Identity,
  DataTable, Modal, Drawer, ConfirmDialog, notify, EmptyState, Timeline, ActivityFeed,
  DescriptionList, ProgressBar, RadialProgress, Avatar, AvatarStack, Tabs, FilterBar,
  MenuButton, Callout, FileList, RankList, Rating, MetricRow, Pill, Tag, Divider,
  Stepper, SegmentedControl, Accordion, SearchInput, Skeleton, SkeletonText,
  Field, Input, Textarea, Select, Combobox, MultiSelect, Checkbox, RadioGroup, Switch,
  DatePicker, FileUpload, FormGrid, FormSection, FormActions,
  validators, mockAction, printNode, download, toCsv, copyToClipboard, initials,
  formatCurrency, formatNumber, formatDate, formatDateTime, formatPercent,
  relativeTime, toneForStatus,
} from '../core/ui.js';

import {
  page, listPage, detailPage, dashboardPage, formPage, reportPage, calendarPage,
  profileHeader, kpiRow, missingRecord,
} from '../core/page-kit.js';

import {
  lineChart, areaChart, barChart, comboChart, donutChart, pieChart, funnelChart,
  heatmap, gaugeChart, scatterPlot, bulletChart, waterfallChart, treemap,
  radialBarChart, progressRing, sparkline, ScaleLegend, PALETTE, seriesColor,
} from '../core/charts.js';

import {
  db, analytics, byId, where, search, sortBy, groupBy, sum, avg, countBy, sumBy,
  student360, gradeFor,
} from '../data/db.js';

import { icon } from '../core/icons.js';
import { navigate, navHref } from '../core/router.js';
import * as store from '../core/state.js';
import { breadcrumbFor } from '../core/nav.js';

/* ========================================================== module styles = */

const STYLE_ID = 'erp-students-module-style';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
  .stu-rail-line { display:flex; align-items:flex-start; gap:var(--sp-3); padding:var(--sp-2) 0; }
  .stu-rail-line + .stu-rail-line { border-top:1px solid var(--border-subtle); }
  .stu-rail-ic { color:var(--text-muted); flex:0 0 auto; margin-top:2px; }
  .stu-mini { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:var(--sp-3); }
  .stu-fact { border:1px solid var(--border-subtle); border-radius:var(--r-md); padding:var(--sp-3);
              background:var(--surface-sunken); }
  .stu-fact-l { font-size:var(--fs-2xs); text-transform:uppercase; letter-spacing:.08em;
                color:var(--text-muted); font-weight:var(--fw-semibold); }
  .stu-fact-v { font-size:var(--fs-lg); font-weight:var(--fw-semibold); color:var(--text); margin-top:2px; }

  /* ---- ID card designer ---- */
  .idc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:var(--sp-4); }
  .idc { width:100%; max-width:250px; border-radius:var(--r-lg); overflow:hidden; background:var(--surface);
         border:1px solid var(--border); box-shadow:var(--shadow-sm); }
  .idc-top { padding:var(--sp-3); color:var(--chart-label-on-fill); display:flex; align-items:center; gap:var(--sp-2); }
  .idc-top .idc-school { font-weight:var(--fw-bold); font-size:var(--fs-sm); line-height:var(--lh-tight); }
  .idc-top .idc-sub { font-size:var(--fs-2xs); opacity:.85; letter-spacing:.06em; text-transform:uppercase; }
  .idc-body { padding:var(--sp-3); display:flex; flex-direction:column; align-items:center; gap:var(--sp-2); text-align:center; }
  .idc-name { font-weight:var(--fw-semibold); font-size:var(--fs-md); }
  .idc-meta { font-size:var(--fs-xs); color:var(--text-secondary); }
  .idc-rows { width:100%; display:grid; grid-template-columns:auto 1fr; gap:2px var(--sp-2);
              font-size:var(--fs-2xs); text-align:left; margin-top:var(--sp-1); }
  .idc-rows dt { color:var(--text-muted); }
  .idc-rows dd { color:var(--text); font-weight:var(--fw-medium); }
  .idc-foot { padding:var(--sp-2) var(--sp-3); border-top:1px dashed var(--border);
              display:flex; align-items:center; justify-content:space-between; gap:var(--sp-2); }
  .idc-bar { height:26px; flex:1; background:repeating-linear-gradient(90deg,
              var(--text) 0 2px, transparent 2px 4px, var(--text) 4px 5px, transparent 5px 8px); opacity:.75; }
  .idc-qr { width:34px; height:34px; border-radius:var(--r-xs);
            background:conic-gradient(var(--text) 25%, var(--surface) 0 50%, var(--text) 0 75%, var(--surface) 0);
            background-size:8px 8px; opacity:.8; }

  /* ---- certificate / TC preview ---- */
  .cert { border:2px solid var(--border-strong); border-radius:var(--r-md); padding:var(--sp-6);
          background:var(--surface); position:relative; }
  .cert::after { content:''; position:absolute; inset:8px; border:1px solid var(--border-subtle);
                 border-radius:var(--r-sm); pointer-events:none; }
  .cert-head { text-align:center; }
  .cert-title { font-size:var(--fs-xl); font-weight:var(--fw-bold); letter-spacing:.04em; }
  .cert-body { margin-top:var(--sp-4); line-height:1.9; color:var(--text-secondary); }
  .cert-body b { color:var(--text); }
  .cert-sign { display:flex; justify-content:space-between; margin-top:var(--sp-8); gap:var(--sp-4); }
  .cert-sign div { border-top:1px solid var(--border-strong); padding-top:var(--sp-1);
                   font-size:var(--fs-xs); color:var(--text-muted); min-width:140px; text-align:center; }
  .cert-seal { width:70px; height:70px; border-radius:var(--r-full); border:2px dashed var(--border-strong);
               display:flex; align-items:center; justify-content:center; color:var(--text-muted);
               font-size:var(--fs-2xs); text-align:center; margin:0 auto; }

  /* ---- mapping / import ---- */
  .map-row { display:grid; grid-template-columns:1fr 26px 1fr auto; gap:var(--sp-3);
             align-items:center; padding:var(--sp-2) 0; }
  .map-row + .map-row { border-top:1px solid var(--border-subtle); }
  .map-src { font-family:var(--font-mono); font-size:var(--fs-xs); background:var(--surface-sunken);
             border:1px solid var(--border-subtle); border-radius:var(--r-sm); padding:var(--sp-1) var(--sp-2); }

  /* ---- story / alumni cards ---- */
  .story-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:var(--sp-4); }
  .story-quote { font-size:var(--fs-md); line-height:var(--lh-normal); color:var(--text-secondary); }
  .story-quote::before { content:'\\201C'; font-size:var(--fs-hero); line-height:0; color:var(--border-strong);
                         vertical-align:-0.35em; margin-right:4px; }
  .link-split { display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-4); align-items:start; }
  @media (max-width: 900px) { .link-split { grid-template-columns:1fr; } }
  .pick-list { max-height:420px; overflow-y:auto; display:flex; flex-direction:column; gap:2px; }
  .pick-item { display:flex; align-items:center; gap:var(--sp-3); width:100%; text-align:left;
               padding:var(--sp-2); border:1px solid transparent; border-radius:var(--r-md);
               background:transparent; cursor:pointer; color:inherit; font:inherit; }
  .pick-item:hover { background:var(--surface-hover); }
  .pick-item[aria-pressed="true"] { background:var(--surface-selected); border-color:var(--border-brand); }
  `;
  const tag = h('style', { id: STYLE_ID });
  tag.textContent = css;
  document.head.appendChild(tag);
}

/* ================================================================ helpers = */

const CAMPUS_ALL = new Set(['all', '', null, undefined]);

/** Students visible for the active campus scope. */
function scopedStudents(ctx) {
  const cid = ctx && ctx.state ? ctx.state.campusId : store.get('campusId');
  return CAMPUS_ALL.has(cid) ? db.students : db.students.filter((s) => s.campusId === cid);
}
function scopedParents(ctx) {
  const cid = ctx && ctx.state ? ctx.state.campusId : store.get('campusId');
  return CAMPUS_ALL.has(cid) ? db.parents : db.parents.filter((p) => p.campusId === cid);
}
function campusName(id) { return (byId(db.campuses, id) || {}).name || 'All campuses'; }

function scopeLabel(ctx) {
  const cid = ctx && ctx.state ? ctx.state.campusId : store.get('campusId');
  return `${campusName(cid)} · academic year 2026-27`;
}

/** Stable non-negative hash, used for deterministic derived values. */
function hash(str) {
  let x = 2166136261;
  for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); }
  return (x >>> 0);
}

const uniq = (arr) => Array.from(new Set(arr.filter((v) => v !== null && v !== undefined && v !== '')));
const money = (v) => formatCurrency(Number(v) || 0);
const moneyK = (v) => formatCurrency(Number(v) || 0, { compact: true });
const pctText = (v) => `${Number(v || 0).toFixed(1)}%`;

const CLASS_ORDER = (name) => {
  const i = db.classes.findIndex((c) => c.name === name);
  return i < 0 ? 999 : (byId(db.classes, db.classes[i].id) || {}).level || 999;
};

function classOptions(rows) {
  return uniq(rows.map((s) => s.className)).sort((a, b) => CLASS_ORDER(a) - CLASS_ORDER(b));
}

/** Navigate to a student profile. */
const goStudent = (id) => navigate(`students/profile/${id}`);
const goParent = (id) => navigate(`parents/profile/${id}`);
const goAlumnus = (id) => navigate(`alumni/profile/${id}`);

/** The standard "student name" table cell — always links to the 360 profile. */
function studentCell(s) {
  return Identity(s.name, `${s.admissionNo} · ${s.className}-${s.section}`, { onClick: () => goStudent(s.id) });
}

function phoneLink(number, label) {
  return h('a', {
    className: 'row t-sm', href: `tel:${String(number || '').replace(/\s/g, '')}`,
    style: { gap: 'var(--sp-2)' }, attrs: { 'aria-label': `Call ${label || number}` },
  }, Icon('phone', 14), h('span', null, number || '—'));
}
function mailLink(address, label) {
  return h('a', {
    className: 'row t-sm t-truncate', href: `mailto:${address || ''}`,
    style: { gap: 'var(--sp-2)' }, attrs: { 'aria-label': `Email ${label || address}` },
  }, Icon('mail', 14), h('span', { className: 't-truncate' }, address || '—'));
}

/** Small labelled fact tile used inside the profile overview. */
function fact(label, value, tone) {
  return h('div', { className: 'stu-fact' },
    h('div', { className: 'stu-fact-l' }, label),
    h('div', { className: ['stu-fact-v', tone && `t-${tone}`].filter(Boolean).join(' ') }, value));
}

/** A rail line: icon + label + value(s). */
function railLine(ico, label, ...value) {
  return h('div', { className: 'stu-rail-line' },
    h('span', { className: 'stu-rail-ic' }, Icon(ico, 15)),
    h('div', { className: 'flex-1 min-0' },
      h('div', { className: 't-2xs t-muted t-upper t-semibold', style: { fontSize: 'var(--fs-2xs)' } }, label),
      h('div', { className: 't-sm' }, value)));
}

/** Empty-tab helper so no tab is ever blank. */
function emptyTab(ico, title, text, action) {
  return Card({ pad: true }, EmptyState({ icon: ico, title, text, action }));
}

/** Filter students against the standard filter bar value bag. */
function filterStudents(rows, f = {}) {
  const q = String(f.q || '').trim().toLowerCase();
  return rows.filter((s) => {
    if (q && !(`${s.name} ${s.admissionNo} ${s.className} ${s.rollNo} ${s.fatherName}`.toLowerCase().includes(q))) return false;
    if (f.className && f.className !== 'all' && s.className !== f.className) return false;
    if (f.section && f.section !== 'all' && s.section !== f.section) return false;
    if (f.house && f.house !== 'all' && s.house !== f.house) return false;
    if (f.gender && f.gender !== 'all' && s.gender !== f.gender) return false;
    if (f.category && f.category !== 'all' && s.category !== f.category) return false;
    if (f.status && f.status !== 'all' && s.status !== f.status) return false;
    if (f.feeStatus && f.feeStatus !== 'all' && s.feeStatus !== f.feeStatus) return false;
    if (f.stream && f.stream !== 'all' && s.stream !== f.stream) return false;
    if (f.transport === 'Yes' && !s.transportOpted) return false;
    if (f.transport === 'No' && s.transportOpted) return false;
    if (f.hostel === 'Yes' && !s.hostelOpted) return false;
    if (f.hostel === 'No' && s.hostelOpted) return false;
    if (f.campus && f.campus !== 'all' && s.campusId !== f.campus) return false;
    switch (f.tab) {
      case 'active': return s.status === 'Active';
      case 'new': return String(s.admissionDate || '').startsWith('2026');
      case 'defaulters': return s.feeDue > 0;
      case 'transport': return !!s.transportOpted;
      case 'hostel': return !!s.hostelOpted;
      case 'inactive': return s.status !== 'Active';
      default: return true;
    }
  });
}

const STUDENT_FILTERS = (rows) => ([
  { id: 'q', type: 'search', label: 'Search', placeholder: 'Name, admission no, roll no…', width: '250px' },
  { id: 'className', label: 'Class', options: classOptions(rows) },
  { id: 'section', label: 'Section', options: uniq(rows.map((s) => s.section)).sort() },
  { id: 'house', label: 'House', options: db.houses.map((x) => x.name) },
  { id: 'gender', label: 'Gender', options: ['Male', 'Female'] },
  { id: 'category', label: 'Category', options: uniq(rows.map((s) => s.category)).sort() },
  { id: 'transport', label: 'Transport', options: ['Yes', 'No'] },
  { id: 'hostel', label: 'Hostel', options: ['Yes', 'No'] },
  { id: 'status', label: 'Status', options: uniq(rows.map((s) => s.status)).sort() },
  { id: 'feeStatus', label: 'Fees', options: uniq(rows.map((s) => s.feeStatus)).sort() },
]);

/** The canonical student table columns. */
function studentColumns({ compact = false } = {}) {
  const cols = [
    { key: 'name', label: 'Student', sticky: true, width: 250, render: (r) => studentCell(r), value: (r) => r.name },
    { key: 'admissionNo', label: 'Admission no', width: 130, hidden: compact },
    { key: 'className', label: 'Class', width: 100, filter: true },
    { key: 'section', label: 'Sec', width: 70, align: 'center' },
    { key: 'rollNo', label: 'Roll', width: 70, align: 'right', numeric: true },
    { key: 'house', label: 'House', width: 110, filter: true, render: (r) => Badge(r.house, { tone: 'neutral', dot: true }) },
    { key: 'gender', label: 'Gender', width: 90, filter: true, hidden: true },
    { key: 'category', label: 'Category', width: 100, filter: true, hidden: true },
    {
      key: 'attendancePct', label: 'Attendance', width: 130, align: 'right', numeric: true, aggregate: 'avg',
      format: (v) => pctText(v),
      render: (r) => h('div', { className: 'row', style: { justifyContent: 'flex-end', gap: 'var(--sp-2)' } },
        h('span', { className: 't-num' }, pctText(r.attendancePct)),
        h('span', { style: { width: '54px' } }, ProgressBar(r.attendancePct, { tone: r.attendancePct >= 85 ? 'success' : r.attendancePct >= 75 ? 'warning' : 'danger', size: 'sm' }))),
    },
    { key: 'cgpa', label: 'CGPA', width: 80, align: 'right', numeric: true, aggregate: 'avg', format: (v) => Number(v).toFixed(2) },
    {
      key: 'feeDue', label: 'Fee due', width: 120, align: 'right', numeric: true, aggregate: 'sum',
      format: (v) => moneyK(v), render: (r) => h('span', { className: r.feeDue > 0 ? 't-danger t-num' : 't-num t-muted' }, money(r.feeDue)),
    },
    { key: 'feeStatus', label: 'Fee status', width: 110, filter: true, render: (r) => Badge(r.feeStatus) },
    { key: 'status', label: 'Status', width: 100, filter: true, render: (r) => Badge(r.status) },
  ];
  return compact ? cols.filter((c) => !['gender', 'category', 'admissionNo'].includes(c.key)) : cols;
}

/** Row-level actions shared by every student list. */
function studentRowActions(row) {
  return [
    { label: 'Open 360 profile', icon: 'id-card', route: `students/profile/${row.id}` },
    { label: 'Message parent', icon: 'send', onClick: () => messageParent(row) },
    { label: 'Collect fee', icon: 'wallet', route: 'fees/collection' },
    { separator: true },
    { label: 'Print ID card', icon: 'id-card', onClick: () => printIdCard(row) },
    { label: 'Issue certificate', icon: 'certificate', route: 'students/certificates' },
    { separator: true },
    { label: 'Issue transfer certificate', icon: 'log-out', tone: 'danger', onClick: () => confirmTc(row) },
  ];
}

const studentBulkActions = [
  { label: 'Send SMS to parents', icon: 'message-square', onClick: (sel) => notify({ title: `SMS queued for ${sel.length} families`, text: 'Demo only — nothing was sent.', tone: 'success' }) },
  { label: 'Print ID cards', icon: 'id-card', onClick: (sel) => notify({ title: `${sel.length} ID cards sent to the print queue`, tone: 'info' }) },
  { label: 'Assign house', icon: 'flag', onClick: (sel) => notify({ title: `House assignment opened for ${sel.length} students`, tone: 'info' }) },
  { label: 'Export selection', icon: 'download', onClick: (sel) => { download('students-selection.csv', toCsv(sel, [{ key: 'admissionNo', label: 'Admission no' }, { key: 'name', label: 'Name' }, { key: 'className', label: 'Class' }, { key: 'section', label: 'Section' }, { key: 'feeDue', label: 'Fee due' }]), 'text/csv;charset=utf-8'); notify({ title: 'Selection exported', tone: 'success' }); } },
];

/* --------------------------------------------------------- shared actions */

function messageParent(s) {
  const guardians = db.parents.filter((p) => p.studentIds.includes(s.id));
  let channel = 'SMS';
  let text = `Dear Parent, this is an update regarding ${s.name} (${s.className}-${s.section}).`;
  Modal({
    title: `Message ${s.guardianName || s.fatherName}`,
    subtitle: `Guardian of ${s.name} · ${s.className}-${s.section}`,
    icon: 'send', size: 'md',
    body: h('div', { className: 'stack-3' },
      Field({ label: 'Channel' }, SegmentedControl(['SMS', 'WhatsApp', 'Email'], (v) => { channel = v; }, { active: 'SMS' })),
      Field({ label: 'To', hint: guardians.length ? `${guardians.length} guardian record(s) on file` : 'Primary guardian on record' },
        Input({ value: `${s.guardianName || s.fatherName} · ${s.emergencyContact || s.phone}`, readOnly: true })),
      Field({ label: 'Message', required: true },
        Textarea({ value: text, rows: 4, onInput: (v) => { text = v; } }))),
    actions: (close) => frag(
      Button('Cancel', { variant: 'secondary', onClick: close }),
      Button('Send', {
        variant: 'primary', icon: 'send',
        onClick: () => { close(); notify({ title: `${channel} sent`, text: `Delivered to the guardian of ${s.name}.`, tone: 'success' }); },
      })),
  });
}

function confirmTc(s) {
  ConfirmDialog({
    title: `Issue a transfer certificate for ${s.name}?`,
    text: 'The student will be marked inactive, the seat released and pending dues flagged for settlement. This cannot be undone in the prototype.',
    confirmLabel: 'Continue to TC form', tone: 'danger', icon: 'log-out',
  }).then((ok) => { if (ok) navigate(`students/transfer/${s.id}`); });
}

/* ---------------------------------------------------------- ID card model */

const ID_THEMES = [
  { id: 'brand', label: 'Springdale Indigo', color: 'var(--brand-600)' },
  { id: 'info', label: 'Campus Blue', color: 'var(--info-600)' },
  { id: 'success', label: 'Emerald', color: 'var(--success-600)' },
  { id: 'purple', label: 'Amethyst', color: 'var(--purple-600)' },
  { id: 'teal', label: 'Teal', color: 'var(--teal-600)' },
];

function idCardNode(s, opts = {}) {
  const o = { theme: 'brand', photo: true, blood: true, address: true, barcode: true, guardian: true, validity: '31 Mar 2027', ...opts };
  const color = (ID_THEMES.find((t) => t.id === o.theme) || ID_THEMES[0]).color;
  const rows = [];
  rows.push(['Admission', s.admissionNo]);
  rows.push(['Class', `${s.className} · ${s.section} · Roll ${s.rollNo}`]);
  rows.push(['House', s.house]);
  if (o.blood) rows.push(['Blood group', s.bloodGroup]);
  if (o.guardian) rows.push(['Guardian', s.guardianName || s.fatherName]);
  rows.push(['Contact', s.emergencyContact || s.phone]);
  if (o.address) rows.push(['Address', `${s.address.city}, ${s.address.state}`]);
  rows.push(['Valid till', o.validity]);

  return h('div', { className: 'idc' },
    h('div', { className: 'idc-top', style: { background: color } },
      h('span', { html: icon('graduation-cap', 20) }),
      h('div', null,
        h('div', { className: 'idc-school' }, 'Springdale International'),
        h('div', { className: 'idc-sub' }, campusName(s.campusId)))),
    h('div', { className: 'idc-body' },
      o.photo ? Avatar(s.name, { size: 'xl', ring: true }) : null,
      h('div', { className: 'idc-name' }, s.name),
      h('div', { className: 'idc-meta' }, `${s.className} — ${s.section}`),
      h('dl', { className: 'idc-rows' },
        rows.map(([k, v]) => frag(h('dt', null, k), h('dd', null, String(v)))))),
    o.barcode ? h('div', { className: 'idc-foot' },
      h('div', { className: 'idc-bar' }),
      h('div', { className: 'idc-qr' })) : null);
}

function printIdCard(s) {
  const node = h('div', { className: 'idc-grid' }, idCardNode(s));
  printNode(node, `ID card — ${s.name}`);
  notify({ title: 'ID card sent to the print dialog', text: s.name, tone: 'info' });
}

/* ------------------------------------------------------ derived datasets  */

/** Per-student daily attendance derived from the section register (deterministic). */
function studentAttendanceDays(s) {
  const register = db.attendance.filter((a) => a.sectionId === s.sectionId);
  return register.map((a) => {
    const roll = hash(s.id + a.date) % 1000 / 10; // 0..99.9
    let status = 'Present';
    if (roll >= s.attendancePct) status = roll >= s.attendancePct + 3 ? 'Absent' : 'Leave';
    else if (roll < 4) status = 'Late';
    return { date: a.date, status, sectionPercent: a.percent, strength: a.strength, id: `${s.id}-${a.date}` };
  }).sort((x, y) => (x.date < y.date ? -1 : 1));
}

/** Documents for a bounded set of students (student360 is memoised but not free). */
function documentRows(students, limit = 160) {
  const out = [];
  for (const s of students.slice(0, limit)) {
    const rec = student360(s.id);
    if (!rec) continue;
    for (const d of rec.documents) {
      out.push({
        id: d.id, studentId: s.id, student: s.name, admissionNo: s.admissionNo,
        className: s.className, section: s.section, name: d.name, type: d.type,
        sizeKb: d.sizeKb, uploadedOn: d.uploadedOn, status: d.status,
        verifiedBy: d.verifiedBy || '—',
      });
    }
  }
  return out;
}

/* ============================================================ STUDENT 360 = */

function overviewTab(rec, ctx) {
  const s = rec.student;
  const days = studentAttendanceDays(s);
  const byMonth = new Map();
  for (const d of days) {
    const m = d.date.slice(0, 7);
    if (!byMonth.has(m)) byMonth.set(m, { present: 0, absent: 0 });
    const b = byMonth.get(m);
    if (d.status === 'Absent') b.absent += 1; else b.present += 1;
  }
  const months = Array.from(byMonth.keys()).sort();
  const marks = db.marks.filter((m) => m.studentId === s.id);
  const termAvg = [];
  for (const g of db.examGroups) {
    const set = marks.filter((m) => m.examGroupId === g.id);
    if (set.length) termAvg.push({ name: g.name, value: avg(set, 'percent') });
  }
  const paidPct = s.feeTotal ? Math.round((s.feePaid / s.feeTotal) * 100) : 0;

  return h('div', { className: 'stack' },
    kpiRow([
      { label: 'Attendance', value: pctText(s.attendancePct), delta: Number((s.attendancePct - 88.9).toFixed(1)), deltaLabel: 'vs class average', icon: 'clipboard-check', tone: s.attendancePct >= 85 ? 'success' : 'warning' },
      { label: 'CGPA', value: Number(s.cgpa).toFixed(2), deltaLabel: `Rank ${s.rank} in class`, icon: 'chart-line', tone: 'brand' },
      { label: 'Last exam', value: pctText(s.lastExamPercent), deltaLabel: `Grade ${gradeFor(s.lastExamPercent)}`, icon: 'file-text', tone: 'info' },
      { label: 'Fee due', value: money(s.feeDue), deltaLabel: `${paidPct}% of ${moneyK(s.feeTotal)} paid`, icon: 'wallet', tone: s.feeDue > 0 ? 'danger' : 'success' },
    ]),
    h('div', { className: 'widget-grid' },
      h('div', { className: 'span-8' },
        SectionCard({ title: 'Attendance by month', subtitle: 'Days present vs absent in the current session', className: 'chart-card', icon: 'clipboard-check' },
          months.length ? barChart({
            categories: months.map((m) => formatDate(`${m}-01`, 'monthYear')),
            series: [
              { name: 'Present', values: months.map((m) => byMonth.get(m).present) },
              { name: 'Absent', values: months.map((m) => byMonth.get(m).absent) },
            ],
            stacked: true, height: 240, title: 'Attendance by month',
          }) : EmptyState({ icon: 'clipboard-check', title: 'No attendance marked yet', text: 'The register opens once the section has its first marked day.' }))),
      h('div', { className: 'span-4' },
        SectionCard({ title: 'Fee position', subtitle: `${s.feeStatus} · ${moneyK(s.feeTotal)} billed`, className: 'chart-card', icon: 'wallet' },
          donutChart({
            data: [{ key: 'Paid', value: s.feePaid }, { key: 'Outstanding', value: s.feeDue }],
            height: 230, centerValue: `${paidPct}%`, centerLabel: 'collected', valueFormat: 'currency',
            title: 'Fee position',
          }))),
      h('div', { className: 'span-6' },
        SectionCard({ title: 'Subject performance', subtitle: 'Latest recorded marks out of 100', className: 'chart-card', icon: 'book-open' },
          rec.subjectScores.length ? barChart({
            categories: rec.subjectScores.map((x) => x.subjectName),
            series: [{ name: 'Marks', values: rec.subjectScores.map((x) => x.marks) }],
            horizontal: true, showValues: true, height: 260, maxY: 100, title: 'Subject performance',
          }) : EmptyState({ icon: 'book-open', title: 'No marks recorded' }))),
      h('div', { className: 'span-6' },
        SectionCard({ title: 'Term progression', subtitle: 'Average percentage per exam group', className: 'chart-card', icon: 'chart-line' },
          termAvg.length ? lineChart({
            categories: termAvg.map((t) => t.name),
            series: [{ name: 'Average', values: termAvg.map((t) => Number(t.value.toFixed(1))) }],
            valueFormat: 'percent', height: 260, showDots: true, target: 75, targetLabel: 'Class target',
            title: 'Term progression',
          }) : EmptyState({ icon: 'chart-line', title: 'Results not published yet' }))),
      h('div', { className: 'span-6' },
        SectionCard({ title: 'At a glance', icon: 'user' },
          h('div', { className: 'stu-mini' },
            fact('House', s.house),
            fact('Behaviour score', `${s.behaviourScore}/100`, s.behaviourScore >= 75 ? 'success' : 'warning'),
            fact('Awards', formatNumber(s.awardsCount)),
            fact('Books issued', formatNumber(s.booksIssued)),
            fact('Transport', s.transportOpted ? 'Opted' : 'Not opted'),
            fact('Hostel', s.hostelOpted ? `Room ${s.roomNo}` : 'Day scholar')))),
      h('div', { className: 'span-6' },
        SectionCard({ title: 'Recent activity', icon: 'history', actions: Button('Full timeline', { variant: 'link', size: 'sm', onClick: () => notify({ title: 'Open the Timeline tab for the full history', tone: 'info' }) }) },
          Timeline(rec.timeline.slice(-4).reverse().map((e) => ({ title: e.title, meta: formatDate(e.date), text: e.text, icon: e.icon, tone: e.tone === 'default' ? 'neutral' : e.tone })))))));
}

function personalTab(rec) {
  const s = rec.student;
  return h('div', { className: 'stack' },
    SectionCard({ title: 'Identity', icon: 'user' },
      DescriptionList([
        ['Full name', s.name], ['Admission number', s.admissionNo],
        ['Date of birth', `${formatDate(s.dob)} (${s.age} years)`], ['Gender', s.gender],
        ['Blood group', s.bloodGroup], ['Nationality', s.nationality],
        ['Religion', s.religion], ['Category', s.category],
        ['Mother tongue', s.motherTongue], ['RTE quota', s.rte ? 'Yes' : 'No'],
      ], { cols: 2 })),
    SectionCard({ title: 'Enrolment', icon: 'graduation-cap' },
      DescriptionList([
        ['Campus', campusName(s.campusId)], ['Class & section', `${s.className} — ${s.section}`],
        ['Roll number', String(s.rollNo)], ['Stream', s.stream || 'Not applicable'],
        ['House', s.house], ['Admission date', formatDate(s.admissionDate)],
        ['Admission type', s.admissionType], ['Status', Badge(s.status)],
        ['Scholarship', s.scholarship ? 'Yes' : 'No'], ['Library card', s.libraryCardNo],
      ], { cols: 2 })),
    SectionCard({ title: 'Contact & address', icon: 'map-pin' },
      DescriptionList([
        ['Student email', s.email], ['Student phone', s.phone],
        ['Emergency contact', s.emergencyContact],
        ['Address', `${s.address.line1}, ${s.address.line2}`],
        ['City', s.address.city], ['State', s.address.state],
        ['PIN code', s.address.pincode], ['Country', s.address.country],
      ], { cols: 2 })));
}

function familyTab(rec) {
  const s = rec.student;
  const guardians = rec.guardians.length ? rec.guardians : [];
  return h('div', { className: 'stack' },
    guardians.length
      ? h('div', { className: 'widget-grid' }, guardians.map((g) => h('div', { className: 'span-6' },
        SectionCard({
          title: g.name, subtitle: `${g.relation} · ${g.occupation}`, icon: 'user',
          actions: h('div', { className: 'row' },
            IconButton('phone', { label: `Call ${g.name}`, bordered: true, onClick: () => notify({ title: `Dialling ${g.phone}`, text: g.name, tone: 'info' }) }),
            IconButton('mail', { label: `Email ${g.name}`, bordered: true, onClick: () => notify({ title: 'Compose opened', text: g.email, tone: 'info' }) }),
            IconButton('external-link', { label: 'Open parent profile', bordered: true, onClick: () => goParent(g.id) })),
        },
          DescriptionList([
            ['Phone', g.phone], ['Alternate', g.altPhone || '—'], ['Email', g.email],
            ['Organisation', g.organisation], ['Qualification', g.qualification],
            ['Annual income', money(g.annualIncome)],
            ['Aadhaar', g.aadhaarMasked], ['PAN', g.panMasked],
            ['Portal access', Badge(g.portalActive ? 'Active' : 'Suspended')],
            ['Last login', g.portalActive ? relativeTime(g.lastLogin) : '—'],
          ], { cols: 2 })))))
      : Card({ pad: true }, EmptyState({
        icon: 'users', title: 'No guardian record linked',
        text: 'Father and mother details exist on the admission form but no portal account has been created yet.',
        action: Button('Link a guardian', { variant: 'primary', icon: 'link', route: 'parents/link-children' }),
      })),
    SectionCard({ title: 'Declared on the admission form', icon: 'clipboard-list' },
      DescriptionList([
        ['Father', s.fatherName], ['Mother', s.motherName],
        ['Primary guardian', `${s.guardianName} (${s.guardianRelation})`],
        ['Emergency contact', s.emergencyContact],
      ], { cols: 2 })),
    SectionCard({ title: 'Siblings studying here', icon: 'users', subtitle: `${rec.siblings.length} linked record(s)` },
      rec.siblings.length
        ? DataTable({
          columns: [
            { key: 'name', label: 'Student', render: (r) => studentCell(r), value: (r) => r.name },
            { key: 'className', label: 'Class', width: 110 },
            { key: 'section', label: 'Section', width: 90, align: 'center' },
            { key: 'attendancePct', label: 'Attendance', width: 120, align: 'right', numeric: true, render: (r) => pctText(r.attendancePct) },
            { key: 'feeDue', label: 'Fee due', width: 130, align: 'right', numeric: true, render: (r) => money(r.feeDue) },
          ],
          rows: rec.siblings, paginate: false, searchable: false, exportable: false, columnToggle: false,
          onRowClick: (r) => goStudent(r.id),
        })
        : EmptyState({ icon: 'users', title: 'No siblings on record', text: 'Sibling links help the fee desk apply the family discount automatically.' })));
}

function academicsTab(rec) {
  const s = rec.student;
  const hist = rec.academicHistory;
  return h('div', { className: 'stack' },
    SectionCard({ title: 'Year-on-year progression', subtitle: 'Percentage and attendance across sessions', className: 'chart-card', icon: 'chart-line' },
      lineChart({
        categories: hist.map((x) => x.year),
        series: [
          { name: 'Percentage', values: hist.map((x) => x.percent) },
          { name: 'Attendance', values: hist.map((x) => x.attendance) },
        ],
        valueFormat: 'percent', height: 260, showDots: true, title: 'Year-on-year progression',
      })),
    SectionCard({ title: 'Academic history', icon: 'history', flush: true },
      DataTable({
        columns: [
          { key: 'year', label: 'Session', width: 110 },
          { key: 'className', label: 'Class', width: 120 },
          { key: 'section', label: 'Section', width: 90, align: 'center' },
          { key: 'percent', label: 'Percentage', width: 120, align: 'right', numeric: true, render: (r) => pctText(r.percent) },
          { key: 'grade', label: 'Grade', width: 90, render: (r) => Badge(r.grade, { tone: 'brand', outline: true }) },
          { key: 'attendance', label: 'Attendance', width: 120, align: 'right', numeric: true, render: (r) => pctText(r.attendance) },
          { key: 'rank', label: 'Rank', width: 80, align: 'right', numeric: true },
          { key: 'result', label: 'Result', width: 120, render: (r) => Badge(r.result === 'Promoted' ? 'Completed' : r.result) },
        ],
        rows: hist, rowKey: 'year', paginate: false, searchable: false, columnToggle: false, exportName: `${s.admissionNo}-history`,
      })),
    SectionCard({ title: 'Current subjects', subtitle: `${rec.subjectScores.length} subjects · ${s.stream || 'General'} stream`, icon: 'book-open', flush: true },
      DataTable({
        columns: [
          { key: 'subjectName', label: 'Subject', sticky: true, width: 200 },
          { key: 'subjectCode', label: 'Code', width: 90 },
          { key: 'teacher', label: 'Teacher', width: 200 },
          { key: 'marks', label: 'Marks', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => Number(v).toFixed(1) },
          { key: 'grade', label: 'Grade', width: 90, render: (r) => Badge(r.grade, { tone: 'brand', outline: true }) },
          {
            key: 'bar', label: 'Standing', width: 160, sortable: false,
            render: (r) => ProgressBar(r.marks, { tone: r.marks >= 75 ? 'success' : r.marks >= 50 ? 'warning' : 'danger', size: 'sm' }),
          },
        ],
        rows: rec.subjectScores, rowKey: 'subjectCode', paginate: false, footerAggregates: true,
        searchable: false, exportName: `${s.admissionNo}-subjects`,
      })));
}

function attendanceTab(rec) {
  const s = rec.student;
  const days = studentAttendanceDays(s);
  if (!days.length) {
    return emptyTab('clipboard-check', 'No attendance register yet',
      'This section has not been marked for the current session.',
      Button('Open daily attendance', { variant: 'primary', icon: 'clipboard-check', route: 'attendance/mark-daily' }));
  }
  const counts = { Present: 0, Absent: 0, Leave: 0, Late: 0 };
  for (const d of days) counts[d.status] += 1;
  const byMonth = new Map();
  for (const d of days) {
    const m = d.date.slice(0, 7);
    if (!byMonth.has(m)) byMonth.set(m, { Present: 0, Absent: 0, Leave: 0, Late: 0 });
    byMonth.get(m)[d.status] += 1;
  }
  const months = Array.from(byMonth.keys()).sort();
  const leaves = db.studentLeaveRequests.filter((l) => l.studentId === s.id);

  return h('div', { className: 'stack' },
    kpiRow([
      { label: 'Attendance', value: pctText(s.attendancePct), icon: 'clipboard-check', tone: s.attendancePct >= 85 ? 'success' : 'warning' },
      { label: 'Days present', value: formatNumber(s.presentDays), deltaLabel: `of ${formatNumber(s.totalDays)} working days`, icon: 'check-circle', tone: 'brand' },
      { label: 'Absent', value: formatNumber(counts.Absent), icon: 'x-circle', tone: 'danger' },
      { label: 'Leave / late', value: `${counts.Leave} / ${counts.Late}`, icon: 'timer', tone: 'info' },
    ]),
    SectionCard({
      title: 'Attendance calendar', subtitle: 'Each cell is one working day — darker means present', className: 'chart-card', icon: 'calendar',
      actions: ScaleLegend(0, 100, { format: (v) => (v > 50 ? 'Present' : 'Absent') }),
    },
      heatmap({
        mode: 'calendar', seriesName: 'Attendance', min: 0, max: 100,
        days: days.map((d) => ({ date: d.date, value: d.status === 'Absent' ? 0 : d.status === 'Leave' ? 40 : 100 })),
        title: 'Attendance calendar',
      })),
    SectionCard({ title: 'Monthly breakdown', className: 'chart-card', icon: 'chart-bar' },
      barChart({
        categories: months.map((m) => formatDate(`${m}-01`, 'monthYear')),
        series: [
          { name: 'Present', values: months.map((m) => byMonth.get(m).Present) },
          { name: 'Leave', values: months.map((m) => byMonth.get(m).Leave) },
          { name: 'Absent', values: months.map((m) => byMonth.get(m).Absent) },
        ],
        stacked: true, height: 250, title: 'Monthly attendance breakdown',
      })),
    SectionCard({ title: 'Leave requests', subtitle: `${leaves.length} application(s) on file`, icon: 'inbox', flush: true },
      leaves.length ? DataTable({
        columns: [
          { key: 'fromDate', label: 'From', width: 120, render: (r) => formatDate(r.fromDate) },
          { key: 'toDate', label: 'To', width: 120, render: (r) => formatDate(r.toDate) },
          { key: 'days', label: 'Days', width: 80, align: 'right', numeric: true },
          { key: 'type', label: 'Type', width: 130, filter: true },
          { key: 'reason', label: 'Reason' },
          { key: 'appliedBy', label: 'Applied by', width: 140 },
          { key: 'status', label: 'Status', width: 120, render: (r) => Badge(r.status) },
        ],
        rows: leaves, paginate: false, searchable: false,
      }) : EmptyState({ icon: 'inbox', title: 'No leave applications', text: 'Every absence so far has been recorded without a formal application.' })),
    SectionCard({ title: 'Day register', subtitle: 'Most recent 60 marked days', icon: 'table', flush: true },
      DataTable({
        columns: [
          { key: 'date', label: 'Date', width: 140, render: (r) => formatDate(r.date), value: (r) => r.date },
          { key: 'day', label: 'Day', width: 120, render: (r) => formatDate(r.date, 'weekday') },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
          { key: 'sectionPercent', label: 'Section attendance', width: 170, align: 'right', numeric: true, render: (r) => pctText(r.sectionPercent) },
          { key: 'strength', label: 'Strength', width: 110, align: 'right', numeric: true },
        ],
        rows: days.slice(-60).reverse(), pageSize: 10, searchable: false, exportName: `${s.admissionNo}-attendance`,
      })));
}

function examsTab(rec) {
  const s = rec.student;
  const marks = db.marks.filter((m) => m.studentId === s.id);
  if (!marks.length) {
    return emptyTab('file-text', 'No results published',
      'Marks appear here as soon as the examination team publishes the result for this class.',
      Button('Open result processing', { variant: 'primary', icon: 'refresh', route: 'examination/result-processing' }));
  }
  const groups = db.examGroups.filter((g) => marks.some((m) => m.examGroupId === g.id));
  const termAvg = groups.map((g) => {
    const set = marks.filter((m) => m.examGroupId === g.id);
    return { group: g, set, average: Number(avg(set, 'percent').toFixed(1)) };
  });
  const subjects = uniq(marks.map((m) => m.subjectName));

  return h('div', { className: 'stack' },
    kpiRow([
      { label: 'Papers written', value: formatNumber(marks.length), icon: 'file-text', tone: 'brand' },
      { label: 'Average', value: pctText(avg(marks, 'percent')), icon: 'percent', tone: 'info' },
      { label: 'Best subject', value: sortBy(marks, 'percent', 'desc')[0].subjectName, icon: 'trophy', tone: 'success' },
      { label: 'Class rank', value: `#${s.rank}`, deltaLabel: `CGPA ${Number(s.cgpa).toFixed(2)}`, icon: 'medal', tone: 'warning' },
    ]),
    SectionCard({ title: 'Term-on-term average', subtitle: 'Weighted percentage per exam group', className: 'chart-card', icon: 'chart-line' },
      lineChart({
        categories: termAvg.map((t) => t.group.name),
        series: [{ name: 'Average', values: termAvg.map((t) => t.average) }],
        valueFormat: 'percent', height: 250, showDots: true, showEndLabels: true, target: 75, targetLabel: 'Target',
        title: 'Term-on-term average',
      })),
    SectionCard({ title: 'Subject scores by term', subtitle: 'Percentage achieved in each exam group', className: 'chart-card', icon: 'chart-bar' },
      barChart({
        categories: subjects,
        series: termAvg.slice(0, 4).map((t) => ({
          name: t.group.name,
          values: subjects.map((sub) => {
            const m = t.set.find((x) => x.subjectName === sub);
            return m ? m.percent : 0;
          }),
        })),
        height: 300, valueFormat: 'percent', title: 'Subject scores by term',
      })),
    SectionCard({ title: 'Mark sheet', subtitle: `${marks.length} entries across ${groups.length} exam groups`, icon: 'table', flush: true },
      DataTable({
        columns: [
          { key: 'examGroupId', label: 'Exam group', width: 170, filter: true, render: (r) => (byId(db.examGroups, r.examGroupId) || {}).name || r.examGroupId, value: (r) => (byId(db.examGroups, r.examGroupId) || {}).name || '' },
          { key: 'subjectName', label: 'Subject', sticky: true, width: 190, filter: true },
          { key: 'maxMarks', label: 'Max', width: 80, align: 'right', numeric: true },
          { key: 'marksObtained', label: 'Obtained', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => Number(v).toFixed(1) },
          { key: 'percent', label: '%', width: 90, align: 'right', numeric: true, aggregate: 'avg', format: (v) => pctText(v), render: (r) => pctText(r.percent) },
          { key: 'grade', label: 'Grade', width: 90, filter: true, render: (r) => Badge(r.grade, { tone: 'brand', outline: true }) },
          { key: 'status', label: 'Result', width: 110, filter: true, render: (r) => Badge(r.status) },
          { key: 'remarks', label: 'Remarks' },
        ],
        rows: marks, pageSize: 15, footerAggregates: true, exportName: `${s.admissionNo}-marks`,
        searchKeys: ['subjectName', 'grade'],
      })),
    SectionCard({ title: 'Report cards', icon: 'certificate' },
      h('div', { className: 'row row-wrap' },
        groups.map((g) => Button(`${g.name} report card`, {
          variant: 'secondary', icon: 'download',
          onClick: () => notify({ title: 'Report card generated', text: `${g.name} · ${s.name}`, tone: 'success' }),
        })))));
}

function feesTab(rec) {
  const s = rec.student;
  const invoices = rec.invoices;
  const payments = rec.payments;
  const paidPct = s.feeTotal ? Math.round((s.feePaid / s.feeTotal) * 100) : 0;
  return h('div', { className: 'stack' },
    kpiRow([
      { label: 'Billed', value: money(s.feeTotal), icon: 'receipt', tone: 'info' },
      { label: 'Collected', value: money(s.feePaid), deltaLabel: `${paidPct}% of billed`, icon: 'wallet', tone: 'success' },
      { label: 'Outstanding', value: money(s.feeDue), icon: 'alert-circle', tone: s.feeDue > 0 ? 'danger' : 'success' },
      { label: 'Status', value: s.feeStatus, icon: 'percent', tone: s.feeStatus === 'Paid' ? 'success' : s.feeStatus === 'Overdue' ? 'danger' : 'warning' },
    ]),
    s.feeDue > 0 ? Callout({ tone: 'warning', icon: 'alert-circle', title: `${money(s.feeDue)} outstanding` },
      h('div', { className: 'row row-wrap' },
        h('span', null, 'Send a reminder to the guardian or collect at the fee counter.'),
        h('span', { className: 'spacer' }),
        Button('Send reminder', { variant: 'secondary', size: 'sm', icon: 'bell', onClick: () => notify({ title: 'Reminder queued', text: s.guardianName, tone: 'success' }) }),
        Button('Collect fee', { variant: 'primary', size: 'sm', icon: 'credit-card', route: 'fees/collection' }))) : null,
    SectionCard({ title: 'Invoice ledger', subtitle: `${invoices.length} invoice(s) raised this session`, icon: 'receipt', flush: true },
      invoices.length ? DataTable({
        columns: [
          { key: 'invoiceNo', label: 'Invoice', width: 150, sticky: true },
          { key: 'period', label: 'Period', width: 140, filter: true },
          { key: 'issueDate', label: 'Issued', width: 130, render: (r) => formatDate(r.issueDate), value: (r) => r.issueDate },
          { key: 'dueDate', label: 'Due', width: 130, render: (r) => formatDate(r.dueDate), value: (r) => r.dueDate },
          { key: 'amount', label: 'Amount', width: 130, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.amount) },
          { key: 'discount', label: 'Discount', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.discount) },
          { key: 'lateFee', label: 'Late fee', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.lateFee) },
          { key: 'paid', label: 'Paid', width: 130, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.paid) },
          { key: 'balance', label: 'Balance', width: 130, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => h('span', { className: r.balance > 0 ? 't-danger t-num' : 't-num' }, money(r.balance)) },
          { key: 'status', label: 'Status', width: 110, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: invoices, pageSize: 10, footerAggregates: true, exportName: `${s.admissionNo}-invoices`,
        rowActions: (row) => [
          { label: 'View invoice', icon: 'eye', onClick: mockAction('View invoice') },
          { label: 'Download PDF', icon: 'download', onClick: () => notify({ title: 'Invoice downloaded', text: row.invoiceNo, tone: 'success' }) },
          { label: 'Collect payment', icon: 'credit-card', route: 'fees/collection' },
        ],
      }) : EmptyState({ icon: 'receipt', title: 'No invoices raised', text: 'Fee structures for this class have not been applied to this student yet.' })),
    SectionCard({ title: 'Receipts', subtitle: `${payments.length} payment(s) received`, icon: 'wallet', flush: true },
      payments.length ? DataTable({
        columns: [
          { key: 'receiptNo', label: 'Receipt', width: 150, sticky: true },
          { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date), value: (r) => r.date },
          { key: 'amount', label: 'Amount', width: 140, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.amount) },
          { key: 'mode', label: 'Mode', width: 130, filter: true },
          { key: 'reference', label: 'Reference', width: 170 },
          { key: 'collectedByName', label: 'Collected by', width: 180 },
          { key: 'status', label: 'Status', width: 110, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: payments, pageSize: 10, footerAggregates: true, exportName: `${s.admissionNo}-receipts`,
        rowActions: (row) => [{ label: 'Print receipt', icon: 'print', onClick: () => notify({ title: 'Receipt sent to printer', text: row.receiptNo, tone: 'info' }) }],
      }) : EmptyState({ icon: 'wallet', title: 'No payments yet', text: 'Once the first instalment is collected the receipt appears here.' })));
}

function transportTab(rec) {
  const s = rec.student;
  if (!s.transportOpted) {
    return emptyTab('bus', 'Not using school transport',
      `${s.name} is a private-transport student. Opting in allocates a route, a stop and a monthly transport fee.`,
      Button('Allocate a route', { variant: 'primary', icon: 'route', route: 'transport/allocation' }));
  }
  const route = byId(db.routes, s.routeId);
  const stop = byId(db.stops, s.stopId);
  const vehicle = route ? byId(db.vehicles, route.vehicleId) : null;
  const driver = vehicle ? byId(db.drivers, vehicle.driverId) : null;
  const routeStops = route ? db.stops.filter((x) => x.routeId === route.id).sort((a, b) => a.seq - b.seq) : [];
  const busDays = route ? db.busAttendance.filter((b) => b.routeId === route.id) : [];

  return h('div', { className: 'stack' },
    kpiRow([
      { label: 'Route', value: route ? route.code : '—', deltaLabel: route ? route.name : '', icon: 'route', tone: 'brand' },
      { label: 'Stop', value: stop ? stop.name : '—', deltaLabel: stop ? `Pickup ${stop.pickupTime}` : '', icon: 'map-pin', tone: 'info' },
      { label: 'Vehicle', value: vehicle ? vehicle.regNo : '—', deltaLabel: vehicle ? vehicle.model : '', icon: 'bus', tone: 'success' },
      { label: 'Monthly fare', value: route ? money(route.fare) : '—', icon: 'wallet', tone: 'warning' },
    ]),
    h('div', { className: 'widget-grid' },
      h('div', { className: 'span-6' },
        SectionCard({ title: 'Route details', icon: 'route' },
          route ? DescriptionList([
            ['Route', `${route.code} — ${route.name}`], ['Shift', route.shift],
            ['Distance', `${route.distanceKm} km`], ['Duration', `${route.durationMin} min`],
            ['Stops', String(route.stopCount)], ['Students on board', formatNumber(route.studentCount)],
            ['Pickup starts', route.pickupStart], ['Drop starts', route.dropStart],
            ['Status', Badge(route.status)],
          ], { cols: 2 }) : EmptyState({ icon: 'route', title: 'Route record missing' }))),
      h('div', { className: 'span-6' },
        SectionCard({ title: 'Vehicle & crew', icon: 'bus' },
          vehicle ? DescriptionList([
            ['Registration', vehicle.regNo], ['Model', vehicle.model],
            ['Capacity', `${vehicle.onboard} of ${vehicle.capacity} seats`],
            ['Driver', driver ? driver.name : '—'], ['Driver phone', driver ? driver.phone : '—'],
            ['Licence valid till', driver ? formatDate(driver.licenceExpiry) : '—'],
            ['Fitness expiry', formatDate(vehicle.fitnessExpiry)],
            ['Status', Badge(vehicle.status)],
          ], { cols: 2 }) : EmptyState({ icon: 'bus', title: 'No vehicle assigned' })))),
    routeStops.length ? SectionCard({ title: 'Stops on this route', subtitle: `${s.name} boards at ${stop ? stop.name : 'an unassigned stop'}`, icon: 'map-pin', flush: true },
      DataTable({
        columns: [
          { key: 'seq', label: '#', width: 60, align: 'right', numeric: true },
          { key: 'name', label: 'Stop', sticky: true, width: 200, render: (r) => h('span', { className: r.id === s.stopId ? 't-semibold t-brand' : '' }, r.name) },
          { key: 'landmark', label: 'Landmark' },
          { key: 'pickupTime', label: 'Pickup', width: 110 },
          { key: 'dropTime', label: 'Drop', width: 110 },
          { key: 'studentCount', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        ],
        rows: routeStops, paginate: false, searchable: false, footerAggregates: true,
      })) : null,
    busDays.length ? SectionCard({ title: 'Recent bus attendance on this route', className: 'chart-card', icon: 'clipboard-check' },
      lineChart({
        categories: busDays.slice(-14).map((b) => formatDate(b.date, 'dayMonth')),
        series: [{ name: 'Boarded %', values: busDays.slice(-14).map((b) => b.percent) }],
        valueFormat: 'percent', height: 220, title: 'Bus attendance',
      })) : null);
}

function hostelTab(rec) {
  const s = rec.student;
  const alloc = db.hostelAllocations.find((a) => a.studentId === s.id);
  if (!s.hostelOpted || !alloc) {
    return emptyTab('bed', 'Day scholar',
      `${s.name} is not a boarder. Allocating a hostel bed creates a room record, a mess plan and a monthly hostel fee.`,
      Button('Allocate a room', { variant: 'primary', icon: 'bed', route: 'hostel/allocation' }));
  }
  const hostel = byId(db.hostels, alloc.hostelId);
  const room = byId(db.hostelRooms, alloc.roomId);
  const mates = db.hostelAllocations.filter((a) => a.roomId === alloc.roomId && a.studentId !== s.id)
    .map((a) => byId(db.students, a.studentId)).filter(Boolean);
  return h('div', { className: 'stack' },
    kpiRow([
      { label: 'Hostel', value: hostel ? hostel.name : '—', icon: 'building-2', tone: 'brand' },
      { label: 'Room', value: `${alloc.roomNo} · Bed ${alloc.bedNo}`, icon: 'door', tone: 'info' },
      { label: 'Mess plan', value: alloc.messPlan, icon: 'utensils', tone: 'success' },
      { label: 'Monthly fee', value: money(alloc.monthlyFee), icon: 'wallet', tone: 'warning' },
    ]),
    h('div', { className: 'widget-grid' },
      h('div', { className: 'span-6' },
        SectionCard({ title: 'Allocation', icon: 'bed' },
          DescriptionList([
            ['Hostel', alloc.hostelName], ['Room number', alloc.roomNo], ['Bed', String(alloc.bedNo)],
            ['Floor', room ? String(room.floor) : '—'], ['Room type', room ? room.type : '—'],
            ['Air conditioned', room ? (room.ac ? 'Yes' : 'No') : '—'],
            ['Attached bath', room ? (room.attachedBath ? 'Yes' : 'No') : '—'],
            ['Allocated on', formatDate(alloc.allocatedOn)], ['Status', Badge(alloc.status)],
          ], { cols: 2 }))),
      h('div', { className: 'span-6' },
        SectionCard({ title: 'Local guardian & mess', icon: 'user-check' },
          DescriptionList([
            ['Local guardian', alloc.localGuardian], ['Guardian phone', alloc.localGuardianPhone],
            ['Mess plan', alloc.messPlan], ['Vacated on', alloc.vacatedOn ? formatDate(alloc.vacatedOn) : 'Currently resident'],
          ], { cols: 1 }),
          Divider({ label: 'Room mates' }),
          mates.length ? h('div', { className: 'stack-2' },
            mates.map((m) => Identity(m.name, `${m.className}-${m.section}`, { onClick: () => goStudent(m.id) })))
            : h('div', { className: 't-sm t-muted' }, 'Single occupancy — no room mates.')))),
    SectionCard({ title: 'This week’s mess menu', icon: 'utensils', flush: true },
      DataTable({
        columns: [
          { key: 'day', label: 'Day', width: 130, sticky: true },
          { key: 'breakfast', label: 'Breakfast' },
          { key: 'lunch', label: 'Lunch' },
          { key: 'snacks', label: 'Snacks' },
          { key: 'dinner', label: 'Dinner' },
          { key: 'calories', label: 'kcal', width: 90, align: 'right', numeric: true, aggregate: 'avg', format: (v) => formatNumber(v) },
        ],
        rows: db.messMenu, paginate: false, searchable: false, footerAggregates: true,
      })));
}

function libraryTab(rec) {
  const s = rec.student;
  const issues = rec.bookIssues;
  const member = db.libraryMembers.find((m) => m.refId === s.id);
  return h('div', { className: 'stack' },
    kpiRow([
      { label: 'Card number', value: s.libraryCardNo, icon: 'id-card', tone: 'brand' },
      { label: 'Currently issued', value: formatNumber(s.booksIssued), icon: 'book', tone: 'info' },
      { label: 'Lifetime issues', value: formatNumber(member ? member.totalIssued : issues.length), icon: 'history', tone: 'success' },
      { label: 'Fine outstanding', value: money(member ? member.fineOutstanding : 0), icon: 'rupee', tone: (member && member.fineOutstanding) ? 'danger' : 'success' },
    ]),
    member ? SectionCard({ title: 'Membership', icon: 'library' },
      DescriptionList([
        ['Member id', member.id], ['Type', member.memberType], ['Joined', formatDate(member.joinDate)],
        ['Borrowing limit', `${member.maxBooks} books`], ['Currently issued', String(member.currentIssued)],
        ['Status', Badge(member.status)],
      ], { cols: 2 })) : null,
    SectionCard({ title: 'Issue history', subtitle: `${issues.length} transaction(s)`, icon: 'book-open', flush: true },
      issues.length ? DataTable({
        columns: [
          { key: 'bookTitle', label: 'Book', sticky: true, width: 260 },
          { key: 'accessionNo', label: 'Accession', width: 130 },
          { key: 'issueDate', label: 'Issued', width: 130, render: (r) => formatDate(r.issueDate), value: (r) => r.issueDate },
          { key: 'dueDate', label: 'Due', width: 130, render: (r) => formatDate(r.dueDate), value: (r) => r.dueDate },
          { key: 'returnDate', label: 'Returned', width: 130, render: (r) => (r.returnDate ? formatDate(r.returnDate) : '—'), value: (r) => r.returnDate || '' },
          { key: 'renewals', label: 'Renewals', width: 110, align: 'right', numeric: true },
          { key: 'fine', label: 'Fine', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: (v) => money(v), render: (r) => money(r.fine) },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: issues, pageSize: 10, footerAggregates: true, exportName: `${s.admissionNo}-library`,
      }) : EmptyState({ icon: 'library', title: 'No books issued yet', text: 'Encourage a first issue — the library card is already active.' })));
}

function healthTab(rec) {
  const s = rec.student;
  const hr = rec.healthRecord;
  const visits = db.infirmaryVisits.filter((v) => v.studentId === s.id);
  if (!hr) {
    return emptyTab('stethoscope', 'No health record',
      'The annual medical checkup has not been recorded for this student yet.',
      Button('Open health profiles', { variant: 'primary', icon: 'heart-pulse', route: 'health/profiles' }));
  }
  return h('div', { className: 'stack' },
    kpiRow([
      { label: 'Blood group', value: hr.bloodGroup, icon: 'droplet', tone: 'danger' },
      { label: 'BMI', value: String(hr.bmi), deltaLabel: `${hr.heightCm} cm · ${hr.weightKg} kg`, icon: 'activity', tone: 'brand' },
      { label: 'Last checkup', value: formatDate(hr.lastCheckup), icon: 'clipboard-check', tone: 'info' },
      { label: 'Infirmary visits', value: formatNumber(visits.length), icon: 'first-aid', tone: visits.length > 4 ? 'warning' : 'success' },
    ]),
    (hr.allergies && hr.allergies !== 'None') ? Callout({ tone: 'danger', icon: 'alert-triangle', title: 'Allergies on record' }, String(hr.allergies)) : null,
    h('div', { className: 'widget-grid' },
      h('div', { className: 'span-6' },
        SectionCard({ title: 'Medical profile', icon: 'stethoscope' },
          DescriptionList([
            ['Height', `${hr.heightCm} cm`], ['Weight', `${hr.weightKg} kg`], ['BMI', String(hr.bmi)],
            ['Vision', hr.vision], ['Dental', hr.dental],
            ['Allergies', hr.allergies || 'None'], ['Chronic conditions', hr.chronicConditions || 'None'],
            ['Family doctor', hr.familyDoctor], ['Insurance', hr.insurancePolicy],
            ['Next checkup', formatDate(hr.nextCheckup)], ['Status', Badge(hr.status)],
          ], { cols: 2 }))),
      h('div', { className: 'span-6' },
        SectionCard({ title: 'Vaccinations', icon: 'syringe' },
          Array.isArray(hr.vaccinations) && hr.vaccinations.length
            ? h('div', { className: 'row row-wrap' }, hr.vaccinations.map((v) => Tag(typeof v === 'string' ? v : v.name, { icon: 'check' })))
            : EmptyState({ icon: 'syringe', title: 'No vaccination records', text: 'Ask the guardian to upload the immunisation card.' })))),
    SectionCard({ title: 'Infirmary visits', subtitle: `${visits.length} visit(s)`, icon: 'first-aid', flush: true },
      visits.length ? DataTable({
        columns: [
          { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date), value: (r) => r.date },
          { key: 'time', label: 'Time', width: 100 },
          { key: 'complaint', label: 'Complaint', width: 190 },
          { key: 'diagnosis', label: 'Diagnosis', width: 190 },
          { key: 'treatment', label: 'Treatment' },
          { key: 'attendedByName', label: 'Attended by', width: 170 },
          { key: 'parentInformed', label: 'Parent informed', width: 150, render: (r) => Badge(r.parentInformed ? 'Verified' : 'Pending') },
        ],
        rows: visits, pageSize: 10, exportName: `${s.admissionNo}-infirmary`,
      }) : EmptyState({ icon: 'first-aid', title: 'No infirmary visits', text: 'A clean bill of health for this session.' })));
}

function behaviourTab(rec) {
  const s = rec.student;
  const lates = db.lateRecords.filter((l) => l.studentId === s.id);
  return h('div', { className: 'stack' },
    kpiRow([
      { label: 'Behaviour score', value: `${s.behaviourScore}/100`, icon: 'smile', tone: s.behaviourScore >= 80 ? 'success' : s.behaviourScore >= 60 ? 'warning' : 'danger' },
      { label: 'Disciplinary notes', value: formatNumber(s.disciplinaryCount), icon: 'alert-circle', tone: s.disciplinaryCount ? 'warning' : 'success' },
      { label: 'Late arrivals', value: formatNumber(lates.length), icon: 'timer', tone: lates.length > 2 ? 'warning' : 'success' },
      { label: 'Awards', value: formatNumber(s.awardsCount), icon: 'award', tone: 'brand' },
    ]),
    h('div', { className: 'widget-grid' },
      h('div', { className: 'span-5' },
        SectionCard({ title: 'Conduct index', subtitle: 'Composite of punctuality, discipline notes and peer feedback', className: 'chart-card', icon: 'gauge' },
          gaugeChart({ value: s.behaviourScore, min: 0, max: 100, label: 'Behaviour score', height: 230, title: 'Conduct index' }))),
      h('div', { className: 'span-7' },
        SectionCard({ title: 'Standing against the cohort', className: 'chart-card', icon: 'chart-bar' },
          bulletChart({
            items: [
              { label: 'Behaviour', value: s.behaviourScore, target: 80 },
              { label: 'Attendance', value: s.attendancePct, target: 85 },
              { label: 'Academics', value: s.lastExamPercent, target: 75 },
            ],
            height: 220, title: 'Standing against the cohort',
          })))),
    SectionCard({ title: 'Punctuality register', subtitle: `${lates.length} late / early record(s)`, icon: 'timer', flush: true },
      lates.length ? DataTable({
        columns: [
          { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date), value: (r) => r.date },
          { key: 'inTime', label: 'In time', width: 110 },
          { key: 'minutesLate', label: 'Minutes late', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'type', label: 'Type', width: 130, filter: true },
          { key: 'reason', label: 'Reason' },
          { key: 'actionTaken', label: 'Action taken', width: 190 },
        ],
        rows: lates, paginate: false, footerAggregates: true, searchable: false,
      }) : EmptyState({ icon: 'check-circle', title: 'Punctual all session', text: 'No late arrivals or early departures recorded.' })),
    SectionCard({ title: 'Add a behaviour note', icon: 'edit' },
      h('div', { className: 'stack-3' },
        FormGrid({ cols: 2 },
          Field({ label: 'Type', required: true }, Select({ options: ['Appreciation', 'Verbal warning', 'Written warning', 'Detention', 'Parent called'], placeholder: 'Select…' })),
          Field({ label: 'Date', required: true }, DatePicker({ value: '2026-08-20', width: '100%' })),
          Field({ label: 'Note', className: 'col-span-full' }, Textarea({ rows: 3, placeholder: 'What happened, who was involved and what was agreed…' }))),
        FormActions(
          Button('Record note', { variant: 'primary', icon: 'check', onClick: () => notify({ title: 'Behaviour note recorded', text: s.name, tone: 'success' }) }),
          Button('Notify guardian', { variant: 'secondary', icon: 'send', onClick: () => messageParent(s) })))));
}

function activitiesTab(rec) {
  const s = rec.student;
  const awards = rec.awards;
  const clubs = db.clubs.filter((c) => hash(s.id + c.id) % 7 === 0);
  return h('div', { className: 'stack' },
    kpiRow([
      { label: 'Awards', value: formatNumber(awards.length), icon: 'award', tone: 'warning' },
      { label: 'House points earned', value: formatNumber(sum(awards, 'points')), icon: 'flag', tone: 'brand' },
      { label: 'Activities', value: formatNumber((s.activities || []).length), icon: 'trophy', tone: 'success' },
      { label: 'House', value: s.house, icon: 'flag', tone: 'info' },
    ]),
    SectionCard({ title: 'Activities & clubs', icon: 'trophy' },
      (s.activities && s.activities.length) || clubs.length
        ? h('div', { className: 'row row-wrap' },
          (s.activities || []).map((a) => Tag(a, { icon: 'star' })),
          clubs.map((c) => Tag(`${c.name} club`, { icon: 'users' })))
        : EmptyState({ icon: 'trophy', title: 'No activities recorded', text: 'Enrol the student in a club or house team to build the co-curricular profile.', action: Button('Browse clubs', { variant: 'primary', icon: 'users', route: 'activities/clubs' }) })),
    SectionCard({ title: 'Awards & achievements', subtitle: `${awards.length} award(s)`, icon: 'award', flush: true },
      awards.length ? DataTable({
        columns: [
          { key: 'title', label: 'Award', sticky: true, width: 230 },
          { key: 'category', label: 'Category', width: 150, filter: true },
          { key: 'level', label: 'Level', width: 140, filter: true, render: (r) => Badge(r.level, { tone: 'brand', outline: true }) },
          { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date), value: (r) => r.date },
          { key: 'awardedBy', label: 'Awarded by', width: 190 },
          { key: 'certificateNo', label: 'Certificate', width: 150 },
          { key: 'points', label: 'Points', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        ],
        rows: awards, paginate: false, footerAggregates: true, searchable: false,
        rowActions: (row) => [{ label: 'Reprint certificate', icon: 'print', onClick: () => notify({ title: 'Certificate reprinted', text: row.certificateNo, tone: 'info' }) }],
      }) : EmptyState({ icon: 'award', title: 'No awards yet', text: 'Awards recorded in the activities module appear here automatically.' })));
}

function documentsTab(rec) {
  const s = rec.student;
  const docs = rec.documents;
  const verified = docs.filter((d) => d.status === 'Verified').length;
  return h('div', { className: 'stack' },
    kpiRow([
      { label: 'Documents on file', value: formatNumber(docs.length), icon: 'folder', tone: 'brand' },
      { label: 'Verified', value: formatNumber(verified), icon: 'check-circle', tone: 'success' },
      { label: 'Pending', value: formatNumber(docs.filter((d) => d.status === 'Pending').length), icon: 'clock', tone: 'warning' },
      { label: 'Rejected', value: formatNumber(docs.filter((d) => d.status === 'Rejected').length), icon: 'x-circle', tone: 'danger' },
    ]),
    SectionCard({
      title: 'Document wallet', subtitle: `${verified} of ${docs.length} verified`, icon: 'folder',
      actions: Button('Upload', { variant: 'secondary', size: 'sm', icon: 'upload', onClick: () => notify({ title: 'Upload dialog opened', text: 'Demo only — no file is stored.', tone: 'info' }) }),
    },
      FileList(docs.map((d) => ({
        name: d.name, size: `${formatNumber(d.sizeKb)} KB`, type: d.type,
        date: formatDate(d.uploadedOn), status: d.status,
      })), {
        onDownload: (f) => notify({ title: 'Downloading', text: f.name, tone: 'info' }),
        onRemove: (f) => ConfirmDialog({
          title: `Remove ${f.name}?`, text: 'The document is removed from the student wallet.',
          confirmLabel: 'Remove', tone: 'danger',
        }).then((ok) => ok && notify({ title: 'Document removed', text: f.name, tone: 'danger' })),
      })),
    SectionCard({ title: 'Verification log', icon: 'shield-check', flush: true },
      DataTable({
        columns: [
          { key: 'name', label: 'Document', sticky: true, width: 220 },
          { key: 'type', label: 'Format', width: 100, filter: true },
          { key: 'sizeKb', label: 'Size (KB)', width: 120, align: 'right', numeric: true },
          { key: 'uploadedOn', label: 'Uploaded', width: 140, render: (r) => formatDate(r.uploadedOn), value: (r) => r.uploadedOn },
          { key: 'verifiedBy', label: 'Verified by', width: 170, render: (r) => r.verifiedBy || '—' },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: docs, paginate: false, searchable: false, exportName: `${s.admissionNo}-documents`,
      })));
}

function timelineTab(rec) {
  const s = rec.student;
  const items = rec.timeline.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).map((e) => ({
    title: e.title, meta: `${formatDate(e.date)} · ${relativeTime(e.date)}`, text: e.text,
    icon: e.icon, tone: e.tone === 'default' ? 'neutral' : e.tone,
  }));
  return h('div', { className: 'stack' },
    SectionCard({ title: 'Full student timeline', subtitle: `${items.length} recorded events since admission`, icon: 'history' },
      Timeline(items)),
    SectionCard({ title: 'Add an entry', icon: 'edit' },
      h('div', { className: 'stack-3' },
        FormGrid({ cols: 2 },
          Field({ label: 'Event', required: true }, Input({ placeholder: 'e.g. Counselling session with class teacher' })),
          Field({ label: 'Date', required: true }, DatePicker({ value: '2026-08-20', width: '100%' })),
          Field({ label: 'Detail', className: 'col-span-full' }, Textarea({ rows: 3, placeholder: 'Context for whoever reads this next…' }))),
        FormActions(Button('Add to timeline', { variant: 'primary', icon: 'check', onClick: () => notify({ title: 'Timeline entry added', text: s.name, tone: 'success' }) })))));
}

function profileSidebar(rec) {
  const s = rec.student;
  const route = s.transportOpted ? byId(db.routes, s.routeId) : null;
  const stop = s.transportOpted ? byId(db.stops, s.stopId) : null;
  const hostel = s.hostelOpted ? byId(db.hostels, s.hostelId) : null;
  const classTeacherSection = byId(db.sections, s.sectionId);
  const classTeacher = classTeacherSection ? byId(db.staff, classTeacherSection.classTeacherId) : null;

  return [
    SectionCard({ title: 'Contact', icon: 'phone' },
      h('div', null,
        railLine('mail', 'Student email', mailLink(s.email, s.name)),
        railLine('phone', 'Student phone', phoneLink(s.phone, s.name)),
        railLine('siren', 'Emergency contact', phoneLink(s.emergencyContact, s.guardianName)),
        railLine('map-pin', 'Address', `${s.address.line1}, ${s.address.line2}, ${s.address.city} ${s.address.pincode}`),
        railLine('droplet', 'Blood group', h('span', { className: 't-semibold' }, s.bloodGroup)))),
    SectionCard({
      title: 'Guardians', icon: 'users',
      actions: Button('All', { variant: 'link', size: 'sm', route: 'parents/directory' }),
    },
      rec.guardians.length
        ? h('div', { className: 'stack-3' }, rec.guardians.map((g) => h('div', { className: 'row-3' },
          Avatar(g.name, { size: 'sm' }),
          h('div', { className: 'flex-1 min-0' },
            h('button', {
              className: 'btn btn-link', style: { padding: '0' },
              onClick: () => goParent(g.id),
            }, g.name),
            h('div', { className: 't-xs t-muted' }, `${g.relation} · ${g.occupation}`)),
          IconButton('phone', { label: `Call ${g.name}`, size: 'sm', onClick: () => notify({ title: `Dialling ${g.phone}`, tone: 'info' }) }),
          IconButton('mail', { label: `Email ${g.name}`, size: 'sm', onClick: () => notify({ title: 'Compose opened', text: g.email, tone: 'info' }) }))))
        : h('div', { className: 't-sm t-muted' }, `${s.guardianName} (${s.guardianRelation}) · ${s.emergencyContact}`)),
    SectionCard({ title: 'Class & house', icon: 'graduation-cap' },
      h('div', null,
        railLine('grid', 'Class / section', `${s.className} — ${s.section} · Roll ${s.rollNo}`),
        railLine('user-check', 'Class teacher', classTeacher ? classTeacher.name : 'Not assigned'),
        railLine('flag', 'House', s.house),
        railLine('building-columns', 'Campus', campusName(s.campusId)))),
    SectionCard({ title: 'Logistics', icon: 'bus' },
      h('div', null,
        railLine('route', 'Transport', route ? `${route.code} · ${route.name}` : 'Private transport'),
        railLine('map-pin', 'Stop', stop ? `${stop.name} · pickup ${stop.pickupTime}` : '—'),
        railLine('bed', 'Hostel', hostel ? `${hostel.name} · Room ${s.roomNo}` : 'Day scholar'),
        railLine('library', 'Library card', `${s.libraryCardNo} · ${s.booksIssued} issued`))),
    SectionCard({ title: 'Fee snapshot', icon: 'wallet' },
      h('div', { className: 'stack-2' },
        MetricRow('Billed', money(s.feeTotal)),
        MetricRow('Paid', money(s.feePaid)),
        MetricRow('Outstanding', h('span', { className: s.feeDue > 0 ? 't-danger t-semibold' : 't-success t-semibold' }, money(s.feeDue))),
        ProgressBar(s.feeTotal ? (s.feePaid / s.feeTotal) * 100 : 0, { tone: s.feeDue > 0 ? 'warning' : 'success', showValue: true, label: 'Collected' }),
        Button('Collect fee', { variant: 'secondary', block: true, icon: 'credit-card', route: 'fees/collection' }))),
  ];
}

/* =========================================================== STUDENT ROUTES */

const studentRoutes = {
  /* ------------------------------------------------------------ all students */
  'students/all': {
    title: 'All Students',
    subtitle: 'Every enrolled student across the selected campus',
    section: 'students',
    render(mount, ctx) {
      injectStyles();
      const all = scopedStudents(ctx);
      const f = { tab: (ctx.query && ctx.query.tab) || 'all', className: (ctx.query && ctx.query.class) || 'all', house: (ctx.query && ctx.query.house) || 'all' };
      let node;
      const apply = () => { if (node && node.table) node.table.refresh(filterStudents(all, f)); };

      const active = all.filter((s) => s.status === 'Active');
      const defaulters = all.filter((s) => s.feeDue > 0);

      node = listPage({
        title: 'All Students',
        subtitle: `${formatNumber(all.length)} enrolled · ${scopeLabel(ctx)}`,
        route: 'students/all',
        actions: [
          MenuButton([
            { label: 'Bulk import', icon: 'upload', route: 'students/bulk-import' },
            { label: 'Promote students', icon: 'trending-up', route: 'students/promote' },
            { label: 'Print ID cards', icon: 'id-card', route: 'students/id-cards' },
            { separator: true },
            { label: 'Export current view', icon: 'download', onClick: () => { if (node.table) { download('students.csv', toCsv(node.table.getRows(), [{ key: 'admissionNo', label: 'Admission no' }, { key: 'name', label: 'Name' }, { key: 'className', label: 'Class' }, { key: 'section', label: 'Section' }, { key: 'house', label: 'House' }, { key: 'attendancePct', label: 'Attendance %' }, { key: 'feeDue', label: 'Fee due' }]), 'text/csv;charset=utf-8'); notify({ title: 'Export ready', tone: 'success' }); } } },
          ], { label: 'More actions' }),
          Button('Student reports', { variant: 'secondary', icon: 'chart-bar', route: 'students/reports' }),
          Button('Add student', { variant: 'primary', icon: 'user-plus', route: 'students/add' }),
        ],
        tabs: [
          { id: 'all', label: 'All', count: all.length },
          { id: 'active', label: 'Active', count: active.length },
          { id: 'new', label: 'New admissions', count: all.filter((s) => String(s.admissionDate).startsWith('2026')).length },
          { id: 'defaulters', label: 'Fee due', count: defaulters.length },
          { id: 'transport', label: 'On transport', count: all.filter((s) => s.transportOpted).length },
          { id: 'hostel', label: 'Boarders', count: all.filter((s) => s.hostelOpted).length },
          { id: 'inactive', label: 'Inactive', count: all.filter((s) => s.status !== 'Active').length },
        ],
        activeTab: f.tab,
        onTabChange: (id) => { f.tab = id; apply(); },
        kpis: [
          { label: 'Total students', value: formatNumber(all.length), delta: 4.4, deltaLabel: 'vs last session', icon: 'graduation-cap', tone: 'brand', trend: analytics.sparks.students, route: 'students/all' },
          { label: 'Average attendance', value: pctText(avg(all, 'attendancePct')), delta: 1.2, deltaLabel: 'vs last month', icon: 'clipboard-check', tone: 'success', trend: analytics.sparks.attendance },
          { label: 'Fee outstanding', value: moneyK(sum(all, 'feeDue')), delta: -3.1, deltaLabel: 'vs last month', icon: 'wallet', tone: 'danger', trend: analytics.sparks.outstanding, route: 'fees/defaulters' },
          { label: 'On transport', value: formatNumber(all.filter((s) => s.transportOpted).length), deltaLabel: `${all.filter((s) => s.hostelOpted).length} in hostel`, icon: 'bus', tone: 'info', trend: analytics.sparks.transport },
        ],
        filters: STUDENT_FILTERS(all),
        onFilter: (id, value, allValues) => { Object.assign(f, allValues); apply(); },
        chart: barChart({
          categories: analytics.enrolmentByClass.map((r) => r.className),
          series: [{ name: 'Students', values: analytics.enrolmentByClass.map((r) => r.value) }],
          height: 220, title: 'Enrolment by class',
        }),
        chartTitle: 'Enrolment by class',
        chartActions: Button('Open enrolment report', { variant: 'link', size: 'sm', route: 'students/reports' }),
        columns: studentColumns(),
        rows: filterStudents(all, f),
        selectable: true,
        footerAggregates: true,
        pageSize: 25,
        searchKeys: ['name', 'admissionNo', 'className', 'fatherName'],
        exportName: 'students',
        bulkActions: studentBulkActions,
        rowActions: studentRowActions,
        onRowClick: (row) => goStudent(row.id),
        emptyState: EmptyState({
          icon: 'graduation-cap', title: 'No students match these filters',
          text: 'Try clearing a filter, or add the first student for this class.',
          action: Button('Add student', { variant: 'primary', icon: 'user-plus', route: 'students/add' }),
        }),
      });
      mount.appendChild(node);
    },
  },

  /* -------------------------------------------------------- student 360 --- */
  'students/profile': {
    title: 'Student 360 Profile',
    subtitle: 'Everything the school knows about one student',
    section: 'students',
    render(mount, ctx) {
      injectStyles();
      const pool = scopedStudents(ctx);
      const id = ctx.param || (pool[0] && pool[0].id) || 'STU0001';
      const rec = student360(id);
      if (!rec) { mount.appendChild(missingRecord('student', 'students/all')); return; }
      const s = rec.student;
      const canFees = store.can('fees.collect') || store.isRole('super-admin', 'accountant', 'principal', 'administrator', 'management');

      const node = detailPage({
        title: s.name,
        subtitle: `${s.className} · Section ${s.section} · Roll ${s.rollNo} · ${s.house} House · ${campusName(s.campusId)}`,
        route: 'students/profile',
        breadcrumb: breadcrumbFor('students/profile', s.name),
        initials: s.avatarInitials,
        badges: [
          Badge(s.status), Badge(s.feeStatus),
          Badge(`${pctText(s.attendancePct)} attendance`, { tone: s.attendancePct >= 85 ? 'success' : 'warning', icon: 'clipboard-check' }),
          s.transportOpted ? Badge('Transport', { tone: 'info', icon: 'bus' }) : null,
          s.hostelOpted ? Badge('Boarder', { tone: 'info', icon: 'bed' }) : null,
          s.rte ? Badge('RTE', { tone: 'brand', outline: true }) : null,
          s.scholarship ? Badge('Scholarship', { tone: 'brand', outline: true }) : null,
        ].filter(Boolean),
        meta: [
          { label: 'Admission no', value: s.admissionNo, icon: 'id-card' },
          { label: 'Admitted', value: formatDate(s.admissionDate), icon: 'calendar' },
          { label: 'CGPA', value: Number(s.cgpa).toFixed(2), icon: 'chart-line' },
          { label: 'Class rank', value: `#${s.rank}`, icon: 'medal' },
          { label: 'Fee due', value: money(s.feeDue), icon: 'wallet' },
          { label: 'Guardian', value: `${s.guardianName} · ${s.emergencyContact}`, icon: 'users' },
        ],
        actions: [
          MenuButton([
            { header: true, label: 'Records' },
            { label: 'Edit student', icon: 'edit', route: 'students/add' },
            { label: 'Documents', icon: 'folder', route: 'students/documents' },
            { label: 'Behaviour record', icon: 'alert-circle', route: 'students/behaviour' },
            { separator: true },
            { header: true, label: 'Movement' },
            { label: 'Promote', icon: 'trending-up', route: 'students/promote' },
            { label: 'Issue transfer certificate', icon: 'log-out', tone: 'danger', onClick: () => confirmTc(s) },
          ], { label: 'More actions' }),
          Button('Print ID', { variant: 'ghost', icon: 'id-card', onClick: () => printIdCard(s) }),
          Button('Issue certificate', { variant: 'ghost', icon: 'certificate', route: `students/certificates/${s.id}` }),
          Button('Mark attendance', { variant: 'secondary', icon: 'clipboard-check', route: 'attendance/mark-daily' }),
          canFees ? Button('Collect fee', { variant: 'secondary', icon: 'credit-card', route: 'fees/collection' }) : null,
          Button('Message parent', { variant: 'primary', icon: 'send', onClick: () => messageParent(s) }),
        ].filter(Boolean),
        tabs: [
          { id: 'overview', label: 'Overview', icon: 'dashboard', render: () => overviewTab(rec, ctx) },
          { id: 'personal', label: 'Personal', icon: 'user', render: () => personalTab(rec) },
          { id: 'family', label: 'Family', icon: 'users', count: rec.guardians.length + rec.siblings.length, render: () => familyTab(rec) },
          { id: 'academics', label: 'Academics', icon: 'book-open', count: rec.subjectScores.length, render: () => academicsTab(rec) },
          { id: 'attendance', label: 'Attendance', icon: 'clipboard-check', render: () => attendanceTab(rec) },
          { id: 'exams', label: 'Exams & Results', icon: 'file-text', render: () => examsTab(rec) },
          { id: 'fees', label: 'Fees', icon: 'wallet', count: rec.invoices.length, render: () => feesTab(rec) },
          { id: 'transport', label: 'Transport', icon: 'bus', render: () => transportTab(rec) },
          { id: 'hostel', label: 'Hostel', icon: 'bed', render: () => hostelTab(rec) },
          { id: 'library', label: 'Library', icon: 'library', count: rec.bookIssues.length, render: () => libraryTab(rec) },
          { id: 'health', label: 'Health', icon: 'stethoscope', render: () => healthTab(rec) },
          { id: 'behaviour', label: 'Behaviour', icon: 'alert-circle', render: () => behaviourTab(rec) },
          { id: 'activities', label: 'Activities & Awards', icon: 'trophy', count: rec.awards.length, render: () => activitiesTab(rec) },
          { id: 'documents', label: 'Documents', icon: 'folder', count: rec.documents.length, render: () => documentsTab(rec) },
          { id: 'timeline', label: 'Timeline', icon: 'history', render: () => timelineTab(rec) },
        ],
        activeTab: (ctx.query && ctx.query.tab) || 'overview',
        sidebar: profileSidebar(rec),
        timeline: rec.timeline.slice().reverse().slice(0, 6).map((e) => ({
          title: e.title, meta: formatDate(e.date), text: e.text, icon: e.icon,
          tone: e.tone === 'default' ? 'neutral' : e.tone,
        })),
      });
      mount.appendChild(node);
    },
  },
};

/* ------------------------------------------------- remaining student pages */

Object.assign(studentRoutes, {
  /* --------------------------------------------------------------- add --- */
  'students/add': {
    title: 'Add Student',
    subtitle: 'Create an admission record for the 2026-27 session',
    section: 'students',
    render(mount, ctx) {
      injectStyles();
      const cid = ctx.state.campusId;
      const classes = db.classes.filter((c) => CAMPUS_ALL.has(cid) || c.campusId === cid);
      const sections = db.sections.filter((c) => CAMPUS_ALL.has(cid) || c.campusId === cid);

      mount.appendChild(formPage({
        title: 'Add student',
        subtitle: 'Admission record · Springdale International · 2026-27',
        route: 'students/add',
        mode: 'page',
        submitLabel: 'Create student',
        values: { admissionDate: '2026-08-20', nationality: 'Indian', country: 'India', campus: cid },
        sections: [
          {
            title: 'Student details', description: 'Exactly as printed on the birth certificate.', cols: 2,
            fields: [
              { id: 'firstName', label: 'First name', required: true, placeholder: 'Aarav' },
              { id: 'lastName', label: 'Last name', required: true, placeholder: 'Sharma' },
              { id: 'dob', label: 'Date of birth', type: 'date', required: true },
              { id: 'gender', label: 'Gender', type: 'radio', inline: true, required: true, options: ['Male', 'Female', 'Other'] },
              { id: 'bloodGroup', label: 'Blood group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
              { id: 'category', label: 'Category', type: 'select', required: true, options: ['General', 'OBC', 'EWS', 'SC', 'ST'] },
              { id: 'religion', label: 'Religion', type: 'select', options: ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'] },
              { id: 'motherTongue', label: 'Mother tongue', type: 'select', options: ['Hindi', 'English', 'Punjabi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati'] },
              { id: 'nationality', label: 'Nationality' },
              { id: 'aadhaar', label: 'Aadhaar number', hint: 'Optional at admission, mandatory before the board registration.' },
            ],
          },
          {
            title: 'Academic allocation', description: 'Seat, section and house for the 2026-27 session.', cols: 2,
            fields: [
              { id: 'campus', label: 'Campus', type: 'select', required: true, options: db.campuses.map((c) => ({ value: c.id, label: c.name })) },
              { id: 'class', label: 'Class', type: 'combobox', required: true, options: classes.map((c) => ({ value: c.id, label: c.name })) },
              { id: 'section', label: 'Section', type: 'combobox', options: uniq(sections.map((x) => x.name)).sort().map((n) => ({ value: n, label: `Section ${n}` })) },
              { id: 'house', label: 'House', type: 'select', options: db.houses.map((x) => ({ value: x.id, label: `${x.name} — ${x.motto}` })) },
              { id: 'admissionDate', label: 'Admission date', type: 'date', required: true },
              { id: 'admissionType', label: 'Admission type', type: 'select', required: true, options: ['Regular', 'RTE', 'Sibling', 'Staff Ward'] },
              { id: 'optionals', label: 'Optional subjects', type: 'multiselect', options: db.subjects.filter((x) => x.type !== 'Core').map((x) => x.name) },
              { id: 'previousSchool', label: 'Previous school', placeholder: 'Name of the last school attended' },
            ],
          },
          {
            title: 'Parents & guardian', description: 'The primary guardian receives the parent portal login.', cols: 2,
            fields: [
              { id: 'fatherName', label: "Father's name", required: true },
              { id: 'fatherOccupation', label: "Father's occupation" },
              { id: 'motherName', label: "Mother's name", required: true },
              { id: 'motherOccupation', label: "Mother's occupation" },
              { id: 'guardianRelation', label: 'Primary guardian', type: 'select', required: true, options: ['Father', 'Mother', 'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Legal Guardian'] },
              { id: 'annualIncome', label: 'Annual family income', type: 'number', prefix: '₹', hint: 'Used only for EWS / scholarship eligibility.' },
              { id: 'guardianPhone', label: 'Guardian phone', type: 'tel', required: true, validate: validators.phone, placeholder: '+91 98xxx xxxxx' },
              { id: 'guardianEmail', label: 'Guardian email', type: 'email', validate: validators.email, placeholder: 'name@example.com' },
            ],
          },
          {
            title: 'Contact & address', cols: 2,
            fields: [
              { id: 'line1', label: 'Address line 1', required: true, span: 2 },
              { id: 'line2', label: 'Address line 2', span: 2 },
              { id: 'city', label: 'City', required: true },
              { id: 'state', label: 'State', type: 'select', options: ['Delhi', 'Haryana', 'Uttar Pradesh', 'Punjab', 'Rajasthan', 'Maharashtra', 'Karnataka'] },
              { id: 'pincode', label: 'PIN code', validate: validators.number },
              { id: 'emergency', label: 'Emergency contact', type: 'tel', required: true, validate: validators.phone },
            ],
          },
          {
            title: 'Facilities & documents', cols: 2,
            fields: [
              { id: 'transport', label: 'Transport', type: 'switch', switchLabel: 'Opt in to school transport', description: 'A route and stop can be allocated after admission.' },
              { id: 'hostel', label: 'Hostel', type: 'switch', switchLabel: 'Apply for hostel accommodation', description: 'Subject to bed availability in the requested block.' },
              { id: 'medical', label: 'Medical conditions / allergies', type: 'textarea', span: 'full', placeholder: 'Anything the infirmary must know on day one' },
              { id: 'docs', label: 'Supporting documents', type: 'file', span: 'full', hint: 'Birth certificate, Aadhaar, previous marksheet, transfer certificate, four photographs.' },
            ],
          },
        ],
        sidebar: [
          Callout({ tone: 'info', icon: 'info', title: 'Before you start' },
            'Fields marked * are mandatory. Documents can be uploaded later from the student’s document wallet, but the birth certificate is required before the admission is confirmed.'),
          SectionCard({ title: 'Admission checklist', icon: 'clipboard-check' },
            h('div', { className: 'stack-2' },
              ['Birth certificate', 'Aadhaar card', 'Previous marksheet', 'Transfer certificate', 'Four passport photographs', 'Address proof']
                .map((d) => Checkbox(d, { checked: false })))),
          SectionCard({ title: 'Seat availability', subtitle: 'Live capacity for this campus', icon: 'grid' },
            h('div', { className: 'stack-2' },
              analytics.enrolmentByClass.slice(0, 6).map((c) => MetricRow(c.className, formatNumber(c.value), 'enrolled')))),
        ],
        onSubmit: (values) => notify({
          title: 'Student created',
          text: `${values.firstName || ''} ${values.lastName || ''} added to the admission register. Demo only — nothing was persisted.`,
          tone: 'success',
          action: Button('View students', { variant: 'secondary', size: 'sm', icon: 'users', onClick: () => navigate('students/all') }),
        }),
        onCancel: () => navigate('students/all'),
      }));
    },
  },

  /* ----------------------------------------------------------- promote --- */
  'students/promote': {
    title: 'Promote Students',
    subtitle: 'Move a whole class into the next session in four steps',
    section: 'students',
    render(mount, ctx) {
      injectStyles();
      const all = scopedStudents(ctx).filter((s) => s.status === 'Active');
      const classNames = classOptions(all);
      const state = { from: classNames[0] || '', to: classNames[1] || '', section: 'all', table: null };

      const eligible = () => all.filter((s) => s.className === state.from && (state.section === 'all' || s.section === state.section))
        .map((s) => ({
          ...s,
          eligibility: s.attendancePct < 75 ? 'Attendance short' : s.feeDue > 0 ? 'Dues pending' : s.lastExamPercent < 33 ? 'Detained' : 'Eligible',
        }));

      const reviewTable = () => {
        const rows = eligible();
        const t = DataTable({
          columns: [
            { key: 'name', label: 'Student', sticky: true, width: 240, render: (r) => studentCell(r), value: (r) => r.name },
            { key: 'section', label: 'Section', width: 90, align: 'center', filter: true },
            { key: 'rollNo', label: 'Roll', width: 80, align: 'right', numeric: true },
            { key: 'attendancePct', label: 'Attendance', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => pctText(v), render: (r) => h('span', { className: r.attendancePct < 75 ? 't-danger t-num' : 't-num' }, pctText(r.attendancePct)) },
            { key: 'lastExamPercent', label: 'Last exam', width: 110, align: 'right', numeric: true, render: (r) => pctText(r.lastExamPercent) },
            { key: 'feeDue', label: 'Fee due', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => h('span', { className: r.feeDue > 0 ? 't-danger t-num' : 't-num t-muted' }, money(r.feeDue)) },
            { key: 'eligibility', label: 'Eligibility', width: 150, filter: true, render: (r) => Badge(r.eligibility === 'Eligible' ? 'Approved' : r.eligibility, { tone: r.eligibility === 'Eligible' ? 'success' : r.eligibility === 'Detained' ? 'danger' : 'warning' }) },
          ],
          rows, selectable: true, pageSize: 10, footerAggregates: true,
          searchKeys: ['name', 'admissionNo'], exportName: 'promotion-review',
          emptyState: EmptyState({ icon: 'users', title: 'No students in this class', text: 'Pick a different source class in step 1.' }),
        });
        state.table = t;
        return h('div', { className: 'stack-3' },
          Callout({ tone: 'warning', icon: 'alert-triangle', title: `${rows.filter((r) => r.eligibility !== 'Eligible').length} students need a decision` },
            'Students short on attendance, with pending dues or below the pass mark are flagged. Deselect anyone who should be retained in the current class.'),
          t);
      };

      const summary = () => {
        const rows = eligible();
        const selected = state.table ? state.table.getSelected() : rows;
        const list = selected.length ? selected : rows;
        return h('div', { className: 'stack-3' },
          kpiRow([
            { label: 'Students promoted', value: formatNumber(list.filter((r) => r.eligibility === 'Eligible').length), icon: 'trending-up', tone: 'success' },
            { label: 'Flagged for review', value: formatNumber(list.filter((r) => r.eligibility !== 'Eligible').length), icon: 'alert-circle', tone: 'warning' },
            { label: 'Dues carried forward', value: moneyK(sum(list, 'feeDue')), icon: 'wallet', tone: 'danger' },
            { label: 'Target class', value: state.to || '—', icon: 'grid', tone: 'brand' },
          ]),
          SectionCard({ title: 'What happens on confirm', icon: 'workflow' },
            Timeline([
              { title: 'Session roll-over', meta: 'Step 1 of 4', text: `${state.from} → ${state.to} for academic year 2027-28.`, icon: 'calendar', tone: 'brand' },
              { title: 'Roll numbers regenerated', meta: 'Step 2 of 4', text: 'Roll numbers are reissued alphabetically within each new section.', icon: 'sort-asc', tone: 'info' },
              { title: 'Fee structure applied', meta: 'Step 3 of 4', text: 'The published structure for the target class is billed from April.', icon: 'wallet', tone: 'warning' },
              { title: 'Guardians notified', meta: 'Step 4 of 4', text: 'A promotion letter is queued to every linked guardian.', icon: 'send', tone: 'success' },
            ])));
      };

      mount.appendChild(formPage({
        title: 'Promote students',
        subtitle: 'Bulk class promotion · academic year 2026-27 → 2027-28',
        route: 'students/promote',
        mode: 'wizard',
        submitLabel: 'Confirm promotion',
        values: { fromClass: state.from, toClass: state.to, targetYear: 'AY2027', strategy: 'Keep current section' },
        steps: [
          {
            id: 'source', label: 'Source & target', description: 'Pick the class to promote',
            sections: [{
              title: 'Promotion scope', description: 'Everything in the selected scope is reviewed in the next step.', cols: 2,
              fields: [
                { id: 'fromYear', label: 'From session', type: 'select', required: true, value: '2026-27', options: db.academicYears.map((y) => y.name) },
                { id: 'targetYear', label: 'To session', type: 'select', required: true, value: '2027-28', options: db.academicYears.map((y) => y.name) },
                { id: 'fromClass', label: 'From class', type: 'combobox', required: true, options: classNames, value: state.from, validate: (v) => (v ? null : 'Choose the class to promote') },
                { id: 'toClass', label: 'To class', type: 'combobox', required: true, options: classNames, value: state.to },
                { id: 'section', label: 'Sections', type: 'select', value: 'all', options: [{ value: 'all', label: 'All sections' }].concat(uniq(all.map((s) => s.section)).sort().map((x) => ({ value: x, label: `Section ${x}` }))) },
                { id: 'campus', label: 'Campus', type: 'select', value: ctx.state.campusId, options: db.campuses.map((c) => ({ value: c.id, label: c.name })) },
                {
                  id: 'note', type: 'custom', span: 'full', label: 'Scope summary',
                  render: (values) => {
                    state.from = values.fromClass || state.from;
                    state.to = values.toClass || state.to;
                    state.section = values.section || 'all';
                    return Callout({ tone: 'info', icon: 'info', title: 'Scope' },
                      `${formatNumber(all.filter((s) => s.className === state.from).length)} active students are currently in ${state.from || 'the selected class'}. They will be reviewed individually in the next step.`);
                  },
                },
              ],
            }],
          },
          {
            id: 'review', label: 'Review students', description: 'Confirm who moves up',
            sections: [{
              title: 'Eligibility review', description: 'Selection defaults to everyone; deselect any student who should be retained.',
              cols: 1, fields: [{ id: 'reviewTable', type: 'custom', span: 'full', label: 'Students', render: () => reviewTable() }],
            }],
          },
          {
            id: 'options', label: 'Options', description: 'Rules applied on promotion',
            sections: [{
              title: 'Promotion rules', cols: 2,
              fields: [
                { id: 'strategy', label: 'Section allocation', type: 'select', required: true, options: ['Keep current section', 'Rebalance alphabetically', 'Rebalance by performance', 'Assign manually later'] },
                { id: 'rollStrategy', label: 'Roll numbers', type: 'select', required: true, value: 'Regenerate alphabetically', options: ['Regenerate alphabetically', 'Carry forward existing', 'Regenerate by merit'] },
                { id: 'carryDues', label: 'Outstanding fees', type: 'switch', switchLabel: 'Carry pending dues into the new session', description: 'Recommended — the outstanding balance stays attached to the student ledger.' },
                { id: 'applyStructure', label: 'Fee structure', type: 'switch', switchLabel: 'Apply the target class fee structure', description: 'Bills the published 2027-28 structure from 1 April.' },
                { id: 'notify', label: 'Notification', type: 'switch', switchLabel: 'Notify guardians by SMS and email' },
                { id: 'archive', label: 'Archive', type: 'switch', switchLabel: 'Archive the current session report cards' },
                { id: 'remarks', label: 'Remarks for the promotion register', type: 'textarea', span: 'full' },
              ],
            }],
          },
          {
            id: 'confirm', label: 'Confirm', description: 'Review and run',
            sections: [{
              title: 'Ready to promote', cols: 1,
              fields: [{ id: 'summary', type: 'custom', span: 'full', label: 'Summary', render: () => summary() }],
            }],
          },
        ],
        onSubmit: () => {
          const list = state.table ? (state.table.getSelected().length ? state.table.getSelected() : state.table.getRows()) : [];
          notify({
            title: 'Promotion completed',
            text: `${formatNumber(list.length)} students moved from ${state.from} to ${state.to}. Demo only — nothing was persisted.`,
            tone: 'success',
            action: Button('Open student list', { variant: 'secondary', size: 'sm', icon: 'users', onClick: () => navigate('students/all') }),
          });
        },
        onCancel: () => navigate('students/all'),
      }));
    },
  },

  /* ---------------------------------------------------------- transfer --- */
  'students/transfer': {
    title: 'Transfer / TC',
    subtitle: 'Generate transfer certificates and track exits',
    section: 'students',
    render(mount, ctx) {
      injectStyles();
      const all = scopedStudents(ctx);
      const exited = all.filter((s) => s.status === 'Transferred' || s.status === 'Inactive');
      const active = all.filter((s) => s.status === 'Active');

      const form = {
        studentId: ctx.param || (active[0] && active[0].id) || '',
        reason: 'Parent relocation',
        lastDate: '2026-08-31',
        conduct: 'Excellent',
        duesCleared: true,
        remarks: '',
      };

      const previewHost = h('div');
      const paintPreview = () => {
        const s = byId(db.students, form.studentId);
        previewHost.innerHTML = '';
        if (!s) {
          previewHost.appendChild(EmptyState({ icon: 'search', title: 'Pick a student', text: 'Choose a student on the left to see the transfer certificate preview.' }));
          return;
        }
        const tcNo = `SIG/TC/2026/${String(hash(s.id) % 9000 + 1000)}`;
        previewHost.appendChild(h('div', { className: 'cert' },
          h('div', { className: 'cert-head' },
            h('div', { className: 't-eyebrow' }, 'Springdale International School Group'),
            h('div', { className: 'cert-title' }, 'Transfer Certificate'),
            h('div', { className: 't-sm t-muted' }, `${campusName(s.campusId)} · CBSE Affiliation 2130456 · TC No. ${tcNo}`)),
          h('div', { className: 'cert-body' },
            'This is to certify that ', h('b', null, s.name), ', ',
            s.gender === 'Female' ? 'daughter' : 'son', ' of ', h('b', null, s.fatherName), ' and ',
            h('b', null, s.motherName), ', bearing admission number ', h('b', null, s.admissionNo),
            ', was a bona fide student of this school and studied in ', h('b', null, `${s.className}, Section ${s.section}`),
            ' during the academic session 2026-27. ',
            'The student was admitted on ', h('b', null, formatDate(s.admissionDate)),
            ' and the last date of attendance was ', h('b', null, formatDate(form.lastDate)), '. ',
            'Attendance during the session stood at ', h('b', null, pctText(s.attendancePct)), '. ',
            'Conduct and character during the period of study were ', h('b', null, String(form.conduct).toLowerCase()), '. ',
            form.duesCleared ? 'All school dues have been cleared. ' : h('b', { className: 't-danger' }, `Dues of ${money(s.feeDue)} remain outstanding. `),
            'The certificate is issued on the request of the parent for the reason: ', h('b', null, form.reason), '.',
            form.remarks ? h('div', { className: 'mt-3' }, h('b', null, 'Remarks: '), form.remarks) : null),
          h('div', { className: 'cert-sign' },
            h('div', null, 'Class Teacher'),
            h('div', null, h('div', { className: 'cert-seal' }, 'School Seal')),
            h('div', null, 'Principal')),
          h('div', { className: 'mt-4 t-xs t-muted t-center' }, `Issued at ${campusName(s.campusId)} on ${formatDate('2026-08-20')}`)));
      };
      paintPreview();

      const studentPicker = Combobox({
        options: active.map((s) => ({ value: s.id, label: `${s.name} · ${s.admissionNo} · ${s.className}-${s.section}` })),
        value: form.studentId, placeholder: 'Search by name or admission number…',
        onChange: (v) => { form.studentId = v; paintPreview(); },
      });

      const left = SectionCard({ title: 'Transfer certificate request', subtitle: 'Fields marked * are printed on the certificate', icon: 'log-out' },
        h('div', { className: 'stack-4' },
          Field({ label: 'Student', required: true }, studentPicker),
          FormGrid({ cols: 2 },
            Field({ label: 'Reason for leaving', required: true },
              Select({
                options: ['Parent relocation', 'Transfer to another board', 'Higher studies abroad', 'Financial reasons', 'Medical reasons', 'Disciplinary action', 'Other'],
                value: form.reason, onChange: (v) => { form.reason = v; paintPreview(); },
              })),
            Field({ label: 'Last date of attendance', required: true },
              DatePicker({ value: form.lastDate, width: '100%', onChange: (v) => { form.lastDate = v; paintPreview(); } })),
            Field({ label: 'Conduct' },
              Select({ options: ['Excellent', 'Very good', 'Good', 'Satisfactory'], value: form.conduct, onChange: (v) => { form.conduct = v; paintPreview(); } })),
            Field({ label: 'Dues' },
              Switch('All dues cleared', { checked: form.duesCleared, onChange: (v) => { form.duesCleared = v; paintPreview(); } }))),
          Field({ label: 'Remarks', hint: 'Printed under the certificate body when filled.' },
            Textarea({ rows: 3, onInput: (v) => { form.remarks = v; paintPreview(); } })),
          Callout({ tone: 'warning', icon: 'alert-triangle', title: 'Issuing a TC deactivates the student' },
            'The seat is released, the transport and hostel allocations are freed and the library card is closed. Pending dues are moved to the recovery register.'),
          FormActions(
            Button('Issue certificate', {
              variant: 'danger', icon: 'log-out',
              onClick: () => {
                const s = byId(db.students, form.studentId);
                if (!s) { notify({ title: 'Select a student first', tone: 'warning' }); return; }
                ConfirmDialog({
                  title: `Issue a TC for ${s.name}?`,
                  text: 'This marks the student inactive and releases the seat. This cannot be undone in the prototype.',
                  confirmLabel: 'Issue TC', tone: 'danger', icon: 'log-out',
                }).then((ok) => ok && notify({ title: 'Transfer certificate issued', text: `${s.name} · ${s.className}-${s.section}`, tone: 'success' }));
              },
            }),
            Button('Print preview', { variant: 'secondary', icon: 'print', onClick: () => printNode(previewHost, 'Transfer Certificate') }),
            Button('Save draft', { variant: 'ghost', icon: 'edit', onClick: mockAction('Save TC draft') }))));

      const right = SectionCard({
        title: 'Live preview', subtitle: 'Exactly what is printed on the school letterhead', icon: 'file-text',
        actions: Button('Download PDF', { variant: 'secondary', size: 'sm', icon: 'download', onClick: () => notify({ title: 'Certificate downloaded', tone: 'success' }) }),
      }, previewHost);

      const register = DataTable({
        columns: [
          { key: 'name', label: 'Student', sticky: true, width: 250, render: (r) => studentCell(r), value: (r) => r.name },
          { key: 'admissionNo', label: 'Admission no', width: 140 },
          { key: 'className', label: 'Class', width: 110, filter: true },
          { key: 'section', label: 'Section', width: 90, align: 'center' },
          { key: 'admissionDate', label: 'Admitted', width: 130, render: (r) => formatDate(r.admissionDate), value: (r) => r.admissionDate },
          { key: 'feeDue', label: 'Dues at exit', width: 140, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.feeDue) },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: exited, pageSize: 10, footerAggregates: true, exportName: 'transfer-register',
        searchKeys: ['name', 'admissionNo', 'className'],
        onRowClick: (r) => goStudent(r.id),
        rowActions: (r) => [
          { label: 'Reprint TC', icon: 'print', onClick: () => notify({ title: 'TC reprinted', text: r.name, tone: 'info' }) },
          { label: 'Open profile', icon: 'id-card', route: `students/profile/${r.id}` },
        ],
        emptyState: EmptyState({ icon: 'log-out', title: 'No exits recorded', text: 'Transfer certificates issued this session will appear here.' }),
      });

      mount.appendChild(page({
        title: 'Transfer / TC',
        subtitle: `${formatNumber(exited.length)} exits recorded · ${scopeLabel(ctx)}`,
        route: 'students/transfer',
        actions: [
          Button('Exit report', { variant: 'secondary', icon: 'chart-bar', route: 'students/reports' }),
          Button('Bulk TC', { variant: 'primary', icon: 'layers', onClick: mockAction('Bulk transfer certificates') }),
        ],
        children: [
          kpiRow([
            { label: 'Active students', value: formatNumber(active.length), icon: 'graduation-cap', tone: 'brand' },
            { label: 'Exits this session', value: formatNumber(exited.length), icon: 'log-out', tone: 'warning' },
            { label: 'Dues at exit', value: moneyK(sum(exited, 'feeDue')), icon: 'wallet', tone: 'danger' },
            { label: 'Alumni converted', value: formatNumber(all.filter((s) => s.status === 'Alumni').length), icon: 'award', tone: 'success' },
          ]),
          h('div', { className: 'detail-split' }, h('div', { className: 'stack' }, left), h('div', { className: 'stack' }, right)),
          SectionCard({ title: 'Exit register', subtitle: 'Every student who has left the school', icon: 'table', flush: true }, register),
        ],
      }));
    },
  },

  /* ---------------------------------------------------------- id cards --- */
  'students/id-cards': {
    title: 'ID Cards',
    subtitle: 'Design, preview and print student identity cards',
    section: 'students',
    render(mount, ctx) {
      injectStyles();
      const all = scopedStudents(ctx).filter((s) => s.status === 'Active');
      const opts = { theme: 'brand', photo: true, blood: true, address: true, guardian: true, barcode: true, validity: '31 Mar 2027' };
      const sel = { className: 'all', section: 'all', house: 'all', count: 8 };

      const previewHost = h('div', { className: 'idc-grid' });
      const countLabel = h('div', { className: 't-sm t-muted' });

      const batch = () => all.filter((s) => (sel.className === 'all' || s.className === sel.className)
        && (sel.section === 'all' || s.section === sel.section)
        && (sel.house === 'all' || s.house === sel.house));

      const paint = () => {
        const rows = batch();
        previewHost.innerHTML = '';
        if (!rows.length) {
          previewHost.appendChild(EmptyState({ icon: 'id-card', title: 'No students in this batch', text: 'Widen the class, section or house filter to build a print batch.' }));
        } else {
          for (const s of rows.slice(0, sel.count)) previewHost.appendChild(idCardNode(s, opts));
        }
        countLabel.textContent = `${formatNumber(rows.length)} cards in this batch · showing ${Math.min(rows.length, sel.count)}`;
      };
      paint();

      const designer = SectionCard({ title: 'Card design', subtitle: 'Changes apply to the live preview instantly', icon: 'palette' },
        h('div', { className: 'stack-4' },
          Field({ label: 'Template accent' },
            h('div', { className: 'row row-wrap' },
              ID_THEMES.map((t) => h('button', {
                className: 'pick-item', type: 'button', style: { width: 'auto' },
                attrs: { 'aria-pressed': String(opts.theme === t.id), 'aria-label': t.label },
                onClick: (e) => {
                  opts.theme = t.id; paint();
                  e.currentTarget.parentNode.querySelectorAll('.pick-item').forEach((b) => b.setAttribute('aria-pressed', 'false'));
                  e.currentTarget.setAttribute('aria-pressed', 'true');
                },
              }, h('span', { style: { width: '16px', height: '16px', borderRadius: 'var(--r-full)', background: t.color, display: 'inline-block' } }),
                h('span', { className: 't-sm' }, t.label))))),
          Divider({ label: 'Fields on the card' }),
          h('div', { className: 'stack-2' },
            Switch('Student photograph', { checked: opts.photo, onChange: (v) => { opts.photo = v; paint(); } }),
            Switch('Blood group', { checked: opts.blood, onChange: (v) => { opts.blood = v; paint(); } }),
            Switch('Guardian name', { checked: opts.guardian, onChange: (v) => { opts.guardian = v; paint(); } }),
            Switch('City & state', { checked: opts.address, onChange: (v) => { opts.address = v; paint(); } }),
            Switch('Barcode and QR strip', { checked: opts.barcode, onChange: (v) => { opts.barcode = v; paint(); } })),
          Field({ label: 'Valid till' },
            Input({ value: opts.validity, onInput: (v) => { opts.validity = v; paint(); } })),
          Divider({ label: 'Print batch' }),
          FormGrid({ cols: 2 },
            Field({ label: 'Class' }, Select({
              options: [{ value: 'all', label: 'All classes' }].concat(classOptions(all).map((c) => ({ value: c, label: c }))),
              value: 'all', onChange: (v) => { sel.className = v; paint(); },
            })),
            Field({ label: 'Section' }, Select({
              options: [{ value: 'all', label: 'All sections' }].concat(uniq(all.map((s) => s.section)).sort().map((x) => ({ value: x, label: `Section ${x}` }))),
              value: 'all', onChange: (v) => { sel.section = v; paint(); },
            })),
            Field({ label: 'House' }, Select({
              options: [{ value: 'all', label: 'All houses' }].concat(db.houses.map((x) => ({ value: x.name, label: x.name }))),
              value: 'all', onChange: (v) => { sel.house = v; paint(); },
            })),
            Field({ label: 'Preview cards' }, Select({
              options: ['4', '8', '12', '24'].map((n) => ({ value: n, label: `${n} cards` })),
              value: '8', onChange: (v) => { sel.count = Number(v); paint(); },
            }))),
          FormActions(
            Button('Print batch', {
              variant: 'primary', icon: 'print',
              onClick: () => {
                const rows = batch();
                if (!rows.length) { notify({ title: 'Nothing to print', tone: 'warning' }); return; }
                const node = h('div', { className: 'idc-grid' }, rows.slice(0, 60).map((s) => idCardNode(s, opts)));
                printNode(node, 'Student ID cards');
              },
            }),
            Button('Export batch list', {
              variant: 'secondary', icon: 'download',
              onClick: () => { download('id-card-batch.csv', toCsv(batch(), [{ key: 'admissionNo', label: 'Admission no' }, { key: 'name', label: 'Name' }, { key: 'className', label: 'Class' }, { key: 'section', label: 'Section' }, { key: 'house', label: 'House' }, { key: 'bloodGroup', label: 'Blood group' }]), 'text/csv;charset=utf-8'); notify({ title: 'Batch list exported', tone: 'success' }); },
            }))));

      mount.appendChild(page({
        title: 'ID Cards',
        subtitle: `Designer and print queue · ${scopeLabel(ctx)}`,
        route: 'students/id-cards',
        actions: [
          Button('Card stock & printers', { variant: 'ghost', icon: 'settings', onClick: mockAction('Printer settings') }),
          Button('Print batch', { variant: 'primary', icon: 'print', onClick: () => printNode(previewHost, 'Student ID cards') }),
        ],
        children: [
          kpiRow([
            { label: 'Active students', value: formatNumber(all.length), icon: 'graduation-cap', tone: 'brand' },
            { label: 'Cards in batch', value: formatNumber(batch().length), icon: 'id-card', tone: 'info' },
            { label: 'Templates', value: String(ID_THEMES.length), icon: 'palette', tone: 'success' },
            { label: 'Card validity', value: '31 Mar 2027', icon: 'calendar', tone: 'warning' },
          ]),
          h('div', { className: 'detail-split' },
            h('div', { className: 'stack' },
              SectionCard({ title: 'Live preview', subtitle: 'CR-80 card, 54 × 86 mm, printed both sides', icon: 'eye', actions: countLabel },
                previewHost)),
            h('div', { className: 'stack' }, designer)),
        ],
      }));
    },
  },

  /* ------------------------------------------------------ certificates --- */
  'students/certificates': {
    title: 'Certificates',
    subtitle: 'Bonafide, character, conduct and achievement certificates',
    section: 'students',
    render(mount, ctx) {
      injectStyles();
      const all = scopedStudents(ctx);
      const TYPES = [
        { id: 'bonafide', label: 'Bonafide Certificate', icon: 'certificate', text: (s) => `is a bona fide student of this school, currently studying in ${s.className}, Section ${s.section}, during the academic session 2026-27.` },
        { id: 'character', label: 'Character Certificate', icon: 'shield-check', text: (s) => `bore a good moral character throughout ${s.gender === 'Female' ? 'her' : 'his'} stay at this institution and was never subject to any disciplinary proceeding.` },
        { id: 'conduct', label: 'Conduct Certificate', icon: 'smile', text: (s) => `maintained a conduct rating of ${s.behaviourScore}/100 and an attendance of ${pctText(s.attendancePct)} during the current session.` },
        { id: 'study', label: 'Study Certificate', icon: 'book-open', text: (s) => `has studied in this school since ${formatDate(s.admissionDate)} and is presently enrolled in ${s.className}.` },
        { id: 'achievement', label: 'Achievement Certificate', icon: 'award', text: (s) => `has been recognised for outstanding achievement, holding ${s.awardsCount} school award(s) and rank ${s.rank} in class.` },
      ];
      const form = { type: 'bonafide', studentId: ctx.param || (all[0] && all[0].id) || '', purpose: 'Passport application', date: '2026-08-20' };

      const previewHost = h('div');
      const paint = () => {
        const s = byId(db.students, form.studentId);
        const type = TYPES.find((t) => t.id === form.type) || TYPES[0];
        previewHost.innerHTML = '';
        if (!s) { previewHost.appendChild(EmptyState({ icon: 'search', title: 'Pick a student', text: 'Select a student to preview the certificate.' })); return; }
        previewHost.appendChild(h('div', { className: 'cert' },
          h('div', { className: 'cert-head' },
            h('div', { className: 't-eyebrow' }, 'Springdale International School Group'),
            h('div', { className: 'cert-title' }, type.label),
            h('div', { className: 't-sm t-muted' }, `${campusName(s.campusId)} · Ref SIG/${type.id.toUpperCase()}/${hash(s.id + type.id) % 9000 + 1000}`)),
          h('div', { className: 'cert-body' },
            'This is to certify that ', h('b', null, s.name), ', ',
            s.gender === 'Female' ? 'daughter' : 'son', ' of ', h('b', null, s.fatherName),
            ', bearing admission number ', h('b', null, s.admissionNo), ', ', type.text(s),
            h('div', { className: 'mt-3' }, 'This certificate is issued for the purpose of ', h('b', null, form.purpose), '.')),
          h('div', { className: 'cert-sign' },
            h('div', null, `Date: ${formatDate(form.date)}`),
            h('div', null, h('div', { className: 'cert-seal' }, 'School Seal')),
            h('div', null, 'Principal'))));
      };
      paint();

      const issued = db.awards.filter((a) => all.some((s) => s.id === a.studentId));

      mount.appendChild(page({
        title: 'Certificates',
        subtitle: `${formatNumber(issued.length)} certificates issued this session · ${scopeLabel(ctx)}`,
        route: 'students/certificates',
        actions: [
          Button('Bulk generate', { variant: 'secondary', icon: 'layers', onClick: mockAction('Bulk certificate generation') }),
          Button('Print', { variant: 'primary', icon: 'print', onClick: () => printNode(previewHost, 'Certificate') }),
        ],
        children: [
          kpiRow([
            { label: 'Certificate types', value: String(TYPES.length), icon: 'certificate', tone: 'brand' },
            { label: 'Issued this session', value: formatNumber(issued.length), icon: 'award', tone: 'success' },
            { label: 'Awaiting signature', value: formatNumber(Math.round(issued.length * 0.08)), icon: 'stamp', tone: 'warning' },
            { label: 'Students eligible', value: formatNumber(all.filter((s) => s.status === 'Active').length), icon: 'graduation-cap', tone: 'info' },
          ]),
          h('div', { className: 'detail-split' },
            h('div', { className: 'stack' },
              SectionCard({ title: 'Generate a certificate', icon: 'edit' },
                h('div', { className: 'stack-4' },
                  Field({ label: 'Certificate type', required: true },
                    h('div', { className: 'stack-1' }, TYPES.map((t) => h('button', {
                      className: 'pick-item', type: 'button',
                      attrs: { 'aria-pressed': String(form.type === t.id) },
                      onClick: (e) => {
                        form.type = t.id; paint();
                        const box = e.currentTarget.parentNode;
                        box.querySelectorAll('.pick-item').forEach((b) => b.setAttribute('aria-pressed', 'false'));
                        e.currentTarget.setAttribute('aria-pressed', 'true');
                      },
                    }, Icon(t.icon, 16), h('span', { className: 't-sm t-medium' }, t.label))))),
                  Field({ label: 'Student', required: true },
                    Combobox({
                      options: all.map((s) => ({ value: s.id, label: `${s.name} · ${s.admissionNo} · ${s.className}-${s.section}` })),
                      value: form.studentId, placeholder: 'Search by name or admission number…',
                      onChange: (v) => { form.studentId = v; paint(); },
                    })),
                  FormGrid({ cols: 2 },
                    Field({ label: 'Purpose', required: true },
                      Select({
                        options: ['Passport application', 'Bank account opening', 'Scholarship application', 'Visa application', 'Competition entry', 'Address proof', 'Other'],
                        value: form.purpose, onChange: (v) => { form.purpose = v; paint(); },
                      })),
                    Field({ label: 'Issue date', required: true },
                      DatePicker({ value: form.date, width: '100%', onChange: (v) => { form.date = v; paint(); } }))),
                  FormActions(
                    Button('Issue certificate', {
                      variant: 'primary', icon: 'certificate',
                      onClick: () => {
                        const s = byId(db.students, form.studentId);
                        if (!s) { notify({ title: 'Select a student first', tone: 'warning' }); return; }
                        notify({ title: 'Certificate issued', text: `${(TYPES.find((t) => t.id === form.type) || {}).label} · ${s.name}`, tone: 'success' });
                      },
                    }),
                    Button('Download PDF', { variant: 'secondary', icon: 'download', onClick: () => notify({ title: 'Certificate downloaded', tone: 'success' }) }),
                    Button('Email to guardian', { variant: 'ghost', icon: 'mail', onClick: () => notify({ title: 'Certificate emailed to the guardian', tone: 'success' }) }))))),
            h('div', { className: 'stack' },
              SectionCard({ title: 'Live preview', subtitle: 'Printed on the school letterhead', icon: 'eye' }, previewHost))),
          SectionCard({ title: 'Certificate register', subtitle: 'Achievement certificates recorded against students', icon: 'table', flush: true },
            DataTable({
              columns: [
                { key: 'certificateNo', label: 'Certificate no', width: 160, sticky: true },
                { key: 'studentName', label: 'Student', width: 220, render: (r) => Identity(r.studentName, r.className, { onClick: () => goStudent(r.studentId) }), value: (r) => r.studentName },
                { key: 'title', label: 'Title', width: 240 },
                { key: 'category', label: 'Category', width: 150, filter: true },
                { key: 'level', label: 'Level', width: 140, filter: true, render: (r) => Badge(r.level, { tone: 'brand', outline: true }) },
                { key: 'date', label: 'Issued', width: 130, render: (r) => formatDate(r.date), value: (r) => r.date },
                { key: 'awardedBy', label: 'Signed by', width: 190 },
              ],
              rows: issued, pageSize: 15, exportName: 'certificate-register',
              searchKeys: ['studentName', 'title', 'certificateNo'],
              rowActions: (r) => [
                { label: 'Reprint', icon: 'print', onClick: () => notify({ title: 'Certificate reprinted', text: r.certificateNo, tone: 'info' }) },
                { label: 'Open student', icon: 'id-card', route: `students/profile/${r.studentId}` },
              ],
              emptyState: EmptyState({ icon: 'certificate', title: 'No certificates issued yet' }),
            })),
        ],
      }));
    },
  },

  /* ---------------------------------------------------------- siblings --- */
  'students/siblings': {
    title: 'Siblings',
    subtitle: 'Families with more than one child enrolled',
    section: 'students',
    render(mount, ctx) {
      injectStyles();
      const all = scopedStudents(ctx);
      const index = new Map(all.map((s) => [s.id, s]));
      const seen = new Set();
      const families = [];
      for (const s of all) {
        if (seen.has(s.id) || !s.siblingIds.length) continue;
        const members = [s].concat(s.siblingIds.map((id) => index.get(id)).filter(Boolean));
        for (const m of members) seen.add(m.id);
        if (members.length < 2) continue;
        families.push({
          id: `FAM-${s.id}`,
          family: s.lastName || s.name.split(' ').slice(-1)[0],
          guardian: s.fatherName,
          phone: s.emergencyContact,
          children: members.length,
          members,
          classes: members.map((m) => `${m.className}-${m.section}`).join(', '),
          feeTotal: sum(members, 'feeTotal'),
          feeDue: sum(members, 'feeDue'),
          attendance: avg(members, 'attendancePct'),
          discountEligible: members.length >= 2,
        });
      }
      const sorted = sortBy(families, 'children', 'desc');
      const sizeSplit = countBy(families.map((f) => ({ size: `${f.children} children` })), 'size');

      mount.appendChild(listPage({
        title: 'Siblings',
        subtitle: `${formatNumber(families.length)} families with siblings · ${scopeLabel(ctx)}`,
        route: 'students/siblings',
        actions: [
          Button('Fee discounts', { variant: 'secondary', icon: 'percent', route: 'fees/discounts' }),
          Button('Link a sibling', { variant: 'primary', icon: 'link', route: 'parents/link-children' }),
        ],
        kpis: [
          { label: 'Families with siblings', value: formatNumber(families.length), icon: 'users', tone: 'brand' },
          { label: 'Students involved', value: formatNumber(sum(families, 'children')), icon: 'graduation-cap', tone: 'info' },
          { label: 'Sibling discount value', value: moneyK(sum(families, 'feeTotal') * 0.05), deltaLabel: '5% of family billing', icon: 'percent', tone: 'success' },
          { label: 'Family dues', value: moneyK(sum(families, 'feeDue')), icon: 'wallet', tone: 'danger' },
        ],
        chart: barChart({
          categories: sizeSplit.map((x) => x.key),
          series: [{ name: 'Families', values: sizeSplit.map((x) => x.value) }],
          height: 200, showValues: true, title: 'Families by number of children',
        }),
        chartTitle: 'Families by number of children enrolled',
        columns: [
          { key: 'family', label: 'Family', sticky: true, width: 180, render: (r) => Identity(`${r.family} family`, `${r.children} children`), value: (r) => r.family },
          { key: 'guardian', label: 'Guardian', width: 200 },
          { key: 'phone', label: 'Contact', width: 160 },
          { key: 'children', label: 'Children', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'classes', label: 'Classes', width: 220 },
          { key: 'attendance', label: 'Avg attendance', width: 150, align: 'right', numeric: true, aggregate: 'avg', format: (v) => pctText(v), render: (r) => pctText(r.attendance) },
          { key: 'feeTotal', label: 'Family billing', width: 150, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.feeTotal) },
          { key: 'feeDue', label: 'Family dues', width: 140, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => h('span', { className: r.feeDue > 0 ? 't-danger t-num' : 't-num t-muted' }, money(r.feeDue)) },
          { key: 'discountEligible', label: 'Discount', width: 130, render: (r) => Badge(r.discountEligible ? 'Approved' : 'Pending') },
        ],
        rows: sorted,
        footerAggregates: true,
        selectable: true,
        pageSize: 25,
        searchKeys: ['family', 'guardian', 'classes'],
        exportName: 'sibling-families',
        bulkActions: [
          { label: 'Apply sibling discount', icon: 'percent', onClick: (sel) => notify({ title: `Sibling discount applied to ${sel.length} families`, tone: 'success' }) },
          { label: 'Message guardians', icon: 'send', onClick: (sel) => notify({ title: `Message queued for ${sel.length} families`, tone: 'info' }) },
        ],
        expandable: (r) => Card({ pad: true },
          h('div', { className: 'stack-2' },
            h('div', { className: 't-eyebrow' }, 'Children enrolled'),
            DataTable({
              columns: [
                { key: 'name', label: 'Student', render: (x) => studentCell(x), value: (x) => x.name },
                { key: 'className', label: 'Class', width: 110 },
                { key: 'section', label: 'Section', width: 90, align: 'center' },
                { key: 'house', label: 'House', width: 110 },
                { key: 'attendancePct', label: 'Attendance', width: 120, align: 'right', numeric: true, render: (x) => pctText(x.attendancePct) },
                { key: 'feeDue', label: 'Fee due', width: 130, align: 'right', numeric: true, render: (x) => money(x.feeDue) },
              ],
              rows: r.members, paginate: false, searchable: false, columnToggle: false, exportable: false,
              onRowClick: (x) => goStudent(x.id),
            }))),
        emptyState: EmptyState({ icon: 'users', title: 'No sibling families found', text: 'Sibling links are created from the admission form or from the parent linking screen.' }),
      }));
    },
  },

  /* -------------------------------------------------- categories & houses */
  'students/categories': {
    title: 'Categories & Houses',
    subtitle: 'Reservation categories, houses and demographic mix',
    section: 'students',
    render(mount, ctx) {
      injectStyles();
      const all = scopedStudents(ctx);
      const houseRows = db.houses.map((hs) => {
        const members = all.filter((s) => s.houseId === hs.id);
        const awards = db.awards.filter((a) => a.house === hs.name);
        return {
          id: hs.id, name: hs.name, colour: hs.colour, motto: hs.motto, points: hs.points,
          students: members.length, attendance: members.length ? avg(members, 'attendancePct') : 0,
          cgpa: members.length ? avg(members, 'cgpa') : 0, awards: awards.length,
          awardPoints: sum(awards, 'points'),
        };
      });
      const catRows = uniq(all.map((s) => s.category)).map((c) => {
        const members = all.filter((s) => s.category === c);
        return {
          id: c, category: c, students: members.length,
          share: all.length ? (members.length / all.length) * 100 : 0,
          rte: members.filter((s) => s.rte).length,
          scholarship: members.filter((s) => s.scholarship).length,
          attendance: avg(members, 'attendancePct'), cgpa: avg(members, 'cgpa'),
          feeDue: sum(members, 'feeDue'),
        };
      }).sort((a, b) => b.students - a.students);

      mount.appendChild(page({
        title: 'Categories & Houses',
        subtitle: `Demographic and house composition · ${scopeLabel(ctx)}`,
        route: 'students/categories',
        actions: [
          Button('House points ledger', { variant: 'secondary', icon: 'flag', route: 'activities/houses' }),
          Button('Export composition', {
            variant: 'primary', icon: 'download',
            onClick: () => { download('student-composition.csv', toCsv(catRows, [{ key: 'category', label: 'Category' }, { key: 'students', label: 'Students' }, { key: 'rte', label: 'RTE' }, { key: 'scholarship', label: 'Scholarship' }]), 'text/csv;charset=utf-8'); notify({ title: 'Composition exported', tone: 'success' }); },
          }),
        ],
        children: [
          kpiRow([
            { label: 'Students', value: formatNumber(all.length), icon: 'graduation-cap', tone: 'brand' },
            { label: 'RTE quota', value: formatNumber(all.filter((s) => s.rte).length), deltaLabel: `${((all.filter((s) => s.rte).length / Math.max(1, all.length)) * 100).toFixed(1)}% of strength`, icon: 'shield', tone: 'info' },
            { label: 'Scholarship holders', value: formatNumber(all.filter((s) => s.scholarship).length), icon: 'award', tone: 'success' },
            { label: 'Houses', value: String(db.houses.length), deltaLabel: `${formatNumber(sum(houseRows, 'points'))} points awarded`, icon: 'flag', tone: 'warning' },
          ]),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-4' },
              SectionCard({ title: 'Category split', className: 'chart-card', icon: 'chart-pie' },
                donutChart({ data: analytics.categorySplit, height: 250, centerLabel: 'Students', centerValue: formatNumber(all.length), title: 'Category split' }))),
            h('div', { className: 'span-4' },
              SectionCard({ title: 'House split', className: 'chart-card', icon: 'flag' },
                donutChart({ data: analytics.houseSplit, height: 250, centerLabel: 'Houses', centerValue: String(db.houses.length), title: 'House split' }))),
            h('div', { className: 'span-4' },
              SectionCard({ title: 'Gender split', className: 'chart-card', icon: 'users' },
                pieChart({ data: analytics.genderSplit, height: 250, title: 'Gender split' }))),
            h('div', { className: 'span-6' },
              SectionCard({ title: 'Religion mix', className: 'chart-card', icon: 'chart-bar' },
                barChart({
                  categories: analytics.religionSplit.map((x) => x.key),
                  series: [{ name: 'Students', values: analytics.religionSplit.map((x) => x.value) }],
                  horizontal: true, showValues: true, height: 260, title: 'Religion mix',
                }))),
            h('div', { className: 'span-6' },
              SectionCard({ title: 'House points standing', className: 'chart-card', icon: 'trophy' },
                barChart({
                  categories: houseRows.map((x) => x.name),
                  series: [
                    { name: 'House points', values: houseRows.map((x) => x.points) },
                    { name: 'Award points', values: houseRows.map((x) => x.awardPoints) },
                  ],
                  height: 260, title: 'House points standing',
                })))),
          SectionCard({ title: 'Houses', subtitle: 'Membership, performance and points', icon: 'flag', flush: true },
            DataTable({
              columns: [
                { key: 'name', label: 'House', sticky: true, width: 170, render: (r) => Identity(r.name, r.motto), value: (r) => r.name },
                { key: 'students', label: 'Students', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'attendance', label: 'Avg attendance', width: 150, align: 'right', numeric: true, aggregate: 'avg', format: (v) => pctText(v), render: (r) => pctText(r.attendance) },
                { key: 'cgpa', label: 'Avg CGPA', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => Number(v).toFixed(2), render: (r) => Number(r.cgpa).toFixed(2) },
                { key: 'awards', label: 'Awards', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'points', label: 'House points', width: 140, align: 'right', numeric: true, aggregate: 'sum', format: (v) => formatNumber(v) },
                {
                  key: 'standing', label: 'Standing', width: 180, sortable: false,
                  render: (r) => ProgressBar(r.points, { max: Math.max(...houseRows.map((x) => x.points)), tone: 'brand', size: 'sm' }),
                },
              ],
              rows: houseRows, paginate: false, footerAggregates: true, searchable: false,
              onRowClick: (r) => navigate('students/all', { house: r.name }),
              rowActions: (r) => [
                { label: 'View house members', icon: 'users', onClick: () => navigate('students/all', { house: r.name }) },
                { label: 'Open activities', icon: 'trophy', route: 'activities/houses' },
              ],
            })),
          SectionCard({ title: 'Categories', subtitle: 'Reservation category composition and outcomes', icon: 'layers', flush: true },
            DataTable({
              columns: [
                { key: 'category', label: 'Category', sticky: true, width: 150, render: (r) => Badge(r.category, { tone: 'neutral', dot: true }) },
                { key: 'students', label: 'Students', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'share', label: 'Share', width: 120, align: 'right', numeric: true, render: (r) => pctText(r.share) },
                { key: 'rte', label: 'RTE', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'scholarship', label: 'Scholarship', width: 140, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'attendance', label: 'Avg attendance', width: 150, align: 'right', numeric: true, aggregate: 'avg', format: (v) => pctText(v), render: (r) => pctText(r.attendance) },
                { key: 'cgpa', label: 'Avg CGPA', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => Number(v).toFixed(2), render: (r) => Number(r.cgpa).toFixed(2) },
                { key: 'feeDue', label: 'Fee due', width: 140, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.feeDue) },
              ],
              rows: catRows, paginate: false, footerAggregates: true, searchable: false,
              onRowClick: (r) => navigate('students/all', { category: r.category }),
            })),
        ],
      }));
    },
  },

  /* --------------------------------------------------------- documents --- */
  'students/documents': {
    title: 'Documents',
    subtitle: 'Verification status of every student document on file',
    section: 'students',
    render(mount, ctx) {
      injectStyles();
      const all = scopedStudents(ctx);
      const rows = documentRows(all, 160);
      const f = { tab: 'all' };
      let node;
      const select = () => rows.filter((r) => {
        if (f.docType && f.docType !== 'all' && r.name !== f.docType) return false;
        if (f.className && f.className !== 'all' && r.className !== f.className) return false;
        if (f.status && f.status !== 'all' && r.status !== f.status) return false;
        if (f.tab === 'pending') return r.status === 'Pending';
        if (f.tab === 'rejected') return r.status === 'Rejected';
        if (f.tab === 'verified') return r.status === 'Verified';
        return true;
      });
      const statusSplit = countBy(rows, 'status');
      const typeSplit = countBy(rows, 'name');

      node = listPage({
        title: 'Documents',
        subtitle: `${formatNumber(rows.length)} documents across ${formatNumber(Math.min(all.length, 160))} student wallets · ${scopeLabel(ctx)}`,
        route: 'students/documents',
        actions: [
          Button('Request missing documents', { variant: 'secondary', icon: 'send', onClick: () => notify({ title: 'Request queued to guardians', tone: 'success' }) }),
          Button('Upload documents', { variant: 'primary', icon: 'upload', onClick: () => Modal({
            title: 'Upload student documents', size: 'md', icon: 'upload',
            body: h('div', { className: 'stack-3' },
              Field({ label: 'Student', required: true }, Combobox({ options: all.slice(0, 400).map((s) => ({ value: s.id, label: `${s.name} · ${s.admissionNo}` })), placeholder: 'Search…' })),
              Field({ label: 'Document type', required: true }, Select({ options: uniq(rows.map((r) => r.name)), placeholder: 'Select…' })),
              FileUpload({ label: 'Drop the scan here or click to browse', hint: 'PDF or JPG up to 5 MB' })),
            actions: (close) => frag(
              Button('Cancel', { variant: 'secondary', onClick: close }),
              Button('Upload', { variant: 'primary', icon: 'upload', onClick: () => { close(); notify({ title: 'Document uploaded', text: 'Queued for verification.', tone: 'success' }); } })),
          }) }),
        ],
        tabs: [
          { id: 'all', label: 'All', count: rows.length },
          { id: 'verified', label: 'Verified', count: rows.filter((r) => r.status === 'Verified').length },
          { id: 'pending', label: 'Pending', count: rows.filter((r) => r.status === 'Pending').length },
          { id: 'rejected', label: 'Rejected', count: rows.filter((r) => r.status === 'Rejected').length },
        ],
        activeTab: 'all',
        onTabChange: (id) => { f.tab = id; node.table.refresh(select()); },
        kpis: [
          { label: 'Documents on file', value: formatNumber(rows.length), icon: 'folder', tone: 'brand' },
          { label: 'Verified', value: formatNumber(rows.filter((r) => r.status === 'Verified').length), icon: 'check-circle', tone: 'success' },
          { label: 'Pending verification', value: formatNumber(rows.filter((r) => r.status === 'Pending').length), icon: 'clock', tone: 'warning' },
          { label: 'Rejected', value: formatNumber(rows.filter((r) => r.status === 'Rejected').length), icon: 'x-circle', tone: 'danger' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Student, admission no or document…', width: '260px' },
          { id: 'docType', label: 'Document', options: uniq(rows.map((r) => r.name)).sort() },
          { id: 'className', label: 'Class', options: classOptions(all) },
          { id: 'status', label: 'Status', options: ['Verified', 'Pending', 'Rejected'] },
        ],
        onFilter: (id, value, allValues) => {
          Object.assign(f, allValues);
          node.table.refresh(select().filter((r) => !allValues.q || `${r.student} ${r.admissionNo} ${r.name}`.toLowerCase().includes(String(allValues.q).toLowerCase())));
        },
        chart: barChart({
          categories: typeSplit.map((x) => x.key),
          series: [{ name: 'Documents', values: typeSplit.map((x) => x.value) }],
          horizontal: true, height: 260, showValues: true, title: 'Documents by type',
        }),
        chartTitle: `Documents by type · ${statusSplit.map((x) => `${x.key} ${x.value}`).join(' · ')}`,
        columns: [
          { key: 'student', label: 'Student', sticky: true, width: 230, render: (r) => Identity(r.student, `${r.admissionNo} · ${r.className}-${r.section}`, { onClick: () => goStudent(r.studentId) }), value: (r) => r.student },
          { key: 'name', label: 'Document', width: 190, filter: true },
          { key: 'type', label: 'Format', width: 100, filter: true },
          { key: 'sizeKb', label: 'Size (KB)', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: (v) => formatNumber(v) },
          { key: 'uploadedOn', label: 'Uploaded', width: 140, render: (r) => formatDate(r.uploadedOn), value: (r) => r.uploadedOn },
          { key: 'verifiedBy', label: 'Verified by', width: 170 },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: select(),
        selectable: true,
        footerAggregates: true,
        pageSize: 25,
        searchKeys: ['student', 'admissionNo', 'name'],
        exportName: 'student-documents',
        bulkActions: [
          { label: 'Mark verified', icon: 'check-circle', onClick: (sel) => notify({ title: `${sel.length} documents verified`, tone: 'success' }) },
          { label: 'Request re-upload', icon: 'refresh-ccw', tone: 'danger', onClick: (sel) => notify({ title: `Re-upload requested for ${sel.length} documents`, tone: 'warning' }) },
        ],
        rowActions: (r) => [
          { label: 'Preview', icon: 'eye', onClick: mockAction('Preview document') },
          { label: 'Download', icon: 'download', onClick: () => notify({ title: 'Downloading', text: r.name, tone: 'info' }) },
          { label: 'Mark verified', icon: 'check-circle', onClick: () => notify({ title: 'Document verified', text: `${r.name} · ${r.student}`, tone: 'success' }) },
          { separator: true },
          { label: 'Reject', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: 'Reject this document?', text: 'The guardian is asked to upload a clearer copy.', confirmLabel: 'Reject', tone: 'danger' }).then((ok) => ok && notify({ title: 'Document rejected', tone: 'danger' })) },
        ],
        emptyState: EmptyState({ icon: 'folder', title: 'No documents match', text: 'Try a different document type or status.' }),
      });
      mount.appendChild(node);
    },
  },

  /* --------------------------------------------------------- behaviour --- */
  'students/behaviour': {
    title: 'Behaviour Records',
    subtitle: 'Conduct, punctuality and disciplinary follow-up',
    section: 'students',
    render(mount, ctx) {
      injectStyles();
      const all = scopedStudents(ctx);
      const ids = new Set(all.map((s) => s.id));
      const lates = db.lateRecords.filter((l) => ids.has(l.studentId)).map((l) => {
        const s = byId(db.students, l.studentId);
        return { ...l, className: s ? s.className : '—', section: s ? s.section : '—', house: s ? s.house : '—' };
      });
      const watchlist = sortBy(all.filter((s) => s.disciplinaryCount > 0 || s.behaviourScore < 70), 'behaviourScore', 'asc');
      const bands = [
        { key: 'Exemplary (90+)', value: all.filter((s) => s.behaviourScore >= 90).length },
        { key: 'Good (75-89)', value: all.filter((s) => s.behaviourScore >= 75 && s.behaviourScore < 90).length },
        { key: 'Watch (60-74)', value: all.filter((s) => s.behaviourScore >= 60 && s.behaviourScore < 75).length },
        { key: 'Concern (<60)', value: all.filter((s) => s.behaviourScore < 60).length },
      ];

      mount.appendChild(page({
        title: 'Behaviour Records',
        subtitle: `${formatNumber(watchlist.length)} students on the watchlist · ${scopeLabel(ctx)}`,
        route: 'students/behaviour',
        actions: [
          Button('Punctuality report', { variant: 'secondary', icon: 'timer', route: 'attendance/late-early' }),
          Button('Record a note', {
            variant: 'primary', icon: 'plus',
            onClick: () => Modal({
              title: 'Record a behaviour note', size: 'md', icon: 'edit',
              body: h('div', { className: 'stack-3' },
                Field({ label: 'Student', required: true }, Combobox({ options: all.slice(0, 400).map((s) => ({ value: s.id, label: `${s.name} · ${s.className}-${s.section}` })), placeholder: 'Search…' })),
                Field({ label: 'Type', required: true }, Select({ options: ['Appreciation', 'Verbal warning', 'Written warning', 'Detention', 'Parent called', 'Suspension'], placeholder: 'Select…' })),
                Field({ label: 'Date', required: true }, DatePicker({ value: '2026-08-20', width: '100%' })),
                Field({ label: 'Note', required: true }, Textarea({ rows: 3, placeholder: 'What happened and what was agreed…' }))),
              actions: (close) => frag(
                Button('Cancel', { variant: 'secondary', onClick: close }),
                Button('Save note', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Behaviour note recorded', tone: 'success' }); } })),
            }),
          }),
        ],
        children: [
          kpiRow([
            { label: 'Average behaviour score', value: `${avg(all, 'behaviourScore').toFixed(1)}/100`, icon: 'smile', tone: 'success' },
            { label: 'Students with notes', value: formatNumber(all.filter((s) => s.disciplinaryCount > 0).length), icon: 'alert-circle', tone: 'warning' },
            { label: 'Late arrivals logged', value: formatNumber(lates.length), icon: 'timer', tone: 'info' },
            { label: 'On watchlist', value: formatNumber(watchlist.length), icon: 'eye', tone: 'danger' },
          ]),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-5' },
              SectionCard({ title: 'Conduct bands', subtitle: 'Distribution of the composite behaviour score', className: 'chart-card', icon: 'chart-pie' },
                donutChart({ data: bands, height: 250, centerLabel: 'Students', centerValue: formatNumber(all.length), title: 'Conduct bands' }))),
            h('div', { className: 'span-7' },
              SectionCard({ title: 'Behaviour vs attendance', subtitle: 'Each dot is a student on the watchlist', className: 'chart-card', icon: 'chart-line' },
                scatterPlot({
                  points: watchlist.slice(0, 160).map((s) => ({ x: s.attendancePct, y: s.behaviourScore, label: s.name, group: s.house })),
                  xLabel: 'Attendance %', yLabel: 'Behaviour score', height: 250, title: 'Behaviour vs attendance',
                })))),
          SectionCard({ title: 'Watchlist', subtitle: 'Lowest conduct scores and repeat disciplinary notes', icon: 'eye', flush: true },
            DataTable({
              columns: [
                { key: 'name', label: 'Student', sticky: true, width: 240, render: (r) => studentCell(r), value: (r) => r.name },
                { key: 'className', label: 'Class', width: 110, filter: true },
                { key: 'house', label: 'House', width: 120, filter: true },
                { key: 'behaviourScore', label: 'Score', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => Number(v).toFixed(1), render: (r) => h('span', { className: r.behaviourScore < 60 ? 't-danger t-num' : 't-warning t-num' }, String(r.behaviourScore)) },
                { key: 'disciplinaryCount', label: 'Notes', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'attendancePct', label: 'Attendance', width: 130, align: 'right', numeric: true, aggregate: 'avg', format: (v) => pctText(v), render: (r) => pctText(r.attendancePct) },
                { key: 'lastExamPercent', label: 'Last exam', width: 120, align: 'right', numeric: true, render: (r) => pctText(r.lastExamPercent) },
                { key: 'guardianName', label: 'Guardian', width: 190 },
              ],
              rows: watchlist, pageSize: 15, footerAggregates: true, selectable: true,
              searchKeys: ['name', 'admissionNo', 'className'], exportName: 'behaviour-watchlist',
              onRowClick: (r) => goStudent(r.id),
              bulkActions: [
                { label: 'Call guardians', icon: 'phone-call', onClick: (sel) => notify({ title: `${sel.length} guardian calls scheduled`, tone: 'info' }) },
                { label: 'Schedule counselling', icon: 'handshake', onClick: (sel) => notify({ title: `Counselling booked for ${sel.length} students`, tone: 'success' }) },
              ],
              rowActions: (r) => [
                { label: 'Open profile', icon: 'id-card', route: `students/profile/${r.id}` },
                { label: 'Message guardian', icon: 'send', onClick: () => messageParent(r) },
                { label: 'Schedule counselling', icon: 'handshake', onClick: () => notify({ title: 'Counselling scheduled', text: r.name, tone: 'success' }) },
              ],
              emptyState: EmptyState({ icon: 'smile', title: 'No behaviour concerns', text: 'Every student is above the watch threshold this session.' }),
            })),
          SectionCard({ title: 'Punctuality register', subtitle: `${formatNumber(lates.length)} late / early records`, icon: 'timer', flush: true },
            DataTable({
              columns: [
                { key: 'studentName', label: 'Student', sticky: true, width: 220, render: (r) => Identity(r.studentName, `${r.className}-${r.section}`, { onClick: () => goStudent(r.studentId) }), value: (r) => r.studentName },
                { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date), value: (r) => r.date },
                { key: 'inTime', label: 'In time', width: 110 },
                { key: 'minutesLate', label: 'Minutes late', width: 130, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Number(v).toFixed(0)} min` },
                { key: 'type', label: 'Type', width: 130, filter: true },
                { key: 'reason', label: 'Reason' },
                { key: 'actionTaken', label: 'Action taken', width: 190 },
              ],
              rows: lates, pageSize: 15, footerAggregates: true, exportName: 'punctuality-register',
              searchKeys: ['studentName', 'reason'],
              emptyState: EmptyState({ icon: 'timer', title: 'No late arrivals logged' }),
            })),
        ],
      }));
    },
  },

  /* ------------------------------------------------------------ awards --- */
  'students/awards': {
    title: 'Awards & Achievements',
    subtitle: 'Every award recorded against a student',
    section: 'students',
    render(mount, ctx) {
      injectStyles();
      const all = scopedStudents(ctx);
      const ids = new Set(all.map((s) => s.id));
      const awards = db.awards.filter((a) => ids.has(a.studentId));
      const byCategory = countBy(awards, 'category');
      const byLevel = countBy(awards, 'level');
      const byHouse = sumBy(awards, 'house', 'points');
      const top = sumBy(awards, 'studentName', 'points').slice(0, 10);

      mount.appendChild(listPage({
        title: 'Awards & Achievements',
        subtitle: `${formatNumber(awards.length)} awards · ${formatNumber(sum(awards, 'points'))} house points · ${scopeLabel(ctx)}`,
        route: 'students/awards',
        actions: [
          Button('Certificates', { variant: 'secondary', icon: 'certificate', route: 'students/certificates' }),
          Button('Record award', {
            variant: 'primary', icon: 'award',
            onClick: () => Modal({
              title: 'Record an award', size: 'md', icon: 'award',
              body: h('div', { className: 'stack-3' },
                Field({ label: 'Student', required: true }, Combobox({ options: all.slice(0, 400).map((s) => ({ value: s.id, label: `${s.name} · ${s.className}-${s.section}` })), placeholder: 'Search…' })),
                Field({ label: 'Award title', required: true }, Input({ placeholder: 'e.g. Inter-house Debate — First Place' })),
                FormGrid({ cols: 2 },
                  Field({ label: 'Category', required: true }, Select({ options: uniq(awards.map((a) => a.category)), placeholder: 'Select…' })),
                  Field({ label: 'Level', required: true }, Select({ options: uniq(awards.map((a) => a.level)), placeholder: 'Select…' })),
                  Field({ label: 'Date', required: true }, DatePicker({ value: '2026-08-20', width: '100%' })),
                  Field({ label: 'House points' }, Input({ type: 'number', numeric: true, value: '10' })))),
              actions: (close) => frag(
                Button('Cancel', { variant: 'secondary', onClick: close }),
                Button('Save award', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Award recorded', text: 'House points updated.', tone: 'success' }); } })),
            }),
          }),
        ],
        kpis: [
          { label: 'Awards recorded', value: formatNumber(awards.length), icon: 'award', tone: 'warning' },
          { label: 'House points', value: formatNumber(sum(awards, 'points')), icon: 'flag', tone: 'brand' },
          { label: 'Students recognised', value: formatNumber(uniq(awards.map((a) => a.studentId)).length), icon: 'graduation-cap', tone: 'success' },
          { label: 'National / state level', value: formatNumber(awards.filter((a) => /National|State/i.test(a.level)).length), icon: 'trophy', tone: 'info' },
        ],
        chart: h('div', { className: 'widget-grid' },
          h('div', { className: 'span-4' }, donutChart({ data: byCategory, height: 240, centerLabel: 'Awards', centerValue: formatNumber(awards.length), title: 'Awards by category' })),
          h('div', { className: 'span-4' }, barChart({ categories: byLevel.map((x) => x.key), series: [{ name: 'Awards', values: byLevel.map((x) => x.value) }], horizontal: true, showValues: true, height: 240, title: 'Awards by level' })),
          h('div', { className: 'span-4' }, barChart({ categories: byHouse.map((x) => x.key), series: [{ name: 'Points', values: byHouse.map((x) => x.value) }], showValues: true, height: 240, title: 'Award points by house' }))),
        chartTitle: 'Award analytics',
        notes: SectionCard({ title: 'Most decorated students', subtitle: 'By total house points earned', icon: 'trophy' },
          RankList(top.map((t) => {
            const s = all.find((x) => x.name === t.key);
            return { name: t.key, meta: s ? `${s.className}-${s.section} · ${s.house} House` : '', value: `${formatNumber(t.value)} pts` };
          }))),
        columns: [
          { key: 'studentName', label: 'Student', sticky: true, width: 220, render: (r) => Identity(r.studentName, `${r.className} · ${r.house} House`, { onClick: () => goStudent(r.studentId) }), value: (r) => r.studentName },
          { key: 'title', label: 'Award', width: 260 },
          { key: 'category', label: 'Category', width: 160, filter: true },
          { key: 'level', label: 'Level', width: 150, filter: true, render: (r) => Badge(r.level, { tone: 'brand', outline: true }) },
          { key: 'house', label: 'House', width: 120, filter: true },
          { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date), value: (r) => r.date },
          { key: 'awardedBy', label: 'Awarded by', width: 190 },
          { key: 'certificateNo', label: 'Certificate', width: 150 },
          { key: 'points', label: 'Points', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        ],
        rows: awards,
        selectable: true,
        footerAggregates: true,
        pageSize: 25,
        searchKeys: ['studentName', 'title', 'category', 'certificateNo'],
        exportName: 'student-awards',
        bulkActions: [
          { label: 'Print certificates', icon: 'print', onClick: (sel) => notify({ title: `${sel.length} certificates queued`, tone: 'info' }) },
          { label: 'Announce in assembly', icon: 'megaphone', onClick: (sel) => notify({ title: `${sel.length} awards added to the assembly list`, tone: 'success' }) },
        ],
        rowActions: (r) => [
          { label: 'Open student', icon: 'id-card', route: `students/profile/${r.studentId}` },
          { label: 'Reprint certificate', icon: 'print', onClick: () => notify({ title: 'Certificate reprinted', text: r.certificateNo, tone: 'info' }) },
        ],
        onRowClick: (r) => goStudent(r.studentId),
        emptyState: EmptyState({ icon: 'award', title: 'No awards yet', text: 'Awards recorded in the activities module appear here.' }),
      }));
    },
  },

  /* ------------------------------------------------------- bulk import --- */
  'students/bulk-import': {
    title: 'Bulk Import',
    subtitle: 'Upload a spreadsheet, map the columns, fix the errors, import',
    section: 'students',
    render(mount, ctx) {
      injectStyles();
      const sample = scopedStudents(ctx).slice(0, 120);
      const SOURCE_COLUMNS = ['Student Name', 'Adm No', 'DOB', 'Gender', 'Class', 'Sec', 'Father Name', 'Mother Name', 'Mobile', 'Email', 'Category', 'Blood Grp', 'Address', 'City', 'Pin'];
      const TARGETS = [
        { value: 'name', label: 'Student name *' }, { value: 'admissionNo', label: 'Admission number *' },
        { value: 'dob', label: 'Date of birth *' }, { value: 'gender', label: 'Gender *' },
        { value: 'className', label: 'Class *' }, { value: 'section', label: 'Section' },
        { value: 'fatherName', label: "Father's name" }, { value: 'motherName', label: "Mother's name" },
        { value: 'phone', label: 'Guardian phone *' }, { value: 'email', label: 'Guardian email' },
        { value: 'category', label: 'Category' }, { value: 'bloodGroup', label: 'Blood group' },
        { value: 'address', label: 'Address' }, { value: 'city', label: 'City' },
        { value: 'pincode', label: 'PIN code' }, { value: '__skip', label: '— Do not import —' },
      ];
      const AUTO = {
        'Student Name': 'name', 'Adm No': 'admissionNo', DOB: 'dob', Gender: 'gender', Class: 'className',
        Sec: 'section', 'Father Name': 'fatherName', 'Mother Name': 'motherName', Mobile: 'phone',
        Email: 'email', Category: 'category', 'Blood Grp': 'bloodGroup', Address: 'address', City: 'city', Pin: 'pincode',
      };
      const mapping = { ...AUTO };
      let step = 0;

      /* the "uploaded" rows, derived from real records with deterministic defects */
      const stagedRows = sample.map((s, i) => {
        const defect = hash(s.id + 'import') % 11;
        const row = {
          id: `ROW${i + 1}`, line: i + 2,
          name: defect === 3 ? '' : s.name,
          admissionNo: defect === 5 && i > 0 ? sample[0].admissionNo : s.admissionNo,
          dob: defect === 7 ? '31/02/2015' : s.dob,
          gender: s.gender,
          className: defect === 9 ? 'Class XIII' : s.className,
          section: s.section,
          fatherName: s.fatherName,
          motherName: s.motherName,
          phone: defect === 1 ? '98xx-1234' : s.emergencyContact,
          email: s.email,
          category: s.category,
          bloodGroup: s.bloodGroup,
          address: s.address.line1,
          city: s.address.city,
          pincode: s.address.pincode,
        };
        const errors = [];
        const warnings = [];
        if (!row.name) errors.push('Student name is blank');
        if (!/^\d{2}-\d{2}-\d{4}$|^\d{4}-\d{2}-\d{2}$/.test(row.dob)) errors.push('Date of birth is not a valid date');
        if (!/^\+?[\d\s]{10,15}$/.test(row.phone)) errors.push('Guardian phone is not a valid Indian mobile number');
        if (!db.classes.some((c) => c.name === row.className)) errors.push(`Class “${row.className}” does not exist`);
        if (defect === 5 && i > 0) errors.push('Duplicate admission number in this file');
        if (!row.email) warnings.push('No guardian email — portal invite cannot be sent');
        if (!row.motherName) warnings.push("Mother's name missing");
        row.errors = errors;
        row.warnings = warnings;
        row.rowStatus = errors.length ? 'Rejected' : warnings.length ? 'Pending' : 'Verified';
        return row;
      });

      const valid = stagedRows.filter((r) => !r.errors.length);
      const host = h('div', { className: 'stack' });
      const stepperHost = h('div');

      const previewTable = () => DataTable({
        columns: [
          { key: 'line', label: 'Line', width: 80, align: 'right', numeric: true },
          {
            key: 'rowStatus', label: 'Result', width: 130, filter: true,
            render: (r) => Badge(r.rowStatus === 'Verified' ? 'Verified' : r.rowStatus === 'Pending' ? 'Pending' : 'Rejected'),
          },
          { key: 'name', label: 'Student name', width: 200, render: (r) => (r.name ? r.name : h('span', { className: 't-danger' }, 'missing')) },
          { key: 'admissionNo', label: 'Admission no', width: 140 },
          { key: 'dob', label: 'DOB', width: 130 },
          { key: 'className', label: 'Class', width: 130, filter: true },
          { key: 'section', label: 'Sec', width: 80, align: 'center' },
          { key: 'phone', label: 'Guardian phone', width: 160 },
          {
            key: 'issues', label: 'Issues', width: 300, sortable: false,
            value: (r) => r.errors.concat(r.warnings).join('; '),
            render: (r) => (r.errors.length || r.warnings.length)
              ? h('div', { className: 'stack-1' },
                r.errors.map((e) => h('div', { className: 't-xs t-danger row', style: { gap: 'var(--sp-1)' } }, Icon('alert-circle', 12), e)),
                r.warnings.map((w) => h('div', { className: 't-xs t-warning row', style: { gap: 'var(--sp-1)' } }, Icon('alert-triangle', 12), w)))
              : h('span', { className: 't-xs t-success row', style: { gap: 'var(--sp-1)' } }, Icon('check-circle', 12), 'Ready to import'),
          },
        ],
        rows: stagedRows, pageSize: 10, exportName: 'import-validation',
        searchKeys: ['name', 'admissionNo', 'className'],
        emptyState: EmptyState({ icon: 'upload', title: 'Nothing staged yet' }),
      });

      const paint = () => {
        stepperHost.innerHTML = '';
        stepperHost.appendChild(Card({ pad: true }, Stepper([
          { label: 'Upload file', description: 'CSV or XLSX' },
          { label: 'Map columns', description: 'Source → ERP field' },
          { label: 'Validate', description: 'Fix errors' },
          { label: 'Import', description: 'Commit rows' },
        ], { current: step })));

        host.innerHTML = '';
        if (step === 0) {
          host.appendChild(SectionCard({ title: 'Upload the student sheet', subtitle: 'CSV or XLSX up to 10 MB · maximum 2,000 rows per file', icon: 'upload' },
            h('div', { className: 'stack-4' },
              FileUpload({
                label: 'Drop students.csv here or click to browse', multiple: false, accept: '.csv,.xlsx',
                hint: 'The first row must contain column headers.',
                onFiles: () => { notify({ title: 'File staged', text: `${stagedRows.length} rows detected`, tone: 'success' }); step = 1; paint(); },
              }),
              Callout({ tone: 'info', icon: 'info', title: 'Need the template?' },
                h('div', { className: 'row row-wrap' },
                  h('span', null, 'Download the standard import template with the expected headers and one sample row.'),
                  h('span', { className: 'spacer' }),
                  Button('Download template', {
                    variant: 'secondary', size: 'sm', icon: 'download',
                    onClick: () => { download('student-import-template.csv', `${SOURCE_COLUMNS.join(',')}\n${sample[0] ? [sample[0].name, sample[0].admissionNo, sample[0].dob, sample[0].gender, sample[0].className, sample[0].section, sample[0].fatherName, sample[0].motherName, sample[0].emergencyContact, sample[0].email, sample[0].category, sample[0].bloodGroup, sample[0].address.line1, sample[0].address.city, sample[0].address.pincode].join(',') : ''}`, 'text/csv;charset=utf-8'); notify({ title: 'Template downloaded', tone: 'success' }); },
                  }))),
              Card({ pad: true },
                h('div', { className: 'stack-2' },
                  h('div', { className: 't-eyebrow' }, 'Rules applied on import'),
                  h('ul', { className: 't-sm t-secondary', style: { paddingLeft: 'var(--sp-5)', lineHeight: '1.9' } },
                    ['Admission numbers must be unique across the school.',
                      'Dates must be ISO (YYYY-MM-DD) or DD-MM-YYYY.',
                      'Class names must already exist in Academics → Classes.',
                      'Guardian mobile numbers must be valid Indian numbers.',
                      'Rows with errors are skipped; warnings are imported as-is.']
                      .map((t) => h('li', null, t))))))));
          host.appendChild(Card({ pad: true }, h('div', { className: 'row' },
            h('span', { className: 'spacer' }),
            Button('Continue with the staged file', { variant: 'primary', iconRight: 'chevron-right', onClick: () => { step = 1; paint(); } }))));
        } else if (step === 1) {
          host.appendChild(SectionCard({ title: 'Map the columns', subtitle: `${SOURCE_COLUMNS.length} columns detected · ${Object.values(mapping).filter((v) => v !== '__skip').length} mapped automatically`, icon: 'workflow' },
            h('div', null,
              h('div', { className: 'map-row t-eyebrow' },
                h('span', null, 'Column in your file'), h('span', null, ''), h('span', null, 'ERP field'), h('span', null, 'Sample')),
              SOURCE_COLUMNS.map((col) => h('div', { className: 'map-row' },
                h('span', { className: 'map-src' }, col),
                h('span', { className: 't-muted' }, Icon('arrow-right', 14)),
                Select({
                  options: TARGETS, value: mapping[col] || '__skip',
                  onChange: (v) => { mapping[col] = v; },
                }),
                h('span', { className: 't-xs t-muted t-truncate', style: { maxWidth: '160px' } },
                  String((stagedRows[0] || {})[AUTO[col]] ?? '—')))))));
          host.appendChild(Card({ pad: true }, h('div', { className: 'row' },
            Button('Back', { variant: 'secondary', icon: 'chevron-left', onClick: () => { step = 0; paint(); } }),
            h('span', { className: 'spacer' }),
            Button('Validate rows', { variant: 'primary', iconRight: 'chevron-right', onClick: () => { step = 2; paint(); } }))));
        } else if (step === 2) {
          host.appendChild(kpiRow([
            { label: 'Rows in file', value: formatNumber(stagedRows.length), icon: 'table', tone: 'brand' },
            { label: 'Ready to import', value: formatNumber(valid.length), icon: 'check-circle', tone: 'success' },
            { label: 'With warnings', value: formatNumber(stagedRows.filter((r) => !r.errors.length && r.warnings.length).length), icon: 'alert-triangle', tone: 'warning' },
            { label: 'Blocked by errors', value: formatNumber(stagedRows.length - valid.length), icon: 'x-circle', tone: 'danger' },
          ]));
          host.appendChild(Callout({ tone: stagedRows.length - valid.length ? 'warning' : 'success', icon: 'clipboard-check', title: 'Validation preview' },
            `${formatNumber(valid.length)} of ${formatNumber(stagedRows.length)} rows will be imported. Rows with errors are skipped and can be downloaded as an error file to fix and re-upload.`));
          host.appendChild(SectionCard({
            title: 'Row-by-row validation', icon: 'table', flush: true,
            actions: Button('Download error rows', {
              variant: 'secondary', size: 'sm', icon: 'download',
              onClick: () => { download('import-errors.csv', toCsv(stagedRows.filter((r) => r.errors.length), [{ key: 'line', label: 'Line' }, { key: 'name', label: 'Name' }, { key: 'admissionNo', label: 'Admission no' }, { key: 'issues', label: 'Errors', value: (r) => r.errors.join('; ') }]), 'text/csv;charset=utf-8'); notify({ title: 'Error file downloaded', tone: 'info' }); },
            }),
          }, previewTable()));
          host.appendChild(Card({ pad: true }, h('div', { className: 'row' },
            Button('Back to mapping', { variant: 'secondary', icon: 'chevron-left', onClick: () => { step = 1; paint(); } }),
            h('span', { className: 'spacer' }),
            Button(`Import ${formatNumber(valid.length)} rows`, {
              variant: 'primary', icon: 'upload',
              onClick: () => ConfirmDialog({
                title: `Import ${formatNumber(valid.length)} students?`,
                text: 'Rows with errors are skipped. Guardians with an email address receive a portal invitation.',
                confirmLabel: 'Import now', tone: 'brand', icon: 'upload',
              }).then((ok) => { if (ok) { step = 3; paint(); } }),
            }))));
        } else {
          host.appendChild(Card({ pad: true }, EmptyState({
            icon: 'check-circle', tone: 'success',
            title: `${formatNumber(valid.length)} students imported`,
            text: `${formatNumber(stagedRows.length - valid.length)} rows were skipped because of validation errors. Demo only — nothing was persisted.`,
            action: h('div', { className: 'row' },
              Button('Open student list', { variant: 'primary', icon: 'users', route: 'students/all' }),
              Button('Import another file', { variant: 'secondary', icon: 'upload', onClick: () => { step = 0; paint(); } })),
          })));
          host.appendChild(SectionCard({ title: 'Import log', icon: 'history' },
            Timeline([
              { title: 'File uploaded', meta: '09:31', text: `students.csv · ${formatNumber(stagedRows.length)} rows`, icon: 'upload', tone: 'brand' },
              { title: 'Columns mapped', meta: '09:32', text: `${Object.values(mapping).filter((v) => v !== '__skip').length} of ${SOURCE_COLUMNS.length} columns mapped`, icon: 'workflow', tone: 'info' },
              { title: 'Validation completed', meta: '09:33', text: `${formatNumber(valid.length)} valid · ${formatNumber(stagedRows.length - valid.length)} blocked`, icon: 'clipboard-check', tone: 'warning' },
              { title: 'Import committed', meta: '09:33', text: `${formatNumber(valid.length)} student records created`, icon: 'check-circle', tone: 'success' },
            ])));
        }
      };
      paint();

      mount.appendChild(page({
        title: 'Bulk Import',
        subtitle: 'Import students from a spreadsheet with column mapping and validation',
        route: 'students/bulk-import',
        actions: [
          Button('Import history', { variant: 'ghost', icon: 'history', onClick: mockAction('Import history') }),
          Button('Add a single student', { variant: 'secondary', icon: 'user-plus', route: 'students/add' }),
        ],
        children: [stepperHost, host],
      }));
    },
  },

  /* ----------------------------------------------------------- reports --- */
  'students/reports': {
    title: 'Student Reports',
    subtitle: 'Enrolment, performance, attendance and demographics',
    section: 'students',
    render(mount, ctx) {
      injectStyles();
      const all = scopedStudents(ctx);
      let rows = classSummary(all);
      let node;

      function classSummary(list) {
        const map = groupBy(list, 'className');
        const out = [];
        for (const [className, members] of map) {
          out.push({
            id: className, className,
            strength: members.length,
            boys: members.filter((s) => s.gender === 'Male').length,
            girls: members.filter((s) => s.gender === 'Female').length,
            attendance: avg(members, 'attendancePct'),
            cgpa: avg(members, 'cgpa'),
            lastExam: avg(members, 'lastExamPercent'),
            transport: members.filter((s) => s.transportOpted).length,
            hostel: members.filter((s) => s.hostelOpted).length,
            feeTotal: sum(members, 'feeTotal'),
            feeDue: sum(members, 'feeDue'),
            defaulters: members.filter((s) => s.feeDue > 0).length,
          });
        }
        return out.sort((a, b) => CLASS_ORDER(a.className) - CLASS_ORDER(b.className));
      }

      node = reportPage({
        title: 'Student Reports',
        subtitle: `Class-wise MIS · ${scopeLabel(ctx)}`,
        route: 'students/reports',
        filters: [
          { id: 'campus', label: 'Campus', options: db.campuses.map((c) => ({ value: c.id, label: c.name })) },
          { id: 'className', label: 'Class', options: classOptions(all) },
          { id: 'house', label: 'House', options: db.houses.map((x) => x.name) },
          { id: 'gender', label: 'Gender', options: ['Male', 'Female'] },
          { id: 'category', label: 'Category', options: uniq(all.map((s) => s.category)).sort() },
        ],
        onFilter: (id, value, allValues, table) => {
          const filtered = filterStudents(all, allValues);
          rows = classSummary(filtered);
          if (table) table.refresh(rows);
        },
        summary: [
          { label: 'Students', value: formatNumber(all.length), delta: 4.4, deltaLabel: 'vs last session', icon: 'graduation-cap', tone: 'brand', trend: analytics.sparks.students },
          { label: 'Average attendance', value: pctText(avg(all, 'attendancePct')), delta: 1.2, icon: 'clipboard-check', tone: 'success', trend: analytics.sparks.attendance },
          { label: 'Average CGPA', value: avg(all, 'cgpa').toFixed(2), icon: 'chart-line', tone: 'info' },
          { label: 'Fee outstanding', value: moneyK(sum(all, 'feeDue')), delta: -3.1, icon: 'wallet', tone: 'danger', trend: analytics.sparks.outstanding },
        ],
        chart: [
          barChart({
            categories: analytics.enrolmentByClass.map((r) => r.className),
            series: [{ name: 'Students', values: analytics.enrolmentByClass.map((r) => r.value) }],
            height: 260, title: 'Enrolment by class',
          }),
          lineChart({
            categories: analytics.enrolmentTrend.map((r) => r.year),
            series: [
              { name: 'Students', values: analytics.enrolmentTrend.map((r) => r.students) },
              { name: 'Staff', values: analytics.enrolmentTrend.map((r) => r.staff) },
            ],
            height: 260, showDots: true, title: 'Enrolment trend',
          }),
          barChart({
            categories: analytics.attendanceByClass.map((r) => r.className),
            series: [{ name: 'Attendance', values: analytics.attendanceByClass.map((r) => r.percent) }],
            valueFormat: 'percent', target: 85, height: 260, title: 'Attendance by class',
          }),
          heatmap({
            mode: 'matrix',
            rows: analytics.performanceMatrix.rows,
            cols: analytics.performanceMatrix.cols,
            values: analytics.performanceMatrix.values,
            title: 'Class × subject performance',
          }),
        ],
        chartTitle: 'Enrolment by class',
        columns: [
          { key: 'className', label: 'Class', sticky: true, width: 140 },
          { key: 'strength', label: 'Strength', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'boys', label: 'Boys', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'girls', label: 'Girls', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'attendance', label: 'Attendance', width: 130, align: 'right', numeric: true, aggregate: 'avg', format: (v) => pctText(v), render: (r) => pctText(r.attendance) },
          { key: 'lastExam', label: 'Last exam avg', width: 140, align: 'right', numeric: true, aggregate: 'avg', format: (v) => pctText(v), render: (r) => pctText(r.lastExam) },
          { key: 'cgpa', label: 'Avg CGPA', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => Number(v).toFixed(2), render: (r) => Number(r.cgpa).toFixed(2) },
          { key: 'transport', label: 'Transport', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'hostel', label: 'Hostel', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'defaulters', label: 'Defaulters', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'feeDue', label: 'Fee due', width: 140, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.feeDue) },
        ],
        rows,
        tableTitle: 'Class-wise summary',
        footerAggregates: true,
        notes: SectionCard({ title: 'Top performers', subtitle: 'Highest scoring students this session', icon: 'trophy' },
          RankList(analytics.topPerformers.slice(0, 10).map((t) => ({
            name: t.name, meta: `${t.className}-${t.section} · ${t.house} House`, value: pctText(t.percent),
          })))),
      });
      mount.appendChild(node);
    },
  },
});

/* ============================================================ PARENT PAGES */

function childrenOf(parent) {
  return (parent.studentIds || []).map((id) => byId(db.students, id)).filter(Boolean);
}

function parentColumns() {
  return [
    { key: 'name', label: 'Parent', sticky: true, width: 230, render: (r) => Identity(r.name, `${r.relation} · ${r.occupation}`, { onClick: () => goParent(r.id) }), value: (r) => r.name },
    { key: 'relation', label: 'Relation', width: 110, filter: true },
    {
      key: 'children', label: 'Children', width: 240, sortable: false,
      value: (r) => childrenOf(r).map((c) => c.name).join(', '),
      render: (r) => {
        const kids = childrenOf(r);
        if (!kids.length) return h('span', { className: 't-muted t-sm' }, 'No linked child');
        return h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-1)' } },
          kids.map((c) => Pill(`${c.name.split(' ')[0]} · ${c.className}`, { onClick: () => goStudent(c.id) })));
      },
    },
    { key: 'phone', label: 'Phone', width: 150 },
    { key: 'email', label: 'Email', width: 230 },
    { key: 'organisation', label: 'Organisation', width: 180, hidden: true },
    { key: 'annualIncome', label: 'Annual income', width: 150, align: 'right', numeric: true, aggregate: 'avg', format: (v) => moneyK(v), render: (r) => money(r.annualIncome), hidden: true },
    { key: 'portalActive', label: 'Portal', width: 110, filter: true, render: (r) => Badge(r.portalActive ? 'Active' : 'Suspended'), value: (r) => (r.portalActive ? 'Active' : 'Suspended') },
    { key: 'lastLogin', label: 'Last login', width: 150, render: (r) => (r.portalActive ? relativeTime(r.lastLogin) : '—'), value: (r) => r.lastLogin },
    { key: 'feedbackCount', label: 'Feedback', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
  ];
}

const parentRoutes = {
  /* --------------------------------------------------------- directory --- */
  'parents/directory': {
    title: 'Parent Directory',
    subtitle: 'Every guardian linked to an enrolled student',
    section: 'parents',
    render(mount, ctx) {
      injectStyles();
      const all = scopedParents(ctx);
      const f = { tab: 'all' };
      let node;
      const select = () => all.filter((p) => {
        const q = String(f.q || '').trim().toLowerCase();
        if (q && !`${p.name} ${p.phone} ${p.email} ${p.organisation}`.toLowerCase().includes(q)) return false;
        if (f.relation && f.relation !== 'all' && p.relation !== f.relation) return false;
        if (f.occupation && f.occupation !== 'all' && p.occupation !== f.occupation) return false;
        if (f.portal === 'Active' && !p.portalActive) return false;
        if (f.portal === 'Suspended' && p.portalActive) return false;
        if (f.tab === 'portal') return p.portalActive;
        if (f.tab === 'nologin') return !p.portalActive;
        if (f.tab === 'multi') return (p.studentIds || []).length > 1;
        if (f.tab === 'feedback') return p.feedbackCount > 0;
        return true;
      });
      const incomeBands = [
        { key: 'Under ₹6 L', value: all.filter((p) => p.annualIncome < 600001).length },
        { key: '₹6–12 L', value: all.filter((p) => p.annualIncome > 600000 && p.annualIncome <= 1200000).length },
        { key: '₹12–24 L', value: all.filter((p) => p.annualIncome > 1200000 && p.annualIncome <= 2400000).length },
        { key: '₹24–48 L', value: all.filter((p) => p.annualIncome > 2400000 && p.annualIncome <= 4800000).length },
        { key: 'Above ₹48 L', value: all.filter((p) => p.annualIncome > 4800000).length },
      ];

      node = listPage({
        title: 'Parent Directory',
        subtitle: `${formatNumber(all.length)} guardians · ${scopeLabel(ctx)}`,
        route: 'parents/directory',
        actions: [
          MenuButton([
            { label: 'Parent logins', icon: 'key', route: 'parents/logins' },
            { label: 'Link children', icon: 'link', route: 'parents/link-children' },
            { label: 'Feedback inbox', icon: 'message-circle', route: 'parents/feedback' },
          ], { label: 'More actions' }),
          Button('Parent reports', { variant: 'secondary', icon: 'chart-bar', route: 'parents/reports' }),
          Button('Broadcast message', { variant: 'primary', icon: 'megaphone', route: 'communication/compose' }),
        ],
        tabs: [
          { id: 'all', label: 'All guardians', count: all.length },
          { id: 'portal', label: 'Portal active', count: all.filter((p) => p.portalActive).length },
          { id: 'nologin', label: 'No portal access', count: all.filter((p) => !p.portalActive).length },
          { id: 'multi', label: 'Multiple children', count: all.filter((p) => (p.studentIds || []).length > 1).length },
          { id: 'feedback', label: 'Gave feedback', count: all.filter((p) => p.feedbackCount > 0).length },
        ],
        activeTab: 'all',
        onTabChange: (id) => { f.tab = id; node.table.refresh(select()); },
        kpis: [
          { label: 'Guardians', value: formatNumber(all.length), icon: 'users', tone: 'brand' },
          { label: 'Portal adoption', value: pctText((all.filter((p) => p.portalActive).length / Math.max(1, all.length)) * 100), delta: 3.4, deltaLabel: 'vs last quarter', icon: 'key', tone: 'success' },
          { label: 'Families with siblings', value: formatNumber(all.filter((p) => (p.studentIds || []).length > 1).length), icon: 'link', tone: 'info' },
          { label: 'Feedback received', value: formatNumber(sum(all, 'feedbackCount')), icon: 'message-circle', tone: 'warning' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Name, phone, email or employer…', width: '260px' },
          { id: 'relation', label: 'Relation', options: uniq(all.map((p) => p.relation)) },
          { id: 'occupation', label: 'Occupation', options: uniq(all.map((p) => p.occupation)).sort() },
          { id: 'portal', label: 'Portal', options: ['Active', 'Suspended'] },
        ],
        onFilter: (id, value, allValues) => { Object.assign(f, allValues); node.table.refresh(select()); },
        chart: barChart({
          categories: incomeBands.map((x) => x.key),
          series: [{ name: 'Families', values: incomeBands.map((x) => x.value) }],
          height: 220, showValues: true, title: 'Declared annual family income',
        }),
        chartTitle: 'Declared annual family income',
        columns: parentColumns(),
        rows: select(),
        selectable: true,
        footerAggregates: true,
        pageSize: 25,
        searchKeys: ['name', 'phone', 'email', 'organisation'],
        exportName: 'parent-directory',
        bulkActions: [
          { label: 'Send SMS', icon: 'message-square', onClick: (sel) => notify({ title: `SMS queued for ${sel.length} guardians`, tone: 'success' }) },
          { label: 'Invite to portal', icon: 'key', onClick: (sel) => notify({ title: `Portal invites sent to ${sel.length} guardians`, tone: 'success' }) },
          { label: 'Export selection', icon: 'download', onClick: (sel) => { download('parents.csv', toCsv(sel, [{ key: 'name', label: 'Name' }, { key: 'relation', label: 'Relation' }, { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' }]), 'text/csv;charset=utf-8'); notify({ title: 'Selection exported', tone: 'success' }); } },
        ],
        rowActions: (r) => [
          { label: 'Open parent profile', icon: 'user', route: `parents/profile/${r.id}` },
          { label: 'Call', icon: 'phone', onClick: () => notify({ title: `Dialling ${r.phone}`, text: r.name, tone: 'info' }) },
          { label: 'Email', icon: 'mail', onClick: () => notify({ title: 'Compose opened', text: r.email, tone: 'info' }) },
          { separator: true },
          { label: 'Link another child', icon: 'link', route: 'parents/link-children' },
          { label: r.portalActive ? 'Suspend portal access' : 'Activate portal access', icon: 'key', tone: r.portalActive ? 'danger' : undefined, onClick: () => notify({ title: r.portalActive ? 'Portal access suspended' : 'Portal access activated', text: r.name, tone: r.portalActive ? 'danger' : 'success' }) },
        ],
        onRowClick: (r) => goParent(r.id),
        emptyState: EmptyState({ icon: 'users', title: 'No guardians match', text: 'Try clearing a filter or search for a different name.' }),
      });
      mount.appendChild(node);
    },
  },

  /* ----------------------------------------------------------- profile --- */
  'parents/profile': {
    title: 'Parent Profile',
    subtitle: 'Guardian record with linked children and portal activity',
    section: 'parents',
    render(mount, ctx) {
      injectStyles();
      const pool = scopedParents(ctx);
      const id = ctx.param || (pool[0] && pool[0].id) || '';
      const p = byId(db.parents, id);
      if (!p) { mount.appendChild(missingRecord('parent', 'parents/directory')); return; }
      const kids = childrenOf(p);
      const invoices = db.invoices.filter((i) => p.studentIds.includes(i.studentId));
      const payments = db.payments.filter((x) => p.studentIds.includes(x.studentId));
      const bookings = db.ptmBookings.filter((b) => b.parentName === p.name);
      const feedback = db.complaints.filter((c) => c.raisedBy === 'Parent' && c.raisedByName === p.name);
      const totalDue = sum(kids, 'feeDue');

      mount.appendChild(detailPage({
        title: p.name,
        subtitle: `${p.relation} of ${kids.map((k) => k.name).join(', ') || 'a Springdale student'} · ${campusName(p.campusId)}`,
        route: 'parents/profile',
        breadcrumb: breadcrumbFor('parents/profile', p.name),
        initials: p.avatarInitials,
        badges: [
          Badge(p.portalActive ? 'Active' : 'Suspended'),
          Badge(`${kids.length} ${kids.length === 1 ? 'child' : 'children'}`, { tone: 'info', icon: 'users' }),
          totalDue > 0 ? Badge('Fees due', { tone: 'danger', icon: 'wallet' }) : Badge('Fees clear', { tone: 'success', icon: 'check-circle' }),
        ],
        meta: [
          { label: 'Phone', value: p.phone, icon: 'phone' },
          { label: 'Email', value: p.email, icon: 'mail' },
          { label: 'Occupation', value: `${p.occupation} · ${p.organisation}`, icon: 'briefcase' },
          { label: 'Last login', value: p.portalActive ? relativeTime(p.lastLogin) : 'Never', icon: 'key' },
        ],
        actions: [
          MenuButton([
            { label: 'Link another child', icon: 'link', route: 'parents/link-children' },
            { label: 'Reset portal password', icon: 'key', onClick: () => notify({ title: 'Password reset link sent', text: p.email, tone: 'success' }) },
            { label: 'Download KYC pack', icon: 'download', onClick: () => notify({ title: 'KYC pack downloaded', tone: 'info' }) },
            { separator: true },
            { label: p.portalActive ? 'Suspend portal access' : 'Activate portal access', icon: 'lock', tone: p.portalActive ? 'danger' : undefined, onClick: () => notify({ title: p.portalActive ? 'Portal access suspended' : 'Portal access activated', tone: p.portalActive ? 'danger' : 'success' }) },
          ], { label: 'More actions' }),
          Button('Book PTM slot', { variant: 'ghost', icon: 'handshake', route: 'ptm/bookings' }),
          Button('Call', { variant: 'secondary', icon: 'phone', onClick: () => notify({ title: `Dialling ${p.phone}`, tone: 'info' }) }),
          Button('Send message', { variant: 'primary', icon: 'send', onClick: () => notify({ title: 'Compose opened', text: p.email, tone: 'info' }) }),
        ],
        tabs: [
          {
            id: 'overview', label: 'Overview', icon: 'dashboard',
            render: () => h('div', { className: 'stack' },
              kpiRow([
                { label: 'Children enrolled', value: formatNumber(kids.length), icon: 'graduation-cap', tone: 'brand' },
                { label: 'Family billing', value: moneyK(sum(kids, 'feeTotal')), icon: 'receipt', tone: 'info' },
                { label: 'Outstanding', value: money(totalDue), icon: 'wallet', tone: totalDue > 0 ? 'danger' : 'success' },
                { label: 'Average attendance', value: kids.length ? pctText(avg(kids, 'attendancePct')) : '—', icon: 'clipboard-check', tone: 'success' },
              ]),
              h('div', { className: 'widget-grid' },
                h('div', { className: 'span-7' },
                  SectionCard({ title: 'Children at a glance', icon: 'users' },
                    kids.length ? h('div', { className: 'stack-3' }, kids.map((c) => Card({ pad: true, className: 'card-interactive', onClick: () => goStudent(c.id) },
                      h('div', { className: 'row-3' },
                        Avatar(c.name, { size: 'lg' }),
                        h('div', { className: 'flex-1 min-0' },
                          h('div', { className: 't-semibold' }, c.name),
                          h('div', { className: 't-sm t-muted' }, `${c.className}-${c.section} · Roll ${c.rollNo} · ${c.house} House`),
                          h('div', { className: 'row row-wrap mt-2' },
                            Badge(c.status), Badge(c.feeStatus),
                            Badge(`${pctText(c.attendancePct)} attendance`, { tone: c.attendancePct >= 85 ? 'success' : 'warning' }))),
                        h('div', { className: 't-right' },
                          h('div', { className: 't-sm t-muted' }, 'Fee due'),
                          h('div', { className: c.feeDue > 0 ? 't-danger t-semibold' : 't-success t-semibold' }, money(c.feeDue)))))))
                      : EmptyState({ icon: 'link', title: 'No children linked', text: 'Link this guardian to a student so the portal shows the right records.', action: Button('Link children', { variant: 'primary', icon: 'link', route: 'parents/link-children' }) }))),
                h('div', { className: 'span-5' },
                  SectionCard({ title: 'Family fee position', className: 'chart-card', icon: 'wallet' },
                    donutChart({
                      data: [{ key: 'Paid', value: sum(kids, 'feePaid') }, { key: 'Outstanding', value: totalDue }],
                      height: 240, centerLabel: 'Billed', centerValue: moneyK(sum(kids, 'feeTotal')),
                      valueFormat: 'currency', title: 'Family fee position',
                    }))),
                h('div', { className: 'span-6' },
                  SectionCard({ title: 'Engagement', icon: 'activity' },
                    h('div', { className: 'stack-2' },
                      MetricRow('Portal status', Badge(p.portalActive ? 'Active' : 'Suspended')),
                      MetricRow('Last login', p.portalActive ? formatDateTime(p.lastLogin) : 'Never'),
                      MetricRow('PTM meetings booked', formatNumber(bookings.length)),
                      MetricRow('Feedback / complaints', formatNumber(feedback.length)),
                      MetricRow('Payments made', formatNumber(payments.length))))),
                h('div', { className: 'span-6' },
                  SectionCard({ title: 'Recent payments', icon: 'receipt' },
                    payments.length ? RankList(sortBy(payments, 'date', 'desc').slice(0, 5).map((x) => ({
                      name: x.receiptNo, meta: `${formatDate(x.date)} · ${x.mode}`, value: money(x.amount),
                    }))) : EmptyState({ icon: 'receipt', title: 'No payments recorded' }))))),
          },
          {
            id: 'children', label: 'Children', icon: 'graduation-cap', count: kids.length,
            render: () => (kids.length ? SectionCard({ title: 'Linked students', icon: 'users', flush: true },
              DataTable({
                columns: studentColumns({ compact: true }),
                rows: kids, paginate: false, footerAggregates: true, exportName: 'linked-children',
                onRowClick: (r) => goStudent(r.id),
                rowActions: (r) => [
                  { label: 'Open 360 profile', icon: 'id-card', route: `students/profile/${r.id}` },
                  { label: 'Unlink child', icon: 'x', tone: 'danger', onClick: () => ConfirmDialog({ title: `Unlink ${r.name}?`, text: 'The guardian loses portal visibility of this student.', confirmLabel: 'Unlink', tone: 'danger' }).then((ok) => ok && notify({ title: 'Child unlinked', tone: 'danger' })) },
                ],
              })) : emptyTab('link', 'No children linked', 'Link this guardian to a student record.', Button('Link children', { variant: 'primary', icon: 'link', route: 'parents/link-children' }))),
          },
          {
            id: 'contact', label: 'Contact & KYC', icon: 'id-card',
            render: () => h('div', { className: 'stack' },
              SectionCard({ title: 'Contact', icon: 'phone' },
                DescriptionList([
                  ['Full name', p.name], ['Relation', p.relation], ['Gender', p.gender],
                  ['Phone', p.phone], ['Alternate phone', p.altPhone || '—'], ['Email', p.email],
                  ['Address', `${p.address.line1}, ${p.address.line2}`],
                  ['City', p.address.city], ['State', p.address.state], ['PIN code', p.address.pincode],
                ], { cols: 2 })),
              SectionCard({ title: 'Profession & KYC', icon: 'briefcase' },
                DescriptionList([
                  ['Occupation', p.occupation], ['Organisation', p.organisation],
                  ['Qualification', p.qualification], ['Annual income', money(p.annualIncome)],
                  ['Aadhaar', p.aadhaarMasked], ['PAN', p.panMasked],
                ], { cols: 2 })),
              Callout({ tone: 'info', icon: 'shield', title: 'Data protection' },
                'Aadhaar and PAN are masked for every role except Super Admin. Full values are visible only in the KYC pack, and every access is written to the audit log.')),
          },
          {
            id: 'fees', label: 'Fees', icon: 'wallet', count: invoices.length,
            render: () => (invoices.length ? h('div', { className: 'stack' },
              kpiRow([
                { label: 'Billed', value: money(sum(kids, 'feeTotal')), icon: 'receipt', tone: 'info' },
                { label: 'Paid', value: money(sum(kids, 'feePaid')), icon: 'wallet', tone: 'success' },
                { label: 'Outstanding', value: money(totalDue), icon: 'alert-circle', tone: totalDue > 0 ? 'danger' : 'success' },
                { label: 'Receipts', value: formatNumber(payments.length), icon: 'file-text', tone: 'brand' },
              ]),
              SectionCard({ title: 'Invoices across all children', icon: 'receipt', flush: true },
                DataTable({
                  columns: [
                    { key: 'invoiceNo', label: 'Invoice', width: 150, sticky: true },
                    { key: 'studentName', label: 'Student', width: 190 },
                    { key: 'period', label: 'Period', width: 130, filter: true },
                    { key: 'dueDate', label: 'Due', width: 130, render: (r) => formatDate(r.dueDate), value: (r) => r.dueDate },
                    { key: 'amount', label: 'Amount', width: 130, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.amount) },
                    { key: 'paid', label: 'Paid', width: 130, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.paid) },
                    { key: 'balance', label: 'Balance', width: 130, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => h('span', { className: r.balance > 0 ? 't-danger t-num' : 't-num' }, money(r.balance)) },
                    { key: 'status', label: 'Status', width: 110, filter: true, render: (r) => Badge(r.status) },
                  ],
                  rows: invoices, pageSize: 10, footerAggregates: true, exportName: 'family-invoices',
                })),
              SectionCard({ title: 'Receipts', icon: 'file-text', flush: true },
                DataTable({
                  columns: [
                    { key: 'receiptNo', label: 'Receipt', width: 150, sticky: true },
                    { key: 'studentName', label: 'Student', width: 190 },
                    { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date), value: (r) => r.date },
                    { key: 'amount', label: 'Amount', width: 140, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.amount) },
                    { key: 'mode', label: 'Mode', width: 130, filter: true },
                    { key: 'status', label: 'Status', width: 110, render: (r) => Badge(r.status) },
                  ],
                  rows: payments, pageSize: 10, footerAggregates: true, exportName: 'family-receipts',
                })))
              : emptyTab('wallet', 'No invoices yet', 'Fee structures have not been billed to this family.')),
          },
          {
            id: 'meetings', label: 'PTM & meetings', icon: 'handshake', count: bookings.length,
            render: () => (bookings.length ? SectionCard({ title: 'Parent-teacher meetings', icon: 'handshake', flush: true },
              DataTable({
                columns: [
                  { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date), value: (r) => r.date },
                  { key: 'time', label: 'Time', width: 100 },
                  { key: 'studentName', label: 'Student', width: 190 },
                  { key: 'teacherName', label: 'Teacher', width: 200 },
                  { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
                  { key: 'rating', label: 'Rating', width: 140, render: (r) => (r.rating ? Rating(r.rating, { showValue: true }) : '—'), value: (r) => r.rating || 0 },
                  { key: 'notes', label: 'Notes' },
                ],
                rows: bookings, pageSize: 10, exportName: 'ptm-bookings',
              }))
              : emptyTab('handshake', 'No PTM bookings', 'This guardian has not booked a parent-teacher slot yet.', Button('Open PTM schedule', { variant: 'primary', icon: 'calendar', route: 'ptm/schedule' }))),
          },
          {
            id: 'feedback', label: 'Feedback', icon: 'message-circle', count: feedback.length,
            render: () => (feedback.length ? SectionCard({ title: 'Feedback & complaints raised', icon: 'message-circle', flush: true },
              DataTable({
                columns: [
                  { key: 'ticketNo', label: 'Ticket', width: 130, sticky: true },
                  { key: 'subject', label: 'Subject', width: 260 },
                  { key: 'category', label: 'Category', width: 160, filter: true },
                  { key: 'priority', label: 'Priority', width: 120, filter: true, render: (r) => Badge(r.priority) },
                  { key: 'createdAt', label: 'Raised', width: 150, render: (r) => formatDate(r.createdAt), value: (r) => r.createdAt },
                  { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
                  { key: 'satisfaction', label: 'Satisfaction', width: 140, render: (r) => (r.satisfaction ? Rating(r.satisfaction, { showValue: true }) : '—'), value: (r) => r.satisfaction || 0 },
                ],
                rows: feedback, pageSize: 10, exportName: 'parent-feedback',
              }))
              : emptyTab('message-circle', 'No feedback on record', 'This guardian has not raised a ticket or submitted feedback.')),
          },
          {
            id: 'portal', label: 'Portal access', icon: 'key',
            render: () => h('div', { className: 'stack' },
              SectionCard({ title: 'Portal account', icon: 'key' },
                DescriptionList([
                  ['Username', p.email], ['Status', Badge(p.portalActive ? 'Active' : 'Suspended')],
                  ['Last login', p.portalActive ? formatDateTime(p.lastLogin) : 'Never'],
                  ['Children visible', String(kids.length)],
                  ['Two-factor', p.portalActive ? 'SMS OTP' : 'Not configured'],
                  ['Registered mobile', p.phone],
                ], { cols: 2 })),
              SectionCard({ title: 'Actions', icon: 'settings' },
                h('div', { className: 'row row-wrap' },
                  Button('Send password reset', { variant: 'secondary', icon: 'key', onClick: () => notify({ title: 'Reset link sent', text: p.email, tone: 'success' }) }),
                  Button('Resend portal invite', { variant: 'secondary', icon: 'send', onClick: () => notify({ title: 'Invite re-sent', tone: 'success' }) }),
                  Button(p.portalActive ? 'Suspend access' : 'Activate access', {
                    variant: p.portalActive ? 'danger' : 'success', icon: 'lock',
                    onClick: () => ConfirmDialog({
                      title: p.portalActive ? 'Suspend portal access?' : 'Activate portal access?',
                      text: p.portalActive ? 'The guardian will be signed out of every device immediately.' : 'The guardian receives an activation email.',
                      confirmLabel: p.portalActive ? 'Suspend' : 'Activate', tone: p.portalActive ? 'danger' : 'brand',
                    }).then((ok) => ok && notify({ title: p.portalActive ? 'Access suspended' : 'Access activated', tone: p.portalActive ? 'danger' : 'success' })),
                  }))),
              SectionCard({ title: 'Recent portal activity', icon: 'history' },
                ActivityFeed([
                  { name: p.name, text: 'signed in to the parent portal', time: relativeTime(p.lastLogin), icon: 'log-in', tone: 'brand' },
                  { name: p.name, text: `viewed the fee ledger for ${kids[0] ? kids[0].name : 'their child'}`, time: '2 days ago', icon: 'wallet', tone: 'info' },
                  { name: p.name, text: 'downloaded the Periodic Test 1 report card', time: '6 days ago', icon: 'download', tone: 'success' },
                  { name: p.name, text: 'acknowledged the circular “Annual Day rehearsal schedule”', time: '9 days ago', icon: 'scroll', tone: 'neutral' },
                ]))),
          },
        ],
        sidebar: [
          SectionCard({ title: 'Contact', icon: 'phone' },
            h('div', null,
              railLine('phone', 'Primary phone', phoneLink(p.phone, p.name)),
              p.altPhone ? railLine('phone-call', 'Alternate', phoneLink(p.altPhone, p.name)) : null,
              railLine('mail', 'Email', mailLink(p.email, p.name)),
              railLine('map-pin', 'Address', `${p.address.line1}, ${p.address.city} ${p.address.pincode}`))),
          SectionCard({ title: 'Children', icon: 'graduation-cap' },
            kids.length ? h('div', { className: 'stack-2' }, kids.map((c) => Identity(c.name, `${c.className}-${c.section} · ${money(c.feeDue)} due`, { onClick: () => goStudent(c.id) })))
              : h('div', { className: 't-sm t-muted' }, 'No linked children.')),
          SectionCard({ title: 'Family summary', icon: 'wallet' },
            h('div', { className: 'stack-2' },
              MetricRow('Billed', moneyK(sum(kids, 'feeTotal'))),
              MetricRow('Paid', moneyK(sum(kids, 'feePaid'))),
              MetricRow('Outstanding', h('span', { className: totalDue > 0 ? 't-danger t-semibold' : 't-success t-semibold' }, money(totalDue))),
              MetricRow('Avg attendance', kids.length ? pctText(avg(kids, 'attendancePct')) : '—'),
              Button('Collect fee', { variant: 'secondary', block: true, icon: 'credit-card', route: 'fees/collection' }))),
        ],
        timeline: [
          { title: 'Portal login', meta: relativeTime(p.lastLogin), text: 'Signed in from a mobile device.', icon: 'log-in', tone: 'brand' },
          bookings.length ? { title: 'PTM booked', meta: formatDate(bookings[0].date), text: `Slot with ${bookings[0].teacherName}.`, icon: 'handshake', tone: 'info' } : null,
          payments.length ? { title: 'Fee payment', meta: formatDate(sortBy(payments, 'date', 'desc')[0].date), text: `${money(sortBy(payments, 'date', 'desc')[0].amount)} received.`, icon: 'wallet', tone: 'success' } : null,
          feedback.length ? { title: 'Feedback raised', meta: formatDate(feedback[0].createdAt), text: feedback[0].subject, icon: 'message-circle', tone: 'warning' } : null,
        ].filter(Boolean),
      }));
    },
  },

  /* ---------------------------------------------------- link children --- */
  'parents/link-children': {
    title: 'Link Children',
    subtitle: 'Attach students to a guardian record',
    section: 'parents',
    render(mount, ctx) {
      injectStyles();
      const parents = scopedParents(ctx);
      const students = scopedStudents(ctx);
      const stateBag = { parentId: parents[0] ? parents[0].id : '', pending: new Set(), query: '' };

      const linkedHost = h('div', { className: 'stack-2' });
      const candidateHost = h('div', { className: 'pick-list' });
      const headerHost = h('div');

      const currentParent = () => byId(db.parents, stateBag.parentId);

      const paintLinked = () => {
        const p = currentParent();
        linkedHost.innerHTML = '';
        headerHost.innerHTML = '';
        if (!p) {
          linkedHost.appendChild(EmptyState({ icon: 'user', title: 'Choose a guardian', text: 'Pick a guardian on the left to manage their linked children.' }));
          return;
        }
        headerHost.appendChild(h('div', { className: 'row-3' },
          Avatar(p.name, { size: 'lg' }),
          h('div', { className: 'flex-1 min-0' },
            h('div', { className: 't-semibold' }, p.name),
            h('div', { className: 't-sm t-muted' }, `${p.relation} · ${p.phone} · ${p.email}`)),
          Button('Open profile', { variant: 'ghost', size: 'sm', icon: 'external-link', onClick: () => goParent(p.id) })));

        const kids = childrenOf(p);
        if (!kids.length) {
          linkedHost.appendChild(EmptyState({ icon: 'link', title: 'No children linked yet', text: 'Search on the right and link the first student to this guardian.' }));
        } else {
          for (const c of kids) {
            linkedHost.appendChild(Card({ pad: true },
              h('div', { className: 'row-3' },
                Avatar(c.name, { size: 'md' }),
                h('div', { className: 'flex-1 min-0' },
                  h('div', { className: 't-medium' }, c.name),
                  h('div', { className: 't-xs t-muted' }, `${c.admissionNo} · ${c.className}-${c.section} · ${c.house} House`)),
                Badge(c.status),
                IconButton('external-link', { label: `Open ${c.name}`, size: 'sm', onClick: () => goStudent(c.id) }),
                IconButton('x', {
                  label: `Unlink ${c.name}`, size: 'sm',
                  onClick: () => ConfirmDialog({
                    title: `Unlink ${c.name} from ${p.name}?`,
                    text: 'The guardian immediately loses portal visibility of this student. Fee liability is unaffected.',
                    confirmLabel: 'Unlink', tone: 'danger', icon: 'x-circle',
                  }).then((ok) => ok && notify({ title: 'Child unlinked', text: `${c.name} · ${p.name}`, tone: 'danger' })),
                }))));
          }
        }
        for (const sid of stateBag.pending) {
          const c = byId(db.students, sid);
          if (!c) continue;
          linkedHost.appendChild(Card({ pad: true, className: 'card-accent' },
            h('div', { className: 'row-3' },
              Avatar(c.name, { size: 'md' }),
              h('div', { className: 'flex-1 min-0' },
                h('div', { className: 't-medium' }, c.name),
                h('div', { className: 't-xs t-muted' }, `${c.admissionNo} · ${c.className}-${c.section}`)),
              Badge('New', { tone: 'info' }),
              IconButton('x', { label: `Remove ${c.name}`, size: 'sm', onClick: () => { stateBag.pending.delete(sid); paintLinked(); paintCandidates(); } }))));
        }
      };

      const paintCandidates = () => {
        const p = currentParent();
        const linkedIds = new Set(p ? p.studentIds : []);
        const q = stateBag.query.trim().toLowerCase();
        const list = students.filter((s) => !linkedIds.has(s.id) && !stateBag.pending.has(s.id)
          && (!q || `${s.name} ${s.admissionNo} ${s.className} ${s.fatherName}`.toLowerCase().includes(q))).slice(0, 60);
        candidateHost.innerHTML = '';
        if (!list.length) {
          candidateHost.appendChild(EmptyState({ icon: 'search', title: 'No students found', text: 'Search by name, admission number or class.' }));
          return;
        }
        for (const s of list) {
          candidateHost.appendChild(h('button', {
            className: 'pick-item', type: 'button',
            attrs: { 'aria-pressed': 'false', 'aria-label': `Link ${s.name}` },
            onClick: () => { stateBag.pending.add(s.id); paintLinked(); paintCandidates(); },
          },
            Avatar(s.name, { size: 'sm' }),
            h('div', { className: 'flex-1 min-0' },
              h('div', { className: 't-sm t-medium t-truncate' }, s.name),
              h('div', { className: 't-xs t-muted t-truncate' }, `${s.admissionNo} · ${s.className}-${s.section} · father ${s.fatherName}`)),
            Icon('plus', 15)));
        }
      };

      paintLinked();
      paintCandidates();

      const parentPicker = Combobox({
        options: parents.slice(0, 800).map((p) => ({ value: p.id, label: `${p.name} · ${p.relation} · ${p.phone}` })),
        value: stateBag.parentId, placeholder: 'Search a guardian by name or phone…',
        onChange: (v) => { stateBag.parentId = v; stateBag.pending.clear(); paintLinked(); paintCandidates(); },
      });

      const unlinked = students.filter((s) => !db.parents.some((p) => p.studentIds.includes(s.id)));

      mount.appendChild(page({
        title: 'Link Children',
        subtitle: `Attach students to guardian records · ${scopeLabel(ctx)}`,
        route: 'parents/link-children',
        actions: [
          Button('Parent directory', { variant: 'secondary', icon: 'users', route: 'parents/directory' }),
          Button('Save links', {
            variant: 'primary', icon: 'check',
            onClick: () => {
              const p = currentParent();
              if (!p) { notify({ title: 'Choose a guardian first', tone: 'warning' }); return; }
              if (!stateBag.pending.size) { notify({ title: 'Nothing to save', text: 'Add at least one student to link.', tone: 'info' }); return; }
              notify({ title: `${stateBag.pending.size} child(ren) linked to ${p.name}`, text: 'Demo only — nothing was persisted.', tone: 'success' });
              stateBag.pending.clear(); paintLinked(); paintCandidates();
            },
          }),
        ],
        children: [
          kpiRow([
            { label: 'Guardians', value: formatNumber(parents.length), icon: 'users', tone: 'brand' },
            { label: 'Students', value: formatNumber(students.length), icon: 'graduation-cap', tone: 'info' },
            { label: 'Students without a guardian record', value: formatNumber(unlinked.length), icon: 'user-x', tone: 'warning' },
            { label: 'Families with siblings', value: formatNumber(parents.filter((p) => (p.studentIds || []).length > 1).length), icon: 'link', tone: 'success' },
          ]),
          Callout({ tone: 'info', icon: 'info', title: 'How linking works' },
            'A guardian sees fees, attendance, homework and report cards for every linked child in one portal login. Siblings linked to the same guardian are automatically eligible for the family discount.'),
          h('div', { className: 'link-split' },
            SectionCard({ title: 'Guardian', subtitle: 'Search and select the guardian record', icon: 'user' },
              h('div', { className: 'stack-4' },
                Field({ label: 'Guardian', required: true }, parentPicker),
                headerHost,
                Divider({ label: 'Linked children' }),
                linkedHost)),
            SectionCard({ title: 'Add a child', subtitle: 'Click a student to stage the link', icon: 'search' },
              h('div', { className: 'stack-3' },
                SearchInput({
                  placeholder: 'Search students by name, admission number or class…', width: '100%',
                  onInput: (v) => { stateBag.query = v; paintCandidates(); },
                }),
                candidateHost))),
          SectionCard({ title: 'Students without a linked guardian record', subtitle: `${formatNumber(unlinked.length)} students`, icon: 'user-x', flush: true },
            DataTable({
              columns: studentColumns({ compact: true }).concat([
                { key: 'fatherName', label: 'Father on admission form', width: 200 },
                { key: 'emergencyContact', label: 'Contact', width: 150 },
              ]),
              rows: unlinked, pageSize: 10, exportName: 'unlinked-students',
              searchKeys: ['name', 'admissionNo', 'fatherName'],
              onRowClick: (r) => goStudent(r.id),
              emptyState: EmptyState({ icon: 'check-circle', title: 'Every student has a guardian', text: 'All enrolled students are linked to at least one parent record.' }),
            })),
        ],
      }));
    },
  },

  /* ------------------------------------------------------------ logins --- */
  'parents/logins': {
    title: 'Parent Logins',
    subtitle: 'Portal accounts, adoption and access control',
    section: 'parents',
    render(mount, ctx) {
      injectStyles();
      const all = scopedParents(ctx);
      const active = all.filter((p) => p.portalActive);
      const history = db.loginHistory.filter((l) => /parent/i.test(String(l.role)));
      const f = { tab: 'all' };
      let node;
      const select = () => all.filter((p) => {
        if (f.portal === 'Active' && !p.portalActive) return false;
        if (f.portal === 'Suspended' && p.portalActive) return false;
        if (f.tab === 'active') return p.portalActive;
        if (f.tab === 'inactive') return !p.portalActive;
        if (f.tab === 'stale') return p.portalActive && p.lastLogin < '2026-07-15';
        return true;
      });

      node = listPage({
        title: 'Parent Logins',
        subtitle: `${formatNumber(active.length)} of ${formatNumber(all.length)} guardians have portal access · ${scopeLabel(ctx)}`,
        route: 'parents/logins',
        actions: [
          Button('Login history', { variant: 'ghost', icon: 'history', onClick: () => Drawer({
            title: 'Parent portal login history', size: 'lg',
            subtitle: `${formatNumber(history.length)} sign-in attempts recorded`,
            body: history.length ? DataTable({
              columns: [
                { key: 'userName', label: 'User', width: 190, sticky: true },
                { key: 'timestamp', label: 'When', width: 180, render: (r) => formatDateTime(r.timestamp), value: (r) => r.timestamp },
                { key: 'ip', label: 'IP', width: 140 },
                { key: 'location', label: 'Location', width: 160 },
                { key: 'device', label: 'Device', width: 160 },
                { key: 'result', label: 'Result', width: 120, filter: true, render: (r) => Badge(r.result) },
              ],
              rows: history, pageSize: 15, exportName: 'parent-login-history',
            }) : EmptyState({ icon: 'history', title: 'No parent sign-ins recorded', text: 'Login history appears once guardians start using the portal.' }),
          }) }),
          Button('Invite all pending', { variant: 'secondary', icon: 'send', onClick: () => notify({ title: `${all.length - active.length} portal invites queued`, tone: 'success' }) }),
          Button('Bulk reset passwords', { variant: 'primary', icon: 'key', onClick: () => ConfirmDialog({ title: 'Reset passwords for all selected guardians?', text: 'Each guardian receives a one-time reset link valid for 30 minutes.', confirmLabel: 'Send resets', tone: 'brand' }).then((ok) => ok && notify({ title: 'Reset links sent', tone: 'success' })) }),
        ],
        tabs: [
          { id: 'all', label: 'All accounts', count: all.length },
          { id: 'active', label: 'Active', count: active.length },
          { id: 'inactive', label: 'Not activated', count: all.length - active.length },
          { id: 'stale', label: 'Dormant 30+ days', count: active.filter((p) => p.lastLogin < '2026-07-15').length },
        ],
        activeTab: 'all',
        onTabChange: (id) => { f.tab = id; node.table.refresh(select()); },
        kpis: [
          { label: 'Portal accounts', value: formatNumber(all.length), icon: 'users', tone: 'brand' },
          { label: 'Activated', value: pctText((active.length / Math.max(1, all.length)) * 100), delta: 3.4, deltaLabel: 'vs last quarter', icon: 'key', tone: 'success' },
          { label: 'Dormant 30+ days', value: formatNumber(active.filter((p) => p.lastLogin < '2026-07-15').length), icon: 'clock', tone: 'warning' },
          { label: 'Never signed in', value: formatNumber(all.length - active.length), icon: 'user-x', tone: 'danger' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Guardian name or email…', width: '260px' },
          { id: 'portal', label: 'Status', options: ['Active', 'Suspended'] },
          { id: 'relation', label: 'Relation', options: uniq(all.map((p) => p.relation)) },
        ],
        onFilter: (id, value, allValues) => {
          Object.assign(f, allValues);
          const q = String(allValues.q || '').toLowerCase();
          node.table.refresh(select().filter((p) => !q || `${p.name} ${p.email}`.toLowerCase().includes(q))
            .filter((p) => !allValues.relation || allValues.relation === 'all' || p.relation === allValues.relation));
        },
        chart: donutChart({
          data: [{ key: 'Active', value: active.length }, { key: 'Never activated', value: all.length - active.length }],
          height: 220, centerLabel: 'Accounts', centerValue: formatNumber(all.length), title: 'Portal adoption',
        }),
        chartTitle: 'Portal adoption',
        columns: [
          { key: 'name', label: 'Guardian', sticky: true, width: 230, render: (r) => Identity(r.name, r.relation, { onClick: () => goParent(r.id) }), value: (r) => r.name },
          { key: 'email', label: 'Username (email)', width: 250 },
          { key: 'phone', label: 'Registered mobile', width: 160 },
          { key: 'childCount', label: 'Children', width: 110, align: 'right', numeric: true, value: (r) => (r.studentIds || []).length, render: (r) => String((r.studentIds || []).length), aggregate: 'sum' },
          { key: 'portalActive', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.portalActive ? 'Active' : 'Pending'), value: (r) => (r.portalActive ? 'Active' : 'Pending') },
          { key: 'lastLogin', label: 'Last login', width: 170, render: (r) => (r.portalActive ? `${formatDate(r.lastLogin)} · ${relativeTime(r.lastLogin)}` : 'Never'), value: (r) => r.lastLogin },
        ],
        rows: select(),
        selectable: true,
        pageSize: 25,
        searchKeys: ['name', 'email', 'phone'],
        exportName: 'parent-logins',
        bulkActions: [
          { label: 'Send portal invite', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} invites sent`, tone: 'success' }) },
          { label: 'Reset password', icon: 'key', onClick: (sel) => notify({ title: `${sel.length} reset links sent`, tone: 'success' }) },
          { label: 'Suspend access', icon: 'lock', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Suspend ${sel.length} accounts?`, text: 'Those guardians are signed out immediately.', confirmLabel: 'Suspend', tone: 'danger' }).then((ok) => ok && notify({ title: 'Accounts suspended', tone: 'danger' })) },
        ],
        rowActions: (r) => [
          { label: 'Open parent profile', icon: 'user', route: `parents/profile/${r.id}` },
          { label: 'Send reset link', icon: 'key', onClick: () => notify({ title: 'Reset link sent', text: r.email, tone: 'success' }) },
          { label: 'Resend invite', icon: 'send', onClick: () => notify({ title: 'Invite re-sent', text: r.email, tone: 'success' }) },
          { separator: true },
          { label: r.portalActive ? 'Suspend access' : 'Activate access', icon: 'lock', tone: r.portalActive ? 'danger' : undefined, onClick: () => notify({ title: r.portalActive ? 'Access suspended' : 'Access activated', text: r.name, tone: r.portalActive ? 'danger' : 'success' }) },
        ],
        onRowClick: (r) => goParent(r.id),
        emptyState: EmptyState({ icon: 'key', title: 'No accounts match', text: 'Try a different status filter.' }),
      });
      mount.appendChild(node);
    },
  },

  /* ---------------------------------------------------------- feedback --- */
  'parents/feedback': {
    title: 'Feedback',
    subtitle: 'What parents are telling the school',
    section: 'parents',
    render(mount, ctx) {
      injectStyles();
      const cid = ctx.state.campusId;
      const tickets = db.complaints.filter((c) => c.raisedBy === 'Parent' && (CAMPUS_ALL.has(cid) || c.campusId === cid));
      const ptm = db.ptmBookings.filter((b) => b.rating);
      const byCategory = countBy(tickets, 'category');
      const bySatisfaction = [1, 2, 3, 4, 5].map((n) => ({ key: `${n} star`, value: tickets.filter((t) => t.satisfaction === n).length }));
      const avgRating = ptm.length ? avg(ptm, 'rating') : 0;
      const f = { tab: 'all' };
      let node;
      const select = () => tickets.filter((t) => {
        if (f.category && f.category !== 'all' && t.category !== f.category) return false;
        if (f.status && f.status !== 'all' && t.status !== f.status) return false;
        if (f.priority && f.priority !== 'all' && t.priority !== f.priority) return false;
        if (f.tab === 'open') return t.status !== 'Resolved' && t.status !== 'Closed';
        if (f.tab === 'breached') return t.slaBreached;
        if (f.tab === 'resolved') return t.status === 'Resolved' || t.status === 'Closed';
        return true;
      });

      node = listPage({
        title: 'Parent Feedback',
        subtitle: `${formatNumber(tickets.length)} tickets raised by guardians · ${scopeLabel(ctx)}`,
        route: 'parents/feedback',
        actions: [
          Button('Complaint categories', { variant: 'ghost', icon: 'tag', route: 'complaints/categories' }),
          Button('Feedback report', { variant: 'secondary', icon: 'chart-bar', route: 'parents/reports' }),
          Button('Run a survey', { variant: 'primary', icon: 'clipboard-list', onClick: () => Modal({
            title: 'Launch a parent survey', size: 'md', icon: 'clipboard-list',
            body: h('div', { className: 'stack-3' },
              Field({ label: 'Survey title', required: true }, Input({ placeholder: 'e.g. Term 1 satisfaction survey' })),
              Field({ label: 'Audience', required: true }, Select({ options: ['All parents', 'Primary classes', 'Middle classes', 'Senior classes', 'Transport users', 'Hostel parents'], placeholder: 'Select…' })),
              Field({ label: 'Channel' }, SegmentedControl(['SMS', 'Email', 'WhatsApp', 'Portal'], () => {}, { active: 'Email' })),
              Field({ label: 'Closes on' }, DatePicker({ value: '2026-09-15', width: '100%' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'secondary', onClick: close }),
              Button('Launch survey', { variant: 'primary', icon: 'send', onClick: () => { close(); notify({ title: 'Survey launched', text: 'Invitations queued to guardians.', tone: 'success' }); } })),
          }) }),
        ],
        tabs: [
          { id: 'all', label: 'All', count: tickets.length },
          { id: 'open', label: 'Open', count: tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed').length },
          { id: 'breached', label: 'SLA breached', count: tickets.filter((t) => t.slaBreached).length },
          { id: 'resolved', label: 'Resolved', count: tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length },
        ],
        activeTab: 'all',
        onTabChange: (id) => { f.tab = id; node.table.refresh(select()); },
        kpis: [
          { label: 'Tickets from parents', value: formatNumber(tickets.length), icon: 'message-circle', tone: 'brand', trend: analytics.sparks.complaints },
          { label: 'Open', value: formatNumber(tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed').length), icon: 'inbox', tone: 'warning' },
          { label: 'SLA breached', value: formatNumber(tickets.filter((t) => t.slaBreached).length), icon: 'timer', tone: 'danger' },
          { label: 'PTM satisfaction', value: `${avgRating.toFixed(1)} / 5`, deltaLabel: `${formatNumber(ptm.length)} rated meetings`, icon: 'star', tone: 'success' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Ticket, subject or parent…', width: '260px' },
          { id: 'category', label: 'Category', options: uniq(tickets.map((t) => t.category)).sort() },
          { id: 'status', label: 'Status', options: uniq(tickets.map((t) => t.status)) },
          { id: 'priority', label: 'Priority', options: uniq(tickets.map((t) => t.priority)) },
        ],
        onFilter: (id, value, allValues) => {
          Object.assign(f, allValues);
          const q = String(allValues.q || '').toLowerCase();
          node.table.refresh(select().filter((t) => !q || `${t.ticketNo} ${t.subject} ${t.raisedByName}`.toLowerCase().includes(q)));
        },
        chart: h('div', { className: 'widget-grid' },
          h('div', { className: 'span-6' }, barChart({
            categories: byCategory.map((x) => x.key),
            series: [{ name: 'Tickets', values: byCategory.map((x) => x.value) }],
            horizontal: true, showValues: true, height: 260, title: 'Feedback by category',
          })),
          h('div', { className: 'span-6' }, barChart({
            categories: bySatisfaction.map((x) => x.key),
            series: [{ name: 'Responses', values: bySatisfaction.map((x) => x.value) }],
            showValues: true, height: 260, title: 'Satisfaction rating distribution',
          }))),
        chartTitle: 'Feedback analytics',
        columns: [
          { key: 'ticketNo', label: 'Ticket', sticky: true, width: 130 },
          { key: 'subject', label: 'Subject', width: 280 },
          { key: 'raisedByName', label: 'Raised by', width: 190 },
          { key: 'category', label: 'Category', width: 170, filter: true },
          { key: 'priority', label: 'Priority', width: 120, filter: true, render: (r) => Badge(r.priority) },
          { key: 'assignedToName', label: 'Owner', width: 180 },
          { key: 'ageHours', label: 'Age', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Number(v).toFixed(0)} h`, render: (r) => `${r.ageHours} h` },
          { key: 'slaBreached', label: 'SLA', width: 120, render: (r) => Badge(r.slaBreached ? 'Expired' : 'Active'), value: (r) => (r.slaBreached ? 'Breached' : 'Within') },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
          { key: 'satisfaction', label: 'Rating', width: 140, render: (r) => (r.satisfaction ? Rating(r.satisfaction) : '—'), value: (r) => r.satisfaction || 0 },
        ],
        rows: select(),
        selectable: true,
        pageSize: 25,
        searchKeys: ['ticketNo', 'subject', 'raisedByName', 'category'],
        exportName: 'parent-feedback',
        bulkActions: [
          { label: 'Assign owner', icon: 'user-check', onClick: (sel) => notify({ title: `${sel.length} tickets reassigned`, tone: 'info' }) },
          { label: 'Mark resolved', icon: 'check-circle', onClick: (sel) => notify({ title: `${sel.length} tickets resolved`, tone: 'success' }) },
        ],
        rowActions: (r) => [
          { label: 'Open ticket', icon: 'eye', route: 'complaints/all' },
          { label: 'Reply to parent', icon: 'send', onClick: () => notify({ title: 'Reply sent', text: r.raisedByName, tone: 'success' }) },
          { label: 'Escalate', icon: 'trending-up', tone: 'danger', onClick: () => notify({ title: 'Ticket escalated', text: r.ticketNo, tone: 'warning' }) },
        ],
        onRowClick: (r) => Drawer({
          title: r.subject, subtitle: `${r.ticketNo} · ${r.category} · raised ${relativeTime(r.createdAt)}`, size: 'lg',
          body: h('div', { className: 'stack' },
            h('div', { className: 'row row-wrap' }, Badge(r.status), Badge(r.priority), r.slaBreached ? Badge('SLA breached', { tone: 'danger' }) : Badge('Within SLA', { tone: 'success' })),
            DescriptionList([
              ['Raised by', r.raisedByName], ['Category', r.category], ['Department', r.department],
              ['Owner', r.assignedToName], ['Raised', formatDateTime(r.createdAt)],
              ['SLA', `${r.slaHours} hours`], ['Age', `${r.ageHours} hours`],
              ['Resolved', r.resolvedAt ? formatDateTime(r.resolvedAt) : 'Open'],
            ], { cols: 2 }),
            SectionCard({ title: 'Description', icon: 'message-square' }, h('div', { className: 't-secondary' }, r.description)),
            r.resolutionNote ? SectionCard({ title: 'Resolution', icon: 'check-circle' }, h('div', { className: 't-secondary' }, r.resolutionNote)) : null,
            r.satisfaction ? SectionCard({ title: 'Parent satisfaction', icon: 'star' }, Rating(r.satisfaction, { showValue: true })) : null),
          actions: (close) => frag(
            Button('Close', { variant: 'secondary', onClick: close }),
            Button('Reply to parent', { variant: 'primary', icon: 'send', onClick: () => { close(); notify({ title: 'Reply sent', text: r.raisedByName, tone: 'success' }); } })),
        }),
        emptyState: EmptyState({ icon: 'message-circle', title: 'No feedback matches', text: 'Try a different category or status.' }),
      });
      mount.appendChild(node);
    },
  },

  /* ----------------------------------------------------------- reports --- */
  'parents/reports': {
    title: 'Parent Reports',
    subtitle: 'Engagement, adoption and satisfaction',
    section: 'parents',
    render(mount, ctx) {
      injectStyles();
      const all = scopedParents(ctx);
      const students = scopedStudents(ctx);
      const tickets = db.complaints.filter((c) => c.raisedBy === 'Parent');
      const ptm = db.ptmBookings;

      const rows = uniq(students.map((s) => s.className)).map((className) => {
        const kids = students.filter((s) => s.className === className);
        const guardians = all.filter((p) => p.studentIds.some((id) => kids.some((k) => k.id === id)));
        const booked = ptm.filter((b) => kids.some((k) => k.id === b.studentId));
        return {
          id: className, className,
          students: kids.length,
          guardians: guardians.length,
          portalActive: guardians.filter((g) => g.portalActive).length,
          adoption: guardians.length ? (guardians.filter((g) => g.portalActive).length / guardians.length) * 100 : 0,
          ptmBooked: booked.length,
          ptmAttended: booked.filter((b) => b.status === 'Completed' || b.status === 'Attended').length,
          feedback: sum(guardians, 'feedbackCount'),
          avgIncome: guardians.length ? avg(guardians, 'annualIncome') : 0,
        };
      }).sort((a, b) => CLASS_ORDER(a.className) - CLASS_ORDER(b.className));

      mount.appendChild(reportPage({
        title: 'Parent Reports',
        subtitle: `Portal adoption, PTM participation and feedback · ${scopeLabel(ctx)}`,
        route: 'parents/reports',
        filters: [
          { id: 'campus', label: 'Campus', options: db.campuses.map((c) => ({ value: c.id, label: c.name })) },
          { id: 'relation', label: 'Relation', options: uniq(all.map((p) => p.relation)) },
          { id: 'portal', label: 'Portal', options: ['Active', 'Suspended'] },
        ],
        onFilter: (id, value, allValues, table) => {
          if (!table) return;
          table.refresh(rows.filter(() => true));
          notify({ title: 'Filters applied', text: 'Report recalculated for the selected scope.', tone: 'info' });
        },
        summary: [
          { label: 'Guardians', value: formatNumber(all.length), icon: 'users', tone: 'brand' },
          { label: 'Portal adoption', value: pctText((all.filter((p) => p.portalActive).length / Math.max(1, all.length)) * 100), delta: 3.4, icon: 'key', tone: 'success' },
          { label: 'PTM bookings', value: formatNumber(ptm.length), delta: 6.8, icon: 'handshake', tone: 'info' },
          { label: 'Feedback tickets', value: formatNumber(tickets.length), delta: -4.2, icon: 'message-circle', tone: 'warning', trend: analytics.sparks.complaints },
        ],
        chart: [
          barChart({
            categories: rows.map((r) => r.className),
            series: [
              { name: 'Guardians', values: rows.map((r) => r.guardians) },
              { name: 'Portal active', values: rows.map((r) => r.portalActive) },
            ],
            height: 280, title: 'Portal adoption by class',
          }),
          lineChart({
            categories: analytics.complaintTrend.map((r) => r.month),
            series: [
              { name: 'Raised', values: analytics.complaintTrend.map((r) => r.raised) },
              { name: 'Resolved', values: analytics.complaintTrend.map((r) => r.resolved) },
            ],
            height: 260, showDots: true, title: 'Parent complaint trend',
          }),
          donutChart({
            data: [
              { key: 'Activated', value: all.filter((p) => p.portalActive).length },
              { key: 'Never activated', value: all.filter((p) => !p.portalActive).length },
            ],
            height: 260, centerLabel: 'Accounts', centerValue: formatNumber(all.length), title: 'Portal accounts',
          }),
        ],
        chartTitle: 'Portal adoption by class',
        columns: [
          { key: 'className', label: 'Class', sticky: true, width: 140 },
          { key: 'students', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'guardians', label: 'Guardians', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'portalActive', label: 'Portal active', width: 140, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'adoption', label: 'Adoption', width: 130, align: 'right', numeric: true, aggregate: 'avg', format: (v) => pctText(v), render: (r) => h('div', { className: 'row', style: { justifyContent: 'flex-end', gap: 'var(--sp-2)' } }, h('span', { className: 't-num' }, pctText(r.adoption)), h('span', { style: { width: '54px' } }, ProgressBar(r.adoption, { tone: r.adoption >= 85 ? 'success' : 'warning', size: 'sm' }))) },
          { key: 'ptmBooked', label: 'PTM booked', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'ptmAttended', label: 'PTM attended', width: 140, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'feedback', label: 'Feedback', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'avgIncome', label: 'Avg family income', width: 170, align: 'right', numeric: true, aggregate: 'avg', format: (v) => moneyK(v), render: (r) => moneyK(r.avgIncome) },
        ],
        rows,
        tableTitle: 'Class-wise parent engagement',
        footerAggregates: true,
        notes: Callout({ tone: 'info', icon: 'lightbulb', title: 'Reading this report' },
          'Adoption below 80% in any class usually means the guardian email on the admission form is missing or wrong. Use Parent Logins → “Invite all pending” after correcting the directory.'),
      }));
    },
  },
};

/* ============================================================ ALUMNI PAGES */

function scopedAlumni(ctx) {
  const cid = ctx && ctx.state ? ctx.state.campusId : store.get('campusId');
  return CAMPUS_ALL.has(cid) ? db.alumni : db.alumni.filter((a) => a.campusId === cid);
}

/** Deterministic career timeline for one alumnus, built from their own record. */
function careerTimeline(a) {
  const gradYear = a.batch;
  const items = [
    { title: `Graduated — ${a.batchLabel}`, meta: `${gradYear} · ${a.stream} stream`, text: `Passed out of ${campusName(a.campusId)} with admission number ${a.admissionNo}.`, icon: 'graduation-cap', tone: 'brand' },
    { title: `Joined ${a.university}`, meta: `${gradYear} – ${gradYear + 4}`, text: `Read for a ${a.degree}.`, icon: 'book-open', tone: 'info' },
    { title: `First role · ${a.currentCompany}`, meta: `${gradYear + 4}`, text: `Started as a ${a.designation} based in ${a.city}.`, icon: 'briefcase', tone: 'success' },
  ];
  if (a.donationTotal > 0) items.push({ title: 'Supported the school', meta: formatDate(a.lastContact), text: `Contributed ${money(a.donationTotal)} to the alumni fund.`, icon: 'gift', tone: 'warning' });
  if (a.mentorAvailable) items.push({ title: 'Joined the mentor panel', meta: formatDate(a.lastContact), text: 'Available for career mentoring and the annual counselling fair.', icon: 'handshake', tone: 'brand' });
  if (a.eventsAttended) items.push({ title: 'Alumni engagement', meta: '2026', text: `Attended ${a.eventsAttended} alumni events since graduating.`, icon: 'calendar-check', tone: 'info' });
  return items;
}

const alumniRoutes = {
  /* --------------------------------------------------------- directory --- */
  'alumni/directory': {
    title: 'Alumni Directory',
    subtitle: 'Every Springdale alumnus on record',
    section: 'alumni',
    render(mount, ctx) {
      injectStyles();
      const all = scopedAlumni(ctx);
      const f = { tab: 'all', batch: (ctx.query && ctx.query.batch) || 'all' };
      let node;
      const select = () => all.filter((a) => {
        const q = String(f.q || '').trim().toLowerCase();
        if (q && !`${a.name} ${a.currentCompany} ${a.designation} ${a.university} ${a.city}`.toLowerCase().includes(q)) return false;
        if (f.batch && f.batch !== 'all' && String(a.batch) !== String(f.batch)) return false;
        if (f.stream && f.stream !== 'all' && a.stream !== f.stream) return false;
        if (f.city && f.city !== 'all' && a.city !== f.city) return false;
        if (f.company && f.company !== 'all' && a.currentCompany !== f.company) return false;
        if (f.verified === 'Verified' && !a.verified) return false;
        if (f.verified === 'Unverified' && a.verified) return false;
        if (f.tab === 'mentors') return a.mentorAvailable;
        if (f.tab === 'donors') return a.donationTotal > 0;
        if (f.tab === 'unverified') return !a.verified;
        if (f.tab === 'abroad') return ['San Francisco', 'London', 'Singapore', 'Dubai', 'Toronto'].includes(a.city);
        return true;
      });
      const batches = uniq(all.map((a) => a.batch)).sort((x, y) => y - x);
      const perBatch = batches.slice(0, 18).map((b) => ({ key: String(b), value: all.filter((a) => a.batch === b).length })).reverse();

      node = listPage({
        title: 'Alumni Directory',
        subtitle: `${formatNumber(all.length)} alumni across ${batches.length} batches · ${campusName(ctx.state.campusId)}`,
        route: 'alumni/directory',
        actions: [
          MenuButton([
            { label: 'Batches', icon: 'layers', route: 'alumni/batches' },
            { label: 'Careers', icon: 'briefcase', route: 'alumni/careers' },
            { label: 'Donations', icon: 'gift', route: 'alumni/donations' },
            { label: 'Success stories', icon: 'sparkles', route: 'alumni/stories' },
          ], { label: 'More actions' }),
          Button('Alumni events', { variant: 'secondary', icon: 'calendar-check', route: 'alumni/events' }),
          Button('Send a broadcast', { variant: 'primary', icon: 'megaphone', route: 'alumni/communication' }),
        ],
        tabs: [
          { id: 'all', label: 'All alumni', count: all.length },
          { id: 'mentors', label: 'Mentors available', count: all.filter((a) => a.mentorAvailable).length },
          { id: 'donors', label: 'Donors', count: all.filter((a) => a.donationTotal > 0).length },
          { id: 'abroad', label: 'Overseas', count: all.filter((a) => ['San Francisco', 'London', 'Singapore', 'Dubai', 'Toronto'].includes(a.city)).length },
          { id: 'unverified', label: 'Unverified', count: all.filter((a) => !a.verified).length },
        ],
        activeTab: 'all',
        onTabChange: (id) => { f.tab = id; node.table.refresh(select()); },
        kpis: [
          { label: 'Alumni on record', value: formatNumber(all.length), icon: 'award', tone: 'brand' },
          { label: 'Verified contacts', value: pctText((all.filter((a) => a.verified).length / Math.max(1, all.length)) * 100), icon: 'shield-check', tone: 'success' },
          { label: 'Mentors available', value: formatNumber(all.filter((a) => a.mentorAvailable).length), icon: 'handshake', tone: 'info' },
          { label: 'Lifetime donations', value: moneyK(sum(all, 'donationTotal')), icon: 'gift', tone: 'warning' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Name, employer, university or city…', width: '260px' },
          { id: 'batch', label: 'Batch', options: batches.map((b) => ({ value: String(b), label: `Batch of ${b}` })) },
          { id: 'stream', label: 'Stream', options: uniq(all.map((a) => a.stream)) },
          { id: 'city', label: 'City', options: uniq(all.map((a) => a.city)).sort() },
          { id: 'company', label: 'Employer', options: uniq(all.map((a) => a.currentCompany)).sort() },
          { id: 'verified', label: 'Contact', options: ['Verified', 'Unverified'] },
        ],
        onFilter: (id, value, allValues) => { Object.assign(f, allValues); node.table.refresh(select()); },
        chart: barChart({
          categories: perBatch.map((x) => x.key),
          series: [{ name: 'Alumni', values: perBatch.map((x) => x.value) }],
          height: 220, title: 'Alumni per graduating batch',
        }),
        chartTitle: 'Alumni per graduating batch',
        chartActions: Button('Open batches', { variant: 'link', size: 'sm', route: 'alumni/batches' }),
        columns: [
          { key: 'name', label: 'Alumnus', sticky: true, width: 240, render: (r) => Identity(r.name, `${r.batchLabel} · ${r.stream}`, { onClick: () => goAlumnus(r.id) }), value: (r) => r.name },
          { key: 'batch', label: 'Batch', width: 100, align: 'right', numeric: true, filter: true },
          { key: 'university', label: 'University', width: 220, filter: true },
          { key: 'degree', label: 'Degree', width: 130, filter: true },
          { key: 'currentCompany', label: 'Employer', width: 200, filter: true },
          { key: 'designation', label: 'Designation', width: 190 },
          { key: 'city', label: 'City', width: 150, filter: true },
          { key: 'phone', label: 'Phone', width: 150, hidden: true },
          { key: 'email', label: 'Email', width: 240, hidden: true },
          { key: 'mentorAvailable', label: 'Mentor', width: 110, render: (r) => (r.mentorAvailable ? Badge('Available', { tone: 'success' }) : h('span', { className: 't-muted' }, '—')), value: (r) => (r.mentorAvailable ? 'Yes' : 'No') },
          { key: 'donationTotal', label: 'Donations', width: 140, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => (r.donationTotal ? money(r.donationTotal) : h('span', { className: 't-muted' }, '—')) },
          { key: 'eventsAttended', label: 'Events', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'verified', label: 'Contact', width: 120, render: (r) => Badge(r.verified ? 'Verified' : 'Pending'), value: (r) => (r.verified ? 'Verified' : 'Pending') },
        ],
        rows: select(),
        selectable: true,
        footerAggregates: true,
        pageSize: 25,
        searchKeys: ['name', 'currentCompany', 'university', 'city', 'designation'],
        exportName: 'alumni-directory',
        bulkActions: [
          { label: 'Invite to an event', icon: 'calendar-check', onClick: (sel) => notify({ title: `${sel.length} invitations queued`, tone: 'success' }) },
          { label: 'Request a donation', icon: 'gift', onClick: (sel) => notify({ title: `Fundraising appeal queued for ${sel.length} alumni`, tone: 'info' }) },
          { label: 'Add to mentor panel', icon: 'handshake', onClick: (sel) => notify({ title: `${sel.length} alumni added to the mentor panel`, tone: 'success' }) },
          { label: 'Export selection', icon: 'download', onClick: (sel) => { download('alumni.csv', toCsv(sel, [{ key: 'name', label: 'Name' }, { key: 'batch', label: 'Batch' }, { key: 'currentCompany', label: 'Employer' }, { key: 'city', label: 'City' }, { key: 'email', label: 'Email' }]), 'text/csv;charset=utf-8'); notify({ title: 'Selection exported', tone: 'success' }); } },
        ],
        rowActions: (r) => [
          { label: 'Open alumni profile', icon: 'id-card', route: `alumni/profile/${r.id}` },
          { label: 'Email', icon: 'mail', onClick: () => notify({ title: 'Compose opened', text: r.email, tone: 'info' }) },
          { label: 'Open LinkedIn', icon: 'external-link', onClick: () => copyToClipboard(r.linkedin, 'LinkedIn profile copied') },
          { separator: true },
          { label: r.verified ? 'Mark contact unverified' : 'Mark contact verified', icon: 'shield-check', onClick: () => notify({ title: r.verified ? 'Marked unverified' : 'Contact verified', text: r.name, tone: r.verified ? 'warning' : 'success' }) },
        ],
        onRowClick: (r) => goAlumnus(r.id),
        emptyState: EmptyState({ icon: 'award', title: 'No alumni match', text: 'Try a different batch, city or employer.' }),
      });
      mount.appendChild(node);
    },
  },

  /* ----------------------------------------------------------- profile --- */
  'alumni/profile': {
    title: 'Alumni Profile',
    subtitle: 'Career, engagement and giving history',
    section: 'alumni',
    render(mount, ctx) {
      injectStyles();
      const pool = scopedAlumni(ctx);
      const id = ctx.param || (pool[0] && pool[0].id) || '';
      const a = byId(db.alumni, id);
      if (!a) { mount.appendChild(missingRecord('alumnus', 'alumni/directory')); return; }
      const batchMates = db.alumni.filter((x) => x.batch === a.batch && x.id !== a.id);
      const sameCompany = db.alumni.filter((x) => x.currentCompany === a.currentCompany && x.id !== a.id);
      const events = db.events.filter((e) => hash(a.id + e.id) % 3 === 0).slice(0, a.eventsAttended);

      mount.appendChild(detailPage({
        title: a.name,
        subtitle: `${a.designation} at ${a.currentCompany} · ${a.batchLabel} · ${a.city}`,
        route: 'alumni/profile',
        breadcrumb: breadcrumbFor('alumni/profile', a.name),
        initials: a.avatarInitials,
        badges: [
          Badge(a.verified ? 'Verified' : 'Pending'),
          Badge(a.batchLabel, { tone: 'brand', outline: true }),
          a.mentorAvailable ? Badge('Mentor', { tone: 'success', icon: 'handshake' }) : null,
          a.donationTotal > 0 ? Badge('Donor', { tone: 'warning', icon: 'gift' }) : null,
        ].filter(Boolean),
        meta: [
          { label: 'Batch', value: String(a.batch), icon: 'layers' },
          { label: 'Stream', value: a.stream, icon: 'book-open' },
          { label: 'University', value: `${a.university} · ${a.degree}`, icon: 'graduation-cap' },
          { label: 'City', value: a.city, icon: 'map-pin' },
          { label: 'Last contact', value: relativeTime(a.lastContact), icon: 'history' },
        ],
        actions: [
          MenuButton([
            { label: 'Copy LinkedIn URL', icon: 'copy', onClick: () => copyToClipboard(a.linkedin, 'LinkedIn profile copied') },
            { label: 'Add to mentor panel', icon: 'handshake', onClick: () => notify({ title: 'Added to the mentor panel', text: a.name, tone: 'success' }) },
            { label: 'Record a donation', icon: 'gift', route: 'alumni/donations' },
            { separator: true },
            { label: a.verified ? 'Mark unverified' : 'Mark verified', icon: 'shield-check', onClick: () => notify({ title: a.verified ? 'Marked unverified' : 'Contact verified', tone: a.verified ? 'warning' : 'success' }) },
          ], { label: 'More actions' }),
          Button('Invite to event', { variant: 'ghost', icon: 'calendar-check', route: 'alumni/events' }),
          Button('Call', { variant: 'secondary', icon: 'phone', onClick: () => notify({ title: `Dialling ${a.phone}`, tone: 'info' }) }),
          Button('Email', { variant: 'primary', icon: 'mail', onClick: () => notify({ title: 'Compose opened', text: a.email, tone: 'info' }) }),
        ],
        tabs: [
          {
            id: 'overview', label: 'Overview', icon: 'dashboard',
            render: () => h('div', { className: 'stack' },
              kpiRow([
                { label: 'Years since graduating', value: String(2026 - a.batch), icon: 'calendar', tone: 'brand' },
                { label: 'Events attended', value: formatNumber(a.eventsAttended), icon: 'calendar-check', tone: 'info' },
                { label: 'Lifetime giving', value: a.donationTotal ? money(a.donationTotal) : '—', icon: 'gift', tone: a.donationTotal ? 'success' : 'neutral' },
                { label: 'Mentorship', value: a.mentorAvailable ? 'Available' : 'Not enrolled', icon: 'handshake', tone: a.mentorAvailable ? 'success' : 'warning' },
              ]),
              a.story ? Callout({ tone: 'brand', icon: 'sparkles', title: 'Success story on file' }, a.story) : null,
              h('div', { className: 'widget-grid' },
                h('div', { className: 'span-7' },
                  SectionCard({ title: 'Career timeline', icon: 'briefcase' }, Timeline(careerTimeline(a)))),
                h('div', { className: 'span-5' },
                  SectionCard({ title: 'Batch mates in the same city', subtitle: `${a.city} · Batch of ${a.batch}`, icon: 'users' },
                    (() => {
                      const near = batchMates.filter((x) => x.city === a.city).slice(0, 8);
                      return near.length ? RankList(near.map((x) => ({ name: x.name, meta: `${x.designation} · ${x.currentCompany}`, value: '' })))
                        : EmptyState({ icon: 'map-pin', title: 'No batch mates in this city', text: 'Nobody else from this batch is currently based here.' });
                    })())))),
          },
          {
            id: 'career', label: 'Career', icon: 'briefcase',
            render: () => h('div', { className: 'stack' },
              SectionCard({ title: 'Current position', icon: 'briefcase' },
                DescriptionList([
                  ['Employer', a.currentCompany], ['Designation', a.designation], ['Based in', a.city],
                  ['University', a.university], ['Degree', a.degree], ['School stream', a.stream],
                  ['LinkedIn', a.linkedin], ['Mentor available', a.mentorAvailable ? 'Yes' : 'No'],
                ], { cols: 2 })),
              SectionCard({ title: 'Progression', icon: 'trending-up' }, Timeline(careerTimeline(a))),
              SectionCard({ title: `Others at ${a.currentCompany}`, subtitle: `${sameCompany.length} alumni`, icon: 'users', flush: true },
                sameCompany.length ? DataTable({
                  columns: [
                    { key: 'name', label: 'Alumnus', width: 220, render: (r) => Identity(r.name, r.batchLabel, { onClick: () => goAlumnus(r.id) }), value: (r) => r.name },
                    { key: 'designation', label: 'Designation', width: 200 },
                    { key: 'city', label: 'City', width: 160 },
                    { key: 'batch', label: 'Batch', width: 100, align: 'right', numeric: true },
                  ],
                  rows: sameCompany, pageSize: 10, searchable: false, onRowClick: (r) => goAlumnus(r.id),
                }) : EmptyState({ icon: 'briefcase', title: 'The only alumnus here', text: `No other Springdale alumnus currently works at ${a.currentCompany}.` }))),
          },
          {
            id: 'engagement', label: 'Engagement', icon: 'calendar-check', count: a.eventsAttended,
            render: () => (events.length ? SectionCard({ title: 'Events attended', icon: 'calendar-check', flush: true },
              DataTable({
                columns: [
                  { key: 'title', label: 'Event', sticky: true, width: 260 },
                  { key: 'category', label: 'Category', width: 150, filter: true },
                  { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date), value: (r) => r.date },
                  { key: 'venue', label: 'Venue', width: 200 },
                  { key: 'status', label: 'Status', width: 130, render: (r) => Badge(r.status) },
                ],
                rows: events, paginate: false, searchable: false,
              }))
              : emptyTab('calendar-check', 'No events attended yet', `${a.name} has not attended an alumni event since graduating.`, Button('Invite to the next event', { variant: 'primary', icon: 'send', route: 'alumni/events' }))),
          },
          {
            id: 'giving', label: 'Giving', icon: 'gift',
            render: () => (a.donationTotal > 0 ? h('div', { className: 'stack' },
              kpiRow([
                { label: 'Lifetime giving', value: money(a.donationTotal), icon: 'gift', tone: 'success' },
                { label: 'Batch rank', value: `#${db.alumni.filter((x) => x.batch === a.batch && x.donationTotal > a.donationTotal).length + 1}`, deltaLabel: `of ${db.alumni.filter((x) => x.batch === a.batch).length} in the batch`, icon: 'trophy', tone: 'brand' },
                { label: 'Last contact', value: formatDate(a.lastContact), icon: 'history', tone: 'info' },
                { label: 'Recognition', value: a.donationTotal >= 100000 ? 'Patron' : a.donationTotal >= 25000 ? 'Benefactor' : 'Supporter', icon: 'award', tone: 'warning' },
              ]),
              SectionCard({ title: 'Giving history', icon: 'gift' },
                Timeline([
                  { title: 'Alumni fund contribution', meta: formatDate(a.lastContact), text: `${money(a.donationTotal)} towards the scholarship corpus.`, icon: 'gift', tone: 'success' },
                  { title: 'Receipt issued', meta: formatDate(a.lastContact), text: '80G receipt emailed to the registered address.', icon: 'receipt', tone: 'info' },
                ])),
              SectionCard({ title: 'Ask again?', icon: 'megaphone' },
                h('div', { className: 'row row-wrap' },
                  h('span', { className: 't-secondary' }, 'This alumnus has given before and is a strong candidate for the annual scholarship appeal.'),
                  h('span', { className: 'spacer' }),
                  Button('Add to appeal list', { variant: 'primary', icon: 'plus', onClick: () => notify({ title: 'Added to the appeal list', text: a.name, tone: 'success' }) }))))
              : emptyTab('gift', 'No donations recorded', `${a.name} has not contributed to the alumni fund yet.`, Button('Send a fundraising appeal', { variant: 'primary', icon: 'send', route: 'alumni/communication' }))),
          },
          {
            id: 'contact', label: 'Contact', icon: 'phone',
            render: () => h('div', { className: 'stack' },
              SectionCard({ title: 'Contact details', icon: 'phone' },
                DescriptionList([
                  ['Email', a.email], ['Phone', a.phone], ['City', a.city],
                  ['LinkedIn', a.linkedin], ['Verified', a.verified ? 'Yes' : 'No'],
                  ['Last contacted', `${formatDate(a.lastContact)} · ${relativeTime(a.lastContact)}`],
                ], { cols: 2 })),
              SectionCard({ title: 'School record', icon: 'graduation-cap' },
                DescriptionList([
                  ['Admission number', a.admissionNo], ['Campus', campusName(a.campusId)],
                  ['Batch', a.batchLabel], ['Stream', a.stream],
                ], { cols: 2 })),
              Callout({ tone: 'info', icon: 'shield', title: 'Consent' },
                'Alumni contact details are used for school communications only and are never shared with third parties. Alumni can opt out from any broadcast footer.')),
          },
        ],
        sidebar: [
          SectionCard({ title: 'Contact', icon: 'phone' },
            h('div', null,
              railLine('mail', 'Email', mailLink(a.email, a.name)),
              railLine('phone', 'Phone', phoneLink(a.phone, a.name)),
              railLine('link', 'LinkedIn', h('button', { className: 'btn btn-link', style: { padding: 0 }, onClick: () => copyToClipboard(a.linkedin, 'LinkedIn profile copied') }, a.linkedin)),
              railLine('map-pin', 'City', a.city))),
          SectionCard({ title: 'School record', icon: 'graduation-cap' },
            h('div', null,
              railLine('layers', 'Batch', a.batchLabel),
              railLine('id-card', 'Admission no', a.admissionNo),
              railLine('book-open', 'Stream', a.stream),
              railLine('building-columns', 'Campus', campusName(a.campusId)))),
          SectionCard({
            title: 'Batch of ' + a.batch, icon: 'users',
            actions: Button('Open batch', { variant: 'link', size: 'sm', onClick: () => navigate('alumni/directory', { batch: String(a.batch) }) }),
          },
            h('div', { className: 'stack-2' },
              MetricRow('Alumni in batch', formatNumber(batchMates.length + 1)),
              MetricRow('Mentors', formatNumber(db.alumni.filter((x) => x.batch === a.batch && x.mentorAvailable).length)),
              MetricRow('Batch giving', moneyK(sum(db.alumni.filter((x) => x.batch === a.batch), 'donationTotal'))),
              AvatarStack(batchMates.slice(0, 8).map((x) => x.name), { size: 'sm', max: 6 }))),
        ],
        timeline: careerTimeline(a).slice().reverse().slice(0, 5),
      }));
    },
  },

  /* ----------------------------------------------------------- batches --- */
  'alumni/batches': {
    title: 'Batches',
    subtitle: 'Graduating cohorts and their engagement',
    section: 'alumni',
    render(mount, ctx) {
      injectStyles();
      const all = scopedAlumni(ctx);
      const rows = uniq(all.map((a) => a.batch)).sort((x, y) => y - x).map((batch) => {
        const members = all.filter((a) => a.batch === batch);
        return {
          id: String(batch), batch, batchLabel: `Batch of ${batch}`,
          alumni: members.length,
          verified: members.filter((a) => a.verified).length,
          mentors: members.filter((a) => a.mentorAvailable).length,
          donors: members.filter((a) => a.donationTotal > 0).length,
          giving: sum(members, 'donationTotal'),
          events: sum(members, 'eventsAttended'),
          topEmployer: (countBy(members, 'currentCompany')[0] || {}).key || '—',
          reunionDue: (2026 - batch) % 5 === 0,
        };
      });
      const ordered = rows.slice().reverse();

      mount.appendChild(listPage({
        title: 'Batches',
        subtitle: `${rows.length} graduating batches · ${formatNumber(all.length)} alumni`,
        route: 'alumni/batches',
        actions: [
          Button('Directory', { variant: 'secondary', icon: 'users', route: 'alumni/directory' }),
          Button('Plan a reunion', {
            variant: 'primary', icon: 'calendar-plus',
            onClick: () => Modal({
              title: 'Plan a batch reunion', size: 'md', icon: 'calendar-plus',
              body: h('div', { className: 'stack-3' },
                Field({ label: 'Batch', required: true }, Select({ options: rows.map((r) => ({ value: r.id, label: `${r.batchLabel} · ${r.alumni} alumni` })), placeholder: 'Select…' })),
                Field({ label: 'Proposed date', required: true }, DatePicker({ value: '2026-12-27', width: '100%' })),
                Field({ label: 'Venue' }, Input({ value: 'Main Campus Auditorium, Gurugram' })),
                Field({ label: 'Note to the batch' }, Textarea({ rows: 3, placeholder: 'Silver jubilee reunion — save the date…' }))),
              actions: (close) => frag(
                Button('Cancel', { variant: 'secondary', onClick: close }),
                Button('Create event', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Reunion created', text: 'Invitations queued to the batch.', tone: 'success' }); } })),
            }),
          }),
        ],
        kpis: [
          { label: 'Batches', value: String(rows.length), icon: 'layers', tone: 'brand' },
          { label: 'Alumni', value: formatNumber(all.length), icon: 'award', tone: 'info' },
          { label: 'Reunions due this year', value: formatNumber(rows.filter((r) => r.reunionDue).length), deltaLabel: 'Multiples of five years', icon: 'calendar-check', tone: 'warning' },
          { label: 'Total giving', value: moneyK(sum(rows, 'giving')), icon: 'gift', tone: 'success' },
        ],
        chart: comboChart({
          categories: ordered.map((r) => String(r.batch)),
          bars: [{ name: 'Alumni', values: ordered.map((r) => r.alumni) }],
          line: { name: 'Donors', values: ordered.map((r) => r.donors) },
          height: 260, title: 'Alumni and donors per batch',
        }),
        chartTitle: 'Alumni and donors per batch',
        columns: [
          { key: 'batchLabel', label: 'Batch', sticky: true, width: 170, render: (r) => Identity(r.batchLabel, r.reunionDue ? 'Reunion year' : `${2026 - r.batch} years out`), value: (r) => r.batch },
          { key: 'alumni', label: 'Alumni', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'verified', label: 'Verified', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'mentors', label: 'Mentors', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'donors', label: 'Donors', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'giving', label: 'Giving', width: 150, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.giving) },
          { key: 'events', label: 'Event attendance', width: 160, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'topEmployer', label: 'Top employer', width: 200 },
          { key: 'reunionDue', label: 'Reunion', width: 130, render: (r) => Badge(r.reunionDue ? 'Scheduled' : 'Not due'), value: (r) => (r.reunionDue ? 'Due' : 'Not due') },
        ],
        rows,
        footerAggregates: true,
        paginate: true,
        pageSize: 25,
        searchKeys: ['batchLabel', 'topEmployer'],
        exportName: 'alumni-batches',
        onRowClick: (r) => navigate('alumni/directory', { batch: r.id }),
        rowActions: (r) => [
          { label: 'View batch members', icon: 'users', onClick: () => navigate('alumni/directory', { batch: r.id }) },
          { label: 'Email the batch', icon: 'mail', route: 'alumni/communication' },
          { label: 'Plan a reunion', icon: 'calendar-plus', route: 'alumni/events' },
        ],
        emptyState: EmptyState({ icon: 'layers', title: 'No batches on record' }),
      }));
    },
  },

  /* ----------------------------------------------------------- careers --- */
  'alumni/careers': {
    title: 'Careers',
    subtitle: 'Where Springdale alumni study and work',
    section: 'alumni',
    render(mount, ctx) {
      injectStyles();
      const all = scopedAlumni(ctx);
      const employers = countBy(all, 'currentCompany');
      const universities = countBy(all, 'university');
      const designations = countBy(all, 'designation');
      const cities = countBy(all, 'city');
      const degrees = countBy(all, 'degree');

      const rows = employers.map((e) => {
        const members = all.filter((a) => a.currentCompany === e.key);
        return {
          id: e.key, company: e.key, alumni: e.value,
          mentors: members.filter((m) => m.mentorAvailable).length,
          topDesignation: (countBy(members, 'designation')[0] || {}).key || '—',
          cities: uniq(members.map((m) => m.city)).length,
          recentBatch: Math.max(...members.map((m) => m.batch)),
          giving: sum(members, 'donationTotal'),
        };
      });

      mount.appendChild(reportPage({
        title: 'Careers',
        subtitle: `Career outcomes across ${formatNumber(all.length)} alumni`,
        route: 'alumni/careers',
        filters: [
          { id: 'batch', label: 'Batch', options: uniq(all.map((a) => a.batch)).sort((x, y) => y - x).map((b) => ({ value: String(b), label: `Batch of ${b}` })) },
          { id: 'stream', label: 'Stream', options: uniq(all.map((a) => a.stream)) },
          { id: 'city', label: 'City', options: uniq(all.map((a) => a.city)).sort() },
        ],
        onFilter: (id, value, allValues, table) => {
          const filtered = all.filter((a) => (!allValues.batch || allValues.batch === 'all' || String(a.batch) === allValues.batch)
            && (!allValues.stream || allValues.stream === 'all' || a.stream === allValues.stream)
            && (!allValues.city || allValues.city === 'all' || a.city === allValues.city));
          const next = countBy(filtered, 'currentCompany').map((e) => {
            const members = filtered.filter((a) => a.currentCompany === e.key);
            return {
              id: e.key, company: e.key, alumni: e.value,
              mentors: members.filter((m) => m.mentorAvailable).length,
              topDesignation: (countBy(members, 'designation')[0] || {}).key || '—',
              cities: uniq(members.map((m) => m.city)).length,
              recentBatch: Math.max(...members.map((m) => m.batch)),
              giving: sum(members, 'donationTotal'),
            };
          });
          if (table) table.refresh(next);
        },
        summary: [
          { label: 'Employers', value: formatNumber(employers.length), icon: 'briefcase', tone: 'brand' },
          { label: 'Universities', value: formatNumber(universities.length), icon: 'graduation-cap', tone: 'info' },
          { label: 'Cities', value: formatNumber(cities.length), icon: 'map-pin', tone: 'success' },
          { label: 'Mentors available', value: formatNumber(all.filter((a) => a.mentorAvailable).length), icon: 'handshake', tone: 'warning' },
        ],
        chart: [
          barChart({
            categories: employers.slice(0, 12).map((x) => x.key),
            series: [{ name: 'Alumni', values: employers.slice(0, 12).map((x) => x.value) }],
            horizontal: true, showValues: true, height: 320, title: 'Top employers',
          }),
          barChart({
            categories: universities.slice(0, 12).map((x) => x.key),
            series: [{ name: 'Alumni', values: universities.slice(0, 12).map((x) => x.value) }],
            horizontal: true, showValues: true, height: 320, title: 'Top universities',
          }),
          treemap({
            data: designations.slice(0, 8).map((x) => ({ key: x.key, value: x.value })),
            height: 280, title: 'Career fields',
          }),
          donutChart({
            data: degrees.slice(0, 6), height: 280, centerLabel: 'Degrees',
            centerValue: formatNumber(degrees.length), title: 'Degrees pursued',
          }),
        ],
        chartTitle: 'Top employers',
        columns: [
          { key: 'company', label: 'Employer', sticky: true, width: 230 },
          { key: 'alumni', label: 'Alumni', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'topDesignation', label: 'Most common role', width: 210 },
          { key: 'mentors', label: 'Mentors', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'cities', label: 'Cities', width: 100, align: 'right', numeric: true },
          { key: 'recentBatch', label: 'Latest batch', width: 140, align: 'right', numeric: true },
          { key: 'giving', label: 'Giving', width: 150, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.giving) },
        ],
        rows,
        tableTitle: 'Employers',
        footerAggregates: true,
        notes: SectionCard({ title: 'Mentor panel', subtitle: 'Alumni who have opted in to mentoring current students', icon: 'handshake' },
          RankList(all.filter((a) => a.mentorAvailable).slice(0, 10).map((a) => ({
            name: a.name, meta: `${a.designation} · ${a.currentCompany} · ${a.city}`, value: a.batchLabel,
          })))),
      }));
    },
  },

  /* ------------------------------------------------------------ events --- */
  'alumni/events': {
    title: 'Alumni Events',
    subtitle: 'Homecoming, reunions and networking',
    section: 'alumni',
    render(mount, ctx) {
      injectStyles();
      const all = scopedAlumni(ctx);
      const relevant = db.events.filter((e) => /alumni|institutional/i.test(`${e.title} ${e.category} ${e.audience}`));
      const events = relevant.length ? relevant : db.events;
      const calendarEvents = events.map((e) => ({
        date: e.date, title: e.title, tone: toneForStatus(e.status),
        meta: `${e.venue} · ${formatNumber(e.registered)} registered`, badge: e.category,
      }));
      const upcoming = events.filter((e) => e.date >= '2026-08-20');

      mount.appendChild(calendarPage({
        title: 'Alumni Events',
        subtitle: `${formatNumber(events.length)} events in the 2026-27 calendar · ${formatNumber(all.length)} alumni invited`,
        route: 'alumni/events',
        month: '2026-12',
        events: calendarEvents,
        actions: [
          Button('Invite the network', { variant: 'secondary', icon: 'megaphone', route: 'alumni/communication' }),
          Button('Create event', {
            variant: 'primary', icon: 'plus',
            onClick: () => Modal({
              title: 'Create an alumni event', size: 'md', icon: 'calendar-plus',
              body: h('div', { className: 'stack-3' },
                Field({ label: 'Title', required: true }, Input({ placeholder: 'e.g. Alumni Homecoming 2027' })),
                FormGrid({ cols: 2 },
                  Field({ label: 'Date', required: true }, DatePicker({ value: '2026-12-27', width: '100%' })),
                  Field({ label: 'Category' }, Select({ options: ['Institutional', 'Cultural', 'Academic', 'Sports'], value: 'Institutional' })),
                  Field({ label: 'Venue' }, Input({ value: 'Main Campus Auditorium' })),
                  Field({ label: 'Expected attendance', }, Input({ type: 'number', numeric: true, value: '350' }))),
                Field({ label: 'Invite batches' }, MultiSelect({ options: uniq(all.map((a) => `Batch of ${a.batch}`)).sort(), placeholder: 'All batches' }))),
              actions: (close) => frag(
                Button('Cancel', { variant: 'secondary', onClick: close }),
                Button('Create event', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Alumni event created', text: 'Invitations queued.', tone: 'success' }); } })),
            }),
          }),
        ],
        kpis: [
          { label: 'Events this session', value: formatNumber(events.length), icon: 'calendar-check', tone: 'brand' },
          { label: 'Upcoming', value: formatNumber(upcoming.length), icon: 'clock', tone: 'info' },
          { label: 'Alumni registered', value: formatNumber(sum(events, 'registered')), icon: 'users', tone: 'success' },
          { label: 'Event budget', value: moneyK(sum(events, 'budget')), deltaLabel: `${moneyK(sum(events, 'spent'))} spent`, icon: 'wallet', tone: 'warning' },
        ],
        onSelectEvent: (e) => notify({ title: e.title, text: e.meta, tone: 'info' }),
        onSelectDate: (d) => notify({ title: formatDate(d), text: 'No alumni event scheduled on this date.', tone: 'info' }),
        sidebar: [
          SectionCard({ title: 'Upcoming events', icon: 'clock' },
            upcoming.length ? h('div', { className: 'stack-3' }, upcoming.slice(0, 5).map((e) => Card({ pad: true },
              h('div', { className: 'stack-2' },
                h('div', { className: 'row' }, Badge(e.category, { tone: 'brand', outline: true }), h('span', { className: 'spacer' }), h('span', { className: 't-xs t-muted' }, relativeTime(e.date))),
                h('div', { className: 't-medium' }, e.title),
                h('div', { className: 't-xs t-muted' }, `${formatDate(e.date)} · ${e.venue}`),
                ProgressBar(e.expectedAttendance ? (e.registered / e.expectedAttendance) * 100 : 0, { tone: 'brand', size: 'sm', label: `${formatNumber(e.registered)} registered`, showValue: true })))))
              : EmptyState({ icon: 'calendar', title: 'No upcoming events', text: 'Create the next homecoming to keep the network warm.' })),
          SectionCard({ title: 'Most engaged alumni', subtitle: 'By events attended', icon: 'trophy' },
            RankList(sortBy(all, 'eventsAttended', 'desc').slice(0, 8).map((a) => ({
              name: a.name, meta: `${a.batchLabel} · ${a.city}`, value: `${a.eventsAttended} events`,
            })))),
          SectionCard({ title: 'Reunion years', subtitle: 'Batches at a five-year milestone', icon: 'calendar-check' },
            h('div', { className: 'row row-wrap' },
              uniq(all.map((a) => a.batch)).filter((b) => (2026 - b) % 5 === 0).sort((x, y) => y - x)
                .map((b) => Pill(`Batch of ${b}`, { onClick: () => navigate('alumni/directory', { batch: String(b) }) })))),
        ],
        legend: h('div', { className: 'row row-wrap t-xs t-muted' },
          h('span', null, 'Event status:'), Badge('Completed'), Badge('Upcoming'), Badge('Scheduled')),
      }));
    },
  },

  /* --------------------------------------------------------- donations --- */
  'alumni/donations': {
    title: 'Donations',
    subtitle: 'Alumni giving to the scholarship and infrastructure funds',
    section: 'alumni',
    render(mount, ctx) {
      injectStyles();
      const all = scopedAlumni(ctx);
      const donors = all.filter((a) => a.donationTotal > 0);
      const total = sum(donors, 'donationTotal');
      const tiers = [
        { key: 'Supporter (< ₹25 K)', value: donors.filter((a) => a.donationTotal < 25000).length },
        { key: 'Benefactor (₹25 K – 1 L)', value: donors.filter((a) => a.donationTotal >= 25000 && a.donationTotal < 100000).length },
        { key: 'Patron (₹1 – 5 L)', value: donors.filter((a) => a.donationTotal >= 100000 && a.donationTotal < 500000).length },
        { key: 'Founder (₹5 L+)', value: donors.filter((a) => a.donationTotal >= 500000).length },
      ];
      const byBatch = sumBy(donors, 'batchLabel', 'donationTotal').slice(0, 12);
      const f = { tab: 'all' };
      let node;
      const select = () => donors.filter((a) => {
        if (f.batch && f.batch !== 'all' && String(a.batch) !== String(f.batch)) return false;
        if (f.city && f.city !== 'all' && a.city !== f.city) return false;
        if (f.tab === 'patrons') return a.donationTotal >= 100000;
        if (f.tab === 'recent') return a.lastContact >= '2026-01-01';
        return true;
      });

      node = listPage({
        title: 'Donations',
        subtitle: `${moneyK(total)} raised from ${formatNumber(donors.length)} alumni donors`,
        route: 'alumni/donations',
        actions: [
          Button('Issue 80G receipts', { variant: 'secondary', icon: 'receipt', onClick: () => notify({ title: '80G receipts queued', text: `${donors.length} receipts generated.`, tone: 'success' }) }),
          Button('Record a donation', {
            variant: 'primary', icon: 'gift',
            onClick: () => Modal({
              title: 'Record a donation', size: 'md', icon: 'gift',
              body: h('div', { className: 'stack-3' },
                Field({ label: 'Alumnus', required: true }, Combobox({ options: all.slice(0, 600).map((a) => ({ value: a.id, label: `${a.name} · ${a.batchLabel}` })), placeholder: 'Search…' })),
                FormGrid({ cols: 2 },
                  Field({ label: 'Amount', required: true }, Input({ type: 'number', numeric: true, prefix: '₹', placeholder: '25000' })),
                  Field({ label: 'Received on', required: true }, DatePicker({ value: '2026-08-20', width: '100%' })),
                  Field({ label: 'Fund', required: true }, Select({ options: ['Scholarship corpus', 'Infrastructure fund', 'Library fund', 'Sports fund', 'General fund'], placeholder: 'Select…' })),
                  Field({ label: 'Mode' }, Select({ options: ['Bank transfer', 'UPI', 'Cheque', 'Card'], value: 'Bank transfer' }))),
                Field({ label: 'Note' }, Textarea({ rows: 2, placeholder: 'Purpose or dedication…' }))),
              actions: (close) => frag(
                Button('Cancel', { variant: 'secondary', onClick: close }),
                Button('Record donation', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Donation recorded', text: '80G receipt emailed to the donor.', tone: 'success' }); } })),
            }),
          }),
        ],
        tabs: [
          { id: 'all', label: 'All donors', count: donors.length },
          { id: 'patrons', label: 'Patrons ₹1 L+', count: donors.filter((a) => a.donationTotal >= 100000).length },
          { id: 'recent', label: 'Contacted this year', count: donors.filter((a) => a.lastContact >= '2026-01-01').length },
        ],
        activeTab: 'all',
        onTabChange: (id) => { f.tab = id; node.table.refresh(select()); },
        kpis: [
          { label: 'Total raised', value: moneyK(total), delta: 12.4, deltaLabel: 'vs last year', icon: 'gift', tone: 'success', trend: analytics.sparks.revenue },
          { label: 'Donors', value: formatNumber(donors.length), deltaLabel: `${pctText((donors.length / Math.max(1, all.length)) * 100)} of the network`, icon: 'users', tone: 'brand' },
          { label: 'Average gift', value: donors.length ? money(Math.round(total / donors.length)) : '—', icon: 'calculator', tone: 'info' },
          { label: 'Largest gift', value: donors.length ? money(Math.max(...donors.map((a) => a.donationTotal))) : '—', icon: 'trophy', tone: 'warning' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Donor name or employer…', width: '260px' },
          { id: 'batch', label: 'Batch', options: uniq(donors.map((a) => a.batch)).sort((x, y) => y - x).map((b) => ({ value: String(b), label: `Batch of ${b}` })) },
          { id: 'city', label: 'City', options: uniq(donors.map((a) => a.city)).sort() },
        ],
        onFilter: (id, value, allValues) => {
          Object.assign(f, allValues);
          const q = String(allValues.q || '').toLowerCase();
          node.table.refresh(select().filter((a) => !q || `${a.name} ${a.currentCompany}`.toLowerCase().includes(q)));
        },
        chart: h('div', { className: 'widget-grid' },
          h('div', { className: 'span-7' }, barChart({
            categories: byBatch.map((x) => x.key),
            series: [{ name: 'Giving', values: byBatch.map((x) => x.value) }],
            horizontal: true, valueFormat: 'currencyCompact', height: 300, title: 'Giving by batch',
          })),
          h('div', { className: 'span-5' }, donutChart({
            data: tiers, height: 300, centerLabel: 'Donors', centerValue: formatNumber(donors.length),
            title: 'Donors by giving tier',
          }))),
        chartTitle: 'Giving analysis',
        columns: [
          { key: 'name', label: 'Donor', sticky: true, width: 230, render: (r) => Identity(r.name, `${r.batchLabel} · ${r.city}`, { onClick: () => goAlumnus(r.id) }), value: (r) => r.name },
          { key: 'batch', label: 'Batch', width: 100, align: 'right', numeric: true, filter: true },
          { key: 'currentCompany', label: 'Employer', width: 200 },
          { key: 'designation', label: 'Designation', width: 190, hidden: true },
          { key: 'city', label: 'City', width: 150, filter: true },
          { key: 'donationTotal', label: 'Lifetime giving', width: 170, align: 'right', numeric: true, aggregate: 'sum', format: (v) => moneyK(v), render: (r) => money(r.donationTotal) },
          {
            key: 'tier', label: 'Tier', width: 140,
            value: (r) => (r.donationTotal >= 500000 ? 'Founder' : r.donationTotal >= 100000 ? 'Patron' : r.donationTotal >= 25000 ? 'Benefactor' : 'Supporter'),
            render: (r) => Badge(r.donationTotal >= 500000 ? 'Founder' : r.donationTotal >= 100000 ? 'Patron' : r.donationTotal >= 25000 ? 'Benefactor' : 'Supporter', { tone: 'brand', outline: true }),
          },
          { key: 'lastContact', label: 'Last contact', width: 160, render: (r) => `${formatDate(r.lastContact)} · ${relativeTime(r.lastContact)}`, value: (r) => r.lastContact },
        ],
        rows: select(),
        selectable: true,
        footerAggregates: true,
        pageSize: 25,
        searchKeys: ['name', 'currentCompany', 'city'],
        exportName: 'alumni-donations',
        bulkActions: [
          { label: 'Send thank-you note', icon: 'mail', onClick: (sel) => notify({ title: `${sel.length} thank-you notes queued`, tone: 'success' }) },
          { label: 'Issue 80G receipts', icon: 'receipt', onClick: (sel) => notify({ title: `${sel.length} receipts generated`, tone: 'success' }) },
          { label: 'Add to appeal list', icon: 'megaphone', onClick: (sel) => notify({ title: `${sel.length} donors added to the appeal`, tone: 'info' }) },
        ],
        rowActions: (r) => [
          { label: 'Open alumni profile', icon: 'id-card', route: `alumni/profile/${r.id}` },
          { label: 'Issue 80G receipt', icon: 'receipt', onClick: () => notify({ title: '80G receipt issued', text: r.name, tone: 'success' }) },
          { label: 'Send thank-you note', icon: 'mail', onClick: () => notify({ title: 'Thank-you note sent', text: r.email, tone: 'success' }) },
        ],
        onRowClick: (r) => goAlumnus(r.id),
        notes: Callout({ tone: 'info', icon: 'info', title: 'Fund allocation' },
          'Alumni giving is split between the scholarship corpus (60%), infrastructure (25%) and the library and sports funds (15%). Donors can restrict a gift to a single fund at the time of recording.'),
        emptyState: EmptyState({ icon: 'gift', title: 'No donations match', text: 'Try a different batch or city.' }),
      });
      mount.appendChild(node);
    },
  },

  /* ----------------------------------------------------- communication --- */
  'alumni/communication': {
    title: 'Communication',
    subtitle: 'Broadcasts, newsletters and appeals to the alumni network',
    section: 'alumni',
    render(mount, ctx) {
      injectStyles();
      const all = scopedAlumni(ctx);
      const campaigns = db.messages.filter((m) => /alumni|all/i.test(m.audience) || hash(m.id) % 5 === 0);
      const draft = { channel: 'Email', segment: 'all', subject: '', body: '' };
      const audienceHost = h('div', { className: 't-sm t-muted' });

      const segmentSize = () => {
        switch (draft.segment) {
          case 'mentors': return all.filter((a) => a.mentorAvailable).length;
          case 'donors': return all.filter((a) => a.donationTotal > 0).length;
          case 'recent': return all.filter((a) => a.batch >= 2020).length;
          case 'overseas': return all.filter((a) => ['San Francisco', 'London', 'Singapore', 'Dubai', 'Toronto'].includes(a.city)).length;
          case 'unverified': return all.filter((a) => !a.verified).length;
          default: return all.length;
        }
      };
      const paintAudience = () => {
        const n = segmentSize();
        audienceHost.textContent = `${formatNumber(n)} recipients · estimated cost ${draft.channel === 'SMS' ? money(Math.round(n * 0.18)) : money(0)}`;
      };
      paintAudience();

      const composer = SectionCard({ title: 'Compose a broadcast', subtitle: 'Reaches the alumni network only', icon: 'megaphone' },
        h('div', { className: 'stack-4' },
          Field({ label: 'Channel', required: true },
            SegmentedControl(['Email', 'SMS', 'WhatsApp', 'Push Notification'], (v) => { draft.channel = v; paintAudience(); }, { active: 'Email' })),
          Field({ label: 'Audience segment', required: true, hint: 'Segments are computed live from the directory.' },
            Select({
              value: 'all',
              options: [
                { value: 'all', label: `All alumni (${formatNumber(all.length)})` },
                { value: 'mentors', label: `Mentor panel (${formatNumber(all.filter((a) => a.mentorAvailable).length)})` },
                { value: 'donors', label: `Past donors (${formatNumber(all.filter((a) => a.donationTotal > 0).length)})` },
                { value: 'recent', label: `Recent batches 2020+ (${formatNumber(all.filter((a) => a.batch >= 2020).length)})` },
                { value: 'overseas', label: `Overseas alumni (${formatNumber(all.filter((a) => ['San Francisco', 'London', 'Singapore', 'Dubai', 'Toronto'].includes(a.city)).length)})` },
                { value: 'unverified', label: `Unverified contacts (${formatNumber(all.filter((a) => !a.verified).length)})` },
              ],
              onChange: (v) => { draft.segment = v; paintAudience(); },
            })),
          audienceHost,
          Field({ label: 'Subject', required: true }, Input({ placeholder: 'Homecoming 2026 — save the date', onInput: (v) => { draft.subject = v; } })),
          Field({ label: 'Message', required: true, hint: 'Merge fields: {{name}}, {{batch}}, {{city}}.' },
            Textarea({ rows: 6, placeholder: 'Dear {{name}}, the Batch of {{batch}} is invited back to campus on 27 December…', onInput: (v) => { draft.body = v; } })),
          Field({ label: 'Template' },
            Select({ options: db.templates.map((t) => ({ value: t.id, label: `${t.name} · ${t.channel}` })), placeholder: 'Start from a template…' })),
          FormActions(
            Button('Send now', {
              variant: 'primary', icon: 'send',
              onClick: () => {
                if (!draft.subject) { notify({ title: 'Add a subject first', tone: 'warning' }); return; }
                ConfirmDialog({
                  title: `Send to ${formatNumber(segmentSize())} alumni?`,
                  text: `This ${draft.channel} broadcast goes out immediately and cannot be recalled.`,
                  confirmLabel: 'Send broadcast', tone: 'brand', icon: 'send',
                }).then((ok) => ok && notify({ title: 'Broadcast queued', text: `${formatNumber(segmentSize())} recipients · ${draft.channel}`, tone: 'success' }));
              },
            }),
            Button('Schedule', { variant: 'secondary', icon: 'clock', onClick: mockAction('Schedule broadcast') }),
            Button('Save draft', { variant: 'ghost', icon: 'edit', onClick: () => notify({ title: 'Draft saved', tone: 'info' }) }))));

      mount.appendChild(page({
        title: 'Alumni Communication',
        subtitle: `${formatNumber(all.length)} alumni reachable · ${formatNumber(all.filter((a) => a.verified).length)} verified contacts`,
        route: 'alumni/communication',
        actions: [
          Button('Templates', { variant: 'ghost', icon: 'copy', route: 'communication/templates' }),
          Button('Delivery logs', { variant: 'secondary', icon: 'list', route: 'communication/delivery-logs' }),
        ],
        children: [
          kpiRow([
            { label: 'Reachable alumni', value: formatNumber(all.length), icon: 'users', tone: 'brand' },
            { label: 'Verified contacts', value: pctText((all.filter((a) => a.verified).length / Math.max(1, all.length)) * 100), icon: 'shield-check', tone: 'success' },
            { label: 'Campaigns sent', value: formatNumber(campaigns.length), icon: 'megaphone', tone: 'info' },
            { label: 'Average open rate', value: pctText(campaigns.length ? (sum(campaigns, 'opened') / Math.max(1, sum(campaigns, 'delivered'))) * 100 : 0), icon: 'mail', tone: 'warning' },
          ]),
          h('div', { className: 'detail-split' },
            h('div', { className: 'stack' }, composer),
            h('div', { className: 'stack-3' },
              SectionCard({ title: 'Segment sizes', className: 'chart-card', icon: 'chart-bar' },
                barChart({
                  categories: ['All', 'Mentors', 'Donors', '2020+', 'Overseas', 'Unverified'],
                  series: [{
                    name: 'Alumni',
                    values: [all.length, all.filter((a) => a.mentorAvailable).length, all.filter((a) => a.donationTotal > 0).length,
                      all.filter((a) => a.batch >= 2020).length,
                      all.filter((a) => ['San Francisco', 'London', 'Singapore', 'Dubai', 'Toronto'].includes(a.city)).length,
                      all.filter((a) => !a.verified).length],
                  }],
                  horizontal: true, showValues: true, height: 260, title: 'Segment sizes',
                })),
              Callout({ tone: 'warning', icon: 'alert-triangle', title: 'Unverified contacts' },
                `${formatNumber(all.filter((a) => !a.verified).length)} alumni have an unverified email or phone. Broadcasts to this segment typically bounce at 20–30%.`),
              SectionCard({ title: 'Best time to send', icon: 'clock' },
                h('div', { className: 'stack-2' },
                  MetricRow('Email', 'Tuesday 10:00 AM', '38% open rate'),
                  MetricRow('WhatsApp', 'Saturday 11:00 AM', '61% read rate'),
                  MetricRow('SMS', 'Weekday 06:00 PM', '92% delivery'))))),
          SectionCard({ title: 'Recent campaigns', subtitle: `${formatNumber(campaigns.length)} broadcasts`, icon: 'megaphone', flush: true },
            DataTable({
              columns: [
                { key: 'subject', label: 'Subject', sticky: true, width: 280 },
                { key: 'channel', label: 'Channel', width: 150, filter: true },
                { key: 'audience', label: 'Audience', width: 180, filter: true },
                { key: 'recipients', label: 'Recipients', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'delivered', label: 'Delivered', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'opened', label: 'Opened', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
                {
                  key: 'openRate', label: 'Open rate', width: 140, align: 'right', numeric: true,
                  value: (r) => (r.delivered ? (r.opened / r.delivered) * 100 : 0),
                  render: (r) => pctText(r.delivered ? (r.opened / r.delivered) * 100 : 0),
                },
                { key: 'sentOn', label: 'Sent', width: 170, render: (r) => formatDateTime(r.sentOn), value: (r) => r.sentOn },
                { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
                { key: 'cost', label: 'Cost', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: (v) => money(v), render: (r) => money(r.cost) },
              ],
              rows: campaigns, pageSize: 10, footerAggregates: true, exportName: 'alumni-campaigns',
              searchKeys: ['subject', 'audience', 'channel'],
              rowActions: (r) => [
                { label: 'View report', icon: 'chart-bar', route: 'communication/reports' },
                { label: 'Duplicate', icon: 'copy', onClick: () => notify({ title: 'Campaign duplicated as a draft', text: r.subject, tone: 'info' }) },
              ],
              emptyState: EmptyState({ icon: 'megaphone', title: 'No campaigns yet', text: 'Compose the first alumni broadcast on the left.' }),
            })),
        ],
      }));
    },
  },

  /* ----------------------------------------------------------- stories --- */
  'alumni/stories': {
    title: 'Success Stories',
    subtitle: 'Alumni journeys worth telling current students',
    section: 'alumni',
    render(mount, ctx) {
      injectStyles();
      const all = scopedAlumni(ctx);
      const stories = all.filter((a) => a.story);
      const featured = stories.slice(0, 3);
      const rest = stories.slice(3);

      const card = (a) => Card({ pad: true, className: 'card-interactive', onClick: () => goAlumnus(a.id) },
        h('div', { className: 'stack-3' },
          h('div', { className: 'row-3' },
            Avatar(a.name, { size: 'lg', ring: true }),
            h('div', { className: 'flex-1 min-0' },
              h('div', { className: 't-semibold' }, a.name),
              h('div', { className: 't-xs t-muted' }, `${a.batchLabel} · ${a.designation}`),
              h('div', { className: 't-xs t-muted' }, `${a.currentCompany} · ${a.city}`))),
          h('div', { className: 'story-quote t-clamp-3' }, a.story),
          h('div', { className: 'row row-wrap' },
            Badge(a.degree, { tone: 'brand', outline: true }),
            Badge(a.university, { tone: 'neutral' }),
            a.mentorAvailable ? Badge('Mentor', { tone: 'success', icon: 'handshake' }) : null)));

      mount.appendChild(page({
        title: 'Success Stories',
        subtitle: `${formatNumber(stories.length)} published stories from ${formatNumber(all.length)} alumni`,
        route: 'alumni/stories',
        actions: [
          Button('Alumni directory', { variant: 'secondary', icon: 'users', route: 'alumni/directory' }),
          Button('Invite a story', {
            variant: 'primary', icon: 'sparkles',
            onClick: () => Modal({
              title: 'Invite an alumnus to share their story', size: 'md', icon: 'sparkles',
              body: h('div', { className: 'stack-3' },
                Field({ label: 'Alumnus', required: true }, Combobox({ options: all.slice(0, 600).map((a) => ({ value: a.id, label: `${a.name} · ${a.batchLabel} · ${a.currentCompany}` })), placeholder: 'Search…' })),
                Field({ label: 'Where it will be published' }, MultiSelect({ options: ['School website', 'Annual magazine', 'Assembly slideshow', 'Career counselling fair'], values: ['School website'] })),
                Field({ label: 'Personal note' }, Textarea({ rows: 3, placeholder: 'We would love to feature your journey in this year’s magazine…' }))),
              actions: (close) => frag(
                Button('Cancel', { variant: 'secondary', onClick: close }),
                Button('Send invitation', { variant: 'primary', icon: 'send', onClick: () => { close(); notify({ title: 'Invitation sent', tone: 'success' }); } })),
            }),
          }),
        ],
        children: [
          kpiRow([
            { label: 'Published stories', value: formatNumber(stories.length), icon: 'sparkles', tone: 'brand' },
            { label: 'Mentors among them', value: formatNumber(stories.filter((a) => a.mentorAvailable).length), icon: 'handshake', tone: 'success' },
            { label: 'Batches represented', value: formatNumber(uniq(stories.map((a) => a.batch)).length), icon: 'layers', tone: 'info' },
            { label: 'Cities represented', value: formatNumber(uniq(stories.map((a) => a.city)).length), icon: 'map-pin', tone: 'warning' },
          ]),
          featured.length ? SectionCard({ title: 'Featured this month', subtitle: 'Shown on the school website and in assembly', icon: 'star' },
            h('div', { className: 'story-grid' }, featured.map(card))) : null,
          stories.length
            ? SectionCard({ title: 'All stories', subtitle: `${formatNumber(rest.length)} more`, icon: 'sparkles' },
              rest.length ? h('div', { className: 'story-grid' }, rest.map(card))
                : EmptyState({ icon: 'sparkles', title: 'Only the featured stories so far', text: 'Invite more alumni to contribute their journey.' }))
            : Card({ pad: true }, EmptyState({
              icon: 'sparkles', title: 'No stories published yet',
              text: 'Invite alumni to share how school shaped their path — stories are used in assemblies, the magazine and the counselling fair.',
              action: Button('Invite a story', { variant: 'primary', icon: 'send', route: 'alumni/directory' }),
            })),
          SectionCard({ title: 'Story pipeline', subtitle: 'Alumni invited but yet to respond', icon: 'inbox', flush: true },
            DataTable({
              columns: [
                { key: 'name', label: 'Alumnus', sticky: true, width: 230, render: (r) => Identity(r.name, r.batchLabel, { onClick: () => goAlumnus(r.id) }), value: (r) => r.name },
                { key: 'currentCompany', label: 'Employer', width: 200 },
                { key: 'designation', label: 'Designation', width: 190 },
                { key: 'city', label: 'City', width: 150, filter: true },
                { key: 'lastContact', label: 'Last contacted', width: 170, render: (r) => `${formatDate(r.lastContact)} · ${relativeTime(r.lastContact)}`, value: (r) => r.lastContact },
                { key: 'mentorAvailable', label: 'Mentor', width: 110, render: (r) => Badge(r.mentorAvailable ? 'Available' : 'No'), value: (r) => (r.mentorAvailable ? 'Yes' : 'No') },
              ],
              rows: all.filter((a) => !a.story && a.verified && (a.mentorAvailable || a.donationTotal > 0)),
              pageSize: 10, exportName: 'story-pipeline',
              searchKeys: ['name', 'currentCompany', 'city'],
              rowActions: (r) => [
                { label: 'Invite to share a story', icon: 'send', onClick: () => notify({ title: 'Invitation sent', text: r.name, tone: 'success' }) },
                { label: 'Open profile', icon: 'id-card', route: `alumni/profile/${r.id}` },
              ],
              emptyState: EmptyState({ icon: 'inbox', title: 'Pipeline is empty', text: 'Every verified mentor and donor has already shared a story.' }),
            })),
        ],
      }));
    },
  },
};

/* ==================================================================== export */

export const routes = { ...studentRoutes, ...parentRoutes, ...alumniRoutes };

export default routes;
