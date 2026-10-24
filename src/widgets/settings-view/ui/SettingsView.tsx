'use client';

import { Cpu, Save, Scale, Settings2, Shield } from 'lucide-react';
import { useState } from 'react';

import { useLabStore } from '@/features/lab-state';

export function SettingsView() {
  const showToast = useLabStore((state) => state.showToast);

  const [sandboxMemory, setSandboxMemory] = useState('2048 MB');
  const [maxCpuCores, setMaxCpuCores] = useState('4 Cores (SIMD)');
  const [slippageBps, setSlippageBps] = useState('1.5');
  const [latencyMs, setLatencyMs] = useState('12');

  const handleSave = () => {
    showToast('Platform parameters successfully updated', 'success');
  };

  return (
    <div className="flex-1 w-full flex flex-col p-4 max-w-4xl overflow-y-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#242528] text-xs font-mono">
        <div className="flex items-center gap-3">
          <Settings2 size={16} className="text-blue-400" />
          <h1 className="font-sans font-semibold text-sm text-white">
            Simulation & Engine Settings
          </h1>
          <span className="text-zinc-500">· gVisor v2.8 / Polars 1.18</span>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-medium shadow-xs transition-colors"
        >
          <Save size={12} />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="space-y-5 text-xs font-mono">
        {/* Section 1: gVisor Execution Sandbox */}
        <div className="rounded-xl border border-[#242528] bg-[#0c0d0e] p-4 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-white font-sans font-semibold text-sm border-b border-white/[0.04] pb-2">
            <Shield size={15} className="text-blue-400" />
            <span>gVisor Isolated Kernel Runtime</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-zinc-400 mb-1">
                Sandbox Memory Limit
              </label>
              <select
                value={sandboxMemory}
                onChange={(e) => setSandboxMemory(e.target.value)}
                className="w-full bg-[#111215] border border-[#242528] rounded-md px-3 py-1.5 text-white"
              >
                <option value="1024 MB">1024 MB (Light)</option>
                <option value="2048 MB">2048 MB (Default Institutional)</option>
                <option value="4096 MB">
                  4096 MB (Heavy Tick Monte Carlo)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">
                Polars Vectorized Thread Cores
              </label>
              <select
                value={maxCpuCores}
                onChange={(e) => setMaxCpuCores(e.target.value)}
                className="w-full bg-[#111215] border border-[#242528] rounded-md px-3 py-1.5 text-white"
              >
                <option value="2 Cores">2 Cores (AVX-2)</option>
                <option value="4 Cores (SIMD)">4 Cores (AVX-512 SIMD)</option>
                <option value="8 Cores (Cluster)">
                  8 Cores (High Throughput)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Execution & Slippage Modeling */}
        <div className="rounded-xl border border-[#242528] bg-[#0c0d0e] p-4 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-white font-sans font-semibold text-sm border-b border-white/[0.04] pb-2">
            <Cpu size={15} className="text-emerald-400" />
            <span>Microstructure & Friction Parameters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-zinc-400 mb-1">
                Fixed Slippage (Basis Points)
              </label>
              <input
                type="number"
                step="0.1"
                value={slippageBps}
                onChange={(e) => setSlippageBps(e.target.value)}
                className="w-full bg-[#111215] border border-[#242528] rounded-md px-3 py-1.5 text-white"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">
                Execution Latency Delay (ms)
              </label>
              <input
                type="number"
                step="1"
                value={latencyMs}
                onChange={(e) => setLatencyMs(e.target.value)}
                className="w-full bg-[#111215] border border-[#242528] rounded-md px-3 py-1.5 text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Regulatory Compliance (AMF France) */}
        <div className="rounded-xl border border-[#242528] bg-[#0c0d0e] p-4 shadow-lg space-y-2">
          <div className="flex items-center gap-2 text-white font-sans font-semibold text-sm border-b border-white/[0.04] pb-2">
            <Scale size={15} className="text-amber-400" />
            <span>Regulatory & Compliance Notice (AMF / RGAA)</span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed pt-1">
            QSLate acts exclusively as a Technical Tool Provider and simulation
            environment. It does not provide investment advice (Conseiller en
            Investissements Financiers - CIF) or discretionary management.
            Simulations are hypothetical and do not guarantee future returns.
          </p>
        </div>
      </div>
    </div>
  );
}
