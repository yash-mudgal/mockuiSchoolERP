/* ==========================================================================
   state.js — central observable store
   get(key) / set(patch) / subscribe(fn) / subscribeKey(key, fn)
   Session is persisted to localStorage under `springdale.erp.v1`.
   ========================================================================== */

const LS_KEY = 'springdale.erp.v1';

/* ------------------------------------------------------------------ roles */

export const ROLES = [
  { id: 'super-admin',      name: 'Super Admin',        group: 'Leadership',   icon: 'shield-check',  dashboard: 'dashboard/super-admin' },
  { id: 'management',       name: 'Management',         group: 'Leadership',   icon: 'building-columns', dashboard: 'dashboard/management' },
  { id: 'principal',        name: 'Principal',          group: 'Leadership',   icon: 'graduation-cap', dashboard: 'dashboard/principal' },
  { id: 'vice-principal',   name: 'Vice Principal',     group: 'Leadership',   icon: 'user-check',    dashboard: 'dashboard/principal' },
  { id: 'administrator',    name: 'Administrator',      group: 'Operations',   icon: 'settings',      dashboard: 'dashboard/super-admin' },
  { id: 'admission-officer',name: 'Admission Officer',  group: 'Operations',   icon: 'user-plus',     dashboard: 'admissions/dashboard' },
  { id: 'accountant',       name: 'Accountant',         group: 'Operations',   icon: 'wallet',        dashboard: 'dashboard/accountant' },
  { id: 'hr-manager',       name: 'HR Manager',         group: 'Operations',   icon: 'briefcase',     dashboard: 'dashboard/hr' },
  { id: 'hr-executive',     name: 'HR Executive',       group: 'Operations',   icon: 'users',         dashboard: 'dashboard/hr' },
  { id: 'teacher',          name: 'Teacher',            group: 'Academics',    icon: 'presentation',  dashboard: 'dashboard/teacher' },
  { id: 'class-teacher',    name: 'Class Teacher',      group: 'Academics',    icon: 'clipboard-check', dashboard: 'dashboard/teacher' },
  { id: 'librarian',        name: 'Librarian',          group: 'Facilities',   icon: 'library',       dashboard: 'dashboard/librarian' },
  { id: 'transport-manager',name: 'Transport Manager',  group: 'Facilities',   icon: 'bus',           dashboard: 'dashboard/transport' },
  { id: 'hostel-warden',    name: 'Hostel Warden',      group: 'Facilities',   icon: 'bed',           dashboard: 'dashboard/hostel' },
  { id: 'nurse',            name: 'School Nurse',       group: 'Facilities',   icon: 'stethoscope',   dashboard: 'dashboard/nurse' },
  { id: 'security',         name: 'Security',           group: 'Facilities',   icon: 'shield',        dashboard: 'security/visitors' },
  { id: 'front-office',     name: 'Front Office',       group: 'Facilities',   icon: 'phone',         dashboard: 'dashboard/front-office' },
  { id: 'student',          name: 'Student',            group: 'Portals',      icon: 'user',          dashboard: 'dashboard/student' },
  { id: 'parent',           name: 'Parent',             group: 'Portals',      icon: 'users',         dashboard: 'dashboard/parent' },
  { id: 'employee',         name: 'Employee',           group: 'Portals',      icon: 'id-card',       dashboard: 'portals/employee/profile' },
];

export const ROLE_IDS = ROLES.map((r) => r.id);
export const roleById = (id) => ROLES.find((r) => r.id === id) || ROLES[0];

/* ------------------------------------------------------------ permissions */

const ALL = '*';
const PERMISSIONS = {
  'super-admin': [ALL],
  'management': ['dashboard.view','reports.view','finance.view','fees.view','students.view','hr.view','admissions.view','analytics.view','system.audit'],
  'principal': ['dashboard.view','students.*','teachers.*','academics.*','attendance.*','examination.*','timetable.*','admissions.view','fees.view','hr.view','reports.view','communication.*','ptm.*','complaints.*','events.*','activities.*'],
  'vice-principal': ['dashboard.view','students.*','teachers.view','academics.*','attendance.*','examination.*','timetable.*','reports.view','communication.send','ptm.*','complaints.view'],
  'administrator': ['dashboard.view','students.*','hr.view','fees.view','inventory.*','frontoffice.*','security.*','complaints.*','events.*','communication.*','system.view'],
  'admission-officer': ['dashboard.view','admissions.*','students.create','students.view','fees.view','communication.send','reports.admissions'],
  'accountant': ['dashboard.view','fees.*','finance.*','reports.finance','students.view','communication.send'],
  'hr-manager': ['dashboard.view','hr.*','teachers.view','reports.hr','communication.send','system.view'],
  'hr-executive': ['dashboard.view','hr.view','hr.attendance','hr.leave','teachers.view','reports.hr'],
  'teacher': ['dashboard.view','portals.teacher','students.view','attendance.mark','examination.marks','lms.*','timetable.view','ptm.view','communication.send'],
  'class-teacher': ['dashboard.view','portals.teacher','students.view','students.edit','attendance.*','examination.marks','examination.reportcard','lms.*','timetable.view','ptm.*','communication.send','complaints.create'],
  'librarian': ['dashboard.view','library.*','students.view','reports.library'],
  'transport-manager': ['dashboard.view','transport.*','students.view','reports.transport','communication.send'],
  'hostel-warden': ['dashboard.view','hostel.*','students.view','reports.hostel','complaints.view'],
  'nurse': ['dashboard.view','health.*','students.view','reports.health'],
  'security': ['dashboard.view','security.*','frontoffice.visitors','students.view'],
  'front-office': ['dashboard.view','frontoffice.*','admissions.enquiry','students.view','communication.send','complaints.create'],
  'student': ['portals.student','lms.view','library.view'],
  'parent': ['portals.parent','fees.pay','communication.view'],
  'employee': ['portals.employee'],
};

