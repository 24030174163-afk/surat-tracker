import './globals.css';

export const metadata = {
  title: 'Surat Tracker - Pelacakan Surat Masuk',
  description: 'Sistem Manajemen dan Pelacakan Surat Masuk',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}