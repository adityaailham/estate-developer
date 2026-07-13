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
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Wallet, 
  FileText, 
  Loader2, 
  PlusCircle, 
  RefreshCw,
  TrendingDown
} from 'lucide-react';

export default function HouseCostSheetPage({ params }) {
  const unwrappedParams = use(params);
  const houseId = unwrappedParams.id;
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'labor' | 'mutations'

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

  const { house, summary, target_material_items, target_labor_items, actual_materials, labor_contracts, recent_mutations } = data;

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
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Blok {house.block_number}
              </h1>
              <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                {house.type}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border shadow-sm flex items-center gap-1.5 ${healthStyle}`}>
                <HealthIcon className="w-3.5 h-3.5" />
                <span>{summary.health_status}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 font-medium">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span>{house.project_name}</span>
              <span>•</span>
              <span>Status: <strong className="text-slate-800">{house.status}</strong></span>
              <span>•</span>
              <span>Harga Jual: <strong className="text-emerald-700">{formatRupiah(house.selling_price)}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={fetchCostSheet}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1 text-xs font-bold"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href={`/purchases`}
            className="flex-1 md:flex-none px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nota Bypass ke Blok {house.block_number}</span>
          </Link>
        </div>
      </div>

      {/* 3 Executive Cost Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Target RAB */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Anggaran RAB</span>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900">{formatRupiah(summary.target_total_budget)}</h3>
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">Target Material:</span>
                <span className="font-bold text-slate-700">{formatRupiah(summary.target_material_budget)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Target Upah:</span>
                <span className="font-bold text-slate-700">{formatRupiah(summary.target_labor_budget)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Aktual Realisasi */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aktual Realisasi Biaya</span>
            <Wallet className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-extrabold text-slate-900">{formatRupiah(summary.actual_total_cost)}</h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${summary.actual_total_cost > summary.target_total_budget ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                {percentageUsed}% terpakai
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block">Aktual Material:</span>
                <span className="font-bold text-blue-600">{formatRupiah(summary.actual_material_cost)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Aktual Upah:</span>
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
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
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
          onClick={() => setActiveTab('mutations')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'mutations'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Log Riwayat Mutasi Lapangan ({recent_mutations.length})</span>
        </button>
      </div>

      {/* TAB 1: MATERIALS BREAKDOWN (TARGET vs ACTUAL) */}
      {activeTab === 'materials' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
          {/* Left: Target Material RAB */}
          <div className="bg-white rounded-2xl border border-slate-200/80 card-shadow overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Anggaran Target Material (RAB)</h3>
                <p className="text-xs text-slate-500">Disalin otomatis dari template {house.type}</p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-lg border">
                {formatRupiah(summary.target_material_budget)}
              </span>
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
                    target_material_items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {item.name} {item.material_code && <span className="text-slate-400 font-normal">({item.material_code})</span>}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 font-medium">
                          {formatRupiah(item.estimated_price)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatRupiah(item.total_price)}
                        </td>
                      </tr>
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

          {/* Right: Actual Material Used */}
          <div className="bg-white rounded-2xl border border-slate-200/80 card-shadow overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-blue-50/40 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Aktual Pemakaian Material (FIFO + Bypass)</h3>
                <p className="text-xs text-slate-500">Akumulasi net dari nota pembelian & mutasi keluar gudang</p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-white px-3 py-1 rounded-lg border border-blue-200">
                {formatRupiah(summary.actual_material_cost)}
              </span>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase">
                    <th className="py-3 px-4">Material Aktual</th>
                    <th className="py-3 px-4">Net Qty Terpakai</th>
                    <th className="py-3 px-4 text-right">Rata-rata / Unit</th>
                    <th className="py-3 px-4 text-right">Total Aktual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {actual_materials.length > 0 ? (
                    actual_materials.map((mat) => {
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
              <h3 className="font-bold text-slate-900 text-base">Kontrak & Termin Upah Borongan</h3>
              <p className="text-xs text-slate-500">Daftar kesepakatan borongan dengan Kepala Tukang/Mandor pada blok ini</p>
            </div>
            <Link
              href="/borongan"
              className="px-4 py-2 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Kontrak Borongan / Bayar Termin</span>
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
                    <th className="py-3.5 px-6 text-right">Terbayar (Termin)</th>
                    <th className="py-3.5 px-6 text-right">Sisa Utang</th>
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
                          <td className="py-4 px-6 text-right font-bold text-purple-600">
                            {formatRupiah(c.total_paid)}
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-red-600">
                            {formatRupiah(rem)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
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

      {/* TAB 3: RECENT MUTATIONS HISTORY FOR THIS HOUSE */}
      {activeTab === 'mutations' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 card-shadow overflow-hidden animate-fadeIn">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Riwayat Transaksi Mutasi ke Blok {house.block_number}</h3>
              <p className="text-xs text-slate-500">Semua nota pembelian langsung (bypass) dan pengeluaran barang gudang (FIFO)</p>
            </div>
            <Link href="/mutations" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              Kelola Mutasi Lapangan →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Tanggal</th>
                  <th className="py-3.5 px-6">Tipe Mutasi</th>
                  <th className="py-3.5 px-6">Material</th>
                  <th className="py-3.5 px-6">Jumlah</th>
                  <th className="py-3.5 px-6 text-right">Harga Satuan</th>
                  <th className="py-3.5 px-6 text-right">Total Biaya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recent_mutations.length > 0 ? (
                  recent_mutations.map((mut) => {
                    let badgeStyle = 'bg-blue-100 text-blue-800';
                    if (mut.type === 'Beli-Rumah') badgeStyle = 'bg-purple-100 text-purple-800';
                    if (mut.type === 'Retur-Gudang') badgeStyle = 'bg-amber-100 text-amber-800';

                    const totalCost = Number(mut.quantity) * Number(mut.price_unit);

                    return (
                      <tr key={mut.id} className="hover:bg-slate-50/60">
                        <td className="py-3.5 px-6 font-medium text-slate-600 text-xs">
                          {new Date(mut.mutation_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${badgeStyle}`}>
                            {mut.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-bold text-slate-900">
                          {mut.material_name} <span className="text-slate-400 font-normal text-xs">({mut.material_code})</span>
                        </td>
                        <td className="py-3.5 px-6 font-semibold text-slate-800">
                          {Number(mut.quantity).toLocaleString('id-ID')} {mut.unit}
                        </td>
                        <td className="py-3.5 px-6 text-right font-medium text-slate-600">
                          {formatRupiah(mut.price_unit)}
                        </td>
                        <td className="py-3.5 px-6 text-right font-extrabold text-slate-900">
                          {formatRupiah(totalCost)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                      Belum ada transaksi mutasi yang tercatat untuk unit ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
