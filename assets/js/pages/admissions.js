/* ==========================================================================
   pages/admissions.js — Admissions & CRM · Front Office · Complaints
   Sections owned: admissions · frontoffice · complaints
   ========================================================================== */

import {
  h, frag, Icon, Card, SectionCard, StatCard, Badge, Button, IconButton, Identity,
  DataTable, Modal, Drawer, ConfirmDialog, notify, EmptyState, Timeline, ActivityFeed,
  DescriptionList, ProgressBar, Avatar, AvatarStack, Tabs, SegmentedControl, FilterBar,
  SearchInput, MenuButton, Callout, FileList, RankList, MetricRow, Stepper, ApprovalTrail,
  CommentThread, Accordion, Rating, Switch, Checkbox, Select, Input, Textarea, Field,
  FormGrid, FormSection, DatePicker, TimePicker, Combobox, MultiSelect, Divider, Pill,
  Skeleton, SkeletonText, StackedProgressBar, RadialProgress, Toolbar,
  validators, mockAction, download, toCsv, printNode, copyToClipboard,
  formatCurrency, formatNumber, formatDate, formatDateTime, formatPercent, relativeTime,
  toneForStatus, initials as initialsOf,
} from '../core/ui.js';

import {
  page, listPage, detailPage, dashboardPage, formPage, reportPage, settingsPage,
  approvalQueuePage, kanbanPage, calendarPage, profileHeader, kpiRow, greetingFor,
  missingRecord, pageActions,
} from '../core/page-kit.js';

import {
  lineChart, areaChart, barChart, comboChart, donutChart, pieChart, funnelChart,
  heatmap, gaugeChart, scatterPlot, bulletChart, waterfallChart, treemap,
  radialBarChart, progressRing, sparkline, stackedProgressBar,
  PALETTE, SEQUENTIAL, ORDINAL, STATUS, seriesColor, ScaleLegend,
} from '../core/charts.js';

import {
  db, analytics, byId, where, search, sortBy, groupBy, sum, avg, countBy, sumBy,
} from '../data/db.js';

import { icon } from '../core/icons.js';
import { navigate } from '../core/router.js';
import * as store from '../core/state.js';

/* ========================================================== scoped styles = */

const STYLE_ID = 'adm-module-styles';
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
  .adm-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--sp-4);align-items:start}
  @media (max-width:1100px){.adm-split{grid-template-columns:minmax(0,1fr)}}
  .adm-doc-shell{border:1px solid var(--border);border-radius:var(--r-lg);background:var(--surface-sunken);
    min-height:280px;display:flex;flex-direction:column;overflow:hidden}
  .adm-doc-canvas{flex:1;display:flex;align-items:center;justify-content:center;padding:var(--sp-6);
    background:repeating-linear-gradient(45deg,var(--surface-sunken),var(--surface-sunken) 12px,var(--surface) 12px,var(--surface) 24px)}
  .adm-doc-sheet{width:100%;max-width:340px;aspect-ratio:1/1.35;background:var(--surface);
    border:1px solid var(--border-strong);border-radius:var(--r-sm);box-shadow:var(--shadow-md);
    padding:var(--sp-4);display:flex;flex-direction:column;gap:var(--sp-2)}
  .adm-doc-line{height:8px;border-radius:var(--r-full);background:var(--surface-sunken)}
  .adm-doc-bar{display:flex;align-items:center;gap:var(--sp-2);padding:var(--sp-2) var(--sp-3);
    border-bottom:1px solid var(--border);background:var(--surface)}
  .adm-doc-item{display:flex;align-items:center;gap:var(--sp-3);width:100%;text-align:left;
    padding:var(--sp-2) var(--sp-3);border:1px solid var(--border);border-radius:var(--r-md);
    background:var(--surface);cursor:pointer;transition:background var(--dur-fast) var(--ease)}
  .adm-doc-item:hover{background:var(--surface-hover)}
  .adm-doc-item[data-active="1"]{background:var(--surface-selected);border-color:var(--border-brand)}
  .adm-cut{width:100%;accent-color:var(--brand-600);height:var(--sp-2);cursor:pointer}
  .adm-score-input{width:96px}
  .adm-sla{height:6px;border-radius:var(--r-full);background:var(--surface-sunken);overflow:hidden}
  .adm-sla > span{display:block;height:100%;border-radius:var(--r-full)}
  .adm-tile{display:flex;flex-direction:column;gap:var(--sp-1);padding:var(--sp-3);
    border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface)}
  .adm-quick{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:var(--sp-3)}
  .adm-quick button{justify-content:flex-start}
  .adm-legend{display:flex;flex-wrap:wrap;gap:var(--sp-3)}
  .adm-legend span.dot{width:10px;height:10px;border-radius:var(--r-full);display:inline-block}
  .adm-result-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:var(--sp-3)}
  `;
  document.head.appendChild(h('style', { id: STYLE_ID, html: css }));
}

/* ================================================================ helpers = */

const CAMPUS_ALL = 'all';

function campusOf(ctx) {
  const c = ctx && ctx.state ? ctx.state.campusId : store.get('campusId');
  return c && c !== CAMPUS_ALL ? c : null;
}
function scope(rows, ctx) {
  const c = campusOf(ctx);
  return c ? rows.filter((r) => !r.campusId || r.campusId === c) : rows.slice();
}
function campusName(id) {
  const c = byId(db.campuses, id);
  return c ? c.name : 'All campuses';
}
function campusLabel(ctx) {
  const c = campusOf(ctx);
  return c ? campusName(c) : 'All campuses';
}
function campusOptions() {
  return db.campuses.map((c) => ({ value: c.id, label: c.name }));
}
function meNow() {
  const u = store.get('currentUser');
  return (u && u.name) || 'Front Office';
}

/** Generic filter runner used by every list screen. */
function applyFilters(rows, all, map) {
  const keys = Object.keys(map);
  return rows.filter((r) => keys.every((k) => {
    const v = all ? all[k] : null;
    if (v == null || v === '' || v === CAMPUS_ALL) return true;
    return map[k](r, v);
  }));
}
function filterHandler(rows, map) {
  return (id, value, all, table) => table.refresh(applyFilters(rows, all, map));
}
const matchText = (...keys) => (r, v) => {
  const t = String(v).toLowerCase();
  return keys.some((k) => String(r[k] ?? '').toLowerCase().includes(t));
};
const matchEq = (key) => (r, v) => String(r[key] ?? '') === String(v);
const dateFrom = (key) => (r, v) => String(r[key] ?? '') >= v;
const dateTo = (key) => (r, v) => String(r[key] ?? '') <= v;

/** Deterministic pseudo-random 0..1 from a string — keeps mock detail stable. */
function seedOf(str) {
  let x = 2166136261;
  for (let i = 0; i < String(str).length; i++) { x ^= String(str).charCodeAt(i); x = Math.imul(x, 16777619); }
  return ((x >>> 0) % 10000) / 10000;
}
function pickFrom(list, str, salt = '') { return list[Math.floor(seedOf(str + salt) * list.length) % list.length]; }

const DEMO_TODAY = '2026-08-20';

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
function addDaysIso(iso, n) {
  const d = new Date(iso); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function priorityTone(p) {
  return p === 'Critical' ? 'danger' : p === 'High' ? 'danger' : p === 'Medium' ? 'warning' : 'neutral';
}
function priorityBadge(p) { return Badge(p, { tone: priorityTone(p), dot: true }); }

/* ------------------------------------------------------- admissions model */

const PIPELINE = [
  { id: 'enquiry', title: 'Enquiry', color: 'var(--chart-1)', stages: ['New Enquiry', 'Contacted', 'Counselling'] },
  { id: 'application', title: 'Application', color: 'var(--chart-2)', stages: ['Application'] },
  { id: 'documents', title: 'Docs Verified', color: 'var(--chart-3)', stages: ['Document Verification'] },
  { id: 'test', title: 'Entrance Test', color: 'var(--chart-4)', stages: ['Entrance Test'] },
  { id: 'interview', title: 'Interview', color: 'var(--chart-5)', stages: ['Interview'] },
  { id: 'selected', title: 'Selected', color: 'var(--chart-6)', stages: ['Offered'] },
  { id: 'fee', title: 'Fee Paid', color: 'var(--chart-7)', stages: [] },
  { id: 'enrolled', title: 'Enrolled', color: 'var(--chart-8)', stages: ['Admitted'] },
];
const STAGE_ORDER = ['New Enquiry', 'Contacted', 'Counselling', 'Application', 'Document Verification',
  'Entrance Test', 'Interview', 'Offered', 'Admitted', 'Lost'];

function columnForEnquiry(e) {
  const col = PIPELINE.find((c) => c.stages.includes(e.stage));
  return col ? col.id : 'enquiry';
}
function stageTone(stage) {
  if (stage === 'Admitted') return 'success';
  if (stage === 'Lost') return 'danger';
  if (stage === 'Offered') return 'info';
  if (stage === 'New Enquiry') return 'info';
  return 'warning';
}

function applicationsFor(ctx) { return scope(db.applications, ctx); }
function enquiriesFor(ctx) { return scope(db.enquiries, ctx); }
function followUpsFor(enquiryId) { return db.followUps.filter((f) => f.enquiryId === enquiryId); }
function applicationForEnquiry(id) { return db.applications.find((a) => a.enquiryId === id) || null; }

const DOC_TYPES = [
  'Birth Certificate', 'Aadhaar Card (Student)', 'Transfer Certificate', 'Previous Report Card',
  'Passport Photographs', 'Address Proof', 'Vaccination / Medical Record', 'Category / Caste Certificate',
];

/** Deterministic per-application document checklist. */
function documentsFor(app) {
  const submitted = app.documentsSubmitted || 0;
  return DOC_TYPES.map((name, i) => {
    const isIn = i < submitted;
    const verified = app.documentStatus === 'Verified' ? isIn : isIn && seedOf(app.id + name) > 0.42;
    const rejected = isIn && !verified && seedOf(app.id + name + 'r') > 0.78;
    return {
      id: `${app.id}-D${i + 1}`,
      name,
      file: `${name.toLowerCase().replace(/[^a-z]+/g, '-')}-${app.applicationNo.replace(/\//g, '')}.pdf`,
      size: `${(120 + Math.round(seedOf(app.id + name + 's') * 1800))} KB`,
      uploadedOn: addDaysIso(app.submittedOn, i % 4),
      required: i < 6,
      status: !isIn ? 'Not Submitted' : rejected ? 'Rejected' : verified ? 'Verified' : 'Under Review',
      remark: rejected ? 'Scan is unreadable — please re-upload a clearer copy.' : null,
    };
  });
}

/** Composite merit score: 70% entrance, 30% interview. */
function meritScore(app) {
  const e = app.entranceScore || 0;
  const i = (app.interviewScore || 0) * 10;
  if (!app.entranceScore && !app.interviewScore) return 0;
  return Math.round((e * 0.7 + i * 0.3) * 10) / 10;
}
function meritPool(ctx) {
  return applicationsFor(ctx)
    .filter((a) => a.entranceScore != null)
    .map((a) => ({ ...a, score: meritScore(a) }))
    .sort((a, b) => b.score - a.score)
    .map((a, i) => ({ ...a, rank: i + 1 }));
}

/* ------------------------------------------------------------ complaints */

function complaintsFor(ctx) { return scope(db.complaints, ctx); }
function slaPct(c) {
  return Math.min(150, Math.round((c.ageHours / Math.max(1, c.slaHours)) * 100));
}
function slaTone(c) {
  if (c.status === 'Resolved' || c.status === 'Closed') return 'success';
  const p = slaPct(c);
  return p >= 100 ? 'danger' : p >= 75 ? 'warning' : 'success';
}
function slaCell(c) {
  const p = slaPct(c);
  const tone = slaTone(c);
  const colour = tone === 'danger' ? 'var(--danger-500)' : tone === 'warning' ? 'var(--warning-500)' : 'var(--success-500)';
  return h('div', { className: 'stack-1', style: { minWidth: '120px' } },
    h('div', { className: 'adm-sla' }, h('span', { style: { width: Math.min(100, p) + '%', background: colour } })),
    h('div', { className: 't-2xs t-muted t-num' },
      c.status === 'Resolved' || c.status === 'Closed'
        ? `Closed in ${Math.max(1, Math.round(c.ageHours / 24))}d`
        : `${p}% of ${c.slaHours}h`));
}

/** The grievance state machine, rendered as an approval trail. */
function complaintTrail(c) {
  const created = c.createdAt;
  const trail = [
    { label: 'Raised', by: `${c.raisedByName} (${c.raisedBy})`, date: created, state: 'approved', note: c.subject },
    { label: 'Acknowledged by front office', by: 'Reception Desk', date: addDaysIso(created, 0), state: 'approved', note: `Ticket ${c.ticketNo} logged under ${c.category}.` },
    { label: `Assigned to ${c.department}`, by: c.assignedToName || 'Unassigned', date: addDaysIso(created, 1), state: c.status === 'Open' ? 'pending' : 'approved', note: `SLA ${c.slaHours} hours · ${c.priority} priority.` },
  ];
  if (c.status === 'In Progress' || c.status === 'Escalated' || c.status === 'Resolved' || c.status === 'Closed') {
    trail.push({ label: 'Work in progress', by: c.assignedToName, date: addDaysIso(created, 2), state: 'approved', note: 'Owner acknowledged and started remediation.' });
  }
  if (c.status === 'Escalated') {
    trail.push({ label: 'Escalated to Principal', by: 'Auto-escalation (SLA breach)', date: addDaysIso(created, 3), state: 'rejected', note: `Breached the ${c.slaHours}h SLA — escalated one level.` });
  }
  if (c.resolvedAt) {
    trail.push({ label: 'Resolved', by: c.assignedToName, date: c.resolvedAt, state: 'approved', note: c.resolutionNote });
  }
  if (c.status === 'Closed') {
    trail.push({ label: 'Closed after feedback', by: c.raisedByName, date: addDaysIso(c.resolvedAt || created, 1), state: 'approved', note: 'Complainant confirmed the resolution.' });
  } else if (c.status !== 'Resolved') {
    trail.push({ label: 'Resolution & feedback', by: '—', date: null, state: 'pending', note: 'Pending closure and satisfaction rating.' });
  }
  return trail;
}

/* ====================================================== shared components = */

/** Enquiry quick-view drawer: profile, follow-up timeline, calls, counselling
 *  notes and the next-action scheduler. Used by four screens. */
