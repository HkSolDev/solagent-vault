"use client";

import React from "react";

interface ErrorModalProps {
  title: string;
  message: string;
  code?: string;
  onClose: () => void;
}

export default function ErrorModalOverlay({ title, message, code, onClose }: ErrorModalProps) {
  return (
    <div className="fixed inset-0 bg-[#040812]/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-error/40 shadow-2xl relative overflow-hidden flex flex-col gap-4 bg-surface-container/90">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-error to-error-container" />
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-error/10 border border-error/30 flex items-center justify-center text-error font-mono text-xl font-bold">
            ⚠️
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-white font-mono">{title}</h3>
            {code && (
              <span className="text-[10px] font-mono text-error/90 uppercase tracking-wider">
                {code}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-zinc-300 font-mono leading-relaxed bg-surface-container-low/80 p-4 rounded border border-white/15">
          {message}
        </p>

        <button
          onClick={onClose}
          className="py-2.5 rounded bg-surface-container-high hover:brightness-110 text-white font-bold font-mono text-xs border border-white/20 transition-all mt-2 select-none"
        >
          Acknowledge & Close
        </button>
      </div>
    </div>
  );
}
