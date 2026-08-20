/* ==========================================================================
   charts.js — hand-written inline-SVG chart library
   No canvas, no dependencies, no external requests.

   Built to the dataviz method:
   · fixed categorical slot order (--chart-1 … --chart-8), never cycled past 8
   · one axis only — never a dual-axis chart
   · sequential = one hue light→dark; diverging = two hues + neutral grey mid
   · thin marks, 4px rounded data-ends, 2px lines, ≥8px markers
   · 2px surface gap between touching fills; 2px surface ring on overlapping dots
   · legend always present for ≥2 series (never for 1 — the title names it)
   · selective direct labels; recessive hairline grid; text wears text tokens
   · hover/focus tooltip on every plot; every chart ships a table view
   · responsive: re-rendered on container resize (ResizeObserver)
   ========================================================================== */

import { h, frag, formatNumber, formatCurrency, escapeHtml } from './ui.js';

/* =============================================================== palette = */

/** Fixed categorical slot order. Index 0 = slot 1. */
export const PALETTE = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
  'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)',
];
/** Colour for the folded "Other" bucket — never a 9th generated hue. */
export const OTHER_COLOR = 'var(--chart-other)';
/** Sequential ramp (single hue, light → dark). */
export const SEQUENTIAL = ['var(--chart-seq-1)', 'var(--chart-seq-2)', 'var(--chart-seq-3)',
  'var(--chart-seq-4)', 'var(--chart-seq-5)', 'var(--chart-seq-6)', 'var(--chart-seq-7)'];
/** Ordinal ramp — for discrete ordered marks (funnel stages, tiers). */
export const ORDINAL = ['var(--chart-ord-1)', 'var(--chart-ord-2)', 'var(--chart-ord-3)',
  'var(--chart-ord-4)', 'var(--chart-ord-5)', 'var(--chart-ord-6)'];
/** Diverging ramp — blue ↔ red with a neutral grey midpoint. */
export const DIVERGING = ['var(--chart-div-neg-3)', 'var(--chart-div-neg-2)', 'var(--chart-div-neg-1)',
  'var(--chart-div-mid)', 'var(--chart-div-pos-1)', 'var(--chart-div-pos-2)', 'var(--chart-div-pos-3)'];
/** Reserved status colours — never used as a series colour. */
export const STATUS = {
  good: 'var(--chart-good)',
  warning: 'var(--chart-warning)',
  serious: 'var(--chart-serious)',
  critical: 'var(--chart-critical)',
};

/** Colour for categorical slot i (0-based). Past slot 8 returns OTHER_COLOR. */
export function seriesColor(i) { return i < PALETTE.length ? PALETTE[i] : OTHER_COLOR; }

/** Pick a sequential step for t in [0,1]. */
export function sequentialColor(t, ramp = SEQUENTIAL) {
  const i = Math.max(0, Math.min(ramp.length - 1, Math.round(t * (ramp.length - 1))));
  return ramp[i];
}
/** Pick a diverging step for t in [-1,1]. */
export function divergingColor(t) {
  const i = Math.max(0, Math.min(DIVERGING.length - 1, Math.round(((t + 1) / 2) * (DIVERGING.length - 1))));
  return DIVERGING[i];
}

/* ============================================================== internals */

const SURFACE = 'var(--chart-surface)';
const GAP = 2;          // the surface gap between touching fills
const RING = 2;         // the surface ring on overlapping markers
const BAR_MAX = 24;     // bars never fill their band
const DOT_R = 4;        // ≥8px marker

const svgEl = (tag, attrs, ...kids) => h(tag, attrs, ...kids);

function normSeries(input) {
  if (!input || !input.length) return [];
  if (typeof input[0] === 'number') return [{ name: 'Value', values: input.map(Number) }];
  return input.map((s, i) => ({
    name: s.name != null ? s.name : `Series ${i + 1}`,
    values: (s.values || s.data || []).map((v) => (v == null ? null : Number(v))),
    color: s.color || seriesColor(i),
    dashed: !!s.dashed,
    type: s.type || null,
  }));
}

function niceStep(raw) {
  const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(raw) || 1)));
  const norm = raw / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return step * mag;
}

/** Round an axis domain to clean tick values. */
function axisTicks(min, max, count = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1, ticks: [0, 1] };
  if (min === max) { min = Math.min(0, min); max = max === 0 ? 1 : max * 1.2; }
  const step = niceStep((max - min) / Math.max(1, count));
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 1000; v += step) ticks.push(Number(v.toFixed(10)));
  return { min: lo, max: hi, ticks };
}

/** Compact axis label: 1200000 -> "12L", 45000 -> "45K". */
export function compactNumber(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  const a = Math.abs(n);
  if (a >= 1e7) return `${(n / 1e7).toFixed(a >= 1e8 ? 0 : 1)}Cr`;
  if (a >= 1e5) return `${(n / 1e5).toFixed(a >= 1e6 ? 0 : 1)}L`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(a >= 1e4 ? 0 : 1)}K`;
  if (a > 0 && a < 1) return n.toFixed(2);
  return formatNumber(n);
}

/** Built-in value formatters, selectable by name. */
export const FORMATS = {
  number: (v) => formatNumber(v),
  compact: (v) => compactNumber(v),
  currency: (v) => formatCurrency(v),
  currencyCompact: (v) => formatCurrency(v, { compact: true }),
  percent: (v) => `${Number(v).toFixed(1)}%`,
  percent0: (v) => `${Math.round(Number(v))}%`,
  decimal: (v) => Number(v).toFixed(1),
};
function fmtFor(f) {
  if (typeof f === 'function') return f;
  return FORMATS[f] || FORMATS.number;
}

/**
 * Shared chart shell: responsive wrapper + legend + tooltip + table view.
 * draw(width) must return an <svg> element.
 */
function chartShell({ draw, height, series, legend = true, legendMark = 'rect', tableView = true,
  categories = [], valueFormat = 'number', title, className, toggleLabel = 'Table' }) {
  const fmt = fmtFor(valueFormat);
  const root = h('div', { className: ['chart', className].filter(Boolean).join(' ') });
  const wrap = h('div', { className: 'chart-svg-wrap' });
  const tip = h('div', { className: 'ch-tip' });
  wrap.appendChild(tip);
  root.appendChild(wrap);

  const showLegend = legend && series && series.length >= 2;
  const legendEl = showLegend ? h('div', { className: 'ch-legend' },
    series.map((s) => h('span', { className: 'ch-legend-item', style: { color: s.color } },
      h('span', { className: legendMark === 'line' ? 'ch-swatch-line' : legendMark === 'dot' ? 'ch-swatch-dot' : 'ch-swatch' }),
      h('span', { className: 'ch-legend-label' }, s.name)))) : null;

  let tableEl = null;
  const legendRow = h('div', { className: 'row', style: { gap: '16px', flexWrap: 'wrap' } });
  if (legendEl) legendRow.appendChild(legendEl);
  if (tableView && series && series.length) {
    const toggle = h('button', {
      className: 'btn btn-ghost', dataset: { size: 'sm' },
      onClick: () => {
        if (tableEl) { tableEl.remove(); tableEl = null; toggle.textContent = toggleLabel; return; }
        tableEl = buildTable(series, categories, fmt);
        root.appendChild(tableEl);
        toggle.textContent = 'Chart';
      },
    }, toggleLabel);
    legendRow.appendChild(h('span', { className: 'spacer' }));
    legendRow.appendChild(toggle);
  }
  if (legendRow.childNodes.length) root.appendChild(legendRow);

  /* tooltip API handed to the drawer */
  const tipApi = {
    show(x, y, html) {
      tip.innerHTML = html;
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
      tip.classList.add('is-visible');
    },
    hide() { tip.classList.remove('is-visible'); },
    fmt,
  };

  let lastW = 0;
  const paint = () => {
    const w = Math.max(260, Math.round(wrap.clientWidth || root.clientWidth || 620));
    if (Math.abs(w - lastW) < 6) return;
    lastW = w;
    const old = wrap.querySelector('svg');
    if (old) old.remove();
    const svg = draw(w, tipApi);
    if (svg) wrap.insertBefore(svg, tip);
  };
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => paint());
    ro.observe(wrap);
  }
  requestAnimationFrame(paint);
  setTimeout(paint, 0);
  root.repaint = () => { lastW = 0; paint(); };
  void height;
  void title;
  return root;
}

function buildTable(series, categories, fmt) {
  const wrap = h('div', { className: 'ch-tableview' });
  const table = h('table', null);
  const head = h('tr', null, h('th', null, 'Category'));
  for (const s of series) head.appendChild(h('th', null, s.name));
  table.appendChild(h('thead', null, head));
  const body = h('tbody', null);
  const n = Math.max(...series.map((s) => s.values.length));
  for (let i = 0; i < n; i++) {
    const tr = h('tr', null, h('td', null, categories[i] != null ? String(categories[i]) : `#${i + 1}`));
    for (const s of series) tr.appendChild(h('td', null, s.values[i] == null ? '—' : fmt(s.values[i])));
    body.appendChild(tr);
  }
  table.appendChild(body);
  wrap.appendChild(table);
  return wrap;
}

