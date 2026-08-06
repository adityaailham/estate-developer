'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, AlertCircle, ShoppingCart, Loader2, RefreshCw, Trash2, Calendar, FileText, Settings, Store, X, Printer, Building, Truck, ArrowRight } from 'lucide-react';
import Pagination from '@/components/Pagination';
import SearchableSelect from '@/components/SearchableSelect';
import { useToast } from '@/components/ToastContext';

export default function PurchasesPage() {
  const { showToast } = useToast();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const [formHeader, setFormHeader] = useState({
    supplier_id: '',
    invoice_number: '',
    purchase_date: new Date().toISOString().split('T')[0]
  });

  const [formItems, setFormItems] = useState([
    { material_id: '', quantity: '', price_unit: '', destination_type: 'Gudang', house_id: '' }
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purRes, supRes, matRes, houRes] = await Promise.all([
        fetch('/api/purchases'),
        fetch('/api/suppliers'),
        fetch('/api/materials'),
        fetch('/api/houses')
      ]);
      const [purJson, supJson, matJson, houJson] = await Promise.all([
        purRes.json(), supRes.json(), matRes.json(), houRes.json()
      ]);

      if (purJson.success) setPurchases(purJson.data);
      if (supJson.success) {
        setSuppliers(supJson.data);
        if (supJson.data.length > 0) setFormHeader(prev => ({ ...prev, supplier_id: supJson.data[0].id }));
      }
      if (matJson.success) {
        setMaterials(matJson.data);
        let defaultMatId = matJson.data.length > 0 ? matJson.data[0].id : '';
        let defaultPrice = matJson.data.length > 0 ? matJson.data[0].default_price : 0;
        
        if (typeof window !== 'undefined') {
           const params = new URLSearchParams(window.location.search);
           const paramMatId = params.get('mat_id');
           if (paramMatId) {
              const selectedMat = matJson.data.find(m => String(m.id) === paramMatId);
              if (selectedMat) {
                 defaultMatId = selectedMat.id;
                 defaultPrice = selectedMat.default_price;
                 setShowModal(true);
                 // Clear URL parameter so it doesn't trigger again on subsequent fetches
                 window.history.replaceState({}, document.title, window.location.pathname);

                 setFormItems([{
                   material_id: defaultMatId,
                   quantity: 1,
                   price_unit: defaultPrice || 0,
                   destination_type: 'Gudang',
                   house_id: houJson.success && houJson.data.length > 0 ? houJson.data[0].id : ''
                 }]);
                 
                 // Skip the default setting below
                 defaultMatId = null;
              }
           }
        }

        if (defaultMatId) {
          setFormItems(prev => {
            if (prev.length === 1 && prev[0].material_id === '') {
              return [{
                material_id: defaultMatId,
                quantity: 1,
                price_unit: defaultPrice || 0,
                destination_type: 'Gudang',
                house_id: houJson.success && houJson.data.length > 0 ? houJson.data[0].id : ''
              }];
            }
            return prev;
          });
        }
      }
      if (houJson.success) setHouses(houJson.data);
    } catch (err) {
      setError('Terjadi kesalahan koneksi saat memuat data pembelian');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = () => {
    const firstMat = materials.length > 0 ? materials[0] : null;
    const firstHouse = houses.length > 0 ? houses[0] : null;
    setFormItems([...formItems, {
      material_id: firstMat ? firstMat.id : '',
      quantity: 1,
      price_unit: firstMat ? firstMat.default_price : 0,
      destination_type: 'Gudang',
      house_id: firstHouse ? firstHouse.id : ''
    }]);
  };

  const handleRemoveItem = (idx) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, index) => index !== idx));
    }
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...formItems];
    updated[idx][field] = value;
    if (field === 'material_id') {
      const selected = materials.find(m => String(m.id) === String(value));
      if (selected) {
        updated[idx].price_unit = selected.default_price || 0;
      }
    }
    setFormItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formHeader.supplier_id || !formHeader.invoice_number.trim() || !formHeader.purchase_date) {
      setModalError('Supplier, Nomor Nota, dan Tanggal Beli wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);
      const payload = {
        ...formHeader,
        items: formItems.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          price_unit: Number(item.price_unit)
        }))
      };

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        showToast('Nota pembelian berhasil disimpan', 'success');
        setFormHeader({ supplier_id: suppliers.length > 0 ? suppliers[0].id : '', invoice_number: '', purchase_date: new Date().toISOString().split('T')[0] });
        fetchData();
      } else {
        showToast(json.error || 'Gagal menyimpan transaksi pembelian', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi saat memproses pembelian', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePurchase = async (purchase) => {
    if (!confirm(`Apakah Anda yakin ingin membatalkan/menghapus Nota Pembelian '${purchase.invoice_number}' dan mengurangi stok yang masuk?`)) return;
    try {
      const res = await fetch(`/api/purchases/${purchase.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Nota pembelian berhasil dibatalkan & stok disesuaikan', 'success');
        fetchData();
      } else {
        showToast('Gagal menghapus nota: ' + (json.error || 'Terjadi kesalahan'), 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi saat menghapus nota', 'error');
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number || 0);
  };

  const totalInvoicePreview = formItems.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.price_unit)), 0);

  const getLocalDateString = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return typeof dateInput === 'string' ? dateInput.split('T')[0] : '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const filteredPurchases = purchases.filter(p => {
    if (!p.purchase_date) return true;
    const pDate = getLocalDateString(p.purchase_date);
    const matchSupplier = filterSupplier ? Number(p.supplier_id) === Number(filterSupplier) : true;
    const matchStart = filterStartDate ? pDate >= filterStartDate : true;
    const matchEnd = filterEndDate ? pDate <= filterEndDate : true;
    return matchSupplier && matchStart && matchEnd;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filterSupplier, filterStartDate, filterEndDate]);

  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalFilteredAmount = filteredPurchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);

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
            <h2 className="text-lg font-bold text-slate-800">LAPORAN NOTA PEMBELIAN MATERIAL</h2>
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
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <span>Pencatatan Pembelian (Masuk Gudang / Langsung Lapangan)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Catat pembelian material dari supplier. Pilih tujuan masuk ke Gudang Utama atau dikirim langsung ke proyek per unit rumah.
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
            <span>Catat Nota Beli Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-100/70 p-4 rounded-2xl border border-slate-200/60 print:hidden">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
            >
              <option value="">Semua Supplier ({suppliers.length})</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
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

      {/* Purchases List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 card-shadow overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-600 font-medium">Memuat riwayat nota pembelian...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Tanggal Beli</th>
                    <th className="py-3.5 px-6">No. Nota / Invoice</th>
                    <th className="py-3.5 px-6">Supplier</th>
                    <th className="py-3.5 px-6 text-center">Total Item</th>
                    <th className="py-3.5 px-6 text-right">Total Nilai Nota</th>
                    <th className="py-3.5 px-6 text-center print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedPurchases.length > 0 ? (
                    paginatedPurchases.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 font-medium text-slate-600 text-xs">
                          {isMounted ? new Date(p.purchase_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : getLocalDateString(p.purchase_date)}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900 font-mono text-xs">
                          {p.invoice_number}
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-800">
                          {p.supplier_name}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200">
                            {p.total_items || 0} Item
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-extrabold text-slate-900">
                          {formatRupiah(p.total_amount)}
                        </td>
                        <td className="py-4 px-6 text-center print:hidden">
                          <button
                            onClick={() => handleDeletePurchase(p)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                            title="Batalkan Nota & Rollback Stok"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                        Belum ada nota pembelian material pada rentang tanggal/filter terpilih.
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredPurchases.length > 0 && (
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td colSpan={4} className="py-4 px-6 font-black text-right text-slate-700 uppercase tracking-wider text-xs">
                        Total Rekap Nilai Pembelian:
                      </td>
                      <td className="py-4 px-6 text-right font-black text-blue-700 text-base">
                        {formatRupiah(totalFilteredAmount)}
                      </td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredPurchases.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newSize) => { setItemsPerPage(newSize); setCurrentPage(1); }}
            />
          </>
        )}
      </div>

      {/* Modal Tambah Nota Pembelian */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <span>Pencatatan Nota Pembelian Material</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-6">
              {modalError && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium">{modalError}</div>}

              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Supplier <span className="text-red-500">*</span></label>
                  <SearchableSelect
                    value={formHeader.supplier_id}
                    onChange={(val) => setFormHeader({ ...formHeader, supplier_id: val })}
                    options={suppliers.map(s => ({
                      value: s.id,
                      label: s.name,
                      sublabel: s.contact_person ? `CP: ${s.contact_person}` : ''
                    }))}
                    placeholder="-- Ketik / Pilih Supplier --"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">No. Nota / Invoice <span className="text-red-500">*</span></label>
                    <button 
                      type="button" 
                      onClick={() => {
                        const today = new Date();
                        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
                        const random = Math.floor(1000 + Math.random() * 9000);
                        setFormHeader({ ...formHeader, invoice_number: `INV-${dateStr}-${random}` });
                      }}
                      className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg hover:bg-blue-100 transition"
                      title="Buat nomor otomatis jika tidak ada nota"
                    >
                      Generate Otomatis
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: INV/2026/07/001"
                    value={formHeader.invoice_number}
                    onChange={(e) => setFormHeader({ ...formHeader, invoice_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tanggal Pembelian <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={formHeader.purchase_date}
                    onChange={(e) => setFormHeader({ ...formHeader, purchase_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Daftar Item Belanja & Pilihan Tujuan</h4>
                  <button type="button" onClick={handleAddItem} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Item</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Material</label>
                        <SearchableSelect
                          value={item.material_id}
                          onChange={(val) => handleItemChange(idx, 'material_id', val)}
                          options={materials.map(m => ({
                            value: m.id,
                            label: m.name,
                            sublabel: `Satuan: ${m.unit} | Stok: ${Number(m.stock_quantity).toLocaleString('id-ID')}`
                          }))}
                          placeholder="-- Pilih Material --"
                          required
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Jumlah</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Harga Satuan (Rp)</label>
                        <input
                          type="text"
                          value={item.price_unit ? Number(item.price_unit).toLocaleString('id-ID') : ''}
                          onChange={(e) => handleItemChange(idx, 'price_unit', e.target.value.replace(/\D/g, ''))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Tujuan</label>
                        <select
                          value={item.destination_type}
                          onChange={(e) => handleItemChange(idx, 'destination_type', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-blue-50/50 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Gudang">Masuk Gudang (FIFO)</option>
                          <option value="Rumah">Kirim Langsung ke Rumah</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        {item.destination_type === 'Rumah' ? (
                          <>
                            <label className="block text-[10px] font-bold text-purple-700 uppercase">Blok Rumah</label>
                            <SearchableSelect
                              value={item.house_id}
                              onChange={(val) => handleItemChange(idx, 'house_id', val)}
                              options={houses
                                .filter(h => h.status !== 'Selesai' && h.status !== 'Serah Terima')
                                .map(h => ({
                                  value: h.id,
                                  label: `Blok ${h.block_number} (${h.type})`,
                                  sublabel: h.project_name
                                }))}
                              placeholder="-- Pilih Blok --"
                              required
                            />
                          </>
                        ) : (
                          <div className="text-[11px] text-slate-400 font-medium pt-3 text-center">Stok Gudang Global</div>
                        )}
                      </div>

                      <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                        {formItems.length > 1 && (
                          <button type="button" onClick={() => handleRemoveItem(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Preview Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Total Estimasi Nilai Nota:</span>
                  <span className="text-xl font-extrabold text-blue-600">{formatRupiah(totalInvoicePreview)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Batal</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5">
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Simpan & Proses Nota</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
