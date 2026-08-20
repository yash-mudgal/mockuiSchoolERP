# Springdale ERP — Foundation Contract

**Everything in this file is already built, tested in Chrome and ready to use.**
Code against this document; you should not need to read the foundation source.

* Vanilla ES modules, no build step, no npm, no CDN, fully offline.
* Hash routing (`#/students/all`), one `index.html` shell.
* All charts are hand-written inline SVG.
* Run it: double-click **`start.bat`**, or `python serve.py`, then open
  <http://localhost:5173>. ES modules will **not** run from `file://`.

---

## 0. Who owns what

| You own | You must not edit |
|---|---|
| `assets/js/pages/<your-section>.js` | anything in `assets/js/core/`, `assets/js/data/`, `assets/css/`, `index.html` |
| your own page CSS **only** if it cannot be expressed with existing classes/tokens | `registry.js` (the integration team wires it) |

Work is assigned by **section id** (see §6). One file per section is the norm:
`assets/js/pages/students.js`, `assets/js/pages/fees.js`, …

---

## 1. Imports

From a file in `assets/js/pages/` the paths are always `../core/…` and `../data/…`.

```js
// assets/js/pages/students.js
import {
  h, frag, Card, SectionCard, StatCard, Badge, Button, IconButton, Identity,
  DataTable, Modal, Drawer, ConfirmDialog, notify, EmptyState, Timeline,
  DescriptionList, ProgressBar, Avatar, Tabs, FilterBar, MenuButton,
  formatCurrency, formatNumber, formatDate, relativeTime, toneForStatus,
  Callout, FileList, RankList, validators, mockAction,
} from '../core/ui.js';

import {
  page, listPage, detailPage, dashboardPage, formPage, reportPage,
  settingsPage, approvalQueuePage, kanbanPage, calendarPage,
  profileHeader, kpiRow, greetingFor, missingRecord,
} from '../core/page-kit.js';

import {
  lineChart, areaChart, barChart, comboChart, donutChart, pieChart,
  funnelChart, heatmap, gaugeChart, scatterPlot, bulletChart, waterfallChart,
  treemap, radialBarChart, progressRing, sparkline, stackedProgressBar,
  PALETTE, SEQUENTIAL, STATUS, seriesColor,
} from '../core/charts.js';

import { db, analytics, query, byId, where, search, sortBy, paginate,
         groupBy, sum, avg, countBy, sumBy, student360 } from '../data/db.js';

import { icon } from '../core/icons.js';
import { navHref, navigate } from '../core/router.js';
import * as store from '../core/state.js';
import { routeMeta, breadcrumbFor } from '../core/nav.js';
```

`page-kit.js` also re-exports the most-used `ui.js` pieces (`h`, `Card`,
`SectionCard`, `StatCard`, `Badge`, `Button`, `IconButton`, `Toolbar`,
`DataTable`, `EmptyState`, `Timeline`, `DescriptionList`, `Modal`, `Drawer`,
`ConfirmDialog`, `notify`, `Divider`, `Callout`, `Identity`, `ProgressBar`,
`formatDate`, `formatNumber`) so a simple page can import from one module.

---

## 2. `core/ui.js` — component kit

**Every component returns a real DOM node** (`HTMLElement` / `SVGElement` /
`DocumentFragment`), never an HTML string. Compose with `appendChild` or by
passing nodes as children of `h()`.

### 2.1 DOM helper

| Export | Signature | Returns |
|---|---|---|
| `h` | `h(tag, props?, ...children)` | `HTMLElement \| SVGElement` |
| `el` | alias of `h` | |
| `frag` | `frag(...children)` | `DocumentFragment` |
| `mount` | `mount(node, contentNodeOrHtml)` | the node |
| `unmount` | `unmount(node)` | `void` |
| `Icon` | `Icon(name, size = 16, opts?)` | `SVGElement` |
| `escapeHtml` | `escapeHtml(str)` | `string` |

`h()` props: `className` (string or array) · `style` (object or string; `--vars`
supported) · `dataset` (→ `data-*`) · `attrs` (raw attributes) · `html`
(innerHTML — never with untrusted text) · `ref(node)` · `on<Event>` handlers
(`onClick`, `onInput`, `onKeyDown`, …) · anything else becomes a property or
attribute. Falsy children (`null`, `false`, `undefined`) are skipped, so
`cond && node` is safe. Arrays are flattened.

```js
h('div', { className: ['row', isActive && 'is-on'], onClick: fn },
  Icon('users', 16), h('span', null, 'Students'))
```

### 2.2 Formatting & utilities

| Export | Signature | Example |
|---|---|---|
| `formatNumber` | `(n, decimals?) → string` | `12,34,567` (Indian grouping) |
| `formatCurrency` | `(n, {compact?, decimals?, symbol?, sign?}) → string` | `₹1,25,000` · compact → `₹48.2 L`, `₹9.24 Cr` |
| `formatPercent` | `(n, decimals = 1, alreadyPercent = true) → string` | `83.4%` |
| `formatDate` | `(d, style?) → string` | styles: `medium` (default `20 Aug 2026`), `short` `20/08/26`, `numeric`, `iso`, `dayMonth`, `monthYear`, `long`, `weekday` |
| `formatDateTime` | `(d, style?) → string` | `20 Aug 2026, 09:45 AM` |
| `formatTime` | `(d, {h24?}) → string` | `09:45 AM` |
| `relativeTime` | `(d, now = DEMO_NOW) → string` | `3 days ago` |
| `DEMO_NOW` | `Date` | the demo clock: `2026-08-20T09:30:00` |
| `initials` | `(name, max = 2) → string` | `MK` |
| `toneForStatus` | `(status) → 'success'\|'warning'\|'danger'\|'info'\|'brand'\|'neutral'` | see §8 |
| `hueFor` | `(str) → 1..6` | stable avatar hue |
| `download` | `(filename, content, mime?)` | triggers a browser download |
| `toCsv` | `(rows, columns?) → string` | `columns` = `[{key,label,value?}]` |
| `printNode` | `(node, title?)` | opens a styled print window |
| `copyToClipboard` | `(text, message?)` | copies + toasts |
| `debounce` | `(fn, ms = 200) → fn` | |

### 2.3 Layout & content

| Export | Signature |
|---|---|
| `Card` | `Card({className?, pad?, raised?, flat?, accent?, onClick?}, ...children)` |
| `SectionCard` | `SectionCard({title?, subtitle?, icon?, actions?, footer?, flush?, bodyClass?, className?}, ...body)` |
| `StatCard` | `StatCard({label, value, delta?, deltaLabel?, deltaDir?, trend?, icon?, tone?, hero?, onClick?, route?, footer?})` — `tone`: `brand\|success\|warning\|danger\|info`; `trend` = number[] → sparkline |
| `Badge` / `StatusChip` | `Badge(text, {tone?, icon?, dot?, outline?, size?})` — omit `tone` and it is derived with `toneForStatus` |
| `Pill` | `Pill(text, {active?, onClose?, onClick?, icon?})` |
| `Tag` | `Tag(text, {icon?})` |
| `Avatar` | `Avatar(name, {src?, size?, status?, ring?, hue?, initials?})` — size `xs\|sm\|md\|lg\|xl\|2xl`; status `online\|away\|offline` |
| `AvatarStack` | `AvatarStack(names[], {size?, max?})` |
| `Identity` | `Identity(name, meta?, {size?, src?, status?, onClick?})` — avatar + 2 lines, the standard table name cell |
| `Button` | `Button(label, {variant?, size?, icon?, iconRight?, loading?, disabled?, onClick?, block?, route?, href?, type?})` — variant `primary\|secondary\|ghost\|subtle\|danger\|success\|link`; size `sm\|md\|lg`; passing `route` renders an `<a>` |
| `ButtonGroup` | `ButtonGroup(buttons[])` |
| `IconButton` | `IconButton(iconName, {label?, size?, onClick?, active?, bordered?, route?})` |
| `Kbd` | `Kbd('Ctrl','K')` |
| `Toolbar` / `ToolbarSep` | `Toolbar(...children)` |
| `Divider` | `Divider({label?})` |
| `Callout` | `Callout({tone?, icon?, title?}, ...children)` |
| `MetricRow` | `MetricRow(label, value, extra?)` |
| `RankList` | `RankList([{name, meta?, value, avatar?}])` |
| `DescriptionList` | `DescriptionList(pairs, {cols?: 1\|2, className?})` — pairs `[[label,value]]` or `[{label,value}]` |
| `PhotoGrid` | `PhotoGrid([{caption?, icon?}])` |
| `FileList` | `FileList([{name,size,type,date,status?}], {onDownload?, onRemove?})` |
| `NotificationItem` | `NotificationItem(n, {onClick?})` |

### 2.4 Navigation & disclosure

