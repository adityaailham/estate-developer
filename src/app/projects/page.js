'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Home, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  X
} from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', location: '' });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      const json = await res.json();
      if (json.success) {
        setProjects(json.data);
      } else {
        setError(json.error || 'Gagal memuat daftar proyek');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi saat mengambil data proyek');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError('Nama proyek wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setFormData({ name: '', location: '' });
        fetchProjects(); // Refresh data
      } else {
        setModalError(json.error || 'Gagal membuat proyek baru');
      }
    } catch (err) {
      setModalError('Terjadi kesalahan koneksi saat menyimpan proyek');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Memuat portofolio proyek...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span>Portofolio Proyek Perumahan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola daftar proyek Anda dan pantau distribusi status pembangunan unit di setiap kawasan.
          </p>
        </div>
        <button
          onClick={() => {
            setModalError(null);
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Proyek Baru</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects && projects.length > 0 ? (
          projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-2xl border border-slate-200/80 card-shadow hover-lift p-6 flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex-1 min-w-0 pr-1">
                    <h3 className="font-bold text-slate-900 text-lg tracking-tight line-clamp-2 break-words" title={proj.name}>
                      {proj.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 self-start mt-0.5" />
                      <span className="truncate" title={proj.location || 'Lokasi belum ditentukan'}>
                        {proj.location || 'Lokasi belum ditentukan'}
                      </span>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60 shrink-0 whitespace-nowrap self-start shadow-2xs">
                    {proj.total_houses || 0} Unit
                  </span>
                </div>

                {/* Progress breakdown */}
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                      Aktif Pembangunan
                    </span>
                    <span className="font-bold text-slate-900">{proj.active_houses || 0} unit</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Selesai / Serah Terima
                    </span>
                    <span className="font-bold text-slate-900">{proj.completed_houses || 0} unit</span>
                  </div>

                  {/* Progress bar visual */}
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mt-1 flex">
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${proj.total_houses > 0 ? ((proj.completed_houses / proj.total_houses) * 100) : 0}%`
                      }}
                    />
                    <div
                      className="bg-blue-500 transition-all duration-500"
                      style={{
                        width: `${proj.total_houses > 0 ? ((proj.active_houses / proj.total_houses) * 100) : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  Dibuat {new Date(proj.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                </span>
                <Link
                  href={`/houses?project_id=${proj.id}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 group"
                >
                  <span>Lihat Daftar Unit</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Belum Ada Proyek Terdaftar</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Mulailah dengan menambahkan proyek perumahan pertama Anda untuk mencatat unit rumah dan memantau realisasi biayanya.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-md"
            >
              + Tambah Proyek Sekarang
            </button>
          </div>
        )}
      </div>

      {/* Modal Tambah Proyek */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>Tambah Proyek Baru</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Proyek <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Green Valley Residence"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Lokasi / Alamat Proyek
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Kaliurang KM 10, Sleman"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Proyek</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
