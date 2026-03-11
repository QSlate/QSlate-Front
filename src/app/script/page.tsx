"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    saveScriptState,
    loadScriptState,
    saveBacktestResult,
} from "@/hooks/useBacktestPersistence";
import { useTheme } from "@/hooks/useTheme";

const SimpleCodeEditor = dynamic(
    () => import("@/components/widgets/SimpleCodeEditor"),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center w-full h-full" style={{ background: "#0D0F14" }}>
                <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin w-5 h-5 text-[#00FFB2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-gray-500">Loading editor...</span>
                </div>
            </div>
        )
    }
);

interface SearchSymbol {
    symbol: string;
    name?: string;
    exchange?: string;
    type?: string;
}

interface LogEntry {
    type: "info" | "success" | "error" | "warning";
    message: string;
    timestamp: string;
}

const DEFAULT_CODE = `def custom_strategy(history, open_trades, remaining_capital):
    """
    QSlate Strategy — customize your trading logic below.
    
    Args:
        history: pandas DataFrame with OHLCV + indicators (SMA_20, RSI_14, etc.)
        open_trades: list of currently open trade dicts
        remaining_capital: float, available capital in USD
    
    Returns:
        list of instruction dicts with keys: action, type, size_usd, sl, tp
    """
    instructions = []
    current_price = history["Close"].iloc[-1]
    rsi = history["RSI_14"].iloc[-1] if "RSI_14" in history.columns else 50

    # Example: RSI-based long entry
    if len(open_trades) == 0 and remaining_capital >= 1000 and rsi < 35:
        instructions.append({
            "action": "OPEN",
            "type": "long",
            "size_usd": 1000,
            "sl": current_price * 0.98,   # Stop loss at -2%
            "tp": current_price * 1.05    # Take profit at +5%
        })

    return instructions`;

const DEFAULT_STATS_CODE = `def calc_avg_win(df, init_cap):
    if df.empty:
        return 0.0
    winning_trades = df[df['pnl_usd'] > 0]
    if winning_trades.empty:
        return 0.0
    return winning_trades['pnl_usd'].mean()

def calc_custom_score(df, init_cap):
    if df.empty:
        return 0.0
    ret = (df['pnl_usd'].sum() / init_cap) * 100
    return ret * 1.5
`;

const INDICATORS = ["SMA_20", "RSI_14", "EMA_50", "MACD", "BB_20"];

