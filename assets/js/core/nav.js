/* ==========================================================================
   nav.js — THE information architecture
   NAV is an array of SECTIONS:
     { id, label, icon, roles:[...], items:[ { id, label, icon, route, roles,
                                               badge?, children?:[...] } ] }
   Route strings never carry the '#/' prefix — the router adds it.
   Section ids are fixed: module teams are assigned work by section id.
   ========================================================================== */

import { ROLE_IDS } from './state.js';

/* -------------------------------------------------------- role bundles */
const ALL = ROLE_IDS.slice();
const STAFF = ALL.filter((r) => !['student', 'parent'].includes(r));

const SUPER = ['super-admin'];
const ADMIN = ['super-admin', 'administrator'];
const LEADER = ['super-admin', 'management', 'principal', 'vice-principal', 'administrator'];
const ACAD = ['super-admin', 'principal', 'vice-principal', 'administrator', 'teacher', 'class-teacher'];
const ACAD_LEAD = ['super-admin', 'principal', 'vice-principal', 'administrator'];
const FEE = ['super-admin', 'management', 'principal', 'accountant', 'administrator'];
const FIN = ['super-admin', 'management', 'principal', 'accountant'];
const HR = ['super-admin', 'management', 'principal', 'hr-manager', 'hr-executive', 'administrator'];
const ADM = ['super-admin', 'principal', 'vice-principal', 'admission-officer', 'administrator', 'front-office'];
const LIB = ['super-admin', 'principal', 'librarian', 'administrator'];
const TRN = ['super-admin', 'management', 'principal', 'transport-manager', 'administrator'];
const HOS = ['super-admin', 'principal', 'hostel-warden', 'administrator'];
const INV = ['super-admin', 'administrator', 'principal', 'accountant'];
const LMS = ['super-admin', 'principal', 'vice-principal', 'teacher', 'class-teacher', 'administrator'];
const HEALTH = ['super-admin', 'principal', 'nurse', 'administrator'];
const SEC = ['super-admin', 'security', 'administrator', 'principal', 'front-office'];
const FO = ['super-admin', 'front-office', 'administrator', 'principal'];
const COMM = ['super-admin', 'principal', 'vice-principal', 'administrator', 'front-office', 'class-teacher', 'teacher'];

/* ================================================================= NAV = */

