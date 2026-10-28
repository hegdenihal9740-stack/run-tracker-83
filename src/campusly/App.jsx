import { useEffect, useMemo, useState } from 'react'
import {
  Activity, AlarmClock, ArrowDownRight, ArrowRight, ArrowUpRight, Award, Bell, BookOpen,
  CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ClipboardList,
  Clock3, Download, FileText, GraduationCap, LayoutDashboard, LogOut, Menu, MessageSquare,
  MoreHorizontal, Search, Settings2, ShieldCheck, Sparkles, TrendingUp, UserRound, X,
  CircleHelp, CirclePlus, CalendarCheck, ChartNoAxesColumn, BookMarked, FileCheck2, Send,
  Paperclip, ExternalLink, RotateCcw, Mail, Phone, LockKeyhole, Eye, EyeOff, Inbox, Filter,
} from 'lucide-react'
import { DEMO_USER, USER, findAccount, registerAccount, setCurrentUser, profileKey, loadDemoData, saveDemoData, resetDemoData, EXAM_SLOTS, FEES } from './data.js'
import { NotebookPen, Wallet, MapPin, Layers } from 'lucide-react'
import { MyBatch } from './BatchSystem.jsx'

const navGroups = [
  { label: 'LEARNING', items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'My Course', icon: BookOpen },
    { id: 'materials', label: 'Study Materials', icon: BookMarked },
    { id: 'timetable', label: 'Timetable', icon: CalendarDays },
    { id: 'batch', label: 'My Batch & Sessions', icon: Layers },
  ] },
  { label: 'ACADEMICS', items: [
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'marks', label: 'Marks & Results', icon: ChartNoAxesColumn },
    { id: 'exams', label: 'Exam Slots', icon: NotebookPen },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList},
    { id: 'leave', label: 'Leave Applications', icon: FileCheck2 },
  ] },
  { label: 'FINANCE', items: [
    { id: 'fees', label: 'Fees & Payments', icon: Wallet },
  ] },
]

const titles = {
  get dashboard() { return [`Good morning, ${(USER.name || 'there').split(' ')[0]} 👋`, 'Here’s what’s happening with your learning today.'] },
  courses: ['My Course', 'Your enrolled course and its subjects.'],
  materials: ['Study Materials', 'Everything you need to keep learning in one place.'],
  timetable: ['Class Timetable', 'Plan your week and stay on top of every session.'],
  attendance: ['Attendance', 'Track your class participation and attendance record.'],
  marks: ['Marks & Results', 'Review published scores, feedback, and pending results.'],
  assignments: ['Assignments', 'Manage your tasks, due dates, and submissions.'],
  batch: ['My Batch & Sessions', 'Your batch, class timings and session progress.'],
  exams: ['Exam Slots', 'Your upcoming exam dates, times and venues.'],
  fees: ['Fees & Payments', 'See what is paid and what is still pending.'],
  leave: ['Leave Applications', 'Apply for leave and follow your request status.'],
  certificates: ['Certificates', 'View your achievements and completion certificates.'],
  notifications: ['Notifications', 'Stay up to date with your learning activity.'],
  profile: ['My Profile', 'Manage your personal and student information.'],
}

function cx(...values) { return values.filter(Boolean).join(' ') }
function percent(score, total) { return total ? Math.round((score / total) * 100) : 0 }
function initials(name = '') { return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() }
function getGrade(p) { return p >= 90 ? 'A+' : p >= 80 ? 'A' : p >= 70 ? 'B+' : p >= 60 ? 'B' : p >= 50 ? 'C' : 'Needs work' }
function todayLabel() { return new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()) }
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
function todayShort() { return DAY_SHORT[new Date().getDay()] }
export function daysUntil(dateStr, now = new Date()) { const d = new Date(dateStr); if (isNaN(d)) return null; const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const b = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return Math.round((b - a) / 86400000) }
export function dueInfo(a, now = new Date()) {
  if (a.status === 'Submitted') return { label: 'Submitted', tone: 'green' }
  const n = daysUntil(a.due, now)
  if (n === null) return { label: `Due ${a.due}`, tone: 'blue' }
  if (n < 0) return { label: `Overdue by ${-n} day${n === -1 ? '' : 's'}`, tone: 'red' }
  if (n === 0) return { label: 'Due today', tone: 'red' }
  if (n === 1) return { label: 'Due tomorrow', tone: 'orange' }
  if (n <= 3) return { label: `Due in ${n} days`, tone: 'orange' }
  return { label: `Due in ${n} days`, tone: 'blue' }
}
// How many more classes can be missed while staying at or above 75%, or how many must be attended to get back.
export function attendanceBuffer(present, total, min = 0.75) {
  if (total === 0) return { safe: true, count: 0 }
  if (present / total >= min) return { safe: true, count: Math.floor(present / min - total) }
  return { safe: false, count: Math.ceil((min * total - present) / (1 - min)) }
}
function toMinutes(t) { const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(t || ''); if (!m) return 0; let h = +m[1] % 12; if (m[3].toUpperCase() === 'PM') h += 12; return h * 60 + +m[2] }
function nextClass(timetable, now = new Date()) {
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const todayIdx = order.indexOf(DAY_SHORT[now.getDay()])
  const mins = now.getHours() * 60 + now.getMinutes()
  for (let off = 0; off < 7; off++) {
    const idx = todayIdx < 0 ? off : todayIdx + off
    if (idx >= order.length) break
    const d = timetable.find(t => t.day === order[idx]); if (!d) continue
    const c = d.classes.find(c => off > 0 || toMinutes(c.time) + 60 > mins)
    if (c) return { ...c, day: d.day, date: d.date, when: off === 0 ? (toMinutes(c.time) <= mins ? 'Happening now' : 'Today') : off === 1 ? 'Tomorrow' : d.day }
  }
  return null
}
function DueTag({ a }) { const i = dueInfo(a); return <span className={cx('due-tag', `due-${i.tone}`)}><Clock3 size={12}/>{i.label}</span> }

