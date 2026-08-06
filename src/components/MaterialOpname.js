'use client';

import React, { useState, useEffect } from 'react';
import { Boxes, Edit, X, RefreshCw, CheckCircle2, AlertTriangle, Loader2, Plus, Trash2 } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';

export default function MaterialOpname({ houseId, view = 'pemakaian', onSuccess }) {
  const [siteStock, setSiteStock] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const [phases, setPhases] = useState([]);
  const [formHeader, setFormHeader] = useState({
    phase: '',
    usage_date: new Date().toISOString().split('T')[0],
    work_volume: '',
    work_unit: ''
  });
  const [formItems, setFormItems] = useState([
    { material_id: '', quantity: '', notes: '' }
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/houses/${houseId}/materials`);
      const json = await res.json();
      if (json.success) {
        setSiteStock(json.data.site_stock);
        setLogs(json.data.logs);
        setPhases(json.data.phases || ['Umum', 'Fondasi', 'Dinding', 'Atap & Plafon', 'Finishing']);
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError('Gagal memuat data material.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [houseId]);

  const handleAddItem = () => {
    setFormItems([...formItems, { material_id: '', quantity: '', notes: '' }]);
  };

  const handleRemoveItem = (idx) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== idx));
    }
  };

  const handlePhaseChange = (val) => {
    let newUnit = formHeader.work_unit;
    // Cari apakah tahapan ini sebelumnya sudah pernah dicatat dengan satuan tertentu
    const lastUsage = logs.find(log => log.log_type === 'Pemakaian' && log.phase === val && log.work_unit);
    if (lastUsage) {
      newUnit = lastUsage.work_unit;
    }
    setFormHeader({ ...formHeader, phase: val, work_unit: newUnit });
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...formItems];
    updated[idx][field] = value;
    setFormItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formHeader.phase || !formHeader.usage_date) {
      setModalError('Tahapan dan tanggal wajib diisi.');
      return;
    }

    const hasEmptyItem = formItems.some(i => !i.material_id || !i.quantity);
    if (hasEmptyItem) {
      setModalError('Semua baris material harus memiliki material dan jumlah yang valid.');
      return;
    }

    for (const item of formItems) {
      const selectedMat = siteStock.find(s => String(s.material_id) === String(item.material_id));
      if (!selectedMat || Number(item.quantity) > Number(selectedMat.stock_quantity)) {
        setModalError(`Jumlah dipakai melebihi stok yang ada untuk salah satu material.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setModalError(null);
      const payload = { ...formHeader, items: formItems.map(i => ({...i, quantity: Number(i.quantity)})) };
      const res = await fetch(`/api/houses/${houseId}/materials/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      let json = {};
      try {
        json = JSON.parse(text);
      } catch (e) {
        setModalError(`Server Error (${res.status}): ${text.replace(/<[^>]*>?/gm, '').substring(0, 200)}`);
        return;
      }

      if (json.success) {
        setShowModal(false);
        setFormItems([{ material_id: '', quantity: '', notes: '' }]);
        fetchData();
        if (onSuccess) onSuccess();
      } else {
        setModalError(json.error || 'Gagal menyimpan pemakaian.');
      }
    } catch (err) {
      setModalError(err.message || 'Terjadi kesalahan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>;

  // Group logs into Used Stock grouped by Phase
  const usedStockByPhase = logs
    .filter(log => log.log_type === 'Pemakaian')
    .reduce((acc, log) => {
      const phase = log.phase || 'Umum';
      if (!acc[phase]) acc[phase] = {};
      if (!acc[phase][log.material_id]) {
        acc[phase][log.material_id] = {
          id: log.material_id,
          name: log.material_name,
          unit: log.unit,
          total_used: 0
        };
      }
      acc[phase][log.material_id].total_used += Number(log.quantity);
      return acc;
    }, {});
  const usedStockGroups = Object.entries(usedStockByPhase).map(([phase, matsObj]) => [
    phase, 
    Object.values(matsObj).sort((a, b) => a.name.localeCompare(b.name))
  ]);
  return (
    <div className="space-y-6 animate-fadeIn">
      {view === 'pemakaian' && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">
              Pemakaian Material (Kontrol Lapangan)
            </h3>
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Catat Pemakaian
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-2xl border border-slate-200/80 card-shadow overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60">
            <h4 className="font-bold text-slate-900 text-sm">Stok Siap Pakai di Lapangan</h4>
          </div>
          {siteStock.length > 0 ? (
            <div className="overflow-x-auto max-h-100 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase">
                    <th className="py-3 px-4">Nama Material / Item</th>
                    <th className="py-3 px-4 text-right">Sisa Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {siteStock.slice().sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {s.name} <span className="text-slate-400 font-normal">({s.code})</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                          {Number(s.stock_quantity)} {s.unit}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-4">Belum ada material dikirim ke rumah ini.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 card-shadow overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60">
            <h4 className="font-bold text-slate-900 text-sm">Material Terpakai (Kumulatif)</h4>
          </div>
          {usedStockGroups.length > 0 ? (
            <div className="overflow-x-auto max-h-100 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase">
                    <th className="py-3 px-4">Nama Material / Item</th>
                    <th className="py-3 px-4 text-right">Total Terpakai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {usedStockGroups.map(([phase, phaseItems]) => (
                    <React.Fragment key={phase}>
                      <tr className="bg-orange-50/50 border-y border-orange-100/50">
                        <td colSpan="2" className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
                            <span className="font-black text-orange-900 text-xs uppercase tracking-[0.15em]">{phase}</span>
                          </div>
                        </td>
                      </tr>
                      {phaseItems.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {s.name}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg">
                              {s.total_used} {s.unit}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-4">Belum ada pemakaian tercatat.</p>
          )}
        </div>
        </div>
        </>
      )}

      {view === 'log' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 card-shadow overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Log Transaksi & Pemakaian Lapangan</h4>
              <p className="text-xs text-slate-500 mt-0.5">Gabungan riwayat mutasi (masuk/keluar) dan pemakaian</p>
            </div>
            <span className="text-xs font-bold bg-white border border-slate-200 shadow-xs text-slate-600 px-3 py-1 rounded-full">
              {logs.length} Data
            </span>
          </div>
          
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 whitespace-nowrap">Tanggal</th>
                  <th className="py-3.5 px-4">Tipe</th>
                  <th className="py-3.5 px-4 min-w-50">Material & Deskripsi</th>
                  <th className="py-3.5 px-4 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {logs.length > 0 ? logs.map((log, i) => {
                  const isIncoming = log.flow === 'IN';
                  return (
                    <tr key={`${log.log_type}-${log.id}-${i}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-600 text-xs whitespace-nowrap">
                        {new Date(log.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${isIncoming ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                          {log.log_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{log.material_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{log.description}</div>
                        {log.notes && <div className="text-[10px] text-slate-400 italic mt-1">Catatan: {log.notes}</div>}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-extrabold whitespace-nowrap ${isIncoming ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {isIncoming ? '+' : '-'}{Number(log.quantity)} <span className="text-xs font-semibold opacity-70">{log.unit}</span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs italic">
                      Belum ada riwayat mutasi atau pemakaian di lapangan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 mb-4 shrink-0">
              <h3 className="font-bold text-slate-900">Catat Pemakaian Material Lapangan</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded-lg"><X className="w-5 h-5"/></button>
            </div>
            <div className="overflow-y-auto pr-2 space-y-4">
              <form id="usageForm" onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-700 pb-4">
                {modalError && <div className="p-3 bg-red-50 text-red-700 rounded-xl">{modalError}</div>}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase mb-1">Tanggal</label>
                    <input type="date" value={formHeader.usage_date} onChange={e=>setFormHeader({...formHeader, usage_date: e.target.value})} className="w-full px-3 py-2 border rounded-xl" required />
                  </div>
                  <div>
                    <label className="block uppercase mb-1">Tahapan / Pekerjaan (Sesuai RAB)</label>
                    <SearchableSelect
                      options={phases.map(p => ({ value: p, label: p }))}
                      value={formHeader.phase}
                      onChange={handlePhaseChange}
                      placeholder="Ketik nama tahapan atau pilih..."
                      searchPlaceholder="Cari / ketik nama tahapan..."
                      allowCustom={true}
                      required={true}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block uppercase mb-1">Volume Progres (Opsional)</label>
                    <input 
                      type="number"
                      step="0.01" 
                      value={formHeader.work_volume} 
                      onChange={e=>setFormHeader({...formHeader, work_volume: e.target.value})} 
                      className="w-full px-3 py-2 border rounded-xl" 
                      placeholder="Contoh: 12"
                    />
                  </div>
                  <div>
                    <label className="block uppercase mb-1">Satuan Volume (Opsional)</label>
                    <SearchableSelect
                      options={[
                        { value: 'm', label: 'Meter (m)' },
                        { value: 'm2', label: 'Meter Persegi (m2)' },
                        { value: 'm3', label: 'Meter Kubik (m3)' },
                        { value: 'titik', label: 'Titik' },
                        { value: 'unit', label: 'Unit' }
                      ]}
                      value={formHeader.work_unit}
                      onChange={(val) => setFormHeader({...formHeader, work_unit: val})}
                      placeholder="Pilih atau ketik satuan..."
                      searchPlaceholder="Cari / ketik satuan..."
                      allowCustom={true}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block uppercase text-slate-700 font-bold">Daftar Material yang Dipakai</label>
                    <button type="button" onClick={handleAddItem} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Tambah Baris
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {formItems.map((item, idx) => {
                       const selectedMat = siteStock.find(s => String(s.material_id) === String(item.material_id));
                       return (
                        <div key={idx} className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 relative">
                          <div className="flex-1">
                            <label className="block uppercase mb-1 text-[10px]">Material</label>
                            <select value={item.material_id} onChange={e=>handleItemChange(idx, 'material_id', e.target.value)} className="w-full px-3 py-2 border rounded-xl" required>
                              <option value="">-- Pilih Material di Lapangan --</option>
                              {siteStock.map(s => <option key={s.material_id} value={s.material_id}>{s.name} (Stok: {s.stock_quantity} {s.unit})</option>)}
                            </select>
                          </div>
                          <div className="w-full sm:w-28">
                            <label className="block uppercase mb-1 text-[10px]">
                              Jumlah {selectedMat && <span className="text-blue-600">(Maks: {selectedMat.stock_quantity})</span>}
                            </label>
                            <input 
                              type="number" 
                              step="any" 
                              min="0.01"
                              max={selectedMat ? selectedMat.stock_quantity : ""} 
                              value={item.quantity} 
                              onChange={e=>handleItemChange(idx, 'quantity', e.target.value)} 
                              className="w-full px-3 py-2 border rounded-xl" 
                              placeholder="0"
                              required 
                            />
                          </div>
                          <div className="w-full sm:w-48">
                            <label className="block uppercase mb-1 text-[10px]">Catatan</label>
                            <input 
                              type="text" 
                              value={item.notes} 
                              onChange={e=>handleItemChange(idx, 'notes', e.target.value)} 
                              className="w-full px-3 py-2 border rounded-xl" 
                              placeholder="Opsional..." 
                            />
                          </div>
                          <div className="flex items-end justify-center pb-1">
                            {formItems.length > 1 ? (
                              <button type="button" onClick={() => handleRemoveItem(idx)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition" title="Hapus baris">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <div className="w-8"></div>
                            )}
                          </div>
                        </div>
                       );
                    })}
                  </div>
                </div>
              </form>
            </div>
            <div className="pt-4 border-t shrink-0">
              <button type="submit" form="usageForm" disabled={submitting} className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold">
                {submitting ? 'Menyimpan...' : 'Simpan Pemakaian Serentak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
