'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Plus, Search, Filter, AlertCircle, CheckCircle2, Loader2, X, RefreshCw, Trash2, Calendar, Printer } from 'lucide-react';
import Pagination from '@/components/Pagination';
import SearchableSelect from '@/components/SearchableSelect';
import { useToast } from '@/components/ToastContext';

export default function MutationsPage() {
  const { showToast } = useToast();
  const [mutations, setMutations] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMaterial, setFilterMaterial] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMounted, setIsMounted] = useState(false);

  // Filter specific to house mutations
  const [houseStock, setHouseStock] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Keluar-Rumah',
    source_house_id: '',
    destination_house_id: '',
    mutation_date: new Date().toISOString().split('T')[0]
  });
  const [formItems, setFormItems] = useState([
    { material_id: '', quantity: '', difference: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      let url = '/api/mutations';
      if (filterMaterial) url += `?material_id=${filterMaterial}`;
      const [mutRes, matRes, houRes] = await Promise.all([
        fetch(url),
        fetch('/api/materials'),
        fetch('/api/houses')
      ]);
      const [mutJson, matJson, houJson] = await Promise.all([
        mutRes.json(), matRes.json(), houRes.json()
      ]);

      if (mutJson.success) setMutations(mutJson.data);
      if (matJson.success) {
        setMaterials(matJson.data);
        if (matJson.data.length > 0) {
          setFormItems(prev => prev[0].material_id ? prev : [{ ...prev[0], material_id: matJson.data[0].id }]);
        }
      }
      if (houJson.success) {
        setHouses(houJson.data);
        if (houJson.data.length > 0) {
          let urlTargetDest = null;
          let urlTargetType = null;
          let shouldOpenModal = false;
          let actionOut = false;
          let urlHouseId = null;
          
          if (typeof window !== 'undefined' && window.location.search) {
            const params = new URLSearchParams(window.location.search);
            actionOut = params.get('action') === 'out';
            urlHouseId = params.get('house_id');
            if (urlHouseId) urlTargetDest = Number(urlHouseId);
            if (params.get('type')) urlTargetType = params.get('type');
            
            if (params.get('action') === 'new') shouldOpenModal = true;
            if (actionOut) {
              shouldOpenModal = true;
              urlTargetType = params.get('type') || 'Retur-Gudang';
            }
            
            // clear the url without refreshing so it doesn't trigger again
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          
          setFormData(prev => ({ 
            ...prev, 
            destination_house_id: urlTargetDest || prev.destination_house_id || houJson.data[0].id,
            source_house_id: actionOut && urlHouseId ? Number(urlHouseId) : (prev.source_house_id || houJson.data[0].id),
            type: urlTargetType || prev.type || 'Keluar-Rumah'
          }));
          
          if (shouldOpenModal) {
            setShowModal(true);
          }
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi saat memuat riwayat mutasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMaterial]);

  useEffect(() => {
    const isOutward = formData.type === 'Retur-Gudang' || formData.type === 'Pindah-Rumah';
    if (isOutward && formData.source_house_id) {
      const fetchStock = async () => {
        setLoadingStock(true);
        try {
          const res = await fetch(`/api/houses/${formData.source_house_id}/materials`);
          const json = await res.json();
          if (json.success && json.data) {
            const stockData = json.data.site_stock || [];
            setHouseStock(stockData);
            const available = stockData.filter(s => Number(s.stock_quantity) > 0);
            if (available.length > 0) {
               setFormItems(prev => prev[0].material_id ? prev : [{ ...prev[0], material_id: available[0].material_id }]);
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingStock(false);
        }
      };
      fetchStock();
    } else {
      setHouseStock([]);
    }
  }, [formData.source_house_id, formData.type]);

  const handleAddItem = () => {
    const firstMat = materials.length > 0 ? materials[0].id : '';
    setFormItems([...formItems, { material_id: firstMat, quantity: '', difference: '' }]);
  };

  const handleRemoveItem = (idx) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== idx));
    }
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...formItems];
    updated[idx][field] = value;
    setFormItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type || !formData.mutation_date) {
      setModalError('Tipe Mutasi dan Tanggal wajib diisi');
      return;
    }
    const hasEmptyItem = formItems.some(i => !i.material_id || (!i.quantity && formData.type !== 'Opname-Penyesuaian'));
    if (hasEmptyItem) {
      setModalError('Semua baris material harus memiliki material dan jumlah yang valid');
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);

      const payload = { ...formData, items: formItems.map(i => {
        if (formData.type === 'Opname-Penyesuaian') {
          return { ...i, difference: Number(i.difference), quantity: Math.abs(Number(i.difference)) };
        }
        return { ...i, quantity: Number(i.quantity) };
      })};
      
      const isOutward = formData.type === 'Retur-Gudang' || formData.type === 'Pindah-Rumah';
      if (isOutward) {
         for (const item of payload.items) {
           const selectedStock = houseStock.find(s => String(s.material_id) === String(item.material_id));
           if (!selectedStock || item.quantity > Number(selectedStock.stock_quantity)) {
              setModalError(`Kuantitas mutasi melebihi stok siap pakai untuk salah satu material.`);
              setSubmitting(false);
              return;
           }
         }
      }

      const res = await fetch('/api/mutations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setFormData({
          type: 'Keluar-Rumah',
          source_house_id: houses.length > 0 ? houses[0].id : '',
          destination_house_id: houses.length > 0 ? houses[0].id : '',
          mutation_date: new Date().toISOString().split('T')[0]
        });
        setFormItems([{ material_id: materials.length > 0 ? materials[0].id : '', quantity: '', difference: '' }]);
        showToast('Mutasi berhasil disimpan', 'success');
        fetchData();
      } else {
        showToast(json.error || 'Gagal memproses mutasi material', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi saat memproses mutasi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMutation = async (mut) => {
    if (!confirm(`Batalkan transaksi mutasi ini dan kembalikan stok secara otomatis?`)) return;
    try {
      const res = await fetch(`/api/mutations/${mut.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Mutasi berhasil dibatalkan dan stok disesuaikan', 'success');
        fetchData();
      } else {
        showToast('Gagal membatalkan: ' + (json.error || 'Terjadi kesalahan'), 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi saat membatalkan mutasi', 'error');
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number || 0);
  };

  const getLocalDateString = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return typeof dateInput === 'string' ? dateInput.split('T')[0] : '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const filteredMutations = mutations.filter(mut => {
    if (!mut.mutation_date) return true;
    const mutDate = getLocalDateString(mut.mutation_date);
    const matchStart = filterStartDate ? mutDate >= filterStartDate : true;
    const matchEnd = filterEndDate ? mutDate <= filterEndDate : true;
    return matchStart && matchEnd;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filterMaterial, filterStartDate, filterEndDate]);

  const paginatedMutations = filteredMutations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalFilteredCost = filteredMutations.reduce((sum, mut) => sum + (Number(mut.quantity) * Number(mut.price_unit || 0)), 0);

  const setTodayFilter = () => {
    const today = getLocalDateString(new Date());
    setFilterStartDate(today);
    setFilterEndDate(today);
    setCurrentPage(1);
  };

  const setAllDateFilter = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Print-Only Header */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">CCMS ESTATE DEVELOPER</h1>
            <p className="text-xs text-slate-600 font-medium">Sistem Kontrol HPP & Manajemen Inventaris Konstruksi</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-slate-800">LAPORAN MUTASI MATERIAL LAPANGAN</h2>
            <p className="text-xs text-slate-600">
              Periode: {isMounted && filterStartDate ? new Date(filterStartDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : (filterStartDate || 'Awal')} s/d {isMounted && filterEndDate ? new Date(filterEndDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : (filterEndDate || 'Sekarang')}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Dicetak pada: {isMounted ? new Date().toLocaleString('id-ID') : ''}</p>
          </div>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <ArrowRightLeft className="w-6 h-6 text-blue-600" />
            <span>Mutasi Material & Logika FIFO</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola pengeluaran barang dari gudang ke unit rumah, retur sisa, transfer antar blok, atau koreksi opname.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak Laporan PDF</span>
          </button>
          <button
            onClick={() => { setModalError(null); setShowModal(true); }}
            className="px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Mutasi Lapangan</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-100/70 p-4 rounded-2xl border border-slate-200/60 print:hidden">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
            >
              <option value="">Semua Material ({materials.length})</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500 uppercase">Dari:</span>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
            />
            <span className="text-[11px] font-bold text-slate-500 uppercase ml-1">s/d:</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={setTodayFilter}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200"
            >
              Hari Ini
            </button>
            <button
              onClick={setAllDateFilter}
              className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
            >
              Semua Periode
            </button>
          </div>
        </div>

        <button onClick={fetchData} className="p-2 bg-white rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 shrink-0 self-end lg:self-auto">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Log</span>
        </button>
      </div>

      {/* Mutations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 card-shadow overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-600 font-medium">Memuat log mutasi & harga FIFO...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Tanggal</th>
                    <th className="py-3.5 px-6">Tipe Mutasi</th>
                    <th className="py-3.5 px-6">Material</th>
                    <th className="py-3.5 px-6">Jumlah</th>
                    <th className="py-3.5 px-6">Asal &rarr; Tujuan</th>
                    <th className="py-3.5 px-6 text-right">Harga Satuan (FIFO)</th>
                    <th className="py-3.5 px-6 text-right">Total Alokasi Biaya</th>
                    <th className="py-3.5 px-6 text-center print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedMutations.length > 0 ? (
                    paginatedMutations.map((mut) => {
                      let badgeStyle = 'bg-blue-100 text-blue-800';
                      let routeText = '-';

                      if (mut.type === 'Keluar-Rumah') {
                        badgeStyle = 'bg-blue-100 text-blue-800 font-semibold';
                        routeText = `Gudang → Blok ${mut.destination_house_block}`;
                      } else if (mut.type === 'Retur-Gudang') {
                        badgeStyle = 'bg-amber-100 text-amber-800 font-semibold';
                        routeText = `Blok ${mut.source_house_block} → Gudang`;
                      } else if (mut.type === 'Pindah-Rumah') {
                        badgeStyle = 'bg-indigo-100 text-indigo-800 font-semibold';
                        routeText = `Blok ${mut.source_house_block} → Blok ${mut.destination_house_block}`;
                      } else if (mut.type === 'Opname-Penyesuaian') {
                        badgeStyle = 'bg-slate-200 text-slate-800 font-semibold';
                        routeText = 'Koreksi Stok Fisik Gudang';
                      } else if (mut.type === 'Beli-Gudang') {
                        badgeStyle = 'bg-emerald-100 text-emerald-800 font-semibold';
                        routeText = 'Supplier → Gudang Utama';
                      } else if (mut.type === 'Beli-Rumah') {
                        badgeStyle = 'bg-purple-100 text-purple-800 font-semibold';
                        routeText = `Supplier → Bypass Blok ${mut.destination_house_block}`;
                      }

                      const totalCost = Number(mut.quantity) * Number(mut.price_unit || 0);

                      return (
                        <tr key={mut.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-6 font-medium text-slate-600 text-xs whitespace-nowrap">
                            {isMounted ? new Date(mut.mutation_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : getLocalDateString(mut.mutation_date)}
                          </td>
                          <td className="py-3.5 px-6 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-lg text-xs ${badgeStyle}`}>
                              {mut.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 font-bold text-slate-900 whitespace-nowrap">
                            {mut.material_name} <span className="text-slate-400 font-normal text-xs">({mut.material_code})</span>
                          </td>
                          <td className="py-3.5 px-6 font-bold text-slate-800 whitespace-nowrap">
                            {Number(mut.quantity).toLocaleString('id-ID')} {mut.unit}
                          </td>
                          <td className="py-3.5 px-6 font-medium text-slate-600 text-xs whitespace-nowrap">
                            {routeText}
                          </td>
                          <td className="py-3.5 px-6 text-right font-medium text-slate-600 whitespace-nowrap">
                            {formatRupiah(mut.price_unit)}
                          </td>
                          <td className="py-3.5 px-6 text-right font-extrabold text-slate-900 whitespace-nowrap">
                            {formatRupiah(totalCost)}
                          </td>
                          <td className="py-3.5 px-6 text-center whitespace-nowrap print:hidden">
                            <button
                              onClick={() => handleDeleteMutation(mut)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                              title="Batalkan Mutasi & Rollback Stok"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                        Belum ada transaksi mutasi material pada rentang tanggal/filter terpilih.
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredMutations.length > 0 && (
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td colSpan={6} className="py-4 px-6 font-black text-right text-slate-700 uppercase tracking-wider text-xs">
                        Total Rekap Biaya Mutasi:
                      </td>
                      <td className="py-4 px-6 text-right font-black text-blue-700 text-base">
                        {formatRupiah(totalFilteredCost)}
                      </td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredMutations.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newSize) => { setItemsPerPage(newSize); setCurrentPage(1); }}
            />
          </>
        )}
      </div>

      {/* Modal Catat Mutasi Lapangan */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <span>Pencatatan Mutasi Material Lapangan</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {modalError && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium">{modalError}</div>}

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Otomatisasi FIFO Aktif:</strong> Sistem akan memotong stok dari nota pembelian terlama yang tersedia dan menetapkan harga biayanya secara presisi ke unit rumah.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipe Mutasi <span className="text-red-500">*</span></label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Keluar-Rumah">Keluar ke Rumah (FIFO)</option>
                    <option value="Retur-Gudang">Retur dari Rumah ke Gudang</option>
                    <option value="Pindah-Rumah">Pindah Antar Rumah</option>

                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tanggal Mutasi <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={formData.mutation_date}
                    onChange={(e) => setFormData({ ...formData, mutation_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Material Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Daftar Material {loadingStock && <span className="text-blue-500 font-normal normal-case">(Memuat stok...)</span>}
                    <span className="text-red-500"> *</span>
                  </label>
                  <button type="button" onClick={handleAddItem} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 relative group">
                      <div className="flex-1">
                        <SearchableSelect
                          value={item.material_id}
                          onChange={(val) => handleItemChange(idx, 'material_id', val)}
                          options={(formData.type === 'Retur-Gudang' || formData.type === 'Pindah-Rumah') ? 
                            houseStock.filter(m => Number(m.stock_quantity) > 0).map(m => ({
                              value: m.material_id,
                              label: `${m.name} (${m.code})`,
                              sublabel: `Satuan: ${m.unit} | Stok Siap Pakai: ${Number(m.stock_quantity).toLocaleString('id-ID')}`
                            }))
                            : materials.map(m => ({
                              value: m.id,
                              label: `${m.name} (${m.code})`,
                              sublabel: `Satuan: ${m.unit} | Stok Gudang: ${Number(m.stock_quantity).toLocaleString('id-ID')}`
                            }))
                          }
                          placeholder={loadingStock ? "Memuat..." : "-- Ketik / Pilih Material --"}
                          required
                        />
                      </div>
                      <div className="w-full sm:w-40 flex-shrink-0">
                        {formData.type === 'Opname-Penyesuaian' ? (
                          <input
                            type="number"
                            placeholder="Cth: -5 atau 2"
                            value={item.difference}
                            onChange={(e) => handleItemChange(idx, 'difference', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        ) : (
                          <input
                            type="number"
                            placeholder="Jumlah"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                            required
                            min="0.01"
                            step="any"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-end">
                        {formItems.length > 1 ? (
                          <button type="button" onClick={() => handleRemoveItem(idx)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition" title="Hapus baris">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="w-8"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditional House Selectors */}
              {formData.type === 'Keluar-Rumah' && (
                <div>
                  <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Unit Rumah Tujuan (Dikenai Alokasi Biaya FIFO) <span className="text-red-500">*</span></label>
                  <SearchableSelect
                    value={formData.destination_house_id}
                    onChange={(val) => setFormData({ ...formData, destination_house_id: val })}
                    options={houses
                      .filter(h => h.status !== 'Selesai' && h.status !== 'Serah Terima')
                      .map(h => ({
                        value: h.id,
                        label: `Blok ${h.block_number} (${h.type})`,
                        sublabel: h.project_name
                      }))}
                    placeholder="-- Ketik / Pilih Blok Rumah Tujuan --"
                    required
                  />
                </div>
              )}

              {formData.type === 'Retur-Gudang' && (
                <div>
                  <label className="block text-xs font-bold text-amber-800 uppercase mb-1">Unit Rumah Asal (Pengurang Biaya Aktual) <span className="text-red-500">*</span></label>
                  <SearchableSelect
                    value={formData.source_house_id}
                    onChange={(val) => setFormData({ ...formData, source_house_id: val })}
                    options={houses
                      .filter(h => h.status !== 'Selesai' && h.status !== 'Serah Terima')
                      .map(h => ({
                        value: h.id,
                        label: `Blok ${h.block_number} (${h.type})`,
                        sublabel: h.project_name
                      }))}
                    placeholder="-- Ketik / Pilih Blok Rumah Asal --"
                    required
                  />
                </div>
              )}

              {formData.type === 'Pindah-Rumah' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dari Blok Asal <span className="text-red-500">*</span></label>
                    <SearchableSelect
                      value={formData.source_house_id}
                      onChange={(val) => setFormData({ ...formData, source_house_id: val })}
                      options={houses
                        .filter(h => h.status !== 'Selesai' && h.status !== 'Serah Terima')
                        .map(h => ({
                          value: h.id,
                          label: `Blok ${h.block_number}`,
                          sublabel: `${h.type} | ${h.project_name}`
                        }))}
                      placeholder="-- Pilih Asal --"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ke Blok Tujuan <span className="text-red-500">*</span></label>
                    <SearchableSelect
                      value={formData.destination_house_id}
                      onChange={(val) => setFormData({ ...formData, destination_house_id: val })}
                      options={houses
                        .filter(h => h.status !== 'Selesai' && h.status !== 'Serah Terima')
                        .map(h => ({
                          value: h.id,
                          label: `Blok ${h.block_number}`,
                          sublabel: `${h.type} | ${h.project_name}`
                        }))}
                      placeholder="-- Pilih Tujuan --"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Batal</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Proses Mutasi & Alokasi FIFO</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
