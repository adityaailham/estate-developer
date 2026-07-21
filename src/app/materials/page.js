'use client';

import React, { useState, useEffect } from 'react';
import { Boxes, Plus, Search, AlertTriangle, CheckCircle2, ArrowUpDown, Loader2, X, RefreshCw, Edit, Trash2 } from 'lucide-react';
import Pagination from '@/components/Pagination';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    unit: 'Sak',
    default_price: '',
    minimum_stock: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterialForEdit, setSelectedMaterialForEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    code: '',
    name: '',
    unit: 'Sak',
    default_price: '',
    minimum_stock: ''
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/materials');
      const json = await res.json();
      if (json.success) {
        setMaterials(json.data);
      } else {
        setError(json.error || 'Gagal memuat data material');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.unit) {
      setModalError('Kode, Nama, dan Satuan wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setFormData({ code: '', name: '', unit: 'Sak', default_price: '', minimum_stock: '' });
        fetchMaterials();
      } else {
        setModalError(json.error || 'Gagal menambahkan material');
      }
    } catch (err) {
      setModalError('Terjadi kesalahan koneksi');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (mat) => {
    setSelectedMaterialForEdit(mat);
    setEditFormData({
      code: mat.code || '',
      name: mat.name || '',
      unit: mat.unit || 'Sak',
      default_price: mat.default_price || '',
      minimum_stock: mat.minimum_stock || ''
    });
    setEditError(null);
    setShowEditModal(true);
  };

  const handleUpdateMaterial = async (e) => {
    e.preventDefault();
    if (!selectedMaterialForEdit) return;
    try {
      setEditSubmitting(true);
      setEditError(null);
      const res = await fetch(`/api/materials/${selectedMaterialForEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const json = await res.json();
      if (json.success) {
        setShowEditModal(false);
        fetchMaterials();
      } else {
        setEditError(json.error || 'Gagal memperbarui material');
      }
    } catch (err) {
      setEditError('Terjadi kesalahan koneksi');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (mat) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus master material '${mat.name}' (${mat.code})?`)) return;
    try {
      const res = await fetch(`/api/materials/${mat.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        alert('Master material berhasil dihapus!');
        fetchMaterials();
      } else {
        alert('Gagal menghapus: ' + (json.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi saat menghapus material');
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number || 0);
  };

  const filtered = materials.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-blue-600" />
            <span>Master Material & Stok Gudang Global</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar seluruh jenis bahan bangunan beserta posisi stok real-time di Gudang Utama Global (Opsi A).
          </p>
        </div>
        <button
          onClick={() => { setModalError(null); setShowModal(true); }}
          className="px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Material Baru</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-slate-100/70 p-4 rounded-2xl border border-slate-200/60">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode / nama material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button onClick={fetchMaterials} className="p-2 bg-white rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 card-shadow overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-600 font-medium">Memuat persediaan gudang...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Kode</th>
                    <th className="py-3.5 px-6">Nama Material</th>
                    <th className="py-3.5 px-6 text-center">Satuan</th>
                    <th className="py-3.5 px-6 text-right">Harga Acuan (Rp)</th>
                    <th className="py-3.5 px-6 text-right">Batas Min. Stok</th>
                    <th className="py-3.5 px-6 text-right">Stok Real-time Gudang</th>
                    <th className="py-3.5 px-6 text-center">Status Stok</th>
                    <th className="py-3.5 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginated.length > 0 ? (
                    paginated.map((mat) => {
                      const isLow = Number(mat.is_low_stock) === 1;
                      return (
                        <tr key={mat.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-900 font-mono text-xs">
                            {mat.code}
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-900">
                            {mat.name}
                          </td>
                          <td className="py-4 px-6 text-center font-medium text-slate-600">
                            {mat.unit}
                          </td>
                          <td className="py-4 px-6 text-right font-medium text-slate-700">
                            {formatRupiah(mat.default_price)}
                          </td>
                          <td className="py-4 px-6 text-right font-medium text-slate-500">
                            {mat.minimum_stock} {mat.unit}
                          </td>
                          <td className="py-4 px-6 text-right font-extrabold text-slate-900">
                            {Number(mat.stock_quantity).toLocaleString('id-ID')} {mat.unit}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {isLow ? (
                              <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold border border-red-200 flex items-center justify-center gap-1 w-fit mx-auto">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                <span>Stok Kritis</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1 w-fit mx-auto">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Aman</span>
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditModal(mat)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                title="Edit Material"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(mat)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                                title="Hapus Material"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                        Belum ada data material atau pencarian tidak ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newSize) => { setItemsPerPage(newSize); setCurrentPage(1); }}
            />
          </>
        )}
      </div>

      {/* Modal Tambah Material */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-600" />
                <span>Tambah Material Baru</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              {modalError && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium">{modalError}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kode / SKU <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Contoh: SEM-50"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Satuan <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Contoh: Sak / M3 / Pcs"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Material <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: Semen Portland 50kg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Harga Acuan (Rp)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 72.000"
                    value={formData.default_price ? Number(formData.default_price).toLocaleString('id-ID') : ''}
                    onChange={(e) => setFormData({ ...formData, default_price: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Batas Minimum Stok</label>
                  <input
                    type="number"
                    placeholder="Contoh: 100"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Batal</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan & Init Stok 0</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Material */}
      {showEditModal && selectedMaterialForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base">Edit Master Material</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateMaterial} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium">{editError}</div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Kode *</label>
                  <input type="text" value={editFormData.code} onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })} required className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Satuan *</label>
                  <select value={editFormData.unit} onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold">
                    <option value="Sak">Sak (50/40kg)</option>
                    <option value="Batang">Batang (12m/6m)</option>
                    <option value="M3">Meter Kubik (M3)</option>
                    <option value="M2">Meter Persegi (M2)</option>
                    <option value="Dus">Dus / Box</option>
                    <option value="Kaleng">Kaleng / Pail</option>
                    <option value="Pcs">Pcs / Buah</option>
                    <option value="Roll">Roll / Gulung</option>
                    <option value="Truk">Truk / Rit</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nama Material *</label>
                <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} required className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Harga Acuan (Rp)</label>
                  <input type="text" value={editFormData.default_price ? Number(editFormData.default_price).toLocaleString('id-ID') : ''} onChange={(e) => setEditFormData({ ...editFormData, default_price: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Min. Stok Warning</label>
                  <input type="number" value={editFormData.minimum_stock} onChange={(e) => setEditFormData({ ...editFormData, minimum_stock: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Batal</button>
                <button type="submit" disabled={editSubmitting} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">
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
