'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  Home, 
  Boxes, 
  ShoppingCart, 
  ArrowRightLeft, 
  Users2, 
  FileText, 
  Truck, 
  HardHat,
  ShieldCheck,
  ChevronRight,
  BookOpen
} from 'lucide-react';

const navItems = [
  {
    title: 'MENU UTAMA',
    items: [
      { name: 'Dashboard Eksekutif', href: '/', icon: LayoutDashboard },
      { name: 'Proyek Perumahan', href: '/projects', icon: Building2 },
      { name: 'Unit & Cost Sheet', href: '/houses', icon: Home },
    ]
  },
  {
    title: 'LOGISTIK & TRANSAKSI',
    items: [
      { name: 'Stok Gudang & Material', href: '/materials', icon: Boxes },
      { name: 'Pembelian & Bypass', href: '/purchases', icon: ShoppingCart },
      { name: 'Mutasi Material (FIFO)', href: '/mutations', icon: ArrowRightLeft },
    ]
  },
  {
    title: 'TENAGA KERJA & UPAH',
    items: [
      { name: 'Kontrak Borongan', href: '/borongan', icon: Users2 },
    ]
  },
  {
    title: 'MASTER DATA & TEMPLATE',
    items: [
      { name: 'Template RAB Tipe', href: '/rab-templates', icon: FileText },
      { name: 'Daftar Supplier', href: '/suppliers', icon: Truck },
      { name: 'Daftar Kepala Tukang', href: '/kepala-tukang', icon: HardHat },
      { name: 'Buku Panduan Manual', href: '/panduan', icon: BookOpen },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 shrink-0 select-none shadow-2xl z-40 print:hidden">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3 shrink-0">
        <div className="w-11 h-11 rounded-xl bg-white/10 p-0.5 overflow-hidden flex items-center justify-center shrink-0 border border-slate-700/80 shadow-md">
          <Image
            src="/gambar.jpg"
            alt="Logo Perusahaan"
            width={44}
            height={44}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wide text-lg leading-tight">ESTATE CCMS</h1>
          <p className="text-xs text-blue-400 font-medium">Cost Control & Monitor</p>
        </div>
      </div>

      {/* Navigation List (Flex-1 & Hidden Scrollbar for Perfect Symmetry) */}
      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-6 [scrollba:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((group, idx) => (
          <div key={idx} className="space-y-1.5">
            <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              {group.title}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-linear-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-md shadow-blue-500/20 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-blue-200" />}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Subtle Bottom Bar (To Balance Layout Symmetry) */}
      <div className="p-4 border-t border-slate-800/80 shrink-0">
        <div className="px-3.5 py-2.5 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-300">Sistem Aktif</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-bold">v1.0</span>
        </div>
      </div>
    </aside>
  );
}
