export const DEMO_USER = {
  name: 'Nihal Hegde',
  email: 'student@campusly.demo',
  password: 'student123',
  studentId: 'MBD-2026-0148',
  program: "Master's in Big Data & Advance MLOps",
  batch: 'October 2026 · 12 Months',
  phone: '+91 98765 43210',
  joined: '01 Sep 2026',
}

const C = ['violet', 'blue', 'orange', 'green']
const M = [
  ['AI Foundation / Orientation', 'M01-AIF', 'Ananya Rao', '15 Days', 15, 15, 'Completed', ['AI Landscape Overview.pdf', 'Orientation Handbook.pdf']],
  ['Advanced Python & Database Foundation', 'M02-PYD', 'Rahul Shetty', '2 Months', 40, 31, 'Joins, Indexing & Query Tuning', ['Python Advanced Notes.pdf', 'SQL & NoSQL Cheat Sheet.pdf']],
  ['ML, Data Science & Data Visualization', 'M03-MLDS', 'Meera Nair', '55 Days', 55, 8, 'Exploratory Data Analysis with Pandas', ['ML Algorithms Primer.pdf', 'Matplotlib & Seaborn Lab.zip']],
  ['Big Data & Cloud Data Engineering', 'M04-BDE', 'Vikram Pai', '40 Days', 40, 0, 'Hadoop & Spark Architecture', ['PySpark Starter Kit.zip']],
  ['Big Data Analytics — Tableau & Power BI', 'M05-BDA', 'Sneha Kulkarni', '25 Days', 25, 0, 'Dashboard Design Basics', ['Power BI Workbook.pdf']],
  ['Advanced MLOps', 'M06-MLO', 'Arjun Menon', '1.5 Months', 30, 0, 'MLflow & Model Registry', ['MLOps Pipeline Guide.pdf']],
  ['Advanced Deep Learning & Computer Vision', 'M07-DLCV', 'Kavya Iyer', '2 Months', 40, 0, 'Neural Networks with PyTorch', ['CNN Architectures.pdf']],
  ['NLP & AI Bots', 'M08-NLP', 'Rohan Desai', '2 Months', 40, 0, 'Transformers & Tokenization', ['NLP Toolkit Guide.pdf']],
  ['Introduction to Generative AI & Agentic AI', 'M09-GAI', 'Priya Hegde', '15 Days', 15, 0, 'LLMs & Prompt Engineering', ['GenAI Foundations.pdf']],
  ['AI Research & Architecture', 'M10-AIR', 'Dr. Suresh Bhat', '15 Days', 15, 0, 'Reading Research Papers', ['Research Methodology.pdf']],
]

