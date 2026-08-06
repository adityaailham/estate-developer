'use client';

import React, { useState, useEffect } from 'react';
import { HardHat, Plus, Phone, Users2, Loader2, X, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ToastContext';

export default function KepalaTukangPage() {
  const { showToast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/kepala-tukang');
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Gagal memuat kepala tukang');
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Nama Kepala Tukang wajib diisi', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/kepala-tukang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        showToast('Kepala Tukang berhasil ditambahkan', 'success');
        setFormData({ name: '', phone: '' });
        fetchData();
      } else {
        showToast(json.error || 'Gagal menambah kepala tukang', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <HardHat className="w-6 h-6 text-purple-600" />
            <span>Master Kepala Tukang & Mandor</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar mitra mandor dan pimpinan tenaga kerja borongan untuk pelaksanaan proyek.
          </p>
        </div>
        <button
          onClick={() => { setModalError(null); setShowModal(true); }}
          className="px-4 py-2.5 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kepala Tukang</span>
        </button>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <p className="text-sm text-slate-600 font-medium">Memuat daftar kepala tukang...</p>
          </div>
        ) : data.length > 0 ? (
          data.map((kt) => (
            <div key={kt.id} className="bg-white rounded-2xl border border-slate-200/80 card-shadow hover-lift p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-lg tracking-tight truncate">{kt.name}</h3>
                  <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <HardHat className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-4 text-xs text-slate-600">
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{kt.phone || 'Tidak ada nomor telepon'}</span>
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
                <span>Mitra Kontraktor</span>
                <span className="font-bold text-purple-700">Aktif</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white p-12 rounded-2xl border text-center space-y-3">
            <HardHat className="w-10 h-10 text-purple-500 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Belum Ada Kepala Tukang</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tambahkan data mandor atau pimpinan rombongan pekerja yang bertugas di lapangan.
            </p>
          </div>
        )}
      </div>

      {/* Modal Tambah Kepala Tukang */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <HardHat className="w-5 h-5 text-purple-600" />
                <span>Tambah Kepala Tukang Baru</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              {modalError && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium">{modalError}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Kepala Tukang / Mandor <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: Pak Suprianto"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">No. Telepon / WhatsApp</label>
                <input
                  type="text"
                  placeholder="Contoh: 08198765432"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Batal</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Mandor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
