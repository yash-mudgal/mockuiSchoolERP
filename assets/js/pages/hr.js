/* ==========================================================================
   pages/hr.js — Human Resources module (section id: `hr`)

   Full employee lifecycle for Springdale International School Group:
   directory · employee 360 · org structure · recruitment · onboarding ·
   documents · staff attendance · leave · payroll (flagship) · appraisal ·
   training · promotions · exit · HR analytics.

   Every screen is composed from core/page-kit.js + core/ui.js + core/charts.js
   and reads real records from data/db.js. Nothing here mutates the database:
   forms validate, toast and close.
   ========================================================================== */

import {
  h, frag, Icon, Card, SectionCard, StatCard, Badge, Button, IconButton, Identity,
  DataTable, Modal, Drawer, ConfirmDialog, notify, EmptyState, Timeline, ActivityFeed,
  DescriptionList, ProgressBar, Avatar, AvatarStack, Tabs, SegmentedControl, FilterBar,
  MenuButton, Callout, FileList, RankList, Rating, Stepper, ApprovalTrail, Accordion,
  Field, Input, Select, Textarea, Checkbox, Switch, DatePicker, MultiSelect, FormGrid,
  FormSection, FormActions, Pill, Tag, MetricRow, Divider, Toolbar, SearchInput,
  validators, mockAction, formatCurrency, formatNumber, formatDate, formatPercent,
  relativeTime, toneForStatus, printNode, download, toCsv, copyToClipboard, DEMO_NOW,
} from '../core/ui.js';

import {
  page, listPage, detailPage, dashboardPage, formPage, reportPage, settingsPage,
  approvalQueuePage, kanbanPage, calendarPage, profileHeader, kpiRow, greetingFor,
  missingRecord, pageActions,
} from '../core/page-kit.js';

import {
  lineChart, areaChart, barChart, comboChart, donutChart, pieChart, funnelChart,
  heatmap, gaugeChart, scatterPlot, bulletChart, waterfallChart, treemap,
  radialBarChart, progressRing, sparkline, stackedProgressBar, ScaleLegend,
  PALETTE, SEQUENTIAL, ORDINAL, STATUS, seriesColor, compactNumber,
} from '../core/charts.js';

import { db, analytics, byId, where, search, sortBy, groupBy, sum, avg, countBy, sumBy } from '../data/db.js';
import { icon } from '../core/icons.js';
import { navigate, navHref } from '../core/router.js';
import * as store from '../core/state.js';

/* ==========================================================================
   0 · module utilities
   ========================================================================== */

/** Deterministic hash → seed, so every derived record is stable across reloads. */
function seedOf(str) {
  let x = 2166136261;
  const s = String(str);
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
  return x >>> 0;
}

/** mulberry32, mirroring the generator used by data/db.js. */
function rngFor(str) {
  let a = seedOf(str);
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rInt = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const rPick = (r, arr) => arr[Math.floor(r() * arr.length)];
const rBool = (r, p = 0.5) => r() < p;
const round2 = (n) => Math.round(n * 100) / 100;

/** Memoise a zero-argument factory (derived collections are built once). */
function once(fn) { let v; let done = false; return () => { if (!done) { v = fn(); done = true; } return v; }; }

const MONTHS = ['Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026'];
const FY_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

/* ---------------------------------------------------------------- styling */

const STYLE_ID = 'hr-module-style';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
  .hr-emp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:var(--sp-4);}
  .hr-emp-card{display:flex;flex-direction:column;gap:var(--sp-3);padding:var(--card-pad);border:1px solid var(--border);
    border-radius:var(--r-lg);background:var(--surface);transition:border-color var(--dur-base) var(--ease),box-shadow var(--dur-base) var(--ease),transform var(--dur-base) var(--ease);cursor:pointer;}
  .hr-emp-card:hover{border-color:var(--border-brand);box-shadow:var(--shadow-md);transform:translateY(-2px);}
  .hr-emp-card:focus-visible{outline:2px solid var(--border-focus);outline-offset:2px;}
  .hr-emp-card-top{display:flex;gap:var(--sp-3);align-items:center;}
  .hr-emp-card-foot{display:flex;justify-content:space-between;gap:var(--sp-2);padding-top:var(--sp-3);border-top:1px solid var(--border-subtle);}
  .hr-emp-metric{display:flex;flex-direction:column;gap:2px;min-width:0;}
  .hr-emp-metric b{font-size:var(--fs-sm);font-weight:var(--fw-semibold);font-variant-numeric:tabular-nums;}
  .hr-emp-metric span{font-size:var(--fs-2xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;}

  .hr-ring-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:var(--sp-3);align-items:start;justify-items:center;}
  .hr-ring{display:flex;flex-direction:column;align-items:center;gap:var(--sp-2);text-align:center;}
  .hr-ring-cap{font-size:var(--fs-xs);color:var(--text-muted);}

  .hr-slip{border:1px solid var(--border);border-radius:var(--r-lg);background:var(--surface);overflow:hidden;}
  .hr-slip-head{display:flex;justify-content:space-between;gap:var(--sp-4);flex-wrap:wrap;
    padding:var(--sp-5);border-bottom:1px solid var(--border);background:var(--surface-sunken);}
  .hr-slip-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;}
  .hr-slip-grid>section{padding:var(--sp-5);}
  .hr-slip-grid>section+section{border-left:1px solid var(--border);}
  .hr-slip-line{display:flex;justify-content:space-between;gap:var(--sp-3);padding:var(--sp-2) 0;border-bottom:1px dashed var(--border-subtle);font-size:var(--fs-sm);}
  .hr-slip-line b{font-variant-numeric:tabular-nums;font-weight:var(--fw-medium);}
  .hr-slip-total{display:flex;justify-content:space-between;gap:var(--sp-3);padding:var(--sp-3) 0 0;font-weight:var(--fw-semibold);}
  .hr-slip-net{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-4);flex-wrap:wrap;
    padding:var(--sp-4) var(--sp-5);border-top:1px solid var(--border);background:var(--surface-accent);}
  .hr-slip-net-v{font-size:var(--fs-2xl);font-weight:var(--fw-bold);color:var(--text-brand);}

  .hr-comp-row{display:grid;grid-template-columns:1.4fr 1fr 1.6fr auto;gap:var(--sp-3);align-items:end;
    padding:var(--sp-3);border:1px solid var(--border-subtle);border-radius:var(--r-md);background:var(--surface-sunken);}
  .hr-formula{font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--text-secondary);
    background:var(--surface);border:1px solid var(--border-subtle);border-radius:var(--r-sm);padding:2px var(--sp-2);}

  .hr-check-list{display:flex;flex-direction:column;gap:var(--sp-2);}
  .hr-check{display:flex;gap:var(--sp-3);align-items:center;padding:var(--sp-3);border:1px solid var(--border-subtle);
    border-radius:var(--r-md);background:var(--surface);}
  .hr-check[data-done="true"]{background:var(--surface-sunken);}
  .hr-check-ico{width:26px;height:26px;flex:none;display:grid;place-items:center;border-radius:var(--r-full);}
  .hr-check[data-done="true"] .hr-check-ico{background:var(--success-100);color:var(--success-700);}
  .hr-check[data-done="false"] .hr-check-ico{background:var(--warning-100);color:var(--warning-700);}

  .hr-punch{display:flex;gap:var(--sp-2);flex-wrap:wrap;}
  .hr-punch-cell{min-width:56px;padding:var(--sp-2);border-radius:var(--r-sm);border:1px solid var(--border-subtle);
    text-align:center;font-size:var(--fs-2xs);font-variant-numeric:tabular-nums;background:var(--surface);}

  .hr-org{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--sp-3);}
  .hr-org-node{padding:var(--sp-3);border:1px solid var(--border);border-left:3px solid var(--brand-500);
    border-radius:var(--r-md);background:var(--surface);}

  @media (max-width: 768px){
    .hr-slip-grid{grid-template-columns:1fr;}
    .hr-slip-grid>section+section{border-left:0;border-top:1px solid var(--border);}
    .hr-comp-row{grid-template-columns:1fr;}
  }`;
  document.head.appendChild(h('style', { id: STYLE_ID, html: css }));
}

/* ------------------------------------------------------------- formatting */

const qOf = (ctx) => (ctx && ctx.query) || {};
const currentCampus = (ctx) => ((ctx && ctx.state) || store.get() || {}).campusId || 'all';

const campusName = (id) => (byId(db.campuses, id) || {}).name || '—';

/** staff[i].address is a structured object — flatten it for display. */
function addressLine(a) {
  if (!a) return '—';
  if (typeof a === 'string') return a;
  return [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ');
}

const inr = (n) => formatCurrency(n || 0);
const inrC = (n) => formatCurrency(n || 0, { compact: true });

/** The standard employee cell: avatar + name + employee code, links to the 360. */
function empCell(s, meta) {
  if (!s) return '—';
  return Identity(s.name, meta || `${s.employeeCode} · ${s.designation}`, {
    onClick: () => navigate(`hr/employee-profile/${s.id}`),
  });
}

function empCellById(id, meta) {
  const s = byId(db.staff, id);
  return s ? empCell(s, meta) : h('span', { className: 't-muted' }, id || '—');
}

function toneChip(text, tone) { return Badge(text, tone ? { tone } : undefined); }

function metric(label, value, tone) {
  return h('div', { className: 'hr-emp-metric' },
    h('b', { className: tone ? `t-${tone}` : null }, value),
    h('span', null, label));
}

/** A labelled progress ring for the balance/utilisation rails. */
function ringTile(value, max, label, caption, color) {
  const denom = max || 1;
  return h('div', { className: 'hr-ring' },
    progressRing(value, {
      max: denom, size: 104, thickness: 9, color, label,
      sublabel: label,
      // progressRing hands the formatter a percentage — convert it back to the raw count.
      valueFormat: (pct) => String(Math.round((Number(pct) / 100) * denom)),
    }),
    caption && h('div', { className: 'hr-ring-cap' }, caption));
}

/** Standard "what you can do next" empty state for filtered widgets. */
function emptyFor(title, text, action) {
  return EmptyState({ icon: 'inbox', title, text, action });
}

/* ---------------------------------------------------- shared filter logic */

function campusFilterOptions() {
  return db.campuses.map((c) => ({ value: c.id, label: c.name }));
}

function applyStaffFilters(rows, f) {
  let out = rows;
  if (f.campus && f.campus !== 'all') out = out.filter((s) => s.campusId === f.campus);
  if (f.department && f.department !== 'all') out = out.filter((s) => s.department === f.department);
  if (f.designation && f.designation !== 'all') out = out.filter((s) => s.designation === f.designation);
  if (f.type && f.type !== 'all') out = out.filter((s) => s.type === f.type);
  if (f.status && f.status !== 'all') out = out.filter((s) => s.status === f.status);
  if (f.employment && f.employment !== 'all') out = out.filter((s) => s.employmentType === f.employment);
  if (f.band && f.band !== 'all') out = out.filter((s) => s.band === f.band);
  if (f.q) out = search(out, f.q, ['name', 'employeeCode', 'designation', 'department', 'email', 'phone']);
  return out;
}

const DEPT_NAMES = once(() => Array.from(new Set(db.staff.map((s) => s.department))).sort());
const DESIG_NAMES = once(() => Array.from(new Set(db.staff.map((s) => s.designation))).sort());
const BANDS = once(() => Array.from(new Set(db.staff.map((s) => s.band))).sort());

/* ==========================================================================
   1 · derived HR datasets (deterministic, built on top of db records)
   ========================================================================== */

/* -------------------------------------------------- salary structure model */

const EARNING_COMPONENTS = [
  { id: 'basic', name: 'Basic Pay', type: 'Earning', formula: 'Grade basic as per band', taxable: true, pfBase: true, partOfCtc: true },
  { id: 'hra', name: 'House Rent Allowance', type: 'Earning', formula: '40% of Basic', taxable: true, pfBase: false, partOfCtc: true },
  { id: 'da', name: 'Dearness Allowance', type: 'Earning', formula: '12% of Basic', taxable: true, pfBase: true, partOfCtc: true },
  { id: 'conveyance', name: 'Conveyance Allowance', type: 'Earning', formula: 'Flat ₹2,400 / month', taxable: false, pfBase: false, partOfCtc: true },
  { id: 'special', name: 'Special Allowance', type: 'Earning', formula: 'Gross − (Basic + HRA + DA + Conveyance)', taxable: true, pfBase: false, partOfCtc: true },
];

const DEDUCTION_COMPONENTS = [
  { id: 'pf', name: 'Provident Fund (EPF)', type: 'Deduction', formula: '12% of Basic, capped at ₹1,800 for band L1–L2', statutory: true },
  { id: 'esi', name: 'ESI Contribution', type: 'Deduction', formula: '0.75% of Gross when Gross ≤ ₹21,000', statutory: true },
  { id: 'tds', name: 'Income Tax (TDS)', type: 'Deduction', formula: 'Slab-based on projected annual taxable pay', statutory: true },
  { id: 'pt', name: 'Professional Tax', type: 'Deduction', formula: 'State slab — ₹200 / month (₹300 in February)', statutory: true },
  { id: 'lop', name: 'Loss of Pay', type: 'Deduction', formula: '(Gross ÷ 30) × LOP days', statutory: false },
  { id: 'loan', name: 'Loan / Advance EMI', type: 'Deduction', formula: 'Active EMI from the loans ledger', statutory: false },
];

/** Compute a full salary breakdown for one employee (statutory rules applied). */
function salaryFor(s) {
  const basic = s.salaryBasic;
  const hra = s.salaryHra;
  const da = s.salaryDa;
  const conveyance = s.salaryConveyance;
  const special = Math.max(0, s.salaryGross - (basic + hra + da + conveyance));
  const gross = basic + hra + da + conveyance + special;
  const pf = s.deductionPf;
  const esi = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
  const tds = s.deductionTds;
  const pt = 200;
  const deductions = pf + esi + tds + pt;
  return {
    basic, hra, da, conveyance, special, gross,
    pf, esi, tds, pt, deductions,
    net: gross - deductions,
    ctcMonthly: gross + Math.round(basic * 0.12) + esi,
    ctcAnnual: (gross + Math.round(basic * 0.12) + esi) * 12,
  };
}

/* ------------------------------------------------------------------ loans */

const LOAN_TYPES = ['Salary Advance', 'Festival Advance', 'Medical Loan', 'Vehicle Loan', 'Education Loan', 'Housing Loan'];

const loans = once(() => {
  const out = [];
  const pool = db.staff.filter((s) => s.status === 'Active' && s.experienceYears >= 2);
  pool.forEach((s, i) => {
    const r = rngFor('hrloan' + s.id);
    if (!rBool(r, 0.22)) return;
    const type = rPick(r, LOAN_TYPES);
    const principal = type === 'Housing Loan' ? rInt(r, 400000, 1200000)
      : type === 'Vehicle Loan' ? rInt(r, 120000, 480000)
        : type === 'Education Loan' ? rInt(r, 80000, 350000)
          : rInt(r, 15000, 120000);
    const tenure = principal > 400000 ? rPick(r, [36, 48, 60]) : principal > 120000 ? rPick(r, [12, 18, 24]) : rPick(r, [3, 6, 10]);
    const rate = type === 'Salary Advance' || type === 'Festival Advance' ? 0 : rPick(r, [4, 6, 7.5]);
    const emi = rate === 0
      ? Math.round(principal / tenure)
      : Math.round((principal * (rate / 1200) * Math.pow(1 + rate / 1200, tenure)) / (Math.pow(1 + rate / 1200, tenure) - 1));
    const paid = Math.min(tenure, rInt(r, 1, Math.max(1, tenure - 1)));
    const startMonthIdx = rInt(r, 0, 4);
    const status = paid >= tenure ? 'Closed' : rBool(r, 0.08) ? 'On Hold' : 'Active';
    out.push({
      id: 'LON' + String(out.length + 1).padStart(4, '0'),
      employeeId: s.id, employeeName: s.name, employeeCode: s.employeeCode,
      designation: s.designation, department: s.department, campusId: s.campusId,
      type, principal, rate, tenure, emi,
      installmentsPaid: paid,
      outstanding: Math.max(0, (tenure - paid) * emi),
      recovered: paid * emi,
      sanctionedOn: `2026-${String(4 + startMonthIdx).padStart(2, '0')}-${String(rInt(r, 1, 26)).padStart(2, '0')}`,
      firstEmiMonth: MONTHS[Math.min(4, startMonthIdx)],
      guarantor: rPick(r, db.staff).name,
      purpose: rPick(r, ['Home renovation', 'Child’s admission fee', 'Medical emergency in family', 'Two-wheeler purchase', 'Festival expenses', 'Post-graduate course fee']),
      status,
      approvedBy: 'HR Manager',
    });
    void i;
  });
  return out;
});

/** Amortisation schedule for one loan. */
function emiSchedule(loan) {
  const rows = [];
  let bal = loan.principal;
  const monthly = loan.rate / 1200;
  for (let i = 1; i <= loan.tenure; i++) {
    const interest = Math.round(bal * monthly);
    const principalPart = Math.min(bal, loan.emi - interest);
    bal = Math.max(0, bal - principalPart);
    const mi = FY_MONTHS[(3 + i) % 12];
    rows.push({
      id: `${loan.id}-${i}`,
      no: i,
      month: `${mi} ${i + 3 > 12 ? 2027 : 2026}`,
      emi: interest + principalPart,
      principal: principalPart,
      interest,
      balance: bal,
      status: i <= loan.installmentsPaid ? 'Paid' : 'Pending',
    });
  }
  return rows;
}

/* ------------------------------------------------------------ onboarding */

const ONBOARD_TASKS = [
  { id: 'offer', label: 'Offer accepted', owner: 'HR Executive' },
  { id: 'docs', label: 'Document verification', owner: 'HR Executive' },
  { id: 'bgv', label: 'Background & reference check', owner: 'HR Manager' },
  { id: 'police', label: 'Police verification (POCSO compliance)', owner: 'Administration' },
  { id: 'medical', label: 'Pre-employment medical', owner: 'School Nurse' },
  { id: 'bank', label: 'Bank account & UAN capture', owner: 'Accounts' },
  { id: 'it', label: 'Email, ERP login & biometric enrolment', owner: 'IT' },
  { id: 'assets', label: 'Asset issue — laptop, ID card, keys', owner: 'Administration' },
  { id: 'induction', label: 'Induction & CBSE orientation', owner: 'Academic Coordinator' },
  { id: 'buddy', label: 'Buddy assigned & first-week plan', owner: 'Department Head' },
];

const onboardings = once(() => {
  const offered = db.applicants.filter((a) => a.stage === 'Offered');
  return offered.map((a, i) => {
    const r = rngFor('hronb' + a.id);
    const doneCount = rInt(r, 2, ONBOARD_TASKS.length);
    const tasks = ONBOARD_TASKS.map((t, ti) => ({
      ...t,
      done: ti < doneCount,
      date: ti < doneCount ? `2026-08-${String(Math.min(19, 4 + ti)).padStart(2, '0')}` : null,
    }));
    const joining = `2026-${String(rInt(r, 8, 10)).padStart(2, '0')}-${String(rInt(r, 1, 28)).padStart(2, '0')}`;
    const pct = Math.round((doneCount / ONBOARD_TASKS.length) * 100);
    return {
      id: 'ONB' + String(i + 1).padStart(3, '0'),
      applicantId: a.id,
      name: a.name,
      position: a.position,
      department: (byId(db.recruitments, a.recruitmentId) || {}).department || 'Academics',
      campusId: a.campusId,
      email: a.email,
      phone: a.phone,
      qualification: a.qualification,
      experienceYears: a.experienceYears,
      offeredCtc: a.expectedCtc,
      joiningDate: joining,
      buddy: rPick(r, db.staff).name,
      reportingTo: rPick(r, db.staff.filter((s) => s.band === 'L2' || s.band === 'L3')).name,
      tasks,
      completed: doneCount,
      progress: pct,
      status: pct === 100 ? 'Completed' : pct >= 50 ? 'In Progress' : 'Pending',
    };
  });
});

/* ------------------------------------------------------------- interviews */

const PANEL_ROUNDS = ['Screening call', 'Subject expert round', 'Demo class', 'Principal round', 'HR & compensation'];
const COMPETENCIES = ['Subject knowledge', 'Communication', 'Classroom management', 'Technology use', 'Culture fit'];

const interviews = once(() => {
  const pool = db.applicants.filter((a) => ['Shortlisted', 'Interview', 'Demo Class', 'Offered', 'Rejected'].includes(a.stage));
  return pool.map((a, i) => {
    const r = rngFor('hrint' + a.id);
    const day = rInt(r, 10, 31);
    const month = day > 20 ? 8 : 9;
    const date = `2026-${String(month).padStart(2, '0')}-${String(Math.min(28, day)).padStart(2, '0')}`;
    const panel = [rPick(r, db.staff), rPick(r, db.staff)].map((s) => s.name);
    const scores = COMPETENCIES.map((c) => ({ name: c, score: rInt(r, 2, 5) }));
    const overall = round2(scores.reduce((t, s) => t + s.score, 0) / scores.length);
    const status = a.stage === 'Offered' ? 'Completed' : a.stage === 'Rejected' ? 'Completed'
      : a.stage === 'Shortlisted' ? 'Scheduled' : rBool(r, 0.55) ? 'Completed' : 'Scheduled';
    return {
      id: 'INT' + String(i + 1).padStart(4, '0'),
      applicantId: a.id,
      name: a.name,
      position: a.position,
      campusId: a.campusId,
      round: a.stage === 'Demo Class' ? 'Demo class' : rPick(r, PANEL_ROUNDS),
      date,
      time: `${String(rInt(r, 9, 16)).padStart(2, '0')}:${rPick(r, ['00', '30'])}`,
      durationMin: rPick(r, [30, 45, 60]),
      mode: rPick(r, ['In person', 'Google Meet', 'Telephonic']),
      venue: rPick(r, ['Conference Room 1', 'Principal’s Office', 'Demo Class — Room 204', 'Online']),
      panel,
      scores,
      overall,
      recommendation: overall >= 4.2 ? 'Strong hire' : overall >= 3.4 ? 'Hire' : overall >= 2.8 ? 'Hold' : 'No hire',
      notes: a.notes || 'Panel notes pending upload.',
      status,
    };
  });
});

/* -------------------------------------------------------------- documents */

const DOC_TYPES = [
  { id: 'aadhaar', name: 'Aadhaar Card', mandatory: true },
  { id: 'pan', name: 'PAN Card', mandatory: true },
  { id: 'degree', name: 'Highest Degree Certificate', mandatory: true },
  { id: 'bed', name: 'B.Ed / Teaching Qualification', mandatory: false },
  { id: 'experience', name: 'Experience / Relieving Letter', mandatory: true },
  { id: 'police', name: 'Police Verification', mandatory: true },
  { id: 'medical', name: 'Medical Fitness Certificate', mandatory: true },
  { id: 'bank', name: 'Cancelled Cheque', mandatory: true },
  { id: 'photo', name: 'Passport Photograph', mandatory: false },
  { id: 'contract', name: 'Signed Appointment Letter', mandatory: true },
];

function documentsFor(s) {
  const r = rngFor('hrdoc' + s.id);
  return DOC_TYPES.map((d) => {
    const complete = s.documentsComplete ? rBool(r, 0.94) : rBool(r, 0.62);
    const expiring = d.id === 'police' || d.id === 'medical';
    return {
      ...d,
      key: `${s.id}-${d.id}`,
      status: complete ? (expiring && rBool(r, 0.14) ? 'Expiring soon' : 'Verified') : rBool(r, 0.5) ? 'Pending' : 'Missing',
      fileName: complete ? `${s.employeeCode}-${d.id}.pdf` : null,
      size: complete ? `${rInt(r, 120, 2400)} KB` : null,
      uploadedOn: complete ? `2026-0${rInt(r, 4, 8)}-${String(rInt(r, 1, 28)).padStart(2, '0')}` : null,
      validTill: expiring && complete ? `202${rInt(r, 6, 8)}-${String(rInt(r, 1, 12)).padStart(2, '0')}-01` : null,
      verifiedBy: complete ? 'HR Executive' : null,
    };
  });
}

const documentSummary = once(() => db.staff.map((s) => {
  const docs = documentsFor(s);
  const verified = docs.filter((d) => d.status === 'Verified').length;
  const missing = docs.filter((d) => d.status === 'Missing');
  const expiring = docs.filter((d) => d.status === 'Expiring soon');
  return {
    id: s.id,
    employeeId: s.id,
    name: s.name,
    employeeCode: s.employeeCode,
    designation: s.designation,
    department: s.department,
    campusId: s.campusId,
    type: s.type,
    status: s.status,
    docs,
    verified,
    total: docs.length,
    missingCount: missing.length,
    expiringCount: expiring.length,
    completeness: Math.round((verified / docs.length) * 100),
    compliance: missing.length === 0 ? (expiring.length ? 'Action needed' : 'Compliant') : 'Non-compliant',
  };
}));

/* ------------------------------------------------------------- promotions */

const promotions = once(() => {
  const out = [];
  db.staff.forEach((s) => {
    const r = rngFor('hrpro' + s.id);
    if (!rBool(r, 0.14)) return;
    const kind = rBool(r, 0.62) ? 'Promotion' : rBool(r, 0.6) ? 'Campus Transfer' : 'Department Transfer';
    const salaryFrom = s.salaryGross - rInt(r, 3000, 12000);
    const otherCampus = db.campuses.filter((c) => c.id !== s.campusId);
    out.push({
      id: 'PRM' + String(out.length + 1).padStart(3, '0'),
      employeeId: s.id, employeeName: s.name, employeeCode: s.employeeCode,
      campusId: s.campusId,
      type: kind,
      fromDesignation: kind === 'Promotion' ? rPick(r, ['TGT', 'PRT', 'Assistant Teacher', 'Senior Assistant', 'Coordinator']) : s.designation,
      toDesignation: s.designation,
      fromDepartment: kind === 'Department Transfer' ? rPick(r, DEPT_NAMES()) : s.department,
      toDepartment: s.department,
      fromCampus: kind === 'Campus Transfer' ? rPick(r, otherCampus).id : s.campusId,
      toCampus: s.campusId,
      fromBand: kind === 'Promotion' ? 'L' + Math.min(6, Number(String(s.band).slice(1)) + 1) : s.band,
      toBand: s.band,
      salaryFrom,
      salaryTo: s.salaryGross,
      hikePct: round2(((s.salaryGross - salaryFrom) / salaryFrom) * 100),
      effectiveDate: `2026-0${rInt(r, 4, 8)}-01`,
      recommendedBy: rPick(r, ['Principal', 'Vice Principal', 'HR Manager', 'Department Head']),
      approvalStatus: rPick(r, ['Approved', 'Approved', 'Approved', 'Pending', 'Under Review']),
      remarks: rPick(r, [
        'Consistent “Exceeds Expectations” for two cycles.',
        'Took charge of the CBSE inspection readiness drive.',
        'Requested transfer for family relocation.',
        'Departmental rebalancing after new section additions.',
        'Board result contribution — 100% pass in the subject.',
      ]),
    });
  });
  return out;
});

/* ---------------------------------------------------------- exit clearance */

const CLEARANCE_DEPTS = [
  { id: 'it', label: 'IT & Systems', field: 'clearanceIt', items: 'Laptop, ERP access, email, biometric de-enrolment' },
  { id: 'library', label: 'Library', field: 'clearanceLibrary', items: 'Books returned, membership closed, fines cleared' },
  { id: 'accounts', label: 'Accounts', field: 'clearanceAccounts', items: 'Advances recovered, loan closure, reimbursements' },
  { id: 'hostel', label: 'Hostel & Estate', field: 'clearanceHostel', items: 'Quarters vacated, keys handed over' },
  { id: 'academics', label: 'Academics', field: null, items: 'Answer scripts, lesson plans, class handover' },
  { id: 'admin', label: 'Administration', field: null, items: 'ID card, uniform, stationery, gate pass' },
  { id: 'hr', label: 'Human Resources', field: null, items: 'Exit interview, relieving letter, F&F sign-off' },
];

function clearanceFor(rg) {
  const r = rngFor('hrclr' + rg.id);
  return CLEARANCE_DEPTS.map((d) => {
    const done = d.field ? !!rg[d.field] : rBool(r, 0.55);
    return {
      id: `${rg.id}-${d.id}`,
      department: d.label,
      items: d.items,
      status: done ? 'Cleared' : rBool(r, 0.5) ? 'Pending' : 'In Progress',
      owner: rPick(r, db.staff).name,
      clearedOn: done ? `2026-08-${String(rInt(r, 1, 19)).padStart(2, '0')}` : null,
      remarks: done ? 'No dues.' : rPick(r, ['Awaiting handover note.', 'One item still with the employee.', 'Recovery amount to be confirmed.']),
      dues: done ? 0 : rBool(r, 0.4) ? rInt(r, 500, 18000) : 0,
    };
  });
}

/** Full & final settlement computation for a resignation record. */
function fnfFor(rg) {
  const s = byId(db.staff, rg.employeeId);
  const r = rngFor('hrfnf' + rg.id);
  const sal = s ? salaryFor(s) : { gross: 60000, basic: 30000, net: 52000 };
  const workedDays = rInt(r, 8, 26);
  const salaryPayable = Math.round((sal.gross / 30) * workedDays);
  const leaveEncash = Math.round((sal.basic / 30) * rInt(r, 2, 22));
  const gratuityYears = s ? s.experienceYears : 6;
  const gratuity = gratuityYears >= 5 ? Math.round((sal.basic * 15 * gratuityYears) / 26) : 0;
  const bonus = rBool(r, 0.5) ? rInt(r, 8000, 42000) : 0;
  const clearance = clearanceFor(rg);
  const recovery = clearance.reduce((t, c) => t + c.dues, 0);
  const noticeShort = rBool(r, 0.25) ? Math.round(sal.gross * rInt(r, 0, 1)) : 0;
  const loan = loans().find((l) => l.employeeId === rg.employeeId && l.status === 'Active');
  const loanRecovery = loan ? loan.outstanding : 0;
  const tds = Math.round((salaryPayable + leaveEncash + bonus) * 0.05);
  const gross = salaryPayable + leaveEncash + gratuity + bonus;
  const deductions = recovery + noticeShort + loanRecovery + tds;
  return {
    workedDays, salaryPayable, leaveEncash, gratuity, gratuityYears, bonus,
    recovery, noticeShort, loanRecovery, tds, gross, deductions,
    net: gross - deductions,
    clearance,
  };
}

/* --------------------------------------------------------------- appraisal */

const APPRAISAL_CYCLES = [
  { id: 'AC2026H1', name: 'FY 2026-27 · Mid-year review', from: '2026-04-01', to: '2026-09-30', status: 'In Progress', weightage: 40 },
  { id: 'AC2025AN', name: 'FY 2025-26 · Annual appraisal', from: '2025-04-01', to: '2026-03-31', status: 'Completed', weightage: 100 },
  { id: 'AC2025H1', name: 'FY 2025-26 · Mid-year review', from: '2025-04-01', to: '2025-09-30', status: 'Completed', weightage: 40 },
];

const APPRAISAL_KRAS = [
  'Learning outcomes & board results',
  'Lesson planning & curriculum delivery',
  'Classroom management & discipline',
  'Parent engagement & PTM feedback',
  'Professional development & training',
  'Institutional citizenship',
];

function appraisalFor(s) {
  const r = rngFor('hrapp' + s.id);
  const base = s.appraisalScore;
  const kras = APPRAISAL_KRAS.map((k) => ({
    kra: k,
    weight: 0,
    self: round2(Math.min(5, Math.max(1, base + (r() - 0.4)))),
    manager: round2(Math.min(5, Math.max(1, base + (r() - 0.55)))),
  }));
  const weights = [30, 20, 15, 15, 10, 10];
  kras.forEach((k, i) => { k.weight = weights[i]; });
  const finalScore = round2(kras.reduce((t, k) => t + (k.manager * k.weight) / 100, 0));
  return {
    employeeId: s.id,
    cycleId: 'AC2026H1',
    kras,
    finalScore,
    selfScore: round2(kras.reduce((t, k) => t + (k.self * k.weight) / 100, 0)),
    rating: s.appraisalRating,
    history: [
      { cycle: 'FY 2023-24', score: round2(Math.max(2.2, base - 0.7 + r() * 0.4)) },
      { cycle: 'FY 2024-25', score: round2(Math.max(2.4, base - 0.4 + r() * 0.4)) },
      { cycle: 'FY 2025-26', score: round2(Math.max(2.6, base - 0.15 + r() * 0.3)) },
      { cycle: 'FY 2026-27', score: finalScore },
    ],
    reviewer: rPick(r, ['Principal', 'Vice Principal', 'Head of Department', 'Academic Coordinator']),
    hikeRecommended: s.appraisalRating === 'Outstanding' ? rInt(r, 12, 18)
      : s.appraisalRating === 'Exceeds Expectations' ? rInt(r, 8, 12)
        : s.appraisalRating === 'Meets Expectations' ? rInt(r, 4, 8) : rInt(r, 0, 3),
    strengths: rPick(r, [
      'Outstanding board results — subject average 8 points above the campus mean.',
      'Mentors two probationers and runs the peer-observation circle.',
      'Digital content library adopted by the whole department.',
      'Highest PTM parent satisfaction score in the department.',
    ]),
    development: rPick(r, [
      'Formative assessment design — enrol in the November workshop.',
      'Delegate co-curricular duties to free up remedial time.',
      'Improve turnaround time on answer-script evaluation.',
      'Build confidence with the new LMS analytics dashboard.',
    ]),
    goals: rInt(r, 3, 6),
    goalsMet: rInt(r, 2, 5),
  };
}

/* ---------------------------------------------------- attendance derivation */

/** 12-month daily attendance heat for one employee (working days only). */
function attendanceCalendarFor(s) {
  const r = rngFor('hrcal' + s.id);
  const days = [];
  const start = new Date('2026-04-01');
  for (let i = 0; i < 150; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    if (d.getDay() === 0) continue;
    if (d > DEMO_NOW) break;
    const roll = r();
    const value = roll > 0.94 ? 0 : roll > 0.9 ? 0.5 : roll > 0.86 ? 0.75 : 1;
    days.push({ date: d.toISOString().slice(0, 10), value });
  }
  return days;
}

/** Monthly attendance register rows for one employee. */
function monthlyRegisterFor(s) {
  const r = rngFor('hrreg' + s.id);
  return MONTHS.map((m) => {
    const working = rInt(r, 24, 26);
    const leave = rInt(r, 0, 3);
    const absent = rBool(r, 0.25) ? rInt(r, 1, 2) : 0;
    const halfDay = rBool(r, 0.3) ? 1 : 0;
    const present = working - leave - absent;
    return {
      id: `${s.id}-${m}`,
      month: m,
      workingDays: working,
      present,
      leave,
      absent,
      halfDay,
      lateMarks: rInt(r, 0, 4),
      onDuty: rInt(r, 0, 2),
      percent: round2((present / working) * 100),
      overtimeHours: rInt(r, 0, 12),
    };
  });
}

/* ---------------------------------------------------------- assets issued */

function assetsFor(s) {
  return db.assets.filter((a) => a.assignedTo === s.name).slice(0, 8);
}

/* ------------------------------------------------------ leave computation */

function leaveLedgerFor(s) {
  const taken = db.leaveRequests.filter((l) => l.employeeId === s.id && l.status === 'Approved');
  const byType = new Map();
  for (const l of taken) byType.set(l.leaveType, (byType.get(l.leaveType) || 0) + l.days);
  return db.leaveTypes.map((t) => {
    const used = byType.get(t.name) || 0;
    const opening = t.code === 'CL' ? 12 : t.code === 'SL' ? 10 : t.code === 'EL' ? 24 : t.annualQuota;
    const entitled = opening || 0;
    return {
      id: `${s.id}-${t.id}`,
      typeId: t.id,
      code: t.code,
      name: t.name,
      entitled,
      used,
      balance: Math.max(0, entitled - used),
      encashable: t.encashable,
      carryForward: t.carryForward,
      paid: t.paid,
    };
  }).filter((l) => l.entitled > 0 || l.used > 0);
}

/** Multi-level approver trail for a leave request. */
function leaveTrail(l) {
  const r = rngFor('hrtrail' + l.id);
  const emp = byId(db.staff, l.employeeId);
  const hod = rPick(r, db.staff.filter((s) => s.department === l.department && s.id !== l.employeeId)) || emp;
  const levels = [
    { label: 'Applied by employee', by: l.employeeName, date: l.appliedOn, state: 'approved', note: l.reason },
    { label: 'Level 1 · Head of Department', by: hod ? hod.name : 'Department Head', date: l.appliedOn, state: 'approved', note: 'Substitute arrangement verified.' },
    {
      label: 'Level 2 · Principal',
      by: l.approverName || 'Principal',
      date: l.status === 'Pending' ? null : l.appliedOn,
      state: l.status === 'Approved' ? 'approved' : l.status === 'Rejected' ? 'rejected' : 'pending',
      note: l.status === 'Rejected' ? 'Peak assessment week — please re-apply after the cycle.'
        : l.status === 'Pending' ? 'Awaiting decision.' : 'Approved with pay.',
    },
    {
      label: 'Level 3 · HR record update',
      by: 'HR Executive',
      date: l.status === 'Approved' ? l.fromDate : null,
      state: l.status === 'Approved' ? 'approved' : 'pending',
      note: l.status === 'Approved' ? 'Balance debited and payroll informed.' : 'Blocked until the decision is made.',
    },
  ];
  return levels;
}

/* ==========================================================================
   2 · Employee directory  (hr/employees)
   ========================================================================== */

function employeeColumns() {
  return [
    {
      key: 'name', label: 'Employee', sticky: true, width: 250,
      render: (r) => empCell(r), value: (r) => r.name,
    },
    { key: 'employeeCode', label: 'Emp code', width: 120 },
    { key: 'designation', label: 'Designation', width: 170, filter: true },
    { key: 'department', label: 'Department', width: 150, filter: true },
    { key: 'type', label: 'Cadre', width: 118, filter: true, render: (r) => Badge(r.type, { tone: r.type === 'Teaching' ? 'brand' : 'neutral' }) },
    { key: 'campusId', label: 'Campus', width: 150, filter: true, render: (r) => campusName(r.campusId), value: (r) => campusName(r.campusId) },
    { key: 'employmentType', label: 'Employment', width: 130, filter: true, hidden: true },
    { key: 'band', label: 'Band', width: 80, align: 'center', filter: true, hidden: true },
    { key: 'joiningDate', label: 'Joined', width: 120, render: (r) => formatDate(r.joiningDate), value: (r) => r.joiningDate },
    { key: 'experienceYears', label: 'Exp (yrs)', width: 100, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round2(v)} yrs` },
    {
      key: 'attendancePct', label: 'Attendance', width: 130, align: 'right', numeric: true, aggregate: 'avg',
      format: (v) => `${round2(v)}%`,
      render: (r) => h('span', { className: r.attendancePct >= 95 ? 't-success' : r.attendancePct >= 88 ? '' : 't-warning' }, `${r.attendancePct}%`),
    },
    {
      key: 'salaryGross', label: 'Gross / month', width: 140, align: 'right', numeric: true, aggregate: 'sum',
      format: (v) => inrC(v), render: (r) => inr(r.salaryGross),
    },
    { key: 'appraisalRating', label: 'Last rating', width: 170, filter: true, hidden: true },
    { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
  ];
}

