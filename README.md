# Springdale ERP — School Management Platform

A complete, clickable front-end for a multi-campus school ERP. Springdale International School Group
is a fictional five-campus group with 2,400 students, 2,726 parents, a full teaching and support
roster, and a year of operating history — and this app is the software that runs it. **404 screens**
across **29 modules** cover the whole institutional lifecycle: enquiry to admission, timetabling and
attendance, examinations and report cards, fee billing and collections, payroll and appraisals,
library, transport, hostel, inventory, infirmary, front office and security, plus dedicated portals
for students, parents, teachers, employees and administrators. Twenty roles each see their own
navigation, their own dashboard and their own slice of the data. Every number on every screen is
computed from a single deterministic mock dataset of ~90,000 records, so the app stays internally
consistent no matter where you click.

---

## How to run

The app is built from **ES modules**, which browsers refuse to load over `file://`. You must serve
the folder over HTTP. Pick whichever is easiest:

| | Command | Notes |
|---|---|---|
| **Easiest** | Double-click **`start.bat`** | Finds Python or Node automatically, picks a free port, opens your browser |
| Python | `python serve.py` | Serves on <http://localhost:5173>, falls forward if the port is busy |
| Node | `npx serve -l 5173` | Any static server works |

Then open **<http://localhost:5173>**.

> **Opening `index.html` directly will not work.** Double-clicking the file loads it over `file://`,
> where the browser blocks ES module imports for security (CORS). The page detects this and shows
> instructions instead of a blank screen — but the fix is always "serve it over http://".

**Signing in:** the login screen is a role picker. Choose any of the twenty roles, or use the role
switcher in the top bar at any time. There is no password — pick a role and go.

### Showing it on another device

`serve.py` binds **all interfaces, dual-stack (IPv4 + IPv6)**, so phones, tablets and other machines
on the same Wi-Fi can reach it at `http://<your-lan-ip>:5173/`. The server prints the exact URL as
`Network :` when it starts. Use `python serve.py --local` to restrict it to loopback only.

Responses are **gzipped** (`db.js` drops 219 KB → 64 KB) and use `Cache-Control: no-cache` with
`Last-Modified`, so repeat loads revalidate to a `304` instead of re-downloading. This matters over a
tunnel or a slow network — uncompressed, the largest files time out.

### Presenting remotely — don't use a dev tunnel

VS Code dev tunnels work but are a poor demo surface:

- a **one-time security interstitial** ("You are about to connect to a developer tunnel") blocks the
  first visit in every browser — click **Continue** to get through it;
- ports are **private by default**, so anyone you send the link to hits a Microsoft sign-in wall.
  Right-click the port in VS Code → *Port Visibility* → **Public** to share it;
- the relay is **intermittently slow** — roughly one request in six stalls for tens of seconds, which
  looks exactly like a broken app mid-presentation.

Because this project is **pure static files with no build step**, the far better option is to drag the
folder onto any static host — Netlify Drop, GitHub Pages, Cloudflare Pages, S3. It will work as-is,
with no configuration. For an in-person demo, plain `start.bat` on the presenting laptop is the most
reliable choice of all.

---

## Screenshot-worthy highlights

The screens to open first, by route (paste after the `#/` in the address bar, or navigate normally):

