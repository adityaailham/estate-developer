'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Printer, Shield, Compass, Sparkles, HelpCircle } from 'lucide-react';

export default function PanduanPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-fadeIn print:p-0 print:max-w-full print:bg-white print:my-0">
      {/* Action Bar (Print / Save to PDF Button) */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-md print:hidden">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="font-extrabold text-slate-900 text-sm">PANDUAN DIGITAL PENGGUNA</h1>
            <p className="text-xs text-slate-500">Simpan panduan ini ke format PDF berkualitas cetak korporasi.</p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          <span>Simpan Sebagai PDF / Cetak</span>
        </button>
      </div>

      {/* Corporate PDF Book Layout */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-12 shadow-xl print:shadow-none print:border-none print:p-0">
        
        {/* Book Header / Kop */}
        <div className="border-b-4 border-slate-900 pb-6 mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">CCMS ESTATE DEVELOPER</h1>
            <p className="text-sm font-semibold text-blue-600 mt-1 tracking-wider">BUKU PANDUAN MANUAL PENGGUNA (OWNER & OPERASIONAL)</p>
          </div>
          <div className="text-right text-xs text-slate-500 font-medium print:block">
            <p>Versi Dokumen: 1.0 (Official)</p>
            <p className="mt-0.5">Tanggal Update: {isMounted ? new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '11 Juli 2026'}</p>
          </div>
        </div>

        {/* Section 1 */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
            <h2 className="text-xl font-bold text-slate-900 uppercase">1. Deskripsi Umum & Tujuan Aplikasi</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed text-justify">
            CCMS (Cost Control & Monitoring System) Estate Developer adalah aplikasi terintegrasi untuk mengendalikan biaya pembangunan perumahan dari target perencanaan (RAB Target) hingga realisasi aktual di lapangan. Aplikasi ini mencegah pembengkakan biaya (over-budget) melalui pelacakan material otomatis, perhitungan upah borongan mandor, dan pembekuan biaya otomatis jika unit rumah telah selesai dibangun.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Keunggulan Utama
              </h3>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>Real-time Cost Sheet Unit Rumah</li>
                <li>Kontrol Anggaran RAB Target vs Aktual</li>
                <li>Perhitungan Harga Pokok Material Akurat (FIFO)</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1.5 mb-2">
                <Shield className="w-4 h-4 text-emerald-600" /> Proteksi Finansial
              </h3>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>Cost Freeze otomatis pada status Selesai</li>
                <li>Pemberitahuan stok minimum gudang</li>
                <li>Audit log perubahan transaksi material</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-6 mt-10">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Compass className="w-5 h-5 text-blue-600 shrink-0" />
            <h2 className="text-xl font-bold text-slate-900 uppercase">2. Konsep & Logika Utama Sistem</h2>
          </div>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-600 pl-4 py-1">
              <h3 className="font-bold text-slate-900 text-sm">A. Penilaian Harga Pokok Pengeluaran (FIFO)</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed text-justify">
                Setiap material yang keluar dari gudang dinilai berdasarkan harga beli riil batch tertua yang masuk pertama kali. Ini memastikan nilai HPP realisasi unit rumah mencerminkan kondisi fluktuasi harga bahan bangunan yang sebenarnya di lapangan.
              </p>
            </div>
            <div className="border-l-4 border-blue-600 pl-4 py-1">
              <h3 className="font-bold text-slate-900 text-sm">B. Alur Pembelian & Opsi Bypass (Beli-Rumah)</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed text-justify">
                Admin dapat memilih menyimpan material baru di Gudang Utama atau langsung melakukan bypass pengalokasian material dari supplier langsung diturunkan di unit rumah tertentu. Biaya bypass langsung dibebankan ke unit tujuan saat nota dicatat.
              </p>
            </div>
            <div className="border-l-4 border-blue-600 pl-4 py-1">
              <h3 className="font-bold text-slate-900 text-sm">C. Logika Cost Freeze (Pembekuan Anggaran)</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed text-justify">
                Begitu rumah diubah statusnya menjadi "Selesai" atau "Serah Terima", seluruh data transaksi alokasi material, pembelian bypass, maupun upah borongan untuk rumah tersebut otomatis dikunci dan dibekukan. Tindakan penghapusan atau penambahan transaksi pada unit terkunci akan ditolak sistem demi keamanan proses audit.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="space-y-6 mt-10">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
            <h2 className="text-xl font-bold text-slate-900 uppercase">3. Panduan Operasional Operasi Harian</h2>
          </div>
          <table className="w-full text-xs text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                <th className="p-3 border border-slate-200">Menu Halaman</th>
                <th className="p-3 border border-slate-200">Langkah Penggunaan & Tanggung Jawab</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              <tr>
                <td className="p-3 font-bold text-slate-800 border border-slate-200">1. Unit & Cost Sheet</td>
                <td className="p-3 border border-slate-200">Memulai proyek baru, mengubah status rumah (Pembangunan Aktif, Selesai, Serah Terima), memantau perbandingan Target RAB vs Realisasi Aktual dan HPP terkini secara real-time.</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-800 border border-slate-200">2. Template RAB Tipe</td>
                <td className="p-3 border border-slate-200">Mengisi template master target kebutuhan bahan bangunan per tipe rumah. Template ini akan otomatis terduplikasi ke rumah baru agar admin tidak perlu input manual berulang kali.</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-800 border border-slate-200">3. Pembelian & Bypass</td>
                <td className="p-3 border border-slate-200">Mendaftarkan nota beli supplier. Pilih material masuk ke gudang utama atau bypass ke unit proyek. Memasukkan jumlah, harga beli, dan mencocokkan total invoice fisik.</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-800 border border-slate-200">4. Mutasi Material (FIFO)</td>
                <td className="p-3 border border-slate-200">Mencatat material keluar gudang untuk pembangunan rumah, retur kelebihan material, transfer material antar unit rumah, dan koreksi opname fisik.</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-800 border border-slate-200">5. Kontrak Borongan</td>
                <td className="p-3 border border-slate-200">Menyepakati total upah borongan dengan Mandor, mencatat termin pembayaran, progres fisik, dan memantau sisa utang upah mandor secara otomatis.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 4 */}
        <div className="space-y-6 mt-10">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Printer className="w-5 h-5 text-blue-600 shrink-0" />
            <h2 className="text-xl font-bold text-slate-900 uppercase">4. Panduan Fitur Cetak Laporan</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Halaman **Mutasi Material (FIFO)** dan **Pembelian & Bypass** telah dilengkapi fitur penyaring rentang tanggal operasional. Ikuti langkah berikut untuk mencetak dokumen fisik atau menyimpan sebagai PDF:
          </p>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-2">
            <p className="font-bold">Langkah Cetak Laporan Keuangan:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Pilih filter material atau supplier tertentu jika diperlukan.</li>
              <li>Pilih tanggal mulai **(Dari)** dan tanggal berakhir **(s/d)** untuk membatasi periode laporan.</li>
              <li>Klik tombol hitam **"Cetak Laporan PDF"**.</li>
              <li>Pastikan setelan tujuan pencetakan Anda adalah **"Save as PDF"** atau pilih nama printer fisik Anda di dialog cetak browser.</li>
              <li>Klik **Save/Print** untuk menyelesaikan pencetakan.</li>
            </ol>
          </div>
        </div>

        {/* Section 5 */}
        <div className="space-y-6 mt-10">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />
            <h2 className="text-xl font-bold text-slate-900 uppercase">5. FAQ & Troubleshooting</h2>
          </div>
          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div>
              <p className="font-bold text-slate-900">Q: Kenapa ada error "Rumah berstatus Selesai/Serah Terima"?</p>
              <p className="mt-1">A: Data transaksi pada rumah tersebut telah dikunci karena sudah selesai dibangun. Ubah sementara status rumah ke "Pembangunan Aktif" pada menu Unit & Cost Sheet untuk melakukan edit/delete, lalu kembalikan ke status "Selesai" jika sudah diperbaiki.</p>
            </div>
            <div>
              <p className="font-bold text-slate-900">Q: Mengapa total HPP unit rumah di Cost Sheet berbeda dengan RAB awal?</p>
              <p className="mt-1">A: RAB awal adalah budget target/rencana. Cost Sheet menampilkan realisasi aktual berdasarkan pengeluaran riil material berharga FIFO dan upah termin borongan. Selisih negatif menunjukkan penghematan, selisih positif (merah) menandakan over-budget.</p>
            </div>
          </div>
        </div>

        {/* Corporate Sign-off Footer */}
        <div className="border-t border-slate-300 mt-12 pt-6 text-center text-[10px] text-slate-400">
          <p>Hak Cipta Terlindungi © 2026. Aplikasi CCMS Estate Developer - Sistem Pemantauan Anggaran Pembangunan.</p>
        </div>

      </div>
    </div>
  );
}
