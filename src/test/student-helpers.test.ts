import { describe, it, expect } from 'vitest'
import { attendanceBuffer, dueInfo } from '../campusly/App.jsx'
const now = new Date('2026-10-28T09:00:00')
describe('student helpers', () => {
  it('8 of 10 present allows missing 0 more at 75%', () => expect(attendanceBuffer(8, 10)).toEqual({ safe: true, count: 0 }))
  it('9 of 10 present allows missing 2 more', () => expect(attendanceBuffer(9, 10)).toEqual({ safe: true, count: 2 }))
  it('6 of 10 present needs 6 in a row to reach 75%', () => expect(attendanceBuffer(6, 10)).toEqual({ safe: false, count: 6 }))
  it('due in 2 days is orange', () => expect(dueInfo({ due: '30 Oct 2026', status: 'In progress' }, now)).toEqual({ label: 'Due in 2 days', tone: 'orange' }))
  it('past due is overdue', () => expect(dueInfo({ due: '27 Oct 2026', status: 'Not started' }, now).label).toBe('Overdue by 1 day'))
})
