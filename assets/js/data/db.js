/* ==========================================================================
   db.js — deterministic in-memory mock database for the School ERP
   All collections are LAZY: the getter generates once, then caches.
   Realistic Indian school data. Academic calendar runs April -> March.
   ========================================================================== */

import { makeRng, hashString } from './rng.js';

/* ----------------------------------------------------------------- pools */

const FIRST_M = [
  'Aarav','Aditya','Advait','Akshay','Aman','Amit','Anand','Aniket','Ankit','Anuj','Arjun','Arnav','Aryan','Ashish',
  'Atharv','Bhavesh','Chirag','Darshan','Deepak','Dev','Dhruv','Gaurav','Girish','Harsh','Hemant','Hitesh','Ishaan',
  'Jatin','Kabir','Kartik','Kaushik','Kunal','Lakshay','Madhav','Manav','Manish','Mayank','Mihir','Naman','Naveen',
  'Neeraj','Nikhil','Nirav','Ojas','Om','Parth','Pranav','Prateek','Praveen','Rahul','Raghav','Rajat','Rakesh',
  'Reyansh','Rishab','Rohan','Rohit','Sagar','Sahil','Samar','Sanjay','Sarthak','Saurabh','Shaurya','Shivam','Siddharth',
  'Sohail','Sumit','Suraj','Tanmay','Tarun','Uday','Utkarsh','Vaibhav','Varun','Vedant','Vihaan','Vikram','Vinay',
  'Vivaan','Yash','Yuvraj','Zayan','Ayaan','Faizan','Imran','Rehan','Zaid','Karthik','Nithin','Pradeep','Sandeep',
  'Abhinav','Kushal','Devansh','Krish','Aarush','Ritvik','Shreyas','Anirudh','Bhuvan','Jaiveer',
];
const FIRST_F = [
  'Aadhya','Aanya','Aarohi','Aditi','Advika','Aishwarya','Akanksha','Amrita','Ananya','Anika','Anjali','Anushka',
  'Apeksha','Arya','Ashima','Avni','Bhavya','Chaitali','Charvi','Deepika','Devika','Diksha','Divya','Drishti',
  'Ekta','Esha','Gauri','Gitanjali','Harini','Heena','Ira','Ishita','Jahnavi','Janhvi','Juhi','Kavya','Keerthi',
  'Khushi','Kiara','Kritika','Lavanya','Maanya','Madhuri','Mahima','Manasi','Meera','Megha','Mishti','Mitali',
  'Myra','Naina','Namrata','Navya','Neha','Nidhi','Nikita','Niharika','Nisha','Ojaswi','Pallavi','Parineeti',
  'Pooja','Prachi','Pragya','Prisha','Priya','Radhika','Rashmi','Riya','Ruhi','Saanvi','Sakshi','Samaira',
  'Sanjana','Sara','Sarika','Shalini','Shreya','Shruti','Simran','Sneha','Sonal','Suhana','Swara','Tanisha',
  'Tanvi','Tara','Trisha','Vaishnavi','Vanya','Vedika','Zara','Ayesha','Fatima','Sana','Zoya','Anaya','Inaya',
  'Aarna','Kiara','Mahek','Nitya','Pihu','Reet',
];
const SURNAMES = [
  'Sharma','Verma','Gupta','Agarwal','Bansal','Mittal','Jain','Goyal','Khanna','Kapoor','Malhotra','Chopra',
  'Mehra','Bhatia','Arora','Sethi','Anand','Saxena','Srivastava','Mishra','Tiwari','Pandey','Dubey','Chaturvedi',
  'Trivedi','Joshi','Bhatt','Desai','Patel','Shah','Mehta','Modi','Thakkar','Parikh','Nair','Menon','Pillai',
  'Iyer','Iyengar','Krishnan','Subramanian','Raman','Reddy','Rao','Naidu','Chowdhury','Banerjee','Chatterjee',
  'Mukherjee','Ghosh','Bose','Das','Sen','Dutta','Roy','Singh','Kaur','Gill','Sandhu','Dhillon','Grewal',
  'Chauhan','Rathore','Shekhawat','Solanki','Yadav','Kumar','Prasad','Jha','Sinha','Thakur','Rawat','Bisht',
  'Negi','Kulkarni','Deshpande','Patil','Jadhav','Shinde','Gaikwad','More','Pawar','Khan','Ahmed','Ansari',
  'Qureshi','Siddiqui','Fernandes','D’Souza','Pereira','Lobo','Mathew','Thomas','Varghese','George','Baruah',
  'Gogoi','Borah','Lama','Tamang','Sarkar','Paul','Kar',
];
const CITY_AREAS = {
  'Gurugram': ['Sector 42','Sushant Lok','DLF Phase 3','South City II','Golf Course Road','Sohna Road','Palam Vihar'],
  'Noida': ['Sector 62','Sector 15A','Sector 50','Sector 137','Sector 93B','Sector 44'],
  'New Delhi': ['Vasant Kunj','Saket','Dwarka Sector 12','Rohini Sector 9','Greater Kailash','Punjabi Bagh'],
  'Bengaluru': ['Whitefield','Indiranagar','Koramangala','HSR Layout','Jayanagar','Sarjapur Road'],
  'Pune': ['Kothrud','Baner','Viman Nagar','Hinjewadi','Aundh','Kalyani Nagar'],
  'Hyderabad': ['Gachibowli','Banjara Hills','Jubilee Hills','Kondapur','Madhapur'],
  'Mumbai': ['Andheri West','Powai','Bandra East','Chembur','Thane West'],
  'Jaipur': ['Vaishali Nagar','Malviya Nagar','C-Scheme','Mansarovar'],
  'Lucknow': ['Gomti Nagar','Hazratganj','Aliganj','Indira Nagar'],
  'Chandigarh': ['Sector 17','Sector 35','Sector 44','Panchkula Sector 5'],
};
const STREETS = ['Green Avenue','Rose Lane','Palm Residency','Silver Oak Apartments','Maple Heights','Sunrise Enclave',
  'Lotus Villa','Shanti Niketan','Ashoka Road','Nehru Marg','Gandhi Path','Tagore Lane','Vivekananda Street'];

const OCCUPATIONS = ['Business Owner','Software Engineer','Chartered Accountant','Doctor','Bank Manager','Advocate',
  'Architect','Civil Servant','Professor','Consultant','Sales Manager','Entrepreneur','Homemaker','Pharmacist',
  'Dentist','Marketing Head','Project Manager','Contractor','Journalist','Interior Designer','Army Officer'];

const RELIGIONS = ['Hindu','Muslim','Sikh','Christian','Jain','Buddhist'];
const CATEGORIES = ['General','OBC','SC','ST','EWS'];
const BLOOD = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
const HOUSES = [
  { id: 'H1', name: 'Aravalli', colour: 'var(--chart-3)', motto: 'Strength in Unity' },
  { id: 'H2', name: 'Nilgiri', colour: 'var(--chart-1)', motto: 'Rise Above' },
  { id: 'H3', name: 'Shivalik', colour: 'var(--chart-4)', motto: 'Courage Always' },
  { id: 'H4', name: 'Vindhya', colour: 'var(--chart-8)', motto: 'Excel Together' },
];

const CLASS_DEFS = [
  { code: 'NUR', name: 'Nursery', level: 0, stage: 'Pre-Primary', sections: 4 },
  { code: 'LKG', name: 'LKG', level: 1, stage: 'Pre-Primary', sections: 4 },
  { code: 'UKG', name: 'UKG', level: 2, stage: 'Pre-Primary', sections: 4 },
  { code: 'I', name: 'Class I', level: 3, stage: 'Primary', sections: 5 },
  { code: 'II', name: 'Class II', level: 4, stage: 'Primary', sections: 5 },
  { code: 'III', name: 'Class III', level: 5, stage: 'Primary', sections: 5 },
  { code: 'IV', name: 'Class IV', level: 6, stage: 'Primary', sections: 5 },
  { code: 'V', name: 'Class V', level: 7, stage: 'Primary', sections: 5 },
  { code: 'VI', name: 'Class VI', level: 8, stage: 'Middle', sections: 6 },
  { code: 'VII', name: 'Class VII', level: 9, stage: 'Middle', sections: 6 },
  { code: 'VIII', name: 'Class VIII', level: 10, stage: 'Middle', sections: 6 },
  { code: 'IX', name: 'Class IX', level: 11, stage: 'Secondary', sections: 6 },
  { code: 'X', name: 'Class X', level: 12, stage: 'Secondary', sections: 6 },
  { code: 'XI', name: 'Class XI', level: 13, stage: 'Senior Secondary', sections: 4 },
  { code: 'XII', name: 'Class XII', level: 14, stage: 'Senior Secondary', sections: 4 },
];
const SECTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const STREAMS = ['Science', 'Commerce', 'Humanities'];

const SUBJECT_DEFS = [
  { code: 'ENG', name: 'English', type: 'Core' },
  { code: 'HIN', name: 'Hindi', type: 'Language' },
  { code: 'SAN', name: 'Sanskrit', type: 'Language' },
  { code: 'FRN', name: 'French', type: 'Language' },
  { code: 'MAT', name: 'Mathematics', type: 'Core' },
  { code: 'SCI', name: 'Science', type: 'Core' },
  { code: 'SST', name: 'Social Science', type: 'Core' },
  { code: 'PHY', name: 'Physics', type: 'Elective' },
  { code: 'CHE', name: 'Chemistry', type: 'Elective' },
  { code: 'BIO', name: 'Biology', type: 'Elective' },
  { code: 'CSC', name: 'Computer Science', type: 'Elective' },
  { code: 'ECO', name: 'Economics', type: 'Elective' },
  { code: 'ACC', name: 'Accountancy', type: 'Elective' },
  { code: 'BST', name: 'Business Studies', type: 'Elective' },
  { code: 'HIS', name: 'History', type: 'Elective' },
  { code: 'GEO', name: 'Geography', type: 'Elective' },
  { code: 'POL', name: 'Political Science', type: 'Elective' },
  { code: 'PSY', name: 'Psychology', type: 'Elective' },
  { code: 'EVS', name: 'EVS', type: 'Core' },
  { code: 'GK', name: 'General Knowledge', type: 'Co-curricular' },
  { code: 'ART', name: 'Art & Craft', type: 'Co-curricular' },
  { code: 'MUS', name: 'Music', type: 'Co-curricular' },
  { code: 'PED', name: 'Physical Education', type: 'Co-curricular' },
  { code: 'IT', name: 'Information Technology', type: 'Skill' },
];

/** How many marks a subject typically gives away, relative to a student's CGPA. */
const SUBJECT_DIFFICULTY = {
  MAT: -7, PHY: -7, CHE: -5, SCI: -4, ACC: -4, ECO: -3, BIO: -1, SST: -1, CSC: 2,
  ENG: 1, BST: 2, POL: 2, HIS: 1, GEO: 2, PSY: 3, IT: 4, HIN: 5, EVS: 5, SAN: 7,
  FRN: 3, GK: 6, ART: 9, MUS: 8, PED: 10,
};

const DEPARTMENTS = ['Academics','Administration','Accounts & Finance','Human Resources','Admissions','Library',
  'Transport','Hostel','Health & Wellness','Security','Front Office','IT & Systems','Sports','Maintenance','Housekeeping'];

/*
 * `w` is how many of this role a 380-person school group actually employs,
 * relative to the others. The old generator weighted purely by pay band, which
 * staffed the group with 52 nurses/counsellors and only 106 teachers for 90
 * sections — 41 periods a week each, and 85% of them class teachers. These
 * weights give ~157 teaching staff (14:1 student:teacher, ~28 periods a week)
 * and a support structure that looks like a school.
 */
const DESIGNATIONS = [
  { name: 'Principal', dept: 'Academics', band: 'L1', min: 165000, max: 215000, w: 0 },
  { name: 'Vice Principal', dept: 'Academics', band: 'L2', min: 125000, max: 165000, w: 0 },
  { name: 'Headmistress', dept: 'Academics', band: 'L2', min: 110000, max: 145000, w: 2 },
  { name: 'PGT', dept: 'Academics', band: 'L3', min: 62000, max: 95000, w: 21 },
  { name: 'TGT', dept: 'Academics', band: 'L4', min: 48000, max: 72000, w: 24 },
  { name: 'PRT', dept: 'Academics', band: 'L5', min: 36000, max: 56000, w: 21 },
  { name: 'Nursery Teacher', dept: 'Academics', band: 'L5', min: 30000, max: 44000, w: 9 },
  { name: 'Lab Assistant', dept: 'Academics', band: 'L6', min: 22000, max: 32000, w: 3 },
  { name: 'Sports Coach', dept: 'Sports', band: 'L5', min: 32000, max: 52000, w: 5 },
  { name: 'Librarian', dept: 'Library', band: 'L4', min: 34000, max: 50000, w: 3 },
  { name: 'Accountant', dept: 'Accounts & Finance', band: 'L4', min: 38000, max: 62000, w: 5 },
  { name: 'Finance Manager', dept: 'Accounts & Finance', band: 'L2', min: 85000, max: 125000, w: 1 },
  { name: 'HR Executive', dept: 'Human Resources', band: 'L5', min: 32000, max: 48000, w: 3 },
  { name: 'HR Manager', dept: 'Human Resources', band: 'L2', min: 78000, max: 118000, w: 1 },
  { name: 'Administrator', dept: 'Administration', band: 'L3', min: 45000, max: 72000, w: 12 },
  { name: 'Admission Officer', dept: 'Admissions', band: 'L4', min: 36000, max: 55000, w: 4 },
  { name: 'Front Office Executive', dept: 'Front Office', band: 'L6', min: 24000, max: 34000, w: 5 },
  { name: 'Transport Manager', dept: 'Transport', band: 'L3', min: 46000, max: 68000, w: 1 },
  { name: 'Driver', dept: 'Transport', band: 'L7', min: 18000, max: 26000, w: 6 },
  { name: 'Conductor', dept: 'Transport', band: 'L7', min: 14000, max: 20000, w: 4 },
  { name: 'Hostel Warden', dept: 'Hostel', band: 'L4', min: 34000, max: 52000, w: 2 },
  { name: 'School Nurse', dept: 'Health & Wellness', band: 'L5', min: 28000, max: 42000, w: 2 },
  { name: 'Counsellor', dept: 'Health & Wellness', band: 'L4', min: 40000, max: 60000, w: 2 },
  { name: 'Security Supervisor', dept: 'Security', band: 'L6', min: 22000, max: 32000, w: 2 },
  { name: 'Security Guard', dept: 'Security', band: 'L7', min: 15000, max: 21000, w: 9 },
  { name: 'System Administrator', dept: 'IT & Systems', band: 'L3', min: 52000, max: 82000, w: 2 },
  { name: 'Maintenance Technician', dept: 'Maintenance', band: 'L7', min: 18000, max: 26000, w: 8 },
  { name: 'Housekeeping Staff', dept: 'Housekeeping', band: 'L8', min: 12000, max: 17000, w: 22 },
];

const CAMPUS_DEFS = [
  { id: 'C1', name: 'Springdale International — Main Campus', city: 'Gurugram', code: 'SIG', board: 'CBSE', established: 1998 },
  { id: 'C2', name: 'Springdale International — Noida Campus', city: 'Noida', code: 'SIN', board: 'CBSE', established: 2006 },
  { id: 'C3', name: 'Springdale World School — Bengaluru', city: 'Bengaluru', code: 'SWB', board: 'IB', established: 2011 },
  { id: 'C4', name: 'Springdale Academy — Pune', city: 'Pune', code: 'SAP', board: 'ICSE', established: 2014 },
  { id: 'C5', name: 'Springdale Global — Hyderabad', city: 'Hyderabad', code: 'SGH', board: 'CBSE', established: 2019 },
];

const MONTHS_AY = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

/* --------------------------------------------------------------- helpers */

const pad = (n, w = 4) => String(n).padStart(w, '0');
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(new Date(d).getTime() + n * 86400000);
const round = (n, p = 0) => { const f = Math.pow(10, p); return Math.round(n * f) / f; };

/* ------------------------------------------------- lazy + reconciliation --
   Several collections are only complete once a *different* collection has been
   generated: db.students stamps `strength` onto sections and `onboard` onto
   vehicles, db.hostelRooms stamps `capacity` onto hostels, db.hostelAllocations
   stamps `occupied` onto rooms and `roomNo` onto students, db.timetableSlots
   stamps `weeklyPeriods` onto staff. Reading the target on its own used to hand
   back the pre-backfill value, so "349 beds" rendered as "0 beds" purely
   because of which screen the user happened to open first.

   Each lazy() may therefore declare a `reconcile` hook naming the collections
   that complete it (see need() below). Hooks are *deferred* until the outermost
   build finishes: running one mid-build could re-enter a factory that has not
   cached its value yet and would silently produce a second, unreconciled copy
   of that collection. Deferring means every hook runs against a fully cached
   graph, and the memoisation makes the whole thing cost nothing on repeat. */

let buildDepth = 0;
let draining = false;
const pendingReconciles = [];

function drainReconciles() {
  if (draining) return;              // a nested read re-entered; the loop below
  draining = true;                   // will pick up whatever it queued
  try {
    while (pendingReconciles.length) {
      const [name, fn] = pendingReconciles.shift();
      try { fn(); } catch (e) { console.warn('[db] reconcile failed for', name, e); }
    }
  } finally {
    draining = false;
  }
}

/** Declare that the collection being read is completed by these others. */
function need(...names) {
  for (const n of names) void db[n];
}

function lazy(target, name, factory, reconcile) {
  Object.defineProperty(target, name, {
    configurable: true,
    enumerable: true,
    get() {
      buildDepth++;
      let value;
      try { value = factory(); } finally { buildDepth--; }
      Object.defineProperty(target, name, { value, enumerable: true, configurable: true, writable: false });
      if (reconcile) pendingReconciles.push([name, reconcile]);
      if (buildDepth === 0) drainReconciles();
      return value;
    },
  });
}

function indexBy(rows, key = 'id') {
  const m = new Map();
  for (const r of rows) m.set(r[key], r);
  return m;
}

/* ============================================================= the db === */

export const db = {};

/* ---------------------------------------------------------- foundational */

lazy(db, 'campuses', () => {
  const r = makeRng('campuses');
  return CAMPUS_DEFS.map((c, i) => ({
    ...c,
    address: `${r.pick(STREETS)}, ${r.pick(CITY_AREAS[c.city] || ['Central'])}, ${c.city}`,
    state: { Gurugram: 'Haryana', Noida: 'Uttar Pradesh', Bengaluru: 'Karnataka', Pune: 'Maharashtra', Hyderabad: 'Telangana' }[c.city],
    pincode: String(110001 + r.int(0, 99999)).slice(0, 6),
    phone: `+91 ${r.int(70, 99)}${r.int(10000000, 99999999)}`,
    email: `${c.code.toLowerCase()}@springdale.edu.in`,
    principal: null,
    // Sanctioned seats. Sized against the section grid below so "capacity used"
    // lands in a believable 75–90% band instead of a quarter-full school.
    studentCapacity: [860, 690, 486, 486, 418][i], // reconciled against db.sections
    strength: 0, // backfilled from db.students
    active: true,
  }));
}, () => need('staff', 'students'));

lazy(db, 'academicYears', () => ([
  { id: 'AY2022', name: '2022-23', startDate: '2022-04-01', endDate: '2023-03-31', status: 'Closed', current: false },
  { id: 'AY2023', name: '2023-24', startDate: '2023-04-01', endDate: '2024-03-31', status: 'Closed', current: false },
  { id: 'AY2024', name: '2024-25', startDate: '2024-04-01', endDate: '2025-03-31', status: 'Closed', current: false },
  { id: 'AY2025', name: '2025-26', startDate: '2025-04-01', endDate: '2026-03-31', status: 'Archived', current: false },
  { id: 'AY2026', name: '2026-27', startDate: '2026-04-01', endDate: '2027-03-31', status: 'Active', current: true },
]));

lazy(db, 'boards', () => ([
  { id: 'B1', code: 'CBSE', name: 'Central Board of Secondary Education', affiliation: '530XXXX', gradingSystem: 'GS1' },
  { id: 'B2', code: 'ICSE', name: 'Council for the Indian School Certificate Examinations', affiliation: 'HA0XX', gradingSystem: 'GS2' },
  { id: 'B3', code: 'IB', name: 'International Baccalaureate', affiliation: '00XXXX', gradingSystem: 'GS3' },
  { id: 'B4', code: 'STATE', name: 'State Board', affiliation: 'ST-XXXX', gradingSystem: 'GS1' },
]));

lazy(db, 'houses', () => HOUSES.map((h) => ({ ...h, points: makeRng('house' + h.id).int(1800, 2600) })));

lazy(db, 'departments', () => DEPARTMENTS.map((name, i) => ({
  id: 'DEP' + pad(i + 1, 2),
  name,
  head: null,
  campusId: 'C1',
  staffCount: 0,
})), () => need('staff'));

lazy(db, 'designations', () => DESIGNATIONS.map((d, i) => ({
  id: 'DSG' + pad(i + 1, 2),
  name: d.name,
  department: d.dept,
  band: d.band,
  minSalary: d.min,
  maxSalary: d.max,
})));

/**
 * Sections per class, sized to the campus roll.
 *
 * Students are dealt round-robin across a campus's sections, so a section's
 * strength is (campus roll ÷ total sections). The old grid gave every campus
 * 4–6 sections per class, which left 251 sections holding 6–14 children each
 * against a 40-seat capacity — every class list, occupancy bar and register on
 * the product read as a quarter-empty school. Sizing the grid to the roll puts
 * 20–30 children in a room, which is what these campuses actually are.
 */
const _sectionGrid = {};
function sectionGrid(campus, levels) {
  if (_sectionGrid[campus.id]) return _sectionGrid[campus.id];
  const roll = CAMPUS_SHARE[campus.id] || 300;
  const grid = {};
  for (const l of levels) grid[l] = 1;
  // Extra sections go to the busiest years first: middle school, then primary,
  // then senior secondary (which splits by stream), then pre-primary.
  const order = [8, 9, 10, 3, 4, 5, 6, 7, 11, 12, 13, 14, 0, 1, 2].filter((l) => levels.includes(l));
  let extra = Math.max(0, Math.round(roll / 30) - levels.length);
  for (let i = 0; extra > 0; i++, extra--) grid[order[i % order.length]] += 1;
  _sectionGrid[campus.id] = grid;
  return grid;
}

lazy(db, 'classes', () => {
  const out = [];
  for (const campus of db.campuses) {
    const defs = CLASS_DEFS.filter((c) => !(campus.id === 'C5' && c.level > 12));
    const grid = sectionGrid(campus, defs.map((c) => c.level));
    for (const c of defs) {
      if (campus.id === 'C5' && c.level > 12) continue; // newest campus has no senior secondary yet
      out.push({
        id: `${campus.id}-${c.code}`,
        campusId: campus.id,
        code: c.code,
        name: c.name,
        level: c.level,
        stage: c.stage,
        sectionCount: grid[c.level],
        academicYearId: 'AY2026',
        strength: 0, // backfilled from db.students
      });
    }
  }
  return out;
}, () => need('students'));

lazy(db, 'sections', () => {
  const out = [];
  const r = makeRng('sections');
  for (const cls of db.classes) {
    for (let i = 0; i < cls.sectionCount; i++) {
      const letter = SECTION_LETTERS[i];
      out.push({
        id: `${cls.id}-${letter}`,
        classId: cls.id,
        campusId: cls.campusId,
        name: letter,
        label: `${cls.name} - ${letter}`,
        capacity: cls.level <= 2 ? 26 : 34,
        strength: 0, // backfilled from db.students
        stream: cls.level >= 13 ? STREAMS[i % 3] : null,
        roomNo: `${cls.level < 8 ? 'G' : cls.level < 12 ? '1' : '2'}${pad(r.int(1, 40), 2)}`,
        classTeacherId: null,
      });
    }
  }
  // Sanctioned seats per campus = the seats that physically exist in the grid,
  // so "capacity used" on the league table is a real number, not a guess.
  for (const c of db.campuses) {
    c.studentCapacity = out.filter((s) => s.campusId === c.id).reduce((a, s) => a + s.capacity, 0);
  }
  return out;
}, () => need('students', 'staff'));

lazy(db, 'subjects', () => {
  const out = [];
  for (const s of SUBJECT_DEFS) {
    out.push({
      id: 'SUB-' + s.code,
      code: s.code,
      name: s.name,
      type: s.type,
      hasPractical: ['PHY', 'CHE', 'BIO', 'CSC', 'IT', 'SCI'].includes(s.code),
      maxMarks: 100,
      passMarks: 33,
    });
  }
  return out;
});

lazy(db, 'subjectGroups', () => ([
  { id: 'SG1', name: 'Pre-Primary Core', levels: [0, 1, 2], subjects: ['ENG', 'HIN', 'MAT', 'EVS', 'ART', 'MUS', 'PED'] },
  { id: 'SG2', name: 'Primary Core', levels: [3, 4, 5, 6, 7], subjects: ['ENG', 'HIN', 'MAT', 'EVS', 'GK', 'ART', 'PED', 'CSC'] },
  { id: 'SG3', name: 'Middle Core', levels: [8, 9, 10], subjects: ['ENG', 'HIN', 'SAN', 'MAT', 'SCI', 'SST', 'CSC', 'ART', 'PED'] },
  { id: 'SG4', name: 'Secondary Core', levels: [11, 12], subjects: ['ENG', 'HIN', 'MAT', 'SCI', 'SST', 'IT', 'PED'] },
  { id: 'SG5', name: 'Senior — Science', levels: [13, 14], subjects: ['ENG', 'PHY', 'CHE', 'MAT', 'BIO', 'CSC', 'PED'] },
  { id: 'SG6', name: 'Senior — Commerce', levels: [13, 14], subjects: ['ENG', 'ACC', 'BST', 'ECO', 'MAT', 'IT', 'PED'] },
  { id: 'SG7', name: 'Senior — Humanities', levels: [13, 14], subjects: ['ENG', 'HIS', 'GEO', 'POL', 'PSY', 'ECO', 'PED'] },
]));

/** Subject codes taught at a class level (optionally for a stream). */
export function subjectsForLevel(level, stream) {
  if (level >= 13) {
    const g = stream === 'Commerce' ? 'SG6' : stream === 'Humanities' ? 'SG7' : 'SG5';
    return db.subjectGroups.find((x) => x.id === g).subjects;
  }
  const grp = db.subjectGroups.find((g) => g.levels.includes(level));
  return grp ? grp.subjects : ['ENG', 'MAT'];
}

/* --------------------------------------------------------------- people */

function makeName(r, gender) {
  const first = gender === 'Female' ? r.pick(FIRST_F) : r.pick(FIRST_M);
  const last = r.pick(SURNAMES);
  return { first, last, full: `${first} ${last}` };
}

function makeAddress(r, city) {
  const areas = CITY_AREAS[city] || ['Central'];
  return {
    line1: `${r.int(1, 480)}, ${r.pick(STREETS)}`,
    line2: r.pick(areas),
    city,
    state: { Gurugram: 'Haryana', Noida: 'Uttar Pradesh', Bengaluru: 'Karnataka', Pune: 'Maharashtra', Hyderabad: 'Telangana', 'New Delhi': 'Delhi' }[city] || 'Haryana',
    pincode: String(r.int(110001, 560103)),
    country: 'India',
  };
}
function phone(r) { return `+91 ${r.int(70, 99)}${r.int(100, 999)}${r.int(10000, 99999)}`; }

const CAMPUS_SHARE = { C1: 780, C2: 620, C3: 380, C4: 360, C5: 260 }; // = 2400

/** The demo clock. Every "today" in the dataset is this instant. */
export const DEMO_TODAY = '2026-08-20';

/**
 * Working days of the current session up to the demo clock: Sundays and every
 * declared holiday / vacation window removed.
 *
 * Attendance used to be generated over a fixed 34-day window starting 1 June —
 * which sat *inside* the summer vacation and stopped seven weeks before the
 * demo clock. Everything time-based now hangs off this calendar instead.
 */
let _schoolDays = null;
export function schoolDays() {
  if (_schoolDays) return _schoolDays;
  const off = new Set();
  for (const hol of db.holidays) {
    for (let i = 0; i < (hol.days || 1); i++) off.add(iso(addDays(new Date(hol.date), i)));
  }
  const out = [];
  let d = new Date('2026-04-01');
  const end = new Date(DEMO_TODAY);
  while (d <= end) {
    const s = iso(d);
    if (d.getUTCDay() !== 0 && !off.has(s)) out.push(s);
    d = addDays(d, 1);
  }
  _schoolDays = out;
  return out;
}