function employeeRowActions(row) {
  return [
    { label: 'Open 360 profile', icon: 'id-card', route: `hr/employee-profile/${row.id}` },
    { label: 'Payslips', icon: 'receipt', route: 'hr/payslips' },
    { label: 'Leave balance', icon: 'scale', route: 'hr/leave-balance' },
    { label: 'Documents', icon: 'folder', route: 'hr/documents' },
    { separator: true },
    { label: 'Email employee', icon: 'mail', onClick: () => copyToClipboard(row.email, `${row.email} copied`) },
    { label: 'Record resignation', icon: 'log-out', tone: 'danger', onClick: () => confirmResignation(row) },
  ];
}

function confirmResignation(row) {
  ConfirmDialog({
    title: `Record a resignation for ${row.name}?`,
    text: 'This starts the notice-period clock, opens the exit-clearance checklist and blocks new asset issues. HR can reverse it before the last working day.',
    confirmLabel: 'Start exit process', tone: 'danger', icon: 'log-out',
  }).then((ok) => { if (ok) notify({ title: 'Exit process started', text: `${row.name} moved to Notice Period · demo only`, tone: 'warning' }); });
}

function employeeCard(s) {
  const sal = salaryFor(s);
  return h('div', {
    className: 'hr-emp-card', attrs: { tabindex: '0', role: 'button', 'aria-label': `Open profile for ${s.name}` },
    onClick: () => navigate(`hr/employee-profile/${s.id}`),
    onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`hr/employee-profile/${s.id}`); } },
  },
    h('div', { className: 'hr-emp-card-top' },
      Avatar(s.name, { size: 'lg', ring: s.appraisalRating === 'Outstanding' }),
      h('div', { className: 'min-0 flex-1' },
        h('div', { className: 't-semibold t-truncate' }, s.name),
        h('div', { className: 't-sm t-muted t-truncate' }, s.designation),
        h('div', { className: 't-xs t-faint t-truncate' }, `${s.employeeCode} · ${campusName(s.campusId)}`))),
    h('div', { className: 'row-3 row-wrap' },
      Badge(s.status),
      Badge(s.type, { tone: s.type === 'Teaching' ? 'brand' : 'neutral' }),
      s.isClassTeacher && Badge('Class teacher', { tone: 'brand' })),
    h('div', { className: 'hr-emp-card-foot' },
      metric('Experience', `${s.experienceYears}y`),
      metric('Attendance', `${s.attendancePct}%`, s.attendancePct >= 95 ? 'success' : s.attendancePct >= 88 ? null : 'warning'),
      metric('Gross', inrC(sal.gross))));
}

const directoryRoutes = {
  'hr/employees': {
    title: 'Employee Directory',
    subtitle: 'Every person on the payroll across the five campuses',
    section: 'hr',
    render(mount, ctx) {
      injectStyles();
      const all = db.staff;
      const f = {
        campus: qOf(ctx).campus || currentCampus(ctx) || 'all',
        department: qOf(ctx).dept || 'all',
        designation: qOf(ctx).desig || 'all', type: qOf(ctx).type || 'all',
        status: qOf(ctx).status || 'all', employment: 'all', band: 'all', q: '',
      };
      let view = 'table';
      let rows = applyStaffFilters(all, f);

      const table = DataTable({
        columns: employeeColumns(),
        rows,
        selectable: true,
        footerAggregates: true,
        searchKeys: ['name', 'employeeCode', 'designation', 'department', 'email'],
        searchPlaceholder: 'Search by name, code, designation…',
        exportName: 'employee-directory',
        printable: true,
        maxHeight: '62vh',
        rowActions: employeeRowActions,
        onRowClick: (row) => navigate(`hr/employee-profile/${row.id}`),
        bulkActions: [
          { label: 'Send circular', icon: 'megaphone', onClick: (sel) => notify({ title: `Circular queued for ${sel.length} employees`, tone: 'success' }) },
          { label: 'Enrol in training', icon: 'lightbulb', onClick: (sel) => notify({ title: `${sel.length} employees added to the nomination list`, tone: 'success' }) },
          {
            label: 'Export selection', icon: 'download',
            onClick: (sel) => {
              download('employees-selection.csv', toCsv(sel, [
                { key: 'employeeCode', label: 'Code' }, { key: 'name', label: 'Name' },
                { key: 'designation', label: 'Designation' }, { key: 'salaryGross', label: 'Gross' },
              ]), 'text/csv;charset=utf-8');
              notify({ title: 'Selection exported', tone: 'success' });
            },
          },
        ],
        emptyState: emptyFor('No employees match these filters',
          'Try widening the campus or department filter, or clear the search box.',
          Button('Clear filters', { variant: 'secondary', icon: 'refresh', route: 'hr/employees' })),
      });

      const cardHost = h('div', { className: 'hr-emp-grid' });
      const cardFoot = h('div', { className: 'mt-4' });
      const paintCards = () => {
        cardHost.innerHTML = '';
        cardFoot.innerHTML = '';
        const shown = rows.slice(0, 48);
        if (!shown.length) {
          cardHost.appendChild(emptyFor('Nobody to show', 'No employee matches the current filter combination.'));
          return;
        }
        shown.forEach((s) => cardHost.appendChild(employeeCard(s)));
        if (rows.length > shown.length) {
          cardFoot.appendChild(h('div', { className: 'row-3 row-wrap' },
            h('span', { className: 't-sm t-muted' }, `Showing 48 of ${formatNumber(rows.length)} employees.`),
            Button('Switch to the table for the full list', { variant: 'link', icon: 'table', onClick: () => { view = 'table'; paintView(); } })));
        }
      };

      const viewHost = h('div');
      const paintView = () => {
        viewHost.innerHTML = '';
        if (view === 'cards') { paintCards(); viewHost.appendChild(cardHost); viewHost.appendChild(cardFoot); }
        else viewHost.appendChild(table);
      };

      const seg = SegmentedControl(
        [{ id: 'table', label: 'Table', icon: 'table' }, { id: 'cards', label: 'Cards', icon: 'grid' }],
        (id) => { view = id; paintView(); }, { active: 'table' },
      );

      const countLabel = h('span', { className: 't-sm t-muted' });
      const refresh = () => {
        rows = applyStaffFilters(all, f);
        table.refresh(rows);
        countLabel.textContent = `${formatNumber(rows.length)} of ${formatNumber(all.length)} employees`;
        if (view === 'cards') paintCards();
      };

      const k = analytics.kpis;
      const teaching = all.filter((s) => s.type === 'Teaching').length;
      const onNotice = all.filter((s) => s.status === 'Notice Period' || s.status === 'Resigned').length;
      const monthlyCost = all.reduce((t, s) => t + s.salaryGross, 0);
      const depts = DEPT_NAMES().slice(0, 8);

      const node = page({
        title: 'Employee Directory',
        subtitle: `${formatNumber(all.length)} employees · ${teaching} teaching · ${all.length - teaching} non-teaching · academic year 2026-27`,
        route: 'hr/employees',
        actions: [
          MenuButton([
            { header: true, label: 'Bulk operations' },
            { label: 'Import employees (XLSX)', icon: 'upload', onClick: mockAction('Import employees') },
            {
              label: 'Download directory', icon: 'download',
              onClick: () => {
                download('employee-directory.csv', toCsv(rows, employeeColumns().map((c) => ({ key: c.key, label: c.label, value: c.value }))), 'text/csv;charset=utf-8');
                notify({ title: 'Directory exported', tone: 'success' });
              },
            },
            { label: 'Print ID card batch', icon: 'print', onClick: mockAction('Print ID cards') },
            { separator: true },
            { label: 'Departments', icon: 'building', route: 'hr/departments' },
          ], { label: 'More', icon: 'more-horizontal' }),
          Button('Recruitment', { variant: 'secondary', icon: 'user-plus', route: 'hr/recruitment' }),
          Button('Add employee', { variant: 'primary', icon: 'user-plus', onClick: () => openAddEmployee() }),
        ],
        children: [
          kpiRow([
            { label: 'Total headcount', value: formatNumber(all.length), delta: 2.6, deltaLabel: 'vs last year', icon: 'users', tone: 'brand', trend: analytics.sparks.staffAttendance },
            { label: 'Teaching staff', value: formatNumber(teaching), icon: 'graduation-cap', tone: 'info', footer: `Student:teacher ratio ${k.studentTeacherRatio}:1` },
            { label: 'Avg staff attendance', value: `${k.avgStaffAttendance}%`, delta: 0.8, icon: 'clipboard-check', tone: 'success', trend: analytics.sparks.staffAttendance },
            { label: 'Monthly salary cost', value: inrC(monthlyCost), delta: 3.4, icon: 'banknote', tone: 'warning' },
            { label: 'On notice / exited', value: formatNumber(onNotice), icon: 'log-out', tone: 'danger', route: 'hr/resignations' },
          ]),
          Card({ className: 'p-0' }, FilterBar({
            filters: [
              { id: 'q', type: 'search', label: 'Search', placeholder: 'Name, code, designation…', width: '250px' },
              { id: 'campus', label: 'Campus', options: campusFilterOptions(), value: f.campus, allLabel: 'All campuses' },
              { id: 'department', label: 'Department', options: DEPT_NAMES(), value: f.department },
              { id: 'designation', label: 'Designation', options: DESIG_NAMES(), value: f.designation },
              { id: 'type', label: 'Cadre', options: ['Teaching', 'Non-Teaching'], value: f.type },
              { id: 'employment', label: 'Employment', options: ['Permanent', 'Contract', 'Probation'] },
              { id: 'status', label: 'Status', options: ['Active', 'On Leave', 'Notice Period', 'Resigned'], value: f.status },
            ],
            onChange: (id, value) => { f[id] = value; refresh(); },
            actions: Button('Reset', { variant: 'ghost', size: 'sm', icon: 'refresh', route: 'hr/employees' }),
          })),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-7' },
              SectionCard({ title: 'Headcount by department', subtitle: 'Teaching vs non-teaching split', className: 'chart-card' },
                barChart({
                  categories: depts,
                  series: [
                    { name: 'Teaching', values: depts.map((d) => all.filter((s) => s.department === d && s.type === 'Teaching').length) },
                    { name: 'Non-teaching', values: depts.map((d) => all.filter((s) => s.department === d && s.type !== 'Teaching').length) },
                  ],
                  stacked: true, horizontal: true, height: 300, title: 'Headcount by department',
                }))),
            h('div', { className: 'span-5' },
              SectionCard({ title: 'Employment type mix', subtitle: 'Permanent, contract and probation', className: 'chart-card' },
                donutChart({
                  data: countBy(all, 'employmentType'),
                  height: 300, centerValue: formatNumber(all.length), centerLabel: 'Employees',
                  title: 'Employment type mix',
                })))),
          SectionCard({
            title: 'Employees',
            subtitle: 'Click any row to open the 360° profile',
            actions: h('div', { className: 'row-3' }, countLabel, seg),
            flush: true,
          }, viewHost),
        ],
      });

      paintView();
      countLabel.textContent = `${formatNumber(rows.length)} of ${formatNumber(all.length)} employees`;
      mount.appendChild(node);
    },
  },
};

/** Add-employee modal (short form; the deep flow lives in onboarding). */
function openAddEmployee() {
  formPage({
    title: 'Add employee',
    subtitle: 'Creates a draft record — payroll starts only after documents are verified.',
    mode: 'modal', size: 'lg', submitLabel: 'Create employee',
    sections: [{
      title: 'Identity & posting', cols: 2,
      fields: [
        { id: 'firstName', label: 'First name', required: true, validate: validators.required },
        { id: 'lastName', label: 'Last name', required: true, validate: validators.required },
        { id: 'campus', label: 'Campus', type: 'select', required: true, options: campusFilterOptions() },
        { id: 'department', label: 'Department', type: 'select', required: true, options: DEPT_NAMES() },
        { id: 'designation', label: 'Designation', type: 'combobox', required: true, options: DESIG_NAMES() },
        { id: 'employmentType', label: 'Employment type', type: 'radio', inline: true, options: ['Permanent', 'Contract', 'Probation'], value: 'Permanent' },
        { id: 'joining', label: 'Date of joining', type: 'date', required: true },
        { id: 'phone', label: 'Mobile', type: 'tel', required: true, validate: validators.phone, placeholder: '+91 98xxxxxxxx' },
        { id: 'email', label: 'Work email', type: 'email', validate: validators.email, span: 'full', placeholder: 'first.last@springdale.edu.in' },
      ],
    }],
    onSubmit: (v) => notify({ title: 'Employee draft created', text: `${v.firstName || 'New employee'} ${v.lastName || ''} · onboarding checklist generated`, tone: 'success' }),
  });
}

/* ==========================================================================
   3 · Employee 360 profile  (hr/employee-profile)
   ========================================================================== */

function overviewTab(s) {
  const sal = salaryFor(s);
  return h('div', { className: 'stack' },
    h('div', { className: 'widget-grid' },
      h('div', { className: 'span-6' },
        SectionCard({ title: 'Personal details', icon: 'user' },
          DescriptionList([
            ['Full name', s.name],
            ['Gender', s.gender],
            ['Date of birth', `${formatDate(s.dob)} (${2026 - Number(String(s.dob).slice(0, 4))} yrs)`],
            ['Blood group', s.bloodGroup],
            ['Marital status', s.maritalStatus],
            ['PAN', s.pan],
            ['UAN', s.uan],
            ['Employee code', s.employeeCode],
          ], { cols: 2 }))),
      h('div', { className: 'span-6' },
        SectionCard({ title: 'Contact & address', icon: 'map-pin' },
          DescriptionList([
            ['Work email', h('a', { href: `mailto:${s.email}` }, s.email)],
            ['Mobile', s.phone],
            ['Address', addressLine(s.address)],
            ['Campus', campusName(s.campusId)],
          ], { cols: 1 }))),
      h('div', { className: 'span-6' },
        SectionCard({ title: 'Qualifications & expertise', icon: 'certificate' },
          DescriptionList([
            ['Highest qualification', s.qualification],
            ['Subjects', s.subjects.length ? s.subjects.join(', ') : 'Not applicable'],
            ['Total experience', `${s.experienceYears} years`],
            ['At Springdale', `${2026 - Number(String(s.joiningDate).slice(0, 4))} years`],
            ['Trainings completed', `${s.trainingsCompleted} programmes`],
            ['Weekly periods', s.type === 'Teaching' ? `${s.weeklyPeriods}` : 'Not applicable'],
          ], { cols: 2 }))),
      h('div', { className: 'span-6' },
        SectionCard({ title: 'Compensation snapshot', icon: 'banknote', className: 'chart-card' },
          donutChart({
            data: [
              { key: 'Basic', value: sal.basic }, { key: 'HRA', value: sal.hra },
              { key: 'DA', value: sal.da }, { key: 'Conveyance', value: sal.conveyance },
              { key: 'Special', value: sal.special },
            ],
            height: 240, centerValue: inrC(sal.gross), centerLabel: 'Gross / month',
            valueFormat: 'currency', title: 'Salary composition',
          }))),
      h('div', { className: 'span-12' },
        Callout({ tone: 'info', icon: 'info', title: 'Where this data comes from' },
          'Attendance is read from the biometric devices at ',
          h('strong', null, campusName(s.campusId)),
          ', payroll from the monthly run, and appraisal scores from the FY 2026-27 mid-year cycle.'))));
}

function jobTab(s) {
  const promo = promotions().filter((p) => p.employeeId === s.id);
  const teamMates = db.staff.filter((x) => x.department === s.department && x.campusId === s.campusId && x.id !== s.id).slice(0, 8);
  const principal = db.staff.find((x) => x.campusId === s.campusId && x.designation === 'Principal');
  return h('div', { className: 'stack' },
    SectionCard({ title: 'Current posting', icon: 'briefcase' },
      DescriptionList([
        ['Designation', s.designation],
        ['Department', s.department],
        ['Grade / band', s.band],
        ['Cadre', s.type],
        ['Employment type', s.employmentType],
        ['Date of joining', formatDate(s.joiningDate)],
        ['Confirmation date', formatDate(new Date(new Date(s.joiningDate).getTime() + 180 * 86400000))],
        ['Class teacher of', s.classTeacherOf || 'Not assigned'],
        ['Reports to', principal ? principal.name : 'Principal'],
        ['Status', Badge(s.status)],
      ], { cols: 2 })),
    SectionCard({ title: 'Career progression', icon: 'trending-up', subtitle: `${promo.length} recorded movement${promo.length === 1 ? '' : 's'}` },
      promo.length
        ? Timeline(promo.map((p) => ({
          title: `${p.type}: ${p.fromDesignation} → ${p.toDesignation}`,
          meta: `${formatDate(p.effectiveDate)} · recommended by ${p.recommendedBy}`,
          text: `${p.remarks} Gross moved from ${inr(p.salaryFrom)} to ${inr(p.salaryTo)} (+${p.hikePct}%).`,
          icon: 'trending-up', tone: 'success',
        })))
        : emptyFor('No movement recorded yet',
          'This employee has held the same designation since joining. Promotions appear here once approved.',
          Button('Open the promotions register', { variant: 'secondary', icon: 'trending-up', route: 'hr/promotions' }))),
    SectionCard({
      title: `Department colleagues · ${s.department}`, icon: 'users',
      actions: Button('View all', { variant: 'link', size: 'sm', onClick: () => navigate('hr/employees', { dept: s.department }) }),
    },
      teamMates.length
        ? h('div', { className: 'stack-2' }, teamMates.map((t) => h('div', { className: 'row-3' },
          h('div', { className: 'flex-1' }, empCell(t)),
          Badge(t.designation, { tone: 'neutral' }),
          h('span', { className: 't-sm t-muted t-num' }, `${t.attendancePct}%`))))
        : emptyFor('No colleagues in this department', 'This is currently a single-person department at this campus.')));
}