/* ------------------------------------------------------------ demo users */

export const DEMO_USERS = {
  'super-admin':       { id: 'U-001', name: 'Rohit Malhotra',    designation: 'Group IT Head' },
  'management':        { id: 'U-002', name: 'Anita Bhandari',    designation: 'Trustee & Director' },
  'principal':         { id: 'U-003', name: 'Dr. Meera Krishnan',designation: 'Principal — Main Campus' },
  'vice-principal':    { id: 'U-004', name: 'Sanjay Deshpande',  designation: 'Vice Principal' },
  'administrator':     { id: 'U-005', name: 'Vikram Sethi',      designation: 'Head — Administration' },
  'admission-officer': { id: 'U-006', name: 'Priya Nair',        designation: 'Senior Admission Officer' },
  'accountant':        { id: 'U-007', name: 'Rakesh Agarwal',    designation: 'Chief Accountant' },
  'hr-manager':        { id: 'U-008', name: 'Kavya Reddy',       designation: 'Manager — Human Resources' },
  'hr-executive':      { id: 'U-009', name: 'Nikhil Joshi',      designation: 'HR Executive' },
  'teacher':           { id: 'U-010', name: 'Shalini Verma',     designation: 'PGT — Physics' },
  'class-teacher':     { id: 'U-011', name: 'Arjun Menon',       designation: 'Class Teacher — VIII B' },
  'librarian':         { id: 'U-012', name: 'Farida Qureshi',    designation: 'Chief Librarian' },
  'transport-manager': { id: 'U-013', name: 'Harpreet Gill',     designation: 'Transport Manager' },
  'hostel-warden':     { id: 'U-014', name: 'Suresh Rawat',      designation: 'Warden — Aravalli House' },
  'nurse':             { id: 'U-015', name: 'Sister Elizabeth Thomas', designation: 'School Nurse' },
  'security':          { id: 'U-016', name: 'Balwinder Singh',   designation: 'Security Supervisor' },
  'front-office':      { id: 'U-017', name: 'Divya Iyer',        designation: 'Front Office Executive' },
  'student':           { id: 'U-018', name: 'Aarav Kapoor',      designation: 'Class X-A · Nilgiri House' },
  'parent':            { id: 'U-019', name: 'Neelam Kapoor',     designation: 'Parent of Aarav (X-A) & Myra (VI-C)' },
  'employee':          { id: 'U-020', name: 'Ramesh Yadav',      designation: 'Lab Assistant — Chemistry' },
};

function initials(name) {
  return String(name || '')
    .replace(/^(Dr|Mr|Mrs|Ms|Sister)\.?\s+/i, '')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0]).join('').toUpperCase();
}

export function userForRole(role) {
  const u = DEMO_USERS[role] || DEMO_USERS['super-admin'];
  return { id: u.id, name: u.name, role, designation: u.designation, avatarInitials: initials(u.name) };
}

/* ---------------------------------------------------------------- store */

const defaults = {
  authenticated: false,
  locked: false,
  currentUser: null,
  role: 'super-admin',
  campusId: 'C1',
  academicYearId: 'AY2026',
  theme: 'light',
  density: 'comfortable',
  sidebarCollapsed: false,
  mobileNavOpen: false,
  favourites: ['students/all', 'fees/collection', 'attendance/mark-daily', 'dashboard/principal'],
  notifications: [],
  toasts: [],
  recentRoutes: [],
  navFilter: '',
  openSections: {},
  paletteOpen: false,
  notificationsOpen: false,
};

const PERSIST_KEYS = ['authenticated', 'currentUser', 'role', 'campusId', 'academicYearId', 'theme',
  'density', 'sidebarCollapsed', 'favourites', 'recentRoutes', 'openSections'];

let state = { ...defaults };
const subscribers = new Set();
const keySubscribers = new Map();

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    for (const k of PERSIST_KEYS) if (k in saved) state[k] = saved[k];
  } catch (e) { /* corrupt or unavailable storage — fall back to defaults */ }
}

