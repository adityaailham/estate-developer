'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Calendar, 
  Bell, 
  PlusCircle, 
  ArrowUpRight, 
  Building, 
  Search,
  ArrowRightLeft
} from 'lucide-react';

const pageTitles = {
  '/': { title: 'Dashboard', subtitle: 'Monitoring Real-time Biaya & Progres Proyek' },
  '/projects': { title: 'Master Proyek Perumahan', subtitle: 'Daftar Proyek & Monitoring Status Blok Rumah' },
  '/houses': { title: 'Daftar Unit & Cost Sheet', subtitle: 'Kontrol Anggaran RAB Target vs Aktual Pengeluaran per Rumah' },
  '/materials': { title: 'Katalog Material & Stok', subtitle: 'Daftar Harga Satuan & Posisi Stok Gudang Terkini' },
  '/purchases': { title: 'Buku Pembelian & Bypass', subtitle: 'Pencatatan Faktur Supplier & Alokasi Tujuan Barang' },
  '/mutations': { title: 'Daftar Mutasi & Opname', subtitle: 'Pelacakan Arus Material Keluar, Retur, dan Pindah Blok' },
  '/suppliers': { title: 'Master Supplier', subtitle: 'Direktori Toko Bahan & Rekanan Kerja' },
  '/kepala-tukang': { title: 'Direktori Kepala Tukang', subtitle: 'Data Mandor / Pelaksana Borongan' },
  '/borongan': { title: 'Manajemen Borongan', subtitle: 'Daftar Kontrak Kerja & Pembayaran Upah per Unit' },
  '/rab-templates': { title: 'Master Template RAB', subtitle: 'Pola Standar Anggaran untuk Berbagai Tipe Rumah' },
  '/panduan': { title: 'Panduan & Dokumentasi Sistem', subtitle: 'Pusat Informasi Penggunaan Aplikasi & Logika Sistem' }
};

export default function TopNav() {
  const pathname = usePathname();
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('id-ID', options));
  }, []);

  // Determine current title
  let currentInfo = pageTitles[pathname];
  if (!currentInfo) {
    if (pathname.startsWith('/houses/')) {
      currentInfo = { title: 'Laporan Cost Sheet Unit Rumah', subtitle: 'Analisis Mendalam RAB Target vs Aktual Realisasi Biaya' };
    } else {
      currentInfo = { title: 'Estate CCMS Panel', subtitle: 'Cost Control & Monitoring System' };
    }
  }

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs print:hidden">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{currentInfo.title}</h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">{currentInfo.subtitle}</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Current Date Display */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 text-slate-600 text-xs font-medium border border-slate-200/60">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentDate || 'Memuat Waktu...'}</span>
        </div>

        {/* Quick Actions Dropdown / Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/purchases"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nota Beli</span>
          </Link>

          <Link
            href="/mutations"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-md shadow-slate-900/20 hover:bg-slate-800 transition-all duration-200 active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
            <span>Mutasi Keluar</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
