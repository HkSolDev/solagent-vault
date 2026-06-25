"use client";

import React from "react";

interface WizardStepLayoutProps {
  stepNumber: number;
  title: string;
  description?: string;
  isActive: boolean;
  isCompleted: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}

export default function WizardStepLayout({
  stepNumber,
  title,
  description,
  isActive,
  isCompleted,
  onToggle,
  children,
}: WizardStepLayoutProps) {
  // Determine border and background styles based on wizard state
  const containerClasses = `glass-panel rounded-xl overflow-hidden border transition-all duration-300 ${
    isActive
      ? "border-primary/25 bg-surface-container/70 shadow-[0_0_18px_rgba(0,242,255,0.14)]"
      : isCompleted
      ? "border-secondary/25 bg-surface-container-low/80 opacity-95"
      : "border-primary/10 bg-surface-container-low/60 opacity-90"
  }`;

  const headerClickable = !!onToggle;

  return (
    <div className={containerClasses}>
      <header
        onClick={headerClickable ? onToggle : undefined}
        className={`px-5 py-4 flex items-center justify-between select-none ${
          headerClickable ? "cursor-pointer hover:bg-surface-container-high/20" : ""
        }`}
      >
        <div className="flex items-center gap-3.5">
          {/* Circular step badge */}
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
              isCompleted
                ? "bg-success-emerald/20 text-success-emerald border border-success-emerald/30"
                : isActive
                ? "bg-primary-container text-on-primary shadow-[0_0_14px_rgba(0,242,255,0.25)]"
                : "bg-surface-container-high text-zinc-500 border border-outline-variant/60"
            }`}
          >
            {isCompleted ? "✓" : stepNumber}
          </div>

          <div className="flex flex-col">
            <h3
            className={`font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                isActive ? "text-white" : isCompleted ? "text-zinc-300" : "text-zinc-500"
              }`}
            >
              {title}
            </h3>
            {description && isActive && (
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Collapsible toggle visual indicator */}
        {(isActive || isCompleted) && (
          <span
            className={`font-mono text-[10px] text-zinc-500 transition-transform duration-300 ${
              isActive ? "rotate-90 text-primary-container" : ""
            }`}
          >
            ▶
          </span>
        )}
      </header>

      {/* Expandable active content wrapper */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isActive ? "max-h-[800px] border-t border-primary/10 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-5 flex flex-col gap-4 bg-gradient-to-b from-surface-container-low/60 to-surface-container-lowest/50">
          {children}
        </div>
      </div>
    </div>
  );
}
