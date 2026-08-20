/* ==========================================================================
   page-kit.js — higher-order page builders
   200 screens should not mean 200 snowflakes. Every module team composes its
   pages from these builders so spacing, hierarchy and behaviour stay identical.

   Every builder returns a DOM node. Typical use inside a page module:

       render(mount, ctx) {
         mount.appendChild(listPage({ ... }));
       }
   ========================================================================== */

import {
  h, frag, Icon, Card, SectionCard, StatCard, Badge, Button, IconButton, Avatar,
  Tabs, DataTable, EmptyState, Skeleton, SkeletonText, Timeline, DescriptionList,
  Toolbar, FilterBar, SearchInput, MenuButton, Modal, Drawer, ConfirmDialog, notify,
  KanbanBoard, Calendar, FormSection, FormGrid, FormActions, Field, Input, Select,
  Textarea, Checkbox, RadioGroup, Switch, DatePicker, TimePicker, MultiSelect, Combobox,
  FileUpload, Stepper, ProgressBar, formatDate, formatNumber, printNode, download,
  toCsv, mockAction, Divider, unsavedGuard, validators, Callout, Identity,
} from './ui.js';
import { breadcrumbFor, routeMeta } from './nav.js';
import { navHref } from './router.js';
import { icon } from './icons.js';

/* ------------------------------------------------------------ breadcrumbs */

/** Publish the breadcrumb trail for the shell's crumb bar. */
export function setBreadcrumb(trail, actions) {
  document.dispatchEvent(new CustomEvent('erp:breadcrumb', { detail: { trail, actions } }));
}

/* =================================================================== page = */

/**
 * page({title, subtitle, breadcrumb, actions, tabs, onTabChange, activeTab,
 *       filters, wide, children}) -> HTMLElement
 *
 * The standard page frame: breadcrumb + header (title/subtitle/actions) +
 * optional tab strip + optional filter row + content stack.
 * `actions`, `filters` and `children` accept a Node or an array of Nodes.
 */
export function page({
  title, subtitle, breadcrumb, actions, tabs, onTabChange, activeTab,
  filters, wide = false, children, className, route,
} = {}) {
  const root = h('div', { className: ['page', wide && 'page-wide', className].filter(Boolean).join(' ') });

  const trail = breadcrumb || (route ? breadcrumbFor(route) : null);
  if (trail) setBreadcrumb(trail);

  if (title || subtitle || actions) {
    root.appendChild(h('div', { className: 'page-head' },
      h('div', { className: 'page-head-main' },
        h('div', { className: 'page-title-row' },
          title && h('h1', { className: 'page-title' }, title)),
        subtitle && h('div', { className: 'page-subtitle' }, subtitle)),
      actions && h('div', { className: 'page-actions' }, actions)));
  }

  if (tabs && tabs.length) {
    root.appendChild(h('div', { className: 'page-tabs' },
      Tabs(tabs, onTabChange, { active: activeTab })));
  }

  if (filters) root.appendChild(h('div', { className: 'toolbar' }, filters));
  if (children) root.appendChild(h('div', { className: 'stack' }, children));
  return root;
}

/** A row of KPI stat cards sized to the widget grid. */
export function kpiRow(kpis = []) {
  if (!kpis.length) return null;
  const span = kpis.length >= 5 ? 'span-2' : kpis.length === 4 ? 'span-3' : kpis.length === 3 ? 'span-4' : 'span-6';
  return h('div', { className: 'widget-grid' },
    kpis.map((k) => h('div', { className: span }, k instanceof Node ? k : StatCard(k))));
}

/* =============================================================== listPage = */

/**
 * listPage({
 *   title, subtitle, breadcrumb, route,
 *   kpis: [{label, value, delta, icon, tone, trend}],
 *   chart: Node,                       // optional analytics strip above the table
 *   chartTitle, chartActions,
 *   columns, rows,                     // DataTable config
 *   filters: [{id,label,type,options}] // rendered above the table (one row)
 *   onFilter(id, value, all),
 *   actions: [Node],                   // page header buttons
 *   rowActions(row) -> menu items,
 *   onRowClick(row), bulkActions, emptyState, tabs, onTabChange, activeTab,
 *   selectable, groupBy, expandable, footerAggregates, pageSize, searchKeys,
 *   exportName, tableToolbar, density
 * }) -> HTMLElement
 */
