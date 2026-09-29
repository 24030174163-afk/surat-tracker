import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendTelegramNotification } from '@/lib/telegram'

export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, nomor_agenda, status, lokasi_posisi } = body

    // 1. Update data di Supabase
    const { data, error } = await supabase
      .from('surat')
      .update({ status, lokasi_posisi })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase Update Error:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // 2. Kirim Notifikasi Telegram (di-catch terpisah agar update tetap sukses)
    try {
      const message = `🔄 <b>UPDATE DISPOSISI SURAT</b>\n\n` +
        `• <b>No. Agenda:</b> ${nomor_agenda}\n` +
        `• <b>Status Terbaru:</b> ${status}\n` +
        `• <b>Posisi Berkas:</b> ${lokasi_posisi}`

      await sendTelegramNotification(message)
    } catch (teleErr) {
      console.error('Telegram Error:', teleErr)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Server Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}