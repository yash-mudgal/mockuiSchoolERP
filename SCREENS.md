# Screen Inventory

Every screen in the Springdale ERP mock, grouped by sidebar section. Each row lists the route key
(the string after `#/` in the address bar), the screen title, what it is for, and which roles can
reach it from the navigation.

**404 screens** across **29 sections**, built by ten page modules.
Route keys are validated against `assets/js/core/nav.js` (403 navigable routes) — 0 missing, 0 duplicated.

## Contents

- [Dashboards](#dashboards) — 14 screens
- [Admissions](#admissions) — 19 screens
- [Students](#students) — 14 screens
- [Parents](#parents) — 6 screens
- [Teachers](#teachers) — 10 screens
- [Human Resources](#human-resources) — 25 screens
- [Academics](#academics) — 13 screens
- [Timetable](#timetable) — 10 screens
- [Attendance](#attendance) — 10 screens
- [Examination](#examination) — 17 screens
- [Fees](#fees) — 18 screens
- [Finance](#finance) — 15 screens
- [Library](#library) — 16 screens
- [Transport](#transport) — 16 screens
- [Hostel](#hostel) — 16 screens
- [Inventory & Assets](#inventory-assets) — 16 screens
- [Learning (LMS)](#learning-lms-) — 13 screens
- [Communication](#communication) — 13 screens
- [Parent-Teacher Meetings](#parent-teacher-meetings) — 7 screens
- [Activities & Sports](#activities-sports) — 10 screens
- [Health & Wellness](#health-wellness) — 10 screens
- [Front Office](#front-office) — 9 screens
- [Security](#security) — 11 screens
- [Complaints & Tickets](#complaints-tickets) — 8 screens
- [Events](#events) — 9 screens
- [Alumni](#alumni) — 8 screens
- [Reports](#reports) — 14 screens
- [Portals](#portals) — 34 screens
- [System](#system) — 22 screens
- [Not in the sidebar](#not-in-the-sidebar) — 1

## Dashboards

14 screens · module `dashboards`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `dashboard/overview` | KPI / MIS Overview | One executive scorecard across every module and campus | Super Admin, Management, Principal, Vice Principal, Administrator |
| `dashboard/super-admin` | Super Admin Dashboard | Multi-campus control tower, system health and access governance | Super Admin, Administrator |
| `dashboard/management` | Management Dashboard | Revenue, surplus, enrolment and the risks the board should discuss | Super Admin, Management |
| `dashboard/principal` | Principal Dashboard | Campus performance, attendance, academics and approvals | Super Admin, Principal, Vice Principal |
| `dashboard/teacher` | Teacher Dashboard | Today's periods, registers to mark, homework and grading | Super Admin, Teacher, Class Teacher, Principal |
| `dashboard/accountant` | Accounts Dashboard | Collection against target, day book, ageing and approvals | Super Admin, Accountant, Principal, Management |
| `dashboard/hr` | Human Resources Dashboard | Headcount, attendance, leave, payroll and recruitment | Super Admin, HR Manager, HR Executive, Principal |
| `dashboard/librarian` | Library Dashboard | Circulation, overdue loans, fines and collection health | Super Admin, Librarian, Principal |
| `dashboard/transport` | Transport Dashboard | Live fleet map, route utilisation, fuel, maintenance and compliance | Super Admin, Transport Manager, Principal, Management |
| `dashboard/hostel` | Hostel Dashboard | Occupancy, roll call, mess, gate passes and complaints | Super Admin, Hostel Warden, Principal |
| `dashboard/nurse` | Infirmary Dashboard | Visits, active cases, allergies, checkups and vaccination cover | Super Admin, School Nurse, Principal |
| `dashboard/front-office` | Front Office Dashboard | Visitors, gate passes, calls, enquiries, couriers and appointments | Super Admin, Front Office, Administrator |
| `dashboard/student` | My Dashboard | Timetable, attendance, homework, results, fees and library | Super Admin, Student |
| `dashboard/parent` | Parent Dashboard | Every child at a glance — attendance, results, fees, bus and PTM | Super Admin, Parent |

## Admissions

19 screens · module `admissions`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `admissions/dashboard` | Admission Dashboard | Funnel health, source attribution and counsellor performance | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/enquiries` | Enquiries | Every admission enquiry captured across channels | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/leads` | Lead Pipeline | Drag candidates across the admission pipeline | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/follow-ups` | Follow-ups | Every counsellor touchpoint and what is due next | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/counselling` | Counselling | Campus visits, counselling sessions and parent objections | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/online-applications` | Online Applications | Applications submitted through the school portal and at the desk | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/application-review` | Application Review | Side-by-side form data and document viewer | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/document-verification` | Document Verification | Checklist compliance across every live application | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/entrance-test` | Entrance Test | Schedule sittings, capture scores and rank automatically | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/interview` | Interview | Panel scheduling, scorecards and recommendations | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/merit-list` | Merit List | Composite ranking with a live cut-off and bulk offer generation | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/selected-candidates` | Selected Candidates | Offers issued and awaiting acceptance | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/admission-fee` | Admission Fee | Collect the one-time admission fee against issued offers | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/confirmation` | Confirmation | Confirm seats and generate admission numbers | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/registration` | Registration | Capture a new admission enquiry or registration | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/waiting-list` | Waiting List | Candidates held against seat availability | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/cancellation` | Cancellations | Withdrawn enquiries, lapsed offers and refunds | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/reports` | Admission Reports | Funnel conversion, source ROI and class-wise intake | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `admissions/settings` | Admission Settings | Session windows, fees, documents and automation | Super Admin, Administrator, Principal |

## Students

14 screens · module `students`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `students/all` | All Students | Every enrolled student across the selected campus | 18 roles |
| `students/profile` | Student 360 Profile | Everything the school knows about one student | 18 roles |
| `students/add` | Add Student | Create an admission record for the 2026-27 session | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `students/promote` | Promote Students | Move a whole class into the next session in four steps | Super Admin, Principal, Vice Principal, Administrator |
| `students/transfer` | Transfer / TC | Generate transfer certificates and track exits | Super Admin, Principal, Vice Principal, Administrator |
| `students/id-cards` | ID Cards | Design, preview and print student identity cards | Super Admin, Administrator, Front Office |
| `students/certificates` | Certificates | Bonafide, character, conduct and achievement certificates | Super Admin, Principal, Vice Principal, Administrator, Front Office |
| `students/siblings` | Siblings | Families with more than one child enrolled | 18 roles |
| `students/categories` | Categories & Houses | Reservation categories, houses and demographic mix | Super Admin, Principal, Vice Principal, Administrator |
| `students/documents` | Documents | Verification status of every student document on file | 18 roles |
| `students/behaviour` | Behaviour Records | Conduct, punctuality and disciplinary follow-up | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `students/awards` | Awards & Achievements | Every award recorded against a student | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `students/bulk-import` | Bulk Import | Upload a spreadsheet, map the columns, fix the errors, import | Super Admin, Administrator |
| `students/reports` | Student Reports | Enrolment, performance, attendance and demographics | 18 roles |

## Parents

6 screens · module `students`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `parents/directory` | Parent Directory | Every guardian linked to an enrolled student | 18 roles |
| `parents/profile` | Parent Profile | Guardian record with linked children and portal activity | 18 roles |
| `parents/link-children` | Link Children | Attach students to a guardian record | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `parents/logins` | Parent Logins | Portal accounts, adoption and access control | Super Admin, Administrator |
| `parents/feedback` | Feedback | What parents are telling the school | Super Admin, Management, Principal, Vice Principal, Administrator |
| `parents/reports` | Parent Reports | Engagement, adoption and satisfaction | Super Admin, Management, Principal, Vice Principal, Administrator |

## Teachers

10 screens · module `academics`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `teachers/directory` | Teacher Directory | Every teaching member of staff, their load and their classes | 18 roles |
| `teachers/profile` | Teacher Profile | Workload, classes, plans, appraisal and records | 18 roles |
| `teachers/class-allocation` | Class Allocation | Class-teacher duty across every section | Super Admin, Principal, Vice Principal, Administrator |
| `teachers/subject-allocation` | Subject Allocation | Teacher × subject matrix with weekly period counts | Super Admin, Principal, Vice Principal, Administrator |
| `teachers/timetable` | Teacher Timetable | Personal grid, free-teacher board and department day view | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `teachers/substitution` | Substitution | Cover absent teachers with ranked, free, subject-matched staff | Super Admin, Principal, Vice Principal, Administrator |
| `teachers/lesson-plans` | Lesson Plans | Weekly plans submitted, reviewed and approved | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `teachers/appraisal` | Appraisal | Cycle scores, feedback and development goals | Super Admin, Principal, HR Manager |
| `teachers/workload` | Workload Analysis | Weekly period load, fairness and capacity headroom | Super Admin, Principal, Vice Principal, Administrator |
| `teachers/reports` | Teacher Reports | Staffing, deployment, performance and attendance | Super Admin, Principal, Vice Principal, Administrator |

## Human Resources

25 screens · module `hr`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `hr/employees` | Employee Directory | Every person on the payroll across the five campuses | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/employee-profile` | Employee 360 Profile | Personal, job, payroll, attendance, appraisal and exit in one record | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/departments` | Departments | Headcount, cost and leadership for every department | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/designations` | Designations & Grades | Salary bands, headcount and pay-range compliance | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/recruitment` | Open Positions | Requisitions, pipeline health and time-to-fill | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/applicants` | Applicant Pipeline | Drag candidates between stages · click a card for the full profile | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/interviews` | Interview Schedule | Panel calendar, scorecards and hiring recommendations | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/onboarding` | Onboarding & Joining | Pre-joining checklist, documents and day-one readiness | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/documents` | Employee Documents | Statutory file completeness and expiry tracking | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/attendance` | Staff Attendance | Biometric log, monthly register and late-arrival analysis | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/leave-requests` | Leave Requests | Multi-level approval queue for every leave application | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/leave-types` | Leave Types | Entitlement rules, carry-forward and encashment policy | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/leave-balance` | Leave Balance | Entitlement versus consumption for every employee | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/holidays` | Holiday Calendar | Gazetted, festival and vacation days for the academic year | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/payroll-runs` | Payroll Runs | Monthly computation, approval and disbursement | Super Admin, HR Manager, Accountant, Management |
| `hr/salary-structure` | Salary Structure | Component builder with formulas, statutory flags and a live preview | Super Admin, HR Manager, Accountant |
| `hr/payslips` | Payslips | Every generated payslip with a printable layout | Super Admin, HR Manager, Accountant |
| `hr/loans` | Loans & Advances | Sanctioned loans, EMI recovery and outstanding exposure | Super Admin, HR Manager, Accountant |
| `hr/appraisal` | Appraisal | Cycle progress, rating distribution and hike recommendations | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/training` | Training & Development | Programmes, enrolment, completion and feedback | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/promotions` | Promotions & Transfers | Grade movements, campus transfers and salary revisions | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/resignations` | Resignations | Notice period tracking, exit interviews and attrition | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/exit-clearance` | Exit Clearance | Department-wise no-dues checklist for every exiting employee | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `hr/full-and-final` | Full & Final Settlement | Final dues computation, recoveries and payout status | Super Admin, HR Manager, Accountant |
| `hr/reports` | HR Reports | Headcount, attrition, cost and diversity analytics | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |

## Academics

13 screens · module `academics`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `academics/years` | Academic Years | Sessions, terms and the roll-over calendar | Super Admin, Principal, Vice Principal, Administrator |
| `academics/boards` | Boards | Affiliations, grading systems and campus mapping | Super Admin, Principal, Vice Principal, Administrator |
| `academics/classes` | Classes | Class master with sections, strength and subject load | Super Admin, Principal, Vice Principal, Administrator |
| `academics/sections` | Sections | Section master, class teachers, rooms and seat occupancy | Super Admin, Principal, Vice Principal, Administrator |
| `academics/subjects` | Subjects | Subject master with marks, practicals and teaching load | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `academics/subject-groups` | Subject Groups | Bundle subjects into the packages each class level studies | Super Admin, Principal, Vice Principal, Administrator |
| `academics/curriculum` | Curriculum | Unit-wise plan for every class and subject | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `academics/syllabus-tracker` | Syllabus Tracker | Chapter completion across every class and subject | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `academics/learning-outcomes` | Learning Outcomes | NCERT-aligned outcomes with measured mastery | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `academics/calendar` | Academic Calendar | Terms, exams, events and holidays in one month view | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `academics/annual-planner` | Annual Planner | Gantt view of terms, exams, events and syllabus blocks | Super Admin, Principal, Vice Principal, Administrator |
| `academics/class-subject-teacher` | Class-Subject-Teacher Map | Who teaches what, everywhere, on one grid | Super Admin, Principal, Vice Principal, Administrator |
| `academics/grading-systems` | Grading Systems | Grade scales, bands and pass rules per board | Super Admin, Principal, Vice Principal, Administrator |

## Timetable

10 screens · module `academics`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `timetable/master` | Master Timetable | Every scheduled period across the campus | Super Admin, Principal, Vice Principal, Administrator |
| `timetable/builder` | Timetable Builder | Drag subjects onto the grid — clashes are flagged as you go | Super Admin, Principal, Vice Principal, Administrator |
| `timetable/class` | Class Timetable | Printable weekly grid for a section | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `timetable/teacher` | Teacher Timetable | Weekly grid and free periods for a member of staff | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `timetable/room` | Room Timetable | Occupancy for a single room across the week | Super Admin, Principal, Vice Principal, Administrator |
| `timetable/periods` | Period Settings | Bell times, breaks and the weekly period structure | Super Admin, Principal, Vice Principal, Administrator |
| `timetable/substitution` | Substitution | Cover absent teachers with ranked, free, subject-matched staff | Super Admin, Principal, Vice Principal, Administrator |
| `timetable/room-allocation` | Room Allocation | Rooms, labs and their weekly utilisation | Super Admin, Principal, Vice Principal, Administrator |
| `timetable/conflicts` | Conflict Report | Every clash the scheduler can see, ranked by severity | Super Admin, Principal, Vice Principal, Administrator |
| `timetable/publish` | Publish Timetable | Pre-flight checks, section-wise status and release | Super Admin, Principal, Vice Principal, Administrator |

## Attendance

10 screens · module `assessment`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `attendance/mark-daily` | Mark Daily Attendance | Fast keyboard-first roll call for one section at a time. | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `attendance/period` | Period Attendance | Subject-teacher marking period by period. | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `attendance/class-wise` | Class-wise Attendance | Section-level roll-call summary for the whole campus. | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `attendance/monthly-register` | Monthly Register | The statutory students × days attendance matrix. | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `attendance/corrections` | Attendance Corrections | Back-dated register changes awaiting academic-lead approval. | Super Admin, Principal, Vice Principal, Administrator |
| `attendance/leave-requests` | Student Leave Requests | Parent-submitted leave applications and their approval trail. | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `attendance/late-early` | Late / Early Records | Gate exceptions, delay profile and repeat offenders. | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `attendance/devices` | Biometric / RFID Devices | Reader inventory, punch throughput and sync health. | Super Admin, Administrator |
| `attendance/defaulters` | Defaulters (<75%) | Students below the CBSE eligibility threshold, with bulk parent notification. | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `attendance/reports` | Attendance Reports | Calendar heatmap, trend lines and class comparison against target. | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |

## Examination

17 screens · module `assessment`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `examination/setup` | Exam Setup | Create an examination cycle in four guided steps. | Super Admin, Principal, Vice Principal, Administrator |
| `examination/groups` | Exam Groups | Every examination cycle in the 2026-27 session. | Super Admin, Principal, Vice Principal, Administrator |
| `examination/schedule` | Exam Schedule | Datesheet grid with an automatic conflict check. | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `examination/seating` | Seating & Hall Tickets | Alternate-class seating grids and the admit-card generator. | Super Admin, Principal, Vice Principal, Administrator |
| `examination/invigilators` | Invigilator Allocation | Fair-share duty roster with own-subject exclusion. | Super Admin, Principal, Vice Principal, Administrator |
| `examination/marks-entry` | Marks Entry | Spreadsheet grid with inline validation and autosave. | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `examination/grade-config` | Grade Configuration | Grade bands, grade points and descriptors. | Super Admin, Principal, Vice Principal, Administrator |
| `examination/weightage` | Weightage | How each cycle and each paper component rolls into the final result. | Super Admin, Principal, Vice Principal, Administrator |
| `examination/question-bank` | Question Bank | Vetted questions filterable by chapter, difficulty, type and Bloom level. | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `examination/online-exams` | Online Exams | Computer-based tests with a builder and a student-facing runner. | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `examination/omr` | OMR Processing | Scan, read and validate optical answer sheets. | Super Admin, Principal, Vice Principal, Administrator |
| `examination/result-processing` | Result Processing | Validate, weight, grade, rank and publish. | Super Admin, Principal, Vice Principal, Administrator |
| `examination/report-cards` | Report Cards | Generated progress reports with a live A4 preview. | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `examination/report-card-designer` | Report Card Designer | Drag blocks onto an A4 canvas and preview against live data. | Super Admin, Principal, Vice Principal, Administrator |
| `examination/merit-list` | Rank / Merit List | Overall merit with house averages and score distribution. | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `examination/performance` | Performance Analysis | Subject-wise, class-wise, year-on-year and weak-area analysis. | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `examination/re-evaluation` | Re-evaluation | Re-totalling, photocopy and full re-evaluation requests. | Super Admin, Principal, Vice Principal, Administrator |

## Fees

18 screens · module `finance`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `fees/heads` | Fee Heads | Every chargeable component that can appear on a fee structure | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/structures` | Fee Structures | Published class-wise fee plans for the current academic year | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/class-wise` | Class-wise Fees | Fee head x class matrix with inline editing | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/assignment` | Student Fee Assignment | Map students to a fee structure and apply concessions in bulk | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/installments` | Installment Plans | Design how an annual fee is split across the year | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/collection` | Collect Fee | Search a student, pick the installments to settle and issue a printed receipt | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/receipts` | Receipts | Every receipt issued this academic year | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/outstanding` | Due / Outstanding | Ageing analysis of every unpaid installment | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/discounts` | Discounts | Rule-based reductions applied before invoicing | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/scholarships` | Scholarships | Applications, approvals and the annual scholarship budget | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/concessions` | Concessions | Case-by-case fee relief with a documented approval trail | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/late-fees` | Late Fees | Penalties accrued on overdue installments, and waivers | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/refunds` | Refunds | Deposit returns, duplicate payments and cancellation refunds | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/cancelled-receipts` | Cancelled Receipts | Every cancellation with its audit reason and reversal entry | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/reminders` | Reminders | Automated and manual fee reminder campaigns | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/online-payments` | Online Payments | Payment gateway transaction log and reconciliation | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/defaulters` | Defaulter List | Students carrying unpaid dues, ready for bulk follow-up | Super Admin, Management, Principal, Accountant, Administrator |
| `fees/reports` | Fee Reports | Collection, outstanding and head-wise analysis | Super Admin, Management, Principal, Accountant, Administrator |

## Finance

15 screens · module `finance`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `finance/chart-of-accounts` | Chart of Accounts | The ledger hierarchy every voucher posts into | Super Admin, Management, Principal, Accountant |
| `finance/income` | Income | Every rupee received, mapped to an income ledger | Super Admin, Management, Principal, Accountant |
| `finance/expenses` | Expenses | Expense vouchers, approvals and category analysis | Super Admin, Management, Principal, Accountant |
| `finance/vouchers` | Vouchers | Payment, receipt, journal and contra vouchers | Super Admin, Management, Principal, Accountant |
| `finance/ledger` | Ledger | Account-wise entries with a running balance | Super Admin, Management, Principal, Accountant |
| `finance/bank-accounts` | Bank Accounts | Operating accounts, balances and reconciliation status | Super Admin, Management, Principal, Accountant |
| `finance/cash-book` | Cash Book | Cash receipts and payments with a running cash balance | Super Admin, Management, Principal, Accountant |
| `finance/day-book` | Day Book | Every transaction posted, in chronological order | Super Admin, Management, Principal, Accountant |
| `finance/vendors` | Vendors | Supplier master, payment terms and outstanding balances | Super Admin, Management, Principal, Accountant |
| `finance/purchase-orders` | Purchase Orders | Orders raised on vendors, from draft to goods received | Super Admin, Management, Principal, Accountant |
| `finance/budgets` | Budgets | Allocation against actual spend, head by head | Super Admin, Management, Principal, Accountant |
| `finance/depreciation` | Asset Depreciation | Written-down value schedule for the fixed asset register | Super Admin, Management, Principal, Accountant |
| `finance/trial-balance` | Trial Balance | Debit and credit balances of every ledger as on 20 Aug 2026 | Super Admin, Management, Principal, Accountant |
| `finance/profit-loss` | Profit & Loss | Income and expenditure statement for the year to date | Super Admin, Management, Principal, Accountant |
| `finance/reports` | Financial Reports | Statutory and management reporting pack | Super Admin, Management, Principal, Accountant |

## Library

16 screens · module `operations`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `library/dashboard` | Library Dashboard | Circulation, stock health and overdue exposure | Super Admin, Principal, Librarian, Administrator |
| `library/catalog` | Book Catalog | Every title held across the campus libraries | Super Admin, Principal, Librarian, Administrator, Teacher, Student |
| `library/add-book` | Add Book | Accession a new title into the catalogue | Super Admin, Principal, Librarian, Administrator |
| `library/categories` | Categories | Subject classes and how heavily each one circulates | Super Admin, Principal, Librarian, Administrator |
| `library/authors` | Authors | Author authority file and holdings per author | Super Admin, Principal, Librarian, Administrator |
| `library/publishers` | Publishers | Publisher directory and supply history | Super Admin, Principal, Librarian, Administrator |
| `library/copies` | Copies & Barcodes | Accession-level register with printable barcodes | Super Admin, Principal, Librarian, Administrator |
| `library/issue` | Issue Book | Barcode-first issue desk | Super Admin, Principal, Librarian, Administrator |
| `library/return` | Return Book | Scan to check a copy back in and settle the fine | Super Admin, Principal, Librarian, Administrator |
| `library/renew` | Renew | Extend a loan without a trip to the shelf | Super Admin, Principal, Librarian, Administrator |
| `library/reservations` | Reservations | Hold queue for titles where every copy is out | Super Admin, Principal, Librarian, Administrator |
| `library/fines` | Fines | Overdue charges, waivers and collection | Super Admin, Principal, Librarian, Administrator |
| `library/lost-damaged` | Lost / Damaged | Write-offs, replacement charges and repair queue | Super Admin, Principal, Librarian, Administrator |
| `library/members` | Members | Library cards, quotas and borrowing history | Super Admin, Principal, Librarian, Administrator |
| `library/digital` | Digital Library | E-books, journals and streaming resources | Super Admin, Principal, Librarian, Administrator, Teacher, Student |
| `library/reports` | Library Reports | Circulation, stock and fine analytics | Super Admin, Principal, Librarian, Administrator |

## Transport

16 screens · module `operations`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `transport/dashboard` | Transport Dashboard | Fleet health, route utilisation and running cost | Super Admin, Management, Principal, Transport Manager, Administrator |
| `transport/vehicles` | Vehicles | Fleet register with document-expiry warnings | Super Admin, Management, Principal, Transport Manager, Administrator |
| `transport/drivers` | Drivers & Conductors | Crew register, licences and verification status | Super Admin, Management, Principal, Transport Manager, Administrator |
| `transport/routes` | Routes | Route builder with ordered stops, timings and loads | Super Admin, Management, Principal, Transport Manager, Administrator |
| `transport/stops` | Stops | Every boarding point with timings and load | Super Admin, Management, Principal, Transport Manager, Administrator |
| `transport/tracking` | Route Map / Live Tracking | Stylised fleet map with per-vehicle telemetry | Super Admin, Management, Principal, Transport Manager, Administrator |
| `transport/allocation` | Student Route Allocation | Who rides which bus, from which stop | Super Admin, Management, Principal, Transport Manager, Administrator |
| `transport/bus-attendance` | Bus Attendance | Boarding and alighting scans per trip | Super Admin, Management, Principal, Transport Manager, Administrator |
| `transport/fuel-log` | Fuel Log | Every fill, litre and rupee against the fleet | Super Admin, Management, Principal, Transport Manager, Administrator |
| `transport/maintenance` | Maintenance | Workshop jobs, downtime and spend | Super Admin, Management, Principal, Transport Manager, Administrator |
| `transport/documents` | Insurance & Documents | Statutory paperwork for every vehicle | Super Admin, Management, Principal, Transport Manager, Administrator |
| `transport/trip-log` | Trip Log | Every run, its timing and its load | Super Admin, Management, Principal, Transport Manager, Administrator |
| `transport/fees` | Transport Fees | Route-based fee billing and collection | Super Admin, Management, Principal, Transport Manager, Administrator, Accountant |
| `transport/incidents` | Incidents | Road, vehicle and boarding incidents | Super Admin, Management, Principal, Transport Manager, Administrator |
| `transport/reports` | Transport Reports | Utilisation, cost per kilometre and punctuality | Super Admin, Management, Principal, Transport Manager, Administrator |
| `transport/settings` | Transport Settings | Fares, safety rules and tracking configuration | Super Admin, Transport Manager, Administrator |

## Hostel

16 screens · module `operations`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `hostel/dashboard` | Hostel Dashboard | Occupancy, attendance and mess at a glance | Super Admin, Principal, Hostel Warden, Administrator |
| `hostel/buildings` | Hostels / Buildings | Blocks, capacity and mess assignment | Super Admin, Principal, Hostel Warden, Administrator |
| `hostel/rooms` | Rooms | Every room with its occupancy and condition | Super Admin, Principal, Hostel Warden, Administrator |
| `hostel/beds` | Beds | Block → floor → room → bed occupancy map | Super Admin, Principal, Hostel Warden, Administrator |
| `hostel/allocation` | Room Allocation | Who sleeps where, with mess plan and local guardian | Super Admin, Principal, Hostel Warden, Administrator |
| `hostel/attendance` | Hostel Attendance | Nightly roll call at 21:30 | Super Admin, Principal, Hostel Warden, Administrator |
| `hostel/wardens` | Wardens | Duty roster and pastoral responsibility | Super Admin, Principal, Hostel Warden, Administrator |
| `hostel/mess-menu` | Mess Menu | Weekly menu planner across all meals | Super Admin, Principal, Hostel Warden, Administrator |
| `hostel/mess-attendance` | Mess Attendance | Plates served against residents on the roll | Super Admin, Principal, Hostel Warden, Administrator |
| `hostel/visitors` | Visitors | Parent and guardian visits to the hostel | Super Admin, Principal, Hostel Warden, Administrator |
| `hostel/gate-pass` | Gate Pass | Outings, weekend leave and returns | Super Admin, Principal, Hostel Warden, Administrator |
| `hostel/fees` | Hostel Fees | Room rent, mess charges and collection status | Super Admin, Principal, Hostel Warden, Administrator, Accountant |
| `hostel/complaints` | Complaints | Resident grievances and their resolution | Super Admin, Principal, Hostel Warden, Administrator |
| `hostel/maintenance` | Maintenance | Room repair tickets and the estate queue | Super Admin, Principal, Hostel Warden, Administrator |
| `hostel/room-transfer` | Room Transfer | Requests to move room, block or bed | Super Admin, Principal, Hostel Warden, Administrator |
| `hostel/reports` | Hostel Reports | Occupancy, attendance, mess and recovery | Super Admin, Principal, Hostel Warden, Administrator |

## Inventory & Assets

16 screens · module `operations`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `inventory/categories` | Item Categories | How the store is organised and what each class is worth | Super Admin, Administrator, Principal, Accountant |
| `inventory/items` | Items | The full SKU master across every store | Super Admin, Administrator, Principal, Accountant |
| `inventory/stock` | Stock | Live levels with reorder alerts | Super Admin, Administrator, Principal, Accountant |
| `inventory/stock-in` | Stock In | Goods received into the stores | Super Admin, Administrator, Principal, Accountant |
| `inventory/stock-out` | Stock Out / Issue | Issues to departments, labs and classrooms | Super Admin, Administrator, Principal, Accountant |
| `inventory/purchase-requests` | Purchase Requests | Indents waiting for approval before a PO is cut | Super Admin, Administrator, Principal, Accountant |
| `inventory/purchase-orders` | Purchase Orders | Orders placed on vendors and their receipt status | Super Admin, Administrator, Principal, Accountant |
| `inventory/grn` | Goods Receipt (GRN) | What actually arrived against each purchase order | Super Admin, Administrator, Principal, Accountant |
| `inventory/vendors` | Vendors | Supplier directory, performance and outstanding | Super Admin, Administrator, Principal, Accountant |
| `inventory/returns` | Returns | Stock returned to the store or back to the vendor | Super Admin, Administrator, Principal, Accountant |
| `inventory/damaged` | Damaged Stock | Breakage, expiry and write-offs | Super Admin, Administrator, Principal, Accountant |
| `inventory/audit` | Stock Audit | Physical count against the ledger, with variance | Super Admin, Administrator, Principal, Accountant |
| `inventory/assets` | Asset Register | Capitalised assets with tags, value and condition | Super Admin, Administrator, Principal, Accountant |
| `inventory/asset-assignment` | Asset Assignment | Who holds which asset, and where it sits | Super Admin, Administrator, Principal, Accountant |
| `inventory/asset-maintenance` | Asset Maintenance | AMC visits, preventive service and breakdown repair | Super Admin, Administrator, Principal, Accountant |
| `inventory/reports` | Inventory Reports | Valuation, consumption and asset depreciation | Super Admin, Administrator, Principal, Accountant |

## Learning (LMS)

13 screens · module `engagement`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `lms/courses` | Courses | Course catalogue across classes and subjects | Super Admin, Principal, Vice Principal, Teacher, Class Teacher, Administrator, Student |
| `lms/chapters` | Chapters & Topics | Chapter-wise content coverage across every course | Super Admin, Principal, Vice Principal, Teacher, Class Teacher, Administrator |
| `lms/study-material` | Study Material | Notes, worksheets and presentations shared with learners | Super Admin, Principal, Vice Principal, Teacher, Class Teacher, Administrator, Student |
| `lms/video-lessons` | Video Lessons | Recorded lessons with watch analytics | Super Admin, Principal, Vice Principal, Teacher, Class Teacher, Administrator, Student |
| `lms/homework` | Homework | Daily homework assigned to class sections | Super Admin, Principal, Vice Principal, Teacher, Class Teacher, Administrator, Student |
| `lms/assignments` | Assignments | Graded assignments with rubrics and attachments | Super Admin, Principal, Vice Principal, Teacher, Class Teacher, Administrator, Student |
| `lms/submissions` | Submissions | Every learner submission with grading status | Super Admin, Principal, Vice Principal, Teacher, Class Teacher, Administrator |
| `lms/online-classes` | Online Classes | Live sessions with join links and attendance | Super Admin, Principal, Vice Principal, Teacher, Class Teacher, Administrator, Student |
| `lms/online-tests` | Online Tests | Scheduled online assessments and results | Super Admin, Principal, Vice Principal, Teacher, Class Teacher, Administrator, Student |
| `lms/question-bank` | Question Bank | Reusable questions tagged by subject, topic and Bloom level | Super Admin, Principal, Vice Principal, Teacher, Class Teacher, Administrator |
| `lms/doubts` | Doubts & Discussion | Learner questions answered by subject teachers | Super Admin, Principal, Vice Principal, Teacher, Class Teacher, Administrator, Student |
| `lms/progress` | Student Progress | Learning engagement and completion analytics | Super Admin, Principal, Vice Principal, Teacher, Class Teacher, Administrator |
| `lms/content-approval` | Content Approval | Review teacher uploads before learners see them | Super Admin, Principal, Vice Principal, Administrator |

## Communication

13 screens · module `engagement`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `communication/compose` | Compose Message | Build an audience, pick channels, preview and send | Super Admin, Principal, Vice Principal, Administrator, Front Office, Class Teacher, Teacher |
| `communication/sms` | SMS | Transactional and DLT-approved SMS campaigns | Super Admin, Principal, Vice Principal, Administrator, Front Office, Class Teacher, Teacher |
| `communication/email` | Email | Email campaigns with open and bounce tracking | Super Admin, Principal, Vice Principal, Administrator, Front Office, Class Teacher, Teacher |
| `communication/whatsapp` | WhatsApp | WhatsApp Business messages using approved templates | Super Admin, Principal, Vice Principal, Administrator, Front Office, Class Teacher, Teacher |
| `communication/push` | Push Notifications | App notifications to parent and student devices | Super Admin, Principal, Vice Principal, Administrator, Front Office, Class Teacher, Teacher |
| `communication/announcements` | Announcements | The school-wide announcement board | Super Admin, Principal, Vice Principal, Administrator, Front Office, Class Teacher, Teacher |
| `communication/notices` | Notices | Notice board entries with validity windows | Super Admin, Principal, Vice Principal, Administrator, Front Office, Class Teacher, Teacher |
| `communication/circulars` | Circulars | Formal circulars with acknowledgement tracking | Super Admin, Principal, Vice Principal, Administrator, Front Office, Class Teacher, Teacher |
| `communication/emergency-alert` | Emergency Alert | Broadcast an urgent alert to every channel at once | Super Admin, Principal, Administrator, Security |
| `communication/templates` | Templates | Reusable, DLT-approved message templates | Super Admin, Administrator |
| `communication/scheduled` | Scheduled Messages | Queued and draft messages waiting to go out | Super Admin, Principal, Vice Principal, Administrator, Front Office, Class Teacher, Teacher |
| `communication/delivery-logs` | Delivery Logs | Per-recipient delivery status for every campaign | Super Admin, Principal, Vice Principal, Administrator, Front Office, Class Teacher, Teacher |
| `communication/reports` | Communication Reports | Volume, reach, cost and engagement analytics | Super Admin, Management, Principal, Vice Principal, Administrator |

## Parent-Teacher Meetings

7 screens · module `engagement`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `ptm/schedule` | PTM Schedule | Meeting windows, capacity and booking status | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `ptm/slots` | Teacher Slots | Generate and manage the bookable slot grid | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `ptm/bookings` | Parent Bookings | The bookable grid of teachers against time slots | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `ptm/appointments` | Appointments | Day view of every appointment by teacher | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `ptm/notes` | Meeting Notes | What was discussed and what was agreed | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `ptm/feedback` | Feedback | How parents rated their PTM experience | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `ptm/reports` | PTM Reports | Attendance, participation and outcome analytics | Super Admin, Principal, Vice Principal, Administrator |

## Activities & Sports

10 screens · module `engagement`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `activities/houses` | Houses | House points leaderboard and membership | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `activities/clubs` | Clubs | Student clubs, membership and meeting schedules | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `activities/sports` | Sports | Teams, squads and season records | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `activities/competitions` | Competitions | Inter-house, inter-school and external competitions | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `activities/participation` | Event Participation | Who took part in what, and how they placed | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `activities/practice-schedule` | Practice Schedule | Weekly practice and club meeting timetable | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `activities/awards` | Awards | Awards conferred on students this session | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `activities/certificates` | Certificates | Design and generate award certificates | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `activities/achievements` | Achievement Records | The permanent record of student achievement | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `activities/reports` | Activity Reports | Participation, house points and recognition analytics | Super Admin, Principal, Vice Principal, Administrator |

## Health & Wellness

10 screens · module `operations`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `health/profiles` | Student Health Profiles | Vitals, conditions and clearance status | Super Admin, Principal, School Nurse, Administrator |
| `health/medical-history` | Medical History | Chronic conditions, past episodes and clearances | Super Admin, Principal, School Nurse, Administrator |
| `health/allergies` | Allergies | Watchlist shared with the mess, infirmary and class teachers | Super Admin, Principal, School Nurse, Administrator |
| `health/checkups` | Health Checkups | Annual physicals, dental and vision camps | Super Admin, Principal, School Nurse, Administrator |
| `health/infirmary` | Infirmary Visits | Visit log with vitals entry | Super Admin, Principal, School Nurse, Administrator |
| `health/medication` | Medication Log | Every dose administered at school, with consent | Super Admin, Principal, School Nurse, Administrator |
| `health/incidents` | Injuries & Incidents | Injury reports, first aid and follow-up | Super Admin, Principal, School Nurse, Administrator |
| `health/vaccination` | Vaccination | Immunisation coverage against the school schedule | Super Admin, Principal, School Nurse, Administrator |
| `health/emergency-contacts` | Emergency Contacts | Who to call, in what order, for every student | Super Admin, Principal, School Nurse, Administrator |
| `health/reports` | Health Reports | Wellness, infirmary load and immunisation coverage | Super Admin, Principal, School Nurse, Administrator |

## Front Office

9 screens · module `admissions`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `frontoffice/dashboard` | Reception Dashboard | Visitors, calls, couriers and walk-in enquiries at a glance | Super Admin, Front Office, Administrator, Principal |
| `frontoffice/enquiries` | Enquiry Log | Every enquiry captured at the reception desk | Super Admin, Front Office, Administrator, Principal |
| `frontoffice/call-log` | Phone Call Log | Incoming and outgoing calls handled by the desk | Super Admin, Front Office, Administrator, Principal |
| `frontoffice/courier-in` | Postal / Courier In | Inward register for post, parcels and legal documents | Super Admin, Front Office, Administrator, Principal |
| `frontoffice/courier-out` | Courier Out | Outward dispatch register with tracking | Super Admin, Front Office, Administrator, Principal |
| `frontoffice/appointments` | Appointments | Reception diary for parent and vendor meetings | Super Admin, Front Office, Administrator, Principal |
| `frontoffice/complaints` | Complaints Intake | Log grievances walked in or phoned in to reception | Super Admin, Front Office, Administrator, Principal |
| `frontoffice/lost-found` | Lost & Found | Items lost, found, claimed and disposed | Super Admin, Front Office, Administrator, Principal |
| `frontoffice/student-search` | Student Search | Find any student instantly from the reception counter | Super Admin, Front Office, Administrator, Principal |

## Security

11 screens · module `portals`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `security/visitors` | Visitor Management | Every person on campus, and who they came to see | Super Admin, Security, Administrator, Principal, Front Office |
| `security/check-in` | Visitor Check-in | Register a visitor and print a gate badge in under a minute | Super Admin, Security, Administrator, Principal, Front Office |
| `security/check-out` | Visitor Check-out | Close out visits and collect badges at the gate | Super Admin, Security, Administrator, Principal, Front Office |
| `security/gate-pass-student` | Gate Pass — Student | Early departures, authorised by the class teacher or principal | Super Admin, Security, Administrator, Principal, Front Office |
| `security/gate-pass-staff` | Gate Pass — Staff | Official duty and personal exits during working hours | Super Admin, Security, Administrator, Principal, Front Office |
| `security/pickup-persons` | Authorised Pickup Persons | Who may collect which student — with photos on file | Super Admin, Security, Administrator, Principal, Front Office |
| `security/vehicle-log` | Vehicle Entry Log | Every vehicle in and out of the gate | Super Admin, Security, Administrator, Principal, Front Office |
| `security/incidents` | Incident Register | Every incident, its severity and what was done about it | Super Admin, Security, Administrator, Principal, Front Office |
| `security/roster` | Security Staff Roster | Who is on which gate, on which shift | Super Admin, Security, Administrator, Principal, Front Office |
| `security/emergency-alerts` | Emergency Alerts | Broadcast to the whole campus in one action | Super Admin, Security, Administrator, Principal, Front Office |
| `security/cctv` | CCTV Monitoring | Live wall, recording health and playback | Super Admin, Security, Administrator, Principal, Front Office |

## Complaints & Tickets

8 screens · module `admissions`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `complaints/raise` | Raise a Complaint | Log a grievance and track it to resolution | 20 roles |
| `complaints/all` | All Complaints | Every ticket across categories, desks and campuses | 18 roles |
| `complaints/mine` | My Complaints | Tickets you have raised and their current state | 20 roles |
| `complaints/assigned` | Assigned to Me | Your queue, ordered by how close each ticket is to breaching | 18 roles |
| `complaints/escalations` | Escalations | Breached and escalated tickets needing leadership attention | Super Admin, Management, Principal, Vice Principal, Administrator |
| `complaints/categories` | Categories | Category owners, SLAs and live load | Super Admin, Administrator |
| `complaints/sla` | SLA Configuration | Response targets, escalation ladder and working hours | Super Admin, Administrator |
| `complaints/reports` | Complaint Reports | Volume, SLA compliance and satisfaction by desk | Super Admin, Management, Principal, Vice Principal, Administrator |

## Events

9 screens · module `engagement`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `events/calendar` | Event Calendar | Every event and holiday on one calendar | 20 roles |
| `events/all` | All Events | Every school event with registrations, budget and gallery | 20 roles |
| `events/create` | Create Event | Plan an event end to end | Super Admin, Management, Principal, Vice Principal, Administrator |
| `events/registrations` | Registrations | Who has signed up for each event | 18 roles |
| `events/attendance` | Event Attendance | Mark and analyse turnout for each event | 18 roles |
| `events/budget` | Budget & Expenses | Event budgets, spend and variance | Super Admin, Management, Principal, Accountant |
| `events/gallery` | Gallery | Photographs from school events | 20 roles |
| `events/holidays` | Holidays | The official holiday list for 2026-27 | 20 roles |
| `events/trips` | Trips & Excursions | Educational trips, consent and logistics | 18 roles |

## Alumni

8 screens · module `students`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `alumni/directory` | Alumni Directory | Every Springdale alumnus on record | Super Admin, Management, Principal, Vice Principal, Administrator, Front Office |
| `alumni/profile` | Alumni Profile | Career, engagement and giving history | Super Admin, Management, Principal, Vice Principal, Administrator |
| `alumni/batches` | Batches | Graduating cohorts and their engagement | Super Admin, Management, Principal, Vice Principal, Administrator |
| `alumni/careers` | Careers | Where Springdale alumni study and work | Super Admin, Management, Principal, Vice Principal, Administrator |
| `alumni/events` | Alumni Events | Homecoming, reunions and networking | Super Admin, Management, Principal, Vice Principal, Administrator |
| `alumni/donations` | Donations | Alumni giving to the scholarship and infrastructure funds | Super Admin, Management, Principal, Accountant |
| `alumni/communication` | Communication | Broadcasts, newsletters and appeals to the alumni network | Super Admin, Management, Principal, Vice Principal, Administrator |
| `alumni/stories` | Success Stories | Alumni journeys worth telling current students | Super Admin, Management, Principal, Vice Principal, Administrator |

## Reports

14 screens · module `finance`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `reports/centre` | Report Centre | Every report in the system, in one searchable catalogue | 18 roles |
| `reports/builder` | Custom Report Builder | Pick a module, choose fields, add filters and preview instantly | Super Admin, Management, Principal, Vice Principal, Administrator |
| `reports/scheduled` | Scheduled Reports | Reports that are generated and emailed automatically | Super Admin, Management, Principal, Vice Principal, Administrator |
| `reports/academic` | Academic Reports | Class and subject performance across the examination cycle | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `reports/attendance` | Attendance Reports | Class-wise attendance, trends and defaulters | Super Admin, Principal, Vice Principal, Administrator, Teacher, Class Teacher |
| `reports/admissions` | Admission Reports | Funnel conversion, source attribution and seat fill | Super Admin, Principal, Vice Principal, Admission Officer, Administrator, Front Office |
| `reports/fees` | Fee Reports | Collection, head-wise mix and outstanding position | Super Admin, Management, Principal, Accountant, Administrator |
| `reports/finance` | Finance Reports | Revenue, expenditure and surplus month by month | Super Admin, Management, Principal, Accountant |
| `reports/hr` | HR & Payroll Reports | Headcount, payroll cost, leave and attrition | Super Admin, Management, Principal, HR Manager, HR Executive, Administrator |
| `reports/transport` | Transport Reports | Route utilisation, running cost and punctuality | Super Admin, Management, Principal, Transport Manager, Administrator |
| `reports/hostel` | Hostel Reports | Occupancy, room condition and mess coverage | Super Admin, Principal, Hostel Warden, Administrator |
| `reports/library` | Library Reports | Circulation, stock and member activity | Super Admin, Principal, Librarian, Administrator |
| `reports/inventory` | Inventory Reports | Stock valuation, reorder alerts and consumption | Super Admin, Administrator, Principal, Accountant |
| `reports/mis` | MIS / Management Reports | The board-level pack: one page across every module | Super Admin, Management, Principal, Vice Principal, Administrator |

## Portals

34 screens · module `portals`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `portals/teacher/classes` | My Classes | Every section you teach, with a one-tap route into attendance, homework and marks | Super Admin, Teacher, Class Teacher, Principal |
| `portals/teacher/timetable` | My Timetable | Your week at a glance, period by period | Super Admin, Teacher, Class Teacher |
| `portals/teacher/attendance` | Take Attendance | One tap per student — a whole class in under a minute | Super Admin, Teacher, Class Teacher |
| `portals/teacher/homework` | My Homework | Assign, track submissions and grade — all in one place | Super Admin, Teacher, Class Teacher |
| `portals/teacher/marks-entry` | Marks Entry | Enter, moderate and publish marks subject by subject | Super Admin, Teacher, Class Teacher |
| `portals/teacher/students` | My Students | Everyone you teach, with the risk flags that matter | Super Admin, Teacher, Class Teacher |
| `portals/teacher/leave` | My Leave | Balance, applications and approvals | Super Admin, Teacher, Class Teacher |
| `portals/parent/children` | My Children | A snapshot of every ward — attendance, results, fees and what is due next | Super Admin, Parent |
| `portals/parent/attendance` | Attendance | Day-by-day attendance, leave and the monthly pattern | Super Admin, Parent |
| `portals/parent/homework` | Homework | What is due, what was submitted and how it was graded | Super Admin, Parent |
| `portals/parent/results` | Results | Exam performance, subject strengths and report cards | Super Admin, Parent |
| `portals/parent/fees` | Fees & Receipts | Pay online in seconds and keep every receipt in one place | Super Admin, Parent |
| `portals/parent/bus-tracking` | Bus Tracking | Where the bus is right now and when it reaches your stop | Super Admin, Parent |
| `portals/parent/ptm` | Parent-Teacher Meetings | Book a slot with your child’s teachers | Super Admin, Parent |
| `portals/parent/messages` | Messages | Circulars, notices and a direct line to the class teacher | Super Admin, Parent |
| `portals/parent/documents` | Documents | Certificates, ID proofs and everything the school holds on file | Super Admin, Parent |
| `portals/parent/complaints` | Complaints | Raise a concern and track it to resolution | Super Admin, Parent |
| `portals/student/timetable` | My Timetable | Today’s classes and the full week | Super Admin, Student |
| `portals/student/attendance` | My Attendance | How many days you have made it in | Super Admin, Student |
| `portals/student/homework` | My Homework | What is due, and when | Super Admin, Student |
| `portals/student/assignments` | My Assignments | Submissions, feedback and online tests | Super Admin, Student |
| `portals/student/study-material` | Study Material | Notes, videos and resources for every subject | Super Admin, Student |
| `portals/student/exams` | My Exams | Datesheet, admit card and what to revise next | Super Admin, Student |
| `portals/student/results` | My Results | Marks, grades and how you are trending | Super Admin, Student |
| `portals/student/fees` | My Fees | What is billed, what is paid and what is due | Super Admin, Student |
| `portals/student/library` | Library | Books you have, what is due and what to read next | Super Admin, Student |
| `portals/student/events` | Events | What is happening, what you have won | Super Admin, Student |
| `portals/employee/profile` | My Profile | Everything HR holds about you | 18 roles |
| `portals/employee/attendance` | My Attendance | Punches, hours worked and your monthly pattern | 18 roles |
| `portals/employee/leave` | My Leave | Balance, applications and the approval trail | 18 roles |
| `portals/employee/payslips` | My Payslips | Every month, downloadable and printable | 18 roles |
| `portals/employee/documents` | My Documents | Your HR file and school-issued letters | 18 roles |
| `portals/employee/appraisal` | My Appraisal | Rating, competencies and goals for the cycle | 18 roles |
| `portals/employee/training` | My Training | Programmes completed, enrolled and open for registration | 18 roles |

## System

22 screens · module `portals`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `system/users` | Users | Every login on the platform, with role, campus and 2FA state | Super Admin, Administrator |
| `system/roles` | Roles | Twenty roles, from super admin to parent | Super Admin, Administrator |
| `system/permissions` | Permission Matrix | Modules × actions, per role — the single source of truth for access | Super Admin |
| `system/module-access` | Module Access | Which modules a role can open at all, and with what data scope | Super Admin |
| `system/campus-access` | Campus Access | Which campuses each user may switch into | Super Admin |
| `system/menu-permissions` | Menu Permissions | Fine-grained control of every navigation item | Super Admin |
| `system/general` | General Settings | Locale, formats and platform-wide defaults | Super Admin, Administrator |
| `system/school-profile` | School Profile | Legal identity, affiliation and contact details | Super Admin, Administrator |
| `system/campuses` | Campuses | Every campus in the group, with capacity and utilisation | Super Admin, Administrator |
| `system/session` | Session Settings | Academic year, working days and attendance mode | Super Admin, Administrator |
| `system/email` | Email Settings | SMTP relay, sender identity and deliverability | Super Admin, Administrator |
| `system/sms` | SMS Settings | Gateway, sender ID and DLT template registration | Super Admin, Administrator |
| `system/whatsapp` | WhatsApp Settings | Business API, template approval and opt-in | Super Admin, Administrator |
| `system/payment-gateway` | Payment Gateway | Online fee collection, settlement and refunds | Super Admin, Administrator |
| `system/biometric` | Biometric Integration | Fingerprint and face devices feeding attendance | Super Admin, Administrator |
| `system/rfid` | RFID Integration | Cards, readers and gate/bus tap points | Super Admin, Administrator |
| `system/integrations` | Integrations & API | Connected services, webhooks and API keys | Super Admin |
| `system/backup` | Backup & Restore | Snapshots, retention and point-in-time restore | Super Admin |
| `system/audit-logs` | Audit Logs | Who changed what, when and from where | Super Admin, Administrator |
| `system/login-history` | Login History | Every sign-in attempt with device, IP and outcome | Super Admin, Administrator |
| `system/security` | Security Settings | Password policy, MFA, sessions and IP controls | Super Admin |
| `system/data-import-export` | Data Import / Export | Bulk load records and take data out again | Super Admin, Administrator |

## Not in the sidebar

1 screens · module `portals`

| Route | Screen | Purpose | Visible to |
|---|---|---|---|
| `portals/mobile-app` | Mobile App Showcase | The same ERP, reimagined for a 6-inch screen | All roles (20) |
