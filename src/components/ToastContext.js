'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          let Icon = Info;
          let bg = 'bg-blue-50 border-blue-200 text-blue-800';
          let iconColor = 'text-blue-500';

          if (toast.type === 'success') {
            Icon = CheckCircle2;
            bg = 'bg-emerald-50 border-emerald-200 text-emerald-800';
            iconColor = 'text-emerald-500';
          } else if (toast.type === 'error') {
            Icon = XCircle;
            bg = 'bg-red-50 border-red-200 text-red-800';
            iconColor = 'text-red-500';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            bg = 'bg-amber-50 border-amber-200 text-amber-800';
            iconColor = 'text-amber-500';
          }

          return (
            <div 
              key={toast.id} 
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg shadow-black/5 pointer-events-auto transition-all duration-300 ease-out translate-y-0 opacity-100 max-w-sm ${bg}`}
              style={{ animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <p className="text-sm font-semibold flex-1 leading-snug">{toast.message}</p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="opacity-50 hover:opacity-100 transition shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes toastSlideIn {
          from {
            transform: translateY(100%) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
