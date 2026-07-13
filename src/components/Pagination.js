'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems <= 0) return null;

  // Generate page number array with simple window logic
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50/90 border-t border-slate-200/80 text-xs text-slate-600 print:hidden select-none">
      {/* Left Info & Items Per Page Dropdown */}
      <div className="flex items-center gap-3">
        <span className="font-medium text-slate-700">
          Menampilkan <strong className="font-bold text-slate-900">{startItem}</strong> - <strong className="font-bold text-slate-900">{endItem}</strong> dari <strong className="font-bold text-slate-900">{totalItems.toLocaleString('id-ID')}</strong> data
        </span>
        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 border-l border-slate-300 pl-3">
            <span className="text-slate-500">Baris:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      {/* Right Page Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center text-slate-700"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers()[0] > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  currentPage === 1
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                1
              </button>
              {getPageNumbers()[0] > 2 && <span className="px-1 text-slate-400">...</span>}
            </>
          )}

          {getPageNumbers().map((num) => (
            <button
              key={num}
              onClick={() => onPageChange(num)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                currentPage === num
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {num}
            </button>
          ))}

          {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
            <>
              {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && <span className="px-1 text-slate-400">...</span>}
              <button
                onClick={() => onPageChange(totalPages)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  currentPage === totalPages
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center text-slate-700"
            title="Halaman Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