| Export | Signature | Notes |
|---|---|---|
| `Tabs` | `Tabs(items, onChange, {active?, className?})` | items `[{id,label,icon?,count?,disabled?}]`; node exposes `.setActive(id)` / `.getActive()` |
| `SegmentedControl` | `SegmentedControl(options, onChange, {active?})` | options: strings or `[{id,label,icon}]` |
| `Accordion` | `Accordion(items, {multi?, openIds?})` | items `[{id,title,icon?,badge?,body\|render()}]` |
| `Collapse` | `Collapse({title, open?, icon?}, ...children)` | |
| `Stepper` | `Stepper(steps, {current})` | steps `[{label,description?,state?}]`; state `done\|current\|todo\|rejected` |
| `ApprovalTrail` | `ApprovalTrail([{label,by,date,note,state}])` | |
| `Timeline` | `Timeline([{title, meta?, text?, icon?, tone?, render?}])` | |
| `ActivityFeed` | `ActivityFeed([{name?, text, time?, icon?, tone?, avatar?}])` | |
| `CommentThread` | `CommentThread(comments, {onSubmit?, placeholder?})` | |

### 2.5 Search & filters

```js
SearchInput({ placeholder?, value?, onInput(v), onEnter(v)?, width?, size? })

FilterBar({
  filters: [{ id, label, type?: 'select'|'search'|'date'|'segment',
              options?, value?, placeholder?, width?, allLabel? }],
  onChange(id, value, allValues),
  actions?, saved?: [{label, active, onClick}]
})
```
`type: 'select'` prepends an “All …” option whose value is `'all'`.

### 2.6 `DataTable` — the workhorse

```js
DataTable({
  columns, rows,
  rowKey        = 'id',
  searchable    = true,  searchKeys = null, searchPlaceholder,
  sortBy        = null,  sortDir = 'asc',
  paginate      = true,  pageSize = 25, pageSizes = [10,25,50,100,250],
  selectable    = false, bulkActions = [],
  rowActions    = null,  onRowClick = null,
  expandable    = null,  groupBy = null,
  footerAggregates = false,
  columnToggle  = true,  exportable = true, printable = false,
  toolbar, loading, error, onRetry, emptyState,
  responsive    = true,  maxHeight, exportName,
})
```

**Column spec**

| Field | Type | Meaning |
|---|---|---|
| `key` | string | row property (also the CSV/export key) |
| `label` | string | header text |
| `width` | number \| string | column width |
| `align` | `left\|right\|center` | |
| `numeric` | bool | applies tabular numerals |
| `sortable` | bool (default `true`) | set `false` to disable |
| `sticky` | bool | pins the column to the left edge |
| `filter` | `true` \| `string[]` | adds a per-column dropdown (auto values when `true`) |
| `hidden` | bool | hidden by default in the column menu |
| `render(row, i)` | fn → Node \| string | custom cell |
| `value(row)` | fn | value used for sorting and export (when `render` returns a node) |
| `aggregate` | `'sum'\|'avg'\|'count'` \| fn | footer total (needs `footerAggregates: true`) |
| `format(v)` | fn | formats the aggregate |
| `className` | string | extra cell class |

**Instance methods** — `table.refresh(newRows)`, `table.getRows()` (after
search/filter/sort), `table.getSelected()`, `table.setLoading(bool)`,
`table.setSearch(term)`.

**Built in**: text search, multi-column sort, per-column filters, pagination
with page-size select, row selection + bulk-action bar, column visibility menu,
sticky header **and** sticky first column, row click → detail, inline row-action
menu, expandable rows, grouping, footer aggregates, density awareness, CSV
export, print, empty state, loading skeleton, error state, and a stacked-card
fallback under 768 px.

> The sticky header needs an internal scroll box. `.dt-scroll` defaults to
> `max-height: calc(100vh - 250px)`. Pass `maxHeight: '60vh'` to change it or
> `maxHeight: 'none'` to let the page scroll instead.

```js
DataTable({
  columns: [
    { key:'name', label:'Student', sticky:true, width:250,
      render: r => Identity(r.name, r.admissionNo), value: r => r.name },
    { key:'className', label:'Class', width:110, filter:true },
    { key:'attendancePct', label:'Attendance', align:'right', numeric:true, aggregate:'avg' },
    { key:'feeDue', label:'Fee due', align:'right', numeric:true, aggregate:'sum',
      format: v => formatCurrency(v, { compact:true }),
      render: r => formatCurrency(r.feeDue) },
    { key:'status', label:'Status', width:110, filter:true, render: r => Badge(r.status) },
  ],
  rows: db.students,
  selectable: true, footerAggregates: true,
  searchKeys: ['name','admissionNo','className'],
  bulkActions: [{ label:'Send SMS', icon:'send', onClick: rows => notify({ title:`${rows.length} selected` }) }],
  rowActions: row => [
    { label:'Open profile', icon:'eye', route:`students/profile/${row.id}` },
    { label:'Edit', icon:'edit', onClick:() => {} },
    { separator:true },
    { label:'Issue TC', icon:'log-out', tone:'danger', onClick:() => {} },
  ],
  onRowClick: row => navigate(`students/profile/${row.id}`),
})
```

### 2.7 Overlays

| Export | Signature | Returns |
|---|---|---|
| `Modal` | `Modal({title?, subtitle?, body?, actions?, size?, icon?, tone?, closable?, onClose?, dismissOnScrim?})` | `{close(), el}` |
| `Drawer` | `Drawer({side?, title?, subtitle?, body?, actions?, size?, flush?, closable?, onClose?})` | `{close(), el}` |
| `ConfirmDialog` | `ConfirmDialog({title?, text?, confirmLabel?, cancelLabel?, tone?, icon?, onConfirm?})` | `Promise<boolean>` |
| `openMenu` | `openMenu(anchorEl, items, {align?, title?, minWidth?})` | menu element |
| `closeMenu` | `closeMenu()` | |
| `MenuButton` | `MenuButton(itemsOrFn, {icon?, label?, size?, align?})` | button node |
| `Popover` | `Popover(anchorEl, contentNode, {align?, width?})` | `close()` |
| `notify` / `Toast` | `notify({title?, text?, tone?, icon?, duration?, action?})` | `{dismiss(), el}` |
| `toastSuccess/Error/Info/Warning` | `(title, text?)` | |
| `mockAction` | `mockAction(label) → handler` | “demo only” toast, for unwired buttons |

`Modal` sizes: `sm 400 · md 520 · lg 760 · xl 1040 · full 1400`.
`Drawer` sides `right\|left`, sizes `md 460 · lg 680 · xl 900`.
`body`/`actions` may be a Node **or** a function receiving `close`.
Menu items: `{label, icon?, onClick?, route?, tone?, checked?, shortcut?, disabled?}`,
`{separator:true}`, `{header:true, label}`.

### 2.8 Form kit

| Export | Signature |
|---|---|
| `Field` | `Field({label?, required?, hint?, error?, success?, htmlFor?, className?}, control)` |
| `Input` | `Input({type?, value?, placeholder?, onInput(v), onChange(v)?, disabled?, invalid?, size?, numeric?, prefix?, suffix?, min?, max?, step?, maxLength?, readOnly?, id?, name?})` |
| `Textarea` | `Textarea({value?, rows?, placeholder?, onInput(v), invalid?, maxLength?})` |
| `Select` | `Select({options, value?, onChange(v), placeholder?, disabled?, invalid?, size?})` — options: strings, `[{value,label,disabled}]`, or `[{group, options}]` |
| `Combobox` | `Combobox({options, value?, onChange(v, opt), placeholder?, searchable?, width?})` — searchable single-select; node has `.getValue()/.setValue()` |
| `MultiSelect` | `MultiSelect({options, values?, onChange(values[]), placeholder?, width?})` — pills + search |
| `Checkbox` | `Checkbox(label, {checked?, onChange(bool), indeterminate?, disabled?})` |
| `RadioGroup` | `RadioGroup(options, {name, value?, onChange(v), inline?})` |
| `Switch` | `Switch(label, {checked?, onChange(bool), description?})` |
| `DatePicker` | `DatePicker({value?: 'YYYY-MM-DD', onChange(iso, date), placeholder?, width?})` — custom, no deps |
| `DateRangePicker` | `DateRangePicker({from?, to?, onChange({from,to})})` |
| `TimePicker` | `TimePicker({value?: 'HH:MM', onChange(v), step?, from?, to?})` |
| `FileUpload` | `FileUpload({label?, hint?, accept?, multiple?, onFiles(files[])})` — drag-and-drop mock |
| `FormSection` | `FormSection({title?, description?}, ...children)` |
| `FormGrid` | `FormGrid({cols?: 1\|2\|3\|4}, ...fields)` — children may use `.col-span-2` / `.col-span-full` |
| `FormActions` | `FormActions(...buttons)` |
| `unsavedGuard` | `unsavedGuard(formEl, {message?}) → release()` |
| `validators` | `{required, email, phone, number, min(n), max(n), pattern(re, msg)}` — each `(value, allValues) → string \| null` |

### 2.9 Feedback, progress & rich components