export function listPage(cfg = {}) {
  const {
    title, subtitle, breadcrumb, route, kpis = [], chart, chartTitle, chartActions,
    columns = [], rows = [], filters = [], onFilter, actions, rowActions, onRowClick,
    bulkActions = [], emptyState, tabs, onTabChange, activeTab, selectable = false,
    groupBy = null, expandable = null, footerAggregates = false, pageSize = 25,
    searchKeys = null, exportName, tableToolbar, searchPlaceholder, maxHeight,
    tableTitle, tableSubtitle, notes,
  } = cfg;

  const table = DataTable({
    columns, rows, rowActions, onRowClick, bulkActions, selectable, groupBy, expandable,
    footerAggregates, pageSize, searchKeys, emptyState, maxHeight,
    searchPlaceholder: searchPlaceholder || `Search ${String(title || 'records').toLowerCase()}…`,
    exportName: exportName || String(title || 'export').toLowerCase().replace(/\s+/g, '-'),
    toolbar: tableToolbar,
  });

  const body = [];
  if (kpis.length) body.push(kpiRow(kpis));
  if (filters.length) {
    body.push(h('div', { className: 'card', style: { padding: '0' } },
      FilterBar({ filters, onChange: (id, v, all) => { if (onFilter) onFilter(id, v, all, table); } })));
  }
  if (chart) {
    body.push(chartTitle
      ? SectionCard({ title: chartTitle, actions: chartActions, className: 'chart-card' }, chart)
      : Card({ pad: true, className: 'chart-card' }, chart));
  }
  if (notes) body.push(notes);
  if (tableTitle) {
    const wrapper = SectionCard({ title: tableTitle, subtitle: tableSubtitle, flush: true });
    wrapper.querySelector('.card-body').appendChild(table);
    body.push(wrapper);
  } else {
    body.push(table);
  }

  const node = page({
    title, subtitle, breadcrumb, route, actions, tabs, onTabChange, activeTab, children: body,
  });
  node.table = table;
  return node;
}

/* ============================================================= detailPage = */

/**
 * profileHeader({name, subtitle, avatar, initials, meta:[{label,value,icon}],
 *                badges:[Node], actions, cover}) -> HTMLElement
 */
export function profileHeader({ name, subtitle, avatar, initials: init, meta = [], badges = [], actions, size = 'xl' } = {}) {
  return Card({ className: 'card-accent' },
    h('div', { className: 'card-pad row-4 row-wrap', style: { alignItems: 'flex-start' } },
      Avatar(name, { size, src: avatar, initials: init }),
      h('div', { className: 'flex-1 stack-2', style: { minWidth: '240px' } },
        h('div', { className: 'row-3 row-wrap' },
          h('h2', null, name),
          badges),
        subtitle && h('div', { className: 't-muted' }, subtitle),
        meta.length ? h('div', { className: 'row-4 row-wrap', style: { rowGap: '8px' } },
          meta.map((m) => h('span', { className: 'row', style: { gap: '6px' } },
            m.icon && Icon(m.icon, 14),
            h('span', { className: 't-sm t-muted' }, m.label + ':'),
            h('span', { className: 't-sm t-medium' }, m.value)))) : null),
      actions && h('div', { className: 'page-actions' }, actions)));
}

/**
 * detailPage({
 *   title, subtitle, breadcrumb, route, avatar, initials, badges,
 *   meta: [{label, value, icon}],
 *   tabs: [{id, label, icon, count, render() -> Node}],
 *   sidebar: [Node],            // right rail cards
 *   actions: [Node],
 *   timeline: [{title, meta, text, icon, tone}],
 *   activeTab, onTabChange
 * }) -> HTMLElement
 */
