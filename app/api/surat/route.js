import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendTelegramNotification } from '@/lib/telegram'

export async function POST(request) {
  try {
    const body = await request.json()
    const { nomor_agenda, pengirim, perihal, status, lokasi_posisi } = body

    const { data, error } = await supabase
      .from('surat')
      .insert([{ nomor_agenda, pengirim, perihal, status, lokasi_posisi }])
      .select()

    if (error) throw error

    // Notifikasi Telegram
    const message = `📩 <b>SURAT MASUK BARU</b>\n\n` +
      `• <b>No. Agenda:</b> ${nomor_agenda}\n` +
      `• <b>Pengirim:</b> ${pengirim}\n` +
      `• <b>Perihal:</b> ${perihal}\n` +
      `• <b>Status:</b> ${status}\n` +
      `• <b>Posisi:</b> ${lokasi_posisi}`

    await sendTelegramNotification(message)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}