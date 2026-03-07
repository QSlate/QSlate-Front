"use client";

import React, { useEffect, useRef } from "react";

interface TradingViewChartProps {
    symbol: string;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({ symbol }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = '';

        if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
            console.warn("TradingViewChart: Invalid symbol provided.");
            return;
        }

        const widgetContainerId = `tv_widget_${Math.random().toString(36).substring(7)}`;
        const widgetContainer = document.createElement("div");
        widgetContainer.id = widgetContainerId;
        widgetContainer.className = "tradingview-widget-container__widget";
        widgetContainer.style.height = "100%";
        widgetContainer.style.width = "100%";

        container.appendChild(widgetContainer);

        let widget: any = null;

        const loadWidget = () => {
            if (typeof (window as any).TradingView !== "undefined") {
                widget = new (window as any).TradingView.widget({
                    autosize: true,
                    symbol: symbol,
                    interval: "D",
                    timezone: "Etc/UTC",
                    theme: "dark",
                    style: "1",
                    locale: "en",
                    enable_publishing: false,
                    backgroundColor: "#18171E",
                    gridColor: "#2B2B43",
                    hide_top_toolbar: false,
                    hide_legend: false,
                    save_image: false,
                    container_id: widgetContainerId,
                });
            }
        };

        const existingScript = document.getElementById("tradingview-tv-js-script");
        if (existingScript) {
            if (typeof (window as any).TradingView !== "undefined") {
                loadWidget();
            } else {
                existingScript.addEventListener("load", loadWidget);
            }
        } else {
            const script = document.createElement("script");
            script.id = "tradingview-tv-js-script";
            script.src = "https://s3.tradingview.com/tv.js";
            script.type = "text/javascript";
            script.async = true;
            script.onload = loadWidget;
            document.head.appendChild(script);
        }

        return () => {
            if (widget && typeof widget.remove === 'function') {
                try {
                    widget.remove();
                } catch (e) {
                    console.warn("TradingViewChart: Failed to remove widget.", e);
                }
            }
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [symbol]);

    return (
        <div className="tradingview-widget-container w-full h-full" ref={containerRef} />
    );
};