function attendanceTab(s) {
  const punches = db.staffAttendance.filter((a) => a.employeeId === s.id);
  const register = monthlyRegisterFor(s);
  const cal = attendanceCalendarFor(s);
  const late = punches.filter((p) => p.lateBy > 0);
  return h('div', { className: 'stack' },
    kpiRow([
      { label: 'Attendance YTD', value: `${s.attendancePct}%`, icon: 'clipboard-check', tone: s.attendancePct >= 95 ? 'success' : 'warning' },
      { label: 'Days present', value: formatNumber(register.reduce((t, r) => t + r.present, 0)), icon: 'check-circle', tone: 'brand' },
      { label: 'Late marks', value: formatNumber(register.reduce((t, r) => t + r.lateMarks, 0)), icon: 'clock', tone: 'warning' },
      { label: 'Leave taken', value: `${s.leaveTakenYtd} days`, icon: 'calendar', tone: 'info' },
    ]),
    SectionCard({ title: 'Daily attendance heat', subtitle: 'April 2026 to date · Sundays excluded', className: 'chart-card' },
      h('div', { className: 'stack-3' },
        heatmap({
          mode: 'calendar', days: cal, seriesName: 'Attendance', min: 0, max: 1,
          valueFormat: (v) => (v >= 1 ? 'Full day' : v >= 0.75 ? 'Late arrival' : v >= 0.5 ? 'Half day' : 'Absent'),
          title: 'Daily attendance heat',
        }),
        ScaleLegend(0, 1, { format: (v) => (v >= 1 ? 'Full day' : v >= 0.75 ? 'Late' : v >= 0.5 ? 'Half day' : 'Absent') }))),
    SectionCard({ title: 'Monthly register', subtitle: 'Working days, presence and overtime by month', flush: true },
      DataTable({
        columns: [
          { key: 'month', label: 'Month', width: 120, sticky: true },
          { key: 'workingDays', label: 'Working', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'present', label: 'Present', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'leave', label: 'Leave', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'absent', label: 'Absent', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'halfDay', label: 'Half day', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'lateMarks', label: 'Late marks', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'onDuty', label: 'On duty', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'overtimeHours', label: 'OT hours', align: 'right', numeric: true, aggregate: 'sum' },
          {
            key: 'percent', label: '%', width: 150, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round2(v)}%`,
            render: (r) => ProgressBar(r.percent, { size: 'sm', showValue: true, tone: r.percent >= 95 ? 'success' : r.percent >= 88 ? 'warning' : 'danger' }),
          },
        ],
        rows: register, paginate: false, searchable: false, footerAggregates: true, columnToggle: false,
        exportName: `${s.employeeCode}-attendance-register`,
      })),
    SectionCard({ title: 'Biometric punch log', subtitle: `${punches.length} punches captured this fortnight`, flush: true },
      punches.length
        ? DataTable({
          columns: [
            { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date), value: (r) => r.date },
            { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
            { key: 'inTime', label: 'In', width: 90, align: 'right', numeric: true, render: (r) => r.inTime || '—' },
            { key: 'outTime', label: 'Out', width: 90, align: 'right', numeric: true, render: (r) => r.outTime || '—' },
            { key: 'workedHours', label: 'Hours', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
            { key: 'lateBy', label: 'Late (min)', width: 110, align: 'right', numeric: true, render: (r) => (r.lateBy ? h('span', { className: 't-warning' }, `${r.lateBy} min`) : '—') },
            { key: 'source', label: 'Source', width: 120, filter: true },
          ],
          rows: sortBy(punches, 'date', 'desc'), pageSize: 10, searchable: false, footerAggregates: true,
          exportName: `${s.employeeCode}-punch-log`,
        })
        : emptyFor('No punches captured', 'The biometric device at this campus has not synced records for this employee yet.')),
    late.length
      ? Callout({ tone: 'warning', icon: 'clock', title: 'Late-mark pattern' },
        `${late.length} late arrivals in the last fortnight, averaging ${Math.round(late.reduce((t, p) => t + p.lateBy, 0) / late.length)} minutes. Three or more late marks in a month convert to a half-day deduction per the staff handbook.`)
      : Callout({ tone: 'success', icon: 'check-circle', title: 'Punctuality clean' }, 'No late marks in the current fortnight.'));
}

function leaveTab(s) {
  const ledger = leaveLedgerFor(s);
  const requests = db.leaveRequests.filter((l) => l.employeeId === s.id);
  return h('div', { className: 'stack' },
    SectionCard({ title: 'Leave balance', subtitle: 'Entitlement, consumed and available for FY 2026-27' },
      h('div', { className: 'hr-ring-row' },
        ledger.slice(0, 5).map((l, i) => ringTile(l.balance, l.entitled, l.code, `${l.used} of ${l.entitled} used`, seriesColor(i))))),
    SectionCard({ title: 'Ledger', flush: true },
      DataTable({
        columns: [
          { key: 'name', label: 'Leave type', width: 190, sticky: true },
          { key: 'code', label: 'Code', width: 80, align: 'center' },
          { key: 'entitled', label: 'Entitled', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'used', label: 'Used', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'balance', label: 'Balance', align: 'right', numeric: true, aggregate: 'sum', render: (r) => h('strong', { className: r.balance > 0 ? 't-success' : 't-muted' }, String(r.balance)) },
          { key: 'paid', label: 'Paid', width: 90, align: 'center', render: (r) => Badge(r.paid ? 'Paid' : 'Unpaid') },
          { key: 'encashable', label: 'Encashable', width: 120, align: 'center', render: (r) => Badge(r.encashable ? 'Yes' : 'No', { tone: r.encashable ? 'success' : 'neutral' }) },
          { key: 'carryForward', label: 'Carry forward', width: 130, align: 'center', render: (r) => Badge(r.carryForward ? 'Yes' : 'No', { tone: r.carryForward ? 'info' : 'neutral' }) },
        ],
        rows: ledger, paginate: false, searchable: false, footerAggregates: true, columnToggle: false,
        exportName: `${s.employeeCode}-leave-ledger`,
      })),
    SectionCard({
      title: 'Leave requests', subtitle: `${requests.length} applications this year`, flush: true,
      actions: Button('Apply on behalf', { variant: 'secondary', size: 'sm', icon: 'calendar-plus', onClick: () => openLeaveForm(s) }),
    },
      requests.length
        ? DataTable({
          columns: [
            { key: 'leaveType', label: 'Type', width: 160, filter: true },
            { key: 'fromDate', label: 'From', width: 120, render: (r) => formatDate(r.fromDate), value: (r) => r.fromDate },
            { key: 'toDate', label: 'To', width: 120, render: (r) => formatDate(r.toDate), value: (r) => r.toDate },
            { key: 'days', label: 'Days', width: 80, align: 'right', numeric: true, aggregate: 'sum' },
            { key: 'reason', label: 'Reason', width: 200 },
            { key: 'appliedOn', label: 'Applied', width: 130, render: (r) => relativeTime(r.appliedOn), value: (r) => r.appliedOn },
            { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
          ],
          rows: sortBy(requests, 'fromDate', 'desc'), pageSize: 10, searchable: false,
          onRowClick: (row) => openLeaveDetail(row),
          exportName: `${s.employeeCode}-leave-requests`,
        })
        : emptyFor('No leave applied this year',
          'This employee has not applied for leave in FY 2026-27.',
          Button('Apply on behalf', { variant: 'primary', icon: 'calendar-plus', onClick: () => openLeaveForm(s) }))));
}

function payrollTab(s) {
  const sal = salaryFor(s);
  const slips = db.payslips.filter((p) => p.employeeId === s.id);
  const empLoans = loans().filter((l) => l.employeeId === s.id);
  const structureRows = [
    { id: 'e1', name: 'Basic Pay', type: 'Earning', formula: `Grade basic (band ${s.band})`, monthly: sal.basic },
    { id: 'e2', name: 'House Rent Allowance', type: 'Earning', formula: '40% of Basic', monthly: sal.hra },
    { id: 'e3', name: 'Dearness Allowance', type: 'Earning', formula: '12% of Basic', monthly: sal.da },
    { id: 'e4', name: 'Conveyance Allowance', type: 'Earning', formula: 'Flat ₹2,400', monthly: sal.conveyance },
    { id: 'e5', name: 'Special Allowance', type: 'Earning', formula: 'Balancing figure to gross', monthly: sal.special },
    { id: 'd1', name: 'Provident Fund', type: 'Deduction', formula: '12% of Basic', monthly: sal.pf },
    { id: 'd2', name: 'Income Tax (TDS)', type: 'Deduction', formula: 'Projected annual slab', monthly: sal.tds },
    { id: 'd3', name: 'ESI', type: 'Deduction', formula: '0.75% of Gross if ≤ ₹21,000', monthly: sal.esi },
    { id: 'd4', name: 'Professional Tax', type: 'Deduction', formula: 'State slab', monthly: sal.pt },
  ];
  return h('div', { className: 'stack' },
    kpiRow([
      { label: 'Gross / month', value: inr(sal.gross), icon: 'banknote', tone: 'brand' },
      { label: 'Net / month', value: inr(sal.net), icon: 'wallet', tone: 'success' },
      { label: 'Annual CTC', value: inrC(sal.ctcAnnual), icon: 'chart-line', tone: 'info' },
      { label: 'Statutory deductions', value: inr(sal.deductions), icon: 'percent', tone: 'warning' },
    ]),
    h('div', { className: 'widget-grid' },
      h('div', { className: 'span-7' },
        SectionCard({ title: 'Gross to net', subtitle: 'How the monthly gross reduces to take-home', className: 'chart-card' },
          waterfallChart({
            items: [
              { label: 'Gross', value: sal.gross, type: 'start' },
              { label: 'EPF', value: -sal.pf },
              { label: 'TDS', value: -sal.tds },
              { label: 'ESI', value: -sal.esi },
              { label: 'PT', value: -sal.pt },
              { label: 'Net pay', value: sal.net, type: 'total' },
            ],
            valueFormat: 'currencyCompact', height: 300, title: 'Gross to net',
          }))),
      h('div', { className: 'span-5' },
        SectionCard({ title: 'Net pay trend', subtitle: 'Disbursed months of FY 2026-27', className: 'chart-card' },
          slips.length
            ? lineChart({
              categories: slips.map((p) => p.month.split(' ')[0]),
              series: [{ name: 'Net pay', values: slips.map((p) => p.net) }],
              valueFormat: 'currencyCompact', height: 300, showDots: true, title: 'Net pay trend',
            })
            : emptyFor('No payslips yet', 'The first payroll run covering this employee has not been disbursed.')))),
    SectionCard({
      title: 'Salary structure', subtitle: 'Component-wise breakdown with the applied formula', flush: true,
      actions: Button('Open structure builder', { variant: 'link', size: 'sm', icon: 'layers', route: 'hr/salary-structure' }),
    },
      DataTable({
        columns: [
          { key: 'name', label: 'Component', width: 220, sticky: true },
          { key: 'type', label: 'Type', width: 120, filter: true, render: (r) => Badge(r.type, { tone: r.type === 'Earning' ? 'success' : 'danger' }) },
          { key: 'formula', label: 'Formula', width: 300, render: (r) => h('code', { className: 'hr-formula' }, r.formula) },
          { key: 'monthly', label: 'Monthly', align: 'right', numeric: true, render: (r) => inr(r.monthly), value: (r) => r.monthly, aggregate: 'sum', format: inrC },
          { key: 'annual', label: 'Annual', align: 'right', numeric: true, render: (r) => inr(r.monthly * 12), value: (r) => r.monthly * 12 },
        ],
        rows: structureRows, paginate: false, searchable: false, columnToggle: false,
        exportName: `${s.employeeCode}-salary-structure`,
      })),
    SectionCard({
      title: 'Payslip history', flush: true,
      actions: Button('Download all', { variant: 'secondary', size: 'sm', icon: 'download', onClick: mockAction('Download payslip bundle') }),
    },
      slips.length
        ? DataTable({
          columns: [
            { key: 'month', label: 'Month', width: 120, sticky: true },
            { key: 'gross', label: 'Gross', align: 'right', numeric: true, render: (r) => inr(r.gross), value: (r) => r.gross, aggregate: 'sum', format: inrC },
            { key: 'pf', label: 'EPF', align: 'right', numeric: true, render: (r) => inr(r.pf), value: (r) => r.pf },
            { key: 'tds', label: 'TDS', align: 'right', numeric: true, render: (r) => inr(r.tds), value: (r) => r.tds },
            { key: 'lopDays', label: 'LOP days', align: 'right', numeric: true },
            { key: 'net', label: 'Net paid', align: 'right', numeric: true, render: (r) => h('strong', null, inr(r.net)), value: (r) => r.net, aggregate: 'sum', format: inrC },
            { key: 'paidOn', label: 'Paid on', width: 130, render: (r) => formatDate(r.paidOn), value: (r) => r.paidOn },
            { key: 'status', label: 'Status', width: 100, render: (r) => Badge(r.status) },
          ],
          rows: slips, paginate: false, searchable: false, footerAggregates: true,
          rowActions: (row) => [
            { label: 'View payslip', icon: 'receipt', onClick: () => openPayslip(row) },
            { label: 'Email to employee', icon: 'mail', onClick: mockAction('Email payslip') },
          ],
          onRowClick: (row) => openPayslip(row),
          exportName: `${s.employeeCode}-payslips`,
        })
        : emptyFor('No payslips', 'Payslips appear here once a payroll run covering this employee is disbursed.')),
    SectionCard({ title: 'Loans & advances', flush: true },
      empLoans.length
        ? DataTable({
          columns: [
            { key: 'type', label: 'Type', width: 160 },
            { key: 'principal', label: 'Principal', align: 'right', numeric: true, render: (r) => inr(r.principal), value: (r) => r.principal },
            { key: 'emi', label: 'EMI', align: 'right', numeric: true, render: (r) => inr(r.emi), value: (r) => r.emi },
            { key: 'installmentsPaid', label: 'Paid', align: 'right', numeric: true, render: (r) => `${r.installmentsPaid} / ${r.tenure}`, value: (r) => r.installmentsPaid },
            { key: 'outstanding', label: 'Outstanding', align: 'right', numeric: true, render: (r) => inr(r.outstanding), value: (r) => r.outstanding },
            { key: 'status', label: 'Status', width: 110, render: (r) => Badge(r.status) },
          ],
          rows: empLoans, paginate: false, searchable: false,
          onRowClick: (row) => openLoanDetail(row),
          exportName: `${s.employeeCode}-loans`,
        })
        : emptyFor('No active loans', 'This employee has no salary advance or loan running against their payroll.',
          Button('Raise an advance', { variant: 'secondary', icon: 'piggy-bank', onClick: () => openLoanForm(s) }))));
}

function appraisalTab(s) {
  const a = appraisalFor(s);
  return h('div', { className: 'stack' },
    kpiRow([
      { label: 'Final score', value: `${a.finalScore} / 5`, icon: 'star', tone: 'brand' },
      { label: 'Self assessment', value: `${a.selfScore} / 5`, icon: 'user-check', tone: 'info' },
      { label: 'Rating', value: a.rating, icon: 'award', tone: a.rating === 'Outstanding' ? 'success' : a.rating === 'Needs Improvement' ? 'danger' : 'warning' },
      { label: 'Recommended hike', value: `${a.hikeRecommended}%`, icon: 'trending-up', tone: 'success' },
    ]),
    h('div', { className: 'widget-grid' },
      h('div', { className: 'span-7' },
        SectionCard({ title: 'KRA scores — self vs reviewer', subtitle: 'FY 2026-27 mid-year cycle', className: 'chart-card' },
          barChart({
            categories: a.kras.map((k) => k.kra),
            series: [
              { name: 'Self', values: a.kras.map((k) => k.self) },
              { name: 'Reviewer', values: a.kras.map((k) => k.manager) },
            ],
            horizontal: true, height: 320, maxY: 5, valueFormat: 'decimal', title: 'KRA scores',
          }))),
      h('div', { className: 'span-5' },
        SectionCard({ title: 'Rating history', subtitle: 'Four appraisal cycles', className: 'chart-card' },
          lineChart({
            categories: a.history.map((x) => x.cycle),
            series: [{ name: 'Final score', values: a.history.map((x) => x.score) }],
            height: 320, minY: 0, maxY: 5, showDots: true, showEndLabels: true, valueFormat: 'decimal',
            target: 3.5, targetLabel: 'Expected', title: 'Rating history',
          })))),
    SectionCard({ title: 'Scorecard', flush: true },
      DataTable({
        columns: [
          { key: 'kra', label: 'Key result area', width: 260, sticky: true },
          { key: 'weight', label: 'Weight', align: 'right', numeric: true, render: (r) => `${r.weight}%`, value: (r) => r.weight, aggregate: 'sum', format: (v) => `${v}%` },
          { key: 'self', label: 'Self', align: 'right', numeric: true },
          { key: 'manager', label: 'Reviewer', align: 'right', numeric: true },
          { key: 'gap', label: 'Gap', align: 'right', numeric: true, render: (r) => h('span', { className: r.manager - r.self >= 0 ? 't-success' : 't-danger' }, round2(r.manager - r.self).toFixed(2)), value: (r) => round2(r.manager - r.self) },
          { key: 'weighted', label: 'Weighted', align: 'right', numeric: true, render: (r) => round2((r.manager * r.weight) / 100).toFixed(2), value: (r) => round2((r.manager * r.weight) / 100) },
        ],
        rows: a.kras.map((k, i) => ({ id: 'k' + i, ...k })),
        paginate: false, searchable: false, columnToggle: false, footerAggregates: true,
        exportName: `${s.employeeCode}-scorecard`,
      })),
    h('div', { className: 'widget-grid' },
      h('div', { className: 'span-6' }, Callout({ tone: 'success', icon: 'thumbs-up', title: 'Strengths' }, a.strengths)),
      h('div', { className: 'span-6' }, Callout({ tone: 'warning', icon: 'target', title: 'Development area' }, a.development))),
    SectionCard({ title: 'Reviewer & sign-off', icon: 'user-check' },
      ApprovalTrail([
        { label: 'Self assessment submitted', by: s.name, date: '2026-07-12', state: 'approved', note: `Self score ${a.selfScore}/5 across ${a.kras.length} KRAs.` },
        { label: 'Reviewer assessment', by: a.reviewer, date: '2026-07-24', state: 'approved', note: `Final score ${a.finalScore}/5 · rating ${a.rating}.` },
        { label: 'Normalisation committee', by: 'Principal + HR Manager', date: '2026-08-02', state: 'approved', note: `Hike recommendation ${a.hikeRecommended}% within band ${s.band}.` },
        { label: 'Employee acknowledgement', by: s.name, date: null, state: 'pending', note: 'Acknowledgement window closes 31 Aug 2026.' },
      ])));
}

function trainingRecordFor(s) {
  const r = rngFor('hrtrs' + s.id);
  const attended = db.trainings.filter((t) => (seedOf(s.id + t.id) % 3) === 0).slice(0, Math.max(1, s.trainingsCompleted));
  return attended.map((t) => ({
    ...t,
    attendanceStatus: t.status === 'Completed' ? (rBool(r, 0.88) ? 'Completed' : 'Absent') : 'Scheduled',
    score: rInt(r, 60, 98),
  }));
}

function trainingTab(s) {
  const rows = trainingRecordFor(s);
  const mandatoryPending = db.trainings.filter((t) => t.mandatory).length - rows.filter((x) => x.mandatory).length;
  return h('div', { className: 'stack' },
    kpiRow([
      { label: 'Programmes attended', value: String(rows.filter((x) => x.attendanceStatus === 'Completed').length), icon: 'lightbulb', tone: 'brand' },
      { label: 'Training hours', value: String(rows.reduce((t, x) => t + x.durationHours, 0)), icon: 'clock', tone: 'info' },
      { label: 'Mandatory pending', value: String(Math.max(0, mandatoryPending)), icon: 'alert-circle', tone: 'warning' },
      { label: 'Avg assessment', value: `${Math.round(rows.reduce((t, x) => t + x.score, 0) / Math.max(1, rows.length))}%`, icon: 'target', tone: 'success' },
    ]),
    SectionCard({
      title: 'Training record', flush: true,
      actions: Button('Nominate', { variant: 'secondary', size: 'sm', icon: 'user-plus', onClick: () => notify({ title: `${s.name} nominated`, text: 'Added to the next available programme · demo only', tone: 'success' }) }),
    },
      rows.length
        ? DataTable({
          columns: [
            { key: 'name', label: 'Programme', width: 280, sticky: true },
            { key: 'type', label: 'Type', width: 120, filter: true },
            { key: 'trainer', label: 'Trainer', width: 190 },
            { key: 'date', label: 'Date', width: 130, render: (x) => formatDate(x.date), value: (x) => x.date },
            { key: 'durationHours', label: 'Hours', align: 'right', numeric: true, aggregate: 'sum' },
            { key: 'score', label: 'Assessment', align: 'right', numeric: true, render: (x) => `${x.score}%`, value: (x) => x.score, aggregate: 'avg', format: (v) => `${Math.round(v)}%` },
            { key: 'mandatory', label: 'Mandatory', width: 120, align: 'center', render: (x) => Badge(x.mandatory ? 'Mandatory' : 'Optional', { tone: x.mandatory ? 'warning' : 'neutral' }) },
            { key: 'attendanceStatus', label: 'Status', width: 120, filter: true, render: (x) => Badge(x.attendanceStatus) },
          ],
          rows, paginate: false, searchable: false, footerAggregates: true, exportName: `${s.employeeCode}-training`,
        })
        : emptyFor('No training attended yet',
          'Nominate this employee for a CBSE capacity-building or compliance programme.',
          Button('Browse programmes', { variant: 'primary', icon: 'lightbulb', route: 'hr/training' }))));
}

function documentsTab(s) {
  const docs = documentsFor(s);
  const verified = docs.filter((d) => d.status === 'Verified').length;
  return h('div', { className: 'stack' },
    h('div', { className: 'widget-grid' },
      h('div', { className: 'span-4' },
        SectionCard({ title: 'File completeness', className: 'chart-card' },
          h('div', { className: 'hr-ring-row' },
            ringTile(verified, docs.length, 'Verified', `${docs.length - verified} outstanding`, 'var(--chart-1)')))),
      h('div', { className: 'span-8' },
        SectionCard({ title: 'Document wallet', subtitle: 'Mandatory files are marked with an asterisk' },
          FileList(docs.map((d) => ({
            name: `${d.name}${d.mandatory ? ' *' : ''}`,
            type: 'pdf', size: d.size || '—', date: d.uploadedOn, status: d.status,
          })), { onDownload: (f) => notify({ title: 'Download started', text: f.name, tone: 'info' }) })))),
    SectionCard({ title: 'Verification log', flush: true },
      DataTable({
        columns: [
          { key: 'name', label: 'Document', width: 240, sticky: true },
          { key: 'mandatory', label: 'Mandatory', width: 120, align: 'center', render: (d) => Badge(d.mandatory ? 'Yes' : 'No', { tone: d.mandatory ? 'warning' : 'neutral' }) },
          { key: 'status', label: 'Status', width: 140, filter: true, render: (d) => Badge(d.status) },
          { key: 'uploadedOn', label: 'Uploaded', width: 130, render: (d) => (d.uploadedOn ? formatDate(d.uploadedOn) : '—'), value: (d) => d.uploadedOn || '' },
          { key: 'validTill', label: 'Valid till', width: 130, render: (d) => (d.validTill ? formatDate(d.validTill) : '—'), value: (d) => d.validTill || '' },
          { key: 'verifiedBy', label: 'Verified by', width: 150, render: (d) => d.verifiedBy || '—' },
        ],
        rows: docs, rowKey: 'key', paginate: false, searchable: false, exportName: `${s.employeeCode}-documents`,
      })),
    Callout({ tone: 'info', icon: 'shield-check', title: 'POCSO & CBSE compliance' },
      'Police verification and medical fitness certificates must be revalidated every three years. HR is notified 60 days before expiry.'));
}

function assetsTab(s) {
  const items = assetsFor(s);
  return h('div', { className: 'stack' },
    SectionCard({ title: 'Assets issued', subtitle: `${items.length} item${items.length === 1 ? '' : 's'} allocated from the asset register`, flush: true },
      items.length
        ? DataTable({
          columns: [
            { key: 'tag', label: 'Asset tag', width: 130, sticky: true },
            { key: 'name', label: 'Item', width: 220 },
            { key: 'category', label: 'Category', width: 150, filter: true },
            { key: 'location', label: 'Location', width: 170 },
            { key: 'purchaseDate', label: 'Issued', width: 130, render: (a) => formatDate(a.purchaseDate), value: (a) => a.purchaseDate },
            { key: 'currentValue', label: 'Book value', align: 'right', numeric: true, render: (a) => inr(a.currentValue), value: (a) => a.currentValue, aggregate: 'sum', format: inrC },
            { key: 'condition', label: 'Condition', width: 120, filter: true, render: (a) => Badge(a.condition) },
            { key: 'status', label: 'Status', width: 120, filter: true, render: (a) => Badge(a.status) },
          ],
          rows: items, paginate: false, searchable: false, footerAggregates: true, exportName: `${s.employeeCode}-assets`,
        })
        : emptyFor('No assets issued',
          'Nothing from the asset register is currently allocated to this employee.',
          Button('Issue an asset', { variant: 'secondary', icon: 'package', onClick: mockAction('Issue asset') }))),
    Callout({ tone: 'warning', icon: 'alert-triangle', title: 'Exit dependency' },
      'Every issued asset must be returned and signed off by Administration before the exit clearance can be closed.'));
}

function profileTimeline(s) {
  const promo = promotions().filter((p) => p.employeeId === s.id);
  const leaves = db.leaveRequests.filter((l) => l.employeeId === s.id).slice(0, 3);
  const a = appraisalFor(s);
  const items = [
    { title: 'Joined Springdale', meta: formatDate(s.joiningDate), text: `${s.designation} · ${s.department} · ${campusName(s.campusId)}`, icon: 'log-in', tone: 'success' },
    { title: 'Probation confirmed', meta: formatDate(new Date(new Date(s.joiningDate).getTime() + 180 * 86400000)), text: 'Confirmation letter issued after a satisfactory six-month review.', icon: 'check-circle', tone: 'success' },
  ];
  promo.forEach((p) => items.push({ title: `${p.type} approved`, meta: formatDate(p.effectiveDate), text: `${p.fromDesignation} → ${p.toDesignation} · +${p.hikePct}% gross`, icon: 'trending-up', tone: 'info' }));
  leaves.forEach((l) => items.push({ title: `${l.leaveType} — ${l.status}`, meta: formatDate(l.fromDate), text: `${l.days} day(s) · ${l.reason}`, icon: 'calendar', tone: toneForStatus(l.status) }));
  items.push({ title: `Appraisal ${a.finalScore}/5`, meta: 'FY 2026-27 mid-year', text: `${a.rating} · reviewer ${a.reviewer}`, icon: 'star', tone: 'brand' });
  items.push({ title: 'Last biometric punch', meta: relativeTime('2026-08-19T07:52:00'), text: 'Main gate device SIG-BIO-04.', icon: 'fingerprint', tone: 'neutral' });
  return items;
}

const profileRoutes = {
  'hr/employee-profile': {
    title: 'Employee 360 Profile',
    subtitle: 'Personal, job, payroll, attendance, appraisal and exit in one record',
    section: 'hr',
    render(mount, ctx) {
      injectStyles();
      const id = ctx.param || db.staff[0].id;
      const s = byId(db.staff, id);
      if (!s) { mount.appendChild(missingRecord('employee', 'hr/employees')); return; }

      const sal = salaryFor(s);
      const ledger = leaveLedgerFor(s);
      const docs = documentsFor(s);
      const missingDocs = docs.filter((d) => d.status !== 'Verified').length;
      const a = appraisalFor(s);
      const empLoans = loans().filter((l) => l.employeeId === s.id && l.status === 'Active');

      mount.appendChild(detailPage({
        title: s.name,
        subtitle: `${s.designation} · ${s.department} · ${campusName(s.campusId)}`,
        route: 'hr/employee-profile',
        initials: s.avatarInitials,
        badges: [
          Badge(s.status),
          Badge(s.type, { tone: s.type === 'Teaching' ? 'brand' : 'neutral' }),
          Badge(s.employmentType, { tone: 'info' }),
          Badge(`Band ${s.band}`, { tone: 'neutral' }),
        ],
        meta: [
          { label: 'Employee code', value: s.employeeCode, icon: 'id-card' },
          { label: 'Joined', value: formatDate(s.joiningDate), icon: 'calendar' },
          { label: 'Experience', value: `${s.experienceYears} yrs`, icon: 'briefcase' },
          { label: 'Attendance', value: `${s.attendancePct}%`, icon: 'clipboard-check' },
          { label: 'Mobile', value: s.phone, icon: 'phone' },
        ],
        actions: [
          MenuButton([
            { header: true, label: 'Employee actions' },
            { label: 'Apply leave on behalf', icon: 'calendar-plus', onClick: () => openLeaveForm(s) },
            { label: 'Issue salary advance', icon: 'piggy-bank', onClick: () => openLoanForm(s) },
            { label: 'Nominate for training', icon: 'lightbulb', route: 'hr/training' },
            { label: 'Open appraisal cycle', icon: 'star', route: 'hr/appraisal' },
            { separator: true },
            { label: 'Record resignation', icon: 'log-out', tone: 'danger', onClick: () => confirmResignation(s) },
          ], { label: 'More actions' }),
          Button('Payslip', {
            variant: 'secondary', icon: 'receipt',
            onClick: () => {
              const slip = db.payslips.filter((p) => p.employeeId === s.id).slice(-1)[0];
              if (slip) openPayslip(slip); else notify({ title: 'No payslip yet', text: 'No disbursed run covers this employee.', tone: 'warning' });
            },
          }),
          Button('Edit employee', { variant: 'primary', icon: 'edit', onClick: () => openEditEmployee(s) }),
        ],
        tabs: [
          { id: 'overview', label: 'Overview', icon: 'user', render: () => overviewTab(s) },
          { id: 'job', label: 'Job & org', icon: 'briefcase', render: () => jobTab(s) },
          { id: 'attendance', label: 'Attendance', icon: 'clipboard-check', render: () => attendanceTab(s) },
          { id: 'leave', label: 'Leave', icon: 'calendar', count: db.leaveRequests.filter((l) => l.employeeId === s.id).length, render: () => leaveTab(s) },
          { id: 'payroll', label: 'Payroll', icon: 'banknote', render: () => payrollTab(s) },
          { id: 'appraisal', label: 'Appraisal', icon: 'star', render: () => appraisalTab(s) },
          { id: 'training', label: 'Training', icon: 'lightbulb', count: s.trainingsCompleted, render: () => trainingTab(s) },
          { id: 'documents', label: 'Documents', icon: 'folder', count: docs.length, render: () => documentsTab(s) },
          { id: 'assets', label: 'Assets', icon: 'package', count: assetsFor(s).length, render: () => assetsTab(s) },
        ],
        activeTab: qOf(ctx).tab || 'overview',
        sidebar: [
          SectionCard({ title: 'At a glance', icon: 'activity' },
            h('div', { className: 'stack-2' },
              MetricRow('Gross / month', inr(sal.gross)),
              MetricRow('Net / month', inr(sal.net)),
              MetricRow('Annual CTC', inrC(sal.ctcAnnual)),
              Divider(),
              MetricRow('Appraisal', `${a.finalScore} / 5`, Badge(a.rating)),
              MetricRow('Leave balance', `${ledger.reduce((t, l) => t + l.balance, 0)} days`),
              MetricRow('Documents', `${docs.length - missingDocs} / ${docs.length}`,
                Badge(missingDocs ? 'Action needed' : 'Compliant', { tone: missingDocs ? 'warning' : 'success' })))),
          SectionCard({ title: 'Leave balance', icon: 'scale' },
            h('div', { className: 'stack-2' },
              ledger.slice(0, 4).map((l) => ProgressBar(l.balance, {
                max: l.entitled, label: `${l.name} · ${l.balance} left`,
                tone: l.balance > l.entitled * 0.4 ? 'success' : l.balance > 0 ? 'warning' : 'danger',
              })))),
          SectionCard({ title: 'Bank & statutory', icon: 'building-columns' },
            DescriptionList([
              ['Bank', s.bankName], ['Account', s.accountMasked], ['IFSC', s.ifsc],
              ['UAN', s.uan], ['PAN', s.pan],
            ])),
          empLoans.length ? SectionCard({ title: 'Active loans', icon: 'piggy-bank' },
            h('div', { className: 'stack-3' }, empLoans.map((l) => h('div', { className: 'stack-1' },
              MetricRow(l.type, inr(l.outstanding)),
              ProgressBar(l.installmentsPaid, { max: l.tenure, size: 'sm', label: `${l.installmentsPaid} of ${l.tenure} EMIs paid`, tone: 'info' }))))) : null,
          SectionCard({ title: 'Quick links', icon: 'link' },
            h('div', { className: 'stack-2' },
              Button('Leave requests queue', { variant: 'subtle', block: true, icon: 'inbox', route: 'hr/leave-requests' }),
              Button('Payroll runs', { variant: 'subtle', block: true, icon: 'refresh', route: 'hr/payroll-runs' }),
              Button('Exit clearance', { variant: 'subtle', block: true, icon: 'check-circle', route: 'hr/exit-clearance' }))),
        ].filter(Boolean),
        timeline: profileTimeline(s),
      }));
    },
  },
};

function openEditEmployee(s) {
  formPage({
    title: `Edit ${s.name}`,
    subtitle: 'Changes flow to payroll from the next run.',
    mode: 'modal', size: 'lg', submitLabel: 'Save changes',
    values: { designation: s.designation, department: s.department, phone: s.phone, email: s.email, status: s.status, band: s.band },
    sections: [{
      title: 'Job details', cols: 2,
      fields: [
        { id: 'designation', label: 'Designation', type: 'combobox', options: DESIG_NAMES(), required: true },
        { id: 'department', label: 'Department', type: 'select', options: DEPT_NAMES(), required: true },
        { id: 'band', label: 'Band', type: 'select', options: BANDS() },
        { id: 'status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Notice Period', 'Resigned'] },
        { id: 'phone', label: 'Mobile', type: 'tel', validate: validators.phone },
        { id: 'email', label: 'Work email', type: 'email', validate: validators.email },
        { id: 'remarks', label: 'Reason for change', type: 'textarea', span: 'full', hint: 'Recorded in the audit log.' },
      ],
    }],
    onSubmit: () => notify({ title: 'Employee updated', text: `${s.name} · demo only, nothing was persisted`, tone: 'success' }),
  });
}

/* ==========================================================================
   4 · Departments & designations
   ========================================================================== */

function departmentRows() {
  return DEPT_NAMES().map((name, i) => {
    const staffIn = db.staff.filter((s) => s.department === name);
    const teaching = staffIn.filter((s) => s.type === 'Teaching').length;
    const cost = staffIn.reduce((t, s) => t + s.salaryGross, 0);
    const head = sortBy(staffIn, 'experienceYears', 'desc')[0];
    const rec = db.recruitments.filter((x) => x.department === name);
    return {
      id: 'DEP' + String(i + 1).padStart(2, '0'),
      name,
      headcount: staffIn.length,
      teaching,
      nonTeaching: staffIn.length - teaching,
      headId: head ? head.id : null,
      head: head ? head.name : '—',
      avgAttendance: staffIn.length ? round2(staffIn.reduce((t, s) => t + s.attendancePct, 0) / staffIn.length) : 0,
      avgExperience: staffIn.length ? round2(staffIn.reduce((t, s) => t + s.experienceYears, 0) / staffIn.length) : 0,
      monthlyCost: cost,
      openPositions: rec.filter((x) => x.status !== 'Closed').reduce((t, x) => t + x.openings, 0),
      onNotice: staffIn.filter((s) => s.status === 'Notice Period').length,
      campuses: new Set(staffIn.map((s) => s.campusId)).size,
    };
  });
}

const orgRoutes = {
  'hr/departments': {
    title: 'Departments',
    subtitle: 'Headcount, cost and leadership for every department',
    section: 'hr',
    render(mount) {
      injectStyles();
      const rows = sortBy(departmentRows(), 'headcount', 'desc');
      const totalCost = rows.reduce((t, r) => t + r.monthlyCost, 0);

      mount.appendChild(listPage({
        title: 'Departments',
        subtitle: `${rows.length} departments · ${formatNumber(db.staff.length)} employees · ${inrC(totalCost)} monthly salary cost`,
        route: 'hr/departments',
        actions: [
          Button('Designations', { variant: 'secondary', icon: 'layers', route: 'hr/designations' }),
          Button('Add department', { variant: 'primary', icon: 'plus', onClick: () => openDepartmentForm() }),
        ],
        kpis: [
          { label: 'Departments', value: String(rows.length), icon: 'building', tone: 'brand' },
          { label: 'Largest department', value: rows[0].name, icon: 'users', tone: 'info', footer: `${rows[0].headcount} employees` },
          { label: 'Monthly cost', value: inrC(totalCost), icon: 'banknote', tone: 'warning' },
          { label: 'Open positions', value: String(rows.reduce((t, r) => t + r.openPositions, 0)), icon: 'user-plus', tone: 'success', route: 'hr/recruitment' },
        ],
        chart: treemap({
          data: rows.map((r) => ({ key: r.name, value: r.headcount })),
          height: 320, title: 'Headcount distribution across departments',
        }),
        chartTitle: 'Headcount distribution',
        chartActions: Button('Open HR analytics', { variant: 'link', size: 'sm', icon: 'chart-bar', route: 'hr/reports' }),
        columns: [
          { key: 'name', label: 'Department', width: 190, sticky: true, render: (r) => h('div', { className: 'row-3' }, Icon('building', 15), h('strong', null, r.name)), value: (r) => r.name },
          { key: 'head', label: 'Senior-most', width: 220, render: (r) => (r.headId ? empCellById(r.headId) : '—'), value: (r) => r.head },
          {
            key: 'headcount', label: 'Headcount', align: 'right', numeric: true, aggregate: 'sum',
            render: (r) => Button(String(r.headcount), { variant: 'link', size: 'sm', onClick: (e) => { e.stopPropagation(); navigate('hr/employees', { dept: r.name }); } }),
          },
          { key: 'teaching', label: 'Teaching', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'nonTeaching', label: 'Non-teaching', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'campuses', label: 'Campuses', align: 'right', numeric: true },
          { key: 'avgExperience', label: 'Avg exp', align: 'right', numeric: true, render: (r) => `${r.avgExperience} yrs`, value: (r) => r.avgExperience, aggregate: 'avg', format: (v) => `${round2(v)} yrs` },
          { key: 'avgAttendance', label: 'Attendance', align: 'right', numeric: true, render: (r) => `${r.avgAttendance}%`, value: (r) => r.avgAttendance, aggregate: 'avg', format: (v) => `${round2(v)}%` },
          { key: 'monthlyCost', label: 'Monthly cost', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.monthlyCost), value: (r) => r.monthlyCost },
          { key: 'openPositions', label: 'Open roles', align: 'right', numeric: true, aggregate: 'sum', render: (r) => (r.openPositions ? Badge(String(r.openPositions), { tone: 'warning' }) : '—'), value: (r) => r.openPositions },
        ],
        rows,
        footerAggregates: true,
        searchKeys: ['name', 'head'],
        expandable: (r) => {
          const staffIn = db.staff.filter((s) => s.department === r.name);
          const byDesig = countBy(staffIn, 'designation').slice(0, 8);
          return h('div', { className: 'stack-3' },
            h('div', { className: 'grid grid-2' },
              SectionCard({ title: 'Designation mix', className: 'chart-card' },
                barChart({ categories: byDesig.map((d) => d.key), series: [{ name: 'Employees', values: byDesig.map((d) => d.value) }], horizontal: true, height: 230, title: `${r.name} designation mix` })),
              SectionCard({ title: 'Longest serving' },
                RankList(sortBy(staffIn, 'experienceYears', 'desc').slice(0, 6).map((s) => ({ name: s.name, meta: `${s.designation} · ${campusName(s.campusId)}`, value: `${s.experienceYears} yrs` }))))),
            h('div', { className: 'row-3 row-wrap' },
              Button('Open employees', { variant: 'secondary', size: 'sm', icon: 'users', onClick: () => navigate('hr/employees', { dept: r.name }) }),
              Button('Open roles', { variant: 'ghost', size: 'sm', icon: 'user-plus', route: 'hr/recruitment' })));
        },
        rowActions: (r) => [
          { label: 'View employees', icon: 'users', onClick: () => navigate('hr/employees', { dept: r.name }) },
          { label: 'HR report', icon: 'chart-bar', route: 'hr/reports' },
          { label: 'Edit department', icon: 'edit', onClick: () => openDepartmentForm(r) },
        ],
        exportName: 'departments',
        emptyState: emptyFor('No departments', 'Create the first department to start grouping employees.'),
      }));
    },
  },

  'hr/designations': {
    title: 'Designations & Grades',
    subtitle: 'Salary bands, headcount and pay-range compliance',
    section: 'hr',
    render(mount) {
      injectStyles();
      const rows = db.designations.map((d) => {
        const holders = db.staff.filter((s) => s.designation === d.name);
        const avgBasic = holders.length ? Math.round(holders.reduce((t, s) => t + s.salaryBasic, 0) / holders.length) : 0;
        const outOfBand = holders.filter((s) => s.salaryBasic < d.minSalary || s.salaryBasic > d.maxSalary).length;
        return {
          ...d,
          headcount: holders.length,
          avgBasic,
          midpoint: Math.round((d.minSalary + d.maxSalary) / 2),
          compaRatio: avgBasic ? round2((avgBasic / ((d.minSalary + d.maxSalary) / 2)) * 100) : 0,
          outOfBand,
          teaching: holders.filter((s) => s.type === 'Teaching').length,
        };
      });
      const withHolders = rows.filter((r) => r.headcount > 0);

      mount.appendChild(listPage({
        title: 'Designations & Grades',
        subtitle: `${rows.length} designations across ${BANDS().length} pay bands · compa-ratio benchmarked against the band midpoint`,
        route: 'hr/designations',
        actions: [
          Button('Departments', { variant: 'secondary', icon: 'building', route: 'hr/departments' }),
          Button('Add designation', { variant: 'primary', icon: 'plus', onClick: () => openDesignationForm() }),
        ],
        kpis: [
          { label: 'Designations', value: String(rows.length), icon: 'layers', tone: 'brand' },
          { label: 'Pay bands', value: String(BANDS().length), icon: 'scale', tone: 'info' },
          { label: 'Out-of-band salaries', value: String(rows.reduce((t, r) => t + r.outOfBand, 0)), icon: 'alert-triangle', tone: 'danger' },
          { label: 'Avg compa-ratio', value: `${round2(withHolders.reduce((t, r) => t + r.compaRatio, 0) / Math.max(1, withHolders.length))}%`, icon: 'percent', tone: 'success' },
        ],
        chart: bulletChart({
          items: sortBy(withHolders, 'headcount', 'desc').slice(0, 10).map((r) => ({
            label: r.name, value: r.avgBasic, target: r.midpoint, ranges: [r.minSalary, r.maxSalary],
          })),
          valueFormat: 'currencyCompact', title: 'Average basic pay against the approved band',
        }),
        chartTitle: 'Average basic pay against the approved band',
        columns: [
          { key: 'name', label: 'Designation', width: 200, sticky: true },
          { key: 'department', label: 'Department', width: 150, filter: true },
          { key: 'band', label: 'Band', width: 80, align: 'center', filter: true, render: (r) => Badge(r.band, { tone: 'neutral' }) },
          { key: 'headcount', label: 'Headcount', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'teaching', label: 'Teaching', align: 'right', numeric: true, aggregate: 'sum', hidden: true },
          { key: 'minSalary', label: 'Band min', align: 'right', numeric: true, render: (r) => inr(r.minSalary), value: (r) => r.minSalary },
          { key: 'midpoint', label: 'Midpoint', align: 'right', numeric: true, render: (r) => inr(r.midpoint), value: (r) => r.midpoint },
          { key: 'maxSalary', label: 'Band max', align: 'right', numeric: true, render: (r) => inr(r.maxSalary), value: (r) => r.maxSalary },
          { key: 'avgBasic', label: 'Avg basic', align: 'right', numeric: true, render: (r) => (r.avgBasic ? inr(r.avgBasic) : '—'), value: (r) => r.avgBasic, aggregate: 'avg', format: inrC },
          {
            key: 'compaRatio', label: 'Compa-ratio', align: 'right', numeric: true,
            render: (r) => (r.headcount ? Badge(`${r.compaRatio}%`, { tone: r.compaRatio > 110 ? 'danger' : r.compaRatio < 85 ? 'warning' : 'success' }) : '—'),
            value: (r) => r.compaRatio,
          },
          { key: 'outOfBand', label: 'Exceptions', align: 'right', numeric: true, aggregate: 'sum', render: (r) => (r.outOfBand ? h('span', { className: 't-danger' }, String(r.outOfBand)) : '—'), value: (r) => r.outOfBand },
        ],
        rows,
        footerAggregates: true,
        searchKeys: ['name', 'department', 'band'],
        rowActions: (r) => [
          { label: 'View holders', icon: 'users', onClick: () => navigate('hr/employees', { desig: r.name }) },
          { label: 'Edit band', icon: 'edit', onClick: () => openDesignationForm(r) },
          { label: 'Salary structure', icon: 'layers', route: 'hr/salary-structure' },
        ],
        onRowClick: (r) => navigate('hr/employees', { desig: r.name }),
        exportName: 'designations',
        notes: Callout({ tone: 'info', icon: 'info', title: 'How to read compa-ratio' },
          'Compa-ratio is the average basic pay divided by the band midpoint. Below 85% suggests under-payment against the approved grade; above 110% needs a management exception note at the next appraisal cycle.'),
        emptyState: emptyFor('No designations configured', 'Add a designation to define a pay band.'),
      }));
    },
  },
};

function openDepartmentForm(dept) {
  formPage({
    title: dept ? `Edit ${dept.name}` : 'Add department',
    mode: 'modal', size: 'md', submitLabel: dept ? 'Save department' : 'Create department',
    values: dept ? { name: dept.name } : {},
    sections: [{
      title: 'Department', cols: 1,
      fields: [
        { id: 'name', label: 'Department name', required: true, validate: validators.required },
        { id: 'head', label: 'Department head', type: 'combobox', options: db.staff.slice(0, 120).map((s) => ({ value: s.id, label: `${s.name} — ${s.designation}` })) },
        { id: 'campus', label: 'Primary campus', type: 'select', options: campusFilterOptions() },
        { id: 'costCentre', label: 'Cost centre code', placeholder: 'e.g. CC-ACAD-01' },
      ],
    }],
    onSubmit: (v) => notify({ title: dept ? 'Department updated' : 'Department created', text: v.name, tone: 'success' }),
  });
}

function openDesignationForm(d) {
  formPage({
    title: d ? `Edit ${d.name}` : 'Add designation',
    mode: 'modal', size: 'md', submitLabel: 'Save designation',
    values: d ? { name: d.name, department: d.department, band: d.band, min: d.minSalary, max: d.maxSalary } : {},
    sections: [{
      title: 'Designation & pay band', cols: 2,
      fields: [
        { id: 'name', label: 'Designation', required: true, validate: validators.required, span: 'full' },
        { id: 'department', label: 'Department', type: 'select', options: DEPT_NAMES(), required: true },
        { id: 'band', label: 'Band', type: 'select', options: BANDS(), required: true },
        { id: 'min', label: 'Band minimum (basic)', type: 'number', required: true, validate: validators.number },
        { id: 'max', label: 'Band maximum (basic)', type: 'number', required: true, validate: validators.number },
        { id: 'notes', label: 'Grade notes', type: 'textarea', span: 'full' },
      ],
    }],
    onSubmit: (v) => notify({ title: 'Designation saved', text: `${v.name} · band ${v.band}`, tone: 'success' }),
  });
}

/* ==========================================================================
   5 · Recruitment · applicants · interviews · onboarding
   ========================================================================== */

const PIPELINE_STAGES = [
  { id: 'Applied', title: 'Applied', color: 'var(--chart-1)' },
  { id: 'Screening', title: 'Screening', color: 'var(--chart-2)' },
  { id: 'Shortlisted', title: 'Shortlisted', color: 'var(--chart-3)' },
  { id: 'Interview', title: 'Interview', color: 'var(--chart-4)' },
  { id: 'Demo Class', title: 'Demo class', color: 'var(--chart-5)' },
  { id: 'Offered', title: 'Offered', color: 'var(--chart-6)' },
  { id: 'Rejected', title: 'Rejected', color: 'var(--chart-other)' },
];

const recruitmentRoutes = {
  'hr/recruitment': {
    title: 'Open Positions',
    subtitle: 'Requisitions, pipeline health and time-to-fill',
    section: 'hr',
    render(mount) {
      injectStyles();
      const rows = db.recruitments;
      const open = rows.filter((r) => r.status !== 'Closed');
      const totalOpenings = open.reduce((t, r) => t + r.openings, 0);
      const funnel = [
        { label: 'Applications', value: rows.reduce((t, r) => t + r.applicants, 0) },
        { label: 'Shortlisted', value: rows.reduce((t, r) => t + r.shortlisted, 0) },
        { label: 'Interviewed', value: rows.reduce((t, r) => t + r.interviewed, 0) },
        { label: 'Offered', value: rows.reduce((t, r) => t + r.offered, 0) },
        { label: 'Joined', value: rows.reduce((t, r) => t + r.joined, 0) },
      ];

      mount.appendChild(listPage({
        title: 'Open Positions',
        subtitle: `${open.length} live requisitions · ${totalOpenings} seats · ${formatNumber(db.applicants.length)} applicants in the pipeline`,
        route: 'hr/recruitment',
        actions: [
          Button('Applicants', { variant: 'secondary', icon: 'users', route: 'hr/applicants' }),
          Button('Interviews', { variant: 'secondary', icon: 'calendar-check', route: 'hr/interviews' }),
          Button('Post a position', { variant: 'primary', icon: 'plus', onClick: () => openRequisitionForm() }),
        ],
        kpis: [
          { label: 'Live requisitions', value: String(open.length), icon: 'clipboard-list', tone: 'brand' },
          { label: 'Seats to fill', value: String(totalOpenings), icon: 'user-plus', tone: 'info' },
          { label: 'Applicants', value: formatNumber(db.applicants.length), icon: 'users', tone: 'success', route: 'hr/applicants' },
          { label: 'Offers released', value: String(rows.reduce((t, r) => t + r.offered, 0)), icon: 'handshake', tone: 'warning' },
          { label: 'Joined YTD', value: String(rows.reduce((t, r) => t + r.joined, 0)), icon: 'log-in', tone: 'success', route: 'hr/onboarding' },
        ],
        chart: funnelChart({ stages: funnel, showConversion: true, height: 300, title: 'Hiring funnel — application to joining' }),
        chartTitle: 'Hiring funnel',
        columns: [
          { key: 'position', label: 'Position', width: 230, sticky: true, render: (r) => h('div', { className: 'stack-1' }, h('strong', null, r.position), h('span', { className: 't-xs t-muted' }, `${r.experienceRequired} · ${r.salaryRange}`)), value: (r) => r.position },
          { key: 'department', label: 'Department', width: 150, filter: true },
          { key: 'campusId', label: 'Campus', width: 150, filter: true, render: (r) => campusName(r.campusId), value: (r) => campusName(r.campusId) },
          { key: 'openings', label: 'Seats', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'applicants', label: 'Applicants', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'shortlisted', label: 'Shortlisted', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'interviewed', label: 'Interviewed', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'offered', label: 'Offered', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'joined', label: 'Joined', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'postedOn', label: 'Posted', width: 120, render: (r) => formatDate(r.postedOn), value: (r) => r.postedOn },
          { key: 'closingDate', label: 'Closes', width: 120, render: (r) => formatDate(r.closingDate), value: (r) => r.closingDate },
          { key: 'priority', label: 'Priority', width: 110, filter: true, render: (r) => Badge(r.priority, { tone: r.priority === 'High' ? 'danger' : r.priority === 'Medium' ? 'warning' : 'neutral' }) },
          { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        footerAggregates: true,
        selectable: true,
        searchKeys: ['position', 'department'],
        bulkActions: [
          { label: 'Repost to job boards', icon: 'megaphone', onClick: (sel) => notify({ title: `${sel.length} positions reposted`, tone: 'success' }) },
          { label: 'Close requisitions', icon: 'x-circle', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} requisitions closed`, tone: 'danger' }) },
        ],
        expandable: (r) => {
          const apps = db.applicants.filter((a) => a.recruitmentId === r.id);
          const stages = PIPELINE_STAGES.map((st) => ({ key: st.title, value: apps.filter((a) => a.stage === st.id).length })).filter((x) => x.value);
          return h('div', { className: 'grid grid-2' },
            SectionCard({ title: 'Pipeline by stage', className: 'chart-card' },
              stages.length ? donutChart({ data: stages, height: 220, centerValue: String(apps.length), centerLabel: 'Applicants', title: `${r.position} pipeline` })
                : emptyFor('No applicants yet', 'Share the job link to start receiving applications.')),
            SectionCard({ title: 'Top-rated applicants' },
              RankList(sortBy(apps.filter((a) => a.rating), 'rating', 'desc').slice(0, 6).map((a) => ({
                name: a.name, meta: `${a.experienceYears} yrs · ${a.currentEmployer}`, value: `${a.rating}★`,
              })))));
        },
        rowActions: (r) => [
          { label: 'View applicants', icon: 'users', onClick: () => navigate('hr/applicants', { req: r.id }) },
          { label: 'Schedule interviews', icon: 'calendar-check', route: 'hr/interviews' },
          { label: 'Edit requisition', icon: 'edit', onClick: () => openRequisitionForm(r) },
          { separator: true },
          { label: 'Close position', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: `Close ${r.position}?`, text: 'Applicants still in the pipeline will be marked as “position closed”.', confirmLabel: 'Close position', tone: 'danger' }).then((ok) => ok && notify({ title: 'Position closed', tone: 'warning' })) },
        ],
        onRowClick: (r) => navigate('hr/applicants', { req: r.id }),
        exportName: 'open-positions',
        emptyState: emptyFor('No open positions', 'Post a requisition to start hiring.', Button('Post a position', { variant: 'primary', icon: 'plus', onClick: () => openRequisitionForm() })),
      }));
    },
  },

  'hr/applicants': {
    title: 'Applicant Pipeline',
    subtitle: 'Drag candidates between stages · click a card for the full profile',
    section: 'hr',
    render(mount, ctx) {
      injectStyles();
      const f = { req: qOf(ctx).req || 'all', source: 'all', campus: 'all' };
      let pool = db.applicants;
      if (f.req !== 'all') pool = pool.filter((a) => a.recruitmentId === f.req);

      const toCard = (a) => ({
        id: a.id,
        columnId: a.stage,
        title: a.name,
        meta: `${a.position} · ${a.experienceYears} yrs · ${a.source}`,
        badge: a.rating ? `${a.rating}★` : null,
        tone: a.rating >= 4 ? 'success' : a.rating >= 3 ? 'info' : 'neutral',
        avatar: a.name,
      });

      const node = kanbanPage({
        title: 'Applicant Pipeline',
        subtitle: `${formatNumber(pool.length)} applicants across ${PIPELINE_STAGES.length} stages`,
        route: 'hr/applicants',
        actions: [
          Button('Open positions', { variant: 'secondary', icon: 'clipboard-list', route: 'hr/recruitment' }),
          Button('Add applicant', { variant: 'primary', icon: 'user-plus', onClick: () => openApplicantForm() }),
        ],
        kpis: [
          { label: 'Total applicants', value: formatNumber(db.applicants.length), icon: 'users', tone: 'brand' },
          { label: 'Shortlisted', value: String(db.applicants.filter((a) => a.stage === 'Shortlisted').length), icon: 'user-check', tone: 'info' },
          { label: 'In interview', value: String(db.applicants.filter((a) => ['Interview', 'Demo Class'].includes(a.stage)).length), icon: 'calendar-check', tone: 'warning', route: 'hr/interviews' },
          { label: 'Offered', value: String(db.applicants.filter((a) => a.stage === 'Offered').length), icon: 'handshake', tone: 'success', route: 'hr/onboarding' },
        ],
        filters: [
          { id: 'req', label: 'Position', options: db.recruitments.map((r) => ({ value: r.id, label: r.position })), value: f.req },
          { id: 'source', label: 'Source', options: ['Naukri', 'LinkedIn', 'Referral', 'Walk-in', 'Website', 'Consultant'] },
          { id: 'campus', label: 'Campus', options: campusFilterOptions() },
        ],
        onFilter: (id, value, all) => {
          let out = db.applicants;
          if (all.req && all.req !== 'all') out = out.filter((a) => a.recruitmentId === all.req);
          if (all.source && all.source !== 'all') out = out.filter((a) => a.source === all.source);
          if (all.campus && all.campus !== 'all') out = out.filter((a) => a.campusId === all.campus);
          node.board.refresh(out.map(toCard));
          notify({ title: `${out.length} applicants match`, tone: 'info', duration: 1800 });
        },
        columns: PIPELINE_STAGES.map((s) => ({ ...s, limit: s.id === 'Interview' ? 40 : undefined })),
        cards: pool.map(toCard),
        onMove: (cardId, toColumnId) => {
          const a = byId(db.applicants, cardId);
          notify({ title: `${a ? a.name : cardId} moved to ${toColumnId}`, text: 'Stage change is demo only.', tone: 'success' });
        },
        onCardClick: (card) => openApplicantDrawer(byId(db.applicants, card.id)),
      });
      mount.appendChild(node);
    },
  },

  'hr/interviews': {
    title: 'Interview Schedule',
    subtitle: 'Panel calendar, scorecards and hiring recommendations',
    section: 'hr',
    render(mount, ctx) {
      injectStyles();
      const all = interviews();
      const month = qOf(ctx).month || '2026-08';
      const events = all.map((iv) => ({
        date: iv.date,
        title: `${iv.time} · ${iv.name}`,
        meta: `${iv.round} · ${iv.mode}`,
        tone: iv.status === 'Completed' ? 'success' : 'info',
        badge: iv.status === 'Completed' ? `${iv.overall}★` : 'Scheduled',
        __id: iv.id,
      }));
      const upcoming = all.filter((iv) => iv.status === 'Scheduled');
      const completed = all.filter((iv) => iv.status === 'Completed');

      const node = calendarPage({
        title: 'Interview Schedule',
        subtitle: `${all.length} interviews · ${upcoming.length} upcoming · ${completed.length} scorecards submitted`,
        route: 'hr/interviews',
        month,
        events,
        actions: [
          Button('Applicant pipeline', { variant: 'secondary', icon: 'users', route: 'hr/applicants' }),
          Button('Schedule interview', { variant: 'primary', icon: 'calendar-plus', onClick: () => openInterviewForm() }),
        ],
        kpis: [
          { label: 'Scheduled', value: String(upcoming.length), icon: 'calendar-check', tone: 'info' },
          { label: 'Completed', value: String(completed.length), icon: 'check-circle', tone: 'success' },
          { label: 'Avg panel score', value: `${round2(completed.reduce((t, iv) => t + iv.overall, 0) / Math.max(1, completed.length))} / 5`, icon: 'star', tone: 'brand' },
          { label: 'Strong hires', value: String(completed.filter((iv) => iv.recommendation === 'Strong hire').length), icon: 'thumbs-up', tone: 'success' },
        ],
        onSelectEvent: (ev) => {
          const iv = all.find((x) => x.id === ev.__id);
          if (iv) openScorecard(iv);
        },
        onSelectDate: (date) => {
          const dayList = all.filter((iv) => iv.date === date);
          if (!dayList.length) { notify({ title: `No interviews on ${formatDate(date)}`, tone: 'info' }); return; }
          Drawer({
            title: formatDate(date), subtitle: `${dayList.length} interview${dayList.length === 1 ? '' : 's'} scheduled`, size: 'lg',
            body: h('div', { className: 'stack-2' }, dayList.map((iv) => Card({ pad: true, onClick: () => openScorecard(iv) },
              h('div', { className: 'row-3' },
                Avatar(iv.name, { size: 'sm' }),
                h('div', { className: 'flex-1 min-0' },
                  h('div', { className: 't-semibold' }, iv.name),
                  h('div', { className: 't-xs t-muted' }, `${iv.time} · ${iv.round} · ${iv.venue}`)),
                Badge(iv.status))))),
          });
        },
        sidebar: [
          SectionCard({ title: 'Today’s panel', icon: 'users', subtitle: formatDate('2026-08-20') },
            (() => {
              const today = all.filter((iv) => iv.date === '2026-08-20');
              return today.length
                ? h('div', { className: 'stack-2' }, today.slice(0, 6).map((iv) => h('div', { className: 'row-3' },
                  Avatar(iv.name, { size: 'sm' }),
                  h('div', { className: 'flex-1 min-0' },
                    h('div', { className: 't-sm t-semibold t-truncate' }, iv.name),
                    h('div', { className: 't-xs t-muted t-truncate' }, `${iv.time} · ${iv.round}`)),
                  IconButton('eye', { size: 'sm', label: `Open scorecard for ${iv.name}`, onClick: () => openScorecard(iv) }))))
                : emptyFor('Nothing today', 'No interviews are scheduled for 20 Aug 2026.',
                  Button('Schedule one', { variant: 'secondary', icon: 'calendar-plus', onClick: () => openInterviewForm() }));
            })()),
          SectionCard({ title: 'Recommendation split', className: 'chart-card' },
            completed.length
              ? donutChart({ data: countBy(completed, 'recommendation'), height: 220, centerValue: String(completed.length), centerLabel: 'Scorecards', title: 'Recommendation split' })
              : emptyFor('No scorecards yet', 'Panel members submit scores after each round.')),
          SectionCard({ title: 'Rounds in use', icon: 'workflow' },
            h('div', { className: 'stack-2' }, PANEL_ROUNDS.map((r, i) => MetricRow(r, String(all.filter((iv) => iv.round === r).length), Badge(`Stage ${i + 1}`, { tone: 'neutral' }))))),
        ],
        legend: h('div', { className: 'row-3 row-wrap' },
          Badge('Completed', { tone: 'success', dot: true }),
          Badge('Scheduled', { tone: 'info', dot: true }),
          h('span', { className: 't-xs t-muted' }, 'Click a day for the panel list, or an event for the scorecard.')),
      });

      node.appendChild(h('div', { className: 'stack mt-4' },
        SectionCard({ title: 'All interviews', subtitle: 'Sortable, filterable and exportable', flush: true },
          DataTable({
            columns: [
              { key: 'name', label: 'Candidate', width: 210, sticky: true, render: (iv) => Identity(iv.name, iv.position, { onClick: () => openScorecard(iv) }), value: (iv) => iv.name },
              { key: 'round', label: 'Round', width: 170, filter: true },
              { key: 'date', label: 'Date', width: 130, render: (iv) => formatDate(iv.date), value: (iv) => iv.date },
              { key: 'time', label: 'Time', width: 90, align: 'right', numeric: true },
              { key: 'durationMin', label: 'Mins', width: 80, align: 'right', numeric: true },
              { key: 'mode', label: 'Mode', width: 130, filter: true },
              { key: 'venue', label: 'Venue', width: 190 },
              { key: 'panel', label: 'Panel', width: 190, sortable: false, render: (iv) => AvatarStack(iv.panel, { size: 'xs' }), value: (iv) => iv.panel.join(', ') },
              { key: 'overall', label: 'Score', width: 100, align: 'right', numeric: true, render: (iv) => (iv.status === 'Completed' ? Badge(`${iv.overall}/5`, { tone: iv.overall >= 4 ? 'success' : iv.overall >= 3 ? 'warning' : 'danger' }) : '—'), value: (iv) => iv.overall },
              { key: 'recommendation', label: 'Recommendation', width: 150, filter: true },
              { key: 'status', label: 'Status', width: 120, filter: true, render: (iv) => Badge(iv.status) },
            ],
            rows: sortBy(all, 'date'),
            pageSize: 25,
            searchKeys: ['name', 'position', 'round'],
            onRowClick: (iv) => openScorecard(iv),
            rowActions: (iv) => [
              { label: 'Open scorecard', icon: 'clipboard-list', onClick: () => openScorecard(iv) },
              { label: 'Reschedule', icon: 'calendar', onClick: () => openInterviewForm(iv) },
              { label: 'Send reminder', icon: 'send', onClick: () => notify({ title: `Reminder sent to ${iv.name}`, tone: 'success' }) },
            ],
            exportName: 'interviews',
            emptyState: emptyFor('No interviews scheduled', 'Shortlist an applicant to schedule the first round.'),
          }))));

      mount.appendChild(node);
    },
  },

  'hr/onboarding': {
    title: 'Onboarding & Joining',
    subtitle: 'Pre-joining checklist, documents and day-one readiness',
    section: 'hr',
    render(mount) {
      injectStyles();
      const rows = onboardings();
      const done = rows.filter((r) => r.status === 'Completed').length;
      const taskCompletion = ONBOARD_TASKS.map((t) => ({
        key: t.label,
        value: rows.filter((r) => r.tasks.find((x) => x.id === t.id && x.done)).length,
      }));

      mount.appendChild(listPage({
        title: 'Onboarding & Joining',
        subtitle: `${rows.length} candidates in onboarding · ${done} ready to join`,
        route: 'hr/onboarding',
        actions: [
          Button('Applicants', { variant: 'secondary', icon: 'users', route: 'hr/applicants' }),
          Button('Start onboarding', { variant: 'primary', icon: 'log-in', onClick: () => openOnboardingForm() }),
        ],
        kpis: [
          { label: 'In onboarding', value: String(rows.length), icon: 'log-in', tone: 'brand' },
          { label: 'Ready to join', value: String(done), icon: 'check-circle', tone: 'success' },
          { label: 'Pending checks', value: String(rows.reduce((t, r) => t + (ONBOARD_TASKS.length - r.completed), 0)), icon: 'clipboard-list', tone: 'warning' },
          { label: 'Joining this month', value: String(rows.filter((r) => r.joiningDate.startsWith('2026-08')).length), icon: 'calendar', tone: 'info' },
        ],
        chart: barChart({
          categories: taskCompletion.map((t) => t.key),
          series: [{ name: 'Candidates cleared', values: taskCompletion.map((t) => t.value) }],
          horizontal: true, height: 340, target: rows.length, targetLabel: 'All candidates',
          title: 'Checklist completion across candidates',
        }),
        chartTitle: 'Checklist completion across candidates',
        columns: [
          { key: 'name', label: 'Candidate', width: 220, sticky: true, render: (r) => Identity(r.name, r.position, { onClick: () => openOnboardingDrawer(r) }), value: (r) => r.name },
          { key: 'department', label: 'Department', width: 150, filter: true },
          { key: 'campusId', label: 'Campus', width: 150, filter: true, render: (r) => campusName(r.campusId), value: (r) => campusName(r.campusId) },
          { key: 'joiningDate', label: 'Joining', width: 130, render: (r) => formatDate(r.joiningDate), value: (r) => r.joiningDate },
          { key: 'experienceYears', label: 'Exp', width: 80, align: 'right', numeric: true },
          { key: 'offeredCtc', label: 'Offered CTC', width: 120, align: 'right' },
          { key: 'reportingTo', label: 'Reports to', width: 180 },
          { key: 'buddy', label: 'Buddy', width: 180, hidden: true },
          {
            key: 'progress', label: 'Checklist', width: 190, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v)}%`,
            render: (r) => ProgressBar(r.progress, { showValue: true, size: 'sm', tone: r.progress === 100 ? 'success' : r.progress >= 50 ? 'warning' : 'danger' }),
          },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        footerAggregates: true,
        selectable: true,
        searchKeys: ['name', 'position', 'department'],
        bulkActions: [
          { label: 'Send welcome kit', icon: 'gift', onClick: (sel) => notify({ title: `Welcome kit emailed to ${sel.length} candidates`, tone: 'success' }) },
          { label: 'Create ERP logins', icon: 'key', onClick: (sel) => notify({ title: `${sel.length} logins queued with IT`, tone: 'success' }) },
        ],
        expandable: (r) => h('div', { className: 'hr-check-list' },
          r.tasks.map((t) => h('div', { className: 'hr-check', dataset: { done: String(t.done) } },
            h('div', { className: 'hr-check-ico', html: icon(t.done ? 'check' : 'clock', 14) }),
            h('div', { className: 'flex-1 min-0' },
              h('div', { className: 't-sm t-medium' }, t.label),
              h('div', { className: 't-xs t-muted' }, `Owner: ${t.owner}${t.date ? ` · completed ${formatDate(t.date)}` : ''}`)),
            Badge(t.done ? 'Completed' : 'Pending')))),
        rowActions: (r) => [
          { label: 'Open checklist', icon: 'clipboard-list', onClick: () => openOnboardingDrawer(r) },
          { label: 'Mark as joined', icon: 'user-check', onClick: () => ConfirmDialog({ title: `Convert ${r.name} to employee?`, text: 'This creates the employee record, enrols biometrics and starts payroll from the joining date.', confirmLabel: 'Convert to employee', tone: 'brand', icon: 'user-check' }).then((ok) => ok && notify({ title: 'Employee created', text: `${r.name} · demo only`, tone: 'success' })) },
          { label: 'Send reminder', icon: 'send', onClick: () => notify({ title: `Reminder sent to ${r.name}`, tone: 'info' }) },
        ],
        onRowClick: (r) => openOnboardingDrawer(r),
        exportName: 'onboarding',
        emptyState: emptyFor('Nobody is onboarding', 'Release an offer from the applicant pipeline to start a checklist.',
          Button('Open pipeline', { variant: 'primary', icon: 'users', route: 'hr/applicants' })),
      }));
    },
  },
};

/* ------------------------------------------- recruitment overlays & forms */

function openApplicantDrawer(a) {
  if (!a) return;
  const rec = byId(db.recruitments, a.recruitmentId);
  const ivs = interviews().filter((x) => x.applicantId === a.id);
  Drawer({
    title: a.name,
    subtitle: `${a.position} · ${a.stage}`,
    size: 'lg',
    body: h('div', { className: 'stack' },
      h('div', { className: 'row-3 row-wrap' },
        Avatar(a.name, { size: 'xl' }),
        h('div', { className: 'stack-1 flex-1' },
          h('div', { className: 'row-3 row-wrap' }, Badge(a.stage), a.rating ? Rating(a.rating, { showValue: true }) : Badge('Not rated', { tone: 'neutral' })),
          h('div', { className: 't-sm t-muted' }, `${a.experienceYears} years experience · ${a.currentEmployer}`))),
      DescriptionList([
        ['Applied for', a.position],
        ['Requisition', rec ? `${rec.id} · ${rec.openings} seat(s)` : '—'],
        ['Campus', campusName(a.campusId)],
        ['Email', a.email],
        ['Phone', a.phone],
        ['Qualification', a.qualification],
        ['Expected CTC', a.expectedCtc],
        ['Source', a.source],
        ['Applied on', formatDate(a.appliedOn)],
      ], { cols: 2 }),
      a.notes ? Callout({ tone: 'info', icon: 'note', title: 'Recruiter notes' }, a.notes) : null,
      SectionCard({ title: 'Interview rounds', flush: true },
        ivs.length
          ? DataTable({
            columns: [
              { key: 'round', label: 'Round', width: 160 },
              { key: 'date', label: 'Date', width: 120, render: (iv) => formatDate(iv.date), value: (iv) => iv.date },
              { key: 'overall', label: 'Score', width: 90, align: 'right', numeric: true },
              { key: 'recommendation', label: 'Recommendation', width: 140 },
              { key: 'status', label: 'Status', width: 110, render: (iv) => Badge(iv.status) },
            ],
            rows: ivs, paginate: false, searchable: false, columnToggle: false, exportable: false,
            onRowClick: (iv) => openScorecard(iv),
          })
          : emptyFor('No rounds scheduled', 'Schedule the first round to move this candidate forward.',
            Button('Schedule interview', { variant: 'secondary', icon: 'calendar-plus', onClick: () => openInterviewForm() }))),
      FileList([{ name: a.resume, type: 'pdf', size: '412 KB', date: a.appliedOn, status: 'Verified' }], {
        onDownload: () => notify({ title: 'Resume downloaded', tone: 'info' }),
      })),
    actions: (close) => frag(
      Button('Reject', { variant: 'ghost', icon: 'x', onClick: () => { close(); ConfirmDialog({ title: `Reject ${a.name}?`, text: 'A polite regret email will be queued.', confirmLabel: 'Reject', tone: 'danger' }).then((ok) => ok && notify({ title: 'Applicant rejected', tone: 'danger' })); } }),
      Button('Schedule interview', { variant: 'secondary', icon: 'calendar-plus', onClick: () => { close(); openInterviewForm(); } }),
      Button('Release offer', { variant: 'primary', icon: 'handshake', onClick: () => { close(); openOfferForm(a); } })),
  });
}

function openScorecard(iv) {
  Modal({
    title: `${iv.name} — ${iv.round}`,
    subtitle: `${formatDate(iv.date)} at ${iv.time} · ${iv.mode} · ${iv.venue}`,
    size: 'lg', icon: 'clipboard-list', tone: 'brand',
    body: h('div', { className: 'stack' },
      h('div', { className: 'row-3 row-wrap' },
        Badge(iv.status),
        Badge(iv.recommendation, { tone: iv.recommendation === 'Strong hire' ? 'success' : iv.recommendation === 'Hire' ? 'info' : iv.recommendation === 'Hold' ? 'warning' : 'danger' }),
        h('span', { className: 'spacer' }),
        h('span', { className: 't-sm t-muted' }, 'Panel: '),
        AvatarStack(iv.panel, { size: 'xs' })),
      SectionCard({ title: 'Competency scores', className: 'chart-card' },
        barChart({
          categories: iv.scores.map((s) => s.name),
          series: [{ name: 'Score', values: iv.scores.map((s) => s.score) }],
          horizontal: true, height: 240, maxY: 5, valueFormat: 'decimal', showValues: true,
          title: 'Competency scores',
        })),
      DescriptionList([
        ['Overall', `${iv.overall} / 5`],
        ['Recommendation', iv.recommendation],
        ['Duration', `${iv.durationMin} minutes`],
        ['Panel', iv.panel.join(', ')],
      ], { cols: 2 }),
      Callout({ tone: 'info', icon: 'note', title: 'Panel notes' }, iv.notes)),
    actions: (close) => frag(
      Button('Close', { variant: 'ghost', onClick: close }),
      Button('Download scorecard', { variant: 'secondary', icon: 'download', onClick: mockAction('Download scorecard') }),
      Button('Move to offer', { variant: 'primary', icon: 'handshake', onClick: () => { close(); notify({ title: `${iv.name} moved to Offered`, tone: 'success' }); } })),
  });
}

function openRequisitionForm(r) {
  formPage({
    title: r ? `Edit ${r.position}` : 'Post a position',
    subtitle: 'Approved requisitions publish to the careers page and job boards.',
    mode: 'modal', size: 'lg', submitLabel: r ? 'Save requisition' : 'Post position',
    values: r ? { position: r.position, department: r.department, openings: r.openings, priority: r.priority } : { priority: 'Medium', openings: 1 },
    sections: [{
      title: 'Requisition', cols: 2,
      fields: [
        { id: 'position', label: 'Position title', required: true, validate: validators.required, span: 'full' },
        { id: 'department', label: 'Department', type: 'select', options: DEPT_NAMES(), required: true },
        { id: 'campus', label: 'Campus', type: 'select', options: campusFilterOptions(), required: true },
        { id: 'openings', label: 'Number of seats', type: 'number', required: true, validate: [validators.required, validators.min(1)] },
        { id: 'priority', label: 'Priority', type: 'radio', inline: true, options: ['High', 'Medium', 'Low'] },
        { id: 'experience', label: 'Experience required', placeholder: 'e.g. 3-6 yrs' },
        { id: 'salaryRange', label: 'Salary range', placeholder: 'e.g. ₹6L - ₹9L' },
        { id: 'closing', label: 'Applications close on', type: 'date' },
        { id: 'jd', label: 'Job description', type: 'textarea', span: 'full', rows: 5, placeholder: 'Responsibilities, CBSE experience expectations, reporting line…' },
      ],
    }],
    onSubmit: (v) => notify({ title: r ? 'Requisition updated' : 'Position posted', text: `${v.position} · ${v.openings || 1} seat(s)`, tone: 'success' }),
  });
}

function openApplicantForm() {
  formPage({
    title: 'Add applicant',
    mode: 'modal', size: 'lg', submitLabel: 'Add to pipeline',
    sections: [{
      title: 'Candidate', cols: 2,
      fields: [
        { id: 'name', label: 'Full name', required: true, validate: validators.required },
        { id: 'position', label: 'Applying for', type: 'select', required: true, options: db.recruitments.map((r) => ({ value: r.id, label: r.position })) },
        { id: 'email', label: 'Email', type: 'email', required: true, validate: [validators.required, validators.email] },
        { id: 'phone', label: 'Mobile', type: 'tel', required: true, validate: validators.phone },
        { id: 'experience', label: 'Experience (years)', type: 'number', validate: validators.number },
        { id: 'qualification', label: 'Qualification', type: 'combobox', options: ['M.A., B.Ed', 'M.Sc, B.Ed', 'B.Ed', 'MBA', 'B.Com', 'M.Tech', 'Ph.D'] },
        { id: 'source', label: 'Source', type: 'select', options: ['Naukri', 'LinkedIn', 'Referral', 'Walk-in', 'Website', 'Consultant'] },
        { id: 'ctc', label: 'Expected CTC', placeholder: '₹8L' },
        { id: 'resume', label: 'Resume', type: 'file', span: 'full' },
      ],
    }],
    onSubmit: (v) => notify({ title: 'Applicant added', text: `${v.name} added at the Applied stage`, tone: 'success' }),
  });
}

function openInterviewForm(iv) {
  formPage({
    title: iv ? `Reschedule — ${iv.name}` : 'Schedule interview',
    mode: 'modal', size: 'lg', submitLabel: iv ? 'Reschedule' : 'Schedule',
    values: iv ? { round: iv.round, date: iv.date, time: iv.time, mode: iv.mode, venue: iv.venue } : { mode: 'In person' },
    sections: [{
      title: 'Slot', cols: 2,
      fields: [
        { id: 'applicant', label: 'Candidate', type: 'combobox', required: true, options: db.applicants.slice(0, 150).map((a) => ({ value: a.id, label: `${a.name} — ${a.position}` })), value: iv ? iv.applicantId : undefined },
        { id: 'round', label: 'Round', type: 'select', required: true, options: PANEL_ROUNDS },
        { id: 'date', label: 'Date', type: 'date', required: true },
        { id: 'time', label: 'Time', type: 'time', required: true },
        { id: 'mode', label: 'Mode', type: 'radio', inline: true, options: ['In person', 'Google Meet', 'Telephonic'] },
        { id: 'venue', label: 'Venue / link', placeholder: 'Conference Room 1' },
        { id: 'panel', label: 'Panel members', type: 'multiselect', span: 'full', options: db.staff.slice(0, 80).map((s) => ({ value: s.id, label: `${s.name} — ${s.designation}` })) },
        { id: 'notes', label: 'Brief for the panel', type: 'textarea', span: 'full' },
      ],
    }],
    onSubmit: () => notify({ title: iv ? 'Interview rescheduled' : 'Interview scheduled', text: 'Calendar invites queued for the panel and the candidate.', tone: 'success' }),
  });
}

function openOfferForm(a) {
  formPage({
    title: `Release offer — ${a.name}`,
    subtitle: 'The offer letter is generated from the approved band for the position.',
    mode: 'modal', size: 'lg', submitLabel: 'Release offer',
    values: { position: a.position, ctc: a.expectedCtc },
    sections: [{
      title: 'Offer terms', cols: 2,
      fields: [
        { id: 'position', label: 'Position', type: 'static', value: a.position },
        { id: 'band', label: 'Band', type: 'select', options: BANDS(), required: true },
        { id: 'ctc', label: 'Annual CTC', required: true, validate: validators.required },
        { id: 'joining', label: 'Proposed joining date', type: 'date', required: true },
        { id: 'probation', label: 'Probation (months)', type: 'number', value: 6 },
        { id: 'validity', label: 'Offer valid till', type: 'date' },
        { id: 'notes', label: 'Special terms', type: 'textarea', span: 'full', placeholder: 'Relocation support, notice-period buyout, joining bonus…' },
      ],
    }],
    onSubmit: () => notify({ title: 'Offer released', text: `${a.name} · offer letter emailed and onboarding checklist created`, tone: 'success' }),
  });
}

function openOnboardingForm() {
  formPage({
    title: 'Start onboarding',
    mode: 'modal', size: 'lg', submitLabel: 'Create checklist',
    sections: [{
      title: 'Candidate & joining', cols: 2,
      fields: [
        { id: 'candidate', label: 'Candidate', type: 'combobox', required: true, options: db.applicants.filter((a) => a.stage === 'Offered').map((a) => ({ value: a.id, label: `${a.name} — ${a.position}` })) },
        { id: 'joining', label: 'Joining date', type: 'date', required: true },
        { id: 'reportingTo', label: 'Reporting manager', type: 'combobox', options: db.staff.slice(0, 100).map((s) => ({ value: s.id, label: `${s.name} — ${s.designation}` })) },
        { id: 'buddy', label: 'Buddy', type: 'combobox', options: db.staff.slice(0, 100).map((s) => ({ value: s.id, label: s.name })) },
        { id: 'tasks', label: 'Checklist items', type: 'multiselect', span: 'full', options: ONBOARD_TASKS.map((t) => ({ value: t.id, label: t.label })) },
      ],
    }],
    onSubmit: () => notify({ title: 'Onboarding started', text: 'Checklist created and owners notified.', tone: 'success' }),
  });
}

function openOnboardingDrawer(r) {
  Drawer({
    title: r.name,
    subtitle: `${r.position} · joining ${formatDate(r.joiningDate)}`,
    size: 'lg',
    body: h('div', { className: 'stack' },
      h('div', { className: 'row-3 row-wrap' },
        Badge(r.status),
        Badge(`${r.progress}% complete`, { tone: r.progress === 100 ? 'success' : 'warning' })),
      ProgressBar(r.completed, { max: ONBOARD_TASKS.length, label: `${r.completed} of ${ONBOARD_TASKS.length} steps cleared`, showValue: true, tone: r.progress === 100 ? 'success' : 'warning' }),
      DescriptionList([
        ['Department', r.department],
        ['Campus', campusName(r.campusId)],
        ['Reports to', r.reportingTo],
        ['Buddy', r.buddy],
        ['Qualification', r.qualification],
        ['Experience', `${r.experienceYears} years`],
        ['Offered CTC', r.offeredCtc],
        ['Email', r.email],
      ], { cols: 2 }),
      SectionCard({ title: 'Pre-joining checklist' },
        h('div', { className: 'hr-check-list' },
          r.tasks.map((t) => h('div', { className: 'hr-check', dataset: { done: String(t.done) } },
            h('div', { className: 'hr-check-ico', html: icon(t.done ? 'check' : 'clock', 14) }),
            h('div', { className: 'flex-1 min-0' },
              h('div', { className: 't-sm t-medium' }, t.label),
              h('div', { className: 't-xs t-muted' }, `Owner: ${t.owner}${t.date ? ` · completed ${formatDate(t.date)}` : ''}`)),
            Badge(t.done ? 'Completed' : 'Pending'))))),
      Callout({ tone: 'info', icon: 'calendar', title: 'Day one plan' },
        `Induction at 08:30 in the conference room, campus walkthrough with ${r.buddy}, then the CBSE orientation module in the afternoon.`)),
    actions: (close) => frag(
      Button('Send reminder', { variant: 'ghost', icon: 'send', onClick: () => { close(); notify({ title: `Reminder sent to ${r.name}`, tone: 'info' }); } }),
      Button('Mark as joined', { variant: 'primary', icon: 'user-check', onClick: () => { close(); notify({ title: 'Employee record created', text: `${r.name} · demo only`, tone: 'success' }); } })),
  });
}

/* ==========================================================================
   6 · Employee documents
   ========================================================================== */

const documentRoutes = {
  'hr/documents': {
    title: 'Employee Documents',
    subtitle: 'Statutory file completeness and expiry tracking',
    section: 'hr',
    render(mount, ctx) {
      injectStyles();
      const summary = qOf(ctx).campus
        ? documentSummary().filter((r) => r.campusId === qOf(ctx).campus)
        : documentSummary();
      const compliant = summary.filter((r) => r.compliance === 'Compliant').length;
      const nonCompliant = summary.filter((r) => r.compliance === 'Non-compliant');
      const expiring = summary.filter((r) => r.expiringCount > 0);
      const perDoc = DOC_TYPES.map((d) => ({
        key: d.name,
        value: summary.filter((r) => r.docs.find((x) => x.id === d.id && x.status === 'Verified')).length,
      }));

      mount.appendChild(listPage({
        title: 'Employee Documents',
        subtitle: `${formatNumber(summary.length)} employee files · ${compliant} fully compliant · ${nonCompliant.length} with missing mandatory documents`,
        route: 'hr/documents',
        actions: [
          Button('Chase missing files', { variant: 'secondary', icon: 'send', onClick: () => notify({ title: `Reminder emailed to ${nonCompliant.length} employees`, tone: 'success' }) }),
          Button('Bulk upload', { variant: 'primary', icon: 'upload', onClick: () => openBulkUpload() }),
        ],
        kpis: [
          { label: 'Files tracked', value: formatNumber(summary.length * DOC_TYPES.length), icon: 'folder', tone: 'brand' },
          { label: 'Fully compliant', value: formatNumber(compliant), icon: 'shield-check', tone: 'success' },
          { label: 'Missing mandatory', value: formatNumber(nonCompliant.length), icon: 'alert-triangle', tone: 'danger' },
          { label: 'Expiring soon', value: formatNumber(expiring.length), icon: 'timer', tone: 'warning' },
        ],
        chart: barChart({
          categories: perDoc.map((d) => d.key),
          series: [{ name: 'Verified', values: perDoc.map((d) => d.value) }],
          horizontal: true, height: 360, target: summary.length, targetLabel: 'All employees',
          title: 'Verified copies held per document type',
        }),
        chartTitle: 'Verified copies held per document type',
        columns: [
          { key: 'name', label: 'Employee', width: 240, sticky: true, render: (r) => empCellById(r.employeeId, `${r.employeeCode} · ${r.designation}`), value: (r) => r.name },
          { key: 'department', label: 'Department', width: 150, filter: true },
          { key: 'campusId', label: 'Campus', width: 150, filter: true, render: (r) => campusName(r.campusId), value: (r) => campusName(r.campusId) },
          { key: 'type', label: 'Cadre', width: 120, filter: true },
          { key: 'verified', label: 'Verified', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'missingCount', label: 'Missing', width: 100, align: 'right', numeric: true, aggregate: 'sum', render: (r) => (r.missingCount ? h('span', { className: 't-danger t-semibold' }, String(r.missingCount)) : '—'), value: (r) => r.missingCount },
          { key: 'expiringCount', label: 'Expiring', width: 100, align: 'right', numeric: true, aggregate: 'sum', render: (r) => (r.expiringCount ? h('span', { className: 't-warning t-semibold' }, String(r.expiringCount)) : '—'), value: (r) => r.expiringCount },
          {
            key: 'completeness', label: 'Completeness', width: 180, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v)}%`,
            render: (r) => ProgressBar(r.completeness, { showValue: true, size: 'sm', tone: r.completeness === 100 ? 'success' : r.completeness >= 70 ? 'warning' : 'danger' }),
          },
          { key: 'compliance', label: 'Compliance', width: 150, filter: true, render: (r) => Badge(r.compliance, { tone: r.compliance === 'Compliant' ? 'success' : r.compliance === 'Action needed' ? 'warning' : 'danger' }) },
        ],
        rows: summary,
        footerAggregates: true,
        selectable: true,
        pageSize: 25,
        searchKeys: ['name', 'employeeCode', 'department', 'designation'],
        bulkActions: [
          { label: 'Email document request', icon: 'mail', onClick: (sel) => notify({ title: `Document request sent to ${sel.length} employees`, tone: 'success' }) },
          { label: 'Export compliance sheet', icon: 'download', onClick: (sel) => { download('document-compliance.csv', toCsv(sel, [{ key: 'employeeCode', label: 'Code' }, { key: 'name', label: 'Name' }, { key: 'completeness', label: 'Completeness %' }, { key: 'compliance', label: 'Compliance' }]), 'text/csv;charset=utf-8'); notify({ title: 'Compliance sheet exported', tone: 'success' }); } },
        ],
        expandable: (r) => h('div', { className: 'grid grid-2' },
          SectionCard({ title: 'Files on record' },
            FileList(r.docs.filter((d) => d.fileName).map((d) => ({ name: d.name, type: 'pdf', size: d.size, date: d.uploadedOn, status: d.status })), {
              onDownload: (fdoc) => notify({ title: 'Download started', text: fdoc.name, tone: 'info' }),
            })),
          SectionCard({ title: 'Outstanding' },
            r.docs.filter((d) => d.status !== 'Verified').length
              ? h('div', { className: 'hr-check-list' }, r.docs.filter((d) => d.status !== 'Verified').map((d) => h('div', { className: 'hr-check', dataset: { done: 'false' } },
                h('div', { className: 'hr-check-ico', html: icon('alert-circle', 14) }),
                h('div', { className: 'flex-1 min-0' },
                  h('div', { className: 't-sm t-medium' }, d.name),
                  h('div', { className: 't-xs t-muted' }, d.mandatory ? 'Mandatory for CBSE / POCSO compliance' : 'Optional supporting document')),
                Badge(d.status))))
              : emptyFor('Nothing outstanding', 'Every mandatory document for this employee is verified and in date.'))),
        rowActions: (r) => [
          { label: 'Open employee documents', icon: 'folder', route: `hr/employee-profile/${r.employeeId}` },
          { label: 'Request missing files', icon: 'send', onClick: () => notify({ title: `Request sent to ${r.name}`, tone: 'info' }) },
          { label: 'Upload on behalf', icon: 'upload', onClick: () => openBulkUpload(r) },
        ],
        onRowClick: (r) => navigate(`hr/employee-profile/${r.employeeId}`, { tab: 'documents' }),
        exportName: 'employee-documents',
        notes: nonCompliant.length
          ? Callout({ tone: 'danger', icon: 'shield', title: `${nonCompliant.length} employees are missing a mandatory document` },
            'Police verification and medical fitness certificates are mandatory under the CBSE affiliation bye-laws. Chase these before the next inspection window.')
          : null,
        emptyState: emptyFor('No employee files', 'Document folders are created when an employee record is added.'),
      }));
    },
  },
};

