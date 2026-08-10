'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Loader2, X, RefreshCw, Layers } from 'lucide-react';
import { useToast } from '@/components/ToastContext';

export default function RabTemplatesPage() {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const [formHeader, setFormHeader] = useState({ house_type: 'Tipe 36', description: '' });
  const [formPhases, setFormPhases] = useState([
    {
      phaseName: 'Umum',
      work_volume: '',
      work_unit: '',
      items: [{ item_type: 'Material', material_id: '', name: '', quantity: '', unit: 'Sak', estimated_price: '' }]
    }
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
          setFormPhases([{
            phaseName: 'Umum',
            work_volume: '',
            work_unit: '',
            items: [{
              item_type: 'Material',
              material_id: matJson.data[0].id,
              name: matJson.data[0].name,
              quantity: 10,
              unit: matJson.data[0].unit || 'Sak',
              estimated_price: matJson.data[0].default_price || 0
            }]
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

  const handleAddPhase = () => {
    setFormPhases([...formPhases, { phaseName: '', items: [] }]);
  };

  const handleRemovePhase = (pIdx) => {
    setFormPhases(formPhases.filter((_, i) => i !== pIdx));
  };

  const handlePhaseNameChange = (pIdx, name) => {
    const updated = [...formPhases];
    updated[pIdx].phaseName = name;
    setFormPhases(updated);
  };

  const handleAddItem = (pIdx, type) => {
    const updated = [...formPhases];
    const firstMat = materials.length > 0 ? materials[0] : null;
    if (type === 'Material') {
      updated[pIdx].items.push({
        item_type: 'Material',
        material_id: firstMat ? firstMat.id : '',
        name: firstMat ? firstMat.name : 'Semen Portland',
        quantity: 10,
        unit: firstMat ? firstMat.unit : 'Sak',
        estimated_price: firstMat ? firstMat.default_price : 0
      });
    } else {
      updated[pIdx].items.push({
        item_type: 'Tenaga Kerja',
        material_id: null,
        name: '',
        quantity: 1,
        unit: 'Ls',
        estimated_price: ''
      });
    }
    setFormPhases(updated);
  };

  const handleRemoveItem = (pIdx, iIdx) => {
    const updated = [...formPhases];
    updated[pIdx].items.splice(iIdx, 1);
    setFormPhases(updated);
  };

  const handleItemChange = (pIdx, iIdx, field, value) => {
    const updated = [...formPhases];
    const item = updated[pIdx].items[iIdx];
    item[field] = value;
    if (field === 'material_id' && item.item_type === 'Material') {
      const selected = materials.find(m => String(m.id) === String(value));
      if (selected) {
        item.name = selected.name;
        item.unit = selected.unit;
        item.estimated_price = selected.default_price || 0;
      }
    }
    setFormPhases(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formHeader.house_type.trim()) {
      showToast('Tipe Rumah wajib diisi', 'error');
      return;
    }

    const missingPhase = formPhases.find(p => !p.work_volume || !String(p.work_volume).trim() || !p.work_unit || !p.work_unit.trim());
    if (missingPhase) {
      showToast(`Target Volume dan Satuan wajib diisi pada tahapan: ${missingPhase.phaseName || 'Tahapan Tanpa Nama'}`, 'error');
      return;
    }

    try {
      setSubmitting(true);
      let flatItems = [];
      formPhases.forEach(p => {
        const pName = p.phaseName.trim() || 'Umum';
        p.items.forEach(i => {
          flatItems.push({
            ...i,
            phase: pName,
            work_volume: p.work_volume || null,
            work_unit: p.work_unit || null,
            quantity: Number(i.quantity),
            estimated_price: Number(i.estimated_price)
          });
        });
      });
      const payload = {
        ...formHeader,
        items: flatItems
      };

      const url = isEditMode ? `/api/rab-templates/${editTemplateId}` : '/api/rab-templates';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        showToast('Template RAB berhasil disimpan', 'success');
        setFormHeader({ house_type: 'Tipe 36', description: '' });
        fetchData();
      } else {
        showToast(json.error || 'Gagal menyimpan template RAB', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (template) => {
    setIsEditMode(true);
    setEditTemplateId(template.id);
    setFormHeader({ house_type: template.house_type, description: template.description || '' });
    
    const grouped = template.items.reduce((acc, item) => {
      const p = item.phase || 'Umum';
      if (!acc[p]) acc[p] = [];
      acc[p].push({
        item_type: item.item_type,
        material_id: item.material_id || '',
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        estimated_price: item.estimated_price,
        work_volume: item.work_volume,
        work_unit: item.work_unit
      });
      return acc;
    }, {});
    
    const mappedPhases = Object.keys(grouped).map(k => ({ 
      phaseName: k, 
      work_volume: grouped[k][0].work_volume || '',
      work_unit: grouped[k][0].work_unit || '',
      items: grouped[k] 
    }));
    if (mappedPhases.length === 0) mappedPhases.push({ phaseName: 'Umum', work_volume: '', work_unit: '', items: [] });
    
    setFormPhases(mappedPhases);
    setShowModal(true);
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Yakin ingin menghapus template ini?')) return;
    try {
      const res = await fetch(`/api/rab-templates/${templateId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Template RAB berhasil dihapus', 'success');
        fetchData();
      } else {
        showToast(json.error || 'Gagal menghapus template', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi', 'error');
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
          onClick={() => { 
            setIsEditMode(false); 
            setEditTemplateId(null);
            setModalError(null); 
            setFormHeader({ house_type: 'Tipe 36', description: '' });
            setShowModal(true); 
          }}
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
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-sm border border-blue-200">
                      {formatRupiah(tem.total_budget)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditModal(tem)} className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold">Edit</button>
                      <button onClick={() => handleDelete(tem.id)} className="text-[10px] px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-md font-bold">Hapus</button>
                    </div>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Item Anggaran ({tem.items?.length || 0} Item)</p>
                  {tem.items && tem.items.length > 0 ? (
                    Object.entries(
                      tem.items.reduce((acc, item) => {
                        const phase = item.phase || 'Umum';
                        if (!acc[phase]) acc[phase] = [];
                        acc[phase].push(item);
                        return acc;
                      }, {})
                    ).map(([phase, phaseItems]) => (
                      <div key={phase} className="mb-4 last:mb-0">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <div className="w-1.5 h-3.5 bg-blue-600 rounded-full"></div>
                          <span className="font-black text-blue-900 text-[11px] uppercase tracking-[0.15em]">
                            {phase} {phaseItems[0].work_volume && phaseItems[0].work_unit ? `(${Number(phaseItems[0].work_volume)} ${phaseItems[0].work_unit})` : ''}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {phaseItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
                              <div>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 ${item.item_type === 'Material' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                  {item.item_type}
                                </span>
                                <span className="font-bold text-slate-800">{item.name}</span>
                                <span className="text-slate-500 ml-1">({Number(item.quantity)} {item.unit})</span>
                              </div>
                              <span className="font-extrabold text-slate-900">{formatRupiah(item.total_price)}</span>
                            </div>
                          ))}
                        </div>
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
          <div className="bg-white rounded-2xl border border-slate-200 max-w-5xl w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>{isEditMode ? 'Edit Template RAB' : 'Rancang Template RAB Tipe Rumah'}</span>
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

              {/* Phases List */}
              <div className="space-y-4">
                <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-4">
                  {formPhases.map((phase, pIdx) => (
                    <div key={pIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-sm relative group">
                      {/* Phase Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-slate-200 gap-3">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            placeholder="Nama Tahapan Pekerjaan (Cth: Fondasi)"
                            value={phase.phaseName}
                            onChange={(e) => handlePhaseNameChange(pIdx, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-600 bg-white text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                            required
                          />
                          <div className="flex gap-3">
                            <input
                              type="number"
                              placeholder="Target Volume (Cth: 20)"
                              value={phase.work_volume || ''}
                              onChange={(e) => {
                                const newPhases = [...formPhases];
                                newPhases[pIdx].work_volume = e.target.value;
                                setFormPhases(newPhases);
                              }}
                              className="w-1/2 sm:w-1/3 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                              required
                            />
                            <input
                              type="text"
                              placeholder="Satuan (Cth: m2)"
                              value={phase.work_unit || ''}
                              onChange={(e) => {
                                const newPhases = [...formPhases];
                                newPhases[pIdx].work_unit = e.target.value;
                                setFormPhases(newPhases);
                              }}
                              className="w-1/2 sm:w-1/3 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => handleAddItem(pIdx, 'Material')} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition whitespace-nowrap">+ Material</button>
                          <button type="button" onClick={() => handleAddItem(pIdx, 'Tenaga Kerja')} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-200 transition whitespace-nowrap">+ Upah</button>
                          {formPhases.length > 1 && (
                            <button type="button" onClick={() => handleRemovePhase(pIdx)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition" title="Hapus Tahapan">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items inside Phase */}
                      <div className="space-y-2">
                        {phase.items.length === 0 ? (
                           <div className="text-center py-4 text-xs text-slate-400 italic bg-white rounded-lg border border-dashed border-slate-200">Belum ada item di tahapan ini. Klik + Material atau + Upah.</div>
                        ) : phase.items.map((item, iIdx) => (
                          <div key={iIdx} className="p-3 rounded-lg border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-12 gap-3 items-center hover:border-blue-200 transition-colors">
                            {/* item_type */}
                            <div className="sm:col-span-2">
                              <select
                                value={item.item_type}
                                onChange={(e) => handleItemChange(pIdx, iIdx, 'item_type', e.target.value)}
                                className="w-full px-2 py-1.5 rounded-md border text-[11px] font-bold text-slate-700 focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="Material">Material</option>
                                <option value="Tenaga Kerja">Tenaga Kerja</option>
                              </select>
                            </div>
                            
                            {/* name / material_id */}
                            <div className={item.item_type === 'Material' ? "sm:col-span-4" : "sm:col-span-7"}>
                              {item.item_type === 'Material' ? (
                                <select
                                  value={item.material_id}
                                  onChange={(e) => handleItemChange(pIdx, iIdx, 'material_id', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-md border text-[11px] font-bold text-slate-800 focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="">-- Pilih Material --</option>
                                  {materials.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Keterangan Pekerjaan"
                                  value={item.name}
                                  onChange={(e) => handleItemChange(pIdx, iIdx, 'name', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-md border text-[11px] font-bold text-slate-800 focus:ring-1 focus:ring-blue-500"
                                />
                              )}
                            </div>
                            
                            {/* Qty & Unit */}
                            {item.item_type === 'Material' && (
                              <>
                                <div className="sm:col-span-1">
                                  <input
                                    type="number"
                                    placeholder="Qty"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(pIdx, iIdx, 'quantity', e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-md border text-[11px] font-bold text-slate-800 text-center focus:ring-1 focus:ring-blue-500"
                                    required
                                  />
                                </div>
                                <div className="sm:col-span-1">
                                  <input
                                    type="text"
                                    placeholder="Satuan"
                                    value={item.unit}
                                    onChange={(e) => handleItemChange(pIdx, iIdx, 'unit', e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-[11px] text-center text-slate-600 bg-slate-50 focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              </>
                            )}

                            {/* Price */}
                            <div className={item.item_type === 'Material' ? "sm:col-span-3" : "sm:col-span-2"}>
                              <input
                                type="text"
                                placeholder="Harga (Rp)"
                                value={item.estimated_price ? Number(item.estimated_price).toLocaleString('id-ID') : ''}
                                onChange={(e) => handleItemChange(pIdx, iIdx, 'estimated_price', e.target.value.replace(/\D/g, ''))}
                                className="w-full px-2.5 py-1.5 rounded-md border text-[11px] font-bold text-slate-800 focus:ring-1 focus:ring-blue-500"
                              />
                            </div>

                            {/* Delete Item */}
                            <div className="sm:col-span-1 flex justify-end">
                              <button type="button" onClick={() => handleRemoveItem(pIdx, iIdx)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition" title="Hapus Item">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center pt-2">
                  <button type="button" onClick={handleAddPhase} className="px-5 py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Tambah Kelompok Tahapan Baru
                  </button>
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
