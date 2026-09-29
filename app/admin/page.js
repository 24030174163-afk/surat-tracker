'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, PlusCircle, RefreshCw, ListFilter, Printer, Lock, LogOut } from 'lucide-react'

export default function AdminPage() {
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [loginError, setLoginError] = useState('')

  const [suratList, setSuratList] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Form State (Input Surat Baru)
  const [nomorAgenda, setNomorAgenda] = useState('')
  const [pengirim, setPengirim] = useState('')
  const [perihal, setPerihal] = useState('')
  const [status, setStatus] = useState('Diterima')
  const [lokasiPosisi, setLokasiPosisi] = useState('Subag Umum')

  // Edit State (Update Disposisi Surat)
  const [selectedSurat, setSelectedSurat] = useState(null)
  const [editStatus, setEditStatus] = useState('')
  const [editLokasi, setEditLokasi] = useState('')

  // Print State
  const [printSurat, setPrintSurat] = useState(null)

  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_authenticated')
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchSurat()
    }
  }, [isAuthenticated])

  const handleLogin = (e) => {
    e.preventDefault()
    // Password default admin diperbarui menjadi dikdas123
    if (passwordInput === 'dikdas123') {
      setIsAuthenticated(true)
      localStorage.setItem('admin_authenticated', 'true')
      setLoginError('')
    } else {
      setLoginError('Password salah! Silakan coba lagi.')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('admin_authenticated')
  }

  const fetchSurat = async () => {
    const { data, error } = await supabase
      .from('surat')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setSuratList(data)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/surat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomor_agenda: nomorAgenda,
          pengirim,
          perihal,
          status,
          lokasi_posisi: lokasiPosisi
        })
      })

      const result = await res.json()

      if (res.ok && result.success) {
        setNomorAgenda('')
        setPengirim('')
        setPerihal('')
        fetchSurat()
        alert('Berhasil menyimpan surat!')
      } else {
        alert('Gagal: ' + (result.error || 'Terjadi kesalahan pada server'))
      }
    } catch (err) {
      alert('Error Jaringan/API: ' + err.message)
    }
    setLoading(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedSurat) return
    setLoading(true)

    try {
      const res = await fetch('/api/update-surat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSurat.id,
          nomor_agenda: selectedSurat.nomor_agenda,
          status: editStatus,
          lokasi_posisi: editLokasi
        })
      })

      const result = await res.json()

      if (res.ok && result.success) {
        setSelectedSurat(null)
        fetchSurat()
        alert('Berhasil memperbarui disposisi surat!')
      } else {
        alert('Gagal: ' + (result.error || 'Terjadi kesalahan pada server'))
      }
    } catch (err) {
      alert('Error Jaringan/API: ' + err.message)
    }
    setLoading(false)
  }

  // Tampilan Form Login jika belum login
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full border border-slate-200 space-y-5">
          <div className="text-center space-y-2">
            <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
              <Lock size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Login Admin Surat</h1>
            <p className="text-xs text-slate-500">Masukkan password untuk mengakses dashboard admin</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan password..."
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">*Password bawaan: <b>dikdas123</b></p>
            </div>

            {loginError && (
              <p className="text-xs text-red-500 text-center font-medium">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition text-sm"
            >
              Masuk Dashboard
            </button>
          </form>

          <div className="text-center pt-2 border-t">
            <Link href="/" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
              <ArrowLeft size={12} /> Kembali ke Portal Publik
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Dashboard Admin Surat</h1>
            <p className="text-xs text-slate-500">Input dan perbarui status disposisi surat</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
              <ArrowLeft size={14} /> Portal Publik
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition border border-red-200"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form Tambah Surat Baru */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <PlusCircle size={18} className="text-blue-600" /> Input Surat Masuk
            </h2>
            <form onSubmit={handleCreate} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">No. Agenda</label>
                <input
                  type="text"
                  required
                  value={nomorAgenda}
                  onChange={(e) => setNomorAgenda(e.target.value)}
                  placeholder="SRT-001"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pengirim</label>
                <input
                  type="text"
                  required
                  value={pengirim}
                  onChange={(e) => setPengirim(e.target.value)}
                  placeholder="SDN 01 Kalipancur"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Perihal</label>
                <textarea
                  required
                  value={perihal}
                  onChange={(e) => setPerihal(e.target.value)}
                  placeholder="Permohonan Bantuan Sarpras"
                  rows={2}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status Awal</label>
                <input
                  type="text"
                  required
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Posisi Saat Ini</label>
                <input
                  type="text"
                  required
                  value={lokasiPosisi}
                  onChange={(e) => setLokasiPosisi(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition text-xs mt-2"
              >
                {loading ? 'Menyimpan...' : 'Simpan Surat Baru'}
              </button>
            </form>
          </div>

          {/* Tabel / Daftar Surat */}
          <div className="md:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ListFilter size={18} className="text-blue-600" /> Daftar Surat Registered
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase">
                  <tr>
                    <th className="p-2.5">No. Agenda</th>
                    <th className="p-2.5">Pengirim & Perihal</th>
                    <th className="p-2.5">Status & Posisi</th>
                    <th className="p-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suratList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-blue-600">{item.nomor_agenda}</td>
                      <td className="p-2.5">
                        <div className="font-semibold text-slate-800">{item.pengirim}</div>
                        <div className="text-slate-500 truncate max-w-xs">{item.perihal}</div>
                      </td>
                      <td className="p-2.5">
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-semibold block w-fit mb-1">
                          {item.status}
                        </span>
                        <span className="text-slate-500 text-[11px]">{item.lokasi_posisi}</span>
                      </td>
                      <td className="p-2.5 text-center space-x-1">
                        <button
                          onClick={() => {
                            setSelectedSurat(item)
                            setEditStatus(item.status)
                            setEditLokasi(item.lokasi_posisi)
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-[11px] font-medium transition"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => setPrintSurat(item)}
                          className="bg-slate-700 hover:bg-slate-800 text-white px-2 py-1 rounded text-[11px] font-medium transition inline-flex items-center gap-1"
                        >
                          <Printer size={12} /> Cetak
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Update Status Surat */}
        {selectedSurat && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-800 border-b pb-2">
                Update Disposisi: {selectedSurat.nomor_agenda}
              </h3>
              <form onSubmit={handleUpdate} className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status Pemrosesan Baru</label>
                  <input
                    type="text"
                    required
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Posisi Berkas Baru</label>
                  <input
                    type="text"
                    required
                    value={editLokasi}
                    onChange={(e) => setEditLokasi(e.target.value)}
                    className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSurat(null)}
                    className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-medium hover:bg-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
                  >
                    <RefreshCw size={14} /> {loading ? 'Memproses...' : 'Simpan & Kirim Notif'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Preview & Cetak Lembar Disposisi + QR Code */}
        {printSurat && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white p-6 rounded-2xl max-w-xl w-full shadow-2xl space-y-4 my-8">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-base font-bold text-slate-800">Preview Lembar Disposisi</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                  >
                    <Printer size={14} /> Cetak / Print
                  </button>
                  <button
                    onClick={() => setPrintSurat(null)}
                    className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-300"
                  >
                    Tutup
                  </button>
                </div>
              </div>

              {/* Tampilan Cetak Lembar Disposisi */}
              <div className="border-2 border-slate-800 p-6 space-y-4 text-slate-900 bg-white">
                <div className="text-center border-b-2 border-slate-800 pb-3">
                  <h2 className="text-lg font-bold uppercase tracking-wide">LEMBAR DISPOSISI SURAT</h2>
                  <p className="text-xs text-slate-600">Sistem Informasi Tracking & Disposisi Surat</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-slate-500">NO. AGENDA:</p>
                    <p className="text-base font-bold text-blue-700">{printSurat.nomor_agenda}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500">TANGGAL REGISTRASI:</p>
                    <p className="font-medium">{new Date(printSurat.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="text-xs space-y-2 border-t border-b py-3 border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-500 block">PENGIRIM:</span>
                    <span className="font-medium text-slate-800">{printSurat.pengirim}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">PERIHAL:</span>
                    <span className="font-medium text-slate-800">{printSurat.perihal}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <span className="font-semibold text-slate-500 block">STATUS TERAKHIR:</span>
                      <span className="font-bold text-emerald-700">{printSurat.status}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500 block">POSISI BERKAS:</span>
                      <span className="font-bold text-slate-800">{printSurat.lokasi_posisi}</span>
                    </div>
                  </div>
                </div>

                {/* Kolom Catatan Instruksi Manual */}
                <div className="space-y-2 text-xs pt-1">
                  <p className="font-bold text-slate-700">CATATAN / PETUNJUK DISPOSISI:</p>
                  <div className="border border-dashed border-slate-400 rounded-lg p-3 min-h-[90px]">
                    <span className="text-slate-400 text-[10px] italic">[ Kolom instruksi pimpinan / catatan fisik ]</span>
                  </div>
                </div>

                {/* Bagian QR Code & Tanda Tangan */}
                <div className="flex justify-between items-end pt-2 border-t border-slate-200">
                  <div className="text-center space-y-1">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(printSurat.nomor_agenda)}`}
                      alt="QR Code Surat"
                      className="w-20 h-20 mx-auto border p-1 rounded"
                    />
                    <p className="text-[10px] text-slate-500">Scan QR untuk Lacak Status</p>
                  </div>
                  <div className="text-center text-xs space-y-8">
                    <p className="text-slate-600">Petugas Subag Umum,</p>
                    <p className="font-bold underline text-slate-800">( .................................... )</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  )
}