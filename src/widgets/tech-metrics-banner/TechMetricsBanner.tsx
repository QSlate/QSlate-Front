'use client';

import { motion } from 'framer-motion';
import { Cpu, Layers, ShieldCheck, Timer } from 'lucide-react';
import React from 'react';

interface MetricItem {
  value: string;
  label: string;
  subtext: string;
  icon: React.ReactNode;
}

const METRICS: MetricItem[] = [
  {
    value: '10x-50x',
    label: 'RUST SIMD SPEED',
    subtext: 'Vectorized Polars computation engine',
    icon: <Cpu className="w-4 h-4 text-cyan-400" />,
  },
  {
    value: '8ms',
    label: 'P99 EXECUTION LATENCY',
    subtext: 'Deterministic sub-frame event loop',
    icon: <Timer className="w-4 h-4 text-emerald-400" />,
  },
  {
    value: '100+',
    label: 'COMMUNITY WIDGETS',
    subtext: 'Pluggable modular ecosystem registry',
    icon: <Layers className="w-4 h-4 text-purple-400" />,
  },
  {
    value: 'gVisor',
    label: 'ISOLATED SANDBOX',
    subtext: 'Kernel-level ephemeral runner containers',
    icon: <ShieldCheck className="w-4 h-4 text-blue-400" />,
  },
];

export function TechMetricsBanner() {
  return (
    <section
      id="architecture"
      className="relative w-full max-w-6xl mx-auto px-4 py-16 sm:py-24"
    >
      {/* Horizontal Architectural Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl bg-[#090b10] [data-theme=light]:bg-white border border-white/10 [data-theme=light]:border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] [data-theme=light]:shadow-[0_20px_40px_rgba(0,0,0,0.06)] overflow-hidden"
      >
        {/* Subtle Ambient Highlight Bar */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/5 [data-theme=light]:divide-black/5">
          {METRICS.map((metric, index) => (
            <div
              key={index}
              className="relative p-6 sm:p-8 flex flex-col justify-between group hover:bg-white/[0.02] [data-theme=light]:hover:bg-black/[0.02] transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-zinc-400 [data-theme=light]:text-zinc-500">
                  {metric.label}
                </span>
                <div className="p-1.5 rounded-lg bg-white/5 [data-theme=light]:bg-black/5 border border-white/5 [data-theme=light]:border-black/5">
                  {metric.icon}
                </div>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white [data-theme=light]:text-zinc-900 tracking-tight group-hover:text-cyan-400 [data-theme=light]:group-hover:text-cyan-600 transition-colors">
                  {metric.value}
                </div>
                <p className="mt-2 text-xs text-zinc-400 [data-theme=light]:text-zinc-600 leading-relaxed font-sans">
                  {metric.subtext}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