export const initialData = {
  courses: M.map(([title, code, instructor, duration, lessons, completed, next, mats], i) => ({
    id: i + 1, title: `Module ${i + 1}: ${title}`, code, instructor, duration, color: C[i % 4],
    lessons, completed, progress: Math.round((completed / lessons) * 100),
    next: completed >= lessons ? 'Module completed' : next,
    materials: mats.map((name) => ({ name, type: name.split('.').pop().toUpperCase(), size: '1.2 MB' })),
  })),
  attendance: [
    { date: '26 Oct 2026', course: 'Advanced Python & Database Foundation', status: 'Present' },
    { date: '26 Oct 2026', course: 'ML, Data Science & Data Visualization', status: 'Present' },
    { date: '23 Oct 2026', course: 'ML, Data Science & Data Visualization', status: 'Present' },
    { date: '22 Oct 2026', course: 'Advanced Python & Database Foundation', status: 'Absent' },
    { date: '21 Oct 2026', course: 'Advanced Python & Database Foundation', status: 'Present' },
    { date: '20 Oct 2026', course: 'ML, Data Science & Data Visualization', status: 'Present' },
    { date: '19 Oct 2026', course: 'Advanced Python & Database Foundation', status: 'Present' },
    { date: '15 Sep 2026', course: 'AI Foundation / Orientation', status: 'Present' },
  ],
  marks: [
    { id: 1, subject: 'AI Foundation / Orientation', assessment: 'Module 1 Final Quiz', date: '16 Sep 2026', score: 46, total: 50, status: 'Published', feedback: 'Excellent grasp of AI fundamentals.' },
    { id: 2, subject: 'Advanced Python & Database Foundation', assessment: 'Python OOP Test', date: '10 Oct 2026', score: 36, total: 40, status: 'Published', feedback: 'Strong code structure. Practise decorators.' },
    { id: 3, subject: 'Advanced Python & Database Foundation', assessment: 'SQL Practical', date: '20 Oct 2026', score: 25, total: 30, status: 'Published', feedback: 'Good joins. Work on window functions.' },
    { id: 4, subject: 'ML, Data Science & Data Visualization', assessment: 'Statistics Quiz', date: '25 Oct 2026', score: null, total: 25, status: 'Pending', feedback: 'Results will appear here when published.' },
  ],
  assignments: [
    { id: 1, title: 'Build a library database with SQL & MongoDB', course: 'Advanced Python & Database Foundation', due: '30 Oct 2026', points: 25, status: 'In progress', description: 'Design a normalized SQL schema and a MongoDB collection, then write 10 queries comparing both.' },
    { id: 2, title: 'Python data cleaning pipeline', course: 'Advanced Python & Database Foundation', due: '02 Nov 2026', points: 20, status: 'Not started', description: 'Write reusable Python functions to clean, transform and summarise a sales dataset.' },
    { id: 3, title: 'EDA report on a public dataset', course: 'ML, Data Science & Data Visualization', due: '08 Nov 2026', points: 30, status: 'Not started', description: 'Explore a Kaggle dataset with Pandas and present 5 insights using Matplotlib/Seaborn charts.' },
    { id: 4, title: 'AI career roadmap essay', course: 'AI Foundation / Orientation', due: '15 Sep 2026', points: 10, status: 'Submitted', description: 'Write a one-page plan for your journey into Big Data & MLOps.' },
  ],
  leaves: [
    { id: 'LV-1024', type: 'Personal', from: '22 Oct 2026', to: '22 Oct 2026', days: 1, reason: 'Personal appointment', status: 'Approved', remarks: 'Approved. Please catch up on the SQL session.', applied: '20 Oct 2026' },
    { id: 'LV-1031', type: 'Medical', from: '29 Oct 2026', to: '30 Oct 2026', days: 2, reason: 'Medical check-up', status: 'Pending', remarks: 'Awaiting mentor review.', applied: '26 Oct 2026' },
  ],
  certificates: [
    { id: 'CERT-2026-021', title: 'Module 1 — AI Foundation / Orientation', date: '16 Sep 2026', issuer: "Master's in Big Data & Advance MLOps", status: 'Issued' },
    { id: 'CERT-2026-035', title: 'Module 2 — Advanced Python & Database Foundation', date: '—', issuer: "Master's in Big Data & Advance MLOps", status: 'In progress' },
  ],
  notifications: [
    { id: 1, title: 'New marks published', message: 'Your SQL Practical result is available.', time: '2 hours ago', read: false, kind: 'result' },
    { id: 2, title: 'Assignment deadline coming up', message: 'Library database project is due on 30 Oct.', time: 'Yesterday', read: false, kind: 'assignment' },
    { id: 3, title: 'Module 3 started', message: 'ML, Data Science & Data Visualization sessions have begun.', time: '20 Oct', read: true, kind: 'course' },
    { id: 4, title: 'Study material added', message: 'New ML Algorithms Primer added to Module 3.', time: '19 Oct', read: true, kind: 'course' },
  ],
  timetable: [
    { day: 'Mon', date: '26', classes: [{ time: '10:00 AM', title: 'Advanced Python & Databases', room: 'Lab 01', color: 'blue' }, { time: '02:00 PM', title: 'ML & Data Science', room: 'Room 104', color: 'orange' }] },
    { day: 'Tue', date: '27', classes: [{ time: '10:00 AM', title: 'ML & Data Science', room: 'Room 104', color: 'orange' }, { time: '02:00 PM', title: 'Data Visualization Lab', room: 'Lab 02', color: 'violet' }] },
    { day: 'Wed', date: '28', classes: [{ time: '10:00 AM', title: 'Advanced Python & Databases', room: 'Lab 01', color: 'blue' }] },
    { day: 'Thu', date: '29', classes: [{ time: '10:00 AM', title: 'ML & Data Science', room: 'Room 104', color: 'orange' }, { time: '02:00 PM', title: 'SQL Practice Lab', room: 'Lab 01', color: 'blue' }] },
    { day: 'Fri', date: '30', classes: [{ time: '10:00 AM', title: 'Data Visualization Lab', room: 'Lab 02', color: 'violet' }, { time: '02:00 PM', title: 'Mentor Doubt Session', room: 'Innovation Hub', color: 'green' }] },
  ],
}

