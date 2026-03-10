"use client";

import React, { useEffect, useRef } from "react";

interface TradingViewChartProps {
    symbol: string;
    theme?: "dark" | "light";
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({ symbol, theme = "dark" }) => {
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

        let widget: { remove?: () => void } | null = null;
        let cancelled = false;

        const loadWidget = () => {
            if (cancelled) return;
            if (typeof (window as any).TradingView !== "undefined") {
                const TV = (window as unknown as { TradingView: { widget: new (config: Record<string, unknown>) => { remove?: () => void } } }).TradingView;
                widget = new TV.widget({
                    autosize: true,
                    symbol: symbol,
                    interval: "D",
                    timezone: "Etc/UTC",
                    theme: theme,
                    style: "1",
                    locale: "en",
                    enable_publishing: false,
                    backgroundColor: theme === "light" ? "rgba(255,255,255,0)" : "rgba(18,17,30,0)",
                    gridColor: theme === "light" ? "rgba(0,0,0,0.06)" : "rgba(43,43,67,0.5)",
                    hide_top_toolbar: false,
                    hide_legend: false,
                    save_image: false,
                    container_id: widgetContainerId,
                });
            }
        };

        let scriptLoadHandler: (() => void) | null = null;

        const existingScript = document.getElementById("tradingview-tv-js-script");
        if (existingScript) {
            if (typeof (window as { TradingView?: unknown }).TradingView !== "undefined") {
                loadWidget();
            } else {
                scriptLoadHandler = loadWidget;
                existingScript.addEventListener("load", scriptLoadHandler, { once: true });
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
            cancelled = true;
            if (scriptLoadHandler) {
                document.getElementById("tradingview-tv-js-script")
                    ?.removeEventListener("load", scriptLoadHandler);
            }
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
    }, [symbol, theme]);

    return (
        <div className="tradingview-widget-container w-full h-full" ref={containerRef} />
    );
};
