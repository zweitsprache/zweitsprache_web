'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

const RESERVED_SLUGS = ['angebote', 'admin', 'api']

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function createPage(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const title = formData.get('title') as string
  const slugInput = formData.get('slug') as string

  if (!title?.trim()) {
    return { error: 'Titel ist erforderlich' }
  }

  const slug = slugInput?.trim() ? slugify(slugInput.trim()) : slugify(title.trim())

  if (!slug) {
    return { error: 'Slug konnte nicht generiert werden' }
  }

  if (RESERVED_SLUGS.includes(slug)) {
    return { error: `"${slug}" ist ein reservierter Pfad` }
  }

  const { error } = await supabase.from('pages').insert({
    title: title.trim(),
    slug,
    data: { content: [], root: { props: {} }, zones: {} },
  })

  if (error) {
    if (error.code === '23505') {
      return { error: `Eine Seite mit dem Pfad "/${slug}" existiert bereits` }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/seiten')
  redirect(`/admin/seiten/${slug}/edit`)
}

export async function updatePageMeta(slug: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const title = formData.get('title') as string
  if (!title?.trim()) {
    return { error: 'Titel ist erforderlich' }
  }

  const { error } = await supabase
    .from('pages')
    .update({ title: title.trim() })
    .eq('slug', slug)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/seiten')
  revalidatePath(`/${slug}`)
}

export async function togglePublish(slug: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: page } = await supabase
    .from('pages')
    .select('published')
    .eq('slug', slug)
    .single()

  if (!page) {
    return { error: 'Seite nicht gefunden' }
  }

  const { error } = await supabase
    .from('pages')
    .update({ published: !page.published })
    .eq('slug', slug)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/seiten')
  revalidatePath(`/${slug}`)
}

export async function deletePage(slug: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('pages').delete().eq('slug', slug)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/seiten')
  redirect('/admin/seiten')
}
