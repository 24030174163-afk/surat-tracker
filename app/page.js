'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sendTelegramNotification } from '../lib/telegram';

export default function SuratApp() {
  // Mode Navigasi: 'admin' atau 'public'
  const [activeTab, setActiveTab] = useState('admin');

  // State Data Surat
  const [suratList, setSuratList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State (Input Surat Baru)
  const [noAgenda, setNoAgenda] = useState('');
  const [pengirim, setPengirim] = useState('');
  const [perihal, setPerihal] = useState('');
  const [statusAwal, setStatusAwal] = useState('Diproses');
  const [posisiSaatIni, setPosisiSaatIni] = useState('Subag Umum');

  // State Lacak Surat (Portal Publik)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  // Modal State (Edit Status & Posisi Admin)
  const [selectedSurat, setSelectedSurat] = useState(null); // Menyimpan objek surat yang diedit
  const [editStatus, setEditStatus] = useState('Diproses');
  const [editPosisi, setEditPosisi] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Fetch Data dari Supabase
  useEffect(() => {
    fetchSurat();
  }, []);

  const fetchSurat = async () => {
    try {
      const { data, error } = await supabase
        .from('surat')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error);
        return;
      }
      setSuratList(data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  // Simpan Surat Baru
  const handleSimpanSurat = async (e) => {
    e.preventDefault();
    if (!noAgenda || !pengirim || !perihal) {
      alert('Harap isi No. Agenda, Pengirim, dan Perihal!');
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
      // 1. Simpan ke Supabase
      const { error } = await supabase.from('surat').insert([newSurat]);

      if (error) {
        alert('Gagal menyimpan ke Supabase: ' + error.message);
        setLoading(false);
        return;
      }

      // 2. Kirim Notifikasi Telegram
      const pesan = `📩 <b>SURAT MASUK BARU</b>\n\n<b>No. Agenda:</b> ${noAgenda}\n<b>Pengirim:</b> ${pengirim}\n<b>Perihal:</b> ${perihal}\n<b>Status:</b> ${statusAwal}\n<b>Posisi:</b> ${posisiSaatIni || 'Subag Umum'}`;
      await sendTelegramNotification(pesan);

      // 3. Reset Form & Refresh
      setNoAgenda('');
      setPengirim('');
      setPerihal('');
      setPosisiSaatIni('Subag Umum');
      await fetchSurat();
      alert('Surat berhasil disimpan & notifikasi terkirim!');
    } catch (err) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Buka Modal Edit
  const handleOpenEditModal = (item) => {
    setSelectedSurat(item);
    setEditStatus(item.status || 'Diproses');
    setEditPosisi(item.posisi || 'Subag Umum');
  };

  // Tutup Modal Edit
  const handleCloseEditModal = () => {
    setSelectedSurat(null);
  };

  // Simpan Perubahan Status & Posisi
  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    if (!selectedSurat) return;

    setEditLoading(true);
    try {
      // 1. Update ke Supabase
      let query = supabase.from('surat').update({
        status: editStatus,
        posisi: editPosisi,
      });

      if (selectedSurat.id) {
        query = query.eq('id', selectedSurat.id);
      } else {
        query = query.eq('no_agenda', selectedSurat.no_agenda);
      }

      const { error } = await query;

      if (error) {
        alert('Gagal memperbarui di Supabase: ' + error.message);
        setEditLoading(false);
        return;
      }

      // 2. Kirim Notifikasi Update ke Telegram
      const pesan = `🔄 <b>UPDATE DISPOSISI SURAT</b>\n\n` +
        `<b>No. Agenda:</b> ${selectedSurat.no_agenda}\n` +
        `<b>Pengirim:</b> ${selectedSurat.pengirim}\n` +
        `<b>Status Baru:</b> ${editStatus}\n` +
        `<b>Posisi Baru:</b> ${editPosisi}`;
      
      await sendTelegramNotification(pesan);

      // 3. Refresh Data & Tutup Modal
      await fetchSurat();
      setSelectedSurat(null);
      alert('Status & posisi surat berhasil diperbarui!');
    } catch (err) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Cari Surat di Portal Publik
  const handleCariSurat = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const found = suratList.find(
      (s) => s.no_agenda.toLowerCase() === searchQuery.trim().toLowerCase()
    );
    setSearchResult(found || 'NOT_FOUND');
  };

  return (
    <div className="min-h-screen bg-slate-200/60 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <header className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {activeTab === 'admin' ? 'Dashboard Admin Surat' : 'Portal Publik Surat'}
            </h1>
            <p className="text-xs text-slate-500">
              {activeTab === 'admin' 
                ? 'Input dan perbarui status disposisi surat' 
                : 'Lacak status surat & kirim pengajuan surat masuk'}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('public')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'public'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🌐 Portal Publik
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'admin'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚙️ Dashboard Admin
            </button>
          </div>
        </header>

        {/* TAMPILAN DASHBOARD ADMIN */}
        {activeTab === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Input Surat Masuk */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="text-blue-600 text-lg">⚙️</span>
                <h2 className="font-bold text-slate-800 text-base">Input Surat Masuk</h2>
              </div>

              <form onSubmit={handleSimpanSurat} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Agenda</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SRT-001"
                    value={noAgenda}
                    onChange={(e) => setNoAgenda(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pengirim</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Instansi / Pengirim"
                    value={pengirim}
                    onChange={(e) => setPengirim(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Awal</label>
                  <select
                    value={statusAwal}
                    onChange={(e) => setStatusAwal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    placeholder="Subag Umum / Bidang Pembinaan"
                    value={posisiSaatIni}
                    onChange={(e) => setPosisiSaatIni(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Tabel Daftar Surat */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
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
                    {suratList.length > 0 ? (
                      suratList.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-slate-50/80 transition">
                          <td className="py-4 px-3 font-semibold text-blue-600 whitespace-nowrap">
                            {item.no_agenda}
                          </td>
                          <td className="py-4 px-3">
                            <div className="font-bold text-slate-800">{item.pengirim}</div>
                            <div className="text-slate-500 text-[11px]">{item.perihal}</div>
                          </td>
                          <td className="py-4 px-3 whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide text-white mb-1 ${
                                item.status === 'SELESAI'
                                  ? 'bg-teal-500'
                                  : item.status === 'Ditolak'
                                  ? 'bg-red-500'
                                  : 'bg-sky-500'
                              }`}
                            >
                              {item.status || 'Diproses'}
                            </span>
                            <div className="text-slate-500 text-[11px]">{item.posisi || 'Subag Umum'}</div>
                          </td>
                          <td className="py-4 px-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* TOMBOL UPDATE BUKA MODAL EDIT */}
                              <button
                                onClick={() => handleOpenEditModal(item)}
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-6 text-slate-400">
                          Belum ada data surat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAMPILAN PORTAL PUBLIK */}
        {activeTab === 'public' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="font-bold text-slate-800 text-base border-b pb-2">🔍 Lacak Status Surat</h2>
              <form onSubmit={handleCariSurat} className="space-y-3">
                <input
                  type="text"
                  placeholder="Masukkan No. Agenda (contoh: SRT-001)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-xl transition"
                >
                  Cari Surat
                </button>
              </form>

              {searchResult && searchResult !== 'NOT_FOUND' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1 mt-4">
                  <div className="font-bold text-blue-900 text-sm">{searchResult.no_agenda}</div>
                  <div className="text-slate-600">Pengirim: {searchResult.pengirim}</div>
                  <div className="text-slate-600">Perihal: {searchResult.perihal}</div>
                  <div className="mt-2 pt-2 border-t border-blue-200 flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Status: {searchResult.status}</span>
                    <span className="text-slate-500">Posisi: {searchResult.posisi}</span>
                  </div>
                </div>
              )}

              {searchResult === 'NOT_FOUND' && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs mt-4">
                  Surat dengan No. Agenda tersebut tidak ditemukan.
                </div>
              )}
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="font-bold text-slate-800 text-base border-b pb-2">📝 Form Pengajuan Surat Masuk</h2>
              <form onSubmit={handleSimpanSurat} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Agenda / No. Surat</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SRT-002"
                    value={noAgenda}
                    onChange={(e) => setNoAgenda(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instansi / Pengirim</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Instansi atau Pengirim"
                    value={pengirim}
                    onChange={(e) => setPengirim(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Perihal Surat</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Tuliskan perihal atau isi singkat surat..."
                    value={perihal}
                    onChange={(e) => setPerihal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition shadow-xs"
                >
                  {loading ? 'Kirim...' : 'Kirim Pengajuan Surat'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* JENDELA DIALOG MODAL POP-UP EDIT STATUS & POSISI */}
        {selectedSurat && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-800 text-sm">
                  Update Disposisi: <span className="text-blue-600">{selectedSurat.no_agenda}</span>
                </h3>
                <button
                  onClick={handleCloseEditModal}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSaveUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Pengirim & Perihal</label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="font-bold text-slate-800">{selectedSurat.pengirim}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{selectedSurat.perihal}</div>
                  </div>
                </div>

                {/* DROPDOWN STATUS 3 OPSI */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Disposisi</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="Diproses">Diproses</option>
                    <option value="SELESAI">SELESAI</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>

                {/* INPUT POSISI SAAT INI */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Posisi Saat Ini</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Subag Umum / Bidang Pembinaan"
                    value={editPosisi}
                    onChange={(e) => setEditPosisi(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition disabled:opacity-50"
                  >
                    {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}