"use client";

import React, { useState, useEffect } from "react";
import DashboardSimulator from "@/components/dashboard-simulator";
import Link from "next/link";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [network, setNetwork] = useState<"devnet" | "localnet">("devnet");
  const [customRpc, setCustomRpc] = useState("");
  const [showRpcInput, setShowRpcInput] = useState(false);
  const [activeTabName, setActiveTabName] = useState<"fleet" | "analytics" | "security">("fleet");
  const [activeNavItem, setActiveNavItem] = useState<"command" | "analytics">("command");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("solagent_network");
      if (saved === "localnet") {
        setNetwork("localnet");
      } else {
        setNetwork("devnet");
      }
      setCustomRpc(localStorage.getItem("solagent_custom_rpc") || "");
    }
  }, []);

  const handleNetworkToggle = () => {
    const nextNetwork = network === "devnet" ? "localnet" : "devnet";
    localStorage.setItem("solagent_network", nextNetwork);
    window.location.reload();
  };

  const handleSaveCustomRpc = (url: string) => {
    localStorage.setItem("solagent_custom_rpc", url);
    window.location.reload();
  };

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0e131e] text-[#e4e1e7] justify-center items-center">
        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container/80 backdrop-blur-lg border-r border-white/10 flex flex-col p-4 gap-6 z-50">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.3)]">
            <span className="material-symbols-outlined text-on-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
          </div>
          <div>
            <h1 className="font-display-lg text-lg font-bold text-primary leading-tight">Solagent</h1>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">AI Fleet Manager</p>
          </div>
        </div>
        
        <nav className="flex flex-col gap-1 mt-6">
          <button 
            onClick={() => {
              setActiveNavItem("command");
              setActiveTabName("fleet");
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-left cursor-pointer ${
              activeNavItem === "command"
                ? "bg-primary-container text-on-primary-container font-bold"
                : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-body-md text-sm">Command Center</span>
          </button>
          <button 
            onClick={() => {
              setActiveNavItem("analytics");
              setActiveTabName("analytics");
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-left cursor-pointer ${
              activeNavItem === "analytics"
                ? "bg-primary-container text-on-primary-container font-bold"
                : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTabName === "analytics" ? "'FILL' 1" : "'FILL' 0" }}>query_stats</span>
            <span className="font-body-md text-sm">Vault Analytics</span>
          </button>
          <a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-variant/50 hover:text-primary rounded-lg transition-all duration-200 cursor-pointer">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-body-md text-sm">Settings</span>
          </a>
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <Link href="/" className="w-full py-3 bg-primary-container/10 border border-primary/20 text-primary rounded-lg font-bold hover:bg-primary-container/20 transition-all text-sm flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">home</span>
            Product Homepage
          </Link>
          
          <div className="border-t border-white/5 pt-4">
            <a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-primary transition-colors text-xs" href="https://github.com/HkSolDev/solagent-vault" target="_blank" rel="noreferrer">
              <span className="material-symbols-outlined text-sm">description</span>
              <span>Documentation</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-primary transition-colors text-xs cursor-pointer">
              <span className="material-symbols-outlined text-sm">help_outline</span>
              <span>Support</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 w-[calc(100vw-16rem)] flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="font-display-lg text-2xl font-extrabold text-on-surface">
              {activeTabName === "fleet"
                ? "Command Center"
                : "Cognitive Diagnostics"}
            </h2>
            <p className="text-on-surface-variant font-body-md text-sm mt-1">
              {activeTabName === "fleet" 
                ? "Monitoring active agents across Solana devnet sandbox"
                : "Real-time inference pathways and fleet performance."}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* RPC Network Switcher */}
            <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3">
              <button
                onClick={handleNetworkToggle}
                title="Click to toggle network"
                className="flex items-center gap-2 text-xs font-mono text-secondary font-bold focus:outline-none"
              >
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  network === "devnet" ? "bg-secondary" : "bg-primary-container"
                }`}></div>
                <span>NETWORK: {network === "devnet" ? "SOLANA DEVNET" : "LOCALNET"}</span>
                <span className="text-[9px] opacity-65">(TOGGLE)</span>
              </button>

              {network === "devnet" && (
                <div className="relative flex items-center">
                  <button
                    onClick={() => setShowRpcInput(!showRpcInput)}
                    title="Configure Custom RPC URL"
                    className="p-1 rounded bg-white/5 border border-white/10 text-on-surface-variant hover:text-white transition-colors cursor-pointer text-xs"
                  >
                    ⚙️
                  </button>
                  {showRpcInput && (
                    <div className="absolute right-0 top-8 z-50 p-3 rounded-lg border border-white/10 bg-surface-container shadow-2xl flex flex-col gap-2 w-72">
                      <div className="text-[9px] font-bold text-zinc-300 uppercase">Custom Devnet RPC URL</div>
                      <input
                        type="text"
                        placeholder="https://devnet.helius-rpc.com/?api-key=..."
                        value={customRpc}
                        onChange={(e) => setCustomRpc(e.target.value)}
                        className="w-full text-xs px-2 py-1 rounded bg-background border border-white/10 text-white font-mono focus:outline-none focus:border-primary"
                      />
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => {
                            setCustomRpc("");
                            handleSaveCustomRpc("");
                          }}
                          className="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 font-mono"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => handleSaveCustomRpc(customRpc)}
                          className="text-[10px] px-2 py-1 rounded bg-primary-container text-on-primary-container font-mono font-bold"
                        >
                          Save & Reload
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button className="w-10 h-10 glass-panel rounded-full flex items-center justify-center hover:text-primary transition-colors cursor-pointer">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden border border-white/10">
              <img alt="Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEGB-B4drZyOXSP7ypsRKSkMSXOURxxl-5aOQ0wq6LoZ-FJtOZqh75TneK3_9LGc6m3C9tioAUiNgZ3K1wmfenY3vT2-r7W1Mier-ZFXNZbcFZOvTTEudvyhedDvHiCGn86A0fc_ZrMKIidnTGSkgxM32LX0_lmU691gMrrtIYhpAZIXSgULp6SojJpOdXIE2g26vLWQLxtM8xstN87wx84WtdgdfCq6ie5oYAsVpgnEPaq2CSxzfQ7WhFUpuS1u7IRf7TGhGiaicQ"/>
            </div>
          </div>
        </header>

        {/* Dashboard Core Simulator */}
        <div className="w-full">
          <DashboardSimulator activeTabName={activeTabName} setActiveTabName={setActiveTabName} network={network} />
        </div>

        {/* Footer */}
        <footer className="w-full py-12 flex flex-col items-center justify-center gap-4 border-t border-white/5 mt-16 text-xs text-on-surface-variant">
          <p>© 2024 Solagent Vault. Secured by Solana.</p>
          <div className="flex gap-6">
            <a className="hover:text-secondary transition-colors" href="#">Terms</a>
            <a className="hover:text-secondary transition-colors" href="#">Privacy</a>
            <a className="hover:text-secondary transition-colors" href="#">Status</a>
            <a className="hover:text-secondary transition-colors" href="https://x.com/HKsoldev" target="_blank" rel="noreferrer">Twitter</a>
            <a className="hover:text-secondary transition-colors" href="https://github.com/HkSolDev/solagent-vault" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