function openBulkUpload(row) {
  formPage({
    title: row ? `Upload documents — ${row.name}` : 'Bulk document upload',
    subtitle: 'Files are matched to employees by employee code in the file name.',
    mode: 'modal', size: 'lg', submitLabel: 'Upload & verify',
    sections: [{
      title: 'Upload', cols: 1,
      fields: [
        { id: 'docType', label: 'Document type', type: 'select', required: true, options: DOC_TYPES.map((d) => d.name) },
        { id: 'files', label: 'Files', type: 'file', hint: 'PDF or JPG, up to 5 MB each. Name files as EMPCODE-doctype.pdf' },
        { id: 'validTill', label: 'Valid till', type: 'date', hint: 'Applies to police verification and medical certificates.' },
        { id: 'verify', label: 'Verification', type: 'switch', switchLabel: 'Mark as verified on upload', value: true },
      ],
    }],
    onSubmit: (v) => notify({ title: 'Documents uploaded', text: `${v.docType || 'Files'} attached · demo only`, tone: 'success' }),
  });
}

/* ==========================================================================
   7 · Staff attendance
   ========================================================================== */

function attendanceRegisterMatrix(rows) {
  const dates = Array.from(new Set(rows.map((r) => r.date))).sort();
  const emps = Array.from(new Set(rows.map((r) => r.employeeId))).slice(0, 25);
  const values = emps.map((eid) => dates.map((d) => {
    const rec = rows.find((r) => r.employeeId === eid && r.date === d);
    if (!rec) return 0;
    return rec.status === 'Present' ? 1 : rec.status === 'On Duty' ? 0.9 : rec.status === 'Half Day' ? 0.5 : rec.status === 'On Leave' ? 0.25 : 0;
  }));
  return {
    rows: emps.map((eid) => (byId(db.staff, eid) || { name: eid }).name),
    cols: dates.map((d) => formatDate(d, 'dayMonth')),
    values,
  };
}

