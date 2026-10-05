/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X } from 'lucide-react';

interface KioskQrisZoomModalProps {
  isOpen: boolean;
  qrisImagePath?: string | null;
  onClose: () => void;
}

export const KioskQrisZoomModal: React.FC<KioskQrisZoomModalProps> = ({
  isOpen,
  qrisImagePath,
  onClose,
}) => {
  if (!isOpen || !qrisImagePath) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center p-6 z-[100] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-3xl shadow-2xl max-w-lg w-full relative flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full shadow-lg cursor-pointer"
        >
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-center text-xl font-bold text-slate-800 mb-4">Scan QRIS Pembayaran</h3>
        <img
          src={qrisImagePath}
          alt="QRIS Zoom"
          className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
        />
        <p className="text-sm font-bold text-slate-500 mt-4 text-center">
          Silakan scan kode ini dengan aplikasi M-Banking atau E-Wallet Anda.
        </p>
      </div>
    </div>
  );
};