/** Tooltip markup: value leads, series name follows. */
function tipRows(title, rows, fmt) {
  const body = rows.map((r) => `<div class="ch-tip-row" style="color:${r.color}">
      <span class="ch-tip-key"></span>
      <span class="ch-tip-name">${escapeHtml(r.name)}</span>
      <span class="ch-tip-val">${escapeHtml(fmt(r.value))}</span>
    </div>`).join('');
  return `<div class="ch-tip-title">${escapeHtml(title)}</div>${body}`;
}

/** A rounded-top bar path: rounded data-end, square at the baseline. */
function barPath(x, y, w, hgt, r = 4, horizontal = false) {
  const rad = Math.max(0, Math.min(r, horizontal ? hgt / 2 : w / 2, horizontal ? w : hgt));
  if (hgt <= 0 || w <= 0) return '';
  if (horizontal) {
    return `M${x} ${y} H${x + w - rad} A${rad} ${rad} 0 0 1 ${x + w} ${y + rad} V${y + hgt - rad}
            A${rad} ${rad} 0 0 1 ${x + w - rad} ${y + hgt} H${x} Z`;
  }
  return `M${x} ${y + hgt} V${y + rad} A${rad} ${rad} 0 0 1 ${x + rad} ${y} H${x + w - rad}
          A${rad} ${rad} 0 0 1 ${x + w} ${y + rad} V${y + hgt} Z`;
}

/* ========================================================== cartesian === */