export function detailPage(cfg = {}) {
  const {
    title, subtitle, breadcrumb, route, avatar, initials: init, badges = [], meta = [],
    tabs = [], sidebar = [], actions, timeline, activeTab, onTabChange, headerSize,
  } = cfg;

  const content = h('div', { className: 'stack' });
  let current = activeTab || (tabs[0] && tabs[0].id);

  const paint = () => {
    content.innerHTML = '';
    const tab = tabs.find((t) => t.id === current) || tabs[0];
    if (!tab) return;
    const out = typeof tab.render === 'function' ? tab.render() : tab.content;
    if (out) content.appendChild(out);
  };

  const tabBar = tabs.length ? h('div', { className: 'page-tabs' },
    Tabs(tabs, (id) => { current = id; paint(); if (onTabChange) onTabChange(id); }, { active: current })) : null;

  paint();

  const rail = sidebar.length || timeline ? h('div', { className: 'stack-3' },
    sidebar,
    timeline && timeline.length ? SectionCard({ title: 'Activity', icon: 'history' }, Timeline(timeline)) : null) : null;

  const body = rail
    ? h('div', { className: 'detail-split' }, h('div', { className: 'stack' }, content), rail)
    : content;

  const root = page({
    breadcrumb: breadcrumb || (route ? breadcrumbFor(route, title) : null),
    children: [
      profileHeader({ name: title, subtitle, avatar, initials: init, meta, badges, actions, size: headerSize || 'xl' }),
      tabBar,
      body,
    ].filter(Boolean),
  });
  root.setTab = (id) => { current = id; paint(); };
  return root;
}

/* ========================================================== dashboardPage = */

/**
 * dashboardPage({
 *   title, greeting, subtitle, breadcrumb, route, actions,
 *   kpis: [{label, value, delta, deltaLabel, icon, tone, trend, route}],
 *   widgets: [{span:1..12, render() -> Node}],
 *   filters
 * }) -> HTMLElement
 *
 * `span` is a 12-column grid span; the grid collapses responsively.
 */
export function dashboardPage(cfg = {}) {
  const { title, greeting, subtitle, breadcrumb, route, actions, kpis = [], widgets = [], filters } = cfg;

  const kpiSpan = kpis.length >= 6 ? 2 : kpis.length === 5 ? 2 : kpis.length === 4 ? 3 : kpis.length === 3 ? 4 : 6;
  const grid = h('div', { className: 'widget-grid' });
  for (const k of kpis) {
    grid.appendChild(h('div', { className: `span-${k.span || kpiSpan}` }, k instanceof Node ? k : StatCard(k)));
  }
  for (const w of widgets) {
    const node = typeof w.render === 'function' ? w.render() : w.content;
    if (!node) continue;
    grid.appendChild(h('div', { className: `span-${w.span || 6}` }, node));
  }

  return page({
    title: greeting || title,
    subtitle: subtitle || (greeting ? title : null),
    breadcrumb, route, actions, filters,
    children: grid,
  });
}