export const NAV = [
  /* ------------------------------------------------------------ dashboard */
  {
    id: 'dashboard', label: 'Dashboards', icon: 'dashboard', roles: ALL,
    items: [
      { id: 'dash-overview', label: 'KPI / MIS Overview', icon: 'chart-line', route: 'dashboard/overview', roles: LEADER },
      { id: 'dash-super', label: 'Super Admin', icon: 'shield-check', route: 'dashboard/super-admin', roles: ADMIN },
      { id: 'dash-mgmt', label: 'Management', icon: 'building-columns', route: 'dashboard/management', roles: ['super-admin', 'management'] },
      { id: 'dash-principal', label: 'Principal', icon: 'graduation-cap', route: 'dashboard/principal', roles: ['super-admin', 'principal', 'vice-principal'] },
      { id: 'dash-teacher', label: 'Teacher', icon: 'presentation', route: 'dashboard/teacher', roles: ['super-admin', 'teacher', 'class-teacher', 'principal'] },
      { id: 'dash-accountant', label: 'Accounts', icon: 'wallet', route: 'dashboard/accountant', roles: ['super-admin', 'accountant', 'principal', 'management'] },
      { id: 'dash-hr', label: 'Human Resources', icon: 'briefcase', route: 'dashboard/hr', roles: ['super-admin', 'hr-manager', 'hr-executive', 'principal'] },
      { id: 'dash-librarian', label: 'Library', icon: 'library', route: 'dashboard/librarian', roles: ['super-admin', 'librarian', 'principal'] },
      { id: 'dash-transport', label: 'Transport', icon: 'bus', route: 'dashboard/transport', roles: ['super-admin', 'transport-manager', 'principal', 'management'] },
      { id: 'dash-hostel', label: 'Hostel', icon: 'bed', route: 'dashboard/hostel', roles: ['super-admin', 'hostel-warden', 'principal'] },
      { id: 'dash-nurse', label: 'Infirmary', icon: 'stethoscope', route: 'dashboard/nurse', roles: ['super-admin', 'nurse', 'principal'] },
      { id: 'dash-fo', label: 'Front Office', icon: 'phone', route: 'dashboard/front-office', roles: ['super-admin', 'front-office', 'administrator'] },
      { id: 'dash-student', label: 'My Dashboard', icon: 'user', route: 'dashboard/student', roles: ['super-admin', 'student'] },
      { id: 'dash-parent', label: 'Parent Dashboard', icon: 'users', route: 'dashboard/parent', roles: ['super-admin', 'parent'] },
    ],
  },

  /* ----------------------------------------------------------- admissions */
  {
    id: 'admissions', label: 'Admissions', icon: 'user-plus', roles: ADM,
    items: [
      { id: 'adm-dash', label: 'Admission Dashboard', icon: 'dashboard', route: 'admissions/dashboard', roles: ADM },
      { id: 'adm-enq', label: 'Enquiries', icon: 'message-square', route: 'admissions/enquiries', roles: ADM, badge: 42 },
      { id: 'adm-leads', label: 'Lead Pipeline', icon: 'workflow', route: 'admissions/leads', roles: ADM },
      { id: 'adm-follow', label: 'Follow-ups', icon: 'phone-call', route: 'admissions/follow-ups', roles: ADM, badge: 18 },
      { id: 'adm-couns', label: 'Counselling', icon: 'handshake', route: 'admissions/counselling', roles: ADM },
      { id: 'adm-online', label: 'Online Applications', icon: 'globe', route: 'admissions/online-applications', roles: ADM },
      { id: 'adm-review', label: 'Application Review', icon: 'clipboard-check', route: 'admissions/application-review', roles: ADM },
      { id: 'adm-docs', label: 'Document Verification', icon: 'file-text', route: 'admissions/document-verification', roles: ADM },
      { id: 'adm-test', label: 'Entrance Test', icon: 'edit', route: 'admissions/entrance-test', roles: ADM },
      { id: 'adm-int', label: 'Interview', icon: 'users', route: 'admissions/interview', roles: ADM },
      { id: 'adm-merit', label: 'Merit List', icon: 'sort-desc', route: 'admissions/merit-list', roles: ADM },
      { id: 'adm-sel', label: 'Selected Candidates', icon: 'user-check', route: 'admissions/selected-candidates', roles: ADM },
      { id: 'adm-fee', label: 'Admission Fee', icon: 'wallet', route: 'admissions/admission-fee', roles: ADM },
      { id: 'adm-conf', label: 'Confirmation', icon: 'check-circle', route: 'admissions/confirmation', roles: ADM },
      { id: 'adm-reg', label: 'Registration', icon: 'clipboard', route: 'admissions/registration', roles: ADM },
      { id: 'adm-wait', label: 'Waiting List', icon: 'clock', route: 'admissions/waiting-list', roles: ADM },
      { id: 'adm-cancel', label: 'Cancellations', icon: 'x-circle', route: 'admissions/cancellation', roles: ADM },
      { id: 'adm-rep', label: 'Admission Reports', icon: 'chart-bar', route: 'admissions/reports', roles: ADM },
      { id: 'adm-set', label: 'Admission Settings', icon: 'settings', route: 'admissions/settings', roles: ['super-admin', 'administrator', 'principal'] },
    ],
  },

  /* ------------------------------------------------------------- students */
  {
    id: 'students', label: 'Students', icon: 'graduation-cap', roles: STAFF,
    items: [
      { id: 'stu-all', label: 'All Students', icon: 'users', route: 'students/all', roles: STAFF },
      { id: 'stu-profile', label: 'Student 360 Profile', icon: 'id-card', route: 'students/profile', roles: STAFF },
      { id: 'stu-add', label: 'Add Student', icon: 'user-plus', route: 'students/add', roles: ADM },
      { id: 'stu-promote', label: 'Promote Students', icon: 'trending-up', route: 'students/promote', roles: ACAD_LEAD },
      { id: 'stu-tc', label: 'Transfer / TC', icon: 'log-out', route: 'students/transfer', roles: ACAD_LEAD },
      { id: 'stu-id', label: 'ID Cards', icon: 'id-card', route: 'students/id-cards', roles: ADMIN.concat(['front-office']) },
      { id: 'stu-cert', label: 'Certificates', icon: 'certificate', route: 'students/certificates', roles: ACAD_LEAD.concat(['front-office']) },
      { id: 'stu-sib', label: 'Siblings', icon: 'users', route: 'students/siblings', roles: STAFF },
      { id: 'stu-cat', label: 'Categories & Houses', icon: 'flag', route: 'students/categories', roles: ACAD_LEAD },
      { id: 'stu-docs', label: 'Documents', icon: 'folder', route: 'students/documents', roles: STAFF },
      { id: 'stu-beh', label: 'Behaviour Records', icon: 'alert-circle', route: 'students/behaviour', roles: ACAD },
      { id: 'stu-awards', label: 'Awards & Achievements', icon: 'award', route: 'students/awards', roles: ACAD },
      { id: 'stu-import', label: 'Bulk Import', icon: 'upload', route: 'students/bulk-import', roles: ADMIN },
      { id: 'stu-rep', label: 'Student Reports', icon: 'chart-bar', route: 'students/reports', roles: STAFF },
    ],
  },

  /* -------------------------------------------------------------- parents */
  {
    id: 'parents', label: 'Parents', icon: 'users', roles: STAFF,
    items: [
      { id: 'par-dir', label: 'Parent Directory', icon: 'users', route: 'parents/directory', roles: STAFF },
      { id: 'par-profile', label: 'Parent Profile', icon: 'user', route: 'parents/profile', roles: STAFF },
      { id: 'par-link', label: 'Link Children', icon: 'link', route: 'parents/link-children', roles: ADM },
      { id: 'par-login', label: 'Parent Logins', icon: 'key', route: 'parents/logins', roles: ADMIN },
      { id: 'par-feed', label: 'Feedback', icon: 'message-circle', route: 'parents/feedback', roles: LEADER },
      { id: 'par-rep', label: 'Parent Reports', icon: 'chart-bar', route: 'parents/reports', roles: LEADER },
    ],
  },

  /* ------------------------------------------------------------- teachers */
  {
    id: 'teachers', label: 'Teachers', icon: 'presentation', roles: ACAD.concat(['hr-manager', 'hr-executive']),
    items: [
      { id: 'tch-dir', label: 'Teacher Directory', icon: 'users', route: 'teachers/directory', roles: STAFF },
      { id: 'tch-profile', label: 'Teacher Profile', icon: 'id-card', route: 'teachers/profile', roles: STAFF },
      { id: 'tch-class', label: 'Class Allocation', icon: 'grid', route: 'teachers/class-allocation', roles: ACAD_LEAD },
      { id: 'tch-sub', label: 'Subject Allocation', icon: 'book-open', route: 'teachers/subject-allocation', roles: ACAD_LEAD },
      { id: 'tch-tt', label: 'Teacher Timetable', icon: 'calendar', route: 'teachers/timetable', roles: ACAD },
      { id: 'tch-subst', label: 'Substitution', icon: 'refresh-ccw', route: 'teachers/substitution', roles: ACAD_LEAD },
      { id: 'tch-lesson', label: 'Lesson Plans', icon: 'clipboard-list', route: 'teachers/lesson-plans', roles: ACAD },
      { id: 'tch-appr', label: 'Appraisal', icon: 'star', route: 'teachers/appraisal', roles: ['super-admin', 'principal', 'hr-manager'] },
      { id: 'tch-load', label: 'Workload Analysis', icon: 'gauge', route: 'teachers/workload', roles: ACAD_LEAD },
      { id: 'tch-rep', label: 'Teacher Reports', icon: 'chart-bar', route: 'teachers/reports', roles: ACAD_LEAD },
    ],
  },

  /* ------------------------------------------------------------------- hr */
  {
    id: 'hr', label: 'Human Resources', icon: 'briefcase', roles: HR,
    items: [
      { id: 'hr-dir', label: 'Employee Directory', icon: 'users', route: 'hr/employees', roles: HR },
      { id: 'hr-profile', label: 'Employee Profile', icon: 'id-card', route: 'hr/employee-profile', roles: HR },
      { id: 'hr-dept', label: 'Departments', icon: 'building', route: 'hr/departments', roles: HR },
      { id: 'hr-desig', label: 'Designations', icon: 'layers', route: 'hr/designations', roles: HR },
      {
        id: 'hr-hiring', label: 'Recruitment', icon: 'user-plus', route: 'hr/recruitment', roles: HR,
        children: [
          { id: 'hr-req', label: 'Open Positions', icon: 'clipboard-list', route: 'hr/recruitment', roles: HR },
          { id: 'hr-apps', label: 'Applicants', icon: 'users', route: 'hr/applicants', roles: HR },
          { id: 'hr-int', label: 'Interviews', icon: 'calendar-check', route: 'hr/interviews', roles: HR },
          { id: 'hr-join', label: 'Onboarding / Joining', icon: 'log-in', route: 'hr/onboarding', roles: HR },
        ],
      },
      { id: 'hr-docs', label: 'Employee Documents', icon: 'folder', route: 'hr/documents', roles: HR },
      { id: 'hr-att', label: 'Staff Attendance', icon: 'clipboard-check', route: 'hr/attendance', roles: HR },
      {
        id: 'hr-leave', label: 'Leave Management', icon: 'calendar', route: 'hr/leave-requests', roles: HR,
        children: [
          { id: 'hr-lt', label: 'Leave Types', icon: 'sliders', route: 'hr/leave-types', roles: HR },
          { id: 'hr-lr', label: 'Leave Requests', icon: 'inbox', route: 'hr/leave-requests', roles: HR, badge: { text: '12', tone: 'warning' } },
          { id: 'hr-lb', label: 'Leave Balance', icon: 'scale', route: 'hr/leave-balance', roles: HR },
          { id: 'hr-hol', label: 'Holidays', icon: 'umbrella', route: 'hr/holidays', roles: HR },
        ],
      },
      {
        id: 'hr-pay', label: 'Payroll', icon: 'banknote', route: 'hr/payroll-runs', roles: ['super-admin', 'hr-manager', 'accountant', 'management'],
        children: [
          { id: 'hr-runs', label: 'Payroll Runs', icon: 'refresh', route: 'hr/payroll-runs', roles: ['super-admin', 'hr-manager', 'accountant'] },
          { id: 'hr-sal', label: 'Salary Structure', icon: 'layers', route: 'hr/salary-structure', roles: ['super-admin', 'hr-manager', 'accountant'] },
          { id: 'hr-slips', label: 'Payslips', icon: 'receipt', route: 'hr/payslips', roles: ['super-admin', 'hr-manager', 'accountant'] },
          { id: 'hr-loans', label: 'Loans & Advances', icon: 'piggy-bank', route: 'hr/loans', roles: ['super-admin', 'hr-manager', 'accountant'] },
        ],
      },
      { id: 'hr-appr', label: 'Appraisal', icon: 'star', route: 'hr/appraisal', roles: HR },
      { id: 'hr-train', label: 'Training', icon: 'lightbulb', route: 'hr/training', roles: HR },
      { id: 'hr-promo', label: 'Promotions & Transfers', icon: 'trending-up', route: 'hr/promotions', roles: HR },
      { id: 'hr-resign', label: 'Resignations', icon: 'log-out', route: 'hr/resignations', roles: HR },
      { id: 'hr-clear', label: 'Exit Clearance', icon: 'check-circle', route: 'hr/exit-clearance', roles: HR },
      { id: 'hr-fnf', label: 'Full & Final Settlement', icon: 'calculator', route: 'hr/full-and-final', roles: ['super-admin', 'hr-manager', 'accountant'] },
      { id: 'hr-rep', label: 'HR Reports', icon: 'chart-bar', route: 'hr/reports', roles: HR },
    ],
  },

  /* ------------------------------------------------------------ academics */
  {
    id: 'academics', label: 'Academics', icon: 'book-open', roles: ACAD,
    items: [
      { id: 'ac-years', label: 'Academic Years', icon: 'calendar', route: 'academics/years', roles: ACAD_LEAD },
      { id: 'ac-boards', label: 'Boards', icon: 'building-columns', route: 'academics/boards', roles: ACAD_LEAD },
      { id: 'ac-classes', label: 'Classes', icon: 'grid', route: 'academics/classes', roles: ACAD_LEAD },
      { id: 'ac-sections', label: 'Sections', icon: 'columns', route: 'academics/sections', roles: ACAD_LEAD },
      { id: 'ac-subjects', label: 'Subjects', icon: 'book', route: 'academics/subjects', roles: ACAD },
      { id: 'ac-groups', label: 'Subject Groups', icon: 'layers', route: 'academics/subject-groups', roles: ACAD_LEAD },
      { id: 'ac-curr', label: 'Curriculum', icon: 'scroll', route: 'academics/curriculum', roles: ACAD },
      { id: 'ac-syl', label: 'Syllabus Tracker', icon: 'clipboard-list', route: 'academics/syllabus-tracker', roles: ACAD },
      { id: 'ac-lo', label: 'Learning Outcomes', icon: 'target', route: 'academics/learning-outcomes', roles: ACAD },
      { id: 'ac-cal', label: 'Academic Calendar', icon: 'calendar-check', route: 'academics/calendar', roles: ACAD },
      { id: 'ac-plan', label: 'Annual Planner', icon: 'map', route: 'academics/annual-planner', roles: ACAD_LEAD },
      { id: 'ac-map', label: 'Class-Subject-Teacher Map', icon: 'workflow', route: 'academics/class-subject-teacher', roles: ACAD_LEAD },
      { id: 'ac-grade', label: 'Grading Systems', icon: 'percent', route: 'academics/grading-systems', roles: ACAD_LEAD },
    ],
  },

  /* ------------------------------------------------------------ timetable */
  {
    id: 'timetable', label: 'Timetable', icon: 'calendar', roles: ACAD,
    items: [
      { id: 'tt-master', label: 'Master Timetable', icon: 'table', route: 'timetable/master', roles: ACAD_LEAD },
      { id: 'tt-build', label: 'Timetable Builder', icon: 'tool', route: 'timetable/builder', roles: ACAD_LEAD },
      { id: 'tt-class', label: 'Class Timetable', icon: 'grid', route: 'timetable/class', roles: ACAD },
      { id: 'tt-teacher', label: 'Teacher Timetable', icon: 'presentation', route: 'timetable/teacher', roles: ACAD },
      { id: 'tt-room', label: 'Room Timetable', icon: 'door', route: 'timetable/room', roles: ACAD_LEAD },
      { id: 'tt-period', label: 'Period Settings', icon: 'clock', route: 'timetable/periods', roles: ACAD_LEAD },
      { id: 'tt-subst', label: 'Substitution', icon: 'refresh-ccw', route: 'timetable/substitution', roles: ACAD_LEAD, badge: 6 },
      { id: 'tt-rooms', label: 'Room Allocation', icon: 'building', route: 'timetable/room-allocation', roles: ACAD_LEAD },
      { id: 'tt-conf', label: 'Conflict Report', icon: 'alert-triangle', route: 'timetable/conflicts', roles: ACAD_LEAD },
      { id: 'tt-pub', label: 'Publish Timetable', icon: 'send', route: 'timetable/publish', roles: ACAD_LEAD },
    ],
  },

  /* ----------------------------------------------------------- attendance */
  {
    id: 'attendance', label: 'Attendance', icon: 'clipboard-check', roles: ACAD,
    items: [
      { id: 'at-mark', label: 'Mark Daily Attendance', icon: 'check-circle', route: 'attendance/mark-daily', roles: ACAD },
      { id: 'at-period', label: 'Period Attendance', icon: 'clock', route: 'attendance/period', roles: ACAD },
      { id: 'at-class', label: 'Class-wise Attendance', icon: 'grid', route: 'attendance/class-wise', roles: ACAD },
      { id: 'at-reg', label: 'Monthly Register', icon: 'table', route: 'attendance/monthly-register', roles: ACAD },
      { id: 'at-corr', label: 'Corrections', icon: 'edit', route: 'attendance/corrections', roles: ACAD_LEAD },
      { id: 'at-leave', label: 'Student Leave Requests', icon: 'inbox', route: 'attendance/leave-requests', roles: ACAD, badge: { text: '9', tone: 'warning' } },
      { id: 'at-late', label: 'Late / Early Records', icon: 'timer', route: 'attendance/late-early', roles: ACAD },
      { id: 'at-dev', label: 'Biometric / RFID Devices', icon: 'fingerprint', route: 'attendance/devices', roles: ADMIN },
      { id: 'at-def', label: 'Defaulters (<75%)', icon: 'alert-triangle', route: 'attendance/defaulters', roles: ACAD, badge: { text: '64', tone: 'danger' } },
      { id: 'at-rep', label: 'Attendance Reports', icon: 'chart-bar', route: 'attendance/reports', roles: ACAD },
    ],
  },

  /* ---------------------------------------------------------- examination */
  {
    id: 'examination', label: 'Examination', icon: 'file-text', roles: ACAD,
    items: [
      { id: 'ex-setup', label: 'Exam Setup', icon: 'settings', route: 'examination/setup', roles: ACAD_LEAD },
      { id: 'ex-groups', label: 'Exam Groups', icon: 'layers', route: 'examination/groups', roles: ACAD_LEAD },
      { id: 'ex-sched', label: 'Exam Schedule', icon: 'calendar', route: 'examination/schedule', roles: ACAD },
      { id: 'ex-seat', label: 'Seating & Hall Tickets', icon: 'grid', route: 'examination/seating', roles: ACAD_LEAD },
      { id: 'ex-inv', label: 'Invigilator Allocation', icon: 'user-check', route: 'examination/invigilators', roles: ACAD_LEAD },
      { id: 'ex-marks', label: 'Marks Entry', icon: 'edit', route: 'examination/marks-entry', roles: ACAD },
      { id: 'ex-grade', label: 'Grade Configuration', icon: 'percent', route: 'examination/grade-config', roles: ACAD_LEAD },
      { id: 'ex-weight', label: 'Weightage', icon: 'scale', route: 'examination/weightage', roles: ACAD_LEAD },
      { id: 'ex-qb', label: 'Question Bank', icon: 'database', route: 'examination/question-bank', roles: ACAD },
      { id: 'ex-online', label: 'Online Exams', icon: 'monitor', route: 'examination/online-exams', roles: ACAD },
      { id: 'ex-omr', label: 'OMR Processing', icon: 'scan', route: 'examination/omr', roles: ACAD_LEAD },
      { id: 'ex-result', label: 'Result Processing', icon: 'refresh', route: 'examination/result-processing', roles: ACAD_LEAD },
      { id: 'ex-card', label: 'Report Cards', icon: 'certificate', route: 'examination/report-cards', roles: ACAD },
      { id: 'ex-design', label: 'Report Card Designer', icon: 'palette', route: 'examination/report-card-designer', roles: ACAD_LEAD },
      { id: 'ex-rank', label: 'Rank / Merit List', icon: 'trophy', route: 'examination/merit-list', roles: ACAD },
      { id: 'ex-perf', label: 'Performance Analysis', icon: 'chart-line', route: 'examination/performance', roles: ACAD },
      { id: 'ex-reeval', label: 'Re-evaluation', icon: 'refresh-ccw', route: 'examination/re-evaluation', roles: ACAD_LEAD },
    ],
  },

  /* ----------------------------------------------------------------- fees */
  {
    id: 'fees', label: 'Fees', icon: 'wallet', roles: FEE,
    items: [
      { id: 'fee-heads', label: 'Fee Heads', icon: 'layers', route: 'fees/heads', roles: FEE },
      { id: 'fee-struct', label: 'Fee Structures', icon: 'grid', route: 'fees/structures', roles: FEE },
      { id: 'fee-class', label: 'Class-wise Fees', icon: 'table', route: 'fees/class-wise', roles: FEE },
      { id: 'fee-assign', label: 'Student Fee Assignment', icon: 'user-check', route: 'fees/assignment', roles: FEE },
      { id: 'fee-inst', label: 'Installment Plans', icon: 'calendar', route: 'fees/installments', roles: FEE },
      { id: 'fee-collect', label: 'Collect Fee', icon: 'credit-card', route: 'fees/collection', roles: FEE },
      { id: 'fee-rcpt', label: 'Receipts', icon: 'receipt', route: 'fees/receipts', roles: FEE },
      { id: 'fee-due', label: 'Due / Outstanding', icon: 'alert-circle', route: 'fees/outstanding', roles: FEE, badge: { text: '925', tone: 'danger' } },
      { id: 'fee-disc', label: 'Discounts', icon: 'percent', route: 'fees/discounts', roles: FEE },
      { id: 'fee-schol', label: 'Scholarships', icon: 'award', route: 'fees/scholarships', roles: FEE },
      { id: 'fee-conc', label: 'Concessions', icon: 'gift', route: 'fees/concessions', roles: FEE },
      { id: 'fee-late', label: 'Late Fees', icon: 'timer', route: 'fees/late-fees', roles: FEE },
      { id: 'fee-refund', label: 'Refunds', icon: 'refresh-ccw', route: 'fees/refunds', roles: FEE },
      { id: 'fee-cancel', label: 'Cancelled Receipts', icon: 'x-circle', route: 'fees/cancelled-receipts', roles: FEE },
      { id: 'fee-remind', label: 'Reminders', icon: 'bell', route: 'fees/reminders', roles: FEE },
      { id: 'fee-online', label: 'Online Payments', icon: 'globe', route: 'fees/online-payments', roles: FEE },
      { id: 'fee-def', label: 'Defaulter List', icon: 'user-x', route: 'fees/defaulters', roles: FEE },
      { id: 'fee-rep', label: 'Fee Reports', icon: 'chart-bar', route: 'fees/reports', roles: FEE },
    ],
  },

  /* -------------------------------------------------------------- finance */
  {
    id: 'finance', label: 'Finance', icon: 'banknote', roles: FIN,
    items: [
      { id: 'fin-coa', label: 'Chart of Accounts', icon: 'layers', route: 'finance/chart-of-accounts', roles: FIN },
      { id: 'fin-inc', label: 'Income', icon: 'trending-up', route: 'finance/income', roles: FIN },
      { id: 'fin-exp', label: 'Expenses', icon: 'trending-down', route: 'finance/expenses', roles: FIN },
      { id: 'fin-vou', label: 'Vouchers', icon: 'receipt', route: 'finance/vouchers', roles: FIN },
      { id: 'fin-led', label: 'Ledger', icon: 'notebook', route: 'finance/ledger', roles: FIN },
      { id: 'fin-bank', label: 'Bank Accounts', icon: 'building-columns', route: 'finance/bank-accounts', roles: FIN },
      { id: 'fin-cash', label: 'Cash Book', icon: 'wallet', route: 'finance/cash-book', roles: FIN },
      { id: 'fin-day', label: 'Day Book', icon: 'book', route: 'finance/day-book', roles: FIN },
      { id: 'fin-vend', label: 'Vendors', icon: 'truck', route: 'finance/vendors', roles: FIN },
      { id: 'fin-po', label: 'Purchase Orders', icon: 'shopping-cart', route: 'finance/purchase-orders', roles: FIN },
      { id: 'fin-bud', label: 'Budgets', icon: 'target', route: 'finance/budgets', roles: FIN },
      { id: 'fin-dep', label: 'Asset Depreciation', icon: 'trending-down', route: 'finance/depreciation', roles: FIN },
      { id: 'fin-tb', label: 'Trial Balance', icon: 'scale', route: 'finance/trial-balance', roles: FIN },
      { id: 'fin-pl', label: 'Profit & Loss', icon: 'chart-line', route: 'finance/profit-loss', roles: FIN },
      { id: 'fin-rep', label: 'Financial Reports', icon: 'chart-bar', route: 'finance/reports', roles: FIN },
    ],
  },

  /* -------------------------------------------------------------- library */
  {
    id: 'library', label: 'Library', icon: 'library', roles: LIB.concat(['teacher', 'class-teacher', 'student']),
    items: [
      { id: 'lb-dash', label: 'Library Dashboard', icon: 'dashboard', route: 'library/dashboard', roles: LIB },
      { id: 'lb-cat', label: 'Book Catalog', icon: 'book', route: 'library/catalog', roles: LIB.concat(['teacher', 'student']) },
      { id: 'lb-add', label: 'Add Book', icon: 'plus', route: 'library/add-book', roles: LIB },
      { id: 'lb-cats', label: 'Categories', icon: 'tag', route: 'library/categories', roles: LIB },
      { id: 'lb-auth', label: 'Authors', icon: 'user', route: 'library/authors', roles: LIB },
      { id: 'lb-pub', label: 'Publishers', icon: 'building', route: 'library/publishers', roles: LIB },
      { id: 'lb-copies', label: 'Copies & Barcodes', icon: 'qr', route: 'library/copies', roles: LIB },
      { id: 'lb-issue', label: 'Issue Book', icon: 'arrow-up-right', route: 'library/issue', roles: LIB },
      { id: 'lb-return', label: 'Return Book', icon: 'arrow-down-right', route: 'library/return', roles: LIB },
      { id: 'lb-renew', label: 'Renew', icon: 'refresh', route: 'library/renew', roles: LIB },
      { id: 'lb-res', label: 'Reservations', icon: 'bookmark', route: 'library/reservations', roles: LIB },
      { id: 'lb-fine', label: 'Fines', icon: 'rupee', route: 'library/fines', roles: LIB, badge: { text: '42', tone: 'warning' } },
      { id: 'lb-lost', label: 'Lost / Damaged', icon: 'alert-triangle', route: 'library/lost-damaged', roles: LIB },
      { id: 'lb-mem', label: 'Members', icon: 'users', route: 'library/members', roles: LIB },
      { id: 'lb-dig', label: 'Digital Library', icon: 'monitor', route: 'library/digital', roles: LIB.concat(['teacher', 'student']) },
      { id: 'lb-rep', label: 'Library Reports', icon: 'chart-bar', route: 'library/reports', roles: LIB },
    ],
  },

  /* ------------------------------------------------------------ transport */
  {
    id: 'transport', label: 'Transport', icon: 'bus', roles: TRN,
    items: [
      { id: 'tr-dash', label: 'Transport Dashboard', icon: 'dashboard', route: 'transport/dashboard', roles: TRN },
      { id: 'tr-veh', label: 'Vehicles', icon: 'bus', route: 'transport/vehicles', roles: TRN },
      { id: 'tr-drv', label: 'Drivers & Conductors', icon: 'users', route: 'transport/drivers', roles: TRN },
      { id: 'tr-routes', label: 'Routes', icon: 'route', route: 'transport/routes', roles: TRN },
      { id: 'tr-stops', label: 'Stops', icon: 'map-pin', route: 'transport/stops', roles: TRN },
      { id: 'tr-track', label: 'Route Map / Live Tracking', icon: 'navigation', route: 'transport/tracking', roles: TRN },
      { id: 'tr-alloc', label: 'Student Route Allocation', icon: 'user-check', route: 'transport/allocation', roles: TRN },
      { id: 'tr-att', label: 'Bus Attendance', icon: 'clipboard-check', route: 'transport/bus-attendance', roles: TRN },
      { id: 'tr-fuel', label: 'Fuel Log', icon: 'fuel', route: 'transport/fuel-log', roles: TRN },
      { id: 'tr-maint', label: 'Maintenance', icon: 'wrench', route: 'transport/maintenance', roles: TRN },
      { id: 'tr-ins', label: 'Insurance & Documents', icon: 'shield', route: 'transport/documents', roles: TRN, badge: { text: '3', tone: 'warning' } },
      { id: 'tr-trip', label: 'Trip Log', icon: 'history', route: 'transport/trip-log', roles: TRN },
      { id: 'tr-fee', label: 'Transport Fees', icon: 'wallet', route: 'transport/fees', roles: TRN.concat(['accountant']) },
      { id: 'tr-inc', label: 'Incidents', icon: 'alert-triangle', route: 'transport/incidents', roles: TRN },
      { id: 'tr-rep', label: 'Transport Reports', icon: 'chart-bar', route: 'transport/reports', roles: TRN },
      { id: 'tr-set', label: 'Transport Settings', icon: 'settings', route: 'transport/settings', roles: ['super-admin', 'transport-manager', 'administrator'] },
    ],
  },

  /* --------------------------------------------------------------- hostel */
  {
    id: 'hostel', label: 'Hostel', icon: 'bed', roles: HOS,
    items: [
      { id: 'hs-dash', label: 'Hostel Dashboard', icon: 'dashboard', route: 'hostel/dashboard', roles: HOS },
      { id: 'hs-blocks', label: 'Hostels / Buildings', icon: 'building-2', route: 'hostel/buildings', roles: HOS },
      { id: 'hs-rooms', label: 'Rooms', icon: 'door', route: 'hostel/rooms', roles: HOS },
      { id: 'hs-beds', label: 'Beds', icon: 'bed', route: 'hostel/beds', roles: HOS },
      { id: 'hs-alloc', label: 'Room Allocation', icon: 'user-check', route: 'hostel/allocation', roles: HOS },
      { id: 'hs-att', label: 'Hostel Attendance', icon: 'clipboard-check', route: 'hostel/attendance', roles: HOS },
      { id: 'hs-warden', label: 'Wardens', icon: 'shield', route: 'hostel/wardens', roles: HOS },
      { id: 'hs-menu', label: 'Mess Menu', icon: 'utensils', route: 'hostel/mess-menu', roles: HOS },
      { id: 'hs-mess', label: 'Mess Attendance', icon: 'coffee', route: 'hostel/mess-attendance', roles: HOS },
      { id: 'hs-vis', label: 'Visitors', icon: 'users', route: 'hostel/visitors', roles: HOS },
      { id: 'hs-gate', label: 'Gate Pass', icon: 'log-out', route: 'hostel/gate-pass', roles: HOS },
      { id: 'hs-fee', label: 'Hostel Fees', icon: 'wallet', route: 'hostel/fees', roles: HOS.concat(['accountant']) },
      { id: 'hs-comp', label: 'Complaints', icon: 'alert-circle', route: 'hostel/complaints', roles: HOS },
      { id: 'hs-maint', label: 'Maintenance', icon: 'wrench', route: 'hostel/maintenance', roles: HOS },
      { id: 'hs-tran', label: 'Room Transfer', icon: 'refresh-ccw', route: 'hostel/room-transfer', roles: HOS },
      { id: 'hs-rep', label: 'Hostel Reports', icon: 'chart-bar', route: 'hostel/reports', roles: HOS },
    ],
  },

  /* ------------------------------------------------------------ inventory */
  {
    id: 'inventory', label: 'Inventory & Assets', icon: 'box', roles: INV,
    items: [
      { id: 'iv-cats', label: 'Item Categories', icon: 'tag', route: 'inventory/categories', roles: INV },
      { id: 'iv-items', label: 'Items', icon: 'package', route: 'inventory/items', roles: INV },
      { id: 'iv-stock', label: 'Stock', icon: 'layers', route: 'inventory/stock', roles: INV },
      { id: 'iv-in', label: 'Stock In', icon: 'arrow-down-right', route: 'inventory/stock-in', roles: INV },
      { id: 'iv-out', label: 'Stock Out / Issue', icon: 'arrow-up-right', route: 'inventory/stock-out', roles: INV },
      { id: 'iv-req', label: 'Purchase Requests', icon: 'clipboard-list', route: 'inventory/purchase-requests', roles: INV, badge: 7 },
      { id: 'iv-po', label: 'Purchase Orders', icon: 'shopping-cart', route: 'inventory/purchase-orders', roles: INV },
      { id: 'iv-grn', label: 'Goods Receipt (GRN)', icon: 'check-circle', route: 'inventory/grn', roles: INV },
      { id: 'iv-vend', label: 'Vendors', icon: 'truck', route: 'inventory/vendors', roles: INV },
      { id: 'iv-ret', label: 'Returns', icon: 'refresh-ccw', route: 'inventory/returns', roles: INV },
      { id: 'iv-dmg', label: 'Damaged Stock', icon: 'alert-triangle', route: 'inventory/damaged', roles: INV },
      { id: 'iv-audit', label: 'Stock Audit', icon: 'scan', route: 'inventory/audit', roles: INV },
      { id: 'iv-assets', label: 'Asset Register', icon: 'archive', route: 'inventory/assets', roles: INV },
      { id: 'iv-assign', label: 'Asset Assignment', icon: 'user-check', route: 'inventory/asset-assignment', roles: INV },
      { id: 'iv-amaint', label: 'Asset Maintenance', icon: 'wrench', route: 'inventory/asset-maintenance', roles: INV },
      { id: 'iv-rep', label: 'Inventory Reports', icon: 'chart-bar', route: 'inventory/reports', roles: INV },
    ],
  },

  /* ------------------------------------------------------------------ lms */
  {
    id: 'lms', label: 'Learning (LMS)', icon: 'monitor', roles: LMS.concat(['student']),
    items: [
      { id: 'lm-courses', label: 'Courses', icon: 'book-open', route: 'lms/courses', roles: LMS.concat(['student']) },
      { id: 'lm-chap', label: 'Chapters & Topics', icon: 'layers', route: 'lms/chapters', roles: LMS },
      { id: 'lm-mat', label: 'Study Material', icon: 'file-text', route: 'lms/study-material', roles: LMS.concat(['student']) },
      { id: 'lm-vid', label: 'Video Lessons', icon: 'video', route: 'lms/video-lessons', roles: LMS.concat(['student']) },
      { id: 'lm-hw', label: 'Homework', icon: 'clipboard-list', route: 'lms/homework', roles: LMS.concat(['student']) },
      { id: 'lm-asg', label: 'Assignments', icon: 'edit', route: 'lms/assignments', roles: LMS.concat(['student']) },
      { id: 'lm-sub', label: 'Submissions', icon: 'inbox', route: 'lms/submissions', roles: LMS },
      { id: 'lm-live', label: 'Online Classes', icon: 'video', route: 'lms/online-classes', roles: LMS.concat(['student']) },
      { id: 'lm-test', label: 'Online Tests', icon: 'clipboard-check', route: 'lms/online-tests', roles: LMS.concat(['student']) },
      { id: 'lm-qb', label: 'Question Bank', icon: 'database', route: 'lms/question-bank', roles: LMS },
      { id: 'lm-doubt', label: 'Doubts & Discussion', icon: 'message-circle', route: 'lms/doubts', roles: LMS.concat(['student']), badge: 14 },
      { id: 'lm-prog', label: 'Student Progress', icon: 'chart-line', route: 'lms/progress', roles: LMS },
      { id: 'lm-appr', label: 'Content Approval', icon: 'check-circle', route: 'lms/content-approval', roles: ACAD_LEAD },
    ],
  },

  /* -------------------------------------------------------- communication */
  {
    id: 'communication', label: 'Communication', icon: 'megaphone', roles: COMM,
    items: [
      { id: 'cm-compose', label: 'Compose Message', icon: 'edit', route: 'communication/compose', roles: COMM },
      { id: 'cm-sms', label: 'SMS', icon: 'message-square', route: 'communication/sms', roles: COMM },
      { id: 'cm-email', label: 'Email', icon: 'mail', route: 'communication/email', roles: COMM },
      { id: 'cm-wa', label: 'WhatsApp', icon: 'message-circle', route: 'communication/whatsapp', roles: COMM },
      { id: 'cm-push', label: 'Push Notifications', icon: 'bell', route: 'communication/push', roles: COMM },
      { id: 'cm-ann', label: 'Announcements', icon: 'megaphone', route: 'communication/announcements', roles: COMM },
      { id: 'cm-circ', label: 'Circulars', icon: 'scroll', route: 'communication/circulars', roles: COMM },
      { id: 'cm-not', label: 'Notices', icon: 'flag', route: 'communication/notices', roles: COMM },
      { id: 'cm-emrg', label: 'Emergency Alert', icon: 'siren', route: 'communication/emergency-alert', roles: ['super-admin', 'principal', 'administrator', 'security'] },
      { id: 'cm-tpl', label: 'Templates', icon: 'copy', route: 'communication/templates', roles: ADMIN },
      { id: 'cm-sched', label: 'Scheduled Messages', icon: 'clock', route: 'communication/scheduled', roles: COMM },
      { id: 'cm-logs', label: 'Delivery Logs', icon: 'list', route: 'communication/delivery-logs', roles: COMM },
      { id: 'cm-rep', label: 'Communication Reports', icon: 'chart-bar', route: 'communication/reports', roles: LEADER },
    ],
  },

  /* ------------------------------------------------------------------ ptm */
  {
    id: 'ptm', label: 'Parent-Teacher Meetings', icon: 'handshake', roles: ACAD.concat(['parent']),
    items: [
      { id: 'ptm-sched', label: 'PTM Schedule', icon: 'calendar', route: 'ptm/schedule', roles: ACAD },
      { id: 'ptm-slots', label: 'Teacher Slots', icon: 'clock', route: 'ptm/slots', roles: ACAD },
      { id: 'ptm-book', label: 'Parent Bookings', icon: 'bookmark', route: 'ptm/bookings', roles: ACAD },
      { id: 'ptm-appt', label: 'Appointments', icon: 'calendar-check', route: 'ptm/appointments', roles: ACAD },
      { id: 'ptm-notes', label: 'Meeting Notes', icon: 'notebook', route: 'ptm/notes', roles: ACAD },
      { id: 'ptm-feed', label: 'Feedback', icon: 'star', route: 'ptm/feedback', roles: ACAD },
      { id: 'ptm-rep', label: 'PTM Reports', icon: 'chart-bar', route: 'ptm/reports', roles: ACAD_LEAD },
    ],
  },

  /* ----------------------------------------------------------- activities */
  {
    id: 'activities', label: 'Activities & Sports', icon: 'trophy', roles: ACAD,
    items: [
      { id: 'ac-houses', label: 'Houses', icon: 'flag', route: 'activities/houses', roles: ACAD },
      { id: 'ac-clubs', label: 'Clubs', icon: 'users', route: 'activities/clubs', roles: ACAD },
      { id: 'ac-sports', label: 'Sports', icon: 'football', route: 'activities/sports', roles: ACAD },
      { id: 'ac-comp', label: 'Competitions', icon: 'trophy', route: 'activities/competitions', roles: ACAD },
      { id: 'ac-part', label: 'Event Participation', icon: 'user-check', route: 'activities/participation', roles: ACAD },
      { id: 'ac-prac', label: 'Practice Schedule', icon: 'calendar', route: 'activities/practice-schedule', roles: ACAD },
      { id: 'ac-awd', label: 'Awards', icon: 'award', route: 'activities/awards', roles: ACAD },
      { id: 'ac-cert', label: 'Certificates', icon: 'certificate', route: 'activities/certificates', roles: ACAD },
      { id: 'ac-ach', label: 'Achievement Records', icon: 'medal', route: 'activities/achievements', roles: ACAD },
      { id: 'ac-rep', label: 'Activity Reports', icon: 'chart-bar', route: 'activities/reports', roles: ACAD_LEAD },
    ],
  },

  /* --------------------------------------------------------------- health */
  {
    id: 'health', label: 'Health & Wellness', icon: 'stethoscope', roles: HEALTH,
    items: [
      { id: 'hl-prof', label: 'Student Health Profiles', icon: 'heart-pulse', route: 'health/profiles', roles: HEALTH },
      { id: 'hl-hist', label: 'Medical History', icon: 'history', route: 'health/medical-history', roles: HEALTH },
      { id: 'hl-all', label: 'Allergies', icon: 'alert-triangle', route: 'health/allergies', roles: HEALTH },
      { id: 'hl-chk', label: 'Health Checkups', icon: 'clipboard-check', route: 'health/checkups', roles: HEALTH },
      { id: 'hl-inf', label: 'Infirmary Visits', icon: 'first-aid', route: 'health/infirmary', roles: HEALTH },
      { id: 'hl-med', label: 'Medication Log', icon: 'pill', route: 'health/medication', roles: HEALTH },
      { id: 'hl-inj', label: 'Injuries & Incidents', icon: 'alert-circle', route: 'health/incidents', roles: HEALTH },
      { id: 'hl-vac', label: 'Vaccination', icon: 'syringe', route: 'health/vaccination', roles: HEALTH },
      { id: 'hl-emg', label: 'Emergency Contacts', icon: 'phone-call', route: 'health/emergency-contacts', roles: HEALTH },
      { id: 'hl-rep', label: 'Health Reports', icon: 'chart-bar', route: 'health/reports', roles: HEALTH },
    ],
  },

  /* ---------------------------------------------------------- front office */
  {
    id: 'frontoffice', label: 'Front Office', icon: 'phone', roles: FO,
    items: [
      { id: 'fo-dash', label: 'Reception Dashboard', icon: 'dashboard', route: 'frontoffice/dashboard', roles: FO },
      { id: 'fo-enq', label: 'Enquiry Log', icon: 'message-square', route: 'frontoffice/enquiries', roles: FO },
      { id: 'fo-call', label: 'Phone Call Log', icon: 'phone-call', route: 'frontoffice/call-log', roles: FO },
      { id: 'fo-in', label: 'Postal / Courier In', icon: 'inbox', route: 'frontoffice/courier-in', roles: FO },
      { id: 'fo-out', label: 'Courier Out', icon: 'send', route: 'frontoffice/courier-out', roles: FO },
      { id: 'fo-appt', label: 'Appointments', icon: 'calendar-check', route: 'frontoffice/appointments', roles: FO },
      { id: 'fo-comp', label: 'Complaints Intake', icon: 'alert-circle', route: 'frontoffice/complaints', roles: FO },
      { id: 'fo-lost', label: 'Lost & Found', icon: 'search', route: 'frontoffice/lost-found', roles: FO },
      { id: 'fo-srch', label: 'Student Search', icon: 'user', route: 'frontoffice/student-search', roles: FO },
    ],
  },

  /* ------------------------------------------------------------- security */
  {
    id: 'security', label: 'Security', icon: 'shield', roles: SEC,
    items: [
      { id: 'se-vis', label: 'Visitor Management', icon: 'users', route: 'security/visitors', roles: SEC },
      { id: 'se-in', label: 'Visitor Check-in', icon: 'log-in', route: 'security/check-in', roles: SEC },
      { id: 'se-out', label: 'Visitor Check-out', icon: 'log-out', route: 'security/check-out', roles: SEC },
      { id: 'se-gps', label: 'Gate Pass — Student', icon: 'graduation-cap', route: 'security/gate-pass-student', roles: SEC },
      { id: 'se-gpe', label: 'Gate Pass — Staff', icon: 'id-card', route: 'security/gate-pass-staff', roles: SEC },
      { id: 'se-pick', label: 'Authorised Pickup Persons', icon: 'user-check', route: 'security/pickup-persons', roles: SEC },
      { id: 'se-veh', label: 'Vehicle Entry Log', icon: 'car', route: 'security/vehicle-log', roles: SEC },
      { id: 'se-inc', label: 'Incident Register', icon: 'alert-triangle', route: 'security/incidents', roles: SEC },
      { id: 'se-rost', label: 'Security Staff Roster', icon: 'calendar', route: 'security/roster', roles: SEC },
      { id: 'se-alert', label: 'Emergency Alerts', icon: 'siren', route: 'security/emergency-alerts', roles: SEC },
      { id: 'se-cctv', label: 'CCTV Monitoring', icon: 'cctv', route: 'security/cctv', roles: SEC },
    ],
  },

  /* ----------------------------------------------------------- complaints */
  {
    id: 'complaints', label: 'Complaints & Tickets', icon: 'alert-circle', roles: ALL,
    items: [
      { id: 'cp-raise', label: 'Raise a Complaint', icon: 'plus', route: 'complaints/raise', roles: ALL },
      { id: 'cp-all', label: 'All Complaints', icon: 'list', route: 'complaints/all', roles: STAFF },
      { id: 'cp-mine', label: 'My Complaints', icon: 'user', route: 'complaints/mine', roles: ALL },
      { id: 'cp-assign', label: 'Assigned to Me', icon: 'inbox', route: 'complaints/assigned', roles: STAFF, badge: { text: '5', tone: 'warning' } },
      { id: 'cp-esc', label: 'Escalations', icon: 'trending-up', route: 'complaints/escalations', roles: LEADER },
      { id: 'cp-cat', label: 'Categories', icon: 'tag', route: 'complaints/categories', roles: ADMIN },
      { id: 'cp-sla', label: 'SLA Configuration', icon: 'timer', route: 'complaints/sla', roles: ADMIN },
      { id: 'cp-rep', label: 'Complaint Reports', icon: 'chart-bar', route: 'complaints/reports', roles: LEADER },
    ],
  },

  /* --------------------------------------------------------------- events */
  {
    id: 'events', label: 'Events', icon: 'calendar-check', roles: ALL,
    items: [
      { id: 'ev-cal', label: 'Event Calendar', icon: 'calendar', route: 'events/calendar', roles: ALL },
      { id: 'ev-all', label: 'All Events', icon: 'list', route: 'events/all', roles: ALL },
      { id: 'ev-new', label: 'Create Event', icon: 'plus', route: 'events/create', roles: LEADER },
      { id: 'ev-reg', label: 'Registrations', icon: 'clipboard-list', route: 'events/registrations', roles: STAFF },
      { id: 'ev-att', label: 'Event Attendance', icon: 'clipboard-check', route: 'events/attendance', roles: STAFF },
      { id: 'ev-bud', label: 'Budget & Expenses', icon: 'wallet', route: 'events/budget', roles: FIN },
      { id: 'ev-gal', label: 'Gallery', icon: 'camera', route: 'events/gallery', roles: ALL },
      { id: 'ev-hol', label: 'Holidays', icon: 'umbrella', route: 'events/holidays', roles: ALL },
      { id: 'ev-trip', label: 'Trips & Excursions', icon: 'navigation', route: 'events/trips', roles: STAFF },
    ],
  },

  /* --------------------------------------------------------------- alumni */
  {
    id: 'alumni', label: 'Alumni', icon: 'award', roles: LEADER.concat(['front-office']),
    items: [
      { id: 'al-dir', label: 'Alumni Directory', icon: 'users', route: 'alumni/directory', roles: LEADER.concat(['front-office']) },
      { id: 'al-prof', label: 'Alumni Profile', icon: 'id-card', route: 'alumni/profile', roles: LEADER },
      { id: 'al-batch', label: 'Batches', icon: 'layers', route: 'alumni/batches', roles: LEADER },
      { id: 'al-career', label: 'Careers', icon: 'briefcase', route: 'alumni/careers', roles: LEADER },
      { id: 'al-ev', label: 'Alumni Events', icon: 'calendar-check', route: 'alumni/events', roles: LEADER },
      { id: 'al-don', label: 'Donations', icon: 'gift', route: 'alumni/donations', roles: FIN },
      { id: 'al-comm', label: 'Communication', icon: 'megaphone', route: 'alumni/communication', roles: LEADER },
      { id: 'al-story', label: 'Success Stories', icon: 'sparkles', route: 'alumni/stories', roles: LEADER },
    ],
  },

  /* -------------------------------------------------------------- reports */
  {
    id: 'reports', label: 'Reports', icon: 'chart-bar', roles: LEADER.concat(['accountant', 'hr-manager', 'librarian', 'transport-manager', 'hostel-warden']),
    items: [
      { id: 'rp-centre', label: 'Report Centre', icon: 'grid', route: 'reports/centre', roles: STAFF },
      { id: 'rp-acad', label: 'Academic Reports', icon: 'book-open', route: 'reports/academic', roles: ACAD },
      { id: 'rp-att', label: 'Attendance Reports', icon: 'clipboard-check', route: 'reports/attendance', roles: ACAD },
      { id: 'rp-adm', label: 'Admission Reports', icon: 'user-plus', route: 'reports/admissions', roles: ADM },
      { id: 'rp-fee', label: 'Fee Reports', icon: 'wallet', route: 'reports/fees', roles: FEE },
      { id: 'rp-fin', label: 'Finance Reports', icon: 'banknote', route: 'reports/finance', roles: FIN },
      { id: 'rp-hr', label: 'HR & Payroll Reports', icon: 'briefcase', route: 'reports/hr', roles: HR },
      { id: 'rp-tr', label: 'Transport Reports', icon: 'bus', route: 'reports/transport', roles: TRN },
      { id: 'rp-hs', label: 'Hostel Reports', icon: 'bed', route: 'reports/hostel', roles: HOS },
      { id: 'rp-lb', label: 'Library Reports', icon: 'library', route: 'reports/library', roles: LIB },
      { id: 'rp-iv', label: 'Inventory Reports', icon: 'box', route: 'reports/inventory', roles: INV },
      { id: 'rp-mis', label: 'MIS / Management Reports', icon: 'chart-line', route: 'reports/mis', roles: LEADER },
      { id: 'rp-build', label: 'Custom Report Builder', icon: 'tool', route: 'reports/builder', roles: LEADER },
      { id: 'rp-sched', label: 'Scheduled Reports', icon: 'clock', route: 'reports/scheduled', roles: LEADER },
    ],
  },

  /* -------------------------------------------------------------- portals */
  {
    id: 'portals', label: 'Portals', icon: 'layers', roles: ALL,
    items: [
      {
        id: 'pt-teacher', label: 'Teacher Portal', icon: 'presentation', route: 'portals/teacher/classes',
        roles: ['super-admin', 'teacher', 'class-teacher', 'principal'],
        children: [
          { id: 'pt-t-cls', label: 'My Classes', icon: 'grid', route: 'portals/teacher/classes', roles: ['super-admin', 'teacher', 'class-teacher'] },
          { id: 'pt-t-tt', label: 'My Timetable', icon: 'calendar', route: 'portals/teacher/timetable', roles: ['super-admin', 'teacher', 'class-teacher'] },
          { id: 'pt-t-att', label: 'My Attendance', icon: 'clipboard-check', route: 'portals/teacher/attendance', roles: ['super-admin', 'teacher', 'class-teacher'] },
          { id: 'pt-t-hw', label: 'My Homework', icon: 'clipboard-list', route: 'portals/teacher/homework', roles: ['super-admin', 'teacher', 'class-teacher'] },
          { id: 'pt-t-mk', label: 'Marks Entry', icon: 'edit', route: 'portals/teacher/marks-entry', roles: ['super-admin', 'teacher', 'class-teacher'] },
          { id: 'pt-t-st', label: 'My Students', icon: 'users', route: 'portals/teacher/students', roles: ['super-admin', 'teacher', 'class-teacher'] },
          { id: 'pt-t-lv', label: 'My Leave', icon: 'calendar', route: 'portals/teacher/leave', roles: ['super-admin', 'teacher', 'class-teacher'] },
        ],
      },
      {
        id: 'pt-parent', label: 'Parent Portal', icon: 'users', route: 'portals/parent/children',
        roles: ['super-admin', 'parent'],
        children: [
          { id: 'pt-p-ch', label: 'My Children', icon: 'users', route: 'portals/parent/children', roles: ['super-admin', 'parent'] },
          { id: 'pt-p-att', label: 'Attendance', icon: 'clipboard-check', route: 'portals/parent/attendance', roles: ['super-admin', 'parent'] },
          { id: 'pt-p-hw', label: 'Homework', icon: 'clipboard-list', route: 'portals/parent/homework', roles: ['super-admin', 'parent'] },
          { id: 'pt-p-res', label: 'Results', icon: 'file-text', route: 'portals/parent/results', roles: ['super-admin', 'parent'] },
          { id: 'pt-p-fee', label: 'Fees & Receipts', icon: 'wallet', route: 'portals/parent/fees', roles: ['super-admin', 'parent'] },
          { id: 'pt-p-bus', label: 'Bus Tracking', icon: 'bus', route: 'portals/parent/bus-tracking', roles: ['super-admin', 'parent'] },
          { id: 'pt-p-ptm', label: 'PTM', icon: 'handshake', route: 'portals/parent/ptm', roles: ['super-admin', 'parent'] },
          { id: 'pt-p-msg', label: 'Messages', icon: 'mail', route: 'portals/parent/messages', roles: ['super-admin', 'parent'] },
          { id: 'pt-p-doc', label: 'Documents', icon: 'folder', route: 'portals/parent/documents', roles: ['super-admin', 'parent'] },
          { id: 'pt-p-cmp', label: 'Complaints', icon: 'alert-circle', route: 'portals/parent/complaints', roles: ['super-admin', 'parent'] },
        ],
      },
      {
        id: 'pt-student', label: 'Student Portal', icon: 'graduation-cap', route: 'portals/student/timetable',
        roles: ['super-admin', 'student'],
        children: [
          { id: 'pt-s-tt', label: 'My Timetable', icon: 'calendar', route: 'portals/student/timetable', roles: ['super-admin', 'student'] },
          { id: 'pt-s-att', label: 'My Attendance', icon: 'clipboard-check', route: 'portals/student/attendance', roles: ['super-admin', 'student'] },
          { id: 'pt-s-hw', label: 'My Homework', icon: 'clipboard-list', route: 'portals/student/homework', roles: ['super-admin', 'student'] },
          { id: 'pt-s-as', label: 'My Assignments', icon: 'edit', route: 'portals/student/assignments', roles: ['super-admin', 'student'] },
          { id: 'pt-s-sm', label: 'Study Material', icon: 'book-open', route: 'portals/student/study-material', roles: ['super-admin', 'student'] },
          { id: 'pt-s-ex', label: 'My Exams', icon: 'file-text', route: 'portals/student/exams', roles: ['super-admin', 'student'] },
          { id: 'pt-s-rs', label: 'My Results', icon: 'chart-bar', route: 'portals/student/results', roles: ['super-admin', 'student'] },
          { id: 'pt-s-fe', label: 'My Fees', icon: 'wallet', route: 'portals/student/fees', roles: ['super-admin', 'student'] },
          { id: 'pt-s-lb', label: 'Library', icon: 'library', route: 'portals/student/library', roles: ['super-admin', 'student'] },
          { id: 'pt-s-ev', label: 'Events', icon: 'calendar-check', route: 'portals/student/events', roles: ['super-admin', 'student'] },
        ],
      },
      {
        id: 'pt-emp', label: 'Employee Portal', icon: 'id-card', route: 'portals/employee/profile',
        roles: STAFF,
        children: [
          { id: 'pt-e-pr', label: 'My Profile', icon: 'user', route: 'portals/employee/profile', roles: STAFF },
          { id: 'pt-e-at', label: 'My Attendance', icon: 'clipboard-check', route: 'portals/employee/attendance', roles: STAFF },
          { id: 'pt-e-lv', label: 'My Leave', icon: 'calendar', route: 'portals/employee/leave', roles: STAFF },
          { id: 'pt-e-ps', label: 'My Payslips', icon: 'receipt', route: 'portals/employee/payslips', roles: STAFF },
          { id: 'pt-e-dc', label: 'My Documents', icon: 'folder', route: 'portals/employee/documents', roles: STAFF },
          { id: 'pt-e-ap', label: 'My Appraisal', icon: 'star', route: 'portals/employee/appraisal', roles: STAFF },
          { id: 'pt-e-tr', label: 'My Training', icon: 'lightbulb', route: 'portals/employee/training', roles: STAFF },
        ],
      },
      { id: 'pt-mobile', label: 'Mobile Apps', icon: 'smartphone', route: 'portals/mobile-app' },
    ],
  },

  /* --------------------------------------------------------------- system */
  {
    id: 'system', label: 'System', icon: 'settings', roles: ADMIN,
    items: [
      { id: 'sy-users', label: 'Users', icon: 'users', route: 'system/users', roles: ADMIN },
      { id: 'sy-roles', label: 'Roles', icon: 'shield', route: 'system/roles', roles: ADMIN },
      { id: 'sy-perm', label: 'Permission Matrix', icon: 'table', route: 'system/permissions', roles: SUPER },
      { id: 'sy-mod', label: 'Module Access', icon: 'layers', route: 'system/module-access', roles: SUPER },
      { id: 'sy-camp', label: 'Campus Access', icon: 'building-2', route: 'system/campus-access', roles: SUPER },
      { id: 'sy-menu', label: 'Menu Permissions', icon: 'list', route: 'system/menu-permissions', roles: SUPER },
      { id: 'sy-gen', label: 'General Settings', icon: 'sliders', route: 'system/general', roles: ADMIN },
      { id: 'sy-school', label: 'School Profile', icon: 'building-columns', route: 'system/school-profile', roles: ADMIN },
      { id: 'sy-camps', label: 'Campuses', icon: 'map-pin', route: 'system/campuses', roles: ADMIN },
      { id: 'sy-sess', label: 'Session Settings', icon: 'calendar', route: 'system/session', roles: ADMIN },
      { id: 'sy-email', label: 'Email Settings', icon: 'mail', route: 'system/email', roles: ADMIN },
      { id: 'sy-sms', label: 'SMS Settings', icon: 'message-square', route: 'system/sms', roles: ADMIN },
      { id: 'sy-wa', label: 'WhatsApp Settings', icon: 'message-circle', route: 'system/whatsapp', roles: ADMIN },
      { id: 'sy-pay', label: 'Payment Gateway', icon: 'credit-card', route: 'system/payment-gateway', roles: ADMIN },
      { id: 'sy-bio', label: 'Biometric Integration', icon: 'fingerprint', route: 'system/biometric', roles: ADMIN },
      { id: 'sy-rfid', label: 'RFID Integration', icon: 'scan', route: 'system/rfid', roles: ADMIN },
      { id: 'sy-api', label: 'Integrations & API', icon: 'git-branch', route: 'system/integrations', roles: SUPER },
      { id: 'sy-backup', label: 'Backup & Restore', icon: 'database', route: 'system/backup', roles: SUPER },
      { id: 'sy-audit', label: 'Audit Logs', icon: 'history', route: 'system/audit-logs', roles: ADMIN },
      { id: 'sy-login', label: 'Login History', icon: 'log-in', route: 'system/login-history', roles: ADMIN },
      { id: 'sy-sec', label: 'Security Settings', icon: 'lock', route: 'system/security', roles: SUPER },
      { id: 'sy-data', label: 'Data Import / Export', icon: 'upload', route: 'system/data-import-export', roles: ADMIN },
    ],
  },
];

