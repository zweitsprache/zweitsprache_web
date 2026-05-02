'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function updateAnmeldungStatus(id: string, status: string) {
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'waitlist']
  if (!validStatuses.includes(status)) throw new Error('Ungültiger Status')

  const supabase = createClient(await cookies())
  const { error } = await supabase
    .from('anmeldungen')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/anmeldungen')
  revalidatePath(`/admin/anmeldungen/${id}`)
}

export async function deleteAnmeldung(id: string) {
  const supabase = createClient(await cookies())
  const { error } = await supabase
    .from('anmeldungen')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/anmeldungen')
}
