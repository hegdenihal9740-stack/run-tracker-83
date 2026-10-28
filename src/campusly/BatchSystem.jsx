import { useEffect, useMemo, useState } from 'react'
import { Users, CalendarClock, Plus, Pencil, Trash2, X, LogOut, CheckCircle2, Clock3, Layers, RotateCcw, MapPin, UserRound, ShieldCheck } from 'lucide-react'
import { loadBatches, saveBatches, resetBatches, studentBatches, batchStats, fmtDate, fmtTime, endTime, SESSION_STATUSES } from './batches.js'
import { getAccounts, initialData } from './data.js'

const subjects = initialData.courses.map(c => c.title.replace(/^Module \d+: /, ''))
const pillClass = s => s === 'Completed' ? 'status-approved' : s === 'Cancelled' ? 'status-rejected' : 'status-pending'
const Pill = ({ s }) => <span className={`status-pill ${pillClass(s)}`}><i/>{s}</span>

function Stat({ icon: Icon, label, value, detail }) {
  return <div className="stat-card"><div className="stat-top"><div className="stat-icon tone-violet"><Icon size={19}/></div></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div>{detail && <div className="stat-detail">{detail}</div>}</div>
}
function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal-card" onMouseDown={e => e.stopPropagation()}><div className="modal-header"><h3>{title}</h3><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></div>{children}</div></div>
}
function Field({ label, children }) { return <div><label className="field-label">{label}</label>{children}</div> }