/* ============================================================= helpers = */

let _flat = null;
let _byRoute = null;

function buildIndex() {
  if (_flat) return;
  _flat = [];
  _byRoute = new Map();
  for (const section of NAV) {
    for (const item of section.items) {
      const push = (node, parent) => {
        const meta = {
          id: node.id,
          label: node.label,
          icon: node.icon || section.icon,
          route: node.route,
          roles: node.roles || section.roles,
          badge: node.badge || null,
          sectionId: section.id,
          sectionLabel: section.label,
          sectionIcon: section.icon,
          parentId: parent ? parent.id : null,
          parentLabel: parent ? parent.label : null,
          parentRoute: parent ? parent.route : null,
          hasChildren: !!(node.children && node.children.length),
        };
        _flat.push(meta);
        if (node.route && !_byRoute.has(node.route)) _byRoute.set(node.route, meta);
      };
      push(item, null);
      if (item.children) for (const child of item.children) push(child, item);
    }
  }
}

/** Every leaf route string in the IA (deduplicated, in nav order). */
export function allRoutes() {
  buildIndex();
  return Array.from(_byRoute.keys());
}

/** Flat list of every nav node with its section/parent metadata. */
export function flatNav() {
  buildIndex();
  return _flat.slice();
}

/** Metadata for a route: {id,label,icon,route,roles,sectionId,sectionLabel,parentLabel,...}. */
export function routeMeta(route) {
  buildIndex();
  return _byRoute.get(route) || null;
}