function cartesian(opts) {
  const {
    series, categories = [], width, height = 260, valueFormat, tip,
    margin = {}, yTickCount = 5, xTickEvery, showGrid = true, showXAxis = true,
    yFormat, baselineZero = true, target = null, targetLabel = 'Target',
    stacked = false, minY = null, maxY = null,
  } = opts;
  const m = { top: 16, right: 18, bottom: 30, left: 52, ...margin };
  const iw = Math.max(40, width - m.left - m.right);
  const ih = Math.max(40, height - m.top - m.bottom);

  let lo = Infinity;
  let hi = -Infinity;
  if (stacked) {
    for (let i = 0; i < categories.length; i++) {
      let pos = 0;
      let neg = 0;
      for (const s of series) {
        const v = Number(s.values[i]) || 0;
        if (v >= 0) pos += v; else neg += v;
      }
      hi = Math.max(hi, pos);
      lo = Math.min(lo, neg);
    }
  } else {
    for (const s of series) for (const v of s.values) {
      if (v == null) continue;
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
  }
  if (target != null) hi = Math.max(hi, target);
  if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
  if (baselineZero) lo = Math.min(0, lo);
  if (minY != null) lo = minY;
  if (maxY != null) hi = maxY;
  const { min, max, ticks } = axisTicks(lo, hi, yTickCount);

  const yOf = (v) => m.top + ih - ((v - min) / (max - min || 1)) * ih;
  const bandW = iw / Math.max(1, categories.length);
  const xBand = (i) => m.left + bandW * i;
  const xPoint = (i) => m.left + (categories.length <= 1 ? iw / 2 : (iw / (categories.length - 1)) * i);

  const fmtY = fmtFor(yFormat || (valueFormat === 'currency' ? 'currencyCompact' : 'compact'));
  const grid = [];
  const axisText = [];
  for (const t of ticks) {
    const y = yOf(t);
    if (showGrid) grid.push(svgEl('line', { x1: m.left, y1: y, x2: m.left + iw, y2: y }));
    axisText.push(svgEl('text', { className: 'ch-tick', x: m.left - 8, y: y + 3.5, 'text-anchor': 'end' }, fmtY(t)));
  }

  const xLabels = [];
  if (showXAxis) {
    const every = xTickEvery || Math.max(1, Math.ceil(categories.length / Math.max(2, Math.floor(iw / 62))));
    categories.forEach((c, i) => {
      if (i % every !== 0 && i !== categories.length - 1) return;
      xLabels.push(svgEl('text', {
        className: 'ch-tick', x: (opts.pointScale ? xPoint(i) : xBand(i) + bandW / 2), y: m.top + ih + 16, 'text-anchor': 'middle',
      }, String(c)));
    });
  }

  const targetMark = target != null ? frag(
    svgEl('line', { className: 'ch-ref-line', x1: m.left, y1: yOf(target), x2: m.left + iw, y2: yOf(target) }),
    svgEl('text', { className: 'ch-tick', x: m.left + iw, y: yOf(target) - 5, 'text-anchor': 'end' }, `${targetLabel} ${fmtY(target)}`),
  ) : null;

  return { m, iw, ih, min, max, ticks, yOf, xBand, xPoint, bandW, grid, axisText, xLabels, targetMark, fmtY, tip };
}

function svgRoot(width, height, label, ...kids) {
  return svgEl('svg', {
    viewBox: `0 0 ${width} ${height}`, width, height,
    attrs: { role: 'img', 'aria-label': label, preserveAspectRatio: 'xMidYMid meet' },
  }, svgEl('title', null, label), ...kids);
}

/* ================================================================ line == */

/**
 * lineChart({series, categories, height, valueFormat, title, showDots, showEndLabels, target})
 * series: [{name, values:[…], color?}] or a bare number array.
 */
export function lineChart(opts = {}) {
  const series = normSeries(opts.series);
  const categories = opts.categories || series[0]?.values.map((_, i) => i + 1) || [];
  const height = opts.height || 260;
  const label = opts.title || `Line chart: ${series.map((s) => s.name).join(', ')}`;

  return chartShell({
    height, series, categories, valueFormat: opts.valueFormat, legend: opts.legend !== false,
    legendMark: 'line', tableView: opts.tableView !== false, title: label, className: opts.className,
    draw: (width, tip) => {
      const c = cartesian({ ...opts, series, categories, width, height, pointScale: true, tip });
      const fmt = tip.fmt;
      const lines = series.map((s) => {
        const pts = s.values.map((v, i) => (v == null ? null : [c.xPoint(i), c.yOf(v)])).filter(Boolean);
        if (!pts.length) return null;
        const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
        return svgEl('path', { className: 'ch-line', d, stroke: s.color, 'stroke-dasharray': s.dashed ? '6 5' : null });
      });

      const dots = [];
      if (opts.showDots !== false) {
        series.forEach((s) => s.values.forEach((v, i) => {
          if (v == null) return;
          const isEnd = i === s.values.length - 1;
          const isExtreme = v === Math.max(...s.values.filter((x) => x != null));
          if (!isEnd && !isExtreme && series[0].values.length > 14) return;
          dots.push(svgEl('circle', { className: 'ch-dot', cx: c.xPoint(i), cy: c.yOf(v), r: DOT_R, fill: s.color, 'stroke-width': RING }));
        }));
      }

      /* selective direct labels: only the endpoint of each series, and only
         when the series separate enough at the right edge */
      const endLabels = [];
      if (opts.showEndLabels !== false && series.length <= 4) {
        const ends = series.map((s) => {
          let i = s.values.length - 1;
          while (i >= 0 && s.values[i] == null) i--;
          return i >= 0 ? { s, i, v: s.values[i], y: c.yOf(s.values[i]) } : null;
        }).filter(Boolean).sort((a, b) => a.y - b.y);
        const tooClose = ends.some((e, i) => i > 0 && Math.abs(e.y - ends[i - 1].y) < 14);
        if (!tooClose) {
          for (const e of ends) {
            endLabels.push(svgEl('text', {
              className: 'ch-label', x: c.xPoint(e.i) + 8, y: e.y + 3.5, 'text-anchor': 'start',
            }, fmt(e.v)));
          }
        }
      }

      /* crosshair + shared tooltip */
      const cross = svgEl('line', { className: 'ch-crosshair', x1: 0, y1: c.m.top, x2: 0, y2: c.m.top + c.ih, style: { opacity: 0 } });
      const hit = svgEl('rect', {
        className: 'ch-hit', x: c.m.left, y: c.m.top, width: c.iw, height: c.ih,
        onMouseMove: (e) => {
          const svg = e.currentTarget.ownerSVGElement;
          const box = svg.getBoundingClientRect();
          const scale = box.width / width;
          const px = (e.clientX - box.left) / scale;
          const i = Math.max(0, Math.min(categories.length - 1,
            Math.round(((px - c.m.left) / (c.iw || 1)) * Math.max(1, categories.length - 1))));
          cross.setAttribute('x1', c.xPoint(i));
          cross.setAttribute('x2', c.xPoint(i));
          cross.style.opacity = 1;
          tip.show(c.xPoint(i) * scale, c.yOf(series[0].values[i] ?? c.min) * scale,
            tipRows(String(categories[i]), series.map((s) => ({ name: s.name, value: s.values[i], color: s.color })), fmt));
        },
        onMouseLeave: () => { cross.style.opacity = 0; tip.hide(); },
      });

      return svgRoot(width, height, label,
        svgEl('g', { className: 'ch-grid' }, c.grid),
        c.axisText, c.xLabels, c.targetMark,
        svgEl('g', { className: 'ch-axis' }, svgEl('line', { x1: c.m.left, y1: c.m.top + c.ih, x2: c.m.left + c.iw, y2: c.m.top + c.ih })),
        lines, dots, endLabels, cross, hit);
    },
  });
}

/* ================================================================ area == */

/**
 * areaChart({series, categories, stacked, height, valueFormat})
 * A single series draws a ~10% wash under a 2px line; stacked draws filled
 * bands separated by a 2px surface gap.
 */
export function areaChart(opts = {}) {
  const series = normSeries(opts.series);
  const categories = opts.categories || series[0]?.values.map((_, i) => i + 1) || [];
  const height = opts.height || 260;
  const stacked = !!opts.stacked;
  const label = opts.title || `Area chart: ${series.map((s) => s.name).join(', ')}`;

  return chartShell({
    height, series, categories, valueFormat: opts.valueFormat, legend: opts.legend !== false,
    legendMark: 'rect', tableView: opts.tableView !== false, title: label, className: opts.className,
    draw: (width, tip) => {
      const c = cartesian({ ...opts, series, categories, width, height, pointScale: true, stacked, tip });
      const fmt = tip.fmt;
      const layers = [];

      if (stacked) {
        const acc = new Array(categories.length).fill(0);
        series.forEach((s) => {
          const top = [];
          const bottom = [];
          s.values.forEach((v, i) => {
            const base = acc[i];
            const val = base + (Number(v) || 0);
            bottom.push([c.xPoint(i), c.yOf(base)]);
            top.push([c.xPoint(i), c.yOf(val)]);
            acc[i] = val;
          });
          const d = top.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
            + ' ' + bottom.reverse().map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';
          layers.push(svgEl('path', { className: 'ch-area-stack', d, fill: s.color, stroke: SURFACE, 'stroke-width': GAP }));
        });
      } else {
        series.forEach((s) => {
          const pts = s.values.map((v, i) => (v == null ? null : [c.xPoint(i), c.yOf(v)])).filter(Boolean);
          if (!pts.length) return;
          const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
          const base = c.yOf(Math.max(c.min, 0));
          layers.push(svgEl('path', { className: 'ch-area', d: `${line} L${pts[pts.length - 1][0]} ${base} L${pts[0][0]} ${base} Z`, fill: s.color }));
          layers.push(svgEl('path', { className: 'ch-line', d: line, stroke: s.color }));
          layers.push(svgEl('circle', { className: 'ch-dot', cx: pts[pts.length - 1][0], cy: pts[pts.length - 1][1], r: DOT_R, fill: s.color, 'stroke-width': RING }));
        });
      }

      const cross = svgEl('line', { className: 'ch-crosshair', x1: 0, y1: c.m.top, x2: 0, y2: c.m.top + c.ih, style: { opacity: 0 } });
      const hit = svgEl('rect', {
        className: 'ch-hit', x: c.m.left, y: c.m.top, width: c.iw, height: c.ih,
        onMouseMove: (e) => {
          const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
          const scale = box.width / width;
          const px = (e.clientX - box.left) / scale;
          const i = Math.max(0, Math.min(categories.length - 1,
            Math.round(((px - c.m.left) / (c.iw || 1)) * Math.max(1, categories.length - 1))));
          cross.setAttribute('x1', c.xPoint(i));
          cross.setAttribute('x2', c.xPoint(i));
          cross.style.opacity = 1;
          tip.show(c.xPoint(i) * scale, c.m.top * scale + 10,
            tipRows(String(categories[i]), series.map((s) => ({ name: s.name, value: s.values[i], color: s.color })), fmt));
        },
        onMouseLeave: () => { cross.style.opacity = 0; tip.hide(); },
      });

      return svgRoot(width, height, label,
        svgEl('g', { className: 'ch-grid' }, c.grid),
        c.axisText, c.xLabels, c.targetMark,
        svgEl('g', { className: 'ch-axis' }, svgEl('line', { x1: c.m.left, y1: c.m.top + c.ih, x2: c.m.left + c.iw, y2: c.m.top + c.ih })),
        layers, cross, hit);
    },
  });
}

/* ================================================================= bar == */

/**
 * barChart({series, categories, horizontal, stacked, grouped, height, valueFormat,
 *           showValues, target})
 */
export function barChart(opts = {}) {
  const series = normSeries(opts.series);
  const categories = opts.categories || series[0]?.values.map((_, i) => i + 1) || [];
  const horizontal = !!opts.horizontal;
  const stacked = !!opts.stacked;
  const height = opts.height || (horizontal ? Math.max(180, categories.length * 30 + 60) : 260);
  const label = opts.title || `Bar chart: ${series.map((s) => s.name).join(', ')}`;

  return chartShell({
    height, series, categories, valueFormat: opts.valueFormat, legend: opts.legend !== false,
    tableView: opts.tableView !== false, title: label, className: opts.className,
    draw: (width, tip) => {
      const fmt = tip.fmt;
      if (horizontal) return drawHorizontal(width, tip, fmt);
      return drawVertical(width, tip, fmt);
    },
  });

  function drawVertical(width, tip, fmt) {
    const c = cartesian({ ...opts, series, categories, width, height, stacked, tip });
    const marks = [];
    const labels = [];
    const groupCount = stacked ? 1 : series.length;
    const slot = c.bandW * 0.72;
    const bw = Math.min(BAR_MAX, (slot - GAP * (groupCount - 1)) / groupCount);
    const groupW = bw * groupCount + GAP * (groupCount - 1);

    categories.forEach((cat, i) => {
      const x0 = c.xBand(i) + (c.bandW - groupW) / 2;
      if (stacked) {
        let acc = 0;
        series.forEach((s) => {
          const v = Number(s.values[i]) || 0;
          if (!v) return;
          const y1 = c.yOf(acc + v);
          const y0 = c.yOf(acc);
          const hgt = Math.max(0, y0 - y1 - GAP);
          marks.push(svgEl('path', {
            className: 'ch-bar', d: barPath(x0, y1, bw, hgt, 4), fill: s.color,
            onMouseEnter: (e) => hoverBar(e, cat, [{ name: s.name, value: v, color: s.color }], fmt, tip, width),
            onMouseLeave: () => tip.hide(),
          }));
          acc += v;
        });
        if (opts.showValues) {
          labels.push(svgEl('text', { className: 'ch-label', x: x0 + bw / 2, y: c.yOf(acc) - 6, 'text-anchor': 'middle' }, fmt(acc)));
        }
      } else {
        series.forEach((s, si) => {
          const v = Number(s.values[i]);
          if (v == null || Number.isNaN(v)) return;
          const zero = c.yOf(Math.max(c.min, 0));
          const y = c.yOf(v);
          const top = Math.min(y, zero);
          const hgt = Math.abs(zero - y);
          const x = x0 + si * (bw + GAP);
          marks.push(svgEl('path', {
            className: 'ch-bar', d: barPath(x, top, bw, hgt, 4), fill: s.color,
            onMouseEnter: (e) => hoverBar(e, cat, [{ name: s.name, value: v, color: s.color }], fmt, tip, width),
            onMouseLeave: () => tip.hide(),
          }));
          if (opts.showValues && series.length === 1) {
            labels.push(svgEl('text', { className: 'ch-label', x: x + bw / 2, y: top - 6, 'text-anchor': 'middle' }, fmt(v)));
          }
        });
      }
    });

    return svgRoot(width, height, opts.title || label,
      svgEl('g', { className: 'ch-grid' }, c.grid),
      c.axisText, c.xLabels, c.targetMark,
      svgEl('g', { className: 'ch-axis' }, svgEl('line', { x1: c.m.left, y1: c.yOf(Math.max(c.min, 0)), x2: c.m.left + c.iw, y2: c.yOf(Math.max(c.min, 0)) })),
      marks, labels);
  }

  function drawHorizontal(width, tip, fmt) {
    const m = { top: 10, right: 62, bottom: 26, left: Math.min(190, Math.max(90, width * 0.26)) };
    const iw = Math.max(40, width - m.left - m.right);
    const ih = Math.max(40, height - m.top - m.bottom);
    let hi = 0;
    if (stacked) {
      for (let i = 0; i < categories.length; i++) hi = Math.max(hi, series.reduce((a, s) => a + (Number(s.values[i]) || 0), 0));
    } else {
      for (const s of series) for (const v of s.values) hi = Math.max(hi, Number(v) || 0);
    }
    const { max, ticks } = axisTicks(0, hi, 4);
    const xOf = (v) => m.left + (v / (max || 1)) * iw;
    const bandH = ih / Math.max(1, categories.length);
    const groupCount = stacked ? 1 : series.length;
    const bh = Math.min(BAR_MAX, (bandH * 0.66 - GAP * (groupCount - 1)) / groupCount);

    const grid = ticks.map((t) => svgEl('line', { x1: xOf(t), y1: m.top, x2: xOf(t), y2: m.top + ih }));
    const xTicks = ticks.map((t) => svgEl('text', { className: 'ch-tick', x: xOf(t), y: m.top + ih + 15, 'text-anchor': 'middle' }, compactNumber(t)));
    const marks = [];
    const labels = [];
    const yLabels = [];

    categories.forEach((cat, i) => {
      const yTop = m.top + bandH * i + (bandH - (bh * groupCount + GAP * (groupCount - 1))) / 2;
      yLabels.push(svgEl('text', {
        className: 'ch-tick', x: m.left - 10, y: m.top + bandH * i + bandH / 2 + 3.5, 'text-anchor': 'end',
      }, String(cat).length > 26 ? String(cat).slice(0, 25) + '…' : String(cat)));
      if (stacked) {
        let acc = 0;
        series.forEach((s) => {
          const v = Number(s.values[i]) || 0;
          if (!v) return;
          const x = xOf(acc);
          const w = Math.max(0, xOf(acc + v) - x - GAP);
          marks.push(svgEl('path', {
            className: 'ch-bar', d: barPath(x, yTop, w, bh, 4, true), fill: s.color,
            onMouseEnter: (e) => hoverBar(e, cat, [{ name: s.name, value: v, color: s.color }], fmt, tip, width),
            onMouseLeave: () => tip.hide(),
          }));
          acc += v;
        });
        labels.push(svgEl('text', { className: 'ch-label', x: xOf(acc) + 7, y: yTop + bh / 2 + 3.5, 'text-anchor': 'start' }, fmt(acc)));
      } else {
        series.forEach((s, si) => {
          const v = Number(s.values[i]) || 0;
          const y = yTop + si * (bh + GAP);
          const w = Math.max(0, xOf(v) - m.left);
          marks.push(svgEl('path', {
            className: 'ch-bar', d: barPath(m.left, y, w, bh, 4, true), fill: s.color,
            onMouseEnter: (e) => hoverBar(e, cat, [{ name: s.name, value: v, color: s.color }], fmt, tip, width),
            onMouseLeave: () => tip.hide(),
          }));
          if (series.length === 1 && opts.showValues !== false) {
            labels.push(svgEl('text', { className: 'ch-label', x: xOf(v) + 7, y: y + bh / 2 + 3.5, 'text-anchor': 'start' }, fmt(v)));
          }
        });
      }
    });

    return svgRoot(width, height, opts.title || label,
      svgEl('g', { className: 'ch-grid' }, grid),
      xTicks, yLabels,
      svgEl('g', { className: 'ch-axis' }, svgEl('line', { x1: m.left, y1: m.top, x2: m.left, y2: m.top + ih })),
      marks, labels);
  }
}

function hoverBar(e, category, rows, fmt, tip, width) {
  const svg = e.currentTarget.ownerSVGElement;
  const box = svg.getBoundingClientRect();
  const scale = box.width / width;
  const r = e.currentTarget.getBoundingClientRect();
  tip.show((r.left + r.width / 2 - box.left), (r.top - box.top), tipRows(String(category), rows, fmt));
  void scale;
}

/* ============================================================ sparkline == */

/**
 * sparkline(values, {height, color, fill, showLast})
 * A 12-point trend for stat tiles. No axes, no legend, no tooltip.
 */
export function sparkline(values = [], { height = 34, color = 'var(--chart-1)', fill = false, showLast = true } = {}) {
  const vals = values.map(Number).filter((v) => !Number.isNaN(v));
  const W = 120;
  const H = height;
  if (vals.length < 2) return h('div', { style: { height: H + 'px' } });
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const pad = 4;
  const x = (i) => (i / (vals.length - 1)) * W;
  const y = (v) => pad + (1 - (v - min) / span) * (H - pad * 2);
  const d = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return svgEl('svg', {
    className: 'spark', viewBox: `0 0 ${W} ${H}`, attrs: { role: 'img', 'aria-label': 'Trend sparkline', preserveAspectRatio: 'none' },
  },
    svgEl('title', null, `Trend: ${compactNumber(vals[0])} to ${compactNumber(vals[vals.length - 1])}`),
    fill && svgEl('path', { className: 'ch-area', d: `${d} L${W} ${H} L0 ${H} Z`, fill: color }),
    svgEl('path', { className: 'ch-line', d, stroke: color, 'vector-effect': 'non-scaling-stroke' }),
    showLast && svgEl('circle', { cx: W, cy: y(vals[vals.length - 1]), r: 2.6, fill: color, 'vector-effect': 'non-scaling-stroke' }));
}

/* =============================================================== donut === */

function arcPath(cx, cy, rOuter, rInner, a0, a1) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(rOuter, a0);
  const [x1, y1] = p(rOuter, a1);
  const [x2, y2] = p(rInner, a1);
  const [x3, y3] = p(rInner, a0);
  if (rInner <= 0) {
    return `M${cx} ${cy} L${x0} ${y0} A${rOuter} ${rOuter} 0 ${large} 1 ${x1} ${y1} Z`;
  }
  return `M${x0} ${y0} A${rOuter} ${rOuter} 0 ${large} 1 ${x1} ${y1}
          L${x2} ${y2} A${rInner} ${rInner} 0 ${large} 0 ${x3} ${y3} Z`;
}

