'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check, X, Plus } from 'lucide-react';

export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  placeholder = '-- Pilih --',
  searchPlaceholder = 'Ketik untuk mencari...',
  className = '',
  required = false,
  disabled = false,
  allowCustom = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUpwards: false });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update position when open or scrolling/resizing
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 280; // approximate max height
    const openUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setCoords({
      top: openUpwards ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUpwards,
    });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      // Auto focus search box
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  // Filter options
  const filteredOptions = options.filter((opt) => {
    if (opt.value === '' || opt.value === null || opt.value === undefined) return false;
    const query = searchQuery.toLowerCase();
    const labelMatch = (opt.label || '').toString().toLowerCase().includes(query);
    const sublabelMatch = (opt.sublabel || '').toString().toLowerCase().includes(query);
    return labelMatch || sublabelMatch;
  });

  // Find currently selected option
  const selectedOption = options.find((opt) => String(opt.value) === String(value) && opt.value !== '')
    || (allowCustom && value ? { value: value, label: value } : undefined);

  const handleSelect = (opt) => {
    if (onChange) {
      onChange(opt.value, opt);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange('', null);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hidden input for HTML5 form validation if required */}
      {required && (
        <input
          type="text"
          value={value || ''}
          onChange={() => {}}
          required
          className="absolute opacity-0 pointer-events-none w-full h-full bottom-0 left-0"
          tabIndex={-1}
        />
      )}

      {/* Trigger Button */}
      <div
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer select-none min-h-[38px] ${
          disabled
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white shadow-xs'
            : 'border-slate-300 bg-white hover:border-slate-400 text-slate-800'
        }`}
      >
        <div className="flex-1 truncate">
          {selectedOption ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="truncate text-slate-900">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0 font-normal">
                  {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
              title="Hapus pilihan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
          />
        </div>
      </div>

      {/* Popover Dropdown Portal */}
      {isMounted && isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: coords.openUpwards ? 'auto' : `${coords.top}px`,
              bottom: coords.openUpwards ? `${window.innerHeight - coords.top}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
            onKeyDown={handleKeyDown}
            className="bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn max-h-72 flex flex-col"
          >
            {/* Search Input Box */}
            <div className="p-2 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none py-1"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Options List */}
            <div className="overflow-y-auto divide-y divide-slate-50 flex-1 p-1 max-h-56">
              {/* Option to clear / none if desired */}
              <div
                onClick={() => handleSelect({ value: '', label: placeholder })}
                className={`px-3 py-2 text-xs rounded-lg cursor-pointer transition flex items-center justify-between ${
                  value === '' || (selectedOption && selectedOption.value === '') || (!selectedOption && !searchQuery)
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span>-- Kosongkan / Belum Dipilih --</span>
                {(value === '' || (selectedOption && selectedOption.value === '') || (!selectedOption && !searchQuery)) && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </div>

              {/* Custom option when typing */}
              {allowCustom && searchQuery && (
                <div
                  onClick={() => handleSelect({ value: searchQuery, label: searchQuery })}
                  className="px-3 py-2 my-1 text-xs rounded-lg cursor-pointer transition flex items-center justify-between text-blue-700 bg-blue-50/50 hover:bg-blue-100 font-bold border border-blue-200/50"
                >
                  <span>Gunakan &quot;{searchQuery}&quot; (Baru)</span>
                  <Plus className="w-4 h-4 text-blue-600 shrink-0" />
                </div>
              )}

              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleSelect(opt)}
                      className={`px-3 py-2 text-xs rounded-lg cursor-pointer transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-slate-800 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex flex-col truncate">
                        <span className="truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className={`text-[10px] truncate ${isSelected ? 'text-blue-500 font-normal' : 'text-slate-400 font-normal'}`}>
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Tidak ada data yang cocok dengan &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
