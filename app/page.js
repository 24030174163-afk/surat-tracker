'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sendTelegramNotification } from '../lib/telegram';

export default function SuratTracker() {
  const [suratList, setSuratList] = useState([]);
  const [searchNomor, setSearchNomor] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form input state
  const [nomorSurat, setNomorSurat] = useState('');
  const [pengirim, setPengirim] = useState('');
  const [perihal, setPerihal] = useState('');

  // Ambil data dari Supabase saat halaman dimuat
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
      setSuratList(data || []);
    } catch (err) {
      console.error('Gagal mengambil data:', err.message);
    }
  };

  // Fungsi Pelacakan Surat
  const handleCariSurat = (e) => {
    e.preventDefault();
    if (!searchNomor.trim()) return;
    const found = suratList.find(
      (s) => s.nomor_surat.toLowerCase() === searchNomor.trim().toLowerCase()
    );
    setSearchResult(found || 'NOT_FOUND');
  };

  // Fungsi Tambah Surat
  const handleTambahSurat = async (e) => {
    e.preventDefault();
    if (!nomorSurat || !pengirim || !perihal) return;

    setLoading(true);
    try {
      const newSurat = {
        nomor_surat: nomorSurat,
        pengirim: pengirim,
        perihal: perihal,
        status: 'Diproses',
      };

      const { data, error } = await supabase.from('surat').insert([newSurat]).select();

      if (error) throw error;

      // Kirim Notifikasi Telegram
      const pesan = `📩 <b>SURAT MASUK BARU</b>\n\n<b>No. Surat:</b> ${nomorSurat}\n<b>Pengirim:</b> ${pengirim}\n<b>Perihal:</b> ${perihal}\n<b>Status:</b> Diproses`;
      await sendTelegramNotification(pesan);

      // Reset form & Refresh tabel
      setNomorSurat('');
      setPengirim('');
      setPerihal('');
      fetchSurat();
      alert('Surat berhasil disimpan & notifikasi dikirim!');
    } catch (err) {
      alert('Gagal menyimpan surat: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-blue-600">📩 Surat Tracker</h1>
          <p className="text-slate-500">Sistem Pelacakan & Manajemen Surat Masuk</p>
        </header>

        {/* Form Lacak Surat */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4 text-slate-700">Lacak Status Surat</h2>
          <form onSubmit={handleCariSurat} className="flex gap-2">
            <input
              type="text"
              placeholder="Masukkan Nomor Surat..."
              value={searchNomor}
              onChange={(e) => setSearchNomor(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              Cari
            </button>
          </form>

          {/* Hasil Pencarian */}
          {searchResult && searchResult !== 'NOT_FOUND' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-semibold text-blue-900">Nomor: {searchResult.nomor_surat}</p>
              <p className="text-sm text-slate-600">Pengirim: {searchResult.pengirim}</p>
              <p className="text-sm text-slate-600">Perihal: {searchResult.perihal}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                Status: {searchResult.status}
              </span>
            </div>
          )}

          {searchResult === 'NOT_FOUND' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              Nomor surat tidak ditemukan.
            </div>
          )}
        </section>

        {/* Form Input Surat */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4 text-slate-700">Input Surat Masuk Baru</h2>
          <form onSubmit={handleTambahSurat} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nomor Surat</label>
              <input
                type="text"
                required
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                placeholder="Contoh: 001/SK/2026"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pengirim</label>
              <input
                type="text"
                required
                value={pengirim}
                onChange={(e) => setPengirim(e.target.value)}
                placeholder="Nama Instansi / Pengirim"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Perihal</label>
              <input
                type="text"
                required
                value={perihal}
                onChange={(e) => setPerihal(e.target.value)}
                placeholder="Ringkasan Perihal Surat"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan & Kirim Notifikasi Telegram'}
            </button>
          </form>
        </section>

        {/* Tabel Daftar Surat */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4 text-slate-700">Daftar Surat Masuk</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-100 text-sm text-slate-600">
                  <th className="p-3">No. Surat</th>
                  <th className="p-3">Pengirim</th>
                  <th className="p-3">Perihal</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {suratList.length > 0 ? (
                  suratList.map((surat) => (
                    <tr key={surat.id} className="hover:bg-slate-50 text-sm">
                      <td className="p-3 font-medium">{surat.nomor_surat}</td>
                      <td className="p-3">{surat.pengirim}</td>
                      <td className="p-3">{surat.perihal}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                          {surat.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-slate-400 text-sm">
                      Belum ada data surat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}