| Export | Signature |
|---|---|
| `EmptyState` | `EmptyState({icon?, title?, text?, action?, tone?})` |
| `ErrorState` | `ErrorState({title?, text?, onRetry?})` |
| `Skeleton` | `Skeleton({width?, height?, circle?, radius?})` |
| `SkeletonText` | `SkeletonText(lines = 3)` |
| `SkeletonTable` | `SkeletonTable({rows?, cols?})` |
| `ProgressBar` | `ProgressBar(value, {max?, tone?, size?, label?, showValue?})` |
| `StackedProgressBar` | `StackedProgressBar([{value, color, label}])` |
| `RadialProgress` | `RadialProgress(value, {size?, thickness?, tone?, label?, sublabel?, max?})` |
| `Rating` | `Rating(value, {max?, showValue?})` |
| `Calendar` | `Calendar({month:'YYYY-MM', events, onSelectDate?, onSelectEvent?, view?: 'month'\|'agenda', maxPerDay?})` — events `[{date:'YYYY-MM-DD', title, tone?, meta?, badge?}]` |
| `KanbanBoard` | `KanbanBoard({columns, cards, onMove(cardId, toColumnId, card)?, onCardClick?, renderCard?})` — drag & drop; `.refresh(cards)` |
| `MapPlaceholder` | `MapPlaceholder({routes?, vehicles?, height?, animate?, legend?})` — stylised SVG route map with animated vehicle markers (0–100 coordinate space) |
| `ChatPanel` | `ChatPanel({messages, onSend(text)?, placeholder?, height?})` |

---

## 3. `core/charts.js` — SVG chart library

All charts: responsive (re-render on container resize), theme-aware through CSS
variables, accessible (`role="img"` + `<title>`), with axis ticks, hairline
gridlines, selective value labels, legends and hover tooltips. Every chart with
series data also ships a **table view** toggle (this is what satisfies the
contrast relief rule in light mode — do not remove it).

### 3.1 Palette variables (defined in `tokens.css`)

| Role | CSS variables |
|---|---|
| Categorical (fixed slot order, never cycled) | `--chart-1` … `--chart-8`, `--chart-other` |
| Sequential (one hue, light → dark) | `--chart-seq-1` … `--chart-seq-7` |
| Ordinal (discrete ordered marks) | `--chart-ord-1` … `--chart-ord-6` |
| Diverging (blue ↔ red, neutral grey mid) | `--chart-div-neg-3..-1`, `--chart-div-mid`, `--chart-div-pos-1..3` |
| Status (reserved — never a series colour) | `--chart-good`, `--chart-warning`, `--chart-serious`, `--chart-critical` |
| Chrome | `--chart-surface`, `--chart-ink`, `--chart-ink-2`, `--chart-ink-muted`, `--chart-grid`, `--chart-axis`, `--chart-track` |

JS mirrors: `PALETTE[]`, `OTHER_COLOR`, `SEQUENTIAL[]`, `ORDINAL[]`,
`DIVERGING[]`, `STATUS.{good,warning,serious,critical}`,
`seriesColor(i)`, `sequentialColor(t 0..1)`, `divergingColor(t -1..1)`.

The eight categorical hues were validated for colour-blind separation against
both the light (`#ffffff`) and dark (`#141821`) chart surfaces. **Rules:**
assign slots in fixed order; never generate a 9th hue (fold the tail into
“Other”); never use a status colour for a series; **never build a dual-axis
chart** — use two charts or index both measures to a common base.

### 3.2 Common options

Accepted by every chart function: `height`, `title` (also the accessible
label), `className`, `legend` (default `true`, auto-suppressed for one series),
`tableView` (default `true`), and `valueFormat`.

`valueFormat` is a key of `FORMATS` — `'number' | 'compact' | 'currency' |
'currencyCompact' | 'percent' | 'percent0' | 'decimal'` — or your own
`(value) => string`.

`series` is either `number[]` (single unnamed series) or
`[{ name, values: number[], color?, dashed? }]`.

### 3.3 Signatures

| Export | Signature |
|---|---|
| `lineChart` | `({series, categories, height?, valueFormat?, target?, targetLabel?, showDots?, showEndLabels?, yFormat?, baselineZero?, minY?, maxY?})` |
| `areaChart` | `({series, categories, stacked?, …lineChart opts})` |
| `barChart` | `({series, categories, horizontal?, stacked?, showValues?, target?, …})` — grouped is the default for 2+ series |
| `comboChart` | `({categories, bars:[series], line:{name,values,color?}, stacked?, …})` — **one shared y-axis** |
| `sparkline` | `(values[], {height?, color?, fill?, showLast?}) → SVGElement` (no shell) |
| `donutChart` | `({data:[{key,value,color?}], height?, centerValue?, centerLabel?, maxSlices = 6, inner?})` |
| `pieChart` | `({data, height?, maxSlices = 6})` |
| `gaugeChart` | `({value, min?, max?, label?, color?, height?})` |
| `radialBarChart` | `({data:[{key,value,max}], height?})` — max 5 rings |
| `progressRing` | `(value, {max?, size?, thickness?, color?, label?, sublabel?, valueFormat?}) → SVGElement` |
| `heatmap` | matrix: `({mode:'matrix', rows[], cols[], values[][], cellSize?, min?, max?})` · calendar: `({mode:'calendar', days:[{date,value}], seriesName?, min?, max?})` |
| `ScaleLegend` | `(min, max, {ramp?, format?}) → HTMLElement` — pair it with a heatmap |
| `funnelChart` | `({stages:[{label,value}], showConversion?, height?})` — uses the ordinal ramp |
| `scatterPlot` | `({points:[{x,y,label?,group?,size?}], xLabel?, yLabel?, height?})` — max 3 groups, rest fold to “Other” |
| `bulletChart` | `({items:[{label,value,target,ranges?,color?}], height?})` |
| `waterfallChart` | `({items:[{label,value,type:'start'\|'delta'\|'total'}], height?})` |
| `treemap` | `({data:[{key,value,color?}], height?})` |
| `stackedProgressBar` | `({segments:[{label,value,color?}], barHeight?, showLegend?})` → HTMLElement |
| `compactNumber` | `(n) → '12K' \| '4.8L' \| '9.2Cr'` |
| `deltaTone` | `(delta, upIsGood = true) → 'up'\|'down'\|'flat'` |

```js
SectionCard({ title: 'Fee collection vs target', subtitle: 'Monthly, 2026-27',
              className: 'chart-card' },
  comboChart({
    categories: analytics.feeCollectionVsTarget.map(r => r.month),
    bars: [{ name: 'Collected', values: analytics.feeCollectionVsTarget.map(r => r.collected) }],
    line: { name: 'Target',     values: analytics.feeCollectionVsTarget.map(r => r.target) },
    valueFormat: 'currencyCompact', height: 280,
  }))
```

---

## 4. `core/page-kit.js` — page builders

Each builder returns a DOM node ready to append to `mount`. They publish the
breadcrumb automatically when given `route`.

| Export | Purpose |
|---|---|
| `page` | the standard page frame |
| `listPage` | a complete best-practice list screen |
| `detailPage` | record detail with tabs, right rail and timeline |
| `formPage` | create/edit as a page, modal or wizard |
| `dashboardPage` | KPI row + responsive 12-column widget grid |
| `reportPage` | filters + summary + chart + table + exports |
| `settingsPage` | grouped settings with an on-page nav |
| `approvalQueuePage` | queue with approve/reject + bulk actions |
| `kanbanPage` | board with drag & drop |
| `calendarPage` | month/agenda calendar with a side rail |
| `profileHeader` | avatar + name + meta + actions header card |
| `kpiRow` | a row of `StatCard`s in the widget grid |
| `greetingFor` | `greetingFor('Meera Krishnan') → 'Good morning, Meera'` |
| `pageActions` | wraps header buttons |
| `missingRecord` | standard body for a bad detail id |
| `setBreadcrumb` | `setBreadcrumb(trail, actions?)` — manual override |
| `notFoundPage`, `loadingPage` | used by the shell; you rarely need them |

### 4.1 `page`

```js
page({ title, subtitle, breadcrumb, route, actions, tabs, onTabChange,
       activeTab, filters, wide, children, className })
```

### 4.2 `listPage` — worked example

```js
export const routes = {
  'students/all': {
    title: 'All Students',
    subtitle: 'Every enrolled student across the selected campus',
    section: 'students',
    render(mount, ctx) {
      const rows = where(db.students, { campusId: ctx.state.campusId });

      mount.appendChild(listPage({
        title: 'All Students',
        subtitle: `${formatNumber(rows.length)} enrolled · academic year 2026-27`,
        route: 'students/all',

        actions: [
          Button('Import', { variant: 'secondary', icon: 'upload', route: 'students/bulk-import' }),
          Button('Add student', { variant: 'primary', icon: 'user-plus', route: 'students/add' }),
        ],

        tabs: [
          { id: 'all',    label: 'All',            count: rows.length },
          { id: 'active', label: 'Active',         count: rows.filter(r => r.status === 'Active').length },
          { id: 'new',    label: 'New admissions', count: 392 },
        ],
        activeTab: 'all',
        onTabChange: id => notify({ title: `Tab: ${id}` }),

        kpis: [
          { label: 'Total students', value: formatNumber(rows.length), delta: 4.4,
            deltaLabel: 'vs last year', icon: 'graduation-cap', tone: 'brand',
            trend: analytics.sparks.students },
          { label: 'Avg attendance', value: '88.9%', delta: -0.6, icon: 'clipboard-check', tone: 'info' },
          { label: 'Fee defaulters', value: '925',   delta: 6.2,  icon: 'alert-circle',   tone: 'danger' },
          { label: 'On transport',   value: '1,012', icon: 'bus',  tone: 'success' },
        ],

        filters: [
          { id: 'q',      type: 'search', label: 'Search', placeholder: 'Name or admission no…' },
          { id: 'class',  label: 'Class',  options: ['Class I', 'Class V', 'Class X'] },
          { id: 'house',  label: 'House',  options: ['Aravalli', 'Nilgiri', 'Shivalik', 'Vindhya'] },
          { id: 'status', label: 'Status', options: ['Active', 'Inactive', 'Alumni'] },
        ],
        onFilter: (id, value, all, table) => table.refresh(applyFilters(rows, all)),

        chart: barChart({
          categories: analytics.enrolmentByClass.map(r => r.className),
          series: [{ name: 'Students', values: analytics.enrolmentByClass.map(r => r.value) }],
          height: 200,
        }),
        chartTitle: 'Enrolment by class',

        columns: [ /* see §2.6 */ ],
        rows,
        selectable: true,
        footerAggregates: true,
        searchKeys: ['name', 'admissionNo'],
        bulkActions: [{ label: 'Send message', icon: 'send', onClick: sel => {} }],
        rowActions: row => [{ label: 'Open', icon: 'eye', route: `students/profile/${row.id}` }],
        onRowClick: row => navigate(`students/profile/${row.id}`),
        emptyState: EmptyState({ icon: 'users', title: 'No students yet' }),
      }));
    },
  },
};
```
The returned node exposes `.table` (the `DataTable` instance).

