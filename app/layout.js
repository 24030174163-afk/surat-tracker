import './globals.css';

export const metadata = {
  title: 'Tracker Surat'
  description: 'Aplikasi Pelacakan dan Disposisi Surat Masuk',
  manifest: '/manifest.json',
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