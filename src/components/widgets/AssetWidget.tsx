import React from 'react';
import { AssetInfo, ChartDataPoint } from '../../types/backtest';

interface AssetWidgetProps {
    asset: AssetInfo;
    chartData?: ChartDataPoint[];
    onClick?: () => void;
}

export const AssetWidget: React.FC<AssetWidgetProps> = ({ asset, chartData, onClick }) => {
    const isPositive = Number(asset.changePercent || 0) >= 0;

    let sparklinePath = "M 0 20 L 100 20";

    if (chartData && chartData.length > 0) {
        const validPrices = chartData
            .map(d => Number(d.close))
            .filter(price => Number.isFinite(price));

        if (validPrices.length > 1) {
            let minPrice = validPrices[0];
            let maxPrice = validPrices[0];
            for (let i = 1; i < validPrices.length; i++) {
                const price = validPrices[i];
                if (price < minPrice) {
                    minPrice = price;
                }
                if (price > maxPrice) {
                    maxPrice = price;
                }
            }
            const range = maxPrice - minPrice || 1;

            const width = 100;
            const height = 40;
            const padding = 2
            const usableHeight = height - padding * 2;
            const dx = width / (validPrices.length - 1);

            sparklinePath = validPrices.map((price, i) => {
                const x = i * dx;
                const normalizedY = (price - minPrice) / range;
                const y = padding + usableHeight - (normalizedY * usableHeight);
                return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
            }).join(" ");
        }
    }

    const Container = onClick ? 'button' : 'div';

    return (
        <Container
            onClick={onClick}
            className={`bg-[#1E2229] rounded-xl p-5 flex items-center justify-between h-full min-h-[100px] w-full text-left ${onClick ? 'cursor-pointer hover:bg-[#2A2E35] transition-colors shadow-sm hover:shadow-md border border-transparent hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500' : ''}`}
        >
            {/* Left: Symbol & Name */}
            <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-none">{asset.symbol}</span>
                <span className="text-sm text-gray-400 mt-1">{asset.name}</span>
            </div>

            {/* Center: Faux Sparkline */}
            <div className="flex-1 px-4 flex justify-center items-center">
                <svg
                    width="100"
                    height="40"
                    viewBox="0 0 100 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d={sparklinePath}
                        stroke={isPositive ? "#00E676" : "#EF4444"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            {/* Right: Price & Change */}
            <div className="flex flex-col items-end">
                <span className="text-xl font-bold text-white leading-none">
                    {Number(asset.currentPrice || 0).toFixed(2)}
                </span>
                <span className={`text-sm mt-1 font-medium ${isPositive ? 'text-[#00E676]' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{Number(asset.changePercent || 0).toFixed(2)}%
                </span>
            </div>
        </Container>
    );
};
