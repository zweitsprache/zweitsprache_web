'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createAngebot(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const title = formData.get('title') as string
  const subtitle = formData.get('subtitle') as string
  if (!title?.trim()) {
    return { error: 'Title is required' }
  }

  const { error } = await supabase.from('angebote').insert({ title: title.trim(), subtitle: subtitle?.trim() || null })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/angebote')
  redirect('/admin/angebote')
}

export async function updateAngebot(id: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const title = formData.get('title') as string
  const subtitle = formData.get('subtitle') as string
  if (!title?.trim()) {
    return { error: 'Title is required' }
  }

  const { error } = await supabase
    .from('angebote')
    .update({ title: title.trim(), subtitle: subtitle?.trim() || null })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/angebote/${id}`)
  revalidatePath('/admin/angebote')
  redirect(`/admin/angebote/${id}`)
}

export async function deleteAngebot(id: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('angebote').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/angebote')
  redirect('/admin/angebote')
}

export async function createDurchfuehrung(angebotId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('durchfuehrungen').insert({
    angebot_id: angebotId,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/angebote/${angebotId}`)
}

export async function deleteDurchfuehrung(id: string, angebotId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('durchfuehrungen').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/angebote/${angebotId}`)
}

export async function createTermin(durchfuehrungId: string, angebotId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const date = formData.get('date') as string
  const startTime = formData.get('start_time') as string
  const endTime = formData.get('end_time') as string

  if (!date || !startTime || !endTime) {
    return { error: 'Datum, Start- und Endzeit sind erforderlich' }
  }

  const start_datetime = `${date}T${startTime}`
  const end_datetime = `${date}T${endTime}`

  const { error } = await supabase.from('termine').insert({
    durchfuehrung_id: durchfuehrungId,
    start_datetime,
    end_datetime,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/angebote/${angebotId}`)
}

export async function updateTermin(
  id: string,
  angebotId: string,
  formData: FormData
) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const date = formData.get('date') as string
  const startTime = formData.get('start_time') as string
  const endTime = formData.get('end_time') as string

  if (!date || !startTime || !endTime) {
    return { error: 'Datum, Start- und Endzeit sind erforderlich' }
  }

  const start_datetime = `${date}T${startTime}`
  const end_datetime = `${date}T${endTime}`

  const { error } = await supabase
    .from('termine')
    .update({ start_datetime, end_datetime })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/angebote/${angebotId}`)
}

export async function deleteTermin(id: string, angebotId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('termine').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/angebote/${angebotId}`)
}