const attendanceRoutes = {
  'hr/attendance': {
    title: 'Staff Attendance',
    subtitle: 'Biometric log, monthly register and late-arrival analysis',
    section: 'hr',
    render(mount, ctx) {
      injectStyles();
      const all = db.staffAttendance;
      const campus = qOf(ctx).campus || 'all';
      let rows = campus === 'all' ? all : all.filter((r) => r.campusId === campus);
      const today = '2026-08-14';
      const todayRows = rows.filter((r) => r.date === today);
      const present = todayRows.filter((r) => r.status === 'Present').length;
      const late = rows.filter((r) => r.lateBy > 0);
      const byStatus = countBy(rows, 'status');
      const deptAvg = DEPT_NAMES().map((d) => {
        const dr = rows.filter((r) => r.department === d);
        return { key: d, value: dr.length ? round2((dr.filter((x) => x.status === 'Present').length / dr.length) * 100) : 0 };
      });
      const matrix = attendanceRegisterMatrix(rows);
      let activeTab = 'log';

      const columns = [
        { key: 'employeeName', label: 'Employee', width: 230, sticky: true, render: (r) => empCellById(r.employeeId, `${r.designation} · ${r.department}`), value: (r) => r.employeeName },
        { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date), value: (r) => r.date },
        { key: 'department', label: 'Department', width: 150, filter: true },
        { key: 'campusId', label: 'Campus', width: 150, filter: true, render: (r) => campusName(r.campusId), value: (r) => campusName(r.campusId) },
        { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        { key: 'inTime', label: 'In', width: 90, align: 'right', numeric: true, render: (r) => r.inTime || '—' },
        { key: 'outTime', label: 'Out', width: 90, align: 'right', numeric: true, render: (r) => r.outTime || '—' },
        { key: 'workedHours', label: 'Hours', width: 90, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round2(v)} h` },
        { key: 'lateBy', label: 'Late (min)', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => (r.lateBy ? h('span', { className: 't-warning' }, `${r.lateBy}`) : '—') },
        { key: 'source', label: 'Source', width: 120, filter: true },
      ];

      const table = DataTable({
        columns, rows, pageSize: 25, selectable: true, footerAggregates: true,
        searchKeys: ['employeeName', 'department', 'designation'],
        searchPlaceholder: 'Search employee or department…',
        exportName: 'staff-attendance',
        onRowClick: (r) => navigate(`hr/employee-profile/${r.employeeId}`, { tab: 'attendance' }),
        rowActions: (r) => [
          { label: 'Open employee', icon: 'id-card', route: `hr/employee-profile/${r.employeeId}` },
          { label: 'Regularise punch', icon: 'edit', onClick: () => openRegularise(r) },
          { label: 'Mark on duty', icon: 'check-circle', onClick: () => notify({ title: `${r.employeeName} marked On Duty for ${formatDate(r.date)}`, tone: 'success' }) },
        ],
        bulkActions: [
          { label: 'Regularise selected', icon: 'edit', onClick: (sel) => notify({ title: `${sel.length} punches regularised`, tone: 'success' }) },
          { label: 'Notify late comers', icon: 'send', tone: 'danger', onClick: (sel) => notify({ title: `Late notice sent to ${sel.length} employees`, tone: 'warning' }) },
        ],
        emptyState: emptyFor('No attendance records', 'Biometric devices sync every 15 minutes; nothing has arrived for this filter.'),
      });

      const tabHost = h('div');
      const paintTab = () => {
        tabHost.innerHTML = '';
        if (activeTab === 'log') {
          tabHost.appendChild(SectionCard({ title: 'Biometric punch log', subtitle: `${formatNumber(rows.length)} punches · devices synced ${relativeTime('2026-08-20T09:15:00')}`, flush: true }, table));
        } else if (activeTab === 'register') {
          tabHost.appendChild(SectionCard({
            title: 'Monthly register', subtitle: 'First 25 employees · green is a full day, amber a half day, red an absence',
            className: 'chart-card',
          },
            h('div', { className: 'stack-3' },
              heatmap({
                mode: 'matrix', rows: matrix.rows, cols: matrix.cols, values: matrix.values,
                cellSize: 22, min: 0, max: 1,
                valueFormat: (v) => (v >= 1 ? 'Present' : v >= 0.9 ? 'On duty' : v >= 0.5 ? 'Half day' : v >= 0.25 ? 'Leave' : 'Absent'),
                title: 'Monthly attendance register',
              }),
              ScaleLegend(0, 1, { format: (v) => (v >= 1 ? 'Present' : v >= 0.9 ? 'On duty' : v >= 0.5 ? 'Half day' : v >= 0.25 ? 'Leave' : 'Absent') }))));
        } else {
          const lateBuckets = [
            { key: 'On time', value: rows.filter((r) => r.lateBy === 0).length },
            { key: '1-10 min', value: rows.filter((r) => r.lateBy > 0 && r.lateBy <= 10).length },
            { key: '11-20 min', value: rows.filter((r) => r.lateBy > 10 && r.lateBy <= 20).length },
            { key: '20+ min', value: rows.filter((r) => r.lateBy > 20).length },
          ];
          const repeatOffenders = Array.from(groupBy(late, 'employeeId').entries())
            .map(([eid, list]) => ({
              id: eid, name: list[0].employeeName, department: list[0].department,
              count: list.length, totalMinutes: list.reduce((t, x) => t + x.lateBy, 0),
              campusId: list[0].campusId,
            }))
            .filter((x) => x.count >= 2);
          tabHost.appendChild(h('div', { className: 'stack' },
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-5' },
                SectionCard({ title: 'Late-arrival distribution', className: 'chart-card' },
                  donutChart({ data: lateBuckets, height: 280, centerValue: `${Math.round((lateBuckets[0].value / Math.max(1, rows.length)) * 100)}%`, centerLabel: 'On time', title: 'Late-arrival distribution' }))),
              h('div', { className: 'span-7' },
                SectionCard({ title: 'Department-wise presence', className: 'chart-card' },
                  barChart({ categories: deptAvg.map((d) => d.key), series: [{ name: 'Present %', values: deptAvg.map((d) => d.value) }], horizontal: true, height: 280, valueFormat: 'percent0', target: 95, targetLabel: 'Target', title: 'Department-wise presence' })))),
            SectionCard({ title: 'Repeat late arrivals', subtitle: 'Two or more late marks in the current fortnight', flush: true },
              repeatOffenders.length
                ? DataTable({
                  columns: [
                    { key: 'name', label: 'Employee', width: 240, sticky: true, render: (r) => empCellById(r.id), value: (r) => r.name },
                    { key: 'department', label: 'Department', width: 160, filter: true },
                    { key: 'campusId', label: 'Campus', width: 150, render: (r) => campusName(r.campusId), value: (r) => campusName(r.campusId) },
                    { key: 'count', label: 'Late marks', align: 'right', numeric: true, aggregate: 'sum' },
                    { key: 'totalMinutes', label: 'Total minutes', align: 'right', numeric: true, aggregate: 'sum' },
                    { key: 'action', label: 'Action', width: 170, sortable: false, render: (r) => Button('Send notice', { variant: 'ghost', size: 'sm', icon: 'send', onClick: (e) => { e.stopPropagation(); notify({ title: `Late notice issued to ${r.name}`, tone: 'warning' }); } }) },
                  ],
                  rows: sortBy(repeatOffenders, 'count', 'desc'), pageSize: 10, footerAggregates: true,
                  searchKeys: ['name', 'department'], exportName: 'late-arrivals',
                })
                : emptyFor('No repeat late arrivals', 'Nobody has more than one late mark in this fortnight.'))));
        }
      };

      const node = page({
        title: 'Staff Attendance',
        subtitle: `${formatNumber(rows.length)} punch records · ${db.biometricDevices.length} biometric devices · fortnight of ${formatDate('2026-08-03')}`,
        route: 'hr/attendance',
        actions: [
          MenuButton([
            { label: 'Sync devices now', icon: 'refresh', onClick: () => notify({ title: 'Sync triggered', text: `${db.biometricDevices.length} devices polled`, tone: 'info' }) },
            { label: 'Download muster roll', icon: 'download', onClick: mockAction('Download muster roll') },
            { label: 'Attendance policy', icon: 'scroll', route: 'hr/leave-types' },
          ], { label: 'More' }),
          Button('Regularise punch', { variant: 'secondary', icon: 'edit', onClick: () => openRegularise() }),
          Button('Mark attendance', { variant: 'primary', icon: 'clipboard-check', onClick: () => notify({ title: 'Manual marking opened', text: 'Demo only — biometric feed is authoritative.', tone: 'info' }) }),
        ],
        tabs: [
          { id: 'log', label: 'Punch log', icon: 'fingerprint', count: rows.length },
          { id: 'register', label: 'Monthly register', icon: 'table' },
          { id: 'late', label: 'Late analysis', icon: 'clock', count: late.length },
        ],
        activeTab: 'log',
        onTabChange: (id) => { activeTab = id; paintTab(); },
        children: [
          kpiRow([
            { label: 'Present today', value: `${present} / ${todayRows.length || db.staff.length}`, icon: 'check-circle', tone: 'success', trend: analytics.sparks.staffAttendance },
            { label: 'Avg staff attendance', value: `${analytics.kpis.avgStaffAttendance}%`, delta: 0.8, icon: 'clipboard-check', tone: 'brand' },
            { label: 'On leave', value: String(rows.filter((r) => r.status === 'On Leave').length), icon: 'calendar', tone: 'info', route: 'hr/leave-requests' },
            { label: 'Late marks', value: String(late.length), icon: 'clock', tone: 'warning' },
            { label: 'Absent', value: String(rows.filter((r) => r.status === 'Absent').length), icon: 'x-circle', tone: 'danger' },
          ]),
          Card({ className: 'p-0' }, FilterBar({
            filters: [
              { id: 'campus', label: 'Campus', options: campusFilterOptions(), value: campus, allLabel: 'All campuses' },
              { id: 'department', label: 'Department', options: DEPT_NAMES() },
              { id: 'status', label: 'Status', options: ['Present', 'Absent', 'On Leave', 'Half Day', 'On Duty'] },
              { id: 'source', label: 'Source', options: ['Biometric', 'RFID', 'Manual'] },
              { id: 'date', label: 'Date', type: 'date' },
            ],
            onChange: (id, value, allValues) => {
              let out = all;
              if (allValues.campus && allValues.campus !== 'all') out = out.filter((r) => r.campusId === allValues.campus);
              if (allValues.department && allValues.department !== 'all') out = out.filter((r) => r.department === allValues.department);
              if (allValues.status && allValues.status !== 'all') out = out.filter((r) => r.status === allValues.status);
              if (allValues.source && allValues.source !== 'all') out = out.filter((r) => r.source === allValues.source);
              if (allValues.date) out = out.filter((r) => r.date === allValues.date);
              rows = out;
              table.refresh(out);
            },
          })),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-8' },
              SectionCard({ title: 'Staff attendance trend', subtitle: 'Present, leave and absent by month', className: 'chart-card' },
                areaChart({
                  categories: analytics.staffAttendance.map((r) => r.month),
                  series: [
                    { name: 'Present', values: analytics.staffAttendance.map((r) => r.present) },
                    { name: 'Leave', values: analytics.staffAttendance.map((r) => r.leave) },
                    { name: 'Absent', values: analytics.staffAttendance.map((r) => r.absent) },
                  ],
                  stacked: true, height: 280, title: 'Staff attendance trend',
                }))),
            h('div', { className: 'span-4' },
              SectionCard({ title: 'Status mix', subtitle: 'Current fortnight', className: 'chart-card' },
                donutChart({ data: byStatus, height: 280, centerValue: formatNumber(rows.length), centerLabel: 'Punches', title: 'Attendance status mix' })))),
          tabHost,
        ],
      });

      paintTab();
      mount.appendChild(node);
    },
  },
};

function openRegularise(rec) {
  formPage({
    title: rec ? `Regularise — ${rec.employeeName}` : 'Regularise attendance',
    subtitle: 'Use this when a biometric punch is missing or the employee was on official duty.',
    mode: 'modal', size: 'md', submitLabel: 'Submit for approval',
    values: rec ? { date: rec.date, inTime: rec.inTime || '', outTime: rec.outTime || '' } : {},
    sections: [{
      title: 'Correction', cols: 2,
      fields: [
        { id: 'employee', label: 'Employee', type: 'combobox', required: true, options: db.staff.slice(0, 150).map((s) => ({ value: s.id, label: `${s.name} — ${s.employeeCode}` })), value: rec ? rec.employeeId : undefined },
        { id: 'date', label: 'Date', type: 'date', required: true },
        { id: 'inTime', label: 'In time', type: 'time' },
        { id: 'outTime', label: 'Out time', type: 'time' },
        { id: 'reason', label: 'Reason', type: 'select', span: 'full', required: true, options: ['Missed punch', 'On official duty', 'Device failure', 'Field visit', 'Late approval by Principal'] },
        { id: 'notes', label: 'Supporting note', type: 'textarea', span: 'full' },
      ],
    }],
    onSubmit: () => notify({ title: 'Regularisation submitted', text: 'Routed to the reporting manager for approval.', tone: 'success' }),
  });
}

/* ==========================================================================
   8 · Leave management
   ========================================================================== */

function leaveDetailBody(l) {
  const s = byId(db.staff, l.employeeId);
  const ledger = s ? leaveLedgerFor(s) : [];
  const bal = ledger.find((x) => x.name === l.leaveType);
  return h('div', { className: 'stack' },
    h('div', { className: 'row-3 row-wrap' },
      Avatar(l.employeeName, { size: 'lg' }),
      h('div', { className: 'stack-1 flex-1' },
        h('div', { className: 't-semibold' }, l.employeeName),
        h('div', { className: 't-sm t-muted' }, `${l.designation} · ${l.department} · ${campusName(l.campusId)}`)),
      Badge(l.status)),
    DescriptionList([
      ['Leave type', l.leaveType],
      ['From', formatDate(l.fromDate)],
      ['To', formatDate(l.toDate)],
      ['Days', String(l.days)],
      ['Applied on', `${formatDate(l.appliedOn)} (${relativeTime(l.appliedOn)})`],
      ['Reason', l.reason],
      ['Substitute arranged', l.substituteArranged ? 'Yes' : 'No'],
      ['Attachment', l.attachment || 'None'],
    ], { cols: 2 }),
    bal ? Callout({ tone: bal.balance >= l.days ? 'info' : 'warning', icon: 'scale', title: 'Balance check' },
      `${l.employeeName} has ${bal.balance} day(s) of ${l.leaveType} left against an entitlement of ${bal.entitled}. This request consumes ${l.days} day(s)${bal.balance < l.days ? ' — the excess will be treated as leave without pay.' : '.'}`) : null,
    !l.substituteArranged && s && s.type === 'Teaching'
      ? Callout({ tone: 'danger', icon: 'alert-triangle', title: 'No substitute arranged' },
        'Teaching staff must nominate a substitute before approval; otherwise the periods go to the substitution pool.')
      : null,
    SectionCard({ title: 'Approval trail', icon: 'workflow' }, ApprovalTrail(leaveTrail(l))),
    l.attachment ? FileList([{ name: l.attachment, type: 'pdf', size: '286 KB', date: l.appliedOn, status: 'Verified' }]) : null);
}

function openLeaveDetail(l) {
  Drawer({
    title: `${l.leaveType} — ${l.employeeName}`,
    subtitle: `${formatDate(l.fromDate)} to ${formatDate(l.toDate)} · ${l.days} day(s)`,
    size: 'lg',
    body: leaveDetailBody(l),
    actions: (close) => frag(
      Button('Open employee', { variant: 'ghost', icon: 'id-card', onClick: () => { close(); navigate(`hr/employee-profile/${l.employeeId}`, { tab: 'leave' }); } }),
      Button('Close', { variant: 'secondary', onClick: close })),
  });
}

function openLeaveForm(s) {
  formPage({
    title: s ? `Apply leave — ${s.name}` : 'Apply for leave',
    subtitle: 'Applications route to the head of department, then the principal.',
    mode: 'modal', size: 'lg', submitLabel: 'Submit application',
    values: s ? { employee: s.id } : {},
    sections: [{
      title: 'Leave request', cols: 2,
      fields: [
        { id: 'employee', label: 'Employee', type: 'combobox', required: true, options: db.staff.slice(0, 150).map((x) => ({ value: x.id, label: `${x.name} — ${x.employeeCode}` })) },
        { id: 'leaveType', label: 'Leave type', type: 'select', required: true, options: db.leaveTypes.map((t) => ({ value: t.id, label: `${t.name} (${t.code})` })) },
        { id: 'from', label: 'From', type: 'date', required: true },
        { id: 'to', label: 'To', type: 'date', required: true },
        { id: 'halfDay', label: 'Half day', type: 'checkbox', inline: true },
        { id: 'substitute', label: 'Substitute teacher', type: 'combobox', options: db.staff.filter((x) => x.type === 'Teaching').slice(0, 120).map((x) => ({ value: x.id, label: x.name })) },
        { id: 'reason', label: 'Reason', type: 'textarea', span: 'full', required: true, validate: validators.required },
        { id: 'attachment', label: 'Supporting document', type: 'file', span: 'full', hint: 'Medical certificate is mandatory for sick leave over three days.' },
      ],
    }],
    onSubmit: () => notify({ title: 'Leave application submitted', text: 'Level 1 approver notified.', tone: 'success' }),
  });
}

const leaveRoutes = {
  'hr/leave-requests': {
    title: 'Leave Requests',
    subtitle: 'Multi-level approval queue for every leave application',
    section: 'hr',
    render(mount, ctx) {
      injectStyles();
      const all = db.leaveRequests;
      const pending = all.filter((l) => l.status === 'Pending');
      let activeTab = qOf(ctx).tab || 'pending';
      const rowsFor = (tab) => (tab === 'all' ? all : tab === 'pending' ? pending : all.filter((l) => l.status.toLowerCase() === tab));

      const node = approvalQueuePage({
        title: 'Leave Requests',
        subtitle: `${pending.length} awaiting a decision · ${all.length} applications this academic year`,
        route: 'hr/leave-requests',
        kpis: [
          { label: 'Pending', value: String(pending.length), icon: 'inbox', tone: 'warning' },
          { label: 'Approved', value: String(all.filter((l) => l.status === 'Approved').length), icon: 'check-circle', tone: 'success' },
          { label: 'Rejected', value: String(all.filter((l) => l.status === 'Rejected').length), icon: 'x-circle', tone: 'danger' },
          { label: 'Days applied', value: formatNumber(all.reduce((t, l) => t + l.days, 0)), icon: 'calendar', tone: 'brand' },
          { label: 'Without substitute', value: String(all.filter((l) => !l.substituteArranged).length), icon: 'alert-triangle', tone: 'danger' },
        ],
        tabs: [
          { id: 'pending', label: 'Pending', count: pending.length },
          { id: 'approved', label: 'Approved', count: all.filter((l) => l.status === 'Approved').length },
          { id: 'rejected', label: 'Rejected', count: all.filter((l) => l.status === 'Rejected').length },
          { id: 'cancelled', label: 'Cancelled', count: all.filter((l) => l.status === 'Cancelled').length },
          { id: 'all', label: 'All', count: all.length },
        ],
        activeTab,
        onTabChange: (id) => { activeTab = id; node.table.refresh(rowsFor(id)); },
        filters: [
          { id: 'leaveType', label: 'Leave type', options: db.leaveTypes.map((t) => t.name) },
          { id: 'department', label: 'Department', options: DEPT_NAMES() },
          { id: 'campus', label: 'Campus', options: campusFilterOptions() },
        ],
        onFilter: (id, value, allValues, table) => {
          let out = rowsFor(activeTab);
          if (allValues.leaveType && allValues.leaveType !== 'all') out = out.filter((l) => l.leaveType === allValues.leaveType);
          if (allValues.department && allValues.department !== 'all') out = out.filter((l) => l.department === allValues.department);
          if (allValues.campus && allValues.campus !== 'all') out = out.filter((l) => l.campusId === allValues.campus);
          table.refresh(out);
        },
        columns: [
          { key: 'employeeName', label: 'Employee', width: 230, sticky: true, render: (l) => empCellById(l.employeeId, `${l.designation} · ${l.department}`), value: (l) => l.employeeName },
          { key: 'leaveType', label: 'Type', width: 160, filter: true },
          { key: 'fromDate', label: 'From', width: 120, render: (l) => formatDate(l.fromDate), value: (l) => l.fromDate },
          { key: 'toDate', label: 'To', width: 120, render: (l) => formatDate(l.toDate), value: (l) => l.toDate },
          { key: 'days', label: 'Days', width: 80, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'reason', label: 'Reason', width: 180 },
          { key: 'substituteArranged', label: 'Substitute', width: 120, align: 'center', render: (l) => Badge(l.substituteArranged ? 'Arranged' : 'Missing', { tone: l.substituteArranged ? 'success' : 'danger' }) },
          { key: 'appliedOn', label: 'Applied', width: 130, render: (l) => relativeTime(l.appliedOn), value: (l) => l.appliedOn },
          { key: 'approverName', label: 'Approver', width: 180, render: (l) => l.approverName || '—' },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (l) => Badge(l.status) },
        ],
        rows: rowsFor(activeTab),
        onApprove: (l) => notify({ title: 'Leave approved', text: `${l.employeeName} · ${l.days} day(s) of ${l.leaveType}`, tone: 'success' }),
        onReject: (l) => notify({ title: 'Leave rejected', text: `${l.employeeName} has been notified with the reason.`, tone: 'danger' }),
        detail: (l) => leaveDetailBody(l),
      });

      mount.appendChild(node);
    },
  },

  'hr/leave-types': {
    title: 'Leave Types',
    subtitle: 'Entitlement rules, carry-forward and encashment policy',
    section: 'hr',
    render(mount) {
      injectStyles();
      const types = db.leaveTypes.map((t) => {
        const used = db.leaveRequests.filter((l) => l.leaveTypeId === t.id && l.status === 'Approved');
        return {
          ...t,
          requests: db.leaveRequests.filter((l) => l.leaveTypeId === t.id).length,
          daysTaken: used.reduce((x, l) => x + l.days, 0),
          employeesUsing: new Set(used.map((l) => l.employeeId)).size,
        };
      });

      mount.appendChild(listPage({
        title: 'Leave Types',
        subtitle: `${types.length} configured leave types · quota resets on 1 April with the academic year`,
        route: 'hr/leave-types',
        actions: [
          Button('Leave balance', { variant: 'secondary', icon: 'scale', route: 'hr/leave-balance' }),
          Button('Add leave type', { variant: 'primary', icon: 'plus', onClick: () => openLeaveTypeForm() }),
        ],
        kpis: [
          { label: 'Leave types', value: String(types.length), icon: 'sliders', tone: 'brand' },
          { label: 'Paid types', value: String(types.filter((t) => t.paid).length), icon: 'wallet', tone: 'success' },
          { label: 'Encashable', value: String(types.filter((t) => t.encashable).length), icon: 'banknote', tone: 'info' },
          { label: 'Days taken YTD', value: formatNumber(types.reduce((t, x) => t + x.daysTaken, 0)), icon: 'calendar', tone: 'warning' },
        ],
        chart: barChart({
          categories: types.map((t) => t.name),
          series: [{ name: 'Days taken', values: types.map((t) => t.daysTaken) }],
          horizontal: true, height: 300, title: 'Days consumed by leave type',
        }),
        chartTitle: 'Days consumed by leave type',
        columns: [
          { key: 'name', label: 'Leave type', width: 210, sticky: true },
          { key: 'code', label: 'Code', width: 90, align: 'center', render: (t) => Badge(t.code, { tone: 'neutral' }) },
          { key: 'annualQuota', label: 'Annual quota', align: 'right', numeric: true, render: (t) => (t.annualQuota ? `${t.annualQuota} days` : 'As sanctioned'), value: (t) => t.annualQuota },
          { key: 'applicableTo', label: 'Applicable to', width: 140, filter: true },
          { key: 'paid', label: 'Paid', width: 100, align: 'center', render: (t) => Badge(t.paid ? 'Paid' : 'Unpaid', { tone: t.paid ? 'success' : 'danger' }) },
          { key: 'carryForward', label: 'Carry forward', width: 130, align: 'center', render: (t) => Badge(t.carryForward ? 'Yes' : 'No', { tone: t.carryForward ? 'info' : 'neutral' }) },
          { key: 'encashable', label: 'Encashable', width: 120, align: 'center', render: (t) => Badge(t.encashable ? 'Yes' : 'No', { tone: t.encashable ? 'success' : 'neutral' }) },
          { key: 'requests', label: 'Requests', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'daysTaken', label: 'Days taken', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'employeesUsing', label: 'Employees', align: 'right', numeric: true, aggregate: 'sum' },
        ],
        rows: types,
        footerAggregates: true,
        paginate: false,
        searchKeys: ['name', 'code'],
        rowActions: (t) => [
          { label: 'Edit rules', icon: 'edit', onClick: () => openLeaveTypeForm(t) },
          { label: 'View requests', icon: 'inbox', route: 'hr/leave-requests' },
          { separator: true },
          { label: 'Deactivate', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: `Deactivate ${t.name}?`, text: 'Employees will no longer be able to apply under this type. Existing approved leave is unaffected.', confirmLabel: 'Deactivate', tone: 'danger' }).then((ok) => ok && notify({ title: `${t.name} deactivated`, tone: 'warning' })) },
        ],
        onRowClick: (t) => openLeaveTypeForm(t),
        exportName: 'leave-types',
        notes: Callout({ tone: 'info', icon: 'scroll', title: 'Policy notes' },
          'Earned leave accrues at two days a month and can be carried forward up to 45 days. Casual leave lapses on 31 March. Leave without pay is deducted from gross at gross ÷ 30 per day.'),
        emptyState: emptyFor('No leave types', 'Configure at least casual, sick and earned leave.'),
      }));
    },
  },

  'hr/leave-balance': {
    title: 'Leave Balance',
    subtitle: 'Entitlement versus consumption for every employee',
    section: 'hr',
    render(mount, ctx) {
      injectStyles();
      const rows = db.staff.map((s) => {
        const ledger = leaveLedgerFor(s);
        const entitled = ledger.reduce((t, l) => t + l.entitled, 0);
        const used = ledger.reduce((t, l) => t + l.used, 0);
        const encashable = ledger.filter((l) => l.encashable).reduce((t, l) => t + l.balance, 0);
        const sal = salaryFor(s);
        return {
          id: s.id, employeeId: s.id, name: s.name, employeeCode: s.employeeCode,
          designation: s.designation, department: s.department, campusId: s.campusId, type: s.type,
          cl: s.leaveBalanceCL, sl: s.leaveBalanceSL, el: s.leaveBalanceEL,
          entitled, used, balance: Math.max(0, entitled - used),
          utilisation: entitled ? round2((used / entitled) * 100) : 0,
          encashableDays: encashable,
          encashValue: Math.round((sal.basic / 30) * encashable),
        };
      });
      const totalLiability = rows.reduce((t, r) => t + r.encashValue, 0);

      mount.appendChild(reportPage({
        title: 'Leave Balance',
        subtitle: `FY 2026-27 · ${formatNumber(rows.length)} employees · encashment liability ${inrC(totalLiability)}`,
        route: 'hr/leave-balance',
        filters: [
          { id: 'campus', label: 'Campus', options: campusFilterOptions(), value: currentCampus(ctx), allLabel: 'All campuses' },
          { id: 'department', label: 'Department', options: DEPT_NAMES() },
          { id: 'type', label: 'Cadre', options: ['Teaching', 'Non-Teaching'] },
          { id: 'band', label: 'Utilisation', type: 'segment', options: [{ id: 'all', label: 'All' }, { id: 'high', label: 'Over 70%' }, { id: 'low', label: 'Under 30%' }] },
        ],
        onFilter: (id, value, allValues, table) => {
          let out = rows;
          if (allValues.campus && allValues.campus !== 'all') out = out.filter((r) => r.campusId === allValues.campus);
          if (allValues.department && allValues.department !== 'all') out = out.filter((r) => r.department === allValues.department);
          if (allValues.type && allValues.type !== 'all') out = out.filter((r) => r.type === allValues.type);
          if (allValues.band === 'high') out = out.filter((r) => r.utilisation > 70);
          if (allValues.band === 'low') out = out.filter((r) => r.utilisation < 30);
          table.refresh(out);
        },
        summary: [
          { label: 'Total entitlement', value: formatNumber(rows.reduce((t, r) => t + r.entitled, 0)), icon: 'calendar', tone: 'brand' },
          { label: 'Days consumed', value: formatNumber(rows.reduce((t, r) => t + r.used, 0)), icon: 'clipboard-check', tone: 'info' },
          { label: 'Encashable days', value: formatNumber(rows.reduce((t, r) => t + r.encashableDays, 0)), icon: 'banknote', tone: 'warning' },
          { label: 'Encashment liability', value: inrC(totalLiability), icon: 'calculator', tone: 'danger' },
        ],
        chart: [
          barChart({
            categories: db.leaveTypes.map((t) => t.code),
            series: [
              { name: 'Entitled', values: db.leaveTypes.map((t) => rows.length * (t.annualQuota || 0)) },
              { name: 'Consumed', values: db.leaveTypes.map((t) => db.leaveRequests.filter((l) => l.leaveTypeId === t.id && l.status === 'Approved').reduce((x, l) => x + l.days, 0)) },
            ],
            height: 300, title: 'Entitlement versus consumption by leave type',
          }),
        ],
        chartTitle: 'Entitlement versus consumption by leave type',
        columns: [
          { key: 'name', label: 'Employee', width: 230, sticky: true, render: (r) => empCellById(r.employeeId, `${r.employeeCode} · ${r.designation}`), value: (r) => r.name },
          { key: 'department', label: 'Department', width: 150, filter: true },
          { key: 'campusId', label: 'Campus', width: 150, filter: true, render: (r) => campusName(r.campusId), value: (r) => campusName(r.campusId) },
          { key: 'cl', label: 'CL', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'sl', label: 'SL', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'el', label: 'EL', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'entitled', label: 'Entitled', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'used', label: 'Used', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'balance', label: 'Balance', align: 'right', numeric: true, aggregate: 'sum' },
          {
            key: 'utilisation', label: 'Utilisation', width: 170, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round2(v)}%`,
            render: (r) => ProgressBar(r.utilisation, { size: 'sm', showValue: true, tone: r.utilisation > 80 ? 'danger' : r.utilisation > 50 ? 'warning' : 'success' }),
          },
          { key: 'encashableDays', label: 'Encashable', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'encashValue', label: 'Liability', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.encashValue), value: (r) => r.encashValue },
        ],
        rows,
        tableTitle: 'Employee-wise balance',
        footerAggregates: true,
        pageSize: 25,
        notes: Callout({ tone: 'warning', icon: 'calculator', title: 'Provisioning note' },
          `Encashment liability is computed as basic ÷ 30 × encashable balance. Finance provisions ${inrC(totalLiability)} against this at year end; the figure moves with every approved earned-leave application.`),
      }));
    },
  },

  'hr/holidays': {
    title: 'Holiday Calendar',
    subtitle: 'Gazetted, festival and vacation days for the academic year',
    section: 'hr',
    render(mount, ctx) {
      injectStyles();
      const hol = db.holidays;
      const month = qOf(ctx).month || '2026-08';
      const events = hol.map((x) => ({
        date: x.date,
        title: x.name,
        meta: `${x.type} · ${x.days} day${x.days > 1 ? 's' : ''}`,
        tone: x.type === 'National' ? 'brand' : x.type === 'Vacation' ? 'info' : x.type === 'Festival' ? 'warning' : 'neutral',
        badge: x.type,
        __id: x.id,
      }));
      const totalDays = hol.reduce((t, x) => t + x.days, 0);

      const node = calendarPage({
        title: 'Holiday Calendar',
        subtitle: `${hol.length} holiday blocks · ${totalDays} non-working days in FY 2026-27`,
        route: 'hr/holidays',
        month,
        events,
        actions: [
          Button('Download calendar', { variant: 'secondary', icon: 'download', onClick: () => { download('holiday-calendar.csv', toCsv(hol, [{ key: 'name', label: 'Holiday' }, { key: 'date', label: 'Date' }, { key: 'type', label: 'Type' }, { key: 'days', label: 'Days' }]), 'text/csv;charset=utf-8'); notify({ title: 'Calendar exported', tone: 'success' }); } }),
          Button('Add holiday', { variant: 'primary', icon: 'plus', onClick: () => openHolidayForm() }),
        ],
        kpis: [
          { label: 'Holiday blocks', value: String(hol.length), icon: 'umbrella', tone: 'brand' },
          { label: 'Non-working days', value: String(totalDays), icon: 'calendar', tone: 'info' },
          { label: 'Vacation days', value: String(hol.filter((x) => x.type === 'Vacation').reduce((t, x) => t + x.days, 0)), icon: 'sun', tone: 'warning' },
          { label: 'Campus-specific', value: String(hol.filter((x) => x.campusId !== 'ALL').length), icon: 'building', tone: 'neutral' },
        ],
        onSelectEvent: (ev) => {
          const x = hol.find((y) => y.id === ev.__id);
          if (x) Modal({
            title: x.name, subtitle: `${formatDate(x.date)} · ${x.type}`, size: 'sm', icon: 'umbrella', tone: 'brand',
            body: DescriptionList([
              ['Date', formatDate(x.date, 'long')],
              ['Type', x.type],
              ['Duration', `${x.days} day${x.days > 1 ? 's' : ''}`],
              ['Applies to', x.campusId === 'ALL' ? 'All campuses' : campusName(x.campusId)],
              ['Staff working', x.type === 'Vacation' ? 'Administration on skeleton duty' : 'None'],
            ]),
            actions: (close) => frag(
              Button('Close', { variant: 'ghost', onClick: close }),
              Button('Edit', { variant: 'primary', icon: 'edit', onClick: () => { close(); openHolidayForm(x); } })),
          });
        },
        onSelectDate: (date) => {
          const match = hol.find((x) => x.date === date);
          notify({ title: match ? match.name : formatDate(date), text: match ? `${match.type} · ${match.days} day(s)` : 'A regular working day.', tone: match ? 'info' : 'neutral' });
        },
        sidebar: [
          SectionCard({ title: 'Upcoming', icon: 'calendar-check' },
            (() => {
              const upcoming = sortBy(hol.filter((x) => x.date >= '2026-08-20'), 'date').slice(0, 6);
              return upcoming.length
                ? h('div', { className: 'stack-2' }, upcoming.map((x) => MetricRow(x.name, formatDate(x.date, 'dayMonth'), Badge(x.type))))
                : emptyFor('Nothing upcoming', 'No holidays remain in this academic year.');
            })()),
          SectionCard({ title: 'By type', className: 'chart-card' },
            donutChart({ data: countBy(hol, 'type'), height: 220, centerValue: String(totalDays), centerLabel: 'Days', title: 'Holidays by type' })),
          SectionCard({ title: 'Working-day impact', icon: 'info' },
            h('div', { className: 'stack-2' },
              MetricRow('Academic days planned', '220'),
              MetricRow('Holidays & vacation', String(totalDays)),
              MetricRow('Sundays', '52'),
              Divider(),
              MetricRow('Net instructional days', String(365 - totalDays - 52)))),
        ],
        legend: h('div', { className: 'row-3 row-wrap' },
          Badge('National', { tone: 'brand', dot: true }),
          Badge('Festival', { tone: 'warning', dot: true }),
          Badge('Vacation', { tone: 'info', dot: true }),
          Badge('Restricted', { tone: 'neutral', dot: true })),
      });

      node.appendChild(h('div', { className: 'stack mt-4' },
        SectionCard({ title: 'Holiday list', subtitle: 'Declared under the CBSE academic calendar', flush: true },
          DataTable({
            columns: [
              { key: 'name', label: 'Holiday', width: 240, sticky: true },
              { key: 'date', label: 'Date', width: 150, render: (x) => formatDate(x.date), value: (x) => x.date },
              { key: 'type', label: 'Type', width: 130, filter: true, render: (x) => Badge(x.type, { tone: x.type === 'National' ? 'brand' : x.type === 'Vacation' ? 'info' : x.type === 'Festival' ? 'warning' : 'neutral' }) },
              { key: 'days', label: 'Days', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
              { key: 'campusId', label: 'Applies to', width: 190, render: (x) => (x.campusId === 'ALL' ? 'All campuses' : campusName(x.campusId)), value: (x) => x.campusId },
            ],
            rows: sortBy(hol, 'date'), paginate: false, footerAggregates: true, exportName: 'holidays',
            rowActions: (x) => [
              { label: 'Edit holiday', icon: 'edit', onClick: () => openHolidayForm(x) },
              { label: 'Remove', icon: 'trash', tone: 'danger', onClick: () => ConfirmDialog({ title: `Remove ${x.name}?`, text: 'Attendance for that date will revert to a working day.', confirmLabel: 'Remove', tone: 'danger' }).then((ok) => ok && notify({ title: 'Holiday removed', tone: 'warning' })) },
            ],
          }))));

      mount.appendChild(node);
    },
  },
};

function openLeaveTypeForm(t) {
  formPage({
    title: t ? `Edit ${t.name}` : 'Add leave type',
    mode: 'modal', size: 'lg', submitLabel: 'Save leave type',
    values: t ? { name: t.name, code: t.code, quota: t.annualQuota, applicableTo: t.applicableTo, paid: t.paid, carryForward: t.carryForward, encashable: t.encashable } : { paid: true },
    sections: [{
      title: 'Definition', cols: 2,
      fields: [
        { id: 'name', label: 'Leave type name', required: true, validate: validators.required },
        { id: 'code', label: 'Short code', required: true, placeholder: 'CL', validate: validators.required },
        { id: 'quota', label: 'Annual quota (days)', type: 'number', validate: validators.number, hint: 'Use 0 for “as sanctioned”.' },
        { id: 'applicableTo', label: 'Applicable to', type: 'select', options: ['All', 'Permanent', 'Teaching', 'Female', 'Male'] },
      ],
    }, {
      title: 'Rules', cols: 2,
      fields: [
        { id: 'paid', label: 'Paid leave', type: 'switch', switchLabel: 'Salary is paid for these days' },
        { id: 'carryForward', label: 'Carry forward', type: 'switch', switchLabel: 'Unused balance carries to next year' },
        { id: 'encashable', label: 'Encashable', type: 'switch', switchLabel: 'Balance can be encashed at exit' },
        { id: 'maxConsecutive', label: 'Max consecutive days', type: 'number' },
        { id: 'docRequired', label: 'Document required after (days)', type: 'number', hint: 'Medical certificate threshold.' },
        { id: 'notes', label: 'Policy note', type: 'textarea', span: 'full' },
      ],
    }],
    onSubmit: (v) => notify({ title: 'Leave type saved', text: `${v.name} (${v.code})`, tone: 'success' }),
  });
}

function openHolidayForm(x) {
  formPage({
    title: x ? `Edit ${x.name}` : 'Add holiday',
    mode: 'modal', size: 'md', submitLabel: 'Save holiday',
    values: x ? { name: x.name, date: x.date, type: x.type, days: x.days, campus: x.campusId } : { days: 1 },
    sections: [{
      title: 'Holiday', cols: 2,
      fields: [
        { id: 'name', label: 'Holiday name', required: true, validate: validators.required, span: 'full' },
        { id: 'date', label: 'Start date', type: 'date', required: true },
        { id: 'days', label: 'Number of days', type: 'number', required: true, validate: [validators.required, validators.min(1)] },
        { id: 'type', label: 'Type', type: 'select', options: ['National', 'Gazetted', 'Festival', 'Restricted', 'Vacation'], required: true },
        { id: 'campus', label: 'Applies to', type: 'select', options: [{ value: 'ALL', label: 'All campuses' }].concat(campusFilterOptions()) },
        { id: 'notes', label: 'Note for staff', type: 'textarea', span: 'full' },
      ],
    }],
    onSubmit: (v) => notify({ title: 'Holiday saved', text: `${v.name} · ${v.days || 1} day(s)`, tone: 'success' }),
  });
}

/* ==========================================================================
   9 · PAYROLL (flagship)
   ========================================================================== */

