'use client';

import React, { useState, useEffect } from 'react';
import { Users2, Plus, Wallet, CheckCircle2, Clock, AlertCircle, Loader2, X, RefreshCw, HardHat, Home } from 'lucide-react';
import Pagination from '@/components/Pagination';
import SearchableSelect from '@/components/SearchableSelect';
import { useToast } from '@/components/ToastContext';

export default function BoronganPage() {
  const { showToast } = useToast();
  const [contracts, setContracts] = useState([]);
  const [houses, setHouses] = useState([]);
  const [kepalaTukangs, setKepalaTukangs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const [contractForm, setContractForm] = useState({
    house_id: '',
    kepala_tukang_id: '',
    work_name: '',
    contract_value: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [conRes, houRes, ktRes] = await Promise.all([
        fetch('/api/borongan'),
        fetch('/api/houses'),
        fetch('/api/kepala-tukang')
      ]);
      const [conJson, houJson, ktJson] = await Promise.all([
        conRes.json(), houRes.json(), ktRes.json()
      ]);

      if (conJson.success) setContracts(conJson.data);
      if (houJson.success) {
        setHouses(houJson.data);
        if (houJson.data.length > 0) setContractForm(prev => ({ ...prev, house_id: houJson.data[0].id }));
      }
      if (ktJson.success) {
        setKepalaTukangs(ktJson.data);
        if (ktJson.data.length > 0) setContractForm(prev => ({ ...prev, kepala_tukang_id: ktJson.data[0].id }));
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi saat memuat data borongan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateContract = async (e) => {
    e.preventDefault();
    if (!contractForm.house_id || !contractForm.kepala_tukang_id || !contractForm.work_name || !contractForm.contract_value) {
      showToast('Unit Rumah, Kepala Tukang, Nama Pekerjaan, dan Nilai Kontrak wajib diisi', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/borongan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractForm)
      });
      const json = await res.json();
      if (json.success) {
        setShowContractModal(false);
        showToast('Kontrak borongan berhasil dibuat', 'success');
        setContractForm({ house_id: houses.length > 0 ? houses[0].id : '', kepala_tukang_id: kepalaTukangs.length > 0 ? kepalaTukangs[0].id : '', work_name: '', contract_value: '' });
        fetchData();
      } else {
        showToast(json.error || 'Gagal membuat kontrak borongan', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // handleCreatePayment removed

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number || 0);
  };

  const paginatedContracts = contracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users2 className="w-6 h-6 text-purple-600" />
            <span>Manajemen Kontrak & Upah Borongan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola kesepakatan upah borongan dengan Kepala Tukang/Mandor. Kontrak dicatat secara lunas.
          </p>
        </div>
        <button
          onClick={() => { setModalError(null); setShowContractModal(true); }}
          className="px-4 py-2.5 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Kontrak Borongan</span>
        </button>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 card-shadow overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <p className="text-sm text-slate-600 font-medium">Memuat kontrak borongan & histori termin...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Pekerjaan Borongan</th>
                    <th className="py-3.5 px-6">Unit Rumah</th>
                    <th className="py-3.5 px-6">Kepala Tukang</th>
                    <th className="py-3.5 px-6 text-right">Nilai Kontrak</th>
                    <th className="py-3.5 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedContracts.length > 0 ? (
                    paginatedContracts.map((c) => {
                      const rem = Number(c.contract_value) - Number(c.total_paid);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-900">
                            {c.work_name}
                          </td>
                          <td className="py-4 px-6 font-semibold text-blue-700">
                            Blok {c.block_number} <span className="text-slate-400 font-normal text-xs">({c.house_type})</span>
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-700">
                            <div className="flex items-center gap-2">
                              <HardHat className="w-4 h-4 text-purple-500 shrink-0" />
                              <span>{c.kepala_tukang_name}</span>
                            </div>
                            {c.kepala_tukang_phone && <span className="text-slate-400 text-xs block">{c.kepala_tukang_phone}</span>}
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-slate-800">
                            {formatRupiah(c.contract_value)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 whitespace-nowrap">
                              Lunas / Selesai
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                        Belum ada kontrak borongan yang tercatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={contracts.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newSize) => { setItemsPerPage(newSize); setCurrentPage(1); }}
            />
          </>
        )}
      </div>

      {/* Modal Buat Kontrak Borongan */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users2 className="w-5 h-5 text-purple-600" />
                <span>Buat Kontrak Borongan Baru</span>
              </h3>
              <button onClick={() => setShowContractModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="mt-4 space-y-4">
              {modalError && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium">{modalError}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unit Rumah <span className="text-red-500">*</span></label>
                <SearchableSelect
                  value={contractForm.house_id}
                  onChange={(val) => setContractForm({ ...contractForm, house_id: val })}
                  options={houses
                    .filter(h => h.status !== 'Selesai' && h.status !== 'Serah Terima')
                    .map(h => ({
                      value: h.id,
                      label: `Blok ${h.block_number} (${h.type})`,
                      sublabel: h.project_name
                    }))}
                  placeholder="-- Ketik / Pilih Blok Rumah --"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kepala Tukang / Mandor <span className="text-red-500">*</span></label>
                <SearchableSelect
                  value={contractForm.kepala_tukang_id}
                  onChange={(val) => setContractForm({ ...contractForm, kepala_tukang_id: val })}
                  options={kepalaTukangs.map(k => ({
                    value: k.id,
                    label: k.name,
                    sublabel: k.phone ? `No. HP: ${k.phone}` : 'Tanpa No. HP'
                  }))}
                  placeholder="-- Ketik / Pilih Kepala Tukang --"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Pekerjaan <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: Pekerjaan Pondasi & Struktur Blok A-01"
                  value={contractForm.work_name}
                  onChange={(e) => setContractForm({ ...contractForm, work_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nilai Kontrak (Rp) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: 18.500.000"
                  value={contractForm.contract_value ? Number(contractForm.contract_value).toLocaleString('id-ID') : ''}
                  onChange={(e) => setContractForm({ ...contractForm, contract_value: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button type="button" onClick={() => setShowContractModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Batal</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Kontrak</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
