'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Loader2, X, RefreshCw, Layers } from 'lucide-react';

export default function RabTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const [formHeader, setFormHeader] = useState({ house_type: 'Tipe 36', description: '' });
  const [formItems, setFormItems] = useState([
    { item_type: 'Material', material_id: '', name: '', quantity: '', unit: 'Sak', estimated_price: '' }
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [temRes, matRes] = await Promise.all([
        fetch('/api/rab-templates'),
        fetch('/api/materials')
      ]);
      const [temJson, matJson] = await Promise.all([temRes.json(), matRes.json()]);

      if (temJson.success) setTemplates(temJson.data);
      if (matJson.success) {
        setMaterials(matJson.data);
        if (matJson.data.length > 0) {
          setFormItems([{
            item_type: 'Material',
            material_id: matJson.data[0].id,
            name: matJson.data[0].name,
            quantity: 10,
            unit: matJson.data[0].unit || 'Sak',
            estimated_price: matJson.data[0].default_price || 0
          }]);
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi saat memuat template RAB');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = (type) => {
    const firstMat = materials.length > 0 ? materials[0] : null;
    if (type === 'Material') {
      setFormItems([...formItems, {
        item_type: 'Material',
        material_id: firstMat ? firstMat.id : '',
        name: firstMat ? firstMat.name : 'Semen Portland',
        quantity: 10,
        unit: firstMat ? firstMat.unit : 'Sak',
        estimated_price: firstMat ? firstMat.default_price : 0
      }]);
    } else {
      setFormItems([...formItems, {
        item_type: 'Tenaga Kerja',
        material_id: '',
        name: 'Upah Borongan Struktur & Pondasi',
        quantity: 1,
        unit: 'Paket',
        estimated_price: 15000000
      }]);
    }
  };

  const handleRemoveItem = (idx) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, index) => index !== idx));
    }
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...formItems];
    updated[idx][field] = value;
    if (field === 'material_id' && updated[idx].item_type === 'Material') {
      const selected = materials.find(m => String(m.id) === String(value));
      if (selected) {
        updated[idx].name = selected.name;
        updated[idx].unit = selected.unit;
        updated[idx].estimated_price = selected.default_price || 0;
      }
    }
    setFormItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formHeader.house_type.trim()) {
      setModalError('Tipe Rumah wajib diisi');
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
          estimated_price: Number(item.estimated_price)
        }))
      };

      const res = await fetch('/api/rab-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setFormHeader({ house_type: 'Tipe 36', description: '' });
        fetchData();
      } else {
        setModalError(json.error || 'Gagal membuat template RAB');
      }
    } catch (err) {
      setModalError('Terjadi kesalahan koneksi');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number || 0);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Master Template RAB Tipe Rumah</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Standar target anggaran material & upah per tipe rumah. Disalin otomatis ke setiap unit baru yang dibuat.
          </p>
        </div>
        <button
          onClick={() => { setModalError(null); setShowModal(true); }}
          className="px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Template RAB Baru</span>
        </button>
      </div>

      {/* Templates Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-600 font-medium">Memuat standar template RAB...</p>
          </div>
        ) : templates.length > 0 ? (
          templates.map((tem) => (
            <div key={tem.id} className="bg-white rounded-2xl border border-slate-200/80 card-shadow hover-lift p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xl tracking-tight flex items-center gap-2">
                      <span>{tem.house_type}</span>
                    </h3>
                    {tem.description && <p className="text-xs text-slate-500 mt-0.5">{tem.description}</p>}
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-sm border border-blue-200">
                    {formatRupiah(tem.total_budget)}
                  </span>
                </div>

                {/* Items Preview */}
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Item Anggaran ({tem.items?.length || 0} Item)</p>
                  {tem.items && tem.items.length > 0 ? (
                    tem.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <div>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 ${item.item_type === 'Material' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {item.item_type}
                          </span>
                          <span className="font-bold text-slate-800">{item.name}</span>
                          <span className="text-slate-500 ml-1">({item.quantity} {item.unit})</span>
                        </div>
                        <span className="font-extrabold text-slate-900">{formatRupiah(item.total_price)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Belum ada item anggaran.</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Mat: {formatRupiah(tem.total_material_budget)} | Upah: {formatRupiah(tem.total_labor_budget)}</span>
                <span className="text-blue-600 font-bold flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Siap Digunakan</span>
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white p-12 rounded-2xl border text-center space-y-3">
            <Layers className="w-10 h-10 text-blue-500 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Belum Ada Template RAB Tipe Rumah</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Buatlah template untuk tipe rumah yang akan Anda bangun (misal: Tipe 36) agar anggaran target terisi otomatis saat pembuatan unit.
            </p>
          </div>
        )}
      </div>

      {/* Modal Buat Template RAB */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Rancang Template RAB Tipe Rumah</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-6">
              {modalError && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium">{modalError}</div>}

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipe Rumah <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Contoh: Tipe 36 / Tipe 45"
                    value={formHeader.house_type}
                    onChange={(e) => setFormHeader({ ...formHeader, house_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Keterangan Singkat</label>
                  <input
                    type="text"
                    placeholder="Contoh: Rumah Subsidi Standar / Modern Minimalis"
                    value={formHeader.description}
                    onChange={(e) => setFormHeader({ ...formHeader, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Daftar Item Target Anggaran</h4>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => handleAddItem('Material')} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition">+ Material</button>
                    <button type="button" onClick={() => handleAddItem('Tenaga Kerja')} className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-100 transition">+ Upah</button>
                  </div>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Kategori</label>
                        <select
                          value={item.item_type}
                          onChange={(e) => handleItemChange(idx, 'item_type', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border text-xs font-bold"
                        >
                          <option value="Material">Material</option>
                          <option value="Tenaga Kerja">Tenaga Kerja</option>
                        </select>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Nama Item</label>
                        {item.item_type === 'Material' ? (
                          <select
                            value={item.material_id}
                            onChange={(e) => handleItemChange(idx, 'material_id', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold"
                          >
                            <option value="">-- Pilih --</option>
                            {materials.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold"
                          />
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Kebutuhan</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold"
                          required
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Satuan</label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border text-xs text-center"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Est. Harga (Rp)</label>
                        <input
                          type="number"
                          value={item.estimated_price}
                          onChange={(e) => handleItemChange(idx, 'estimated_price', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold"
                        />
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

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Batal</button>
                <button type="submit" disabled={submitting} className="px-6 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5">
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Template RAB</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
