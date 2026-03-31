// Shared types for the course builder
export type CourseLesson = {
  id: string
  title: string
  sort_order: number
  data: unknown
}

export type CourseThema = {
  id: string
  title: string
  description: string | null
  sort_order: number
  lessons: CourseLesson[]
}

export type CourseLernziel = {
  id: string
  text: string
  sort_order: number
}

export type CourseModule = {
  id: string
  title: string
  description: string | null
  sort_order: number
  module_lernziele: CourseLernziel[]
  themen: CourseThema[]
}

export type CourseData = {
  id: string
  title: string
  subtitle: string | null
  about: string | null
  cover_image_url: string | null
  published: boolean
}

export type TreeSelection =
  | { type: 'course' }
  | { type: 'module'; moduleId: string }
  | { type: 'thema'; moduleId: string; themaId: string }
  | { type: 'lesson'; moduleId: string; themaId: string; lessonId: string }
