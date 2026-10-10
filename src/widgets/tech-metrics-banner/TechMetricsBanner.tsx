'use client';

import { motion } from 'framer-motion';

interface MetricItem {
  value: string;
  label: string;
}

const METRICS: MetricItem[] = [
  {
    value: '10x-50x',
    label: 'FASTER BACKTESTING ENGINE',
  },
  {
    value: '8ms',
    label: 'TICK-LEVEL REPLAY SPEED',
  },
  {
    value: '100+',
    label: 'FINANCIAL ASSETS',
  },
  {
    value: 'gVisor',
    label: 'SANDBOX SECURITY',
  },
];

export function TechMetricsBanner() {
  return (
    <section
      id="architecture"
      className="relative w-full max-w-5xl mx-auto px-4 py-8 sm:py-12"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6 }}
        className="relative rounded-2xl bg-[#090b10] [data-theme=light]:bg-[#f8f9fa] border border-white/10 [data-theme=light]:border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] [data-theme=light]:shadow-[0_15px_30px_rgba(0,0,0,0.04)] overflow-hidden"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/5 [data-theme=light]:divide-black/5">
          {METRICS.map((metric, index) => (
            <div
              key={index}
              className="p-6 sm:p-8 flex flex-col items-center sm:items-start text-center sm:text-left group hover:bg-white/[0.02] [data-theme=light]:hover:bg-black/[0.02] transition-colors"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-white [data-theme=light]:text-zinc-950 tracking-tight font-sans">
                {metric.value}
              </div>
              <div className="mt-2 text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-zinc-400 [data-theme=light]:text-zinc-500 font-medium">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
