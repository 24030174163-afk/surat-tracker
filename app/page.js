'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sendNotification } from '../lib/notification';

// 🔑 KATA SANDI ADMIN
const ADMIN_PASSWORD = 'dikdas123';

export default function SuratApp() {
  // Mode Navigasi: 'admin' atau 'public'
  const [activeTab, setActiveTab] = useState('public');

  // State Autentikasi Admin
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // State Data Surat & Filter
  const [suratList, setSuratList] = useState([]);
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [loading, setLoading] = useState(false);

  // Form State (Input Surat Baru)
  const [noAgenda, setNoAgenda] = useState('');
  const [pengirim, setPengirim] = useState('');
  const [perihal, setPerihal] = useState('');
  const [noWa, setNoWa] = useState('');
  const [statusAwal, setStatusAwal] = useState('Diproses');
  const [posisiSaatIni, setPosisiSaatIni] = useState('Subag Umum');
  
  // State Jenis Surat & Upload File
  const [jenisSurat, setJenisSurat] = useState('Online'); // 'Online' | 'Offline'
  const [selectedFile, setSelectedFile] = useState(null);

  // State Lacak Surat (Portal Publik)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  // Modal State (Edit Status, Posisi, WA Admin, & Upload/Ganti File)
  const [selectedSurat, setSelectedSurat] = useState(null);
  const [editStatus, setEditStatus] = useState('Diproses');
  const [editPosisi, setEditPosisi] = useState('');
  const [editNoWa, setEditNoWa] = useState('');
  const [editSelectedFile, setEditSelectedFile] = useState(null);
  const [editFileType, setEditFileType] = useState('pdf'); // 'pdf' | 'foto'
  const [editLoading, setEditLoading] = useState(false);

  // Cek Status Login Admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = sessionStorage.getItem('isAdminAuth');
      if (savedAuth === 'true') {
        setIsAdminAuth(true);
      }
    }
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

  // Fungsi Helper Upload File ke Supabase Storage
  const uploadFileToStorage = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('surat-files')
      .upload(fileName, file);

    if (error) {
      throw new Error('Gagal mengunggah file ke Supabase Storage: ' + error.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from('surat-files')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  // Handler Login Admin
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (inputPassword === ADMIN_PASSWORD) {
      setIsAdminAuth(true);
      sessionStorage.setItem('isAdminAuth', 'true');
      setInputPassword('');
      setPasswordError('');
    } else {
      setPasswordError('Kata sandi salah! Silakan coba lagi.');
    }
  };

  // Handler Logout Admin
  const handleAdminLogout = () => {
    setIsAdminAuth(false);
    sessionStorage.removeItem('isAdminAuth');
    setActiveTab('public');
  };

  // Simpan Surat Baru (Admin & Public)
  const handleSimpanSurat = async (e) => {
    e.preventDefault();
    if (!noAgenda || !pengirim || !perihal) {
      alert('Harap isi No. Agenda, Pengirim, dan Perihal!');
      return;
    }

    setLoading(true);
    try {
      let uploadedFotoUrl = null;
      let uploadedPdfUrl = null;

      // Upload file jika ada
      if (selectedFile) {
        const fileUrl = await uploadFileToStorage(selectedFile);
        if (jenisSurat === 'Offline') {
          uploadedFotoUrl = fileUrl;
        } else {
          uploadedPdfUrl = fileUrl;
        }
      }

      const newSurat = {
        no_agenda: noAgenda,
        pengirim,
        perihal,
        status: statusAwal,
        posisi: posisiSaatIni || 'Subag Umum',
        no_wa: noWa,
        jenis_surat: jenisSurat,
        foto_url: uploadedFotoUrl,
        pdf_url: uploadedPdfUrl,
      };

      const { error } = await supabase.from('surat').insert([newSurat]);

      if (error) {
        alert('Gagal menyimpan ke Supabase: ' + error.message);
        setLoading(false);
        return;
      }

      const pesanTelegram = `📩 <b>SURAT MASUK BARU (${jenisSurat.toUpperCase()})</b>\n\n` +
        `<b>No. Agenda:</b> ${noAgenda}\n` +
        `<b>Pengirim:</b> ${pengirim}\n` +
        `<b>Perihal:</b> ${perihal}\n` +
        `<b>Jenis:</b> ${jenisSurat}\n` +
        `<b>Status:</b> ${statusAwal}\n` +
        `<b>Posisi:</b> ${posisiSaatIni || 'Subag Umum'}`;

      const pesanWA = `*SURAT MASUK BERHASIL TERDAFTAR*\n\n` +
        `No. Agenda: ${noAgenda}\n` +
        `Pengirim: ${pengirim}\n` +
        `Perihal: ${perihal}\n` +
        `Jenis Surat: ${jenisSurat}\n` +
        `Status: ${statusAwal}\n` +
        `Posisi: ${posisiSaatIni || 'Subag Umum'}\n\n` +
        `Lacak status surat Anda secara berkala di portal publik.`;

      await sendNotification({
        pesanTelegram,
        pesanWA,
        nomorWaTarget: noWa,
      });

      // Reset Form
      setNoAgenda('');
      setPengirim('');
      setPerihal('');
      setNoWa('');
      setPosisiSaatIni('Subag Umum');
      setSelectedFile(null);
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
    setEditNoWa(item.no_wa || '');
    setEditSelectedFile(null);
    setEditFileType(item.jenis_surat === 'Offline' ? 'foto' : 'pdf');
  };

  const handleCloseEditModal = () => {
    setSelectedSurat(null);
    setEditSelectedFile(null);
  };

  // Update Status, Disposisi & Unggah Berkas Baru
  const handleSaveUpdate = async (e) => {
    e.preventDefault();
    if (!selectedSurat) return;

    setEditLoading(true);
    try {
      const targetPhone = (editNoWa || selectedSurat.no_wa || '').trim();

      let newPdfUrl = selectedSurat.pdf_url;
      let newFotoUrl = selectedSurat.foto_url;

      // Jika ada file baru yang diunggah oleh admin
      if (editSelectedFile) {
        const uploadedUrl = await uploadFileToStorage(editSelectedFile);
        if (editFileType === 'pdf') {
          newPdfUrl = uploadedUrl;
        } else {
          newFotoUrl = uploadedUrl;
        }
      }

      const updatePayload = {
        status: editStatus,
        posisi: editPosisi,
        no_wa: targetPhone,
        pdf_url: newPdfUrl,
        foto_url: newFotoUrl,
      };

      let query = supabase.from('surat').update(updatePayload);

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

      const clean = (str) => (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      const pesanTelegram = `🔄 <b>UPDATE DISPOSISI SURAT</b>\n\n` +
        `<b>No. Agenda:</b> ${clean(selectedSurat.no_agenda)}\n` +
        `<b>Pengirim:</b> ${clean(selectedSurat.pengirim)}\n` +
        `<b>Status Baru:</b> ${clean(editStatus)}\n` +
        `<b>Posisi Baru:</b> ${clean(editPosisi)}` +
        (editSelectedFile ? `\n<b>File Lampiran:</b> Berkas baru telah diunggah.` : '');

      const pesanWA = `*UPDATE DISPOSISI SURAT*\n\n` +
        `No. Agenda: ${selectedSurat.no_agenda}\n` +
        `Pengirim: ${selectedSurat.pengirim}\n` +
        `Status Baru: ${editStatus}\n` +
        `Posisi Baru: ${editPosisi}\n\n` +
        `Silakan cek berkas surat Anda melalui portal publik.`;

      const notifResult = await sendNotification({
        pesanTelegram,
        pesanWA,
        nomorWaTarget: targetPhone,
      });

      await fetchSurat();
      handleCloseEditModal();

      if (notifResult && notifResult.errors && notifResult.errors.length > 0) {
        alert('Data berhasil diperbarui di database, TETAPI notifikasi gagal:\n\n' + notifResult.errors.join('\n'));
      } else {
        alert('Status, posisi, & berkas surat berhasil diperbarui!');
      }
    } catch (err) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (suratList.length === 0) {
      alert('Belum ada data untuk diexport!');
      return;
    }

    const headers = ['No. Agenda', 'Jenis', 'Pengirim', 'Perihal', 'Status', 'Posisi', 'No. WA', 'File URL'];
    const rows = suratList.map((item) => [
      `"${item.no_agenda || ''}"`,
      `"${item.jenis_surat || 'Online'}"`,
      `"${item.pengirim || ''}"`,
      `"${item.perihal || ''}"`,
      `"${item.status || ''}"`,
      `"${item.posisi || ''}"`,
      `"${item.no_wa || ''}"`,
      `"${item.pdf_url || item.foto_url || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_surat_masuk_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Dashboard Stats
  const totalSurat = suratList.length;
  const diprosesCount = suratList.filter((s) => s.status === 'Diproses').length;
  const selesaiCount = suratList.filter((s) => s.status === 'SELESAI').length;
  const ditolakCount = suratList.filter((s) => s.status === 'Ditolak').length;

  const filteredSuratList = suratList.filter((item) => {
    if (filterStatus === 'Semua') return true;
    return item.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-slate-200/60 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <header className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {activeTab === 'admin' ? 'Dashboard Admin Surat' : 'Portal Publik Surat'}
            </h1>
            <p className="text-xs text-slate-500">
              {activeTab === 'admin' 
                ? 'Analitik, kelola dan perbarui status disposisi surat' 
                : 'Lacak status surat & unduh berkas surat masuk'}
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
            {isAdminAuth && activeTab === 'admin' && (
              <button
                onClick={handleAdminLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition"
              >
                🔒 Keluar
              </button>
            )}
          </div>
        </header>

        {/* TAMPILAN DASHBOARD ADMIN */}
        {activeTab === 'admin' && (
          <>
            {!isAdminAuth ? (
              /* FORM LOGIN ADMIN */
              <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6 text-center">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mx-auto border border-blue-100">
                  🔐
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Akses Admin Terkunci</h2>
                  <p className="text-xs text-slate-500 mt-1">Masukkan kata sandi untuk mengelola data surat</p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi Admin</label>
                    <input
                      type="password"
                      required
                      placeholder="Masukkan kata sandi..."
                      value={inputPassword}
                      onChange={(e) => setInputPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 focus:bg-white"
                    />
                  </div>

                  {passwordError && (
                    <p className="text-xs text-red-500 font-medium">{passwordError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-xl transition shadow-xs"
                  >
                    Buka Akses Admin
                  </button>
                </form>
              </div>
            ) : (
              /* DASHBOARD UTAMA ADMIN */
              <div className="space-y-6">
                
                {/* WIDGET DASHBOARD ANALITIK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL SURAT</p>
                      <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{totalSurat}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Surat terdaftar di sistem</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl font-bold border border-blue-100">
                      📊
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-sky-500 uppercase tracking-wider">DIPROSES</p>
                      <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{diprosesCount}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {totalSurat > 0 ? `${Math.round((diprosesCount / totalSurat) * 100)}% dari total surat` : '0%'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center text-xl font-bold border border-sky-100">
                      ⏳
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">SELESAI</p>
                      <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{selesaiCount}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Disposisi rampung</p>
                    </div>
                    <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center text-xl font-bold border border-teal-100">
                      ✅
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider">DITOLAK</p>
                      <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{ditolakCount}</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Pengajuan berkas ditolak</p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-xl font-bold border border-red-100">
                      ❌
                    </div>
                  </div>
                </div>

                {/* FORM INPUT & TABEL SURAT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Form Input Surat Masuk (Admin) */}
                  <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <span className="text-blue-600 text-lg">⚙️</span>
                      <h2 className="font-bold text-slate-800 text-base">Input Surat Masuk</h2>
                    </div>

                    <form onSubmit={handleSimpanSurat} className="space-y-3.5 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Jenis Surat</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => { setJenisSurat('Online'); setSelectedFile(null); }}
                            className={`py-2 rounded-xl border text-xs font-bold transition ${
                              jenisSurat === 'Online'
                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            💻 Online (PDF)
                          </button>
                          <button
                            type="button"
                            onClick={() => { setJenisSurat('Offline'); setSelectedFile(null); }}
                            className={`py-2 rounded-xl border text-xs font-bold transition ${
                              jenisSurat === 'Offline'
                                ? 'bg-amber-50 border-amber-500 text-amber-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            📦 Offline (Foto)
                          </button>
                        </div>
                      </div>

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
                          rows="2"
                          required
                          placeholder="Isi perihal surat..."
                          value={perihal}
                          onChange={(e) => setPerihal(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        ></textarea>
                      </div>

                      {/* File Input Sesuai Jenis Surat */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          {jenisSurat === 'Offline' ? '📷 Upload Bukti Foto (Gambar)' : '📄 Upload File PDF Surat'}
                        </label>
                        <input
                          type="file"
                          accept={jenisSurat === 'Offline' ? 'image/*' : 'application/pdf'}
                          onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          {jenisSurat === 'Offline' ? 'Format: JPG, PNG, WEBP' : 'Format: PDF'}
                        </p>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Pengirim (Opsional)</label>
                        <input
                          type="text"
                          placeholder="Contoh: 081234567890"
                          value={noWa}
                          onChange={(e) => setNoWa(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Status Awal</label>
                          <select
                            value={statusAwal}
                            onChange={(e) => setStatusAwal(e.target.value)}
                            className="w-full px-2 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Diproses">Diproses</option>
                            <option value="SELESAI">SELESAI</option>
                            <option value="Ditolak">Ditolak</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Posisi Surat</label>
                          <input
                            type="text"
                            placeholder="Subag Umum"
                            value={posisiSaatIni}
                            onChange={(e) => setPosisiSaatIni(e.target.value)}
                            className="w-full px-2 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition shadow-xs text-xs mt-2 disabled:opacity-50"
                      >
                        {loading ? 'Mengunggah & Menyimpan...' : 'Simpan Surat Baru'}
                      </button>
                    </form>
                  </div>

                  {/* Tabel Daftar Surat */}
                  <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 text-lg">☰</span>
                        <h2 className="font-bold text-slate-800 text-base">Daftar Surat Registered</h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Semua">Semua Status</option>
                          <option value="Diproses">Diproses</option>
                          <option value="SELESAI">SELESAI</option>
                          <option value="Ditolak">Ditolak</option>
                        </select>

                        <button
                          onClick={handleExportCSV}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition shadow-xs flex items-center gap-1"
                        >
                          📥 Export CSV
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-3 px-3">NO. AGENDA</th>
                            <th className="py-3 px-3">PENGIRIM & PERIHAL</th>
                            <th className="py-3 px-3">BERKAS</th>
                            <th className="py-3 px-3">STATUS & POSISI</th>
                            <th className="py-3 px-3 text-center">AKSI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {filteredSuratList.length > 0 ? (
                            filteredSuratList.map((item, index) => {
                              const fileUrl = item.pdf_url || item.foto_url;
                              return (
                                <tr key={item.id || index} className="hover:bg-slate-50/80 transition">
                                  <td className="py-4 px-3 font-semibold text-blue-600 whitespace-nowrap">
                                    <div>{item.no_agenda}</div>
                                    <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded mt-1 ${
                                      item.jenis_surat === 'Offline' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {item.jenis_surat || 'Online'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-3">
                                    <div className="font-bold text-slate-800">{item.pengirim}</div>
                                    <div className="text-slate-500 text-[11px]">{item.perihal}</div>
                                  </td>
                                  <td className="py-4 px-3 whitespace-nowrap">
                                    {fileUrl ? (
                                      <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition"
                                      >
                                        {item.jenis_surat === 'Offline' ? '🖼️ Foto' : '📄 PDF'}
                                      </a>
                                    ) : (
                                      <span className="text-slate-400 italic text-[11px]">Tidak Ada</span>
                                    )}
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
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center py-6 text-slate-400">
                                Tidak ada data surat yang sesuai dengan filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </>
        )}

        {/* TAMPILAN PORTAL PUBLIK */}
        {activeTab === 'public' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* FITUR LACAK STATUS & UNDUH FILE */}
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

              {/* HASIL LACAK SURAT DENGAN TOMBOL UNDUH FILE */}
              {searchResult && searchResult !== 'NOT_FOUND' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs space-y-3 mt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-extrabold text-blue-900 text-sm">{searchResult.no_agenda}</div>
                      <div className="text-slate-600 font-medium">Pengirim: {searchResult.pengirim}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      searchResult.jenis_surat === 'Offline' ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'
                    }`}>
                      Surat {searchResult.jenis_surat || 'Online'}
                    </span>
                  </div>

                  <div className="text-slate-600 bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="font-semibold text-slate-700 block mb-0.5">Perihal:</span>
                    {searchResult.perihal}
                  </div>

                  <div className="pt-2 border-t border-blue-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">STATUS</span>
                      <span className="font-bold text-slate-800 uppercase">{searchResult.status}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px]">POSISI SAAT INI</span>
                      <span className="font-bold text-slate-800">{searchResult.posisi}</span>
                    </div>
                  </div>

                  {/* BAGIAN UNDUH FILE / BUKTI FOTO */}
                  <div className="pt-2 border-t border-blue-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Berkas Surat:</label>
                    {searchResult.pdf_url || searchResult.foto_url ? (
                      <a
                        href={searchResult.pdf_url || searchResult.foto_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-xs"
                      >
                        {searchResult.jenis_surat === 'Offline' ? '🖼️ Unduh / Lihat Bukti Foto' : '📄 Unduh / Lihat File PDF'}
                      </a>
                    ) : (
                      <div className="p-2 bg-slate-100 text-slate-500 rounded-xl text-center text-[11px] italic">
                        Tidak ada file berkas yang diunggah untuk surat ini.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {searchResult === 'NOT_FOUND' && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs mt-4">
                  Surat dengan No. Agenda tersebut tidak ditemukan.
                </div>
              )}
            </div>

            {/* FORM PENGAJUAN SURAT PUBLIK */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="font-bold text-slate-800 text-base border-b pb-2">📝 Form Pengajuan Surat Masuk</h2>
              <form onSubmit={handleSimpanSurat} className="space-y-3 text-xs">
                
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Pengajuan Surat</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setJenisSurat('Online'); setSelectedFile(null); }}
                      className={`py-2 rounded-xl border text-xs font-bold transition ${
                        jenisSurat === 'Online'
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      💻 Surat Online (Upload PDF)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setJenisSurat('Offline'); setSelectedFile(null); }}
                      className={`py-2 rounded-xl border text-xs font-bold transition ${
                        jenisSurat === 'Offline'
                          ? 'bg-amber-50 border-amber-500 text-amber-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      📦 Surat Offline (Upload Bukti Foto)
                    </button>
                  </div>
                </div>

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

                {/* Upload File Publik */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {jenisSurat === 'Offline' ? '📷 Unggah Bukti Foto Surat Offline' : '📄 Unggah File PDF Surat Online'}
                  </label>
                  <input
                    type="file"
                    accept={jenisSurat === 'Offline' ? 'image/*' : 'application/pdf'}
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Anda (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={noWa}
                    onChange={(e) => setNoWa(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition shadow-xs"
                >
                  {loading ? 'Mengunggah & Mengirim...' : 'Kirim Pengajuan Surat'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDIT STATUS, POSISI, WHATSAPP & UPLOAD FILE TTD */}
        {selectedSurat && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
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

                {/* MODUL UNGGAN / GANTI FILE SURAT (PDF TTD / FOTO) */}
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                  <label className="block font-bold text-indigo-900 mb-1">
                    ✏️ Unggah / Ganti Berkas Surat (Hasil TTD Admin)
                  </label>
                  
                  {/* Status File Saat Ini */}
                  {(selectedSurat.pdf_url || selectedSurat.foto_url) ? (
                    <div className="text-[11px] text-slate-600 mb-1 flex items-center gap-1">
                      <span>File saat ini:</span>
                      <a
                        href={selectedSurat.pdf_url || selectedSurat.foto_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline font-semibold hover:text-blue-800"
                      >
                        Lihat Berkas Terpasang
                      </a>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic mb-1">Belum ada file diunggah.</div>
                  )}

                  {/* Pilihan Jenis File Baru */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setEditFileType('pdf')}
                      className={`py-1 px-2 rounded-lg text-[11px] font-bold border transition ${
                        editFileType === 'pdf'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      📄 File PDF (TTD)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFileType('foto')}
                      className={`py-1 px-2 rounded-lg text-[11px] font-bold border transition ${
                        editFileType === 'foto'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      🖼️ Foto Lampiran
                    </button>
                  </div>

                  {/* Input File Baru */}
                  <input
                    type="file"
                    accept={editFileType === 'pdf' ? 'application/pdf' : 'image/*'}
                    onChange={(e) => setEditSelectedFile(e.target.files[0] || null)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-xl bg-white text-xs file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 italic">
                    Pilih file baru jika ingin mengganti/mengunggah file surat yang sudah di-TTD.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Notifikasi</label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={editNoWa}
                    onChange={(e) => setEditNoWa(e.target.value)}
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
                    {editLoading ? 'Menyimpan & Mengunggah...' : 'Simpan Perubahan'}
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