### 4.3 `detailPage` — worked example

```js
'students/profile': {
  title: 'Student 360 Profile',
  section: 'students',
  render(mount, ctx) {
    const id = ctx.param || 'STU00001';        // '#/students/profile/STU00042'
    const s  = student360(id);
    if (!s) return mount.appendChild(missingRecord('student', 'students/all'));

    mount.appendChild(detailPage({
      title: s.student.name,
      subtitle: `${s.student.className} · Section ${s.student.section} · ${s.student.house} House`,
      route: 'students/profile',
      badges: [Badge(s.student.status), Badge(s.student.feeStatus)],
      meta: [
        { label: 'Admission no', value: s.student.admissionNo, icon: 'id-card' },
        { label: 'Attendance',   value: `${s.student.attendancePct}%`, icon: 'clipboard-check' },
        { label: 'CGPA',         value: s.student.cgpa, icon: 'chart-line' },
      ],
      actions: [
        Button('Message parent', { variant: 'secondary', icon: 'send' }),
        Button('Edit', { variant: 'primary', icon: 'edit' }),
      ],
      tabs: [
        { id: 'overview',  label: 'Overview',  icon: 'user',
          render: () => DescriptionList([
            ['Gender', s.student.gender], ['Date of birth', formatDate(s.student.dob)],
            ['Blood group', s.student.bloodGroup], ['Category', s.student.category],
          ], { cols: 2 }) },
        { id: 'academics', label: 'Academics', count: s.subjectScores.length,
          render: () => DataTable({ columns: [...], rows: s.subjectScores, paginate: false }) },
        { id: 'fees',      label: 'Fees',      count: s.invoices.length,
          render: () => DataTable({ columns: [...], rows: s.invoices }) },
        { id: 'documents', label: 'Documents', count: s.documents.length,
          render: () => FileList(s.documents.map(d => ({ name: d.name, type: d.type, status: d.status }))) },
      ],
      sidebar: [
        SectionCard({ title: 'Guardians', icon: 'users' },
          RankList(s.guardians.map(g => ({ name: g.name, meta: g.relation, value: '' })))),
        SectionCard({ title: 'Fee summary', icon: 'wallet' },
          DescriptionList([['Billed', formatCurrency(s.student.feeTotal)],
                           ['Paid',   formatCurrency(s.student.feePaid)],
                           ['Due',    formatCurrency(s.student.feeDue)]])),
      ],
      timeline: s.timeline.map(e => ({
        title: e.title, meta: formatDate(e.date), text: e.text, icon: e.icon, tone: e.tone,
      })),
    }));
  },
},
```

### 4.4 `dashboardPage` — worked example

```js
'dashboard/principal': {
  title: 'Principal Dashboard',
  section: 'dashboard',
  render(mount, ctx) {
    const k = analytics.kpis;
    mount.appendChild(dashboardPage({
      greeting: greetingFor(ctx.state.currentUser.name),
      title: 'Campus performance at a glance',
      subtitle: 'Main Campus, Gurugram · academic year 2026-27',
      route: 'dashboard/principal',
      actions: Button('Download MIS pack', { variant: 'secondary', icon: 'download' }),

      kpis: [
        { label: 'Students',       value: formatNumber(k.activeStudents), delta: 4.4,
          icon: 'graduation-cap', tone: 'brand',   trend: analytics.sparks.students },
        { label: 'Attendance',     value: `${k.avgAttendance}%`, delta: 1.2,
          icon: 'clipboard-check', tone: 'success', trend: analytics.sparks.attendance },
        { label: 'Fee collected',  value: formatCurrency(k.feeCollected, { compact: true }), delta: 8.1,
          icon: 'wallet',          tone: 'info',    trend: analytics.sparks.collection },
        { label: 'Open complaints', value: k.openComplaints, delta: -12,
          icon: 'alert-circle',    tone: 'danger',  trend: analytics.sparks.complaints },
      ],

      widgets: [
        { span: 8, render: () => SectionCard({ title: 'Attendance trend', className: 'chart-card' },
            lineChart({ categories: analytics.attendanceTrend.map(r => r.month),
                        series: [{ name: 'Students', values: analytics.attendanceTrend.map(r => r.students) },
                                 { name: 'Staff',    values: analytics.attendanceTrend.map(r => r.staff) }],
                        valueFormat: 'percent', target: 90, height: 260 })) },
        { span: 4, render: () => SectionCard({ title: 'Gender split', className: 'chart-card' },
            donutChart({ data: analytics.genderSplit, height: 230, centerLabel: 'Students' })) },
        { span: 6, render: () => SectionCard({ title: 'Top performers' },
            RankList(analytics.topPerformers.map(t => ({
              name: t.name, meta: `${t.className} · ${t.house}`, value: `${t.percent}%` })))) },
        { span: 6, render: () => SectionCard({ title: 'Class performance', className: 'chart-card' },
            barChart({ categories: analytics.classPerformance.map(r => r.className),
                       series: [{ name: 'Average', values: analytics.classPerformance.map(r => r.average) }],
                       valueFormat: 'percent', height: 260 })) },
      ],
    }));
  },
},
```
Widget `span` is a 1–12 grid span; the grid collapses responsively.

### 4.5 `formPage` — worked example

```js
'students/add': {
  title: 'Add Student',
  section: 'students',
  render(mount) {
    mount.appendChild(formPage({
      title: 'Add student',
      subtitle: 'Create an admission record for the 2026-27 session',
      route: 'students/add',
      mode: 'page',                       // 'page' | 'modal' | 'wizard'
      submitLabel: 'Create student',
      sections: [
        { title: 'Student details', description: 'As printed on the birth certificate', cols: 2,
          fields: [
            { id: 'firstName', label: 'First name', required: true },
            { id: 'lastName',  label: 'Last name',  required: true },
            { id: 'dob',       label: 'Date of birth', type: 'date', required: true },
            { id: 'gender',    label: 'Gender', type: 'radio', inline: true,
              options: ['Male', 'Female', 'Other'] },
            { id: 'class',     label: 'Class', type: 'select',
              options: db.classes.filter(c => c.campusId === 'C1').map(c => ({ value: c.id, label: c.name })) },
            { id: 'house',     label: 'House', type: 'combobox',
              options: db.houses.map(h => ({ value: h.id, label: h.name })) },
            { id: 'optional',  label: 'Optional subjects', type: 'multiselect',
              options: ['French', 'Music', 'Art'] },
            { id: 'notes',     label: 'Remarks', type: 'textarea', span: 'full' },
          ] },
        { title: 'Contact', cols: 2,
          fields: [
            { id: 'email', label: 'Email', type: 'email', validate: validators.email },
            { id: 'phone', label: 'Phone', type: 'tel',   validate: validators.phone, required: true },
            { id: 'transport', label: 'Transport', type: 'switch',
              switchLabel: 'Opt in to school transport' },
            { id: 'docs',  label: 'Documents', type: 'file', span: 'full' },
          ] },
      ],
      sidebar: [Callout({ tone: 'info', title: 'Before you start' },
        'Fields marked * are mandatory. Documents can be uploaded later.')],
      onSubmit: values => notify({ title: 'Student created', text: values.firstName, tone: 'success' }),
      onCancel: () => history.back(),
    }));
  },
},
```

*Field spec*: `{id, label, type, required?, hint?, placeholder?, options?, value?,
span?: 2|'full', validate?: fn|fn[], render?(values, setValue)}`.
Types: `text · number · email · tel · date · time · textarea · select ·
multiselect · combobox · checkbox · switch · radio · file · static · custom`.

*Wizard mode*: pass `mode:'wizard'` and `steps: [{id, label, description?,
sections:[…]}]`. Each step is validated before “Continue”.
*Modal mode*: pass `mode:'modal'` — the function opens the modal and returns its
handle instead of a page node.

### 4.6 `reportPage` — worked example