/**
 * donutChart({data:[{key,value,color}], height, centerValue, centerLabel, valueFormat, maxSlices})
 * Part-to-whole at a glance only — folds the tail into "Other" past maxSlices.
 */
export function donutChart(opts = {}) {
  return pieLike({ ...opts, inner: opts.inner != null ? opts.inner : 0.62 });
}

/** pieChart({data, height, valueFormat}) — a donut with no hole. Max 6 slices. */
export function pieChart(opts = {}) {
  return pieLike({ ...opts, inner: 0 });
}

function pieLike(opts) {
  const maxSlices = opts.maxSlices || 6;
  let data = (opts.data || []).map((d, i) => ({ key: String(d.key ?? d.name ?? i), value: Number(d.value) || 0, color: d.color }));
  data.sort((a, b) => b.value - a.value);
  if (data.length > maxSlices) {
    const head = data.slice(0, maxSlices - 1);
    const tail = data.slice(maxSlices - 1);
    head.push({ key: 'Other', value: tail.reduce((a, d) => a + d.value, 0), color: OTHER_COLOR });
    data = head;
  }
  data.forEach((d, i) => { if (!d.color) d.color = d.key === 'Other' ? OTHER_COLOR : seriesColor(i); });
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const height = opts.height || 220;
  const label = opts.title || 'Composition';
  const series = data.map((d) => ({ name: d.key, values: [d.value], color: d.color }));

  return chartShell({
    height, series, categories: [opts.categoryLabel || 'Total'], valueFormat: opts.valueFormat,
    legend: false, tableView: opts.tableView !== false, title: label, className: opts.className,
    draw: (width, tip) => {
      const fmt = tip.fmt;
      const size = Math.min(height, width * 0.55);
      const cx = size / 2 + 8;
      const cy = height / 2;
      const rOuter = size / 2 - 6;
      const rInner = rOuter * opts.inner;
      let a = -Math.PI / 2;
      const slices = data.map((d) => {
        const sweep = (d.value / total) * Math.PI * 2;
        const gapAngle = Math.min(sweep * 0.18, GAP / rOuter);
        const path = svgEl('path', {
          d: arcPath(cx, cy, rOuter, rInner, a + gapAngle / 2, a + sweep - gapAngle / 2),
          fill: d.color, stroke: SURFACE, 'stroke-width': GAP,
          onMouseEnter: (e) => {
            const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
            const r = e.currentTarget.getBoundingClientRect();
            tip.show(r.left + r.width / 2 - box.left, r.top - box.top,
              tipRows(d.key, [{ name: `${((d.value / total) * 100).toFixed(1)}% of total`, value: d.value, color: d.color }], fmt));
          },
          onMouseLeave: () => tip.hide(),
        });
        a += sweep;
        return path;
      });

      /* legend rendered inside the SVG frame, to the right, with values */
      const legendX = size + 26;
      const rowH = Math.min(22, (height - 16) / Math.max(1, data.length));
      const legendRows = data.map((d, i) => svgEl('g', { transform: `translate(${legendX} ${(height - rowH * data.length) / 2 + rowH * i + rowH / 2})` },
        svgEl('rect', { x: 0, y: -4, width: 9, height: 9, rx: 2, fill: d.color }),
        svgEl('text', { className: 'ch-tick', x: 16, y: 3.5 }, d.key.length > 18 ? d.key.slice(0, 17) + '…' : d.key),
        svgEl('text', { className: 'ch-label', x: width - 4 - legendX, y: 3.5, 'text-anchor': 'end' },
          `${fmt(d.value)} · ${((d.value / total) * 100).toFixed(0)}%`)));

      const centre = opts.inner > 0 ? frag(
        svgEl('text', { className: 'ch-value-lg', x: cx, y: cy - 2, 'text-anchor': 'middle' },
          opts.centerValue != null ? opts.centerValue : fmt(total)),
        svgEl('text', { className: 'ch-value-sub', x: cx, y: cy + 16, 'text-anchor': 'middle' }, opts.centerLabel || 'Total'),
      ) : null;

      return svgRoot(width, height, label, slices, centre, legendRows);
    },
  });
}

/* ================================================================ gauge == */

/**
 * gaugeChart({value, min, max, thresholds:[{at,color}], label, height, valueFormat})
 * A half-circle meter: the fill carries severity, the track is a lighter step.
 */
