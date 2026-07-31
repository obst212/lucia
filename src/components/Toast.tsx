import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  const getTypeStyle = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return 'bg-slate-900 border-emerald-500/50 text-white';
      case 'warning':
        return 'bg-slate-900 border-amber-500/50 text-white';
      case 'error':
        return 'bg-slate-900 border-rose-500/50 text-white';
      case 'info':
      default:
        return 'bg-slate-900 border-blue-500/50 text-white';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-4 rounded-xl border shadow-2xl flex items-start justify-between space-x-3 transition-all duration-300 animate-in slide-in-from-bottom-3 ${getTypeStyle(
            t.type
          )}`}
        >
          <div className="flex items-start space-x-3">
            {getIcon(t.type)}
            <div>
              <h4 className="font-bold text-sm text-white">{t.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{t.message}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