/** A time-aware greeting, e.g. "Good morning, Meera". */
export function greetingFor(name, now = new Date('2026-08-20T09:30:00')) {
  const hh = now.getHours();
  const part = hh < 12 ? 'Good morning' : hh < 17 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${String(name || '').split(' ')[0]}`;
}

/* =============================================================== formPage = */

/**
 * formPage({
 *   title, subtitle, breadcrumb, route,
 *   mode: 'page' | 'modal' | 'wizard',
 *   sections: [{title, description, cols, fields:[fieldSpec]}],
 *   steps: [{id, label, description, sections:[...]}],   // wizard mode
 *   submitLabel, cancelLabel, onSubmit(values), onCancel,
 *   sidebar: [Node], help: Node, values: {}
 * })
 *
 * fieldSpec = {
 *   id, label, type:'text|number|email|tel|date|time|textarea|select|multiselect|
 *                    combobox|checkbox|switch|radio|file|static|custom',
 *   required, hint, placeholder, options, value, span:1|2|'full',
 *   validate: fn|[fn], render: () => Node   // for type 'custom'
 * }
 *
 * In 'modal' mode the form opens in a Modal and the function returns the
 * modal handle; otherwise it returns a page element.
 */
export function formPage(cfg = {}) {
  const {
    title, subtitle, breadcrumb, route, mode = 'page', sections = [], steps = null,
    submitLabel = 'Save', cancelLabel = 'Cancel', onSubmit, onCancel, sidebar = [],
    help, values: initial = {}, size = 'lg',
  } = cfg;

  const values = { ...initial };
  const errors = {};
  const fieldNodes = new Map();

  function buildField(spec) {
    const id = spec.id;
    if (spec.value !== undefined && values[id] === undefined) values[id] = spec.value;
    const setVal = (v) => { values[id] = v; if (errors[id]) { delete errors[id]; repaintField(spec); } };
    let control;
    switch (spec.type) {
      case 'textarea':
        control = Textarea({ value: values[id] || '', rows: spec.rows || 4, placeholder: spec.placeholder, invalid: !!errors[id], onInput: setVal });
        break;
      case 'select':
        control = Select({ options: spec.options || [], value: values[id], placeholder: spec.placeholder || 'Select…', invalid: !!errors[id], onChange: setVal });
        break;
      case 'combobox':
        control = Combobox({ options: spec.options || [], value: values[id], placeholder: spec.placeholder, onChange: setVal });
        break;
      case 'multiselect':
        control = MultiSelect({ options: spec.options || [], values: values[id] || [], placeholder: spec.placeholder, onChange: setVal });
        break;
      case 'date':
        control = DatePicker({ value: values[id] || '', width: '100%', onChange: setVal });
        break;
      case 'time':
        control = TimePicker({ value: values[id] || '', onChange: setVal });
        break;
      case 'checkbox':
        control = Checkbox(spec.checkboxLabel || spec.label, { checked: !!values[id], onChange: setVal });
        break;
      case 'switch':
        control = Switch(spec.switchLabel || spec.label, { checked: !!values[id], description: spec.description, onChange: setVal });
        break;
      case 'radio':
        control = RadioGroup(spec.options || [], { name: id, value: values[id], inline: spec.inline, onChange: setVal });
        break;
      case 'file':
        control = FileUpload({ label: spec.placeholder, hint: spec.hint, accept: spec.accept, onFiles: setVal });
        break;
      case 'static':
        control = h('div', { className: 't-medium', style: { paddingTop: '6px' } }, String(values[id] ?? spec.text ?? '—'));
        break;
      case 'custom':
        control = typeof spec.render === 'function' ? spec.render(values, setVal) : h('div');
        break;
      default:
        control = Input({
          type: spec.type || 'text', value: values[id] ?? '', placeholder: spec.placeholder,
          numeric: spec.type === 'number', invalid: !!errors[id], prefix: spec.prefix, suffix: spec.suffix,
          onInput: setVal,
        });
    }
    const hideLabel = spec.type === 'checkbox' || spec.type === 'switch';
    const wrap = Field({
      label: hideLabel ? null : spec.label,
      required: spec.required, hint: spec.hint, error: errors[id],
      className: spec.span === 'full' ? 'col-span-full' : spec.span === 2 ? 'col-span-2' : null,
    }, control);
    fieldNodes.set(id, { spec, wrap });
    return wrap;
  }

  function repaintField(spec) {
    const entry = fieldNodes.get(spec.id);
    if (!entry || !entry.wrap.parentNode) return;
    const next = buildField(spec);
    entry.wrap.replaceWith(next);
  }

  function buildSections(list) {
    return list.map((s) => FormSection({ title: s.title, description: s.description },
      FormGrid({ cols: s.cols || 2 }, (s.fields || []).map(buildField))));
  }

  function validate(list) {
    let ok = true;
    for (const s of list) {
      for (const f of s.fields || []) {
        const rules = [].concat(f.required ? [validators.required] : [], f.validate || []);
        for (const rule of rules) {
          const msg = typeof rule === 'function' ? rule(values[f.id], values) : null;
          if (msg) { errors[f.id] = msg; ok = false; break; }
        }
        if (!errors[f.id]) delete errors[f.id];
      }
    }
    for (const [, entry] of fieldNodes) repaintField(entry.spec);
    if (!ok) notify({ title: 'Please check the highlighted fields', tone: 'warning' });
    return ok;
  }

  const submit = () => {
    const list = steps ? steps.flatMap((s) => s.sections || []) : sections;
    if (!validate(list)) return;
    if (onSubmit) onSubmit({ ...values });
    else notify({ title: `${title || 'Form'} saved`, text: 'Demo only — nothing was persisted.', tone: 'success' });
  };

  /* ------------------------------------------------------------- wizard */
  if (mode === 'wizard' && steps && steps.length) {
    let stepIndex = 0;
    const stepHost = h('div', { className: 'stack' });
    const stepperHost = h('div', { className: 'card card-pad' });
    const footHost = h('div', { className: 'card card-pad row' });

    const paint = () => {
      stepperHost.innerHTML = '';
      stepperHost.appendChild(Stepper(steps.map((s) => ({ label: s.label, description: s.description })), { current: stepIndex }));
      stepHost.innerHTML = '';
      const s = steps[stepIndex];
      stepHost.appendChild(Card({ pad: true }, h('div', { className: 'stack-6' }, buildSections(s.sections || []))));
      footHost.innerHTML = '';
      footHost.appendChild(Button(cancelLabel, { variant: 'ghost', onClick: onCancel || (() => history.back()) }));
      footHost.appendChild(h('span', { className: 'spacer' }));
      if (stepIndex > 0) footHost.appendChild(Button('Back', { variant: 'secondary', icon: 'chevron-left', onClick: () => { stepIndex--; paint(); } }));
      if (stepIndex < steps.length - 1) {
        footHost.appendChild(Button('Continue', {
          variant: 'primary', iconRight: 'chevron-right',
          onClick: () => { if (validate(steps[stepIndex].sections || [])) { stepIndex++; paint(); } },
        }));
      } else {
        footHost.appendChild(Button(submitLabel, { variant: 'primary', icon: 'check', onClick: submit }));
      }
    };
    paint();
    return page({ title, subtitle, breadcrumb, route, children: [stepperHost, stepHost, footHost] });
  }

  /* -------------------------------------------------------------- modal */
  if (mode === 'modal') {
    return Modal({
      title, subtitle, size,
      body: h('div', { className: 'stack-6' }, buildSections(sections)),
      actions: (close) => frag(
        Button(cancelLabel, { variant: 'secondary', onClick: () => { close(); if (onCancel) onCancel(); } }),
        Button(submitLabel, { variant: 'primary', onClick: () => { const list = sections; if (!validate(list)) return; if (onSubmit) onSubmit({ ...values }); close(); } })),
    });
  }

  /* --------------------------------------------------------------- page */
  const form = h('form', {
    className: 'stack', onSubmit: (e) => { e.preventDefault(); submit(); },
  },
    Card({ pad: true }, h('div', { className: 'stack-6' }, buildSections(sections))),
    Card({ pad: true }, FormActions(
      Button(submitLabel, { variant: 'primary', icon: 'check', type: 'submit' }),
      Button(cancelLabel, { variant: 'secondary', onClick: onCancel || (() => history.back()) }),
      h('span', { className: 'spacer' }),
      h('span', { className: 't-sm t-muted' }, 'All changes are local to this prototype.'))));

  const release = unsavedGuard(form);
  form.addEventListener('submit', () => release());

  const body = (sidebar.length || help)
    ? h('div', { className: 'form-split' }, form, h('div', { className: 'stack-3' }, sidebar, help))
    : form;

  return page({ title, subtitle, breadcrumb, route, children: body });
}

/* ============================================================= reportPage = */

/**
 * reportPage({
 *   title, subtitle, breadcrumb, route,
 *   filters: [{id,label,type,options}], onFilter,
 *   summary: [{label, value, delta, icon, tone}],
 *   chart: Node | [Node], chartTitle,
 *   columns, rows, tableTitle,
 *   exportActions: [Node] | true, footerAggregates
 * }) -> HTMLElement
 */
export function reportPage(cfg = {}) {
  const {
    title, subtitle, breadcrumb, route, filters = [], onFilter, summary = [],
    chart, chartTitle = 'Analysis', columns = [], rows = [], tableTitle = 'Detail',
    exportActions, footerAggregates = true, notes, pageSize = 25,
  } = cfg;

  const table = columns.length ? DataTable({
    columns, rows, footerAggregates, pageSize,
    exportName: String(title || 'report').toLowerCase().replace(/\s+/g, '-'),
    printable: true,
  }) : null;

  const defaultExports = frag(
    Button('Export CSV', {
      variant: 'secondary', icon: 'download',
      onClick: () => {
        download(`${String(title || 'report').toLowerCase().replace(/\s+/g, '-')}.csv`,
          toCsv(rows, columns.map((c) => ({ key: c.key, label: c.label, value: c.value }))), 'text/csv;charset=utf-8');
        notify({ title: 'Report exported', tone: 'success' });
      },
    }),
    Button('Print', { variant: 'secondary', icon: 'print', onClick: () => printNode(root, title) }),
    Button('Schedule', { variant: 'ghost', icon: 'clock', onClick: mockAction('Schedule report') }));

  const body = [];
  if (filters.length) {
    body.push(Card({ className: 'p-0' },
      FilterBar({ filters, onChange: (id, v, all) => onFilter && onFilter(id, v, all, table) })));
  }
  if (summary.length) body.push(kpiRow(summary));
  if (chart) {
    const charts = [].concat(chart);
    for (const c of charts) {
      body.push(c.__titled ? c : SectionCard({ title: charts.length > 1 ? (c.__title || chartTitle) : chartTitle, className: 'chart-card' }, c));
    }
  }
  if (notes) body.push(notes);
  if (table) {
    const wrap = SectionCard({ title: tableTitle, flush: true });
    wrap.querySelector('.card-body').appendChild(table);
    body.push(wrap);
  }

  const root = page({
    title, subtitle, breadcrumb, route,
    actions: exportActions === false ? null : (exportActions || defaultExports),
    children: body,
  });
  root.table = table;
  return root;
}

/* =========================================================== settingsPage = */

/**
 * settingsPage({
 *   title, subtitle, breadcrumb, route,
 *   groups: [{id, title, description, icon, fields:[fieldSpec], render() -> Node,
 *             actions: [Node]}],
 *   onSave(values), sidebarNav: true
 * }) -> HTMLElement
 */
export function settingsPage(cfg = {}) {
  const { title, subtitle, breadcrumb, route, groups = [], onSave, saveLabel = 'Save changes', sidebarNav = true } = cfg;
  const values = {};

  const cards = groups.map((g) => {
    const bodyNode = typeof g.render === 'function'
      ? g.render(values)
      : FormGrid({ cols: g.cols || 2 }, (g.fields || []).map((f) => {
        values[f.id] = f.value;
        const onChange = (v) => { values[f.id] = v; };
        let control;
        if (f.type === 'switch') control = Switch(f.switchLabel || f.label, { checked: !!f.value, description: f.description, onChange });
        else if (f.type === 'select') control = Select({ options: f.options || [], value: f.value, onChange });
        else if (f.type === 'textarea') control = Textarea({ value: f.value || '', onInput: onChange });
        else if (f.type === 'static') control = h('div', { className: 't-medium', style: { paddingTop: '6px' } }, String(f.value ?? '—'));
        else control = Input({ type: f.type || 'text', value: f.value ?? '', placeholder: f.placeholder, onInput: onChange });
        return Field({
          label: f.type === 'switch' ? null : f.label, hint: f.hint, required: f.required,
          className: f.span === 'full' ? 'col-span-full' : null,
        }, control);
      }));

    const card = SectionCard({ title: g.title, subtitle: g.description, icon: g.icon, actions: g.actions ? h('div', { className: 'row' }, g.actions) : null },
      bodyNode);
    card.id = 'set-' + g.id;
    return card;
  });

  const nav = sidebarNav && groups.length > 2 ? Card({ pad: true },
    h('div', { className: 'stack-1' },
      h('div', { className: 't-eyebrow mb-2' }, 'On this page'),
      groups.map((g) => h('a', {
        className: 'menu-item', href: '#',
        onClick: (e) => { e.preventDefault(); document.getElementById('set-' + g.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
      }, g.icon && Icon(g.icon, 15), g.title)))) : null;

  const main = h('div', { className: 'stack' }, cards,
    Card({ pad: true }, FormActions(
      Button(saveLabel, { variant: 'primary', icon: 'check', onClick: () => (onSave ? onSave({ ...values }) : notify({ title: 'Settings saved', text: 'Demo only — nothing was persisted.', tone: 'success' })) }),
      Button('Reset', { variant: 'ghost', onClick: mockAction('Reset settings') }))));

  return page({
    title, subtitle, breadcrumb, route,
    children: nav ? h('div', { className: 'form-split' }, main, nav) : main,
  });
}

/* ======================================================= approvalQueuePage = */

/**
 * approvalQueuePage({
 *   title, subtitle, breadcrumb, route,
 *   kpis, tabs: [{id,label,count}], activeTab, onTabChange,
 *   columns, rows, onApprove(row), onReject(row), onView(row),
 *   detail(row) -> Node,      // rendered in a drawer when a row is opened
 *   bulkApprove: true
 * }) -> HTMLElement
 */
export function approvalQueuePage(cfg = {}) {
  const {
    title, subtitle, breadcrumb, route, kpis = [], tabs, activeTab, onTabChange,
    columns = [], rows = [], onApprove, onReject, detail, bulkApprove = true, filters = [], onFilter,
  } = cfg;

  const approve = (row) => {
    ConfirmDialog({
      title: 'Approve this request?', text: 'The requester will be notified immediately.',
      confirmLabel: 'Approve', tone: 'brand', icon: 'check-circle',
    }).then((ok) => { if (ok) { if (onApprove) onApprove(row); else notify({ title: 'Approved', tone: 'success' }); } });
  };
  const reject = (row) => {
    ConfirmDialog({
      title: 'Reject this request?', text: 'Add a reason in the next step so the requester understands the decision.',
      confirmLabel: 'Reject', tone: 'danger',
    }).then((ok) => { if (ok) { if (onReject) onReject(row); else notify({ title: 'Rejected', tone: 'danger' }); } });
  };

  const actionCol = {
    key: '__actions', label: 'Decision', sortable: false, width: 190, align: 'right',
    render: (row) => h('div', { className: 'row', style: { justifyContent: 'flex-end' } },
      Button('Approve', { variant: 'success', size: 'sm', icon: 'check', onClick: (e) => { e.stopPropagation(); approve(row); } }),
      Button('Reject', { variant: 'ghost', size: 'sm', icon: 'x', onClick: (e) => { e.stopPropagation(); reject(row); } })),
  };

  return listPage({
    title, subtitle, breadcrumb, route, kpis, tabs, activeTab, onTabChange, filters, onFilter,
    columns: columns.concat([actionCol]),
    rows,
    selectable: bulkApprove,
    bulkActions: bulkApprove ? [
      { label: 'Approve selected', icon: 'check', onClick: (sel) => notify({ title: `${sel.length} requests approved`, tone: 'success' }) },
      { label: 'Reject selected', icon: 'x', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} requests rejected`, tone: 'danger' }) },
    ] : [],
    onRowClick: detail ? (row) => Drawer({ title: 'Request detail', size: 'lg', body: detail(row),
      actions: (close) => frag(
        Button('Reject', { variant: 'ghost', onClick: () => { close(); reject(row); } }),
        Button('Approve', { variant: 'primary', icon: 'check', onClick: () => { close(); approve(row); } })) }) : null,
    emptyState: EmptyState({ icon: 'check-circle', title: 'Queue is clear', text: 'There are no pending requests waiting on you right now.' }),
  });
}

