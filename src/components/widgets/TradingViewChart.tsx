"use client";

import { useEffect, useRef } from "react";

interface TradingViewChartProps {
    symbol: string;
}

export const TradingViewChart = ({ symbol }: TradingViewChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        containerRef.current.innerHTML = '';

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;

        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": symbol,
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "enable_publishing": false,
            "backgroundColor": "#1E2229",
            "gridColor": "#2B2B43",
            "hide_top_toolbar": false,
            "hide_legend": false,
            "save_image": false,
            "calendar": false,
            "support_host": "https://www.tradingview.com"
        });

        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [symbol]);

    return (
        <div className="w-full h-full" ref={containerRef} />
    );
};