function formatTimestamp(): string {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function ScriptPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [assets, setAssets] = useState<SearchSymbol[]>([]);
    const [selectedTicker, setSelectedTicker] = useState("");
    const [capital, setCapital] = useState("10000.0");
    const [windowLimit, setWindowLimit] = useState("10");
    const [editorContent, setEditorContent] = useState(DEFAULT_CODE);
    const [selectedIndicators, setSelectedIndicators] = useState<string[]>(["SMA_20", "RSI_14"]);

    const [customStatsCode, setCustomStatsCode] = useState(DEFAULT_STATS_CODE);
    const [customStatsNames, setCustomStatsNames] = useState("calc_avg_win, calc_custom_score");
    const [activeTab, setActiveTab] = useState<"strategy.py" | "custom_stats.py">("strategy.py");

    const [isRunning, setIsRunning] = useState(false);
    const [isLoadingAssets, setIsLoadingAssets] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [isRestored, setIsRestored] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isOutputOpen, setIsOutputOpen] = useState(false);
    const [lineCount, setLineCount] = useState(DEFAULT_CODE.split("\n").length);
    const [runDuration, setRunDuration] = useState<number | null>(null);

    const logsEndRef = useRef<HTMLDivElement>(null);
    const runStartRef = useRef<number>(0);

    const addLog = useCallback((type: LogEntry["type"], message: string) => {
        setLogs(prev => [...prev, { type, message, timestamp: formatTimestamp() }]);
    }, []);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    useEffect(() => {
        const saved = loadScriptState();
        if (saved) {
            if (saved.code) { setEditorContent(saved.code); setLineCount(saved.code.split("\n").length); }
            if (saved.capital) setCapital(saved.capital);
            if (saved.windowLimit) setWindowLimit(saved.windowLimit);
            if (saved.customStatsCode) setCustomStatsCode(saved.customStatsCode);
            if (saved.customStatsNames) setCustomStatsNames(saved.customStatsNames);
            setIsRestored(true);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "strategy.py") {
            setLineCount(editorContent.split("\n").length);
        } else {
            setLineCount(customStatsCode.split("\n").length);
        }
    }, [activeTab, editorContent, customStatsCode]);

    useEffect(() => {
        let isMounted = true;

        const fetchAssets = async () => {
            try {
                addLog("info", "Connecting to QSlate API...");
                const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
                const response = await fetch(`${url}/api/assets`);

                if (!response.ok) throw new Error("Failed to fetch assets");

                const data = await response.json();
                if (isMounted && Array.isArray(data)) {
                    const normalized = data.map(item => {
                        if (typeof item === "string") {
                            return { symbol: item, name: item, exchange: "UNKNOWN", type: "UNKNOWN" };
                        }
                        return {
                            symbol: item.symbol || "",
                            name: item.name || item.symbol || "",
                            exchange: item.exchange || "UNKNOWN",
                            type: item.type || "UNKNOWN"
                        };
                    });
                    setAssets(normalized);
                    if (normalized.length > 0) {
                        const saved = loadScriptState();
                        const restoredTicker = saved?.ticker && normalized.some(a => a.symbol === saved.ticker)
                            ? saved.ticker
                            : normalized[0].symbol;
                        setSelectedTicker(restoredTicker);
                        addLog("success", `Loaded ${normalized.length} assets. Ready to execute.`);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch symbols:", error);
                if (isMounted) {
                    setErrorMsg("Could not load asset list. Please try again.");
                    addLog("error", "Failed to connect to QSlate API. Is the server running?");
                }
            } finally {
                if (isMounted) setIsLoadingAssets(false);
            }
        };

        fetchAssets();
        return () => { isMounted = false; };
    }, [addLog]);

    const toggleIndicator = (ind: string) => {
        setSelectedIndicators(prev =>
            prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
        );
    };

    const handleRunBacktest = useCallback(async () => {
        if (!selectedTicker || isRunning) return;

        setIsRunning(true);
        setErrorMsg("");
        setIsOutputOpen(true);
        runStartRef.current = Date.now();
        setRunDuration(null);

        addLog("info", `▶ Starting backtest for ${selectedTicker}`);
        addLog("info", `  Initial capital: $${parseFloat(capital).toLocaleString()}`);
        addLog("info", `  Window: ${windowLimit} periods`);
        addLog("info", `  Indicators: ${selectedIndicators.join(", ") || "none"}`);

        try {
            const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

            const payload = {
                ticker: selectedTicker,
                initial_capital: parseFloat(capital) || 10000.0,
                window: parseInt(windowLimit, 10) || 10,
                indicators: selectedIndicators,
                strategy_code: editorContent,
                strategy_function_name: "custom_strategy",
                custom_stats_code: customStatsCode,
                custom_stats_names: customStatsNames.split(",").map(n => n.trim()).filter(Boolean),
            };

            addLog("info", "Sending strategy to execution engine...");

            const response = await fetch(`${url}/api/backtest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || `Execution failed: ${response.statusText}`);
            }

            const data = await response.json();
            const elapsed = ((Date.now() - runStartRef.current) / 1000).toFixed(2);
            setRunDuration(parseFloat(elapsed));

            data.config = {
                initial_capital: parseFloat(capital) || 10000.0,
                ticker: selectedTicker,
                window: parseInt(windowLimit, 10) || 10
            };

            saveScriptState({ code: editorContent, ticker: selectedTicker, capital, windowLimit, customStatsCode, customStatsNames });
            saveBacktestResult(data);
            sessionStorage.setItem("latest_backtest", JSON.stringify(data));

            const report = data?.report as Record<string, unknown> | undefined;
            if (report) {
                addLog("success", `✓ Backtest completed in ${elapsed}s`);
                if (report["Total Trades"]) addLog("success", `  Total trades: ${report["Total Trades"]}`);
                if (report["Win Rate (%)"]) addLog("success", `  Win rate: ${Number(report["Win Rate (%)"]).toFixed(2)}%`);
                if (report["Returns (%)"]) addLog("success", `  Returns: ${Number(report["Returns (%)"]).toFixed(2)}%`);
            } else {
                addLog("success", `✓ Backtest completed in ${elapsed}s`);
            }

            addLog("info", "Redirecting to Lab dashboard...");

            setTimeout(() => {
                router.push(`/lab?symbol=${encodeURIComponent(selectedTicker)}`);
            }, 800);
        } catch (error: unknown) {
            const elapsed = ((Date.now() - runStartRef.current) / 1000).toFixed(2);
            const msg = error instanceof Error ? error.message : "An unexpected error occurred during execution.";
            console.error("Backtest execution error:", error);
            setErrorMsg(msg);
            addLog("error", `✗ Execution failed after ${elapsed}s`);
            addLog("error", `  ${msg}`);
        } finally {
            setIsRunning(false);
        }
    }, [selectedTicker, isRunning, capital, windowLimit, selectedIndicators, editorContent, customStatsCode, customStatsNames, addLog, router]);

    // Keyboard shortcut: Cmd+Enter / Ctrl+Enter
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleRunBacktest();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handleRunBacktest]);

    const logColors: Record<LogEntry["type"], string> = {
        info: "text-gray-400",
        success: "text-[#00FFB2]",
        error: "text-red-400",
        warning: "text-yellow-400",
    };

    return (
        <div
            className="flex h-[calc(100vh-64px)] w-full overflow-hidden"
            style={{ background: "var(--bg-base)" }}
        >
            {/* ─── Left Sidebar: Config ─── */}
            <aside
                className="w-72 shrink-0 flex flex-col overflow-y-auto"
                style={{
                    background: "var(--bg-card)",
                    borderRight: "1px solid var(--border-default)",
                }}
            >
                {/* Header */}
                <div
                    className="px-5 py-4"
                    style={{ borderBottom: "1px solid var(--border-default)" }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#00FFB2]/10 border border-[#00FFB2]/20 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-[#00FFB2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                            </div>
                            <div>
                                <h2
                                    className="text-sm font-semibold leading-none"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    Parameters
                                </h2>
                                <p
                                    className="text-[10px] mt-0.5"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    Backtest configuration
                                </p>
                            </div>
                        </div>
                        {isRestored && (
                            <span className="flex items-center gap-1 text-[10px] text-[#00FFB2] bg-[#00FFB2]/10 border border-[#00FFB2]/20 rounded-full px-2 py-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00FFB2] inline-block animate-pulse" />
                                Restored
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-1 px-4 py-5 flex flex-col gap-5">
                    {/* Asset */}
                    <div className="flex flex-col gap-2">
                        <label
                            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-8-5v5m-3 3h18a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v14a1 1 0 001 1z" />
                            </svg>
                            Asset
                        </label>
                        <div className="relative">
                            <select
                                value={selectedTicker}
                                onChange={(e) => setSelectedTicker(e.target.value)}
                                disabled={isLoadingAssets}
                                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none appearance-none disabled:opacity-40 cursor-pointer transition-all"
                                style={{
                                    background: "var(--bg-base)",
                                    border: "1px solid var(--border-default)",
                                    color: "var(--text-primary)",
                                }}
                                onFocus={e => (e.target as HTMLSelectElement).style.borderColor = "rgba(0,255,178,0.5)"}
                                onBlur={e => (e.target as HTMLSelectElement).style.borderColor = "var(--border-default)"}
                            >
                                {isLoadingAssets && <option value="">Loading assets...</option>}
                                {!isLoadingAssets && assets.length === 0 && <option value="">No assets available</option>}
                                {assets.map((asset, idx) => (
                                    <option key={idx} value={asset.symbol}>{asset.symbol}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                {isLoadingAssets ? (
                                    <svg className="animate-spin w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-3.5 h-3.5" style={{ color: "var(--text-tertiary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Capital */}
                    <div className="flex flex-col gap-2">
                        <label
                            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Initial Capital
                        </label>
                        <div className="relative">
                            <span
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                                style={{ color: "var(--text-tertiary)" }}
                            >
                                $
                            </span>
                            <input
                                type="number"
                                value={capital}
                                onChange={(e) => setCapital(e.target.value)}
                                className="w-full rounded-lg pl-7 pr-3 py-2.5 text-sm outline-none transition-all"
                                style={{
                                    background: "var(--bg-base)",
                                    border: "1px solid var(--border-default)",
                                    color: "var(--text-primary)",
                                }}
                                onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(0,255,178,0.5)"}
                                onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border-default)"}
                                step="1000"
                                min="1"
                            />
                        </div>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            Starting balance for your simulation
                        </p>
                    </div>

                    {/* Window */}
                    <div className="flex flex-col gap-2">
                        <label
                            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Window Limit
                        </label>
                        <input
                            type="number"
                            value={windowLimit}
                            onChange={(e) => setWindowLimit(e.target.value)}
                            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                            style={{
                                background: "var(--bg-base)",
                                border: "1px solid var(--border-default)",
                                color: "var(--text-primary)",
                            }}
                            onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(0,255,178,0.5)"}
                            onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border-default)"}
                            min="1"
                        />
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            Periods of history per decision step
                        </p>
                    </div>

                    {/* Indicators */}
                    <div className="flex flex-col gap-2">
                        <label
                            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Indicators
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {INDICATORS.map(ind => {
                                const isActive = selectedIndicators.includes(ind);
                                return (
                                    <button
                                        key={ind}
                                        onClick={() => toggleIndicator(ind)}
                                        className="text-[11px] font-mono px-2.5 py-1 rounded-md border transition-all"
                                        style={isActive ? {
                                            background: "rgba(0,255,178,0.08)",
                                            border: "1px solid rgba(0,255,178,0.30)",
                                            color: "#00FFB2",
                                        } : {
                                            background: "var(--bg-base)",
                                            border: "1px solid var(--border-default)",
                                            color: "var(--text-tertiary)",
                                        }}
                                    >
                                        {ind}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            Available in <span className="font-mono" style={{ color: "var(--text-tertiary)" }}>history.columns</span>
                        </p>
                    </div>

                    {/* Custom Stats Names */}
                    <div className="flex flex-col gap-2">
                        <label
                            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            Custom Stats Names
                        </label>
                        <input
                            type="text"
                            value={customStatsNames}
                            onChange={(e) => setCustomStatsNames(e.target.value)}
                            placeholder="e.g. calc_avg_win, calc_custom_score"
                            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                            style={{
                                background: "var(--bg-base)",
                                border: "1px solid var(--border-default)",
                                color: "var(--text-primary)",
                            }}
                            onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(0,255,178,0.5)"}
                            onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border-default)"}
                        />
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                            Comma-separated list of functions in custom_stats.py
                        </p>
                    </div>
                </div>

                {/* Run Button */}
                <div className="px-4 pb-4 flex flex-col gap-3">
                    {errorMsg && (
                        <div className="text-red-400 text-xs p-3 bg-red-500/8 rounded-lg border border-red-500/15 flex items-start gap-2">
                            <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="leading-relaxed">{errorMsg}</span>
                        </div>
                    )}

                    <button
                        id="run-backtest-btn"
                        onClick={handleRunBacktest}
                        disabled={isRunning || !selectedTicker || isLoadingAssets}
                        className="w-full relative overflow-hidden bg-[#00FFB2] hover:bg-[#00e6a0] text-[#0a0a0a] font-bold text-sm py-3 rounded-xl transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(0,255,178,0.15)] group disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                        {isRunning ? (
                            <>
                                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Running...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                                </svg>
                                Execute Strategy
                            </>
                        )}
                    </button>

                    <p className="text-center text-[10px]" style={{ color: "var(--text-muted)" }}>
                        <kbd
                            className="px-1.5 py-0.5 text-[9px] rounded font-mono"
                            style={{
                                background: "var(--interactive-hover-bg)",
                                border: "1px solid var(--border-default)",
                                color: "var(--text-tertiary)",
                            }}
                        >
                            ⌘
                        </kbd>{" "}
                        <kbd
                            className="px-1.5 py-0.5 text-[9px] rounded font-mono"
                            style={{
                                background: "var(--interactive-hover-bg)",
                                border: "1px solid var(--border-default)",
                                color: "var(--text-tertiary)",
                            }}
                        >
                            ↵
                        </kbd>{" "}
                        to run
                    </p>
                </div>
            </aside>

            {/* ─── Main Editor Area ─── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Editor Tab Bar */}
                <div
                    className="flex items-center shrink-0"
                    style={{
                        background: isDark ? "#0D0F14" : "var(--bg-card)",
                        borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid var(--border-default)",
                    }}
                >
                    {/* File tab */}
                    <div
                        className="flex items-center gap-0"
                        style={{ borderRight: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid var(--border-default)" }}
                    >
                        <div
                            role="button"
                            onClick={() => setActiveTab("strategy.py")}
                            className="flex items-center gap-2 px-4 py-2.5 relative cursor-pointer"
                            style={{
                                background: activeTab === "strategy.py" ? (isDark ? "#050505" : "var(--bg-base)") : (isDark ? "#0D0F14" : "var(--bg-card)"),
                                borderTop: activeTab === "strategy.py" ? "2px solid #00FFB2" : "2px solid transparent",
                                opacity: activeTab === "strategy.py" ? 1 : 0.6,
                            }}
                        >
                            <svg className="w-3.5 h-3.5 text-[#4B9CD3]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                                <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span
                                className="text-xs font-mono"
                                style={{ color: isDark ? "#D1D5DB" : "var(--text-primary)" }}
                            >
                                strategy.py
                            </span>
                            {activeTab === "strategy.py" && <div className="w-1.5 h-1.5 rounded-full bg-[#00FFB2] opacity-70 ml-0.5" title="Active" />}
                        </div>
                        <div
                            role="button"
                            onClick={() => setActiveTab("custom_stats.py")}
                            className="flex items-center gap-2 px-4 py-2.5 relative cursor-pointer"
                            style={{
                                background: activeTab === "custom_stats.py" ? (isDark ? "#050505" : "var(--bg-base)") : (isDark ? "#0D0F14" : "var(--bg-card)"),
                                borderTop: activeTab === "custom_stats.py" ? "2px solid #EAB308" : "2px solid transparent",
                                opacity: activeTab === "custom_stats.py" ? 1 : 0.6,
                            }}
                        >
                            <svg className="w-3.5 h-3.5 text-[#EAB308]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                                <polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span
                                className="text-xs font-mono"
                                style={{ color: isDark ? "#D1D5DB" : "var(--text-primary)" }}
                            >
                                custom_stats.py
                            </span>
                            {activeTab === "custom_stats.py" && <div className="w-1.5 h-1.5 rounded-full bg-[#EAB308] opacity-70 ml-0.5" title="Active" />}
                        </div>
                    </div>

                    {/* Right side actions */}
                    <div className="ml-auto flex items-center gap-2 px-4">
                        <div
                            className="flex items-center gap-1 text-[10px] font-mono rounded px-2 py-1"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.05)" : "var(--interactive-hover-bg)",
                                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid var(--border-default)",
                                color: isDark ? "#6B7280" : "var(--text-tertiary)",
                            }}
                        >
                            <span className="text-[#4B9CD3]">Python</span>
                            <span className="text-gray-700">·</span>
                            <span>UTF-8</span>
                        </div>
                        {runDuration !== null && !isRunning && (
                            <div className="flex items-center gap-1 text-[10px] text-[#00FFB2] bg-[#00FFB2]/8 border border-[#00FFB2]/20 rounded px-2 py-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                {runDuration}s
                            </div>
                        )}
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-hidden relative">
                    <div className="absolute inset-0">
                        <SimpleCodeEditor
                            code={activeTab === "strategy.py" ? editorContent : customStatsCode}
                            theme={theme}
                            onChange={(value) => {
                                if (activeTab === "strategy.py") {
                                    setEditorContent(value);
                                } else {
                                    setCustomStatsCode(value);
                                }
                            }}
                        />
                    </div>
                    {/* Running overlay */}
                    {isRunning && (
                        <div className="absolute inset-0 bg-[#050505]/70 backdrop-blur-[2px] flex items-center justify-center z-10 pointer-events-none">
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative w-12 h-12">
                                    <div className="absolute inset-0 rounded-full border-2 border-[#00FFB2]/20 animate-ping" />
                                    <div className="absolute inset-0 rounded-full border-2 border-[#00FFB2]/40 animate-pulse" />
                                    <div className="absolute inset-2 rounded-full bg-[#00FFB2]/10 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-[#00FFB2]" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-sm text-[#00FFB2] font-medium">Executing strategy...</p>
                                <p className="text-xs text-gray-500">This may take a few seconds</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Bottom Output Panel ─── */}
                <div
                    className={`shrink-0 flex flex-col transition-all duration-300 ${isOutputOpen ? "h-48" : "h-9"}`}
                    style={{
                        background: isDark ? "#0D0F14" : "var(--bg-card)",
                        borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid var(--border-default)",
                    }}
                >
                    {/* Panel header */}
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setIsOutputOpen(v => !v)}
                        onKeyDown={(e) => e.key === "Enter" && setIsOutputOpen(v => !v)}
                        className="flex items-center gap-3 px-4 h-9 w-full text-left transition-colors shrink-0 cursor-pointer select-none"
                        style={{ color: "var(--text-tertiary)" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--interactive-hover-bg)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                    >
                        <svg
                            className={`w-3 h-3 transition-transform duration-200 ${isOutputOpen ? "rotate-0" : "-rotate-90"}`}
                            style={{ color: "var(--text-muted)" }}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Output</span>
                        <div className="flex items-center gap-2 ml-auto">
                            {logs.some(l => l.type === "error") && (
                                <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                                    Error
                                </span>
                            )}
                            {logs.some(l => l.type === "success") && !logs.some(l => l.type === "error") && (
                                <span className="flex items-center gap-1 text-[10px] text-[#00FFB2] bg-[#00FFB2]/10 border border-[#00FFB2]/20 rounded-full px-2 py-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FFB2] inline-block" />
                                    Done
                                </span>
                            )}
                            {logs.length > 0 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setLogs([]); }}
                                    className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors px-1"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Log entries */}
                    {isOutputOpen && (
                        <div
                            className="flex-1 overflow-y-auto px-4 pb-3 font-mono text-xs"
                            style={{
                                scrollbarWidth: "thin",
                                scrollbarColor: "rgba(255,255,255,0.08) transparent",
                            }}
                        >
                            {logs.length === 0 ? (
                                <p className="text-gray-600 py-2">No output yet. Run your strategy to see results.</p>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className="flex items-start gap-3 py-0.5">
                                        <span className="text-gray-700 shrink-0 select-none">{log.timestamp}</span>
                                        <span className={logColors[log.type]}>{log.message}</span>
                                    </div>
                                ))
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    )}
                </div>

                {/* ─── Status Bar ─── */}
                <div
                    className="flex items-center justify-between px-4 h-6 shrink-0"
                    style={{
                        background: isDark ? "#0a0a0f" : "var(--bg-card)",
                        borderTop: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid var(--border-default)",
                    }}
                >
                    <div
                        className="flex items-center gap-4 text-[10px]"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFB2] inline-block" />
                            QSlate IDE
                        </span>
                        <span className="font-mono">{lineCount} lines</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-gray-600 font-mono">
                        {selectedTicker && <span className="text-gray-500">{selectedTicker}</span>}
                        <span>${parseFloat(capital).toLocaleString()}</span>
                        <span>W:{windowLimit}</span>
                        <span>Python 3</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
