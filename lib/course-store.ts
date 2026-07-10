import fs from 'fs'
import path from 'path'
import { mockCourses } from './mock-data'

export interface Course {
  course_id: string
  name: string
  teacher: string
  location: string
  weekday: number
  start_period: number
  end_period: number
  week_range: string
  created_at: string
}

const DATA_FILE = path.join(process.cwd(), 'data', 'courses.json')

let memoryCourses: Course[] = []
let initialized = false

function ensureDataDir(): void {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function initializeCourses(): void {
  if (initialized) return
  
  ensureDataDir()
  
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8')
      memoryCourses = JSON.parse(data)
    } else {
      memoryCourses = mockCourses.map(c => ({
        course_id: c.id,
        name: c.name,
        teacher: c.teacher,
        location: c.location,
        weekday: c.weekday,
        start_period: c.start_period,
        end_period: c.end_period,
        week_range: c.week_range,
        created_at: c.created_at,
      }))
      fs.writeFileSync(DATA_FILE, JSON.stringify(memoryCourses, null, 2))
    }
  } catch {
    memoryCourses = mockCourses.map(c => ({
      course_id: c.id,
      name: c.name,
      teacher: c.teacher,
      location: c.location,
      weekday: c.weekday,
      start_period: c.start_period,
      end_period: c.end_period,
      week_range: c.week_range,
      created_at: c.created_at,
    }))
  }
  
  initialized = true
}

function saveCourses(): void {
  try {
    ensureDataDir()
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryCourses, null, 2))
  } catch {}
}

export function getAllCourses(): Course[] {
  initializeCourses()
  return [...memoryCourses]
}

export function addCourse(course: Omit<Course, 'course_id'>): Course {
  initializeCourses()
  const newCourse: Course = {
    ...course,
    course_id: `course-${Date.now()}`,
  }
  memoryCourses.push(newCourse)
  saveCourses()
  return newCourse
}

export function updateCourse(courseId: string, updates: Partial<Course>): Course | null {
  initializeCourses()
  const index = memoryCourses.findIndex(c => c.course_id === courseId)
  if (index === -1) return null
  
  memoryCourses[index] = { ...memoryCourses[index], ...updates }
  saveCourses()
  return memoryCourses[index]
}

export function deleteCourse(courseId: string): boolean {
  initializeCourses()
  const initialLength = memoryCourses.length
  memoryCourses = memoryCourses.filter(c => c.course_id !== courseId)
  const deleted = memoryCourses.length !== initialLength
  if (deleted) {
    saveCourses()
  }
  return deleted
}

export function getCoursesByWeekday(weekday: number): Course[] {
  initializeCourses()
  return memoryCourses.filter(c => c.weekday === weekday)
}