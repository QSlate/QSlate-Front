'use client';

import { Activity, CheckCircle2, Cpu } from 'lucide-react';

export function MiniIdeWidget() {
  return (
    <div className="grid h-full grid-cols-12 divide-x divide-white/[0.06] bg-[#07080b] font-mono text-xs">
      {/* Strategy Python Code (8 cols) */}
      <div className="col-span-8 p-4 leading-relaxed overflow-x-auto">
        <div className="space-y-1 text-zinc-300 text-[12px]">
          <div className="flex gap-4">
            <span className="text-zinc-600 select-none w-6 text-right">1</span>
            <span>
              <span className="text-purple-400">from</span>{' '}
              <span className="text-cyan-400">qslate</span>{' '}
              <span className="text-purple-400">import</span> Strategy, signal,
              risk
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-zinc-600 select-none w-6 text-right">2</span>
            <span />
          </div>
          <div className="flex gap-4">
            <span className="text-zinc-600 select-none w-6 text-right">3</span>
            <span>
              <span className="text-yellow-400">@risk</span>(max_drawdown=
              <span className="text-emerald-400">0.10</span>, position_cap=
              <span className="text-emerald-400">0.25</span>)
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-zinc-600 select-none w-6 text-right">4</span>
            <span>
              <span className="text-purple-400">class</span>{' '}
              <span className="text-yellow-300">MeanReversion</span>(Strategy):
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-zinc-600 select-none w-6 text-right">5</span>
            <span className="pl-6">
              universe ={' '}
              <span className="text-emerald-400">&quot;ES1!&quot;</span>
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-zinc-600 select-none w-6 text-right">6</span>
            <span />
          </div>
          <div className="flex gap-4">
            <span className="text-zinc-600 select-none w-6 text-right">7</span>
            <span className="pl-6">
              <span className="text-purple-400">def</span>{' '}
              <span className="text-blue-400">on_tick</span>(self, tick):
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-zinc-600 select-none w-6 text-right">8</span>
            <span className="pl-12 text-zinc-500">
              # z-score over rolling 200-tick window, no look-ahead
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-zinc-600 select-none w-6 text-right">9</span>
            <span className="pl-12">
              z = signal.zscore(tick.mid, window=
              <span className="text-emerald-400">200</span>)
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-zinc-600 select-none w-6 text-right">10</span>
            <span className="pl-12">
              <span className="text-purple-400">if</span> z &lt;{' '}
              <span className="text-emerald-400">-2.0</span>:
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-zinc-600 select-none w-6 text-right">11</span>
            <span className="pl-16">
              self.buy(size=<span className="text-emerald-400">1</span>)
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-zinc-600 select-none w-6 text-right">12</span>
            <span className="pl-12">
              <span className="text-purple-400">elif</span> z &gt;{' '}
              <span className="text-emerald-400">2.0</span>:
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-zinc-600 select-none w-6 text-right">13</span>
            <span className="pl-16">self.flatten()</span>
          </div>
        </div>
      </div>

      {/* Console (4 cols) */}
      <div className="col-span-4 p-4 flex flex-col justify-between">
        <div>
          <div className="text-zinc-500 pb-2 border-b border-white/[0.06] text-[11px]">
            CONSOLE
          </div>
          <div className="space-y-2.5 mt-3 text-[11px]">
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-gain shrink-0" />
              <span>AST validation passed</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-gain shrink-0" />
              <span>Sandbox: gVisor (runsc)</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <Cpu className="w-3.5 h-3.5 text-signal shrink-0" />
              <span>1.28B ticks in 4.2s</span>
            </div>
            <div className="flex items-center gap-2 text-amber-300">
              <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>3 fills slipped &gt; 1bp</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-500">
          <span className="flex items-center gap-1.5 text-gain">
            <span className="w-1.5 h-1.5 rounded-full bg-gain animate-pulse" />
            kernel idle
          </span>
          <span>rust 1.84</span>
        </div>
      </div>
    </div>
  );
}
