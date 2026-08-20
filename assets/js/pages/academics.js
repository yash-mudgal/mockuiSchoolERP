/* ==========================================================================
   pages/academics.js — Academics · Timetable · Teachers
   Owns 33 routes across three nav sections. Flagship screen: the drag-and-drop
   Timetable Builder with live conflict detection and per-teacher workload.
   Everything is derived deterministically from data/db.js so the same class,
   subject or teacher reads identically on every screen.
   ========================================================================== */

import {
  h, frag, Icon, Card, SectionCard, StatCard, Badge, Button, IconButton, Identity,
  DataTable, Modal, Drawer, ConfirmDialog, notify, EmptyState, ErrorState, Timeline,
  DescriptionList, ProgressBar, StackedProgressBar, RadialProgress, Avatar, AvatarStack, Tabs,
  SegmentedControl, FilterBar, MenuButton, Callout, FileList, RankList, MetricRow, Rating,
  Accordion, Collapse, Stepper, ActivityFeed, CommentThread, Divider, Pill, Tag, Calendar, KanbanBoard,
  Field, Input, Textarea, Select, Combobox, MultiSelect, Checkbox, RadioGroup, Switch,
  DatePicker, TimePicker, FormGrid, FormSection, FormActions, Toolbar, ToolbarSep,
  Skeleton, SkeletonText, SkeletonTable, validators, mockAction, printNode, copyToClipboard, openMenu,
  download, toCsv, formatCurrency, formatNumber, formatPercent, formatDate, formatTime,
  relativeTime, toneForStatus, initials, DEMO_NOW,
} from '../core/ui.js';

import {
  page, listPage, detailPage, dashboardPage, formPage, reportPage, settingsPage,
  approvalQueuePage, kanbanPage, calendarPage, profileHeader, kpiRow, greetingFor,
  missingRecord, pageActions,
} from '../core/page-kit.js';

import {
  lineChart, areaChart, barChart, comboChart, donutChart, pieChart, funnelChart, heatmap,
  gaugeChart, scatterPlot, bulletChart, waterfallChart, treemap, radialBarChart, progressRing,
  sparkline, stackedProgressBar, ScaleLegend, PALETTE, SEQUENTIAL, ORDINAL, STATUS, seriesColor,
  sequentialColor, compactNumber,
} from '../core/charts.js';

import {
  db, analytics, byId, where, search, sortBy, groupBy, sum, avg, countBy, sumBy,
  subjectsForLevel, gradeFor,
} from '../data/db.js';

import { icon } from '../core/icons.js';
import { navigate } from '../core/router.js';
import * as store from '../core/state.js';
import { routeMeta, breadcrumbFor } from '../core/nav.js';

/* ==========================================================================
   0 · scoped stylesheet (tokens only — no literal colours / sizes)
   ========================================================================== */

const STYLE_ID = 'acad-module-styles';
const CSS = `
.tt-wrap { overflow-x: auto; }
.tt-grid { border-collapse: separate; border-spacing: 0; width: 100%; min-width: 880px;
  font-size: var(--fs-sm); table-layout: fixed; }
.tt-grid th, .tt-grid td { border-bottom: 1px solid var(--border-subtle);
  border-right: 1px solid var(--border-subtle); padding: 0; vertical-align: top; }
.tt-grid thead th { background: var(--surface-sunken); color: var(--text-secondary);
  font-size: var(--fs-xs); font-weight: var(--fw-semibold); text-transform: uppercase;
  letter-spacing: 0.06em; padding: var(--sp-2) var(--sp-3); text-align: left;
  position: sticky; top: 0; z-index: 2; }
.tt-grid th.tt-corner { width: 118px; position: sticky; left: 0; z-index: 3; }
.tt-grid td.tt-rowhead, .tt-grid th.tt-rowhead { width: 118px; background: var(--surface-sunken);
  position: sticky; left: 0; z-index: 1; padding: var(--sp-2) var(--sp-3); }
.tt-rowhead-no { font-weight: var(--fw-semibold); color: var(--text); font-size: var(--fs-sm); }
.tt-rowhead-time { color: var(--text-muted); font-size: var(--fs-2xs); font-variant-numeric: tabular-nums; }
.tt-cell { min-height: 62px; padding: var(--sp-2); display: flex; flex-direction: column;
  gap: 2px; background: var(--surface); transition: background var(--dur-fast) var(--ease); }
.tt-cell[data-drop="on"] { background: var(--surface-selected); outline: 2px dashed var(--border-brand); outline-offset: -3px; }
.tt-cell.is-free { background: repeating-linear-gradient(135deg, var(--surface) 0 8px, var(--surface-sunken) 8px 16px); }
.tt-cell.is-break { background: var(--surface-sunken); align-items: center; justify-content: center; }
.tt-cell.is-editable { cursor: pointer; }
.tt-cell.is-editable:hover { background: var(--surface-hover); }
.tt-cell.has-conflict { box-shadow: inset 0 0 0 2px var(--danger-500); }
.tt-cell.is-sub { box-shadow: inset 0 0 0 2px var(--warning-500); }
.tt-sub-name { font-weight: var(--fw-semibold); color: var(--text); line-height: var(--lh-tight); }
.tt-teacher { color: var(--text-secondary); font-size: var(--fs-xs); }
.tt-room { color: var(--text-faint); font-size: var(--fs-2xs); font-variant-numeric: tabular-nums; }
.tt-accent { width: 100%; height: 3px; border-radius: var(--r-full); margin-bottom: 2px; }
.tt-break-label { font-size: var(--fs-xs); color: var(--text-muted); text-transform: uppercase;
  letter-spacing: 0.08em; font-weight: var(--fw-semibold); }

.tt-palette { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.tt-chip { display: inline-flex; align-items: center; gap: var(--sp-2); padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface);
  cursor: grab; font-size: var(--fs-sm); user-select: none; box-shadow: var(--shadow-xs); }
.tt-chip:hover { border-color: var(--border-brand); background: var(--surface-hover); }
.tt-chip[data-active="true"] { border-color: var(--border-brand); background: var(--surface-selected);
  box-shadow: 0 0 0 2px var(--ring-color); }
.tt-chip:active { cursor: grabbing; }
.tt-chip-dot { width: 10px; height: 10px; border-radius: var(--r-full); flex: none; }
.tt-chip-meta { color: var(--text-muted); font-size: var(--fs-2xs); }

.tt-legend { display: flex; flex-wrap: wrap; gap: var(--sp-4); font-size: var(--fs-xs); color: var(--text-secondary); }
.tt-legend-item { display: inline-flex; align-items: center; gap: var(--sp-2); }
.tt-legend-sw { width: 14px; height: 14px; border-radius: var(--r-xs); border: 1px solid var(--border); }

.load-meter { display: grid; grid-template-columns: 1fr auto; gap: var(--sp-2) var(--sp-3);
  align-items: center; padding: var(--sp-2) 0; border-bottom: 1px solid var(--border-subtle); }
.load-meter:last-child { border-bottom: 0; }
.load-meter-bar { grid-column: 1 / -1; }

.matrix-wrap { overflow-x: auto; }
.matrix { border-collapse: separate; border-spacing: 0; font-size: var(--fs-xs); width: 100%; min-width: 760px; }
.matrix th, .matrix td { border-bottom: 1px solid var(--border-subtle); border-right: 1px solid var(--border-subtle);
  padding: var(--sp-2); text-align: center; }
.matrix thead th { background: var(--surface-sunken); position: sticky; top: 0; z-index: 2;
  font-weight: var(--fw-semibold); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
.matrix td.matrix-head, .matrix th.matrix-head { text-align: left; background: var(--surface-sunken);
  position: sticky; left: 0; z-index: 1; white-space: nowrap; font-weight: var(--fw-semibold); color: var(--text); }
.matrix-cell { display: inline-flex; flex-direction: column; align-items: center; gap: 1px; width: 100%; }
.matrix-cell-name { font-weight: var(--fw-medium); color: var(--text); }
.matrix-cell-meta { color: var(--text-muted); font-size: var(--fs-2xs); }
.matrix-empty { color: var(--text-faint); }
.matrix button.matrix-btn { all: unset; cursor: pointer; display: block; width: 100%; border-radius: var(--r-sm); padding: 2px; }
.matrix button.matrix-btn:hover { background: var(--surface-hover); }
.matrix button.matrix-btn:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 1px; }

.gantt { display: grid; gap: 2px; }
.gantt-row { display: grid; grid-template-columns: 220px 1fr; gap: var(--sp-3); align-items: center; }
.gantt-label { font-size: var(--fs-sm); color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gantt-track { position: relative; height: 24px; background: var(--surface-sunken);
  border-radius: var(--r-sm); overflow: hidden; }
.gantt-bar { position: absolute; top: 3px; bottom: 3px; border-radius: var(--r-xs);
  display: flex; align-items: center; padding: 0 var(--sp-2); font-size: var(--fs-2xs);
  color: var(--chart-label-on-fill); font-weight: var(--fw-medium); white-space: nowrap; overflow: hidden; }
.gantt-scale { display: grid; grid-template-columns: 220px 1fr; gap: var(--sp-3); margin-bottom: var(--sp-2); }
.gantt-months { display: grid; grid-template-columns: repeat(12, 1fr); font-size: var(--fs-2xs);
  color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.gantt-months span { border-left: 1px solid var(--border-subtle); padding-left: 4px; }
.gantt-today { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--danger-500); opacity: 0.7; }

.radar-wrap { display: flex; justify-content: center; }
.chip-row { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.mini-kv { display: flex; justify-content: space-between; gap: var(--sp-3); padding: var(--sp-2) 0;
  border-bottom: 1px dashed var(--border-subtle); font-size: var(--fs-sm); }
.mini-kv:last-child { border-bottom: 0; }
.mini-kv-v { font-weight: var(--fw-semibold); font-variant-numeric: tabular-nums; }

@media (max-width: 768px) {
  .gantt-row, .gantt-scale { grid-template-columns: 120px 1fr; }
  .tt-grid { min-width: 720px; }
}
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const tag = document.createElement('style');
  tag.id = STYLE_ID;
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

/* ==========================================================================
   1 · deterministic helpers
   ========================================================================== */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };
const AY = 'AY2026';
const TODAY = '2026-08-20';
const MAX_WEEKLY_PERIODS = 34;

function hashStr(s) {
  const str = String(s);
  let x = 2166136261;
  for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); }
  return x >>> 0;
}
function rngFor(seed) {
  let a = hashStr(seed) || 1;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (r, min, max) => min + Math.floor(r() * (max - min + 1));
const rf = (r, min, max) => min + r() * (max - min);
const rpick = (r, arr) => arr[Math.min(arr.length - 1, Math.floor(r() * arr.length))];
const round1 = (n) => Math.round(n * 10) / 10;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/** Stable colour slot for a subject code — same subject, same hue, everywhere. */
const SUBJECT_ORDER = ['ENG', 'MAT', 'SCI', 'SST', 'HIN', 'PHY', 'CHE', 'BIO', 'CSC', 'ECO',
  'ACC', 'BST', 'HIS', 'GEO', 'POL', 'PSY', 'EVS', 'SAN', 'FRN', 'GK', 'ART', 'MUS', 'PED', 'IT'];
function subjectColor(code) {
  const i = SUBJECT_ORDER.indexOf(code);
  return i >= 0 && i < PALETTE.length ? PALETTE[i] : 'var(--chart-other)';
}
function subjectName(code) {
  const s = db.subjects.find((x) => x.code === code);
  return s ? s.name : code;
}
function subjectMeta(code) {
  return db.subjects.find((x) => x.code === code) || { code, name: code, type: 'Core', hasPractical: false, maxMarks: 100, passMarks: 33 };
}

function currentCampus(ctx) {
  const id = (ctx && ctx.state && ctx.state.campusId) || store.get('campusId') || 'C1';
  return db.campuses.find((c) => c.id === id) ? id : 'C1';
}
function campusName(id) {
  const c = db.campuses.find((x) => x.id === id);
  return c ? c.name : id;
}
function classesFor(campusId) { return db.classes.filter((c) => c.campusId === campusId); }
function sectionsFor(campusId) { return db.sections.filter((s) => s.campusId === campusId); }
function teachersFor(campusId) {
  return db.staff.filter((s) => s.campusId === campusId && s.type === 'Teaching' && s.status !== 'Resigned');
}
function strengthOf(sectionId) { return db.students.filter((s) => s.sectionId === sectionId && s.status === 'Active').length; }
function classStrength(classId) { return db.students.filter((s) => s.classId === classId && s.status === 'Active').length; }

/** Roles that may edit academic masters. */
function canEdit() { return store.isRole('super-admin', 'principal', 'vice-principal', 'administrator'); }

function toast(title, text, tone = 'success') { notify({ title, text, tone }); }

/** A standard "this is a prototype" save handler. */
function fakeSave(what) {
  return (values) => {
    notify({ title: `${what} saved`, text: 'Prototype build — nothing is persisted to a server.', tone: 'success' });
  };
}

function confirmThen(cfg, run) {
  ConfirmDialog(cfg).then((ok) => { if (ok) run(); });
}

/* -------------------------------------------------- date / planner utils */

function parseISO(s) { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); }
function isoOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDays(iso, n) { const d = parseISO(iso); d.setDate(d.getDate() + n); return isoOf(d); }
function daysBetween(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }

const SESSION_START = '2026-04-01';
const SESSION_END = '2027-03-31';
const SESSION_DAYS = daysBetween(SESSION_START, SESSION_END);
const SESSION_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

/* ==========================================================================
   2 · derived academic content (deterministic, memoised)
   ========================================================================== */

const CHAPTER_BANK = {
  ENG: ['Prose — The Portrait of a Lady', 'Poetry — A Photograph', 'Prose — We’re Not Afraid to Die',
    'Poetry — The Laburnum Top', 'Grammar — Tenses & Voice', 'Writing — Notice & Poster',
    'Prose — Discovering Tut', 'Writing — Article & Report', 'Poetry — The Voice of the Rain',
    'Prose — The Ailing Planet', 'Grammar — Clauses & Modals', 'Reading Comprehension Skills',
    'Drama — The Merchant of Venice (extract)', 'Writing — Letters, Formal & Informal'],
  HIN: ['गद्य — नमक का दरोगा', 'काव्य — कबीर की साखियाँ', 'व्याकरण — संधि एवं समास',
    'गद्य — मियाँ नसीरुद्दीन', 'काव्य — सूरदास के पद', 'रचना — पत्र लेखन',
    'गद्य — भक्तिन', 'काव्य — तुलसीदास', 'व्याकरण — अलंकार', 'रचना — निबंध लेखन',
    'गद्य — बाज़ार दर्शन', 'काव्य — निराला की कविताएँ', 'अपठित गद्यांश', 'रचना — संवाद लेखन'],
  SAN: ['सुभाषितानि', 'दुर्बुद्धिः विनश्यति', 'व्याकरणम् — शब्दरूपाणि', 'अव्ययपदानि',
    'भारतीवसन्तगीतिः', 'व्याकरणम् — धातुरूपाणि', 'सङ्ख्यावाचकाः', 'अनुवाद-अभ्यासः',
    'सूक्तिमौक्तिकम्', 'पर्यावरणम्', 'समासः', 'सन्धिः', 'चित्र-वर्णनम्', 'पत्रलेखनम्'],
  FRN: ['Salutations et présentations', 'La famille et les amis', 'Les nombres et l’heure',
    'La routine quotidienne', 'Les verbes du premier groupe', 'La nourriture et les repas',
    'Les adjectifs qualificatifs', 'La ville et les directions', 'Le passé composé',
    'Les loisirs', 'Le futur simple', 'La météo et les saisons', 'La lettre informelle', 'Révision générale'],
  MAT: ['Number Systems', 'Polynomials', 'Coordinate Geometry', 'Linear Equations in Two Variables',
    'Introduction to Euclid’s Geometry', 'Lines and Angles', 'Triangles', 'Quadrilaterals',
    'Areas of Parallelograms', 'Circles', 'Surface Areas and Volumes', 'Statistics',
    'Probability', 'Constructions'],
  SCI: ['Matter in Our Surroundings', 'Is Matter Around Us Pure', 'Atoms and Molecules',
    'Structure of the Atom', 'The Fundamental Unit of Life', 'Tissues', 'Diversity in Living Organisms',
    'Motion', 'Force and Laws of Motion', 'Gravitation', 'Work and Energy', 'Sound',
    'Why Do We Fall Ill', 'Natural Resources'],
  SST: ['The French Revolution', 'Socialism in Europe', 'Nazism and the Rise of Hitler',
    'India — Size and Location', 'Physical Features of India', 'Drainage', 'Climate',
    'Natural Vegetation and Wildlife', 'Population', 'What is Democracy',
    'Constitutional Design', 'Electoral Politics', 'The Story of Village Palampur', 'Poverty as a Challenge'],
  PHY: ['Physical World and Measurement', 'Kinematics — Motion in a Straight Line',
    'Motion in a Plane', 'Laws of Motion', 'Work, Energy and Power',
    'System of Particles and Rotational Motion', 'Gravitation', 'Mechanical Properties of Solids',
    'Thermal Properties of Matter', 'Thermodynamics', 'Kinetic Theory', 'Oscillations',
    'Waves', 'Practical — Error Analysis'],
  CHE: ['Some Basic Concepts of Chemistry', 'Structure of Atom',
    'Classification of Elements and Periodicity', 'Chemical Bonding and Molecular Structure',
    'States of Matter', 'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Hydrogen',
    'The s-Block Elements', 'The p-Block Elements', 'Organic Chemistry — Basic Principles',
    'Hydrocarbons', 'Practical — Salt Analysis'],
  BIO: ['The Living World', 'Biological Classification', 'Plant Kingdom', 'Animal Kingdom',
    'Morphology of Flowering Plants', 'Anatomy of Flowering Plants', 'Structural Organisation in Animals',
    'Cell — The Unit of Life', 'Biomolecules', 'Cell Cycle and Cell Division',
    'Photosynthesis in Higher Plants', 'Respiration in Plants', 'Plant Growth and Development',
    'Practical — Microscopy'],
  CSC: ['Computer Systems and Organisation', 'Python Fundamentals', 'Data Handling',
    'Conditional and Iterative Statements', 'Strings', 'Lists and Tuples', 'Dictionaries',
    'Functions and Modules', 'File Handling', 'Exception Handling',
    'Introduction to SQL', 'Data Structures — Stacks and Queues', 'Computer Networks',
    'Societal Impacts and Cyber Ethics'],
  IT: ['Digital Documentation', 'Electronic Spreadsheets', 'Database Management Systems',
    'Web Applications and Security', 'Introduction to Networking', 'Communication Skills',
    'Self-Management Skills', 'ICT Skills', 'Entrepreneurial Skills', 'Green Skills',
    'Presentation Design', 'Email and Collaboration Tools', 'Project Work', 'Portfolio Review'],
  ECO: ['Introduction to Economics', 'Collection of Data', 'Organisation of Data',
    'Presentation of Data', 'Measures of Central Tendency', 'Measures of Dispersion',
    'Correlation', 'Index Numbers', 'Indian Economy on the Eve of Independence',
    'Indian Economy 1950-1990', 'Liberalisation, Privatisation, Globalisation',
    'Poverty', 'Human Capital Formation', 'Rural Development'],
  ACC: ['Introduction to Accounting', 'Theory Base of Accounting', 'Recording of Transactions I',
    'Recording of Transactions II', 'Bank Reconciliation Statement', 'Trial Balance and Rectification',
    'Depreciation, Provisions and Reserves', 'Bills of Exchange', 'Financial Statements I',
    'Financial Statements II', 'Accounts from Incomplete Records', 'Computerised Accounting',
    'Partnership Fundamentals', 'Project Work'],
  BST: ['Nature and Purpose of Business', 'Forms of Business Organisation', 'Public, Private and Global Enterprises',
    'Business Services', 'Emerging Modes of Business', 'Social Responsibility of Business',
    'Formation of a Company', 'Sources of Business Finance', 'Small Business',
    'Internal Trade', 'International Business', 'Nature and Significance of Management',
    'Principles of Management', 'Business Environment'],
  HIS: ['Bricks, Beads and Bones — Harappan Civilisation', 'Kings, Farmers and Towns',
    'Kinship, Caste and Class', 'Thinkers, Beliefs and Buildings', 'Through the Eyes of Travellers',
    'Bhakti-Sufi Traditions', 'An Imperial Capital — Vijayanagara', 'Peasants, Zamindars and the State',
    'Kings and Chronicles', 'Colonialism and the Countryside', 'Rebels and the Raj',
    'Mahatma Gandhi and the National Movement', 'Understanding Partition', 'Framing the Constitution'],
  GEO: ['Geography as a Discipline', 'The Origin and Evolution of the Earth', 'Interior of the Earth',
    'Distribution of Oceans and Continents', 'Minerals and Rocks', 'Geomorphic Processes',
    'Landforms and their Evolution', 'Composition and Structure of Atmosphere', 'Solar Radiation',
    'Atmospheric Circulation', 'Water in the Atmosphere', 'World Climate', 'Water — Oceans',
    'Life on the Earth'],
  POL: ['Constitution — Why and How', 'Rights in the Indian Constitution', 'Election and Representation',
    'Executive', 'Legislature', 'Judiciary', 'Federalism', 'Local Governments',
    'Constitution as a Living Document', 'The Philosophy of the Constitution',
    'Political Theory — An Introduction', 'Freedom', 'Equality', 'Social Justice'],
  PSY: ['What is Psychology', 'Methods of Enquiry in Psychology', 'The Bases of Human Behaviour',
    'Human Development', 'Sensory, Attentional and Perceptual Processes', 'Learning',
    'Human Memory', 'Thinking', 'Motivation and Emotion', 'Variations in Psychological Attributes',
    'Self and Personality', 'Meeting Life Challenges', 'Psychological Disorders', 'Therapeutic Approaches'],
  EVS: ['My Family and Me', 'Plants Around Us', 'Animals Around Us', 'Our Food',
    'Water — Our Lifeline', 'Air and Weather', 'Housing and Shelter', 'Travel and Transport',
    'Work and Play', 'Things We Make and Do', 'Our Neighbourhood', 'Festivals of India',
    'Safety and First Aid', 'Caring for the Environment'],
  GK: ['India — States and Capitals', 'World Landmarks', 'Sports and Sportspersons',
    'Science and Inventions', 'Current Affairs — Quarter 1', 'Books and Authors',
    'Indian Constitution Basics', 'Space and Astronomy', 'Environment and Conservation',
    'Art and Culture', 'Awards and Honours', 'Logical Reasoning', 'Current Affairs — Quarter 2', 'Quiz Round-up'],
  ART: ['Elements of Art — Line and Shape', 'Colour Theory', 'Still Life Drawing', 'Landscape Composition',
    'Warli and Madhubani Folk Art', 'Clay Modelling', 'Paper Craft and Origami', 'Poster Design',
    'Perspective Drawing', 'Portrait Basics', 'Print Making', 'Mixed Media Collage',
    'Digital Illustration Basics', 'Portfolio and Exhibition'],
  MUS: ['Introduction to Swaras', 'Raag Yaman', 'Taal Teentaal', 'Bhajan and Devotional Singing',
    'Western Notation Basics', 'Rhythm and Clapping Patterns', 'Group Choir Technique',
    'Raag Bhupali', 'Instrumental — Keyboard Basics', 'Patriotic Songs', 'Voice Culture and Breathing',
    'Folk Music of India', 'Ensemble Performance', 'Annual Day Preparation'],
  PED: ['Changing Trends in Physical Education', 'Olympic Movement', 'Yoga and Lifestyle',
    'Physical Education for CWSN', 'Children and Women in Sports', 'Test and Measurement',
    'Fundamentals of Anatomy and Physiology', 'Biomechanics and Sports', 'Psychology and Sports',
    'Training in Sports', 'Athletics — Track Events', 'Team Games — Basketball',
    'Team Games — Football', 'Fitness Assessment'],
};
function chapterTitles(code) { return CHAPTER_BANK[code] || CHAPTER_BANK.ENG; }

const BLOOM = ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create'];
const UNIT_STATUS = ['Completed', 'In Progress', 'Not Started'];

const _curriculumCache = new Map();
/**
 * Chapter-level curriculum plan for one class + subject.
 * Deterministic: same class/subject always returns the same units.
 */
function curriculumUnits(classId, code) {
  const key = classId + '|' + code;
  if (_curriculumCache.has(key)) return _curriculumCache.get(key);
  const r = rngFor('cur' + key);
  const titles = chapterTitles(code);
  const count = ri(r, 9, 14);
  const perTerm = Math.ceil(count / 2);
  let cursor = 0; // school days elapsed from session start
  const out = [];
  for (let i = 0; i < count; i++) {
    const planned = ri(r, 6, 16);
    const start = addDays(SESSION_START, 14 + cursor);
    const end = addDays(start, planned * 2 + ri(r, 1, 5));
    cursor += planned * 2 + ri(r, 2, 6);
    const elapsedRatio = clamp(daysBetween(start, TODAY) / Math.max(1, daysBetween(start, end)), -0.4, 1.4);
    let completion;
    if (elapsedRatio <= 0) completion = 0;
    else if (elapsedRatio >= 1) completion = ri(r, 88, 100);
    else completion = Math.round(clamp(elapsedRatio * 100 + rf(r, -18, 14), 0, 100));
    const status = completion >= 96 ? 'Completed' : completion === 0 ? 'Not Started' : 'In Progress';
    out.push({
      id: `${classId}-${code}-U${i + 1}`,
      classId,
      subjectCode: code,
      subjectName: subjectName(code),
      unitNo: i + 1,
      term: i < perTerm ? 'Term 1' : 'Term 2',
      title: titles[i % titles.length],
      periodsPlanned: planned,
      periodsTaken: Math.round((planned * completion) / 100),
      startDate: start,
      endDate: end,
      completion,
      status,
      resources: ri(r, 2, 12),
      assessment: rpick(r, ['Class Test', 'Worksheet', 'Project', 'Oral Assessment', 'Lab Activity', 'Portfolio']),
      bloom: rpick(r, BLOOM),
      delayDays: status !== 'Completed' && parseISO(end) < parseISO(TODAY) ? daysBetween(end, TODAY) : 0,
    });
  }
  _curriculumCache.set(key, out);
  return out;
}

/** Class+subject syllabus rollup rows for the chosen campus. */
const _syllabusCache = new Map();
function syllabusRows(campusId) {
  if (_syllabusCache.has(campusId)) return _syllabusCache.get(campusId);
  const out = [];
  for (const cls of classesFor(campusId)) {
    if (cls.level < 3) continue; // pre-primary follows an activity plan, not a chapter syllabus
    const streams = cls.level >= 13 ? ['Science', 'Commerce', 'Humanities'] : [null];
    const codes = new Set();
    for (const st of streams) subjectsForLevel(cls.level, st).forEach((c) => codes.add(c));
    for (const code of codes) {
      const units = curriculumUnits(cls.id, code);
      const planned = units.reduce((a, u) => a + u.periodsPlanned, 0);
      const taken = units.reduce((a, u) => a + u.periodsTaken, 0);
      const done = units.filter((u) => u.status === 'Completed').length;
      const inProgress = units.filter((u) => u.status === 'In Progress').length;
      const behind = units.filter((u) => u.delayDays > 0).length;
      const teacher = teacherForClassSubject(cls.id, code, campusId);
      out.push({
        id: `${cls.id}-${code}`,
        campusId,
        classId: cls.id,
        className: cls.name,
        classLevel: cls.level,
        stage: cls.stage,
        subjectCode: code,
        subjectName: subjectName(code),
        units: units.length,
        unitsDone: done,
        unitsInProgress: inProgress,
        unitsBehind: behind,
        periodsPlanned: planned,
        periodsTaken: taken,
        completion: planned ? Math.round((taken / planned) * 100) : 0,
        teacherId: teacher ? teacher.id : null,
        teacherName: teacher ? teacher.name : 'Unassigned',
        lastUpdated: units.length ? units[Math.max(0, done - 1)].endDate : SESSION_START,
        status: behind > 1 ? 'Behind Schedule' : done === units.length ? 'Completed' : 'In Progress',
      });
    }
  }
  _syllabusCache.set(campusId, out);
  return out;
}

/** The teacher who actually teaches a class+subject, taken from the timetable. */
const _cstCache = new Map();
let _csSlotIndex = null;
function teacherForClassSubject(classId, code, campusId) {
  const key = classId + '|' + code;
  if (_cstCache.has(key)) return _cstCache.get(key);
  if (!_csSlotIndex) {
    _csSlotIndex = new Map();
    for (const s of db.timetableSlots) {
      if (!s.teacherId) continue;
      const kk = s.classId + '|' + s.subjectCode;
      if (!_csSlotIndex.has(kk)) _csSlotIndex.set(kk, s);
    }
  }
  const slot = _csSlotIndex.get(key);
  let t = slot ? db.staff.find((x) => x.id === slot.teacherId) : null;
  if (!t) {
    const pool = teachersFor(campusId || 'C1').filter((x) => x.subjects.includes(code));
    t = pool.length ? pool[hashStr(key) % pool.length] : null;
  }
  _cstCache.set(key, t || null);
  return t || null;
}

/** Learning outcomes for a class + subject (NCERT-flavoured LO codes). */
const _loCache = new Map();
function learningOutcomes(classId, code) {
  const key = classId + '|' + code;
  if (_loCache.has(key)) return _loCache.get(key);
  const r = rngFor('lo' + key);
  const cls = db.classes.find((c) => c.id === classId);
  const units = curriculumUnits(classId, code);
  const verbs = {
    Remember: ['recalls', 'lists', 'identifies', 'defines'],
    Understand: ['explains', 'summarises', 'classifies', 'interprets'],
    Apply: ['applies', 'demonstrates', 'solves', 'uses'],
    Analyse: ['compares', 'differentiates', 'examines', 'relates'],
    Evaluate: ['justifies', 'critiques', 'assesses', 'defends'],
    Create: ['designs', 'composes', 'constructs', 'formulates'],
  };
  const out = units.slice(0, 10).map((u, i) => {
    const bloom = u.bloom;
    const verb = rpick(r, verbs[bloom]);
    const mastery = Math.round(clamp(rf(r, 46, 94), 30, 99));
    const assessed = ri(r, 60, 240);
    return {
      id: `LO-${cls ? cls.code : classId}-${code}-${String(i + 1).padStart(2, '0')}`,
      classId,
      className: cls ? cls.name : classId,
      classLevel: cls ? cls.level : 0,
      subjectCode: code,
      subjectName: subjectName(code),
      unit: u.title,
      code: `${code}${cls ? cls.level : ''}.${i + 1}`,
      statement: `The learner ${verb} the key ideas of “${u.title}” and applies them in unfamiliar contexts.`,
      bloom,
      strand: rpick(r, ['Knowledge', 'Skill', 'Application', 'Attitude & Values']),
      periods: u.periodsPlanned,
      assessedStudents: assessed,
      mastery,
      band: mastery >= 80 ? 'Secure' : mastery >= 60 ? 'Developing' : 'Needs Support',
      status: u.status === 'Completed' ? 'Assessed' : u.status === 'In Progress' ? 'In Progress' : 'Planned',
      linkedAssessment: u.assessment,
    };
  });
  _loCache.set(key, out);
  return out;
}

/* --------------------------------------------------- timetable utilities */

const _campusSlotCache = new Map();
function slotsForCampus(campusId) {
  if (_campusSlotCache.has(campusId)) return _campusSlotCache.get(campusId);
  const out = db.timetableSlots.filter((s) => s.campusId === campusId);
  _campusSlotCache.set(campusId, out);
  return out;
}
/** All slots for one teacher, indexed once. */
const _teacherSlotCache = new Map();
function slotsForTeacher(teacherId) {
  if (!_teacherSlotCache.size) {
    for (const s of db.timetableSlots) {
      if (!s.teacherId) continue;
      if (!_teacherSlotCache.has(s.teacherId)) _teacherSlotCache.set(s.teacherId, []);
      _teacherSlotCache.get(s.teacherId).push(s);
    }
  }
  return _teacherSlotCache.get(teacherId) || [];
}
function teachingPeriods() { return db.periods.filter((p) => !p.isBreak); }

/** Index campus slots by day|periodNo for O(1) clash lookups. */
const _slotIndexCache = new Map();
function slotIndex(campusId) {
  if (_slotIndexCache.has(campusId)) return _slotIndexCache.get(campusId);
  const map = new Map();
  for (const s of slotsForCampus(campusId)) {
    const k = `${s.day}|${s.periodNo}`;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(s);
  }
  _slotIndexCache.set(campusId, map);
  return map;
}

/** Weekly period count per teacher, from the live timetable. */
const _loadCache = new Map();
function teacherLoad(campusId) {
  if (_loadCache.has(campusId)) return _loadCache.get(campusId);
  const map = new Map();
  for (const s of slotsForCampus(campusId)) {
    if (!s.teacherId) continue;
    map.set(s.teacherId, (map.get(s.teacherId) || 0) + 1);
  }
  _loadCache.set(campusId, map);
  return map;
}

function loadTone(periods) {
  if (periods > MAX_WEEKLY_PERIODS) return 'danger';
  if (periods >= 30) return 'warning';
  if (periods < 12) return 'info';
  return 'success';
}
function loadLabel(periods) {
  if (periods > MAX_WEEKLY_PERIODS) return 'Overloaded';
  if (periods >= 30) return 'Near limit';
  if (periods < 12) return 'Under-utilised';
  return 'Balanced';
}

/** Rooms in use at a campus (section rooms + lab/special rooms). */
const _roomCache = new Map();
function roomsFor(campusId) {
  if (_roomCache.has(campusId)) return _roomCache.get(campusId);
  const set = new Set(sectionsFor(campusId).map((s) => s.roomNo));
  ['LAB-PHY', 'LAB-CHE', 'LAB-BIO', 'LAB-CS1', 'LAB-CS2', 'ART-01', 'MUS-01', 'AUD-01', 'SPORT-GR']
    .forEach((rm) => set.add(rm));
  const out = Array.from(set).sort();
  _roomCache.set(campusId, out);
  return out;
}

/** Every clash in the campus timetable: teacher double-booked or room double-booked. */
const _conflictCache = new Map();
function timetableConflicts(campusId) {
  if (_conflictCache.has(campusId)) return _conflictCache.get(campusId);
  const out = [];
  const idx = slotIndex(campusId);
  let n = 0;
  for (const [k, slots] of idx) {
    const [day, periodNo] = k.split('|');
    const byTeacher = new Map();
    const byRoom = new Map();
    for (const s of slots) {
      if (s.teacherId) {
        if (!byTeacher.has(s.teacherId)) byTeacher.set(s.teacherId, []);
        byTeacher.get(s.teacherId).push(s);
      }
      if (s.room) {
        if (!byRoom.has(s.room)) byRoom.set(s.room, []);
        byRoom.get(s.room).push(s);
      }
    }
    for (const [tid, list] of byTeacher) {
      if (list.length < 2) continue;
      n++;
      out.push({
        id: 'CFT' + String(n).padStart(4, '0'),
        type: 'Teacher double-booked',
        severity: 'Critical',
        day, periodNo: Number(periodNo),
        time: `${list[0].startTime}–${list[0].endTime}`,
        subject: list[0].teacherName,
        entity: list[0].teacherName,
        entityId: tid,
        detail: list.map((s) => `${s.className}-${s.section} (${s.subjectName})`).join(' · '),
        classes: list.map((s) => `${s.className}-${s.section}`).join(', '),
        count: list.length,
        campusId,
        status: 'Open',
      });
    }
    for (const [room, list] of byRoom) {
      if (list.length < 2) continue;
      n++;
      out.push({
        id: 'CFT' + String(n).padStart(4, '0'),
        type: 'Room clash',
        severity: 'Major',
        day, periodNo: Number(periodNo),
        time: `${list[0].startTime}–${list[0].endTime}`,
        subject: room,
        entity: room,
        entityId: room,
        detail: list.map((s) => `${s.className}-${s.section} (${s.teacherName})`).join(' · '),
        classes: list.map((s) => `${s.className}-${s.section}`).join(', '),
        count: list.length,
        campusId,
        status: 'Open',
      });
    }
  }
  // Workload breaches are a third conflict class
  const load = teacherLoad(campusId);
  for (const [tid, periods] of load) {
    if (periods <= MAX_WEEKLY_PERIODS) continue;
    const t = db.staff.find((s) => s.id === tid);
    n++;
    out.push({
      id: 'CFT' + String(n).padStart(4, '0'),
      type: 'Workload exceeded',
      severity: 'Major',
      day: '—', periodNo: 0, time: 'Weekly',
      subject: t ? t.name : tid,
      entity: t ? t.name : tid,
      entityId: tid,
      detail: `${periods} periods a week against a ceiling of ${MAX_WEEKLY_PERIODS}.`,
      classes: '—',
      count: periods - MAX_WEEKLY_PERIODS,
      campusId,
      status: 'Open',
    });
  }
  out.sort((a, b) => (a.severity === b.severity ? a.type.localeCompare(b.type) : a.severity === 'Critical' ? -1 : 1));
  _conflictCache.set(campusId, out);
  return out;
}

/* ---------------------------------------------------------- lesson plans */

const _planCache = new Map();
const _planTeacherCache = new Map();

/** Lesson plans for one teacher — cheap enough to build on its own. */
function plansForTeacher(t) {
  if (_planTeacherCache.has(t.id)) return _planTeacherCache.get(t.id);
  const out = [];
  const campusId = t.campusId;
  let n = hashStr(t.id) % 900;
  {
    const mySlots = slotsForTeacher(t.id);
    const pairs = new Map();
    for (const s of mySlots) pairs.set(s.classId + '|' + s.subjectCode, s);
    for (const [, s] of pairs) {
      const units = curriculumUnits(s.classId, s.subjectCode);
      for (const u of units.slice(0, 4)) {
        n++;
        const r = rngFor('lp' + t.id + u.id);
        const submitted = addDays(u.startDate, -ri(r, 2, 9));
        const status = parseISO(u.startDate) > parseISO(TODAY)
          ? ['Draft', 'Submitted', 'Approved'][hashStr(u.id) % 3]
          : ['Approved', 'Approved', 'Approved', 'Under Review'][hashStr(u.id) % 4];
        out.push({
          id: `LPL-${t.id}-${String(n).padStart(4, '0')}`,
          campusId,
          teacherId: t.id,
          teacherName: t.name,
          classId: s.classId,
          className: s.className,
          section: s.section,
          subjectCode: s.subjectCode,
          subjectName: s.subjectName,
          unit: u.title,
          week: `Week ${Math.max(1, Math.ceil(daysBetween(SESSION_START, u.startDate) / 7))}`,
          fromDate: u.startDate,
          toDate: u.endDate,
          periods: u.periodsPlanned,
          objectives: ri(r, 2, 5),
          activities: rpick(r, ['Group discussion + worksheet', 'Lab demonstration', 'Concept map + quiz',
            'Peer teaching + practice set', 'Case study analysis', 'Storytelling + role play',
            'Flipped classroom video', 'Board work + drill']),
          resources: rpick(r, ['NCERT textbook, smart board', 'Lab kit, worksheets', 'Projector, PPT deck',
            'Manipulatives, chart paper', 'Library reference set', 'Online simulation']),
          assessment: u.assessment,
          submittedOn: submitted,
          reviewedBy: status === 'Approved' ? (db.staff.find((x) => x.campusId === campusId && x.designation === 'Principal') || {}).name || '—' : '—',
          status,
          rating: round1(rf(r, 3.2, 5)),
          completion: u.completion,
        });
      }
    }
  }
  _planTeacherCache.set(t.id, out);
  return out;
}

/** Every lesson plan at a campus. */
function lessonPlans(campusId) {
  if (_planCache.has(campusId)) return _planCache.get(campusId);
  const out = [];
  for (const t of teachersFor(campusId)) out.push(...plansForTeacher(t));
  _planCache.set(campusId, out);
  return out;
}

/* ------------------------------------------------------ teacher appraisal */

const APPRAISAL_DIMS = ['Subject Mastery', 'Classroom Management', 'Student Outcomes',
  'Punctuality & Records', 'Collaboration', 'Innovation & ICT'];

const _apprCache = new Map();
function appraisalFor(teacherId) {
  if (_apprCache.has(teacherId)) return _apprCache.get(teacherId);
  const t = db.staff.find((s) => s.id === teacherId);
  if (!t) return null;
  const r = rngFor('appr' + teacherId);
  const base = t.appraisalScore || 4;
  const scores = APPRAISAL_DIMS.map((d) => ({
    dimension: d,
    self: round1(clamp(base + rf(r, -0.3, 0.7), 1, 5)),
    reviewer: round1(clamp(base + rf(r, -0.7, 0.5), 1, 5)),
    weight: d === 'Student Outcomes' ? 25 : d === 'Subject Mastery' ? 20 : 15,
  }));
  const overall = round1(scores.reduce((a, s) => a + s.reviewer * s.weight, 0) / scores.reduce((a, s) => a + s.weight, 0));
  const out = {
    teacherId,
    teacherName: t.name,
    cycle: '2026-27 · Mid-year',
    scores,
    overall,
    rating: t.appraisalRating,
    studentFeedback: round1(clamp(base * 0.9 + rf(r, 0, 0.9), 2.5, 5)),
    parentFeedback: round1(clamp(base * 0.88 + rf(r, 0, 1), 2.4, 5)),
    peerFeedback: round1(clamp(base * 0.92 + rf(r, -0.2, 0.7), 2.4, 5)),
    responses: ri(r, 42, 210),
    reviewer: (db.staff.find((s) => s.campusId === t.campusId && s.designation === 'Principal') || {}).name || '—',
    reviewedOn: `2026-0${ri(r, 6, 8)}-${String(ri(r, 10, 27)).padStart(2, '0')}`,
    goals: [
      { goal: 'Raise class average by 4 percentage points', progress: ri(r, 35, 98), due: '2026-12-15' },
      { goal: 'Complete 2 CBSE capacity-building workshops', progress: ri(r, 20, 100), due: '2026-11-30' },
      { goal: 'Digitise lesson plans for all units', progress: ri(r, 40, 100), due: '2026-10-31' },
    ],
    strengths: rpick(r, ['Exceptional command of the subject and clear board work.',
      'Builds strong rapport; students participate readily.',
      'Meticulous with records and assessment turnaround.',
      'Creative use of ICT and activity-based learning.']),
    development: rpick(r, ['Differentiate more for the lower quartile of the class.',
      'Increase use of formative assessment data in planning.',
      'Take on a mentoring role for probationary staff.',
      'Improve pace management in double periods.']),
  };
  _apprCache.set(teacherId, out);
  return out;
}

/* ==========================================================================
   3 · shared view components
   ========================================================================== */

/** Small filter shell used above custom (non-listPage) screens. */
function filterCard(filters, onChange, actions) {
  return Card({ className: 'p-0' }, FilterBar({ filters, onChange, actions }));
}

function legendRow(items) {
  return h('div', { className: 'tt-legend' }, items.map((it) => h('span', { className: 'tt-legend-item' },
    h('span', { className: 'tt-legend-sw', style: { background: it.color } }), it.label)));
}

function subjectSwatch(code) {
  return h('span', { className: 'tt-chip-dot', style: { background: subjectColor(code) } });
}

/**
 * The reusable weekly timetable grid.
 *  slots     — timetable slot records
 *  cellText  — (slot) => [primary, secondary] strings
 *  onCell    — optional (day, period, slot) click handler
 *  conflicts — Set of `${day}|${periodNo}` keys to flag
 */
function timetableGrid({ slots = [], primary = (s) => s.subjectName, secondary = (s) => s.teacherName,
  tertiary = (s) => s.room, onCell, conflictKeys = new Set(), editable = false, days = DAYS } = {}) {
  const periods = db.periods;
  const map = new Map();
  for (const s of slots) map.set(`${s.day}|${s.periodNo}`, s);

  const thead = h('thead', null, h('tr', null,
    h('th', { className: 'tt-corner' }, 'Period'),
    days.map((d) => h('th', { attrs: { scope: 'col' } }, DAY_SHORT[d] || d))));

  const tbody = h('tbody');
  for (const p of periods) {
    const row = h('tr');
    row.appendChild(h('th', { className: 'tt-rowhead', attrs: { scope: 'row' } },
      h('div', { className: 'tt-rowhead-no' }, p.isBreak ? p.label : `P${p.no}`),
      h('div', { className: 'tt-rowhead-time' }, `${p.startTime}–${p.endTime}`)));
    for (const d of days) {
      if (p.isBreak) {
        row.appendChild(h('td', null, h('div', { className: 'tt-cell is-break' },
          h('span', { className: 'tt-break-label' }, p.label))));
        continue;
      }
      const key = `${d}|${p.no}`;
      const s = map.get(key);
      const conflicted = conflictKeys.has(key);
      const cls = ['tt-cell'];
      if (!s) cls.push('is-free');
      if (conflicted) cls.push('has-conflict');
      if (s && s.isSubstituted) cls.push('is-sub');
      if (editable) cls.push('is-editable');
      const cell = h('div', {
        className: cls.join(' '),
        dataset: { day: d, period: String(p.no) },
        attrs: editable ? { tabindex: '0', role: 'button', 'aria-label': `${d} period ${p.no}` } : {},
        onClick: onCell ? () => onCell(d, p, s) : null,
        onKeyDown: onCell ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCell(d, p, s); } } : null,
      });
      if (s) {
        cell.appendChild(h('span', { className: 'tt-accent', style: { background: subjectColor(s.subjectCode) } }));
        cell.appendChild(h('span', { className: 'tt-sub-name' }, primary(s)));
        const sec = secondary(s);
        if (sec) cell.appendChild(h('span', { className: 'tt-teacher' }, sec));
        const ter = tertiary && tertiary(s);
        if (ter) cell.appendChild(h('span', { className: 'tt-room' }, ter));
      } else {
        cell.appendChild(h('span', { className: 'tt-teacher t-faint' }, 'Free'));
      }
      row.appendChild(h('td', null, cell));
    }
    tbody.appendChild(row);
  }
  return h('div', { className: 'tt-wrap' }, h('table', { className: 'tt-grid' }, thead, tbody));
}

/** Legend used under every timetable grid. */
function timetableLegend(codes) {
  const uniq = Array.from(new Set(codes)).slice(0, 10);
  return h('div', { className: 'stack-2 mt-3' },
    legendRow(uniq.map((c) => ({ label: subjectName(c), color: subjectColor(c) }))),
    h('div', { className: 't-xs t-muted' },
      'Hatched cells are free periods · a red outline marks a clash · an amber outline marks a substituted period.'));
}

/** Compact per-teacher workload meter list. */
function workloadMeters(campusId, teacherIds, { limit = 12 } = {}) {
  const load = teacherLoad(campusId);
  const rows = (teacherIds || Array.from(load.keys())).slice(0, limit).map((id) => {
    const t = db.staff.find((s) => s.id === id);
    const periods = load.get(id) || 0;
    return { t, id, periods };
  }).filter((x) => x.t).sort((a, b) => b.periods - a.periods);
  if (!rows.length) {
    return EmptyState({ icon: 'gauge', title: 'No workload yet', text: 'Assign periods on the grid and each teacher’s weekly load appears here.' });
  }
  return h('div', null, rows.map(({ t, periods }) => h('div', { className: 'load-meter' },
    h('div', { className: 'row', style: { gap: 'var(--sp-2)', minWidth: 0 } },
      Avatar(t.name, { size: 'xs' }),
      h('a', {
        className: 't-sm t-truncate', href: '#/teachers/profile/' + t.id,
        onClick: (e) => { e.preventDefault(); navigate('teachers/profile/' + t.id); },
      }, t.name)),
    h('span', { className: 't-sm t-num t-semibold' }, `${periods}/${MAX_WEEKLY_PERIODS}`),
    h('div', { className: 'load-meter-bar' },
      ProgressBar(Math.min(periods, MAX_WEEKLY_PERIODS + 6), { max: MAX_WEEKLY_PERIODS + 6, tone: loadTone(periods), size: 'sm' })))));
}

/** Radar-style chart for appraisal dimensions (hand-rolled SVG, tokens only). */
function radarChart(items, { size = 260, max = 5, title = 'Appraisal profile' } = {}) {
  const cx = size / 2, cy = size / 2, R = size / 2 - 46;
  const n = items.length;
  const pt = (i, v) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (v / max) * R;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(size));
  svg.setAttribute('role', 'img');
  const t = document.createElementNS(NS, 'title');
  t.textContent = title;
  svg.appendChild(t);

  for (let ring = 1; ring <= 4; ring++) {
    const poly = document.createElementNS(NS, 'polygon');
    const pts = items.map((_, i) => pt(i, (max * ring) / 4).join(',')).join(' ');
    poly.setAttribute('points', pts);
    poly.setAttribute('fill', 'none');
    poly.setAttribute('stroke', 'var(--chart-grid)');
    poly.setAttribute('stroke-width', '1');
    svg.appendChild(poly);
  }
  items.forEach((_, i) => {
    const line = document.createElementNS(NS, 'line');
    const [x, y] = pt(i, max);
    line.setAttribute('x1', cx); line.setAttribute('y1', cy);
    line.setAttribute('x2', x); line.setAttribute('y2', y);
    line.setAttribute('stroke', 'var(--chart-grid)');
    svg.appendChild(line);
  });

  const series = [
    { key: 'reviewer', color: 'var(--chart-1)', fill: 0.22 },
    { key: 'self', color: 'var(--chart-2)', fill: 0.12 },
  ];
  for (const s of series) {
    const poly = document.createElementNS(NS, 'polygon');
    poly.setAttribute('points', items.map((it, i) => pt(i, it[s.key]).join(',')).join(' '));
    poly.setAttribute('fill', s.color);
    poly.setAttribute('fill-opacity', String(s.fill));
    poly.setAttribute('stroke', s.color);
    poly.setAttribute('stroke-width', '2');
    poly.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(poly);
    items.forEach((it, i) => {
      const c = document.createElementNS(NS, 'circle');
      const [x, y] = pt(i, it[s.key]);
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', '3');
      c.setAttribute('fill', s.color);
      svg.appendChild(c);
    });
  }
  items.forEach((it, i) => {
    const [x, y] = pt(i, max + 0.55);
    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', x); label.setAttribute('y', y);
    label.setAttribute('fill', 'var(--chart-ink-2)');
    label.setAttribute('font-size', '9');
    label.setAttribute('text-anchor', x > cx + 6 ? 'start' : x < cx - 6 ? 'end' : 'middle');
    label.setAttribute('dominant-baseline', 'middle');
    label.textContent = it.dimension.length > 20 ? it.dimension.slice(0, 19) + '…' : it.dimension;
    svg.appendChild(label);
  });

  return h('div', { className: 'stack-2' },
    h('div', { className: 'radar-wrap' }, svg),
    legendRow([{ label: 'Reviewer', color: 'var(--chart-1)' }, { label: 'Self-assessment', color: 'var(--chart-2)' }]));
}

/** Gantt-style annual planner track. */
function ganttChart(items, { title = 'Annual plan' } = {}) {
  const rows = items.map((it) => {
    const startOff = clamp(daysBetween(SESSION_START, it.from) / SESSION_DAYS, 0, 1);
    const endOff = clamp(daysBetween(SESSION_START, it.to) / SESSION_DAYS, 0, 1);
    const width = Math.max(0.012, endOff - startOff);
    return h('div', { className: 'gantt-row' },
      h('span', { className: 'gantt-label', attrs: { title: it.label } }, it.label),
      h('div', { className: 'gantt-track' },
        h('div', {
          className: 'gantt-bar',
          style: { left: (startOff * 100) + '%', width: (width * 100) + '%', background: it.color || 'var(--chart-1)' },
          attrs: { title: `${it.label} · ${formatDate(it.from)} – ${formatDate(it.to)}` },
        }, width > 0.1 ? it.badge || '' : ''),
        h('div', { className: 'gantt-today', style: { left: (clamp(daysBetween(SESSION_START, TODAY) / SESSION_DAYS, 0, 1) * 100) + '%' } })));
  });
  return h('div', { className: 'stack-2', attrs: { role: 'img', 'aria-label': title } },
    h('div', { className: 'gantt-scale' },
      h('span'),
      h('div', { className: 'gantt-months' }, SESSION_MONTHS.map((m) => h('span', null, m)))),
    h('div', { className: 'gantt' }, rows));
}

/* ==========================================================================
   4 · ACADEMICS routes
   ========================================================================== */

const academicsRoutes = {

  /* ------------------------------------------------- academics/years --- */
  'academics/years': {
    title: 'Academic Years',
    subtitle: 'Sessions, terms and the roll-over calendar',
    section: 'academics',
    render(mount, ctx) {
      ensureStyles();
      const years = db.academicYears.slice().reverse();
      const current = years.find((y) => y.current) || years[0];
      const editable = canEdit();

      const openForm = (row) => formPage({
        title: row ? `Edit ${row.name}` : 'New academic year',
        subtitle: 'Sessions run April to March, following the CBSE calendar.',
        mode: 'modal',
        size: 'lg',
        submitLabel: row ? 'Save changes' : 'Create session',
        values: row ? { name: row.name, startDate: row.startDate, endDate: row.endDate, status: row.status } : { startDate: '2027-04-01', endDate: '2028-03-31', status: 'Planned' },
        sections: [
          {
            title: 'Session', description: 'The label appears on report cards, invoices and certificates.', cols: 2,
            fields: [
              { id: 'name', label: 'Session name', required: true, placeholder: '2027-28', validate: validators.required },
              { id: 'status', label: 'Status', type: 'select', options: ['Planned', 'Active', 'Archived', 'Closed'], required: true },
              { id: 'startDate', label: 'Starts on', type: 'date', required: true, validate: validators.required },
              { id: 'endDate', label: 'Ends on', type: 'date', required: true, validate: validators.required },
              { id: 'boards', label: 'Boards in session', type: 'multiselect', options: db.boards.map((b) => b.code), span: 'full' },
            ],
          },
          {
            title: 'Terms', description: 'CBSE two-term pattern with periodic tests in each term.', cols: 2,
            fields: [
              { id: 't1From', label: 'Term 1 from', type: 'date', value: '2027-04-01' },
              { id: 't1To', label: 'Term 1 to', type: 'date', value: '2027-09-30' },
              { id: 't2From', label: 'Term 2 from', type: 'date', value: '2027-10-01' },
              { id: 't2To', label: 'Term 2 to', type: 'date', value: '2028-03-31' },
              { id: 'notes', label: 'Notes', type: 'textarea', span: 'full', placeholder: 'Roll-over rules, fee cycle alignment, promotion policy…' },
            ],
          },
        ],
        onSubmit: fakeSave('Academic year'),
      });

      const columns = [
        {
          key: 'name', label: 'Session', sticky: true, width: 200,
          render: (r) => Identity(r.name, `${formatDate(r.startDate, 'dayMonth')} – ${formatDate(r.endDate)}`),
          value: (r) => r.name,
        },
        { key: 'startDate', label: 'Starts', width: 130, render: (r) => formatDate(r.startDate), value: (r) => r.startDate },
        { key: 'endDate', label: 'Ends', width: 130, render: (r) => formatDate(r.endDate), value: (r) => r.endDate },
        {
          key: 'days', label: 'Duration', width: 120, align: 'right', numeric: true,
          value: (r) => daysBetween(r.startDate, r.endDate),
          render: (r) => `${formatNumber(daysBetween(r.startDate, r.endDate))} days`,
        },
        {
          key: 'students', label: 'Students', width: 110, align: 'right', numeric: true,
          value: (r) => (analytics.enrolmentTrend.find((t) => t.year === r.name) || {}).students || 0,
          render: (r) => formatNumber((analytics.enrolmentTrend.find((t) => t.year === r.name) || {}).students || 0),
        },
        {
          key: 'staff', label: 'Staff', width: 100, align: 'right', numeric: true,
          value: (r) => (analytics.enrolmentTrend.find((t) => t.year === r.name) || {}).staff || 0,
        },
        { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        {
          key: 'current', label: 'Current', width: 110, align: 'center',
          render: (r) => (r.current ? Badge('In session', { tone: 'success', icon: 'check-circle' }) : h('span', { className: 't-faint' }, '—')),
          value: (r) => (r.current ? 1 : 0),
        },
      ];

      mount.appendChild(listPage({
        title: 'Academic Years',
        subtitle: `${db.academicYears.length} sessions on record · ${current.name} is live across ${db.campuses.length} campuses`,
        route: 'academics/years',
        actions: editable ? [
          Button('Roll over session', { variant: 'secondary', icon: 'refresh-ccw', onClick: mockAction('Session roll-over wizard') }),
          Button('New academic year', { variant: 'primary', icon: 'calendar-plus', onClick: () => openForm(null) }),
        ] : [Button('Download session calendar', { variant: 'secondary', icon: 'download', onClick: mockAction('Download calendar') })],
        kpis: [
          { label: 'Current session', value: current.name, icon: 'calendar-check', tone: 'brand', footer: `${formatDate(current.startDate)} – ${formatDate(current.endDate)}` },
          { label: 'Students enrolled', value: formatNumber(analytics.kpis.activeStudents), delta: 4.4, deltaLabel: 'vs 2025-26', icon: 'graduation-cap', tone: 'info', trend: analytics.sparks.students },
          { label: 'Teaching staff', value: formatNumber(analytics.kpis.teachingStaff), delta: 3.1, icon: 'presentation', tone: 'success' },
          { label: 'Student : teacher', value: `${analytics.kpis.studentTeacherRatio} : 1`, icon: 'scale', tone: 'warning', footer: 'CBSE norm is 30 : 1' },
        ],
        chart: comboChart({
          categories: analytics.enrolmentTrend.map((t) => t.year),
          bars: [{ name: 'Students', values: analytics.enrolmentTrend.map((t) => t.students) }],
          line: { name: 'Staff', values: analytics.enrolmentTrend.map((t) => t.staff) },
          height: 240,
        }),
        chartTitle: 'Enrolment and staffing by session',
        columns,
        rows: years,
        searchKeys: ['name', 'status'],
        pageSize: 10,
        exportName: 'academic-years',
        rowActions: (row) => [
          { label: 'View term structure', icon: 'layers', onClick: () => openTermDrawer(row) },
          { label: 'Academic calendar', icon: 'calendar-check', route: 'academics/calendar' },
          { label: 'Annual planner', icon: 'map', route: 'academics/annual-planner' },
          { separator: true },
          editable && { label: 'Edit session', icon: 'edit', onClick: () => openForm(row) },
          editable && !row.current && {
            label: 'Set as current', icon: 'check-circle',
            onClick: () => confirmThen({
              title: `Make ${row.name} the current session?`,
              text: 'Every module — fees, attendance, exams and timetable — will switch to this session for all users.',
              confirmLabel: 'Switch session', tone: 'warning', icon: 'refresh-ccw',
            }, () => toast('Session switched', `${row.name} is now the working session.`)),
          },
          editable && row.status !== 'Closed' && {
            label: 'Close session', icon: 'lock', tone: 'danger',
            onClick: () => confirmThen({
              title: `Close ${row.name}?`, text: 'Closed sessions become read-only. Marks, fees and attendance can no longer be edited.',
              confirmLabel: 'Close session', tone: 'danger', icon: 'lock',
            }, () => toast('Session closed', `${row.name} is now read-only.`, 'warning')),
          },
        ].filter(Boolean),
        onRowClick: (row) => openTermDrawer(row),
        notes: Callout({ tone: 'info', icon: 'info', title: 'Session roll-over' },
          'Rolling over copies classes, sections, subject groups, fee structures and the timetable skeleton into the next session. Student promotion runs separately from Students → Promote Students.'),
        emptyState: EmptyState({ icon: 'calendar', title: 'No academic years', text: 'Create the first session to unlock classes, fees and the timetable.' }),
      }));

      function openTermDrawer(row) {
        const groups = db.examGroups.filter((g) => g.academicYearId === row.id);
        Drawer({
          title: row.name, subtitle: `Session structure · ${row.status}`, size: 'lg',
          body: h('div', { className: 'stack-3' },
            DescriptionList([
              ['Session', row.name], ['Status', Badge(row.status)],
              ['Starts', formatDate(row.startDate)], ['Ends', formatDate(row.endDate)],
              ['Working days', `${formatNumber(daysBetween(row.startDate, row.endDate))} calendar days`],
              ['Boards', db.boards.map((b) => b.code).join(', ')],
            ], { cols: 2 }),
            SectionCard({ title: 'Terms', icon: 'layers' },
              Stepper([
                { label: 'Term 1', description: 'Apr – Sep · PT1, Half Yearly', state: 'done' },
                { label: 'Term 2', description: 'Oct – Mar · PT2, Pre-Board, Annual', state: row.current ? 'current' : 'todo' },
                { label: 'Result & promotion', description: 'March', state: row.status === 'Closed' ? 'done' : 'todo' },
              ], { current: row.current ? 1 : 0 })),
            SectionCard({ title: 'Examination groups', icon: 'file-text', subtitle: `${groups.length} scheduled` },
              groups.length ? DataTable({
                columns: [
                  { key: 'name', label: 'Exam group', render: (g) => g.name },
                  { key: 'term', label: 'Term', width: 90 },
                  { key: 'weightage', label: 'Weightage', width: 100, align: 'right', numeric: true, render: (g) => `${g.weightage}%` },
                  { key: 'from', label: 'From', width: 120, render: (g) => formatDate(g.from) },
                  { key: 'status', label: 'Status', width: 120, render: (g) => Badge(g.status) },
                ],
                rows: groups, paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
              }) : EmptyState({ icon: 'file-text', title: 'No exam groups', text: 'Exam groups for this session have not been created yet.' }))),
          actions: (close) => frag(
            Button('Close', { variant: 'ghost', onClick: close }),
            Button('Open academic calendar', { variant: 'primary', icon: 'calendar-check', onClick: () => { close(); navigate('academics/calendar'); } })),
        });
      }
    },
  },

  /* ------------------------------------------------ academics/boards --- */
  'academics/boards': {
    title: 'Boards',
    subtitle: 'Affiliations, grading systems and campus mapping',
    section: 'academics',
    render(mount, ctx) {
      ensureStyles();
      const campusesByBoard = (code) => db.campuses.filter((c) => c.board === code);
      const rows = db.boards.map((b) => {
        const camps = campusesByBoard(b.code);
        const students = db.students.filter((s) => camps.some((c) => c.id === s.campusId));
        const scale = db.gradeScales.find((g) => g.id === b.gradingSystem);
        return {
          ...b,
          campuses: camps.length,
          campusNames: camps.map((c) => c.name).join(', ') || '—',
          students: students.length,
          classes: db.classes.filter((c) => camps.some((x) => x.id === c.campusId)).length,
          scaleName: scale ? scale.name : '—',
          bands: scale ? scale.bands.length : 0,
          status: camps.length ? 'Active' : 'Not in use',
        };
      });

      const boardCard = (b) => SectionCard({
        title: b.code, subtitle: b.name, icon: 'building-columns',
        actions: Badge(b.status),
      },
        h('div', { className: 'stack-3' },
          DescriptionList([
            ['Affiliation no', h('span', { className: 't-mono t-sm' }, b.affiliation)],
            ['Grading system', b.scaleName],
            ['Campuses', String(b.campuses)],
            ['Students', formatNumber(b.students)],
          ], { cols: 2 }),
          b.campuses ? h('div', { className: 'chip-row' }, campusesByBoard(b.code).map((c) => Tag(c.name, { icon: 'building' })))
            : h('div', { className: 't-sm t-muted' }, 'No campus is affiliated to this board yet.'),
          h('div', { className: 'row' },
            Button('Grade scale', { variant: 'ghost', size: 'sm', icon: 'percent', route: 'academics/grading-systems' }),
            Button('Classes', { variant: 'ghost', size: 'sm', icon: 'grid', route: 'academics/classes' }))));

      mount.appendChild(page({
        title: 'Boards & Affiliations',
        subtitle: `${db.boards.length} boards configured · ${db.campuses.length} campuses mapped`,
        route: 'academics/boards',
        actions: canEdit() ? [
          Button('Affiliation documents', { variant: 'secondary', icon: 'folder', onClick: mockAction('Affiliation documents') }),
          Button('Add board', {
            variant: 'primary', icon: 'plus',
            onClick: () => formPage({
              title: 'Add board', mode: 'modal', submitLabel: 'Add board',
              sections: [{
                title: 'Board details', cols: 2, fields: [
                  { id: 'code', label: 'Short code', required: true, placeholder: 'CBSE', validate: validators.required },
                  { id: 'name', label: 'Full name', required: true, span: 'full', validate: validators.required },
                  { id: 'affiliation', label: 'Affiliation number', placeholder: '530XXXX' },
                  { id: 'scale', label: 'Grading system', type: 'select', options: db.gradeScales.map((g) => ({ value: g.id, label: g.name })) },
                  { id: 'campuses', label: 'Campuses', type: 'multiselect', options: db.campuses.map((c) => c.name), span: 'full' },
                ],
              }],
              onSubmit: fakeSave('Board'),
            }),
          }),
        ] : null,
        children: [
          kpiRow([
            { label: 'Boards', value: db.boards.length, icon: 'building-columns', tone: 'brand' },
            { label: 'Campuses mapped', value: db.campuses.length, icon: 'building', tone: 'info' },
            { label: 'Classes offered', value: formatNumber(db.classes.length), icon: 'grid', tone: 'success' },
            { label: 'Students', value: formatNumber(analytics.kpis.totalStudents), icon: 'graduation-cap', tone: 'warning', trend: analytics.sparks.students },
          ]),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-8' }, SectionCard({ title: 'Students by board', className: 'chart-card' },
              barChart({
                categories: rows.map((r) => r.code),
                series: [{ name: 'Students', values: rows.map((r) => r.students) }],
                showValues: true, height: 260,
              }))),
            h('div', { className: 'span-4' }, SectionCard({ title: 'Campus share', className: 'chart-card' },
              donutChart({
                data: rows.filter((r) => r.campuses).map((r) => ({ key: r.code, value: r.campuses })),
                height: 240, centerValue: String(db.campuses.length), centerLabel: 'Campuses',
              })))),
          h('div', { className: 'widget-grid' }, db.boards.map((b, i) =>
            h('div', { className: 'span-6' }, boardCard(rows[i])))),
          SectionCard({ title: 'Board comparison', icon: 'table', flush: true, subtitle: 'Affiliation, scale and reach' },
            DataTable({
              columns: [
                { key: 'code', label: 'Board', sticky: true, width: 90, render: (r) => Badge(r.code, { tone: 'brand' }), value: (r) => r.code },
                { key: 'name', label: 'Full name', width: 320 },
                { key: 'affiliation', label: 'Affiliation', width: 130, className: 't-mono' },
                { key: 'scaleName', label: 'Grading system', width: 200 },
                { key: 'bands', label: 'Grade bands', width: 110, align: 'right', numeric: true },
                { key: 'campuses', label: 'Campuses', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'classes', label: 'Classes', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'students', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => formatNumber(r.students) },
                { key: 'status', label: 'Status', width: 120, render: (r) => Badge(r.status) },
              ],
              rows, paginate: false, footerAggregates: true, maxHeight: 'none',
              exportName: 'boards',
              rowActions: (r) => [
                { label: 'Open grade scale', icon: 'percent', route: 'academics/grading-systems' },
                { label: 'View classes', icon: 'grid', route: 'academics/classes' },
                { separator: true },
                { label: 'Upload affiliation letter', icon: 'upload', onClick: mockAction('Upload affiliation letter') },
              ],
            })),
        ],
      }));
    },
  },

  /* ----------------------------------------------- academics/classes --- */
  'academics/classes': {
    title: 'Classes',
    subtitle: 'Class master with sections, strength and subject load',
    section: 'academics',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const base = classesFor(campusId).map((c) => {
        const secs = db.sections.filter((s) => s.classId === c.id);
        const codes = c.level >= 13
          ? Array.from(new Set(['Science', 'Commerce', 'Humanities'].flatMap((st) => subjectsForLevel(c.level, st))))
          : subjectsForLevel(c.level);
        const strength = classStrength(c.id);
        const capacity = secs.reduce((a, s) => a + s.capacity, 0);
        return {
          ...c,
          sections: secs.length,
          sectionNames: secs.map((s) => s.name).join(', '),
          strength,
          capacity,
          occupancy: capacity ? Math.round((strength / capacity) * 100) : 0,
          subjectCount: codes.length,
          subjectCodes: codes,
          weeklyPeriods: teachingPeriods().length * DAYS.length,
          classTeachers: secs.filter((s) => s.classTeacherId).length,
          status: capacity && strength / capacity > 0.95 ? 'At capacity' : 'Active',
        };
      });
      let rows = base.slice();
      const editable = canEdit();

      const openForm = (row) => formPage({
        title: row ? `Edit ${row.name}` : 'Add class',
        subtitle: `${campusName(campusId)} · session ${db.academicYears.find((y) => y.current).name}`,
        mode: 'modal', size: 'lg',
        submitLabel: row ? 'Save class' : 'Create class',
        values: row ? { name: row.name, code: row.code, stage: row.stage, level: row.level, sectionCount: row.sections } : { stage: 'Primary', sectionCount: 4 },
        sections: [
          {
            title: 'Class identity', cols: 2, fields: [
              { id: 'name', label: 'Class name', required: true, placeholder: 'Class VI', validate: validators.required },
              { id: 'code', label: 'Class code', required: true, placeholder: 'VI', validate: validators.required },
              { id: 'stage', label: 'Stage', type: 'select', required: true, options: ['Pre-Primary', 'Primary', 'Middle', 'Secondary', 'Senior Secondary'] },
              { id: 'level', label: 'Sort level', type: 'number', hint: 'Nursery = 0 … Class XII = 14', validate: validators.number },
            ],
          },
          {
            title: 'Capacity & academics', cols: 2, fields: [
              { id: 'sectionCount', label: 'Sections', type: 'number', required: true, validate: [validators.required, validators.min(1), validators.max(6)] },
              { id: 'capacity', label: 'Seats per section', type: 'number', value: 40, validate: validators.number },
              { id: 'group', label: 'Subject group', type: 'select', options: db.subjectGroups.map((g) => ({ value: g.id, label: g.name })) },
              { id: 'board', label: 'Board', type: 'select', options: db.boards.map((b) => b.code) },
              { id: 'streams', label: 'Streams offered', type: 'multiselect', options: ['Science', 'Commerce', 'Humanities'], span: 'full', hint: 'Senior secondary only.' },
            ],
          },
        ],
        onSubmit: fakeSave('Class'),
      });

      const node = listPage({
        title: 'Classes',
        subtitle: `${base.length} classes · ${formatNumber(base.reduce((a, r) => a + r.strength, 0))} students at ${campusName(campusId)}`,
        route: 'academics/classes',
        actions: editable ? [
          Button('Sections', { variant: 'secondary', icon: 'columns', route: 'academics/sections' }),
          Button('Add class', { variant: 'primary', icon: 'plus', onClick: () => openForm(null) }),
        ] : [Button('Sections', { variant: 'secondary', icon: 'columns', route: 'academics/sections' })],
        kpis: [
          { label: 'Classes', value: base.length, icon: 'grid', tone: 'brand', footer: `${new Set(base.map((b) => b.stage)).size} stages` },
          { label: 'Sections', value: base.reduce((a, r) => a + r.sections, 0), icon: 'columns', tone: 'info' },
          { label: 'Students', value: formatNumber(base.reduce((a, r) => a + r.strength, 0)), icon: 'graduation-cap', tone: 'success', trend: analytics.sparks.students },
          {
            label: 'Seat occupancy',
            value: `${Math.round((base.reduce((a, r) => a + r.strength, 0) / Math.max(1, base.reduce((a, r) => a + r.capacity, 0))) * 100)}%`,
            icon: 'gauge', tone: 'warning', footer: `${formatNumber(base.reduce((a, r) => a + r.capacity, 0))} seats configured`,
          },
        ],
        chart: barChart({
          categories: base.map((r) => r.name),
          series: [
            { name: 'Enrolled', values: base.map((r) => r.strength) },
            { name: 'Seats', values: base.map((r) => r.capacity) },
          ],
          height: 260,
        }),
        chartTitle: 'Enrolment against configured seats',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Class name or code…', width: '220px' },
          { id: 'stage', label: 'Stage', options: Array.from(new Set(base.map((r) => r.stage))) },
          { id: 'sections', label: 'Sections', options: ['1-3 sections', '4 sections', '5+ sections'] },
          { id: 'occupancy', label: 'Occupancy', options: ['Under 70%', '70-90%', 'Over 90%'] },
        ],
        onFilter: (id, value, all, table) => {
          let out = base.slice();
          if (all.q) out = search(out, all.q, ['name', 'code', 'stage']);
          if (all.stage && all.stage !== 'all') out = out.filter((r) => r.stage === all.stage);
          if (all.sections && all.sections !== 'all') {
            out = out.filter((r) => (all.sections === '1-3 sections' ? r.sections <= 3 : all.sections === '4 sections' ? r.sections === 4 : r.sections >= 5));
          }
          if (all.occupancy && all.occupancy !== 'all') {
            out = out.filter((r) => (all.occupancy === 'Under 70%' ? r.occupancy < 70 : all.occupancy === '70-90%' ? r.occupancy >= 70 && r.occupancy <= 90 : r.occupancy > 90));
          }
          rows = out;
          table.refresh(out);
        },
        columns: [
          {
            key: 'name', label: 'Class', sticky: true, width: 190,
            render: (r) => Identity(r.name, `${r.stage} · level ${r.level}`),
            value: (r) => r.level,
          },
          { key: 'code', label: 'Code', width: 90, className: 't-mono' },
          { key: 'stage', label: 'Stage', width: 150, filter: true },
          { key: 'sections', label: 'Sections', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          {
            key: 'sectionNames', label: 'Section labels', width: 150,
            render: (r) => h('div', { className: 'chip-row' }, r.sectionNames.split(', ').map((n) => Tag(n))),
          },
          { key: 'strength', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => formatNumber(r.strength) },
          { key: 'capacity', label: 'Seats', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          {
            key: 'occupancy', label: 'Occupancy', width: 170, align: 'right', numeric: true, aggregate: 'avg',
            format: (v) => `${Math.round(v)}%`,
            render: (r) => h('div', { className: 'stack-1' },
              h('span', { className: 't-xs t-num' }, `${r.occupancy}%`),
              ProgressBar(r.occupancy, { max: 100, size: 'sm', tone: r.occupancy > 95 ? 'danger' : r.occupancy > 85 ? 'warning' : 'success' })),
          },
          { key: 'subjectCount', label: 'Subjects', width: 100, align: 'right', numeric: true },
          { key: 'classTeachers', label: 'Class teachers', width: 130, align: 'right', numeric: true, hidden: true },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        selectable: true,
        footerAggregates: true,
        searchKeys: ['name', 'code', 'stage'],
        pageSize: 25,
        exportName: 'classes',
        bulkActions: [
          { label: 'Assign subject group', icon: 'layers', onClick: (sel) => toast('Subject group queued', `${sel.length} classes selected.`) },
          { label: 'Export selection', icon: 'download', onClick: (sel) => toast('Export ready', `${sel.length} classes exported to CSV.`) },
        ],
        expandable: (r) => {
          const secs = db.sections.filter((s) => s.classId === r.id);
          return h('div', { className: 'stack-3' },
            h('div', { className: 'chip-row' }, r.subjectCodes.map((c) => h('span', { className: 'tt-chip' }, subjectSwatch(c), subjectName(c)))),
            DataTable({
              columns: [
                { key: 'name', label: 'Section', width: 100, render: (s) => Badge(s.name, { tone: 'brand' }), value: (s) => s.name },
                { key: 'roomNo', label: 'Room', width: 100, className: 't-mono' },
                { key: 'capacity', label: 'Seats', width: 90, align: 'right', numeric: true },
                { key: 'strength', label: 'Enrolled', width: 100, align: 'right', numeric: true, value: (s) => strengthOf(s.id), render: (s) => formatNumber(strengthOf(s.id)) },
                { key: 'stream', label: 'Stream', width: 130, render: (s) => (s.stream ? Badge(s.stream, { tone: 'info' }) : h('span', { className: 't-faint' }, '—')) },
                {
                  key: 'classTeacherId', label: 'Class teacher', width: 220,
                  render: (s) => {
                    const t = db.staff.find((x) => x.id === s.classTeacherId);
                    return t ? h('a', {
                      href: '#/teachers/profile/' + t.id, className: 't-sm',
                      onClick: (e) => { e.preventDefault(); navigate('teachers/profile/' + t.id); },
                    }, t.name) : h('span', { className: 't-faint' }, 'Not assigned');
                  },
                  value: (s) => (db.staff.find((x) => x.id === s.classTeacherId) || {}).name || '',
                },
              ],
              rows: secs, paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
              onRowClick: (s) => navigate('timetable/class/' + s.id),
              emptyState: EmptyState({ icon: 'columns', title: 'No sections', text: 'Add a section to start admitting students to this class.' }),
            }));
        },
        rowActions: (r) => [
          { label: 'Class timetable', icon: 'calendar', route: 'timetable/class/' + r.id },
          { label: 'Curriculum', icon: 'scroll', route: 'academics/curriculum/' + r.id },
          { label: 'Syllabus tracker', icon: 'clipboard-list', route: 'academics/syllabus-tracker' },
          { label: 'Subject-teacher map', icon: 'workflow', route: 'academics/class-subject-teacher' },
          { separator: true },
          editable && { label: 'Edit class', icon: 'edit', onClick: () => openForm(r) },
          editable && {
            label: 'Delete class', icon: 'trash', tone: 'danger',
            onClick: () => confirmThen({
              title: `Delete ${r.name}?`,
              text: `${formatNumber(r.strength)} students and ${r.sections} sections are attached. This cannot be undone.`,
              confirmLabel: 'Delete class', tone: 'danger', icon: 'trash',
            }, () => toast('Class deleted', `${r.name} removed from the master.`, 'danger')),
          },
        ].filter(Boolean),
        onRowClick: (r) => navigate('academics/curriculum/' + r.id),
        emptyState: EmptyState({
          icon: 'grid', title: 'No classes match these filters',
          text: 'Clear a filter or add a class to the master.',
          action: editable ? Button('Add class', { variant: 'primary', icon: 'plus', onClick: () => openForm(null) }) : null,
        }),
      });
      mount.appendChild(node);
    },
  },

  /* ---------------------------------------------- academics/sections --- */
  'academics/sections': {
    title: 'Sections',
    subtitle: 'Section master, class teachers, rooms and seat occupancy',
    section: 'academics',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const base = sectionsFor(campusId).map((s) => {
        const cls = db.classes.find((c) => c.id === s.classId) || {};
        const t = db.staff.find((x) => x.id === s.classTeacherId);
        const strength = strengthOf(s.id);
        const att = db.attendance.filter((a) => a.sectionId === s.id);
        return {
          ...s,
          className: cls.name || s.classId,
          classLevel: cls.level || 0,
          stage: cls.stage || '—',
          strength,
          vacant: Math.max(0, s.capacity - strength),
          occupancy: s.capacity ? Math.round((strength / s.capacity) * 100) : 0,
          classTeacherName: t ? t.name : 'Not assigned',
          classTeacherId: s.classTeacherId,
          attendancePct: att.length ? round1(att.reduce((a, x) => a + x.percent, 0) / att.length) : 0,
          boys: db.students.filter((x) => x.sectionId === s.id && x.gender === 'Male').length,
          girls: db.students.filter((x) => x.sectionId === s.id && x.gender === 'Female').length,
          status: !s.classTeacherId ? 'Pending' : strength >= s.capacity ? 'At capacity' : 'Active',
        };
      });
      let rows = base.slice();
      const editable = canEdit();

      const openForm = (row) => formPage({
        title: row ? `Edit ${row.label}` : 'Add section',
        mode: 'modal', size: 'lg', submitLabel: row ? 'Save section' : 'Create section',
        values: row ? { className: row.className, name: row.name, capacity: row.capacity, roomNo: row.roomNo, stream: row.stream || '', teacher: row.classTeacherId } : { capacity: 40 },
        sections: [{
          title: 'Section', cols: 2, fields: [
            { id: 'className', label: 'Class', type: 'select', required: true, options: classesFor(campusId).map((c) => c.name), validate: validators.required },
            { id: 'name', label: 'Section letter', type: 'select', required: true, options: ['A', 'B', 'C', 'D', 'E', 'F'], validate: validators.required },
            { id: 'capacity', label: 'Seats', type: 'number', required: true, validate: [validators.required, validators.min(10), validators.max(60)] },
            { id: 'roomNo', label: 'Room number', placeholder: 'G12' },
            { id: 'stream', label: 'Stream', type: 'select', options: ['Science', 'Commerce', 'Humanities'], hint: 'Senior secondary only.' },
            {
              id: 'teacher', label: 'Class teacher', type: 'combobox',
              options: teachersFor(campusId).map((t) => ({ value: t.id, label: `${t.name} — ${t.designation}` })),
            },
            { id: 'remarks', label: 'Remarks', type: 'textarea', span: 'full' },
          ],
        }],
        onSubmit: fakeSave('Section'),
      });

      const assignTeacher = (row) => {
        let chosen = row.classTeacherId || null;
        const free = teachersFor(campusId).map((t) => ({
          value: t.id,
          label: `${t.name} — ${t.designation}${t.classTeacherOf ? ' (already a class teacher)' : ''}`,
        }));
        const m = Modal({
          title: 'Assign class teacher', subtitle: row.label, icon: 'user-check', size: 'md',
          body: h('div', { className: 'stack-3' },
            Field({ label: 'Class teacher', required: true, hint: 'Teachers already holding a section are marked.' },
              Combobox({ options: free, value: chosen, placeholder: 'Search staff…', onChange: (v) => { chosen = v; } })),
            Callout({ tone: 'info', icon: 'info' },
              'The class teacher owns daily attendance, report-card remarks and PTM slots for this section.')),
          actions: (close) => frag(
            Button('Cancel', { variant: 'ghost', onClick: close }),
            Button('Assign', {
              variant: 'primary', icon: 'check',
              onClick: () => {
                if (!chosen) { toast('Pick a teacher', 'Select a member of staff first.', 'warning'); return; }
                const t = db.staff.find((x) => x.id === chosen);
                close();
                toast('Class teacher assigned', `${t ? t.name : chosen} now leads ${row.label}.`);
              },
            })),
        });
        return m;
      };

      mount.appendChild(listPage({
        title: 'Sections',
        subtitle: `${base.length} sections · ${formatNumber(base.reduce((a, r) => a + r.strength, 0))} students at ${campusName(campusId)}`,
        route: 'academics/sections',
        actions: editable ? [
          Button('Classes', { variant: 'secondary', icon: 'grid', route: 'academics/classes' }),
          Button('Add section', { variant: 'primary', icon: 'plus', onClick: () => openForm(null) }),
        ] : null,
        kpis: [
          { label: 'Sections', value: base.length, icon: 'columns', tone: 'brand' },
          { label: 'Seats filled', value: `${Math.round((base.reduce((a, r) => a + r.strength, 0) / Math.max(1, base.reduce((a, r) => a + r.capacity, 0))) * 100)}%`, icon: 'gauge', tone: 'success' },
          { label: 'Vacant seats', value: formatNumber(base.reduce((a, r) => a + r.vacant, 0)), icon: 'user-plus', tone: 'info' },
          { label: 'Without class teacher', value: base.filter((r) => !r.classTeacherId).length, icon: 'alert-circle', tone: 'danger', footer: 'Assign before the term starts' },
        ],
        chart: barChart({
          categories: Array.from(new Set(base.map((r) => r.className))),
          series: [
            { name: 'Boys', values: Array.from(new Set(base.map((r) => r.className))).map((cn) => base.filter((r) => r.className === cn).reduce((a, r) => a + r.boys, 0)) },
            { name: 'Girls', values: Array.from(new Set(base.map((r) => r.className))).map((cn) => base.filter((r) => r.className === cn).reduce((a, r) => a + r.girls, 0)) },
          ],
          stacked: true, height: 260,
        }),
        chartTitle: 'Section strength by class and gender',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Section, room or teacher…', width: '230px' },
          { id: 'className', label: 'Class', options: Array.from(new Set(base.map((r) => r.className))) },
          { id: 'stream', label: 'Stream', options: ['Science', 'Commerce', 'Humanities'] },
          { id: 'ct', label: 'Class teacher', type: 'segment', options: [{ id: 'all', label: 'All' }, { id: 'yes', label: 'Assigned' }, { id: 'no', label: 'Unassigned' }] },
        ],
        onFilter: (id, value, all, table) => {
          let out = base.slice();
          if (all.q) out = search(out, all.q, ['label', 'roomNo', 'classTeacherName', 'className']);
          if (all.className && all.className !== 'all') out = out.filter((r) => r.className === all.className);
          if (all.stream && all.stream !== 'all') out = out.filter((r) => r.stream === all.stream);
          if (all.ct === 'yes') out = out.filter((r) => r.classTeacherId);
          if (all.ct === 'no') out = out.filter((r) => !r.classTeacherId);
          rows = out;
          table.refresh(out);
        },
        columns: [
          { key: 'label', label: 'Section', sticky: true, width: 170, render: (r) => Identity(r.label, `${r.stage} · Room ${r.roomNo}`), value: (r) => r.classLevel * 10 + r.name.charCodeAt(0) },
          { key: 'className', label: 'Class', width: 130, filter: true },
          { key: 'name', label: 'Sec', width: 70, align: 'center', render: (r) => Badge(r.name, { tone: 'brand' }) },
          { key: 'roomNo', label: 'Room', width: 100, className: 't-mono' },
          { key: 'stream', label: 'Stream', width: 130, filter: true, render: (r) => (r.stream ? Badge(r.stream, { tone: 'info' }) : h('span', { className: 't-faint' }, '—')) },
          { key: 'capacity', label: 'Seats', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'strength', label: 'Enrolled', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'vacant', label: 'Vacant', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
          {
            key: 'occupancy', label: 'Occupancy', width: 160, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v)}%`,
            render: (r) => h('div', { className: 'stack-1' },
              h('span', { className: 't-xs t-num' }, `${r.occupancy}%`),
              ProgressBar(r.occupancy, { max: 100, size: 'sm', tone: r.occupancy >= 100 ? 'danger' : r.occupancy > 85 ? 'warning' : 'success' })),
          },
          {
            key: 'classTeacherName', label: 'Class teacher', width: 220,
            render: (r) => (r.classTeacherId
              ? Identity(r.classTeacherName, 'Class teacher', { onClick: () => navigate('teachers/profile/' + r.classTeacherId) })
              : Button('Assign', { variant: 'subtle', size: 'sm', icon: 'user-plus', onClick: () => assignTeacher(r) })),
            value: (r) => r.classTeacherName,
          },
          { key: 'attendancePct', label: 'Attendance', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round1(v)}%`, render: (r) => `${r.attendancePct}%` },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        selectable: true,
        footerAggregates: true,
        searchKeys: ['label', 'roomNo', 'classTeacherName'],
        exportName: 'sections',
        bulkActions: [
          { label: 'Assign rooms', icon: 'door', onClick: (sel) => toast('Room allocation queued', `${sel.length} sections sent to room allocation.`) },
          { label: 'Print section lists', icon: 'print', onClick: (sel) => toast('Sent to printer', `${sel.length} section lists queued.`) },
        ],
        rowActions: (r) => [
          { label: 'Section timetable', icon: 'calendar', route: 'timetable/class/' + r.id },
          { label: 'Students in section', icon: 'users', route: 'students/all' },
          { label: 'Class teacher profile', icon: 'id-card', route: r.classTeacherId ? 'teachers/profile/' + r.classTeacherId : 'teachers/directory' },
          { separator: true },
          editable && { label: 'Assign class teacher', icon: 'user-check', onClick: () => assignTeacher(r) },
          editable && { label: 'Edit section', icon: 'edit', onClick: () => openForm(r) },
          editable && {
            label: 'Archive section', icon: 'archive', tone: 'danger',
            onClick: () => confirmThen({
              title: `Archive ${r.label}?`, text: `${r.strength} students would need to be moved to another section first.`,
              confirmLabel: 'Archive', tone: 'danger', icon: 'archive',
            }, () => toast('Section archived', r.label, 'warning')),
          },
        ].filter(Boolean),
        onRowClick: (r) => navigate('timetable/class/' + r.id),
        emptyState: EmptyState({ icon: 'columns', title: 'No sections match', text: 'Adjust the filters, or add a section to this class.' }),
      }));
    },
  },

  /* ---------------------------------------------- academics/subjects --- */
  'academics/subjects': {
    title: 'Subjects',
    subtitle: 'Subject master with marks, practicals and teaching load',
    section: 'academics',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const slots = slotsForCampus(campusId);
      const base = db.subjects.map((s) => {
        const mine = slots.filter((x) => x.subjectCode === s.code);
        const levels = db.subjectGroups.filter((g) => g.subjects.includes(s.code)).flatMap((g) => g.levels);
        const teachers = new Set(mine.map((x) => x.teacherId).filter(Boolean));
        const marks = db.marks.filter((m) => m.subjectCode === s.code);
        return {
          ...s,
          weeklyPeriods: mine.length,
          classes: new Set(mine.map((x) => x.classId)).size,
          teachers: teachers.size,
          teacherIds: Array.from(teachers),
          levels: levels.length ? `${Math.min(...levels)}–${Math.max(...levels)}` : '—',
          groups: db.subjectGroups.filter((g) => g.subjects.includes(s.code)).length,
          avgScore: marks.length ? round1(marks.reduce((a, m) => a + m.percent, 0) / marks.length) : 0,
          status: mine.length ? 'Active' : 'Not scheduled',
        };
      });
      const editable = canEdit();

      const openForm = (row) => formPage({
        title: row ? `Edit ${row.name}` : 'Add subject',
        mode: 'modal', size: 'lg', submitLabel: row ? 'Save subject' : 'Create subject',
        values: row ? { name: row.name, code: row.code, type: row.type, maxMarks: row.maxMarks, passMarks: row.passMarks, practical: row.hasPractical } : { type: 'Core', maxMarks: 100, passMarks: 33 },
        sections: [
          {
            title: 'Subject', cols: 2, fields: [
              { id: 'name', label: 'Subject name', required: true, validate: validators.required },
              { id: 'code', label: 'Subject code', required: true, placeholder: 'MAT', maxLength: 4, validate: validators.required },
              { id: 'type', label: 'Type', type: 'select', required: true, options: ['Core', 'Language', 'Elective', 'Skill', 'Co-curricular'] },
              { id: 'groups', label: 'Subject groups', type: 'multiselect', options: db.subjectGroups.map((g) => ({ value: g.id, label: g.name })) },
            ],
          },
          {
            title: 'Assessment', description: 'Applies to every exam group unless overridden.', cols: 3,
            fields: [
              { id: 'maxMarks', label: 'Max marks', type: 'number', required: true, validate: [validators.required, validators.number] },
              { id: 'passMarks', label: 'Pass marks', type: 'number', required: true, validate: [validators.required, validators.number] },
              { id: 'practicalMarks', label: 'Practical marks', type: 'number', value: 30 },
              { id: 'practical', label: 'Practical', type: 'switch', switchLabel: 'This subject has a practical component', span: 'full' },
              { id: 'board', label: 'Counts for board result', type: 'switch', switchLabel: 'Include in board aggregate', span: 'full' },
            ],
          },
        ],
        onSubmit: fakeSave('Subject'),
      });

      mount.appendChild(listPage({
        title: 'Subjects',
        subtitle: `${base.length} subjects · ${formatNumber(base.reduce((a, r) => a + r.weeklyPeriods, 0))} weekly periods at ${campusName(campusId)}`,
        route: 'academics/subjects',
        actions: editable ? [
          Button('Subject groups', { variant: 'secondary', icon: 'layers', route: 'academics/subject-groups' }),
          Button('Add subject', { variant: 'primary', icon: 'plus', onClick: () => openForm(null) }),
        ] : [Button('Subject groups', { variant: 'secondary', icon: 'layers', route: 'academics/subject-groups' })],
        kpis: [
          { label: 'Subjects', value: base.length, icon: 'book', tone: 'brand' },
          { label: 'With practicals', value: base.filter((r) => r.hasPractical).length, icon: 'flask', tone: 'info' },
          { label: 'Weekly periods', value: formatNumber(base.reduce((a, r) => a + r.weeklyPeriods, 0)), icon: 'clock', tone: 'success' },
          { label: 'Subject groups', value: db.subjectGroups.length, icon: 'layers', tone: 'warning', route: 'academics/subject-groups' },
        ],
        chart: barChart({
          categories: sortBy(base.filter((r) => r.weeklyPeriods), 'weeklyPeriods', 'desc').slice(0, 12).map((r) => r.name),
          series: [{ name: 'Weekly periods', values: sortBy(base.filter((r) => r.weeklyPeriods), 'weeklyPeriods', 'desc').slice(0, 12).map((r) => r.weeklyPeriods) }],
          horizontal: true, showValues: true, height: 300,
        }),
        chartTitle: 'Weekly period load by subject (top 12)',
        columns: [
          {
            key: 'name', label: 'Subject', sticky: true, width: 230,
            render: (r) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, subjectSwatch(r.code), Identity(r.name, `${r.code} · ${r.type}`)),
            value: (r) => r.name,
          },
          { key: 'code', label: 'Code', width: 80, className: 't-mono' },
          { key: 'type', label: 'Type', width: 130, filter: true, render: (r) => Badge(r.type, { tone: r.type === 'Core' ? 'brand' : r.type === 'Elective' ? 'info' : 'neutral' }) },
          { key: 'levels', label: 'Class levels', width: 120, align: 'center' },
          { key: 'groups', label: 'Groups', width: 90, align: 'right', numeric: true },
          { key: 'hasPractical', label: 'Practical', width: 110, align: 'center', filter: true, render: (r) => (r.hasPractical ? Badge('Yes', { tone: 'success' }) : h('span', { className: 't-faint' }, 'No')), value: (r) => (r.hasPractical ? 'Yes' : 'No') },
          { key: 'maxMarks', label: 'Max', width: 80, align: 'right', numeric: true },
          { key: 'passMarks', label: 'Pass', width: 80, align: 'right', numeric: true },
          { key: 'classes', label: 'Classes', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'teachers', label: 'Teachers', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'weeklyPeriods', label: 'Periods/wk', width: 120, align: 'right', numeric: true, aggregate: 'sum', render: (r) => formatNumber(r.weeklyPeriods) },
          {
            key: 'avgScore', label: 'Avg score', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round1(v)}%`,
            render: (r) => (r.avgScore ? h('span', { className: 't-num' }, `${r.avgScore}%`) : h('span', { className: 't-faint' }, '—')),
          },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: base,
        selectable: true,
        footerAggregates: true,
        searchKeys: ['name', 'code', 'type'],
        pageSize: 25,
        exportName: 'subjects',
        bulkActions: [
          { label: 'Add to subject group', icon: 'layers', onClick: (sel) => toast('Subject group updated', `${sel.length} subjects added.`) },
          { label: 'Set max marks', icon: 'percent', onClick: (sel) => toast('Marks updated', `${sel.length} subjects set to 100 marks.`) },
        ],
        expandable: (r) => h('div', { className: 'stack-3' },
          DescriptionList([
            ['Subject code', r.code], ['Type', r.type],
            ['Practical', r.hasPractical ? 'Yes' : 'No'], ['Max / pass marks', `${r.maxMarks} / ${r.passMarks}`],
            ['Groups', db.subjectGroups.filter((g) => g.subjects.includes(r.code)).map((g) => g.name).join(', ') || '—'],
            ['Weekly periods', formatNumber(r.weeklyPeriods)],
          ], { cols: 2 }),
          r.teacherIds.length ? h('div', null,
            h('div', { className: 't-eyebrow mb-2' }, 'Teachers delivering this subject'),
            h('div', { className: 'chip-row' }, r.teacherIds.slice(0, 12).map((id) => {
              const t = db.staff.find((x) => x.id === id);
              return t ? h('button', {
                className: 'tt-chip', type: 'button',
                onClick: () => navigate('teachers/profile/' + t.id),
              }, Avatar(t.name, { size: 'xs' }), t.name) : null;
            }).filter(Boolean)))
            : EmptyState({ icon: 'presentation', title: 'Not scheduled yet', text: 'This subject has no periods on the current timetable.' })),
        rowActions: (r) => [
          { label: 'Curriculum', icon: 'scroll', route: 'academics/curriculum' },
          { label: 'Learning outcomes', icon: 'target', route: 'academics/learning-outcomes' },
          { label: 'Subject allocation', icon: 'book-open', route: 'teachers/subject-allocation' },
          { separator: true },
          editable && { label: 'Edit subject', icon: 'edit', onClick: () => openForm(r) },
          editable && {
            label: 'Retire subject', icon: 'archive', tone: 'danger',
            onClick: () => confirmThen({
              title: `Retire ${r.name}?`, text: `${r.weeklyPeriods} timetable periods reference this subject.`,
              confirmLabel: 'Retire', tone: 'danger', icon: 'archive',
            }, () => toast('Subject retired', r.name, 'warning')),
          },
        ].filter(Boolean),
        emptyState: EmptyState({ icon: 'book', title: 'No subjects', text: 'Add the first subject to build class curricula.' }),
      }));
    },
  },

  /* ---------------------------------------- academics/subject-groups --- */
  'academics/subject-groups': {
    title: 'Subject Groups',
    subtitle: 'Bundle subjects into the packages each class level studies',
    section: 'academics',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const groups = db.subjectGroups.map((g) => ({
        ...g,
        classes: db.classes.filter((c) => c.campusId === campusId && g.levels.includes(c.level)),
      }));
      const editable = canEdit();
      const host = h('div', { className: 'stack' });

      /** The group builder: pick subjects with live period-count feedback. */
      const openBuilder = (g) => {
        const chosen = new Set(g ? g.subjects : ['ENG', 'MAT']);
        const levels = new Set(g ? g.levels : []);
        const summary = h('div', { className: 'stack-2' });
        const chipHost = h('div', { className: 'tt-palette' });

        const repaint = () => {
          chipHost.innerHTML = '';
          for (const s of db.subjects) {
            const on = chosen.has(s.code);
            chipHost.appendChild(h('button', {
              className: 'tt-chip', type: 'button',
              dataset: { active: String(on) },
              attrs: { 'aria-pressed': String(on) },
              onClick: () => { if (on) chosen.delete(s.code); else chosen.add(s.code); repaint(); },
            }, subjectSwatch(s.code), h('span', null, s.name),
              h('span', { className: 'tt-chip-meta' }, s.code),
              on ? Icon('check', 13) : Icon('plus', 13)));
          }
          const codes = Array.from(chosen);
          const core = codes.filter((c) => subjectMeta(c).type === 'Core').length;
          const lang = codes.filter((c) => subjectMeta(c).type === 'Language').length;
          const prac = codes.filter((c) => subjectMeta(c).hasPractical).length;
          summary.innerHTML = '';
          summary.appendChild(h('div', { className: 'grid grid-4' },
            MetricRow('Subjects', String(codes.length)),
            MetricRow('Core', String(core)),
            MetricRow('Languages', String(lang)),
            MetricRow('With practicals', String(prac))));
          summary.appendChild(stackedProgressBar({
            segments: ['Core', 'Language', 'Elective', 'Skill', 'Co-curricular'].map((t, i) => ({
              label: t, value: codes.filter((c) => subjectMeta(c).type === t).length, color: seriesColor(i),
            })).filter((s) => s.value),
            barHeight: 12, showLegend: true,
          }));
          summary.appendChild(codes.length > 10
            ? Callout({ tone: 'warning', icon: 'alert-triangle' }, `${codes.length} subjects is above the CBSE recommendation of 8–10 for a single level.`)
            : h('div', { className: 't-xs t-muted' }, 'CBSE recommends 8–10 subjects per level including co-curricular.'));
        };
        repaint();

        Drawer({
          title: g ? `Edit ${g.name}` : 'New subject group',
          subtitle: 'Tap a subject to add or remove it from the package',
          size: 'xl',
          body: h('div', { className: 'stack-3' },
            FormGrid({ cols: 2 },
              Field({ label: 'Group name', required: true }, Input({ value: g ? g.name : '', placeholder: 'Senior — Science' })),
              Field({ label: 'Applies to class levels', hint: 'Nursery = 0 … Class XII = 14' },
                MultiSelect({
                  options: db.classes.filter((c) => c.campusId === campusId).map((c) => ({ value: String(c.level), label: c.name })),
                  values: Array.from(levels).map(String),
                  placeholder: 'Select class levels…',
                }))),
            SectionCard({ title: 'Subjects in this group', icon: 'book', subtitle: 'Click to toggle' }, chipHost),
            SectionCard({ title: 'Package summary', icon: 'gauge' }, summary)),
          actions: (close) => frag(
            Button('Cancel', { variant: 'ghost', onClick: close }),
            Button(g ? 'Save group' : 'Create group', {
              variant: 'primary', icon: 'check',
              onClick: () => {
                if (!chosen.size) { toast('Add a subject', 'A group needs at least one subject.', 'warning'); return; }
                close();
                toast('Subject group saved', `${chosen.size} subjects in the package.`);
              },
            })),
        });
      };

      const groupCard = (g) => SectionCard({
        title: g.name,
        subtitle: `${g.subjects.length} subjects · ${g.classes.length} classes at ${campusName(campusId)}`,
        icon: 'layers',
        actions: editable ? MenuButton([
          { label: 'Edit group', icon: 'edit', onClick: () => openBuilder(g) },
          { label: 'Duplicate', icon: 'copy', onClick: () => toast('Group duplicated', `${g.name} (copy) created.`) },
          { separator: true },
          {
            label: 'Delete group', icon: 'trash', tone: 'danger',
            onClick: () => confirmThen({
              title: `Delete ${g.name}?`, text: `${g.classes.length} classes use this package.`,
              confirmLabel: 'Delete', tone: 'danger', icon: 'trash',
            }, () => toast('Group deleted', g.name, 'danger')),
          },
        ], { label: 'Group actions' }) : null,
      },
        h('div', { className: 'stack-3' },
          h('div', { className: 'tt-palette' }, g.subjects.map((c) => h('span', { className: 'tt-chip' },
            subjectSwatch(c), h('span', null, subjectName(c)),
            h('span', { className: 'tt-chip-meta' }, subjectMeta(c).type)))),
          h('div', null,
            h('div', { className: 't-eyebrow mb-2' }, 'Applies to'),
            g.classes.length
              ? h('div', { className: 'chip-row' }, g.classes.map((c) => h('button', {
                className: 'tt-chip', type: 'button', onClick: () => navigate('academics/curriculum/' + c.id),
              }, Icon('grid', 13), c.name)))
              : h('div', { className: 't-sm t-muted' }, 'No class at this campus uses this group.')),
          stackedProgressBar({
            segments: ['Core', 'Language', 'Elective', 'Skill', 'Co-curricular'].map((t, i) => ({
              label: t, value: g.subjects.filter((c) => subjectMeta(c).type === t).length, color: seriesColor(i),
            })).filter((s) => s.value),
            barHeight: 10, showLegend: true,
          })));

      host.appendChild(kpiRow([
        { label: 'Subject groups', value: groups.length, icon: 'layers', tone: 'brand' },
        { label: 'Subjects in use', value: new Set(groups.flatMap((g) => g.subjects)).size, icon: 'book', tone: 'info', route: 'academics/subjects' },
        { label: 'Class levels covered', value: new Set(groups.flatMap((g) => g.levels)).size, icon: 'grid', tone: 'success' },
        { label: 'Largest package', value: Math.max(...groups.map((g) => g.subjects.length)) + ' subjects', icon: 'gauge', tone: 'warning' },
      ]));
      host.appendChild(SectionCard({ title: 'Subjects per group', className: 'chart-card' },
        barChart({
          categories: groups.map((g) => g.name),
          series: [{ name: 'Subjects', values: groups.map((g) => g.subjects.length) }],
          horizontal: true, showValues: true, height: 260,
        })));
      host.appendChild(h('div', { className: 'widget-grid' },
        groups.map((g) => h('div', { className: 'span-6' }, groupCard(g)))));
      host.appendChild(SectionCard({ title: 'Coverage matrix', icon: 'table', subtitle: 'Which group carries which subject', flush: true },
        DataTable({
          columns: [
            { key: 'name', label: 'Subject', sticky: true, width: 190, render: (s) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, subjectSwatch(s.code), s.name), value: (s) => s.name },
            { key: 'type', label: 'Type', width: 120, filter: true },
            ...db.subjectGroups.map((g) => ({
              key: 'g_' + g.id, label: g.name, width: 150, align: 'center', sortable: false,
              render: (s) => (g.subjects.includes(s.code) ? Icon('check-circle', 15) : h('span', { className: 't-faint' }, '·')),
              value: (s) => (g.subjects.includes(s.code) ? 'Yes' : ''),
            })),
          ],
          rows: db.subjects, paginate: false, maxHeight: '60vh', exportName: 'subject-group-matrix',
        })));

      mount.appendChild(page({
        title: 'Subject Groups',
        subtitle: `${groups.length} packages mapping subjects to class levels`,
        route: 'academics/subject-groups',
        actions: editable ? [
          Button('Subjects', { variant: 'secondary', icon: 'book', route: 'academics/subjects' }),
          Button('New group', { variant: 'primary', icon: 'plus', onClick: () => openBuilder(null) }),
        ] : null,
        children: host,
      }));
    },
  },

  /* -------------------------------------------- academics/curriculum --- */
  'academics/curriculum': {
    title: 'Curriculum',
    subtitle: 'Unit-wise plan for every class and subject',
    section: 'academics',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const classes = classesFor(campusId).filter((c) => c.level >= 3);
      if (!classes.length) {
        mount.appendChild(page({
          title: 'Curriculum', route: 'academics/curriculum',
          children: Card({ pad: true }, EmptyState({
            icon: 'scroll', title: 'No classes at this campus',
            text: 'Add classes to the master before building a curriculum.',
            action: Button('Open class master', { variant: 'primary', icon: 'grid', route: 'academics/classes' }),
          })),
        }));
        return;
      }
      let cls = classes.find((c) => c.id === ctx.param) || classes.find((c) => c.level === 11) || classes[0];
      let code = subjectsForLevel(cls.level)[0];

      const body = h('div', { className: 'stack' });

      const paint = () => {
        body.innerHTML = '';
        const codes = cls.level >= 13
          ? Array.from(new Set(['Science', 'Commerce', 'Humanities'].flatMap((st) => subjectsForLevel(cls.level, st))))
          : subjectsForLevel(cls.level);
        if (!codes.includes(code)) code = codes[0];
        const units = curriculumUnits(cls.id, code);
        const teacher = teacherForClassSubject(cls.id, code, campusId);
        const planned = units.reduce((a, u) => a + u.periodsPlanned, 0);
        const taken = units.reduce((a, u) => a + u.periodsTaken, 0);
        const behind = units.filter((u) => u.delayDays > 0);

        body.appendChild(filterCard([
          { id: 'class', label: 'Class', type: 'select', value: cls.id, allLabel: '— choose a class —', width: '180px', options: classes.map((c) => ({ value: c.id, label: c.name })) },
          { id: 'subject', label: 'Subject', type: 'select', value: code, allLabel: '— choose a subject —', width: '200px', options: codes.map((c) => ({ value: c, label: subjectName(c) })) },
          { id: 'term', label: 'Term', type: 'segment', options: [{ id: 'all', label: 'Both terms' }, { id: 'Term 1', label: 'Term 1' }, { id: 'Term 2', label: 'Term 2' }] },
        ], (id, value, all) => {
          if (id === 'class' && value && value !== 'all') { cls = classes.find((c) => c.id === value) || cls; paint(); return; }
          if (id === 'subject' && value && value !== 'all') { code = value; paint(); return; }
          if (id === 'term') { termFilter = value === 'all' ? null : value; renderUnits(); }
        }, h('div', { className: 'row' },
          Button('Syllabus tracker', { variant: 'ghost', size: 'sm', icon: 'clipboard-list', route: 'academics/syllabus-tracker' }),
          Button('Learning outcomes', { variant: 'ghost', size: 'sm', icon: 'target', route: 'academics/learning-outcomes' }))));

        body.appendChild(kpiRow([
          { label: 'Units planned', value: units.length, icon: 'layers', tone: 'brand', footer: `${units.filter((u) => u.term === 'Term 1').length} in Term 1` },
          { label: 'Periods planned', value: formatNumber(planned), icon: 'clock', tone: 'info', footer: `${formatNumber(taken)} delivered` },
          { label: 'Syllabus complete', value: `${planned ? Math.round((taken / planned) * 100) : 0}%`, icon: 'gauge', tone: 'success' },
          { label: 'Units behind plan', value: behind.length, icon: 'alert-triangle', tone: behind.length ? 'danger' : 'success', footer: behind.length ? `${behind[0].title.slice(0, 26)}…` : 'On schedule' },
        ]));

        body.appendChild(h('div', { className: 'widget-grid' },
          h('div', { className: 'span-8' }, SectionCard({
            title: `${subjectName(code)} — ${cls.name}`,
            subtitle: teacher ? `Taught by ${teacher.name}` : 'No teacher mapped yet',
            icon: 'scroll',
            actions: h('div', { className: 'row' },
              Button('Print scheme of work', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(body, `${cls.name} · ${subjectName(code)}`) }),
              canEdit() ? Button('Add unit', { variant: 'secondary', size: 'sm', icon: 'plus', onClick: () => openUnitForm(null) }) : null),
          }, unitsHost)),
          h('div', { className: 'span-4' }, h('div', { className: 'stack-3' },
            SectionCard({ title: 'Term progress', className: 'chart-card', icon: 'chart-bar' },
              barChart({
                categories: ['Term 1', 'Term 2'],
                series: [
                  { name: 'Delivered', values: ['Term 1', 'Term 2'].map((t) => units.filter((u) => u.term === t).reduce((a, u) => a + u.periodsTaken, 0)) },
                  { name: 'Planned', values: ['Term 1', 'Term 2'].map((t) => units.filter((u) => u.term === t).reduce((a, u) => a + u.periodsPlanned, 0)) },
                ],
                height: 200,
              })),
            SectionCard({ title: 'Bloom coverage', className: 'chart-card', icon: 'target' },
              donutChart({
                data: BLOOM.map((b) => ({ key: b, value: units.filter((u) => u.bloom === b).length })).filter((d) => d.value),
                height: 210, centerValue: String(units.length), centerLabel: 'Units',
              })),
            SectionCard({ title: 'Subject switcher', icon: 'book' },
              h('div', { className: 'tt-palette' }, codes.map((c) => h('button', {
                className: 'tt-chip', type: 'button', dataset: { active: String(c === code) },
                onClick: () => { code = c; paint(); },
              }, subjectSwatch(c), subjectName(c)))))))));

        body.appendChild(SectionCard({ title: 'Delivery timeline', icon: 'map', subtitle: 'Planned window for each unit across the session' },
          ganttChart(units.map((u) => ({
            label: `U${u.unitNo} · ${u.title}`,
            from: u.startDate, to: u.endDate,
            color: u.delayDays > 0 ? 'var(--chart-critical)' : u.status === 'Completed' ? 'var(--chart-good)' : subjectColor(code),
            badge: `${u.completion}%`,
          })), { title: `${cls.name} ${subjectName(code)} delivery plan` })));

        renderUnits();
      };

      let termFilter = null;
      const unitsHost = h('div');
      function renderUnits() {
        const units = curriculumUnits(cls.id, code).filter((u) => !termFilter || u.term === termFilter);
        unitsHost.innerHTML = '';
        unitsHost.appendChild(DataTable({
          columns: [
            { key: 'unitNo', label: '#', width: 60, align: 'center', numeric: true },
            { key: 'title', label: 'Unit / chapter', sticky: true, width: 280, render: (u) => Identity(u.title, `${u.term} · ${u.bloom}`), value: (u) => u.title },
            { key: 'periodsPlanned', label: 'Planned', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
            { key: 'periodsTaken', label: 'Taken', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
            {
              key: 'completion', label: 'Completion', width: 180, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v)}%`,
              render: (u) => h('div', { className: 'stack-1' },
                h('span', { className: 't-xs t-num' }, `${u.completion}%`),
                ProgressBar(u.completion, { max: 100, size: 'sm', tone: u.delayDays > 0 ? 'danger' : u.completion >= 96 ? 'success' : 'brand' })),
            },
            { key: 'startDate', label: 'From', width: 120, render: (u) => formatDate(u.startDate, 'dayMonth'), value: (u) => u.startDate },
            { key: 'endDate', label: 'To', width: 120, render: (u) => formatDate(u.endDate, 'dayMonth'), value: (u) => u.endDate },
            { key: 'assessment', label: 'Assessment', width: 150, filter: true },
            { key: 'resources', label: 'Resources', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
            {
              key: 'status', label: 'Status', width: 140, filter: true,
              render: (u) => (u.delayDays > 0 ? Badge(`${u.delayDays}d behind`, { tone: 'danger', icon: 'alert-triangle' }) : Badge(u.status)),
              value: (u) => u.status,
            },
          ],
          rows: units, paginate: false, footerAggregates: true, maxHeight: 'none',
          exportName: `curriculum-${cls.code}-${code}`,
          rowActions: (u) => [
            { label: 'Learning outcomes', icon: 'target', route: 'academics/learning-outcomes' },
            { label: 'Lesson plans', icon: 'clipboard-list', route: 'teachers/lesson-plans' },
            { separator: true },
            canEdit() && { label: 'Edit unit', icon: 'edit', onClick: () => openUnitForm(u) },
            canEdit() && { label: 'Mark complete', icon: 'check-circle', onClick: () => toast('Unit marked complete', u.title) },
          ].filter(Boolean),
          onRowClick: (u) => openUnitDrawer(u),
          emptyState: EmptyState({ icon: 'scroll', title: 'No units in this term', text: 'Switch the term filter or add a unit to the scheme of work.' }),
        }));
      }

      function openUnitDrawer(u) {
        const los = learningOutcomes(cls.id, code).filter((l) => l.unit === u.title);
        Drawer({
          title: u.title, subtitle: `${cls.name} · ${subjectName(code)} · Unit ${u.unitNo}`, size: 'lg',
          body: h('div', { className: 'stack-3' },
            h('div', { className: 'row-3 row-wrap' }, Badge(u.term), Badge(u.bloom, { tone: 'info' }), Badge(u.status),
              u.delayDays > 0 ? Badge(`${u.delayDays} days behind`, { tone: 'danger' }) : null),
            DescriptionList([
              ['Periods planned', String(u.periodsPlanned)], ['Periods delivered', String(u.periodsTaken)],
              ['Window', `${formatDate(u.startDate)} – ${formatDate(u.endDate)}`], ['Assessment', u.assessment],
              ['Resources linked', String(u.resources)], ['Completion', `${u.completion}%`],
            ], { cols: 2 }),
            ProgressBar(u.completion, { max: 100, label: 'Chapter completion', showValue: true, tone: u.delayDays ? 'danger' : 'success' }),
            SectionCard({ title: 'Learning outcomes', icon: 'target', subtitle: `${los.length} mapped` },
              los.length ? h('div', { className: 'stack-2' }, los.map((l) => h('div', { className: 'mini-kv' },
                h('span', null, h('span', { className: 't-mono t-xs t-muted' }, l.code + ' '), l.statement),
                h('span', { className: 'mini-kv-v' }, `${l.mastery}%`))))
                : EmptyState({ icon: 'target', title: 'No outcomes mapped', text: 'Map learning outcomes to measure mastery for this unit.' }))),
          actions: (close) => frag(
            Button('Close', { variant: 'ghost', onClick: close }),
            Button('Open lesson plans', { variant: 'primary', icon: 'clipboard-list', onClick: () => { close(); navigate('teachers/lesson-plans'); } })),
        });
      }

      function openUnitForm(u) {
        formPage({
          title: u ? `Edit unit ${u.unitNo}` : 'Add unit',
          subtitle: `${cls.name} · ${subjectName(code)}`,
          mode: 'modal', size: 'lg', submitLabel: u ? 'Save unit' : 'Add unit',
          values: u ? { title: u.title, term: u.term, periods: u.periodsPlanned, from: u.startDate, to: u.endDate, assessment: u.assessment, bloom: u.bloom } : { term: 'Term 1', periods: 10 },
          sections: [
            {
              title: 'Unit', cols: 2, fields: [
                { id: 'title', label: 'Unit / chapter title', required: true, span: 'full', validate: validators.required },
                { id: 'term', label: 'Term', type: 'select', options: ['Term 1', 'Term 2'], required: true },
                { id: 'periods', label: 'Periods planned', type: 'number', required: true, validate: [validators.required, validators.min(1)] },
                { id: 'from', label: 'Start date', type: 'date', required: true },
                { id: 'to', label: 'End date', type: 'date', required: true },
              ],
            },
            {
              title: 'Pedagogy', cols: 2, fields: [
                { id: 'bloom', label: 'Primary Bloom level', type: 'select', options: BLOOM },
                { id: 'assessment', label: 'Assessment mode', type: 'select', options: ['Class Test', 'Worksheet', 'Project', 'Oral Assessment', 'Lab Activity', 'Portfolio'] },
                { id: 'outcomes', label: 'Learning outcomes', type: 'textarea', span: 'full', placeholder: 'One outcome per line…' },
                { id: 'resources', label: 'Reference material', type: 'file', span: 'full' },
              ],
            },
          ],
          onSubmit: fakeSave('Unit'),
        });
      }

      paint();
      mount.appendChild(page({
        title: 'Curriculum',
        subtitle: `Scheme of work · ${campusName(campusId)} · session ${db.academicYears.find((y) => y.current).name}`,
        route: 'academics/curriculum',
        actions: canEdit() ? [
          Button('Import from board', { variant: 'secondary', icon: 'upload', onClick: mockAction('Import CBSE curriculum') }),
          Button('Publish curriculum', { variant: 'primary', icon: 'send', onClick: () => confirmThen({ title: 'Publish curriculum?', text: 'Teachers and parents will see the updated scheme of work.', confirmLabel: 'Publish', icon: 'send' }, () => toast('Curriculum published', 'Visible on the teacher and parent portals.')) }),
        ] : null,
        children: body,
      }));
    },
  },

  /* -------------------------------------- academics/syllabus-tracker --- */
  'academics/syllabus-tracker': {
    title: 'Syllabus Tracker',
    subtitle: 'Chapter completion across every class and subject',
    section: 'academics',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const base = syllabusRows(campusId);
      const behind = base.filter((r) => r.status === 'Behind Schedule');
      const avgDone = base.length ? Math.round(base.reduce((a, r) => a + r.completion, 0) / base.length) : 0;
      const byStage = Array.from(new Set(base.map((r) => r.stage)));

      const openDrawer = (row) => {
        const units = curriculumUnits(row.classId, row.subjectCode);
        Drawer({
          title: `${row.className} · ${row.subjectName}`,
          subtitle: `${row.teacherName} · ${row.completion}% of the syllabus delivered`,
          size: 'xl',
          body: h('div', { className: 'stack-3' },
            kpiRow([
              { label: 'Units', value: row.units, icon: 'layers', tone: 'brand' },
              { label: 'Completed', value: row.unitsDone, icon: 'check-circle', tone: 'success' },
              { label: 'In progress', value: row.unitsInProgress, icon: 'clock', tone: 'warning' },
              { label: 'Behind plan', value: row.unitsBehind, icon: 'alert-triangle', tone: row.unitsBehind ? 'danger' : 'success' },
            ]),
            ProgressBar(row.completion, { max: 100, label: 'Periods delivered against plan', showValue: true, tone: row.completion < 40 ? 'danger' : row.completion < 70 ? 'warning' : 'success' }),
            DataTable({
              columns: [
                { key: 'unitNo', label: '#', width: 54, align: 'center', numeric: true },
                { key: 'title', label: 'Chapter', width: 260 },
                { key: 'term', label: 'Term', width: 90, filter: true },
                { key: 'periodsTaken', label: 'Taken', width: 80, align: 'right', numeric: true },
                { key: 'periodsPlanned', label: 'Planned', width: 90, align: 'right', numeric: true },
                {
                  key: 'completion', label: 'Progress', width: 160,
                  render: (u) => ProgressBar(u.completion, { max: 100, size: 'sm', showValue: true, tone: u.delayDays ? 'danger' : 'success' }),
                  value: (u) => u.completion,
                },
                { key: 'status', label: 'Status', width: 130, render: (u) => Badge(u.delayDays ? 'Behind' : u.status) },
              ],
              rows: units, paginate: false, searchable: false, maxHeight: '46vh', exportable: false, columnToggle: false,
            })),
          actions: (close) => frag(
            Button('Close', { variant: 'ghost', onClick: close }),
            Button('Nudge teacher', { variant: 'secondary', icon: 'send', onClick: () => { close(); toast('Reminder sent', `${row.teacherName} notified about ${row.subjectName}.`); } }),
            Button('Open curriculum', { variant: 'primary', icon: 'scroll', onClick: () => { close(); navigate('academics/curriculum/' + row.classId); } })),
        });
      };

      mount.appendChild(listPage({
        title: 'Syllabus Tracker',
        subtitle: `${base.length} class-subject plans · ${avgDone}% average completion at ${campusName(campusId)}`,
        route: 'academics/syllabus-tracker',
        actions: [
          Button('Curriculum', { variant: 'secondary', icon: 'scroll', route: 'academics/curriculum' }),
          Button('Nudge teachers behind plan', {
            variant: 'primary', icon: 'send',
            onClick: () => confirmThen({
              title: `Notify ${behind.length} teachers?`,
              text: 'A reminder with the pending chapter list goes to each teacher on the portal and by email.',
              confirmLabel: 'Send reminders', icon: 'send',
            }, () => toast('Reminders sent', `${behind.length} teachers notified.`)),
          }),
        ],
        kpis: [
          { label: 'Average completion', value: `${avgDone}%`, icon: 'gauge', tone: avgDone > 60 ? 'success' : 'warning', delta: 2.8, deltaLabel: 'vs last month' },
          { label: 'Plans on track', value: base.filter((r) => r.status !== 'Behind Schedule').length, icon: 'check-circle', tone: 'success' },
          { label: 'Behind schedule', value: behind.length, icon: 'alert-triangle', tone: 'danger', footer: `${new Set(behind.map((r) => r.teacherId)).size} teachers involved` },
          { label: 'Periods delivered', value: formatNumber(base.reduce((a, r) => a + r.periodsTaken, 0)), icon: 'clock', tone: 'info' },
        ],
        chart: barChart({
          categories: byStage,
          series: [{ name: 'Average completion', values: byStage.map((st) => Math.round(base.filter((r) => r.stage === st).reduce((a, r) => a + r.completion, 0) / Math.max(1, base.filter((r) => r.stage === st).length))) }],
          valueFormat: 'percent0', showValues: true, target: 65, targetLabel: 'Expected by 20 Aug', height: 240,
        }),
        chartTitle: 'Syllabus completion by stage',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Class, subject or teacher…', width: '240px' },
          { id: 'stage', label: 'Stage', options: byStage },
          { id: 'subject', label: 'Subject', options: Array.from(new Set(base.map((r) => r.subjectName))).sort() },
          { id: 'status', label: 'Status', options: ['In Progress', 'Behind Schedule', 'Completed'] },
        ],
        onFilter: (id, value, all, table) => {
          let out = base.slice();
          if (all.q) out = search(out, all.q, ['className', 'subjectName', 'teacherName']);
          if (all.stage && all.stage !== 'all') out = out.filter((r) => r.stage === all.stage);
          if (all.subject && all.subject !== 'all') out = out.filter((r) => r.subjectName === all.subject);
          if (all.status && all.status !== 'all') out = out.filter((r) => r.status === all.status);
          table.refresh(out);
        },
        columns: [
          { key: 'className', label: 'Class', sticky: true, width: 150, render: (r) => Identity(r.className, r.stage), value: (r) => r.classLevel },
          {
            key: 'subjectName', label: 'Subject', width: 190, filter: true,
            render: (r) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, subjectSwatch(r.subjectCode), r.subjectName),
            value: (r) => r.subjectName,
          },
          {
            key: 'teacherName', label: 'Teacher', width: 210,
            render: (r) => (r.teacherId ? Identity(r.teacherName, 'Subject teacher', { onClick: () => navigate('teachers/profile/' + r.teacherId) }) : h('span', { className: 't-faint' }, 'Unassigned')),
            value: (r) => r.teacherName,
          },
          { key: 'units', label: 'Units', width: 80, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'unitsDone', label: 'Done', width: 80, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'unitsBehind', label: 'Behind', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'periodsTaken', label: 'Periods taken', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'periodsPlanned', label: 'Planned', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          {
            key: 'completion', label: 'Completion', width: 190, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v)}%`,
            render: (r) => h('div', { className: 'stack-1' },
              h('span', { className: 't-xs t-num' }, `${r.completion}%`),
              ProgressBar(r.completion, { max: 100, size: 'sm', tone: r.completion < 40 ? 'danger' : r.completion < 70 ? 'warning' : 'success' })),
          },
          { key: 'status', label: 'Status', width: 160, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: base,
        selectable: true,
        footerAggregates: true,
        searchKeys: ['className', 'subjectName', 'teacherName'],
        pageSize: 50,
        exportName: 'syllabus-tracker',
        bulkActions: [
          { label: 'Send reminder', icon: 'send', onClick: (sel) => toast('Reminders sent', `${sel.length} teachers notified.`) },
          { label: 'Flag for review', icon: 'flag', onClick: (sel) => toast('Flagged', `${sel.length} plans queued for academic review.`, 'warning') },
        ],
        rowActions: (r) => [
          { label: 'Chapter breakdown', icon: 'list', onClick: () => openDrawer(r) },
          { label: 'Open curriculum', icon: 'scroll', route: 'academics/curriculum/' + r.classId },
          { label: 'Teacher profile', icon: 'id-card', route: r.teacherId ? 'teachers/profile/' + r.teacherId : 'teachers/directory' },
        ],
        onRowClick: openDrawer,
        emptyState: EmptyState({ icon: 'clipboard-list', title: 'No plans match', text: 'Clear a filter to see the full tracker.' }),
      }));
    },
  },

  /* ------------------------------------ academics/learning-outcomes --- */
  'academics/learning-outcomes': {
    title: 'Learning Outcomes',
    subtitle: 'NCERT-aligned outcomes with measured mastery',
    section: 'academics',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const classes = classesFor(campusId).filter((c) => c.level >= 8);
      const rows = [];
      for (const c of classes) {
        for (const code of subjectsForLevel(c.level).slice(0, 5)) rows.push(...learningOutcomes(c.id, code));
      }
      const secure = rows.filter((r) => r.band === 'Secure').length;
      const needs = rows.filter((r) => r.band === 'Needs Support');
      const bloomCounts = BLOOM.map((b) => ({ key: b, value: rows.filter((r) => r.bloom === b).length }));
      const subjectNames = Array.from(new Set(rows.map((r) => r.subjectName))).sort();

      const matrixRows = Array.from(new Set(rows.map((r) => r.className)));
      const matrixCols = subjectNames.slice(0, 6);
      const matrixValues = matrixRows.map((cn) => matrixCols.map((sn) => {
        const cell = rows.filter((r) => r.className === cn && r.subjectName === sn);
        return cell.length ? round1(cell.reduce((a, r) => a + r.mastery, 0) / cell.length) : 0;
      }));

      mount.appendChild(listPage({
        title: 'Learning Outcomes',
        subtitle: `${formatNumber(rows.length)} outcomes mapped across ${classes.length} classes at ${campusName(campusId)}`,
        route: 'academics/learning-outcomes',
        actions: canEdit() ? [
          Button('Import NCERT set', { variant: 'secondary', icon: 'upload', onClick: mockAction('Import NCERT outcome set') }),
          Button('Add outcome', {
            variant: 'primary', icon: 'plus',
            onClick: () => formPage({
              title: 'Add learning outcome', mode: 'modal', size: 'lg', submitLabel: 'Add outcome',
              sections: [{
                title: 'Outcome', cols: 2, fields: [
                  { id: 'class', label: 'Class', type: 'select', required: true, options: classes.map((c) => c.name), validate: validators.required },
                  { id: 'subject', label: 'Subject', type: 'select', required: true, options: subjectNames, validate: validators.required },
                  { id: 'code', label: 'Outcome code', placeholder: 'MAT11.4' },
                  { id: 'bloom', label: 'Bloom level', type: 'select', options: BLOOM },
                  { id: 'strand', label: 'Strand', type: 'select', options: ['Knowledge', 'Skill', 'Application', 'Attitude & Values'] },
                  { id: 'periods', label: 'Periods', type: 'number', value: 8 },
                  { id: 'statement', label: 'Outcome statement', type: 'textarea', span: 'full', required: true, validate: validators.required },
                ],
              }],
              onSubmit: fakeSave('Learning outcome'),
            }),
          }),
        ] : null,
        kpis: [
          { label: 'Outcomes mapped', value: formatNumber(rows.length), icon: 'target', tone: 'brand' },
          { label: 'Secure (≥80%)', value: formatNumber(secure), icon: 'check-circle', tone: 'success', footer: `${Math.round((secure / Math.max(1, rows.length)) * 100)}% of all outcomes` },
          { label: 'Needs support', value: formatNumber(needs.length), icon: 'alert-circle', tone: 'danger', footer: 'Below 60% mastery' },
          { label: 'Average mastery', value: `${Math.round(rows.reduce((a, r) => a + r.mastery, 0) / Math.max(1, rows.length))}%`, icon: 'gauge', tone: 'info' },
        ],
        chart: h('div', { className: 'stack-3' },
          heatmap({ mode: 'matrix', rows: matrixRows, cols: matrixCols, values: matrixValues, min: 40, max: 100, cellSize: 42, title: 'Mastery by class and subject' }),
          ScaleLegend(40, 100, { format: 'percent0' })),
        chartTitle: 'Mastery heatmap — class × subject',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Outcome code or statement…', width: '260px' },
          { id: 'className', label: 'Class', options: matrixRows },
          { id: 'subjectName', label: 'Subject', options: subjectNames },
          { id: 'bloom', label: 'Bloom level', options: BLOOM },
          { id: 'band', label: 'Mastery band', options: ['Secure', 'Developing', 'Needs Support'] },
        ],
        onFilter: (id, value, all, table) => {
          let out = rows.slice();
          if (all.q) out = search(out, all.q, ['code', 'statement', 'unit']);
          for (const k of ['className', 'subjectName', 'bloom', 'band']) {
            if (all[k] && all[k] !== 'all') out = out.filter((r) => r[k] === all[k]);
          }
          table.refresh(out);
        },
        columns: [
          { key: 'code', label: 'Code', sticky: true, width: 120, className: 't-mono', render: (r) => Badge(r.code, { tone: 'brand', outline: true }), value: (r) => r.code },
          { key: 'statement', label: 'Outcome statement', width: 420, render: (r) => h('span', { className: 't-clamp-2' }, r.statement) },
          { key: 'className', label: 'Class', width: 120, filter: true },
          {
            key: 'subjectName', label: 'Subject', width: 170, filter: true,
            render: (r) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, subjectSwatch(r.subjectCode), r.subjectName),
            value: (r) => r.subjectName,
          },
          { key: 'unit', label: 'Unit', width: 220, hidden: true },
          { key: 'bloom', label: 'Bloom', width: 120, filter: true, render: (r) => Badge(r.bloom, { tone: 'info', outline: true }) },
          { key: 'strand', label: 'Strand', width: 140, filter: true, hidden: true },
          { key: 'periods', label: 'Periods', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'assessedStudents', label: 'Assessed', width: 110, align: 'right', numeric: true, aggregate: 'sum', render: (r) => formatNumber(r.assessedStudents) },
          {
            key: 'mastery', label: 'Mastery', width: 180, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round1(v)}%`,
            render: (r) => h('div', { className: 'stack-1' },
              h('span', { className: 't-xs t-num' }, `${r.mastery}%`),
              ProgressBar(r.mastery, { max: 100, size: 'sm', tone: r.mastery >= 80 ? 'success' : r.mastery >= 60 ? 'warning' : 'danger' })),
          },
          { key: 'band', label: 'Band', width: 140, filter: true, render: (r) => Badge(r.band, { tone: r.band === 'Secure' ? 'success' : r.band === 'Developing' ? 'warning' : 'danger' }) },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        selectable: true,
        footerAggregates: true,
        searchKeys: ['code', 'statement', 'className', 'subjectName'],
        pageSize: 50,
        exportName: 'learning-outcomes',
        bulkActions: [
          { label: 'Plan remediation', icon: 'lightbulb', onClick: (sel) => toast('Remediation planned', `${sel.length} outcomes added to the intervention list.`) },
          { label: 'Export for board file', icon: 'download', onClick: (sel) => toast('Export ready', `${sel.length} outcomes exported.`) },
        ],
        expandable: (r) => h('div', { className: 'stack-3' },
          DescriptionList([
            ['Unit', r.unit], ['Linked assessment', r.linkedAssessment],
            ['Strand', r.strand], ['Bloom level', r.bloom],
            ['Students assessed', formatNumber(r.assessedStudents)], ['Mastery', `${r.mastery}% (${r.band})`],
          ], { cols: 2 }),
          r.band === 'Needs Support'
            ? Callout({ tone: 'danger', icon: 'alert-triangle', title: 'Intervention recommended' },
              `Fewer than 60% of learners are secure on ${r.code}. Schedule a re-teach block and a diagnostic worksheet before the next periodic test.`)
            : Callout({ tone: 'success', icon: 'check-circle', title: 'On track' },
              'Mastery is at or above the expected band for this point in the session.')),
        rowActions: (r) => [
          { label: 'Open curriculum', icon: 'scroll', route: 'academics/curriculum/' + r.classId },
          { label: 'Syllabus tracker', icon: 'clipboard-list', route: 'academics/syllabus-tracker' },
          { separator: true },
          { label: 'Plan remediation', icon: 'lightbulb', onClick: () => toast('Added to intervention plan', r.code) },
        ],
        notes: SectionCard({ title: 'Bloom taxonomy spread', className: 'chart-card', icon: 'target' },
          barChart({ categories: bloomCounts.map((b) => b.key), series: [{ name: 'Outcomes', values: bloomCounts.map((b) => b.value) }], showValues: true, height: 200 })),
        emptyState: EmptyState({ icon: 'target', title: 'No outcomes match', text: 'Adjust the filters to see mapped outcomes.' }),
      }));
    },
  },

  /* ---------------------------------------------- academics/calendar --- */
  'academics/calendar': {
    title: 'Academic Calendar',
    subtitle: 'Terms, exams, events and holidays in one month view',
    section: 'academics',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      let month = (ctx.query && ctx.query.month) || '2026-08';

      const holidayEvents = db.holidays
        .filter((hd) => hd.campusId === 'ALL' || hd.campusId === campusId)
        .flatMap((hd) => Array.from({ length: Math.min(hd.days, 8) }, (_, i) => ({
          date: addDays(hd.date, i), title: hd.days > 1 ? `${hd.name} (day ${i + 1})` : hd.name,
          tone: 'danger', meta: hd.type, kind: 'Holiday', badge: 'Holiday',
        })));
      const examEvents = db.examGroups.flatMap((g) => [
        { date: g.from, title: `${g.name} begins`, tone: 'warning', meta: `${g.term} · ${g.weightage}% weightage`, kind: 'Examination', badge: 'Exam' },
        { date: g.to, title: `${g.name} ends`, tone: 'warning', meta: g.term, kind: 'Examination', badge: 'Exam' },
      ]);
      const schoolEvents = db.events.map((e) => ({
        date: e.date, title: e.title, tone: 'info', meta: `${e.category} · ${e.venue}`, kind: 'Event', badge: e.category,
      }));
      const ptmEvents = db.ptmSchedules.map((p) => ({
        date: p.date, title: p.title, tone: 'brand', meta: `${p.from}–${p.to} · ${p.classes}`, kind: 'PTM', badge: 'PTM',
      }));
      const termEvents = [
        { date: '2026-04-01', title: 'Session 2026-27 begins', tone: 'success', meta: 'Term 1', kind: 'Term', badge: 'Term' },
        { date: '2026-09-30', title: 'Term 1 closes', tone: 'success', meta: 'Report cards issued 10 Oct', kind: 'Term', badge: 'Term' },
        { date: '2026-10-01', title: 'Term 2 begins', tone: 'success', meta: 'Term 2', kind: 'Term', badge: 'Term' },
        { date: '2027-03-31', title: 'Session closes', tone: 'success', meta: 'Promotion lists published', kind: 'Term', badge: 'Term' },
      ];
      const all = [...termEvents, ...holidayEvents, ...examEvents, ...schoolEvents, ...ptmEvents];
      let kinds = new Set(['Term', 'Holiday', 'Examination', 'Event', 'PTM']);
      const visible = () => all.filter((e) => kinds.has(e.kind));

      const host = h('div', { className: 'stack' });
      const calHost = h('div');

      const monthOf = (iso) => String(iso).slice(0, 7);
      const upcoming = sortBy(all.filter((e) => e.date >= TODAY), 'date', 'asc').slice(0, 10);

      const paint = () => {
        calHost.innerHTML = '';
        const evts = visible();
        const inMonth = evts.filter((e) => monthOf(e.date) === month);
        calHost.appendChild(Card({ pad: true },
          h('div', { className: 'row row-wrap mb-3', style: { gap: 'var(--sp-3)' } },
            SegmentedControl(
              ['2026-04', '2026-08', '2026-09', '2026-10', '2026-12', '2027-03'].map((m) => ({ id: m, label: formatDate(m + '-01', 'monthYear') })),
              (id) => { month = id; paint(); }, { active: month }),
            h('span', { className: 'spacer' }),
            h('span', { className: 't-sm t-muted' }, `${inMonth.length} entries this month`)),
          inMonth.length
            ? Calendar({
              month, events: evts, view: 'month', maxPerDay: 3,
              onSelectEvent: (e) => notify({ title: e.title, text: `${formatDate(e.date)} · ${e.meta || ''}`, tone: e.tone }),
              onSelectDate: (d) => {
                const list = evts.filter((e) => e.date === d);
                Drawer({
                  title: formatDate(d, 'long'), subtitle: `${list.length} calendar entries`, size: 'md',
                  body: list.length
                    ? Timeline(list.map((e) => ({ title: e.title, meta: e.kind, text: e.meta, icon: e.kind === 'Holiday' ? 'umbrella' : e.kind === 'Examination' ? 'file-text' : e.kind === 'PTM' ? 'handshake' : 'calendar-check', tone: e.tone })))
                    : EmptyState({ icon: 'calendar', title: 'A normal working day', text: 'No exams, events or holidays are scheduled.' }),
                });
              },
            })
            : EmptyState({
              icon: 'calendar', title: 'Nothing scheduled this month',
              text: 'Try another month, or switch on more entry types in the legend.',
            }),
          h('div', { className: 'mt-3' }, legendRow([
            { label: 'Term milestone', color: 'var(--success-500)' },
            { label: 'Holiday', color: 'var(--danger-500)' },
            { label: 'Examination', color: 'var(--warning-500)' },
            { label: 'School event', color: 'var(--info-500)' },
            { label: 'PTM', color: 'var(--brand-500)' },
          ]))));
      };

      host.appendChild(kpiRow([
        { label: 'Entries this session', value: formatNumber(all.length), icon: 'calendar-check', tone: 'brand' },
        { label: 'Holidays', value: db.holidays.reduce((a, hd) => a + hd.days, 0), icon: 'umbrella', tone: 'danger', footer: `${db.holidays.length} declared holidays` },
        { label: 'Exam windows', value: db.examGroups.length, icon: 'file-text', tone: 'warning', route: 'examination/schedule' },
        { label: 'Events planned', value: db.events.length, icon: 'trophy', tone: 'info', route: 'events/all' },
      ]));

      host.appendChild(filterCard([
        {
          id: 'kinds', label: 'Show', type: 'select', value: 'all', allLabel: 'Everything', width: '190px',
          options: [{ value: 'Term', label: 'Term milestones' }, { value: 'Holiday', label: 'Holidays' },
            { value: 'Examination', label: 'Examinations' }, { value: 'Event', label: 'School events' }, { value: 'PTM', label: 'PTM' }],
        },
        { id: 'campus', label: 'Campus', type: 'select', value: campusId, allLabel: 'All campuses', options: db.campuses.map((c) => ({ value: c.id, label: c.name })) },
      ], (id, value) => {
        if (id === 'kinds') {
          kinds = value === 'all' ? new Set(['Term', 'Holiday', 'Examination', 'Event', 'PTM']) : new Set([value]);
          paint();
        }
        if (id === 'campus') toast('Campus scope', 'Switch the campus from the top bar to change data everywhere.', 'info');
      }, h('div', { className: 'row' },
        Button('Annual planner', { variant: 'ghost', size: 'sm', icon: 'map', route: 'academics/annual-planner' }),
        Button('Print calendar', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(calHost, 'Academic calendar') }))));

      host.appendChild(h('div', { className: 'detail-split' },
        h('div', { className: 'stack' }, calHost),
        h('div', { className: 'stack-3' },
          SectionCard({ title: 'Next up', icon: 'clock', subtitle: 'From 20 Aug 2026' },
            Timeline(upcoming.map((e) => ({
              title: e.title, meta: `${formatDate(e.date)} · ${relativeTime(e.date)}`, text: e.meta,
              icon: e.kind === 'Holiday' ? 'umbrella' : e.kind === 'Examination' ? 'file-text' : e.kind === 'PTM' ? 'handshake' : 'calendar-check',
              tone: e.tone,
            })))),
          SectionCard({ title: 'Holiday list', icon: 'umbrella', subtitle: `${db.holidays.length} declared`, flush: true },
            DataTable({
              columns: [
                { key: 'name', label: 'Holiday', width: 170 },
                { key: 'date', label: 'Date', width: 120, render: (r) => formatDate(r.date, 'dayMonth'), value: (r) => r.date },
                { key: 'days', label: 'Days', width: 70, align: 'right', numeric: true },
                { key: 'type', label: 'Type', width: 110, render: (r) => Badge(r.type, { tone: 'neutral', outline: true }) },
              ],
              rows: db.holidays, paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: '360px',
            })),
          SectionCard({ title: 'Term structure', icon: 'layers' },
            Stepper([
              { label: 'Term 1', description: 'Apr – Sep', state: 'done' },
              { label: 'Term 2', description: 'Oct – Mar', state: 'current' },
              { label: 'Results', description: 'Mar 2027', state: 'todo' },
            ], { current: 1 })))));

      mount.appendChild(page({
        title: 'Academic Calendar',
        subtitle: `Session ${db.academicYears.find((y) => y.current).name} · ${campusName(campusId)}`,
        route: 'academics/calendar',
        actions: canEdit() ? [
          Button('Export ICS', { variant: 'secondary', icon: 'download', onClick: () => { download('academic-calendar.ics', 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR', 'text/calendar'); toast('Calendar exported', 'academic-calendar.ics downloaded.'); } }),
          Button('Add entry', {
            variant: 'primary', icon: 'calendar-plus',
            onClick: () => formPage({
              title: 'Add calendar entry', mode: 'modal', submitLabel: 'Add to calendar',
              sections: [{
                title: 'Entry', cols: 2, fields: [
                  { id: 'title', label: 'Title', required: true, span: 'full', validate: validators.required },
                  { id: 'kind', label: 'Type', type: 'select', required: true, options: ['Term milestone', 'Holiday', 'Examination', 'School event', 'PTM'] },
                  { id: 'audience', label: 'Audience', type: 'select', options: ['All', 'Students', 'Staff', 'Parents'] },
                  { id: 'from', label: 'From', type: 'date', required: true, validate: validators.required },
                  { id: 'to', label: 'To', type: 'date' },
                  { id: 'notes', label: 'Notes', type: 'textarea', span: 'full' },
                ],
              }],
              onSubmit: fakeSave('Calendar entry'),
            }),
          }),
        ] : null,
        children: host,
      }));
      paint();
    },
  },

  /* --------------------------------------- academics/annual-planner --- */
  'academics/annual-planner': {
    title: 'Annual Planner',
    subtitle: 'Gantt view of terms, exams, events and syllabus blocks',
    section: 'academics',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const host = h('div', { className: 'stack' });

      const termBars = [
        { label: 'Term 1 — teaching', from: '2026-04-01', to: '2026-09-30', color: 'var(--chart-1)', badge: 'Term 1' },
        { label: 'Term 2 — teaching', from: '2026-10-01', to: '2027-03-31', color: 'var(--chart-2)', badge: 'Term 2' },
        { label: 'Admissions window 2027-28', from: '2026-11-01', to: '2027-02-15', color: 'var(--chart-3)', badge: 'Admissions' },
        { label: 'Fee cycle — 4 instalments', from: '2026-04-01', to: '2027-01-31', color: 'var(--chart-4)', badge: 'Fees' },
        { label: 'Board practicals (XII)', from: '2027-01-05', to: '2027-02-10', color: 'var(--chart-5)', badge: 'Practicals' },
        { label: 'Staff appraisal cycle', from: '2026-08-01', to: '2026-12-15', color: 'var(--chart-6)', badge: 'Appraisal' },
      ];
      const examBars = db.examGroups.map((g, i) => ({
        label: `${g.name} (${g.weightage}%)`, from: g.from, to: g.to,
        color: g.status === 'Completed' ? 'var(--chart-good)' : g.status === 'Scheduled' ? 'var(--chart-warning)' : 'var(--chart-7)',
        badge: g.term,
      }));
      const eventBars = sortBy(db.events, 'date', 'asc').map((e, i) => ({
        label: e.title, from: e.date, to: addDays(e.date, 1), color: seriesColor(i % 8), badge: e.category,
      }));
      const holidayBars = db.holidays.map((hd) => ({
        label: `${hd.name} (${hd.days}d)`, from: hd.date, to: addDays(hd.date, hd.days), color: 'var(--chart-critical)', badge: hd.type,
      }));
      const syllabusBars = (() => {
        const cls = classesFor(campusId).find((c) => c.level === 12) || classesFor(campusId)[0];
        if (!cls) return [];
        return subjectsForLevel(cls.level).slice(0, 6).map((code) => {
          const units = curriculumUnits(cls.id, code);
          return {
            label: `${cls.name} · ${subjectName(code)}`,
            from: units[0].startDate, to: units[units.length - 1].endDate,
            color: subjectColor(code), badge: `${units.length} units`,
          };
        });
      })();

      const milestoneRows = [...termBars, ...examBars].map((b) => ({
        label: b.label, from: b.from, to: b.to, days: daysBetween(b.from, b.to),
        status: parseISO(b.to) < parseISO(TODAY) ? 'Completed' : parseISO(b.from) > parseISO(TODAY) ? 'Upcoming' : 'In Progress',
        owner: b.badge,
      }));

      host.appendChild(kpiRow([
        { label: 'Session length', value: `${formatNumber(SESSION_DAYS)} days`, icon: 'calendar', tone: 'brand', footer: '1 Apr 2026 – 31 Mar 2027' },
        { label: 'Session elapsed', value: `${Math.round((daysBetween(SESSION_START, TODAY) / SESSION_DAYS) * 100)}%`, icon: 'gauge', tone: 'info' },
        { label: 'Exam windows', value: db.examGroups.length, icon: 'file-text', tone: 'warning' },
        { label: 'Milestones upcoming', value: milestoneRows.filter((m) => m.status === 'Upcoming').length, icon: 'flag', tone: 'success' },
      ]));

      host.appendChild(SectionCard({
        title: 'Master plan', icon: 'map',
        subtitle: 'Terms, admissions, fees and appraisal · the red line is today',
        actions: Button('Print planner', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(host, 'Annual planner 2026-27') }),
      }, ganttChart(termBars, { title: 'Master academic plan 2026-27' })));

      host.appendChild(h('div', { className: 'widget-grid' },
        h('div', { className: 'span-6' }, SectionCard({ title: 'Examination windows', icon: 'file-text' },
          ganttChart(examBars, { title: 'Examination plan' }))),
        h('div', { className: 'span-6' }, SectionCard({ title: 'Vacations & holidays', icon: 'umbrella' },
          ganttChart(holidayBars, { title: 'Holiday plan' })))));

      host.appendChild(SectionCard({
        title: 'Events calendar', icon: 'trophy',
        subtitle: `${db.events.length} school events across the session`,
      }, ganttChart(eventBars, { title: 'Event plan' })));

      if (syllabusBars.length) {
        host.appendChild(SectionCard({
          title: 'Syllabus delivery blocks', icon: 'scroll',
          subtitle: 'Class XII subject-wise coverage window',
          actions: Button('Open syllabus tracker', { variant: 'ghost', size: 'sm', icon: 'clipboard-list', route: 'academics/syllabus-tracker' }),
        }, ganttChart(syllabusBars, { title: 'Syllabus blocks' })));
      }

      host.appendChild(SectionCard({ title: 'Milestone register', icon: 'flag', flush: true },
        DataTable({
          columns: [
            { key: 'label', label: 'Milestone', sticky: true, width: 300 },
            { key: 'owner', label: 'Track', width: 140, filter: true, render: (r) => Badge(r.owner, { tone: 'neutral', outline: true }) },
            { key: 'from', label: 'From', width: 130, render: (r) => formatDate(r.from), value: (r) => r.from },
            { key: 'to', label: 'To', width: 130, render: (r) => formatDate(r.to), value: (r) => r.to },
            { key: 'days', label: 'Days', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
            { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
          ],
          rows: milestoneRows, pageSize: 25, footerAggregates: true, exportName: 'annual-planner',
          rowActions: () => [
            { label: 'Open calendar', icon: 'calendar-check', route: 'academics/calendar' },
            { label: 'Exam schedule', icon: 'file-text', route: 'examination/schedule' },
          ],
        })));

      mount.appendChild(page({
        title: 'Annual Planner',
        subtitle: `Session ${db.academicYears.find((y) => y.current).name} · ${campusName(campusId)}`,
        route: 'academics/annual-planner',
        actions: canEdit() ? [
          Button('Academic calendar', { variant: 'secondary', icon: 'calendar-check', route: 'academics/calendar' }),
          Button('Add milestone', {
            variant: 'primary', icon: 'plus',
            onClick: () => formPage({
              title: 'Add planner milestone', mode: 'modal', submitLabel: 'Add milestone',
              sections: [{
                title: 'Milestone', cols: 2, fields: [
                  { id: 'label', label: 'Milestone', required: true, span: 'full', validate: validators.required },
                  { id: 'track', label: 'Track', type: 'select', options: ['Term', 'Examination', 'Admissions', 'Fees', 'Events', 'Appraisal'] },
                  { id: 'owner', label: 'Owner', type: 'combobox', options: db.staff.filter((s) => s.campusId === campusId).slice(0, 60).map((s) => ({ value: s.id, label: s.name })) },
                  { id: 'from', label: 'From', type: 'date', required: true, validate: validators.required },
                  { id: 'to', label: 'To', type: 'date', required: true, validate: validators.required },
                  { id: 'notes', label: 'Notes', type: 'textarea', span: 'full' },
                ],
              }],
              onSubmit: fakeSave('Milestone'),
            }),
          }),
        ] : null,
        children: host,
      }));
    },
  },

  /* --------------------------------- academics/class-subject-teacher --- */
  'academics/class-subject-teacher': {
    title: 'Class-Subject-Teacher Map',
    subtitle: 'Who teaches what, everywhere, on one grid',
    section: 'academics',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const classes = classesFor(campusId).filter((c) => c.level >= 3);
      const slots = slotsForCampus(campusId);
      const load = teacherLoad(campusId);

      const allCodes = Array.from(new Set(classes.flatMap((c) => subjectsForLevel(c.level))));
      const codes = SUBJECT_ORDER.filter((c) => allCodes.includes(c));

      // Build the mapping once — class × subject → teacher + weekly periods
      const cell = new Map();
      for (const s of slots) {
        const k = s.classId + '|' + s.subjectCode;
        const e = cell.get(k) || { periods: 0, teachers: new Map() };
        e.periods++;
        if (s.teacherId) e.teachers.set(s.teacherId, (e.teachers.get(s.teacherId) || 0) + 1);
        cell.set(k, e);
      }
      const cellFor = (classId, code) => {
        const e = cell.get(classId + '|' + code);
        if (!e || !e.teachers.size) return null;
        const [tid, n] = Array.from(e.teachers.entries()).sort((a, b) => b[1] - a[1])[0];
        const t = db.staff.find((x) => x.id === tid);
        return { teacher: t, periods: e.periods, teacherPeriods: n, shared: e.teachers.size > 1 };
      };

      const flat = [];
      for (const c of classes) {
        for (const code of subjectsForLevel(c.level)) {
          const info = cellFor(c.id, code);
          flat.push({
            id: c.id + '-' + code,
            classId: c.id, className: c.name, classLevel: c.level, stage: c.stage,
            subjectCode: code, subjectName: subjectName(code),
            teacherId: info && info.teacher ? info.teacher.id : null,
            teacherName: info && info.teacher ? info.teacher.name : 'Unassigned',
            designation: info && info.teacher ? info.teacher.designation : '—',
            periods: info ? info.periods : 0,
            weeklyLoad: info && info.teacher ? (load.get(info.teacher.id) || 0) : 0,
            shared: info ? info.shared : false,
            status: info && info.teacher ? 'Allocated' : 'Unassigned',
          });
        }
      }
      const unassigned = flat.filter((r) => !r.teacherId);

      const assign = (row) => {
        const pool = teachersFor(campusId)
          .filter((t) => t.subjects.includes(row.subjectCode) || !row.subjectCode)
          .sort((a, b) => (load.get(a.id) || 0) - (load.get(b.id) || 0));
        const list = (pool.length ? pool : teachersFor(campusId)).slice(0, 40);
        let chosen = row.teacherId;
        Modal({
          title: 'Allocate teacher', subtitle: `${row.className} · ${row.subjectName}`, icon: 'workflow', size: 'lg',
          body: h('div', { className: 'stack-3' },
            Callout({ tone: 'info', icon: 'gauge' },
              'Suggestions are ranked by current weekly load — the least loaded qualified teacher appears first.'),
            Field({ label: 'Teacher', required: true },
              Combobox({
                options: list.map((t) => ({ value: t.id, label: `${t.name} — ${load.get(t.id) || 0} periods/wk` })),
                value: chosen, placeholder: 'Search qualified staff…', onChange: (v) => { chosen = v; },
              })),
            SectionCard({ title: 'Least loaded qualified staff', icon: 'sort-asc' },
              RankList(list.slice(0, 6).map((t) => ({
                name: t.name, meta: `${t.designation} · ${t.subjects.join(', ')}`,
                value: `${load.get(t.id) || 0} p/wk`,
              }))))),
          actions: (close) => frag(
            Button('Cancel', { variant: 'ghost', onClick: close }),
            Button('Allocate', {
              variant: 'primary', icon: 'check',
              onClick: () => {
                if (!chosen) { toast('Select a teacher', 'Pick someone from the list first.', 'warning'); return; }
                const t = db.staff.find((x) => x.id === chosen);
                close();
                toast('Teacher allocated', `${t ? t.name : chosen} → ${row.className} ${row.subjectName}.`);
              },
            })),
        });
      };

      /* --- the matrix --- */
      const matrix = () => {
        const thead = h('thead', null, h('tr', null,
          h('th', { className: 'matrix-head' }, 'Class'),
          codes.map((c) => h('th', { attrs: { scope: 'col', title: subjectName(c) } },
            h('div', { className: 'row', style: { gap: '4px', justifyContent: 'center' } }, subjectSwatch(c), c)))));
        const tbody = h('tbody');
        for (const c of classes) {
          const tr = h('tr');
          tr.appendChild(h('th', { className: 'matrix-head', attrs: { scope: 'row' } }, c.name));
          const mine = subjectsForLevel(c.level);
          for (const code of codes) {
            if (!mine.includes(code)) { tr.appendChild(h('td', null, h('span', { className: 'matrix-empty' }, '·'))); continue; }
            const info = cellFor(c.id, code);
            const row = flat.find((f) => f.classId === c.id && f.subjectCode === code);
            tr.appendChild(h('td', null, h('button', {
              className: 'matrix-btn', type: 'button',
              attrs: { 'aria-label': `${c.name} ${subjectName(code)} — ${info && info.teacher ? info.teacher.name : 'unassigned'}` },
              onClick: () => (info && info.teacher ? navigate('teachers/profile/' + info.teacher.id) : assign(row)),
            }, info && info.teacher
              ? h('span', { className: 'matrix-cell' },
                h('span', { className: 'matrix-cell-name' }, info.teacher.name.split(' ')[0] + ' ' + (info.teacher.name.split(' ')[1] || '')[0] + '.'),
                h('span', { className: 'matrix-cell-meta' }, `${info.periods}p${info.shared ? ' · shared' : ''}`))
              : h('span', { className: 'matrix-cell' },
                h('span', { className: 't-danger t-xs' }, 'Assign'),
                h('span', { className: 'matrix-cell-meta' }, '—')))));
          }
          tbody.appendChild(tr);
        }
        return h('div', { className: 'matrix-wrap' }, h('table', { className: 'matrix' }, thead, tbody));
      };

      const host = h('div', { className: 'stack' });
      host.appendChild(kpiRow([
        { label: 'Class-subject pairs', value: formatNumber(flat.length), icon: 'workflow', tone: 'brand' },
        { label: 'Allocated', value: formatNumber(flat.length - unassigned.length), icon: 'user-check', tone: 'success', footer: `${Math.round(((flat.length - unassigned.length) / Math.max(1, flat.length)) * 100)}% coverage` },
        { label: 'Unassigned', value: unassigned.length, icon: 'alert-circle', tone: unassigned.length ? 'warning' : 'success' },
        { label: 'Teachers deployed', value: new Set(flat.map((r) => r.teacherId).filter(Boolean)).size, icon: 'presentation', tone: 'info', route: 'teachers/directory' },
      ]));
      if (unassigned.length) {
        host.appendChild(Callout({ tone: 'warning', icon: 'alert-triangle', title: `${unassigned.length} class-subject pairs have no teacher` },
          h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
            h('span', null, 'Allocate before the timetable is published, or those periods will publish as “Unassigned”.'),
            Button('Fix now', { variant: 'secondary', size: 'sm', icon: 'workflow', onClick: () => assign(unassigned[0]) }))));
      }
      host.appendChild(SectionCard({
        title: 'Allocation matrix', icon: 'workflow',
        subtitle: 'Click a filled cell to open the teacher, an empty cell to allocate',
        actions: h('div', { className: 'row' },
          Button('Subject allocation', { variant: 'ghost', size: 'sm', icon: 'book-open', route: 'teachers/subject-allocation' }),
          Button('Print', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(host, 'Class-subject-teacher map') })),
      }, matrix()));

      host.appendChild(SectionCard({ title: 'Allocation register', icon: 'table', flush: true, subtitle: `${formatNumber(flat.length)} rows` },
        DataTable({
          columns: [
            { key: 'className', label: 'Class', sticky: true, width: 140, filter: true, value: (r) => r.classLevel, render: (r) => r.className },
            { key: 'stage', label: 'Stage', width: 140, filter: true, hidden: true },
            {
              key: 'subjectName', label: 'Subject', width: 190, filter: true,
              render: (r) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, subjectSwatch(r.subjectCode), r.subjectName),
              value: (r) => r.subjectName,
            },
            {
              key: 'teacherName', label: 'Teacher', width: 230,
              render: (r) => (r.teacherId
                ? Identity(r.teacherName, r.designation, { onClick: () => navigate('teachers/profile/' + r.teacherId) })
                : Button('Allocate', { variant: 'subtle', size: 'sm', icon: 'user-plus', onClick: () => assign(r) })),
              value: (r) => r.teacherName,
            },
            { key: 'periods', label: 'Periods/wk', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
            {
              key: 'weeklyLoad', label: 'Teacher load', width: 170, align: 'right', numeric: true,
              render: (r) => (r.teacherId ? h('div', { className: 'stack-1' },
                h('span', { className: 't-xs t-num' }, `${r.weeklyLoad}/${MAX_WEEKLY_PERIODS}`),
                ProgressBar(Math.min(r.weeklyLoad, MAX_WEEKLY_PERIODS), { max: MAX_WEEKLY_PERIODS, size: 'sm', tone: loadTone(r.weeklyLoad) })) : h('span', { className: 't-faint' }, '—')),
            },
            { key: 'shared', label: 'Shared', width: 100, align: 'center', render: (r) => (r.shared ? Badge('Shared', { tone: 'info' }) : h('span', { className: 't-faint' }, '—')), value: (r) => (r.shared ? 'Yes' : 'No') },
            { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
          ],
          rows: flat, pageSize: 50, selectable: true, footerAggregates: true,
          searchKeys: ['className', 'subjectName', 'teacherName'],
          exportName: 'class-subject-teacher',
          bulkActions: [
            { label: 'Auto-allocate', icon: 'zap', onClick: (sel) => toast('Auto-allocation run', `${sel.length} pairs matched to the least loaded qualified staff.`) },
            { label: 'Export', icon: 'download', onClick: (sel) => toast('Export ready', `${sel.length} rows exported.`) },
          ],
          rowActions: (r) => [
            { label: 'Allocate / change teacher', icon: 'user-check', onClick: () => assign(r) },
            { label: 'Class timetable', icon: 'calendar', route: 'timetable/class/' + r.classId },
            { label: 'Curriculum', icon: 'scroll', route: 'academics/curriculum/' + r.classId },
            r.teacherId && { label: 'Teacher profile', icon: 'id-card', route: 'teachers/profile/' + r.teacherId },
          ].filter(Boolean),
          emptyState: EmptyState({ icon: 'workflow', title: 'Nothing to allocate', text: 'Add classes and subjects to build the map.' }),
        })));

      mount.appendChild(page({
        title: 'Class-Subject-Teacher Map',
        subtitle: `${campusName(campusId)} · ${formatNumber(flat.length)} pairs · ${unassigned.length} unassigned`,
        route: 'academics/class-subject-teacher',
        actions: canEdit() ? [
          Button('Workload analysis', { variant: 'secondary', icon: 'gauge', route: 'teachers/workload' }),
          Button('Auto-allocate all', {
            variant: 'primary', icon: 'zap',
            onClick: () => confirmThen({
              title: 'Auto-allocate every unassigned pair?',
              text: `${unassigned.length} pairs will be matched to the least loaded qualified teacher. You can review before publishing.`,
              confirmLabel: 'Run auto-allocation', icon: 'zap',
            }, () => toast('Auto-allocation complete', `${unassigned.length} pairs allocated. Review the matrix.`)),
          }),
        ] : null,
        children: host,
      }));
    },
  },

  /* --------------------------------- academics/grading-systems --------- */
  'academics/grading-systems': {
    title: 'Grading Systems',
    subtitle: 'Grade scales, bands and pass rules per board',
    section: 'academics',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const marks = db.marks.filter((m) => m.campusId === campusId);
      const gradeCounts = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'E']
        .map((g) => ({ key: g, value: marks.filter((m) => m.grade === g).length }));

      const scaleCard = (scale) => {
        const boards = db.boards.filter((b) => b.gradingSystem === scale.id);
        return SectionCard({
          title: scale.name,
          subtitle: `${scale.bands.length} bands · used by ${boards.map((b) => b.code).join(', ') || 'no board'}`,
          icon: 'percent',
          actions: canEdit() ? MenuButton([
            { label: 'Edit bands', icon: 'edit', onClick: () => openScale(scale) },
            { label: 'Duplicate scale', icon: 'copy', onClick: () => toast('Scale duplicated', `${scale.name} (copy)`) },
            { label: 'Preview report card', icon: 'certificate', route: 'examination/report-cards' },
            { separator: true },
            {
              label: 'Delete scale', icon: 'trash', tone: 'danger',
              onClick: () => confirmThen({ title: `Delete ${scale.name}?`, text: `${boards.length} boards reference this scale.`, tone: 'danger', confirmLabel: 'Delete', icon: 'trash' },
                () => toast('Scale deleted', scale.name, 'danger')),
            },
          ], { label: 'Scale actions' }) : null,
        },
          DataTable({
            columns: [
              { key: 'grade', label: 'Grade', width: 130, render: (b) => Badge(b.grade, { tone: b.point >= 8 ? 'success' : b.point >= 5 ? 'warning' : 'danger' }), value: (b) => b.grade },
              { key: 'from', label: 'From %', width: 100, align: 'right', numeric: true },
              { key: 'to', label: 'To %', width: 100, align: 'right', numeric: true },
              { key: 'point', label: 'Grade point', width: 120, align: 'right', numeric: true },
              {
                key: 'range', label: 'Band', sortable: false,
                render: (b) => h('div', { className: 'stack-1' },
                  ProgressBar(b.to - b.from, { max: 100, size: 'sm', tone: b.point >= 8 ? 'success' : b.point >= 5 ? 'warning' : 'danger' }),
                  h('span', { className: 't-2xs t-muted' }, `${b.from}–${b.to}%`)),
              },
            ],
            rows: scale.bands, paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
          }));
      };

      const openScale = (scale) => Drawer({
        title: scale ? `Edit ${scale.name}` : 'New grade scale',
        subtitle: 'Bands must be contiguous and cover 0–100%',
        size: 'lg',
        body: h('div', { className: 'stack-3' },
          FormGrid({ cols: 2 },
            Field({ label: 'Scale name', required: true }, Input({ value: scale ? scale.name : '' })),
            Field({ label: 'Applies to boards' }, MultiSelect({ options: db.boards.map((b) => b.code), values: db.boards.filter((b) => scale && b.gradingSystem === scale.id).map((b) => b.code) }))),
          SectionCard({ title: 'Bands', icon: 'layers' },
            h('div', { className: 'stack-2' }, (scale ? scale.bands : [{ grade: 'A', from: 80, to: 100, point: 10 }]).map((b) =>
              h('div', { className: 'row-3 row-wrap' },
                Field({ label: 'Grade' }, Input({ value: b.grade })),
                Field({ label: 'From %' }, Input({ type: 'number', value: b.from, numeric: true })),
                Field({ label: 'To %' }, Input({ type: 'number', value: b.to, numeric: true })),
                Field({ label: 'Point' }, Input({ type: 'number', value: b.point, numeric: true })),
                IconButton('trash', { label: 'Remove band', onClick: () => toast('Band removed', b.grade, 'warning') }))))),
          Callout({ tone: 'warning', icon: 'alert-triangle', title: 'Changing bands re-grades results' },
            'Existing marks keep their raw score, but grades and CGPA are recomputed the next time a result set is processed.')),
        actions: (close) => frag(
          Button('Cancel', { variant: 'ghost', onClick: close }),
          Button('Add band', { variant: 'secondary', icon: 'plus', onClick: () => toast('Band added', 'Fill in the range and grade point.') }),
          Button('Save scale', { variant: 'primary', icon: 'check', onClick: () => { close(); toast('Grade scale saved', scale ? scale.name : 'New scale'); } })),
      });

      const host = h('div', { className: 'stack' });
      host.appendChild(kpiRow([
        { label: 'Grade scales', value: db.gradeScales.length, icon: 'percent', tone: 'brand' },
        { label: 'Marks graded', value: formatNumber(marks.length), icon: 'file-text', tone: 'info' },
        { label: 'A1 + A2 share', value: `${Math.round(((gradeCounts[0].value + gradeCounts[1].value) / Math.max(1, marks.length)) * 100)}%`, icon: 'trophy', tone: 'success' },
        { label: 'Below pass (D/E)', value: formatNumber(gradeCounts[6].value + gradeCounts[7].value), icon: 'alert-circle', tone: 'danger' },
      ]));
      host.appendChild(h('div', { className: 'widget-grid' },
        h('div', { className: 'span-7' }, SectionCard({ title: 'Grade distribution', className: 'chart-card', subtitle: `${formatNumber(marks.length)} marks records at ${campusName(campusId)}` },
          barChart({ categories: gradeCounts.map((g) => g.key), series: [{ name: 'Students', values: gradeCounts.map((g) => g.value) }], showValues: true, height: 260 }))),
        h('div', { className: 'span-5' }, SectionCard({ title: 'Pass / fail split', className: 'chart-card' },
          donutChart({
            data: [
              { key: 'Distinction (≥81%)', value: gradeCounts[0].value + gradeCounts[1].value },
              { key: 'First (61–80%)', value: gradeCounts[2].value + gradeCounts[3].value },
              { key: 'Pass (33–60%)', value: gradeCounts[4].value + gradeCounts[5].value + gradeCounts[6].value },
              { key: 'Below pass', value: gradeCounts[7].value },
            ],
            height: 260, centerValue: formatNumber(marks.length), centerLabel: 'Records',
          })))));
      host.appendChild(h('div', { className: 'widget-grid' },
        db.gradeScales.map((s) => h('div', { className: 'span-4' }, scaleCard(s)))));
      host.appendChild(SectionCard({ title: 'Grading rules', icon: 'gavel', subtitle: 'Applied when a result set is processed' },
        DescriptionList([
          ['Pass criterion', '33% in each subject, theory and practical taken together'],
          ['Grace marks', 'Up to 5 marks in one subject to reach the pass band'],
          ['CGPA', 'Mean of grade points across the five scoring subjects'],
          ['Percentage from CGPA', 'CGPA × 9.5 (CBSE convention)'],
          ['Rounding', 'Half up to one decimal place'],
          ['Absent handling', 'Marked AB — excluded from the class average, counted as fail for promotion'],
        ], { cols: 2 })));

      mount.appendChild(page({
        title: 'Grading Systems',
        subtitle: `${db.gradeScales.length} scales mapped to ${db.boards.length} boards`,
        route: 'academics/grading-systems',
        actions: canEdit() ? [
          Button('Grade configuration', { variant: 'secondary', icon: 'settings', route: 'examination/grade-config' }),
          Button('New grade scale', { variant: 'primary', icon: 'plus', onClick: () => openScale(null) }),
        ] : null,
        children: host,
      }));
    },
  },
};

/* ==========================================================================
   5 · TIMETABLE routes
   ========================================================================== */

const timetableRoutes = {

  /* ------------------------------------------------- timetable/master --- */
  'timetable/master': {
    title: 'Master Timetable',
    subtitle: 'Every scheduled period across the campus',
    section: 'timetable',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const slots = slotsForCampus(campusId);
      const conflicts = timetableConflicts(campusId);
      const secs = sectionsFor(campusId);
      const load = teacherLoad(campusId);
      const periods = teachingPeriods();

      // Period × day utilisation (how many rooms are busy)
      const util = periods.map((p) => DAYS.map((d) => slots.filter((s) => s.day === d && s.periodNo === p.no).length));

      const rows = slots.map((s) => ({
        ...s,
        sectionLabel: `${s.className}-${s.section}`,
        conflict: conflicts.some((c) => c.day === s.day && c.periodNo === s.periodNo && (c.entityId === s.teacherId || c.entityId === s.room)),
      }));

      mount.appendChild(listPage({
        title: 'Master Timetable',
        subtitle: `${formatNumber(slots.length)} periods · ${secs.length} sections · ${campusName(campusId)}`,
        route: 'timetable/master',
        actions: [
          Button('Conflicts', { variant: conflicts.length ? 'danger' : 'secondary', icon: 'alert-triangle', route: 'timetable/conflicts' }),
          Button('Open builder', { variant: 'primary', icon: 'tool', route: 'timetable/builder' }),
        ],
        kpis: [
          { label: 'Scheduled periods', value: formatNumber(slots.length), icon: 'calendar', tone: 'brand', footer: `${periods.length} periods × ${DAYS.length} days` },
          { label: 'Sections covered', value: `${new Set(slots.map((s) => s.sectionId)).size} / ${secs.length}`, icon: 'columns', tone: 'success' },
          { label: 'Teachers deployed', value: load.size, icon: 'presentation', tone: 'info', route: 'teachers/workload' },
          { label: 'Open conflicts', value: conflicts.length, icon: 'alert-triangle', tone: conflicts.length ? 'danger' : 'success', route: 'timetable/conflicts' },
        ],
        chart: h('div', { className: 'stack-3' },
          heatmap({
            mode: 'matrix',
            rows: periods.map((p) => `P${p.no} · ${p.startTime}`),
            cols: DAYS.map((d) => DAY_SHORT[d]),
            values: util, cellSize: 46, title: 'Periods scheduled per slot',
          }),
          ScaleLegend(Math.min(...util.flat()), Math.max(...util.flat()), { format: 'number' })),
        chartTitle: 'Timetable density — period × day',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Class, teacher, subject or room…', width: '260px' },
          { id: 'className', label: 'Class', options: Array.from(new Set(slots.map((s) => s.className))) },
          { id: 'day', label: 'Day', options: DAYS },
          { id: 'subjectName', label: 'Subject', options: Array.from(new Set(slots.map((s) => s.subjectName))).sort() },
          { id: 'flag', label: 'Flags', type: 'segment', options: [{ id: 'all', label: 'All' }, { id: 'conflict', label: 'Conflicts' }, { id: 'sub', label: 'Substituted' }] },
        ],
        onFilter: (id, value, all, table) => {
          let out = rows.slice();
          if (all.q) out = search(out, all.q, ['className', 'section', 'teacherName', 'subjectName', 'room']);
          for (const k of ['className', 'day', 'subjectName']) {
            if (all[k] && all[k] !== 'all') out = out.filter((r) => r[k] === all[k]);
          }
          if (all.flag === 'conflict') out = out.filter((r) => r.conflict);
          if (all.flag === 'sub') out = out.filter((r) => r.isSubstituted);
          table.refresh(out);
        },
        columns: [
          { key: 'sectionLabel', label: 'Section', sticky: true, width: 140, render: (r) => Identity(r.sectionLabel, `Room ${r.room}`), value: (r) => r.sectionLabel },
          { key: 'day', label: 'Day', width: 120, filter: true },
          { key: 'periodNo', label: 'Period', width: 90, align: 'center', numeric: true, render: (r) => Badge('P' + r.periodNo, { tone: 'neutral', outline: true }), value: (r) => r.periodNo },
          { key: 'startTime', label: 'Time', width: 130, className: 't-num', render: (r) => `${r.startTime}–${r.endTime}` },
          {
            key: 'subjectName', label: 'Subject', width: 190, filter: true,
            render: (r) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, subjectSwatch(r.subjectCode), r.subjectName),
            value: (r) => r.subjectName,
          },
          {
            key: 'teacherName', label: 'Teacher', width: 220,
            render: (r) => (r.teacherId ? Identity(r.teacherName, `${load.get(r.teacherId) || 0} periods/wk`, { onClick: () => navigate('teachers/profile/' + r.teacherId) }) : Badge('Unassigned', { tone: 'warning' })),
            value: (r) => r.teacherName,
          },
          { key: 'room', label: 'Room', width: 110, className: 't-mono', filter: true },
          {
            key: 'flags', label: 'Flags', width: 160, sortable: false,
            render: (r) => h('div', { className: 'row', style: { gap: '4px' } },
              r.conflict ? Badge('Clash', { tone: 'danger', icon: 'alert-triangle' }) : null,
              r.isSubstituted ? Badge('Substituted', { tone: 'warning' }) : null,
              !r.conflict && !r.isSubstituted ? h('span', { className: 't-faint' }, '—') : null),
            value: (r) => (r.conflict ? 'Clash' : r.isSubstituted ? 'Substituted' : ''),
          },
        ],
        rows,
        selectable: true,
        pageSize: 50,
        searchKeys: ['className', 'section', 'teacherName', 'subjectName', 'room'],
        exportName: 'master-timetable',
        maxHeight: '62vh',
        bulkActions: [
          { label: 'Reassign teacher', icon: 'user-check', onClick: (sel) => toast('Reassignment queued', `${sel.length} periods selected.`) },
          { label: 'Move to another room', icon: 'door', onClick: (sel) => toast('Room change queued', `${sel.length} periods selected.`) },
        ],
        rowActions: (r) => [
          { label: 'Class timetable', icon: 'grid', route: 'timetable/class/' + r.sectionId },
          r.teacherId && { label: 'Teacher timetable', icon: 'presentation', route: 'timetable/teacher/' + r.teacherId },
          { label: 'Room timetable', icon: 'door', route: 'timetable/room/' + r.room },
          { separator: true },
          canEdit() && { label: 'Edit in builder', icon: 'tool', route: 'timetable/builder/' + r.sectionId },
          canEdit() && { label: 'Arrange substitute', icon: 'refresh-ccw', route: 'timetable/substitution' },
        ].filter(Boolean),
        onRowClick: (r) => navigate('timetable/class/' + r.sectionId),
        emptyState: EmptyState({ icon: 'calendar', title: 'No periods match', text: 'Clear a filter, or build the timetable for this campus.' }),
      }));
    },
  },

  /* ------------------------------------------------ timetable/builder --- */
  /* ★ FLAGSHIP — drag-and-drop grid, live conflict detection, workload */
  'timetable/builder': {
    title: 'Timetable Builder',
    subtitle: 'Drag subjects onto the grid — clashes are flagged as you go',
    section: 'timetable',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const allSections = sectionsFor(campusId);
      if (!allSections.length) {
        mount.appendChild(missingRecord('campus timetable', 'academics/sections'));
        return;
      }
      let section = allSections.find((s) => s.id === ctx.param) || allSections.find((s) => s.roomNo && strengthOf(s.id) > 0) || allSections[0];
      let cls = db.classes.find((c) => c.id === section.classId);

      const periods = teachingPeriods();
      const campusSlots = slotsForCampus(campusId);
      const teachers = teachersFor(campusId);
      const baseLoad = teacherLoad(campusId);

      /* ---- working model ---- */
      let grid = new Map();          // 'Day|periodNo' -> {subjectCode, teacherId, teacherName, room}
      let dirty = false;
      let selectedChip = null;

      function loadSection() {
        grid = new Map();
        for (const s of campusSlots.filter((x) => x.sectionId === section.id)) {
          grid.set(`${s.day}|${s.periodNo}`, {
            subjectCode: s.subjectCode, subjectName: s.subjectName,
            teacherId: s.teacherId, teacherName: s.teacherName, room: s.room || section.roomNo,
          });
        }
        dirty = false;
      }

      function subjectCodes() {
        return cls ? subjectsForLevel(cls.level, section.stream) : ['ENG', 'MAT'];
      }

      function defaultTeacher(code, precomputedLoad) {
        const t = teacherForClassSubject(section.classId, code, campusId);
        if (t) return t;
        const wl = precomputedLoad || workingLoad();
        const pool = teachers.filter((x) => x.subjects.includes(code));
        const list = pool.length ? pool : teachers;
        return list.slice().sort((a, b) => (wl.get(a.id) || 0) - (wl.get(b.id) || 0))[0] || null;
      }

      /** Weekly load per teacher = campus load minus this section's original, plus the working grid. */
      function workingLoad() {
        const map = new Map(baseLoad);
        for (const s of campusSlots.filter((x) => x.sectionId === section.id)) {
          if (s.teacherId) map.set(s.teacherId, Math.max(0, (map.get(s.teacherId) || 0) - 1));
        }
        for (const [, v] of grid) {
          if (v.teacherId) map.set(v.teacherId, (map.get(v.teacherId) || 0) + 1);
        }
        return map;
      }

      /** Live conflicts for the working grid only. */
      function liveConflicts() {
        const idx = slotIndex(campusId);
        const out = [];
        const load = workingLoad();
        const perSubject = new Map();
        for (const [key, v] of grid) {
          const [day, pno] = key.split('|');
          perSubject.set(v.subjectCode, (perSubject.get(v.subjectCode) || 0) + 1);
          const others = (idx.get(key) || []).filter((s) => s.sectionId !== section.id);
          if (v.teacherId) {
            const clash = others.filter((s) => s.teacherId === v.teacherId);
            if (clash.length) {
              out.push({
                key, day, periodNo: Number(pno), type: 'Teacher double-booked', severity: 'Critical',
                message: `${v.teacherName} is already teaching ${clash.map((s) => `${s.className}-${s.section}`).join(', ')} in this slot.`,
                fix: 'Pick another teacher or move the period.',
              });
            }
          }
          if (v.room) {
            const clash = others.filter((s) => s.room === v.room);
            if (clash.length) {
              out.push({
                key, day, periodNo: Number(pno), type: 'Room clash', severity: 'Major',
                message: `Room ${v.room} is occupied by ${clash.map((s) => `${s.className}-${s.section}`).join(', ')}.`,
                fix: 'Assign a free room for this period.',
              });
            }
          }
        }
        // per-day repetition of the same subject (3+ periods in a day reads as poor spread)
        for (const d of DAYS) {
          const counts = new Map();
          for (const p of periods) {
            const v = grid.get(`${d}|${p.no}`);
            if (v) counts.set(v.subjectCode, (counts.get(v.subjectCode) || 0) + 1);
          }
          for (const [code, n] of counts) {
            if (n >= 3) {
              out.push({
                key: `${d}|0`, day: d, periodNo: 0, type: 'Poor subject spread', severity: 'Minor',
                message: `${subjectName(code)} runs ${n} times on ${d}.`,
                fix: 'Spread the subject across the week.',
              });
            }
          }
        }
        // workload ceiling
        const mine = new Set(Array.from(grid.values()).map((v) => v.teacherId).filter(Boolean));
        for (const tid of mine) {
          const n = load.get(tid) || 0;
          if (n > MAX_WEEKLY_PERIODS) {
            const t = db.staff.find((s) => s.id === tid);
            out.push({
              key: '', day: '—', periodNo: 0, type: 'Workload exceeded', severity: 'Major',
              message: `${t ? t.name : tid} would teach ${n} periods a week (ceiling ${MAX_WEEKLY_PERIODS}).`,
              fix: 'Move a period to a less loaded colleague.',
            });
          }
        }
        return out;
      }

      /* ---- rendering ---- */
      const gridHost = h('div');
      const paletteHost = h('div', { className: 'tt-palette' });
      const conflictHost = h('div');
      const loadHost = h('div');
      const statHost = h('div');

      function place(day, periodNo, code, teacherId) {
        const t = teacherId ? db.staff.find((x) => x.id === teacherId) : defaultTeacher(code);
        grid.set(`${day}|${periodNo}`, {
          subjectCode: code, subjectName: subjectName(code),
          teacherId: t ? t.id : null, teacherName: t ? t.name : 'Unassigned',
          room: subjectMeta(code).hasPractical ? labRoomFor(code) : section.roomNo,
        });
        dirty = true;
        repaint();
      }
      function labRoomFor(code) {
        return { PHY: 'LAB-PHY', CHE: 'LAB-CHE', BIO: 'LAB-BIO', CSC: 'LAB-CS1', IT: 'LAB-CS2', SCI: 'LAB-PHY', ART: 'ART-01', MUS: 'MUS-01', PED: 'SPORT-GR' }[code] || section.roomNo;
      }
      function clear(day, periodNo) { grid.delete(`${day}|${periodNo}`); dirty = true; repaint(); }

      function cellMenu(anchor, day, p) {
        const v = grid.get(`${day}|${p.no}`);
        const codes = subjectCodes();
        const items = [
          { header: true, label: `${DAY_SHORT[day]} · Period ${p.no} · ${p.startTime}` },
          ...codes.map((c) => ({
            label: subjectName(c), icon: 'book', checked: v && v.subjectCode === c,
            onClick: () => place(day, p.no, c),
          })),
        ];
        if (v) {
          items.push({ separator: true });
          items.push({ label: 'Change teacher…', icon: 'user-check', onClick: () => teacherPicker(day, p, v) });
          items.push({ label: 'Change room…', icon: 'door', onClick: () => roomPicker(day, p, v) });
          items.push({ label: 'Clear period', icon: 'trash', tone: 'danger', onClick: () => clear(day, p.no) });
        }
        openMenu(anchor, items, { title: 'Assign period', minWidth: 220 });
      }

      function teacherPicker(day, p, v) {
        const load = workingLoad();
        const qualified = teachers.filter((t) => t.subjects.includes(v.subjectCode));
        const pool = (qualified.length ? qualified : teachers).slice().sort((a, b) => (load.get(a.id) || 0) - (load.get(b.id) || 0));
        const idx = slotIndex(campusId);
        const busy = new Set((idx.get(`${day}|${p.no}`) || []).filter((s) => s.sectionId !== section.id).map((s) => s.teacherId));
        let chosen = v.teacherId;
        Modal({
          title: 'Change teacher', subtitle: `${DAY_SHORT[day]} · Period ${p.no} · ${v.subjectName}`, icon: 'user-check', size: 'lg',
          body: h('div', { className: 'stack-3' },
            Field({ label: 'Teacher', required: true, hint: 'Teachers busy in this slot are marked.' },
              Combobox({
                options: pool.slice(0, 60).map((t) => ({
                  value: t.id,
                  label: `${t.name} — ${load.get(t.id) || 0} p/wk${busy.has(t.id) ? ' · BUSY' : ''}`,
                })),
                value: chosen, placeholder: 'Search staff…', onChange: (val) => { chosen = val; },
              })),
            SectionCard({ title: 'Free and qualified right now', icon: 'sparkles' },
              RankList(pool.filter((t) => !busy.has(t.id)).slice(0, 6).map((t) => ({
                name: t.name, meta: `${t.designation} · teaches ${t.subjects.join(', ')}`,
                value: `${load.get(t.id) || 0} p/wk`,
              }))))),
          actions: (close) => frag(
            Button('Cancel', { variant: 'ghost', onClick: close }),
            Button('Assign', {
              variant: 'primary', icon: 'check',
              onClick: () => { if (chosen) place(day, p.no, v.subjectCode, chosen); close(); },
            })),
        });
      }

      function roomPicker(day, p, v) {
        const idx = slotIndex(campusId);
        const busy = new Set((idx.get(`${day}|${p.no}`) || []).filter((s) => s.sectionId !== section.id).map((s) => s.room));
        let chosen = v.room;
        Modal({
          title: 'Change room', subtitle: `${DAY_SHORT[day]} · Period ${p.no}`, icon: 'door', size: 'md',
          body: h('div', { className: 'stack-3' },
            Field({ label: 'Room', required: true },
              Combobox({
                options: roomsFor(campusId).map((rm) => ({ value: rm, label: `${rm}${busy.has(rm) ? ' · occupied' : ' · free'}` })),
                value: chosen, onChange: (val) => { chosen = val; },
              })),
            Callout({ tone: 'info', icon: 'info' }, `${roomsFor(campusId).filter((rm) => !busy.has(rm)).length} rooms are free in this slot.`)),
          actions: (close) => frag(
            Button('Cancel', { variant: 'ghost', onClick: close }),
            Button('Move', {
              variant: 'primary', icon: 'check',
              onClick: () => {
                const cur = grid.get(`${day}|${p.no}`);
                if (cur && chosen) { cur.room = chosen; dirty = true; repaint(); }
                close();
              },
            })),
        });
      }

      function buildGrid() {
        const conflicts = liveConflicts();
        const conflictKeys = new Set(conflicts.filter((c) => c.key).map((c) => c.key));
        const thead = h('thead', null, h('tr', null,
          h('th', { className: 'tt-corner' }, 'Period'),
          DAYS.map((d) => h('th', { attrs: { scope: 'col' } }, DAY_SHORT[d]))));
        const tbody = h('tbody');
        for (const p of db.periods) {
          const tr = h('tr');
          tr.appendChild(h('th', { className: 'tt-rowhead', attrs: { scope: 'row' } },
            h('div', { className: 'tt-rowhead-no' }, p.isBreak ? p.label : `P${p.no}`),
            h('div', { className: 'tt-rowhead-time' }, `${p.startTime}–${p.endTime}`)));
          for (const d of DAYS) {
            if (p.isBreak) {
              tr.appendChild(h('td', null, h('div', { className: 'tt-cell is-break' }, h('span', { className: 'tt-break-label' }, p.label))));
              continue;
            }
            const key = `${d}|${p.no}`;
            const v = grid.get(key);
            const classes = ['tt-cell', 'is-editable'];
            if (!v) classes.push('is-free');
            if (conflictKeys.has(key)) classes.push('has-conflict');
            const cell = h('div', {
              className: classes.join(' '),
              attrs: { tabindex: '0', role: 'button', 'aria-label': `${d} period ${p.no}${v ? ` — ${v.subjectName} with ${v.teacherName}` : ' — free'}` },
              onClick: (e) => { if (selectedChip) place(d, p.no, selectedChip); else cellMenu(e.currentTarget, d, p); },
              onKeyDown: (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (selectedChip) place(d, p.no, selectedChip); else cellMenu(e.currentTarget, d, p); }
                if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); clear(d, p.no); }
              },
              onDragOver: (e) => { e.preventDefault(); e.currentTarget.dataset.drop = 'on'; },
              onDragLeave: (e) => { delete e.currentTarget.dataset.drop; },
              onDrop: (e) => {
                e.preventDefault();
                delete e.currentTarget.dataset.drop;
                const code = e.dataTransfer.getData('text/plain');
                if (code) place(d, p.no, code);
              },
            });
            if (v) {
              cell.appendChild(h('span', { className: 'tt-accent', style: { background: subjectColor(v.subjectCode) } }));
              cell.appendChild(h('span', { className: 'tt-sub-name' }, v.subjectName));
              cell.appendChild(h('span', { className: 'tt-teacher' }, v.teacherName || 'Unassigned'));
              cell.appendChild(h('span', { className: 'tt-room' }, v.room || '—'));
            } else {
              cell.appendChild(h('span', { className: 'tt-teacher t-faint' }, 'Free'));
              cell.appendChild(h('span', { className: 'tt-room' }, 'drop a subject'));
            }
            tr.appendChild(h('td', null, cell));
          }
          tbody.appendChild(tr);
        }
        return h('div', { className: 'tt-wrap' }, h('table', { className: 'tt-grid' }, thead, tbody));
      }

      function buildPalette() {
        paletteHost.innerHTML = '';
        const load = workingLoad();
        for (const code of subjectCodes()) {
          const placed = Array.from(grid.values()).filter((v) => v.subjectCode === code).length;
          const t = defaultTeacher(code, load);
          const chip = h('div', {
            className: 'tt-chip',
            dataset: { active: String(selectedChip === code) },
            attrs: { draggable: 'true', role: 'button', tabindex: '0', 'aria-pressed': String(selectedChip === code), title: `${subjectName(code)} — drag to a period or select then click a cell` },
            onClick: () => { selectedChip = selectedChip === code ? null : code; repaint(); },
            onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectedChip = selectedChip === code ? null : code; repaint(); } },
            onDragStart: (e) => { e.dataTransfer.setData('text/plain', code); e.dataTransfer.effectAllowed = 'copy'; },
          },
            subjectSwatch(code),
            h('span', null, subjectName(code)),
            h('span', { className: 'tt-chip-meta' }, `${placed}p`),
            t ? h('span', { className: 'tt-chip-meta' }, `· ${t.name.split(' ')[0]} ${load.get(t.id) || 0}p`) : null);
          paletteHost.appendChild(chip);
        }
        if (selectedChip) {
          paletteHost.appendChild(h('button', {
            className: 'tt-chip', type: 'button',
            onClick: () => { selectedChip = null; repaint(); },
          }, Icon('x', 13), 'Clear selection'));
        }
      }

      function buildConflicts() {
        const list = liveConflicts();
        conflictHost.innerHTML = '';
        if (!list.length) {
          conflictHost.appendChild(EmptyState({
            icon: 'check-circle', tone: 'success', title: 'No clashes',
            text: 'Every teacher and room in this grid is free at the time it is scheduled.',
          }));
          return;
        }
        const counts = ['Teacher double-booked', 'Room clash', 'Workload exceeded', 'Poor subject spread']
          .map((k) => ({ k, n: list.filter((c) => c.type === k).length })).filter((x) => x.n);
        conflictHost.appendChild(h('div', { className: 'stack-2 mb-3' },
          h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-2)' } },
            counts.map((c) => Badge(`${c.k} · ${c.n}`, { tone: c.k === 'Teacher double-booked' ? 'danger' : c.k === 'Poor subject spread' ? 'info' : 'warning' }))),
          h('div', { className: 't-xs t-muted' },
            list.length > 12 ? `Showing the 12 most severe of ${list.length} issues — fix these first, the list re-checks on every change.` : 'Every issue on this grid is listed below.')));
        conflictHost.appendChild(h('div', { className: 'stack-2' }, list.slice(0, 12).map((c) => Callout({
          tone: c.severity === 'Critical' ? 'danger' : c.severity === 'Major' ? 'warning' : 'info',
          icon: c.severity === 'Minor' ? 'info' : 'alert-triangle',
          title: `${c.type}${c.day !== '—' ? ` · ${DAY_SHORT[c.day] || c.day}${c.periodNo ? ' P' + c.periodNo : ''}` : ''}`,
        }, h('div', { className: 'stack-1' },
          h('span', null, c.message),
          h('span', { className: 't-xs t-muted' }, c.fix))))));
      }

      function buildLoad() {
        const load = workingLoad();
        const ids = Array.from(new Set(Array.from(grid.values()).map((v) => v.teacherId).filter(Boolean)));
        loadHost.innerHTML = '';
        if (!ids.length) {
          loadHost.appendChild(EmptyState({ icon: 'gauge', title: 'Nothing scheduled', text: 'Place a subject on the grid to see teacher workload.' }));
          return;
        }
        const rows = ids.map((id) => ({ t: db.staff.find((s) => s.id === id), n: load.get(id) || 0 }))
          .filter((x) => x.t).sort((a, b) => b.n - a.n);
        loadHost.appendChild(h('div', null, rows.map(({ t, n }) => h('div', { className: 'load-meter' },
          h('div', { className: 'row', style: { gap: 'var(--sp-2)', minWidth: 0 } },
            Avatar(t.name, { size: 'xs' }),
            h('span', { className: 'stack-1', style: { minWidth: 0 } },
              h('a', {
                className: 't-sm t-truncate', href: '#/teachers/profile/' + t.id,
                onClick: (e) => { e.preventDefault(); navigate('teachers/profile/' + t.id); },
              }, t.name),
              h('span', { className: 't-2xs t-muted' }, loadLabel(n)))),
          h('span', { className: 't-sm t-num t-semibold' }, `${n}/${MAX_WEEKLY_PERIODS}`),
          h('div', { className: 'load-meter-bar' },
            ProgressBar(Math.min(n, MAX_WEEKLY_PERIODS + 6), { max: MAX_WEEKLY_PERIODS + 6, tone: loadTone(n), size: 'sm' }))))));
      }

      function buildStats() {
        const total = periods.length * DAYS.length;
        const filled = grid.size;
        const conflicts = liveConflicts();
        const codes = subjectCodes();
        statHost.innerHTML = '';
        statHost.appendChild(h('div', { className: 'widget-grid' },
          h('div', { className: 'span-3' }, StatCard({ label: 'Slots filled', value: `${filled} / ${total}`, icon: 'grid', tone: 'brand', footer: `${total - filled} free periods` })),
          h('div', { className: 'span-3' }, StatCard({ label: 'Subjects placed', value: new Set(Array.from(grid.values()).map((v) => v.subjectCode)).size + ' / ' + codes.length, icon: 'book', tone: 'info' })),
          h('div', { className: 'span-3' }, StatCard({ label: 'Teachers used', value: new Set(Array.from(grid.values()).map((v) => v.teacherId).filter(Boolean)).size, icon: 'presentation', tone: 'success' })),
          h('div', { className: 'span-3' }, StatCard({ label: 'Live conflicts', value: conflicts.length, icon: 'alert-triangle', tone: conflicts.length ? 'danger' : 'success', footer: conflicts.length ? 'Resolve before publishing' : 'Ready to publish' }))));
      }

      function repaint() {
        gridHost.innerHTML = '';
        gridHost.appendChild(buildGrid());
        gridHost.appendChild(timetableLegend(subjectCodes()));
        buildPalette();
        buildConflicts();
        buildLoad();
        buildStats();
      }

      /* ---- auto-fill: spread each subject evenly, avoiding clashes ---- */
      function autoFill() {
        const codes = subjectCodes();
        const idx = slotIndex(campusId);
        const total = periods.length * DAYS.length;
        const per = Math.floor(total / codes.length);
        const queue = [];
        codes.forEach((c, i) => { for (let k = 0; k < per + (i < total % codes.length ? 1 : 0); k++) queue.push(c); });
        grid = new Map();
        let qi = 0;
        for (let pi = 0; pi < periods.length; pi++) {
          for (let di = 0; di < DAYS.length; di++) {
            if (qi >= queue.length) break;
            const d = DAYS[(di + pi) % DAYS.length];
            const p = periods[pi];
            const code = queue[qi++];
            const key = `${d}|${p.no}`;
            const others = (idx.get(key) || []).filter((s) => s.sectionId !== section.id);
            const busy = new Set(others.map((s) => s.teacherId));
            const load = workingLoad();
            const qualified = teachers.filter((t) => t.subjects.includes(code) && !busy.has(t.id));
            const pool = (qualified.length ? qualified : teachers.filter((t) => !busy.has(t.id)));
            const t = pool.slice().sort((a, b) => (load.get(a.id) || 0) - (load.get(b.id) || 0))[0];
            grid.set(key, {
              subjectCode: code, subjectName: subjectName(code),
              teacherId: t ? t.id : null, teacherName: t ? t.name : 'Unassigned',
              room: subjectMeta(code).hasPractical ? labRoomFor(code) : section.roomNo,
            });
          }
        }
        dirty = true;
        repaint();
        toast('Auto-fill complete', `${grid.size} periods generated with clash avoidance.`);
      }

      /* ---- page shell ---- */
      const host = h('div', { className: 'stack' });

      const pickerHost = h('div');
      function buildPicker() {
        pickerHost.innerHTML = '';
        pickerHost.appendChild(filterCard([
          {
            id: 'class', label: 'Class', type: 'select', value: section.classId,
            options: classesFor(campusId).map((c) => ({ value: c.id, label: c.name })),
          },
          {
            id: 'section', label: 'Section', type: 'select', value: section.id,
            options: allSections.filter((s) => s.classId === section.classId).map((s) => ({ value: s.id, label: `Section ${s.name} · Room ${s.roomNo}` })),
          },
        ], (id, value) => {
          if (id === 'class' && value !== 'all' && value !== section.classId) {
            const first = allSections.find((s) => s.classId === value);
            if (first) switchSection(first);
          }
          if (id === 'section' && value !== 'all' && value !== section.id) {
            const s = allSections.find((x) => x.id === value);
            if (s) switchSection(s);
          }
        }, h('div', { className: 'row' },
          Button('Auto-fill', { variant: 'secondary', size: 'sm', icon: 'zap', onClick: () => confirmThen({ title: 'Auto-fill this grid?', text: 'Existing entries for this section will be replaced by a clash-avoiding distribution.', confirmLabel: 'Auto-fill', icon: 'zap', tone: 'warning' }, autoFill) }),
          Button('Reset', { variant: 'ghost', size: 'sm', icon: 'refresh-ccw', onClick: () => { loadSection(); repaint(); toast('Grid reset', 'Back to the published timetable.', 'info'); } }))));
      }

      function switchSection(s) {
        const go = () => {
          section = s;
          cls = db.classes.find((c) => c.id === s.classId);
          selectedChip = null;
          loadSection();
          buildPicker();
          repaint();
          headline.textContent = `${cls ? cls.name : ''} — Section ${s.name}`;
          subhead.textContent = `Room ${s.roomNo} · ${strengthOf(s.id)} students · ${s.stream || 'General'} · ${campusName(campusId)}`;
        };
        if (dirty) {
          confirmThen({ title: 'Discard unsaved changes?', text: 'The grid you are editing has not been published.', confirmLabel: 'Discard', tone: 'warning', icon: 'alert-triangle' }, go);
        } else go();
      }

      const headline = h('h3', null, `${cls ? cls.name : ''} — Section ${section.name}`);
      const subhead = h('div', { className: 't-sm t-muted' }, `Room ${section.roomNo} · ${strengthOf(section.id)} students · ${section.stream || 'General'} · ${campusName(campusId)}`);

      loadSection();
      buildPicker();

      host.appendChild(pickerHost);
      host.appendChild(statHost);
      host.appendChild(h('div', { className: 'detail-split' },
        h('div', { className: 'stack' },
          Card({ pad: true }, h('div', { className: 'stack-2' }, headline, subhead)),
          SectionCard({
            title: 'Subject palette', icon: 'book',
            subtitle: 'Drag a chip onto a period, or select it and click cells',
            actions: h('div', { className: 'row' },
              Button('Periods', { variant: 'ghost', size: 'sm', icon: 'clock', route: 'timetable/periods' })),
          }, paletteHost),
          SectionCard({
            title: 'Weekly grid', icon: 'table',
            subtitle: `${periods.length} teaching periods × ${DAYS.length} days`,
            actions: h('div', { className: 'row' },
              Button('Print', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(gridHost, `${cls ? cls.name : ''} ${section.name} timetable`) }),
              Button('Export CSV', {
                variant: 'ghost', size: 'sm', icon: 'download',
                onClick: () => {
                  const rows = Array.from(grid.entries()).map(([k, v]) => {
                    const [day, p] = k.split('|');
                    return { day, period: p, subject: v.subjectName, teacher: v.teacherName, room: v.room };
                  });
                  download(`timetable-${section.id}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
                  toast('Exported', `timetable-${section.id}.csv downloaded.`);
                },
              })),
          }, gridHost)),
        h('div', { className: 'stack-3' },
          SectionCard({ title: 'Live conflict check', icon: 'alert-triangle', subtitle: 'Recomputed on every change' }, conflictHost),
          SectionCard({
            title: 'Teacher workload', icon: 'gauge',
            subtitle: `Ceiling ${MAX_WEEKLY_PERIODS} periods a week`,
            actions: Button('Full analysis', { variant: 'ghost', size: 'sm', icon: 'chart-bar', route: 'teachers/workload' }),
          }, loadHost),
          SectionCard({ title: 'How this works', icon: 'help-circle' },
            h('ul', { className: 'stack-1 t-sm', style: { paddingLeft: 'var(--sp-4)' } },
              h('li', null, 'Drag a subject chip onto any period, or select a chip and click cells to place it repeatedly.'),
              h('li', null, 'Click a filled cell to change the subject, teacher or room; press Delete to clear it.'),
              h('li', null, 'A red outline means the teacher or room is already booked elsewhere in that slot.'),
              h('li', null, 'The workload meter turns amber at 30 periods and red past 34.'))))));

      mount.appendChild(page({
        title: 'Timetable Builder',
        subtitle: 'Build a section timetable with live clash detection',
        route: 'timetable/builder',
        wide: true,
        actions: canEdit() ? [
          Button('Conflict report', { variant: 'secondary', icon: 'alert-triangle', route: 'timetable/conflicts' }),
          Button('Save draft', {
            variant: 'secondary', icon: 'check',
            onClick: () => { dirty = false; toast('Draft saved', `${grid.size} periods stored for ${cls ? cls.name : ''}-${section.name}.`); },
          }),
          Button('Publish', {
            variant: 'primary', icon: 'send',
            onClick: () => {
              const cs = liveConflicts().filter((c) => c.severity !== 'Minor');
              if (cs.length) {
                notify({ title: 'Resolve conflicts first', text: `${cs.length} blocking issues remain on this grid.`, tone: 'danger' });
                return;
              }
              confirmThen({
                title: `Publish ${cls ? cls.name : ''}-${section.name} timetable?`,
                text: 'Students, parents and teachers will see this grid immediately on their portals.',
                confirmLabel: 'Publish', icon: 'send',
              }, () => { dirty = false; toast('Timetable published', `${grid.size} periods live for ${cls ? cls.name : ''}-${section.name}.`); });
            },
          }),
        ] : [Button('View class timetable', { variant: 'primary', icon: 'grid', route: 'timetable/class/' + section.id })],
        children: host,
      }));

      repaint();
    },
  },

  /* -------------------------------------------------- timetable/class --- */
  'timetable/class': {
    title: 'Class Timetable',
    subtitle: 'Printable weekly grid for a section',
    section: 'timetable',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const all = sectionsFor(campusId);
      if (!all.length) { mount.appendChild(missingRecord('section', 'academics/sections')); return; }
      let section = all.find((s) => s.id === ctx.param) || all[0];
      let cls = db.classes.find((c) => c.id === section.classId);

      const host = h('div', { className: 'stack' });
      const gridHost = h('div');
      const sideHost = h('div', { className: 'stack-3' });

      const paint = () => {
        const slots = db.timetableSlots.filter((s) => s.sectionId === section.id);
        const codes = Array.from(new Set(slots.map((s) => s.subjectCode)));
        const perSubject = codes.map((c) => ({ key: subjectName(c), value: slots.filter((s) => s.subjectCode === c).length, color: subjectColor(c) }));
        const teachers = Array.from(new Set(slots.map((s) => s.teacherId).filter(Boolean)));
        const ct = db.staff.find((s) => s.id === section.classTeacherId);

        gridHost.innerHTML = '';
        gridHost.appendChild(slots.length
          ? frag(timetableGrid({ slots, tertiary: (s) => s.room }), timetableLegend(codes))
          : EmptyState({
            icon: 'calendar', title: 'No timetable yet',
            text: `${cls ? cls.name : ''}-${section.name} has no published periods.`,
            action: canEdit() ? Button('Open builder', { variant: 'primary', icon: 'tool', onClick: () => navigate('timetable/builder/' + section.id) }) : null,
          }));

        sideHost.innerHTML = '';
        sideHost.appendChild(SectionCard({ title: 'Section', icon: 'columns' },
          DescriptionList([
            ['Class', cls ? cls.name : '—'], ['Section', section.name],
            ['Room', section.roomNo], ['Stream', section.stream || 'General'],
            ['Students', formatNumber(strengthOf(section.id))], ['Capacity', String(section.capacity)],
            ['Class teacher', ct ? h('a', { href: '#/teachers/profile/' + ct.id, onClick: (e) => { e.preventDefault(); navigate('teachers/profile/' + ct.id); } }, ct.name) : 'Not assigned'],
            ['Periods a week', String(slots.length)],
          ], { cols: 1 })));
        sideHost.appendChild(SectionCard({ title: 'Weekly subject load', className: 'chart-card', icon: 'chart-bar' },
          perSubject.length ? donutChart({ data: perSubject, height: 240, centerValue: String(slots.length), centerLabel: 'Periods' })
            : EmptyState({ icon: 'chart-pie', title: 'Nothing scheduled', text: 'Subject load appears once periods are assigned.' })));
        sideHost.appendChild(SectionCard({ title: 'Teachers on this section', icon: 'presentation', subtitle: `${teachers.length} teachers` },
          teachers.length ? RankList(teachers.slice(0, 10).map((id) => {
            const t = db.staff.find((x) => x.id === id);
            return { name: t ? t.name : id, meta: t ? t.designation : '', value: `${slots.filter((s) => s.teacherId === id).length}p` };
          })) : EmptyState({ icon: 'presentation', title: 'No teachers mapped', text: 'Allocate teachers on the class-subject map.' })));
      };

      host.appendChild(filterCard([
        { id: 'class', label: 'Class', type: 'select', value: section.classId, options: classesFor(campusId).map((c) => ({ value: c.id, label: c.name })) },
        { id: 'section', label: 'Section', type: 'select', value: section.id, options: all.filter((s) => s.classId === section.classId).map((s) => ({ value: s.id, label: `Section ${s.name}` })) },
      ], (id, value) => {
        if (value === 'all') return;
        if (id === 'class') { const s = all.find((x) => x.classId === value); if (s) { section = s; cls = db.classes.find((c) => c.id === s.classId); navigate('timetable/class/' + s.id); } }
        if (id === 'section') { const s = all.find((x) => x.id === value); if (s) { section = s; cls = db.classes.find((c) => c.id === s.classId); paint(); } }
      }, h('div', { className: 'row' },
        Button('Print', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(gridHost, `${cls ? cls.name : ''}-${section.name} timetable`) }),
        Button('Teacher view', { variant: 'ghost', size: 'sm', icon: 'presentation', route: 'timetable/teacher' }))));

      host.appendChild(h('div', { className: 'detail-split' },
        h('div', { className: 'stack' }, SectionCard({
          title: 'Weekly timetable', icon: 'grid',
          subtitle: `${cls ? cls.name : ''} — Section ${section.name} · Room ${section.roomNo}`,
          actions: canEdit() ? Button('Edit in builder', { variant: 'secondary', size: 'sm', icon: 'tool', onClick: () => navigate('timetable/builder/' + section.id) }) : null,
        }, gridHost)),
        sideHost));

      paint();
      mount.appendChild(page({
        title: 'Class Timetable',
        subtitle: `${cls ? cls.name : ''} — Section ${section.name} · ${campusName(campusId)}`,
        route: 'timetable/class',
        actions: [
          Button('All sections', { variant: 'secondary', icon: 'columns', route: 'academics/sections' }),
          Button('Master timetable', { variant: 'primary', icon: 'table', route: 'timetable/master' }),
        ],
        children: host,
      }));
    },
  },

  /* ------------------------------------------------ timetable/teacher --- */
  'timetable/teacher': {
    title: 'Teacher Timetable',
    subtitle: 'Weekly grid and free periods for a member of staff',
    section: 'timetable',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const staff = teachersFor(campusId);
      if (!staff.length) { mount.appendChild(missingRecord('teacher', 'teachers/directory')); return; }
      const load = teacherLoad(campusId);
      let teacher = staff.find((s) => s.id === ctx.param) || sortBy(staff, (s) => -(load.get(s.id) || 0))[0] || staff[0];

      const host = h('div', { className: 'stack' });
      const gridHost = h('div');
      const sideHost = h('div', { className: 'stack-3' });

      const paint = () => {
        const slots = slotsForTeacher(teacher.id);
        const codes = Array.from(new Set(slots.map((s) => s.subjectCode)));
        const n = slots.length;
        const free = teachingPeriods().length * DAYS.length - n;
        const byDay = DAYS.map((d) => slots.filter((s) => s.day === d).length);
        const subs = db.substitutions.filter((s) => s.substituteTeacherId === teacher.id || s.absentTeacherId === teacher.id);

        gridHost.innerHTML = '';
        gridHost.appendChild(n
          ? frag(timetableGrid({
            slots,
            primary: (s) => `${s.className}-${s.section}`,
            secondary: (s) => s.subjectName,
            tertiary: (s) => s.room,
          }), timetableLegend(codes))
          : EmptyState({ icon: 'calendar', title: 'No periods assigned', text: `${teacher.name} has no periods on the current timetable.`, action: Button('Open builder', { variant: 'primary', icon: 'tool', route: 'timetable/builder' }) }));

        sideHost.innerHTML = '';
        sideHost.appendChild(Card({ pad: true },
          profileHeader({
            name: teacher.name, size: 'lg',
            subtitle: `${teacher.designation} · ${teacher.department}`,
            badges: [Badge(teacher.status), Badge(loadLabel(n), { tone: loadTone(n) })],
            meta: [
              { label: 'Employee code', value: teacher.employeeCode, icon: 'id-card' },
              { label: 'Periods/week', value: String(n), icon: 'clock' },
              { label: 'Subjects', value: teacher.subjects.join(', ') || '—', icon: 'book' },
            ],
            actions: Button('Full profile', { variant: 'secondary', icon: 'id-card', onClick: () => navigate('teachers/profile/' + teacher.id) }),
          })));
        sideHost.appendChild(SectionCard({ title: 'Load by day', className: 'chart-card', icon: 'chart-bar' },
          barChart({ categories: DAYS.map((d) => DAY_SHORT[d]), series: [{ name: 'Periods', values: byDay }], showValues: true, height: 200 })));
        sideHost.appendChild(SectionCard({ title: 'Workload', icon: 'gauge' },
          h('div', { className: 'stack-3' },
            h('div', { className: 'row', style: { justifyContent: 'center' } }, progressRing(n, { max: MAX_WEEKLY_PERIODS, label: `${n} periods`, sublabel: `of ${MAX_WEEKLY_PERIODS}`, valueFormat: () => String(n), size: 130 })),
            MetricRow('Free periods a week', String(free)),
            MetricRow('Sections taught', String(new Set(slots.map((s) => s.sectionId)).size)),
            MetricRow('Subjects taught', String(codes.length)),
            MetricRow('Class teacher of', teacher.classTeacherOf ? (db.sections.find((s) => s.id === teacher.classTeacherOf) || {}).label || '—' : '—'))));
        sideHost.appendChild(SectionCard({ title: 'Substitutions', icon: 'refresh-ccw', subtitle: `${subs.length} records this month` },
          subs.length ? Timeline(subs.slice(0, 6).map((s) => ({
            title: s.absentTeacherId === teacher.id ? `Absent — covered by ${s.substituteTeacherName}` : `Covered ${s.className}-${s.section}`,
            meta: `${formatDate(s.date)} · Period ${s.periodNo}`, text: `${s.subjectName} · ${s.reason}`,
            icon: 'refresh-ccw', tone: toneForStatus(s.status),
          }))) : EmptyState({ icon: 'refresh-ccw', title: 'No substitutions', text: 'This teacher has neither been absent nor covered a class this month.' })));
      };

      host.appendChild(filterCard([
        {
          id: 'teacher', label: 'Teacher', type: 'select', value: teacher.id,
          options: sortBy(staff, 'name').map((t) => ({ value: t.id, label: `${t.name} — ${load.get(t.id) || 0} p/wk` })),
          width: '320px',
        },
        { id: 'dept', label: 'Department', options: Array.from(new Set(staff.map((s) => s.department))) },
      ], (id, value) => {
        if (id === 'teacher' && value !== 'all') { const t = staff.find((x) => x.id === value); if (t) { teacher = t; paint(); } }
        if (id === 'dept' && value !== 'all') {
          const t = staff.find((x) => x.department === value);
          if (t) { teacher = t; paint(); }
        }
      }, h('div', { className: 'row' },
        Button('Print', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(gridHost, `${teacher.name} timetable`) }),
        Button('Workload analysis', { variant: 'ghost', size: 'sm', icon: 'gauge', route: 'teachers/workload' }))));

      host.appendChild(h('div', { className: 'detail-split' },
        h('div', { className: 'stack' }, SectionCard({
          title: 'Weekly timetable', icon: 'presentation',
          subtitle: 'Cells show the section, the subject and the room',
        }, gridHost)),
        sideHost));

      paint();
      mount.appendChild(page({
        title: 'Teacher Timetable',
        subtitle: `${teacher.name} · ${campusName(campusId)}`,
        route: 'timetable/teacher',
        actions: [
          Button('Teacher directory', { variant: 'secondary', icon: 'users', route: 'teachers/directory' }),
          Button('Substitution', { variant: 'primary', icon: 'refresh-ccw', route: 'timetable/substitution' }),
        ],
        children: host,
      }));
    },
  },

  /* --------------------------------------------------- timetable/room --- */
  'timetable/room': {
    title: 'Room Timetable',
    subtitle: 'Occupancy for a single room across the week',
    section: 'timetable',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const rooms = roomsFor(campusId);
      const slots = slotsForCampus(campusId);
      let room = rooms.includes(ctx.param) ? ctx.param : (slots[0] ? slots[0].room : rooms[0]);

      const host = h('div', { className: 'stack' });
      const gridHost = h('div');
      const sideHost = h('div', { className: 'stack-3' });
      const total = teachingPeriods().length * DAYS.length;

      const paint = () => {
        const mine = slots.filter((s) => s.room === room);
        const codes = Array.from(new Set(mine.map((s) => s.subjectCode)));
        const util = Math.round((mine.length / total) * 100);
        const clashes = timetableConflicts(campusId).filter((c) => c.type === 'Room clash' && c.entityId === room);
        const clashKeys = new Set(clashes.map((c) => `${c.day}|${c.periodNo}`));

        gridHost.innerHTML = '';
        gridHost.appendChild(mine.length
          ? frag(timetableGrid({
            slots: mine,
            primary: (s) => `${s.className}-${s.section}`,
            secondary: (s) => s.subjectName,
            tertiary: (s) => s.teacherName,
            conflictKeys: clashKeys,
          }), timetableLegend(codes))
          : EmptyState({ icon: 'door', title: 'Room is unbooked', text: `Nothing is scheduled in ${room} this week.` }));

        sideHost.innerHTML = '';
        sideHost.appendChild(SectionCard({ title: 'Utilisation', icon: 'gauge' },
          h('div', { className: 'stack-3' },
            h('div', { className: 'row', style: { justifyContent: 'center' } }, progressRing(util, { max: 100, label: `${util}%`, sublabel: 'of the week', size: 130 })),
            MetricRow('Periods booked', `${mine.length} / ${total}`),
            MetricRow('Sections using it', String(new Set(mine.map((s) => s.sectionId)).size)),
            MetricRow('Teachers using it', String(new Set(mine.map((s) => s.teacherId)).size)),
            MetricRow('Double bookings', String(clashes.length)))));
        if (clashes.length) {
          sideHost.appendChild(Callout({ tone: 'danger', icon: 'alert-triangle', title: `${clashes.length} double bookings` },
            h('div', { className: 'stack-1' }, clashes.slice(0, 5).map((c) => h('span', { className: 't-sm' }, `${DAY_SHORT[c.day]} P${c.periodNo} — ${c.classes}`)))));
        }
        sideHost.appendChild(SectionCard({ title: 'Busiest rooms', icon: 'sort-desc', subtitle: 'Periods booked this week' },
          RankList(sortBy(rooms.map((rm) => ({ rm, n: slots.filter((s) => s.room === rm).length })), 'n', 'desc').slice(0, 8)
            .map((x) => ({ name: x.rm, meta: `${Math.round((x.n / total) * 100)}% utilised`, value: `${x.n}p` })))));
      };

      host.appendChild(filterCard([
        { id: 'room', label: 'Room', type: 'select', value: room, options: rooms.map((rm) => ({ value: rm, label: `${rm} — ${slots.filter((s) => s.room === rm).length} periods` })), width: '280px' },
      ], (id, value) => { if (value !== 'all') { room = value; paint(); } },
      h('div', { className: 'row' },
        Button('Room allocation', { variant: 'ghost', size: 'sm', icon: 'building', route: 'timetable/room-allocation' }),
        Button('Print', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(gridHost, `Room ${room} timetable`) }))));

      host.appendChild(h('div', { className: 'detail-split' },
        h('div', { className: 'stack' }, SectionCard({ title: `Room ${room}`, icon: 'door', subtitle: 'Cells show the section, subject and teacher' }, gridHost)),
        sideHost));

      paint();
      mount.appendChild(page({
        title: 'Room Timetable',
        subtitle: `${rooms.length} rooms at ${campusName(campusId)}`,
        route: 'timetable/room',
        actions: [Button('Room allocation', { variant: 'primary', icon: 'building', route: 'timetable/room-allocation' })],
        children: host,
      }));
    },
  },

  /* ------------------------------------------------ timetable/periods --- */
  'timetable/periods': {
    title: 'Period Settings',
    subtitle: 'Bell times, breaks and the weekly period structure',
    section: 'timetable',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const periods = db.periods;
      const teaching = periods.filter((p) => !p.isBreak);
      const dayStart = periods[0].startTime;
      const dayEnd = periods[periods.length - 1].endTime;
      const totalMin = (Number(dayEnd.slice(0, 2)) * 60 + Number(dayEnd.slice(3))) - (Number(dayStart.slice(0, 2)) * 60 + Number(dayStart.slice(3)));

      const periodForm = (p) => formPage({
        title: p ? `Edit ${p.label}` : 'Add period',
        mode: 'modal', size: 'md', submitLabel: p ? 'Save period' : 'Add period',
        values: p ? { label: p.label, start: p.startTime, end: p.endTime, isBreak: p.isBreak } : { start: '14:20', end: '15:00' },
        sections: [{
          title: 'Period', cols: 2, fields: [
            { id: 'label', label: 'Label', required: true, validate: validators.required },
            { id: 'no', label: 'Period number', type: 'number', hint: 'Leave blank for breaks' },
            { id: 'start', label: 'Starts', type: 'time', required: true, validate: validators.required },
            { id: 'end', label: 'Ends', type: 'time', required: true, validate: validators.required },
            { id: 'isBreak', label: 'Break', type: 'switch', switchLabel: 'This is a break, not a teaching period', span: 'full' },
            { id: 'days', label: 'Applies to days', type: 'multiselect', options: DAYS, span: 'full', value: DAYS },
          ],
        }],
        onSubmit: fakeSave('Period'),
      });

      mount.appendChild(page({
        title: 'Period Settings',
        subtitle: `${teaching.length} teaching periods · ${periods.length - teaching.length} breaks · ${campusName(campusId)}`,
        route: 'timetable/periods',
        actions: canEdit() ? [
          Button('Copy to another campus', { variant: 'secondary', icon: 'copy', onClick: mockAction('Copy period structure') }),
          Button('Add period', { variant: 'primary', icon: 'plus', onClick: () => periodForm(null) }),
        ] : null,
        children: [
          kpiRow([
            { label: 'Teaching periods/day', value: teaching.length, icon: 'clock', tone: 'brand' },
            { label: 'Periods/week', value: teaching.length * DAYS.length, icon: 'calendar', tone: 'info' },
            { label: 'School day', value: `${dayStart}–${dayEnd}`, icon: 'sun', tone: 'success', footer: `${Math.floor(totalMin / 60)}h ${totalMin % 60}m` },
            { label: 'Period length', value: `${teaching[0].duration} min`, icon: 'timer', tone: 'warning', footer: 'Uniform across the day' },
          ]),
          h('div', { className: 'widget-grid' },
            h('div', { className: 'span-8' }, SectionCard({
              title: 'Bell schedule', icon: 'clock', flush: true,
              subtitle: 'Applies Monday to Saturday',
            }, DataTable({
              columns: [
                { key: 'label', label: 'Period', sticky: true, width: 160, render: (p) => Identity(p.label, p.isBreak ? 'Break' : `Period ${p.no}`), value: (p) => p.startTime },
                { key: 'startTime', label: 'Starts', width: 110, className: 't-num' },
                { key: 'endTime', label: 'Ends', width: 110, className: 't-num' },
                { key: 'duration', label: 'Minutes', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'isBreak', label: 'Type', width: 130, render: (p) => Badge(p.isBreak ? 'Break' : 'Teaching', { tone: p.isBreak ? 'warning' : 'success' }), value: (p) => (p.isBreak ? 'Break' : 'Teaching') },
                {
                  key: 'slots', label: 'Periods scheduled', width: 170, align: 'right', numeric: true,
                  value: (p) => (p.isBreak ? 0 : slotsForCampus(campusId).filter((s) => s.periodNo === p.no).length),
                  render: (p) => (p.isBreak ? h('span', { className: 't-faint' }, '—') : formatNumber(slotsForCampus(campusId).filter((s) => s.periodNo === p.no).length)),
                },
              ],
              rows: periods, paginate: false, footerAggregates: true, maxHeight: 'none', exportName: 'period-settings',
              rowActions: (p) => (canEdit() ? [
                { label: 'Edit period', icon: 'edit', onClick: () => periodForm(p) },
                { label: 'Shift by 5 minutes', icon: 'timer', onClick: () => toast('Bell shifted', `${p.label} now starts 5 minutes later.`) },
                { separator: true },
                {
                  label: 'Delete period', icon: 'trash', tone: 'danger',
                  onClick: () => confirmThen({ title: `Delete ${p.label}?`, text: 'Every timetable using this period will need rebuilding.', tone: 'danger', confirmLabel: 'Delete', icon: 'trash' },
                    () => toast('Period deleted', p.label, 'danger')),
                },
              ] : [{ label: 'View usage', icon: 'eye', route: 'timetable/master' }]),
              emptyState: EmptyState({ icon: 'clock', title: 'No periods configured', text: 'Add the first period to define the school day.' }),
            }))),
            h('div', { className: 'span-4' }, h('div', { className: 'stack-3' },
              SectionCard({ title: 'Day composition', className: 'chart-card', icon: 'chart-pie' },
                donutChart({
                  data: [
                    { key: 'Teaching', value: teaching.reduce((a, p) => a + p.duration, 0) },
                    { key: 'Breaks', value: periods.filter((p) => p.isBreak).length * 20 },
                  ],
                  height: 220, centerValue: `${Math.floor(totalMin / 60)}h`, centerLabel: 'School day',
                })),
              SectionCard({ title: 'Structure rules', icon: 'sliders' },
                h('div', { className: 'stack-2' },
                  Switch('Saturday is a working day', { checked: true, description: 'Six-day week with a shorter Saturday.', onChange: (v) => toast('Setting updated', v ? 'Saturday enabled.' : 'Saturday disabled.', 'info') }),
                  Switch('Allow double periods', { checked: true, description: 'Labs and practicals may occupy two consecutive periods.', onChange: () => toast('Setting updated', 'Double periods allowed.', 'info') }),
                  Switch('Zero period (07:20)', { checked: false, description: 'Optional remedial period before assembly.', onChange: () => toast('Setting updated', 'Zero period toggled.', 'info') }),
                  Switch('Lock bell times', { checked: true, description: 'Prevents accidental edits once published.', onChange: () => toast('Setting updated', 'Bell times locked.', 'info') }))),
              SectionCard({ title: 'Assembly & dispersal', icon: 'megaphone' },
                DescriptionList([
                  ['Gate opens', '07:30'], ['Assembly', '07:45 – 08:00'],
                  ['First bell', dayStart], ['Dispersal', dayEnd],
                  ['Late cut-off', '08:10'], ['Bus departure', '14:35'],
                ], { cols: 1 }))))),
          Callout({ tone: 'warning', icon: 'alert-triangle', title: 'Changing the bell schedule rebuilds timetables' },
            'Adding or removing a teaching period invalidates every published class timetable at this campus. Publish a fresh set from the Timetable Builder afterwards.'),
        ],
      }));
    },
  },

  /* ------------------------------------------- timetable/substitution --- */
  'timetable/substitution': {
    title: 'Substitution',
    subtitle: 'Cover absent teachers with ranked, free, subject-matched staff',
    section: 'timetable',
    render(mount, ctx) { renderSubstitution(mount, ctx, 'timetable/substitution'); },
  },

  /* ---------------------------------------- timetable/room-allocation --- */
  'timetable/room-allocation': {
    title: 'Room Allocation',
    subtitle: 'Rooms, labs and their weekly utilisation',
    section: 'timetable',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const slots = slotsForCampus(campusId);
      const rooms = roomsFor(campusId);
      const total = teachingPeriods().length * DAYS.length;
      const conflicts = timetableConflicts(campusId).filter((c) => c.type === 'Room clash');

      const rows = rooms.map((rm) => {
        const mine = slots.filter((s) => s.room === rm);
        const homeSection = sectionsFor(campusId).find((s) => s.roomNo === rm);
        const isLab = rm.startsWith('LAB') || ['ART-01', 'MUS-01', 'AUD-01', 'SPORT-GR'].includes(rm);
        return {
          id: rm,
          room: rm,
          type: isLab ? (rm.startsWith('LAB') ? 'Laboratory' : 'Special') : 'Classroom',
          floor: rm.startsWith('G') ? 'Ground' : rm.startsWith('1') ? 'First' : rm.startsWith('2') ? 'Second' : 'Block B',
          capacity: isLab ? 36 : homeSection ? homeSection.capacity : 40,
          homeSection: homeSection ? homeSection.label : '—',
          booked: mine.length,
          free: total - mine.length,
          utilisation: Math.round((mine.length / total) * 100),
          sections: new Set(mine.map((s) => s.sectionId)).size,
          clashes: conflicts.filter((c) => c.entityId === rm).length,
          status: conflicts.some((c) => c.entityId === rm) ? 'Double booked' : mine.length === 0 ? 'Unused' : mine.length / total > 0.85 ? 'At capacity' : 'Active',
        };
      });

      mount.appendChild(listPage({
        title: 'Room Allocation',
        subtitle: `${rooms.length} rooms · ${Math.round(rows.reduce((a, r) => a + r.utilisation, 0) / Math.max(1, rows.length))}% average utilisation at ${campusName(campusId)}`,
        route: 'timetable/room-allocation',
        actions: canEdit() ? [
          Button('Room timetable', { variant: 'secondary', icon: 'door', route: 'timetable/room' }),
          Button('Add room', {
            variant: 'primary', icon: 'plus',
            onClick: () => formPage({
              title: 'Add room', mode: 'modal', submitLabel: 'Add room',
              sections: [{
                title: 'Room', cols: 2, fields: [
                  { id: 'room', label: 'Room number', required: true, placeholder: 'G21', validate: validators.required },
                  { id: 'type', label: 'Type', type: 'select', options: ['Classroom', 'Laboratory', 'Special'], required: true },
                  { id: 'floor', label: 'Floor', type: 'select', options: ['Ground', 'First', 'Second', 'Block B'] },
                  { id: 'capacity', label: 'Capacity', type: 'number', value: 40, validate: validators.number },
                  { id: 'facilities', label: 'Facilities', type: 'multiselect', options: ['Smart board', 'Projector', 'AC', 'Lab benches', 'Sink', 'Fume hood', 'Piano'], span: 'full' },
                ],
              }],
              onSubmit: fakeSave('Room'),
            }),
          }),
        ] : null,
        kpis: [
          { label: 'Rooms', value: rooms.length, icon: 'door', tone: 'brand' },
          { label: 'Average utilisation', value: `${Math.round(rows.reduce((a, r) => a + r.utilisation, 0) / Math.max(1, rows.length))}%`, icon: 'gauge', tone: 'info' },
          { label: 'Unused rooms', value: rows.filter((r) => r.booked === 0).length, icon: 'archive', tone: 'warning' },
          { label: 'Double bookings', value: conflicts.length, icon: 'alert-triangle', tone: conflicts.length ? 'danger' : 'success', route: 'timetable/conflicts' },
        ],
        chart: barChart({
          categories: sortBy(rows, 'utilisation', 'desc').slice(0, 14).map((r) => r.room),
          series: [{ name: 'Utilisation', values: sortBy(rows, 'utilisation', 'desc').slice(0, 14).map((r) => r.utilisation) }],
          valueFormat: 'percent0', showValues: true, target: 75, targetLabel: 'Target 75%', height: 260,
        }),
        chartTitle: 'Busiest rooms this week',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Room or section…', width: '220px' },
          { id: 'type', label: 'Type', options: ['Classroom', 'Laboratory', 'Special'] },
          { id: 'floor', label: 'Floor', options: Array.from(new Set(rows.map((r) => r.floor))) },
          { id: 'status', label: 'Status', options: ['Active', 'Unused', 'At capacity', 'Double booked'] },
        ],
        onFilter: (id, value, all, table) => {
          let out = rows.slice();
          if (all.q) out = search(out, all.q, ['room', 'homeSection']);
          for (const k of ['type', 'floor', 'status']) if (all[k] && all[k] !== 'all') out = out.filter((r) => r[k] === all[k]);
          table.refresh(out);
        },
        columns: [
          { key: 'room', label: 'Room', sticky: true, width: 140, render: (r) => Identity(r.room, `${r.type} · ${r.floor}`), value: (r) => r.room },
          { key: 'type', label: 'Type', width: 130, filter: true, render: (r) => Badge(r.type, { tone: r.type === 'Laboratory' ? 'info' : r.type === 'Special' ? 'brand' : 'neutral' }) },
          { key: 'floor', label: 'Floor', width: 110, filter: true },
          { key: 'homeSection', label: 'Home section', width: 170 },
          { key: 'capacity', label: 'Seats', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'booked', label: 'Booked', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'free', label: 'Free', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
          {
            key: 'utilisation', label: 'Utilisation', width: 180, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v)}%`,
            render: (r) => h('div', { className: 'stack-1' },
              h('span', { className: 't-xs t-num' }, `${r.utilisation}%`),
              ProgressBar(r.utilisation, { max: 100, size: 'sm', tone: r.utilisation > 90 ? 'danger' : r.utilisation > 60 ? 'success' : 'warning' })),
          },
          { key: 'sections', label: 'Sections', width: 100, align: 'right', numeric: true },
          { key: 'clashes', label: 'Clashes', width: 100, align: 'right', numeric: true, render: (r) => (r.clashes ? Badge(String(r.clashes), { tone: 'danger' }) : h('span', { className: 't-faint' }, '0')) },
          { key: 'status', label: 'Status', width: 150, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        selectable: true,
        footerAggregates: true,
        searchKeys: ['room', 'type', 'homeSection'],
        pageSize: 50,
        exportName: 'room-allocation',
        bulkActions: [
          { label: 'Mark under maintenance', icon: 'wrench', onClick: (sel) => toast('Rooms blocked', `${sel.length} rooms marked unavailable.`, 'warning') },
          { label: 'Export', icon: 'download', onClick: (sel) => toast('Export ready', `${sel.length} rooms exported.`) },
        ],
        rowActions: (r) => [
          { label: 'Room timetable', icon: 'door', route: 'timetable/room/' + r.room },
          { label: 'Conflict report', icon: 'alert-triangle', route: 'timetable/conflicts' },
          { separator: true },
          canEdit() && { label: 'Reassign home section', icon: 'columns', onClick: () => toast('Reassignment queued', r.room) },
        ].filter(Boolean),
        onRowClick: (r) => navigate('timetable/room/' + r.room),
        emptyState: EmptyState({ icon: 'door', title: 'No rooms match', text: 'Adjust the filters or add a room.' }),
      }));
    },
  },

  /* ---------------------------------------------- timetable/conflicts --- */
  'timetable/conflicts': {
    title: 'Conflict Report',
    subtitle: 'Every clash the scheduler can see, ranked by severity',
    section: 'timetable',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const conflicts = timetableConflicts(campusId);
      const byType = countBy(conflicts, 'type');
      const byDay = DAYS.map((d) => conflicts.filter((c) => c.day === d).length);

      mount.appendChild(reportPage({
        title: 'Conflict Report',
        subtitle: `${conflicts.length} open issues at ${campusName(campusId)} · session ${db.academicYears.find((y) => y.current).name}`,
        route: 'timetable/conflicts',
        filters: [
          { id: 'type', label: 'Conflict type', options: byType.map((t) => t.key) },
          { id: 'severity', label: 'Severity', type: 'segment', options: [{ id: 'all', label: 'All' }, { id: 'Critical', label: 'Critical' }, { id: 'Major', label: 'Major' }] },
          { id: 'day', label: 'Day', options: DAYS },
        ],
        onFilter: (id, value, all, table) => {
          let out = conflicts.slice();
          for (const k of ['type', 'day']) if (all[k] && all[k] !== 'all') out = out.filter((c) => c[k] === all[k]);
          if (all.severity && all.severity !== 'all') out = out.filter((c) => c.severity === all.severity);
          if (table) table.refresh(out);
        },
        summary: [
          { label: 'Total conflicts', value: conflicts.length, icon: 'alert-triangle', tone: conflicts.length ? 'danger' : 'success' },
          { label: 'Teacher double-booked', value: conflicts.filter((c) => c.type === 'Teacher double-booked').length, icon: 'user-x', tone: 'danger' },
          { label: 'Room clashes', value: conflicts.filter((c) => c.type === 'Room clash').length, icon: 'door', tone: 'warning' },
          { label: 'Workload breaches', value: conflicts.filter((c) => c.type === 'Workload exceeded').length, icon: 'gauge', tone: 'warning', route: 'teachers/workload' },
        ],
        chart: [
          barChart({ categories: DAYS.map((d) => DAY_SHORT[d]), series: [{ name: 'Conflicts', values: byDay }], showValues: true, height: 240 }),
          donutChart({ data: byType, height: 240, centerValue: String(conflicts.length), centerLabel: 'Conflicts' }),
        ],
        chartTitle: 'Conflicts by day and type',
        columns: [
          { key: 'id', label: 'Ref', width: 110, className: 't-mono' },
          {
            key: 'type', label: 'Conflict', sticky: true, width: 200, filter: true,
            render: (c) => Identity(c.type, c.severity, { size: 'xs' }), value: (c) => c.type,
          },
          { key: 'severity', label: 'Severity', width: 120, filter: true, render: (c) => Badge(c.severity, { tone: c.severity === 'Critical' ? 'danger' : 'warning' }) },
          { key: 'day', label: 'Day', width: 110, filter: true },
          { key: 'periodNo', label: 'Period', width: 90, align: 'center', numeric: true, render: (c) => (c.periodNo ? 'P' + c.periodNo : '—') },
          { key: 'time', label: 'Time', width: 130, className: 't-num' },
          { key: 'entity', label: 'Teacher / room', width: 200 },
          { key: 'classes', label: 'Sections involved', width: 240 },
          { key: 'detail', label: 'Detail', width: 380, render: (c) => h('span', { className: 't-clamp-2' }, c.detail) },
          { key: 'status', label: 'Status', width: 110, render: (c) => Badge(c.status) },
        ],
        rows: conflicts,
        tableTitle: 'Conflict register',
        footerAggregates: false,
        pageSize: 50,
        notes: conflicts.length
          ? Callout({ tone: 'danger', icon: 'alert-triangle', title: 'Publishing is blocked while critical conflicts remain' },
            h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-3)' } },
              h('span', null, `${conflicts.filter((c) => c.severity === 'Critical').length} critical clashes must be resolved. Open the builder for the affected section, or run auto-resolve to shuffle the least disruptive period.`),
              Button('Open builder', { variant: 'secondary', size: 'sm', icon: 'tool', route: 'timetable/builder' }),
              Button('Auto-resolve', {
                variant: 'primary', size: 'sm', icon: 'zap',
                onClick: () => confirmThen({
                  title: 'Auto-resolve conflicts?',
                  text: 'The scheduler will move the least disruptive period in each clash and re-check. Changes stay in draft until you publish.',
                  confirmLabel: 'Run auto-resolve', icon: 'zap',
                }, () => toast('Auto-resolve complete', `${conflicts.length} conflicts processed — review the builder.`)),
              })))
          : Callout({ tone: 'success', icon: 'check-circle', title: 'No conflicts' },
            'Every teacher and room at this campus is free at the time it is scheduled. The timetable is ready to publish.'),
      }));
    },
  },

  /* ------------------------------------------------ timetable/publish --- */
  'timetable/publish': {
    title: 'Publish Timetable',
    subtitle: 'Pre-flight checks, section-wise status and release',
    section: 'timetable',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const secs = sectionsFor(campusId);
      const slots = slotsForCampus(campusId);
      const conflicts = timetableConflicts(campusId);
      const expected = teachingPeriods().length * DAYS.length;

      const rows = secs.map((s) => {
        const mine = slots.filter((x) => x.sectionId === s.id);
        const gaps = expected - mine.length;
        const unassigned = mine.filter((x) => !x.teacherId).length;
        const clashes = conflicts.filter((c) => c.classes && c.classes.includes(`${(db.classes.find((cc) => cc.id === s.classId) || {}).name}-${s.name}`)).length;
        const ready = gaps === 0 && unassigned === 0 && clashes === 0;
        return {
          id: s.id, label: s.label, className: (db.classes.find((c) => c.id === s.classId) || {}).name || '', section: s.name,
          room: s.roomNo, strength: strengthOf(s.id),
          periods: mine.length, gaps, unassigned, clashes,
          coverage: Math.round((mine.length / expected) * 100),
          status: ready ? 'Ready' : clashes ? 'Blocked' : gaps ? 'Incomplete' : 'Under Review',
          classTeacher: (db.staff.find((x) => x.id === s.classTeacherId) || {}).name || 'Not assigned',
          classTeacherId: s.classTeacherId,
        };
      });
      const ready = rows.filter((r) => r.status === 'Ready');
      const blocked = rows.filter((r) => r.status === 'Blocked');

      const checks = [
        { label: 'All sections have a grid', ok: rows.every((r) => r.periods > 0), detail: `${rows.filter((r) => r.periods > 0).length} of ${rows.length} sections` },
        { label: 'No teacher double-booked', ok: !conflicts.some((c) => c.type === 'Teacher double-booked'), detail: `${conflicts.filter((c) => c.type === 'Teacher double-booked').length} clashes` },
        { label: 'No room clashes', ok: !conflicts.some((c) => c.type === 'Room clash'), detail: `${conflicts.filter((c) => c.type === 'Room clash').length} clashes` },
        { label: 'Workload within ceiling', ok: !conflicts.some((c) => c.type === 'Workload exceeded'), detail: `${conflicts.filter((c) => c.type === 'Workload exceeded').length} teachers over ${MAX_WEEKLY_PERIODS} periods` },
        { label: 'Every period has a teacher', ok: rows.every((r) => r.unassigned === 0), detail: `${rows.reduce((a, r) => a + r.unassigned, 0)} unassigned periods` },
        { label: 'Class teachers assigned', ok: rows.every((r) => r.classTeacherId), detail: `${rows.filter((r) => !r.classTeacherId).length} sections without a class teacher` },
      ];
      const blockers = checks.filter((c) => !c.ok);

      const host = h('div', { className: 'stack' });
      host.appendChild(kpiRow([
        { label: 'Sections', value: rows.length, icon: 'columns', tone: 'brand' },
        { label: 'Ready to publish', value: ready.length, icon: 'check-circle', tone: 'success', footer: `${Math.round((ready.length / Math.max(1, rows.length)) * 100)}% of sections` },
        { label: 'Blocked', value: blocked.length, icon: 'alert-triangle', tone: blocked.length ? 'danger' : 'success' },
        { label: 'Students affected', value: formatNumber(rows.reduce((a, r) => a + r.strength, 0)), icon: 'graduation-cap', tone: 'info' },
      ]));

      host.appendChild(Card({ pad: true },
        Stepper([
          { label: 'Build', description: 'Grids created for every section', state: rows.every((r) => r.periods) ? 'done' : 'current' },
          { label: 'Validate', description: 'Conflicts and workload checked', state: blockers.length ? 'current' : 'done' },
          { label: 'Approve', description: 'Signed off by the Principal', state: blockers.length ? 'todo' : 'current' },
          { label: 'Publish', description: 'Visible on all portals', state: 'todo' },
        ], { current: blockers.length ? 1 : 2 })));

      host.appendChild(h('div', { className: 'detail-split' },
        h('div', { className: 'stack' },
          SectionCard({ title: 'Section readiness', icon: 'columns', flush: true, subtitle: `${rows.length} sections at ${campusName(campusId)}` },
            DataTable({
              columns: [
                { key: 'label', label: 'Section', sticky: true, width: 170, render: (r) => Identity(r.label, `Room ${r.room} · ${r.strength} students`), value: (r) => r.label },
                { key: 'periods', label: 'Periods', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
                {
                  key: 'coverage', label: 'Coverage', width: 170, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v)}%`,
                  render: (r) => h('div', { className: 'stack-1' },
                    h('span', { className: 't-xs t-num' }, `${r.coverage}%`),
                    ProgressBar(r.coverage, { max: 100, size: 'sm', tone: r.coverage === 100 ? 'success' : 'warning' })),
                },
                { key: 'gaps', label: 'Gaps', width: 90, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'unassigned', label: 'No teacher', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'clashes', label: 'Clashes', width: 100, align: 'right', numeric: true, aggregate: 'sum', render: (r) => (r.clashes ? Badge(String(r.clashes), { tone: 'danger' }) : h('span', { className: 't-faint' }, '0')) },
                { key: 'classTeacher', label: 'Class teacher', width: 200, render: (r) => (r.classTeacherId ? Identity(r.classTeacher, 'Class teacher', { onClick: () => navigate('teachers/profile/' + r.classTeacherId) }) : Badge('Unassigned', { tone: 'warning' })), value: (r) => r.classTeacher },
                { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
              ],
              rows, pageSize: 25, selectable: true, footerAggregates: true,
              searchKeys: ['label', 'classTeacher'], exportName: 'timetable-publish-status',
              bulkActions: [
                { label: 'Publish selected', icon: 'send', onClick: (sel) => toast('Published', `${sel.length} section timetables released.`) },
                { label: 'Notify class teachers', icon: 'megaphone', onClick: (sel) => toast('Notifications sent', `${sel.length} class teachers informed.`) },
              ],
              rowActions: (r) => [
                { label: 'Preview grid', icon: 'eye', route: 'timetable/class/' + r.id },
                canEdit() && { label: 'Fix in builder', icon: 'tool', route: 'timetable/builder/' + r.id },
                { separator: true },
                canEdit() && { label: 'Publish this section', icon: 'send', onClick: () => toast('Published', `${r.label} released to portals.`) },
              ].filter(Boolean),
              onRowClick: (r) => navigate('timetable/class/' + r.id),
              emptyState: EmptyState({ icon: 'columns', title: 'No sections', text: 'Create sections before publishing a timetable.' }),
            }))),
        h('div', { className: 'stack-3' },
          SectionCard({ title: 'Pre-flight checks', icon: 'clipboard-check', subtitle: `${checks.length - blockers.length} of ${checks.length} passing` },
            h('div', { className: 'stack-2' }, checks.map((c) => h('div', { className: 'row-3', style: { alignItems: 'flex-start' } },
              Icon(c.ok ? 'check-circle' : 'alert-triangle', 16),
              h('div', { className: 'stack-1 flex-1' },
                h('span', { className: 't-sm t-medium' }, c.label),
                h('span', { className: 't-xs t-muted' }, c.detail)),
              Badge(c.ok ? 'Pass' : 'Fail', { tone: c.ok ? 'success' : 'danger' }))))),
          SectionCard({ title: 'Release settings', icon: 'settings' },
            h('div', { className: 'stack-2' },
              Switch('Notify students & parents', { checked: true, description: 'Push notification plus an in-app card.' }),
              Switch('Notify teachers', { checked: true, description: 'Each teacher receives their personal grid.' }),
              Switch('Publish to parent portal', { checked: true }),
              Switch('Lock editing after publish', { checked: false, description: 'Changes then require a change request.' }),
              Field({ label: 'Effective from' }, DatePicker({ value: '2026-08-24', width: '100%' })))),
          SectionCard({ title: 'Publication history', icon: 'history' },
            Timeline([
              { title: 'Version 4 published', meta: '12 Aug 2026', text: 'Post-PT2 revision · 74 sections', icon: 'send', tone: 'success' },
              { title: 'Version 3 published', meta: '01 Jul 2026', text: 'Term 1 mid-cycle adjustment', icon: 'send', tone: 'success' },
              { title: 'Version 2 published', meta: '15 Apr 2026', text: 'Post-admission rebalance', icon: 'send', tone: 'info' },
              { title: 'Version 1 published', meta: '01 Apr 2026', text: 'Session opening timetable', icon: 'send', tone: 'info' },
            ])))));

      mount.appendChild(page({
        title: 'Publish Timetable',
        subtitle: `${ready.length} of ${rows.length} sections ready · ${conflicts.length} open conflicts`,
        route: 'timetable/publish',
        actions: canEdit() ? [
          Button('Conflict report', { variant: 'secondary', icon: 'alert-triangle', route: 'timetable/conflicts' }),
          Button(blockers.length ? `Resolve ${blockers.length} blockers` : 'Publish to all portals', {
            variant: blockers.length ? 'danger' : 'primary',
            icon: blockers.length ? 'alert-triangle' : 'send',
            onClick: () => {
              if (blockers.length) { navigate('timetable/conflicts'); return; }
              confirmThen({
                title: `Publish ${rows.length} section timetables?`,
                text: `${formatNumber(rows.reduce((a, r) => a + r.strength, 0))} students, their parents and ${new Set(slots.map((s) => s.teacherId)).size} teachers will be notified immediately.`,
                confirmLabel: 'Publish now', icon: 'send',
              }, () => toast('Timetable published', `${rows.length} sections live from 24 Aug 2026.`));
            },
          }),
        ] : [Button('View master timetable', { variant: 'primary', icon: 'table', route: 'timetable/master' })],
        children: host,
      }));
    },
  },
};

/* ==========================================================================
   6 · shared substitution screen (used by two nav entries)
   ========================================================================== */

function renderSubstitution(mount, ctx, route) {
  ensureStyles();
  const campusId = currentCampus(ctx);
  const teachers = teachersFor(campusId);
  const allTeaching = db.staff.filter((s) => s.campusId === campusId && s.type === 'Teaching');
  const load = teacherLoad(campusId);
  const idx = slotIndex(campusId);

  let date = TODAY;
  const dayFor = (iso) => DAYS[Math.max(0, parseISO(iso).getDay() - 1)] || 'Monday';

  const _absentCache = new Map();
  const absentFor = (iso) => {
    if (_absentCache.has(iso)) return _absentCache.get(iso);
    const out = computeAbsent(iso);
    _absentCache.set(iso, out);
    return out;
  };
  const computeAbsent = (iso) => {
    const day = dayFor(iso);
    const onLeave = allTeaching.filter((s) => s.status === 'On Leave');
    const approved = db.leaveRequests.filter((l) => l.campusId === campusId && l.status === 'Approved'
      && l.fromDate <= iso && l.toDate >= iso);
    const ids = new Set([...onLeave.map((s) => s.id), ...approved.map((l) => l.employeeId)]);
    return Array.from(ids).map((id) => {
      const t = db.staff.find((s) => s.id === id);
      if (!t || t.type !== 'Teaching') return null;
      const lr = approved.find((l) => l.employeeId === id);
      const slots = slotsForTeacher(id).filter((s) => s.day === day);
      return {
        teacher: t,
        reason: lr ? lr.leaveType : 'On Leave',
        note: lr ? lr.reason : 'Marked on leave in HR',
        from: lr ? lr.fromDate : iso,
        to: lr ? lr.toDate : iso,
        slots,
      };
    }).filter(Boolean).filter((a) => a.slots.length);
  };

  /** Rank candidate substitutes for one uncovered period. */
  const suggestions = (slot, day) => {
    const busy = new Set((idx.get(`${day}|${slot.periodNo}`) || []).map((s) => s.teacherId));
    const absentIds = new Set(absentFor(date).map((a) => a.teacher.id));
    return teachers
      .filter((t) => !absentIds.has(t.id))
      .map((t) => {
        const free = !busy.has(t.id);
        const match = t.subjects.includes(slot.subjectCode);
        const n = load.get(t.id) || 0;
        const freePeriodsToday = teachingPeriods().length - slotsForTeacher(t.id).filter((s) => s.day === day).length;
        const score = (free ? 55 : 0) + (match ? 30 : 0) + clamp(Math.round((MAX_WEEKLY_PERIODS - n) / 2), 0, 15);
        return { teacher: t, free, match, weekly: n, freePeriodsToday, score };
      })
      .filter((c) => c.free)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  };

  const host = h('div', { className: 'stack' });
  const boardHost = h('div');

  const assignModal = (absent, slot) => {
    const day = dayFor(date);
    const ranked = suggestions(slot, day);
    let chosen = ranked.length ? ranked[0].teacher.id : null;
    if (!ranked.length) {
      notify({ title: 'No free teacher', text: `Every teacher is busy in period ${slot.periodNo} on ${day}.`, tone: 'danger' });
      return;
    }
    Modal({
      title: 'Arrange a substitute',
      subtitle: `${slot.className}-${slot.section} · Period ${slot.periodNo} · ${slot.subjectName}`,
      icon: 'refresh-ccw', size: 'xl',
      body: h('div', { className: 'stack-3' },
        Callout({ tone: 'info', icon: 'sparkles', title: 'How candidates are ranked' },
          'Free in this slot (55 points) + teaches the same subject (30) + spare weekly capacity (up to 15). Busy teachers are excluded.'),
        DataTable({
          columns: [
            {
              key: 'name', label: 'Teacher', sticky: true, width: 220,
              render: (c) => Identity(c.teacher.name, c.teacher.designation), value: (c) => c.teacher.name,
            },
            { key: 'match', label: 'Subject match', width: 140, align: 'center', render: (c) => (c.match ? Badge('Teaches ' + slot.subjectCode, { tone: 'success' }) : Badge('Other subject', { tone: 'neutral' })), value: (c) => (c.match ? 1 : 0) },
            { key: 'freePeriodsToday', label: 'Free today', width: 120, align: 'right', numeric: true },
            { key: 'weekly', label: 'Weekly load', width: 150, align: 'right', numeric: true, render: (c) => h('div', { className: 'stack-1' }, h('span', { className: 't-xs t-num' }, `${c.weekly}/${MAX_WEEKLY_PERIODS}`), ProgressBar(Math.min(c.weekly, MAX_WEEKLY_PERIODS), { max: MAX_WEEKLY_PERIODS, size: 'sm', tone: loadTone(c.weekly) })) },
            { key: 'score', label: 'Fit score', width: 110, align: 'right', numeric: true, render: (c) => Badge(String(c.score), { tone: c.score > 80 ? 'success' : c.score > 60 ? 'warning' : 'neutral' }) },
            {
              key: 'pick', label: '', width: 110, sortable: false,
              render: (c) => Button(chosen === c.teacher.id ? 'Selected' : 'Select', {
                variant: chosen === c.teacher.id ? 'primary' : 'secondary', size: 'sm',
                onClick: () => { chosen = c.teacher.id; toast('Candidate selected', c.teacher.name, 'info'); },
              }),
            },
          ],
          rows: ranked, paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
        }),
        Field({ label: 'Note to the substitute' }, Textarea({ rows: 2, placeholder: 'Carry the Chapter 6 worksheet; students have already read the text.' }))),
      actions: (close) => frag(
        Button('Cancel', { variant: 'ghost', onClick: close }),
        Button('Notify & assign', {
          variant: 'primary', icon: 'send',
          onClick: () => {
            const t = db.staff.find((s) => s.id === chosen);
            close();
            toast('Substitute assigned', `${t ? t.name : chosen} covers ${slot.className}-${slot.section} period ${slot.periodNo}.`);
          },
        })),
    });
  };

  const paintBoard = () => {
    const day = dayFor(date);
    const absents = absentFor(date);
    const uncovered = absents.flatMap((a) => a.slots.map((s) => ({ absent: a, slot: s })));
    boardHost.innerHTML = '';

    if (!absents.length) {
      boardHost.appendChild(Card({ pad: true }, EmptyState({
        icon: 'check-circle', tone: 'success',
        title: 'Nobody is absent',
        text: `Every teacher is present on ${formatDate(date, 'long')} — no cover is needed.`,
        action: Button('Open the register', { variant: 'secondary', icon: 'list', onClick: () => tabs.setActive('register') }),
      })));
      return;
    }

    boardHost.appendChild(h('div', { className: 'stack' },
      absents.map((a) => SectionCard({
        title: a.teacher.name,
        subtitle: `${a.teacher.designation} · ${a.reason} · ${formatDate(a.from, 'dayMonth')} – ${formatDate(a.to, 'dayMonth')}`,
        icon: 'user-x',
        actions: h('div', { className: 'row' },
          Badge(`${a.slots.length} periods to cover`, { tone: 'warning' }),
          Button('Auto-assign all', {
            variant: 'secondary', size: 'sm', icon: 'zap',
            onClick: () => confirmThen({
              title: `Auto-assign ${a.slots.length} substitutes?`,
              text: 'Each period goes to the highest-ranked free teacher. You can override any of them afterwards.',
              confirmLabel: 'Auto-assign', icon: 'zap',
            }, () => toast('Substitutes assigned', `${a.slots.length} periods covered for ${a.teacher.name}.`)),
          })),
      },
        DataTable({
          columns: [
            { key: 'periodNo', label: 'Period', width: 90, align: 'center', numeric: true, render: (s) => Badge('P' + s.periodNo, { tone: 'neutral', outline: true }), value: (s) => s.periodNo },
            { key: 'startTime', label: 'Time', width: 130, className: 't-num', render: (s) => `${s.startTime}–${s.endTime}` },
            { key: 'className', label: 'Section', width: 140, render: (s) => `${s.className}-${s.section}` },
            {
              key: 'subjectName', label: 'Subject', width: 180,
              render: (s) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, subjectSwatch(s.subjectCode), s.subjectName),
              value: (s) => s.subjectName,
            },
            { key: 'room', label: 'Room', width: 100, className: 't-mono' },
            {
              key: 'suggested', label: 'Top suggestion', width: 250, sortable: false,
              render: (s) => {
                const r = suggestions(s, day)[0];
                return r
                  ? Identity(r.teacher.name, `${r.match ? 'teaches ' + s.subjectCode + ' · ' : ''}${r.freePeriodsToday} free today · fit ${r.score}`)
                  : Badge('No free teacher', { tone: 'danger' });
              },
            },
            {
              key: 'action', label: '', width: 140, sortable: false,
              render: (s) => Button('Assign', { variant: 'primary', size: 'sm', icon: 'user-check', onClick: () => assignModal(a, s) }),
            },
          ],
          rows: a.slots, paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
          emptyState: EmptyState({ icon: 'calendar', title: 'No periods today', text: `${a.teacher.name} has no scheduled periods on ${day}.` }),
        })))));

    boardHost.appendChild(Callout({ tone: 'info', icon: 'info', title: `${uncovered.length} periods need cover on ${formatDate(date)}` },
      'Suggestions are ranked by availability, subject match and spare weekly capacity. Assigning notifies the substitute on the teacher portal and by SMS.'));
  };

  /* ---- register tab ---- */
  const registerTable = () => {
    const rows = db.substitutions.filter((s) => s.campusId === campusId);
    return DataTable({
      columns: [
        { key: 'id', label: 'Ref', width: 110, className: 't-mono' },
        { key: 'date', label: 'Date', width: 130, render: (r) => formatDate(r.date), value: (r) => r.date },
        { key: 'className', label: 'Section', width: 140, filter: true, render: (r) => `${r.className}-${r.section}` },
        { key: 'periodNo', label: 'Period', width: 90, align: 'center', numeric: true, render: (r) => 'P' + r.periodNo },
        { key: 'subjectName', label: 'Subject', width: 170, filter: true },
        {
          key: 'absentTeacherName', label: 'Absent teacher', width: 210,
          render: (r) => Identity(r.absentTeacherName, r.reason, { onClick: () => navigate('teachers/profile/' + r.absentTeacherId) }),
          value: (r) => r.absentTeacherName,
        },
        {
          key: 'substituteTeacherName', label: 'Substitute', width: 210,
          render: (r) => (r.substituteTeacherId ? Identity(r.substituteTeacherName, 'Covering', { onClick: () => navigate('teachers/profile/' + r.substituteTeacherId) }) : Badge('Not arranged', { tone: 'danger' })),
          value: (r) => r.substituteTeacherName,
        },
        { key: 'reason', label: 'Reason', width: 160, filter: true },
        { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
      ],
      rows, pageSize: 25, selectable: true, searchKeys: ['className', 'absentTeacherName', 'substituteTeacherName', 'subjectName'],
      exportName: 'substitution-register',
      bulkActions: [
        { label: 'Confirm', icon: 'check-circle', onClick: (sel) => toast('Confirmed', `${sel.length} substitutions confirmed.`) },
        { label: 'Notify substitutes', icon: 'send', onClick: (sel) => toast('Notifications sent', `${sel.length} teachers informed.`) },
      ],
      rowActions: (r) => [
        { label: 'Teacher timetable', icon: 'presentation', route: 'timetable/teacher/' + r.absentTeacherId },
        { label: 'Class timetable', icon: 'grid', route: 'timetable/master' },
        { separator: true },
        canEdit() && { label: 'Change substitute', icon: 'refresh-ccw', onClick: () => toast('Reassignment', 'Pick a new substitute from the board tab.', 'info') },
        canEdit() && {
          label: 'Cancel substitution', icon: 'x-circle', tone: 'danger',
          onClick: () => confirmThen({ title: 'Cancel this substitution?', text: `${r.substituteTeacherName} will be notified.`, tone: 'danger', confirmLabel: 'Cancel it', icon: 'x-circle' },
            () => toast('Substitution cancelled', r.id, 'warning')),
        },
      ].filter(Boolean),
      emptyState: EmptyState({ icon: 'refresh-ccw', title: 'No substitutions yet', text: 'Records appear once cover has been arranged.' }),
    });
  };

  const tabHost = h('div');
  const tabs = Tabs([
    { id: 'board', label: 'Cover board', icon: 'grid', count: absentFor(date).length },
    { id: 'register', label: 'Register', icon: 'list', count: db.substitutions.filter((s) => s.campusId === campusId).length },
    { id: 'analysis', label: 'Analysis', icon: 'chart-bar' },
  ], (id) => paintTab(id), { active: 'board' });

  function paintTab(id) {
    tabHost.innerHTML = '';
    if (id === 'board') { tabHost.appendChild(boardHost); paintBoard(); return; }
    if (id === 'register') {
      tabHost.appendChild(SectionCard({ title: 'Substitution register', icon: 'list', flush: true, subtitle: 'Every arranged cover this session' }, registerTable()));
      return;
    }
    const subs = db.substitutions.filter((s) => s.campusId === campusId);
    const byReason = countBy(subs, 'reason');
    const byTeacher = countBy(subs, 'substituteTeacherName').slice(0, 10);
    tabHost.appendChild(h('div', { className: 'widget-grid' },
      h('div', { className: 'span-6' }, SectionCard({ title: 'Absence reasons', className: 'chart-card' },
        byReason.length ? donutChart({ data: byReason, height: 260, centerValue: String(subs.length), centerLabel: 'Covers' })
          : EmptyState({ icon: 'chart-pie', title: 'No data', text: 'No substitutions recorded at this campus.' }))),
      h('div', { className: 'span-6' }, SectionCard({ title: 'Status split', className: 'chart-card' },
        barChart({ categories: ['Confirmed', 'Pending', 'Declined'], series: [{ name: 'Substitutions', values: ['Confirmed', 'Pending', 'Declined'].map((st) => subs.filter((s) => s.status === st).length) }], showValues: true, height: 260 }))),
      h('div', { className: 'span-6' }, SectionCard({ title: 'Teachers covering most', icon: 'trophy' },
        byTeacher.length ? RankList(byTeacher.map((t) => ({ name: t.key, meta: 'Substitute cover', value: `${t.value} periods` })))
          : EmptyState({ icon: 'users', title: 'No cover recorded', text: 'Nobody has substituted yet this session.' }))),
      h('div', { className: 'span-6' }, SectionCard({ title: 'Cover load fairness', icon: 'scale' },
        h('div', { className: 'stack-2' },
          Callout({ tone: 'info', icon: 'info' }, 'A healthy rota keeps nobody above 6 cover periods a month.'),
          byTeacher.length ? bulletChart({
            items: byTeacher.slice(0, 6).map((t) => ({ label: t.key, value: t.value, target: 6 })),
            height: 220,
          }) : EmptyState({ icon: 'scale', title: 'No cover data', text: 'Fairness appears once covers are arranged.' }))))));
  }

  host.appendChild(kpiRow([
    { label: 'Absent today', value: absentFor(date).length, icon: 'user-x', tone: 'danger', footer: formatDate(date, 'long') },
    { label: 'Periods to cover', value: absentFor(date).reduce((a, x) => a + x.slots.length, 0), icon: 'clock', tone: 'warning' },
    { label: 'Free teachers now', value: teachers.filter((t) => (load.get(t.id) || 0) < 26).length, icon: 'users', tone: 'success', footer: 'Under 26 periods a week' },
    { label: 'Covers this session', value: db.substitutions.filter((s) => s.campusId === campusId).length, icon: 'refresh-ccw', tone: 'info' },
  ]));

  host.appendChild(filterCard([
    { id: 'date', label: 'Date', type: 'date', value: date, width: '190px' },
    { id: 'dept', label: 'Department', options: Array.from(new Set(teachers.map((t) => t.department))) },
  ], (id, value) => {
    if (id === 'date' && value) { date = value; paintTab(tabs.getActive()); }
  }, h('div', { className: 'row' },
    Button('Teacher timetables', { variant: 'ghost', size: 'sm', icon: 'presentation', route: 'timetable/teacher' }),
    Button('Print duty list', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(tabHost, `Substitution duty list · ${formatDate(date)}`) }))));

  host.appendChild(h('div', { className: 'page-tabs' }, tabs));
  host.appendChild(tabHost);
  paintTab('board');

  mount.appendChild(page({
    title: 'Substitution',
    subtitle: `${campusName(campusId)} · cover for absent teachers on ${formatDate(date, 'long')}`,
    route,
    actions: canEdit() ? [
      Button('Mark a teacher absent', {
        variant: 'secondary', icon: 'user-x',
        onClick: () => formPage({
          title: 'Mark a teacher absent', mode: 'modal', submitLabel: 'Mark absent',
          sections: [{
            title: 'Absence', cols: 2, fields: [
              { id: 'teacher', label: 'Teacher', type: 'combobox', required: true, options: teachers.map((t) => ({ value: t.id, label: t.name })), validate: validators.required },
              { id: 'reason', label: 'Reason', type: 'select', required: true, options: ['Casual Leave', 'Sick Leave', 'Official Duty', 'Training', 'Personal Emergency'] },
              { id: 'from', label: 'From', type: 'date', value: date, required: true },
              { id: 'to', label: 'To', type: 'date', value: date, required: true },
              { id: 'autoCover', label: 'Cover', type: 'switch', switchLabel: 'Auto-arrange substitutes for every affected period', span: 'full', value: true },
              { id: 'note', label: 'Note', type: 'textarea', span: 'full' },
            ],
          }],
          onSubmit: () => toast('Teacher marked absent', 'Affected periods are now on the cover board.', 'warning'),
        }),
      }),
      Button('Auto-assign all', {
        variant: 'primary', icon: 'zap',
        onClick: () => {
          const n = absentFor(date).reduce((a, x) => a + x.slots.length, 0);
          if (!n) { notify({ title: 'Nothing to cover', text: 'No absences on this date.', tone: 'info' }); return; }
          confirmThen({
            title: `Auto-assign ${n} substitutes?`,
            text: 'Each uncovered period goes to the highest ranked free teacher, and everyone is notified.',
            confirmLabel: 'Auto-assign', icon: 'zap',
          }, () => toast('Substitutes assigned', `${n} periods covered and notified.`));
        },
      }),
    ] : null,
    children: host,
  }));
}

/* ==========================================================================
   7 · TEACHERS routes
   ========================================================================== */

const teachersRoutes = {

  /* ------------------------------------------------ teachers/directory --- */
  'teachers/directory': {
    title: 'Teacher Directory',
    subtitle: 'Every teaching member of staff, their load and their classes',
    section: 'teachers',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const load = teacherLoad(campusId);
      const base = db.staff.filter((s) => s.campusId === campusId && s.type === 'Teaching').map((t) => {
        const slots = slotsForTeacher(t.id);
        const ctSection = t.classTeacherOf ? db.sections.find((s) => s.id === t.classTeacherOf) : null;
        return {
          ...t,
          periods: load.get(t.id) || slots.length,
          sections: new Set(slots.map((s) => s.sectionId)).size,
          subjectList: t.subjects.map((c) => subjectName(c)).join(', ') || '—',
          classTeacherLabel: ctSection ? ctSection.label : '—',
          loadStatus: loadLabel(load.get(t.id) || 0),
        };
      });

      mount.appendChild(listPage({
        title: 'Teacher Directory',
        subtitle: `${base.length} teachers at ${campusName(campusId)} · ${formatNumber(base.reduce((a, t) => a + t.periods, 0))} periods a week`,
        route: 'teachers/directory',
        actions: [
          Button('Workload analysis', { variant: 'secondary', icon: 'gauge', route: 'teachers/workload' }),
          Button('Class allocation', { variant: 'primary', icon: 'grid', route: 'teachers/class-allocation' }),
        ],
        kpis: [
          { label: 'Teaching staff', value: base.length, icon: 'presentation', tone: 'brand', delta: 3.1, deltaLabel: 'vs last session' },
          { label: 'Class teachers', value: base.filter((t) => t.isClassTeacher).length, icon: 'user-check', tone: 'info' },
          { label: 'Average load', value: `${Math.round(base.reduce((a, t) => a + t.periods, 0) / Math.max(1, base.length))} p/wk`, icon: 'clock', tone: 'success', footer: `Ceiling ${MAX_WEEKLY_PERIODS}` },
          { label: 'Overloaded', value: base.filter((t) => t.periods > MAX_WEEKLY_PERIODS).length, icon: 'alert-triangle', tone: 'danger', route: 'teachers/workload' },
        ],
        chart: barChart({
          categories: Array.from(new Set(base.map((t) => t.designation))),
          series: [{ name: 'Teachers', values: Array.from(new Set(base.map((t) => t.designation))).map((d) => base.filter((t) => t.designation === d).length) }],
          horizontal: true, showValues: true, height: 280,
        }),
        chartTitle: 'Teaching staff by designation',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Name, code, subject…', width: '250px' },
          { id: 'designation', label: 'Designation', options: Array.from(new Set(base.map((t) => t.designation))) },
          { id: 'department', label: 'Department', options: Array.from(new Set(base.map((t) => t.department))) },
          { id: 'status', label: 'Status', options: ['Active', 'On Leave', 'Notice Period'] },
          { id: 'loadStatus', label: 'Load', options: ['Under-utilised', 'Balanced', 'Near limit', 'Overloaded'] },
        ],
        onFilter: (id, value, all, table) => {
          let out = base.slice();
          if (all.q) out = search(out, all.q, ['name', 'employeeCode', 'subjectList', 'designation', 'email']);
          for (const k of ['designation', 'department', 'status', 'loadStatus']) {
            if (all[k] && all[k] !== 'all') out = out.filter((r) => r[k] === all[k]);
          }
          table.refresh(out);
        },
        columns: [
          {
            key: 'name', label: 'Teacher', sticky: true, width: 240,
            render: (t) => Identity(t.name, `${t.employeeCode} · ${t.designation}`),
            value: (t) => t.name,
          },
          { key: 'department', label: 'Department', width: 150, filter: true },
          { key: 'subjectList', label: 'Subjects', width: 230, render: (t) => h('div', { className: 'chip-row' }, t.subjects.slice(0, 3).map((c) => h('span', { className: 'tt-chip', style: { padding: '2px 8px' } }, subjectSwatch(c), subjectName(c)))), value: (t) => t.subjectList },
          { key: 'classTeacherLabel', label: 'Class teacher of', width: 160, render: (t) => (t.isClassTeacher ? Badge(t.classTeacherLabel, { tone: 'brand' }) : h('span', { className: 't-faint' }, '—')) },
          { key: 'sections', label: 'Sections', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          {
            key: 'periods', label: 'Periods/wk', width: 170, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v)}`,
            render: (t) => h('div', { className: 'stack-1' },
              h('span', { className: 't-xs t-num' }, `${t.periods}/${MAX_WEEKLY_PERIODS}`),
              ProgressBar(Math.min(t.periods, MAX_WEEKLY_PERIODS), { max: MAX_WEEKLY_PERIODS, size: 'sm', tone: loadTone(t.periods) })),
          },
          { key: 'experienceYears', label: 'Experience', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round1(v)} yrs`, render: (t) => `${t.experienceYears} yrs` },
          { key: 'qualification', label: 'Qualification', width: 180, hidden: true },
          { key: 'attendancePct', label: 'Attendance', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round1(v)}%`, render: (t) => `${t.attendancePct}%` },
          { key: 'appraisalScore', label: 'Appraisal', width: 130, align: 'right', numeric: true, aggregate: 'avg', format: (v) => round1(v), render: (t) => Rating(t.appraisalScore, { max: 5, showValue: true }) },
          { key: 'phone', label: 'Phone', width: 150, className: 't-num', hidden: true },
          { key: 'email', label: 'Email', width: 240, hidden: true },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (t) => Badge(t.status) },
        ],
        rows: base,
        selectable: true,
        footerAggregates: true,
        searchKeys: ['name', 'employeeCode', 'subjectList', 'designation'],
        pageSize: 25,
        exportName: 'teacher-directory',
        bulkActions: [
          { label: 'Send message', icon: 'send', onClick: (sel) => toast('Message queued', `${sel.length} teachers will receive it.`) },
          { label: 'Assign training', icon: 'lightbulb', onClick: (sel) => toast('Training assigned', `${sel.length} teachers nominated.`) },
          { label: 'Export', icon: 'download', onClick: (sel) => toast('Export ready', `${sel.length} rows exported.`) },
        ],
        rowActions: (t) => [
          { label: 'Open 360 profile', icon: 'id-card', route: 'teachers/profile/' + t.id },
          { label: 'Timetable', icon: 'calendar', route: 'timetable/teacher/' + t.id },
          { label: 'Lesson plans', icon: 'clipboard-list', route: 'teachers/lesson-plans' },
          { label: 'Appraisal', icon: 'star', route: 'teachers/appraisal' },
          { separator: true },
          { label: 'Copy email', icon: 'copy', onClick: () => copyToClipboard(t.email, 'Email copied') },
        ],
        onRowClick: (t) => navigate('teachers/profile/' + t.id),
        emptyState: EmptyState({ icon: 'presentation', title: 'No teachers match', text: 'Clear a filter to see the full directory.' }),
      }));
    },
  },

  /* -------------------------------------------------- teachers/profile --- */
  'teachers/profile': {
    title: 'Teacher Profile',
    subtitle: 'Workload, classes, plans, appraisal and records',
    section: 'teachers',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const t = db.staff.find((s) => s.id === ctx.param)
        || db.staff.find((s) => s.campusId === campusId && s.type === 'Teaching' && s.isClassTeacher)
        || db.staff.find((s) => s.type === 'Teaching');
      if (!t) { mount.appendChild(missingRecord('teacher', 'teachers/directory')); return; }

      const slots = slotsForTeacher(t.id);
      const load = slots.length;
      const codes = Array.from(new Set(slots.map((s) => s.subjectCode)));
      const sections = Array.from(new Set(slots.map((s) => s.sectionId)));
      const plans = plansForTeacher(t);
      const appr = appraisalFor(t.id);
      const leaves = db.leaveRequests.filter((l) => l.employeeId === t.id);
      const subs = db.substitutions.filter((s) => s.substituteTeacherId === t.id || s.absentTeacherId === t.id);
      const ctSection = t.classTeacherOf ? db.sections.find((s) => s.id === t.classTeacherOf) : null;
      const students = ctSection ? db.students.filter((s) => s.sectionId === ctSection.id) : [];
      const marksOfMine = db.marks.filter((m) => codes.includes(m.subjectCode) && sections.includes(m.sectionId));
      const avgClassScore = marksOfMine.length ? round1(marksOfMine.reduce((a, m) => a + m.percent, 0) / marksOfMine.length) : 0;

      const overviewTab = () => h('div', { className: 'stack' },
        kpiRow([
          { label: 'Weekly periods', value: `${load} / ${MAX_WEEKLY_PERIODS}`, icon: 'clock', tone: loadTone(load), footer: loadLabel(load) },
          { label: 'Sections taught', value: sections.length, icon: 'columns', tone: 'info' },
          { label: 'Class average', value: avgClassScore ? `${avgClassScore}%` : '—', icon: 'chart-line', tone: 'success', footer: `${formatNumber(marksOfMine.length)} marks records` },
          { label: 'Appraisal', value: appr ? appr.overall : '—', icon: 'star', tone: 'warning', footer: t.appraisalRating },
        ]),
        h('div', { className: 'widget-grid' },
          h('div', { className: 'span-6' }, SectionCard({ title: 'Personal & service', icon: 'user' },
            DescriptionList([
              ['Employee code', t.employeeCode], ['Designation', t.designation],
              ['Department', t.department], ['Band', t.band],
              ['Employment', t.employmentType], ['Joined', formatDate(t.joiningDate)],
              ['Experience', `${t.experienceYears} years`], ['Qualification', t.qualification],
              ['Gender', t.gender], ['Date of birth', formatDate(t.dob)],
              ['Blood group', t.bloodGroup], ['Marital status', t.maritalStatus],
            ], { cols: 2 }))),
          h('div', { className: 'span-6' }, SectionCard({ title: 'Contact', icon: 'phone' },
            DescriptionList([
              ['Email', h('a', { href: 'mailto:' + t.email }, t.email)],
              ['Phone', t.phone],
              ['Campus', campusName(t.campusId)],
              ['Address', `${t.address.line1}, ${t.address.line2}`],
              ['City', `${t.address.city}, ${t.address.state} ${t.address.pincode}`],
              ['Reports to', (db.staff.find((s) => s.campusId === t.campusId && s.designation === 'Principal') || {}).name || '—'],
            ], { cols: 1 }))),
          h('div', { className: 'span-6' }, SectionCard({ title: 'Load by day', className: 'chart-card', icon: 'chart-bar' },
            barChart({ categories: DAYS.map((d) => DAY_SHORT[d]), series: [{ name: 'Periods', values: DAYS.map((d) => slots.filter((s) => s.day === d).length) }], showValues: true, height: 220 }))),
          h('div', { className: 'span-6' }, SectionCard({ title: 'Subject mix', className: 'chart-card', icon: 'chart-pie' },
            codes.length ? donutChart({
              data: codes.map((c) => ({ key: subjectName(c), value: slots.filter((s) => s.subjectCode === c).length, color: subjectColor(c) })),
              height: 220, centerValue: String(load), centerLabel: 'Periods',
            }) : EmptyState({ icon: 'chart-pie', title: 'No periods', text: 'This teacher has no scheduled periods.' })))));

      const timetableTab = () => h('div', { className: 'stack' },
        SectionCard({
          title: 'Weekly timetable', icon: 'calendar',
          subtitle: `${load} periods · ${teachingPeriods().length * DAYS.length - load} free`,
          actions: h('div', { className: 'row' },
            Button('Print', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(document.body, `${t.name} timetable`) }),
            Button('Open full view', { variant: 'secondary', size: 'sm', icon: 'external-link', onClick: () => navigate('timetable/teacher/' + t.id) })),
        }, load
          ? frag(timetableGrid({ slots, primary: (s) => `${s.className}-${s.section}`, secondary: (s) => s.subjectName, tertiary: (s) => s.room }), timetableLegend(codes))
          : EmptyState({ icon: 'calendar', title: 'No timetable', text: 'No periods have been allocated to this teacher.', action: Button('Open builder', { variant: 'primary', icon: 'tool', route: 'timetable/builder' }) })));

      const classesTab = () => {
        const rows = sections.map((sid) => {
          const sec = db.sections.find((s) => s.id === sid);
          const mine = slots.filter((s) => s.sectionId === sid);
          const cls = sec ? db.classes.find((c) => c.id === sec.classId) : null;
          return {
            id: sid,
            label: sec ? sec.label : sid,
            className: cls ? cls.name : '—',
            room: sec ? sec.roomNo : '—',
            strength: sec ? strengthOf(sid) : 0,
            subjects: Array.from(new Set(mine.map((s) => s.subjectCode))),
            periods: mine.length,
            isClassTeacher: sec && sec.classTeacherId === t.id,
          };
        });
        return h('div', { className: 'stack' },
          ctSection ? SectionCard({
            title: `Class teacher of ${ctSection.label}`, icon: 'user-check',
            subtitle: `${students.length} students · Room ${ctSection.roomNo}`,
            actions: Button('Open section', { variant: 'secondary', size: 'sm', icon: 'grid', route: 'timetable/class/' + ctSection.id }),
          },
            h('div', { className: 'widget-grid' },
              h('div', { className: 'span-4' }, StatCard({ label: 'Students', value: students.length, icon: 'graduation-cap', tone: 'brand' })),
              h('div', { className: 'span-4' }, StatCard({ label: 'Avg attendance', value: students.length ? `${round1(students.reduce((a, s) => a + s.attendancePct, 0) / students.length)}%` : '—', icon: 'clipboard-check', tone: 'success' })),
              h('div', { className: 'span-4' }, StatCard({ label: 'Fee defaulters', value: students.filter((s) => s.feeDue > 0).length, icon: 'wallet', tone: 'warning' })))) : null,
          SectionCard({ title: 'Sections taught', icon: 'columns', flush: true },
            DataTable({
              columns: [
                { key: 'label', label: 'Section', sticky: true, width: 180, render: (r) => Identity(r.label, `Room ${r.room}`), value: (r) => r.label },
                { key: 'className', label: 'Class', width: 130, filter: true },
                { key: 'strength', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'subjects', label: 'Subjects', width: 260, render: (r) => h('div', { className: 'chip-row' }, r.subjects.map((c) => h('span', { className: 'tt-chip', style: { padding: '2px 8px' } }, subjectSwatch(c), subjectName(c)))), value: (r) => r.subjects.join(', ') },
                { key: 'periods', label: 'Periods/wk', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
                { key: 'isClassTeacher', label: 'Role', width: 140, render: (r) => Badge(r.isClassTeacher ? 'Class teacher' : 'Subject teacher', { tone: r.isClassTeacher ? 'brand' : 'neutral' }), value: (r) => (r.isClassTeacher ? 'Class teacher' : 'Subject teacher') },
              ],
              rows, paginate: false, footerAggregates: true, maxHeight: 'none', exportName: `sections-${t.id}`,
              onRowClick: (r) => navigate('timetable/class/' + r.id),
              emptyState: EmptyState({ icon: 'columns', title: 'No sections allocated', text: 'Allocate this teacher on the class-subject map.', action: Button('Open map', { variant: 'primary', icon: 'workflow', route: 'academics/class-subject-teacher' }) }),
            })));
      };

      const plansTab = () => SectionCard({
        title: 'Lesson plans', icon: 'clipboard-list', flush: true,
        subtitle: `${plans.length} plans · ${plans.filter((p) => p.status === 'Approved').length} approved`,
      }, DataTable({
        columns: [
          { key: 'unit', label: 'Unit', sticky: true, width: 260, render: (p) => Identity(p.unit, `${p.className}-${p.section} · ${p.subjectName}`), value: (p) => p.unit },
          { key: 'week', label: 'Week', width: 110 },
          { key: 'fromDate', label: 'From', width: 120, render: (p) => formatDate(p.fromDate, 'dayMonth'), value: (p) => p.fromDate },
          { key: 'periods', label: 'Periods', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'activities', label: 'Activities', width: 260 },
          { key: 'assessment', label: 'Assessment', width: 150, filter: true },
          { key: 'completion', label: 'Delivered', width: 150, render: (p) => ProgressBar(p.completion, { max: 100, size: 'sm', showValue: true, tone: p.completion > 80 ? 'success' : 'warning' }), value: (p) => p.completion },
          { key: 'status', label: 'Status', width: 150, filter: true, render: (p) => Badge(p.status) },
        ],
        rows: plans, pageSize: 25, exportName: `lesson-plans-${t.id}`,
        emptyState: EmptyState({ icon: 'clipboard-list', title: 'No lesson plans', text: 'Plans appear once the teacher submits them for a unit.' }),
      }));

      const appraisalTab = () => (appr ? h('div', { className: 'stack' },
        kpiRow([
          { label: 'Overall score', value: `${appr.overall} / 5`, icon: 'star', tone: 'brand', footer: appr.cycle },
          { label: 'Student feedback', value: `${appr.studentFeedback} / 5`, icon: 'graduation-cap', tone: 'info', footer: `${appr.responses} responses` },
          { label: 'Parent feedback', value: `${appr.parentFeedback} / 5`, icon: 'users', tone: 'success' },
          { label: 'Peer feedback', value: `${appr.peerFeedback} / 5`, icon: 'handshake', tone: 'warning' },
        ]),
        h('div', { className: 'widget-grid' },
          h('div', { className: 'span-6' }, SectionCard({ title: 'Appraisal profile', className: 'chart-card', icon: 'target', subtitle: 'Reviewer against self-assessment' },
            radarChart(appr.scores, { title: `${t.name} appraisal profile` }))),
          h('div', { className: 'span-6' }, SectionCard({ title: 'Dimension scores', icon: 'list', flush: true },
            DataTable({
              columns: [
                { key: 'dimension', label: 'Dimension', width: 200 },
                { key: 'self', label: 'Self', width: 90, align: 'right', numeric: true },
                { key: 'reviewer', label: 'Reviewer', width: 110, align: 'right', numeric: true },
                { key: 'weight', label: 'Weight', width: 90, align: 'right', numeric: true, render: (s) => `${s.weight}%` },
                { key: 'bar', label: 'Score', width: 160, sortable: false, render: (s) => ProgressBar(s.reviewer, { max: 5, size: 'sm', tone: s.reviewer >= 4 ? 'success' : s.reviewer >= 3 ? 'warning' : 'danger' }) },
              ],
              rows: appr.scores, paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
            }))),
          h('div', { className: 'span-6' }, SectionCard({ title: 'Goals', icon: 'target' },
            h('div', { className: 'stack-3' }, appr.goals.map((g) => h('div', { className: 'stack-1' },
              h('div', { className: 'row' }, h('span', { className: 't-sm t-medium flex-1' }, g.goal), h('span', { className: 't-xs t-muted' }, `due ${formatDate(g.due, 'dayMonth')}`)),
              ProgressBar(g.progress, { max: 100, size: 'sm', showValue: true, tone: g.progress > 70 ? 'success' : 'warning' })))))),
          h('div', { className: 'span-6' }, SectionCard({ title: 'Reviewer comments', icon: 'message-square' },
            h('div', { className: 'stack-3' },
              Callout({ tone: 'success', icon: 'thumbs-up', title: 'Strengths' }, appr.strengths),
              Callout({ tone: 'info', icon: 'lightbulb', title: 'Development focus' }, appr.development),
              DescriptionList([['Reviewer', appr.reviewer], ['Reviewed on', formatDate(appr.reviewedOn)], ['Rating', appr.rating]], { cols: 1 }))))))
        : EmptyState({ icon: 'star', title: 'Not appraised yet', text: 'This teacher has no appraisal record for the current cycle.' }));

      const leaveTab = () => h('div', { className: 'stack' },
        kpiRow([
          { label: 'Attendance', value: `${t.attendancePct}%`, icon: 'clipboard-check', tone: t.attendancePct > 92 ? 'success' : 'warning' },
          { label: 'CL balance', value: t.leaveBalanceCL, icon: 'calendar', tone: 'info' },
          { label: 'SL balance', value: t.leaveBalanceSL, icon: 'first-aid', tone: 'info' },
          { label: 'EL balance', value: t.leaveBalanceEL, icon: 'umbrella', tone: 'info' },
        ]),
        SectionCard({ title: 'Leave history', icon: 'calendar', flush: true, subtitle: `${leaves.length} applications this session` },
          DataTable({
            columns: [
              { key: 'id', label: 'Ref', width: 110, className: 't-mono' },
              { key: 'leaveType', label: 'Type', width: 160, filter: true },
              { key: 'fromDate', label: 'From', width: 120, render: (l) => formatDate(l.fromDate), value: (l) => l.fromDate },
              { key: 'toDate', label: 'To', width: 120, render: (l) => formatDate(l.toDate), value: (l) => l.toDate },
              { key: 'days', label: 'Days', width: 80, align: 'right', numeric: true, aggregate: 'sum' },
              { key: 'reason', label: 'Reason', width: 200 },
              { key: 'substituteArranged', label: 'Cover', width: 110, render: (l) => Badge(l.substituteArranged ? 'Arranged' : 'None', { tone: l.substituteArranged ? 'success' : 'danger' }), value: (l) => (l.substituteArranged ? 'Arranged' : 'None') },
              { key: 'status', label: 'Status', width: 120, filter: true, render: (l) => Badge(l.status) },
            ],
            rows: leaves, pageSize: 15, footerAggregates: true, exportName: `leave-${t.id}`,
            emptyState: EmptyState({ icon: 'calendar', title: 'No leave taken', text: 'This teacher has not applied for leave this session.' }),
          })),
        SectionCard({ title: 'Substitution record', icon: 'refresh-ccw', flush: true, subtitle: `${subs.length} entries` },
          DataTable({
            columns: [
              { key: 'date', label: 'Date', width: 120, render: (s) => formatDate(s.date), value: (s) => s.date },
              { key: 'className', label: 'Section', width: 140, render: (s) => `${s.className}-${s.section}` },
              { key: 'periodNo', label: 'Period', width: 90, align: 'center', numeric: true, render: (s) => 'P' + s.periodNo },
              { key: 'subjectName', label: 'Subject', width: 160 },
              { key: 'role', label: 'Role', width: 150, render: (s) => Badge(s.absentTeacherId === t.id ? 'Was absent' : 'Covered', { tone: s.absentTeacherId === t.id ? 'warning' : 'success' }), value: (s) => (s.absentTeacherId === t.id ? 'Was absent' : 'Covered') },
              { key: 'status', label: 'Status', width: 120, render: (s) => Badge(s.status) },
            ],
            rows: subs, pageSize: 10, exportable: false,
            emptyState: EmptyState({ icon: 'refresh-ccw', title: 'No substitutions', text: 'No cover has been given or received.' }),
          })));

      const docsTab = () => {
        const r = rngFor('docs' + t.id);
        const files = [
          { name: 'Appointment letter.pdf', type: 'PDF', size: '412 KB', date: t.joiningDate, status: 'Verified' },
          { name: 'Degree certificate.pdf', type: 'PDF', size: '1.8 MB', date: t.joiningDate, status: t.documentsComplete ? 'Verified' : 'Pending' },
          { name: 'B.Ed marksheet.pdf', type: 'PDF', size: '920 KB', date: t.joiningDate, status: 'Verified' },
          { name: 'PAN card.jpg', type: 'Image', size: '240 KB', date: t.joiningDate, status: 'Verified' },
          { name: 'Aadhaar (masked).pdf', type: 'PDF', size: '310 KB', date: t.joiningDate, status: 'Verified' },
          { name: 'Police verification.pdf', type: 'PDF', size: '660 KB', date: t.joiningDate, status: t.documentsComplete ? 'Verified' : 'Pending' },
          { name: 'CBSE capacity-building certificate.pdf', type: 'PDF', size: `${ri(r, 200, 900)} KB`, date: '2026-06-14', status: 'Verified' },
        ];
        return h('div', { className: 'stack' },
          t.documentsComplete ? null : Callout({ tone: 'warning', icon: 'alert-triangle', title: 'Document file incomplete' },
            'Two mandatory documents are pending verification. HR cannot process the next increment until the file is complete.'),
          SectionCard({ title: 'Documents on file', icon: 'folder', subtitle: `${files.length} documents` },
            FileList(files, {
              onDownload: (f) => toast('Download started', f.name, 'info'),
              onRemove: (f) => confirmThen({ title: `Remove ${f.name}?`, text: 'The document will be deleted from the employee file.', tone: 'danger', confirmLabel: 'Remove', icon: 'trash' },
                () => toast('Document removed', f.name, 'danger')),
            })),
          SectionCard({ title: 'Training & certification', icon: 'lightbulb', subtitle: `${t.trainingsCompleted} completed` },
            t.trainingsCompleted
              ? Timeline(Array.from({ length: Math.min(t.trainingsCompleted, 5) }, (_, i) => ({
                title: rpick(rngFor('trn' + t.id + i), ['CBSE Capacity Building — Pedagogy', 'Assessment for Learning', 'Inclusive Classrooms', 'ICT in Teaching', 'Child Safety & POCSO', 'Experiential Learning']),
                meta: formatDate(`2026-0${Math.min(8, 4 + i)}-1${i}`), text: 'Certificate on file · 12 hours',
                icon: 'certificate', tone: 'success',
              })))
              : EmptyState({ icon: 'lightbulb', title: 'No training yet', text: 'Nominate this teacher for a CBSE capacity-building programme.' })));
      };

      mount.appendChild(detailPage({
        title: t.name,
        subtitle: `${t.designation} · ${t.department} · ${campusName(t.campusId)}`,
        route: 'teachers/profile',
        initials: t.avatarInitials,
        badges: [Badge(t.status), Badge(t.employmentType), Badge(loadLabel(load), { tone: loadTone(load) }), t.isClassTeacher ? Badge('Class teacher', { tone: 'brand' }) : null].filter(Boolean),
        meta: [
          { label: 'Employee code', value: t.employeeCode, icon: 'id-card' },
          { label: 'Periods/week', value: `${load} / ${MAX_WEEKLY_PERIODS}`, icon: 'clock' },
          { label: 'Experience', value: `${t.experienceYears} yrs`, icon: 'briefcase' },
          { label: 'Appraisal', value: `${t.appraisalScore} / 5`, icon: 'star' },
          { label: 'Attendance', value: `${t.attendancePct}%`, icon: 'clipboard-check' },
        ],
        actions: [
          Button('Message', { variant: 'secondary', icon: 'send', onClick: () => toast('Message sent', `${t.name} will see it on the teacher portal.`) }),
          canEdit()
            ? Button('Edit', {
              variant: 'primary', icon: 'edit',
              onClick: () => formPage({
                title: `Edit ${t.name}`, mode: 'modal', size: 'lg', submitLabel: 'Save changes',
                values: { name: t.name, designation: t.designation, department: t.department, email: t.email, phone: t.phone, subjects: t.subjects },
                sections: [{
                  title: 'Teaching profile', cols: 2, fields: [
                    { id: 'name', label: 'Full name', required: true, validate: validators.required },
                    { id: 'designation', label: 'Designation', type: 'select', options: Array.from(new Set(db.staff.map((s) => s.designation))) },
                    { id: 'department', label: 'Department', type: 'select', options: db.departments.map((d) => d.name) },
                    { id: 'subjects', label: 'Subjects', type: 'multiselect', options: db.subjects.map((s) => ({ value: s.code, label: s.name })) },
                    { id: 'email', label: 'Email', type: 'email', validate: validators.email },
                    { id: 'phone', label: 'Phone', type: 'tel', validate: validators.phone },
                    { id: 'maxPeriods', label: 'Weekly period ceiling', type: 'number', value: MAX_WEEKLY_PERIODS },
                    { id: 'classTeacher', label: 'Class teacher of', type: 'combobox', options: db.sections.filter((s) => s.campusId === t.campusId).map((s) => ({ value: s.id, label: s.label })) },
                  ],
                }],
                onSubmit: fakeSave('Teacher profile'),
              }),
            })
            : Button('Timetable', { variant: 'primary', icon: 'calendar', route: 'timetable/teacher/' + t.id }),
        ],
        tabs: [
          { id: 'overview', label: 'Overview', icon: 'user', render: overviewTab },
          { id: 'timetable', label: 'Timetable', icon: 'calendar', count: load, render: timetableTab },
          { id: 'classes', label: 'Classes & subjects', icon: 'columns', count: sections.length, render: classesTab },
          { id: 'plans', label: 'Lesson plans', icon: 'clipboard-list', count: plans.length, render: plansTab },
          { id: 'appraisal', label: 'Appraisal', icon: 'star', render: appraisalTab },
          { id: 'leave', label: 'Leave & cover', icon: 'umbrella', count: leaves.length, render: leaveTab },
          { id: 'documents', label: 'Documents', icon: 'folder', count: 7, render: docsTab },
        ],
        sidebar: [
          SectionCard({ title: 'Workload', icon: 'gauge' },
            h('div', { className: 'stack-3' },
              h('div', { className: 'row', style: { justifyContent: 'center' } },
                progressRing(load, { max: MAX_WEEKLY_PERIODS, size: 130, label: String(load), sublabel: `of ${MAX_WEEKLY_PERIODS} periods`, valueFormat: () => String(load) })),
              MetricRow('Status', loadLabel(load)),
              MetricRow('Free periods', String(teachingPeriods().length * DAYS.length - load)),
              MetricRow('Sections', String(sections.length)),
              MetricRow('Subjects', String(codes.length)))),
          SectionCard({ title: 'Subjects taught', icon: 'book' },
            codes.length
              ? h('div', { className: 'chip-row' }, codes.map((c) => h('button', {
                className: 'tt-chip', type: 'button', onClick: () => navigate('academics/subjects'),
              }, subjectSwatch(c), subjectName(c), h('span', { className: 'tt-chip-meta' }, `${slots.filter((s) => s.subjectCode === c).length}p`))))
              : h('div', { className: 't-sm t-muted' }, 'No subjects allocated.')),
          SectionCard({ title: 'Quick links', icon: 'link' },
            h('div', { className: 'stack-2' },
              Button('Full timetable', { variant: 'secondary', block: true, icon: 'calendar', route: 'timetable/teacher/' + t.id }),
              Button('Workload analysis', { variant: 'secondary', block: true, icon: 'gauge', route: 'teachers/workload' }),
              Button('Lesson plans', { variant: 'secondary', block: true, icon: 'clipboard-list', route: 'teachers/lesson-plans' }),
              ctSection ? Button('My section', { variant: 'secondary', block: true, icon: 'grid', route: 'timetable/class/' + ctSection.id }) : null)),
          SectionCard({ title: 'Payroll snapshot', icon: 'wallet' },
            DescriptionList([
              ['Gross', formatCurrency(t.salaryGross)],
              ['Deductions', formatCurrency(t.deductionPf + t.deductionTds)],
              ['Net', formatCurrency(t.salaryNet)],
              ['Bank', `${t.bankName} ${t.accountMasked}`],
            ], { cols: 1 })),
        ],
        timeline: [
          { title: 'Joined Springdale', meta: formatDate(t.joiningDate), text: `${t.designation}, ${t.department}`, icon: 'log-in', tone: 'success' },
          { title: 'Appraisal recorded', meta: appr ? formatDate(appr.reviewedOn) : '—', text: `${t.appraisalRating} · ${t.appraisalScore}/5`, icon: 'star', tone: 'info' },
          { title: `${t.trainingsCompleted} trainings completed`, meta: '2026-27', text: 'CBSE capacity building and in-house workshops', icon: 'lightbulb', tone: 'brand' },
          leaves.length ? { title: 'Last leave', meta: formatDate(leaves[leaves.length - 1].fromDate), text: `${leaves[leaves.length - 1].leaveType} · ${leaves[leaves.length - 1].days} days`, icon: 'umbrella', tone: 'warning' } : null,
          { title: 'Timetable allocated', meta: '01 Apr 2026', text: `${load} periods a week across ${sections.length} sections`, icon: 'calendar', tone: 'info' },
        ].filter(Boolean),
      }));
    },
  },

  /* ----------------------------------------- teachers/class-allocation --- */
  'teachers/class-allocation': {
    title: 'Class Allocation',
    subtitle: 'Class-teacher duty across every section',
    section: 'teachers',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const secs = sectionsFor(campusId);
      const load = teacherLoad(campusId);
      const rows = secs.map((s) => {
        const cls = db.classes.find((c) => c.id === s.classId) || {};
        const t = db.staff.find((x) => x.id === s.classTeacherId);
        const strength = strengthOf(s.id);
        const students = db.students.filter((x) => x.sectionId === s.id);
        return {
          id: s.id,
          label: s.label,
          className: cls.name || '—',
          classLevel: cls.level || 0,
          stage: cls.stage || '—',
          section: s.name,
          room: s.roomNo,
          strength,
          teacherId: s.classTeacherId,
          teacherName: t ? t.name : 'Not assigned',
          designation: t ? t.designation : '—',
          teacherLoad: t ? (load.get(t.id) || 0) : 0,
          attendance: students.length ? round1(students.reduce((a, x) => a + x.attendancePct, 0) / students.length) : 0,
          defaulters: students.filter((x) => x.feeDue > 0).length,
          status: s.classTeacherId ? 'Allocated' : 'Unassigned',
        };
      });
      const unassigned = rows.filter((r) => !r.teacherId);
      const doubled = countBy(rows.filter((r) => r.teacherId), 'teacherName').filter((x) => x.value > 1);

      const assign = (row) => {
        const busy = new Set(secs.map((s) => s.classTeacherId).filter(Boolean));
        const pool = sortBy(teachersFor(campusId).filter((t) => !busy.has(t.id) || t.id === row.teacherId), (t) => load.get(t.id) || 0);
        let chosen = row.teacherId;
        Modal({
          title: 'Assign class teacher', subtitle: `${row.label} · ${row.strength} students`, icon: 'user-check', size: 'lg',
          body: h('div', { className: 'stack-3' },
            Callout({ tone: 'info', icon: 'info' }, 'Only teachers who do not already hold a section are listed, ordered by the lightest teaching load.'),
            Field({ label: 'Class teacher', required: true },
              Combobox({
                options: pool.slice(0, 60).map((t) => ({ value: t.id, label: `${t.name} — ${t.designation} · ${load.get(t.id) || 0} p/wk` })),
                value: chosen, placeholder: 'Search staff…', onChange: (v) => { chosen = v; },
              })),
            SectionCard({ title: 'Best fits', icon: 'sparkles' },
              RankList(pool.slice(0, 6).map((t) => ({ name: t.name, meta: `${t.designation} · ${t.subjects.join(', ')}`, value: `${load.get(t.id) || 0} p/wk` }))))),
          actions: (close) => frag(
            Button('Cancel', { variant: 'ghost', onClick: close }),
            Button('Assign', {
              variant: 'primary', icon: 'check',
              onClick: () => {
                if (!chosen) { toast('Pick a teacher', 'Select a member of staff first.', 'warning'); return; }
                const t = db.staff.find((x) => x.id === chosen);
                close();
                toast('Class teacher assigned', `${t ? t.name : chosen} now leads ${row.label}.`);
              },
            })),
        });
      };

      mount.appendChild(listPage({
        title: 'Class Allocation',
        subtitle: `${rows.length} sections · ${rows.length - unassigned.length} with a class teacher at ${campusName(campusId)}`,
        route: 'teachers/class-allocation',
        actions: canEdit() ? [
          Button('Subject allocation', { variant: 'secondary', icon: 'book-open', route: 'teachers/subject-allocation' }),
          Button('Auto-allocate', {
            variant: 'primary', icon: 'zap',
            onClick: () => {
              if (!unassigned.length) { notify({ title: 'Nothing to allocate', text: 'Every section already has a class teacher.', tone: 'success' }); return; }
              confirmThen({
                title: `Auto-allocate ${unassigned.length} sections?`,
                text: 'Each unassigned section goes to the least loaded teacher who does not already hold a section.',
                confirmLabel: 'Auto-allocate', icon: 'zap',
              }, () => toast('Allocation complete', `${unassigned.length} class teachers assigned.`));
            },
          }),
        ] : null,
        kpis: [
          { label: 'Sections', value: rows.length, icon: 'columns', tone: 'brand' },
          { label: 'Class teachers', value: rows.length - unassigned.length, icon: 'user-check', tone: 'success' },
          { label: 'Unassigned', value: unassigned.length, icon: 'alert-circle', tone: unassigned.length ? 'warning' : 'success' },
          { label: 'Holding 2+ sections', value: doubled.length, icon: 'alert-triangle', tone: doubled.length ? 'warning' : 'success' },
        ],
        chart: barChart({
          categories: Array.from(new Set(rows.map((r) => r.className))),
          series: [
            { name: 'Allocated', values: Array.from(new Set(rows.map((r) => r.className))).map((cn) => rows.filter((r) => r.className === cn && r.teacherId).length) },
            { name: 'Unassigned', values: Array.from(new Set(rows.map((r) => r.className))).map((cn) => rows.filter((r) => r.className === cn && !r.teacherId).length) },
          ],
          stacked: true, height: 250,
        }),
        chartTitle: 'Class-teacher coverage by class',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Section or teacher…', width: '230px' },
          { id: 'className', label: 'Class', options: Array.from(new Set(rows.map((r) => r.className))) },
          { id: 'stage', label: 'Stage', options: Array.from(new Set(rows.map((r) => r.stage))) },
          { id: 'status', label: 'Status', type: 'segment', options: [{ id: 'all', label: 'All' }, { id: 'Allocated', label: 'Allocated' }, { id: 'Unassigned', label: 'Unassigned' }] },
        ],
        onFilter: (id, value, all, table) => {
          let out = rows.slice();
          if (all.q) out = search(out, all.q, ['label', 'teacherName', 'className']);
          for (const k of ['className', 'stage']) if (all[k] && all[k] !== 'all') out = out.filter((r) => r[k] === all[k]);
          if (all.status && all.status !== 'all') out = out.filter((r) => r.status === all.status);
          table.refresh(out);
        },
        columns: [
          { key: 'label', label: 'Section', sticky: true, width: 170, render: (r) => Identity(r.label, `Room ${r.room} · ${r.stage}`), value: (r) => r.classLevel },
          { key: 'className', label: 'Class', width: 130, filter: true },
          { key: 'strength', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          {
            key: 'teacherName', label: 'Class teacher', width: 240,
            render: (r) => (r.teacherId
              ? Identity(r.teacherName, r.designation, { onClick: () => navigate('teachers/profile/' + r.teacherId) })
              : Button('Assign', { variant: 'subtle', size: 'sm', icon: 'user-plus', onClick: () => assign(r) })),
            value: (r) => r.teacherName,
          },
          {
            key: 'teacherLoad', label: 'Teaching load', width: 170, align: 'right', numeric: true,
            render: (r) => (r.teacherId ? h('div', { className: 'stack-1' },
              h('span', { className: 't-xs t-num' }, `${r.teacherLoad}/${MAX_WEEKLY_PERIODS}`),
              ProgressBar(Math.min(r.teacherLoad, MAX_WEEKLY_PERIODS), { max: MAX_WEEKLY_PERIODS, size: 'sm', tone: loadTone(r.teacherLoad) })) : h('span', { className: 't-faint' }, '—')),
          },
          { key: 'attendance', label: 'Section attendance', width: 160, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round1(v)}%`, render: (r) => `${r.attendance}%` },
          { key: 'defaulters', label: 'Fee defaulters', width: 140, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        selectable: true,
        footerAggregates: true,
        searchKeys: ['label', 'teacherName', 'className'],
        pageSize: 50,
        exportName: 'class-allocation',
        bulkActions: [
          { label: 'Notify class teachers', icon: 'send', onClick: (sel) => toast('Notifications sent', `${sel.length} class teachers informed.`) },
          { label: 'Print section lists', icon: 'print', onClick: (sel) => toast('Sent to printer', `${sel.length} lists queued.`) },
        ],
        rowActions: (r) => [
          canEdit() && { label: r.teacherId ? 'Change class teacher' : 'Assign class teacher', icon: 'user-check', onClick: () => assign(r) },
          { label: 'Section timetable', icon: 'grid', route: 'timetable/class/' + r.id },
          r.teacherId && { label: 'Teacher profile', icon: 'id-card', route: 'teachers/profile/' + r.teacherId },
          { label: 'Students', icon: 'users', route: 'students/all' },
        ].filter(Boolean),
        onRowClick: (r) => (r.teacherId ? navigate('teachers/profile/' + r.teacherId) : assign(r)),
        emptyState: EmptyState({ icon: 'grid', title: 'No sections match', text: 'Clear a filter to see every section.' }),
      }));
    },
  },

  /* --------------------------------------- teachers/subject-allocation --- */
  'teachers/subject-allocation': {
    title: 'Subject Allocation',
    subtitle: 'Teacher × subject matrix with weekly period counts',
    section: 'teachers',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const slots = slotsForCampus(campusId);
      const teachers = sortBy(teachersFor(campusId), 'name');
      const load = teacherLoad(campusId);
      const codes = SUBJECT_ORDER.filter((c) => slots.some((s) => s.subjectCode === c));

      const count = new Map();
      for (const s of slots) {
        if (!s.teacherId) continue;
        const k = s.teacherId + '|' + s.subjectCode;
        count.set(k, (count.get(k) || 0) + 1);
      }

      const flat = [];
      for (const t of teachers) {
        for (const c of codes) {
          const n = count.get(t.id + '|' + c) || 0;
          if (!n && !t.subjects.includes(c)) continue;
          flat.push({
            id: t.id + '-' + c,
            teacherId: t.id, teacherName: t.name, designation: t.designation, department: t.department,
            subjectCode: c, subjectName: subjectName(c),
            periods: n,
            qualified: t.subjects.includes(c),
            sections: new Set(slots.filter((s) => s.teacherId === t.id && s.subjectCode === c).map((s) => s.sectionId)).size,
            weeklyLoad: load.get(t.id) || 0,
            status: n === 0 ? 'Qualified, not scheduled' : t.subjects.includes(c) ? 'Allocated' : 'Out of specialism',
          });
        }
      }
      const mismatched = flat.filter((r) => r.status === 'Out of specialism' && r.periods > 0);

      const shown = teachers.filter((t) => (load.get(t.id) || 0) > 0).slice(0, 60);
      const matrix = () => {
        const thead = h('thead', null, h('tr', null,
          h('th', { className: 'matrix-head' }, 'Teacher'),
          codes.map((c) => h('th', { attrs: { scope: 'col', title: subjectName(c) } },
            h('div', { className: 'row', style: { gap: '4px', justifyContent: 'center' } }, subjectSwatch(c), c))),
          h('th', null, 'Total')));
        const tbody = h('tbody');
        for (const t of shown) {
          const tr = h('tr');
          tr.appendChild(h('th', { className: 'matrix-head', attrs: { scope: 'row' } },
            h('button', {
              className: 'matrix-btn', type: 'button', style: { textAlign: 'left' },
              onClick: () => navigate('teachers/profile/' + t.id),
            }, t.name)));
          for (const c of codes) {
            const n = count.get(t.id + '|' + c) || 0;
            const qualified = t.subjects.includes(c);
            tr.appendChild(h('td', null, n
              ? h('span', { className: 'matrix-cell' },
                h('span', { className: 'matrix-cell-name t-num' }, String(n)),
                h('span', { className: 'matrix-cell-meta' }, qualified ? 'core' : 'extra'))
              : h('span', { className: qualified ? 't-muted' : 'matrix-empty' }, qualified ? '○' : '·')));
          }
          tr.appendChild(h('td', null, h('span', { className: 't-num t-semibold' }, String(load.get(t.id) || 0))));
          tbody.appendChild(tr);
        }
        return h('div', { className: 'matrix-wrap' }, h('table', { className: 'matrix' }, thead, tbody));
      };

      mount.appendChild(listPage({
        title: 'Subject Allocation',
        subtitle: `${teachers.length} teachers · ${codes.length} subjects · ${campusName(campusId)}`,
        route: 'teachers/subject-allocation',
        actions: canEdit() ? [
          Button('Class-subject map', { variant: 'secondary', icon: 'workflow', route: 'academics/class-subject-teacher' }),
          Button('Rebalance load', {
            variant: 'primary', icon: 'scale',
            onClick: () => confirmThen({
              title: 'Rebalance subject allocation?',
              text: 'Periods move from overloaded to under-utilised qualified teachers. Changes stay in draft until the timetable is republished.',
              confirmLabel: 'Rebalance', icon: 'scale',
            }, () => toast('Rebalance drafted', 'Review the changes in the timetable builder.')),
          }),
        ] : null,
        kpis: [
          { label: 'Allocations', value: formatNumber(flat.filter((r) => r.periods).length), icon: 'book-open', tone: 'brand' },
          { label: 'Periods allocated', value: formatNumber(flat.reduce((a, r) => a + r.periods, 0)), icon: 'clock', tone: 'info' },
          { label: 'Out of specialism', value: mismatched.length, icon: 'alert-triangle', tone: mismatched.length ? 'warning' : 'success', footer: 'Teaching a subject they do not list' },
          { label: 'Qualified but idle', value: flat.filter((r) => r.qualified && r.periods === 0).length, icon: 'user-x', tone: 'info' },
        ],
        chart: barChart({
          categories: codes.map((c) => subjectName(c)),
          series: [{ name: 'Teachers allocated', values: codes.map((c) => new Set(flat.filter((r) => r.subjectCode === c && r.periods).map((r) => r.teacherId)).size) }],
          horizontal: true, showValues: true, height: 340,
        }),
        chartTitle: 'Teachers allocated per subject',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Teacher or subject…', width: '240px' },
          { id: 'subjectName', label: 'Subject', options: codes.map((c) => subjectName(c)) },
          { id: 'department', label: 'Department', options: Array.from(new Set(teachers.map((t) => t.department))) },
          { id: 'status', label: 'Status', options: ['Allocated', 'Qualified, not scheduled', 'Out of specialism'] },
        ],
        onFilter: (id, value, all, table) => {
          let out = flat.slice();
          if (all.q) out = search(out, all.q, ['teacherName', 'subjectName', 'designation']);
          for (const k of ['subjectName', 'department', 'status']) if (all[k] && all[k] !== 'all') out = out.filter((r) => r[k] === all[k]);
          table.refresh(out);
        },
        columns: [
          {
            key: 'teacherName', label: 'Teacher', sticky: true, width: 230,
            render: (r) => Identity(r.teacherName, r.designation, { onClick: () => navigate('teachers/profile/' + r.teacherId) }),
            value: (r) => r.teacherName,
          },
          { key: 'department', label: 'Department', width: 150, filter: true, hidden: true },
          {
            key: 'subjectName', label: 'Subject', width: 190, filter: true,
            render: (r) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, subjectSwatch(r.subjectCode), r.subjectName),
            value: (r) => r.subjectName,
          },
          { key: 'qualified', label: 'Specialism', width: 130, align: 'center', render: (r) => Badge(r.qualified ? 'Core' : 'Extra', { tone: r.qualified ? 'success' : 'warning' }), value: (r) => (r.qualified ? 'Core' : 'Extra') },
          { key: 'periods', label: 'Periods/wk', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'sections', label: 'Sections', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          {
            key: 'weeklyLoad', label: 'Total load', width: 170, align: 'right', numeric: true,
            render: (r) => h('div', { className: 'stack-1' },
              h('span', { className: 't-xs t-num' }, `${r.weeklyLoad}/${MAX_WEEKLY_PERIODS}`),
              ProgressBar(Math.min(r.weeklyLoad, MAX_WEEKLY_PERIODS), { max: MAX_WEEKLY_PERIODS, size: 'sm', tone: loadTone(r.weeklyLoad) })),
          },
          { key: 'status', label: 'Status', width: 200, filter: true, render: (r) => Badge(r.status, { tone: r.status === 'Allocated' ? 'success' : r.status === 'Out of specialism' ? 'warning' : 'info' }) },
        ],
        rows: flat,
        selectable: true,
        footerAggregates: true,
        searchKeys: ['teacherName', 'subjectName'],
        pageSize: 50,
        exportName: 'subject-allocation',
        bulkActions: [
          { label: 'Move periods', icon: 'refresh-ccw', onClick: (sel) => toast('Reallocation drafted', `${sel.length} allocations queued.`) },
          { label: 'Export', icon: 'download', onClick: (sel) => toast('Export ready', `${sel.length} rows exported.`) },
        ],
        rowActions: (r) => [
          { label: 'Teacher profile', icon: 'id-card', route: 'teachers/profile/' + r.teacherId },
          { label: 'Teacher timetable', icon: 'calendar', route: 'timetable/teacher/' + r.teacherId },
          { label: 'Class-subject map', icon: 'workflow', route: 'academics/class-subject-teacher' },
        ],
        notes: SectionCard({
          title: 'Allocation matrix', icon: 'grid',
          subtitle: `Weekly periods per teacher and subject · showing ${shown.length} scheduled teachers · ○ = qualified but not scheduled`,
          actions: Button('Print', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(document.body, 'Subject allocation matrix') }),
        }, matrix()),
        emptyState: EmptyState({ icon: 'book-open', title: 'No allocations match', text: 'Clear a filter to see the full allocation list.' }),
      }));
    },
  },

  /* ------------------------------------------------ teachers/timetable --- */
  'teachers/timetable': {
    title: 'Teacher Timetable',
    subtitle: 'Personal grid, free-teacher board and department day view',
    section: 'teachers',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const staff = teachersFor(campusId);
      if (!staff.length) { mount.appendChild(missingRecord('teacher', 'teachers/directory')); return; }
      const load = teacherLoad(campusId);
      let teacher = staff.find((s) => s.id === ctx.param) || staff.find((s) => (load.get(s.id) || 0) > 0) || staff[0];
      let day = DAYS[Math.max(0, parseISO(TODAY).getDay() - 1)] || 'Thursday';

      const host = h('div', { className: 'stack' });
      const gridHost = h('div');
      const freeHost = h('div');
      const dayHost = h('div');

      const paint = () => {
        const slots = slotsForTeacher(teacher.id);
        const codes = Array.from(new Set(slots.map((s) => s.subjectCode)));

        gridHost.innerHTML = '';
        gridHost.appendChild(slots.length
          ? frag(timetableGrid({
            slots, primary: (s) => `${s.className}-${s.section}`, secondary: (s) => s.subjectName, tertiary: (s) => s.room,
          }), timetableLegend(codes))
          : EmptyState({ icon: 'calendar', title: 'No periods allocated', text: `${teacher.name} has an empty timetable.`, action: Button('Open builder', { variant: 'primary', icon: 'tool', route: 'timetable/builder' }) }));

        // Free-teacher board for the chosen day
        freeHost.innerHTML = '';
        const periods = teachingPeriods();
        const rows = periods.map((p) => {
          const busy = new Set(db.timetableSlots.filter((s) => s.campusId === campusId && s.day === day && s.periodNo === p.no).map((s) => s.teacherId));
          const free = staff.filter((t) => !busy.has(t.id));
          return { period: p, free };
        });
        freeHost.appendChild(DataTable({
          columns: [
            { key: 'period', label: 'Period', width: 110, render: (r) => Identity('P' + r.period.no, `${r.period.startTime}–${r.period.endTime}`), value: (r) => r.period.no },
            { key: 'count', label: 'Free teachers', width: 130, align: 'right', numeric: true, value: (r) => r.free.length, render: (r) => Badge(String(r.free.length), { tone: r.free.length ? 'success' : 'danger' }) },
            {
              key: 'names', label: 'Available for cover', sortable: false,
              render: (r) => (r.free.length
                ? h('div', { className: 'chip-row' }, r.free.slice(0, 8).map((t) => h('button', {
                  className: 'tt-chip', type: 'button', style: { padding: '2px 8px' },
                  onClick: () => { teacher = t; paint(); },
                }, Avatar(t.name, { size: 'xs' }), t.name)))
                : h('span', { className: 't-faint' }, 'Everyone is teaching')),
            },
          ],
          rows, paginate: false, searchable: false, columnToggle: false, exportable: false, maxHeight: 'none',
        }));

        // Department day view
        dayHost.innerHTML = '';
        const dept = teacher.department;
        const deptTeachers = staff.filter((t) => t.department === dept).slice(0, 20);
        const thead = h('thead', null, h('tr', null,
          h('th', { className: 'matrix-head' }, 'Teacher'),
          periods.map((p) => h('th', null, `P${p.no}`))));
        const tbody = h('tbody');
        for (const t of deptTeachers) {
          const tr = h('tr');
          tr.appendChild(h('th', { className: 'matrix-head', attrs: { scope: 'row' } },
            h('button', { className: 'matrix-btn', type: 'button', style: { textAlign: 'left' }, onClick: () => { teacher = t; paint(); } }, t.name)));
          for (const p of periods) {
            const s = slotsForTeacher(t.id).find((x) => x.day === day && x.periodNo === p.no);
            tr.appendChild(h('td', null, s
              ? h('span', { className: 'matrix-cell' },
                h('span', { className: 'matrix-cell-name' }, `${s.className}-${s.section}`),
                h('span', { className: 'matrix-cell-meta' }, s.subjectCode))
              : h('span', { className: 't-success t-xs' }, 'Free')));
          }
          tbody.appendChild(tr);
        }
        dayHost.appendChild(h('div', { className: 'matrix-wrap' }, h('table', { className: 'matrix' }, thead, tbody)));
      };

      host.appendChild(filterCard([
        {
          id: 'teacher', label: 'Teacher', type: 'select', value: teacher.id, width: '320px',
          options: sortBy(staff, 'name').map((t) => ({ value: t.id, label: `${t.name} — ${load.get(t.id) || 0} p/wk` })),
        },
        { id: 'day', label: 'Day', type: 'select', value: day, options: DAYS },
      ], (id, value) => {
        if (value === 'all') return;
        if (id === 'teacher') { const t = staff.find((x) => x.id === value); if (t) { teacher = t; paint(); } }
        if (id === 'day') { day = value; paint(); }
      }, h('div', { className: 'row' },
        Button('Substitution', { variant: 'ghost', size: 'sm', icon: 'refresh-ccw', route: 'teachers/substitution' }),
        Button('Print', { variant: 'ghost', size: 'sm', icon: 'print', onClick: () => printNode(gridHost, `${teacher.name} timetable`) }))));

      host.appendChild(kpiRow([
        { label: 'Weekly periods', value: load.get(teacher.id) || 0, icon: 'clock', tone: loadTone(load.get(teacher.id) || 0), footer: loadLabel(load.get(teacher.id) || 0) },
        { label: 'Free periods', value: teachingPeriods().length * DAYS.length - (load.get(teacher.id) || 0), icon: 'coffee', tone: 'info' },
        { label: 'Department', value: teacher.department, icon: 'building', tone: 'brand' },
        { label: 'Class teacher of', value: teacher.classTeacherOf ? (db.sections.find((s) => s.id === teacher.classTeacherOf) || {}).label || '—' : '—', icon: 'user-check', tone: 'success' },
      ]));

      host.appendChild(SectionCard({
        title: `${teacher.name} — weekly grid`, icon: 'presentation',
        subtitle: `${teacher.designation} · ${teacher.subjects.map((c) => subjectName(c)).join(', ') || 'no subjects listed'}`,
        actions: Button('Full profile', { variant: 'secondary', size: 'sm', icon: 'id-card', onClick: () => navigate('teachers/profile/' + teacher.id) }),
      }, gridHost));

      host.appendChild(h('div', { className: 'widget-grid' },
        h('div', { className: 'span-5' }, SectionCard({ title: `Who is free on ${day}`, icon: 'coffee', subtitle: 'Use this board when arranging cover', flush: true }, freeHost)),
        h('div', { className: 'span-7' }, SectionCard({ title: `${teacher.department} — ${day} at a glance`, icon: 'table', subtitle: 'Click a name to switch teacher' }, dayHost))));

      paint();
      mount.appendChild(page({
        title: 'Teacher Timetable',
        subtitle: `${teacher.name} · ${campusName(campusId)}`,
        route: 'teachers/timetable',
        actions: [
          Button('Directory', { variant: 'secondary', icon: 'users', route: 'teachers/directory' }),
          Button('Workload analysis', { variant: 'primary', icon: 'gauge', route: 'teachers/workload' }),
        ],
        children: host,
      }));
    },
  },

  /* --------------------------------------------- teachers/substitution --- */
  'teachers/substitution': {
    title: 'Substitution',
    subtitle: 'Cover absent teachers with ranked, free, subject-matched staff',
    section: 'teachers',
    render(mount, ctx) { renderSubstitution(mount, ctx, 'teachers/substitution'); },
  },

  /* --------------------------------------------- teachers/lesson-plans --- */
  'teachers/lesson-plans': {
    title: 'Lesson Plans',
    subtitle: 'Weekly plans submitted, reviewed and approved',
    section: 'teachers',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const plans = lessonPlans(campusId);
      const pending = plans.filter((p) => p.status === 'Submitted' || p.status === 'Under Review');
      const approved = plans.filter((p) => p.status === 'Approved');
      const drafts = plans.filter((p) => p.status === 'Draft');

      const detail = (p) => h('div', { className: 'stack-3' },
        h('div', { className: 'row-3 row-wrap' }, Badge(p.status), Badge(p.subjectName, { tone: 'info' }), Badge(`${p.periods} periods`, { tone: 'neutral' })),
        DescriptionList([
          ['Teacher', p.teacherName], ['Class', `${p.className}-${p.section}`],
          ['Unit', p.unit], ['Week', p.week],
          ['Window', `${formatDate(p.fromDate)} – ${formatDate(p.toDate)}`], ['Submitted', formatDate(p.submittedOn)],
          ['Learning objectives', `${p.objectives} objectives`], ['Assessment', p.assessment],
          ['Activities', p.activities], ['Resources', p.resources],
          ['Reviewed by', p.reviewedBy], ['Rating', `${p.rating} / 5`],
        ], { cols: 2 }),
        ProgressBar(p.completion, { max: 100, label: 'Unit delivery so far', showValue: true, tone: p.completion > 70 ? 'success' : 'warning' }),
        Callout({ tone: 'info', icon: 'lightbulb', title: 'Planned flow' },
          `Recap of the previous period, ${p.activities.toLowerCase()}, guided practice, then ${p.assessment.toLowerCase()} as the exit check.`));

      let activeTab = 'all';
      let filterState = {};
      const applyPlanFilters = () => {
        let out = plans.slice();
        if (activeTab === 'pending') out = out.filter((p) => p.status === 'Submitted' || p.status === 'Under Review');
        if (activeTab === 'approved') out = out.filter((p) => p.status === 'Approved');
        if (filterState.q) out = search(out, filterState.q, ['teacherName', 'className', 'unit', 'subjectName']);
        for (const k of ['subjectName', 'className', 'status']) {
          if (filterState[k] && filterState[k] !== 'all') out = out.filter((r) => r[k] === filterState[k]);
        }
        if (node && node.table) node.table.refresh(out);
      };

      const node = approvalQueuePage({
        title: 'Lesson Plans',
        subtitle: `${formatNumber(plans.length)} plans at ${campusName(campusId)} · ${pending.length} awaiting review`,
        route: 'teachers/lesson-plans',
        kpis: [
          { label: 'Total plans', value: formatNumber(plans.length), icon: 'clipboard-list', tone: 'brand' },
          { label: 'Approved', value: formatNumber(approved.length), icon: 'check-circle', tone: 'success', footer: `${Math.round((approved.length / Math.max(1, plans.length)) * 100)}% of submissions` },
          { label: 'Awaiting review', value: pending.length, icon: 'clock', tone: 'warning' },
          { label: 'Still in draft', value: drafts.length, icon: 'edit', tone: 'info' },
        ],
        tabs: [
          { id: 'all', label: 'All plans', icon: 'list', count: plans.length },
          { id: 'pending', label: 'Awaiting review', icon: 'clock', count: pending.length },
          { id: 'approved', label: 'Approved', icon: 'check-circle', count: approved.length },
        ],
        activeTab: 'all',
        onTabChange: (id) => { activeTab = id; applyPlanFilters(); },
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Teacher, class or unit…', width: '250px' },
          { id: 'subjectName', label: 'Subject', options: Array.from(new Set(plans.map((p) => p.subjectName))).sort() },
          { id: 'className', label: 'Class', options: Array.from(new Set(plans.map((p) => p.className))) },
          { id: 'status', label: 'Status', options: ['Draft', 'Submitted', 'Under Review', 'Approved'] },
        ],
        onFilter: (id, value, all) => { filterState = all; applyPlanFilters(); },
        columns: [
          {
            key: 'teacherName', label: 'Teacher', sticky: true, width: 210,
            render: (p) => Identity(p.teacherName, `${p.className}-${p.section}`, { onClick: () => navigate('teachers/profile/' + p.teacherId) }),
            value: (p) => p.teacherName,
          },
          {
            key: 'subjectName', label: 'Subject', width: 170, filter: true,
            render: (p) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, subjectSwatch(p.subjectCode), p.subjectName),
            value: (p) => p.subjectName,
          },
          { key: 'unit', label: 'Unit', width: 250, render: (p) => h('span', { className: 't-clamp-2' }, p.unit) },
          { key: 'week', label: 'Week', width: 100 },
          { key: 'fromDate', label: 'From', width: 120, render: (p) => formatDate(p.fromDate, 'dayMonth'), value: (p) => p.fromDate },
          { key: 'periods', label: 'Periods', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'assessment', label: 'Assessment', width: 150, filter: true },
          { key: 'submittedOn', label: 'Submitted', width: 130, render: (p) => relativeTime(p.submittedOn), value: (p) => p.submittedOn },
          { key: 'rating', label: 'Rating', width: 130, align: 'right', numeric: true, aggregate: 'avg', format: (v) => round1(v), render: (p) => Rating(p.rating, { max: 5, showValue: true }) },
          { key: 'status', label: 'Status', width: 150, filter: true, render: (p) => Badge(p.status) },
        ],
        rows: plans,
        onApprove: (p) => toast('Lesson plan approved', `${p.teacherName} · ${p.unit}`),
        onReject: (p) => toast('Sent back for revision', `${p.teacherName} · ${p.unit}`, 'warning'),
        detail,
        bulkApprove: true,
      });
      mount.appendChild(node);
    },
  },

  /* ------------------------------------------------ teachers/appraisal --- */
  'teachers/appraisal': {
    title: 'Appraisal',
    subtitle: 'Cycle scores, feedback and development goals',
    section: 'teachers',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const teachers = db.staff.filter((s) => s.campusId === campusId && s.type === 'Teaching');
      const load = teacherLoad(campusId);
      const rows = teachers.map((t) => {
        const a = appraisalFor(t.id);
        return {
          ...t,
          overall: a ? a.overall : 0,
          studentFeedback: a ? a.studentFeedback : 0,
          parentFeedback: a ? a.parentFeedback : 0,
          peerFeedback: a ? a.peerFeedback : 0,
          responses: a ? a.responses : 0,
          reviewer: a ? a.reviewer : '—',
          reviewedOn: a ? a.reviewedOn : null,
          periods: load.get(t.id) || 0,
          band: (a ? a.overall : 0) >= 4.4 ? 'Outstanding' : (a ? a.overall : 0) >= 3.8 ? 'Exceeds' : (a ? a.overall : 0) >= 3 ? 'Meets' : 'Needs Improvement',
        };
      });
      const ratingCounts = ['Outstanding', 'Exceeds', 'Meets', 'Needs Improvement']
        .map((k) => ({ key: k, value: rows.filter((r) => r.band === k).length }));

      const openDrawer = (r) => {
        const a = appraisalFor(r.id);
        Drawer({
          title: r.name, subtitle: `${r.designation} · ${a ? a.cycle : 'not appraised'}`, size: 'xl',
          body: a ? h('div', { className: 'stack-3' },
            kpiRow([
              { label: 'Overall', value: `${a.overall} / 5`, icon: 'star', tone: 'brand' },
              { label: 'Students', value: `${a.studentFeedback} / 5`, icon: 'graduation-cap', tone: 'info' },
              { label: 'Parents', value: `${a.parentFeedback} / 5`, icon: 'users', tone: 'success' },
              { label: 'Peers', value: `${a.peerFeedback} / 5`, icon: 'handshake', tone: 'warning' },
            ]),
            SectionCard({ title: 'Dimension profile', className: 'chart-card', icon: 'target' }, radarChart(a.scores, { title: `${r.name} appraisal` })),
            SectionCard({ title: 'Development goals', icon: 'flag' },
              h('div', { className: 'stack-3' }, a.goals.map((g) => h('div', { className: 'stack-1' },
                h('div', { className: 'row' }, h('span', { className: 't-sm t-medium flex-1' }, g.goal), h('span', { className: 't-xs t-muted' }, formatDate(g.due, 'dayMonth'))),
                ProgressBar(g.progress, { max: 100, size: 'sm', showValue: true, tone: g.progress > 70 ? 'success' : 'warning' }))))),
            Callout({ tone: 'success', icon: 'thumbs-up', title: 'Strengths' }, a.strengths),
            Callout({ tone: 'info', icon: 'lightbulb', title: 'Development focus' }, a.development))
            : EmptyState({ icon: 'star', title: 'Not appraised', text: 'No appraisal record exists for this cycle.' }),
          actions: (close) => frag(
            Button('Close', { variant: 'ghost', onClick: close }),
            Button('Open profile', { variant: 'secondary', icon: 'id-card', onClick: () => { close(); navigate('teachers/profile/' + r.id); } }),
            canEdit() ? Button('Record review', { variant: 'primary', icon: 'check', onClick: () => { close(); toast('Review recorded', `${r.name} · cycle 2026-27.`); } }) : null),
        });
      };

      mount.appendChild(listPage({
        title: 'Appraisal',
        subtitle: `${rows.length} teachers · cycle 2026-27 mid-year · ${campusName(campusId)}`,
        route: 'teachers/appraisal',
        actions: canEdit() ? [
          Button('Export cycle report', { variant: 'secondary', icon: 'download', onClick: () => toast('Export ready', 'Appraisal cycle report downloaded.') }),
          Button('Start next cycle', {
            variant: 'primary', icon: 'refresh',
            onClick: () => confirmThen({
              title: 'Open the year-end appraisal cycle?',
              text: 'Self-assessment forms open for all teaching staff with a two-week window.',
              confirmLabel: 'Open cycle', icon: 'refresh',
            }, () => toast('Cycle opened', 'Self-assessment forms are live on the teacher portal.')),
          }),
        ] : null,
        kpis: [
          { label: 'Average score', value: `${round1(rows.reduce((a, r) => a + r.overall, 0) / Math.max(1, rows.length))} / 5`, icon: 'star', tone: 'brand' },
          { label: 'Outstanding', value: rows.filter((r) => r.band === 'Outstanding').length, icon: 'trophy', tone: 'success' },
          { label: 'Needs improvement', value: rows.filter((r) => r.band === 'Needs Improvement').length, icon: 'alert-circle', tone: 'danger' },
          { label: 'Student feedback', value: `${round1(rows.reduce((a, r) => a + r.studentFeedback, 0) / Math.max(1, rows.length))} / 5`, icon: 'graduation-cap', tone: 'info', footer: `${formatNumber(rows.reduce((a, r) => a + r.responses, 0))} responses` },
        ],
        chart: h('div', { className: 'widget-grid' },
          h('div', { className: 'span-6' }, barChart({
            categories: ratingCounts.map((r) => r.key),
            series: [{ name: 'Teachers', values: ratingCounts.map((r) => r.value) }],
            showValues: true, height: 250,
          })),
          h('div', { className: 'span-6' }, scatterPlot({
            points: rows.filter((r) => r.overall).slice(0, 160).map((r) => ({ x: r.periods, y: r.overall, label: r.name, group: r.band === 'Outstanding' ? 'Outstanding' : r.band === 'Needs Improvement' ? 'Needs Improvement' : 'Meets / Exceeds' })),
            xLabel: 'Weekly periods', yLabel: 'Appraisal score', height: 250,
          }))),
        chartTitle: 'Rating distribution and load vs performance',
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Teacher name…', width: '230px' },
          { id: 'department', label: 'Department', options: Array.from(new Set(rows.map((r) => r.department))) },
          { id: 'band', label: 'Band', options: ['Outstanding', 'Exceeds', 'Meets', 'Needs Improvement'] },
          { id: 'designation', label: 'Designation', options: Array.from(new Set(rows.map((r) => r.designation))) },
        ],
        onFilter: (id, value, all, table) => {
          let out = rows.slice();
          if (all.q) out = search(out, all.q, ['name', 'designation', 'department']);
          for (const k of ['department', 'band', 'designation']) if (all[k] && all[k] !== 'all') out = out.filter((r) => r[k] === all[k]);
          table.refresh(out);
        },
        columns: [
          { key: 'name', label: 'Teacher', sticky: true, width: 230, render: (r) => Identity(r.name, `${r.employeeCode} · ${r.designation}`), value: (r) => r.name },
          { key: 'department', label: 'Department', width: 150, filter: true },
          { key: 'experienceYears', label: 'Experience', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round1(v)} yrs` },
          { key: 'periods', label: 'Periods/wk', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => Math.round(v) },
          { key: 'overall', label: 'Overall', width: 150, align: 'right', numeric: true, aggregate: 'avg', format: (v) => round1(v), render: (r) => Rating(r.overall, { max: 5, showValue: true }) },
          { key: 'studentFeedback', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => round1(v) },
          { key: 'parentFeedback', label: 'Parents', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => round1(v) },
          { key: 'peerFeedback', label: 'Peers', width: 100, align: 'right', numeric: true, aggregate: 'avg', format: (v) => round1(v), hidden: true },
          { key: 'responses', label: 'Responses', width: 110, align: 'right', numeric: true, aggregate: 'sum', hidden: true },
          { key: 'attendancePct', label: 'Attendance', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round1(v)}%`, render: (r) => `${r.attendancePct}%` },
          { key: 'trainingsCompleted', label: 'Trainings', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'reviewer', label: 'Reviewer', width: 190, hidden: true },
          { key: 'band', label: 'Band', width: 170, filter: true, render: (r) => Badge(r.band, { tone: r.band === 'Outstanding' ? 'success' : r.band === 'Needs Improvement' ? 'danger' : r.band === 'Exceeds' ? 'info' : 'neutral' }) },
        ],
        rows,
        selectable: true,
        footerAggregates: true,
        searchKeys: ['name', 'designation', 'department'],
        pageSize: 25,
        exportName: 'teacher-appraisal',
        bulkActions: [
          { label: 'Nominate for training', icon: 'lightbulb', onClick: (sel) => toast('Nominated', `${sel.length} teachers added to the training plan.`) },
          { label: 'Request self-assessment', icon: 'send', onClick: (sel) => toast('Forms sent', `${sel.length} self-assessment forms opened.`) },
        ],
        rowActions: (r) => [
          { label: 'Appraisal detail', icon: 'star', onClick: () => openDrawer(r) },
          { label: 'Teacher profile', icon: 'id-card', route: 'teachers/profile/' + r.id },
          { label: 'Workload', icon: 'gauge', route: 'teachers/workload' },
          { separator: true },
          canEdit() && { label: 'Record review', icon: 'edit', onClick: () => toast('Review recorded', r.name) },
        ].filter(Boolean),
        onRowClick: openDrawer,
        emptyState: EmptyState({ icon: 'star', title: 'No teachers match', text: 'Clear a filter to see the whole cycle.' }),
      }));
    },
  },

  /* ------------------------------------------------- teachers/workload --- */
  'teachers/workload': {
    title: 'Workload Analysis',
    subtitle: 'Weekly period load, fairness and capacity headroom',
    section: 'teachers',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const load = teacherLoad(campusId);
      const teachers = db.staff.filter((s) => s.campusId === campusId && s.type === 'Teaching');
      const rows = teachers.map((t) => {
        const slots = slotsForTeacher(t.id);
        const n = load.get(t.id) || 0;
        return {
          id: t.id, name: t.name, employeeCode: t.employeeCode, designation: t.designation, department: t.department,
          periods: n,
          headroom: MAX_WEEKLY_PERIODS - n,
          sections: new Set(slots.map((s) => s.sectionId)).size,
          subjects: new Set(slots.map((s) => s.subjectCode)).size,
          busiestDay: DAYS.map((d) => ({ d, n: slots.filter((s) => s.day === d).length })).sort((a, b) => b.n - a.n)[0] || { d: '—', n: 0 },
          classTeacher: t.isClassTeacher,
          utilisation: Math.round((n / MAX_WEEKLY_PERIODS) * 100),
          status: loadLabel(n),
        };
      });
      const over = rows.filter((r) => r.periods > MAX_WEEKLY_PERIODS);
      const under = rows.filter((r) => r.periods < 12);
      const avg = Math.round(rows.reduce((a, r) => a + r.periods, 0) / Math.max(1, rows.length));
      const byDept = Array.from(new Set(rows.map((r) => r.department)));

      mount.appendChild(reportPage({
        title: 'Workload Analysis',
        subtitle: `${rows.length} teachers · average ${avg} periods a week · ceiling ${MAX_WEEKLY_PERIODS}`,
        route: 'teachers/workload',
        filters: [
          { id: 'department', label: 'Department', options: byDept },
          { id: 'designation', label: 'Designation', options: Array.from(new Set(rows.map((r) => r.designation))) },
          { id: 'status', label: 'Load band', type: 'segment', options: [{ id: 'all', label: 'All' }, { id: 'Overloaded', label: 'Overloaded' }, { id: 'Near limit', label: 'Near limit' }, { id: 'Under-utilised', label: 'Under-utilised' }] },
        ],
        onFilter: (id, value, all, table) => {
          let out = rows.slice();
          for (const k of ['department', 'designation']) if (all[k] && all[k] !== 'all') out = out.filter((r) => r[k] === all[k]);
          if (all.status && all.status !== 'all') out = out.filter((r) => r.status === all.status);
          if (table) table.refresh(out);
        },
        summary: [
          { label: 'Average load', value: `${avg} p/wk`, icon: 'gauge', tone: 'brand', footer: `Ceiling ${MAX_WEEKLY_PERIODS}` },
          { label: 'Overloaded', value: over.length, icon: 'alert-triangle', tone: over.length ? 'danger' : 'success' },
          { label: 'Under-utilised', value: under.length, icon: 'user-x', tone: 'warning', footer: 'Below 12 periods' },
          { label: 'Total capacity left', value: formatNumber(rows.reduce((a, r) => a + Math.max(0, r.headroom), 0)) + ' periods', icon: 'trending-up', tone: 'info' },
        ],
        chart: [
          barChart({
            categories: byDept,
            series: [{ name: 'Average periods', values: byDept.map((d) => Math.round(rows.filter((r) => r.department === d).reduce((a, r) => a + r.periods, 0) / Math.max(1, rows.filter((r) => r.department === d).length))) }],
            target: MAX_WEEKLY_PERIODS, targetLabel: `Ceiling ${MAX_WEEKLY_PERIODS}`, showValues: true, height: 260,
          }),
          bulletChart({
            items: sortBy(rows, 'periods', 'desc').slice(0, 10).map((r) => ({ label: r.name, value: r.periods, target: MAX_WEEKLY_PERIODS, ranges: [12, 30, MAX_WEEKLY_PERIODS] })),
            height: 300,
          }),
          barChart({
            categories: ['Under 12', '12–19', '20–25', '26–30', '31–34', 'Over 34'],
            series: [{
              name: 'Teachers',
              values: [
                rows.filter((r) => r.periods < 12).length,
                rows.filter((r) => r.periods >= 12 && r.periods < 20).length,
                rows.filter((r) => r.periods >= 20 && r.periods < 26).length,
                rows.filter((r) => r.periods >= 26 && r.periods < 31).length,
                rows.filter((r) => r.periods >= 31 && r.periods <= 34).length,
                rows.filter((r) => r.periods > 34).length,
              ],
            }],
            showValues: true, height: 240,
          }),
        ],
        chartTitle: 'Average load by department',
        columns: [
          { key: 'name', label: 'Teacher', sticky: true, width: 230, render: (r) => Identity(r.name, `${r.employeeCode} · ${r.designation}`), value: (r) => r.name },
          { key: 'department', label: 'Department', width: 160, filter: true },
          { key: 'sections', label: 'Sections', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'subjects', label: 'Subjects', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          {
            key: 'periods', label: 'Periods/wk', width: 190, align: 'right', numeric: true, aggregate: 'avg', format: (v) => Math.round(v),
            render: (r) => h('div', { className: 'stack-1' },
              h('span', { className: 't-xs t-num' }, `${r.periods}/${MAX_WEEKLY_PERIODS}`),
              ProgressBar(Math.min(r.periods, MAX_WEEKLY_PERIODS + 6), { max: MAX_WEEKLY_PERIODS + 6, size: 'sm', tone: loadTone(r.periods) })),
          },
          { key: 'headroom', label: 'Headroom', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'utilisation', label: 'Utilisation', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v)}%`, render: (r) => `${r.utilisation}%` },
          { key: 'busiest', label: 'Busiest day', width: 150, value: (r) => r.busiestDay.n, render: (r) => `${DAY_SHORT[r.busiestDay.d] || r.busiestDay.d} · ${r.busiestDay.n}p` },
          { key: 'classTeacher', label: 'Class teacher', width: 130, align: 'center', render: (r) => (r.classTeacher ? Badge('Yes', { tone: 'brand' }) : h('span', { className: 't-faint' }, '—')), value: (r) => (r.classTeacher ? 'Yes' : 'No') },
          { key: 'status', label: 'Band', width: 160, filter: true, render: (r) => Badge(r.status, { tone: loadTone(r.periods) }) },
        ],
        rows,
        tableTitle: 'Teacher-wise load',
        footerAggregates: true,
        pageSize: 50,
        notes: over.length
          ? Callout({ tone: 'danger', icon: 'alert-triangle', title: `${over.length} teachers are above the weekly ceiling` },
            h('div', { className: 'row row-wrap', style: { gap: 'var(--sp-3)' } },
              h('span', null, `${over.map((r) => r.name).slice(0, 4).join(', ')}${over.length > 4 ? ` and ${over.length - 4} more` : ''} exceed ${MAX_WEEKLY_PERIODS} periods. Move periods to the ${under.length} under-utilised colleagues.`),
              Button('Rebalance', { variant: 'secondary', size: 'sm', icon: 'scale', route: 'teachers/subject-allocation' }),
              Button('Open builder', { variant: 'primary', size: 'sm', icon: 'tool', route: 'timetable/builder' })))
          : Callout({ tone: 'success', icon: 'check-circle', title: 'Load is within policy' },
            `No teacher exceeds ${MAX_WEEKLY_PERIODS} periods a week. ${formatNumber(rows.reduce((a, r) => a + Math.max(0, r.headroom), 0))} periods of capacity remain.`),
      }));
    },
  },

  /* -------------------------------------------------- teachers/reports --- */
  'teachers/reports': {
    title: 'Teacher Reports',
    subtitle: 'Staffing, deployment, performance and attendance',
    section: 'teachers',
    render(mount, ctx) {
      ensureStyles();
      const campusId = currentCampus(ctx);
      const teachers = db.staff.filter((s) => s.campusId === campusId && s.type === 'Teaching');
      const load = teacherLoad(campusId);
      const plans = lessonPlans(campusId);
      const syllabus = syllabusRows(campusId);

      const rows = teachers.map((t) => {
        const n = load.get(t.id) || 0;
        const myPlans = plans.filter((p) => p.teacherId === t.id);
        const mySyll = syllabus.filter((s) => s.teacherId === t.id);
        const a = appraisalFor(t.id);
        const leaves = db.leaveRequests.filter((l) => l.employeeId === t.id && l.status === 'Approved');
        return {
          id: t.id, name: t.name, employeeCode: t.employeeCode, designation: t.designation,
          department: t.department, experienceYears: t.experienceYears, qualification: t.qualification,
          periods: n,
          sections: new Set(slotsForTeacher(t.id).map((s) => s.sectionId)).size,
          plans: myPlans.length,
          plansApproved: myPlans.filter((p) => p.status === 'Approved').length,
          syllabusPct: mySyll.length ? Math.round(mySyll.reduce((x, s) => x + s.completion, 0) / mySyll.length) : 0,
          attendancePct: t.attendancePct,
          leaveDays: leaves.reduce((x, l) => x + l.days, 0),
          appraisal: a ? a.overall : 0,
          studentFeedback: a ? a.studentFeedback : 0,
          trainings: t.trainingsCompleted,
          docs: t.documentsComplete ? 'Complete' : 'Incomplete',
          status: t.status,
        };
      });

      const byDesignation = countBy(teachers, 'designation').slice(0, 8);
      const byQualification = countBy(teachers, 'qualification').slice(0, 6);
      const expBands = ['0-2 yrs', '3-5 yrs', '6-10 yrs', '11-15 yrs', '16+ yrs'];
      const expCounts = [
        teachers.filter((t) => t.experienceYears <= 2).length,
        teachers.filter((t) => t.experienceYears > 2 && t.experienceYears <= 5).length,
        teachers.filter((t) => t.experienceYears > 5 && t.experienceYears <= 10).length,
        teachers.filter((t) => t.experienceYears > 10 && t.experienceYears <= 15).length,
        teachers.filter((t) => t.experienceYears > 15).length,
      ];

      mount.appendChild(reportPage({
        title: 'Teacher Reports',
        subtitle: `${teachers.length} teaching staff at ${campusName(campusId)} · session ${db.academicYears.find((y) => y.current).name}`,
        route: 'teachers/reports',
        filters: [
          { id: 'department', label: 'Department', options: Array.from(new Set(rows.map((r) => r.department))) },
          { id: 'designation', label: 'Designation', options: Array.from(new Set(rows.map((r) => r.designation))) },
          { id: 'status', label: 'Status', options: ['Active', 'On Leave', 'Notice Period'] },
          { id: 'docs', label: 'Documents', type: 'segment', options: [{ id: 'all', label: 'All' }, { id: 'Complete', label: 'Complete' }, { id: 'Incomplete', label: 'Incomplete' }] },
        ],
        onFilter: (id, value, all, table) => {
          let out = rows.slice();
          for (const k of ['department', 'designation', 'status']) if (all[k] && all[k] !== 'all') out = out.filter((r) => r[k] === all[k]);
          if (all.docs && all.docs !== 'all') out = out.filter((r) => r.docs === all.docs);
          if (table) table.refresh(out);
        },
        summary: [
          { label: 'Teaching staff', value: teachers.length, icon: 'presentation', tone: 'brand', delta: 3.1, deltaLabel: 'vs last session' },
          { label: 'Student : teacher', value: `${round1(db.students.filter((s) => s.campusId === campusId && s.status === 'Active').length / Math.max(1, teachers.length))} : 1`, icon: 'scale', tone: 'info', footer: 'CBSE norm 30 : 1' },
          { label: 'Avg attendance', value: `${round1(teachers.reduce((a, t) => a + t.attendancePct, 0) / Math.max(1, teachers.length))}%`, icon: 'clipboard-check', tone: 'success', trend: analytics.sparks.staffAttendance },
          { label: 'Avg appraisal', value: `${round1(rows.reduce((a, r) => a + r.appraisal, 0) / Math.max(1, rows.length))} / 5`, icon: 'star', tone: 'warning' },
        ],
        chart: [
          barChart({ categories: byDesignation.map((d) => d.key), series: [{ name: 'Teachers', values: byDesignation.map((d) => d.value) }], horizontal: true, showValues: true, height: 280 }),
          barChart({ categories: expBands, series: [{ name: 'Teachers', values: expCounts }], showValues: true, height: 240 }),
          donutChart({ data: byQualification, height: 260, centerValue: String(teachers.length), centerLabel: 'Teachers' }),
          lineChart({
            categories: analytics.staffAttendance.map((m) => m.month),
            series: [
              { name: 'Present %', values: analytics.staffAttendance.map((m) => m.present) },
              { name: 'On leave %', values: analytics.staffAttendance.map((m) => m.leave) },
            ],
            valueFormat: 'percent', height: 260,
          }),
        ],
        chartTitle: 'Staffing profile',
        columns: [
          { key: 'name', label: 'Teacher', sticky: true, width: 230, render: (r) => Identity(r.name, `${r.employeeCode} · ${r.designation}`), value: (r) => r.name },
          { key: 'department', label: 'Department', width: 160, filter: true },
          { key: 'qualification', label: 'Qualification', width: 170, filter: true },
          { key: 'experienceYears', label: 'Experience', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round1(v)} yrs` },
          { key: 'periods', label: 'Periods/wk', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => Math.round(v) },
          { key: 'sections', label: 'Sections', width: 100, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'plans', label: 'Lesson plans', width: 130, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'plansApproved', label: 'Approved', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          {
            key: 'syllabusPct', label: 'Syllabus', width: 160, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${Math.round(v)}%`,
            render: (r) => ProgressBar(r.syllabusPct, { max: 100, size: 'sm', showValue: true, tone: r.syllabusPct > 60 ? 'success' : 'warning' }),
          },
          { key: 'attendancePct', label: 'Attendance', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => `${round1(v)}%`, render: (r) => `${r.attendancePct}%` },
          { key: 'leaveDays', label: 'Leave days', width: 120, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'trainings', label: 'Trainings', width: 110, align: 'right', numeric: true, aggregate: 'sum' },
          { key: 'appraisal', label: 'Appraisal', width: 120, align: 'right', numeric: true, aggregate: 'avg', format: (v) => round1(v) },
          { key: 'studentFeedback', label: 'Student feedback', width: 150, align: 'right', numeric: true, aggregate: 'avg', format: (v) => round1(v), hidden: true },
          { key: 'docs', label: 'Documents', width: 130, filter: true, render: (r) => Badge(r.docs, { tone: r.docs === 'Complete' ? 'success' : 'warning' }) },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        tableTitle: 'Teacher-wise report',
        footerAggregates: true,
        pageSize: 50,
        notes: Callout({ tone: 'info', icon: 'info', title: 'What this report covers' },
          'Deployment (periods, sections), delivery (lesson plans, syllabus completion), reliability (attendance, leave) and performance (appraisal, student feedback) for every teaching member of staff at the selected campus. Use the CSV export for the management pack.'),
      }));
    },
  },
};

export const routes = { ...academicsRoutes, ...timetableRoutes, ...teachersRoutes };
export default routes;
