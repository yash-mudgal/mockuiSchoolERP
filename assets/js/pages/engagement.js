/* ==========================================================================
   pages/engagement.js — Engagement modules
   Sections owned by this file:
     lms · communication · ptm · activities · events
   Everything renders from the shared mock db; no persistence.
   ========================================================================== */

import {
  h, frag, Icon, Card, SectionCard, StatCard, Badge, Pill, Tag, Button, IconButton,
  Identity, Avatar, AvatarStack, DataTable, Modal, Drawer, ConfirmDialog, notify,
  EmptyState, ErrorState, Timeline, ActivityFeed, CommentThread, DescriptionList,
  ProgressBar, RadialProgress, Rating, Tabs, SegmentedControl, Accordion, Stepper,
  FilterBar, SearchInput, MenuButton, Callout, FileList, PhotoGrid, RankList,
  MetricRow, Divider, Toolbar, Field, Input, Textarea, Select, Combobox, MultiSelect,
  Checkbox, RadioGroup, Switch, DatePicker, TimePicker, FileUpload, FormGrid,
  FormSection, FormActions, validators, mockAction, download, toCsv, printNode,
  copyToClipboard, formatCurrency, formatNumber, formatPercent, formatDate,
  formatDateTime, formatTime, relativeTime, toneForStatus, initials, DEMO_NOW,
} from '../core/ui.js';

import {
  page, listPage, detailPage, dashboardPage, formPage, reportPage, settingsPage,
  approvalQueuePage, kanbanPage, calendarPage, profileHeader, kpiRow, greetingFor,
  missingRecord,
} from '../core/page-kit.js';

import {
  lineChart, areaChart, barChart, comboChart, donutChart, pieChart, funnelChart,
  heatmap, gaugeChart, scatterPlot, bulletChart, waterfallChart, treemap,
  radialBarChart, progressRing, sparkline, stackedProgressBar, ScaleLegend,
  PALETTE, SEQUENTIAL, ORDINAL, STATUS, seriesColor,
} from '../core/charts.js';

import {
  db, analytics, byId, where, search, sortBy, groupBy, sum, avg, countBy, sumBy,
  student360,
} from '../data/db.js';

import { navigate } from '../core/router.js';
import * as store from '../core/state.js';

/* ==========================================================================
   0. Module-scoped styles (tokens only — no literal colours or sizes)
   ========================================================================== */

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.id = 'engagement-module-styles';
  style.textContent = `
  .eng-grid { display:grid; gap:var(--sp-4); grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); }
  .eng-grid-wide { grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); }
  .eng-tile { display:flex; flex-direction:column; gap:var(--sp-2); padding:var(--card-pad);
              border:1px solid var(--border); border-radius:var(--r-lg); background:var(--surface);
              transition:border-color var(--dur-base) var(--ease), box-shadow var(--dur-base) var(--ease); }
  .eng-tile[data-clickable="1"] { cursor:pointer; }
  .eng-tile[data-clickable="1"]:hover { border-color:var(--border-brand); box-shadow:var(--shadow-sm); }
  .eng-tile:focus-visible { outline:2px solid var(--border-focus); outline-offset:2px; }

  .eng-thumb { position:relative; display:flex; align-items:center; justify-content:center;
               aspect-ratio:16/9; border-radius:var(--r-md); background:var(--surface-sunken);
               border:1px solid var(--border-subtle); color:var(--text-muted); overflow:hidden; }
  .eng-thumb[data-tone="brand"] { background:var(--surface-accent); color:var(--text-brand); }
  .eng-thumb-play { display:flex; align-items:center; justify-content:center; width:44px; height:44px;
                    border-radius:var(--r-full); background:var(--surface-raised); color:var(--text-brand);
                    box-shadow:var(--shadow-md); }
  .eng-thumb-badge { position:absolute; right:var(--sp-2); bottom:var(--sp-2); padding:var(--sp-1) var(--sp-2);
                     border-radius:var(--r-sm); background:var(--surface-inverse); color:var(--text-inverse);
                     font-size:var(--fs-2xs); font-variant-numeric:tabular-nums; }

  .eng-player { display:flex; align-items:center; justify-content:center; aspect-ratio:16/9;
                border-radius:var(--r-lg); background:var(--surface-inverse); color:var(--text-inverse);
                position:relative; overflow:hidden; }
  .eng-player-bar { position:absolute; left:0; right:0; bottom:0; padding:var(--sp-3);
                    display:flex; align-items:center; gap:var(--sp-3);
                    background:linear-gradient(to top, var(--scrim), transparent); }
  .eng-player-track { flex:1; height:4px; border-radius:var(--r-full); background:var(--surface-hover); overflow:hidden; }
  .eng-player-fill { height:100%; background:var(--brand-500); }

  .eng-phone { width:288px; max-width:100%; margin:0 auto; border:1px solid var(--border-strong);
               border-radius:var(--r-2xl); background:var(--surface-sunken); padding:var(--sp-3);
               box-shadow:var(--shadow-lg); }
  .eng-phone-top { display:flex; align-items:center; justify-content:space-between;
                   font-size:var(--fs-2xs); color:var(--text-muted); padding:0 var(--sp-2) var(--sp-2); }
  .eng-phone-screen { border-radius:var(--r-lg); background:var(--canvas); min-height:300px;
                      padding:var(--sp-3); display:flex; flex-direction:column; gap:var(--sp-2); }
  .eng-bubble { padding:var(--sp-3); border-radius:var(--r-lg); font-size:var(--fs-sm);
                line-height:var(--lh-normal); white-space:pre-wrap; word-break:break-word; }
  .eng-bubble[data-kind="sms"] { background:var(--surface-raised); border:1px solid var(--border);
                                 border-bottom-left-radius:var(--r-xs); color:var(--text); }
  .eng-bubble[data-kind="whatsapp"] { background:var(--success-50); border:1px solid var(--success-100);
                                      border-bottom-left-radius:var(--r-xs); color:var(--text); }
  .eng-bubble[data-kind="push"] { background:var(--surface-raised); border:1px solid var(--border);
                                  box-shadow:var(--shadow-sm); color:var(--text); }
  .eng-bubble-meta { margin-top:var(--sp-2); font-size:var(--fs-2xs); color:var(--text-muted); }

  .eng-mailwrap { border:1px solid var(--border); border-radius:var(--r-lg); overflow:hidden; background:var(--surface); }
  .eng-mailhead { padding:var(--sp-3) var(--sp-4); background:var(--surface-sunken); border-bottom:1px solid var(--border); }
  .eng-mailbody { padding:var(--sp-4); font-size:var(--fs-sm); line-height:var(--lh-normal); white-space:pre-wrap; }

  .eng-varchips { display:flex; flex-wrap:wrap; gap:var(--sp-2); }

  .eng-alert { border:2px solid var(--danger-500); border-radius:var(--r-lg);
               background:var(--danger-50); padding:var(--card-pad); }
  :root[data-theme="dark"] .eng-alert { background:var(--surface-raised); }
  .eng-alert-title { font-size:var(--fs-lg); font-weight:var(--fw-bold); color:var(--text-danger); }

  .eng-slotgrid { display:grid; gap:var(--sp-2); overflow-x:auto; padding-bottom:var(--sp-2); }
  .eng-slot { min-width:74px; padding:var(--sp-2); border-radius:var(--r-sm); border:1px solid var(--border);
              background:var(--surface); font-size:var(--fs-2xs); text-align:center; cursor:pointer;
              font-variant-numeric:tabular-nums; }
  .eng-slot[data-state="booked"] { background:var(--surface-selected); border-color:var(--border-brand); color:var(--text-brand); }
  .eng-slot[data-state="blocked"] { background:var(--surface-sunken); color:var(--text-faint); cursor:not-allowed; }
  .eng-slot:hover:not([data-state="blocked"]) { border-color:var(--border-brand); }
  .eng-slot:focus-visible { outline:2px solid var(--border-focus); outline-offset:1px; }
  .eng-slothead { min-width:74px; font-size:var(--fs-2xs); color:var(--text-muted); text-align:center; padding:var(--sp-1) 0; }

  .eng-house { border-radius:var(--r-lg); border:1px solid var(--border); overflow:hidden; background:var(--surface); }
  .eng-house-band { height:6px; }
  .eng-house-body { padding:var(--card-pad); display:flex; flex-direction:column; gap:var(--sp-3); }

  .eng-cert { border:2px solid var(--brand-500); border-radius:var(--r-lg); padding:var(--sp-8) var(--sp-6);
              background:var(--surface); text-align:center; display:flex; flex-direction:column;
              gap:var(--sp-3); align-items:center; }
  .eng-cert-inner { border:1px solid var(--border-brand); border-radius:var(--r-md); padding:var(--sp-6) var(--sp-4);
                    width:100%; display:flex; flex-direction:column; gap:var(--sp-3); align-items:center; }
  .eng-cert-name { font-size:var(--fs-2xl); font-weight:var(--fw-bold); color:var(--text-brand); }
  .eng-cert-rule { width:60%; height:1px; background:var(--border-strong); }
  .eng-cert-sign { display:flex; justify-content:space-between; width:100%; gap:var(--sp-4); margin-top:var(--sp-6); }

  .eng-rubric-row { display:grid; grid-template-columns:minmax(0,1fr) 120px 90px; gap:var(--sp-3);
                    align-items:center; padding:var(--sp-3) 0; border-bottom:1px solid var(--border-subtle); }
  .eng-rubric-row:last-child { border-bottom:none; }

  .eng-photo { aspect-ratio:4/3; border-radius:var(--r-md); border:1px solid var(--border-subtle);
               background:var(--surface-sunken); display:flex; align-items:center; justify-content:center;
               color:var(--text-faint); position:relative; overflow:hidden; }
  .eng-photo[data-hue="1"] { background:var(--brand-50); color:var(--brand-600); }
  .eng-photo[data-hue="2"] { background:var(--info-50); color:var(--info-700); }
  .eng-photo[data-hue="3"] { background:var(--success-50); color:var(--success-700); }
  .eng-photo[data-hue="4"] { background:var(--warning-50); color:var(--warning-700); }
  .eng-photo[data-hue="5"] { background:var(--purple-50); color:var(--purple-700); }
  .eng-photo[data-hue="6"] { background:var(--teal-50); color:var(--teal-700); }
  .eng-photo-cap { position:absolute; left:0; right:0; bottom:0; padding:var(--sp-2);
                   font-size:var(--fs-2xs); background:var(--surface-overlay); color:var(--text-secondary); }

  .eng-daycol { border:1px solid var(--border); border-radius:var(--r-md); background:var(--surface);
                display:flex; flex-direction:column; min-width:190px; }
  .eng-daycol-head { padding:var(--sp-2) var(--sp-3); border-bottom:1px solid var(--border);
                     background:var(--surface-sunken); border-radius:var(--r-md) var(--r-md) 0 0; }
  .eng-appt { padding:var(--sp-2) var(--sp-3); border-bottom:1px solid var(--border-subtle); font-size:var(--fs-sm); }
  .eng-appt:last-child { border-bottom:none; }

  .eng-scroll-x { display:flex; gap:var(--sp-3); overflow-x:auto; padding-bottom:var(--sp-2); }

  @media (max-width: 768px) {
    .eng-rubric-row { grid-template-columns:1fr; gap:var(--sp-2); }
    .eng-phone { width:100%; }
  }
  `;
  document.head.appendChild(style);
}

/* ==========================================================================
   1. Shared helpers
   ========================================================================== */

const TODAY = formatDate(DEMO_NOW, 'iso');

/** Deterministic tiny RNG so derived rows are identical on every reload. */
function rngFor(seed) {
  let a = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) a = (a * 31 + str.charCodeAt(i)) >>> 0;
  a = (a + 0x6d2b79f5) >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pickFrom = (rnd, arr) => arr[Math.floor(rnd() * arr.length) % arr.length];
const intBetween = (rnd, lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

/** Scope a collection to the active campus, falling back to everything when
 *  the campus has no rows for this (demo) collection. */
function scoped(rows, ctx, key = 'campusId') {
  const campusId = ctx && ctx.state ? ctx.state.campusId : null;
  if (!campusId || campusId === 'all') return rows;
  const out = rows.filter((r) => r[key] === campusId || r[key] === 'ALL');
  return out.length ? out : rows;
}

const campusName = (id) => (byId(db.campuses, id) || {}).name || '—';
const staffName = (id) => (byId(db.staff, id) || {}).name || '—';

/** Warm the staff collection — several LMS collections read staff lazily. */
function warmStaff() { return db.staff.length; }

/** Students and parents get a read-only view of the shared screens. */
function isLearner() { return store.isRole('student', 'parent'); }

/** A stable teaching-staff pick, safe for any index. */
function teacherAt(i) {
  const teaching = db.staff.filter((s) => s.type === 'Teaching');
  return teaching.length ? teaching[Math.abs(i) % teaching.length] : { id: null, name: '—' };
}

function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }

function studentLink(name, id, meta) {
  return h('button', {
    className: 'btn btn-link', type: 'button',
    style: { padding: '0', height: 'auto', textAlign: 'left' },
    attrs: { title: meta || name },
    onClick: (e) => { e.stopPropagation(); navigate(`students/profile/${id}`); },
  }, name);
}

function teacherLink(name, id) {
  if (!id) return h('span', { className: 't-muted' }, name || '—');
  return h('button', {
    className: 'btn btn-link', type: 'button',
    style: { padding: '0', height: 'auto', textAlign: 'left' },
    onClick: (e) => { e.stopPropagation(); navigate(`teachers/profile/${id}`); },
  }, name);
}

function progressCell(value, tone) {
  return h('div', { className: 'row', style: { gap: 'var(--sp-2)', minWidth: '120px' } },
    h('div', { className: 'flex-1' }, ProgressBar(value, { tone, size: 'sm' })),
    h('span', { className: 't-xs t-num t-muted', style: { minWidth: '34px' } }, `${Math.round(value)}%`));
}

function emptyFor(icon, title, text, action) {
  return EmptyState({ icon, title, text, action });
}

/** Render a chart only when there is something to plot. */
function chartOrEmpty(categories, build, message) {
  if (!categories || !categories.length) {
    return emptyFor('chart-bar', 'Nothing to plot yet', message || 'Data will appear here once activity is recorded.');
  }
  return build();
}

/** Standard export/print menu used across list screens. */
function moreMenu(extra = []) {
  return MenuButton(extra.concat(extra.length ? [{ separator: true }] : []).concat([
    { label: 'Export CSV', icon: 'download', onClick: mockAction('Export CSV') },
    { label: 'Print view', icon: 'print', onClick: mockAction('Print') },
    { label: 'Schedule report', icon: 'clock', onClick: mockAction('Schedule report') },
  ]), { label: 'More actions' });
}

function statusCounts(rows, key = 'status') {
  const map = new Map();
  for (const r of rows) map.set(r[key], (map.get(r[key]) || 0) + 1);
  return map;
}

/** Filter helper for FilterBar `all` values. */
function applyFilters(rows, values, map) {
  let out = rows;
  for (const [id, fn] of Object.entries(map)) {
    const v = values[id];
    if (v == null || v === '' || v === 'all') continue;
    out = out.filter((r) => fn(r, v));
  }
  return out;
}

const textMatch = (v) => (r, term) => String(r[v] || '').toLowerCase().includes(String(term).toLowerCase());

/* ==========================================================================
   2. LMS
   ========================================================================== */

const LESSON_ICONS = {
  Video: 'video', 'PDF Notes': 'file-text', Presentation: 'presentation',
  Worksheet: 'clipboard-list', Quiz: 'clipboard-check',
};

function coursesFor(ctx) { warmStaff(); return scoped(db.courses, ctx); }

function lessonsForCourse(courseId) {
  return db.lessons.filter((l) => l.courseId === courseId);
}

/** Deterministic per-student progress inside a course. */
function courseRoster(course) {
  const students = db.students.filter((s) => s.classId === course.classId).slice(0, course.enrolled);
  return students.map((s) => {
    const rnd = rngFor(course.id + s.id);
    const completed = intBetween(rnd, 2, Math.max(3, course.lessons));
    const progress = Math.min(100, Math.round((completed / Math.max(1, course.lessons)) * 100));
    return {
      id: s.id, name: s.name, admissionNo: s.admissionNo, className: s.className,
      section: s.section, house: s.house,
      lessonsDone: Math.min(completed, course.lessons),
      progress,
      lastActive: formatDate(new Date(2026, 7, intBetween(rnd, 4, 19)), 'iso'),
      quizAvg: Math.round(45 + rnd() * 52),
      status: progress >= 90 ? 'Completed' : progress >= 35 ? 'In Progress' : 'Behind',
    };
  });
}

/* -------------------------------------------------------- lms / courses -- */

function courseDetail(mount, ctx, course) {
  const lessons = lessonsForCourse(course.id);
  const chapters = [];
  const byChapter = groupBy(lessons, 'chapter');
  for (const [name, items] of byChapter) {
    chapters.push({ name, items });
  }
  const roster = courseRoster(course);
  const classes = db.onlineClasses.filter((c) => c.courseId === course.id);
  const tests = db.onlineTests.filter((t) => t.courseId === course.id);
  const doubts = db.doubts.filter((d) => d.subject && course.title.startsWith(d.subject));

  const uploadDrawer = () => Drawer({
    title: 'Upload course content',
    subtitle: `${course.title} · ${course.className}`,
    size: 'lg',
    body: h('div', { className: 'stack-4' },
      FileUpload({
        label: 'Drop lesson files here or click to browse',
        hint: 'MP4, PDF, PPTX or DOCX up to 500 MB each. Files are not stored in this prototype.',
        multiple: true,
        onFiles: (files) => notify({ title: `${files.length} file(s) queued`, text: 'Content will appear after approval.', tone: 'success' }),
      }),
      FormGrid({ cols: 2 },
        Field({ label: 'Chapter', required: true },
          Select({ options: chapters.map((c) => c.name).concat(['New chapter…']), value: chapters[0] ? chapters[0].name : '' })),
        Field({ label: 'Content type', required: true },
          Select({ options: Object.keys(LESSON_ICONS) })),
        Field({ label: 'Topic title', className: 'col-span-full', required: true },
          Input({ placeholder: 'e.g. Trigonometric Identities — Worked Examples' })),
        Field({ label: 'Visible from' }, DatePicker({ value: TODAY })),
        Field({ label: 'Duration (minutes)' }, Input({ type: 'number', value: '30', numeric: true })),
        Field({ label: 'Description', className: 'col-span-full' },
          Textarea({ rows: 3, placeholder: 'What will students learn from this resource?' }))),
      Callout({ tone: 'info', icon: 'info', title: 'Approval required' },
        'Uploads from teaching staff go to Content Approval before students can see them.')),
    actions: (close) => frag(
      Button('Cancel', { variant: 'ghost', onClick: close }),
      Button('Upload & send for approval', {
        variant: 'primary', icon: 'upload',
        onClick: () => { close(); notify({ title: 'Sent for approval', text: course.title, tone: 'success' }); },
      })),
  });

  mount.appendChild(detailPage({
    title: course.title,
    subtitle: `${course.className} · ${course.subjectCode} · ${campusName(course.campusId)}`,
    route: 'lms/courses',
    initials: course.subjectCode.slice(0, 2),
    badges: [Badge(course.status), Badge(`${course.chapters} chapters`, { tone: 'neutral' })],
    meta: [
      { label: 'Teacher', value: course.teacherName, icon: 'presentation' },
      { label: 'Lessons', value: formatNumber(course.lessons), icon: 'layers' },
      { label: 'Enrolled', value: formatNumber(course.enrolled), icon: 'users' },
      { label: 'Duration', value: `${course.durationHours} hrs`, icon: 'clock' },
      { label: 'Updated', value: relativeTime(course.updatedAt), icon: 'history' },
    ],
    actions: [
      Button('Upload content', { variant: 'secondary', icon: 'upload', onClick: uploadDrawer }),
      Button('Back to catalogue', { variant: 'ghost', icon: 'arrow-left', route: 'lms/courses' }),
      Button('Publish update', { variant: 'primary', icon: 'send', onClick: mockAction('Publish course update') }),
    ],
    tabs: [
      {
        id: 'curriculum', label: 'Curriculum', icon: 'layers', count: chapters.length,
        render: () => {
          if (!chapters.length) {
            return Card({ pad: true }, emptyFor('layers', 'No content uploaded yet',
              `${course.chapters} chapters are planned for this course but no lesson files have been added.`,
              Button('Upload content', { variant: 'primary', icon: 'upload', onClick: uploadDrawer })));
          }
          return SectionCard({ title: 'Chapters & topics', icon: 'layers', subtitle: `${lessons.length} topics across ${chapters.length} chapters` },
            Accordion(chapters.map((c, i) => {
              const approved = c.items.filter((l) => l.status === 'Approved').length;
              return {
                id: 'ch' + i,
                title: `${c.name} — ${c.items.length} topic${c.items.length === 1 ? '' : 's'}`,
                icon: 'book-open',
                badge: `${approved}/${c.items.length} approved`,
                render: () => h('div', { className: 'stack-2' },
                  c.items.map((l) => h('div', {
                    className: 'row-3', style: { padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--border-subtle)' },
                  },
                    Icon(LESSON_ICONS[l.type] || 'file-text', 16),
                    h('div', { className: 'flex-1 min-0' },
                      h('div', { className: 't-sm t-medium t-truncate' }, l.title),
                      h('div', { className: 't-xs t-muted' }, `${l.type} · ${l.durationMin} min · ${formatNumber(l.views)} views · uploaded ${formatDate(l.uploadedOn)}`)),
                    Badge(l.status),
                    IconButton('eye', { label: `Preview ${l.title}`, size: 'sm', onClick: () => previewLesson(l) })))),
              };
            }), { multi: true, openIds: ['ch0'] }));
        },
      },
      {
        id: 'lessons', label: 'All lessons', icon: 'file-text', count: lessons.length,
        render: () => lessons.length ? DataTable({
          columns: [
            { key: 'title', label: 'Topic', sticky: true, width: 280, render: (r) => Identity(r.title, `${r.chapter} · ${r.type}`) },
            { key: 'type', label: 'Type', width: 130, filter: true },
            { key: 'durationMin', label: 'Duration', width: 100, align: 'right', numeric: true, render: (r) => `${r.durationMin} min` },
            { key: 'sizeMb', label: 'Size', width: 100, align: 'right', numeric: true, render: (r) => `${r.sizeMb} MB` },
            { key: 'views', label: 'Views', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
            { key: 'uploadedOn', label: 'Uploaded', width: 130, render: (r) => formatDate(r.uploadedOn) },
            { key: 'status', label: 'Status', width: 150, filter: true, render: (r) => Badge(r.status) },
          ],
          rows: lessons, footerAggregates: true, pageSize: 25,
          rowActions: (r) => [
            { label: 'Preview', icon: 'eye', onClick: () => previewLesson(r) },
            { label: 'Replace file', icon: 'upload', onClick: mockAction('Replace file') },
            { separator: true },
            { label: 'Archive topic', icon: 'archive', tone: 'danger', onClick: mockAction('Archive topic') },
          ],
        }) : Card({ pad: true }, emptyFor('file-text', 'No lessons uploaded', 'Add your first topic to start building this course.')),
      },
      {
        id: 'students', label: 'Learners', icon: 'users', count: roster.length,
        render: () => DataTable({
          columns: [
            { key: 'name', label: 'Student', sticky: true, width: 240, render: (r) => Identity(r.name, `${r.admissionNo} · ${r.className}-${r.section}`), value: (r) => r.name },
            { key: 'house', label: 'House', width: 110, filter: true },
            { key: 'lessonsDone', label: 'Lessons done', width: 130, align: 'right', numeric: true, aggregate: 'avg', format: (v) => Math.round(v) },
            { key: 'progress', label: 'Progress', width: 190, render: (r) => progressCell(r.progress, r.progress >= 70 ? 'success' : r.progress >= 40 ? 'warning' : 'danger'), value: (r) => r.progress },
            { key: 'quizAvg', label: 'Quiz avg', width: 110, align: 'right', numeric: true, render: (r) => `${r.quizAvg}%`, value: (r) => r.quizAvg, aggregate: 'avg', format: (v) => `${Math.round(v)}%` },
            { key: 'lastActive', label: 'Last active', width: 130, render: (r) => relativeTime(r.lastActive) },
            { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
          ],
          rows: roster, footerAggregates: true,
          onRowClick: (r) => navigate(`students/profile/${r.id}`),
          bulkActions: [{ label: 'Nudge learners', icon: 'send', onClick: (sel) => notify({ title: `Reminder queued for ${sel.length} learners`, tone: 'success' }) }],
          emptyState: emptyFor('users', 'No learners enrolled', 'Enrol a section to give students access to this course.'),
        }),
      },
      {
        id: 'live', label: 'Live classes', icon: 'video', count: classes.length,
        render: () => classes.length ? DataTable({
          columns: [
            { key: 'title', label: 'Session', sticky: true, width: 240 },
            { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date) },
            { key: 'startTime', label: 'Starts', width: 90 },
            { key: 'platform', label: 'Platform', width: 130, filter: true },
            { key: 'attended', label: 'Attended', width: 120, align: 'right', numeric: true, render: (r) => `${r.attended}/${r.enrolled}` , value: (r) => r.attended },
            { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
          ],
          rows: classes, paginate: false,
          onRowClick: () => navigate('lms/online-classes'),
        }) : Card({ pad: true }, emptyFor('video', 'No live sessions scheduled',
          'Schedule an online class so learners get a join link on their portal.',
          Button('Schedule class', { variant: 'primary', icon: 'calendar-plus', route: 'lms/online-classes' }))),
      },
      {
        id: 'tests', label: 'Tests', icon: 'clipboard-check', count: tests.length,
        render: () => tests.length ? DataTable({
          columns: [
            { key: 'title', label: 'Test', sticky: true, width: 220 },
            { key: 'scheduledOn', label: 'Scheduled', width: 130, render: (r) => formatDate(r.scheduledOn) },
            { key: 'questions', label: 'Qs', width: 70, align: 'right', numeric: true },
            { key: 'totalMarks', label: 'Marks', width: 90, align: 'right', numeric: true },
            { key: 'attempted', label: 'Attempted', width: 120, align: 'right', numeric: true, render: (r) => `${r.attempted}/${r.totalStudents}`, value: (r) => r.attempted },
            { key: 'avgScore', label: 'Avg %', width: 90, align: 'right', numeric: true },
            { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
          ],
          rows: tests, paginate: false,
          onRowClick: () => navigate('lms/online-tests'),
        }) : Card({ pad: true }, emptyFor('clipboard-check', 'No tests yet',
          'Build an online test from the question bank to assess this course.',
          Button('Build a test', { variant: 'primary', icon: 'plus', route: 'lms/online-tests/new' }))),
      },
    ],
    sidebar: [
      SectionCard({ title: 'Completion', icon: 'gauge', className: 'chart-card' },
        h('div', { className: 'row', style: { justifyContent: 'center' } },
          progressRing(course.completionPct, { label: 'Syllabus', sublabel: `${course.chapters} chapters` })),
        h('div', { className: 'mt-3' },
          MetricRow('Average learner progress', `${Math.round(avg(roster, 'progress') || 0)}%`),
          MetricRow('Learners completed', formatNumber(roster.filter((r) => r.status === 'Completed').length)),
          MetricRow('Learners behind', formatNumber(roster.filter((r) => r.status === 'Behind').length)))),
      SectionCard({ title: 'Course teacher', icon: 'presentation' },
        h('div', { className: 'row-3' },
          Avatar(course.teacherName, { size: 'lg' }),
          h('div', { className: 'flex-1 min-0' },
            h('div', { className: 't-medium t-truncate' }, course.teacherName),
            h('div', { className: 't-sm t-muted' }, `${course.subjectCode} · ${course.className}`))),
        h('div', { className: 'row mt-3' },
          Button('Message', { variant: 'secondary', size: 'sm', icon: 'send', route: 'communication/compose' }),
          Button('Timetable', { variant: 'ghost', size: 'sm', icon: 'calendar', route: 'teachers/timetable' }))),
      SectionCard({ title: 'Resources', icon: 'folder' },
        FileList([
          { name: `${course.subjectCode}-syllabus.pdf`, size: '480 KB', type: 'PDF', date: formatDate(course.updatedAt), status: 'Approved' },
          { name: `${course.subjectCode}-lesson-plan.docx`, size: '212 KB', type: 'DOCX', date: formatDate(course.updatedAt), status: 'Approved' },
          { name: `${course.subjectCode}-reference-list.pdf`, size: '96 KB', type: 'PDF', date: formatDate(course.updatedAt), status: 'Pending' },
        ], { onDownload: mockAction('Download resource') })),
      SectionCard({ title: 'Recent doubts', icon: 'message-circle', actions: Button('All doubts', { variant: 'link', size: 'sm', route: 'lms/doubts' }) },
        doubts.length ? ActivityFeed(doubts.slice(0, 5).map((d) => ({
          name: d.studentName, text: d.question, time: relativeTime(d.askedOn),
          icon: 'message-circle', tone: d.status === 'Answered' ? 'success' : 'warning',
        }))) : emptyFor('message-circle', 'No open doubts', 'Learners have not raised questions on this course yet.')),
    ],
    timeline: [
      { title: 'Course updated', meta: formatDate(course.updatedAt), text: `${course.teacherName} refreshed course material.`, icon: 'refresh', tone: 'info' },
      { title: 'Content approved', meta: formatDate(course.updatedAt), text: `${lessons.filter((l) => l.status === 'Approved').length} topics live for learners.`, icon: 'check-circle', tone: 'success' },
      { title: 'Course published', meta: formatDate('2026-04-12'), text: `Published to ${course.className} for academic year 2026-27.`, icon: 'send', tone: 'brand' },
    ],
  }));
}

function previewLesson(lesson) {
  Drawer({
    title: lesson.title,
    subtitle: `${lesson.courseTitle} · ${lesson.chapter}`,
    size: 'lg',
    body: h('div', { className: 'stack-4' },
      lesson.type === 'Video' ? videoPlayerMock(lesson) : h('div', { className: 'eng-thumb', style: { aspectRatio: '4/3' } },
        h('div', { className: 'stack-2', style: { alignItems: 'center' } },
          Icon(LESSON_ICONS[lesson.type] || 'file-text', 40),
          h('div', { className: 't-sm t-muted' }, `${lesson.type} · ${lesson.sizeMb} MB`))),
      DescriptionList([
        ['Type', lesson.type],
        ['Duration', `${lesson.durationMin} min`],
        ['Uploaded by', lesson.uploadedBy],
        ['Uploaded on', formatDate(lesson.uploadedOn)],
        ['Views', formatNumber(lesson.views)],
        ['Status', Badge(lesson.status)],
      ], { cols: 2 })),
    actions: (close) => frag(
      Button('Close', { variant: 'ghost', onClick: close }),
      Button('Download', { variant: 'secondary', icon: 'download', onClick: mockAction('Download resource') }),
      Button('Share with class', { variant: 'primary', icon: 'send', onClick: () => { close(); notify({ title: 'Shared with class', text: lesson.title, tone: 'success' }); } })),
  });
}

function videoPlayerMock(lesson, played = 32) {
  return h('div', { className: 'eng-player' },
    h('div', { className: 'eng-thumb-play' }, Icon('video', 20)),
    h('div', { className: 'eng-player-bar' },
      Icon('video', 16),
      h('span', { className: 't-xs t-num' }, `${Math.round((lesson.durationMin * played) / 100)}:00`),
      h('div', { className: 'eng-player-track' }, h('div', { className: 'eng-player-fill', style: { width: played + '%' } })),
      h('span', { className: 't-xs t-num' }, `${lesson.durationMin}:00`)));
}

const lmsRoutes = {
  'lms/courses': {
    title: 'Courses', subtitle: 'Course catalogue across classes and subjects', section: 'lms',
    render(mount, ctx) {
      injectStyles();
      const rows = coursesFor(ctx);
      if (ctx.param) {
        const course = byId(rows, ctx.param) || byId(db.courses, ctx.param);
        if (!course) return mount.appendChild(missingRecord('course', 'lms/courses'));
        return courseDetail(mount, ctx, course);
      }

      const published = rows.filter((r) => r.status === 'Published');
      const byLevel = sortBy(countBy(rows, 'className'), 'value', 'desc').slice(0, 12);
      let view = rows;

      const node = listPage({
        title: 'Course catalogue',
        subtitle: `${formatNumber(rows.length)} courses · ${formatNumber(published.length)} published · academic year 2026-27`,
        route: 'lms/courses',
        actions: [
          moreMenu(isLearner() ? [] : [{ label: 'Import course pack', icon: 'upload', onClick: mockAction('Import course pack') }]),
          !isLearner() && Button('Content approval', { variant: 'secondary', icon: 'check-circle', route: 'lms/content-approval' }),
          isLearner()
            ? Button('My study material', { variant: 'primary', icon: 'book-open', route: 'lms/study-material' })
            : Button('New course', { variant: 'primary', icon: 'plus', onClick: () => newCourseModal(rows) }),
        ].filter(Boolean),
        kpis: [
          { label: 'Courses', value: formatNumber(rows.length), icon: 'book-open', tone: 'brand', delta: 6.4, deltaLabel: 'vs last term' },
          { label: 'Published', value: formatNumber(published.length), icon: 'send', tone: 'success' },
          { label: 'Avg completion', value: `${Math.round(avg(rows, 'completionPct') || 0)}%`, icon: 'gauge', tone: 'info' },
          { label: 'Avg rating', value: (avg(rows, 'rating') || 0).toFixed(1), icon: 'star', tone: 'warning' },
        ],
        chart: chartOrEmpty(byLevel.map((r) => r.key), () => barChart({
          categories: byLevel.map((r) => r.key),
          series: [{ name: 'Courses', values: byLevel.map((r) => r.value) }],
          height: 220,
        }), 'Create a course to see the class distribution.'),
        chartTitle: 'Courses per class',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Course, subject or teacher…' },
          { id: 'className', label: 'Class', options: [...new Set(rows.map((r) => r.className))] },
          { id: 'subjectCode', label: 'Subject', options: [...new Set(rows.map((r) => r.subjectCode))] },
          { id: 'status', label: 'Status', options: ['Published', 'Draft', 'Archived'] },
        ],
        onFilter: (id, v, all, table) => {
          view = applyFilters(rows, all, {
            q: (r, t) => (r.title + r.teacherName + r.subjectCode).toLowerCase().includes(t.toLowerCase()),
            className: (r, v2) => r.className === v2,
            subjectCode: (r, v2) => r.subjectCode === v2,
            status: (r, v2) => r.status === v2,
          });
          table.refresh(view);
        },
        columns: [
          { key: 'title', label: 'Course', sticky: true, width: 300, render: (r) => Identity(r.title, `${r.subjectCode} · ${r.className}`), value: (r) => r.title },
          { key: 'teacherName', label: 'Teacher', width: 180, render: (r) => teacherLink(r.teacherName, r.teacherId), value: (r) => r.teacherName },
          { key: 'chapters', label: 'Chapters', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'lessons', label: 'Lessons', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'enrolled', label: 'Enrolled', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'completionPct', label: 'Completion', width: 180, render: (r) => progressCell(r.completionPct, r.completionPct >= 70 ? 'success' : r.completionPct >= 40 ? 'warning' : 'danger'), value: (r) => r.completionPct, aggregate: 'avg', format: (v) => `${Math.round(v)}%` },
          { key: 'rating', label: 'Rating', width: 130, render: (r) => Rating(r.rating, { showValue: true }), value: (r) => r.rating },
          { key: 'updatedAt', label: 'Updated', width: 130, render: (r) => relativeTime(r.updatedAt), value: (r) => r.updatedAt },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        selectable: true, footerAggregates: true,
        searchKeys: ['title', 'subjectCode', 'className', 'teacherName'],
        bulkActions: [
          { label: 'Publish', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} courses published`, tone: 'success' }) },
          { label: 'Archive', icon: 'archive', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} courses archived`, tone: 'warning' }) },
        ],
        rowActions: (r) => [
          { label: 'Open course', icon: 'eye', onClick: () => navigate(`lms/courses/${r.id}`) },
          { label: 'Upload content', icon: 'upload', onClick: mockAction('Upload content') },
          { label: 'Schedule live class', icon: 'video', route: 'lms/online-classes' },
          { separator: true },
          { label: 'Archive course', icon: 'archive', tone: 'danger', onClick: mockAction('Archive course') },
        ],
        onRowClick: (r) => navigate(`lms/courses/${r.id}`),
        emptyState: emptyFor('book-open', 'No courses yet', 'Create a course to publish chapters, lessons and assessments.',
          Button('New course', { variant: 'primary', icon: 'plus', onClick: () => newCourseModal(rows) })),
      });
      mount.appendChild(node);
    },
  },
};

function newCourseModal(rows) {
  formPage({
    title: 'New course', mode: 'modal', size: 'lg', submitLabel: 'Create course',
    sections: [{
      title: 'Course details', cols: 2,
      fields: [
        { id: 'title', label: 'Course title', required: true, span: 'full', placeholder: 'e.g. Mathematics — Class X' },
        { id: 'subject', label: 'Subject', type: 'select', required: true, options: [...new Set(db.subjects.map((s) => s.name))] },
        { id: 'className', label: 'Class', type: 'combobox', required: true, options: [...new Set(rows.map((r) => r.className))] },
        { id: 'teacher', label: 'Course teacher', type: 'combobox', required: true, options: db.staff.filter((s) => s.type === 'Teaching').slice(0, 80).map((s) => ({ value: s.id, label: s.name })) },
        { id: 'chapters', label: 'Planned chapters', type: 'number', value: 12 },
        { id: 'hours', label: 'Duration (hours)', type: 'number', value: 48 },
        { id: 'status', label: 'Publish immediately', type: 'switch', switchLabel: 'Visible to learners on save' },
        { id: 'desc', label: 'Description', type: 'textarea', span: 'full', placeholder: 'What does this course cover?' },
      ],
    }],
    onSubmit: (v) => notify({ title: 'Course created', text: v.title || 'New course', tone: 'success' }),
  });
}

/* ---------------------------------------------------- lms / chapters ---- */

function chapterRows(ctx) {
  warmStaff();
  const courses = coursesFor(ctx);
  const courseIds = new Set(courses.map((c) => c.id));
  const out = [];
  const grouped = groupBy(db.lessons.filter((l) => courseIds.has(l.courseId)), (l) => l.courseId + '|' + l.chapter);
  for (const [key, items] of grouped) {
    const [courseId, chapter] = key.split('|');
    const course = byId(db.courses, courseId);
    if (!course) continue;
    const approved = items.filter((i) => i.status === 'Approved').length;
    out.push({
      id: key.replace('|', '-'),
      courseId, chapter,
      courseTitle: course.title,
      className: course.className,
      subjectCode: course.subjectCode,
      teacherName: course.teacherName,
      teacherId: course.teacherId,
      topics: items.length,
      minutes: sum(items, 'durationMin'),
      videos: items.filter((i) => i.type === 'Video').length,
      views: sum(items, 'views'),
      approved,
      coverage: pct(approved, items.length),
      status: approved === items.length ? 'Approved' : approved === 0 ? 'Draft' : 'Partial',
      items,
    });
  }
  return out;
}

lmsRoutes['lms/chapters'] = {
  title: 'Chapters & Topics', subtitle: 'Chapter-wise content coverage across every course', section: 'lms',
  render(mount, ctx) {
    injectStyles();
    const rows = chapterRows(ctx);
    const bySubject = sortBy(sumBy(rows, 'subjectCode', 'topics'), 'value', 'desc').slice(0, 8);

    mount.appendChild(listPage({
      title: 'Chapters & topics',
      subtitle: `${formatNumber(rows.length)} chapters · ${formatNumber(sum(rows, 'topics'))} topics uploaded`,
      route: 'lms/chapters',
      actions: [
        moreMenu(),
        Button('Content approval', { variant: 'secondary', icon: 'check-circle', route: 'lms/content-approval' }),
        Button('Add chapter', { variant: 'primary', icon: 'plus', onClick: mockAction('Add chapter') }),
      ],
      kpis: [
        { label: 'Chapters', value: formatNumber(rows.length), icon: 'layers', tone: 'brand' },
        { label: 'Topics', value: formatNumber(sum(rows, 'topics')), icon: 'file-text', tone: 'info' },
        { label: 'Approved coverage', value: `${Math.round(avg(rows, 'coverage') || 0)}%`, icon: 'check-circle', tone: 'success' },
        { label: 'Video topics', value: formatNumber(sum(rows, 'videos')), icon: 'video', tone: 'warning' },
      ],
      chart: chartOrEmpty(bySubject.map((r) => r.key), () => barChart({
        categories: bySubject.map((r) => r.key),
        series: [{ name: 'Topics', values: bySubject.map((r) => r.value) }],
        height: 220,
      }), 'Upload lesson content to see subject coverage.'),
      chartTitle: 'Topics uploaded by subject',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Chapter or course…' },
        { id: 'className', label: 'Class', options: [...new Set(rows.map((r) => r.className))] },
        { id: 'subjectCode', label: 'Subject', options: [...new Set(rows.map((r) => r.subjectCode))] },
        { id: 'status', label: 'Status', options: ['Approved', 'Partial', 'Draft'] },
      ],
      onFilter: (id, v, all, table) => table.refresh(applyFilters(rows, all, {
        q: (r, t) => (r.chapter + r.courseTitle).toLowerCase().includes(t.toLowerCase()),
        className: (r, v2) => r.className === v2,
        subjectCode: (r, v2) => r.subjectCode === v2,
        status: (r, v2) => r.status === v2,
      })),
      columns: [
        { key: 'chapter', label: 'Chapter', sticky: true, width: 260, render: (r) => Identity(r.chapter, r.courseTitle), value: (r) => r.courseTitle + r.chapter },
        { key: 'className', label: 'Class', width: 110, filter: true },
        { key: 'subjectCode', label: 'Subject', width: 100, filter: true },
        { key: 'teacherName', label: 'Teacher', width: 170, render: (r) => teacherLink(r.teacherName, r.teacherId), value: (r) => r.teacherName },
        { key: 'topics', label: 'Topics', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'minutes', label: 'Minutes', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'views', label: 'Views', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'coverage', label: 'Approved', width: 180, render: (r) => progressCell(r.coverage, r.coverage === 100 ? 'success' : 'warning'), value: (r) => r.coverage },
        { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
      ],
      rows,
      selectable: true, footerAggregates: true, pageSize: 25,
      searchKeys: ['chapter', 'courseTitle', 'className', 'subjectCode'],
      expandable: (r) => h('div', { className: 'stack-2' },
        h('div', { className: 't-eyebrow' }, `Topics in ${r.chapter}`),
        r.items.map((l) => h('div', { className: 'row-3', style: { padding: 'var(--sp-1) 0' } },
          Icon(LESSON_ICONS[l.type] || 'file-text', 15),
          h('span', { className: 't-sm flex-1 min-0 t-truncate' }, l.title),
          h('span', { className: 't-xs t-muted t-num' }, `${l.durationMin} min`),
          Badge(l.status, { size: 'sm' })))),
      bulkActions: [
        { label: 'Send for approval', icon: 'check-circle', onClick: (sel) => notify({ title: `${sel.length} chapters sent for approval`, tone: 'success' }) },
      ],
      rowActions: (r) => [
        { label: 'Open course', icon: 'book-open', onClick: () => navigate(`lms/courses/${r.courseId}`) },
        { label: 'Add topic', icon: 'plus', onClick: mockAction('Add topic') },
        { label: 'Reorder topics', icon: 'sort', onClick: mockAction('Reorder topics') },
      ],
      onRowClick: (r) => navigate(`lms/courses/${r.courseId}`),
      emptyState: emptyFor('layers', 'No chapters uploaded', 'Upload lesson content to a course and chapters will appear here.'),
    }));
  },
};

/* ----------------------------------------------- lms / study-material ---- */

lmsRoutes['lms/study-material'] = {
  title: 'Study Material', subtitle: 'Notes, worksheets and presentations shared with learners', section: 'lms',
  render(mount, ctx) {
    injectStyles();
    warmStaff();
    const courseIds = new Set(coursesFor(ctx).map((c) => c.id));
    const rows = db.lessons.filter((l) => courseIds.has(l.courseId) && l.type !== 'Video');
    const split = countBy(rows, 'type');

    const uploadDrawer = () => Drawer({
      title: 'Upload study material', size: 'lg',
      body: h('div', { className: 'stack-4' },
        FileUpload({ label: 'Drop notes, worksheets or slides here', hint: 'PDF, DOCX, PPTX or XLSX · max 100 MB', multiple: true, onFiles: (f) => notify({ title: `${f.length} file(s) added`, tone: 'success' }) }),
        FormGrid({ cols: 2 },
          Field({ label: 'Course', required: true }, Combobox({ options: [...courseIds].slice(0, 120).map((id) => ({ value: id, label: (byId(db.courses, id) || {}).title })) })),
          Field({ label: 'Chapter', required: true }, Input({ placeholder: 'Chapter 4' })),
          Field({ label: 'Material type', required: true }, Select({ options: ['PDF Notes', 'Presentation', 'Worksheet', 'Quiz'] })),
          Field({ label: 'Visible from' }, DatePicker({ value: TODAY })),
          Field({ label: 'Title', className: 'col-span-full', required: true }, Input({ placeholder: 'Revision notes — Chapter 4' })))),
      actions: (close) => frag(
        Button('Cancel', { variant: 'ghost', onClick: close }),
        Button('Upload', { variant: 'primary', icon: 'upload', onClick: () => { close(); notify({ title: 'Material uploaded', text: 'Sent for approval.', tone: 'success' }); } })),
    });

    mount.appendChild(listPage({
      title: 'Study material library',
      subtitle: `${formatNumber(rows.length)} resources · ${formatNumber(sum(rows, 'views'))} downloads this session`,
      route: 'lms/study-material',
      actions: [
        moreMenu(isLearner() ? [] : [{ label: 'Bulk tag by chapter', icon: 'tag', onClick: mockAction('Bulk tag') }]),
        Button('Video lessons', { variant: 'secondary', icon: 'video', route: 'lms/video-lessons' }),
        !isLearner() && Button('Upload material', { variant: 'primary', icon: 'upload', onClick: uploadDrawer }),
      ].filter(Boolean),
      kpis: [
        { label: 'Resources', value: formatNumber(rows.length), icon: 'file-text', tone: 'brand' },
        { label: 'Downloads', value: formatNumber(sum(rows, 'views')), icon: 'download', tone: 'info', trend: analytics.sparks.library },
        { label: 'Pending approval', value: formatNumber(rows.filter((r) => r.status === 'Pending Approval').length), icon: 'clock', tone: 'warning' },
        { label: 'Storage used', value: `${Math.round(sum(rows, 'sizeMb') / 1024)} GB`, icon: 'database', tone: 'success' },
      ],
      chart: donutChart({
        data: split.map((s) => ({ key: s.key, value: s.value })),
        height: 240, centerLabel: 'Resources', centerValue: formatNumber(rows.length),
      }),
      chartTitle: 'Material mix by type',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Title, chapter or course…' },
        { id: 'type', label: 'Type', options: split.map((s) => s.key) },
        { id: 'status', label: 'Status', options: ['Approved', 'Pending Approval', 'Rejected'] },
      ],
      onFilter: (id, v, all, table) => table.refresh(applyFilters(rows, all, {
        q: (r, t) => (r.title + r.courseTitle + r.chapter).toLowerCase().includes(t.toLowerCase()),
        type: (r, v2) => r.type === v2,
        status: (r, v2) => r.status === v2,
      })),
      columns: [
        { key: 'title', label: 'Resource', sticky: true, width: 300, render: (r) => h('div', { className: 'row-3' }, Icon(LESSON_ICONS[r.type] || 'file-text', 16), Identity(r.title, `${r.courseTitle} · ${r.chapter}`)), value: (r) => r.title },
        { key: 'type', label: 'Type', width: 140, filter: true },
        { key: 'sizeMb', label: 'Size', width: 100, align: 'right', numeric: true, render: (r) => `${r.sizeMb} MB`, value: (r) => r.sizeMb, aggregate: 'sum', format: (v) => `${Math.round(v)} MB` },
        { key: 'views', label: 'Downloads', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'uploadedBy', label: 'Uploaded by', width: 170 },
        { key: 'uploadedOn', label: 'Uploaded', width: 130, render: (r) => formatDate(r.uploadedOn) },
        { key: 'status', label: 'Status', width: 160, filter: true, render: (r) => Badge(r.status) },
      ],
      rows,
      selectable: true, footerAggregates: true,
      searchKeys: ['title', 'courseTitle', 'chapter', 'uploadedBy'],
      bulkActions: [
        { label: 'Approve', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} resources approved`, tone: 'success' }) },
        { label: 'Share with class', icon: 'send', onClick: (sel) => notify({ title: `Shared ${sel.length} resources`, tone: 'success' }) },
        { label: 'Delete', icon: 'trash', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Delete ${sel.length} resources?`, tone: 'danger', confirmLabel: 'Delete' }).then((ok) => ok && notify({ title: 'Resources deleted', tone: 'danger' })) },
      ],
      rowActions: (r) => [
        { label: 'Preview', icon: 'eye', onClick: () => previewLesson(r) },
        { label: 'Download', icon: 'download', onClick: mockAction('Download') },
        { label: 'Open course', icon: 'book-open', onClick: () => navigate(`lms/courses/${r.courseId}`) },
        { separator: true },
        { label: 'Delete', icon: 'trash', tone: 'danger', onClick: mockAction('Delete resource') },
      ],
      onRowClick: (r) => previewLesson(r),
      emptyState: emptyFor('file-text', 'No study material yet', 'Upload notes or worksheets so learners can revise offline.',
        Button('Upload material', { variant: 'primary', icon: 'upload', onClick: uploadDrawer })),
    }));
  },
};

/* ------------------------------------------------ lms / video-lessons ---- */

lmsRoutes['lms/video-lessons'] = {
  title: 'Video Lessons', subtitle: 'Recorded lessons with watch analytics', section: 'lms',
  render(mount, ctx) {
    injectStyles();
    warmStaff();
    const courseIds = new Set(coursesFor(ctx).map((c) => c.id));
    const all = db.lessons.filter((l) => courseIds.has(l.courseId) && l.type === 'Video');
    let view = all.slice();
    let shown = 12;

    const gridHost = h('div', { className: 'eng-grid eng-grid-wide' });
    const moreHost = h('div', { className: 'row', style: { justifyContent: 'center' } });

    const paint = () => {
      gridHost.innerHTML = '';
      moreHost.innerHTML = '';
      if (!view.length) {
        gridHost.appendChild(h('div', { style: { gridColumn: '1 / -1' } },
          emptyFor('video', 'No videos match these filters', 'Clear a filter or upload a new recording to this course.')));
        return;
      }
      for (const l of view.slice(0, shown)) {
        gridHost.appendChild(h('article', {
          className: 'eng-tile', dataset: { clickable: '1' }, attrs: { tabindex: '0', 'aria-label': `Play ${l.title}` },
          onClick: () => openVideo(l),
          onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openVideo(l); } },
        },
          h('div', { className: 'eng-thumb', dataset: { tone: 'brand' } },
            h('div', { className: 'eng-thumb-play' }, Icon('video', 20)),
            h('span', { className: 'eng-thumb-badge t-num' }, `${l.durationMin}:00`)),
          h('div', { className: 't-medium t-clamp-2' }, l.title),
          h('div', { className: 't-xs t-muted t-truncate' }, `${l.courseTitle} · ${l.chapter}`),
          h('div', { className: 'row-3', style: { justifyContent: 'space-between' } },
            h('span', { className: 't-xs t-muted' }, `${formatNumber(l.views)} views`),
            Badge(l.status, { size: 'sm' }))));
      }
      if (view.length > shown) {
        moreHost.appendChild(Button(`Load ${Math.min(12, view.length - shown)} more of ${formatNumber(view.length)}`, {
          variant: 'secondary', icon: 'chevron-down', onClick: () => { shown += 12; paint(); },
        }));
      }
    };

    const openVideo = (l) => Drawer({
      title: l.title, subtitle: `${l.courseTitle} · ${l.chapter}`, size: 'xl',
      body: h('div', { className: 'stack-4' },
        videoPlayerMock(l),
        h('div', { className: 'row-3 row-wrap' },
          Button('Play', { variant: 'primary', icon: 'video', onClick: mockAction('Play video') }),
          Button('Download', { variant: 'secondary', icon: 'download', onClick: mockAction('Download video') }),
          Button('Copy link', { variant: 'ghost', icon: 'link', onClick: () => copyToClipboard(`https://lms.springdale.edu.in/v/${l.id}`, 'Video link copied') }),
          h('span', { className: 'spacer' }),
          Badge(l.status)),
        DescriptionList([
          ['Duration', `${l.durationMin} minutes`],
          ['File size', `${l.sizeMb} MB`],
          ['Uploaded by', l.uploadedBy],
          ['Uploaded on', formatDate(l.uploadedOn)],
          ['Views', formatNumber(l.views)],
          ['Average watch', `${Math.min(100, Math.round(52 + (l.views % 40)))}%`],
        ], { cols: 2 }),
        SectionCard({ title: 'Watch-through by segment', className: 'chart-card' },
          areaChart({
            categories: ['0%', '20%', '40%', '60%', '80%', '100%'],
            series: [{ name: 'Viewers', values: [l.views, Math.round(l.views * 0.86), Math.round(l.views * 0.71), Math.round(l.views * 0.58), Math.round(l.views * 0.44), Math.round(l.views * 0.31)] }],
            height: 200,
          })),
        SectionCard({ title: 'Chapter markers', icon: 'list' },
          h('div', { className: 'stack-2' },
            ['Introduction', 'Concept walkthrough', 'Worked example', 'Common mistakes', 'Recap & homework'].map((m, i) => h('div', { className: 'row-3' },
              h('span', { className: 't-xs t-num t-muted', style: { minWidth: '46px' } }, `${String(Math.floor((l.durationMin * i) / 5)).padStart(2, '0')}:00`),
              h('span', { className: 't-sm flex-1' }, m),
              IconButton('arrow-right', { label: `Jump to ${m}`, size: 'sm', onClick: mockAction('Seek') })))))),
      actions: (close) => frag(
        Button('Close', { variant: 'ghost', onClick: close }),
        Button('Share with class', { variant: 'primary', icon: 'send', onClick: () => { close(); notify({ title: 'Video shared', text: l.title, tone: 'success' }); } })),
    });

    paint();

    mount.appendChild(page({
      title: 'Video lessons',
      subtitle: `${formatNumber(all.length)} recordings · ${formatNumber(sum(all, 'views'))} total views`,
      route: 'lms/video-lessons',
      actions: [
        moreMenu(),
        Button('Study material', { variant: 'secondary', icon: 'file-text', route: 'lms/study-material' }),
        !isLearner() && Button('Upload video', { variant: 'primary', icon: 'upload', onClick: () => Drawer({
          title: 'Upload a video lesson', size: 'lg',
          body: h('div', { className: 'stack-4' },
            FileUpload({ label: 'Drop an MP4 or MOV file', hint: 'Up to 2 GB · 1080p recommended', onFiles: (f) => notify({ title: `${f.length} video queued`, tone: 'success' }) }),
            FormGrid({ cols: 2 },
              Field({ label: 'Title', required: true, className: 'col-span-full' }, Input({ placeholder: 'Chapter 5 — Quadratic Equations' })),
              Field({ label: 'Course', required: true }, Combobox({ options: [...courseIds].slice(0, 120).map((id) => ({ value: id, label: (byId(db.courses, id) || {}).title })) })),
              Field({ label: 'Chapter', required: true }, Input({ placeholder: 'Chapter 5' })),
              Field({ label: 'Allow download', hint: 'Learners can save the file offline' }, Switch('Downloadable', { checked: true })),
              Field({ label: 'Publish on' }, DatePicker({ value: TODAY })))),
          actions: (close) => frag(
            Button('Cancel', { variant: 'ghost', onClick: close }),
            Button('Upload', { variant: 'primary', icon: 'upload', onClick: () => { close(); notify({ title: 'Video uploaded', text: 'Processing will finish shortly.', tone: 'success' }); } })),
        }) }),
      ].filter(Boolean),
      children: [
        kpiRow([
          { label: 'Videos', value: formatNumber(all.length), icon: 'video', tone: 'brand' },
          { label: 'Total views', value: formatNumber(sum(all, 'views')), icon: 'eye', tone: 'info' },
          { label: 'Watch hours', value: formatNumber(Math.round(sum(all, 'durationMin') / 60)), icon: 'clock', tone: 'success' },
          { label: 'Awaiting approval', value: formatNumber(all.filter((v) => v.status === 'Pending Approval').length), icon: 'clock', tone: 'warning' },
        ]),
        Card({ className: 'p-0' }, FilterBar({
          filters: [
            { id: 'q', type: 'search', label: 'Search', placeholder: 'Video or course…', width: '280px' },
            { id: 'course', label: 'Course', options: [...new Set(all.map((l) => l.courseTitle))].slice(0, 60) },
            { id: 'status', label: 'Status', options: ['Approved', 'Pending Approval', 'Rejected'] },
            { id: 'sort', type: 'segment', options: [{ id: 'recent', label: 'Recent' }, { id: 'views', label: 'Most watched' }], value: 'recent' },
          ],
          onChange: (id, v, allV) => {
            view = applyFilters(all, allV, {
              q: (r, t) => (r.title + r.courseTitle).toLowerCase().includes(t.toLowerCase()),
              course: (r, v2) => r.courseTitle === v2,
              status: (r, v2) => r.status === v2,
            });
            view = allV.sort === 'views' ? sortBy(view, 'views', 'desc') : sortBy(view, 'uploadedOn', 'desc');
            shown = 12; paint();
          },
        })),
        SectionCard({ title: 'Most watched lessons', className: 'chart-card', subtitle: 'Views across the current session' },
          barChart({
            categories: sortBy(all, 'views', 'desc').slice(0, 10).map((l) => l.title.split(':')[0]),
            series: [{ name: 'Views', values: sortBy(all, 'views', 'desc').slice(0, 10).map((l) => l.views) }],
            horizontal: true, height: 280,
          })),
        SectionCard({ title: 'Library', subtitle: 'Click a card to open the player' }, gridHost, h('div', { className: 'mt-4' }, moreHost)),
      ],
    }));
  },
};

/* --------------------------------------------------- lms / homework ------ */

function homeworkRows(ctx) { warmStaff(); return scoped(db.homework, ctx); }

function homeworkForm(rows, isAssignment) {
  const rubric = [
    { id: 'r1', criterion: 'Understanding of concept', weight: 40 },
    { id: 'r2', criterion: 'Accuracy & method', weight: 30 },
    { id: 'r3', criterion: 'Presentation & neatness', weight: 20 },
    { id: 'r4', criterion: 'Submitted on time', weight: 10 },
  ];
  const rubricHost = h('div', { className: 'stack-2' });
  const paintRubric = () => {
    rubricHost.innerHTML = '';
    rubric.forEach((r, i) => {
      rubricHost.appendChild(h('div', { className: 'eng-rubric-row' },
        Input({ value: r.criterion, onInput: (v) => { r.criterion = v; } }),
        Input({ type: 'number', value: String(r.weight), numeric: true, suffix: '%', onInput: (v) => { r.weight = Number(v) || 0; } }),
        IconButton('trash', { label: `Remove criterion ${i + 1}`, size: 'sm', onClick: () => { rubric.splice(i, 1); paintRubric(); } })));
    });
    rubricHost.appendChild(h('div', { className: 'row mt-2' },
      Button('Add criterion', { variant: 'ghost', size: 'sm', icon: 'plus', onClick: () => { rubric.push({ id: 'r' + (rubric.length + 1), criterion: 'New criterion', weight: 10 }); paintRubric(); } }),
      h('span', { className: 'spacer' }),
      h('span', { className: 't-sm t-muted t-num' }, `Total weight ${rubric.reduce((a, b) => a + b.weight, 0)}%`)));
  };
  paintRubric();

  return {
    title: isAssignment ? 'New assignment' : 'New homework',
    subtitle: isAssignment ? 'Graded assignment with a rubric, attachments and a due date' : 'Daily homework for a class section',
    route: isAssignment ? 'lms/assignments' : 'lms/homework',
    mode: isAssignment ? 'page' : 'modal',
    size: 'lg',
    submitLabel: isAssignment ? 'Publish assignment' : 'Assign homework',
    sections: [
      {
        title: 'Assignment details', description: 'Learners see this on their portal the moment you publish.', cols: 2,
        fields: [
          { id: 'title', label: 'Title', required: true, span: 'full', placeholder: 'e.g. Trigonometry — Practice Set 3' },
          { id: 'subject', label: 'Subject', type: 'select', required: true, options: [...new Set(rows.map((r) => r.subjectName))].filter(Boolean) },
          { id: 'className', label: 'Class', type: 'combobox', required: true, options: [...new Set(rows.map((r) => r.className))] },
          { id: 'section', label: 'Sections', type: 'multiselect', options: ['A', 'B', 'C', 'D', 'E'], value: ['A'] },
          { id: 'assigned', label: 'Assigned on', type: 'date', value: TODAY, required: true },
          { id: 'due', label: 'Due date', type: 'date', required: true, validate: (v) => (v && v < TODAY ? 'Due date cannot be in the past' : null) },
          { id: 'maxMarks', label: 'Maximum marks', type: 'number', value: isAssignment ? 25 : 10, required: true, validate: validators.number },
          { id: 'desc', label: 'Instructions', type: 'textarea', span: 'full', required: true, placeholder: 'What must learners do? Mention the textbook pages, format and any references.' },
        ],
      },
      {
        title: 'Grading rubric', description: 'Weights are used by the grading screen to compute a total.',
        fields: [{ id: 'rubric', label: 'Criteria', type: 'custom', span: 'full', render: () => rubricHost }],
      },
      {
        title: 'Attachments & options', cols: 2,
        fields: [
          { id: 'files', label: 'Attachments', type: 'file', span: 'full', hint: 'Worksheets, reference PDFs or a sample answer sheet' },
          { id: 'late', label: 'Late submissions', type: 'switch', switchLabel: 'Allow submissions after the due date' },
          { id: 'notify', label: 'Notify parents', type: 'switch', switchLabel: 'Send an app notification when published', value: true },
          { id: 'plagiarism', label: 'Similarity check', type: 'switch', switchLabel: 'Run a similarity check on uploads' },
          { id: 'visible', label: 'Visible to', type: 'radio', inline: true, options: ['Whole class', 'Selected students'], value: 'Whole class' },
        ],
      },
    ],
    sidebar: [
      Callout({ tone: 'info', icon: 'lightbulb', title: 'Rubrics save grading time' },
        'Criteria defined here appear as sliders on the grading screen, and the weighted total is calculated for you.'),
      SectionCard({ title: 'Recent similar work', icon: 'history' },
        RankList(rows.slice(0, 5).map((r) => ({ name: r.title, meta: `${r.className}-${r.section}`, value: `${r.submitted}/${r.totalStudents}` })))),
    ],
    onSubmit: (v) => {
      notify({ title: isAssignment ? 'Assignment published' : 'Homework assigned', text: v.title || 'Untitled', tone: 'success' });
      if (isAssignment) navigate('lms/assignments');
    },
    onCancel: () => navigate(isAssignment ? 'lms/assignments' : 'lms/homework'),
  };
}

function homeworkListPage(cfg) {
  const { ctx, isAssignment } = cfg;
  const base = homeworkRows(ctx);
  const rows = isAssignment ? base.filter((r) => r.maxMarks >= 20) : base;
  const open = rows.filter((r) => r.status === 'Open');
  const trend = sortBy(rows, 'assignedDate').slice(-14);
  const label = isAssignment ? 'assignment' : 'homework';

  return listPage({
    title: isAssignment ? 'Assignments' : 'Homework',
    subtitle: `${formatNumber(rows.length)} ${label} items · ${formatNumber(open.length)} still open · ${formatNumber(sum(rows, 'pending'))} submissions pending`,
    route: isAssignment ? 'lms/assignments' : 'lms/homework',
    actions: [
      moreMenu(isLearner() ? [] : [{ label: 'Download rubric template', icon: 'download', onClick: mockAction('Download rubric template') }]),
      !isLearner() && Button('Submissions', { variant: 'secondary', icon: 'inbox', route: 'lms/submissions' }),
      isLearner()
        ? Button('My submissions', { variant: 'primary', icon: 'inbox', route: 'lms/submissions' })
        : isAssignment
          ? Button('New assignment', { variant: 'primary', icon: 'plus', route: 'lms/assignments/new' })
          : Button('Assign homework', { variant: 'primary', icon: 'plus', onClick: () => formPage(homeworkForm(base, false)) }),
    ].filter(Boolean),
    kpis: [
      { label: isAssignment ? 'Assignments' : 'Homework items', value: formatNumber(rows.length), icon: 'clipboard-list', tone: 'brand' },
      { label: 'Open now', value: formatNumber(open.length), icon: 'clock', tone: 'warning' },
      { label: 'Submission rate', value: `${pct(sum(rows, 'submitted'), sum(rows, 'totalStudents'))}%`, icon: 'inbox', tone: 'success' },
      { label: 'Awaiting grading', value: formatNumber(sum(rows, 'submitted') - sum(rows, 'graded')), icon: 'edit', tone: 'danger' },
    ],
    chart: chartOrEmpty(trend, () => comboChart({
      categories: trend.map((r) => formatDate(r.assignedDate, 'dayMonth')),
      bars: [{ name: 'Submitted', values: trend.map((r) => r.submitted) }, { name: 'Pending', values: trend.map((r) => r.pending) }],
      line: { name: 'Class strength', values: trend.map((r) => r.totalStudents) },
      stacked: true, height: 240,
    }), 'Assign work to see the submission flow.'),
    chartTitle: 'Submission flow — last 14 assignments',
    filters: [
      { id: 'q', type: 'search', label: 'Search', placeholder: 'Title or subject…' },
      { id: 'className', label: 'Class', options: [...new Set(rows.map((r) => r.className))] },
      { id: 'subjectName', label: 'Subject', options: [...new Set(rows.map((r) => r.subjectName))].filter(Boolean) },
      { id: 'status', label: 'Status', options: ['Open', 'Closed'] },
      { id: 'due', label: 'Due', type: 'date' },
    ],
    onFilter: (id, v, all, table) => table.refresh(applyFilters(rows, all, {
      q: (r, t) => (r.title + (r.subjectName || '')).toLowerCase().includes(t.toLowerCase()),
      className: (r, v2) => r.className === v2,
      subjectName: (r, v2) => r.subjectName === v2,
      status: (r, v2) => r.status === v2,
      due: (r, v2) => r.dueDate === v2,
    })),
    tabs: [
      { id: 'all', label: 'All', count: rows.length },
      { id: 'open', label: 'Open', count: open.length },
      { id: 'grading', label: 'Awaiting grading', count: rows.filter((r) => r.graded < r.submitted).length },
      { id: 'closed', label: 'Closed', count: rows.filter((r) => r.status === 'Closed').length },
    ],
    activeTab: 'all',
    onTabChange: (id) => notify({ title: `Showing ${id === 'all' ? 'all items' : id}`, tone: 'info' }),
    columns: [
      { key: 'title', label: isAssignment ? 'Assignment' : 'Homework', sticky: true, width: 300, render: (r) => Identity(r.title, `${r.className}-${r.section} · ${r.subjectName || r.subjectCode}`), value: (r) => r.title },
      { key: 'className', label: 'Class', width: 100, filter: true },
      { key: 'assignedDate', label: 'Assigned', width: 120, render: (r) => formatDate(r.assignedDate) },
      { key: 'dueDate', label: 'Due', width: 130, render: (r) => h('span', { className: new Date(r.dueDate) < DEMO_NOW && r.pending > 0 ? 't-danger t-medium' : '' }, formatDate(r.dueDate)), value: (r) => r.dueDate },
      { key: 'submitted', label: 'Submitted', width: 170, render: (r) => progressCell(pct(r.submitted, r.totalStudents), pct(r.submitted, r.totalStudents) >= 80 ? 'success' : 'warning'), value: (r) => r.submitted, aggregate: 'sum' },
      { key: 'pending', label: 'Pending', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'graded', label: 'Graded', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'maxMarks', label: 'Max marks', width: 110, align: 'right', numeric: true },
      { key: 'avgScore', label: 'Avg score', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => v.toFixed(1) },
      { key: 'status', label: 'Status', width: 110, filter: true, render: (r) => Badge(r.status) },
    ],
    rows,
    selectable: true, footerAggregates: true, pageSize: 25,
    searchKeys: ['title', 'className', 'subjectName'],
    expandable: (r) => h('div', { className: 'stack-3' },
      h('div', { className: 't-sm' }, r.description),
      h('div', { className: 'row-4 row-wrap' },
        Tag(`${r.attachments} attachment(s)`, { icon: 'paperclip' }),
        Tag(`Max ${r.maxMarks} marks`, { icon: 'percent' }),
        Tag(`Teacher: ${staffName(r.teacherId)}`, { icon: 'presentation' })),
      h('div', { className: 'row-3' },
        Button('Open submissions', { variant: 'secondary', size: 'sm', icon: 'inbox', onClick: () => navigate('lms/submissions', { hw: r.id }) }),
        Button('Send reminder', { variant: 'ghost', size: 'sm', icon: 'bell', onClick: () => notify({ title: `Reminder sent to ${r.pending} learners`, tone: 'success' }) }))),
    bulkActions: [
      { label: 'Send reminder', icon: 'bell', onClick: (sel) => notify({ title: `Reminders sent for ${sel.length} items`, tone: 'success' }) },
      { label: 'Close', icon: 'lock', onClick: (sel) => notify({ title: `${sel.length} items closed`, tone: 'warning' }) },
      { label: 'Delete', icon: 'trash', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Delete ${sel.length} items?`, text: 'Learner submissions will also be removed.', tone: 'danger', confirmLabel: 'Delete' }).then((ok) => ok && notify({ title: 'Deleted', tone: 'danger' })) },
    ],
    rowActions: (r) => [
      { label: 'View submissions', icon: 'inbox', onClick: () => navigate('lms/submissions', { hw: r.id }) },
      { label: 'Edit', icon: 'edit', onClick: mockAction('Edit item') },
      { label: 'Send reminder', icon: 'bell', onClick: () => notify({ title: `Reminder sent to ${r.pending} learners`, tone: 'success' }) },
      { separator: true },
      { label: 'Delete', icon: 'trash', tone: 'danger', onClick: mockAction('Delete item') },
    ],
    onRowClick: (r) => navigate('lms/submissions', { hw: r.id }),
    emptyState: emptyFor('clipboard-list', `No ${label} yet`, `Create your first ${label} and learners will see it instantly.`),
  });
}

lmsRoutes['lms/homework'] = {
  title: 'Homework', subtitle: 'Daily homework assigned to class sections', section: 'lms',
  render(mount, ctx) { injectStyles(); mount.appendChild(homeworkListPage({ ctx, isAssignment: false })); },
};

lmsRoutes['lms/assignments'] = {
  title: 'Assignments', subtitle: 'Graded assignments with rubrics and attachments', section: 'lms',
  render(mount, ctx) {
    injectStyles();
    if (ctx.param === 'new') {
      return mount.appendChild(formPage(homeworkForm(homeworkRows(ctx), true)));
    }
    mount.appendChild(homeworkListPage({ ctx, isAssignment: true }));
  },
};

/* ------------------------------------------------- lms / submissions ---- */

const RUBRIC = [
  { id: 'concept', label: 'Understanding of concept', weight: 40, hint: 'Does the answer show the underlying idea?' },
  { id: 'accuracy', label: 'Accuracy & method', weight: 30, hint: 'Correct steps, units and final answer.' },
  { id: 'presentation', label: 'Presentation & neatness', weight: 20, hint: 'Legible, labelled and well organised.' },
  { id: 'timeliness', label: 'Timeliness', weight: 10, hint: 'Submitted before the deadline.' },
];

function submissionsFor(ctx) { warmStaff(); return scoped(db.submissions, ctx); }

/** The grading screen — submission preview beside a rubric scorer. */
function gradingScreen(mount, ctx, sub) {
  const hw = byId(db.homework, sub.homeworkId) || {};
  const siblings = db.submissions.filter((s) => s.homeworkId === sub.homeworkId);
  const index = siblings.findIndex((s) => s.id === sub.id);
  const prev = siblings[index - 1];
  const next = siblings[index + 1];
  const maxMarks = sub.maxMarks || hw.maxMarks || 10;

  const seed = rngFor(sub.id);
  const scores = {};
  for (const c of RUBRIC) scores[c.id] = sub.marks != null ? Math.max(1, Math.min(5, Math.round((sub.marks / maxMarks) * 5))) : intBetween(seed, 3, 5);

  const totalHost = h('div', { className: 'stack-1' });
  const paintTotal = () => {
    const weighted = RUBRIC.reduce((acc, c) => acc + (scores[c.id] / 5) * c.weight, 0);
    const marks = Math.round((weighted / 100) * maxMarks * 10) / 10;
    totalHost.innerHTML = '';
    totalHost.appendChild(h('div', { className: 'row-4', style: { alignItems: 'center' } },
      RadialProgress(Math.round(weighted), { size: 96, thickness: 9, tone: weighted >= 75 ? 'success' : weighted >= 50 ? 'warning' : 'danger', label: `${Math.round(weighted)}%`, sublabel: 'weighted' }),
      h('div', { className: 'stack-1 flex-1' },
        h('div', { className: 't-eyebrow' }, 'Awarded marks'),
        h('div', { className: 't-display t-num' }, `${marks} / ${maxMarks}`),
        h('div', { className: 't-sm t-muted' }, `Grade band ${weighted >= 90 ? 'A1' : weighted >= 80 ? 'A2' : weighted >= 70 ? 'B1' : weighted >= 60 ? 'B2' : weighted >= 50 ? 'C1' : 'C2'}`))));
  };

  const rubricHost = h('div', null);
  for (const c of RUBRIC) {
    const valueLabel = h('span', { className: 't-sm t-num t-medium', style: { minWidth: '46px', textAlign: 'right' } }, `${scores[c.id]}/5`);
    rubricHost.appendChild(h('div', { className: 'eng-rubric-row' },
      h('div', { className: 'min-0' },
        h('div', { className: 't-sm t-medium' }, c.label),
        h('div', { className: 't-xs t-muted' }, `${c.hint} · weight ${c.weight}%`)),
      h('div', { className: 'row', style: { gap: 'var(--sp-1)' } },
        [1, 2, 3, 4, 5].map((n) => h('button', {
          type: 'button', className: 'btn btn-subtle', dataset: { size: 'sm' },
          style: { minWidth: '30px', padding: '0 var(--sp-2)' },
          attrs: { 'aria-label': `${c.label}: score ${n} of 5`, 'aria-pressed': String(scores[c.id] === n) },
          onClick: (e) => {
            scores[c.id] = n;
            valueLabel.textContent = `${n}/5`;
            [...e.currentTarget.parentNode.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i + 1 === n)));
            [...e.currentTarget.parentNode.children].forEach((b, i) => { b.className = i + 1 <= n ? 'btn btn-primary' : 'btn btn-subtle'; b.dataset.size = 'sm'; });
            paintTotal();
          },
        }, String(n)))),
      valueLabel));
  }
  paintTotal();

  const feedback = Textarea({
    rows: 5, value: sub.feedback || '',
    placeholder: 'What did the learner do well, and what is the single most useful thing to improve next time?',
  });

  const quickPhrases = ['Excellent work!', 'Show all working steps.', 'Revise question 4.', 'Improve neatness.', 'Good improvement since last week.'];

  const save = (returnToLearner) => {
    ConfirmDialog({
      title: returnToLearner ? 'Return graded work?' : 'Save grade?',
      text: returnToLearner
        ? 'The learner and their parent will be notified with the marks and your feedback.'
        : 'The grade is saved but not yet visible to the learner.',
      confirmLabel: returnToLearner ? 'Return to learner' : 'Save grade',
      tone: 'brand', icon: 'check-circle',
    }).then((ok) => {
      if (!ok) return;
      notify({ title: returnToLearner ? 'Graded work returned' : 'Grade saved', text: sub.studentName, tone: 'success' });
      if (next) navigate(`lms/submissions/${next.id}`);
    });
  };

  mount.appendChild(page({
    title: `Grading — ${sub.studentName}`,
    subtitle: `${hw.title || sub.homeworkTitle} · ${sub.className}-${sub.section} · submission ${index + 1} of ${siblings.length}`,
    route: 'lms/submissions',
    actions: [
      Button('Back to queue', { variant: 'ghost', icon: 'arrow-left', route: 'lms/submissions' }),
      prev && Button('Previous', { variant: 'secondary', icon: 'chevron-left', onClick: () => navigate(`lms/submissions/${prev.id}`) }),
      next && Button('Next', { variant: 'secondary', iconRight: 'chevron-right', onClick: () => navigate(`lms/submissions/${next.id}`) }),
      Button('Save & return', { variant: 'primary', icon: 'check', onClick: () => save(true) }),
    ].filter(Boolean),
    children: [
      h('div', { className: 'detail-split' },
        h('div', { className: 'stack' },
          SectionCard({
            title: 'Submission', icon: 'inbox',
            subtitle: sub.submittedOn ? `Submitted ${formatDate(sub.submittedOn)} ${sub.late ? '· late' : '· on time'}` : 'Not submitted',
            actions: h('div', { className: 'row' }, Badge(sub.status), sub.late && Badge('Late', { tone: 'warning' })),
          },
            sub.submittedOn ? h('div', { className: 'stack-3' },
              h('div', { className: 'eng-thumb', style: { aspectRatio: '4/3' } },
                h('div', { className: 'stack-2', style: { alignItems: 'center' } },
                  Icon('file-text', 40),
                  h('div', { className: 't-sm t-muted' }, sub.attachment || 'submission.pdf'),
                  h('div', { className: 't-xs t-faint' }, 'Page 1 of 3 · handwritten scan'))),
              h('div', { className: 'row-3 row-wrap' },
                Button('Open full size', { variant: 'secondary', size: 'sm', icon: 'maximize', onClick: mockAction('Open attachment') }),
                Button('Download', { variant: 'ghost', size: 'sm', icon: 'download', onClick: mockAction('Download submission') }),
                Button('Similarity report', { variant: 'ghost', size: 'sm', icon: 'scan', onClick: mockAction('Similarity report') }),
                h('span', { className: 'spacer' }),
                h('span', { className: 't-xs t-muted' }, 'Similarity 4% · below threshold')))
              : emptyFor('inbox', 'Nothing submitted yet',
                `${sub.studentName} has not uploaded work for this ${hw.status === 'Closed' ? 'closed' : 'open'} assignment.`,
                Button('Send reminder', { variant: 'primary', icon: 'bell', onClick: () => notify({ title: 'Reminder sent', text: sub.studentName, tone: 'success' }) }))),
          SectionCard({ title: 'Rubric', icon: 'scale', subtitle: 'Score each criterion from 1 to 5 — the weighted total updates live' },
            rubricHost,
            h('div', { className: 'mt-4' }, totalHost)),
          SectionCard({ title: 'Feedback to learner', icon: 'message-circle' },
            h('div', { className: 'stack-3' },
              feedback,
              h('div', { className: 'row-3 row-wrap' },
                h('span', { className: 't-xs t-muted' }, 'Quick phrases:'),
                quickPhrases.map((p) => Pill(p, { onClick: () => { feedback.value = (feedback.value ? feedback.value + ' ' : '') + p; feedback.focus(); } }))),
              FormActions(
                Button('Save draft', { variant: 'ghost', icon: 'save', onClick: () => save(false) }),
                Button('Save & return to learner', { variant: 'primary', icon: 'send', onClick: () => save(true) }))))),
        h('div', { className: 'stack-3' },
          SectionCard({ title: 'Learner', icon: 'user' },
            h('div', { className: 'row-3' },
              Avatar(sub.studentName, { size: 'lg' }),
              h('div', { className: 'flex-1 min-0' },
                h('button', { type: 'button', className: 'btn btn-link', style: { padding: 0, height: 'auto' }, onClick: () => navigate(`students/profile/${sub.studentId}`) }, sub.studentName),
                h('div', { className: 't-sm t-muted' }, `${sub.className}-${sub.section}`))),
            h('div', { className: 'mt-3' },
              MetricRow('Submissions this term', formatNumber(db.submissions.filter((s) => s.studentId === sub.studentId).length)),
              MetricRow('On-time rate', `${pct(db.submissions.filter((s) => s.studentId === sub.studentId && s.submittedOn && !s.late).length, Math.max(1, db.submissions.filter((s) => s.studentId === sub.studentId).length))}%`),
              MetricRow('Average marks', `${Math.round(avg(db.submissions.filter((s) => s.studentId === sub.studentId && s.marks != null), 'marks') || 0)}`))),
          SectionCard({ title: 'Assignment', icon: 'clipboard-list' },
            DescriptionList([
              ['Title', hw.title || sub.homeworkTitle],
              ['Subject', hw.subjectName || '—'],
              ['Assigned', hw.assignedDate ? formatDate(hw.assignedDate) : '—'],
              ['Due', hw.dueDate ? formatDate(hw.dueDate) : '—'],
              ['Max marks', String(maxMarks)],
              ['Class average', hw.avgScore != null ? String(hw.avgScore) : '—'],
            ])),
          SectionCard({ title: 'Grading queue', icon: 'inbox', subtitle: `${siblings.filter((s) => s.status === 'Submitted').length} still awaiting a grade` },
            h('div', { className: 'stack-1' },
              siblings.slice(0, 10).map((s) => h('button', {
                type: 'button', className: 'menu-item',
                style: s.id === sub.id ? { background: 'var(--surface-selected)' } : null,
                onClick: () => navigate(`lms/submissions/${s.id}`),
              },
                Avatar(s.studentName, { size: 'xs' }),
                h('span', { className: 'flex-1 t-truncate t-sm' }, s.studentName),
                Badge(s.status, { size: 'sm' })))))),
      ),
    ],
  }));
}

lmsRoutes['lms/submissions'] = {
  title: 'Submissions', subtitle: 'Every learner submission with grading status', section: 'lms',
  render(mount, ctx) {
    injectStyles();
    const all = submissionsFor(ctx);
    if (ctx.param) {
      const sub = byId(db.submissions, ctx.param);
      if (!sub) return mount.appendChild(missingRecord('submission', 'lms/submissions'));
      return gradingScreen(mount, ctx, sub);
    }

    const hwFilter = ctx.query && ctx.query.hw;
    const rows = hwFilter ? all.filter((s) => s.homeworkId === hwFilter) : all;
    const hw = hwFilter ? byId(db.homework, hwFilter) : null;
    const graded = rows.filter((r) => r.status === 'Graded');
    const awaiting = rows.filter((r) => r.status === 'Submitted');
    const counts = statusCounts(rows);

    mount.appendChild(listPage({
      title: hw ? `Submissions — ${hw.title}` : 'Submissions',
      subtitle: hw
        ? `${hw.className}-${hw.section} · due ${formatDate(hw.dueDate)} · max ${hw.maxMarks} marks`
        : `${formatNumber(rows.length)} submissions · ${formatNumber(awaiting.length)} awaiting a grade`,
      route: 'lms/submissions',
      actions: [
        moreMenu([{ label: 'Download all attachments', icon: 'download', onClick: mockAction('Download attachments') }]),
        hw && Button('Back to all', { variant: 'ghost', icon: 'arrow-left', route: 'lms/submissions' }),
        awaiting.length
          ? Button('Start grading', { variant: 'primary', icon: 'edit', onClick: () => navigate(`lms/submissions/${awaiting[0].id}`) })
          : Button('Assign homework', { variant: 'primary', icon: 'plus', route: 'lms/homework' }),
      ].filter(Boolean),
      kpis: [
        { label: 'Submissions', value: formatNumber(rows.length), icon: 'inbox', tone: 'brand' },
        { label: 'Graded', value: formatNumber(graded.length), icon: 'check-circle', tone: 'success' },
        { label: 'Awaiting grading', value: formatNumber(awaiting.length), icon: 'clock', tone: 'warning' },
        { label: 'Missed', value: formatNumber(counts.get('Missed') || 0), icon: 'alert-circle', tone: 'danger' },
      ],
      chart: chartOrEmpty([...counts.keys()], () => barChart({
        categories: [...counts.keys()],
        series: [{ name: 'Submissions', values: [...counts.values()] }],
        height: 210, showValues: true,
      }), 'Submissions appear here once learners upload their work.'),
      chartTitle: 'Submission status breakdown',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Learner or assignment…' },
        { id: 'className', label: 'Class', options: [...new Set(rows.map((r) => r.className))] },
        { id: 'status', label: 'Status', options: ['Submitted', 'Graded', 'Pending', 'Missed'] },
        { id: 'late', label: 'Timeliness', options: [{ value: 'late', label: 'Late only' }, { value: 'ontime', label: 'On time only' }] },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(rows, allV, {
        q: (r, t) => (r.studentName + r.homeworkTitle).toLowerCase().includes(t.toLowerCase()),
        className: (r, v2) => r.className === v2,
        status: (r, v2) => r.status === v2,
        late: (r, v2) => (v2 === 'late' ? !!r.late : !r.late),
      })),
      columns: [
        { key: 'studentName', label: 'Learner', sticky: true, width: 240, render: (r) => Identity(r.studentName, `${r.className}-${r.section}`), value: (r) => r.studentName },
        { key: 'homeworkTitle', label: 'Assignment', width: 280, render: (r) => h('span', { className: 't-truncate' }, r.homeworkTitle) },
        { key: 'submittedOn', label: 'Submitted', width: 140, render: (r) => (r.submittedOn ? h('span', null, formatDate(r.submittedOn), r.late ? h('span', { className: 't-xs t-danger' }, ' · late') : null) : h('span', { className: 't-muted' }, '—')), value: (r) => r.submittedOn || '' },
        { key: 'marks', label: 'Marks', width: 110, align: 'right', numeric: true, render: (r) => (r.marks != null ? `${r.marks} / ${r.maxMarks}` : '—'), value: (r) => (r.marks == null ? -1 : r.marks) },
        { key: 'feedback', label: 'Feedback', width: 240, render: (r) => h('span', { className: 't-sm t-muted t-clamp-2' }, r.feedback || 'No feedback yet') },
        { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
      ],
      rows,
      selectable: true, pageSize: 25,
      searchKeys: ['studentName', 'homeworkTitle', 'className'],
      bulkActions: [
        { label: 'Mark as graded', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} submissions marked graded`, tone: 'success' }) },
        { label: 'Send reminder', icon: 'bell', onClick: (sel) => notify({ title: `Reminder sent to ${sel.length} learners`, tone: 'success' }) },
        { label: 'Export marks', icon: 'download', onClick: (sel) => notify({ title: `${sel.length} rows exported`, tone: 'info' }) },
      ],
      rowActions: (r) => [
        { label: 'Grade submission', icon: 'edit', onClick: () => navigate(`lms/submissions/${r.id}`) },
        { label: 'Open learner profile', icon: 'user', onClick: () => navigate(`students/profile/${r.studentId}`) },
        { label: 'Message parent', icon: 'send', route: 'communication/compose' },
      ],
      onRowClick: (r) => navigate(`lms/submissions/${r.id}`),
      emptyState: emptyFor('inbox', 'No submissions yet', 'Once learners upload their work it will land here for grading.'),
    }));
  },
};

/* --------------------------------------------- lms / online-classes ------ */

lmsRoutes['lms/online-classes'] = {
  title: 'Online Classes', subtitle: 'Live sessions with join links and attendance', section: 'lms',
  render(mount, ctx) {
    injectStyles();
    warmStaff();
    const rows = scoped(db.onlineClasses, ctx);
    const upcoming = sortBy(rows.filter((r) => r.status === 'Scheduled'), 'date').slice(0, 6);
    const completed = rows.filter((r) => r.status === 'Completed');
    const byPlatform = countBy(rows, 'platform');

    const scheduleModal = () => formPage({
      title: 'Schedule an online class', mode: 'modal', size: 'lg', submitLabel: 'Schedule & notify',
      sections: [{
        title: 'Session', cols: 2,
        fields: [
          { id: 'title', label: 'Session title', required: true, span: 'full', placeholder: 'Mathematics Live — Doubt Session' },
          { id: 'course', label: 'Course', type: 'combobox', required: true, options: db.courses.slice(0, 120).map((c) => ({ value: c.id, label: c.title })) },
          { id: 'teacher', label: 'Host', type: 'combobox', required: true, options: db.staff.filter((s) => s.type === 'Teaching').slice(0, 80).map((s) => ({ value: s.id, label: s.name })) },
          { id: 'date', label: 'Date', type: 'date', required: true, value: TODAY },
          { id: 'time', label: 'Start time', type: 'time', required: true, value: '10:00' },
          { id: 'duration', label: 'Duration (minutes)', type: 'number', value: 45, required: true },
          { id: 'platform', label: 'Platform', type: 'select', options: ['Zoom', 'Google Meet', 'MS Teams', 'In-app'], required: true },
          { id: 'record', label: 'Recording', type: 'switch', switchLabel: 'Record the session for later viewing', value: true },
          { id: 'notify', label: 'Notify', type: 'switch', switchLabel: 'Send a push notification to learners', value: true },
        ],
      }],
      onSubmit: (v) => notify({ title: 'Class scheduled', text: v.title || 'Online class', tone: 'success' }),
    });

    mount.appendChild(page({
      title: 'Online classes',
      subtitle: `${formatNumber(rows.length)} sessions · ${formatNumber(upcoming.length)} coming up · avg attendance ${pct(sum(completed, 'attended'), Math.max(1, sum(completed, 'enrolled')))}%`,
      route: 'lms/online-classes',
      actions: [
        moreMenu([{ label: 'Sync with timetable', icon: 'calendar', onClick: mockAction('Sync timetable') }]),
        Button('Recordings', { variant: 'secondary', icon: 'video', route: 'lms/video-lessons' }),
        !isLearner() && Button('Schedule class', { variant: 'primary', icon: 'calendar-plus', onClick: scheduleModal }),
      ].filter(Boolean),
      children: [
        kpiRow([
          { label: 'Sessions', value: formatNumber(rows.length), icon: 'video', tone: 'brand' },
          { label: 'Upcoming', value: formatNumber(rows.filter((r) => r.status === 'Scheduled').length), icon: 'calendar-check', tone: 'info' },
          { label: 'Avg attendance', value: `${pct(sum(completed, 'attended'), Math.max(1, sum(completed, 'enrolled')))}%`, icon: 'clipboard-check', tone: 'success' },
          { label: 'Recordings available', value: formatNumber(rows.filter((r) => r.recordingAvailable).length), icon: 'archive', tone: 'warning' },
        ]),
        SectionCard({
          title: 'Next sessions', icon: 'calendar-check',
          subtitle: 'Join opens 10 minutes before the scheduled start',
          actions: Button('View all', { variant: 'link', size: 'sm', onClick: () => document.getElementById('oc-table')?.scrollIntoView({ behavior: 'smooth' }) }),
        },
          upcoming.length ? h('div', { className: 'eng-grid eng-grid-wide' },
            upcoming.map((c) => h('article', { className: 'eng-tile' },
              h('div', { className: 'row-3', style: { justifyContent: 'space-between' } },
                Badge(c.platform, { tone: 'info', icon: 'video' }),
                h('span', { className: 't-xs t-muted t-num' }, `${formatDate(c.date, 'dayMonth')} · ${c.startTime}`)),
              h('div', { className: 't-medium t-clamp-2' }, c.title),
              h('div', { className: 't-xs t-muted' }, `${c.className} · ${c.subjectName} · ${c.durationMin} min`),
              h('div', { className: 'row-3' },
                Avatar(c.teacherName, { size: 'xs' }),
                h('span', { className: 't-xs t-truncate flex-1' }, c.teacherName),
                h('span', { className: 't-xs t-muted t-num' }, `${c.enrolled} enrolled`)),
              h('div', { className: 'row-3' },
                Button('Join now', { variant: 'primary', size: 'sm', icon: 'video', block: true, onClick: () => notify({ title: 'Opening meeting…', text: `${c.platform} · ${c.title}`, tone: 'info' }) }),
                IconButton('link', { label: 'Copy join link', size: 'sm', bordered: true, onClick: () => copyToClipboard(`https://meet.springdale.edu.in/${c.id}`, 'Join link copied') }),
                IconButton('bell', { label: 'Remind learners', size: 'sm', bordered: true, onClick: () => notify({ title: 'Reminder queued', text: `${c.enrolled} learners`, tone: 'success' }) })))))
            : emptyFor('video', 'No upcoming sessions', 'Schedule a live class and learners will see a join button on their portal.',
              Button('Schedule class', { variant: 'primary', icon: 'calendar-plus', onClick: scheduleModal }))),
        h('div', { className: 'widget-grid' },
          h('div', { className: 'span-8' }, SectionCard({ title: 'Attendance vs enrolment', className: 'chart-card', subtitle: 'Completed sessions, most recent first' },
            comboChart({
              categories: sortBy(completed, 'date', 'desc').slice(0, 12).reverse().map((c) => formatDate(c.date, 'dayMonth')),
              bars: [{ name: 'Attended', values: sortBy(completed, 'date', 'desc').slice(0, 12).reverse().map((c) => c.attended) }],
              line: { name: 'Enrolled', values: sortBy(completed, 'date', 'desc').slice(0, 12).reverse().map((c) => c.enrolled) },
              height: 260,
            }))),
          h('div', { className: 'span-4' }, SectionCard({ title: 'Platform mix', className: 'chart-card' },
            donutChart({ data: byPlatform.map((p) => ({ key: p.key, value: p.value })), height: 240, centerLabel: 'Sessions', centerValue: formatNumber(rows.length) })))),
        h('div', { id: 'oc-table' }, SectionCard({ title: 'All sessions', flush: true },
          DataTable({
            columns: [
              { key: 'title', label: 'Session', sticky: true, width: 260, render: (r) => Identity(r.title, `${r.className} · ${r.subjectName}`), value: (r) => r.title },
              { key: 'teacherName', label: 'Host', width: 170, render: (r) => teacherLink(r.teacherName, r.teacherId), value: (r) => r.teacherName },
              { key: 'date', label: 'Date', width: 120, render: (r) => formatDate(r.date) },
              { key: 'startTime', label: 'Time', width: 90 },
              { key: 'durationMin', label: 'Duration', width: 100, align: 'right', numeric: true, render: (r) => `${r.durationMin} min`, value: (r) => r.durationMin },
              { key: 'platform', label: 'Platform', width: 130, filter: true },
              { key: 'attended', label: 'Attendance', width: 170, render: (r) => progressCell(pct(r.attended, r.enrolled), pct(r.attended, r.enrolled) >= 75 ? 'success' : 'warning'), value: (r) => r.attended },
              { key: 'recordingAvailable', label: 'Recording', width: 120, render: (r) => (r.recordingAvailable ? Badge('Available', { tone: 'success' }) : h('span', { className: 't-muted' }, '—')), value: (r) => (r.recordingAvailable ? 1 : 0) },
              { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
            ],
            rows, selectable: true, pageSize: 25,
            searchKeys: ['title', 'className', 'teacherName', 'platform'],
            exportName: 'online-classes',
            bulkActions: [{ label: 'Send reminder', icon: 'bell', onClick: (sel) => notify({ title: `Reminder queued for ${sel.length} sessions`, tone: 'success' }) }],
            rowActions: (r) => [
              { label: 'Join / open', icon: 'video', onClick: mockAction('Join session') },
              { label: 'Copy join link', icon: 'link', onClick: () => copyToClipboard(`https://meet.springdale.edu.in/${r.id}`, 'Join link copied') },
              { label: 'Open course', icon: 'book-open', onClick: () => navigate(`lms/courses/${r.courseId}`) },
              { separator: true },
              { label: 'Cancel session', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: 'Cancel this session?', text: 'Enrolled learners will be notified immediately.', tone: 'danger', confirmLabel: 'Cancel session' }).then((ok) => ok && notify({ title: 'Session cancelled', tone: 'danger' })) },
            ],
            emptyState: emptyFor('video', 'No online classes', 'Schedule your first live session.'),
          }))),
      ],
    }));
  },
};

/* ----------------------------------------------- lms / online-tests ------ */

function testBuilder(mount, ctx) {
  const bank = db.questionBank;
  let picked = [];
  let filtered = bank.slice();

  const summaryHost = h('div', { className: 'stack-2' });
  const pickedHost = h('div', { className: 'stack-1' });
  const bankHost = h('div', null);

  const paintSummary = () => {
    const marks = picked.reduce((a, q) => a + q.marks, 0);
    const diff = countBy(picked, 'difficulty');
    summaryHost.innerHTML = '';
    summaryHost.appendChild(h('div', { className: 'row-4' },
      h('div', { className: 'stack-1' },
        h('div', { className: 't-eyebrow' }, 'Questions'),
        h('div', { className: 't-display t-num' }, String(picked.length))),
      h('div', { className: 'stack-1' },
        h('div', { className: 't-eyebrow' }, 'Total marks'),
        h('div', { className: 't-display t-num' }, String(marks)))));
    summaryHost.appendChild(picked.length
      ? stackedProgressBar({ segments: diff.map((d, i) => ({ label: d.key, value: d.value, color: seriesColor(i) })), barHeight: 10, showLegend: true })
      : h('div', { className: 't-sm t-muted' }, 'Pick questions from the bank to build the paper.'));
  };

  const paintPicked = () => {
    pickedHost.innerHTML = '';
    if (!picked.length) {
      pickedHost.appendChild(emptyFor('database', 'No questions selected', 'Use “Add” on any bank question to build your paper.'));
    } else {
      picked.forEach((q, i) => {
        pickedHost.appendChild(h('div', { className: 'row-3', style: { padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--border-subtle)' } },
          h('span', { className: 't-xs t-num t-muted', style: { minWidth: '22px' } }, `${i + 1}.`),
          h('div', { className: 'flex-1 min-0' },
            h('div', { className: 't-sm t-clamp-2' }, q.text),
            h('div', { className: 't-xs t-muted' }, `${q.subjectName} · ${q.type} · ${q.difficulty} · ${q.marks} mark(s)`)),
          IconButton('x', { label: `Remove question ${i + 1}`, size: 'sm', onClick: () => { picked.splice(i, 1); paintPicked(); paintSummary(); } })));
      });
    }
    paintSummary();
  };

  const paintBank = () => {
    bankHost.innerHTML = '';
    bankHost.appendChild(DataTable({
      columns: [
        { key: 'text', label: 'Question', sticky: true, width: 340, render: (r) => h('div', { className: 't-sm t-clamp-2' }, r.text) },
        { key: 'subjectName', label: 'Subject', width: 140, filter: true },
        { key: 'classLevel', label: 'Level', width: 80, align: 'right', numeric: true },
        { key: 'type', label: 'Type', width: 140, filter: true },
        { key: 'difficulty', label: 'Difficulty', width: 110, filter: true, render: (r) => Badge(r.difficulty, { tone: r.difficulty === 'Easy' ? 'success' : r.difficulty === 'Medium' ? 'warning' : 'danger' }) },
        { key: 'marks', label: 'Marks', width: 80, align: 'right', numeric: true },
        {
          key: '__add', label: '', width: 80, sortable: false, align: 'right',
          render: (r) => Button('Add', { variant: 'subtle', size: 'sm', icon: 'plus', onClick: (e) => { e.stopPropagation(); if (!picked.find((p) => p.id === r.id)) { picked.push(r); paintPicked(); } } }),
        },
      ],
      rows: filtered, pageSize: 10, columnToggle: false, exportable: false,
      searchKeys: ['text', 'subjectName', 'topic'],
      emptyState: emptyFor('database', 'No matching questions', 'Relax a filter or add new questions to the bank.'),
    }));
  };

  paintPicked();
  paintBank();

  mount.appendChild(page({
    title: 'Online test builder',
    subtitle: 'Pick questions from the bank, set the rules, and publish to a class',
    route: 'lms/online-tests',
    actions: [
      Button('Cancel', { variant: 'ghost', icon: 'arrow-left', route: 'lms/online-tests' }),
      Button('Save draft', { variant: 'secondary', icon: 'save', onClick: mockAction('Save draft') }),
      Button('Publish test', {
        variant: 'primary', icon: 'send',
        onClick: () => {
          if (!picked.length) return notify({ title: 'Add at least one question', text: 'A test needs questions before it can be published.', tone: 'warning' });
          ConfirmDialog({ title: 'Publish this test?', text: `${picked.length} questions · ${picked.reduce((a, q) => a + q.marks, 0)} marks. Learners will be able to attempt it from the scheduled time.`, confirmLabel: 'Publish', tone: 'brand', icon: 'send' })
            .then((ok) => { if (ok) { notify({ title: 'Test published', tone: 'success' }); navigate('lms/online-tests'); } });
        },
      }),
    ],
    children: [
      h('div', { className: 'detail-split' },
        h('div', { className: 'stack' },
          SectionCard({ title: 'Test settings', icon: 'settings' },
            FormGrid({ cols: 2 },
              Field({ label: 'Test title', required: true, className: 'col-span-full' }, Input({ placeholder: 'Mathematics — Unit Test 3' })),
              Field({ label: 'Class', required: true }, Combobox({ options: [...new Set(db.courses.map((c) => c.className))] })),
              Field({ label: 'Course' }, Combobox({ options: db.courses.slice(0, 120).map((c) => ({ value: c.id, label: c.title })) })),
              Field({ label: 'Scheduled on', required: true }, DatePicker({ value: TODAY })),
              Field({ label: 'Start time', required: true }, TimePicker({ value: '10:00' })),
              Field({ label: 'Duration (minutes)', required: true }, Input({ type: 'number', value: '45', numeric: true })),
              Field({ label: 'Passing %' }, Input({ type: 'number', value: '33', numeric: true, suffix: '%' })),
              Field({ label: 'Negative marking', hint: 'Deduct 25% for a wrong answer' }, Switch('Enable negative marking')),
              Field({ label: 'Shuffle', hint: 'Randomise question and option order' }, Switch('Shuffle questions', { checked: true })))),
          SectionCard({
            title: 'Question paper', icon: 'list',
            subtitle: 'Drag order is preserved as you add questions',
            actions: Button('Clear all', { variant: 'ghost', size: 'sm', icon: 'trash', onClick: () => { picked = []; paintPicked(); } }),
          }, pickedHost),
          SectionCard({
            title: 'Question bank', icon: 'database', flush: true,
            subtitle: `${formatNumber(bank.length)} approved questions available`,
          }, h('div', { className: 'card-pad' },
            FilterBar({
              filters: [
                { id: 'subjectName', label: 'Subject', options: [...new Set(bank.map((q) => q.subjectName))] },
                { id: 'difficulty', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'] },
                { id: 'type', label: 'Type', options: [...new Set(bank.map((q) => q.type))] },
                { id: 'marks', label: 'Marks', options: ['1', '2', '3', '4', '5'] },
              ],
              onChange: (id, v, allV) => {
                filtered = applyFilters(bank, allV, {
                  subjectName: (r, v2) => r.subjectName === v2,
                  difficulty: (r, v2) => r.difficulty === v2,
                  type: (r, v2) => r.type === v2,
                  marks: (r, v2) => String(r.marks) === v2,
                });
                paintBank();
              },
            })), bankHost)),
        h('div', { className: 'stack-3' },
          SectionCard({ title: 'Paper summary', icon: 'gauge' }, summaryHost),
          Callout({ tone: 'info', icon: 'lightbulb', title: 'Blueprint guidance' },
            'A balanced CBSE-style paper is roughly 35% easy, 45% medium and 20% hard, with at least one case-study question in classes IX and above.'),
          SectionCard({ title: 'Recently published', icon: 'history' },
            RankList(sortBy(db.onlineTests.filter((t) => t.status === 'Published'), 'scheduledOn', 'desc').slice(0, 6)
              .map((t) => ({ name: t.title, meta: `${t.className} · ${formatDate(t.scheduledOn, 'dayMonth')}`, value: `${t.totalMarks}m` })))))),
    ],
  }));
}

lmsRoutes['lms/online-tests'] = {
  title: 'Online Tests', subtitle: 'Scheduled online assessments and results', section: 'lms',
  render(mount, ctx) {
    injectStyles();
    if (ctx.param === 'new') return testBuilder(mount, ctx);
    const rows = scoped(db.onlineTests, ctx);
    const completed = rows.filter((r) => r.status === 'Completed');

    mount.appendChild(listPage({
      title: 'Online tests',
      subtitle: `${formatNumber(rows.length)} tests · ${formatNumber(rows.filter((r) => r.status === 'Published').length)} published · avg score ${Math.round(avg(completed, 'avgScore') || 0)}%`,
      route: 'lms/online-tests',
      actions: [
        moreMenu([{ label: 'Import questions (CSV)', icon: 'upload', onClick: mockAction('Import questions') }]),
        !isLearner() && Button('Question bank', { variant: 'secondary', icon: 'database', route: 'lms/question-bank' }),
        !isLearner() && Button('Build test', { variant: 'primary', icon: 'plus', route: 'lms/online-tests/new' }),
      ].filter(Boolean),
      kpis: [
        { label: 'Tests', value: formatNumber(rows.length), icon: 'clipboard-check', tone: 'brand' },
        { label: 'Attempts', value: formatNumber(sum(rows, 'attempted')), icon: 'edit', tone: 'info' },
        { label: 'Avg score', value: `${Math.round(avg(completed, 'avgScore') || 0)}%`, icon: 'percent', tone: 'success' },
        { label: 'Avg pass rate', value: `${Math.round(avg(completed, 'passPct') || 0)}%`, icon: 'check-circle', tone: 'warning' },
      ],
      chart: scatterPlot({
        points: completed.slice(0, 60).map((t) => ({ x: t.avgScore, y: t.passPct, label: t.title, group: t.className.length > 8 ? 'Senior' : 'Middle' })),
        xLabel: 'Average score (%)', yLabel: 'Pass rate (%)', height: 260,
      }),
      chartTitle: 'Average score vs pass rate',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Test title…' },
        { id: 'className', label: 'Class', options: [...new Set(rows.map((r) => r.className))] },
        { id: 'status', label: 'Status', options: ['Published', 'Draft', 'Completed'] },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(rows, allV, {
        q: (r, t) => r.title.toLowerCase().includes(t.toLowerCase()),
        className: (r, v2) => r.className === v2,
        status: (r, v2) => r.status === v2,
      })),
      columns: [
        { key: 'title', label: 'Test', sticky: true, width: 250, render: (r) => Identity(r.title, `${r.className} · by ${r.createdBy}`), value: (r) => r.title },
        { key: 'scheduledOn', label: 'Scheduled', width: 130, render: (r) => formatDate(r.scheduledOn) },
        { key: 'questions', label: 'Questions', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'totalMarks', label: 'Marks', width: 90, align: 'right', numeric: true },
        { key: 'durationMin', label: 'Duration', width: 100, align: 'right', numeric: true, render: (r) => `${r.durationMin} min`, value: (r) => r.durationMin },
        { key: 'attempted', label: 'Attempted', width: 170, render: (r) => progressCell(pct(r.attempted, r.totalStudents), pct(r.attempted, r.totalStudents) >= 80 ? 'success' : 'warning'), value: (r) => r.attempted },
        { key: 'avgScore', label: 'Avg %', width: 90, align: 'right', numeric: true, aggregate: 'avg', format: (v) => v.toFixed(1) },
        { key: 'passPct', label: 'Pass %', width: 90, align: 'right', numeric: true, aggregate: 'avg', format: (v) => v.toFixed(1) },
        { key: 'negativeMarking', label: 'Negative', width: 100, render: (r) => (r.negativeMarking ? Badge('Yes', { tone: 'warning' }) : h('span', { className: 't-muted' }, 'No')), value: (r) => (r.negativeMarking ? 1 : 0) },
        { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
      ],
      rows,
      selectable: true, footerAggregates: true,
      searchKeys: ['title', 'className', 'createdBy'],
      expandable: (r) => h('div', { className: 'stack-3' },
        h('div', { className: 'row-4 row-wrap' },
          Tag(`${r.questions} questions`, { icon: 'database' }),
          Tag(`${r.totalMarks} marks`, { icon: 'percent' }),
          Tag(r.shuffleQuestions ? 'Shuffled' : 'Fixed order', { icon: 'refresh-ccw' }),
          Tag(r.negativeMarking ? 'Negative marking on' : 'No negative marking', { icon: 'minus' })),
        SectionCard({ title: 'Score distribution', className: 'chart-card' },
          barChart({
            categories: ['0-33', '34-50', '51-70', '71-85', '86-100'],
            series: [{ name: 'Learners', values: [0, 1, 2, 3, 4].map((i) => Math.max(0, Math.round(r.totalStudents * [0.06, 0.14, 0.3, 0.32, 0.18][i]))) }],
            height: 200, showValues: true,
          }))),
      bulkActions: [
        { label: 'Publish', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} tests published`, tone: 'success' }) },
        { label: 'Duplicate', icon: 'copy', onClick: (sel) => notify({ title: `${sel.length} tests duplicated`, tone: 'info' }) },
      ],
      rowActions: (r) => [
        { label: 'Open results', icon: 'chart-bar', onClick: mockAction('Open results') },
        { label: 'Edit paper', icon: 'edit', route: 'lms/online-tests/new' },
        { label: 'Duplicate', icon: 'copy', onClick: mockAction('Duplicate test') },
        { separator: true },
        { label: 'Withdraw', icon: 'x-circle', tone: 'danger', onClick: mockAction('Withdraw test') },
      ],
      emptyState: emptyFor('clipboard-check', 'No online tests', 'Build a test from the question bank to assess a class.',
        Button('Build test', { variant: 'primary', icon: 'plus', route: 'lms/online-tests/new' })),
    }));
  },
};

/* ---------------------------------------------- lms / question-bank ------ */

lmsRoutes['lms/question-bank'] = {
  title: 'Question Bank', subtitle: 'Reusable questions tagged by subject, topic and Bloom level', section: 'lms',
  render(mount, ctx) {
    injectStyles();
    const rows = db.questionBank;
    const byDifficulty = countBy(rows, 'difficulty');
    const byBloom = countBy(rows, 'bloomLevel');

    const addModal = () => formPage({
      title: 'Add a question', mode: 'modal', size: 'lg', submitLabel: 'Save to bank',
      sections: [{
        title: 'Question', cols: 2,
        fields: [
          { id: 'text', label: 'Question text', type: 'textarea', required: true, span: 'full', placeholder: 'State and prove the Pythagoras theorem…' },
          { id: 'subject', label: 'Subject', type: 'select', required: true, options: [...new Set(rows.map((r) => r.subjectName))] },
          { id: 'level', label: 'Class level', type: 'number', required: true, value: 10 },
          { id: 'type', label: 'Question type', type: 'select', required: true, options: [...new Set(rows.map((r) => r.type))] },
          { id: 'difficulty', label: 'Difficulty', type: 'radio', inline: true, options: ['Easy', 'Medium', 'Hard'], value: 'Medium' },
          { id: 'marks', label: 'Marks', type: 'number', value: 3, required: true },
          { id: 'bloom', label: 'Bloom level', type: 'select', options: [...new Set(rows.map((r) => r.bloomLevel))] },
          { id: 'topic', label: 'Topic', type: 'combobox', options: [...new Set(rows.map((r) => r.topic))] },
          { id: 'answer', label: 'Model answer', type: 'textarea', span: 'full' },
        ],
      }],
      onSubmit: () => notify({ title: 'Question added to bank', tone: 'success' }),
    });

    mount.appendChild(listPage({
      title: 'Question bank',
      subtitle: `${formatNumber(rows.length)} questions · ${formatNumber(rows.filter((r) => r.status === 'Approved').length)} approved for use`,
      route: 'lms/question-bank',
      actions: [
        moreMenu([{ label: 'Import from CSV', icon: 'upload', onClick: mockAction('Import questions') }]),
        Button('Build a test', { variant: 'secondary', icon: 'clipboard-check', route: 'lms/online-tests/new' }),
        Button('Add question', { variant: 'primary', icon: 'plus', onClick: addModal }),
      ],
      kpis: [
        { label: 'Questions', value: formatNumber(rows.length), icon: 'database', tone: 'brand' },
        { label: 'Approved', value: formatNumber(rows.filter((r) => r.status === 'Approved').length), icon: 'check-circle', tone: 'success' },
        { label: 'Under review', value: formatNumber(rows.filter((r) => r.status === 'Under Review').length), icon: 'clock', tone: 'warning' },
        { label: 'Times used', value: formatNumber(sum(rows, 'usedCount')), icon: 'refresh', tone: 'info' },
      ],
      chart: barChart({
        categories: byBloom.map((b) => b.key),
        series: [{ name: 'Questions', values: byBloom.map((b) => b.value) }],
        height: 220, showValues: true,
      }),
      chartTitle: "Coverage by Bloom's taxonomy level",
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Question text or topic…' },
        { id: 'subjectName', label: 'Subject', options: [...new Set(rows.map((r) => r.subjectName))] },
        { id: 'difficulty', label: 'Difficulty', options: byDifficulty.map((d) => d.key) },
        { id: 'type', label: 'Type', options: [...new Set(rows.map((r) => r.type))] },
        { id: 'status', label: 'Status', options: ['Approved', 'Draft', 'Under Review'] },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(rows, allV, {
        q: (r, t) => (r.text + r.topic).toLowerCase().includes(t.toLowerCase()),
        subjectName: (r, v2) => r.subjectName === v2,
        difficulty: (r, v2) => r.difficulty === v2,
        type: (r, v2) => r.type === v2,
        status: (r, v2) => r.status === v2,
      })),
      columns: [
        { key: 'text', label: 'Question', sticky: true, width: 380, render: (r) => h('div', { className: 't-sm t-clamp-2' }, r.text) },
        { key: 'subjectName', label: 'Subject', width: 140, filter: true },
        { key: 'classLevel', label: 'Level', width: 80, align: 'right', numeric: true },
        { key: 'topic', label: 'Topic', width: 120, filter: true },
        { key: 'type', label: 'Type', width: 140, filter: true },
        { key: 'difficulty', label: 'Difficulty', width: 110, filter: true, render: (r) => Badge(r.difficulty, { tone: r.difficulty === 'Easy' ? 'success' : r.difficulty === 'Medium' ? 'warning' : 'danger' }) },
        { key: 'bloomLevel', label: 'Bloom', width: 120, filter: true },
        { key: 'marks', label: 'Marks', width: 80, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'usedCount', label: 'Used', width: 80, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
      ],
      rows,
      selectable: true, footerAggregates: true, pageSize: 50,
      searchKeys: ['text', 'subjectName', 'topic', 'bloomLevel'],
      expandable: (r) => h('div', { className: 'stack-2' },
        h('div', { className: 't-eyebrow' }, 'Full question'),
        h('div', { className: 't-body' }, r.text),
        h('div', { className: 'row-4 row-wrap' },
          Tag(`${r.marks} mark(s)`, { icon: 'percent' }),
          Tag(r.bloomLevel, { icon: 'lightbulb' }),
          Tag(`Used ${r.usedCount} times`, { icon: 'refresh' }),
          Tag(`Class ${r.classLevel}`, { icon: 'graduation-cap' }))),
      bulkActions: [
        { label: 'Add to test', icon: 'plus', onClick: (sel) => notify({ title: `${sel.length} questions added to draft test`, tone: 'success' }) },
        { label: 'Approve', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} questions approved`, tone: 'success' }) },
        { label: 'Delete', icon: 'trash', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Delete ${sel.length} questions?`, tone: 'danger', confirmLabel: 'Delete' }).then((ok) => ok && notify({ title: 'Questions deleted', tone: 'danger' })) },
      ],
      rowActions: (r) => [
        { label: 'Edit question', icon: 'edit', onClick: addModal },
        { label: 'Duplicate', icon: 'copy', onClick: mockAction('Duplicate question') },
        { label: 'Add to test', icon: 'plus', onClick: () => notify({ title: 'Added to draft test', text: r.subjectName, tone: 'success' }) },
      ],
      emptyState: emptyFor('database', 'No questions', 'Add questions to reuse them across tests and exams.',
        Button('Add question', { variant: 'primary', icon: 'plus', onClick: addModal })),
    }));
  },
};

/* --------------------------------------------------- lms / doubts -------- */

lmsRoutes['lms/doubts'] = {
  title: 'Doubts & Discussion', subtitle: 'Learner questions answered by subject teachers', section: 'lms',
  render(mount, ctx) {
    injectStyles();
    warmStaff();
    const all = scoped(db.doubts, ctx);
    let view = sortBy(all, 'askedOn', 'desc');
    const listHost = h('div', { className: 'stack-2' });

    const openThread = (d) => {
      const replies = [];
      const rnd = rngFor(d.id);
      const nReplies = d.replies || 0;
      for (let i = 0; i < Math.min(nReplies, 4); i++) {
        const isTeacher = i % 2 === 0 && d.answeredBy;
        replies.push({
          name: isTeacher ? d.answeredBy : d.studentName,
          text: isTeacher
            ? pickFrom(rnd, ['Good question — look at the worked example on page 74; the key is to isolate the variable first.',
              'Think about what stays constant in the reaction. Try it again and share your steps.',
              'I have uploaded an extra practice sheet to the course material for exactly this.'])
            : pickFrom(rnd, ['Thank you, that makes sense now.', 'I tried that but got a different answer — attaching my working.', 'Could you share one more example?']),
          time: relativeTime(d.askedOn),
          avatar: isTeacher ? d.answeredBy : d.studentName,
        });
      }
      Drawer({
        title: 'Doubt thread', subtitle: `${d.subject} · asked by ${d.studentName}`, size: 'lg',
        body: h('div', { className: 'stack-4' },
          Card({ pad: true, className: 'card-accent' },
            h('div', { className: 'row-3' },
              Avatar(d.studentName, { size: 'md' }),
              h('div', { className: 'flex-1 min-0' },
                h('div', { className: 't-medium' }, d.studentName),
                h('div', { className: 't-xs t-muted' }, `${d.className} · ${relativeTime(d.askedOn)}`)),
              Badge(d.status)),
            h('div', { className: 'mt-3 t-body' }, d.question),
            h('div', { className: 'row-3 mt-3' },
              Button(`${d.upvotes} helpful`, { variant: 'ghost', size: 'sm', icon: 'thumbs-up', onClick: () => notify({ title: 'Marked helpful', tone: 'success' }) }),
              Button('Open learner profile', { variant: 'link', size: 'sm', onClick: () => navigate(`students/profile/${d.studentId}`) }))),
          SectionCard({ title: `Replies (${replies.length})`, icon: 'message-circle' },
            CommentThread(replies, {
              placeholder: 'Answer this doubt…',
              onSubmit: (text) => notify({ title: 'Reply posted', text: text.slice(0, 60), tone: 'success' }),
            }))),
        actions: (close) => frag(
          Button('Escalate to HOD', { variant: 'ghost', icon: 'trending-up', onClick: () => { close(); notify({ title: 'Escalated to department head', tone: 'warning' }); } }),
          Button('Mark as answered', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Doubt marked answered', tone: 'success' }); } })),
      });
    };

    const paint = () => {
      listHost.innerHTML = '';
      if (!view.length) {
        listHost.appendChild(emptyFor('message-circle', 'No doubts match these filters', 'Try another subject or clear the status filter.'));
        return;
      }
      for (const d of view.slice(0, 40)) {
        listHost.appendChild(h('article', {
          className: 'eng-tile', dataset: { clickable: '1' }, attrs: { tabindex: '0' },
          onClick: () => openThread(d),
          onKeyDown: (e) => { if (e.key === 'Enter') openThread(d); },
        },
          h('div', { className: 'row-3' },
            Avatar(d.studentName, { size: 'sm' }),
            h('div', { className: 'flex-1 min-0' },
              h('div', { className: 't-sm t-medium t-truncate' }, d.studentName),
              h('div', { className: 't-xs t-muted' }, `${d.className} · ${d.subject} · ${relativeTime(d.askedOn)}`)),
            Badge(d.status)),
          h('div', { className: 't-body t-clamp-2' }, d.question),
          h('div', { className: 'row-3' },
            h('span', { className: 'row', style: { gap: 'var(--sp-1)' } }, Icon('thumbs-up', 13), h('span', { className: 't-xs t-num' }, String(d.upvotes))),
            h('span', { className: 'row', style: { gap: 'var(--sp-1)' } }, Icon('message-circle', 13), h('span', { className: 't-xs t-num' }, String(d.replies))),
            h('span', { className: 'spacer' }),
            d.answeredBy ? h('span', { className: 't-xs t-muted' }, `Answered by ${d.answeredBy}`) : h('span', { className: 't-xs t-warning' }, 'Awaiting an answer'))));
      }
    };
    paint();

    mount.appendChild(page({
      title: 'Doubts & discussion',
      subtitle: `${formatNumber(all.length)} threads · ${formatNumber(all.filter((d) => d.status === 'Open').length)} open · ${formatNumber(all.filter((d) => d.status === 'Escalated').length)} escalated`,
      route: 'lms/doubts',
      actions: [
        moreMenu(),
        Button('Answer next open doubt', {
          variant: 'primary', icon: 'message-circle',
          onClick: () => { const open = all.find((d) => d.status === 'Open'); if (open) openThread(open); else notify({ title: 'Nothing pending', text: 'Every doubt has been answered.', tone: 'success' }); },
        }),
      ],
      children: [
        kpiRow([
          { label: 'Threads', value: formatNumber(all.length), icon: 'message-circle', tone: 'brand' },
          { label: 'Answered', value: formatNumber(all.filter((d) => d.status === 'Answered').length), icon: 'check-circle', tone: 'success' },
          { label: 'Open', value: formatNumber(all.filter((d) => d.status === 'Open').length), icon: 'clock', tone: 'warning' },
          { label: 'Escalated', value: formatNumber(all.filter((d) => d.status === 'Escalated').length), icon: 'trending-up', tone: 'danger' },
        ]),
        Card({ className: 'p-0' }, FilterBar({
          filters: [
            { id: 'q', type: 'search', label: 'Search', placeholder: 'Question or learner…', width: '280px' },
            { id: 'subject', label: 'Subject', options: [...new Set(all.map((d) => d.subject))] },
            { id: 'status', label: 'Status', options: ['Open', 'Answered', 'Escalated'] },
            { id: 'sort', type: 'segment', options: [{ id: 'recent', label: 'Newest' }, { id: 'upvotes', label: 'Most helpful' }], value: 'recent' },
          ],
          onChange: (id, v, allV) => {
            view = applyFilters(all, allV, {
              q: (r, t) => (r.question + r.studentName).toLowerCase().includes(t.toLowerCase()),
              subject: (r, v2) => r.subject === v2,
              status: (r, v2) => r.status === v2,
            });
            view = allV.sort === 'upvotes' ? sortBy(view, 'upvotes', 'desc') : sortBy(view, 'askedOn', 'desc');
            paint();
          },
        })),
        h('div', { className: 'widget-grid' },
          h('div', { className: 'span-8' }, SectionCard({ title: 'Discussion threads', subtitle: 'Newest first · click a card to open the thread' }, listHost)),
          h('div', { className: 'span-4' }, h('div', { className: 'stack-3' },
            SectionCard({ title: 'Doubts by subject', className: 'chart-card' },
              barChart({
                categories: sortBy(countBy(all, 'subject'), 'value', 'desc').slice(0, 8).map((s) => s.key),
                series: [{ name: 'Doubts', values: sortBy(countBy(all, 'subject'), 'value', 'desc').slice(0, 8).map((s) => s.value) }],
                horizontal: true, height: 260,
              })),
            SectionCard({ title: 'Most responsive teachers', icon: 'presentation' },
              RankList(sortBy(countBy(all.filter((d) => d.answeredBy), 'answeredBy'), 'value', 'desc').slice(0, 6)
                .map((t) => ({ name: t.key, meta: 'answers this term', value: String(t.value), avatar: t.key })))),
            Callout({ tone: 'warning', icon: 'clock', title: 'Response SLA' },
              'Doubts unanswered for 48 hours escalate to the department head automatically.')))),
      ],
    }));
  },
};

/* -------------------------------------------------- lms / progress ------- */

lmsRoutes['lms/progress'] = {
  title: 'Student Progress', subtitle: 'Learning engagement and completion analytics', section: 'lms',
  render(mount, ctx) {
    injectStyles();
    warmStaff();
    const courses = coursesFor(ctx);
    const subs = submissionsFor(ctx);
    const tests = scoped(db.onlineTests, ctx);
    const classes = scoped(db.onlineClasses, ctx);

    const learners = [];
    const seen = new Set();
    for (const s of subs) {
      if (seen.has(s.studentId)) continue;
      seen.add(s.studentId);
      const mine = subs.filter((x) => x.studentId === s.studentId);
      const graded = mine.filter((x) => x.marks != null);
      const rnd = rngFor('prog' + s.studentId);
      learners.push({
        id: s.studentId, name: s.studentName, className: s.className, section: s.section,
        submitted: mine.filter((x) => x.submittedOn).length,
        assigned: mine.length,
        onTime: pct(mine.filter((x) => x.submittedOn && !x.late).length, Math.max(1, mine.length)),
        avgMarks: graded.length ? Math.round(avg(graded.map((g) => ({ v: (g.marks / g.maxMarks) * 100 })), 'v')) : 0,
        videoMins: intBetween(rnd, 40, 620),
        loginDays: intBetween(rnd, 6, 26),
        engagement: 0,
      });
    }
    for (const l of learners) {
      l.engagement = Math.round(0.4 * pct(l.submitted, Math.max(1, l.assigned)) + 0.3 * l.avgMarks + 0.2 * l.onTime + 0.1 * Math.min(100, (l.loginDays / 26) * 100));
      l.band = l.engagement >= 75 ? 'Thriving' : l.engagement >= 55 ? 'On track' : l.engagement >= 40 ? 'Needs nudge' : 'At risk';
    }
    const atRisk = learners.filter((l) => l.band === 'At risk');
    const matrix = analytics.performanceMatrix;

    mount.appendChild(dashboardPage({
      title: 'Student progress',
      subtitle: `${formatNumber(learners.length)} active learners across ${formatNumber(courses.length)} courses`,
      route: 'lms/progress',
      actions: [
        Button('Export cohort', { variant: 'secondary', icon: 'download', onClick: () => { download('lms-progress.csv', toCsv(learners), 'text/csv;charset=utf-8'); notify({ title: 'Cohort exported', tone: 'success' }); } }),
        Button('Nudge at-risk learners', { variant: 'primary', icon: 'send', onClick: () => notify({ title: `Nudge queued for ${atRisk.length} learners`, text: 'Parents receive an app notification.', tone: 'success' }) }),
      ],
      kpis: [
        { label: 'Active learners', value: formatNumber(learners.length), icon: 'users', tone: 'brand', trend: analytics.sparks.students },
        { label: 'Avg engagement', value: `${Math.round(avg(learners, 'engagement') || 0)}%`, icon: 'gauge', tone: 'success' },
        { label: 'Submission rate', value: `${pct(sum(learners, 'submitted'), Math.max(1, sum(learners, 'assigned')))}%`, icon: 'inbox', tone: 'info' },
        { label: 'At risk', value: formatNumber(atRisk.length), icon: 'alert-triangle', tone: 'danger' },
      ],
      widgets: [
        {
          span: 8, render: () => SectionCard({ title: 'Engagement funnel', className: 'chart-card', subtitle: 'From enrolment to graded work, this term' },
            funnelChart({
              stages: [
                { label: 'Enrolled in a course', value: learners.length },
                { label: 'Opened material', value: Math.round(learners.length * 0.93) },
                { label: 'Attended a live class', value: Math.round(learners.length * 0.78) },
                { label: 'Submitted homework', value: sum(learners, 'submitted') > learners.length ? learners.length : sum(learners, 'submitted') },
                { label: 'Graded & returned', value: Math.round(learners.length * 0.54) },
              ],
              showConversion: true, height: 280,
            })),
        },
        {
          span: 4, render: () => SectionCard({ title: 'Engagement bands', className: 'chart-card' },
            donutChart({
              data: countBy(learners, 'band').map((b) => ({ key: b.key, value: b.value })),
              height: 260, centerLabel: 'Learners', centerValue: formatNumber(learners.length),
            })),
        },
        {
          span: 7, render: () => SectionCard({ title: 'Class × subject performance', className: 'chart-card', subtitle: 'Average score, darker is stronger' },
            heatmap({ mode: 'matrix', rows: matrix.rows, cols: matrix.cols, values: matrix.values, cellSize: 34 }),
            h('div', { className: 'mt-3' }, ScaleLegend(Math.min(...matrix.values.flat()), Math.max(...matrix.values.flat()), { format: 'percent0' }))),
        },
        {
          span: 5, render: () => SectionCard({ title: 'Course completion leaders', className: 'chart-card' },
            barChart({
              categories: sortBy(courses, 'completionPct', 'desc').slice(0, 8).map((c) => c.title.split(' — ')[0] + ' ' + c.className),
              series: [{ name: 'Completion', values: sortBy(courses, 'completionPct', 'desc').slice(0, 8).map((c) => c.completionPct) }],
              horizontal: true, valueFormat: 'percent0', height: 300,
            })),
        },
        {
          span: 6, render: () => SectionCard({ title: 'Top learners', icon: 'trophy', actions: Button('All students', { variant: 'link', size: 'sm', route: 'students/all' }) },
            RankList(sortBy(learners, 'engagement', 'desc').slice(0, 8).map((l) => ({
              name: l.name, meta: `${l.className}-${l.section} · ${l.avgMarks}% avg`, value: `${l.engagement}`, avatar: l.name,
            })))),
        },
        {
          span: 6, render: () => SectionCard({ title: 'Needs attention', icon: 'alert-triangle', subtitle: 'Lowest engagement scores this term' },
            atRisk.length ? RankList(sortBy(atRisk, 'engagement').slice(0, 8).map((l) => ({
              name: l.name, meta: `${l.className}-${l.section} · ${l.submitted}/${l.assigned} submitted`, value: `${l.engagement}`, avatar: l.name,
            }))) : emptyFor('check-circle', 'Nobody is at risk', 'Every learner is above the engagement threshold this term.')),
        },
        {
          span: 12, render: () => SectionCard({ title: 'Learner detail', flush: true, subtitle: 'Click a row to open the 360 profile' },
            DataTable({
              columns: [
                { key: 'name', label: 'Learner', sticky: true, width: 230, render: (r) => Identity(r.name, `${r.className}-${r.section}`), value: (r) => r.name },
                { key: 'assigned', label: 'Assigned', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'submitted', label: 'Submitted', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'onTime', label: 'On time', width: 100, align: 'right', numeric: true, render: (r) => `${r.onTime}%`, value: (r) => r.onTime, aggregate: 'avg', format: (v) => `${Math.round(v)}%` },
                { key: 'avgMarks', label: 'Avg score', width: 110, align: 'right', numeric: true, render: (r) => `${r.avgMarks}%`, value: (r) => r.avgMarks, aggregate: 'avg', format: (v) => `${Math.round(v)}%` },
                { key: 'videoMins', label: 'Watch time', width: 120, align: 'right', numeric: true, render: (r) => `${Math.round(r.videoMins / 60)}h ${r.videoMins % 60}m`, value: (r) => r.videoMins },
                { key: 'loginDays', label: 'Active days', width: 110, align: 'right', numeric: true },
                { key: 'engagement', label: 'Engagement', width: 190, render: (r) => progressCell(r.engagement, r.engagement >= 70 ? 'success' : r.engagement >= 45 ? 'warning' : 'danger'), value: (r) => r.engagement },
                { key: 'band', label: 'Band', width: 130, filter: true, render: (r) => Badge(r.band, { tone: r.band === 'At risk' ? 'danger' : r.band === 'Needs nudge' ? 'warning' : r.band === 'Thriving' ? 'success' : 'info' }) },
              ],
              rows: learners, selectable: true, footerAggregates: true, pageSize: 25,
              searchKeys: ['name', 'className'], exportName: 'learner-progress',
              bulkActions: [{ label: 'Message parents', icon: 'send', onClick: (sel) => notify({ title: `Message queued for ${sel.length} families`, tone: 'success' }) }],
              onRowClick: (r) => navigate(`students/profile/${r.id}`),
              emptyState: emptyFor('users', 'No learner activity', 'Progress appears once learners start submitting work.'),
            })),
        },
        {
          span: 12, render: () => SectionCard({ title: 'Live class participation', className: 'chart-card', subtitle: `${formatNumber(classes.length)} sessions · ${formatNumber(tests.length)} tests scheduled` },
            lineChart({
              categories: analytics.attendanceTrend.map((r) => r.month),
              series: [
                { name: 'Live class attendance', values: analytics.attendanceTrend.map((r) => r.students) },
                { name: 'Homework submission', values: analytics.attendanceTrend.map((r) => Math.round(r.students * 0.94)) },
              ],
              valueFormat: 'percent', target: 90, targetLabel: 'Target 90%', height: 260,
            })),
        },
      ],
    }));
  },
};

/* ------------------------------------------- lms / content-approval ------ */

lmsRoutes['lms/content-approval'] = {
  title: 'Content Approval', subtitle: 'Review teacher uploads before learners see them', section: 'lms',
  render(mount, ctx) {
    injectStyles();
    warmStaff();
    const courseIds = new Set(coursesFor(ctx).map((c) => c.id));
    const all = db.lessons.filter((l) => courseIds.has(l.courseId));
    const pending = all.filter((l) => l.status === 'Pending Approval');
    const rejected = all.filter((l) => l.status === 'Rejected');

    mount.appendChild(approvalQueuePage({
      title: 'Content approval',
      subtitle: `${formatNumber(pending.length)} uploads waiting · ${formatNumber(rejected.length)} sent back this term`,
      route: 'lms/content-approval',
      kpis: [
        { label: 'Awaiting review', value: formatNumber(pending.length), icon: 'clock', tone: 'warning' },
        { label: 'Approved this term', value: formatNumber(all.filter((l) => l.status === 'Approved').length), icon: 'check-circle', tone: 'success' },
        { label: 'Sent back', value: formatNumber(rejected.length), icon: 'x-circle', tone: 'danger' },
        { label: 'Avg review time', value: '1.4 days', icon: 'timer', tone: 'info' },
      ],
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Topic or course…' },
        { id: 'type', label: 'Type', options: Object.keys(LESSON_ICONS) },
        { id: 'uploadedBy', label: 'Uploaded by', options: [...new Set(pending.map((l) => l.uploadedBy))].slice(0, 40) },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(pending, allV, {
        q: (r, t) => (r.title + r.courseTitle).toLowerCase().includes(t.toLowerCase()),
        type: (r, v2) => r.type === v2,
        uploadedBy: (r, v2) => r.uploadedBy === v2,
      })),
      columns: [
        { key: 'title', label: 'Topic', sticky: true, width: 300, render: (r) => h('div', { className: 'row-3' }, Icon(LESSON_ICONS[r.type] || 'file-text', 16), Identity(r.title, `${r.courseTitle} · ${r.chapter}`)), value: (r) => r.title },
        { key: 'type', label: 'Type', width: 140, filter: true },
        { key: 'uploadedBy', label: 'Uploaded by', width: 180 },
        { key: 'uploadedOn', label: 'Submitted', width: 140, render: (r) => relativeTime(r.uploadedOn), value: (r) => r.uploadedOn },
        { key: 'sizeMb', label: 'Size', width: 100, align: 'right', numeric: true, render: (r) => `${r.sizeMb} MB`, value: (r) => r.sizeMb },
        { key: 'durationMin', label: 'Length', width: 100, align: 'right', numeric: true, render: (r) => `${r.durationMin} min`, value: (r) => r.durationMin },
      ],
      rows: pending,
      onApprove: (row) => notify({ title: 'Content approved', text: row.title, tone: 'success' }),
      onReject: (row) => notify({ title: 'Sent back to teacher', text: row.title, tone: 'danger' }),
      detail: (row) => h('div', { className: 'stack-4' },
        row.type === 'Video' ? videoPlayerMock(row) : h('div', { className: 'eng-thumb', style: { aspectRatio: '4/3' } },
          h('div', { className: 'stack-2', style: { alignItems: 'center' } }, Icon(LESSON_ICONS[row.type] || 'file-text', 40), h('div', { className: 't-sm t-muted' }, `${row.type} · ${row.sizeMb} MB`))),
        DescriptionList([
          ['Topic', row.title], ['Course', row.courseTitle], ['Chapter', row.chapter],
          ['Type', row.type], ['Duration', `${row.durationMin} min`],
          ['Uploaded by', row.uploadedBy], ['Uploaded on', formatDate(row.uploadedOn)],
        ], { cols: 2 }),
        SectionCard({ title: 'Review checklist', icon: 'clipboard-check' },
          h('div', { className: 'stack-2' },
            ['Curriculum aligned to the CBSE syllabus', 'No copyright-protected third-party material', 'Audio and video quality acceptable', 'Language and examples age appropriate']
              .map((c) => Checkbox(c, { checked: true })))),
        SectionCard({ title: 'Reviewer note', icon: 'message-circle' },
          Textarea({ rows: 3, placeholder: 'Optional note sent back with your decision…' }))),
      bulkApprove: true,
    }));
  },
};

/* ==========================================================================
   3. Communication
   ========================================================================== */

const CHANNELS = [
  { id: 'SMS', label: 'SMS', icon: 'message-square', cost: 0.18, limit: 160 },
  { id: 'Email', label: 'Email', icon: 'mail', cost: 0, limit: 5000 },
  { id: 'WhatsApp', label: 'WhatsApp', icon: 'message-circle', cost: 0.42, limit: 1024 },
  { id: 'Push Notification', label: 'Push', icon: 'bell', cost: 0, limit: 240 },
  { id: 'In-App', label: 'In-app', icon: 'inbox', cost: 0, limit: 2000 },
];

const MERGE_VARS = [
  { token: '{{student_name}}', label: 'Student name', sample: 'Aarav Sharma' },
  { token: '{{class}}', label: 'Class & section', sample: 'Class X - B' },
  { token: '{{parent_name}}', label: 'Parent name', sample: 'Mr. Rajesh Sharma' },
  { token: '{{amount}}', label: 'Amount due', sample: '₹42,500' },
  { token: '{{due_date}}', label: 'Due date', sample: '05 Sep 2026' },
  { token: '{{school}}', label: 'School name', sample: 'Springdale International' },
  { token: '{{route}}', label: 'Bus route', sample: 'R12 — Sector 45' },
  { token: '{{date}}', label: 'Date', sample: '22 Aug 2026' },
];

function fillVars(text) {
  let out = String(text || '');
  for (const v of MERGE_VARS) out = out.split(v.token).join(v.sample);
  return out.replace(/\{([a-z_]+)\}/g, (m, k) => {
    const found = MERGE_VARS.find((v) => v.token === `{{${k}}}`);
    return found ? found.sample : m;
  });
}

/** Audience definitions with live recipient counts computed from the db. */
function audienceOptions(ctx) {
  const students = scoped(db.students, ctx);
  return [
    { id: 'all-parents', label: 'All parents', icon: 'users', count: () => students.length, needs: null },
    { id: 'all-students', label: 'All students', icon: 'graduation-cap', count: () => students.length, needs: null },
    { id: 'class', label: 'By class & section', icon: 'grid', needs: 'class', count: (sel) => students.filter((s) => (!sel.classes.length || sel.classes.includes(s.className)) && (!sel.sections.length || sel.sections.includes(s.section))).length },
    { id: 'staff', label: 'All staff', icon: 'briefcase', count: () => scoped(db.staff, ctx).length, needs: null },
    { id: 'teaching', label: 'Teaching staff only', icon: 'presentation', count: () => scoped(db.staff, ctx).filter((s) => s.type === 'Teaching').length, needs: null },
    { id: 'transport', label: 'Transport users (by route)', icon: 'bus', needs: 'route', count: (sel) => students.filter((s) => s.transportOpted && (!sel.routes.length || sel.routes.includes(s.routeId))).length },
    { id: 'hostel', label: 'Hostel boarders', icon: 'bed', needs: 'hostel', count: (sel) => students.filter((s) => s.hostelOpted && (!sel.hostels.length || sel.hostels.includes(s.hostelId))).length },
    { id: 'defaulters', label: 'Fee defaulters', icon: 'alert-circle', count: () => students.filter((s) => s.feeDue > 0).length, needs: null },
    { id: 'house', label: 'By house', icon: 'flag', needs: 'house', count: (sel) => students.filter((s) => !sel.houses.length || sel.houses.includes(s.house)).length },
    { id: 'custom', label: 'Custom list', icon: 'list', needs: 'custom', count: (sel) => sel.custom.length },
  ];
}

function phonePreview(channel, body, subject) {
  const kind = channel === 'WhatsApp' ? 'whatsapp' : channel === 'Push Notification' ? 'push' : 'sms';
  const text = fillVars(body) || 'Your message preview appears here as you type.';
  return h('div', { className: 'eng-phone' },
    h('div', { className: 'eng-phone-top' },
      h('span', null, formatTime(DEMO_NOW)),
      h('span', { className: 'row', style: { gap: 'var(--sp-1)' } }, Icon('wifi', 12), Icon('activity', 12))),
    h('div', { className: 'eng-phone-screen' },
      h('div', { className: 'row-3', style: { paddingBottom: 'var(--sp-2)', borderBottom: '1px solid var(--border-subtle)' } },
        Avatar('Springdale International', { size: 'sm' }),
        h('div', { className: 'min-0' },
          h('div', { className: 't-sm t-medium t-truncate' }, channel === 'SMS' ? 'SPDALE' : 'Springdale International'),
          h('div', { className: 't-xs t-muted' }, channel === 'SMS' ? 'SMS · DLT verified' : channel === 'WhatsApp' ? 'WhatsApp Business' : 'App notification'))),
      kind === 'push' && subject ? h('div', { className: 'eng-bubble', dataset: { kind } },
        h('div', { className: 't-sm t-semibold' }, subject),
        h('div', { className: 't-sm' }, text),
        h('div', { className: 'eng-bubble-meta' }, 'now · Springdale ERP'))
        : h('div', { className: 'eng-bubble', dataset: { kind } },
          text,
          h('div', { className: 'eng-bubble-meta row', style: { justifyContent: 'flex-end', gap: 'var(--sp-1)' } },
            formatTime(DEMO_NOW), kind === 'whatsapp' ? Icon('check-circle', 11) : null))));
}

function emailPreview(subject, body) {
  return h('div', { className: 'eng-mailwrap' },
    h('div', { className: 'eng-mailhead stack-1' },
      h('div', { className: 't-medium' }, subject || 'Subject line appears here'),
      h('div', { className: 't-xs t-muted' }, 'from Springdale International <noreply@springdale.edu.in>'),
      h('div', { className: 't-xs t-muted' }, `to ${MERGE_VARS[2].sample} · ${formatDateTime(DEMO_NOW)}`)),
    h('div', { className: 'eng-mailbody' },
      fillVars(body) || 'Your email body appears here as you type.',
      h('div', { className: 'mt-4 t-xs t-muted' },
        'Springdale International School Group · Sector 45, Gurugram, Haryana',
        h('br'), 'You are receiving this because you are a registered parent on the Springdale parent portal.')));
}

const commRoutes = {};

commRoutes['communication/compose'] = {
  title: 'Compose Message', subtitle: 'Build an audience, pick channels, preview and send', section: 'communication',
  render(mount, ctx) {
    injectStyles();
    const students = scoped(db.students, ctx);
    const audiences = audienceOptions(ctx);
    const routes = scoped(db.routes, ctx);
    const hostels = scoped(db.hostels, ctx);

    const state = {
      channels: ['SMS'],
      audienceId: 'all-parents',
      sel: { classes: [], sections: [], routes: [], hostels: [], houses: [], custom: [] },
      templateId: '',
      subject: 'Parent-Teacher Meeting — Saturday 22 August',
      body: 'Dear {{parent_name}}, the PTM for {{student_name}} of {{class}} is scheduled on {{date}}. Please book your slot on the parent portal. — {{school}}',
      scheduled: false,
      date: TODAY,
      time: '09:00',
      priority: 'Normal',
    };

    const countHost = h('div', { className: 'stack-1' });
    const targetingHost = h('div', { className: 'stack-3' });
    const previewHost = h('div', { className: 'stack-4' });
    const costHost = h('div', { className: 'stack-2' });
    const bodyInput = Textarea({ value: state.body, rows: 6, onInput: (v) => { state.body = v; repaint(); } });
    const subjectInput = Input({ value: state.subject, onInput: (v) => { state.subject = v; repaint(); } });

    const recipientCount = () => {
      const a = audiences.find((x) => x.id === state.audienceId) || audiences[0];
      return Math.max(0, a.count(state.sel));
    };

    const smsParts = () => Math.max(1, Math.ceil(fillVars(state.body).length / 160));

    const paintCount = () => {
      const n = recipientCount();
      const a = audiences.find((x) => x.id === state.audienceId);
      countHost.innerHTML = '';
      countHost.appendChild(h('div', { className: 'row-4', style: { alignItems: 'center' } },
        h('div', { className: 'stack-1 flex-1' },
          h('div', { className: 't-eyebrow' }, 'Recipients'),
          h('div', { className: 't-hero t-num' }, formatNumber(n)),
          h('div', { className: 't-sm t-muted' }, `${a.label}${state.channels.length ? ' · ' + state.channels.join(', ') : ''}`)),
        n === 0 ? Badge('No recipients', { tone: 'danger' }) : Badge('Ready to send', { tone: 'success' })));
      countHost.appendChild(stackedProgressBar({
        segments: state.channels.map((c, i) => ({ label: c, value: n, color: seriesColor(i) })),
        barHeight: 8, showLegend: true,
      }));
    };

    const paintTargeting = () => {
      targetingHost.innerHTML = '';
      const a = audiences.find((x) => x.id === state.audienceId);
      if (!a || !a.needs) {
        targetingHost.appendChild(h('div', { className: 't-sm t-muted' },
          'This audience needs no further targeting — every matching contact will be included.'));
        return;
      }
      if (a.needs === 'class') {
        targetingHost.appendChild(Field({ label: 'Classes', hint: 'Leave empty to include every class' },
          MultiSelect({
            options: [...new Set(students.map((s) => s.className))],
            values: state.sel.classes, placeholder: 'All classes',
            onChange: (v) => { state.sel.classes = v; repaint(); },
          })));
        targetingHost.appendChild(Field({ label: 'Sections' },
          MultiSelect({
            options: [...new Set(students.map((s) => s.section))].sort(),
            values: state.sel.sections, placeholder: 'All sections',
            onChange: (v) => { state.sel.sections = v; repaint(); },
          })));
      }
      if (a.needs === 'route') {
        targetingHost.appendChild(Field({ label: 'Bus routes' },
          MultiSelect({
            options: routes.map((r) => ({ value: r.id, label: `${r.code} — ${r.name}` })),
            values: state.sel.routes, placeholder: 'All routes',
            onChange: (v) => { state.sel.routes = v; repaint(); },
          })));
      }
      if (a.needs === 'hostel') {
        targetingHost.appendChild(Field({ label: 'Hostels' },
          MultiSelect({
            options: hostels.map((r) => ({ value: r.id, label: r.name })),
            values: state.sel.hostels, placeholder: 'All hostels',
            onChange: (v) => { state.sel.hostels = v; repaint(); },
          })));
      }
      if (a.needs === 'house') {
        targetingHost.appendChild(Field({ label: 'Houses' },
          MultiSelect({
            options: db.houses.map((r) => r.name),
            values: state.sel.houses, placeholder: 'All houses',
            onChange: (v) => { state.sel.houses = v; repaint(); },
          })));
      }
      if (a.needs === 'custom') {
        targetingHost.appendChild(Field({ label: 'Pick students', hint: 'Search by name or admission number' },
          MultiSelect({
            options: students.slice(0, 300).map((s) => ({ value: s.id, label: `${s.name} · ${s.admissionNo}` })),
            values: state.sel.custom, placeholder: 'Search students…',
            onChange: (v) => { state.sel.custom = v; repaint(); },
          })));
        targetingHost.appendChild(h('div', { className: 'row-3' },
          Button('Upload CSV', { variant: 'secondary', size: 'sm', icon: 'upload', onClick: mockAction('Upload recipient CSV') }),
          Button('Paste numbers', { variant: 'ghost', size: 'sm', icon: 'copy', onClick: mockAction('Paste numbers') })));
      }
    };

    const paintCost = () => {
      const n = recipientCount();
      const parts = smsParts();
      const smsCost = state.channels.includes('SMS') ? n * parts * 0.18 : 0;
      const waCost = state.channels.includes('WhatsApp') ? n * 0.42 : 0;
      costHost.innerHTML = '';
      costHost.appendChild(DescriptionList([
        ['Message length', `${fillVars(state.body).length} characters`],
        ['SMS parts', `${parts} × ₹0.18`],
        ['SMS cost', formatCurrency(smsCost)],
        ['WhatsApp cost', formatCurrency(waCost)],
        ['Email / push', 'Included in plan'],
      ]));
      costHost.appendChild(h('div', { className: 'row-3', style: { alignItems: 'baseline' } },
        h('span', { className: 't-eyebrow' }, 'Estimated total'),
        h('span', { className: 'spacer' }),
        h('span', { className: 't-title t-num' }, formatCurrency(smsCost + waCost))));
      costHost.appendChild(h('div', { className: 't-xs t-muted' }, `SMS credit balance: ${formatNumber(184320)} · sufficient for this send.`));
    };

    const paintPreview = () => {
      previewHost.innerHTML = '';
      const list = state.channels.length ? state.channels : ['SMS'];
      for (const ch of list) {
        previewHost.appendChild(SectionCard({ title: `${ch} preview`, icon: (CHANNELS.find((c) => c.id === ch) || {}).icon },
          ch === 'Email' || ch === 'In-App'
            ? emailPreview(state.subject, state.body)
            : phonePreview(ch, state.body, state.subject),
          h('div', { className: 'mt-3 t-xs t-muted' },
            ch === 'SMS'
              ? `${fillVars(state.body).length} characters · ${smsParts()} SMS part(s) · DLT template required for promotional content`
              : ch === 'WhatsApp'
                ? 'Sent via the WhatsApp Business API using an approved template.'
                : ch === 'Push Notification'
                  ? 'Delivered to the Springdale parent app on Android and iOS.'
                  : 'Rendered with the school letterhead and footer.')));
      }
    };

    const repaint = () => { paintCount(); paintTargeting(); paintCost(); paintPreview(); };

    const channelHost = h('div', { className: 'row-3 row-wrap' },
      CHANNELS.map((c) => {
        const pill = Pill(c.label, {
          icon: c.icon,
          active: state.channels.includes(c.id),
          onClick: () => {
            const i = state.channels.indexOf(c.id);
            if (i >= 0) state.channels.splice(i, 1); else state.channels.push(c.id);
            [...channelHost.children].forEach((el2, idx) => {
              el2.classList.toggle('is-active', state.channels.includes(CHANNELS[idx].id));
            });
            repaint();
          },
        });
        return pill;
      }));

    const varsHost = h('div', { className: 'eng-varchips' },
      MERGE_VARS.map((v) => Pill(v.token, {
        icon: 'plus',
        onClick: () => {
          const pos = bodyInput.selectionStart != null ? bodyInput.selectionStart : bodyInput.value.length;
          bodyInput.value = bodyInput.value.slice(0, pos) + v.token + bodyInput.value.slice(pos);
          state.body = bodyInput.value;
          bodyInput.focus();
          bodyInput.setSelectionRange(pos + v.token.length, pos + v.token.length);
          repaint();
        },
      })));

    const scheduleHost = h('div', { className: 'row-3 row-wrap hidden' },
      Field({ label: 'Send on' }, DatePicker({ value: state.date, onChange: (v) => { state.date = v; } })),
      Field({ label: 'At' }, TimePicker({ value: state.time, onChange: (v) => { state.time = v; } })));

    const doSend = () => {
      const n = recipientCount();
      if (!state.channels.length) return notify({ title: 'Pick at least one channel', tone: 'warning' });
      if (!n) return notify({ title: 'No recipients match this audience', text: 'Adjust the audience filters and try again.', tone: 'warning' });
      if (!state.body.trim()) return notify({ title: 'Message body is empty', tone: 'warning' });
      const parts = smsParts();
      const cost = (state.channels.includes('SMS') ? n * parts * 0.18 : 0) + (state.channels.includes('WhatsApp') ? n * 0.42 : 0);
      ConfirmDialog({
        title: state.scheduled ? 'Schedule this message?' : `Send to ${formatNumber(n)} recipients?`,
        text: `${state.channels.join(', ')} · estimated cost ${formatCurrency(cost)}${state.scheduled ? ` · scheduled for ${formatDate(state.date)} ${state.time}` : ''}. This cannot be recalled once delivery begins.`,
        confirmLabel: state.scheduled ? 'Schedule' : 'Send now',
        tone: 'brand', icon: 'send',
      }).then((ok) => {
        if (!ok) return;
        notify({
          title: state.scheduled ? 'Message scheduled' : 'Message queued for delivery',
          text: `${formatNumber(n)} recipients · ${state.channels.join(', ')}`,
          tone: 'success',
          action: Button('View delivery logs', { variant: 'link', size: 'sm', route: 'communication/delivery-logs' }),
        });
        navigate(state.scheduled ? 'communication/scheduled' : 'communication/delivery-logs');
      });
    };

    repaint();

    mount.appendChild(page({
      title: 'Compose message',
      subtitle: 'One composer for SMS, email, WhatsApp, push and in-app notifications',
      route: 'communication/compose',
      actions: [
        Button('Templates', { variant: 'ghost', icon: 'copy', route: 'communication/templates' }),
        Button('Save as draft', { variant: 'secondary', icon: 'save', onClick: () => notify({ title: 'Draft saved', text: 'Find it under Scheduled messages.', tone: 'success' }) }),
        Button('Send test to me', { variant: 'secondary', icon: 'send', onClick: () => notify({ title: 'Test message sent', text: 'Delivered to your registered number.', tone: 'info' }) }),
        Button('Review & send', { variant: 'primary', icon: 'send', onClick: doSend }),
      ],
      children: [
        h('div', { className: 'detail-split' },
          h('div', { className: 'stack' },
            SectionCard({ title: 'Channels', icon: 'megaphone', subtitle: 'Pick one or more — the same content is adapted per channel' },
              channelHost,
              h('div', { className: 'mt-3 row-4 row-wrap' },
                CHANNELS.filter((c) => state.channels.includes(c.id)).map((c) => Tag(`${c.label} · limit ${c.limit} chars`, { icon: c.icon })))),
            SectionCard({ title: 'Audience', icon: 'users', subtitle: 'The recipient count updates as you refine the audience' },
              FormGrid({ cols: 2 },
                Field({ label: 'Audience', required: true },
                  Select({
                    options: audiences.map((a) => ({ value: a.id, label: a.label })),
                    value: state.audienceId,
                    onChange: (v) => { state.audienceId = v; repaint(); },
                  })),
                Field({ label: 'Priority', hint: 'Urgent messages bypass quiet hours' },
                  Select({ options: ['Normal', 'High', 'Urgent'], value: state.priority, onChange: (v) => { state.priority = v; } }))),
              h('div', { className: 'mt-3' }, targetingHost),
              h('div', { className: 'mt-4' }, countHost)),
            SectionCard({ title: 'Message', icon: 'edit', subtitle: 'Use merge variables to personalise every message' },
              FormGrid({ cols: 2 },
                Field({ label: 'Template', hint: 'Loads an approved DLT template' },
                  Select({
                    options: [{ value: '', label: 'Start from blank' }].concat(db.templates.map((t) => ({ value: t.id, label: `${t.name} (${t.channel})` }))),
                    value: state.templateId,
                    onChange: (v) => {
                      state.templateId = v;
                      const t = byId(db.templates, v);
                      if (t) {
                        state.body = t.body;
                        bodyInput.value = t.body;
                        if (!state.channels.includes(t.channel)) state.channels = [t.channel];
                        [...channelHost.children].forEach((el2, idx) => el2.classList.toggle('is-active', state.channels.includes(CHANNELS[idx].id)));
                      }
                      repaint();
                    },
                  })),
                Field({ label: 'Subject / title', required: true, hint: 'Used by email, push and in-app' }, subjectInput),
                Field({ label: 'Message body', required: true, className: 'col-span-full', hint: 'Merge variables are replaced per recipient at send time' }, bodyInput)),
              h('div', { className: 'stack-2 mt-3' },
                h('div', { className: 't-eyebrow' }, 'Insert a merge variable'),
                varsHost)),
            SectionCard({ title: 'Delivery', icon: 'clock' },
              Switch('Schedule for later', {
                description: 'Otherwise the message goes out as soon as you confirm.',
                onChange: (v) => { state.scheduled = v; scheduleHost.classList.toggle('hidden', !v); },
              }),
              h('div', { className: 'mt-3' }, scheduleHost),
              h('div', { className: 'mt-3' },
                Checkbox('Respect quiet hours (21:00 – 07:00)', { checked: true }),
                Checkbox('Send a copy to the class teacher', { checked: false }),
                Checkbox('Request read receipt', { checked: true })))),
          h('div', { className: 'stack-3' },
            SectionCard({ title: 'Cost estimate', icon: 'rupee' }, costHost),
            previewHost,
            Callout({ tone: 'warning', icon: 'shield', title: 'TRAI / DLT compliance' },
              'Transactional SMS must map to an approved DLT template. Promotional content is blocked between 21:00 and 09:00 IST.'))),
      ],
    }));
  },
};

/* ------------------------------------ channel screens (SMS/Email/WA/Push) */

function channelPage(ctx, channelId, cfg) {
  const all = scoped(db.messages, ctx);
  const rows = all.filter((m) => m.channel === channelId);
  const sent = rows.filter((m) => m.status === 'Sent');
  const delivered = sum(rows, 'delivered');
  const failed = sum(rows, 'failed');
  const opened = sum(rows, 'opened');
  const monthly = groupBy(rows, (m) => String(m.sentOn).slice(0, 7));
  const months = [...monthly.keys()].sort();

  return listPage({
    title: cfg.title,
    subtitle: `${formatNumber(rows.length)} campaigns · ${formatNumber(delivered)} delivered · ${pct(delivered, Math.max(1, sum(rows, 'recipients')))}% delivery rate`,
    route: cfg.route,
    actions: [
      moreMenu([{ label: 'Gateway settings', icon: 'settings', route: 'system/integrations' }]),
      Button('Delivery logs', { variant: 'secondary', icon: 'list', route: 'communication/delivery-logs' }),
      Button(`New ${cfg.short}`, { variant: 'primary', icon: 'edit', route: 'communication/compose' }),
    ],
    kpis: cfg.kpis({ rows, sent, delivered, failed, opened }),
    chart: chartOrEmpty(months, () => comboChart({
      categories: months.map((m) => formatDate(m + '-01', 'monthYear')),
      bars: [{ name: 'Delivered', values: months.map((m) => sum(monthly.get(m), 'delivered')) }],
      line: { name: cfg.lineName, values: months.map((m) => sum(monthly.get(m), cfg.lineKey)) },
      height: 240,
    }), 'No campaigns have been sent on this channel yet.'),
    chartTitle: cfg.chartTitle,
    notes: cfg.notes,
    filters: [
      { id: 'q', type: 'search', label: 'Search', placeholder: 'Subject or audience…' },
      { id: 'audience', label: 'Audience', options: [...new Set(rows.map((r) => r.audience))] },
      { id: 'status', label: 'Status', options: ['Sent', 'Scheduled', 'Draft', 'Failed'] },
    ],
    onFilter: (id, v, allV, table) => table.refresh(applyFilters(rows, allV, {
      q: (r, t) => (r.subject + r.audience).toLowerCase().includes(t.toLowerCase()),
      audience: (r, v2) => r.audience === v2,
      status: (r, v2) => r.status === v2,
    })),
    columns: [
      { key: 'subject', label: 'Campaign', sticky: true, width: 280, render: (r) => Identity(r.subject, `${r.audience} · ${formatDate(r.sentOn)}`), value: (r) => r.subject },
      { key: 'recipients', label: 'Recipients', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
      { key: 'delivered', label: 'Delivered', width: 170, render: (r) => progressCell(pct(r.delivered, r.recipients), pct(r.delivered, r.recipients) >= 95 ? 'success' : 'warning'), value: (r) => r.delivered, aggregate: 'sum' },
      { key: 'failed', label: 'Failed', width: 100, align: 'right', numeric: true, aggregate: 'sum', render: (r) => h('span', { className: r.failed > 0 ? 't-danger t-num' : 't-num' }, formatNumber(r.failed)) },
      { key: 'opened', label: cfg.openLabel, width: 130, align: 'right', numeric: true, render: (r) => `${pct(r.opened, Math.max(1, r.delivered))}%`, value: (r) => pct(r.opened, Math.max(1, r.delivered)) },
      { key: 'cost', label: 'Cost', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => (r.cost ? formatCurrency(r.cost) : '—'), format: (v) => formatCurrency(v, { compact: true }) },
      { key: 'sentOn', label: 'Sent', width: 150, render: (r) => formatDateTime(r.sentOn), value: (r) => r.sentOn },
      { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
    ],
    rows,
    selectable: true, footerAggregates: true,
    searchKeys: ['subject', 'audience'],
    bulkActions: [
      { label: 'Resend to failed', icon: 'refresh', onClick: (sel) => notify({ title: `Retry queued for ${sel.length} campaigns`, tone: 'success' }) },
      { label: 'Export', icon: 'download', onClick: (sel) => notify({ title: `${sel.length} campaigns exported`, tone: 'info' }) },
    ],
    rowActions: (r) => [
      { label: 'Per-recipient log', icon: 'list', onClick: () => navigate('communication/delivery-logs', { msg: r.id }) },
      { label: 'Duplicate & edit', icon: 'copy', route: 'communication/compose' },
      { label: 'Resend to failed', icon: 'refresh', onClick: () => notify({ title: `${r.failed} retries queued`, tone: 'success' }) },
    ],
    onRowClick: (r) => navigate('communication/delivery-logs', { msg: r.id }),
    emptyState: emptyFor(cfg.icon, `No ${cfg.short} campaigns yet`, `Compose your first ${cfg.short} to reach parents instantly.`,
      Button('Compose', { variant: 'primary', icon: 'edit', route: 'communication/compose' })),
  });
}

commRoutes['communication/sms'] = {
  title: 'SMS', subtitle: 'Transactional and DLT-approved SMS campaigns', section: 'communication',
  render(mount, ctx) {
    injectStyles();
    mount.appendChild(channelPage(ctx, 'SMS', {
      title: 'SMS campaigns', route: 'communication/sms', short: 'SMS', icon: 'message-square',
      chartTitle: 'Delivered volume and spend by month', lineName: 'Spend (₹)', lineKey: 'cost',
      openLabel: 'Delivery %',
      kpis: ({ rows, delivered, failed }) => [
        { label: 'SMS sent', value: formatNumber(sum(rows, 'recipients')), icon: 'message-square', tone: 'brand' },
        { label: 'Delivered', value: `${pct(delivered, Math.max(1, sum(rows, 'recipients')))}%`, icon: 'check-circle', tone: 'success' },
        { label: 'Failed', value: formatNumber(failed), icon: 'x-circle', tone: 'danger' },
        { label: 'Spend this year', value: formatCurrency(sum(rows, 'cost'), { compact: true }), icon: 'rupee', tone: 'info' },
      ],
      notes: Callout({ tone: 'info', icon: 'shield-check', title: 'Gateway healthy · 1,84,320 credits remaining' },
        'Sender ID SPDALE · DLT entity 1101234567890123 · 8 approved templates. Promotional sends are restricted to 09:00–21:00 IST.'),
    }));
  },
};

commRoutes['communication/email'] = {
  title: 'Email', subtitle: 'Email campaigns with open and bounce tracking', section: 'communication',
  render(mount, ctx) {
    injectStyles();
    mount.appendChild(channelPage(ctx, 'Email', {
      title: 'Email campaigns', route: 'communication/email', short: 'email', icon: 'mail',
      chartTitle: 'Delivered vs opened by month', lineName: 'Opened', lineKey: 'opened',
      openLabel: 'Open rate',
      kpis: ({ rows, delivered, failed, opened }) => [
        { label: 'Emails sent', value: formatNumber(sum(rows, 'recipients')), icon: 'mail', tone: 'brand' },
        { label: 'Open rate', value: `${pct(opened, Math.max(1, delivered))}%`, icon: 'eye', tone: 'success' },
        { label: 'Bounced', value: formatNumber(failed), icon: 'alert-circle', tone: 'danger' },
        { label: 'Campaigns', value: formatNumber(rows.length), icon: 'megaphone', tone: 'info' },
      ],
      notes: Callout({ tone: 'success', icon: 'shield-check', title: 'SMTP connected · SPF, DKIM and DMARC verified' },
        'Sending domain springdale.edu.in · daily quota 20,000 · current reputation “High”.'),
    }));
  },
};

commRoutes['communication/whatsapp'] = {
  title: 'WhatsApp', subtitle: 'WhatsApp Business messages using approved templates', section: 'communication',
  render(mount, ctx) {
    injectStyles();
    mount.appendChild(channelPage(ctx, 'WhatsApp', {
      title: 'WhatsApp campaigns', route: 'communication/whatsapp', short: 'WhatsApp message', icon: 'message-circle',
      chartTitle: 'Delivered vs read by month', lineName: 'Read', lineKey: 'opened',
      openLabel: 'Read rate',
      kpis: ({ rows, delivered, opened, failed }) => [
        { label: 'Messages sent', value: formatNumber(sum(rows, 'recipients')), icon: 'message-circle', tone: 'brand' },
        { label: 'Read rate', value: `${pct(opened, Math.max(1, delivered))}%`, icon: 'eye', tone: 'success' },
        { label: 'Undelivered', value: formatNumber(failed), icon: 'x-circle', tone: 'danger' },
        { label: 'Conversation cost', value: formatCurrency(sum(rows, 'recipients') * 0.42, { compact: true }), icon: 'rupee', tone: 'info' },
      ],
      notes: Callout({ tone: 'info', icon: 'message-circle', title: 'WhatsApp Business API · +91 88000 12345' },
        'Quality rating “High”. Template messages only outside the 24-hour service window; 4 templates are approved by Meta.'),
    }));
  },
};

commRoutes['communication/push'] = {
  title: 'Push Notifications', subtitle: 'App notifications to parent and student devices', section: 'communication',
  render(mount, ctx) {
    injectStyles();
    mount.appendChild(channelPage(ctx, 'Push Notification', {
      title: 'Push notifications', route: 'communication/push', short: 'push notification', icon: 'bell',
      chartTitle: 'Delivered vs opened by month', lineName: 'Opened', lineKey: 'opened',
      openLabel: 'Open rate',
      kpis: ({ rows, delivered, opened, failed }) => [
        { label: 'Notifications', value: formatNumber(sum(rows, 'recipients')), icon: 'bell', tone: 'brand' },
        { label: 'Open rate', value: `${pct(opened, Math.max(1, delivered))}%`, icon: 'eye', tone: 'success' },
        { label: 'Unreachable devices', value: formatNumber(failed), icon: 'x-circle', tone: 'danger' },
        { label: 'Registered devices', value: formatNumber(3184), icon: 'monitor', tone: 'info' },
      ],
      notes: Callout({ tone: 'info', icon: 'bell', title: 'Springdale parent app · 3,184 active devices' },
        '2,046 Android · 1,138 iOS. Notifications are silent between 21:00 and 07:00 unless marked urgent.'),
    }));
  },
};

/* ------------------------------------------- announcements & notices ---- */

function noticeCard(n, onOpen) {
  return h('article', {
    className: 'eng-tile', dataset: { clickable: '1' }, attrs: { tabindex: '0' },
    onClick: () => onOpen(n),
    onKeyDown: (e) => { if (e.key === 'Enter') onOpen(n); },
  },
    h('div', { className: 'row-3' },
      Badge(n.category, { tone: 'info' }),
      n.pinned && Badge('Pinned', { tone: 'brand', icon: 'pin' }),
      h('span', { className: 'spacer' }),
      h('span', { className: 't-xs t-muted' }, relativeTime(n.postedOn))),
    h('div', { className: 't-medium t-clamp-2' }, n.title),
    h('div', { className: 't-sm t-muted t-clamp-2' }, n.body),
    h('div', { className: 'row-3' },
      Icon('users', 13),
      h('span', { className: 't-xs t-muted flex-1' }, n.audience),
      h('span', { className: 't-xs t-muted' }, `Expires ${formatDate(n.expiresOn, 'dayMonth')}`)));
}

function openNotice(n) {
  Drawer({
    title: n.title, subtitle: `${n.category} · posted by ${n.postedBy} · ${formatDate(n.postedOn)}`, size: 'lg',
    body: h('div', { className: 'stack-4' },
      h('div', { className: 'row-3 row-wrap' }, Badge(n.category), n.pinned && Badge('Pinned', { tone: 'brand', icon: 'pin' }), Tag(n.audience, { icon: 'users' })),
      Card({ pad: true }, h('div', { className: 't-body' }, n.body),
        h('div', { className: 'mt-4 t-sm t-muted' }, `Valid until ${formatDate(n.expiresOn)} · ${campusName(n.campusId)}`)),
      SectionCard({ title: 'Reach', icon: 'chart-bar', className: 'chart-card' },
        barChart({
          categories: ['Delivered', 'Opened', 'Acknowledged'],
          series: [{ name: 'Recipients', values: [1840, 1502, 1194] }],
          horizontal: true, height: 180, showValues: true,
        }))),
    actions: (close) => frag(
      Button('Edit', { variant: 'ghost', icon: 'edit', onClick: mockAction('Edit notice') }),
      Button('Unpin', { variant: 'ghost', icon: 'pin', onClick: mockAction('Toggle pin') }),
      Button('Push to app', { variant: 'primary', icon: 'send', onClick: () => { close(); notify({ title: 'Pushed to parent app', text: n.title, tone: 'success' }); } })),
  });
}

function announcementForm(title) {
  return formPage({
    title, mode: 'modal', size: 'lg', submitLabel: 'Publish',
    sections: [{
      title: 'Announcement', cols: 2,
      fields: [
        { id: 'title', label: 'Title', required: true, span: 'full', placeholder: 'Revised school timings from September' },
        { id: 'category', label: 'Category', type: 'select', required: true, options: ['Academic', 'Administrative', 'Transport', 'Examination', 'Event', 'Policy', 'Fee'] },
        { id: 'audience', label: 'Audience', type: 'select', required: true, options: ['All Parents', 'All Staff', 'Students', 'Class IX-XII', 'Pre-Primary Parents'] },
        { id: 'from', label: 'Publish on', type: 'date', value: TODAY, required: true },
        { id: 'till', label: 'Expires on', type: 'date', required: true },
        { id: 'priority', label: 'Priority', type: 'radio', inline: true, options: ['Normal', 'High', 'Urgent'], value: 'Normal' },
        { id: 'pin', label: 'Pin to top', type: 'switch', switchLabel: 'Keep at the top of the notice board' },
        { id: 'body', label: 'Body', type: 'textarea', required: true, span: 'full', placeholder: 'Write the announcement…' },
        { id: 'file', label: 'Attachment', type: 'file', span: 'full' },
        { id: 'push', label: 'Also send', type: 'multiselect', span: 'full', options: ['SMS', 'Email', 'WhatsApp', 'Push Notification'], value: ['Push Notification'] },
      ],
    }],
    onSubmit: (v) => notify({ title: 'Announcement published', text: v.title || 'Untitled', tone: 'success' }),
  });
}

commRoutes['communication/announcements'] = {
  title: 'Announcements', subtitle: 'The school-wide announcement board', section: 'communication',
  render(mount, ctx) {
    injectStyles();
    const all = scoped(db.notices, ctx);
    let view = sortBy(all, 'postedOn', 'desc');
    const pinned = all.filter((n) => n.pinned);
    const gridHost = h('div', { className: 'eng-grid eng-grid-wide' });

    const paint = () => {
      gridHost.innerHTML = '';
      if (!view.length) {
        gridHost.appendChild(h('div', { style: { gridColumn: '1 / -1' } },
          emptyFor('megaphone', 'No announcements match', 'Clear a filter or publish something new.')));
        return;
      }
      view.forEach((n) => gridHost.appendChild(noticeCard(n, openNotice)));
    };
    paint();

    mount.appendChild(page({
      title: 'Announcements',
      subtitle: `${formatNumber(all.length)} live announcements · ${formatNumber(pinned.length)} pinned to the top`,
      route: 'communication/announcements',
      actions: [
        moreMenu(),
        Button('Notice board', { variant: 'secondary', icon: 'flag', route: 'communication/notices' }),
        Button('New announcement', { variant: 'primary', icon: 'plus', onClick: () => announcementForm('New announcement') }),
      ],
      children: [
        kpiRow([
          { label: 'Live announcements', value: formatNumber(all.length), icon: 'megaphone', tone: 'brand' },
          { label: 'Pinned', value: formatNumber(pinned.length), icon: 'pin', tone: 'warning' },
          { label: 'Categories', value: formatNumber(new Set(all.map((n) => n.category)).size), icon: 'tag', tone: 'info' },
          { label: 'Avg acknowledgement', value: '78%', icon: 'check-circle', tone: 'success' },
        ]),
        pinned.length ? SectionCard({ title: 'Pinned', icon: 'pin', subtitle: 'Always shown first on the parent app' },
          h('div', { className: 'eng-grid eng-grid-wide' }, pinned.map((n) => noticeCard(n, openNotice)))) : null,
        Card({ className: 'p-0' }, FilterBar({
          filters: [
            { id: 'q', type: 'search', label: 'Search', placeholder: 'Title or body…', width: '280px' },
            { id: 'category', label: 'Category', options: [...new Set(all.map((n) => n.category))] },
            { id: 'audience', label: 'Audience', options: [...new Set(all.map((n) => n.audience))] },
          ],
          onChange: (id, v, allV) => {
            view = sortBy(applyFilters(all, allV, {
              q: (r, t) => (r.title + r.body).toLowerCase().includes(t.toLowerCase()),
              category: (r, v2) => r.category === v2,
              audience: (r, v2) => r.audience === v2,
            }), 'postedOn', 'desc');
            paint();
          },
        })),
        SectionCard({ title: 'All announcements', subtitle: 'Newest first' }, gridHost),
      ].filter(Boolean),
    }));
  },
};

commRoutes['communication/notices'] = {
  title: 'Notices', subtitle: 'Notice board entries with validity windows', section: 'communication',
  render(mount, ctx) {
    injectStyles();
    const rows = scoped(db.notices, ctx);
    const events = rows.map((n) => ({
      date: n.postedOn, title: n.title, tone: n.pinned ? 'brand' : 'info',
      meta: n.audience, badge: n.category,
    }));

    mount.appendChild(page({
      title: 'Notice board',
      subtitle: `${formatNumber(rows.length)} notices · ${formatNumber(rows.filter((n) => n.expiresOn >= TODAY).length)} currently valid`,
      route: 'communication/notices',
      actions: [
        moreMenu(),
        Button('Circulars', { variant: 'secondary', icon: 'scroll', route: 'communication/circulars' }),
        Button('Post a notice', { variant: 'primary', icon: 'plus', onClick: () => announcementForm('Post a notice') }),
      ],
      children: [
        kpiRow([
          { label: 'Notices', value: formatNumber(rows.length), icon: 'flag', tone: 'brand' },
          { label: 'Valid today', value: formatNumber(rows.filter((n) => n.expiresOn >= TODAY).length), icon: 'check-circle', tone: 'success' },
          { label: 'Expiring in 7 days', value: formatNumber(rows.filter((n) => n.expiresOn >= TODAY && n.expiresOn <= '2026-08-27').length), icon: 'timer', tone: 'warning' },
          { label: 'Pinned', value: formatNumber(rows.filter((n) => n.pinned).length), icon: 'pin', tone: 'info' },
        ]),
        h('div', { className: 'widget-grid' },
          h('div', { className: 'span-8' }, SectionCard({ title: 'All notices', flush: true },
            DataTable({
              columns: [
                { key: 'title', label: 'Notice', sticky: true, width: 300, render: (r) => Identity(r.title, `${r.category} · ${r.audience}`), value: (r) => r.title },
                { key: 'postedBy', label: 'Posted by', width: 140 },
                { key: 'postedOn', label: 'Posted', width: 130, render: (r) => formatDate(r.postedOn) },
                { key: 'expiresOn', label: 'Expires', width: 130, render: (r) => h('span', { className: r.expiresOn < TODAY ? 't-danger' : '' }, formatDate(r.expiresOn)), value: (r) => r.expiresOn },
                { key: 'pinned', label: 'Pinned', width: 100, render: (r) => (r.pinned ? Badge('Pinned', { tone: 'brand' }) : h('span', { className: 't-muted' }, '—')), value: (r) => (r.pinned ? 1 : 0) },
                { key: 'campusId', label: 'Campus', width: 160, render: (r) => campusName(r.campusId), value: (r) => campusName(r.campusId), filter: true },
              ],
              rows, selectable: true, pageSize: 25, exportName: 'notices',
              searchKeys: ['title', 'category', 'audience'],
              bulkActions: [
                { label: 'Pin', icon: 'pin', onClick: (sel) => notify({ title: `${sel.length} notices pinned`, tone: 'success' }) },
                { label: 'Expire now', icon: 'x-circle', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} notices expired`, tone: 'warning' }) },
              ],
              rowActions: (r) => [
                { label: 'Open', icon: 'eye', onClick: () => openNotice(r) },
                { label: 'Edit', icon: 'edit', onClick: mockAction('Edit notice') },
                { label: 'Push to app', icon: 'send', onClick: () => notify({ title: 'Pushed to parent app', tone: 'success' }) },
              ],
              onRowClick: openNotice,
              emptyState: emptyFor('flag', 'No notices', 'Post a notice to keep the community informed.'),
            }))),
          h('div', { className: 'span-4' }, h('div', { className: 'stack-3' },
            SectionCard({ title: 'Posting calendar', icon: 'calendar' },
              h('div', { style: { minHeight: '120px' } }, Timeline(sortBy(rows, 'postedOn', 'desc').slice(0, 8).map((n) => ({
                title: n.title, meta: formatDate(n.postedOn), text: n.audience,
                icon: n.pinned ? 'pin' : 'flag', tone: n.pinned ? 'brand' : 'info',
              }))))),
            SectionCard({ title: 'By category', className: 'chart-card' },
              donutChart({ data: countBy(rows, 'category').map((c) => ({ key: c.key, value: c.value })), height: 220, centerLabel: 'Notices' })),
            Callout({ tone: 'info', icon: 'info', title: 'Auto-expiry' },
              'Notices disappear from the parent app the day after their expiry date; they stay searchable here.')))),
      ],
    }));
  },
};

/* ---------------------------------------------------------- circulars --- */

function circularPreview(c) {
  const ackPct = pct(c.acknowledged, Math.max(1, c.views));
  const recipients = [];
  const rnd = rngFor(c.id);
  for (const s of db.students.slice(0, 40)) {
    const seen = rnd() < 0.86;
    recipients.push({
      id: s.id, name: s.fatherName || s.guardianName, student: s.name, className: `${s.className}-${s.section}`,
      phone: s.phone,
      status: seen ? (rnd() < 0.78 ? 'Acknowledged' : 'Viewed') : 'Not viewed',
      at: seen ? formatDate(c.issuedOn) : null,
    });
  }

  Drawer({
    title: c.title, subtitle: `${c.circularNo} · issued ${formatDate(c.issuedOn)}`, size: 'xl',
    body: h('div', { className: 'stack-4' },
      h('div', { className: 'row-3 row-wrap' },
        Badge(c.status), Badge(c.priority, { tone: c.priority === 'Urgent' ? 'danger' : c.priority === 'High' ? 'warning' : 'neutral' }),
        Tag(c.category, { icon: 'tag' }), Tag(c.audience, { icon: 'users' }),
        h('span', { className: 'spacer' }),
        Button('Download PDF', { variant: 'ghost', size: 'sm', icon: 'download', onClick: mockAction('Download circular') })),
      Card({ pad: true },
        h('div', { className: 'stack-3', style: { maxWidth: '720px', margin: '0 auto' } },
          h('div', { className: 't-center stack-1' },
            h('div', { className: 't-title' }, 'Springdale International School'),
            h('div', { className: 't-sm t-muted' }, `${campusName(c.campusId)} · CBSE affiliation 530XXXX`),
            h('div', { className: 'divider' })),
          h('div', { className: 'row', style: { justifyContent: 'space-between' } },
            h('span', { className: 't-sm t-mono' }, c.circularNo),
            h('span', { className: 't-sm' }, formatDate(c.issuedOn))),
          h('h3', { className: 't-center' }, c.title),
          h('div', { className: 't-body' },
            `Dear ${c.audience},`,
            h('br'), h('br'),
            'Please note the following details regarding the subject above. Parents are requested to acknowledge this circular on the parent portal so that the school has a confirmed record of receipt.',
            h('br'), h('br'),
            'For any clarification, kindly contact the school front office between 08:00 and 15:00 on working days.'),
          h('div', { className: 'mt-6' },
            h('div', { className: 't-sm t-medium' }, c.issuedBy),
            h('div', { className: 't-xs t-muted' }, 'Springdale International School')))),
      h('div', { className: 'widget-grid' },
        h('div', { className: 'span-6' }, SectionCard({ title: 'Read receipts', icon: 'check-circle' },
          h('div', { className: 'stack-3' },
            MetricRow('Delivered to', formatNumber(c.views)),
            MetricRow('Acknowledged', `${formatNumber(c.acknowledged)} (${ackPct}%)`),
            ProgressBar(ackPct, { tone: ackPct >= 80 ? 'success' : 'warning', label: 'Acknowledgement', showValue: true }),
            Button('Remind those who have not acknowledged', { variant: 'secondary', size: 'sm', icon: 'bell', block: true, onClick: () => notify({ title: `Reminder sent to ${formatNumber(c.views - c.acknowledged)} parents`, tone: 'success' }) })))),
        h('div', { className: 'span-6' }, SectionCard({ title: 'Acknowledgement by day', className: 'chart-card' },
          areaChart({
            categories: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
            series: [{ name: 'Acknowledged', values: [0.42, 0.68, 0.82, 0.92, 1].map((f) => Math.round(c.acknowledged * f)) }],
            height: 200,
          })))),
      SectionCard({ title: 'Recipient status', flush: true, subtitle: 'Sample of 40 recipients' },
        DataTable({
          columns: [
            { key: 'name', label: 'Parent', sticky: true, width: 200, render: (r) => Identity(r.name, r.phone), value: (r) => r.name },
            { key: 'student', label: 'Student', width: 190, render: (r) => studentLink(r.student, r.id) },
            { key: 'className', label: 'Class', width: 100, filter: true },
            { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status, { tone: r.status === 'Acknowledged' ? 'success' : r.status === 'Viewed' ? 'info' : 'danger' }) },
            { key: 'at', label: 'Acknowledged on', width: 150, render: (r) => (r.at ? formatDate(r.at) : '—') },
          ],
          rows: recipients, pageSize: 10, columnToggle: false,
        }))),
    actions: (close) => frag(
      Button('Close', { variant: 'ghost', onClick: close }),
      Button('Resend', { variant: 'secondary', icon: 'refresh', onClick: () => notify({ title: 'Circular resent', tone: 'success' }) }),
      Button('Print', { variant: 'primary', icon: 'print', onClick: mockAction('Print circular') })),
  });
}

commRoutes['communication/circulars'] = {
  title: 'Circulars', subtitle: 'Formal circulars with acknowledgement tracking', section: 'communication',
  render(mount, ctx) {
    injectStyles();
    const rows = scoped(db.circulars, ctx);
    const published = rows.filter((r) => r.status === 'Published');
    const urgent = rows.filter((r) => r.priority === 'Urgent');

    mount.appendChild(listPage({
      title: 'Circulars',
      subtitle: `${formatNumber(rows.length)} circulars · ${formatNumber(published.length)} published · ${pct(sum(rows, 'acknowledged'), Math.max(1, sum(rows, 'views')))}% acknowledged`,
      route: 'communication/circulars',
      actions: [
        moreMenu([{ label: 'Circular number series', icon: 'settings', onClick: mockAction('Numbering settings') }]),
        Button('Notices', { variant: 'secondary', icon: 'flag', route: 'communication/notices' }),
        Button('Issue circular', { variant: 'primary', icon: 'plus', onClick: () => announcementForm('Issue a circular') }),
      ],
      kpis: [
        { label: 'Circulars', value: formatNumber(rows.length), icon: 'scroll', tone: 'brand' },
        { label: 'Published', value: formatNumber(published.length), icon: 'send', tone: 'success' },
        { label: 'Acknowledgement', value: `${pct(sum(rows, 'acknowledged'), Math.max(1, sum(rows, 'views')))}%`, icon: 'check-circle', tone: 'info' },
        { label: 'Urgent', value: formatNumber(urgent.length), icon: 'alert-triangle', tone: 'danger' },
      ],
      chart: barChart({
        categories: countBy(rows, 'category').map((c) => c.key),
        series: [{ name: 'Circulars', values: countBy(rows, 'category').map((c) => c.value) }],
        height: 220, showValues: true,
      }),
      chartTitle: 'Circulars issued by category',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Title or circular number…' },
        { id: 'category', label: 'Category', options: [...new Set(rows.map((r) => r.category))] },
        { id: 'priority', label: 'Priority', options: ['Normal', 'High', 'Urgent'] },
        { id: 'status', label: 'Status', options: ['Published', 'Draft', 'Archived'] },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(rows, allV, {
        q: (r, t) => (r.title + r.circularNo).toLowerCase().includes(t.toLowerCase()),
        category: (r, v2) => r.category === v2,
        priority: (r, v2) => r.priority === v2,
        status: (r, v2) => r.status === v2,
      })),
      columns: [
        { key: 'circularNo', label: 'No.', sticky: true, width: 190, render: (r) => h('span', { className: 't-mono t-sm' }, r.circularNo) },
        { key: 'title', label: 'Title', width: 300, render: (r) => Identity(r.title, `${r.category} · ${r.audience}`), value: (r) => r.title },
        { key: 'issuedBy', label: 'Issued by', width: 130 },
        { key: 'issuedOn', label: 'Issued', width: 130, render: (r) => formatDate(r.issuedOn) },
        { key: 'validTill', label: 'Valid till', width: 130, render: (r) => formatDate(r.validTill) },
        { key: 'views', label: 'Views', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'acknowledged', label: 'Acknowledged', width: 180, render: (r) => progressCell(pct(r.acknowledged, Math.max(1, r.views)), pct(r.acknowledged, Math.max(1, r.views)) >= 80 ? 'success' : 'warning'), value: (r) => r.acknowledged, aggregate: 'sum' },
        { key: 'attachment', label: 'File', width: 90, render: (r) => (r.attachment ? Icon('paperclip', 15) : h('span', { className: 't-muted' }, '—')), value: (r) => (r.attachment ? 1 : 0) },
        { key: 'priority', label: 'Priority', width: 110, filter: true, render: (r) => Badge(r.priority, { tone: r.priority === 'Urgent' ? 'danger' : r.priority === 'High' ? 'warning' : 'neutral' }) },
        { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
      ],
      rows,
      selectable: true, footerAggregates: true,
      searchKeys: ['title', 'circularNo', 'category', 'audience'],
      bulkActions: [
        { label: 'Send reminder', icon: 'bell', onClick: (sel) => notify({ title: `Reminders sent for ${sel.length} circulars`, tone: 'success' }) },
        { label: 'Archive', icon: 'archive', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} circulars archived`, tone: 'warning' }) },
      ],
      rowActions: (r) => [
        { label: 'Preview', icon: 'eye', onClick: () => circularPreview(r) },
        { label: 'Download PDF', icon: 'download', onClick: mockAction('Download circular') },
        { label: 'Resend', icon: 'refresh', onClick: () => notify({ title: 'Circular resent', tone: 'success' }) },
        { separator: true },
        { label: 'Archive', icon: 'archive', tone: 'danger', onClick: mockAction('Archive circular') },
      ],
      onRowClick: circularPreview,
      emptyState: emptyFor('scroll', 'No circulars issued', 'Issue a circular to communicate formally with parents.'),
    }));
  },
};

/* --------------------------------------------------- emergency alert ---- */

commRoutes['communication/emergency-alert'] = {
  title: 'Emergency Alert', subtitle: 'Broadcast an urgent alert to every channel at once', section: 'communication',
  render(mount, ctx) {
    injectStyles();
    const students = scoped(db.students, ctx);
    const staff = scoped(db.staff, ctx);
    const total = students.length + staff.length;

    const scenarios = [
      { id: 'closure', label: 'Unscheduled school closure', icon: 'umbrella', body: 'URGENT: Due to heavy rainfall the school will remain closed today. Buses will not run. Online classes continue as per timetable. — Springdale International' },
      { id: 'weather', label: 'Severe weather warning', icon: 'flame', body: 'URGENT: A severe weather warning is in force. Dispersal is advanced to 11:30. Please arrange pick-up accordingly. — Springdale International' },
      { id: 'lockdown', label: 'Campus lockdown drill', icon: 'shield', body: 'URGENT: A campus lockdown is in effect. All students are safe and accounted for. Please do not come to the campus until the all-clear is issued. — Springdale International' },
      { id: 'medical', label: 'Medical emergency on campus', icon: 'first-aid', body: 'URGENT: There is a medical incident on campus. Emergency services are on site. Affected families are being contacted directly. — Springdale International' },
      { id: 'transport', label: 'Transport incident', icon: 'bus', body: 'URGENT: Bus route {{route}} is delayed due to an incident. All children are safe. Updated arrival time will follow. — Springdale International' },
    ];

    const state = { scenario: 'closure', body: scenarios[0].body, audience: 'everyone', channels: ['SMS', 'WhatsApp', 'Push Notification', 'Email'], confirmText: '' };
    const bodyInput = Textarea({ value: state.body, rows: 4, onInput: (v) => { state.body = v; paintPreview(); } });
    const previewHost = h('div', null);
    const paintPreview = () => { previewHost.innerHTML = ''; previewHost.appendChild(phonePreview('SMS', state.body, 'Emergency alert')); };
    paintPreview();

    const audienceCount = () => (state.audience === 'everyone' ? total : state.audience === 'parents' ? students.length : state.audience === 'staff' ? staff.length : students.filter((s) => s.transportOpted).length);
    const countLabel = h('span', { className: 't-hero t-num' }, formatNumber(audienceCount()));

    const fire = () => {
      const n = audienceCount();
      Modal({
        title: 'Confirm emergency broadcast',
        subtitle: 'This action cannot be undone',
        tone: 'danger', icon: 'siren', size: 'md',
        body: (close) => {
          const typed = Input({ placeholder: 'Type SEND ALERT to confirm', onInput: (v) => { state.confirmText = v; sendBtn.disabled = v.trim().toUpperCase() !== 'SEND ALERT'; } });
          const sendBtn = Button('Broadcast now', {
            variant: 'danger', icon: 'siren', disabled: true, block: true,
            onClick: () => {
              close();
              notify({ title: 'Emergency alert broadcast', text: `${formatNumber(n)} recipients across ${state.channels.length} channels`, tone: 'danger', duration: 8000 });
              navigate('communication/delivery-logs');
            },
          });
          return h('div', { className: 'stack-4' },
            Callout({ tone: 'danger', icon: 'alert-triangle', title: `${formatNumber(n)} people will be contacted immediately` },
              `Channels: ${state.channels.join(', ')}. Quiet hours and unsubscribe preferences are overridden for emergency alerts.`),
            Card({ pad: true }, h('div', { className: 't-sm' }, fillVars(state.body))),
            Field({ label: 'Type SEND ALERT to confirm', required: true }, typed),
            sendBtn);
        },
      });
    };

    mount.appendChild(page({
      title: 'Emergency alert',
      subtitle: 'Reaches every parent, guardian and staff member on all channels within 60 seconds',
      route: 'communication/emergency-alert',
      actions: [
        Button('Alert history', { variant: 'ghost', icon: 'history', route: 'communication/delivery-logs' }),
        Button('Regular message', { variant: 'secondary', icon: 'edit', route: 'communication/compose' }),
      ],
      children: [
        h('div', { className: 'eng-alert' },
          h('div', { className: 'row-3' },
            Icon('siren', 22),
            h('div', { className: 'flex-1' },
              h('div', { className: 'eng-alert-title' }, 'Emergency broadcast — use only for genuine emergencies'),
              h('div', { className: 't-sm t-secondary mt-1' },
                'Every alert is logged with your name, the timestamp and the full recipient list, and is reviewed by the Principal. Quiet hours, opt-outs and rate limits are bypassed.')),
            Badge('Restricted', { tone: 'danger', icon: 'lock' }))),
        h('div', { className: 'detail-split' },
          h('div', { className: 'stack' },
            SectionCard({ title: 'Choose a scenario', icon: 'list', subtitle: 'Pre-approved templates load an appropriate message' },
              h('div', { className: 'eng-grid' },
                scenarios.map((s) => h('button', {
                  type: 'button', className: 'eng-tile', dataset: { clickable: '1' },
                  attrs: { 'aria-pressed': String(state.scenario === s.id) },
                  style: state.scenario === s.id ? { borderColor: 'var(--danger-500)', background: 'var(--surface-selected)' } : null,
                  onClick: (e) => {
                    state.scenario = s.id; state.body = s.body; bodyInput.value = s.body; paintPreview();
                    [...e.currentTarget.parentNode.children].forEach((el2) => { el2.style.borderColor = ''; el2.style.background = ''; el2.setAttribute('aria-pressed', 'false'); });
                    e.currentTarget.style.borderColor = 'var(--danger-500)';
                    e.currentTarget.style.background = 'var(--surface-selected)';
                    e.currentTarget.setAttribute('aria-pressed', 'true');
                  },
                },
                  h('div', { className: 'row-3' }, Icon(s.icon, 18), h('span', { className: 't-medium t-left' }, s.label)),
                  h('div', { className: 't-xs t-muted t-clamp-2 t-left' }, s.body))))),
            SectionCard({ title: 'Alert message', icon: 'edit', subtitle: 'Keep it under 160 characters so it fits a single SMS' },
              bodyInput,
              h('div', { className: 'row-3 mt-2' },
                h('span', { className: 't-xs t-muted t-num' }, `${state.body.length} characters`),
                h('span', { className: 'spacer' }),
                MERGE_VARS.slice(6, 8).map((v) => Pill(v.token, { icon: 'plus', onClick: () => { bodyInput.value += ' ' + v.token; state.body = bodyInput.value; paintPreview(); } })))),
            SectionCard({ title: 'Recipients & channels', icon: 'users' },
              FormGrid({ cols: 2 },
                Field({ label: 'Audience', required: true },
                  RadioGroup([
                    { value: 'everyone', label: `Everyone (${formatNumber(total)})` },
                    { value: 'parents', label: `Parents & guardians (${formatNumber(students.length)})` },
                    { value: 'staff', label: `Staff only (${formatNumber(staff.length)})` },
                    { value: 'transport', label: `Transport users (${formatNumber(students.filter((s) => s.transportOpted).length)})` },
                  ], { name: 'emg-aud', value: state.audience, onChange: (v) => { state.audience = v; countLabel.textContent = formatNumber(audienceCount()); } })),
                Field({ label: 'Channels', required: true, hint: 'All four are strongly recommended for emergencies' },
                  h('div', { className: 'stack-1' },
                    CHANNELS.filter((c) => c.id !== 'In-App').map((c) => Checkbox(c.label, {
                      checked: state.channels.includes(c.id),
                      onChange: (on) => {
                        const i = state.channels.indexOf(c.id);
                        if (on && i < 0) state.channels.push(c.id);
                        if (!on && i >= 0) state.channels.splice(i, 1);
                      },
                    })))))),
            Card({ pad: true },
              h('div', { className: 'row-4 row-wrap', style: { alignItems: 'center' } },
                h('div', { className: 'stack-1' },
                  h('div', { className: 't-eyebrow' }, 'Will reach'),
                  countLabel),
                h('span', { className: 'spacer' }),
                Button('Send a test to myself', { variant: 'secondary', icon: 'send', onClick: () => notify({ title: 'Test alert sent to you only', tone: 'info' }) }),
                Button('Broadcast emergency alert', { variant: 'danger', size: 'lg', icon: 'siren', onClick: fire })))),
          h('div', { className: 'stack-3' },
            SectionCard({ title: 'How it will look', icon: 'monitor' }, previewHost),
            SectionCard({ title: 'Escalation chain', icon: 'workflow' },
              Stepper([
                { label: 'Alert broadcast', description: 'All channels fired simultaneously' },
                { label: 'Principal notified', description: 'Automatic call within 30 seconds' },
                { label: 'Security & transport', description: 'Gate and fleet control alerted' },
                { label: 'Follow-up circular', description: 'Issued once the situation is stable' },
              ], { current: 0 })),
            SectionCard({ title: 'Recent alerts', icon: 'history' },
              Timeline([
                { title: 'Heavy rain — early dispersal', meta: '18 Jul 2026', text: '2,780 recipients · SMS, WhatsApp, Push', icon: 'umbrella', tone: 'warning' },
                { title: 'Lockdown drill', meta: '12 May 2026', text: '3,040 recipients · all channels', icon: 'shield', tone: 'info' },
                { title: 'Bus R12 breakdown', meta: '04 Apr 2026', text: '46 recipients · SMS, call', icon: 'bus', tone: 'danger' },
              ])),
            Callout({ tone: 'danger', icon: 'alert-triangle', title: 'Misuse policy' },
              'Non-emergency use of this channel is a disciplinary matter. If in doubt, use Compose message with priority “Urgent” instead.'))),
      ],
    }));
  },
};

/* ---------------------------------------------------------- templates --- */

commRoutes['communication/templates'] = {
  title: 'Templates', subtitle: 'Reusable, DLT-approved message templates', section: 'communication',
  render(mount, ctx) {
    injectStyles();
    const rows = db.templates;

    const editTemplate = (t) => {
      const body = Textarea({ value: t ? t.body : '', rows: 5, onInput: (v) => { preview.innerHTML = ''; preview.appendChild(phonePreview(t ? t.channel : 'SMS', v)); } });
      const preview = h('div', null, phonePreview(t ? t.channel : 'SMS', t ? t.body : ''));
      Drawer({
        title: t ? `Edit ${t.name}` : 'New template', subtitle: t ? `${t.channel} · used ${formatNumber(t.usage)} times` : 'Create a reusable message', size: 'xl',
        body: h('div', { className: 'detail-split' },
          h('div', { className: 'stack-4' },
            FormGrid({ cols: 2 },
              Field({ label: 'Template name', required: true }, Input({ value: t ? t.name : '', placeholder: 'Fee Due Reminder' })),
              Field({ label: 'Channel', required: true }, Select({ options: CHANNELS.map((c) => c.id), value: t ? t.channel : 'SMS' })),
              Field({ label: 'DLT template id', hint: 'Required for SMS in India' }, Input({ value: t && t.dltId ? t.dltId : '', placeholder: 'DLT10023' })),
              Field({ label: 'Approved', hint: 'Only approved templates can be sent' }, Switch('Approved by operator', { checked: t ? t.approved : false })),
              Field({ label: 'Body', required: true, className: 'col-span-full', hint: 'Use {variable} placeholders' }, body)),
            SectionCard({ title: 'Variables in this template', icon: 'tag' },
              t && t.variables.length
                ? h('div', { className: 'eng-varchips' }, t.variables.map((v) => Tag(`{${v}}`, { icon: 'tag' })))
                : h('div', { className: 't-sm t-muted' }, 'No variables yet — insert one from the list below.'),
              h('div', { className: 'eng-varchips mt-3' },
                MERGE_VARS.map((v) => Pill(v.token, { icon: 'plus', onClick: () => { body.value += v.token; body.dispatchEvent(new Event('input')); } }))))),
          h('div', { className: 'stack-3' },
            SectionCard({ title: 'Preview', icon: 'monitor' }, preview),
            Callout({ tone: 'info', icon: 'shield-check', title: 'DLT reminder' },
              'Content must match the registered DLT template character-for-character apart from variables, or the operator will reject the SMS.'))),
        actions: (close) => frag(
          Button('Cancel', { variant: 'ghost', onClick: close }),
          Button('Save template', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Template saved', tone: 'success' }); } })),
      });
    };

    mount.appendChild(listPage({
      title: 'Message templates',
      subtitle: `${formatNumber(rows.length)} templates · ${formatNumber(sum(rows, 'usage'))} sends this year`,
      route: 'communication/templates',
      actions: [
        moreMenu([{ label: 'Sync DLT registry', icon: 'refresh', onClick: mockAction('Sync DLT registry') }]),
        Button('Compose', { variant: 'secondary', icon: 'edit', route: 'communication/compose' }),
        Button('New template', { variant: 'primary', icon: 'plus', onClick: () => editTemplate(null) }),
      ],
      kpis: [
        { label: 'Templates', value: formatNumber(rows.length), icon: 'copy', tone: 'brand' },
        { label: 'Approved', value: formatNumber(rows.filter((r) => r.approved).length), icon: 'check-circle', tone: 'success' },
        { label: 'Total usage', value: formatNumber(sum(rows, 'usage')), icon: 'refresh', tone: 'info' },
        { label: 'DLT registered', value: formatNumber(rows.filter((r) => r.dltId).length), icon: 'shield-check', tone: 'warning' },
      ],
      chart: barChart({
        categories: rows.map((r) => r.name),
        series: [{ name: 'Times used', values: rows.map((r) => r.usage) }],
        horizontal: true, height: 260,
      }),
      chartTitle: 'Template usage this academic year',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Template name or body…' },
        { id: 'channel', label: 'Channel', options: [...new Set(rows.map((r) => r.channel))] },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(rows, allV, {
        q: (r, t) => (r.name + r.body).toLowerCase().includes(t.toLowerCase()),
        channel: (r, v2) => r.channel === v2,
      })),
      columns: [
        { key: 'name', label: 'Template', sticky: true, width: 220, render: (r) => Identity(r.name, r.channel), value: (r) => r.name },
        { key: 'body', label: 'Body', width: 380, render: (r) => h('div', { className: 't-sm t-muted t-clamp-2' }, r.body) },
        { key: 'variables', label: 'Variables', width: 200, render: (r) => h('div', { className: 'row-3 row-wrap' }, r.variables.map((v) => Tag(`{${v}}`))), value: (r) => r.variables.join(',') },
        { key: 'dltId', label: 'DLT id', width: 130, render: (r) => (r.dltId ? h('span', { className: 't-mono t-sm' }, r.dltId) : h('span', { className: 't-muted' }, 'Not required')) },
        { key: 'usage', label: 'Usage', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'approved', label: 'Status', width: 130, render: (r) => Badge(r.approved ? 'Approved' : 'Pending'), value: (r) => (r.approved ? 1 : 0) },
      ],
      rows,
      selectable: true, footerAggregates: true, paginate: false,
      searchKeys: ['name', 'body', 'channel'],
      expandable: (r) => h('div', { className: 'detail-split' },
        h('div', { className: 'stack-2' },
          h('div', { className: 't-eyebrow' }, 'Raw template'),
          h('pre', { className: 't-mono t-sm', style: { whiteSpace: 'pre-wrap' } }, r.body),
          h('div', { className: 't-eyebrow mt-3' }, 'Rendered example'),
          h('div', { className: 't-sm' }, fillVars(r.body))),
        phonePreview(r.channel, r.body)),
      bulkActions: [{ label: 'Approve', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} templates approved`, tone: 'success' }) }],
      rowActions: (r) => [
        { label: 'Edit', icon: 'edit', onClick: () => editTemplate(r) },
        { label: 'Use in compose', icon: 'send', route: 'communication/compose' },
        { label: 'Duplicate', icon: 'copy', onClick: mockAction('Duplicate template') },
        { separator: true },
        { label: 'Delete', icon: 'trash', tone: 'danger', onClick: () => ConfirmDialog({ title: `Delete “${r.name}”?`, text: 'Scheduled messages using it will fail.', tone: 'danger', confirmLabel: 'Delete' }).then((ok) => ok && notify({ title: 'Template deleted', tone: 'danger' })) },
      ],
      onRowClick: editTemplate,
      emptyState: emptyFor('copy', 'No templates', 'Templates keep messages consistent and DLT-compliant.',
        Button('New template', { variant: 'primary', icon: 'plus', onClick: () => editTemplate(null) })),
    }));
  },
};

/* --------------------------------------------------------- scheduled ---- */

commRoutes['communication/scheduled'] = {
  title: 'Scheduled Messages', subtitle: 'Queued and draft messages waiting to go out', section: 'communication',
  render(mount, ctx) {
    injectStyles();
    const all = scoped(db.messages, ctx);
    const rows = all.filter((m) => m.status === 'Scheduled' || m.status === 'Draft');
    const scheduled = rows.filter((m) => m.status === 'Scheduled');

    mount.appendChild(listPage({
      title: 'Scheduled messages',
      subtitle: `${formatNumber(scheduled.length)} scheduled · ${formatNumber(rows.length - scheduled.length)} drafts · next send ${scheduled.length ? formatDateTime(sortBy(scheduled, 'sentOn')[0].sentOn) : '—'}`,
      route: 'communication/scheduled',
      actions: [
        moreMenu([{ label: 'Pause all sending', icon: 'timer', onClick: mockAction('Pause queue') }]),
        Button('Delivery logs', { variant: 'secondary', icon: 'list', route: 'communication/delivery-logs' }),
        Button('Schedule a message', { variant: 'primary', icon: 'plus', route: 'communication/compose' }),
      ],
      kpis: [
        { label: 'Scheduled', value: formatNumber(scheduled.length), icon: 'clock', tone: 'warning' },
        { label: 'Drafts', value: formatNumber(rows.length - scheduled.length), icon: 'edit', tone: 'neutral' },
        { label: 'Recipients queued', value: formatNumber(sum(scheduled, 'recipients')), icon: 'users', tone: 'brand' },
        { label: 'Committed spend', value: formatCurrency(sum(scheduled, 'cost'), { compact: true }), icon: 'rupee', tone: 'info' },
      ],
      chart: barChart({
        categories: countBy(rows, 'channel').map((c) => c.key),
        series: [{ name: 'Queued messages', values: countBy(rows, 'channel').map((c) => c.value) }],
        height: 200, showValues: true,
      }),
      chartTitle: 'Queue by channel',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Subject…' },
        { id: 'channel', label: 'Channel', options: CHANNELS.map((c) => c.id) },
        { id: 'status', label: 'Status', options: ['Scheduled', 'Draft'] },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(rows, allV, {
        q: (r, t) => r.subject.toLowerCase().includes(t.toLowerCase()),
        channel: (r, v2) => r.channel === v2,
        status: (r, v2) => r.status === v2,
      })),
      columns: [
        { key: 'subject', label: 'Message', sticky: true, width: 280, render: (r) => Identity(r.subject, r.audience), value: (r) => r.subject },
        { key: 'channel', label: 'Channel', width: 150, filter: true, render: (r) => Badge(r.channel, { tone: 'info', icon: (CHANNELS.find((c) => c.id === r.channel) || {}).icon }) },
        { key: 'recipients', label: 'Recipients', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'sentOn', label: 'Send at', width: 170, render: (r) => formatDateTime(r.sentOn), value: (r) => r.sentOn },
        { key: 'cost', label: 'Est. cost', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => (r.cost ? formatCurrency(r.cost) : '—'), format: (v) => formatCurrency(v, { compact: true }) },
        { key: 'campusId', label: 'Campus', width: 160, render: (r) => campusName(r.campusId), value: (r) => campusName(r.campusId), filter: true },
        { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
      ],
      rows,
      selectable: true, footerAggregates: true,
      searchKeys: ['subject', 'audience', 'channel'],
      bulkActions: [
        { label: 'Send now', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} messages released to the gateway`, tone: 'success' }) },
        { label: 'Reschedule', icon: 'clock', onClick: (sel) => notify({ title: `${sel.length} messages rescheduled`, tone: 'info' }) },
        { label: 'Cancel', icon: 'x-circle', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Cancel ${sel.length} scheduled messages?`, tone: 'danger', confirmLabel: 'Cancel messages' }).then((ok) => ok && notify({ title: 'Messages cancelled', tone: 'danger' })) },
      ],
      rowActions: (r) => [
        { label: 'Edit in composer', icon: 'edit', route: 'communication/compose' },
        { label: 'Send now', icon: 'send', onClick: () => notify({ title: 'Released to gateway', text: r.subject, tone: 'success' }) },
        { label: 'Preview', icon: 'eye', onClick: () => Drawer({ title: r.subject, subtitle: `${r.channel} · ${r.audience}`, body: h('div', { className: 'stack-4' }, r.channel === 'Email' ? emailPreview(r.subject, r.body) : phonePreview(r.channel, r.body, r.subject), DescriptionList([['Recipients', formatNumber(r.recipients)], ['Send at', formatDateTime(r.sentOn)], ['Cost', r.cost ? formatCurrency(r.cost) : 'Included']])) }) },
        { separator: true },
        { label: 'Cancel', icon: 'x-circle', tone: 'danger', onClick: mockAction('Cancel message') },
      ],
      emptyState: emptyFor('clock', 'Nothing scheduled', 'Messages you schedule in the composer will queue up here.',
        Button('Compose', { variant: 'primary', icon: 'edit', route: 'communication/compose' })),
    }));
  },
};

/* ----------------------------------------------------- delivery logs ---- */

function recipientLog(message, ctx) {
  const students = scoped(db.students, ctx);
  const n = Math.min(message.recipients, 240);
  const rnd = rngFor('log' + message.id);
  const rows = [];
  for (let i = 0; i < n; i++) {
    const s = students[(i * 7) % students.length];
    const roll = rnd();
    const status = roll < 0.86 ? 'Delivered' : roll < 0.94 ? 'Sent' : roll < 0.98 ? 'Failed' : 'Rejected';
    rows.push({
      id: `${message.id}-${i}`,
      studentId: s.id,
      name: s.fatherName || s.guardianName,
      student: s.name,
      className: `${s.className}-${s.section}`,
      to: message.channel === 'Email' ? s.email : s.phone,
      status,
      opened: status === 'Delivered' && rnd() < 0.62,
      attempts: status === 'Failed' ? 3 : 1,
      at: `${String(message.sentOn).slice(0, 10)}`,
      reason: status === 'Failed' ? pickFrom(rnd, ['Handset switched off', 'Number out of service', 'DND registry', 'Mailbox full'])
        : status === 'Rejected' ? 'DLT template mismatch' : '',
      cost: message.channel === 'SMS' ? 0.18 : message.channel === 'WhatsApp' ? 0.42 : 0,
    });
  }
  return rows;
}

commRoutes['communication/delivery-logs'] = {
  title: 'Delivery Logs', subtitle: 'Per-recipient delivery status for every campaign', section: 'communication',
  render(mount, ctx) {
    injectStyles();
    const campaigns = sortBy(scoped(db.messages, ctx).filter((m) => m.status === 'Sent' || m.status === 'Failed'), 'sentOn', 'desc');
    if (!campaigns.length) {
      return mount.appendChild(page({
        title: 'Delivery logs', route: 'communication/delivery-logs',
        children: Card({ pad: true }, emptyFor('list', 'No campaigns sent yet', 'Send a message and the per-recipient log will appear here.',
          Button('Compose', { variant: 'primary', icon: 'edit', route: 'communication/compose' }))),
      }));
    }
    const requested = (ctx.query && ctx.query.msg) ? byId(campaigns, ctx.query.msg) : null;
    let current = requested || campaigns[0];
    let rows = recipientLog(current, ctx);

    const kpiHost = h('div', null);
    const tableHost = h('div', null);
    const headerHost = h('div', null);

    const paint = () => {
      rows = recipientLog(current, ctx);
      const counts = statusCounts(rows);
      kpiHost.innerHTML = '';
      kpiHost.appendChild(kpiRow([
        { label: 'Recipients', value: formatNumber(current.recipients), icon: 'users', tone: 'brand' },
        { label: 'Delivered', value: `${pct(current.delivered, current.recipients)}%`, icon: 'check-circle', tone: 'success' },
        { label: 'Failed', value: formatNumber(current.failed), icon: 'x-circle', tone: 'danger' },
        { label: 'Cost', value: current.cost ? formatCurrency(current.cost) : 'Included', icon: 'rupee', tone: 'info' },
      ]));

      headerHost.innerHTML = '';
      headerHost.appendChild(Card({ pad: true },
        h('div', { className: 'row-4 row-wrap', style: { alignItems: 'flex-start' } },
          h('div', { className: 'stack-1 flex-1 min-0' },
            h('div', { className: 't-eyebrow' }, 'Campaign'),
            h('div', { className: 't-title t-truncate' }, current.subject),
            h('div', { className: 't-sm t-muted' }, `${current.channel} · ${current.audience} · sent ${formatDateTime(current.sentOn)} · ${campusName(current.campusId)}`)),
          h('div', { className: 'row-3 row-wrap' },
            Badge(current.status),
            Button('Resend to failed', { variant: 'secondary', size: 'sm', icon: 'refresh', onClick: () => notify({ title: `${current.failed} retries queued`, tone: 'success' }) }),
            Button('Export log', { variant: 'ghost', size: 'sm', icon: 'download', onClick: () => { download(`delivery-log-${current.id}.csv`, toCsv(rows), 'text/csv;charset=utf-8'); notify({ title: 'Log exported', tone: 'success' }); } }))),
        h('div', { className: 'mt-4' },
          stackedProgressBar({
            segments: [...counts.entries()].map(([k, v], i) => ({ label: `${k} (${v})`, value: v, color: seriesColor(i) })),
            barHeight: 12, showLegend: true,
          }))));

      tableHost.innerHTML = '';
      tableHost.appendChild(DataTable({
        columns: [
          { key: 'name', label: 'Recipient', sticky: true, width: 210, render: (r) => Identity(r.name, r.to), value: (r) => r.name },
          { key: 'student', label: 'Student', width: 200, render: (r) => studentLink(r.student, r.studentId) },
          { key: 'className', label: 'Class', width: 100, filter: true },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status, { tone: r.status === 'Delivered' ? 'success' : r.status === 'Sent' ? 'info' : 'danger' }) },
          { key: 'opened', label: 'Opened', width: 100, render: (r) => (r.opened ? Badge('Yes', { tone: 'success' }) : h('span', { className: 't-muted' }, 'No')), value: (r) => (r.opened ? 1 : 0) },
          { key: 'attempts', label: 'Attempts', width: 100, align: 'right', numeric: true },
          { key: 'reason', label: 'Failure reason', width: 200, render: (r) => (r.reason ? h('span', { className: 't-sm t-danger' }, r.reason) : h('span', { className: 't-muted' }, '—')) },
          { key: 'at', label: 'Timestamp', width: 140, render: (r) => formatDate(r.at) },
          { key: 'cost', label: 'Cost', width: 90, align: 'right', numeric: true, aggregate: 'sum', render: (r) => (r.cost ? formatCurrency(r.cost, { decimals: 2 }) : '—'), format: (v) => formatCurrency(v, { decimals: 2 }) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 50,
        searchKeys: ['name', 'student', 'to', 'className', 'status'],
        exportName: `delivery-log-${current.id}`,
        bulkActions: [
          { label: 'Retry delivery', icon: 'refresh', onClick: (sel) => notify({ title: `Retry queued for ${sel.length} recipients`, tone: 'success' }) },
          { label: 'Call instead', icon: 'phone-call', onClick: (sel) => notify({ title: `${sel.length} numbers added to the call list`, tone: 'info' }) },
        ],
        rowActions: (r) => [
          { label: 'Retry', icon: 'refresh', onClick: () => notify({ title: 'Retry queued', text: r.to, tone: 'success' }) },
          { label: 'Open student', icon: 'user', onClick: () => navigate(`students/profile/${r.studentId}`) },
          { label: 'Copy number', icon: 'copy', onClick: () => copyToClipboard(r.to, 'Contact copied') },
        ],
        emptyState: emptyFor('list', 'No recipients', 'This campaign has no recipient records.'),
      }));
    };
    paint();

    mount.appendChild(page({
      title: 'Delivery logs',
      subtitle: `${formatNumber(campaigns.length)} campaigns sent this academic year`,
      route: 'communication/delivery-logs',
      actions: [
        moreMenu(),
        Button('Communication reports', { variant: 'secondary', icon: 'chart-bar', route: 'communication/reports' }),
        Button('Compose', { variant: 'primary', icon: 'edit', route: 'communication/compose' }),
      ],
      children: [
        Card({ className: 'p-0' }, FilterBar({
          filters: [
            { id: 'msg', label: 'Campaign', allLabel: 'Latest campaign', width: '320px', value: current.id, options: campaigns.slice(0, 60).map((m) => ({ value: m.id, label: `${m.subject} · ${formatDate(m.sentOn)}` })) },
          ],
          onChange: (id, v) => { const found = byId(campaigns, v); if (found) { current = found; paint(); } },
          actions: Button('Latest', { variant: 'ghost', size: 'sm', icon: 'refresh', onClick: () => { current = campaigns[0]; paint(); } }),
        })),
        headerHost,
        kpiHost,
        SectionCard({ title: 'Per-recipient status', flush: true, subtitle: 'Every send attempt with its result' }, tableHost),
      ],
    }));
  },
};

/* ------------------------------------------------ communication reports - */

commRoutes['communication/reports'] = {
  title: 'Communication Reports', subtitle: 'Volume, reach, cost and engagement analytics', section: 'communication',
  render(mount, ctx) {
    injectStyles();
    let rows = scoped(db.messages, ctx);
    const monthly = groupBy(rows, (m) => String(m.sentOn).slice(0, 7));
    const months = [...monthly.keys()].sort();
    const byChannel = countBy(rows, 'channel');
    const audience = sortBy(sumBy(rows, 'audience', 'recipients'), 'value', 'desc').slice(0, 8);

    const summaryRows = byChannel.map((c) => {
      const set = rows.filter((r) => r.channel === c.key);
      return {
        channel: c.key,
        campaigns: set.length,
        recipients: sum(set, 'recipients'),
        delivered: sum(set, 'delivered'),
        failed: sum(set, 'failed'),
        opened: sum(set, 'opened'),
        deliveryRate: pct(sum(set, 'delivered'), Math.max(1, sum(set, 'recipients'))),
        openRate: pct(sum(set, 'opened'), Math.max(1, sum(set, 'delivered'))),
        cost: sum(set, 'cost'),
      };
    });

    mount.appendChild(reportPage({
      title: 'Communication analytics',
      subtitle: `${formatNumber(rows.length)} campaigns · ${formatNumber(sum(rows, 'recipients'))} messages · ${formatCurrency(sum(rows, 'cost'), { compact: true })} spent`,
      route: 'communication/reports',
      filters: [
        { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'q1', label: 'Q1' }, { id: 'q2', label: 'Q2' }, { id: 'ytd', label: 'YTD' }], value: 'ytd' },
        { id: 'channel', label: 'Channel', options: CHANNELS.map((c) => c.id) },
        { id: 'status', label: 'Status', options: ['Sent', 'Scheduled', 'Draft', 'Failed'] },
      ],
      onFilter: (id, v, allV, table) => {
        const filtered = applyFilters(scoped(db.messages, ctx), allV, {
          channel: (r, v2) => r.channel === v2,
          status: (r, v2) => r.status === v2,
        });
        if (table) table.refresh(filtered);
      },
      summary: [
        { label: 'Campaigns', value: formatNumber(rows.length), icon: 'megaphone', tone: 'brand' },
        { label: 'Messages sent', value: formatNumber(sum(rows, 'recipients')), icon: 'send', tone: 'info' },
        { label: 'Delivery rate', value: `${pct(sum(rows, 'delivered'), Math.max(1, sum(rows, 'recipients')))}%`, icon: 'check-circle', tone: 'success' },
        { label: 'Spend', value: formatCurrency(sum(rows, 'cost'), { compact: true }), icon: 'rupee', tone: 'warning' },
      ],
      chart: [
        comboChart({
          categories: months.map((m) => formatDate(m + '-01', 'monthYear')),
          bars: [
            { name: 'Delivered', values: months.map((m) => sum(monthly.get(m), 'delivered')) },
            { name: 'Failed', values: months.map((m) => sum(monthly.get(m), 'failed')) },
          ],
          line: { name: 'Opened', values: months.map((m) => sum(monthly.get(m), 'opened')) },
          stacked: true, height: 280,
        }),
        donutChart({ data: byChannel.map((c) => ({ key: c.key, value: c.value })), height: 260, centerLabel: 'Campaigns', centerValue: formatNumber(rows.length) }),
        barChart({
          categories: audience.map((a) => a.key),
          series: [{ name: 'Messages', values: audience.map((a) => a.value) }],
          horizontal: true, height: 280,
        }),
      ],
      chartTitle: 'Delivery, failure and open volume by month',
      notes: Callout({ tone: 'info', icon: 'lightbulb', title: 'What this tells you' },
        'Delivery below 95% on SMS usually means stale phone numbers — export the failed recipients from Delivery Logs and ask the front office to reconfirm them at the next PTM.'),
      columns: [
        { key: 'channel', label: 'Channel', sticky: true, width: 170, render: (r) => Badge(r.channel, { tone: 'info', icon: (CHANNELS.find((c) => c.id === r.channel) || {}).icon }), value: (r) => r.channel },
        { key: 'campaigns', label: 'Campaigns', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'recipients', label: 'Messages', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'delivered', label: 'Delivered', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'failed', label: 'Failed', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'deliveryRate', label: 'Delivery %', width: 160, render: (r) => progressCell(r.deliveryRate, r.deliveryRate >= 95 ? 'success' : 'warning'), value: (r) => r.deliveryRate },
        { key: 'openRate', label: 'Open %', width: 110, align: 'right', numeric: true, render: (r) => `${r.openRate}%`, value: (r) => r.openRate },
        { key: 'cost', label: 'Cost', width: 120, align: 'right', numeric: true, aggregate: 'sum', render: (r) => formatCurrency(r.cost), format: (v) => formatCurrency(v, { compact: true }) },
      ],
      rows: summaryRows,
      tableTitle: 'Channel performance',
      footerAggregates: true,
    }));
  },
};

/* ==========================================================================
   4. PTM — Parent-Teacher Meetings
   ========================================================================== */

const ptmRoutes = {};

function ptmSchedulesFor(ctx) { warmStaff(); return scoped(db.ptmSchedules, ctx); }

function ptmForm(title, schedules) {
  return formPage({
    title, mode: 'modal', size: 'lg', submitLabel: 'Create PTM',
    sections: [{
      title: 'Meeting window', cols: 2,
      fields: [
        { id: 'title', label: 'PTM title', required: true, span: 'full', placeholder: 'PTM — Term 1 (Class VI-VIII)' },
        { id: 'date', label: 'Date', type: 'date', required: true, value: TODAY, validate: (v) => (v && v < TODAY ? 'Pick a future date' : null) },
        { id: 'classes', label: 'Classes covered', required: true, placeholder: 'VI - VIII' },
        { id: 'from', label: 'From', type: 'time', value: '09:00', required: true },
        { id: 'to', label: 'To', type: 'time', value: '13:00', required: true },
        { id: 'slot', label: 'Slot length (minutes)', type: 'select', options: ['8', '10', '12', '15'], value: '10', required: true },
        { id: 'teachers', label: 'Teachers participating', type: 'number', value: 42, required: true },
        { id: 'mode', label: 'Mode', type: 'radio', inline: true, options: ['On campus', 'Online', 'Hybrid'], value: 'On campus' },
        { id: 'notify', label: 'Open booking', type: 'switch', switchLabel: 'Notify parents and open the booking window', value: true },
        { id: 'note', label: 'Note to parents', type: 'textarea', span: 'full', placeholder: 'Please carry the student diary and the last report card.' },
      ],
    }],
    sidebar: [
      Callout({ tone: 'info', icon: 'lightbulb', title: 'Slot maths' },
        'A 4-hour window at 10 minutes per slot gives 24 slots per teacher. With 42 teachers that is 1,008 bookable appointments.'),
      SectionCard({ title: 'Previous PTMs', icon: 'history' },
        RankList(schedules.map((p) => ({ name: p.title, meta: formatDate(p.date), value: `${p.booked}/${p.capacity}` })))),
    ],
    onSubmit: (v) => notify({ title: 'PTM created', text: v.title || 'New PTM', tone: 'success' }),
  });
}

ptmRoutes['ptm/schedule'] = {
  title: 'PTM Schedule', subtitle: 'Meeting windows, capacity and booking status', section: 'ptm',
  render(mount, ctx) {
    injectStyles();
    const rows = ptmSchedulesFor(ctx);
    const open = rows.filter((r) => r.status === 'Open');

    mount.appendChild(listPage({
      title: 'PTM schedule',
      subtitle: `${formatNumber(rows.length)} meeting windows · ${formatNumber(sum(rows, 'booked'))} of ${formatNumber(sum(rows, 'capacity'))} slots booked`,
      route: 'ptm/schedule',
      actions: [
        moreMenu([{ label: 'Download attendance sheet', icon: 'download', onClick: mockAction('Download attendance sheet') }]),
        Button('Generate slots', { variant: 'secondary', icon: 'clock', route: 'ptm/slots' }),
        Button('New PTM', { variant: 'primary', icon: 'plus', onClick: () => ptmForm('Create a PTM', rows) }),
      ],
      kpis: [
        { label: 'Meeting windows', value: formatNumber(rows.length), icon: 'calendar', tone: 'brand' },
        { label: 'Open for booking', value: formatNumber(open.length), icon: 'bookmark', tone: 'success' },
        { label: 'Slots booked', value: `${pct(sum(rows, 'booked'), Math.max(1, sum(rows, 'capacity')))}%`, icon: 'clipboard-check', tone: 'info' },
        { label: 'Teachers involved', value: formatNumber(sum(rows, 'teachers')), icon: 'presentation', tone: 'warning' },
      ],
      chart: bulletChart({
        items: rows.map((p) => ({ label: `${p.title} (${formatDate(p.date, 'dayMonth')})`, value: p.booked, target: p.capacity })),
        height: 240,
      }),
      chartTitle: 'Bookings against capacity',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'PTM title…' },
        { id: 'status', label: 'Status', options: ['Open', 'Completed', 'Cancelled'] },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(rows, allV, {
        q: (r, t) => r.title.toLowerCase().includes(t.toLowerCase()),
        status: (r, v2) => r.status === v2,
      })),
      columns: [
        { key: 'title', label: 'PTM', sticky: true, width: 280, render: (r) => Identity(r.title, `Classes ${r.classes} · ${campusName(r.campusId)}`), value: (r) => r.title },
        { key: 'date', label: 'Date', width: 140, render: (r) => formatDate(r.date) },
        { key: 'from', label: 'Window', width: 140, render: (r) => `${r.from} – ${r.to}`, value: (r) => r.from },
        { key: 'slotMinutes', label: 'Slot', width: 90, align: 'right', numeric: true, render: (r) => `${r.slotMinutes} min`, value: (r) => r.slotMinutes },
        { key: 'teachers', label: 'Teachers', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'booked', label: 'Booked', width: 190, render: (r) => progressCell(pct(r.booked, r.capacity), pct(r.booked, r.capacity) >= 70 ? 'success' : 'warning'), value: (r) => r.booked, aggregate: 'sum' },
        { key: 'capacity', label: 'Capacity', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
      ],
      rows,
      selectable: true, footerAggregates: true, paginate: false,
      searchKeys: ['title', 'classes'],
      expandable: (r) => {
        const slots = db.ptmSlots.filter((s) => s.ptmId === r.id);
        const bookings = db.ptmBookings.filter((b) => b.ptmId === r.id);
        return h('div', { className: 'stack-3' },
          h('div', { className: 'row-4 row-wrap' },
            Tag(`${formatNumber(slots.length)} slots generated`, { icon: 'clock' }),
            Tag(`${formatNumber(bookings.length)} bookings`, { icon: 'bookmark' }),
            Tag(`${formatNumber(bookings.filter((b) => b.status === 'Attended').length)} attended`, { icon: 'clipboard-check' }),
            Tag(`Avg rating ${(avg(bookings.filter((b) => b.rating), 'rating') || 0).toFixed(1)}/5`, { icon: 'star' })),
          h('div', { className: 'row-3 row-wrap' },
            Button('Open booking grid', { variant: 'secondary', size: 'sm', icon: 'grid', onClick: () => navigate('ptm/bookings', { ptm: r.id }) }),
            Button('Day view', { variant: 'ghost', size: 'sm', icon: 'calendar-check', onClick: () => navigate('ptm/appointments', { ptm: r.id }) }),
            Button('Remind unbooked parents', { variant: 'ghost', size: 'sm', icon: 'bell', onClick: () => notify({ title: `Reminder sent to ${formatNumber(r.capacity - r.booked)} families`, tone: 'success' }) })));
      },
      bulkActions: [
        { label: 'Open booking', icon: 'unlock', onClick: (sel) => notify({ title: `${sel.length} PTMs opened for booking`, tone: 'success' }) },
        { label: 'Close booking', icon: 'lock', onClick: (sel) => notify({ title: `${sel.length} PTMs closed`, tone: 'warning' }) },
      ],
      rowActions: (r) => [
        { label: 'Booking grid', icon: 'grid', onClick: () => navigate('ptm/bookings', { ptm: r.id }) },
        { label: 'Teacher slots', icon: 'clock', onClick: () => navigate('ptm/slots', { ptm: r.id }) },
        { label: 'Day view', icon: 'calendar-check', onClick: () => navigate('ptm/appointments', { ptm: r.id }) },
        { separator: true },
        { label: 'Cancel PTM', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: `Cancel ${r.title}?`, text: `${r.booked} parents have already booked and will be notified.`, tone: 'danger', confirmLabel: 'Cancel PTM' }).then((ok) => ok && notify({ title: 'PTM cancelled', tone: 'danger' })) },
      ],
      onRowClick: (r) => navigate('ptm/bookings', { ptm: r.id }),
      emptyState: emptyFor('calendar', 'No PTMs scheduled', 'Create a meeting window and generate teacher slots.',
        Button('New PTM', { variant: 'primary', icon: 'plus', onClick: () => ptmForm('Create a PTM', rows) })),
    }));
  },
};

/* ------------------------------------------------------- ptm / slots ---- */

ptmRoutes['ptm/slots'] = {
  title: 'Teacher Slots', subtitle: 'Generate and manage the bookable slot grid', section: 'ptm',
  render(mount, ctx) {
    injectStyles();
    const schedules = ptmSchedulesFor(ctx);
    if (!schedules.length) {
      return mount.appendChild(page({
        title: 'Teacher slots', route: 'ptm/slots',
        children: Card({ pad: true }, emptyFor('clock', 'No PTM to generate slots for', 'Create a PTM window first.',
          Button('Go to PTM schedule', { variant: 'primary', route: 'ptm/schedule' }))),
      }));
    }
    const requested = ctx.query && ctx.query.ptm ? byId(schedules, ctx.query.ptm) : null;
    let ptm = requested || schedules[0];
    const teachers = db.staff.filter((s) => s.type === 'Teaching' && s.campusId === ptm.campusId).slice(0, 12);

    const gen = { from: ptm.from, to: ptm.to, slot: ptm.slotMinutes, breakStart: '11:00', breakMin: 20, teachers: teachers.slice(0, 6).map((t) => t.id) };
    const previewHost = h('div', null);

    const buildTimes = () => {
      const out = [];
      const [fh, fm] = gen.from.split(':').map(Number);
      const [th, tm] = gen.to.split(':').map(Number);
      let cur = fh * 60 + fm;
      const end = th * 60 + tm;
      const bStart = Number(gen.breakStart.split(':')[0]) * 60 + Number(gen.breakStart.split(':')[1]);
      let guard = 0;
      while (cur + Number(gen.slot) <= end && guard++ < 120) {
        const isBreak = cur >= bStart && cur < bStart + Number(gen.breakMin);
        out.push({ time: `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`, isBreak });
        cur += isBreak ? Number(gen.breakMin) : Number(gen.slot);
      }
      return out;
    };

    const paintPreview = () => {
      const times = buildTimes();
      const chosen = teachers.filter((t) => gen.teachers.includes(t.id));
      previewHost.innerHTML = '';
      if (!chosen.length) {
        previewHost.appendChild(emptyFor('users', 'Pick at least one teacher', 'Select teachers on the left to preview their slot grid.'));
        return;
      }
      const grid = h('div', { className: 'eng-slotgrid', style: { gridTemplateColumns: `160px repeat(${times.length}, 74px)` } });
      grid.appendChild(h('div', { className: 'eng-slothead t-left' }, 'Teacher'));
      times.forEach((t) => grid.appendChild(h('div', { className: 'eng-slothead' }, t.isBreak ? 'Break' : t.time)));
      chosen.forEach((t, ti) => {
        grid.appendChild(h('div', { className: 't-sm t-truncate', style: { paddingTop: 'var(--sp-2)' } }, t.name));
        times.forEach((slot, si) => {
          const booked = !slot.isBreak && ((ti * 7 + si * 3) % 5 < 3);
          grid.appendChild(h('button', {
            type: 'button', className: 'eng-slot',
            dataset: { state: slot.isBreak ? 'blocked' : booked ? 'booked' : 'free' },
            attrs: { 'aria-label': `${t.name} at ${slot.time}: ${slot.isBreak ? 'break' : booked ? 'booked' : 'available'}`, disabled: slot.isBreak ? 'disabled' : null },
            onClick: () => { if (!slot.isBreak) notify({ title: booked ? 'Slot already booked' : 'Slot marked unavailable', text: `${t.name} · ${slot.time}`, tone: booked ? 'warning' : 'info' }); },
          }, slot.isBreak ? '—' : slot.time));
        });
      });
      previewHost.appendChild(grid);
      previewHost.appendChild(h('div', { className: 'row-4 row-wrap mt-3' },
        Tag(`${chosen.length} teachers`, { icon: 'users' }),
        Tag(`${times.filter((t) => !t.isBreak).length} slots each`, { icon: 'clock' }),
        Tag(`${chosen.length * times.filter((t) => !t.isBreak).length} bookable appointments`, { icon: 'bookmark' })));
    };
    paintPreview();

    const existing = db.ptmSlots.filter((s) => s.ptmId === ptm.id);

    mount.appendChild(page({
      title: 'Teacher slot generator',
      subtitle: `${ptm.title} · ${formatDate(ptm.date)} · ${formatNumber(existing.length)} slots already generated`,
      route: 'ptm/slots',
      actions: [
        moreMenu([{ label: 'Print slot sheets', icon: 'print', onClick: mockAction('Print slot sheets') }]),
        Button('Booking grid', { variant: 'secondary', icon: 'grid', onClick: () => navigate('ptm/bookings', { ptm: ptm.id }) }),
        Button('Generate slots', {
          variant: 'primary', icon: 'refresh',
          onClick: () => ConfirmDialog({
            title: 'Generate slots?',
            text: 'Existing unbooked slots for this PTM will be replaced. Booked appointments are preserved.',
            confirmLabel: 'Generate', tone: 'brand', icon: 'refresh',
          }).then((ok) => ok && notify({ title: 'Slots generated', text: `${ptm.title}`, tone: 'success' })),
        }),
      ],
      children: [
        Card({ className: 'p-0' }, FilterBar({
          filters: [{ id: 'ptm', label: 'PTM', width: '320px', value: ptm.id, options: schedules.map((p) => ({ value: p.id, label: `${p.title} · ${formatDate(p.date, 'dayMonth')}` })) }],
          onChange: (id, v) => { const f = byId(schedules, v); if (f) navigate('ptm/slots', { ptm: f.id }); },
        })),
        kpiRow([
          { label: 'Slots generated', value: formatNumber(existing.length), icon: 'clock', tone: 'brand' },
          { label: 'Booked', value: formatNumber(existing.filter((s) => s.status === 'Booked').length), icon: 'bookmark', tone: 'success' },
          { label: 'Available', value: formatNumber(existing.filter((s) => s.status === 'Available').length), icon: 'check-circle', tone: 'info' },
          { label: 'Utilisation', value: `${pct(existing.filter((s) => s.status === 'Booked').length, Math.max(1, existing.length))}%`, icon: 'gauge', tone: 'warning' },
        ]),
        h('div', { className: 'detail-split' },
          h('div', { className: 'stack' },
            SectionCard({ title: 'Slot preview', icon: 'grid', subtitle: 'Blue cells are already booked; grey cells are the staff break' }, previewHost),
            SectionCard({ title: 'Generated slots', flush: true, subtitle: `${formatNumber(existing.length)} rows` },
              DataTable({
                columns: [
                  { key: 'teacherName', label: 'Teacher', sticky: true, width: 200, render: (r) => Identity(r.teacherName, r.room), value: (r) => r.teacherName },
                  { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date) },
                  { key: 'startTime', label: 'From', width: 90 },
                  { key: 'endTime', label: 'To', width: 90 },
                  { key: 'room', label: 'Room', width: 120, filter: true },
                  { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
                ],
                rows: existing, selectable: true, pageSize: 25, exportName: 'ptm-slots',
                searchKeys: ['teacherName', 'room', 'startTime'],
                bulkActions: [
                  { label: 'Block slots', icon: 'lock', onClick: (sel) => notify({ title: `${sel.length} slots blocked`, tone: 'warning' }) },
                  { label: 'Release slots', icon: 'unlock', onClick: (sel) => notify({ title: `${sel.length} slots released`, tone: 'success' }) },
                ],
                rowActions: (r) => [
                  { label: 'See booking', icon: 'eye', onClick: () => navigate('ptm/bookings', { ptm: r.ptmId }) },
                  { label: 'Block this slot', icon: 'lock', onClick: mockAction('Block slot') },
                ],
                emptyState: emptyFor('clock', 'No slots yet', 'Set the window on the right and press Generate slots.'),
              }))),
          h('div', { className: 'stack-3' },
            SectionCard({ title: 'Generator settings', icon: 'settings' },
              FormGrid({ cols: 2 },
                Field({ label: 'From', required: true }, TimePicker({ value: gen.from, onChange: (v) => { gen.from = v; paintPreview(); } })),
                Field({ label: 'To', required: true }, TimePicker({ value: gen.to, onChange: (v) => { gen.to = v; paintPreview(); } })),
                Field({ label: 'Slot length', required: true }, Select({ options: ['8', '10', '12', '15', '20'], value: String(gen.slot), onChange: (v) => { gen.slot = Number(v); paintPreview(); } })),
                Field({ label: 'Break at' }, TimePicker({ value: gen.breakStart, onChange: (v) => { gen.breakStart = v; paintPreview(); } })),
                Field({ label: 'Break length (min)' }, Input({ type: 'number', value: String(gen.breakMin), numeric: true, onInput: (v) => { gen.breakMin = Number(v) || 0; paintPreview(); } })),
                Field({ label: 'Buffer between parents' }, Select({ options: ['None', '2 minutes', '5 minutes'], value: 'None' })))),
            SectionCard({ title: 'Teachers', icon: 'users', subtitle: 'Slots are generated for the selected teachers' },
              h('div', { className: 'stack-1' },
                teachers.map((t) => Checkbox(`${t.name} · ${t.designation}`, {
                  checked: gen.teachers.includes(t.id),
                  onChange: (on) => {
                    const i = gen.teachers.indexOf(t.id);
                    if (on && i < 0) gen.teachers.push(t.id);
                    if (!on && i >= 0) gen.teachers.splice(i, 1);
                    paintPreview();
                  },
                })))),
            Callout({ tone: 'info', icon: 'info', title: 'Parents see this instantly' },
              'Generated slots appear on the parent portal within a minute; parents can book one slot per teacher per child.'))),
      ],
    }));
  },
};

/* ---------------------------------------------------- ptm / bookings ---- */

ptmRoutes['ptm/bookings'] = {
  title: 'Parent Bookings', subtitle: 'The bookable grid of teachers against time slots', section: 'ptm',
  render(mount, ctx) {
    injectStyles();
    const schedules = ptmSchedulesFor(ctx);
    if (!schedules.length) {
      return mount.appendChild(page({
        title: 'Parent bookings', route: 'ptm/bookings',
        children: Card({ pad: true }, emptyFor('bookmark', 'No PTM available', 'Create a PTM before parents can book.',
          Button('PTM schedule', { variant: 'primary', route: 'ptm/schedule' }))),
      }));
    }
    const ptm = (ctx.query && ctx.query.ptm ? byId(schedules, ctx.query.ptm) : null) || schedules[0];
    const slots = db.ptmSlots.filter((s) => s.ptmId === ptm.id);
    const bookings = db.ptmBookings.filter((b) => b.ptmId === ptm.id);
    const bookingBySlot = new Map(bookings.map((b) => [b.slotId, b]));

    const teacherIds = [...new Set(slots.map((s) => s.teacherId))].slice(0, 14);
    const times = [...new Set(slots.map((s) => s.startTime))].sort().slice(0, 12);

    const bookSlot = (slot, teacher) => {
      const existing = bookingBySlot.get(slot.id);
      if (existing) {
        return Drawer({
          title: 'Booked appointment', subtitle: `${teacher} · ${slot.startTime}–${slot.endTime}`, size: 'md',
          body: h('div', { className: 'stack-4' },
            h('div', { className: 'row-3' }, Avatar(existing.studentName, { size: 'lg' }),
              h('div', { className: 'flex-1 min-0' },
                h('div', { className: 't-medium' }, existing.studentName),
                h('div', { className: 't-sm t-muted' }, `${existing.className}-${existing.section}`))),
            DescriptionList([
              ['Parent', existing.parentName],
              ['Phone', existing.parentPhone],
              ['Teacher', existing.teacherName],
              ['Slot', `${formatDate(existing.date)} · ${existing.time}`],
              ['Room', slot.room],
              ['Status', Badge(existing.status)],
              ['Notes', existing.notes || '—'],
            ], { cols: 1 })),
          actions: (close) => frag(
            Button('Cancel booking', { variant: 'ghost', tone: 'danger', icon: 'x-circle', onClick: () => { close(); ConfirmDialog({ title: 'Cancel this booking?', text: 'The parent will be notified and the slot released.', tone: 'danger', confirmLabel: 'Cancel booking' }).then((ok) => ok && notify({ title: 'Booking cancelled', tone: 'danger' })); } }),
            Button('Open student', { variant: 'secondary', icon: 'user', onClick: () => { close(); navigate(`students/profile/${existing.studentId}`); } }),
            Button('Message parent', { variant: 'primary', icon: 'send', route: 'communication/compose' })),
        });
      }
      formPage({
        title: 'Book this slot', mode: 'modal', size: 'md', submitLabel: 'Confirm booking',
        sections: [{
          title: `${teacher} · ${slot.startTime}–${slot.endTime}`, cols: 1,
          fields: [
            { id: 'student', label: 'Student', type: 'combobox', required: true, options: db.students.slice(0, 200).map((s) => ({ value: s.id, label: `${s.name} · ${s.className}-${s.section}` })) },
            { id: 'parent', label: 'Attending parent', type: 'radio', inline: true, options: ['Father', 'Mother', 'Guardian'], value: 'Father' },
            { id: 'phone', label: 'Contact number', type: 'tel', validate: validators.phone },
            { id: 'topic', label: 'What would you like to discuss?', type: 'textarea' },
          ],
        }],
        onSubmit: () => notify({ title: 'Slot booked', text: `${teacher} · ${slot.startTime}`, tone: 'success' }),
      });
    };

    const grid = h('div', { className: 'eng-slotgrid', style: { gridTemplateColumns: `180px repeat(${times.length}, 74px)` } });
    grid.appendChild(h('div', { className: 'eng-slothead t-left' }, 'Teacher'));
    times.forEach((t) => grid.appendChild(h('div', { className: 'eng-slothead' }, t)));
    for (const tid of teacherIds) {
      const tSlots = slots.filter((s) => s.teacherId === tid);
      const tName = tSlots[0] ? tSlots[0].teacherName : staffName(tid);
      grid.appendChild(h('div', { className: 't-sm t-truncate', style: { paddingTop: 'var(--sp-2)' } }, tName));
      for (const time of times) {
        const slot = tSlots.find((s) => s.startTime === time);
        if (!slot) { grid.appendChild(h('div', { className: 'eng-slot', dataset: { state: 'blocked' } }, '—')); continue; }
        const booked = slot.status === 'Booked';
        grid.appendChild(h('button', {
          type: 'button', className: 'eng-slot', dataset: { state: booked ? 'booked' : 'free' },
          attrs: { 'aria-label': `${tName} at ${time}: ${booked ? 'booked' : 'available'}` },
          onClick: () => bookSlot(slot, tName),
        }, booked ? Icon('user-check', 13) : time));
      }
    }

    mount.appendChild(page({
      title: 'Parent booking grid',
      subtitle: `${ptm.title} · ${formatDate(ptm.date)} · ${formatNumber(bookings.length)} bookings across ${formatNumber(slots.length)} slots`,
      route: 'ptm/bookings',
      actions: [
        moreMenu([{ label: 'Export booking sheet', icon: 'download', onClick: mockAction('Export bookings') }]),
        Button('Day view', { variant: 'secondary', icon: 'calendar-check', onClick: () => navigate('ptm/appointments', { ptm: ptm.id }) }),
        Button('Remind unbooked parents', { variant: 'primary', icon: 'bell', onClick: () => notify({ title: `Reminder sent to ${formatNumber(Math.max(0, ptm.capacity - ptm.booked))} families`, tone: 'success' }) }),
      ],
      children: [
        Card({ className: 'p-0' }, FilterBar({
          filters: [
            { id: 'ptm', label: 'PTM', width: '320px', value: ptm.id, options: schedules.map((p) => ({ value: p.id, label: `${p.title} · ${formatDate(p.date, 'dayMonth')}` })) },
            { id: 'status', label: 'Booking status', options: ['Confirmed', 'Attended', 'Cancelled', 'No Show'] },
          ],
          onChange: (id, v) => { if (id === 'ptm') { const f = byId(schedules, v); if (f) navigate('ptm/bookings', { ptm: f.id }); } },
        })),
        kpiRow([
          { label: 'Slots', value: formatNumber(slots.length), icon: 'clock', tone: 'brand' },
          { label: 'Booked', value: formatNumber(slots.filter((s) => s.status === 'Booked').length), icon: 'bookmark', tone: 'success' },
          { label: 'Available', value: formatNumber(slots.filter((s) => s.status === 'Available').length), icon: 'check-circle', tone: 'info' },
          { label: 'Cancelled', value: formatNumber(bookings.filter((b) => b.status === 'Cancelled').length), icon: 'x-circle', tone: 'danger' },
        ]),
        SectionCard({
          title: 'Booking grid', icon: 'grid',
          subtitle: 'Click an empty slot to book it, or a booked slot to see the appointment',
          actions: h('div', { className: 'row-3' },
            h('span', { className: 'row', style: { gap: 'var(--sp-1)' } }, h('span', { className: 'eng-slot', dataset: { state: 'free' }, style: { minWidth: '20px', padding: '2px' } }, ''), h('span', { className: 't-xs t-muted' }, 'Available')),
            h('span', { className: 'row', style: { gap: 'var(--sp-1)' } }, h('span', { className: 'eng-slot', dataset: { state: 'booked' }, style: { minWidth: '20px', padding: '2px' } }, ''), h('span', { className: 't-xs t-muted' }, 'Booked'))),
        }, grid),
        SectionCard({ title: 'All bookings', flush: true, subtitle: `${formatNumber(bookings.length)} parents booked` },
          DataTable({
            columns: [
              { key: 'studentName', label: 'Student', sticky: true, width: 220, render: (r) => Identity(r.studentName, `${r.className}-${r.section}`), value: (r) => r.studentName },
              { key: 'parentName', label: 'Parent', width: 190, render: (r) => Identity(r.parentName, r.parentPhone), value: (r) => r.parentName },
              { key: 'teacherName', label: 'Teacher', width: 190, render: (r) => teacherLink(r.teacherName, r.teacherId), value: (r) => r.teacherName },
              { key: 'date', label: 'Date', width: 120, render: (r) => formatDate(r.date) },
              { key: 'time', label: 'Time', width: 90 },
              { key: 'notes', label: 'Agenda', width: 250, render: (r) => h('span', { className: 't-sm t-muted t-clamp-2' }, r.notes || '—') },
              { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
            ],
            rows: bookings, selectable: true, pageSize: 25, exportName: 'ptm-bookings',
            searchKeys: ['studentName', 'parentName', 'teacherName', 'className'],
            bulkActions: [
              { label: 'Send reminder', icon: 'bell', onClick: (sel) => notify({ title: `Reminder sent to ${sel.length} parents`, tone: 'success' }) },
              { label: 'Mark attended', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} marked attended`, tone: 'success' }) },
            ],
            rowActions: (r) => [
              { label: 'Open student', icon: 'user', onClick: () => navigate(`students/profile/${r.studentId}`) },
              { label: 'Add meeting note', icon: 'notebook', onClick: () => navigate('ptm/notes') },
              { separator: true },
              { label: 'Cancel booking', icon: 'x-circle', tone: 'danger', onClick: mockAction('Cancel booking') },
            ],
            emptyState: emptyFor('bookmark', 'No bookings yet', 'Parents will appear here as they book slots.'),
          })),
      ],
    }));
  },
};

/* ------------------------------------------------ ptm / appointments ---- */

ptmRoutes['ptm/appointments'] = {
  title: 'Appointments', subtitle: 'Day view of every appointment by teacher', section: 'ptm',
  render(mount, ctx) {
    injectStyles();
    const schedules = ptmSchedulesFor(ctx);
    if (!schedules.length) {
      return mount.appendChild(page({
        title: 'Appointments', route: 'ptm/appointments',
        children: Card({ pad: true }, emptyFor('calendar-check', 'No PTM scheduled', 'Create a PTM to see the day view.', Button('PTM schedule', { variant: 'primary', route: 'ptm/schedule' }))),
      }));
    }
    const ptm = (ctx.query && ctx.query.ptm ? byId(schedules, ctx.query.ptm) : null) || schedules[0];
    const bookings = sortBy(db.ptmBookings.filter((b) => b.ptmId === ptm.id), 'time');
    const teachers = [...new Set(bookings.map((b) => b.teacherName))].slice(0, 10);

    const columns = h('div', { className: 'eng-scroll-x' },
      teachers.map((t) => {
        const mine = bookings.filter((b) => b.teacherName === t);
        return h('div', { className: 'eng-daycol' },
          h('div', { className: 'eng-daycol-head' },
            h('div', { className: 'row-3' },
              Avatar(t, { size: 'xs' }),
              h('div', { className: 'min-0' },
                h('div', { className: 't-sm t-medium t-truncate' }, t),
                h('div', { className: 't-xs t-muted' }, `${mine.length} appointments`)))),
          mine.length ? mine.slice(0, 14).map((b) => h('div', {
            className: 'eng-appt', style: { cursor: 'pointer' },
            onClick: () => Drawer({
              title: b.studentName, subtitle: `${b.time} · ${b.teacherName}`, size: 'md',
              body: h('div', { className: 'stack-4' },
                DescriptionList([
                  ['Parent', b.parentName], ['Phone', b.parentPhone],
                  ['Class', `${b.className}-${b.section}`], ['Date', formatDate(b.date)],
                  ['Time', b.time], ['Status', Badge(b.status)],
                ], { cols: 1 }),
                SectionCard({ title: 'Agenda', icon: 'notebook' }, h('div', { className: 't-sm' }, b.notes || 'No agenda shared by the parent.')),
                SectionCard({ title: 'Quick actions', icon: 'zap' },
                  h('div', { className: 'row-3 row-wrap' },
                    Button('Mark attended', { variant: 'success', size: 'sm', icon: 'check', onClick: () => notify({ title: 'Marked attended', tone: 'success' }) }),
                    Button('Mark no-show', { variant: 'ghost', size: 'sm', icon: 'user-x', onClick: () => notify({ title: 'Marked no-show', tone: 'warning' }) }),
                    Button('Open student 360', { variant: 'secondary', size: 'sm', icon: 'user', onClick: () => navigate(`students/profile/${b.studentId}`) })))),
            }),
          },
            h('div', { className: 'row-3' },
              h('span', { className: 't-xs t-num t-muted', style: { minWidth: '38px' } }, b.time),
              h('span', { className: 'flex-1 min-0 t-truncate' }, b.studentName),
              Badge(b.status, { size: 'sm' })),
            h('div', { className: 't-xs t-muted t-truncate' }, `${b.className}-${b.section} · ${b.parentName}`)))
            : h('div', { className: 'card-pad' }, h('div', { className: 't-sm t-muted' }, 'No appointments booked.')));
      }));

    const statusMap = statusCounts(bookings);

    mount.appendChild(page({
      title: 'Appointment day view',
      subtitle: `${ptm.title} · ${formatDate(ptm.date)} · ${formatNumber(bookings.length)} appointments`,
      route: 'ptm/appointments',
      actions: [
        moreMenu([{ label: 'Print teacher sheets', icon: 'print', onClick: mockAction('Print sheets') }]),
        Button('Booking grid', { variant: 'secondary', icon: 'grid', onClick: () => navigate('ptm/bookings', { ptm: ptm.id }) }),
        Button('Start check-in', { variant: 'primary', icon: 'user-check', onClick: () => notify({ title: 'Check-in desk opened', text: 'Front office can now mark arrivals.', tone: 'success' }) }),
      ],
      children: [
        Card({ className: 'p-0' }, FilterBar({
          filters: [
            { id: 'ptm', label: 'PTM', width: '320px', value: ptm.id, options: schedules.map((p) => ({ value: p.id, label: `${p.title} · ${formatDate(p.date, 'dayMonth')}` })) },
            { id: 'teacher', label: 'Teacher', options: teachers },
            { id: 'status', label: 'Status', options: ['Confirmed', 'Attended', 'Cancelled', 'No Show'] },
          ],
          onChange: (id, v) => { if (id === 'ptm') { const f = byId(schedules, v); if (f) navigate('ptm/appointments', { ptm: f.id }); } },
        })),
        kpiRow([
          { label: 'Appointments', value: formatNumber(bookings.length), icon: 'calendar-check', tone: 'brand' },
          { label: 'Attended', value: formatNumber(statusMap.get('Attended') || 0), icon: 'user-check', tone: 'success' },
          { label: 'Confirmed', value: formatNumber(statusMap.get('Confirmed') || 0), icon: 'clock', tone: 'info' },
          { label: 'No shows', value: formatNumber(statusMap.get('No Show') || 0), icon: 'user-x', tone: 'danger' },
        ]),
        SectionCard({ title: 'Teacher columns', icon: 'columns', subtitle: 'Scroll sideways for more teachers · click an appointment to open it' }, columns),
        h('div', { className: 'widget-grid' },
          h('div', { className: 'span-6' }, SectionCard({ title: 'Appointments per hour', className: 'chart-card' },
            chartOrEmpty([...new Set(bookings.map((b) => b.time.slice(0, 2) + ':00'))].sort(), () => barChart({
              categories: [...new Set(bookings.map((b) => b.time.slice(0, 2) + ':00'))].sort(),
              series: [{ name: 'Appointments', values: [...new Set(bookings.map((b) => b.time.slice(0, 2) + ':00'))].sort().map((hh) => bookings.filter((b) => b.time.startsWith(hh.slice(0, 2))).length) }],
              height: 240, showValues: true,
            }), 'No parent has booked a slot for this PTM yet.'))),
          h('div', { className: 'span-6' }, SectionCard({ title: 'Status split', className: 'chart-card' },
            chartOrEmpty([...statusMap.keys()], () => donutChart({ data: [...statusMap.entries()].map(([k, v]) => ({ key: k, value: v })), height: 240, centerLabel: 'Appointments', centerValue: formatNumber(bookings.length) }), 'Bookings will appear here once parents start booking.')))),
      ],
    }));
  },
};

/* -------------------------------------------------------- ptm / notes --- */

ptmRoutes['ptm/notes'] = {
  title: 'Meeting Notes', subtitle: 'What was discussed and what was agreed', section: 'ptm',
  render(mount, ctx) {
    injectStyles();
    const rows = scoped(db.ptmBookings, ctx).filter((b) => b.status === 'Attended' || b.notes);

    const openNote = (b) => {
      const notes = Textarea({ value: b.notes || '', rows: 5, placeholder: 'Summarise what was discussed…' });
      const actionText = Textarea({ rows: 3, placeholder: 'Agreed actions — who does what, by when?' });
      Drawer({
        title: `Meeting note — ${b.studentName}`, subtitle: `${b.teacherName} · ${formatDate(b.date)} ${b.time}`, size: 'lg',
        body: h('div', { className: 'stack-4' },
          h('div', { className: 'row-3' },
            Avatar(b.studentName, { size: 'lg' }),
            h('div', { className: 'flex-1 min-0' },
              h('div', { className: 't-medium' }, b.studentName),
              h('div', { className: 't-sm t-muted' }, `${b.className}-${b.section} · parent ${b.parentName}`)),
            Badge(b.status)),
          Field({ label: 'Discussion summary', required: true }, notes),
          Field({ label: 'Agreed actions' }, actionText),
          FormGrid({ cols: 2 },
            Field({ label: 'Focus area' }, Select({ options: ['Academics', 'Attendance', 'Behaviour', 'Health', 'Career guidance', 'Co-curricular'] })),
            Field({ label: 'Follow-up needed' }, Switch('Schedule a follow-up meeting')),
            Field({ label: 'Follow-up date' }, DatePicker({ value: '2026-09-15' })),
            Field({ label: 'Share with' }, MultiSelect({ options: ['Parent', 'Class teacher', 'Counsellor', 'Principal'], values: ['Parent', 'Class teacher'] }))),
          SectionCard({ title: 'Context', icon: 'chart-line' },
            DescriptionList([
              ['Attendance', `${(byId(db.students, b.studentId) || {}).attendancePct || '—'}%`],
              ['Last exam', `${(byId(db.students, b.studentId) || {}).lastExamPercent || '—'}%`],
              ['Behaviour score', String((byId(db.students, b.studentId) || {}).behaviourScore || '—')],
              ['Awards', String((byId(db.students, b.studentId) || {}).awardsCount || 0)],
            ], { cols: 2 }))),
        actions: (close) => frag(
          Button('Cancel', { variant: 'ghost', onClick: close }),
          Button('Save & share with parent', { variant: 'primary', icon: 'send', onClick: () => { close(); notify({ title: 'Note saved and shared', text: b.studentName, tone: 'success' }); } })),
      });
    };

    mount.appendChild(listPage({
      title: 'Meeting notes',
      subtitle: `${formatNumber(rows.length)} meetings with recorded notes`,
      route: 'ptm/notes',
      actions: [
        moreMenu([{ label: 'Export notes pack', icon: 'download', onClick: mockAction('Export notes') }]),
        Button('Feedback', { variant: 'secondary', icon: 'star', route: 'ptm/feedback' }),
        Button('Add a note', { variant: 'primary', icon: 'plus', onClick: () => rows.length && openNote(rows[0]) }),
      ],
      kpis: [
        { label: 'Notes recorded', value: formatNumber(rows.filter((r) => r.notes).length), icon: 'notebook', tone: 'brand' },
        { label: 'Meetings attended', value: formatNumber(rows.filter((r) => r.status === 'Attended').length), icon: 'user-check', tone: 'success' },
        { label: 'Follow-ups pending', value: formatNumber(Math.round(rows.length * 0.18)), icon: 'clock', tone: 'warning' },
        { label: 'Shared with parents', value: `${pct(rows.filter((r) => r.notes).length, Math.max(1, rows.length))}%`, icon: 'send', tone: 'info' },
      ],
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Student, parent or teacher…' },
        { id: 'className', label: 'Class', options: [...new Set(rows.map((r) => r.className))] },
        { id: 'teacherName', label: 'Teacher', options: [...new Set(rows.map((r) => r.teacherName))].slice(0, 50) },
        { id: 'status', label: 'Status', options: ['Confirmed', 'Attended', 'Cancelled', 'No Show'] },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(rows, allV, {
        q: (r, t) => (r.studentName + r.parentName + r.teacherName).toLowerCase().includes(t.toLowerCase()),
        className: (r, v2) => r.className === v2,
        teacherName: (r, v2) => r.teacherName === v2,
        status: (r, v2) => r.status === v2,
      })),
      columns: [
        { key: 'studentName', label: 'Student', sticky: true, width: 220, render: (r) => Identity(r.studentName, `${r.className}-${r.section}`), value: (r) => r.studentName },
        { key: 'parentName', label: 'Parent', width: 180, render: (r) => Identity(r.parentName, r.parentPhone), value: (r) => r.parentName },
        { key: 'teacherName', label: 'Teacher', width: 180, render: (r) => teacherLink(r.teacherName, r.teacherId), value: (r) => r.teacherName },
        { key: 'date', label: 'Date', width: 120, render: (r) => formatDate(r.date) },
        { key: 'notes', label: 'Note', width: 320, render: (r) => (r.notes ? h('span', { className: 't-sm t-clamp-2' }, r.notes) : h('span', { className: 't-muted t-sm' }, 'No note recorded')) },
        { key: 'rating', label: 'Parent rating', width: 140, render: (r) => (r.rating ? Rating(r.rating, { showValue: true }) : h('span', { className: 't-muted' }, '—')), value: (r) => r.rating || 0 },
        { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
      ],
      rows,
      selectable: true, pageSize: 25,
      searchKeys: ['studentName', 'parentName', 'teacherName', 'notes'],
      bulkActions: [
        { label: 'Share with parents', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} notes shared`, tone: 'success' }) },
        { label: 'Flag for follow-up', icon: 'flag', onClick: (sel) => notify({ title: `${sel.length} meetings flagged`, tone: 'warning' }) },
      ],
      rowActions: (r) => [
        { label: 'Open note', icon: 'notebook', onClick: () => openNote(r) },
        { label: 'Open student 360', icon: 'user', onClick: () => navigate(`students/profile/${r.studentId}`) },
        { label: 'Message parent', icon: 'send', route: 'communication/compose' },
      ],
      onRowClick: openNote,
      emptyState: emptyFor('notebook', 'No meeting notes yet', 'Notes recorded during a PTM appear here and can be shared with parents.'),
    }));
  },
};

/* ----------------------------------------------------- ptm / feedback --- */

ptmRoutes['ptm/feedback'] = {
  title: 'Feedback', subtitle: 'How parents rated their PTM experience', section: 'ptm',
  render(mount, ctx) {
    injectStyles();
    const all = scoped(db.ptmBookings, ctx);
    const rated = all.filter((b) => b.rating);
    const dist = [1, 2, 3, 4, 5].map((n) => rated.filter((r) => r.rating === n).length);
    const byTeacher = sortBy([...groupBy(rated, 'teacherName')].map(([name, items]) => ({
      name, meta: `${items.length} responses`, value: (avg(items, 'rating') || 0).toFixed(1), avatar: name,
      score: avg(items, 'rating') || 0,
    })), 'score', 'desc');

    mount.appendChild(page({
      title: 'PTM feedback',
      subtitle: `${formatNumber(rated.length)} parent ratings · average ${(avg(rated, 'rating') || 0).toFixed(2)} out of 5`,
      route: 'ptm/feedback',
      actions: [
        moreMenu([{ label: 'Export feedback', icon: 'download', onClick: mockAction('Export feedback') }]),
        Button('Meeting notes', { variant: 'secondary', icon: 'notebook', route: 'ptm/notes' }),
        Button('Request feedback', { variant: 'primary', icon: 'send', onClick: () => notify({ title: `Feedback request sent to ${formatNumber(all.length - rated.length)} parents`, tone: 'success' }) }),
      ],
      children: [
        kpiRow([
          { label: 'Responses', value: formatNumber(rated.length), icon: 'star', tone: 'brand' },
          { label: 'Average rating', value: (avg(rated, 'rating') || 0).toFixed(2), icon: 'award', tone: 'success' },
          { label: 'Response rate', value: `${pct(rated.length, Math.max(1, all.length))}%`, icon: 'percent', tone: 'info' },
          { label: 'Detractors (≤2)', value: formatNumber(rated.filter((r) => r.rating <= 2).length), icon: 'frown', tone: 'danger' },
        ]),
        h('div', { className: 'widget-grid' },
          h('div', { className: 'span-5' }, SectionCard({ title: 'Rating distribution', className: 'chart-card' },
            barChart({
              categories: ['1 star', '2 stars', '3 stars', '4 stars', '5 stars'],
              series: [{ name: 'Responses', values: dist }],
              horizontal: true, height: 240, showValues: true,
            }))),
          h('div', { className: 'span-7' }, SectionCard({ title: 'Highest rated teachers', icon: 'trophy', subtitle: 'Minimum 5 responses' },
            byTeacher.length ? RankList(byTeacher.slice(0, 8)) : emptyFor('star', 'No ratings yet', 'Ratings appear once parents complete the feedback form.'))),
          h('div', { className: 'span-12' }, SectionCard({ title: 'All feedback', flush: true },
            DataTable({
              columns: [
                { key: 'studentName', label: 'Student', sticky: true, width: 210, render: (r) => Identity(r.studentName, `${r.className}-${r.section}`), value: (r) => r.studentName },
                { key: 'parentName', label: 'Parent', width: 180 },
                { key: 'teacherName', label: 'Teacher', width: 190, render: (r) => teacherLink(r.teacherName, r.teacherId), value: (r) => r.teacherName },
                { key: 'date', label: 'Meeting date', width: 140, render: (r) => formatDate(r.date) },
                { key: 'rating', label: 'Rating', width: 160, render: (r) => Rating(r.rating, { showValue: true }), value: (r) => r.rating, aggregate: 'avg', format: (v) => v.toFixed(2) },
                { key: 'notes', label: 'Comment', width: 300, render: (r) => h('span', { className: 't-sm t-muted t-clamp-2' }, r.notes || '—') },
                { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
              ],
              rows: rated, footerAggregates: true, pageSize: 25, exportName: 'ptm-feedback',
              searchKeys: ['studentName', 'parentName', 'teacherName'],
              rowActions: (r) => [
                { label: 'Open student', icon: 'user', onClick: () => navigate(`students/profile/${r.studentId}`) },
                { label: 'Thank the parent', icon: 'send', onClick: () => notify({ title: 'Thank-you message queued', tone: 'success' }) },
              ],
              emptyState: emptyFor('star', 'No feedback recorded', 'Send a feedback request after the next PTM.'),
            }))),
          h('div', { className: 'span-12' }, Callout({ tone: 'info', icon: 'lightbulb', title: 'Acting on feedback' },
            'Ratings of 2 or below automatically create a follow-up task for the class teacher and are reviewed by the Vice-Principal within a week.'))),
      ],
    }));
  },
};

/* ------------------------------------------------------ ptm / reports --- */

ptmRoutes['ptm/reports'] = {
  title: 'PTM Reports', subtitle: 'Attendance, participation and outcome analytics', section: 'ptm',
  render(mount, ctx) {
    injectStyles();
    const schedules = ptmSchedulesFor(ctx);
    const bookings = scoped(db.ptmBookings, ctx);

    const rows = schedules.map((p) => {
      const mine = bookings.filter((b) => b.ptmId === p.id);
      const attended = mine.filter((b) => b.status === 'Attended').length;
      const noShow = mine.filter((b) => b.status === 'No Show').length;
      return {
        id: p.id, title: p.title, date: p.date, classes: p.classes,
        campus: campusName(p.campusId),
        capacity: p.capacity, booked: p.booked,
        bookingRate: pct(p.booked, Math.max(1, p.capacity)),
        attended, noShow,
        attendanceRate: pct(attended, Math.max(1, mine.length)),
        rating: Number((avg(mine.filter((b) => b.rating), 'rating') || 0).toFixed(2)),
        status: p.status,
      };
    });

    const byClass = sortBy([...groupBy(bookings, 'className')].map(([k, v]) => ({ key: k, value: v.length })), 'value', 'desc').slice(0, 12);

    mount.appendChild(reportPage({
      title: 'PTM reports',
      subtitle: `${formatNumber(schedules.length)} meeting windows · ${formatNumber(bookings.length)} appointments this year`,
      route: 'ptm/reports',
      filters: [
        { id: 'campus', label: 'Campus', options: db.campuses.map((c) => c.name) },
        { id: 'status', label: 'Status', options: ['Open', 'Completed'] },
        { id: 'from', label: 'From', type: 'date' },
      ],
      onFilter: (id, v, allV, table) => {
        if (table) table.refresh(applyFilters(rows, allV, { campus: (r, v2) => r.campus === v2, status: (r, v2) => r.status === v2 }));
      },
      summary: [
        { label: 'Appointments', value: formatNumber(bookings.length), icon: 'calendar-check', tone: 'brand' },
        { label: 'Attendance', value: `${pct(bookings.filter((b) => b.status === 'Attended').length, Math.max(1, bookings.length))}%`, icon: 'user-check', tone: 'success' },
        { label: 'Booking rate', value: `${pct(sum(schedules, 'booked'), Math.max(1, sum(schedules, 'capacity')))}%`, icon: 'bookmark', tone: 'info' },
        { label: 'No shows', value: formatNumber(bookings.filter((b) => b.status === 'No Show').length), icon: 'user-x', tone: 'danger' },
      ],
      chart: [
        comboChart({
          categories: rows.map((r) => `${r.title.split('—')[1] || r.title} (${formatDate(r.date, 'dayMonth')})`),
          bars: [{ name: 'Booked', values: rows.map((r) => r.booked) }],
          line: { name: 'Capacity', values: rows.map((r) => r.capacity) },
          height: 260,
        }),
        barChart({
          categories: byClass.map((c) => c.key),
          series: [{ name: 'Appointments', values: byClass.map((c) => c.value) }],
          horizontal: true, height: 300,
        }),
      ],
      chartTitle: 'Bookings against capacity per PTM',
      notes: Callout({ tone: 'info', icon: 'lightbulb', title: 'Reading this report' },
        'A booking rate below 70% usually reflects a weekday slot. Saturday windows at Springdale book at 86% on average.'),
      columns: [
        { key: 'title', label: 'PTM', sticky: true, width: 260, render: (r) => Identity(r.title, `Classes ${r.classes}`), value: (r) => r.title },
        { key: 'campus', label: 'Campus', width: 170, filter: true },
        { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date) },
        { key: 'capacity', label: 'Capacity', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'booked', label: 'Booked', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'bookingRate', label: 'Booking %', width: 170, render: (r) => progressCell(r.bookingRate, r.bookingRate >= 70 ? 'success' : 'warning'), value: (r) => r.bookingRate },
        { key: 'attended', label: 'Attended', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'noShow', label: 'No shows', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'attendanceRate', label: 'Attendance %', width: 130, align: 'right', numeric: true, render: (r) => `${r.attendanceRate}%`, value: (r) => r.attendanceRate },
        { key: 'rating', label: 'Avg rating', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => v.toFixed(2) },
        { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
      ],
      rows,
      tableTitle: 'PTM-wise summary',
      footerAggregates: true,
    }));
  },
};

/* ==========================================================================
   5. Activities & Sports
   ========================================================================== */

const actRoutes = {};

const PRACTICE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function houseStats(ctx) {
  const students = scoped(db.students, ctx);
  const awards = scoped(db.awards, ctx);
  return db.houses.map((house) => {
    const members = students.filter((s) => s.house === house.name);
    const won = awards.filter((a) => a.house === house.name);
    const comps = db.competitions.filter((c) => c.winnerHouse === house.name);
    return {
      id: house.id, name: house.name, colour: house.colour, motto: house.motto,
      points: house.points + sum(won, 'points'),
      basePoints: house.points,
      awardPoints: sum(won, 'points'),
      members: members.length,
      awards: won.length,
      wins: comps.length,
      avgAttendance: Math.round(avg(members, 'attendancePct') || 0),
      avgCgpa: Number((avg(members, 'cgpa') || 0).toFixed(2)),
      captain: members.length ? sortBy(members, 'behaviourScore', 'desc')[0] : null,
    };
  });
}

actRoutes['activities/houses'] = {
  title: 'Houses', subtitle: 'House points leaderboard and membership', section: 'activities',
  render(mount, ctx) {
    injectStyles();
    const houses = sortBy(houseStats(ctx), 'points', 'desc');
    const leader = houses[0];
    const awards = scoped(db.awards, ctx);

    const openHouse = (hs) => {
      const members = scoped(db.students, ctx).filter((s) => s.house === hs.name);
      Drawer({
        title: `${hs.name} House`, subtitle: hs.motto, size: 'xl',
        body: h('div', { className: 'stack-4' },
          kpiRow([
            { label: 'Points', value: formatNumber(hs.points), icon: 'trophy', tone: 'brand' },
            { label: 'Members', value: formatNumber(hs.members), icon: 'users', tone: 'info' },
            { label: 'Awards', value: formatNumber(hs.awards), icon: 'award', tone: 'success' },
            { label: 'Competitions won', value: formatNumber(hs.wins), icon: 'medal', tone: 'warning' },
          ]),
          SectionCard({ title: 'Points build-up', className: 'chart-card' },
            waterfallChart({
              items: [
                { label: 'Carried forward', value: hs.basePoints, type: 'start' },
                { label: 'Awards', value: hs.awardPoints },
                { label: 'Competition wins', value: hs.wins * 50 },
                { label: 'Current total', value: hs.points + hs.wins * 50, type: 'total' },
              ],
              height: 240,
            })),
          SectionCard({ title: 'Top scorers for the house', icon: 'trophy' },
            RankList(sortBy(awards.filter((a) => a.house === hs.name), 'points', 'desc').slice(0, 8)
              .map((a) => ({ name: a.studentName, meta: `${a.title} · ${a.className}`, value: `${a.points} pts`, avatar: a.studentName })))),
          SectionCard({ title: 'Members', flush: true, subtitle: `${formatNumber(members.length)} students` },
            DataTable({
              columns: [
                { key: 'name', label: 'Student', sticky: true, width: 220, render: (r) => Identity(r.name, r.admissionNo), value: (r) => r.name },
                { key: 'className', label: 'Class', width: 110, filter: true },
                { key: 'section', label: 'Section', width: 90, filter: true },
                { key: 'attendancePct', label: 'Attendance', width: 120, align: 'right', numeric: true, render: (r) => `${r.attendancePct}%`, value: (r) => r.attendancePct, aggregate: 'avg', format: (v) => `${Math.round(v)}%` },
                { key: 'awardsCount', label: 'Awards', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
              ],
              rows: members, pageSize: 10, footerAggregates: true, exportName: `house-${hs.name.toLowerCase()}`,
              onRowClick: (r) => navigate(`students/profile/${r.id}`),
            }))),
        actions: (close) => frag(
          Button('Close', { variant: 'ghost', onClick: close }),
          Button('Award points', { variant: 'primary', icon: 'plus', onClick: () => { close(); notify({ title: `Points awarded to ${hs.name}`, tone: 'success' }); } })),
      });
    };

    mount.appendChild(page({
      title: 'Houses',
      subtitle: `${leader.name} leads with ${formatNumber(leader.points)} points · ${formatNumber(sum(houses, 'members'))} students across four houses`,
      route: 'activities/houses',
      actions: [
        moreMenu([{ label: 'Reset points (new session)', icon: 'refresh-ccw', onClick: mockAction('Reset house points') }]),
        Button('Awards', { variant: 'secondary', icon: 'award', route: 'activities/awards' }),
        Button('Award points', {
          variant: 'primary', icon: 'plus',
          onClick: () => formPage({
            title: 'Award house points', mode: 'modal', size: 'md', submitLabel: 'Award points',
            sections: [{
              title: 'Points', cols: 2,
              fields: [
                { id: 'house', label: 'House', type: 'select', required: true, options: db.houses.map((x) => x.name) },
                { id: 'points', label: 'Points', type: 'number', required: true, value: 25, validate: validators.number },
                { id: 'reason', label: 'Reason', type: 'select', required: true, options: ['Competition win', 'Academic excellence', 'Sportsmanship', 'Community service', 'Discipline', 'Attendance'] },
                { id: 'student', label: 'Attributed to (optional)', type: 'combobox', options: db.students.slice(0, 200).map((s) => ({ value: s.id, label: `${s.name} · ${s.className}` })) },
                { id: 'note', label: 'Citation', type: 'textarea', span: 'full' },
              ],
            }],
            onSubmit: (v) => notify({ title: `${v.points || 0} points awarded`, text: v.house || '', tone: 'success' }),
          }),
        }),
      ],
      children: [
        SectionCard({ title: 'Leaderboard', icon: 'trophy', subtitle: 'Points carried forward plus awards earned this session' },
          h('div', { className: 'eng-grid eng-grid-wide' },
            houses.map((hs, i) => h('div', { className: 'eng-house' },
              h('div', { className: 'eng-house-band', style: { background: hs.colour } }),
              h('div', { className: 'eng-house-body' },
                h('div', { className: 'row-3' },
                  h('div', { className: 't-title' }, `#${i + 1}`),
                  h('div', { className: 'flex-1 min-0' },
                    h('div', { className: 't-medium' }, hs.name),
                    h('div', { className: 't-xs t-muted t-truncate' }, hs.motto)),
                  i === 0 && Badge('Leading', { tone: 'success', icon: 'trophy' })),
                h('div', { className: 't-display t-num' }, formatNumber(hs.points)),
                ProgressBar(pct(hs.points, houses[0].points), { tone: i === 0 ? 'success' : 'brand', size: 'sm' }),
                h('div', { className: 'row-4 row-wrap' },
                  Tag(`${formatNumber(hs.members)} members`, { icon: 'users' }),
                  Tag(`${hs.awards} awards`, { icon: 'award' }),
                  Tag(`${hs.wins} wins`, { icon: 'medal' })),
                h('div', { className: 'row-3' },
                  Button('Open house', { variant: 'secondary', size: 'sm', icon: 'eye', block: true, onClick: () => openHouse(hs) }))))))),
        h('div', { className: 'widget-grid' },
          h('div', { className: 'span-7' }, SectionCard({ title: 'Points by house', className: 'chart-card' },
            barChart({
              categories: houses.map((x) => x.name),
              series: [
                { name: 'Carried forward', values: houses.map((x) => x.basePoints) },
                { name: 'Earned this session', values: houses.map((x) => x.awardPoints) },
              ],
              stacked: true, height: 280, showValues: true,
            }))),
          h('div', { className: 'span-5' }, SectionCard({ title: 'Membership split', className: 'chart-card' },
            donutChart({
              data: houses.map((x) => ({ key: x.name, value: x.members, color: x.colour })),
              height: 280, centerLabel: 'Students', centerValue: formatNumber(sum(houses, 'members')),
            }))),
          h('div', { className: 'span-12' }, SectionCard({ title: 'House comparison', flush: true },
            DataTable({
              columns: [
                { key: 'name', label: 'House', sticky: true, width: 200, render: (r) => h('div', { className: 'row-3' }, h('span', { style: { width: '10px', height: '10px', borderRadius: 'var(--r-full)', background: r.colour, display: 'inline-block' } }), Identity(r.name, r.motto)), value: (r) => r.name },
                { key: 'points', label: 'Points', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'members', label: 'Members', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'awards', label: 'Awards', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'wins', label: 'Wins', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'avgAttendance', label: 'Avg attendance', width: 150, render: (r) => progressCell(r.avgAttendance, r.avgAttendance >= 90 ? 'success' : 'warning'), value: (r) => r.avgAttendance },
                { key: 'avgCgpa', label: 'Avg CGPA', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => v.toFixed(2) },
                { key: 'captain', label: 'House captain', width: 200, render: (r) => (r.captain ? studentLink(r.captain.name, r.captain.id) : '—'), value: (r) => (r.captain ? r.captain.name : '') },
              ],
              rows: houses, paginate: false, footerAggregates: true, exportName: 'houses',
              onRowClick: openHouse,
            })))),
      ],
    }));
  },
};

/* ------------------------------------------------- activities / clubs --- */

actRoutes['activities/clubs'] = {
  title: 'Clubs', subtitle: 'Student clubs, membership and meeting schedules', section: 'activities',
  render(mount, ctx) {
    injectStyles();
    warmStaff();
    const rows = scoped(db.clubs, ctx).map((c, i) => ({
      ...c,
      inChargeName: c.inCharge ? staffName(c.inCharge) : teacherAt(i * 5).name,
      inChargeId: c.inCharge || teacherAt(i * 5).id,
    }));

    const openClub = (c) => {
      const members = scoped(db.students, ctx).filter((s) => (s.activities || []).length).slice(0, c.members);
      Drawer({
        title: c.name, subtitle: `${c.category} · meets every ${c.meetingDay} in the ${c.room}`, size: 'xl',
        body: h('div', { className: 'stack-4' },
          kpiRow([
            { label: 'Members', value: formatNumber(c.members), icon: 'users', tone: 'brand' },
            { label: 'Meeting day', value: c.meetingDay, icon: 'calendar', tone: 'info' },
            { label: 'Venue', value: c.room, icon: 'door', tone: 'success' },
            { label: 'Status', value: c.active ? 'Active' : 'Dormant', icon: 'check-circle', tone: c.active ? 'success' : 'neutral' },
          ]),
          SectionCard({ title: 'Club in-charge', icon: 'presentation' },
            h('div', { className: 'row-3' },
              Avatar(c.inChargeName, { size: 'lg' }),
              h('div', { className: 'flex-1 min-0' },
                h('div', { className: 't-medium' }, c.inChargeName),
                h('div', { className: 't-sm t-muted' }, 'Faculty coordinator')),
              Button('Message', { variant: 'secondary', size: 'sm', icon: 'send', route: 'communication/compose' }))),
          SectionCard({ title: 'This term', icon: 'calendar-check' },
            Timeline([
              { title: 'Orientation session', meta: formatDate('2026-04-18'), text: `${c.members} students enrolled for 2026-27.`, icon: 'users', tone: 'info' },
              { title: 'Inter-house event', meta: formatDate('2026-07-12'), text: 'Club represented the school at the district level.', icon: 'trophy', tone: 'success' },
              { title: 'Weekly meeting', meta: `Every ${c.meetingDay}`, text: `${c.room} · 15:30 to 16:30`, icon: 'clock', tone: 'brand' },
            ])),
          SectionCard({ title: 'Members', flush: true },
            DataTable({
              columns: [
                { key: 'name', label: 'Student', sticky: true, width: 220, render: (r) => Identity(r.name, r.admissionNo), value: (r) => r.name },
                { key: 'className', label: 'Class', width: 110, filter: true },
                { key: 'house', label: 'House', width: 110, filter: true },
                { key: 'activities', label: 'Other activities', width: 260, render: (r) => h('div', { className: 'row-3 row-wrap' }, (r.activities || []).slice(0, 3).map((a) => Tag(a))), value: (r) => (r.activities || []).join(',') },
              ],
              rows: members, pageSize: 10, exportName: `club-${c.id}`,
              onRowClick: (r) => navigate(`students/profile/${r.id}`),
              emptyState: emptyFor('users', 'No members enrolled', 'Enrol students to this club from the student profile.'),
            }))),
        actions: (close) => frag(
          Button('Close', { variant: 'ghost', onClick: close }),
          Button('Add members', { variant: 'primary', icon: 'user-plus', onClick: () => { close(); notify({ title: 'Member enrolment opened', tone: 'success' }); } })),
      });
    };

    mount.appendChild(listPage({
      title: 'Clubs & societies',
      subtitle: `${formatNumber(rows.length)} clubs · ${formatNumber(sum(rows, 'members'))} memberships`,
      route: 'activities/clubs',
      actions: [
        moreMenu([{ label: 'Print membership register', icon: 'print', onClick: mockAction('Print register') }]),
        Button('Practice schedule', { variant: 'secondary', icon: 'calendar', route: 'activities/practice-schedule' }),
        Button('New club', {
          variant: 'primary', icon: 'plus',
          onClick: () => formPage({
            title: 'Create a club', mode: 'modal', size: 'md', submitLabel: 'Create club',
            sections: [{
              title: 'Club details', cols: 2,
              fields: [
                { id: 'name', label: 'Club name', required: true, span: 'full' },
                { id: 'category', label: 'Category', type: 'select', required: true, options: [...new Set(rows.map((r) => r.category))] },
                { id: 'incharge', label: 'Faculty in-charge', type: 'combobox', required: true, options: db.staff.filter((s) => s.type === 'Teaching').slice(0, 80).map((s) => ({ value: s.id, label: s.name })) },
                { id: 'day', label: 'Meeting day', type: 'select', options: PRACTICE_DAYS },
                { id: 'room', label: 'Venue', required: true },
                { id: 'cap', label: 'Member cap', type: 'number', value: 60 },
                { id: 'desc', label: 'Description', type: 'textarea', span: 'full' },
              ],
            }],
            onSubmit: (v) => notify({ title: 'Club created', text: v.name || '', tone: 'success' }),
          }),
        }),
      ],
      kpis: [
        { label: 'Clubs', value: formatNumber(rows.length), icon: 'users', tone: 'brand' },
        { label: 'Memberships', value: formatNumber(sum(rows, 'members')), icon: 'user-check', tone: 'success' },
        { label: 'Categories', value: formatNumber(new Set(rows.map((r) => r.category)).size), icon: 'tag', tone: 'info' },
        { label: 'Largest club', value: sortBy(rows, 'members', 'desc')[0].name, icon: 'trophy', tone: 'warning' },
      ],
      chart: barChart({
        categories: rows.map((r) => r.name),
        series: [{ name: 'Members', values: rows.map((r) => r.members) }],
        horizontal: true, height: 300, showValues: true,
      }),
      chartTitle: 'Membership by club',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Club name…' },
        { id: 'category', label: 'Category', options: [...new Set(rows.map((r) => r.category))] },
        { id: 'meetingDay', label: 'Meeting day', options: PRACTICE_DAYS },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(rows, allV, {
        q: (r, t) => r.name.toLowerCase().includes(t.toLowerCase()),
        category: (r, v2) => r.category === v2,
        meetingDay: (r, v2) => r.meetingDay === v2,
      })),
      columns: [
        { key: 'name', label: 'Club', sticky: true, width: 250, render: (r) => Identity(r.name, r.category), value: (r) => r.name },
        { key: 'inChargeName', label: 'Faculty in-charge', width: 200, render: (r) => teacherLink(r.inChargeName, r.inChargeId), value: (r) => r.inChargeName },
        { key: 'members', label: 'Members', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'meetingDay', label: 'Meets', width: 130, filter: true },
        { key: 'room', label: 'Venue', width: 190 },
        { key: 'campusId', label: 'Campus', width: 170, render: (r) => campusName(r.campusId), value: (r) => campusName(r.campusId), filter: true },
        { key: 'active', label: 'Status', width: 110, render: (r) => Badge(r.active ? 'Active' : 'Dormant'), value: (r) => (r.active ? 1 : 0) },
      ],
      rows,
      selectable: true, footerAggregates: true, paginate: false,
      searchKeys: ['name', 'category', 'room'],
      bulkActions: [{ label: 'Message members', icon: 'send', onClick: (sel) => notify({ title: `Message queued for ${sum(sel, 'members')} members`, tone: 'success' }) }],
      rowActions: (r) => [
        { label: 'Open club', icon: 'eye', onClick: () => openClub(r) },
        { label: 'Add members', icon: 'user-plus', onClick: mockAction('Add members') },
        { label: 'Practice schedule', icon: 'calendar', route: 'activities/practice-schedule' },
      ],
      onRowClick: openClub,
      emptyState: emptyFor('users', 'No clubs', 'Create a club so students can sign up.'),
    }));
  },
};

/* ------------------------------------------------ activities / sports --- */

actRoutes['activities/sports'] = {
  title: 'Sports', subtitle: 'Teams, squads and season records', section: 'activities',
  render(mount, ctx) {
    injectStyles();
    warmStaff();
    const rows = scoped(db.sportsTeams, ctx).map((t, i) => ({
      ...t,
      coachName: t.coach ? staffName(t.coach) : teacherAt(i * 3).name,
      coachId: t.coach || teacherAt(i * 3).id,
      played: t.wins + t.losses,
      winPct: pct(t.wins, Math.max(1, t.wins + t.losses)),
    }));

    const openTeam = (t) => {
      const roster = scoped(db.students, ctx).filter((s) => (s.activities || []).some((a) => /sport|athlet|basket|cricket|football|swim|chess|tennis/i.test(a))).slice(0, t.players);
      Drawer({
        title: t.name, subtitle: `${t.sport} · coached by ${t.coachName} · practises ${t.practiceDays}`, size: 'xl',
        body: h('div', { className: 'stack-4' },
          kpiRow([
            { label: 'Squad size', value: formatNumber(t.players), icon: 'users', tone: 'brand' },
            { label: 'Wins', value: formatNumber(t.wins), icon: 'trophy', tone: 'success' },
            { label: 'Losses', value: formatNumber(t.losses), icon: 'trending-down', tone: 'danger' },
            { label: 'Win rate', value: `${t.winPct}%`, icon: 'percent', tone: 'info' },
          ]),
          SectionCard({ title: 'Season record', className: 'chart-card' },
            barChart({
              categories: ['Won', 'Lost'],
              series: [{ name: 'Matches', values: [t.wins, t.losses] }],
              height: 200, showValues: true,
            })),
          SectionCard({ title: 'Squad', flush: true },
            roster.length ? DataTable({
              columns: [
                { key: 'name', label: 'Player', sticky: true, width: 220, render: (r) => Identity(r.name, `${r.className}-${r.section}`), value: (r) => r.name },
                { key: 'house', label: 'House', width: 120, filter: true },
                { key: 'attendancePct', label: 'Attendance', width: 130, align: 'right', numeric: true, render: (r) => `${r.attendancePct}%`, value: (r) => r.attendancePct },
                { key: 'awardsCount', label: 'Awards', width: 100, align: 'right', numeric: true },
              ],
              rows: roster, pageSize: 10, exportName: `team-${t.id}`,
              onRowClick: (r) => navigate(`students/profile/${r.id}`),
            }) : emptyFor('users', 'Squad not selected yet', 'Add players from the student directory.'))),
        actions: (close) => frag(
          Button('Close', { variant: 'ghost', onClick: close }),
          Button('Record a result', { variant: 'primary', icon: 'trophy', onClick: () => { close(); notify({ title: 'Result recorded', text: t.name, tone: 'success' }); } })),
      });
    };

    mount.appendChild(listPage({
      title: 'Sports teams',
      subtitle: `${formatNumber(rows.length)} teams · ${formatNumber(sum(rows, 'players'))} players · ${formatNumber(sum(rows, 'wins'))} wins this season`,
      route: 'activities/sports',
      actions: [
        moreMenu([{ label: 'Print squad lists', icon: 'print', onClick: mockAction('Print squads') }]),
        Button('Competitions', { variant: 'secondary', icon: 'trophy', route: 'activities/competitions' }),
        Button('New team', {
          variant: 'primary', icon: 'plus',
          onClick: () => formPage({
            title: 'Create a sports team', mode: 'modal', size: 'md', submitLabel: 'Create team',
            sections: [{
              title: 'Team', cols: 2,
              fields: [
                { id: 'name', label: 'Team name', required: true, span: 'full', placeholder: 'Basketball — Senior Boys' },
                { id: 'sport', label: 'Sport', type: 'select', required: true, options: [...new Set(rows.map((r) => r.sport))] },
                { id: 'coach', label: 'Coach', type: 'combobox', required: true, options: db.staff.filter((s) => s.type === 'Teaching').slice(0, 80).map((s) => ({ value: s.id, label: s.name })) },
                { id: 'players', label: 'Squad size', type: 'number', value: 14 },
                { id: 'venue', label: 'Practice venue', required: true },
                { id: 'days', label: 'Practice days', type: 'multiselect', options: PRACTICE_DAYS, value: ['Monday', 'Wednesday', 'Friday'] },
              ],
            }],
            onSubmit: (v) => notify({ title: 'Team created', text: v.name || '', tone: 'success' }),
          }),
        }),
      ],
      kpis: [
        { label: 'Teams', value: formatNumber(rows.length), icon: 'football', tone: 'brand' },
        { label: 'Players', value: formatNumber(sum(rows, 'players')), icon: 'users', tone: 'info' },
        { label: 'Matches won', value: formatNumber(sum(rows, 'wins')), icon: 'trophy', tone: 'success' },
        { label: 'Overall win rate', value: `${pct(sum(rows, 'wins'), Math.max(1, sum(rows, 'wins') + sum(rows, 'losses')))}%`, icon: 'percent', tone: 'warning' },
      ],
      chart: barChart({
        categories: rows.map((r) => r.name),
        series: [
          { name: 'Won', values: rows.map((r) => r.wins) },
          { name: 'Lost', values: rows.map((r) => r.losses) },
        ],
        stacked: true, horizontal: true, height: 300,
      }),
      chartTitle: 'Season record by team',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Team or sport…' },
        { id: 'sport', label: 'Sport', options: [...new Set(rows.map((r) => r.sport))] },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(rows, allV, {
        q: (r, t) => (r.name + r.sport).toLowerCase().includes(t.toLowerCase()),
        sport: (r, v2) => r.sport === v2,
      })),
      columns: [
        { key: 'name', label: 'Team', sticky: true, width: 250, render: (r) => Identity(r.name, r.sport), value: (r) => r.name },
        { key: 'coachName', label: 'Coach', width: 190, render: (r) => teacherLink(r.coachName, r.coachId), value: (r) => r.coachName },
        { key: 'players', label: 'Players', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'practiceDays', label: 'Practice', width: 150 },
        { key: 'venue', label: 'Venue', width: 180 },
        { key: 'wins', label: 'Won', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'losses', label: 'Lost', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'winPct', label: 'Win rate', width: 170, render: (r) => progressCell(r.winPct, r.winPct >= 60 ? 'success' : 'warning'), value: (r) => r.winPct },
        { key: 'campusId', label: 'Campus', width: 170, render: (r) => campusName(r.campusId), value: (r) => campusName(r.campusId), filter: true },
      ],
      rows,
      selectable: true, footerAggregates: true, paginate: false,
      searchKeys: ['name', 'sport', 'venue'],
      bulkActions: [{ label: 'Notify squads', icon: 'send', onClick: (sel) => notify({ title: `Notification queued for ${sum(sel, 'players')} players`, tone: 'success' }) }],
      rowActions: (r) => [
        { label: 'Open team', icon: 'eye', onClick: () => openTeam(r) },
        { label: 'Record result', icon: 'trophy', onClick: mockAction('Record result') },
        { label: 'Practice schedule', icon: 'calendar', route: 'activities/practice-schedule' },
      ],
      onRowClick: openTeam,
      emptyState: emptyFor('football', 'No teams', 'Create a team and pick a squad.'),
    }));
  },
};

/* ----------------------------------------- activities / competitions ---- */

actRoutes['activities/competitions'] = {
  title: 'Competitions', subtitle: 'Inter-house, inter-school and external competitions', section: 'activities',
  render(mount, ctx) {
    injectStyles();
    const rows = scoped(db.competitions, ctx);
    const upcoming = rows.filter((r) => r.status === 'Upcoming');
    const completed = rows.filter((r) => r.status === 'Completed');

    const resultsModal = (c) => {
      const positions = ['Winner', 'Runner-up', 'Second runner-up'];
      const picks = {};
      const body = h('div', { className: 'stack-4' },
        Callout({ tone: 'info', icon: 'info', title: c.name },
          `${c.type} · ${formatDate(c.date)} · ${c.venue} · ${formatNumber(c.participants)} participants`),
        FormGrid({ cols: 1 },
          positions.map((p, i) => Field({ label: p, required: i === 0 },
            h('div', { className: 'row-3' },
              Select({ options: db.houses.map((x) => x.name), value: c.houses[i], onChange: (v) => { picks[p] = v; } }),
              Input({ type: 'number', value: String([100, 60, 30][i]), numeric: true, suffix: 'pts' }))))),
        Field({ label: 'Individual best performer', hint: 'Optional — awards a certificate automatically' },
          Combobox({ options: db.students.slice(0, 200).map((s) => ({ value: s.id, label: `${s.name} · ${s.className}` })) })),
        Field({ label: 'Judge remarks' }, Textarea({ rows: 3, placeholder: 'Summary of the event and the judges’ observations…' })));

      Modal({
        title: 'Record results', subtitle: c.name, size: 'lg', icon: 'trophy', tone: 'brand',
        body,
        actions: (close) => frag(
          Button('Cancel', { variant: 'ghost', onClick: close }),
          Button('Publish results', {
            variant: 'primary', icon: 'trophy',
            onClick: () => { close(); notify({ title: 'Results published', text: `${c.name} · house points updated`, tone: 'success' }); },
          })),
      });
    };

    mount.appendChild(listPage({
      title: 'Competitions',
      subtitle: `${formatNumber(rows.length)} competitions · ${formatNumber(upcoming.length)} upcoming · ${formatNumber(sum(rows, 'participants'))} participations`,
      route: 'activities/competitions',
      actions: [
        moreMenu([{ label: 'Export results book', icon: 'download', onClick: mockAction('Export results') }]),
        Button('Certificates', { variant: 'secondary', icon: 'certificate', route: 'activities/certificates' }),
        Button('New competition', {
          variant: 'primary', icon: 'plus',
          onClick: () => formPage({
            title: 'Create a competition', mode: 'modal', size: 'lg', submitLabel: 'Create',
            sections: [{
              title: 'Competition', cols: 2,
              fields: [
                { id: 'name', label: 'Name', required: true, span: 'full' },
                { id: 'type', label: 'Level', type: 'select', required: true, options: ['Inter-House', 'Inter-School', 'District', 'State', 'National'] },
                { id: 'category', label: 'Category', type: 'select', required: true, options: ['Academic', 'Sports', 'Cultural', 'Technical'] },
                { id: 'date', label: 'Date', type: 'date', required: true, value: TODAY },
                { id: 'venue', label: 'Venue', required: true },
                { id: 'participants', label: 'Expected participants', type: 'number', value: 120 },
                { id: 'budget', label: 'Budget (₹)', type: 'number', value: 60000 },
                { id: 'coordinator', label: 'Coordinator', type: 'combobox', options: db.staff.slice(0, 80).map((s) => ({ value: s.id, label: s.name })) },
                { id: 'notes', label: 'Rules & format', type: 'textarea', span: 'full' },
              ],
            }],
            onSubmit: (v) => notify({ title: 'Competition created', text: v.name || '', tone: 'success' }),
          }),
        }),
      ],
      kpis: [
        { label: 'Competitions', value: formatNumber(rows.length), icon: 'trophy', tone: 'brand' },
        { label: 'Upcoming', value: formatNumber(upcoming.length), icon: 'calendar-check', tone: 'info' },
        { label: 'Completed', value: formatNumber(completed.length), icon: 'check-circle', tone: 'success' },
        { label: 'Budget committed', value: formatCurrency(sum(rows, 'budget'), { compact: true }), icon: 'wallet', tone: 'warning' },
      ],
      chart: barChart({
        categories: countBy(rows, 'category').map((c) => c.key),
        series: [{ name: 'Competitions', values: countBy(rows, 'category').map((c) => c.value) }],
        height: 220, showValues: true,
      }),
      chartTitle: 'Competitions by category',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Competition name…' },
        { id: 'type', label: 'Level', options: ['Inter-House', 'Inter-School', 'District', 'State', 'National'] },
        { id: 'category', label: 'Category', options: ['Academic', 'Sports', 'Cultural', 'Technical'] },
        { id: 'status', label: 'Status', options: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'] },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(rows, allV, {
        q: (r, t) => r.name.toLowerCase().includes(t.toLowerCase()),
        type: (r, v2) => r.type === v2,
        category: (r, v2) => r.category === v2,
        status: (r, v2) => r.status === v2,
      })),
      columns: [
        { key: 'name', label: 'Competition', sticky: true, width: 260, render: (r) => Identity(r.name, `${r.type} · ${r.category}`), value: (r) => r.name },
        { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date) },
        { key: 'venue', label: 'Venue', width: 180 },
        { key: 'participants', label: 'Participants', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'winnerHouse', label: 'Winner', width: 140, render: (r) => (r.status === 'Completed' ? Badge(r.winnerHouse, { tone: 'success', icon: 'trophy' }) : h('span', { className: 't-muted' }, '—')), value: (r) => r.winnerHouse },
        { key: 'budget', label: 'Budget', width: 130, align: 'right', numeric: true, aggregate: 'sum', render: (r) => formatCurrency(r.budget), format: (v) => formatCurrency(v, { compact: true }) },
        { key: 'campusId', label: 'Campus', width: 170, render: (r) => campusName(r.campusId), value: (r) => campusName(r.campusId), filter: true },
        { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
      ],
      rows,
      selectable: true, footerAggregates: true, paginate: false,
      searchKeys: ['name', 'type', 'category', 'venue'],
      expandable: (r) => h('div', { className: 'stack-3' },
        h('div', { className: 'row-4 row-wrap' },
          Tag(`${r.type}`, { icon: 'flag' }),
          Tag(`${r.category}`, { icon: 'tag' }),
          Tag(`${formatNumber(r.participants)} participants`, { icon: 'users' }),
          Tag(formatCurrency(r.budget), { icon: 'wallet' })),
        h('div', { className: 'row-3 row-wrap' },
          Button('Record results', { variant: 'primary', size: 'sm', icon: 'trophy', onClick: () => resultsModal(r) }),
          Button('Generate certificates', { variant: 'secondary', size: 'sm', icon: 'certificate', route: 'activities/certificates' }),
          Button('Participation list', { variant: 'ghost', size: 'sm', icon: 'list', route: 'activities/participation' }))),
      bulkActions: [{ label: 'Publish schedule', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} competitions published`, tone: 'success' }) }],
      rowActions: (r) => [
        { label: 'Record results', icon: 'trophy', onClick: () => resultsModal(r) },
        { label: 'Participation', icon: 'user-check', route: 'activities/participation' },
        { label: 'Certificates', icon: 'certificate', route: 'activities/certificates' },
        { separator: true },
        { label: 'Cancel competition', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: `Cancel ${r.name}?`, tone: 'danger', confirmLabel: 'Cancel' }).then((ok) => ok && notify({ title: 'Competition cancelled', tone: 'danger' })) },
      ],
      onRowClick: resultsModal,
      emptyState: emptyFor('trophy', 'No competitions', 'Create a competition to track participation and results.'),
    }));
  },
};

/* ---------------------------------------- activities / participation --- */

function participationRows(ctx) {
  const students = scoped(db.students, ctx);
  const awards = scoped(db.awards, ctx);
  const comps = scoped(db.competitions, ctx);
  const out = [];
  comps.forEach((c, ci) => {
    const rnd = rngFor('part' + c.id);
    const n = Math.min(24, Math.max(6, Math.round(c.participants / 12)));
    for (let i = 0; i < n; i++) {
      const s = students[(ci * 61 + i * 13) % students.length];
      const won = awards.find((a) => a.studentId === s.id);
      const position = rnd();
      out.push({
        id: `${c.id}-${s.id}`,
        studentId: s.id,
        studentName: s.name,
        className: s.className,
        section: s.section,
        house: s.house,
        competition: c.name,
        competitionId: c.id,
        category: c.category,
        level: c.type,
        date: c.date,
        role: position < 0.16 ? 'Team captain' : position < 0.5 ? 'Participant' : 'Team member',
        result: c.status !== 'Completed' ? 'Registered' : position < 0.1 ? 'Winner' : position < 0.22 ? 'Runner-up' : position < 0.4 ? 'Finalist' : 'Participated',
        points: won ? won.points : Math.round(5 + position * 30),
        certificate: c.status === 'Completed',
      });
    }
  });
  return out;
}

actRoutes['activities/participation'] = {
  title: 'Event Participation', subtitle: 'Who took part in what, and how they placed', section: 'activities',
  render(mount, ctx) {
    injectStyles();
    const rows = participationRows(ctx);
    const byHouse = countBy(rows, 'house');
    const winners = rows.filter((r) => r.result === 'Winner' || r.result === 'Runner-up');

    mount.appendChild(listPage({
      title: 'Event participation',
      subtitle: `${formatNumber(rows.length)} participations · ${formatNumber(new Set(rows.map((r) => r.studentId)).size)} unique students`,
      route: 'activities/participation',
      actions: [
        moreMenu([{ label: 'Export participation register', icon: 'download', onClick: mockAction('Export register') }]),
        Button('Competitions', { variant: 'secondary', icon: 'trophy', route: 'activities/competitions' }),
        Button('Register a student', {
          variant: 'primary', icon: 'user-plus',
          onClick: () => formPage({
            title: 'Register a participant', mode: 'modal', size: 'md', submitLabel: 'Register',
            sections: [{
              title: 'Participation', cols: 1,
              fields: [
                { id: 'student', label: 'Student', type: 'combobox', required: true, options: scoped(db.students, ctx).slice(0, 200).map((s) => ({ value: s.id, label: `${s.name} · ${s.className}-${s.section}` })) },
                { id: 'competition', label: 'Competition', type: 'select', required: true, options: scoped(db.competitions, ctx).map((c) => ({ value: c.id, label: c.name })) },
                { id: 'role', label: 'Role', type: 'radio', inline: true, options: ['Participant', 'Team member', 'Team captain'], value: 'Participant' },
                { id: 'consent', label: 'Parent consent received', type: 'switch', switchLabel: 'Consent form signed', value: true },
              ],
            }],
            onSubmit: () => notify({ title: 'Participant registered', tone: 'success' }),
          }),
        }),
      ],
      kpis: [
        { label: 'Participations', value: formatNumber(rows.length), icon: 'user-check', tone: 'brand' },
        { label: 'Unique students', value: formatNumber(new Set(rows.map((r) => r.studentId)).size), icon: 'users', tone: 'info' },
        { label: 'Podium finishes', value: formatNumber(winners.length), icon: 'trophy', tone: 'success' },
        { label: 'Certificates due', value: formatNumber(rows.filter((r) => r.certificate).length), icon: 'certificate', tone: 'warning' },
      ],
      chart: barChart({
        categories: byHouse.map((x) => x.key),
        series: [{ name: 'Participations', values: byHouse.map((x) => x.value) }],
        height: 220, showValues: true,
      }),
      chartTitle: 'Participation by house',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Student or competition…' },
        { id: 'competition', label: 'Competition', options: [...new Set(rows.map((r) => r.competition))] },
        { id: 'house', label: 'House', options: db.houses.map((x) => x.name) },
        { id: 'level', label: 'Level', options: ['Inter-House', 'Inter-School', 'District', 'State', 'National'] },
        { id: 'result', label: 'Result', options: ['Winner', 'Runner-up', 'Finalist', 'Participated', 'Registered'] },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(rows, allV, {
        q: (r, t) => (r.studentName + r.competition).toLowerCase().includes(t.toLowerCase()),
        competition: (r, v2) => r.competition === v2,
        house: (r, v2) => r.house === v2,
        level: (r, v2) => r.level === v2,
        result: (r, v2) => r.result === v2,
      })),
      columns: [
        { key: 'studentName', label: 'Student', sticky: true, width: 220, render: (r) => Identity(r.studentName, `${r.className}-${r.section} · ${r.house}`), value: (r) => r.studentName },
        { key: 'competition', label: 'Competition', width: 240, filter: true },
        { key: 'category', label: 'Category', width: 120, filter: true },
        { key: 'level', label: 'Level', width: 130, filter: true },
        { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date) },
        { key: 'role', label: 'Role', width: 140, filter: true },
        { key: 'result', label: 'Result', width: 140, filter: true, render: (r) => Badge(r.result, { tone: r.result === 'Winner' ? 'success' : r.result === 'Runner-up' ? 'info' : r.result === 'Registered' ? 'warning' : 'neutral' }) },
        { key: 'points', label: 'House points', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'certificate', label: 'Certificate', width: 130, render: (r) => (r.certificate ? Badge('Ready', { tone: 'success' }) : h('span', { className: 't-muted' }, 'Pending')), value: (r) => (r.certificate ? 1 : 0) },
      ],
      rows,
      selectable: true, footerAggregates: true, pageSize: 50,
      searchKeys: ['studentName', 'competition', 'house', 'className'],
      bulkActions: [
        { label: 'Generate certificates', icon: 'certificate', onClick: (sel) => notify({ title: `${sel.length} certificates queued`, tone: 'success' }) },
        { label: 'Award house points', icon: 'trophy', onClick: (sel) => notify({ title: `${formatNumber(sum(sel, 'points'))} points awarded`, tone: 'success' }) },
        { label: 'Notify parents', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} families notified`, tone: 'success' }) },
      ],
      rowActions: (r) => [
        { label: 'Open student 360', icon: 'user', onClick: () => navigate(`students/profile/${r.studentId}`) },
        { label: 'Generate certificate', icon: 'certificate', route: 'activities/certificates' },
        { label: 'Open competition', icon: 'trophy', route: 'activities/competitions' },
      ],
      onRowClick: (r) => navigate(`students/profile/${r.studentId}`),
      emptyState: emptyFor('user-check', 'No participation recorded', 'Register students against a competition to build the register.'),
    }));
  },
};

/* ------------------------------------ activities / practice-schedule ---- */

actRoutes['activities/practice-schedule'] = {
  title: 'Practice Schedule', subtitle: 'Weekly practice and club meeting timetable', section: 'activities',
  render(mount, ctx) {
    injectStyles();
    warmStaff();
    const teams = scoped(db.sportsTeams, ctx);
    const clubs = scoped(db.clubs, ctx);

    const sessions = [];
    teams.forEach((t, i) => {
      const days = t.practiceDays.includes('Daily') ? PRACTICE_DAYS
        : t.practiceDays.includes('Mon-Fri') ? PRACTICE_DAYS.slice(0, 5)
          : t.practiceDays.includes('Mon-Sat') ? PRACTICE_DAYS
            : t.practiceDays.split(',').map((d) => PRACTICE_DAYS.find((p) => p.startsWith(d.trim().slice(0, 3)))).filter(Boolean);
      days.forEach((d) => sessions.push({
        id: `${t.id}-${d}`, kind: 'Sports', name: t.name, group: t.sport,
        day: d, start: `${15 + (i % 2)}:30`, end: `${16 + (i % 2)}:30`,
        venue: t.venue, people: t.players, inCharge: teacherAt(i * 3).name, inChargeId: teacherAt(i * 3).id,
        campusId: t.campusId,
      }));
    });
    clubs.forEach((c, i) => sessions.push({
      id: `${c.id}-${c.meetingDay}`, kind: 'Club', name: c.name, group: c.category,
      day: c.meetingDay, start: '15:30', end: '16:30',
      venue: c.room, people: c.members, inCharge: teacherAt(i * 5).name, inChargeId: teacherAt(i * 5).id,
      campusId: c.campusId,
    }));

    const grid = h('div', { className: 'eng-scroll-x' },
      PRACTICE_DAYS.map((day) => {
        const list = sessions.filter((s) => s.day === day).sort((a, b) => a.start.localeCompare(b.start));
        return h('div', { className: 'eng-daycol', style: { minWidth: '230px' } },
          h('div', { className: 'eng-daycol-head row-3' },
            h('span', { className: 't-medium flex-1' }, day),
            Badge(String(list.length), { tone: list.length ? 'brand' : 'neutral' })),
          list.length ? list.map((s) => h('div', { className: 'eng-appt' },
            h('div', { className: 'row-3' },
              Icon(s.kind === 'Sports' ? 'football' : 'users', 14),
              h('span', { className: 'flex-1 min-0 t-truncate t-medium' }, s.name)),
            h('div', { className: 't-xs t-muted' }, `${s.start}–${s.end} · ${s.venue}`),
            h('div', { className: 't-xs t-muted' }, `${s.people} students · ${s.inCharge}`)))
            : h('div', { className: 'card-pad t-sm t-muted' }, 'No sessions scheduled.'));
      }));

    mount.appendChild(page({
      title: 'Practice schedule',
      subtitle: `${formatNumber(sessions.length)} weekly sessions across ${formatNumber(teams.length)} teams and ${formatNumber(clubs.length)} clubs`,
      route: 'activities/practice-schedule',
      actions: [
        moreMenu([{ label: 'Print weekly sheet', icon: 'print', onClick: mockAction('Print schedule') }]),
        Button('Sports teams', { variant: 'secondary', icon: 'football', route: 'activities/sports' }),
        Button('Add a session', {
          variant: 'primary', icon: 'plus',
          onClick: () => formPage({
            title: 'Add a practice session', mode: 'modal', size: 'md', submitLabel: 'Add session',
            sections: [{
              title: 'Session', cols: 2,
              fields: [
                { id: 'kind', label: 'Type', type: 'radio', inline: true, options: ['Sports', 'Club'], value: 'Sports' },
                { id: 'group', label: 'Team or club', type: 'combobox', required: true, options: teams.map((t) => ({ value: t.id, label: t.name })).concat(clubs.map((c) => ({ value: c.id, label: c.name }))) },
                { id: 'day', label: 'Day', type: 'select', required: true, options: PRACTICE_DAYS },
                { id: 'venue', label: 'Venue', required: true },
                { id: 'start', label: 'Start', type: 'time', value: '15:30', required: true },
                { id: 'end', label: 'End', type: 'time', value: '16:30', required: true },
                { id: 'coach', label: 'In-charge', type: 'combobox', options: db.staff.filter((s) => s.type === 'Teaching').slice(0, 80).map((s) => ({ value: s.id, label: s.name })) },
                { id: 'notify', label: 'Notify', type: 'switch', switchLabel: 'Notify students and parents', value: true },
              ],
            }],
            onSubmit: () => notify({ title: 'Session added to the weekly schedule', tone: 'success' }),
          }),
        }),
      ],
      children: [
        kpiRow([
          { label: 'Weekly sessions', value: formatNumber(sessions.length), icon: 'calendar', tone: 'brand' },
          { label: 'Students engaged', value: formatNumber(sum(sessions, 'people')), icon: 'users', tone: 'info' },
          { label: 'Venues in use', value: formatNumber(new Set(sessions.map((s) => s.venue)).size), icon: 'door', tone: 'success' },
          { label: 'Busiest day', value: sortBy(countBy(sessions, 'day'), 'value', 'desc')[0].key, icon: 'trending-up', tone: 'warning' },
        ]),
        SectionCard({ title: 'Weekly grid', icon: 'grid', subtitle: 'Scroll sideways for Saturday' }, grid),
        h('div', { className: 'widget-grid' },
          h('div', { className: 'span-6' }, SectionCard({ title: 'Sessions per day', className: 'chart-card' },
            barChart({
              categories: PRACTICE_DAYS,
              series: [{ name: 'Sessions', values: PRACTICE_DAYS.map((d) => sessions.filter((s) => s.day === d).length) }],
              height: 240, showValues: true,
            }))),
          h('div', { className: 'span-6' }, SectionCard({ title: 'Venue load', className: 'chart-card' },
            barChart({
              categories: sortBy(countBy(sessions, 'venue'), 'value', 'desc').slice(0, 8).map((v) => v.key),
              series: [{ name: 'Sessions', values: sortBy(countBy(sessions, 'venue'), 'value', 'desc').slice(0, 8).map((v) => v.value) }],
              horizontal: true, height: 240,
            })))),
        SectionCard({ title: 'All sessions', flush: true },
          DataTable({
            columns: [
              { key: 'name', label: 'Team / club', sticky: true, width: 250, render: (r) => Identity(r.name, r.group), value: (r) => r.name },
              { key: 'kind', label: 'Type', width: 110, filter: true, render: (r) => Badge(r.kind, { tone: r.kind === 'Sports' ? 'info' : 'brand' }) },
              { key: 'day', label: 'Day', width: 130, filter: true },
              { key: 'start', label: 'From', width: 90 },
              { key: 'end', label: 'To', width: 90 },
              { key: 'venue', label: 'Venue', width: 190, filter: true },
              { key: 'inCharge', label: 'In-charge', width: 190, render: (r) => teacherLink(r.inCharge, r.inChargeId), value: (r) => r.inCharge },
              { key: 'people', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
            ],
            rows: sessions, selectable: true, footerAggregates: true, pageSize: 25, exportName: 'practice-schedule',
            searchKeys: ['name', 'group', 'venue', 'day'],
            bulkActions: [{ label: 'Notify participants', icon: 'send', onClick: (sel) => notify({ title: `Notification queued for ${sel.length} sessions`, tone: 'success' }) }],
            rowActions: (r) => [
              { label: 'Reschedule', icon: 'calendar', onClick: mockAction('Reschedule session') },
              { label: 'Cancel this week', icon: 'x-circle', tone: 'danger', onClick: mockAction('Cancel session') },
            ],
            emptyState: emptyFor('calendar', 'No practice sessions', 'Add a session to build the weekly schedule.'),
          })),
      ],
    }));
  },
};

/* ------------------------------------------------ activities / awards --- */

actRoutes['activities/awards'] = {
  title: 'Awards', subtitle: 'Awards conferred on students this session', section: 'activities',
  render(mount, ctx) {
    injectStyles();
    const rows = scoped(db.awards, ctx);
    const byCategory = countBy(rows, 'category');
    const byLevel = countBy(rows, 'level');

    mount.appendChild(listPage({
      title: 'Awards',
      subtitle: `${formatNumber(rows.length)} awards · ${formatNumber(sum(rows, 'points'))} house points conferred`,
      route: 'activities/awards',
      actions: [
        moreMenu([{ label: 'Export awards register', icon: 'download', onClick: mockAction('Export awards') }]),
        Button('Certificates', { variant: 'secondary', icon: 'certificate', route: 'activities/certificates' }),
        Button('Confer an award', {
          variant: 'primary', icon: 'award',
          onClick: () => formPage({
            title: 'Confer an award', mode: 'modal', size: 'lg', submitLabel: 'Confer award',
            sections: [{
              title: 'Award', cols: 2,
              fields: [
                { id: 'student', label: 'Student', type: 'combobox', required: true, options: scoped(db.students, ctx).slice(0, 200).map((s) => ({ value: s.id, label: `${s.name} · ${s.className}-${s.section}` })) },
                { id: 'title', label: 'Award title', required: true, placeholder: 'Best Speaker' },
                { id: 'category', label: 'Category', type: 'select', required: true, options: ['Academic', 'Sports', 'Cultural', 'Discipline', 'Leadership'] },
                { id: 'level', label: 'Level', type: 'select', required: true, options: ['School', 'Inter-School', 'District', 'State', 'National'] },
                { id: 'date', label: 'Date', type: 'date', required: true, value: TODAY },
                { id: 'points', label: 'House points', type: 'number', value: 20, validate: validators.number },
                { id: 'by', label: 'Awarded by', type: 'select', options: ['Principal', 'Chief Guest', 'House Master', 'Sports Head'] },
                { id: 'cert', label: 'Certificate', type: 'switch', switchLabel: 'Generate a certificate automatically', value: true },
                { id: 'citation', label: 'Citation', type: 'textarea', span: 'full' },
              ],
            }],
            onSubmit: (v) => notify({ title: 'Award conferred', text: v.title || '', tone: 'success' }),
          }),
        }),
      ],
      kpis: [
        { label: 'Awards', value: formatNumber(rows.length), icon: 'award', tone: 'brand' },
        { label: 'Students recognised', value: formatNumber(new Set(rows.map((r) => r.studentId)).size), icon: 'users', tone: 'info' },
        { label: 'National / State', value: formatNumber(rows.filter((r) => r.level === 'National' || r.level === 'State').length), icon: 'trophy', tone: 'success' },
        { label: 'House points', value: formatNumber(sum(rows, 'points')), icon: 'flag', tone: 'warning' },
      ],
      chart: barChart({
        categories: byCategory.map((c) => c.key),
        series: [{ name: 'Awards', values: byCategory.map((c) => c.value) }],
        height: 220, showValues: true,
      }),
      chartTitle: 'Awards by category',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Student or award…' },
        { id: 'category', label: 'Category', options: byCategory.map((c) => c.key) },
        { id: 'level', label: 'Level', options: byLevel.map((c) => c.key) },
        { id: 'house', label: 'House', options: db.houses.map((x) => x.name) },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(rows, allV, {
        q: (r, t) => (r.studentName + r.title).toLowerCase().includes(t.toLowerCase()),
        category: (r, v2) => r.category === v2,
        level: (r, v2) => r.level === v2,
        house: (r, v2) => r.house === v2,
      })),
      columns: [
        { key: 'studentName', label: 'Student', sticky: true, width: 220, render: (r) => Identity(r.studentName, `${r.className}-${r.section} · ${r.house}`), value: (r) => r.studentName },
        { key: 'title', label: 'Award', width: 230 },
        { key: 'category', label: 'Category', width: 130, filter: true },
        { key: 'level', label: 'Level', width: 140, filter: true, render: (r) => Badge(r.level, { tone: r.level === 'National' ? 'success' : r.level === 'State' ? 'info' : 'neutral' }) },
        { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date) },
        { key: 'awardedBy', label: 'Awarded by', width: 150, filter: true },
        { key: 'certificateNo', label: 'Certificate no.', width: 160, render: (r) => h('span', { className: 't-mono t-sm' }, r.certificateNo) },
        { key: 'points', label: 'Points', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
      ],
      rows,
      selectable: true, footerAggregates: true, pageSize: 50,
      searchKeys: ['studentName', 'title', 'category', 'certificateNo'],
      bulkActions: [
        { label: 'Print certificates', icon: 'certificate', onClick: (sel) => notify({ title: `${sel.length} certificates queued for printing`, tone: 'success' }) },
        { label: 'Notify parents', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} families notified`, tone: 'success' }) },
      ],
      rowActions: (r) => [
        { label: 'Open student 360', icon: 'user', onClick: () => navigate(`students/profile/${r.studentId}`) },
        { label: 'Generate certificate', icon: 'certificate', onClick: () => navigate('activities/certificates', { award: r.id }) },
        { label: 'Share with parent', icon: 'send', route: 'communication/compose' },
      ],
      onRowClick: (r) => navigate('activities/certificates', { award: r.id }),
      emptyState: emptyFor('award', 'No awards yet', 'Confer an award to recognise a student.'),
    }));
  },
};

/* ------------------------------------------ activities / certificates --- */

const CERT_TEMPLATES = [
  { id: 'excellence', name: 'Certificate of Excellence', accent: 'brand', line: 'in recognition of outstanding achievement' },
  { id: 'merit', name: 'Certificate of Merit', accent: 'info', line: 'for commendable performance and dedication' },
  { id: 'participation', name: 'Certificate of Participation', accent: 'success', line: 'for enthusiastic participation' },
  { id: 'sports', name: 'Sports Achievement Certificate', accent: 'warning', line: 'for sporting excellence and team spirit' },
];

actRoutes['activities/certificates'] = {
  title: 'Certificates', subtitle: 'Design and generate award certificates', section: 'activities',
  render(mount, ctx) {
    injectStyles();
    const awards = scoped(db.awards, ctx);
    if (!awards.length) {
      return mount.appendChild(page({
        title: 'Certificates', route: 'activities/certificates',
        children: Card({ pad: true }, emptyFor('certificate', 'No awards to certify', 'Confer an award first and the certificate generator will populate.',
          Button('Awards', { variant: 'primary', icon: 'award', route: 'activities/awards' }))),
      }));
    }
    const requested = ctx.query && ctx.query.award ? byId(awards, ctx.query.award) : null;
    const state = {
      award: requested || awards[0],
      template: 'excellence',
      signatory: 'Dr. Meera Krishnan, Principal',
      showLogo: true,
      showBorder: true,
      date: TODAY,
    };

    const certHost = h('div', null);
    const paintCert = () => {
      const tpl = CERT_TEMPLATES.find((t) => t.id === state.template) || CERT_TEMPLATES[0];
      const a = state.award;
      certHost.innerHTML = '';
      certHost.appendChild(h('div', { className: 'eng-cert', style: state.showBorder ? null : { border: '1px solid var(--border)' } },
        h('div', { className: state.showBorder ? 'eng-cert-inner' : 'eng-cert-inner', style: state.showBorder ? null : { border: 'none' } },
          state.showLogo && h('div', { className: 'row', style: { gap: 'var(--sp-2)', justifyContent: 'center' } },
            Icon('graduation-cap', 26), h('span', { className: 't-semibold' }, 'Springdale International School')),
          h('div', { className: 't-eyebrow' }, tpl.name),
          h('div', { className: 't-sm t-muted' }, 'This certificate is proudly presented to'),
          h('div', { className: 'eng-cert-name' }, a.studentName),
          h('div', { className: 'eng-cert-rule' }),
          h('div', { className: 't-sm' }, tpl.line),
          h('div', { className: 't-title' }, a.title),
          h('div', { className: 't-sm t-muted' }, `${a.category} · ${a.level} level · ${a.className}-${a.section} · ${a.house} House`),
          h('div', { className: 't-sm t-muted' }, `Awarded on ${formatDate(state.date)}`),
          h('div', { className: 'eng-cert-sign' },
            h('div', { className: 'stack-1', style: { textAlign: 'left' } },
              h('div', { className: 't-xs t-muted' }, 'Certificate no.'),
              h('div', { className: 't-mono t-sm' }, a.certificateNo)),
            h('div', { className: 'stack-1', style: { textAlign: 'right' } },
              h('div', { style: { width: '150px', height: '1px', background: 'var(--border-strong)', marginLeft: 'auto' } }),
              h('div', { className: 't-sm t-medium' }, state.signatory))))));
    };
    paintCert();

    mount.appendChild(page({
      title: 'Certificate generator',
      subtitle: `${formatNumber(awards.length)} awards eligible for a certificate`,
      route: 'activities/certificates',
      actions: [
        Button('Awards register', { variant: 'ghost', icon: 'award', route: 'activities/awards' }),
        Button('Bulk generate', {
          variant: 'secondary', icon: 'layers',
          onClick: () => ConfirmDialog({
            title: `Generate ${formatNumber(awards.length)} certificates?`,
            text: 'A PDF pack will be prepared for printing and each parent gets a digital copy.',
            confirmLabel: 'Generate all', tone: 'brand', icon: 'certificate',
          }).then((ok) => ok && notify({ title: 'Certificate pack queued', text: `${formatNumber(awards.length)} certificates`, tone: 'success' })),
        }),
        Button('Print this certificate', { variant: 'primary', icon: 'print', onClick: () => printNode(certHost, 'Certificate') }),
      ],
      children: [
        h('div', { className: 'detail-split' },
          h('div', { className: 'stack' },
            SectionCard({ title: 'Preview', icon: 'eye', subtitle: 'Exactly what will be printed on A4 landscape' }, certHost),
            SectionCard({ title: 'Eligible awards', flush: true, subtitle: 'Click a row to preview that certificate' },
              DataTable({
                columns: [
                  { key: 'studentName', label: 'Student', sticky: true, width: 210, render: (r) => Identity(r.studentName, `${r.className}-${r.section}`), value: (r) => r.studentName },
                  { key: 'title', label: 'Award', width: 220 },
                  { key: 'category', label: 'Category', width: 130, filter: true },
                  { key: 'level', label: 'Level', width: 130, filter: true },
                  { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date) },
                  { key: 'certificateNo', label: 'Certificate no.', width: 160, render: (r) => h('span', { className: 't-mono t-sm' }, r.certificateNo) },
                ],
                rows: awards, selectable: true, pageSize: 25, exportName: 'certificates',
                searchKeys: ['studentName', 'title', 'certificateNo'],
                bulkActions: [
                  { label: 'Generate PDFs', icon: 'certificate', onClick: (sel) => notify({ title: `${sel.length} certificates generated`, tone: 'success' }) },
                  { label: 'Email to parents', icon: 'mail', onClick: (sel) => notify({ title: `${sel.length} certificates emailed`, tone: 'success' }) },
                ],
                onRowClick: (r) => { state.award = r; paintCert(); notify({ title: 'Preview updated', text: r.studentName, tone: 'info', duration: 1800 }); },
                emptyState: emptyFor('certificate', 'No awards', 'Confer an award to generate a certificate.'),
              }))),
          h('div', { className: 'stack-3' },
            SectionCard({ title: 'Template', icon: 'palette' },
              h('div', { className: 'stack-2' },
                RadioGroup(CERT_TEMPLATES.map((t) => ({ value: t.id, label: t.name })), {
                  name: 'cert-tpl', value: state.template,
                  onChange: (v) => { state.template = v; paintCert(); },
                }))),
            SectionCard({ title: 'Options', icon: 'settings' },
              h('div', { className: 'stack-3' },
                Field({ label: 'Signatory' }, Input({ value: state.signatory, onInput: (v) => { state.signatory = v; paintCert(); } })),
                Field({ label: 'Date on certificate' }, DatePicker({ value: state.date, onChange: (v) => { state.date = v; paintCert(); } })),
                Switch('Show school crest', { checked: state.showLogo, onChange: (v) => { state.showLogo = v; paintCert(); } }),
                Switch('Decorative border', { checked: state.showBorder, onChange: (v) => { state.showBorder = v; paintCert(); } }))),
            SectionCard({ title: 'Delivery', icon: 'send' },
              h('div', { className: 'stack-2' },
                Button('Email to parent', { variant: 'secondary', icon: 'mail', block: true, onClick: () => notify({ title: 'Certificate emailed', text: state.award.studentName, tone: 'success' }) }),
                Button('Add to student record', { variant: 'ghost', icon: 'folder', block: true, onClick: () => notify({ title: 'Filed in the student record', tone: 'success' }) }),
                Button('Download PDF', { variant: 'ghost', icon: 'download', block: true, onClick: mockAction('Download certificate') }))),
            Callout({ tone: 'info', icon: 'info', title: 'Numbering' },
              'Certificate numbers follow the CERT/YY/NNNN series and are never reused, so every certificate is verifiable from the awards register.'))),
      ],
    }));
  },
};

/* ------------------------------------------ activities / achievements --- */

actRoutes['activities/achievements'] = {
  title: 'Achievement Records', subtitle: 'The permanent record of student achievement', section: 'activities',
  render(mount, ctx) {
    injectStyles();
    const awards = scoped(db.awards, ctx);
    const grouped = [...groupBy(awards, 'studentId')].map(([sid, items]) => {
      const s = byId(db.students, sid) || {};
      const best = sortBy(items, (a) => ['School', 'Inter-School', 'District', 'State', 'National'].indexOf(a.level), 'desc')[0];
      return {
        id: sid, name: items[0].studentName, className: items[0].className, section: items[0].section,
        house: items[0].house,
        total: items.length,
        points: sum(items, 'points'),
        highest: best ? best.level : '—',
        categories: [...new Set(items.map((i) => i.category))],
        latest: sortBy(items, 'date', 'desc')[0].date,
        cgpa: s.cgpa || 0,
        items,
      };
    });
    const ranked = sortBy(grouped, 'points', 'desc');

    mount.appendChild(listPage({
      title: 'Achievement records',
      subtitle: `${formatNumber(ranked.length)} students with recorded achievements · ${formatNumber(awards.length)} awards in total`,
      route: 'activities/achievements',
      actions: [
        moreMenu([{ label: 'Export achievement register', icon: 'download', onClick: mockAction('Export achievements') }]),
        Button('Awards', { variant: 'secondary', icon: 'award', route: 'activities/awards' }),
        Button('Honour roll', { variant: 'primary', icon: 'trophy', onClick: () => Drawer({
          title: 'Honour roll 2026-27', subtitle: 'Top 20 students by achievement points', size: 'lg',
          body: h('div', { className: 'stack-4' },
            RankList(ranked.slice(0, 20).map((r) => ({ name: r.name, meta: `${r.className}-${r.section} · ${r.house} · ${r.total} awards`, value: `${r.points} pts`, avatar: r.name }))),
            Callout({ tone: 'info', icon: 'info', title: 'How points work' },
              'National awards carry 50 points, State 35, District 20, Inter-School 12 and School-level 5. Points also count towards the house leaderboard.')),
          actions: (close) => frag(
            Button('Close', { variant: 'ghost', onClick: close }),
            Button('Publish honour roll', { variant: 'primary', icon: 'send', onClick: () => { close(); notify({ title: 'Honour roll published to the notice board', tone: 'success' }); } })),
        }) }),
      ],
      kpis: [
        { label: 'Students recognised', value: formatNumber(ranked.length), icon: 'users', tone: 'brand' },
        { label: 'Total awards', value: formatNumber(awards.length), icon: 'award', tone: 'info' },
        { label: 'Beyond school level', value: formatNumber(awards.filter((a) => a.level !== 'School').length), icon: 'trophy', tone: 'success' },
        { label: 'Avg awards per student', value: (awards.length / Math.max(1, ranked.length)).toFixed(1), icon: 'percent', tone: 'warning' },
      ],
      chart: barChart({
        categories: ['School', 'Inter-School', 'District', 'State', 'National'],
        series: [{ name: 'Awards', values: ['School', 'Inter-School', 'District', 'State', 'National'].map((l) => awards.filter((a) => a.level === l).length) }],
        height: 220, showValues: true,
      }),
      chartTitle: 'Achievements by level',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Student name…' },
        { id: 'house', label: 'House', options: db.houses.map((x) => x.name) },
        { id: 'className', label: 'Class', options: [...new Set(ranked.map((r) => r.className))] },
        { id: 'highest', label: 'Highest level', options: ['School', 'Inter-School', 'District', 'State', 'National'] },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(ranked, allV, {
        q: (r, t) => r.name.toLowerCase().includes(t.toLowerCase()),
        house: (r, v2) => r.house === v2,
        className: (r, v2) => r.className === v2,
        highest: (r, v2) => r.highest === v2,
      })),
      columns: [
        { key: 'name', label: 'Student', sticky: true, width: 230, render: (r) => Identity(r.name, `${r.className}-${r.section} · ${r.house}`), value: (r) => r.name },
        { key: 'total', label: 'Awards', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'points', label: 'Points', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'highest', label: 'Highest level', width: 150, filter: true, render: (r) => Badge(r.highest, { tone: r.highest === 'National' ? 'success' : r.highest === 'State' ? 'info' : 'neutral' }) },
        { key: 'categories', label: 'Categories', width: 260, render: (r) => h('div', { className: 'row-3 row-wrap' }, r.categories.map((c) => Tag(c))), value: (r) => r.categories.join(',') },
        { key: 'latest', label: 'Most recent', width: 140, render: (r) => formatDate(r.latest), value: (r) => r.latest },
        { key: 'cgpa', label: 'CGPA', width: 90, align: 'right', numeric: true, aggregate: 'avg', format: (v) => v.toFixed(2) },
      ],
      rows: ranked,
      selectable: true, footerAggregates: true, pageSize: 25,
      searchKeys: ['name', 'className', 'house'],
      expandable: (r) => h('div', { className: 'stack-2' },
        h('div', { className: 't-eyebrow' }, `All achievements for ${r.name}`),
        Timeline(sortBy(r.items, 'date', 'desc').map((a) => ({
          title: a.title, meta: `${formatDate(a.date)} · ${a.level}`,
          text: `${a.category} · awarded by ${a.awardedBy} · ${a.points} points · ${a.certificateNo}`,
          icon: 'award', tone: a.level === 'National' ? 'success' : a.level === 'State' ? 'info' : 'brand',
        })))),
      bulkActions: [
        { label: 'Print certificates', icon: 'certificate', onClick: (sel) => notify({ title: `${formatNumber(sum(sel, 'total'))} certificates queued`, tone: 'success' }) },
        { label: 'Add to honour roll', icon: 'trophy', onClick: (sel) => notify({ title: `${sel.length} students added to the honour roll`, tone: 'success' }) },
      ],
      rowActions: (r) => [
        { label: 'Open student 360', icon: 'user', onClick: () => navigate(`students/profile/${r.id}`) },
        { label: 'Certificates', icon: 'certificate', route: 'activities/certificates' },
      ],
      onRowClick: (r) => navigate(`students/profile/${r.id}`),
      emptyState: emptyFor('medal', 'No achievements recorded', 'Awards conferred on students build this permanent record.'),
    }));
  },
};

/* ----------------------------------------------- activities / reports --- */

actRoutes['activities/reports'] = {
  title: 'Activity Reports', subtitle: 'Participation, house points and recognition analytics', section: 'activities',
  render(mount, ctx) {
    injectStyles();
    const awards = scoped(db.awards, ctx);
    const comps = scoped(db.competitions, ctx);
    const houses = houseStats(ctx);
    const clubs = scoped(db.clubs, ctx);
    const teams = scoped(db.sportsTeams, ctx);
    const participation = participationRows(ctx);

    const rows = comps.map((c) => {
      const parts = participation.filter((p) => p.competitionId === c.id);
      return {
        id: c.id, name: c.name, type: c.type, category: c.category, date: c.date,
        venue: c.venue, campus: campusName(c.campusId),
        participants: c.participants,
        podium: parts.filter((p) => p.result === 'Winner' || p.result === 'Runner-up').length,
        winnerHouse: c.status === 'Completed' ? c.winnerHouse : '—',
        budget: c.budget,
        costPerHead: Math.round(c.budget / Math.max(1, c.participants)),
        status: c.status,
      };
    });

    mount.appendChild(reportPage({
      title: 'Activity reports',
      subtitle: `${formatNumber(comps.length)} competitions · ${formatNumber(awards.length)} awards · ${formatNumber(sum(clubs, 'members') + sum(teams, 'players'))} activity memberships`,
      route: 'activities/reports',
      filters: [
        { id: 'category', label: 'Category', options: ['Academic', 'Sports', 'Cultural', 'Technical'] },
        { id: 'type', label: 'Level', options: ['Inter-House', 'Inter-School', 'District', 'State', 'National'] },
        { id: 'status', label: 'Status', options: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'] },
      ],
      onFilter: (id, v, allV, table) => {
        if (table) table.refresh(applyFilters(rows, allV, {
          category: (r, v2) => r.category === v2,
          type: (r, v2) => r.type === v2,
          status: (r, v2) => r.status === v2,
        }));
      },
      summary: [
        { label: 'Competitions', value: formatNumber(comps.length), icon: 'trophy', tone: 'brand' },
        { label: 'Participations', value: formatNumber(sum(comps, 'participants')), icon: 'users', tone: 'info' },
        { label: 'Awards conferred', value: formatNumber(awards.length), icon: 'award', tone: 'success' },
        { label: 'Activity budget', value: formatCurrency(sum(comps, 'budget'), { compact: true }), icon: 'wallet', tone: 'warning' },
      ],
      chart: [
        barChart({
          categories: houses.map((hs) => hs.name),
          series: [
            { name: 'Awards', values: houses.map((hs) => hs.awards) },
            { name: 'Competition wins', values: houses.map((hs) => hs.wins) },
          ],
          height: 260,
        }),
        donutChart({
          data: countBy(awards, 'category').map((c) => ({ key: c.key, value: c.value })),
          height: 260, centerLabel: 'Awards', centerValue: formatNumber(awards.length),
        }),
        treemap({
          data: clubs.map((c) => ({ key: c.name, value: c.members })),
          height: 280,
        }),
      ],
      chartTitle: 'House performance — awards and competition wins',
      notes: Callout({ tone: 'info', icon: 'lightbulb', title: 'Participation equity' },
        `${formatNumber(new Set(awards.map((a) => a.studentId)).size)} distinct students hold an award this session. Aim for at least one recorded activity per student before the annual report card cycle.`),
      columns: [
        { key: 'name', label: 'Competition', sticky: true, width: 250, render: (r) => Identity(r.name, `${r.type} · ${r.category}`), value: (r) => r.name },
        { key: 'campus', label: 'Campus', width: 170, filter: true },
        { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date) },
        { key: 'participants', label: 'Participants', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'podium', label: 'Podium finishes', width: 150, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'winnerHouse', label: 'Winning house', width: 150, filter: true },
        { key: 'budget', label: 'Budget', width: 130, align: 'right', numeric: true, aggregate: 'sum', render: (r) => formatCurrency(r.budget), format: (v) => formatCurrency(v, { compact: true }) },
        { key: 'costPerHead', label: 'Cost / participant', width: 160, align: 'right', numeric: true, render: (r) => formatCurrency(r.costPerHead), value: (r) => r.costPerHead, aggregate: 'avg', format: (v) => formatCurrency(Math.round(v)) },
        { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
      ],
      rows,
      tableTitle: 'Competition-wise detail',
      footerAggregates: true,
    }));
  },
};

/* ==========================================================================
   6. Events
   ========================================================================== */

const evtRoutes = {};

const EVENT_TONE = {
  Cultural: 'brand', Academic: 'info', Sports: 'success',
  Institutional: 'warning', Trip: 'danger', Community: 'neutral',
};

function eventsFor(ctx) { return scoped(db.events, ctx); }

/** Deterministic registration rows for an event. */
function eventRegistrations(ev, ctx) {
  const students = scoped(db.students, ctx);
  const rnd = rngFor('reg' + ev.id);
  const n = Math.min(ev.registered, 180);
  const out = [];
  for (let i = 0; i < n; i++) {
    const s = students[(i * 11 + 3) % students.length];
    const attended = ev.status === 'Completed' ? rnd() < 0.86 : false;
    out.push({
      id: `${ev.id}-${s.id}-${i}`,
      studentId: s.id, name: s.name, admissionNo: s.admissionNo,
      className: s.className, section: s.section, house: s.house,
      parent: s.fatherName, phone: s.phone,
      role: rnd() < 0.12 ? 'Performer' : rnd() < 0.2 ? 'Volunteer' : 'Attendee',
      registeredOn: formatDate(new Date(new Date(ev.date).getTime() - intBetween(rnd, 3, 21) * 86400000), 'iso'),
      consent: rnd() < 0.93,
      fee: ev.category === 'Trip' ? intBetween(rnd, 1500, 6500) : 0,
      paid: ev.category === 'Trip' ? rnd() < 0.82 : true,
      attended,
      status: attended ? 'Attended' : ev.status === 'Completed' ? 'Absent' : 'Registered',
    });
  }
  return out;
}

function eventBudgetLines(ev) {
  const rnd = rngFor('bud' + ev.id);
  const heads = ['Venue & staging', 'Décor and props', 'Sound & lighting', 'Refreshments', 'Prizes & trophies', 'Printing & publicity', 'Transport', 'Guest hospitality', 'Photography', 'Contingency'];
  let remaining = ev.budget;
  const lines = heads.map((head, i) => {
    const share = i === heads.length - 1 ? remaining : Math.round(ev.budget * (0.06 + rnd() * 0.16));
    const allocated = Math.max(2000, Math.min(share, remaining));
    remaining = Math.max(0, remaining - allocated);
    const spent = Math.round(allocated * (ev.status === 'Completed' ? 0.7 + rnd() * 0.45 : rnd() * 0.4));
    return {
      id: `${ev.id}-${i}`, head, allocated, spent,
      variance: allocated - spent,
      utilisation: pct(spent, Math.max(1, allocated)),
      vendor: pickFrom(rnd, db.vendors).name,
      status: spent > allocated ? 'Overspent' : spent > 0 ? 'In Progress' : 'Pending',
    };
  });
  return lines;
}

/* ------------------------------------------------- events / calendar ---- */

evtRoutes['events/calendar'] = {
  title: 'Event Calendar', subtitle: 'Every event and holiday on one calendar', section: 'events',
  render(mount, ctx) {
    injectStyles();
    const events = eventsFor(ctx);
    const holidays = db.holidays;

    const calEvents = events.map((e) => ({
      date: e.date, title: e.title, tone: EVENT_TONE[e.category] || 'brand',
      meta: `${e.venue} · ${e.startTime}`, badge: e.category, __ev: e,
    })).concat(holidays.map((hday) => ({
      date: hday.date, title: `${hday.name}${hday.days > 1 ? ` (${hday.days} days)` : ''}`,
      tone: 'neutral', meta: hday.type, badge: 'Holiday',
    })));

    const upcoming = sortBy(events.filter((e) => e.date >= TODAY), 'date').slice(0, 6);

    mount.appendChild(calendarPage({
      title: 'Event calendar',
      subtitle: `${formatNumber(events.length)} events and ${formatNumber(holidays.length)} holidays in 2026-27`,
      route: 'events/calendar',
      month: '2026-08',
      events: calEvents,
      legend: h('div', { className: 'row-4 row-wrap' },
        Object.entries(EVENT_TONE).map(([cat, tone]) => Badge(cat, { tone, dot: true })),
        Badge('Holiday', { tone: 'neutral', dot: true })),
      actions: [
        moreMenu([{ label: 'Subscribe (iCal)', icon: 'calendar', onClick: mockAction('Subscribe to calendar') }]),
        Button('All events', { variant: 'secondary', icon: 'list', route: 'events/all' }),
        !isLearner() && Button('Create event', { variant: 'primary', icon: 'plus', route: 'events/create' }),
      ].filter(Boolean),
      kpis: [
        { label: 'Events this year', value: formatNumber(events.length), icon: 'calendar-check', tone: 'brand' },
        { label: 'Upcoming', value: formatNumber(events.filter((e) => e.date >= TODAY).length), icon: 'clock', tone: 'info' },
        { label: 'Holidays', value: formatNumber(holidays.length), icon: 'umbrella', tone: 'success' },
        { label: 'Committed budget', value: formatCurrency(sum(events, 'budget'), { compact: true }), icon: 'wallet', tone: 'warning' },
      ],
      onSelectEvent: (e) => { if (e.__ev) navigate(`events/all/${e.__ev.id}`); else notify({ title: e.title, text: e.meta, tone: 'info' }); },
      onSelectDate: (iso, dayEvents) => notify({
        title: formatDate(iso),
        text: dayEvents.length ? `${dayEvents.length} item(s): ${dayEvents.map((d) => d.title).join(', ')}` : 'Nothing scheduled on this day.',
        tone: dayEvents.length ? 'info' : 'neutral',
      }),
      sidebar: [
        SectionCard({ title: 'Next up', icon: 'calendar-check', actions: Button('All', { variant: 'link', size: 'sm', route: 'events/all' }) },
          upcoming.length ? h('div', { className: 'stack-2' },
            upcoming.map((e) => h('button', {
              type: 'button', className: 'menu-item', onClick: () => navigate(`events/all/${e.id}`),
            },
              Icon('calendar', 15),
              h('div', { className: 'flex-1 min-0' },
                h('div', { className: 't-sm t-medium t-truncate' }, e.title),
                h('div', { className: 't-xs t-muted' }, `${formatDate(e.date, 'dayMonth')} · ${e.venue}`)),
              Badge(e.category, { tone: EVENT_TONE[e.category], size: 'sm' }))))
            : emptyFor('calendar', 'Nothing coming up', 'Create an event to fill the calendar.')),
        SectionCard({ title: 'Holidays', icon: 'umbrella', actions: Button('Manage', { variant: 'link', size: 'sm', route: 'events/holidays' }) },
          Timeline(sortBy(holidays.filter((hday) => hday.date >= TODAY), 'date').slice(0, 6).map((hday) => ({
            title: hday.name, meta: formatDate(hday.date), text: `${hday.type} · ${hday.days} day(s)`,
            icon: 'umbrella', tone: 'info',
          })))),
        SectionCard({ title: 'Events by category', className: 'chart-card' },
          donutChart({ data: countBy(events, 'category').map((c) => ({ key: c.key, value: c.value })), height: 220, centerLabel: 'Events' })),
      ],
    }));
  },
};

/* ----------------------------------------------------- events / all ----- */

function eventDetail(mount, ctx, ev) {
  const regs = eventRegistrations(ev, ctx);
  const budget = eventBudgetLines(ev);
  const photos = [];
  for (let i = 0; i < Math.min(ev.photos, 12); i++) {
    photos.push({ caption: `${ev.title} — photo ${i + 1}`, hue: (i % 6) + 1 });
  }

  mount.appendChild(detailPage({
    title: ev.title,
    subtitle: `${ev.category} · ${formatDate(ev.date)} · ${ev.venue} · ${campusName(ev.campusId)}`,
    route: 'events/all',
    initials: ev.title.slice(0, 2).toUpperCase(),
    badges: [Badge(ev.status), Badge(ev.category, { tone: EVENT_TONE[ev.category] })],
    meta: [
      { label: 'Time', value: `${ev.startTime} – ${ev.endTime}`, icon: 'clock' },
      { label: 'Organiser', value: ev.organiser, icon: 'briefcase' },
      { label: 'Audience', value: ev.audience, icon: 'users' },
      { label: 'Registered', value: formatNumber(ev.registered), icon: 'clipboard-list' },
      { label: 'Budget', value: formatCurrency(ev.budget, { compact: true }), icon: 'wallet' },
    ],
    actions: [
      Button('Back to events', { variant: 'ghost', icon: 'arrow-left', route: 'events/all' }),
      Button('Message attendees', { variant: 'secondary', icon: 'send', route: 'communication/compose' }),
      ev.status === 'Completed'
        ? Button('Publish gallery', { variant: 'primary', icon: 'camera', route: 'events/gallery' })
        : Button('Open registrations', { variant: 'primary', icon: 'clipboard-list', onClick: () => navigate('events/registrations', { event: ev.id }) }),
    ],
    tabs: [
      {
        id: 'overview', label: 'Overview', icon: 'info',
        render: () => h('div', { className: 'stack' },
          Card({ pad: true }, h('div', { className: 't-body' }, ev.description)),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-6' }, SectionCard({ title: 'Details', icon: 'list' },
              DescriptionList([
                ['Date', formatDate(ev.date)],
                ['Time', `${ev.startTime} – ${ev.endTime}`],
                ['Venue', ev.venue],
                ['Campus', campusName(ev.campusId)],
                ['Organising department', ev.organiser],
                ['Audience', ev.audience],
                ['Chief guest', ev.chiefGuest || 'Not invited'],
                ['Expected attendance', formatNumber(ev.expectedAttendance)],
              ], { cols: 2 }))),
            h('div', { className: 'span-6' }, SectionCard({ title: 'Turnout', className: 'chart-card' },
              barChart({
                categories: ['Expected', 'Registered', 'Attended'],
                series: [{ name: 'People', values: [ev.expectedAttendance, ev.registered, ev.attended] }],
                height: 240, showValues: true,
              }))),
            h('div', { className: 'span-12' }, SectionCard({ title: 'Run of show', icon: 'clock' },
              Timeline([
                { title: 'Setup & sound check', meta: `${ev.startTime}`, text: `${ev.venue} · technical team`, icon: 'tool', tone: 'info' },
                { title: 'Guests seated', meta: '30 minutes later', text: 'Front office manages the guest register.', icon: 'users', tone: 'brand' },
                { title: 'Formal programme', meta: 'Main session', text: ev.chiefGuest ? `Address by ${ev.chiefGuest}` : 'Principal’s address and student performances.', icon: 'megaphone', tone: 'success' },
                { title: 'Vote of thanks & close', meta: ev.endTime, text: 'Dispersal supervised by class teachers.', icon: 'check-circle', tone: 'neutral' },
              ]))))),
      },
      {
        id: 'registrations', label: 'Registrations', icon: 'clipboard-list', count: regs.length,
        render: () => DataTable({
          columns: [
            { key: 'name', label: 'Student', sticky: true, width: 220, render: (r) => Identity(r.name, `${r.className}-${r.section}`), value: (r) => r.name },
            { key: 'house', label: 'House', width: 110, filter: true },
            { key: 'role', label: 'Role', width: 130, filter: true, render: (r) => Badge(r.role, { tone: r.role === 'Performer' ? 'brand' : r.role === 'Volunteer' ? 'info' : 'neutral' }) },
            { key: 'registeredOn', label: 'Registered', width: 130, render: (r) => formatDate(r.registeredOn) },
            { key: 'consent', label: 'Consent', width: 110, render: (r) => (r.consent ? Badge('Received', { tone: 'success' }) : Badge('Pending', { tone: 'warning' })), value: (r) => (r.consent ? 1 : 0) },
            { key: 'fee', label: 'Fee', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => (r.fee ? formatCurrency(r.fee) : '—'), format: (v) => formatCurrency(v, { compact: true }) },
            { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
          ],
          rows: regs, selectable: true, footerAggregates: true, pageSize: 25, exportName: `registrations-${ev.id}`,
          searchKeys: ['name', 'className', 'house'],
          bulkActions: [{ label: 'Send reminder', icon: 'bell', onClick: (sel) => notify({ title: `Reminder sent to ${sel.length} families`, tone: 'success' }) }],
          onRowClick: (r) => navigate(`students/profile/${r.studentId}`),
          emptyState: emptyFor('clipboard-list', 'No registrations', 'Open registrations so students can sign up.'),
        }),
      },
      {
        id: 'attendance', label: 'Attendance', icon: 'clipboard-check', count: regs.filter((r) => r.attended).length,
        render: () => h('div', { className: 'stack' },
          kpiRow([
            { label: 'Registered', value: formatNumber(regs.length), icon: 'clipboard-list', tone: 'brand' },
            { label: 'Attended', value: formatNumber(regs.filter((r) => r.attended).length), icon: 'user-check', tone: 'success' },
            { label: 'Absent', value: formatNumber(regs.filter((r) => !r.attended && ev.status === 'Completed').length), icon: 'user-x', tone: 'danger' },
            { label: 'Turnout', value: `${pct(regs.filter((r) => r.attended).length, Math.max(1, regs.length))}%`, icon: 'percent', tone: 'info' },
          ]),
          SectionCard({ title: 'Mark attendance', flush: true, subtitle: 'Tick a row to mark the student present' },
            DataTable({
              columns: [
                { key: 'name', label: 'Student', sticky: true, width: 230, render: (r) => Identity(r.name, `${r.className}-${r.section}`), value: (r) => r.name },
                { key: 'role', label: 'Role', width: 130, filter: true },
                {
                  key: 'attended', label: 'Present', width: 120, sortable: false,
                  render: (r) => Checkbox('', { checked: r.attended, onChange: (v) => notify({ title: v ? 'Marked present' : 'Marked absent', text: r.name, tone: v ? 'success' : 'warning', duration: 1500 }) }),
                },
                { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
              ],
              rows: regs, selectable: true, pageSize: 25, exportName: `attendance-${ev.id}`,
              searchKeys: ['name', 'className'],
              bulkActions: [
                { label: 'Mark present', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} marked present`, tone: 'success' }) },
                { label: 'Mark absent', icon: 'x', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} marked absent`, tone: 'warning' }) },
              ],
            }))),
      },
      {
        id: 'budget', label: 'Budget', icon: 'wallet', count: budget.length,
        render: () => h('div', { className: 'stack' },
          kpiRow([
            { label: 'Allocated', value: formatCurrency(sum(budget, 'allocated'), { compact: true }), icon: 'wallet', tone: 'brand' },
            { label: 'Spent', value: formatCurrency(sum(budget, 'spent'), { compact: true }), icon: 'receipt', tone: 'info' },
            { label: 'Remaining', value: formatCurrency(sum(budget, 'allocated') - sum(budget, 'spent'), { compact: true }), icon: 'piggy-bank', tone: 'success' },
            { label: 'Utilisation', value: `${pct(sum(budget, 'spent'), Math.max(1, sum(budget, 'allocated')))}%`, icon: 'gauge', tone: 'warning' },
          ]),
          SectionCard({ title: 'Head-wise spend', className: 'chart-card' },
            barChart({
              categories: budget.map((b) => b.head),
              series: [
                { name: 'Allocated', values: budget.map((b) => b.allocated) },
                { name: 'Spent', values: budget.map((b) => b.spent) },
              ],
              horizontal: true, valueFormat: 'currencyCompact', height: 320,
            })),
          SectionCard({ title: 'Budget lines', flush: true },
            DataTable({
              columns: [
                { key: 'head', label: 'Head', sticky: true, width: 220 },
                { key: 'vendor', label: 'Vendor', width: 190 },
                { key: 'allocated', label: 'Allocated', width: 130, align: 'right', numeric: true, aggregate: 'sum', render: (r) => formatCurrency(r.allocated), format: (v) => formatCurrency(v, { compact: true }) },
                { key: 'spent', label: 'Spent', width: 130, align: 'right', numeric: true, aggregate: 'sum', render: (r) => formatCurrency(r.spent), format: (v) => formatCurrency(v, { compact: true }) },
                { key: 'variance', label: 'Variance', width: 130, align: 'right', numeric: true, aggregate: 'sum', render: (r) => h('span', { className: r.variance < 0 ? 't-danger t-num' : 't-num' }, formatCurrency(r.variance)), format: (v) => formatCurrency(v, { compact: true }) },
                { key: 'utilisation', label: 'Utilisation', width: 170, render: (r) => progressCell(Math.min(100, r.utilisation), r.utilisation > 100 ? 'danger' : r.utilisation > 80 ? 'warning' : 'success'), value: (r) => r.utilisation },
                { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status, { tone: r.status === 'Overspent' ? 'danger' : undefined }) },
              ],
              rows: budget, footerAggregates: true, paginate: false, exportName: `budget-${ev.id}`,
            }))),
      },
      {
        id: 'gallery', label: 'Gallery', icon: 'camera', count: photos.length,
        render: () => photos.length
          ? SectionCard({ title: 'Event photographs', icon: 'camera', subtitle: `${formatNumber(ev.photos)} photos uploaded`, actions: Button('Upload', { variant: 'secondary', size: 'sm', icon: 'upload', onClick: mockAction('Upload photos') }) },
            h('div', { className: 'eng-grid' }, photos.map((p) => h('div', { className: 'eng-photo', dataset: { hue: String(p.hue) } },
              Icon('camera', 26),
              h('div', { className: 'eng-photo-cap t-truncate' }, p.caption)))))
          : Card({ pad: true }, emptyFor('camera', 'No photographs yet', 'Photos appear here once the media team uploads them after the event.',
            Button('Upload photos', { variant: 'primary', icon: 'upload', onClick: mockAction('Upload photos') }))),
      },
    ],
    sidebar: [
      SectionCard({ title: 'Registration progress', icon: 'gauge', className: 'chart-card' },
        h('div', { className: 'row', style: { justifyContent: 'center' } },
          progressRing(pct(ev.registered, Math.max(1, ev.expectedAttendance)), { label: 'Registered', sublabel: `of ${formatNumber(ev.expectedAttendance)}` })),
        h('div', { className: 'mt-3' },
          MetricRow('Registered', formatNumber(ev.registered)),
          MetricRow('Attended', formatNumber(ev.attended)),
          MetricRow('Consent pending', formatNumber(regs.filter((r) => !r.consent).length)))),
      SectionCard({ title: 'Budget health', icon: 'wallet' },
        h('div', { className: 'stack-3' },
          MetricRow('Budget', formatCurrency(ev.budget)),
          MetricRow('Spent', formatCurrency(ev.spent)),
          ProgressBar(pct(ev.spent, Math.max(1, ev.budget)), {
            tone: ev.spent > ev.budget ? 'danger' : pct(ev.spent, Math.max(1, ev.budget)) > 80 ? 'warning' : 'success',
            label: 'Utilisation', showValue: true,
          }),
          Button('Open budget sheet', { variant: 'secondary', size: 'sm', icon: 'wallet', block: true, route: 'events/budget' }))),
      SectionCard({ title: 'Quick actions', icon: 'zap' },
        h('div', { className: 'stack-2' },
          Button('Registrations', { variant: 'ghost', size: 'sm', icon: 'clipboard-list', block: true, onClick: () => navigate('events/registrations', { event: ev.id }) }),
          Button('Attendance sheet', { variant: 'ghost', size: 'sm', icon: 'clipboard-check', block: true, onClick: () => navigate('events/attendance', { event: ev.id }) }),
          Button('Gallery', { variant: 'ghost', size: 'sm', icon: 'camera', block: true, route: 'events/gallery' }),
          Button('Send invitation', { variant: 'ghost', size: 'sm', icon: 'send', block: true, route: 'communication/compose' }))),
    ],
    timeline: [
      { title: 'Event created', meta: formatDate('2026-04-08'), text: `Proposed by the ${ev.organiser} department.`, icon: 'plus', tone: 'info' },
      { title: 'Budget approved', meta: formatDate('2026-05-02'), text: formatCurrency(ev.budget), icon: 'wallet', tone: 'success' },
      { title: 'Registrations opened', meta: formatDate('2026-06-14'), text: `${formatNumber(ev.registered)} registrations received.`, icon: 'clipboard-list', tone: 'brand' },
      ev.status === 'Completed'
        ? { title: 'Event completed', meta: formatDate(ev.date), text: `${formatNumber(ev.attended)} attended · ${formatNumber(ev.photos)} photos uploaded.`, icon: 'check-circle', tone: 'success' }
        : { title: 'Preparation under way', meta: formatDate(ev.date), text: 'Rehearsals and vendor coordination in progress.', icon: 'clock', tone: 'warning' },
    ],
  }));
}

evtRoutes['events/all'] = {
  title: 'All Events', subtitle: 'Every school event with registrations, budget and gallery', section: 'events',
  render(mount, ctx) {
    injectStyles();
    const rows = eventsFor(ctx);
    if (ctx.param) {
      const ev = byId(rows, ctx.param) || byId(db.events, ctx.param);
      if (!ev) return mount.appendChild(missingRecord('event', 'events/all'));
      return eventDetail(mount, ctx, ev);
    }
    const upcoming = rows.filter((r) => r.status !== 'Completed');

    mount.appendChild(listPage({
      title: 'All events',
      subtitle: `${formatNumber(rows.length)} events · ${formatNumber(upcoming.length)} upcoming · ${formatCurrency(sum(rows, 'budget'), { compact: true })} committed`,
      route: 'events/all',
      actions: [
        moreMenu([{ label: 'Export annual planner', icon: 'download', onClick: mockAction('Export planner') }]),
        Button('Calendar', { variant: 'secondary', icon: 'calendar', route: 'events/calendar' }),
        !isLearner() && Button('Create event', { variant: 'primary', icon: 'plus', route: 'events/create' }),
      ].filter(Boolean),
      kpis: [
        { label: 'Events', value: formatNumber(rows.length), icon: 'calendar-check', tone: 'brand' },
        { label: 'Registrations', value: formatNumber(sum(rows, 'registered')), icon: 'clipboard-list', tone: 'info' },
        { label: 'Attendance', value: formatNumber(sum(rows, 'attended')), icon: 'user-check', tone: 'success' },
        { label: 'Budget utilisation', value: `${pct(sum(rows, 'spent'), Math.max(1, sum(rows, 'budget')))}%`, icon: 'wallet', tone: 'warning' },
      ],
      chart: comboChart({
        categories: sortBy(rows, 'date').map((r) => formatDate(r.date, 'dayMonth')),
        bars: [{ name: 'Registered', values: sortBy(rows, 'date').map((r) => r.registered) }],
        line: { name: 'Attended', values: sortBy(rows, 'date').map((r) => r.attended) },
        height: 260,
      }),
      chartTitle: 'Registration and attendance through the year',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Event, venue or organiser…' },
        { id: 'category', label: 'Category', options: [...new Set(rows.map((r) => r.category))] },
        { id: 'status', label: 'Status', options: ['Upcoming', 'Planning', 'Completed'] },
        { id: 'venue', label: 'Venue', options: [...new Set(rows.map((r) => r.venue))] },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(rows, allV, {
        q: (r, t) => (r.title + r.venue + r.organiser).toLowerCase().includes(t.toLowerCase()),
        category: (r, v2) => r.category === v2,
        status: (r, v2) => r.status === v2,
        venue: (r, v2) => r.venue === v2,
      })),
      columns: [
        { key: 'title', label: 'Event', sticky: true, width: 280, render: (r) => Identity(r.title, `${r.category} · ${r.organiser}`), value: (r) => r.title },
        { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date) },
        { key: 'startTime', label: 'Time', width: 130, render: (r) => `${r.startTime}–${r.endTime}`, value: (r) => r.startTime },
        { key: 'venue', label: 'Venue', width: 180, filter: true },
        { key: 'audience', label: 'Audience', width: 170, filter: true },
        { key: 'registered', label: 'Registered', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'attended', label: 'Attended', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'budget', label: 'Budget', width: 130, align: 'right', numeric: true, aggregate: 'sum', render: (r) => formatCurrency(r.budget), format: (v) => formatCurrency(v, { compact: true }) },
        { key: 'spent', label: 'Spent', width: 170, render: (r) => progressCell(Math.min(100, pct(r.spent, Math.max(1, r.budget))), r.spent > r.budget ? 'danger' : 'success'), value: (r) => r.spent, aggregate: 'sum' },
        { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
      ],
      rows,
      selectable: true, footerAggregates: true, paginate: false,
      searchKeys: ['title', 'category', 'venue', 'organiser'],
      bulkActions: [
        { label: 'Send invitation', icon: 'send', onClick: (sel) => notify({ title: `Invitations queued for ${sel.length} events`, tone: 'success' }) },
        { label: 'Export', icon: 'download', onClick: (sel) => notify({ title: `${sel.length} events exported`, tone: 'info' }) },
      ],
      rowActions: (r) => [
        { label: 'Open event', icon: 'eye', onClick: () => navigate(`events/all/${r.id}`) },
        { label: 'Registrations', icon: 'clipboard-list', onClick: () => navigate('events/registrations', { event: r.id }) },
        { label: 'Budget', icon: 'wallet', onClick: () => navigate('events/budget', { event: r.id }) },
        { separator: true },
        { label: 'Cancel event', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: `Cancel ${r.title}?`, text: `${formatNumber(r.registered)} people have registered and will be notified.`, tone: 'danger', confirmLabel: 'Cancel event' }).then((ok) => ok && notify({ title: 'Event cancelled', tone: 'danger' })) },
      ],
      onRowClick: (r) => navigate(`events/all/${r.id}`),
      emptyState: emptyFor('calendar-check', 'No events', 'Create an event to start taking registrations.',
        Button('Create event', { variant: 'primary', icon: 'plus', route: 'events/create' })),
    }));
  },
};

/* -------------------------------------------------- events / create ----- */

evtRoutes['events/create'] = {
  title: 'Create Event', subtitle: 'Plan an event end to end', section: 'events',
  render(mount, ctx) {
    injectStyles();
    warmStaff();
    mount.appendChild(formPage({
      title: 'Create an event',
      subtitle: 'Four steps: details, audience, budget and publication',
      route: 'events/create',
      mode: 'wizard',
      submitLabel: 'Create event',
      steps: [
        {
          id: 'basics', label: 'Event details', description: 'What, when and where',
          sections: [{
            title: 'Event details', cols: 2,
            fields: [
              { id: 'title', label: 'Event title', required: true, span: 'full', placeholder: 'Annual Day — Utsav 2026' },
              { id: 'category', label: 'Category', type: 'select', required: true, options: Object.keys(EVENT_TONE) },
              { id: 'organiser', label: 'Organising department', type: 'select', required: true, options: db.departments.map((d) => d.name) },
              { id: 'date', label: 'Date', type: 'date', required: true, value: TODAY },
              { id: 'endDate', label: 'End date (multi-day events)', type: 'date' },
              { id: 'start', label: 'Start time', type: 'time', value: '09:00', required: true },
              { id: 'end', label: 'End time', type: 'time', value: '13:00', required: true },
              { id: 'venue', label: 'Venue', type: 'combobox', required: true, options: [...new Set(db.events.map((e) => e.venue))] },
              { id: 'campus', label: 'Campus', type: 'select', required: true, options: db.campuses.map((c) => ({ value: c.id, label: c.name })) },
              { id: 'description', label: 'Description', type: 'textarea', span: 'full', required: true },
            ],
          }],
        },
        {
          id: 'audience', label: 'Audience & registration', description: 'Who attends and how they sign up',
          sections: [{
            title: 'Audience', cols: 2,
            fields: [
              { id: 'audience', label: 'Audience', type: 'select', required: true, options: ['All Students', 'Class VI-XII', 'Parents & Students', 'Staff Only', 'Invitees'] },
              { id: 'expected', label: 'Expected attendance', type: 'number', required: true, value: 600, validate: validators.number },
              { id: 'registration', label: 'Registration required', type: 'switch', switchLabel: 'Students must register to attend', value: true },
              { id: 'consent', label: 'Parent consent', type: 'switch', switchLabel: 'Require a signed consent form' },
              { id: 'fee', label: 'Participation fee (₹)', type: 'number', value: 0, hint: 'Leave 0 for free events' },
              { id: 'closes', label: 'Registration closes on', type: 'date' },
              { id: 'chiefGuest', label: 'Chief guest', placeholder: 'Dr. Ananya Rao' },
              { id: 'volunteers', label: 'Student volunteers needed', type: 'number', value: 24 },
            ],
          }],
        },
        {
          id: 'budget', label: 'Budget', description: 'Heads, vendors and approvals',
          sections: [{
            title: 'Budget', cols: 2,
            fields: [
              { id: 'budget', label: 'Total budget (₹)', type: 'number', required: true, value: 250000, validate: validators.number },
              { id: 'account', label: 'Charge to', type: 'select', options: db.budgets.map((b) => b.head) },
              { id: 'heads', label: 'Budget heads', type: 'multiselect', span: 'full', options: ['Venue & staging', 'Décor and props', 'Sound & lighting', 'Refreshments', 'Prizes & trophies', 'Printing & publicity', 'Transport', 'Guest hospitality', 'Photography', 'Contingency'], value: ['Venue & staging', 'Sound & lighting', 'Refreshments'] },
              { id: 'vendors', label: 'Preferred vendors', type: 'multiselect', span: 'full', options: db.vendors.map((v) => v.name) },
              { id: 'approver', label: 'Approver', type: 'combobox', options: db.staff.slice(0, 60).map((s) => ({ value: s.id, label: `${s.name} · ${s.designation}` })) },
              { id: 'quotes', label: 'Vendor quotes', type: 'file', span: 'full' },
            ],
          }],
        },
        {
          id: 'publish', label: 'Publish', description: 'Notify the school community',
          sections: [{
            title: 'Publication', cols: 2,
            fields: [
              { id: 'channels', label: 'Announce on', type: 'multiselect', span: 'full', options: ['Notice board', 'Parent app push', 'SMS', 'Email', 'WhatsApp'], value: ['Notice board', 'Parent app push'] },
              { id: 'poster', label: 'Event poster', type: 'file', span: 'full' },
              { id: 'calendar', label: 'Calendar', type: 'switch', switchLabel: 'Add to the school academic calendar', value: true },
              { id: 'gallery', label: 'Gallery', type: 'switch', switchLabel: 'Create a photo gallery for this event', value: true },
              { id: 'note', label: 'Note for parents', type: 'textarea', span: 'full' },
            ],
          }],
        },
      ],
      sidebar: [
        Callout({ tone: 'info', icon: 'lightbulb', title: 'Plan backwards from the date' },
          'Registrations should close at least three days before the event so the front office can print badges and finalise catering numbers.'),
        SectionCard({ title: 'Venue availability', icon: 'door' },
          Timeline(sortBy(db.events.filter((e) => e.date >= TODAY), 'date').slice(0, 5).map((e) => ({
            title: e.venue, meta: formatDate(e.date), text: e.title, icon: 'calendar', tone: 'warning',
          })))),
        SectionCard({ title: 'Budget guidance', icon: 'wallet' },
          DescriptionList([
            ['Cultural event median', formatCurrency(480000, { compact: true })],
            ['Sports meet median', formatCurrency(760000, { compact: true })],
            ['Academic event median', formatCurrency(180000, { compact: true })],
            ['Approval threshold', formatCurrency(500000, { compact: true })],
          ])),
      ],
      onSubmit: (v) => {
        notify({ title: 'Event created', text: v.title || 'New event', tone: 'success' });
        navigate('events/all');
      },
      onCancel: () => navigate('events/all'),
    }));
  },
};

/* -------------------------------------------- events / registrations --- */

evtRoutes['events/registrations'] = {
  title: 'Registrations', subtitle: 'Who has signed up for each event', section: 'events',
  render(mount, ctx) {
    injectStyles();
    const events = eventsFor(ctx);
    if (!events.length) {
      return mount.appendChild(page({
        title: 'Registrations', route: 'events/registrations',
        children: Card({ pad: true }, emptyFor('clipboard-list', 'No events', 'Create an event to open registrations.', Button('Create event', { variant: 'primary', route: 'events/create' }))),
      }));
    }
    const ev = (ctx.query && ctx.query.event ? byId(events, ctx.query.event) : null) || sortBy(events.filter((e) => e.date >= TODAY), 'date')[0] || events[0];
    const rows = eventRegistrations(ev, ctx);

    mount.appendChild(listPage({
      title: `Registrations — ${ev.title}`,
      subtitle: `${formatDate(ev.date)} · ${ev.venue} · ${formatNumber(rows.length)} registrations of ${formatNumber(ev.expectedAttendance)} expected`,
      route: 'events/registrations',
      actions: [
        moreMenu([{ label: 'Print badges', icon: 'print', onClick: mockAction('Print badges') }]),
        Button('Attendance', { variant: 'secondary', icon: 'clipboard-check', onClick: () => navigate('events/attendance', { event: ev.id }) }),
        Button('Register a student', {
          variant: 'primary', icon: 'user-plus',
          onClick: () => formPage({
            title: 'Register a student', mode: 'modal', size: 'md', submitLabel: 'Register',
            sections: [{
              title: ev.title, cols: 1,
              fields: [
                { id: 'student', label: 'Student', type: 'combobox', required: true, options: scoped(db.students, ctx).slice(0, 200).map((s) => ({ value: s.id, label: `${s.name} · ${s.className}-${s.section}` })) },
                { id: 'role', label: 'Role', type: 'radio', inline: true, options: ['Attendee', 'Performer', 'Volunteer'], value: 'Attendee' },
                { id: 'consent', label: 'Parent consent', type: 'switch', switchLabel: 'Consent form received', value: true },
                { id: 'notes', label: 'Notes', type: 'textarea' },
              ],
            }],
            onSubmit: () => notify({ title: 'Student registered', text: ev.title, tone: 'success' }),
          }),
        }),
      ],
      kpis: [
        { label: 'Registrations', value: formatNumber(rows.length), icon: 'clipboard-list', tone: 'brand' },
        { label: 'Performers', value: formatNumber(rows.filter((r) => r.role === 'Performer').length), icon: 'music', tone: 'info' },
        { label: 'Volunteers', value: formatNumber(rows.filter((r) => r.role === 'Volunteer').length), icon: 'hand', tone: 'success' },
        { label: 'Consent pending', value: formatNumber(rows.filter((r) => !r.consent).length), icon: 'alert-circle', tone: 'danger' },
      ],
      chart: chartOrEmpty(countBy(rows, 'className').slice(0, 12).map((c) => c.key), () => barChart({
        categories: countBy(rows, 'className').slice(0, 12).map((c) => c.key),
        series: [{ name: 'Registrations', values: countBy(rows, 'className').slice(0, 12).map((c) => c.value) }],
        height: 220, showValues: true,
      }), 'Registrations by class appear once students sign up.'),
      chartTitle: 'Registrations by class',
      filters: [
        { id: 'event', label: 'Event', width: '300px', value: ev.id, options: events.map((e) => ({ value: e.id, label: `${e.title} · ${formatDate(e.date, 'dayMonth')}` })) },
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Student name or admission no…' },
        { id: 'className', label: 'Class', options: [...new Set(rows.map((r) => r.className))] },
        { id: 'house', label: 'House', options: db.houses.map((x) => x.name) },
        { id: 'role', label: 'Role', options: ['Attendee', 'Performer', 'Volunteer'] },
        { id: 'consent', label: 'Consent', options: [{ value: 'yes', label: 'Received' }, { value: 'no', label: 'Pending' }] },
      ],
      onFilter: (id, v, allV, table) => {
        if (id === 'event') { const f = byId(events, v); if (f) return navigate('events/registrations', { event: f.id }); }
        return table.refresh(applyFilters(rows, allV, {
        q: (r, t) => (r.name + r.admissionNo).toLowerCase().includes(t.toLowerCase()),
        className: (r, v2) => r.className === v2,
        house: (r, v2) => r.house === v2,
        role: (r, v2) => r.role === v2,
        consent: (r, v2) => (v2 === 'yes' ? r.consent : !r.consent),
        }));
      },
      columns: [
        { key: 'name', label: 'Student', sticky: true, width: 230, render: (r) => Identity(r.name, `${r.admissionNo} · ${r.className}-${r.section}`), value: (r) => r.name },
        { key: 'house', label: 'House', width: 110, filter: true },
        { key: 'parent', label: 'Parent', width: 190, render: (r) => Identity(r.parent, r.phone), value: (r) => r.parent },
        { key: 'role', label: 'Role', width: 130, filter: true, render: (r) => Badge(r.role, { tone: r.role === 'Performer' ? 'brand' : r.role === 'Volunteer' ? 'info' : 'neutral' }) },
        { key: 'registeredOn', label: 'Registered', width: 130, render: (r) => formatDate(r.registeredOn) },
        { key: 'consent', label: 'Consent', width: 120, render: (r) => Badge(r.consent ? 'Received' : 'Pending'), value: (r) => (r.consent ? 1 : 0) },
        { key: 'fee', label: 'Fee', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => (r.fee ? formatCurrency(r.fee) : '—'), format: (v) => formatCurrency(v, { compact: true }) },
        { key: 'paid', label: 'Payment', width: 120, render: (r) => (r.fee ? Badge(r.paid ? 'Paid' : 'Pending') : h('span', { className: 't-muted' }, 'Free')), value: (r) => (r.paid ? 1 : 0) },
        { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
      ],
      rows,
      selectable: true, footerAggregates: true, pageSize: 50,
      searchKeys: ['name', 'admissionNo', 'className', 'parent'],
      bulkActions: [
        { label: 'Chase consent', icon: 'bell', onClick: (sel) => notify({ title: `Consent reminder sent to ${sel.length} families`, tone: 'success' }) },
        { label: 'Print badges', icon: 'print', onClick: (sel) => notify({ title: `${sel.length} badges queued`, tone: 'info' }) },
        { label: 'Cancel registration', icon: 'x-circle', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Cancel ${sel.length} registrations?`, tone: 'danger', confirmLabel: 'Cancel' }).then((ok) => ok && notify({ title: 'Registrations cancelled', tone: 'danger' })) },
      ],
      rowActions: (r) => [
        { label: 'Open student 360', icon: 'user', onClick: () => navigate(`students/profile/${r.studentId}`) },
        { label: 'Message parent', icon: 'send', route: 'communication/compose' },
        { label: 'Mark consent received', icon: 'check', onClick: () => notify({ title: 'Consent recorded', text: r.name, tone: 'success' }) },
      ],
      onRowClick: (r) => navigate(`students/profile/${r.studentId}`),
      emptyState: emptyFor('clipboard-list', 'No registrations yet', 'Open registrations and share the link with parents.'),
    }));
  },
};

/* ---------------------------------------------- events / attendance ----- */

evtRoutes['events/attendance'] = {
  title: 'Event Attendance', subtitle: 'Mark and analyse turnout for each event', section: 'events',
  render(mount, ctx) {
    injectStyles();
    const events = eventsFor(ctx);
    if (!events.length) {
      return mount.appendChild(page({
        title: 'Event attendance', route: 'events/attendance',
        children: Card({ pad: true }, emptyFor('clipboard-check', 'No events', 'Create an event first.', Button('Create event', { variant: 'primary', route: 'events/create' }))),
      }));
    }
    const ev = (ctx.query && ctx.query.event ? byId(events, ctx.query.event) : null) || sortBy(events.filter((e) => e.status === 'Completed'), 'date', 'desc')[0] || events[0];
    const rows = eventRegistrations(ev, ctx);
    const present = rows.filter((r) => r.attended);

    mount.appendChild(listPage({
      title: `Attendance — ${ev.title}`,
      subtitle: `${formatDate(ev.date)} · ${formatNumber(present.length)} of ${formatNumber(rows.length)} registered attended (${pct(present.length, Math.max(1, rows.length))}%)`,
      route: 'events/attendance',
      actions: [
        moreMenu([{ label: 'Export attendance sheet', icon: 'download', onClick: mockAction('Export attendance') }]),
        Button('Registrations', { variant: 'secondary', icon: 'clipboard-list', onClick: () => navigate('events/registrations', { event: ev.id }) }),
        Button('Mark all present', {
          variant: 'primary', icon: 'user-check',
          onClick: () => ConfirmDialog({ title: 'Mark everyone present?', text: `${formatNumber(rows.length)} registered students will be marked present for ${ev.title}.`, confirmLabel: 'Mark all present', tone: 'brand', icon: 'user-check' })
            .then((ok) => ok && notify({ title: 'All marked present', tone: 'success' })),
        }),
      ],
      kpis: [
        { label: 'Registered', value: formatNumber(rows.length), icon: 'clipboard-list', tone: 'brand' },
        { label: 'Present', value: formatNumber(present.length), icon: 'user-check', tone: 'success' },
        { label: 'Absent', value: formatNumber(rows.length - present.length), icon: 'user-x', tone: 'danger' },
        { label: 'Turnout', value: `${pct(present.length, Math.max(1, rows.length))}%`, icon: 'percent', tone: 'info' },
      ],
      chart: barChart({
        categories: db.houses.map((x) => x.name),
        series: [
          { name: 'Present', values: db.houses.map((x) => rows.filter((r) => r.house === x.name && r.attended).length) },
          { name: 'Absent', values: db.houses.map((x) => rows.filter((r) => r.house === x.name && !r.attended).length) },
        ],
        stacked: true, height: 220,
      }),
      chartTitle: 'Turnout by house',
      filters: [
        { id: 'event', label: 'Event', width: '300px', value: ev.id, options: events.map((e) => ({ value: e.id, label: `${e.title} · ${formatDate(e.date, 'dayMonth')}` })) },
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Student name…' },
        { id: 'className', label: 'Class', options: [...new Set(rows.map((r) => r.className))] },
        { id: 'house', label: 'House', options: db.houses.map((x) => x.name) },
        { id: 'status', label: 'Status', options: ['Attended', 'Absent', 'Registered'] },
      ],
      onFilter: (id, v, allV, table) => {
        if (id === 'event') { const f = byId(events, v); if (f) return navigate('events/attendance', { event: f.id }); }
        return table.refresh(applyFilters(rows, allV, {
          q: (r, t) => r.name.toLowerCase().includes(t.toLowerCase()),
          className: (r, v2) => r.className === v2,
          house: (r, v2) => r.house === v2,
          status: (r, v2) => r.status === v2,
        }));
      },
      columns: [
        { key: 'name', label: 'Student', sticky: true, width: 240, render: (r) => Identity(r.name, `${r.admissionNo} · ${r.className}-${r.section}`), value: (r) => r.name },
        { key: 'house', label: 'House', width: 110, filter: true },
        { key: 'role', label: 'Role', width: 130, filter: true },
        {
          key: 'attended', label: 'Present', width: 110, sortable: false,
          render: (r) => Checkbox('', {
            checked: r.attended,
            onChange: (v) => notify({ title: v ? 'Marked present' : 'Marked absent', text: r.name, tone: v ? 'success' : 'warning', duration: 1500 }),
          }),
        },
        { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        { key: 'parent', label: 'Parent', width: 190, render: (r) => Identity(r.parent, r.phone), value: (r) => r.parent },
      ],
      rows,
      selectable: true, pageSize: 50,
      searchKeys: ['name', 'className', 'house'],
      bulkActions: [
        { label: 'Mark present', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} marked present`, tone: 'success' }) },
        { label: 'Mark absent', icon: 'x', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} marked absent`, tone: 'warning' }) },
        { label: 'Notify parents of absence', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} families notified`, tone: 'info' }) },
      ],
      rowActions: (r) => [
        { label: 'Open student 360', icon: 'user', onClick: () => navigate(`students/profile/${r.studentId}`) },
        { label: 'Message parent', icon: 'send', route: 'communication/compose' },
      ],
      emptyState: emptyFor('clipboard-check', 'Nobody registered', 'Attendance can only be marked for registered students.'),
    }));
  },
};

/* -------------------------------------------------- events / budget ----- */

evtRoutes['events/budget'] = {
  title: 'Budget & Expenses', subtitle: 'Event budgets, spend and variance', section: 'events',
  render(mount, ctx) {
    injectStyles();
    const events = eventsFor(ctx);
    if (!events.length) {
      return mount.appendChild(page({
        title: 'Event budget', route: 'events/budget',
        children: Card({ pad: true }, emptyFor('wallet', 'No events', 'Create an event to plan its budget.', Button('Create event', { variant: 'primary', route: 'events/create' }))),
      }));
    }
    const ev = (ctx.query && ctx.query.event ? byId(events, ctx.query.event) : null) || sortBy(events, 'budget', 'desc')[0];
    const lines = eventBudgetLines(ev);
    const allocated = sum(lines, 'allocated');
    const spent = sum(lines, 'spent');

    mount.appendChild(reportPage({
      title: `Budget — ${ev.title}`,
      subtitle: `${formatDate(ev.date)} · ${formatCurrency(allocated)} allocated · ${formatCurrency(spent)} spent · ${pct(spent, Math.max(1, allocated))}% utilised`,
      route: 'events/budget',
      filters: [
        { id: 'event', label: 'Event', width: '340px', value: ev.id, options: events.map((e) => ({ value: e.id, label: `${e.title} · ${formatDate(e.date, 'dayMonth')}` })) },
        { id: 'status', label: 'Line status', options: ['Pending', 'In Progress', 'Overspent'] },
      ],
      onFilter: (id, v, allV, table) => {
        if (id === 'event') { const f = byId(events, v); if (f) return navigate('events/budget', { event: f.id }); }
        if (table) table.refresh(applyFilters(lines, allV, { status: (r, v2) => r.status === v2 }));
      },
      summary: [
        { label: 'Allocated', value: formatCurrency(allocated, { compact: true }), icon: 'wallet', tone: 'brand' },
        { label: 'Spent', value: formatCurrency(spent, { compact: true }), icon: 'receipt', tone: 'info' },
        { label: 'Remaining', value: formatCurrency(allocated - spent, { compact: true }), icon: 'piggy-bank', tone: allocated - spent >= 0 ? 'success' : 'danger' },
        { label: 'Overspent lines', value: formatNumber(lines.filter((l) => l.status === 'Overspent').length), icon: 'alert-triangle', tone: 'danger' },
      ],
      chart: [
        waterfallChart({
          items: [{ label: 'Allocated', value: allocated, type: 'start' }]
            .concat(lines.slice(0, 6).map((l) => ({ label: l.head, value: -l.spent })))
            .concat([{ label: 'Remaining', value: allocated - sum(lines.slice(0, 6), 'spent'), type: 'total' }]),
          valueFormat: 'currencyCompact', height: 300,
        }),
        barChart({
          categories: events.map((e) => e.title.split('—')[0].trim()),
          series: [
            { name: 'Budget', values: events.map((e) => e.budget) },
            { name: 'Spent', values: events.map((e) => e.spent) },
          ],
          horizontal: true, valueFormat: 'currencyCompact', height: 340,
        }),
      ],
      chartTitle: 'Where the budget goes',
      notes: Callout({ tone: allocated - spent < 0 ? 'danger' : 'info', icon: 'info', title: 'Approval rule' },
        'Any single head exceeding its allocation by more than 10% needs written approval from the Finance Controller before the vendor invoice is cleared.'),
      columns: [
        { key: 'head', label: 'Budget head', sticky: true, width: 230 },
        { key: 'vendor', label: 'Vendor', width: 200 },
        { key: 'allocated', label: 'Allocated', width: 140, align: 'right', numeric: true, aggregate: 'sum', render: (r) => formatCurrency(r.allocated), format: (v) => formatCurrency(v, { compact: true }) },
        { key: 'spent', label: 'Spent', width: 140, align: 'right', numeric: true, aggregate: 'sum', render: (r) => formatCurrency(r.spent), format: (v) => formatCurrency(v, { compact: true }) },
        { key: 'variance', label: 'Variance', width: 140, align: 'right', numeric: true, aggregate: 'sum', render: (r) => h('span', { className: r.variance < 0 ? 't-danger t-num' : 't-success t-num' }, formatCurrency(r.variance)), format: (v) => formatCurrency(v, { compact: true }) },
        { key: 'utilisation', label: 'Utilisation', width: 180, render: (r) => progressCell(Math.min(100, r.utilisation), r.utilisation > 100 ? 'danger' : r.utilisation > 80 ? 'warning' : 'success'), value: (r) => r.utilisation },
        { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status, { tone: r.status === 'Overspent' ? 'danger' : undefined }) },
      ],
      rows: lines,
      tableTitle: 'Budget lines',
      footerAggregates: true,
    }));
  },
};

/* ------------------------------------------------- events / gallery ----- */

evtRoutes['events/gallery'] = {
  title: 'Gallery', subtitle: 'Photographs from school events', section: 'events',
  render(mount, ctx) {
    injectStyles();
    const events = eventsFor(ctx).filter((e) => e.photos > 0);
    if (!events.length) {
      return mount.appendChild(page({
        title: 'Event gallery', route: 'events/gallery',
        children: Card({ pad: true }, emptyFor('camera', 'No photographs yet', 'Photos appear here once an event is over and the media team uploads them.',
          Button('All events', { variant: 'primary', icon: 'calendar-check', route: 'events/all' }))),
      }));
    }
    let selected = (ctx.query && ctx.query.event ? byId(events, ctx.query.event) : null) || events[0];
    const gridHost = h('div', { className: 'eng-grid' });

    const paint = () => {
      gridHost.innerHTML = '';
      const count = Math.min(selected.photos, 24);
      for (let i = 0; i < count; i++) {
        gridHost.appendChild(h('button', {
          type: 'button', className: 'eng-photo', dataset: { hue: String((i % 6) + 1) },
          attrs: { 'aria-label': `Open photo ${i + 1} of ${selected.title}` },
          onClick: () => Drawer({
            title: `${selected.title} — photo ${i + 1}`, subtitle: `${formatDate(selected.date)} · ${selected.venue}`, size: 'lg',
            body: h('div', { className: 'stack-4' },
              h('div', { className: 'eng-photo', dataset: { hue: String((i % 6) + 1) }, style: { aspectRatio: '16/9' } }, Icon('camera', 48)),
              DescriptionList([
                ['Event', selected.title], ['Date', formatDate(selected.date)],
                ['Venue', selected.venue], ['Photographer', 'Media Club'],
                ['Tags', `${selected.category}, ${selected.audience}`],
              ], { cols: 2 })),
            actions: (close) => frag(
              Button('Close', { variant: 'ghost', onClick: close }),
              Button('Download', { variant: 'secondary', icon: 'download', onClick: mockAction('Download photo') }),
              Button('Share with parents', { variant: 'primary', icon: 'send', onClick: () => { close(); notify({ title: 'Photo shared to the parent app', tone: 'success' }); } })),
          }),
        },
          Icon('camera', 24),
          h('div', { className: 'eng-photo-cap t-truncate' }, `${selected.title} · ${i + 1}`)));
      }
    };
    paint();

    mount.appendChild(page({
      title: 'Event gallery',
      subtitle: `${formatNumber(sum(events, 'photos'))} photographs across ${formatNumber(events.length)} events`,
      route: 'events/gallery',
      actions: [
        moreMenu([{ label: 'Download album', icon: 'download', onClick: mockAction('Download album') }]),
        Button('All events', { variant: 'secondary', icon: 'calendar-check', route: 'events/all' }),
        !isLearner() && Button('Upload photos', {
          variant: 'primary', icon: 'upload',
          onClick: () => Drawer({
            title: 'Upload event photographs', size: 'lg',
            body: h('div', { className: 'stack-4' },
              FileUpload({ label: 'Drop photos here or click to browse', hint: 'JPG or PNG · up to 20 MB each · faces are auto-tagged for the parent app', multiple: true, onFiles: (f) => notify({ title: `${f.length} photo(s) queued`, tone: 'success' }) }),
              FormGrid({ cols: 2 },
                Field({ label: 'Event', required: true }, Select({ options: events.map((e) => ({ value: e.id, label: e.title })), value: selected.id })),
                Field({ label: 'Photographer' }, Input({ value: 'Media Club' })),
                Field({ label: 'Visible to', className: 'col-span-full' }, MultiSelect({ options: ['Parents', 'Students', 'Staff', 'Public website'], values: ['Parents', 'Staff'] }))),
              Callout({ tone: 'warning', icon: 'shield', title: 'Consent check' },
                'Photographs of students whose parents have opted out of media consent are excluded automatically before publication.')),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Publish album', { variant: 'primary', icon: 'send', onClick: () => { close(); notify({ title: 'Album published', tone: 'success' }); } })),
          }),
        }),
      ].filter(Boolean),
      children: [
        kpiRow([
          { label: 'Albums', value: formatNumber(events.length), icon: 'folder', tone: 'brand' },
          { label: 'Photographs', value: formatNumber(sum(events, 'photos')), icon: 'camera', tone: 'info' },
          { label: 'Largest album', value: sortBy(events, 'photos', 'desc')[0].title.split('—')[0].trim(), icon: 'trophy', tone: 'success' },
          { label: 'Shared with parents', value: `${formatNumber(events.length)} albums`, icon: 'send', tone: 'warning' },
        ]),
        Card({ className: 'p-0' }, FilterBar({
          filters: [
            { id: 'event', label: 'Album', width: '340px', value: selected.id, options: events.map((e) => ({ value: e.id, label: `${e.title} · ${e.photos} photos` })) },
            { id: 'category', label: 'Category', options: [...new Set(events.map((e) => e.category))] },
          ],
          onChange: (id, v) => { if (id === 'event') { const f = byId(events, v); if (f) { selected = f; paint(); } } },
          actions: Button('Open event', { variant: 'ghost', size: 'sm', icon: 'external-link', onClick: () => navigate(`events/all/${selected.id}`) }),
        })),
        SectionCard({
          title: selected.title, icon: 'camera',
          subtitle: `${formatDate(selected.date)} · ${selected.venue} · ${formatNumber(selected.photos)} photographs`,
          actions: Button('Share album', { variant: 'secondary', size: 'sm', icon: 'send', onClick: () => notify({ title: 'Album shared with parents', text: selected.title, tone: 'success' }) }),
        }, gridHost),
        SectionCard({ title: 'All albums', flush: true },
          DataTable({
            columns: [
              { key: 'title', label: 'Event', sticky: true, width: 280, render: (r) => Identity(r.title, `${r.category} · ${r.venue}`), value: (r) => r.title },
              { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date) },
              { key: 'photos', label: 'Photos', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
              { key: 'attended', label: 'Attended', width: 120, align: 'right', numeric: true },
              { key: 'campusId', label: 'Campus', width: 170, render: (r) => campusName(r.campusId), value: (r) => campusName(r.campusId), filter: true },
            ],
            rows: events, paginate: false, footerAggregates: true, exportName: 'event-albums',
            onRowClick: (r) => { selected = r; paint(); notify({ title: 'Album loaded', text: r.title, tone: 'info', duration: 1600 }); },
            rowActions: (r) => [
              { label: 'Open album', icon: 'camera', onClick: () => { selected = r; paint(); } },
              { label: 'Open event', icon: 'calendar-check', onClick: () => navigate(`events/all/${r.id}`) },
            ],
          })),
      ],
    }));
  },
};

/* ------------------------------------------------ events / holidays ----- */

evtRoutes['events/holidays'] = {
  title: 'Holidays', subtitle: 'The official holiday list for 2026-27', section: 'events',
  render(mount, ctx) {
    injectStyles();
    const rows = db.holidays.map((hday) => ({
      ...hday,
      campus: hday.campusId === 'ALL' ? 'All campuses' : campusName(hday.campusId),
      endDate: formatDate(new Date(new Date(hday.date).getTime() + (hday.days - 1) * 86400000), 'iso'),
      upcoming: hday.date >= TODAY,
    }));
    const calEvents = rows.map((hday) => ({
      date: hday.date, title: `${hday.name}${hday.days > 1 ? ` (${hday.days}d)` : ''}`,
      tone: hday.type === 'National' ? 'brand' : hday.type === 'Vacation' ? 'info' : 'success',
      meta: `${hday.type} · ${hday.campus}`, badge: hday.type,
    }));

    const holidayForm = () => formPage({
      title: 'Add a holiday', mode: 'modal', size: 'md', submitLabel: 'Add holiday',
      sections: [{
        title: 'Holiday', cols: 2,
        fields: [
          { id: 'name', label: 'Holiday name', required: true, span: 'full' },
          { id: 'date', label: 'Start date', type: 'date', required: true, value: TODAY },
          { id: 'days', label: 'Number of days', type: 'number', value: 1, required: true, validate: validators.number },
          { id: 'type', label: 'Type', type: 'select', required: true, options: ['National', 'Gazetted', 'Restricted', 'Festival', 'Vacation', 'Local'] },
          { id: 'campus', label: 'Applies to', type: 'select', required: true, options: [{ value: 'ALL', label: 'All campuses' }].concat(db.campuses.map((c) => ({ value: c.id, label: c.name }))) },
          { id: 'notify', label: 'Announce', type: 'switch', switchLabel: 'Notify parents and staff', value: true },
          { id: 'note', label: 'Note', type: 'textarea', span: 'full' },
        ],
      }],
      onSubmit: (v) => notify({ title: 'Holiday added', text: v.name || '', tone: 'success' }),
    });

    mount.appendChild(page({
      title: 'Holidays',
      subtitle: `${formatNumber(rows.length)} holidays · ${formatNumber(sum(rows, 'days'))} non-working days in 2026-27`,
      route: 'events/holidays',
      actions: [
        moreMenu([{ label: 'Import gazetted list', icon: 'upload', onClick: mockAction('Import holidays') }]),
        Button('Event calendar', { variant: 'secondary', icon: 'calendar', route: 'events/calendar' }),
        !isLearner() && Button('Add holiday', { variant: 'primary', icon: 'plus', onClick: holidayForm }),
      ].filter(Boolean),
      children: [
        kpiRow([
          { label: 'Holidays', value: formatNumber(rows.length), icon: 'umbrella', tone: 'brand' },
          { label: 'Non-working days', value: formatNumber(sum(rows, 'days')), icon: 'calendar', tone: 'info' },
          { label: 'Upcoming', value: formatNumber(rows.filter((r) => r.upcoming).length), icon: 'clock', tone: 'success' },
          { label: 'Vacation blocks', value: formatNumber(rows.filter((r) => r.type === 'Vacation').length), icon: 'sun', tone: 'warning' },
        ]),
        h('div', { className: 'widget-grid' },
          h('div', { className: 'span-7' }, SectionCard({ title: 'Holiday list', flush: true },
            DataTable({
              columns: [
                { key: 'name', label: 'Holiday', sticky: true, width: 230, render: (r) => Identity(r.name, r.type), value: (r) => r.name },
                { key: 'date', label: 'From', width: 130, render: (r) => formatDate(r.date) },
                { key: 'endDate', label: 'To', width: 130, render: (r) => formatDate(r.endDate) },
                { key: 'days', label: 'Days', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'type', label: 'Type', width: 130, filter: true, render: (r) => Badge(r.type, { tone: r.type === 'National' ? 'brand' : r.type === 'Vacation' ? 'info' : 'success' }) },
                { key: 'campus', label: 'Applies to', width: 180, filter: true },
                { key: 'upcoming', label: 'Status', width: 120, render: (r) => Badge(r.upcoming ? 'Upcoming' : 'Completed'), value: (r) => (r.upcoming ? 1 : 0) },
              ],
              rows, paginate: false, footerAggregates: true, selectable: true, exportName: 'holidays',
              searchKeys: ['name', 'type', 'campus'],
              bulkActions: [
                { label: 'Announce', icon: 'megaphone', onClick: (sel) => notify({ title: `${sel.length} holidays announced`, tone: 'success' }) },
                { label: 'Remove', icon: 'trash', tone: 'danger', onClick: (sel) => ConfirmDialog({ title: `Remove ${sel.length} holidays?`, text: 'Attendance and timetable calculations will be recomputed.', tone: 'danger', confirmLabel: 'Remove' }).then((ok) => ok && notify({ title: 'Holidays removed', tone: 'danger' })) },
              ],
              rowActions: (r) => [
                { label: 'Edit', icon: 'edit', onClick: holidayForm },
                { label: 'Announce', icon: 'megaphone', onClick: () => notify({ title: 'Holiday announced', text: r.name, tone: 'success' }) },
                { separator: true },
                { label: 'Remove', icon: 'trash', tone: 'danger', onClick: mockAction('Remove holiday') },
              ],
              emptyState: emptyFor('umbrella', 'No holidays configured', 'Add the gazetted holiday list for the session.'),
            }))),
          h('div', { className: 'span-5' }, h('div', { className: 'stack-3' },
            SectionCard({ title: 'Calendar view', icon: 'calendar' },
              (function holidayCalendar() {
                const node = calendarPage({ month: '2026-10', events: calEvents, view: 'agenda' });
                return node.calendar;
              })()),
            SectionCard({ title: 'Days by type', className: 'chart-card' },
              donutChart({
                data: [...groupBy(rows, 'type')].map(([k, v]) => ({ key: k, value: sum(v, 'days') })),
                height: 240, centerLabel: 'Days', centerValue: formatNumber(sum(rows, 'days')),
              })),
            Callout({ tone: 'info', icon: 'info', title: 'CBSE working-days rule' },
              'CBSE requires a minimum of 220 instructional days. The current list leaves 224 working days after holidays and examination blocks.')))),
      ],
    }));
  },
};

/* --------------------------------------------------- events / trips ----- */

evtRoutes['events/trips'] = {
  title: 'Trips & Excursions', subtitle: 'Educational trips, consent and logistics', section: 'events',
  render(mount, ctx) {
    injectStyles();
    const trips = eventsFor(ctx).filter((e) => e.category === 'Trip');
    const pool = trips.length ? trips : eventsFor(ctx).slice(0, 3);
    const rows = pool.map((t) => {
      const regs = eventRegistrations(t, ctx);
      const rnd = rngFor('trip' + t.id);
      return {
        id: t.id, title: t.title, date: t.date, venue: t.venue,
        destination: t.venue === 'Off Campus' ? pickFrom(rnd, ['Jaipur, Rajasthan', 'Rishikesh, Uttarakhand', 'Agra, Uttar Pradesh', 'Nainital, Uttarakhand', 'Chandigarh, Punjab']) : t.venue,
        nights: intBetween(rnd, 0, 3),
        classes: t.audience,
        students: regs.length,
        staffEscorts: Math.max(2, Math.round(regs.length / 15)),
        consentReceived: regs.filter((r) => r.consent).length,
        feePerHead: intBetween(rnd, 1800, 8500),
        transport: pickFrom(rnd, ['School buses', 'Chartered coach', 'Train — sleeper', 'Train — AC 3-tier']),
        budget: t.budget, spent: t.spent,
        status: t.status,
        regs,
      };
    });

    const openTrip = (t) => Drawer({
      title: t.title, subtitle: `${t.destination} · ${formatDate(t.date)} · ${t.nights} night(s)`, size: 'xl',
      body: h('div', { className: 'stack-4' },
        kpiRow([
          { label: 'Students', value: formatNumber(t.students), icon: 'users', tone: 'brand' },
          { label: 'Staff escorts', value: formatNumber(t.staffEscorts), icon: 'shield', tone: 'info' },
          { label: 'Consent received', value: `${pct(t.consentReceived, Math.max(1, t.students))}%`, icon: 'check-circle', tone: 'success' },
          { label: 'Fee per head', value: formatCurrency(t.feePerHead), icon: 'wallet', tone: 'warning' },
        ]),
        SectionCard({ title: 'Itinerary', icon: 'map' },
          Timeline([
            { title: 'Departure from campus', meta: '06:00', text: `${t.transport} · attendance at the gate`, icon: 'bus', tone: 'brand' },
            { title: 'Arrival & check-in', meta: 'Midday', text: `${t.destination} · rooms allotted by house`, icon: 'map-pin', tone: 'info' },
            { title: 'Guided programme', meta: 'Day 1–' + Math.max(1, t.nights), text: 'Museum visit, heritage walk and workshop sessions.', icon: 'book-open', tone: 'success' },
            { title: 'Return to campus', meta: 'Evening', text: 'Parents notified 30 minutes before arrival.', icon: 'home', tone: 'neutral' },
          ])),
        SectionCard({ title: 'Safety & compliance', icon: 'shield-check' },
          h('div', { className: 'stack-2' },
            ['Signed parent consent for every student', 'First-aid kit and school nurse accompanying', 'Vehicle fitness and driver licence verified', 'Emergency contact list carried by every escort', 'Live location shared with the front office']
              .map((c) => Checkbox(c, { checked: true })))),
        SectionCard({ title: 'Participants', flush: true },
          DataTable({
            columns: [
              { key: 'name', label: 'Student', sticky: true, width: 220, render: (r) => Identity(r.name, `${r.className}-${r.section}`), value: (r) => r.name },
              { key: 'parent', label: 'Parent', width: 180 },
              { key: 'phone', label: 'Contact', width: 150 },
              { key: 'consent', label: 'Consent', width: 120, render: (r) => Badge(r.consent ? 'Received' : 'Pending'), value: (r) => (r.consent ? 1 : 0) },
              { key: 'paid', label: 'Fee', width: 110, render: (r) => Badge(r.paid ? 'Paid' : 'Pending'), value: (r) => (r.paid ? 1 : 0) },
            ],
            rows: t.regs, pageSize: 10, exportName: `trip-${t.id}`,
            onRowClick: (r) => navigate(`students/profile/${r.studentId}`),
          }))),
      actions: (close) => frag(
        Button('Close', { variant: 'ghost', onClick: close }),
        Button('Chase consent', { variant: 'secondary', icon: 'bell', onClick: () => notify({ title: `Consent reminder sent to ${t.students - t.consentReceived} families`, tone: 'success' }) }),
        Button('Print manifest', { variant: 'primary', icon: 'print', onClick: mockAction('Print trip manifest') })),
    });

    mount.appendChild(listPage({
      title: 'Trips & excursions',
      subtitle: `${formatNumber(rows.length)} trips planned · ${formatNumber(sum(rows, 'students'))} students travelling · ${formatNumber(sum(rows, 'staffEscorts'))} staff escorts`,
      route: 'events/trips',
      actions: [
        moreMenu([{ label: 'Download consent template', icon: 'download', onClick: mockAction('Download consent form') }]),
        Button('Transport', { variant: 'secondary', icon: 'bus', route: 'transport/vehicles' }),
        Button('Plan a trip', { variant: 'primary', icon: 'plus', route: 'events/create' }),
      ],
      kpis: [
        { label: 'Trips', value: formatNumber(rows.length), icon: 'navigation', tone: 'brand' },
        { label: 'Students travelling', value: formatNumber(sum(rows, 'students')), icon: 'users', tone: 'info' },
        { label: 'Consent received', value: `${pct(sum(rows, 'consentReceived'), Math.max(1, sum(rows, 'students')))}%`, icon: 'check-circle', tone: 'success' },
        { label: 'Trip budget', value: formatCurrency(sum(rows, 'budget'), { compact: true }), icon: 'wallet', tone: 'warning' },
      ],
      chart: barChart({
        categories: rows.map((r) => r.title.split('—')[0].trim()),
        series: [
          { name: 'Consent received', values: rows.map((r) => r.consentReceived) },
          { name: 'Consent pending', values: rows.map((r) => r.students - r.consentReceived) },
        ],
        stacked: true, height: 240,
      }),
      chartTitle: 'Consent status per trip',
      filters: [
        { id: 'q', type: 'search', label: 'Search', placeholder: 'Trip or destination…' },
        { id: 'status', label: 'Status', options: ['Upcoming', 'Planning', 'Completed'] },
        { id: 'transport', label: 'Transport', options: [...new Set(rows.map((r) => r.transport))] },
      ],
      onFilter: (id, v, allV, table) => table.refresh(applyFilters(rows, allV, {
        q: (r, t) => (r.title + r.destination).toLowerCase().includes(t.toLowerCase()),
        status: (r, v2) => r.status === v2,
        transport: (r, v2) => r.transport === v2,
      })),
      columns: [
        { key: 'title', label: 'Trip', sticky: true, width: 260, render: (r) => Identity(r.title, r.destination), value: (r) => r.title },
        { key: 'date', label: 'Departure', width: 130, render: (r) => formatDate(r.date) },
        { key: 'nights', label: 'Nights', width: 90, align: 'right', numeric: true },
        { key: 'classes', label: 'Classes', width: 170, filter: true },
        { key: 'students', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'staffEscorts', label: 'Escorts', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
        { key: 'consentReceived', label: 'Consent', width: 180, render: (r) => progressCell(pct(r.consentReceived, Math.max(1, r.students)), pct(r.consentReceived, Math.max(1, r.students)) >= 95 ? 'success' : 'warning'), value: (r) => r.consentReceived },
        { key: 'transport', label: 'Transport', width: 170, filter: true },
        { key: 'feePerHead', label: 'Fee / head', width: 130, align: 'right', numeric: true, render: (r) => formatCurrency(r.feePerHead), value: (r) => r.feePerHead },
        { key: 'budget', label: 'Budget', width: 130, align: 'right', numeric: true, aggregate: 'sum', render: (r) => formatCurrency(r.budget), format: (v) => formatCurrency(v, { compact: true }) },
        { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
      ],
      rows,
      selectable: true, footerAggregates: true, paginate: false,
      searchKeys: ['title', 'destination', 'transport'],
      bulkActions: [
        { label: 'Chase consent', icon: 'bell', onClick: (sel) => notify({ title: `Reminder sent for ${sel.length} trips`, tone: 'success' }) },
        { label: 'Print manifests', icon: 'print', onClick: (sel) => notify({ title: `${sel.length} manifests queued`, tone: 'info' }) },
      ],
      rowActions: (r) => [
        { label: 'Open trip', icon: 'eye', onClick: () => openTrip(r) },
        { label: 'Open event', icon: 'calendar-check', onClick: () => navigate(`events/all/${r.id}`) },
        { label: 'Budget', icon: 'wallet', onClick: () => navigate('events/budget', { event: r.id }) },
        { separator: true },
        { label: 'Cancel trip', icon: 'x-circle', tone: 'danger', onClick: () => ConfirmDialog({ title: `Cancel ${r.title}?`, text: `${formatNumber(r.students)} families will be notified and refunds initiated.`, tone: 'danger', confirmLabel: 'Cancel trip' }).then((ok) => ok && notify({ title: 'Trip cancelled', tone: 'danger' })) },
      ],
      onRowClick: openTrip,
      emptyState: emptyFor('navigation', 'No trips planned', 'Plan an educational trip and collect parent consent online.',
        Button('Plan a trip', { variant: 'primary', icon: 'plus', route: 'events/create' })),
    }));
  },
};

/* ==========================================================================
   7. Export — every route in lms, communication, ptm, activities and events
   ========================================================================== */

export const routes = {
  ...lmsRoutes,
  ...commRoutes,
  ...ptmRoutes,
  ...actRoutes,
  ...evtRoutes,
};

export default routes;