export function gaugeChart(opts = {}) {
  const min = opts.min != null ? opts.min : 0;
  const max = opts.max != null ? opts.max : 100;
  const value = Math.max(min, Math.min(max, Number(opts.value) || 0));
  const height = opts.height || 170;
  const label = opts.title || opts.label || 'Gauge';
  const pct = (value - min) / (max - min || 1);
  const colour = opts.color || (pct >= 0.85 ? STATUS.good : pct >= 0.6 ? PALETTE[0] : pct >= 0.35 ? STATUS.warning : STATUS.critical);

  return chartShell({
    height, series: [{ name: opts.label || 'Value', values: [value], color: colour }],
    categories: [opts.label || 'Value'], valueFormat: opts.valueFormat, legend: false,
    tableView: false, title: label, className: opts.className,
    draw: (width, tip) => {
      const fmt = tip.fmt;
      const cx = width / 2;
      const cy = height - 24;
      const r = Math.min(width * 0.42, height - 40);
      const thick = Math.max(10, r * 0.18);
      const start = Math.PI;
      const end = Math.PI * 2;
      const a = start + (end - start) * pct;
      return svgRoot(width, height, `${label}: ${fmt(value)}`,
        svgEl('path', { d: arcPath(cx, cy, r, r - thick, start, end), fill: 'var(--chart-track)' }),
        svgEl('path', { d: arcPath(cx, cy, r, r - thick, start, Math.max(start + 0.001, a)), fill: colour }),
        svgEl('text', { className: 'ch-value-lg', x: cx, y: cy - 6, 'text-anchor': 'middle' }, fmt(value)),
        svgEl('text', { className: 'ch-value-sub', x: cx, y: cy + 14, 'text-anchor': 'middle' }, opts.label || ''),
        svgEl('text', { className: 'ch-tick', x: cx - r + thick / 2, y: cy + 16, 'text-anchor': 'middle' }, compactNumber(min)),
        svgEl('text', { className: 'ch-tick', x: cx + r - thick / 2, y: cy + 16, 'text-anchor': 'middle' }, compactNumber(max)));
    },
  });
}

/**
 * radialBarChart({data:[{key,value,max,color}], height, valueFormat})
 * Concentric rings — one per category, ordered outside-in.
 */
export function radialBarChart(opts = {}) {
  const data = (opts.data || []).slice(0, 5).map((d, i) => ({
    key: String(d.key ?? d.name), value: Number(d.value) || 0, max: Number(d.max) || 100, color: d.color || seriesColor(i),
  }));
  const height = opts.height || 240;
  const label = opts.title || 'Radial comparison';
  const series = data.map((d) => ({ name: d.key, values: [d.value], color: d.color }));

  return chartShell({
    height, series, categories: ['Value'], valueFormat: opts.valueFormat, legend: true,
    tableView: opts.tableView !== false, title: label, className: opts.className,
    draw: (width, tip) => {
      const fmt = tip.fmt;
      const cx = width / 2;
      const cy = height / 2;
      const rMax = Math.min(width, height) / 2 - 10;
      const band = rMax / (data.length + 1);
      const rings = data.map((d, i) => {
        const r = rMax - band * i;
        const pct = Math.max(0, Math.min(1, d.value / (d.max || 1)));
        const start = -Math.PI / 2;
        return frag(
          svgEl('circle', { cx, cy, r: r - band * 0.35, fill: 'none', stroke: 'var(--chart-track)', 'stroke-width': band * 0.55 }),
          svgEl('path', {
            d: describeArc(cx, cy, r - band * 0.35, start, start + Math.PI * 2 * pct),
            fill: 'none', stroke: d.color, 'stroke-width': band * 0.55, 'stroke-linecap': 'round',
            onMouseEnter: (e) => {
              const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
              const rr = e.currentTarget.getBoundingClientRect();
              tip.show(rr.left + rr.width / 2 - box.left, rr.top - box.top, tipRows(d.key, [{ name: `of ${fmt(d.max)}`, value: d.value, color: d.color }], fmt));
            },
            onMouseLeave: () => tip.hide(),
          }));
      });
      return svgRoot(width, height, label, rings);
    },
  });
}