/** Compute the payroll sheet for a month: one row per employee. */
function payrollSheet(month) {
  const active = db.staff.filter((s) => s.status !== 'Resigned');
  return active.map((s) => {
    const sal = salaryFor(s);
    const r = rngFor('hrsheet' + s.id + month);
    const lop = rBool(r, 0.1) ? rInt(r, 1, 2) : 0;
    const lopAmount = Math.round((sal.gross / 30) * lop);
    const loan = loans().find((l) => l.employeeId === s.id && l.status === 'Active');
    const emi = loan ? loan.emi : 0;
    const arrears = rBool(r, 0.05) ? rInt(r, 1200, 9000) : 0;
    const overtime = s.type === 'Non-Teaching' && rBool(r, 0.2) ? rInt(r, 500, 3200) : 0;
    const grossPayable = sal.gross + arrears + overtime - lopAmount;
    const deductions = sal.pf + sal.esi + sal.tds + sal.pt + emi;
    return {
      id: `${month}-${s.id}`,
      employeeId: s.id,
      employeeCode: s.employeeCode,
      name: s.name,
      designation: s.designation,
      department: s.department,
      campusId: s.campusId,
      band: s.band,
      bankName: s.bankName,
      accountMasked: s.accountMasked,
      ifsc: s.ifsc,
      uan: s.uan,
      pan: s.pan,
      basic: sal.basic, hra: sal.hra, da: sal.da, conveyance: sal.conveyance, special: sal.special,
      arrears, overtime,
      lopDays: lop, lopAmount,
      gross: grossPayable,
      pf: sal.pf, esi: sal.esi, tds: sal.tds, pt: sal.pt, emi,
      deductions,
      net: grossPayable - deductions,
      employerPf: Math.round(sal.basic * 0.12),
      employerEsi: sal.esi ? Math.round(sal.gross * 0.0325) : 0,
    };
  });
}

const sheetCache = new Map();
function sheetFor(month) {
  if (!sheetCache.has(month)) sheetCache.set(month, payrollSheet(month));
  return sheetCache.get(month);
}

function sheetColumns() {
  return [
    { key: 'name', label: 'Employee', width: 220, sticky: true, render: (r) => empCellById(r.employeeId, `${r.employeeCode} · ${r.designation}`), value: (r) => r.name },
    { key: 'department', label: 'Department', width: 140, filter: true },
    { key: 'band', label: 'Band', width: 70, align: 'center', filter: true },
    { key: 'basic', label: 'Basic', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.basic), value: (r) => r.basic },
    { key: 'hra', label: 'HRA', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.hra), value: (r) => r.hra },
    { key: 'da', label: 'DA', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.da), value: (r) => r.da },
    { key: 'conveyance', label: 'Conveyance', align: 'right', numeric: true, aggregate: 'sum', format: inrC, hidden: true, render: (r) => inr(r.conveyance), value: (r) => r.conveyance },
    { key: 'special', label: 'Special', align: 'right', numeric: true, aggregate: 'sum', format: inrC, hidden: true, render: (r) => inr(r.special), value: (r) => r.special },
    { key: 'arrears', label: 'Arrears', align: 'right', numeric: true, aggregate: 'sum', format: inrC, hidden: true, render: (r) => (r.arrears ? inr(r.arrears) : '—'), value: (r) => r.arrears },
    { key: 'overtime', label: 'Overtime', align: 'right', numeric: true, aggregate: 'sum', format: inrC, hidden: true, render: (r) => (r.overtime ? inr(r.overtime) : '—'), value: (r) => r.overtime },
    { key: 'lopDays', label: 'LOP', width: 70, align: 'right', numeric: true, aggregate: 'sum', render: (r) => (r.lopDays ? h('span', { className: 't-danger' }, String(r.lopDays)) : '—'), value: (r) => r.lopDays },
    { key: 'gross', label: 'Gross', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => h('strong', null, inr(r.gross)), value: (r) => r.gross },
    { key: 'pf', label: 'EPF', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.pf), value: (r) => r.pf },
    { key: 'esi', label: 'ESI', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => (r.esi ? inr(r.esi) : '—'), value: (r) => r.esi },
    { key: 'tds', label: 'TDS', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => (r.tds ? inr(r.tds) : '—'), value: (r) => r.tds },
    { key: 'pt', label: 'PT', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.pt), value: (r) => r.pt },
    { key: 'emi', label: 'Loan EMI', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => (r.emi ? inr(r.emi) : '—'), value: (r) => r.emi },
    { key: 'deductions', label: 'Deductions', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.deductions), value: (r) => r.deductions },
    { key: 'net', label: 'Net pay', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => h('strong', { className: 't-success' }, inr(r.net)), value: (r) => r.net },
  ];
}

/* -------------------------------------------------- payroll run wizard */

function openPayrollWizard() {
  let step = 0;
  const month = 'Aug 2026';
  const sheet = sheetFor(month);
  const totals = {
    gross: sheet.reduce((t, r) => t + r.gross, 0),
    deductions: sheet.reduce((t, r) => t + r.deductions, 0),
    net: sheet.reduce((t, r) => t + r.net, 0),
    pf: sheet.reduce((t, r) => t + r.pf, 0),
    esi: sheet.reduce((t, r) => t + r.esi, 0),
    tds: sheet.reduce((t, r) => t + r.tds, 0),
    pt: sheet.reduce((t, r) => t + r.pt, 0),
    lop: sheet.reduce((t, r) => t + r.lopDays, 0),
    emi: sheet.reduce((t, r) => t + r.emi, 0),
  };
  const steps = [
    { label: 'Period & scope', description: 'Choose the month and who is included' },
    { label: 'Compute & preview', description: 'Review the computed sheet' },
    { label: 'Approve', description: 'Management sign-off' },
    { label: 'Disburse', description: 'Generate the bank advice' },
  ];

  const host = h('div', { className: 'stack' });
  let modal;

  const stepBody = () => {
    if (step === 0) {
      return h('div', { className: 'stack' },
        FormGrid({ cols: 2 },
          Field({ label: 'Payroll month', required: true }, Select({ options: MONTHS, value: month })),
          Field({ label: 'Pay date' }, DatePicker({ value: '2026-08-31' })),
          Field({ label: 'Campus scope' }, Select({ options: [{ value: 'all', label: 'All campuses' }].concat(campusFilterOptions()), value: 'all' })),
          Field({ label: 'Cadre' }, Select({ options: [{ value: 'all', label: 'All employees' }, { value: 'Teaching', label: 'Teaching only' }, { value: 'Non-Teaching', label: 'Non-teaching only' }], value: 'all' }))),
        h('div', { className: 'stack-2' },
          Switch('Include loss of pay from attendance', { checked: true, description: 'Reads unapproved absences from the biometric register.' }),
          Switch('Recover active loan EMIs', { checked: true, description: `${sheet.filter((r) => r.emi).length} employees have an EMI running this month.` }),
          Switch('Include arrears from mid-cycle revisions', { checked: true }),
          Switch('Hold payroll for employees on notice', { checked: false, description: 'Full & final settlement handles exits separately.' })),
        Callout({ tone: 'info', icon: 'info', title: 'Scope preview' },
          `${formatNumber(sheet.length)} employees will be processed for ${month}, with ${totals.lop} loss-of-pay days deducted.`));
    }
    if (step === 1) {
      return h('div', { className: 'stack' },
        kpiRow([
          { label: 'Employees', value: formatNumber(sheet.length), icon: 'users', tone: 'brand' },
          { label: 'Gross payable', value: inrC(totals.gross), icon: 'banknote', tone: 'info' },
          { label: 'Deductions', value: inrC(totals.deductions), icon: 'percent', tone: 'warning' },
          { label: 'Net disbursement', value: inrC(totals.net), icon: 'wallet', tone: 'success' },
        ]),
        SectionCard({ title: 'Computed sheet', subtitle: 'Every earning and deduction, employee by employee', flush: true },
          DataTable({
            columns: sheetColumns(), rows: sheet, pageSize: 10, footerAggregates: true,
            searchKeys: ['name', 'employeeCode', 'department'], maxHeight: '46vh',
            exportName: `payroll-preview-${month.replace(' ', '-').toLowerCase()}`,
          })),
        Callout({ tone: 'warning', icon: 'alert-triangle', title: 'Pre-flight checks' },
          h('div', { className: 'stack-1' },
            h('div', null, `• ${sheet.filter((r) => r.lopDays > 0).length} employees have loss of pay this month.`),
            h('div', null, `• ${sheet.filter((r) => !r.accountMasked).length} employees are missing bank details.`),
            h('div', null, `• Statutory: EPF ${inrC(totals.pf)} · ESI ${inrC(totals.esi)} · TDS ${inrC(totals.tds)} · PT ${inrC(totals.pt)}.`))));
    }
    if (step === 2) {
      return h('div', { className: 'stack' },
        SectionCard({ title: 'Approval chain', icon: 'workflow' },
          ApprovalTrail([
            { label: 'Prepared by HR', by: 'HR Executive', date: '2026-08-26', state: 'approved', note: `${formatNumber(sheet.length)} employees computed.` },
            { label: 'Verified by Accounts', by: 'Accountant', date: '2026-08-27', state: 'approved', note: `Statutory challans reconciled · ${inrC(totals.pf + totals.esi + totals.tds + totals.pt)}.` },
            { label: 'Approved by Management', by: 'Managing Trustee', date: null, state: 'pending', note: 'Awaiting sign-off on this screen.' },
          ])),
        SectionCard({ title: 'Cost summary', className: 'chart-card' },
          waterfallChart({
            items: [
              { label: 'Gross', value: totals.gross, type: 'start' },
              { label: 'EPF', value: -totals.pf },
              { label: 'ESI', value: -totals.esi },
              { label: 'TDS', value: -totals.tds },
              { label: 'PT', value: -totals.pt },
              { label: 'Loan EMI', value: -totals.emi },
              { label: 'Net payout', value: totals.net, type: 'total' },
            ],
            valueFormat: 'currencyCompact', height: 280, title: 'Gross to net payout',
          })),
        Field({ label: 'Approval remark' }, Textarea({ rows: 3, placeholder: 'Optional note recorded against the run…' })));
    }
    return h('div', { className: 'stack' },
      Callout({ tone: 'success', icon: 'check-circle', title: 'Ready to disburse' },
        `${formatNumber(sheet.length)} salary credits totalling ${inr(totals.net)} will be pushed as an NEFT bulk file.`),
      FormGrid({ cols: 2 },
        Field({ label: 'Disbursing bank account', required: true }, Select({ options: db.bankAccounts.map((b) => ({ value: b.id, label: `${b.bank} — ${b.accountMasked}` })) })),
        Field({ label: 'Value date' }, DatePicker({ value: '2026-08-31' })),
        Field({ label: 'File format' }, Select({ options: ['NEFT bulk (HDFC)', 'RTGS', 'ICICI Corporate Connect', 'SBI CINB'] })),
        Field({ label: 'Payslip release' }, Select({ options: ['Publish to employee portal immediately', 'Publish on pay date', 'Hold for manual release'] }))),
      SectionCard({ title: 'Bank advice preview', subtitle: 'First ten credits', flush: true },
        DataTable({
          columns: [
            { key: 'name', label: 'Beneficiary', width: 200, sticky: true },
            { key: 'bankName', label: 'Bank', width: 160 },
            { key: 'accountMasked', label: 'Account', width: 140 },
            { key: 'ifsc', label: 'IFSC', width: 130 },
            { key: 'net', label: 'Amount', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.net), value: (r) => r.net },
          ],
          rows: sheet.slice(0, 10), paginate: false, searchable: false, columnToggle: false, footerAggregates: true,
          exportName: 'bank-advice-preview',
        })));
  };

  const paint = () => {
    host.innerHTML = '';
    host.appendChild(Stepper(steps, { current: step }));
    host.appendChild(stepBody());
    host.appendChild(FormActions(
      step > 0 ? Button('Back', { variant: 'ghost', icon: 'arrow-left', onClick: () => { step -= 1; paint(); } }) : Button('Cancel', { variant: 'ghost', onClick: () => modal.close() }),
      h('span', { className: 'spacer' }),
      step < steps.length - 1
        ? Button(step === 0 ? 'Compute payroll' : step === 1 ? 'Send for approval' : 'Approve run', {
          variant: 'primary', icon: step === 0 ? 'calculator' : 'check',
          onClick: () => {
            step += 1; paint();
            notify({ title: step === 1 ? 'Payroll computed' : step === 2 ? 'Sent for approval' : 'Run approved', tone: 'success', duration: 2200 });
          },
        })
        : Button('Disburse & generate bank file', {
          variant: 'success', icon: 'banknote',
          onClick: () => {
            modal.close();
            notify({ title: 'Payroll disbursed', text: `${formatNumber(sheet.length)} credits · ${inrC(totals.net)} · bank file generated (demo only)`, tone: 'success' });
          },
        })));
  };

  modal = Modal({
    title: 'Run payroll',
    subtitle: `${month} · four-step wizard`,
    size: 'xl', icon: 'refresh', tone: 'brand',
    body: host,
  });
  paint();
  return modal;
}

/* ------------------------------------------------------ payroll run detail */