function Login({ onLogin }) {
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [program, setProgram] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const signup = mode === 'signup'
  function switchMode(m) { setMode(m); setError(''); if (m === 'signup') { setEmail(''); setPassword('') }  }
  function submit(e) {
    e.preventDefault()
    if (signup) {
      if (password.length < 6) return setError('Password must be at least 6 characters.')
      const res = registerAccount({ name: name.trim(), email, password, program: program.trim() || 'General Program' })
      if (res.error) return setError(res.error)
      onLogin(res.account)
    } else {
      const acc = findAccount(email)
      if (acc && acc.password === password) onLogin(acc)
      else setError('That email or password doesn’t match any account.')
    }
  }
  const tab = (m, label) => <button type="button" onClick={() => switchMode(m)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 11.3, fontFamily: 'inherit', background: mode === m ? 'var(--surface, #fff)' : 'transparent', boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,.1)' : 'none', color: 'inherit' }}>{label}</button>
  return <div className="login-page" style={{ gridTemplateColumns: '1fr' }}>
    <div className="login-main">
      <form className="login-form" onSubmit={submit}>
        <div className="login-heading"><span className="eyebrow">STUDENT PORTAL</span><h2>{signup ? 'Create your account' : 'Welcome back'}</h2><p>{signup ? 'Set up a fresh student account in seconds.' : 'Enter your details to access your learning dashboard.'}</p></div>
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(0,0,0,.05)', marginBottom: 18 }}>{tab('signin', 'Sign in')}{tab('signup', 'Create account')}</div>
        {error && <div className="form-error">{error}</div>}
        {signup && <><label className="field-label" htmlFor="name">Full name</label>
        <div className="input-wrap"><UserRound size={18}/><input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required/></div>
        <label className="field-label" htmlFor="program">Program</label>
        <div className="input-wrap"><GraduationCap size={18}/><input id="program" value={program} onChange={e => setProgram(e.target.value)} placeholder="e.g. Full Stack Development"/></div></>}
        <label className="field-label" htmlFor="email">Email address</label>
        <div className="input-wrap"><Mail size={18}/><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="username"/></div>
        <div className="password-label"><label className="field-label" htmlFor="password">Password</label></div>
        <div className="input-wrap"><LockKeyhole size={18}/><input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete={signup ? 'new-password' : 'current-password'} placeholder={signup ? 'At least 6 characters' : ''}/><button className="icon-button input-icon" type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>
        <button className="primary-button login-submit" type="submit">{signup ? 'Create account' : 'Sign in'} <ArrowRight size={17}/></button>
        {!signup && <button type="button" className="secondary-button login-submit" style={{ marginTop: 10 }} onClick={() => { setEmail(DEMO_USER.email); setPassword(DEMO_USER.password); setError('') }}><GraduationCap size={17}/> Use demo student</button>}
              </form>
      <span className="login-version">Student Portal</span>
    </div>
  </div>
}

const tabs = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'timetable', label: 'Timetable', icon: CalendarDays },
  { id: 'marks', label: 'Results', icon: ChartNoAxesColumn },
]
function BottomNav({ page, setPage, setMobileOpen }) {
  return <nav className="bottom-nav" aria-label="Main">
    {tabs.map(t => { const Icon = t.icon; return <button key={t.id} className={cx('tab', page === t.id && 'tab-active')} onClick={() => { setPage(t.id); window.scrollTo(0, 0) }}><Icon size={21}/><span>{t.label}</span></button> })}
    <button className="tab" onClick={() => setMobileOpen(true)}><Menu size={21}/><span>More</span></button>
  </nav>
}
function Sidebar({ page, setPage, data, onLogout, mobileOpen, setMobileOpen }) {
  const unread = data.notifications.filter(n => !n.read).length
  return <>
    {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu"/>}
    <aside className={cx('sidebar', mobileOpen && 'sidebar-open')}>
      <div className="sidebar-brand"><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)}><X size={18}/></button></div>
      <div className="institute-switch"><div className="institute-icon"><BookOpen size={17}/></div><div><strong>Student Portal</strong><span>Student workspace</span></div><ChevronDown size={15}/></div>
      <nav className="side-nav">{navGroups.map(group => <div className="nav-group" key={group.label}><div className="nav-group-label">{group.label}</div>{group.items.map(item => {
        const Icon = item.icon
        const count = item.id === 'notifications' ? unread : item.id === 'assignments' ? data.assignments.filter(a => a.status !== 'Submitted').length : item.count
        return <button key={item.id} className={cx('nav-link', page === item.id && 'active')} onClick={() => { setPage(item.id); setMobileOpen(false) }}><Icon size={18}/><span>{item.label}</span>{count && <span className={cx('nav-count', item.id === 'notifications' && unread > 0 && 'nav-count-alert')}>{count}</span>}</button>
      })}</div>)}</nav>
      <div className="sidebar-bottom"><button className="nav-link logout-link" onClick={onLogout}><LogOut size={18}/><span>Sign out</span></button><div className="sidebar-user"><div className="avatar avatar-small">{initials(USER.name)}</div><div className="sidebar-user-text"><strong>{USER.name}</strong><span>Student account</span></div><MoreHorizontal size={18}/></div></div>
    </aside>
  </>
}

function Topbar({ page, setPage, data, setMobileOpen, search, setSearch }) {
  const unread = data.notifications.filter(n => !n.read).length
  return <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={21}/></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14}/><strong>{titles[page]?.[0] || 'Dashboard'}</strong></div></div><div className="topbar-actions"><div className="global-search"><Search size={16}/><input placeholder="Search anything..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search portal"/><kbd>⌘ K</kbd></div><button className="icon-button notification-button" aria-label="Open notifications" onClick={() => setPage('notifications')}><Bell size={19}/>{unread > 0 && <i/>}</button><div className="topbar-divider"/><button className="topbar-profile" onClick={() => setPage('profile')}><div className="avatar">{initials(USER.name)}</div><div><strong>{USER.name}</strong><span>Student</span></div><ChevronDown size={15}/></button></div></header>
}

function SectionHeading({ eyebrow, title, subtitle, action }) {
  return <div className="section-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>
}
function Panel({ title, subtitle, action, children, className = '' }) {
  return <section className={cx('panel', className)}><div className="panel-heading"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>
}
function ProgressBar({ value, color = 'violet' }) {
  return <div className="progress-track"><div className={cx('progress-fill', `fill-${color}`)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }}/></div>
}
function StatusPill({ children }) {
  const status = String(children).toLowerCase().replaceAll(' ', '-')
  return <span className={cx('status-pill', `status-${status}`)}><i/>{children}</span>
}
function EmptyState({ icon: Icon = Inbox, title, text }) {
  return <div className="empty-state"><div><Icon size={23}/></div><strong>{title}</strong><p>{text}</p></div>
}
function StatCard({ icon: Icon, label, value, detail, trend, tone = 'violet' }) {
  return <div className="stat-card"><div className="stat-top"><div className={cx('stat-icon', `tone-${tone}`)}><Icon size={19}/></div>{trend && <span className="stat-trend"><ArrowUpRight size={13}/>{trend}</span>}</div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-detail">{detail}</div></div>
}

