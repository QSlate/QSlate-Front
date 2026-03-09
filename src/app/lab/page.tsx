"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BacktestResult, BacktestMetrics, ChartDataPoint, Trade } from "../../types/backtest";
import { MetricWidget } from "../../components/widgets/MetricWidget";
import { AssetWidget } from "../../components/widgets/AssetWidget";
import { SymbolSearchModal } from "../../components/widgets/SymbolSearchModal";
import { calculateProgress } from "../../utils/metrics";
import { TradingViewChart } from "../../components/widgets/TradingViewChart";
import { TradeHistoryWidget } from "../../components/widgets/TradeHistoryWidget";

import type { Layout, ResponsiveLayouts } from "react-grid-layout";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const DEFAULT_LAYOUTS: ResponsiveLayouts = {
    lg: [
        { i: "chart", x: 0, y: 0, w: 9, h: 8, minW: 4, minH: 6 },
        { i: "asset", x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
        { i: "sharpe", x: 9, y: 2, w: 3, h: 2, minW: 2, minH: 2 },
        { i: "fitness", x: 9, y: 4, w: 3, h: 2, minW: 2, minH: 2 },
        { i: "turnover", x: 9, y: 6, w: 3, h: 2, minW: 2, minH: 2 },
        { i: "drawdown", x: 0, y: 8, w: 2, h: 2, minW: 2, minH: 2 },
        { i: "returns", x: 2, y: 8, w: 2, h: 2, minW: 2, minH: 2 },
        { i: "margin", x: 4, y: 8, w: 2, h: 2, minW: 2, minH: 2 },
        { i: "netprofit", x: 6, y: 8, w: 3, h: 2, minW: 2, minH: 2 },
        { i: "winrate", x: 9, y: 8, w: 3, h: 2, minW: 2, minH: 2 },
        { i: "trades", x: 0, y: 10, w: 12, h: 5, minW: 1, minH: 3 },
    ],
    md: [
        { i: "chart", x: 0, y: 0, w: 8, h: 8, minW: 4, minH: 6 },
        { i: "asset", x: 8, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
        { i: "sharpe", x: 8, y: 2, w: 4, h: 2, minW: 2, minH: 2 },
        { i: "fitness", x: 8, y: 4, w: 4, h: 2, minW: 2, minH: 2 },
        { i: "turnover", x: 8, y: 6, w: 4, h: 2, minW: 2, minH: 2 },
        { i: "drawdown", x: 0, y: 8, w: 4, h: 2, minW: 2, minH: 2 },
        { i: "returns", x: 4, y: 8, w: 4, h: 2, minW: 2, minH: 2 },
        { i: "margin", x: 8, y: 8, w: 4, h: 2, minW: 2, minH: 2 },
        { i: "netprofit", x: 0, y: 10, w: 4, h: 2, minW: 2, minH: 2 },
        { i: "winrate", x: 4, y: 10, w: 4, h: 2, minW: 2, minH: 2 },
        { i: "trades", x: 0, y: 12, w: 12, h: 5, minW: 1, minH: 3 },
    ],
    sm: [
        { i: "chart", x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
        { i: "asset", x: 0, y: 8, w: 6, h: 2, minW: 2, minH: 2 },
        { i: "sharpe", x: 0, y: 10, w: 6, h: 2, minW: 2, minH: 2 },
        { i: "fitness", x: 0, y: 12, w: 6, h: 2, minW: 2, minH: 2 },
        { i: "turnover", x: 0, y: 14, w: 6, h: 2, minW: 2, minH: 2 },
        { i: "drawdown", x: 0, y: 16, w: 6, h: 2, minW: 2, minH: 2 },
        { i: "returns", x: 0, y: 18, w: 6, h: 2, minW: 2, minH: 2 },
        { i: "margin", x: 0, y: 20, w: 6, h: 2, minW: 2, minH: 2 },
        { i: "netprofit", x: 0, y: 22, w: 6, h: 2, minW: 2, minH: 2 },
        { i: "winrate", x: 0, y: 24, w: 6, h: 2, minW: 2, minH: 2 },
        { i: "trades", x: 0, y: 26, w: 6, h: 5, minW: 1, minH: 3 },
    ]
};


const getMetricsFromSession = (): BacktestMetrics => {
    const defaultMetrics: BacktestMetrics = {
        sharpe: 0,
        fitness: 0,
        turnover: 0,
        drawdown: 0,
        returns: 0,
        margin: 0,
        winRate: 0,
        netProfit: 0,
    };

    try {
        const sessionData = sessionStorage.getItem("latest_backtest");
        if (!sessionData) return defaultMetrics;

        const parsed = JSON.parse(sessionData);
        if (!parsed?.report) return defaultMetrics;

        const r = parsed.report;
        const parseMetric = (val: any) => {
            const num = Number(val);
            return Number.isFinite(num) ? num : 0;
        };

        return {
            sharpe: parseMetric(r.sharpe ?? r["Sharpe Ratio"] ?? 0),
            fitness: parseMetric(r.fitness ?? r["Fitness Score"] ?? 0),
            turnover: parseMetric(r.turnover ?? r["Turnover"] ?? r["Total Trades"] ?? 0),
            drawdown: parseMetric(r.drawdown ?? r["Max Drawdown (%)"] ?? 0),
            returns: parseMetric(r.returns ?? r["Returns (%)"] ?? 0),
            margin: parseMetric(r.margin ?? r["Margin Util. (%)"] ?? 0),
            winRate: parseMetric(r.winRate ?? r["Win Rate (%)"] ?? 0),
            netProfit: r["Final Capital ($)"]
                ? parseMetric(r["Final Capital ($)"]) - (parsed?.config?.initial_capital || 10000)
                : 0,
        };
    } catch (error) {
        console.error("Failed to parse backtest data from session storage:", error);
        return defaultMetrics;
    }
};

const fetchChartData = async (symbol: string) => {
    try {
        const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${url}/api/data/${symbol}?limit=10`);

        if (!res.ok) throw new Error("Failed to fetch chart data");

        const jsonData: ChartDataPoint[] = await res.json();
        if (!Array.isArray(jsonData) || jsonData.length === 0) {
            return { chartData: [], currentPrice: 0, changePercent: 0 };
        }

        const currentPrice = Number(jsonData[jsonData.length - 1].close) || 0;
        let changePercent = 0;

        if (jsonData.length >= 2) {
            const prevClose = Number(jsonData[jsonData.length - 2].close);
            if (prevClose) {
                changePercent = ((currentPrice - prevClose) / prevClose) * 100;
            }
        }

        return { chartData: jsonData, currentPrice, changePercent };
    } catch (error) {
        console.error("Error fetching chart data:", error);
        return { chartData: [], currentPrice: 0, changePercent: 0 };
    }
};


function DashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const currentSymbol = searchParams.get("symbol") || "AAPL";
    const currentExchange = searchParams.get("exchange") || "NASDAQ";

    const [backtestData, setBacktestData] = useState<BacktestResult | null>(null);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);

    const [layouts, setLayouts] = useState<ResponsiveLayouts>(DEFAULT_LAYOUTS);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedLayouts = localStorage.getItem("qslate_lab_layouts_v6");
        if (savedLayouts) {
            try {
                const parsedLayouts = JSON.parse(savedLayouts);
                Object.keys(parsedLayouts).forEach((bp) => {
                    const bpLayout = parsedLayouts[bp];
                    const tradesItem = bpLayout.find((item: any) => item.i === "trades");
                    if (tradesItem) {
                        tradesItem.minW = 1;
                    }
                    if (!bpLayout.find((item: any) => item.i === "netprofit")) {
                        bpLayout.push({ i: "netprofit", x: 0, y: 10, w: 6, h: 2, minW: 2, minH: 2 });
                    }
                    if (!bpLayout.find((item: any) => item.i === "winrate")) {
                        bpLayout.push({ i: "winrate", x: 6, y: 10, w: 6, h: 2, minW: 2, minH: 2 });
                    }
                });
                setLayouts(parsedLayouts);
            } catch (e) {
                console.error("Failed to parse saved layout", e);
            }
        }
    }, []);

    const onLayoutChange = (_currentLayout: Layout, allLayouts: ResponsiveLayouts) => {
        setLayouts(allLayouts);
        try {
            localStorage.setItem("qslate_lab_layouts_v6", JSON.stringify(allLayouts));
        } catch (error) {
            console.error("Failed to persist layout to localStorage", error);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setIsLoading(true);
            setBacktestData(null);

            const { chartData, currentPrice, changePercent } = await fetchChartData(currentSymbol);
            const metrics = getMetricsFromSession();

            let loadedTrades: Trade[] = [];
            try {
                const sessionData = sessionStorage.getItem("latest_backtest");
                if (sessionData) {
                    const parsed = JSON.parse(sessionData);
                    loadedTrades = parsed?.trades || parsed?.report?.trades || [];
                }
            } catch (e) {
                console.error("Failed to parse trades out of sessionData", e);
            }

            if (isMounted) {
                setBacktestData({
                    asset: {
                        symbol: currentSymbol,
                        name: currentSymbol,
                        currentPrice,
                        changePercent,
                    },
                    metrics,
                    chartData,
                });
                setTrades(loadedTrades);
                setIsLoading(false);
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [currentSymbol]);

    const handleSymbolChange = (symbol: string, exchange: string) => {
        setIsSymbolModalOpen(false);
        router.push(`/lab?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}`);
    };

    if (isLoading && !backtestData) {
        return (
            <div className="p-6 flex items-center justify-center h-full min-h-[400px]">
                <div className="text-gray-400 font-medium animate-pulse">Loading dashboard data...</div>
            </div>
        );
    }

    if (!backtestData) {
        return (
            <div className="p-6 flex items-center justify-center h-full min-h-[400px]">
                <div className="text-gray-400 font-medium">No data available for {currentSymbol}.</div>
            </div>
        );
    }

    const { metrics, asset, chartData } = backtestData;

    return (
        <div className="p-6 flex flex-col gap-6 h-full w-full min-h-screen">
            <SymbolSearchModal
                isOpen={isSymbolModalOpen}
                onClose={() => setIsSymbolModalOpen(false)}
                onSelectSymbol={handleSymbolChange}
            />

            {!mounted ? (
                <div className="text-gray-400 font-medium animate-pulse flex items-center justify-center p-12">
                    Loading workspace...
                </div>
            ) : (
                <div className="flex-1 -mx-3"> {/* Offset for grid margin */}
                    <ResponsiveGridLayout
                        className="layout"
                        layouts={layouts}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
                        rowHeight={55}
                        onLayoutChange={onLayoutChange}
                        draggableHandle=".drag-handle"
                        margin={[24, 24]}
                        useCSSTransforms={true}
                    >
                        {/* Chart Widget */}
                        <div key="chart" className="bg-[#0D0F14] rounded-xl w-full h-full overflow-hidden border border-white/5 shadow-sm relative group">
                            <div className="drag-handle absolute top-4 right-4 z-50 p-1.5 rounded bg-[#211F28]/80 text-gray-500 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity border border-[#383544] backdrop-blur-sm flex items-center justify-center" role="button" tabIndex={0} aria-label="Drag to move" title="Drag to move">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="12" r="1.5" />
                                    <circle cx="9" cy="5" r="1.5" />
                                    <circle cx="9" cy="19" r="1.5" />
                                    <circle cx="15" cy="12" r="1.5" />
                                    <circle cx="15" cy="5" r="1.5" />
                                    <circle cx="15" cy="19" r="1.5" />
                                </svg>
                            </div>
                            <TradingViewChart symbol={`${currentExchange}:${currentSymbol}`} />
                        </div>

                        {/* Right Column - Top Metrics */}
                        <div key="asset" className="relative group w-full h-full">
                            <div className="drag-handle absolute top-3 right-3 z-50 p-1.5 rounded bg-[#211F28]/90 text-gray-500 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shadow-sm flex items-center justify-center pointer-events-auto" role="button" tabIndex={0} aria-label="Drag to move" title="Drag to move">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="12" r="1.5" />
                                    <circle cx="9" cy="5" r="1.5" />
                                    <circle cx="9" cy="19" r="1.5" />
                                    <circle cx="15" cy="12" r="1.5" />
                                    <circle cx="15" cy="5" r="1.5" />
                                    <circle cx="15" cy="19" r="1.5" />
                                </svg>
                            </div>
                            <AssetWidget
                                asset={asset}
                                chartData={chartData}
                                onClick={() => setIsSymbolModalOpen(true)}
                            />
                        </div>

                        <div key="sharpe" className="relative group w-full h-full">
                            <div className="drag-handle absolute top-3 right-3 z-50 p-1.5 rounded bg-[#211F28]/90 text-gray-500 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shadow-sm flex items-center justify-center pointer-events-auto" role="button" tabIndex={0} aria-label="Drag to move" title="Drag to move">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="12" r="1.5" />
                                    <circle cx="9" cy="5" r="1.5" />
                                    <circle cx="9" cy="19" r="1.5" />
                                    <circle cx="15" cy="12" r="1.5" />
                                    <circle cx="15" cy="5" r="1.5" />
                                    <circle cx="15" cy="19" r="1.5" />
                                </svg>
                            </div>
                            <MetricWidget
                                title="Sharpe Ratio"
                                value={metrics.sharpe.toFixed(2)}
                                visualType="segmented"
                                progressValue={calculateProgress(metrics.sharpe, -2, 3)}
                            />
                        </div>

                        <div key="fitness" className="relative group w-full h-full">
                            <div className="drag-handle absolute top-3 right-3 z-50 p-1.5 rounded bg-[#211F28]/90 text-gray-500 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shadow-sm flex items-center justify-center pointer-events-auto" role="button" tabIndex={0} aria-label="Drag to move" title="Drag to move">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="12" r="1.5" />
                                    <circle cx="9" cy="5" r="1.5" />
                                    <circle cx="9" cy="19" r="1.5" />
                                    <circle cx="15" cy="12" r="1.5" />
                                    <circle cx="15" cy="5" r="1.5" />
                                    <circle cx="15" cy="19" r="1.5" />
                                </svg>
                            </div>
                            <MetricWidget
                                title="Fitness Score"
                                value={metrics.fitness.toFixed(1)}
                                subValue="/ 5.0"
                                visualType="segmented"
                                progressValue={calculateProgress(metrics.fitness, -2, 5)}
                            />
                        </div>

                        <div key="turnover" className="relative group w-full h-full">
                            <div className="drag-handle absolute top-3 right-3 z-50 p-1.5 rounded bg-[#211F28]/90 text-gray-500 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shadow-sm flex items-center justify-center pointer-events-auto" role="button" tabIndex={0} aria-label="Drag to move" title="Drag to move">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="12" r="1.5" />
                                    <circle cx="9" cy="5" r="1.5" />
                                    <circle cx="9" cy="19" r="1.5" />
                                    <circle cx="15" cy="12" r="1.5" />
                                    <circle cx="15" cy="5" r="1.5" />
                                    <circle cx="15" cy="19" r="1.5" />
                                </svg>
                            </div>
                            <MetricWidget
                                title="Turnover"
                                value={`${metrics.turnover.toFixed(1)}%`}
                                visualType="progress"
                                progressValue={calculateProgress(metrics.turnover, 0, 100)}
                            />
                        </div>

                        {/* Bottom Metrics */}
                        <div key="drawdown" className="relative group w-full h-full">
                            <div className="drag-handle absolute top-3 right-3 z-50 p-1.5 rounded bg-[#211F28]/90 text-gray-500 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shadow-sm flex items-center justify-center pointer-events-auto" role="button" tabIndex={0} aria-label="Drag to move" title="Drag to move">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="12" r="1.5" />
                                    <circle cx="9" cy="5" r="1.5" />
                                    <circle cx="9" cy="19" r="1.5" />
                                    <circle cx="15" cy="12" r="1.5" />
                                    <circle cx="15" cy="5" r="1.5" />
                                    <circle cx="15" cy="19" r="1.5" />
                                </svg>
                            </div>
                            <MetricWidget
                                title="Max Drawdown"
                                value={`${Math.abs(metrics.drawdown).toFixed(2)}%`}
                                visualType="segmented"
                                progressValue={calculateProgress(Math.abs(metrics.drawdown), 0, 100, true)}
                            />
                        </div>

                        <div key="returns" className="relative group w-full h-full">
                            <div className="drag-handle absolute top-3 right-3 z-50 p-1.5 rounded bg-[#211F28]/90 text-gray-500 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shadow-sm flex items-center justify-center pointer-events-auto" role="button" tabIndex={0} aria-label="Drag to move" title="Drag to move">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="12" r="1.5" />
                                    <circle cx="9" cy="5" r="1.5" />
                                    <circle cx="9" cy="19" r="1.5" />
                                    <circle cx="15" cy="12" r="1.5" />
                                    <circle cx="15" cy="5" r="1.5" />
                                    <circle cx="15" cy="19" r="1.5" />
                                </svg>
                            </div>
                            <MetricWidget
                                title="Total Returns"
                                value={`${metrics.returns.toFixed(2)}%`}
                                visualType="progress"
                                progressValue={calculateProgress(metrics.returns, 0, 80)}
                            />
                        </div>

                        <div key="margin" className="relative group w-full h-full">
                            <div className="drag-handle absolute top-3 right-3 z-50 p-1.5 rounded bg-[#211F28]/90 text-gray-500 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shadow-sm flex items-center justify-center pointer-events-auto" role="button" tabIndex={0} aria-label="Drag to move" title="Drag to move">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="12" r="1.5" />
                                    <circle cx="9" cy="5" r="1.5" />
                                    <circle cx="9" cy="19" r="1.5" />
                                    <circle cx="15" cy="12" r="1.5" />
                                    <circle cx="15" cy="5" r="1.5" />
                                    <circle cx="15" cy="19" r="1.5" />
                                </svg>
                            </div>
                            <MetricWidget
                                title="Margin Utilization"
                                value={`${metrics.margin.toFixed(2)}%`}
                                visualType="progress"
                                progressValue={calculateProgress(metrics.margin, 0, 80)}
                            />
                        </div>

                        <div key="netprofit" className="relative group w-full h-full">
                            <div className="drag-handle absolute top-3 right-3 z-50 p-1.5 rounded bg-[#211F28]/90 text-gray-500 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shadow-sm flex items-center justify-center pointer-events-auto" role="button" tabIndex={0} aria-label="Drag to move" title="Drag to move">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="12" r="1.5" />
                                    <circle cx="9" cy="5" r="1.5" />
                                    <circle cx="9" cy="19" r="1.5" />
                                    <circle cx="15" cy="12" r="1.5" />
                                    <circle cx="15" cy="5" r="1.5" />
                                    <circle cx="15" cy="19" r="1.5" />
                                </svg>
                            </div>
                            <MetricWidget
                                title="Net Profit"
                                value={metrics.netProfit >= 0 ? `+$${metrics.netProfit.toFixed(2)}` : `-$${Math.abs(metrics.netProfit).toFixed(2)}`}
                                visualType="progress"
                                progressValue={calculateProgress(metrics.netProfit, -10000, 10000)}
                            />
                        </div>

                        <div key="winrate" className="relative group w-full h-full">
                            <div className="drag-handle absolute top-3 right-3 z-50 p-1.5 rounded bg-[#211F28]/90 text-gray-500 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shadow-sm flex items-center justify-center pointer-events-auto" role="button" tabIndex={0} aria-label="Drag to move" title="Drag to move">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="12" r="1.5" />
                                    <circle cx="9" cy="5" r="1.5" />
                                    <circle cx="9" cy="19" r="1.5" />
                                    <circle cx="15" cy="12" r="1.5" />
                                    <circle cx="15" cy="5" r="1.5" />
                                    <circle cx="15" cy="19" r="1.5" />
                                </svg>
                            </div>
                            <MetricWidget
                                title="Win Rate"
                                value={`${metrics.winRate.toFixed(2)}%`}
                                visualType="segmented"
                                progressValue={calculateProgress(metrics.winRate, 0, 100)}
                            />
                        </div>

                        {/* Trades History */}
                        <div key="trades" data-grid={{ w: 12, h: 5, x: 0, y: Infinity, minW: 1, minH: 3 }} className="relative group w-full h-full">
                            <div className="drag-handle absolute top-4 right-4 z-50 p-1.5 rounded bg-[#211F28]/90 text-gray-500 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shadow-sm flex items-center justify-center pointer-events-auto border border-[#383544]" role="button" tabIndex={0} aria-label="Drag to move" title="Drag to move">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="12" r="1.5" />
                                    <circle cx="9" cy="5" r="1.5" />
                                    <circle cx="9" cy="19" r="1.5" />
                                    <circle cx="15" cy="12" r="1.5" />
                                    <circle cx="15" cy="5" r="1.5" />
                                    <circle cx="15" cy="19" r="1.5" />
                                </svg>
                            </div>
                            <TradeHistoryWidget trades={trades} />
                        </div>
                    </ResponsiveGridLayout>
                </div>
            )}
        </div>
    );
}

export default function LabPage() {
    return (
        <Suspense fallback={
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="text-gray-400 font-medium animate-pulse">Initializing dashboard...</div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