| Screen | Route | Why it demos well |
|---|---|---|
| **Timetable Builder** | `timetable/builder` | Drag subjects onto a live grid; teacher and room clashes flag themselves as you drop |
| **Report Card Designer** | `examination/report-card-designer` | Drag blocks onto a real A4 canvas and preview against live student data |
| **Report Cards** | `examination/report-cards` | Generated progress reports with a print-accurate A4 preview |
| **Live Fleet Tracking** | `transport/tracking` | Stylised route map with per-vehicle telemetry, speed and occupancy |
| **Transport Dashboard** | `dashboard/transport` | Fleet map, route utilisation, fuel burn, maintenance and compliance in one view |
| **Monthly Attendance Register** | `attendance/monthly-register` | The statutory students × days matrix, fully populated |
| **Custom Report Builder** | `reports/builder` | Pick a module, choose fields, add filters, preview instantly |
| **Permission Matrix** | `system/permissions` | Modules × actions × roles — a genuinely dense enterprise grid |
| **Annual Planner** | `academics/annual-planner` | Gantt view of terms, exams, events and syllabus blocks |
| **Fee Collection** | `fees/collection` | Counter workflow ending in a printable receipt on school letterhead |
| **Class-Subject-Teacher Map** | `academics/class-subject-teacher` | Who teaches what, everywhere, on one scrollable grid |
| **Parent Dashboard** | `dashboard/parent` | Every child at a glance — attendance, results, fees, bus, PTM |
| **Visitor Check-in** | `security/check-in` | Register a visitor and print a gate badge in under a minute |
| **CCTV Monitoring** | `security/cctv` | Camera wall with recording health and playback scrubber |
| **Admission Funnel** | `admissions/dashboard` | Funnel health, source attribution and counsellor performance |

The full list of all 404 screens is in **[SCREENS.md](SCREENS.md)**.

---

## Demo script

A 12-minute walkthrough for presenting to a school group. Switch roles from the top-bar role
switcher; the sidebar, dashboard and permissions change with it.

1. **Open as Super Admin** (`dashboard/super-admin`). Start wide: five campuses, total strength,
   collection rate, staff count. Point out the campus switcher in the top bar — change it to a single
   campus and watch every widget re-scope.
2. **Management view** — switch to **Management** (`dashboard/management`). Group-level financials
   and enrolment trends. This is the board-meeting screen.
3. **Admissions** — switch to **Admission Officer** (`admissions/dashboard`). Walk the funnel, then
   open `admissions/online-applications` and drill into one application: documents checklist, interview
   scheduling, offer letter. Show `admissions/enquiries` as the top of the funnel.
4. **Academics** — as **Principal**, open `timetable/builder`. Drag a subject into an occupied slot
   and let the clash detector fire. Then `academics/annual-planner` for the year at a glance.
5. **The classroom** — switch to **Teacher** (`dashboard/teacher`). My classes, today's periods,
   homework to grade. Open `attendance/mark-daily` and mark a register, then
   `examination/marks-entry` for the spreadsheet-style marks grid with live totals and validation.
6. **Results** — `examination/report-cards`, open one card in the A4 preview. Then
   `examination/report-card-designer` to show the template is configurable, not hard-coded.
7. **Money** — switch to **Accountant** (`dashboard/accountant`). `fees/defaulters` for outstanding
   dues, then `fees/collection` to take a payment end-to-end and print the receipt.
   `finance/profit-loss` for the P&L view.
8. **Operations** — switch to **Transport Manager** (`transport/tracking`) for the live map, then
   **Librarian** (`library/issue`) for circulation, then **Hostel Warden**
   (`hostel/attendance`) for the evening headcount.
9. **The parent's phone** — switch to **Parent** (`dashboard/parent`). Two children, attendance,
   results, fee dues, bus location, PTM booking. This is the screen that sells the product to
   families. Show `portals/parent/fees`.
10. **The student** — switch to **Student** (`dashboard/student`): timetable, homework, results,
    library loans. Then `lms/online-classes`.
11. **Governance** — back to **Super Admin**. `system/permissions` for the role matrix,
    `system/audit-logs` for traceability, `reports/builder` to show any question can be answered
    without a developer.
12. **Close on scale** — open the command palette (**Ctrl/Cmd + K**) and type anything. Every one of
    the 404 screens is reachable in two keystrokes. Mention dark mode (top bar) and the density
    toggle — both are instant and persist.

---

## Modules

