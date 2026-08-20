/* ==========================================================================
   app.js — bootstrap
   Auth gate -> shell render -> router start, plus theme/density, the command
   palette, the notification drawer and the role switcher.
   ========================================================================== */

import { h, frag, Icon, Avatar, Badge, Button, IconButton, openMenu, closeMenu,
  notify, NotificationItem, EmptyState, Drawer, formatNumber, escapeHtml, Divider } from './core/ui.js';
import { icon } from './core/icons.js';
import * as store from './core/state.js';
import { ROLES, roleById } from './core/state.js';
import { navForRole, routeMeta, breadcrumbFor, quickActionsFor, flatNav } from './core/nav.js';
import * as router from './core/router.js';
import { navHref } from './core/router.js';
import { routes as registryRoutes } from './registry.js';
import { notFoundPage, loadingPage } from './core/page-kit.js';
import { db } from './data/db.js';
import { renderLogin, renderForgot, renderLock } from './pages/auth.js';

const appEl = document.getElementById('app');
let mainEl = null;
let sidebarScroll = null;
let crumbEl = null;
let shellEl = null;

/* ========================================================== theme & prefs */

function applyPrefs() {
  document.documentElement.setAttribute('data-theme', store.get('theme') || 'light');
  document.documentElement.setAttribute('data-density', store.get('density') || 'comfortable');
}

/* ================================================================ sidebar */

function sidebarBadge(badge) {
  if (badge == null) return null;
  const isObj = typeof badge === 'object';
  return h('span', { className: 'sb-badge', dataset: { tone: isObj ? badge.tone : null } },
    isObj ? badge.text : String(badge));
}

function buildSidebar() {
  const role = store.get('role');
  const sections = navForRole(role);
  const favourites = store.get('favourites') || [];
  const openSections = { ...(store.get('openSections') || {}) };
  const filter = (store.get('navFilter') || '').toLowerCase();

  const aside = h('aside', { className: 'app-sidebar' });

  /* brand */
  aside.appendChild(h('div', { className: 'sb-brand' },
    h('div', { className: 'sb-logo', html: icon('graduation-cap', 18) }),
    h('div', { className: 'sb-brand-text' },
      h('div', { className: 'sb-brand-name' }, 'Springdale'),
      h('div', { className: 'sb-brand-sub' }, 'School ERP'))));

  /* Campus / academic year / role, for the phone tier. Rendered always but
     CSS-hidden above 560px, where these live in the topbar instead. The
     drawer is the natural home for them on a phone: it is the one surface
     with room for a label and a value. */
  aside.appendChild(h('div', { className: 'sb-context' },
    contextButton('Viewing as', roleById(role).name, 'refresh-ccw', roleMenuItems, { role: true, title: 'View the product as' }),
    contextButton('Campus', campusLabel(currentCampus()), 'building-2', campusMenuItems, { title: 'Campus' }),
    contextButton('Academic year', currentYear().name, 'calendar', yearMenuItems, { title: 'Academic year' })));

  /* nav filter */
  const filterInput = h('input', {
    className: 'input', dataset: { size: 'sm' }, type: 'search', placeholder: 'Filter menu…',
    value: store.get('navFilter') || '',
    onInput: (e) => { store.set({ navFilter: e.target.value }); repaintSidebar(true); },
  });
  aside.appendChild(h('div', { className: 'sb-search' }, filterInput));

  const scroll = h('div', { className: 'sb-scroll' });
  sidebarScroll = scroll;

  const matches = (label) => !filter || String(label).toLowerCase().includes(filter);

  /* favourites */
  const favItems = favourites.map((r) => routeMeta(r)).filter(Boolean)
    .filter((m) => m.roles.includes(role) || role === 'super-admin');
  if (favItems.length && !filter) {
    scroll.appendChild(buildSection({
      id: '__fav', label: 'Favourites', icon: 'star',
      items: favItems.map((m) => ({ id: 'fav-' + m.id, label: m.label, icon: m.icon, route: m.route })),
    }, openSections, true));
  }

  for (const section of sections) {
    const items = section.items.filter((it) => matches(it.label)
      || (it.children || []).some((c) => matches(c.label))
      || matches(section.label));
    if (!items.length) continue;
    scroll.appendChild(buildSection({ ...section, items }, openSections, false, filter));
  }

  if (!scroll.childNodes.length) {
    scroll.appendChild(h('div', { className: 'p-4 t-sm t-muted t-center' }, 'No menu items match that filter.'));
  }

  aside.appendChild(scroll);

  /* footer */
  aside.appendChild(h('div', { className: 'sb-foot' },
    h('button', {
      className: 'sb-item',
      onClick: () => {
        const next = !store.get('sidebarCollapsed');
        store.set({ sidebarCollapsed: next });
        shellEl.setAttribute('data-collapsed', String(next));
      },
    },
      Icon('panel-left', 16),
      h('span', { className: 'sb-item-label sb-foot-label' }, 'Collapse menu'))));

  return aside;
}