function persist() {
  try {
    const out = {};
    for (const k of PERSIST_KEYS) out[k] = state[k];
    localStorage.setItem(LS_KEY, JSON.stringify(out));
  } catch (e) { /* storage full or blocked — session stays in-memory */ }
}

load();

/** Read one key, or the whole state when called with no argument. */
export function get(key) {
  return key === undefined ? { ...state } : state[key];
}

/**
 * Merge a patch into the store and notify subscribers.
 * set({ role: 'teacher' })  |  set('role', 'teacher')
 */
export function set(patchOrKey, maybeValue) {
  const patch = typeof patchOrKey === 'string' ? { [patchOrKey]: maybeValue } : patchOrKey;
  const changed = [];
  for (const [k, v] of Object.entries(patch)) {
    if (state[k] !== v) { state[k] = v; changed.push(k); }
  }
  if (!changed.length) return state;
  persist();
  for (const fn of subscribers) { try { fn(state, changed); } catch (e) { console.error(e); } }
  for (const k of changed) {
    const set_ = keySubscribers.get(k);
    if (set_) for (const fn of set_) { try { fn(state[k], state); } catch (e) { console.error(e); } }
  }
  return state;
}

/** Subscribe to every change. Returns an unsubscribe function. */
export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/** Subscribe to changes of a single key. Returns an unsubscribe function. */
export function subscribeKey(key, fn) {
  if (!keySubscribers.has(key)) keySubscribers.set(key, new Set());
  keySubscribers.get(key).add(fn);
  return () => keySubscribers.get(key).delete(fn);
}

/* ------------------------------------------------------------- helpers */

/** True when the current role owns the permission ('fees.collect', 'students.*'). */
export function can(permission) {
  const list = PERMISSIONS[state.role] || [];
  if (list.includes(ALL)) return true;
  if (list.includes(permission)) return true;
  const [mod] = String(permission).split('.');
  return list.includes(`${mod}.*`);
}

/** True when the current role is any of the arguments. */
export function isRole(...roles) {
  return roles.flat().includes(state.role);
}

/** All permissions granted to a role (for the permission matrix screen). */
export function permissionsFor(role) {
  return (PERMISSIONS[role] || []).slice();
}

/* ------------------------------------------------------------- session */

export function login(role) {
  const user = userForRole(role);
  set({ authenticated: true, locked: false, role, currentUser: user });
  return user;
}

export function logout() {
  set({ authenticated: false, locked: false, currentUser: null, notificationsOpen: false, paletteOpen: false });
}

export function lock() { set({ locked: true }); }
export function unlock() { set({ locked: false }); }

export function switchRole(role) {
  const user = userForRole(role);
  set({ role, currentUser: user });
  return user;
}

/* ---------------------------------------------------------- favourites */

export function isFavourite(route) { return state.favourites.includes(route); }

export function toggleFavourite(route) {
  const list = state.favourites.slice();
  const i = list.indexOf(route);
  if (i >= 0) list.splice(i, 1); else list.push(route);
  set({ favourites: list });
  return i < 0;
}

export function pushRecent(route) {
  const list = state.recentRoutes.filter((r) => r !== route);
  list.unshift(route);
  set({ recentRoutes: list.slice(0, 12) });
}

/* --------------------------------------------------------------- theme */

export function applyTheme(theme) {
  const t = theme || state.theme;
  document.documentElement.setAttribute('data-theme', t);
  set({ theme: t });
}

export function toggleTheme() {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  return state.theme;
}

export function applyDensity(density) {
  const d = density || state.density;
  document.documentElement.setAttribute('data-density', d);
  set({ density: d });
}

export function toggleDensity() {
  applyDensity(state.density === 'compact' ? 'comfortable' : 'compact');
  return state.density;
}

/* ------------------------------------------------------- notifications */

export function setNotifications(list) { set({ notifications: list.slice() }); }

export function markNotificationRead(id) {
  set({ notifications: state.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)) });
}

export function markAllNotificationsRead() {
  set({ notifications: state.notifications.map((n) => ({ ...n, unread: false })) });
}

export function unreadCount() { return state.notifications.filter((n) => n.unread).length; }

/* -------------------------------------------------------------- toasts */

let toastSeq = 0;
export function pushToast(toast) {
  const t = { id: 'T' + (++toastSeq), tone: 'default', duration: 4200, ...toast };
  set({ toasts: state.toasts.concat(t) });
  return t.id;
}
export function dismissToast(id) { set({ toasts: state.toasts.filter((t) => t.id !== id) }); }

/** Reset everything (used by "Sign out" and the settings reset action). */
export function resetState() {
  try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
  state = { ...defaults };
  for (const fn of subscribers) fn(state, Object.keys(state));
}

export const store = { get, set, subscribe, subscribeKey };
export default store;
