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

// ─── Lesson ───

export async function createLesson(moduleId: string, courseId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const title = formData.get('title') as string
  if (!title?.trim()) {
    return { error: 'Titel ist erforderlich' }
  }

  const { data: existing } = await supabase
    .from('lessons')
    .select('sort_order')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { error } = await supabase.from('lessons').insert({
    module_id: moduleId,
    title: title.trim(),
    data: { content: [], root: { props: {} }, zones: {} },
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