/* ============================================================= kanbanPage = */

/**
 * kanbanPage({title, subtitle, breadcrumb, route, kpis, columns, cards,
 *             onMove, onCardClick, actions, filters, onFilter, renderCard})
 */
export function kanbanPage(cfg = {}) {
  const { title, subtitle, breadcrumb, route, kpis = [], columns = [], cards = [],
    onMove, onCardClick, actions, filters = [], onFilter, renderCard } = cfg;

  const board = KanbanBoard({ columns, cards, onMove, onCardClick, renderCard });
  const body = [];
  if (kpis.length) body.push(kpiRow(kpis));
  if (filters.length) body.push(Card({ className: 'p-0' }, FilterBar({ filters, onChange: onFilter })));
  body.push(Card({ pad: true }, board));

  const node = page({ title, subtitle, breadcrumb, route, actions, children: body });
  node.board = board;
  return node;
}

/* =========================================================== calendarPage = */

/**
 * calendarPage({title, subtitle, breadcrumb, route, month, events, kpis,
 *               onSelectDate, onSelectEvent, actions, sidebar, view})
 */
export function calendarPage(cfg = {}) {
  const { title, subtitle, breadcrumb, route, month, events = [], kpis = [],
    onSelectDate, onSelectEvent, actions, sidebar = [], view = 'month', legend } = cfg;

  const cal = Calendar({ month, events, onSelectDate, onSelectEvent, view });
  const body = [];
  if (kpis.length) body.push(kpiRow(kpis));
  const main = Card({ pad: true }, cal, legend && h('div', { className: 'mt-3' }, legend));
  body.push(sidebar.length ? h('div', { className: 'detail-split' }, main, h('div', { className: 'stack-3' }, sidebar)) : main);

  const node = page({ title, subtitle, breadcrumb, route, actions, children: body });
  node.calendar = cal;
  return node;
}