/** One row of the phone-tier .sb-context block: label, current value, menu. */
function contextButton(label, value, iconName, itemsFn, { role = false, title } = {}) {
  const btn = h('button', {
    className: 'sb-context-btn',
    dataset: { role: role ? 'true' : null },
    attrs: { 'aria-label': `${label}: ${value}` },
  },
    Icon(iconName, 16),
    h('span', { className: 'sb-context-text' },
      h('span', { className: 'sb-context-label' }, label),
      h('span', { className: 'sb-context-value' }, value)),
    h('span', { className: 'chev', html: icon('chevron-down', 13) }));
  btn.addEventListener('click', () => openMenu(btn, itemsFn(), { align: 'left', title, minWidth: '230px' }));
  return btn;
}

function buildSection(section, openSections, isFav, filter) {
  const currentRoute = router.current() ? router.current().route : '';
  const open = openSections[section.id] !== false;
  const el = h('div', { className: 'sb-section', dataset: { open: String(open || !!filter) } });

  el.appendChild(h('button', {
    className: 'sb-section-head',
    onClick: () => {
      const next = { ...(store.get('openSections') || {}) };
      next[section.id] = openSections[section.id] === false;
      store.set({ openSections: next });
      repaintSidebar();
    },
  },
    h('span', null, section.label),
    h('span', { className: 'sb-caret', html: icon('chevron-down', 12) })));

  const list = h('div', { className: 'sb-items' });
  for (const item of section.items) {
    list.appendChild(buildItem(item, currentRoute, isFav, section));
  }
  el.appendChild(list);
  return el;
}

function buildItem(item, currentRoute, isFav, section) {
  const favourites = store.get('favourites') || [];
  const hasChildren = item.children && item.children.length;
  const childActive = hasChildren && item.children.some((c) => c.route === currentRoute);
  const active = item.route === currentRoute || childActive;

  if (hasChildren) {
    const wrap = h('div', null);
    const btn = h('button', {
      className: ['sb-item', 'sb-parent', active && 'is-active'].filter(Boolean).join(' '),
      attrs: { 'aria-expanded': String(active) },
      onClick: () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        sub.style.display = expanded ? 'none' : '';
      },
    },
      Icon(item.icon, 16),
      h('span', { className: 'sb-item-label' }, item.label),
      item.badge != null && sidebarBadge(item.badge),
      h('span', { className: 'sb-caret', html: icon('chevron-down', 12) }));
    const sub = h('div', { className: 'sb-sub', style: active ? null : { display: 'none' } },
      item.children.map((c) => buildLeaf(c, currentRoute, favourites, section)));
    wrap.appendChild(btn);
    wrap.appendChild(sub);
    return wrap;
  }
  return buildLeaf(item, currentRoute, favourites, section, isFav);
}

function buildLeaf(item, currentRoute, favourites, section, isFav) {
  const on = favourites.includes(item.route);
  return h('a', {
    className: ['sb-item', item.route === currentRoute && 'is-active'].filter(Boolean).join(' '),
    href: navHref(item.route),
    attrs: { title: item.label },
  },
    Icon(item.icon || section.icon, 16),
    h('span', { className: 'sb-item-label' }, item.label),
    item.badge != null && sidebarBadge(item.badge),
    !isFav && h('button', {
      className: ['sb-pin', on && 'is-on'].filter(Boolean).join(' '),
      attrs: { 'aria-label': on ? 'Remove from favourites' : 'Add to favourites' },
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = store.toggleFavourite(item.route);
        notify({ title: added ? 'Added to favourites' : 'Removed from favourites', text: item.label, tone: 'info', duration: 1800 });
        repaintSidebar();
      },
      html: icon(on ? 'star-filled' : 'star', 13),
    }));
}

let sidebarNode = null;

/**
 * Cheap active-state update for navigation. Rebuilding the whole sidebar on
 * every route change costs ~300ms with 400 nav items; this is O(1).
 */