export const EXAM_SLOTS = [
  { id: 'EX-01', subject: 'AI Foundation / Orientation', code: 'M01-AIF', type: 'Module Final', date: '16 Sep 2026', time: '10:00 AM – 11:00 AM', venue: 'Exam Hall A', seat: 'A-12', status: 'Completed' },
  { id: 'EX-02', subject: 'Advanced Python & Database Foundation', code: 'M02-PYD', type: 'Theory Exam', date: '05 Nov 2026', time: '10:00 AM – 12:30 PM', venue: 'Exam Hall A', seat: 'A-24', status: 'Upcoming' },
  { id: 'EX-03', subject: 'Advanced Python & Database Foundation', code: 'M02-PYD', type: 'Practical Lab', date: '07 Nov 2026', time: '02:00 PM – 04:00 PM', venue: 'Lab 01', seat: 'L1-11', status: 'Upcoming' },
  { id: 'EX-04', subject: 'ML, Data Science & Data Visualization', code: 'M03-MLDS', type: 'Mid-Module Test', date: '20 Nov 2026', time: '10:00 AM – 12:00 PM', venue: 'Exam Hall B', seat: 'B-08', status: 'Upcoming' },
]

export const FEES = [
  { id: 'FE-01', title: 'Registration & Admission Fee', amount: 15000, date: '05 Sep 2026', status: 'Paid', receipt: 'RCPT-50121', method: 'UPI' },
  { id: 'FE-02', title: 'Semester 1 Tuition Fee', amount: 35000, date: '15 Oct 2026', status: 'Paid', receipt: 'RCPT-50188', method: 'Net Banking' },
  { id: 'FE-03', title: 'Semester 1 Exam & Lab Fee', amount: 10000, date: '10 Nov 2026', status: 'Pending' },
  { id: 'FE-04', title: 'Semester 2 Tuition Fee', amount: 35000, date: '15 Jan 2027', status: 'Pending' },
]

export const USER = { ...DEMO_USER }
const ACCOUNTS_KEY = 'portal-accounts'
const isDemo = () => USER.email === DEMO_USER.email
const dataKey = () => isDemo() ? 'campusly-demo-data' : `portal-data-${USER.email}`
export const profileKey = () => isDemo() ? 'campusly-demo-profile' : `portal-profile-${USER.email}`

export function getAccounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]') } catch { return [] }
}
export function findAccount(email) {
  const e = String(email).trim().toLowerCase()
  if (!e) return null
  if (e === DEMO_USER.email) return { ...DEMO_USER }
  return getAccounts().find(a => a.email === e) || null
}
export function registerAccount({ name, email, password, program }) {
  const e = email.trim().toLowerCase()
  if (findAccount(e)) return { error: 'An account with this email already exists. Please sign in.' }
  const now = new Date()
  const account = {
    name, email: e, password, program,
    studentId: `STU-${now.getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
    batch: new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(now),
    phone: '',
    joined: new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(now),
  }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...getAccounts(), account]))
  return { account }
}
export function setCurrentUser(acc) {
  Object.keys(USER).forEach(k => delete USER[k])
  Object.assign(USER, acc)
}

function freshData() {
  const d = structuredClone(initialData)
  return d
  return {
    ...d,
    courses: [],
    timetable: (d.timetable || []).map(t => ({ ...t, classes: [] })),
    attendance: [],
    marks: [],
    assignments: [],
    leaves: [],
    certificates: [],
    notifications: [{ id: 1, title: 'Welcome to your portal', message: 'Your account is ready. Explore your courses to get started.', time: 'Just now', read: false, kind: 'course' }],
  }
}

export function loadDemoData() {
  try {
    const stored = localStorage.getItem(dataKey())
    const parsed = stored ? JSON.parse(stored) : null
    return parsed && parsed.courses?.length && parsed.marks?.length ? parsed : freshData()
  } catch {
    return freshData()
  }
}

export function saveDemoData(data) {
  localStorage.setItem(dataKey(), JSON.stringify(data))
}

export function resetDemoData() {
  localStorage.removeItem(dataKey())
  return freshData()
}
