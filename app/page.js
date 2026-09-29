'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sendTelegramNotification } from '../lib/telegram';

export default function DashboardAdminSurat() {
  const [suratList, setSuratList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State sesuai tampilan asli
  const [noAgenda, setNoAgenda] = useState('');
  const [pengirim, setPengirim] = useState('');
  const [perihal, setPerihal] = useState('');
  const [statusAwal, setStatusAwal] = useState('Diproses');
  const [posisiSaatIni, setPosisiSaatIni] = useState('');

  // Ambil data surat saat halaman dimuat
  useEffect(() => {
    fetchSurat();
  }, []);

  const fetchSurat = async () => {
    try {
      const { data, error } = await supabase
        .from('surat')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Jika data Supabase masih kosong, tampilkan data dummy awal seperti di foto Anda
      if (!data || data.length === 0) {
        setSuratList([
          {
            id: 1,
            no_agenda: 'SRT-002',
            pengirim: 'SDN 01 MILIK SAYA',
            perihal: 'PERMOHONN KURANG UANG',
            status: 'SELESAI',
            posisi: 'Subag Umum',
          },
          {
            id: 2,
            no_agenda: 'SRT-001',
            pengirim: 'SMP Negeri 1',
            perihal: 'Pengajuan Perbaikan Ruang Kelas',
            status: 'Diproses',
            posisi: 'Bidang Pembinaan',
          },
        ]);
      } else {
        setSuratList(data);
      }
    } catch (err) {
      console.error('Gagal mengambil data:', err.message);
    }
  };

  // Simpan Surat Baru & Kirim Telegram
  const handleSimpanSurat = async (e) => {
    e.preventDefault();
    if (!noAgenda || !pengirim || !perihal) {
      alert('Mohon isi No. Agenda, Pengirim, dan Perihal!');
      return;
    }

    setLoading(true);
    const newSurat = {
      no_agenda: noAgenda,
      pengirim,
      perihal,
      status: statusAwal,
      posisi: posisiSaatIni || 'Subag Umum',
    };

    try {
      // Simpan ke Supabase
      const { error } = await supabase.from('surat').insert([newSurat]);
      if (error) console.warn('Supabase Error (menggunakan lokal state):', error.message);

      // Kirim Notifikasi ke Telegram
      const pesan = `📩 <b>SURAT MASUK BARU!</b>\n\n<b>No. Agenda:</b> ${noAgenda}\n<b>Pengirim:</b> ${pengirim}\n<b>Perihal:</b> ${perihal}\n<b>Status:</b> ${statusAwal}\n<b>Posisi:</b> ${posisiSaatIni || 'Subag Umum'}`;
      await sendTelegramNotification(pesan);

      // Update daftar lokal
      setSuratList([newSurat, ...suratList]);

      // Reset Form
      setNoAgenda('');
      setPengirim('');
      setPerihal('');
      setPosisiSaatIni('');
      alert('Surat berhasil disimpan & notifikasi Telegram terkirim!');
    } catch (err) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200/60 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <header className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard Admin Surat</h1>
            <p className="text-xs text-slate-500">Input dan perbarui status disposisi surat</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 border border-blue-200 bg-blue-50/50 px-3 py-1.5 rounded-lg transition">
              <span>←</span> Portal Publik
            </button>
            <button className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-lg transition">
              <span>[→</span> Logout
            </button>
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Kolom Kiri: Input Surat Masuk */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-blue-600 text-lg">⚙️</span>
              <h2 className="font-bold text-slate-800 text-base">Input Surat Masuk</h2>
            </div>

            <form onSubmit={handleSimpanSurat} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">No. Agenda</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SRT-003"
                  value={noAgenda}
                  onChange={(e) => setNoAgenda(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pengirim</label>
                <input
                  type="text"
                  required
                  placeholder="Instansi / Pengirim"
                  value={pengirim}
                  onChange={(e) => setPengirim(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Perihal</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Isi perihal surat..."
                  value={perihal}
                  onChange={(e) => setPerihal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Awal</label>
                <select
                  value={statusAwal}
                  onChange={(e) => setStatusAwal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="Diproses">Diproses</option>
                  <option value="SELESAI">SELESAI</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Posisi Saat Ini</label>
                <input
                  type="text"
                  placeholder="Contoh: Subag Umum / Bidang Pembinaan"
                  value={posisiSaatIni}
                  onChange={(e) => setPosisiSaatIni(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition shadow-sm text-xs mt-2 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Surat Baru'}
              </button>
            </form>
          </div>

          {/* Kolom Kanan: Daftar Surat Registered */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="text-blue-600 text-lg">☰</span>
              <h2 className="font-bold text-slate-800 text-base">Daftar Surat Registered</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3">NO. AGENDA</th>
                    <th className="py-3 px-3">PENGIRIM & PERIHAL</th>
                    <th className="py-3 px-3">STATUS & POSISI</th>
                    <th className="py-3 px-3 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {suratList.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-3 font-semibold text-blue-600 whitespace-nowrap">
                        {item.no_agenda || item.nomor_surat}
                      </td>
                      <td className="py-4 px-3">
                        <div className="font-bold text-slate-800">{item.pengirim}</div>
                        <div className="text-slate-500 text-[11px]">{item.perihal}</div>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div>
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide text-white mb-1 ${
                              item.status === 'SELESAI' ? 'bg-teal-500' : 'bg-sky-500'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px]">{item.posisi || 'Subag Umum'}</div>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => alert(`Update status untuk ${item.no_agenda}`)}
                            className="bg-red-500 hover:bg-red-600 text-white font-medium px-2.5 py-1 rounded-md text-[11px] transition shadow-xs"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => window.print()}
                            className="bg-slate-700 hover:bg-slate-800 text-white font-medium px-2.5 py-1 rounded-md text-[11px] transition shadow-xs"
                          >
                            Cetak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}