function openEnquiryDrawer(e, { onChange } = {}) {
  const app = applicationForEnquiry(e.id);
  const fus = followUpsFor(e.id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const calls = db.callLogs.filter((c) => c.purpose === 'Admission Enquiry' && c.campusId === e.campusId).slice(0, 4);

  let nextMode = 'Phone Call';
  let nextDate = e.nextFollowUp || DEMO_TODAY;
  let nextNote = '';

  const stepIndex = Math.max(0, STAGE_ORDER.indexOf(e.stage));
  const steps = STAGE_ORDER.slice(0, 9).map((s, i) => ({
    label: s,
    state: e.stage === 'Lost' ? (i === 0 ? 'rejected' : 'todo')
      : i < stepIndex ? 'done' : i === stepIndex ? 'current' : 'todo',
  }));

  const tabHost = h('div', { className: 'stack-3' });
  const tabs = Tabs([
    { id: 'summary', label: 'Summary', icon: 'user' },
    { id: 'follow', label: 'Follow-ups', icon: 'phone-call', count: fus.length },
    { id: 'notes', label: 'Counselling', icon: 'handshake' },
    { id: 'next', label: 'Next action', icon: 'calendar-plus' },
  ], (id) => paint(id), { active: 'summary' });

  function summary() {
    return frag(
      Card({ pad: true }, h('div', { className: 'stack-3' },
        h('div', { className: 't-eyebrow' }, 'Pipeline position'),
        Stepper(steps, { current: stepIndex }))),
      SectionCard({ title: 'Candidate', icon: 'graduation-cap' },
        DescriptionList([
          ['Enquiry no', h('code', null, e.enquiryNo)],
          ['Student', e.studentName],
          ['Gender', e.gender],
          ['Date of birth', formatDate(e.dob)],
          ['Seeking class', e.className],
          ['Campus', campusName(e.campusId)],
          ['Previous school', e.previousSchool || 'First-time admission'],
          ['Source', e.source],
        ], { cols: 2 })),
      SectionCard({ title: 'Parent / guardian', icon: 'users' },
        DescriptionList([
          ['Name', e.parentName],
          ['Relation', e.relation],
          ['Phone', h('a', { className: 't-link', href: `tel:${e.phone}` }, e.phone)],
          ['Email', e.email],
          ['City', e.city],
          ['Assigned counsellor', e.assignedToName || 'Unassigned'],
        ], { cols: 2 })),
      app ? SectionCard({ title: 'Linked application', icon: 'clipboard-check',
        actions: Button('Open review', { variant: 'ghost', size: 'sm', icon: 'external-link', onClick: () => navigate(`admissions/application-review/${app.id}`) }) },
      DescriptionList([
        ['Application no', h('code', null, app.applicationNo)],
        ['Mode', app.mode],
        ['Documents', `${app.documentsSubmitted}/${app.documentsRequired} · ${app.documentStatus}`],
        ['Entrance score', app.entranceScore != null ? `${app.entranceScore}/100` : 'Not attempted'],
        ['Interview score', app.interviewScore != null ? `${app.interviewScore}/10` : 'Not scheduled'],
        ['Status', Badge(app.status)],
      ], { cols: 2 }))
        : Callout({ tone: 'info', icon: 'info', title: 'No application yet' },
          'This enquiry has not converted to a formal application. Move it to the Application stage to generate one.'),
      SectionCard({ title: 'Recent reception calls', icon: 'phone',
        subtitle: 'Admission calls logged at this campus' },
      calls.length ? Timeline(calls.map((c) => ({
        title: `${c.direction} call · ${c.callerName}`,
        meta: `${formatDate(c.date)} ${c.time} · ${c.durationMin} min`,
        text: c.notes, icon: 'phone-call', tone: c.direction === 'Incoming' ? 'info' : 'brand',
      })))
        : EmptyState({ icon: 'phone', title: 'No calls logged', text: 'Reception has not logged an admission call for this campus yet.' })));
  }

  function follow() {
    if (!fus.length) {
      return EmptyState({
        icon: 'phone-call', title: 'No follow-ups recorded',
        text: 'Nobody has contacted this parent yet. Schedule the first call from the Next action tab.',
        action: Button('Schedule a call', { variant: 'primary', icon: 'calendar-plus', onClick: () => paint('next') }),
      });
    }
    return frag(
      Card({ pad: true }, h('div', { className: 'row-4 row-wrap' },
        MetricRow('Total follow-ups', String(fus.length)),
        MetricRow('Last contact', formatDate(e.lastContact)),
        MetricRow('Next due', formatDate(e.nextFollowUp)))),
      SectionCard({ title: 'Follow-up history', icon: 'history' },
        Timeline(fus.map((f) => ({
          title: `${f.mode} · ${f.outcome}`,
          meta: `${formatDate(f.date)} · ${f.by || 'Admissions desk'}`,
          text: f.notes,
          icon: f.mode === 'Phone Call' ? 'phone-call' : f.mode === 'Email' ? 'mail' : f.mode === 'Campus Visit' ? 'building' : 'message-circle',
          tone: f.outcome === 'Interested' ? 'success' : f.outcome === 'Not reachable' ? 'danger' : 'info',
        })))));
  }

  function notes() {
    const seeded = [
      { author: e.assignedToName || 'Admissions desk', time: formatDate(e.createdAt), text: `Counselling opened for ${e.studentName} (${e.className}). ${e.remarks}` },
      { author: 'Principal’s office', time: formatDate(e.lastContact), text: e.previousSchool ? `Parent compared curriculum with ${e.previousSchool}. Shared CBSE continuity note.` : 'First-time school admission — walked the parent through the primary programme.' },
    ];
    return frag(
      SectionCard({ title: 'Counselling notes', icon: 'handshake', subtitle: 'Visible to the admissions team only' },
        CommentThread(seeded, {
          placeholder: 'Add a counselling note…',
          onSubmit: (text) => notify({ title: 'Note added', text, tone: 'success' }),
        })),
      SectionCard({ title: 'Interest & objections', icon: 'target' },
        h('div', { className: 'stack-2' },
          MetricRow('Priority', priorityBadge(e.priority)),
          MetricRow('Fee sensitivity', Rating(Math.max(1, Math.round(seedOf(e.id + 'fee') * 5)), { showValue: false })),
          MetricRow('Transport required', Badge(seedOf(e.id + 't') > 0.45 ? 'Yes' : 'No', { tone: 'neutral' })),
          MetricRow('Sibling in school', Badge(e.source === 'Sibling' ? 'Yes' : 'No', { tone: e.source === 'Sibling' ? 'success' : 'neutral' })))));
  }

  function next() {
    return frag(
      Callout({ tone: 'brand', icon: 'calendar-plus', title: 'Schedule the next action' },
        'The parent will receive an SMS reminder the evening before. This prototype does not persist changes.'),
      Card({ pad: true }, FormGrid({ cols: 2 },
        Field({ label: 'Mode', required: true },
          Select({ options: ['Phone Call', 'WhatsApp', 'Email', 'Campus Visit', 'Home Visit'], value: nextMode, onChange: (v) => { nextMode = v; } })),
        Field({ label: 'Date', required: true },
          DatePicker({ value: nextDate, width: '100%', onChange: (v) => { nextDate = v; } })),
        Field({ label: 'Owner' },
          Select({ options: db.staff.filter((s) => s.designation === 'Admission Officer').map((s) => s.name), value: e.assignedToName || undefined, onChange: () => {} })),
        Field({ label: 'Outcome expected' },
          Select({ options: ['Interested', 'Call back later', 'Visit scheduled', 'Documents requested', 'Negotiating fee'], onChange: () => {} })),
        Field({ label: 'Notes', className: 'col-span-full' },
          Textarea({ rows: 3, placeholder: 'What should the counsellor cover on this call?', onInput: (v) => { nextNote = v; } })))),
      SectionCard({ title: 'Move stage', icon: 'workflow' },
        h('div', { className: 'row-3 row-wrap' },
          STAGE_ORDER.map((s) => Pill(s, {
            active: s === e.stage,
            onClick: () => {
              if (s === e.stage) return;
              e.stage = s;
              notify({ title: `Moved to ${s}`, text: `${e.studentName} · ${e.enquiryNo}`, tone: 'success' });
              if (onChange) onChange(e);
              paint('summary');
            },
          })))));
  }

  function paint(id) {
    tabHost.innerHTML = '';
    tabHost.appendChild(id === 'follow' ? follow() : id === 'notes' ? notes() : id === 'next' ? next() : summary());
  }
  paint('summary');

  return Drawer({
    title: e.studentName,
    subtitle: `${e.enquiryNo} · ${e.className} · ${campusName(e.campusId)}`,
    size: 'xl',
    body: h('div', { className: 'stack-3' },
      h('div', { className: 'row-3 row-wrap' },
        Avatar(e.studentName, { size: 'lg' }),
        h('div', { className: 'flex-1 stack-1' },
          h('div', { className: 'row-3 row-wrap' },
            Badge(e.stage, { tone: stageTone(e.stage) }),
            priorityBadge(e.priority),
            Badge(e.source, { tone: 'neutral' })),
          h('div', { className: 't-sm t-muted' },
            `${e.parentName} (${e.relation}) · ${e.phone} · enquiry ${relativeTime(e.createdAt)}`))),
      h('div', { className: 'page-tabs' }, tabs),
      tabHost),
    actions: (close) => frag(
      Button('Close', { variant: 'ghost', onClick: close }),
      Button('Log follow-up', { variant: 'secondary', icon: 'phone-call', onClick: () => paint('next') }),
      Button('Convert to application', {
        variant: 'primary', icon: 'clipboard-check',
        onClick: () => {
          close();
          notify({ title: 'Application created', text: `${e.studentName} moved to the Application stage.`, tone: 'success' });
        },
      })),
  });
}

/** Complaint drawer with the full state machine, SLA timer and feedback. */
function openComplaintDrawer(c, { onChange } = {}) {
  const cat = db.complaintCategories.find((k) => k.name === c.category);
  const pct = slaPct(c);
  const tone = slaTone(c);
  return Drawer({
    title: c.subject,
    subtitle: `${c.ticketNo} · ${c.category} · raised by ${c.raisedByName} (${c.raisedBy})`,
    size: 'lg',
    body: h('div', { className: 'stack-3' },
      h('div', { className: 'row-3 row-wrap' },
        Badge(c.status), priorityBadge(c.priority),
        c.slaBreached ? Badge('SLA breached', { tone: 'danger', icon: 'alert-triangle' }) : Badge('Within SLA', { tone: 'success', icon: 'timer' })),
      Card({ pad: true }, h('div', { className: 'stack-2' },
        h('div', { className: 'row' },
          h('span', { className: 't-eyebrow' }, 'SLA timer'),
          h('span', { className: 'spacer' }),
          h('span', { className: 't-sm t-num t-medium' }, `${c.ageHours}h elapsed of ${c.slaHours}h`)),
        ProgressBar(Math.min(100, pct), { tone: tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : 'success', showValue: true }),
        h('div', { className: 't-xs t-muted' },
          cat ? `Owner desk: ${cat.owner} · category SLA ${cat.slaHours}h` : `Owner desk: ${c.department}`))),
      SectionCard({ title: 'Ticket detail', icon: 'file-text' },
        DescriptionList([
          ['Ticket', h('code', null, c.ticketNo)],
          ['Raised on', formatDate(c.createdAt)],
          ['Campus', campusName(c.campusId)],
          ['Department', c.department],
          ['Assigned to', c.assignedToName || 'Unassigned'],
          ['Comments', formatNumber(c.comments)],
          ['Resolved on', c.resolvedAt ? formatDate(c.resolvedAt) : '—'],
          ['Satisfaction', c.satisfaction ? Rating(c.satisfaction, { showValue: true }) : 'Awaiting feedback'],
        ], { cols: 2 }),
        h('div', { className: 'mt-3 t-sm t-secondary' }, c.description)),
      SectionCard({ title: 'Workflow', icon: 'workflow', subtitle: 'Raise → acknowledge → assign → work → resolve → feedback' },
        ApprovalTrail(complaintTrail(c))),
      SectionCard({ title: 'Conversation', icon: 'message-circle' },
        CommentThread([
          { author: c.raisedByName, time: formatDate(c.createdAt), text: c.description },
          { author: c.assignedToName || 'Helpdesk', time: formatDate(addDaysIso(c.createdAt, 1)), text: 'Acknowledged. We are looking into this and will update you within the SLA window.' },
          c.resolutionNote && { author: c.assignedToName || 'Helpdesk', time: formatDate(c.resolvedAt), text: c.resolutionNote },
        ].filter(Boolean), { onSubmit: (t) => notify({ title: 'Reply posted', text: t, tone: 'success' }) }))),
    actions: (close) => frag(
      Button('Escalate', {
        variant: 'ghost', icon: 'trending-up',
        onClick: () => ConfirmDialog({
          title: 'Escalate this ticket?', tone: 'danger', icon: 'trending-up',
          text: `${c.ticketNo} will be raised to the Principal’s desk and the SLA clock restarts at ${Math.round(c.slaHours / 2)}h.`,
          confirmLabel: 'Escalate',
        }).then((ok) => { if (ok) { c.status = 'Escalated'; notify({ title: 'Escalated', text: c.ticketNo, tone: 'warning' }); if (onChange) onChange(); close(); } }),
      }),
      Button('Reassign', { variant: 'secondary', icon: 'user-check', onClick: mockAction('Reassign ticket') }),
      Button('Resolve', {
        variant: 'primary', icon: 'check-circle',
        onClick: () => ConfirmDialog({
          title: 'Mark as resolved?', tone: 'brand', icon: 'check-circle',
          text: 'The complainant will be asked to rate the resolution.', confirmLabel: 'Resolve',
        }).then((ok) => { if (ok) { c.status = 'Resolved'; notify({ title: 'Ticket resolved', text: c.ticketNo, tone: 'success' }); if (onChange) onChange(); close(); } }),
      })),
  });
}

/* ================================================================ routes = */

export const routes = {

  /* ------------------------------------------------ admissions/dashboard */
  'admissions/dashboard': {
    title: 'Admission Dashboard',
    subtitle: 'Funnel health, source attribution and counsellor performance',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const enq = enquiriesFor(ctx);
      const apps = applicationsFor(ctx);
      const funnel = analytics.admissionFunnel;
      const admitted = enq.filter((e) => e.stage === 'Admitted').length;
      const lost = enq.filter((e) => e.stage === 'Lost').length;
      const open = enq.length - admitted - lost;
      const conv = enq.length ? Math.round((admitted / enq.length) * 1000) / 10 : 0;
      const dueToday = enq.filter((e) => e.nextFollowUp <= DEMO_TODAY && e.status === 'Open').length;

      const bySource = countBy(enq, 'source');
      const byStage = STAGE_ORDER.map((s) => ({ key: s, value: enq.filter((e) => e.stage === s).length }));
      const counsellors = sumBy(enq.map((e) => ({ name: e.assignedToName || 'Unassigned', won: e.stage === 'Admitted' ? 1 : 0 })), 'name', 'won');

      mount.appendChild(dashboardPage({
        greeting: greetingFor(meNow()),
        title: `Admissions 2026-27 · ${campusLabel(ctx)}`,
        subtitle: `${formatNumber(enq.length)} enquiries in the funnel · ${formatNumber(apps.length)} formal applications · cut-over 31 March 2027`,
        route: 'admissions/dashboard',
        actions: pageActions(
          Button('Follow-ups due', { variant: 'secondary', icon: 'phone-call', route: 'admissions/follow-ups' }),
          Button('Open pipeline', { variant: 'primary', icon: 'workflow', route: 'admissions/leads' })),
        kpis: [
          { label: 'Total enquiries', value: formatNumber(enq.length), delta: 8.4, deltaLabel: 'vs last session', icon: 'message-square', tone: 'brand', trend: analytics.sparks.admissions, onClick: () => navigate('admissions/enquiries') },
          { label: 'Applications', value: formatNumber(apps.length), delta: 5.1, icon: 'clipboard-check', tone: 'info', onClick: () => navigate('admissions/online-applications') },
          { label: 'Admitted', value: formatNumber(admitted), delta: 6.2, icon: 'user-check', tone: 'success', onClick: () => navigate('admissions/confirmation') },
          { label: 'Conversion rate', value: `${conv}%`, delta: 1.4, icon: 'percent', tone: 'brand' },
          { label: 'Follow-ups due', value: formatNumber(dueToday), delta: -4.5, deltaDir: 'down', icon: 'phone-call', tone: 'warning', onClick: () => navigate('admissions/follow-ups') },
          { label: 'Lost enquiries', value: formatNumber(lost), delta: -2.2, icon: 'user-x', tone: 'danger' },
        ],
        widgets: [
          { span: 7, render: () => SectionCard({ title: 'Admission funnel', subtitle: 'Enquiry to enrolment, current session', className: 'chart-card',
            actions: Button('Detail', { variant: 'ghost', size: 'sm', icon: 'chart-bar', route: 'admissions/reports' }) },
          funnelChart({ stages: funnel.map((f) => ({ label: f.stage, value: f.count })), showConversion: true, height: 320, title: 'Admission funnel' })) },
          { span: 5, render: () => SectionCard({ title: 'Source attribution', subtitle: 'Where enquiries originate', className: 'chart-card' },
            donutChart({ data: bySource.slice(0, 6).map((s) => ({ key: s.key, value: s.value })), height: 300, centerLabel: 'Enquiries', centerValue: formatNumber(enq.length), title: 'Enquiries by source' })) },
          { span: 8, render: () => SectionCard({ title: 'Enquiries, applications and admissions by month', className: 'chart-card' },
            comboChart({
              categories: analytics.admissionTrend.map((r) => r.month),
              bars: [
                { name: 'Enquiries', values: analytics.admissionTrend.map((r) => r.enquiries) },
                { name: 'Applications', values: analytics.admissionTrend.map((r) => r.applications) },
              ],
              line: { name: 'Admitted', values: analytics.admissionTrend.map((r) => r.admitted) },
              height: 300, title: 'Admissions trend',
            })) },
          { span: 4, render: () => SectionCard({ title: 'Stage distribution', subtitle: 'Live enquiry pipeline', className: 'chart-card' },
            barChart({
              horizontal: true,
              categories: byStage.map((s) => s.key),
              series: [{ name: 'Enquiries', values: byStage.map((s) => s.value) }],
              height: 300, showValues: true, title: 'Enquiries by stage',
            })) },
          { span: 5, render: () => SectionCard({ title: 'Counsellor leaderboard', subtitle: 'Admissions confirmed this session', icon: 'trophy' },
            counsellors.length
              ? RankList(counsellors.slice(0, 8).map((c) => ({ name: c.key, meta: 'Admission Officer', value: `${c.value} admits` })))
              : EmptyState({ icon: 'users', title: 'No counsellors assigned', text: 'Assign admission officers to enquiries to see the leaderboard.' })) },
          { span: 7, render: () => SectionCard({ title: 'Seats vs applications by class', className: 'chart-card', subtitle: 'Demand pressure across the grade ladder' },
            barChart({
              categories: analytics.admissionsByClass.slice(0, 14).map((r) => r.className),
              series: [
                { name: 'Applications', values: analytics.admissionsByClass.slice(0, 14).map((r) => r.applications) },
                { name: 'Seats', values: analytics.admissionsByClass.slice(0, 14).map((r) => r.seats) },
                { name: 'Admitted', values: analytics.admissionsByClass.slice(0, 14).map((r) => r.admitted) },
              ],
              height: 300, title: 'Applications vs seats',
            })) },
          { span: 6, render: () => SectionCard({ title: 'Today’s priority follow-ups', icon: 'phone-call',
            actions: Button('All follow-ups', { variant: 'ghost', size: 'sm', route: 'admissions/follow-ups' }) },
          (() => {
            const rows = enq.filter((e) => e.status === 'Open' && e.priority === 'High').slice(0, 6);
            return rows.length ? Timeline(rows.map((e) => ({
              title: `${e.studentName} · ${e.className}`,
              meta: `${e.parentName} · ${e.phone} · due ${formatDate(e.nextFollowUp)}`,
              text: e.remarks, icon: 'phone-call', tone: 'warning',
              render: () => h('div', { className: 'row mt-2' },
                Button('Open', { variant: 'secondary', size: 'sm', icon: 'eye', onClick: () => openEnquiryDrawer(e) })),
            }))) : EmptyState({ icon: 'check-circle', title: 'Nothing urgent', text: 'No high-priority follow-ups are pending right now.' });
          })()) },
          { span: 6, render: () => SectionCard({ title: 'Recent applications', icon: 'clipboard-list',
            actions: Button('Review queue', { variant: 'ghost', size: 'sm', route: 'admissions/application-review' }) },
          DataTable({
            columns: [
              { key: 'applicationNo', label: 'Application', width: 130, render: (r) => h('code', null, r.applicationNo) },
              { key: 'studentName', label: 'Candidate', render: (r) => Identity(r.studentName, r.className) },
              { key: 'status', label: 'Status', width: 110, render: (r) => Badge(r.status) },
            ],
            rows: sortBy(apps, 'submittedOn', 'desc').slice(0, 8),
            paginate: false, searchable: false, columnToggle: false, exportable: false,
            onRowClick: (r) => navigate(`admissions/application-review/${r.id}`),
            maxHeight: 'none',
          })) },
        ],
      }));
    },
  },

  /* ------------------------------------------------ admissions/enquiries */
  'admissions/enquiries': {
    title: 'Enquiries',
    subtitle: 'Every admission enquiry captured across channels',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const all = enquiriesFor(ctx);
      let activeTab = 'all';
      const tabRows = {
        all: all,
        open: all.filter((e) => e.status === 'Open'),
        due: all.filter((e) => e.status === 'Open' && e.nextFollowUp <= DEMO_TODAY),
        converted: all.filter((e) => e.stage === 'Admitted'),
        lost: all.filter((e) => e.stage === 'Lost'),
      };

      const node = listPage({
        title: 'Enquiries',
        subtitle: `${formatNumber(all.length)} enquiries · ${campusLabel(ctx)} · academic year 2026-27`,
        route: 'admissions/enquiries',
        actions: pageActions(
          MenuButton([
            { label: 'Import from CSV', icon: 'upload', onClick: mockAction('Import enquiries') },
            { label: 'Download prospectus pack', icon: 'download', onClick: mockAction('Download pack') },
            { separator: true },
            { label: 'Bulk SMS to open enquiries', icon: 'send', onClick: mockAction('Bulk SMS') },
          ], { label: 'More actions' }),
          Button('Pipeline view', { variant: 'secondary', icon: 'workflow', route: 'admissions/leads' }),
          Button('New enquiry', { variant: 'primary', icon: 'plus', route: 'admissions/registration' })),
        kpis: [
          { label: 'Total', value: formatNumber(all.length), icon: 'message-square', tone: 'brand', trend: analytics.sparks.admissions },
          { label: 'Open', value: formatNumber(tabRows.open.length), icon: 'inbox', tone: 'info' },
          { label: 'Due today', value: formatNumber(tabRows.due.length), icon: 'phone-call', tone: 'warning' },
          { label: 'Converted', value: formatNumber(tabRows.converted.length), icon: 'user-check', tone: 'success' },
        ],
        tabs: [
          { id: 'all', label: 'All', count: all.length },
          { id: 'open', label: 'Open', count: tabRows.open.length },
          { id: 'due', label: 'Follow-up due', count: tabRows.due.length },
          { id: 'converted', label: 'Converted', count: tabRows.converted.length },
          { id: 'lost', label: 'Lost', count: tabRows.lost.length },
        ],
        activeTab,
        onTabChange: (id) => { activeTab = id; node.table.refresh(tabRows[id] || all); },
        chart: barChart({
          categories: countBy(all, 'source').map((s) => s.key),
          series: [{ name: 'Enquiries', values: countBy(all, 'source').map((s) => s.value) }],
          height: 220, showValues: true, title: 'Enquiries by source',
        }),
        chartTitle: 'Enquiries by acquisition source',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Student, parent, phone or enquiry no…', width: 280 },
          { id: 'stage', label: 'Stage', options: STAGE_ORDER },
          { id: 'source', label: 'Source', options: countBy(all, 'source').map((s) => s.key) },
          { id: 'className', label: 'Class', options: [...new Set(all.map((e) => e.className))] },
          { id: 'priority', label: 'Priority', options: ['High', 'Medium', 'Low'] },
          { id: 'from', type: 'date', label: 'Enquired after' },
        ],
        onFilter: (id, value, allV, table) => table.refresh(applyFilters(tabRows[activeTab] || all, allV, {
          q: matchText('studentName', 'parentName', 'phone', 'enquiryNo', 'email'),
          stage: matchEq('stage'),
          source: matchEq('source'),
          className: matchEq('className'),
          priority: matchEq('priority'),
          from: dateFrom('createdAt'),
        })),
        columns: [
          { key: 'studentName', label: 'Candidate', sticky: true, width: 240,
            render: (r) => Identity(r.studentName, `${r.enquiryNo} · ${r.className}`), value: (r) => r.studentName },
          { key: 'parentName', label: 'Parent', width: 170, render: (r) => h('div', { className: 'stack-1' },
            h('span', { className: 't-sm' }, r.parentName),
            h('span', { className: 't-xs t-muted t-num' }, r.phone)) },
          { key: 'className', label: 'Class', width: 110, filter: true },
          { key: 'source', label: 'Source', width: 130, filter: true },
          { key: 'stage', label: 'Stage', width: 150, filter: true, render: (r) => Badge(r.stage, { tone: stageTone(r.stage) }) },
          { key: 'priority', label: 'Priority', width: 100, filter: true, render: (r) => priorityBadge(r.priority) },
          { key: 'followUps', label: 'Touches', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'nextFollowUp', label: 'Next follow-up', width: 140, render: (r) => h('span', {
            className: r.nextFollowUp <= DEMO_TODAY && r.status === 'Open' ? 't-danger t-num t-medium' : 't-num' }, formatDate(r.nextFollowUp)) },
          { key: 'assignedToName', label: 'Counsellor', width: 170, filter: true },
          { key: 'createdAt', label: 'Enquired', width: 130, render: (r) => formatDate(r.createdAt) },
        ],
        rows: all,
        selectable: true,
        footerAggregates: true,
        searchKeys: ['studentName', 'parentName', 'phone', 'enquiryNo', 'className'],
        exportName: 'admission-enquiries',
        bulkActions: [
          { label: 'Assign counsellor', icon: 'user-check', onClick: (sel) => notify({ title: `${sel.length} enquiries reassigned`, tone: 'success' }) },
          { label: 'Send prospectus', icon: 'send', onClick: (sel) => notify({ title: `Prospectus emailed to ${sel.length} parents`, tone: 'success' }) },
          { label: 'Mark as lost', icon: 'user-x', tone: 'danger', onClick: (sel) => ConfirmDialog({
            title: `Mark ${sel.length} enquiries as lost?`, tone: 'danger',
            text: 'They will move out of the active pipeline and into the lost report.', confirmLabel: 'Mark lost',
          }).then((ok) => ok && notify({ title: `${sel.length} enquiries marked lost`, tone: 'danger' })) },
        ],
        rowActions: (row) => [
          { label: 'Quick view', icon: 'eye', onClick: () => openEnquiryDrawer(row) },
          { label: 'Log follow-up', icon: 'phone-call', onClick: () => openEnquiryDrawer(row) },
          { label: 'Open counselling', icon: 'handshake', route: 'admissions/counselling' },
          { separator: true },
          { label: 'Mark as lost', icon: 'user-x', tone: 'danger', onClick: () => ConfirmDialog({
            title: 'Mark this enquiry as lost?', tone: 'danger', text: `${row.studentName} · ${row.enquiryNo}`, confirmLabel: 'Mark lost',
          }).then((ok) => ok && notify({ title: 'Enquiry marked lost', tone: 'danger' })) },
        ],
        onRowClick: (row) => openEnquiryDrawer(row),
        emptyState: EmptyState({
          icon: 'message-square', title: 'No enquiries yet',
          text: 'Capture a walk-in, phone or website enquiry to start the admission funnel.',
          action: Button('New enquiry', { variant: 'primary', icon: 'plus', route: 'admissions/registration' }),
        }),
      });
      mount.appendChild(node);
    },
  },

  /* ---------------------------------------------------- admissions/leads */
  'admissions/leads': {
    title: 'Lead Pipeline',
    subtitle: 'Drag candidates across the admission pipeline',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const all = enquiriesFor(ctx).filter((e) => e.stage !== 'Lost');
      let rows = all.slice();
      let view = 'board';

      const cardFor = (e) => ({
        id: e.id,
        columnId: applicationForEnquiry(e.id) && applicationForEnquiry(e.id).admissionFeePaid && e.stage !== 'Admitted' ? 'fee' : columnForEnquiry(e),
        title: e.studentName,
        meta: `${e.className} · ${e.source}`,
        badge: e.priority,
        tone: priorityTone(e.priority),
        avatar: e.assignedToName || e.parentName,
        raw: e,
      });

      const host = h('div', { className: 'stack' });

      const kpis = [
        { label: 'In pipeline', value: formatNumber(all.length), icon: 'workflow', tone: 'brand' },
        { label: 'Offer stage', value: formatNumber(all.filter((e) => e.stage === 'Offered').length), icon: 'award', tone: 'info' },
        { label: 'Enrolled', value: formatNumber(all.filter((e) => e.stage === 'Admitted').length), icon: 'user-check', tone: 'success' },
        { label: 'High priority', value: formatNumber(all.filter((e) => e.priority === 'High').length), icon: 'flag', tone: 'warning' },
      ];

      const boardHost = h('div');
      const tableHost = h('div');

      const renderCard = (card) => {
        const e = card.raw;
        return h('div', { className: 'stack-1' },
          h('div', { className: 'row', style: { gap: 'var(--sp-2)' } },
            Avatar(e.studentName, { size: 'xs' }),
            h('span', { className: 't-sm t-semibold t-truncate' }, e.studentName)),
          h('div', { className: 't-xs t-muted' }, `${e.className} · ${e.enquiryNo}`),
          h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-1)' } },
            priorityBadge(e.priority),
            Badge(e.source, { tone: 'neutral', size: 'sm' })),
          h('div', { className: 't-2xs t-faint' }, `Next: ${formatDate(e.nextFollowUp)} · ${e.assignedToName || 'Unassigned'}`));
      };

      const paintBoard = () => {
        boardHost.innerHTML = '';
        const board = kanbanPage({
          columns: PIPELINE.map((c) => ({ id: c.id, title: c.title, color: c.color, limit: 120 })),
          cards: rows.map(cardFor),
          renderCard,
          onCardClick: (card) => openEnquiryDrawer(card.raw, { onChange: () => paintBoard() }),
          onMove: (id, to, card) => {
            const col = PIPELINE.find((c) => c.id === to);
            const stage = col && col.stages[0] ? col.stages[0] : card.raw.stage;
            card.raw.stage = stage;
            notify({ title: `${card.title} → ${col ? col.title : to}`, text: 'Pipeline updated (prototype only).', tone: 'success' });
          },
        });
        // strip the inner page frame — we host the board ourselves
        boardHost.appendChild(board.querySelector('.stack') || board);
      };

      const paintTable = () => {
        tableHost.innerHTML = '';
        tableHost.appendChild(DataTable({
          columns: [
            { key: 'studentName', label: 'Candidate', sticky: true, width: 230, render: (r) => Identity(r.studentName, r.enquiryNo) },
            { key: 'className', label: 'Class', width: 110, filter: true },
            { key: 'stage', label: 'Stage', width: 160, filter: true, render: (r) => Badge(r.stage, { tone: stageTone(r.stage) }) },
            { key: 'source', label: 'Source', width: 130, filter: true },
            { key: 'priority', label: 'Priority', width: 110, filter: true, render: (r) => priorityBadge(r.priority) },
            { key: 'assignedToName', label: 'Counsellor', width: 170 },
            { key: 'nextFollowUp', label: 'Next action', width: 140, render: (r) => formatDate(r.nextFollowUp) },
          ],
          rows,
          selectable: true,
          onRowClick: (r) => openEnquiryDrawer(r),
          exportName: 'admission-pipeline',
          bulkActions: [{ label: 'Advance stage', icon: 'chevron-right', onClick: (sel) => notify({ title: `${sel.length} candidates advanced`, tone: 'success' }) }],
          emptyState: EmptyState({ icon: 'workflow', title: 'No candidates match', text: 'Relax the filters to see the rest of the pipeline.' }),
        }));
      };

      const swap = (v) => {
        view = v;
        boardHost.classList.toggle('hidden', v !== 'board');
        tableHost.classList.toggle('hidden', v !== 'table');
        if (v === 'table') paintTable();
      };

      const node = page({
        title: 'Lead pipeline',
        subtitle: `${formatNumber(all.length)} active candidates · drag a card to move it to the next stage`,
        route: 'admissions/leads',
        actions: pageActions(
          SegmentedControl([{ id: 'board', label: 'Board', icon: 'columns' }, { id: 'table', label: 'Table', icon: 'table' }],
            (v) => swap(v), { active: 'board' }),
          Button('New enquiry', { variant: 'primary', icon: 'plus', route: 'admissions/registration' })),
        children: host,
      });

      host.appendChild(kpiRow(kpis));
      host.appendChild(Card({ className: 'p-0' }, FilterBar({
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Candidate or parent…', width: 260 },
          { id: 'className', label: 'Class', options: [...new Set(all.map((e) => e.className))] },
          { id: 'source', label: 'Source', options: [...new Set(all.map((e) => e.source))] },
          { id: 'priority', label: 'Priority', options: ['High', 'Medium', 'Low'] },
          { id: 'owner', label: 'Counsellor', options: [...new Set(all.map((e) => e.assignedToName).filter(Boolean))] },
        ],
        onChange: (id, v, allV) => {
          rows = applyFilters(all, allV, {
            q: matchText('studentName', 'parentName', 'phone', 'enquiryNo'),
            className: matchEq('className'),
            source: matchEq('source'),
            priority: matchEq('priority'),
            owner: matchEq('assignedToName'),
          });
          if (view === 'board') paintBoard(); else paintTable();
        },
      })));
      host.appendChild(Card({ pad: true }, h('div', { className: 'adm-legend t-xs t-muted' },
        PIPELINE.map((c) => h('span', { className: 'row', style: { gap: 'var(--sp-1)' } },
          h('span', { className: 'dot', style: { background: c.color } }), c.title)))));
      host.appendChild(boardHost);
      host.appendChild(tableHost);
      tableHost.classList.add('hidden');
      paintBoard();

      mount.appendChild(node);
    },
  },

  /* ----------------------------------------------- admissions/follow-ups */
  'admissions/follow-ups': {
    title: 'Follow-ups',
    subtitle: 'Every counsellor touchpoint and what is due next',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const enqIds = new Set(enquiriesFor(ctx).map((e) => e.id));
      const all = db.followUps.filter((f) => enqIds.has(f.enquiryId));
      const due = enquiriesFor(ctx).filter((e) => e.status === 'Open' && e.nextFollowUp <= DEMO_TODAY);
      const modeSplit = countBy(all, 'mode');
      const outcomeSplit = countBy(all, 'outcome');

      mount.appendChild(listPage({
        title: 'Follow-ups',
        subtitle: `${formatNumber(all.length)} touchpoints logged · ${formatNumber(due.length)} enquiries due today`,
        route: 'admissions/follow-ups',
        actions: pageActions(
          Button('Export call sheet', { variant: 'secondary', icon: 'download', onClick: () => {
            download('follow-up-call-sheet.csv', toCsv(due, [
              { key: 'enquiryNo', label: 'Enquiry' }, { key: 'studentName', label: 'Student' },
              { key: 'parentName', label: 'Parent' }, { key: 'phone', label: 'Phone' },
              { key: 'nextFollowUp', label: 'Due' },
            ]), 'text/csv;charset=utf-8');
            notify({ title: 'Call sheet exported', tone: 'success' });
          } }),
          Button('Log follow-up', { variant: 'primary', icon: 'phone-call', onClick: () => Modal({
            title: 'Log a follow-up', size: 'lg', icon: 'phone-call',
            body: h('div', { className: 'stack-4' },
              FormGrid({ cols: 2 },
                Field({ label: 'Enquiry', required: true }, Combobox({ options: enquiriesFor(ctx).slice(0, 200).map((e) => ({ value: e.id, label: `${e.enquiryNo} · ${e.studentName}` })), placeholder: 'Search enquiry…', onChange: () => {} })),
                Field({ label: 'Mode', required: true }, Select({ options: ['Phone Call', 'Email', 'WhatsApp', 'Campus Visit', 'SMS'], onChange: () => {} })),
                Field({ label: 'Outcome', required: true }, Select({ options: ['Interested', 'Call back later', 'Not reachable', 'Visit scheduled', 'Documents requested', 'Negotiating fee'], onChange: () => {} })),
                Field({ label: 'Next follow-up date' }, DatePicker({ value: DEMO_TODAY, width: '100%', onChange: () => {} })),
                Field({ label: 'Notes', className: 'col-span-full' }, Textarea({ rows: 3, placeholder: 'What was discussed?' })))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'secondary', onClick: close }),
              Button('Save follow-up', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Follow-up logged', text: 'Demo only — nothing was persisted.', tone: 'success' }); } })),
          }) })),
        kpis: [
          { label: 'Touchpoints', value: formatNumber(all.length), icon: 'phone-call', tone: 'brand' },
          { label: 'Due today', value: formatNumber(due.length), icon: 'timer', tone: 'warning' },
          { label: 'Not reachable', value: formatNumber(all.filter((f) => f.outcome === 'Not reachable').length), icon: 'phone', tone: 'danger' },
          { label: 'Visits scheduled', value: formatNumber(all.filter((f) => f.outcome === 'Visit scheduled').length), icon: 'calendar-check', tone: 'success' },
        ],
        chart: h('div', { className: 'grid grid-2' },
          barChart({ categories: modeSplit.map((m) => m.key), series: [{ name: 'Touchpoints', values: modeSplit.map((m) => m.value) }], height: 220, showValues: true, title: 'Follow-ups by mode' }),
          donutChart({ data: outcomeSplit.map((o) => ({ key: o.key, value: o.value })), height: 220, centerLabel: 'Outcomes', title: 'Outcome split' })),
        chartTitle: 'How the team is reaching parents',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Student or counsellor…', width: 260 },
          { id: 'mode', label: 'Mode', options: modeSplit.map((m) => m.key) },
          { id: 'outcome', label: 'Outcome', options: outcomeSplit.map((m) => m.key) },
          { id: 'by', label: 'Counsellor', options: [...new Set(all.map((f) => f.by).filter(Boolean))] },
          { id: 'from', type: 'date', label: 'From' },
        ],
        onFilter: filterHandler(all, {
          q: matchText('studentName', 'by', 'notes'),
          mode: matchEq('mode'),
          outcome: matchEq('outcome'),
          by: matchEq('by'),
          from: dateFrom('date'),
        }),
        columns: [
          { key: 'date', label: 'Date', width: 120, render: (r) => formatDate(r.date) },
          { key: 'studentName', label: 'Candidate', sticky: true, width: 210, render: (r) => Identity(r.studentName, r.enquiryId) },
          { key: 'mode', label: 'Mode', width: 130, filter: true, render: (r) => Badge(r.mode, { tone: 'neutral' }) },
          { key: 'outcome', label: 'Outcome', width: 160, filter: true, render: (r) => Badge(r.outcome, {
            tone: r.outcome === 'Interested' ? 'success' : r.outcome === 'Not reachable' ? 'danger' : 'info' }) },
          { key: 'by', label: 'Logged by', width: 170 },
          { key: 'notes', label: 'Notes', render: (r) => h('span', { className: 't-sm t-clamp-2' }, r.notes) },
          { key: 'nextDate', label: 'Next due', width: 130, render: (r) => formatDate(r.nextDate) },
        ],
        rows: sortBy(all, 'date', 'desc'),
        selectable: true,
        pageSize: 50,
        searchKeys: ['studentName', 'by', 'notes', 'outcome'],
        exportName: 'admission-follow-ups',
        bulkActions: [{ label: 'Reschedule', icon: 'calendar', onClick: (sel) => notify({ title: `${sel.length} follow-ups rescheduled`, tone: 'success' }) }],
        rowActions: (row) => [
          { label: 'Open enquiry', icon: 'eye', onClick: () => { const e = byId(db.enquiries, row.enquiryId); if (e) openEnquiryDrawer(e); } },
          { label: 'Call parent', icon: 'phone', onClick: mockAction('Dial parent') },
        ],
        onRowClick: (row) => { const e = byId(db.enquiries, row.enquiryId); if (e) openEnquiryDrawer(e); },
        emptyState: EmptyState({ icon: 'phone-call', title: 'No follow-ups logged', text: 'Log the first counsellor touchpoint to build the history.' }),
      }));
    },
  },

  /* --------------------------------------------- admissions/counselling */
  'admissions/counselling': {
    title: 'Counselling',
    subtitle: 'Campus visits, counselling sessions and parent objections',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const all = enquiriesFor(ctx).filter((e) => ['Counselling', 'Application', 'Document Verification', 'Contacted'].includes(e.stage));
      const visits = db.followUps.filter((f) => f.mode === 'Campus Visit');
      const objections = [
        { key: 'Fee too high', value: 128 }, { key: 'Distance / transport', value: 96 },
        { key: 'Comparing schools', value: 84 }, { key: 'Seat unavailable', value: 46 },
        { key: 'Board preference', value: 38 }, { key: 'Relocation uncertainty', value: 24 },
      ];

      mount.appendChild(listPage({
        title: 'Counselling',
        subtitle: `${formatNumber(all.length)} families in active counselling · ${campusLabel(ctx)}`,
        route: 'admissions/counselling',
        actions: pageActions(
          Button('Campus tour slots', { variant: 'secondary', icon: 'calendar-check', onClick: mockAction('Campus tour slots') }),
          Button('Book counselling', { variant: 'primary', icon: 'handshake', onClick: mockAction('Book counselling session') })),
        kpis: [
          { label: 'In counselling', value: formatNumber(all.length), icon: 'handshake', tone: 'brand' },
          { label: 'Campus visits', value: formatNumber(visits.length), icon: 'building', tone: 'info' },
          { label: 'High intent', value: formatNumber(all.filter((e) => e.priority === 'High').length), icon: 'flag', tone: 'warning' },
          { label: 'Avg touches', value: (all.reduce((s, e) => s + e.followUps, 0) / Math.max(1, all.length)).toFixed(1), icon: 'phone-call', tone: 'success' },
        ],
        chart: h('div', { className: 'grid grid-2' },
          barChart({ horizontal: true, categories: objections.map((o) => o.key), series: [{ name: 'Families', values: objections.map((o) => o.value) }], height: 240, showValues: true, title: 'Objections raised' }),
          donutChart({ data: countBy(all, 'className').slice(0, 6).map((c) => ({ key: c.key, value: c.value })), height: 240, centerLabel: 'Classes', title: 'Counselling by class' })),
        chartTitle: 'What parents ask about',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Family or candidate…', width: 260 },
          { id: 'className', label: 'Class', options: [...new Set(all.map((e) => e.className))] },
          { id: 'priority', label: 'Intent', options: ['High', 'Medium', 'Low'] },
          { id: 'owner', label: 'Counsellor', options: [...new Set(all.map((e) => e.assignedToName).filter(Boolean))] },
        ],
        onFilter: filterHandler(all, {
          q: matchText('studentName', 'parentName', 'remarks'),
          className: matchEq('className'),
          priority: matchEq('priority'),
          owner: matchEq('assignedToName'),
        }),
        columns: [
          { key: 'studentName', label: 'Family', sticky: true, width: 240, render: (r) => Identity(r.studentName, `${r.parentName} · ${r.relation}`) },
          { key: 'className', label: 'Seeking', width: 110, filter: true },
          { key: 'stage', label: 'Stage', width: 160, render: (r) => Badge(r.stage, { tone: stageTone(r.stage) }) },
          { key: 'priority', label: 'Intent', width: 110, filter: true, render: (r) => priorityBadge(r.priority) },
          { key: 'remarks', label: 'Latest note', render: (r) => h('span', { className: 't-sm t-clamp-2' }, r.remarks) },
          { key: 'previousSchool', label: 'Previous school', width: 170, render: (r) => r.previousSchool || 'First admission' },
          { key: 'assignedToName', label: 'Counsellor', width: 170 },
          { key: 'nextFollowUp', label: 'Next session', width: 140, render: (r) => formatDate(r.nextFollowUp) },
        ],
        rows: all,
        selectable: true,
        searchKeys: ['studentName', 'parentName', 'remarks'],
        exportName: 'counselling-pipeline',
        expandable: (row) => Card({ pad: true }, h('div', { className: 'stack-2' },
          h('div', { className: 't-eyebrow' }, 'Counselling summary'),
          DescriptionList([
            ['Source', row.source], ['City', row.city], ['Phone', row.phone], ['Email', row.email],
            ['Touchpoints', String(row.followUps)], ['Last contact', formatDate(row.lastContact)],
          ], { cols: 2 }),
          h('div', { className: 'row mt-2' },
            Button('Open full record', { variant: 'secondary', size: 'sm', icon: 'eye', onClick: () => openEnquiryDrawer(row) })))),
        rowActions: (row) => [
          { label: 'Open record', icon: 'eye', onClick: () => openEnquiryDrawer(row) },
          { label: 'Schedule campus tour', icon: 'building', onClick: mockAction('Schedule campus tour') },
          { label: 'Share fee structure', icon: 'send', onClick: mockAction('Share fee structure') },
        ],
        onRowClick: (row) => openEnquiryDrawer(row),
        emptyState: EmptyState({ icon: 'handshake', title: 'Nobody in counselling', text: 'Move contacted enquiries into counselling to schedule sessions.' }),
      }));
    },
  },

  /* -------------------------------------- admissions/online-applications */
  'admissions/online-applications': {
    title: 'Online Applications',
    subtitle: 'Applications submitted through the school portal and at the desk',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const all = applicationsFor(ctx);
      let activeTab = 'all';
      const tabRows = {
        all,
        online: all.filter((a) => a.mode === 'Online'),
        offline: all.filter((a) => a.mode === 'Offline'),
        incomplete: all.filter((a) => a.documentsSubmitted < a.documentsRequired),
        offered: all.filter((a) => a.status === 'Offered'),
      };

      const node = listPage({
        title: 'Online applications',
        subtitle: `${formatNumber(all.length)} applications received · ${Math.round((tabRows.online.length / Math.max(1, all.length)) * 100)}% submitted online`,
        route: 'admissions/online-applications',
        actions: pageActions(
          Button('Portal settings', { variant: 'secondary', icon: 'settings', route: 'admissions/settings' }),
          Button('Review queue', { variant: 'primary', icon: 'clipboard-check', route: 'admissions/application-review' })),
        kpis: [
          { label: 'Applications', value: formatNumber(all.length), icon: 'globe', tone: 'brand' },
          { label: 'Online share', value: `${Math.round((tabRows.online.length / Math.max(1, all.length)) * 100)}%`, icon: 'monitor', tone: 'info' },
          { label: 'Incomplete docs', value: formatNumber(tabRows.incomplete.length), icon: 'file-text', tone: 'warning' },
          { label: 'Offers issued', value: formatNumber(tabRows.offered.length), icon: 'award', tone: 'success' },
        ],
        tabs: [
          { id: 'all', label: 'All', count: all.length },
          { id: 'online', label: 'Online', count: tabRows.online.length },
          { id: 'offline', label: 'Walk-in', count: tabRows.offline.length },
          { id: 'incomplete', label: 'Incomplete', count: tabRows.incomplete.length },
          { id: 'offered', label: 'Offered', count: tabRows.offered.length },
        ],
        activeTab,
        onTabChange: (id) => { activeTab = id; node.table.refresh(tabRows[id] || all); },
        chart: barChart({
          categories: countBy(all, 'className').slice(0, 12).map((c) => c.key),
          series: [{ name: 'Applications', values: countBy(all, 'className').slice(0, 12).map((c) => c.value) }],
          height: 220, showValues: true, title: 'Applications by class',
        }),
        chartTitle: 'Applications received by class',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Application no or candidate…', width: 280 },
          { id: 'mode', label: 'Mode', options: ['Online', 'Offline'] },
          { id: 'className', label: 'Class', options: [...new Set(all.map((a) => a.className))] },
          { id: 'documentStatus', label: 'Documents', options: ['Pending', 'Partial', 'Under Review', 'Verified'] },
          { id: 'status', label: 'Status', options: ['In Process', 'Offered', 'Admitted', 'Rejected'] },
        ],
        onFilter: (id, v, allV, table) => table.refresh(applyFilters(tabRows[activeTab] || all, allV, {
          q: matchText('applicationNo', 'studentName', 'parentName', 'phone'),
          mode: matchEq('mode'),
          className: matchEq('className'),
          documentStatus: matchEq('documentStatus'),
          status: matchEq('status'),
        })),
        columns: [
          { key: 'applicationNo', label: 'Application', sticky: true, width: 140, render: (r) => h('code', null, r.applicationNo) },
          { key: 'studentName', label: 'Candidate', width: 230, render: (r) => Identity(r.studentName, `${r.className} · ${r.gender}`) },
          { key: 'parentName', label: 'Parent', width: 170 },
          { key: 'mode', label: 'Mode', width: 100, filter: true, render: (r) => Badge(r.mode, { tone: r.mode === 'Online' ? 'info' : 'neutral' }) },
          { key: 'submittedOn', label: 'Submitted', width: 130, render: (r) => formatDate(r.submittedOn) },
          { key: 'documentsSubmitted', label: 'Documents', width: 160, align: 'right', numeric: true,
            render: (r) => h('div', { className: 'stack-1', style: { minWidth: '120px' } },
              ProgressBar(r.documentsSubmitted, { max: r.documentsRequired, size: 'sm', tone: r.documentsSubmitted === r.documentsRequired ? 'success' : 'warning' }),
              h('span', { className: 't-2xs t-muted t-num' }, `${r.documentsSubmitted}/${r.documentsRequired} · ${r.documentStatus}`)) },
          { key: 'entranceScore', label: 'Entrance', width: 100, align: 'right', numeric: true, aggregate: 'avg',
            format: (v) => (v ? v.toFixed(1) : '—'), render: (r) => (r.entranceScore != null ? String(r.entranceScore) : '—') },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: all,
        selectable: true,
        footerAggregates: true,
        searchKeys: ['applicationNo', 'studentName', 'parentName', 'className'],
        exportName: 'online-applications',
        bulkActions: [
          { label: 'Request missing docs', icon: 'send', onClick: (sel) => notify({ title: `Reminder sent to ${sel.length} applicants`, tone: 'success' }) },
          { label: 'Move to review', icon: 'clipboard-check', onClick: (sel) => notify({ title: `${sel.length} applications queued for review`, tone: 'success' }) },
        ],
        rowActions: (row) => [
          { label: 'Open review', icon: 'clipboard-check', route: `admissions/application-review/${row.id}` },
          { label: 'Verify documents', icon: 'file-text', route: 'admissions/document-verification' },
          { separator: true },
          { label: 'Reject application', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({
            title: 'Reject this application?', tone: 'danger', text: `${row.applicationNo} · ${row.studentName}`, confirmLabel: 'Reject',
          }).then((ok) => ok && notify({ title: 'Application rejected', tone: 'danger' })) },
        ],
        onRowClick: (row) => navigate(`admissions/application-review/${row.id}`),
        emptyState: EmptyState({ icon: 'globe', title: 'No applications yet', text: 'Applications submitted on the portal will appear here within a minute.' }),
      });
      mount.appendChild(node);
    },
  },

  /* -------------------------------------- admissions/application-review */
  'admissions/application-review': {
    title: 'Application Review',
    subtitle: 'Side-by-side form data and document viewer',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const pool = applicationsFor(ctx);

      /* ---- queue view (no id in the URL) ---- */
      if (!ctx.param) {
        const queue = pool.filter((a) => a.status === 'In Process' || a.documentStatus !== 'Verified');
        mount.appendChild(listPage({
          title: 'Application review queue',
          subtitle: `${formatNumber(queue.length)} applications waiting on an admissions decision`,
          route: 'admissions/application-review',
          actions: pageActions(
            Button('All applications', { variant: 'secondary', icon: 'list', route: 'admissions/online-applications' }),
            Button('Open first application', { variant: 'primary', icon: 'clipboard-check', disabled: !queue.length,
              onClick: () => queue.length && navigate(`admissions/application-review/${queue[0].id}`) })),
          kpis: [
            { label: 'In queue', value: formatNumber(queue.length), icon: 'inbox', tone: 'brand' },
            { label: 'Docs verified', value: formatNumber(pool.filter((a) => a.documentStatus === 'Verified').length), icon: 'check-circle', tone: 'success' },
            { label: 'Under review', value: formatNumber(pool.filter((a) => a.documentStatus === 'Under Review').length), icon: 'eye', tone: 'warning' },
            { label: 'Offers issued', value: formatNumber(pool.filter((a) => a.status === 'Offered').length), icon: 'award', tone: 'info' },
          ],
          filters: [
            { id: 'q', type: 'search', label: 'Search', placeholder: 'Application or candidate…', width: 280 },
            { id: 'className', label: 'Class', options: [...new Set(queue.map((a) => a.className))] },
            { id: 'documentStatus', label: 'Documents', options: ['Pending', 'Partial', 'Under Review', 'Verified'] },
          ],
          onFilter: filterHandler(queue, {
            q: matchText('applicationNo', 'studentName', 'parentName'),
            className: matchEq('className'),
            documentStatus: matchEq('documentStatus'),
          }),
          columns: [
            { key: 'applicationNo', label: 'Application', sticky: true, width: 140, render: (r) => h('code', null, r.applicationNo) },
            { key: 'studentName', label: 'Candidate', width: 230, render: (r) => Identity(r.studentName, `${r.className} · ${campusName(r.campusId)}`) },
            { key: 'submittedOn', label: 'Submitted', width: 130, render: (r) => formatDate(r.submittedOn) },
            { key: 'documentStatus', label: 'Documents', width: 140, filter: true, render: (r) => Badge(r.documentStatus) },
            { key: 'entranceScore', label: 'Entrance', width: 100, align: 'right', numeric: true, render: (r) => (r.entranceScore != null ? String(r.entranceScore) : '—') },
            { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
          ],
          rows: queue,
          onRowClick: (r) => navigate(`admissions/application-review/${r.id}`),
          exportName: 'application-review-queue',
          emptyState: EmptyState({ icon: 'check-circle', title: 'Review queue is clear', text: 'Every submitted application has been reviewed.' }),
        }));
        return;
      }

      /* ---- flagship split review ---- */
      const app = byId(db.applications, ctx.param);
      if (!app) { mount.appendChild(missingRecord('application', 'admissions/application-review')); return; }
      const enq = byId(db.enquiries, app.enquiryId);
      const docs = documentsFor(app);
      const idx = pool.findIndex((a) => a.id === app.id);
      const prev = idx > 0 ? pool[idx - 1] : null;
      const nextApp = idx >= 0 && idx < pool.length - 1 ? pool[idx + 1] : null;

      let activeDoc = docs.find((d) => d.status === 'Under Review') || docs[0];
      const viewerHost = h('div', { className: 'stack-3' });
      const listHost = h('div', { className: 'stack-2' });

      const decidedCount = () => docs.filter((d) => d.status === 'Verified').length;
      const progressHost = h('div', { className: 'stack-1' });

      function paintProgress() {
        progressHost.innerHTML = '';
        progressHost.appendChild(ProgressBar(decidedCount(), { max: docs.length, tone: decidedCount() === docs.length ? 'success' : 'warning', showValue: false }));
        progressHost.appendChild(h('div', { className: 't-xs t-muted t-num' }, `${decidedCount()} of ${docs.length} documents verified`));
      }

      function paintList() {
        listHost.innerHTML = '';
        for (const d of docs) {
          listHost.appendChild(h('button', {
            className: 'adm-doc-item', type: 'button',
            dataset: { active: d.id === activeDoc.id ? '1' : '0' },
            attrs: { 'aria-label': `Open ${d.name}` },
            onClick: () => { activeDoc = d; paintList(); paintViewer(); },
          },
          h('span', { className: 'row', style: { color: 'var(--text-muted)' }, html: icon('file-text', 16) }),
          h('span', { className: 'flex-1 min-0 stack-1' },
            h('span', { className: 't-sm t-medium t-truncate' }, d.name),
            h('span', { className: 't-2xs t-muted' }, d.required ? 'Mandatory' : 'Optional')),
          Badge(d.status, { size: 'sm' })));
        }
      }

      function decide(doc, status, tone) {
        doc.status = status;
        paintList(); paintViewer(); paintProgress();
        notify({ title: `${doc.name} ${status.toLowerCase()}`, text: app.applicationNo, tone });
      }

      function paintViewer() {
        viewerHost.innerHTML = '';
        const d = activeDoc;
        viewerHost.appendChild(h('div', { className: 'adm-doc-shell' },
          h('div', { className: 'adm-doc-bar' },
            h('span', { className: 'row', html: icon('file-text', 15) }),
            h('span', { className: 't-sm t-medium flex-1 t-truncate' }, d.file),
            h('span', { className: 't-xs t-muted t-num' }, d.size),
            IconButton('search', { label: 'Zoom document', size: 'sm', onClick: mockAction('Zoom document') }),
            IconButton('refresh', { label: 'Rotate document', size: 'sm', onClick: mockAction('Rotate document') }),
            IconButton('download', { label: 'Download document', size: 'sm', onClick: mockAction('Download document') })),
          h('div', { className: 'adm-doc-canvas' },
            h('div', { className: 'adm-doc-sheet' },
              h('div', { className: 't-eyebrow' }, d.name),
              h('div', { className: 't-sm t-semibold' }, app.studentName),
              h('div', { className: 't-xs t-muted' }, `${app.className} · DOB ${formatDate(app.dob)}`),
              h('div', { className: 'stack-1 mt-3' },
                [92, 78, 86, 64, 88, 52, 74].map((w) => h('div', { className: 'adm-doc-line', style: { width: w + '%' } }))),
              h('div', { className: 'spacer' }),
              h('div', { className: 't-2xs t-faint' }, `Uploaded ${formatDate(d.uploadedOn)} · ${app.applicationNo}`)))));

        viewerHost.appendChild(Card({ pad: true }, h('div', { className: 'stack-3' },
          h('div', { className: 'row-3 row-wrap' },
            Badge(d.status), d.required ? Badge('Mandatory', { tone: 'warning' }) : Badge('Optional', { tone: 'neutral' }),
            h('span', { className: 'spacer' }),
            h('span', { className: 't-xs t-muted' }, `Uploaded ${relativeTime(d.uploadedOn)}`)),
          d.remark && Callout({ tone: 'danger', icon: 'alert-triangle', title: 'Reviewer remark' }, d.remark),
          h('div', { className: 'row-3 row-wrap' },
            Button('Approve document', { variant: 'success', icon: 'check', onClick: () => decide(d, 'Verified', 'success') }),
            Button('Reject', { variant: 'danger', icon: 'x', onClick: () => ConfirmDialog({
              title: `Reject ${d.name}?`, tone: 'danger', confirmLabel: 'Reject document',
              text: 'The parent will be asked to re-upload this document.',
            }).then((ok) => ok && decide(d, 'Rejected', 'danger')) }),
            Button('Mark under review', { variant: 'ghost', icon: 'eye', onClick: () => decide(d, 'Under Review', 'info') })))));
      }

      paintList(); paintViewer(); paintProgress();

      const left = h('div', { className: 'stack-3' },
        SectionCard({ title: 'Candidate', icon: 'graduation-cap' },
          DescriptionList([
            ['Application no', h('code', null, app.applicationNo)],
            ['Enquiry no', enq ? h('a', { className: 't-link', href: '#', onClick: (ev) => { ev.preventDefault(); openEnquiryDrawer(enq); } }, enq.enquiryNo) : '—'],
            ['Full name', app.studentName],
            ['Gender', app.gender],
            ['Date of birth', formatDate(app.dob)],
            ['Seeking class', app.className],
            ['Campus', campusName(app.campusId)],
            ['Submitted', `${formatDate(app.submittedOn)} · ${app.mode}`],
          ], { cols: 2 })),
        SectionCard({ title: 'Parent / guardian', icon: 'users' },
          DescriptionList([
            ['Name', app.parentName], ['Phone', app.phone], ['Email', app.email],
            ['Previous school', enq ? (enq.previousSchool || 'First admission') : '—'],
            ['Source', enq ? enq.source : '—'], ['City', enq ? enq.city : '—'],
          ], { cols: 2 })),
        SectionCard({ title: 'Assessment', icon: 'clipboard-check' },
          DescriptionList([
            ['Entrance test', app.entranceTestDate ? `${formatDate(app.entranceTestDate)} · ${app.entranceScore}/100` : 'Not scheduled'],
            ['Entrance result', app.entranceResult ? Badge(app.entranceResult, { tone: app.entranceResult === 'Qualified' ? 'success' : 'danger' }) : '—'],
            ['Interview', app.interviewDate ? `${formatDate(app.interviewDate)} · ${app.interviewScore}/10` : 'Not scheduled'],
            ['Interviewer', app.interviewer || '—'],
            ['Merit rank', app.meritRank != null ? `#${app.meritRank}` : 'Not ranked'],
            ['Composite score', meritScore(app) ? `${meritScore(app)} / 100` : '—'],
          ], { cols: 2 })),
        SectionCard({ title: 'Reviewer notes', icon: 'notebook' },
          CommentThread([
            { author: 'Admissions desk', time: formatDate(app.submittedOn), text: `Application received via ${app.mode.toLowerCase()} channel for ${app.className}.` },
            { author: app.interviewer || 'Academic panel', time: formatDate(addDaysIso(app.submittedOn, 6)), text: app.remarks || 'Profile looks consistent with the class cohort.' },
          ], { onSubmit: (t) => notify({ title: 'Note added', text: t, tone: 'success' }) })));

      const right = h('div', { className: 'stack-3' },
        SectionCard({ title: 'Document checklist', icon: 'folder', subtitle: `${docs.length} documents · click to view` },
          h('div', { className: 'stack-2' }, progressHost, listHost)),
        viewerHost);

      mount.appendChild(page({
        title: `Review · ${app.studentName}`,
        subtitle: `${app.applicationNo} · ${app.className} · ${campusName(app.campusId)} · submitted ${formatDate(app.submittedOn)}`,
        route: 'admissions/application-review',
        actions: pageActions(
          Button('Previous', { variant: 'ghost', icon: 'chevron-left', disabled: !prev, onClick: () => prev && navigate(`admissions/application-review/${prev.id}`) }),
          Button('Next', { variant: 'ghost', iconRight: 'chevron-right', disabled: !nextApp, onClick: () => nextApp && navigate(`admissions/application-review/${nextApp.id}`) }),
          MenuButton([
            { label: 'Print application', icon: 'print', onClick: mockAction('Print application') },
            { label: 'Email applicant', icon: 'mail', onClick: mockAction('Email applicant') },
            { label: 'Move to waiting list', icon: 'clock', onClick: mockAction('Move to waiting list') },
            { separator: true },
            { label: 'Reject application', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({
              title: 'Reject this application?', tone: 'danger', confirmLabel: 'Reject',
              text: `${app.applicationNo} will move out of the active pipeline.`,
            }).then((ok) => ok && notify({ title: 'Application rejected', tone: 'danger' })) },
          ], { label: 'More review actions' }),
          Button('Approve & issue offer', {
            variant: 'primary', icon: 'award',
            onClick: () => ConfirmDialog({
              title: 'Issue an admission offer?', tone: 'brand', icon: 'award', confirmLabel: 'Issue offer',
              text: `${app.studentName} will receive an offer letter for ${app.className} valid for 7 days.`,
            }).then((ok) => ok && notify({ title: 'Offer issued', text: `${app.studentName} · ${app.className}`, tone: 'success' })),
          })),
        children: [
          Card({ pad: true }, Stepper([
            { label: 'Submitted' }, { label: 'Documents' }, { label: 'Entrance test' },
            { label: 'Interview' }, { label: 'Merit' }, { label: 'Offer' }, { label: 'Enrolled' },
          ], { current: app.status === 'Admitted' ? 6 : app.status === 'Offered' ? 5 : app.meritRank ? 4 : app.interviewScore ? 3 : app.entranceScore ? 2 : app.documentStatus === 'Verified' ? 1 : 0 })),
          h('div', { className: 'adm-split' }, left, right),
        ],
      }));
    },
  },

  /* ------------------------------- admissions/document-verification */
  'admissions/document-verification': {
    title: 'Document Verification',
    subtitle: 'Checklist compliance across every live application',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const all = applicationsFor(ctx).map((a) => ({
        ...a,
        pending: a.documentsRequired - a.documentsSubmitted,
        compliance: Math.round((a.documentsSubmitted / a.documentsRequired) * 100),
      }));
      const verified = all.filter((a) => a.documentStatus === 'Verified');
      const missingByDoc = DOC_TYPES.map((name, i) => ({
        key: name,
        value: all.filter((a) => a.documentsSubmitted <= i).length,
      })).filter((d) => d.value > 0);

      mount.appendChild(listPage({
        title: 'Document verification',
        subtitle: `${formatNumber(verified.length)} of ${formatNumber(all.length)} applications fully verified`,
        route: 'admissions/document-verification',
        actions: pageActions(
          Button('Send reminders', { variant: 'secondary', icon: 'send', onClick: mockAction('Send document reminders') }),
          Button('Open review desk', { variant: 'primary', icon: 'clipboard-check', route: 'admissions/application-review' })),
        kpis: [
          { label: 'Applications', value: formatNumber(all.length), icon: 'folder', tone: 'brand' },
          { label: 'Fully verified', value: formatNumber(verified.length), icon: 'check-circle', tone: 'success' },
          { label: 'Under review', value: formatNumber(all.filter((a) => a.documentStatus === 'Under Review').length), icon: 'eye', tone: 'warning' },
          { label: 'Docs missing', value: formatNumber(all.reduce((s, a) => s + Math.max(0, a.pending), 0)), icon: 'alert-circle', tone: 'danger' },
        ],
        chart: barChart({
          horizontal: true,
          categories: missingByDoc.map((d) => d.key),
          series: [{ name: 'Applications missing this document', values: missingByDoc.map((d) => d.value) }],
          height: 260, showValues: true, title: 'Most frequently missing documents',
        }),
        chartTitle: 'Where the checklist breaks down',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Candidate or application…', width: 280 },
          { id: 'documentStatus', label: 'Verification', options: ['Pending', 'Partial', 'Under Review', 'Verified'] },
          { id: 'className', label: 'Class', options: [...new Set(all.map((a) => a.className))] },
        ],
        onFilter: filterHandler(all, {
          q: matchText('studentName', 'applicationNo', 'parentName'),
          documentStatus: matchEq('documentStatus'),
          className: matchEq('className'),
        }),
        columns: [
          { key: 'studentName', label: 'Candidate', sticky: true, width: 230, render: (r) => Identity(r.studentName, r.applicationNo) },
          { key: 'className', label: 'Class', width: 110, filter: true },
          { key: 'compliance', label: 'Checklist', width: 180, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v)}%`,
            render: (r) => h('div', { className: 'stack-1', style: { minWidth: '140px' } },
              ProgressBar(r.compliance, { size: 'sm', tone: r.compliance === 100 ? 'success' : r.compliance >= 60 ? 'warning' : 'danger' }),
              h('span', { className: 't-2xs t-muted t-num' }, `${r.documentsSubmitted}/${r.documentsRequired} submitted`)) },
          { key: 'pending', label: 'Missing', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'documentStatus', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.documentStatus) },
          { key: 'submittedOn', label: 'Submitted', width: 130, render: (r) => formatDate(r.submittedOn) },
        ],
        rows: all,
        selectable: true,
        footerAggregates: true,
        exportName: 'document-verification',
        searchKeys: ['studentName', 'applicationNo', 'className'],
        expandable: (row) => Card({ pad: true }, h('div', { className: 'stack-2' },
          h('div', { className: 't-eyebrow' }, 'Checklist detail'),
          FileList(documentsFor(row).map((d) => ({
            name: d.name, size: d.size, type: 'pdf', date: formatDate(d.uploadedOn), status: d.status,
          })), { onDownload: mockAction('Download document') }))),
        bulkActions: [
          { label: 'Mark verified', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} checklists verified`, tone: 'success' }) },
          { label: 'Request re-upload', icon: 'upload', tone: 'danger', onClick: (sel) => notify({ title: `Re-upload requested for ${sel.length} applications`, tone: 'warning' }) },
        ],
        rowActions: (row) => [
          { label: 'Open document viewer', icon: 'eye', route: `admissions/application-review/${row.id}` },
          { label: 'Send reminder SMS', icon: 'send', onClick: mockAction('Send reminder') },
        ],
        onRowClick: (row) => navigate(`admissions/application-review/${row.id}`),
        emptyState: EmptyState({ icon: 'folder', title: 'Nothing to verify', text: 'Applications appear here as soon as parents upload their first document.' }),
      }));
    },
  },

  /* ------------------------------------------- admissions/entrance-test */
  'admissions/entrance-test': {
    title: 'Entrance Test',
    subtitle: 'Schedule sittings, capture scores and rank automatically',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const pool = applicationsFor(ctx).filter((a) => a.entranceTestDate || a.entranceScore != null
        || ['Document Verification', 'Application'].includes((byId(db.enquiries, a.enquiryId) || {}).stage));
      const scored = pool.filter((a) => a.entranceScore != null);
      const scheduled = pool.filter((a) => a.entranceTestDate && a.entranceScore == null);
      const qualified = scored.filter((a) => a.entranceResult === 'Qualified');

      /* live score-entry state, local to this render */
      const draft = new Map();
      let cutoff = 55;

      const rankHost = h('div', { className: 'stack-2' });
      function currentRanking() {
        return scored
          .map((a) => ({ ...a, score: draft.has(a.id) ? draft.get(a.id) : a.entranceScore }))
          .sort((a, b) => b.score - a.score)
          .map((a, i) => ({ ...a, rank: i + 1 }));
      }
      function paintRanking() {
        rankHost.innerHTML = '';
        const list = currentRanking().slice(0, 12);
        if (!list.length) {
          rankHost.appendChild(EmptyState({ icon: 'trophy', title: 'No scores yet', text: 'Enter marks in the score-entry tab to build the live ranking.' }));
          return;
        }
        rankHost.appendChild(RankList(list.map((a) => ({
          name: a.studentName,
          meta: `${a.className} · ${a.applicationNo}`,
          value: `${a.score}/100`,
        }))));
        rankHost.appendChild(h('div', { className: 't-xs t-muted' },
          `${currentRanking().filter((a) => a.score >= cutoff).length} candidates at or above the ${cutoff} cut-off.`));
      }
      paintRanking();

      const scoreTable = DataTable({
        columns: [
          { key: 'applicationNo', label: 'Roll / application', sticky: true, width: 160, render: (r) => h('code', null, r.applicationNo) },
          { key: 'studentName', label: 'Candidate', width: 220, render: (r) => Identity(r.studentName, r.className) },
          { key: 'entranceTestDate', label: 'Sitting', width: 130, render: (r) => (r.entranceTestDate ? formatDate(r.entranceTestDate) : 'Unscheduled') },
          { key: 'entranceScore', label: 'Score / 100', width: 150, align: 'right', numeric: true, aggregate: 'avg', format: (v) => (v || 0).toFixed(1),
            render: (r) => Input({
              type: 'number', numeric: true, size: 'sm', min: 0, max: 100,
              value: draft.has(r.id) ? draft.get(r.id) : (r.entranceScore ?? ''),
              onInput: (v) => {
                const n = Math.max(0, Math.min(100, Number(v) || 0));
                draft.set(r.id, n);
                paintRanking();
              },
            }) },
          { key: 'entranceResult', label: 'Result', width: 140, filter: true,
            render: (r) => {
              const s = draft.has(r.id) ? draft.get(r.id) : r.entranceScore;
              if (s == null) return Badge('Pending', { tone: 'warning' });
              return Badge(s >= cutoff ? 'Qualified' : 'Not Qualified', { tone: s >= cutoff ? 'success' : 'danger' });
            }, value: (r) => r.entranceResult || 'Pending' },
          { key: 'campusId', label: 'Campus', width: 150, filter: true, render: (r) => campusName(r.campusId), value: (r) => campusName(r.campusId) },
        ],
        rows: pool,
        selectable: true,
        footerAggregates: true,
        pageSize: 25,
        searchKeys: ['studentName', 'applicationNo', 'className'],
        exportName: 'entrance-test-scores',
        bulkActions: [
          { label: 'Mark absent', icon: 'user-x', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} candidates marked absent`, tone: 'warning' }) },
          { label: 'Publish scores', icon: 'send', onClick: (sel) => notify({ title: `Scores published to ${sel.length} parents`, tone: 'success' }) },
        ],
        emptyState: EmptyState({ icon: 'edit', title: 'No candidates in this sitting', text: 'Schedule an entrance test to populate the score sheet.' }),
      });

      const sittings = [...groupBy(pool.filter((a) => a.entranceTestDate), 'entranceTestDate').entries()]
        .map(([date, rows]) => ({ date, rows }))
        .sort((a, b) => (a.date < b.date ? -1 : 1))
        .slice(0, 12);

      const tabHost = h('div', { className: 'stack' });
      function paintTab(id) {
        tabHost.innerHTML = '';
        if (id === 'schedule') {
          tabHost.appendChild(SectionCard({ title: 'Test sittings', icon: 'calendar', subtitle: 'Hall allocation and candidate counts',
            actions: Button('New sitting', { variant: 'secondary', size: 'sm', icon: 'plus', onClick: mockAction('Create sitting') }) },
          sittings.length ? DataTable({
            columns: [
              { key: 'date', label: 'Date', width: 140, render: (r) => formatDate(r.date) },
              { key: 'day', label: 'Day', width: 120, render: (r) => formatDate(r.date, 'weekday') },
              { key: 'count', label: 'Candidates', width: 120, align: 'right', numeric: true, aggregate: 'sum', value: (r) => r.rows.length, render: (r) => formatNumber(r.rows.length) },
              { key: 'hall', label: 'Hall', width: 160, value: (r) => pickFrom(['Hall A — Block 1', 'Hall B — Block 2', 'Auditorium', 'Science Block'], r.date), render: (r) => pickFrom(['Hall A — Block 1', 'Hall B — Block 2', 'Auditorium', 'Science Block'], r.date) },
              { key: 'invig', label: 'Invigilator', value: (r) => pickFrom(db.staff.filter((s) => s.type === 'Teaching').slice(0, 40), r.date, 'i').name, render: (r) => pickFrom(db.staff.filter((s) => s.type === 'Teaching').slice(0, 40), r.date, 'i').name },
              { key: 'status', label: 'Status', width: 130, render: (r) => Badge(r.date < DEMO_TODAY ? 'Completed' : 'Scheduled') },
            ],
            rows: sittings, paginate: false, exportName: 'entrance-test-sittings', maxHeight: 'none',
          }) : EmptyState({ icon: 'calendar', title: 'No sittings scheduled', text: 'Create a sitting and assign candidates to it.' })));
          tabHost.appendChild(SectionCard({ title: 'Candidates per sitting', className: 'chart-card' },
            barChart({
              categories: sittings.map((s) => formatDate(s.date, 'dayMonth')),
              series: [{ name: 'Candidates', values: sittings.map((s) => s.rows.length) }],
              height: 240, showValues: true, title: 'Candidates per sitting',
            })));
        } else if (id === 'scores') {
          tabHost.appendChild(Callout({ tone: 'info', icon: 'info', title: 'Live ranking' },
            'Edit any score below and the merit ranking on the right recalculates instantly. Nothing is persisted in this prototype.'));
          tabHost.appendChild(h('div', { className: 'adm-split' },
            SectionCard({ title: 'Score entry', icon: 'edit', flush: true, subtitle: `${pool.length} candidates` }, scoreTable),
            h('div', { className: 'stack-3' },
              SectionCard({ title: 'Cut-off', icon: 'sliders' },
                h('div', { className: 'stack-2' },
                  h('div', { className: 'row' },
                    h('span', { className: 't-sm t-muted' }, 'Qualifying score'),
                    h('span', { className: 'spacer' }),
                    h('span', { className: 't-lg t-semibold t-num' }, String(cutoff))),
                  h('input', {
                    className: 'adm-cut', type: 'range', value: String(cutoff),
                    attrs: { min: '0', max: '100', step: '1', 'aria-label': 'Entrance test cut-off score' },
                    onInput: (ev) => { cutoff = Number(ev.target.value); scoreTable.refresh(pool); paintRanking(); },
                  }),
                  h('div', { className: 'row t-2xs t-muted' }, h('span', null, '0'), h('span', { className: 'spacer' }), h('span', null, '100')))),
              SectionCard({ title: 'Live merit ranking', icon: 'trophy', subtitle: 'Top 12 by entrance score' }, rankHost))));
        } else {
          tabHost.appendChild(kpiRow([
            { label: 'Highest score', value: scored.length ? String(Math.max(...scored.map((a) => a.entranceScore))) : '—', icon: 'trophy', tone: 'success' },
            { label: 'Average', value: scored.length ? (scored.reduce((s, a) => s + a.entranceScore, 0) / scored.length).toFixed(1) : '—', icon: 'activity', tone: 'brand' },
            { label: 'Qualified', value: formatNumber(qualified.length), icon: 'check-circle', tone: 'info' },
            { label: 'Pass rate', value: scored.length ? `${Math.round((qualified.length / scored.length) * 100)}%` : '—', icon: 'percent', tone: 'warning' },
          ]));
          const buckets = [[0, 39], [40, 54], [55, 69], [70, 84], [85, 100]];
          tabHost.appendChild(SectionCard({ title: 'Score distribution', className: 'chart-card', subtitle: 'Bands of the written entrance test' },
            barChart({
              categories: buckets.map(([a, b]) => `${a}–${b}`),
              series: [{ name: 'Candidates', values: buckets.map(([a, b]) => scored.filter((s) => s.entranceScore >= a && s.entranceScore <= b).length) }],
              height: 260, showValues: true, title: 'Entrance score distribution',
            })));
          tabHost.appendChild(SectionCard({ title: 'Entrance vs interview', className: 'chart-card', subtitle: 'Only candidates who cleared both stages' },
            scatterPlot({
              points: scored.filter((a) => a.interviewScore != null).slice(0, 160).map((a) => ({
                x: a.entranceScore, y: a.interviewScore * 10, label: a.studentName, group: a.entranceResult || 'Pending',
              })),
              xLabel: 'Entrance score', yLabel: 'Interview score (×10)', height: 300, title: 'Entrance vs interview',
            })));
        }
      }

      const node = page({
        title: 'Entrance test',
        subtitle: `${formatNumber(pool.length)} candidates · ${formatNumber(scheduled.length)} awaiting a sitting · ${formatNumber(scored.length)} scored`,
        route: 'admissions/entrance-test',
        actions: pageActions(
          Button('Download hall tickets', { variant: 'secondary', icon: 'download', onClick: mockAction('Download hall tickets') }),
          Button('Publish results', { variant: 'primary', icon: 'send', onClick: () => ConfirmDialog({
            title: 'Publish entrance results?', tone: 'brand', icon: 'send', confirmLabel: 'Publish',
            text: `Scores and the ${cutoff}-mark cut-off will be sent to ${scored.length} parents by SMS and email.`,
          }).then((ok) => ok && notify({ title: 'Results published', tone: 'success' })) })),
        tabs: [
          { id: 'schedule', label: 'Schedule', icon: 'calendar', count: sittings.length },
          { id: 'scores', label: 'Score entry', icon: 'edit', count: pool.length },
          { id: 'analysis', label: 'Analysis', icon: 'chart-bar' },
        ],
        activeTab: 'scores',
        onTabChange: paintTab,
        children: tabHost,
      });
      paintTab('scores');
      mount.appendChild(node);
    },
  },

  /* ----------------------------------------------- admissions/interview */
  'admissions/interview': {
    title: 'Interview',
    subtitle: 'Panel scheduling, scorecards and recommendations',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const all = applicationsFor(ctx).filter((a) => a.interviewDate || a.entranceResult === 'Qualified');
      const done = all.filter((a) => a.interviewScore != null);
      const upcoming = all.filter((a) => a.interviewDate && a.interviewDate >= DEMO_TODAY);

      const openScorecard = (row) => Modal({
        title: `Interview scorecard · ${row.studentName}`,
        subtitle: `${row.applicationNo} · ${row.className}`,
        size: 'lg', icon: 'users',
        body: h('div', { className: 'stack-4' },
          Callout({ tone: 'info', icon: 'info', title: 'Panel guidance' },
            'Rate each dimension out of 10. The composite feeds the merit list at 30% weight.'),
          FormGrid({ cols: 2 },
            ['Communication', 'Comprehension', 'Numeracy', 'Curiosity', 'Confidence', 'Parent alignment'].map((d) =>
              Field({ label: d }, Select({ options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], value: String(Math.max(1, Math.round(seedOf(row.id + d) * 10))), onChange: () => {} }))),
            Field({ label: 'Panel recommendation', className: 'col-span-full' },
              Select({ options: ['Strongly recommend', 'Recommend', 'Recommend with reservations', 'Do not recommend'], onChange: () => {} })),
            Field({ label: 'Panel remarks', className: 'col-span-full' },
              Textarea({ rows: 3, placeholder: 'Observations from the interaction…' })))),
        actions: (close) => frag(
          Button('Cancel', { variant: 'secondary', onClick: close }),
          Button('Save scorecard', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Scorecard saved', text: row.studentName, tone: 'success' }); } })),
      });

      mount.appendChild(listPage({
        title: 'Interview',
        subtitle: `${formatNumber(all.length)} candidates in the interview stage · ${formatNumber(upcoming.length)} upcoming slots`,
        route: 'admissions/interview',
        actions: pageActions(
          Button('Panel roster', { variant: 'secondary', icon: 'users', onClick: mockAction('Panel roster') }),
          Button('Schedule interviews', { variant: 'primary', icon: 'calendar-plus', onClick: mockAction('Schedule interviews') })),
        kpis: [
          { label: 'In stage', value: formatNumber(all.length), icon: 'users', tone: 'brand' },
          { label: 'Completed', value: formatNumber(done.length), icon: 'check-circle', tone: 'success' },
          { label: 'Upcoming', value: formatNumber(upcoming.length), icon: 'calendar-check', tone: 'info' },
          { label: 'Avg score', value: done.length ? `${(done.reduce((s, a) => s + a.interviewScore, 0) / done.length).toFixed(1)}/10` : '—', icon: 'star', tone: 'warning' },
        ],
        chart: barChart({
          categories: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(String),
          series: [{ name: 'Candidates', values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => done.filter((a) => a.interviewScore === n).length) }],
          height: 220, showValues: true, title: 'Interview score distribution',
        }),
        chartTitle: 'Interview score distribution (out of 10)',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Candidate or interviewer…', width: 280 },
          { id: 'className', label: 'Class', options: [...new Set(all.map((a) => a.className))] },
          { id: 'interviewer', label: 'Interviewer', options: [...new Set(all.map((a) => a.interviewer).filter(Boolean))].slice(0, 30) },
          { id: 'from', type: 'date', label: 'Interview from' },
        ],
        onFilter: filterHandler(all, {
          q: matchText('studentName', 'applicationNo', 'interviewer'),
          className: matchEq('className'),
          interviewer: matchEq('interviewer'),
          from: dateFrom('interviewDate'),
        }),
        columns: [
          { key: 'studentName', label: 'Candidate', sticky: true, width: 230, render: (r) => Identity(r.studentName, r.applicationNo) },
          { key: 'className', label: 'Class', width: 110, filter: true },
          { key: 'interviewDate', label: 'Slot', width: 140, render: (r) => (r.interviewDate ? formatDate(r.interviewDate) : 'To be scheduled') },
          { key: 'interviewer', label: 'Panel', width: 190, render: (r) => (r.interviewer ? Identity(r.interviewer, 'Academic panel', { size: 'sm' }) : '—'), value: (r) => r.interviewer || '' },
          { key: 'entranceScore', label: 'Entrance', width: 100, align: 'right', numeric: true, render: (r) => (r.entranceScore != null ? String(r.entranceScore) : '—') },
          { key: 'interviewScore', label: 'Interview', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => (v || 0).toFixed(1),
            render: (r) => (r.interviewScore != null ? Rating(Math.round(r.interviewScore / 2), { showValue: false }) : Badge('Pending', { tone: 'warning' })), value: (r) => r.interviewScore || 0 },
          { key: 'score', label: 'Composite', width: 120, align: 'right', numeric: true, value: (r) => meritScore(r),
            render: (r) => h('span', { className: 't-num t-medium' }, meritScore(r) || '—') },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: all,
        selectable: true,
        footerAggregates: true,
        exportName: 'admission-interviews',
        searchKeys: ['studentName', 'applicationNo', 'interviewer'],
        bulkActions: [
          { label: 'Send slot reminders', icon: 'send', onClick: (sel) => notify({ title: `Reminders sent to ${sel.length} families`, tone: 'success' }) },
          { label: 'Reschedule', icon: 'calendar', onClick: (sel) => notify({ title: `${sel.length} interviews rescheduled`, tone: 'success' }) },
        ],
        rowActions: (row) => [
          { label: 'Open scorecard', icon: 'star', onClick: () => openScorecard(row) },
          { label: 'Open application', icon: 'clipboard-check', route: `admissions/application-review/${row.id}` },
          { label: 'Reschedule slot', icon: 'calendar', onClick: mockAction('Reschedule interview') },
        ],
        onRowClick: (row) => openScorecard(row),
        emptyState: EmptyState({ icon: 'users', title: 'No interviews scheduled', text: 'Candidates who qualify the entrance test appear here for panel scheduling.' }),
      }));
    },
  },

  /* ---------------------------------------------- admissions/merit-list */
  'admissions/merit-list': {
    title: 'Merit List',
    subtitle: 'Composite ranking with a live cut-off and bulk offer generation',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const ranked = meritPool(ctx);
      if (!ranked.length) {
        mount.appendChild(page({
          title: 'Merit list', route: 'admissions/merit-list',
          children: Card({ pad: true }, EmptyState({
            icon: 'sort-desc', title: 'No ranked candidates yet',
            text: 'Capture entrance scores first — the merit list builds itself from entrance (70%) and interview (30%).',
            action: Button('Go to entrance test', { variant: 'primary', icon: 'edit', route: 'admissions/entrance-test' }),
          })),
        }));
        return;
      }

      const classes = [...new Set(ranked.map((r) => r.className))];
      let cutoff = 60;
      let classFilter = 'all';

      const summaryHost = h('div');
      const tableHost = h('div');

      const visible = () => ranked.filter((r) => classFilter === 'all' || r.className === classFilter);
      const aboveCut = () => visible().filter((r) => r.score >= cutoff);

      const table = DataTable({
        columns: [
          { key: 'rank', label: 'Rank', width: 80, align: 'right', numeric: true, sticky: true,
            render: (r) => h('span', { className: ['t-num', 't-semibold', r.score >= cutoff ? 't-success' : 't-muted'].join(' ') }, `#${r.rank}`) },
          { key: 'studentName', label: 'Candidate', width: 240, render: (r) => Identity(r.studentName, r.applicationNo) },
          { key: 'className', label: 'Class', width: 110, filter: true },
          { key: 'campusId', label: 'Campus', width: 150, filter: true, render: (r) => campusName(r.campusId), value: (r) => campusName(r.campusId) },
          { key: 'entranceScore', label: 'Entrance /100', width: 130, align: 'right', numeric: true, aggregate: 'avg', format: (v) => (v || 0).toFixed(1) },
          { key: 'interviewScore', label: 'Interview /10', width: 130, align: 'right', numeric: true, aggregate: 'avg', format: (v) => (v || 0).toFixed(1),
            render: (r) => (r.interviewScore != null ? String(r.interviewScore) : '—') },
          { key: 'score', label: 'Composite', width: 130, align: 'right', numeric: true, aggregate: 'avg', format: (v) => (v || 0).toFixed(1),
            render: (r) => h('span', { className: 't-num t-semibold' }, r.score.toFixed(1)) },
          { key: 'cut', label: 'Against cut-off', width: 150, sortable: false,
            render: (r) => (r.score >= cutoff
              ? Badge('Above cut-off', { tone: 'success', icon: 'check' })
              : Badge(`${(cutoff - r.score).toFixed(1)} short`, { tone: 'neutral' })) },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: ranked,
        selectable: true,
        footerAggregates: true,
        pageSize: 50,
        sortBy: 'rank',
        searchKeys: ['studentName', 'applicationNo', 'className'],
        exportName: 'merit-list',
        bulkActions: [
          { label: 'Generate offer letters', icon: 'award', onClick: (sel) => ConfirmDialog({
            title: `Generate ${sel.length} offer letters?`, tone: 'brand', icon: 'award', confirmLabel: 'Generate offers',
            text: 'Each family receives an offer valid for 7 days along with the admission fee link.',
          }).then((ok) => ok && notify({ title: `${sel.length} offers generated`, text: 'Offer letters queued for email and SMS.', tone: 'success' })) },
          { label: 'Move to waiting list', icon: 'clock', onClick: (sel) => notify({ title: `${sel.length} candidates waitlisted`, tone: 'warning' }) },
          { label: 'Reject', icon: 'x-circle', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} candidates rejected`, tone: 'danger' }) },
        ],
        rowActions: (row) => [
          { label: 'Open application', icon: 'clipboard-check', route: `admissions/application-review/${row.id}` },
          { label: 'Generate offer', icon: 'award', onClick: mockAction('Generate offer letter') },
        ],
        onRowClick: (row) => navigate(`admissions/application-review/${row.id}`),
        emptyState: EmptyState({ icon: 'sort-desc', title: 'No candidates in this view', text: 'Change the class filter or lower the cut-off.' }),
      });

      function repaint() {
        const above = aboveCut();
        summaryHost.innerHTML = '';
        summaryHost.appendChild(kpiRow([
          { label: 'Ranked candidates', value: formatNumber(visible().length), icon: 'sort-desc', tone: 'brand' },
          { label: 'Above cut-off', value: formatNumber(above.length), icon: 'check-circle', tone: 'success' },
          { label: 'Below cut-off', value: formatNumber(visible().length - above.length), icon: 'user-x', tone: 'danger' },
          { label: 'Cut-off score', value: cutoff.toFixed(0), icon: 'sliders', tone: 'info' },
        ]));
        table.refresh(visible());
      }

      const cutValue = h('span', { className: 't-lg t-semibold t-num' }, cutoff.toFixed(0));
      const controls = Card({ pad: true }, h('div', { className: 'stack-3' },
        h('div', { className: 'row-4 row-wrap' },
          h('div', { className: 'flex-1', style: { minWidth: '260px' } },
            h('div', { className: 'row' },
              h('span', { className: 't-eyebrow' }, 'Composite cut-off'),
              h('span', { className: 'spacer' }),
              cutValue),
            h('input', {
              className: 'adm-cut mt-2', type: 'range', value: String(cutoff),
              attrs: { min: '0', max: '100', step: '1', 'aria-label': 'Merit list cut-off score' },
              onInput: (ev) => {
                cutoff = Number(ev.target.value);
                cutValue.textContent = cutoff.toFixed(0);
                repaint();
              },
            }),
            h('div', { className: 'row t-2xs t-muted mt-1' },
              h('span', null, '0'), h('span', { className: 'spacer' }), h('span', null, '100'))),
          h('div', { style: { minWidth: '200px' } },
            Field({ label: 'Class' }, Select({
              options: [{ value: 'all', label: 'All classes' }].concat(classes.map((c) => ({ value: c, label: c }))),
              value: 'all', onChange: (v) => { classFilter = v; repaint(); },
            }))),
          h('div', { className: 'row-3', style: { alignSelf: 'flex-end' } },
            Button('Generate offers above cut-off', {
              variant: 'primary', icon: 'award',
              onClick: () => ConfirmDialog({
                title: `Generate ${aboveCut().length} offer letters?`, tone: 'brand', icon: 'award', confirmLabel: 'Generate offers',
                text: `Every candidate scoring ${cutoff} or above in ${classFilter === 'all' ? 'all classes' : classFilter} receives an offer valid for 7 days.`,
              }).then((ok) => ok && notify({ title: `${aboveCut().length} offers generated`, tone: 'success' })),
            }),
            Button('Export merit list', { variant: 'secondary', icon: 'download', onClick: () => {
              download('merit-list.csv', toCsv(visible(), [
                { key: 'rank', label: 'Rank' }, { key: 'applicationNo', label: 'Application' },
                { key: 'studentName', label: 'Candidate' }, { key: 'className', label: 'Class' },
                { key: 'entranceScore', label: 'Entrance' }, { key: 'interviewScore', label: 'Interview' },
                { key: 'score', label: 'Composite' },
              ]), 'text/csv;charset=utf-8');
              notify({ title: 'Merit list exported', tone: 'success' });
            } }))),
        Callout({ tone: 'info', icon: 'info', title: 'How the composite is built' },
          'Composite = entrance score × 0.7 + interview score × 10 × 0.3. Ties are broken by entrance score, then by date of application.')));

      repaint();

      mount.appendChild(page({
        title: 'Merit list',
        subtitle: `${formatNumber(ranked.length)} ranked candidates · ${campusLabel(ctx)} · session 2026-27`,
        route: 'admissions/merit-list',
        actions: pageActions(
          Button('Print list', { variant: 'secondary', icon: 'print', onClick: () => printNode(tableHost, 'Merit list 2026-27') }),
          Button('Selected candidates', { variant: 'primary', icon: 'user-check', route: 'admissions/selected-candidates' })),
        children: [summaryHost, controls,
          SectionCard({ title: 'Ranked candidates', subtitle: 'Sorted by composite score', flush: true }, tableHost)],
      }));
      tableHost.appendChild(table);
    },
  },

  /* -------------------------------------- admissions/selected-candidates */
  'admissions/selected-candidates': {
    title: 'Selected Candidates',
    subtitle: 'Offers issued and awaiting acceptance',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const all = applicationsFor(ctx).filter((a) => a.status === 'Offered' || a.status === 'Admitted');
      const accepted = all.filter((a) => a.admissionFeePaid);
      const pending = all.filter((a) => !a.admissionFeePaid && a.status === 'Offered');

      mount.appendChild(listPage({
        title: 'Selected candidates',
        subtitle: `${formatNumber(all.length)} offers issued · ${formatNumber(accepted.length)} accepted · ${formatNumber(pending.length)} awaiting payment`,
        route: 'admissions/selected-candidates',
        actions: pageActions(
          Button('Send reminders', { variant: 'secondary', icon: 'send', onClick: mockAction('Send offer reminders') }),
          Button('Collect admission fee', { variant: 'primary', icon: 'wallet', route: 'admissions/admission-fee' })),
        kpis: [
          { label: 'Offers issued', value: formatNumber(all.length), icon: 'award', tone: 'brand' },
          { label: 'Accepted', value: formatNumber(accepted.length), icon: 'check-circle', tone: 'success' },
          { label: 'Awaiting payment', value: formatNumber(pending.length), icon: 'clock', tone: 'warning' },
          { label: 'Acceptance rate', value: `${Math.round((accepted.length / Math.max(1, all.length)) * 100)}%`, icon: 'percent', tone: 'info' },
        ],
        chart: barChart({
          categories: countBy(all, 'className').slice(0, 12).map((c) => c.key),
          series: [
            { name: 'Offers', values: countBy(all, 'className').slice(0, 12).map((c) => c.value) },
            { name: 'Accepted', values: countBy(all, 'className').slice(0, 12).map((c) => accepted.filter((a) => a.className === c.key).length) },
          ],
          height: 240, title: 'Offers vs acceptances by class',
        }),
        chartTitle: 'Offer conversion by class',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Candidate or application…', width: 280 },
          { id: 'className', label: 'Class', options: [...new Set(all.map((a) => a.className))] },
          { id: 'status', label: 'Status', options: ['Offered', 'Admitted'] },
        ],
        onFilter: filterHandler(all, {
          q: matchText('studentName', 'applicationNo', 'parentName'),
          className: matchEq('className'),
          status: matchEq('status'),
        }),
        columns: [
          { key: 'studentName', label: 'Candidate', sticky: true, width: 240, render: (r) => Identity(r.studentName, r.applicationNo) },
          { key: 'className', label: 'Class', width: 110, filter: true },
          { key: 'meritRank', label: 'Merit rank', width: 110, align: 'right', numeric: true, render: (r) => (r.meritRank ? `#${r.meritRank}` : '—') },
          { key: 'offerDate', label: 'Offer issued', width: 140, render: (r) => (r.offerDate ? formatDate(r.offerDate) : '—') },
          { key: 'expiry', label: 'Offer valid till', width: 140, value: (r) => (r.offerDate ? addDaysIso(r.offerDate, 7) : ''),
            render: (r) => (r.offerDate ? h('span', { className: addDaysIso(r.offerDate, 7) < DEMO_TODAY && !r.admissionFeePaid ? 't-danger t-num' : 't-num' }, formatDate(addDaysIso(r.offerDate, 7))) : '—') },
          { key: 'admissionFeeAmount', label: 'Admission fee', width: 140, align: 'right', numeric: true, aggregate: 'sum',
            format: (v) => formatCurrency(v, { compact: true }), render: (r) => formatCurrency(r.admissionFeeAmount || 25000) },
          { key: 'admissionFeePaid', label: 'Fee status', width: 130, filter: true,
            render: (r) => Badge(r.admissionFeePaid ? 'Paid' : 'Pending'), value: (r) => (r.admissionFeePaid ? 'Paid' : 'Pending') },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: all,
        selectable: true,
        footerAggregates: true,
        exportName: 'selected-candidates',
        searchKeys: ['studentName', 'applicationNo', 'className'],
        bulkActions: [
          { label: 'Resend offer letter', icon: 'send', onClick: (sel) => notify({ title: `Offer letters resent to ${sel.length} families`, tone: 'success' }) },
          { label: 'Extend deadline', icon: 'clock', onClick: (sel) => notify({ title: `Deadline extended for ${sel.length} offers`, tone: 'success' }) },
          { label: 'Withdraw offer', icon: 'x-circle', tone: 'danger', onClick: (sel) => ConfirmDialog({
            title: `Withdraw ${sel.length} offers?`, tone: 'danger', confirmLabel: 'Withdraw',
            text: 'The seats will be released back to the waiting list.',
          }).then((ok) => ok && notify({ title: `${sel.length} offers withdrawn`, tone: 'danger' })) },
        ],
        rowActions: (row) => [
          { label: 'Open application', icon: 'clipboard-check', route: `admissions/application-review/${row.id}` },
          { label: 'Collect fee', icon: 'wallet', route: 'admissions/admission-fee' },
          { label: 'Download offer letter', icon: 'download', onClick: mockAction('Download offer letter') },
        ],
        onRowClick: (row) => navigate(`admissions/application-review/${row.id}`),
        emptyState: EmptyState({ icon: 'award', title: 'No offers issued yet', text: 'Generate offers from the merit list to populate this screen.',
          action: Button('Open merit list', { variant: 'primary', icon: 'sort-desc', route: 'admissions/merit-list' }) }),
      }));
    },
  },

  /* ------------------------------------------ admissions/admission-fee */
  'admissions/admission-fee': {
    title: 'Admission Fee',
    subtitle: 'Collect the one-time admission fee against issued offers',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const offers = applicationsFor(ctx).filter((a) => a.status === 'Offered' || a.status === 'Admitted')
        .map((a) => ({ ...a, fee: a.admissionFeeAmount || 25000, dueDate: a.offerDate ? addDaysIso(a.offerDate, 7) : DEMO_TODAY }));
      const paid = offers.filter((a) => a.admissionFeePaid);
      const unpaid = offers.filter((a) => !a.admissionFeePaid);
      const collected = paid.reduce((s, a) => s + a.fee, 0);
      const outstanding = unpaid.reduce((s, a) => s + a.fee, 0);

      const openCollect = (row) => Modal({
        title: 'Collect admission fee',
        subtitle: `${row.studentName} · ${row.applicationNo}`,
        size: 'lg', icon: 'wallet',
        body: h('div', { className: 'stack-4' },
          Card({ pad: true }, DescriptionList([
            ['Candidate', row.studentName], ['Class', row.className],
            ['Campus', campusName(row.campusId)], ['Offer issued', row.offerDate ? formatDate(row.offerDate) : '—'],
            ['Admission fee', formatCurrency(row.fee)], ['Due by', formatDate(row.dueDate)],
          ], { cols: 2 })),
          FormGrid({ cols: 2 },
            Field({ label: 'Amount', required: true }, Input({ type: 'number', numeric: true, value: row.fee, prefix: '₹', onInput: () => {} })),
            Field({ label: 'Payment mode', required: true }, Select({ options: ['Cash', 'UPI', 'Card', 'Net Banking', 'Cheque', 'DD'], onChange: () => {} })),
            Field({ label: 'Reference no', hint: 'UTR, cheque or terminal reference' }, Input({ placeholder: 'e.g. UPI/2026/884213', onInput: () => {} })),
            Field({ label: 'Date' }, DatePicker({ value: DEMO_TODAY, width: '100%', onChange: () => {} })),
            Field({ label: 'Remarks', className: 'col-span-full' }, Textarea({ rows: 2, placeholder: 'Optional note for the receipt' })))),
        actions: (close) => frag(
          Button('Cancel', { variant: 'secondary', onClick: close }),
          Button('Collect & print receipt', { variant: 'primary', icon: 'receipt', onClick: () => { close(); notify({ title: 'Payment recorded', text: `${formatCurrency(row.fee)} from ${row.parentName}`, tone: 'success' }); } })),
      });

      mount.appendChild(listPage({
        title: 'Admission fee',
        subtitle: `${formatCurrency(collected, { compact: true })} collected · ${formatCurrency(outstanding, { compact: true })} outstanding across ${formatNumber(unpaid.length)} offers`,
        route: 'admissions/admission-fee',
        actions: pageActions(
          Button('Payment reminders', { variant: 'secondary', icon: 'bell', onClick: mockAction('Send payment reminders') }),
          Button('Collect fee', { variant: 'primary', icon: 'wallet', disabled: !unpaid.length, onClick: () => unpaid.length && openCollect(unpaid[0]) })),
        kpis: [
          { label: 'Collected', value: formatCurrency(collected, { compact: true }), delta: 7.8, icon: 'wallet', tone: 'success', trend: analytics.sparks.collection },
          { label: 'Outstanding', value: formatCurrency(outstanding, { compact: true }), delta: -3.1, icon: 'alert-circle', tone: 'danger' },
          { label: 'Offers paid', value: `${paid.length}/${offers.length}`, icon: 'check-circle', tone: 'brand' },
          { label: 'Realisation', value: `${Math.round((collected / Math.max(1, collected + outstanding)) * 100)}%`, icon: 'percent', tone: 'info' },
        ],
        chart: barChart({
          categories: countBy(offers, 'className').slice(0, 12).map((c) => c.key),
          series: [
            { name: 'Collected', values: countBy(offers, 'className').slice(0, 12).map((c) => paid.filter((a) => a.className === c.key).reduce((s, a) => s + a.fee, 0)) },
            { name: 'Outstanding', values: countBy(offers, 'className').slice(0, 12).map((c) => unpaid.filter((a) => a.className === c.key).reduce((s, a) => s + a.fee, 0)) },
          ],
          stacked: true, valueFormat: 'currencyCompact', height: 240, title: 'Admission fee by class',
        }),
        chartTitle: 'Admission fee collected vs outstanding',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Candidate, parent or application…', width: 280 },
          { id: 'className', label: 'Class', options: [...new Set(offers.map((a) => a.className))] },
          { id: 'feeStatus', label: 'Fee status', options: ['Paid', 'Pending'] },
        ],
        onFilter: filterHandler(offers, {
          q: matchText('studentName', 'parentName', 'applicationNo'),
          className: matchEq('className'),
          feeStatus: (r, v) => (r.admissionFeePaid ? 'Paid' : 'Pending') === v,
        }),
        columns: [
          { key: 'studentName', label: 'Candidate', sticky: true, width: 240, render: (r) => Identity(r.studentName, r.applicationNo) },
          { key: 'className', label: 'Class', width: 110, filter: true },
          { key: 'parentName', label: 'Payer', width: 180, render: (r) => h('div', { className: 'stack-1' },
            h('span', { className: 't-sm' }, r.parentName), h('span', { className: 't-xs t-muted t-num' }, r.phone)) },
          { key: 'fee', label: 'Amount', width: 130, align: 'right', numeric: true, aggregate: 'sum',
            format: (v) => formatCurrency(v, { compact: true }), render: (r) => formatCurrency(r.fee) },
          { key: 'dueDate', label: 'Due by', width: 130, render: (r) => h('span', {
            className: !r.admissionFeePaid && r.dueDate < DEMO_TODAY ? 't-danger t-num' : 't-num' }, formatDate(r.dueDate)) },
          { key: 'admissionFeePaid', label: 'Status', width: 120, filter: true,
            render: (r) => Badge(r.admissionFeePaid ? 'Paid' : r.dueDate < DEMO_TODAY ? 'Overdue' : 'Pending'),
            value: (r) => (r.admissionFeePaid ? 'Paid' : 'Pending') },
          { key: 'act', label: '', width: 130, sortable: false, align: 'right',
            render: (r) => (r.admissionFeePaid
              ? Button('Receipt', { variant: 'ghost', size: 'sm', icon: 'receipt', onClick: (ev) => { ev.stopPropagation(); mockAction('Print receipt')(); } })
              : Button('Collect', { variant: 'primary', size: 'sm', icon: 'wallet', onClick: (ev) => { ev.stopPropagation(); openCollect(r); } })) },
        ],
        rows: offers,
        selectable: true,
        footerAggregates: true,
        exportName: 'admission-fee',
        searchKeys: ['studentName', 'parentName', 'applicationNo'],
        bulkActions: [
          { label: 'Send payment link', icon: 'send', onClick: (sel) => notify({ title: `Payment links sent to ${sel.length} families`, tone: 'success' }) },
          { label: 'Waive fee', icon: 'gift', tone: 'danger', onClick: (sel) => ConfirmDialog({
            title: `Waive the admission fee for ${sel.length} candidates?`, tone: 'danger', confirmLabel: 'Waive fee',
            text: 'A waiver requires principal approval and is recorded in the audit log.',
          }).then((ok) => ok && notify({ title: `${sel.length} waivers recorded`, tone: 'warning' })) },
        ],
        rowActions: (row) => [
          { label: 'Open application', icon: 'clipboard-check', route: `admissions/application-review/${row.id}` },
          { label: 'Send payment link', icon: 'send', onClick: mockAction('Send payment link') },
        ],
        onRowClick: (row) => (row.admissionFeePaid ? navigate(`admissions/application-review/${row.id}`) : openCollect(row)),
        emptyState: EmptyState({ icon: 'wallet', title: 'No offers awaiting payment', text: 'Issue offers from the merit list to start collecting the admission fee.' }),
      }));
    },
  },

  /* ------------------------------------------- admissions/confirmation */
  'admissions/confirmation': {
    title: 'Confirmation',
    subtitle: 'Confirm seats and generate admission numbers',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const queue = applicationsFor(ctx)
        .filter((a) => a.admissionFeePaid || a.status === 'Admitted')
        .map((a) => ({ ...a, admissionNo: `ADM/26/${a.id.replace(/\D/g, '')}` }));
      const confirmed = queue.filter((a) => a.status === 'Admitted');

      mount.appendChild(approvalQueuePage({
        title: 'Admission confirmation',
        subtitle: `${formatNumber(queue.length)} candidates have paid and await seat confirmation · ${formatNumber(confirmed.length)} already enrolled`,
        route: 'admissions/confirmation',
        kpis: [
          { label: 'Awaiting confirmation', value: formatNumber(queue.length - confirmed.length), icon: 'inbox', tone: 'warning' },
          { label: 'Confirmed', value: formatNumber(confirmed.length), icon: 'check-circle', tone: 'success' },
          { label: 'Fee realised', value: formatCurrency(queue.reduce((s, a) => s + (a.admissionFeeAmount || 25000), 0), { compact: true }), icon: 'wallet', tone: 'brand' },
          { label: 'Seats remaining', value: formatNumber(Math.max(0, 420 - confirmed.length)), icon: 'grid', tone: 'info' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Candidate or application…', width: 280 },
          { id: 'className', label: 'Class', options: [...new Set(queue.map((a) => a.className))] },
        ],
        onFilter: filterHandler(queue, { q: matchText('studentName', 'applicationNo'), className: matchEq('className') }),
        columns: [
          { key: 'studentName', label: 'Candidate', sticky: true, width: 240, render: (r) => Identity(r.studentName, r.applicationNo) },
          { key: 'className', label: 'Class', width: 110, filter: true },
          { key: 'admissionNo', label: 'Admission no', width: 150, render: (r) => h('code', null, r.admissionNo) },
          { key: 'meritRank', label: 'Merit', width: 90, align: 'right', numeric: true, render: (r) => (r.meritRank ? `#${r.meritRank}` : '—') },
          { key: 'admissionFeeAmount', label: 'Fee paid', width: 130, align: 'right', numeric: true,
            render: (r) => formatCurrency(r.admissionFeeAmount || 25000) },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: queue,
        onApprove: (row) => notify({ title: 'Seat confirmed', text: `${row.studentName} · admission no ${row.admissionNo}`, tone: 'success' }),
        onReject: (row) => notify({ title: 'Confirmation held', text: `${row.studentName} moved back to the offer stage.`, tone: 'warning' }),
        detail: (row) => h('div', { className: 'stack-3' },
          profileHeader({
            name: row.studentName, size: 'lg',
            subtitle: `${row.className} · ${campusName(row.campusId)}`,
            badges: [Badge(row.status), Badge(row.admissionFeePaid ? 'Fee paid' : 'Fee pending')],
            meta: [
              { label: 'Application', value: row.applicationNo, icon: 'clipboard' },
              { label: 'Merit rank', value: row.meritRank ? `#${row.meritRank}` : '—', icon: 'trophy' },
              { label: 'Composite', value: meritScore(row) || '—', icon: 'chart-line' },
            ],
          }),
          SectionCard({ title: 'Seat allocation', icon: 'grid' },
            DescriptionList([
              ['Class', row.className], ['Proposed section', pickFrom(['A', 'B', 'C', 'D'], row.id)],
              ['House', pickFrom(db.houses, row.id, 'h').name], ['Campus', campusName(row.campusId)],
              ['Admission no', h('code', null, row.admissionNo)], ['Joining date', formatDate(addDaysIso(DEMO_TODAY, 7))],
            ], { cols: 2 })),
          SectionCard({ title: 'Pre-enrolment checklist', icon: 'clipboard-check' },
            FileList(documentsFor(row).slice(0, 6).map((d) => ({ name: d.name, size: d.size, type: 'pdf', date: formatDate(d.uploadedOn), status: d.status })))),
          Callout({ tone: 'info', icon: 'info', title: 'What happens on approval' },
            'A student record is created, the admission number is locked, the fee structure for the class is assigned and the welcome kit is emailed to the parent.')),
      }));
    },
  },

  /* ------------------------------------------- admissions/registration */
  'admissions/registration': {
    title: 'Registration',
    subtitle: 'Capture a new admission enquiry or registration',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const classOptions = [...new Set(db.enquiries.map((e) => e.className))];
      mount.appendChild(formPage({
        title: 'New admission registration',
        subtitle: 'Walk-in, phone or event capture · session 2026-27',
        route: 'admissions/registration',
        mode: 'wizard',
        submitLabel: 'Create registration',
        steps: [
          {
            id: 'candidate', label: 'Candidate', description: 'Who is applying',
            sections: [{
              title: 'Student details', description: 'As printed on the birth certificate', cols: 2,
              fields: [
                { id: 'firstName', label: 'First name', required: true, placeholder: 'e.g. Aarav' },
                { id: 'lastName', label: 'Last name', required: true, placeholder: 'e.g. Sharma' },
                { id: 'gender', label: 'Gender', type: 'radio', inline: true, required: true, options: ['Male', 'Female', 'Other'] },
                { id: 'dob', label: 'Date of birth', type: 'date', required: true },
                { id: 'className', label: 'Class applying for', type: 'select', required: true, options: classOptions },
                { id: 'campusId', label: 'Campus', type: 'select', required: true, options: campusOptions(), value: campusOf(ctx) || db.campuses[0].id },
                { id: 'previousSchool', label: 'Previous school', placeholder: 'Leave blank for first admission' },
                { id: 'board', label: 'Previous board', type: 'select', options: db.boards.map((b) => b.code) },
                { id: 'category', label: 'Category', type: 'select', options: ['General', 'OBC', 'SC', 'ST', 'EWS'] },
                { id: 'bloodGroup', label: 'Blood group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
              ],
            }],
          },
          {
            id: 'parent', label: 'Parent', description: 'Contact and guardian details',
            sections: [{
              title: 'Parent / guardian', cols: 2,
              fields: [
                { id: 'parentName', label: 'Parent name', required: true },
                { id: 'relation', label: 'Relation', type: 'select', required: true, options: ['Father', 'Mother', 'Guardian'] },
                { id: 'phone', label: 'Mobile', type: 'tel', required: true, validate: validators.phone, placeholder: '+91 98xxxxxxxx' },
                { id: 'altPhone', label: 'Alternate mobile', type: 'tel' },
                { id: 'email', label: 'Email', type: 'email', required: true, validate: validators.email },
                { id: 'occupation', label: 'Occupation' },
                { id: 'address', label: 'Address', type: 'textarea', span: 'full', placeholder: 'House, street, locality' },
                { id: 'city', label: 'City' },
                { id: 'pincode', label: 'PIN code' },
              ],
            }],
          },
          {
            id: 'source', label: 'Source & needs', description: 'Attribution and services',
            sections: [{
              title: 'Enquiry attribution', cols: 2,
              fields: [
                { id: 'source', label: 'How did they hear about us?', type: 'select', required: true,
                  options: ['Walk-in', 'Website', 'Referral', 'Google Ads', 'Facebook', 'Education Fair', 'Newspaper', 'Hoarding', 'Sibling'] },
                { id: 'priority', label: 'Intent', type: 'select', options: ['High', 'Medium', 'Low'], value: 'Medium' },
                { id: 'assignedTo', label: 'Assign counsellor', type: 'combobox',
                  options: db.staff.filter((s) => s.designation === 'Admission Officer').map((s) => ({ value: s.id, label: s.name })) },
                { id: 'nextFollowUp', label: 'First follow-up on', type: 'date', value: addDaysIso(DEMO_TODAY, 2) },
                { id: 'transport', label: 'Transport', type: 'switch', switchLabel: 'Interested in school transport' },
                { id: 'hostel', label: 'Hostel', type: 'switch', switchLabel: 'Interested in hostel accommodation' },
                { id: 'siblingHere', label: 'Sibling', type: 'checkbox', checkboxLabel: 'A sibling already studies here' },
                { id: 'scholarship', label: 'Scholarship', type: 'checkbox', checkboxLabel: 'Requests scholarship / RTE consideration' },
                { id: 'remarks', label: 'Counsellor remarks', type: 'textarea', span: 'full', placeholder: 'What did the family ask about?' },
                { id: 'docs', label: 'Attach documents', type: 'file', span: 'full', hint: 'Birth certificate, previous report card, address proof' },
              ],
            }],
          },
        ],
        onSubmit: (values) => {
          notify({
            title: 'Registration created',
            text: `${values.firstName || 'Candidate'} ${values.lastName || ''} · ${values.className || 'class pending'} — demo only, nothing persisted.`,
            tone: 'success',
          });
          navigate('admissions/enquiries');
        },
        onCancel: () => navigate('admissions/enquiries'),
      }));
    },
  },

  /* ------------------------------------------- admissions/waiting-list */
  'admissions/waiting-list': {
    title: 'Waiting List',
    subtitle: 'Candidates held against seat availability',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const ranked = meritPool(ctx);
      const all = ranked.filter((a) => a.waitlisted || (a.status === 'In Process' && a.entranceResult === 'Qualified'))
        .map((a, i) => ({ ...a, waitRank: i + 1, seatsAhead: i }));
      const byClass = countBy(all, 'className');

      mount.appendChild(listPage({
        title: 'Waiting list',
        subtitle: `${formatNumber(all.length)} candidates waiting on a seat · released in merit order as offers lapse`,
        route: 'admissions/waiting-list',
        actions: pageActions(
          Button('Notify next in line', { variant: 'secondary', icon: 'bell', onClick: mockAction('Notify waitlist') }),
          Button('Release seats', { variant: 'primary', icon: 'award', onClick: () => ConfirmDialog({
            title: 'Release seats to the waiting list?', tone: 'brand', icon: 'award', confirmLabel: 'Release seats',
            text: 'Lapsed offers will be re-issued to the highest ranked waitlisted candidates.',
          }).then((ok) => ok && notify({ title: 'Seats released', text: 'Offers re-issued in merit order.', tone: 'success' })) })),
        kpis: [
          { label: 'On waiting list', value: formatNumber(all.length), icon: 'clock', tone: 'warning' },
          { label: 'Classes affected', value: formatNumber(byClass.length), icon: 'grid', tone: 'brand' },
          { label: 'Avg composite', value: all.length ? (all.reduce((s, a) => s + a.score, 0) / all.length).toFixed(1) : '—', icon: 'activity', tone: 'info' },
          { label: 'Longest wait', value: all.length ? `${Math.max(...all.map((a) => daysBetween(a.submittedOn, DEMO_TODAY)))} days` : '—', icon: 'history', tone: 'danger' },
        ],
        chart: barChart({
          horizontal: true,
          categories: byClass.slice(0, 12).map((c) => c.key),
          series: [{ name: 'Waitlisted', values: byClass.slice(0, 12).map((c) => c.value) }],
          height: 260, showValues: true, title: 'Waiting list by class',
        }),
        chartTitle: 'Where the pressure is',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Candidate or application…', width: 280 },
          { id: 'className', label: 'Class', options: byClass.map((c) => c.key) },
        ],
        onFilter: filterHandler(all, { q: matchText('studentName', 'applicationNo'), className: matchEq('className') }),
        columns: [
          { key: 'waitRank', label: 'Wait #', width: 90, align: 'right', numeric: true, sticky: true, render: (r) => h('span', { className: 't-num t-semibold' }, `#${r.waitRank}`) },
          { key: 'studentName', label: 'Candidate', width: 240, render: (r) => Identity(r.studentName, r.applicationNo) },
          { key: 'className', label: 'Class', width: 110, filter: true },
          { key: 'score', label: 'Composite', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => (v || 0).toFixed(1), render: (r) => r.score.toFixed(1) },
          { key: 'rank', label: 'Merit rank', width: 110, align: 'right', numeric: true, render: (r) => `#${r.rank}` },
          { key: 'submittedOn', label: 'Waiting since', width: 150, render: (r) => `${formatDate(r.submittedOn)} · ${daysBetween(r.submittedOn, DEMO_TODAY)}d` },
          { key: 'phone', label: 'Contact', width: 150, render: (r) => h('span', { className: 't-num t-sm' }, r.phone) },
        ],
        rows: all,
        selectable: true,
        footerAggregates: true,
        exportName: 'waiting-list',
        searchKeys: ['studentName', 'applicationNo', 'className'],
        bulkActions: [
          { label: 'Issue offer', icon: 'award', onClick: (sel) => notify({ title: `${sel.length} offers issued from the waiting list`, tone: 'success' }) },
          { label: 'Notify parents', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} parents notified`, tone: 'success' }) },
          { label: 'Remove from list', icon: 'x-circle', tone: 'danger', onClick: (sel) => ConfirmDialog({
            title: `Remove ${sel.length} candidates?`, tone: 'danger', confirmLabel: 'Remove',
            text: 'They will be moved to the cancellation register.',
          }).then((ok) => ok && notify({ title: `${sel.length} candidates removed`, tone: 'danger' })) },
        ],
        rowActions: (row) => [
          { label: 'Open application', icon: 'clipboard-check', route: `admissions/application-review/${row.id}` },
          { label: 'Issue offer now', icon: 'award', onClick: mockAction('Issue offer') },
        ],
        onRowClick: (row) => navigate(`admissions/application-review/${row.id}`),
        emptyState: EmptyState({ icon: 'clock', title: 'Waiting list is empty', text: 'Every qualified candidate currently has a seat or an offer.' }),
      }));
    },
  },

  /* ------------------------------------------- admissions/cancellation */
  'admissions/cancellation': {
    title: 'Cancellations',
    subtitle: 'Withdrawn enquiries, lapsed offers and refunds',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const lost = enquiriesFor(ctx).filter((e) => e.stage === 'Lost' || e.status === 'Lost');
      const rejected = applicationsFor(ctx).filter((a) => a.status === 'Rejected');
      const rows = lost.map((e) => {
        const app = applicationForEnquiry(e.id);
        return {
          id: e.id,
          enquiryNo: e.enquiryNo,
          applicationNo: app ? app.applicationNo : '—',
          studentName: e.studentName,
          className: e.className,
          campusId: e.campusId,
          parentName: e.parentName,
          phone: e.phone,
          reason: e.lostReason || 'Not specified',
          stageAtExit: e.stage,
          cancelledOn: e.lastContact,
          refundDue: app && app.admissionFeePaid ? (app.admissionFeeAmount || 25000) * 0.7 : 0,
          refundStatus: app && app.admissionFeePaid ? pickFrom(['Processed', 'Pending', 'Under Review'], e.id) : 'Not applicable',
        };
      });
      const reasons = countBy(rows, 'reason');
      const refundTotal = rows.reduce((s, r) => s + r.refundDue, 0);

      mount.appendChild(listPage({
        title: 'Cancellations & withdrawals',
        subtitle: `${formatNumber(rows.length)} cancelled enquiries · ${formatNumber(rejected.length)} rejected applications · ${formatCurrency(refundTotal, { compact: true })} refundable`,
        route: 'admissions/cancellation',
        actions: pageActions(
          Button('Win-back campaign', { variant: 'secondary', icon: 'megaphone', onClick: mockAction('Launch win-back campaign') }),
          Button('Process refunds', { variant: 'primary', icon: 'refresh-ccw', onClick: mockAction('Process refunds') })),
        kpis: [
          { label: 'Cancellations', value: formatNumber(rows.length), delta: -5.4, icon: 'x-circle', tone: 'danger' },
          { label: 'Rejected applications', value: formatNumber(rejected.length), icon: 'user-x', tone: 'warning' },
          { label: 'Refund liability', value: formatCurrency(refundTotal, { compact: true }), icon: 'refresh-ccw', tone: 'brand' },
          { label: 'Top reason', value: reasons.length ? reasons[0].key : '—', icon: 'help-circle', tone: 'info' },
        ],
        chart: h('div', { className: 'grid grid-2' },
          barChart({ horizontal: true, categories: reasons.map((r) => r.key), series: [{ name: 'Cancellations', values: reasons.map((r) => r.value) }], height: 240, showValues: true, title: 'Reasons for cancellation' }),
          donutChart({ data: countBy(rows, 'stageAtExit').map((r) => ({ key: r.key, value: r.value })), height: 240, centerLabel: 'Exit stage', title: 'Stage at cancellation' })),
        chartTitle: 'Why families walk away',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Candidate or enquiry no…', width: 280 },
          { id: 'reason', label: 'Reason', options: reasons.map((r) => r.key) },
          { id: 'className', label: 'Class', options: [...new Set(rows.map((r) => r.className))] },
          { id: 'refundStatus', label: 'Refund', options: ['Processed', 'Pending', 'Under Review', 'Not applicable'] },
        ],
        onFilter: filterHandler(rows, {
          q: matchText('studentName', 'enquiryNo', 'parentName'),
          reason: matchEq('reason'),
          className: matchEq('className'),
          refundStatus: matchEq('refundStatus'),
        }),
        columns: [
          { key: 'studentName', label: 'Candidate', sticky: true, width: 230, render: (r) => Identity(r.studentName, r.enquiryNo) },
          { key: 'className', label: 'Class', width: 110, filter: true },
          { key: 'stageAtExit', label: 'Exited at', width: 160, filter: true, render: (r) => Badge(r.stageAtExit, { tone: 'neutral' }) },
          { key: 'reason', label: 'Reason', width: 200, filter: true },
          { key: 'cancelledOn', label: 'Cancelled on', width: 140, render: (r) => formatDate(r.cancelledOn) },
          { key: 'refundDue', label: 'Refund due', width: 140, align: 'right', numeric: true, aggregate: 'sum',
            format: (v) => formatCurrency(v, { compact: true }), render: (r) => (r.refundDue ? formatCurrency(r.refundDue) : '—') },
          { key: 'refundStatus', label: 'Refund status', width: 150, filter: true, render: (r) => Badge(r.refundStatus, { tone: r.refundStatus === 'Processed' ? 'success' : r.refundStatus === 'Pending' ? 'warning' : 'neutral' }) },
        ],
        rows,
        selectable: true,
        footerAggregates: true,
        exportName: 'admission-cancellations',
        searchKeys: ['studentName', 'enquiryNo', 'reason'],
        bulkActions: [
          { label: 'Re-open enquiry', icon: 'refresh', onClick: (sel) => notify({ title: `${sel.length} enquiries re-opened`, tone: 'success' }) },
          { label: 'Approve refunds', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} refunds approved`, tone: 'success' }) },
        ],
        rowActions: (row) => [
          { label: 'Open enquiry', icon: 'eye', onClick: () => { const e = byId(db.enquiries, row.id); if (e) openEnquiryDrawer(e); } },
          { label: 'Re-open', icon: 'refresh', onClick: mockAction('Re-open enquiry') },
        ],
        onRowClick: (row) => { const e = byId(db.enquiries, row.id); if (e) openEnquiryDrawer(e); },
        emptyState: EmptyState({ icon: 'check-circle', title: 'No cancellations', text: 'Nobody has withdrawn from the admission process this session.' }),
      }));
    },
  },

  /* ------------------------------------------------ admissions/reports */
  'admissions/reports': {
    title: 'Admission Reports',
    subtitle: 'Funnel conversion, source ROI and class-wise intake',
    section: 'admissions',
    render(mount, ctx) {
      ensureStyles();
      const enq = enquiriesFor(ctx);
      const funnel = analytics.admissionFunnel;
      const rows = analytics.admissionsByClass.map((r) => ({
        ...r,
        fillRate: Math.round((r.admitted / Math.max(1, r.seats)) * 100),
        conversion: Math.round((r.admitted / Math.max(1, r.applications)) * 100),
        vacancies: Math.max(0, r.seats - r.admitted),
      }));

      mount.appendChild(reportPage({
        title: 'Admission reports',
        subtitle: `${campusLabel(ctx)} · academic year 2026-27 · generated ${formatDate(DEMO_TODAY)}`,
        route: 'admissions/reports',
        filters: [
          { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'q1', label: 'Q1' }, { id: 'q2', label: 'Q2' }, { id: 'ytd', label: 'YTD' }] },
          { id: 'campus', label: 'Campus', options: db.campuses.map((c) => c.name) },
          { id: 'stage', label: 'Stage', options: STAGE_ORDER },
          { id: 'from', label: 'From', type: 'date' },
        ],
        onFilter: (id, v, all, table) => table && table.refresh(rows),
        summary: [
          { label: 'Enquiries', value: formatNumber(funnel[0].count), delta: 8.4, icon: 'message-square', tone: 'brand', trend: analytics.sparks.admissions },
          { label: 'Applications', value: formatNumber(funnel[2].count), delta: 4.9, icon: 'clipboard-check', tone: 'info' },
          { label: 'Offers', value: formatNumber(funnel[6].count), delta: 3.2, icon: 'award', tone: 'warning' },
          { label: 'Admitted', value: formatNumber(funnel[7].count), delta: 6.1, icon: 'user-check', tone: 'success' },
        ],
        chart: [
          funnelChart({ stages: funnel.map((f) => ({ label: f.stage, value: f.count })), showConversion: true, height: 320, title: 'Admission funnel with conversion' }),
          comboChart({
            categories: analytics.admissionTrend.map((r) => r.month),
            bars: [{ name: 'Enquiries', values: analytics.admissionTrend.map((r) => r.enquiries) },
              { name: 'Applications', values: analytics.admissionTrend.map((r) => r.applications) }],
            line: { name: 'Admitted', values: analytics.admissionTrend.map((r) => r.admitted) },
            height: 300, title: 'Monthly admission movement',
          }),
          barChart({
            horizontal: true,
            categories: analytics.admissionSourceSplit.map((s) => s.key),
            series: [{ name: 'Enquiries', values: analytics.admissionSourceSplit.map((s) => s.value) }],
            height: 280, showValues: true, title: 'Source attribution',
          }),
        ],
        chartTitle: 'Funnel analysis',
        columns: [
          { key: 'className', label: 'Class', sticky: true, width: 140 },
          { key: 'applications', label: 'Applications', align: 'right', numeric: true, aggregate: 'sum', width: 130 },
          { key: 'seats', label: 'Seats', align: 'right', numeric: true, aggregate: 'sum', width: 100 },
          { key: 'admitted', label: 'Admitted', align: 'right', numeric: true, aggregate: 'sum', width: 110 },
          { key: 'vacancies', label: 'Vacancies', align: 'right', numeric: true, aggregate: 'sum', width: 110 },
          { key: 'conversion', label: 'Conversion', align: 'right', numeric: true, aggregate: 'avg', width: 130,
            format: (v) => `${Math.round(v)}%`, render: (r) => `${r.conversion}%` },
          { key: 'fillRate', label: 'Seat fill', align: 'right', numeric: true, aggregate: 'avg', width: 150,
            format: (v) => `${Math.round(v)}%`,
            render: (r) => h('div', { className: 'stack-1', style: { minWidth: '110px' } },
              ProgressBar(Math.min(100, r.fillRate), { size: 'sm', tone: r.fillRate >= 90 ? 'success' : r.fillRate >= 60 ? 'warning' : 'danger' }),
              h('span', { className: 't-2xs t-muted t-num' }, `${r.fillRate}%`)) },
        ],
        rows,
        tableTitle: 'Class-wise intake',
        footerAggregates: true,
        notes: Callout({ tone: 'info', icon: 'info', title: 'Reading this report' },
          `Conversion is admitted ÷ applications. Seat fill is admitted ÷ sanctioned seats. Enquiry base for the period: ${formatNumber(enq.length)} records.`),
      }));
    },
  },

  /* ----------------------------------------------- admissions/settings */
  'admissions/settings': {
    title: 'Admission Settings',
    subtitle: 'Session windows, fees, documents and automation',
    section: 'admissions',
    render(mount) {
      ensureStyles();
      mount.appendChild(settingsPage({
        title: 'Admission settings',
        subtitle: 'Applies to every campus unless overridden at campus level',
        route: 'admissions/settings',
        saveLabel: 'Save admission settings',
        onSave: () => notify({ title: 'Admission settings saved', text: 'Demo only — nothing was persisted.', tone: 'success' }),
        groups: [
          {
            id: 'session', title: 'Admission session', icon: 'calendar', cols: 2,
            description: 'Controls when the online application portal accepts submissions.',
            fields: [
              { id: 'ay', label: 'Academic year', type: 'select', value: '2026-27', options: db.academicYears.map((a) => a.name) },
              { id: 'board', label: 'Board', type: 'select', value: 'CBSE', options: db.boards.map((b) => b.code) },
              { id: 'openDate', label: 'Portal opens', type: 'date', value: '2026-01-05' },
              { id: 'closeDate', label: 'Portal closes', type: 'date', value: '2027-01-31' },
              { id: 'prefix', label: 'Enquiry number prefix', value: 'ENQ/26/', hint: 'Sequence resets every session' },
              { id: 'appPrefix', label: 'Application number prefix', value: 'APL/26/' },
            ],
          },
          {
            id: 'fees', title: 'Registration & admission fee', icon: 'wallet', cols: 2,
            fields: [
              { id: 'regFee', label: 'Registration fee (₹)', type: 'number', value: 1500 },
              { id: 'admFee', label: 'Admission fee (₹)', type: 'number', value: 25000 },
              { id: 'offerDays', label: 'Offer validity (days)', type: 'number', value: 7 },
              { id: 'refundPct', label: 'Refund on cancellation (%)', type: 'number', value: 70 },
              { id: 'siblingWaiver', label: 'Sibling waiver', type: 'switch', value: true, switchLabel: 'Waive registration fee for siblings', description: 'Applies automatically when a sibling is enrolled.' },
              { id: 'rteQuota', label: 'RTE quota', type: 'switch', value: true, switchLabel: 'Reserve 25% seats under RTE' },
            ],
          },
          {
            id: 'docs', title: 'Document checklist', icon: 'folder',
            description: 'Documents parents must upload before an application can be reviewed.',
            actions: [Button('Add document', { variant: 'secondary', size: 'sm', icon: 'plus', onClick: mockAction('Add document type') })],
            render: () => DataTable({
              columns: [
                { key: 'name', label: 'Document', sticky: true, width: 260 },
                { key: 'required', label: 'Mandatory', width: 130, render: (r) => Badge(r.required ? 'Mandatory' : 'Optional', { tone: r.required ? 'warning' : 'neutral' }), value: (r) => (r.required ? 'Yes' : 'No') },
                { key: 'formats', label: 'Accepted formats', width: 200 },
                { key: 'maxMb', label: 'Max size', width: 110, align: 'right', numeric: true, render: (r) => `${r.maxMb} MB` },
                { key: 'act', label: '', width: 80, sortable: false, align: 'right',
                  render: () => IconButton('edit', { label: 'Edit document rule', size: 'sm', onClick: mockAction('Edit document rule') }) },
              ],
              rows: DOC_TYPES.map((name, i) => ({ id: 'D' + i, name, required: i < 6, formats: 'PDF, JPG, PNG', maxMb: i === 4 ? 2 : 5 })),
              paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
            }),
          },
          {
            id: 'stages', title: 'Pipeline stages', icon: 'workflow',
            description: 'The stages a candidate moves through. Drag order is fixed for this prototype.',
            render: () => h('div', { className: 'stack-2' },
              PIPELINE.map((c, i) => h('div', { className: 'adm-tile row-3' },
                h('span', { className: 'dot', style: { width: '10px', height: '10px', borderRadius: 'var(--r-full)', background: c.color, display: 'inline-block' } }),
                h('span', { className: 't-medium flex-1' }, `${i + 1}. ${c.title}`),
                Badge(c.stages.length ? c.stages.join(', ') : 'Derived from fee payment', { tone: 'neutral' })))),
          },
          {
            id: 'automation', title: 'Automation & notifications', icon: 'zap', cols: 2,
            fields: [
              { id: 'autoAck', label: 'Auto acknowledgement', type: 'switch', value: true, switchLabel: 'Email + SMS on enquiry capture' },
              { id: 'autoAssign', label: 'Round-robin assignment', type: 'switch', value: true, switchLabel: 'Auto-assign enquiries to counsellors' },
              { id: 'reminder', label: 'Follow-up reminder', type: 'select', value: '1 day before', options: ['Same day', '1 day before', '2 days before'] },
              { id: 'offerSms', label: 'Offer SMS template', type: 'select', value: 'Offer — standard', options: db.templates.map((t) => t.name) },
              { id: 'idleDays', label: 'Mark idle after (days)', type: 'number', value: 21, hint: 'Idle enquiries surface in the follow-up queue' },
              { id: 'autoWaitlist', label: 'Auto waiting list', type: 'switch', value: true, switchLabel: 'Move lapsed offers to the waiting list automatically' },
            ],
          },
        ],
      }));
    },
  },

  /* ------------------------------------------------ frontoffice/dashboard */
  'frontoffice/dashboard': {
    title: 'Reception Dashboard',
    subtitle: 'Visitors, calls, couriers and walk-in enquiries at a glance',
    section: 'frontoffice',
    render(mount, ctx) {
      ensureStyles();
      const visitors = scope(db.visitors, ctx);
      const calls = scope(db.callLogs, ctx);
      const couriers = scope(db.couriers, ctx);
      const lost = scope(db.lostFound, ctx);
      const comps = complaintsFor(ctx);
      const todayVisitors = visitors.filter((v) => v.date === DEMO_TODAY);
      const inside = visitors.filter((v) => v.status === 'Inside');
      const todayCalls = calls.filter((c) => c.date === DEMO_TODAY);
      const walkIns = enquiriesFor(ctx).filter((e) => e.source === 'Walk-in');

      const hours = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17'];
      const callsByHour = hours.map((hh) => calls.filter((c) => c.time.startsWith(hh)).length);
      const visitsByHour = hours.map((hh) => visitors.filter((v) => v.inTime.startsWith(hh)).length);

      mount.appendChild(dashboardPage({
        greeting: greetingFor(meNow()),
        title: `Reception desk · ${campusLabel(ctx)}`,
        subtitle: `${formatDate(DEMO_TODAY, 'long')} · ${formatNumber(inside.length)} visitors currently inside the campus`,
        route: 'frontoffice/dashboard',
        actions: pageActions(
          Button('Student lookup', { variant: 'secondary', icon: 'search', route: 'frontoffice/student-search' }),
          Button('Log a call', { variant: 'primary', icon: 'phone-call', route: 'frontoffice/call-log' })),
        kpis: [
          { label: 'Visitors today', value: formatNumber(todayVisitors.length), delta: 6.1, icon: 'users', tone: 'brand', onClick: () => navigate('security/visitors') },
          { label: 'Currently inside', value: formatNumber(inside.length), icon: 'log-in', tone: 'warning' },
          { label: 'Calls today', value: formatNumber(todayCalls.length), delta: 3.4, icon: 'phone-call', tone: 'info', onClick: () => navigate('frontoffice/call-log') },
          { label: 'Couriers pending', value: formatNumber(couriers.filter((c) => c.status === 'In Transit').length), icon: 'inbox', tone: 'warning', onClick: () => navigate('frontoffice/courier-in') },
          { label: 'Walk-in enquiries', value: formatNumber(walkIns.length), icon: 'message-square', tone: 'success', onClick: () => navigate('frontoffice/enquiries') },
          { label: 'Open complaints', value: formatNumber(comps.filter((c) => c.status === 'Open' || c.status === 'In Progress').length), icon: 'alert-circle', tone: 'danger', onClick: () => navigate('frontoffice/complaints') },
        ],
        widgets: [
          { span: 4, render: () => SectionCard({ title: 'Quick actions', icon: 'zap' },
            h('div', { className: 'adm-quick' },
              Button('New enquiry', { variant: 'secondary', icon: 'plus', block: true, route: 'admissions/registration' }),
              Button('Log phone call', { variant: 'secondary', icon: 'phone-call', block: true, route: 'frontoffice/call-log' }),
              Button('Receive courier', { variant: 'secondary', icon: 'inbox', block: true, route: 'frontoffice/courier-in' }),
              Button('Dispatch courier', { variant: 'secondary', icon: 'send', block: true, route: 'frontoffice/courier-out' }),
              Button('Book appointment', { variant: 'secondary', icon: 'calendar-check', block: true, route: 'frontoffice/appointments' }),
              Button('Lost & found', { variant: 'secondary', icon: 'search', block: true, route: 'frontoffice/lost-found' }),
              Button('Intake complaint', { variant: 'secondary', icon: 'alert-circle', block: true, route: 'frontoffice/complaints' }),
              Button('Find a student', { variant: 'secondary', icon: 'user', block: true, route: 'frontoffice/student-search' }))) },
          { span: 8, render: () => SectionCard({ title: 'Footfall through the day', subtitle: 'Visitor check-ins and phone calls by hour', className: 'chart-card' },
            comboChart({
              categories: hours.map((hh) => `${hh}:00`),
              bars: [{ name: 'Visitors', values: visitsByHour }],
              line: { name: 'Calls', values: callsByHour },
              height: 280, title: 'Reception footfall by hour',
            })) },
          { span: 7, render: () => SectionCard({ title: 'Visitors on campus right now', icon: 'users',
            actions: Button('All visitors', { variant: 'ghost', size: 'sm', route: 'security/visitors' }) },
          inside.length ? DataTable({
            columns: [
              { key: 'name', label: 'Visitor', width: 200, render: (r) => Identity(r.name, r.phone) },
              { key: 'whomToMeet', label: 'Meeting', width: 160 },
              { key: 'purpose', label: 'Purpose' },
              { key: 'inTime', label: 'In', width: 90, align: 'right', numeric: true },
              { key: 'badgeNo', label: 'Badge', width: 90 },
            ],
            rows: inside.slice(0, 10), paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: '340px',
          }) : EmptyState({ icon: 'users', title: 'Nobody on campus', text: 'All visitors have checked out for the day.' })) },
          { span: 5, render: () => SectionCard({ title: 'Call purposes', subtitle: 'What the desk is being asked', className: 'chart-card' },
            donutChart({ data: countBy(calls, 'purpose').slice(0, 6).map((c) => ({ key: c.key, value: c.value })), height: 280, centerLabel: 'Calls', centerValue: formatNumber(calls.length), title: 'Calls by purpose' })) },
          { span: 6, render: () => SectionCard({ title: 'Latest activity', icon: 'history' },
            ActivityFeed(calls.slice(0, 8).map((c) => ({
              name: c.callerName,
              text: `${c.direction.toLowerCase()} call · ${c.purpose} · ${c.durationMin} min`,
              time: `${formatDate(c.date, 'dayMonth')} ${c.time}`,
              icon: 'phone-call', tone: c.followUpRequired ? 'warning' : 'info',
            })))) },
          { span: 6, render: () => SectionCard({ title: 'Courier movement', icon: 'package',
            actions: Button('Courier register', { variant: 'ghost', size: 'sm', route: 'frontoffice/courier-in' }) },
          DataTable({
            columns: [
              { key: 'refNo', label: 'Ref', width: 120, render: (r) => h('code', null, r.refNo) },
              { key: 'direction', label: 'Direction', width: 110, render: (r) => Badge(r.direction, { tone: r.direction === 'Inward' ? 'info' : 'brand' }) },
              { key: 'contents', label: 'Contents' },
              { key: 'status', label: 'Status', width: 120, render: (r) => Badge(r.status) },
            ],
            rows: sortBy(couriers, 'date', 'desc').slice(0, 8),
            paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
          })) },
          { span: 6, render: () => SectionCard({ title: 'Unclaimed lost & found', icon: 'search',
            actions: Button('Register', { variant: 'ghost', size: 'sm', route: 'frontoffice/lost-found' }) },
          (() => {
            const items = lost.filter((l) => l.status === 'Unclaimed').slice(0, 8);
            return items.length ? RankList(items.map((l) => ({
              name: l.item, meta: `${l.location} · ${formatDate(l.date)}`, value: l.type,
            }))) : EmptyState({ icon: 'check-circle', title: 'Everything claimed', text: 'No unclaimed items in the register.' });
          })()) },
          { span: 6, render: () => SectionCard({ title: 'Today’s appointments', icon: 'calendar-check',
            actions: Button('Diary', { variant: 'ghost', size: 'sm', route: 'frontoffice/appointments' }) },
          (() => {
            const appts = visitors.filter((v) => v.date === DEMO_TODAY).slice(0, 8);
            return appts.length ? Timeline(appts.map((v) => ({
              title: `${v.inTime} · ${v.name}`,
              meta: `${v.whomToMeet} · ${v.purpose}`,
              text: v.relatedStudent ? `Regarding ${v.relatedStudent}` : null,
              icon: 'calendar-check', tone: v.status === 'Inside' ? 'warning' : 'success',
            }))) : EmptyState({ icon: 'calendar', title: 'No appointments today', text: 'The diary is clear — walk-ins can be accommodated.' });
          })()) },
        ],
      }));
    },
  },

  /* ------------------------------------------------ frontoffice/enquiries */
  'frontoffice/enquiries': {
    title: 'Enquiry Log',
    subtitle: 'Every enquiry captured at the reception desk',
    section: 'frontoffice',
    render(mount, ctx) {
      ensureStyles();
      const all = enquiriesFor(ctx).filter((e) => ['Walk-in', 'Referral', 'Newspaper', 'Hoarding', 'Education Fair'].includes(e.source));
      const today = all.filter((e) => e.createdAt === DEMO_TODAY);

      mount.appendChild(listPage({
        title: 'Enquiry log',
        subtitle: `${formatNumber(all.length)} desk enquiries · ${formatNumber(today.length)} logged today · ${campusLabel(ctx)}`,
        route: 'frontoffice/enquiries',
        actions: pageActions(
          Button('Admission pipeline', { variant: 'secondary', icon: 'workflow', route: 'admissions/leads' }),
          Button('New enquiry', { variant: 'primary', icon: 'plus', route: 'admissions/registration' })),
        kpis: [
          { label: 'Desk enquiries', value: formatNumber(all.length), icon: 'message-square', tone: 'brand' },
          { label: 'Logged today', value: formatNumber(today.length), icon: 'calendar-check', tone: 'info' },
          { label: 'Converted', value: formatNumber(all.filter((e) => e.stage === 'Admitted').length), icon: 'user-check', tone: 'success' },
          { label: 'Awaiting callback', value: formatNumber(all.filter((e) => e.status === 'Open' && e.nextFollowUp <= DEMO_TODAY).length), icon: 'phone-call', tone: 'warning' },
        ],
        chart: barChart({
          categories: countBy(all, 'source').map((s) => s.key),
          series: [{ name: 'Enquiries', values: countBy(all, 'source').map((s) => s.value) }],
          height: 220, showValues: true, title: 'Desk enquiries by source',
        }),
        chartTitle: 'How walk-in families find us',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Name, phone or enquiry no…', width: 280 },
          { id: 'source', label: 'Source', options: [...new Set(all.map((e) => e.source))] },
          { id: 'className', label: 'Class', options: [...new Set(all.map((e) => e.className))] },
          { id: 'stage', label: 'Stage', options: STAGE_ORDER },
          { id: 'from', type: 'date', label: 'From' },
        ],
        onFilter: filterHandler(all, {
          q: matchText('studentName', 'parentName', 'phone', 'enquiryNo'),
          source: matchEq('source'), className: matchEq('className'),
          stage: matchEq('stage'), from: dateFrom('createdAt'),
        }),
        columns: [
          { key: 'createdAt', label: 'Logged', width: 120, render: (r) => formatDate(r.createdAt) },
          { key: 'studentName', label: 'Candidate', sticky: true, width: 220, render: (r) => Identity(r.studentName, r.enquiryNo) },
          { key: 'parentName', label: 'Enquirer', width: 180, render: (r) => h('div', { className: 'stack-1' },
            h('span', { className: 't-sm' }, `${r.parentName} (${r.relation})`),
            h('span', { className: 't-xs t-muted t-num' }, r.phone)) },
          { key: 'className', label: 'Class', width: 110, filter: true },
          { key: 'source', label: 'Source', width: 140, filter: true },
          { key: 'stage', label: 'Stage', width: 150, filter: true, render: (r) => Badge(r.stage, { tone: stageTone(r.stage) }) },
          { key: 'remarks', label: 'Desk note', render: (r) => h('span', { className: 't-sm t-clamp-2' }, r.remarks) },
          { key: 'assignedToName', label: 'Handed to', width: 170 },
        ],
        rows: sortBy(all, 'createdAt', 'desc'),
        selectable: true,
        exportName: 'front-office-enquiries',
        searchKeys: ['studentName', 'parentName', 'phone', 'enquiryNo'],
        bulkActions: [{ label: 'Hand to admissions', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} enquiries handed to admissions`, tone: 'success' }) }],
        rowActions: (row) => [
          { label: 'Quick view', icon: 'eye', onClick: () => openEnquiryDrawer(row) },
          { label: 'Log a call', icon: 'phone-call', route: 'frontoffice/call-log' },
        ],
        onRowClick: (row) => openEnquiryDrawer(row),
        emptyState: EmptyState({ icon: 'message-square', title: 'No desk enquiries', text: 'Walk-in and referral enquiries captured at reception show up here.' }),
      }));
    },
  },

  /* ------------------------------------------------- frontoffice/call-log */
  'frontoffice/call-log': {
    title: 'Phone Call Log',
    subtitle: 'Incoming and outgoing calls handled by the desk',
    section: 'frontoffice',
    render(mount, ctx) {
      ensureStyles();
      const all = scope(db.callLogs, ctx);
      let activeTab = 'all';
      const tabRows = {
        all,
        incoming: all.filter((c) => c.direction === 'Incoming'),
        outgoing: all.filter((c) => c.direction === 'Outgoing'),
        followup: all.filter((c) => c.followUpRequired),
      };

      const logCall = () => Modal({
        title: 'Log a phone call', size: 'lg', icon: 'phone-call',
        body: h('div', { className: 'stack-4' },
          FormGrid({ cols: 2 },
            Field({ label: 'Direction', required: true }, Select({ options: ['Incoming', 'Outgoing'], value: 'Incoming', onChange: () => {} })),
            Field({ label: 'Caller name', required: true }, Input({ placeholder: 'Who called?', onInput: () => {} })),
            Field({ label: 'Phone', required: true }, Input({ type: 'tel', placeholder: '+91 98xxxxxxxx', onInput: () => {} })),
            Field({ label: 'Purpose', required: true }, Select({ options: ['Admission Enquiry', 'Fee Query', 'Absence Intimation', 'Transport Query', 'Complaint', 'Result Query', 'Vendor Call', 'Appointment Request'], onChange: () => {} })),
            Field({ label: 'Duration (minutes)' }, Input({ type: 'number', numeric: true, value: 3, onInput: () => {} })),
            Field({ label: 'Follow-up needed' }, Switch('Schedule a callback', { onChange: () => {} })),
            Field({ label: 'Notes', className: 'col-span-full' }, Textarea({ rows: 3, placeholder: 'Summary of the conversation' })))),
        actions: (close) => frag(
          Button('Cancel', { variant: 'secondary', onClick: close }),
          Button('Save call', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Call logged', text: 'Demo only — nothing was persisted.', tone: 'success' }); } })),
      });

      const hours = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17'];

      const node = listPage({
        title: 'Phone call log',
        subtitle: `${formatNumber(all.length)} calls · ${formatNumber(tabRows.followup.length)} awaiting a callback`,
        route: 'frontoffice/call-log',
        actions: pageActions(
          Button('Export register', { variant: 'secondary', icon: 'download', onClick: () => {
            download('call-log.csv', toCsv(all, [
              { key: 'date', label: 'Date' }, { key: 'time', label: 'Time' }, { key: 'direction', label: 'Direction' },
              { key: 'callerName', label: 'Caller' }, { key: 'phone', label: 'Phone' }, { key: 'purpose', label: 'Purpose' },
              { key: 'durationMin', label: 'Minutes' },
            ]), 'text/csv;charset=utf-8');
            notify({ title: 'Call register exported', tone: 'success' });
          } }),
          Button('Log a call', { variant: 'primary', icon: 'phone-call', onClick: logCall })),
        kpis: [
          { label: 'Total calls', value: formatNumber(all.length), icon: 'phone-call', tone: 'brand' },
          { label: 'Incoming', value: formatNumber(tabRows.incoming.length), icon: 'phone', tone: 'info' },
          { label: 'Callbacks due', value: formatNumber(tabRows.followup.length), icon: 'timer', tone: 'warning' },
          { label: 'Avg duration', value: `${(all.reduce((s, c) => s + c.durationMin, 0) / Math.max(1, all.length)).toFixed(1)} min`, icon: 'clock', tone: 'success' },
        ],
        tabs: [
          { id: 'all', label: 'All', count: all.length },
          { id: 'incoming', label: 'Incoming', count: tabRows.incoming.length },
          { id: 'outgoing', label: 'Outgoing', count: tabRows.outgoing.length },
          { id: 'followup', label: 'Callback due', count: tabRows.followup.length },
        ],
        activeTab,
        onTabChange: (id) => { activeTab = id; node.table.refresh(tabRows[id] || all); },
        chart: h('div', { className: 'grid grid-2' },
          barChart({ categories: hours.map((hh) => `${hh}:00`), series: [{ name: 'Calls', values: hours.map((hh) => all.filter((c) => c.time.startsWith(hh)).length) }], height: 220, showValues: true, title: 'Calls by hour' }),
          donutChart({ data: countBy(all, 'purpose').slice(0, 6).map((p) => ({ key: p.key, value: p.value })), height: 220, centerLabel: 'Purpose', title: 'Calls by purpose' })),
        chartTitle: 'Call volume and reasons',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Caller, phone or note…', width: 280 },
          { id: 'direction', label: 'Direction', options: ['Incoming', 'Outgoing'] },
          { id: 'purpose', label: 'Purpose', options: countBy(all, 'purpose').map((p) => p.key) },
          { id: 'from', type: 'date', label: 'From' },
          { id: 'to', type: 'date', label: 'To' },
        ],
        onFilter: (id, v, allV, table) => table.refresh(applyFilters(tabRows[activeTab] || all, allV, {
          q: matchText('callerName', 'phone', 'notes', 'purpose'),
          direction: matchEq('direction'), purpose: matchEq('purpose'),
          from: dateFrom('date'), to: dateTo('date'),
        })),
        columns: [
          { key: 'date', label: 'Date', width: 120, render: (r) => formatDate(r.date) },
          { key: 'time', label: 'Time', width: 90, align: 'right', numeric: true },
          { key: 'direction', label: 'Direction', width: 120, filter: true, render: (r) => Badge(r.direction, { tone: r.direction === 'Incoming' ? 'info' : 'brand', icon: r.direction === 'Incoming' ? 'arrow-down-right' : 'arrow-up-right' }) },
          { key: 'callerName', label: 'Caller', sticky: true, width: 210, render: (r) => Identity(r.callerName, r.phone) },
          { key: 'purpose', label: 'Purpose', width: 180, filter: true },
          { key: 'durationMin', label: 'Minutes', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'notes', label: 'Notes', render: (r) => h('span', { className: 't-sm t-clamp-2' }, r.notes) },
          { key: 'followUpRequired', label: 'Callback', width: 110, filter: true,
            render: (r) => (r.followUpRequired ? Badge('Due', { tone: 'warning' }) : Badge('Closed', { tone: 'success' })),
            value: (r) => (r.followUpRequired ? 'Due' : 'Closed') },
        ],
        rows: sortBy(all, 'date', 'desc'),
        selectable: true,
        footerAggregates: true,
        pageSize: 50,
        exportName: 'call-log',
        searchKeys: ['callerName', 'phone', 'purpose', 'notes'],
        bulkActions: [
          { label: 'Mark callback done', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} callbacks closed`, tone: 'success' }) },
          { label: 'Create enquiries', icon: 'user-plus', onClick: (sel) => notify({ title: `${sel.length} enquiries created`, tone: 'success' }) },
        ],
        rowActions: (row) => [
          { label: 'Call back', icon: 'phone', onClick: mockAction('Dial number') },
          { label: 'Create enquiry', icon: 'user-plus', route: 'admissions/registration' },
          { label: 'Copy number', icon: 'copy', onClick: () => copyToClipboard(row.phone, 'Number copied') },
        ],
        onRowClick: (row) => Drawer({
          title: row.callerName, subtitle: `${row.direction} call · ${formatDate(row.date)} ${row.time}`, size: 'md',
          body: h('div', { className: 'stack-3' },
            DescriptionList([
              ['Phone', row.phone], ['Purpose', row.purpose], ['Duration', `${row.durationMin} minutes`],
              ['Campus', campusName(row.campusId)], ['Callback', row.followUpRequired ? 'Required' : 'Not required'],
            ], { cols: 2 }),
            SectionCard({ title: 'Desk notes', icon: 'notebook' }, h('div', { className: 't-sm t-secondary' }, row.notes))),
          actions: (close) => frag(
            Button('Close', { variant: 'ghost', onClick: close }),
            Button('Call back', { variant: 'primary', icon: 'phone', onClick: mockAction('Dial number') })),
        }),
        emptyState: EmptyState({ icon: 'phone-call', title: 'No calls logged', text: 'Log the first call of the day to start the register.' }),
      });
      mount.appendChild(node);
    },
  },

  /* ----------------------------------------------- frontoffice/courier-in */
  'frontoffice/courier-in': {
    title: 'Postal / Courier In',
    subtitle: 'Inward register for post, parcels and legal documents',
    section: 'frontoffice',
    render(mount, ctx) {
      ensureStyles();
      const all = scope(db.couriers, ctx).filter((c) => c.direction === 'Inward');
      const pending = all.filter((c) => c.status !== 'Delivered');

      const receive = () => Modal({
        title: 'Receive an inward courier', size: 'lg', icon: 'inbox',
        body: h('div', { className: 'stack-4' },
          FormGrid({ cols: 2 },
            Field({ label: 'Courier company', required: true }, Select({ options: ['Blue Dart', 'DTDC', 'India Post', 'Delhivery', 'FedEx', 'Professional Couriers'], onChange: () => {} })),
            Field({ label: 'AWB / tracking no', required: true }, Input({ placeholder: 'AWB1234567890', onInput: () => {} })),
            Field({ label: 'Sender', required: true }, Input({ placeholder: 'e.g. CBSE Regional Office', onInput: () => {} })),
            Field({ label: 'Addressed to', required: true }, Select({ options: ['Principal', 'Accounts', 'Admissions', 'HR', 'Transport', 'Library'], onChange: () => {} })),
            Field({ label: 'Contents', required: true }, Input({ placeholder: 'e.g. Affiliation documents', onInput: () => {} })),
            Field({ label: 'Received on' }, DatePicker({ value: DEMO_TODAY, width: '100%', onChange: () => {} })),
            Field({ label: 'Remarks', className: 'col-span-full' }, Textarea({ rows: 2, placeholder: 'Condition of the packet, seals, etc.' })))),
        actions: (close) => frag(
          Button('Cancel', { variant: 'secondary', onClick: close }),
          Button('Record & notify', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Inward courier recorded', text: 'The recipient department has been notified.', tone: 'success' }); } })),
      });

      mount.appendChild(listPage({
        title: 'Postal / courier in',
        subtitle: `${formatNumber(all.length)} inward items · ${formatNumber(pending.length)} awaiting handover`,
        route: 'frontoffice/courier-in',
        actions: pageActions(
          Button('Outward register', { variant: 'secondary', icon: 'send', route: 'frontoffice/courier-out' }),
          Button('Receive courier', { variant: 'primary', icon: 'inbox', onClick: receive })),
        kpis: [
          { label: 'Inward items', value: formatNumber(all.length), icon: 'inbox', tone: 'brand' },
          { label: 'Awaiting handover', value: formatNumber(pending.length), icon: 'clock', tone: 'warning' },
          { label: 'Delivered', value: formatNumber(all.filter((c) => c.status === 'Delivered').length), icon: 'check-circle', tone: 'success' },
          { label: 'Returned', value: formatNumber(all.filter((c) => c.status === 'Returned').length), icon: 'refresh-ccw', tone: 'danger' },
        ],
        chart: barChart({
          categories: countBy(all, 'courierCompany').map((c) => c.key),
          series: [{ name: 'Items', values: countBy(all, 'courierCompany').map((c) => c.value) }],
          height: 220, showValues: true, title: 'Inward items by courier company',
        }),
        chartTitle: 'Inward volume by courier partner',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'AWB, sender or contents…', width: 280 },
          { id: 'courierCompany', label: 'Company', options: countBy(all, 'courierCompany').map((c) => c.key) },
          { id: 'recipient', label: 'Recipient', options: [...new Set(all.map((c) => c.recipient))] },
          { id: 'status', label: 'Status', options: ['Delivered', 'In Transit', 'Received', 'Returned'] },
          { id: 'from', type: 'date', label: 'From' },
        ],
        onFilter: filterHandler(all, {
          q: matchText('awbNo', 'sender', 'contents', 'refNo'),
          courierCompany: matchEq('courierCompany'), recipient: matchEq('recipient'),
          status: matchEq('status'), from: dateFrom('date'),
        }),
        columns: [
          { key: 'refNo', label: 'Ref no', sticky: true, width: 130, render: (r) => h('code', null, r.refNo) },
          { key: 'date', label: 'Received', width: 130, render: (r) => formatDate(r.date) },
          { key: 'courierCompany', label: 'Company', width: 170, filter: true },
          { key: 'awbNo', label: 'AWB', width: 170, render: (r) => h('span', { className: 't-mono t-xs' }, r.awbNo) },
          { key: 'sender', label: 'Sender', width: 190 },
          { key: 'recipient', label: 'Addressed to', width: 150, filter: true },
          { key: 'contents', label: 'Contents' },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: sortBy(all, 'date', 'desc'),
        selectable: true,
        exportName: 'courier-inward',
        searchKeys: ['refNo', 'awbNo', 'sender', 'contents'],
        bulkActions: [
          { label: 'Mark handed over', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} items handed over`, tone: 'success' }) },
          { label: 'Notify recipients', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} departments notified`, tone: 'success' }) },
        ],
        rowActions: (row) => [
          { label: 'Mark handed over', icon: 'check', onClick: mockAction('Mark handed over') },
          { label: 'Copy AWB', icon: 'copy', onClick: () => copyToClipboard(row.awbNo, 'AWB copied') },
          { label: 'Print acknowledgement', icon: 'print', onClick: mockAction('Print acknowledgement') },
        ],
        emptyState: EmptyState({ icon: 'inbox', title: 'Inward register is empty', text: 'Record the first inward courier of the day.' }),
      }));
    },
  },

  /* ---------------------------------------------- frontoffice/courier-out */
  'frontoffice/courier-out': {
    title: 'Courier Out',
    subtitle: 'Outward dispatch register with tracking',
    section: 'frontoffice',
    render(mount, ctx) {
      ensureStyles();
      const all = scope(db.couriers, ctx).filter((c) => c.direction === 'Outward');
      const inTransit = all.filter((c) => c.status === 'In Transit');

      const dispatch = () => Modal({
        title: 'Dispatch an outward courier', size: 'lg', icon: 'send',
        body: h('div', { className: 'stack-4' },
          FormGrid({ cols: 2 },
            Field({ label: 'Send to', required: true }, Select({ options: ['CBSE', 'Parent', 'Vendor', 'Affiliating Body', 'District Education Office'], onChange: () => {} })),
            Field({ label: 'Recipient name', required: true }, Input({ placeholder: 'Full name', onInput: () => {} })),
            Field({ label: 'Courier company', required: true }, Select({ options: ['Blue Dart', 'DTDC', 'India Post', 'Delhivery', 'FedEx', 'Professional Couriers'], onChange: () => {} })),
            Field({ label: 'AWB / tracking no' }, Input({ placeholder: 'Filled in after pickup', onInput: () => {} })),
            Field({ label: 'Contents', required: true }, Input({ placeholder: 'e.g. Marksheets', onInput: () => {} })),
            Field({ label: 'Dispatched on' }, DatePicker({ value: DEMO_TODAY, width: '100%', onChange: () => {} })),
            Field({ label: 'Declared value (₹)' }, Input({ type: 'number', numeric: true, prefix: '₹', onInput: () => {} })),
            Field({ label: 'Authorised by' }, Select({ options: ['Principal', 'Vice Principal', 'Administrator', 'Accounts Head'], onChange: () => {} })),
            Field({ label: 'Remarks', className: 'col-span-full' }, Textarea({ rows: 2, placeholder: 'Special handling instructions' })))),
        actions: (close) => frag(
          Button('Cancel', { variant: 'secondary', onClick: close }),
          Button('Dispatch', { variant: 'primary', icon: 'send', onClick: () => { close(); notify({ title: 'Courier dispatched', text: 'Tracking will update when the partner scans the packet.', tone: 'success' }); } })),
      });

      mount.appendChild(listPage({
        title: 'Courier out',
        subtitle: `${formatNumber(all.length)} outward dispatches · ${formatNumber(inTransit.length)} in transit`,
        route: 'frontoffice/courier-out',
        actions: pageActions(
          Button('Inward register', { variant: 'secondary', icon: 'inbox', route: 'frontoffice/courier-in' }),
          Button('Dispatch courier', { variant: 'primary', icon: 'send', onClick: dispatch })),
        kpis: [
          { label: 'Dispatches', value: formatNumber(all.length), icon: 'send', tone: 'brand' },
          { label: 'In transit', value: formatNumber(inTransit.length), icon: 'truck', tone: 'warning' },
          { label: 'Delivered', value: formatNumber(all.filter((c) => c.status === 'Delivered').length), icon: 'check-circle', tone: 'success' },
          { label: 'Returned', value: formatNumber(all.filter((c) => c.status === 'Returned').length), icon: 'refresh-ccw', tone: 'danger' },
        ],
        chart: donutChart({
          data: countBy(all, 'recipient').map((c) => ({ key: c.key, value: c.value })),
          height: 240, centerLabel: 'Dispatches', centerValue: formatNumber(all.length), title: 'Dispatches by recipient',
        }),
        chartTitle: 'Who we send to',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'AWB, recipient or contents…', width: 280 },
          { id: 'courierCompany', label: 'Company', options: countBy(all, 'courierCompany').map((c) => c.key) },
          { id: 'status', label: 'Status', options: ['Delivered', 'In Transit', 'Received', 'Returned'] },
          { id: 'from', type: 'date', label: 'From' },
        ],
        onFilter: filterHandler(all, {
          q: matchText('awbNo', 'recipient', 'contents', 'refNo'),
          courierCompany: matchEq('courierCompany'), status: matchEq('status'), from: dateFrom('date'),
        }),
        columns: [
          { key: 'refNo', label: 'Ref no', sticky: true, width: 130, render: (r) => h('code', null, r.refNo) },
          { key: 'date', label: 'Dispatched', width: 130, render: (r) => formatDate(r.date) },
          { key: 'recipient', label: 'Recipient', width: 180, filter: true },
          { key: 'courierCompany', label: 'Company', width: 170, filter: true },
          { key: 'awbNo', label: 'AWB', width: 170, render: (r) => h('span', { className: 't-mono t-xs' }, r.awbNo) },
          { key: 'contents', label: 'Contents' },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: sortBy(all, 'date', 'desc'),
        selectable: true,
        exportName: 'courier-outward',
        searchKeys: ['refNo', 'awbNo', 'recipient', 'contents'],
        bulkActions: [{ label: 'Mark delivered', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} dispatches marked delivered`, tone: 'success' }) }],
        rowActions: (row) => [
          { label: 'Track shipment', icon: 'navigation', onClick: mockAction('Track shipment') },
          { label: 'Copy AWB', icon: 'copy', onClick: () => copyToClipboard(row.awbNo, 'AWB copied') },
          { label: 'Print dispatch slip', icon: 'print', onClick: mockAction('Print dispatch slip') },
        ],
        emptyState: EmptyState({ icon: 'send', title: 'Nothing dispatched yet', text: 'Record an outward courier to begin the dispatch register.' }),
      }));
    },
  },

  /* --------------------------------------------- frontoffice/appointments */
  'frontoffice/appointments': {
    title: 'Appointments',
    subtitle: 'Reception diary for parent and vendor meetings',
    section: 'frontoffice',
    render(mount, ctx) {
      ensureStyles();
      const visitors = scope(db.visitors, ctx);
      const month = '2026-08';
      const monthly = visitors.filter((v) => v.date.startsWith(month));
      const today = monthly.filter((v) => v.date === DEMO_TODAY);

      const events = monthly.map((v) => ({
        date: v.date,
        title: `${v.inTime} ${v.name}`,
        meta: `${v.whomToMeet} · ${v.purpose}`,
        tone: v.status === 'Inside' ? 'warning' : v.purpose === 'Admission Enquiry' ? 'brand' : 'info',
        badge: v.purpose === 'Admission Enquiry' ? 'Adm' : null,
        raw: v,
      }));

      const book = () => Modal({
        title: 'Book an appointment', size: 'lg', icon: 'calendar-check',
        body: h('div', { className: 'stack-4' },
          FormGrid({ cols: 2 },
            Field({ label: 'Visitor name', required: true }, Input({ placeholder: 'Full name', onInput: () => {} })),
            Field({ label: 'Phone', required: true }, Input({ type: 'tel', placeholder: '+91 98xxxxxxxx', onInput: () => {} })),
            Field({ label: 'Meeting with', required: true }, Select({ options: ['Principal', 'Vice Principal', 'Class Teacher', 'Admission Office', 'Accounts Office', 'HR Department'], onChange: () => {} })),
            Field({ label: 'Purpose', required: true }, Select({ options: ['Admission Enquiry', 'Fee Payment', 'Meet Class Teacher', 'Vendor Meeting', 'Interview', 'Deliver Documents'], onChange: () => {} })),
            Field({ label: 'Date', required: true }, DatePicker({ value: DEMO_TODAY, width: '100%', onChange: () => {} })),
            Field({ label: 'Time', required: true }, TimePicker({ value: '10:30', from: '08:00', to: '17:00', onChange: () => {} })),
            Field({ label: 'Related student' }, Combobox({ options: db.students.slice(0, 300).map((s) => ({ value: s.id, label: `${s.name} · ${s.className}` })), placeholder: 'Search student…', onChange: () => {} })),
            Field({ label: 'Send reminder' }, Switch('SMS the visitor an hour before', { checked: true, onChange: () => {} })),
            Field({ label: 'Notes', className: 'col-span-full' }, Textarea({ rows: 2, placeholder: 'Anything the host should know' })))),
        actions: (close) => frag(
          Button('Cancel', { variant: 'secondary', onClick: close }),
          Button('Book appointment', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Appointment booked', text: 'A confirmation SMS has been queued.', tone: 'success' }); } })),
      });

      mount.appendChild(calendarPage({
        title: 'Appointments',
        subtitle: `${formatNumber(monthly.length)} appointments in ${formatDate(month + '-01', 'monthYear')} · ${formatNumber(today.length)} today`,
        route: 'frontoffice/appointments',
        month,
        events,
        actions: pageActions(
          Button('Visitor register', { variant: 'secondary', icon: 'users', route: 'security/visitors' }),
          Button('Book appointment', { variant: 'primary', icon: 'calendar-plus', onClick: book })),
        kpis: [
          { label: 'This month', value: formatNumber(monthly.length), icon: 'calendar', tone: 'brand' },
          { label: 'Today', value: formatNumber(today.length), icon: 'calendar-check', tone: 'info' },
          { label: 'With the principal', value: formatNumber(monthly.filter((v) => v.whomToMeet === 'Principal').length), icon: 'graduation-cap', tone: 'warning' },
          { label: 'Admission meetings', value: formatNumber(monthly.filter((v) => v.purpose === 'Admission Enquiry').length), icon: 'user-plus', tone: 'success' },
        ],
        legend: h('div', { className: 'adm-legend t-xs t-muted' },
          [['Admission meeting', 'var(--brand-500)'], ['On campus now', 'var(--warning-500)'], ['Completed', 'var(--info-500)']]
            .map(([label, colour]) => h('span', { className: 'row', style: { gap: 'var(--sp-1)' } },
              h('span', { className: 'dot', style: { background: colour } }), label))),
        onSelectEvent: (ev) => {
          const v = ev.raw;
          if (!v) return;
          Drawer({
            title: v.name, subtitle: `${formatDate(v.date)} ${v.inTime} · ${v.whomToMeet}`, size: 'md',
            body: h('div', { className: 'stack-3' },
              h('div', { className: 'row-3' }, Avatar(v.name, { size: 'lg' }),
                h('div', { className: 'stack-1' }, Badge(v.status), h('span', { className: 't-sm t-muted' }, v.phone))),
              DescriptionList([
                ['Purpose', v.purpose], ['Meeting', v.whomToMeet],
                ['Related student', v.relatedStudent || '—'], ['Badge', v.badgeNo],
                ['ID proof', `${v.idProof} · ${v.idNumberMasked}`], ['Vehicle', v.vehicleNo || '—'],
                ['In time', v.inTime], ['Out time', v.outTime || 'Still on campus'],
              ], { cols: 2 })),
            actions: (close) => frag(
              Button('Close', { variant: 'ghost', onClick: close }),
              Button('Reschedule', { variant: 'secondary', icon: 'calendar', onClick: mockAction('Reschedule appointment') }),
              Button('Check in', { variant: 'primary', icon: 'log-in', onClick: mockAction('Check in visitor') })),
          });
        },
        onSelectDate: (d) => notify({ title: formatDate(d, 'long'), text: `${monthly.filter((v) => v.date === d).length} appointments booked.`, tone: 'info' }),
        sidebar: [
          SectionCard({ title: 'Today’s diary', icon: 'clock', subtitle: formatDate(DEMO_TODAY, 'long') },
            today.length ? Timeline(sortBy(today, 'inTime').map((v) => ({
              title: `${v.inTime} · ${v.name}`,
              meta: `${v.whomToMeet} · ${v.purpose}`,
              text: v.relatedStudent ? `Regarding ${v.relatedStudent}` : null,
              icon: 'calendar-check', tone: v.status === 'Inside' ? 'warning' : 'success',
            }))) : EmptyState({ icon: 'calendar', title: 'Diary is clear', text: 'No appointments booked for today.' })),
          SectionCard({ title: 'Busiest hosts', icon: 'users' },
            RankList(countBy(monthly, 'whomToMeet').slice(0, 6).map((r) => ({ name: r.key, meta: 'This month', value: `${r.value}` })))),
          SectionCard({ title: 'Purpose mix', className: 'chart-card' },
            donutChart({ data: countBy(monthly, 'purpose').slice(0, 6).map((p) => ({ key: p.key, value: p.value })), height: 220, centerLabel: 'Purpose', title: 'Appointments by purpose' })),
        ],
      }));
    },
  },

  /* ----------------------------------------------- frontoffice/complaints */
  'frontoffice/complaints': {
    title: 'Complaints Intake',
    subtitle: 'Log grievances walked in or phoned in to reception',
    section: 'frontoffice',
    render(mount, ctx) {
      ensureStyles();
      const all = complaintsFor(ctx).filter((c) => c.raisedBy === 'Parent' || c.raisedBy === 'Student');
      const openOnes = all.filter((c) => c.status === 'Open' || c.status === 'In Progress');

      const intake = () => Modal({
        title: 'Log a complaint at reception', size: 'lg', icon: 'alert-circle', tone: 'warning',
        body: h('div', { className: 'stack-4' },
          Callout({ tone: 'info', icon: 'info', title: 'Front-desk intake' },
            'Capture the complaint verbatim. The SLA clock starts the moment this ticket is saved.'),
          FormGrid({ cols: 2 },
            Field({ label: 'Raised by', required: true }, Select({ options: ['Parent', 'Student', 'Staff', 'Visitor'], onChange: () => {} })),
            Field({ label: 'Name', required: true }, Input({ placeholder: 'Complainant name', onInput: () => {} })),
            Field({ label: 'Phone', required: true }, Input({ type: 'tel', placeholder: '+91 98xxxxxxxx', onInput: () => {} })),
            Field({ label: 'Related student' }, Combobox({ options: db.students.slice(0, 300).map((s) => ({ value: s.id, label: `${s.name} · ${s.className}` })), placeholder: 'Search student…', onChange: () => {} })),
            Field({ label: 'Category', required: true }, Select({ options: db.complaintCategories.map((c) => c.name), onChange: () => {} })),
            Field({ label: 'Priority', required: true }, Select({ options: ['Low', 'Medium', 'High', 'Critical'], value: 'Medium', onChange: () => {} })),
            Field({ label: 'Subject', required: true, className: 'col-span-full' }, Input({ placeholder: 'One-line summary', onInput: () => {} })),
            Field({ label: 'Description', required: true, className: 'col-span-full' }, Textarea({ rows: 4, placeholder: 'What exactly happened?' })))),
        actions: (close) => frag(
          Button('Cancel', { variant: 'secondary', onClick: close }),
          Button('Create ticket', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Ticket created', text: 'The owning department has been notified.', tone: 'success' }); } })),
      });

      mount.appendChild(listPage({
        title: 'Complaints intake',
        subtitle: `${formatNumber(all.length)} tickets raised by parents and students · ${formatNumber(openOnes.length)} still open`,
        route: 'frontoffice/complaints',
        actions: pageActions(
          Button('All complaints', { variant: 'secondary', icon: 'list', route: 'complaints/all' }),
          Button('Log complaint', { variant: 'primary', icon: 'plus', onClick: intake })),
        kpis: [
          { label: 'Desk tickets', value: formatNumber(all.length), icon: 'alert-circle', tone: 'brand' },
          { label: 'Open', value: formatNumber(openOnes.length), icon: 'inbox', tone: 'warning' },
          { label: 'SLA breached', value: formatNumber(all.filter((c) => c.slaBreached).length), icon: 'timer', tone: 'danger' },
          { label: 'Resolved', value: formatNumber(all.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length), icon: 'check-circle', tone: 'success' },
        ],
        chart: barChart({
          horizontal: true,
          categories: countBy(all, 'category').map((c) => c.key),
          series: [{ name: 'Tickets', values: countBy(all, 'category').map((c) => c.value) }],
          height: 260, showValues: true, title: 'Desk complaints by category',
        }),
        chartTitle: 'What parents complain about at the desk',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Ticket, subject or name…', width: 280 },
          { id: 'category', label: 'Category', options: db.complaintCategories.map((c) => c.name) },
          { id: 'priority', label: 'Priority', options: ['Low', 'Medium', 'High', 'Critical'] },
          { id: 'status', label: 'Status', options: ['Open', 'In Progress', 'Escalated', 'Resolved', 'Closed'] },
        ],
        onFilter: filterHandler(all, {
          q: matchText('ticketNo', 'subject', 'raisedByName'),
          category: matchEq('category'), priority: matchEq('priority'), status: matchEq('status'),
        }),
        columns: [
          { key: 'ticketNo', label: 'Ticket', sticky: true, width: 130, render: (r) => h('code', null, r.ticketNo) },
          { key: 'subject', label: 'Subject', width: 260, render: (r) => h('span', { className: 't-sm t-medium t-clamp-2' }, r.subject) },
          { key: 'raisedByName', label: 'Raised by', width: 200, render: (r) => Identity(r.raisedByName, r.raisedBy) },
          { key: 'category', label: 'Category', width: 150, filter: true },
          { key: 'priority', label: 'Priority', width: 110, filter: true, render: (r) => priorityBadge(r.priority) },
          { key: 'createdAt', label: 'Raised', width: 120, render: (r) => formatDate(r.createdAt) },
          { key: 'sla', label: 'SLA', width: 150, sortable: false, render: (r) => slaCell(r) },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: sortBy(all, 'createdAt', 'desc'),
        selectable: true,
        exportName: 'front-office-complaints',
        searchKeys: ['ticketNo', 'subject', 'raisedByName', 'category'],
        bulkActions: [{ label: 'Assign owner', icon: 'user-check', onClick: (sel) => notify({ title: `${sel.length} tickets assigned`, tone: 'success' }) }],
        rowActions: (row) => [
          { label: 'Open ticket', icon: 'eye', onClick: () => openComplaintDrawer(row) },
          { label: 'Call complainant', icon: 'phone', onClick: mockAction('Dial complainant') },
        ],
        onRowClick: (row) => openComplaintDrawer(row),
        emptyState: EmptyState({ icon: 'check-circle', title: 'No desk complaints', text: 'Nothing has been raised at the reception counter.' }),
      }));
    },
  },

  /* ----------------------------------------------- frontoffice/lost-found */
  'frontoffice/lost-found': {
    title: 'Lost & Found',
    subtitle: 'Items lost, found, claimed and disposed',
    section: 'frontoffice',
    render(mount, ctx) {
      ensureStyles();
      const all = scope(db.lostFound, ctx);
      let activeTab = 'all';
      const tabRows = {
        all,
        found: all.filter((l) => l.type === 'Found'),
        lost: all.filter((l) => l.type === 'Lost'),
        unclaimed: all.filter((l) => l.status === 'Unclaimed'),
      };

      const logItem = () => Modal({
        title: 'Log a lost or found item', size: 'md', icon: 'search',
        body: h('div', { className: 'stack-4' },
          FormGrid({ cols: 2 },
            Field({ label: 'Type', required: true }, Select({ options: ['Found', 'Lost'], onChange: () => {} })),
            Field({ label: 'Item', required: true }, Input({ placeholder: 'e.g. Water bottle', onInput: () => {} })),
            Field({ label: 'Location', required: true }, Select({ options: ['Playground', 'Library', 'Cafeteria', 'Classroom', 'Washroom Block A', 'Bus Route'], onChange: () => {} })),
            Field({ label: 'Date', required: true }, DatePicker({ value: DEMO_TODAY, width: '100%', onChange: () => {} })),
            Field({ label: 'Reported by', className: 'col-span-full' }, Combobox({ options: db.students.slice(0, 200).map((s) => ({ value: s.id, label: `${s.name} · ${s.className}` })), placeholder: 'Search student…', onChange: () => {} })),
            Field({ label: 'Description', className: 'col-span-full' }, Textarea({ rows: 3, placeholder: 'Colour, brand, distinguishing marks' })))),
        actions: (close) => frag(
          Button('Cancel', { variant: 'secondary', onClick: close }),
          Button('Add to register', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Item logged', text: 'Added to the lost & found register.', tone: 'success' }); } })),
      });

      const node = listPage({
        title: 'Lost & found',
        subtitle: `${formatNumber(all.length)} items in the register · ${formatNumber(tabRows.unclaimed.length)} still unclaimed`,
        route: 'frontoffice/lost-found',
        actions: pageActions(
          Button('Print notice', { variant: 'secondary', icon: 'print', onClick: mockAction('Print unclaimed notice') }),
          Button('Log item', { variant: 'primary', icon: 'plus', onClick: logItem })),
        kpis: [
          { label: 'Items logged', value: formatNumber(all.length), icon: 'search', tone: 'brand' },
          { label: 'Found', value: formatNumber(tabRows.found.length), icon: 'package', tone: 'info' },
          { label: 'Unclaimed', value: formatNumber(tabRows.unclaimed.length), icon: 'clock', tone: 'warning' },
          { label: 'Claimed', value: formatNumber(all.filter((l) => l.status === 'Claimed').length), icon: 'check-circle', tone: 'success' },
        ],
        tabs: [
          { id: 'all', label: 'All', count: all.length },
          { id: 'found', label: 'Found', count: tabRows.found.length },
          { id: 'lost', label: 'Lost', count: tabRows.lost.length },
          { id: 'unclaimed', label: 'Unclaimed', count: tabRows.unclaimed.length },
        ],
        activeTab,
        onTabChange: (id) => { activeTab = id; node.table.refresh(tabRows[id] || all); },
        chart: h('div', { className: 'grid grid-2' },
          barChart({ horizontal: true, categories: countBy(all, 'item').slice(0, 8).map((i) => i.key), series: [{ name: 'Items', values: countBy(all, 'item').slice(0, 8).map((i) => i.value) }], height: 240, showValues: true, title: 'Most commonly logged items' }),
          donutChart({ data: countBy(all, 'location').map((l) => ({ key: l.key, value: l.value })), height: 240, centerLabel: 'Location', title: 'Where items turn up' })),
        chartTitle: 'Lost & found patterns',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Item, location or reporter…', width: 280 },
          { id: 'type', label: 'Type', options: ['Found', 'Lost'] },
          { id: 'location', label: 'Location', options: [...new Set(all.map((l) => l.location))] },
          { id: 'status', label: 'Status', options: ['Unclaimed', 'Claimed', 'Disposed'] },
        ],
        onFilter: (id, v, allV, table) => table.refresh(applyFilters(tabRows[activeTab] || all, allV, {
          q: matchText('item', 'location', 'reportedBy', 'description'),
          type: matchEq('type'), location: matchEq('location'), status: matchEq('status'),
        })),
        columns: [
          { key: 'item', label: 'Item', sticky: true, width: 190, render: (r) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } },
            h('span', { style: { color: 'var(--text-muted)' }, html: icon('package', 15) }),
            h('span', { className: 't-medium' }, r.item)) },
          { key: 'type', label: 'Type', width: 100, filter: true, render: (r) => Badge(r.type, { tone: r.type === 'Found' ? 'success' : 'warning' }) },
          { key: 'date', label: 'Date', width: 120, render: (r) => formatDate(r.date) },
          { key: 'location', label: 'Location', width: 170, filter: true },
          { key: 'reportedBy', label: 'Reported by', width: 190 },
          { key: 'description', label: 'Description', render: (r) => h('span', { className: 't-sm t-clamp-2' }, r.description) },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status, { tone: r.status === 'Claimed' ? 'success' : r.status === 'Disposed' ? 'neutral' : 'warning' }) },
        ],
        rows: sortBy(all, 'date', 'desc'),
        selectable: true,
        exportName: 'lost-and-found',
        searchKeys: ['item', 'location', 'reportedBy'],
        bulkActions: [
          { label: 'Mark claimed', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} items marked claimed`, tone: 'success' }) },
          { label: 'Dispose', icon: 'trash', tone: 'danger', onClick: (sel) => ConfirmDialog({
            title: `Dispose ${sel.length} items?`, tone: 'danger', confirmLabel: 'Dispose',
            text: 'Unclaimed items older than 90 days are donated to the school charity drive.',
          }).then((ok) => ok && notify({ title: `${sel.length} items disposed`, tone: 'warning' })) },
        ],
        rowActions: (row) => [
          { label: 'Mark claimed', icon: 'check', onClick: mockAction('Mark claimed') },
          { label: 'Announce on portal', icon: 'megaphone', onClick: mockAction('Announce item') },
        ],
        onRowClick: (row) => Drawer({
          title: row.item, subtitle: `${row.type} · ${formatDate(row.date)} · ${row.location}`, size: 'md',
          body: h('div', { className: 'stack-3' },
            h('div', { className: 'row-3' }, Badge(row.status), Badge(row.type, { tone: row.type === 'Found' ? 'success' : 'warning' })),
            DescriptionList([
              ['Item', row.item], ['Type', row.type], ['Location', row.location],
              ['Date', formatDate(row.date)], ['Reported by', row.reportedBy], ['Campus', campusName(row.campusId)],
            ], { cols: 2 }),
            SectionCard({ title: 'Description', icon: 'file-text' }, h('div', { className: 't-sm t-secondary' }, row.description))),
          actions: (close) => frag(
            Button('Close', { variant: 'ghost', onClick: close }),
            Button('Mark claimed', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Item claimed', text: row.item, tone: 'success' }); } })),
        }),
        emptyState: EmptyState({ icon: 'search', title: 'Register is empty', text: 'Log the first lost or found item at the desk.' }),
      });
      mount.appendChild(node);
    },
  },

  /* ------------------------------------------- frontoffice/student-search */
  'frontoffice/student-search': {
    title: 'Student Search',
    subtitle: 'Find any student instantly from the reception counter',
    section: 'frontoffice',
    render(mount, ctx) {
      ensureStyles();
      const pool = scope(db.students, ctx);
      let results = [];
      let term = (ctx.query && ctx.query.q) || '';

      const resultHost = h('div');
      const countHost = h('div', { className: 't-sm t-muted' });

      const quickCard = (s) => Card({
        className: 'card-interactive', pad: true,
        onClick: () => openStudent(s),
      }, h('div', { className: 'stack-2' },
        h('div', { className: 'row-3' },
          Avatar(s.name, { size: 'md' }),
          h('div', { className: 'flex-1 min-0' },
            h('div', { className: 't-medium t-truncate' }, s.name),
            h('div', { className: 't-xs t-muted' }, `${s.admissionNo} · ${s.className}-${s.section}`))),
        h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-1)' } },
          Badge(s.status), Badge(s.feeStatus),
          s.transportOpted && Badge('Transport', { tone: 'info' }),
          s.hostelOpted && Badge('Hostel', { tone: 'neutral' })),
        h('div', { className: 't-xs t-muted t-num' }, `${s.guardianName} · ${s.phone}`)));

      function openStudent(s) {
        /* db.hostelAllocations is what stamps hostelId/roomNo onto a student.
           Reading s.roomNo before that collection exists yields null, so touch
           it first — same idiom as db.js's own occupancy reconciliation. */
        void db.hostelAllocations.length;
        Drawer({
          title: s.name,
          subtitle: `${s.admissionNo} · ${s.className}-${s.section} · ${s.house} House`,
          size: 'lg',
          body: h('div', { className: 'stack-3' },
            h('div', { className: 'row-3 row-wrap' },
              Avatar(s.name, { size: 'xl' }),
              h('div', { className: 'flex-1 stack-2' },
                h('div', { className: 'row-3 row-wrap' }, Badge(s.status), Badge(s.feeStatus), Badge(`${s.attendancePct}% attendance`, { tone: s.attendancePct >= 75 ? 'success' : 'danger' })),
                h('div', { className: 't-sm t-muted' }, `${campusName(s.campusId)} · admitted ${formatDate(s.admissionDate)}`))),
            SectionCard({ title: 'Contact', icon: 'phone' },
              DescriptionList([
                ['Guardian', `${s.guardianName} (${s.guardianRelation})`],
                ['Phone', h('a', { className: 't-link', href: `tel:${s.phone}` }, s.phone)],
                ['Emergency', s.emergencyContact], ['Email', s.email],
                ['Father', s.fatherName], ['Mother', s.motherName],
                ['Address', `${s.address.line1}, ${s.address.city} ${s.address.pincode}`],
              ], { cols: 2 })),
            SectionCard({ title: 'At a glance', icon: 'activity' },
              DescriptionList([
                ['Class', `${s.className} · Section ${s.section}`], ['Roll no', s.rollNo],
                ['House', s.house], ['Blood group', s.bloodGroup],
                ['Attendance', `${s.attendancePct}% (${s.presentDays}/${s.totalDays})`],
                ['Fee due', formatCurrency(s.feeDue)],
                ['Transport', s.transportOpted ? `Route ${s.routeId}` : 'Not opted'],
                ['Hostel', s.hostelOpted ? `Room ${s.roomNo || '—'}` : 'Day scholar'],
              ], { cols: 2 })),
            Callout({ tone: 'info', icon: 'info', title: 'Front-desk protocol' },
              'Release a student only against a gate pass authorised by the class teacher and verified at the gate.')),
          actions: (close) => frag(
            Button('Close', { variant: 'ghost', onClick: close }),
            Button('Call guardian', { variant: 'secondary', icon: 'phone', onClick: mockAction('Dial guardian') }),
            Button('Open 360 profile', { variant: 'primary', icon: 'id-card', onClick: () => { close(); navigate(`students/profile/${s.id}`); } })),
        });
      }

      function runSearch(value) {
        term = value;
        const t = String(value || '').trim().toLowerCase();
        results = t.length < 2 ? [] : pool.filter((s) =>
          s.name.toLowerCase().includes(t) || s.admissionNo.toLowerCase().includes(t)
          || String(s.phone).includes(t) || s.className.toLowerCase().includes(t)
          || (s.guardianName || '').toLowerCase().includes(t)).slice(0, 60);
        paint();
      }

      function paint() {
        resultHost.innerHTML = '';
        countHost.textContent = term.trim().length < 2
          ? `Search across ${formatNumber(pool.length)} enrolled students`
          : `${results.length} match${results.length === 1 ? '' : 'es'} for “${term.trim()}”`;
        if (term.trim().length < 2) {
          resultHost.appendChild(Card({ pad: true }, EmptyState({
            icon: 'search', title: 'Start typing to find a student',
            text: 'Search by name, admission number, class, guardian name or phone number. Two characters is enough.',
          })));
          resultHost.appendChild(SectionCard({ title: 'Recently admitted', icon: 'user-plus', subtitle: 'Handy shortcuts for the desk' },
            h('div', { className: 'adm-result-grid' }, sortBy(pool, 'admissionDate', 'desc').slice(0, 8).map(quickCard))));
          return;
        }
        if (!results.length) {
          resultHost.appendChild(Card({ pad: true }, EmptyState({
            icon: 'user-x', title: 'No student matches that search',
            text: 'Check the spelling, or try the admission number instead of the name.',
            action: Button('Clear search', { variant: 'secondary', icon: 'x', onClick: () => { searchBox.value = ''; runSearch(''); } }),
          })));
          return;
        }
        resultHost.appendChild(h('div', { className: 'adm-result-grid' }, results.map(quickCard)));
        resultHost.appendChild(SectionCard({ title: 'Detailed results', subtitle: 'Same matches as a table', flush: true },
          DataTable({
            columns: [
              { key: 'name', label: 'Student', sticky: true, width: 240, render: (r) => Identity(r.name, `${r.admissionNo} · ${r.className}-${r.section}`) },
              { key: 'className', label: 'Class', width: 110, filter: true },
              { key: 'guardianName', label: 'Guardian', width: 190 },
              { key: 'phone', label: 'Phone', width: 150, render: (r) => h('span', { className: 't-num t-sm' }, r.phone) },
              { key: 'attendancePct', label: 'Attendance', width: 120, align: 'right', numeric: true, render: (r) => `${r.attendancePct}%` },
              { key: 'feeDue', label: 'Fee due', width: 130, align: 'right', numeric: true, render: (r) => formatCurrency(r.feeDue) },
              { key: 'status', label: 'Status', width: 110, render: (r) => Badge(r.status) },
            ],
            rows: results,
            onRowClick: openStudent,
            paginate: results.length > 25,
            exportName: 'student-search',
            maxHeight: 'none',
          })));
      }

      const searchBox = h('input', {
        className: 'input', type: 'search', value: term,
        placeholder: 'Name, admission number, class, guardian or phone…',
        attrs: { 'aria-label': 'Search students', autofocus: true },
        onInput: (ev) => runSearch(ev.target.value),
      });

      mount.appendChild(page({
        title: 'Student search',
        subtitle: 'Reception lookup · results open a quick-view card with guardian contact details',
        route: 'frontoffice/student-search',
        actions: pageActions(
          Button('Gate pass', { variant: 'secondary', icon: 'log-out', route: 'security/gate-pass-student' }),
          Button('All students', { variant: 'primary', icon: 'users', route: 'students/all' })),
        children: [
          Card({ pad: true }, h('div', { className: 'stack-2' },
            h('div', { className: 'row-3' },
              h('span', { style: { color: 'var(--text-muted)' }, html: icon('search', 18) }),
              h('div', { className: 'flex-1' }, searchBox)),
            countHost)),
          resultHost,
        ],
      }));
      paint();
    },
  },

  /* ---------------------------------------------------- complaints/raise */
  'complaints/raise': {
    title: 'Raise a Complaint',
    subtitle: 'Log a grievance and track it to resolution',
    section: 'complaints',
    render(mount, ctx) {
      ensureStyles();
      const cats = db.complaintCategories;
      const role = (ctx.state && ctx.state.role) || store.get('role');
      const raiserDefault = role === 'parent' ? 'Parent' : role === 'student' ? 'Student' : 'Staff';

      mount.appendChild(formPage({
        title: 'Raise a complaint',
        subtitle: 'Tickets are acknowledged immediately and routed to the owning department',
        route: 'complaints/raise',
        mode: 'page',
        submitLabel: 'Submit complaint',
        cancelLabel: 'Cancel',
        values: { raisedBy: raiserDefault, priority: 'Medium', campusId: campusOf(ctx) || db.campuses[0].id },
        sections: [
          {
            title: 'Who is raising this?', description: 'We use this to route the ticket and send updates.', cols: 2,
            fields: [
              { id: 'raisedBy', label: 'Raised by', type: 'select', required: true, options: ['Parent', 'Student', 'Staff', 'Visitor'] },
              { id: 'name', label: 'Your name', required: true, placeholder: 'Full name' },
              { id: 'phone', label: 'Mobile', type: 'tel', required: true, validate: validators.phone, placeholder: '+91 98xxxxxxxx' },
              { id: 'email', label: 'Email', type: 'email', validate: validators.email },
              { id: 'campusId', label: 'Campus', type: 'select', required: true, options: campusOptions() },
              { id: 'relatedStudent', label: 'Related student', type: 'combobox', placeholder: 'Search student…',
                options: db.students.slice(0, 300).map((s) => ({ value: s.id, label: `${s.name} · ${s.className}-${s.section}` })) },
            ],
          },
          {
            title: 'What is the issue?', description: 'Be as specific as possible — it speeds up resolution.', cols: 2,
            fields: [
              { id: 'category', label: 'Category', type: 'select', required: true, options: cats.map((c) => c.name),
                hint: 'The category decides the owning desk and the SLA.' },
              { id: 'priority', label: 'Priority', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
              { id: 'subject', label: 'Subject', required: true, span: 'full', placeholder: 'One-line summary of the problem' },
              { id: 'description', label: 'Description', type: 'textarea', required: true, span: 'full', rows: 5,
                placeholder: 'What happened, when, and who was involved?' },
              { id: 'occurredOn', label: 'When did it happen?', type: 'date', value: DEMO_TODAY },
              { id: 'location', label: 'Where?', placeholder: 'e.g. Bus route R12, Block B corridor' },
              { id: 'attachments', label: 'Attachments', type: 'file', span: 'full', hint: 'Photos, receipts or documents that support the complaint' },
              { id: 'anonymous', label: 'Anonymous', type: 'checkbox', span: 'full',
                checkboxLabel: 'Hide my name from the assigned staff member (leadership can still see it)' },
            ],
          },
          {
            title: 'How should we reach you?', cols: 2,
            fields: [
              { id: 'channel', label: 'Preferred update channel', type: 'select', options: ['SMS', 'Email', 'WhatsApp', 'Phone call'], value: 'SMS' },
              { id: 'callWindow', label: 'Best time to call', type: 'select', options: ['09:00 – 12:00', '12:00 – 15:00', '15:00 – 18:00'] },
              { id: 'consent', label: 'Consent', type: 'switch', span: 'full', value: true,
                switchLabel: 'I confirm the information above is accurate',
                description: 'False complaints may be closed without action.' },
            ],
          },
        ],
        sidebar: [
          Callout({ tone: 'brand', icon: 'timer', title: 'Response commitment' },
            'Critical issues are acknowledged within 4 hours, high within 24 hours and everything else within 48 hours.'),
          SectionCard({ title: 'Category SLAs', icon: 'timer' },
            DataTable({
              columns: [
                { key: 'name', label: 'Category', width: 150 },
                { key: 'owner', label: 'Owner desk' },
                { key: 'slaHours', label: 'SLA', width: 80, align: 'right', numeric: true, render: (r) => `${r.slaHours}h` },
              ],
              rows: cats, paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
            })),
          SectionCard({ title: 'What happens next', icon: 'workflow' },
            Stepper([
              { label: 'Submitted', description: 'You receive a ticket number' },
              { label: 'Acknowledged', description: 'Front office confirms receipt' },
              { label: 'Assigned', description: 'Routed to the owning desk' },
              { label: 'Resolved', description: 'You rate the resolution' },
            ], { current: 0 })),
        ],
        onSubmit: (values) => {
          notify({
            title: 'Complaint submitted',
            text: `Ticket TKT/26/${String(Math.floor(seedOf(values.subject || 'x') * 9000) + 1000)} created under ${values.category || 'General'}.`,
            tone: 'success',
          });
          navigate('complaints/mine');
        },
        onCancel: () => navigate('complaints/mine'),
      }));
    },
  },

  /* ------------------------------------------------------ complaints/all */
  'complaints/all': {
    title: 'All Complaints',
    subtitle: 'Every ticket across categories, desks and campuses',
    section: 'complaints',
    render(mount, ctx) {
      ensureStyles();
      const all = complaintsFor(ctx);
      let activeTab = 'all';
      const tabRows = {
        all,
        open: all.filter((c) => c.status === 'Open'),
        progress: all.filter((c) => c.status === 'In Progress'),
        escalated: all.filter((c) => c.status === 'Escalated'),
        breached: all.filter((c) => c.slaBreached),
        resolved: all.filter((c) => c.status === 'Resolved' || c.status === 'Closed'),
      };

      const node = listPage({
        title: 'All complaints',
        subtitle: `${formatNumber(all.length)} tickets · ${formatNumber(tabRows.breached.length)} past SLA · ${campusLabel(ctx)}`,
        route: 'complaints/all',
        actions: pageActions(
          MenuButton([
            { label: 'Export register', icon: 'download', onClick: () => {
              download('complaints.csv', toCsv(all, [
                { key: 'ticketNo', label: 'Ticket' }, { key: 'subject', label: 'Subject' },
                { key: 'category', label: 'Category' }, { key: 'priority', label: 'Priority' },
                { key: 'status', label: 'Status' }, { key: 'assignedToName', label: 'Owner' },
              ]), 'text/csv;charset=utf-8');
              notify({ title: 'Complaint register exported', tone: 'success' });
            } },
            { label: 'SLA configuration', icon: 'timer', route: 'complaints/sla' },
            { label: 'Categories', icon: 'tag', route: 'complaints/categories' },
          ], { label: 'More actions' }),
          Button('Reports', { variant: 'secondary', icon: 'chart-bar', route: 'complaints/reports' }),
          Button('Raise complaint', { variant: 'primary', icon: 'plus', route: 'complaints/raise' })),
        kpis: [
          { label: 'Total tickets', value: formatNumber(all.length), icon: 'alert-circle', tone: 'brand', trend: analytics.sparks.complaints },
          { label: 'Open', value: formatNumber(tabRows.open.length + tabRows.progress.length), icon: 'inbox', tone: 'warning' },
          { label: 'SLA breached', value: formatNumber(tabRows.breached.length), icon: 'timer', tone: 'danger' },
          { label: 'Resolved', value: formatNumber(tabRows.resolved.length), icon: 'check-circle', tone: 'success' },
          { label: 'Escalated', value: formatNumber(tabRows.escalated.length), icon: 'trending-up', tone: 'danger' },
          { label: 'Avg satisfaction', value: (() => {
            const rated = all.filter((c) => c.satisfaction);
            return rated.length ? `${(rated.reduce((s, c) => s + c.satisfaction, 0) / rated.length).toFixed(1)}/5` : '—';
          })(), icon: 'star', tone: 'info' },
        ],
        tabs: [
          { id: 'all', label: 'All', count: all.length },
          { id: 'open', label: 'Open', count: tabRows.open.length },
          { id: 'progress', label: 'In progress', count: tabRows.progress.length },
          { id: 'escalated', label: 'Escalated', count: tabRows.escalated.length },
          { id: 'breached', label: 'SLA breached', count: tabRows.breached.length },
          { id: 'resolved', label: 'Resolved', count: tabRows.resolved.length },
        ],
        activeTab,
        onTabChange: (id) => { activeTab = id; node.table.refresh(tabRows[id] || all); },
        chart: h('div', { className: 'grid grid-2' },
          comboChart({
            categories: analytics.complaintTrend.map((r) => r.month),
            bars: [{ name: 'Raised', values: analytics.complaintTrend.map((r) => r.raised) },
              { name: 'Resolved', values: analytics.complaintTrend.map((r) => r.resolved) }],
            line: { name: 'SLA breaches', values: analytics.complaintTrend.map((r) => r.breached) },
            height: 240, title: 'Complaint volume and breaches',
          }),
          barChart({
            horizontal: true,
            categories: countBy(all, 'category').map((c) => c.key),
            series: [{ name: 'Tickets', values: countBy(all, 'category').map((c) => c.value) }],
            height: 240, showValues: true, title: 'Tickets by category',
          })),
        chartTitle: 'Complaint load over time and by category',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Ticket, subject or complainant…', width: 280 },
          { id: 'category', label: 'Category', options: db.complaintCategories.map((c) => c.name) },
          { id: 'priority', label: 'Priority', options: ['Low', 'Medium', 'High', 'Critical'] },
          { id: 'status', label: 'Status', options: ['Open', 'In Progress', 'Escalated', 'Resolved', 'Closed'] },
          { id: 'department', label: 'Department', options: [...new Set(all.map((c) => c.department))] },
          { id: 'raisedBy', label: 'Raised by', options: ['Parent', 'Student', 'Staff'] },
        ],
        onFilter: (id, v, allV, table) => table.refresh(applyFilters(tabRows[activeTab] || all, allV, {
          q: matchText('ticketNo', 'subject', 'raisedByName', 'assignedToName'),
          category: matchEq('category'), priority: matchEq('priority'),
          status: matchEq('status'), department: matchEq('department'), raisedBy: matchEq('raisedBy'),
        })),
        columns: [
          { key: 'ticketNo', label: 'Ticket', sticky: true, width: 130, render: (r) => h('code', null, r.ticketNo) },
          { key: 'subject', label: 'Subject', width: 260, render: (r) => h('div', { className: 'stack-1' },
            h('span', { className: 't-sm t-medium t-clamp-2' }, r.subject),
            h('span', { className: 't-2xs t-muted' }, `${r.category} · ${r.department}`)) },
          { key: 'raisedByName', label: 'Raised by', width: 190, render: (r) => Identity(r.raisedByName, r.raisedBy) },
          { key: 'priority', label: 'Priority', width: 110, filter: true, render: (r) => priorityBadge(r.priority) },
          { key: 'assignedToName', label: 'Owner', width: 180, filter: true },
          { key: 'createdAt', label: 'Raised', width: 120, render: (r) => formatDate(r.createdAt) },
          { key: 'ageHours', label: 'Age', width: 90, align: 'right', numeric: true, render: (r) => `${Math.round(r.ageHours / 24)}d` },
          { key: 'sla', label: 'SLA', width: 160, sortable: false, render: (r) => slaCell(r) },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
          { key: 'satisfaction', label: 'Rating', width: 120, align: 'right', numeric: true,
            render: (r) => (r.satisfaction ? Rating(r.satisfaction) : '—') },
        ],
        rows: sortBy(all, 'createdAt', 'desc'),
        selectable: true,
        pageSize: 50,
        exportName: 'complaints',
        searchKeys: ['ticketNo', 'subject', 'raisedByName', 'category', 'assignedToName'],
        bulkActions: [
          { label: 'Assign owner', icon: 'user-check', onClick: (sel) => notify({ title: `${sel.length} tickets reassigned`, tone: 'success' }) },
          { label: 'Escalate', icon: 'trending-up', onClick: (sel) => notify({ title: `${sel.length} tickets escalated`, tone: 'warning' }) },
          { label: 'Close', icon: 'check-circle', onClick: (sel) => ConfirmDialog({
            title: `Close ${sel.length} tickets?`, tone: 'brand', confirmLabel: 'Close tickets',
            text: 'Complainants will be asked to rate the resolution.',
          }).then((ok) => ok && notify({ title: `${sel.length} tickets closed`, tone: 'success' })) },
        ],
        rowActions: (row) => [
          { label: 'Open ticket', icon: 'eye', onClick: () => openComplaintDrawer(row) },
          { label: 'Escalate', icon: 'trending-up', route: 'complaints/escalations' },
          { label: 'Copy ticket no', icon: 'copy', onClick: () => copyToClipboard(row.ticketNo, 'Ticket number copied') },
        ],
        onRowClick: (row) => openComplaintDrawer(row, { onChange: () => node.table.refresh(tabRows[activeTab] || all) }),
        emptyState: EmptyState({ icon: 'check-circle', title: 'No complaints', text: 'Nothing has been raised for this filter — that is a good sign.' }),
      });
      mount.appendChild(node);
    },
  },

  /* ----------------------------------------------------- complaints/mine */
  'complaints/mine': {
    title: 'My Complaints',
    subtitle: 'Tickets you have raised and their current state',
    section: 'complaints',
    render(mount, ctx) {
      ensureStyles();
      const role = (ctx.state && ctx.state.role) || store.get('role');
      const raiser = role === 'parent' ? 'Parent' : role === 'student' ? 'Student' : 'Staff';
      const mine = complaintsFor(ctx).filter((c) => c.raisedBy === raiser).slice(0, 24);

      if (!mine.length) {
        mount.appendChild(page({
          title: 'My complaints',
          subtitle: 'Everything you have raised, newest first',
          route: 'complaints/mine',
          actions: pageActions(Button('Raise a complaint', { variant: 'primary', icon: 'plus', route: 'complaints/raise' })),
          children: Card({ pad: true }, EmptyState({
            icon: 'check-circle', title: 'You have not raised any complaints',
            text: 'If something is not right — transport, fees, facilities or academics — tell us and we will track it to closure.',
            action: Button('Raise a complaint', { variant: 'primary', icon: 'plus', route: 'complaints/raise' }),
          })),
        }));
        return;
      }

      const open = mine.filter((c) => c.status !== 'Resolved' && c.status !== 'Closed');
      const closedOnes = mine.filter((c) => c.resolvedAt);

      mount.appendChild(page({
        title: 'My complaints',
        subtitle: `${formatNumber(mine.length)} tickets raised · ${formatNumber(open.length)} still open`,
        route: 'complaints/mine',
        actions: pageActions(
          Button('Complaint categories', { variant: 'secondary', icon: 'tag', route: 'complaints/categories' }),
          Button('Raise a complaint', { variant: 'primary', icon: 'plus', route: 'complaints/raise' })),
        children: [
          kpiRow([
            { label: 'Raised', value: formatNumber(mine.length), icon: 'alert-circle', tone: 'brand' },
            { label: 'Open', value: formatNumber(open.length), icon: 'inbox', tone: 'warning' },
            { label: 'Resolved', value: formatNumber(mine.length - open.length), icon: 'check-circle', tone: 'success' },
            { label: 'Avg resolution', value: closedOnes.length
              ? `${Math.round(closedOnes.reduce((s, c) => s + daysBetween(c.createdAt, c.resolvedAt), 0) / closedOnes.length)} days`
              : '—', icon: 'timer', tone: 'info' },
          ]),
          h('div', { className: 'widget-grid' }, mine.map((c) => h('div', { className: 'span-6' },
            SectionCard({
              title: c.subject, subtitle: `${c.ticketNo} · ${c.category} · raised ${relativeTime(c.createdAt)}`,
              icon: 'alert-circle',
              actions: Button('Open', { variant: 'ghost', size: 'sm', icon: 'eye', onClick: () => openComplaintDrawer(c) }),
              footer: h('div', { className: 'row-3 row-wrap' },
                Badge(c.status), priorityBadge(c.priority),
                c.slaBreached && Badge('SLA breached', { tone: 'danger' }),
                h('span', { className: 'spacer' }),
                c.satisfaction ? Rating(c.satisfaction, { showValue: true })
                  : Button('Rate resolution', { variant: 'ghost', size: 'sm', icon: 'star', disabled: c.status !== 'Resolved', onClick: mockAction('Rate resolution') })),
            },
            h('div', { className: 'stack-2' },
              slaCell(c),
              Timeline(complaintTrail(c).slice(0, 4).map((t) => ({
                title: t.label, meta: [t.by, t.date && formatDate(t.date)].filter(Boolean).join(' · '),
                text: t.note, icon: t.state === 'approved' ? 'check' : t.state === 'rejected' ? 'alert-triangle' : 'clock',
                tone: t.state === 'approved' ? 'success' : t.state === 'rejected' ? 'danger' : 'warning',
              })))))))),
        ],
      }));
    },
  },

  /* ------------------------------------------------- complaints/assigned */
  'complaints/assigned': {
    title: 'Assigned to Me',
    subtitle: 'Your queue, ordered by how close each ticket is to breaching',
    section: 'complaints',
    render(mount, ctx) {
      ensureStyles();
      const all = complaintsFor(ctx);
      const owners = [...new Set(all.map((c) => c.assignedToName).filter(Boolean))];
      const me = owners[0] || null;
      const mine = all.filter((c) => c.assignedToName === me && c.status !== 'Closed');
      const sorted = sortBy(mine, (c) => -slaPct(c));

      if (!mine.length) {
        mount.appendChild(page({
          title: 'Assigned to me', route: 'complaints/assigned',
          children: Card({ pad: true }, EmptyState({
            icon: 'check-circle', title: 'Your queue is clear',
            text: 'No complaints are currently assigned to you. Newly routed tickets appear here immediately.',
            action: Button('Browse all complaints', { variant: 'primary', icon: 'list', route: 'complaints/all' }),
          })),
        }));
        return;
      }

      const node = listPage({
        title: 'Assigned to me',
        subtitle: `${formatNumber(mine.length)} tickets owned by ${me} · ${formatNumber(mine.filter((c) => c.slaBreached).length)} already past SLA`,
        route: 'complaints/assigned',
        actions: pageActions(
          Button('Escalations', { variant: 'secondary', icon: 'trending-up', route: 'complaints/escalations' }),
          Button('All complaints', { variant: 'primary', icon: 'list', route: 'complaints/all' })),
        kpis: [
          { label: 'In my queue', value: formatNumber(mine.length), icon: 'inbox', tone: 'brand' },
          { label: 'Breaching soon', value: formatNumber(mine.filter((c) => !c.slaBreached && slaPct(c) >= 75).length), icon: 'timer', tone: 'warning' },
          { label: 'Breached', value: formatNumber(mine.filter((c) => c.slaBreached).length), icon: 'alert-triangle', tone: 'danger' },
          { label: 'Critical', value: formatNumber(mine.filter((c) => c.priority === 'Critical').length), icon: 'siren', tone: 'danger' },
        ],
        chart: barChart({
          horizontal: true,
          categories: countBy(mine, 'category').map((c) => c.key),
          series: [{ name: 'My tickets', values: countBy(mine, 'category').map((c) => c.value) }],
          height: 220, showValues: true, title: 'My queue by category',
        }),
        chartTitle: 'What is on my desk',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Ticket or subject…', width: 280 },
          { id: 'priority', label: 'Priority', options: ['Low', 'Medium', 'High', 'Critical'] },
          { id: 'status', label: 'Status', options: ['Open', 'In Progress', 'Escalated', 'Resolved'] },
          { id: 'category', label: 'Category', options: [...new Set(mine.map((c) => c.category))] },
        ],
        onFilter: filterHandler(sorted, {
          q: matchText('ticketNo', 'subject', 'raisedByName'),
          priority: matchEq('priority'), status: matchEq('status'), category: matchEq('category'),
        }),
        columns: [
          { key: 'ticketNo', label: 'Ticket', sticky: true, width: 130, render: (r) => h('code', null, r.ticketNo) },
          { key: 'subject', label: 'Subject', width: 280, render: (r) => h('span', { className: 't-sm t-medium t-clamp-2' }, r.subject) },
          { key: 'raisedByName', label: 'Complainant', width: 190, render: (r) => Identity(r.raisedByName, r.raisedBy) },
          { key: 'category', label: 'Category', width: 150, filter: true },
          { key: 'priority', label: 'Priority', width: 110, filter: true, render: (r) => priorityBadge(r.priority) },
          { key: 'sla', label: 'SLA remaining', width: 170, sortable: false, render: (r) => slaCell(r) },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
          { key: 'act', label: '', width: 190, sortable: false, align: 'right',
            render: (r) => h('div', { className: 'row', style: { justifyContent: 'flex-end' } },
              Button('Resolve', { variant: 'success', size: 'sm', icon: 'check', onClick: (ev) => { ev.stopPropagation(); ConfirmDialog({
                title: 'Mark as resolved?', tone: 'brand', icon: 'check-circle', confirmLabel: 'Resolve',
                text: `${r.ticketNo} · the complainant will be asked to rate the resolution.`,
              }).then((ok) => ok && notify({ title: 'Ticket resolved', text: r.ticketNo, tone: 'success' })); } }),
              Button('Escalate', { variant: 'ghost', size: 'sm', icon: 'trending-up', onClick: (ev) => { ev.stopPropagation(); notify({ title: 'Escalated', text: r.ticketNo, tone: 'warning' }); } })) },
        ],
        rows: sorted,
        selectable: true,
        exportName: 'my-complaint-queue',
        searchKeys: ['ticketNo', 'subject', 'raisedByName'],
        bulkActions: [
          { label: 'Resolve selected', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} tickets resolved`, tone: 'success' }) },
          { label: 'Escalate selected', icon: 'trending-up', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} tickets escalated`, tone: 'warning' }) },
        ],
        rowActions: (row) => [
          { label: 'Open ticket', icon: 'eye', onClick: () => openComplaintDrawer(row) },
          { label: 'Reassign', icon: 'user-check', onClick: mockAction('Reassign ticket') },
        ],
        onRowClick: (row) => openComplaintDrawer(row, { onChange: () => node.table.refresh(sorted) }),
        emptyState: EmptyState({ icon: 'check-circle', title: 'Nothing matches', text: 'Adjust the filters to see the rest of your queue.' }),
      });
      mount.appendChild(node);
    },
  },

  /* ---------------------------------------------- complaints/escalations */
  'complaints/escalations': {
    title: 'Escalations',
    subtitle: 'Breached and escalated tickets needing leadership attention',
    section: 'complaints',
    render(mount, ctx) {
      ensureStyles();
      const all = complaintsFor(ctx);
      const rows = all.filter((c) => c.status === 'Escalated' || c.slaBreached);
      const byDept = countBy(rows, 'department');

      mount.appendChild(approvalQueuePage({
        title: 'Escalations',
        subtitle: `${formatNumber(rows.length)} tickets escalated or past SLA · leadership review`,
        route: 'complaints/escalations',
        kpis: [
          { label: 'Escalated', value: formatNumber(all.filter((c) => c.status === 'Escalated').length), icon: 'trending-up', tone: 'danger' },
          { label: 'SLA breached', value: formatNumber(all.filter((c) => c.slaBreached).length), icon: 'timer', tone: 'danger' },
          { label: 'Critical open', value: formatNumber(rows.filter((c) => c.priority === 'Critical').length), icon: 'siren', tone: 'warning' },
          { label: 'Departments involved', value: formatNumber(byDept.length), icon: 'building', tone: 'brand' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Ticket or subject…', width: 280 },
          { id: 'department', label: 'Department', options: byDept.map((d) => d.key) },
          { id: 'priority', label: 'Priority', options: ['Low', 'Medium', 'High', 'Critical'] },
        ],
        onFilter: filterHandler(rows, {
          q: matchText('ticketNo', 'subject', 'raisedByName'),
          department: matchEq('department'), priority: matchEq('priority'),
        }),
        columns: [
          { key: 'ticketNo', label: 'Ticket', sticky: true, width: 130, render: (r) => h('code', null, r.ticketNo) },
          { key: 'subject', label: 'Subject', width: 260, render: (r) => h('span', { className: 't-sm t-medium t-clamp-2' }, r.subject) },
          { key: 'department', label: 'Department', width: 170, filter: true },
          { key: 'assignedToName', label: 'Owner', width: 180 },
          { key: 'priority', label: 'Priority', width: 110, filter: true, render: (r) => priorityBadge(r.priority) },
          { key: 'ageHours', label: 'Age', width: 100, align: 'right', numeric: true, render: (r) => `${Math.round(r.ageHours / 24)}d` },
          { key: 'sla', label: 'SLA', width: 160, sortable: false, render: (r) => slaCell(r) },
        ],
        rows: sortBy(rows, (c) => -slaPct(c)),
        onApprove: (row) => notify({ title: 'Escalation accepted', text: `${row.ticketNo} moved to the principal’s desk.`, tone: 'success' }),
        onReject: (row) => notify({ title: 'Escalation returned', text: `${row.ticketNo} sent back to ${row.department}.`, tone: 'warning' }),
        detail: (row) => h('div', { className: 'stack-3' },
          h('div', { className: 'row-3 row-wrap' }, Badge(row.status), priorityBadge(row.priority),
            row.slaBreached && Badge('SLA breached', { tone: 'danger', icon: 'alert-triangle' })),
          SectionCard({ title: row.subject, subtitle: `${row.ticketNo} · ${row.category}`, icon: 'alert-circle' },
            DescriptionList([
              ['Raised by', `${row.raisedByName} (${row.raisedBy})`],
              ['Raised on', formatDate(row.createdAt)],
              ['Department', row.department], ['Owner', row.assignedToName || 'Unassigned'],
              ['SLA', `${row.slaHours}h`], ['Age', `${Math.round(row.ageHours / 24)} days`],
            ], { cols: 2 }),
            h('div', { className: 'mt-3' }, slaCell(row))),
          SectionCard({ title: 'Escalation trail', icon: 'workflow' }, ApprovalTrail(complaintTrail(row))),
          Callout({ tone: 'warning', icon: 'alert-triangle', title: 'Leadership decision' },
            'Accepting an escalation moves ownership to the principal’s office and halves the remaining SLA. Returning it sends the ticket back with a note.')),
      }));
    },
  },

  /* ----------------------------------------------- complaints/categories */
  'complaints/categories': {
    title: 'Categories',
    subtitle: 'Category owners, SLAs and live load',
    section: 'complaints',
    render(mount, ctx) {
      ensureStyles();
      const live = complaintsFor(ctx);
      const rows = db.complaintCategories.map((c) => {
        const tickets = live.filter((t) => t.category === c.name);
        const resolved = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed');
        return {
          ...c,
          liveOpen: tickets.length - resolved.length,
          liveTotal: tickets.length,
          breached: tickets.filter((t) => t.slaBreached).length,
          resolutionRate: tickets.length ? Math.round((resolved.length / tickets.length) * 100) : 0,
        };
      });

      mount.appendChild(listPage({
        title: 'Complaint categories',
        subtitle: `${rows.length} categories · each with an owning desk and an SLA commitment`,
        route: 'complaints/categories',
        actions: pageActions(
          Button('SLA configuration', { variant: 'secondary', icon: 'timer', route: 'complaints/sla' }),
          Button('Add category', { variant: 'primary', icon: 'plus', onClick: () => Modal({
            title: 'Add a complaint category', size: 'md', icon: 'tag',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Category name', required: true }, Input({ placeholder: 'e.g. Cafeteria', onInput: () => {} })),
              Field({ label: 'Owner desk', required: true }, Select({ options: [...new Set(db.complaintCategories.map((c) => c.owner))], onChange: () => {} })),
              Field({ label: 'SLA (hours)', required: true }, Input({ type: 'number', numeric: true, value: 48, onInput: () => {} })),
              Field({ label: 'Escalate to' }, Select({ options: ['Principal', 'Vice Principal', 'Administrator', 'Management'], onChange: () => {} })),
              Field({ label: 'Description', className: 'col-span-full' }, Textarea({ rows: 3, placeholder: 'What belongs in this category?' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'secondary', onClick: close }),
              Button('Add category', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Category added', tone: 'success' }); } })),
          }) })),
        kpis: [
          { label: 'Categories', value: formatNumber(rows.length), icon: 'tag', tone: 'brand' },
          { label: 'Open across all', value: formatNumber(rows.reduce((s, r) => s + r.liveOpen, 0)), icon: 'inbox', tone: 'warning' },
          { label: 'Escalations', value: formatNumber(rows.reduce((s, r) => s + r.escalations, 0)), icon: 'trending-up', tone: 'danger' },
          { label: 'Tightest SLA', value: `${Math.min(...rows.map((r) => r.slaHours))}h`, icon: 'timer', tone: 'info' },
        ],
        chart: barChart({
          categories: rows.map((r) => r.name),
          series: [
            { name: 'Open', values: rows.map((r) => r.open) },
            { name: 'Resolved', values: rows.map((r) => r.resolved) },
          ],
          stacked: true, height: 260, title: 'Category load',
        }),
        chartTitle: 'Open vs resolved by category',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Category or owner…', width: 260 },
          { id: 'owner', label: 'Owner desk', options: [...new Set(rows.map((r) => r.owner))] },
        ],
        onFilter: filterHandler(rows, { q: matchText('name', 'owner'), owner: matchEq('owner') }),
        columns: [
          { key: 'name', label: 'Category', sticky: true, width: 190, render: (r) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } },
            h('span', { style: { color: 'var(--text-muted)' }, html: icon('tag', 15) }), h('span', { className: 't-medium' }, r.name)) },
          { key: 'owner', label: 'Owner desk', width: 190, filter: true },
          { key: 'slaHours', label: 'SLA', width: 100, align: 'right', numeric: true, render: (r) => `${r.slaHours}h` },
          { key: 'open', label: 'Open', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'resolved', label: 'Resolved', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'escalations', label: 'Escalations', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'resolutionRate', label: 'Resolution rate', width: 170, align: 'right', numeric: true, aggregate: 'avg',
            format: (v) => `${Math.round(v)}%`,
            render: (r) => h('div', { className: 'stack-1', style: { minWidth: '130px' } },
              ProgressBar(r.resolutionRate, { size: 'sm', tone: r.resolutionRate >= 80 ? 'success' : r.resolutionRate >= 55 ? 'warning' : 'danger' }),
              h('span', { className: 't-2xs t-muted t-num' }, `${r.resolutionRate}% of ${r.liveTotal} live tickets`)) },
          { key: 'act', label: '', width: 80, sortable: false, align: 'right',
            render: () => IconButton('edit', { label: 'Edit category', size: 'sm', onClick: mockAction('Edit category') }) },
        ],
        rows,
        footerAggregates: true,
        paginate: false,
        exportName: 'complaint-categories',
        searchKeys: ['name', 'owner'],
        rowActions: (row) => [
          { label: 'View tickets', icon: 'list', onClick: () => { navigate('complaints/all'); notify({ title: `Filter: ${row.name}`, tone: 'info' }); } },
          { label: 'Edit SLA', icon: 'timer', route: 'complaints/sla' },
        ],
        emptyState: EmptyState({ icon: 'tag', title: 'No categories', text: 'Add a category so complaints can be routed to the right desk.' }),
      }));
    },
  },

  /* ------------------------------------------------------ complaints/sla */
  'complaints/sla': {
    title: 'SLA Configuration',
    subtitle: 'Response targets, escalation ladder and working hours',
    section: 'complaints',
    render(mount, ctx) {
      ensureStyles();
      const live = complaintsFor(ctx);
      const breachRate = live.length ? Math.round((live.filter((c) => c.slaBreached).length / live.length) * 100) : 0;

      mount.appendChild(settingsPage({
        title: 'SLA configuration',
        subtitle: `Current breach rate ${breachRate}% across ${formatNumber(live.length)} live tickets`,
        route: 'complaints/sla',
        saveLabel: 'Save SLA policy',
        onSave: () => notify({ title: 'SLA policy saved', text: 'Demo only — nothing was persisted.', tone: 'success' }),
        groups: [
          {
            id: 'priority', title: 'Response targets by priority', icon: 'timer',
            description: 'Time to first response and time to resolution, measured in working hours.',
            render: () => DataTable({
              columns: [
                { key: 'priority', label: 'Priority', sticky: true, width: 140, render: (r) => priorityBadge(r.priority) },
                { key: 'respond', label: 'First response', width: 150, align: 'right', numeric: true, render: (r) => `${r.respond}h` },
                { key: 'resolve', label: 'Resolution', width: 150, align: 'right', numeric: true, render: (r) => `${r.resolve}h` },
                { key: 'escalateAt', label: 'Escalate at', width: 150, align: 'right', numeric: true, render: (r) => `${r.escalateAt}%` },
                { key: 'live', label: 'Live tickets', width: 130, align: 'right', numeric: true, render: (r) => formatNumber(live.filter((c) => c.priority === r.priority).length) },
                { key: 'breached', label: 'Breached', width: 120, align: 'right', numeric: true,
                  render: (r) => { const n = live.filter((c) => c.priority === r.priority && c.slaBreached).length; return h('span', { className: n ? 't-danger t-num' : 't-num' }, formatNumber(n)); } },
              ],
              rows: [
                { id: 'p1', priority: 'Critical', respond: 1, resolve: 4, escalateAt: 75 },
                { id: 'p2', priority: 'High', respond: 4, resolve: 24, escalateAt: 80 },
                { id: 'p3', priority: 'Medium', respond: 8, resolve: 48, escalateAt: 85 },
                { id: 'p4', priority: 'Low', respond: 24, resolve: 96, escalateAt: 90 },
              ],
              paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
            }),
          },
          {
            id: 'category', title: 'Category overrides', icon: 'tag',
            description: 'A category SLA always wins over the priority default.',
            render: () => DataTable({
              columns: [
                { key: 'name', label: 'Category', sticky: true, width: 180 },
                { key: 'owner', label: 'Owner desk', width: 190 },
                { key: 'slaHours', label: 'SLA (hours)', width: 130, align: 'right', numeric: true },
                { key: 'escalations', label: 'Escalations', width: 130, align: 'right', numeric: true },
                { key: 'act', label: '', width: 80, sortable: false, align: 'right',
                  render: () => IconButton('edit', { label: 'Edit SLA override', size: 'sm', onClick: mockAction('Edit SLA override') }) },
              ],
              rows: db.complaintCategories,
              paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
            }),
          },
          {
            id: 'ladder', title: 'Escalation ladder', icon: 'trending-up',
            description: 'Who the ticket moves to when a threshold is crossed.',
            render: () => Stepper([
              { label: 'Assigned owner', description: 'Department executive · 0–75% of SLA', state: 'done' },
              { label: 'Department head', description: 'At 75% of SLA', state: 'current' },
              { label: 'Vice Principal', description: 'At SLA breach', state: 'todo' },
              { label: 'Principal', description: 'At 150% of SLA', state: 'todo' },
              { label: 'Management', description: 'At 200% of SLA or on repeat breach', state: 'todo' },
            ], { current: 1 }),
          },
          {
            id: 'hours', title: 'Working hours & holidays', icon: 'clock', cols: 2,
            fields: [
              { id: 'start', label: 'Working day starts', type: 'time', value: '08:00' },
              { id: 'end', label: 'Working day ends', type: 'time', value: '17:00' },
              { id: 'saturday', label: 'Saturday', type: 'switch', value: true, switchLabel: 'Count Saturdays as working days' },
              { id: 'holidays', label: 'Holidays', type: 'switch', value: false, switchLabel: 'Pause the SLA clock on declared holidays', description: `${db.holidays.length} holidays declared this session.` },
              { id: 'pauseOnHold', label: 'Pause when awaiting complainant', type: 'switch', value: true, switchLabel: 'Stop the clock while waiting on the complainant' },
              { id: 'reopenWindow', label: 'Re-open window (days)', type: 'number', value: 7, hint: 'A resolved ticket can be re-opened within this window.' },
            ],
          },
          {
            id: 'notify', title: 'Breach notifications', icon: 'bell', cols: 2,
            fields: [
              { id: 'warnAt', label: 'Warn owner at (% of SLA)', type: 'number', value: 75 },
              { id: 'digest', label: 'Daily breach digest', type: 'select', value: '08:30', options: ['07:30', '08:30', '09:30', 'Disabled'] },
              { id: 'smsCritical', label: 'Critical alerts', type: 'switch', value: true, switchLabel: 'SMS the department head for critical tickets' },
              { id: 'weekly', label: 'Weekly report', type: 'switch', value: true, switchLabel: 'Email the SLA scorecard to leadership every Monday' },
            ],
          },
        ],
      }));
    },
  },

  /* -------------------------------------------------- complaints/reports */
  'complaints/reports': {
    title: 'Complaint Reports',
    subtitle: 'Volume, SLA compliance and satisfaction by desk',
    section: 'complaints',
    render(mount, ctx) {
      ensureStyles();
      const all = complaintsFor(ctx);
      const rows = db.complaintCategories.map((c) => {
        const tickets = all.filter((t) => t.category === c.name);
        const resolved = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed');
        const rated = tickets.filter((t) => t.satisfaction);
        const breached = tickets.filter((t) => t.slaBreached);
        const avgDays = resolved.length
          ? resolved.reduce((s, t) => s + daysBetween(t.createdAt, t.resolvedAt || DEMO_TODAY), 0) / resolved.length : 0;
        return {
          id: c.id, category: c.name, owner: c.owner, slaHours: c.slaHours,
          raised: tickets.length,
          resolved: resolved.length,
          open: tickets.length - resolved.length,
          breached: breached.length,
          compliance: tickets.length ? Math.round(((tickets.length - breached.length) / tickets.length) * 100) : 100,
          avgDays: Math.round(avgDays * 10) / 10,
          satisfaction: rated.length ? Math.round((rated.reduce((s, t) => s + t.satisfaction, 0) / rated.length) * 10) / 10 : 0,
        };
      });
      const resolvedAll = all.filter((c) => c.status === 'Resolved' || c.status === 'Closed');
      const ratedAll = all.filter((c) => c.satisfaction);

      mount.appendChild(reportPage({
        title: 'Complaint reports',
        subtitle: `${campusLabel(ctx)} · ${formatNumber(all.length)} tickets · generated ${formatDate(DEMO_TODAY)}`,
        route: 'complaints/reports',
        filters: [
          { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'm', label: 'This month' }, { id: 'q', label: 'This quarter' }, { id: 'ytd', label: 'YTD' }] },
          { id: 'campus', label: 'Campus', options: db.campuses.map((c) => c.name) },
          { id: 'category', label: 'Category', options: db.complaintCategories.map((c) => c.name) },
          { id: 'from', label: 'From', type: 'date' },
        ],
        onFilter: (id, v, allV, table) => table && table.refresh(rows),
        summary: [
          { label: 'Tickets raised', value: formatNumber(all.length), delta: -4.2, icon: 'alert-circle', tone: 'brand', trend: analytics.sparks.complaints },
          { label: 'Resolved', value: formatNumber(resolvedAll.length), delta: 6.8, icon: 'check-circle', tone: 'success' },
          { label: 'SLA compliance', value: `${all.length ? Math.round(((all.length - all.filter((c) => c.slaBreached).length) / all.length) * 100) : 100}%`, delta: 2.1, icon: 'timer', tone: 'info' },
          { label: 'Avg satisfaction', value: ratedAll.length ? `${(ratedAll.reduce((s, c) => s + c.satisfaction, 0) / ratedAll.length).toFixed(1)}/5` : '—', icon: 'star', tone: 'warning' },
        ],
        chart: [
          comboChart({
            categories: analytics.complaintTrend.map((r) => r.month),
            bars: [{ name: 'Raised', values: analytics.complaintTrend.map((r) => r.raised) },
              { name: 'Resolved', values: analytics.complaintTrend.map((r) => r.resolved) }],
            line: { name: 'Breaches', values: analytics.complaintTrend.map((r) => r.breached) },
            height: 300, title: 'Monthly complaint movement',
          }),
          barChart({
            horizontal: true,
            categories: rows.map((r) => r.category),
            series: [{ name: 'Raised', values: rows.map((r) => r.raised) }, { name: 'Breached', values: rows.map((r) => r.breached) }],
            height: 320, title: 'Volume and breaches by category',
          }),
          donutChart({
            data: countBy(all, 'priority').map((p) => ({ key: p.key, value: p.value })),
            height: 260, centerLabel: 'Tickets', centerValue: formatNumber(all.length), title: 'Tickets by priority',
          }),
        ],
        chartTitle: 'Complaint analysis',
        columns: [
          { key: 'category', label: 'Category', sticky: true, width: 170 },
          { key: 'owner', label: 'Owner desk', width: 180 },
          { key: 'slaHours', label: 'SLA', width: 90, align: 'right', numeric: true, render: (r) => `${r.slaHours}h` },
          { key: 'raised', label: 'Raised', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'resolved', label: 'Resolved', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'open', label: 'Open', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'breached', label: 'Breached', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'compliance', label: 'SLA compliance', width: 170, align: 'right', numeric: true, aggregate: 'avg',
            format: (v) => `${Math.round(v)}%`,
            render: (r) => h('div', { className: 'stack-1', style: { minWidth: '130px' } },
              ProgressBar(r.compliance, { size: 'sm', tone: r.compliance >= 90 ? 'success' : r.compliance >= 70 ? 'warning' : 'danger' }),
              h('span', { className: 't-2xs t-muted t-num' }, `${r.compliance}%`)) },
          { key: 'avgDays', label: 'Avg days to close', width: 160, align: 'right', numeric: true, aggregate: 'avg', format: (v) => v.toFixed(1) },
          { key: 'satisfaction', label: 'Satisfaction', width: 140, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${v.toFixed(1)}/5`,
            render: (r) => (r.satisfaction ? Rating(Math.round(r.satisfaction), { showValue: true }) : '—') },
        ],
        rows,
        tableTitle: 'Category scorecard',
        footerAggregates: true,
        notes: Callout({ tone: 'info', icon: 'info', title: 'How compliance is measured' },
          'A ticket is compliant when it is resolved inside the category SLA, measured in working hours. Escalated tickets carry the original SLA for reporting.'),
      }));
    },
  },
};