function Dashboard({ data, setPage }) {
  const attendanceRate = Math.round(data.attendance.filter(a => a.status === 'Present').length / Math.max(1, data.attendance.length) * 100)
  const average = data.marks.filter(m => m.score !== null && m.status === 'Published').reduce((sum, m) => sum + percent(m.score, m.total), 0) / Math.max(1, data.marks.filter(m => m.score !== null && m.status === 'Published').length)
  const upcoming = [...data.assignments].filter(a => a.status !== 'Submitted').sort((a, b) => new Date(a.due) - new Date(b.due)).slice(0, 3)
  const urgent = upcoming.filter(a => { const n = daysUntil(a.due); return n !== null && n <= 2 })
  const next = nextClass(data.timetable)
  const pending = data.assignments.filter(a => a.status !== 'Submitted').length
  return <div className="page-stack">
    <div className="welcome-banner"><div className="welcome-copy"><span className="welcome-label"><Sparkles size={14}/> WELCOME BACK</span><h2>Make today <em>count.</em></h2><p>{pending ? `${pending} task${pending > 1 ? 's' : ''} pending` : 'All caught up 🎉'} · {attendanceRate}% attendance {attendanceRate >= 75 ? '— you’re on track!' : '— let’s bring it up'}</p><div className="welcome-actions"><button className="primary-button" onClick={() => setPage('courses')}>Continue learning <ArrowRight size={16}/></button><span><CalendarDays size={15}/>{todayLabel()}</span></div></div><div className="welcome-illustration"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="book-illustration"><BookOpen size={58}/></div></div></div>
    {(urgent.length > 0 || attendanceRate < 75) && <div className="alert-banner"><AlarmClock size={18}/><div>{urgent.map(a => <p key={a.id}><strong>{a.title}</strong> — {dueInfo(a).label.toLowerCase()}</p>)}{attendanceRate < 75 && <p><strong>Attendance is {attendanceRate}%</strong> — attend upcoming classes to reach 75%.</p>}</div><button className="primary-button" onClick={() => setPage(urgent.length ? 'assignments' : 'attendance')}>Open <ArrowRight size={14}/></button></div>}
    <div className="next-grid">{next ? <div className="next-class"><span className="eyebrow">NEXT CLASS · {next.when.toUpperCase()}</span><strong>{next.title}</strong><div className="next-meta"><span><Clock3 size={14}/>{next.time}</span><span><MapPin size={14}/>{next.room}</span><span><CalendarDays size={14}/>{next.day} {next.date}</span></div></div> : <div className="next-class"><span className="eyebrow">NEXT CLASS</span><strong>No more classes this week</strong><div className="next-meta"><span>Enjoy your break or revise your notes.</span></div></div>}
      <div className="quick-actions"><button onClick={() => setPage('timetable')}><CalendarDays size={18}/>Today’s schedule</button><button onClick={() => setPage('assignments')}><ClipboardList size={18}/>Pending tasks</button><button onClick={() => setPage('materials')}><Download size={18}/>Study notes</button><button onClick={() => setPage('exams')}><NotebookPen size={18}/>Exam slots</button></div></div>
    <div className="stats-grid"><StatCard icon={CalendarCheck} label="Attendance rate" value={`${attendanceRate}%`} detail="Across recent sessions" trend={attendanceRate >= 75 ? 'On track' : 'Needs attention'} tone="green"/><StatCard icon={ChartNoAxesColumn} label="Average score" value={`${Math.round(average)}%`} detail="Published assessments" tone="blue"/><StatCard icon={ClipboardList} label="Pending tasks" value={data.assignments.filter(a => a.status !== 'Submitted').length} detail="Assignments to complete" tone="orange"/><StatCard icon={BookOpen} label="Subjects" value={data.courses.length} detail="In your course" tone="violet"/></div>
    <div className="dashboard-grid"><div className="main-column"><Panel title="Your subjects" subtitle="Pick up where you left off" action={<button className="link-button" onClick={() => setPage('courses')}>View all <ArrowRight size={14}/></button>}><div className="course-list">{data.courses.slice(0, 3).map(c => <button className="course-row" key={c.id} onClick={() => setPage('courses')}><div className={cx('course-symbol', `course-${c.color}`)}><BookOpen size={20}/></div><div className="course-row-main"><div className="course-title-line"><strong>{c.title}</strong><span>{c.progress}%</span></div><span className="course-subtitle">{c.completed} of {c.lessons} lessons completed</span><ProgressBar value={c.progress} color={c.color}/></div><ChevronRight size={17} className="muted-icon"/></button>)}</div></Panel>
      <Panel title="Recent results" subtitle="Your latest published scores" action={<button className="link-button" onClick={() => setPage('marks')}>All results <ArrowRight size={14}/></button>}><div className="result-list">{data.marks.filter(m => m.score !== null && m.status === 'Published').slice(0, 3).map(m => <div className="result-row" key={m.id}><div className="result-subject-icon"><FileText size={17}/></div><div className="result-info"><strong>{m.assessment}</strong><span>{m.subject} · {m.date}</span></div><div className="result-score"><strong>{m.score}<small>/{m.total}</small></strong><span>{getGrade(percent(m.score, m.total))}</span></div></div>)}</div></Panel></div>
      <div className="side-column"><Panel title="Upcoming deadlines" subtitle="A little progress goes a long way" action={<button className="icon-button small-icon" onClick={() => setPage('assignments')} aria-label="View assignments"><ArrowRight size={16}/></button>}><div className="deadline-list">{upcoming.length ? upcoming.map(a => <div className="deadline-item" key={a.id}><div className="deadline-date"><span>{a.due.split(' ')[0]}</span><strong>{a.due.split(' ')[1]}</strong></div><div className="deadline-info"><strong>{a.title}</strong><span>{a.course}</span><DueTag a={a}/></div></div>) : <EmptyState title="All caught up!" text="No pending assignments right now."/>}</div></Panel>
        <Panel title="Today's classes" subtitle="From your weekly timetable"><div className="deadline-list">{(() => { const d = data.timetable.find(t => t.classes.length); return d ? d.classes.slice(0, 2).map((c, i) => <div className="deadline-item" key={i}><div className="deadline-date"><span>{d.day}</span><strong>{d.date}</strong></div><div className="deadline-info"><strong>{c.title}</strong><span>{c.time} · {c.room}</span></div></div>) : <EmptyState title="No classes scheduled" text="Enjoy the free day or catch up on lessons."/>})()}</div></Panel></div></div>
  </div>
}

