'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createWorkshop(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const title = formData.get('title') as string
  const subtitle = formData.get('subtitle') as string
  if (!title?.trim()) {
    return { error: 'Title is required' }
  }

  const { error } = await supabase.from('workshops').insert({ title: title.trim(), subtitle: subtitle?.trim() || null })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/workshops')
  redirect('/admin/workshops')
}

export async function updateWorkshop(id: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const title = formData.get('title') as string
  const subtitle = formData.get('subtitle') as string
  const about = formData.get('about') as string
  const minTeilnehmerRaw = formData.get('min_teilnehmer') as string
  const maxTeilnehmerRaw = formData.get('max_teilnehmer') as string
  const preisRaw = formData.get('preis') as string
  if (!title?.trim()) {
    return { error: 'Title is required' }
  }

  const min_teilnehmer = minTeilnehmerRaw ? parseInt(minTeilnehmerRaw, 10) : null
  const max_teilnehmer = maxTeilnehmerRaw ? parseInt(maxTeilnehmerRaw, 10) : null
  const preis = preisRaw ? parseFloat(preisRaw) : null

  const { error } = await supabase
    .from('workshops')
    .update({ title: title.trim(), subtitle: subtitle?.trim() || null, about: about?.trim() || null, min_teilnehmer, max_teilnehmer, preis })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${id}`)
  revalidatePath('/admin/workshops')
  redirect(`/admin/workshops/${id}`)
}

export async function deleteWorkshop(id: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('workshops').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/workshops')
  redirect('/admin/workshops')
}

export async function createDurchfuehrung(workshopId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('durchfuehrungen').insert({
    workshop_id: workshopId,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function deleteDurchfuehrung(id: string, workshopId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('durchfuehrungen').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function updateDurchfuehrungOrt(id: string, workshopId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const ort = formData.get('ort') as string

  const { error } = await supabase.from('durchfuehrungen').update({ ort }).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function createTermin(durchfuehrungId: string, workshopId: string, formData: FormData) {
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

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function updateTermin(
  id: string,
  workshopId: string,
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

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function deleteTermin(id: string, workshopId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('termine').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function createLernziel(workshopId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const text = formData.get('text') as string
  if (!text?.trim()) {
    return { error: 'Text ist erforderlich' }
  }

  // Get the next sort_order
  const { data: existing } = await supabase
    .from('lernziele')
    .select('sort_order')
    .eq('workshop_id', workshopId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { error } = await supabase.from('lernziele').insert({
    workshop_id: workshopId,
    text: text.trim(),
    sort_order: nextOrder,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function updateLernziel(id: string, workshopId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const text = formData.get('text') as string
  if (!text?.trim()) {
    return { error: 'Text ist erforderlich' }
  }

  const { error } = await supabase
    .from('lernziele')
    .update({ text: text.trim() })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function deleteLernziel(id: string, workshopId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('lernziele').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function createInhalt(workshopId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const text = formData.get('text') as string
  if (!text?.trim()) {
    return { error: 'Text ist erforderlich' }
  }

  const { data: existing } = await supabase
    .from('inhalte')
    .select('sort_order')
    .eq('workshop_id', workshopId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { error } = await supabase.from('inhalte').insert({
    workshop_id: workshopId,
    text: text.trim(),
    sort_order: nextOrder,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function updateInhalt(id: string, workshopId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const text = formData.get('text') as string
  if (!text?.trim()) {
    return { error: 'Text ist erforderlich' }
  }

  const { error } = await supabase
    .from('inhalte')
    .update({ text: text.trim() })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function deleteInhalt(id: string, workshopId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('inhalte').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function createVoraussetzung(workshopId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const text = formData.get('text') as string
  if (!text?.trim()) {
    return { error: 'Text ist erforderlich' }
  }

  const { data: existing } = await supabase
    .from('voraussetzungen')
    .select('sort_order')
    .eq('workshop_id', workshopId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { error } = await supabase.from('voraussetzungen').insert({
    workshop_id: workshopId,
    text: text.trim(),
    sort_order: nextOrder,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function updateVoraussetzung(id: string, workshopId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const text = formData.get('text') as string
  if (!text?.trim()) {
    return { error: 'Text ist erforderlich' }
  }

  const { error } = await supabase
    .from('voraussetzungen')
    .update({ text: text.trim() })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function deleteVoraussetzung(id: string, workshopId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('voraussetzungen').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function createStimme(workshopId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const text = formData.get('text') as string
  const name = formData.get('name') as string
  if (!text?.trim()) {
    return { error: 'Zitat ist erforderlich' }
  }

  const { data: existing } = await supabase
    .from('workshop_stimmen')
    .select('sort_order')
    .eq('workshop_id', workshopId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

  const { error } = await supabase.from('workshop_stimmen').insert({
    workshop_id: workshopId,
    text: text.trim(),
    name: name?.trim() || null,
    sort_order: nextOrder,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function updateStimme(id: string, workshopId: string, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const text = formData.get('text') as string
  const name = formData.get('name') as string
  if (!text?.trim()) {
    return { error: 'Zitat ist erforderlich' }
  }

  const { error } = await supabase
    .from('workshop_stimmen')
    .update({ text: text.trim(), name: name?.trim() || null })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function deleteStimme(id: string, workshopId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.from('workshop_stimmen').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
}

export async function updateDurchfuehrungStatus(id: string, workshopId: string, status: string) {
  const validStatuses = ['geplant', 'bestätigt', 'abgesagt']
  if (!validStatuses.includes(status)) {
    return { error: 'Ungültiger Status.' }
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase
    .from('durchfuehrungen')
    .update({ status })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/workshops/${workshopId}`)
  revalidatePath('/admin/durchfuehrungen')
}
