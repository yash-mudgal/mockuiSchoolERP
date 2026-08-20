/* ==========================================================================
   pages/operations.js — Library · Transport · Hostel · Inventory & Assets ·
   Health & Wellness

   74 routes across five operational modules. Everything is composed from
   core/page-kit.js + core/ui.js + core/charts.js and reads core/data/db.js.
   No hardcoded colours, sizes or spacings — design tokens only.
   ========================================================================== */

import {
  h, frag, Icon, Card, SectionCard, StatCard, Badge, Button, IconButton, Identity,
  DataTable, Modal, Drawer, ConfirmDialog, notify, EmptyState, Timeline, ActivityFeed,
  DescriptionList, ProgressBar, StackedProgressBar as UIStackedBar, Avatar, AvatarStack,
  Tabs, SegmentedControl, FilterBar, SearchInput, MenuButton, Callout, FileList, RankList,
  MetricRow, Accordion, Stepper, ApprovalTrail, PhotoGrid, Rating, Skeleton, SkeletonText,
  validators, mockAction, formatCurrency, formatNumber, formatPercent, formatDate,
  formatDateTime, relativeTime, toneForStatus, initials, Input, Select, Textarea, Field,
  Checkbox, Switch, DatePicker, TimePicker, Combobox, MultiSelect, FormGrid, FormSection,
  FormActions, FileUpload, Divider, Pill, Tag, RadialProgress, MapPlaceholder, Calendar,
  KanbanBoard, copyToClipboard, printNode, download, toCsv, DEMO_NOW,
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

import {
  db, analytics, byId, where, search, sortBy, groupBy, sum, avg, countBy, sumBy,
} from '../data/db.js';

import { icon } from '../core/icons.js';
import { navigate } from '../core/router.js';
import * as store from '../core/state.js';

/* ==========================================================================
   0. Scoped stylesheet — tokens only, injected once
   ========================================================================== */

const OPS_CSS = `
.ops-tiles{display:grid;gap:var(--sp-4);grid-template-columns:repeat(auto-fill,minmax(190px,1fr));}
.ops-tiles-wide{grid-template-columns:repeat(auto-fill,minmax(260px,1fr));}
.ops-tile{border:1px solid var(--border);border-radius:var(--r-lg);background:var(--surface);
  overflow:hidden;display:flex;flex-direction:column;transition:box-shadow var(--dur-base) var(--ease),
  border-color var(--dur-base) var(--ease);}
.ops-tile:hover{box-shadow:var(--shadow-md);border-color:var(--border-strong);}
.ops-tile:focus-visible{outline:2px solid var(--border-focus);outline-offset:2px;}
.ops-tile-body{padding:var(--sp-3);display:flex;flex-direction:column;gap:var(--sp-1);flex:1;}
.ops-cover{position:relative;aspect-ratio:3/4;display:flex;flex-direction:column;justify-content:flex-end;
  padding:var(--sp-3);gap:var(--sp-1);color:var(--on-scrim);}
.ops-cover::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,
  rgba(0,0,0,0) 35%, rgba(0,0,0,0.42) 100%);pointer-events:none;}
.ops-cover-spine{position:absolute;inset-block:0;inset-inline-start:0;width:var(--sp-2);
  background:rgba(0,0,0,0.22);}
.ops-cover-title{position:relative;z-index:1;font-size:var(--fs-sm);font-weight:var(--fw-semibold);
  line-height:var(--lh-snug);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.ops-cover-author{position:relative;z-index:1;font-size:var(--fs-2xs);opacity:0.86;}
.ops-cover-badge{position:absolute;z-index:1;top:var(--sp-2);right:var(--sp-2);}
.ops-qr{display:grid;grid-template-columns:repeat(9,1fr);gap:1px;width:76px;height:76px;padding:var(--sp-1);
  background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);}
.ops-qr i{background:var(--text);border-radius:1px;}
.ops-qr i[data-off]{background:transparent;}
.ops-scan{display:flex;gap:var(--sp-3);align-items:center;padding:var(--sp-4);border:1px dashed var(--border-brand);
  border-radius:var(--r-lg);background:var(--surface-accent);}
.ops-scan-input{flex:1;min-width:0;}
.ops-scan-icon{display:flex;align-items:center;justify-content:center;width:44px;height:44px;flex:none;
  border-radius:var(--r-md);background:var(--brand-600);color:var(--on-brand);}
.ops-bed-grid{display:grid;gap:var(--sp-2);grid-template-columns:repeat(auto-fill,minmax(112px,1fr));}
.ops-room{border:1px solid var(--border);border-radius:var(--r-md);padding:var(--sp-2);background:var(--surface);
  display:flex;flex-direction:column;gap:var(--sp-1);cursor:pointer;text-align:left;font:inherit;color:inherit;}
.ops-room:hover{border-color:var(--border-brand);background:var(--surface-hover);}
.ops-room:focus-visible{outline:2px solid var(--border-focus);outline-offset:2px;}
.ops-beds{display:flex;gap:3px;flex-wrap:wrap;}
.ops-bed{width:16px;height:16px;border-radius:var(--r-xs);border:1px solid var(--border);}
.ops-bed[data-s="free"]{background:var(--surface-sunken);}
.ops-bed[data-s="taken"]{background:var(--chart-1);border-color:var(--chart-1);}
.ops-bed[data-s="repair"]{background:var(--chart-warning);border-color:var(--chart-warning);}
.ops-legend{display:flex;gap:var(--sp-4);flex-wrap:wrap;align-items:center;}
.ops-legend span{display:inline-flex;align-items:center;gap:var(--sp-2);font-size:var(--fs-xs);color:var(--text-secondary);}
.ops-swatch{width:12px;height:12px;border-radius:var(--r-xs);border:1px solid var(--border);display:inline-block;}
.ops-mess{width:100%;border-collapse:collapse;}
.ops-mess th,.ops-mess td{border:1px solid var(--border-subtle);padding:var(--cell-pad-y) var(--cell-pad-x);
  vertical-align:top;text-align:left;font-size:var(--fs-sm);}
.ops-mess thead th{background:var(--surface-sunken);font-size:var(--fs-xs);text-transform:uppercase;
  letter-spacing:0.06em;color:var(--text-muted);font-weight:var(--fw-semibold);white-space:nowrap;}
.ops-mess tbody th{background:var(--surface-sunken);font-weight:var(--fw-semibold);white-space:nowrap;}
.ops-track{display:grid;gap:var(--sp-4);grid-template-columns:minmax(0,2.1fr) minmax(280px,1fr);align-items:start;}
.ops-fleet{display:flex;flex-direction:column;gap:var(--sp-2);max-height:520px;overflow-y:auto;padding-right:var(--sp-1);}
.ops-fleet-item{display:flex;gap:var(--sp-3);align-items:center;width:100%;text-align:left;font:inherit;color:inherit;
  border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface);padding:var(--sp-2) var(--sp-3);cursor:pointer;}
.ops-fleet-item:hover{background:var(--surface-hover);}
.ops-fleet-item[aria-current="true"]{border-color:var(--border-brand);background:var(--surface-selected);}
.ops-fleet-item:focus-visible{outline:2px solid var(--border-focus);outline-offset:2px;}
.ops-dot{width:9px;height:9px;border-radius:var(--r-full);flex:none;}
.ops-stopline{position:relative;padding-inline-start:var(--sp-5);}
.ops-stopline::before{content:'';position:absolute;inset-block:6px;inset-inline-start:5px;width:2px;background:var(--border);}
.ops-stop{position:relative;padding-block:var(--sp-2);}
.ops-stop::before{content:'';position:absolute;inset-inline-start:calc(var(--sp-5) * -1 + 1px);top:calc(var(--sp-2) + 4px);
  width:10px;height:10px;border-radius:var(--r-full);background:var(--surface);border:2px solid var(--border-strong);}
.ops-stop[data-done="1"]::before{background:var(--chart-good);border-color:var(--chart-good);}
.ops-stop[data-now="1"]::before{background:var(--brand-600);border-color:var(--brand-600);
  box-shadow:0 0 0 4px var(--surface-accent);}
.ops-kv{display:grid;grid-template-columns:auto 1fr;gap:var(--sp-1) var(--sp-3);align-items:baseline;}
.ops-kv dt{font-size:var(--fs-xs);color:var(--text-muted);}
.ops-kv dd{font-size:var(--fs-sm);font-weight:var(--fw-medium);}
.ops-memcard{border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;background:var(--surface);}
.ops-memcard-top{padding:var(--sp-3);display:flex;gap:var(--sp-3);align-items:center;background:var(--surface-accent);
  border-bottom:1px solid var(--border-subtle);}
.ops-memcard-body{padding:var(--sp-3);display:flex;flex-direction:column;gap:var(--sp-2);}
.ops-heat-strip{display:flex;gap:2px;flex-wrap:wrap;}
.ops-heat-cell{width:14px;height:14px;border-radius:var(--r-xs);}
@media (max-width:1024px){.ops-track{grid-template-columns:minmax(0,1fr);}}
@media (max-width:768px){
  .ops-tiles{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));}
  .ops-mess{display:block;overflow-x:auto;}
}
`;

function ensureStyles() {
  if (document.getElementById('ops-module-styles')) return;
  const tag = document.createElement('style');
  tag.id = 'ops-module-styles';
  tag.textContent = OPS_CSS;
  document.head.appendChild(tag);
}

/* ==========================================================================
   1. Small deterministic helpers (no Math.random — reloads must be identical)
   ========================================================================== */

function hashOf(str) {
  let x = 2166136261;
  const s = String(str);
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
  return x >>> 0;
}
const pickOf = (arr, seed) => arr[hashOf(seed) % arr.length];
const intOf = (seed, min, max) => min + (hashOf(seed) % (max - min + 1));
const boolOf = (seed, pct = 50) => (hashOf(seed) % 100) < pct;

const TODAY = '2026-08-20';
const money = (n) => formatCurrency(Number(n) || 0);
const moneyC = (n) => formatCurrency(Number(n) || 0, { compact: true });
const num = (n) => formatNumber(Number(n) || 0);
const dt = (d) => (d ? formatDate(d, 'medium') : '—');

/** 'HH:MM' out of an ISO-ish timestamp, without throwing on junk. */
function pingTime(value) {
  const s = String(value || '');
  const t = s.includes('T') ? s.split('T')[1] : s;
  return t && t.length >= 5 ? t.slice(0, 5) : '—';
}

/** Days between an ISO date and the demo clock (negative = in the past). */
function daysFromToday(isoDate) {
  if (!isoDate) return null;
  return Math.round((new Date(isoDate) - new Date(TODAY)) / 86400000);
}

/** Expiry chip: red when lapsed, amber inside 45 days, green otherwise. */
function expiryChip(isoDate, label) {
  if (!isoDate) return Badge('Not on file', { tone: 'neutral' });
  const d = daysFromToday(isoDate);
  if (d < 0) return Badge(`${label} expired`, { tone: 'danger', icon: 'alert-triangle' });
  if (d <= 45) return Badge(`${label} in ${d}d`, { tone: 'warning', icon: 'clock' });
  return Badge(`${label} ${formatDate(isoDate, 'dayMonth')}`, { tone: 'success', icon: 'check-circle' });
}

/** Campus scoping that never blanks a screen: falls back to the full set. */
function scope(rows, ctx) {
  const cid = ctx && ctx.state && ctx.state.campusId;
  if (!cid || cid === 'all') return rows;
  const out = rows.filter((r) => !r.campusId || r.campusId === cid);
  return out.length ? out : rows;
}

const campusName = (id) => (byId(db.campuses, id) || {}).name || '—';
const campusOptions = () => db.campuses.map((c) => ({ value: c.id, label: c.name }));

/** Generic FilterBar → predicate map applier. */
function applyAll(rows, all, map) {
  const active = Object.entries(all || {}).filter(([, v]) => v != null && v !== '' && v !== 'all');
  if (!active.length) return rows;
  return rows.filter((r) => active.every(([k, v]) => (map[k] ? map[k](r, v) : true)));
}

/** A tiny deterministic QR/barcode placeholder built from the record id. */
function qrTile(code) {
  const cells = [];
  for (let i = 0; i < 81; i++) {
    const on = (hashOf(code + ':' + i) % 100) < 46
      || (i < 3 || (i % 9) < 3) && i < 30 && (i % 9) !== 2;
    cells.push(h('i', on ? null : { dataset: { off: '1' } }));
  }
  return h('div', { className: 'ops-qr', attrs: { role: 'img', 'aria-label': `QR code for ${code}` } }, cells);
}

/** Book cover placeholder — colour is stable per category. */
function coverTile(book) {
  const idx = hashOf(book.category) % 8;
  return h('div', { className: 'ops-cover', style: { background: seriesColor(idx) } },
    h('span', { className: 'ops-cover-spine' }),
    h('span', { className: 'ops-cover-badge' },
      Badge(book.availableCopies > 0 ? 'Available' : 'All Issued',
        { tone: book.availableCopies > 0 ? 'success' : 'warning', size: 'sm' })),
    h('div', { className: 'ops-cover-title' }, book.title),
    h('div', { className: 'ops-cover-author' }, book.author));
}

function legend(items) {
  return h('div', { className: 'ops-legend' },
    items.map(([label, colour]) => h('span', null,
      h('i', { className: 'ops-swatch', style: { background: colour } }), label)));
}

/** Standard "open in a drawer" detail helper. */
function openDrawer(title, subtitle, body, actions) {
  return Drawer({ title, subtitle, size: 'lg', body, actions });
}

/** A key/value block that survives dark mode and compact density. */
function kv(pairs) {
  return h('dl', { className: 'ops-kv' },
    pairs.filter(Boolean).map(([k, v]) => frag(h('dt', null, k), h('dd', null, v))));
}

/** Success toast used by every mock form. */
const saved = (what) => notify({ title: `${what} saved`, text: 'Prototype build — nothing was persisted.', tone: 'success', icon: 'check-circle' });

/** Standard destructive flow. */
function confirmDanger(title, text, onYes, confirmLabel = 'Delete') {
  ConfirmDialog({ title, text, confirmLabel, tone: 'danger', icon: 'alert-triangle' })
    .then((ok) => { if (ok) onYes(); });
}

/** Bulk actions every ops list gets. */
function stdBulk(nounPlural) {
  return [
    { label: 'Export selection', icon: 'download', onClick: (sel) => notify({ title: `${sel.length} ${nounPlural} exported`, tone: 'success' }) },
    { label: 'Print labels', icon: 'print', onClick: (sel) => notify({ title: `${sel.length} labels queued`, tone: 'info' }) },
    { label: 'Archive', icon: 'archive', tone: 'danger', onClick: (sel) => confirmDanger('Archive selection?', `${sel.length} ${nounPlural} will be moved to the archive.`, () => notify({ title: 'Archived', tone: 'success' }), 'Archive') },
  ];
}

const emptyFor = (icon2, title, text, action) => EmptyState({ icon: icon2, title, text, action });

/* ==========================================================================
   2. Shared derived datasets (memoised, deterministic)
   ========================================================================== */

const cache = {};
const memo = (key, fn) => (cache[key] !== undefined ? cache[key] : (cache[key] = fn()));

/** Library reservations derived from fully-issued books + active members. */
function reservations() {
  return memo('reservations', () => {
    const pool = db.books.filter((b) => b.availableCopies === 0).slice(0, 180);
    const members = db.libraryMembers.filter((m) => m.status === 'Active');
    return pool.map((b, i) => {
      const m = members[(hashOf(b.id) + i) % members.length];
      const placed = new Date(2026, 7, 1 + (hashOf('r' + b.id) % 19));
      const state = pickOf(['Waiting', 'Ready for Pickup', 'Waiting', 'Waiting', 'Cancelled', 'Fulfilled'], 'st' + b.id);
      return {
        id: 'RSV' + String(i + 1).padStart(4, '0'),
        bookId: b.id, bookTitle: b.title, accessionNo: b.accessionNo, category: b.category,
        memberId: m.id, memberName: m.name, memberType: m.memberType, className: m.className,
        campusId: b.campusId,
        placedOn: placed.toISOString().slice(0, 10),
        queuePos: 1 + (hashOf('q' + b.id) % 4),
        expectedOn: new Date(placed.getTime() + (3 + (hashOf('e' + b.id) % 12)) * 86400000).toISOString().slice(0, 10),
        status: state,
        notified: state === 'Ready for Pickup',
      };
    });
  });
}

/** Book copies exploded from the catalogue (accession-level rows). */
function bookCopies(limitBooks = 900) {
  return memo('copies' + limitBooks, () => {
    const out = [];
    for (const b of db.books.slice(0, limitBooks)) {
      for (let c = 1; c <= b.totalCopies; c++) {
        const issued = c <= b.issuedCopies;
        out.push({
          id: `${b.accessionNo}/${c}`,
          barcode: `${b.accessionNo}-${String(c).padStart(2, '0')}`,
          bookId: b.id, title: b.title, author: b.author, category: b.category,
          rackNo: b.rackNo, campusId: b.campusId, copyNo: c,
          condition: c === 1 ? b.condition : pickOf(['Good', 'Good', 'Fair', 'Damaged'], b.id + c),
          status: issued ? 'Issued' : b.condition === 'Lost' ? 'Lost' : 'On Shelf',
          price: b.price,
          addedOn: b.addedOn,
        });
      }
    }
    return out;
  });
}

/** Trips derived from bus attendance + routes. */
function trips() {
  return memo('trips', () => db.busAttendance.map((a, i) => {
    const rt = byId(db.routes, a.routeId) || {};
    const veh = byId(db.vehicles, a.vehicleId) || {};
    const start = a.trip === 'Morning Pickup' ? (rt.pickupStart || '06:30') : (rt.dropStart || '14:30');
    const durMin = (rt.durationMin || 40) + a.delayMin;
    const [hh, mm] = start.split(':').map(Number);
    const end = new Date(2026, 0, 1, hh, mm + durMin);
    return {
      id: 'TRP' + String(i + 1).padStart(5, '0'),
      date: a.date, routeId: a.routeId, routeName: a.routeName, code: rt.code,
      vehicleId: a.vehicleId, regNo: veh.regNo, driverName: (byId(db.drivers, veh.driverId) || {}).name || '—',
      trip: a.trip, startTime: start,
      endTime: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
      distanceKm: rt.distanceKm, durationMin: durMin, delayMin: a.delayMin,
      boarded: a.boarded, expected: a.expected, campusId: a.campusId,
      status: a.delayMin >= 15 ? 'Delayed' : 'Completed',
    };
  }));
}

/** Purchase requisitions feeding the PR → PO → GRN flow. */
function purchaseRequests() {
  return memo('prs', () => db.inventoryItems
    .filter((it) => it.status !== 'In Stock' || boolOf('pr' + it.id, 35))
    .map((it, i) => {
      const qty = Math.max(10, it.reorderLevel * 2 - it.stock);
      const st = it.status === 'Out of Stock' ? 'Pending'
        : pickOf(['Pending', 'Approved', 'Approved', 'Converted to PO', 'Rejected'], 'prs' + it.id);
      return {
        id: 'PR' + String(i + 1).padStart(4, '0'),
        prNo: `PR/26-27/${String(i + 1).padStart(4, '0')}`,
        itemId: it.id, itemName: it.name, category: it.category, unit: it.unit,
        campusId: it.campusId, store: it.store,
        quantity: qty, estimatedRate: it.unitPrice, estimatedValue: qty * it.unitPrice,
        requestedBy: pickOf(['Store Keeper', 'Lab Assistant', 'Sports Coordinator', 'IT Administrator', 'Head Housekeeping'], 'rb' + it.id),
        department: pickOf(['Administration', 'Science', 'Sports', 'IT', 'Housekeeping', 'Mess'], 'dp' + it.id),
        requestedOn: `2026-08-${String(1 + (hashOf('rd' + it.id) % 19)).padStart(2, '0')}`,
        neededBy: `2026-09-${String(1 + (hashOf('nb' + it.id) % 27)).padStart(2, '0')}`,
        priority: it.status === 'Out of Stock' ? 'High' : pickOf(['Normal', 'Normal', 'High', 'Low'], 'pp' + it.id),
        status: st,
        vendorId: it.vendorId,
        justification: it.status === 'Out of Stock'
          ? 'Stock exhausted — required to keep daily operations running.'
          : 'Stock has fallen below the reorder level for this store.',
      };
    }));
}

/** Goods receipt notes derived from purchase orders. */
function grns() {
  return memo('grns', () => db.purchaseOrders.filter((po) => po.grnReceived || po.status === 'Received' || boolOf('g' + po.id, 55))
    .map((po, i) => {
      const short = boolOf('sh' + po.id, 18) ? intOf('sq' + po.id, 1, Math.max(2, Math.round(po.quantity * 0.08))) : 0;
      const rej = boolOf('rj' + po.id, 12) ? intOf('rq' + po.id, 1, 4) : 0;
      return {
        id: 'GRN' + String(i + 1).padStart(4, '0'),
        grnNo: `GRN/26-27/${String(i + 1).padStart(4, '0')}`,
        poId: po.id, poNumber: po.poNumber, vendorId: po.vendorId, vendorName: po.vendorName,
        campusId: po.campusId, items: po.items,
        orderedQty: po.quantity, receivedQty: po.quantity - short, shortQty: short, rejectedQty: rej,
        acceptedQty: po.quantity - short - rej,
        receivedOn: po.expectedDate,
        invoiceNo: `INV/${po.poNumber.split('/').pop()}`,
        value: po.total,
        inspectedBy: pickOf(['Store Keeper', 'Purchase Officer', 'Lab In-charge', 'IT Administrator'], 'ib' + po.id),
        status: short || rej ? 'Partially Received' : 'Received',
        qcResult: rej ? 'Rejected items returned' : 'Passed',
      };
    }));
}

/** Stock audit lines with book vs physical variance. */
function auditLines() {
  return memo('audit', () => db.inventoryItems.map((it, i) => {
    const variance = boolOf('av' + it.id, 34) ? intOf('vq' + it.id, -9, 7) : 0;
    return {
      id: 'AUD' + String(i + 1).padStart(4, '0'),
      itemId: it.id, code: it.code, itemName: it.name, category: it.category,
      campusId: it.campusId, store: it.store, unit: it.unit,
      bookStock: it.stock, physicalStock: Math.max(0, it.stock + variance),
      variance, unitPrice: it.unitPrice, varianceValue: variance * it.unitPrice,
      countedBy: pickOf(['Store Keeper', 'Accounts Assistant', 'Internal Auditor'], 'cb' + it.id),
      countedOn: `2026-08-${String(10 + (hashOf('cd' + it.id) % 10)).padStart(2, '0')}`,
      status: variance === 0 ? 'Matched' : Math.abs(variance) <= 3 ? 'Minor Variance' : 'Investigate',
      remarks: variance === 0 ? 'Physical count matches the ledger.'
        : variance < 0 ? 'Short on shelf — issue slips being reconciled.' : 'Excess found — earlier receipt not posted.',
    };
  }));
}

/** Asset maintenance / AMC schedule derived from the asset register. */
function assetMaintenance() {
  return memo('amaint', () => db.assets.filter((a) => a.status !== 'Disposed').slice(0, 260).map((a, i) => {
    const due = new Date(2026, 7, 1 + (hashOf('am' + a.id) % 90));
    const st = due < new Date(TODAY) ? pickOf(['Completed', 'Completed', 'Overdue'], 'as' + a.id)
      : pickOf(['Scheduled', 'Scheduled', 'In Progress'], 'as2' + a.id);
    return {
      id: 'AMN' + String(i + 1).padStart(4, '0'),
      assetId: a.id, tag: a.tag, assetName: a.name, category: a.category,
      campusId: a.campusId, location: a.location,
      type: a.amc ? 'AMC Visit' : pickOf(['Preventive Service', 'Breakdown Repair', 'Calibration', 'Software Update'], 'at' + a.id),
      vendorId: a.vendorId, vendorName: (byId(db.vendors, a.vendorId) || {}).name || '—',
      dueDate: due.toISOString().slice(0, 10),
      cost: intOf('ac' + a.id, 900, 42000),
      downtimeDays: intOf('ad' + a.id, 0, 5),
      status: st,
      amc: a.amc,
      technician: pickOf(['Rakesh Yadav', 'Suresh Pillai', 'Imran Sheikh', 'Dinesh Rawat', 'Manoj Kumar'], 'tech' + a.id),
    };
  }));
}

/** Health checkup campaign rows. */
function checkups() {
  return memo('checkups', () => db.healthRecords.map((r, i) => {
    const camp = pickOf(['Annual Physical 2026-27', 'Dental Camp — Aug 2026', 'Vision Screening — Jul 2026', 'Cardiac Screening (Sr. School)'], 'cm' + r.id);
    return {
      id: 'CHK' + String(i + 1).padStart(4, '0'),
      campaign: camp,
      studentId: r.studentId, studentName: r.studentName, className: r.className, section: r.section,
      campusId: r.campusId, bloodGroup: r.bloodGroup,
      date: r.lastCheckup, nextDate: r.nextCheckup,
      heightCm: r.heightCm, weightKg: r.weightKg, bmi: r.bmi,
      bmiBand: r.bmi < 15 ? 'Underweight' : r.bmi < 22 ? 'Healthy' : r.bmi < 26 ? 'Overweight' : 'Obese',
      vision: r.vision, dental: r.dental,
      examinedBy: pickOf(['Dr. Anjali Menon', 'Dr. Ravi Deshmukh', 'Dr. Farida Khan', 'Dr. Sameer Joshi'], 'ex' + r.id),
      outcome: r.status === 'Fit' ? 'Fit' : r.status === 'Referred' ? 'Referred to specialist' : 'Follow-up advised',
      status: pickOf(['Completed', 'Completed', 'Completed', 'Scheduled'], 'cs' + r.id),
    };
  }));
}

/** Medication administration log built off infirmary visits. */
function medicationLog() {
  return memo('meds', () => db.infirmaryVisits.filter((v) => v.medicineGiven).map((v, i) => {
    const med = pickOf(['Paracetamol 250mg', 'ORS Sachet', 'Cetirizine 5mg', 'Domperidone 5ml',
      'Antiseptic (Povidone-Iodine)', 'Salbutamol Inhaler', 'Digene Syrup', 'Ibuprofen 200mg'], 'md' + v.id);
    return {
      id: 'MED' + String(i + 1).padStart(4, '0'),
      visitId: v.id, studentId: v.studentId, studentName: v.studentName,
      className: v.className, section: v.section, campusId: v.campusId,
      date: v.date, time: v.time, medicine: med,
      dose: pickOf(['1 tablet', '5 ml', '10 ml', '2 puffs', 'Topical', '1 sachet'], 'ds' + v.id),
      route: pickOf(['Oral', 'Oral', 'Topical', 'Inhalation'], 'rt' + v.id),
      indication: v.complaint,
      administeredBy: v.attendedByName || 'School Nurse',
      consent: boolOf('cn' + v.id, 82) ? 'Parent consent on file' : 'Standing order',
      parentInformed: v.parentInformed,
      stockSource: pickOf(['Infirmary Cupboard A', 'Infirmary Cupboard B', 'Emergency Kit'], 'ss' + v.id),
      status: 'Administered',
    };
  }));
}

/** Vaccination tracker: one row per student per vaccine in the schedule. */
const VACCINES = ['BCG', 'DPT', 'Polio', 'MMR', 'Hepatitis B', 'Typhoid', 'HPV', 'COVID-19'];
function vaccinationRows() {
  return memo('vax', () => {
    const out = [];
    let n = 0;
    for (const r of db.healthRecords) {
      for (const v of VACCINES) {
        const done = r.vaccinations.includes(v);
        n++;
        out.push({
          id: 'VAX' + String(n).padStart(5, '0'),
          studentId: r.studentId, studentName: r.studentName, className: r.className,
          section: r.section, campusId: r.campusId,
          vaccine: v,
          doseNo: v === 'DPT' || v === 'Polio' ? 3 : v === 'COVID-19' ? 2 : 1,
          status: done ? 'Completed' : boolOf('vd' + r.id + v, 30) ? 'Due' : 'Pending',
          givenOn: done ? `202${1 + (hashOf('vy' + r.id + v) % 5)}-0${1 + (hashOf('vm' + r.id + v) % 9)}-1${hashOf('vdd' + r.id + v) % 9}` : null,
          centre: done ? pickOf(['School Camp', 'Govt. PHC', 'Private Clinic', 'District Hospital'], 'vc' + r.id + v) : '—',
          batchNo: done ? 'BN' + intOf('vb' + r.id + v, 10000, 99999) : '—',
          certificate: done && boolOf('vf' + r.id + v, 74),
        });
      }
    }
    return out;
  });
}

/* ==========================================================================
   3. Reusable chart/widget fragments
   ========================================================================== */

function chartCard(title, node, subtitle, actions) {
  return SectionCard({ title, subtitle, actions, className: 'chart-card' }, node);
}

function kpiTile(label, value, opts = {}) {
  return Object.assign({ label, value }, opts);
}

/** Shared "no results" empty state for filtered lists. */
const noResults = (what, action) => EmptyState({
  icon: 'search', title: `No ${what} match these filters`,
  text: 'Try widening the date range, clearing the campus filter, or searching for something else.',
  action,
});

/* ==========================================================================
   4. LIBRARY
   ========================================================================== */

const FINE_PER_DAY = 2;
const LOAN_DAYS = 14;
const MAX_RENEWALS = 2;

function fineDue(issue) {
  if (issue.returnDate) return issue.fine || 0;
  const late = -daysFromToday(issue.dueDate);
  return late > 0 ? late * FINE_PER_DAY : 0;
}

const CATEGORY_LIST = () => Array.from(new Set(db.books.map((b) => b.category))).sort();

/** The shared book detail body — used by the drawer and the detail route. */
function bookDetailBody(b) {
  const copies = [];
  for (let c = 1; c <= b.totalCopies; c++) {
    copies.push({
      id: `${b.accessionNo}/${c}`,
      copyNo: c,
      barcode: `${b.accessionNo}-${String(c).padStart(2, '0')}`,
      status: c <= b.issuedCopies ? 'Issued' : 'On Shelf',
      condition: c === 1 ? b.condition : pickOf(['Good', 'Good', 'Fair', 'Damaged'], b.id + c),
      rackNo: b.rackNo,
    });
  }
  const history = db.bookIssues.filter((i) => i.bookId === b.id);

  return h('div', { className: 'stack-3' },
    h('div', { className: 'row-4 row-top row-wrap' },
      h('div', { style: { width: '150px', flex: 'none' } }, coverTile(b)),
      h('div', { className: 'flex-1 stack-2', style: { minWidth: '220px' } },
        h('h3', null, b.title),
        h('div', { className: 't-muted' }, `${b.author} · ${b.publisher}`),
        h('div', { className: 'row-3 row-wrap' },
          Badge(b.status), Badge(b.category, { tone: 'info' }), Badge(b.language, { tone: 'neutral' }),
          b.digital && Badge('Digital edition', { tone: 'brand', icon: 'monitor' })),
        kv([
          ['Accession no', b.accessionNo],
          ['ISBN', b.isbn],
          ['Edition', `${b.edition} · ${b.year}`],
          ['Rack', b.rackNo],
          ['Pages', num(b.pages)],
          ['Price', money(b.price)],
          ['Campus', campusName(b.campusId)],
          ['Added on', dt(b.addedOn)],
        ]))),
    Card({ pad: true },
      h('div', { className: 'row-4 row-wrap' },
        h('div', { className: 'flex-1', style: { minWidth: '180px' } },
          h('div', { className: 't-eyebrow mb-2' }, 'Availability'),
          UIStackedBar([
            { value: b.availableCopies, color: 'var(--chart-good)', label: 'On shelf' },
            { value: b.issuedCopies, color: 'var(--chart-1)', label: 'Issued' },
          ]),
          h('div', { className: 't-sm t-muted mt-2' },
            `${b.availableCopies} of ${b.totalCopies} copies on the shelf · issued ${num(b.timesIssued)} times to date`)),
        h('div', { style: { flex: 'none' } }, qrTile(b.accessionNo)))),
    SectionCard({ title: 'Copies', subtitle: `${b.totalCopies} accessioned copies`, flush: true },
      DataTable({
        rows: copies, paginate: false, searchable: false, columnToggle: false, exportable: false,
        columns: [
          { key: 'copyNo', label: 'Copy', width: 70, numeric: true, align: 'right' },
          { key: 'barcode', label: 'Barcode', className: 't-mono' },
          { key: 'rackNo', label: 'Rack', width: 110 },
          { key: 'condition', label: 'Condition', width: 120, render: (r) => Badge(r.condition) },
          { key: 'status', label: 'Status', width: 120, render: (r) => Badge(r.status) },
        ],
      })),
    SectionCard({ title: 'Circulation history', subtitle: `${history.length} recorded loans`, flush: true },
      history.length
        ? DataTable({
          rows: history, pageSize: 8, searchable: false, columnToggle: false, exportable: false,
          columns: [
            { key: 'memberName', label: 'Member', render: (r) => Identity(r.memberName, `${r.memberType} · ${r.className || '—'}`) },
            { key: 'issueDate', label: 'Issued', width: 130, render: (r) => dt(r.issueDate) },
            { key: 'dueDate', label: 'Due', width: 130, render: (r) => dt(r.dueDate) },
            { key: 'status', label: 'Status', width: 120, render: (r) => Badge(r.status) },
            { key: 'fine', label: 'Fine', width: 110, align: 'right', numeric: true, render: (r) => money(fineDue(r)) },
          ],
        })
        : h('div', { className: 'card-pad' }, emptyFor('history', 'No loans yet',
          'This title has not been issued from this campus so far.'))));
}

function openBookDrawer(b) {
  openDrawer(b.title, `${b.author} · ${b.accessionNo}`, bookDetailBody(b), (close) => frag(
    Button('Reserve', { variant: 'secondary', icon: 'bookmark', onClick: () => { close(); notify({ title: 'Reservation placed', text: b.title, tone: 'success' }); } }),
    Button('Issue this book', { variant: 'primary', icon: 'arrow-up-right', onClick: () => { close(); navigate('library/issue'); } })));
}

/** Barcode-scanner console shared by the issue / return / renew desks. */
function scanConsole({ placeholder, buttonLabel, onScan, hint }) {
  const input = Input({ placeholder, value: '' });
  input.setAttribute('aria-label', placeholder);
  const submit = () => {
    const v = String(input.value || '').trim();
    if (!v) { notify({ title: 'Nothing scanned', text: 'Scan a barcode or type an accession number.', tone: 'warning' }); return; }
    onScan(v);
    input.value = '';
    input.focus();
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
  setTimeout(() => { try { input.focus(); } catch (err) { /* focus is best-effort */ } }, 60);

  return h('div', { className: 'stack-2' },
    h('div', { className: 'ops-scan' },
      h('span', { className: 'ops-scan-icon', html: icon('scan', 22) }),
      h('div', { className: 'ops-scan-input' }, input),
      Button(buttonLabel, { variant: 'primary', icon: 'check', onClick: submit })),
    hint && h('div', { className: 't-xs t-muted' }, hint));
}

const libraryRoutes = {

  /* ------------------------------------------------- library/dashboard */
  'library/dashboard': {
    title: 'Library Dashboard',
    subtitle: 'Circulation, stock health and overdue exposure',
    section: 'library',
    render(mount, ctx) {
      ensureStyles();
      const books = scope(db.books, ctx);
      const issues = db.bookIssues;
      const open = issues.filter((i) => i.status !== 'Returned');
      const overdue = issues.filter((i) => i.status === 'Overdue');
      const fines = overdue.reduce((a, i) => a + fineDue(i), 0);
      const members = db.libraryMembers;
      const circ = analytics.libraryCirculation;
      const topBooks = sortBy(db.books.slice(0, 3000), 'timesIssued', 'desc').slice(0, 8);
      const topMembers = sortBy(members, 'totalIssued', 'desc').slice(0, 8);

      mount.appendChild(dashboardPage({
        greeting: greetingFor((ctx.state.currentUser || {}).name || 'Librarian'),
        title: 'Library at a glance',
        subtitle: `${num(db.books.length)} titles · ${num(members.length)} members · academic year 2026-27`,
        route: 'library/dashboard',
        actions: pageActions(
          Button('Issue book', { variant: 'secondary', icon: 'arrow-up-right', route: 'library/issue' }),
          Button('Add book', { variant: 'primary', icon: 'plus', route: 'library/add-book' })),
        kpis: [
          { label: 'Titles catalogued', value: num(db.books.length), delta: 2.4, deltaLabel: 'vs last term', icon: 'book', tone: 'brand', trend: analytics.sparks.library, route: 'library/catalog' },
          { label: 'On loan', value: num(open.length), delta: 6.1, icon: 'arrow-up-right', tone: 'info', route: 'library/renew' },
          { label: 'Overdue', value: num(overdue.length), delta: 9.4, icon: 'alert-triangle', tone: 'danger', route: 'library/fines' },
          { label: 'Fines outstanding', value: moneyC(fines), icon: 'rupee', tone: 'warning', route: 'library/fines' },
          { label: 'Active members', value: num(members.filter((m) => m.status === 'Active').length), icon: 'users', tone: 'success', route: 'library/members' },
          { label: 'Digital titles', value: num(books.filter((b) => b.digital).length), icon: 'monitor', tone: 'brand', route: 'library/digital' },
        ],
        widgets: [
          { span: 8, render: () => chartCard('Circulation this session',
            comboChart({
              categories: circ.map((c) => c.month),
              bars: [
                { name: 'Issued', values: circ.map((c) => c.issued) },
                { name: 'Returned', values: circ.map((c) => c.returned) },
              ],
              line: { name: 'Overdue', values: circ.map((c) => c.overdue) },
              height: 280, valueFormat: 'number',
            }), 'Issues and returns per month with the overdue tail') },
          { span: 4, render: () => chartCard('Collection by subject',
            donutChart({
              data: analytics.libraryCategorySplit, height: 260,
              centerValue: compactNumber(analytics.libraryCategorySplit.reduce((a, x) => a + x.value, 0)),
              centerLabel: 'Volumes',
            }), 'Share of the physical collection') },
          { span: 4, render: () => SectionCard({ title: 'Most borrowed titles', icon: 'trending-up', actions: Button('Catalogue', { variant: 'link', size: 'sm', route: 'library/catalog' }) },
            RankList(topBooks.map((b) => ({ name: b.title, meta: `${b.author} · ${b.category}`, value: `${num(b.timesIssued)}` })))) },
          { span: 4, render: () => SectionCard({ title: 'Top readers', icon: 'award', actions: Button('Members', { variant: 'link', size: 'sm', route: 'library/members' }) },
            RankList(topMembers.map((m) => ({ name: m.name, meta: `${m.memberType} · ${m.className}`, value: `${m.totalIssued}` })))) },
          { span: 4, render: () => chartCard('Shelf availability',
            gaugeChart({
              value: Math.round((db.books.reduce((a, b) => a + b.availableCopies, 0) / db.books.reduce((a, b) => a + b.totalCopies, 0)) * 100),
              min: 0, max: 100, label: 'Copies on shelf', height: 240, valueFormat: 'percent0',
            }), 'Share of accessioned copies currently on the shelf') },
          { span: 12, render: () => SectionCard({
            title: 'Overdue loans needing a reminder', icon: 'alert-triangle',
            subtitle: `${overdue.length} loans past their due date`,
            actions: Button('Open fines desk', { variant: 'secondary', size: 'sm', icon: 'rupee', route: 'library/fines' }),
            flush: true,
          }, overdue.length ? DataTable({
            rows: sortBy(overdue, (r) => -fineDue(r)).slice(0, 200),
            pageSize: 8, exportName: 'library-overdue',
            searchKeys: ['memberName', 'bookTitle', 'accessionNo'],
            columns: [
              { key: 'memberName', label: 'Member', sticky: true, width: 220, render: (r) => Identity(r.memberName, `${r.className || r.memberType} · ${r.memberId}`) },
              { key: 'bookTitle', label: 'Title', render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.bookTitle), h('div', { className: 't-xs t-muted t-mono' }, r.accessionNo)) },
              { key: 'dueDate', label: 'Due', width: 130, render: (r) => dt(r.dueDate) },
              { key: 'late', label: 'Days late', width: 110, align: 'right', numeric: true, value: (r) => -daysFromToday(r.dueDate), render: (r) => h('span', { className: 't-danger t-semibold' }, String(Math.max(0, -daysFromToday(r.dueDate)))) },
              { key: 'fine', label: 'Fine', width: 110, align: 'right', numeric: true, value: (r) => fineDue(r), render: (r) => money(fineDue(r)) },
            ],
            rowActions: (r) => [
              { label: 'Send reminder', icon: 'send', onClick: () => notify({ title: 'Reminder sent', text: r.memberName, tone: 'success' }) },
              { label: 'Open return desk', icon: 'arrow-down-right', route: 'library/return' },
            ],
          }) : h('div', { className: 'card-pad' }, emptyFor('check-circle', 'Nothing overdue', 'Every loan is within its due date. Nice.'))) },
        ],
      }));
    },
  },

  /* ---------------------------------------------------- library/catalog */
  'library/catalog': {
    title: 'Book Catalog',
    subtitle: 'Every title held across the campus libraries',
    section: 'library',
    render(mount, ctx) {
      ensureStyles();

      if (ctx.param) {
        const b = byId(db.books, ctx.param);
        if (!b) return mount.appendChild(missingRecord('book', 'library/catalog'));
        return mount.appendChild(detailPage({
          title: b.title,
          subtitle: `${b.author} · ${b.publisher} · ${b.edition}`,
          route: 'library/catalog',
          initials: initials(b.title, 2),
          badges: [Badge(b.status), Badge(b.category, { tone: 'info' })],
          meta: [
            { label: 'Accession', value: b.accessionNo, icon: 'qr' },
            { label: 'Rack', value: b.rackNo, icon: 'layers' },
            { label: 'Copies', value: `${b.availableCopies}/${b.totalCopies} free`, icon: 'book' },
            { label: 'Campus', value: campusName(b.campusId), icon: 'building' },
          ],
          actions: pageActions(
            Button('Print label', { variant: 'secondary', icon: 'print', onClick: mockAction('Print spine label') }),
            Button('Issue', { variant: 'primary', icon: 'arrow-up-right', route: 'library/issue' })),
          tabs: [{ id: 'overview', label: 'Overview', icon: 'book', render: () => bookDetailBody(b) }],
        }));
      }

      const all = scope(db.books, ctx);
      let view = 'grid';
      let values = {};
      const map = {
        q: (r, v) => `${r.title} ${r.author} ${r.accessionNo} ${r.isbn}`.toLowerCase().includes(String(v).toLowerCase()),
        category: (r, v) => r.category === v,
        language: (r, v) => r.language === v,
        avail: (r, v) => (v === 'available' ? r.availableCopies > 0 : v === 'issued' ? r.availableCopies === 0 : r.digital),
        campus: (r, v) => r.campusId === v,
      };

      const host = h('div', { className: 'stack' });
      const countLabel = h('div', { className: 't-sm t-muted t-nowrap' });

      const columns = [
        { key: 'title', label: 'Title', sticky: true, width: 300, render: (r) => Identity(r.title, `${r.author} · ${r.accessionNo}`, { size: 'sm' }), value: (r) => r.title },
        { key: 'category', label: 'Subject', width: 160, filter: true },
        { key: 'language', label: 'Language', width: 120, filter: true },
        { key: 'publisher', label: 'Publisher', width: 200, hidden: true },
        { key: 'year', label: 'Year', width: 80, align: 'right', numeric: true },
        { key: 'rackNo', label: 'Rack', width: 100, className: 't-mono' },
        { key: 'totalCopies', label: 'Copies', width: 90, align: 'right', numeric: true, aggregate: 'sum', format: num },
        { key: 'availableCopies', label: 'On shelf', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num,
          render: (r) => h('span', { className: r.availableCopies ? 't-success t-semibold' : 't-warning t-semibold' }, String(r.availableCopies)) },
        { key: 'timesIssued', label: 'Loans', width: 90, align: 'right', numeric: true, hidden: true },
        { key: 'price', label: 'Price', width: 110, align: 'right', numeric: true, hidden: true, render: (r) => money(r.price), aggregate: 'sum', format: moneyC },
        { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
      ];

      const paint = () => {
        const rows = applyAll(all, values, map);
        host.innerHTML = '';
        countLabel.textContent = `${num(rows.length)} titles`;
        if (!rows.length) {
          host.appendChild(Card({ pad: true }, noResults('titles',
            Button('Clear filters', { variant: 'secondary', icon: 'refresh-ccw', onClick: () => { values = {}; paint(); } }))));
          return;
        }
        if (view === 'grid') {
          const slice = rows.slice(0, 60);
          host.appendChild(Card({ pad: true },
            h('div', { className: 'ops-tiles' },
              slice.map((b) => h('button', {
                className: 'ops-tile', type: 'button',
                attrs: { 'aria-label': `Open ${b.title}` },
                onClick: () => openBookDrawer(b),
              },
                coverTile(b),
                h('div', { className: 'ops-tile-body' },
                  h('div', { className: 't-xs t-muted' }, b.category),
                  h('div', { className: 't-xs t-mono t-muted' }, b.accessionNo),
                  h('div', { className: 'row', style: { gap: 'var(--sp-2)' } },
                    Badge(`${b.availableCopies}/${b.totalCopies}`, { tone: b.availableCopies ? 'success' : 'warning', size: 'sm' }),
                    h('span', { className: 't-xs t-muted' }, b.rackNo)))))),
            rows.length > slice.length
              ? h('div', { className: 'row mt-4', style: { justifyContent: 'center' } },
                h('span', { className: 't-sm t-muted t-center' },
                  `Showing the first ${slice.length} of ${num(rows.length)} titles — switch to the table view or narrow the filters.`))
              : null));
        } else {
          host.appendChild(DataTable({
            columns, rows, pageSize: 25, selectable: true, footerAggregates: true,
            searchKeys: ['title', 'author', 'accessionNo', 'isbn', 'publisher'],
            exportName: 'library-catalogue',
            bulkActions: stdBulk('titles'),
            onRowClick: (r) => openBookDrawer(r),
            rowActions: (r) => [
              { label: 'Open detail page', icon: 'eye', route: `library/catalog/${r.id}` },
              { label: 'Copy accession no', icon: 'copy', onClick: () => copyToClipboard(r.accessionNo) },
              { label: 'Issue this book', icon: 'arrow-up-right', route: 'library/issue' },
              { separator: true },
              { label: 'Mark lost / damaged', icon: 'alert-triangle', tone: 'danger', onClick: () => confirmDanger('Mark this copy as lost?', `${r.title} will move to the lost & damaged register.`, () => notify({ title: 'Moved to lost & damaged', tone: 'warning' }), 'Mark lost') },
            ],
            emptyState: noResults('titles'),
          }));
        }
      };

      const seg = SegmentedControl(
        [{ id: 'grid', label: 'Covers', icon: 'grid' }, { id: 'table', label: 'Table', icon: 'table' }],
        (v) => { view = v; paint(); }, { active: view });

      const bar = FilterBar({
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Title, author, ISBN or accession no…', width: '260px' },
          { id: 'category', label: 'Subject', options: CATEGORY_LIST() },
          { id: 'language', label: 'Language', options: ['English', 'Hindi', 'Sanskrit', 'French'] },
          { id: 'avail', label: 'Availability', options: [{ value: 'available', label: 'On shelf' }, { value: 'issued', label: 'All issued' }, { value: 'digital', label: 'Digital editions' }] },
          { id: 'campus', label: 'Campus', options: campusOptions() },
        ],
        onChange: (id, v, all2) => { values = all2; paint(); },
        actions: h('div', { className: 'row-3' }, countLabel, seg),
      });

      paint();

      mount.appendChild(page({
        title: 'Book catalog',
        subtitle: `${num(all.length)} titles · ${num(db.books.reduce((a, b) => a + b.totalCopies, 0))} accessioned copies`,
        route: 'library/catalog',
        actions: pageActions(
          Button('Copies & barcodes', { variant: 'secondary', icon: 'qr', route: 'library/copies' }),
          Button('Add book', { variant: 'primary', icon: 'plus', route: 'library/add-book' })),
        filters: bar,
        children: host,
      }));
    },
  },

  /* --------------------------------------------------- library/add-book */
  'library/add-book': {
    title: 'Add Book',
    subtitle: 'Accession a new title into the catalogue',
    section: 'library',
    render(mount) {
      ensureStyles();
      mount.appendChild(formPage({
        title: 'Add book',
        subtitle: 'Catalogue a new title and generate accession numbers for its copies',
        route: 'library/add-book',
        mode: 'wizard',
        submitLabel: 'Accession title',
        cancelLabel: 'Discard',
        steps: [
          {
            id: 'biblio', label: 'Bibliographic', description: 'What the title is',
            sections: [{
              title: 'Title details', description: 'Copy these from the title page, not the cover.', cols: 2,
              fields: [
                { id: 'title', label: 'Title', required: true, placeholder: 'e.g. Foundations of Statistics', span: 'full', validate: validators.required },
                { id: 'author', label: 'Author', type: 'combobox', required: true, options: db.authors.slice(0, 120).map((a) => ({ value: a.id, label: a.name })) },
                { id: 'publisher', label: 'Publisher', type: 'combobox', required: true, options: db.publishers.map((p) => ({ value: p.id, label: p.name })) },
                { id: 'isbn', label: 'ISBN-13', placeholder: '978-XX-XXXX-XXXX-X', hint: 'Leave blank for pre-ISBN titles.' },
                { id: 'edition', label: 'Edition', placeholder: '3rd Edition' },
                { id: 'year', label: 'Year of publication', type: 'number', validate: [validators.number, validators.min(1900), validators.max(2026)] },
                { id: 'language', label: 'Language', type: 'select', options: ['English', 'Hindi', 'Sanskrit', 'French'], value: 'English' },
                { id: 'pages', label: 'Pages', type: 'number', validate: validators.number },
                { id: 'summary', label: 'Blurb', type: 'textarea', span: 'full', placeholder: 'A short description for the OPAC listing.' },
              ],
            }],
          },
          {
            id: 'classify', label: 'Classification', description: 'Where it lives',
            sections: [{
              title: 'Shelving & classification', cols: 2,
              fields: [
                { id: 'category', label: 'Subject', type: 'select', required: true, options: CATEGORY_LIST() },
                { id: 'subCategory', label: 'Collection', type: 'select', options: ['Textbook', 'Reference', 'Supplementary', 'Journal', 'Magazine'], value: 'Textbook' },
                { id: 'campusId', label: 'Campus library', type: 'select', required: true, options: campusOptions(), value: 'C1' },
                { id: 'rackNo', label: 'Rack', placeholder: 'R12-B3', hint: 'Rack code as painted on the shelf end.' },
                { id: 'levels', label: 'Recommended for', type: 'multiselect', span: 'full', options: ['Pre-Primary', 'Primary', 'Middle School', 'Secondary', 'Senior Secondary', 'Staff'] },
                { id: 'reference', label: 'Reference only', type: 'switch', switchLabel: 'Cannot be taken out of the library' },
                { id: 'digital', label: 'Digital edition', type: 'switch', switchLabel: 'A PDF/EPUB is also available' },
              ],
            }],
          },
          {
            id: 'copies', label: 'Copies & cost', description: 'How many and how much',
            sections: [{
              title: 'Accession', cols: 2,
              fields: [
                { id: 'totalCopies', label: 'Number of copies', type: 'number', required: true, value: 3, validate: [validators.required, validators.number, validators.min(1)] },
                { id: 'price', label: 'Price per copy (₹)', type: 'number', required: true, validate: [validators.required, validators.number] },
                { id: 'vendor', label: 'Supplier', type: 'combobox', options: db.vendors.map((v) => ({ value: v.id, label: v.name })) },
                { id: 'billNo', label: 'Bill / invoice no', placeholder: 'INV/26-27/0042' },
                { id: 'addedOn', label: 'Accession date', type: 'date', value: TODAY, required: true },
                { id: 'condition', label: 'Condition', type: 'select', options: ['Good', 'Fair', 'Damaged'], value: 'Good' },
                { id: 'cover', label: 'Cover image', type: 'file', span: 'full', hint: 'Optional — a placeholder is generated from the subject colour.' },
              ],
            }],
          },
        ],
        sidebar: [
          Callout({ tone: 'info', title: 'Accession numbers' },
            'Accession numbers are allocated automatically in the ACC-###### series when the record is saved. Spine labels and barcodes can be printed straight afterwards.'),
          SectionCard({ title: 'Catalogue snapshot', icon: 'library' },
            kv([
              ['Titles', num(db.books.length)],
              ['Copies', num(db.books.reduce((a, b) => a + b.totalCopies, 0))],
              ['Subjects', String(CATEGORY_LIST().length)],
              ['Publishers', String(db.publishers.length)],
            ])),
        ],
        onSubmit: (values) => {
          saved(`“${values.title || 'New title'}”`);
          navigate('library/catalog');
        },
        onCancel: () => navigate('library/catalog'),
      }));
    },
  },

  /* ------------------------------------------------- library/categories */
  'library/categories': {
    title: 'Categories',
    subtitle: 'Subject classes and how heavily each one circulates',
    section: 'library',
    render(mount, ctx) {
      ensureStyles();
      const books = scope(db.books, ctx);
      const byCat = groupBy(books, 'category');
      const rows = Array.from(byCat.entries()).map(([name, list], i) => {
        const copies = list.reduce((a, b) => a + b.totalCopies, 0);
        const issued = list.reduce((a, b) => a + b.issuedCopies, 0);
        return {
          id: 'CAT' + String(i + 1).padStart(2, '0'),
          name, titles: list.length, copies, issued, available: copies - issued,
          utilisation: copies ? Math.round((issued / copies) * 100) : 0,
          value: list.reduce((a, b) => a + b.price * b.totalCopies, 0),
          loans: list.reduce((a, b) => a + b.timesIssued, 0),
          digital: list.filter((b) => b.digital).length,
          status: copies - issued === 0 ? 'All Issued' : issued / Math.max(1, copies) > 0.5 ? 'High Demand' : 'Healthy',
        };
      }).sort((a, b) => b.copies - a.copies);

      mount.appendChild(listPage({
        title: 'Categories',
        subtitle: `${rows.length} subject classes covering ${num(books.length)} titles`,
        route: 'library/categories',
        actions: pageActions(
          Button('Export', { variant: 'secondary', icon: 'download', onClick: () => notify({ title: 'Category summary exported', tone: 'success' }) }),
          Button('New category', { variant: 'primary', icon: 'plus', onClick: () => Modal({
            title: 'New category', size: 'sm', icon: 'tag',
            body: FormGrid({ cols: 1 },
              Field({ label: 'Category name', required: true }, Input({ placeholder: 'e.g. Robotics' })),
              Field({ label: 'Default rack prefix' }, Input({ placeholder: 'R41' })),
              Field({ label: 'Loan period (days)' }, Input({ type: 'number', value: '14' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Create', { variant: 'primary', onClick: () => { close(); saved('Category'); } })),
          }) })),
        kpis: [
          { label: 'Subject classes', value: String(rows.length), icon: 'tag', tone: 'brand' },
          { label: 'Copies held', value: num(rows.reduce((a, r) => a + r.copies, 0)), icon: 'book', tone: 'info' },
          { label: 'Collection value', value: moneyC(rows.reduce((a, r) => a + r.value, 0)), icon: 'rupee', tone: 'success' },
          { label: 'High demand', value: String(rows.filter((r) => r.status === 'High Demand').length), icon: 'trending-up', tone: 'warning' },
        ],
        chart: barChart({
          categories: rows.slice(0, 12).map((r) => r.name),
          series: [
            { name: 'On shelf', values: rows.slice(0, 12).map((r) => r.available) },
            { name: 'Issued', values: rows.slice(0, 12).map((r) => r.issued) },
          ],
          stacked: true, horizontal: true, height: 320,
        }),
        chartTitle: 'Copies on shelf vs issued, by subject',
        columns: [
          { key: 'name', label: 'Category', sticky: true, width: 220, render: (r) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, h('i', { className: 'ops-swatch', style: { background: seriesColor(hashOf(r.name) % 8) } }), h('span', { className: 't-medium' }, r.name)) },
          { key: 'titles', label: 'Titles', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'copies', label: 'Copies', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'issued', label: 'Issued', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'available', label: 'On shelf', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'utilisation', label: 'Utilisation', width: 170, render: (r) => ProgressBar(r.utilisation, { tone: r.utilisation > 70 ? 'warning' : 'brand', showValue: true }) },
          { key: 'digital', label: 'Digital', width: 100, align: 'right', numeric: true },
          { key: 'value', label: 'Value', width: 130, align: 'right', numeric: true, render: (r) => money(r.value), aggregate: 'sum', format: moneyC },
          { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        selectable: true, footerAggregates: true,
        searchKeys: ['name'],
        bulkActions: stdBulk('categories'),
        rowActions: (r) => [
          { label: 'View titles', icon: 'book', route: 'library/catalog' },
          { label: 'Rename', icon: 'edit', onClick: mockAction('Rename category') },
          { separator: true },
          { label: 'Delete', icon: 'trash', tone: 'danger', onClick: () => confirmDanger('Delete this category?', `${r.titles} titles would need to be re-classified first.`, () => notify({ title: 'Category deleted', tone: 'success' })) },
        ],
        onRowClick: () => navigate('library/catalog'),
        emptyState: emptyFor('tag', 'No categories yet', 'Add a subject class before cataloguing titles.'),
      }));
    },
  },

  /* ---------------------------------------------------- library/authors */
  'library/authors': {
    title: 'Authors',
    subtitle: 'Author authority file and holdings per author',
    section: 'library',
    render(mount) {
      ensureStyles();
      const counts = countBy(db.books, 'authorId');
      const cmap = new Map(counts.map((c) => [c.key, c.value]));
      const rows = db.authors.map((a) => ({
        ...a,
        heldTitles: cmap.get(a.id) || 0,
        loans: db.books.filter((b) => b.authorId === a.id).reduce((s, b) => s + b.timesIssued, 0),
        status: (cmap.get(a.id) || 0) > 0 ? 'In Collection' : 'Not Held',
      }));
      const top = sortBy(rows, 'loans', 'desc').slice(0, 10);

      mount.appendChild(listPage({
        title: 'Authors',
        subtitle: `${rows.length} authors in the authority file`,
        route: 'library/authors',
        actions: pageActions(
          Button('Merge duplicates', { variant: 'secondary', icon: 'git-branch', onClick: mockAction('Merge author records') }),
          Button('Add author', { variant: 'primary', icon: 'plus', onClick: () => Modal({
            title: 'Add author', size: 'md', icon: 'user',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Full name', required: true, className: 'col-span-full' }, Input({ placeholder: 'e.g. Ramachandra Guha' })),
              Field({ label: 'Nationality' }, Select({ options: ['Indian', 'British', 'American', 'Other'], value: 'Indian' })),
              Field({ label: 'Known titles' }, Input({ type: 'number', value: '1' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Save author', { variant: 'primary', onClick: () => { close(); saved('Author'); } })),
          }) })),
        kpis: [
          { label: 'Authors', value: num(rows.length), icon: 'user', tone: 'brand' },
          { label: 'In collection', value: num(rows.filter((r) => r.heldTitles > 0).length), icon: 'book', tone: 'success' },
          { label: 'Indian authors', value: num(rows.filter((r) => r.nationality === 'Indian').length), icon: 'flag', tone: 'info' },
          { label: 'Total loans', value: num(rows.reduce((a, r) => a + r.loans, 0)), icon: 'arrow-up-right', tone: 'warning' },
        ],
        chart: barChart({
          categories: top.map((r) => r.name),
          series: [{ name: 'Loans', values: top.map((r) => r.loans) }],
          horizontal: true, height: 300, showValues: true,
        }),
        chartTitle: 'Most-borrowed authors',
        columns: [
          { key: 'name', label: 'Author', sticky: true, width: 240, render: (r) => Identity(r.name, `${r.nationality} · ${r.id}`) },
          { key: 'nationality', label: 'Nationality', width: 140, filter: true },
          { key: 'titles', label: 'Known titles', width: 130, align: 'right', numeric: true },
          { key: 'heldTitles', label: 'Held here', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'loans', label: 'Loans', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'status', label: 'Status', width: 150, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        selectable: true, footerAggregates: true, searchKeys: ['name', 'id'],
        bulkActions: stdBulk('authors'),
        onRowClick: (r) => {
          const titles = db.books.filter((b) => b.authorId === r.id);
          openDrawer(r.name, `${r.nationality} · ${titles.length} titles held`,
            h('div', { className: 'stack-3' },
              kv([['Author id', r.id], ['Nationality', r.nationality], ['Known titles', String(r.titles)], ['Held here', String(titles.length)], ['Total loans', num(r.loans)]]),
              SectionCard({ title: 'Titles held', flush: true },
                titles.length ? DataTable({
                  rows: titles, pageSize: 10, searchable: false, exportable: false, columnToggle: false,
                  columns: [
                    { key: 'title', label: 'Title', render: (b) => h('div', null, h('div', { className: 't-medium' }, b.title), h('div', { className: 't-xs t-muted t-mono' }, b.accessionNo)) },
                    { key: 'category', label: 'Subject', width: 150 },
                    { key: 'availableCopies', label: 'Free', width: 80, align: 'right', numeric: true },
                    { key: 'timesIssued', label: 'Loans', width: 90, align: 'right', numeric: true },
                  ],
                  onRowClick: (b) => navigate(`library/catalog/${b.id}`),
                }) : h('div', { className: 'card-pad' }, emptyFor('book', 'Nothing held', 'This author is in the authority file but no title is on the shelf yet.')))),
            (close) => Button('Close', { variant: 'secondary', onClick: close }));
        },
        emptyState: emptyFor('user', 'No authors yet', 'Authors are created automatically when a title is catalogued.'),
      }));
    },
  },

  /* ------------------------------------------------- library/publishers */
  'library/publishers': {
    title: 'Publishers',
    subtitle: 'Publisher directory and supply history',
    section: 'library',
    render(mount) {
      ensureStyles();
      const rows = db.publishers.map((p) => {
        const held = db.books.filter((b) => b.publisherId === p.id);
        return {
          ...p,
          heldTitles: held.length,
          copies: held.reduce((a, b) => a + b.totalCopies, 0),
          spend: held.reduce((a, b) => a + b.price * b.totalCopies, 0),
          avgPrice: held.length ? Math.round(held.reduce((a, b) => a + b.price, 0) / held.length) : 0,
          status: held.length > 600 ? 'Preferred' : held.length ? 'Active' : 'Inactive',
        };
      });

      mount.appendChild(listPage({
        title: 'Publishers',
        subtitle: `${rows.length} publishers supplying the collection`,
        route: 'library/publishers',
        actions: pageActions(Button('Add publisher', { variant: 'primary', icon: 'plus', onClick: mockAction('Add publisher') })),
        kpis: [
          { label: 'Publishers', value: String(rows.length), icon: 'building', tone: 'brand' },
          { label: 'Titles supplied', value: num(rows.reduce((a, r) => a + r.heldTitles, 0)), icon: 'book', tone: 'info' },
          { label: 'Collection spend', value: moneyC(rows.reduce((a, r) => a + r.spend, 0)), icon: 'rupee', tone: 'success' },
          { label: 'Preferred', value: String(rows.filter((r) => r.status === 'Preferred').length), icon: 'star', tone: 'warning' },
        ],
        chart: treemap({
          data: sortBy(rows, 'copies', 'desc').slice(0, 10).map((r) => ({ key: r.name, value: r.copies })),
          height: 300,
        }),
        chartTitle: 'Copies held by publisher',
        columns: [
          { key: 'name', label: 'Publisher', sticky: true, width: 260, render: (r) => Identity(r.name, `${r.city} · ${r.id}`) },
          { key: 'city', label: 'City', width: 140, filter: true },
          { key: 'contact', label: 'Contact', width: 150, className: 't-mono' },
          { key: 'titles', label: 'Catalogue size', width: 140, align: 'right', numeric: true },
          { key: 'heldTitles', label: 'Held here', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'copies', label: 'Copies', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'avgPrice', label: 'Avg price', width: 120, align: 'right', numeric: true, render: (r) => money(r.avgPrice) },
          { key: 'spend', label: 'Spend', width: 130, align: 'right', numeric: true, render: (r) => money(r.spend), aggregate: 'sum', format: moneyC },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, searchKeys: ['name', 'city'],
        bulkActions: stdBulk('publishers'),
        rowActions: (r) => [
          { label: 'View titles', icon: 'book', route: 'library/catalog' },
          { label: 'Call', icon: 'phone', onClick: () => notify({ title: 'Dialling', text: r.contact, tone: 'info' }) },
          { label: 'Raise purchase request', icon: 'shopping-cart', route: 'inventory/purchase-requests' },
        ],
        emptyState: emptyFor('building', 'No publishers', 'Publishers are added when you catalogue a title.'),
      }));
    },
  },

  /* ----------------------------------------------------- library/copies */
  'library/copies': {
    title: 'Copies & Barcodes',
    subtitle: 'Accession-level register with printable barcodes',
    section: 'library',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(bookCopies(700), ctx);

      mount.appendChild(listPage({
        title: 'Copies & barcodes',
        subtitle: `${num(rows.length)} physical copies tracked at accession level`,
        route: 'library/copies',
        actions: pageActions(
          Button('Print sheet', { variant: 'secondary', icon: 'print', onClick: mockAction('Print barcode sheet') }),
          Button('Generate barcodes', { variant: 'primary', icon: 'qr', onClick: () => notify({ title: 'Barcode batch queued', text: 'A printable PDF would be generated here.', tone: 'success' }) })),
        kpis: [
          { label: 'Copies', value: num(rows.length), icon: 'book', tone: 'brand' },
          { label: 'On shelf', value: num(rows.filter((r) => r.status === 'On Shelf').length), icon: 'check-circle', tone: 'success' },
          { label: 'Issued', value: num(rows.filter((r) => r.status === 'Issued').length), icon: 'arrow-up-right', tone: 'info' },
          { label: 'Damaged / lost', value: num(rows.filter((r) => r.condition === 'Damaged' || r.status === 'Lost').length), icon: 'alert-triangle', tone: 'danger', route: 'library/lost-damaged' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Barcode, title or rack…', width: '260px' },
          { id: 'status', label: 'Status', options: ['On Shelf', 'Issued', 'Lost'] },
          { id: 'condition', label: 'Condition', options: ['Good', 'Fair', 'Damaged', 'Lost'] },
          { id: 'category', label: 'Subject', options: CATEGORY_LIST() },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.title} ${r.barcode} ${r.rackNo}`.toLowerCase().includes(String(x).toLowerCase()),
          status: (r, x) => r.status === x,
          condition: (r, x) => r.condition === x,
          category: (r, x) => r.category === x,
        })),
        columns: [
          { key: 'barcode', label: 'Barcode', sticky: true, width: 190, className: 't-mono' },
          { key: 'title', label: 'Title', width: 300, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.title), h('div', { className: 't-xs t-muted' }, r.author)) },
          { key: 'category', label: 'Subject', width: 160, filter: true },
          { key: 'copyNo', label: 'Copy', width: 80, align: 'right', numeric: true },
          { key: 'rackNo', label: 'Rack', width: 110, className: 't-mono' },
          { key: 'condition', label: 'Condition', width: 120, filter: true, render: (r) => Badge(r.condition) },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
          { key: 'price', label: 'Value', width: 110, align: 'right', numeric: true, render: (r) => money(r.price), aggregate: 'sum', format: moneyC },
        ],
        rows,
        selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['barcode', 'title', 'rackNo'],
        expandable: (r) => Card({ pad: true },
          h('div', { className: 'row-4 row-wrap row-top' },
            qrTile(r.barcode),
            h('div', { className: 'flex-1', style: { minWidth: '220px' } },
              kv([
                ['Accession', r.barcode],
                ['Title', r.title],
                ['Rack', r.rackNo],
                ['Added on', dt(r.addedOn)],
                ['Replacement cost', money(r.price)],
              ])),
            h('div', { className: 'row-3 row-wrap' },
              Button('Print label', { variant: 'secondary', size: 'sm', icon: 'print', onClick: mockAction('Print spine label') }),
              Button('Copy barcode', { variant: 'ghost', size: 'sm', icon: 'copy', onClick: () => copyToClipboard(r.barcode) })))),
        bulkActions: [
          { label: 'Print barcode labels', icon: 'print', onClick: (sel) => notify({ title: `${sel.length} labels queued`, tone: 'success' }) },
          { label: 'Move rack', icon: 'layers', onClick: mockAction('Bulk rack move') },
          { label: 'Withdraw copies', icon: 'trash', tone: 'danger', onClick: (sel) => confirmDanger('Withdraw these copies?', `${sel.length} copies will be removed from circulation.`, () => notify({ title: 'Copies withdrawn', tone: 'success' }), 'Withdraw') },
        ],
        rowActions: (r) => [
          { label: 'Open title', icon: 'book', route: `library/catalog/${r.bookId}` },
          { label: 'Copy barcode', icon: 'copy', onClick: () => copyToClipboard(r.barcode) },
          { label: 'Report damage', icon: 'alert-triangle', tone: 'danger', route: 'library/lost-damaged' },
        ],
        emptyState: emptyFor('qr', 'No copies', 'Accession a title to create physical copies.'),
      }));
    },
  },

  /* ------------------------------------------------------ library/issue */
  'library/issue': {
    title: 'Issue Book',
    subtitle: 'Barcode-first issue desk',
    section: 'library',
    render(mount, ctx) {
      ensureStyles();
      const members = db.libraryMembers;
      const books = db.books;
      let member = null;
      const basket = [];
      const feed = db.bookIssues.filter((i) => i.status !== 'Returned').slice(0, 8).map((i) => ({
        name: i.memberName, text: `Issued “${i.bookTitle}”`, time: relativeTime(i.issueDate), icon: 'arrow-up-right', tone: 'info',
      }));

      const memberHost = h('div', { className: 'stack-2' });
      const basketHost = h('div');
      const feedHost = h('div');

      const dueDate = new Date(new Date(TODAY).getTime() + LOAN_DAYS * 86400000).toISOString().slice(0, 10);

      const paintFeed = () => { feedHost.innerHTML = ''; feedHost.appendChild(ActivityFeed(feed.slice(0, 10))); };

      const paintMember = () => {
        memberHost.innerHTML = '';
        if (!member) {
          memberHost.appendChild(emptyFor('id-card', 'No member scanned',
            'Scan a library card or search by name to begin. The card number is printed under the barcode.'));
          return;
        }
        const openLoans = db.bookIssues.filter((i) => i.memberId === member.id && i.status !== 'Returned');
        const quotaLeft = Math.max(0, member.maxBooks - openLoans.length - basket.length);
        memberHost.appendChild(h('div', { className: 'ops-memcard' },
          h('div', { className: 'ops-memcard-top' },
            Avatar(member.name, { size: 'lg' }),
            h('div', { className: 'flex-1 min-0' },
              h('div', { className: 't-semibold t-truncate' }, member.name),
              h('div', { className: 't-xs t-muted' }, `${member.memberType} · ${member.className}`),
              h('div', { className: 't-xs t-mono t-muted' }, member.id)),
            Badge(member.status)),
          h('div', { className: 'ops-memcard-body' },
            kv([
              ['Loan quota', `${openLoans.length + basket.length} of ${member.maxBooks} used`],
              ['Lifetime loans', num(member.totalIssued)],
              ['Fine outstanding', money(member.fineOutstanding)],
              ['Member since', dt(member.joinDate)],
            ]),
            ProgressBar(member.maxBooks ? ((openLoans.length + basket.length) / member.maxBooks) * 100 : 0,
              { tone: quotaLeft ? 'brand' : 'danger', label: quotaLeft ? `${quotaLeft} slots left` : 'Quota full', showValue: false }),
            member.fineOutstanding > 0 && Callout({ tone: 'warning', title: 'Fine on the card' },
              `${money(member.fineOutstanding)} is outstanding. Collect it at the fines desk before issuing further titles.`),
            member.status !== 'Active' && Callout({ tone: 'danger', title: `Card ${member.status.toLowerCase()}` },
              'This card cannot borrow until it is reactivated by the librarian.'))));
      };

      const paintBasket = () => {
        basketHost.innerHTML = '';
        if (!basket.length) {
          basketHost.appendChild(Card({ pad: true }, emptyFor('scan', 'Nothing scanned yet',
            'Scan the accession barcode on the inside cover. Each scan adds a row here with a due date 14 days out.')));
          return;
        }
        basketHost.appendChild(DataTable({
          rows: basket.slice(), paginate: false, searchable: false, columnToggle: false, exportable: false,
          columns: [
            { key: 'accessionNo', label: 'Accession', width: 150, className: 't-mono' },
            { key: 'title', label: 'Title', render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.title), h('div', { className: 't-xs t-muted' }, r.author)) },
            { key: 'category', label: 'Subject', width: 150 },
            { key: 'due', label: 'Due back', width: 140, render: () => dt(dueDate) },
            { key: 'rm', label: '', width: 60, align: 'right', sortable: false,
              render: (r) => IconButton('x', { label: `Remove ${r.title}`, size: 'sm', onClick: () => { const i = basket.indexOf(r); if (i >= 0) basket.splice(i, 1); paintBasket(); paintMember(); } }) },
          ],
        }));
      };

      const scanMember = (code) => {
        const found = members.find((m) => m.id.toLowerCase() === code.toLowerCase())
          || members.find((m) => m.refId && m.refId.toLowerCase() === code.toLowerCase())
          || search(members, code, ['name'])[0];
        if (!found) { notify({ title: 'Card not recognised', text: `No member matches “${code}”.`, tone: 'danger', icon: 'alert-circle' }); return; }
        member = found;
        basket.length = 0;
        paintMember(); paintBasket();
        notify({ title: 'Member loaded', text: found.name, tone: 'success', icon: 'id-card' });
      };

      const scanBook = (code) => {
        if (!member) { notify({ title: 'Scan the member card first', tone: 'warning' }); return; }
        const bk = books.find((b) => b.accessionNo.toLowerCase() === code.toLowerCase())
          || books.find((b) => b.id.toLowerCase() === code.toLowerCase())
          || books.find((b) => b.isbn === code)
          || search(books.slice(0, 4000), code, ['title'])[0];
        if (!bk) { notify({ title: 'Book not found', text: `No copy matches “${code}”.`, tone: 'danger', icon: 'alert-circle' }); return; }
        if (bk.availableCopies <= 0) { notify({ title: 'All copies are out', text: `${bk.title} — place a reservation instead.`, tone: 'warning' }); return; }
        if (basket.some((x) => x.id === bk.id)) { notify({ title: 'Already in the basket', text: bk.title, tone: 'info' }); return; }
        const openLoans = db.bookIssues.filter((i) => i.memberId === member.id && i.status !== 'Returned').length;
        if (openLoans + basket.length >= member.maxBooks) { notify({ title: 'Loan quota reached', text: `${member.name} may hold ${member.maxBooks} books at a time.`, tone: 'warning' }); return; }
        basket.push(bk);
        feed.unshift({ name: member.name, text: `Scanned “${bk.title}”`, time: 'just now', icon: 'scan', tone: 'brand' });
        paintBasket(); paintMember(); paintFeed();
      };

      const commit = () => {
        if (!member || !basket.length) { notify({ title: 'Nothing to issue', tone: 'warning' }); return; }
        notify({
          title: `${basket.length} book${basket.length > 1 ? 's' : ''} issued`,
          text: `${member.name} · due back ${formatDate(dueDate, 'medium')}`,
          tone: 'success', icon: 'check-circle',
        });
        basket.length = 0;
        paintBasket(); paintMember();
      };

      paintMember(); paintBasket(); paintFeed();

      mount.appendChild(page({
        title: 'Issue book',
        subtitle: `Loan period ${LOAN_DAYS} days · fine ${money(FINE_PER_DAY)} per day · today ${formatDate(TODAY, 'medium')}`,
        route: 'library/issue',
        actions: pageActions(
          Button('Return desk', { variant: 'secondary', icon: 'arrow-down-right', route: 'library/return' }),
          Button('Issue basket', { variant: 'primary', icon: 'check', onClick: commit })),
        children: h('div', { className: 'detail-split' },
          h('div', { className: 'stack' },
            SectionCard({ title: '1 · Scan the library card', icon: 'id-card' },
              scanConsole({
                placeholder: 'Library card number, student id or name…',
                buttonLabel: 'Load member',
                hint: `Try ${members[0].id} or type a student name. ${num(members.length)} cards are active.`,
                onScan: scanMember,
              })),
            SectionCard({ title: '2 · Scan each book', icon: 'scan',
              subtitle: 'The cursor stays in the field so a hardware scanner can fire one row after another.' },
              h('div', { className: 'stack-3' },
                scanConsole({
                  placeholder: 'Accession barcode, ISBN or title…',
                  buttonLabel: 'Add to basket',
                  hint: `Try ${books[0].accessionNo} · ${books[3].accessionNo} · ${books[9].accessionNo}`,
                  onScan: scanBook,
                }),
                basketHost)),
            SectionCard({ title: '3 · Confirm', icon: 'check-circle',
              subtitle: `All scanned titles fall due on ${formatDate(dueDate, 'medium')}.` },
              h('div', { className: 'row-3 row-wrap' },
                Button('Issue basket', { variant: 'primary', icon: 'check', onClick: commit }),
                Button('Print slip', { variant: 'secondary', icon: 'print', onClick: mockAction('Print issue slip') }),
                Button('Clear', { variant: 'ghost', icon: 'x', onClick: () => { basket.length = 0; paintBasket(); paintMember(); } })))),
          h('div', { className: 'stack-3' },
            SectionCard({ title: 'Member', icon: 'user' }, memberHost),
            SectionCard({ title: 'Desk activity', icon: 'history', subtitle: 'Most recent scans and issues' }, feedHost),
            Callout({ tone: 'info', title: 'Circulation rules' },
              h('ul', { style: { margin: 0, paddingInlineStart: 'var(--sp-4)' } },
                h('li', null, 'Students of Class XI–XII may hold 4 books; everyone else 2.'),
                h('li', null, 'Staff cards allow 6 books for 28 days.'),
                h('li', null, `Overdue fine is ${money(FINE_PER_DAY)} per day per book, capped at the replacement price.`),
                h('li', null, 'Reference and rare titles are consultation-only.'))))),
      }));
    },
  },

  /* ----------------------------------------------------- library/return */
  'library/return': {
    title: 'Return Book',
    subtitle: 'Scan to check a copy back in and settle the fine',
    section: 'library',
    render(mount) {
      ensureStyles();
      const open = db.bookIssues.filter((i) => i.status !== 'Returned');
      const returnedToday = [];
      const listHost = h('div');
      const summaryHost = h('div', { className: 'stack-2' });

      const paintSummary = () => {
        summaryHost.innerHTML = '';
        const fines = returnedToday.reduce((a, r) => a + r.fine, 0);
        summaryHost.appendChild(kv([
          ['Checked in this session', String(returnedToday.length)],
          ['Fines assessed', money(fines)],
          ['Waived', money(returnedToday.filter((r) => r.waived).reduce((a, r) => a + r.fine, 0))],
        ]));
        summaryHost.appendChild(h('div', { className: 't-xs t-muted' },
          `${num(open.length)} copies are currently out, of which ${num(open.filter((i) => i.status === 'Overdue').length)} are overdue.`));
      };

      const paintList = () => {
        listHost.innerHTML = '';
        if (!returnedToday.length) {
          listHost.appendChild(Card({ pad: true }, emptyFor('arrow-down-right', 'No returns yet',
            'Scan the accession barcode inside the back cover. Overdue fines are calculated automatically as each copy is checked in.')));
          return;
        }
        listHost.appendChild(DataTable({
          rows: returnedToday.slice(), paginate: false, searchable: false, columnToggle: false, exportable: false,
          columns: [
            { key: 'accessionNo', label: 'Accession', width: 150, className: 't-mono' },
            { key: 'bookTitle', label: 'Title', render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.bookTitle), h('div', { className: 't-xs t-muted' }, r.memberName)) },
            { key: 'dueDate', label: 'Was due', width: 130, render: (r) => dt(r.dueDate) },
            { key: 'late', label: 'Days late', width: 110, align: 'right', numeric: true, render: (r) => (r.late > 0 ? h('span', { className: 't-danger t-semibold' }, String(r.late)) : h('span', { className: 't-success' }, 'On time')) },
            { key: 'fine', label: 'Fine', width: 120, align: 'right', numeric: true, render: (r) => (r.waived ? h('span', { className: 't-muted' }, `${money(r.fine)} waived`) : money(r.fine)) },
            { key: 'act', label: '', width: 110, align: 'right', sortable: false,
              render: (r) => (r.fine > 0 && !r.waived
                ? Button('Waive', { variant: 'ghost', size: 'sm', icon: 'percent', onClick: () => { r.waived = true; paintList(); paintSummary(); notify({ title: 'Fine waived', text: r.memberName, tone: 'info' }); } })
                : Badge(r.condition || 'Good')) },
          ],
        }));
      };

      const scanReturn = (code) => {
        const rec = open.find((i) => i.accessionNo.toLowerCase() === code.toLowerCase())
          || open.find((i) => i.id.toLowerCase() === code.toLowerCase())
          || search(open, code, ['bookTitle', 'memberName'])[0];
        if (!rec) { notify({ title: 'No open loan', text: `“${code}” is not on issue right now.`, tone: 'danger', icon: 'alert-circle' }); return; }
        if (returnedToday.some((r) => r.id === rec.id)) { notify({ title: 'Already checked in', text: rec.bookTitle, tone: 'info' }); return; }
        const late = Math.max(0, -daysFromToday(rec.dueDate));
        const row = { ...rec, late, fine: late * FINE_PER_DAY, waived: false, condition: pickOf(['Good', 'Good', 'Fair', 'Damaged'], rec.id) };
        returnedToday.unshift(row);
        paintList(); paintSummary();
        notify({
          title: late ? `Returned ${late} day${late > 1 ? 's' : ''} late` : 'Returned on time',
          text: `${rec.bookTitle} — ${late ? money(late * FINE_PER_DAY) + ' fine due' : 'no fine'}`,
          tone: late ? 'warning' : 'success', icon: late ? 'alert-triangle' : 'check-circle',
        });
      };

      const calculator = () => {
        let days = 5; let books = 1;
        const out = h('div', { className: 't-hero t-brand' }, money(days * books * FINE_PER_DAY));
        const recalc = () => { out.textContent = money(days * books * FINE_PER_DAY); };
        Modal({
          title: 'Fine calculator', size: 'sm', icon: 'calculator',
          body: h('div', { className: 'stack-3' },
            Field({ label: 'Days overdue' }, Input({ type: 'number', value: String(days), onInput: (v) => { days = Number(v) || 0; recalc(); } })),
            Field({ label: 'Number of books' }, Input({ type: 'number', value: String(books), onInput: (v) => { books = Number(v) || 0; recalc(); } })),
            Divider({ label: 'Payable' }),
            out,
            h('div', { className: 't-xs t-muted' }, `Rate ${money(FINE_PER_DAY)} per book per day, capped at the replacement price of the title.`)),
          actions: (close) => Button('Close', { variant: 'secondary', onClick: close }),
        });
      };

      paintList(); paintSummary();

      mount.appendChild(page({
        title: 'Return book',
        subtitle: `${num(open.length)} copies on loan · ${num(open.filter((i) => i.status === 'Overdue').length)} overdue`,
        route: 'library/return',
        actions: pageActions(
          Button('Fine calculator', { variant: 'secondary', icon: 'calculator', onClick: calculator }),
          Button('Issue desk', { variant: 'primary', icon: 'arrow-up-right', route: 'library/issue' })),
        children: h('div', { className: 'detail-split' },
          h('div', { className: 'stack' },
            SectionCard({ title: 'Scan to check in', icon: 'scan',
              subtitle: 'The field keeps focus so a hardware scanner can work through a returns trolley without touching the keyboard.' },
              scanConsole({
                placeholder: 'Accession barcode or issue id…',
                buttonLabel: 'Check in',
                hint: open.length ? `Try ${open[0].accessionNo} · ${open[1] ? open[1].accessionNo : ''} · ${open[2] ? open[2].accessionNo : ''}` : null,
                onScan: scanReturn,
              })),
            SectionCard({ title: 'Checked in this session', icon: 'history', flush: true }, listHost)),
          h('div', { className: 'stack-3' },
            SectionCard({ title: 'Session summary', icon: 'calculator' }, summaryHost),
            SectionCard({ title: 'Longest overdue', icon: 'alert-triangle', flush: true },
              DataTable({
                rows: sortBy(open.filter((i) => i.status === 'Overdue'), (r) => daysFromToday(r.dueDate)).slice(0, 40),
                pageSize: 6, searchable: false, columnToggle: false, exportable: false,
                columns: [
                  { key: 'memberName', label: 'Member', render: (r) => Identity(r.memberName, r.className || r.memberType) },
                  { key: 'dueDate', label: 'Days late', width: 100, align: 'right', numeric: true, value: (r) => -daysFromToday(r.dueDate), render: (r) => h('span', { className: 't-danger t-semibold' }, String(-daysFromToday(r.dueDate))) },
                ],
                emptyState: emptyFor('check-circle', 'Nothing overdue', 'Every loan is inside its due date.'),
              })),
            Callout({ tone: 'warning', title: 'Damaged on return?' },
              'Set the condition to Damaged as you check the copy in — it moves straight to the lost & damaged register with a replacement charge suggestion.'))),
      }));
    },
  },

  /* ------------------------------------------------------ library/renew */
  'library/renew': {
    title: 'Renew',
    subtitle: 'Extend a loan without a trip to the shelf',
    section: 'library',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.bookIssues.filter((i) => i.status !== 'Returned'), ctx).map((i) => ({
        ...i,
        daysLeft: daysFromToday(i.dueDate),
        renewable: i.renewals < MAX_RENEWALS && i.status !== 'Overdue',
        fine: fineDue(i),
      }));

      mount.appendChild(listPage({
        title: 'Renew loans',
        subtitle: `${num(rows.length)} live loans · up to ${MAX_RENEWALS} renewals of ${LOAN_DAYS} days each`,
        route: 'library/renew',
        actions: pageActions(
          Button('Return desk', { variant: 'secondary', icon: 'arrow-down-right', route: 'library/return' }),
          Button('Renew all eligible', { variant: 'primary', icon: 'refresh', onClick: () => notify({ title: `${rows.filter((r) => r.renewable).length} loans renewed`, text: `New due date ${formatDate(new Date(new Date(TODAY).getTime() + LOAN_DAYS * 86400000).toISOString().slice(0, 10), 'medium')}`, tone: 'success' }) })),
        kpis: [
          { label: 'Live loans', value: num(rows.length), icon: 'book', tone: 'brand' },
          { label: 'Renewable now', value: num(rows.filter((r) => r.renewable).length), icon: 'refresh', tone: 'success' },
          { label: 'Renewal limit hit', value: num(rows.filter((r) => r.renewals >= MAX_RENEWALS).length), icon: 'lock', tone: 'warning' },
          { label: 'Blocked by overdue', value: num(rows.filter((r) => r.status === 'Overdue').length), icon: 'alert-triangle', tone: 'danger' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Member, title or accession…', width: '260px' },
          { id: 'status', label: 'Status', options: ['Issued', 'Overdue'] },
          { id: 'memberType', label: 'Member type', options: ['Student', 'Staff'] },
          { id: 'window', label: 'Due', options: [{ value: 'soon', label: 'Due within 3 days' }, { value: 'late', label: 'Already late' }] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.memberName} ${r.bookTitle} ${r.accessionNo}`.toLowerCase().includes(String(x).toLowerCase()),
          status: (r, x) => r.status === x,
          memberType: (r, x) => r.memberType === x,
          window: (r, x) => (x === 'soon' ? r.daysLeft >= 0 && r.daysLeft <= 3 : r.daysLeft < 0),
        })),
        columns: [
          { key: 'memberName', label: 'Member', sticky: true, width: 220, render: (r) => Identity(r.memberName, `${r.className || r.memberType} · ${r.memberId}`) },
          { key: 'bookTitle', label: 'Title', width: 300, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.bookTitle), h('div', { className: 't-xs t-mono t-muted' }, r.accessionNo)) },
          { key: 'issueDate', label: 'Issued', width: 130, render: (r) => dt(r.issueDate) },
          { key: 'dueDate', label: 'Due', width: 130, render: (r) => dt(r.dueDate) },
          { key: 'daysLeft', label: 'Days left', width: 110, align: 'right', numeric: true,
            render: (r) => (r.daysLeft < 0 ? h('span', { className: 't-danger t-semibold' }, `${-r.daysLeft} late`) : h('span', { className: r.daysLeft <= 3 ? 't-warning' : '' }, String(r.daysLeft))) },
          { key: 'renewals', label: 'Renewals', width: 110, align: 'right', numeric: true, render: (r) => `${r.renewals} / ${MAX_RENEWALS}` },
          { key: 'fine', label: 'Fine', width: 110, align: 'right', numeric: true, render: (r) => money(r.fine), aggregate: 'sum', format: moneyC },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
          { key: 'act', label: 'Renew', width: 120, align: 'right', sortable: false,
            render: (r) => Button('Renew', {
              variant: r.renewable ? 'secondary' : 'ghost', size: 'sm', icon: 'refresh', disabled: !r.renewable,
              onClick: (e) => { e.stopPropagation(); notify({ title: 'Loan renewed', text: `${r.bookTitle} — now due ${formatDate(new Date(new Date(TODAY).getTime() + LOAN_DAYS * 86400000).toISOString().slice(0, 10), 'medium')}`, tone: 'success' }); },
            }) },
        ],
        rows,
        selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['memberName', 'bookTitle', 'accessionNo'],
        bulkActions: [
          { label: 'Renew selected', icon: 'refresh', onClick: (sel) => notify({ title: `${sel.length} loans renewed`, tone: 'success' }) },
          { label: 'Send due reminder', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} reminders queued`, tone: 'info' }) },
        ],
        rowActions: (r) => [
          { label: 'Open title', icon: 'book', route: `library/catalog/${r.bookId}` },
          { label: 'Return this copy', icon: 'arrow-down-right', route: 'library/return' },
          { label: 'Student profile', icon: 'user', route: r.studentId ? `students/profile/${r.studentId}` : 'library/members' },
        ],
        emptyState: emptyFor('refresh', 'No live loans', 'Nothing is out on loan for this campus right now.'),
      }));
    },
  },

  /* ----------------------------------------------- library/reservations */
  'library/reservations': {
    title: 'Reservations',
    subtitle: 'Hold queue for titles where every copy is out',
    section: 'library',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(reservations(), ctx);
      const waiting = rows.filter((r) => r.status === 'Waiting');
      const ready = rows.filter((r) => r.status === 'Ready for Pickup');

      mount.appendChild(listPage({
        title: 'Reservations',
        subtitle: `${rows.length} holds · ${ready.length} ready for collection`,
        route: 'library/reservations',
        actions: pageActions(
          Button('Notify ready holds', { variant: 'secondary', icon: 'send', onClick: () => notify({ title: `${ready.length} members notified`, text: 'SMS + app notification queued.', tone: 'success' }) }),
          Button('New reservation', { variant: 'primary', icon: 'bookmark', onClick: () => Modal({
            title: 'Place a reservation', size: 'md', icon: 'bookmark',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Member', required: true, className: 'col-span-full' },
                Combobox({ options: db.libraryMembers.slice(0, 200).map((m) => ({ value: m.id, label: `${m.name} · ${m.id}` })), placeholder: 'Search a member…' })),
              Field({ label: 'Title', required: true, className: 'col-span-full' },
                Combobox({ options: db.books.slice(0, 200).map((b) => ({ value: b.id, label: b.title })), placeholder: 'Search the catalogue…' })),
              Field({ label: 'Needed by' }, DatePicker({ value: TODAY })),
              Field({ label: 'Notify by' }, Select({ options: ['SMS', 'Email', 'App notification'], value: 'SMS' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Place hold', { variant: 'primary', onClick: () => { close(); saved('Reservation'); } })),
          }) })),
        kpis: [
          { label: 'Open holds', value: String(waiting.length), icon: 'bookmark', tone: 'brand' },
          { label: 'Ready for pickup', value: String(ready.length), icon: 'check-circle', tone: 'success' },
          { label: 'Avg queue position', value: (rows.reduce((a, r) => a + r.queuePos, 0) / Math.max(1, rows.length)).toFixed(1), icon: 'users', tone: 'info' },
          { label: 'Cancelled', value: String(rows.filter((r) => r.status === 'Cancelled').length), icon: 'x-circle', tone: 'danger' },
        ],
        tabs: [
          { id: 'all', label: 'All holds', count: rows.length },
          { id: 'waiting', label: 'Waiting', count: waiting.length },
          { id: 'ready', label: 'Ready', count: ready.length },
        ],
        activeTab: 'all',
        onTabChange: (id) => notify({ title: `Showing ${id} holds`, tone: 'info' }),
        chart: barChart({
          categories: countBy(rows, 'category').slice(0, 8).map((c) => c.key),
          series: [{ name: 'Holds', values: countBy(rows, 'category').slice(0, 8).map((c) => c.value) }],
          height: 240, showValues: true,
        }),
        chartTitle: 'Where the demand is — holds by subject',
        columns: [
          { key: 'memberName', label: 'Member', sticky: true, width: 220, render: (r) => Identity(r.memberName, `${r.memberType} · ${r.className}`) },
          { key: 'bookTitle', label: 'Title', width: 280, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.bookTitle), h('div', { className: 't-xs t-mono t-muted' }, r.accessionNo)) },
          { key: 'category', label: 'Subject', width: 160, filter: true },
          { key: 'placedOn', label: 'Placed', width: 130, render: (r) => dt(r.placedOn) },
          { key: 'queuePos', label: 'Queue', width: 90, align: 'right', numeric: true },
          { key: 'expectedOn', label: 'Expected', width: 130, render: (r) => dt(r.expectedOn) },
          { key: 'status', label: 'Status', width: 160, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, pageSize: 25,
        searchKeys: ['memberName', 'bookTitle', 'accessionNo'],
        bulkActions: [
          { label: 'Notify members', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} members notified`, tone: 'success' }) },
          { label: 'Cancel holds', icon: 'x-circle', tone: 'danger', onClick: (sel) => confirmDanger('Cancel these holds?', `${sel.length} members will lose their place in the queue.`, () => notify({ title: 'Holds cancelled', tone: 'success' }), 'Cancel holds') },
        ],
        rowActions: (r) => [
          { label: 'Open title', icon: 'book', route: `library/catalog/${r.bookId}` },
          { label: 'Notify member', icon: 'send', onClick: () => notify({ title: 'Member notified', text: r.memberName, tone: 'success' }) },
          { label: 'Convert to issue', icon: 'arrow-up-right', route: 'library/issue' },
          { separator: true },
          { label: 'Cancel hold', icon: 'x-circle', tone: 'danger', onClick: () => confirmDanger('Cancel this hold?', `${r.memberName} will be removed from the queue for ${r.bookTitle}.`, () => notify({ title: 'Hold cancelled', tone: 'success' }), 'Cancel hold') },
        ],
        emptyState: emptyFor('bookmark', 'No reservations', 'Every requested title is currently on the shelf.'),
      }));
    },
  },

  /* ------------------------------------------------------ library/fines */
  'library/fines': {
    title: 'Fines',
    subtitle: 'Overdue charges, waivers and collection',
    section: 'library',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.bookIssues.filter((i) => fineDue(i) > 0), ctx).map((i) => ({
        ...i, fineAmount: fineDue(i), daysLate: Math.max(0, -daysFromToday(i.dueDate)),
        settlement: i.finePaid ? 'Paid' : 'Pending',
      }));
      const total = rows.reduce((a, r) => a + r.fineAmount, 0);

      const collect = (r) => Modal({
        title: 'Collect fine', subtitle: `${r.memberName} · ${r.bookTitle}`, size: 'md', icon: 'rupee', tone: 'brand',
        body: h('div', { className: 'stack-3' },
          kv([
            ['Book', r.bookTitle],
            ['Due date', dt(r.dueDate)],
            ['Days late', String(r.daysLate)],
            ['Rate', `${money(FINE_PER_DAY)} / day`],
            ['Payable', h('span', { className: 't-semibold t-danger' }, money(r.fineAmount))],
          ]),
          FormGrid({ cols: 2 },
            Field({ label: 'Amount collected', required: true }, Input({ type: 'number', value: String(r.fineAmount) })),
            Field({ label: 'Mode' }, Select({ options: ['Cash', 'UPI', 'Card', 'Adjust against deposit'], value: 'UPI' })),
            Field({ label: 'Receipt no' }, Input({ value: `LF/26-27/${r.id.slice(-4)}` })),
            Field({ label: 'Waive fully', className: 'col-span-full' }, Switch('Waive this fine with the principal’s approval', { description: 'A waiver note is recorded in the audit log.' }))),
        ),
        actions: (close) => frag(
          Button('Cancel', { variant: 'ghost', onClick: close }),
          Button('Record payment', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Fine collected', text: `${money(r.fineAmount)} from ${r.memberName}`, tone: 'success' }); } })),
      });

      mount.appendChild(listPage({
        title: 'Fines',
        subtitle: `${rows.length} chargeable loans · ${money(total)} outstanding`,
        route: 'library/fines',
        actions: pageActions(
          Button('Send reminders', { variant: 'secondary', icon: 'send', onClick: () => notify({ title: `${rows.length} reminders queued`, text: 'SMS to the registered guardian number.', tone: 'success' }) }),
          Button('Day-end report', { variant: 'primary', icon: 'chart-bar', route: 'library/reports' })),
        kpis: [
          { label: 'Outstanding', value: moneyC(total), icon: 'rupee', tone: 'danger' },
          { label: 'Chargeable loans', value: String(rows.length), icon: 'alert-triangle', tone: 'warning' },
          { label: 'Avg fine', value: money(Math.round(total / Math.max(1, rows.length))), icon: 'calculator', tone: 'info' },
          { label: 'Worst delay', value: `${rows.reduce((a, r) => Math.max(a, r.daysLate), 0)} days`, icon: 'timer', tone: 'brand' },
        ],
        chart: barChart({
          categories: ['1–3 days', '4–7 days', '8–14 days', '15–30 days', '30+ days'],
          series: [{ name: 'Loans', values: [
            rows.filter((r) => r.daysLate <= 3).length,
            rows.filter((r) => r.daysLate > 3 && r.daysLate <= 7).length,
            rows.filter((r) => r.daysLate > 7 && r.daysLate <= 14).length,
            rows.filter((r) => r.daysLate > 14 && r.daysLate <= 30).length,
            rows.filter((r) => r.daysLate > 30).length,
          ] }],
          height: 240, showValues: true,
        }),
        chartTitle: 'Ageing of overdue loans',
        columns: [
          { key: 'memberName', label: 'Member', sticky: true, width: 220, render: (r) => Identity(r.memberName, `${r.className || r.memberType} · ${r.memberId}`) },
          { key: 'bookTitle', label: 'Title', width: 280, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.bookTitle), h('div', { className: 't-xs t-mono t-muted' }, r.accessionNo)) },
          { key: 'dueDate', label: 'Due', width: 130, render: (r) => dt(r.dueDate) },
          { key: 'daysLate', label: 'Days late', width: 110, align: 'right', numeric: true, render: (r) => h('span', { className: 't-danger t-semibold' }, String(r.daysLate)) },
          { key: 'fineAmount', label: 'Fine', width: 120, align: 'right', numeric: true, render: (r) => money(r.fineAmount), aggregate: 'sum', format: moneyC },
          { key: 'settlement', label: 'Settlement', width: 130, filter: true, render: (r) => Badge(r.settlement) },
          { key: 'act', label: '', width: 130, align: 'right', sortable: false,
            render: (r) => Button('Collect', { variant: 'secondary', size: 'sm', icon: 'rupee', onClick: (e) => { e.stopPropagation(); collect(r); } }) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['memberName', 'bookTitle', 'accessionNo'],
        bulkActions: [
          { label: 'Send reminder', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} reminders sent`, tone: 'success' }) },
          { label: 'Waive selected', icon: 'percent', tone: 'danger', onClick: (sel) => confirmDanger('Waive these fines?', `${money(sel.reduce((a, r) => a + r.fineAmount, 0))} would be written off and logged against your user.`, () => notify({ title: 'Fines waived', tone: 'success' }), 'Waive') },
        ],
        onRowClick: (r) => collect(r),
        emptyState: emptyFor('check-circle', 'No fines outstanding', 'Every loan has been returned inside its due date.'),
      }));
    },
  },

  /* ----------------------------------------------- library/lost-damaged */
  'library/lost-damaged': {
    title: 'Lost / Damaged',
    subtitle: 'Write-offs, replacement charges and repair queue',
    section: 'library',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(bookCopies(900).filter((c) => c.condition === 'Damaged' || c.status === 'Lost' || c.condition === 'Lost'), ctx)
        .map((c, i) => {
          const lost = c.status === 'Lost' || c.condition === 'Lost';
          return {
            ...c,
            caseNo: `LD/26-27/${String(i + 1).padStart(4, '0')}`,
            kind: lost ? 'Lost' : 'Damaged',
            reportedOn: `2026-0${6 + (hashOf('ld' + c.id) % 3)}-${String(1 + (hashOf('ldd' + c.id) % 27)).padStart(2, '0')}`,
            reportedBy: pickOf(['Circulation Desk', 'Shelf Audit', 'Member Declaration', 'Return Desk'], 'rb' + c.id),
            charge: lost ? c.price : Math.round(c.price * 0.35),
            recovery: pickOf(['Recovered', 'Pending', 'Pending', 'Waived'], 'rc' + c.id),
            action: lost ? 'Replacement charged' : pickOf(['Sent for binding', 'Repaired in-house', 'Written off'], 'ac' + c.id),
          };
        });

      mount.appendChild(listPage({
        title: 'Lost & damaged',
        subtitle: `${rows.length} open cases · ${moneyC(rows.reduce((a, r) => a + r.charge, 0))} in replacement value`,
        route: 'library/lost-damaged',
        actions: pageActions(
          Button('Write-off note', { variant: 'secondary', icon: 'file-text', onClick: mockAction('Generate write-off note') }),
          Button('Report a case', { variant: 'primary', icon: 'alert-triangle', onClick: () => Modal({
            title: 'Report lost or damaged copy', size: 'md', icon: 'alert-triangle', tone: 'warning',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Accession barcode', required: true, className: 'col-span-full' }, Input({ placeholder: 'ACC-000123-01' })),
              Field({ label: 'Case type', required: true }, Select({ options: ['Lost', 'Damaged'], value: 'Damaged' })),
              Field({ label: 'Reported by' }, Select({ options: ['Circulation Desk', 'Shelf Audit', 'Member Declaration', 'Return Desk'] })),
              Field({ label: 'Replacement charge (₹)' }, Input({ type: 'number', placeholder: '450' })),
              Field({ label: 'Recover from member' }, Switch('Raise a charge on the member card', { checked: true })),
              Field({ label: 'Notes', className: 'col-span-full' }, Textarea({ rows: 3, placeholder: 'Water damage to pages 40–58; spine detached.' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Log case', { variant: 'primary', onClick: () => { close(); saved('Case'); } })),
          }) })),
        kpis: [
          { label: 'Lost copies', value: String(rows.filter((r) => r.kind === 'Lost').length), icon: 'alert-triangle', tone: 'danger' },
          { label: 'Damaged copies', value: String(rows.filter((r) => r.kind === 'Damaged').length), icon: 'tool', tone: 'warning' },
          { label: 'Replacement value', value: moneyC(rows.reduce((a, r) => a + r.charge, 0)), icon: 'rupee', tone: 'info' },
          { label: 'Recovered', value: String(rows.filter((r) => r.recovery === 'Recovered').length), icon: 'check-circle', tone: 'success' },
        ],
        chart: donutChart({
          data: countBy(rows, 'action').map((c) => ({ key: c.key, value: c.value })),
          height: 250, centerLabel: 'Cases', centerValue: String(rows.length),
        }),
        chartTitle: 'How cases were resolved',
        columns: [
          { key: 'caseNo', label: 'Case', sticky: true, width: 160, className: 't-mono' },
          { key: 'title', label: 'Title', width: 280, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.title), h('div', { className: 't-xs t-mono t-muted' }, r.barcode)) },
          { key: 'kind', label: 'Type', width: 120, filter: true, render: (r) => Badge(r.kind === 'Lost' ? 'Lost' : 'Damaged', { tone: r.kind === 'Lost' ? 'danger' : 'warning' }) },
          { key: 'reportedOn', label: 'Reported', width: 130, render: (r) => dt(r.reportedOn) },
          { key: 'reportedBy', label: 'Source', width: 170, filter: true },
          { key: 'charge', label: 'Charge', width: 120, align: 'right', numeric: true, render: (r) => money(r.charge), aggregate: 'sum', format: moneyC },
          { key: 'action', label: 'Action', width: 180, filter: true },
          { key: 'recovery', label: 'Recovery', width: 130, filter: true, render: (r) => Badge(r.recovery === 'Recovered' ? 'Paid' : r.recovery === 'Waived' ? 'Cancelled' : 'Pending') },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['caseNo', 'title', 'barcode'],
        bulkActions: [
          { label: 'Mark recovered', icon: 'check-circle', onClick: (sel) => notify({ title: `${sel.length} cases closed`, tone: 'success' }) },
          { label: 'Write off', icon: 'trash', tone: 'danger', onClick: (sel) => confirmDanger('Write off these copies?', `${sel.length} copies will be removed from the stock register.`, () => notify({ title: 'Written off', tone: 'success' }), 'Write off') },
        ],
        rowActions: (r) => [
          { label: 'Open title', icon: 'book', route: `library/catalog/${r.bookId}` },
          { label: 'Charge the member', icon: 'rupee', route: 'library/fines' },
          { label: 'Order replacement', icon: 'shopping-cart', route: 'inventory/purchase-requests' },
        ],
        emptyState: emptyFor('check-circle', 'Nothing lost or damaged', 'The whole collection is accounted for and in usable condition.'),
      }));
    },
  },

  /* ---------------------------------------------------- library/members */
  'library/members': {
    title: 'Members',
    subtitle: 'Library cards, quotas and borrowing history',
    section: 'library',
    render(mount, ctx) {
      ensureStyles();
      const all = scope(db.libraryMembers, ctx);
      let view = 'cards';
      let values = {};
      const map = {
        q: (r, v) => `${r.name} ${r.id} ${r.className}`.toLowerCase().includes(String(v).toLowerCase()),
        memberType: (r, v) => r.memberType === v,
        status: (r, v) => r.status === v,
        fines: (r, v) => (v === 'yes' ? r.fineOutstanding > 0 : r.fineOutstanding === 0),
      };
      const host = h('div', { className: 'stack' });
      const countLabel = h('div', { className: 't-sm t-muted t-nowrap' });

      const memberDrawer = (m) => {
        const loans = db.bookIssues.filter((i) => i.memberId === m.id);
        openDrawer(m.name, `${m.memberType} · ${m.className} · card ${m.id}`,
          h('div', { className: 'stack-3' },
            h('div', { className: 'ops-memcard' },
              h('div', { className: 'ops-memcard-top' },
                Avatar(m.name, { size: 'lg' }),
                h('div', { className: 'flex-1 min-0' },
                  h('div', { className: 't-semibold' }, m.name),
                  h('div', { className: 't-xs t-muted' }, `${m.memberType} · ${m.className}`)),
                qrTile(m.id)),
              h('div', { className: 'ops-memcard-body' },
                kv([
                  ['Card number', m.id],
                  ['Reference', m.refId],
                  ['Member since', dt(m.joinDate)],
                  ['Quota', `${m.currentIssued} of ${m.maxBooks} in use`],
                  ['Lifetime loans', num(m.totalIssued)],
                  ['Fine outstanding', money(m.fineOutstanding)],
                ]),
                ProgressBar(m.maxBooks ? (m.currentIssued / m.maxBooks) * 100 : 0, { tone: m.currentIssued >= m.maxBooks ? 'danger' : 'brand', showValue: true }))),
            SectionCard({ title: 'Loan history', subtitle: `${loans.length} recorded loans`, flush: true },
              loans.length ? DataTable({
                rows: loans, pageSize: 8, searchable: false, exportable: false, columnToggle: false,
                columns: [
                  { key: 'bookTitle', label: 'Title', render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.bookTitle), h('div', { className: 't-xs t-mono t-muted' }, r.accessionNo)) },
                  { key: 'issueDate', label: 'Issued', width: 120, render: (r) => dt(r.issueDate) },
                  { key: 'status', label: 'Status', width: 110, render: (r) => Badge(r.status) },
                  { key: 'fine', label: 'Fine', width: 100, align: 'right', numeric: true, render: (r) => money(fineDue(r)) },
                ],
              }) : h('div', { className: 'card-pad' }, emptyFor('book', 'No loans yet', 'This card has never been used to borrow a title.')))),
          (close) => frag(
            Button('Print card', { variant: 'secondary', icon: 'print', onClick: mockAction('Print library card') }),
            Button('Issue a book', { variant: 'primary', icon: 'arrow-up-right', onClick: () => { close(); navigate('library/issue'); } })));
      };

      const columns = [
        { key: 'name', label: 'Member', sticky: true, width: 240, render: (r) => Identity(r.name, `${r.memberType} · ${r.className}`) },
        { key: 'id', label: 'Card no', width: 150, className: 't-mono' },
        { key: 'memberType', label: 'Type', width: 110, filter: true },
        { key: 'className', label: 'Class / dept', width: 170, filter: true },
        { key: 'joinDate', label: 'Since', width: 130, render: (r) => dt(r.joinDate) },
        { key: 'currentIssued', label: 'On loan', width: 110, align: 'right', numeric: true, render: (r) => `${r.currentIssued} / ${r.maxBooks}` },
        { key: 'totalIssued', label: 'Lifetime', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
        { key: 'fineOutstanding', label: 'Fine due', width: 130, align: 'right', numeric: true, render: (r) => (r.fineOutstanding ? h('span', { className: 't-danger t-semibold' }, money(r.fineOutstanding)) : '—'), aggregate: 'sum', format: moneyC },
        { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
      ];

      const paint = () => {
        const rows = applyAll(all, values, map);
        host.innerHTML = '';
        countLabel.textContent = `${num(rows.length)} members`;
        if (!rows.length) {
          host.appendChild(Card({ pad: true }, noResults('members',
            Button('Clear filters', { variant: 'secondary', icon: 'refresh-ccw', onClick: () => { values = {}; paint(); } }))));
          return;
        }
        if (view === 'cards') {
          const slice = rows.slice(0, 48);
          host.appendChild(Card({ pad: true },
            h('div', { className: 'ops-tiles ops-tiles-wide' },
              slice.map((m) => h('button', { className: 'ops-tile', type: 'button', attrs: { 'aria-label': `Open ${m.name}` }, onClick: () => memberDrawer(m) },
                h('div', { className: 'ops-memcard-top' },
                  Avatar(m.name, { size: 'md' }),
                  h('div', { className: 'flex-1 min-0', style: { textAlign: 'left' } },
                    h('div', { className: 't-semibold t-truncate' }, m.name),
                    h('div', { className: 't-xs t-muted t-truncate' }, `${m.memberType} · ${m.className}`)),
                  Badge(m.status, { size: 'sm' })),
                h('div', { className: 'ops-tile-body' },
                  h('div', { className: 't-xs t-mono t-muted' }, m.id),
                  ProgressBar(m.maxBooks ? (m.currentIssued / m.maxBooks) * 100 : 0, { size: 'sm', tone: m.currentIssued >= m.maxBooks ? 'danger' : 'brand' }),
                  h('div', { className: 'row', style: { gap: 'var(--sp-2)' } },
                    h('span', { className: 't-xs t-muted' }, `${m.currentIssued}/${m.maxBooks} on loan`),
                    m.fineOutstanding > 0 && Badge(money(m.fineOutstanding), { tone: 'danger', size: 'sm' })))))),
            rows.length > slice.length
              ? h('div', { className: 'row mt-4', style: { justifyContent: 'center' } },
                h('span', { className: 't-sm t-muted t-center' }, `Showing ${slice.length} of ${num(rows.length)} cards — switch to the table for the full roll.`))
              : null));
        } else {
          host.appendChild(DataTable({
            columns, rows, pageSize: 25, selectable: true, footerAggregates: true,
            searchKeys: ['name', 'id', 'className'], exportName: 'library-members',
            bulkActions: [
              { label: 'Print cards', icon: 'print', onClick: (sel) => notify({ title: `${sel.length} cards queued`, tone: 'success' }) },
              { label: 'Send fine reminder', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} reminders sent`, tone: 'info' }) },
              { label: 'Suspend cards', icon: 'lock', tone: 'danger', onClick: (sel) => confirmDanger('Suspend these cards?', `${sel.length} members will be blocked from borrowing.`, () => notify({ title: 'Cards suspended', tone: 'success' }), 'Suspend') },
            ],
            onRowClick: memberDrawer,
            rowActions: (r) => [
              { label: 'Open card', icon: 'id-card', onClick: () => memberDrawer(r) },
              { label: 'Issue a book', icon: 'arrow-up-right', route: 'library/issue' },
              r.refId && r.memberType === 'Student' ? { label: 'Student profile', icon: 'user', route: `students/profile/${r.refId}` } : null,
            ].filter(Boolean),
            emptyState: noResults('members'),
          }));
        }
      };

      paint();

      mount.appendChild(page({
        title: 'Library members',
        subtitle: `${num(all.length)} cards issued · ${num(all.filter((m) => m.status === 'Active').length)} active`,
        route: 'library/members',
        actions: pageActions(
          Button('Print card batch', { variant: 'secondary', icon: 'print', onClick: mockAction('Print card batch') }),
          Button('Enrol member', { variant: 'primary', icon: 'user-plus', onClick: () => Modal({
            title: 'Enrol a library member', size: 'md', icon: 'user-plus',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Member type', required: true }, Select({ options: ['Student', 'Staff'], value: 'Student' })),
              Field({ label: 'Reference id', required: true }, Input({ placeholder: 'STU00042 / EMP0102' })),
              Field({ label: 'Book quota' }, Input({ type: 'number', value: '2' })),
              Field({ label: 'Valid till' }, DatePicker({ value: '2027-03-31' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Enrol', { variant: 'primary', onClick: () => { close(); saved('Member'); } })),
          }) })),
        filters: FilterBar({
          filters: [
            { id: 'q', type: 'search', label: 'Search', placeholder: 'Name, card number or class…', width: '260px' },
            { id: 'memberType', label: 'Type', options: ['Student', 'Staff'] },
            { id: 'status', label: 'Status', options: ['Active', 'Suspended', 'Expired'] },
            { id: 'fines', label: 'Fines', options: [{ value: 'yes', label: 'Has a fine' }, { value: 'no', label: 'Clear' }] },
          ],
          onChange: (id, v, all2) => { values = all2; paint(); },
          actions: h('div', { className: 'row-3' }, countLabel,
            SegmentedControl([{ id: 'cards', label: 'Cards', icon: 'id-card' }, { id: 'table', label: 'Table', icon: 'table' }],
              (v) => { view = v; paint(); }, { active: view })),
        }),
        children: host,
      }));
    },
  },

  /* ---------------------------------------------------- library/digital */
  'library/digital': {
    title: 'Digital Library',
    subtitle: 'E-books, journals and streaming resources',
    section: 'library',
    render(mount, ctx) {
      ensureStyles();
      const all = scope(db.books.filter((b) => b.digital), ctx);
      let values = {};
      const host = h('div', { className: 'stack' });
      const map = {
        q: (r, v) => `${r.title} ${r.author}`.toLowerCase().includes(String(v).toLowerCase()),
        category: (r, v) => r.category === v,
        language: (r, v) => r.language === v,
      };

      const paint = () => {
        const rows = applyAll(all, values, map);
        host.innerHTML = '';
        if (!rows.length) {
          host.appendChild(Card({ pad: true }, noResults('resources',
            Button('Clear filters', { variant: 'secondary', icon: 'refresh-ccw', onClick: () => { values = {}; paint(); } }))));
          return;
        }
        host.appendChild(Card({ pad: true },
          h('div', { className: 'ops-tiles' },
            rows.slice(0, 48).map((b) => h('button', {
              className: 'ops-tile', type: 'button', attrs: { 'aria-label': `Open ${b.title}` },
              onClick: () => openDrawer(b.title, `${b.author} · digital edition`,
                h('div', { className: 'stack-3' },
                  h('div', { style: { width: '160px' } }, coverTile(b)),
                  kv([
                    ['Format', pickOf(['PDF', 'EPUB', 'PDF + EPUB'], b.id)],
                    ['File size', `${intOf('sz' + b.id, 4, 68)} MB`],
                    ['Licence', pickOf(['Unlimited concurrent', '5 concurrent readers', 'Single reader'], 'lc' + b.id)],
                    ['Reads this term', num(intOf('rd' + b.id, 12, 640))],
                    ['Publisher', b.publisher],
                    ['Language', b.language],
                  ]),
                  Callout({ tone: 'info', title: 'Access' },
                    'Students open digital titles from the student portal with their ERP sign-in — no separate password is issued.')),
                (close) => frag(
                  Button('Copy share link', { variant: 'secondary', icon: 'link', onClick: () => copyToClipboard(`springdale.edu.in/library/${b.id}`) }),
                  Button('Open reader', { variant: 'primary', icon: 'monitor', onClick: () => { close(); notify({ title: 'Opening reader', text: b.title, tone: 'info' }); } }))),
            },
              coverTile(b),
              h('div', { className: 'ops-tile-body' },
                h('div', { className: 't-xs t-muted' }, b.category),
                h('div', { className: 'row', style: { gap: 'var(--sp-2)' } },
                  Badge(pickOf(['PDF', 'EPUB'], b.id), { tone: 'brand', size: 'sm' }),
                  h('span', { className: 't-xs t-muted' }, `${num(intOf('rd' + b.id, 12, 640))} reads`))))))));
      };
      paint();

      mount.appendChild(page({
        title: 'Digital library',
        subtitle: `${num(all.length)} digital editions · unlimited concurrent access on campus Wi-Fi`,
        route: 'library/digital',
        actions: pageActions(
          Button('Usage report', { variant: 'secondary', icon: 'chart-bar', route: 'library/reports' }),
          Button('Upload resource', { variant: 'primary', icon: 'upload', onClick: () => Modal({
            title: 'Upload a digital resource', size: 'md', icon: 'upload',
            body: h('div', { className: 'stack-3' },
              FormGrid({ cols: 2 },
                Field({ label: 'Title', required: true, className: 'col-span-full' }, Input({ placeholder: 'e.g. NCERT Physics Part I' })),
                Field({ label: 'Subject' }, Select({ options: CATEGORY_LIST() })),
                Field({ label: 'Licence' }, Select({ options: ['Unlimited concurrent', '5 concurrent readers', 'Single reader'] }))),
              FileUpload({ label: 'Drop the PDF or EPUB here', hint: 'Up to 200 MB. DRM-free files only.', accept: '.pdf,.epub' })),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Publish', { variant: 'primary', onClick: () => { close(); saved('Resource'); } })),
          }) })),
        filters: FilterBar({
          filters: [
            { id: 'q', type: 'search', label: 'Search', placeholder: 'Title or author…', width: '260px' },
            { id: 'category', label: 'Subject', options: CATEGORY_LIST() },
            { id: 'language', label: 'Language', options: ['English', 'Hindi', 'Sanskrit', 'French'] },
          ],
          onChange: (id, v, all2) => { values = all2; paint(); },
        }),
        children: host,
      }));
    },
  },

  /* ---------------------------------------------------- library/reports */
  'library/reports': {
    title: 'Library Reports',
    subtitle: 'Circulation, stock and fine analytics',
    section: 'library',
    render(mount, ctx) {
      ensureStyles();
      const books = scope(db.books, ctx);
      const byCat = groupBy(books, 'category');
      const rows = Array.from(byCat.entries()).map(([name, list]) => {
        const copies = list.reduce((a, b) => a + b.totalCopies, 0);
        const issued = list.reduce((a, b) => a + b.issuedCopies, 0);
        return {
          id: name, category: name, titles: list.length, copies, issued,
          available: copies - issued,
          turnover: copies ? Number((list.reduce((a, b) => a + b.timesIssued, 0) / copies).toFixed(2)) : 0,
          value: list.reduce((a, b) => a + b.price * b.totalCopies, 0),
          digital: list.filter((b) => b.digital).length,
        };
      }).sort((a, b) => b.copies - a.copies);
      const circ = analytics.libraryCirculation;
      const overdue = db.bookIssues.filter((i) => i.status === 'Overdue');

      mount.appendChild(reportPage({
        title: 'Library reports',
        subtitle: `Academic year 2026-27 · ${campusName(ctx.state.campusId)}`,
        route: 'library/reports',
        filters: [
          { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'term1', label: 'Term 1' }, { id: 'term2', label: 'Term 2' }, { id: 'ytd', label: 'Year to date' }] },
          { id: 'campus', label: 'Campus', options: campusOptions() },
          { id: 'category', label: 'Subject', options: CATEGORY_LIST() },
          { id: 'from', label: 'From', type: 'date' },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, { category: (r, x) => r.category === x })),
        summary: [
          { label: 'Titles', value: num(books.length), icon: 'book', tone: 'brand' },
          { label: 'Copies', value: num(rows.reduce((a, r) => a + r.copies, 0)), icon: 'layers', tone: 'info' },
          { label: 'Issued this term', value: num(circ.reduce((a, c) => a + c.issued, 0)), delta: 7.8, icon: 'arrow-up-right', tone: 'success' },
          { label: 'Fines outstanding', value: moneyC(overdue.reduce((a, i) => a + fineDue(i), 0)), delta: 12.4, icon: 'rupee', tone: 'danger' },
        ],
        chart: [
          lineChart({
            categories: circ.map((c) => c.month),
            series: [
              { name: 'Issued', values: circ.map((c) => c.issued) },
              { name: 'Returned', values: circ.map((c) => c.returned) },
              { name: 'Overdue', values: circ.map((c) => c.overdue) },
            ],
            height: 280, showDots: true,
          }),
          barChart({
            categories: rows.slice(0, 10).map((r) => r.category),
            series: [{ name: 'Copies', values: rows.slice(0, 10).map((r) => r.copies) }],
            horizontal: true, height: 300, showValues: true,
          }),
        ],
        chartTitle: 'Circulation trend and stock depth',
        columns: [
          { key: 'category', label: 'Subject', sticky: true, width: 210 },
          { key: 'titles', label: 'Titles', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'copies', label: 'Copies', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'issued', label: 'Issued', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'available', label: 'On shelf', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'turnover', label: 'Turnover / copy', width: 150, align: 'right', numeric: true, aggregate: 'avg', format: (v) => v.toFixed(2) },
          { key: 'digital', label: 'Digital', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'value', label: 'Stock value', width: 140, align: 'right', numeric: true, render: (r) => money(r.value), aggregate: 'sum', format: moneyC },
        ],
        rows,
        tableTitle: 'Subject-wise stock and circulation',
        notes: Callout({ tone: 'info', title: 'How turnover is read' },
          'Turnover per copy is total loans divided by copies held. Anything under 0.5 has more stock than demand; anything above 4 is a candidate for additional copies.'),
      }));
    },
  },
};

/* ==========================================================================
   5. TRANSPORT
   ========================================================================== */

const DOC_FIELDS = [
  ['insuranceExpiry', 'Insurance'],
  ['pucExpiry', 'PUC'],
  ['fitnessExpiry', 'Fitness'],
  ['permitExpiry', 'Permit'],
];

/** How many vehicle documents are lapsed or lapsing inside 45 days. */
function docRisk(v) {
  let expired = 0; let soon = 0;
  for (const [key] of DOC_FIELDS) {
    const d = daysFromToday(v[key]);
    if (d == null) continue;
    if (d < 0) expired++; else if (d <= 45) soon++;
  }
  return { expired, soon, worst: expired ? 'Expired' : soon ? 'Expiring' : 'Valid' };
}

function driverFor(v) { return byId(db.drivers, v.driverId) || null; }
function conductorFor(v) { return byId(db.drivers, v.conductorId) || null; }
function routeFor(v) { return byId(db.routes, v.routeId) || null; }

/** Normalise a route's stops into the MapPlaceholder 0–100 × 0–60 space. */
function routePaths(routes) {
  const pts = routes.map((rt) => db.stops.filter((s) => s.routeId === rt.id).sort((a, b) => a.seq - b.seq));
  const flat = pts.flat();
  if (!flat.length) return [];
  const minLat = Math.min(...flat.map((s) => s.lat));
  const maxLat = Math.max(...flat.map((s) => s.lat));
  const minLng = Math.min(...flat.map((s) => s.lng));
  const maxLng = Math.max(...flat.map((s) => s.lng));
  const spanLat = Math.max(0.0001, maxLat - minLat);
  const spanLng = Math.max(0.0001, maxLng - minLng);
  return routes.map((rt, i) => ({
    id: rt.id,
    name: `${rt.code} · ${rt.name}`,
    color: seriesColor(i),
    path: (pts[i] || []).map((s) => [
      Number((6 + ((s.lng - minLng) / spanLng) * 88).toFixed(2)),
      Number((6 + ((maxLat - s.lat) / spanLat) * 48).toFixed(2)),
    ]),
  })).filter((r) => r.path.length > 1);
}

/** Deterministic live-ish telemetry for a vehicle on its route. */
function telemetry(v) {
  const rt = routeFor(v);
  const stops = rt ? db.stops.filter((s) => s.routeId === rt.id).sort((a, b) => a.seq - b.seq) : [];
  const progress = v.status === 'On Route' ? ((hashOf('p' + v.id) % 80) + 8) / 100 : 0;
  const doneCount = Math.max(0, Math.min(stops.length, Math.round(progress * stops.length)));
  const nextStop = stops[doneCount] || stops[stops.length - 1] || null;
  const etaMin = nextStop ? 2 + (hashOf('e' + v.id) % 11) : null;
  return { rt, stops, progress, doneCount, nextStop, etaMin };
}

const transportRoutes = {

  /* ----------------------------------------------- transport/dashboard */
  'transport/dashboard': {
    title: 'Transport Dashboard',
    subtitle: 'Fleet health, route utilisation and running cost',
    section: 'transport',
    render(mount, ctx) {
      ensureStyles();
      const vehicles = scope(db.vehicles, ctx);
      const routes = scope(db.routes, ctx);
      const fuel = scope(db.fuelLogs, ctx);
      const maint = scope(db.maintenanceLogs, ctx);
      const att = scope(db.busAttendance, ctx);
      const riders = db.students.filter((s) => s.transportOpted).length;
      const risky = db.vehicles.filter((v) => docRisk(v).expired || docRisk(v).soon);

      const fuelByMonth = Array.from(groupBy(fuel, (f) => formatDate(f.date, 'monthYear')).entries())
        .map(([month, list]) => ({ month, amount: list.reduce((a, x) => a + x.amount, 0), litres: list.reduce((a, x) => a + x.litres, 0) }));

      mount.appendChild(dashboardPage({
        greeting: greetingFor((ctx.state.currentUser || {}).name || 'Transport Manager'),
        title: 'Fleet control room',
        subtitle: `${vehicles.length} vehicles · ${routes.length} routes · ${num(riders)} students on transport`,
        route: 'transport/dashboard',
        actions: pageActions(
          Button('Documents', { variant: 'secondary', icon: 'shield', route: 'transport/documents' }),
          Button('Live tracking', { variant: 'primary', icon: 'navigation', route: 'transport/tracking' })),
        kpis: [
          { label: 'Vehicles', value: String(vehicles.length), icon: 'bus', tone: 'brand', trend: analytics.sparks.transport, route: 'transport/vehicles' },
          { label: 'On route now', value: String(vehicles.filter((v) => v.status === 'On Route').length), icon: 'navigation', tone: 'success', route: 'transport/tracking' },
          { label: 'In maintenance', value: String(vehicles.filter((v) => v.status === 'Maintenance' || v.status === 'Out of Service').length), icon: 'wrench', tone: 'warning', route: 'transport/maintenance' },
          { label: 'Students carried', value: num(riders), icon: 'users', tone: 'info', route: 'transport/allocation' },
          { label: 'Document alerts', value: String(risky.length), icon: 'alert-triangle', tone: 'danger', route: 'transport/documents' },
          { label: 'Fuel spend (session)', value: moneyC(fuel.reduce((a, f) => a + f.amount, 0)), icon: 'fuel', tone: 'brand', route: 'transport/fuel-log' },
        ],
        widgets: [
          { span: 8, render: () => chartCard('Route utilisation',
            barChart({
              categories: analytics.transportUtilisation.map((r) => r.route),
              series: [
                { name: 'Seats used', values: analytics.transportUtilisation.map((r) => r.used) },
                { name: 'Spare capacity', values: analytics.transportUtilisation.map((r) => r.capacity - r.used) },
              ],
              stacked: true, height: 300,
            }), 'Seats occupied against capacity, by route') },
          { span: 4, render: () => chartCard('Fleet status',
            donutChart({
              data: countBy(vehicles, 'status').map((c) => ({ key: c.key, value: c.value })),
              height: 260, centerValue: String(vehicles.length), centerLabel: 'Vehicles',
            }), 'Where the fleet is right now') },
          { span: 6, render: () => chartCard('Running cost by month',
            comboChart({
              categories: fuelByMonth.map((f) => f.month),
              bars: [{ name: 'Fuel', values: fuelByMonth.map((f) => f.amount) }],
              line: { name: 'Litres × 100', values: fuelByMonth.map((f) => Math.round(f.litres * 100)) },
              height: 280, valueFormat: 'currencyCompact',
            }), 'Fuel spend indexed against volume drawn') },
          { span: 6, render: () => chartCard('On-time performance',
            bulletChart({
              items: analytics.transportUtilisation.slice(0, 8).map((r) => ({
                label: r.route, value: r.onTime, target: 95, ranges: [70, 85, 100],
              })),
              height: 300, valueFormat: 'percent',
            }), 'Percentage of trips arriving inside the 5-minute window, target 95%') },
          { span: 6, render: () => SectionCard({
            title: 'Documents needing attention', icon: 'shield',
            subtitle: `${risky.length} vehicles have a paper lapsing inside 45 days`,
            actions: Button('Open register', { variant: 'link', size: 'sm', route: 'transport/documents' }), flush: true,
          }, risky.length ? DataTable({
            rows: risky.slice(0, 60), pageSize: 6, searchable: false, exportable: false, columnToggle: false,
            columns: [
              { key: 'regNo', label: 'Vehicle', width: 150, render: (v) => h('div', null, h('div', { className: 't-medium t-mono' }, v.regNo), h('div', { className: 't-xs t-muted' }, v.model)) },
              { key: 'docs', label: 'Papers', sortable: false, render: (v) => h('div', { className: 'row-3 row-wrap' }, DOC_FIELDS.map(([k, l]) => expiryChip(v[k], l))) },
            ],
            onRowClick: () => navigate('transport/documents'),
          }) : h('div', { className: 'card-pad' }, emptyFor('shield-check', 'All papers valid', 'Every vehicle has more than 45 days on each document.'))) },
          { span: 6, render: () => SectionCard({
            title: 'Boarding compliance', icon: 'clipboard-check',
            subtitle: 'Latest scan sessions per route',
            actions: Button('Bus attendance', { variant: 'link', size: 'sm', route: 'transport/bus-attendance' }),
          }, RankList(sortBy(att.slice(0, 60), 'percent', 'desc').slice(0, 8).map((a) => ({
            name: a.routeName, meta: `${a.trip} · ${formatDate(a.date, 'dayMonth')}`, value: `${a.percent}%`,
          })))) },
        ],
      }));
    },
  },

  /* ------------------------------------------------ transport/vehicles */
  'transport/vehicles': {
    title: 'Vehicles',
    subtitle: 'Fleet register with document-expiry warnings',
    section: 'transport',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.vehicles, ctx).map((v) => {
        const risk = docRisk(v);
        return { ...v, docStatus: risk.worst, expiredDocs: risk.expired, soonDocs: risk.soon,
          driverName: (driverFor(v) || {}).name || '—', routeName: (routeFor(v) || {}).name || 'Unassigned' };
      });

      const detail = (v) => {
        const t = telemetry(v);
        const drv = driverFor(v); const cnd = conductorFor(v);
        openDrawer(v.regNo, `${v.model} · ${v.type} · ${campusName(v.campusId)}`,
          h('div', { className: 'stack-3' },
            h('div', { className: 'row-3 row-wrap' }, Badge(v.status), Badge(`${v.capacity} seats`, { tone: 'info' }), Badge(v.fuelType, { tone: 'neutral' })),
            SectionCard({ title: 'Documents', icon: 'shield' },
              h('div', { className: 'row-3 row-wrap' }, DOC_FIELDS.map(([k, l]) => expiryChip(v[k], l)))),
            SectionCard({ title: 'Utilisation', icon: 'gauge' },
              h('div', { className: 'stack-2' },
                ProgressBar(v.utilisation, { tone: v.utilisation > 92 ? 'warning' : 'success', label: `${v.onboard} of ${v.capacity} seats used`, showValue: true }),
                kv([
                  ['Route', t.rt ? `${t.rt.code} · ${t.rt.name}` : 'Unassigned'],
                  ['Odometer', `${num(v.odometer)} km`],
                  ['Mileage', `${v.mileage} km/l`],
                  ['Last service', dt(v.lastService)],
                  ['Next service', dt(v.nextService)],
                  ['GPS device', v.gpsDeviceId],
                ]))),
            SectionCard({ title: 'Crew', icon: 'users' },
              h('div', { className: 'stack-2' },
                drv ? Identity(drv.name, `Driver · ${drv.phone} · licence to ${formatDate(drv.licenceExpiry, 'dayMonth')}`) : h('div', { className: 't-muted' }, 'No driver assigned'),
                cnd ? Identity(cnd.name, `Conductor · ${cnd.phone}`) : null)),
            SectionCard({ title: 'Recent maintenance', flush: true },
              DataTable({
                rows: db.maintenanceLogs.filter((m) => m.vehicleId === v.id),
                paginate: false, searchable: false, exportable: false, columnToggle: false,
                columns: [
                  { key: 'date', label: 'Date', width: 120, render: (m) => dt(m.date) },
                  { key: 'type', label: 'Work' },
                  { key: 'cost', label: 'Cost', width: 110, align: 'right', numeric: true, render: (m) => money(m.cost) },
                  { key: 'status', label: 'Status', width: 120, render: (m) => Badge(m.status) },
                ],
                emptyState: emptyFor('wrench', 'No jobs logged', 'This vehicle has not been into the workshop yet.'),
              }))),
          (close) => frag(
            Button('Track live', { variant: 'secondary', icon: 'navigation', onClick: () => { close(); navigate('transport/tracking'); } }),
            Button('Log maintenance', { variant: 'primary', icon: 'wrench', onClick: () => { close(); navigate('transport/maintenance'); } })));
      };

      mount.appendChild(listPage({
        title: 'Vehicles',
        subtitle: `${rows.length} vehicles · ${rows.filter((r) => r.docStatus !== 'Valid').length} with a document alert`,
        route: 'transport/vehicles',
        actions: pageActions(
          Button('Document register', { variant: 'secondary', icon: 'shield', route: 'transport/documents' }),
          Button('Add vehicle', { variant: 'primary', icon: 'plus', onClick: () => Modal({
            title: 'Add vehicle', size: 'lg', icon: 'bus',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Registration no', required: true }, Input({ placeholder: 'HR26 AB 1234' })),
              Field({ label: 'Model', required: true }, Input({ placeholder: 'Tata Starbus 40' })),
              Field({ label: 'Type' }, Select({ options: ['School Bus', 'Mini Bus', 'Van'], value: 'School Bus' })),
              Field({ label: 'Seating capacity' }, Input({ type: 'number', value: '45' })),
              Field({ label: 'Fuel type' }, Select({ options: ['Diesel', 'CNG', 'Electric'] })),
              Field({ label: 'Campus' }, Select({ options: campusOptions() })),
              Field({ label: 'Insurance expiry' }, DatePicker({})),
              Field({ label: 'Fitness expiry' }, DatePicker({}))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Add vehicle', { variant: 'primary', onClick: () => { close(); saved('Vehicle'); } })),
          }) })),
        kpis: [
          { label: 'Fleet size', value: String(rows.length), icon: 'bus', tone: 'brand' },
          { label: 'On route', value: String(rows.filter((r) => r.status === 'On Route').length), icon: 'navigation', tone: 'success' },
          { label: 'Off road', value: String(rows.filter((r) => r.status === 'Maintenance' || r.status === 'Out of Service').length), icon: 'wrench', tone: 'warning' },
          { label: 'Document alerts', value: String(rows.filter((r) => r.docStatus !== 'Valid').length), icon: 'alert-triangle', tone: 'danger' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Registration, model or route…', width: '260px' },
          { id: 'status', label: 'Status', options: ['On Route', 'Idle', 'Maintenance', 'Out of Service'] },
          { id: 'fuelType', label: 'Fuel', options: ['Diesel', 'CNG', 'Electric'] },
          { id: 'docStatus', label: 'Documents', options: ['Valid', 'Expiring', 'Expired'] },
          { id: 'campus', label: 'Campus', options: campusOptions() },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.regNo} ${r.model} ${r.routeName}`.toLowerCase().includes(String(x).toLowerCase()),
          status: (r, x) => r.status === x,
          fuelType: (r, x) => r.fuelType === x,
          docStatus: (r, x) => r.docStatus === x,
          campus: (r, x) => r.campusId === x,
        })),
        chart: barChart({
          categories: countBy(rows, 'model').map((c) => c.key),
          series: [{ name: 'Vehicles', values: countBy(rows, 'model').map((c) => c.value) }],
          horizontal: true, height: 240, showValues: true,
        }),
        chartTitle: 'Fleet composition by model',
        columns: [
          { key: 'regNo', label: 'Vehicle', sticky: true, width: 200, render: (r) => Identity(r.regNo, `${r.model} · ${r.type}`), value: (r) => r.regNo },
          { key: 'routeName', label: 'Route', width: 220, render: (r) => h('span', { className: 't-truncate' }, r.routeName) },
          { key: 'driverName', label: 'Driver', width: 180 },
          { key: 'capacity', label: 'Seats', width: 90, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'onboard', label: 'Onboard', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'utilisation', label: 'Utilisation', width: 160, render: (r) => ProgressBar(r.utilisation, { tone: r.utilisation > 92 ? 'warning' : 'success', showValue: true }) },
          { key: 'fuelType', label: 'Fuel', width: 100, filter: true },
          { key: 'mileage', label: 'km/l', width: 90, align: 'right', numeric: true, aggregate: 'avg', format: (v) => v.toFixed(1) },
          { key: 'odometer', label: 'Odometer', width: 130, align: 'right', numeric: true, render: (r) => `${num(r.odometer)} km`, hidden: true },
          { key: 'docStatus', label: 'Documents', width: 150, filter: true,
            render: (r) => (r.docStatus === 'Valid' ? Badge('Valid', { tone: 'success', icon: 'shield-check' })
              : Badge(`${r.expiredDocs || r.soonDocs} ${r.docStatus.toLowerCase()}`, { tone: r.expiredDocs ? 'danger' : 'warning', icon: 'alert-triangle' })) },
          { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['regNo', 'model', 'routeName', 'driverName'],
        bulkActions: [
          { label: 'Schedule service', icon: 'wrench', onClick: (sel) => notify({ title: `${sel.length} vehicles booked in`, tone: 'success' }) },
          { label: 'Export fleet list', icon: 'download', onClick: (sel) => notify({ title: `${sel.length} rows exported`, tone: 'success' }) },
        ],
        onRowClick: detail,
        rowActions: (r) => [
          { label: 'Open vehicle', icon: 'eye', onClick: () => detail(r) },
          { label: 'Track live', icon: 'navigation', route: 'transport/tracking' },
          { label: 'Fuel log', icon: 'fuel', route: 'transport/fuel-log' },
          { label: 'Maintenance', icon: 'wrench', route: 'transport/maintenance' },
          { separator: true },
          { label: 'Take off road', icon: 'x-circle', tone: 'danger', onClick: () => confirmDanger('Take this vehicle off road?', `${r.regNo} will be unassigned from ${r.routeName} and parents on that route notified.`, () => notify({ title: 'Vehicle taken off road', tone: 'warning' }), 'Take off road') },
        ],
        emptyState: emptyFor('bus', 'No vehicles', 'Add a vehicle to start building routes.'),
      }));
    },
  },

  /* ------------------------------------------------- transport/drivers */
  'transport/drivers': {
    title: 'Drivers & Conductors',
    subtitle: 'Crew register, licences and verification status',
    section: 'transport',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.drivers, ctx).map((d) => ({
        ...d,
        vehicleReg: (byId(db.vehicles, d.vehicleId) || {}).regNo || '—',
        licenceDays: d.licenceExpiry ? daysFromToday(d.licenceExpiry) : null,
        compliance: !d.policeVerified ? 'Verification pending'
          : (d.licenceExpiry && daysFromToday(d.licenceExpiry) < 45 ? 'Licence expiring' : 'Compliant'),
      }));

      const detail = (d) => openDrawer(d.name, `${d.role} · ${campusName(d.campusId)}`,
        h('div', { className: 'stack-3' },
          h('div', { className: 'row-3 row-wrap' },
            Badge(d.status), Badge(d.role, { tone: 'info' }),
            d.policeVerified ? Badge('Police verified', { tone: 'success', icon: 'shield-check' }) : Badge('Verification pending', { tone: 'danger', icon: 'alert-triangle' })),
          kv([
            ['Employee id', d.id],
            ['Phone', d.phone],
            ['Licence no', d.licenceNo],
            ['Licence expiry', d.licenceExpiry ? dt(d.licenceExpiry) : 'Not applicable'],
            ['Badge no', d.badgeNo],
            ['Experience', `${d.experienceYears} years`],
            ['Blood group', d.bloodGroup],
            ['Joined', dt(d.joiningDate)],
            ['Last medical', dt(d.medicalCheckDate)],
            ['Assigned vehicle', (byId(db.vehicles, d.vehicleId) || {}).regNo || '—'],
          ]),
          SectionCard({ title: 'Safety record', icon: 'shield' },
            h('div', { className: 'stack-2' },
              h('div', { className: 'row-4 row-wrap' },
                h('div', null, h('div', { className: 't-eyebrow' }, 'Rating'), Rating(d.rating, { showValue: true })),
                h('div', null, h('div', { className: 't-eyebrow' }, 'Incidents'), h('div', { className: 't-title' }, String(d.incidents)))),
              d.incidents ? Callout({ tone: 'warning', title: 'Incidents on file' },
                `${d.incidents} reported incident${d.incidents > 1 ? 's' : ''}. Review the transport incident register before the next roster.`) : null)),
          Card({ pad: true }, h('div', { className: 't-eyebrow mb-2' }, 'Address'), h('div', { className: 't-sm' }, typeof d.address === 'string' ? d.address : [d.address.line1, d.address.line2, d.address.city, d.address.pincode].filter(Boolean).join(', ')))),
        (close) => frag(
          Button('Call', { variant: 'secondary', icon: 'phone', onClick: () => notify({ title: 'Dialling', text: d.phone, tone: 'info' }) }),
          Button('Reassign vehicle', { variant: 'primary', icon: 'refresh-ccw', onClick: () => { close(); mockAction('Reassign vehicle')(); } })));

      mount.appendChild(listPage({
        title: 'Drivers & conductors',
        subtitle: `${rows.length} crew members · ${rows.filter((r) => !r.policeVerified).length} awaiting police verification`,
        route: 'transport/drivers',
        actions: pageActions(
          Button('Duty roster', { variant: 'secondary', icon: 'calendar', onClick: mockAction('Open duty roster') }),
          Button('Add crew member', { variant: 'primary', icon: 'user-plus', onClick: () => Modal({
            title: 'Add crew member', size: 'lg', icon: 'user-plus',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Full name', required: true }, Input({ placeholder: 'e.g. Ramesh Yadav' })),
              Field({ label: 'Role', required: true }, Select({ options: ['Driver', 'Conductor'], value: 'Driver' })),
              Field({ label: 'Phone', required: true }, Input({ placeholder: '+91 98xxx xxxxx' })),
              Field({ label: 'Licence no' }, Input({ placeholder: 'HR-26-2019xxxxxxx' })),
              Field({ label: 'Licence expiry' }, DatePicker({})),
              Field({ label: 'Blood group' }, Select({ options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] })),
              Field({ label: 'Police verification', className: 'col-span-full' }, Switch('Verification certificate received', { checked: true }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Add crew member', { variant: 'primary', onClick: () => { close(); saved('Crew member'); } })),
          }) })),
        kpis: [
          { label: 'Crew', value: String(rows.length), icon: 'users', tone: 'brand' },
          { label: 'On duty', value: String(rows.filter((r) => r.status === 'On Duty').length), icon: 'check-circle', tone: 'success' },
          { label: 'Licence expiring', value: String(rows.filter((r) => r.licenceDays != null && r.licenceDays < 45).length), icon: 'id-card', tone: 'warning' },
          { label: 'Unverified', value: String(rows.filter((r) => !r.policeVerified).length), icon: 'shield', tone: 'danger' },
        ],
        tabs: [
          { id: 'all', label: 'All crew', count: rows.length },
          { id: 'drivers', label: 'Drivers', count: rows.filter((r) => r.role === 'Driver').length },
          { id: 'conductors', label: 'Conductors', count: rows.filter((r) => r.role === 'Conductor').length },
        ],
        activeTab: 'all',
        onTabChange: (id) => notify({ title: `Showing ${id}`, tone: 'info' }),
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Name, licence or vehicle…', width: '260px' },
          { id: 'role', label: 'Role', options: ['Driver', 'Conductor'] },
          { id: 'status', label: 'Status', options: ['On Duty', 'Off Duty', 'On Leave'] },
          { id: 'verified', label: 'Verification', options: [{ value: 'yes', label: 'Verified' }, { value: 'no', label: 'Pending' }] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.name} ${r.licenceNo} ${r.vehicleReg}`.toLowerCase().includes(String(x).toLowerCase()),
          role: (r, x) => r.role === x,
          status: (r, x) => r.status === x,
          verified: (r, x) => (x === 'yes' ? r.policeVerified : !r.policeVerified),
        })),
        columns: [
          { key: 'name', label: 'Crew member', sticky: true, width: 230, render: (r) => Identity(r.name, `${r.role} · ${r.id}`) },
          { key: 'phone', label: 'Phone', width: 150, className: 't-mono' },
          { key: 'vehicleReg', label: 'Vehicle', width: 150, className: 't-mono' },
          { key: 'licenceExpiry', label: 'Licence', width: 190, render: (r) => (r.role === 'Driver' ? expiryChip(r.licenceExpiry, 'Valid to') : Badge('Not applicable', { tone: 'neutral' })) },
          { key: 'experienceYears', label: 'Experience', width: 120, align: 'right', numeric: true, render: (r) => `${r.experienceYears} yr`, aggregate: 'avg', format: (v) => `${v.toFixed(1)} yr` },
          { key: 'rating', label: 'Rating', width: 140, render: (r) => Rating(r.rating, { showValue: true }) },
          { key: 'incidents', label: 'Incidents', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'policeVerified', label: 'Verified', width: 130, value: (r) => (r.policeVerified ? 1 : 0), render: (r) => (r.policeVerified ? Badge('Verified', { tone: 'success' }) : Badge('Pending', { tone: 'danger' })) },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['name', 'phone', 'licenceNo', 'vehicleReg'],
        bulkActions: [
          { label: 'Send roster SMS', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} crew notified`, tone: 'success' }) },
          { label: 'Book medical check', icon: 'stethoscope', onClick: (sel) => notify({ title: `${sel.length} medicals booked`, tone: 'info' }) },
        ],
        onRowClick: detail,
        rowActions: (r) => [
          { label: 'Open profile', icon: 'eye', onClick: () => detail(r) },
          { label: 'Call', icon: 'phone', onClick: () => notify({ title: 'Dialling', text: r.phone, tone: 'info' }) },
          { label: 'View vehicle', icon: 'bus', route: 'transport/vehicles' },
        ],
        emptyState: emptyFor('users', 'No crew on file', 'Add drivers and conductors before assigning routes.'),
      }));
    },
  },

  /* -------------------------------------------------- transport/routes */
  'transport/routes': {
    title: 'Routes',
    subtitle: 'Route builder with ordered stops, timings and loads',
    section: 'transport',
    render(mount, ctx) {
      ensureStyles();
      const routes = scope(db.routes, ctx);
      let selected = routes[0] || null;

      const builderHost = h('div', { className: 'stack-3' });

      const paintBuilder = () => {
        builderHost.innerHTML = '';
        if (!selected) {
          builderHost.appendChild(Card({ pad: true }, emptyFor('route', 'No route selected', 'Pick a route from the table to open the stop builder.')));
          return;
        }
        const stops = db.stops.filter((s) => s.routeId === selected.id).sort((a, b) => a.seq - b.seq);
        const veh = byId(db.vehicles, selected.vehicleId);
        builderHost.appendChild(SectionCard({
          title: `${selected.code} · ${selected.name}`,
          subtitle: `${stops.length} stops · ${selected.distanceKm} km · ${selected.durationMin} min · ${selected.studentCount} students`,
          icon: 'route',
          actions: h('div', { className: 'row' },
            Button('Reorder stops', { variant: 'ghost', size: 'sm', icon: 'sort', onClick: mockAction('Reorder stops') }),
            Button('Add stop', { variant: 'secondary', size: 'sm', icon: 'map-pin', onClick: () => Modal({
              title: 'Add a stop', size: 'md', icon: 'map-pin',
              body: FormGrid({ cols: 2 },
                Field({ label: 'Stop name', required: true, className: 'col-span-full' }, Input({ placeholder: 'Sector 42 — Main Gate' })),
                Field({ label: 'Position in route' }, Input({ type: 'number', value: String(stops.length + 1) })),
                Field({ label: 'Students expected' }, Input({ type: 'number', value: '4' })),
                Field({ label: 'Pickup time' }, TimePicker({ value: '06:40' })),
                Field({ label: 'Drop time' }, TimePicker({ value: '14:40' })),
                Field({ label: 'Landmark', className: 'col-span-full' }, Input({ placeholder: 'Opposite Reliance Fresh' }))),
              actions: (close) => frag(
                Button('Cancel', { variant: 'ghost', onClick: close }),
                Button('Add stop', { variant: 'primary', onClick: () => { close(); saved('Stop'); } })),
            }) })),
        },
          h('div', { className: 'stack-3' },
            h('div', { className: 'row-4 row-wrap' },
              kv([
                ['Vehicle', veh ? veh.regNo : 'Unassigned'],
                ['Shift', selected.shift],
                ['Pickup starts', selected.pickupStart],
                ['Drop starts', selected.dropStart],
                ['Annual fare', money(selected.fare)],
                ['Monthly revenue', money(selected.monthlyRevenue)],
              ]),
              h('div', { className: 'flex-1', style: { minWidth: '220px' } },
                h('div', { className: 't-eyebrow mb-2' }, 'Seat load'),
                ProgressBar(Math.round((selected.studentCount / selected.capacity) * 100), {
                  tone: selected.studentCount > selected.capacity ? 'danger' : selected.studentCount / selected.capacity > 0.9 ? 'warning' : 'success',
                  label: `${selected.studentCount} of ${selected.capacity} seats`, showValue: true,
                }))),
            h('div', { className: 'ops-stopline' },
              stops.map((s, i) => h('div', { className: 'ops-stop', dataset: { done: i === 0 ? '1' : '0' } },
                h('div', { className: 'row-3 row-wrap' },
                  h('span', { className: 't-semibold' }, `${s.seq}. ${s.name}`),
                  Badge(`${s.studentCount} students`, { tone: 'info', size: 'sm' })),
                h('div', { className: 't-xs t-muted' },
                  `Pickup ${s.pickupTime} · Drop ${s.dropTime} · ${s.landmark}`)))))));
      };

      paintBuilder();

      const node = listPage({
        title: 'Routes',
        subtitle: `${routes.length} routes covering ${num(routes.reduce((a, r) => a + r.studentCount, 0))} students`,
        route: 'transport/routes',
        actions: pageActions(
          Button('Stops master', { variant: 'secondary', icon: 'map-pin', route: 'transport/stops' }),
          Button('New route', { variant: 'primary', icon: 'plus', onClick: () => Modal({
            title: 'Create a route', size: 'lg', icon: 'route',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Route name', required: true, className: 'col-span-full' }, Input({ placeholder: 'Sector 56 — Golf Course Extension' })),
              Field({ label: 'Route code', required: true }, Input({ placeholder: 'R29' })),
              Field({ label: 'Campus' }, Select({ options: campusOptions() })),
              Field({ label: 'Vehicle' }, Combobox({ options: db.vehicles.map((v) => ({ value: v.id, label: `${v.regNo} · ${v.capacity} seats` })), placeholder: 'Assign a bus…' })),
              Field({ label: 'Shift' }, Select({ options: ['Morning + Evening', 'Morning Only'] })),
              Field({ label: 'Pickup starts' }, TimePicker({ value: '06:30' })),
              Field({ label: 'Drop starts' }, TimePicker({ value: '14:30' })),
              Field({ label: 'Annual fare (₹)' }, Input({ type: 'number', value: '24000' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Create route', { variant: 'primary', onClick: () => { close(); saved('Route'); } })),
          }) })),
        kpis: [
          { label: 'Routes', value: String(routes.length), icon: 'route', tone: 'brand' },
          { label: 'Stops', value: num(db.stops.filter((s) => routes.some((r) => r.id === s.routeId)).length), icon: 'map-pin', tone: 'info' },
          { label: 'Distance / day', value: `${num(Math.round(routes.reduce((a, r) => a + r.distanceKm * 2, 0)))} km`, icon: 'navigation', tone: 'success' },
          { label: 'Monthly revenue', value: moneyC(routes.reduce((a, r) => a + r.monthlyRevenue, 0)), icon: 'wallet', tone: 'warning' },
        ],
        chart: barChart({
          categories: routes.slice(0, 14).map((r) => r.code),
          series: [
            { name: 'Students', values: routes.slice(0, 14).map((r) => r.studentCount) },
            { name: 'Spare seats', values: routes.slice(0, 14).map((r) => Math.max(0, r.capacity - r.studentCount)) },
          ],
          stacked: true, height: 260,
        }),
        chartTitle: 'Seat load by route',
        columns: [
          { key: 'code', label: 'Code', sticky: true, width: 90, className: 't-mono' },
          { key: 'name', label: 'Route', width: 250 },
          { key: 'vehicleId', label: 'Vehicle', width: 150, render: (r) => h('span', { className: 't-mono' }, (byId(db.vehicles, r.vehicleId) || {}).regNo || '—') },
          { key: 'stopCount', label: 'Stops', width: 90, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'distanceKm', label: 'Distance', width: 110, align: 'right', numeric: true, render: (r) => `${r.distanceKm} km`, aggregate: 'sum', format: (v) => `${v.toFixed(0)} km` },
          { key: 'durationMin', label: 'Duration', width: 110, align: 'right', numeric: true, render: (r) => `${r.durationMin} min` },
          { key: 'studentCount', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'capacity', label: 'Capacity', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'load', label: 'Load', width: 160, sortable: false, render: (r) => ProgressBar(Math.round((r.studentCount / r.capacity) * 100), { tone: r.studentCount > r.capacity ? 'danger' : 'success', showValue: true }) },
          { key: 'pickupStart', label: 'Pickup', width: 100 },
          { key: 'fare', label: 'Fare', width: 120, align: 'right', numeric: true, render: (r) => money(r.fare) },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows: routes, selectable: true, footerAggregates: true, pageSize: 15,
        searchKeys: ['code', 'name'],
        bulkActions: [
          { label: 'Publish timings', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} routes published to parents`, tone: 'success' }) },
          { label: 'Suspend routes', icon: 'x-circle', tone: 'danger', onClick: (sel) => confirmDanger('Suspend these routes?', `${sel.length} routes will stop running and parents will be notified.`, () => notify({ title: 'Routes suspended', tone: 'warning' }), 'Suspend') },
        ],
        onRowClick: (r) => { selected = r; paintBuilder(); builderHost.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
        rowActions: (r) => [
          { label: 'Open builder', icon: 'tool', onClick: () => { selected = r; paintBuilder(); } },
          { label: 'View stops', icon: 'map-pin', route: 'transport/stops' },
          { label: 'Track live', icon: 'navigation', route: 'transport/tracking' },
          { label: 'Allocate students', icon: 'user-check', route: 'transport/allocation' },
        ],
        emptyState: emptyFor('route', 'No routes yet', 'Create a route and add its stops in order.'),
      });

      const bodyStack = node.querySelector(':scope > .stack');
      if (bodyStack) bodyStack.appendChild(builderHost); else node.appendChild(builderHost);
      mount.appendChild(node);
    },
  },

  /* --------------------------------------------------- transport/stops */
  'transport/stops': {
    title: 'Stops',
    subtitle: 'Every boarding point with timings and load',
    section: 'transport',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.stops, ctx).map((s) => ({
        ...s,
        code: (byId(db.routes, s.routeId) || {}).code || '—',
        status: s.studentCount === 0 ? 'Unused' : s.studentCount > 7 ? 'Heavy' : 'Normal',
      }));

      mount.appendChild(listPage({
        title: 'Stops',
        subtitle: `${num(rows.length)} boarding points across ${new Set(rows.map((r) => r.routeId)).size} routes`,
        route: 'transport/stops',
        actions: pageActions(
          Button('Route builder', { variant: 'secondary', icon: 'route', route: 'transport/routes' }),
          Button('Add stop', { variant: 'primary', icon: 'map-pin', onClick: () => Modal({
            title: 'Add a stop', size: 'md', icon: 'map-pin',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Route', required: true, className: 'col-span-full' },
                Combobox({ options: db.routes.map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` })), placeholder: 'Pick a route…' })),
              Field({ label: 'Stop name', required: true, className: 'col-span-full' }, Input({ placeholder: 'Sushant Lok — Market' })),
              Field({ label: 'Sequence' }, Input({ type: 'number', value: '1' })),
              Field({ label: 'Students expected' }, Input({ type: 'number', value: '4' })),
              Field({ label: 'Pickup time' }, TimePicker({ value: '06:40' })),
              Field({ label: 'Drop time' }, TimePicker({ value: '14:40' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Add stop', { variant: 'primary', onClick: () => { close(); saved('Stop'); } })),
          }) })),
        kpis: [
          { label: 'Stops', value: num(rows.length), icon: 'map-pin', tone: 'brand' },
          { label: 'Students boarding', value: num(rows.reduce((a, r) => a + r.studentCount, 0)), icon: 'users', tone: 'info' },
          { label: 'Heavy stops', value: String(rows.filter((r) => r.status === 'Heavy').length), icon: 'alert-circle', tone: 'warning' },
          { label: 'Unused stops', value: String(rows.filter((r) => r.status === 'Unused').length), icon: 'x-circle', tone: 'danger' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Stop or landmark…', width: '260px' },
          { id: 'routeId', label: 'Route', options: db.routes.map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` })) },
          { id: 'status', label: 'Load', options: ['Normal', 'Heavy', 'Unused'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.name} ${r.landmark}`.toLowerCase().includes(String(x).toLowerCase()),
          routeId: (r, x) => r.routeId === x,
          status: (r, x) => r.status === x,
        })),
        columns: [
          { key: 'name', label: 'Stop', sticky: true, width: 260, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.name), h('div', { className: 't-xs t-muted t-truncate' }, r.landmark)) },
          { key: 'routeName', label: 'Route', width: 220, render: (r) => h('span', null, h('span', { className: 't-mono t-muted' }, r.code + ' '), r.routeName) },
          { key: 'seq', label: 'Seq', width: 70, align: 'right', numeric: true },
          { key: 'pickupTime', label: 'Pickup', width: 100 },
          { key: 'dropTime', label: 'Drop', width: 100 },
          { key: 'studentCount', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'lat', label: 'Latitude', width: 110, align: 'right', numeric: true, hidden: true },
          { key: 'lng', label: 'Longitude', width: 110, align: 'right', numeric: true, hidden: true },
          { key: 'status', label: 'Load', width: 120, filter: true, render: (r) => Badge(r.status === 'Heavy' ? 'Pending' : r.status === 'Unused' ? 'Cancelled' : 'Active', { tone: r.status === 'Heavy' ? 'warning' : r.status === 'Unused' ? 'danger' : 'success', icon: 'users' }) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['name', 'landmark', 'routeName'],
        groupBy: 'routeName',
        bulkActions: [
          { label: 'Shift timings by 5 min', icon: 'clock', onClick: (sel) => notify({ title: `${sel.length} stops re-timed`, tone: 'success' }) },
          { label: 'Remove stops', icon: 'trash', tone: 'danger', onClick: (sel) => confirmDanger('Remove these stops?', `${sel.length} stops will be dropped and affected families notified.`, () => notify({ title: 'Stops removed', tone: 'success' }), 'Remove') },
        ],
        rowActions: (r) => [
          { label: 'Open route', icon: 'route', route: 'transport/routes' },
          { label: 'Students at this stop', icon: 'users', route: 'transport/allocation' },
          { label: 'Copy coordinates', icon: 'copy', onClick: () => copyToClipboard(`${r.lat}, ${r.lng}`) },
        ],
        emptyState: emptyFor('map-pin', 'No stops', 'Add stops to a route to build the pickup sequence.'),
      }));
    },
  },

  /* ------------------------------------------------ transport/tracking */
  'transport/tracking': {
    title: 'Route Map / Live Tracking',
    subtitle: 'Stylised fleet map with per-vehicle telemetry',
    section: 'transport',
    render(mount, ctx) {
      ensureStyles();
      const routes = scope(db.routes, ctx).filter((r) => r.status === 'Active').slice(0, 8);
      const vehicles = routes.map((r) => byId(db.vehicles, r.vehicleId)).filter(Boolean);
      if (!routes.length || !vehicles.length) {
        return mount.appendChild(page({
          title: 'Live tracking', route: 'transport/tracking',
          children: Card({ pad: true }, emptyFor('navigation', 'No active routes',
            'Activate a route and assign a GPS-fitted vehicle to see it on the map.',
            Button('Open routes', { variant: 'primary', icon: 'route', route: 'transport/routes' }))),
        }));
      }

      let focusId = vehicles[0].id;
      const mapHost = h('div');
      const fleetHost = h('div', { className: 'ops-fleet' });
      const detailHost = h('div', { className: 'stack-3' });

      const statusColour = (s) => (s === 'On Route' ? 'var(--chart-good)'
        : s === 'Idle' ? 'var(--chart-warning)'
          : s === 'Maintenance' ? 'var(--chart-serious)' : 'var(--chart-critical)');

      const paintMap = () => {
        mapHost.innerHTML = '';
        const focusVeh = byId(db.vehicles, focusId);
        const shown = focusVeh && focusVeh.routeId
          ? routes.filter((r) => r.id === focusVeh.routeId)
          : routes;
        const paths = routePaths(shown.length ? shown : routes);
        const marks = (shown.length ? shown : routes).map((r) => {
          const v = byId(db.vehicles, r.vehicleId);
          return v ? { routeId: r.id, label: `${v.regNo} · ${r.code}`, progress: telemetry(v).progress } : null;
        }).filter(Boolean);
        mapHost.appendChild(MapPlaceholder({ routes: paths, vehicles: marks, height: 420, animate: true, legend: true }));
      };

      const paintFleet = () => {
        fleetHost.innerHTML = '';
        for (const v of vehicles) {
          const t = telemetry(v);
          const rt = t.rt || {};
          const drv = driverFor(v);
          fleetHost.appendChild(h('button', {
            className: 'ops-fleet-item', type: 'button',
            attrs: { 'aria-current': String(v.id === focusId), 'aria-label': `Focus ${v.regNo}` },
            onClick: () => { focusId = v.id; paintFleet(); paintDetail(); paintMap(); },
          },
            h('span', { className: 'ops-dot', style: { background: statusColour(v.status) } }),
            h('span', { className: 'flex-1 min-0', style: { textAlign: 'left' } },
              h('span', { className: 'row', style: { gap: 'var(--sp-2)' } },
                h('span', { className: 't-semibold t-mono' }, v.regNo),
                Badge(v.status, { size: 'sm' })),
              h('span', { className: 't-xs t-muted t-truncate', style: { display: 'block' } },
                `${rt.code || '—'} · ${drv ? drv.name : 'No driver'}`),
              h('span', { className: 't-xs t-muted', style: { display: 'block' } },
                `${v.speed} km/h · ${v.onboard}/${v.capacity} onboard${t.nextStop ? ` · ETA ${t.etaMin}m` : ''}`))));
        }
      };

      const paintDetail = () => {
        detailHost.innerHTML = '';
        const v = byId(db.vehicles, focusId);
        if (!v) { detailHost.appendChild(emptyFor('bus', 'Nothing selected', 'Pick a vehicle from the fleet list.')); return; }
        const t = telemetry(v);
        const drv = driverFor(v); const cnd = conductorFor(v);
        const rt = t.rt || {};

        detailHost.appendChild(SectionCard({
          title: `${v.regNo} · ${rt.code || 'Unassigned'}`,
          subtitle: `${v.model} · ${rt.name || 'No route'} · last ping ${pingTime(v.lastPing)}`,
          icon: 'bus',
          actions: h('div', { className: 'row' },
            Button('Call driver', { variant: 'ghost', size: 'sm', icon: 'phone', onClick: () => notify({ title: 'Dialling driver', text: drv ? `${drv.name} · ${drv.phone}` : 'No driver on file', tone: 'info' }) }),
            Button('Notify parents', { variant: 'secondary', size: 'sm', icon: 'send', onClick: () => notify({ title: 'Delay notice queued', text: `${rt.name || v.regNo} · ${rt.studentCount || 0} families`, tone: 'success' }) })),
        },
          h('div', { className: 'stack-3' },
            h('div', { className: 'row-4 row-wrap' },
              h('div', { style: { minWidth: '150px' } }, progressRing(v.speed, { max: 80, size: 110, label: 'Speed', sublabel: 'km/h', valueFormat: 'number' })),
              h('div', { className: 'flex-1', style: { minWidth: '220px' } },
                kv([
                  ['Status', Badge(v.status)],
                  ['Driver', drv ? drv.name : '—'],
                  ['Conductor', cnd ? cnd.name : '—'],
                  ['Onboard', `${v.onboard} of ${v.capacity}`],
                  ['Next stop', t.nextStop ? `${t.nextStop.name} · ETA ${t.etaMin} min` : 'Route complete'],
                  ['Trip progress', `${t.doneCount} of ${t.stops.length} stops`],
                  ['GPS device', v.gpsDeviceId],
                  ['Coordinates', `${v.gpsLat}, ${v.gpsLng}`],
                ])),
              h('div', { style: { minWidth: '200px', flex: '1' } },
                h('div', { className: 't-eyebrow mb-2' }, 'Occupancy'),
                ProgressBar(v.utilisation, { tone: v.utilisation > 92 ? 'warning' : 'success', showValue: true }),
                h('div', { className: 't-eyebrow mb-2 mt-3' }, 'Documents'),
                h('div', { className: 'row-3 row-wrap' }, DOC_FIELDS.map(([k, l]) => expiryChip(v[k], l))))),
            Divider({ label: 'Stop-by-stop' }),
            t.stops.length
              ? h('div', { className: 'ops-stopline' },
                t.stops.map((s, i) => h('div', {
                  className: 'ops-stop',
                  dataset: { done: i < t.doneCount ? '1' : '0', now: i === t.doneCount ? '1' : '0' },
                },
                  h('div', { className: 'row-3 row-wrap' },
                    h('span', { className: i === t.doneCount ? 't-semibold t-brand' : 't-semibold' }, `${s.seq}. ${s.name}`),
                    i < t.doneCount ? Badge('Boarded', { tone: 'success', size: 'sm' })
                      : i === t.doneCount ? Badge(`ETA ${t.etaMin} min`, { tone: 'info', size: 'sm' })
                        : Badge(s.pickupTime, { tone: 'neutral', size: 'sm' }),
                    Badge(`${s.studentCount} students`, { tone: 'neutral', size: 'sm' })),
                  h('div', { className: 't-xs t-muted' }, s.landmark))))
              : emptyFor('map-pin', 'No stops mapped', 'Add stops to this route in the route builder.'))));
      };

      paintMap(); paintFleet(); paintDetail();

      mount.appendChild(page({
        title: 'Route map & live tracking',
        subtitle: `${vehicles.filter((v) => v.status === 'On Route').length} of ${vehicles.length} tracked vehicles are running · demo clock ${formatDate(TODAY, 'medium')} 09:30`,
        route: 'transport/tracking',
        wide: true,
        actions: pageActions(
          Button('Trip log', { variant: 'secondary', icon: 'history', route: 'transport/trip-log' }),
          Button('Broadcast delay', { variant: 'primary', icon: 'megaphone', onClick: () => Modal({
            title: 'Broadcast a delay notice', size: 'md', icon: 'megaphone', tone: 'warning',
            body: FormGrid({ cols: 1 },
              Field({ label: 'Routes', required: true }, MultiSelect({ options: routes.map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` })), values: [routes[0].id] })),
              Field({ label: 'Delay (minutes)' }, Input({ type: 'number', value: '15' })),
              Field({ label: 'Message' }, Textarea({ rows: 3, value: 'Traffic on the Sohna Road stretch is heavy this morning. Your child’s bus is running about 15 minutes late. Drivers have been asked to keep to the published stop order.' })),
              Field({ label: 'Channels' }, MultiSelect({ options: ['SMS', 'App push', 'WhatsApp'], values: ['SMS', 'App push'] }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Send now', { variant: 'primary', icon: 'send', onClick: () => { close(); notify({ title: 'Delay notice sent', text: 'Families on the selected routes have been notified.', tone: 'success' }); } })),
          }) })),
        children: [
          kpiRow([
            { label: 'Tracked vehicles', value: String(vehicles.length), icon: 'navigation', tone: 'brand' },
            { label: 'Running now', value: String(vehicles.filter((v) => v.status === 'On Route').length), icon: 'bus', tone: 'success' },
            { label: 'Students onboard', value: num(vehicles.reduce((a, v) => a + v.onboard, 0)), icon: 'users', tone: 'info' },
            { label: 'Avg speed', value: `${Math.round(vehicles.reduce((a, v) => a + v.speed, 0) / vehicles.length)} km/h`, icon: 'gauge', tone: 'warning' },
          ]),
          h('div', { className: 'ops-track' },
            SectionCard({
              title: 'Live route map',
              subtitle: 'Stylised network view — stops are nodes, buses animate along their path',
              icon: 'map',
              actions: Button('Show all routes', { variant: 'ghost', size: 'sm', icon: 'route', onClick: () => { focusId = ''; paintFleet(); paintDetail(); paintMap(); } }),
            },
              h('div', { className: 'stack-2' },
                mapHost,
                legend([
                  ['On route', 'var(--chart-good)'],
                  ['Idle', 'var(--chart-warning)'],
                  ['Maintenance', 'var(--chart-serious)'],
                  ['Out of service', 'var(--chart-critical)'],
                ]))),
            SectionCard({ title: 'Fleet', subtitle: 'Click a vehicle to focus the map', icon: 'bus' }, fleetHost)),
          detailHost,
        ],
      }));
    },
  },

  /* ---------------------------------------------- transport/allocation */
  'transport/allocation': {
    title: 'Student Route Allocation',
    subtitle: 'Who rides which bus, from which stop',
    section: 'transport',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.students.filter((s) => s.transportOpted), ctx).map((s) => {
        const rt = byId(db.routes, s.routeId);
        const st = byId(db.stops, s.stopId);
        return {
          id: s.id, name: s.name, admissionNo: s.admissionNo, className: s.className, section: s.section,
          campusId: s.campusId, house: s.house, phone: s.phone,
          routeId: s.routeId, routeCode: rt ? rt.code : '—', routeName: rt ? rt.name : 'Unassigned',
          stopId: s.stopId, stopName: st ? st.name : 'Not set',
          pickupTime: st ? st.pickupTime : '—', dropTime: st ? st.dropTime : '—',
          fare: rt ? rt.fare : 0,
          status: rt ? 'Active' : 'Pending',
        };
      });

      mount.appendChild(listPage({
        title: 'Student route allocation',
        subtitle: `${num(rows.length)} students on transport · ${new Set(rows.map((r) => r.routeId)).size} routes in use`,
        route: 'transport/allocation',
        actions: pageActions(
          Button('Bulk reassign', { variant: 'secondary', icon: 'refresh-ccw', onClick: mockAction('Bulk reassign route') }),
          Button('Allocate student', { variant: 'primary', icon: 'user-check', onClick: () => Modal({
            title: 'Allocate a student to a route', size: 'lg', icon: 'user-check',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Student', required: true, className: 'col-span-full' },
                Combobox({ options: db.students.slice(0, 250).map((s) => ({ value: s.id, label: `${s.name} · ${s.className} · ${s.admissionNo}` })), placeholder: 'Search by name or admission number…' })),
              Field({ label: 'Route', required: true }, Combobox({ options: db.routes.map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` })) })),
              Field({ label: 'Stop', required: true }, Combobox({ options: db.stops.slice(0, 200).map((s) => ({ value: s.id, label: s.name })) })),
              Field({ label: 'Trips' }, Select({ options: ['Both ways', 'Pickup only', 'Drop only'], value: 'Both ways' })),
              Field({ label: 'Effective from' }, DatePicker({ value: TODAY })),
              Field({ label: 'Annual fare (₹)' }, Input({ type: 'number', value: '24000' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Allocate', { variant: 'primary', onClick: () => { close(); saved('Allocation'); } })),
          }) })),
        kpis: [
          { label: 'Students on transport', value: num(rows.length), icon: 'users', tone: 'brand' },
          { label: 'Routes in use', value: String(new Set(rows.map((r) => r.routeId)).size), icon: 'route', tone: 'info' },
          { label: 'Awaiting a stop', value: String(rows.filter((r) => r.stopName === 'Not set').length), icon: 'map-pin', tone: 'warning' },
          { label: 'Annual fare value', value: moneyC(rows.reduce((a, r) => a + r.fare, 0)), icon: 'wallet', tone: 'success', route: 'transport/fees' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Name, admission no or stop…', width: '260px' },
          { id: 'routeId', label: 'Route', options: db.routes.map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` })) },
          { id: 'className', label: 'Class', options: Array.from(new Set(rows.map((r) => r.className))).sort() },
          { id: 'status', label: 'Status', options: ['Active', 'Pending'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.name} ${r.admissionNo} ${r.stopName}`.toLowerCase().includes(String(x).toLowerCase()),
          routeId: (r, x) => r.routeId === x,
          className: (r, x) => r.className === x,
          status: (r, x) => r.status === x,
        })),
        chart: barChart({
          categories: countBy(rows, 'routeCode').slice(0, 14).map((c) => c.key),
          series: [{ name: 'Students', values: countBy(rows, 'routeCode').slice(0, 14).map((c) => c.value) }],
          height: 250, showValues: true,
        }),
        chartTitle: 'Riders per route',
        columns: [
          { key: 'name', label: 'Student', sticky: true, width: 240, render: (r) => Identity(r.name, `${r.className}-${r.section} · ${r.admissionNo}`) },
          { key: 'routeName', label: 'Route', width: 230, render: (r) => h('span', null, h('span', { className: 't-mono t-muted' }, r.routeCode + ' '), r.routeName) },
          { key: 'stopName', label: 'Stop', width: 220 },
          { key: 'pickupTime', label: 'Pickup', width: 100 },
          { key: 'dropTime', label: 'Drop', width: 100 },
          { key: 'phone', label: 'Contact', width: 150, className: 't-mono', hidden: true },
          { key: 'fare', label: 'Annual fare', width: 130, align: 'right', numeric: true, render: (r) => money(r.fare), aggregate: 'sum', format: moneyC },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['name', 'admissionNo', 'stopName', 'routeName'],
        bulkActions: [
          { label: 'Move to another route', icon: 'refresh-ccw', onClick: (sel) => notify({ title: `${sel.length} students queued for reassignment`, tone: 'info' }) },
          { label: 'Send stop timings', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} families notified`, tone: 'success' }) },
          { label: 'Withdraw from transport', icon: 'x-circle', tone: 'danger', onClick: (sel) => confirmDanger('Withdraw from transport?', `${sel.length} students will lose their seat from the next working day.`, () => notify({ title: 'Withdrawn', tone: 'warning' }), 'Withdraw') },
        ],
        onRowClick: (r) => navigate(`students/profile/${r.id}`),
        rowActions: (r) => [
          { label: 'Student profile', icon: 'user', route: `students/profile/${r.id}` },
          { label: 'Open route', icon: 'route', route: 'transport/routes' },
          { label: 'Transport fee', icon: 'wallet', route: 'transport/fees' },
        ],
        emptyState: emptyFor('user-check', 'No students on transport', 'Opt a student into transport from their profile to allocate a route.'),
      }));
    },
  },

  /* ------------------------------------------ transport/bus-attendance */
  'transport/bus-attendance': {
    title: 'Bus Attendance',
    subtitle: 'Boarding and alighting scans per trip',
    section: 'transport',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.busAttendance, ctx).map((a) => ({
        ...a,
        regNo: (byId(db.vehicles, a.vehicleId) || {}).regNo || '—',
        conductor: (byId(db.drivers, a.markedBy) || {}).name || '—',
        status: a.percent >= 95 ? 'Complete' : a.percent >= 80 ? 'Partial' : 'Review',
      }));
      const byDay = Array.from(groupBy(rows, 'date').entries())
        .map(([date, list]) => ({ date, percent: Number((list.reduce((a, x) => a + x.percent, 0) / list.length).toFixed(1)) }))
        .sort((a, b) => a.date.localeCompare(b.date));

      mount.appendChild(listPage({
        title: 'Bus attendance',
        subtitle: `${num(rows.length)} scan sessions · average boarding ${(rows.reduce((a, r) => a + r.percent, 0) / Math.max(1, rows.length)).toFixed(1)}%`,
        route: 'transport/bus-attendance',
        actions: pageActions(
          Button('Absentee list', { variant: 'secondary', icon: 'user-x', onClick: mockAction('Generate absentee list') }),
          Button('Start a scan session', { variant: 'primary', icon: 'scan', onClick: () => Modal({
            title: 'Start a boarding scan', size: 'md', icon: 'scan',
            body: h('div', { className: 'stack-3' },
              FormGrid({ cols: 2 },
                Field({ label: 'Route', required: true, className: 'col-span-full' }, Combobox({ options: db.routes.map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` })) })),
                Field({ label: 'Trip' }, Select({ options: ['Morning Pickup', 'Evening Drop'], value: 'Morning Pickup' })),
                Field({ label: 'Date' }, DatePicker({ value: TODAY }))),
              Callout({ tone: 'info', title: 'How the scan works' },
                'The conductor’s handheld reads each student’s RFID card as they board. Cards not scanned at the stop are pushed to the class teacher as an absence for confirmation.')),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Start session', { variant: 'primary', icon: 'scan', onClick: () => { close(); notify({ title: 'Scan session started', text: 'Handheld devices on this route are now live.', tone: 'success' }); } })),
          }) })),
        kpis: [
          { label: 'Sessions logged', value: num(rows.length), icon: 'clipboard-check', tone: 'brand' },
          { label: 'Students boarded', value: num(rows.reduce((a, r) => a + r.boarded, 0)), icon: 'users', tone: 'success' },
          { label: 'Not boarded', value: num(rows.reduce((a, r) => a + r.absent, 0)), icon: 'user-x', tone: 'danger' },
          { label: 'Trips delayed', value: String(rows.filter((r) => r.delayMin >= 10).length), icon: 'timer', tone: 'warning' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Route or vehicle…', width: '240px' },
          { id: 'trip', label: 'Trip', options: ['Morning Pickup', 'Evening Drop'] },
          { id: 'status', label: 'Session', options: ['Complete', 'Partial', 'Review'] },
          { id: 'date', label: 'Date', type: 'date' },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.routeName} ${r.regNo}`.toLowerCase().includes(String(x).toLowerCase()),
          trip: (r, x) => r.trip === x,
          status: (r, x) => r.status === x,
          date: (r, x) => r.date === x,
        })),
        chart: lineChart({
          categories: byDay.map((d) => formatDate(d.date, 'dayMonth')),
          series: [{ name: 'Boarding %', values: byDay.map((d) => d.percent) }],
          target: 95, targetLabel: 'Target 95%', valueFormat: 'percent', height: 260, showDots: true,
        }),
        chartTitle: 'Daily boarding compliance',
        columns: [
          { key: 'date', label: 'Date', sticky: true, width: 130, render: (r) => dt(r.date) },
          { key: 'routeName', label: 'Route', width: 230 },
          { key: 'regNo', label: 'Vehicle', width: 140, className: 't-mono' },
          { key: 'trip', label: 'Trip', width: 150, filter: true },
          { key: 'expected', label: 'Expected', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'boarded', label: 'Boarded', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'absent', label: 'Absent', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'percent', label: 'Compliance', width: 170, render: (r) => ProgressBar(r.percent, { tone: r.percent >= 95 ? 'success' : r.percent >= 80 ? 'warning' : 'danger', showValue: true }), aggregate: 'avg', format: (v) => `${v.toFixed(1)}%` },
          { key: 'delayMin', label: 'Delay', width: 100, align: 'right', numeric: true, render: (r) => (r.delayMin ? h('span', { className: 't-warning' }, `${r.delayMin} min`) : 'On time') },
          { key: 'conductor', label: 'Marked by', width: 180, hidden: true },
          { key: 'status', label: 'Session', width: 130, filter: true, render: (r) => Badge(r.status === 'Complete' ? 'Completed' : r.status === 'Partial' ? 'Partial' : 'Under Review') },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['routeName', 'regNo', 'trip'],
        bulkActions: [
          { label: 'Notify absentee parents', icon: 'send', onClick: (sel) => notify({ title: `${sel.reduce((a, r) => a + r.absent, 0)} families notified`, tone: 'success' }) },
          { label: 'Flag for review', icon: 'flag', onClick: (sel) => notify({ title: `${sel.length} sessions flagged`, tone: 'warning' }) },
        ],
        rowActions: (r) => [
          { label: 'Open route', icon: 'route', route: 'transport/routes' },
          { label: 'Trip log', icon: 'history', route: 'transport/trip-log' },
          { label: 'Notify parents', icon: 'send', onClick: () => notify({ title: 'Parents notified', text: r.routeName, tone: 'success' }) },
        ],
        emptyState: emptyFor('clipboard-check', 'No scan sessions', 'Start a boarding scan from the conductor handheld to log attendance.'),
      }));
    },
  },

  /* ------------------------------------------------ transport/fuel-log */
  'transport/fuel-log': {
    title: 'Fuel Log',
    subtitle: 'Every fill, litre and rupee against the fleet',
    section: 'transport',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.fuelLogs, ctx).map((f) => ({
        ...f,
        driverName: (byId(db.drivers, f.filledBy) || {}).name || '—',
        efficiency: f.mileage >= 6 ? 'Good' : f.mileage >= 5 ? 'Average' : 'Poor',
      }));
      const byMonth = Array.from(groupBy(rows, (r) => formatDate(r.date, 'monthYear')).entries())
        .map(([month, list]) => ({ month, amount: list.reduce((a, x) => a + x.amount, 0), litres: Math.round(list.reduce((a, x) => a + x.litres, 0)) }));

      mount.appendChild(listPage({
        title: 'Fuel log',
        subtitle: `${num(rows.length)} fills · ${num(Math.round(rows.reduce((a, r) => a + r.litres, 0)))} litres · ${moneyC(rows.reduce((a, r) => a + r.amount, 0))}`,
        route: 'transport/fuel-log',
        actions: pageActions(
          Button('Mileage report', { variant: 'secondary', icon: 'chart-line', route: 'transport/reports' }),
          Button('Record a fill', { variant: 'primary', icon: 'fuel', onClick: () => Modal({
            title: 'Record a fuel fill', size: 'lg', icon: 'fuel',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Vehicle', required: true, className: 'col-span-full' }, Combobox({ options: db.vehicles.map((v) => ({ value: v.id, label: `${v.regNo} · ${v.model}` })) })),
              Field({ label: 'Date', required: true }, DatePicker({ value: TODAY })),
              Field({ label: 'Station' }, Select({ options: ['IOCL Sector 44', 'HP Sohna Road', 'BPCL Whitefield', 'Shell Baner', 'IOCL Gachibowli'] })),
              Field({ label: 'Litres', required: true }, Input({ type: 'number', placeholder: '62' })),
              Field({ label: 'Rate per litre (₹)', required: true }, Input({ type: 'number', placeholder: '94.20' })),
              Field({ label: 'Odometer (km)' }, Input({ type: 'number', placeholder: '128400' })),
              Field({ label: 'Bill', type: 'file' }, FileUpload({ label: 'Attach the fuel bill', hint: 'JPG or PDF' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Save fill', { variant: 'primary', onClick: () => { close(); saved('Fuel entry'); } })),
          }) })),
        kpis: [
          { label: 'Total spend', value: moneyC(rows.reduce((a, r) => a + r.amount, 0)), icon: 'rupee', tone: 'brand' },
          { label: 'Litres drawn', value: num(Math.round(rows.reduce((a, r) => a + r.litres, 0))), icon: 'droplet', tone: 'info' },
          { label: 'Avg rate', value: money(Math.round(rows.reduce((a, r) => a + r.rate, 0) / Math.max(1, rows.length))), icon: 'trending-up', tone: 'warning' },
          { label: 'Avg mileage', value: `${(rows.reduce((a, r) => a + r.mileage, 0) / Math.max(1, rows.length)).toFixed(1)} km/l`, icon: 'gauge', tone: 'success' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Vehicle or station…', width: '240px' },
          { id: 'station', label: 'Station', options: Array.from(new Set(rows.map((r) => r.station))) },
          { id: 'efficiency', label: 'Efficiency', options: ['Good', 'Average', 'Poor'] },
          { id: 'campus', label: 'Campus', options: campusOptions() },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.regNo} ${r.station}`.toLowerCase().includes(String(x).toLowerCase()),
          station: (r, x) => r.station === x,
          efficiency: (r, x) => r.efficiency === x,
          campus: (r, x) => r.campusId === x,
        })),
        chart: comboChart({
          categories: byMonth.map((m) => m.month),
          bars: [{ name: 'Spend', values: byMonth.map((m) => m.amount) }],
          line: { name: 'Litres × 100', values: byMonth.map((m) => m.litres * 100) },
          height: 270, valueFormat: 'currencyCompact',
        }),
        chartTitle: 'Fuel spend and volume by month',
        columns: [
          { key: 'date', label: 'Date', sticky: true, width: 130, render: (r) => dt(r.date) },
          { key: 'regNo', label: 'Vehicle', width: 150, className: 't-mono' },
          { key: 'station', label: 'Station', width: 180, filter: true },
          { key: 'litres', label: 'Litres', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: (v) => num(Math.round(v)) },
          { key: 'rate', label: 'Rate', width: 100, align: 'right', numeric: true, render: (r) => money(r.rate) },
          { key: 'amount', label: 'Amount', width: 130, align: 'right', numeric: true, render: (r) => money(r.amount), aggregate: 'sum', format: moneyC },
          { key: 'odometer', label: 'Odometer', width: 130, align: 'right', numeric: true, render: (r) => `${num(r.odometer)} km` },
          { key: 'mileage', label: 'km/l', width: 100, align: 'right', numeric: true, aggregate: 'avg', format: (v) => v.toFixed(1) },
          { key: 'efficiency', label: 'Efficiency', width: 130, filter: true, render: (r) => Badge(r.efficiency === 'Good' ? 'Verified' : r.efficiency === 'Average' ? 'Partial' : 'Overdue', { tone: r.efficiency === 'Good' ? 'success' : r.efficiency === 'Average' ? 'warning' : 'danger', icon: 'gauge' }) },
          { key: 'driverName', label: 'Filled by', width: 170, hidden: true },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['regNo', 'station'],
        bulkActions: [
          { label: 'Export for accounts', icon: 'download', onClick: (sel) => notify({ title: `${sel.length} entries exported`, tone: 'success' }) },
          { label: 'Flag for audit', icon: 'flag', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} entries flagged`, tone: 'warning' }) },
        ],
        rowActions: (r) => [
          { label: 'Open vehicle', icon: 'bus', route: 'transport/vehicles' },
          { label: 'View bill', icon: 'receipt', onClick: mockAction('Open fuel bill') },
        ],
        emptyState: emptyFor('fuel', 'No fills logged', 'Record a fuel fill to start tracking running cost.'),
      }));
    },
  },

  /* --------------------------------------------- transport/maintenance */
  'transport/maintenance': {
    title: 'Maintenance',
    subtitle: 'Workshop jobs, downtime and spend',
    section: 'transport',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.maintenanceLogs, ctx);
      const byType = countBy(rows, 'type');
      const spendByType = sumBy(rows, 'type', 'cost');

      mount.appendChild(listPage({
        title: 'Maintenance',
        subtitle: `${rows.length} workshop jobs · ${moneyC(rows.reduce((a, r) => a + r.cost, 0))} spent this session`,
        route: 'transport/maintenance',
        actions: pageActions(
          Button('Service schedule', { variant: 'secondary', icon: 'calendar', route: 'transport/vehicles' }),
          Button('Log a job', { variant: 'primary', icon: 'wrench', onClick: () => Modal({
            title: 'Log a maintenance job', size: 'lg', icon: 'wrench',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Vehicle', required: true, className: 'col-span-full' }, Combobox({ options: db.vehicles.map((v) => ({ value: v.id, label: `${v.regNo} · ${v.model}` })) })),
              Field({ label: 'Job type', required: true }, Select({ options: ['Routine Service', 'Brake Repair', 'Tyre Replacement', 'AC Service', 'Body Work', 'Engine Overhaul', 'Battery Replacement'] })),
              Field({ label: 'Garage' }, Select({ options: ['Authorised Tata Service', 'City Auto Works', 'Speed Motors', 'Ashok Leyland Service Point'] })),
              Field({ label: 'Date in' }, DatePicker({ value: TODAY })),
              Field({ label: 'Estimated cost (₹)' }, Input({ type: 'number', placeholder: '12500' })),
              Field({ label: 'Expected downtime (days)' }, Input({ type: 'number', value: '1' })),
              Field({ label: 'Remarks', className: 'col-span-full' }, Textarea({ rows: 3, placeholder: 'Front brake pads worn; also replacing wiper blades.' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Log job', { variant: 'primary', onClick: () => { close(); saved('Maintenance job'); } })),
          }) })),
        kpis: [
          { label: 'Jobs logged', value: String(rows.length), icon: 'wrench', tone: 'brand' },
          { label: 'Spend', value: moneyC(rows.reduce((a, r) => a + r.cost, 0)), icon: 'rupee', tone: 'warning' },
          { label: 'Downtime days', value: num(rows.reduce((a, r) => a + r.downtimeDays, 0)), icon: 'timer', tone: 'danger' },
          { label: 'In progress', value: String(rows.filter((r) => r.status === 'In Progress').length), icon: 'tool', tone: 'info' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Vehicle or garage…', width: '240px' },
          { id: 'type', label: 'Job type', options: byType.map((t) => t.key) },
          { id: 'status', label: 'Status', options: ['Completed', 'In Progress', 'Scheduled'] },
          { id: 'garage', label: 'Garage', options: Array.from(new Set(rows.map((r) => r.garage))) },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.regNo} ${r.garage} ${r.type}`.toLowerCase().includes(String(x).toLowerCase()),
          type: (r, x) => r.type === x,
          status: (r, x) => r.status === x,
          garage: (r, x) => r.garage === x,
        })),
        chart: barChart({
          categories: spendByType.map((t) => t.key),
          series: [{ name: 'Spend', values: spendByType.map((t) => t.value) }],
          horizontal: true, height: 280, valueFormat: 'currencyCompact', showValues: true,
        }),
        chartTitle: 'Workshop spend by job type',
        columns: [
          { key: 'date', label: 'Date', sticky: true, width: 130, render: (r) => dt(r.date) },
          { key: 'regNo', label: 'Vehicle', width: 150, className: 't-mono' },
          { key: 'type', label: 'Job', width: 190, filter: true },
          { key: 'garage', label: 'Garage', width: 210, filter: true },
          { key: 'cost', label: 'Cost', width: 130, align: 'right', numeric: true, render: (r) => money(r.cost), aggregate: 'sum', format: moneyC },
          { key: 'downtimeDays', label: 'Downtime', width: 120, align: 'right', numeric: true, render: (r) => `${r.downtimeDays} d`, aggregate: 'sum', format: (v) => `${v} d` },
          { key: 'odometer', label: 'Odometer', width: 130, align: 'right', numeric: true, render: (r) => `${num(r.odometer)} km`, hidden: true },
          { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['regNo', 'garage', 'type'],
        expandable: (r) => Card({ pad: true },
          h('div', { className: 'stack-2' },
            h('div', { className: 't-eyebrow' }, 'Workshop note'),
            h('div', { className: 't-sm' }, r.remarks),
            h('div', { className: 'row-3 row-wrap' },
              Badge(r.status), Badge(`${r.downtimeDays} days off road`, { tone: r.downtimeDays > 2 ? 'danger' : 'neutral' }),
              Badge(money(r.cost), { tone: 'info' })))),
        bulkActions: [
          { label: 'Mark completed', icon: 'check-circle', onClick: (sel) => notify({ title: `${sel.length} jobs closed`, tone: 'success' }) },
          { label: 'Export to accounts', icon: 'download', onClick: (sel) => notify({ title: `${sel.length} jobs exported`, tone: 'success' }) },
        ],
        rowActions: (r) => [
          { label: 'Open vehicle', icon: 'bus', route: 'transport/vehicles' },
          { label: 'Raise purchase request', icon: 'shopping-cart', route: 'inventory/purchase-requests' },
          { separator: true },
          { label: 'Cancel job', icon: 'x-circle', tone: 'danger', onClick: () => confirmDanger('Cancel this job?', `${r.type} on ${r.regNo} will be removed from the workshop board.`, () => notify({ title: 'Job cancelled', tone: 'success' }), 'Cancel job') },
        ],
        emptyState: emptyFor('wrench', 'No jobs logged', 'Log a service or repair to start tracking downtime.'),
      }));
    },
  },

  /* ----------------------------------------------- transport/documents */
  'transport/documents': {
    title: 'Insurance & Documents',
    subtitle: 'Statutory paperwork for every vehicle',
    section: 'transport',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.vehicles, ctx).map((v) => {
        const risk = docRisk(v);
        return {
          ...v,
          insuranceDays: daysFromToday(v.insuranceExpiry),
          pucDays: daysFromToday(v.pucExpiry),
          fitnessDays: daysFromToday(v.fitnessExpiry),
          permitDays: daysFromToday(v.permitExpiry),
          expiredDocs: risk.expired, soonDocs: risk.soon, docStatus: risk.worst,
          nextExpiry: DOC_FIELDS.map(([k]) => v[k]).filter(Boolean).sort()[0],
        };
      });
      const expired = rows.filter((r) => r.expiredDocs > 0);
      const soon = rows.filter((r) => !r.expiredDocs && r.soonDocs > 0);

      mount.appendChild(listPage({
        title: 'Insurance & documents',
        subtitle: `${expired.length} vehicles with a lapsed paper · ${soon.length} lapsing inside 45 days`,
        route: 'transport/documents',
        actions: pageActions(
          Button('Download pack', { variant: 'secondary', icon: 'download', onClick: () => notify({ title: 'Document pack queued', text: 'A zip of all current RC, insurance and fitness copies.', tone: 'success' }) }),
          Button('Upload renewal', { variant: 'primary', icon: 'upload', onClick: () => Modal({
            title: 'Upload a renewed document', size: 'md', icon: 'shield',
            body: h('div', { className: 'stack-3' },
              FormGrid({ cols: 2 },
                Field({ label: 'Vehicle', required: true, className: 'col-span-full' }, Combobox({ options: db.vehicles.map((v) => ({ value: v.id, label: `${v.regNo} · ${v.model}` })) })),
                Field({ label: 'Document', required: true }, Select({ options: ['Insurance', 'PUC', 'Fitness', 'Permit', 'Registration Certificate'] })),
                Field({ label: 'Valid till', required: true }, DatePicker({})),
                Field({ label: 'Policy / certificate no' }, Input({ placeholder: 'POL-2026-000123' })),
                Field({ label: 'Premium / fee (₹)' }, Input({ type: 'number', placeholder: '38500' }))),
              FileUpload({ label: 'Attach the scanned certificate', hint: 'PDF or JPG, up to 10 MB' })),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Save document', { variant: 'primary', onClick: () => { close(); saved('Document'); } })),
          }) })),
        kpis: [
          { label: 'Vehicles', value: String(rows.length), icon: 'bus', tone: 'brand' },
          { label: 'Fully compliant', value: String(rows.filter((r) => r.docStatus === 'Valid').length), icon: 'shield-check', tone: 'success' },
          { label: 'Expiring ≤45 days', value: String(soon.length), icon: 'clock', tone: 'warning' },
          { label: 'Already lapsed', value: String(expired.length), icon: 'alert-triangle', tone: 'danger' },
        ],
        notes: expired.length ? Callout({ tone: 'danger', icon: 'alert-triangle', title: `${expired.length} vehicles must not run` },
          'A lapsed insurance, fitness or permit certificate makes the vehicle illegal on the road and voids the school’s cover. Park these buses and arrange replacements before the next trip.') : null,
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Registration or model…', width: '240px' },
          { id: 'docStatus', label: 'Compliance', options: ['Valid', 'Expiring', 'Expired'] },
          { id: 'campus', label: 'Campus', options: campusOptions() },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.regNo} ${r.model}`.toLowerCase().includes(String(x).toLowerCase()),
          docStatus: (r, x) => r.docStatus === x,
          campus: (r, x) => r.campusId === x,
        })),
        chart: barChart({
          categories: ['Insurance', 'PUC', 'Fitness', 'Permit'],
          series: [
            { name: 'Expired', values: [rows.filter((r) => r.insuranceDays < 0).length, rows.filter((r) => r.pucDays < 0).length, rows.filter((r) => r.fitnessDays < 0).length, rows.filter((r) => r.permitDays < 0).length] },
            { name: 'Expiring ≤45 days', values: [rows.filter((r) => r.insuranceDays >= 0 && r.insuranceDays <= 45).length, rows.filter((r) => r.pucDays >= 0 && r.pucDays <= 45).length, rows.filter((r) => r.fitnessDays >= 0 && r.fitnessDays <= 45).length, rows.filter((r) => r.permitDays >= 0 && r.permitDays <= 45).length] },
            { name: 'Valid', values: [rows.filter((r) => r.insuranceDays > 45).length, rows.filter((r) => r.pucDays > 45).length, rows.filter((r) => r.fitnessDays > 45).length, rows.filter((r) => r.permitDays > 45).length] },
          ],
          stacked: true, height: 260,
        }),
        chartTitle: 'Compliance by document type',
        columns: [
          { key: 'regNo', label: 'Vehicle', sticky: true, width: 190, render: (r) => Identity(r.regNo, `${r.model} · ${campusName(r.campusId)}`), value: (r) => r.regNo },
          { key: 'insuranceExpiry', label: 'Insurance', width: 180, value: (r) => r.insuranceDays, render: (r) => expiryChip(r.insuranceExpiry, 'Valid to') },
          { key: 'pucExpiry', label: 'PUC', width: 180, value: (r) => r.pucDays, render: (r) => expiryChip(r.pucExpiry, 'Valid to') },
          { key: 'fitnessExpiry', label: 'Fitness', width: 180, value: (r) => r.fitnessDays, render: (r) => expiryChip(r.fitnessExpiry, 'Valid to') },
          { key: 'permitExpiry', label: 'Permit', width: 180, value: (r) => r.permitDays, render: (r) => expiryChip(r.permitExpiry, 'Valid to') },
          { key: 'docStatus', label: 'Overall', width: 140, filter: true,
            render: (r) => Badge(r.docStatus === 'Valid' ? 'Verified' : r.docStatus === 'Expiring' ? 'Pending' : 'Expired',
              { tone: r.docStatus === 'Valid' ? 'success' : r.docStatus === 'Expiring' ? 'warning' : 'danger' }) },
        ],
        rows, selectable: true, pageSize: 25,
        searchKeys: ['regNo', 'model'],
        maxHeight: '62vh',
        bulkActions: [
          { label: 'Remind the transport office', icon: 'bell', onClick: (sel) => notify({ title: `${sel.length} renewal reminders raised`, tone: 'success' }) },
          { label: 'Take off road', icon: 'x-circle', tone: 'danger', onClick: (sel) => confirmDanger('Take these vehicles off road?', `${sel.length} vehicles will be unassigned and affected families notified.`, () => notify({ title: 'Vehicles parked', tone: 'warning' }), 'Take off road') },
        ],
        rowActions: (r) => [
          { label: 'Upload renewal', icon: 'upload', onClick: mockAction('Upload renewal') },
          { label: 'Open vehicle', icon: 'bus', route: 'transport/vehicles' },
          { label: 'Copy registration', icon: 'copy', onClick: () => copyToClipboard(r.regNo) },
        ],
        emptyState: emptyFor('shield-check', 'Nothing to chase', 'Every vehicle document is valid for more than 45 days.'),
      }));
    },
  },

  /* ------------------------------------------------ transport/trip-log */
  'transport/trip-log': {
    title: 'Trip Log',
    subtitle: 'Every run, its timing and its load',
    section: 'transport',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(trips(), ctx);
      const delayed = rows.filter((r) => r.status === 'Delayed');

      mount.appendChild(listPage({
        title: 'Trip log',
        subtitle: `${num(rows.length)} runs recorded · ${delayed.length} delayed by 15 minutes or more`,
        route: 'transport/trip-log',
        actions: pageActions(
          Button('Live tracking', { variant: 'secondary', icon: 'navigation', route: 'transport/tracking' }),
          Button('Export log', { variant: 'primary', icon: 'download', onClick: () => notify({ title: 'Trip log exported', tone: 'success' }) })),
        kpis: [
          { label: 'Trips', value: num(rows.length), icon: 'history', tone: 'brand' },
          { label: 'Distance run', value: `${num(Math.round(rows.reduce((a, r) => a + (r.distanceKm || 0), 0)))} km`, icon: 'navigation', tone: 'info' },
          { label: 'On time', value: `${Math.round((rows.filter((r) => r.status === 'Completed').length / Math.max(1, rows.length)) * 100)}%`, icon: 'clock', tone: 'success' },
          { label: 'Delayed', value: String(delayed.length), icon: 'timer', tone: 'danger' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Route, vehicle or driver…', width: '250px' },
          { id: 'trip', label: 'Trip', options: ['Morning Pickup', 'Evening Drop'] },
          { id: 'status', label: 'Status', options: ['Completed', 'Delayed'] },
          { id: 'date', label: 'Date', type: 'date' },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.routeName} ${r.regNo} ${r.driverName}`.toLowerCase().includes(String(x).toLowerCase()),
          trip: (r, x) => r.trip === x,
          status: (r, x) => r.status === x,
          date: (r, x) => r.date === x,
        })),
        chart: barChart({
          categories: ['On time', '≤5 min', '6–10 min', '11–20 min', '20+ min'],
          series: [{ name: 'Trips', values: [
            rows.filter((r) => r.delayMin === 0).length,
            rows.filter((r) => r.delayMin > 0 && r.delayMin <= 5).length,
            rows.filter((r) => r.delayMin > 5 && r.delayMin <= 10).length,
            rows.filter((r) => r.delayMin > 10 && r.delayMin <= 20).length,
            rows.filter((r) => r.delayMin > 20).length,
          ] }],
          height: 240, showValues: true,
        }),
        chartTitle: 'Delay distribution across all runs',
        columns: [
          { key: 'date', label: 'Date', sticky: true, width: 130, render: (r) => dt(r.date) },
          { key: 'routeName', label: 'Route', width: 230, render: (r) => h('span', null, h('span', { className: 't-mono t-muted' }, `${r.code || ''} `), r.routeName) },
          { key: 'regNo', label: 'Vehicle', width: 140, className: 't-mono' },
          { key: 'driverName', label: 'Driver', width: 180 },
          { key: 'trip', label: 'Trip', width: 150, filter: true },
          { key: 'startTime', label: 'Start', width: 90 },
          { key: 'endTime', label: 'End', width: 90 },
          { key: 'distanceKm', label: 'Distance', width: 110, align: 'right', numeric: true, render: (r) => `${r.distanceKm} km`, aggregate: 'sum', format: (v) => `${Math.round(v)} km` },
          { key: 'boarded', label: 'Onboard', width: 110, align: 'right', numeric: true, render: (r) => `${r.boarded}/${r.expected}`, value: (r) => r.boarded, aggregate: 'sum', format: num },
          { key: 'delayMin', label: 'Delay', width: 100, align: 'right', numeric: true, render: (r) => (r.delayMin ? h('span', { className: r.delayMin >= 15 ? 't-danger' : 't-warning' }, `${r.delayMin} min`) : h('span', { className: 't-success' }, 'On time')), aggregate: 'avg', format: (v) => `${v.toFixed(1)} min` },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status === 'Delayed' ? 'Overdue' : 'Completed', { tone: r.status === 'Delayed' ? 'danger' : 'success' }) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['routeName', 'regNo', 'driverName'],
        bulkActions: stdBulk('trips'),
        rowActions: (r) => [
          { label: 'Open route', icon: 'route', route: 'transport/routes' },
          { label: 'Boarding scans', icon: 'clipboard-check', route: 'transport/bus-attendance' },
          { label: 'Report an incident', icon: 'alert-triangle', tone: 'danger', route: 'transport/incidents' },
        ],
        emptyState: emptyFor('history', 'No trips logged', 'Trips appear here once the day’s runs are closed off.'),
      }));
    },
  },

  /* ---------------------------------------------------- transport/fees */
  'transport/fees': {
    title: 'Transport Fees',
    subtitle: 'Route-based fee billing and collection',
    section: 'transport',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.students.filter((s) => s.transportOpted && s.routeId), ctx).map((s) => {
        const rt = byId(db.routes, s.routeId) || {};
        const billed = rt.fare || 24000;
        const paidPct = [100, 100, 75, 50, 25, 0][hashOf('tf' + s.id) % 6];
        const paid = Math.round((billed * paidPct) / 100);
        const due = billed - paid;
        return {
          id: s.id, name: s.name, admissionNo: s.admissionNo, className: s.className, section: s.section,
          campusId: s.campusId, phone: s.phone,
          routeCode: rt.code || '—', routeName: rt.name || '—',
          billed, paid, due,
          instalment: `${Math.min(4, 1 + Math.floor(paidPct / 25))} of 4`,
          status: due === 0 ? 'Paid' : paid === 0 ? 'Overdue' : 'Partial',
          dueDate: '2026-09-10',
        };
      });
      const billedTotal = rows.reduce((a, r) => a + r.billed, 0);
      const collected = rows.reduce((a, r) => a + r.paid, 0);

      mount.appendChild(listPage({
        title: 'Transport fees',
        subtitle: `${num(rows.length)} riders billed · ${moneyC(collected)} of ${moneyC(billedTotal)} collected`,
        route: 'transport/fees',
        actions: pageActions(
          Button('Send reminders', { variant: 'secondary', icon: 'send', onClick: () => notify({ title: `${rows.filter((r) => r.due > 0).length} reminders queued`, tone: 'success' }) }),
          Button('Collect fee', { variant: 'primary', icon: 'credit-card', route: 'fees/collection' })),
        kpis: [
          { label: 'Billed', value: moneyC(billedTotal), icon: 'receipt', tone: 'info' },
          { label: 'Collected', value: moneyC(collected), delta: 6.2, icon: 'wallet', tone: 'success' },
          { label: 'Outstanding', value: moneyC(billedTotal - collected), delta: -3.4, icon: 'alert-circle', tone: 'danger' },
          { label: 'Collection rate', value: `${Math.round((collected / Math.max(1, billedTotal)) * 100)}%`, icon: 'percent', tone: 'brand' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Student or admission no…', width: '250px' },
          { id: 'status', label: 'Status', options: ['Paid', 'Partial', 'Overdue'] },
          { id: 'routeCode', label: 'Route', options: Array.from(new Set(rows.map((r) => r.routeCode))).sort() },
          { id: 'className', label: 'Class', options: Array.from(new Set(rows.map((r) => r.className))).sort() },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.name} ${r.admissionNo}`.toLowerCase().includes(String(x).toLowerCase()),
          status: (r, x) => r.status === x,
          routeCode: (r, x) => r.routeCode === x,
          className: (r, x) => r.className === x,
        })),
        chart: barChart({
          categories: Array.from(groupBy(rows, 'routeCode').keys()).slice(0, 14),
          series: [
            { name: 'Collected', values: Array.from(groupBy(rows, 'routeCode').values()).slice(0, 14).map((l) => l.reduce((a, r) => a + r.paid, 0)) },
            { name: 'Outstanding', values: Array.from(groupBy(rows, 'routeCode').values()).slice(0, 14).map((l) => l.reduce((a, r) => a + r.due, 0)) },
          ],
          stacked: true, height: 270, valueFormat: 'currencyCompact',
        }),
        chartTitle: 'Collection against outstanding, by route',
        columns: [
          { key: 'name', label: 'Student', sticky: true, width: 240, render: (r) => Identity(r.name, `${r.className}-${r.section} · ${r.admissionNo}`) },
          { key: 'routeName', label: 'Route', width: 220, render: (r) => h('span', null, h('span', { className: 't-mono t-muted' }, `${r.routeCode} `), r.routeName) },
          { key: 'billed', label: 'Billed', width: 130, align: 'right', numeric: true, render: (r) => money(r.billed), aggregate: 'sum', format: moneyC },
          { key: 'paid', label: 'Paid', width: 130, align: 'right', numeric: true, render: (r) => money(r.paid), aggregate: 'sum', format: moneyC },
          { key: 'due', label: 'Due', width: 130, align: 'right', numeric: true, render: (r) => (r.due ? h('span', { className: 't-danger t-semibold' }, money(r.due)) : '—'), aggregate: 'sum', format: moneyC },
          { key: 'instalment', label: 'Instalment', width: 120, align: 'center' },
          { key: 'dueDate', label: 'Next due', width: 130, render: (r) => dt(r.dueDate) },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['name', 'admissionNo', 'routeName'],
        bulkActions: [
          { label: 'Send SMS reminder', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} reminders sent`, tone: 'success' }) },
          { label: 'Generate demand notes', icon: 'receipt', onClick: (sel) => notify({ title: `${sel.length} demand notes generated`, tone: 'success' }) },
          { label: 'Suspend transport', icon: 'x-circle', tone: 'danger', onClick: (sel) => confirmDanger('Suspend transport for these students?', `${sel.length} students will lose their seat until the dues are cleared.`, () => notify({ title: 'Transport suspended', tone: 'warning' }), 'Suspend') },
        ],
        onRowClick: (r) => navigate(`students/profile/${r.id}`),
        rowActions: (r) => [
          { label: 'Student profile', icon: 'user', route: `students/profile/${r.id}` },
          { label: 'Collect fee', icon: 'credit-card', route: 'fees/collection' },
          { label: 'Call guardian', icon: 'phone', onClick: () => notify({ title: 'Dialling', text: r.phone, tone: 'info' }) },
        ],
        emptyState: emptyFor('wallet', 'Nothing billed', 'Allocate students to a route to generate transport fee demands.'),
      }));
    },
  },

  /* ----------------------------------------------- transport/incidents */
  'transport/incidents': {
    title: 'Incidents',
    subtitle: 'Road, vehicle and boarding incidents',
    section: 'transport',
    render(mount, ctx) {
      ensureStyles();
      const base = db.incidents.filter((i) => i.type === 'Vehicle Incident' || i.location === 'Bus Bay' || i.location === 'Parking Area');
      const rows = scope(base, ctx).map((i) => {
        const veh = db.vehicles[hashOf('iv' + i.id) % db.vehicles.length];
        const rt = byId(db.routes, veh.routeId) || {};
        return {
          ...i,
          regNo: veh.regNo, vehicleId: veh.id,
          routeName: rt.name || '—', routeCode: rt.code || '—',
          driverName: (driverFor(veh) || {}).name || '—',
          injuries: i.type === 'Student Injury' ? 1 : 0,
          estimatedCost: intOf('ic' + i.id, 0, 48000),
        };
      });

      mount.appendChild(listPage({
        title: 'Transport incidents',
        subtitle: `${rows.length} incidents logged this session · ${rows.filter((r) => r.status !== 'Closed').length} still open`,
        route: 'transport/incidents',
        actions: pageActions(
          Button('Safety briefing pack', { variant: 'secondary', icon: 'file-text', onClick: mockAction('Open safety briefing pack') }),
          Button('Report an incident', { variant: 'primary', icon: 'alert-triangle', onClick: () => Modal({
            title: 'Report a transport incident', size: 'lg', icon: 'alert-triangle', tone: 'danger',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Vehicle', required: true }, Combobox({ options: db.vehicles.map((v) => ({ value: v.id, label: `${v.regNo} · ${v.model}` })) })),
              Field({ label: 'Route' }, Combobox({ options: db.routes.map((r) => ({ value: r.id, label: `${r.code} · ${r.name}` })) })),
              Field({ label: 'Date', required: true }, DatePicker({ value: TODAY })),
              Field({ label: 'Time' }, TimePicker({ value: '07:45' })),
              Field({ label: 'Type', required: true }, Select({ options: ['Vehicle Incident', 'Student Injury', 'Breakdown', 'Near Miss', 'Altercation'] })),
              Field({ label: 'Severity', required: true }, Select({ options: ['Low', 'Medium', 'High', 'Critical'] })),
              Field({ label: 'Location', className: 'col-span-full' }, Input({ placeholder: 'Sohna Road, near the flyover' })),
              Field({ label: 'What happened', className: 'col-span-full' }, Textarea({ rows: 4, placeholder: 'Describe the sequence of events, who was present and what was done immediately.' })),
              Field({ label: 'Photographs', className: 'col-span-full' }, FileUpload({ label: 'Attach photographs', hint: 'Up to 5 images' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('File report', { variant: 'danger', icon: 'alert-triangle', onClick: () => { close(); notify({ title: 'Incident filed', text: 'The principal and transport manager have been alerted.', tone: 'warning' }); } })),
          }) })),
        kpis: [
          { label: 'Incidents', value: String(rows.length), icon: 'alert-triangle', tone: 'brand' },
          { label: 'Open', value: String(rows.filter((r) => r.status === 'Open').length), icon: 'inbox', tone: 'danger' },
          { label: 'Under investigation', value: String(rows.filter((r) => r.status === 'Under Investigation').length), icon: 'search', tone: 'warning' },
          { label: 'Repair exposure', value: moneyC(rows.reduce((a, r) => a + r.estimatedCost, 0)), icon: 'rupee', tone: 'info' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Reference, vehicle or location…', width: '250px' },
          { id: 'severity', label: 'Severity', options: ['Low', 'Medium', 'High', 'Critical'] },
          { id: 'status', label: 'Status', options: ['Open', 'Under Investigation', 'Closed'] },
          { id: 'campus', label: 'Campus', options: campusOptions() },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.reference} ${r.regNo} ${r.location}`.toLowerCase().includes(String(x).toLowerCase()),
          severity: (r, x) => r.severity === x,
          status: (r, x) => r.status === x,
          campus: (r, x) => r.campusId === x,
        })),
        chart: donutChart({
          data: countBy(rows, 'severity').map((c) => ({ key: c.key, value: c.value })),
          height: 250, centerValue: String(rows.length), centerLabel: 'Incidents',
        }),
        chartTitle: 'Incidents by severity',
        columns: [
          { key: 'reference', label: 'Reference', sticky: true, width: 150, className: 't-mono' },
          { key: 'date', label: 'Date', width: 130, render: (r) => h('div', null, h('div', null, dt(r.date)), h('div', { className: 't-xs t-muted' }, r.time)) },
          { key: 'regNo', label: 'Vehicle', width: 140, className: 't-mono' },
          { key: 'routeName', label: 'Route', width: 200 },
          { key: 'type', label: 'Type', width: 170, filter: true },
          { key: 'severity', label: 'Severity', width: 130, filter: true, render: (r) => Badge(r.severity, { tone: r.severity === 'Critical' ? 'danger' : r.severity === 'High' ? 'danger' : r.severity === 'Medium' ? 'warning' : 'neutral' }) },
          { key: 'location', label: 'Location', width: 180 },
          { key: 'estimatedCost', label: 'Est. cost', width: 130, align: 'right', numeric: true, render: (r) => money(r.estimatedCost), aggregate: 'sum', format: moneyC },
          { key: 'status', label: 'Status', width: 170, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['reference', 'regNo', 'location', 'type'],
        expandable: (r) => Card({ pad: true },
          h('div', { className: 'stack-2' },
            h('div', { className: 't-eyebrow' }, 'What happened'),
            h('div', { className: 't-sm' }, r.description),
            h('div', { className: 't-eyebrow mt-3' }, 'Action taken'),
            h('div', { className: 't-sm' }, r.actionTaken),
            h('div', { className: 'row-3 row-wrap mt-3' },
              Badge(`Reported by ${r.reportedBy}`, { tone: 'neutral' }),
              Badge(`Driver ${r.driverName}`, { tone: 'neutral' }),
              Badge(`Follow-up ${formatDate(r.followUpDate, 'dayMonth')}`, { tone: 'info' })))),
        bulkActions: [
          { label: 'Close incidents', icon: 'check-circle', onClick: (sel) => notify({ title: `${sel.length} incidents closed`, tone: 'success' }) },
          { label: 'Escalate to principal', icon: 'trending-up', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} incidents escalated`, tone: 'warning' }) },
        ],
        rowActions: (r) => [
          { label: 'Open vehicle', icon: 'bus', route: 'transport/vehicles' },
          { label: 'Log a repair', icon: 'wrench', route: 'transport/maintenance' },
          { label: 'Notify parents', icon: 'send', onClick: () => notify({ title: 'Parents notified', text: r.routeName, tone: 'success' }) },
        ],
        emptyState: emptyFor('shield-check', 'No incidents', 'Nothing has been reported on the transport network this session.'),
      }));
    },
  },

  /* ------------------------------------------------- transport/reports */
  'transport/reports': {
    title: 'Transport Reports',
    subtitle: 'Utilisation, cost per kilometre and punctuality',
    section: 'transport',
    render(mount, ctx) {
      ensureStyles();
      const routes = scope(db.routes, ctx);
      const fuel = db.fuelLogs;
      const maint = db.maintenanceLogs;

      const rows = routes.map((rt) => {
        const veh = byId(db.vehicles, rt.vehicleId) || {};
        const f = fuel.filter((x) => x.vehicleId === rt.vehicleId);
        const m = maint.filter((x) => x.vehicleId === rt.vehicleId);
        const fuelCost = f.reduce((a, x) => a + x.amount, 0);
        const maintCost = m.reduce((a, x) => a + x.cost, 0);
        const kmPerSession = rt.distanceKm * 2 * 120;
        const util = analytics.transportUtilisation.find((u) => u.route === rt.code);
        return {
          id: rt.id, code: rt.code, routeName: rt.name, regNo: veh.regNo || '—',
          students: rt.studentCount, capacity: rt.capacity,
          utilisation: Math.round((rt.studentCount / rt.capacity) * 100),
          distanceKm: rt.distanceKm, kmPerSession: Math.round(kmPerSession),
          fuelCost, maintCost, totalCost: fuelCost + maintCost,
          costPerKm: Number(((fuelCost + maintCost) / Math.max(1, kmPerSession)).toFixed(2)),
          revenue: rt.monthlyRevenue * 10,
          onTime: util ? util.onTime : 92,
          margin: rt.monthlyRevenue * 10 - (fuelCost + maintCost),
        };
      });

      mount.appendChild(reportPage({
        title: 'Transport reports',
        subtitle: `${routes.length} routes · academic year 2026-27 · ${campusName(ctx.state.campusId)}`,
        route: 'transport/reports',
        filters: [
          { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'q1', label: 'Q1' }, { id: 'q2', label: 'Q2' }, { id: 'ytd', label: 'Year to date' }] },
          { id: 'campus', label: 'Campus', options: campusOptions() },
          { id: 'shift', label: 'Shift', options: ['Morning + Evening', 'Morning Only'] },
          { id: 'from', label: 'From', type: 'date' },
        ],
        onFilter: (id, v, all, table) => table.refresh(rows),
        summary: [
          { label: 'Routes', value: String(routes.length), icon: 'route', tone: 'brand' },
          { label: 'Students carried', value: num(rows.reduce((a, r) => a + r.students, 0)), icon: 'users', tone: 'info' },
          { label: 'Running cost', value: moneyC(rows.reduce((a, r) => a + r.totalCost, 0)), icon: 'rupee', tone: 'danger' },
          { label: 'Fee revenue', value: moneyC(rows.reduce((a, r) => a + r.revenue, 0)), delta: 5.6, icon: 'wallet', tone: 'success' },
        ],
        chart: [
          barChart({
            categories: rows.slice(0, 14).map((r) => r.code),
            series: [
              { name: 'Fuel', values: rows.slice(0, 14).map((r) => r.fuelCost) },
              { name: 'Maintenance', values: rows.slice(0, 14).map((r) => r.maintCost) },
            ],
            stacked: true, height: 280, valueFormat: 'currencyCompact',
          }),
          scatterPlot({
            points: rows.map((r) => ({ x: r.utilisation, y: r.costPerKm, label: r.code, group: r.utilisation > 90 ? 'High load' : r.utilisation > 65 ? 'Balanced' : 'Light load' })),
            xLabel: 'Seat utilisation (%)', yLabel: 'Cost per km (₹)', height: 300,
          }),
        ],
        chartTitle: 'Running cost by route, and cost against load',
        columns: [
          { key: 'code', label: 'Route', sticky: true, width: 100, className: 't-mono' },
          { key: 'routeName', label: 'Name', width: 230 },
          { key: 'regNo', label: 'Vehicle', width: 140, className: 't-mono' },
          { key: 'students', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'utilisation', label: 'Load', width: 150, render: (r) => ProgressBar(r.utilisation, { tone: r.utilisation > 92 ? 'warning' : 'success', showValue: true }), aggregate: 'avg', format: (v) => `${v.toFixed(0)}%` },
          { key: 'kmPerSession', label: 'Km / session', width: 140, align: 'right', numeric: true, render: (r) => num(r.kmPerSession), aggregate: 'sum', format: (v) => num(Math.round(v)) },
          { key: 'fuelCost', label: 'Fuel', width: 130, align: 'right', numeric: true, render: (r) => money(r.fuelCost), aggregate: 'sum', format: moneyC },
          { key: 'maintCost', label: 'Maintenance', width: 140, align: 'right', numeric: true, render: (r) => money(r.maintCost), aggregate: 'sum', format: moneyC },
          { key: 'costPerKm', label: '₹ / km', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => v.toFixed(2) },
          { key: 'revenue', label: 'Fee revenue', width: 140, align: 'right', numeric: true, render: (r) => money(r.revenue), aggregate: 'sum', format: moneyC },
          { key: 'margin', label: 'Surplus', width: 140, align: 'right', numeric: true, render: (r) => h('span', { className: r.margin >= 0 ? 't-success' : 't-danger' }, money(r.margin)), aggregate: 'sum', format: moneyC },
          { key: 'onTime', label: 'On time', width: 110, align: 'right', numeric: true, render: (r) => `${r.onTime}%`, aggregate: 'avg', format: (v) => `${v.toFixed(1)}%` },
        ],
        rows,
        tableTitle: 'Route economics',
        notes: Callout({ tone: 'info', title: 'Reading the scatter' },
          'Routes in the top-left carry few students at a high cost per kilometre — they are the first candidates for a merge. Routes in the bottom-right are efficient and can absorb new admissions.'),
      }));
    },
  },

  /* ------------------------------------------------ transport/settings */
  'transport/settings': {
    title: 'Transport Settings',
    subtitle: 'Fares, safety rules and tracking configuration',
    section: 'transport',
    render(mount) {
      ensureStyles();
      mount.appendChild(settingsPage({
        title: 'Transport settings',
        subtitle: 'Applies to every campus unless a route overrides it',
        route: 'transport/settings',
        saveLabel: 'Save transport settings',
        onSave: () => saved('Transport settings'),
        groups: [
          {
            id: 'fares', title: 'Fares & billing', icon: 'wallet', cols: 2,
            description: 'Defaults used when a new route or allocation is created.',
            fields: [
              { id: 'fareModel', label: 'Fare model', type: 'select', options: ['Flat annual fare', 'Distance slab', 'Stop-wise fare'], value: 'Distance slab' },
              { id: 'instalments', label: 'Instalments per year', type: 'select', options: ['1', '2', '4', '10'], value: '4' },
              { id: 'baseFare', label: 'Base annual fare (₹)', type: 'number', value: 18000 },
              { id: 'perKm', label: 'Additional per km (₹)', type: 'number', value: 620 },
              { id: 'siblingDiscount', label: 'Sibling discount (%)', type: 'number', value: 10, hint: 'Applied to the younger sibling’s transport fee.' },
              { id: 'lateFee', label: 'Late fee per day (₹)', type: 'number', value: 20 },
            ],
          },
          {
            id: 'safety', title: 'Safety rules', icon: 'shield', cols: 2,
            description: 'Hard rules the transport office cannot override from a route screen.',
            fields: [
              { id: 'gps', label: 'GPS mandatory', type: 'switch', value: true, switchLabel: 'Block dispatch of a vehicle with an offline GPS device', description: 'A vehicle without a live ping cannot be marked On Route.' },
              { id: 'cctv', label: 'CCTV mandatory', type: 'switch', value: true, switchLabel: 'Require a working camera on every bus' },
              { id: 'conductor', label: 'Female attendant', type: 'switch', value: true, switchLabel: 'Require a female attendant on primary-school routes' },
              { id: 'speedLimit', label: 'Speed limit (km/h)', type: 'number', value: 40 },
              { id: 'docBlock', label: 'Document lapse', type: 'switch', value: true, switchLabel: 'Automatically park a vehicle when a document lapses' },
              { id: 'verifyDays', label: 'Police verification validity (months)', type: 'number', value: 24 },
            ],
          },
          {
            id: 'tracking', title: 'Live tracking', icon: 'navigation', cols: 2,
            fields: [
              { id: 'pingInterval', label: 'GPS ping interval (seconds)', type: 'select', options: ['10', '15', '30', '60'], value: '15' },
              { id: 'geofence', label: 'Stop geofence radius (m)', type: 'number', value: 80 },
              { id: 'parentTracking', label: 'Parent visibility', type: 'switch', value: true, switchLabel: 'Show the live bus position in the parent app', description: 'Visible from 30 minutes before pickup until the bus reaches school.' },
              { id: 'etaAlerts', label: 'ETA alerts', type: 'switch', value: true, switchLabel: 'Push a notification when the bus is two stops away' },
              { id: 'delayThreshold', label: 'Delay alert threshold (minutes)', type: 'number', value: 10 },
              { id: 'retention', label: 'Trip history retention (days)', type: 'number', value: 180 },
            ],
          },
          {
            id: 'attendance', title: 'Boarding attendance', icon: 'clipboard-check', cols: 2,
            fields: [
              { id: 'mode', label: 'Scan mode', type: 'select', options: ['RFID card', 'QR code', 'Manual roll call'], value: 'RFID card' },
              { id: 'alertMiss', label: 'Missed boarding alert', type: 'switch', value: true, switchLabel: 'SMS the guardian when a student does not board' },
              { id: 'alightConfirm', label: 'Alighting confirmation', type: 'switch', value: true, switchLabel: 'Require a scan when the child gets off in the evening' },
              { id: 'graceMin', label: 'Wait at stop (minutes)', type: 'number', value: 2 },
            ],
          },
          {
            id: 'contacts', title: 'Escalation contacts', icon: 'phone-call', cols: 2,
            actions: [Button('Test alert', { variant: 'secondary', size: 'sm', icon: 'siren', onClick: () => notify({ title: 'Test alert sent', text: 'All escalation contacts received the test message.', tone: 'info' }) })],
            fields: [
              { id: 'controlRoom', label: 'Transport control room', value: '+91 124 4567 800' },
              { id: 'emergency', label: 'Emergency number', value: '+91 98110 22110' },
              { id: 'escalation1', label: 'First escalation', value: 'Transport Manager' },
              { id: 'escalation2', label: 'Second escalation', value: 'Principal' },
            ],
          },
        ],
      }));
    },
  },
};

/* ==========================================================================
   6. HOSTEL
   ========================================================================== */

const WARDEN_ROLES = ['Chief Warden', 'Warden', 'Assistant Warden', 'Matron', 'Night Supervisor'];

function wardens() {
  return memo('wardens', () => {
    const pool = db.staff.filter((s) => s.type === 'Non-Teaching' || s.designation === 'School Nurse');
    const out = [];
    let n = 0;
    for (const hs of db.hostels) {
      for (let i = 0; i < 3; i++) {
        const st = pool[(hashOf(hs.id + i) % Math.max(1, pool.length))];
        if (!st) continue;
        n++;
        out.push({
          id: 'WRD' + String(n).padStart(3, '0'),
          staffId: st.id, name: st.name, employeeCode: st.employeeCode,
          hostelId: hs.id, hostelName: hs.name, campusId: hs.campusId,
          role: WARDEN_ROLES[i % WARDEN_ROLES.length],
          shift: i === 0 ? 'General (08:00–17:00)' : i === 1 ? 'Evening (14:00–22:00)' : 'Night (22:00–07:00)',
          phone: st.phone, email: st.email,
          residentsUnder: Math.round(hs.occupied / 3),
          quartersNo: `Q-${hs.id.slice(-1)}${i + 1}`,
          onDuty: i !== 2,
          experienceYears: st.experienceYears,
          status: st.status === 'Active' ? 'Active' : st.status,
        });
      }
    }
    return out;
  });
}

function hostelAttendance() {
  return memo('hostelAtt', () => {
    const out = [];
    const active = db.hostelAllocations.filter((a) => a.status === 'Active');
    let n = 0;
    for (let d = 0; d < 10; d++) {
      const date = new Date(new Date(TODAY).getTime() - d * 86400000).toISOString().slice(0, 10);
      for (const a of active) {
        n++;
        const seed = a.id + date;
        const st = boolOf(seed, 91) ? 'Present'
          : boolOf(seed + 'x', 55) ? 'On Leave'
            : boolOf(seed + 'y', 60) ? 'Late Entry' : 'Absent';
        out.push({
          id: 'HAT' + String(n).padStart(6, '0'),
          date, studentId: a.studentId, studentName: a.studentName, className: a.className,
          hostelId: a.hostelId, hostelName: a.hostelName, roomNo: a.roomNo, bedNo: a.bedNo,
          campusId: a.campusId,
          rollCall: '21:30',
          inTime: st === 'Late Entry' ? `22:${String(10 + (hashOf(seed) % 45)).padStart(2, '0')}` : '20:' + String(10 + (hashOf(seed) % 45)).padStart(2, '0'),
          status: st,
          markedBy: pickOf(['Night Supervisor', 'Warden', 'Assistant Warden'], seed),
          remarks: st === 'On Leave' ? 'Weekend leave approved' : st === 'Absent' ? 'Not in room at roll call — guardian called' : '',
        });
      }
    }
    return out;
  });
}

function messAttendance() {
  return memo('messAtt', () => {
    const out = [];
    let n = 0;
    for (let d = 0; d < 12; d++) {
      const date = new Date(new Date(TODAY).getTime() - d * 86400000).toISOString().slice(0, 10);
      for (const hs of db.hostels) {
        for (const meal of ['Breakfast', 'Lunch', 'Snacks', 'Dinner']) {
          n++;
          const seed = hs.id + date + meal;
          const expected = hs.occupied;
          const served = Math.max(0, expected - intOf(seed, 2, 34));
          out.push({
            id: 'MAT' + String(n).padStart(5, '0'),
            date, hostelId: hs.id, hostelName: hs.name, campusId: hs.campusId,
            meal, expected, served, skipped: expected - served,
            percent: Number(((served / Math.max(1, expected)) * 100).toFixed(1)),
            wastageKg: intOf(seed + 'w', 1, 22),
            costPerPlate: intOf(seed + 'c', 42, 96),
            markedBy: pickOf(['Mess Supervisor', 'Assistant Warden', 'Kitchen In-charge'], seed),
            status: served / Math.max(1, expected) > 0.85 ? 'Completed' : 'Partial',
          });
        }
      }
    }
    return out;
  });
}

function hostelTickets() {
  return memo('hostelTickets', () => {
    const rooms = db.hostelRooms.filter((r) => r.condition !== 'Good');
    return rooms.map((r, i) => {
      const opened = new Date(2026, 6, 1 + (hashOf('ht' + r.id) % 50));
      return {
        id: 'HMT' + String(i + 1).padStart(4, '0'),
        ticketNo: `HM/26-27/${String(i + 1).padStart(4, '0')}`,
        hostelId: r.hostelId, hostelName: r.hostelName, roomId: r.id, roomNo: r.roomNo,
        floor: r.floor, campusId: r.campusId,
        category: pickOf(['Plumbing', 'Electrical', 'Carpentry', 'Civil', 'Pest Control', 'Housekeeping'], 'hc' + r.id),
        issue: pickOf([
          'Bathroom tap leaking and flooding the floor.',
          'Two tube lights not working in the room.',
          'Cupboard door hinge broken.',
          'Damp patch on the ceiling after the rain.',
          'Fan making a loud noise at full speed.',
          'Window latch broken — cannot be shut at night.',
        ], 'hi' + r.id),
        priority: r.condition === 'Under Maintenance' ? 'High' : pickOf(['Normal', 'Normal', 'High', 'Low'], 'hp' + r.id),
        raisedBy: pickOf(['Warden', 'Resident', 'Housekeeping', 'Night Supervisor'], 'hr' + r.id),
        raisedOn: opened.toISOString().slice(0, 10),
        assignedTo: pickOf(['Ramesh (Plumber)', 'Sunil (Electrician)', 'Mahesh (Carpenter)', 'Estate Team'], 'ha' + r.id),
        cost: intOf('hcost' + r.id, 300, 14000),
        status: r.condition === 'Under Maintenance' ? 'In Progress' : pickOf(['Resolved', 'Resolved', 'Open', 'In Progress'], 'hs' + r.id),
        resolvedOn: null,
      };
    });
  });
}

function hostelComplaints() {
  return memo('hostelComplaints', () => db.complaints.slice(0, 90).map((c, i) => {
    const alloc = db.hostelAllocations[i % Math.max(1, db.hostelAllocations.length)] || {};
    return {
      ...c,
      hostelId: alloc.hostelId, hostelName: alloc.hostelName || '—', roomNo: alloc.roomNo || '—',
      residentName: alloc.studentName || c.raisedByName,
      area: pickOf(['Mess food', 'Wi-Fi', 'Cleanliness', 'Water supply', 'Noise', 'Laundry', 'Security'], 'ha' + c.id),
    };
  }));
}

function transferRequests() {
  return memo('transfers', () => db.hostelAllocations.filter((a, i) => a.status === 'Transfer Requested' || i % 9 === 0)
    .map((a, i) => {
      const to = db.hostelRooms.filter((r) => r.hostelId === a.hostelId && r.vacant > 0)[hashOf('tr' + a.id) % 6] || null;
      return {
        id: 'TRF' + String(i + 1).padStart(4, '0'),
        requestNo: `RT/26-27/${String(i + 1).padStart(4, '0')}`,
        studentId: a.studentId, studentName: a.studentName, className: a.className,
        campusId: a.campusId, hostelId: a.hostelId, hostelName: a.hostelName,
        fromRoom: a.roomNo, fromBed: a.bedNo,
        toRoom: to ? to.roomNo : '—', toHostel: to ? to.hostelName : a.hostelName,
        reason: pickOf([
          'Requesting to share a room with a classmate.',
          'Medical advice — needs a ground-floor room.',
          'Persistent disagreement with the current roommate.',
          'Wants an air-conditioned room, fee difference accepted.',
          'Sibling allocated to the adjacent block.',
        ], 'trr' + a.id),
        requestedOn: `2026-08-${String(1 + (hashOf('trd' + a.id) % 19)).padStart(2, '0')}`,
        approvedBy: pickOf(['Chief Warden', 'Warden', 'Principal'], 'tra' + a.id),
        feeDelta: to ? to.monthlyFee - a.monthlyFee : 0,
        status: pickOf(['Pending', 'Approved', 'Approved', 'Rejected', 'Completed'], 'trs' + a.id),
      };
    }));
}

/** Bed-level view of a room, for the occupancy grid. */
function bedsOfRoom(room) {
  const occupants = db.hostelAllocations.filter((a) => a.roomId === room.id && a.status === 'Active');
  const out = [];
  for (let b = 1; b <= room.beds; b++) {
    const who = occupants[b - 1] || null;
    out.push({
      id: `${room.id}-B${b}`,
      bedNo: `B${b}`,
      roomNo: room.roomNo,
      hostelName: room.hostelName,
      floor: room.floor,
      state: room.condition === 'Under Maintenance' ? 'repair' : who ? 'taken' : 'free',
      studentId: who ? who.studentId : null,
      studentName: who ? who.studentName : null,
      className: who ? who.className : null,
      messPlan: who ? who.messPlan : null,
      monthlyFee: room.monthlyFee,
    });
  }
  return out;
}

const hostelRoutes = {

  /* -------------------------------------------------- hostel/dashboard */
  'hostel/dashboard': {
    title: 'Hostel Dashboard',
    subtitle: 'Occupancy, attendance and mess at a glance',
    section: 'hostel',
    render(mount, ctx) {
      ensureStyles();
      const hostels = db.hostels;
      const rooms = db.hostelRooms;
      const allocs = db.hostelAllocations.filter((a) => a.status === 'Active');
      const att = hostelAttendance().filter((a) => a.date === TODAY);
      const mess = messAttendance().filter((m) => m.date === TODAY);
      const tickets = hostelTickets();

      mount.appendChild(dashboardPage({
        greeting: greetingFor((ctx.state.currentUser || {}).name || 'Warden'),
        title: 'Hostel operations',
        subtitle: `${hostels.length} blocks · ${num(rooms.length)} rooms · ${num(allocs.length)} residents`,
        route: 'hostel/dashboard',
        actions: pageActions(
          Button('Night attendance', { variant: 'secondary', icon: 'clipboard-check', route: 'hostel/attendance' }),
          Button('Allocate a bed', { variant: 'primary', icon: 'user-check', route: 'hostel/allocation' })),
        kpis: [
          { label: 'Residents', value: num(allocs.length), icon: 'users', tone: 'brand', trend: analytics.sparks.hostel, route: 'hostel/allocation' },
          { label: 'Occupancy', value: `${analytics.kpis.hostelOccupancy}%`, delta: 2.1, icon: 'bed', tone: 'success', route: 'hostel/beds' },
          { label: 'Vacant beds', value: num(rooms.reduce((a, r) => a + r.vacant, 0)), icon: 'door', tone: 'info', route: 'hostel/beds' },
          { label: 'Absent tonight', value: String(att.filter((a) => a.status === 'Absent').length), icon: 'user-x', tone: 'danger', route: 'hostel/attendance' },
          { label: 'Open tickets', value: String(tickets.filter((t) => t.status !== 'Resolved').length), icon: 'wrench', tone: 'warning', route: 'hostel/maintenance' },
          { label: 'Mess turnout', value: `${Math.round(mess.reduce((a, m) => a + m.percent, 0) / Math.max(1, mess.length))}%`, icon: 'utensils', tone: 'brand', route: 'hostel/mess-attendance' },
        ],
        widgets: [
          { span: 7, render: () => chartCard('Block occupancy',
            barChart({
              categories: analytics.hostelOccupancy.map((h2) => h2.hostel),
              series: [
                { name: 'Occupied', values: analytics.hostelOccupancy.map((h2) => h2.occupied) },
                { name: 'Vacant', values: analytics.hostelOccupancy.map((h2) => h2.vacant) },
              ],
              stacked: true, horizontal: true, height: 280,
            }), 'Beds taken against capacity, by block') },
          { span: 5, render: () => chartCard('Tonight’s roll call',
            donutChart({
              data: countBy(att, 'status').map((c) => ({ key: c.key, value: c.value })),
              height: 260, centerValue: String(att.length), centerLabel: 'Residents',
            }), `Roll call at 21:30 on ${formatDate(TODAY, 'medium')}`) },
          { span: 6, render: () => chartCard('Mess turnout by meal',
            barChart({
              categories: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
              series: [{ name: 'Turnout %', values: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map((m) => {
                const list = mess.filter((x) => x.meal === m);
                return list.length ? Number((list.reduce((a, x) => a + x.percent, 0) / list.length).toFixed(1)) : 0;
              }) }],
              valueFormat: 'percent', height: 260, showValues: true,
            }), 'Plates served against residents on the roll') },
          { span: 6, render: () => SectionCard({
            title: 'Rooms needing attention', icon: 'wrench',
            subtitle: `${tickets.filter((t) => t.status !== 'Resolved').length} open maintenance tickets`,
            actions: Button('All tickets', { variant: 'link', size: 'sm', route: 'hostel/maintenance' }), flush: true,
          }, DataTable({
            rows: tickets.filter((t) => t.status !== 'Resolved').slice(0, 60),
            pageSize: 6, searchable: false, exportable: false, columnToggle: false,
            columns: [
              { key: 'roomNo', label: 'Room', width: 110, render: (t) => h('div', null, h('div', { className: 't-medium' }, t.roomNo), h('div', { className: 't-xs t-muted t-truncate' }, t.hostelName)) },
              { key: 'category', label: 'Category', width: 130 },
              { key: 'priority', label: 'Priority', width: 110, render: (t) => Badge(t.priority === 'High' ? 'Overdue' : t.priority === 'Low' ? 'New' : 'Pending', { tone: t.priority === 'High' ? 'danger' : t.priority === 'Low' ? 'info' : 'warning', icon: 'flag' }) },
              { key: 'status', label: 'Status', width: 130, render: (t) => Badge(t.status) },
            ],
            onRowClick: () => navigate('hostel/maintenance'),
            emptyState: emptyFor('check-circle', 'Nothing pending', 'Every reported issue has been closed.'),
          })) },
          { span: 12, render: () => SectionCard({
            title: 'Blocks', icon: 'building-2',
            actions: Button('Manage blocks', { variant: 'link', size: 'sm', route: 'hostel/buildings' }),
          }, h('div', { className: 'grid grid-4' },
            hostels.map((hs) => Card({ pad: true, className: 'card-interactive', onClick: () => navigate('hostel/rooms') },
              h('div', { className: 'stack-2' },
                h('div', { className: 'row-3' }, Icon('building-2', 18), h('span', { className: 't-semibold' }, hs.name)),
                h('div', { className: 't-xs t-muted' }, `${hs.type} · ${hs.floors} floors · ${hs.rooms} rooms · ${hs.mess}`),
                ProgressBar(Math.round((hs.occupied / hs.capacity) * 100), { tone: hs.occupied / hs.capacity > 0.92 ? 'warning' : 'success', showValue: true }),
                h('div', { className: 't-xs t-muted' }, `${hs.occupied} of ${hs.capacity} beds occupied`)))))) },
        ],
      }));
    },
  },

  /* -------------------------------------------------- hostel/buildings */
  'hostel/buildings': {
    title: 'Hostels / Buildings',
    subtitle: 'Blocks, capacity and mess assignment',
    section: 'hostel',
    render(mount) {
      ensureStyles();
      const wl = wardens();
      const rows = db.hostels.map((hs) => ({
        ...hs,
        occupancy: Math.round((hs.occupied / hs.capacity) * 100),
        vacant: hs.capacity - hs.occupied,
        wardenName: (wl.find((w) => w.hostelId === hs.id && w.role === 'Chief Warden') || wl.find((w) => w.hostelId === hs.id) || {}).name || '—',
        campusName: campusName(hs.campusId),
        status: hs.occupied / hs.capacity > 0.95 ? 'Full' : 'Active',
      }));

      mount.appendChild(listPage({
        title: 'Hostels & buildings',
        subtitle: `${rows.length} blocks · ${num(rows.reduce((a, r) => a + r.capacity, 0))} beds · ${analytics.kpis.hostelOccupancy}% occupied`,
        route: 'hostel/buildings',
        actions: pageActions(
          Button('Occupancy report', { variant: 'secondary', icon: 'chart-bar', route: 'hostel/reports' }),
          Button('Add a block', { variant: 'primary', icon: 'plus', onClick: () => Modal({
            title: 'Add a hostel block', size: 'lg', icon: 'building-2',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Block name', required: true, className: 'col-span-full' }, Input({ placeholder: 'Satpura Boys Hostel' })),
              Field({ label: 'Type', required: true }, Select({ options: ['Boys', 'Girls'], value: 'Boys' })),
              Field({ label: 'Campus' }, Select({ options: campusOptions() })),
              Field({ label: 'Floors' }, Input({ type: 'number', value: '3' })),
              Field({ label: 'Rooms' }, Input({ type: 'number', value: '60' })),
              Field({ label: 'Mess' }, Select({ options: ['Mess A', 'Mess B', 'New Mess'] })),
              Field({ label: 'Year established' }, Input({ type: 'number', value: '2026' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Add block', { variant: 'primary', onClick: () => { close(); saved('Block'); } })),
          }) })),
        kpis: [
          { label: 'Blocks', value: String(rows.length), icon: 'building-2', tone: 'brand' },
          { label: 'Beds', value: num(rows.reduce((a, r) => a + r.capacity, 0)), icon: 'bed', tone: 'info' },
          { label: 'Occupied', value: num(rows.reduce((a, r) => a + r.occupied, 0)), icon: 'users', tone: 'success' },
          { label: 'Vacant', value: num(rows.reduce((a, r) => a + r.vacant, 0)), icon: 'door', tone: 'warning' },
        ],
        chart: radialBarChart({
          data: rows.map((r) => ({ key: r.name, value: r.occupied, max: r.capacity })),
          height: 300,
        }),
        chartTitle: 'Occupancy by block',
        columns: [
          { key: 'name', label: 'Block', sticky: true, width: 240, render: (r) => Identity(r.name, `${r.type} · ${r.campusName}`) },
          { key: 'type', label: 'Type', width: 100, filter: true },
          { key: 'floors', label: 'Floors', width: 90, align: 'right', numeric: true },
          { key: 'rooms', label: 'Rooms', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'capacity', label: 'Beds', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'occupied', label: 'Occupied', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'occupancy', label: 'Occupancy', width: 180, render: (r) => ProgressBar(r.occupancy, { tone: r.occupancy > 92 ? 'warning' : 'success', showValue: true }), aggregate: 'avg', format: (v) => `${v.toFixed(0)}%` },
          { key: 'mess', label: 'Mess', width: 110, filter: true },
          { key: 'wardenName', label: 'Chief warden', width: 190 },
          { key: 'established', label: 'Since', width: 90, align: 'right', numeric: true },
          { key: 'status', label: 'Status', width: 110, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, paginate: false,
        searchKeys: ['name', 'type', 'mess'],
        bulkActions: stdBulk('blocks'),
        onRowClick: () => navigate('hostel/rooms'),
        rowActions: () => [
          { label: 'View rooms', icon: 'door', route: 'hostel/rooms' },
          { label: 'Bed map', icon: 'bed', route: 'hostel/beds' },
          { label: 'Wardens', icon: 'shield', route: 'hostel/wardens' },
          { label: 'Mess menu', icon: 'utensils', route: 'hostel/mess-menu' },
        ],
        emptyState: emptyFor('building-2', 'No hostel blocks', 'Add a block before creating rooms and allocations.'),
      }));
    },
  },

  /* ------------------------------------------------------ hostel/rooms */
  'hostel/rooms': {
    title: 'Rooms',
    subtitle: 'Every room with its occupancy and condition',
    section: 'hostel',
    render(mount) {
      ensureStyles();
      const rows = db.hostelRooms.map((r) => ({
        ...r,
        occupancy: Math.round((r.occupied / r.beds) * 100),
        residents: db.hostelAllocations.filter((a) => a.roomId === r.id && a.status === 'Active').map((a) => a.studentName),
      }));

      mount.appendChild(listPage({
        title: 'Rooms',
        subtitle: `${num(rows.length)} rooms · ${num(rows.reduce((a, r) => a + r.vacant, 0))} beds free`,
        route: 'hostel/rooms',
        actions: pageActions(
          Button('Bed map', { variant: 'secondary', icon: 'bed', route: 'hostel/beds' }),
          Button('Add rooms', { variant: 'primary', icon: 'plus', onClick: () => Modal({
            title: 'Add rooms in bulk', size: 'md', icon: 'door',
            body: h('div', { className: 'stack-3' },
              FormGrid({ cols: 2 },
                Field({ label: 'Block', required: true, className: 'col-span-full' }, Select({ options: db.hostels.map((x) => ({ value: x.id, label: x.name })) })),
                Field({ label: 'Floor' }, Input({ type: 'number', value: '1' })),
                Field({ label: 'Rooms to create' }, Input({ type: 'number', value: '20' })),
                Field({ label: 'Beds per room' }, Select({ options: ['2', '3', '4'], value: '4' })),
                Field({ label: 'Air conditioned' }, Switch('AC fitted', {})),
                Field({ label: 'Attached bathroom' }, Switch('Attached bathroom', { checked: true }))),
              Callout({ tone: 'info', title: 'Numbering' }, 'Rooms are numbered <floor><nn>, so floor 2 rooms run 201–220.')),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Create rooms', { variant: 'primary', onClick: () => { close(); saved('Rooms'); } })),
          }) })),
        kpis: [
          { label: 'Rooms', value: num(rows.length), icon: 'door', tone: 'brand' },
          { label: 'Full', value: String(rows.filter((r) => r.status === 'Full').length), icon: 'users', tone: 'success' },
          { label: 'Partially occupied', value: String(rows.filter((r) => r.status === 'Partially Occupied').length), icon: 'bed', tone: 'info' },
          { label: 'Needing repair', value: String(rows.filter((r) => r.condition !== 'Good').length), icon: 'wrench', tone: 'warning', route: 'hostel/maintenance' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Room number…', width: '220px' },
          { id: 'hostelId', label: 'Block', options: db.hostels.map((x) => ({ value: x.id, label: x.name })) },
          { id: 'floor', label: 'Floor', options: ['1', '2', '3'] },
          { id: 'status', label: 'Occupancy', options: ['Vacant', 'Partially Occupied', 'Full'] },
          { id: 'condition', label: 'Condition', options: ['Good', 'Needs Repair', 'Under Maintenance'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => String(r.roomNo).includes(String(x)),
          hostelId: (r, x) => r.hostelId === x,
          floor: (r, x) => String(r.floor) === String(x),
          status: (r, x) => r.status === x,
          condition: (r, x) => r.condition === x,
        })),
        chart: heatmap({
          mode: 'matrix',
          rows: db.hostels.map((x) => x.name),
          cols: ['Floor 1', 'Floor 2', 'Floor 3'],
          values: db.hostels.map((hs) => [1, 2, 3].map((fl) => {
            const list = rows.filter((r) => r.hostelId === hs.id && r.floor === fl);
            return list.length ? Math.round(list.reduce((a, r) => a + r.occupancy, 0) / list.length) : 0;
          })),
          cellSize: 46, min: 0, max: 100,
        }),
        chartTitle: 'Average occupancy by block and floor (%)',
        columns: [
          { key: 'roomNo', label: 'Room', sticky: true, width: 110, className: 't-mono t-semibold' },
          { key: 'hostelName', label: 'Block', width: 210, filter: true },
          { key: 'floor', label: 'Floor', width: 90, align: 'right', numeric: true, filter: true },
          { key: 'type', label: 'Type', width: 110, filter: true },
          { key: 'beds', label: 'Beds', width: 90, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'occupied', label: 'Occupied', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'vacant', label: 'Vacant', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'occupancy', label: 'Fill', width: 160, render: (r) => ProgressBar(r.occupancy, { tone: r.occupancy === 100 ? 'success' : r.occupancy === 0 ? 'neutral' : 'brand', showValue: true }) },
          { key: 'ac', label: 'AC', width: 80, value: (r) => (r.ac ? 1 : 0), render: (r) => (r.ac ? Badge('AC', { tone: 'info', size: 'sm' }) : h('span', { className: 't-muted' }, '—')) },
          { key: 'attachedBath', label: 'Bath', width: 90, value: (r) => (r.attachedBath ? 1 : 0), render: (r) => (r.attachedBath ? Badge('Attached', { tone: 'neutral', size: 'sm' }) : h('span', { className: 't-muted' }, 'Common')) },
          { key: 'monthlyFee', label: 'Monthly fee', width: 140, align: 'right', numeric: true, render: (r) => money(r.monthlyFee), aggregate: 'sum', format: moneyC },
          { key: 'condition', label: 'Condition', width: 160, filter: true, render: (r) => Badge(r.condition === 'Good' ? 'Active' : r.condition === 'Needs Repair' ? 'Pending' : 'In Progress', { tone: r.condition === 'Good' ? 'success' : r.condition === 'Needs Repair' ? 'warning' : 'info', icon: 'wrench' }) },
          { key: 'status', label: 'Status', width: 170, filter: true, render: (r) => Badge(r.status === 'Full' ? 'Completed' : r.status === 'Vacant' ? 'New' : 'Partial') },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['roomNo', 'hostelName', 'type'],
        expandable: (r) => Card({ pad: true },
          h('div', { className: 'stack-2' },
            h('div', { className: 't-eyebrow' }, 'Residents'),
            r.residents.length
              ? h('div', { className: 'row-3 row-wrap' }, r.residents.map((n2) => Identity(n2, 'Resident', { size: 'xs' })))
              : h('div', { className: 't-sm t-muted' }, 'This room is empty — all beds are available for allocation.'),
            h('div', { className: 'row-3 row-wrap mt-2' },
              Button('Allocate a bed', { variant: 'secondary', size: 'sm', icon: 'user-check', route: 'hostel/allocation' }),
              Button('Raise a ticket', { variant: 'ghost', size: 'sm', icon: 'wrench', route: 'hostel/maintenance' })))),
        bulkActions: [
          { label: 'Mark for maintenance', icon: 'wrench', onClick: (sel) => notify({ title: `${sel.length} rooms flagged`, tone: 'warning' }) },
          { label: 'Revise fee', icon: 'rupee', onClick: mockAction('Revise room fee') },
        ],
        rowActions: () => [
          { label: 'Bed map', icon: 'bed', route: 'hostel/beds' },
          { label: 'Allocate', icon: 'user-check', route: 'hostel/allocation' },
          { label: 'Maintenance ticket', icon: 'wrench', route: 'hostel/maintenance' },
        ],
        emptyState: emptyFor('door', 'No rooms', 'Create rooms in a block before allocating beds.'),
      }));
    },
  },

  /* ------------------------------------------------------- hostel/beds */
  'hostel/beds': {
    title: 'Beds',
    subtitle: 'Block → floor → room → bed occupancy map',
    section: 'hostel',
    render(mount) {
      ensureStyles();
      let hostelId = db.hostels[0] ? db.hostels[0].id : null;
      let floor = 'all';
      let state = 'all';
      const gridHost = h('div', { className: 'stack-3' });

      const allocateModal = (room, bed) => Modal({
        title: `Allocate ${room.roomNo} · ${bed.bedNo}`,
        subtitle: `${room.hostelName} · floor ${room.floor} · ${room.type} room`,
        size: 'md', icon: 'user-check',
        body: h('div', { className: 'stack-3' },
          FormGrid({ cols: 2 },
            Field({ label: 'Student', required: true, className: 'col-span-full' },
              Combobox({ options: db.students.filter((s) => s.hostelOpted).slice(0, 200).map((s) => ({ value: s.id, label: `${s.name} · ${s.className} · ${s.admissionNo}` })), placeholder: 'Search a boarder…' })),
            Field({ label: 'Allocated from' }, DatePicker({ value: TODAY })),
            Field({ label: 'Mess plan' }, Select({ options: ['Full Board', 'Veg Only', 'Jain Meal', 'Special Diet'], value: 'Full Board' })),
            Field({ label: 'Monthly fee (₹)' }, Input({ type: 'number', value: String(room.monthlyFee) })),
            Field({ label: 'Local guardian' }, Input({ placeholder: 'Name of the local guardian' }))),
          Callout({ tone: 'info', title: 'Rules' },
            'A bed can only be allocated to a student who has opted for hostel and cleared the hostel fee for the current quarter.')),
        actions: (close) => frag(
          Button('Cancel', { variant: 'ghost', onClick: close }),
          Button('Allocate bed', { variant: 'primary', icon: 'check', onClick: () => { close(); saved('Allocation'); } })),
      });

      const roomDrawer = (room) => {
        const beds = bedsOfRoom(room);
        openDrawer(`Room ${room.roomNo}`, `${room.hostelName} · floor ${room.floor} · ${room.type}`,
          h('div', { className: 'stack-3' },
            h('div', { className: 'row-3 row-wrap' },
              Badge(room.status === 'Full' ? 'Completed' : room.status === 'Vacant' ? 'New' : 'Partial'),
              room.ac && Badge('Air conditioned', { tone: 'info' }),
              room.attachedBath && Badge('Attached bathroom', { tone: 'neutral' }),
              Badge(room.condition === 'Good' ? 'Active' : 'Pending', { tone: room.condition === 'Good' ? 'success' : 'warning' })),
            kv([
              ['Beds', String(room.beds)],
              ['Occupied', String(room.occupied)],
              ['Vacant', String(room.vacant)],
              ['Monthly fee', money(room.monthlyFee)],
              ['Condition', room.condition],
            ]),
            SectionCard({ title: 'Beds', flush: true },
              DataTable({
                rows: beds, paginate: false, searchable: false, exportable: false, columnToggle: false,
                columns: [
                  { key: 'bedNo', label: 'Bed', width: 80, className: 't-mono' },
                  { key: 'studentName', label: 'Occupant', render: (b) => (b.studentName ? Identity(b.studentName, b.className) : h('span', { className: 't-muted' }, 'Vacant')) },
                  { key: 'messPlan', label: 'Mess plan', width: 140, render: (b) => b.messPlan || '—' },
                  { key: 'state', label: '', width: 130, align: 'right', sortable: false,
                    render: (b) => (b.state === 'free'
                      ? Button('Allocate', { variant: 'secondary', size: 'sm', icon: 'user-check', onClick: () => allocateModal(room, b) })
                      : b.state === 'repair' ? Badge('Under repair', { tone: 'warning' })
                        : Button('Vacate', { variant: 'ghost', size: 'sm', icon: 'log-out', onClick: () => confirmDanger('Vacate this bed?', `${b.studentName} will be released from ${room.roomNo}/${b.bedNo}.`, () => notify({ title: 'Bed vacated', tone: 'success' }), 'Vacate') })) },
                ],
              }))),
          (close) => frag(
            Button('Raise a ticket', { variant: 'ghost', icon: 'wrench', onClick: () => { close(); navigate('hostel/maintenance'); } }),
            Button('Open allocations', { variant: 'primary', icon: 'user-check', onClick: () => { close(); navigate('hostel/allocation'); } })));
      };

      const paint = () => {
        gridHost.innerHTML = '';
        const hs = byId(db.hostels, hostelId);
        let rooms = db.hostelRooms.filter((r) => r.hostelId === hostelId);
        if (floor !== 'all') rooms = rooms.filter((r) => String(r.floor) === floor);
        if (state !== 'all') {
          rooms = rooms.filter((r) => (state === 'vacant' ? r.vacant > 0
            : state === 'full' ? r.vacant === 0
              : r.condition !== 'Good'));
        }
        if (!rooms.length) {
          gridHost.appendChild(Card({ pad: true }, noResults('rooms',
            Button('Reset filters', { variant: 'secondary', icon: 'refresh-ccw', onClick: () => { floor = 'all'; state = 'all'; paint(); } }))));
          return;
        }
        const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);
        for (const fl of floors) {
          const list = rooms.filter((r) => r.floor === fl);
          const beds = list.reduce((a, r) => a + r.beds, 0);
          const occ = list.reduce((a, r) => a + r.occupied, 0);
          gridHost.appendChild(SectionCard({
            title: `Floor ${fl}`,
            subtitle: `${list.length} rooms · ${occ} of ${beds} beds occupied · ${Math.round((occ / Math.max(1, beds)) * 100)}% full`,
            icon: 'layers',
          },
            h('div', { className: 'ops-bed-grid' },
              list.map((r) => {
                const bl = bedsOfRoom(r);
                return h('button', {
                  className: 'ops-room', type: 'button',
                  attrs: { 'aria-label': `Room ${r.roomNo}, ${r.occupied} of ${r.beds} beds occupied` },
                  onClick: () => roomDrawer(r),
                },
                  h('span', { className: 'row', style: { justifyContent: 'space-between' } },
                    h('span', { className: 't-semibold t-mono' }, r.roomNo),
                    h('span', { className: 't-xs t-muted' }, r.type)),
                  h('span', { className: 'ops-beds' },
                    bl.map((b) => h('i', { className: 'ops-bed', dataset: { s: b.state }, attrs: { title: b.studentName ? `${b.bedNo} · ${b.studentName}` : `${b.bedNo} · vacant` } }))),
                  h('span', { className: 't-xs t-muted' }, `${r.occupied}/${r.beds}${r.ac ? ' · AC' : ''}`));
              }))));
        }
        gridHost.insertBefore(Card({ pad: true },
          h('div', { className: 'row-4 row-wrap' },
            legend([['Occupied', 'var(--chart-1)'], ['Vacant', 'var(--surface-sunken)'], ['Under repair', 'var(--chart-warning)']]),
            h('span', { className: 'spacer' }),
            h('span', { className: 't-sm t-muted' },
              `${hs ? hs.name : ''} · ${rooms.reduce((a, r) => a + r.occupied, 0)} of ${rooms.reduce((a, r) => a + r.beds, 0)} beds occupied`))),
        gridHost.firstChild);
      };

      paint();

      mount.appendChild(page({
        title: 'Bed occupancy map',
        subtitle: `${num(db.hostelRooms.reduce((a, r) => a + r.beds, 0))} beds across ${db.hostels.length} blocks · click a room to allocate`,
        route: 'hostel/beds',
        actions: pageActions(
          Button('Room list', { variant: 'secondary', icon: 'door', route: 'hostel/rooms' }),
          Button('Allocate a bed', { variant: 'primary', icon: 'user-check', route: 'hostel/allocation' })),
        filters: FilterBar({
          filters: [
            { id: 'hostelId', label: 'Block', allLabel: 'Pick a block', value: hostelId, options: db.hostels.map((x) => ({ value: x.id, label: x.name })) },
            { id: 'floor', label: 'Floor', options: ['1', '2', '3'] },
            { id: 'state', label: 'Show', options: [{ value: 'vacant', label: 'Rooms with a free bed' }, { value: 'full', label: 'Full rooms' }, { value: 'repair', label: 'Needing repair' }] },
          ],
          onChange: (id, v) => {
            if (id === 'hostelId') hostelId = v === 'all' ? db.hostels[0].id : v;
            if (id === 'floor') floor = v;
            if (id === 'state') state = v;
            paint();
          },
        }),
        children: gridHost,
      }));
    },
  },

  /* ------------------------------------------------- hostel/allocation */
  'hostel/allocation': {
    title: 'Room Allocation',
    subtitle: 'Who sleeps where, with mess plan and local guardian',
    section: 'hostel',
    render(mount) {
      ensureStyles();
      const rows = db.hostelAllocations.map((a) => ({
        ...a,
        room: byId(db.hostelRooms, a.roomId) || {},
      }));

      const wizard = () => formPage({
        title: 'Allocate a hostel bed',
        mode: 'modal', size: 'lg',
        submitLabel: 'Allocate bed',
        sections: [
          {
            title: 'Student', cols: 2,
            fields: [
              { id: 'student', label: 'Student', type: 'combobox', required: true, span: 'full',
                options: db.students.filter((s) => s.hostelOpted).slice(0, 200).map((s) => ({ value: s.id, label: `${s.name} · ${s.className} · ${s.admissionNo}` })) },
              { id: 'hostel', label: 'Block', type: 'select', required: true, options: db.hostels.map((x) => ({ value: x.id, label: x.name })) },
              { id: 'room', label: 'Room', type: 'combobox', required: true, options: db.hostelRooms.filter((r) => r.vacant > 0).slice(0, 120).map((r) => ({ value: r.id, label: `${r.hostelName} · ${r.roomNo} (${r.vacant} free)` })) },
              { id: 'bed', label: 'Bed', type: 'select', options: ['B1', 'B2', 'B3', 'B4'] },
              { id: 'from', label: 'Allocated from', type: 'date', value: TODAY, required: true },
            ],
          },
          {
            title: 'Board & guardian', cols: 2,
            fields: [
              { id: 'messPlan', label: 'Mess plan', type: 'select', options: ['Full Board', 'Veg Only', 'Jain Meal', 'Special Diet'], value: 'Full Board' },
              { id: 'fee', label: 'Monthly fee (₹)', type: 'number', value: 15200 },
              { id: 'guardian', label: 'Local guardian', required: true },
              { id: 'guardianPhone', label: 'Guardian phone', type: 'tel', required: true, validate: validators.phone },
              { id: 'notes', label: 'Notes', type: 'textarea', span: 'full', placeholder: 'Allergies, medication, roommate preference…' },
            ],
          },
        ],
        onSubmit: () => saved('Allocation'),
      });

      mount.appendChild(listPage({
        title: 'Room allocation',
        subtitle: `${rows.filter((r) => r.status === 'Active').length} active allocations · ${rows.filter((r) => r.status === 'Transfer Requested').length} transfer requests`,
        route: 'hostel/allocation',
        actions: pageActions(
          Button('Bed map', { variant: 'secondary', icon: 'bed', route: 'hostel/beds' }),
          Button('Allocate a bed', { variant: 'primary', icon: 'user-check', onClick: wizard })),
        kpis: [
          { label: 'Residents', value: String(rows.filter((r) => r.status === 'Active').length), icon: 'users', tone: 'brand' },
          { label: 'Vacated', value: String(rows.filter((r) => r.status === 'Vacated').length), icon: 'log-out', tone: 'neutral' },
          { label: 'Transfer requests', value: String(rows.filter((r) => r.status === 'Transfer Requested').length), icon: 'refresh-ccw', tone: 'warning', route: 'hostel/room-transfer' },
          { label: 'Monthly billing', value: moneyC(rows.filter((r) => r.status === 'Active').reduce((a, r) => a + r.monthlyFee, 0)), icon: 'wallet', tone: 'success', route: 'hostel/fees' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Student, room or guardian…', width: '250px' },
          { id: 'hostelId', label: 'Block', options: db.hostels.map((x) => ({ value: x.id, label: x.name })) },
          { id: 'messPlan', label: 'Mess plan', options: ['Full Board', 'Veg Only', 'Jain Meal', 'Special Diet'] },
          { id: 'status', label: 'Status', options: ['Active', 'Vacated', 'Transfer Requested'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.studentName} ${r.roomNo} ${r.localGuardian}`.toLowerCase().includes(String(x).toLowerCase()),
          hostelId: (r, x) => r.hostelId === x,
          messPlan: (r, x) => r.messPlan === x,
          status: (r, x) => r.status === x,
        })),
        chart: donutChart({
          data: countBy(rows, 'messPlan').map((c) => ({ key: c.key, value: c.value })),
          height: 250, centerValue: String(rows.length), centerLabel: 'Residents',
        }),
        chartTitle: 'Mess plan mix',
        columns: [
          { key: 'studentName', label: 'Resident', sticky: true, width: 240, render: (r) => Identity(r.studentName, `${r.className} · ${r.studentId}`) },
          { key: 'hostelName', label: 'Block', width: 200, filter: true },
          { key: 'roomNo', label: 'Room', width: 100, className: 't-mono' },
          { key: 'bedNo', label: 'Bed', width: 80, className: 't-mono' },
          { key: 'allocatedOn', label: 'From', width: 130, render: (r) => dt(r.allocatedOn) },
          { key: 'messPlan', label: 'Mess plan', width: 150, filter: true },
          { key: 'monthlyFee', label: 'Monthly fee', width: 140, align: 'right', numeric: true, render: (r) => money(r.monthlyFee), aggregate: 'sum', format: moneyC },
          { key: 'localGuardian', label: 'Local guardian', width: 200, render: (r) => h('div', null, h('div', { className: 't-medium' }, r.localGuardian), h('div', { className: 't-xs t-muted t-mono' }, r.localGuardianPhone)) },
          { key: 'status', label: 'Status', width: 170, filter: true, render: (r) => Badge(r.status === 'Transfer Requested' ? 'Under Review' : r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['studentName', 'roomNo', 'localGuardian', 'hostelName'],
        bulkActions: [
          { label: 'Send circular', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} residents messaged`, tone: 'success' }) },
          { label: 'Generate fee demand', icon: 'receipt', onClick: (sel) => notify({ title: `${sel.length} demand notes generated`, tone: 'success' }) },
          { label: 'Vacate beds', icon: 'log-out', tone: 'danger', onClick: (sel) => confirmDanger('Vacate these beds?', `${sel.length} residents will be released and their beds freed from tomorrow.`, () => notify({ title: 'Beds vacated', tone: 'success' }), 'Vacate') },
        ],
        onRowClick: (r) => navigate(`students/profile/${r.studentId}`),
        rowActions: (r) => [
          { label: 'Student profile', icon: 'user', route: `students/profile/${r.studentId}` },
          { label: 'Bed map', icon: 'bed', route: 'hostel/beds' },
          { label: 'Request transfer', icon: 'refresh-ccw', route: 'hostel/room-transfer' },
          { separator: true },
          { label: 'Vacate', icon: 'log-out', tone: 'danger', onClick: () => confirmDanger('Vacate this bed?', `${r.studentName} will be released from ${r.roomNo}/${r.bedNo}.`, () => notify({ title: 'Bed vacated', tone: 'success' }), 'Vacate') },
        ],
        emptyState: emptyFor('user-check', 'Nothing allocated', 'Allocate a bed to a boarder to see them here.'),
      }));
    },
  },

  /* ------------------------------------------------- hostel/attendance */
  'hostel/attendance': {
    title: 'Hostel Attendance',
    subtitle: 'Nightly roll call at 21:30',
    section: 'hostel',
    render(mount) {
      ensureStyles();
      const all = hostelAttendance();
      const today = all.filter((a) => a.date === TODAY);
      const byDay = Array.from(groupBy(all, 'date').entries())
        .map(([date, list]) => ({ date, percent: Number(((list.filter((x) => x.status === 'Present').length / list.length) * 100).toFixed(1)) }))
        .sort((a, b) => a.date.localeCompare(b.date));

      mount.appendChild(listPage({
        title: 'Hostel attendance',
        subtitle: `Roll call ${formatDate(TODAY, 'medium')} · ${today.filter((a) => a.status === 'Present').length} of ${today.length} present`,
        route: 'hostel/attendance',
        actions: pageActions(
          Button('Absentee escalation', { variant: 'secondary', icon: 'siren', onClick: () => notify({ title: 'Guardians called', text: `${today.filter((a) => a.status === 'Absent').length} absentee guardians contacted.`, tone: 'warning' }) }),
          Button('Take roll call', { variant: 'primary', icon: 'clipboard-check', onClick: () => Modal({
            title: 'Take the night roll call', size: 'md', icon: 'clipboard-check',
            body: h('div', { className: 'stack-3' },
              FormGrid({ cols: 2 },
                Field({ label: 'Block', required: true, className: 'col-span-full' }, Select({ options: db.hostels.map((x) => ({ value: x.id, label: x.name })) })),
                Field({ label: 'Date' }, DatePicker({ value: TODAY })),
                Field({ label: 'Roll call time' }, TimePicker({ value: '21:30' }))),
              Callout({ tone: 'info', title: 'How it works' },
                'The warden marks each room from the handheld. Any resident not in their room is auto-escalated to the chief warden and the guardian after 15 minutes.')),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Start roll call', { variant: 'primary', onClick: () => { close(); notify({ title: 'Roll call started', tone: 'success' }); } })),
          }) })),
        kpis: [
          { label: 'On the roll', value: String(today.length), icon: 'users', tone: 'brand' },
          { label: 'Present', value: String(today.filter((a) => a.status === 'Present').length), icon: 'check-circle', tone: 'success' },
          { label: 'On leave', value: String(today.filter((a) => a.status === 'On Leave').length), icon: 'calendar', tone: 'info' },
          { label: 'Absent / late', value: String(today.filter((a) => a.status === 'Absent' || a.status === 'Late Entry').length), icon: 'alert-triangle', tone: 'danger' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Resident or room…', width: '240px' },
          { id: 'hostelId', label: 'Block', options: db.hostels.map((x) => ({ value: x.id, label: x.name })) },
          { id: 'status', label: 'Status', options: ['Present', 'Absent', 'On Leave', 'Late Entry'] },
          { id: 'date', label: 'Date', type: 'date' },
        ],
        onFilter: (id, v, all2, table) => table.refresh(applyAll(all, all2, {
          q: (r, x) => `${r.studentName} ${r.roomNo}`.toLowerCase().includes(String(x).toLowerCase()),
          hostelId: (r, x) => r.hostelId === x,
          status: (r, x) => r.status === x,
          date: (r, x) => r.date === x,
        })),
        chart: lineChart({
          categories: byDay.map((d) => formatDate(d.date, 'dayMonth')),
          series: [{ name: 'Present %', values: byDay.map((d) => d.percent) }],
          target: 95, targetLabel: 'Expected 95%', valueFormat: 'percent', height: 250, showDots: true,
        }),
        chartTitle: 'Roll-call attendance over the last ten nights',
        columns: [
          { key: 'date', label: 'Date', sticky: true, width: 130, render: (r) => dt(r.date) },
          { key: 'studentName', label: 'Resident', width: 230, render: (r) => Identity(r.studentName, r.className) },
          { key: 'hostelName', label: 'Block', width: 190, filter: true },
          { key: 'roomNo', label: 'Room', width: 100, className: 't-mono' },
          { key: 'bedNo', label: 'Bed', width: 80, className: 't-mono', hidden: true },
          { key: 'inTime', label: 'In time', width: 100 },
          { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status === 'Late Entry' ? 'Pending' : r.status, { tone: r.status === 'Present' ? 'success' : r.status === 'Absent' ? 'danger' : r.status === 'Late Entry' ? 'warning' : 'info', icon: r.status === 'Present' ? 'check-circle' : 'clock' }) },
          { key: 'markedBy', label: 'Marked by', width: 170, filter: true },
          { key: 'remarks', label: 'Remarks', width: 260 },
        ],
        rows: all, selectable: true, pageSize: 25,
        searchKeys: ['studentName', 'roomNo', 'hostelName'],
        bulkActions: [
          { label: 'Call guardians', icon: 'phone-call', onClick: (sel) => notify({ title: `${sel.length} guardians called`, tone: 'info' }) },
          { label: 'Mark present', icon: 'check-circle', onClick: (sel) => notify({ title: `${sel.length} residents marked present`, tone: 'success' }) },
        ],
        rowActions: (r) => [
          { label: 'Student profile', icon: 'user', route: `students/profile/${r.studentId}` },
          { label: 'Gate pass history', icon: 'log-out', route: 'hostel/gate-pass' },
        ],
        emptyState: emptyFor('clipboard-check', 'No roll call yet', 'Start a roll call from the warden handheld to record the night register.'),
      }));
    },
  },

  /* ---------------------------------------------------- hostel/wardens */
  'hostel/wardens': {
    title: 'Wardens',
    subtitle: 'Duty roster and pastoral responsibility',
    section: 'hostel',
    render(mount) {
      ensureStyles();
      const rows = wardens();

      mount.appendChild(listPage({
        title: 'Wardens',
        subtitle: `${rows.length} wardens and supervisors across ${db.hostels.length} blocks`,
        route: 'hostel/wardens',
        actions: pageActions(
          Button('Publish roster', { variant: 'secondary', icon: 'send', onClick: () => notify({ title: 'Roster published', text: 'The duty roster has been shared with all wardens.', tone: 'success' }) }),
          Button('Assign a warden', { variant: 'primary', icon: 'shield', onClick: () => Modal({
            title: 'Assign a warden', size: 'md', icon: 'shield',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Staff member', required: true, className: 'col-span-full' },
                Combobox({ options: db.staff.slice(0, 200).map((s) => ({ value: s.id, label: `${s.name} · ${s.designation}` })), placeholder: 'Search staff…' })),
              Field({ label: 'Block', required: true }, Select({ options: db.hostels.map((x) => ({ value: x.id, label: x.name })) })),
              Field({ label: 'Role' }, Select({ options: WARDEN_ROLES })),
              Field({ label: 'Shift' }, Select({ options: ['General (08:00–17:00)', 'Evening (14:00–22:00)', 'Night (22:00–07:00)'] })),
              Field({ label: 'Quarters' }, Input({ placeholder: 'Q-11' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Assign', { variant: 'primary', onClick: () => { close(); saved('Warden assignment'); } })),
          }) })),
        kpis: [
          { label: 'Wardens', value: String(rows.length), icon: 'shield', tone: 'brand' },
          { label: 'On duty now', value: String(rows.filter((r) => r.onDuty).length), icon: 'check-circle', tone: 'success' },
          { label: 'Night supervisors', value: String(rows.filter((r) => r.shift.startsWith('Night')).length), icon: 'moon', tone: 'info' },
          { label: 'Residents per warden', value: String(Math.round(db.hostelAllocations.length / Math.max(1, rows.length))), icon: 'users', tone: 'warning' },
        ],
        columns: [
          { key: 'name', label: 'Warden', sticky: true, width: 240, render: (r) => Identity(r.name, `${r.role} · ${r.employeeCode}`) },
          { key: 'hostelName', label: 'Block', width: 210, filter: true },
          { key: 'role', label: 'Role', width: 160, filter: true },
          { key: 'shift', label: 'Shift', width: 200, filter: true },
          { key: 'quartersNo', label: 'Quarters', width: 110, className: 't-mono' },
          { key: 'phone', label: 'Phone', width: 150, className: 't-mono' },
          { key: 'residentsUnder', label: 'Residents', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'experienceYears', label: 'Experience', width: 120, align: 'right', numeric: true, render: (r) => `${r.experienceYears} yr` },
          { key: 'onDuty', label: 'Duty', width: 120, value: (r) => (r.onDuty ? 1 : 0), render: (r) => Badge(r.onDuty ? 'Active' : 'On Leave') },
        ],
        rows, selectable: true, footerAggregates: true, paginate: false,
        searchKeys: ['name', 'role', 'hostelName'],
        bulkActions: [
          { label: 'Message wardens', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} wardens messaged`, tone: 'success' }) },
          { label: 'Swap shift', icon: 'refresh-ccw', onClick: mockAction('Swap shift') },
        ],
        rowActions: (r) => [
          { label: 'Staff profile', icon: 'user', route: `hr/employee-profile/${r.staffId}` },
          { label: 'Call', icon: 'phone', onClick: () => notify({ title: 'Dialling', text: r.phone, tone: 'info' }) },
          { label: 'Block residents', icon: 'users', route: 'hostel/allocation' },
        ],
        emptyState: emptyFor('shield', 'No wardens assigned', 'Assign at least one warden per block before opening it.'),
      }));
    },
  },

  /* -------------------------------------------------- hostel/mess-menu */
  'hostel/mess-menu': {
    title: 'Mess Menu',
    subtitle: 'Weekly menu planner across all meals',
    section: 'hostel',
    render(mount) {
      ensureStyles();
      const menu = db.messMenu;
      const MEALS = [['breakfast', 'Breakfast', '07:30'], ['lunch', 'Lunch', '13:00'], ['snacks', 'Snacks', '17:00'], ['dinner', 'Dinner', '20:00']];

      const editCell = (day, mealKey, mealLabel) => Modal({
        title: `${mealLabel} · ${day.day}`, size: 'md', icon: 'utensils',
        body: h('div', { className: 'stack-3' },
          Field({ label: 'Menu', required: true }, Textarea({ rows: 3, value: day[mealKey] })),
          FormGrid({ cols: 2 },
            Field({ label: 'Approx calories' }, Input({ type: 'number', value: String(day.calories) })),
            Field({ label: 'Cost per plate (₹)' }, Input({ type: 'number', value: '68' })),
            Field({ label: 'Jain alternative' }, Input({ placeholder: 'No onion / no garlic variant' })),
            Field({ label: 'Allergens' }, MultiSelect({ options: ['Peanuts', 'Dairy', 'Gluten', 'Soy', 'Egg'], values: [] }))),
          Callout({ tone: 'info', title: 'Nutrition guidance' },
            'The CBSE wellness circular recommends 2,200–2,600 kcal per day for boarders in the 12–18 age band, with a protein source at both lunch and dinner.')),
        actions: (close) => frag(
          Button('Cancel', { variant: 'ghost', onClick: close }),
          Button('Save menu', { variant: 'primary', onClick: () => { close(); saved('Menu'); } })),
      });

      const table = h('table', { className: 'ops-mess' },
        h('thead', null,
          h('tr', null,
            h('th', { attrs: { scope: 'col' } }, 'Day'),
            MEALS.map(([, label, time]) => h('th', { attrs: { scope: 'col' } },
              h('div', null, label), h('div', { className: 't-xs t-muted' }, time))),
            h('th', { attrs: { scope: 'col' } }, 'Calories'))),
        h('tbody', null,
          menu.map((day) => h('tr', null,
            h('th', { attrs: { scope: 'row' } },
              h('div', null, day.day),
              day.special && h('div', { className: 't-xs t-brand' }, 'Special')),
            MEALS.map(([key, label]) => h('td', null,
              h('button', {
                type: 'button',
                className: 'btn btn-link t-left',
                style: { padding: '0', textAlign: 'left', whiteSpace: 'normal' },
                attrs: { 'aria-label': `Edit ${label} for ${day.day}` },
                onClick: () => editCell(day, key, label),
              }, day[key]))),
            h('td', { className: 't-num t-right' }, num(day.calories))))));

      mount.appendChild(page({
        title: 'Mess menu',
        subtitle: `Weekly cycle · average ${num(Math.round(menu.reduce((a, d) => a + d.calories, 0) / menu.length))} kcal per resident per day`,
        route: 'hostel/mess-menu',
        actions: pageActions(
          Button('Print menu', { variant: 'secondary', icon: 'print', onClick: () => printNode(table, 'Weekly mess menu') }),
          Button('Publish to app', { variant: 'primary', icon: 'send', onClick: () => notify({ title: 'Menu published', text: 'Residents and parents can now see this week’s menu.', tone: 'success' }) })),
        children: [
          kpiRow([
            { label: 'Meals planned', value: String(menu.length * 4), icon: 'utensils', tone: 'brand' },
            { label: 'Avg calories / day', value: num(Math.round(menu.reduce((a, d) => a + d.calories, 0) / menu.length)), icon: 'flame', tone: 'warning' },
            { label: 'Special meals', value: String(menu.filter((d) => d.special).length), icon: 'sparkles', tone: 'success' },
            { label: 'Residents fed', value: num(db.hostels.reduce((a, x) => a + x.occupied, 0)), icon: 'users', tone: 'info' },
          ]),
          SectionCard({
            title: 'Weekly planner',
            subtitle: 'Click any cell to edit that meal — changes publish to the parent app immediately',
            icon: 'calendar',
          }, h('div', { className: 'scroll-x' }, table)),
          h('div', { className: 'grid grid-2' },
            chartCard('Calories by day',
              barChart({
                categories: menu.map((d) => d.day.slice(0, 3)),
                series: [{ name: 'Calories', values: menu.map((d) => d.calories) }],
                target: 2400, targetLabel: 'Guideline 2,400', height: 260, showValues: true,
              }), 'Planned energy per resident per day'),
            SectionCard({ title: 'Special meals & festivals', icon: 'sparkles' },
              Timeline(menu.filter((d) => d.special).concat([
                { day: 'Festival', special: 'Janmashtami — Panchamrit & Makhan Mishri' },
                { day: 'Festival', special: 'Diwali — full thali with sweets' },
              ]).map((d) => ({
                title: d.special, meta: d.day, icon: 'utensils', tone: 'brand',
                text: 'Kitchen indent to be raised three days in advance through the store.',
              }))))),
        ],
      }));
    },
  },

  /* -------------------------------------------- hostel/mess-attendance */
  'hostel/mess-attendance': {
    title: 'Mess Attendance',
    subtitle: 'Plates served against residents on the roll',
    section: 'hostel',
    render(mount) {
      ensureStyles();
      const rows = messAttendance();
      const today = rows.filter((r) => r.date === TODAY);
      const byMeal = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map((m) => {
        const list = rows.filter((r) => r.meal === m);
        return { meal: m, percent: Number((list.reduce((a, x) => a + x.percent, 0) / Math.max(1, list.length)).toFixed(1)), wastage: list.reduce((a, x) => a + x.wastageKg, 0) };
      });

      mount.appendChild(listPage({
        title: 'Mess attendance',
        subtitle: `${num(rows.length)} meal sessions logged · ${num(rows.reduce((a, r) => a + r.served, 0))} plates served`,
        route: 'hostel/mess-attendance',
        actions: pageActions(
          Button('Menu planner', { variant: 'secondary', icon: 'utensils', route: 'hostel/mess-menu' }),
          Button('Record a meal', { variant: 'primary', icon: 'coffee', onClick: () => Modal({
            title: 'Record a meal session', size: 'md', icon: 'coffee',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Block', required: true, className: 'col-span-full' }, Select({ options: db.hostels.map((x) => ({ value: x.id, label: x.name })) })),
              Field({ label: 'Meal', required: true }, Select({ options: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'] })),
              Field({ label: 'Date' }, DatePicker({ value: TODAY })),
              Field({ label: 'Plates served', required: true }, Input({ type: 'number', placeholder: '178' })),
              Field({ label: 'Food wastage (kg)' }, Input({ type: 'number', placeholder: '6' })),
              Field({ label: 'Cost per plate (₹)' }, Input({ type: 'number', placeholder: '68' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Save session', { variant: 'primary', onClick: () => { close(); saved('Meal session'); } })),
          }) })),
        kpis: [
          { label: 'Plates today', value: num(today.reduce((a, r) => a + r.served, 0)), icon: 'utensils', tone: 'brand' },
          { label: 'Avg turnout', value: `${(rows.reduce((a, r) => a + r.percent, 0) / Math.max(1, rows.length)).toFixed(1)}%`, icon: 'percent', tone: 'success' },
          { label: 'Wastage (session)', value: `${num(rows.reduce((a, r) => a + r.wastageKg, 0))} kg`, icon: 'trash', tone: 'danger' },
          { label: 'Mess cost', value: moneyC(rows.reduce((a, r) => a + r.served * r.costPerPlate, 0)), icon: 'rupee', tone: 'warning' },
        ],
        filters: [
          { id: 'hostelId', label: 'Block', options: db.hostels.map((x) => ({ value: x.id, label: x.name })) },
          { id: 'meal', label: 'Meal', options: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'] },
          { id: 'status', label: 'Session', options: ['Completed', 'Partial'] },
          { id: 'date', label: 'Date', type: 'date' },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          hostelId: (r, x) => r.hostelId === x,
          meal: (r, x) => r.meal === x,
          status: (r, x) => r.status === x,
          date: (r, x) => r.date === x,
        })),
        chart: barChart({
          categories: byMeal.map((m) => m.meal),
          series: [{ name: 'Average turnout', values: byMeal.map((m) => m.percent) }],
          valueFormat: 'percent', target: 90, targetLabel: 'Expected 90%', height: 250, showValues: true,
        }),
        chartTitle: 'Turnout by meal',
        columns: [
          { key: 'date', label: 'Date', sticky: true, width: 130, render: (r) => dt(r.date) },
          { key: 'hostelName', label: 'Block', width: 200, filter: true },
          { key: 'meal', label: 'Meal', width: 130, filter: true },
          { key: 'expected', label: 'On roll', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'served', label: 'Served', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'skipped', label: 'Skipped', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'percent', label: 'Turnout', width: 160, render: (r) => ProgressBar(r.percent, { tone: r.percent >= 90 ? 'success' : r.percent >= 75 ? 'warning' : 'danger', showValue: true }), aggregate: 'avg', format: (v) => `${v.toFixed(1)}%` },
          { key: 'wastageKg', label: 'Wastage', width: 110, align: 'right', numeric: true, render: (r) => `${r.wastageKg} kg`, aggregate: 'sum', format: (v) => `${num(v)} kg` },
          { key: 'costPerPlate', label: '₹ / plate', width: 110, align: 'right', numeric: true, render: (r) => money(r.costPerPlate), aggregate: 'avg', format: (v) => money(Math.round(v)) },
          { key: 'markedBy', label: 'Marked by', width: 180, hidden: true },
          { key: 'status', label: 'Session', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['hostelName', 'meal'],
        bulkActions: stdBulk('sessions'),
        rowActions: () => [
          { label: 'Menu for the day', icon: 'utensils', route: 'hostel/mess-menu' },
          { label: 'Raise a kitchen indent', icon: 'shopping-cart', route: 'inventory/purchase-requests' },
        ],
        emptyState: emptyFor('coffee', 'No meal sessions', 'Record a meal to start tracking turnout and wastage.'),
      }));
    },
  },

  /* --------------------------------------------------- hostel/visitors */
  'hostel/visitors': {
    title: 'Visitors',
    subtitle: 'Parent and guardian visits to the hostel',
    section: 'hostel',
    render(mount) {
      ensureStyles();
      const allocs = db.hostelAllocations;
      const rows = db.visitors.slice(0, 260).map((v, i) => {
        const a = allocs[i % Math.max(1, allocs.length)] || {};
        return {
          ...v,
          hostelId: a.hostelId, hostelName: a.hostelName || '—', roomNo: a.roomNo || '—',
          residentName: a.studentName || v.relatedStudent || '—',
          relation: pickOf(['Father', 'Mother', 'Local Guardian', 'Sibling', 'Uncle'], 'vr' + v.id),
          meetingPoint: pickOf(['Visitors Lounge', 'Warden Office', 'Front Lawn', 'Reception'], 'mp' + v.id),
        };
      });

      mount.appendChild(listPage({
        title: 'Hostel visitors',
        subtitle: `${rows.length} visits logged · ${rows.filter((r) => r.status === 'Inside').length} currently inside`,
        route: 'hostel/visitors',
        actions: pageActions(
          Button('Visitor policy', { variant: 'secondary', icon: 'file-text', onClick: mockAction('Open visitor policy') }),
          Button('Check in a visitor', { variant: 'primary', icon: 'log-in', onClick: () => Modal({
            title: 'Check in a hostel visitor', size: 'lg', icon: 'log-in',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Visitor name', required: true }, Input({ placeholder: 'e.g. Rajesh Sharma' })),
              Field({ label: 'Phone', required: true }, Input({ placeholder: '+91 98xxx xxxxx' })),
              Field({ label: 'Resident', required: true, className: 'col-span-full' },
                Combobox({ options: allocs.slice(0, 200).map((a) => ({ value: a.studentId, label: `${a.studentName} · ${a.hostelName} ${a.roomNo}` })), placeholder: 'Search a resident…' })),
              Field({ label: 'Relation' }, Select({ options: ['Father', 'Mother', 'Local Guardian', 'Sibling', 'Other'] })),
              Field({ label: 'ID proof' }, Select({ options: ['Aadhaar', 'Driving Licence', 'Voter ID', 'PAN Card'] })),
              Field({ label: 'ID number' }, Input({ placeholder: 'XXXX 1234' })),
              Field({ label: 'Meeting point' }, Select({ options: ['Visitors Lounge', 'Warden Office', 'Front Lawn', 'Reception'] })),
              Field({ label: 'Expected out time' }, TimePicker({ value: '17:00' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Issue pass', { variant: 'primary', icon: 'id-card', onClick: () => { close(); notify({ title: 'Visitor pass issued', text: 'The warden has been notified.', tone: 'success' }); } })),
          }) })),
        kpis: [
          { label: 'Visits', value: String(rows.length), icon: 'users', tone: 'brand' },
          { label: 'Inside now', value: String(rows.filter((r) => r.status === 'Inside').length), icon: 'log-in', tone: 'warning' },
          { label: 'Checked out', value: String(rows.filter((r) => r.status === 'Checked Out').length), icon: 'log-out', tone: 'success' },
          { label: 'ID captured', value: `${Math.round((rows.filter((r) => r.photoTaken).length / Math.max(1, rows.length)) * 100)}%`, icon: 'camera', tone: 'info' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Visitor, resident or pass no…', width: '250px' },
          { id: 'hostelId', label: 'Block', options: db.hostels.map((x) => ({ value: x.id, label: x.name })) },
          { id: 'status', label: 'Status', options: ['Inside', 'Checked Out'] },
          { id: 'date', label: 'Date', type: 'date' },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.name} ${r.residentName} ${r.passNo}`.toLowerCase().includes(String(x).toLowerCase()),
          hostelId: (r, x) => r.hostelId === x,
          status: (r, x) => r.status === x,
          date: (r, x) => r.date === x,
        })),
        chart: barChart({
          categories: countBy(rows, 'relation').map((c) => c.key),
          series: [{ name: 'Visits', values: countBy(rows, 'relation').map((c) => c.value) }],
          height: 240, showValues: true,
        }),
        chartTitle: 'Who visits the hostel',
        columns: [
          { key: 'passNo', label: 'Pass', sticky: true, width: 140, className: 't-mono' },
          { key: 'name', label: 'Visitor', width: 220, render: (r) => Identity(r.name, `${r.relation} · ${r.phone}`) },
          { key: 'residentName', label: 'Resident', width: 210, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.residentName), h('div', { className: 't-xs t-muted' }, `${r.hostelName} · ${r.roomNo}`)) },
          { key: 'date', label: 'Date', width: 130, render: (r) => dt(r.date) },
          { key: 'inTime', label: 'In', width: 90 },
          { key: 'outTime', label: 'Out', width: 90, render: (r) => r.outTime || h('span', { className: 't-warning' }, 'Inside') },
          { key: 'meetingPoint', label: 'Meeting point', width: 170, filter: true },
          { key: 'idProof', label: 'ID', width: 140, filter: true, render: (r) => h('div', null, h('div', null, r.idProof), h('div', { className: 't-xs t-mono t-muted' }, r.idNumberMasked)) },
          { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status === 'Inside' ? 'Pending' : 'Completed', { tone: r.status === 'Inside' ? 'warning' : 'success', icon: r.status === 'Inside' ? 'log-in' : 'log-out' }) },
        ],
        rows, selectable: true, pageSize: 25,
        searchKeys: ['name', 'passNo', 'residentName'],
        bulkActions: [
          { label: 'Check out', icon: 'log-out', onClick: (sel) => notify({ title: `${sel.length} visitors checked out`, tone: 'success' }) },
          { label: 'Export register', icon: 'download', onClick: (sel) => notify({ title: `${sel.length} rows exported`, tone: 'success' }) },
        ],
        rowActions: (r) => [
          { label: 'Check out', icon: 'log-out', onClick: () => notify({ title: 'Visitor checked out', text: r.name, tone: 'success' }) },
          { label: 'Resident allocation', icon: 'bed', route: 'hostel/allocation' },
          { label: 'Print pass', icon: 'print', onClick: mockAction('Print visitor pass') },
        ],
        emptyState: emptyFor('users', 'No visits logged', 'Check a visitor in from the hostel gate to start the register.'),
      }));
    },
  },

  /* -------------------------------------------------- hostel/gate-pass */
  'hostel/gate-pass': {
    title: 'Gate Pass',
    subtitle: 'Outings, weekend leave and returns',
    section: 'hostel',
    render(mount) {
      ensureStyles();
      const allocs = db.hostelAllocations;
      const rows = db.gatePasses.filter((g) => g.type === 'Student').map((g, i) => {
        const a = allocs[i % Math.max(1, allocs.length)] || {};
        return {
          ...g,
          hostelId: a.hostelId, hostelName: a.hostelName || '—', roomNo: a.roomNo || '—',
          passType: pickOf(['Day Outing', 'Weekend Leave', 'Medical', 'Home Visit', 'Sports Fixture'], 'pt' + g.id),
          expectedBack: g.expectedReturn || '18:00',
          overdue: !g.expectedReturn && g.status === 'Approved',
        };
      });

      mount.appendChild(approvalQueuePage({
        title: 'Gate passes',
        subtitle: `${rows.length} passes this session · ${rows.filter((r) => r.status === 'Pending').length} awaiting the warden`,
        route: 'hostel/gate-pass',
        kpis: [
          { label: 'Passes', value: String(rows.length), icon: 'log-out', tone: 'brand' },
          { label: 'Awaiting approval', value: String(rows.filter((r) => r.status === 'Pending').length), icon: 'inbox', tone: 'warning' },
          { label: 'Currently out', value: String(rows.filter((r) => r.status === 'Approved').length), icon: 'navigation', tone: 'info' },
          { label: 'Returned', value: String(rows.filter((r) => r.status === 'Returned').length), icon: 'check-circle', tone: 'success' },
        ],
        tabs: [
          { id: 'all', label: 'All passes', count: rows.length },
          { id: 'pending', label: 'Pending', count: rows.filter((r) => r.status === 'Pending').length },
          { id: 'out', label: 'Out now', count: rows.filter((r) => r.status === 'Approved').length },
        ],
        activeTab: 'all',
        onTabChange: (id) => notify({ title: `Showing ${id}`, tone: 'info' }),
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Resident or pass no…', width: '250px' },
          { id: 'passType', label: 'Type', options: ['Day Outing', 'Weekend Leave', 'Medical', 'Home Visit', 'Sports Fixture'] },
          { id: 'hostelId', label: 'Block', options: db.hostels.map((x) => ({ value: x.id, label: x.name })) },
          { id: 'status', label: 'Status', options: ['Pending', 'Approved', 'Rejected', 'Returned'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.personName} ${r.passNo}`.toLowerCase().includes(String(x).toLowerCase()),
          passType: (r, x) => r.passType === x,
          hostelId: (r, x) => r.hostelId === x,
          status: (r, x) => r.status === x,
        })),
        columns: [
          { key: 'passNo', label: 'Pass', sticky: true, width: 140, className: 't-mono' },
          { key: 'personName', label: 'Resident', width: 230, render: (r) => Identity(r.personName, `${r.className} · ${r.hostelName} ${r.roomNo}`) },
          { key: 'passType', label: 'Type', width: 150, filter: true },
          { key: 'date', label: 'Date', width: 130, render: (r) => dt(r.date) },
          { key: 'outTime', label: 'Out', width: 90 },
          { key: 'expectedBack', label: 'Back by', width: 100 },
          { key: 'reason', label: 'Reason', width: 220 },
          { key: 'pickedUpBy', label: 'Escorted by', width: 160, render: (r) => r.pickedUpBy || '—' },
          { key: 'authorisedBy', label: 'Authorised by', width: 160, filter: true },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        onApprove: (r) => notify({ title: 'Gate pass approved', text: `${r.personName} · back by ${r.expectedBack}`, tone: 'success' }),
        onReject: (r) => notify({ title: 'Gate pass rejected', text: r.personName, tone: 'danger' }),
        detail: (r) => h('div', { className: 'stack-3' },
          profileHeader({
            name: r.personName, size: 'lg',
            subtitle: `${r.className} · ${r.hostelName} · room ${r.roomNo}`,
            badges: [Badge(r.status), Badge(r.passType, { tone: 'info' })],
            meta: [
              { label: 'Pass', value: r.passNo, icon: 'id-card' },
              { label: 'Date', value: dt(r.date), icon: 'calendar' },
              { label: 'Out', value: r.outTime, icon: 'log-out' },
              { label: 'Back by', value: r.expectedBack, icon: 'clock' },
            ],
          }),
          SectionCard({ title: 'Reason', icon: 'file-text' }, h('div', { className: 't-sm' }, r.reason)),
          SectionCard({ title: 'Authorisation trail', icon: 'workflow' },
            ApprovalTrail([
              { label: 'Requested by resident', by: r.personName, date: dt(r.date), state: 'done', note: r.reason },
              { label: 'Warden review', by: r.authorisedBy, date: dt(r.date), state: r.status === 'Pending' ? 'current' : 'done' },
              { label: 'Security verification', by: 'Main Gate', date: dt(r.date), state: r.securityVerified ? 'done' : 'todo' },
              { label: 'Return recorded', by: 'Night Supervisor', date: '—', state: r.status === 'Returned' ? 'done' : 'todo' },
            ])),
          Callout({ tone: r.status === 'Approved' ? 'warning' : 'info', title: 'Escort rule' },
            'Residents below Class IX may only leave with a parent or a guardian registered on their local-guardian record. Security checks the photograph on the pass at the gate.')),
      }));
    },
  },

  /* ------------------------------------------------------- hostel/fees */
  'hostel/fees': {
    title: 'Hostel Fees',
    subtitle: 'Room rent, mess charges and collection status',
    section: 'hostel',
    render(mount) {
      ensureStyles();
      const rows = db.hostelAllocations.filter((a) => a.status !== 'Vacated').map((a) => {
        const months = 10;
        const mess = 4800;
        const billed = (a.monthlyFee + mess) * months;
        const pct = [100, 100, 75, 50, 25, 0][hashOf('hf' + a.id) % 6];
        const paid = Math.round((billed * pct) / 100);
        return {
          id: a.id, studentId: a.studentId, studentName: a.studentName, className: a.className,
          campusId: a.campusId, hostelId: a.hostelId, hostelName: a.hostelName, roomNo: a.roomNo,
          roomRent: a.monthlyFee * months, messCharge: mess * months, billed, paid, due: billed - paid,
          messPlan: a.messPlan,
          dueDate: '2026-09-05',
          status: billed - paid === 0 ? 'Paid' : paid === 0 ? 'Overdue' : 'Partial',
        };
      });
      const billed = rows.reduce((a, r) => a + r.billed, 0);
      const collected = rows.reduce((a, r) => a + r.paid, 0);

      mount.appendChild(listPage({
        title: 'Hostel fees',
        subtitle: `${rows.length} residents billed · ${moneyC(collected)} of ${moneyC(billed)} collected`,
        route: 'hostel/fees',
        actions: pageActions(
          Button('Send reminders', { variant: 'secondary', icon: 'send', onClick: () => notify({ title: `${rows.filter((r) => r.due > 0).length} reminders queued`, tone: 'success' }) }),
          Button('Collect fee', { variant: 'primary', icon: 'credit-card', route: 'fees/collection' })),
        kpis: [
          { label: 'Billed', value: moneyC(billed), icon: 'receipt', tone: 'info' },
          { label: 'Collected', value: moneyC(collected), delta: 4.8, icon: 'wallet', tone: 'success' },
          { label: 'Outstanding', value: moneyC(billed - collected), icon: 'alert-circle', tone: 'danger' },
          { label: 'Collection rate', value: `${Math.round((collected / Math.max(1, billed)) * 100)}%`, icon: 'percent', tone: 'brand' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Resident or room…', width: '250px' },
          { id: 'hostelId', label: 'Block', options: db.hostels.map((x) => ({ value: x.id, label: x.name })) },
          { id: 'status', label: 'Status', options: ['Paid', 'Partial', 'Overdue'] },
          { id: 'messPlan', label: 'Mess plan', options: ['Full Board', 'Veg Only', 'Jain Meal', 'Special Diet'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.studentName} ${r.roomNo}`.toLowerCase().includes(String(x).toLowerCase()),
          hostelId: (r, x) => r.hostelId === x,
          status: (r, x) => r.status === x,
          messPlan: (r, x) => r.messPlan === x,
        })),
        chart: waterfallChart({
          items: [
            { label: 'Room rent billed', value: rows.reduce((a, r) => a + r.roomRent, 0), type: 'start' },
            { label: 'Mess charges', value: rows.reduce((a, r) => a + r.messCharge, 0) },
            { label: 'Collected', value: -collected },
            { label: 'Outstanding', value: billed - collected, type: 'total' },
          ],
          valueFormat: 'currencyCompact', height: 280,
        }),
        chartTitle: 'Hostel billing movement',
        columns: [
          { key: 'studentName', label: 'Resident', sticky: true, width: 240, render: (r) => Identity(r.studentName, `${r.className} · ${r.hostelName} ${r.roomNo}`) },
          { key: 'hostelName', label: 'Block', width: 200, filter: true, hidden: true },
          { key: 'messPlan', label: 'Mess plan', width: 150, filter: true },
          { key: 'roomRent', label: 'Room rent', width: 140, align: 'right', numeric: true, render: (r) => money(r.roomRent), aggregate: 'sum', format: moneyC },
          { key: 'messCharge', label: 'Mess', width: 130, align: 'right', numeric: true, render: (r) => money(r.messCharge), aggregate: 'sum', format: moneyC },
          { key: 'billed', label: 'Billed', width: 140, align: 'right', numeric: true, render: (r) => money(r.billed), aggregate: 'sum', format: moneyC },
          { key: 'paid', label: 'Paid', width: 140, align: 'right', numeric: true, render: (r) => money(r.paid), aggregate: 'sum', format: moneyC },
          { key: 'due', label: 'Due', width: 140, align: 'right', numeric: true, render: (r) => (r.due ? h('span', { className: 't-danger t-semibold' }, money(r.due)) : '—'), aggregate: 'sum', format: moneyC },
          { key: 'dueDate', label: 'Next due', width: 130, render: (r) => dt(r.dueDate) },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['studentName', 'roomNo', 'hostelName'],
        bulkActions: [
          { label: 'Send reminder', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} reminders sent`, tone: 'success' }) },
          { label: 'Generate receipts', icon: 'receipt', onClick: (sel) => notify({ title: `${sel.length} receipts generated`, tone: 'success' }) },
        ],
        onRowClick: (r) => navigate(`students/profile/${r.studentId}`),
        rowActions: (r) => [
          { label: 'Student profile', icon: 'user', route: `students/profile/${r.studentId}` },
          { label: 'Collect fee', icon: 'credit-card', route: 'fees/collection' },
          { label: 'Allocation', icon: 'bed', route: 'hostel/allocation' },
        ],
        emptyState: emptyFor('wallet', 'Nothing billed', 'Allocate residents to rooms to raise hostel fee demands.'),
      }));
    },
  },

  /* ------------------------------------------------- hostel/complaints */
  'hostel/complaints': {
    title: 'Complaints',
    subtitle: 'Resident grievances and their resolution',
    section: 'hostel',
    render(mount) {
      ensureStyles();
      const rows = hostelComplaints();

      mount.appendChild(listPage({
        title: 'Hostel complaints',
        subtitle: `${rows.length} tickets · ${rows.filter((r) => r.status !== 'Resolved' && r.status !== 'Closed').length} still open`,
        route: 'hostel/complaints',
        actions: pageActions(
          Button('SLA settings', { variant: 'secondary', icon: 'timer', route: 'complaints/sla' }),
          Button('Log a complaint', { variant: 'primary', icon: 'alert-circle', onClick: () => Modal({
            title: 'Log a hostel complaint', size: 'lg', icon: 'alert-circle',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Resident', required: true, className: 'col-span-full' },
                Combobox({ options: db.hostelAllocations.slice(0, 200).map((a) => ({ value: a.studentId, label: `${a.studentName} · ${a.hostelName} ${a.roomNo}` })) })),
              Field({ label: 'Area', required: true }, Select({ options: ['Mess food', 'Wi-Fi', 'Cleanliness', 'Water supply', 'Noise', 'Laundry', 'Security'] })),
              Field({ label: 'Priority' }, Select({ options: ['Low', 'Medium', 'High', 'Critical'], value: 'Medium' })),
              Field({ label: 'Subject', required: true, className: 'col-span-full' }, Input({ placeholder: 'Hot water not available in the morning' })),
              Field({ label: 'Description', className: 'col-span-full' }, Textarea({ rows: 4, placeholder: 'Describe the issue, when it started and who has been informed so far.' })),
              Field({ label: 'Photographs', className: 'col-span-full' }, FileUpload({ label: 'Attach photographs', hint: 'Optional' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Raise ticket', { variant: 'primary', onClick: () => { close(); saved('Complaint'); } })),
          }) })),
        kpis: [
          { label: 'Tickets', value: String(rows.length), icon: 'alert-circle', tone: 'brand' },
          { label: 'Open', value: String(rows.filter((r) => r.status === 'Open').length), icon: 'inbox', tone: 'danger' },
          { label: 'SLA breached', value: String(rows.filter((r) => r.slaBreached).length), icon: 'timer', tone: 'warning' },
          { label: 'Avg satisfaction', value: (rows.reduce((a, r) => a + (r.satisfaction || 0), 0) / Math.max(1, rows.filter((r) => r.satisfaction).length)).toFixed(1), icon: 'smile', tone: 'success' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Ticket, subject or resident…', width: '250px' },
          { id: 'area', label: 'Area', options: ['Mess food', 'Wi-Fi', 'Cleanliness', 'Water supply', 'Noise', 'Laundry', 'Security'] },
          { id: 'priority', label: 'Priority', options: ['Low', 'Medium', 'High', 'Critical'] },
          { id: 'status', label: 'Status', options: Array.from(new Set(rows.map((r) => r.status))) },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.ticketNo} ${r.subject} ${r.residentName}`.toLowerCase().includes(String(x).toLowerCase()),
          area: (r, x) => r.area === x,
          priority: (r, x) => r.priority === x,
          status: (r, x) => r.status === x,
        })),
        chart: barChart({
          categories: countBy(rows, 'area').map((c) => c.key),
          series: [{ name: 'Tickets', values: countBy(rows, 'area').map((c) => c.value) }],
          horizontal: true, height: 280, showValues: true,
        }),
        chartTitle: 'What residents complain about',
        columns: [
          { key: 'ticketNo', label: 'Ticket', sticky: true, width: 150, className: 't-mono' },
          { key: 'subject', label: 'Subject', width: 280, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.subject), h('div', { className: 't-xs t-muted' }, `${r.hostelName} · ${r.roomNo}`)) },
          { key: 'area', label: 'Area', width: 150, filter: true },
          { key: 'residentName', label: 'Raised by', width: 200 },
          { key: 'priority', label: 'Priority', width: 120, filter: true, render: (r) => Badge(r.priority, { tone: r.priority === 'Critical' || r.priority === 'High' ? 'danger' : r.priority === 'Medium' ? 'warning' : 'neutral' }) },
          { key: 'assignedToName', label: 'Assigned to', width: 190 },
          { key: 'ageHours', label: 'Age', width: 110, align: 'right', numeric: true, render: (r) => `${Math.round(r.ageHours)} h`, aggregate: 'avg', format: (v) => `${v.toFixed(0)} h` },
          { key: 'slaBreached', label: 'SLA', width: 110, value: (r) => (r.slaBreached ? 1 : 0), render: (r) => (r.slaBreached ? Badge('Breached', { tone: 'danger', icon: 'timer' }) : Badge('Within SLA', { tone: 'success' })) },
          { key: 'status', label: 'Status', width: 150, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['ticketNo', 'subject', 'residentName'],
        expandable: (r) => Card({ pad: true },
          h('div', { className: 'stack-2' },
            h('div', { className: 't-eyebrow' }, 'Description'),
            h('div', { className: 't-sm' }, r.description),
            r.resolutionNote && frag(
              h('div', { className: 't-eyebrow mt-3' }, 'Resolution'),
              h('div', { className: 't-sm' }, r.resolutionNote)),
            h('div', { className: 'row-3 row-wrap mt-3' },
              Button('Assign to estate team', { variant: 'secondary', size: 'sm', icon: 'user-check', onClick: mockAction('Assign ticket') }),
              Button('Resolve', { variant: 'success', size: 'sm', icon: 'check', onClick: () => notify({ title: 'Ticket resolved', text: r.ticketNo, tone: 'success' }) })))),
        bulkActions: [
          { label: 'Assign', icon: 'user-check', onClick: (sel) => notify({ title: `${sel.length} tickets assigned`, tone: 'success' }) },
          { label: 'Escalate', icon: 'trending-up', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} tickets escalated`, tone: 'warning' }) },
        ],
        rowActions: (r) => [
          { label: 'Open in complaints', icon: 'external-link', route: 'complaints/all' },
          { label: 'Raise maintenance ticket', icon: 'wrench', route: 'hostel/maintenance' },
          { label: 'Message resident', icon: 'send', onClick: () => notify({ title: 'Message sent', text: r.residentName, tone: 'success' }) },
        ],
        emptyState: emptyFor('smile', 'No complaints', 'Nothing has been raised by residents this session.'),
      }));
    },
  },

  /* ------------------------------------------------ hostel/maintenance */
  'hostel/maintenance': {
    title: 'Maintenance',
    subtitle: 'Room repair tickets and the estate queue',
    section: 'hostel',
    render(mount) {
      ensureStyles();
      const rows = hostelTickets();
      const columns = [
        { id: 'Open', title: 'Open', color: 'var(--chart-critical)' },
        { id: 'In Progress', title: 'In progress', color: 'var(--chart-warning)' },
        { id: 'Resolved', title: 'Resolved', color: 'var(--chart-good)' },
      ];

      mount.appendChild(kanbanPage({
        title: 'Hostel maintenance',
        subtitle: `${rows.length} tickets · ${rows.filter((r) => r.status !== 'Resolved').length} open · ${moneyC(rows.reduce((a, r) => a + r.cost, 0))} estimated`,
        route: 'hostel/maintenance',
        actions: pageActions(
          Button('Room list', { variant: 'secondary', icon: 'door', route: 'hostel/rooms' }),
          Button('Raise a ticket', { variant: 'primary', icon: 'wrench', onClick: () => Modal({
            title: 'Raise a maintenance ticket', size: 'lg', icon: 'wrench',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Block', required: true }, Select({ options: db.hostels.map((x) => ({ value: x.id, label: x.name })) })),
              Field({ label: 'Room', required: true }, Combobox({ options: db.hostelRooms.slice(0, 150).map((r) => ({ value: r.id, label: `${r.hostelName} · ${r.roomNo}` })) })),
              Field({ label: 'Category', required: true }, Select({ options: ['Plumbing', 'Electrical', 'Carpentry', 'Civil', 'Pest Control', 'Housekeeping'] })),
              Field({ label: 'Priority' }, Select({ options: ['Low', 'Normal', 'High'], value: 'Normal' })),
              Field({ label: 'Issue', required: true, className: 'col-span-full' }, Textarea({ rows: 3, placeholder: 'Describe what is broken and since when.' })),
              Field({ label: 'Estimated cost (₹)' }, Input({ type: 'number', placeholder: '1500' })),
              Field({ label: 'Assign to' }, Select({ options: ['Ramesh (Plumber)', 'Sunil (Electrician)', 'Mahesh (Carpenter)', 'Estate Team'] }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Raise ticket', { variant: 'primary', onClick: () => { close(); saved('Ticket'); } })),
          }) })),
        kpis: [
          { label: 'Tickets', value: String(rows.length), icon: 'wrench', tone: 'brand' },
          { label: 'Open', value: String(rows.filter((r) => r.status === 'Open').length), icon: 'inbox', tone: 'danger' },
          { label: 'In progress', value: String(rows.filter((r) => r.status === 'In Progress').length), icon: 'tool', tone: 'warning' },
          { label: 'Estimated spend', value: moneyC(rows.reduce((a, r) => a + r.cost, 0)), icon: 'rupee', tone: 'info' },
        ],
        filters: [
          { id: 'category', label: 'Category', options: ['Plumbing', 'Electrical', 'Carpentry', 'Civil', 'Pest Control', 'Housekeeping'] },
          { id: 'priority', label: 'Priority', options: ['Low', 'Normal', 'High'] },
          { id: 'hostelId', label: 'Block', options: db.hostels.map((x) => ({ value: x.id, label: x.name })) },
        ],
        onFilter: (id, v, all) => notify({ title: 'Board filtered', text: `${id}: ${v}`, tone: 'info' }),
        columns,
        cards: rows.map((r) => ({
          id: r.id, columnId: r.status,
          title: `${r.roomNo} · ${r.category}`,
          meta: `${r.hostelName} · ${r.assignedTo} · ${money(r.cost)}`,
          badge: r.priority, tone: r.priority === 'High' ? 'danger' : r.priority === 'Low' ? 'info' : 'warning',
        })),
        onMove: (cardId, toColumnId) => notify({ title: 'Ticket moved', text: `${cardId} → ${toColumnId}`, tone: 'success' }),
        onCardClick: (card) => {
          const t = rows.find((r) => r.id === card.id);
          if (!t) return;
          openDrawer(`${t.ticketNo}`, `${t.hostelName} · room ${t.roomNo} · floor ${t.floor}`,
            h('div', { className: 'stack-3' },
              h('div', { className: 'row-3 row-wrap' }, Badge(t.status), Badge(t.category, { tone: 'info' }), Badge(t.priority, { tone: t.priority === 'High' ? 'danger' : 'neutral' })),
              kv([
                ['Raised by', t.raisedBy],
                ['Raised on', dt(t.raisedOn)],
                ['Assigned to', t.assignedTo],
                ['Estimated cost', money(t.cost)],
              ]),
              SectionCard({ title: 'Issue', icon: 'alert-circle' }, h('div', { className: 't-sm' }, t.issue)),
              SectionCard({ title: 'Progress', icon: 'workflow' },
                Stepper([
                  { label: 'Raised', description: dt(t.raisedOn), state: 'done' },
                  { label: 'Assigned', description: t.assignedTo, state: t.status === 'Open' ? 'current' : 'done' },
                  { label: 'Work in progress', state: t.status === 'In Progress' ? 'current' : t.status === 'Resolved' ? 'done' : 'todo' },
                  { label: 'Closed', state: t.status === 'Resolved' ? 'done' : 'todo' },
                ], { current: t.status === 'Open' ? 1 : t.status === 'In Progress' ? 2 : 3 }))),
            (close) => frag(
              Button('Reassign', { variant: 'ghost', onClick: mockAction('Reassign ticket') }),
              Button('Mark resolved', { variant: 'primary', icon: 'check', onClick: () => { close(); notify({ title: 'Ticket resolved', text: t.ticketNo, tone: 'success' }); } })));
        },
      }));
    },
  },

  /* ---------------------------------------------- hostel/room-transfer */
  'hostel/room-transfer': {
    title: 'Room Transfer',
    subtitle: 'Requests to move room, block or bed',
    section: 'hostel',
    render(mount) {
      ensureStyles();
      const rows = transferRequests();

      mount.appendChild(approvalQueuePage({
        title: 'Room transfer requests',
        subtitle: `${rows.length} requests · ${rows.filter((r) => r.status === 'Pending').length} waiting on the warden`,
        route: 'hostel/room-transfer',
        kpis: [
          { label: 'Requests', value: String(rows.length), icon: 'refresh-ccw', tone: 'brand' },
          { label: 'Pending', value: String(rows.filter((r) => r.status === 'Pending').length), icon: 'inbox', tone: 'warning' },
          { label: 'Approved', value: String(rows.filter((r) => r.status === 'Approved').length), icon: 'check-circle', tone: 'success' },
          { label: 'Rejected', value: String(rows.filter((r) => r.status === 'Rejected').length), icon: 'x-circle', tone: 'danger' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Resident or request no…', width: '250px' },
          { id: 'hostelId', label: 'Block', options: db.hostels.map((x) => ({ value: x.id, label: x.name })) },
          { id: 'status', label: 'Status', options: ['Pending', 'Approved', 'Rejected', 'Completed'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.studentName} ${r.requestNo}`.toLowerCase().includes(String(x).toLowerCase()),
          hostelId: (r, x) => r.hostelId === x,
          status: (r, x) => r.status === x,
        })),
        columns: [
          { key: 'requestNo', label: 'Request', sticky: true, width: 150, className: 't-mono' },
          { key: 'studentName', label: 'Resident', width: 230, render: (r) => Identity(r.studentName, `${r.className} · ${r.hostelName}`) },
          { key: 'fromRoom', label: 'From', width: 120, render: (r) => h('span', { className: 't-mono' }, `${r.fromRoom}/${r.fromBed}`) },
          { key: 'toRoom', label: 'To', width: 140, render: (r) => h('span', { className: 't-mono' }, r.toRoom) },
          { key: 'requestedOn', label: 'Requested', width: 130, render: (r) => dt(r.requestedOn) },
          { key: 'feeDelta', label: 'Fee change', width: 140, align: 'right', numeric: true,
            render: (r) => (r.feeDelta === 0 ? '—' : h('span', { className: r.feeDelta > 0 ? 't-danger' : 't-success' }, formatCurrency(r.feeDelta, { sign: true }))) },
          { key: 'approvedBy', label: 'Approver', width: 160, filter: true },
          { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        onApprove: (r) => notify({ title: 'Transfer approved', text: `${r.studentName} → room ${r.toRoom}`, tone: 'success' }),
        onReject: (r) => notify({ title: 'Transfer rejected', text: r.studentName, tone: 'danger' }),
        detail: (r) => h('div', { className: 'stack-3' },
          profileHeader({
            name: r.studentName, size: 'lg',
            subtitle: `${r.className} · ${r.hostelName}`,
            badges: [Badge(r.status)],
            meta: [
              { label: 'Request', value: r.requestNo, icon: 'file-text' },
              { label: 'From', value: `${r.fromRoom}/${r.fromBed}`, icon: 'door' },
              { label: 'To', value: r.toRoom, icon: 'bed' },
              { label: 'Requested', value: dt(r.requestedOn), icon: 'calendar' },
            ],
          }),
          SectionCard({ title: 'Reason given', icon: 'message-square' }, h('div', { className: 't-sm' }, r.reason)),
          SectionCard({ title: 'Fee impact', icon: 'wallet' },
            kv([
              ['Current room', `${r.hostelName} · ${r.fromRoom}/${r.fromBed}`],
              ['Proposed room', `${r.toHostel} · ${r.toRoom}`],
              ['Monthly change', r.feeDelta === 0 ? 'No change' : formatCurrency(r.feeDelta, { sign: true })],
              ['Approver', r.approvedBy],
            ])),
          Callout({ tone: 'info', title: 'Before approving' },
            'Check that the destination room has a free bed of the right gender block, and that the resident has no outstanding hostel dues.')),
      }));
    },
  },

  /* ----------------------------------------------------- hostel/reports */
  'hostel/reports': {
    title: 'Hostel Reports',
    subtitle: 'Occupancy, attendance, mess and recovery',
    section: 'hostel',
    render(mount) {
      ensureStyles();
      const att = hostelAttendance();
      const mess = messAttendance();
      const tickets = hostelTickets();
      const rows = db.hostels.map((hs) => {
        const a = att.filter((x) => x.hostelId === hs.id);
        const m = mess.filter((x) => x.hostelId === hs.id);
        const t = tickets.filter((x) => x.hostelId === hs.id);
        const allocs = db.hostelAllocations.filter((x) => x.hostelId === hs.id && x.status === 'Active');
        return {
          id: hs.id, hostel: hs.name, type: hs.type, campusId: hs.campusId,
          capacity: hs.capacity, occupied: hs.occupied, vacant: hs.capacity - hs.occupied,
          occupancy: Math.round((hs.occupied / hs.capacity) * 100),
          attendance: a.length ? Number(((a.filter((x) => x.status === 'Present').length / a.length) * 100).toFixed(1)) : 0,
          messTurnout: m.length ? Number((m.reduce((x, y) => x + y.percent, 0) / m.length).toFixed(1)) : 0,
          wastageKg: m.reduce((x, y) => x + y.wastageKg, 0),
          tickets: t.length,
          openTickets: t.filter((x) => x.status !== 'Resolved').length,
          revenue: allocs.reduce((x, y) => x + y.monthlyFee, 0) * 10,
        };
      });

      mount.appendChild(reportPage({
        title: 'Hostel reports',
        subtitle: `${db.hostels.length} blocks · academic year 2026-27`,
        route: 'hostel/reports',
        filters: [
          { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'month', label: 'This month' }, { id: 'term', label: 'This term' }, { id: 'ytd', label: 'Year to date' }] },
          { id: 'hostel', label: 'Block', options: db.hostels.map((x) => x.name) },
          { id: 'type', label: 'Type', options: ['Boys', 'Girls'] },
          { id: 'from', label: 'From', type: 'date' },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          hostel: (r, x) => r.hostel === x,
          type: (r, x) => r.type === x,
        })),
        summary: [
          { label: 'Beds', value: num(rows.reduce((a, r) => a + r.capacity, 0)), icon: 'bed', tone: 'brand' },
          { label: 'Occupancy', value: `${analytics.kpis.hostelOccupancy}%`, delta: 2.1, icon: 'users', tone: 'success' },
          { label: 'Roll-call attendance', value: `${(rows.reduce((a, r) => a + r.attendance, 0) / Math.max(1, rows.length)).toFixed(1)}%`, icon: 'clipboard-check', tone: 'info' },
          { label: 'Hostel revenue', value: moneyC(rows.reduce((a, r) => a + r.revenue, 0)), icon: 'wallet', tone: 'warning' },
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
          lineChart({
            categories: Array.from(groupBy(att, 'date').keys()).sort().map((d) => formatDate(d, 'dayMonth')),
            series: [{
              name: 'Present %',
              values: Array.from(groupBy(att, 'date').entries()).sort((a, b) => a[0].localeCompare(b[0]))
                .map(([, list]) => Number(((list.filter((x) => x.status === 'Present').length / list.length) * 100).toFixed(1))),
            }],
            valueFormat: 'percent', target: 95, height: 260, showDots: true,
          }),
        ],
        chartTitle: 'Occupancy by block and nightly attendance',
        columns: [
          { key: 'hostel', label: 'Block', sticky: true, width: 220 },
          { key: 'type', label: 'Type', width: 100, filter: true },
          { key: 'capacity', label: 'Beds', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'occupied', label: 'Occupied', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'occupancy', label: 'Occupancy', width: 160, render: (r) => ProgressBar(r.occupancy, { tone: r.occupancy > 92 ? 'warning' : 'success', showValue: true }), aggregate: 'avg', format: (v) => `${v.toFixed(0)}%` },
          { key: 'attendance', label: 'Roll call', width: 120, align: 'right', numeric: true, render: (r) => `${r.attendance}%`, aggregate: 'avg', format: (v) => `${v.toFixed(1)}%` },
          { key: 'messTurnout', label: 'Mess turnout', width: 140, align: 'right', numeric: true, render: (r) => `${r.messTurnout}%`, aggregate: 'avg', format: (v) => `${v.toFixed(1)}%` },
          { key: 'wastageKg', label: 'Wastage', width: 120, align: 'right', numeric: true, render: (r) => `${num(r.wastageKg)} kg`, aggregate: 'sum', format: (v) => `${num(v)} kg` },
          { key: 'openTickets', label: 'Open tickets', width: 130, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'revenue', label: 'Revenue', width: 150, align: 'right', numeric: true, render: (r) => money(r.revenue), aggregate: 'sum', format: moneyC },
        ],
        rows,
        tableTitle: 'Block-wise performance',
        notes: Callout({ tone: 'info', title: 'Wastage benchmark' },
          'The mess contract sets a wastage ceiling of 4% of plates served. Blocks consistently above it should review portion sizes and the pre-meal headcount before the next quarterly review.'),
      }));
    },
  },
};

/* ==========================================================================
   7. INVENTORY & ASSETS
   ========================================================================== */

const STORES = ['Main Store', 'Lab Store', 'Sports Store', 'IT Store', 'Kitchen Store'];

function movementCols(extra = []) {
  return [
    { key: 'date', label: 'Date', sticky: true, width: 130, render: (r) => dt(r.date) },
    { key: 'itemName', label: 'Item', width: 250, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.itemName), h('div', { className: 't-xs t-muted' }, r.category)) },
    { key: 'quantity', label: 'Qty', width: 90, align: 'right', numeric: true, aggregate: 'sum', format: num },
    ...extra,
    { key: 'reference', label: 'Reference', width: 180, className: 't-mono' },
    { key: 'campusId', label: 'Campus', width: 170, filter: true, render: (r) => campusName(r.campusId), value: (r) => campusName(r.campusId) },
  ];
}

const inventoryRoutes = {

  /* ------------------------------------------------ inventory/categories */
  'inventory/categories': {
    title: 'Item Categories',
    subtitle: 'How the store is organised and what each class is worth',
    section: 'inventory',
    render(mount) {
      ensureStyles();
      const rows = db.itemCategories.map((c) => {
        const items = db.inventoryItems.filter((i) => i.categoryId === c.id);
        return {
          ...c,
          liveItems: items.length,
          stockValue: items.reduce((a, i) => a + i.value, 0),
          lowStock: items.filter((i) => i.status === 'Low Stock').length,
          outOfStock: items.filter((i) => i.status === 'Out of Stock').length,
          consumable: items.filter((i) => i.consumable).length,
          status: items.some((i) => i.status === 'Out of Stock') ? 'Needs Reorder' : 'Healthy',
        };
      });

      mount.appendChild(listPage({
        title: 'Item categories',
        subtitle: `${rows.length} categories · ${moneyC(rows.reduce((a, r) => a + r.stockValue, 0))} of live stock`,
        route: 'inventory/categories',
        actions: pageActions(
          Button('Valuation report', { variant: 'secondary', icon: 'chart-bar', route: 'inventory/reports' }),
          Button('New category', { variant: 'primary', icon: 'plus', onClick: () => Modal({
            title: 'New item category', size: 'sm', icon: 'tag',
            body: FormGrid({ cols: 1 },
              Field({ label: 'Category name', required: true }, Input({ placeholder: 'e.g. Music Instruments' })),
              Field({ label: 'Default store' }, Select({ options: STORES })),
              Field({ label: 'Consumable by default' }, Switch('Items in this class are consumed, not tracked as assets', { checked: true }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Create', { variant: 'primary', onClick: () => { close(); saved('Category'); } })),
          }) })),
        kpis: [
          { label: 'Categories', value: String(rows.length), icon: 'tag', tone: 'brand' },
          { label: 'Live SKUs', value: String(rows.reduce((a, r) => a + r.liveItems, 0)), icon: 'package', tone: 'info' },
          { label: 'Stock value', value: moneyC(rows.reduce((a, r) => a + r.stockValue, 0)), icon: 'rupee', tone: 'success' },
          { label: 'Needing reorder', value: String(rows.reduce((a, r) => a + r.lowStock + r.outOfStock, 0)), icon: 'alert-triangle', tone: 'danger', route: 'inventory/stock' },
        ],
        chart: treemap({
          data: analytics.inventoryValueByCategory.map((c) => ({ key: c.key, value: c.value })),
          height: 300, valueFormat: 'currencyCompact',
        }),
        chartTitle: 'Capital tied up by category',
        columns: [
          { key: 'name', label: 'Category', sticky: true, width: 220, render: (r) => h('div', { className: 'row', style: { gap: 'var(--sp-2)' } }, h('i', { className: 'ops-swatch', style: { background: seriesColor(hashOf(r.name) % 8) } }), h('span', { className: 't-medium' }, r.name)) },
          { key: 'liveItems', label: 'SKUs', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'consumable', label: 'Consumable', width: 130, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'stockValue', label: 'Stock value', width: 150, align: 'right', numeric: true, render: (r) => money(r.stockValue), aggregate: 'sum', format: moneyC },
          { key: 'lowStock', label: 'Low stock', width: 120, align: 'right', numeric: true, render: (r) => (r.lowStock ? h('span', { className: 't-warning t-semibold' }, String(r.lowStock)) : '—'), aggregate: 'sum', format: num },
          { key: 'outOfStock', label: 'Out of stock', width: 130, align: 'right', numeric: true, render: (r) => (r.outOfStock ? h('span', { className: 't-danger t-semibold' }, String(r.outOfStock)) : '—'), aggregate: 'sum', format: num },
          { key: 'status', label: 'Status', width: 150, filter: true, render: (r) => Badge(r.status === 'Healthy' ? 'In Stock' : 'Low Stock') },
        ],
        rows, selectable: true, footerAggregates: true, paginate: false,
        searchKeys: ['name'],
        bulkActions: stdBulk('categories'),
        onRowClick: () => navigate('inventory/items'),
        rowActions: () => [
          { label: 'View items', icon: 'package', route: 'inventory/items' },
          { label: 'Stock levels', icon: 'layers', route: 'inventory/stock' },
          { label: 'Raise a purchase request', icon: 'clipboard-list', route: 'inventory/purchase-requests' },
        ],
        emptyState: emptyFor('tag', 'No categories', 'Create a category before adding items to the store.'),
      }));
    },
  },

  /* ----------------------------------------------------- inventory/items */
  'inventory/items': {
    title: 'Items',
    subtitle: 'The full SKU master across every store',
    section: 'inventory',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.inventoryItems, ctx).map((i) => ({
        ...i,
        vendorName: (byId(db.vendors, i.vendorId) || {}).name || '—',
        coverDays: i.reorderLevel ? Math.round((i.stock / Math.max(1, i.reorderLevel)) * 30) : 0,
      }));

      const detail = (i) => {
        const moves = db.stockMovements.filter((m) => m.itemId === i.id);
        openDrawer(i.name, `${i.code} · ${i.category} · ${i.store}`,
          h('div', { className: 'stack-3' },
            h('div', { className: 'row-3 row-wrap' }, Badge(i.status), Badge(i.category, { tone: 'info' }), i.consumable ? Badge('Consumable', { tone: 'neutral' }) : Badge('Asset-tracked', { tone: 'brand' })),
            h('div', { className: 'row-4 row-wrap row-top' },
              qrTile(i.code),
              h('div', { className: 'flex-1', style: { minWidth: '220px' } },
                kv([
                  ['SKU', i.code],
                  ['Unit', i.unit],
                  ['In stock', `${num(i.stock)} ${i.unit}`],
                  ['Reorder level', `${num(i.reorderLevel)} ${i.unit}`],
                  ['Unit price', money(i.unitPrice)],
                  ['Stock value', money(i.value)],
                  ['Store', i.store],
                  ['Preferred vendor', i.vendorName],
                  ['Last purchase', dt(i.lastPurchase)],
                ]))),
            SectionCard({ title: 'Stock position', icon: 'layers' },
              h('div', { className: 'stack-2' },
                ProgressBar(Math.min(100, Math.round((i.stock / Math.max(1, i.reorderLevel * 3)) * 100)), {
                  tone: i.stock === 0 ? 'danger' : i.stock < i.reorderLevel ? 'warning' : 'success',
                  label: `${num(i.stock)} on hand · reorder at ${num(i.reorderLevel)}`, showValue: false,
                }),
                i.stock < i.reorderLevel && Callout({ tone: i.stock === 0 ? 'danger' : 'warning', title: i.stock === 0 ? 'Out of stock' : 'Below reorder level' },
                  'Raise a purchase request so the store does not run dry before the next indent cycle.'))),
            SectionCard({ title: 'Recent movements', flush: true },
              moves.length ? DataTable({
                rows: moves, pageSize: 8, searchable: false, exportable: false, columnToggle: false,
                columns: [
                  { key: 'date', label: 'Date', width: 120, render: (m) => dt(m.date) },
                  { key: 'type', label: 'Type', width: 120, render: (m) => Badge(m.type === 'Stock In' ? 'Verified' : m.type === 'Issue' ? 'Issued' : m.type === 'Return' ? 'New' : 'Cancelled', { tone: m.type === 'Stock In' ? 'success' : m.type === 'Issue' ? 'info' : m.type === 'Return' ? 'warning' : 'danger', icon: m.type === 'Stock In' ? 'arrow-down-right' : 'arrow-up-right' }) },
                  { key: 'quantity', label: 'Qty', width: 80, align: 'right', numeric: true },
                  { key: 'issuedTo', label: 'To', render: (m) => m.issuedTo || '—' },
                ],
              }) : h('div', { className: 'card-pad' }, emptyFor('history', 'No movements', 'Nothing has been received or issued for this SKU yet.')))),
          (close) => frag(
            Button('Raise purchase request', { variant: 'secondary', icon: 'clipboard-list', onClick: () => { close(); navigate('inventory/purchase-requests'); } }),
            Button('Issue stock', { variant: 'primary', icon: 'arrow-up-right', onClick: () => { close(); navigate('inventory/stock-out'); } })));
      };

      mount.appendChild(listPage({
        title: 'Items',
        subtitle: `${rows.length} SKUs · ${moneyC(rows.reduce((a, r) => a + r.value, 0))} of stock on hand`,
        route: 'inventory/items',
        actions: pageActions(
          Button('Import SKUs', { variant: 'secondary', icon: 'upload', onClick: mockAction('Import SKU master') }),
          Button('Add item', { variant: 'primary', icon: 'plus', onClick: () => Modal({
            title: 'Add an item', size: 'lg', icon: 'package',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Item name', required: true, className: 'col-span-full' }, Input({ placeholder: 'e.g. Whiteboard Marker (Black)' })),
              Field({ label: 'Category', required: true }, Select({ options: db.itemCategories.map((c) => ({ value: c.id, label: c.name })) })),
              Field({ label: 'Unit', required: true }, Select({ options: ['Piece', 'Box', 'Ream', 'Set', 'Litre', 'Kg'] })),
              Field({ label: 'Opening stock' }, Input({ type: 'number', value: '0' })),
              Field({ label: 'Reorder level', required: true }, Input({ type: 'number', value: '40' })),
              Field({ label: 'Unit price (₹)', required: true }, Input({ type: 'number', placeholder: '35' })),
              Field({ label: 'Store' }, Select({ options: STORES })),
              Field({ label: 'Preferred vendor', className: 'col-span-full' }, Combobox({ options: db.vendors.map((v) => ({ value: v.id, label: v.name })) })),
              Field({ label: 'Consumable', className: 'col-span-full' }, Switch('Consumed on issue — not tracked as an asset', { checked: true }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Add item', { variant: 'primary', onClick: () => { close(); saved('Item'); } })),
          }) })),
        kpis: [
          { label: 'SKUs', value: String(rows.length), icon: 'package', tone: 'brand' },
          { label: 'Stock value', value: moneyC(rows.reduce((a, r) => a + r.value, 0)), icon: 'rupee', tone: 'success' },
          { label: 'Low stock', value: String(rows.filter((r) => r.status === 'Low Stock').length), icon: 'alert-circle', tone: 'warning' },
          { label: 'Out of stock', value: String(rows.filter((r) => r.status === 'Out of Stock').length), icon: 'x-circle', tone: 'danger' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Item name or SKU…', width: '250px' },
          { id: 'category', label: 'Category', options: db.itemCategories.map((c) => c.name) },
          { id: 'store', label: 'Store', options: STORES },
          { id: 'status', label: 'Status', options: ['In Stock', 'Low Stock', 'Out of Stock'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.name} ${r.code}`.toLowerCase().includes(String(x).toLowerCase()),
          category: (r, x) => r.category === x,
          store: (r, x) => r.store === x,
          status: (r, x) => r.status === x,
        })),
        chart: barChart({
          categories: countBy(rows, 'category').map((c) => c.key),
          series: [{ name: 'SKUs', values: countBy(rows, 'category').map((c) => c.value) }],
          horizontal: true, height: 300, showValues: true,
        }),
        chartTitle: 'SKU count by category',
        columns: [
          { key: 'code', label: 'SKU', sticky: true, width: 140, className: 't-mono' },
          { key: 'name', label: 'Item', width: 260, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.name), h('div', { className: 't-xs t-muted' }, r.store)) },
          { key: 'category', label: 'Category', width: 180, filter: true },
          { key: 'unit', label: 'Unit', width: 100, filter: true },
          { key: 'stock', label: 'On hand', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num,
            render: (r) => h('span', { className: r.stock === 0 ? 't-danger t-semibold' : r.stock < r.reorderLevel ? 't-warning t-semibold' : '' }, num(r.stock)) },
          { key: 'reorderLevel', label: 'Reorder at', width: 120, align: 'right', numeric: true },
          { key: 'unitPrice', label: 'Unit price', width: 130, align: 'right', numeric: true, render: (r) => money(r.unitPrice) },
          { key: 'value', label: 'Value', width: 140, align: 'right', numeric: true, render: (r) => money(r.value), aggregate: 'sum', format: moneyC },
          { key: 'vendorName', label: 'Vendor', width: 200, hidden: true },
          { key: 'lastPurchase', label: 'Last purchase', width: 140, render: (r) => dt(r.lastPurchase), hidden: true },
          { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['name', 'code', 'category'],
        bulkActions: [
          { label: 'Raise purchase requests', icon: 'clipboard-list', onClick: (sel) => notify({ title: `${sel.length} requests drafted`, tone: 'success' }) },
          { label: 'Print SKU labels', icon: 'print', onClick: (sel) => notify({ title: `${sel.length} labels queued`, tone: 'success' }) },
          { label: 'Deactivate SKUs', icon: 'x-circle', tone: 'danger', onClick: (sel) => confirmDanger('Deactivate these SKUs?', `${sel.length} items will be hidden from new indents.`, () => notify({ title: 'SKUs deactivated', tone: 'success' }), 'Deactivate') },
        ],
        onRowClick: detail,
        rowActions: (r) => [
          { label: 'Open item', icon: 'eye', onClick: () => detail(r) },
          { label: 'Issue stock', icon: 'arrow-up-right', route: 'inventory/stock-out' },
          { label: 'Receive stock', icon: 'arrow-down-right', route: 'inventory/stock-in' },
          { label: 'Purchase request', icon: 'clipboard-list', route: 'inventory/purchase-requests' },
        ],
        emptyState: emptyFor('package', 'No items', 'Add an SKU to start tracking stock.'),
      }));
    },
  },

  /* ----------------------------------------------------- inventory/stock */
  'inventory/stock': {
    title: 'Stock',
    subtitle: 'Live levels with reorder alerts',
    section: 'inventory',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.inventoryItems, ctx).map((i) => ({
        ...i,
        gap: Math.max(0, i.reorderLevel - i.stock),
        suggestedOrder: Math.max(0, i.reorderLevel * 2 - i.stock),
        reorderValue: Math.max(0, i.reorderLevel * 2 - i.stock) * i.unitPrice,
        health: i.stock === 0 ? 'Out of Stock' : i.stock < i.reorderLevel ? 'Low Stock' : i.stock > i.reorderLevel * 4 ? 'Overstocked' : 'In Stock',
      }));
      const alerts = rows.filter((r) => r.health === 'Low Stock' || r.health === 'Out of Stock');

      mount.appendChild(listPage({
        title: 'Stock levels',
        subtitle: `${alerts.length} SKUs at or below the reorder level · ${moneyC(alerts.reduce((a, r) => a + r.reorderValue, 0))} to replenish`,
        route: 'inventory/stock',
        actions: pageActions(
          Button('Stock audit', { variant: 'secondary', icon: 'scan', route: 'inventory/audit' }),
          Button('Raise reorder requests', { variant: 'primary', icon: 'clipboard-list', onClick: () => notify({ title: `${alerts.length} purchase requests drafted`, text: 'They are waiting for approval in the purchase-request queue.', tone: 'success' }) })),
        notes: alerts.length ? Callout({ tone: 'warning', icon: 'alert-triangle', title: `${alerts.length} SKUs need replenishment` },
          'Anything at zero stops a classroom or a lab working today. Anything below the reorder level will run out inside the current indent cycle.') : null,
        kpis: [
          { label: 'SKUs tracked', value: String(rows.length), icon: 'layers', tone: 'brand' },
          { label: 'Healthy', value: String(rows.filter((r) => r.health === 'In Stock').length), icon: 'check-circle', tone: 'success' },
          { label: 'Low stock', value: String(rows.filter((r) => r.health === 'Low Stock').length), icon: 'alert-circle', tone: 'warning' },
          { label: 'Out of stock', value: String(rows.filter((r) => r.health === 'Out of Stock').length), icon: 'x-circle', tone: 'danger' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Item or SKU…', width: '250px' },
          { id: 'health', label: 'Stock health', options: ['In Stock', 'Low Stock', 'Out of Stock', 'Overstocked'] },
          { id: 'category', label: 'Category', options: db.itemCategories.map((c) => c.name) },
          { id: 'store', label: 'Store', options: STORES },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.name} ${r.code}`.toLowerCase().includes(String(x).toLowerCase()),
          health: (r, x) => r.health === x,
          category: (r, x) => r.category === x,
          store: (r, x) => r.store === x,
        })),
        chart: bulletChart({
          items: sortBy(rows, 'value', 'desc').slice(0, 10).map((r) => ({
            label: r.name, value: r.stock, target: r.reorderLevel, ranges: [r.reorderLevel, r.reorderLevel * 2, Math.max(r.stock, r.reorderLevel * 3)],
          })),
          height: 320,
        }),
        chartTitle: 'On-hand stock against reorder level — the ten most valuable SKUs',
        columns: [
          { key: 'code', label: 'SKU', sticky: true, width: 140, className: 't-mono' },
          { key: 'name', label: 'Item', width: 250, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.name), h('div', { className: 't-xs t-muted' }, `${r.category} · ${r.store}`)) },
          { key: 'stock', label: 'On hand', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'reorderLevel', label: 'Reorder at', width: 120, align: 'right', numeric: true },
          { key: 'gap', label: 'Shortfall', width: 120, align: 'right', numeric: true, render: (r) => (r.gap ? h('span', { className: 't-danger t-semibold' }, num(r.gap)) : '—'), aggregate: 'sum', format: num },
          { key: 'level', label: 'Level', width: 180, sortable: false,
            render: (r) => ProgressBar(Math.min(100, Math.round((r.stock / Math.max(1, r.reorderLevel * 2)) * 100)), { tone: r.stock === 0 ? 'danger' : r.stock < r.reorderLevel ? 'warning' : 'success' }) },
          { key: 'suggestedOrder', label: 'Suggested order', width: 150, align: 'right', numeric: true, render: (r) => (r.suggestedOrder ? num(r.suggestedOrder) : '—'), aggregate: 'sum', format: num },
          { key: 'reorderValue', label: 'Order value', width: 140, align: 'right', numeric: true, render: (r) => (r.reorderValue ? money(r.reorderValue) : '—'), aggregate: 'sum', format: moneyC },
          { key: 'value', label: 'Stock value', width: 140, align: 'right', numeric: true, render: (r) => money(r.value), aggregate: 'sum', format: moneyC },
          { key: 'health', label: 'Health', width: 150, filter: true, render: (r) => Badge(r.health === 'Overstocked' ? 'Under Review' : r.health) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['name', 'code'],
        bulkActions: [
          { label: 'Draft purchase requests', icon: 'clipboard-list', onClick: (sel) => notify({ title: `${sel.length} requests drafted`, tone: 'success' }) },
          { label: 'Adjust stock', icon: 'edit', onClick: mockAction('Stock adjustment') },
        ],
        onRowClick: () => navigate('inventory/items'),
        rowActions: () => [
          { label: 'Open item', icon: 'package', route: 'inventory/items' },
          { label: 'Receive stock', icon: 'arrow-down-right', route: 'inventory/stock-in' },
          { label: 'Purchase request', icon: 'clipboard-list', route: 'inventory/purchase-requests' },
        ],
        emptyState: emptyFor('layers', 'No stock tracked', 'Add SKUs to the item master to see live levels here.'),
      }));
    },
  },

  /* -------------------------------------------------- inventory/stock-in */
  'inventory/stock-in': {
    title: 'Stock In',
    subtitle: 'Goods received into the stores',
    section: 'inventory',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.stockMovements.filter((m) => m.type === 'Stock In'), ctx).map((m) => {
        const item = byId(db.inventoryItems, m.itemId) || {};
        return { ...m, unit: item.unit || 'Piece', unitPrice: item.unitPrice || 0, value: (item.unitPrice || 0) * m.quantity, store: item.store || 'Main Store' };
      });

      mount.appendChild(listPage({
        title: 'Stock in',
        subtitle: `${rows.length} receipts · ${moneyC(rows.reduce((a, r) => a + r.value, 0))} received`,
        route: 'inventory/stock-in',
        actions: pageActions(
          Button('Open GRN', { variant: 'secondary', icon: 'check-circle', route: 'inventory/grn' }),
          Button('Receive stock', { variant: 'primary', icon: 'arrow-down-right', onClick: () => Modal({
            title: 'Receive stock into the store', size: 'lg', icon: 'arrow-down-right',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Item', required: true, className: 'col-span-full' },
                Combobox({ options: db.inventoryItems.map((i) => ({ value: i.id, label: `${i.name} · ${i.code}` })), placeholder: 'Search the SKU master…' })),
              Field({ label: 'Quantity', required: true }, Input({ type: 'number', placeholder: '50' })),
              Field({ label: 'Date' }, DatePicker({ value: TODAY })),
              Field({ label: 'Purchase order' }, Combobox({ options: db.purchaseOrders.slice(0, 120).map((p) => ({ value: p.id, label: p.poNumber })) })),
              Field({ label: 'Store' }, Select({ options: STORES })),
              Field({ label: 'Condition on arrival' }, Select({ options: ['Good', 'Partially damaged', 'Rejected'], value: 'Good' })),
              Field({ label: 'Remarks', className: 'col-span-full' }, Textarea({ rows: 2, placeholder: 'Two cartons short; supplier informed.' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Receive', { variant: 'primary', icon: 'check', onClick: () => { close(); saved('Receipt'); } })),
          }) })),
        kpis: [
          { label: 'Receipts', value: String(rows.length), icon: 'arrow-down-right', tone: 'brand' },
          { label: 'Units received', value: num(rows.reduce((a, r) => a + r.quantity, 0)), icon: 'package', tone: 'info' },
          { label: 'Value received', value: moneyC(rows.reduce((a, r) => a + r.value, 0)), icon: 'rupee', tone: 'success' },
          { label: 'Against a PO', value: String(rows.filter((r) => String(r.reference).startsWith('PO')).length), icon: 'shopping-cart', tone: 'warning' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Item or reference…', width: '250px' },
          { id: 'category', label: 'Category', options: db.itemCategories.map((c) => c.name) },
          { id: 'store', label: 'Store', options: STORES },
          { id: 'date', label: 'Date', type: 'date' },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.itemName} ${r.reference}`.toLowerCase().includes(String(x).toLowerCase()),
          category: (r, x) => r.category === x,
          store: (r, x) => r.store === x,
          date: (r, x) => r.date === x,
        })),
        chart: areaChart({
          categories: Array.from(groupBy(rows, (r) => formatDate(r.date, 'monthYear')).keys()),
          series: [{ name: 'Value received', values: Array.from(groupBy(rows, (r) => formatDate(r.date, 'monthYear')).values()).map((l) => l.reduce((a, r) => a + r.value, 0)) }],
          valueFormat: 'currencyCompact', height: 250,
        }),
        chartTitle: 'Goods received by month',
        columns: movementCols([
          { key: 'unit', label: 'Unit', width: 100 },
          { key: 'value', label: 'Value', width: 140, align: 'right', numeric: true, render: (r) => money(r.value), aggregate: 'sum', format: moneyC },
          { key: 'store', label: 'Store', width: 150, filter: true },
        ]),
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['itemName', 'reference'],
        bulkActions: stdBulk('receipts'),
        rowActions: () => [
          { label: 'Open item', icon: 'package', route: 'inventory/items' },
          { label: 'Matching GRN', icon: 'check-circle', route: 'inventory/grn' },
        ],
        emptyState: emptyFor('arrow-down-right', 'Nothing received', 'Receive stock against a purchase order to populate this register.'),
      }));
    },
  },

  /* ------------------------------------------------- inventory/stock-out */
  'inventory/stock-out': {
    title: 'Stock Out / Issue',
    subtitle: 'Issues to departments, labs and classrooms',
    section: 'inventory',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.stockMovements.filter((m) => m.type === 'Issue'), ctx).map((m) => {
        const item = byId(db.inventoryItems, m.itemId) || {};
        return { ...m, unit: item.unit || 'Piece', value: (item.unitPrice || 0) * m.quantity, store: item.store || 'Main Store' };
      });

      mount.appendChild(listPage({
        title: 'Stock out / issue',
        subtitle: `${rows.length} issue slips · ${moneyC(rows.reduce((a, r) => a + r.value, 0))} consumed`,
        route: 'inventory/stock-out',
        actions: pageActions(
          Button('Returns register', { variant: 'secondary', icon: 'refresh-ccw', route: 'inventory/returns' }),
          Button('Issue stock', { variant: 'primary', icon: 'arrow-up-right', onClick: () => Modal({
            title: 'Issue stock', size: 'lg', icon: 'arrow-up-right',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Item', required: true, className: 'col-span-full' },
                Combobox({ options: db.inventoryItems.filter((i) => i.stock > 0).map((i) => ({ value: i.id, label: `${i.name} · ${num(i.stock)} in stock` })) })),
              Field({ label: 'Quantity', required: true }, Input({ type: 'number', placeholder: '10' })),
              Field({ label: 'Issue to', required: true }, Select({ options: ['Administration', 'Science', 'Mathematics', 'Sports', 'IT', 'Housekeeping', 'Library', 'Mess', 'Transport'] })),
              Field({ label: 'Requested by' }, Input({ placeholder: 'Name of the requester' })),
              Field({ label: 'Date' }, DatePicker({ value: TODAY })),
              Field({ label: 'Returnable' }, Switch('Must be returned to the store', {})),
              Field({ label: 'Purpose', className: 'col-span-full' }, Textarea({ rows: 2, placeholder: 'Class X practical batch — chemistry lab.' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Issue', { variant: 'primary', icon: 'check', onClick: () => { close(); saved('Issue slip'); } })),
          }) })),
        kpis: [
          { label: 'Issue slips', value: String(rows.length), icon: 'arrow-up-right', tone: 'brand' },
          { label: 'Units issued', value: num(rows.reduce((a, r) => a + r.quantity, 0)), icon: 'package', tone: 'info' },
          { label: 'Consumption value', value: moneyC(rows.reduce((a, r) => a + r.value, 0)), icon: 'rupee', tone: 'warning' },
          { label: 'Departments served', value: String(new Set(rows.map((r) => r.issuedTo)).size), icon: 'building', tone: 'success' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Item or reference…', width: '250px' },
          { id: 'issuedTo', label: 'Department', options: Array.from(new Set(rows.map((r) => r.issuedTo).filter(Boolean))).sort() },
          { id: 'category', label: 'Category', options: db.itemCategories.map((c) => c.name) },
          { id: 'date', label: 'Date', type: 'date' },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.itemName} ${r.reference}`.toLowerCase().includes(String(x).toLowerCase()),
          issuedTo: (r, x) => r.issuedTo === x,
          category: (r, x) => r.category === x,
          date: (r, x) => r.date === x,
        })),
        chart: barChart({
          categories: sumBy(rows, 'issuedTo', 'quantity').slice(0, 12).map((c) => c.key),
          series: [{ name: 'Units issued', values: sumBy(rows, 'issuedTo', 'quantity').slice(0, 12).map((c) => c.value) }],
          horizontal: true, height: 300, showValues: true,
        }),
        chartTitle: 'Consumption by department',
        columns: movementCols([
          { key: 'issuedTo', label: 'Issued to', width: 180, filter: true },
          { key: 'value', label: 'Value', width: 140, align: 'right', numeric: true, render: (r) => money(r.value), aggregate: 'sum', format: moneyC },
        ]),
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['itemName', 'reference', 'issuedTo'],
        bulkActions: stdBulk('issues'),
        rowActions: () => [
          { label: 'Open item', icon: 'package', route: 'inventory/items' },
          { label: 'Record a return', icon: 'refresh-ccw', route: 'inventory/returns' },
        ],
        emptyState: emptyFor('arrow-up-right', 'Nothing issued', 'Issue stock to a department to start the consumption register.'),
      }));
    },
  },

  /* ------------------------------------------ inventory/purchase-requests */
  'inventory/purchase-requests': {
    title: 'Purchase Requests',
    subtitle: 'Indents waiting for approval before a PO is cut',
    section: 'inventory',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(purchaseRequests(), ctx);

      mount.appendChild(approvalQueuePage({
        title: 'Purchase requests',
        subtitle: `${rows.length} indents · ${rows.filter((r) => r.status === 'Pending').length} awaiting approval · ${moneyC(rows.filter((r) => r.status === 'Pending').reduce((a, r) => a + r.estimatedValue, 0))} at stake`,
        route: 'inventory/purchase-requests',
        kpis: [
          { label: 'Requests', value: String(rows.length), icon: 'clipboard-list', tone: 'brand' },
          { label: 'Pending', value: String(rows.filter((r) => r.status === 'Pending').length), icon: 'inbox', tone: 'warning' },
          { label: 'Approved', value: String(rows.filter((r) => r.status === 'Approved').length), icon: 'check-circle', tone: 'success' },
          { label: 'Estimated value', value: moneyC(rows.reduce((a, r) => a + r.estimatedValue, 0)), icon: 'rupee', tone: 'info' },
        ],
        tabs: [
          { id: 'all', label: 'All requests', count: rows.length },
          { id: 'pending', label: 'Pending', count: rows.filter((r) => r.status === 'Pending').length },
          { id: 'approved', label: 'Approved', count: rows.filter((r) => r.status === 'Approved').length },
        ],
        activeTab: 'all',
        onTabChange: (id) => notify({ title: `Showing ${id}`, tone: 'info' }),
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Request no or item…', width: '250px' },
          { id: 'priority', label: 'Priority', options: ['Low', 'Normal', 'High'] },
          { id: 'department', label: 'Department', options: ['Administration', 'Science', 'Sports', 'IT', 'Housekeeping', 'Mess'] },
          { id: 'status', label: 'Status', options: ['Pending', 'Approved', 'Rejected', 'Converted to PO'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.prNo} ${r.itemName}`.toLowerCase().includes(String(x).toLowerCase()),
          priority: (r, x) => r.priority === x,
          department: (r, x) => r.department === x,
          status: (r, x) => r.status === x,
        })),
        columns: [
          { key: 'prNo', label: 'Request', sticky: true, width: 160, className: 't-mono' },
          { key: 'itemName', label: 'Item', width: 250, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.itemName), h('div', { className: 't-xs t-muted' }, `${r.category} · ${r.store}`)) },
          { key: 'quantity', label: 'Qty', width: 100, align: 'right', numeric: true, render: (r) => `${num(r.quantity)} ${r.unit}`, value: (r) => r.quantity },
          { key: 'estimatedValue', label: 'Est. value', width: 140, align: 'right', numeric: true, render: (r) => money(r.estimatedValue), aggregate: 'sum', format: moneyC },
          { key: 'department', label: 'Department', width: 160, filter: true },
          { key: 'requestedBy', label: 'Requested by', width: 170 },
          { key: 'requestedOn', label: 'Raised', width: 130, render: (r) => dt(r.requestedOn) },
          { key: 'neededBy', label: 'Needed by', width: 130, render: (r) => dt(r.neededBy) },
          { key: 'priority', label: 'Priority', width: 120, filter: true, render: (r) => Badge(r.priority === 'High' ? 'Overdue' : r.priority === 'Low' ? 'New' : 'Pending', { tone: r.priority === 'High' ? 'danger' : r.priority === 'Low' ? 'info' : 'warning', icon: 'flag' }) },
          { key: 'status', label: 'Status', width: 160, filter: true, render: (r) => Badge(r.status) },
        ],
        rows,
        onApprove: (r) => notify({ title: 'Request approved', text: `${r.prNo} · ${r.itemName}`, tone: 'success' }),
        onReject: (r) => notify({ title: 'Request rejected', text: r.prNo, tone: 'danger' }),
        detail: (r) => {
          const item = byId(db.inventoryItems, r.itemId) || {};
          return h('div', { className: 'stack-3' },
            profileHeader({
              name: r.itemName, size: 'lg', initials: initials(r.itemName, 2),
              subtitle: `${r.prNo} · ${r.category} · ${r.store}`,
              badges: [Badge(r.status), Badge(r.priority, { tone: r.priority === 'High' ? 'danger' : 'neutral' })],
              meta: [
                { label: 'Quantity', value: `${num(r.quantity)} ${r.unit}`, icon: 'package' },
                { label: 'Estimated', value: money(r.estimatedValue), icon: 'rupee' },
                { label: 'Needed by', value: dt(r.neededBy), icon: 'calendar' },
                { label: 'Department', value: r.department, icon: 'building' },
              ],
            }),
            SectionCard({ title: 'Justification', icon: 'file-text' }, h('div', { className: 't-sm' }, r.justification)),
            SectionCard({ title: 'Current stock position', icon: 'layers' },
              h('div', { className: 'stack-2' },
                kv([
                  ['On hand', `${num(item.stock || 0)} ${r.unit}`],
                  ['Reorder level', `${num(item.reorderLevel || 0)} ${r.unit}`],
                  ['Unit price', money(r.estimatedRate)],
                  ['Preferred vendor', (byId(db.vendors, r.vendorId) || {}).name || '—'],
                ]),
                ProgressBar(Math.min(100, Math.round(((item.stock || 0) / Math.max(1, (item.reorderLevel || 1) * 2)) * 100)),
                  { tone: (item.stock || 0) === 0 ? 'danger' : 'warning', label: 'Stock against twice the reorder level' }))),
            SectionCard({ title: 'Approval trail', icon: 'workflow' },
              ApprovalTrail([
                { label: 'Raised by store', by: r.requestedBy, date: dt(r.requestedOn), state: 'done', note: r.justification },
                { label: 'Head of department', by: r.department, date: dt(r.requestedOn), state: r.status === 'Pending' ? 'current' : r.status === 'Rejected' ? 'rejected' : 'done' },
                { label: 'Accounts sanction', by: 'Accounts', date: '—', state: r.status === 'Converted to PO' ? 'done' : 'todo' },
                { label: 'Purchase order', by: 'Purchase', date: '—', state: r.status === 'Converted to PO' ? 'done' : 'todo' },
              ])));
        },
      }));
    },
  },

  /* -------------------------------------------- inventory/purchase-orders */
  'inventory/purchase-orders': {
    title: 'Purchase Orders',
    subtitle: 'Orders placed on vendors and their receipt status',
    section: 'inventory',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.purchaseOrders, ctx).map((p) => ({
        ...p,
        pendingDays: daysFromToday(p.expectedDate),
        receiptStatus: p.grnReceived ? 'Received' : daysFromToday(p.expectedDate) < 0 ? 'Overdue' : 'Awaited',
      }));

      mount.appendChild(listPage({
        title: 'Purchase orders',
        subtitle: `${rows.length} orders · ${moneyC(rows.reduce((a, r) => a + r.total, 0))} committed`,
        route: 'inventory/purchase-orders',
        actions: pageActions(
          Button('Goods receipt', { variant: 'secondary', icon: 'check-circle', route: 'inventory/grn' }),
          Button('Raise a PO', { variant: 'primary', icon: 'shopping-cart', onClick: () => Modal({
            title: 'Raise a purchase order', size: 'lg', icon: 'shopping-cart',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Vendor', required: true, className: 'col-span-full' }, Combobox({ options: db.vendors.map((v) => ({ value: v.id, label: `${v.name} · ${v.category}` })) })),
              Field({ label: 'Against request' }, Combobox({ options: purchaseRequests().filter((p) => p.status === 'Approved').slice(0, 100).map((p) => ({ value: p.id, label: `${p.prNo} · ${p.itemName}` })) })),
              Field({ label: 'Department' }, Select({ options: ['Administration', 'Science', 'Sports', 'IT', 'Housekeeping', 'Mess'] })),
              Field({ label: 'Order date' }, DatePicker({ value: TODAY })),
              Field({ label: 'Expected delivery' }, DatePicker({})),
              Field({ label: 'Quantity' }, Input({ type: 'number', placeholder: '100' })),
              Field({ label: 'Rate (₹)' }, Input({ type: 'number', placeholder: '450' })),
              Field({ label: 'GST (%)' }, Select({ options: ['0', '5', '12', '18', '28'], value: '18' })),
              Field({ label: 'Terms', className: 'col-span-full' }, Textarea({ rows: 2, value: 'Delivery at the main store. Payment 30 days from a clean GRN.' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Raise PO', { variant: 'primary', onClick: () => { close(); saved('Purchase order'); } })),
          }) })),
        kpis: [
          { label: 'Orders', value: String(rows.length), icon: 'shopping-cart', tone: 'brand' },
          { label: 'Committed value', value: moneyC(rows.reduce((a, r) => a + r.total, 0)), icon: 'rupee', tone: 'info' },
          { label: 'Awaiting delivery', value: String(rows.filter((r) => r.receiptStatus === 'Awaited').length), icon: 'truck', tone: 'warning' },
          { label: 'Overdue', value: String(rows.filter((r) => r.receiptStatus === 'Overdue').length), icon: 'alert-triangle', tone: 'danger' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'PO number or vendor…', width: '250px' },
          { id: 'status', label: 'Status', options: Array.from(new Set(rows.map((r) => r.status))) },
          { id: 'receiptStatus', label: 'Receipt', options: ['Received', 'Awaited', 'Overdue'] },
          { id: 'department', label: 'Department', options: Array.from(new Set(rows.map((r) => r.department))) },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.poNumber} ${r.vendorName}`.toLowerCase().includes(String(x).toLowerCase()),
          status: (r, x) => r.status === x,
          receiptStatus: (r, x) => r.receiptStatus === x,
          department: (r, x) => r.department === x,
        })),
        chart: comboChart({
          categories: Array.from(groupBy(rows, (r) => formatDate(r.date, 'monthYear')).keys()),
          bars: [{ name: 'Order value', values: Array.from(groupBy(rows, (r) => formatDate(r.date, 'monthYear')).values()).map((l) => l.reduce((a, r) => a + r.total, 0)) }],
          line: { name: 'Orders × 10,000', values: Array.from(groupBy(rows, (r) => formatDate(r.date, 'monthYear')).values()).map((l) => l.length * 10000) },
          valueFormat: 'currencyCompact', height: 270,
        }),
        chartTitle: 'Purchase order value by month',
        columns: [
          { key: 'poNumber', label: 'PO', sticky: true, width: 170, className: 't-mono' },
          { key: 'vendorName', label: 'Vendor', width: 230, render: (r) => Identity(r.vendorName, r.department) },
          { key: 'date', label: 'Raised', width: 130, render: (r) => dt(r.date) },
          { key: 'expectedDate', label: 'Expected', width: 130, render: (r) => dt(r.expectedDate) },
          { key: 'items', label: 'Lines', width: 90, align: 'right', numeric: true },
          { key: 'quantity', label: 'Qty', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'subtotal', label: 'Subtotal', width: 140, align: 'right', numeric: true, render: (r) => money(r.subtotal), aggregate: 'sum', format: moneyC },
          { key: 'gst', label: 'GST', width: 120, align: 'right', numeric: true, render: (r) => money(r.gst), aggregate: 'sum', format: moneyC },
          { key: 'total', label: 'Total', width: 150, align: 'right', numeric: true, render: (r) => h('span', { className: 't-semibold' }, money(r.total)), aggregate: 'sum', format: moneyC },
          { key: 'receiptStatus', label: 'Receipt', width: 130, filter: true, render: (r) => Badge(r.receiptStatus === 'Received' ? 'Completed' : r.receiptStatus === 'Awaited' ? 'Pending' : 'Overdue') },
          { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['poNumber', 'vendorName'],
        bulkActions: [
          { label: 'Email vendors', icon: 'mail', onClick: (sel) => notify({ title: `${sel.length} vendors emailed`, tone: 'success' }) },
          { label: 'Mark received', icon: 'check-circle', onClick: (sel) => notify({ title: `${sel.length} orders marked received`, tone: 'success' }) },
          { label: 'Cancel orders', icon: 'x-circle', tone: 'danger', onClick: (sel) => confirmDanger('Cancel these orders?', `${sel.length} orders totalling ${moneyC(sel.reduce((a, r) => a + r.total, 0))} will be withdrawn.`, () => notify({ title: 'Orders cancelled', tone: 'warning' }), 'Cancel orders') },
        ],
        rowActions: (r) => [
          { label: 'Print PO', icon: 'print', onClick: mockAction('Print purchase order') },
          { label: 'Record GRN', icon: 'check-circle', route: 'inventory/grn' },
          { label: 'Vendor', icon: 'truck', route: 'inventory/vendors' },
        ],
        emptyState: emptyFor('shopping-cart', 'No purchase orders', 'Approve a purchase request and convert it into an order.'),
      }));
    },
  },

  /* ------------------------------------------------------- inventory/grn */
  'inventory/grn': {
    title: 'Goods Receipt (GRN)',
    subtitle: 'What actually arrived against each purchase order',
    section: 'inventory',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(grns(), ctx);

      mount.appendChild(listPage({
        title: 'Goods receipt notes',
        subtitle: `${rows.length} GRNs · ${rows.filter((r) => r.status === 'Partially Received').length} with a short or rejected quantity`,
        route: 'inventory/grn',
        actions: pageActions(
          Button('Purchase orders', { variant: 'secondary', icon: 'shopping-cart', route: 'inventory/purchase-orders' }),
          Button('Record a GRN', { variant: 'primary', icon: 'check-circle', onClick: () => Modal({
            title: 'Record a goods receipt', size: 'lg', icon: 'check-circle',
            body: h('div', { className: 'stack-3' },
              FormGrid({ cols: 2 },
                Field({ label: 'Purchase order', required: true, className: 'col-span-full' },
                  Combobox({ options: db.purchaseOrders.slice(0, 150).map((p) => ({ value: p.id, label: `${p.poNumber} · ${p.vendorName}` })) })),
                Field({ label: 'Received on', required: true }, DatePicker({ value: TODAY })),
                Field({ label: 'Invoice no' }, Input({ placeholder: 'INV/26-27/0142' })),
                Field({ label: 'Quantity received' }, Input({ type: 'number', placeholder: '100' })),
                Field({ label: 'Quantity rejected' }, Input({ type: 'number', value: '0' })),
                Field({ label: 'Inspected by' }, Select({ options: ['Store Keeper', 'Purchase Officer', 'Lab In-charge', 'IT Administrator'] })),
                Field({ label: 'QC result' }, Select({ options: ['Passed', 'Rejected items returned', 'Conditional acceptance'] }))),
              FileUpload({ label: 'Attach the delivery challan and invoice', hint: 'PDF or image' })),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Record GRN', { variant: 'primary', onClick: () => { close(); saved('GRN'); } })),
          }) })),
        kpis: [
          { label: 'GRNs', value: String(rows.length), icon: 'check-circle', tone: 'brand' },
          { label: 'Clean receipts', value: String(rows.filter((r) => r.status === 'Received').length), icon: 'shield-check', tone: 'success' },
          { label: 'Short supplied', value: num(rows.reduce((a, r) => a + r.shortQty, 0)), icon: 'alert-circle', tone: 'warning' },
          { label: 'Rejected units', value: num(rows.reduce((a, r) => a + r.rejectedQty, 0)), icon: 'x-circle', tone: 'danger' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'GRN, PO or vendor…', width: '250px' },
          { id: 'status', label: 'Status', options: ['Received', 'Partially Received'] },
          { id: 'qcResult', label: 'QC', options: ['Passed', 'Rejected items returned'] },
          { id: 'campus', label: 'Campus', options: campusOptions() },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.grnNo} ${r.poNumber} ${r.vendorName}`.toLowerCase().includes(String(x).toLowerCase()),
          status: (r, x) => r.status === x,
          qcResult: (r, x) => r.qcResult === x,
          campus: (r, x) => r.campusId === x,
        })),
        chart: funnelChart({
          stages: [
            { label: 'Ordered', value: rows.reduce((a, r) => a + r.orderedQty, 0) },
            { label: 'Received', value: rows.reduce((a, r) => a + r.receivedQty, 0) },
            { label: 'Accepted', value: rows.reduce((a, r) => a + r.acceptedQty, 0) },
          ],
          showConversion: true, height: 260,
        }),
        chartTitle: 'Ordered → received → accepted',
        columns: [
          { key: 'grnNo', label: 'GRN', sticky: true, width: 170, className: 't-mono' },
          { key: 'poNumber', label: 'PO', width: 170, className: 't-mono' },
          { key: 'vendorName', label: 'Vendor', width: 220 },
          { key: 'receivedOn', label: 'Received', width: 130, render: (r) => dt(r.receivedOn) },
          { key: 'orderedQty', label: 'Ordered', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'receivedQty', label: 'Received', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'shortQty', label: 'Short', width: 100, align: 'right', numeric: true, render: (r) => (r.shortQty ? h('span', { className: 't-warning t-semibold' }, num(r.shortQty)) : '—'), aggregate: 'sum', format: num },
          { key: 'rejectedQty', label: 'Rejected', width: 110, align: 'right', numeric: true, render: (r) => (r.rejectedQty ? h('span', { className: 't-danger t-semibold' }, num(r.rejectedQty)) : '—'), aggregate: 'sum', format: num },
          { key: 'value', label: 'Value', width: 140, align: 'right', numeric: true, render: (r) => money(r.value), aggregate: 'sum', format: moneyC },
          { key: 'inspectedBy', label: 'Inspected by', width: 170, filter: true },
          { key: 'qcResult', label: 'QC', width: 200, filter: true, render: (r) => Badge(r.qcResult === 'Passed' ? 'Verified' : 'Rejected') },
          { key: 'status', label: 'Status', width: 170, filter: true, render: (r) => Badge(r.status === 'Received' ? 'Completed' : 'Partial') },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['grnNo', 'poNumber', 'vendorName'],
        expandable: (r) => Card({ pad: true },
          h('div', { className: 'stack-3' },
            Stepper([
              { label: 'PO raised', description: r.poNumber, state: 'done' },
              { label: 'Delivered', description: dt(r.receivedOn), state: 'done' },
              { label: 'Inspected', description: r.inspectedBy, state: 'done' },
              { label: 'Posted to stock', description: r.status === 'Received' ? 'Full quantity' : `${num(r.acceptedQty)} of ${num(r.orderedQty)}`, state: r.status === 'Received' ? 'done' : 'current' },
            ], { current: r.status === 'Received' ? 4 : 3 }),
            h('div', { className: 'row-3 row-wrap' },
              Badge(`Invoice ${r.invoiceNo}`, { tone: 'neutral' }),
              Badge(r.qcResult, { tone: r.qcResult === 'Passed' ? 'success' : 'danger' }),
              Badge(money(r.value), { tone: 'info' })))),
        bulkActions: [
          { label: 'Post to stock', icon: 'layers', onClick: (sel) => notify({ title: `${sel.length} GRNs posted`, tone: 'success' }) },
          { label: 'Send to accounts', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} GRNs sent for payment`, tone: 'success' }) },
        ],
        rowActions: () => [
          { label: 'Open PO', icon: 'shopping-cart', route: 'inventory/purchase-orders' },
          { label: 'Return rejected items', icon: 'refresh-ccw', route: 'inventory/returns' },
          { label: 'Print GRN', icon: 'print', onClick: mockAction('Print GRN') },
        ],
        emptyState: emptyFor('check-circle', 'No goods receipts', 'Record a GRN when a delivery arrives against a purchase order.'),
      }));
    },
  },

  /* --------------------------------------------------- inventory/vendors */
  'inventory/vendors': {
    title: 'Vendors',
    subtitle: 'Supplier directory, performance and outstanding',
    section: 'inventory',
    render(mount) {
      ensureStyles();
      const rows = db.vendors.map((v) => {
        const pos = db.purchaseOrders.filter((p) => p.vendorId === v.id);
        const g = grns().filter((x) => x.vendorId === v.id);
        const shortRate = g.length ? Number(((g.filter((x) => x.shortQty > 0).length / g.length) * 100).toFixed(1)) : 0;
        return {
          ...v,
          openOrders: pos.filter((p) => !p.grnReceived).length,
          orderValue: pos.reduce((a, p) => a + p.total, 0),
          shortRate,
          reliability: shortRate === 0 ? 'Reliable' : shortRate < 20 ? 'Watch' : 'Poor',
        };
      });

      mount.appendChild(listPage({
        title: 'Vendors',
        subtitle: `${rows.length} suppliers · ${moneyC(rows.reduce((a, r) => a + r.outstanding, 0))} outstanding`,
        route: 'inventory/vendors',
        actions: pageActions(
          Button('Finance view', { variant: 'secondary', icon: 'banknote', route: 'finance/vendors' }),
          Button('Onboard a vendor', { variant: 'primary', icon: 'plus', onClick: () => Modal({
            title: 'Onboard a vendor', size: 'lg', icon: 'truck',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Vendor name', required: true, className: 'col-span-full' }, Input({ placeholder: 'e.g. Sharma Stationers Pvt Ltd' })),
              Field({ label: 'Category', required: true }, Select({ options: Array.from(new Set(db.vendors.map((v) => v.category))) })),
              Field({ label: 'Contact person' }, Input({ placeholder: 'Name' })),
              Field({ label: 'Phone', required: true }, Input({ placeholder: '+91 98xxx xxxxx' })),
              Field({ label: 'Email' }, Input({ type: 'email', placeholder: 'sales@vendor.co.in' })),
              Field({ label: 'GSTIN' }, Input({ placeholder: '06AABCS1429B1Z1' })),
              Field({ label: 'Payment terms' }, Select({ options: ['Advance', 'Net 15', 'Net 30', 'Net 45'] })),
              Field({ label: 'Address', className: 'col-span-full' }, Textarea({ rows: 2 }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Onboard', { variant: 'primary', onClick: () => { close(); saved('Vendor'); } })),
          }) })),
        kpis: [
          { label: 'Vendors', value: String(rows.length), icon: 'truck', tone: 'brand' },
          { label: 'Order value', value: moneyC(rows.reduce((a, r) => a + r.orderValue, 0)), icon: 'shopping-cart', tone: 'info' },
          { label: 'Outstanding', value: moneyC(rows.reduce((a, r) => a + r.outstanding, 0)), icon: 'rupee', tone: 'danger' },
          { label: 'Under watch', value: String(rows.filter((r) => r.reliability !== 'Reliable').length), icon: 'alert-circle', tone: 'warning' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Vendor, GSTIN or contact…', width: '250px' },
          { id: 'category', label: 'Category', options: Array.from(new Set(db.vendors.map((v) => v.category))) },
          { id: 'status', label: 'Status', options: Array.from(new Set(db.vendors.map((v) => v.status))) },
          { id: 'reliability', label: 'Reliability', options: ['Reliable', 'Watch', 'Poor'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.name} ${r.gstin} ${r.contactPerson}`.toLowerCase().includes(String(x).toLowerCase()),
          category: (r, x) => r.category === x,
          status: (r, x) => r.status === x,
          reliability: (r, x) => r.reliability === x,
        })),
        chart: barChart({
          categories: sortBy(rows, 'orderValue', 'desc').slice(0, 10).map((r) => r.name),
          series: [{ name: 'Order value', values: sortBy(rows, 'orderValue', 'desc').slice(0, 10).map((r) => r.orderValue) }],
          horizontal: true, height: 300, valueFormat: 'currencyCompact', showValues: true,
        }),
        chartTitle: 'Spend concentration by vendor',
        columns: [
          { key: 'name', label: 'Vendor', sticky: true, width: 250, render: (r) => Identity(r.name, `${r.category} · ${r.contactPerson}`) },
          { key: 'phone', label: 'Phone', width: 150, className: 't-mono' },
          { key: 'gstin', label: 'GSTIN', width: 180, className: 't-mono', hidden: true },
          { key: 'paymentTerms', label: 'Terms', width: 120, filter: true },
          { key: 'totalOrders', label: 'Orders', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'openOrders', label: 'Open', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'orderValue', label: 'Order value', width: 150, align: 'right', numeric: true, render: (r) => money(r.orderValue), aggregate: 'sum', format: moneyC },
          { key: 'outstanding', label: 'Outstanding', width: 150, align: 'right', numeric: true, render: (r) => (r.outstanding ? h('span', { className: 't-danger t-semibold' }, money(r.outstanding)) : '—'), aggregate: 'sum', format: moneyC },
          { key: 'rating', label: 'Rating', width: 140, render: (r) => Rating(r.rating, { showValue: true }) },
          { key: 'shortRate', label: 'Short supply', width: 130, align: 'right', numeric: true, render: (r) => `${r.shortRate}%`, aggregate: 'avg', format: (v) => `${v.toFixed(1)}%` },
          { key: 'status', label: 'Status', width: 120, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['name', 'category', 'contactPerson', 'gstin'],
        bulkActions: [
          { label: 'Request quotations', icon: 'mail', onClick: (sel) => notify({ title: `RFQ sent to ${sel.length} vendors`, tone: 'success' }) },
          { label: 'Blacklist', icon: 'x-circle', tone: 'danger', onClick: (sel) => confirmDanger('Blacklist these vendors?', `${sel.length} vendors will be blocked from new purchase orders.`, () => notify({ title: 'Vendors blacklisted', tone: 'warning' }), 'Blacklist') },
        ],
        onRowClick: (r) => openDrawer(r.name, `${r.category} · onboarded ${formatDate(r.onboardedOn, 'medium')}`,
          h('div', { className: 'stack-3' },
            h('div', { className: 'row-3 row-wrap' }, Badge(r.status), Badge(r.paymentTerms, { tone: 'info' }), Badge(r.reliability === 'Reliable' ? 'Verified' : 'Under Review', { tone: r.reliability === 'Reliable' ? 'success' : 'warning' })),
            kv([
              ['Contact', r.contactPerson],
              ['Phone', r.phone],
              ['Email', r.email],
              ['GSTIN', r.gstin],
              ['Address', r.address],
              ['Orders placed', num(r.totalOrders)],
              ['Lifetime value', money(r.totalValue)],
              ['Outstanding', money(r.outstanding)],
            ]),
            SectionCard({ title: 'Recent purchase orders', flush: true },
              DataTable({
                rows: db.purchaseOrders.filter((p) => p.vendorId === r.id),
                pageSize: 8, searchable: false, exportable: false, columnToggle: false,
                columns: [
                  { key: 'poNumber', label: 'PO', className: 't-mono' },
                  { key: 'date', label: 'Raised', width: 120, render: (p) => dt(p.date) },
                  { key: 'total', label: 'Total', width: 130, align: 'right', numeric: true, render: (p) => money(p.total) },
                  { key: 'status', label: 'Status', width: 130, render: (p) => Badge(p.status) },
                ],
                emptyState: emptyFor('shopping-cart', 'No orders yet', 'This vendor has not been issued a purchase order.'),
              }))),
          (close) => frag(
            Button('Call', { variant: 'secondary', icon: 'phone', onClick: () => notify({ title: 'Dialling', text: r.phone, tone: 'info' }) }),
            Button('Raise a PO', { variant: 'primary', icon: 'shopping-cart', onClick: () => { close(); navigate('inventory/purchase-orders'); } }))),
        rowActions: () => [
          { label: 'Purchase orders', icon: 'shopping-cart', route: 'inventory/purchase-orders' },
          { label: 'Goods receipts', icon: 'check-circle', route: 'inventory/grn' },
        ],
        emptyState: emptyFor('truck', 'No vendors', 'Onboard a supplier before raising a purchase order.'),
      }));
    },
  },

  /* --------------------------------------------------- inventory/returns */
  'inventory/returns': {
    title: 'Returns',
    subtitle: 'Stock returned to the store or back to the vendor',
    section: 'inventory',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.stockMovements.filter((m) => m.type === 'Return'), ctx).map((m, i) => {
        const item = byId(db.inventoryItems, m.itemId) || {};
        const toVendor = boolOf('rv' + m.id, 40);
        return {
          ...m,
          returnNo: `RT/26-27/${String(i + 1).padStart(4, '0')}`,
          unit: item.unit || 'Piece',
          value: (item.unitPrice || 0) * m.quantity,
          direction: toVendor ? 'To Vendor' : 'To Store',
          vendorName: toVendor ? ((byId(db.vendors, item.vendorId) || {}).name || '—') : '—',
          reason: pickOf(['Excess issued, not consumed', 'Wrong specification supplied', 'Damaged in transit', 'Event over — equipment returned', 'Faulty on first use'], 'rr' + m.id),
          condition: pickOf(['Good', 'Good', 'Fair', 'Damaged'], 'rc' + m.id),
          status: pickOf(['Accepted', 'Accepted', 'Pending', 'Rejected'], 'rs' + m.id),
        };
      });

      mount.appendChild(listPage({
        title: 'Returns',
        subtitle: `${rows.length} returns · ${moneyC(rows.reduce((a, r) => a + r.value, 0))} credited back`,
        route: 'inventory/returns',
        actions: pageActions(
          Button('Damaged stock', { variant: 'secondary', icon: 'alert-triangle', route: 'inventory/damaged' }),
          Button('Record a return', { variant: 'primary', icon: 'refresh-ccw', onClick: () => Modal({
            title: 'Record a return', size: 'lg', icon: 'refresh-ccw',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Item', required: true, className: 'col-span-full' }, Combobox({ options: db.inventoryItems.map((i) => ({ value: i.id, label: `${i.name} · ${i.code}` })) })),
              Field({ label: 'Quantity', required: true }, Input({ type: 'number', placeholder: '5' })),
              Field({ label: 'Direction' }, Select({ options: ['To Store', 'To Vendor'], value: 'To Store' })),
              Field({ label: 'Returned by' }, Input({ placeholder: 'Department or vendor' })),
              Field({ label: 'Condition' }, Select({ options: ['Good', 'Fair', 'Damaged'] })),
              Field({ label: 'Date' }, DatePicker({ value: TODAY })),
              Field({ label: 'Reason', className: 'col-span-full' }, Textarea({ rows: 2, placeholder: 'Why is this being returned?' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Record return', { variant: 'primary', onClick: () => { close(); saved('Return'); } })),
          }) })),
        kpis: [
          { label: 'Returns', value: String(rows.length), icon: 'refresh-ccw', tone: 'brand' },
          { label: 'To store', value: String(rows.filter((r) => r.direction === 'To Store').length), icon: 'arrow-down-right', tone: 'success' },
          { label: 'To vendor', value: String(rows.filter((r) => r.direction === 'To Vendor').length), icon: 'truck', tone: 'warning' },
          { label: 'Value', value: moneyC(rows.reduce((a, r) => a + r.value, 0)), icon: 'rupee', tone: 'info' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Return no or item…', width: '250px' },
          { id: 'direction', label: 'Direction', options: ['To Store', 'To Vendor'] },
          { id: 'condition', label: 'Condition', options: ['Good', 'Fair', 'Damaged'] },
          { id: 'status', label: 'Status', options: ['Accepted', 'Pending', 'Rejected'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.returnNo} ${r.itemName}`.toLowerCase().includes(String(x).toLowerCase()),
          direction: (r, x) => r.direction === x,
          condition: (r, x) => r.condition === x,
          status: (r, x) => r.status === x,
        })),
        chart: donutChart({
          data: countBy(rows, 'reason').map((c) => ({ key: c.key, value: c.value })),
          height: 260, centerValue: String(rows.length), centerLabel: 'Returns',
        }),
        chartTitle: 'Why stock comes back',
        columns: [
          { key: 'returnNo', label: 'Return', sticky: true, width: 170, className: 't-mono' },
          { key: 'itemName', label: 'Item', width: 250, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.itemName), h('div', { className: 't-xs t-muted' }, r.category)) },
          { key: 'quantity', label: 'Qty', width: 100, align: 'right', numeric: true, render: (r) => `${num(r.quantity)} ${r.unit}`, value: (r) => r.quantity, aggregate: 'sum', format: num },
          { key: 'direction', label: 'Direction', width: 130, filter: true, render: (r) => Badge(r.direction === 'To Store' ? 'New' : 'Issued', { tone: r.direction === 'To Store' ? 'info' : 'warning', icon: 'refresh-ccw' }) },
          { key: 'vendorName', label: 'Vendor', width: 200 },
          { key: 'date', label: 'Date', width: 130, render: (r) => dt(r.date) },
          { key: 'reason', label: 'Reason', width: 260 },
          { key: 'condition', label: 'Condition', width: 120, filter: true, render: (r) => Badge(r.condition) },
          { key: 'value', label: 'Value', width: 140, align: 'right', numeric: true, render: (r) => money(r.value), aggregate: 'sum', format: moneyC },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status === 'Accepted' ? 'Approved' : r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['returnNo', 'itemName', 'reason'],
        bulkActions: [
          { label: 'Accept returns', icon: 'check-circle', onClick: (sel) => notify({ title: `${sel.length} returns accepted`, tone: 'success' }) },
          { label: 'Raise debit note', icon: 'receipt', onClick: (sel) => notify({ title: `${sel.length} debit notes drafted`, tone: 'info' }) },
        ],
        rowActions: () => [
          { label: 'Open item', icon: 'package', route: 'inventory/items' },
          { label: 'Vendor', icon: 'truck', route: 'inventory/vendors' },
        ],
        emptyState: emptyFor('refresh-ccw', 'No returns', 'Nothing has come back to the store this session.'),
      }));
    },
  },

  /* --------------------------------------------------- inventory/damaged */
  'inventory/damaged': {
    title: 'Damaged Stock',
    subtitle: 'Breakage, expiry and write-offs',
    section: 'inventory',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.stockMovements.filter((m) => m.type === 'Damage'), ctx).map((m, i) => {
        const item = byId(db.inventoryItems, m.itemId) || {};
        return {
          ...m,
          caseNo: `DMG/26-27/${String(i + 1).padStart(4, '0')}`,
          unit: item.unit || 'Piece',
          value: (item.unitPrice || 0) * m.quantity,
          store: item.store || 'Main Store',
          responsibility: pickOf(['Vendor', 'Handling', 'Storage', 'Not attributable'], 'dr' + m.id),
          recoverable: boolOf('dv' + m.id, 38),
          status: pickOf(['Written Off', 'Written Off', 'Under Review', 'Recovered'], 'ds' + m.id),
        };
      });

      mount.appendChild(listPage({
        title: 'Damaged stock',
        subtitle: `${rows.length} cases · ${moneyC(rows.reduce((a, r) => a + r.value, 0))} of value affected`,
        route: 'inventory/damaged',
        actions: pageActions(
          Button('Write-off note', { variant: 'secondary', icon: 'file-text', onClick: mockAction('Generate write-off note') }),
          Button('Report damage', { variant: 'primary', icon: 'alert-triangle', onClick: () => Modal({
            title: 'Report damaged stock', size: 'lg', icon: 'alert-triangle', tone: 'warning',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Item', required: true, className: 'col-span-full' }, Combobox({ options: db.inventoryItems.map((i) => ({ value: i.id, label: `${i.name} · ${i.code}` })) })),
              Field({ label: 'Quantity', required: true }, Input({ type: 'number', placeholder: '3' })),
              Field({ label: 'Cause' }, Select({ options: ['Broken in transit', 'Water damage', 'Expired', 'Mishandled', 'Manufacturing defect'] })),
              Field({ label: 'Responsibility' }, Select({ options: ['Vendor', 'Handling', 'Storage', 'Not attributable'] })),
              Field({ label: 'Recoverable from vendor' }, Switch('Raise a claim with the supplier', {})),
              Field({ label: 'Date' }, DatePicker({ value: TODAY })),
              Field({ label: 'Photographs', className: 'col-span-full' }, FileUpload({ label: 'Attach photographs of the damage' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Report', { variant: 'danger', onClick: () => { close(); notify({ title: 'Damage reported', text: 'Accounts have been notified for the write-off entry.', tone: 'warning' }); } })),
          }) })),
        kpis: [
          { label: 'Cases', value: String(rows.length), icon: 'alert-triangle', tone: 'brand' },
          { label: 'Units lost', value: num(rows.reduce((a, r) => a + r.quantity, 0)), icon: 'package', tone: 'warning' },
          { label: 'Value written off', value: moneyC(rows.filter((r) => r.status === 'Written Off').reduce((a, r) => a + r.value, 0)), icon: 'rupee', tone: 'danger' },
          { label: 'Recoverable', value: moneyC(rows.filter((r) => r.recoverable).reduce((a, r) => a + r.value, 0)), icon: 'refresh-ccw', tone: 'success' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Case no or item…', width: '250px' },
          { id: 'responsibility', label: 'Responsibility', options: ['Vendor', 'Handling', 'Storage', 'Not attributable'] },
          { id: 'status', label: 'Status', options: ['Written Off', 'Under Review', 'Recovered'] },
          { id: 'category', label: 'Category', options: db.itemCategories.map((c) => c.name) },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.caseNo} ${r.itemName}`.toLowerCase().includes(String(x).toLowerCase()),
          responsibility: (r, x) => r.responsibility === x,
          status: (r, x) => r.status === x,
          category: (r, x) => r.category === x,
        })),
        chart: barChart({
          categories: sumBy(rows, 'category', 'quantity').map((c) => c.key),
          series: [{ name: 'Units damaged', values: sumBy(rows, 'category', 'quantity').map((c) => c.value) }],
          horizontal: true, height: 280, showValues: true,
        }),
        chartTitle: 'Damage by category',
        columns: [
          { key: 'caseNo', label: 'Case', sticky: true, width: 180, className: 't-mono' },
          { key: 'itemName', label: 'Item', width: 250, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.itemName), h('div', { className: 't-xs t-muted' }, `${r.category} · ${r.store}`)) },
          { key: 'quantity', label: 'Qty', width: 100, align: 'right', numeric: true, render: (r) => `${num(r.quantity)} ${r.unit}`, value: (r) => r.quantity, aggregate: 'sum', format: num },
          { key: 'date', label: 'Date', width: 130, render: (r) => dt(r.date) },
          { key: 'remarks', label: 'Cause', width: 200, render: (r) => r.remarks || '—' },
          { key: 'responsibility', label: 'Responsibility', width: 170, filter: true },
          { key: 'value', label: 'Value', width: 140, align: 'right', numeric: true, render: (r) => money(r.value), aggregate: 'sum', format: moneyC },
          { key: 'recoverable', label: 'Claim', width: 120, value: (r) => (r.recoverable ? 1 : 0), render: (r) => (r.recoverable ? Badge('Claim raised', { tone: 'info' }) : h('span', { className: 't-muted' }, '—')) },
          { key: 'status', label: 'Status', width: 150, filter: true, render: (r) => Badge(r.status === 'Written Off' ? 'Cancelled' : r.status === 'Recovered' ? 'Resolved' : 'Under Review') },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['caseNo', 'itemName'],
        bulkActions: [
          { label: 'Write off', icon: 'trash', tone: 'danger', onClick: (sel) => confirmDanger('Write off these items?', `${moneyC(sel.reduce((a, r) => a + r.value, 0))} will be charged to the damage account.`, () => notify({ title: 'Written off', tone: 'success' }), 'Write off') },
          { label: 'Raise vendor claim', icon: 'truck', onClick: (sel) => notify({ title: `${sel.length} claims raised`, tone: 'info' }) },
        ],
        rowActions: () => [
          { label: 'Open item', icon: 'package', route: 'inventory/items' },
          { label: 'Return to vendor', icon: 'refresh-ccw', route: 'inventory/returns' },
        ],
        emptyState: emptyFor('shield-check', 'No damage reported', 'Nothing has been written off from the stores this session.'),
      }));
    },
  },

  /* ----------------------------------------------------- inventory/audit */
  'inventory/audit': {
    title: 'Stock Audit',
    subtitle: 'Physical count against the ledger, with variance',
    section: 'inventory',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(auditLines(), ctx);
      const varianceValue = rows.reduce((a, r) => a + r.varianceValue, 0);

      mount.appendChild(reportPage({
        title: 'Stock audit',
        subtitle: `Cycle count August 2026 · ${rows.filter((r) => r.variance !== 0).length} of ${rows.length} lines with a variance`,
        route: 'inventory/audit',
        filters: [
          { id: 'store', label: 'Store', options: STORES },
          { id: 'category', label: 'Category', options: db.itemCategories.map((c) => c.name) },
          { id: 'status', label: 'Result', options: ['Matched', 'Minor Variance', 'Investigate'] },
          { id: 'from', label: 'Counted from', type: 'date' },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          store: (r, x) => r.store === x,
          category: (r, x) => r.category === x,
          status: (r, x) => r.status === x,
        })),
        summary: [
          { label: 'Lines counted', value: String(rows.length), icon: 'scan', tone: 'brand' },
          { label: 'Matched', value: String(rows.filter((r) => r.status === 'Matched').length), icon: 'check-circle', tone: 'success' },
          { label: 'To investigate', value: String(rows.filter((r) => r.status === 'Investigate').length), icon: 'alert-triangle', tone: 'danger' },
          { label: 'Net variance', value: formatCurrency(varianceValue, { compact: true, sign: true }), icon: 'scale', tone: varianceValue < 0 ? 'danger' : 'warning' },
        ],
        chart: [
          barChart({
            categories: db.itemCategories.map((c) => c.name),
            series: [{
              name: 'Variance value',
              values: db.itemCategories.map((c) => rows.filter((r) => r.category === c.name).reduce((a, r) => a + r.varianceValue, 0)),
            }],
            horizontal: true, height: 300, valueFormat: 'currencyCompact',
          }),
          donutChart({
            data: countBy(rows, 'status').map((c) => ({ key: c.key, value: c.value })),
            height: 260, centerValue: String(rows.length), centerLabel: 'Lines',
          }),
        ],
        chartTitle: 'Variance by category and audit outcome',
        columns: [
          { key: 'code', label: 'SKU', sticky: true, width: 140, className: 't-mono' },
          { key: 'itemName', label: 'Item', width: 250, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.itemName), h('div', { className: 't-xs t-muted' }, `${r.category} · ${r.store}`)) },
          { key: 'bookStock', label: 'Book stock', width: 130, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'physicalStock', label: 'Physical', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'variance', label: 'Variance', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: num,
            render: (r) => (r.variance === 0 ? h('span', { className: 't-muted' }, '0')
              : h('span', { className: r.variance < 0 ? 't-danger t-semibold' : 't-warning t-semibold' }, (r.variance > 0 ? '+' : '') + r.variance)) },
          { key: 'varianceValue', label: 'Variance value', width: 160, align: 'right', numeric: true, render: (r) => (r.varianceValue ? formatCurrency(r.varianceValue, { sign: true }) : '—'), aggregate: 'sum', format: (v) => formatCurrency(v, { compact: true, sign: true }) },
          { key: 'countedBy', label: 'Counted by', width: 170, filter: true },
          { key: 'countedOn', label: 'Counted on', width: 140, render: (r) => dt(r.countedOn) },
          { key: 'status', label: 'Result', width: 160, filter: true, render: (r) => Badge(r.status === 'Matched' ? 'Verified' : r.status === 'Minor Variance' ? 'Under Review' : 'Overdue', { tone: r.status === 'Matched' ? 'success' : r.status === 'Minor Variance' ? 'warning' : 'danger' }) },
          { key: 'remarks', label: 'Remarks', width: 300, hidden: true },
        ],
        rows,
        tableTitle: 'Count sheet',
        notes: Callout({ tone: 'warning', title: 'Before you post the adjustment' },
          'Any line marked “Investigate” needs a signed note from the store keeper and the head of department. Adjustments post to the stock-variance account and appear in the finance day book.'),
      }));
    },
  },

  /* ---------------------------------------------------- inventory/assets */
  'inventory/assets': {
    title: 'Asset Register',
    subtitle: 'Capitalised assets with tags, value and condition',
    section: 'inventory',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.assets, ctx).map((a) => ({
        ...a,
        vendorName: (byId(db.vendors, a.vendorId) || {}).name || '—',
        depreciation: a.purchaseCost - a.currentValue,
        warrantyDays: daysFromToday(a.warrantyExpiry),
      }));

      const detail = (a) => openDrawer(a.name, `${a.tag} · ${a.category} · ${a.location}`,
        h('div', { className: 'stack-3' },
          h('div', { className: 'row-4 row-wrap row-top' },
            qrTile(a.tag),
            h('div', { className: 'flex-1', style: { minWidth: '220px' } },
              h('div', { className: 'row-3 row-wrap mb-3' }, Badge(a.status), Badge(a.condition, { tone: a.condition === 'Poor' || a.condition === 'Scrapped' ? 'danger' : a.condition === 'Fair' ? 'warning' : 'success' }), a.amc && Badge('Under AMC', { tone: 'info' })),
              kv([
                ['Asset tag', a.tag],
                ['Category', a.category],
                ['Location', a.location],
                ['Assigned to', a.assignedTo || 'Unassigned'],
                ['Purchased', dt(a.purchaseDate)],
                ['Supplier', a.vendorName],
                ['Purchase cost', money(a.purchaseCost)],
                ['Age', `${a.ageYears} years`],
              ]))),
          SectionCard({ title: 'Depreciation', icon: 'trending-down' },
            h('div', { className: 'stack-2' },
              lineChart({
                categories: Array.from({ length: 6 }, (_, i) => `Year ${i}`),
                series: [{ name: 'Written-down value', values: Array.from({ length: 6 }, (_, i) => Math.round(a.purchaseCost * Math.pow(1 - a.depreciationRate / 100, i))) }],
                valueFormat: 'currencyCompact', height: 200, showDots: true,
              }),
              kv([
                ['Method', `Written-down value @ ${a.depreciationRate}% p.a.`],
                ['Accumulated depreciation', money(a.depreciation)],
                ['Current book value', money(a.currentValue)],
                ['Warranty', a.warrantyDays > 0 ? `Valid to ${formatDate(a.warrantyExpiry, 'medium')}` : 'Expired'],
              ]))),
          SectionCard({ title: 'Maintenance history', flush: true },
            DataTable({
              rows: assetMaintenance().filter((m) => m.assetId === a.id),
              paginate: false, searchable: false, exportable: false, columnToggle: false,
              columns: [
                { key: 'dueDate', label: 'Due', width: 120, render: (m) => dt(m.dueDate) },
                { key: 'type', label: 'Type' },
                { key: 'cost', label: 'Cost', width: 110, align: 'right', numeric: true, render: (m) => money(m.cost) },
                { key: 'status', label: 'Status', width: 130, render: (m) => Badge(m.status) },
              ],
              emptyState: emptyFor('wrench', 'No jobs', 'No maintenance has been scheduled against this asset.'),
            }))),
        (close) => frag(
          Button('Print tag', { variant: 'secondary', icon: 'print', onClick: mockAction('Print asset tag') }),
          Button('Assign', { variant: 'primary', icon: 'user-check', onClick: () => { close(); navigate('inventory/asset-assignment'); } })));

      mount.appendChild(listPage({
        title: 'Asset register',
        subtitle: `${num(rows.length)} assets · ${moneyC(rows.reduce((a, r) => a + r.currentValue, 0))} of book value`,
        route: 'inventory/assets',
        actions: pageActions(
          Button('Depreciation', { variant: 'secondary', icon: 'trending-down', route: 'finance/depreciation' }),
          Button('Add asset', { variant: 'primary', icon: 'plus', onClick: () => Modal({
            title: 'Add an asset', size: 'lg', icon: 'archive',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Asset name', required: true, className: 'col-span-full' }, Input({ placeholder: 'e.g. Interactive Panel 75"' })),
              Field({ label: 'Category', required: true }, Select({ options: ['IT Hardware', 'Furniture', 'Laboratory', 'Transport', 'Electrical', 'Security'] })),
              Field({ label: 'Location' }, Input({ placeholder: 'Block A — Room 12' })),
              Field({ label: 'Purchase date', required: true }, DatePicker({ value: TODAY })),
              Field({ label: 'Purchase cost (₹)', required: true }, Input({ type: 'number', placeholder: '185000' })),
              Field({ label: 'Vendor' }, Combobox({ options: db.vendors.map((v) => ({ value: v.id, label: v.name })) })),
              Field({ label: 'Warranty till' }, DatePicker({})),
              Field({ label: 'Depreciation rate (%)' }, Input({ type: 'number', value: '15' })),
              Field({ label: 'Under AMC', className: 'col-span-full' }, Switch('An annual maintenance contract covers this asset', {}))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Add asset', { variant: 'primary', onClick: () => { close(); saved('Asset'); } })),
          }) })),
        kpis: [
          { label: 'Assets', value: num(rows.length), icon: 'archive', tone: 'brand' },
          { label: 'Gross block', value: moneyC(rows.reduce((a, r) => a + r.purchaseCost, 0)), icon: 'rupee', tone: 'info' },
          { label: 'Book value', value: moneyC(rows.reduce((a, r) => a + r.currentValue, 0)), icon: 'trending-down', tone: 'success' },
          { label: 'Under repair', value: String(rows.filter((r) => r.status === 'Under Repair').length), icon: 'wrench', tone: 'warning', route: 'inventory/asset-maintenance' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Tag, name or location…', width: '250px' },
          { id: 'category', label: 'Category', options: ['IT Hardware', 'Furniture', 'Laboratory', 'Transport', 'Electrical', 'Security'] },
          { id: 'status', label: 'Status', options: ['In Use', 'In Store', 'Under Repair', 'Disposed'] },
          { id: 'condition', label: 'Condition', options: ['Excellent', 'Good', 'Fair', 'Poor', 'Scrapped'] },
          { id: 'campus', label: 'Campus', options: campusOptions() },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.tag} ${r.name} ${r.location}`.toLowerCase().includes(String(x).toLowerCase()),
          category: (r, x) => r.category === x,
          status: (r, x) => r.status === x,
          condition: (r, x) => r.condition === x,
          campus: (r, x) => r.campusId === x,
        })),
        chart: barChart({
          categories: sumBy(rows, 'category', 'currentValue').map((c) => c.key),
          series: [{ name: 'Book value', values: sumBy(rows, 'category', 'currentValue').map((c) => c.value) }],
          horizontal: true, height: 280, valueFormat: 'currencyCompact', showValues: true,
        }),
        chartTitle: 'Book value by asset class',
        columns: [
          { key: 'tag', label: 'Tag', sticky: true, width: 170, className: 't-mono' },
          { key: 'name', label: 'Asset', width: 230, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.name), h('div', { className: 't-xs t-muted t-truncate' }, r.location)) },
          { key: 'category', label: 'Category', width: 160, filter: true },
          { key: 'assignedTo', label: 'Assigned to', width: 190, render: (r) => r.assignedTo || h('span', { className: 't-muted' }, 'Unassigned') },
          { key: 'purchaseDate', label: 'Purchased', width: 140, render: (r) => dt(r.purchaseDate) },
          { key: 'purchaseCost', label: 'Cost', width: 140, align: 'right', numeric: true, render: (r) => money(r.purchaseCost), aggregate: 'sum', format: moneyC },
          { key: 'ageYears', label: 'Age', width: 90, align: 'right', numeric: true, render: (r) => `${r.ageYears}y` },
          { key: 'currentValue', label: 'Book value', width: 150, align: 'right', numeric: true, render: (r) => money(r.currentValue), aggregate: 'sum', format: moneyC },
          { key: 'warrantyExpiry', label: 'Warranty', width: 180, value: (r) => r.warrantyDays, render: (r) => expiryChip(r.warrantyExpiry, 'To') },
          { key: 'condition', label: 'Condition', width: 130, filter: true, render: (r) => Badge(r.condition, { tone: r.condition === 'Poor' || r.condition === 'Scrapped' ? 'danger' : r.condition === 'Fair' ? 'warning' : 'success' }) },
          { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['tag', 'name', 'location', 'assignedTo'],
        bulkActions: [
          { label: 'Print asset tags', icon: 'print', onClick: (sel) => notify({ title: `${sel.length} QR tags queued`, tone: 'success' }) },
          { label: 'Schedule maintenance', icon: 'wrench', onClick: (sel) => notify({ title: `${sel.length} jobs scheduled`, tone: 'success' }) },
          { label: 'Dispose', icon: 'trash', tone: 'danger', onClick: (sel) => confirmDanger('Dispose these assets?', `${sel.length} assets with a book value of ${moneyC(sel.reduce((a, r) => a + r.currentValue, 0))} will be retired.`, () => notify({ title: 'Assets disposed', tone: 'success' }), 'Dispose') },
        ],
        onRowClick: detail,
        rowActions: (r) => [
          { label: 'Open asset', icon: 'eye', onClick: () => detail(r) },
          { label: 'Assign', icon: 'user-check', route: 'inventory/asset-assignment' },
          { label: 'Maintenance', icon: 'wrench', route: 'inventory/asset-maintenance' },
          { label: 'Copy tag', icon: 'copy', onClick: () => copyToClipboard(r.tag) },
        ],
        emptyState: emptyFor('archive', 'No assets', 'Capitalise a purchase to create the first asset record.'),
      }));
    },
  },

  /* ------------------------------------------ inventory/asset-assignment */
  'inventory/asset-assignment': {
    title: 'Asset Assignment',
    subtitle: 'Who holds which asset, and where it sits',
    section: 'inventory',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.assets.filter((a) => a.status !== 'Disposed'), ctx).map((a, i) => ({
        ...a,
        assignmentNo: `AA/26-27/${String(i + 1).padStart(4, '0')}`,
        assignedOn: a.purchaseDate,
        department: pickOf(['Administration', 'Science', 'IT', 'Sports', 'Library', 'Transport', 'Mess'], 'ad' + a.id),
        acknowledged: a.assignedTo ? boolOf('ak' + a.id, 78) : false,
        assignmentStatus: a.assignedTo ? 'Assigned' : 'In Store',
      }));

      mount.appendChild(listPage({
        title: 'Asset assignment',
        subtitle: `${rows.filter((r) => r.assignmentStatus === 'Assigned').length} assets issued to staff · ${rows.filter((r) => r.assignmentStatus === 'In Store').length} lying in store`,
        route: 'inventory/asset-assignment',
        actions: pageActions(
          Button('Asset register', { variant: 'secondary', icon: 'archive', route: 'inventory/assets' }),
          Button('Assign an asset', { variant: 'primary', icon: 'user-check', onClick: () => Modal({
            title: 'Assign an asset', size: 'lg', icon: 'user-check',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Asset', required: true, className: 'col-span-full' },
                Combobox({ options: db.assets.filter((a) => !a.assignedTo).slice(0, 150).map((a) => ({ value: a.id, label: `${a.tag} · ${a.name}` })) })),
              Field({ label: 'Assign to', required: true, className: 'col-span-full' },
                Combobox({ options: db.staff.slice(0, 200).map((s) => ({ value: s.id, label: `${s.name} · ${s.designation}` })) })),
              Field({ label: 'Department' }, Select({ options: ['Administration', 'Science', 'IT', 'Sports', 'Library', 'Transport', 'Mess'] })),
              Field({ label: 'Location' }, Input({ placeholder: 'Block A — Room 12' })),
              Field({ label: 'Assigned from' }, DatePicker({ value: TODAY })),
              Field({ label: 'Return by' }, DatePicker({})),
              Field({ label: 'Condition on issue' }, Select({ options: ['Excellent', 'Good', 'Fair'] })),
              Field({ label: 'Acknowledgement', className: 'col-span-full' }, Switch('Require a digital acknowledgement from the holder', { checked: true }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Assign', { variant: 'primary', onClick: () => { close(); saved('Assignment'); } })),
          }) })),
        kpis: [
          { label: 'Assigned', value: String(rows.filter((r) => r.assignmentStatus === 'Assigned').length), icon: 'user-check', tone: 'brand' },
          { label: 'In store', value: String(rows.filter((r) => r.assignmentStatus === 'In Store').length), icon: 'archive', tone: 'info' },
          { label: 'Acknowledged', value: String(rows.filter((r) => r.acknowledged).length), icon: 'check-circle', tone: 'success' },
          { label: 'Awaiting acknowledgement', value: String(rows.filter((r) => r.assignmentStatus === 'Assigned' && !r.acknowledged).length), icon: 'clock', tone: 'warning' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Tag, asset or holder…', width: '250px' },
          { id: 'department', label: 'Department', options: ['Administration', 'Science', 'IT', 'Sports', 'Library', 'Transport', 'Mess'] },
          { id: 'assignmentStatus', label: 'Assignment', options: ['Assigned', 'In Store'] },
          { id: 'category', label: 'Category', options: ['IT Hardware', 'Furniture', 'Laboratory', 'Transport', 'Electrical', 'Security'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.tag} ${r.name} ${r.assignedTo || ''}`.toLowerCase().includes(String(x).toLowerCase()),
          department: (r, x) => r.department === x,
          assignmentStatus: (r, x) => r.assignmentStatus === x,
          category: (r, x) => r.category === x,
        })),
        chart: barChart({
          categories: countBy(rows.filter((r) => r.assignmentStatus === 'Assigned'), 'department').map((c) => c.key),
          series: [{ name: 'Assets held', values: countBy(rows.filter((r) => r.assignmentStatus === 'Assigned'), 'department').map((c) => c.value) }],
          height: 250, showValues: true,
        }),
        chartTitle: 'Assets held by department',
        columns: [
          { key: 'assignmentNo', label: 'Assignment', sticky: true, width: 170, className: 't-mono' },
          { key: 'tag', label: 'Tag', width: 170, className: 't-mono' },
          { key: 'name', label: 'Asset', width: 220, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.name), h('div', { className: 't-xs t-muted' }, r.category)) },
          { key: 'assignedTo', label: 'Holder', width: 200, render: (r) => (r.assignedTo ? Identity(r.assignedTo, r.department) : h('span', { className: 't-muted' }, 'In store')) },
          { key: 'location', label: 'Location', width: 200, filter: true },
          { key: 'assignedOn', label: 'Since', width: 130, render: (r) => dt(r.assignedOn) },
          { key: 'condition', label: 'Condition', width: 130, filter: true, render: (r) => Badge(r.condition, { tone: r.condition === 'Poor' ? 'danger' : r.condition === 'Fair' ? 'warning' : 'success' }) },
          { key: 'acknowledged', label: 'Acknowledged', width: 160, value: (r) => (r.acknowledged ? 1 : 0), render: (r) => (r.acknowledged ? Badge('Verified', { tone: 'success' }) : Badge('Pending', { tone: 'warning' })) },
          { key: 'assignmentStatus', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.assignmentStatus === 'Assigned' ? 'Assigned' : 'In Stock') },
        ],
        rows, selectable: true, pageSize: 25,
        searchKeys: ['tag', 'name', 'assignedTo', 'location'],
        bulkActions: [
          { label: 'Request acknowledgement', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} acknowledgement requests sent`, tone: 'success' }) },
          { label: 'Recall to store', icon: 'archive', onClick: (sel) => confirmDanger('Recall these assets?', `${sel.length} assets will be marked for return to the store.`, () => notify({ title: 'Recall raised', tone: 'success' }), 'Recall') },
        ],
        rowActions: () => [
          { label: 'Asset register', icon: 'archive', route: 'inventory/assets' },
          { label: 'Maintenance', icon: 'wrench', route: 'inventory/asset-maintenance' },
        ],
        emptyState: emptyFor('user-check', 'Nothing assigned', 'Assign an asset to a staff member to start the custody trail.'),
      }));
    },
  },

  /* ----------------------------------------- inventory/asset-maintenance */
  'inventory/asset-maintenance': {
    title: 'Asset Maintenance',
    subtitle: 'AMC visits, preventive service and breakdown repair',
    section: 'inventory',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(assetMaintenance(), ctx);
      const overdue = rows.filter((r) => r.status === 'Overdue');

      mount.appendChild(listPage({
        title: 'Asset maintenance',
        subtitle: `${rows.length} scheduled jobs · ${overdue.length} overdue · ${moneyC(rows.reduce((a, r) => a + r.cost, 0))} budgeted`,
        route: 'inventory/asset-maintenance',
        actions: pageActions(
          Button('Asset register', { variant: 'secondary', icon: 'archive', route: 'inventory/assets' }),
          Button('Schedule a job', { variant: 'primary', icon: 'wrench', onClick: () => Modal({
            title: 'Schedule a maintenance job', size: 'lg', icon: 'wrench',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Asset', required: true, className: 'col-span-full' },
                Combobox({ options: db.assets.slice(0, 200).map((a) => ({ value: a.id, label: `${a.tag} · ${a.name}` })) })),
              Field({ label: 'Job type', required: true }, Select({ options: ['AMC Visit', 'Preventive Service', 'Breakdown Repair', 'Calibration', 'Software Update'] })),
              Field({ label: 'Due date', required: true }, DatePicker({ value: TODAY })),
              Field({ label: 'Vendor' }, Combobox({ options: db.vendors.map((v) => ({ value: v.id, label: v.name })) })),
              Field({ label: 'Technician' }, Input({ placeholder: 'Name of the engineer' })),
              Field({ label: 'Estimated cost (₹)' }, Input({ type: 'number', placeholder: '4500' })),
              Field({ label: 'Expected downtime (days)' }, Input({ type: 'number', value: '1' })),
              Field({ label: 'Notes', className: 'col-span-full' }, Textarea({ rows: 2, placeholder: 'Panel flickering intermittently; under AMC until March.' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Schedule', { variant: 'primary', onClick: () => { close(); saved('Maintenance job'); } })),
          }) })),
        notes: overdue.length ? Callout({ tone: 'danger', icon: 'alert-triangle', title: `${overdue.length} jobs are past their due date` },
          'Overdue AMC visits invalidate the contract for that quarter. Chase the vendor or reschedule with a written note before month end.') : null,
        kpis: [
          { label: 'Scheduled jobs', value: String(rows.length), icon: 'wrench', tone: 'brand' },
          { label: 'Under AMC', value: String(rows.filter((r) => r.amc).length), icon: 'shield-check', tone: 'success' },
          { label: 'Overdue', value: String(overdue.length), icon: 'alert-triangle', tone: 'danger' },
          { label: 'Budgeted spend', value: moneyC(rows.reduce((a, r) => a + r.cost, 0)), icon: 'rupee', tone: 'info' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Tag, asset or vendor…', width: '250px' },
          { id: 'type', label: 'Job type', options: ['AMC Visit', 'Preventive Service', 'Breakdown Repair', 'Calibration', 'Software Update'] },
          { id: 'status', label: 'Status', options: ['Scheduled', 'In Progress', 'Completed', 'Overdue'] },
          { id: 'category', label: 'Category', options: ['IT Hardware', 'Furniture', 'Laboratory', 'Transport', 'Electrical', 'Security'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.tag} ${r.assetName} ${r.vendorName}`.toLowerCase().includes(String(x).toLowerCase()),
          type: (r, x) => r.type === x,
          status: (r, x) => r.status === x,
          category: (r, x) => r.category === x,
        })),
        chart: barChart({
          categories: countBy(rows, 'type').map((c) => c.key),
          series: [{ name: 'Jobs', values: countBy(rows, 'type').map((c) => c.value) }],
          horizontal: true, height: 260, showValues: true,
        }),
        chartTitle: 'Maintenance workload by job type',
        columns: [
          { key: 'tag', label: 'Tag', sticky: true, width: 170, className: 't-mono' },
          { key: 'assetName', label: 'Asset', width: 220, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.assetName), h('div', { className: 't-xs t-muted t-truncate' }, r.location)) },
          { key: 'type', label: 'Job', width: 180, filter: true },
          { key: 'dueDate', label: 'Due', width: 130, render: (r) => dt(r.dueDate) },
          { key: 'vendorName', label: 'Vendor', width: 200 },
          { key: 'technician', label: 'Technician', width: 170, hidden: true },
          { key: 'cost', label: 'Cost', width: 130, align: 'right', numeric: true, render: (r) => money(r.cost), aggregate: 'sum', format: moneyC },
          { key: 'downtimeDays', label: 'Downtime', width: 120, align: 'right', numeric: true, render: (r) => `${r.downtimeDays} d`, aggregate: 'sum', format: (v) => `${v} d` },
          { key: 'amc', label: 'AMC', width: 100, value: (r) => (r.amc ? 1 : 0), render: (r) => (r.amc ? Badge('AMC', { tone: 'info' }) : h('span', { className: 't-muted' }, '—')) },
          { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['tag', 'assetName', 'vendorName'],
        bulkActions: [
          { label: 'Mark completed', icon: 'check-circle', onClick: (sel) => notify({ title: `${sel.length} jobs closed`, tone: 'success' }) },
          { label: 'Chase vendors', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} vendors chased`, tone: 'info' }) },
        ],
        rowActions: () => [
          { label: 'Open asset', icon: 'archive', route: 'inventory/assets' },
          { label: 'Vendor', icon: 'truck', route: 'inventory/vendors' },
        ],
        emptyState: emptyFor('wrench', 'Nothing scheduled', 'Schedule an AMC visit or a preventive service to fill the maintenance calendar.'),
      }));
    },
  },

  /* --------------------------------------------------- inventory/reports */
  'inventory/reports': {
    title: 'Inventory Reports',
    subtitle: 'Valuation, consumption and asset depreciation',
    section: 'inventory',
    render(mount, ctx) {
      ensureStyles();
      const items = scope(db.inventoryItems, ctx);
      const moves = db.stockMovements;
      const assets = scope(db.assets, ctx);

      const rows = db.itemCategories.map((c) => {
        const list = items.filter((i) => i.categoryId === c.id);
        const ids = new Set(list.map((i) => i.id));
        const mv = moves.filter((m) => ids.has(m.itemId));
        const issued = mv.filter((m) => m.type === 'Issue').reduce((a, m) => a + m.quantity, 0);
        const received = mv.filter((m) => m.type === 'Stock In').reduce((a, m) => a + m.quantity, 0);
        const damaged = mv.filter((m) => m.type === 'Damage').reduce((a, m) => a + m.quantity, 0);
        const value = list.reduce((a, i) => a + i.value, 0);
        return {
          id: c.id, category: c.name, skus: list.length,
          received, issued, damaged,
          turnover: value ? Number(((issued * (list[0] ? list[0].unitPrice : 1)) / value).toFixed(2)) : 0,
          stockValue: value,
          lowStock: list.filter((i) => i.status !== 'In Stock').length,
          assetValue: assets.filter((a) => a.category === c.name).reduce((a2, a) => a2 + a.currentValue, 0),
        };
      });

      mount.appendChild(reportPage({
        title: 'Inventory reports',
        subtitle: `${items.length} SKUs · ${num(assets.length)} assets · academic year 2026-27`,
        route: 'inventory/reports',
        filters: [
          { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'month', label: 'This month' }, { id: 'quarter', label: 'This quarter' }, { id: 'ytd', label: 'Year to date' }] },
          { id: 'category', label: 'Category', options: db.itemCategories.map((c) => c.name) },
          { id: 'store', label: 'Store', options: STORES },
          { id: 'from', label: 'From', type: 'date' },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, { category: (r, x) => r.category === x })),
        summary: [
          { label: 'Stock value', value: moneyC(rows.reduce((a, r) => a + r.stockValue, 0)), icon: 'layers', tone: 'brand' },
          { label: 'Consumption', value: num(rows.reduce((a, r) => a + r.issued, 0)), delta: 6.4, icon: 'arrow-up-right', tone: 'info' },
          { label: 'Asset book value', value: moneyC(assets.reduce((a, r) => a + r.currentValue, 0)), icon: 'archive', tone: 'success' },
          { label: 'Depreciation', value: moneyC(assets.reduce((a, r) => a + (r.purchaseCost - r.currentValue), 0)), delta: -4.1, icon: 'trending-down', tone: 'danger' },
        ],
        chart: [
          treemap({
            data: rows.map((r) => ({ key: r.category, value: r.stockValue })),
            height: 300, valueFormat: 'currencyCompact',
          }),
          barChart({
            categories: rows.map((r) => r.category),
            series: [
              { name: 'Received', values: rows.map((r) => r.received) },
              { name: 'Issued', values: rows.map((r) => r.issued) },
              { name: 'Damaged', values: rows.map((r) => r.damaged) },
            ],
            height: 300,
          }),
        ],
        chartTitle: 'Stock value and movement by category',
        columns: [
          { key: 'category', label: 'Category', sticky: true, width: 210 },
          { key: 'skus', label: 'SKUs', width: 100, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'received', label: 'Received', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'issued', label: 'Issued', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'damaged', label: 'Damaged', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'lowStock', label: 'Reorder alerts', width: 150, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'stockValue', label: 'Stock value', width: 150, align: 'right', numeric: true, render: (r) => money(r.stockValue), aggregate: 'sum', format: moneyC },
          { key: 'assetValue', label: 'Asset book value', width: 170, align: 'right', numeric: true, render: (r) => money(r.assetValue), aggregate: 'sum', format: moneyC },
        ],
        rows,
        tableTitle: 'Category-wise valuation and movement',
        notes: Callout({ tone: 'info', title: 'Basis of valuation' },
          'Stock is valued at the last purchase price. Assets are carried at written-down value using the rate on each asset record. Consumption covers issues net of returns for the selected period.'),
      }));
    },
  },
};

/* ==========================================================================
   8. HEALTH & WELLNESS
   ========================================================================== */

const bmiTone = (bmi) => (bmi < 15 ? 'warning' : bmi < 22 ? 'success' : bmi < 26 ? 'warning' : 'danger');
const bmiBand = (bmi) => (bmi < 15 ? 'Underweight' : bmi < 22 ? 'Healthy' : bmi < 26 ? 'Overweight' : 'Obese');

function healthProfileBody(r) {
  const visits = db.infirmaryVisits.filter((v) => v.studentId === r.studentId);
  const meds = medicationLog().filter((m) => m.studentId === r.studentId);
  const vax = vaccinationRows().filter((v) => v.studentId === r.studentId);
  return h('div', { className: 'stack-3' },
    h('div', { className: 'row-3 row-wrap' },
      Badge(r.status === 'Fit' ? 'Verified' : r.status === 'Referred' ? 'Overdue' : 'Under Review',
        { tone: r.status === 'Fit' ? 'success' : r.status === 'Referred' ? 'danger' : 'warning' }),
      Badge(`Blood group ${r.bloodGroup}`, { tone: 'info' }),
      r.allergies !== 'None' && Badge(`Allergy: ${r.allergies}`, { tone: 'danger', icon: 'alert-triangle' }),
      r.chronicConditions && r.chronicConditions !== 'None' && Badge(r.chronicConditions, { tone: 'warning' })),
    h('div', { className: 'grid grid-2' },
      SectionCard({ title: 'Vitals', icon: 'heart-pulse' },
        h('div', { className: 'stack-2' },
          kv([
            ['Height', `${r.heightCm} cm`],
            ['Weight', `${r.weightKg} kg`],
            ['BMI', h('span', null, `${r.bmi} `, Badge(bmiBand(r.bmi), { tone: bmiTone(r.bmi), size: 'sm' }))],
            ['Vision', r.vision],
            ['Dental', r.dental],
          ]),
          ProgressBar(Math.min(100, (r.bmi / 30) * 100), { tone: bmiTone(r.bmi), label: `BMI ${r.bmi} — ${bmiBand(r.bmi)}` }))),
      SectionCard({ title: 'Care & contacts', icon: 'phone-call' },
        kv([
          ['Family doctor', r.familyDoctor],
          ['Emergency contact', r.emergencyContact],
          ['Insurance policy', r.insurancePolicy || 'Not on file'],
          ['Last checkup', dt(r.lastCheckup)],
          ['Next checkup', dt(r.nextCheckup)],
        ]))),
    SectionCard({ title: 'Vaccination record', icon: 'syringe', flush: true },
      DataTable({
        rows: vax, paginate: false, searchable: false, exportable: false, columnToggle: false,
        columns: [
          { key: 'vaccine', label: 'Vaccine', width: 160 },
          { key: 'doseNo', label: 'Doses', width: 90, align: 'right', numeric: true },
          { key: 'givenOn', label: 'Given on', width: 140, render: (v) => (v.givenOn ? dt(v.givenOn) : '—') },
          { key: 'centre', label: 'Centre', width: 160 },
          { key: 'status', label: 'Status', width: 130, render: (v) => Badge(v.status) },
        ],
        emptyState: emptyFor('syringe', 'No vaccination record', 'Ask the guardian to upload the immunisation card.'),
      })),
    SectionCard({ title: 'Infirmary visits', subtitle: `${visits.length} visits on record`, flush: true },
      visits.length ? DataTable({
        rows: visits, pageSize: 6, searchable: false, exportable: false, columnToggle: false,
        columns: [
          { key: 'date', label: 'Date', width: 130, render: (v) => dt(v.date) },
          { key: 'complaint', label: 'Complaint', width: 170 },
          { key: 'diagnosis', label: 'Assessment' },
          { key: 'treatment', label: 'Treatment' },
          { key: 'sentHome', label: 'Sent home', width: 120, value: (v) => (v.sentHome ? 1 : 0), render: (v) => (v.sentHome ? Badge('Sent home', { tone: 'warning' }) : Badge('Returned to class', { tone: 'success' })) },
        ],
      }) : h('div', { className: 'card-pad' }, emptyFor('first-aid', 'No visits', 'This student has not been to the infirmary this session.'))),
    SectionCard({ title: 'Medication administered', subtitle: `${meds.length} entries`, flush: true },
      meds.length ? DataTable({
        rows: meds, pageSize: 6, searchable: false, exportable: false, columnToggle: false,
        columns: [
          { key: 'date', label: 'Date', width: 130, render: (m) => dt(m.date) },
          { key: 'medicine', label: 'Medicine' },
          { key: 'dose', label: 'Dose', width: 110 },
          { key: 'administeredBy', label: 'By', width: 180 },
          { key: 'consent', label: 'Consent', width: 200 },
        ],
      }) : h('div', { className: 'card-pad' }, emptyFor('pill', 'No medication given', 'No medicine has been administered to this student at school.'))));
}

const healthRoutes = {

  /* ------------------------------------------------------ health/profiles */
  'health/profiles': {
    title: 'Student Health Profiles',
    subtitle: 'Vitals, conditions and clearance status',
    section: 'health',
    render(mount, ctx) {
      ensureStyles();
      const all = scope(db.healthRecords, ctx);

      if (ctx.param) {
        const r = all.find((x) => x.studentId === ctx.param) || db.healthRecords.find((x) => x.studentId === ctx.param);
        if (!r) return mount.appendChild(missingRecord('health record', 'health/profiles'));
        return mount.appendChild(detailPage({
          title: r.studentName,
          subtitle: `${r.className}-${r.section} · ${campusName(r.campusId)}`,
          route: 'health/profiles',
          badges: [Badge(r.status === 'Fit' ? 'Verified' : 'Under Review'), Badge(r.bloodGroup, { tone: 'danger' })],
          meta: [
            { label: 'Height', value: `${r.heightCm} cm`, icon: 'scale' },
            { label: 'Weight', value: `${r.weightKg} kg`, icon: 'activity' },
            { label: 'BMI', value: String(r.bmi), icon: 'heart-pulse' },
            { label: 'Last checkup', value: dt(r.lastCheckup), icon: 'clipboard-check' },
          ],
          actions: pageActions(
            Button('Student profile', { variant: 'secondary', icon: 'user', route: `students/profile/${r.studentId}` }),
            Button('Log an infirmary visit', { variant: 'primary', icon: 'first-aid', route: 'health/infirmary' })),
          tabs: [{ id: 'health', label: 'Health record', icon: 'heart-pulse', render: () => healthProfileBody(r) }],
          sidebar: [
            SectionCard({ title: 'Emergency', icon: 'siren' },
              h('div', { className: 'stack-2' },
                kv([['Contact', r.emergencyContact], ['Family doctor', r.familyDoctor], ['Blood group', r.bloodGroup]]),
                Button('Call guardian', { variant: 'danger', block: true, icon: 'phone-call', onClick: () => notify({ title: 'Dialling guardian', text: r.emergencyContact, tone: 'warning' }) }))),
            r.allergies !== 'None' ? Callout({ tone: 'danger', icon: 'alert-triangle', title: 'Allergy alert' },
              `${r.studentName} is allergic to ${r.allergies}. This is flagged to the mess, the infirmary and class teachers.`) : null,
          ].filter(Boolean),
        }));
      }

      mount.appendChild(listPage({
        title: 'Student health profiles',
        subtitle: `${num(all.length)} profiles on file · ${all.filter((r) => r.status !== 'Fit').length} needing follow-up`,
        route: 'health/profiles',
        actions: pageActions(
          Button('Checkup campaign', { variant: 'secondary', icon: 'clipboard-check', route: 'health/checkups' }),
          Button('Add a profile', { variant: 'primary', icon: 'heart-pulse', onClick: () => Modal({
            title: 'Create a health profile', size: 'lg', icon: 'heart-pulse',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Student', required: true, className: 'col-span-full' },
                Combobox({ options: db.students.slice(0, 250).map((s) => ({ value: s.id, label: `${s.name} · ${s.className} · ${s.admissionNo}` })) })),
              Field({ label: 'Blood group', required: true }, Select({ options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] })),
              Field({ label: 'Height (cm)' }, Input({ type: 'number', placeholder: '148' })),
              Field({ label: 'Weight (kg)' }, Input({ type: 'number', placeholder: '41' })),
              Field({ label: 'Vision' }, Select({ options: ['6/6', '6/9', '6/12', 'Spectacles'] })),
              Field({ label: 'Dental' }, Select({ options: ['Normal', 'Cavity', 'Braces'] })),
              Field({ label: 'Allergies', className: 'col-span-full' }, MultiSelect({ options: ['Peanuts', 'Dust', 'Pollen', 'Penicillin', 'Seafood', 'Lactose'], values: [] })),
              Field({ label: 'Chronic conditions', className: 'col-span-full' }, Input({ placeholder: 'Asthma, epilepsy, none…' })),
              Field({ label: 'Family doctor' }, Input({ placeholder: 'Dr. …' })),
              Field({ label: 'Emergency contact' }, Input({ placeholder: '+91 98xxx xxxxx' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Save profile', { variant: 'primary', onClick: () => { close(); saved('Health profile'); } })),
          }) })),
        kpis: [
          { label: 'Profiles', value: num(all.length), icon: 'heart-pulse', tone: 'brand' },
          { label: 'Declared fit', value: num(all.filter((r) => r.status === 'Fit').length), icon: 'check-circle', tone: 'success' },
          { label: 'Under observation', value: String(all.filter((r) => r.status === 'Under Observation').length), icon: 'eye', tone: 'warning' },
          { label: 'Referred out', value: String(all.filter((r) => r.status === 'Referred').length), icon: 'stethoscope', tone: 'danger' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Student name or class…', width: '250px' },
          { id: 'bloodGroup', label: 'Blood group', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
          { id: 'status', label: 'Status', options: ['Fit', 'Under Observation', 'Referred'] },
          { id: 'band', label: 'BMI band', options: ['Underweight', 'Healthy', 'Overweight', 'Obese'] },
        ],
        onFilter: (id, v, all2, table) => table.refresh(applyAll(all, all2, {
          q: (r, x) => `${r.studentName} ${r.className}`.toLowerCase().includes(String(x).toLowerCase()),
          bloodGroup: (r, x) => r.bloodGroup === x,
          status: (r, x) => r.status === x,
          band: (r, x) => bmiBand(r.bmi) === x,
        })),
        chart: barChart({
          categories: ['Underweight', 'Healthy', 'Overweight', 'Obese'],
          series: [{ name: 'Students', values: ['Underweight', 'Healthy', 'Overweight', 'Obese'].map((b) => all.filter((r) => bmiBand(r.bmi) === b).length) }],
          height: 250, showValues: true,
        }),
        chartTitle: 'BMI distribution across the campus',
        columns: [
          { key: 'studentName', label: 'Student', sticky: true, width: 240, render: (r) => Identity(r.studentName, `${r.className}-${r.section}`) },
          { key: 'bloodGroup', label: 'Blood', width: 100, filter: true, render: (r) => Badge(r.bloodGroup, { tone: 'danger', size: 'sm' }) },
          { key: 'heightCm', label: 'Height', width: 100, align: 'right', numeric: true, render: (r) => `${r.heightCm} cm`, aggregate: 'avg', format: (v) => `${v.toFixed(0)} cm` },
          { key: 'weightKg', label: 'Weight', width: 100, align: 'right', numeric: true, render: (r) => `${r.weightKg} kg`, aggregate: 'avg', format: (v) => `${v.toFixed(0)} kg` },
          { key: 'bmi', label: 'BMI', width: 140, align: 'right', numeric: true, render: (r) => h('span', null, `${r.bmi} `, Badge(bmiBand(r.bmi), { tone: bmiTone(r.bmi), size: 'sm' })), aggregate: 'avg', format: (v) => v.toFixed(1) },
          { key: 'vision', label: 'Vision', width: 120, filter: true },
          { key: 'dental', label: 'Dental', width: 120, filter: true },
          { key: 'allergies', label: 'Allergies', width: 150, filter: true, render: (r) => (r.allergies === 'None' ? h('span', { className: 't-muted' }, 'None') : Badge(r.allergies, { tone: 'danger' })) },
          { key: 'lastCheckup', label: 'Last checkup', width: 140, render: (r) => dt(r.lastCheckup) },
          { key: 'status', label: 'Status', width: 170, filter: true, render: (r) => Badge(r.status === 'Fit' ? 'Verified' : r.status === 'Referred' ? 'Overdue' : 'Under Review', { tone: r.status === 'Fit' ? 'success' : r.status === 'Referred' ? 'danger' : 'warning' }) },
        ],
        rows: all, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['studentName', 'className', 'bloodGroup', 'allergies'],
        bulkActions: [
          { label: 'Schedule checkups', icon: 'clipboard-check', onClick: (sel) => notify({ title: `${sel.length} checkups scheduled`, tone: 'success' }) },
          { label: 'Notify guardians', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} guardians notified`, tone: 'success' }) },
        ],
        onRowClick: (r) => navigate(`health/profiles/${r.studentId}`),
        rowActions: (r) => [
          { label: 'Open health record', icon: 'heart-pulse', route: `health/profiles/${r.studentId}` },
          { label: 'Student profile', icon: 'user', route: `students/profile/${r.studentId}` },
          { label: 'Log an infirmary visit', icon: 'first-aid', route: 'health/infirmary' },
        ],
        emptyState: emptyFor('heart-pulse', 'No health profiles', 'Create a profile at admission so the infirmary has a baseline.'),
      }));
    },
  },

  /* ----------------------------------------------- health/medical-history */
  'health/medical-history': {
    title: 'Medical History',
    subtitle: 'Chronic conditions, past episodes and clearances',
    section: 'health',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.healthRecords, ctx).map((r) => {
        const visits = db.infirmaryVisits.filter((v) => v.studentId === r.studentId);
        return {
          ...r,
          visitCount: visits.length,
          lastVisit: visits.length ? sortBy(visits, 'date', 'desc')[0].date : null,
          condition: r.chronicConditions && r.chronicConditions !== 'None' ? r.chronicConditions : 'None declared',
          sportsClearance: r.status === 'Fit' ? 'Cleared' : r.status === 'Referred' ? 'Withheld' : 'Conditional',
          notes: r.chronicConditions && r.chronicConditions !== 'None'
            ? `Managed condition — medication kept with the infirmary, guardian briefed at admission.`
            : 'No chronic condition declared by the guardian at admission.',
        };
      });

      mount.appendChild(listPage({
        title: 'Medical history',
        subtitle: `${rows.filter((r) => r.condition !== 'None declared').length} students with a declared condition · ${num(db.infirmaryVisits.length)} infirmary episodes on file`,
        route: 'health/medical-history',
        actions: pageActions(
          Button('Allergy watchlist', { variant: 'secondary', icon: 'alert-triangle', route: 'health/allergies' }),
          Button('Record a condition', { variant: 'primary', icon: 'file-plus', onClick: () => Modal({
            title: 'Record a medical condition', size: 'lg', icon: 'stethoscope',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Student', required: true, className: 'col-span-full' },
                Combobox({ options: db.students.slice(0, 250).map((s) => ({ value: s.id, label: `${s.name} · ${s.className}` })) })),
              Field({ label: 'Condition', required: true }, Input({ placeholder: 'Asthma' })),
              Field({ label: 'Diagnosed on' }, DatePicker({})),
              Field({ label: 'Treating doctor' }, Input({ placeholder: 'Dr. …' })),
              Field({ label: 'Medication kept at school' }, Switch('Inhaler / EpiPen held by the infirmary', {})),
              Field({ label: 'Sports clearance' }, Select({ options: ['Cleared', 'Conditional', 'Withheld'] })),
              Field({ label: 'Care plan', className: 'col-span-full' }, Textarea({ rows: 3, placeholder: 'What staff should do if symptoms appear.' })),
              Field({ label: 'Doctor’s note', className: 'col-span-full' }, FileUpload({ label: 'Attach the prescription or certificate' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Save', { variant: 'primary', onClick: () => { close(); saved('Medical record'); } })),
          }) })),
        kpis: [
          { label: 'Declared conditions', value: String(rows.filter((r) => r.condition !== 'None declared').length), icon: 'stethoscope', tone: 'brand' },
          { label: 'Sports clearance withheld', value: String(rows.filter((r) => r.sportsClearance === 'Withheld').length), icon: 'dumbbell', tone: 'danger' },
          { label: 'Repeat visitors (3+)', value: String(rows.filter((r) => r.visitCount >= 3).length), icon: 'history', tone: 'warning' },
          { label: 'Insurance on file', value: `${Math.round((rows.filter((r) => r.insurancePolicy).length / Math.max(1, rows.length)) * 100)}%`, icon: 'shield', tone: 'info' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Student or condition…', width: '250px' },
          { id: 'sportsClearance', label: 'Sports clearance', options: ['Cleared', 'Conditional', 'Withheld'] },
          { id: 'hasCondition', label: 'Condition', options: [{ value: 'yes', label: 'Declared' }, { value: 'no', label: 'None' }] },
          { id: 'status', label: 'Status', options: ['Fit', 'Under Observation', 'Referred'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.studentName} ${r.condition}`.toLowerCase().includes(String(x).toLowerCase()),
          sportsClearance: (r, x) => r.sportsClearance === x,
          hasCondition: (r, x) => (x === 'yes' ? r.condition !== 'None declared' : r.condition === 'None declared'),
          status: (r, x) => r.status === x,
        })),
        chart: donutChart({
          data: countBy(rows.filter((r) => r.condition !== 'None declared'), 'condition').map((c) => ({ key: c.key, value: c.value })),
          height: 270, centerValue: String(rows.filter((r) => r.condition !== 'None declared').length), centerLabel: 'Conditions',
        }),
        chartTitle: 'Declared chronic conditions',
        columns: [
          { key: 'studentName', label: 'Student', sticky: true, width: 240, render: (r) => Identity(r.studentName, `${r.className}-${r.section}`) },
          { key: 'condition', label: 'Condition', width: 200, filter: true, render: (r) => (r.condition === 'None declared' ? h('span', { className: 't-muted' }, r.condition) : Badge(r.condition, { tone: 'warning' })) },
          { key: 'allergies', label: 'Allergies', width: 150, render: (r) => (r.allergies === 'None' ? h('span', { className: 't-muted' }, 'None') : Badge(r.allergies, { tone: 'danger' })) },
          { key: 'visitCount', label: 'Infirmary visits', width: 150, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'lastVisit', label: 'Last visit', width: 140, render: (r) => (r.lastVisit ? dt(r.lastVisit) : '—') },
          { key: 'familyDoctor', label: 'Family doctor', width: 200 },
          { key: 'insurancePolicy', label: 'Insurance', width: 140, render: (r) => (r.insurancePolicy ? h('span', { className: 't-mono' }, r.insurancePolicy) : h('span', { className: 't-muted' }, 'Not on file')) },
          { key: 'sportsClearance', label: 'Sports', width: 140, filter: true, render: (r) => Badge(r.sportsClearance === 'Cleared' ? 'Approved' : r.sportsClearance === 'Withheld' ? 'Rejected' : 'Under Review') },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['studentName', 'condition', 'allergies'],
        expandable: (r) => Card({ pad: true },
          h('div', { className: 'stack-2' },
            h('div', { className: 't-eyebrow' }, 'Care note'),
            h('div', { className: 't-sm' }, r.notes),
            h('div', { className: 'row-3 row-wrap mt-2' },
              Button('Open health record', { variant: 'secondary', size: 'sm', icon: 'heart-pulse', route: `health/profiles/${r.studentId}` }),
              Button('Infirmary log', { variant: 'ghost', size: 'sm', icon: 'first-aid', route: 'health/infirmary' })))),
        bulkActions: [
          { label: 'Brief class teachers', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} class teachers briefed`, tone: 'success' }) },
          { label: 'Request updated certificate', icon: 'file-text', onClick: (sel) => notify({ title: `${sel.length} requests sent to guardians`, tone: 'info' }) },
        ],
        onRowClick: (r) => navigate(`health/profiles/${r.studentId}`),
        rowActions: (r) => [
          { label: 'Health record', icon: 'heart-pulse', route: `health/profiles/${r.studentId}` },
          { label: 'Student profile', icon: 'user', route: `students/profile/${r.studentId}` },
        ],
        emptyState: emptyFor('history', 'No medical history', 'Nothing has been declared or recorded for this campus yet.'),
      }));
    },
  },

  /* ----------------------------------------------------- health/allergies */
  'health/allergies': {
    title: 'Allergies',
    subtitle: 'Watchlist shared with the mess, infirmary and class teachers',
    section: 'health',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.healthRecords.filter((r) => r.allergies && r.allergies !== 'None'), ctx).map((r) => ({
        ...r,
        severity: pickOf(['Mild', 'Moderate', 'Severe', 'Severe'], 'as' + r.id),
        epiPen: boolOf('ep' + r.id, 26),
        trigger: r.allergies,
        action: pickOf([
          'Antihistamine as prescribed; observe for 30 minutes.',
          'Remove the trigger, give the prescribed inhaler and call the guardian.',
          'Administer the EpiPen held in the infirmary and call 108 immediately.',
        ], 'aa' + r.id),
        messFlagged: true,
      }));

      mount.appendChild(listPage({
        title: 'Allergy watchlist',
        subtitle: `${rows.length} students with a declared allergy · ${rows.filter((r) => r.severity === 'Severe').length} severe`,
        route: 'health/allergies',
        actions: pageActions(
          Button('Print mess list', { variant: 'secondary', icon: 'print', onClick: mockAction('Print mess allergy list') }),
          Button('Add an allergy', { variant: 'primary', icon: 'alert-triangle', onClick: () => Modal({
            title: 'Record an allergy', size: 'md', icon: 'alert-triangle', tone: 'danger',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Student', required: true, className: 'col-span-full' },
                Combobox({ options: db.students.slice(0, 250).map((s) => ({ value: s.id, label: `${s.name} · ${s.className}` })) })),
              Field({ label: 'Allergen', required: true }, Select({ options: ['Peanuts', 'Dust', 'Pollen', 'Penicillin', 'Seafood', 'Lactose', 'Egg', 'Soy'] })),
              Field({ label: 'Severity', required: true }, Select({ options: ['Mild', 'Moderate', 'Severe'] })),
              Field({ label: 'EpiPen held at school' }, Switch('Auto-injector kept in the infirmary', {})),
              Field({ label: 'Flag to the mess' }, Switch('Add to the kitchen allergen list', { checked: true })),
              Field({ label: 'Emergency action', className: 'col-span-full' }, Textarea({ rows: 3, placeholder: 'Exactly what staff should do.' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Add to watchlist', { variant: 'danger', onClick: () => { close(); notify({ title: 'Added to the watchlist', text: 'The mess and class teachers have been notified.', tone: 'warning' }); } })),
          }) })),
        notes: Callout({ tone: 'danger', icon: 'alert-triangle', title: 'Severe allergies' },
          `${rows.filter((r) => r.severity === 'Severe').length} students carry a severe allergy. Their photograph and action plan are posted in the infirmary and the mess kitchen, and the auto-injector is stored with the school nurse.`),
        kpis: [
          { label: 'On the watchlist', value: String(rows.length), icon: 'alert-triangle', tone: 'brand' },
          { label: 'Severe', value: String(rows.filter((r) => r.severity === 'Severe').length), icon: 'siren', tone: 'danger' },
          { label: 'EpiPen at school', value: String(rows.filter((r) => r.epiPen).length), icon: 'syringe', tone: 'warning' },
          { label: 'Food allergens', value: String(rows.filter((r) => ['Peanuts', 'Seafood', 'Lactose'].includes(r.allergies)).length), icon: 'utensils', tone: 'info' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Student or allergen…', width: '250px' },
          { id: 'allergies', label: 'Allergen', options: ['Peanuts', 'Dust', 'Pollen', 'Penicillin', 'Seafood', 'Lactose'] },
          { id: 'severity', label: 'Severity', options: ['Mild', 'Moderate', 'Severe'] },
          { id: 'className', label: 'Class', options: Array.from(new Set(rows.map((r) => r.className))).sort() },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.studentName} ${r.allergies}`.toLowerCase().includes(String(x).toLowerCase()),
          allergies: (r, x) => r.allergies === x,
          severity: (r, x) => r.severity === x,
          className: (r, x) => r.className === x,
        })),
        chart: barChart({
          categories: countBy(rows, 'allergies').map((c) => c.key),
          series: [{ name: 'Students', values: countBy(rows, 'allergies').map((c) => c.value) }],
          horizontal: true, height: 280, showValues: true,
        }),
        chartTitle: 'Allergens across the student body',
        columns: [
          { key: 'studentName', label: 'Student', sticky: true, width: 240, render: (r) => Identity(r.studentName, `${r.className}-${r.section}`) },
          { key: 'allergies', label: 'Allergen', width: 150, filter: true, render: (r) => Badge(r.allergies, { tone: 'danger' }) },
          { key: 'severity', label: 'Severity', width: 130, filter: true, render: (r) => Badge(r.severity === 'Severe' ? 'Overdue' : r.severity === 'Moderate' ? 'Pending' : 'New', { tone: r.severity === 'Severe' ? 'danger' : r.severity === 'Moderate' ? 'warning' : 'info', icon: 'alert-triangle' }) },
          { key: 'epiPen', label: 'Auto-injector', width: 150, value: (r) => (r.epiPen ? 1 : 0), render: (r) => (r.epiPen ? Badge('Held at school', { tone: 'warning', icon: 'syringe' }) : h('span', { className: 't-muted' }, '—')) },
          { key: 'action', label: 'Emergency action', width: 340 },
          { key: 'emergencyContact', label: 'Emergency contact', width: 170, className: 't-mono' },
          { key: 'messFlagged', label: 'Mess', width: 120, value: (r) => 1, render: () => Badge('Flagged', { tone: 'success', icon: 'utensils' }) },
        ],
        rows, selectable: true, pageSize: 25,
        searchKeys: ['studentName', 'allergies', 'className'],
        bulkActions: [
          { label: 'Notify class teachers', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} teachers briefed`, tone: 'success' }) },
          { label: 'Send to the mess', icon: 'utensils', onClick: (sel) => notify({ title: 'Kitchen allergen list updated', text: `${sel.length} students`, tone: 'success' }) },
        ],
        onRowClick: (r) => navigate(`health/profiles/${r.studentId}`),
        rowActions: (r) => [
          { label: 'Health record', icon: 'heart-pulse', route: `health/profiles/${r.studentId}` },
          { label: 'Call guardian', icon: 'phone-call', onClick: () => notify({ title: 'Dialling guardian', text: r.emergencyContact, tone: 'warning' }) },
        ],
        emptyState: emptyFor('shield-check', 'No allergies declared', 'No guardian has declared an allergy for this campus.'),
      }));
    },
  },

  /* ------------------------------------------------------ health/checkups */
  'health/checkups': {
    title: 'Health Checkups',
    subtitle: 'Annual physicals, dental and vision camps',
    section: 'health',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(checkups(), ctx);
      const campaigns = countBy(rows, 'campaign');

      mount.appendChild(listPage({
        title: 'Health checkups',
        subtitle: `${num(rows.length)} checkup records across ${campaigns.length} campaigns`,
        route: 'health/checkups',
        actions: pageActions(
          Button('Print camp roster', { variant: 'secondary', icon: 'print', onClick: mockAction('Print camp roster') }),
          Button('Plan a campaign', { variant: 'primary', icon: 'clipboard-check', onClick: () => Modal({
            title: 'Plan a checkup campaign', size: 'lg', icon: 'clipboard-check',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Campaign name', required: true, className: 'col-span-full' }, Input({ placeholder: 'Annual Physical 2026-27' })),
              Field({ label: 'Type' }, Select({ options: ['General physical', 'Dental', 'Vision', 'Cardiac', 'Nutrition'] })),
              Field({ label: 'Classes covered' }, MultiSelect({ options: Array.from(new Set(db.students.map((s) => s.className))).slice(0, 14), values: [] })),
              Field({ label: 'From' }, DatePicker({ value: TODAY })),
              Field({ label: 'To' }, DatePicker({})),
              Field({ label: 'Visiting doctor' }, Input({ placeholder: 'Dr. Anjali Menon' })),
              Field({ label: 'Venue' }, Select({ options: ['Infirmary', 'Activity Hall', 'Auditorium'] })),
              Field({ label: 'Notify guardians', className: 'col-span-full' }, Switch('Send a consent request to guardians', { checked: true }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Create campaign', { variant: 'primary', onClick: () => { close(); saved('Campaign'); } })),
          }) })),
        kpis: [
          { label: 'Checkups', value: num(rows.length), icon: 'clipboard-check', tone: 'brand' },
          { label: 'Completed', value: num(rows.filter((r) => r.status === 'Completed').length), icon: 'check-circle', tone: 'success' },
          { label: 'Referred out', value: String(rows.filter((r) => r.outcome.startsWith('Referred')).length), icon: 'stethoscope', tone: 'danger' },
          { label: 'Follow-up advised', value: String(rows.filter((r) => r.outcome.startsWith('Follow')).length), icon: 'history', tone: 'warning' },
        ],
        tabs: campaigns.slice(0, 4).map((c) => ({ id: c.key, label: c.key, count: c.value })),
        activeTab: campaigns[0] ? campaigns[0].key : undefined,
        onTabChange: (id) => notify({ title: `Showing ${id}`, tone: 'info' }),
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Student or class…', width: '250px' },
          { id: 'campaign', label: 'Campaign', options: campaigns.map((c) => c.key) },
          { id: 'bmiBand', label: 'BMI band', options: ['Underweight', 'Healthy', 'Overweight', 'Obese'] },
          { id: 'status', label: 'Status', options: ['Completed', 'Scheduled'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.studentName} ${r.className}`.toLowerCase().includes(String(x).toLowerCase()),
          campaign: (r, x) => r.campaign === x,
          bmiBand: (r, x) => r.bmiBand === x,
          status: (r, x) => r.status === x,
        })),
        chart: scatterPlot({
          points: rows.slice(0, 400).map((r) => ({ x: r.heightCm, y: r.weightKg, label: r.studentName, group: r.bmiBand === 'Healthy' ? 'Healthy' : r.bmiBand === 'Underweight' ? 'Underweight' : 'Above healthy range' })),
          xLabel: 'Height (cm)', yLabel: 'Weight (kg)', height: 320,
        }),
        chartTitle: 'Height against weight, banded by BMI',
        columns: [
          { key: 'studentName', label: 'Student', sticky: true, width: 240, render: (r) => Identity(r.studentName, `${r.className}-${r.section}`) },
          { key: 'campaign', label: 'Campaign', width: 230, filter: true },
          { key: 'date', label: 'Examined', width: 140, render: (r) => dt(r.date) },
          { key: 'heightCm', label: 'Height', width: 100, align: 'right', numeric: true, render: (r) => `${r.heightCm}`, aggregate: 'avg', format: (v) => v.toFixed(0) },
          { key: 'weightKg', label: 'Weight', width: 100, align: 'right', numeric: true, aggregate: 'avg', format: (v) => v.toFixed(0) },
          { key: 'bmi', label: 'BMI', width: 90, align: 'right', numeric: true, aggregate: 'avg', format: (v) => v.toFixed(1) },
          { key: 'bmiBand', label: 'Band', width: 140, filter: true, render: (r) => Badge(r.bmiBand, { tone: bmiTone(r.bmi) }) },
          { key: 'vision', label: 'Vision', width: 110, filter: true },
          { key: 'dental', label: 'Dental', width: 110, filter: true },
          { key: 'examinedBy', label: 'Examined by', width: 190, filter: true },
          { key: 'outcome', label: 'Outcome', width: 200, render: (r) => Badge(r.outcome === 'Fit' ? 'Verified' : r.outcome.startsWith('Referred') ? 'Overdue' : 'Pending', { tone: r.outcome === 'Fit' ? 'success' : r.outcome.startsWith('Referred') ? 'danger' : 'warning' }) },
          { key: 'nextDate', label: 'Next due', width: 140, render: (r) => dt(r.nextDate) },
          { key: 'status', label: 'Status', width: 130, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, footerAggregates: true, pageSize: 25,
        searchKeys: ['studentName', 'className', 'campaign', 'examinedBy'],
        bulkActions: [
          { label: 'Share reports with guardians', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} reports shared`, tone: 'success' }) },
          { label: 'Schedule follow-up', icon: 'calendar-plus', onClick: (sel) => notify({ title: `${sel.length} follow-ups booked`, tone: 'info' }) },
        ],
        onRowClick: (r) => navigate(`health/profiles/${r.studentId}`),
        rowActions: (r) => [
          { label: 'Health record', icon: 'heart-pulse', route: `health/profiles/${r.studentId}` },
          { label: 'Print report card', icon: 'print', onClick: mockAction('Print health report') },
        ],
        emptyState: emptyFor('clipboard-check', 'No checkups', 'Plan a campaign to start recording physicals.'),
      }));
    },
  },

  /* ----------------------------------------------------- health/infirmary */
  'health/infirmary': {
    title: 'Infirmary Visits',
    subtitle: 'Visit log with vitals entry',
    section: 'health',
    render(mount, ctx) {
      ensureStyles();
      const visits = scope(db.infirmaryVisits, ctx);
      const session = [];
      const sessionHost = h('div');

      const vitals = { temp: '', pulse: '', spo2: '', bp: '' };
      const complaintInput = Input({ placeholder: 'Headache, fever, sprained ankle…' });
      const treatmentInput = Input({ placeholder: 'Rest & ORS, antiseptic applied, paracetamol 250 mg…' });
      let sentHome = false;
      const studentPicker = Combobox({
        options: db.students.slice(0, 250).map((s) => ({ value: s.id, label: `${s.name} · ${s.className} · ${s.admissionNo}` })),
        placeholder: 'Search by name or admission number…',
      });

      const paintSession = () => {
        sessionHost.innerHTML = '';
        if (!session.length) {
          sessionHost.appendChild(emptyFor('first-aid', 'No visits logged yet today',
            'Fill in the form on the left as each student arrives. Vitals are optional but recommended for anything beyond a minor cut.'));
          return;
        }
        sessionHost.appendChild(Timeline(session.map((s) => ({
          title: s.name, meta: `${s.time} · ${s.complaint}`, icon: 'first-aid',
          tone: s.sentHome ? 'warning' : 'success',
          text: `${s.treatment}${s.temp ? ` · ${s.temp}°C` : ''}${s.pulse ? ` · pulse ${s.pulse}` : ''}${s.sentHome ? ' · sent home' : ' · returned to class'}`,
        }))));
      };
      paintSession();

      const logVisit = () => {
        const sid = studentPicker.getValue ? studentPicker.getValue() : null;
        const student = sid ? byId(db.students, sid) : null;
        if (!student) { notify({ title: 'Pick a student first', text: 'Search the student in the box above.', tone: 'warning' }); return; }
        const complaint = String(complaintInput.value || '').trim();
        if (!complaint) { notify({ title: 'Complaint is required', text: 'Say what the student came in with.', tone: 'warning' }); return; }
        session.unshift({
          name: student.name,
          time: pingTime(new Date().toISOString()),
          complaint,
          treatment: String(treatmentInput.value || '').trim() || 'Observation only',
          temp: vitals.temp, pulse: vitals.pulse,
          sentHome,
        });
        paintSession();
        notify({ title: 'Visit logged', text: `${student.name} · ${complaint}`, tone: 'success', icon: 'first-aid' });
        complaintInput.value = '';
        treatmentInput.value = '';
      };

      const vitalInput = (key, label, placeholder, suffix) => Field({ label },
        Input({ placeholder, suffix, onInput: (v) => { vitals[key] = v; } }));

      const entryCard = SectionCard({
        title: 'Log a visit', icon: 'first-aid',
        subtitle: 'Record who came in, what was wrong and what was done.',
      },
        h('div', { className: 'stack-3' },
          Field({ label: 'Student', required: true }, studentPicker),
          FormGrid({ cols: 2 },
            Field({ label: 'Complaint', required: true }, complaintInput),
            Field({ label: 'Assessment' },
              Select({ options: ['Mild dehydration', 'Viral symptoms', 'Minor abrasion', 'Motion sickness', 'Muscle strain', 'Observation only'] })),
            Field({ label: 'Treatment given', className: 'col-span-full' }, treatmentInput)),
          Divider({ label: 'Vitals' }),
          FormGrid({ cols: 4 },
            vitalInput('temp', 'Temperature', '98.6', '°F'),
            vitalInput('pulse', 'Pulse', '82', 'bpm'),
            vitalInput('spo2', 'SpO₂', '98', '%'),
            vitalInput('bp', 'Blood pressure', '110/70', 'mmHg')),
          FormGrid({ cols: 2 },
            Field({ label: 'Parent informed' }, Switch('Guardian called', { checked: true })),
            Field({ label: 'Sent home' }, Switch('Student sent home', { onChange: (v) => { sentHome = !!v; } }))),
          FormActions(
            Button('Log visit', { variant: 'primary', icon: 'check', onClick: logVisit }),
            Button('Clear', { variant: 'ghost', onClick: () => { complaintInput.value = ''; treatmentInput.value = ''; } }))));

      const table = DataTable({
        rows: visits, pageSize: 25, selectable: true,
        searchKeys: ['studentName', 'complaint', 'diagnosis', 'className'],
        exportName: 'infirmary-visits',
        columns: [
          { key: 'date', label: 'Date', sticky: true, width: 130, render: (r) => h('div', null, h('div', null, dt(r.date)), h('div', { className: 't-xs t-muted' }, r.time)) },
          { key: 'studentName', label: 'Student', width: 230, render: (r) => Identity(r.studentName, `${r.className}-${r.section}`) },
          { key: 'complaint', label: 'Complaint', width: 170, filter: true },
          { key: 'diagnosis', label: 'Assessment', width: 180, filter: true },
          { key: 'treatment', label: 'Treatment', width: 220 },
          { key: 'medicineGiven', label: 'Medicine', width: 120, value: (r) => (r.medicineGiven ? 1 : 0), render: (r) => (r.medicineGiven ? Badge('Given', { tone: 'info', icon: 'pill' }) : h('span', { className: 't-muted' }, '—')) },
          { key: 'durationMin', label: 'Duration', width: 110, align: 'right', numeric: true, render: (r) => `${r.durationMin} min`, aggregate: 'avg', format: (v) => `${v.toFixed(0)} min` },
          { key: 'attendedByName', label: 'Attended by', width: 190, filter: true },
          { key: 'parentInformed', label: 'Parent', width: 120, value: (r) => (r.parentInformed ? 1 : 0), render: (r) => (r.parentInformed ? Badge('Informed', { tone: 'success' }) : Badge('Not informed', { tone: 'neutral' })) },
          { key: 'sentHome', label: 'Outcome', width: 150, value: (r) => (r.sentHome ? 1 : 0), render: (r) => Badge(r.sentHome ? 'Sent home' : 'Returned to class', { tone: r.sentHome ? 'warning' : 'success' }) },
        ],
        rowActions: (r) => [
          { label: 'Health record', icon: 'heart-pulse', route: `health/profiles/${r.studentId}` },
          { label: 'Medication log', icon: 'pill', route: 'health/medication' },
          { label: 'Call guardian', icon: 'phone-call', onClick: () => notify({ title: 'Dialling guardian', text: r.studentName, tone: 'info' }) },
        ],
        bulkActions: [
          { label: 'Notify guardians', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} guardians notified`, tone: 'success' }) },
          { label: 'Export log', icon: 'download', onClick: (sel) => notify({ title: `${sel.length} rows exported`, tone: 'success' }) },
        ],
        onRowClick: (r) => navigate(`health/profiles/${r.studentId}`),
        emptyState: emptyFor('first-aid', 'No visits logged', 'The infirmary log is empty for this campus.'),
      });

      const byComplaint = countBy(visits, 'complaint');

      mount.appendChild(page({
        title: 'Infirmary visits',
        subtitle: `${num(visits.length)} visits this session · ${visits.filter((v) => v.sentHome).length} students sent home`,
        route: 'health/infirmary',
        actions: pageActions(
          Button('Medication log', { variant: 'secondary', icon: 'pill', route: 'health/medication' }),
          Button('Report an injury', { variant: 'primary', icon: 'alert-circle', route: 'health/incidents' })),
        children: [
          kpiRow([
            { label: 'Visits', value: num(visits.length), icon: 'first-aid', tone: 'brand' },
            { label: 'Medicine given', value: num(visits.filter((v) => v.medicineGiven).length), icon: 'pill', tone: 'info' },
            { label: 'Sent home', value: num(visits.filter((v) => v.sentHome).length), icon: 'log-out', tone: 'warning' },
            { label: 'Follow-ups', value: num(visits.filter((v) => v.followUp).length), icon: 'history', tone: 'danger' },
          ]),
          h('div', { className: 'detail-split' },
            entryCard,
            SectionCard({ title: 'This session', icon: 'history', subtitle: 'Visits you have logged since opening this screen' }, sessionHost)),
          h('div', { className: 'grid grid-2' },
            chartCard('Why students come in',
              barChart({
                categories: byComplaint.slice(0, 10).map((c) => c.key),
                series: [{ name: 'Visits', values: byComplaint.slice(0, 10).map((c) => c.value) }],
                horizontal: true, height: 300, showValues: true,
              }), 'Presenting complaints across the session'),
            chartCard('Visits by class group',
              donutChart({
                data: countBy(visits, 'className').slice(0, 6).map((c) => ({ key: c.key, value: c.value })),
                height: 300, centerValue: String(visits.length), centerLabel: 'Visits',
              }), 'Which classes use the infirmary most')),
          SectionCard({ title: 'Visit log', subtitle: `${num(visits.length)} records`, flush: true }, table),
        ],
      }));
    },
  },

  /* ---------------------------------------------------- health/medication */
  'health/medication': {
    title: 'Medication Log',
    subtitle: 'Every dose administered at school, with consent',
    section: 'health',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(medicationLog(), ctx);

      mount.appendChild(listPage({
        title: 'Medication log',
        subtitle: `${num(rows.length)} doses administered · ${rows.filter((r) => r.consent !== 'Parent consent on file').length} under a standing order`,
        route: 'health/medication',
        actions: pageActions(
          Button('Infirmary log', { variant: 'secondary', icon: 'first-aid', route: 'health/infirmary' }),
          Button('Record a dose', { variant: 'primary', icon: 'pill', onClick: () => Modal({
            title: 'Record a dose', size: 'lg', icon: 'pill',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Student', required: true, className: 'col-span-full' },
                Combobox({ options: db.students.slice(0, 250).map((s) => ({ value: s.id, label: `${s.name} · ${s.className}` })) })),
              Field({ label: 'Medicine', required: true }, Select({ options: ['Paracetamol 250mg', 'ORS Sachet', 'Cetirizine 5mg', 'Domperidone 5ml', 'Antiseptic (Povidone-Iodine)', 'Salbutamol Inhaler', 'Digene Syrup', 'Ibuprofen 200mg'] })),
              Field({ label: 'Dose', required: true }, Select({ options: ['1 tablet', '5 ml', '10 ml', '2 puffs', 'Topical', '1 sachet'] })),
              Field({ label: 'Route' }, Select({ options: ['Oral', 'Topical', 'Inhalation'] })),
              Field({ label: 'Indication' }, Input({ placeholder: 'Fever, headache…' })),
              Field({ label: 'Date' }, DatePicker({ value: TODAY })),
              Field({ label: 'Time' }, TimePicker({ value: '11:30' })),
              Field({ label: 'Consent', className: 'col-span-full' }, Select({ options: ['Parent consent on file', 'Standing order', 'Telephonic consent taken'] })),
              Field({ label: 'Inform the guardian', className: 'col-span-full' }, Switch('Send an SMS to the registered guardian', { checked: true }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Record dose', { variant: 'primary', onClick: () => { close(); saved('Dose'); } })),
          }) })),
        notes: Callout({ tone: 'warning', icon: 'shield', title: 'Consent rule' },
          'No prescription medicine may be given without written consent from the guardian or a telephonic consent noted here. Over-the-counter items on the standing-order list are the only exception.'),
        kpis: [
          { label: 'Doses', value: num(rows.length), icon: 'pill', tone: 'brand' },
          { label: 'With written consent', value: num(rows.filter((r) => r.consent === 'Parent consent on file').length), icon: 'check-circle', tone: 'success' },
          { label: 'Guardian informed', value: `${Math.round((rows.filter((r) => r.parentInformed).length / Math.max(1, rows.length)) * 100)}%`, icon: 'send', tone: 'info' },
          { label: 'Different medicines', value: String(new Set(rows.map((r) => r.medicine)).size), icon: 'package', tone: 'warning' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Student or medicine…', width: '250px' },
          { id: 'medicine', label: 'Medicine', options: Array.from(new Set(rows.map((r) => r.medicine))) },
          { id: 'route', label: 'Route', options: ['Oral', 'Topical', 'Inhalation'] },
          { id: 'consent', label: 'Consent', options: ['Parent consent on file', 'Standing order'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.studentName} ${r.medicine}`.toLowerCase().includes(String(x).toLowerCase()),
          medicine: (r, x) => r.medicine === x,
          route: (r, x) => r.route === x,
          consent: (r, x) => r.consent === x,
        })),
        chart: barChart({
          categories: countBy(rows, 'medicine').map((c) => c.key),
          series: [{ name: 'Doses', values: countBy(rows, 'medicine').map((c) => c.value) }],
          horizontal: true, height: 300, showValues: true,
        }),
        chartTitle: 'What the infirmary dispenses',
        columns: [
          { key: 'date', label: 'Date', sticky: true, width: 130, render: (r) => h('div', null, h('div', null, dt(r.date)), h('div', { className: 't-xs t-muted' }, r.time)) },
          { key: 'studentName', label: 'Student', width: 230, render: (r) => Identity(r.studentName, `${r.className}-${r.section}`) },
          { key: 'medicine', label: 'Medicine', width: 220, filter: true },
          { key: 'dose', label: 'Dose', width: 110 },
          { key: 'route', label: 'Route', width: 120, filter: true },
          { key: 'indication', label: 'Indication', width: 170, filter: true },
          { key: 'administeredBy', label: 'Administered by', width: 200, filter: true },
          { key: 'stockSource', label: 'Stock source', width: 180, hidden: true },
          { key: 'consent', label: 'Consent', width: 210, filter: true, render: (r) => Badge(r.consent === 'Parent consent on file' ? 'Verified' : 'Pending', { tone: r.consent === 'Parent consent on file' ? 'success' : 'warning', icon: 'shield' }) },
          { key: 'parentInformed', label: 'Guardian', width: 130, value: (r) => (r.parentInformed ? 1 : 0), render: (r) => (r.parentInformed ? Badge('Informed', { tone: 'success' }) : Badge('Not informed', { tone: 'neutral' })) },
          { key: 'status', label: 'Status', width: 140, render: (r) => Badge('Completed') },
        ],
        rows, selectable: true, pageSize: 25,
        searchKeys: ['studentName', 'medicine', 'indication'],
        bulkActions: [
          { label: 'Notify guardians', icon: 'send', onClick: (sel) => notify({ title: `${sel.length} guardians notified`, tone: 'success' }) },
          { label: 'Export for audit', icon: 'download', onClick: (sel) => notify({ title: `${sel.length} rows exported`, tone: 'success' }) },
        ],
        onRowClick: (r) => navigate(`health/profiles/${r.studentId}`),
        rowActions: (r) => [
          { label: 'Health record', icon: 'heart-pulse', route: `health/profiles/${r.studentId}` },
          { label: 'Related visit', icon: 'first-aid', route: 'health/infirmary' },
          { label: 'Medical supplies stock', icon: 'package', route: 'inventory/items' },
        ],
        emptyState: emptyFor('pill', 'No doses recorded', 'Nothing has been administered at school this session.'),
      }));
    },
  },

  /* ---------------------------------------------------- health/incidents */
  'health/incidents': {
    title: 'Injuries & Incidents',
    subtitle: 'Injury reports, first aid and follow-up',
    section: 'health',
    render(mount, ctx) {
      ensureStyles();
      const base = db.incidents.filter((i) => i.type === 'Student Injury' || i.type === 'Medical Emergency');
      const extra = db.infirmaryVisits.filter((v) => ['Minor cut', 'Sprained ankle', 'Nose bleed', 'Allergic reaction'].includes(v.complaint));
      const rows = scope(base, ctx).map((i) => {
        const s = db.students[hashOf('is' + i.id) % db.students.length];
        return {
          id: i.id, reference: i.reference, date: i.date, time: i.time, campusId: i.campusId,
          studentId: s.id, studentName: s.name, className: s.className, section: s.section,
          type: i.type, severity: i.severity, location: i.location,
          description: i.description, actionTaken: i.actionTaken,
          firstAidBy: pickOf(['School Nurse', 'PE Teacher', 'Class Teacher', 'Lab Assistant'], 'fa' + i.id),
          hospitalReferral: i.severity === 'High' || i.severity === 'Critical',
          parentInformed: true,
          reportedBy: i.reportedBy,
          followUpDate: i.followUpDate,
          status: i.status,
        };
      }).concat(scope(extra, ctx).slice(0, 90).map((v) => ({
        id: 'INJ' + v.id,
        reference: `INJ/26/${v.id.slice(-4)}`,
        date: v.date, time: v.time, campusId: v.campusId,
        studentId: v.studentId, studentName: v.studentName, className: v.className, section: v.section,
        type: 'Student Injury',
        severity: v.sentHome ? 'Medium' : 'Low',
        location: pickOf(['Playground', 'Corridor Block B', 'Science Lab', 'Sports Field', 'Classroom'], 'il' + v.id),
        description: `${v.complaint} reported during the school day; ${v.diagnosis.toLowerCase()}.`,
        actionTaken: v.treatment,
        firstAidBy: v.attendedByName || 'School Nurse',
        hospitalReferral: v.treatment === 'Referred to hospital',
        parentInformed: v.parentInformed,
        reportedBy: 'Infirmary',
        followUpDate: v.followUp ? v.date : null,
        status: v.followUp ? 'Open' : 'Closed',
      })));

      mount.appendChild(listPage({
        title: 'Injuries & incidents',
        subtitle: `${rows.length} reports · ${rows.filter((r) => r.hospitalReferral).length} referred to hospital`,
        route: 'health/incidents',
        actions: pageActions(
          Button('Security register', { variant: 'secondary', icon: 'shield', route: 'security/incidents' }),
          Button('Report an injury', { variant: 'primary', icon: 'alert-circle', onClick: () => Modal({
            title: 'Report an injury', size: 'lg', icon: 'alert-circle', tone: 'danger',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Student', required: true, className: 'col-span-full' },
                Combobox({ options: db.students.slice(0, 250).map((s) => ({ value: s.id, label: `${s.name} · ${s.className}` })) })),
              Field({ label: 'Date', required: true }, DatePicker({ value: TODAY })),
              Field({ label: 'Time' }, TimePicker({ value: '11:15' })),
              Field({ label: 'Location', required: true }, Select({ options: ['Playground', 'Corridor Block B', 'Science Lab', 'Sports Field', 'Classroom', 'Cafeteria', 'Bus Bay'] })),
              Field({ label: 'Severity', required: true }, Select({ options: ['Low', 'Medium', 'High', 'Critical'] })),
              Field({ label: 'First aid by' }, Select({ options: ['School Nurse', 'PE Teacher', 'Class Teacher', 'Lab Assistant'] })),
              Field({ label: 'Hospital referral' }, Switch('Referred to a hospital', {})),
              Field({ label: 'What happened', className: 'col-span-full' }, Textarea({ rows: 3, placeholder: 'Describe the sequence of events and who witnessed it.' })),
              Field({ label: 'Action taken', className: 'col-span-full' }, Textarea({ rows: 2, placeholder: 'First aid given, guardian called at 11:20…' })),
              Field({ label: 'Photographs', className: 'col-span-full' }, FileUpload({ label: 'Attach photographs if relevant' }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('File report', { variant: 'danger', icon: 'alert-circle', onClick: () => { close(); notify({ title: 'Injury reported', text: 'The guardian, class teacher and principal have been alerted.', tone: 'warning' }); } })),
          }) })),
        kpis: [
          { label: 'Reports', value: String(rows.length), icon: 'alert-circle', tone: 'brand' },
          { label: 'Open', value: String(rows.filter((r) => r.status === 'Open').length), icon: 'inbox', tone: 'warning' },
          { label: 'Hospital referrals', value: String(rows.filter((r) => r.hospitalReferral).length), icon: 'stethoscope', tone: 'danger' },
          { label: 'Guardians informed', value: `${Math.round((rows.filter((r) => r.parentInformed).length / Math.max(1, rows.length)) * 100)}%`, icon: 'phone-call', tone: 'success' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Reference, student or location…', width: '250px' },
          { id: 'severity', label: 'Severity', options: ['Low', 'Medium', 'High', 'Critical'] },
          { id: 'location', label: 'Location', options: Array.from(new Set(rows.map((r) => r.location))) },
          { id: 'status', label: 'Status', options: Array.from(new Set(rows.map((r) => r.status))) },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.reference} ${r.studentName} ${r.location}`.toLowerCase().includes(String(x).toLowerCase()),
          severity: (r, x) => r.severity === x,
          location: (r, x) => r.location === x,
          status: (r, x) => r.status === x,
        })),
        chart: barChart({
          categories: countBy(rows, 'location').map((c) => c.key),
          series: [{ name: 'Incidents', values: countBy(rows, 'location').map((c) => c.value) }],
          horizontal: true, height: 280, showValues: true,
        }),
        chartTitle: 'Where injuries happen',
        columns: [
          { key: 'reference', label: 'Reference', sticky: true, width: 160, className: 't-mono' },
          { key: 'studentName', label: 'Student', width: 230, render: (r) => Identity(r.studentName, `${r.className}-${r.section}`) },
          { key: 'date', label: 'When', width: 140, render: (r) => h('div', null, h('div', null, dt(r.date)), h('div', { className: 't-xs t-muted' }, r.time)) },
          { key: 'location', label: 'Location', width: 180, filter: true },
          { key: 'severity', label: 'Severity', width: 130, filter: true, render: (r) => Badge(r.severity, { tone: r.severity === 'Critical' || r.severity === 'High' ? 'danger' : r.severity === 'Medium' ? 'warning' : 'neutral' }) },
          { key: 'firstAidBy', label: 'First aid by', width: 180, filter: true },
          { key: 'hospitalReferral', label: 'Referral', width: 130, value: (r) => (r.hospitalReferral ? 1 : 0), render: (r) => (r.hospitalReferral ? Badge('Hospital', { tone: 'danger', icon: 'stethoscope' }) : h('span', { className: 't-muted' }, '—')) },
          { key: 'parentInformed', label: 'Guardian', width: 130, value: (r) => (r.parentInformed ? 1 : 0), render: (r) => (r.parentInformed ? Badge('Informed', { tone: 'success' }) : Badge('Pending', { tone: 'warning' })) },
          { key: 'followUpDate', label: 'Follow-up', width: 140, render: (r) => (r.followUpDate ? dt(r.followUpDate) : '—') },
          { key: 'status', label: 'Status', width: 170, filter: true, render: (r) => Badge(r.status) },
        ],
        rows, selectable: true, pageSize: 25,
        searchKeys: ['reference', 'studentName', 'location'],
        expandable: (r) => Card({ pad: true },
          h('div', { className: 'stack-2' },
            h('div', { className: 't-eyebrow' }, 'What happened'),
            h('div', { className: 't-sm' }, r.description),
            h('div', { className: 't-eyebrow mt-3' }, 'Action taken'),
            h('div', { className: 't-sm' }, r.actionTaken),
            h('div', { className: 'row-3 row-wrap mt-3' },
              Badge(`Reported by ${r.reportedBy}`, { tone: 'neutral' }),
              Badge(`First aid: ${r.firstAidBy}`, { tone: 'neutral' }),
              r.hospitalReferral && Badge('Hospital referral', { tone: 'danger' })))),
        bulkActions: [
          { label: 'Close reports', icon: 'check-circle', onClick: (sel) => notify({ title: `${sel.length} reports closed`, tone: 'success' }) },
          { label: 'Escalate to principal', icon: 'trending-up', tone: 'danger', onClick: (sel) => notify({ title: `${sel.length} reports escalated`, tone: 'warning' }) },
        ],
        onRowClick: (r) => navigate(`health/profiles/${r.studentId}`),
        rowActions: (r) => [
          { label: 'Health record', icon: 'heart-pulse', route: `health/profiles/${r.studentId}` },
          { label: 'Infirmary log', icon: 'first-aid', route: 'health/infirmary' },
          { label: 'Call guardian', icon: 'phone-call', onClick: () => notify({ title: 'Dialling guardian', text: r.studentName, tone: 'info' }) },
        ],
        emptyState: emptyFor('shield-check', 'No injuries reported', 'Nothing has been logged for this campus this session.'),
      }));
    },
  },

  /* --------------------------------------------------- health/vaccination */
  'health/vaccination': {
    title: 'Vaccination',
    subtitle: 'Immunisation coverage against the school schedule',
    section: 'health',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(vaccinationRows(), ctx);
      const coverage = VACCINES.map((v) => {
        const list = rows.filter((r) => r.vaccine === v);
        const done = list.filter((r) => r.status === 'Completed').length;
        return { vaccine: v, done, total: list.length, percent: list.length ? Number(((done / list.length) * 100).toFixed(1)) : 0 };
      });

      mount.appendChild(listPage({
        title: 'Vaccination tracker',
        subtitle: `${num(rows.length)} dose records · overall coverage ${(coverage.reduce((a, c) => a + c.percent, 0) / coverage.length).toFixed(1)}%`,
        route: 'health/vaccination',
        actions: pageActions(
          Button('Request certificates', { variant: 'secondary', icon: 'file-text', onClick: () => notify({ title: 'Requests sent', text: 'Guardians of students with a gap have been asked to upload the immunisation card.', tone: 'success' }) }),
          Button('Plan a camp', { variant: 'primary', icon: 'syringe', onClick: () => Modal({
            title: 'Plan a vaccination camp', size: 'md', icon: 'syringe',
            body: FormGrid({ cols: 2 },
              Field({ label: 'Vaccine', required: true, className: 'col-span-full' }, Select({ options: VACCINES })),
              Field({ label: 'Date' }, DatePicker({ value: TODAY })),
              Field({ label: 'Venue' }, Select({ options: ['Infirmary', 'Activity Hall', 'Auditorium'] })),
              Field({ label: 'Classes' }, MultiSelect({ options: Array.from(new Set(db.students.map((s) => s.className))).slice(0, 14), values: [] })),
              Field({ label: 'Partner', className: 'col-span-full' }, Select({ options: ['Govt. PHC', 'District Hospital', 'Private Clinic'] })),
              Field({ label: 'Consent', className: 'col-span-full' }, Switch('Send a consent form to guardians first', { checked: true }))),
            actions: (close) => frag(
              Button('Cancel', { variant: 'ghost', onClick: close }),
              Button('Create camp', { variant: 'primary', onClick: () => { close(); saved('Camp'); } })),
          }) })),
        kpis: [
          { label: 'Dose records', value: num(rows.length), icon: 'syringe', tone: 'brand' },
          { label: 'Completed', value: num(rows.filter((r) => r.status === 'Completed').length), icon: 'check-circle', tone: 'success' },
          { label: 'Due now', value: num(rows.filter((r) => r.status === 'Due').length), icon: 'clock', tone: 'warning' },
          { label: 'Certificate missing', value: num(rows.filter((r) => r.status === 'Completed' && !r.certificate).length), icon: 'file-text', tone: 'danger' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Student or class…', width: '250px' },
          { id: 'vaccine', label: 'Vaccine', options: VACCINES },
          { id: 'status', label: 'Status', options: ['Completed', 'Due', 'Pending'] },
          { id: 'className', label: 'Class', options: Array.from(new Set(rows.map((r) => r.className))).sort().slice(0, 16) },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.studentName} ${r.className}`.toLowerCase().includes(String(x).toLowerCase()),
          vaccine: (r, x) => r.vaccine === x,
          status: (r, x) => r.status === x,
          className: (r, x) => r.className === x,
        })),
        chart: barChart({
          categories: coverage.map((c) => c.vaccine),
          series: [{ name: 'Coverage', values: coverage.map((c) => c.percent) }],
          valueFormat: 'percent', target: 95, targetLabel: 'Target 95%', height: 280, showValues: true,
        }),
        chartTitle: 'Immunisation coverage by vaccine',
        columns: [
          { key: 'studentName', label: 'Student', sticky: true, width: 230, render: (r) => Identity(r.studentName, `${r.className}-${r.section}`) },
          { key: 'vaccine', label: 'Vaccine', width: 160, filter: true },
          { key: 'doseNo', label: 'Doses', width: 90, align: 'right', numeric: true },
          { key: 'givenOn', label: 'Given on', width: 140, render: (r) => (r.givenOn ? dt(r.givenOn) : '—') },
          { key: 'centre', label: 'Centre', width: 170, filter: true },
          { key: 'batchNo', label: 'Batch', width: 130, className: 't-mono', hidden: true },
          { key: 'certificate', label: 'Certificate', width: 140, value: (r) => (r.certificate ? 1 : 0), render: (r) => (r.certificate ? Badge('On file', { tone: 'success', icon: 'file-text' }) : Badge('Missing', { tone: 'danger' })) },
          { key: 'status', label: 'Status', width: 140, filter: true, render: (r) => Badge(r.status === 'Due' ? 'Overdue' : r.status, { tone: r.status === 'Completed' ? 'success' : r.status === 'Due' ? 'danger' : 'warning' }) },
        ],
        rows, selectable: true, pageSize: 50,
        searchKeys: ['studentName', 'vaccine', 'className'],
        groupBy: 'vaccine',
        bulkActions: [
          { label: 'Request certificate', icon: 'file-text', onClick: (sel) => notify({ title: `${sel.length} requests sent`, tone: 'success' }) },
          { label: 'Add to the next camp', icon: 'syringe', onClick: (sel) => notify({ title: `${sel.length} students added`, tone: 'success' }) },
        ],
        onRowClick: (r) => navigate(`health/profiles/${r.studentId}`),
        rowActions: (r) => [
          { label: 'Health record', icon: 'heart-pulse', route: `health/profiles/${r.studentId}` },
          { label: 'Notify guardian', icon: 'send', onClick: () => notify({ title: 'Guardian notified', text: r.studentName, tone: 'success' }) },
        ],
        emptyState: emptyFor('syringe', 'No vaccination records', 'Ask guardians to upload the immunisation card at admission.'),
      }));
    },
  },

  /* -------------------------------------------- health/emergency-contacts */
  'health/emergency-contacts': {
    title: 'Emergency Contacts',
    subtitle: 'Who to call, in what order, for every student',
    section: 'health',
    render(mount, ctx) {
      ensureStyles();
      const rows = scope(db.healthRecords, ctx).map((r) => {
        const s = byId(db.students, r.studentId) || {};
        return {
          id: r.id, studentId: r.studentId, studentName: r.studentName,
          className: r.className, section: r.section, campusId: r.campusId,
          bloodGroup: r.bloodGroup,
          primaryName: s.fatherName || s.guardianName || '—',
          primaryPhone: s.emergencyContact || s.phone || '—',
          secondaryName: s.motherName || '—',
          secondaryPhone: s.phone || '—',
          guardianName: s.guardianName || '—',
          guardianRelation: s.guardianRelation || '—',
          familyDoctor: r.familyDoctor,
          hospital: pickOf(['Medanta — The Medicity', 'Fortis Memorial', 'Artemis Hospital', 'Max Hospital', 'Paras Hospital'], 'hp' + r.id),
          insurancePolicy: r.insurancePolicy,
          consentOnFile: boolOf('cf' + r.id, 88),
          status: r.insurancePolicy ? 'Complete' : 'Incomplete',
        };
      });

      mount.appendChild(listPage({
        title: 'Emergency contacts',
        subtitle: `${num(rows.length)} students · ${rows.filter((r) => !r.consentOnFile).length} missing a treatment consent`,
        route: 'health/emergency-contacts',
        actions: pageActions(
          Button('Print call sheet', { variant: 'secondary', icon: 'print', onClick: mockAction('Print emergency call sheet') }),
          Button('Request missing details', { variant: 'primary', icon: 'send', onClick: () => notify({ title: 'Requests sent', text: `${rows.filter((r) => !r.consentOnFile).length} guardians asked to complete the emergency form.`, tone: 'success' }) })),
        notes: Callout({ tone: 'info', icon: 'phone-call', title: 'Escalation order' },
          'Primary contact first, then the secondary contact, then the registered local guardian. If none answer within five minutes the nurse may act on the standing treatment consent and inform the principal.'),
        kpis: [
          { label: 'Students', value: num(rows.length), icon: 'users', tone: 'brand' },
          { label: 'Consent on file', value: num(rows.filter((r) => r.consentOnFile).length), icon: 'check-circle', tone: 'success' },
          { label: 'Insurance recorded', value: num(rows.filter((r) => r.insurancePolicy).length), icon: 'shield', tone: 'info' },
          { label: 'Incomplete records', value: num(rows.filter((r) => r.status === 'Incomplete').length), icon: 'alert-circle', tone: 'warning' },
        ],
        filters: [
          { id: 'q', type: 'search', label: 'Search', placeholder: 'Student, guardian or phone…', width: '260px' },
          { id: 'className', label: 'Class', options: Array.from(new Set(rows.map((r) => r.className))).sort().slice(0, 16) },
          { id: 'bloodGroup', label: 'Blood group', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
          { id: 'status', label: 'Record', options: ['Complete', 'Incomplete'] },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, {
          q: (r, x) => `${r.studentName} ${r.primaryName} ${r.primaryPhone}`.toLowerCase().includes(String(x).toLowerCase()),
          className: (r, x) => r.className === x,
          bloodGroup: (r, x) => r.bloodGroup === x,
          status: (r, x) => r.status === x,
        })),
        chart: donutChart({
          data: countBy(rows, 'bloodGroup').map((c) => ({ key: c.key, value: c.value })),
          height: 260, centerValue: String(rows.length), centerLabel: 'Students',
        }),
        chartTitle: 'Blood group distribution — used for emergency donor calls',
        columns: [
          { key: 'studentName', label: 'Student', sticky: true, width: 230, render: (r) => Identity(r.studentName, `${r.className}-${r.section}`) },
          { key: 'bloodGroup', label: 'Blood', width: 100, filter: true, render: (r) => Badge(r.bloodGroup, { tone: 'danger', size: 'sm' }) },
          { key: 'primaryName', label: 'Primary contact', width: 200, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.primaryName), h('div', { className: 't-xs t-mono t-muted' }, r.primaryPhone)) },
          { key: 'secondaryName', label: 'Secondary contact', width: 200, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.secondaryName), h('div', { className: 't-xs t-mono t-muted' }, r.secondaryPhone)) },
          { key: 'guardianName', label: 'Local guardian', width: 190, render: (r) => h('div', null, h('div', { className: 't-medium t-truncate' }, r.guardianName), h('div', { className: 't-xs t-muted' }, r.guardianRelation)) },
          { key: 'familyDoctor', label: 'Family doctor', width: 200 },
          { key: 'hospital', label: 'Preferred hospital', width: 210, filter: true },
          { key: 'insurancePolicy', label: 'Insurance', width: 150, render: (r) => (r.insurancePolicy ? h('span', { className: 't-mono' }, r.insurancePolicy) : h('span', { className: 't-muted' }, 'Not on file')) },
          { key: 'consentOnFile', label: 'Treatment consent', width: 170, value: (r) => (r.consentOnFile ? 1 : 0), render: (r) => (r.consentOnFile ? Badge('Verified', { tone: 'success' }) : Badge('Pending', { tone: 'warning' })) },
        ],
        rows, selectable: true, pageSize: 25,
        searchKeys: ['studentName', 'primaryName', 'primaryPhone', 'guardianName'],
        bulkActions: [
          { label: 'Send an emergency test SMS', icon: 'siren', onClick: (sel) => notify({ title: `${sel.length} test messages sent`, tone: 'info' }) },
          { label: 'Request consent', icon: 'file-text', onClick: (sel) => notify({ title: `${sel.length} consent requests sent`, tone: 'success' }) },
        ],
        onRowClick: (r) => navigate(`health/profiles/${r.studentId}`),
        rowActions: (r) => [
          { label: 'Call primary contact', icon: 'phone-call', onClick: () => notify({ title: 'Dialling', text: `${r.primaryName} · ${r.primaryPhone}`, tone: 'warning' }) },
          { label: 'Health record', icon: 'heart-pulse', route: `health/profiles/${r.studentId}` },
          { label: 'Student profile', icon: 'user', route: `students/profile/${r.studentId}` },
        ],
        emptyState: emptyFor('phone-call', 'No contacts on file', 'Collect emergency contacts at admission so the infirmary can act quickly.'),
      }));
    },
  },

  /* ------------------------------------------------------- health/reports */
  'health/reports': {
    title: 'Health Reports',
    subtitle: 'Wellness, infirmary load and immunisation coverage',
    section: 'health',
    render(mount, ctx) {
      ensureStyles();
      const records = scope(db.healthRecords, ctx);
      const visits = scope(db.infirmaryVisits, ctx);
      const vax = vaccinationRows();

      const classes = Array.from(new Set(records.map((r) => r.className)));
      const rows = classes.map((cn) => {
        const list = records.filter((r) => r.className === cn);
        const v = visits.filter((x) => x.className === cn);
        const vx = vax.filter((x) => x.className === cn);
        return {
          id: cn, className: cn,
          students: list.length,
          avgBmi: Number((list.reduce((a, r) => a + r.bmi, 0) / Math.max(1, list.length)).toFixed(1)),
          underweight: list.filter((r) => bmiBand(r.bmi) === 'Underweight').length,
          overweight: list.filter((r) => ['Overweight', 'Obese'].includes(bmiBand(r.bmi))).length,
          allergies: list.filter((r) => r.allergies !== 'None').length,
          spectacles: list.filter((r) => r.vision === 'Spectacles' || r.vision === '6/12').length,
          visits: v.length,
          sentHome: v.filter((x) => x.sentHome).length,
          vaxCoverage: vx.length ? Number(((vx.filter((x) => x.status === 'Completed').length / vx.length) * 100).toFixed(1)) : 0,
        };
      }).sort((a, b) => b.students - a.students);

      const monthly = Array.from(groupBy(visits, (v) => formatDate(v.date, 'monthYear')).entries())
        .map(([month, list]) => ({ month, visits: list.length, sentHome: list.filter((x) => x.sentHome).length }));

      mount.appendChild(reportPage({
        title: 'Health reports',
        subtitle: `${num(records.length)} health profiles · ${num(visits.length)} infirmary visits · academic year 2026-27`,
        route: 'health/reports',
        filters: [
          { id: 'period', label: 'Period', type: 'segment', options: [{ id: 'month', label: 'This month' }, { id: 'term', label: 'This term' }, { id: 'ytd', label: 'Year to date' }] },
          { id: 'campus', label: 'Campus', options: campusOptions() },
          { id: 'className', label: 'Class', options: classes.slice(0, 16) },
          { id: 'from', label: 'From', type: 'date' },
        ],
        onFilter: (id, v, all, table) => table.refresh(applyAll(rows, all, { className: (r, x) => r.className === x })),
        summary: [
          { label: 'Profiles', value: num(records.length), icon: 'heart-pulse', tone: 'brand' },
          { label: 'Average BMI', value: (records.reduce((a, r) => a + r.bmi, 0) / Math.max(1, records.length)).toFixed(1), icon: 'activity', tone: 'info' },
          { label: 'Infirmary visits', value: num(visits.length), delta: 3.9, icon: 'first-aid', tone: 'warning' },
          { label: 'Immunisation coverage', value: `${((vax.filter((v) => v.status === 'Completed').length / Math.max(1, vax.length)) * 100).toFixed(1)}%`, icon: 'syringe', tone: 'success' },
        ],
        chart: [
          comboChart({
            categories: monthly.map((m) => m.month),
            bars: [{ name: 'Visits', values: monthly.map((m) => m.visits) }],
            line: { name: 'Sent home', values: monthly.map((m) => m.sentHome) },
            height: 280,
          }),
          barChart({
            categories: rows.slice(0, 14).map((r) => r.className),
            series: [
              { name: 'Underweight', values: rows.slice(0, 14).map((r) => r.underweight) },
              { name: 'Healthy', values: rows.slice(0, 14).map((r) => r.students - r.underweight - r.overweight) },
              { name: 'Above healthy range', values: rows.slice(0, 14).map((r) => r.overweight) },
            ],
            stacked: true, height: 300,
          }),
        ],
        chartTitle: 'Infirmary load by month and BMI bands by class',
        columns: [
          { key: 'className', label: 'Class', sticky: true, width: 160 },
          { key: 'students', label: 'Students', width: 110, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'avgBmi', label: 'Avg BMI', width: 110, align: 'right', numeric: true, aggregate: 'avg', format: (v) => v.toFixed(1) },
          { key: 'underweight', label: 'Underweight', width: 140, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'overweight', label: 'Above range', width: 140, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'allergies', label: 'Allergies', width: 120, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'spectacles', label: 'Vision support', width: 150, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'visits', label: 'Infirmary visits', width: 150, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'sentHome', label: 'Sent home', width: 130, align: 'right', numeric: true, aggregate: 'sum', format: num },
          { key: 'vaxCoverage', label: 'Immunisation', width: 160, render: (r) => ProgressBar(r.vaxCoverage, { tone: r.vaxCoverage >= 95 ? 'success' : r.vaxCoverage >= 85 ? 'warning' : 'danger', showValue: true }), aggregate: 'avg', format: (v) => `${v.toFixed(1)}%` },
        ],
        rows,
        tableTitle: 'Class-wise wellness summary',
        notes: Callout({ tone: 'info', title: 'How to use this' },
          'Classes with a high infirmary load and low immunisation coverage are the first candidates for a wellness talk and a follow-up camp. Share the BMI bands with the PE department, not with individual students.'),
      }));
    },
  },
};

/* ==========================================================================
   9. Route table — every route in library · transport · hostel · inventory ·
   health, exactly as declared in core/nav.js
   ========================================================================== */

export const routes = {
  ...libraryRoutes,
  ...transportRoutes,
  ...hostelRoutes,
  ...inventoryRoutes,
  ...healthRoutes,
};

export default { routes };