/** Alias of routeMeta — finds the nav node that owns a route. */
export function findRoute(route) { return routeMeta(route); }

/** The section object a route belongs to. */
export function sectionFor(route) {
  const meta = routeMeta(route);
  return meta ? NAV.find((s) => s.id === meta.sectionId) : null;
}

/** True when `roles` grants access to `role`. */
export function roleAllowed(roles, role) {
  if (!roles || !roles.length) return true;
  if (roles.includes('*')) return true;
  return roles.includes(role);
}

/**
 * The navigation tree visible to a role — sections and items filtered,
 * empty sections dropped. Returns a fresh structure (safe to mutate).
 */
export function navForRole(role) {
  const out = [];
  for (const section of NAV) {
    if (!roleAllowed(section.roles, role)) continue;
    const items = [];
    for (const item of section.items) {
      if (!roleAllowed(item.roles, role)) continue;
      const children = item.children
        ? item.children.filter((c) => roleAllowed(c.roles, role))
        : null;
      if (item.children && (!children || !children.length)) continue;
      items.push({ ...item, children: children && children.length ? children : null });
    }
    if (!items.length) continue;
    out.push({ ...section, items });
  }
  return out;
}

/** All routes a role can reach. */
export function routesForRole(role) {
  const out = [];
  for (const section of navForRole(role)) {
    for (const item of section.items) {
      if (item.route) out.push(item.route);
      if (item.children) for (const c of item.children) if (c.route) out.push(c.route);
    }
  }
  return Array.from(new Set(out));
}

