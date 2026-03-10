"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BacktestResult, BacktestMetrics, ChartDataPoint, Trade } from "../../types/backtest";
import { MetricWidget } from "../../components/widgets/MetricWidget";
import { AssetWidget } from "../../components/widgets/AssetWidget";
import { SymbolSearchModal } from "../../components/widgets/SymbolSearchModal";
import { calculateProgress } from "../../utils/metrics";
import { TradingViewChart } from "../../components/widgets/TradingViewChart";
import { TradeHistoryWidget } from "../../components/widgets/TradeHistoryWidget";
import { loadBacktestResult } from "../../hooks/useBacktestPersistence";
import { useTheme } from "../../hooks/useTheme";

import type { Layout, ResponsiveLayouts } from "react-grid-layout";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const WIDGET_REGISTRY = [
    { id: "chart", label: "Chart", icon: "📈", description: "TradingView interactive chart" },
    { id: "asset", label: "Asset", icon: "💎", description: "Current asset price & sparkline" },
    { id: "sharpe", label: "Sharpe Ratio", icon: "⚡", description: "Risk-adjusted return metric" },
    { id: "fitness", label: "Fitness Score", icon: "🎯", description: "Overall strategy performance" },
    { id: "turnover", label: "Turnover", icon: "🔄", description: "Portfolio activity rate" },
    { id: "drawdown", label: "Max Drawdown", icon: "📉", description: "Largest peak-to-trough decline" },
    { id: "returns", label: "Total Returns", icon: "💹", description: "Cumulative return %" },
    { id: "margin", label: "Margin Util.", icon: "🏦", description: "Margin utilization %" },
    { id: "netprofit", label: "Net Profit", icon: "💰", description: "Absolute profit in USD" },
    { id: "winrate", label: "Win Rate", icon: "🏆", description: "% of profitable trades" },
    { id: "trades", label: "Trade History", icon: "📋", description: "Full execution history" },
] as const;

type WidgetId = typeof WIDGET_REGISTRY[number]["id"];

const ALL_WIDGET_IDS: WidgetId[] = WIDGET_REGISTRY.map(w => w.id);

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
    ],
};

const getRawBacktestData = (): Record<string, unknown> | null => {
    try {
        const sessionData = sessionStorage.getItem("latest_backtest");
        if (sessionData) return JSON.parse(sessionData);
    } catch { /* empty */ }
    return loadBacktestResult();
};

const getMetricsFromSession = (): BacktestMetrics => {
    const defaultMetrics: BacktestMetrics = {
        sharpe: 0, fitness: 0, turnover: 0, drawdown: 0,
        returns: 0, margin: 0, winRate: 0, netProfit: 0,
    };
    try {
        const parsed = getRawBacktestData();
        if (!parsed?.report) return defaultMetrics;
        const r = parsed.report as Record<string, unknown>;
        const parseMetric = (val: unknown) => { const n = Number(val); return Number.isFinite(n) ? n : 0; };
        return {
            sharpe: parseMetric(r.sharpe ?? r["Sharpe Ratio"] ?? 0),
            fitness: parseMetric(r.fitness ?? r["Fitness Score"] ?? 0),
            turnover: parseMetric(r.turnover ?? r["Turnover"] ?? r["Total Trades"] ?? 0),
            drawdown: parseMetric(r.drawdown ?? r["Max Drawdown (%)"] ?? 0),
            returns: parseMetric(r.returns ?? r["Returns (%)"] ?? 0),
            margin: parseMetric(r.margin ?? r["Margin Util. (%)"] ?? 0),
            winRate: parseMetric(r.winRate ?? r["Win Rate (%)"] ?? 0),
            netProfit: r["Final Capital ($)"]
                ? parseMetric(r["Final Capital ($)"]) - parseMetric((parsed.config as Record<string, unknown>)?.initial_capital ?? 10000)
                : 0,
        };
    } catch (error) {
        console.error("Failed to parse backtest data:", error);
        return defaultMetrics;
    }
};

