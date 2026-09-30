import { sendTelegramNotification } from './telegram';

/**
 * Kirim Notifikasi ke Telegram dan WhatsApp sekaligus
 * @param {Object} params
 * @param {string} params.pesanTelegram - Pesan format HTML untuk Telegram
 * @param {string} params.pesanWA - Pesan teks biasa untuk WhatsApp
 * @param {string} [params.nomorWaTarget] - Nomor WA tujuan pemohon (contoh: 08123456789)
 */
export async function sendNotification({ pesanTelegram, pesanWA, nomorWaTarget }) {
  // 1. Kirim ke Telegram Admin
  try {
    if (pesanTelegram) {
      await sendTelegramNotification(pesanTelegram);
    }
  } catch (err) {
    console.error('Error Notifikasi Telegram:', err);
  }

  // 2. Kirim ke WhatsApp via Fonnte (Opsional jika Token & Nomor WA diisi)
  const fonnteToken = process.env.NEXT_PUBLIC_FONNTE_TOKEN;
  if (fonnteToken && nomorWaTarget) {
    try {
      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': fonnteToken,
        },
        body: new URLSearchParams({
          target: nomorWaTarget,
          message: pesanWA,
        }),
      });
    } catch (err) {
      console.error('Error Notifikasi WhatsApp:', err);
    }
  }
}