function markActiveNav(route) {
  if (!sidebarNode) return;
  const href = navHref(route);
  for (const n of sidebarNode.querySelectorAll('.sb-item.is-active')) n.classList.remove('is-active');
  const links = sidebarNode.querySelectorAll('.sb-item[href]');
  let active = null;
  for (const link of links) {
    if (link.getAttribute('href') === href) { link.classList.add('is-active'); if (!active) active = link; }
  }
  if (!active) return;
  // open the accordion parent and its section, then reveal the item
  const sub = active.closest('.sb-sub');
  if (sub) {
    sub.style.display = '';
    const parent = sub.previousElementSibling;
    if (parent && parent.classList.contains('sb-parent')) {
      parent.setAttribute('aria-expanded', 'true');
      parent.classList.add('is-active');
    }
  }
  const section = active.closest('.sb-section');
  if (section) section.setAttribute('data-open', 'true');
  if (sidebarScroll) {
    const top = active.offsetTop;
    const view = sidebarScroll.scrollTop;
    if (top < view || top > view + sidebarScroll.clientHeight - 48) {
      sidebarScroll.scrollTop = Math.max(0, top - sidebarScroll.clientHeight / 2);
    }
  }
}

function repaintSidebar(keepFocus) {
  if (!shellEl) return;
  const scrollTop = sidebarScroll ? sidebarScroll.scrollTop : 0;
  const next = buildSidebar();
  sidebarNode.replaceWith(next);
  sidebarNode = next;
  if (sidebarScroll) sidebarScroll.scrollTop = scrollTop;
  if (keepFocus) {
    const input = sidebarNode.querySelector('.sb-search input');
    if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
  }
}

/* ==================================================== context switchers */

/* Campus, academic year and role. The topbar owns these on desktop; below
   560px there is no room for them there, so the same three menus are also
   mounted in the sidebar drawer (.sb-context) and in the avatar menu. The
   item lists are built once here so the three call sites cannot drift. */

const PHONE_MAX = 560;
const isPhone = () => window.innerWidth <= PHONE_MAX;

function currentCampus() {
  return db.campuses.find((c) => c.id === store.get('campusId')) || db.campuses[0];
}
function currentYear() {
  return db.academicYears.find((y) => y.id === store.get('academicYearId')) || db.academicYears[4];
}
function campusLabel(c) {
  return c.name.split('—')[1] ? c.name.split('—')[1].trim() : c.name;
}

function campusMenuItems() {
  return db.campuses.map((c) => ({
    label: c.name.replace('Springdale ', ''),
    icon: 'building-2',
    checked: c.id === store.get('campusId'),
    onClick: () => { store.set({ campusId: c.id }); rebuildShell(); notify({ title: 'Campus switched', text: c.name, tone: 'info' }); },
  }));
}

function yearMenuItems() {
  return db.academicYears.slice().reverse().map((y) => ({
    label: `${y.name}${y.current ? ' · current' : ''}`,
    icon: 'calendar',
    checked: y.id === store.get('academicYearId'),
    onClick: () => { store.set({ academicYearId: y.id }); rebuildShell(); notify({ title: 'Academic year switched', text: y.name, tone: 'info' }); },
  }));
}

function roleMenuItems() {
  const items = [];
  let lastGroup = null;
  for (const r of ROLES) {
    if (r.group !== lastGroup) { items.push({ header: true, label: r.group }); lastGroup = r.group; }
    items.push({
      label: r.name, icon: r.icon, checked: r.id === store.get('role'),
      onClick: () => switchRole(r.id),
    });
  }
  return items;
}

/* ================================================================= topbar */

