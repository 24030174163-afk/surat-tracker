export async function sendTelegramNotification(message) {
  try {
    const response = await fetch('/api/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Gagal kirim Telegram:', result.error);
    }
  } catch (error) {
    console.error('Error saat menghubungi API Telegram:', error);
  }
}