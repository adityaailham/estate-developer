'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Home, 
  Building2, 
  Boxes, 
  Users2, 
  ArrowRightLeft, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Wallet, 
  FileText, 
  Loader2, 
  PlusCircle, 
  RefreshCw,
  TrendingDown,
  ClipboardList,
  Target,
  History,
  Save
} from 'lucide-react';
import MaterialOpname from '@/components/MaterialOpname';
import { useToast } from '@/components/ToastContext';

export default function HouseCostSheetPage({ params }) {
  const unwrappedParams = use(params);
  const houseId = unwrappedParams.id;
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'labor' | 'mutations'
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTemplateName, setExportTemplateName] = useState('');
  const [expandedCoeffs, setExpandedCoeffs] = useState({});
  const { showToast } = useToast();

  const toggleCoeffDetail = (phase) => {
    setExpandedCoeffs(prev => ({...prev, [phase]: !prev[phase]}));
  };

  const handleExportRAB = async (e) => {
    e.preventDefault();
    if (!exportTemplateName.trim()) {
      showToast('Nama template RAB wajib diisi', 'error');
      return;
    }

    try {
      setExporting(true);
      const res = await fetch(`/api/houses/${houseId}/export-rab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateName: exportTemplateName })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message, 'success');
        setShowExportModal(false);
        setExportTemplateName('');
      } else {
        showToast(json.error || 'Terjadi kesalahan saat membuat template', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi jaringan.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const fetchCostSheet = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/houses/${houseId}/cost-sheet`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Gagal memuat Laporan Cost Sheet unit rumah');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi saat memuat data Cost Sheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (houseId) fetchCostSheet();
  }, [houseId]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(number || 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Menghitung analisis perbandingan RAB vs Aktual...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Gagal Memuat Cost Sheet</h3>
          <Link href="/houses" className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold">Kembali</Link>
        </div>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const { house, summary, target_material_items, target_labor_items, actual_materials, labor_contracts, recent_mutations, usage_logs = [] } = data;

  // Determine health badge style
  let healthStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-emerald-500/10';
  let HealthIcon = CheckCircle2;
  if (summary.health_status.includes('Waspada')) {
    healthStyle = 'bg-amber-100 text-amber-800 border-amber-300 shadow-amber-500/10';
    HealthIcon = AlertTriangle;
  } else if (summary.health_status.includes('Overbudget')) {
    healthStyle = 'bg-red-100 text-red-800 border-red-300 animate-pulse shadow-red-500/20';
    HealthIcon = AlertTriangle;
  }

  const percentageUsed = summary.target_total_budget > 0 
    ? ((summary.actual_total_cost / summary.target_total_budget) * 100).toFixed(1) 
    : 0;

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Top Header & Back */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow">
        <div className="flex items-start gap-4">
          <Link
            href="/houses"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0 mt-0.5"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Laporan Cost Sheet</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${
                house.status === 'Belum Mulai' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                house.status === 'Pembangunan' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                house.status === 'Selesai' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                {house.status}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${healthStyle}`}>
                <HealthIcon className="w-3 h-3" />
                <span>{summary.health_status}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
                Blok {house.block_number}
              </h1>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200 mt-0.5">
                {house.project_name} &bull; {house.type}
              </span>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-2">
          <button 
            onClick={fetchCostSheet}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shrink-0"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href={`/mutations?house_id=${house.id}&type=Keluar-Rumah&action=new`}
            className="flex-1 md:flex-none px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Masuk ke {house.block_number}</span>
          </Link>
          <Link
            href={`/mutations?house_id=${house.id}&action=out`}
            className="flex-1 md:flex-none px-4 py-2.5 bg-linear-to-r from-rose-500 to-red-600 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20 hover:from-rose-600 hover:to-red-700 transition flex items-center justify-center gap-1.5"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Mutasi Keluar</span>
          </Link>
          <button
            onClick={() => setShowExportModal(true)}
            disabled={exporting}
            className="flex-1 md:flex-none px-4 py-2.5 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition flex items-center justify-center gap-1.5"
            title="Simpan total pengeluaran aktual ini menjadi Template RAB baku"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden lg:inline">Jadikan Template RAB</span>
            <span className="lg:hidden">RAB</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
        {/* Card 1: Target Anggaran RAB */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Target RAB</span>
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">{formatRupiah(summary.target_total_budget)}</h3>
            <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-slate-500">
              <div className="flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5 text-blue-500" />
                <span>Mat: {formatRupiah(summary.target_material_budget)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users2 className="w-3.5 h-3.5 text-purple-500" />
                <span>Upah: {formatRupiah(summary.target_labor_budget)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Pengeluaran Aktual */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Aktual Keluar</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${healthStyle}`}>
              {summary.health_status}
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-extrabold text-slate-900">{formatRupiah(summary.actual_total_cost)}</h3>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Terserap</span>
                <span className="text-lg font-black text-blue-600">{percentageUsed}%</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs">
              <div className="flex-1">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Aktual Material</span>
                <span className="font-bold text-blue-600">{formatRupiah(summary.actual_material_cost)}</span>
              </div>
              <div className="flex-1 border-l border-slate-100 pl-4">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Aktual Upah</span>
                <span className="font-bold text-purple-600">{formatRupiah(summary.actual_labor_cost)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Selisih Varian */}
        <div className={`p-6 rounded-2xl border card-shadow flex flex-col justify-between ${
          summary.variance_total >= 0 
            ? 'bg-linear-to-br from-emerald-900 to-slate-900 text-white border-emerald-700/50' 
            : 'bg-linear-to-br from-red-900 to-slate-900 text-white border-red-700/50'
        }`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Selisih & Varian Biaya</span>
            {summary.variance_total >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold">
              {summary.variance_total >= 0 ? '+' : ''}{formatRupiah(summary.variance_total)}
            </h3>
            <p className="text-xs font-semibold mt-2 text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />
              <span>
                {summary.variance_total >= 0 ? 'Hemat (Sisa anggaran tersedia)' : 'Melebihi target anggaran (Overbudget)'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'materials'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Breakdown Material ({target_material_items.length} Target / {actual_materials.length} Aktual)</span>
        </button>

        <button
          onClick={() => setActiveTab('opname')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'opname'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Pemakaian Material</span>
        </button>

        <button
          onClick={() => setActiveTab('log')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'log'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Log Transaksi & Mutasi</span>
        </button>

        <button
          onClick={() => setActiveTab('labor')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'labor'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>Upah & Kontrak Borongan ({labor_contracts.length} Kontrak)</span>
        </button>

        <button
          onClick={() => setActiveTab('coefficient')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'coefficient'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Analisis Koefisien Aktual</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-8 animate-fadeIn">
        {activeTab === 'opname' && (
          <MaterialOpname houseId={house.id} view="pemakaian" onSuccess={fetchCostSheet} />
        )}

        {activeTab === 'log' && (
          <MaterialOpname houseId={house.id} view="log" />
        )}

        {activeTab === 'coefficient' && (() => {
          // Calculate coefficients
          const coefficientsByPhase = (usage_logs || []).reduce((acc, log) => {
            const phase = log.phase || 'Umum';
            if (!acc[phase]) acc[phase] = { volumes: {}, unit: '' };
            
            if (log.work_volume && log.work_unit) {
              if (!acc[phase].volumes[log.created_at]) acc[phase].volumes[log.created_at] = 0;
              acc[phase].volumes[log.created_at] = Number(log.work_volume);
              acc[phase].unit = log.work_unit;
            }
            return acc;
          }, {});

          const phasesMap = {};
          (usage_logs || []).forEach(log => {
            const p = log.phase || 'Umum';
            if (!phasesMap[p]) {
              phasesMap[p] = { phase: p, volumeKeys: {}, volumeList: [], materials: {} };
            }
            if (log.work_volume > 0) {
              const entryKey = log.created_at;
              if (!phasesMap[p].volumeKeys[entryKey]) {
                const newEntry = {
                  date: log.usage_date,
                  volume: Number(log.work_volume),
                  unit: log.work_unit || '',
                  mats: []
                };
                phasesMap[p].volumeKeys[entryKey] = newEntry;
                phasesMap[p].volumeList.push(newEntry);
              }
              phasesMap[p].volumeKeys[entryKey].mats.push({
                name: log.material_name,
                qty: Number(log.quantity_used),
                unit: log.material_unit
              });
            }
            if (!phasesMap[p].materials[log.material_id]) {
              phasesMap[p].materials[log.material_id] = { name: log.material_name, unit: log.material_unit, qty: 0 };
            }
            phasesMap[p].materials[log.material_id].qty += Number(log.quantity_used);
          });

          const coefficientData = Object.values(phasesMap).map(pd => {
            const totalVolume = pd.volumeList.reduce((sum, e) => sum + e.volume, 0);
            const units = [...new Set(pd.volumeList.map(e => e.unit).filter(Boolean))].join(', ');
            const coeffs = Object.values(pd.materials)
              .map(m => ({ ...m, coeff: totalVolume > 0 ? (m.qty / totalVolume) : null }))
              .filter(m => m.coeff !== null)
              .sort((a, b) => a.name.localeCompare(b.name));

            // Urutkan juga material di dalam masing-masing log riwayat
            pd.volumeList.forEach(entry => {
              entry.mats.sort((a, b) => a.name.localeCompare(b.name));
            });

            return { phase: pd.phase, totalVolume, unit: units, coeffs, volumeList: pd.volumeList };
          }).filter(p => p.totalVolume > 0);

          return (
            <div className="bg-white rounded-2xl border border-slate-200/80 card-shadow overflow-hidden animate-fadeIn">
              <div className="p-6 border-b border-slate-100 bg-emerald-50/40">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  Analisis Koefisien Material Aktual
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Menampilkan rasio pemakaian material per satuan volume progres yang dicatat di lapangan. Sangat berguna untuk Bottom-Up Costing.
                </p>
              </div>
              <div className="p-6">
                {coefficientData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                    {coefficientData.map((data, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white">
                        <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0">
                          <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{data.phase}</h4>
                          <div className="mt-3 flex items-center justify-between">
                            {(() => {
                              const targetItems = target_material_items.filter(i => (i.phase || 'Umum') === data.phase);
                              const targetVol = targetItems.length > 0 && targetItems[0].work_volume ? Number(targetItems[0].work_volume) : 0;
                              const pct = targetVol > 0 ? Math.round((data.totalVolume / targetVol) * 100) : null;
                              
                              let badgeColor = 'text-emerald-800 bg-emerald-100/70 border-emerald-200';
                              let dividerColor = 'text-emerald-300';
                              let pctColor = '';
                              let barColor = 'bg-emerald-400';
                              
                              if (pct === 100) {
                                pctColor = 'text-emerald-700 font-black';
                                barColor = 'bg-emerald-500';
                              } else if (pct > 100) {
                                badgeColor = 'text-rose-800 bg-rose-100/70 border-rose-200';
                                dividerColor = 'text-rose-300';
                                pctColor = 'text-rose-700 font-black';
                                barColor = 'bg-rose-500';
                              }

                              return (
                                <div className="flex flex-col gap-1.5">
                                  <div className={`flex items-center gap-2 text-[11px] font-bold w-fit px-2.5 py-1 rounded-md border shadow-sm ${badgeColor}`}>
                                    <span>Progres: {data.totalVolume} {data.unit || 'satuan'}</span>
                                    {pct !== null && (
                                      <>
                                        <span className={dividerColor}>|</span>
                                        <span className={pctColor}>{pct}%</span>
                                      </>
                                    )}
                                  </div>
                                  {pct !== null && (
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }}></div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                            <button 
                              onClick={() => toggleCoeffDetail(data.phase)}
                              className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition shadow-sm"
                            >
                              {expandedCoeffs[data.phase] ? 'Tutup Detail' : 'Lihat Detail Progres'}
                            </button>
                          </div>
                        </div>
                        <div className="p-0 flex-1">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase">
                              <tr>
                                <th className="px-4 py-2">Material</th>
                                <th className="px-4 py-2 text-right">Pemakaian</th>
                                <th className="px-4 py-2 text-right">Koef/Satuan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {data.coeffs.map((mat, i) => (
                                <tr key={i} className="hover:bg-slate-50/60 transition">
                                  <td className="px-4 py-3 font-semibold text-slate-700">{mat.name}</td>
                                  <td className="px-4 py-3 text-right font-medium text-slate-600">{Number(mat.qty.toFixed(2))} {mat.unit}</td>
                                  <td className="px-4 py-3 text-right font-black text-emerald-600">{Number((mat.coeff).toFixed(2))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {expandedCoeffs[data.phase] && (() => {
                          const targetItems = target_material_items.filter(i => (i.phase || 'Umum') === data.phase);
                          const targetVol = targetItems.length > 0 && targetItems[0].work_volume ? Number(targetItems[0].work_volume) : 0;
                          return (
                            <div className="bg-slate-50 p-4 border-t border-slate-200 animate-fadeIn shrink-0">
                              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Riwayat Log Progres</h5>
                              <div className="space-y-3">
                                {data.volumeList.map((entry, eIdx) => {
                                  const entryPct = targetVol > 0 ? Math.round((entry.volume / targetVol) * 100) : null;
                                  return (
                                    <div key={eIdx} className="text-xs p-3 rounded-lg bg-white border border-slate-200 shadow-sm">
                                      <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-bold">
                                          {new Date(entry.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        <div className="font-black text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1.5">
                                          <span>+{entry.volume} {entry.unit}</span>
                                          {entryPct !== null && (
                                            <>
                                              <span className="text-emerald-300 font-normal">|</span>
                                              <span className="text-emerald-700">+{entryPct}%</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase border-b border-slate-50 pb-1 mb-1 px-1">
                                      <span>Material</span>
                                      <div className="flex items-center gap-4">
                                        <span className="w-20 text-right">Pakai</span>
                                        <span className="w-16 text-right">Koef</span>
                                      </div>
                                    </div>
                                    {entry.mats.map((m, mIdx) => (
                                      <div key={mIdx} className="flex justify-between items-center text-slate-600 px-1 py-0.5 hover:bg-slate-50 rounded">
                                        <span className="truncate pr-2 font-medium">{m.name}</span>
                                        <div className="flex items-center gap-4 shrink-0">
                                          <span className="text-right w-20">{Number(m.qty.toFixed(2))} {m.unit}</span>
                                          <span className="font-black text-emerald-600 text-right w-16">
                                            {entry.volume > 0 ? Number((m.qty / entry.volume).toFixed(2)) : '-'}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-700">Belum Ada Data Koefisien</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Untuk melihat koefisien, Anda harus mengisi kolom <strong>Volume Progres</strong> saat mencatat pemakaian material lapangan.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {activeTab === 'materials' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-fadeIn">
          {/* Left: Target Material RAB */}
          <div className="bg-white rounded-2xl border border-slate-200/80 card-shadow overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Anggaran Target Material (RAB)</h3>
                <p className="text-xs text-slate-500">Disalin dari template {house.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border shadow-xs">
                  {formatRupiah(summary.target_material_budget)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase">
                    <th className="py-3 px-4">Nama Material / Item</th>
                    <th className="py-3 px-4">Kebutuhan</th>
                    <th className="py-3 px-4 text-right">Harga Est.</th>
                    <th className="py-3 px-4 text-right">Total Budget</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {target_material_items.length > 0 ? (
                    Object.entries(
                      target_material_items.reduce((acc, item) => {
                        const phase = item.phase || 'Umum';
                        if (!acc[phase]) acc[phase] = [];
                        acc[phase].push(item);
                        return acc;
                      }, {})
                    ).map(([phase, phaseItems]) => (
                      <React.Fragment key={phase}>
                        <tr className="bg-blue-50/80 border-y border-blue-100/50">
                          <td colSpan="4" className="py-3.5 px-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                                <span className="font-black text-blue-900 text-xs uppercase tracking-[0.15em]">
                                  {phase} {phaseItems[0].work_volume && phaseItems[0].work_unit ? `(${Number(phaseItems[0].work_volume)} ${phaseItems[0].work_unit})` : ''}
                                </span>
                              </div>
                              {(() => {
                                const targetVol = phaseItems[0].work_volume ? Number(phaseItems[0].work_volume) : 0;
                                if (targetVol > 0) {
                                  const phaseLogsMap = {};
                                  (usage_logs || []).filter(l => (l.phase || 'Umum') === phase && Number(l.work_volume) > 0).forEach(l => {
                                    phaseLogsMap[l.created_at] = Number(l.work_volume);
                                  });
                                  const actualVol = Object.values(phaseLogsMap).reduce((a, b) => a + b, 0);
                                  const pct = Math.round((actualVol / targetVol) * 100);
                                  const barPct = Math.min(100, pct);
                                  
                                  let textColor = 'text-blue-700';
                                  let barColor = 'bg-linear-to-r from-blue-500 to-indigo-500';
                                  if (pct === 100) {
                                    textColor = 'text-emerald-600';
                                    barColor = 'bg-emerald-500';
                                  } else if (pct > 100) {
                                    textColor = 'text-rose-600';
                                    barColor = 'bg-rose-500';
                                  }

                                  return (
                                    <div className="flex items-center gap-3">
                                      <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Progres Fisik</span>
                                        <span className={`text-xs font-black ${textColor}`}>
                                          {pct}% <span className="font-medium text-slate-400">({actualVol}/{targetVol})</span>
                                        </span>
                                      </div>
                                      <div className="w-24 sm:w-32 h-2.5 bg-white border border-slate-200 rounded-full overflow-hidden shadow-inner">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-1000 ${barColor}`} 
                                          style={{ width: `${barPct}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </td>
                        </tr>
                        {phaseItems.sort((a,b) => a.name.localeCompare(b.name)).map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-bold text-slate-800">
                              {item.name} {item.material_code && <span className="text-slate-400 font-normal">({item.material_code})</span>}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-600">
                              {Number(item.quantity)} {item.unit}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600 font-medium">
                              {formatRupiah(item.estimated_price)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900">
                              {formatRupiah(item.total_price)}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        Belum ada item target material dari template.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Actual Material Arrived */}
          <div className="bg-white rounded-2xl border border-slate-200/80 card-shadow overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-blue-50/40 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Material Terkirim (Sampai di Unit)</h3>
                <p className="text-xs text-slate-500">Akumulasi net material dari nota, mutasi gudang, & transfer antar-blok</p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-white px-3 py-1 rounded-lg border border-blue-200">
                {formatRupiah(summary.actual_material_cost)}
              </span>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase">
                    <th className="py-3 px-4">Nama Material</th>
                    <th className="py-3 px-4">Total Terkirim</th>
                    <th className="py-3 px-4 text-right">Harga Rata-rata / Satuan</th>
                    <th className="py-3 px-4 text-right">Total Biaya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {actual_materials.length > 0 ? (
                    actual_materials.slice().sort((a,b) => a.material_name.localeCompare(b.material_name)).map((mat) => {
                      const avgPrice = Number(mat.net_quantity) > 0 ? Number(mat.net_cost) / Number(mat.net_quantity) : 0;
                      return (
                        <tr key={mat.material_id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {mat.material_name} <span className="text-slate-400 font-normal">({mat.material_code})</span>
                          </td>
                          <td className="py-3 px-4 font-bold text-blue-600">
                            {Number(mat.net_quantity).toLocaleString('id-ID')} {mat.unit}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 font-medium">
                            {formatRupiah(avgPrice)}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                            {formatRupiah(mat.net_cost)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        Belum ada material yang dikirim atau dibeli untuk unit ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LABOR BORONGAN CONTRACTS & TERMIN PAYMENTS */}
      {activeTab === 'labor' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Kontrak & Upah Borongan</h3>
              <p className="text-xs text-slate-500">Daftar kesepakatan borongan dengan Kepala Tukang/Mandor pada blok ini</p>
            </div>
            <Link
              href="/borongan"
              className="px-4 py-2 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Kelola Kontrak Borongan</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 card-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-6">Pekerjaan / Kontrak</th>
                    <th className="py-3.5 px-6">Kepala Tukang</th>
                    <th className="py-3.5 px-6 text-right">Nilai Kontrak</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {labor_contracts.length > 0 ? (
                    labor_contracts.map((c) => {
                      const rem = Number(c.contract_value) - Number(c.total_paid);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/60">
                          <td className="py-4 px-6 font-bold text-slate-900">
                            {c.work_name}
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-700">
                            {c.kepala_tukang_name}
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-slate-800">
                            {formatRupiah(c.contract_value)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold whitespace-nowrap">
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                        Belum ada kontrak borongan tenaga kerja untuk unit rumah ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Export to RAB Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Save className="w-5 h-5 text-emerald-600" />
                <span>Konversi ke Template RAB</span>
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <form onSubmit={handleExportRAB} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium leading-relaxed">
                Konversi seluruh pemakaian material lapangan & kontrak tenaga kerja dari rumah ini menjadi Template RAB baru. Sangat cocok untuk Bottom-Up Costing / As-Built Budgeting dari Rumah Contoh.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Template Baru <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: RAB Aktual Blok 01..."
                  value={exportTemplateName}
                  onChange={(e) => setExportTemplateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={exporting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {exporting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Buat Template</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
