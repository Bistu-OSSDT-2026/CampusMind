'use client'

import { useState, useEffect } from 'react'
import { Course } from '@/types'
import { api } from '@/lib/api'
import { CourseForm } from '@/components/CourseForm'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.courses.all()
      if (response.code === 0) {
        setCourses(response.data || [])
      } else {
        setError(response.message || '加载课程失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCourse = async (courseData: Omit<Course, 'course_id' | 'created_at'>) => {
    try {
      const response = await api.courses.create(courseData)
      if (response.code === 0) {
        const newCourse: Course = {
          ...courseData,
          course_id: response.data.course_id,
          created_at: response.data.created_at,
        }
        setCourses((prev) => [...prev, newCourse])
        setShowForm(false)
      } else {
        setError(response.message || '创建课程失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误')
    }
  }

  const handleEditCourse = async (courseId: string, courseData: Partial<Course>) => {
    try {
      const response = await api.courses.update(courseId, courseData)
      if (response.code === 0) {
        setCourses((prev) =>
          prev.map((c) =>
            c.course_id === courseId ? { ...c, ...courseData } : c
          )
        )
        setEditingCourse(null)
        setShowForm(false)
      } else {
        setError(response.message || '更新课程失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误')
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('确定要删除这门课程吗？')) return
    try {
      const response = await api.courses.delete(courseId)
      if (response.code === 0) {
        setCourses((prev) => prev.filter((c) => c.course_id !== courseId))
      } else {
        setError(response.message || '删除课程失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误')
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setShowForm(true)
  }

  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/20 to-teal-50/20">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">课程管理</h1>
            <p className="text-sm text-gray-500 mt-1">管理您的课程列表</p>
          </div>
          <button
            onClick={() => {
              setEditingCourse(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加课程
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {showForm && (
          <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {editingCourse ? '编辑课程' : '添加新课程'}
            </h2>
            <CourseForm
              initialData={editingCourse}
              onSubmit={editingCourse ? (data) => handleEditCourse(editingCourse.course_id, data) : handleAddCourse}
              onSaveAndBack={(data) => {
                if (editingCourse) {
                  handleEditCourse(editingCourse.course_id, data).then(() => {
                    window.location.href = '/'
                  })
                } else {
                  handleAddCourse(data).then(() => {
                    window.location.href = '/'
                  })
                }
              }}
              onCancel={() => {
                setShowForm(false)
                setEditingCourse(null)
              }}
            />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">课程列表</h2>
            <p className="text-sm text-gray-500">共 {courses.length} 门课程</p>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent" />
              <p className="mt-4 text-gray-500">加载中...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-4 text-gray-500">暂无课程</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                添加第一门课程
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {courses.map((course) => (
                <div key={course.course_id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-primary-600">
                          {course.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{course.name}</h3>
                        <p className="text-sm text-gray-500">
                          {course.teacher} · {course.location}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {weekDays[course.weekday - 1]} 第{course.start_period}-{course.end_period}节
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(course)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.course_id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}