```js
'reports/fees': {
  title: 'Fee Reports',
  section: 'reports',
  render(mount) {
    mount.appendChild(reportPage({
      title: 'Fee collection report',
      subtitle: 'Quarter 2 · all campuses',
      route: 'reports/fees',
      filters: [
        { id: 'period', label: 'Period', type: 'segment',
          options: [{ id: 'q1', label: 'Q1' }, { id: 'q2', label: 'Q2' }, { id: 'ytd', label: 'YTD' }] },
        { id: 'campus', label: 'Campus', options: db.campuses.map(c => c.name) },
        { id: 'from',   label: 'From',   type: 'date' },
      ],
      onFilter: (id, value, all, table) => table.refresh(recompute(all)),
      summary: [
        { label: 'Billed',      value: formatCurrency(analytics.kpis.feeBilled, { compact: true }), icon: 'receipt', tone: 'info' },
        { label: 'Collected',   value: formatCurrency(analytics.kpis.feeCollected, { compact: true }), delta: 8.1, icon: 'wallet', tone: 'success' },
        { label: 'Outstanding', value: formatCurrency(analytics.kpis.feeOutstanding, { compact: true }), delta: -3.2, icon: 'alert-circle', tone: 'danger' },
        { label: 'Collection rate', value: `${analytics.kpis.collectionRate}%`, icon: 'percent', tone: 'brand' },
      ],
      chart: waterfallChart({
        items: [{ label: 'Opening', value: 12000000, type: 'start' },
                { label: 'Q1 collected', value: 41000000 },
                { label: 'Discounts', value: -3200000 },
                { label: 'Closing', value: 49800000, type: 'total' }],
        valueFormat: 'currencyCompact', height: 280 }),
      chartTitle: 'Collection movement',
      columns: [ /* … */ ],
      rows: db.students,
      tableTitle: 'Student-wise detail',
      footerAggregates: true,
      // exportActions defaults to Export CSV + Print + Schedule; pass false to hide
    }));
  },
},
```

### 4.7 The remaining builders

```js
settingsPage({ title, subtitle, route, saveLabel?, sidebarNav = true, onSave(values)?,
  groups: [{ id, title, description?, icon?, cols?, actions?: [Node],
             fields?: [{id,label,type,value,hint,options,span}],
             render?(values) → Node }] })

approvalQueuePage({ title, subtitle, route, kpis?, tabs?, filters?, onFilter?,
  columns, rows, onApprove(row)?, onReject(row)?, detail(row) → Node,
  bulkApprove = true })            // adds an Approve/Reject column + confirm dialogs

kanbanPage({ title, subtitle, route, kpis?, filters?, onFilter?, actions?,
  columns: [{id, title, color?, limit?}],
  cards:   [{id, columnId, title, meta?, badge?, tone?, avatar?}],
  onMove(cardId, toColumnId, card)?, onCardClick?, renderCard? })   // node.board

calendarPage({ title, subtitle, route, month, events, kpis?, actions?, sidebar?,
  view = 'month', legend?, onSelectDate?, onSelectEvent? })         // node.calendar

profileHeader({ name, subtitle, avatar?, initials?, meta?, badges?, actions?, size? })
```

---

## 5. `data/db.js` — the mock database

Deterministic (seeded `mulberry32`), so every reload shows the same data.
**Collections are lazy getters**: the first read generates and caches. Touching
`db.books` costs ~150 ms once, then it is free. The shell warms the heavy
collections during idle time after boot, so in practice they are already there.

```js
import { db, analytics, query, byId, where, search, sortBy, paginate,
         groupBy, sum, avg, count, distinct, countBy, sumBy, minOf, maxOf,
         student360, subjectsForLevel, gradeFor, PERMISSION_MODULES } from '../data/db.js';
```

### 5.1 Collections