function buildTopbar() {
  const user = store.get('currentUser') || store.userForRole(store.get('role'));
  const campus = db.campuses.find((c) => c.id === store.get('campusId')) || db.campuses[0];
  const year = db.academicYears.find((y) => y.id === store.get('academicYearId')) || db.academicYears[4];
  const unread = store.unreadCount();

  const bar = h('header', { className: 'app-topbar' });

  /* mobile nav toggle */
  bar.appendChild(h('button', {
    className: 'tb-icon-btn sb-toggle',
    attrs: { 'aria-label': 'Toggle navigation' },
    onClick: () => {
      if (window.innerWidth <= 1024) {
        const on = shellEl.getAttribute('data-mobile-nav') === 'true';
        shellEl.setAttribute('data-mobile-nav', String(!on));
        toggleMobileScrim(!on);
      } else {
        const next = !store.get('sidebarCollapsed');
        store.set({ sidebarCollapsed: next });
        shellEl.setAttribute('data-collapsed', String(next));
      }
    },
    html: icon('menu', 17),
  }));

  /* Brand mark — phone only (CSS hides it above 560px). On a phone the
     sidebar is a drawer, so the topbar is the only place the product is
     named. */
  bar.appendChild(h('div', {
    className: 'tb-brand', attrs: { 'aria-hidden': 'true' },
    html: icon('graduation-cap', 16),
  }));

  /* campus + academic year */
  bar.appendChild(h('button', {
    className: 'tb-select tb-hide-sm',
    onClick: (e) => openMenu(e.currentTarget, campusMenuItems(), { align: 'left', title: 'Campus' }),
  },
    Icon('building-2', 15),
    h('span', { className: 'tb-select-text' }, campusLabel(campus)),
    h('span', { className: 'chev', html: icon('chevron-down', 13) })));

  bar.appendChild(h('button', {
    className: 'tb-select tb-hide-sm',
    onClick: (e) => openMenu(e.currentTarget, yearMenuItems(), { align: 'left', title: 'Academic year' }),
  },
    Icon('calendar', 15),
    h('span', { className: 'tb-select-text' }, year.name),
    h('span', { className: 'chev', html: icon('chevron-down', 13) })));

  bar.appendChild(h('span', { className: 'tb-sep tb-hide-sm' }));

  /* role switcher — the demo's headline feature. Hidden below 560px, where
     it is reachable from the sidebar drawer and the avatar menu instead. */
  bar.appendChild(h('button', {
    className: 'tb-role',
    attrs: { title: 'Switch role' },
    onClick: (e) => openMenu(e.currentTarget, roleMenuItems(), { align: 'left', title: 'View the product as', minWidth: '230px' }),
  },
    Icon('refresh-ccw', 14),
    h('span', null, roleById(store.get('role')).name),
    Icon('chevron-down', 13)));

  /* global search -> command palette */
  bar.appendChild(h('button', {
    className: 'tb-search',
    onClick: () => openPalette(),
  },
    Icon('search', 15),
    h('span', { className: 'tb-search-text' }, 'Search students, staff, pages…'),
    h('span', { className: 'kbd-hint' }, h('kbd', { className: 'kbd' }, 'Ctrl'), h('kbd', { className: 'kbd' }, 'K'))));

  bar.appendChild(h('span', { className: 'spacer' }));

  /* quick actions */
  bar.appendChild(h('button', {
    className: 'tb-icon-btn',
    attrs: { 'aria-label': 'Quick actions', title: 'Quick actions' },
    onClick: (e) => openMenu(e.currentTarget,
      quickActionsFor(store.get('role')).map((a) => ({ label: a.label, icon: a.icon, route: a.route })),
      { title: 'Create' }),
    html: icon('plus', 18),
  }));

  /* notifications */
  bar.appendChild(h('button', {
    className: 'tb-icon-btn',
    attrs: { 'aria-label': `Notifications (${unread} unread)`, title: 'Notifications' },
    onClick: () => openNotifications(),
  },
    Icon('bell', 17),
    unread > 0 && h('span', { className: 'tb-dot' }, String(unread))));

  /* help */
  bar.appendChild(h('button', {
    className: 'tb-icon-btn tb-hide-sm',
    attrs: { 'aria-label': 'Help', title: 'Help & shortcuts' },
    onClick: (e) => openMenu(e.currentTarget, [
      { label: 'Keyboard shortcuts', icon: 'command', shortcut: '?', onClick: openShortcuts },
      { label: 'Product tour', icon: 'sparkles', onClick: () => notify({ title: 'Product tour', text: 'Guided tour is not part of this prototype.', tone: 'info' }) },
      { label: 'Documentation', icon: 'book-open', onClick: () => notify({ title: 'Docs', text: 'See CONTRACT.md in the project root.', tone: 'info' }) },
      { separator: true },
      { label: 'Report an issue', icon: 'alert-circle', route: 'complaints/raise' },
    ]),
    html: icon('help-circle', 17),
  }));

  /* theme — moves into the avatar menu below 560px */
  bar.appendChild(h('button', {
    className: 'tb-icon-btn tb-theme',
    attrs: { 'aria-label': 'Toggle theme', title: 'Toggle light / dark' },
    onClick: () => toggleTheme(),
    html: icon(store.get('theme') === 'dark' ? 'sun' : 'moon', 17),
  }));

  /* density */
  bar.appendChild(h('button', {
    className: ['tb-icon-btn', 'tb-hide-sm', store.get('density') === 'compact' && 'is-on'].filter(Boolean).join(' '),
    attrs: { 'aria-label': 'Toggle density', title: 'Comfortable / compact' },
    onClick: () => {
      const d = store.toggleDensity();
      applyPrefs();
      rebuildShell();
      notify({ title: `${d === 'compact' ? 'Compact' : 'Comfortable'} density`, tone: 'info', duration: 1500 });
    },
    html: icon('sliders', 17),
  }));

  /* avatar menu. Below 560px it also carries the controls the topbar has no
     room for — role, campus, year and theme — so nothing is lost on a phone,
     only relocated. */
  /* openMenu() closes the current menu before running an item's handler, so a
     submenu cannot anchor on the item that was clicked — it is already gone.
     Anchoring on the avatar button instead keeps the second menu in place. */
  const avatarBtn = h('button', {
    className: 'tb-icon-btn tb-avatar',
    attrs: { 'aria-label': 'Account menu' },
  }, Avatar(user.name, { size: 'sm' }));
  avatarBtn.addEventListener('click', () => openMenu(avatarBtn, [
    { header: true, label: `${user.name} · ${roleById(store.get('role')).name}` },
    ...(isPhone() ? [
      { label: `Role · ${roleById(store.get('role')).name}`, icon: 'refresh-ccw', onClick: () => openMenu(avatarBtn, roleMenuItems(), { title: 'View the product as', minWidth: '230px' }) },
      { label: `Campus · ${campusLabel(currentCampus())}`, icon: 'building-2', onClick: () => openMenu(avatarBtn, campusMenuItems(), { title: 'Campus' }) },
      { label: `Year · ${currentYear().name}`, icon: 'calendar', onClick: () => openMenu(avatarBtn, yearMenuItems(), { title: 'Academic year' }) },
      { label: store.get('theme') === 'dark' ? 'Light theme' : 'Dark theme', icon: store.get('theme') === 'dark' ? 'sun' : 'moon', onClick: () => toggleTheme() },
      { separator: true },
    ] : []),
    { label: 'My profile', icon: 'user', route: 'portals/employee/profile' },
    { label: 'My attendance', icon: 'clipboard-check', route: 'portals/employee/attendance' },
    { label: 'My payslips', icon: 'receipt', route: 'portals/employee/payslips' },
    { separator: true },
    { label: 'Settings', icon: 'settings', route: 'system/general' },
    { label: 'Audit logs', icon: 'history', route: 'system/audit-logs' },
    { separator: true },
    { label: 'Lock screen', icon: 'lock', shortcut: 'Ctrl L', onClick: () => { store.lock(); boot(); } },
    { label: 'Sign out', icon: 'log-out', tone: 'danger', onClick: () => { store.logout(); boot(); } },
  ]));
  bar.appendChild(avatarBtn);

  return bar;
}