/* ============================================================== utilities = */

/** A skeleton page shown while a route "loads" (~180ms). */
export function loadingPage({ title } = {}) {
  return h('div', { className: 'page' },
    h('div', { className: 'page-head' },
      h('div', { className: 'page-head-main stack-2' },
        Skeleton({ width: title ? '280px' : '220px', height: 26, radius: '8px' }),
        Skeleton({ width: '420px', height: 12 }))),
    h('div', { className: 'widget-grid' },
      [3, 3, 3, 3].map((s) => h('div', { className: `span-${s}` },
        Card({ pad: true }, h('div', { className: 'stack-3' },
          Skeleton({ width: '55%', height: 11 }),
          Skeleton({ width: '70%', height: 28, radius: '8px' }),
          Skeleton({ width: '40%', height: 10 })))))),
    h('div', { className: 'widget-grid' },
      h('div', { className: 'span-8' }, Card({ pad: true }, h('div', { className: 'stack-3' },
        Skeleton({ width: '30%', height: 12 }), Skeleton({ height: 220, radius: '10px' })))),
      h('div', { className: 'span-4' }, Card({ pad: true }, SkeletonText(8)))));
}

/** The 404 page used by the router when a route has no module yet. */
export function notFoundPage(ctx = {}) {
  const meta = ctx.route ? routeMeta(ctx.route) : null;
  return h('div', { className: 'page' },
    Card({ pad: true },
      EmptyState({
        icon: meta ? 'workflow' : 'search',
        title: meta ? `${meta.label} — coming up` : 'Page not found',
        text: meta
          ? `This screen belongs to the “${meta.sectionLabel}” module and is being built by the ${meta.sectionId} team. The route, navigation entry and breadcrumbs are already wired.`
          : `No module is registered for “${ctx.path || ctx.route || 'this route'}”. Check the route key against nav.js.`,
        action: h('div', { className: 'row' },
          Button('Back to dashboard', { variant: 'primary', icon: 'dashboard', href: navHref('dashboard/super-admin') }),
          Button('Open command palette', { variant: 'secondary', icon: 'command', onClick: () => document.dispatchEvent(new CustomEvent('erp:palette')) })),
      })),
    meta && Card({ pad: true },
      h('div', { className: 't-eyebrow mb-3' }, 'Route contract'),
      DescriptionList([
        ['Route key', h('code', null, meta.route)],
        ['Section id', h('code', null, meta.sectionId)],
        ['Nav label', meta.label],
        ['Visible to roles', meta.roles.length > 12 ? `${meta.roles.length} roles` : meta.roles.join(', ')],
      ])));
}

/** Small helper: a page-header action group. */
export function pageActions(...buttons) {
  return h('div', { className: 'page-actions' }, ...buttons);
}

/** Standard "record not found" body for detail routes with a bad id. */
export function missingRecord(kind = 'record', backRoute) {
  return h('div', { className: 'page' }, Card({ pad: true }, EmptyState({
    icon: 'search', title: `That ${kind} does not exist`,
    text: 'It may have been removed, or the link may be out of date.',
    action: backRoute ? Button('Go back to the list', { variant: 'primary', route: backRoute }) : null,
  })));
}

export {
  // re-exported so page modules can import everything from one place
  h, frag, Card, SectionCard, StatCard, Badge, Button, IconButton, Toolbar,
  DataTable, EmptyState, Timeline, DescriptionList, Modal, Drawer, ConfirmDialog,
  notify, Divider, Callout, Identity, ProgressBar, formatDate, formatNumber,
};
