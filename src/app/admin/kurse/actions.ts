'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// ─── Course ───

export async function createCourse(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const title = formData.get('title') as string
  const subtitle = formData.get('subtitle') as string
  if (!title?.trim()) {
    return { error: 'Titel ist erforderlich' }
  }

  const { error } = await supabase.from('courses').insert({
    title: title.trim(),
    subtitle: subtitle?.trim() || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/kurse')
  redirect('/admin/kurse')
}

export async function updateCourse(id: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const title = formData.get('title') as string
  const subtitle = formData.get('subtitle') as string
  const about = formData.get('about') as string
  const coverImageUrl = formData.get('cover_image_url') as string
  const published = formData.get('published') === 'on'

  if (!title?.trim()) {
    return { error: 'Titel ist erforderlich' }
  }

  const { error } = await supabase
    .from('courses')
    .update({
      title: title.trim(),
      subtitle: subtitle?.trim() || null,
      about: about?.trim() || null,
      cover_image_url: coverImageUrl?.trim() || null,
      published,
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${id}`)
  revalidatePath('/admin/kurse')
  redirect(`/admin/kurse/${id}`)
}

export async function updateCourseInline(id: string, updates: {
  title: string
  subtitle?: string | null
  about?: string | null
  cover_image_url?: string | null
  published: boolean
  available_languages?: string[]
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  if (!updates.title?.trim()) {
    return { error: 'Titel ist erforderlich' }
  }

  const { error } = await supabase
    .from('courses')
    .update({
      title: updates.title.trim(),
      subtitle: updates.subtitle?.trim() || null,
      about: updates.about?.trim() || null,
      cover_image_url: updates.cover_image_url?.trim() || null,
      published: updates.published,
      ...(updates.available_languages !== undefined && {
        available_languages: updates.available_languages,
      }),
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${id}`)
  revalidatePath(`/admin/kurse/${id}/builder`)
  revalidatePath('/admin/kurse')
}

export async function deleteCourse(id: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('courses').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/kurse')
  redirect('/admin/kurse')
}

// ─── Module ───

export async function createModule(courseId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const title = formData.get('title') as string
  if (!title?.trim()) {
    return { error: 'Titel ist erforderlich' }
  }

  const { data: existing } = await supabase
    .from('modules')
    .select('sort_order')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { error } = await supabase.from('modules').insert({
    course_id: courseId,
    title: title.trim(),
    sort_order: nextOrder,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${courseId}`)
}

export async function updateModule(id: string, courseId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const title = formData.get('title') as string
  const description = formData.get('description') as string

  if (!title?.trim()) {
    return { error: 'Titel ist erforderlich' }
  }

  const { error } = await supabase
    .from('modules')
    .update({ title: title.trim(), description: description?.trim() || null })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${courseId}`)
}

export async function deleteModule(id: string, courseId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('modules').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${courseId}`)
}

// ─── Module Lernziele ───

export async function createModuleLernziel(moduleId: string, courseId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const text = formData.get('text') as string
  if (!text?.trim()) {
    return { error: 'Text ist erforderlich' }
  }

  const { data: existing } = await supabase
    .from('module_lernziele')
    .select('sort_order')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { error } = await supabase.from('module_lernziele').insert({
    module_id: moduleId,
    text: text.trim(),
    sort_order: nextOrder,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${courseId}`)
}

export async function updateModuleLernziel(id: string, courseId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const text = formData.get('text') as string
  if (!text?.trim()) {
    return { error: 'Text ist erforderlich' }
  }

  const { error } = await supabase
    .from('module_lernziele')
    .update({ text: text.trim() })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${courseId}`)
}

export async function deleteModuleLernziel(id: string, courseId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('module_lernziele').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${courseId}`)
}

// ─── Themen ───

export async function createThema(moduleId: string, courseId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const title = formData.get('title') as string
  if (!title?.trim()) {
    return { error: 'Titel ist erforderlich' }
  }

  const { data: existing } = await supabase
    .from('themen')
    .select('sort_order')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { error } = await supabase.from('themen').insert({
    module_id: moduleId,
    title: title.trim(),
    sort_order: nextOrder,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${courseId}`)
}

export async function updateThema(id: string, courseId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const title = formData.get('title') as string
  const description = formData.get('description') as string

  if (!title?.trim()) {
    return { error: 'Titel ist erforderlich' }
  }

  const { error } = await supabase
    .from('themen')
    .update({ title: title.trim(), description: description?.trim() || null })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${courseId}`)
}

export async function deleteThema(id: string, courseId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('themen').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${courseId}`)
}

// ─── Lesson ───

export async function createLesson(themaId: string, courseId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const title = formData.get('title') as string
  if (!title?.trim()) {
    return { error: 'Titel ist erforderlich' }
  }

  const { data: existing } = await supabase
    .from('lessons')
    .select('sort_order')
    .eq('thema_id', themaId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { error } = await supabase.from('lessons').insert({
    thema_id: themaId,
    title: title.trim(),
    data: { blocks: [], settings: {} },
    sort_order: nextOrder,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${courseId}`)
}

export async function updateLessonTitle(id: string, courseId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const title = formData.get('title') as string
  if (!title?.trim()) {
    return { error: 'Titel ist erforderlich' }
  }

  const { error } = await supabase
    .from('lessons')
    .update({ title: title.trim() })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${courseId}`)
}

export async function deleteLesson(id: string, courseId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('lessons').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${courseId}`)
}

// ─── Reorder ───

export async function reorderItems(
  table: 'modules' | 'themen' | 'lessons' | 'module_lernziele',
  courseId: string,
  items: { id: string; sort_order: number }[]
) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  for (const item of items) {
    const { error } = await supabase
      .from(table)
      .update({ sort_order: item.sort_order })
      .eq('id', item.id)

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath(`/admin/kurse/${courseId}`)
}

// ─── Inline creation (returns id) ───

export async function createModuleInline(courseId: string, title: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: existing } = await supabase
    .from('modules')
    .select('sort_order')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { data, error } = await supabase.from('modules').insert({
    course_id: courseId,
    title: title.trim(),
    sort_order: nextOrder,
  }).select('id').single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${courseId}`)
  return { id: data.id }
}

export async function createThemaInline(moduleId: string, courseId: string, title: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: existing } = await supabase
    .from('themen')
    .select('sort_order')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { data, error } = await supabase.from('themen').insert({
    module_id: moduleId,
    title: title.trim(),
    sort_order: nextOrder,
  }).select('id').single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${courseId}`)
  return { id: data.id }
}

export async function createLessonInline(themaId: string, courseId: string, title: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: existing } = await supabase
    .from('lessons')
    .select('sort_order')
    .eq('thema_id', themaId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { data, error } = await supabase.from('lessons').insert({
    thema_id: themaId,
    title: title.trim(),
    data: { blocks: [], settings: {} },
    sort_order: nextOrder,
  }).select('id').single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/kurse/${courseId}`)
  return { id: data.id }
}

// ─── Inline updates (no FormData needed) ───

export async function updateModuleInline(id: string, courseId: string, updates: { title?: string; description?: string | null }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('modules')
    .update(updates)
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/admin/kurse/${courseId}`)
}

export async function updateThemaInline(id: string, courseId: string, updates: { title?: string; description?: string | null }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('themen')
    .update(updates)
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/admin/kurse/${courseId}`)
}

export async function updateLessonInline(id: string, courseId: string, updates: { title?: string }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('lessons')
    .update(updates)
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/admin/kurse/${courseId}`)
}