lazy(db, 'students', () => {
  const out = [];
  const sessionDays = schoolDays().length;
  let n = 0;
  for (const campus of db.campuses) {
    const count = CAMPUS_SHARE[campus.id];
    const sections = db.sections.filter((s) => s.campusId === campus.id);
    for (let i = 0; i < count; i++) {
      n++;
      const r = makeRng('stu' + n);
      const sec = sections[i % sections.length];
      const cls = db.classes.find((c) => c.id === sec.classId);
      const gender = r.bool(0.52) ? 'Male' : 'Female';
      const name = makeName(r, gender);
      const admYear = 2026 - Math.min(cls.level, r.int(0, 6));
      const dobYear = 2026 - (cls.level + 3) - r.int(0, 1);
      const house = HOUSES[n % 4];
      // Attendance is not a bell curve in a real school: it clusters hard in the
      // low nineties with a long thin tail of chronic absentees. A single
      // gaussian produced a symmetric blob in which nobody fell below 75% — so
      // every "attendance defaulter" screen in the product rendered empty.
      // Older children and the youngest miss more school than the middle years,
      // which is what gives the by-class chart something to actually show.
      const stageShift = cls.level <= 2 ? -2.4 : cls.level >= 13 ? -2.0 : cls.level >= 11 ? -0.8 : cls.level <= 5 ? -0.6 : 0.9;
      const attendancePct = round(Math.max(41, Math.min(100, stageShift + (r.bool(0.86)
        ? r.gaussian(93.6, 3.7)      // the regular majority
        : r.gaussian(78, 8)))), 1);  // the tail the defaulter reports exist for
      const cgpa = round(Math.max(4.2, Math.min(10, r.gaussian(7.5, 1.2))), 2);
      const feeTotal = (cls.level <= 2 ? 96000 : cls.level <= 7 ? 128000 : cls.level <= 10 ? 152000 : 178000)
        + (campus.board === 'IB' ? 145000 : campus.board === 'ICSE' ? 22000 : 0);
      // Fees are billed in four quarterly instalments. At the demo clock
      // (20 Aug 2026) Q1 and Q2 are past their due date and Q3/Q4 are issued
      // but not yet payable — so exactly half the annual fee is due to date.
      const feeBilled = Math.round(feeTotal / 2);
      // Payment behaviour measured against what is actually due: most families
      // are current, a minority carry an arrear, a few settle the year up front.
      const feePaidPct = r.weighted([[1, 13], [0.75, 9], [0.5, 46], [0.375, 8], [0.25, 14], [0.125, 5], [0, 5]]);
      const feePaid = Math.round(feeTotal * feePaidPct);
      const feeOverdue = Math.max(0, feeBilled - feePaid);
      const fatherName = `${r.pick(FIRST_M)} ${name.last}`;
      const motherName = `${r.pick(FIRST_F)} ${name.last}`;
      // Every child has a guardian of record. These two fields were null on all
      // 2,400 rows, so the admissions search, the student 360 header and the
      // fee receipt each printed a literal "null" beside the contact number.
      const altGuardian = r.weighted([[null, 88], ['Grandfather', 4], ['Grandmother', 2], ['Uncle', 3], ['Legal Guardian', 3]]);
      const guardianRelation = altGuardian || (r.bool(0.22) ? 'Mother' : 'Father');
      const guardianName = altGuardian
        ? `${r.pick(altGuardian === 'Grandmother' ? FIRST_F : FIRST_M)} ${name.last}`
        : guardianRelation === 'Mother' ? motherName : fatherName;
      const status = r.weighted([['Active', 94], ['Alumni', 2], ['Transferred', 2], ['Inactive', 1], ['Suspended', 1]]);
      const stream = sec.stream;
      out.push({
        id: 'STU' + pad(n, 5),
        admissionNo: `${campus.code}/${admYear}/${pad(n, 4)}`,
        rollNo: pad((i % sec.capacity) + 1, 2),
        name: name.full,
        firstName: name.first,
        lastName: name.last,
        gender,
        dob: `${dobYear}-${pad(r.int(1, 12), 2)}-${pad(r.int(1, 28), 2)}`,
        age: 2026 - dobYear,
        bloodGroup: r.pick(BLOOD),
        religion: r.weighted([['Hindu', 74], ['Muslim', 11], ['Sikh', 6], ['Christian', 4], ['Jain', 3], ['Buddhist', 2]]),
        category: r.weighted([['General', 58], ['OBC', 22], ['EWS', 9], ['SC', 8], ['ST', 3]]),
        nationality: 'Indian',
        motherTongue: r.pick(['Hindi', 'English', 'Punjabi', 'Bengali', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Gujarati']),
        campusId: campus.id,
        classId: cls.id,
        className: cls.name,
        classLevel: cls.level,
        sectionId: sec.id,
        section: sec.name,
        stream,
        house: house.name,
        houseId: house.id,
        academicYearId: 'AY2026',
        admissionDate: `${admYear}-04-${pad(r.int(1, 20), 2)}`,
        admissionType: r.weighted([['Regular', 82], ['RTE', 6], ['Sibling', 8], ['Staff Ward', 4]]),
        status,
        photo: null,
        avatarInitials: (name.first[0] + name.last[0]).toUpperCase(),
        email: `${name.first.toLowerCase()}.${name.last.toLowerCase().replace(/[^a-z]/g, '')}${n}@student.springdale.edu.in`,
        phone: phone(r),
        address: makeAddress(r, campus.city),
        fatherId: 'PAR' + pad(n, 5) + 'F',
        motherId: 'PAR' + pad(n, 5) + 'M',
        fatherName: fatherName,
        motherName: motherName,
        guardianName,
        guardianRelation,
        emergencyContact: phone(r),
        siblingIds: [],
        attendancePct,
        presentDays: Math.round((attendancePct / 100) * sessionDays),
        totalDays: sessionDays,
        cgpa,
        lastExamPercent: round(Math.max(35, Math.min(99, cgpa * 9.5 + r.gaussian(0, 3))), 1),
        rank: 0,
        feeTotal,                       // annual fee — billed across four quarters
        feeAnnual: feeTotal,            // explicit alias for "annual fee" labels
        feeBilled,                      // instalments due on or before the demo clock
        feePaid,
        feeDue: feeTotal - feePaid,     // balance on the year (includes future quarters)
        feeOverdue,                     // the part that is actually late
        feeStatus: feeOverdue > 0 ? (feePaid === 0 ? 'Unpaid' : 'Partial') : 'Paid',
        transportOpted: r.bool(0.42),
        routeId: null,
        stopId: null,
        // Only the two campuses that actually have a hostel take boarders.
        hostelOpted: (campus.id === 'C3' || campus.id === 'C4') && r.bool(0.34),
        hostelId: null,
        roomNo: null,
        libraryCardNo: 'LIB' + pad(n, 5),
        booksIssued: r.weighted([[0, 60], [1, 24], [2, 11], [3, 5]]),
        medicalConditions: r.bool(0.12) ? r.pick(['Asthma', 'Peanut allergy', 'Dust allergy', 'Lactose intolerance', 'Spectacles', 'Migraine']) : 'None',
        behaviourScore: r.int(58, 100),
        disciplinaryCount: r.weighted([[0, 82], [1, 12], [2, 4], [3, 2]]),
        awardsCount: r.weighted([[0, 55], [1, 24], [2, 12], [3, 6], [4, 3]]),
        activities: r.sample(['Basketball', 'Debate Club', 'Robotics', 'Music', 'Dramatics', 'Swimming', 'Chess', 'Eco Club', 'MUN', 'Art Club', 'Athletics', 'Coding Club'], r.int(0, 3)),
        rte: r.bool(0.05),
        scholarship: r.bool(0.09) ? r.pick(['Merit Scholarship', 'Sports Quota', 'Sibling Discount', 'Staff Ward Waiver', 'Need-based Aid']) : null,
        createdAt: `${admYear}-04-${pad(r.int(1, 20), 2)}`,
      });
    }
  }
  // siblings: link a few same-surname pairs on the same campus
  const bySurname = new Map();
  for (const s of out) {
    const key = s.campusId + '|' + s.lastName;
    if (!bySurname.has(key)) bySurname.set(key, []);
    bySurname.get(key).push(s);
  }
  for (const group of bySurname.values()) {
    if (group.length >= 2) {
      for (let i = 0; i + 1 < group.length; i += 2) {
        if (hashString(group[i].id) % 5 === 0) {
          group[i].siblingIds = [group[i + 1].id];
          group[i + 1].siblingIds = [group[i].id];
        }
      }
    }
  }
  // class ranks
  const byClass = new Map();
  for (const s of out) {
    if (!byClass.has(s.classId)) byClass.set(s.classId, []);
    byClass.get(s.classId).push(s);
  }
  for (const list of byClass.values()) {
    list.sort((a, b) => b.lastExamPercent - a.lastExamPercent);
    list.forEach((s, i) => { s.rank = i + 1; });
  }

  /* ---- backfills that keep every other screen agreeing with this roll ---- */

  // Roll numbers run 1..n alphabetically inside a section, the way a real
  // register does (the round-robin index gave scattered, meaningless numbers).
  const bySection = new Map();
  for (const s of out) {
    if (!bySection.has(s.sectionId)) bySection.set(s.sectionId, []);
    bySection.get(s.sectionId).push(s);
  }
  // Sanctioned seats per room follow the roll: a room is sized so it runs at
  // the campus's target occupancy. Sizing every room identically left the
  // smallest sections half empty and pushed the pre-primary rooms 15% over.
  const FILL_TARGET = { C1: 0.93, C2: 0.90, C3: 0.83, C4: 0.79, C5: 0.70 };
  for (const [sectionId, list] of bySection) {
    list.sort((a, b) => a.name.localeCompare(b.name, 'en'));
    list.forEach((s, i) => { s.rollNo = pad(i + 1, 2); });
    const sec = db.sections.find((x) => x.id === sectionId);
    if (!sec) continue;
    sec.strength = list.length;
    sec.capacity = Math.max(20, Math.ceil(list.length / (FILL_TARGET[sec.campusId] || 0.85) / 2) * 2);
    sec.vacantSeats = sec.capacity - sec.strength;
  }
  const perClass = new Map();
  const perCampus = new Map();
  for (const s of out) {
    perClass.set(s.classId, (perClass.get(s.classId) || 0) + 1);
    perCampus.set(s.campusId, (perCampus.get(s.campusId) || 0) + 1);
  }
  for (const cls of db.classes) cls.strength = perClass.get(cls.id) || 0;
  for (const c of db.campuses) {
    c.strength = perCampus.get(c.id) || 0;
    c.studentCapacity = db.sections.filter((sec) => sec.campusId === c.id).reduce((a, sec) => a + sec.capacity, 0);
  }
  // A student who has left the roll is not a boarder either.
  for (const s of out) if (s.status !== 'Active') s.hostelOpted = false;

  // Transport: give every opted-in student a real route and stop, then make the
  // route roll and bus load agree with those allocations.
  const stopsByRoute = groupBy(db.stops, 'routeId');
  const routesByCampus = groupBy(db.routes.filter((rt) => rt.status !== 'Suspended'), 'campusId');
  const seats = new Map();
  for (const rt of db.routes) {
    rt.studentCount = 0;
    const veh = db.vehicles.find((v) => v.id === rt.vehicleId);
    seats.set(rt.id, Math.min(rt.capacity, veh ? veh.capacity : rt.capacity));
  }
  for (const s of out) {
    if (!s.transportOpted || s.status !== 'Active') { s.transportOpted = false; continue; }
    const pool = (routesByCampus.get(s.campusId) || [])
      .filter((rt) => rt.studentCount < seats.get(rt.id))
      .sort((a, b) => (a.studentCount / seats.get(a.id)) - (b.studentCount / seats.get(b.id)));
    if (!pool.length) { s.transportOpted = false; continue; } // fleet is full — private drop
    // Nearest-fill route, tie-broken deterministically so reloads are identical.
    const rt = pool[hashString(s.id) % Math.min(pool.length, 2)];
    const stops = stopsByRoute.get(rt.id) || [];
    const stop = stops.length ? stops[hashString(s.id + rt.id) % stops.length] : null;
    s.routeId = rt.id;
    s.routeName = rt.name;
    s.stopId = stop ? stop.id : null;
    s.stopName = stop ? stop.name : null;
    rt.studentCount += 1;
  }
  for (const rt of db.routes) {
    rt.monthlyRevenue = Math.round((rt.fare / 10) * rt.studentCount);
    rt.utilisation = round((rt.studentCount / rt.capacity) * 100, 1);
  }
  // A bus carries the children on its route, split across the buses working it.
  // Fourteen of the 42 vehicles used to report a random passenger load with no
  // allocated children behind it.
  for (const veh of db.vehicles) {
    const rt = db.routes.find((r) => r.id === veh.routeId);
    if (!rt) { veh.onboard = 0; veh.utilisation = 0; continue; }
    const buses = db.vehicles.filter((v) => v.routeId === rt.id).length || 1;
    veh.onboard = Math.min(veh.capacity, Math.round(rt.studentCount / buses));
    veh.utilisation = round((veh.onboard / veh.capacity) * 100, 1);
  }
  const perStop = new Map();
  for (const s of out) if (s.stopId) perStop.set(s.stopId, (perStop.get(s.stopId) || 0) + 1);
  for (const st of db.stops) st.studentCount = perStop.get(st.id) || 0;
  return out;
}, () => need('hostelAllocations'));

lazy(db, 'parents', () => {
  const out = [];
  const seen = new Set();
  const familyDone = new Set();
  for (const s of db.students) {
    // siblings share one family record set
    if (s.siblingIds.some((id) => familyDone.has(id))) continue;
    familyDone.add(s.id);
    const r = makeRng('par' + s.id);
    if (!seen.has(s.fatherId)) {
      seen.add(s.fatherId);
      out.push({
        id: s.fatherId,
        name: s.fatherName,
        relation: 'Father',
        gender: 'Male',
        studentIds: [s.id].concat(s.siblingIds),
        campusId: s.campusId,
        occupation: r.pick(OCCUPATIONS),
        organisation: r.pick(['Infosys', 'HCL Technologies', 'Deloitte India', 'ICICI Bank', 'Self-employed', 'Maruti Suzuki', 'Airtel', 'Apollo Hospitals', 'Government of India', 'TCS', 'Wipro', 'Reliance Retail']),
        qualification: r.pick(['B.Tech', 'MBA', 'B.Com', 'CA', 'MBBS', 'M.Tech', 'LLB', 'B.A.', 'M.Sc']),
        annualIncome: r.weighted([[600000, 12], [1200000, 30], [2400000, 32], [4800000, 18], [9000000, 8]]),
        phone: phone(r),
        altPhone: r.bool(0.4) ? phone(r) : null,
        email: `${s.fatherName.split(' ')[0].toLowerCase()}.${s.lastName.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
        address: s.address,
        aadhaarMasked: `XXXX XXXX ${r.int(1000, 9999)}`,
        panMasked: `XXXXX${r.int(1000, 9999)}X`,
        portalActive: r.bool(0.86),
        lastLogin: iso(r.date('2026-07-01', '2026-08-20')),
        feedbackCount: r.int(0, 4),
        avatarInitials: s.fatherName.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase(),
      });
    }
    if (!seen.has(s.motherId) && hashString(s.id) % 4 === 0) {
      seen.add(s.motherId);
      out.push({
        id: s.motherId,
        name: s.motherName,
        relation: 'Mother',
        gender: 'Female',
        studentIds: [s.id].concat(s.siblingIds),
        campusId: s.campusId,
        occupation: r.pick(OCCUPATIONS),
        organisation: r.pick(['Homemaker', 'Fortis Healthcare', 'Accenture', 'HDFC Bank', 'Self-employed', 'Amity University', 'Nestle India']),
        qualification: r.pick(['B.Ed', 'M.A.', 'B.Sc', 'MBA', 'B.Com', 'M.Ed', 'Ph.D']),
        annualIncome: r.weighted([[0, 30], [400000, 22], [900000, 26], [1800000, 16], [3600000, 6]]),
        phone: phone(r),
        altPhone: null,
        email: `${s.motherName.split(' ')[0].toLowerCase()}.${s.lastName.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
        address: s.address,
        aadhaarMasked: `XXXX XXXX ${r.int(1000, 9999)}`,
        panMasked: `XXXXX${r.int(1000, 9999)}X`,
        portalActive: r.bool(0.72),
        lastLogin: iso(r.date('2026-07-01', '2026-08-20')),
        feedbackCount: r.int(0, 3),
        avatarInitials: s.motherName.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase(),
      });
    }
  }
  return out;
});

lazy(db, 'staff', () => {
  const out = [];
  const share = { C1: 118, C2: 92, C3: 62, C4: 60, C5: 48 }; // 380
  let n = 0;
  for (const campus of db.campuses) {
    const count = share[campus.id];
    for (let i = 0; i < count; i++) {
      n++;
      const r = makeRng('emp' + n);
      const desig = i === 0
        ? DESIGNATIONS[0]
        : i === 1 ? DESIGNATIONS[1]
        : r.weighted(DESIGNATIONS.filter((d) => d.w > 0).map((d) => [d, d.w]));
      const gender = ['Nursery Teacher', 'School Nurse', 'PRT'].includes(desig.name) ? (r.bool(0.85) ? 'Female' : 'Male')
        : ['Driver', 'Security Guard', 'Conductor'].includes(desig.name) ? 'Male'
        : (r.bool(0.55) ? 'Female' : 'Male');
      const name = makeName(r, gender);
      const isTeaching = desig.dept === 'Academics' || desig.dept === 'Sports';
      const joinYear = 2026 - r.int(0, 18);
      const basic = r.int(desig.min, desig.max);
      const hra = Math.round(basic * 0.4);
      const da = Math.round(basic * 0.12);
      const conveyance = 2400;
      const pf = Math.round(basic * 0.12);
      const gross = basic + hra + da + conveyance + r.int(0, 4000);
      const tds = gross > 90000 ? Math.round(gross * 0.09) : gross > 55000 ? Math.round(gross * 0.045) : 0;
      const teachSubjects = isTeaching
        ? r.sample(SUBJECT_DEFS.filter((s) => s.type !== 'Co-curricular').map((s) => s.code), r.int(1, 3))
        : [];
      out.push({
        id: 'EMP' + pad(n, 4),
        employeeCode: `${campus.code}-E${pad(n, 4)}`,
        name: name.full,
        firstName: name.first,
        lastName: name.last,
        gender,
        dob: `${1968 + r.int(0, 32)}-${pad(r.int(1, 12), 2)}-${pad(r.int(1, 28), 2)}`,
        bloodGroup: r.pick(BLOOD),
        maritalStatus: r.weighted([['Married', 68], ['Single', 28], ['Other', 4]]),
        campusId: campus.id,
        department: desig.dept,
        departmentId: (db.departments.find((d) => d.name === desig.dept) || { id: 'DEP01' }).id,
        designation: desig.name,
        band: desig.band,
        type: isTeaching ? 'Teaching' : 'Non-Teaching',
        employmentType: r.weighted([['Permanent', 82], ['Contract', 13], ['Probation', 5]]),
        status: r.weighted([['Active', 93], ['On Leave', 4], ['Notice Period', 2], ['Resigned', 1]]),
        joiningDate: `${joinYear}-${pad(r.int(1, 12), 2)}-${pad(r.int(1, 28), 2)}`,
        experienceYears: 2026 - joinYear + r.int(0, 6),
        qualification: isTeaching ? r.pick(['M.A., B.Ed', 'M.Sc, B.Ed', 'M.Com, B.Ed', 'B.Ed, NTT', 'Ph.D, M.Ed', 'M.A. English, B.Ed']) : r.pick(['B.Com', 'MBA', 'Diploma', '12th Pass', 'B.A.', 'B.Sc IT']),
        subjects: teachSubjects,
        classesAssigned: [],
        isClassTeacher: false,
        classTeacherOf: null,
        weeklyPeriods: isTeaching ? r.int(18, 34) : 0,
        email: `${name.first.toLowerCase()}.${name.last.toLowerCase().replace(/[^a-z]/g, '')}@springdale.edu.in`,
        phone: phone(r),
        address: makeAddress(r, campus.city),
        avatarInitials: (name.first[0] + name.last[0]).toUpperCase(),
        salaryBasic: basic,
        salaryHra: hra,
        salaryDa: da,
        salaryConveyance: conveyance,
        salaryGross: gross,
        deductionPf: pf,
        deductionTds: tds,
        salaryNet: gross - pf - tds,
        bankName: r.pick(['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra']),
        accountMasked: `XXXXXX${r.int(1000, 9999)}`,
        ifsc: `${r.pick(['HDFC', 'ICIC', 'SBIN', 'UTIB', 'KKBK'])}0${r.int(100000, 999999)}`,
        uan: String(r.int(100000000000, 999999999999)),
        pan: `${r.pick(['ABCPD', 'XYZPK', 'LMNPS'])}${r.int(1000, 9999)}${r.pick(['A', 'B', 'C'])}`,
        attendancePct: round(Math.max(78, Math.min(100, r.gaussian(95, 3.5))), 1),
        leaveBalanceCL: r.int(0, 12),
        leaveBalanceSL: r.int(0, 10),
        leaveBalanceEL: r.int(0, 22),
        leaveTakenYtd: r.int(0, 18),
        appraisalRating: r.weighted([['Outstanding', 12], ['Exceeds Expectations', 28], ['Meets Expectations', 48], ['Needs Improvement', 10], ['Not Rated', 2]]),
        appraisalScore: round(r.float(2.6, 4.9), 1),
        trainingsCompleted: r.int(0, 7),
        reportsTo: null,
        photo: null,
        documentsComplete: r.bool(0.86),
        createdAt: `${joinYear}-01-01`,
      });
    }
  }
  // assign class teachers + campus principals
  for (const campus of db.campuses) {
    const teachers = out.filter((s) => s.campusId === campus.id && s.type === 'Teaching');
    const secs = db.sections.filter((s) => s.campusId === campus.id);
    secs.forEach((sec, i) => {
      const t = teachers[i % teachers.length];
      if (t) {
        t.isClassTeacher = true;
        t.classTeacherOf = t.classTeacherOf || sec.id;
        sec.classTeacherId = t.id;
      }
    });
    const principal = out.find((s) => s.campusId === campus.id && s.designation === 'Principal');
    if (principal) campus.principal = principal.name;
  }
  // Departments own a head and a headcount — both were null/0 on every row, so
  // the HR org chart and department cards had nothing real to show.
  const HEAD_OF = {
    Academics: ['Vice Principal', 'Headmistress'], 'Accounts & Finance': ['Finance Manager', 'Accountant'],
    'Human Resources': ['HR Manager', 'HR Executive'], Admissions: ['Admission Officer'],
    Library: ['Librarian'], Transport: ['Transport Manager'], Hostel: ['Hostel Warden'],
    'Health & Wellness': ['Counsellor', 'School Nurse'], Security: ['Security Supervisor'],
    'Front Office': ['Front Office Executive'], 'IT & Systems': ['System Administrator'],
    Sports: ['Sports Coach'], Maintenance: ['Maintenance Technician'], Housekeeping: ['Housekeeping Staff'],
    Administration: ['Vice Principal', 'Front Office Executive'],
  };
  for (const dep of db.departments) {
    const members = out.filter((s) => s.department === dep.name);
    dep.staffCount = members.length;
    const wanted = HEAD_OF[dep.name] || [];
    const lead = members.find((s) => wanted.includes(s.designation) && s.status === 'Active')
      || members.find((s) => s.status === 'Active') || members[0];
    if (lead) {
      dep.head = lead.name;
      dep.headId = lead.id;
      lead.reportsTo = lead.designation === 'Principal' ? null : (out.find((s) => s.campusId === lead.campusId && s.designation === 'Principal') || {}).id || null;
    }
    dep.campusId = lead ? lead.campusId : 'C1';
    dep.teaching = members.filter((s) => s.type === 'Teaching').length;
  }
  // Everyone else reports to their department head, and heads to the principal.
  for (const s of out) {
    if (s.reportsTo || s.designation === 'Principal') continue;
    const dep = db.departments.find((d) => d.name === s.department);
    const principal = out.find((x) => x.campusId === s.campusId && x.designation === 'Principal');
    s.reportsTo = dep && dep.headId !== s.id ? dep.headId : (principal ? principal.id : null);
  }
  return out;
}, () => need('timetableSlots'));

/* ----------------------------------------------------------- admissions */

const ENQ_SOURCES = ['Walk-in', 'Website', 'Referral', 'Google Ads', 'Facebook', 'Education Fair', 'Newspaper', 'Hoarding', 'Sibling'];
const ENQ_STAGES = ['New Enquiry', 'Contacted', 'Counselling', 'Application', 'Document Verification', 'Entrance Test', 'Interview', 'Offered', 'Admitted', 'Lost'];

lazy(db, 'enquiries', () => {
  const r0 = makeRng('enq');
  const out = [];
  for (let i = 1; i <= 600; i++) {
    const r = makeRng('enq' + i);
    const campus = r.pick(db.campuses);
    const gender = r.bool() ? 'Male' : 'Female';
    const name = makeName(r, gender);
    const cls = r.pick(CLASS_DEFS);
    const stage = r.weighted([['New Enquiry', 18], ['Contacted', 14], ['Counselling', 12], ['Application', 11],
      ['Document Verification', 8], ['Entrance Test', 8], ['Interview', 7], ['Offered', 7], ['Admitted', 10], ['Lost', 5]]);
    const created = r.date('2026-01-05', '2026-08-19');
    out.push({
      id: 'ENQ' + pad(i, 4),
      enquiryNo: `ENQ/26/${pad(i, 4)}`,
      studentName: name.full,
      gender,
      dob: `${2026 - (cls.level + 3)}-${pad(r.int(1, 12), 2)}-${pad(r.int(1, 28), 2)}`,
      classCode: cls.code,
      className: cls.name,
      classLevel: cls.level,
      campusId: campus.id,
      academicYearId: 'AY2026',
      parentName: `${r.pick(FIRST_M)} ${name.last}`,
      relation: r.pick(['Father', 'Mother', 'Guardian']),
      phone: phone(r),
      email: `${name.last.toLowerCase().replace(/[^a-z]/g, '')}${i}@gmail.com`,
      city: campus.city,
      source: r.pick(ENQ_SOURCES),
      stage,
      status: stage === 'Admitted' ? 'Converted' : stage === 'Lost' ? 'Lost' : 'Open',
      priority: r.weighted([['High', 24], ['Medium', 52], ['Low', 24]]),
      assignedTo: null,
      assignedToName: null,
      followUps: r.int(0, 6),
      nextFollowUp: iso(addDays(created, r.int(1, 20))),
      lastContact: iso(addDays(created, r.int(0, 12))),
      previousSchool: r.bool(0.6) ? r.pick(['DPS', 'Ryan International', 'Amity International', 'Bal Bharati', 'St. Xavier’s', 'Kendriya Vidyalaya', 'Podar International']) : null,
      remarks: r.pick(['Interested in transport facility.', 'Wants a campus tour next week.', 'Comparing with two other schools.', 'Sibling already studying here.', 'Fee structure shared over email.', 'Requested scholarship details.']),
      createdAt: iso(created),
      lostReason: stage === 'Lost' ? r.pick(['Fee too high', 'Chose another school', 'Relocating', 'No seat in preferred section', 'Unresponsive']) : null,
    });
  }
  const officers = db.staff.filter((s) => s.designation === 'Admission Officer');
  out.forEach((e, i) => {
    const o = officers[i % Math.max(1, officers.length)];
    if (o) { e.assignedTo = o.id; e.assignedToName = o.name; }
  });
  void r0;
  return out;
});

lazy(db, 'applications', () => {
  const out = [];
  const pool = db.enquiries.filter((e) => ENQ_STAGES.indexOf(e.stage) >= 3);
  pool.forEach((e, i) => {
    const r = makeRng('app' + e.id);
    const stageIdx = ENQ_STAGES.indexOf(e.stage);
    out.push({
      id: 'APP' + pad(i + 1, 4),
      applicationNo: `APL/26/${pad(i + 1, 4)}`,
      enquiryId: e.id,
      studentName: e.studentName,
      gender: e.gender,
      dob: e.dob,
      classCode: e.classCode,
      className: e.className,
      classLevel: e.classLevel,
      campusId: e.campusId,
      parentName: e.parentName,
      phone: e.phone,
      email: e.email,
      submittedOn: e.createdAt,
      mode: r.weighted([['Online', 72], ['Offline', 28]]),
      documentsSubmitted: r.int(3, 8),
      documentsRequired: 8,
      documentStatus: stageIdx >= 4 ? 'Verified' : r.pick(['Pending', 'Partial', 'Under Review']),
      entranceTestDate: stageIdx >= 5 ? iso(addDays(new Date(e.createdAt), 14)) : null,
      entranceScore: stageIdx >= 5 ? r.int(38, 98) : null,
      entranceResult: stageIdx >= 5 ? (r.bool(0.78) ? 'Qualified' : 'Not Qualified') : null,
      interviewDate: stageIdx >= 6 ? iso(addDays(new Date(e.createdAt), 20)) : null,
      interviewScore: stageIdx >= 6 ? r.int(5, 10) : null,
      interviewer: stageIdx >= 6 ? r.pick(db.staff.filter((s) => s.type === 'Teaching')).name : null,
      meritRank: stageIdx >= 7 ? r.int(1, 240) : null,
      status: e.stage === 'Admitted' ? 'Admitted' : e.stage === 'Lost' ? 'Rejected'
        : stageIdx >= 7 ? 'Offered' : 'In Process',
      offerDate: stageIdx >= 7 ? iso(addDays(new Date(e.createdAt), 25)) : null,
      admissionFeePaid: e.stage === 'Admitted',
      admissionFeeAmount: e.stage === 'Admitted' ? 25000 : 0,
      waitlisted: stageIdx === 7 && r.bool(0.18),
      remarks: e.remarks,
    });
  });
  return out;
});

lazy(db, 'followUps', () => {
  const out = [];
  let n = 0;
  for (const e of db.enquiries) {
    const r = makeRng('fu' + e.id);
    for (let i = 0; i < e.followUps; i++) {
      n++;
      out.push({
        id: 'FUP' + pad(n, 5),
        enquiryId: e.id,
        studentName: e.studentName,
        date: iso(addDays(new Date(e.createdAt), i * 4 + r.int(0, 3))),
        mode: r.pick(['Phone Call', 'Email', 'WhatsApp', 'Campus Visit', 'SMS']),
        outcome: r.pick(['Interested', 'Call back later', 'Not reachable', 'Visit scheduled', 'Documents requested', 'Negotiating fee']),
        by: e.assignedToName,
        notes: r.pick(['Explained fee structure and transport routes.', 'Parent to visit campus on Saturday.', 'Sent brochure and prospectus.', 'Asked about scholarship eligibility.', 'Number switched off, will retry.']),
        nextDate: iso(addDays(new Date(e.createdAt), i * 4 + r.int(4, 9))),
      });
    }
  }
  return out;
});

/* ------------------------------------------------------------- timetable */

const PERIODS = [
  { no: 1, start: '08:00', end: '08:40' },
  { no: 2, start: '08:40', end: '09:20' },
  { no: 3, start: '09:20', end: '10:00' },
  { no: 0, start: '10:00', end: '10:20', break: true, label: 'Short Break' },
  { no: 4, start: '10:20', end: '11:00' },
  { no: 5, start: '11:00', end: '11:40' },
  { no: -1, start: '11:40', end: '12:20', break: true, label: 'Lunch' },
  { no: 6, start: '12:20', end: '13:00' },
  { no: 7, start: '13:00', end: '13:40' },
  { no: 8, start: '13:40', end: '14:20' },
];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

lazy(db, 'periods', () => PERIODS.map((p, i) => ({
  id: 'PRD' + (i + 1),
  no: p.no,
  label: p.break ? p.label : `Period ${p.no}`,
  startTime: p.start,
  endTime: p.end,
  isBreak: !!p.break,
  duration: 40,
})));

lazy(db, 'timetableSlots', () => {
  const out = [];
  let n = 0;
  const teaching = db.staff.filter((s) => s.type === 'Teaching');
  for (const sec of db.sections) {
    const cls = db.classes.find((c) => c.id === sec.classId);
    if (!cls) continue;
    const subs = subjectsForLevel(cls.level, sec.stream);
    const r = makeRng('tt' + sec.id);
    const secTeachers = teaching.filter((t) => t.campusId === sec.campusId);
    for (const day of WEEKDAYS) {
      const teaching_periods = PERIODS.filter((p) => !p.break);
      teaching_periods.forEach((p, pi) => {
        n++;
        const code = subs[(pi + WEEKDAYS.indexOf(day)) % subs.length];
        const t = secTeachers[(hashString(code + sec.id + day) + pi) % Math.max(1, secTeachers.length)];
        out.push({
          id: 'TTS' + pad(n, 6),
          campusId: sec.campusId,
          classId: sec.classId,
          className: cls.name,
          sectionId: sec.id,
          section: sec.name,
          day,
          periodNo: p.no,
          startTime: p.start,
          endTime: p.end,
          subjectCode: code,
          subjectName: (SUBJECT_DEFS.find((s) => s.code === code) || {}).name || code,
          teacherId: t ? t.id : null,
          teacherName: t ? t.name : 'Unassigned',
          room: sec.roomNo,
          academicYearId: 'AY2026',
          isSubstituted: r.bool(0.02),
        });
      });
    }
  }
  // A teacher's weekly load is however many periods the timetable actually
  // gives them — it used to be an unrelated random number, so the workload
  // screen and the master timetable told different stories.
  const load = new Map();
  for (const slot of out) if (slot.teacherId) load.set(slot.teacherId, (load.get(slot.teacherId) || 0) + 1);
  for (const t of db.staff) {
    if (t.type !== 'Teaching') continue;
    t.weeklyPeriods = load.get(t.id) || 0;
    t.sectionsTaught = new Set(out.filter((s) => s.teacherId === t.id).map((s) => s.sectionId)).size;
    t.classesAssigned = Array.from(new Set(out.filter((s) => s.teacherId === t.id).map((s) => s.className)));
  }
  return out;
});

lazy(db, 'substitutions', () => {
  const out = [];
  const slots = db.timetableSlots.filter((s) => s.isSubstituted).slice(0, 180);
  slots.forEach((s, i) => {
    const r = makeRng('sub' + s.id);
    const pool = db.staff.filter((t) => t.type === 'Teaching' && t.campusId === s.campusId);
    const sub = pool[i % pool.length];
    out.push({
      id: 'SBT' + pad(i + 1, 4),
      date: iso(addDays('2026-08-10', r.int(0, 10))),
      slotId: s.id,
      className: s.className,
      section: s.section,
      periodNo: s.periodNo,
      subjectName: s.subjectName,
      absentTeacherId: s.teacherId,
      absentTeacherName: s.teacherName,
      substituteTeacherId: sub ? sub.id : null,
      substituteTeacherName: sub ? sub.name : '—',
      reason: r.pick(['Casual Leave', 'Sick Leave', 'Official Duty', 'Training', 'Personal Emergency']),
      status: r.weighted([['Confirmed', 76], ['Pending', 16], ['Declined', 8]]),
      campusId: s.campusId,
    });
  });
  return out;
});

/* ------------------------------------------------------------ attendance */

lazy(db, 'attendance', () => {
  /*
   * Daily register per section over the last 40 working days, ending on the
   * demo clock. Two things this deliberately gets right:
   *   1. the days are real school days (no rows inside the summer vacation,
   *      and the series runs right up to "today" instead of stopping in July);
   *   2. absence is drawn from the section's *own* children, so the register
   *      average agrees with the attendance % shown on the student list, the
   *      360 profile and the parent portal.
   *   3. present + absent === strength, with leave a subset of absent.
   */
  const out = [];
  let n = 0;
  const days = schoolDays(); // the whole session, so the monthly trend is real
  const today = days[days.length - 1];
  const byStudent = groupBy(db.students.filter((s) => s.status === 'Active'), 'sectionId');
  for (const sec of db.sections) {
    const roll = byStudent.get(sec.id) || [];
    const strength = roll.length;
    if (!strength) continue;
    const r = makeRng('att' + sec.id);
    // Mean absence rate for this exact room, from its own children.
    const absentRate = Math.max(0.005, 1 - (roll.reduce((a, s) => a + s.attendancePct, 0) / strength) / 100);
    // A handful of registers are still open at 09:30 on the current day.
    const openToday = r.bool(0.18);
    for (const date of days) {
      if (date === today && openToday) continue;
      n++;
      const absent = Math.max(0, Math.min(strength,
        Math.round(r.gaussian(strength * absentRate, Math.max(0.8, strength * absentRate * 0.55)))));
      const leave = absent ? Math.min(absent, r.weighted([[0, 46], [1, 34], [2, 15], [3, 5]])) : 0;
      const present = strength - absent;
      out.push({
        id: 'ATT' + pad(n, 6),
        date,
        campusId: sec.campusId,
        classId: sec.classId,
        sectionId: sec.id,
        sectionLabel: sec.label,
        strength,
        present,
        absent,                                   // includes `leave`
        unexcused: absent - leave,
        leave,
        late: Math.min(present, r.weighted([[0, 52], [1, 26], [2, 14], [3, 6], [4, 2]])),
        percent: round((present / strength) * 100, 1),
        markedBy: sec.classTeacherId,
        markedByName: (byId(db.staff, sec.classTeacherId) || {}).name || 'Class teacher',
        markedAt: `${date}T08:${pad(8 + (n % 22), 2)}:00`,
        status: 'Submitted',
      });
    }
  }
  return out;
});

lazy(db, 'studentLeaveRequests', () => {
  const out = [];
  const pool = db.students.slice(0, 420);
  pool.forEach((s, i) => {
    const r = makeRng('slv' + s.id);
    if (!r.bool(0.55)) return;
    const from = r.date('2026-06-05', '2026-08-18');
    const days = r.int(1, 5);
    out.push({
      id: 'SLR' + pad(i + 1, 4),
      studentId: s.id,
      studentName: s.name,
      className: s.className,
      section: s.section,
      campusId: s.campusId,
      fromDate: iso(from),
      toDate: iso(addDays(from, days - 1)),
      days,
      type: r.pick(['Sick Leave', 'Family Function', 'Medical', 'Travel', 'Religious', 'Competition']),
      reason: r.pick(['Viral fever, advised rest.', 'Attending a family wedding out of station.', 'Scheduled dental procedure.', 'Representing the district at state athletics.', 'Family travel plans booked earlier.']),
      appliedBy: 'Parent',
      appliedOn: iso(addDays(from, -2)),
      status: r.weighted([['Approved', 66], ['Pending', 22], ['Rejected', 12]]),
      approvedBy: null,
      attachment: r.bool(0.4) ? 'medical-certificate.pdf' : null,
    });
  });
  return out;
});

lazy(db, 'lateRecords', () => {
  const out = [];
  db.students.slice(0, 300).forEach((s, i) => {
    const r = makeRng('late' + s.id);
    if (!r.bool(0.5)) return;
    out.push({
      id: 'LAT' + pad(i + 1, 4),
      studentId: s.id,
      studentName: s.name,
      className: s.className,
      section: s.section,
      campusId: s.campusId,
      date: iso(r.date('2026-07-01', '2026-08-19')),
      inTime: `08:${pad(r.int(5, 45), 2)}`,
      minutesLate: r.int(5, 45),
      type: r.weighted([['Late Arrival', 78], ['Early Departure', 22]]),
      reason: r.pick(['Traffic congestion', 'Bus delay', 'Medical appointment', 'Overslept', 'Parent dropped late']),
      actionTaken: r.pick(['Warning issued', 'Note to parent', 'Counselled', 'None']),
    });
  });
  return out;
});

lazy(db, 'biometricDevices', () => {
  const r = makeRng('bio');
  const out = [];
  let n = 0;
  for (const c of db.campuses) {
    for (const loc of ['Main Gate', 'Staff Block', 'Primary Wing', 'Senior Wing', 'Hostel Gate']) {
      n++;
      out.push({
        id: 'DEV' + pad(n, 3),
        name: `${c.code}-${loc.replace(/\s/g, '')}`,
        campusId: c.id,
        location: loc,
        type: r.pick(['Fingerprint', 'RFID', 'Face Recognition', 'RFID + Fingerprint']),
        serial: `SN${r.int(100000, 999999)}`,
        ip: `10.${r.int(0, 20)}.${r.int(0, 255)}.${r.int(2, 254)}`,
        status: r.weighted([['Online', 84], ['Offline', 8], ['Maintenance', 8]]),
        lastSync: '2026-08-20T07:4' + r.int(0, 9) + ':00',
        punchesToday: r.int(120, 1800),
        firmware: `v${r.int(2, 5)}.${r.int(0, 9)}.${r.int(0, 9)}`,
      });
    }
  }
  return out;
});

/* ----------------------------------------------------------- examination */

lazy(db, 'examGroups', () => ([
  { id: 'EG1', name: 'Periodic Test 1', term: 'Term 1', weightage: 10, academicYearId: 'AY2026', from: '2026-05-11', to: '2026-05-16', status: 'Completed' },
  { id: 'EG2', name: 'Half Yearly Examination', term: 'Term 1', weightage: 30, academicYearId: 'AY2026', from: '2026-09-14', to: '2026-09-26', status: 'Scheduled' },
  { id: 'EG3', name: 'Periodic Test 2', term: 'Term 2', weightage: 10, academicYearId: 'AY2026', from: '2026-08-03', to: '2026-08-08', status: 'Completed' },
  { id: 'EG4', name: 'Pre-Board Examination', term: 'Term 2', weightage: 20, academicYearId: 'AY2026', from: '2026-12-07', to: '2026-12-18', status: 'Planned' },
  { id: 'EG5', name: 'Annual Examination', term: 'Term 2', weightage: 30, academicYearId: 'AY2026', from: '2027-02-22', to: '2027-03-12', status: 'Planned' },
  { id: 'EG6', name: 'Unit Test — Cycle 1', term: 'Term 1', weightage: 5, academicYearId: 'AY2026', from: '2026-06-22', to: '2026-06-25', status: 'Completed' },
]));

lazy(db, 'exams', () => {
  const out = [];
  let n = 0;
  for (const g of db.examGroups) {
    for (const cls of db.classes.filter((c) => c.campusId === 'C1')) {
      const subs = subjectsForLevel(cls.level);
      subs.forEach((code, i) => {
        n++;
        const r = makeRng('exm' + n);
        out.push({
          id: 'EXM' + pad(n, 5),
          examGroupId: g.id,
          examGroupName: g.name,
          classId: cls.id,
          className: cls.name,
          classLevel: cls.level,
          campusId: cls.campusId,
          subjectCode: code,
          subjectName: (SUBJECT_DEFS.find((s) => s.code === code) || {}).name || code,
          date: iso(addDays(new Date(g.from), i)),
          startTime: '09:00',
          endTime: cls.level >= 11 ? '12:00' : '11:00',
          maxMarks: cls.level <= 2 ? 50 : 100,
          passMarks: cls.level <= 2 ? 17 : 33,
          room: `Hall ${r.int(1, 8)}`,
          invigilatorId: null,
          status: g.status === 'Completed' ? 'Results Published' : g.status,
        });
      });
    }
  }
  const inv = db.staff.filter((s) => s.type === 'Teaching' && s.campusId === 'C1');
  out.forEach((e, i) => { const t = inv[i % inv.length]; if (t) { e.invigilatorId = t.id; e.invigilatorName = t.name; } });
  return out;
});

lazy(db, 'marks', () => {
  // Marks for the two completed exam groups, campus C1 only (kept lean).
  const out = [];
  let n = 0;
  const groups = ['EG1', 'EG3'];
  const students = db.students.filter((s) => s.campusId === 'C1' && s.status === 'Active');
  // Marks are entered by the teacher who actually takes that subject with that
  // section on the timetable — `enteredBy` was null on all 11.5k rows.
  const enteredBy = new Map();
  for (const slot of db.timetableSlots) {
    const key = slot.sectionId + '|' + slot.subjectCode;
    if (!enteredBy.has(key) && slot.teacherId) enteredBy.set(key, { id: slot.teacherId, name: slot.teacherName });
  }
  for (const s of students) {
    const subs = subjectsForLevel(s.classLevel, s.stream);
    for (const gid of groups) {
      const r = makeRng('mk' + s.id + gid);
      for (const code of subs) {
        n++;
        const max = s.classLevel <= 2 ? 50 : 100;
        // Subjects are not equally hard. Without this every cell of the
        // class × subject heatmap came out between 74 and 77 — a flat grid
        // that tells a head of school nothing.
        const base = (s.cgpa * 10 - 5 + (SUBJECT_DIFFICULTY[code] || 0)) * (max / 100);
        const score = Math.max(0, Math.min(max, Math.round(base + r.gaussian(0, max * 0.09))));
        out.push({
          id: 'MRK' + pad(n, 7),
          studentId: s.id,
          studentName: s.name,
          admissionNo: s.admissionNo,
          classId: s.classId,
          className: s.className,
          sectionId: s.sectionId,
          section: s.section,
          campusId: s.campusId,
          examGroupId: gid,
          subjectCode: code,
          subjectName: (SUBJECT_DEFS.find((x) => x.code === code) || {}).name || code,
          maxMarks: max,
          marksObtained: score,
          percent: round((score / max) * 100, 1),
          grade: gradeFor((score / max) * 100),
          status: score >= max * 0.33 ? 'Pass' : 'Fail',
          remarks: score >= max * 0.9 ? 'Outstanding' : score >= max * 0.75 ? 'Very Good' : score >= max * 0.6 ? 'Good' : score >= max * 0.33 ? 'Satisfactory' : 'Needs Improvement',
          enteredBy: (enteredBy.get(s.sectionId + '|' + code) || {}).id || null,
          enteredByName: (enteredBy.get(s.sectionId + '|' + code) || {}).name || null,
        });
      }
    }
  }
  return out;
});

export function gradeFor(pct) {
  if (pct >= 91) return 'A1';
  if (pct >= 81) return 'A2';
  if (pct >= 71) return 'B1';
  if (pct >= 61) return 'B2';
  if (pct >= 51) return 'C1';
  if (pct >= 41) return 'C2';
  if (pct >= 33) return 'D';
  return 'E';
}

lazy(db, 'gradeScales', () => ([
  { id: 'GS1', name: 'CBSE 8-Point Scale', bands: [
    { grade: 'A1', from: 91, to: 100, point: 10 }, { grade: 'A2', from: 81, to: 90, point: 9 },
    { grade: 'B1', from: 71, to: 80, point: 8 }, { grade: 'B2', from: 61, to: 70, point: 7 },
    { grade: 'C1', from: 51, to: 60, point: 6 }, { grade: 'C2', from: 41, to: 50, point: 5 },
    { grade: 'D', from: 33, to: 40, point: 4 }, { grade: 'E', from: 0, to: 32, point: 0 }] },
  { id: 'GS2', name: 'ICSE Percentage Scale', bands: [
    { grade: 'Distinction', from: 75, to: 100, point: 1 }, { grade: 'First Division', from: 60, to: 74, point: 2 },
    { grade: 'Second Division', from: 45, to: 59, point: 3 }, { grade: 'Pass', from: 35, to: 44, point: 4 },
    { grade: 'Fail', from: 0, to: 34, point: 5 }] },
  { id: 'GS3', name: 'IB 1-7 Scale', bands: [
    { grade: '7', from: 90, to: 100, point: 7 }, { grade: '6', from: 80, to: 89, point: 6 },
    { grade: '5', from: 70, to: 79, point: 5 }, { grade: '4', from: 60, to: 69, point: 4 },
    { grade: '3', from: 45, to: 59, point: 3 }, { grade: '2', from: 30, to: 44, point: 2 },
    { grade: '1', from: 0, to: 29, point: 1 }] },
]));

lazy(db, 'questionBank', () => {
  const out = [];
  let n = 0;
  for (const sub of SUBJECT_DEFS.slice(0, 16)) {
    const r = makeRng('qb' + sub.code);
    for (let i = 0; i < 45; i++) {
      n++;
      out.push({
        id: 'QST' + pad(n, 5),
        subjectCode: sub.code,
        subjectName: sub.name,
        classLevel: r.int(6, 14),
        type: r.pick(['MCQ', 'Short Answer', 'Long Answer', 'True/False', 'Fill in the Blank', 'Case Study']),
        difficulty: r.weighted([['Easy', 35], ['Medium', 45], ['Hard', 20]]),
        marks: r.pick([1, 2, 3, 4, 5]),
        topic: r.pick(['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Revision']),
        bloomLevel: r.pick(['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create']),
        text: `${sub.name} — question ${i + 1}: explain the key concept with a suitable example.`,
        usedCount: r.int(0, 14),
        createdBy: null,
        status: r.weighted([['Approved', 78], ['Draft', 14], ['Under Review', 8]]),
      });
    }
  }
  return out;
});

/* ------------------------------------------------------------------ fees */

lazy(db, 'feeHeads', () => ([
  { id: 'FH01', name: 'Tuition Fee', type: 'Recurring', frequency: 'Quarterly', refundable: false, taxable: false, ledger: 'Income — Tuition' },
  { id: 'FH02', name: 'Admission Fee', type: 'One-time', frequency: 'One-time', refundable: false, taxable: false, ledger: 'Income — Admission' },
  { id: 'FH03', name: 'Development Fee', type: 'Recurring', frequency: 'Annual', refundable: false, taxable: false, ledger: 'Income — Development' },
  { id: 'FH04', name: 'Transport Fee', type: 'Recurring', frequency: 'Monthly', refundable: false, taxable: true, ledger: 'Income — Transport' },
  { id: 'FH05', name: 'Hostel Fee', type: 'Recurring', frequency: 'Quarterly', refundable: false, taxable: false, ledger: 'Income — Hostel' },
  { id: 'FH06', name: 'Mess Charges', type: 'Recurring', frequency: 'Monthly', refundable: false, taxable: true, ledger: 'Income — Mess' },
  { id: 'FH07', name: 'Examination Fee', type: 'Recurring', frequency: 'Term', refundable: false, taxable: false, ledger: 'Income — Examination' },
  { id: 'FH08', name: 'Library Fee', type: 'Recurring', frequency: 'Annual', refundable: false, taxable: false, ledger: 'Income — Library' },
  { id: 'FH09', name: 'Laboratory Fee', type: 'Recurring', frequency: 'Annual', refundable: false, taxable: false, ledger: 'Income — Laboratory' },
  { id: 'FH10', name: 'Sports & Activity Fee', type: 'Recurring', frequency: 'Annual', refundable: false, taxable: false, ledger: 'Income — Activities' },
  { id: 'FH11', name: 'Security Deposit', type: 'One-time', frequency: 'One-time', refundable: true, taxable: false, ledger: 'Liability — Deposits' },
  { id: 'FH12', name: 'Uniform & Books', type: 'One-time', frequency: 'Annual', refundable: false, taxable: true, ledger: 'Income — Merchandise' },
  { id: 'FH13', name: 'Late Fee Penalty', type: 'Penalty', frequency: 'On Demand', refundable: false, taxable: false, ledger: 'Income — Penalty' },
  { id: 'FH14', name: 'ID Card & Diary', type: 'One-time', frequency: 'Annual', refundable: false, taxable: false, ledger: 'Income — Misc' },
]));

lazy(db, 'feeStructures', () => {
  const out = [];
  let n = 0;
  for (const campus of db.campuses) {
    for (const c of CLASS_DEFS) {
      n++;
      const r = makeRng('fs' + campus.id + c.code);
      const tuition = (c.level <= 2 ? 84000 : c.level <= 7 ? 108000 : c.level <= 10 ? 128000 : 148000)
        + (campus.board === 'IB' ? 132000 : campus.board === 'ICSE' ? 18000 : 0);
      out.push({
        id: 'FST' + pad(n, 3),
        name: `${c.name} — ${campus.code} — 2026-27`,
        campusId: campus.id,
        classCode: c.code,
        className: c.name,
        classLevel: c.level,
        academicYearId: 'AY2026',
        components: [
          { headId: 'FH01', name: 'Tuition Fee', amount: tuition, frequency: 'Quarterly' },
          { headId: 'FH03', name: 'Development Fee', amount: Math.round(tuition * 0.12), frequency: 'Annual' },
          { headId: 'FH07', name: 'Examination Fee', amount: c.level >= 3 ? 4500 : 0, frequency: 'Term' },
          { headId: 'FH08', name: 'Library Fee', amount: 2400, frequency: 'Annual' },
          { headId: 'FH09', name: 'Laboratory Fee', amount: c.level >= 8 ? 6800 : 0, frequency: 'Annual' },
          { headId: 'FH10', name: 'Sports & Activity Fee', amount: 5200, frequency: 'Annual' },
          { headId: 'FH14', name: 'ID Card & Diary', amount: 900, frequency: 'Annual' },
        ],
        total: 0,
        installments: r.pick([2, 3, 4]),
        dueDay: 10,
        lateFeePerDay: 50,
        status: 'Published',
      });
    }
  }
  for (const f of out) f.total = f.components.reduce((a, c) => a + c.amount, 0);
  return out;
});

lazy(db, 'invoices', () => {
  const out = [];
  let n = 0;
  const quarters = [
    { q: 'Q1', due: '2026-04-10', label: 'Apr - Jun 2026' },
    { q: 'Q2', due: '2026-07-10', label: 'Jul - Sep 2026' },
    { q: 'Q3', due: '2026-10-10', label: 'Oct - Dec 2026' },
    { q: 'Q4', due: '2027-01-10', label: 'Jan - Mar 2027' },
  ];
  /*
   * The whole annual schedule is raised at the start of the session, so the
   * four instalments always sum to the student's annual fee and the money
   * allocated across them always sums to `feePaid`. That single rule is what
   * makes the student list, the 360 profile, the fee ledger, the ageing donut
   * and the dashboard KPIs quote the same three numbers.
   */
  for (const s of db.students) {
    if (s.status !== 'Active') continue;
    const per = Math.round(s.feeTotal / 4);
    let wallet = s.feePaid;                  // settle oldest instalment first
    quarters.forEach((qt, qi) => {
      n++;
      const amount = qi === 3 ? s.feeTotal - per * 3 : per; // last one absorbs rounding
      const paid = Math.min(amount, Math.max(0, wallet));
      wallet -= paid;
      const balance = amount - paid;
      const pastDue = qt.due < DEMO_TODAY;
      const overdue = balance > 0 && pastDue;
      const overdueDays = overdue ? Math.round((new Date(DEMO_TODAY) - new Date(qt.due)) / 86400000) : 0;
      out.push({
        id: 'INV' + pad(n, 6),
        invoiceNo: `INV/26/${pad(n, 6)}`,
        studentId: s.id,
        studentName: s.name,
        admissionNo: s.admissionNo,
        className: s.className,
        section: s.section,
        campusId: s.campusId,
        academicYearId: 'AY2026',
        quarter: qt.q,
        period: qt.label,
        issueDate: iso(addDays(new Date(qt.due), -10)) < '2026-04-01' ? '2026-04-01' : iso(addDays(new Date(qt.due), -10)),
        dueDate: qt.due,
        amount,
        discount: s.scholarship ? Math.round(amount * 0.15) : 0,
        lateFee: overdue ? Math.min(3000, Math.max(1, Math.round(overdueDays / 3)) * 50) : 0,
        paid,
        balance,
        status: balance <= 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : overdue ? 'Overdue' : 'Pending',
        overdueDays,
      });
    });
  }
  return out;
});

lazy(db, 'payments', () => {
  const out = [];
  let n = 0;
  const modes = [['UPI', 34], ['Net Banking', 22], ['Credit Card', 12], ['Debit Card', 10], ['Cash', 9], ['Cheque', 7], ['NEFT/RTGS', 6]];
  /*
   * Receipts are minted from the money already allocated to each invoice, so
   * sum(payments) === sum(invoice.paid) === sum(student.feePaid) exactly. Every
   * receipt is a *successful* one; failed gateway attempts are appended
   * separately below and carry no value, because a failed attempt must never
   * inflate the collection figure on a dashboard.
   */
  for (const inv of db.invoices) {
    if (inv.paid <= 0) continue;
    const r = makeRng('pay' + inv.id);
    const parts = r.weighted([[1, 82], [2, 15], [3, 3]]);
    let remaining = inv.paid;
    // Families pay around the due date; anything for a future quarter is an
    // advance, so it lands somewhere in the session so far.
    let from = new Date(Math.max(new Date('2026-04-01').getTime(), new Date(inv.dueDate).getTime() - 20 * 86400000));
    let to = new Date(Math.min(new Date(inv.dueDate).getTime() + 40 * 86400000, new Date(DEMO_TODAY).getTime()));
    if (from > to) { from = new Date('2026-04-01'); to = new Date(DEMO_TODAY); }
    for (let p = 0; p < parts; p++) {
      n++;
      const amt = p === parts - 1 ? remaining : Math.round(remaining / (parts - p));
      remaining -= amt;
      const date = r.date(from, to);
      const mode = r.weighted(modes);
      out.push({
        id: 'PAY' + pad(n, 6),
        receiptNo: `RCP/26/${pad(n, 6)}`,
        invoiceId: inv.id,
        studentId: inv.studentId,
        studentName: inv.studentName,
        admissionNo: inv.admissionNo,
        className: inv.className,
        section: inv.section,
        campusId: inv.campusId,
        academicYearId: 'AY2026',
        date: iso(date),
        month: MONTHS_AY[monthIndexAY(date)],
        amount: amt,
        mode,
        reference: mode === 'Cash' ? '—' : `${mode.slice(0, 3).toUpperCase()}${r.int(100000000, 999999999)}`,
        bank: mode === 'Cash' ? '—' : r.pick(['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak']),
        collectedBy: null,
        status: 'Success',
        gatewayFee: mode === 'UPI' ? 0 : Math.round(amt * 0.0118),
        remarks: '',
      });
    }
  }
  // Failed / cancelled gateway attempts on invoices that are still open. These
  // show up on the payment log but contribute nothing to collection totals.
  const openInvoices = db.invoices.filter((i) => i.balance > 0 && i.overdueDays > 0);
  for (let i = 0; i < openInvoices.length; i += 37) {
    const inv = openInvoices[i];
    const r = makeRng('payfail' + inv.id);
    n++;
    const mode = r.weighted([['UPI', 40], ['Credit Card', 26], ['Net Banking', 22], ['Debit Card', 12]]);
    out.push({
      id: 'PAY' + pad(n, 6),
      receiptNo: '—',
      invoiceId: inv.id,
      studentId: inv.studentId,
      studentName: inv.studentName,
      admissionNo: inv.admissionNo,
      className: inv.className,
      section: inv.section,
      campusId: inv.campusId,
      academicYearId: 'AY2026',
      date: iso(r.date('2026-07-15', DEMO_TODAY)),
      month: MONTHS_AY[monthIndexAY(new Date(DEMO_TODAY))],
      amount: 0,
      attempted: inv.balance,
      mode,
      reference: `${mode.slice(0, 3).toUpperCase()}${r.int(100000000, 999999999)}`,
      bank: r.pick(['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak']),
      collectedBy: null,
      status: r.weighted([['Failed', 68], ['Cancelled', 32]]),
      gatewayFee: 0,
      remarks: r.pick(['Insufficient funds', 'Bank declined the transaction', 'Session timed out', 'Cancelled by payer']),
    });
  }
  const accountants = db.staff.filter((s) => s.designation === 'Accountant');
  out.forEach((p, i) => {
    const a = accountants[i % Math.max(1, accountants.length)];
    if (a) { p.collectedBy = a.id; p.collectedByName = a.name; }
  });
  return out;
});

function monthIndexAY(d) {
  const m = new Date(d).getMonth(); // 0=Jan
  return (m + 9) % 12; // Apr(3) -> 0
}

lazy(db, 'discounts', () => {
  // Beneficiary counts are read off the roll, so the discount screen and the
  // student filters (scholarship, RTE, sibling, staff ward) agree.
  const active = db.students.filter((s) => s.status === 'Active');
  const withScholarship = (name) => active.filter((s) => s.scholarship === name).length;
  return [
    { id: 'DSC1', name: 'Sibling Discount', type: 'Percentage', value: 10, appliesTo: 'Tuition Fee', autoApply: true, students: active.filter((s) => s.siblingIds.length > 0).length, active: true },
    { id: 'DSC2', name: 'Staff Ward Waiver', type: 'Percentage', value: 50, appliesTo: 'Tuition Fee', autoApply: true, students: active.filter((s) => s.admissionType === 'Staff Ward').length, active: true },
    { id: 'DSC3', name: 'Merit Scholarship (Top 3)', type: 'Percentage', value: 25, appliesTo: 'Total Fee', autoApply: false, students: withScholarship('Merit Scholarship'), active: true },
    { id: 'DSC4', name: 'Sports Quota', type: 'Percentage', value: 20, appliesTo: 'Tuition Fee', autoApply: false, students: withScholarship('Sports Quota'), active: true },
    { id: 'DSC5', name: 'RTE — Full Waiver', type: 'Percentage', value: 100, appliesTo: 'Total Fee', autoApply: true, students: active.filter((s) => s.rte || s.admissionType === 'RTE').length, active: true },
    { id: 'DSC6', name: 'Early Bird — Annual Payment', type: 'Percentage', value: 5, appliesTo: 'Tuition Fee', autoApply: false, students: active.filter((s) => s.feePaid >= s.feeTotal).length, active: true },
    { id: 'DSC7', name: 'Single Parent Concession', type: 'Fixed', value: 12000, appliesTo: 'Tuition Fee', autoApply: false, students: withScholarship('Need-based Aid'), active: true },
    { id: 'DSC8', name: 'Alumni Ward Discount', type: 'Percentage', value: 8, appliesTo: 'Tuition Fee', autoApply: false, students: withScholarship('Sibling Discount'), active: false },
  ];
});

lazy(db, 'refunds', () => {
  const out = [];
  db.students.slice(0, 40).forEach((s, i) => {
    const r = makeRng('ref' + s.id);
    out.push({
      id: 'RFD' + pad(i + 1, 3),
      studentId: s.id,
      studentName: s.name,
      className: s.className,
      campusId: s.campusId,
      amount: r.int(5000, 60000),
      reason: r.pick(['Transfer certificate issued', 'Security deposit refund', 'Duplicate payment', 'Transport discontinued', 'Admission cancelled']),
      requestDate: iso(r.date('2026-04-10', '2026-08-15')),
      status: r.weighted([['Approved', 46], ['Pending', 30], ['Processed', 16], ['Rejected', 8]]),
      mode: r.pick(['NEFT', 'Cheque', 'Adjustment']),
      approvedBy: null,
    });
  });
  return out;
});

/* --------------------------------------------------------------- finance */

lazy(db, 'accounts', () => ([
  { id: 'AC1000', code: '1000', name: 'Assets', type: 'Asset', parent: null, group: true, balance: 486200000 },
  { id: 'AC1100', code: '1100', name: 'Bank Accounts', type: 'Asset', parent: 'AC1000', group: true, balance: 96400000 },
  { id: 'AC1110', code: '1110', name: 'HDFC Current — Main', type: 'Asset', parent: 'AC1100', group: false, balance: 62800000 },
  { id: 'AC1120', code: '1120', name: 'ICICI Current — Fees', type: 'Asset', parent: 'AC1100', group: false, balance: 28900000 },
  { id: 'AC1130', code: '1130', name: 'SBI Savings — Corpus', type: 'Asset', parent: 'AC1100', group: false, balance: 4700000 },
  { id: 'AC1200', code: '1200', name: 'Cash in Hand', type: 'Asset', parent: 'AC1000', group: false, balance: 842000 },
  { id: 'AC1300', code: '1300', name: 'Fee Receivable', type: 'Asset', parent: 'AC1000', group: false, balance: 41250000 },
  { id: 'AC1400', code: '1400', name: 'Fixed Assets', type: 'Asset', parent: 'AC1000', group: true, balance: 347708000 },
  { id: 'AC2000', code: '2000', name: 'Liabilities', type: 'Liability', parent: null, group: true, balance: 128400000 },
  { id: 'AC2100', code: '2100', name: 'Security Deposits', type: 'Liability', parent: 'AC2000', group: false, balance: 24800000 },
  { id: 'AC2200', code: '2200', name: 'Salary Payable', type: 'Liability', parent: 'AC2000', group: false, balance: 18600000 },
  { id: 'AC2300', code: '2300', name: 'Statutory Dues (PF/TDS/GST)', type: 'Liability', parent: 'AC2000', group: false, balance: 6420000 },
  { id: 'AC2400', code: '2400', name: 'Term Loan — HDFC', type: 'Liability', parent: 'AC2000', group: false, balance: 78580000 },
  { id: 'AC3000', code: '3000', name: 'Income', type: 'Income', parent: null, group: true, balance: 412600000 },
  { id: 'AC3100', code: '3100', name: 'Tuition Fee Income', type: 'Income', parent: 'AC3000', group: false, balance: 318400000 },
  { id: 'AC3200', code: '3200', name: 'Transport Income', type: 'Income', parent: 'AC3000', group: false, balance: 41200000 },
  { id: 'AC3300', code: '3300', name: 'Hostel & Mess Income', type: 'Income', parent: 'AC3000', group: false, balance: 28600000 },
  { id: 'AC3400', code: '3400', name: 'Other Income', type: 'Income', parent: 'AC3000', group: false, balance: 24400000 },
  { id: 'AC4000', code: '4000', name: 'Expenses', type: 'Expense', parent: null, group: true, balance: 336900000 },
  { id: 'AC4100', code: '4100', name: 'Salaries & Wages', type: 'Expense', parent: 'AC4000', group: false, balance: 214800000 },
  { id: 'AC4200', code: '4200', name: 'Utilities', type: 'Expense', parent: 'AC4000', group: false, balance: 18400000 },
  { id: 'AC4300', code: '4300', name: 'Transport Operations', type: 'Expense', parent: 'AC4000', group: false, balance: 32600000 },
  { id: 'AC4400', code: '4400', name: 'Maintenance & Repairs', type: 'Expense', parent: 'AC4000', group: false, balance: 21300000 },
  { id: 'AC4500', code: '4500', name: 'Academic Supplies', type: 'Expense', parent: 'AC4000', group: false, balance: 16700000 },
  { id: 'AC4600', code: '4600', name: 'Marketing & Admissions', type: 'Expense', parent: 'AC4000', group: false, balance: 12400000 },
  { id: 'AC4700', code: '4700', name: 'Administrative Overheads', type: 'Expense', parent: 'AC4000', group: false, balance: 20700000 },
]));

lazy(db, 'bankAccounts', () => ([
  { id: 'BNK1', name: 'HDFC Current — Main', bank: 'HDFC Bank', branch: 'Sector 44, Gurugram', accountMasked: 'XXXXXX4821', ifsc: 'HDFC0001234', type: 'Current', balance: 62800000, campusId: 'C1', primary: true },
  { id: 'BNK2', name: 'ICICI Current — Fee Collection', bank: 'ICICI Bank', branch: 'Sector 62, Noida', accountMasked: 'XXXXXX9077', ifsc: 'ICIC0000456', type: 'Current', balance: 28900000, campusId: 'C2', primary: false },
  { id: 'BNK3', name: 'SBI Savings — Corpus', bank: 'State Bank of India', branch: 'Whitefield, Bengaluru', accountMasked: 'XXXXXX3312', ifsc: 'SBIN0007788', type: 'Savings', balance: 4700000, campusId: 'C3', primary: false },
  { id: 'BNK4', name: 'Axis Current — Payroll', bank: 'Axis Bank', branch: 'Baner, Pune', accountMasked: 'XXXXXX5540', ifsc: 'UTIB0002211', type: 'Current', balance: 12300000, campusId: 'C4', primary: false },
]));

lazy(db, 'vendors', () => {
  const names = ['Bharat Stationers','SmartEdu Furniture Pvt Ltd','Sharma Sports Supplies','QuickClean Facility Services',
    'GreenLeaf Caterers','TechnoLab Instruments','Prime Print Solutions','Sunrise Uniforms','Delta Security Services',
    'Ashoka Books Distributors','ElectroCare Services','AquaPure Water Systems','Nova IT Systems','Mahalaxmi Transport Spares',
    'Rainbow Art Supplies','Shakti Diesel & Lubricants','MediPlus Pharmaceuticals','Nirmal Housekeeping','Zenith AV Solutions','Kaveri Furnishings'];
  return names.map((name, i) => {
    const r = makeRng('ven' + i);
    return {
      id: 'VEN' + pad(i + 1, 3),
      name,
      category: r.pick(['Stationery', 'Furniture', 'Sports', 'Housekeeping', 'Catering', 'Lab Equipment', 'Printing', 'Uniforms', 'Security', 'Books', 'IT', 'Maintenance']),
      contactPerson: makeName(r, 'Male').full,
      phone: phone(r),
      email: `sales@${name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 14)}.co.in`,
      gstin: `06${r.pick(['AABCU', 'AAGCS', 'AACCP'])}${r.int(1000, 9999)}${r.pick(['A', 'B'])}1Z${r.int(1, 9)}`,
      address: makeAddress(r, r.pick(Object.keys(CITY_AREAS))),
      paymentTerms: r.pick(['Net 15', 'Net 30', 'Net 45', 'Advance']),
      rating: round(r.float(3.1, 4.9), 1),
      totalOrders: r.int(4, 82),
      totalValue: r.int(120000, 6800000),
      outstanding: r.int(0, 480000),
      status: r.weighted([['Active', 86], ['Blacklisted', 4], ['Inactive', 10]]),
      onboardedOn: iso(r.date('2019-01-01', '2026-05-01')),
    };
  });
});

lazy(db, 'expenses', () => {
  /*
   * Payroll used to be ~88 random vouchers of ₹18–42 lakh each, which booked
   * ₹28 crore of salary in five months against a ₹2 crore monthly payroll —
   * every month of the P&L came out deeply loss-making. Salary now posts as one
   * voucher per campus per payroll month, at the campus's real net payroll, and
   * the running costs are sized so the group runs the modest surplus a school
   * of this size actually runs.
   */
  const out = [];
  const cats = [['Utilities', 'AC4200'], ['Transport Operations', 'AC4300'],
    ['Maintenance & Repairs', 'AC4400'], ['Academic Supplies', 'AC4500'], ['Marketing & Admissions', 'AC4600'],
    ['Administrative Overheads', 'AC4700']];
  let i = 0;
  const PAY_MONTHS = [['2026-04-28', 'Apr'], ['2026-05-28', 'May'], ['2026-06-29', 'Jun'], ['2026-07-29', 'Jul']];
  for (const campus of db.campuses) {
    const net = db.staff.filter((s) => s.campusId === campus.id && s.status !== 'Resigned').reduce((a, s) => a + s.salaryNet, 0);
    for (const [date, month] of PAY_MONTHS) {
      i++;
      const r = makeRng('exps' + i);
      out.push({
        id: 'EXP' + pad(i, 4),
        voucherNo: `EXP/26/${pad(i, 4)}`,
        date,
        month,
        category: 'Salaries & Wages',
        accountId: 'AC4100',
        campusId: campus.id,
        vendorId: null,
        description: `Payroll disbursement — ${month} 2026 · ${campus.code}`,
        amount: net,
        paymentMode: 'NEFT',
        status: 'Paid',
        approvedBy: null,
        gst: 0,
        attachment: 'bank-advice.pdf',
      });
    }
  }
  while (i < 620) {
    i++;
    const r = makeRng('exp' + i);
    const cat = r.pick(cats);
    const date = r.date('2026-04-01', DEMO_TODAY);
    out.push({
      id: 'EXP' + pad(i, 4),
      voucherNo: `EXP/26/${pad(i, 4)}`,
      date: iso(date),
      month: MONTHS_AY[monthIndexAY(date)],
      category: cat[0],
      accountId: cat[1],
      campusId: r.pick(db.campuses).id,
      vendorId: r.pick(db.vendors).id,
      description: r.pick(['Monthly consumable supply', 'Quarterly AMC payment', 'Diesel & lubricants', 'Repair of classroom fixtures',
        'Digital campaign spend', 'Lab reagent purchase', 'Electricity bill settlement', 'Housekeeping contract', 'Printing of report cards']),
      amount: r.weighted([[r.int(4000, 40000), 52], [r.int(40000, 160000), 32], [r.int(160000, 480000), 13], [r.int(480000, 1400000), 3]]),
      paymentMode: r.pick(['NEFT', 'Cheque', 'UPI', 'Cash', 'Corporate Card']),
      status: r.weighted([['Approved', 68], ['Paid', 22], ['Pending Approval', 8], ['Rejected', 2]]),
      approvedBy: null,
      gst: r.bool(0.55) ? 18 : 0,
      attachment: r.bool(0.7) ? 'invoice.pdf' : null,
    });
  }
  return out;
});

lazy(db, 'vouchers', () => {
  const out = [];
  for (let i = 1; i <= 260; i++) {
    const r = makeRng('vch' + i);
    const type = r.pick(['Payment', 'Receipt', 'Journal', 'Contra', 'Credit Note', 'Debit Note']);
    out.push({
      id: 'VCH' + pad(i, 4),
      voucherNo: `${type.slice(0, 3).toUpperCase()}/26/${pad(i, 4)}`,
      type,
      date: iso(r.date('2026-04-01', '2026-08-20')),
      debitAccount: r.pick(db.accounts.filter((a) => !a.group)).name,
      creditAccount: r.pick(db.accounts.filter((a) => !a.group)).name,
      amount: r.int(5000, 2400000),
      narration: r.pick(['Being fee collected for Q2 2026-27', 'Being salary disbursed for July 2026', 'Being vendor bill settled',
        'Being cash deposited into bank', 'Being transport fee adjustment', 'Being scholarship credited']),
      campusId: r.pick(db.campuses).id,
      preparedBy: null,
      approvedBy: null,
      status: r.weighted([['Posted', 78], ['Draft', 14], ['Cancelled', 8]]),
    });
  }
  return out;
});

lazy(db, 'purchaseOrders', () => {
  const out = [];
  for (let i = 1; i <= 180; i++) {
    const r = makeRng('po' + i);
    const v = r.pick(db.vendors);
    const qty = r.int(5, 400);
    const rate = r.int(120, 9800);
    out.push({
      id: 'PO' + pad(i, 4),
      poNumber: `PO/26-27/${pad(i, 4)}`,
      vendorId: v.id,
      vendorName: v.name,
      campusId: r.pick(db.campuses).id,
      date: iso(r.date('2026-04-01', '2026-08-18')),
      expectedDate: iso(r.date('2026-08-20', '2026-10-15')),
      items: r.int(1, 6),
      quantity: qty,
      rate,
      subtotal: qty * rate,
      gst: 18,
      total: Math.round(qty * rate * 1.18),
      status: r.weighted([['Delivered', 42], ['Approved', 22], ['Pending Approval', 14], ['Partially Received', 12], ['Cancelled', 5], ['Draft', 5]]),
      grnReceived: r.bool(0.55),
      requestedBy: null,
      approvedBy: null,
      department: r.pick(DEPARTMENTS),
    });
  }
  return out;
});

lazy(db, 'budgets', () => {
  const heads = ['Salaries & Wages', 'Utilities', 'Transport Operations', 'Maintenance & Repairs', 'Academic Supplies',
    'Marketing & Admissions', 'Administrative Overheads', 'IT & Infrastructure', 'Staff Training', 'Events & Activities'];
  return heads.map((h, i) => {
    const r = makeRng('bud' + i);
    const allocated = r.int(4000000, 62000000);
    const spent = Math.round(allocated * r.float(0.28, 1.08));
    return {
      id: 'BUD' + pad(i + 1, 2),
      head: h,
      academicYearId: 'AY2026',
      campusId: 'C1',
      allocated,
      spent,
      committed: Math.round(allocated * r.float(0.02, 0.15)),
      remaining: allocated - spent,
      utilisation: round((spent / allocated) * 100, 1),
      status: spent > allocated ? 'Over Budget' : spent / allocated > 0.85 ? 'At Risk' : 'On Track',
      owner: r.pick(DEPARTMENTS),
    };
  });
});

/* -------------------------------------------------------------- library */

const BOOK_TOPICS = ['Mathematics','Physics','Chemistry','Biology','Computer Science','History','Geography','Economics',
  'English Literature','Hindi Sahitya','Sanskrit','Fiction','Non-Fiction','Biography','Encyclopedia','Reference',
  'Competitive Exams','Comics & Graphic Novels','Environmental Science','Psychology','Political Science','Art & Design',
  'Sports','Music','Business Studies','Accountancy'];
const BOOK_TITLE_A = ['The Silent','A Brief History of','Understanding','Foundations of','Advanced','Introduction to','The Art of',
  'Tales from','Beyond the','Mastering','The Complete','Essential','Modern','Exploring','Principles of','The Little Book of',
  'Journeys through','Secrets of','The Practical Guide to','Frontiers of'];
const BOOK_TITLE_B = ['Time','Numbers','the Universe','Ancient India','Molecules','Algorithms','the Monsoon','Democracy',
  'Poetry','Innovation','Ecology','Circuits','the Himalayas','Statistics','Grammar','Astronomy','the Indus Valley',
  'Machine Learning','Human Anatomy','Global Trade','Classical Music','Silicon','the Ocean','Freedom','Design'];
const PUBLISHERS = ['Oxford University Press','Penguin Random House India','S. Chand Publishing','NCERT','Arihant Publications',
  'HarperCollins India','Rupa Publications','McGraw Hill India','Pearson India','Cambridge University Press','Scholastic India',
  'Vikas Publishing','Bharati Bhawan','Westland Books','Tata McGraw Hill','Macmillan Education'];

lazy(db, 'authors', () => {
  const r = makeRng('authors');
  return r.times(180, (i) => {
    const rr = makeRng('auth' + i);
    const nm = makeName(rr, rr.bool() ? 'Male' : 'Female');
    return { id: 'AUT' + pad(i + 1, 3), name: nm.full, nationality: rr.weighted([['Indian', 72], ['British', 10], ['American', 12], ['Other', 6]]), titles: rr.int(1, 24) };
  });
});

lazy(db, 'publishers', () => PUBLISHERS.map((name, i) => {
  const r = makeRng('pub' + i);
  return { id: 'PUB' + pad(i + 1, 2), name, city: r.pick(['New Delhi', 'Mumbai', 'Chennai', 'Kolkata', 'Bengaluru']), titles: r.int(60, 1400), contact: phone(r) };
}));

/** Catalogue size. Named so the KPI strip can quote it without materialising
 *  12,000 book records on first paint. */
export const BOOK_COUNT = 12000;

lazy(db, 'books', () => {
  const out = new Array(BOOK_COUNT);
  for (let i = 0; i < BOOK_COUNT; i++) {
    const r = makeRng('bk' + i);
    const topic = BOOK_TOPICS[i % BOOK_TOPICS.length];
    const title = `${BOOK_TITLE_A[i % BOOK_TITLE_A.length]} ${BOOK_TITLE_B[(i * 7) % BOOK_TITLE_B.length]}`;
    const copies = r.weighted([[1, 34], [2, 26], [3, 18], [4, 12], [6, 7], [10, 3]]);
    const issued = Math.min(copies, r.weighted([[0, 62], [1, 24], [2, 9], [3, 5]]));
    out[i] = {
      id: 'BK' + pad(i + 1, 5),
      accessionNo: `ACC-${pad(i + 1, 6)}`,
      isbn: `978-${r.int(0, 9)}-${r.int(1000, 9999)}-${r.int(1000, 9999)}-${r.int(0, 9)}`,
      title: `${title}${r.bool(0.25) ? ' — Vol. ' + r.int(1, 4) : ''}`,
      authorId: 'AUT' + pad((i % 180) + 1, 3),
      author: null,
      publisherId: 'PUB' + pad((i % PUBLISHERS.length) + 1, 2),
      publisher: PUBLISHERS[i % PUBLISHERS.length],
      category: topic,
      subCategory: r.pick(['Textbook', 'Reference', 'Supplementary', 'Journal', 'Magazine']),
      language: r.weighted([['English', 78], ['Hindi', 16], ['Sanskrit', 3], ['French', 3]]),
      edition: `${r.int(1, 9)}${['st', 'nd', 'rd'][r.int(0, 2)] || 'th'} Edition`,
      year: r.int(2004, 2026),
      pages: r.int(84, 940),
      price: r.int(120, 3200),
      rackNo: `R${r.int(1, 40)}-${r.pick(['A', 'B', 'C', 'D'])}${r.int(1, 8)}`,
      campusId: db.campuses[i % 5].id,
      totalCopies: copies,
      issuedCopies: issued,
      availableCopies: copies - issued,
      status: copies - issued > 0 ? 'Available' : 'All Issued',
      condition: r.weighted([['Good', 78], ['Fair', 16], ['Damaged', 4], ['Lost', 2]]),
      addedOn: iso(r.date('2016-01-01', '2026-08-01')),
      timesIssued: r.int(0, 96),
      digital: r.bool(0.14),
    };
  }
  const authorsById = indexBy(db.authors);
  for (const b of out) b.author = (authorsById.get(b.authorId) || { name: 'Unknown' }).name;
  return out;
});

lazy(db, 'bookIssues', () => {
  const out = [];
  let n = 0;
  const students = db.students.filter((s) => s.booksIssued > 0);
  for (const s of students) {
    const r = makeRng('iss' + s.id);
    for (let i = 0; i < s.booksIssued; i++) {
      n++;
      const bk = db.books[(hashString(s.id) + i * 97) % db.books.length];
      // School reopened after the summer vacation on 17 June.
      const issueDate = r.date('2026-06-18', '2026-08-19');
      const dueDate = addDays(issueDate, 14);
      const overdue = dueDate < new Date(DEMO_TODAY);
      // A book can only have come back on or before today.
      const returnedOn = addDays(dueDate, r.int(-8, 4));
      const returned = r.bool(0.45) && returnedOn <= new Date(DEMO_TODAY);
      out.push({
        id: 'ISS' + pad(n, 5),
        bookId: bk.id,
        bookTitle: bk.title,
        accessionNo: bk.accessionNo,
        memberId: s.libraryCardNo,
        memberType: 'Student',
        memberName: s.name,
        studentId: s.id,
        className: s.className,
        section: s.section,
        campusId: s.campusId,
        issueDate: iso(issueDate),
        dueDate: iso(dueDate),
        returnDate: returned ? iso(returnedOn) : null,
        status: returned ? 'Returned' : overdue ? 'Overdue' : 'Issued',
        renewals: r.weighted([[0, 74], [1, 20], [2, 6]]),
        fine: !returned && overdue ? Math.round((new Date(DEMO_TODAY) - dueDate) / 86400000) * 2 : 0,
        finePaid: false,
        issuedBy: null,
      });
    }
  }
  return out;
});

lazy(db, 'libraryMembers', () => {
  const out = [];
  for (const s of db.students.filter((x) => x.status === 'Active').slice(0, 1400)) {
    const r = makeRng('lm' + s.id);
    out.push({
      id: s.libraryCardNo,
      memberType: 'Student',
      name: s.name,
      refId: s.id,
      className: s.className,
      section: s.section,
      campusId: s.campusId,
      joinDate: s.admissionDate,
      maxBooks: s.classLevel >= 11 ? 4 : 2,
      currentIssued: s.booksIssued,
      totalIssued: r.int(0, 46),
      fineOutstanding: r.weighted([[0, 82], [20, 8], [50, 6], [120, 4]]),
      status: r.weighted([['Active', 94], ['Suspended', 3], ['Expired', 3]]),
    });
  }
  for (const st of db.staff.slice(0, 220)) {
    const r = makeRng('lms' + st.id);
    out.push({
      id: 'LIBS' + st.id,
      memberType: 'Staff',
      name: st.name,
      refId: st.id,
      className: st.department,
      section: '—',
      campusId: st.campusId,
      joinDate: st.joiningDate,
      maxBooks: 6,
      currentIssued: r.int(0, 4),
      totalIssued: r.int(0, 120),
      fineOutstanding: r.weighted([[0, 90], [40, 6], [90, 4]]),
      status: 'Active',
    });
  }
  return out;
});

/* ------------------------------------------------------------ transport */

lazy(db, 'vehicles', () => {
  const out = [];
  for (let i = 1; i <= 42; i++) {
    const r = makeRng('veh' + i);
    const campus = db.campuses[i % 5];
    const capacity = r.pick([32, 40, 45, 52, 56]);
    const onboard = Math.round(capacity * r.float(0.55, 0.98));
    out.push({
      id: 'VEH' + pad(i, 3),
      regNo: `${r.pick(['HR26', 'UP16', 'KA05', 'MH12', 'TS09'])} ${r.pick(['AB', 'BC', 'CD', 'DE'])} ${r.int(1000, 9999)}`,
      model: r.pick(['Tata Starbus 40', 'Ashok Leyland Lynx', 'Eicher Skyline Pro', 'Force Traveller 26', 'Mahindra Cruzio']),
      type: capacity <= 32 ? 'Mini Bus' : 'School Bus',
      capacity,
      onboard,
      utilisation: round((onboard / capacity) * 100, 1),
      campusId: campus.id,
      routeId: 'RTE' + pad(((i - 1) % 28) + 1, 3),
      driverId: 'DRV' + pad(i, 3),
      conductorId: 'CND' + pad(i, 3),
      gpsDeviceId: `GPS${r.int(10000, 99999)}`,
      fuelType: r.weighted([['Diesel', 74], ['CNG', 22], ['Electric', 4]]),
      mileage: round(r.float(4.2, 8.6), 1),
      odometer: r.int(48000, 340000),
      insuranceExpiry: iso(r.date('2026-09-01', '2027-08-01')),
      pucExpiry: iso(r.date('2026-08-25', '2027-02-01')),
      fitnessExpiry: iso(r.date('2026-10-01', '2027-10-01')),
      permitExpiry: iso(r.date('2026-11-01', '2027-11-01')),
      lastService: iso(r.date('2026-05-01', '2026-08-10')),
      nextService: iso(r.date('2026-08-25', '2026-11-15')),
      status: r.weighted([['On Route', 62], ['Idle', 22], ['Maintenance', 12], ['Out of Service', 4]]),
      speed: r.int(0, 58),
      lastPing: '2026-08-20T07:5' + r.int(0, 9) + ':00',
      gpsLat: round(28.4 + r.float(-0.3, 0.3), 4),
      gpsLng: round(77.0 + r.float(-0.3, 0.3), 4),
    });
  }
  return out;
}, () => need('students'));

lazy(db, 'drivers', () => {
  const out = [];
  for (let i = 1; i <= 42; i++) {
    const r = makeRng('drv' + i);
    const nm = makeName(r, 'Male');
    out.push({
      id: 'DRV' + pad(i, 3),
      name: nm.full,
      role: 'Driver',
      campusId: db.campuses[i % 5].id,
      vehicleId: 'VEH' + pad(i, 3),
      licenceNo: `${r.pick(['HR', 'UP', 'KA', 'MH', 'TS'])}-${r.int(10, 99)}-${r.int(20050000000, 20259999999)}`,
      licenceExpiry: iso(r.date('2026-10-01', '2030-01-01')),
      badgeNo: `BDG${r.int(1000, 9999)}`,
      phone: phone(r),
      experienceYears: r.int(2, 26),
      bloodGroup: r.pick(BLOOD),
      address: makeAddress(r, db.campuses[i % 5].city),
      joiningDate: iso(r.date('2012-01-01', '2026-04-01')),
      policeVerified: r.bool(0.94),
      medicalCheckDate: iso(r.date('2026-01-01', '2026-08-01')),
      rating: round(r.float(3.4, 5), 1),
      incidents: r.weighted([[0, 82], [1, 12], [2, 6]]),
      status: r.weighted([['On Duty', 74], ['Off Duty', 20], ['On Leave', 6]]),
      avatarInitials: (nm.first[0] + nm.last[0]).toUpperCase(),
    });
  }
  for (let i = 1; i <= 42; i++) {
    const r = makeRng('cnd' + i);
    const nm = makeName(r, r.bool(0.7) ? 'Male' : 'Female');
    out.push({
      id: 'CND' + pad(i, 3),
      name: nm.full,
      role: 'Conductor',
      campusId: db.campuses[i % 5].id,
      vehicleId: 'VEH' + pad(i, 3),
      licenceNo: '—',
      licenceExpiry: null,
      badgeNo: `CBG${r.int(1000, 9999)}`,
      phone: phone(r),
      experienceYears: r.int(1, 14),
      bloodGroup: r.pick(BLOOD),
      address: makeAddress(r, db.campuses[i % 5].city),
      joiningDate: iso(r.date('2015-01-01', '2026-04-01')),
      policeVerified: r.bool(0.9),
      medicalCheckDate: iso(r.date('2026-01-01', '2026-08-01')),
      rating: round(r.float(3.2, 5), 1),
      incidents: 0,
      status: r.weighted([['On Duty', 76], ['Off Duty', 18], ['On Leave', 6]]),
      avatarInitials: (nm.first[0] + nm.last[0]).toUpperCase(),
    });
  }
  return out;
});

lazy(db, 'routes', () => {
  const names = ['Sector 42 — Golf Course','Sushant Lok Loop','DLF Phase 3 Express','South City Circuit','Sohna Road North',
    'Palam Vihar Line','Noida Sector 62 Link','Noida 15A Circuit','Sector 50 Express','Sector 137 Line','Whitefield Main',
    'Indiranagar Loop','Koramangala Express','HSR Layout Line','Sarjapur Circuit','Kothrud Line','Baner Express',
    'Viman Nagar Loop','Hinjewadi Link','Aundh Circuit','Gachibowli Main','Banjara Hills Loop','Jubilee Hills Line',
    'Kondapur Express','Madhapur Circuit','Vasant Kunj Link','Dwarka Express','Rohini Circuit'];
  return names.map((name, i) => {
    const r = makeRng('rte' + i);
    const campus = db.campuses[i % 5];
    const stops = r.int(6, 16);
    const students = r.int(18, 54);
    return {
      id: 'RTE' + pad(i + 1, 3),
      code: `R${pad(i + 1, 2)}`,
      name,
      campusId: campus.id,
      vehicleId: 'VEH' + pad(((i) % 42) + 1, 3),
      distanceKm: round(r.float(6.5, 32), 1),
      durationMin: r.int(22, 78),
      stopCount: stops,
      studentCount: students,
      capacity: r.pick([40, 45, 52]),
      pickupStart: `06:${pad(r.int(20, 55), 2)}`,
      dropStart: `14:${pad(r.int(25, 50), 2)}`,
      fare: r.pick([18000, 21000, 24000, 27000, 30000]),
      monthlyRevenue: students * r.pick([1800, 2100, 2400]),
      status: r.weighted([['Active', 90], ['Suspended', 6], ['Under Review', 4]]),
      shift: r.pick(['Morning + Evening', 'Morning Only']),
    };
  });
}, () => need('students'));

lazy(db, 'stops', () => {
  const out = [];
  let n = 0;
  for (const rt of db.routes) {
    const r = makeRng('stp' + rt.id);
    const campus = db.campuses.find((c) => c.id === rt.campusId);
    const areas = CITY_AREAS[campus.city] || ['Central'];
    for (let i = 0; i < rt.stopCount; i++) {
      n++;
      out.push({
        id: 'STP' + pad(n, 4),
        routeId: rt.id,
        routeName: rt.name,
        campusId: rt.campusId,
        seq: i + 1,
        name: `${r.pick(areas)} — ${r.pick(['Main Gate', 'Market', 'Crossing', 'Park', 'Metro Station', 'Society Gate', 'Petrol Pump'])}`,
        pickupTime: `06:${pad(20 + i * 3, 2)}`.slice(0, 5),
        dropTime: `14:${pad(25 + i * 3, 2)}`.slice(0, 5),
        studentCount: r.int(1, 9),
        landmark: r.pick(['Near HDFC ATM', 'Opposite Reliance Fresh', 'Beside community centre', 'Next to the temple', 'By the bus shelter']),
        lat: round(28.4 + r.float(-0.25, 0.25), 4),
        lng: round(77.0 + r.float(-0.25, 0.25), 4),
      });
    }
  }
  return out;
}, () => need('students'));

lazy(db, 'busAttendance', () => {
  const out = [];
  let n = 0;
  for (const rt of db.routes) {
    const r = makeRng('bat' + rt.id);
    for (let d = 0; d < 12; d++) {
      n++;
      const boarded = Math.max(0, rt.studentCount - r.int(0, 6));
      out.push({
        id: 'BAT' + pad(n, 5),
        date: iso(addDays('2026-08-05', d)),
        routeId: rt.id,
        routeName: rt.name,
        vehicleId: rt.vehicleId,
        campusId: rt.campusId,
        trip: r.pick(['Morning Pickup', 'Evening Drop']),
        expected: rt.studentCount,
        boarded,
        absent: rt.studentCount - boarded,
        percent: round((boarded / rt.studentCount) * 100, 1),
        markedBy: 'CND' + pad(((n) % 42) + 1, 3),
        delayMin: r.weighted([[0, 62], [5, 20], [10, 12], [20, 6]]),
      });
    }
  }
  return out;
});

lazy(db, 'fuelLogs', () => {
  const out = [];
  let n = 0;
  for (const v of db.vehicles) {
    const r = makeRng('fuel' + v.id);
    for (let i = 0; i < 8; i++) {
      n++;
      const litres = r.int(38, 96);
      const rate = round(r.float(88, 102), 2);
      out.push({
        id: 'FUL' + pad(n, 4),
        vehicleId: v.id,
        regNo: v.regNo,
        campusId: v.campusId,
        date: iso(addDays('2026-06-01', i * 10 + r.int(0, 4))),
        litres,
        rate,
        amount: Math.round(litres * rate),
        odometer: v.odometer - (8 - i) * r.int(400, 900),
        station: r.pick(['IOCL Sector 44', 'HP Sohna Road', 'BPCL Whitefield', 'Shell Baner', 'IOCL Gachibowli']),
        filledBy: v.driverId,
        mileage: round(r.float(4.0, 8.4), 1),
      });
    }
  }
  return out;
});

lazy(db, 'maintenanceLogs', () => {
  const out = [];
  let n = 0;
  for (const v of db.vehicles) {
    const r = makeRng('mnt' + v.id);
    for (let i = 0; i < 3; i++) {
      n++;
      out.push({
        id: 'MNT' + pad(n, 4),
        vehicleId: v.id,
        regNo: v.regNo,
        campusId: v.campusId,
        date: iso(addDays('2026-04-01', i * 45 + r.int(0, 20))),
        type: r.pick(['Routine Service', 'Brake Repair', 'Tyre Replacement', 'AC Service', 'Body Work', 'Engine Overhaul', 'Battery Replacement']),
        garage: r.pick(['Authorised Tata Service', 'City Auto Works', 'Speed Motors', 'Ashok Leyland Service Point']),
        cost: r.int(3200, 68000),
        downtimeDays: r.int(0, 4),
        odometer: v.odometer - (3 - i) * r.int(2000, 6000),
        status: r.weighted([['Completed', 82], ['In Progress', 12], ['Scheduled', 6]]),
        remarks: r.pick(['Replaced brake pads and topped up fluids.', 'General service, filters changed.', 'Two tyres replaced, alignment done.', 'AC gas refilled.']),
      });
    }
  }
  return out;
});

/* --------------------------------------------------------------- hostel */

lazy(db, 'hostels', () => {
  // `capacity` and `occupied` are reconciled against db.hostelRooms /
  // db.hostelAllocations further down, so the occupancy donut, the room grid
  // and the roll-call list can never disagree.
  const defs = [
    { id: 'HST1', name: 'Aravalli Boys Hostel', type: 'Boys', campusId: 'C3', floors: 3, rooms: 30, mess: 'Mess A', established: 2012 },
    { id: 'HST2', name: 'Nilgiri Girls Hostel', type: 'Girls', campusId: 'C3', floors: 3, rooms: 26, mess: 'Mess A', established: 2012 },
    { id: 'HST3', name: 'Shivalik Junior Hostel', type: 'Boys', campusId: 'C4', floors: 2, rooms: 24, mess: 'Mess B', established: 2016 },
    { id: 'HST4', name: 'Vindhya Girls Hostel', type: 'Girls', campusId: 'C4', floors: 2, rooms: 22, mess: 'Mess B', established: 2018 },
  ];
  const wardens = db.staff.filter((s) => s.designation === 'Hostel Warden');
  return defs.map((d, i) => {
    const w = wardens.filter((s) => s.campusId === d.campusId)[i % 2] || wardens[i % Math.max(1, wardens.length)];
    return {
      ...d,
      warden: w ? w.name : null,
      wardenId: w ? w.id : null,
      wardenPhone: w ? w.phone : null,
      capacity: 0,   // from db.hostelRooms
      occupied: 0,   // from db.hostelAllocations
      vacant: 0,
    };
  });
}, () => need('hostelRooms', 'hostelAllocations'));

lazy(db, 'hostelRooms', () => {
  const out = [];
  let n = 0;
  for (const h of db.hostels) {
    const r = makeRng('room' + h.id);
    for (let i = 1; i <= h.rooms; i++) {
      n++;
      const beds = r.pick([2, 3, 4, 4]);
      out.push({
        id: 'ROM' + pad(n, 4),
        hostelId: h.id,
        hostelName: h.name,
        campusId: h.campusId,
        roomNo: `${Math.ceil(i / 12)}${pad(((i - 1) % 12) + 1, 2)}`,
        floor: Math.ceil(i / 12),
        type: beds === 2 ? 'Double' : beds === 3 ? 'Triple' : 'Quad',
        beds,
        occupied: 0,             // filled by db.hostelAllocations
        vacant: beds,
        ac: r.bool(0.35),
        attachedBath: r.bool(0.6),
        status: 'Vacant',
        condition: r.weighted([['Good', 76], ['Needs Repair', 18], ['Under Maintenance', 6]]),
        monthlyFee: beds === 2 ? 18500 : beds === 3 ? 15200 : 12800,
      });
    }
    h.capacity = out.filter((rm) => rm.hostelId === h.id).reduce((a, rm) => a + rm.beds, 0);
    h.rooms = out.filter((rm) => rm.hostelId === h.id).length;
  }
  return out;
}, () => need('hostelAllocations'));

lazy(db, 'hostelAllocations', () => {
  const out = [];
  let n = 0;
  const boarders = db.students.filter((s) => s.hostelOpted && s.status === 'Active');
  for (const s of boarders) {
    const r = makeRng('hal' + s.id);
    // Boys and girls go to the right block, and a bed is only handed out if one
    // is genuinely free — so room occupancy, hostel occupancy and the roll-call
    // list are the same set of children counted three ways.
    const wing = s.gender === 'Female' ? 'Girls' : 'Boys';
    const blocks = db.hostels.filter((hh) => hh.campusId === s.campusId && hh.type === wing);
    const blockIds = new Set(blocks.map((hh) => hh.id));
    const pool = db.hostelRooms.filter((rm) => blockIds.has(rm.hostelId) && rm.vacant > 0);
    if (!pool.length) { s.hostelOpted = false; continue; } // no bed free — day scholar
    const room = pool[hashString(s.id) % pool.length];
    room.occupied += 1;
    room.vacant = room.beds - room.occupied;
    room.status = room.occupied === 0 ? 'Vacant' : room.occupied === room.beds ? 'Full' : 'Partially Occupied';
    n++;
    s.hostelId = room.hostelId;
    s.hostelName = room.hostelName;
    s.roomNo = room.roomNo;
    out.push({
      id: 'HAL' + pad(n, 4),
      studentId: s.id,
      studentName: s.name,
      className: s.className,
      section: s.section,
      campusId: s.campusId,
      hostelId: room.hostelId,
      hostelName: room.hostelName,
      roomId: room.id,
      roomNo: room.roomNo,
      bedNo: `B${Math.min(room.beds, room.occupied)}`,
      allocatedOn: iso(r.date('2026-04-01', '2026-07-15')),
      vacatedOn: null,
      status: r.weighted([['Active', 92], ['Vacated', 5], ['Transfer Requested', 3]]),
      monthlyFee: room.monthlyFee,
      messPlan: r.pick(['Full Board', 'Veg Only', 'Jain Meal', 'Special Diet']),
      localGuardian: `${r.pick(FIRST_M)} ${s.lastName}`,
      localGuardianPhone: phone(r),
    });
  }
  for (const hh of db.hostels) {
    hh.occupied = out.filter((a) => a.hostelId === hh.id && a.status !== 'Vacated').length;
    hh.vacant = hh.capacity - hh.occupied;
  }
  return out;
});

lazy(db, 'messMenu', () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const out = [];
  days.forEach((day, i) => {
    const r = makeRng('mess' + i);
    out.push({
      id: 'MNU' + (i + 1),
      day,
      breakfast: r.pick(['Poha, Banana, Milk', 'Idli Sambar, Chutney', 'Aloo Paratha, Curd', 'Upma, Boiled Egg', 'Bread Butter Jam, Cornflakes', 'Chole Bhature', 'Dosa, Coconut Chutney']),
      lunch: r.pick(['Rajma Chawal, Salad, Roti', 'Dal Tadka, Jeera Rice, Bhindi', 'Chole, Rice, Roti, Papad', 'Kadhi Pakoda, Rice, Roti', 'Paneer Butter Masala, Naan', 'Sambar Rice, Poriyal', 'Veg Pulao, Raita']),
      snacks: r.pick(['Samosa, Tea', 'Bread Pakoda, Milk', 'Biscuits, Milkshake', 'Sandwich, Juice', 'Vada Pav, Tea', 'Fruit Chaat']),
      dinner: r.pick(['Mix Veg, Dal, Roti, Rice', 'Paneer Bhurji, Roti, Rice', 'Aloo Gobhi, Dal Fry, Roti', 'Veg Biryani, Raita', 'Palak Paneer, Roti, Rice', 'Kofta Curry, Rice, Roti']),
      special: i === 6 ? 'Sunday Special — Gulab Jamun' : null,
      calories: r.int(2100, 2800),
    });
  });
  return out;
});

/* ------------------------------------------------------------ inventory */

lazy(db, 'itemCategories', () => ([
  { id: 'ICT1', name: 'Stationery' }, { id: 'ICT2', name: 'Furniture' },
  { id: 'ICT3', name: 'Laboratory' }, { id: 'ICT4', name: 'Sports Equipment' },
  { id: 'ICT5', name: 'IT Hardware' }, { id: 'ICT6', name: 'Housekeeping' },
  { id: 'ICT7', name: 'Medical Supplies' }, { id: 'ICT8', name: 'Uniforms & Merchandise' },
  { id: 'ICT9', name: 'Electrical' }, { id: 'ICT10', name: 'Kitchen & Mess' },
  // `items` and `value` are filled from db.inventoryItems — the hand-written
  // figures claimed 591 SKUs against a store that holds 57.
].map((c) => ({ ...c, items: 0, value: 0 }))), () => need('inventoryItems'));

lazy(db, 'inventoryItems', () => {
  const names = {
    Stationery: ['A4 Ream 500 sheets', 'Whiteboard Marker', 'Chalk Box', 'Register 200 pages', 'Stapler', 'Highlighter Set', 'Attendance Register', 'File Folder'],
    Furniture: ['Student Desk', 'Teacher Chair', 'Steel Almirah', 'Lab Stool', 'Notice Board', 'Bench 3-seater'],
    Laboratory: ['Microscope', 'Test Tube Rack', 'Bunsen Burner', 'Beaker 500ml', 'Digital Balance', 'Chemical Reagent Set'],
    'Sports Equipment': ['Basketball', 'Cricket Kit', 'Badminton Racquet', 'Football', 'Table Tennis Set', 'Yoga Mat'],
    'IT Hardware': ['Desktop Computer', 'Projector', 'Interactive Panel', 'Network Switch', 'Laser Printer', 'UPS 1KVA'],
    Housekeeping: ['Floor Cleaner 5L', 'Broom', 'Dustbin 40L', 'Hand Wash 5L', 'Mop Set'],
    'Medical Supplies': ['First Aid Kit', 'Digital Thermometer', 'Bandage Roll', 'Antiseptic 500ml', 'Nebuliser'],
    'Uniforms & Merchandise': ['House T-Shirt', 'School Tie', 'ID Card Lanyard', 'School Diary', 'Blazer'],
    Electrical: ['LED Tube Light', 'Ceiling Fan', 'Extension Board', 'MCB 32A', 'Wall Socket'],
    'Kitchen & Mess': ['Steel Thali', 'Cooking Pot 50L', 'Gas Cylinder', 'Water Dispenser', 'Serving Spoon Set'],
  };
  const out = [];
  let n = 0;
  for (const cat of db.itemCategories) {
    const list = names[cat.name] || ['Generic Item'];
    for (let i = 0; i < list.length; i++) {
      n++;
      const r = makeRng('inv' + n);
      const stock = r.int(0, 420);
      const reorder = r.int(20, 80);
      out.push({
        id: 'ITM' + pad(n, 4),
        code: `SKU-${pad(n, 5)}`,
        name: list[i],
        categoryId: cat.id,
        category: cat.name,
        unit: r.pick(['Piece', 'Box', 'Ream', 'Set', 'Litre', 'Kg']),
        stock,
        reorderLevel: reorder,
        unitPrice: r.int(45, 68000),
        value: 0,
        campusId: db.campuses[n % 5].id,
        store: r.pick(['Main Store', 'Lab Store', 'Sports Store', 'IT Store', 'Kitchen Store']),
        vendorId: r.pick(db.vendors).id,
        status: stock === 0 ? 'Out of Stock' : stock < reorder ? 'Low Stock' : 'In Stock',
        lastPurchase: iso(r.date('2026-04-01', '2026-08-12')),
        consumable: !['Furniture', 'IT Hardware'].includes(cat.name),
      });
    }
  }
  for (const it of out) it.value = it.stock * it.unitPrice;
  for (const cat of db.itemCategories) {
    const rows = out.filter((it) => it.categoryId === cat.id);
    cat.items = rows.length;
    cat.value = rows.reduce((a, it) => a + it.value, 0);
    cat.lowStock = rows.filter((it) => it.status !== 'In Stock').length;
  }
  return out;
});

lazy(db, 'stockMovements', () => {
  const out = [];
  let n = 0;
  for (const it of db.inventoryItems) {
    const r = makeRng('stk' + it.id);
    for (let i = 0; i < 4; i++) {
      n++;
      const type = r.weighted([['Stock In', 40], ['Issue', 46], ['Return', 8], ['Damage', 6]]);
      out.push({
        id: 'STK' + pad(n, 5),
        itemId: it.id,
        itemName: it.name,
        category: it.category,
        campusId: it.campusId,
        date: iso(addDays('2026-05-01', i * 25 + r.int(0, 12))),
        type,
        quantity: r.int(1, 60),
        issuedTo: type === 'Issue' ? r.pick(DEPARTMENTS) : null,
        reference: type === 'Stock In' ? `PO/26-27/${pad(r.int(1, 180), 4)}` : `REQ/${pad(n, 4)}`,
        handledBy: null,
        remarks: type === 'Damage' ? r.pick(['Broken in transit', 'Water damage', 'Expired']) : '',
      });
    }
  }
  return out;
});

lazy(db, 'assets', () => {
  const out = [];
  const types = ['Desktop Computer', 'Projector', 'Interactive Panel', 'Air Conditioner', 'Photocopier', 'Water Purifier',
    'Generator', 'CCTV Camera', 'Laboratory Equipment', 'School Bus', 'Furniture Set', 'Server'];
  for (let i = 1; i <= 420; i++) {
    const r = makeRng('ast' + i);
    const purchase = r.date('2017-01-01', '2026-06-01');
    const cost = r.int(18000, 1800000);
    const ageYears = round((new Date('2026-08-20') - purchase) / (365.25 * 86400000), 1);
    const rate = 15;
    const wdv = Math.round(cost * Math.pow(1 - rate / 100, ageYears));
    out.push({
      id: 'AST' + pad(i, 4),
      tag: `SPD-AST-${pad(i, 4)}`,
      name: r.pick(types),
      category: r.pick(['IT Hardware', 'Furniture', 'Laboratory', 'Transport', 'Electrical', 'Security']),
      campusId: db.campuses[i % 5].id,
      location: r.pick(['Block A — Room 12', 'Computer Lab 1', 'Physics Lab', 'Admin Office', 'Library', 'Staff Room', 'Auditorium', 'Transport Yard']),
      assignedTo: r.bool(0.6) ? r.pick(db.staff).name : null,
      purchaseDate: iso(purchase),
      purchaseCost: cost,
      vendorId: r.pick(db.vendors).id,
      warrantyExpiry: iso(addDays(purchase, 365 * r.int(1, 5))),
      depreciationRate: rate,
      ageYears,
      currentValue: wdv,
      condition: r.weighted([['Excellent', 22], ['Good', 48], ['Fair', 22], ['Poor', 6], ['Scrapped', 2]]),
      status: r.weighted([['In Use', 78], ['In Store', 10], ['Under Repair', 8], ['Disposed', 4]]),
      lastAudit: iso(r.date('2026-03-01', '2026-08-01')),
      amc: r.bool(0.42),
    });
  }
  return out;
});

/* ------------------------------------------------------------------ LMS */

lazy(db, 'courses', () => {
  const out = [];
  let n = 0;
  for (const cls of db.classes.filter((c) => c.campusId === 'C1' && c.level >= 5)) {
    for (const code of subjectsForLevel(cls.level)) {
      n++;
      const r = makeRng('crs' + n);
      const teacher = db.staff.filter((s) => s.type === 'Teaching' && s.campusId === 'C1')[n % 60];
      out.push({
        id: 'CRS' + pad(n, 4),
        title: `${(SUBJECT_DEFS.find((s) => s.code === code) || {}).name} — ${cls.name}`,
        subjectCode: code,
        classId: cls.id,
        className: cls.name,
        classLevel: cls.level,
        campusId: 'C1',
        teacherId: teacher ? teacher.id : null,
        teacherName: teacher ? teacher.name : '—',
        chapters: r.int(6, 16),
        lessons: r.int(18, 64),
        resources: r.int(4, 38),
        durationHours: r.int(24, 96),
        enrolled: r.int(24, 42),
        completionPct: r.int(18, 96),
        rating: round(r.float(3.6, 5), 1),
        status: r.weighted([['Published', 78], ['Draft', 14], ['Archived', 8]]),
        updatedAt: iso(r.date('2026-06-01', '2026-08-19')),
      });
    }
  }
  return out;
});

lazy(db, 'lessons', () => {
  const out = [];
  let n = 0;
  for (const c of db.courses.slice(0, 220)) {
    const r = makeRng('les' + c.id);
    for (let i = 1; i <= Math.min(c.chapters, 10); i++) {
      n++;
      out.push({
        id: 'LSN' + pad(n, 5),
        courseId: c.id,
        courseTitle: c.title,
        chapter: `Chapter ${i}`,
        title: `${c.subjectCode} — Topic ${i}: ${r.pick(['Introduction', 'Core Concepts', 'Worked Examples', 'Practice Set', 'Revision', 'Application', 'Case Study'])}`,
        type: r.weighted([['Video', 38], ['PDF Notes', 30], ['Presentation', 16], ['Worksheet', 10], ['Quiz', 6]]),
        durationMin: r.int(8, 55),
        sizeMb: round(r.float(0.4, 220), 1),
        views: r.int(0, 420),
        uploadedBy: c.teacherName,
        uploadedOn: iso(r.date('2026-04-10', '2026-08-18')),
        status: r.weighted([['Approved', 82], ['Pending Approval', 12], ['Rejected', 6]]),
        campusId: 'C1',
      });
    }
  }
  return out;
});

lazy(db, 'homework', () => {
  const out = [];
  let n = 0;
  const teacherFor = new Map();
  for (const slot of db.timetableSlots) {
    const key = slot.sectionId + '|' + slot.subjectCode;
    if (!teacherFor.has(key) && slot.teacherId) teacherFor.set(key, { id: slot.teacherId, name: slot.teacherName });
  }
  for (const sec of db.sections.filter((s) => s.campusId === 'C1').slice(0, 60)) {
    const cls = db.classes.find((c) => c.id === sec.classId);
    const r = makeRng('hw' + sec.id);
    const subs = subjectsForLevel(cls.level, sec.stream);
    const total = db.students.filter((s) => s.sectionId === sec.id && s.status === 'Active').length;
    if (!total) continue;
    for (let i = 0; i < 8; i++) {
      n++;
      const assigned = addDays('2026-08-01', i * 2 + r.int(0, 1));
      const due = addDays(assigned, r.int(1, 5));
      const submitted = r.int(Math.round(total * 0.5), total);
      out.push({
        id: 'HW' + pad(n, 5),
        title: `${(SUBJECT_DEFS.find((x) => x.code === subs[i % subs.length]) || {}).name} — ${r.pick(['Exercise 4.2', 'Worksheet 3', 'Chapter Summary', 'Practice Problems', 'Reading Response', 'Lab Record'])}`,
        subjectCode: subs[i % subs.length],
        subjectName: (SUBJECT_DEFS.find((x) => x.code === subs[i % subs.length]) || {}).name,
        classId: sec.classId,
        className: cls.name,
        sectionId: sec.id,
        section: sec.name,
        campusId: 'C1',
        // Set by the subject teacher on the timetable, not the class teacher.
        teacherId: (teacherFor.get(sec.id + '|' + subs[i % subs.length]) || {}).id || sec.classTeacherId,
        teacherName: (teacherFor.get(sec.id + '|' + subs[i % subs.length]) || {}).name
          || (byId(db.staff, sec.classTeacherId) || {}).name || 'Class teacher',
        assignedDate: iso(assigned),
        dueDate: iso(due),
        totalStudents: total,
        submitted,
        pending: total - submitted,
        graded: Math.round(submitted * r.float(0.3, 1)),
        maxMarks: r.pick([10, 20, 25]),
        avgScore: round(r.float(6.4, 9.2), 1),
        status: due < new Date('2026-08-20') ? 'Closed' : 'Open',
        attachments: r.int(0, 3),
        description: 'Complete the assigned exercises neatly in the subject notebook and submit before the due date.',
      });
    }
  }
  return out;
});

lazy(db, 'submissions', () => {
  const out = [];
  let n = 0;
  for (const hw of db.homework.slice(0, 200)) {
    const r = makeRng('sbm' + hw.id);
    const students = db.students.filter((s) => s.sectionId === hw.sectionId).slice(0, 12);
    for (const s of students) {
      n++;
      const submitted = r.bool(0.82);
      out.push({
        id: 'SBM' + pad(n, 5),
        homeworkId: hw.id,
        homeworkTitle: hw.title,
        studentId: s.id,
        studentName: s.name,
        className: s.className,
        section: s.section,
        campusId: s.campusId,
        submittedOn: submitted ? iso(addDays(new Date(hw.assignedDate), r.int(1, 4))) : null,
        status: submitted ? (r.bool(0.7) ? 'Graded' : 'Submitted') : (new Date(hw.dueDate) < new Date('2026-08-20') ? 'Missed' : 'Pending'),
        marks: submitted ? r.int(Math.round(hw.maxMarks * 0.4), hw.maxMarks) : null,
        maxMarks: hw.maxMarks,
        late: submitted && r.bool(0.14),
        feedback: submitted ? r.pick(['Well presented.', 'Good effort, revise question 4.', 'Excellent work!', 'Improve neatness.', 'Show all steps clearly.']) : null,
        attachment: submitted ? 'submission.pdf' : null,
      });
    }
  }
  return out;
});

lazy(db, 'onlineClasses', () => {
  const out = [];
  for (let i = 1; i <= 120; i++) {
    const r = makeRng('oc' + i);
    const c = db.courses[i % db.courses.length];
    const start = r.date('2026-08-01', '2026-09-10');
    out.push({
      id: 'OCL' + pad(i, 4),
      title: `${c.subjectCode} Live — ${r.pick(['Doubt Session', 'Revision Class', 'New Chapter', 'Problem Solving'])}`,
      courseId: c.id,
      className: c.className,
      subjectName: c.title.split(' — ')[0],
      teacherId: c.teacherId,
      teacherName: c.teacherName,
      campusId: 'C1',
      date: iso(start),
      startTime: `${pad(r.int(9, 16), 2)}:00`,
      durationMin: r.pick([40, 45, 60]),
      platform: r.pick(['Zoom', 'Google Meet', 'MS Teams', 'In-app']),
      joinLink: '#',
      enrolled: r.int(24, 42),
      attended: r.int(12, 42),
      recordingAvailable: r.bool(0.55),
      status: start < new Date('2026-08-20') ? 'Completed' : r.weighted([['Scheduled', 80], ['Cancelled', 20]]),
    });
  }
  return out;
});

lazy(db, 'onlineTests', () => {
  const out = [];
  for (let i = 1; i <= 90; i++) {
    const r = makeRng('ot' + i);
    const c = db.courses[i % db.courses.length];
    out.push({
      id: 'OTS' + pad(i, 4),
      title: `${c.subjectCode} Online Test ${i}`,
      courseId: c.id,
      className: c.className,
      campusId: 'C1',
      questions: r.int(10, 50),
      totalMarks: r.pick([20, 25, 50, 100]),
      durationMin: r.pick([20, 30, 45, 60]),
      scheduledOn: iso(r.date('2026-08-01', '2026-09-15')),
      attempted: r.int(0, 42),
      totalStudents: r.int(28, 42),
      avgScore: round(r.float(48, 88), 1),
      passPct: round(r.float(62, 98), 1),
      negativeMarking: r.bool(0.3),
      shuffleQuestions: r.bool(0.7),
      status: r.weighted([['Published', 54], ['Draft', 18], ['Completed', 28]]),
      createdBy: c.teacherName,
    });
  }
  return out;
});

lazy(db, 'doubts', () => {
  const out = [];
  for (let i = 1; i <= 140; i++) {
    const r = makeRng('dbt' + i);
    const s = db.students[i * 13 % db.students.length];
    out.push({
      id: 'DBT' + pad(i, 4),
      studentId: s.id,
      studentName: s.name,
      className: s.className,
      campusId: s.campusId,
      subject: r.pick(SUBJECT_DEFS).name,
      question: r.pick(['Could you explain the difference between the two formulas?', 'I am stuck on question 12 of the worksheet.',
        'Why does the reaction need a catalyst here?', 'Can you share more examples for this topic?', 'How do we derive this step?']),
      askedOn: iso(r.date('2026-07-20', '2026-08-19')),
      answeredBy: r.bool(0.72) ? r.pick(db.staff.filter((x) => x.type === 'Teaching')).name : null,
      status: r.weighted([['Answered', 68], ['Open', 24], ['Escalated', 8]]),
      upvotes: r.int(0, 24),
      replies: r.int(0, 8),
    });
  }
  return out;
});

/* ------------------------------------------------------- communication */

lazy(db, 'messages', () => {
  const out = [];
  const channels = [['SMS', 34], ['Email', 30], ['WhatsApp', 22], ['Push Notification', 10], ['In-App', 4]];
  for (let i = 1; i <= 420; i++) {
    const r = makeRng('msg' + i);
    const ch = r.weighted(channels);
    const recipients = r.int(28, 2400);
    const delivered = Math.round(recipients * r.float(0.86, 1));
    out.push({
      id: 'MSG' + pad(i, 4),
      subject: r.pick(['Half-Yearly Exam Datesheet', 'Fee Reminder — Q2', 'PTM Scheduled for Saturday', 'Holiday Notice — Independence Day',
        'Bus Route Change — Route R12', 'Annual Day Rehearsal Schedule', 'Vaccination Drive Consent', 'Result Declaration Notice',
        'Library Book Return Reminder', 'Sports Day Participation Form']),
      body: 'Dear Parent, please take note of the details shared in this communication. For any queries contact the school front office.',
      channel: ch,
      audience: r.pick(['All Parents', 'Class X Parents', 'All Staff', 'Teaching Staff', 'Hostel Boarders', 'Transport Users', 'Defaulters', 'Selected Students']),
      recipients,
      delivered,
      failed: recipients - delivered,
      opened: Math.round(delivered * r.float(0.4, 0.94)),
      sentBy: null,
      sentOn: iso(r.date('2026-04-05', '2026-08-19')) + `T${pad(r.int(8, 18), 2)}:${pad(r.int(0, 59), 2)}:00`,
      status: r.weighted([['Sent', 84], ['Scheduled', 8], ['Draft', 5], ['Failed', 3]]),
      campusId: r.pick(db.campuses).id,
      cost: ch === 'SMS' ? round(recipients * 0.18, 2) : 0,
    });
  }
  return out;
});

lazy(db, 'circulars', () => {
  const out = [];
  for (let i = 1; i <= 86; i++) {
    const r = makeRng('cir' + i);
    out.push({
      id: 'CIR' + pad(i, 3),
      circularNo: `SPD/CIR/2026-27/${pad(i, 3)}`,
      title: r.pick(['Revised School Timings from September', 'Guidelines for Annual Day Participation', 'Fee Payment Schedule 2026-27',
        'Safety Protocol for School Transport', 'Summer Vacation Homework', 'Uniform Policy Reminder', 'Parent-Teacher Meeting Circular',
        'Board Exam Preparation Plan', 'Anti-Bullying Policy', 'Digital Device Usage Policy']),
      category: r.pick(['Academic', 'Administrative', 'Transport', 'Examination', 'Event', 'Policy', 'Fee']),
      audience: r.pick(['All Parents', 'All Staff', 'Students', 'Class IX-XII', 'Pre-Primary Parents']),
      issuedBy: 'Principal',
      issuedOn: iso(r.date('2026-04-05', '2026-08-18')),
      validTill: iso(r.date('2026-09-01', '2027-03-31')),
      attachment: r.bool(0.65) ? 'circular.pdf' : null,
      views: r.int(120, 2400),
      acknowledged: r.int(80, 2200),
      priority: r.weighted([['Normal', 68], ['High', 24], ['Urgent', 8]]),
      status: r.weighted([['Published', 88], ['Draft', 8], ['Archived', 4]]),
      campusId: r.pick(db.campuses).id,
    });
  }
  return out;
});

lazy(db, 'notices', () => db.circulars.slice(0, 30).map((c, i) => ({
  id: 'NTC' + pad(i + 1, 3),
  title: c.title,
  body: 'Please refer to the attached document for complete details.',
  postedOn: c.issuedOn,
  expiresOn: c.validTill,
  audience: c.audience,
  pinned: i < 3,
  campusId: c.campusId,
  postedBy: 'Principal',
  category: c.category,
})));

lazy(db, 'templates', () => ([
  { id: 'TPL01', name: 'Fee Due Reminder', channel: 'SMS', body: 'Dear Parent, fee of Rs {amount} for {student} is due on {date}. Please pay to avoid late charges. - Springdale', variables: ['amount', 'student', 'date'], usage: 1842, approved: true, dltId: 'DLT10023' },
  { id: 'TPL02', name: 'Absent Alert', channel: 'SMS', body: 'Dear Parent, {student} of {class} was marked absent today ({date}). - Springdale', variables: ['student', 'class', 'date'], usage: 3260, approved: true, dltId: 'DLT10024' },
  { id: 'TPL03', name: 'Exam Result Published', channel: 'Email', body: 'The result for {exam} has been published on the parent portal.', variables: ['exam'], usage: 640, approved: true, dltId: null },
  { id: 'TPL04', name: 'PTM Invitation', channel: 'WhatsApp', body: 'PTM for {class} is scheduled on {date} at {time}. Slot: {slot}.', variables: ['class', 'date', 'time', 'slot'], usage: 1180, approved: true, dltId: 'DLT10041' },
  { id: 'TPL05', name: 'Bus Delay Notice', channel: 'Push Notification', body: 'Route {route} is running {minutes} minutes late today.', variables: ['route', 'minutes'], usage: 214, approved: true, dltId: null },
  { id: 'TPL06', name: 'Library Overdue', channel: 'SMS', body: '{student} has an overdue book "{title}". Fine: Rs {fine}.', variables: ['student', 'title', 'fine'], usage: 486, approved: true, dltId: 'DLT10055' },
  { id: 'TPL07', name: 'Admission Offer', channel: 'Email', body: 'Congratulations! {student} has been offered admission to {class}.', variables: ['student', 'class'], usage: 312, approved: true, dltId: null },
  { id: 'TPL08', name: 'Emergency Alert', channel: 'SMS', body: 'URGENT: {message}. Please follow school instructions.', variables: ['message'], usage: 12, approved: true, dltId: 'DLT10099' },
]));

/* ------------------------------------------------------------------ PTM */

lazy(db, 'ptmSchedules', () => ([
  { id: 'PTM1', title: 'PTM — Term 1 (Class I-V)', date: '2026-08-22', from: '09:00', to: '13:00', classes: 'I - V', campusId: 'C1', slotMinutes: 10, teachers: 42, booked: 386, capacity: 504, status: 'Open' },
  { id: 'PTM2', title: 'PTM — Term 1 (Class VI-VIII)', date: '2026-08-29', from: '09:00', to: '13:00', classes: 'VI - VIII', campusId: 'C1', slotMinutes: 10, teachers: 36, booked: 298, capacity: 432, status: 'Open' },
  { id: 'PTM3', title: 'PTM — Term 1 (Class IX-XII)', date: '2026-09-05', from: '08:30', to: '13:30', classes: 'IX - XII', campusId: 'C1', slotMinutes: 12, teachers: 40, booked: 142, capacity: 500, status: 'Open' },
  { id: 'PTM4', title: 'PTM — Pre-Primary', date: '2026-07-25', from: '09:00', to: '12:00', classes: 'Nursery - UKG', campusId: 'C1', slotMinutes: 10, teachers: 18, booked: 168, capacity: 180, status: 'Completed' },
  { id: 'PTM5', title: 'PTM — Noida Campus Term 1', date: '2026-08-23', from: '09:00', to: '13:00', classes: 'All', campusId: 'C2', slotMinutes: 10, teachers: 48, booked: 402, capacity: 576, status: 'Open' },
]));

lazy(db, 'ptmSlots', () => {
  const out = [];
  let n = 0;
  for (const p of db.ptmSchedules) {
    const teachers = db.staff.filter((s) => s.type === 'Teaching' && s.campusId === p.campusId).slice(0, p.teachers);
    for (const t of teachers) {
      const r = makeRng('slot' + p.id + t.id);
      for (let i = 0; i < 12; i++) {
        n++;
        const hh = 9 + Math.floor((i * p.slotMinutes) / 60);
        const mm = (i * p.slotMinutes) % 60;
        const booked = r.bool(0.68);
        out.push({
          id: 'PSL' + pad(n, 5),
          ptmId: p.id,
          date: p.date,
          teacherId: t.id,
          teacherName: t.name,
          room: `Room ${pad((n % 40) + 1, 2)}`,
          startTime: `${pad(hh, 2)}:${pad(mm, 2)}`,
          endTime: `${pad(hh, 2)}:${pad(mm + p.slotMinutes, 2)}`,
          status: booked ? 'Booked' : 'Available',
          campusId: p.campusId,
        });
      }
    }
  }
  return out;
});

lazy(db, 'ptmBookings', () => {
  const out = [];
  const slots = db.ptmSlots.filter((s) => s.status === 'Booked');
  slots.forEach((s, i) => {
    const st = db.students[(i * 17) % db.students.length];
    const r = makeRng('pbk' + s.id);
    out.push({
      id: 'PBK' + pad(i + 1, 5),
      slotId: s.id,
      ptmId: s.ptmId,
      studentId: st.id,
      studentName: st.name,
      className: st.className,
      section: st.section,
      parentName: st.fatherName,
      parentPhone: phone(r),
      teacherId: s.teacherId,
      teacherName: s.teacherName,
      date: s.date,
      time: s.startTime,
      campusId: s.campusId,
      status: r.weighted([['Confirmed', 72], ['Attended', 18], ['Cancelled', 6], ['No Show', 4]]),
      notes: r.bool(0.4) ? r.pick(['Discuss Mathematics performance.', 'Concerned about attendance.', 'Wants guidance on stream selection.', 'Appreciation for improvement.']) : '',
      rating: r.bool(0.5) ? r.int(3, 5) : null,
    });
  });
  return out;
});

/* ----------------------------------------------------------- activities */

/** Pick a teaching staff member deterministically, preferring a campus match. */
function staffFor(seed, campusId, filter) {
  const pool = db.staff.filter((s) => s.status === 'Active' && (!filter || filter(s)));
  const here = pool.filter((s) => s.campusId === campusId);
  const list = here.length ? here : pool;
  return list.length ? list[hashString(seed) % list.length] : null;
}

lazy(db, 'clubs', () => {
  // `inCharge` was null on every row, so club cards and the activities
  // directory had a blank owner column.
  const defs = [
    { id: 'CLB1', name: 'Robotics Club', category: 'Technology', members: 68, meetingDay: 'Wednesday', room: 'Atal Tinkering Lab', campusId: 'C1', active: true },
    { id: 'CLB2', name: 'Debate & MUN Society', category: 'Literary', members: 94, meetingDay: 'Friday', room: 'Seminar Hall', campusId: 'C1', active: true },
    { id: 'CLB3', name: 'Eco Club', category: 'Environment', members: 122, meetingDay: 'Tuesday', room: 'Bio Lab', campusId: 'C1', active: true },
    { id: 'CLB4', name: 'Dramatics Society', category: 'Performing Arts', members: 76, meetingDay: 'Thursday', room: 'Auditorium', campusId: 'C1', active: true },
    { id: 'CLB5', name: 'Music & Choir', category: 'Performing Arts', members: 84, meetingDay: 'Monday', room: 'Music Room', campusId: 'C1', active: true },
    { id: 'CLB6', name: 'Coding Club', category: 'Technology', members: 110, meetingDay: 'Wednesday', room: 'Computer Lab 2', campusId: 'C1', active: true },
    { id: 'CLB7', name: 'Art & Craft Club', category: 'Visual Arts', members: 92, meetingDay: 'Friday', room: 'Art Room', campusId: 'C1', active: true },
    { id: 'CLB8', name: 'Photography Club', category: 'Visual Arts', members: 46, meetingDay: 'Saturday', room: 'Media Room', campusId: 'C1', active: true },
    { id: 'CLB9', name: 'Astronomy Club', category: 'Science', members: 38, meetingDay: 'Thursday', room: 'Physics Lab', campusId: 'C2', active: true },
    { id: 'CLB10', name: 'Community Service (NSS)', category: 'Social', members: 156, meetingDay: 'Saturday', room: 'Assembly Ground', campusId: 'C1', active: true },
  ];
  return defs.map((c) => {
    const t = staffFor('club' + c.id, c.campusId, (s) => s.type === 'Teaching');
    return { ...c, inCharge: t ? t.name : null, inChargeId: t ? t.id : null, inChargePhone: t ? t.phone : null };
  });
});

lazy(db, 'sportsTeams', () => {
  const defs = [
    { id: 'SPT1', name: 'Basketball — Senior Boys', sport: 'Basketball', players: 14, campusId: 'C1', practiceDays: 'Mon, Wed, Fri', venue: 'Basketball Court', wins: 12, losses: 3 },
    { id: 'SPT2', name: 'Basketball — Senior Girls', sport: 'Basketball', players: 12, campusId: 'C1', practiceDays: 'Tue, Thu', venue: 'Basketball Court', wins: 9, losses: 5 },
    { id: 'SPT3', name: 'Cricket — U-17', sport: 'Cricket', players: 18, campusId: 'C1', practiceDays: 'Mon-Fri', venue: 'Main Ground', wins: 15, losses: 4 },
    { id: 'SPT4', name: 'Football — U-14', sport: 'Football', players: 20, campusId: 'C2', practiceDays: 'Tue, Thu, Sat', venue: 'Football Field', wins: 8, losses: 6 },
    { id: 'SPT5', name: 'Swimming Squad', sport: 'Swimming', players: 22, campusId: 'C3', practiceDays: 'Daily', venue: 'Swimming Pool', wins: 21, losses: 2 },
    { id: 'SPT6', name: 'Athletics Squad', sport: 'Athletics', players: 34, campusId: 'C1', practiceDays: 'Mon-Sat', venue: 'Track', wins: 26, losses: 8 },
    { id: 'SPT7', name: 'Table Tennis', sport: 'Table Tennis', players: 10, campusId: 'C4', practiceDays: 'Wed, Fri', venue: 'Indoor Hall', wins: 11, losses: 4 },
    { id: 'SPT8', name: 'Chess Club Team', sport: 'Chess', players: 16, campusId: 'C1', practiceDays: 'Tue, Thu', venue: 'Activity Room', wins: 18, losses: 6 },
  ];
  return defs.map((t) => {
    const c = staffFor('team' + t.id, t.campusId, (s) => s.designation === 'Sports Coach')
      || staffFor('team' + t.id, t.campusId, (s) => s.department === 'Sports');
    return { ...t, coach: c ? c.name : null, coachId: c ? c.id : null, winPct: round((t.wins / (t.wins + t.losses)) * 100, 1) };
  });
});

lazy(db, 'competitions', () => {
  const out = [];
  const names = ['Inter-House Debate','Annual Athletics Meet','Science Exhibition','Inter-School Quiz','Art Competition',
    'Spell Bee','Mathematics Olympiad','Cultural Fest — Utsav','Robotics Challenge','Essay Writing Contest',
    'Inter-House Basketball','Music Competition','Dance Championship','Model UN Conference'];
  names.forEach((name, i) => {
    const r = makeRng('cmp' + i);
    out.push({
      id: 'CMP' + pad(i + 1, 3),
      name,
      type: r.pick(['Inter-House', 'Inter-School', 'District', 'State', 'National']),
      category: r.pick(['Academic', 'Sports', 'Cultural', 'Technical']),
      date: iso(r.date('2026-06-01', '2027-02-28')),
      venue: r.pick(['School Auditorium', 'Main Ground', 'Seminar Hall', 'Indoor Stadium', 'Host School']),
      campusId: r.pick(db.campuses).id,
      participants: r.int(24, 480),
      houses: HOUSES.map((h) => h.name),
      winnerHouse: r.pick(HOUSES).name,
      coordinator: null,
      budget: r.int(20000, 480000),
      status: r.weighted([['Completed', 46], ['Upcoming', 38], ['Ongoing', 8], ['Cancelled', 8]]),
    });
  });
  return out;
});

lazy(db, 'awards', () => {
  const out = [];
  for (let i = 1; i <= 260; i++) {
    const r = makeRng('awd' + i);
    const s = db.students[(i * 29) % db.students.length];
    out.push({
      id: 'AWD' + pad(i, 4),
      studentId: s.id,
      studentName: s.name,
      className: s.className,
      section: s.section,
      house: s.house,
      campusId: s.campusId,
      title: r.pick(['Best Speaker', 'Gold Medal — 100m', 'First Prize — Science Exhibition', 'Star Performer of the Month',
        'Perfect Attendance', 'Academic Excellence', 'Best Sportsperson', 'Young Innovator', 'Kindness Award', 'Silver — Quiz']),
      category: r.pick(['Academic', 'Sports', 'Cultural', 'Discipline', 'Leadership']),
      level: r.pick(['School', 'Inter-School', 'District', 'State', 'National']),
      date: iso(r.date('2026-04-10', '2026-08-18')),
      awardedBy: r.pick(['Principal', 'Chief Guest', 'House Master', 'Sports Head']),
      certificateNo: `CERT/26/${pad(i, 4)}`,
      points: r.int(5, 50),
    });
  }
  return out;
});

/* --------------------------------------------------------------- health */

lazy(db, 'healthRecords', () => {
  const out = [];
  db.students.slice(0, 900).forEach((s, i) => {
    const r = makeRng('hr' + s.id);
    const h = 90 + s.age * 7 + r.int(-8, 8);
    const w = 12 + s.age * 3.4 + r.int(-6, 8);
    out.push({
      id: 'HRC' + pad(i + 1, 4),
      studentId: s.id,
      studentName: s.name,
      className: s.className,
      section: s.section,
      campusId: s.campusId,
      bloodGroup: s.bloodGroup,
      heightCm: round(h, 1),
      weightKg: round(w, 1),
      bmi: round(w / Math.pow(h / 100, 2), 1),
      vision: r.weighted([['6/6', 68], ['6/9', 18], ['6/12', 9], ['Spectacles', 5]]),
      dental: r.weighted([['Normal', 78], ['Cavity', 14], ['Braces', 8]]),
      allergies: r.bool(0.16) ? r.pick(['Peanuts', 'Dust', 'Pollen', 'Penicillin', 'Seafood', 'Lactose']) : 'None',
      chronicConditions: s.medicalConditions,
      lastCheckup: iso(r.date('2026-04-01', '2026-08-10')),
      nextCheckup: iso(r.date('2026-09-01', '2027-02-01')),
      vaccinations: r.sample(['BCG', 'DPT', 'Polio', 'MMR', 'Hepatitis B', 'Typhoid', 'HPV', 'COVID-19'], r.int(4, 8)),
      emergencyContact: s.emergencyContact,
      familyDoctor: `Dr. ${makeName(r, 'Male').full}`,
      insurancePolicy: r.bool(0.4) ? `POL${r.int(100000, 999999)}` : null,
      status: r.weighted([['Fit', 88], ['Under Observation', 9], ['Referred', 3]]),
    });
  });
  return out;
});

lazy(db, 'infirmaryVisits', () => {
  const out = [];
  for (let i = 1; i <= 380; i++) {
    const r = makeRng('inf' + i);
    const s = db.students[(i * 37) % db.students.length];
    out.push({
      id: 'INF' + pad(i, 4),
      studentId: s.id,
      studentName: s.name,
      className: s.className,
      section: s.section,
      campusId: s.campusId,
      date: iso(r.date('2026-06-01', '2026-08-19')),
      time: `${pad(r.int(8, 15), 2)}:${pad(r.int(0, 59), 2)}`,
      complaint: r.pick(['Headache', 'Stomach ache', 'Fever', 'Minor cut', 'Nausea', 'Sprained ankle', 'Nose bleed', 'Allergic reaction', 'Dizziness', 'Insect bite']),
      diagnosis: r.pick(['Mild dehydration', 'Viral symptoms', 'Minor abrasion', 'Motion sickness', 'Muscle strain', 'Observation only']),
      treatment: r.pick(['Rest & ORS given', 'Antiseptic applied, bandaged', 'Paracetamol 250mg', 'Cold compress', 'Referred to hospital', 'Sent home']),
      medicineGiven: r.bool(0.6),
      attendedBy: null,
      parentInformed: r.bool(0.62),
      sentHome: r.bool(0.18),
      followUp: r.bool(0.22),
      durationMin: r.int(10, 90),
    });
  }
  const nurses = db.staff.filter((s) => s.designation === 'School Nurse');
  out.forEach((v, i) => { const nn = nurses[i % Math.max(1, nurses.length)]; if (nn) { v.attendedBy = nn.id; v.attendedByName = nn.name; } });
  return out;
});

/* ---------------------------------------------------- front office / security */

lazy(db, 'visitors', () => {
  const out = [];
  for (let i = 1; i <= 460; i++) {
    const r = makeRng('vis' + i);
    const inH = r.int(8, 16);
    const checkedOut = r.bool(0.86);
    out.push({
      id: 'VIS' + pad(i, 4),
      passNo: `VP/26/${pad(i, 4)}`,
      name: makeName(r, r.bool() ? 'Male' : 'Female').full,
      phone: phone(r),
      campusId: r.pick(db.campuses).id,
      purpose: r.pick(['Meet Class Teacher', 'Fee Payment', 'Admission Enquiry', 'Deliver Documents', 'Vendor Meeting', 'Interview', 'Collect Ward', 'Maintenance Work']),
      whomToMeet: r.pick(['Principal', 'Class Teacher', 'Accounts Office', 'Admission Office', 'Front Desk', 'HR Department']),
      relatedStudent: r.bool(0.6) ? db.students[(i * 41) % db.students.length].name : null,
      date: iso(r.date('2026-08-01', '2026-08-20')),
      inTime: `${pad(inH, 2)}:${pad(r.int(0, 59), 2)}`,
      outTime: checkedOut ? `${pad(inH + r.int(0, 2), 2)}:${pad(r.int(0, 59), 2)}` : null,
      idProof: r.pick(['Aadhaar', 'Driving Licence', 'Voter ID', 'PAN Card', 'Company ID']),
      idNumberMasked: `XXXX${r.int(1000, 9999)}`,
      badgeNo: `B${pad(r.int(1, 120), 3)}`,
      photoTaken: r.bool(0.8),
      vehicleNo: r.bool(0.5) ? `HR26 ${r.pick(['AB', 'CD'])} ${r.int(1000, 9999)}` : null,
      status: checkedOut ? 'Checked Out' : 'Inside',
      approvedBy: 'Front Office',
    });
  }
  return out;
});

lazy(db, 'gatePasses', () => {
  const out = [];
  for (let i = 1; i <= 240; i++) {
    const r = makeRng('gp' + i);
    const isStudent = r.bool(0.62);
    const person = isStudent ? db.students[(i * 53) % db.students.length] : db.staff[(i * 7) % db.staff.length];
    out.push({
      id: 'GP' + pad(i, 4),
      passNo: `GP/26/${pad(i, 4)}`,
      type: isStudent ? 'Student' : 'Staff',
      personId: person.id,
      personName: person.name,
      className: isStudent ? person.className : person.department,
      section: isStudent ? person.section : '—',
      campusId: person.campusId,
      date: iso(r.date('2026-08-01', '2026-08-20')),
      outTime: `${pad(r.int(9, 15), 2)}:${pad(r.int(0, 59), 2)}`,
      expectedReturn: r.bool(0.4) ? `${pad(r.int(15, 17), 2)}:00` : null,
      reason: r.pick(['Medical appointment', 'Family emergency', 'Official duty', 'Unwell — sent home', 'Competition participation', 'Bank work']),
      authorisedBy: r.pick(['Principal', 'Vice Principal', 'Class Teacher', 'HR Manager']),
      pickedUpBy: isStudent ? r.pick(['Father', 'Mother', 'Authorised Guardian', 'Driver']) : null,
      status: r.weighted([['Approved', 74], ['Pending', 16], ['Rejected', 6], ['Returned', 4]]),
      securityVerified: r.bool(0.9),
    });
  }
  return out;
});

lazy(db, 'incidents', () => {
  const out = [];
  for (let i = 1; i <= 96; i++) {
    const r = makeRng('inc' + i);
    out.push({
      id: 'INC' + pad(i, 3),
      reference: `INC/26/${pad(i, 3)}`,
      date: iso(r.date('2026-04-05', '2026-08-19')),
      time: `${pad(r.int(7, 18), 2)}:${pad(r.int(0, 59), 2)}`,
      campusId: r.pick(db.campuses).id,
      type: r.pick(['Unauthorised Entry', 'Property Damage', 'Student Injury', 'Fire Alarm', 'Theft Reported', 'Vehicle Incident', 'Medical Emergency', 'Altercation']),
      severity: r.weighted([['Low', 48], ['Medium', 34], ['High', 14], ['Critical', 4]]),
      location: r.pick(['Main Gate', 'Playground', 'Corridor Block B', 'Science Lab', 'Parking Area', 'Cafeteria', 'Bus Bay']),
      reportedBy: r.pick(['Security Guard', 'Class Teacher', 'Student', 'Housekeeping', 'Parent']),
      description: r.pick(['Minor fall during games period, first aid administered.', 'Unidentified visitor attempted entry without a pass.',
        'Window pane damaged during sports practice.', 'Fire alarm triggered by kitchen smoke, no fire found.',
        'Reported missing water bottle from classroom.', 'Bus reversed into a bollard, no injuries.']),
      actionTaken: r.pick(['First aid given, parent informed', 'Escorted out by security', 'Maintenance ticket raised', 'Drill conducted, all clear', 'Under investigation']),
      status: r.weighted([['Closed', 62], ['Under Investigation', 24], ['Open', 14]]),
      assignedTo: null,
      followUpDate: iso(r.date('2026-08-20', '2026-09-15')),
    });
  }
  return out;
});

lazy(db, 'callLogs', () => {
  const out = [];
  for (let i = 1; i <= 320; i++) {
    const r = makeRng('cal' + i);
    out.push({
      id: 'CAL' + pad(i, 4),
      date: iso(r.date('2026-08-01', '2026-08-20')),
      time: `${pad(r.int(8, 17), 2)}:${pad(r.int(0, 59), 2)}`,
      direction: r.weighted([['Incoming', 72], ['Outgoing', 28]]),
      callerName: makeName(r, r.bool() ? 'Male' : 'Female').full,
      phone: phone(r),
      campusId: r.pick(db.campuses).id,
      purpose: r.pick(['Admission Enquiry', 'Fee Query', 'Absence Intimation', 'Transport Query', 'Complaint', 'Result Query', 'Vendor Call', 'Appointment Request']),
      handledBy: null,
      durationMin: r.int(1, 18),
      followUpRequired: r.bool(0.3),
      notes: r.pick(['Details shared over WhatsApp.', 'Transferred to accounts.', 'Callback scheduled tomorrow.', 'Resolved on call.', 'Escalated to Principal.']),
    });
  }
  return out;
});

lazy(db, 'couriers', () => {
  const out = [];
  for (let i = 1; i <= 180; i++) {
    const r = makeRng('cor' + i);
    const dir = r.bool(0.55) ? 'Inward' : 'Outward';
    out.push({
      id: 'COR' + pad(i, 4),
      refNo: `${dir === 'Inward' ? 'IN' : 'OUT'}/26/${pad(i, 4)}`,
      direction: dir,
      date: iso(r.date('2026-07-01', '2026-08-20')),
      courierCompany: r.pick(['Blue Dart', 'DTDC', 'India Post', 'Delhivery', 'FedEx', 'Professional Couriers']),
      awbNo: `AWB${r.int(1000000000, 9999999999)}`,
      sender: dir === 'Inward' ? r.pick(['CBSE Regional Office', 'Vendor', 'District Education Office', 'Parent', 'Bank']) : 'Springdale International',
      recipient: dir === 'Inward' ? r.pick(['Principal', 'Accounts', 'Admissions', 'HR']) : r.pick(['CBSE', 'Parent', 'Vendor', 'Affiliating Body']),
      contents: r.pick(['Affiliation documents', 'Cheque', 'Marksheets', 'Textbook samples', 'Legal notice', 'Certificates', 'Invoices']),
      campusId: r.pick(db.campuses).id,
      receivedBy: 'Front Office',
      status: r.weighted([['Delivered', 68], ['In Transit', 18], ['Received', 12], ['Returned', 2]]),
      remarks: '',
    });
  }
  return out;
});

lazy(db, 'lostFound', () => {
  const out = [];
  for (let i = 1; i <= 68; i++) {
    const r = makeRng('lf' + i);
    out.push({
      id: 'LNF' + pad(i, 3),
      item: r.pick(['Water Bottle', 'Lunch Box', 'Sweater', 'Spectacles', 'Wrist Watch', 'Notebook', 'ID Card', 'Umbrella', 'Sports Shoes', 'Calculator']),
      type: r.weighted([['Found', 68], ['Lost', 32]]),
      date: iso(r.date('2026-07-01', '2026-08-19')),
      location: r.pick(['Playground', 'Library', 'Bus Route R12', 'Cafeteria', 'Classroom 8B', 'Washroom Block A']),
      campusId: r.pick(db.campuses).id,
      reportedBy: db.students[(i * 61) % db.students.length].name,
      description: 'Item logged at the front office lost & found register.',
      status: r.weighted([['Unclaimed', 46], ['Claimed', 44], ['Disposed', 10]]),
      claimedBy: null,
      claimedOn: null,
    });
  }
  return out;
});

/* ----------------------------------------------------------- complaints */

lazy(db, 'complaints', () => {
  const out = [];
  const cats = ['Academic', 'Transport', 'Hostel', 'Fee & Accounts', 'Infrastructure', 'Discipline', 'Canteen', 'IT & Portal', 'Staff Conduct', 'Safety'];
  for (let i = 1; i <= 240; i++) {
    const r = makeRng('cmpl' + i);
    const status = r.weighted([['Open', 9], ['In Progress', 11], ['Resolved', 60], ['Escalated', 4], ['Closed', 16]]);
    const priority = r.weighted([['Low', 30], ['Medium', 42], ['High', 22], ['Critical', 6]]);
    const slaHours = priority === 'Critical' ? 4 : priority === 'High' ? 24 : priority === 'Medium' ? 48 : 96;
    /*
     * A ticket that is still open is, by definition, a recent one, and its age
     * is measured against its own SLA — a critical ticket is chased in hours, a
     * low one in days. Dating every ticket uniformly across four months put 145
     * of 240 (60%) in breach, which is not a service desk, it is a scandal.
     * Open work now sits inside its SLA window (a quarter of it slipping past),
     * escalations are the ones that have genuinely run long, and closed tickets
     * carry the history.
     */
    const ageHours = status === 'Open' || status === 'In Progress' ? Math.round(slaHours * r.float(0.04, 1.5))
      : status === 'Escalated' ? Math.round(slaHours * r.float(1.6, 9))
      : Math.round(r.float(24, 24 * 110));
    const created = new Date(new Date(DEMO_TODAY).getTime() - ageHours * 3600000);
    out.push({
      id: 'CMP' + pad(i, 4),
      ticketNo: `TKT/26/${pad(i, 4)}`,
      subject: r.pick(['Bus arriving late consistently', 'Classroom projector not working', 'Fee receipt not generated',
        'Hostel room maintenance pending', 'Canteen food quality concern', 'Portal login issue', 'Homework not updated on app',
        'Water cooler not functioning', 'Request for section change', 'Playground equipment damaged']),
      category: r.pick(cats),
      description: 'Detailed description of the concern raised, with supporting context provided by the complainant.',
      raisedBy: r.pick(['Parent', 'Student', 'Staff']),
      raisedByName: r.bool(0.6) ? db.parents[(i * 17) % Math.max(1, db.parents.length)].name : db.staff[(i * 11) % db.staff.length].name,
      campusId: r.pick(db.campuses).id,
      priority,
      status,
      assignedTo: null,
      assignedToName: null,
      department: r.pick(DEPARTMENTS),
      createdAt: iso(created),
      slaHours,
      ageHours,
      slaBreached: status !== 'Resolved' && status !== 'Closed' && ageHours > slaHours,
      resolvedAt: status === 'Resolved' || status === 'Closed'
        ? iso(new Date(Math.min(addDays(created, r.int(1, 9)).getTime(), new Date(DEMO_TODAY).getTime())))
        : null,
      resolutionNote: status === 'Resolved' || status === 'Closed' ? r.pick(['Issue fixed and verified with the complainant.', 'Replacement arranged.', 'Explained policy, complainant satisfied.', 'Vendor visit completed.']) : null,
      satisfaction: status === 'Resolved' ? r.int(3, 5) : null,
      comments: r.int(0, 8),
    });
  }
  const owners = db.staff.filter((s) => ['Administrator', 'HR Manager', 'Transport Manager', 'Accountant', 'System Administrator'].includes(s.designation));
  out.forEach((c, i) => { const o = owners[i % Math.max(1, owners.length)]; if (o) { c.assignedTo = o.id; c.assignedToName = o.name; } });
  return out;
});

lazy(db, 'complaintCategories', () => {
  // Open / resolved / escalation counts come from db.complaints so the category
  // cards and the ticket list can never quote different totals.
  const defs = [
    { id: 'CC1', name: 'Academic', owner: 'Academics', slaHours: 48 },
    { id: 'CC2', name: 'Transport', owner: 'Transport', slaHours: 24 },
    { id: 'CC3', name: 'Hostel', owner: 'Hostel', slaHours: 24 },
    { id: 'CC4', name: 'Fee & Accounts', owner: 'Accounts & Finance', slaHours: 48 },
    { id: 'CC5', name: 'Infrastructure', owner: 'Maintenance', slaHours: 72 },
    { id: 'CC6', name: 'Discipline', owner: 'Administration', slaHours: 24 },
    { id: 'CC7', name: 'Canteen', owner: 'Administration', slaHours: 48 },
    { id: 'CC8', name: 'IT & Portal', owner: 'IT & Systems', slaHours: 12 },
    { id: 'CC9', name: 'Staff Conduct', owner: 'Human Resources', slaHours: 24 },
    { id: 'CC10', name: 'Safety', owner: 'Security', slaHours: 4 },
  ];
  const byCat = groupBy(db.complaints, 'category');
  return defs.map((d) => {
    const rows = byCat.get(d.name) || [];
    return {
      ...d,
      total: rows.length,
      open: rows.filter((c) => !['Resolved', 'Closed'].includes(c.status)).length,
      resolved: rows.filter((c) => ['Resolved', 'Closed'].includes(c.status)).length,
      escalations: rows.filter((c) => c.status === 'Escalated' || c.slaBreached).length,
      avgSatisfaction: round(avg(rows.filter((c) => c.satisfaction), 'satisfaction'), 1),
    };
  });
});

/* ---------------------------------------------------------------- events */

lazy(db, 'events', () => {
  const defs = [
    ['Independence Day Celebration', 'Cultural', '2026-08-15'],
    ['Teachers’ Day Assembly', 'Cultural', '2026-09-05'],
    ['Annual Sports Meet', 'Sports', '2026-11-14'],
    ['Science Exhibition — Innovate', 'Academic', '2026-10-09'],
    ['Annual Day — Utsav 2026', 'Cultural', '2026-12-19'],
    ['Diwali Mela', 'Cultural', '2026-10-24'],
    ['Inter-House Debate Finals', 'Academic', '2026-09-18'],
    ['Founder’s Day', 'Institutional', '2026-07-11'],
    ['Career Counselling Fair', 'Academic', '2026-11-28'],
    ['Class XII Farewell', 'Cultural', '2027-02-06'],
    ['Investiture Ceremony', 'Institutional', '2026-04-24'],
    ['Educational Trip — Jaipur', 'Trip', '2026-10-16'],
    ['Adventure Camp — Rishikesh', 'Trip', '2026-11-06'],
    ['Blood Donation & Health Camp', 'Community', '2026-09-26'],
    ['Alumni Homecoming', 'Institutional', '2026-12-27'],
    ['Parent Orientation — New Admissions', 'Institutional', '2026-04-05'],
    ['Christmas Carnival', 'Cultural', '2026-12-23'],
    ['Republic Day Parade', 'Institutional', '2027-01-26'],
  ];
  return defs.map(([title, category, date], i) => {
    const r = makeRng('evt' + i);
    const budget = r.int(60000, 1400000);
    const past = new Date(date) < new Date('2026-08-20');
    return {
      id: 'EVT' + pad(i + 1, 3),
      title,
      category,
      date,
      endDate: date,
      startTime: `${pad(r.int(8, 11), 2)}:00`,
      endTime: `${pad(r.int(13, 18), 2)}:00`,
      venue: r.pick(['School Auditorium', 'Main Ground', 'Amphitheatre', 'Indoor Stadium', 'Off Campus', 'Assembly Hall']),
      campusId: r.pick(db.campuses).id,
      organiser: r.pick(DEPARTMENTS),
      coordinator: null,
      audience: r.pick(['All Students', 'Class VI-XII', 'Parents & Students', 'Staff Only', 'Invitees']),
      expectedAttendance: r.int(180, 2400),
      registered: r.int(60, 1800),
      attended: past ? r.int(60, 1800) : 0,
      budget,
      spent: past ? Math.round(budget * r.float(0.7, 1.12)) : Math.round(budget * r.float(0, 0.4)),
      chiefGuest: r.bool(0.5) ? `Dr. ${makeName(r, 'Male').full}` : null,
      status: past ? 'Completed' : r.weighted([['Upcoming', 84], ['Planning', 16]]),
      photos: past ? r.int(12, 180) : 0,
      description: 'A flagship school event coordinated across departments with student participation from all houses.',
    };
  });
});

lazy(db, 'holidays', () => ([
  { id: 'HOL01', name: 'Good Friday', date: '2026-04-03', type: 'Gazetted', days: 1, campusId: 'ALL' },
  { id: 'HOL02', name: 'Eid-ul-Fitr', date: '2026-03-20', type: 'Gazetted', days: 1, campusId: 'ALL' },
  { id: 'HOL03', name: 'Summer Vacation', date: '2026-05-18', type: 'Vacation', days: 30, campusId: 'ALL' },
  { id: 'HOL04', name: 'Independence Day', date: '2026-08-15', type: 'National', days: 1, campusId: 'ALL' },
  { id: 'HOL05', name: 'Janmashtami', date: '2026-09-04', type: 'Restricted', days: 1, campusId: 'ALL' },
  { id: 'HOL06', name: 'Gandhi Jayanti', date: '2026-10-02', type: 'National', days: 1, campusId: 'ALL' },
  { id: 'HOL07', name: 'Dussehra Break', date: '2026-10-19', type: 'Festival', days: 3, campusId: 'ALL' },
  { id: 'HOL08', name: 'Diwali Break', date: '2026-11-07', type: 'Festival', days: 5, campusId: 'ALL' },
  { id: 'HOL09', name: 'Guru Nanak Jayanti', date: '2026-11-24', type: 'Restricted', days: 1, campusId: 'ALL' },
  { id: 'HOL10', name: 'Christmas Break', date: '2026-12-24', type: 'Festival', days: 8, campusId: 'ALL' },
  { id: 'HOL11', name: 'Republic Day', date: '2027-01-26', type: 'National', days: 1, campusId: 'ALL' },
  { id: 'HOL12', name: 'Holi', date: '2027-03-03', type: 'Festival', days: 2, campusId: 'ALL' },
  { id: 'HOL13', name: 'Winter Break (Bengaluru)', date: '2026-12-26', type: 'Vacation', days: 6, campusId: 'C3' },
]));

/* --------------------------------------------------------------- alumni */

lazy(db, 'alumni', () => {
  const out = [];
  const cos = ['Google India','Infosys','TCS','Deloitte','Amazon','Microsoft','Goldman Sachs','Flipkart','Zomato','ISRO',
    'Indian Army','AIIMS','Reliance Industries','McKinsey & Company','Adobe','Own Startup','Tata Motors','Wipro','HCL','Paytm'];
  const unis = ['IIT Delhi','IIT Bombay','BITS Pilani','Delhi University','NIT Trichy','AIIMS Delhi','NLU Delhi','SRCC',
    'Manipal Institute of Technology','VIT Vellore','University of Toronto','Purdue University','NUS Singapore','IIM Ahmedabad'];
  for (let i = 1; i <= 1100; i++) {
    const r = makeRng('alm' + i);
    const gender = r.bool(0.52) ? 'Male' : 'Female';
    const nm = makeName(r, gender);
    const batch = 2008 + (i % 18);
    out.push({
      id: 'ALM' + pad(i, 4),
      name: nm.full,
      gender,
      batch,
      batchLabel: `Batch of ${batch}`,
      campusId: db.campuses[i % 5].id,
      stream: r.pick(STREAMS),
      admissionNo: `SIG/${batch - 12}/${pad(i, 4)}`,
      university: r.pick(unis),
      degree: r.pick(['B.Tech', 'MBBS', 'B.Com (H)', 'BBA', 'LLB', 'B.Sc', 'B.A. (H)', 'B.Des', 'CA']),
      currentCompany: r.pick(cos),
      designation: r.pick(['Software Engineer', 'Analyst', 'Doctor', 'Founder', 'Product Manager', 'Consultant', 'Civil Servant', 'Architect', 'Research Associate', 'Teacher']),
      city: r.pick(Object.keys(CITY_AREAS).concat(['San Francisco', 'London', 'Singapore', 'Dubai', 'Toronto'])),
      email: `${nm.first.toLowerCase()}.${nm.last.toLowerCase().replace(/[^a-z]/g, '')}${i}@gmail.com`,
      phone: phone(r),
      linkedin: `linkedin.com/in/${nm.first.toLowerCase()}-${nm.last.toLowerCase().replace(/[^a-z]/g, '')}`,
      mentorAvailable: r.bool(0.28),
      donationTotal: r.weighted([[0, 72], [5000, 12], [25000, 9], [100000, 5], [500000, 2]]),
      eventsAttended: r.int(0, 9),
      verified: r.bool(0.74),
      avatarInitials: (nm.first[0] + nm.last[0]).toUpperCase(),
      story: r.bool(0.12) ? 'Credits the school’s debate society for shaping a career in public policy.' : null,
      lastContact: iso(r.date('2024-01-01', '2026-08-01')),
    });
  }
  return out;
});

/* ------------------------------------------------------------------- HR */

lazy(db, 'leaveTypes', () => ([
  { id: 'LT1', name: 'Casual Leave', code: 'CL', annualQuota: 12, carryForward: false, encashable: false, paid: true, applicableTo: 'All' },
  { id: 'LT2', name: 'Sick Leave', code: 'SL', annualQuota: 10, carryForward: true, encashable: false, paid: true, applicableTo: 'All' },
  { id: 'LT3', name: 'Earned Leave', code: 'EL', annualQuota: 24, carryForward: true, encashable: true, paid: true, applicableTo: 'Permanent' },
  { id: 'LT4', name: 'Maternity Leave', code: 'ML', annualQuota: 182, carryForward: false, encashable: false, paid: true, applicableTo: 'Female' },
  { id: 'LT5', name: 'Paternity Leave', code: 'PL', annualQuota: 15, carryForward: false, encashable: false, paid: true, applicableTo: 'Male' },
  { id: 'LT6', name: 'Leave Without Pay', code: 'LWP', annualQuota: 0, carryForward: false, encashable: false, paid: false, applicableTo: 'All' },
  { id: 'LT7', name: 'Compensatory Off', code: 'CO', annualQuota: 0, carryForward: false, encashable: false, paid: true, applicableTo: 'All' },
  { id: 'LT8', name: 'Study Leave', code: 'STL', annualQuota: 10, carryForward: false, encashable: false, paid: true, applicableTo: 'Teaching' },
]));

lazy(db, 'leaveRequests', () => {
  const out = [];
  db.staff.forEach((s, i) => {
    const r = makeRng('lrq' + s.id);
    const count = r.weighted([[0, 24], [1, 32], [2, 24], [3, 14], [4, 6]]);
    for (let k = 0; k < count; k++) {
      const from = r.date('2026-04-05', '2026-08-18');
      const days = r.weighted([[1, 52], [2, 24], [3, 12], [5, 8], [10, 4]]);
      const lt = r.pick(db.leaveTypes);
      out.push({
        id: 'LRQ' + pad(out.length + 1, 5),
        employeeId: s.id,
        employeeName: s.name,
        designation: s.designation,
        department: s.department,
        campusId: s.campusId,
        leaveTypeId: lt.id,
        leaveType: lt.name,
        fromDate: iso(from),
        toDate: iso(addDays(from, days - 1)),
        days,
        reason: r.pick(['Personal work', 'Not feeling well', 'Family function', 'Medical treatment', 'Out of station', 'Child’s exam']),
        appliedOn: iso(addDays(from, -r.int(1, 8))),
        status: r.weighted([['Approved', 62], ['Pending', 22], ['Rejected', 10], ['Cancelled', 6]]),
        approverId: null,
        approverName: null,
        substituteArranged: s.type === 'Teaching' ? r.bool(0.7) : false,
        attachment: lt.code === 'SL' && r.bool(0.5) ? 'medical.pdf' : null,
      });
    }
    void i;
  });
  const approvers = db.staff.filter((s) => ['Principal', 'Vice Principal', 'HR Manager'].includes(s.designation));
  out.forEach((l, i) => { const a = approvers[i % Math.max(1, approvers.length)]; if (a) { l.approverId = a.id; l.approverName = a.name; } });
  return out;
});

lazy(db, 'staffAttendance', () => {
  const out = [];
  let n = 0;
  // Every working day of the session up to the demo clock — a staff register
  // that stops two weeks in cannot support a monthly trend or a "today" widget.
  const days = schoolDays();
  for (const s of db.staff) {
    const r = makeRng('sat' + s.id);
    for (const date of days) {
      n++;
      const status = r.weighted([['Present', 88], ['Absent', 3], ['On Leave', 5], ['Half Day', 2], ['On Duty', 2]]);
      out.push({
        id: 'SAT' + pad(n, 6),
        employeeId: s.id,
        employeeName: s.name,
        department: s.department,
        designation: s.designation,
        campusId: s.campusId,
        date,
        status,
        inTime: status === 'Present' || status === 'Half Day' ? `07:${pad(r.int(40, 59), 2)}` : null,
        outTime: status === 'Present' ? `15:${pad(r.int(20, 59), 2)}` : status === 'Half Day' ? '12:00' : null,
        workedHours: status === 'Present' ? round(r.float(7.2, 8.6), 1) : status === 'Half Day' ? 4 : 0,
        lateBy: r.weighted([[0, 84], [8, 10], [18, 6]]),
        source: r.pick(['Biometric', 'RFID', 'Manual']),
      });
    }
  }
  return out;
});

lazy(db, 'payrollRuns', () => {
  const months = ['Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026'];
  return months.map((m, i) => {
    const r = makeRng('pr' + i);
    const employees = 380 - r.int(0, 6);
    const gross = employees * r.int(48000, 54000);
    const deductions = Math.round(gross * r.float(0.11, 0.15));
    return {
      id: 'PRN' + pad(i + 1, 3),
      month: m,
      period: m,
      academicYearId: 'AY2026',
      employees,
      grossTotal: gross,
      deductionsTotal: deductions,
      netTotal: gross - deductions,
      pf: Math.round(gross * 0.08),
      esi: Math.round(gross * 0.007),
      tds: Math.round(gross * 0.042),
      status: i < 4 ? 'Disbursed' : 'Pending Approval',
      processedOn: i < 4 ? `2026-0${4 + i}-28` : null,
      processedBy: 'HR Manager',
      bankFileGenerated: i < 4,
    };
  });
});

lazy(db, 'payslips', () => {
  const out = [];
  let n = 0;
  for (const run of db.payrollRuns.filter((r) => r.status === 'Disbursed')) {
    for (const s of db.staff) {
      n++;
      const r = makeRng('psl' + s.id + run.id);
      const lop = r.weighted([[0, 88], [1, 8], [2, 4]]);
      const lopAmount = Math.round((s.salaryGross / 30) * lop);
      out.push({
        id: 'PSL' + pad(n, 6),
        payrollRunId: run.id,
        month: run.month,
        employeeId: s.id,
        employeeName: s.name,
        designation: s.designation,
        department: s.department,
        campusId: s.campusId,
        basic: s.salaryBasic,
        hra: s.salaryHra,
        da: s.salaryDa,
        conveyance: s.salaryConveyance,
        gross: s.salaryGross,
        pf: s.deductionPf,
        tds: s.deductionTds,
        lopDays: lop,
        lopAmount,
        otherDeductions: r.weighted([[0, 80], [500, 12], [1500, 8]]),
        net: s.salaryGross - s.deductionPf - s.deductionTds - lopAmount,
        paidOn: run.processedOn,
        mode: 'Bank Transfer',
        status: 'Paid',
      });
    }
  }
  return out;
});

lazy(db, 'recruitments', () => {
  const roles = ['PGT Physics','TGT Mathematics','PRT English','Nursery Teacher','Sports Coach — Basketball','Lab Assistant — Chemistry',
    'Accountant','HR Executive','Front Office Executive','Librarian','School Counsellor','System Administrator','Transport Supervisor','Special Educator'];
  return roles.map((role, i) => {
    const r = makeRng('rec' + i);
    const applicants = r.int(12, 180);
    return {
      id: 'REC' + pad(i + 1, 3),
      position: role,
      department: r.pick(DEPARTMENTS),
      campusId: r.pick(db.campuses).id,
      openings: r.int(1, 4),
      applicants,
      shortlisted: Math.round(applicants * r.float(0.1, 0.3)),
      interviewed: Math.round(applicants * r.float(0.05, 0.15)),
      offered: r.int(0, 3),
      joined: r.int(0, 2),
      postedOn: iso(r.date('2026-04-01', '2026-08-10')),
      closingDate: iso(r.date('2026-08-25', '2026-10-30')),
      experienceRequired: `${r.int(1, 5)}-${r.int(6, 12)} yrs`,
      salaryRange: `₹${r.int(3, 8)}L - ₹${r.int(9, 16)}L`,
      status: r.weighted([['Open', 54], ['Interviewing', 24], ['Offer Released', 12], ['Closed', 10]]),
      hiringManager: null,
      priority: r.weighted([['High', 30], ['Medium', 50], ['Low', 20]]),
    };
  });
});

lazy(db, 'applicants', () => {
  const out = [];
  let n = 0;
  for (const rec of db.recruitments) {
    const r = makeRng('apc' + rec.id);
    for (let i = 0; i < 14; i++) {
      n++;
      const gender = r.bool() ? 'Male' : 'Female';
      const nm = makeName(r, gender);
      out.push({
        id: 'APC' + pad(n, 4),
        name: nm.full,
        gender,
        recruitmentId: rec.id,
        position: rec.position,
        campusId: rec.campusId,
        email: `${nm.first.toLowerCase()}.${nm.last.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
        phone: phone(r),
        experienceYears: r.int(0, 18),
        qualification: r.pick(['M.A., B.Ed', 'M.Sc, B.Ed', 'B.Ed', 'MBA', 'B.Com', 'M.Tech', 'Ph.D']),
        currentEmployer: r.pick(['DPS', 'Ryan International', 'Amity', 'Kendriya Vidyalaya', 'Fresher', 'Podar International', 'Self-employed']),
        expectedCtc: `₹${r.int(4, 14)}L`,
        appliedOn: iso(r.date('2026-04-05', '2026-08-15')),
        source: r.pick(['Naukri', 'LinkedIn', 'Referral', 'Walk-in', 'Website', 'Consultant']),
        stage: r.weighted([['Applied', 34], ['Screening', 18], ['Shortlisted', 16], ['Interview', 14], ['Demo Class', 8], ['Offered', 6], ['Rejected', 4]]),
        rating: r.bool(0.6) ? r.int(2, 5) : null,
        resume: 'resume.pdf',
        notes: r.bool(0.4) ? r.pick(['Strong subject knowledge.', 'Needs improvement in classroom management.', 'Excellent communication.', 'Salary expectation above band.']) : '',
      });
    }
  }
  return out;
});

lazy(db, 'trainings', () => {
  const names = ['CBSE Capacity Building — Pedagogy','First Aid & CPR Certification','POSH Awareness Workshop','Google Classroom Advanced',
    'Inclusive Education & Special Needs','Assessment Design Workshop','Cyber Safety for Educators','Leadership Development Programme',
    'Fire Safety Drill Training','Child Psychology Refresher'];
  return names.map((name, i) => {
    const r = makeRng('trn' + i);
    return {
      id: 'TRN' + pad(i + 1, 3),
      name,
      type: r.pick(['Internal', 'External', 'Online', 'Certification']),
      trainer: r.bool(0.5) ? `Dr. ${makeName(r, 'Female').full}` : 'CBSE Resource Person',
      date: iso(r.date('2026-04-10', '2027-01-20')),
      durationHours: r.pick([3, 6, 8, 16, 24]),
      seats: r.int(25, 120),
      enrolled: r.int(12, 110),
      completed: r.int(8, 100),
      campusId: r.pick(db.campuses).id,
      mandatory: r.bool(0.4),
      cost: r.int(0, 240000),
      feedbackScore: round(r.float(3.4, 4.9), 1),
      status: r.weighted([['Completed', 46], ['Scheduled', 40], ['Ongoing', 8], ['Cancelled', 6]]),
    };
  });
});

lazy(db, 'resignations', () => {
  const out = [];
  db.staff.filter((s) => s.status === 'Notice Period' || s.status === 'Resigned').forEach((s, i) => {
    const r = makeRng('rsg' + s.id);
    const applied = r.date('2026-05-01', '2026-08-10');
    out.push({
      id: 'RSG' + pad(i + 1, 3),
      employeeId: s.id,
      employeeName: s.name,
      designation: s.designation,
      department: s.department,
      campusId: s.campusId,
      appliedOn: iso(applied),
      noticePeriodDays: 60,
      lastWorkingDay: iso(addDays(applied, 60)),
      reason: r.pick(['Better opportunity', 'Relocation', 'Higher studies', 'Personal reasons', 'Health reasons']),
      status: r.weighted([['Under Review', 30], ['Accepted', 50], ['Clearance Pending', 14], ['Completed', 6]]),
      exitInterview: r.bool(0.6),
      clearanceIt: r.bool(0.7),
      clearanceLibrary: r.bool(0.75),
      clearanceAccounts: r.bool(0.6),
      clearanceHostel: r.bool(0.9),
      fnfAmount: r.int(20000, 320000),
      fnfStatus: r.weighted([['Pending', 46], ['Processed', 40], ['Paid', 14]]),
    });
  });
  return out;
});

/* ---------------------------------------------------------------- system */

export const PERMISSION_MODULES = ['dashboard','admissions','students','parents','teachers','hr','academics','timetable',
  'attendance','examination','fees','finance','library','transport','hostel','inventory','lms','communication','ptm',
  'activities','health','frontoffice','security','complaints','events','alumni','reports','portals','system'];

/** Which application role an employee signs in with. */
export function roleForStaff(s) {
  const byDesignation = {
    Principal: 'principal', 'Vice Principal': 'vice-principal', Accountant: 'accountant',
    'Finance Manager': 'accountant', 'HR Manager': 'hr-manager', 'HR Executive': 'hr-executive',
    Librarian: 'librarian', 'Transport Manager': 'transport-manager', 'Hostel Warden': 'hostel-warden',
    'School Nurse': 'nurse', 'Security Supervisor': 'security', 'Security Guard': 'security',
    Administrator: 'administrator', Headmistress: 'vice-principal',
    'Front Office Executive': 'front-office', 'Admission Officer': 'admission-officer',
  };
  if (byDesignation[s.designation]) return byDesignation[s.designation];
  if (s.isClassTeacher) return 'class-teacher';
  return s.type === 'Teaching' ? 'teacher' : 'employee';
}

/** How many staff accounts the system provisions (mirrors db.users). */
const PROVISIONED_STAFF = 240;

lazy(db, 'roles', () => {
  const defs = ROLE_DEFS.map((r) => ({ ...r }));
  // `users` used to be hand-written — 214 "teacher" accounts against 106
  // teaching staff on the roster. Count what actually exists instead.
  const staffRoles = groupBy(db.staff.slice(0, PROVISIONED_STAFF), roleForStaff);
  for (const role of defs) {
    if (role.id === 'student') role.users = db.students.filter((s) => s.status === 'Active').length;
    else if (role.id === 'parent') role.users = db.parents.filter((p) => p.portalActive).length;
    else if (role.id === 'employee') role.users = (staffRoles.get('employee') || []).length;
    else if (role.id === 'super-admin' || role.id === 'management') role.users = role.users; // seats, not staff rows
    else role.users = (staffRoles.get(role.id) || []).length;
  }
  return defs;
});

const ROLE_DEFS = ([
  { id: 'super-admin', name: 'Super Admin', users: 3, description: 'Unrestricted access across all campuses and modules.', system: true },
  { id: 'management', name: 'Management / Trustee', users: 6, description: 'Group-level MIS, finance and strategic dashboards.', system: true },
  { id: 'principal', name: 'Principal', users: 5, description: 'Full academic and operational control for a campus.', system: false },
  { id: 'vice-principal', name: 'Vice Principal', users: 7, description: 'Academic supervision and approvals.', system: false },
  { id: 'administrator', name: 'Administrator', users: 12, description: 'Day-to-day administrative operations.', system: false },
  { id: 'admission-officer', name: 'Admission Officer', users: 14, description: 'Enquiry to admission pipeline ownership.', system: false },
  { id: 'accountant', name: 'Accountant', users: 16, description: 'Fee collection, receipts and accounting entries.', system: false },
  { id: 'hr-manager', name: 'HR Manager', users: 6, description: 'Recruitment, payroll and employee lifecycle.', system: false },
  { id: 'hr-executive', name: 'HR Executive', users: 11, description: 'HR operations and record keeping.', system: false },
  { id: 'teacher', name: 'Teacher', users: 214, description: 'Subject teaching, marks entry and homework.', system: false },
  { id: 'class-teacher', name: 'Class Teacher', users: 96, description: 'Class ownership: attendance, report cards, PTM.', system: false },
  { id: 'librarian', name: 'Librarian', users: 6, description: 'Catalogue, circulation and fines.', system: false },
  { id: 'transport-manager', name: 'Transport Manager', users: 5, description: 'Fleet, routes, drivers and transport fees.', system: false },
  { id: 'hostel-warden', name: 'Hostel Warden', users: 8, description: 'Hostel rooms, attendance, mess and discipline.', system: false },
  { id: 'nurse', name: 'School Nurse', users: 7, description: 'Health records, infirmary and medical incidents.', system: false },
  { id: 'security', name: 'Security', users: 22, description: 'Visitors, gate passes and incident register.', system: false },
  { id: 'front-office', name: 'Front Office', users: 12, description: 'Reception, enquiries, calls and courier.', system: false },
  { id: 'student', name: 'Student', users: 2400, description: 'Student self-service portal.', system: true },
  { id: 'parent', name: 'Parent', users: 1900, description: 'Parent portal for wards.', system: true },
  { id: 'employee', name: 'Employee', users: 380, description: 'Employee self-service portal.', system: true },
]);

lazy(db, 'users', () => {
  const out = [];
  let n = 0;
  for (const s of db.staff.slice(0, PROVISIONED_STAFF)) {
    n++;
    const r = makeRng('usr' + s.id);
    const role = roleForStaff(s);
    out.push({
      id: 'USR' + pad(n, 4),
      username: s.email.split('@')[0],
      name: s.name,
      email: s.email,
      role,
      roleName: (ROLE_DEFS.find((x) => x.id === role) || {}).name || role,
      employeeId: s.id,
      campusId: s.campusId,
      status: r.weighted([['Active', 92], ['Locked', 3], ['Inactive', 5]]),
      twoFactor: r.bool(0.3),
      lastLogin: `2026-08-${pad(r.int(14, 20), 2)}T${pad(r.int(7, 19), 2)}:${pad(r.int(0, 59), 2)}:00`,
      createdAt: s.joiningDate,
      avatarInitials: s.avatarInitials,
      loginCount: r.int(20, 2400),
    });
  }
  return out;
});

lazy(db, 'auditLogs', () => {
  const out = [];
  const actions = ['Created','Updated','Deleted','Approved','Rejected','Exported','Logged in','Logged out','Published','Imported','Reverted'];
  for (let i = 1; i <= 500; i++) {
    const r = makeRng('aud' + i);
    const u = db.users[(i * 7) % db.users.length];
    out.push({
      id: 'AUD' + pad(i, 5),
      timestamp: `2026-08-${pad(r.int(10, 20), 2)}T${pad(r.int(6, 21), 2)}:${pad(r.int(0, 59), 2)}:${pad(r.int(0, 59), 2)}`,
      userId: u.id,
      userName: u.name,
      role: u.roleName,
      action: r.pick(actions),
      module: r.pick(PERMISSION_MODULES),
      entity: r.pick(['Student', 'Invoice', 'Employee', 'Marks', 'Route', 'Book', 'Circular', 'Fee Structure', 'Timetable', 'User']),
      entityId: r.pick(['STU00421', 'INV000912', 'EMP0123', 'RTE007', 'BK00821']),
      description: r.pick(['Record updated via the web console.', 'Bulk export of 240 rows.', 'Approval granted after review.', 'New record created.', 'Password reset performed.']),
      ip: `10.${r.int(0, 20)}.${r.int(0, 255)}.${r.int(2, 254)}`,
      device: r.pick(['Chrome / Windows', 'Edge / Windows', 'Safari / macOS', 'Chrome / Android', 'Safari / iOS']),
      campusId: u.campusId,
      severity: r.weighted([['Info', 78], ['Warning', 16], ['Critical', 6]]),
    });
  }
  return out;
});

lazy(db, 'loginHistory', () => {
  const out = [];
  for (let i = 1; i <= 320; i++) {
    const r = makeRng('lgn' + i);
    const u = db.users[(i * 11) % db.users.length];
    const ok = r.bool(0.9);
    out.push({
      id: 'LGN' + pad(i, 4),
      userId: u.id,
      userName: u.name,
      role: u.roleName,
      timestamp: `2026-08-${pad(r.int(12, 20), 2)}T${pad(r.int(6, 22), 2)}:${pad(r.int(0, 59), 2)}:00`,
      ip: `${r.int(49, 203)}.${r.int(0, 255)}.${r.int(0, 255)}.${r.int(2, 254)}`,
      location: r.pick(['Gurugram, HR', 'Noida, UP', 'Bengaluru, KA', 'Pune, MH', 'Hyderabad, TS', 'New Delhi, DL']),
      device: r.pick(['Chrome / Windows', 'Edge / Windows', 'Safari / macOS', 'Chrome / Android', 'Safari / iOS']),
      result: ok ? 'Success' : 'Failed',
      reason: ok ? null : r.pick(['Wrong password', 'Account locked', 'Expired session', 'MFA failed']),
      sessionMinutes: ok ? r.int(3, 240) : 0,
    });
  }
  return out;
});

lazy(db, 'notifications', () => ([
  { id: 'N1', title: 'Fee collection target achieved', text: 'Q2 collection crossed 92% of target for the Main Campus.', tone: 'success', icon: 'wallet', time: '12 minutes ago', unread: true, route: 'fees/reports' },
  { id: 'N2', title: '3 leave requests await approval', text: 'Two teaching and one non-teaching request pending since yesterday.', tone: 'warning', icon: 'clipboard-list', time: '48 minutes ago', unread: true, route: 'hr/leave-requests' },
  { id: 'N3', title: 'Bus VEH-014 running late', text: 'Route R12 delayed by 18 minutes due to traffic near Sohna Road.', tone: 'danger', icon: 'bus', time: '1 hour ago', unread: true, route: 'transport/tracking' },
  { id: 'N4', title: 'Half-Yearly datesheet published', text: 'Datesheet for Class IX–XII circulated to all parents.', tone: 'info', icon: 'calendar', time: '3 hours ago', unread: false, route: 'examination/schedule' },
  { id: 'N5', title: '18 admission applications received', text: 'New online applications submitted for Class VI intake.', tone: 'brand', icon: 'user-plus', time: '5 hours ago', unread: false, route: 'admissions/applications' },
  { id: 'N6', title: 'Library: 42 books overdue', text: 'Reminders queued for dispatch this evening.', tone: 'warning', icon: 'book', time: 'Yesterday', unread: false, route: 'library/fines' },
  { id: 'N7', title: 'Payroll for July disbursed', text: '380 employees paid, bank file acknowledged.', tone: 'success', icon: 'banknote', time: 'Yesterday', unread: false, route: 'hr/payroll-runs' },
  { id: 'N8', title: 'Attendance below 75% — 64 students', text: 'Defaulter list generated for class teacher review.', tone: 'danger', icon: 'alert-triangle', time: '2 days ago', unread: false, route: 'attendance/defaulters' },
]));

lazy(db, 'settings', () => ({
  school: {
    name: 'Springdale International School Group',
    tagline: 'Learning without limits',
    registrationNo: 'SIS/HR/1998/0042',
    trustName: 'Springdale Education Trust',
    established: 1998,
    email: 'info@springdale.edu.in',
    phone: '+91 124 4567 800',
    website: 'www.springdale.edu.in',
    address: 'Plot 12, Sector 42, Gurugram, Haryana 122002',
    logo: null,
  },
  session: { currentYear: 'AY2026', startMonth: 'April', endMonth: 'March', weekOff: 'Sunday', workingDays: 6, attendanceMode: 'Daily + Period' },
  fee: { currency: 'INR', symbol: '₹', lateFeePerDay: 50, gracePeriodDays: 7, autoReminder: true, reminderDays: [3, 1, -1, -7], gateway: 'Razorpay' },
  email: { provider: 'SMTP', host: 'smtp.springdale.edu.in', port: 587, encryption: 'TLS', fromName: 'Springdale International', fromEmail: 'noreply@springdale.edu.in', status: 'Connected' },
  sms: { provider: 'MSG91', senderId: 'SPDALE', dltRegistered: true, balance: 148200, status: 'Connected' },
  whatsapp: { provider: 'Gupshup', businessNumber: '+91 124 4567 899', templatesApproved: 12, status: 'Connected' },
  payment: { gateway: 'Razorpay', mode: 'Live', mdr: '1.18%', settlementDays: 2, status: 'Connected' },
  biometric: { vendor: 'ESSL', devices: 25, syncInterval: '5 min', status: 'Connected' },
  rfid: { vendor: 'Impinj', readers: 18, cardsIssued: 2380, status: 'Connected' },
  security: { passwordMinLength: 10, passwordExpiryDays: 90, mfaRequired: false, sessionTimeoutMin: 45, ipAllowlist: false, maxFailedLogins: 5 },
  backup: { frequency: 'Daily 02:00 IST', retentionDays: 30, lastBackup: '2026-08-20T02:00:00', size: '4.2 GB', destination: 'AWS S3 (ap-south-1)', status: 'Healthy' },
}));

/* ==================================================== query helpers ===== */

/** Find a record by id inside a collection. */
export function byId(collection, id, key = 'id') {
  if (!Array.isArray(collection)) return null;
  return collection.find((r) => r[key] === id) || null;
}

/**
 * Filter a collection by a predicate object or function.
 * where(db.students, { campusId: 'C1', status: 'Active' })
 * where(db.students, s => s.cgpa > 9)
 */
export function where(collection, predicate) {
  if (!Array.isArray(collection)) return [];
  if (typeof predicate === 'function') return collection.filter(predicate);
  if (!predicate) return collection.slice();
  const entries = Object.entries(predicate).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'all');
  if (!entries.length) return collection.slice();
  return collection.filter((row) => entries.every(([k, v]) => (Array.isArray(v) ? v.includes(row[k]) : row[k] === v)));
}

/** Case-insensitive search across the given keys (or all string values). */
export function search(collection, term, keys) {
  if (!term) return collection.slice();
  const q = String(term).toLowerCase();
  return collection.filter((row) => {
    const vals = keys ? keys.map((k) => row[k]) : Object.values(row);
    return vals.some((v) => v != null && typeof v !== 'object' && String(v).toLowerCase().includes(q));
  });
}

/** Sort a copy of the collection. dir is 'asc' | 'desc'. */
export function sortBy(collection, key, dir = 'asc') {
  const mul = dir === 'desc' ? -1 : 1;
  return collection.slice().sort((a, b) => {
    const x = typeof key === 'function' ? key(a) : a[key];
    const y = typeof key === 'function' ? key(b) : b[key];
    if (x == null) return 1;
    if (y == null) return -1;
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * mul;
    return String(x).localeCompare(String(y), 'en', { numeric: true }) * mul;
  });
}

/** Slice a collection into a page. Returns {rows, page, pageSize, total, pages}. */
export function paginate(collection, page = 1, pageSize = 25) {
  const total = collection.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, page), pages);
  return { rows: collection.slice((p - 1) * pageSize, p * pageSize), page: p, pageSize, total, pages };
}

/** Group rows into a Map keyed by a field or function. */
export function groupBy(collection, key) {
  const m = new Map();
  for (const row of collection) {
    const k = typeof key === 'function' ? key(row) : row[key];
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(row);
  }
  return m;
}

export function sum(collection, key) {
  return collection.reduce((a, r) => a + (Number(typeof key === 'function' ? key(r) : r[key]) || 0), 0);
}
export function avg(collection, key) {
  return collection.length ? sum(collection, key) / collection.length : 0;
}
export function count(collection, predicate) { return where(collection, predicate).length; }
export function distinct(collection, key) {
  return Array.from(new Set(collection.map((r) => (typeof key === 'function' ? key(r) : r[key])))).filter((v) => v != null);
}
export function minOf(collection, key) { return collection.reduce((m, r) => Math.min(m, Number(r[key]) || 0), Infinity); }
export function maxOf(collection, key) { return collection.reduce((m, r) => Math.max(m, Number(r[key]) || 0), -Infinity); }

/**
 * Flatten a structured address into one printable line.
 *
 * `staff[].address`, `students[].address`, `parents[].address` and friends are
 * objects ({line1,line2,city,state,pincode,country}), not strings — dropping
 * one straight into a DescriptionList renders "[object Object]". Use this
 * anywhere an address is displayed as text.
 *
 * @param {object|string|null} addr
 * @param {{country?: boolean}} [opts] include the country (default false)
 * @returns {string}
 */
export function formatAddress(addr, { country = false } = {}) {
  if (!addr) return '—';
  if (typeof addr === 'string') return addr;
  const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode];
  if (country) parts.push(addr.country);
  return parts.filter(Boolean).join(', ') || '—';
}

/** Counts per distinct value: countBy(db.students,'house') -> [{key,value}] sorted desc. */
export function countBy(collection, key) {
  const m = groupBy(collection, key);
  return Array.from(m.entries()).map(([k, rows]) => ({ key: String(k), value: rows.length })).sort((a, b) => b.value - a.value);
}

/** Sum per distinct value: sumBy(db.payments,'mode','amount'). */
export function sumBy(collection, key, valueKey) {
  const m = groupBy(collection, key);
  return Array.from(m.entries()).map(([k, rows]) => ({ key: String(k), value: sum(rows, valueKey) })).sort((a, b) => b.value - a.value);
}

/** Composite 360-degree student record (documents, history, timeline). Memoised. */
const _s360 = new Map();
export function student360(studentId) {
  if (_s360.has(studentId)) return _s360.get(studentId);
  const s = byId(db.students, studentId);
  if (!s) return null;
  const r = makeRng('s360' + studentId);
  const docs = ['Birth Certificate', 'Aadhaar Card', 'Transfer Certificate', 'Previous Marksheet', 'Address Proof',
    'Passport Photo', 'Medical Certificate', 'Caste Certificate'].map((name, i) => ({
    id: `${studentId}-DOC${i + 1}`,
    name,
    type: r.pick(['PDF', 'JPG', 'PNG']),
    sizeKb: r.int(60, 2400),
    uploadedOn: iso(r.date('2020-01-01', '2026-06-01')),
    status: r.weighted([['Verified', 72], ['Pending', 20], ['Rejected', 8]]),
    verifiedBy: r.bool(0.7) ? 'Admissions Desk' : null,
  }));
  const history = [];
  for (let lvl = Math.max(0, s.classLevel - 4); lvl <= s.classLevel; lvl++) {
    const cd = CLASS_DEFS.find((c) => c.level === lvl);
    if (!cd) continue;
    history.push({
      year: `${2026 - (s.classLevel - lvl)}-${String(2027 - (s.classLevel - lvl)).slice(2)}`,
      className: cd.name,
      section: s.section,
      percent: round(Math.max(38, Math.min(99, s.lastExamPercent + r.gaussian(0, 5))), 1),
      grade: gradeFor(s.lastExamPercent),
      attendance: round(Math.max(60, Math.min(100, s.attendancePct + r.gaussian(0, 4))), 1),
      rank: r.int(1, 40),
      result: 'Promoted',
    });
  }
  const subs = subjectsForLevel(s.classLevel, s.stream);
  const subjectScores = subs.map((code) => ({
    subjectCode: code,
    subjectName: (SUBJECT_DEFS.find((x) => x.code === code) || {}).name || code,
    marks: Math.round(Math.max(20, Math.min(100, s.cgpa * 9.5 + r.gaussian(0, 8)))),
    maxMarks: 100,
    grade: gradeFor(Math.max(20, Math.min(100, s.cgpa * 9.5 + r.gaussian(0, 8)))),
    teacher: r.pick(db.staff.filter((x) => x.type === 'Teaching' && x.campusId === s.campusId)).name,
  }));
  const timeline = [
    { date: s.admissionDate, title: 'Admission confirmed', text: `Admitted to ${s.className} at ${(byId(db.campuses, s.campusId) || {}).name}.`, icon: 'user-plus', tone: 'success' },
    { date: '2026-04-08', title: 'Session 2026-27 started', text: `Allocated to section ${s.section}, ${s.house} House.`, icon: 'calendar', tone: 'brand' },
    { date: '2026-05-16', title: 'Periodic Test 1 results', text: `Scored ${s.lastExamPercent}% — rank ${s.rank} in class.`, icon: 'file-text', tone: 'info' },
    { date: '2026-07-10', title: 'Fee instalment received', text: `Q2 payment of ₹${Math.round(s.feeTotal / 4).toLocaleString('en-IN')} recorded.`, icon: 'wallet', tone: 'success' },
    { date: '2026-08-06', title: 'Periodic Test 2 completed', text: 'Marks entry closed for all subjects.', icon: 'clipboard-check', tone: 'default' },
  ];
  if (s.awardsCount > 0) timeline.push({ date: '2026-08-12', title: 'Award received', text: 'Recognised at the monthly assembly.', icon: 'award', tone: 'warning' });
  const result = { student: s, documents: docs, academicHistory: history, subjectScores, timeline,
    guardians: db.parents.filter((p) => p.studentIds.includes(s.id)),
    siblings: s.siblingIds.map((id) => byId(db.students, id)).filter(Boolean),
    invoices: db.invoices.filter((i) => i.studentId === s.id),
    payments: db.payments.filter((p) => p.studentId === s.id),
    bookIssues: db.bookIssues.filter((b) => b.studentId === s.id),
    healthRecord: db.healthRecords.find((h) => h.studentId === s.id) || null,
    awards: db.awards.filter((a) => a.studentId === s.id),
  };
  _s360.set(studentId, result);
  return result;
}

export const query = { byId, where, search, sortBy, paginate, groupBy, sum, avg, count, distinct, countBy, sumBy, minOf, maxOf, student360, subjectsForLevel, gradeFor, formatAddress };

/* ================================================== precomputed analytics */

export const analytics = {};

/**
 * Monthly collection against the billing plan — read straight off db.payments,
 * so the chart total equals the money on the receipts screen and the KPI strip.
 * The plan is the instalment schedule: Q1 lands in Apr–Jun, Q2 in Jul–Sep, and
 * so on, which is exactly how the invoices are dated.
 */
lazy(analytics, 'feeCollectionVsTarget', () => {
  const billedPerQuarter = sum(db.invoices, 'amount') / 4;
  // A quarter's bill is expected across its three months, front-loaded.
  const shape = [0.55, 0.3, 0.15];
  const plan = MONTHS_AY.map((_, i) => Math.round(billedPerQuarter * shape[i % 3]));
  const actual = new Map();
  for (const p of db.payments) {
    if (p.status !== 'Success') continue;
    actual.set(p.month, (actual.get(p.month) || 0) + p.amount);
  }
  return MONTHS_AY.map((m, i) => {
    const target = plan[i];
    const collected = actual.get(m) || 0;
    return { month: m, target, collected, achieved: collected ? round((collected / target) * 100, 1) : 0 };
  });
});

/** Monthly attendance, averaged off the actual registers rather than invented. */
lazy(analytics, 'attendanceTrend', () => {
  const stu = groupBy(db.attendance, (a) => a.date.slice(0, 7));
  const stf = groupBy(db.staffAttendance, (a) => a.date.slice(0, 7));
  const months = Array.from(new Set([...stu.keys(), ...stf.keys()])).sort();
  return months.map((key) => {
    const sRows = stu.get(key) || [];
    const fRows = stf.get(key) || [];
    const present = sum(sRows, 'present');
    const strength = sum(sRows, 'strength');
    const staffPresent = fRows.filter((a) => a.status === 'Present' || a.status === 'On Duty').length;
    return {
      month: MONTHS_AY[monthIndexAY(new Date(`${key}-01`))],
      students: strength ? round((present / strength) * 100, 1) : 0,
      staff: fRows.length ? round((staffPresent / fRows.length) * 100, 1) : 0,
      target: 90,
    };
  });
});

/** Attendance and roll per class, derived from the roster that the class lists show. */
lazy(analytics, 'attendanceByClass', () => {
  const byName = groupBy(db.students.filter((s) => s.status === 'Active'), 'className');
  return CLASS_DEFS.map((c) => {
    const rows = byName.get(c.name) || [];
    return {
      className: c.name,
      level: c.level,
      percent: rows.length ? round(avg(rows, 'attendancePct'), 1) : 0,
      strength: rows.length,
      belowThreshold: rows.filter((s) => s.attendancePct < 75).length,
    };
  });
});

/**
 * The real pipeline: every stage counts the enquiries that have reached *at
 * least* that far. The old fixed ladder (1,840 → 392) claimed three times the
 * enquiries the admissions screens actually list.
 */
lazy(analytics, 'admissionFunnel', () => {
  const stages = [
    ['Enquiries', 0], ['Contacted', 1], ['Applications', 3], ['Documents Verified', 4],
    ['Entrance Test', 5], ['Interview', 6], ['Offers', 7], ['Admitted', 8],
  ];
  const reached = (min) => db.enquiries.filter((e) => {
    const idx = ENQ_STAGES.indexOf(e.stage);
    return idx >= min && e.stage !== 'Lost';
  }).length + (min === 0 ? db.enquiries.filter((e) => e.stage === 'Lost').length : 0);
  const counts = stages.map(([, min]) => reached(min));
  return stages.map(([stage], i) => ({
    stage, count: counts[i],
    conversion: counts[0] ? round((counts[i] / counts[0]) * 100, 1) : 0,
    dropOff: i === 0 ? 0 : counts[i - 1] - counts[i],
  }));
});

/** Where the enquiries actually came from. */
lazy(analytics, 'admissionSourceSplit', () => countBy(db.enquiries, 'source'));

/**
 * Enquiry → application → admission, month by month off db.enquiries. The axis
 * follows the admission cycle (which opens in January, months before the April
 * session), not the academic-year calendar — that is where the records are.
 */
lazy(analytics, 'admissionTrend', () => {
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const byMonth = groupBy(db.enquiries, (e) => e.createdAt.slice(0, 7));
  return Array.from(byMonth.keys()).sort().map((key) => {
    const rows = byMonth.get(key);
    return {
      month: MON[Number(key.slice(5, 7)) - 1],
      period: key,
      enquiries: rows.length,
      applications: rows.filter((e) => ENQ_STAGES.indexOf(e.stage) >= 3).length,
      admitted: rows.filter((e) => e.stage === 'Admitted').length,
    };
  });
});

/** Per-class results, computed from the same students the merit lists rank. */
lazy(analytics, 'classPerformance', () => {
  const byName = groupBy(db.students.filter((s) => s.status === 'Active'), 'className');
  return CLASS_DEFS.filter((c) => c.level >= 3).map((c) => {
    const rows = byName.get(c.name) || [];
    const passed = rows.filter((s) => s.lastExamPercent >= 33).length;
    return {
      className: c.name,
      level: c.level,
      average: rows.length ? round(avg(rows, 'lastExamPercent'), 1) : 0,
      passPercent: rows.length ? round((passed / rows.length) * 100, 1) : 0,
      distinctions: rows.filter((s) => s.lastExamPercent >= 75).length,
      strength: rows.length,
    };
  });
});

/** Subject results tallied off db.marks — the same rows the marks screens grade. */
lazy(analytics, 'subjectPerformance', () => {
  const byName = groupBy(db.marks, 'subjectName');
  return ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi', 'Computer Science']
    .map((name) => {
      const rows = byName.get(name) || [];
      if (!rows.length) return { subject: name, average: 0, highest: 0, lowest: 0, passPercent: 0, entries: 0 };
      const pcts = rows.map((m) => m.percent);
      return {
        subject: name,
        average: round(avg(rows, 'percent'), 1),
        highest: round(Math.max(...pcts), 1),
        lowest: round(Math.min(...pcts), 1),
        passPercent: round((rows.filter((m) => m.status === 'Pass').length / rows.length) * 100, 1),
        entries: rows.length,
      };
    });
});

/** Matrix heatmap: class (rows) x subject (cols) average score, from db.marks. */
lazy(analytics, 'performanceMatrix', () => {
  const cols = [['English', 'ENG'], ['Maths', 'MAT'], ['Science', 'SCI'], ['Social', 'SST'], ['Hindi', 'HIN'], ['Computer', 'CSC']];
  const rows = ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const names = rows.map((code) => (CLASS_DEFS.find((c) => c.code === code) || {}).name);
  const byClass = groupBy(db.marks, 'className');
  return {
    rows,
    cols: cols.map((c) => c[0]),
    values: names.map((className) => {
      const set = byClass.get(className) || [];
      return cols.map(([, code]) => {
        const hit = set.filter((m) => m.subjectCode === code);
        return hit.length ? round(avg(hit, 'percent'), 1) : null;
      });
    }),
  };
});

/** Money in vs money out, month by month — both sides read off the ledgers. */
lazy(analytics, 'revenueVsExpense', () => {
  const rev = new Map();
  for (const p of db.payments) {
    if (p.status !== 'Success') continue;
    rev.set(p.month, (rev.get(p.month) || 0) + p.amount);
  }
  const exp = new Map();
  for (const e of db.expenses) {
    if (e.status === 'Rejected') continue;
    exp.set(e.month, (exp.get(e.month) || 0) + e.amount);
  }
  return MONTHS_AY.map((m) => {
    const revenue = rev.get(m) || 0;
    const expense = exp.get(m) || 0;
    return { month: m, revenue, expense, surplus: revenue - expense };
  });
});

/** Expense mix straight from the voucher ledger (was a hand-written list that
 *  disagreed with db.expenses by ₹7 crore on salaries alone). */
lazy(analytics, 'expenseByCategory', () => sumBy(db.expenses.filter((e) => e.status !== 'Rejected'), 'category', 'amount'));

/** Fee income by head, apportioned from the published fee structures and the
 *  transport / hostel books, scaled to money actually collected. */
lazy(analytics, 'feeHeadSplit', () => {
  const collected = sum(db.invoices, 'paid');
  const structures = db.feeStructures;
  const heads = new Map();
  for (const f of structures) {
    for (const c of f.components) {
      if (!c.amount) continue;
      heads.set(c.name, (heads.get(c.name) || 0) + c.amount);
    }
  }
  const structureTotal = Array.from(heads.values()).reduce((a, b) => a + b, 0) || 1;
  const out = Array.from(heads, ([key, value]) => ({ key, value: Math.round((value / structureTotal) * collected) }));
  out.push({ key: 'Transport Fee', value: Math.round(sum(db.routes, 'monthlyRevenue') * 5) });
  out.push({ key: 'Hostel & Mess', value: Math.round(sum(db.hostelAllocations, 'monthlyFee') * 5) });
  return out.sort((a, b) => b.value - a.value);
});

/**
 * Share of collection by payment mode, as a percentage — counted off the real
 * receipts instead of a hand-written list. `value` stays a percentage because
 * every caller labels it "share of receipts"; `amount` carries the rupees.
 */
lazy(analytics, 'feeModeSplit', () => {
  const rows = sumBy(db.payments.filter((p) => p.status === 'Success'), 'mode', 'amount');
  const total = rows.reduce((a, r) => a + r.value, 0) || 1;
  return rows.map((r) => ({ key: r.key, value: round((r.value / total) * 100, 1), amount: r.value }));
});

/** Staff attendance mix by month, tallied off the real register. */
lazy(analytics, 'staffAttendance', () => {
  const byMonth = groupBy(db.staffAttendance, (a) => a.date.slice(0, 7));
  return Array.from(byMonth.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([key, rows]) => {
    const share = (test) => round((rows.filter(test).length / rows.length) * 100, 1);
    return {
      month: MONTHS_AY[monthIndexAY(new Date(`${key}-01`))],
      present: share((a) => a.status === 'Present' || a.status === 'On Duty'),
      leave: share((a) => a.status === 'On Leave' || a.status === 'Half Day'),
      absent: share((a) => a.status === 'Absent'),
    };
  });
});

/** Headcount by function — counted off db.staff, which is what the HR roster shows. */
lazy(analytics, 'staffSplit', () => {
  const bucket = (s) => {
    if (s.type === 'Teaching') return 'Teaching';
    if (['Transport'].includes(s.department)) return 'Transport';
    if (['Security'].includes(s.department)) return 'Security';
    if (['Health & Wellness'].includes(s.department)) return 'Health';
    if (['Administration', 'Front Office', 'Accounts & Finance', 'Human Resources', 'Admissions', 'IT & Systems'].includes(s.department)) return 'Administration';
    return 'Support';
  };
  return countBy(db.staff, bucket);
});

lazy(analytics, 'transportUtilisation', () => {
  const r = makeRng('an-trn');
  return db.routes.slice(0, 12).map((rt) => ({
    route: rt.code,
    routeName: rt.name,
    capacity: rt.capacity,
    used: Math.min(rt.capacity, rt.studentCount),
    utilisation: round((Math.min(rt.capacity, rt.studentCount) / rt.capacity) * 100, 1),
    onTime: round(r.float(78, 99), 1),
  }));
});

lazy(analytics, 'hostelOccupancy', () => {
  void db.hostelAllocations.length; // reconciles hostel occupancy before we read it
  return db.hostels.map((h) => ({
    hostel: h.name,
    capacity: h.capacity,
    occupied: h.occupied,
    vacant: h.capacity - h.occupied,
    occupancy: round((h.occupied / Math.max(1, h.capacity)) * 100, 1),
  }));
});

/** Circulation counted off db.bookIssues rather than invented per month. */
lazy(analytics, 'libraryCirculation', () => {
  const byMonth = groupBy(db.bookIssues, (b) => b.issueDate.slice(0, 7));
  const returns = groupBy(db.bookIssues.filter((b) => b.returnDate), (b) => b.returnDate.slice(0, 7));
  const keys = Array.from(new Set([...byMonth.keys(), ...returns.keys()])).sort();
  return keys.map((key) => ({
    month: MONTHS_AY[monthIndexAY(new Date(`${key}-01`))],
    issued: (byMonth.get(key) || []).length,
    returned: (returns.get(key) || []).length,
    overdue: (byMonth.get(key) || []).filter((b) => b.status === 'Overdue').length,
  }));
});

/** Titles per category, from the real catalogue. */
lazy(analytics, 'libraryCategorySplit', () => countBy(db.books, 'category').slice(0, 8));

lazy(analytics, 'genderSplit', () => {
  const boys = db.students.filter((s) => s.gender === 'Male').length;
  return [{ key: 'Boys', value: boys }, { key: 'Girls', value: db.students.length - boys }];
});

lazy(analytics, 'categorySplit', () => countBy(db.students, 'category'));
lazy(analytics, 'houseSplit', () => countBy(db.students, 'house'));
lazy(analytics, 'religionSplit', () => countBy(db.students, 'religion'));

lazy(analytics, 'enrolmentByClass', () => {
  const m = groupBy(db.students, 'className');
  return CLASS_DEFS.map((c) => ({ className: c.name, level: c.level, value: (m.get(c.name) || []).length }));
});

lazy(analytics, 'enrolmentByCampus', () => db.campuses.map((c) => ({
  key: c.name.split('—')[1] ? c.name.split('—')[1].trim() : c.name,
  value: db.students.filter((s) => s.campusId === c.id).length,
  capacity: c.studentCapacity,
})));

lazy(analytics, 'enrolmentTrend', () => ([
  { year: '2022-23', students: 1842, staff: 302 },
  { year: '2023-24', students: 2016, staff: 324 },
  { year: '2024-25', students: 2184, staff: 346 },
  { year: '2025-26', students: 2298, staff: 362 },
  { year: '2026-27', students: 2400, staff: 380 },
]));

lazy(analytics, 'topPerformers', () => sortBy(db.students.filter((s) => s.status === 'Active'), 'lastExamPercent', 'desc')
  .slice(0, 12)
  .map((s, i) => ({ rank: i + 1, id: s.id, name: s.name, className: s.className, section: s.section, house: s.house,
    percent: s.lastExamPercent, cgpa: s.cgpa, avatarInitials: s.avatarInitials, campusId: s.campusId })));

/**
 * Fee defaulters: students whose *due* instalments are unpaid. Keyed off
 * `feeOverdue`, not the annual balance — with the whole year billed up front
 * almost everyone carries a balance, but only a minority are actually late.
 * The list is no longer truncated to a group-wide top-40, so a campus filter
 * still has rows to show.
 */
lazy(analytics, 'defaulters', () => sortBy(db.students.filter((s) => s.status === 'Active' && s.feeOverdue > 0), 'feeOverdue', 'desc')
  .map((s) => {
    const oldest = db.invoices
      .filter((i) => i.studentId === s.id && i.balance > 0 && i.overdueDays > 0)
      .reduce((m, i) => Math.max(m, i.overdueDays), 0);
    return {
      id: s.id, name: s.name, admissionNo: s.admissionNo, className: s.className, section: s.section,
      due: s.feeOverdue, balance: s.feeDue, total: s.feeTotal, paid: s.feePaid, phone: s.phone,
      campusId: s.campusId, overdueDays: oldest, avatarInitials: s.avatarInitials,
    };
  }));

/** Students below the 75% board minimum — a real list now that attendance has a tail. */
lazy(analytics, 'attendanceDefaulters', () => sortBy(db.students.filter((s) => s.status === 'Active' && s.attendancePct < 75), 'attendancePct', 'asc')
  .map((s) => ({ id: s.id, name: s.name, className: s.className, section: s.section, percent: s.attendancePct,
    present: s.presentDays, total: s.totalDays, absent: s.totalDays - s.presentDays,
    shortfallDays: Math.max(0, Math.ceil(s.totalDays * 0.75) - s.presentDays),
    campusId: s.campusId, avatarInitials: s.avatarInitials })));

/**
 * Calendar heatmap of daily attendance. Reads the register where one exists and
 * leaves holidays, Sundays and the summer vacation genuinely blank — the old
 * version painted a random 80–98% onto every non-Sunday, vacation included.
 */
lazy(analytics, 'attendanceCalendar', () => {
  const working = new Set(schoolDays());
  const byDate = groupBy(db.attendance, 'date');
  const out = [];
  let d = new Date('2026-04-01');
  while (d < new Date('2026-08-21')) {
    const key = iso(d);
    const rows = byDate.get(key);
    let value = null;
    if (rows && rows.length) value = round((sum(rows, 'present') / Math.max(1, sum(rows, 'strength'))) * 100, 1);
    out.push({ date: key, value, working: working.has(key) });
    d = addDays(d, 1);
  }
  return out;
});

/** Applications, seats and admissions per class — off db.enquiries and db.sections. */
lazy(analytics, 'admissionsByClass', () => {
  const byClass = groupBy(db.enquiries, 'className');
  return CLASS_DEFS.map((c) => {
    const rows = byClass.get(c.name) || [];
    const seats = db.sections
      .filter((s) => (byId(db.classes, s.classId) || {}).level === c.level)
      .reduce((a, s) => a + (s.capacity - s.strength), 0);
    return {
      className: c.name,
      applications: rows.filter((e) => ENQ_STAGES.indexOf(e.stage) >= 3).length,
      enquiries: rows.length,
      seats: Math.max(0, seats),
      admitted: rows.filter((e) => e.stage === 'Admitted').length,
    };
  });
});

/** Tickets raised vs resolved vs SLA-breached, month by month off db.complaints. */
lazy(analytics, 'complaintTrend', () => {
  const raised = groupBy(db.complaints, (c) => c.createdAt.slice(0, 7));
  const closed = groupBy(db.complaints.filter((c) => c.resolvedAt), (c) => c.resolvedAt.slice(0, 7));
  const keys = Array.from(new Set([...raised.keys(), ...closed.keys()])).sort();
  return keys.map((key) => ({
    month: MONTHS_AY[monthIndexAY(new Date(`${key}-01`))],
    raised: (raised.get(key) || []).length,
    resolved: (closed.get(key) || []).length,
    breached: (raised.get(key) || []).filter((c) => c.slaBreached).length,
  }));
});

lazy(analytics, 'inventoryValueByCategory', () => {
  void db.inventoryItems.length; // fills itemCategories.items / .value
  return db.itemCategories.map((c) => ({ key: c.name, value: c.value })).filter((c) => c.value > 0);
});

lazy(analytics, 'budgetUtilisation', () => db.budgets.map((b) => ({
  head: b.head, allocated: b.allocated, spent: b.spent, utilisation: b.utilisation, status: b.status,
})));

/* Derived from the students collection only, so the headline KPIs never force
   generation of the heavy invoice/payment/book collections on first paint. */
lazy(analytics, 'kpis', () => {
  const students = db.students;
  const active = students.filter((s) => s.status === 'Active');
  const collected = sum(active, 'feePaid');
  const billed = sum(active, 'feeTotal');       // whole session, all four instalments
  const dueToDate = sum(active, 'feeBilled');   // the instalments that have fallen due
  const overdue = sum(active, 'feeOverdue');
  const openTickets = db.complaints.filter((c) => !['Resolved', 'Closed'].includes(c.status));
  return {
    totalStudents: students.length,
    activeStudents: active.length,
    totalStaff: db.staff.length,
    teachingStaff: db.staff.filter((s) => s.type === 'Teaching').length,
    campuses: db.campuses.length,
    studentTeacherRatio: round(active.length / Math.max(1, db.staff.filter((s) => s.type === 'Teaching').length), 1),
    avgAttendance: round(avg(active, 'attendancePct'), 1),
    avgStaffAttendance: round(avg(db.staff, 'attendancePct'), 1),
    feeCollected: collected,
    feeBilled: billed,
    feeOutstanding: Math.max(0, billed - collected),
    feeDueToDate: dueToDate,
    feeOverdue: overdue,
    // Measured against what has actually fallen due — collecting 51% of an
    // annual bill five months into a twelve-month session is *on plan*, so
    // dividing by the annual figure would paint every campus red.
    collectionRate: round(((dueToDate - overdue) / Math.max(1, dueToDate)) * 100, 1),
    collectionRateAnnual: round((collected / Math.max(1, billed)) * 100, 1),
    defaulterCount: active.filter((s) => s.feeOverdue > 0).length,
    admissionEnquiries: db.enquiries.length,
    admissionsConfirmed: db.enquiries.filter((e) => e.stage === 'Admitted').length,
    conversionRate: round((db.enquiries.filter((e) => e.stage === 'Admitted').length / Math.max(1, db.enquiries.length)) * 100, 1),
    booksTotal: BOOK_COUNT, // db.books.length, without generating the catalogue
    booksIssued: sum(students, 'booksIssued'),
    vehicles: db.vehicles.length,
    routes: db.routes.length,
    transportStudents: students.filter((s) => s.transportOpted).length,
    hostelStudents: db.hostelAllocations.filter((a) => a.status !== 'Vacated').length,
    hostelOccupancy: round((sum(db.hostels, 'occupied') / Math.max(1, sum(db.hostels, 'capacity'))) * 100, 1),
    // These two were hard-coded at 118 / 14 while the complaints screen they
    // link to listed 148 open and 145 breached.
    openComplaints: openTickets.length,
    slaBreaches: openTickets.filter((c) => c.slaBreached).length,
    pendingLeaves: db.leaveRequests.filter((l) => l.status === 'Pending').length,
    upcomingEvents: db.events.filter((e) => e.status === 'Upcoming').length,
    alumni: db.alumni.length,
    payrollMonthly: sum(db.staff, 'salaryNet'),
  };
});

/**
 * 12-point trend arrays for the KPI sparklines.
 *
 * Each series now *ends on the live figure* and walks backwards with a gentle
 * drift, instead of being an unrelated random ramp. That matters twice over:
 * the sparkline under a stat card is the history of the number printed on it,
 * and `deltaOf(spark)` — the "vs last month" badge every dashboard shows — is a
 * real month-on-month move rather than a decoration.
 */
lazy(analytics, 'sparks', () => {
  const r = makeRng('an-spark');
  const k = analytics.kpis;
  const walk = (end, growth, vol, { max = Infinity, digits = 1 } = {}) => {
    const out = new Array(12);
    out[11] = round(end, digits);
    for (let i = 10; i >= 0; i--) {
      const step = 1 + growth + r.gaussian(0, vol);
      out[i] = round(Math.min(max, Math.max(0, out[i + 1] / (step || 1))), digits);
    }
    return out;
  };
  const fleet = avg(analytics.transportUtilisation, 'utilisation');
  // Monthly run-rates from the roll and the payroll rather than from the full
  // ledger — sparks are read by every dashboard, and forcing db.payments and
  // db.expenses here would put half a second on every first paint.
  const monthsElapsed = 5;
  const revenuePerMonth = Math.round(k.feeCollected / monthsElapsed);
  const expensePerMonth = Math.round(k.payrollMonthly * 1.35);
  return {
    students: walk(k.activeStudents, 0.004, 0.004, { digits: 0 }),
    attendance: walk(k.avgAttendance, 0.002, 0.006, { max: 100 }),
    collection: walk(k.feeCollected, 0.05, 0.04, { digits: 0 }),
    outstanding: walk(k.feeOutstanding, -0.03, 0.05, { digits: 0 }),
    admissions: walk(Math.max(1, Math.round(k.admissionEnquiries / 8)), 0.03, 0.12, { digits: 0 }),
    complaints: walk(Math.max(1, k.openComplaints), -0.02, 0.14, { digits: 0 }),
    staffAttendance: walk(k.avgStaffAttendance, 0.001, 0.005, { max: 100 }),
    library: walk(Math.max(1, k.booksIssued), 0.02, 0.09, { digits: 0 }),
    transport: walk(fleet || 80, 0.006, 0.02, { max: 100 }),
    hostel: walk(k.hostelOccupancy || 75, 0.005, 0.02, { max: 100 }),
    revenue: walk(revenuePerMonth, 0.02, 0.11, { digits: 0 }),
    expense: walk(expensePerMonth, 0.015, 0.08, { digits: 0 }),
  };
});

db.analytics = analytics;
db.query = query;

export default db;