function payrollRunDetail(mount, run) {
  const sheet = sheetFor(run.month);
  const totals = {
    gross: sheet.reduce((t, r) => t + r.gross, 0),
    deductions: sheet.reduce((t, r) => t + r.deductions, 0),
    net: sheet.reduce((t, r) => t + r.net, 0),
    pf: sheet.reduce((t, r) => t + r.pf, 0),
    esi: sheet.reduce((t, r) => t + r.esi, 0),
    tds: sheet.reduce((t, r) => t + r.tds, 0),
    pt: sheet.reduce((t, r) => t + r.pt, 0),
    employerPf: sheet.reduce((t, r) => t + r.employerPf, 0),
  };
  let tab = 'sheet';
  const host = h('div');

  const paint = () => {
    host.innerHTML = '';
    if (tab === 'sheet') {
      host.appendChild(SectionCard({ title: 'Computation sheet', subtitle: `${formatNumber(sheet.length)} employees · every earning and deduction`, flush: true },
        DataTable({
          columns: sheetColumns(), rows: sheet, pageSize: 25, footerAggregates: true, selectable: true,
          searchKeys: ['name', 'employeeCode', 'department'], printable: true, maxHeight: '60vh',
          exportName: `payroll-${run.month.replace(' ', '-').toLowerCase()}`,
          onRowClick: (r) => navigate(`hr/employee-profile/${r.employeeId}`, { tab: 'payroll' }),
          rowActions: (r) => [
            { label: 'Open employee', icon: 'id-card', route: `hr/employee-profile/${r.employeeId}` },
            { label: 'View payslip', icon: 'receipt', onClick: () => openPayslip({ ...r, month: run.month, paidOn: run.processedOn, status: run.status === 'Disbursed' ? 'Paid' : 'Pending', lopDays: r.lopDays, employeeName: r.name }) },
          ],
          bulkActions: [
            { label: 'Hold salary', icon: 'lock', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} salaries put on hold`, tone: 'warning' }) },
            { label: 'Email payslips', icon: 'mail', onClick: (sel) => notify({ title: `${sel.length} payslips emailed`, tone: 'success' }) },
          ],
        })));
    } else if (tab === 'statutory') {
      const deptCost = DEPT_NAMES().map((d) => ({ key: d, value: sheet.filter((r) => r.department === d).reduce((t, r) => t + r.gross, 0) }));
      host.appendChild(h('div', { className: 'stack' },
        h('div', { className: 'widget-grid' },
          h('div', { className: 'span-6' },
            SectionCard({ title: 'Statutory contributions', subtitle: 'Employee and employer share', flush: true },
              DataTable({
                columns: [
                  { key: 'head', label: 'Head', width: 200, sticky: true },
                  { key: 'basis', label: 'Basis', width: 240 },
                  { key: 'employee', label: 'Employee share', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.employee), value: (r) => r.employee },
                  { key: 'employer', label: 'Employer share', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.employer), value: (r) => r.employer },
                  { key: 'due', label: 'Challan due', width: 130 },
                ],
                rows: [
                  { id: 'pf', head: 'Provident Fund', basis: '12% of basic (both sides)', employee: totals.pf, employer: totals.employerPf, due: '15 Sep 2026' },
                  { id: 'esi', head: 'ESI', basis: '0.75% / 3.25% of gross ≤ ₹21,000', employee: totals.esi, employer: Math.round(totals.esi * 4.33), due: '15 Sep 2026' },
                  { id: 'tds', head: 'Income Tax (TDS)', basis: 'Section 192 slab', employee: totals.tds, employer: 0, due: '07 Sep 2026' },
                  { id: 'pt', head: 'Professional Tax', basis: 'State slab', employee: totals.pt, employer: 0, due: '20 Sep 2026' },
                ],
                paginate: false, searchable: false, columnToggle: false, footerAggregates: true,
                exportName: `statutory-${run.month}`,
              }))),
          h('div', { className: 'span-6' },
            SectionCard({ title: 'Cost split by department', className: 'chart-card' },
              treemap({ data: deptCost, height: 340, valueFormat: 'currencyCompact', title: 'Payroll cost by department' })))),
        Callout({ tone: 'info', icon: 'calendar-check', title: 'Compliance calendar' },
          'EPF ECR and ESI returns are filed by the 15th, TDS challan 281 by the 7th, and professional tax by the 20th of the following month.')));
    } else {
      host.appendChild(SectionCard({
        title: 'Bank transfer advice', subtitle: `NEFT bulk file · value date ${run.processedOn ? formatDate(run.processedOn) : 'pending approval'}`, flush: true,
        actions: h('div', { className: 'row' },
          Button('Download bank file', { variant: 'secondary', size: 'sm', icon: 'download', onClick: () => { download(`bank-advice-${run.month}.csv`, toCsv(sheet, [{ key: 'name', label: 'Beneficiary' }, { key: 'bankName', label: 'Bank' }, { key: 'accountMasked', label: 'Account' }, { key: 'ifsc', label: 'IFSC' }, { key: 'net', label: 'Amount' }]), 'text/csv;charset=utf-8'); notify({ title: 'Bank file downloaded', tone: 'success' }); } }),
          Button('Print advice', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(host, `Bank advice — ${run.month}`) })),
      },
        DataTable({
          columns: [
            { key: 'name', label: 'Beneficiary', width: 220, sticky: true, render: (r) => empCellById(r.employeeId, r.employeeCode), value: (r) => r.name },
            { key: 'bankName', label: 'Bank', width: 170, filter: true },
            { key: 'accountMasked', label: 'Account', width: 150 },
            { key: 'ifsc', label: 'IFSC', width: 140 },
            { key: 'uan', label: 'UAN', width: 150, hidden: true },
            { key: 'net', label: 'Credit amount', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => h('strong', null, inr(r.net)), value: (r) => r.net },
          ],
          rows: sheet, pageSize: 25, footerAggregates: true, searchKeys: ['name', 'bankName', 'accountMasked'],
          exportName: `bank-advice-${run.month.replace(' ', '-').toLowerCase()}`,
        })));
    }
  };

  const node = page({
    title: `Payroll — ${run.month}`,
    subtitle: `${formatNumber(run.employees)} employees · ${run.status} · processed by ${run.processedBy}`,
    breadcrumb: [
      { label: 'Human Resources', route: 'hr/employees', icon: 'briefcase' },
      { label: 'Payroll Runs', route: 'hr/payroll-runs', icon: 'refresh' },
      { label: run.month },
    ],
    actions: [
      Button('Back to runs', { variant: 'ghost', icon: 'arrow-left', route: 'hr/payroll-runs' }),
      Button('Export sheet', { variant: 'secondary', icon: 'download', onClick: () => { download(`payroll-${run.month}.csv`, toCsv(sheet, sheetColumns().map((c) => ({ key: c.key, label: c.label, value: c.value }))), 'text/csv;charset=utf-8'); notify({ title: 'Payroll sheet exported', tone: 'success' }); } }),
      run.status === 'Disbursed'
        ? Button('Email payslips', { variant: 'primary', icon: 'mail', onClick: () => notify({ title: `${formatNumber(sheet.length)} payslips emailed`, tone: 'success' }) })
        : Button('Approve & disburse', { variant: 'primary', icon: 'check', onClick: () => ConfirmDialog({ title: `Approve payroll for ${run.month}?`, text: `${formatNumber(sheet.length)} salary credits totalling ${inrC(totals.net)} will be released to the bank.`, confirmLabel: 'Approve & disburse', tone: 'brand', icon: 'banknote' }).then((ok) => ok && notify({ title: 'Payroll approved', text: 'Bank file generated · demo only', tone: 'success' })) }),
    ],
    tabs: [
      { id: 'sheet', label: 'Computation sheet', icon: 'table', count: sheet.length },
      { id: 'statutory', label: 'Statutory', icon: 'shield-check' },
      { id: 'bank', label: 'Bank advice', icon: 'building-columns' },
    ],
    activeTab: 'sheet',
    onTabChange: (id) => { tab = id; paint(); },
    children: [
      kpiRow([
        { label: 'Employees', value: formatNumber(sheet.length), icon: 'users', tone: 'brand' },
        { label: 'Gross payable', value: inrC(totals.gross), icon: 'banknote', tone: 'info' },
        { label: 'Deductions', value: inrC(totals.deductions), icon: 'percent', tone: 'warning' },
        { label: 'Net disbursed', value: inrC(totals.net), icon: 'wallet', tone: 'success' },
        { label: 'Employer PF cost', value: inrC(totals.employerPf), icon: 'piggy-bank', tone: 'neutral' },
      ]),
      Card({ pad: true },
        Stepper([
          { label: 'Computed', description: 'Sheet generated' },
          { label: 'Verified', description: 'Accounts reconciled' },
          { label: 'Approved', description: 'Management sign-off' },
          { label: 'Disbursed', description: 'Bank file released' },
        ], { current: run.status === 'Disbursed' ? 4 : 2 })),
      host,
    ],
  });

  paint();
  mount.appendChild(node);
}

const payrollRoutes = {
  'hr/payroll-runs': {
    title: 'Payroll Runs',
    subtitle: 'Monthly computation, approval and disbursement',
    section: 'hr',
    render(mount, ctx) {
      injectStyles();
      if (ctx.param) {
        const run = byId(db.payrollRuns, ctx.param);
        if (!run) { mount.appendChild(missingRecord('payroll run', 'hr/payroll-runs')); return; }
        payrollRunDetail(mount, run);
        return;
      }

      const runs = db.payrollRuns;
      const disbursed = runs.filter((r) => r.status === 'Disbursed');
      const latest = runs[runs.length - 1];

      mount.appendChild(listPage({
        title: 'Payroll Runs',
        subtitle: `${runs.length} runs in FY 2026-27 · ${disbursed.length} disbursed · monthly payroll ${inrC(analytics.kpis.payrollMonthly)}`,
        route: 'hr/payroll-runs',
        actions: [
          Button('Salary structure', { variant: 'secondary', icon: 'layers', route: 'hr/salary-structure' }),
          Button('Payslips', { variant: 'secondary', icon: 'receipt', route: 'hr/payslips' }),
          Button('Run payroll', { variant: 'primary', icon: 'refresh', onClick: () => openPayrollWizard() }),
        ],
        kpis: [
          { label: 'Monthly payroll', value: inrC(latest.grossTotal), delta: 2.1, icon: 'banknote', tone: 'brand' },
          { label: 'Net disbursed YTD', value: inrC(disbursed.reduce((t, r) => t + r.netTotal, 0)), icon: 'wallet', tone: 'success' },
          { label: 'Statutory YTD', value: inrC(disbursed.reduce((t, r) => t + r.pf + r.esi + r.tds, 0)), icon: 'shield-check', tone: 'info' },
          { label: 'Pending approval', value: String(runs.filter((r) => r.status !== 'Disbursed').length), icon: 'clock', tone: 'warning' },
        ],
        chart: comboChart({
          categories: runs.map((r) => r.month.split(' ')[0]),
          bars: [
            { name: 'Net paid', values: runs.map((r) => r.netTotal) },
            { name: 'Deductions', values: runs.map((r) => r.deductionsTotal) },
          ],
          line: { name: 'Gross', values: runs.map((r) => r.grossTotal) },
          stacked: true, valueFormat: 'currencyCompact', height: 300,
          title: 'Monthly payroll — gross, net and deductions',
        }),
        chartTitle: 'Monthly payroll cost',
        chartActions: Button('HR analytics', { variant: 'link', size: 'sm', icon: 'chart-bar', route: 'hr/reports' }),
        columns: [
          { key: 'month', label: 'Period', width: 140, sticky: true, render: (r) => h('div', { className: 'row-3' }, Icon('calendar', 15), h('strong', null, r.month)), value: (r) => r.month },
          { key: 'employees', label: 'Employees', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'grossTotal', label: 'Gross', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.grossTotal), value: (r) => r.grossTotal },
          { key: 'pf', label: 'EPF', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.pf), value: (r) => r.pf },
          { key: 'esi', label: 'ESI', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.esi), value: (r) => r.esi },
          { key: 'tds', label: 'TDS', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.tds), value: (r) => r.tds },
          { key: 'deductionsTotal', label: 'Deductions', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.deductionsTotal), value: (r) => r.deductionsTotal },
          { key: 'netTotal', label: 'Net paid', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => h('strong', { className: 't-success' }, inr(r.netTotal)), value: (r) => r.netTotal },
          { key: 'processedOn', label: 'Processed', width: 130, render: (r) => (r.processedOn ? formatDate(r.processedOn) : '—'), value: (r) => r.processedOn || '' },
          { key: 'bankFileGenerated', label: 'Bank file', width: 120, align: 'center', render: (r) => Badge(r.bankFileGenerated ? 'Generated' : 'Pending', { tone: r.bankFileGenerated ? 'success' : 'warning' }) },
          { key: 'status', label: 'Status', width: 160, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: runs,
        footerAggregates: true,
        paginate: false,
        searchKeys: ['month', 'status'],
        onRowClick: (r) => navigate(`hr/payroll-runs/${r.id}`),
        rowActions: (r) => [
          { label: 'Open computation sheet', icon: 'table', route: `hr/payroll-runs/${r.id}` },
          { label: 'Download bank advice', icon: 'download', onClick: mockAction('Download bank advice') },
          { label: 'Email payslips', icon: 'mail', onClick: () => notify({ title: `Payslips emailed for ${r.month}`, tone: 'success' }) },
          { separator: true },
          { label: 'Reverse run', icon: 'refresh-ccw', tone: 'danger', disabled: r.status !== 'Disbursed', onClick: () => ConfirmDialog({ title: `Reverse the ${r.month} run?`, text: 'All payslips will be withdrawn and the bank file cancelled. Only do this before the value date.', confirmLabel: 'Reverse run', tone: 'danger' }).then((ok) => ok && notify({ title: 'Run reversed', tone: 'danger' })) },
        ],
        exportName: 'payroll-runs',
        notes: Callout({ tone: 'info', icon: 'workflow', title: 'How a run works' },
          'Compute → verify against attendance and loans → management approval → NEFT bulk file → payslips published to the employee portal. Statutory challans are prepared automatically from the same sheet.'),
        emptyState: emptyFor('No payroll runs yet', 'Run the first payroll of the financial year.',
          Button('Run payroll', { variant: 'primary', icon: 'refresh', onClick: () => openPayrollWizard() })),
      }));
    },
  },

  'hr/salary-structure': {
    title: 'Salary Structure',
    subtitle: 'Component builder with formulas, statutory flags and a live preview',
    section: 'hr',
    render(mount) {
      injectStyles();
      const sample = db.staff.find((s) => s.band === 'L4') || db.staff[0];
      let previewFor = sample;
      const previewHost = h('div', { className: 'stack' });

      const paintPreview = () => {
        const sal = salaryFor(previewFor);
        previewHost.innerHTML = '';
        previewHost.appendChild(h('div', { className: 'stack' },
          h('div', { className: 'row-3 row-wrap' },
            Avatar(previewFor.name, { size: 'md' }),
            h('div', { className: 'flex-1 min-0' },
              h('div', { className: 't-semibold' }, previewFor.name),
              h('div', { className: 't-xs t-muted' }, `${previewFor.designation} · band ${previewFor.band}`)),
            Badge(`Band ${previewFor.band}`, { tone: 'neutral' })),
          h('div', { className: 'grid grid-2' },
            h('div', { className: 'stack-1' },
              h('div', { className: 't-eyebrow' }, 'Earnings'),
              h('div', { className: 'hr-slip-line' }, h('span', null, 'Basic'), h('b', null, inr(sal.basic))),
              h('div', { className: 'hr-slip-line' }, h('span', null, 'HRA (40% of basic)'), h('b', null, inr(sal.hra))),
              h('div', { className: 'hr-slip-line' }, h('span', null, 'DA (12% of basic)'), h('b', null, inr(sal.da))),
              h('div', { className: 'hr-slip-line' }, h('span', null, 'Conveyance'), h('b', null, inr(sal.conveyance))),
              h('div', { className: 'hr-slip-line' }, h('span', null, 'Special allowance'), h('b', null, inr(sal.special))),
              h('div', { className: 'hr-slip-total' }, h('span', null, 'Gross'), h('b', null, inr(sal.gross)))),
            h('div', { className: 'stack-1' },
              h('div', { className: 't-eyebrow' }, 'Deductions'),
              h('div', { className: 'hr-slip-line' }, h('span', null, 'EPF (12% of basic)'), h('b', null, inr(sal.pf))),
              h('div', { className: 'hr-slip-line' }, h('span', null, 'ESI'), h('b', null, sal.esi ? inr(sal.esi) : 'Not applicable')),
              h('div', { className: 'hr-slip-line' }, h('span', null, 'TDS'), h('b', null, inr(sal.tds))),
              h('div', { className: 'hr-slip-line' }, h('span', null, 'Professional tax'), h('b', null, inr(sal.pt))),
              h('div', { className: 'hr-slip-total' }, h('span', null, 'Total deductions'), h('b', null, inr(sal.deductions))))),
          h('div', { className: 'hr-slip-net' },
            h('div', null,
              h('div', { className: 't-eyebrow' }, 'Monthly take-home'),
              h('div', { className: 't-xs t-muted' }, `Annual CTC ${inr(sal.ctcAnnual)}`)),
            h('div', { className: 'hr-slip-net-v' }, inr(sal.net))),
          donutChart({
            data: [
              { key: 'Basic', value: sal.basic }, { key: 'HRA', value: sal.hra }, { key: 'DA', value: sal.da },
              { key: 'Conveyance', value: sal.conveyance }, { key: 'Special', value: sal.special },
            ],
            height: 240, centerValue: inrC(sal.gross), centerLabel: 'Gross', valueFormat: 'currency',
            title: 'Component split',
          })));
      };
      paintPreview();

      const componentRow = (c) => h('div', { className: 'hr-comp-row' },
        Field({ label: 'Component' }, Input({ value: c.name, readOnly: true })),
        Field({ label: 'Type' }, Select({ options: ['Earning', 'Deduction'], value: c.type })),
        Field({ label: 'Formula' }, Input({ value: c.formula, onInput: () => {} })),
        h('div', { className: 'row' },
          Badge(c.statutory ? 'Statutory' : c.pfBase ? 'PF base' : c.taxable === false ? 'Tax free' : 'Taxable',
            { tone: c.statutory ? 'info' : c.taxable === false ? 'success' : 'neutral' }),
          IconButton('trash', { size: 'sm', label: `Remove ${c.name}`, onClick: () => notify({ title: `${c.name} removed from the template`, tone: 'warning' }) })));

      const bandRows = BANDS().map((b) => {
        const holders = db.staff.filter((s) => s.band === b);
        const desigs = db.designations.filter((d) => d.band === b);
        const avgGross = holders.length ? Math.round(holders.reduce((t, s) => t + s.salaryGross, 0) / holders.length) : 0;
        return {
          id: b, band: b, designations: desigs.length, headcount: holders.length,
          minBasic: desigs.length ? Math.min(...desigs.map((d) => d.minSalary)) : 0,
          maxBasic: desigs.length ? Math.max(...desigs.map((d) => d.maxSalary)) : 0,
          avgGross,
          monthlyCost: holders.reduce((t, s) => t + s.salaryGross, 0),
        };
      });

      mount.appendChild(page({
        title: 'Salary Structure',
        subtitle: 'One template drives every payroll run · edit a formula and the preview recomputes',
        route: 'hr/salary-structure',
        actions: [
          Button('Payroll runs', { variant: 'secondary', icon: 'refresh', route: 'hr/payroll-runs' }),
          Button('Add component', { variant: 'primary', icon: 'plus', onClick: () => openComponentForm() }),
        ],
        children: [
          kpiRow([
            { label: 'Earning components', value: String(EARNING_COMPONENTS.length), icon: 'plus', tone: 'success' },
            { label: 'Deduction components', value: String(DEDUCTION_COMPONENTS.length), icon: 'minus', tone: 'danger' },
            { label: 'Pay bands', value: String(BANDS().length), icon: 'layers', tone: 'brand' },
            { label: 'Monthly payroll', value: inrC(db.staff.reduce((t, s) => t + s.salaryGross, 0)), icon: 'banknote', tone: 'info' },
          ]),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-7' },
              h('div', { className: 'stack' },
                SectionCard({
                  title: 'Earnings', subtitle: 'Applied in order; the special allowance balances to the target gross',
                  icon: 'plus', actions: Button('Add earning', { variant: 'ghost', size: 'sm', icon: 'plus', onClick: () => openComponentForm('Earning') }),
                }, h('div', { className: 'stack-2' }, EARNING_COMPONENTS.map(componentRow))),
                SectionCard({
                  title: 'Deductions', subtitle: 'Statutory components are locked to the applicable Act',
                  icon: 'minus', actions: Button('Add deduction', { variant: 'ghost', size: 'sm', icon: 'plus', onClick: () => openComponentForm('Deduction') }),
                }, h('div', { className: 'stack-2' }, DEDUCTION_COMPONENTS.map(componentRow))),
                Callout({ tone: 'info', icon: 'calculator', title: 'Formula reference' },
                  h('div', { className: 'stack-1' },
                    h('div', null, h('code', { className: 'hr-formula' }, 'BASIC * 0.40'), ' — a percentage of another component'),
                    h('div', null, h('code', { className: 'hr-formula' }, 'MIN(BASIC * 0.12, 1800)'), ' — statutory caps'),
                    h('div', null, h('code', { className: 'hr-formula' }, 'GROSS / 30 * LOP_DAYS'), ' — attendance-driven deductions'),
                    h('div', null, h('code', { className: 'hr-formula' }, 'IF(GROSS <= 21000, GROSS * 0.0075, 0)'), ' — conditional statutory logic'))))),
            h('div', { className: 'span-5' },
              h('div', { className: 'stack' },
                SectionCard({
                  title: 'Live preview', subtitle: 'Pick an employee to see the template applied',
                  actions: Button('Change', {
                    variant: 'ghost', size: 'sm', icon: 'refresh',
                    onClick: () => {
                      const pool = db.staff.filter((s) => s.status === 'Active');
                      previewFor = pool[Math.floor(Math.random() * pool.length)];
                      paintPreview();
                    },
                  }),
                }, previewHost),
                SectionCard({ title: 'Band-wise cost', className: 'chart-card' },
                  barChart({
                    categories: bandRows.map((b) => b.band),
                    series: [{ name: 'Monthly cost', values: bandRows.map((b) => b.monthlyCost) }],
                    valueFormat: 'currencyCompact', height: 240, title: 'Monthly cost by band',
                  }))))),
          SectionCard({ title: 'Pay bands', subtitle: 'Basic-pay range and headcount per grade', flush: true },
            DataTable({
              columns: [
                { key: 'band', label: 'Band', width: 100, sticky: true, render: (b) => Badge(b.band, { tone: 'neutral' }) },
                { key: 'designations', label: 'Designations', align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'headcount', label: 'Headcount', align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'minBasic', label: 'Min basic', align: 'right', numeric: true, render: (b) => inr(b.minBasic), value: (b) => b.minBasic },
                { key: 'maxBasic', label: 'Max basic', align: 'right', numeric: true, render: (b) => inr(b.maxBasic), value: (b) => b.maxBasic },
                { key: 'avgGross', label: 'Avg gross', align: 'right', numeric: true, render: (b) => inr(b.avgGross), value: (b) => b.avgGross, aggregate: 'avg', format: inrC },
                { key: 'monthlyCost', label: 'Monthly cost', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (b) => inr(b.monthlyCost), value: (b) => b.monthlyCost },
              ],
              rows: bandRows, paginate: false, searchable: false, footerAggregates: true, exportName: 'pay-bands',
              onRowClick: (b) => navigate('hr/designations', { band: b.band }),
            })),
        ],
      }));
    },
  },
};

function openComponentForm(type) {
  formPage({
    title: `Add ${type ? type.toLowerCase() : 'salary'} component`,
    subtitle: 'Components apply to every employee from the next payroll run.',
    mode: 'modal', size: 'md', submitLabel: 'Add component',
    values: { type: type || 'Earning' },
    sections: [{
      title: 'Component', cols: 1,
      fields: [
        { id: 'name', label: 'Component name', required: true, validate: validators.required },
        { id: 'type', label: 'Type', type: 'radio', inline: true, options: ['Earning', 'Deduction'] },
        { id: 'formula', label: 'Formula', required: true, placeholder: 'BASIC * 0.10', hint: 'Use BASIC, GROSS, DA, LOP_DAYS or a flat number.' },
        { id: 'taxable', label: 'Taxable', type: 'switch', switchLabel: 'Include in taxable income', value: true },
        { id: 'pfBase', label: 'PF base', type: 'switch', switchLabel: 'Counts towards the provident fund base' },
        { id: 'proRata', label: 'Pro-rata', type: 'switch', switchLabel: 'Reduce for loss-of-pay days', value: true },
      ],
    }],
    onSubmit: (v) => notify({ title: 'Component added', text: `${v.name} · ${v.type}`, tone: 'success' }),
  });
}

/* ------------------------------------------------------------- payslips */

function payslipNode(p) {
  const s = byId(db.staff, p.employeeId);
  const gross = p.gross;
  const totalDeductions = p.pf + p.tds + (p.lopAmount || 0) + (p.otherDeductions || 0) + (p.pt || 0) + (p.esi || 0);
  return h('div', { className: 'hr-slip' },
    h('div', { className: 'hr-slip-head' },
      h('div', { className: 'stack-1' },
        h('div', { className: 't-semibold t-lg' }, 'Springdale International School Group'),
        h('div', { className: 't-xs t-muted' }, `${s ? campusName(s.campusId) : ''} · CBSE affiliation 530XXXX`),
        h('div', { className: 't-eyebrow mt-2' }, `Payslip for ${p.month}`)),
      h('div', { className: 'stack-1', style: { textAlign: 'right' } },
        h('div', { className: 't-semibold' }, p.employeeName || (s ? s.name : '')),
        h('div', { className: 't-xs t-muted' }, s ? `${s.employeeCode} · ${s.designation}` : ''),
        h('div', { className: 't-xs t-muted' }, s ? `UAN ${s.uan} · PAN ${s.pan}` : ''),
        Badge(p.status || 'Paid'))),
    h('div', { className: 'hr-slip-grid' },
      h('section', null,
        h('div', { className: 't-eyebrow mb-2' }, 'Earnings'),
        h('div', { className: 'hr-slip-line' }, h('span', null, 'Basic pay'), h('b', null, inr(p.basic))),
        h('div', { className: 'hr-slip-line' }, h('span', null, 'House rent allowance'), h('b', null, inr(p.hra))),
        h('div', { className: 'hr-slip-line' }, h('span', null, 'Dearness allowance'), h('b', null, inr(p.da))),
        h('div', { className: 'hr-slip-line' }, h('span', null, 'Conveyance allowance'), h('b', null, inr(p.conveyance))),
        p.arrears ? h('div', { className: 'hr-slip-line' }, h('span', null, 'Arrears'), h('b', null, inr(p.arrears))) : null,
        h('div', { className: 'hr-slip-total' }, h('span', null, 'Gross earnings'), h('b', null, inr(gross)))),
      h('section', null,
        h('div', { className: 't-eyebrow mb-2' }, 'Deductions'),
        h('div', { className: 'hr-slip-line' }, h('span', null, 'Provident fund'), h('b', null, inr(p.pf))),
        h('div', { className: 'hr-slip-line' }, h('span', null, 'Income tax (TDS)'), h('b', null, inr(p.tds))),
        p.pt ? h('div', { className: 'hr-slip-line' }, h('span', null, 'Professional tax'), h('b', null, inr(p.pt))) : null,
        p.lopDays ? h('div', { className: 'hr-slip-line' }, h('span', null, `Loss of pay (${p.lopDays} day${p.lopDays > 1 ? 's' : ''})`), h('b', null, inr(p.lopAmount))) : null,
        p.otherDeductions ? h('div', { className: 'hr-slip-line' }, h('span', null, 'Other deductions'), h('b', null, inr(p.otherDeductions))) : null,
        h('div', { className: 'hr-slip-total' }, h('span', null, 'Total deductions'), h('b', null, inr(totalDeductions))))),
    h('div', { className: 'hr-slip-net' },
      h('div', { className: 'stack-1' },
        h('div', { className: 't-eyebrow' }, 'Net pay'),
        h('div', { className: 't-xs t-muted' }, `${p.mode || 'Bank Transfer'}${p.paidOn ? ` · credited ${formatDate(p.paidOn)}` : ''}${s ? ` · ${s.bankName} ${s.accountMasked}` : ''}`)),
      h('div', { className: 'hr-slip-net-v' }, inr(p.net))),
    h('div', { style: { padding: 'var(--sp-3) var(--sp-5)', borderTop: '1px solid var(--border)' } },
      h('div', { className: 't-2xs t-faint' }, 'This is a computer-generated payslip and does not require a signature. Queries: payroll@springdale.edu.in')));
}

function openPayslip(p) {
  const node = payslipNode(p);
  Modal({
    title: `Payslip — ${p.month}`,
    subtitle: p.employeeName || '',
    size: 'lg', icon: 'receipt', tone: 'brand',
    body: node,
    actions: (close) => frag(
      Button('Close', { variant: 'ghost', onClick: close }),
      Button('Email', { variant: 'secondary', icon: 'mail', onClick: () => notify({ title: 'Payslip emailed', tone: 'success' }) }),
      Button('Print', { variant: 'primary', icon: 'print', onClick: () => printNode(node, `Payslip ${p.month}`) })),
  });
}

const payslipRoutes = {
  'hr/payslips': {
    title: 'Payslips',
    subtitle: 'Every generated payslip with a printable layout',
    section: 'hr',
    render(mount, ctx) {
      injectStyles();
      const all = db.payslips;
      const month = qOf(ctx).month || 'all';
      const rows = month === 'all' ? all : all.filter((p) => p.month === month);
      const netTotal = rows.reduce((t, p) => t + p.net, 0);

      mount.appendChild(listPage({
        title: 'Payslips',
        subtitle: `${formatNumber(all.length)} payslips across ${db.payrollRuns.filter((r) => r.status === 'Disbursed').length} disbursed runs`,
        route: 'hr/payslips',
        actions: [
          Button('Payroll runs', { variant: 'secondary', icon: 'refresh', route: 'hr/payroll-runs' }),
          Button('Bulk email', { variant: 'primary', icon: 'mail', onClick: () => ConfirmDialog({ title: 'Email payslips to all employees?', text: `${formatNumber(rows.length)} payslips will be sent to the registered work email addresses.`, confirmLabel: 'Send', tone: 'brand', icon: 'mail' }).then((ok) => ok && notify({ title: 'Payslips queued', text: `${formatNumber(rows.length)} emails`, tone: 'success' })) }),
        ],
        kpis: [
          { label: 'Payslips', value: formatNumber(rows.length), icon: 'receipt', tone: 'brand' },
          { label: 'Net paid', value: inrC(netTotal), icon: 'wallet', tone: 'success' },
          { label: 'With loss of pay', value: formatNumber(rows.filter((p) => p.lopDays > 0).length), icon: 'alert-circle', tone: 'warning' },
          { label: 'Avg net pay', value: inrC(Math.round(netTotal / Math.max(1, rows.length))), icon: 'chart-line', tone: 'info' },
        ],
        filters: [
          { id: 'month', label: 'Month', options: Array.from(new Set(all.map((p) => p.month))), value: month },
          { id: 'department', label: 'Department', options: DEPT_NAMES() },
          { id: 'campus', label: 'Campus', options: campusFilterOptions() },
        ],
        onFilter: (id, value, allValues, table) => {
          let out = all;
          if (allValues.month && allValues.month !== 'all') out = out.filter((p) => p.month === allValues.month);
          if (allValues.department && allValues.department !== 'all') out = out.filter((p) => p.department === allValues.department);
          if (allValues.campus && allValues.campus !== 'all') out = out.filter((p) => p.campusId === allValues.campus);
          table.refresh(out);
        },
        chart: barChart({
          categories: Array.from(new Set(all.map((p) => p.month))),
          series: [{ name: 'Net paid', values: Array.from(new Set(all.map((p) => p.month))).map((m) => all.filter((p) => p.month === m).reduce((t, p) => t + p.net, 0)) }],
          valueFormat: 'currencyCompact', height: 260, title: 'Net pay disbursed by month',
        }),
        chartTitle: 'Net pay disbursed by month',
        columns: [
          { key: 'employeeName', label: 'Employee', width: 230, sticky: true, render: (p) => empCellById(p.employeeId, `${p.designation} · ${p.department}`), value: (p) => p.employeeName },
          { key: 'month', label: 'Month', width: 120, filter: true },
          { key: 'campusId', label: 'Campus', width: 150, filter: true, render: (p) => campusName(p.campusId), value: (p) => campusName(p.campusId) },
          { key: 'basic', label: 'Basic', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (p) => inr(p.basic), value: (p) => p.basic },
          { key: 'gross', label: 'Gross', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (p) => inr(p.gross), value: (p) => p.gross },
          { key: 'pf', label: 'EPF', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (p) => inr(p.pf), value: (p) => p.pf },
          { key: 'tds', label: 'TDS', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (p) => inr(p.tds), value: (p) => p.tds },
          { key: 'lopDays', label: 'LOP', width: 80, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'net', label: 'Net paid', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (p) => h('strong', { className: 't-success' }, inr(p.net)), value: (p) => p.net },
          { key: 'paidOn', label: 'Paid on', width: 130, render: (p) => formatDate(p.paidOn), value: (p) => p.paidOn },
          { key: 'mode', label: 'Mode', width: 140, filter: true },
          { key: 'status', label: 'Status', width: 110, filter: true, render: (p) => Badge(p.status) },
        ],
        rows,
        footerAggregates: true,
        selectable: true,
        pageSize: 25,
        searchKeys: ['employeeName', 'month', 'department'],
        bulkActions: [
          { label: 'Email selected', icon: 'mail', onClick: (sel) => notify({ title: `${sel.length} payslips emailed`, tone: 'success' }) },
          { label: 'Download PDFs', icon: 'download', onClick: (sel) => notify({ title: `${sel.length} payslips queued for download`, tone: 'info' }) },
        ],
        rowActions: (p) => [
          { label: 'View payslip', icon: 'receipt', onClick: () => openPayslip(p) },
          { label: 'Open employee', icon: 'id-card', route: `hr/employee-profile/${p.employeeId}` },
          { label: 'Email payslip', icon: 'mail', onClick: () => notify({ title: `Payslip emailed to ${p.employeeName}`, tone: 'success' }) },
        ],
        onRowClick: (p) => openPayslip(p),
        exportName: 'payslips',
        emptyState: emptyFor('No payslips', 'Disburse a payroll run to generate payslips.',
          Button('Open payroll runs', { variant: 'primary', icon: 'refresh', route: 'hr/payroll-runs' })),
      }));
    },
  },
};

/* ---------------------------------------------------------------- loans */

function openLoanDetail(loan) {
  const schedule = emiSchedule(loan);
  Drawer({
    title: `${loan.type} — ${loan.employeeName}`,
    subtitle: `${inr(loan.principal)} over ${loan.tenure} months at ${loan.rate}%`,
    size: 'xl',
    body: h('div', { className: 'stack' },
      kpiRow([
        { label: 'Principal', value: inr(loan.principal), icon: 'piggy-bank', tone: 'brand' },
        { label: 'Monthly EMI', value: inr(loan.emi), icon: 'calendar', tone: 'info' },
        { label: 'Recovered', value: inr(loan.recovered), icon: 'check-circle', tone: 'success' },
        { label: 'Outstanding', value: inr(loan.outstanding), icon: 'alert-circle', tone: 'warning' },
      ]),
      ProgressBar(loan.installmentsPaid, {
        max: loan.tenure, label: `${loan.installmentsPaid} of ${loan.tenure} instalments recovered`, showValue: true,
        tone: loan.installmentsPaid === loan.tenure ? 'success' : 'info',
      }),
      DescriptionList([
        ['Employee', loan.employeeName],
        ['Employee code', loan.employeeCode],
        ['Department', loan.department],
        ['Sanctioned on', formatDate(loan.sanctionedOn)],
        ['First EMI', loan.firstEmiMonth],
        ['Interest rate', loan.rate ? `${loan.rate}% per annum` : 'Interest free'],
        ['Guarantor', loan.guarantor],
        ['Purpose', loan.purpose],
        ['Approved by', loan.approvedBy],
        ['Status', Badge(loan.status)],
      ], { cols: 2 }),
      SectionCard({ title: 'Amortisation schedule', subtitle: 'Recovered automatically through payroll', flush: true },
        DataTable({
          columns: [
            { key: 'no', label: '#', width: 60, align: 'right', numeric: true },
            { key: 'month', label: 'Month', width: 130 },
            { key: 'emi', label: 'EMI', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.emi), value: (r) => r.emi },
            { key: 'principal', label: 'Principal', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.principal), value: (r) => r.principal },
            { key: 'interest', label: 'Interest', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.interest), value: (r) => r.interest },
            { key: 'balance', label: 'Balance', align: 'right', numeric: true, render: (r) => inr(r.balance), value: (r) => r.balance },
            { key: 'status', label: 'Status', width: 110, render: (r) => Badge(r.status) },
          ],
          rows: schedule, pageSize: 12, searchable: false, footerAggregates: true,
          exportName: `${loan.id}-emi-schedule`,
        }))),
    actions: (close) => frag(
      Button('Open employee', { variant: 'ghost', icon: 'id-card', onClick: () => { close(); navigate(`hr/employee-profile/${loan.employeeId}`, { tab: 'payroll' }); } }),
      Button('Foreclose loan', {
        variant: 'danger', icon: 'x-circle',
        onClick: () => ConfirmDialog({ title: 'Foreclose this loan?', text: `${inr(loan.outstanding)} will be recovered in the next payroll run in a single deduction.`, confirmLabel: 'Foreclose', tone: 'danger' }).then((ok) => { if (ok) { close(); notify({ title: 'Loan foreclosed', tone: 'warning' }); } }),
      })),
  });
}

function openLoanForm(s) {
  formPage({
    title: s ? `Salary advance — ${s.name}` : 'New loan or advance',
    subtitle: 'EMIs are recovered automatically from the monthly payroll run.',
    mode: 'modal', size: 'lg', submitLabel: 'Submit for approval',
    values: s ? { employee: s.id } : {},
    sections: [{
      title: 'Request', cols: 2,
      fields: [
        { id: 'employee', label: 'Employee', type: 'combobox', required: true, options: db.staff.slice(0, 150).map((x) => ({ value: x.id, label: `${x.name} — ${x.employeeCode}` })) },
        { id: 'type', label: 'Type', type: 'select', required: true, options: LOAN_TYPES },
        { id: 'principal', label: 'Amount', type: 'number', required: true, validate: [validators.required, validators.min(1000)], prefix: '₹' },
        { id: 'tenure', label: 'Tenure (months)', type: 'number', required: true, validate: [validators.required, validators.min(1)] },
        { id: 'rate', label: 'Interest rate (% p.a.)', type: 'number', hint: 'Salary and festival advances are interest free.' },
        { id: 'firstEmi', label: 'First EMI month', type: 'select', options: MONTHS },
        { id: 'guarantor', label: 'Guarantor', type: 'combobox', options: db.staff.slice(0, 100).map((x) => ({ value: x.id, label: x.name })) },
        { id: 'purpose', label: 'Purpose', type: 'textarea', span: 'full', required: true, validate: validators.required },
      ],
    }],
    onSubmit: (v) => notify({ title: 'Loan request submitted', text: `${v.type || 'Advance'} · routed to Accounts for sanction`, tone: 'success' }),
  });
}

const loanRoutes = {
  'hr/loans': {
    title: 'Loans & Advances',
    subtitle: 'Sanctioned loans, EMI recovery and outstanding exposure',
    section: 'hr',
    render(mount) {
      injectStyles();
      const rows = loans();
      const active = rows.filter((l) => l.status === 'Active');
      const outstanding = rows.reduce((t, l) => t + l.outstanding, 0);
      const monthlyRecovery = active.reduce((t, l) => t + l.emi, 0);

      mount.appendChild(listPage({
        title: 'Loans & Advances',
        subtitle: `${rows.length} sanctioned · ${active.length} recovering · ${inrC(outstanding)} outstanding`,
        route: 'hr/loans',
        actions: [
          Button('Payroll runs', { variant: 'secondary', icon: 'refresh', route: 'hr/payroll-runs' }),
          Button('New advance', { variant: 'primary', icon: 'piggy-bank', onClick: () => openLoanForm() }),
        ],
        kpis: [
          { label: 'Sanctioned', value: formatNumber(rows.length), icon: 'piggy-bank', tone: 'brand' },
          { label: 'Principal disbursed', value: inrC(rows.reduce((t, l) => t + l.principal, 0)), icon: 'banknote', tone: 'info' },
          { label: 'Outstanding', value: inrC(outstanding), icon: 'alert-circle', tone: 'warning' },
          { label: 'Monthly recovery', value: inrC(monthlyRecovery), icon: 'refresh', tone: 'success' },
          { label: 'Closed', value: String(rows.filter((l) => l.status === 'Closed').length), icon: 'check-circle', tone: 'neutral' },
        ],
        chart: barChart({
          categories: LOAN_TYPES,
          series: [
            { name: 'Disbursed', values: LOAN_TYPES.map((t) => rows.filter((l) => l.type === t).reduce((x, l) => x + l.principal, 0)) },
            { name: 'Outstanding', values: LOAN_TYPES.map((t) => rows.filter((l) => l.type === t).reduce((x, l) => x + l.outstanding, 0)) },
          ],
          horizontal: true, valueFormat: 'currencyCompact', height: 300,
          title: 'Disbursed versus outstanding by loan type',
        }),
        chartTitle: 'Disbursed versus outstanding by loan type',
        columns: [
          { key: 'employeeName', label: 'Employee', width: 230, sticky: true, render: (l) => empCellById(l.employeeId, `${l.employeeCode} · ${l.department}`), value: (l) => l.employeeName },
          { key: 'type', label: 'Type', width: 160, filter: true },
          { key: 'campusId', label: 'Campus', width: 150, filter: true, render: (l) => campusName(l.campusId), value: (l) => campusName(l.campusId) },
          { key: 'principal', label: 'Principal', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (l) => inr(l.principal), value: (l) => l.principal },
          { key: 'rate', label: 'Rate', width: 90, align: 'right', numeric: true, render: (l) => (l.rate ? `${l.rate}%` : 'Nil'), value: (l) => l.rate },
          { key: 'tenure', label: 'Tenure', width: 90, align: 'right', numeric: true, render: (l) => `${l.tenure} m`, value: (l) => l.tenure },
          { key: 'emi', label: 'EMI', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (l) => inr(l.emi), value: (l) => l.emi },
          {
            key: 'installmentsPaid', label: 'Recovery', width: 180, align: 'right', numeric: true,
            render: (l) => ProgressBar(l.installmentsPaid, { max: l.tenure, size: 'sm', showValue: false, label: `${l.installmentsPaid}/${l.tenure}`, tone: l.installmentsPaid === l.tenure ? 'success' : 'info' }),
            value: (l) => l.installmentsPaid,
          },
          { key: 'outstanding', label: 'Outstanding', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (l) => inr(l.outstanding), value: (l) => l.outstanding },
          { key: 'sanctionedOn', label: 'Sanctioned', width: 130, render: (l) => formatDate(l.sanctionedOn), value: (l) => l.sanctionedOn },
          { key: 'status', label: 'Status', width: 110, filter: true, render: (l) => Badge(l.status) },
        ],
        rows,
        footerAggregates: true,
        selectable: true,
        pageSize: 25,
        searchKeys: ['employeeName', 'employeeCode', 'type', 'department'],
        bulkActions: [
          { label: 'Hold recovery', icon: 'lock', onClick: (sel) => notify({ title: `Recovery paused for ${sel.length} loans`, tone: 'warning' }) },
          { label: 'Export ledger', icon: 'download', onClick: (sel) => { download('loan-ledger.csv', toCsv(sel, [{ key: 'employeeName', label: 'Employee' }, { key: 'type', label: 'Type' }, { key: 'principal', label: 'Principal' }, { key: 'outstanding', label: 'Outstanding' }]), 'text/csv;charset=utf-8'); notify({ title: 'Ledger exported', tone: 'success' }); } },
        ],
        rowActions: (l) => [
          { label: 'EMI schedule', icon: 'calendar', onClick: () => openLoanDetail(l) },
          { label: 'Open employee', icon: 'id-card', route: `hr/employee-profile/${l.employeeId}` },
          { separator: true },
          { label: 'Foreclose', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: 'Foreclose this loan?', text: `${inr(l.outstanding)} will be recovered in a single deduction.`, confirmLabel: 'Foreclose', tone: 'danger' }).then((ok) => ok && notify({ title: 'Loan foreclosed', tone: 'warning' })) },
        ],
        onRowClick: (l) => openLoanDetail(l),
        exportName: 'loans-and-advances',
        notes: Callout({ tone: 'info', icon: 'calculator', title: 'Recovery policy' },
          'Total EMI recovery may not exceed 40% of an employee’s net pay. Salary and festival advances are interest free and recovered within the same financial year.'),
        emptyState: emptyFor('No loans sanctioned', 'Raise a salary advance to get started.',
          Button('New advance', { variant: 'primary', icon: 'piggy-bank', onClick: () => openLoanForm() })),
      }));
    },
  },
};

/* ==========================================================================
   10 · Appraisal · training · promotions
   ========================================================================== */

const RATING_ORDER = ['Outstanding', 'Exceeds Expectations', 'Meets Expectations', 'Needs Improvement', 'Not Rated'];

const talentRoutes = {
  'hr/appraisal': {
    title: 'Appraisal',
    subtitle: 'Cycle progress, rating distribution and hike recommendations',
    section: 'hr',
    render(mount, ctx) {
      injectStyles();
      const cycle = APPRAISAL_CYCLES[0];
      const rows = db.staff.filter((s) => s.status !== 'Resigned').map((s) => {
        const a = appraisalFor(s);
        const sal = salaryFor(s);
        return {
          id: s.id, employeeId: s.id, name: s.name, employeeCode: s.employeeCode,
          designation: s.designation, department: s.department, campusId: s.campusId, type: s.type, band: s.band,
          selfScore: a.selfScore, finalScore: a.finalScore, rating: s.appraisalRating,
          reviewer: a.reviewer, hike: a.hikeRecommended,
          currentGross: sal.gross,
          proposedGross: Math.round(sal.gross * (1 + a.hikeRecommended / 100)),
          increment: Math.round(sal.gross * (a.hikeRecommended / 100)),
          goals: a.goals, goalsMet: a.goalsMet,
          status: s.appraisalRating === 'Not Rated' ? 'Pending' : a.finalScore >= 4.5 ? 'Completed' : 'Under Review',
        };
      });
      const dist = RATING_ORDER.map((r) => ({ key: r, value: rows.filter((x) => x.rating === r).length })).filter((x) => x.value);
      const incrementCost = rows.reduce((t, r) => t + r.increment, 0);
      const deptScore = DEPT_NAMES().map((d) => {
        const dr = rows.filter((r) => r.department === d);
        return { key: d, value: dr.length ? round2(dr.reduce((t, r) => t + r.finalScore, 0) / dr.length) : 0 };
      }).filter((x) => x.value);

      mount.appendChild(listPage({
        title: 'Appraisal',
        subtitle: `${cycle.name} · ${formatNumber(rows.length)} employees in scope · window ${formatDate(cycle.from)} to ${formatDate(cycle.to)}`,
        route: 'hr/appraisal',
        actions: [
          MenuButton(APPRAISAL_CYCLES.map((c) => ({ label: c.name, icon: 'calendar', onClick: () => notify({ title: `Switched to ${c.name}`, text: `${c.status} · weightage ${c.weightage}%`, tone: 'info' }) })), { label: 'Cycle', icon: 'calendar' }),
          Button('Promotions', { variant: 'secondary', icon: 'trending-up', route: 'hr/promotions' }),
          Button('Start review', { variant: 'primary', icon: 'star', onClick: () => openAppraisalForm() }),
        ],
        kpis: [
          { label: 'In scope', value: formatNumber(rows.length), icon: 'users', tone: 'brand' },
          { label: 'Reviews completed', value: formatNumber(rows.filter((r) => r.status === 'Completed').length), icon: 'check-circle', tone: 'success' },
          { label: 'Avg final score', value: `${round2(rows.reduce((t, r) => t + r.finalScore, 0) / rows.length)} / 5`, icon: 'star', tone: 'info' },
          { label: 'Outstanding ratings', value: formatNumber(rows.filter((r) => r.rating === 'Outstanding').length), icon: 'award', tone: 'success' },
          { label: 'Increment cost / month', value: inrC(incrementCost), icon: 'banknote', tone: 'warning' },
        ],
        chart: barChart({
          categories: deptScore.map((d) => d.key),
          series: [{ name: 'Average score', values: deptScore.map((d) => d.value) }],
          horizontal: true, height: 340, maxY: 5, valueFormat: 'decimal', target: 3.5, targetLabel: 'Expected',
          title: 'Average appraisal score by department',
        }),
        chartTitle: 'Average appraisal score by department',
        chartActions: Button('Rating distribution', {
          variant: 'link', size: 'sm', icon: 'chart-pie',
          onClick: () => Modal({
            title: 'Rating distribution', subtitle: cycle.name, size: 'lg', icon: 'chart-pie',
            body: h('div', { className: 'stack' },
              donutChart({ data: dist, height: 300, centerValue: formatNumber(rows.length), centerLabel: 'Employees', title: 'Rating distribution' }),
              Callout({ tone: 'info', icon: 'scale', title: 'Bell-curve guidance' },
                'The normalisation committee targets 10–15% Outstanding, 25–30% Exceeds, 45–55% Meets and up to 10% Needs Improvement.')),
          }),
        }),
        filters: [
          { id: 'campus', label: 'Campus', options: campusFilterOptions(), value: currentCampus(ctx), allLabel: 'All campuses' },
          { id: 'department', label: 'Department', options: DEPT_NAMES() },
          { id: 'rating', label: 'Rating', options: RATING_ORDER },
          { id: 'type', label: 'Cadre', options: ['Teaching', 'Non-Teaching'] },
        ],
        onFilter: (id, value, allValues, table) => {
          let out = rows;
          if (allValues.campus && allValues.campus !== 'all') out = out.filter((r) => r.campusId === allValues.campus);
          if (allValues.department && allValues.department !== 'all') out = out.filter((r) => r.department === allValues.department);
          if (allValues.rating && allValues.rating !== 'all') out = out.filter((r) => r.rating === allValues.rating);
          if (allValues.type && allValues.type !== 'all') out = out.filter((r) => r.type === allValues.type);
          table.refresh(out);
        },
        columns: [
          { key: 'name', label: 'Employee', width: 230, sticky: true, render: (r) => empCellById(r.employeeId, `${r.employeeCode} · ${r.designation}`), value: (r) => r.name },
          { key: 'department', label: 'Department', width: 150, filter: true },
          { key: 'band', label: 'Band', width: 80, align: 'center', filter: true },
          { key: 'selfScore', label: 'Self', width: 90, align: 'right', numeric: true, aggregate: 'avg', format: (v) => round2(v).toFixed(2) },
          { key: 'finalScore', label: 'Final', width: 100, align: 'right', numeric: true, aggregate: 'avg', format: (v) => round2(v).toFixed(2), render: (r) => Badge(String(r.finalScore), { tone: r.finalScore >= 4.2 ? 'success' : r.finalScore >= 3.2 ? 'warning' : 'danger' }) },
          { key: 'rating', label: 'Rating', width: 190, filter: true, render: (r) => Badge(r.rating, { tone: r.rating === 'Outstanding' ? 'success' : r.rating === 'Exceeds Expectations' ? 'info' : r.rating === 'Needs Improvement' ? 'danger' : 'neutral' }) },
          { key: 'goalsMet', label: 'Goals met', width: 110, align: 'right', numeric: true, render: (r) => `${r.goalsMet} / ${r.goals}`, value: (r) => r.goalsMet },
          { key: 'reviewer', label: 'Reviewer', width: 180, filter: true },
          { key: 'hike', label: 'Hike', width: 90, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round2(v)}%`, render: (r) => `${r.hike}%` },
          { key: 'currentGross', label: 'Current gross', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.currentGross), value: (r) => r.currentGross },
          { key: 'increment', label: 'Increment', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => h('span', { className: 't-success' }, inr(r.increment)), value: (r) => r.increment },
          { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        footerAggregates: true,
        selectable: true,
        pageSize: 25,
        searchKeys: ['name', 'employeeCode', 'department', 'designation'],
        bulkActions: [
          { label: 'Approve increments', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} increments approved`, text: `Effective from the next payroll run · ${inrC(sel.reduce((t, r) => t + r.increment, 0))} monthly impact`, tone: 'success' }) },
          { label: 'Send reminder to reviewers', icon: 'send', onClick: (sel) => notify({ title: `Reminder sent for ${sel.length} reviews`, tone: 'info' }) },
        ],
        rowActions: (r) => [
          { label: 'Open scorecard', icon: 'star', route: `hr/employee-profile/${r.employeeId}` },
          { label: 'Recommend promotion', icon: 'trending-up', route: 'hr/promotions' },
          { label: 'Nominate for training', icon: 'lightbulb', route: 'hr/training' },
        ],
        onRowClick: (r) => navigate(`hr/employee-profile/${r.employeeId}`, { tab: 'appraisal' }),
        exportName: 'appraisal',
        notes: Callout({ tone: 'info', icon: 'workflow', title: 'Cycle stages' },
          'Self assessment (July) → reviewer assessment (August) → normalisation committee (September) → increment letters with the October payroll.'),
        emptyState: emptyFor('No appraisals in this cycle', 'Open the cycle to let employees start their self assessment.'),
      }));
    },
  },

  'hr/training': {
    title: 'Training & Development',
    subtitle: 'Programmes, enrolment, completion and feedback',
    section: 'hr',
    render(mount) {
      injectStyles();
      const rows = db.trainings;
      const completed = rows.filter((t) => t.status === 'Completed');
      const totalCost = rows.reduce((t, x) => t + x.cost, 0);
      const totalSeats = rows.reduce((t, x) => t + x.seats, 0);
      const enrolled = rows.reduce((t, x) => t + x.enrolled, 0);

      mount.appendChild(listPage({
        title: 'Training & Development',
        subtitle: `${rows.length} programmes in FY 2026-27 · ${formatNumber(enrolled)} enrolments · ${inrC(totalCost)} budget committed`,
        route: 'hr/training',
        actions: [
          Button('Appraisal', { variant: 'secondary', icon: 'star', route: 'hr/appraisal' }),
          Button('Schedule programme', { variant: 'primary', icon: 'plus', onClick: () => openTrainingForm() }),
        ],
        kpis: [
          { label: 'Programmes', value: String(rows.length), icon: 'lightbulb', tone: 'brand' },
          { label: 'Enrolments', value: formatNumber(enrolled), icon: 'users', tone: 'info' },
          { label: 'Completion rate', value: `${Math.round((rows.reduce((t, x) => t + x.completed, 0) / Math.max(1, enrolled)) * 100)}%`, icon: 'check-circle', tone: 'success' },
          { label: 'Avg feedback', value: `${round2(rows.reduce((t, x) => t + x.feedbackScore, 0) / rows.length)} / 5`, icon: 'thumbs-up', tone: 'warning' },
          { label: 'Budget committed', value: inrC(totalCost), icon: 'banknote', tone: 'neutral' },
        ],
        chart: comboChart({
          categories: rows.map((t) => t.name.split(' — ')[0].slice(0, 22)),
          bars: [
            { name: 'Enrolled', values: rows.map((t) => t.enrolled) },
            { name: 'Completed', values: rows.map((t) => t.completed) },
          ],
          line: { name: 'Seats', values: rows.map((t) => t.seats) },
          height: 320, title: 'Enrolment against capacity',
        }),
        chartTitle: 'Enrolment against capacity',
        columns: [
          { key: 'name', label: 'Programme', width: 300, sticky: true, render: (t) => h('div', { className: 'stack-1' }, h('strong', null, t.name), h('span', { className: 't-xs t-muted' }, `${t.trainer} · ${t.durationHours} hours`)), value: (t) => t.name },
          { key: 'type', label: 'Type', width: 130, filter: true },
          { key: 'campusId', label: 'Campus', width: 150, filter: true, render: (t) => campusName(t.campusId), value: (t) => campusName(t.campusId) },
          { key: 'date', label: 'Date', width: 130, render: (t) => formatDate(t.date), value: (t) => t.date },
          { key: 'seats', label: 'Seats', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'enrolled', label: 'Enrolled', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'completed', label: 'Completed', align: 'right', numeric: true, aggregate: 'sum' },
          {
            key: 'fill', label: 'Fill rate', width: 170, align: 'right', numeric: true,
            render: (t) => ProgressBar(Math.min(100, Math.round((t.enrolled / Math.max(1, t.seats)) * 100)), { size: 'sm', showValue: true, tone: t.enrolled >= t.seats ? 'danger' : t.enrolled / t.seats > 0.7 ? 'success' : 'warning' }),
            value: (t) => Math.round((t.enrolled / Math.max(1, t.seats)) * 100),
          },
          { key: 'mandatory', label: 'Mandatory', width: 120, align: 'center', render: (t) => Badge(t.mandatory ? 'Mandatory' : 'Optional', { tone: t.mandatory ? 'warning' : 'neutral' }) },
          { key: 'feedbackScore', label: 'Feedback', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => round2(v).toFixed(1), render: (t) => Rating(t.feedbackScore, { showValue: true }) },
          { key: 'cost', label: 'Cost', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (t) => (t.cost ? inr(t.cost) : 'In-house'), value: (t) => t.cost },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (t) => Badge(t.status) },
        ],
        rows,
        footerAggregates: true,
        paginate: false,
        searchKeys: ['name', 'trainer', 'type'],
        expandable: (t) => {
          const nominees = db.staff.filter((s) => (seedOf(s.id + t.id) % 3) === 0).slice(0, 8);
          return h('div', { className: 'grid grid-2' },
            SectionCard({ title: 'Nominated employees', subtitle: `${t.enrolled} enrolled of ${t.seats} seats` },
              nominees.length
                ? h('div', { className: 'stack-2' }, nominees.map((s) => h('div', { className: 'row-3' },
                  h('div', { className: 'flex-1' }, empCell(s)),
                  Badge(t.status === 'Completed' ? 'Completed' : 'Enrolled'))))
                : emptyFor('No nominations yet', 'Nominate employees from the directory or the appraisal screen.')),
            SectionCard({ title: 'Programme detail' },
              DescriptionList([
                ['Trainer', t.trainer],
                ['Type', t.type],
                ['Duration', `${t.durationHours} hours`],
                ['Date', formatDate(t.date)],
                ['Campus', campusName(t.campusId)],
                ['Cost', t.cost ? inr(t.cost) : 'In-house, no external cost'],
                ['Feedback', `${t.feedbackScore} / 5`],
                ['Mandatory', t.mandatory ? 'Yes — CBSE/statutory' : 'No'],
              ], { cols: 2 })));
        },
        rowActions: (t) => [
          { label: 'Nominate employees', icon: 'user-plus', onClick: () => notify({ title: `Nomination list opened for ${t.name}`, tone: 'info' }) },
          { label: 'Mark attendance', icon: 'clipboard-check', onClick: mockAction('Mark training attendance') },
          { label: 'Issue certificates', icon: 'certificate', disabled: t.status !== 'Completed', onClick: () => notify({ title: `${t.completed} certificates issued`, tone: 'success' }) },
          { separator: true },
          { label: 'Cancel programme', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: `Cancel ${t.name}?`, text: `${t.enrolled} enrolled employees will be notified.`, confirmLabel: 'Cancel programme', tone: 'danger' }).then((ok) => ok && notify({ title: 'Programme cancelled', tone: 'warning' })) },
        ],
        exportName: 'training-programmes',
        notes: Callout({ tone: 'info', icon: 'certificate', title: 'CBSE requirement' },
          `Every teacher must complete 50 hours of in-service training each year. ${completed.length} programmes have concluded so far, covering ${formatNumber(rows.reduce((t, x) => t + x.completed, 0))} completions.`),
        emptyState: emptyFor('No programmes scheduled', 'Schedule the first capacity-building programme of the year.',
          Button('Schedule programme', { variant: 'primary', icon: 'plus', onClick: () => openTrainingForm() })),
      }));
    },
  },

  'hr/promotions': {
    title: 'Promotions & Transfers',
    subtitle: 'Grade movements, campus transfers and salary revisions',
    section: 'hr',
    render(mount) {
      injectStyles();
      const rows = promotions();
      const proms = rows.filter((r) => r.type === 'Promotion');
      const transfers = rows.filter((r) => r.type !== 'Promotion');
      const avgHike = proms.length ? round2(proms.reduce((t, r) => t + r.hikePct, 0) / proms.length) : 0;
      const monthlyImpact = rows.reduce((t, r) => t + (r.salaryTo - r.salaryFrom), 0);

      mount.appendChild(listPage({
        title: 'Promotions & Transfers',
        subtitle: `${rows.length} movements in FY 2026-27 · ${proms.length} promotions · ${transfers.length} transfers`,
        route: 'hr/promotions',
        actions: [
          Button('Appraisal', { variant: 'secondary', icon: 'star', route: 'hr/appraisal' }),
          Button('Record movement', { variant: 'primary', icon: 'trending-up', onClick: () => openPromotionForm() }),
        ],
        kpis: [
          { label: 'Total movements', value: String(rows.length), icon: 'trending-up', tone: 'brand' },
          { label: 'Promotions', value: String(proms.length), icon: 'award', tone: 'success' },
          { label: 'Transfers', value: String(transfers.length), icon: 'git-branch', tone: 'info' },
          { label: 'Average hike', value: `${avgHike}%`, icon: 'percent', tone: 'warning' },
          { label: 'Monthly cost impact', value: inrC(monthlyImpact), icon: 'banknote', tone: 'danger' },
        ],
        chart: barChart({
          categories: ['Apr', 'May', 'Jun', 'Jul', 'Aug'],
          series: [
            { name: 'Promotions', values: ['04', '05', '06', '07', '08'].map((m) => proms.filter((r) => r.effectiveDate.slice(5, 7) === m).length) },
            { name: 'Transfers', values: ['04', '05', '06', '07', '08'].map((m) => transfers.filter((r) => r.effectiveDate.slice(5, 7) === m).length) },
          ],
          stacked: true, height: 280, title: 'Movements by month',
        }),
        chartTitle: 'Movements by month',
        columns: [
          { key: 'employeeName', label: 'Employee', width: 230, sticky: true, render: (r) => empCellById(r.employeeId, r.employeeCode), value: (r) => r.employeeName },
          { key: 'type', label: 'Type', width: 160, filter: true, render: (r) => Badge(r.type, { tone: r.type === 'Promotion' ? 'success' : 'info' }) },
          { key: 'fromDesignation', label: 'From', width: 180 },
          { key: 'toDesignation', label: 'To', width: 180, render: (r) => h('strong', null, r.toDesignation) },
          { key: 'fromBand', label: 'Band', width: 110, align: 'center', render: (r) => h('span', { className: 't-sm' }, `${r.fromBand} → ${r.toBand}`), value: (r) => r.toBand },
          { key: 'fromCampus', label: 'Campus move', width: 190, render: (r) => (r.fromCampus === r.toCampus ? '—' : `${campusName(r.fromCampus)} → ${campusName(r.toCampus)}`), value: (r) => r.fromCampus },
          { key: 'salaryFrom', label: 'Old gross', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.salaryFrom), value: (r) => r.salaryFrom },
          { key: 'salaryTo', label: 'New gross', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.salaryTo), value: (r) => r.salaryTo },
          { key: 'hikePct', label: 'Hike', width: 90, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round2(v)}%`, render: (r) => h('span', { className: 't-success' }, `+${r.hikePct}%`) },
          { key: 'effectiveDate', label: 'Effective', width: 130, render: (r) => formatDate(r.effectiveDate), value: (r) => r.effectiveDate },
          { key: 'recommendedBy', label: 'Recommended by', width: 170, filter: true },
          { key: 'approvalStatus', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.approvalStatus) },
        ],
        rows,
        footerAggregates: true,
        selectable: true,
        pageSize: 25,
        searchKeys: ['employeeName', 'toDesignation', 'recommendedBy'],
        bulkActions: [
          { label: 'Approve movements', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} movements approved`, tone: 'success' }) },
          { label: 'Generate letters', icon: 'file-text', onClick: (sel) => notify({ title: `${sel.length} letters generated`, tone: 'success' }) },
        ],
        expandable: (r) => h('div', { className: 'stack-3' },
          Callout({ tone: 'info', icon: 'note', title: 'Recommendation note' }, r.remarks),
          DescriptionList([
            ['From department', r.fromDepartment],
            ['To department', r.toDepartment],
            ['From campus', campusName(r.fromCampus)],
            ['To campus', campusName(r.toCampus)],
            ['Salary movement', `${inr(r.salaryFrom)} → ${inr(r.salaryTo)} (+${r.hikePct}%)`],
            ['Effective', formatDate(r.effectiveDate)],
          ], { cols: 2 })),
        rowActions: (r) => [
          { label: 'Open employee', icon: 'id-card', route: `hr/employee-profile/${r.employeeId}` },
          { label: 'Download letter', icon: 'download', onClick: mockAction('Download movement letter') },
          { label: 'Edit movement', icon: 'edit', onClick: () => openPromotionForm(r) },
        ],
        onRowClick: (r) => navigate(`hr/employee-profile/${r.employeeId}`, { tab: 'job' }),
        exportName: 'promotions-transfers',
        emptyState: emptyFor('No movements recorded', 'Promotions and transfers appear here once approved by the committee.'),
      }));
    },
  },
};

function openAppraisalForm() {
  formPage({
    title: 'Start an appraisal review',
    subtitle: 'Opens the self-assessment window for the selected group.',
    mode: 'modal', size: 'lg', submitLabel: 'Open cycle',
    sections: [{
      title: 'Cycle scope', cols: 2,
      fields: [
        { id: 'cycle', label: 'Appraisal cycle', type: 'select', required: true, options: APPRAISAL_CYCLES.map((c) => ({ value: c.id, label: c.name })) },
        { id: 'scope', label: 'Scope', type: 'select', options: ['All employees', 'Teaching only', 'Non-teaching only', 'Single department'] },
        { id: 'department', label: 'Department', type: 'select', options: DEPT_NAMES() },
        { id: 'reviewer', label: 'Default reviewer', type: 'select', options: ['Principal', 'Vice Principal', 'Head of Department', 'Academic Coordinator'] },
        { id: 'selfDue', label: 'Self assessment due', type: 'date' },
        { id: 'reviewDue', label: 'Reviewer assessment due', type: 'date' },
        { id: 'kras', label: 'Key result areas', type: 'multiselect', span: 'full', options: APPRAISAL_KRAS, value: APPRAISAL_KRAS },
        { id: 'note', label: 'Note to employees', type: 'textarea', span: 'full' },
      ],
    }],
    onSubmit: () => notify({ title: 'Appraisal cycle opened', text: 'Employees have been notified to submit their self assessment.', tone: 'success' }),
  });
}

function openTrainingForm() {
  formPage({
    title: 'Schedule training programme',
    mode: 'modal', size: 'lg', submitLabel: 'Schedule programme',
    sections: [{
      title: 'Programme', cols: 2,
      fields: [
        { id: 'name', label: 'Programme name', required: true, validate: validators.required, span: 'full' },
        { id: 'type', label: 'Type', type: 'select', required: true, options: ['Internal', 'External', 'Online', 'Certification'] },
        { id: 'trainer', label: 'Trainer / resource person', required: true, validate: validators.required },
        { id: 'date', label: 'Date', type: 'date', required: true },
        { id: 'duration', label: 'Duration (hours)', type: 'number', required: true, validate: validators.number },
        { id: 'seats', label: 'Seats', type: 'number', validate: validators.number },
        { id: 'campus', label: 'Campus', type: 'select', options: campusFilterOptions() },
        { id: 'cost', label: 'Budget', type: 'number', hint: 'Leave blank for in-house programmes.' },
        { id: 'mandatory', label: 'Mandatory', type: 'switch', switchLabel: 'Attendance is compulsory' },
        { id: 'objectives', label: 'Learning objectives', type: 'textarea', span: 'full' },
      ],
    }],
    onSubmit: (v) => notify({ title: 'Programme scheduled', text: `${v.name} · nominations open`, tone: 'success' }),
  });
}

function openPromotionForm(r) {
  formPage({
    title: r ? `Edit movement — ${r.employeeName}` : 'Record promotion or transfer',
    mode: 'modal', size: 'lg', submitLabel: 'Submit for approval',
    values: r ? { type: r.type, toDesignation: r.toDesignation, effective: r.effectiveDate } : { type: 'Promotion' },
    sections: [{
      title: 'Movement', cols: 2,
      fields: [
        { id: 'employee', label: 'Employee', type: 'combobox', required: true, options: db.staff.slice(0, 150).map((s) => ({ value: s.id, label: `${s.name} — ${s.designation}` })) },
        { id: 'type', label: 'Type', type: 'select', required: true, options: ['Promotion', 'Campus Transfer', 'Department Transfer'] },
        { id: 'toDesignation', label: 'New designation', type: 'combobox', options: DESIG_NAMES() },
        { id: 'toBand', label: 'New band', type: 'select', options: BANDS() },
        { id: 'toCampus', label: 'New campus', type: 'select', options: campusFilterOptions() },
        { id: 'toDepartment', label: 'New department', type: 'select', options: DEPT_NAMES() },
        { id: 'newGross', label: 'Revised gross', type: 'number', validate: validators.number },
        { id: 'effective', label: 'Effective date', type: 'date', required: true },
        { id: 'remarks', label: 'Justification', type: 'textarea', span: 'full', required: true, validate: validators.required },
      ],
    }],
    onSubmit: () => notify({ title: 'Movement submitted', text: 'Routed to the principal and management for approval.', tone: 'success' }),
  });
}

/* ==========================================================================
   11 · Exit: resignations · clearance · full & final
   ========================================================================== */

function resignationRow(rg) {
  const s = byId(db.staff, rg.employeeId);
  const clearance = clearanceFor(rg);
  const cleared = clearance.filter((c) => c.status === 'Cleared').length;
  return {
    ...rg,
    designationLabel: rg.designation,
    campusLabel: campusName(rg.campusId),
    experienceYears: s ? s.experienceYears : 0,
    clearedCount: cleared,
    clearanceTotal: clearance.length,
    clearancePct: Math.round((cleared / clearance.length) * 100),
    dues: clearance.reduce((t, c) => t + c.dues, 0),
    noticeServed: Math.max(0, Math.round((new Date('2026-08-20') - new Date(rg.appliedOn)) / 86400000)),
  };
}

const exitRoutes = {
  'hr/resignations': {
    title: 'Resignations',
    subtitle: 'Notice period tracking, exit interviews and attrition',
    section: 'hr',
    render(mount) {
      injectStyles();
      const rows = db.resignations.map(resignationRow);
      const attritionRate = round2((rows.length / db.staff.length) * 100 * 12 / 5);
      const reasons = countBy(rows, 'reason');

      mount.appendChild(listPage({
        title: 'Resignations',
        subtitle: `${rows.length} resignations in FY 2026-27 · annualised attrition ${attritionRate}%`,
        route: 'hr/resignations',
        actions: [
          Button('Exit clearance', { variant: 'secondary', icon: 'check-circle', route: 'hr/exit-clearance' }),
          Button('Full & final', { variant: 'secondary', icon: 'calculator', route: 'hr/full-and-final' }),
          Button('Record resignation', { variant: 'primary', icon: 'log-out', onClick: () => openResignationForm() }),
        ],
        kpis: [
          { label: 'Resignations YTD', value: String(rows.length), icon: 'log-out', tone: 'danger' },
          { label: 'Serving notice', value: String(rows.filter((r) => r.status !== 'Completed').length), icon: 'clock', tone: 'warning' },
          { label: 'Exit interviews done', value: String(rows.filter((r) => r.exitInterview).length), icon: 'message-square', tone: 'info' },
          { label: 'Annualised attrition', value: `${attritionRate}%`, icon: 'trending-down', tone: 'warning' },
          { label: 'F&F pending', value: String(rows.filter((r) => r.fnfStatus !== 'Paid').length), icon: 'calculator', tone: 'brand', route: 'hr/full-and-final' },
        ],
        chart: barChart({
          categories: reasons.map((r) => r.key),
          series: [{ name: 'Resignations', values: reasons.map((r) => r.value) }],
          horizontal: true, height: 260, title: 'Reasons for leaving',
        }),
        chartTitle: 'Reasons for leaving',
        columns: [
          { key: 'employeeName', label: 'Employee', width: 230, sticky: true, render: (r) => empCellById(r.employeeId, `${r.designation} · ${r.department}`), value: (r) => r.employeeName },
          { key: 'campusLabel', label: 'Campus', width: 150, filter: true },
          { key: 'experienceYears', label: 'Tenure', width: 100, align: 'right', numeric: true, render: (r) => `${r.experienceYears} yrs`, value: (r) => r.experienceYears },
          { key: 'appliedOn', label: 'Applied', width: 130, render: (r) => formatDate(r.appliedOn), value: (r) => r.appliedOn },
          { key: 'noticePeriodDays', label: 'Notice', width: 100, align: 'right', numeric: true, render: (r) => `${r.noticePeriodDays} d` },
          { key: 'lastWorkingDay', label: 'Last working day', width: 150, render: (r) => formatDate(r.lastWorkingDay), value: (r) => r.lastWorkingDay },
          { key: 'reason', label: 'Reason', width: 170, filter: true },
          { key: 'exitInterview', label: 'Exit interview', width: 140, align: 'center', render: (r) => Badge(r.exitInterview ? 'Completed' : 'Pending', { tone: r.exitInterview ? 'success' : 'warning' }) },
          {
            key: 'clearancePct', label: 'Clearance', width: 180, align: 'right', numeric: true,
            render: (r) => ProgressBar(r.clearancePct, { size: 'sm', showValue: true, tone: r.clearancePct === 100 ? 'success' : r.clearancePct >= 50 ? 'warning' : 'danger' }),
            value: (r) => r.clearancePct,
          },
          { key: 'fnfAmount', label: 'F&F amount', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.fnfAmount), value: (r) => r.fnfAmount },
          { key: 'fnfStatus', label: 'F&F', width: 120, filter: true, render: (r) => Badge(r.fnfStatus) },
          { key: 'status', label: 'Status', width: 160, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        footerAggregates: true,
        pageSize: 25,
        searchKeys: ['employeeName', 'department', 'reason'],
        expandable: (r) => h('div', { className: 'grid grid-2' },
          SectionCard({ title: 'Exit timeline' },
            Timeline([
              { title: 'Resignation submitted', meta: formatDate(r.appliedOn), text: `Reason: ${r.reason}`, icon: 'log-out', tone: 'warning' },
              { title: 'Manager discussion', meta: formatDate(new Date(new Date(r.appliedOn).getTime() + 3 * 86400000)), text: 'Retention conversation held; decision unchanged.', icon: 'message-square', tone: 'info' },
              { title: 'Notice period', meta: `${r.noticePeriodDays} days`, text: `${r.noticeServed} days served so far.`, icon: 'clock', tone: 'neutral' },
              { title: 'Exit interview', meta: r.exitInterview ? 'Completed' : 'Pending', text: r.exitInterview ? 'Feedback recorded by HR.' : 'To be scheduled in the final week.', icon: 'clipboard-list', tone: r.exitInterview ? 'success' : 'warning' },
              { title: 'Last working day', meta: formatDate(r.lastWorkingDay), text: 'Clearance must be complete by this date.', icon: 'calendar', tone: 'danger' },
            ])),
          SectionCard({ title: 'Clearance status' },
            h('div', { className: 'hr-check-list' },
              clearanceFor(r).map((c) => h('div', { className: 'hr-check', dataset: { done: String(c.status === 'Cleared') } },
                h('div', { className: 'hr-check-ico', html: icon(c.status === 'Cleared' ? 'check' : 'clock', 14) }),
                h('div', { className: 'flex-1 min-0' },
                  h('div', { className: 't-sm t-medium' }, c.department),
                  h('div', { className: 't-xs t-muted' }, c.remarks)),
                Badge(c.status)))))),
        rowActions: (r) => [
          { label: 'Open employee', icon: 'id-card', route: `hr/employee-profile/${r.employeeId}` },
          { label: 'Exit clearance', icon: 'check-circle', route: 'hr/exit-clearance' },
          { label: 'Full & final', icon: 'calculator', route: 'hr/full-and-final' },
          { separator: true },
          { label: 'Withdraw resignation', icon: 'refresh-ccw', tone: 'danger', onClick: () => ConfirmDialog({ title: `Withdraw ${r.employeeName}'s resignation?`, text: 'The employee returns to Active status and the exit checklist is cancelled.', confirmLabel: 'Withdraw', tone: 'danger' }).then((ok) => ok && notify({ title: 'Resignation withdrawn', tone: 'success' })) },
        ],
        onRowClick: (r) => navigate(`hr/employee-profile/${r.employeeId}`),
        exportName: 'resignations',
        notes: Callout({ tone: 'warning', icon: 'info', title: 'Notice period policy' },
          'Teaching staff serve 60 days’ notice and may not be relieved mid-term without the principal’s approval. Shortfall in notice is recovered from the full & final settlement.'),
        emptyState: emptyFor('No resignations', 'Nothing pending — the team is intact this quarter.'),
      }));
    },
  },

  'hr/exit-clearance': {
    title: 'Exit Clearance',
    subtitle: 'Department-wise no-dues checklist for every exiting employee',
    section: 'hr',
    render(mount) {
      injectStyles();
      const resigs = db.resignations.map(resignationRow);
      const rows = [];
      resigs.forEach((rg) => {
        clearanceFor(rg).forEach((c) => rows.push({
          ...c,
          resignationId: rg.id,
          employeeId: rg.employeeId,
          employeeName: rg.employeeName,
          designation: rg.designation,
          campusId: rg.campusId,
          lastWorkingDay: rg.lastWorkingDay,
        }));
      });
      const cleared = rows.filter((r) => r.status === 'Cleared');
      const totalDues = rows.reduce((t, r) => t + r.dues, 0);
      const byDept = CLEARANCE_DEPTS.map((d) => ({
        key: d.label,
        value: rows.filter((r) => r.department === d.label && r.status === 'Cleared').length,
      }));

      mount.appendChild(listPage({
        title: 'Exit Clearance',
        subtitle: `${resigs.length} exits · ${rows.length} clearance items · ${cleared.length} signed off`,
        route: 'hr/exit-clearance',
        actions: [
          Button('Resignations', { variant: 'secondary', icon: 'log-out', route: 'hr/resignations' }),
          Button('Full & final', { variant: 'primary', icon: 'calculator', route: 'hr/full-and-final' }),
        ],
        kpis: [
          { label: 'Exits in progress', value: String(resigs.filter((r) => r.clearancePct < 100).length), icon: 'log-out', tone: 'warning' },
          { label: 'Items cleared', value: `${cleared.length} / ${rows.length}`, icon: 'check-circle', tone: 'success' },
          { label: 'Pending sign-offs', value: String(rows.length - cleared.length), icon: 'clock', tone: 'danger' },
          { label: 'Recoverable dues', value: inrC(totalDues), icon: 'alert-circle', tone: 'brand' },
        ],
        chart: barChart({
          categories: byDept.map((d) => d.key),
          series: [{ name: 'Cleared', values: byDept.map((d) => d.value) }],
          horizontal: true, height: 280, target: resigs.length, targetLabel: 'All exits',
          title: 'Clearances signed off by department',
        }),
        chartTitle: 'Clearances signed off by department',
        columns: [
          { key: 'employeeName', label: 'Employee', width: 220, sticky: true, render: (r) => empCellById(r.employeeId, r.designation), value: (r) => r.employeeName },
          { key: 'department', label: 'Clearing department', width: 180, filter: true },
          { key: 'items', label: 'Items to clear', width: 300 },
          { key: 'owner', label: 'Owner', width: 180 },
          { key: 'lastWorkingDay', label: 'Last working day', width: 150, render: (r) => formatDate(r.lastWorkingDay), value: (r) => r.lastWorkingDay },
          { key: 'clearedOn', label: 'Cleared on', width: 130, render: (r) => (r.clearedOn ? formatDate(r.clearedOn) : '—'), value: (r) => r.clearedOn || '' },
          { key: 'dues', label: 'Dues', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => (r.dues ? h('span', { className: 't-danger' }, inr(r.dues)) : '—'), value: (r) => r.dues },
          { key: 'remarks', label: 'Remarks', width: 220 },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        footerAggregates: true,
        selectable: true,
        groupBy: 'employeeName',
        pageSize: 50,
        searchKeys: ['employeeName', 'department', 'owner'],
        bulkActions: [
          { label: 'Sign off selected', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} clearance items signed off`, tone: 'success' }) },
          { label: 'Remind owners', icon: 'send', onClick: (sel) => notify({ title: `Reminders sent to ${sel.length} owners`, tone: 'info' }) },
        ],
        rowActions: (r) => [
          { label: 'Sign off', icon: 'check-circle', disabled: r.status === 'Cleared', onClick: () => ConfirmDialog({ title: `Sign off ${r.department} clearance?`, text: `Confirms no dues for ${r.employeeName} from ${r.department}.`, confirmLabel: 'Sign off', tone: 'brand', icon: 'check-circle' }).then((ok) => ok && notify({ title: 'Clearance signed off', tone: 'success' })) },
          { label: 'Raise a due', icon: 'alert-circle', tone: 'danger', onClick: () => notify({ title: 'Due raised', text: 'It will be recovered in the full & final settlement.', tone: 'warning' }) },
          { label: 'Open employee', icon: 'id-card', route: `hr/employee-profile/${r.employeeId}` },
        ],
        exportName: 'exit-clearance',
        notes: Callout({ tone: 'info', icon: 'workflow', title: 'Sequence' },
          'All seven departments must sign off before HR can release the relieving letter. Any unrecovered item becomes a deduction in the full & final settlement.'),
        emptyState: emptyFor('No clearance pending', 'Nobody is currently serving notice.'),
      }));
    },
  },

  'hr/full-and-final': {
    title: 'Full & Final Settlement',
    subtitle: 'Final dues computation, recoveries and payout status',
    section: 'hr',
    render(mount) {
      injectStyles();
      const rows = db.resignations.map((rg) => {
        const f = fnfFor(rg);
        return {
          id: rg.id,
          employeeId: rg.employeeId,
          employeeName: rg.employeeName,
          designation: rg.designation,
          department: rg.department,
          campusId: rg.campusId,
          lastWorkingDay: rg.lastWorkingDay,
          fnfStatus: rg.fnfStatus,
          ...f,
        };
      });
      const payable = rows.reduce((t, r) => t + r.net, 0);
      const pending = rows.filter((r) => r.fnfStatus !== 'Paid');

      mount.appendChild(reportPage({
        title: 'Full & Final Settlement',
        subtitle: `${rows.length} settlements · ${inrC(payable)} net payable · ${pending.length} awaiting release`,
        route: 'hr/full-and-final',
        filters: [
          { id: 'status', label: 'Status', options: ['Pending', 'Processed', 'Paid'] },
          { id: 'campus', label: 'Campus', options: campusFilterOptions() },
          { id: 'department', label: 'Department', options: DEPT_NAMES() },
        ],
        onFilter: (id, value, allValues, table) => {
          let out = rows;
          if (allValues.status && allValues.status !== 'all') out = out.filter((r) => r.fnfStatus === allValues.status);
          if (allValues.campus && allValues.campus !== 'all') out = out.filter((r) => r.campusId === allValues.campus);
          if (allValues.department && allValues.department !== 'all') out = out.filter((r) => r.department === allValues.department);
          table.refresh(out);
        },
        summary: [
          { label: 'Settlements', value: String(rows.length), icon: 'calculator', tone: 'brand' },
          { label: 'Gross dues', value: inrC(rows.reduce((t, r) => t + r.gross, 0)), icon: 'banknote', tone: 'info' },
          { label: 'Recoveries', value: inrC(rows.reduce((t, r) => t + r.deductions, 0)), icon: 'minus', tone: 'danger' },
          { label: 'Net payable', value: inrC(payable), icon: 'wallet', tone: 'success' },
        ],
        chart: waterfallChart({
          items: [
            { label: 'Salary payable', value: rows.reduce((t, r) => t + r.salaryPayable, 0), type: 'start' },
            { label: 'Leave encashment', value: rows.reduce((t, r) => t + r.leaveEncash, 0) },
            { label: 'Gratuity', value: rows.reduce((t, r) => t + r.gratuity, 0) },
            { label: 'Bonus', value: rows.reduce((t, r) => t + r.bonus, 0) },
            { label: 'Loan recovery', value: -rows.reduce((t, r) => t + r.loanRecovery, 0) },
            { label: 'Notice shortfall', value: -rows.reduce((t, r) => t + r.noticeShort, 0) },
            { label: 'Dues & TDS', value: -rows.reduce((t, r) => t + r.recovery + r.tds, 0) },
            { label: 'Net payable', value: payable, type: 'total' },
          ],
          valueFormat: 'currencyCompact', height: 320, title: 'Settlement build-up across all exits',
        }),
        chartTitle: 'Settlement build-up across all exits',
        columns: [
          { key: 'employeeName', label: 'Employee', width: 220, sticky: true, render: (r) => empCellById(r.employeeId, r.designation), value: (r) => r.employeeName },
          { key: 'department', label: 'Department', width: 150, filter: true },
          { key: 'lastWorkingDay', label: 'Last working day', width: 150, render: (r) => formatDate(r.lastWorkingDay), value: (r) => r.lastWorkingDay },
          { key: 'workedDays', label: 'Days worked', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'salaryPayable', label: 'Salary', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.salaryPayable), value: (r) => r.salaryPayable },
          { key: 'leaveEncash', label: 'Leave encash', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.leaveEncash), value: (r) => r.leaveEncash },
          { key: 'gratuity', label: 'Gratuity', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => (r.gratuity ? inr(r.gratuity) : 'Not eligible'), value: (r) => r.gratuity },
          { key: 'bonus', label: 'Bonus', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => (r.bonus ? inr(r.bonus) : '—'), value: (r) => r.bonus },
          { key: 'gross', label: 'Gross dues', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => h('strong', null, inr(r.gross)), value: (r) => r.gross },
          { key: 'loanRecovery', label: 'Loan recovery', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => (r.loanRecovery ? inr(r.loanRecovery) : '—'), value: (r) => r.loanRecovery },
          { key: 'noticeShort', label: 'Notice shortfall', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => (r.noticeShort ? inr(r.noticeShort) : '—'), value: (r) => r.noticeShort },
          { key: 'recovery', label: 'Dues', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => (r.recovery ? inr(r.recovery) : '—'), value: (r) => r.recovery },
          { key: 'tds', label: 'TDS', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.tds), value: (r) => r.tds },
          { key: 'net', label: 'Net payable', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => h('strong', { className: 't-success' }, inr(r.net)), value: (r) => r.net },
          { key: 'fnfStatus', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.fnfStatus) },
          {
            key: 'statement', label: 'Statement', width: 150, sortable: false, align: 'right',
            render: (r) => Button('Open', { variant: 'ghost', size: 'sm', icon: 'receipt', onClick: () => openFnfStatement(r) }),
          },
        ],
        rows,
        tableTitle: 'Settlement register',
        footerAggregates: true,
        pageSize: 25,
        notes: Callout({ tone: 'info', icon: 'scale', title: 'Statutory basis' },
          'Gratuity is paid under the Payment of Gratuity Act at 15 days’ basic for every completed year, for employees with five or more years of service. Leave encashment is limited to the encashable balance. Settlements are released within 45 days of the last working day.'),
      }));
    },
  },
};

function openFnfStatement(r) {
  Modal({
    title: `Full & final — ${r.employeeName}`,
    subtitle: `${r.designation} · last working day ${formatDate(r.lastWorkingDay)}`,
    size: 'lg', icon: 'calculator', tone: 'brand',
    body: h('div', { className: 'stack' },
      h('div', { className: 'hr-slip' },
        h('div', { className: 'hr-slip-grid' },
          h('section', null,
            h('div', { className: 't-eyebrow mb-2' }, 'Amounts payable'),
            h('div', { className: 'hr-slip-line' }, h('span', null, `Salary for ${r.workedDays} days`), h('b', null, inr(r.salaryPayable))),
            h('div', { className: 'hr-slip-line' }, h('span', null, 'Leave encashment'), h('b', null, inr(r.leaveEncash))),
            h('div', { className: 'hr-slip-line' }, h('span', null, `Gratuity (${r.gratuityYears} yrs)`), h('b', null, r.gratuity ? inr(r.gratuity) : 'Not eligible')),
            h('div', { className: 'hr-slip-line' }, h('span', null, 'Bonus / ex-gratia'), h('b', null, r.bonus ? inr(r.bonus) : '—')),
            h('div', { className: 'hr-slip-total' }, h('span', null, 'Gross dues'), h('b', null, inr(r.gross)))),
          h('section', null,
            h('div', { className: 't-eyebrow mb-2' }, 'Recoveries'),
            h('div', { className: 'hr-slip-line' }, h('span', null, 'Loan / advance outstanding'), h('b', null, r.loanRecovery ? inr(r.loanRecovery) : '—')),
            h('div', { className: 'hr-slip-line' }, h('span', null, 'Notice period shortfall'), h('b', null, r.noticeShort ? inr(r.noticeShort) : '—')),
            h('div', { className: 'hr-slip-line' }, h('span', null, 'Departmental dues'), h('b', null, r.recovery ? inr(r.recovery) : '—')),
            h('div', { className: 'hr-slip-line' }, h('span', null, 'TDS'), h('b', null, inr(r.tds))),
            h('div', { className: 'hr-slip-total' }, h('span', null, 'Total recoveries'), h('b', null, inr(r.deductions))))),
        h('div', { className: 'hr-slip-net' },
          h('div', { className: 'stack-1' },
            h('div', { className: 't-eyebrow' }, 'Net settlement'),
            h('div', { className: 't-xs t-muted' }, `Status: ${r.fnfStatus} · release within 45 days of the last working day`)),
          h('div', { className: 'hr-slip-net-v' }, inr(r.net)))),
      SectionCard({ title: 'Clearance dependencies', flush: true },
        DataTable({
          columns: [
            { key: 'department', label: 'Department', width: 180, sticky: true },
            { key: 'status', label: 'Status', width: 130, render: (c) => Badge(c.status) },
            { key: 'dues', label: 'Dues', align: 'right', numeric: true, render: (c) => (c.dues ? inr(c.dues) : '—'), value: (c) => c.dues, aggregate: 'sum', format: inrC },
            { key: 'remarks', label: 'Remarks', width: 240 },
          ],
          rows: r.clearance, paginate: false, searchable: false, columnToggle: false, footerAggregates: true,
        }))),
    actions: (close) => frag(
      Button('Close', { variant: 'ghost', onClick: close }),
      Button('Print statement', { variant: 'secondary', icon: 'print', onClick: mockAction('Print F&F statement') }),
      Button('Release payment', {
        variant: 'primary', icon: 'banknote', disabled: r.fnfStatus === 'Paid',
        onClick: () => ConfirmDialog({ title: 'Release the settlement?', text: `${inr(r.net)} will be credited to ${r.employeeName}'s registered bank account and the relieving letter issued.`, confirmLabel: 'Release', tone: 'brand', icon: 'banknote' }).then((ok) => { if (ok) { close(); notify({ title: 'Settlement released', text: `${inr(r.net)} · demo only`, tone: 'success' }); } }),
      })),
  });
}

function openResignationForm() {
  formPage({
    title: 'Record resignation',
    subtitle: 'Starts the notice-period clock and opens the exit clearance checklist.',
    mode: 'modal', size: 'lg', submitLabel: 'Record resignation',
    sections: [{
      title: 'Resignation', cols: 2,
      fields: [
        { id: 'employee', label: 'Employee', type: 'combobox', required: true, options: db.staff.filter((s) => s.status === 'Active').slice(0, 150).map((s) => ({ value: s.id, label: `${s.name} — ${s.employeeCode}` })) },
        { id: 'appliedOn', label: 'Resignation date', type: 'date', required: true },
        { id: 'notice', label: 'Notice period (days)', type: 'number', value: 60, required: true },
        { id: 'lastDay', label: 'Proposed last working day', type: 'date', required: true },
        { id: 'reason', label: 'Reason', type: 'select', required: true, options: ['Better opportunity', 'Relocation', 'Higher studies', 'Personal reasons', 'Health reasons'] },
        { id: 'exitInterview', label: 'Exit interview', type: 'switch', switchLabel: 'Schedule an exit interview' },
        { id: 'notes', label: 'Manager note', type: 'textarea', span: 'full' },
      ],
    }],
    onSubmit: () => notify({ title: 'Resignation recorded', text: 'Exit clearance checklist created and owners notified.', tone: 'warning' }),
  });
}

/* ==========================================================================
   12 · HR analytics
   ========================================================================== */

const reportRoutes = {
  'hr/reports': {
    title: 'HR Reports',
    subtitle: 'Headcount, attrition, cost and diversity analytics',
    section: 'hr',
    render(mount, ctx) {
      injectStyles();
      const staff = db.staff;
      const monthlyCost = staff.reduce((t, s) => t + s.salaryGross, 0);
      const rows = DEPT_NAMES().map((d) => {
        const dr = staff.filter((s) => s.department === d);
        const cost = dr.reduce((t, s) => t + s.salaryGross, 0);
        const exits = db.resignations.filter((r) => r.department === d).length;
        return {
          id: d,
          department: d,
          headcount: dr.length,
          teaching: dr.filter((s) => s.type === 'Teaching').length,
          female: dr.filter((s) => s.gender === 'Female').length,
          male: dr.filter((s) => s.gender === 'Male').length,
          diversityPct: dr.length ? round2((dr.filter((s) => s.gender === 'Female').length / dr.length) * 100) : 0,
          avgExperience: dr.length ? round2(dr.reduce((t, s) => t + s.experienceYears, 0) / dr.length) : 0,
          avgAttendance: dr.length ? round2(dr.reduce((t, s) => t + s.attendancePct, 0) / dr.length) : 0,
          avgScore: dr.length ? round2(dr.reduce((t, s) => t + s.appraisalScore, 0) / dr.length) : 0,
          monthlyCost: cost,
          costShare: round2((cost / monthlyCost) * 100),
          exits,
          attrition: dr.length ? round2((exits / dr.length) * 100) : 0,
          openRoles: db.recruitments.filter((r) => r.department === d && r.status !== 'Closed').reduce((t, r) => t + r.openings, 0),
        };
      });

      const tenureBuckets = [
        { key: '0-2 yrs', value: staff.filter((s) => s.experienceYears <= 2).length },
        { key: '3-5 yrs', value: staff.filter((s) => s.experienceYears > 2 && s.experienceYears <= 5).length },
        { key: '6-10 yrs', value: staff.filter((s) => s.experienceYears > 5 && s.experienceYears <= 10).length },
        { key: '11-15 yrs', value: staff.filter((s) => s.experienceYears > 10 && s.experienceYears <= 15).length },
        { key: '16+ yrs', value: staff.filter((s) => s.experienceYears > 15).length },
      ];

      mount.appendChild(reportPage({
        title: 'HR Reports',
        subtitle: `FY 2026-27 · ${formatNumber(staff.length)} employees · ${inrC(monthlyCost * 12)} annual salary cost`,
        route: 'hr/reports',
        filters: [
          { id: 'campus', label: 'Campus', options: campusFilterOptions(), value: currentCampus(ctx), allLabel: 'All campuses' },
          { id: 'type', label: 'Cadre', options: ['Teaching', 'Non-Teaching'] },
          { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'q1', label: 'Q1' }, { id: 'q2', label: 'Q2' }, { id: 'ytd', label: 'YTD' }] },
        ],
        onFilter: (id, value, allValues, table) => {
          let base = staff;
          if (allValues.campus && allValues.campus !== 'all') base = base.filter((s) => s.campusId === allValues.campus);
          if (allValues.type && allValues.type !== 'all') base = base.filter((s) => s.type === allValues.type);
          const out = rows.map((r) => {
            const dr = base.filter((s) => s.department === r.department);
            return { ...r, headcount: dr.length, monthlyCost: dr.reduce((t, s) => t + s.salaryGross, 0) };
          }).filter((r) => r.headcount > 0);
          table.refresh(out);
        },
        summary: [
          { label: 'Headcount', value: formatNumber(staff.length), delta: 2.6, icon: 'users', tone: 'brand', trend: analytics.sparks.staffAttendance },
          { label: 'Annual salary cost', value: inrC(monthlyCost * 12), delta: 4.1, icon: 'banknote', tone: 'warning' },
          { label: 'Attrition (annualised)', value: `${round2((db.resignations.length / staff.length) * 100 * 2.4)}%`, delta: -0.8, icon: 'trending-down', tone: 'danger' },
          { label: 'Women in workforce', value: `${round2((staff.filter((s) => s.gender === 'Female').length / staff.length) * 100)}%`, icon: 'users', tone: 'success' },
          { label: 'Avg tenure', value: `${round2(staff.reduce((t, s) => t + s.experienceYears, 0) / staff.length)} yrs`, icon: 'clock', tone: 'info' },
        ],
        chart: [
          barChart({
            categories: db.campuses.map((c) => c.name),
            series: [
              { name: 'Teaching', values: db.campuses.map((c) => staff.filter((s) => s.campusId === c.id && s.type === 'Teaching').length) },
              { name: 'Non-teaching', values: db.campuses.map((c) => staff.filter((s) => s.campusId === c.id && s.type !== 'Teaching').length) },
            ],
            stacked: true, height: 300, title: 'Headcount by campus and cadre',
          }),
          donutChart({
            data: tenureBuckets, height: 300, centerValue: formatNumber(staff.length), centerLabel: 'Employees',
            title: 'Tenure distribution',
          }),
          barChart({
            categories: rows.map((r) => r.department),
            series: [{ name: 'Monthly cost', values: rows.map((r) => r.monthlyCost) }],
            horizontal: true, valueFormat: 'currencyCompact', height: 340,
            title: 'Monthly salary cost by department',
          }),
          scatterPlot({
            points: staff.filter((s, i) => i % 4 === 0).map((s) => ({
              x: s.experienceYears, y: s.salaryGross, label: s.name, group: s.type,
            })),
            xLabel: 'Experience (years)', yLabel: 'Gross salary', height: 320,
            title: 'Experience versus gross salary',
          }),
        ],
        chartTitle: 'Workforce analytics',
        columns: [
          { key: 'department', label: 'Department', width: 180, sticky: true },
          { key: 'headcount', label: 'Headcount', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'teaching', label: 'Teaching', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'female', label: 'Women', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'diversityPct', label: 'Women %', align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round2(v)}%`, render: (r) => `${r.diversityPct}%` },
          { key: 'avgExperience', label: 'Avg tenure', align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round2(v)} yrs`, render: (r) => `${r.avgExperience} yrs` },
          { key: 'avgAttendance', label: 'Attendance', align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round2(v)}%`, render: (r) => `${r.avgAttendance}%` },
          { key: 'avgScore', label: 'Appraisal', align: 'right', numeric: true, aggregate: 'avg', format: (v) => round2(v).toFixed(2), render: (r) => `${r.avgScore} / 5` },
          { key: 'monthlyCost', label: 'Monthly cost', align: 'right', numeric: true, aggregate: 'sum', format: inrC, render: (r) => inr(r.monthlyCost), value: (r) => r.monthlyCost },
          { key: 'costShare', label: 'Cost share', align: 'right', numeric: true, render: (r) => `${r.costShare}%`, value: (r) => r.costShare },
          { key: 'exits', label: 'Exits', align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'attrition', label: 'Attrition', align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round2(v)}%`, render: (r) => Badge(`${r.attrition}%`, { tone: r.attrition > 4 ? 'danger' : r.attrition > 2 ? 'warning' : 'success' }) },
          { key: 'openRoles', label: 'Open roles', align: 'right', numeric: true, aggregate: 'sum' },
        ],
        rows,
        tableTitle: 'Department scorecard',
        footerAggregates: true,
        pageSize: 25,
        notes: h('div', { className: 'grid grid-2' },
          Callout({ tone: 'success', icon: 'thumbs-up', title: 'What is working' },
            `Attendance is holding at ${analytics.kpis.avgStaffAttendance}% and the student:teacher ratio of ${analytics.kpis.studentTeacherRatio}:1 is comfortably inside the CBSE norm of 30:1.`),
          Callout({ tone: 'warning', icon: 'alert-triangle', title: 'Watch list' },
            `${db.recruitments.filter((r) => r.status !== 'Closed').reduce((t, r) => t + r.openings, 0)} seats are still open and ${documentSummary().filter((d) => d.compliance === 'Non-compliant').length} employee files are missing a mandatory document.`)),
      }));
    },
  },
};

/* ==========================================================================
   13 · exported route table
   ========================================================================== */

export const routes = {
  ...directoryRoutes,
  ...profileRoutes,
  ...orgRoutes,
  ...recruitmentRoutes,
  ...documentRoutes,
  ...attendanceRoutes,
  ...leaveRoutes,
  ...payrollRoutes,
  ...payslipRoutes,
  ...loanRoutes,
  ...talentRoutes,
  ...exitRoutes,
  ...reportRoutes,
};

export default { routes };
