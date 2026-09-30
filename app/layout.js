export const metadata = {
  title: 'Sistem Lacak Surat DPD',
  description: 'Aplikasi Pelacakan dan Disposisi Surat Masuk',
  manifest: '/manifest.webmanifest',
};

export const viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}