| Module | Screens | Module | Screens |
|---|---:|---|---:|
| Dashboards | 14 | Library | 16 |
| Admissions | 19 | Transport | 16 |
| Students | 14 | Hostel | 16 |
| Parents | 6 | Inventory & Assets | 16 |
| Teachers | 10 | Learning (LMS) | 13 |
| Human Resources | 25 | Communication | 13 |
| Academics | 13 | Parent-Teacher Meetings | 7 |
| Timetable | 10 | Activities & Sports | 10 |
| Attendance | 10 | Health & Wellness | 10 |
| Examination | 17 | Front Office | 9 |
| Fees | 18 | Security | 11 |
| Finance | 15 | Complaints & Tickets | 8 |
| Events | 9 | Alumni | 8 |
| Reports | 14 | Portals | 34 |
| System | 22 | *(unlisted: mobile preview)* | 1 |

**Total: 404 screens.** Sidebar sections are the user-facing grouping above; the code is organised
into ten page modules, which do not map one-to-one onto sections:

| Page module | Routes | Covers |
|---|---:|---|
| `pages/operations.js` | 74 | Library, transport, hostel, inventory, health |
| `pages/portals.js` | 68 | Student/parent/teacher/employee portals, system settings, security |
| `pages/engagement.js` | 52 | LMS, communication, PTM, activities, events |
| `pages/finance.js` | 47 | Fees, finance, reports |
| `pages/admissions.js` | 36 | Admissions, front office, complaints |
| `pages/academics.js` | 33 | Academics, timetable, teachers |
| `pages/students.js` | 28 | Students, parents, alumni |
| `pages/assessment.js` | 27 | Attendance, examinations |
| `pages/hr.js` | 25 | Human resources and payroll |
| `pages/dashboards.js` | 14 | One dashboard per role |

---

## Architecture

### Folder structure

```
index.html              Boots the app; loads the five stylesheets and app.js as a module
start.bat / serve.py    Zero-config local static servers
assets/
  css/
    tokens.css          322 design tokens — the entire visual language
    base.css            Element resets, typography, print rules
    layout.css          App shell: sidebar, topbar, breadcrumbs, page grid
    components.css      Every component skin (cards, tables, drawers, forms…)
    charts.css          Chart primitives shared by all 17 chart types
  js/
    app.js              Bootstrap: auth gate → shell → router. Owns the command
                        palette, notifications, theme/density and role switching
    registry.js         Merges every page module into ONE route table
    core/
      ui.js             104 exports — h(), Button, DataTable, Drawer, Modal, …
      page-kit.js       18 page builders (listPage, detailPage, reportPage, …)
      charts.js         17 SVG chart types, no chart library
      icons.js          236 inline SVG icons
      nav.js            The information architecture: 403 routes, role visibility
      router.js         Hash router with params and query strings
      state.js          Session, role, campus, theme; persisted to localStorage
    data/
      db.js             The mock data engine — 106 collections, ~90,000 rows
      rng.js            Seeded PRNG so every run produces identical data
    pages/              The ten page modules + auth.js
```

### The page-module contract

Every file in `assets/js/pages/` exports one thing that matters:

```js
export const routes = {
  'students/list': {
    title: 'All Students',
    subtitle: 'Every enrolled student across the group',
    section: 'students',
    render(mount, ctx) { /* append DOM to `mount` */ },
  },
};
```

- **Keys are route strings** and must match `core/nav.js` exactly.
- **`render(mount, ctx)`** appends nodes to `mount`. It is called fresh on every navigation, so it
  never has to clean up after itself.
- **`ctx`** carries `{ route, params, param, query, state, db }` — `state` includes the current
  `role` and `campusId`, which is how a screen scopes itself to the selected campus.

`registry.js` imports all ten modules, merges their `routes` into one map, reports any duplicate key
(keeping the more complete implementation) and exposes `resolve(route)`, which always returns
something renderable — a real page, or a proper 404 page definition.

### Adding a new screen in ~15 lines