| Collection | Count | Key fields |
|---|---|---|
| `campuses` | 5 | `id, name, city, state, code, board, address, pincode, phone, email, principal, studentCapacity, established, active` |
| `academicYears` | 5 | `id, name, startDate, endDate, status, current` |
| `boards` | 4 | `id, code, name, affiliation, gradingSystem` |
| `classes` | 74 | `id, campusId, code, name, level, stage, sectionCount, academicYearId` |
| `sections` | ~300 | `id, classId, campusId, name, label, capacity, stream, roomNo, classTeacherId` |
| `subjects` | 24 | `id, code, name, type, hasPractical, maxMarks, passMarks` |
| `subjectGroups` | 7 | `id, name, levels[], subjects[]` |
| `houses` | 4 | `id, name, colour, motto, points` |
| `departments` | 15 | `id, name, campusId, staffCount` |
| `designations` | 27 | `id, name, department, band, minSalary, maxSalary` |
| `students` | **2,400** | see below |
| `parents` | ~2,700 | `id, name, relation, gender, studentIds[], campusId, occupation, organisation, qualification, annualIncome, phone, altPhone, email, address, aadhaarMasked, panMasked, portalActive, lastLogin, feedbackCount, avatarInitials` |
| `staff` | **380** | see below |
| `enquiries` | 600 | `id, enquiryNo, studentName, gender, dob, classCode, className, classLevel, campusId, parentName, relation, phone, email, city, source, stage, status, priority, assignedTo(+Name), followUps, nextFollowUp, lastContact, previousSchool, remarks, createdAt, lostReason` |
| `applications` | ~325 | `id, applicationNo, enquiryId, studentName, classLevel, campusId, submittedOn, mode, documentsSubmitted/Required/Status, entranceTestDate, entranceScore, entranceResult, interviewDate, interviewScore, interviewer, meritRank, status, offerDate, admissionFeePaid, admissionFeeAmount, waitlisted` |
| `followUps` | ~1,800 | `id, enquiryId, studentName, date, mode, outcome, by, notes, nextDate` |
| `periods` | 10 | `id, no, label, startTime, endTime, isBreak, duration` |
| `timetableSlots` | ~12,000 | `id, campusId, classId, className, sectionId, section, day, periodNo, startTime, endTime, subjectCode, subjectName, teacherId, teacherName, room, academicYearId, isSubstituted` |
| `substitutions` | ~180 | `id, date, slotId, className, section, periodNo, subjectName, absentTeacher(Id/Name), substituteTeacher(Id/Name), reason, status, campusId` |
| `attendance` | ~7,400 | daily per-section summary: `id, date, campusId, classId, sectionId, strength, present, absent, late, leave, percent, markedBy, markedAt, status` |
| `studentLeaveRequests` | ~230 | `id, studentId, studentName, className, section, campusId, fromDate, toDate, days, type, reason, appliedBy, appliedOn, status, approvedBy, attachment` |
| `lateRecords` | ~150 | `id, studentId, studentName, date, inTime, minutesLate, type, reason, actionTaken` |
| `biometricDevices` | 25 | `id, name, campusId, location, type, serial, ip, status, lastSync, punchesToday, firmware` |
| `examGroups` | 6 | `id, name, term, weightage, academicYearId, from, to, status` |
| `exams` | ~1,000 | `id, examGroupId(+Name), classId, className, classLevel, campusId, subjectCode, subjectName, date, startTime, endTime, maxMarks, passMarks, room, invigilatorId(+Name), status` |
| `marks` | ~11,400 | `id, studentId, studentName, admissionNo, classId, className, sectionId, section, campusId, examGroupId, subjectCode, subjectName, maxMarks, marksObtained, percent, grade, status, remarks` |
| `gradeScales` | 3 | `id, name, bands:[{grade, from, to, point}]` |
| `questionBank` | 720 | `id, subjectCode, subjectName, classLevel, type, difficulty, marks, topic, bloomLevel, text, usedCount, status` |
| `feeHeads` | 14 | `id, name, type, frequency, refundable, taxable, ledger` |
| `feeStructures` | 75 | `id, name, campusId, classCode, className, classLevel, academicYearId, components:[{headId,name,amount,frequency}], total, installments, dueDay, lateFeePerDay, status` |
| `invoices` | ~5,200 | `id, invoiceNo, studentId, studentName, admissionNo, className, section, campusId, academicYearId, quarter, period, issueDate, dueDate, amount, discount, lateFee, paid, balance, status, overdueDays` |
| `payments` | ~5,200 | `id, receiptNo, invoiceId, studentId, studentName, campusId, date, month, amount, mode, reference, bank, collectedBy(+Name), status, gatewayFee` |
| `discounts` | 8 | `id, name, type, value, appliesTo, autoApply, students, active` |
| `refunds` | 40 | `id, studentId, studentName, amount, reason, requestDate, status, mode` |
| `accounts` | 27 | `id, code, name, type, parent, group, balance` |
| `bankAccounts` | 4 | `id, name, bank, branch, accountMasked, ifsc, type, balance, campusId, primary` |
| `vendors` | 20 | `id, name, category, contactPerson, phone, email, gstin, address, paymentTerms, rating, totalOrders, totalValue, outstanding, status, onboardedOn` |
| `expenses` | 620 | `id, voucherNo, date, month, category, accountId, campusId, vendorId, description, amount, paymentMode, status, gst, attachment` |
| `vouchers` | 260 | `id, voucherNo, type, date, debitAccount, creditAccount, amount, narration, campusId, status` |
| `purchaseOrders` | 180 | `id, poNumber, vendorId(+Name), campusId, date, expectedDate, items, quantity, rate, subtotal, gst, total, status, grnReceived, department` |
| `budgets` | 10 | `id, head, academicYearId, allocated, spent, committed, remaining, utilisation, status, owner` |
| `authors` / `publishers` | 180 / 16 | `id, name, …` |
| `books` | **12,000** | `id, accessionNo, isbn, title, author(+Id), publisher(+Id), category, subCategory, language, edition, year, pages, price, rackNo, campusId, totalCopies, issuedCopies, availableCopies, status, condition, addedOn, timesIssued, digital` |
| `bookIssues` | ~1,400 | `id, bookId, bookTitle, accessionNo, memberId, memberType, memberName, studentId, className, campusId, issueDate, dueDate, returnDate, status, renewals, fine, finePaid` |
| `libraryMembers` | ~1,600 | `id, memberType, name, refId, className, campusId, joinDate, maxBooks, currentIssued, totalIssued, fineOutstanding, status` |
| `vehicles` | 42 | `id, regNo, model, type, capacity, onboard, utilisation, campusId, routeId, driverId, conductorId, gpsDeviceId, fuelType, mileage, odometer, insuranceExpiry, pucExpiry, fitnessExpiry, permitExpiry, lastService, nextService, status, speed, lastPing, gpsLat, gpsLng` |
| `drivers` | 84 | `id, name, role('Driver'\|'Conductor'), campusId, vehicleId, licenceNo, licenceExpiry, badgeNo, phone, experienceYears, bloodGroup, address, joiningDate, policeVerified, medicalCheckDate, rating, incidents, status` |
| `routes` | 28 | `id, code, name, campusId, vehicleId, distanceKm, durationMin, stopCount, studentCount, capacity, pickupStart, dropStart, fare, monthlyRevenue, status, shift` |
| `stops` | ~300 | `id, routeId, routeName, campusId, seq, name, pickupTime, dropTime, studentCount, landmark, lat, lng` |
| `busAttendance` | ~340 | `id, date, routeId, routeName, vehicleId, trip, expected, boarded, absent, percent, markedBy, delayMin` |
| `fuelLogs` | 336 | `id, vehicleId, regNo, date, litres, rate, amount, odometer, station, filledBy, mileage` |
| `maintenanceLogs` | 126 | `id, vehicleId, regNo, date, type, garage, cost, downtimeDays, odometer, status, remarks` |
| `hostels` | 4 | `id, name, type, campusId, floors, rooms, capacity, occupied, mess, established` |
| `hostelRooms` | 192 | `id, hostelId, hostelName, campusId, roomNo, floor, type, beds, occupied, vacant, ac, attachedBath, status, condition, monthlyFee` |
| `hostelAllocations` | ~190 | `id, studentId, studentName, className, campusId, hostelId, roomId, roomNo, bedNo, allocatedOn, vacatedOn, status, monthlyFee, messPlan, localGuardian(+Phone)` |
| `messMenu` | 7 | `id, day, breakfast, lunch, snacks, dinner, special, calories` |
| `itemCategories` | 10 | `id, name, items, value` |
| `inventoryItems` | ~55 | `id, code, name, categoryId, category, unit, stock, reorderLevel, unitPrice, value, campusId, store, vendorId, status, lastPurchase, consumable` |
| `stockMovements` | ~220 | `id, itemId, itemName, category, campusId, date, type, quantity, issuedTo, reference, remarks` |
| `assets` | 420 | `id, tag, name, category, campusId, location, assignedTo, purchaseDate, purchaseCost, vendorId, warrantyExpiry, depreciationRate, ageYears, currentValue, condition, status, lastAudit, amc` |
| `courses` | ~130 | `id, title, subjectCode, classId, className, campusId, teacherId(+Name), chapters, lessons, resources, durationHours, enrolled, completionPct, rating, status, updatedAt` |
| `lessons` | ~1,900 | `id, courseId, courseTitle, chapter, title, type, durationMin, sizeMb, views, uploadedBy, uploadedOn, status` |
| `homework` | 480 | `id, title, subjectCode, subjectName, classId, className, sectionId, section, teacherId, assignedDate, dueDate, totalStudents, submitted, pending, graded, maxMarks, avgScore, status, attachments, description` |
| `submissions` | ~2,200 | `id, homeworkId, homeworkTitle, studentId, studentName, submittedOn, status, marks, maxMarks, late, feedback, attachment` |
| `onlineClasses` | 120 | `id, title, courseId, className, subjectName, teacherId(+Name), date, startTime, durationMin, platform, joinLink, enrolled, attended, recordingAvailable, status` |
| `onlineTests` | 90 | `id, title, courseId, className, questions, totalMarks, durationMin, scheduledOn, attempted, totalStudents, avgScore, passPct, negativeMarking, status, createdBy` |
| `doubts` | 140 | `id, studentId, studentName, subject, question, askedOn, answeredBy, status, upvotes, replies` |
| `messages` | 420 | `id, subject, body, channel, audience, recipients, delivered, failed, opened, sentOn, status, campusId, cost` |
| `circulars` | 86 | `id, circularNo, title, category, audience, issuedBy, issuedOn, validTill, attachment, views, acknowledged, priority, status, campusId` |
| `notices` | 30 | `id, title, body, postedOn, expiresOn, audience, pinned, campusId, postedBy, category` |
| `templates` | 8 | `id, name, channel, body, variables[], usage, approved, dltId` |
| `ptmSchedules` | 5 | `id, title, date, from, to, classes, campusId, slotMinutes, teachers, booked, capacity, status` |
| `ptmSlots` | ~2,300 | `id, ptmId, date, teacherId(+Name), room, startTime, endTime, status, campusId` |
| `ptmBookings` | ~1,600 | `id, slotId, ptmId, studentId, studentName, parentName, parentPhone, teacherId(+Name), date, time, status, notes, rating` |
| `clubs` / `sportsTeams` | 10 / 8 | `id, name, category/sport, inCharge/coach, members/players, meetingDay/practiceDays, room/venue, campusId` |
| `competitions` | 14 | `id, name, type, category, date, venue, campusId, participants, houses, winnerHouse, budget, status` |
| `awards` | 260 | `id, studentId, studentName, className, house, title, category, level, date, awardedBy, certificateNo, points` |
| `healthRecords` | 900 | `id, studentId, studentName, bloodGroup, heightCm, weightKg, bmi, vision, dental, allergies, chronicConditions, lastCheckup, nextCheckup, vaccinations[], emergencyContact, familyDoctor, insurancePolicy, status` |
| `infirmaryVisits` | 380 | `id, studentId, studentName, date, time, complaint, diagnosis, treatment, medicineGiven, attendedBy(+Name), parentInformed, sentHome, followUp, durationMin` |
| `visitors` | 460 | `id, passNo, name, phone, campusId, purpose, whomToMeet, relatedStudent, date, inTime, outTime, idProof, idNumberMasked, badgeNo, photoTaken, vehicleNo, status` |
| `gatePasses` | 240 | `id, passNo, type, personId, personName, className, campusId, date, outTime, expectedReturn, reason, authorisedBy, pickedUpBy, status, securityVerified` |
| `incidents` | 96 | `id, reference, date, time, campusId, type, severity, location, reportedBy, description, actionTaken, status, followUpDate` |
| `callLogs` | 320 | `id, date, time, direction, callerName, phone, campusId, purpose, durationMin, followUpRequired, notes` |
| `couriers` | 180 | `id, refNo, direction, date, courierCompany, awbNo, sender, recipient, contents, campusId, status` |
| `lostFound` | 68 | `id, item, type, date, location, campusId, reportedBy, description, status` |
| `complaints` | 240 | `id, ticketNo, subject, category, description, raisedBy(+Name), campusId, priority, status, assignedTo(+Name), department, createdAt, slaHours, ageHours, slaBreached, resolvedAt, resolutionNote, satisfaction, comments` |
| `complaintCategories` | 10 | `id, name, owner, slaHours, open, resolved, escalations` |
| `events` | 18 | `id, title, category, date, startTime, endTime, venue, campusId, organiser, audience, expectedAttendance, registered, attended, budget, spent, chiefGuest, status, photos, description` |
| `holidays` | 13 | `id, name, date, type, days, campusId` |
| `alumni` | **1,100** | `id, name, gender, batch, batchLabel, campusId, stream, admissionNo, university, degree, currentCompany, designation, city, email, phone, linkedin, mentorAvailable, donationTotal, eventsAttended, verified, story, lastContact` |
| `leaveTypes` | 8 | `id, name, code, annualQuota, carryForward, encashable, paid, applicableTo` |
| `leaveRequests` | ~600 | `id, employeeId, employeeName, designation, department, campusId, leaveTypeId, leaveType, fromDate, toDate, days, reason, appliedOn, status, approver(Id/Name), substituteArranged, attachment` |
| `staffAttendance` | ~4,600 | `id, employeeId, employeeName, department, designation, campusId, date, status, inTime, outTime, workedHours, lateBy, source` |
| `payrollRuns` | 5 | `id, month, employees, grossTotal, deductionsTotal, netTotal, pf, esi, tds, status, processedOn, processedBy, bankFileGenerated` |
| `payslips` | ~1,520 | `id, payrollRunId, month, employeeId, employeeName, basic, hra, da, conveyance, gross, pf, tds, lopDays, lopAmount, otherDeductions, net, paidOn, mode, status` |
| `recruitments` | 14 | `id, position, department, campusId, openings, applicants, shortlisted, interviewed, offered, joined, postedOn, closingDate, experienceRequired, salaryRange, status, priority` |
| `applicants` | 196 | `id, name, recruitmentId, position, email, phone, experienceYears, qualification, currentEmployer, expectedCtc, appliedOn, source, stage, rating, resume, notes` |
| `trainings` | 10 | `id, name, type, trainer, date, durationHours, seats, enrolled, completed, campusId, mandatory, cost, feedbackScore, status` |
| `resignations` | ~10 | `id, employeeId, employeeName, appliedOn, noticePeriodDays, lastWorkingDay, reason, status, exitInterview, clearance*, fnfAmount, fnfStatus` |
| `roles` | 20 | `id, name, users, description, system` |
| `users` | 240 | `id, username, name, email, role, roleName, employeeId, campusId, status, twoFactor, lastLogin, createdAt, loginCount` |
| `auditLogs` | 500 | `id, timestamp, userId, userName, role, action, module, entity, entityId, description, ip, device, campusId, severity` |
| `loginHistory` | 320 | `id, userId, userName, role, timestamp, ip, location, device, result, reason, sessionMinutes` |
| `notifications` | 8 | `id, title, text, tone, icon, time, unread, route` |
| `settings` | object | `school, session, fee, email, sms, whatsapp, payment, biometric, rfid, security, backup` |