function describeArc(cx, cy, r, a0, a1) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  if (Math.abs(a1 - a0) < 0.0001) return `M${x0} ${y0}`;
  if (Math.abs(a1 - a0) >= Math.PI * 2 - 0.0001) {
    return `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  }
  return `M${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

/**
 * progressRing(value, {max, size, thickness, color, label, sublabel})
 * A single-metric ring; returns an <svg> element (no shell).
 */
export function progressRing(value, { max = 100, size = 110, thickness = 10, color, label, sublabel, valueFormat = 'percent0' } = {}) {
  const fmt = fmtFor(valueFormat);
  const pct = Math.max(0, Math.min(1, Number(value) / (max || 1)));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const colour = color || (pct >= 0.85 ? STATUS.good : pct >= 0.5 ? PALETTE[0] : pct >= 0.3 ? STATUS.warning : STATUS.critical);
  return svgEl('svg', {
    viewBox: `0 0 ${size} ${size}`, width: size, height: size,
    attrs: { role: 'img', 'aria-label': `${label || 'Progress'}: ${fmt(pct * 100)}` },
  },
    svgEl('title', null, `${label || 'Progress'}: ${fmt(pct * 100)}`),
    svgEl('circle', { className: 'ch-ring-track', cx: size / 2, cy: size / 2, r, 'stroke-width': thickness }),
    svgEl('circle', {
      className: 'ch-ring-fill', cx: size / 2, cy: size / 2, r, stroke: colour, 'stroke-width': thickness,
      'stroke-dasharray': `${c} ${c}`, 'stroke-dashoffset': c * (1 - pct),
      transform: `rotate(-90 ${size / 2} ${size / 2})`,
    }),
    svgEl('text', { className: 'ch-value-lg', x: size / 2, y: size / 2 + (sublabel ? -2 : 5), 'text-anchor': 'middle' }, fmt(pct * 100)),
    sublabel && svgEl('text', { className: 'ch-value-sub', x: size / 2, y: size / 2 + 16, 'text-anchor': 'middle' }, sublabel));
}

/* ============================================================== heatmap == */

/**
 * heatmap({mode:'matrix'|'calendar', ...})
 *
 * matrix:   { rows:['VI','VII'], cols:['Maths','Science'], values:[[72,64],[81,70]] }
 * calendar: { days:[{date:'2026-04-01', value:92}], from, to }
 * Sequential single hue; a scale legend always accompanies it.
 */
export function heatmap(opts = {}) {
  return opts.mode === 'calendar' ? calendarHeatmap(opts) : matrixHeatmap(opts);
}

function matrixHeatmap(opts) {
  const rows = opts.rows || [];
  const cols = opts.cols || [];
  const values = opts.values || [];
  const flat = values.flat().filter((v) => v != null);
  const min = opts.min != null ? opts.min : Math.min(...flat, 0);
  const max = opts.max != null ? opts.max : Math.max(...flat, 1);
  const cell = opts.cellSize || 34;
  const height = opts.height || rows.length * cell + 52;
  const label = opts.title || 'Heatmap';
  const fmt = fmtFor(opts.valueFormat || 'number');
  const series = cols.map((c, ci) => ({ name: c, values: rows.map((_, ri) => (values[ri] || [])[ci]), color: PALETTE[0] }));

  return chartShell({
    height, series, categories: rows, valueFormat: opts.valueFormat, legend: false,
    tableView: opts.tableView !== false, title: label, className: opts.className,
    draw: (width, tip) => {
      const left = Math.min(140, Math.max(70, width * 0.2));
      const top = 26;
      const cw = Math.max(24, (width - left - 8) / Math.max(1, cols.length));
      const marks = [];
      cols.forEach((c, ci) => marks.push(svgEl('text', {
        className: 'ch-tick', x: left + cw * ci + cw / 2, y: 16, 'text-anchor': 'middle',
      }, String(c).length > 10 ? String(c).slice(0, 9) + '…' : String(c))));
      rows.forEach((r, ri) => {
        marks.push(svgEl('text', { className: 'ch-tick', x: left - 10, y: top + cell * ri + cell / 2 + 3.5, 'text-anchor': 'end' }, String(r)));
        cols.forEach((c, ci) => {
          const v = (values[ri] || [])[ci];
          const t = v == null ? 0 : (v - min) / (max - min || 1);
          marks.push(svgEl('rect', {
            className: 'ch-cell', x: left + cw * ci, y: top + cell * ri, width: cw, height: cell, rx: 3,
            fill: v == null ? 'var(--chart-track)' : sequentialColor(t),
            onMouseEnter: (e) => {
              const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
              const rr = e.currentTarget.getBoundingClientRect();
              tip.show(rr.left + rr.width / 2 - box.left, rr.top - box.top, tipRows(`${r} · ${c}`, [{ name: 'Value', value: v, color: sequentialColor(t) }], fmt));
            },
            onMouseLeave: () => tip.hide(),
          }));
          if (v != null && cw >= 42) {
            marks.push(svgEl('text', {
              className: t > 0.62 ? 'ch-label ch-label-inside' : 'ch-label',
              x: left + cw * ci + cw / 2, y: top + cell * ri + cell / 2 + 3.5, 'text-anchor': 'middle',
            }, fmt(v)));
          }
        });
      });
      return svgRoot(width, height, label, marks);
    },
  });
}

function calendarHeatmap(opts) {
  const days = (opts.days || []).filter((d) => d && d.date);
  const vals = days.map((d) => d.value).filter((v) => v != null);
  const min = opts.min != null ? opts.min : Math.min(...vals, 0);
  const max = opts.max != null ? opts.max : Math.max(...vals, 1);
  const cell = 13;
  const gap = 3;
  const height = opts.height || 7 * (cell + gap) + 34;
  const label = opts.title || 'Calendar heatmap';
  const fmt = fmtFor(opts.valueFormat || 'percent');
  const series = [{ name: opts.seriesName || 'Value', values: days.map((d) => d.value), color: PALETTE[0] }];

  return chartShell({
    height, series, categories: days.map((d) => d.date), valueFormat: opts.valueFormat, legend: false,
    tableView: opts.tableView !== false, title: label, className: opts.className,
    draw: (width, tip) => {
      const marks = [];
      const left = 30;
      const top = 20;
      if (!days.length) return svgRoot(width, height, label);
      const first = new Date(days[0].date);
      const offset = first.getDay();
      const monthsSeen = new Set();
      days.forEach((d, i) => {
        const idx = i + offset;
        const col = Math.floor(idx / 7);
        const row = idx % 7;
        const x = left + col * (cell + gap);
        const y = top + row * (cell + gap);
        if (x > width - cell) return;
        const t = d.value == null ? null : (d.value - min) / (max - min || 1);
        marks.push(svgEl('rect', {
          className: 'ch-cell', x, y, width: cell, height: cell, rx: 3,
          fill: t == null ? 'var(--chart-track)' : sequentialColor(t),
          onMouseEnter: (e) => {
            const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
            const rr = e.currentTarget.getBoundingClientRect();
            tip.show(rr.left + rr.width / 2 - box.left, rr.top - box.top,
              tipRows(d.date, [{ name: opts.seriesName || 'Value', value: d.value, color: t == null ? 'var(--chart-track)' : sequentialColor(t) }], fmt));
          },
          onMouseLeave: () => tip.hide(),
        }));
        const mk = new Date(d.date).getMonth();
        if (row === 0 && !monthsSeen.has(mk)) {
          monthsSeen.add(mk);
          marks.push(svgEl('text', { className: 'ch-tick', x, y: 12 }, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][mk]));
        }
      });
      ['Mon', 'Wed', 'Fri'].forEach((d, i) => marks.push(
        svgEl('text', { className: 'ch-tick', x: left - 6, y: top + (1 + i * 2) * (cell + gap) + cell - 3, 'text-anchor': 'end' }, d)));
      return svgRoot(width, height, label, marks);
    },
  });
}

/** ScaleLegend(min, max, {ramp, format}) — a DOM node pairing with sequential charts. */
export function ScaleLegend(min, max, { ramp = SEQUENTIAL, format = 'number' } = {}) {
  const fmt = fmtFor(format);
  return h('div', { className: 'ch-scale' },
    h('span', null, fmt(min)),
    h('span', { className: 'ch-scale-ramp' }, ramp.map((c) => h('span', { style: { background: c } }))),
    h('span', null, fmt(max)));
}

/* =============================================================== funnel == */

/**
 * funnelChart({stages:[{label,value}], height, valueFormat, showConversion})
 * Ordered stages use the ordinal ramp (never the categorical slots).
 */
export function funnelChart(opts = {}) {
  const stages = (opts.stages || opts.data || []).map((s, i) => ({
    label: String(s.label ?? s.stage ?? s.key), value: Number(s.value ?? s.count) || 0, color: s.color || ORDINAL[Math.min(i, ORDINAL.length - 1)],
  }));
  const height = opts.height || Math.max(180, stages.length * 42 + 30);
  const label = opts.title || 'Funnel';
  const top = stages[0] ? stages[0].value : 1;
  const series = [{ name: 'Count', values: stages.map((s) => s.value), color: ORDINAL[2] }];

  return chartShell({
    height, series, categories: stages.map((s) => s.label), valueFormat: opts.valueFormat,
    legend: false, tableView: opts.tableView !== false, title: label, className: opts.className,
    draw: (width, tip) => {
      const fmt = tip.fmt;
      const left = Math.min(190, Math.max(110, width * 0.28));
      const iw = Math.max(40, width - left - (opts.showConversion === false ? 78 : 124));
      const rowH = (height - 16) / Math.max(1, stages.length);
      const bh = Math.min(BAR_MAX, rowH - GAP * 2);
      const marks = [];
      stages.forEach((s, i) => {
        const y = 8 + rowH * i + (rowH - bh) / 2;
        const w = Math.max(2, (s.value / (top || 1)) * iw);
        marks.push(svgEl('text', { className: 'ch-tick', x: left - 10, y: y + bh / 2 + 3.5, 'text-anchor': 'end' },
          s.label.length > 24 ? s.label.slice(0, 23) + '…' : s.label));
        marks.push(svgEl('path', {
          className: 'ch-bar', d: barPath(left, y, w, bh, 4, true), fill: s.color,
          onMouseEnter: (e) => {
            const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
            const rr = e.currentTarget.getBoundingClientRect();
            tip.show(rr.left + rr.width / 2 - box.left, rr.top - box.top, tipRows(s.label, [
              { name: 'Count', value: s.value, color: s.color },
              { name: 'Of first stage', value: (s.value / (top || 1)) * 100, color: s.color },
            ], (v) => (typeof v === 'number' && v <= 100 && v % 1 !== 0 ? `${v.toFixed(1)}%` : fmt(v))));
          },
          onMouseLeave: () => tip.hide(),
        }));
        marks.push(svgEl('text', { className: 'ch-label', x: left + w + 8, y: y + bh / 2 + 3.5 }, fmt(s.value)));
        if (opts.showConversion !== false && i > 0) {
          const prev = stages[i - 1].value || 1;
          marks.push(svgEl('text', {
            className: 'ch-tick', x: width - 6, y: y + bh / 2 + 3.5, 'text-anchor': 'end',
          }, `${((s.value / prev) * 100).toFixed(0)}%`));
        }
      });
      return svgRoot(width, height, label, marks);
    },
  });
}

/* ============================================================== scatter == */

/**
 * scatterPlot({points:[{x,y,label,group,size}], height, xLabel, yLabel})
 * Series cap of 3 groups (the all-pairs CVD gate) — extras fold into "Other".
 */
export function scatterPlot(opts = {}) {
  const raw = opts.points || [];
  const groups = [];
  for (const p of raw) {
    const g = p.group || 'All';
    if (!groups.includes(g)) groups.push(g);
  }
  const kept = groups.slice(0, 3);
  const colorOf = (g) => (kept.includes(g) ? seriesColor(kept.indexOf(g)) : OTHER_COLOR);
  const height = opts.height || 280;
  const label = opts.title || 'Scatter plot';
  const shown = groups.slice(0, 3).concat(groups.length > 3 ? ['Other'] : []);
  const series = shown.map((g) => ({ name: g, values: raw.filter((p) => (kept.includes(p.group) ? p.group : 'Other') === g).map((p) => p.y), color: colorOf(g) }));

  return chartShell({
    height, series, categories: raw.map((p) => p.label || `${p.x}`), valueFormat: opts.valueFormat,
    legend: shown.length > 1, legendMark: 'dot', tableView: opts.tableView !== false, title: label, className: opts.className,
    draw: (width, tip) => {
      const fmt = tip.fmt;
      const m = { top: 14, right: 18, bottom: 34, left: 52 };
      const iw = Math.max(40, width - m.left - m.right);
      const ih = Math.max(40, height - m.top - m.bottom);
      const xs = raw.map((p) => Number(p.x));
      const ys = raw.map((p) => Number(p.y));
      const xa = axisTicks(Math.min(...xs, 0), Math.max(...xs, 1), 5);
      const ya = axisTicks(Math.min(...ys, 0), Math.max(...ys, 1), 5);
      const xOf = (v) => m.left + ((v - xa.min) / (xa.max - xa.min || 1)) * iw;
      const yOf = (v) => m.top + ih - ((v - ya.min) / (ya.max - ya.min || 1)) * ih;

      const grid = ya.ticks.map((t) => svgEl('line', { x1: m.left, y1: yOf(t), x2: m.left + iw, y2: yOf(t) }));
      const yTicks = ya.ticks.map((t) => svgEl('text', { className: 'ch-tick', x: m.left - 8, y: yOf(t) + 3.5, 'text-anchor': 'end' }, compactNumber(t)));
      const xTicks = xa.ticks.map((t) => svgEl('text', { className: 'ch-tick', x: xOf(t), y: m.top + ih + 16, 'text-anchor': 'middle' }, compactNumber(t)));

      const dots = raw.map((p) => {
        const g = kept.includes(p.group) ? p.group : (p.group ? 'Other' : 'All');
        const col = colorOf(p.group || 'All');
        const r = p.size ? Math.max(3, Math.min(14, p.size)) : DOT_R + 1;
        return frag(
          svgEl('circle', { className: 'ch-dot', cx: xOf(p.x), cy: yOf(p.y), r, fill: col, 'stroke-width': RING, opacity: 0.9 }),
          svgEl('circle', {
            className: 'ch-hit', cx: xOf(p.x), cy: yOf(p.y), r: Math.max(12, r + 8),
            onMouseEnter: (e) => {
              const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
              const scale = box.width / width;
              tip.show(xOf(p.x) * scale, yOf(p.y) * scale, tipRows(p.label || g, [
                { name: opts.xLabel || 'X', value: p.x, color: col },
                { name: opts.yLabel || 'Y', value: p.y, color: col },
              ], fmt));
            },
            onMouseLeave: () => tip.hide(),
          }));
      });

      return svgRoot(width, height, label,
        svgEl('g', { className: 'ch-grid' }, grid),
        yTicks, xTicks,
        opts.xLabel && svgEl('text', { className: 'ch-axis-title', x: m.left + iw / 2, y: height - 3, 'text-anchor': 'middle' }, opts.xLabel),
        opts.yLabel && svgEl('text', { className: 'ch-axis-title', x: 12, y: m.top + ih / 2, 'text-anchor': 'middle', transform: `rotate(-90 12 ${m.top + ih / 2})` }, opts.yLabel),
        svgEl('g', { className: 'ch-axis' }, svgEl('line', { x1: m.left, y1: m.top + ih, x2: m.left + iw, y2: m.top + ih })),
        dots);
    },
  });
}

/* =============================================================== bullet == */

/**
 * bulletChart({items:[{label, value, target, ranges:[a,b,c], format}], height})
 * Actual vs target against qualitative bands — the compact KPI form.
 */
export function bulletChart(opts = {}) {
  const items = (opts.items || []).map((it) => ({
    label: String(it.label), value: Number(it.value) || 0, target: Number(it.target) || 0,
    ranges: it.ranges || null, color: it.color || PALETTE[0],
  }));
  const rowH = 42;
  const height = opts.height || items.length * rowH + 16;
  const label = opts.title || 'Actual vs target';
  const series = [{ name: 'Actual', values: items.map((i) => i.value), color: PALETTE[0] },
    { name: 'Target', values: items.map((i) => i.target), color: 'var(--chart-ink-muted)' }];

  return chartShell({
    height, series, categories: items.map((i) => i.label), valueFormat: opts.valueFormat,
    legend: false, tableView: opts.tableView !== false, title: label, className: opts.className,
    draw: (width, tip) => {
      const fmt = tip.fmt;
      const left = Math.min(190, Math.max(110, width * 0.26));
      const right = 86;
      const iw = Math.max(40, width - left - right);
      const marks = [];
      items.forEach((it, i) => {
        const max = Math.max(it.value, it.target, ...(it.ranges || [])) * 1.08 || 1;
        const y = 10 + rowH * i;
        const bh = 14;
        const xOf = (v) => left + (v / max) * iw;
        const bands = it.ranges || [max * 0.5, max * 0.8, max];
        bands.forEach((b, bi) => marks.push(svgEl('rect', {
          x: left, y: y + 1, width: xOf(b) - left, height: bh + 4, rx: 3,
          fill: SEQUENTIAL[1 - Math.min(1, bi)] || 'var(--chart-track)',
          opacity: 0.9 - bi * 0.28,
        })));
        marks.push(svgEl('text', { className: 'ch-tick', x: left - 10, y: y + bh / 2 + 4, 'text-anchor': 'end' },
          it.label.length > 24 ? it.label.slice(0, 23) + '…' : it.label));
        marks.push(svgEl('path', {
          className: 'ch-bar', d: barPath(left, y + 4, Math.max(2, xOf(it.value) - left), bh - 2, 4, true), fill: it.color,
          onMouseEnter: (e) => {
            const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
            const rr = e.currentTarget.getBoundingClientRect();
            tip.show(rr.left + rr.width / 2 - box.left, rr.top - box.top, tipRows(it.label, [
              { name: 'Actual', value: it.value, color: it.color },
              { name: 'Target', value: it.target, color: 'var(--chart-ink-muted)' },
            ], fmt));
          },
          onMouseLeave: () => tip.hide(),
        }));
        marks.push(svgEl('line', {
          x1: xOf(it.target), y1: y - 1, x2: xOf(it.target), y2: y + bh + 7,
          stroke: 'var(--chart-ink)', 'stroke-width': 2, 'stroke-linecap': 'round',
        }));
        marks.push(svgEl('text', { className: 'ch-label', x: width - 6, y: y + bh / 2 + 4, 'text-anchor': 'end' }, fmt(it.value)));
      });
      return svgRoot(width, height, label, marks);
    },
  });
}

/* ============================================================ waterfall == */

/**
 * waterfallChart({items:[{label, value, type:'start'|'delta'|'total'}], height})
 * Positive deltas take the diverging positive pole, negatives the negative pole.
 */
export function waterfallChart(opts = {}) {
  const items = (opts.items || []).map((it) => ({
    label: String(it.label), value: Number(it.value) || 0,
    type: it.type || (it.isTotal ? 'total' : 'delta'),
  }));
  const height = opts.height || 280;
  const label = opts.title || 'Waterfall';
  const series = [{ name: 'Change', values: items.map((i) => i.value), color: PALETTE[0] }];

  return chartShell({
    height, series, categories: items.map((i) => i.label), valueFormat: opts.valueFormat,
    legend: false, tableView: opts.tableView !== false, title: label, className: opts.className,
    draw: (width, tip) => {
      const fmt = tip.fmt;
      let running = 0;
      const tops = [];
      let lo = 0;
      let hi = 0;
      for (const it of items) {
        if (it.type === 'total' || it.type === 'start') {
          tops.push({ from: 0, to: it.value });
          running = it.value;
        } else {
          tops.push({ from: running, to: running + it.value });
          running += it.value;
        }
        lo = Math.min(lo, tops[tops.length - 1].from, tops[tops.length - 1].to);
        hi = Math.max(hi, tops[tops.length - 1].from, tops[tops.length - 1].to);
      }
      const m = { top: 22, right: 16, bottom: 34, left: 60 };
      const iw = Math.max(40, width - m.left - m.right);
      const ih = Math.max(40, height - m.top - m.bottom);
      const { min, max, ticks } = axisTicks(lo, hi, 5);
      const yOf = (v) => m.top + ih - ((v - min) / (max - min || 1)) * ih;
      const bandW = iw / Math.max(1, items.length);
      const bw = Math.min(BAR_MAX + 8, bandW * 0.62);

      const grid = ticks.map((t) => svgEl('line', { x1: m.left, y1: yOf(t), x2: m.left + iw, y2: yOf(t) }));
      const yTicks = ticks.map((t) => svgEl('text', { className: 'ch-tick', x: m.left - 8, y: yOf(t) + 3.5, 'text-anchor': 'end' }, compactNumber(t)));
      const marks = [];
      items.forEach((it, i) => {
        const t = tops[i];
        const x = m.left + bandW * i + (bandW - bw) / 2;
        const y0 = yOf(Math.max(t.from, t.to));
        const hgt = Math.abs(yOf(t.to) - yOf(t.from));
        const col = it.type === 'total' || it.type === 'start' ? 'var(--chart-ink-muted)'
          : it.value >= 0 ? 'var(--chart-div-pos-2)' : 'var(--chart-div-neg-2)';
        marks.push(svgEl('path', {
          className: 'ch-bar', d: barPath(x, y0, bw, Math.max(2, hgt), 4), fill: col,
          onMouseEnter: (e) => {
            const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
            const rr = e.currentTarget.getBoundingClientRect();
            tip.show(rr.left + rr.width / 2 - box.left, rr.top - box.top, tipRows(it.label, [
              { name: it.type === 'delta' ? 'Change' : 'Balance', value: it.value, color: col },
              { name: 'Running total', value: t.to, color: 'var(--chart-ink-muted)' },
            ], fmt));
          },
          onMouseLeave: () => tip.hide(),
        }));
        marks.push(svgEl('text', { className: 'ch-label', x: x + bw / 2, y: y0 - 6, 'text-anchor': 'middle' },
          `${it.type === 'delta' && it.value > 0 ? '+' : ''}${compactNumber(it.value)}`));
        marks.push(svgEl('text', { className: 'ch-tick', x: x + bw / 2, y: m.top + ih + 16, 'text-anchor': 'middle' },
          it.label.length > 12 ? it.label.slice(0, 11) + '…' : it.label));
        if (i < items.length - 1 && it.type !== 'total') {
          marks.push(svgEl('line', {
            x1: x + bw, y1: yOf(t.to), x2: m.left + bandW * (i + 1) + (bandW - bw) / 2, y2: yOf(t.to),
            stroke: 'var(--chart-axis)', 'stroke-width': 1,
          }));
        }
      });
      return svgRoot(width, height, label,
        svgEl('g', { className: 'ch-grid' }, grid), yTicks,
        svgEl('g', { className: 'ch-axis' }, svgEl('line', { x1: m.left, y1: yOf(Math.max(min, 0)), x2: m.left + iw, y2: yOf(Math.max(min, 0)) })),
        marks);
    },
  });
}

/* ================================================================ combo == */

/**
 * comboChart({categories, bars:[{name,values,color}], line:{name,values,color},
 *             height, valueFormat})
 * ONE shared y-axis — never a second scale. Index both measures to the same
 * unit before using this, or use two charts instead.
 */
export function comboChart(opts = {}) {
  const bars = normSeries(opts.bars || []);
  const lineSeries = opts.line ? normSeries([opts.line])[0] : null;
  if (lineSeries) lineSeries.color = opts.line.color || seriesColor(bars.length);
  const categories = opts.categories || [];
  const height = opts.height || 280;
  const all = lineSeries ? bars.concat([lineSeries]) : bars;
  const label = opts.title || `Combination chart: ${all.map((s) => s.name).join(', ')}`;

  return chartShell({
    height, series: all, categories, valueFormat: opts.valueFormat, legend: opts.legend !== false,
    tableView: opts.tableView !== false, title: label, className: opts.className,
    draw: (width, tip) => {
      const fmt = tip.fmt;
      const c = cartesian({ ...opts, series: all, categories, width, height, stacked: !!opts.stacked, tip });
      const marks = [];
      const groupCount = opts.stacked ? 1 : bars.length;
      const slot = c.bandW * 0.66;
      const bw = Math.min(BAR_MAX, (slot - GAP * (groupCount - 1)) / Math.max(1, groupCount));
      const groupW = bw * groupCount + GAP * Math.max(0, groupCount - 1);

      categories.forEach((cat, i) => {
        const x0 = c.xBand(i) + (c.bandW - groupW) / 2;
        if (opts.stacked) {
          let acc = 0;
          bars.forEach((s) => {
            const v = Number(s.values[i]) || 0;
            if (!v) return;
            const y1 = c.yOf(acc + v);
            const hgt = Math.max(0, c.yOf(acc) - y1 - GAP);
            marks.push(svgEl('path', { className: 'ch-bar', d: barPath(x0, y1, bw, hgt, 4), fill: s.color }));
            acc += v;
          });
        } else {
          bars.forEach((s, si) => {
            const v = Number(s.values[i]) || 0;
            const y = c.yOf(v);
            const zero = c.yOf(Math.max(c.min, 0));
            marks.push(svgEl('path', {
              className: 'ch-bar', d: barPath(x0 + si * (bw + GAP), Math.min(y, zero), bw, Math.abs(zero - y), 4), fill: s.color,
            }));
          });
        }
      });

      if (lineSeries) {
        const pts = lineSeries.values.map((v, i) => (v == null ? null : [c.xBand(i) + c.bandW / 2, c.yOf(v)])).filter(Boolean);
        marks.push(svgEl('path', {
          className: 'ch-line', stroke: lineSeries.color,
          d: pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' '),
        }));
        pts.forEach((p) => marks.push(svgEl('circle', { className: 'ch-dot', cx: p[0], cy: p[1], r: DOT_R, fill: lineSeries.color, 'stroke-width': RING })));
      }

      const cross = svgEl('line', { className: 'ch-crosshair', x1: 0, y1: c.m.top, x2: 0, y2: c.m.top + c.ih, style: { opacity: 0 } });
      const hit = svgEl('rect', {
        className: 'ch-hit', x: c.m.left, y: c.m.top, width: c.iw, height: c.ih,
        onMouseMove: (e) => {
          const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
          const scale = box.width / width;
          const px = (e.clientX - box.left) / scale;
          const i = Math.max(0, Math.min(categories.length - 1, Math.floor((px - c.m.left) / (c.bandW || 1))));
          const cx = c.xBand(i) + c.bandW / 2;
          cross.setAttribute('x1', cx);
          cross.setAttribute('x2', cx);
          cross.style.opacity = 1;
          tip.show(cx * scale, (c.m.top + 8) * scale,
            tipRows(String(categories[i]), all.map((s) => ({ name: s.name, value: s.values[i], color: s.color })), fmt));
        },
        onMouseLeave: () => { cross.style.opacity = 0; tip.hide(); },
      });

      return svgRoot(width, height, label,
        svgEl('g', { className: 'ch-grid' }, c.grid),
        c.axisText, c.xLabels, c.targetMark,
        svgEl('g', { className: 'ch-axis' }, svgEl('line', { x1: c.m.left, y1: c.yOf(Math.max(c.min, 0)), x2: c.m.left + c.iw, y2: c.yOf(Math.max(c.min, 0)) })),
        marks, cross, hit);
    },
  });
}