function toggleTheme() {
  const t = store.toggleTheme();
  applyPrefs();
  rebuildShell();
  notify({ title: `${t === 'dark' ? 'Dark' : 'Light'} theme`, tone: 'info', duration: 1500 });
}

function switchRole(roleId) {
  store.switchRole(roleId);
  const dash = roleById(roleId).dashboard;
  rebuildShell();
  router.navigate(dash);
  router.reload();
  notify({
    title: `Now viewing as ${roleById(roleId).name}`,
    text: `${store.get('currentUser').name} — navigation and dashboard updated.`,
    tone: 'brand',
  });
}

/* ============================================================== crumb bar */

function buildCrumbbar() {
  const bar = h('nav', { className: 'crumbbar', attrs: { 'aria-label': 'Breadcrumb' } });
  crumbEl = bar;
  return bar;
}

function paintCrumbs(trail, actions) {
  if (!crumbEl) return;
  crumbEl.innerHTML = '';
  (trail || []).forEach((c, i) => {
    if (i > 0) crumbEl.appendChild(h('span', { className: 'crumb-sep', html: icon('chevron-right', 12) }));
    crumbEl.appendChild(h('span', { className: 'crumb' },
      c.route ? h('a', { href: navHref(c.route) }, c.label) : h('span', null, c.label)));
  });
  if (actions) crumbEl.appendChild(h('div', { className: 'crumb-actions' }, actions));
}

document.addEventListener('erp:breadcrumb', (e) => paintCrumbs(e.detail.trail, e.detail.actions));

/* ========================================================== notifications */

function openNotifications() {
  const list = store.get('notifications');
  Drawer({
    title: 'Notifications',
    subtitle: `${store.unreadCount()} unread`,
    flush: true,
    body: () => {
      const body = h('div', null);
      if (!list.length) {
        body.appendChild(EmptyState({ icon: 'bell-off', title: 'Nothing new', text: 'You are all caught up.' }));
        return body;
      }
      body.appendChild(h('div', { className: 'row', style: { padding: '10px 16px', borderBottom: '1px solid var(--border)' } },
        h('span', { className: 't-sm t-muted' }, `${list.length} notifications`),
        h('span', { className: 'spacer' }),
        Button('Mark all read', { variant: 'ghost', size: 'sm', icon: 'check', onClick: () => { store.markAllNotificationsRead(); rebuildShell(); notify({ title: 'All caught up', tone: 'success', duration: 1600 }); } })));
      for (const n of list) {
        body.appendChild(NotificationItem(n, { onClick: () => { store.markNotificationRead(n.id); rebuildShell(); } }));
      }
      return body;
    },
    actions: (close) => frag(
      Button('Notification settings', { variant: 'ghost', icon: 'settings', onClick: () => { close(); router.navigate('system/general'); } }),
      Button('Close', { variant: 'secondary', onClick: close })),
  });
}