const fetchChartData = async (symbol: string) => {
    try {
        const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${url}/api/data/${symbol}?limit=10`);
        if (!res.ok) throw new Error("Failed to fetch chart data");
        const jsonData: ChartDataPoint[] = await res.json();
        if (!Array.isArray(jsonData) || jsonData.length === 0) return { chartData: [], currentPrice: 0, changePercent: 0 };
        const currentPrice = Number(jsonData[jsonData.length - 1].close) || 0;
        let changePercent = 0;
        if (jsonData.length >= 2) {
            const prevClose = Number(jsonData[jsonData.length - 2].close);
            if (prevClose) changePercent = ((currentPrice - prevClose) / prevClose) * 100;
        }
        return { chartData: jsonData, currentPrice, changePercent };
    } catch {
        return { chartData: [], currentPrice: 0, changePercent: 0 };
    }
};

function DragHandle() {
    return (
        <div
            className="drag-handle absolute top-3 right-3 z-50 flex items-center justify-center w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-all duration-150 backdrop-blur-sm"
            style={{
                background: "var(--interactive-active-bg)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-tertiary)",
            }}
            role="button" tabIndex={0} aria-label="Drag to reposition widget" title="Drag to reposition"
        >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="5" cy="4" r="1.5" /><circle cx="11" cy="4" r="1.5" />
                <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
                <circle cx="5" cy="12" r="1.5" /><circle cx="11" cy="12" r="1.5" />
            </svg>
        </div>
    );
}

interface WidgetPanelProps {
    isOpen: boolean;
    onClose: () => void;
    visibleWidgets: Set<WidgetId>;
    onToggle: (id: WidgetId) => void;
}

function WidgetPanel({ isOpen, onClose, visibleWidgets, onToggle }: WidgetPanelProps) {
    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                style={{ background: "var(--bg-modal-backdrop)" }}
                onClick={onClose}
            />

            {/* Slide-in panel */}
            <div
                className={`fixed top-0 right-0 h-full w-80 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
                style={{
                    background: "var(--bg-panel)",
                    borderLeft: "1px solid var(--border-default)",
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: "1px solid var(--border-default)" }}
                >
                    <div>
                        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                            Manage Widgets
                        </h2>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                            Show or hide dashboard panels
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={{
                            background: "var(--interactive-hover-bg)",
                            color: "var(--text-secondary)",
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = "var(--interactive-active-bg)";
                            (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = "var(--interactive-hover-bg)";
                            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                        }}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Badge count */}
                <div
                    className="px-5 py-3 flex items-center gap-2"
                    style={{ borderBottom: "1px solid var(--border-default)" }}
                >
                    <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                        {visibleWidgets.size} of {WIDGET_REGISTRY.length} visible
                    </span>
                    <div
                        className="flex-1 h-1 rounded-full overflow-hidden"
                        style={{ background: "var(--segment-bg)" }}
                    >
                        <div
                            className="h-full bg-gradient-to-r from-[#00FFB2]/60 to-[#00FFB2] rounded-full transition-all duration-500"
                            style={{ width: `${(visibleWidgets.size / WIDGET_REGISTRY.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Widget list */}
                <div className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-1.5">
                    {WIDGET_REGISTRY.map(widget => {
                        const isVisible = visibleWidgets.has(widget.id);
                        return (
                            <button
                                key={widget.id}
                                onClick={() => onToggle(widget.id)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group"
                                style={{
                                    background: isVisible ? "rgba(0,255,178,0.05)" : "var(--interactive-hover-bg)",
                                    border: isVisible ? "1px solid rgba(0,255,178,0.15)" : "1px solid var(--border-default)",
                                }}
                            >
                                <span className="text-xl leading-none select-none w-7 text-center">{widget.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div
                                        className="text-sm font-medium leading-none"
                                        style={{ color: isVisible ? "var(--text-primary)" : "var(--text-tertiary)" }}
                                    >
                                        {widget.label}
                                    </div>
                                    <div
                                        className="text-[10px] mt-0.5 truncate"
                                        style={{ color: "var(--text-muted)" }}
                                    >
                                        {widget.description}
                                    </div>
                                </div>
                                {/* Toggle */}
                                <div className={`w-9 h-5 rounded-full transition-all duration-200 flex items-center shrink-0 ${isVisible ? "bg-[#00FFB2]" : ""}`}
                                    style={!isVisible ? { background: "var(--segment-bg)" } : undefined}
                                >
                                    <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isVisible ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer actions */}
                <div
                    className="px-4 pb-5 pt-3 flex gap-2"
                    style={{ borderTop: "1px solid var(--border-default)" }}
                >
                    <button
                        onClick={() => ALL_WIDGET_IDS.forEach(id => !visibleWidgets.has(id) && onToggle(id))}
                        className="flex-1 text-xs py-2 rounded-lg transition-all"
                        style={{
                            background: "var(--interactive-hover-bg)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border-default)",
                        }}
                    >
                        Show all
                    </button>
                    <button
                        onClick={() => {
                            if (!visibleWidgets.has("chart")) onToggle("chart");
                            ALL_WIDGET_IDS.filter(id => id !== "chart").forEach(id => visibleWidgets.has(id) && onToggle(id));
                        }}
                        className="flex-1 text-xs py-2 rounded-lg transition-all"
                        style={{
                            background: "var(--interactive-hover-bg)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border-default)",
                        }}
                    >
                        Chart only
                    </button>
                </div>
            </div>
        </>
    );
}

function DashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { theme } = useTheme();

    const currentSymbol = searchParams.get("symbol") || "AAPL";
    const currentExchange = searchParams.get("exchange") || "NASDAQ";

    const [backtestData, setBacktestData] = useState<BacktestResult | null>(null);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [longCount, setLongCount] = useState<number>(0);
    const [shortCount, setShortCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);
    const [isWidgetPanelOpen, setIsWidgetPanelOpen] = useState(false);

    const [layouts, setLayouts] = useState<ResponsiveLayouts>(DEFAULT_LAYOUTS);
    const [mounted, setMounted] = useState(false);

    const [visibleWidgets, setVisibleWidgets] = useState<Set<WidgetId>>(new Set(ALL_WIDGET_IDS));

    useEffect(() => {
        setMounted(true);

        const savedLayouts = localStorage.getItem("qslate_lab_layouts_v6");
        if (savedLayouts) {
            try {
                const parsedLayouts = JSON.parse(savedLayouts);
                type RawLayout = { i: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number };
                Object.keys(parsedLayouts).forEach(bp => {
                    const bpLayout = parsedLayouts[bp] as RawLayout[];
                    const tradesItem = bpLayout.find(item => item.i === "trades");
                    if (tradesItem) tradesItem.minW = 1;
                    if (!bpLayout.find(item => item.i === "netprofit")) {
                        bpLayout.push({ i: "netprofit", x: 0, y: 10, w: 6, h: 2, minW: 2, minH: 2 });
                    }
                    if (!bpLayout.find(item => item.i === "winrate")) {
                        bpLayout.push({ i: "winrate", x: 6, y: 10, w: 6, h: 2, minW: 2, minH: 2 });
                    }
                });
                setLayouts(parsedLayouts);
            } catch (e) {
                console.error("Failed to parse saved layout", e);
            }
        }

        const savedVisibility = localStorage.getItem("qslate_widget_visibility");
        if (savedVisibility) {
            try {
                const parsed = JSON.parse(savedVisibility) as WidgetId[];
                setVisibleWidgets(new Set(parsed));
            } catch { /* ignore */ }
        }
    }, []);

    const toggleWidget = useCallback((id: WidgetId) => {
        setVisibleWidgets(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            try { localStorage.setItem("qslate_widget_visibility", JSON.stringify([...next])); } catch { /* ignore */ }
            return next;
        });
    }, []);

    const onLayoutChange = (currentLayout: Layout, allLayouts: ResponsiveLayouts) => {
        setLayouts(allLayouts);
        try { localStorage.setItem("qslate_lab_layouts_v6", JSON.stringify(allLayouts)); } catch { /* ignore */ }
    };

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            setIsLoading(true);
            setBacktestData(null);

            const { chartData, currentPrice, changePercent } = await fetchChartData(currentSymbol);
            const metrics = getMetricsFromSession();

            let loadedTrades: Trade[] = [];
            let loadedLongCount = 0;
            let loadedShortCount = 0;
            try {
                const parsed = getRawBacktestData();
                if (parsed) {
                    const tradesRaw = parsed?.trades ?? (parsed?.report as Record<string, unknown>)?.trades;
                    loadedTrades = Array.isArray(tradesRaw) ? tradesRaw as Trade[] : [];
                    const r = parsed.report as Record<string, unknown>;
                    if (r) {
                        const parseN = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
                        loadedLongCount = parseN(r["Long Count"] ?? r.long_count ?? 0);
                        loadedShortCount = parseN(r["Short Count"] ?? r.short_count ?? 0);
                    }
                }
            } catch (e) { console.error("Failed to parse trades", e); }

            if (isMounted) {
                setBacktestData({ asset: { symbol: currentSymbol, name: currentSymbol, currentPrice, changePercent }, metrics, chartData });
                setTrades(loadedTrades);
                setLongCount(loadedLongCount);
                setShortCount(loadedShortCount);
                setIsLoading(false);
            }
        };
        loadData();
        return () => { isMounted = false; };
    }, [currentSymbol]);

    const handleSymbolChange = (symbol: string, exchange: string) => {
        setIsSymbolModalOpen(false);
        router.push(`/lab?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}`);
    };

    if (isLoading && !backtestData) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 rounded-full border-2 border-[#00FFB2]/20 animate-ping" />
                        <div className="absolute inset-1 rounded-full border border-[#00FFB2]/40 animate-pulse" />
                    </div>
                    <p className="text-sm animate-pulse" style={{ color: "var(--text-tertiary)" }}>
                        Loading dashboard…
                    </p>
                </div>
            </div>
        );
    }

    if (!backtestData) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <p style={{ color: "var(--text-tertiary)" }}>No data available for {currentSymbol}.</p>
            </div>
        );
    }

    const { metrics, asset, chartData } = backtestData;
    const hiddenCount = ALL_WIDGET_IDS.length - visibleWidgets.size;

    const filteredLayouts: ResponsiveLayouts = {};
    Object.keys(layouts).forEach(bp => {
        const bpItems = layouts[bp];
        if (Array.isArray(bpItems)) {
            filteredLayouts[bp] = (bpItems as unknown as { i: string }[]).filter(item => visibleWidgets.has(item.i as WidgetId)) as unknown as Layout;
        }
    });

    return (
        <div className="flex flex-col h-full w-full">
            <SymbolSearchModal
                isOpen={isSymbolModalOpen}
                onClose={() => setIsSymbolModalOpen(false)}
                onSelectSymbol={handleSymbolChange}
            />

            <WidgetPanel
                isOpen={isWidgetPanelOpen}
                onClose={() => setIsWidgetPanelOpen(false)}
                visibleWidgets={visibleWidgets}
                onToggle={toggleWidget}
            />

            {/* ─── Toolbar ─── */}
            <header
                className="flex items-center justify-between px-6 h-12 shrink-0"
                style={{
                    background: "var(--bg-base)",
                    borderBottom: "1px solid var(--border-default)",
                }}
            >
                {/* Left: Symbol info */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSymbolModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all group"
                        style={{
                            background: "var(--bg-card-subtle)",
                            border: "1px solid var(--border-strong)",
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = "var(--interactive-hover-bg)";
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = "var(--bg-card-subtle)";
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
                        }}
                    >
                        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                            {currentSymbol}
                        </span>
                        <svg className="w-3 h-3 transition-colors" style={{ color: "var(--text-tertiary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {backtestData.asset.currentPrice > 0 && (
                        <>
                            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                ${backtestData.asset.currentPrice.toFixed(2)}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${backtestData.asset.changePercent >= 0
                                ? "text-[#00FFB2] bg-[#00FFB2]/10"
                                : "text-red-400 bg-red-500/10"
                                }`}>
                                {backtestData.asset.changePercent >= 0 ? "+" : ""}{backtestData.asset.changePercent.toFixed(2)}%
                            </span>
                        </>
                    )}

                    <span className="text-[11px] hidden md:block" style={{ color: "var(--text-muted)" }}>
                        {currentExchange}
                    </span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push("/script")}
                        className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-all"
                        style={{
                            color: "var(--text-tertiary)",
                            background: "var(--bg-card-subtle)",
                            border: "1px solid var(--border-strong)",
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
                        }}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Edit Strategy
                    </button>

                    <button
                        onClick={() => setIsWidgetPanelOpen(true)}
                        className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-all group"
                        style={{
                            color: "var(--text-secondary)",
                            background: "var(--bg-card-subtle)",
                            border: "1px solid var(--border-strong)",
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
                        }}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        Widgets
                        {hiddenCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-[#00FFB2]/15 text-[#00FFB2] text-[9px] font-bold flex items-center justify-center">
                                {hiddenCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* ─── Grid ─── */}
            {!mounted ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm animate-pulse" style={{ color: "var(--text-tertiary)" }}>
                        Initializing workspace…
                    </p>
                </div>
            ) : (
                <div className="flex-1 overflow-auto">
                    <ResponsiveGridLayout
                        className="layout"
                        layouts={filteredLayouts}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
                        rowHeight={55}
                        onLayoutChange={onLayoutChange}
                        draggableHandle=".drag-handle"
                        margin={[16, 16]}
                        containerPadding={[24, 20]}
                        useCSSTransforms={true}
                    >
                        {/* Chart */}
                        {visibleWidgets.has("chart") && (
                            <div
                                key="chart"
                                className="relative group rounded-xl overflow-hidden shadow-sm"
                                style={{ border: "1px solid var(--border-default)", background: "var(--bg-card)" }}
                            >
                                <DragHandle />
                                <TradingViewChart symbol={`${currentExchange}:${currentSymbol}`} theme={theme} />
                            </div>
                        )}

                        {/* Asset */}
                        {visibleWidgets.has("asset") && (
                            <div key="asset" className="relative group">
                                <DragHandle />
                                <AssetWidget asset={asset} chartData={chartData} onClick={() => setIsSymbolModalOpen(true)} />
                            </div>
                        )}

                        {/* Sharpe */}
                        {visibleWidgets.has("sharpe") && (
                            <div key="sharpe" className="relative group">
                                <DragHandle />
                                <MetricWidget
                                    title="Sharpe Ratio"
                                    value={metrics.sharpe.toFixed(2)}
                                    visualType="segmented"
                                    progressValue={calculateProgress(metrics.sharpe, -2, 3)}
                                    trend={metrics.sharpe >= 1 ? "up" : metrics.sharpe < 0 ? "down" : "neutral"}
                                    icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                                />
                            </div>
                        )}

                        {/* Fitness */}
                        {visibleWidgets.has("fitness") && (
                            <div key="fitness" className="relative group">
                                <DragHandle />
                                <MetricWidget
                                    title="Fitness Score"
                                    value={metrics.fitness.toFixed(1)}
                                    subValue="/ 5.0"
                                    visualType="segmented"
                                    progressValue={calculateProgress(metrics.fitness, -2, 5)}
                                    trend={metrics.fitness >= 2 ? "up" : metrics.fitness < 0 ? "down" : "neutral"}
                                    icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}
                                />
                            </div>
                        )}

                        {/* Turnover */}
                        {visibleWidgets.has("turnover") && (
                            <div key="turnover" className="relative group">
                                <DragHandle />
                                <MetricWidget
                                    title="Turnover"
                                    value={`${metrics.turnover.toFixed(1)}%`}
                                    visualType="progress"
                                    progressValue={calculateProgress(metrics.turnover, 0, 100)}
                                    trend="neutral"
                                    icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                                />
                            </div>
                        )}

                        {/* Drawdown */}
                        {visibleWidgets.has("drawdown") && (
                            <div key="drawdown" className="relative group">
                                <DragHandle />
                                <MetricWidget
                                    title="Max Drawdown"
                                    value={`${Math.abs(metrics.drawdown).toFixed(2)}%`}
                                    visualType="segmented"
                                    progressValue={calculateProgress(Math.abs(metrics.drawdown), 0, 100, true)}
                                    trend={Math.abs(metrics.drawdown) < 10 ? "up" : Math.abs(metrics.drawdown) > 30 ? "down" : "neutral"}
                                    icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
                                />
                            </div>
                        )}

                        {/* Returns */}
                        {visibleWidgets.has("returns") && (
                            <div key="returns" className="relative group">
                                <DragHandle />
                                <MetricWidget
                                    title="Total Returns"
                                    value={`${metrics.returns.toFixed(2)}%`}
                                    visualType="progress"
                                    progressValue={calculateProgress(metrics.returns, 0, 80)}
                                    trend={metrics.returns > 0 ? "up" : metrics.returns < 0 ? "down" : "neutral"}
                                    icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                                />
                            </div>
                        )}

                        {/* Margin */}
                        {visibleWidgets.has("margin") && (
                            <div key="margin" className="relative group">
                                <DragHandle />
                                <MetricWidget
                                    title="Margin Util."
                                    value={`${metrics.margin.toFixed(2)}%`}
                                    visualType="progress"
                                    progressValue={calculateProgress(metrics.margin, 0, 80)}
                                    trend={metrics.margin < 40 ? "up" : metrics.margin > 70 ? "down" : "neutral"}
                                    icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>}
                                />
                            </div>
                        )}

                        {/* Net Profit */}
                        {visibleWidgets.has("netprofit") && (
                            <div key="netprofit" className="relative group">
                                <DragHandle />
                                <MetricWidget
                                    title="Net Profit"
                                    value={metrics.netProfit >= 0 ? `+$${metrics.netProfit.toFixed(2)}` : `-$${Math.abs(metrics.netProfit).toFixed(2)}`}
                                    visualType="progress"
                                    progressValue={calculateProgress(metrics.netProfit, -10000, 10000)}
                                    trend={metrics.netProfit > 0 ? "up" : metrics.netProfit < 0 ? "down" : "neutral"}
                                    icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                />
                            </div>
                        )}

                        {/* Win Rate */}
                        {visibleWidgets.has("winrate") && (
                            <div key="winrate" className="relative group">
                                <DragHandle />
                                <MetricWidget
                                    title="Win Rate"
                                    value={`${metrics.winRate.toFixed(2)}%`}
                                    visualType="segmented"
                                    progressValue={calculateProgress(metrics.winRate, 0, 100)}
                                    trend={metrics.winRate >= 55 ? "up" : metrics.winRate < 40 ? "down" : "neutral"}
                                    icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
                                />
                            </div>
                        )}

                        {/* Trade History */}
                        {visibleWidgets.has("trades") && (
                            <div key="trades" className="relative group">
                                <DragHandle />
                                <TradeHistoryWidget trades={trades} longCount={longCount} shortCount={shortCount} />
                            </div>
                        )}
                    </ResponsiveGridLayout>
                </div>
            )}
        </div>
    );
}

export default function LabPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-10 h-10">
                        <div className="absolute inset-0 rounded-full border-2 border-[#00FFB2]/20 animate-ping" />
                        <div className="absolute inset-1 rounded-full border border-[#00FFB2]/40 animate-pulse" />
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                        Initializing dashboard…
                    </p>
                </div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