**`students[i]`** — `id, admissionNo, rollNo, name, firstName, lastName, gender,
dob, age, bloodGroup, religion, category, nationality, motherTongue, campusId,
classId, className, classLevel, sectionId, section, stream, house, houseId,
academicYearId, admissionDate, admissionType, status, avatarInitials, email,
phone, address{line1,line2,city,state,pincode,country}, fatherId, motherId,
fatherName, motherName, guardianName, guardianRelation, emergencyContact,
siblingIds[], attendancePct, presentDays, totalDays, cgpa, lastExamPercent,
rank, feeTotal, feePaid, feeDue, feeStatus, transportOpted, routeId, stopId,
hostelOpted, hostelId, roomNo, libraryCardNo, booksIssued, medicalConditions,
behaviourScore, disciplinaryCount, awardsCount, activities[], rte, scholarship,
createdAt`

**`staff[i]`** — `id, employeeCode, name, firstName, lastName, gender, dob,
bloodGroup, maritalStatus, campusId, department, departmentId, designation,
band, type('Teaching'|'Non-Teaching'), employmentType, status, joiningDate,
experienceYears, qualification, subjects[], classesAssigned[], isClassTeacher,
classTeacherOf, weeklyPeriods, email, phone, address, avatarInitials,
salaryBasic, salaryHra, salaryDa, salaryConveyance, salaryGross, deductionPf,
deductionTds, salaryNet, bankName, accountMasked, ifsc, uan, pan, attendancePct,
leaveBalanceCL/SL/EL, leaveTakenYtd, appraisalRating, appraisalScore,
trainingsCompleted, documentsComplete, createdAt`

### 5.2 Query helpers

```js
byId(collection, id, key = 'id')            // → record | null
where(collection, predicateObjOrFn)         // ignores '', null, undefined, 'all'
search(collection, term, keys?)             // case-insensitive
sortBy(collection, keyOrFn, dir = 'asc')    // returns a copy
paginate(collection, page = 1, pageSize=25) // → {rows, page, pageSize, total, pages}
groupBy(collection, keyOrFn)                // → Map
sum(c, key) · avg(c, key) · count(c, pred) · distinct(c, key) · minOf · maxOf
countBy(collection, key)                    // → [{key, value}] desc
sumBy(collection, key, valueKey)            // → [{key, value}] desc
subjectsForLevel(level, stream?)            // → subject codes
gradeFor(percent)                           // → 'A1'…'E'
student360(studentId)                       // composite record, memoised
```

`student360(id)` returns `{ student, documents[], academicHistory[],
subjectScores[], timeline[], guardians[], siblings[], invoices[], payments[],
bookIssues[], healthRecord, awards[] }`.

`query` bundles all of the above: `query.where(...)`, `query.paginate(...)`, …

### 5.3 Pre-computed analytics

`import { analytics } from '../data/db.js'` — every entry is lazy and cached.

| Key | Shape |
|---|---|
| `feeCollectionVsTarget` | `[{month, target, collected, achieved}]` (Apr→Mar) |
| `attendanceTrend` | `[{month, students, staff, target}]` |
| `attendanceByClass` | `[{className, level, percent, strength}]` |
| `attendanceCalendar` | `[{date, value}]` — feed straight into `heatmap({mode:'calendar'})` |
| `attendanceDefaulters` | `[{id,name,className,section,percent,present,total}]` |
| `admissionFunnel` | `[{stage, count, conversion, dropOff}]` |
| `admissionSourceSplit` · `admissionsByClass` · `admissionTrend` | `[{key,value}]` · `[{className,applications,seats,admitted}]` · `[{month,enquiries,applications,admitted}]` |
| `classPerformance` | `[{className, level, average, passPercent, distinctions, strength}]` |
| `subjectPerformance` | `[{subject, average, highest, lowest, passPercent}]` |
| `performanceMatrix` | `{rows[], cols[], values[][]}` — for `heatmap({mode:'matrix'})` |
| `revenueVsExpense` | `[{month, revenue, expense, surplus}]` |
| `expenseByCategory` · `feeHeadSplit` · `feeModeSplit` | `[{key, value}]` |
| `staffAttendance` · `staffSplit` | `[{month, present, leave, absent}]` · `[{key,value}]` |
| `transportUtilisation` | `[{route, routeName, capacity, used, utilisation, onTime}]` |
| `hostelOccupancy` | `[{hostel, capacity, occupied, vacant, occupancy}]` |
| `libraryCirculation` · `libraryCategorySplit` | `[{month, issued, returned, overdue}]` · `[{key,value}]` |
| `genderSplit` · `categorySplit` · `houseSplit` · `religionSplit` | `[{key, value}]` |
| `enrolmentByClass` · `enrolmentByCampus` · `enrolmentTrend` | `[{className,level,value}]` · `[{key,value,capacity}]` · `[{year,students,staff}]` |
| `topPerformers` | `[{rank,id,name,className,section,house,percent,cgpa,avatarInitials}]` |
| `defaulters` | `[{id,name,admissionNo,className,due,total,paid,phone,overdueDays}]` |
| `complaintTrend` · `inventoryValueByCategory` · `budgetUtilisation` | see source shapes above |
| `kpis` | `{totalStudents, activeStudents, totalStaff, teachingStaff, campuses, studentTeacherRatio, avgAttendance, avgStaffAttendance, feeCollected, feeBilled, feeOutstanding, collectionRate, defaulterCount, admissionEnquiries, admissionsConfirmed, conversionRate, booksTotal, booksIssued, vehicles, routes, transportStudents, hostelStudents, hostelOccupancy, openComplaints, slaBreaches, pendingLeaves, upcomingEvents, alumni, payrollMonthly}` |
| `sparks` | 12-point number arrays for stat tiles: `students, attendance, collection, outstanding, admissions, complaints, staffAttendance, library, transport, hostel, revenue, expense` |

---

## 6. The page-module contract

Create **one file per section**, export a `routes` object, and hand the file to
the integration team.

```js
// assets/js/pages/students.js
import { listPage, detailPage } from '../core/page-kit.js';
import { db, student360 } from '../data/db.js';

export const routes = {
  'students/all': {
    title: 'All Students',                    // browser tab + page header default
    subtitle: 'Every enrolled student…',      // optional
    section: 'students',                      // MUST match the nav section id
    render(mount, ctx) {
      // ctx = { route, path, params, param, query, def, title, section, state, db }
      mount.appendChild(listPage({ /* … */ }));
    },
  },

  'students/profile': {
    title: 'Student 360 Profile',
    section: 'students',
    render(mount, ctx) {
      const id = ctx.param;                   // '#/students/profile/STU00042' → 'STU00042'
      mount.appendChild(detailPage({ /* … */ }));
    },
  },
};
```

**Rules**

1. **Route keys must exactly match the `route` values in `core/nav.js`.**
   Verify with `allRoutes()` / `routeMeta('students/all')`. A key that is not in
   nav.js is unreachable; a nav route with no key renders the “coming up” placeholder.
2. `render(mount, ctx)` gets an **empty** `mount` element. Append to it; do not
   replace it and do not touch anything outside it.
3. `render` is called fresh on every navigation — keep all state local to the call.
4. Deep links: a key `students/profile` also serves `students/profile/STU00042`;
   the trailing segments arrive as `ctx.params[]` (`ctx.param` = the first one).
   Query strings arrive parsed in `ctx.query`.
5. `ctx.state` is a snapshot of the store — read `campusId`, `academicYearId`,
   `role`, `currentUser`, `density`, `theme`. Scope your data to
   `ctx.state.campusId` wherever a campus filter makes sense.
6. Do not call `location.hash = …` during `render`. Navigate from event handlers
   (`navigate('students/all')` or `Button(..., { route })`).
7. The shell already renders a ~180 ms skeleton before your `render` runs, and
   catches thrown errors — but throwing still costs the user a page, so guard
   missing records with `missingRecord()`.

### 6.1 Section ids (these are the work packages)

`dashboard · admissions · students · parents · teachers · hr · academics ·
timetable · attendance · examination · fees · finance · library · transport ·
hostel · inventory · lms · communication · ptm · activities · health ·
frontoffice · security · complaints · events · alumni · reports · portals ·
system`

