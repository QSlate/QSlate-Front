'use client';

import { useUserStore } from '@/entities/user/model';
import { useHydratedStore } from '@/shared/lib/store';

export function MarketplaceCardPreview({ moduleId }: { moduleId: string }) {
  const colorblind = useHydratedStore(
    useUserStore,
    (state) => state.colorblindMode,
    'none'
  );
  const isColorblind = colorblind === 'orange-blue';

  const upColor = isColorblind ? '#38BDF8' : '#10B981';
  const downColor = isColorblind ? '#F59E0B' : '#F43F5E';
  const spikeColor = isColorblind ? '#38BDF8' : '#F59E0B';

  switch (moduleId) {
    case 'mod-monte-carlo':
      return (
        <svg
          viewBox="0 0 320 120"
          className="w-full h-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="Monte Carlo fan preview"
        >
          <line
            x1="0"
            y1="60"
            x2="320"
            y2="60"
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="3 3"
          />
          {/* Fan Upper Area */}
          <path
            d="M 0 60 Q 160 40 320 15 L 320 60 L 0 60 Z"
            fill={upColor}
            opacity="0.15"
          />
          {/* Fan Lower Area */}
          <path
            d="M 0 60 Q 160 70 320 95 L 320 60 L 0 60 Z"
            fill={downColor}
            opacity="0.15"
          />
          {/* Upper curve */}
          <path
            d="M 0 60 Q 160 40 320 15"
            fill="none"
            stroke={upColor}
            strokeWidth="1.8"
          />
          {/* Median curve */}
          <path
            d="M 0 60 Q 160 52 320 40"
            fill="none"
            stroke="#527DFF"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          {/* Lower curve */}
          <path
            d="M 0 60 Q 160 70 320 95"
            fill="none"
            stroke={downColor}
            strokeWidth="1.8"
          />
        </svg>
      );

    case 'mod-order-book':
      return (
        <div className="w-full h-full grid grid-rows-6 grid-cols-12 gap-1 p-2 bg-[#060709]">
          {Array.from({ length: 72 }).map((_, i) => {
            const isAsk = i < 36;
            const opacity = 0.15 + ((i % 12) / 12) * 0.7;
            const color = isAsk ? downColor : upColor;
            return (
              <div
                key={i}
                style={{
                  backgroundColor: color,
                  opacity,
                }}
                className="rounded-xs transition-opacity hover:opacity-100"
              />
            );
          })}
        </div>
      );

    case 'mod-volatility-filter':
      return (
        <div className="w-full h-full flex items-end justify-between gap-1 p-3 bg-[#060709]">
          {Array.from({ length: 32 }).map((_, i) => {
            const isSpike = i === 6 || i === 14 || i === 22 || i === 29;
            const height = isSpike
              ? 85 + (i % 3) * 5
              : 20 + Math.sin(i / 4) * 35;
            return (
              <div
                key={i}
                style={{
                  height: `${height}%`,
                  backgroundColor: isSpike
                    ? spikeColor
                    : 'rgba(255,255,255,0.2)',
                }}
                className="flex-1 rounded-xs"
              />
            );
          })}
        </div>
      );

    case 'mod-twap-vwap':
      return (
        <svg
          viewBox="0 0 320 120"
          className="w-full h-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="TWAP VWAP curve preview"
        >
          <path
            d="M 10 100 Q 80 80 160 40 T 310 20"
            fill="none"
            stroke="#527DFF"
            strokeWidth="2"
          />
          <path
            d="M 10 90 Q 90 95 170 50 T 310 35"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={i}
              x={20 + i * 24}
              y={70 - (i % 4) * 12}
              width="10"
              height={40 + (i % 4) * 12}
              fill="rgba(82, 125, 255, 0.15)"
              rx="1"
            />
          ))}
        </svg>
      );

    case 'mod-satellite':
      return (
        <div className="w-full h-full grid grid-rows-4 grid-cols-8 gap-1.5 p-3 bg-[#060709]">
          {Array.from({ length: 32 }).map((_, i) => {
            const intensity = Math.abs(Math.sin(i * 1.3));
            return (
              <div
                key={i}
                style={{
                  backgroundColor: '#8B5CF6',
                  opacity: 0.1 + intensity * 0.7,
                }}
                className="rounded-xs"
              />
            );
          })}
        </div>
      );

    case 'mod-tail-risk':
      return (
        <svg
          viewBox="0 0 320 120"
          className="w-full h-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="Tail Risk VaR CVaR preview"
        >
          {/* Normal distribution curve */}
          <path
            d="M 10 110 Q 70 108 110 80 Q 160 5 210 80 Q 250 108 310 110"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
          />
          {/* Shaded Tail Risk Left Area (CVaR) */}
          <path
            d="M 10 110 Q 50 109 85 95 L 85 110 Z"
            fill={downColor}
            opacity="0.35"
          />
          <line
            x1="85"
            y1="20"
            x2="85"
            y2="110"
            stroke={downColor}
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <text
            x="92"
            y="35"
            fill={downColor}
            fontSize="9"
            fontFamily="monospace"
          >
            VaR 99%
          </text>
        </svg>
      );

    default:
      return <div className="w-full h-full bg-white/[0.02]" />;
  }
}
