export default function manifest() {
  return {
    name: 'Sistem Lacak Surat DPD',
    short_name: 'LacakSurat',
    description: 'Aplikasi Pelacakan dan Disposisi Surat Masuk',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}