/* ========================================================= command palette */

let paletteOpen = false;

function paletteEntries() {
  const role = store.get('role');
  const nav = navForRole(role);
  const out = [];
  for (const section of nav) {
    for (const item of section.items) {
      if (item.route) out.push({ kind: 'Page', label: item.label, path: section.label, icon: item.icon, route: item.route });
      for (const c of item.children || []) {
        out.push({ kind: 'Page', label: c.label, path: `${section.label} · ${item.label}`, icon: c.icon, route: c.route });
      }
    }
  }
  for (const a of quickActionsFor(role)) {
    out.push({ kind: 'Action', label: a.label, path: 'Quick action', icon: a.icon, route: a.route });
  }
  return out;
}

let peopleCache = null;
function palettePeople() {
  if (peopleCache) return peopleCache;
  peopleCache = [];
  for (const s of db.students.slice(0, 400)) {
    peopleCache.push({ kind: 'Student', label: s.name, path: `${s.className} · ${s.section} · ${s.admissionNo}`, icon: 'graduation-cap', route: `students/profile/${s.id}` });
  }
  for (const e of db.staff.slice(0, 200)) {
    peopleCache.push({ kind: 'Staff', label: e.name, path: `${e.designation} · ${e.employeeCode}`, icon: 'briefcase', route: `hr/employee-profile/${e.id}` });
  }
  return peopleCache;
}

/** Simple subsequence fuzzy match; returns a score or -1. */
function fuzzy(query, text) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 0;
  const direct = t.indexOf(q);
  if (direct >= 0) return 1000 - direct * 2 - (t.length - q.length) * 0.1;
  let qi = 0;
  let score = 0;
  let last = -1;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      score += last === i - 1 ? 6 : 2;
      last = i;
      qi++;
    }
  }
  return qi === q.length ? score : -1;
}

function highlight(text, query) {
  if (!query) return escapeHtml(text);
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return escapeHtml(text);
  return `${escapeHtml(text.slice(0, i))}<mark>${escapeHtml(text.slice(i, i + query.length))}</mark>${escapeHtml(text.slice(i + query.length))}`;
}

const PALETTE_GROUPS = {
  Recent: 'Recently visited', Page: 'Pages', Action: 'Quick actions', Student: 'Students', Staff: 'Staff',
};
const PALETTE_ORDER = ['Recent', 'Action', 'Page', 'Student', 'Staff'];