/* ============================================================== treemap == */

/**
 * treemap({data:[{key,value,color}], height, valueFormat})
 * Squarified layout. Labels only render where they fit with padding.
 */
export function treemap(opts = {}) {
  const data = (opts.data || []).map((d, i) => ({
    key: String(d.key ?? d.name), value: Math.max(0, Number(d.value) || 0), color: d.color || seriesColor(i),
  })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const height = opts.height || 280;
  const label = opts.title || 'Treemap';
  const series = data.map((d) => ({ name: d.key, values: [d.value], color: d.color }));

  return chartShell({
    height, series, categories: ['Value'], valueFormat: opts.valueFormat, legend: false,
    tableView: opts.tableView !== false, title: label, className: opts.className,
    draw: (width, tip) => {
      const fmt = tip.fmt;
      const total = data.reduce((a, d) => a + d.value, 0) || 1;
      const rects = squarify(data.map((d) => ({ ...d, area: (d.value / total) * (width * height) })), 0, 0, width, height);
      const marks = rects.map(({ d, x, y, w, hgt }) => {
        const inner = { x: x + GAP / 2, y: y + GAP / 2, w: Math.max(0, w - GAP), hgt: Math.max(0, hgt - GAP) };
        const fits = inner.w > 62 && inner.hgt > 32;
        return frag(
          svgEl('rect', {
            x: inner.x, y: inner.y, width: inner.w, height: inner.hgt, rx: 4, fill: d.color,
            onMouseEnter: (e) => {
              const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
              const rr = e.currentTarget.getBoundingClientRect();
              tip.show(rr.left + rr.width / 2 - box.left, rr.top - box.top,
                tipRows(d.key, [{ name: `${((d.value / total) * 100).toFixed(1)}% of total`, value: d.value, color: d.color }], fmt));
            },
            onMouseLeave: () => tip.hide(),
          }),
          fits && svgEl('text', { className: 'ch-label ch-label-inside', x: inner.x + 9, y: inner.y + 18 },
            d.key.length > Math.floor(inner.w / 7) ? d.key.slice(0, Math.floor(inner.w / 7) - 1) + '…' : d.key),
          fits && svgEl('text', { className: 'ch-label ch-label-inside', x: inner.x + 9, y: inner.y + 34, opacity: 0.86 }, fmt(d.value)));
      });
      return svgRoot(width, height, label, marks);
    },
  });
}

function squarify(items, x, y, w, hgt) {
  const out = [];
  let rest = items.slice();
  let cx = x;
  let cy = y;
  let cw = w;
  let ch = hgt;
  while (rest.length) {
    const horizontal = cw >= ch;
    const totalArea = rest.reduce((a, d) => a + d.area, 0);
    const rowArea = pickRow(rest, horizontal ? ch : cw, totalArea, cw * ch);
    const rowItems = rest.slice(0, rowArea.count);
    const rowSum = rowItems.reduce((a, d) => a + d.area, 0);
    const thickness = (rowSum / totalArea) * (horizontal ? cw : ch);
    let offset = 0;
    for (const d of rowItems) {
      const frac = d.area / (rowSum || 1);
      if (horizontal) {
        const hh = frac * ch;
        out.push({ d, x: cx, y: cy + offset, w: thickness, hgt: hh });
        offset += hh;
      } else {
        const ww = frac * cw;
        out.push({ d, x: cx + offset, y: cy, w: ww, hgt: thickness });
        offset += ww;
      }
    }
    if (horizontal) { cx += thickness; cw -= thickness; } else { cy += thickness; ch -= thickness; }
    rest = rest.slice(rowArea.count);
    if (cw <= 0.5 || ch <= 0.5) break;
  }
  return out;
}

function pickRow(items, side, totalArea, area) {
  let best = 1;
  let bestRatio = Infinity;
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    sum += items[i].area;
    const thickness = (sum / totalArea) * (area / side) / (side || 1) * side;
    const worst = Math.max(...items.slice(0, i + 1).map((d) => {
      const len = (d.area / (sum || 1)) * side;
      return Math.max(len / (thickness || 1), (thickness || 1) / (len || 1));
    }));
    if (worst <= bestRatio) { bestRatio = worst; best = i + 1; } else break;
  }
  return { count: best };
}