/**
 * Breadcrumb trail for a route.
 * -> [{label:'Home', route:null}, {label:'Students', route:'students/all'}, ...]
 */
export function breadcrumbFor(route, extra) {
  const meta = routeMeta(route);
  const trail = [{ label: 'Home', route: null, icon: 'home' }];
  if (!meta) {
    if (route) trail.push({ label: route, route: null });
  } else {
    trail.push({ label: meta.sectionLabel, route: null, icon: meta.sectionIcon });
    if (meta.parentLabel) trail.push({ label: meta.parentLabel, route: meta.parentRoute });
    trail.push({ label: meta.label, route: meta.route, icon: meta.icon });
  }
  if (extra) {
    for (const e of [].concat(extra)) {
      trail.push(typeof e === 'string' ? { label: e, route: null } : e);
    }
  }
  return trail;
}

/** Sections as a lightweight list: [{id,label,icon,count}]. */
export function sectionSummary() {
  return NAV.map((s) => ({
    id: s.id,
    label: s.label,
    icon: s.icon,
    count: s.items.reduce((a, i) => a + (i.children ? i.children.length : 1), 0),
  }));
}

/** Quick actions surfaced in the "+" menu and the command palette. */
export const QUICK_ACTIONS = [
  { id: 'qa-student', label: 'Add Student', icon: 'user-plus', route: 'students/add', roles: ADM },
  { id: 'qa-enquiry', label: 'New Admission Enquiry', icon: 'message-square', route: 'admissions/enquiries', roles: ADM },
  { id: 'qa-fee', label: 'Collect Fee', icon: 'credit-card', route: 'fees/collection', roles: FEE },
  { id: 'qa-att', label: 'Mark Attendance', icon: 'clipboard-check', route: 'attendance/mark-daily', roles: ACAD },
  { id: 'qa-marks', label: 'Enter Marks', icon: 'edit', route: 'examination/marks-entry', roles: ACAD },
  { id: 'qa-hw', label: 'Assign Homework', icon: 'clipboard-list', route: 'lms/homework', roles: ACAD },
  { id: 'qa-msg', label: 'Send Message', icon: 'send', route: 'communication/compose', roles: COMM },
  { id: 'qa-circ', label: 'Publish Circular', icon: 'scroll', route: 'communication/circulars', roles: COMM },
  { id: 'qa-emp', label: 'Add Employee', icon: 'briefcase', route: 'hr/employees', roles: HR },
  { id: 'qa-leave', label: 'Apply for Leave', icon: 'calendar', route: 'portals/employee/leave', roles: STAFF },
  { id: 'qa-book', label: 'Issue Book', icon: 'book', route: 'library/issue', roles: LIB },
  { id: 'qa-visitor', label: 'Register Visitor', icon: 'users', route: 'security/check-in', roles: SEC },
  { id: 'qa-complaint', label: 'Raise a Complaint', icon: 'alert-circle', route: 'complaints/raise', roles: ALL },
  { id: 'qa-event', label: 'Create Event', icon: 'calendar-plus', route: 'events/create', roles: LEADER },
  { id: 'qa-report', label: 'Open Report Centre', icon: 'chart-bar', route: 'reports/centre', roles: STAFF },
];

export function quickActionsFor(role) {
  return QUICK_ACTIONS.filter((a) => roleAllowed(a.roles, role));
}

export default NAV;