```js
// in any pages/*.js module
import { listPage } from '../core/page-kit.js';
import { db, sortBy } from '../data/db.js';
import { Badge } from '../core/ui.js';

routes['library/most-borrowed'] = {
  title: 'Most Borrowed',
  subtitle: 'Titles issued most often this session',
  section: 'library',
  render(mount, ctx) {
    const cid = ctx.state.campusId;
    const rows = sortBy(
      db.books.filter((b) => (cid === 'ALL' || b.campusId === cid) && b.timesIssued > 40),
      'timesIssued', 'desc',
    );
    mount.appendChild(listPage({
      title: 'Most Borrowed',
      route: 'library/most-borrowed',
      kpis: [{ label: 'Titles', value: rows.length, icon: 'book', tone: 'brand' }],
      columns: [
        { key: 'title', label: 'Title', sticky: true, width: 260 },
        { key: 'author', label: 'Author', width: 180 },
        { key: 'timesIssued', label: 'Issues', width: 100, align: 'right', numeric: true },
        { key: 'status', label: 'Status', width: 130, render: (r) => Badge(r.status) },
      ],
      rows,
    }));
  },
};
```

Add a matching entry to `core/nav.js` and the screen appears in the sidebar, the breadcrumbs, the
command palette and the role filter automatically. No routing, no layout, no CSS.

### Design tokens

`tokens.css` defines **322 custom properties** — colour, spacing (`--sp-*`), radii (`--r-*`), type
scale (`--fs-*`), weights, line heights, shadows, motion (`--dur-*`, `--ease`), z-index, and
per-surface roles (`--surface`, `--canvas`, `--border`, `--text-muted`, …). Nothing in the app
hard-codes a colour or a pixel size; every module's injected CSS is built from these variables. That
is what makes the two switches in the top bar work instantly and everywhere:

- **Theme** — light and dark are two token sets on `<html data-theme>`.
- **Density** — comfortable and compact rescale the spacing tokens on `<html data-density>`.

Each page module injects its own stylesheet once, under a unique `<style>` id
(`dashboards-module-css`, `fin-module-css`, `ops-module-styles`, …), with all class names namespaced to
that module (`.dash-*`, `.fin-*`, `.ops-*`, …) so no module can bleed into another.

### The mock data engine

`data/db.js` generates the entire dataset at import time from a **seeded PRNG** (`data/rng.js`), so
every reload — on every machine — produces byte-identical data. That is what lets a student's fee
balance on the parent portal agree with the accountant's defaulter list.

- **106 collections, ~90,000 rows**: 12,048 timetable slots, 12,000 books, 11,386 marks, 7,530
  attendance records, 5,188 invoices, 5,156 payments, 4,560 staff attendance rows, 2,726 parents,
  2,400 students, and so on down to fee heads and grade scales.
- **A demo clock** fixed at 2026-08-20 09:30, mid-way through the 2026-27 session, so history and
  upcoming events both exist.
- **`analytics`** — 36 pre-aggregated roll-ups (enrolment trends, performance matrices, collection
  curves) for dashboard widgets that would otherwise recompute on every paint.
- **Query helpers** — `byId`, `where`, `search`, `sortBy`, `groupBy`, `countBy`, `sum`, `avg`,
  `student360(id)` (a full 360° record for one student), `formatAddress`, and more.

---

## What this is not

**This is a front-end mock, not a working product.** There is no backend, no API, no database and no
server-side anything — `serve.py` and `start.bat` only hand static files to the browser.

- **Nothing you do is saved.** Creating a student, taking a fee payment or marking attendance updates
  the in-memory dataset and shows the correct toast, but a browser reload restores the original
  seeded data.
- **The only persistence is `localStorage`**, and only for session preferences: which role you picked,
  the selected campus, theme, density, favourites and recently-visited routes.
- **No real data.** Every person, phone number, address, invoice and exam result is generated. Any
  resemblance to a real school or student is coincidental.
- **No authentication.** The login screen is a role picker; there are no passwords to get wrong.
- Print and export actions produce real printable views and CSV downloads from the mock data; email
  and SMS actions are simulated with notifications.
