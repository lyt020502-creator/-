import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ToastState } from '../types';

interface ToastProps {
  state: ToastState;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ state, onClose }) => {
  useEffect(() => {
    if (state.show) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.show, onClose]);

  if (!state.show) return null;

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all transform translate-y-0 opacity-100 ${colors[state.type]}`}>
      {icons[state.type]}
      <span className="font-medium text-sm">{state.message}</span>
    </div>
  );
};