/* ==================================================== stackedProgressBar == */

/**
 * stackedProgressBar({segments:[{label,value,color}], height, showLegend, valueFormat})
 * A one-row part-to-whole bar — the compact alternative to a donut.
 */
export function stackedProgressBar(opts = {}) {
  const segments = (opts.segments || opts.data || []).map((s, i) => ({
    label: String(s.label ?? s.key), value: Math.max(0, Number(s.value) || 0), color: s.color || seriesColor(i),
  }));
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const fmt = fmtFor(opts.valueFormat || 'number');
  const barH = opts.barHeight || 12;

  const bar = h('div', { className: 'stacked-bar', style: { height: barH + 'px' } },
    segments.map((s) => h('span', {
      style: { width: `${(s.value / total) * 100}%`, background: s.color },
      attrs: { title: `${s.label}: ${fmt(s.value)} (${((s.value / total) * 100).toFixed(1)}%)` },
    })));

  const legend = opts.showLegend === false ? null : h('div', { className: 'ch-legend' },
    segments.map((s) => h('span', { className: 'ch-legend-item', style: { color: s.color } },
      h('span', { className: 'ch-swatch' }),
      h('span', { className: 'ch-legend-label' }, s.label),
      h('span', { className: 'ch-legend-value' }, fmt(s.value)))));

  return h('div', { className: ['chart', opts.className].filter(Boolean).join(' ') }, bar, legend);
}

/* Convenience: the tone token for a delta direction. */
export function deltaTone(delta, upIsGood = true) {
  if (!delta) return 'flat';
  const good = delta > 0 ? upIsGood : !upIsGood;
  return good ? 'up' : 'down';
}

export default {
  lineChart, areaChart, barChart, sparkline, donutChart, pieChart, gaugeChart, radialBarChart,
  progressRing, heatmap, funnelChart, scatterPlot, bulletChart, waterfallChart, comboChart,
  treemap, stackedProgressBar, PALETTE, SEQUENTIAL, DIVERGING, ORDINAL, STATUS,
};
