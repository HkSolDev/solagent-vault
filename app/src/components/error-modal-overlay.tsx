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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-emergency-red/30 shadow-2xl relative overflow-hidden flex flex-col gap-4">
        <div className="absolute top-0 left-0 w-full h-1 bg-emergency-red" />
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emergency-red/10 border border-emergency-red/20 flex items-center justify-center text-emergency-red font-mono text-xl font-bold">
            ⚠️
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-white font-mono">{title}</h3>
            {code && (
              <span className="text-[10px] font-mono text-emergency-red/80 uppercase tracking-wider">
                {code}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-zinc-300 font-mono leading-relaxed bg-white/5 p-4 rounded border border-glass-border">
          {message}
        </p>

        <button
          onClick={onClose}
          className="py-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold font-mono text-xs border border-glass-border transition-all mt-2 select-none"
        >
          Acknowledge & Close
        </button>
      </div>
    </div>
  );
}
