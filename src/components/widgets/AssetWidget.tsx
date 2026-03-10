import React from 'react';
import { AssetInfo, ChartDataPoint } from '../../types/backtest';

interface AssetWidgetProps {
    asset: AssetInfo;
    chartData?: ChartDataPoint[];
    onClick?: () => void;
}

export const AssetWidget: React.FC<AssetWidgetProps> = ({ asset, chartData, onClick }) => {
    const changePercent = Number(asset.changePercent || 0);
    const isPositive = changePercent >= 0;
    const accentColor = isPositive ? '#00FFB2' : '#EF4444';

    let sparklinePath = "M 0 22 L 120 22";
    let areaPath = "";

    if (chartData && chartData.length > 0) {
        const validPrices = chartData
            .map(d => Number(d.close))
            .filter(price => Number.isFinite(price));

        if (validPrices.length > 1) {
            let minPrice = validPrices[0];
            let maxPrice = validPrices[0];
            for (let i = 1; i < validPrices.length; i++) {
                if (validPrices[i] < minPrice) minPrice = validPrices[i];
                if (validPrices[i] > maxPrice) maxPrice = validPrices[i];
            }
            const range = maxPrice - minPrice || 1;
            const width = 120;
            const height = 44;
            const padding = 4;
            const usableHeight = height - padding * 2;
            const dx = width / (validPrices.length - 1);

            const points = validPrices.map((price, i) => {
                const x = i * dx;
                const normalizedY = (price - minPrice) / range;
                const y = padding + usableHeight - normalizedY * usableHeight;
                return { x, y };
            });

            sparklinePath = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(" ");
            const lastPt = points[points.length - 1];
            const firstPt = points[0];
            areaPath = `${sparklinePath} L ${lastPt.x.toFixed(1)} ${height} L ${firstPt.x.toFixed(1)} ${height} Z`;
        }
    }

    const Container = onClick ? 'button' : 'div';

    return (
        <Container
            onClick={onClick}
            {...(onClick ? { type: 'button' as const } : {})}
            className={`relative rounded-xl px-4 py-3 flex items-center justify-between h-full w-full text-left overflow-hidden transition-all duration-200 ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00FFB2]/20' : ''}`}
            style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                boxShadow: 'inset 0 1px 0 var(--card-inset)',
            }}
            onMouseEnter={onClick ? (e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-card-hover)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
            } : undefined}
            onMouseLeave={onClick ? (e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-card)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
            } : undefined}
        >
            {/* Ambient glow */}
            <div
                className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
                style={{ background: accentColor }}
            />

            {/* Left */}
            <div className="flex flex-col gap-0.5 z-10">
                <div className="flex items-center gap-2">
                    <span
                        className="text-base font-bold leading-none tracking-tight"
                        style={{ color: "var(--text-primary)" }}
                    >
                        {asset.symbol}
                    </span>
                    {onClick && (
                        <svg
                            className="w-3 h-3"
                            style={{ color: "var(--text-tertiary)" }}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                    )}
                </div>
                <span
                    className="text-[11px] leading-none"
                    style={{ color: "var(--text-tertiary)" }}
                >
                    {asset.name}
                </span>
            </div>

            {/* Center: Sparkline */}
            <div className="flex-1 flex justify-center items-center px-3 z-10">
                <svg width="120" height="44" viewBox="0 0 120 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    {areaPath && (
                        <defs>
                            <linearGradient id={`sparkGrad-${asset.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={accentColor} stopOpacity="0.2" />
                                <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
                            </linearGradient>
                        </defs>
                    )}
                    {areaPath && (
                        <path d={areaPath} fill={`url(#sparkGrad-${asset.symbol})`} />
                    )}
                    <path
                        d={sparklinePath}
                        stroke={accentColor}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            {/* Right */}
            <div className="flex flex-col items-end gap-0.5 z-10">
                <span
                    className="text-base font-bold leading-none"
                    style={{ color: "var(--text-primary)" }}
                >
                    ${Number(asset.currentPrice || 0).toFixed(2)}
                </span>
                <span
                    className="text-[11px] font-semibold leading-none"
                    style={{ color: accentColor }}
                >
                    {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                </span>
            </div>
        </Container>
    );
};
