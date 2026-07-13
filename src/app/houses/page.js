'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Home, 
  Plus, 
  Building2, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Wallet, 
  Loader2, 
  X,
  AlertCircle,
  Edit3
} from 'lucide-react';
import Pagination from '@/components/Pagination';

function HousesContent() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('project_id') || '';

  const [houses, setHouses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedProject, setSelectedProject] = useState(initialProjectId);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    project_id: initialProjectId || '',
    block_number: '',
    type: 'Tipe 36',
    selling_price: '',
    status: 'Belum Mulai'
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Edit Status Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHouseForEdit, setSelectedHouseForEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    status: 'Belum Mulai',
    progress_percent: 0
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      let url = '/api/houses';
      if (selectedProject) {
        url += `?project_id=${selectedProject}`;
      }
      const [housesRes, projectsRes] = await Promise.all([
        fetch(url),
        fetch('/api/projects')
      ]);
      const housesJson = await housesRes.json();
      const projectsJson = await projectsRes.json();

      if (housesJson.success) setHouses(housesJson.data);
      if (projectsJson.success) {
        setProjects(projectsJson.data);
        if (!formData.project_id && projectsJson.data.length > 0 && !initialProjectId) {
          setFormData(prev => ({ ...prev, project_id: projectsJson.data[0].id }));
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi saat memuat data unit rumah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProject]);

  const handleCreateHouse = async (e) => {
    e.preventDefault();
    if (!formData.project_id || !formData.block_number.trim() || !formData.type.trim()) {
      setModalError('Proyek, Nomor Blok, dan Tipe Rumah wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);
      const res = await fetch('/api/houses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setFormData({
          project_id: selectedProject || (projects.length > 0 ? projects[0].id : ''),
          block_number: '',
          type: 'Tipe 36',
          selling_price: '',
          status: 'Belum Mulai'
        });
        fetchData();
      } else {
        setModalError(json.error || 'Gagal menambahkan unit rumah');
      }
    } catch (err) {
      setModalError('Terjadi kesalahan koneksi saat menyimpan unit');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditStatusModal = (house) => {
    setSelectedHouseForEdit(house);
    setEditFormData({
      status: house.status || 'Belum Mulai',
      progress_percent: house.progress_percent || 0
    });
    setEditError(null);
    setShowEditModal(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedHouseForEdit) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/houses/${selectedHouseForEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const json = await res.json();
      if (json.success) {
        setShowEditModal(false);
        fetchData();
      } else {
        setEditError(json.error || 'Gagal memperbarui status unit rumah');
      }
    } catch (err) {
      setEditError('Terjadi kesalahan saat memperbarui status unit rumah');
    } finally {
      setEditSubmitting(false);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(number || 0);
  };

  const filteredHouses = houses.filter(h => 
    h.block_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.project_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedProject]);

  const paginatedHouses = filteredHouses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Home className="w-6 h-6 text-blue-600" />
            <span>Daftar Unit Rumah & Cost Control</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau setiap unit rumah yang dipasarkan dan masuk ke Laporan Cost Sheet untuk kontrol realisasi RAB vs Aktual.
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
          <span>Tambah Unit Rumah</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-100/70 p-4 rounded-2xl border border-slate-200/60">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
          >
            <option value="">Semua Proyek ({projects.length})</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Cari blok rumah / tipe / proyek..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Memuat daftar unit & kalkulasi biaya aktual...</p>
        </div>
      ) : (
        /* Houses Cards Grid */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedHouses.length > 0 ? (
              paginatedHouses.map((house) => {
                let statusStyle = 'bg-slate-100 text-slate-700';
                if (house.status === 'Pembangunan' || house.status === 'Struktur' || house.status === 'Pondasi') {
                  statusStyle = 'bg-blue-100 text-blue-800 border border-blue-200';
                } else if (house.status === 'Selesai' || house.status === 'Serah Terima') {
                  statusStyle = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                } else if (house.status === 'Belum Mulai') {
                  statusStyle = 'bg-amber-100 text-amber-800 border border-amber-200';
                }

                const actualTotal = Number(house.actual_material_cost) + Number(house.actual_labor_cost);

                return (
                  <div
                    key={house.id}
                    className="bg-white rounded-2xl border border-slate-200/80 card-shadow hover-lift p-6 flex flex-col justify-between"
                  >
                    <div>
                      {/* Header: Block & Status */}
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">
                              Blok {house.block_number}
                            </h3>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                              {house.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-blue-500" />
                            <span>{house.project_name}</span>
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${statusStyle}`}>
                          {house.status}
                        </span>
                      </div>

                      {/* Cost Breakdown Summary */}
                      <div className="mt-4 space-y-2.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Harga Jual Unit</span>
                          <span className="font-bold text-slate-800">{formatRupiah(house.selling_price)}</span>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">Aktual Material (FIFO+Bypass)</span>
                          <span className="font-bold text-blue-600">{formatRupiah(house.actual_material_cost)}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">Aktual Upah Borongan</span>
                          <span className="font-bold text-purple-600">{formatRupiah(house.actual_labor_cost)}</span>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-900 uppercase tracking-wider text-[11px]">Total Realisasi Biaya</span>
                          <span className="text-slate-900 text-sm">{formatRupiah(actualTotal)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Edit Status & Jump to Cost Sheet */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => openEditStatusModal(house)}
                        className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition shrink-0 border border-slate-200"
                        title="Ubah Status & Progress"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        <span>Ubah Status</span>
                      </button>
                      <Link
                        href={`/houses/${house.id}/cost-sheet`}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all group"
                      >
                        <Wallet className="w-4 h-4 text-blue-200" />
                        <span>Cost Sheet</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Home className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Tidak Ada Unit Rumah Ditemukan</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {searchQuery || selectedProject ? 'Coba ubah filter pencarian atau pilih proyek lain.' : 'Belum ada unit rumah tercatat di database. Silakan tambahkan unit baru.'}
                </p>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredHouses.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newSize) => { setItemsPerPage(newSize); setCurrentPage(1); }}
            />
          </div>
        </div>
      )}

      {/* Modal Tambah Unit Rumah */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-600" />
                <span>Tambah Unit Rumah Baru</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHouse} className="mt-4 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {modalError}
                </div>
              )}

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Informasi Sistem CCMS:</strong> Saat disimpan, sistem otomatis mencari Template RAB dengan Tipe Rumah yang sama (misal <em>Tipe 36</em>) dan menyalin seluruh anggarannya ke unit ini.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Proyek Perumahan <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Pilih Proyek --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nomor Blok <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: A-01"
                    value={formData.block_number}
                    onChange={(e) => setFormData({ ...formData, block_number: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tipe Rumah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Tipe 36 / Tipe 45"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 350000000"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status Pembangunan
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Belum Mulai">Belum Mulai</option>
                    <option value="Pembangunan">Pembangunan Aktif</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Serah Terima">Serah Terima</option>
                  </select>
                </div>
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
                  <span>Simpan Unit & Salin RAB</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Status & Progress Modal */}
      {showEditModal && selectedHouseForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Update Status Blok {selectedHouseForEdit.block_number}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedHouseForEdit.type} - {selectedHouseForEdit.project_name}
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Status Konstruksi <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-500 text-slate-800"
                  required
                >
                  <option value="Belum Mulai">Belum Mulai</option>
                  <option value="Pembangunan">Pembangunan Aktif</option>
                  <option value="Selesai">Selesai (Mengunci HPP Material & Tukang)</option>
                  <option value="Serah Terima">Serah Terima ke Konsumen</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Progress Fisik Otomatis</span>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-extrabold text-xs rounded-lg">
                  {editFormData.status === 'Belum Mulai' ? '0%' : (editFormData.status === 'Selesai' || editFormData.status === 'Serah Terima' ? '100%' : '50% (Aktif)')}
                </span>
              </div>

              {(editFormData.status === 'Selesai' || editFormData.status === 'Serah Terima') && (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 font-medium leading-relaxed">
                  ⚠️ <strong>Perhatian Cost Freeze:</strong> Mengubah status ke <strong>{editFormData.status}</strong> akan mengunci unit ini dari daftar tujuan mutasi material, pembelian bypass, dan pembuatan kontrak borongan baru.
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  {editSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HousesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Memuat data unit rumah...</p>
      </div>
    }>
      <HousesContent />
    </Suspense>
  );
}
