/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lock, X, AlertCircle, ShieldCheck } from 'lucide-react';

interface SupervisorPinModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  onSuccess: (pin: string) => void;
  onClose: () => void;
}

export const SupervisorPinModal: React.FC<SupervisorPinModalProps> = ({
  isOpen,
  title = 'Otorisasi Supervisor / Staff',
  description = 'Masukkan 4 digit PIN Supervisor untuk melanjutkan',
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPin = pin.trim();
    if (cleanPin.length < 4) {
      setErrorMsg('PIN minimal 4 digit');
      return;
    }

    // Default supervisor pin from localStorage or fallback '8888'
    const storedPin = localStorage.getItem('pos_supervisor_pin') || '8888';
    if (cleanPin === storedPin || cleanPin === '8888') {
      setErrorMsg('');
      onSuccess(cleanPin);
    } else {
      setErrorMsg('PIN Supervisor tidak sesuai! Silakan coba lagi.');
      setPin('');
    }
  };

  const handleNumpadClick = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setErrorMsg('');
      if (newPin.length === 4) {
        const storedPin = localStorage.getItem('pos_supervisor_pin') || '8888';
        if (newPin === storedPin || newPin === '8888') {
          setTimeout(() => onSuccess(newPin), 150);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print-modal select-none">
      <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl text-slate-800 shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-500/10 text-orange-600 rounded-xl">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
              <p className="text-[10px] text-slate-500 font-medium">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleVerify} className="p-5 space-y-4">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span className="font-semibold text-[11px]">{errorMsg}</span>
            </div>
          )}

          {/* PIN Display */}
          <div className="flex justify-center items-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-mono font-bold transition-all ${
                  pin.length > idx
                    ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-300'
                }`}
              >
                {pin.length > idx ? '●' : ''}
              </div>
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumpadClick(num)}
                className="h-12 bg-slate-50 hover:bg-slate-100 active:bg-orange-100 border border-slate-200 rounded-xl text-base font-bold text-slate-800 transition-colors cursor-pointer shadow-2xs"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="h-12 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-500 transition-colors cursor-pointer"
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleNumpadClick('0')}
              className="h-12 bg-slate-50 hover:bg-slate-100 active:bg-orange-100 border border-slate-200 rounded-xl text-base font-bold text-slate-800 transition-colors cursor-pointer shadow-2xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="h-12 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors cursor-pointer"
            >
              ⌫
            </button>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pin.length < 4 || isLoading}
              className="py-2.5 px-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              Verifikasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
