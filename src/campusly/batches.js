export const ADMIN_USER = { name: 'Admin Team', email: 'admin@campusly.demo', password: 'admin123', role: 'admin', studentId: 'ADMIN', program: 'Administration' }

const KEY = 'portal-batches'
export const SESSION_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled']

const seed = {
  batches: [
    { id: 'B-01', name: 'MBD Oct 2026 — Morning', course: "Master's in Big Data & Advance MLOps", startDate: '2026-10-01', endDate: '2027-09-30', days: 'Mon, Wed, Fri', time: '10:00', duration: 120, mode: 'Classroom', room: 'Lab 01', mentor: 'Rahul Shetty', capacity: 30, students: ['student@campusly.demo'] },
    { id: 'B-02', name: 'MBD Oct 2026 — Weekend', course: "Master's in Big Data & Advance MLOps", startDate: '2026-10-03', endDate: '2027-10-02', days: 'Sat, Sun', time: '09:30', duration: 180, mode: 'Online', room: 'Zoom', mentor: 'Meera Nair', capacity: 40, students: [] },
  ],
  sessions: [
    ['B-01', 'Advanced Python & Database Foundation', 1, '2026-10-19', '10:00', 'Python OOP refresher', 'Completed'],
    ['B-01', 'Advanced Python & Database Foundation', 2, '2026-10-21', '10:00', 'SQL joins & indexing', 'Completed'],
    ['B-01', 'Advanced Python & Database Foundation', 3, '2026-10-23', '10:00', 'MongoDB basics', 'Completed'],
    ['B-01', 'ML, Data Science & Data Visualization', 1, '2026-10-26', '14:00', 'Intro to Pandas', 'Completed'],
    ['B-01', 'Advanced Python & Database Foundation', 4, '2026-10-28', '10:00', 'Query tuning', 'Scheduled'],
    ['B-01', 'ML, Data Science & Data Visualization', 2, '2026-10-30', '14:00', 'EDA with Seaborn', 'Scheduled'],
    ['B-01', 'Advanced Python & Database Foundation', 5, '2026-11-02', '10:00', 'Database project review', 'Rescheduled'],
    ['B-01', 'ML, Data Science & Data Visualization', 3, '2026-11-04', '14:00', 'Statistics for ML', 'Scheduled'],
    ['B-02', 'Advanced Python & Database Foundation', 1, '2026-10-24', '09:30', 'Python OOP refresher', 'Completed'],
    ['B-02', 'Advanced Python & Database Foundation', 2, '2026-10-31', '09:30', 'SQL joins & indexing', 'Scheduled'],
  ].map(([batchId, subject, number, date, time, topic, status], i) => ({ id: `S-${i + 1}`, batchId, subject, number, date, time, duration: 120, topic, status, trainer: '' })),
}

export function loadBatches() {
  try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d?.batches) return d } catch { /* ignore */ }
  return structuredClone(seed)
}
export function saveBatches(d) { localStorage.setItem(KEY, JSON.stringify(d)) }
export function resetBatches() { localStorage.removeItem(KEY); return structuredClone(seed) }

export function studentBatches(store, email) {
  const e = String(email || '').toLowerCase()
  return store.batches.filter(b => b.students.map(s => s.toLowerCase()).includes(e))
}
export function batchStats(store, batchId) {
  const s = store.sessions.filter(x => x.batchId === batchId)
  const done = s.filter(x => x.status === 'Completed').length
  return { total: s.length, done, upcoming: s.filter(x => x.status === 'Scheduled' || x.status === 'Rescheduled').length, pct: s.length ? Math.round(done / s.length * 100) : 0 }
}
export const fmtDate = d => d ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d + 'T00:00')) : '—'
export const fmtTime = t => { if (!t) return '—'; const [h, m] = t.split(':').map(Number); return `${String(((h + 11) % 12) + 1).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}` }
export const endTime = (t, mins) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); const x = h * 60 + m + Number(mins || 0); return fmtTime(`${Math.floor(x / 60) % 24}:${x % 60}`) }