function Courses({ data, setPage }) {
  const [filter, setFilter] = useState('All subjects')
  const [selected, setSelected] = useState(null)
  const courses = data.courses.filter(c => filter === 'All subjects' || (filter === 'In progress' ? c.progress < 100 : c.progress === 100))
  return <div className="page-stack"><SectionHeading eyebrow="YOUR LEARNING" title="My Course" subtitle="One enrolled course with all its subjects." action={<button className="secondary-button" onClick={() => setPage('materials')}><BookMarked size={16}/> Study materials</button>}/><div className="detail-banner"><div><span className="eyebrow">ENROLLED COURSE</span><strong style={{ display: 'block', fontSize: 14.6, marginTop: 4 }}>{USER.program || 'Your program'}</strong><p>Batch {USER.batch} · Student ID {USER.studentId} · {data.courses.length} subjects</p></div></div><div className="filter-row"><div className="segmented">{['All subjects', 'In progress', 'Completed'].map(f => <button key={f} className={filter === f ? 'selected' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div><span className="muted-text">{courses.length} subjects</span></div>{selected && <div className="detail-banner"><div><strong>{selected.title}</strong><p>Next lesson: {selected.next} · Instructor: {selected.instructor}</p></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Close course details"><X size={17}/></button><div className="detail-materials">{selected.materials.map(m => <span key={m.name}><FileText size={14}/>{m.name}</span>)}</div></div>}<div className="course-grid">{courses.map(c => <article className="course-card" key={c.id}><div className={cx('course-card-banner', `banner-${c.color}`)}><div className="course-symbol large"><BookOpen size={23}/></div><span className="course-code">{c.code}</span><div className="banner-decoration">✳</div></div><div className="course-card-body"><div className="course-card-title"><h3>{c.title}</h3><span className="course-menu">{c.progress}%</span></div><p className="instructor"><UserRound size={14}/>{c.instructor}</p><div className="course-progress-label"><span>Subject progress</span><strong>{c.progress}%</strong></div><ProgressBar value={c.progress} color={c.color}/><div className="course-meta"><span><BookOpen size={14}/>{c.completed}/{c.lessons} lessons</span><span><FileText size={14}/>{c.materials.length} resources</span></div><button className="outline-button course-open" onClick={() => setSelected(c)}>View subject <ArrowRight size={15}/></button></div></article>)}</div>{courses.length === 0 && <EmptyState title="No subjects here yet" text="Subjects in your course will appear here."/>}</div>
}

function Materials({ data, search }) {
  const [type, setType] = useState('All')
  const [subject, setSubject] = useState('All subjects')
  const resources = data.courses.flatMap(c => c.materials.map((m, i) => ({ ...m, course: c.title, color: c.color, id: `${c.id}-${i}` })))
  const filtered = resources.filter(r => (type === 'All' || r.type === type) && (subject === 'All subjects' || r.course === subject) && `${r.name} ${r.course}`.toLowerCase().includes(search.toLowerCase()))
  return <div className="page-stack"><SectionHeading eyebrow="LEARNING LIBRARY" title="Study Materials" subtitle="Your course notes, practice files, and helpful resources."/><div className="resource-summary"><div><div className="resource-summary-icon"><BookMarked size={20}/></div><div><strong>{resources.length} resources</strong><span>Across {data.courses.length} subjects</span></div></div><span className="library-label"><ShieldCheck size={15}/> Student library</span></div><div className="filter-row"><div className="segmented">{['All', 'PDF', 'DOC', 'ZIP'].map(f => <button className={type === f ? 'selected' : ''} key={f} onClick={() => setType(f)}>{f === 'All' ? 'All files' : f}</button>)}</div><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><select className="select-control" aria-label="Filter by subject" value={subject} onChange={e => setSubject(e.target.value)}><option>All subjects</option>{data.courses.map(c => <option key={c.id}>{c.title}</option>)}</select><span className="muted-text">{filtered.length} files</span></div></div><div className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>RESOURCE</th><th>SUBJECT</th><th>FILE TYPE</th><th>SIZE</th><th/></tr></thead><tbody>{filtered.map(r => <tr key={r.id}><td><div className="file-cell"><div className={cx('file-icon', `file-${r.type.toLowerCase()}`)}><FileText size={18}/></div><strong>{r.name}</strong></div></td><td><span className="course-tag">{r.course}</span></td><td><span className="type-pill">{r.type}</span></td><td className="muted-text">{r.size}</td><td><button className="primary-button small-download" aria-label={`Download ${r.name}`}><Download size={15}/> Download</button></td></tr>)}</tbody></table></div>{filtered.length === 0 && <EmptyState title="No matching resources" text="Try another subject, search or file type."/>}</div></div>
}

function Timetable({ data }) {
  const today = todayShort()
  const [day, setDay] = useState(() => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(today) ? today : 'All days')
  const days = data.timetable.filter(d => day === 'All days' || d.day === day)
  return <div className="page-stack"><SectionHeading eyebrow="PLAN YOUR WEEK" title="Class Timetable" subtitle="Your weekly schedule at a glance." action={<span className="date-chip"><CalendarDays size={15}/> 19–23 October, 2026</span>}/><div className="filter-row"><div className="segmented">{['All days', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => <button key={d} className={day === d ? 'selected' : ''} onClick={() => setDay(d)}>{d === today ? `${d} · Today` : d}</button>)}</div></div><div className="timetable-grid">{days.map(d => <section className={cx('day-column', d.day === today && 'today-column')} key={d.day}><div className="day-header"><span>{d.day}{d.day === today && ' · Today'}</span><strong>{d.date}</strong></div><div className="day-classes">{d.classes.length === 0 && <p className="muted-text">No classes — free day!</p>}{d.classes.map((c, i) => <article className={cx('class-card', `class-${c.color}`)} key={`${d.day}-${i}`}><span className="class-time"><Clock3 size={12}/>{c.time}</span><strong>{c.title}</strong><span className="class-room room-badge"><MapPin size={12}/>{c.room}</span></article>)}</div></section>)}</div><div className="timetable-legend"><span><i className="legend-violet"/>Python Programming</span><span><i className="legend-blue"/>Web Development</span><span><i className="legend-orange"/>Database Fundamentals</span><span><i className="legend-green"/>Career / Project</span></div><div className="helper-note"><AlarmClock size={15}/> Please check institute announcements for any last-minute schedule changes.</div></div>
}

function Attendance({ data }) {
  const [course, setCourse] = useState('All subjects')
  const rows = data.attendance.filter(a => course === 'All subjects' || a.course === course)
  const present = rows.filter(a => a.status === 'Present').length
  const rate = Math.round(present / Math.max(1, rows.length) * 100)
  const buf = attendanceBuffer(present, rows.length)
  const subjects = data.courses.map(c => { const r = data.attendance.filter(a => a.course === c.title); const p = r.filter(a => a.status === 'Present').length; const pct = r.length ? Math.round(p / r.length * 100) : null; return { title: c.title, pct, total: r.length, tone: pct === null ? 'blue' : pct >= 85 ? 'green' : pct >= 75 ? 'orange' : 'red', label: pct === null ? 'No classes yet' : pct >= 85 ? 'Safe' : pct >= 75 ? 'Borderline' : 'Low' } })
  return <div className="page-stack"><SectionHeading eyebrow="YOUR PARTICIPATION" title="Attendance" subtitle="Keep track of your learning sessions and attendance record."/><div className="stats-grid three-stats"><StatCard icon={CalendarCheck} label="Attendance rate" value={`${rate}%`} detail="For selected sessions" tone="green"/><StatCard icon={CheckCircle2} label="Present sessions" value={present} detail="Recorded as present" tone="blue"/><StatCard icon={Clock3} label="Absent sessions" value={rows.length - present} detail="Recorded as absent" tone="orange"/></div><div className={cx('buffer-card', buf.safe ? 'buffer-safe' : 'buffer-low')}>{buf.safe ? <CheckCircle2 size={22}/> : <AlarmClock size={22}/>}<div><strong>{buf.safe ? (buf.count > 0 ? `You can miss ${buf.count} more class${buf.count > 1 ? 'es' : ''} and stay above 75%` : 'You’re right at the 75% line — try not to miss the next class') : `Attend the next ${buf.count} class${buf.count > 1 ? 'es' : ''} in a row to get back to 75%`}</strong><p>You attended {present} of {rows.length} classes{course !== 'All subjects' ? ` in ${course}` : ''}. 75% is needed to sit exams.</p></div></div><Panel title="By subject" subtitle="Your attendance status in each subject"><div className="subject-att-list">{subjects.map(s => <button key={s.title} className="subject-att" onClick={() => setCourse(s.title)}><span>{s.title}</span><span className="muted-text">{s.pct === null ? '—' : `${s.pct}% · ${s.total} classes`}</span><span className={cx('due-tag', `due-${s.tone}`)}>{s.label}</span></button>)}</div></Panel><Panel title="Attendance history" subtitle="Recent sessions recorded in the portal" action={<select className="select-control" value={course} onChange={e => setCourse(e.target.value)}><option>All subjects</option>{data.courses.map(c => <option key={c.id}>{c.title}</option>)}</select>}><div className="table-scroll"><table><thead><tr><th>DATE</th><th>SUBJECT</th><th>STATUS</th></tr></thead><tbody>{rows.map((a, i) => <tr key={`${a.date}-${a.course}-${i}`}><td>{a.date}</td><td><strong className="normal-weight">{a.course}</strong></td><td><StatusPill>{a.status}</StatusPill></td></tr>)}</tbody></table></div></Panel><div className="notice-card"><ShieldCheck size={19}/><div><strong>Attendance guidance</strong><p>Aim for at least 75% attendance. Contact your mentor if you notice an incorrect record.</p></div></div></div>
}

function Marks({ data }) {
  const published = data.marks.filter(m => m.score !== null && m.status === 'Published')
  const totalScore = published.reduce((s, m) => s + m.score, 0)
  const totalPossible = published.reduce((s, m) => s + m.total, 0)
  return <div className="page-stack"><SectionHeading eyebrow="ACADEMIC PERFORMANCE" title="Marks & Results" subtitle="Your published scores and instructor feedback."/><div className="stats-grid three-stats"><StatCard icon={ChartNoAxesColumn} label="Assessments published" value={published.length} detail="Available results" tone="violet"/><StatCard icon={TrendingUp} label="Overall score" value={`${Math.round(totalScore / Math.max(1, totalPossible) * 100)}%`} detail={`${totalScore} out of ${totalPossible} points`} tone="green"/><StatCard icon={Clock3} label="Awaiting result" value={data.marks.filter(m => m.status !== 'Published').length} detail="Not yet released" tone="orange"/></div><Panel title="Assessment results" subtitle="Your score appears here after it has been published"><div className="table-scroll"><table><thead><tr><th>ASSESSMENT</th><th>SUBJECT</th><th>DATE</th><th>SCORE</th><th>GRADE</th><th>STATUS</th></tr></thead><tbody>{data.marks.map(m => <tr key={m.id}><td><div className="assessment-cell"><div className="file-icon file-pdf"><FileText size={17}/></div><strong>{m.assessment}</strong></div></td><td>{m.subject}</td><td className="muted-text">{m.date}</td><td>{m.score === null ? '—' : <strong>{m.score}<span className="muted-text">/{m.total}</span></strong>}</td><td>{m.score === null ? '—' : <span className="grade-pill">{getGrade(percent(m.score, m.total))}</span>}</td><td><StatusPill>{m.status}</StatusPill></td></tr>)}</tbody></table></div></Panel><Panel title="Instructor feedback" subtitle="Notes shared with your published results"><div className="feedback-list">{published.map(m => <div className="feedback-row" key={m.id}><div className="feedback-icon"><MessageSquare size={17}/></div><div><strong>{m.assessment}</strong><span>{m.subject}</span><p>{m.feedback}</p></div></div>)}</div></Panel></div>
}

function Assignments({ data, updateData }) {
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState(null)
  const [submission, setSubmission] = useState('')
  const [fileName, setFileName] = useState('')
  const [notice, setNotice] = useState('')
  const [subject, setSubject] = useState('All subjects')
  const [viewing, setViewing] = useState(null)
  const filtered = data.assignments.filter(a => (filter === 'All' || a.status === filter) && (subject === 'All subjects' || a.course === subject)).sort((a, b) => (a.status === 'Submitted') - (b.status === 'Submitted') || new Date(a.due) - new Date(b.due))
  function submitAssignment(e) {
    e.preventDefault()
    if (!submission.trim() && !fileName) return
    updateData(d => ({ ...d, assignments: d.assignments.map(a => a.id === selected.id ? { ...a, status: 'Submitted', submission: submission.trim(), fileName, submittedAt: new Date().toLocaleDateString('en-IN') } : a), notifications: [{ id: Date.now(), title: 'Assignment submitted', message: `${selected.title} was submitted successfully.`, time: 'Just now', read: false, kind: 'assignment' }, ...d.notifications] }))
    setNotice('Assignment submitted.')
    setSelected(null); setSubmission(''); setFileName('')
  }
  return <div className="page-stack"><SectionHeading eyebrow="STAY ON TRACK" title="Assignments" subtitle="Keep an eye on deadlines and submit your work on time."/><div className="stats-grid three-stats"><StatCard icon={ClipboardList} label="Total assignments" value={data.assignments.length} detail="Across all subjects" tone="violet"/><StatCard icon={Clock3} label="To do" value={data.assignments.filter(a => a.status !== 'Submitted').length} detail="Need your attention" tone="orange"/><StatCard icon={CheckCircle2} label="Submitted" value={data.assignments.filter(a => a.status === 'Submitted').length} detail="Sent for review" tone="green"/></div>{notice && <div className="success-banner"><CheckCircle2 size={17}/>{notice}<button onClick={() => setNotice('')}><X size={15}/></button></div>}<div className="filter-row"><div className="segmented">{['All', 'Not started', 'In progress', 'Submitted'].map(f => <button className={filter === f ? 'selected' : ''} key={f} onClick={() => setFilter(f)}>{f}</button>)}</div><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><select className="select-control" aria-label="Filter by subject" value={subject} onChange={e => setSubject(e.target.value)}><option>All subjects</option>{[...new Set(data.assignments.map(a => a.course))].map(c => <option key={c}>{c}</option>)}</select><span className="muted-text">{filtered.length} tasks</span></div></div><div className="assignment-list">{filtered.map(a => <article className="assignment-card" key={a.id}><div className={cx('assignment-icon', a.status === 'Submitted' ? 'assignment-done' : 'assignment-open')}>{a.status === 'Submitted' ? <CheckCircle2 size={21}/> : <ClipboardList size={21}/>}</div><div className="assignment-main"><div className="assignment-topline"><span className="course-tag">{a.course}</span><StatusPill>{a.status}</StatusPill></div><h3>{a.title}</h3><p>{a.description}</p><div className="assignment-meta"><DueTag a={a}/><span><CalendarDays size={14}/>Due {a.due}</span><span><Award size={14}/>{a.points} points</span>{a.submittedAt && <span><Check size={14}/>Submitted {a.submittedAt}</span>}</div></div>{a.status === 'Submitted' ? <button className="secondary-button" onClick={() => setViewing(a)}><Eye size={15}/> View submission</button> : <button className="primary-button" onClick={() => { setSelected(a); setSubmission(a.submission || ''); setFileName(a.fileName || '') }}>Open task <ArrowRight size={15}/></button>}</article>)}</div>{filtered.length === 0 && <EmptyState title="Nothing here" text="No tasks match these filters."/>}{viewing && <Modal title="Your submission" onClose={() => setViewing(null)}><div className="modal-course-tag">{viewing.course}</div><h3 className="modal-assignment-title">{viewing.title}</h3><p className="modal-description">Submitted {viewing.submittedAt || 'on time'} · {viewing.points} points</p><label className="field-label">Your answer</label><p className="submission-box">{viewing.submission || 'No written answer was added.'}</p>{viewing.fileName && <span className="selected-file"><FileText size={14}/>{viewing.fileName}</span>}<div className="modal-actions"><button className="primary-button" onClick={() => setViewing(null)}>Done</button></div></Modal>}{selected && <Modal title="Submit assignment" onClose={() => setSelected(null)}><div className="modal-course-tag">{selected.course}</div><h3 className="modal-assignment-title">{selected.title}</h3><p className="modal-description">{selected.description}</p><form onSubmit={submitAssignment}><label className="field-label" htmlFor="submission">Your answer or submission link</label><textarea id="submission" rows="4" value={submission} onChange={e => setSubmission(e.target.value)} placeholder="Write a short note or paste a link to your work..."/><label className="field-label file-label" htmlFor="assignment-file"><Paperclip size={15}/> Attach a file</label><input id="assignment-file" className="file-input" type="file" onChange={e => setFileName(e.target.files?.[0]?.name || '')}/>{fileName && <span className="selected-file"><FileText size={14}/>{fileName}</span>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setSelected(null)}>Cancel</button><button className="primary-button" type="submit"><Send size={15}/> Submit work</button></div></form></Modal>}</div>
}

function Modal({ title, onClose, children }) {
  useEffect(() => { const handler = e => { if (e.key === 'Escape') onClose() }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler) }, [onClose])
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><div className="modal-card" role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><h3>{title}</h3><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18}/></button></div>{children}</div></div>
}

function Leave({ data, updateData }) {
  const [showForm, setShowForm] = useState(false)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ type: 'Personal', from: '', to: '', reason: '' })
  const [details, setDetails] = useState(null)
  const leaves = [...data.leaves].sort((a, b) => b.id.localeCompare(a.id))
  function apply(e) {
    e.preventDefault()
    if (new Date(form.to) < new Date(form.from)) { setNotice('The end date must be on or after the start date.'); return }
    const days = Math.round((new Date(form.to) - new Date(form.from)) / 86400000) + 1
    const fmt = date => new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const item = { id: `LV-${Math.floor(1000 + Math.random() * 9000)}`, type: form.type, from: fmt(form.from), to: fmt(form.to), days, reason: form.reason, status: 'Pending', remarks: 'Your request has been submitted and is awaiting staff review.', applied: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
    updateData(d => ({ ...d, leaves: [item, ...d.leaves], notifications: [{ id: Date.now(), title: 'Leave request submitted', message: `Your leave request ${item.id} is pending review.`, time: 'Just now', read: false, kind: 'leave' }, ...d.notifications] }))
    setForm({ type: 'Personal', from: '', to: '', reason: '' }); setShowForm(false); setNotice(`Leave request ${item.id} submitted successfully.`)
  }
  return <div className="page-stack"><SectionHeading eyebrow="TIME AWAY" title="Leave Applications" subtitle="Submit a request and follow its approval status." action={<button className="primary-button" onClick={() => setShowForm(true)}><CirclePlus size={16}/> Apply for leave</button>}/>{notice && <div className={cx('success-banner', notice.startsWith('The end') && 'error-banner')}><CheckCircle2 size={17}/>{notice}<button onClick={() => setNotice('')}><X size={15}/></button></div>}<div className="stats-grid three-stats"><StatCard icon={FileCheck2} label="Total requests" value={data.leaves.length} detail="Leave applications" tone="violet"/><StatCard icon={Clock3} label="Pending review" value={data.leaves.filter(l => l.status === 'Pending').length} detail="Awaiting a decision" tone="orange"/><StatCard icon={CheckCircle2} label="Approved" value={data.leaves.filter(l => l.status === 'Approved').length} detail="Approved requests" tone="green"/></div><Panel title="Your leave requests" subtitle="View the current status and any staff remarks"><div className="table-scroll"><table><thead><tr><th>REQUEST</th><th>LEAVE DATES</th><th>DAYS</th><th>STATUS</th><th/></tr></thead><tbody>{leaves.map(l => <tr key={l.id}><td><div className="leave-request-cell"><strong>{l.type} leave</strong><span>{l.id} · Applied {l.applied}</span></div></td><td>{l.from}{l.to !== l.from && <><br/><span className="muted-text">to {l.to}</span></>}</td><td>{l.days}</td><td><StatusPill>{l.status}</StatusPill></td><td><button className="text-button" onClick={() => setDetails(l)}>Details</button></td></tr>)}</tbody></table></div>{leaves.length === 0 && <EmptyState title="No leave requests yet" text="Use Apply for leave to submit your first request."/>}</Panel>{showForm && <Modal title="Apply for leave" onClose={() => setShowForm(false)}><p className="modal-description">Share the dates and a short reason for your request.</p><form onSubmit={apply} className="leave-form"><label className="field-label" htmlFor="leave-type">Leave type</label><select id="leave-type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option>Personal</option><option>Medical</option><option>Family</option><option>Other</option></select><div className="form-two-col"><div><label className="field-label" htmlFor="leave-from">From</label><input id="leave-from" type="date" value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} required/></div><div><label className="field-label" htmlFor="leave-to">To</label><input id="leave-to" type="date" min={form.from || undefined} value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} required/></div></div><label className="field-label" htmlFor="leave-reason">Reason</label><textarea id="leave-reason" rows="3" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Briefly explain your reason..." required minLength={5}/><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" type="submit"><Send size={15}/> Submit request</button></div></form></Modal>}{details && <Modal title={`Leave request ${details.id}`} onClose={() => setDetails(null)}><div className="leave-detail-top"><div className="detail-badge"><FileCheck2 size={20}/></div><div><strong>{details.type} leave</strong><span>{details.from}{details.to !== details.from ? ` – ${details.to}` : ''} · {details.days} day(s)</span></div><StatusPill>{details.status}</StatusPill></div><div className="detail-block"><span>Reason</span><p>{details.reason}</p></div><div className="remarks-box"><MessageSquare size={17}/><div><strong>Remarks</strong><p>{details.remarks || 'No remarks have been added yet.'}</p></div></div><div className="modal-actions"><button className="secondary-button" onClick={() => setDetails(null)}>Close</button></div></Modal>}</div>
}

function Certificates({ data }) {
  const [selected, setSelected] = useState(null)
  return <div className="page-stack"><SectionHeading eyebrow="YOUR ACHIEVEMENTS" title="Certificates" subtitle="Celebrate your progress and view your course achievements."/><div className="certificate-banner"><div className="certificate-banner-icon"><Award size={27}/></div><div><span className="eyebrow light">EVERY STEP COUNTS</span><h3>You're building something great.</h3><p>Your completed learning milestones will appear here as certificates.</p></div><div className="certificate-banner-art"><Award size={86}/></div></div><div className="course-grid certificate-grid">{data.certificates.map(c => <article className="certificate-card" key={c.id}><div className="certificate-art"><div className="certificate-seal"><Award size={28}/></div><span className="certificate-watermark">C</span><span className="certificate-caption">CERTIFICATE OF ACHIEVEMENT</span><strong>{c.title}</strong><span className="certificate-institute">{c.issuer}</span></div><div className="certificate-card-bottom"><div><strong>{c.title}</strong><span>{c.status === 'Issued' ? `Issued ${c.date}` : 'Complete the course to unlock'}</span></div><StatusPill>{c.status}</StatusPill><button className="icon-button" disabled={c.status !== 'Issued'} onClick={() => setSelected(c)} title="View certificate"><ExternalLink size={16}/></button></div></article>)}</div>{selected && <Modal title="Certificate preview" onClose={() => setSelected(null)}><div className="certificate-preview"><Award size={38}/><span>CERTIFICATE OF ACHIEVEMENT</span><h3>{selected.title}</h3><p>This is to recognise the learning milestone achieved by</p><strong>{USER.name}</strong><p>Issued by {selected.issuer}</p><small>{selected.id} · {selected.date}</small></div><div className="modal-actions"><button className="secondary-button" onClick={() => setSelected(null)}>Close preview</button></div></Modal>}</div>
}

function Notifications({ data, updateData }) {
  const [filter, setFilter] = useState('All')
  const list = data.notifications.filter(n => filter === 'All' || (filter === 'Unread' ? !n.read : n.read))
  function markAll() { updateData(d => ({ ...d, notifications: d.notifications.map(n => ({ ...n, read: true })) })) }
  function markOne(id) { updateData(d => ({ ...d, notifications: d.notifications.map(n => n.id === id ? { ...n, read: true } : n) })) }
  return <div className="page-stack"><SectionHeading eyebrow="YOUR UPDATES" title="Notifications" subtitle="A quick look at what’s new across your learning space." action={<button className="secondary-button" onClick={markAll}><Check size={15}/> Mark all as read</button>}/><div className="filter-row"><div className="segmented">{['All', 'Unread', 'Read'].map(f => <button key={f} className={filter === f ? 'selected' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div><span className="muted-text">{list.length} updates</span></div><div className="notification-list">{list.map(n => <article className={cx('notification-card', !n.read && 'notification-unread')} key={n.id}><div className={cx('notification-icon', `notify-${n.kind}`)}>{n.kind === 'result' ? <ChartNoAxesColumn size={19}/> : n.kind === 'assignment' ? <ClipboardList size={19}/> : n.kind === 'leave' ? <FileCheck2 size={19}/> : <BookOpen size={19}/>}</div><div className="notification-content"><div className="notification-title"><strong>{n.title}</strong>{!n.read && <span className="unread-label">NEW</span>}</div><p>{n.message}</p><span><Clock3 size={13}/>{n.time}</span></div>{!n.read && <button className="text-button" onClick={() => markOne(n.id)}>Mark read</button>}</article>)}</div>{list.length === 0 && <EmptyState icon={Bell} title="All caught up" text="There are no notifications in this view."/>}</div>
}

function Profile({ data, updateData, onReset }) {
  const [profile, setProfile] = useState({ name: USER.name, email: USER.email, phone: USER.phone, program: USER.program, batch: USER.batch })
  const [saved, setSaved] = useState(false)
  useEffect(() => { try { const p = JSON.parse(localStorage.getItem(profileKey()) || 'null'); if (p) setProfile(p) } catch {} }, [])
  function save(e) { e.preventDefault(); localStorage.setItem(profileKey(), JSON.stringify(profile)); setSaved(true); setTimeout(() => setSaved(false), 2500) }
  function reset() { if (window.confirm('Reset all your saved data and profile edits?')) { onReset(); setProfile({ name: USER.name, email: USER.email, phone: USER.phone, program: USER.program, batch: USER.batch }); localStorage.removeItem(profileKey()); setSaved(false) } }
  return <div className="page-stack"><SectionHeading eyebrow="YOUR ACCOUNT" title="My Profile" subtitle="Keep your student information up to date."/><div className="profile-layout"><div className="profile-main"><section className="panel profile-card"><div className="profile-cover"><div className="profile-avatar-large">{initials(profile.name)}</div></div><div className="profile-summary"><div><h3>{profile.name}</h3><p>{profile.program} · {profile.batch}</p><span className="verified-label"><ShieldCheck size={14}/> Student account</span></div><span className="student-id">{USER.studentId}</span></div><div className="profile-divider"/><form className="profile-form" onSubmit={save}><div className="profile-form-heading"><h3>Personal information</h3><p>These details are stored on this device.</p></div><div className="form-two-col"><div><label className="field-label" htmlFor="profile-name">Full name</label><input id="profile-name" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required/></div><div><label className="field-label" htmlFor="profile-email">Email address</label><input id="profile-email" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} required/></div><div><label className="field-label" htmlFor="profile-phone">Phone number</label><input id="profile-phone" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}/></div><div><label className="field-label" htmlFor="profile-program">Program</label><input id="profile-program" value={profile.program} onChange={e => setProfile({ ...profile, program: e.target.value })}/></div><div><label className="field-label" htmlFor="profile-batch">Batch</label><input id="profile-batch" value={profile.batch} onChange={e => setProfile({ ...profile, batch: e.target.value })}/></div><div><label className="field-label" htmlFor="profile-id">Student ID</label><input id="profile-id" value={USER.studentId} disabled/></div></div><div className="profile-actions">{saved && <span className="saved-note"><CheckCircle2 size={15}/> Changes saved</span>}<button type="submit" className="primary-button">Save changes <Check size={15}/></button></div></form></section></div><div className="profile-aside"><Panel title="Account details"><div className="account-detail"><span><Mail size={15}/> Email</span><strong>{USER.email}</strong></div><div className="account-detail"><span><GraduationCap size={15}/> Student ID</span><strong>{USER.studentId}</strong></div><div className="account-detail"><span><CalendarDays size={15}/> Joined</span><strong>{USER.joined}</strong></div><div className="account-detail"><span><ShieldCheck size={15}/> Account type</span><strong>Student</strong></div></Panel><Panel title="Data settings"><p className="settings-description">Reset your local changes and return to the original records.</p><button className="danger-outline-button" onClick={reset}><RotateCcw size={15}/> Reset data</button></Panel></div></div></div>
}

function SearchResults({ query, data, setPage }) {
  const q = query.toLowerCase().trim()
  if (!q) return null
  const results = [
    ...data.courses.filter(c => `${c.title} ${c.instructor}`.toLowerCase().includes(q)).map(c => ({ type: 'Course', title: c.title, subtitle: c.instructor, page: 'courses' })),
    ...data.assignments.filter(a => `${a.title} ${a.course}`.toLowerCase().includes(q)).map(a => ({ type: 'Assignment', title: a.title, subtitle: a.due, page: 'assignments' })),
    ...data.marks.filter(m => `${m.assessment} ${m.subject}`.toLowerCase().includes(q)).map(m => ({ type: 'Result', title: m.assessment, subtitle: m.subject, page: 'marks' })),
    ...data.notifications.filter(n => `${n.title} ${n.message}`.toLowerCase().includes(q)).map(n => ({ type: 'Notification', title: n.title, subtitle: n.time, page: 'notifications' })),
  ]
  return <div className="search-results"><div className="search-results-heading"><Search size={16}/> Results for “{query}” <span>{results.length}</span></div>{results.length ? results.map((r, i) => <button key={`${r.type}-${i}`} onClick={() => setPage(r.page)}><div><strong>{r.title}</strong><span>{r.type} · {r.subtitle}</span></div><ArrowRight size={15}/></button>) : <p>No matches found. Try a course or assignment name.</p>}</div>
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => { const acc = findAccount(localStorage.getItem('campusly-demo-session') || ''); if (acc) setCurrentUser(acc); return Boolean(acc) })
  const [page, setPage] = useState('dashboard')
  const [data, setData] = useState(loadDemoData)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => { saveDemoData(data) }, [data])
  useEffect(() => { const onKey = e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.querySelector('.global-search input')?.focus() } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [])
  const updateData = updater => setData(prev => typeof updater === 'function' ? updater(prev) : updater)
  function logout() { localStorage.removeItem('campusly-demo-session'); setLoggedIn(false); setPage('dashboard'); setSearch('') }
  function reset() { setData(resetDemoData()); localStorage.removeItem(profileKey()) }
  function login(acc) { setCurrentUser(acc); localStorage.setItem('campusly-demo-session', acc.email); setData(loadDemoData()); setPage('dashboard'); setLoggedIn(true) }
  if (!loggedIn) return <Login onLogin={login}/>

  const pageInfo = titles[page] || titles.dashboard
  return <div className="app-shell"><Sidebar page={page} setPage={setPage} data={data} onLogout={logout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/><main className="main-area"><Topbar page={page} setPage={setPage} data={data} setMobileOpen={setMobileOpen} search={search} setSearch={value => { setSearch(value); setShowSearch(Boolean(value.trim())) }}/><div className="content-area">{showSearch && search.trim() ? <><div className="search-page-heading"><div className="eyebrow">PORTAL SEARCH</div><h2>Search results</h2><p>Find courses, assignments, results, and notifications.</p></div><SearchResults query={search} data={data} setPage={id => { setPage(id); setSearch(''); setShowSearch(false) }}/><button className="link-button search-clear" onClick={() => { setSearch(''); setShowSearch(false) }}><X size={15}/> Clear search</button></> : <><div className="mobile-page-heading"><h1>{pageInfo[0]}</h1><p>{pageInfo[1]}</p></div>{page === 'dashboard' && <Dashboard data={data} setPage={setPage}/>}{page === 'courses' && <Courses data={data} setPage={setPage}/>}{page === 'materials' && <Materials data={data} search={search}/>}{page === 'timetable' && <Timetable data={data}/>}{page === 'attendance' && <Attendance data={data}/>}{page === 'marks' && <Marks data={data}/>}{page === 'assignments' && <Assignments data={data} updateData={updateData}/>}{page === 'exams' && <ExamSlots/>}{page === 'batch' && <MyBatch email={USER.email}/>}{page === 'fees' && <Fees/>}{page === 'leave' && <Leave data={data} updateData={updateData}/>}{page === 'certificates' && <Certificates data={data}/>}{page === 'notifications' && <Notifications data={data} updateData={updateData}/>}{page === 'profile' && <Profile data={data} updateData={updateData} onReset={reset}/>}</>}</div><footer className="app-footer"><span>© 2026 Student Portal</span><span><span className="footer-status-dot"/> All systems operational <span className="footer-separator">·</span> Student Portal</span></footer></main><BottomNav page={page} setPage={setPage} setMobileOpen={setMobileOpen}/></div>
}
const rupee = n => '₹' + n.toLocaleString('en-IN')

function ExamSlots() {
  const [f, setF] = useState('All')
  const rows = EXAM_SLOTS.filter(e => f === 'All' || e.status === f)
  return <div className="page-stack"><SectionHeading eyebrow="EXAMINATIONS" title="Exam Slots" subtitle="Your allotted exam dates, times, venues and seats."/><div className="stats-grid three-stats"><StatCard icon={NotebookPen} label="Total exams" value={EXAM_SLOTS.length} detail="This semester" tone="violet"/><StatCard icon={Clock3} label="Upcoming" value={EXAM_SLOTS.filter(e => e.status === 'Upcoming').length} detail="Scheduled ahead" tone="orange"/><StatCard icon={CheckCircle2} label="Completed" value={EXAM_SLOTS.filter(e => e.status === 'Completed').length} detail="Already written" tone="green"/></div><div className="filter-row"><div className="segmented">{['All', 'Upcoming', 'Completed'].map(x => <button key={x} className={f === x ? 'selected' : ''} onClick={() => setF(x)}>{x}</button>)}</div></div><Panel title="Exam schedule" subtitle="Reach the venue 20 minutes early"><div className="table-scroll"><table><thead><tr><th>SUBJECT</th><th>TYPE</th><th>DATE</th><th>TIME SLOT</th><th>VENUE</th><th>SEAT</th><th>STATUS</th></tr></thead><tbody>{rows.map(e => <tr key={e.id}><td><strong className="normal-weight">{e.subject}</strong><br/><span className="muted-text">{e.code}</span></td><td>{e.type}</td><td>{e.date}</td><td>{e.time}</td><td><MapPin size={13}/> {e.venue}</td><td><span className="course-tag">{e.seat}</span></td><td><StatusPill>{e.status}</StatusPill></td></tr>)}</tbody></table></div></Panel><div className="notice-card"><ShieldCheck size={19}/><div><strong>Exam guidelines</strong><p>Carry your student ID and hall ticket. Phones are not allowed inside the exam hall.</p></div></div></div>
}

function Fees() {
  const [r, setR] = useState(null)
  const total = FEES.reduce((a, b) => a + b.amount, 0)
  const paid = FEES.filter(x => x.status === 'Paid').reduce((a, b) => a + b.amount, 0)
  const next = FEES.find(x => x.status === 'Pending')
  return <div className="page-stack"><SectionHeading eyebrow="FINANCE" title="Fees & Payments" subtitle="Track paid and pending fees for your program."/><div className="stats-grid three-stats"><StatCard icon={Wallet} label="Total fees" value={rupee(total)} detail="Full program" tone="violet"/><StatCard icon={CheckCircle2} label="Paid" value={rupee(paid)} detail={`${Math.round(paid / total * 100)}% cleared`} tone="green"/><StatCard icon={Clock3} label="Pending" value={rupee(total - paid)} detail={next ? `Next due ${next.date}` : 'All clear'} tone="orange"/></div><Panel title="Fee breakdown" subtitle="Paid items show their receipt"><div className="table-scroll"><table><thead><tr><th>DESCRIPTION</th><th>DUE / PAID DATE</th><th>AMOUNT</th><th>STATUS</th><th/></tr></thead><tbody>{FEES.map(x => <tr key={x.id}><td><strong className="normal-weight">{x.title}</strong></td><td>{x.date}</td><td><strong>{rupee(x.amount)}</strong></td><td><span className={cx('status-pill', x.status === 'Paid' ? 'status-approved' : 'status-pending')}><i/>{x.status}</span></td><td>{x.receipt ? <button className="text-button" onClick={() => setR(x)}>View receipt</button> : <span className="muted-text">—</span>}</td></tr>)}</tbody></table></div></Panel><div className="notice-card"><CircleHelp size={19}/><div><strong>Payment help</strong><p>Pay pending fees at the accounts office before the due date.</p></div></div>{r && <Modal title={`Receipt ${r.receipt}`} onClose={() => setR(null)}><div className="detail-block"><span>Fee</span><p>{r.title}</p></div><div className="detail-block"><span>Amount</span><p>{rupee(r.amount)}</p></div><div className="detail-block"><span>Paid on</span><p>{r.date} · {r.method}</p></div><div className="modal-actions"><button className="secondary-button" onClick={() => setR(null)}>Close</button></div></Modal>}</div>
}