Useful nav helpers:

```js
import { NAV, navForRole, allRoutes, routeMeta, findRoute, breadcrumbFor,
         sectionFor, routesForRole, sectionSummary, QUICK_ACTIONS,
         quickActionsFor } from '../core/nav.js';

allRoutes()                    // every leaf route string (403 of them)
routeMeta('fees/collection')   // {id,label,icon,route,roles,sectionId,sectionLabel,parentLabel,…}
breadcrumbFor('fees/collection', 'Receipt #123')   // [{label,route,icon}, …]
navForRole('teacher')          // the filtered nav tree
```

### 6.2 Roles & permissions

```js
import * as store from '../core/state.js';

store.get('role')                 // 'principal'
store.get('campusId')             // 'C1'
store.isRole('principal', 'vice-principal')
store.can('fees.collect')         // wildcards: 'fees.*' grants everything under fees
store.ROLES                       // [{id,name,group,icon,dashboard}] — all 19 + employee
store.subscribeKey('campusId', v => rerender())
```

Roles: `super-admin, management, principal, vice-principal, administrator,
admission-officer, accountant, hr-manager, hr-executive, teacher, class-teacher,
librarian, transport-manager, hostel-warden, nurse, security, front-office,
student, parent, employee`.

Hide actions the current role cannot perform — do not disable them silently.

---

## 7. CSS: classes and tokens

### 7.1 The rule

> **Never hardcode a colour, radius, shadow, font size or spacing value.**
> Always use a token. This is what makes dark mode and the density toggle work.
> `color: #6041e0` is a bug; `color: var(--brand-600)` is correct.

### 7.2 Tokens (`assets/css/tokens.css`)

| Group | Variables |
|---|---|
| Brand | `--brand-25 … --brand-950` |
| Neutrals | `--slate-25 … --slate-950` (12 steps) |
| Semantic ramps | `--success-50/100/500/600/700`, `--warning-*`, `--danger-*`, `--info-*`, `--purple-*`, `--teal-*` |
| Surfaces | `--canvas`, `--surface`, `--surface-raised`, `--surface-sunken`, `--surface-overlay`, `--surface-inverse`, `--surface-hover`, `--surface-active`, `--surface-selected`, `--surface-accent`, `--scrim` |
| Text | `--text`, `--text-secondary`, `--text-muted`, `--text-faint`, `--text-inverse`, `--text-brand`, `--text-link`, `--text-success/warning/danger/info` |
| Borders | `--border`, `--border-strong`, `--border-subtle`, `--border-brand`, `--border-focus`, `--ring`, `--ring-danger` |
| Radii | `--r-xs 4 · --r-sm 6 · --r-md 8 · --r-lg 12 · --r-xl 16 · --r-2xl 22 · --r-full` |
| Shadows | `--shadow-xs/sm/md/lg/xl`, `--shadow-inset` |
| Spacing | `--sp-1 4 … --sp-10 64` |
| Type | `--font-sans`, `--font-mono`, `--fs-2xs … --fs-hero`, `--lh-*`, `--fw-regular/medium/semibold/bold` |
| Layout | `--sidebar-w`, `--sidebar-rail-w`, `--topbar-h`, `--crumbbar-h`, `--page-max`, `--z-*` |
| Density (auto) | `--row-h`, `--cell-pad-x/y`, `--control-h`, `--card-pad`, `--nav-item-h`, `--stack-gap` |
| Motion | `--dur-fast 120ms`, `--dur-base 160ms`, `--dur-slow 200ms`, `--ease`, `--ease-out` |
| Charts | see §3.1 |

Dark mode redefines every one of these under `:root[data-theme="dark"]`; compact
density redefines the density group under `:root[data-density="compact"]`.

### 7.3 Utility classes (`base.css`)

*Layout* `stack stack-1 stack-2 stack-3 stack-4 stack-6 · row row-3 row-4 row-top
row-wrap · spacer · grid grid-2 grid-3 grid-4 grid-auto · flex-1 w-full h-full
min-0 hidden relative scroll-y scroll-x · widget-grid + span-1…span-12 ·
detail-split · form-split · divider divider-v`

*Spacing* `mt-1 mt-2 mt-3 mt-4 mt-6 · mb-* · p-0 p-2 p-3 p-4 p-6`

*Text* `t-hero t-display t-title t-subtitle t-body t-sm t-xs t-md t-lg · t-mono
t-num t-prop · t-muted t-secondary t-faint t-brand t-success t-warning t-danger
t-info · t-medium t-semibold t-bold t-upper t-eyebrow · t-center t-right t-left
t-nowrap t-truncate t-clamp-2 t-clamp-3`

*Misc* `card card-pad card-flat card-raised card-accent card-interactive ·
panel · callout · sr-only · anim-fade anim-rise anim-pop · no-print`

Use `t-num` (tabular numerals) in table cells and axis labels; use the default
proportional figures for large standalone numbers.

### 7.4 Component classes

Only needed for custom markup — the kit applies them for you:
`card-head card-title card-sub card-body card-foot · stat stat-value stat-delta ·
badge pill tag · avatar avatar-stack identity · btn btn-primary btn-secondary
btn-ghost btn-subtle btn-danger btn-success btn-link icon-btn btn-group kbd ·
tabs tab segmented · toolbar search-input filterbar · field field-label
field-hint field-error input select textarea check radio-opt switch upload
form-section form-grid form-actions · dt dt-table dt-foot pager bulkbar ·
menu menu-item menu-sep popover · modal drawer toast-stack toast · empty
skeleton progress stacked-bar rating · timeline feed comment · dl · accordion ·
stepper · kanban · cal · photo-grid file-list · mapbox · chat · noti · palette ·
chart chart-card ch-legend ch-tip`

---

## 8. House style

**Density & rhythm.** One `page` per route. Vertical rhythm comes from `.stack`
(`--stack-gap`); never hand-roll margins between cards. Cards carry
`--card-pad`. Respect the density toggle — no fixed `px` paddings on rows.

**Heading hierarchy.** Page title = `page-title` (only one per screen, set via
the builder). Card titles = `card-title` / `<h3>`. Group labels inside a card =
`t-eyebrow`. Never use a display or serif face; there is only the system sans.

**Drawer vs modal vs page.**

| Use | When |
|---|---|
| **Toast** | confirmation of something that already happened |
| **Modal** | a short decision or ≤ 6 fields; destructive confirmations (`ConfirmDialog`) |
| **Drawer** | inspect or edit a record without losing list context (quick view, filters, detail preview) |
| **Page** | full create/edit flows, anything with more than one section, anything deep-linkable |

Never nest a modal inside a modal. A drawer may open a confirm dialog.

**Empty states.** Every list, tab and widget needs one — icon + title + one
sentence + the action that fixes it. Distinguish “no data yet” from “no results
for this filter” (the `DataTable` does this automatically). Never ship a blank card.

**Loading.** Use `Skeleton` / `SkeletonTable`, never a spinner on first paint.
On refetch, keep the previous render at reduced opacity — no layout jump.

**Status → tone mapping** (`toneForStatus`, applied automatically by `Badge`):

| Tone | Meaning | Examples |
|---|---|---|
| `success` | done, healthy, paid | Active, Paid, Approved, Present, Completed, Verified, Resolved, In Stock |
| `warning` | in progress, needs attention | Pending, Partial, In Progress, Under Review, On Leave, Low Stock, Scheduled |
| `danger` | failed, blocked, breached | Overdue, Rejected, Absent, Cancelled, Expired, Suspended, Out of Stock |
| `info` | neutral in-flight state | New, Issued, Assigned, Contacted, Offered, Upcoming |
| `neutral` | no state | anything unmapped |

Status colour never carries meaning alone — always ship the label (and an icon
where space allows).

**Numbers.** Money always through `formatCurrency` (compact for KPIs and axes,
full for table cells). Counts through `formatNumber` (Indian grouping). Dates
through `formatDate` — never `toLocaleDateString`. Right-align numeric columns
and set `numeric: true`.

**Actions.** One primary button per screen, top-right. Secondary actions beside
it; everything else in a `MenuButton`. Destructive actions are `danger` variant
**and** go through `ConfirmDialog`. Wire unimplemented buttons to
`mockAction('Label')` so nothing feels broken.

**Charts.** Read §3 before writing chart code. Wrap every chart in a
`SectionCard({ className: 'chart-card' })` with a title that says what is
plotted. Keep the table-view toggle. Put filters in **one row above** the
charts they scope — never inside a chart card.

**Accessibility.** Icon-only buttons need `label`. Do not rely on colour alone.
Keep focus order natural; the kit already styles `:focus-visible`.

---

## 9. Quick sanity checklist before you hand a module over

- [ ] Every route key exists in `allRoutes()` and every nav route in your section has a key.
- [ ] Page renders for **all** roles listed on the nav item (test with the role switcher).
- [ ] Light **and** dark mode checked; compact density checked.
- [ ] Resized to 1024 px and 768 px — no horizontal page scroll, tables fall back to cards.
- [ ] No hardcoded colours; `grep -n "#[0-9a-f]\{3,6\}" your-file.js` returns nothing.
- [ ] Empty state, loading state and a bad-id detail route all behave.
- [ ] `node --check assets/js/pages/<your-file>.js` passes.
- [ ] No console errors on navigation in or out of every route you own.
