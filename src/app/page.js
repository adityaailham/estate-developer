'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Home, 
  Boxes, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRight,
  Plus, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Gagal memuat data dashboard');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi saat memuat dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(number || 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Memuat data real-time dari database CCMS...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
        <div>
          <h3 className="font-bold">Gagal Memuat Dashboard</h3>
          <p className="text-sm">{error}</p>
        </div>
        <button 
          onClick={fetchDashboard}
          className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { overview, financials, house_statuses, recent_mutations, low_stock_alerts } = data;

  const stats = {
    total_projects: overview?.total_projects || 0,
    total_houses: overview?.total_houses || 0,
    houses_in_progress: overview?.active_houses || 0,
    houses_completed: overview?.completed_houses || 0,
    warehouse_total_value: financials?.warehouse_inventory_value || 0,
    total_material_cost: financials?.total_actual_material_cost || 0,
    total_labor_cost: financials?.total_actual_labor_cost || 0
  };

  // Format chart data
  const chartData = (house_statuses || []).map(item => ({
    name: item.status || 'Belum Mulai',
    value: Number(item.count)
  }));

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Banner Alert if Low Stock exists */}
      {low_stock_alerts && low_stock_alerts.length > 0 && (
        <div className="p-5 rounded-2xl bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Peringatan Stok Gudang Utama</span>
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-extrabold">{low_stock_alerts.length} Item Kritis</span>
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Beberapa material di Gudang Global berada di bawah batas minimum pemesanan. Segera lakukan pemesanan ulang ke supplier.
              </p>
            </div>
          </div>
          <Link
            href="/materials"
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition shrink-0 flex items-center gap-1.5"
          >
            <span>Cek Stok Gudang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Proyek */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow hover-lift flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kawasan Proyek</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats?.total_projects || 0} <span className="text-sm font-semibold text-slate-400">Lokasi</span></h3>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-semibold text-emerald-600">Aktif Pembangunan</span>
            </p>
          </div>
        </div>

        {/* Card 2: Total Unit Rumah */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow hover-lift flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Unit Rumah</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats?.total_houses || 0} <span className="text-sm font-semibold text-slate-400">Unit</span></h3>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">{stats?.houses_in_progress || 0} Aktif</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">{stats?.houses_completed || 0} Selesai</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Nilai Inventaris Gudang Global */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow hover-lift flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aset Gudang Global</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{formatRupiah(stats?.warehouse_total_value)}</h3>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Valuasi FIFO Aktual</span>
            </p>
          </div>
        </div>

        {/* Card 4: Total Realisasi Pengeluaran */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow hover-lift flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Realisasi Biaya</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-purple-700 tracking-tight">{formatRupiah(Number(stats?.total_material_cost) + Number(stats?.total_labor_cost))}</h3>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Mat: {formatRupiah(stats?.total_material_cost)} | Upah: {formatRupiah(stats?.total_labor_cost)}
            </p>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Unit Status Distribution Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 card-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Distribusi Status Pembangunan Unit</h3>
                <p className="text-xs text-slate-500 mt-0.5">Siklus konstruksi dari pondasi hingga serah terima</p>
              </div>
              <Link href="/houses" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <span>Lihat Semua Unit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {chartData.length > 0 ? (
              <div className="h-64 mt-4 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} Unit`, 'Jumlah']}
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', color: '#fff', border: 'none' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 mt-4 flex flex-col items-center justify-center text-slate-400 gap-2 border-2 border-dashed border-slate-100 rounded-2xl">
                <Home className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-semibold">Belum ada data unit rumah untuk ditampilkan di grafik</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Financial Snapshot & Quick Links */}
        <div className="bg-linear-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold tracking-wider uppercase">
              <Wallet className="w-4 h-4" />
              <span>Ringkasan Anggaran RAB</span>
            </div>
            <h3 className="text-xl font-bold mt-1 text-white">Target RAB vs Realisasi</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Pemantauan kesehatan biaya seluruh unit rumah secara agregat dari salinan template RAB.
            </p>

            <div className="mt-6 space-y-4">
              <div className="bg-white/10 p-3.5 rounded-xl backdrop-blur-sm border border-white/10">
                <p className="text-[11px] text-slate-300 uppercase font-semibold">Total Target Anggaran RAB</p>
                <p className="text-lg font-extrabold text-emerald-400 mt-0.5">{formatRupiah(financials.total_target_rab)}</p>
              </div>

              <div className="bg-white/10 p-3.5 rounded-xl backdrop-blur-sm border border-white/10">
                <p className="text-[11px] text-slate-300 uppercase font-semibold">Total Pengeluaran Aktual</p>
                <p className="text-lg font-extrabold text-blue-300 mt-0.5">{formatRupiah(financials.total_actual_cost)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-2.5">
            <Link
              href="/houses"
              className="px-3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-center text-xs font-bold transition-all shadow-md"
            >
              Cek Cost Sheet
            </Link>
            <Link
              href="/mutations"
              className="px-3 py-2.5 bg-white/15 hover:bg-white/20 text-white rounded-xl text-center text-xs font-bold transition-all border border-white/10"
            >
              Catat Mutasi
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Material Mutations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 card-shadow overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Aktivitas Mutasi Material Terbaru</h3>
            <p className="text-xs text-slate-500">Log transaksi masuk, keluar, retur, dan kirim langsung ke unit rumah</p>
          </div>
          <Link href="/mutations" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <span>Lihat Semua Log</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Tanggal</th>
                <th className="py-3.5 px-6">Tipe Mutasi</th>
                <th className="py-3.5 px-6">Material</th>
                <th className="py-3.5 px-6">Jumlah</th>
                <th className="py-3.5 px-6">Tujuan / Asal</th>
                <th className="py-3.5 px-6 text-right">Harga / Unit</th>
                <th className="py-3.5 px-6 text-right">Total Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {(recent_mutations || []).length > 0 ? (
                recent_mutations.map((mut) => {
                  let badgeStyle = 'bg-slate-100 text-slate-700';
                  let directionText = '-';

                  if (mut.type === 'Beli-Gudang') {
                    badgeStyle = 'bg-emerald-100 text-emerald-800 font-semibold';
                    directionText = 'Masuk Gudang Utama';
                  } else if (mut.type === 'Beli-Rumah') {
                    badgeStyle = 'bg-purple-100 text-purple-800 font-semibold';
                    directionText = `Langsung ke Blok ${mut.dest_block || 'Unit'}`;
                  } else if (mut.type === 'Keluar-Rumah') {
                    badgeStyle = 'bg-blue-100 text-blue-800 font-semibold';
                    directionText = `Gudang -> Blok ${mut.dest_block || 'Unit'}`;
                  } else if (mut.type === 'Retur-Gudang') {
                    badgeStyle = 'bg-amber-100 text-amber-800 font-semibold';
                    directionText = `Blok ${mut.source_block || 'Unit'} -> Gudang`;
                  } else if (mut.type === 'Pindah-Rumah') {
                    badgeStyle = 'bg-indigo-100 text-indigo-800 font-semibold';
                    directionText = `Blok ${mut.source_block} -> Blok ${mut.dest_block}`;
                  }

                  const totalCost = Number(mut.quantity) * Number(mut.price_unit);

                  return (
                    <tr key={mut.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-slate-600 text-xs whitespace-nowrap">
                        {new Date(mut.mutation_date).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs ${badgeStyle}`}>
                          {mut.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-900 whitespace-nowrap">
                        {mut.material_name} <span className="text-slate-400 font-normal text-xs">({mut.material_code})</span>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-800 whitespace-nowrap">
                        {Number(mut.quantity).toLocaleString('id-ID')} {mut.unit}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 text-xs font-medium whitespace-nowrap">
                        {directionText}
                      </td>
                      <td className="py-3.5 px-6 text-right font-medium text-slate-600 whitespace-nowrap">
                        {formatRupiah(mut.price_unit)}
                      </td>
                      <td className="py-3.5 px-6 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(totalCost)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                    Belum ada riwayat mutasi material tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