export function openPalette() {
  if (paletteOpen) return;
  paletteOpen = true;
  let cursor = 0;
  let results = [];

  const listEl = h('div', { className: 'palette-list' });
  const input = h('input', { className: 'palette-input', placeholder: 'Search pages, actions, students and staff…', attrs: { 'aria-label': 'Command palette' } });

  const close = () => {
    paletteOpen = false;
    wrap.remove();
    document.removeEventListener('keydown', onKey, true);
  };

  const run = (item) => { close(); router.navigate(item.route); };

  const paint = (q) => {
    const base = paletteEntries();
    const people = q.length >= 2 ? palettePeople() : [];
    const pool = base.concat(people);
    results = (q
      ? pool.map((e) => ({ e, s: Math.max(fuzzy(q, e.label), fuzzy(q, e.path) - 400) }))
        .filter((x) => x.s > -1).sort((a, b) => b.s - a.s).slice(0, 40).map((x) => x.e)
      : store.get('recentRoutes').map((r) => routeMeta(r)).filter(Boolean)
        .map((m) => ({ kind: 'Recent', label: m.label, path: m.sectionLabel, icon: m.icon, route: m.route }))
        .concat(base.slice(0, 14))
    ).slice(0, 40);
    // Keep score order inside a group, but never interleave groups.
    results = results
      .map((e, i) => ({ e, i }))
      .sort((a, b) => (PALETTE_ORDER.indexOf(a.e.kind) - PALETTE_ORDER.indexOf(b.e.kind)) || (a.i - b.i))
      .map((x) => x.e);
    cursor = 0;
    render(q);
  };

  const render = (q) => {
    listEl.innerHTML = '';
    if (!results.length) {
      listEl.appendChild(EmptyState({ icon: 'search', title: 'No matches', text: `Nothing found for “${q}”.` }));
      return;
    }
    let lastKind = null;
    results.forEach((r, i) => {
      if (r.kind !== lastKind) {
        lastKind = r.kind;
        listEl.appendChild(h('div', { className: 'palette-group-label' }, PALETTE_GROUPS[r.kind] || r.kind));
      }
      listEl.appendChild(h('button', {
        className: ['palette-item', i === cursor && 'is-cursor'].filter(Boolean).join(' '),
        onClick: () => run(r),
        onMouseEnter: () => { cursor = i; render(q); },
      },
        Icon(r.icon || 'arrow-right', 16),
        h('div', { className: 'pi-main' },
          h('div', { className: 'pi-label', html: highlight(r.label, q) }),
          h('div', { className: 'pi-path' }, r.path)),
        i === cursor && h('span', { className: 'kbd-hint' }, h('kbd', { className: 'kbd' }, '↵'))));
    });
    const active = listEl.querySelector('.is-cursor');
    if (active) active.scrollIntoView({ block: 'nearest' });
  };

  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); cursor = Math.min(results.length - 1, cursor + 1); render(input.value); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); cursor = Math.max(0, cursor - 1); render(input.value); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[cursor]) run(results[cursor]); }
  };

  input.addEventListener('input', () => paint(input.value.trim()));

  const wrap = h('div', {
    className: 'palette-wrap',
    onMouseDown: (e) => { if (e.target === wrap) close(); },
  },
    h('div', { className: 'palette' },
      h('div', { className: 'palette-input-row' }, Icon('search', 17), input,
        h('span', { className: 'kbd-hint' }, h('kbd', { className: 'kbd' }, 'Esc'))),
      listEl,
      h('div', { className: 'palette-foot' },
        h('span', null, h('kbd', { className: 'kbd' }, '↑'), ' ', h('kbd', { className: 'kbd' }, '↓'), ' to navigate'),
        h('span', null, h('kbd', { className: 'kbd' }, '↵'), ' to open'),
        h('span', { className: 'spacer' }),
        h('span', null, `${flatNav().length} routes indexed`))));

  document.body.appendChild(wrap);
  document.addEventListener('keydown', onKey, true);
  paint('');
  setTimeout(() => input.focus(), 30);
}

document.addEventListener('erp:palette', () => openPalette());

function openShortcuts() {
  const rows = [
    ['Ctrl / ⌘ + K', 'Open the command palette'],
    ['Ctrl / ⌘ + B', 'Collapse or expand the sidebar'],
    ['Ctrl / ⌘ + L', 'Lock the screen'],
    ['Ctrl / ⌘ + J', 'Toggle light / dark theme'],
    ['G then D', 'Go to your dashboard'],
    ['?', 'Show this list'],
    ['Esc', 'Close any overlay'],
  ];
  import('./core/ui.js').then(({ Modal, DescriptionList }) => {
    Modal({
      title: 'Keyboard shortcuts', size: 'sm', icon: 'command',
      body: DescriptionList(rows.map(([k, v]) => ({ label: h('kbd', { className: 'kbd' }, k), value: v }))),
    });
  });
}

/* ================================================================== shell */

function toggleMobileScrim(on) {
  const existing = document.getElementById('mobile-scrim');
  if (existing) existing.remove();
  if (!on) return;
  const scrim = h('div', { className: 'scrim', id: 'mobile-scrim', onClick: () => { shellEl.setAttribute('data-mobile-nav', 'false'); toggleMobileScrim(false); } });
  document.body.appendChild(scrim);
}

function buildShell() {
  const shell = h('div', {
    className: 'app-shell',
    dataset: { collapsed: String(!!store.get('sidebarCollapsed')), mobileNav: 'false' },
  });
  shellEl = shell;
  sidebarNode = buildSidebar();
  shell.appendChild(sidebarNode);
  const body = h('div', { className: 'app-body' },
    buildTopbar(),
    buildCrumbbar(),
    (mainEl = h('main', { className: 'app-main', id: 'main-content' })));
  shell.appendChild(body);
  return shell;
}

function rebuildShell() {
  const scrollTop = mainEl ? mainEl.scrollTop : 0;
  const content = mainEl ? Array.from(mainEl.childNodes) : [];
  /* buildShell() starts the new shell with the drawer closed, so a stale
     scrim would otherwise be left covering the page. This matters now that
     the drawer holds the campus/year/role switchers, which rebuild the
     shell from inside the open drawer. */
  toggleMobileScrim(false);
  const next = buildShell();
  appEl.innerHTML = '';
  appEl.appendChild(next);
  for (const node of content) mainEl.appendChild(node);
  mainEl.scrollTop = scrollTop;
  router.setMount(mainEl);
  const cur = router.current();
  if (cur) paintCrumbs(breadcrumbFor(cur.route));
}