/* ---------- Student view ---------- */
export function MyBatch({ email }) {
  const [store] = useState(loadBatches)
  const [f, setF] = useState('All')
  const mine = studentBatches(store, email)
  if (!mine.length) return <div className="page-stack"><div className="panel empty-state"><div><Layers size={20}/></div><strong>No batch assigned yet</strong><p>The admin team will assign your batch and class timings soon.</p></div></div>
  return <div className="page-stack">{mine.map(b => {
    const st = batchStats(store, b.id)
    const sessions = store.sessions.filter(s => s.batchId === b.id && (f === 'All' || s.status === f)).sort((a, z) => (a.date + a.time).localeCompare(z.date + z.time))
    const next = store.sessions.filter(s => s.batchId === b.id && s.status !== 'Completed' && s.status !== 'Cancelled').sort((a, z) => (a.date + a.time).localeCompare(z.date + z.time))[0]
    const bySubject = [...new Set(store.sessions.filter(s => s.batchId === b.id).map(s => s.subject))]
    return <div className="page-stack" key={b.id}>
      <div className="welcome-banner" style={{ minHeight: 170 }}><div className="welcome-copy"><span className="welcome-label"><Layers size={14}/> YOUR BATCH · {b.id}</span><h2 style={{ fontSize: 22 }}>{b.name}</h2><p>{b.course} · {b.days} · {fmtTime(b.time)} – {endTime(b.time, b.duration)} · {b.mode} ({b.room}) · Mentor {b.mentor}</p><p style={{ margin: 0 }}>{fmtDate(b.startDate)} → {fmtDate(b.endDate)}</p></div></div>
      <div className="stats-grid"><Stat icon={CalendarClock} label="Total sessions" value={st.total} detail="Planned by admin"/><Stat icon={CheckCircle2} label="Completed" value={st.done} detail={`${st.pct}% done`}/><Stat icon={Clock3} label="Upcoming" value={st.upcoming} detail="Scheduled ahead"/><Stat icon={MapPin} label="Next class" value={next ? fmtDate(next.date).slice(0, 6) : '—'} detail={next ? `${fmtTime(next.time)} · ${next.subject}` : 'Nothing scheduled'}/></div>
      <div className="panel"><div className="panel-heading"><div><h3>Progress by subject</h3><p>Sessions completed per subject</p></div></div>{bySubject.map(sub => { const all = store.sessions.filter(s => s.batchId === b.id && s.subject === sub); const d = all.filter(s => s.status === 'Completed').length; return <div key={sub} style={{ marginBottom: 12 }}><div className="course-progress-label"><span>{sub}</span><strong>{d}/{all.length} sessions</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${all.length ? d / all.length * 100 : 0}%` }}/></div></div> })}</div>
      <div className="filter-row"><div className="segmented">{['All', ...SESSION_STATUSES].map(x => <button key={x} className={f === x ? 'selected' : ''} onClick={() => setF(x)}>{x}</button>)}</div></div>
      <div className="panel table-panel"><div className="panel-heading"><div><h3>Class sessions</h3><p>Date, time and status of every session</p></div></div><div className="table-scroll"><table><thead><tr><th>#</th><th>SUBJECT</th><th>TOPIC</th><th>DATE</th><th>TIME</th><th>STATUS</th></tr></thead><tbody>{sessions.map(s => <tr key={s.id}><td><span className="course-tag">S{s.number}</span></td><td><strong className="normal-weight">{s.subject}</strong></td><td>{s.topic}</td><td>{fmtDate(s.date)}</td><td>{fmtTime(s.time)} – {endTime(s.time, s.duration)}</td><td><Pill s={s.status}/></td></tr>)}</tbody></table>{!sessions.length && <p className="muted-text" style={{ padding: 14 }}>No sessions in this view.</p>}</div></div>
    </div>
  })}</div>
}

/* ---------- Admin portal ---------- */
const emptyBatch = { name: '', course: "Master's in Big Data & Advance MLOps", startDate: '', endDate: '', days: 'Mon, Wed, Fri', time: '10:00', duration: 120, mode: 'Classroom', room: '', mentor: '', capacity: 30, students: [] }

export function AdminPortal({ user, onLogout }) {
  const [store, setStore] = useState(loadBatches)
  const [tab, setTab] = useState('batches')
  const [editBatch, setEditBatch] = useState(null)
  const [editSession, setEditSession] = useState(null)
  const [batchFilter, setBatchFilter] = useState('All')
  useEffect(() => saveBatches(store), [store])
  const students = useMemo(() => [{ name: 'Nihal Hegde', email: 'student@campusly.demo' }, ...getAccounts().map(a => ({ name: a.name, email: a.email }))], [])
  const totals = { batches: store.batches.length, sessions: store.sessions.length, done: store.sessions.filter(s => s.status === 'Completed').length, students: new Set(store.batches.flatMap(b => b.students)).size }

  function saveBatch(b) {
    setStore(s => b.id ? { ...s, batches: s.batches.map(x => x.id === b.id ? b : x) } : { ...s, batches: [...s.batches, { ...b, id: `B-${String(Date.now()).slice(-4)}` }] })
    setEditBatch(null)
  }
  function deleteBatch(id) { if (confirm('Delete this batch and all its sessions?')) setStore(s => ({ batches: s.batches.filter(b => b.id !== id), sessions: s.sessions.filter(x => x.batchId !== id) })) }
  function saveSession(x) {
    const n = { ...x, number: Number(x.number), duration: Number(x.duration) }
    setStore(s => x.id ? { ...s, sessions: s.sessions.map(y => y.id === x.id ? n : y) } : { ...s, sessions: [...s.sessions, { ...n, id: `S-${Date.now()}` }] })
    setEditSession(null)
  }
  const setStatus = (id, status) => setStore(s => ({ ...s, sessions: s.sessions.map(x => x.id === id ? { ...x, status } : x) }))
  const newSession = () => { const b = store.batches[0]; if (!b) return alert('Create a batch first.'); const sub = subjects[1]; const n = store.sessions.filter(s => s.batchId === b.id && s.subject === sub).length + 1; setEditSession({ batchId: b.id, subject: sub, number: n, date: '', time: b.time, duration: b.duration, topic: '', status: 'Scheduled', trainer: b.mentor }) }
  const sessions = store.sessions.filter(s => batchFilter === 'All' || s.batchId === batchFilter).sort((a, z) => (a.date + a.time).localeCompare(z.date + z.time))
  const batchName = id => store.batches.find(b => b.id === id)?.name || id

  return <div className="app-shell"><main className="main-area" style={{ marginRight: 0 }}>
    <header className="topbar"><div className="breadcrumb"><ShieldCheck size={16}/><strong>Admin · Batch & Class Management</strong></div><div className="topbar-actions"><span className="muted-text">{user.name}</span><button className="secondary-button" onClick={onLogout}><LogOut size={15}/> Sign out</button></div></header>
    <div className="content-area"><div className="page-stack">
      <div className="welcome-banner" style={{ minHeight: 150 }}><div className="welcome-copy"><span className="welcome-label"><Layers size={14}/> ADMIN TEAM</span><h2 style={{ fontSize: 22 }}>Batches & class sessions</h2><p>Create batches, assign students, and schedule sessions. Students see these instantly in their portal.</p></div></div>
      <div className="stats-grid"><Stat icon={Layers} label="Batches" value={totals.batches}/><Stat icon={Users} label="Students assigned" value={totals.students}/><Stat icon={CalendarClock} label="Sessions planned" value={totals.sessions}/><Stat icon={CheckCircle2} label="Sessions completed" value={totals.done}/></div>
      <div className="filter-row"><div className="segmented">{[['batches', 'Batches'], ['sessions', 'Sessions']].map(([k, l]) => <button key={k} className={tab === k ? 'selected' : ''} onClick={() => setTab(k)}>{l}</button>)}</div><div style={{ display: 'flex', gap: 8 }}><button className="secondary-button" onClick={() => confirm('Reset to default batches?') && setStore(resetBatches())}><RotateCcw size={14}/> Reset</button>{tab === 'batches' ? <button className="primary-button" onClick={() => setEditBatch({ ...emptyBatch })}><Plus size={15}/> New batch</button> : <button className="primary-button" onClick={newSession}><Plus size={15}/> New session</button>}</div></div>

      {tab === 'batches' && <div className="course-grid">{store.batches.map(b => { const st = batchStats(store, b.id); return <article className="panel" key={b.id}><div className="panel-heading"><div><span className="course-tag">{b.id}</span><h3 style={{ marginTop: 8 }}>{b.name}</h3><p>{b.course}</p></div><div style={{ display: 'flex' }}><button className="icon-button" aria-label="Edit batch" onClick={() => setEditBatch(b)}><Pencil size={15}/></button><button className="icon-button" aria-label="Delete batch" onClick={() => deleteBatch(b.id)}><Trash2 size={15}/></button></div></div><div className="course-meta" style={{ marginTop: 0 }}><span><CalendarClock size={13}/>{b.days} · {fmtTime(b.time)} – {endTime(b.time, b.duration)}</span><span><MapPin size={13}/>{b.mode} · {b.room || '—'}</span><span><UserRound size={13}/>{b.mentor || '—'}</span><span><Users size={13}/>{b.students.length}/{b.capacity} students</span></div><p className="muted-text" style={{ margin: '10px 0' }}>{fmtDate(b.startDate)} → {fmtDate(b.endDate)}</p><div className="course-progress-label"><span>{st.done}/{st.total} sessions completed</span><strong>{st.pct}%</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${st.pct}%` }}/></div></article> })}</div>}

      {tab === 'sessions' && <div className="panel table-panel"><div className="panel-heading"><div><h3>Session schedule</h3><p>Update status as classes happen</p></div><select className="select-control" value={batchFilter} onChange={e => setBatchFilter(e.target.value)}><option value="All">All batches</option>{store.batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div><div className="table-scroll"><table><thead><tr><th>BATCH</th><th>#</th><th>SUBJECT / TOPIC</th><th>DATE</th><th>TIME</th><th>STATUS</th><th/></tr></thead><tbody>{sessions.map(s => <tr key={s.id}><td>{batchName(s.batchId)}</td><td><span className="course-tag">S{s.number}</span></td><td><strong className="normal-weight">{s.subject}</strong><br/><span className="muted-text">{s.topic}</span></td><td>{fmtDate(s.date)}</td><td>{fmtTime(s.time)} – {endTime(s.time, s.duration)}</td><td><select className="select-control" value={s.status} onChange={e => setStatus(s.id, e.target.value)}>{SESSION_STATUSES.map(x => <option key={x}>{x}</option>)}</select></td><td><button className="icon-button" aria-label="Edit session" onClick={() => setEditSession(s)}><Pencil size={14}/></button><button className="icon-button" aria-label="Delete session" onClick={() => setStore(st => ({ ...st, sessions: st.sessions.filter(x => x.id !== s.id) }))}><Trash2 size={14}/></button></td></tr>)}</tbody></table></div></div>}
    </div></div>
    {editBatch && <BatchForm initial={editBatch} students={students} onSave={saveBatch} onClose={() => setEditBatch(null)}/>}
    {editSession && <SessionForm initial={editSession} batches={store.batches} onSave={saveSession} onClose={() => setEditSession(null)}/>}
  </main></div>
}

function BatchForm({ initial, students, onSave, onClose }) {
  const [b, setB] = useState(initial)
  const set = k => e => setB({ ...b, [k]: e.target.value })
  const toggle = email => setB({ ...b, students: b.students.includes(email) ? b.students.filter(x => x !== email) : [...b.students, email] })
  return <Modal title={b.id ? 'Edit batch' : 'New batch'} onClose={onClose}><form className="leave-form" onSubmit={e => { e.preventDefault(); onSave({ ...b, duration: Number(b.duration), capacity: Number(b.capacity) }) }}>
    <Field label="Batch name"><input required value={b.name} onChange={set('name')} placeholder="e.g. MBD Jan 2027 — Evening"/></Field>
    <Field label="Course"><input required value={b.course} onChange={set('course')}/></Field>
    <div className="form-two-col"><Field label="Start date"><input type="date" required value={b.startDate} onChange={set('startDate')}/></Field><Field label="End date"><input type="date" value={b.endDate} onChange={set('endDate')}/></Field></div>
    <div className="form-two-col"><Field label="Class days"><input value={b.days} onChange={set('days')} placeholder="Mon, Wed, Fri"/></Field><Field label="Start time"><input type="time" required value={b.time} onChange={set('time')}/></Field></div>
    <div className="form-two-col"><Field label="Duration (minutes)"><input type="number" min="15" value={b.duration} onChange={set('duration')}/></Field><Field label="Capacity"><input type="number" min="1" value={b.capacity} onChange={set('capacity')}/></Field></div>
    <div className="form-two-col"><Field label="Mode"><select value={b.mode} onChange={set('mode')}><option>Classroom</option><option>Online</option><option>Hybrid</option></select></Field><Field label="Room / link"><input value={b.room} onChange={set('room')}/></Field></div>
    <Field label="Mentor"><input value={b.mentor} onChange={set('mentor')}/></Field>
    <Field label={`Students (${b.students.length})`}><div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 130, overflowY: 'auto' }}>{students.map(s => <label key={s.email} className="muted-text" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" style={{ width: 'auto', minHeight: 0 }} checked={b.students.includes(s.email)} onChange={() => toggle(s.email)}/>{s.name} · {s.email}</label>)}</div></Field>
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button">Save batch</button></div>
  </form></Modal>
}

function SessionForm({ initial, batches, onSave, onClose }) {
  const [s, setS] = useState(initial)
  const set = k => e => setS({ ...s, [k]: e.target.value })
  return <Modal title={s.id ? 'Edit session' : 'New session'} onClose={onClose}><form className="leave-form" onSubmit={e => { e.preventDefault(); onSave(s) }}>
    <Field label="Batch"><select value={s.batchId} onChange={set('batchId')}>{batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
    <div className="form-two-col"><Field label="Subject"><select value={s.subject} onChange={set('subject')}>{subjects.map(x => <option key={x}>{x}</option>)}</select></Field><Field label="Session number"><input type="number" min="1" required value={s.number} onChange={set('number')}/></Field></div>
    <Field label="Topic"><input required value={s.topic} onChange={set('topic')}/></Field>
    <div className="form-two-col"><Field label="Date"><input type="date" required value={s.date} onChange={set('date')}/></Field><Field label="Start time"><input type="time" required value={s.time} onChange={set('time')}/></Field></div>
    <div className="form-two-col"><Field label="Duration (minutes)"><input type="number" min="15" value={s.duration} onChange={set('duration')}/></Field><Field label="Status"><select value={s.status} onChange={set('status')}>{SESSION_STATUSES.map(x => <option key={x}>{x}</option>)}</select></Field></div>
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button">Save session</button></div>
  </form></Modal>
}
