'use client';

import React, { useState } from 'react';
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
  BookOpen,
  Menu
} from 'lucide-react';

const navItems = [
  {
    title: 'MENU UTAMA',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const handleToggle = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_collapsed', newVal.toString());
    }
  };

  return (
    <aside className={`bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 shrink-0 select-none shadow-2xl z-40 print:hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Brand Header */}
      <div className={`flex items-center shrink-0 ${isCollapsed ? 'p-3 justify-center flex-col gap-4' : 'p-4 justify-between'}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? 'hidden' : 'flex'}`}>
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
            <p className="text-[10px] text-blue-400 font-medium">Cost Control & Monitor</p>
          </div>
        </div>
        
        <button 
          onClick={handleToggle}
          className={`p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors duration-200 ${isCollapsed ? 'mx-auto' : ''}`}
        ><Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List with Seamless Mask */}
      <div 
        className="flex-1 px-3 py-2 overflow-y-auto space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 16px, black calc(100% - 16px), transparent)' }}
      >
        {navItems.map((group, idx) => (
          <div key={idx} className="space-y-1.5 mt-4">
            <p className={`px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? 'opacity-0 max-h-0 overflow-hidden m-0 p-0' : 'opacity-100 max-h-10 mb-2'}`}>
              {group.title}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group ${
                    isActive
                      ? 'bg-linear-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-md shadow-blue-500/20 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  } ${isCollapsed ? 'justify-center' : 'justify-between'}`}
                >
                  <div className="flex items-center">
                    <Icon className={`w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                    <span className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden whitespace-nowrap ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>
                      {item.name}
                    </span>
                  </div>
                  {!isCollapsed && isActive && <ChevronRight className="w-4 h-4 text-blue-200 shrink-0" />}
                  
                  {/* Tooltip on Hover (Only when collapsed) */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
        {/* Extra padding at bottom to prevent cutoff by mask */}
        <div className="h-4"></div>
      </div>

      {/* User Profile (Bottom Bar - Seamless) */}
      <div className={`${isCollapsed ? 'p-3' : 'p-4'} shrink-0`}>
        <div className={`flex items-center px-3 py-2.5 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-xs shadow-blue-500/20">
            AD
          </div>
          <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0' : 'flex-1 min-w-0'}`}>
            <h4 className="text-sm font-bold text-slate-200 truncate">Admin Utama</h4>
          </div>
        </div>
      </div>
    </aside>
  );
}