/* ================================================================= routes */

/** Wrap every registered route so the first paint shows a skeleton (~180ms). */
function withSkeleton(table) {
  const out = {};
  for (const [key, def] of Object.entries(table)) {
    out[key] = {
      ...def,
      render(mount, ctx) {
        mount.innerHTML = '';
        mount.appendChild(loadingPage({ title: def.title }));
        const token = Symbol('render');
        mount.__token = token;
        setTimeout(() => {
          if (mount.__token !== token) return;
          mount.innerHTML = '';
          try {
            def.render(mount, { ...ctx, state: store.get(), db });
          } catch (err) {
            console.error('[page]', key, err);
            mount.appendChild(notFoundPage(ctx));
          }
        }, 180);
      },
    };
  }
  return out;
}

function startRouter() {
  router.setRoutes(withSkeleton(registryRoutes));
  router.setNotFound((mount, ctx) => {
    mount.innerHTML = '';
    mount.appendChild(notFoundPage(ctx));
    paintCrumbs(breadcrumbFor(ctx.route));
  });
  router.setDefaultRoute(() => roleById(store.get('role')).dashboard);
  router.onNavigate((ctx) => {
    store.pushRecent(ctx.route);
    document.title = `${ctx.title || routeMeta(ctx.route)?.label || 'Springdale'} · Springdale ERP`;
    paintCrumbs(breadcrumbFor(ctx.route));
    markActiveNav(ctx.route);
    if (window.innerWidth <= 1024) { shellEl.setAttribute('data-mobile-nav', 'false'); toggleMobileScrim(false); }
    closeMenu();
  });
  router.start(mainEl);
}

/* ============================================================== shortcuts */

let gPressed = false;
document.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;

  if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
  if (!store.get('authenticated')) return;
  if (mod && e.key.toLowerCase() === 'b') {
    e.preventDefault();
    const next = !store.get('sidebarCollapsed');
    store.set({ sidebarCollapsed: next });
    if (shellEl) shellEl.setAttribute('data-collapsed', String(next));
    return;
  }
  if (mod && e.key.toLowerCase() === 'l') { e.preventDefault(); store.lock(); boot(); return; }
  if (mod && e.key.toLowerCase() === 'j') { e.preventDefault(); store.toggleTheme(); applyPrefs(); rebuildShell(); return; }
  if (typing) return;
  if (e.key === '?') { e.preventDefault(); openShortcuts(); return; }
  if (e.key.toLowerCase() === 'g') { gPressed = true; setTimeout(() => { gPressed = false; }, 900); return; }
  if (gPressed && e.key.toLowerCase() === 'd') { gPressed = false; router.navigate(roleById(store.get('role')).dashboard); }
});

/* =================================================================== boot */

function boot() {
  applyPrefs();

  if (!store.get('authenticated')) {
    renderLogin(appEl, { onSuccess: () => boot() });
    return;
  }
  if (store.get('locked')) {
    renderLock(appEl, {
      onUnlock: () => boot(),
      onSignOut: () => { store.logout(); boot(); },
    });
    return;
  }

  if (!store.get('notifications').length) store.setNotifications(db.notifications);

  appEl.innerHTML = '';
  appEl.appendChild(buildShell());
  startRouter();

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) toggleMobileScrim(false);
  });

  warmData();
}

/* Generate the heavy collections during idle time so the first visit to a
   module page is instant. Each chunk is scheduled separately so the main
   thread never blocks for long. */
let warmed = false;
function warmData() {
  if (warmed) return;
  warmed = true;
  const chunks = [
    ['students', 'staff', 'sections'],
    ['parents', 'invoices'],
    ['payments', 'enquiries', 'applications'],
    ['books', 'bookIssues'],
    ['timetableSlots', 'attendance'],
    ['marks', 'exams'],
    ['complaints', 'leaveRequests', 'staffAttendance'],
    ['vehicles', 'routes', 'stops', 'alumni'],
  ];
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 220));
  let i = 0;
  const step = () => {
    if (i >= chunks.length) return;
    const chunk = chunks[i++];
    for (const key of chunk) { try { void db[key]; } catch (e) { console.warn('[warm]', key, e); } }
    idle(step, { timeout: 1200 });
  };
  idle(step, { timeout: 1500 });
}

/* Expose a tiny debug surface for the module teams. */
window.SpringdaleERP = {
  store, router, db, boot, openPalette,
  version: '1.0.0',
  routes: () => Object.keys(router.getRoutes()),
};

boot();

export { boot, renderForgot };
