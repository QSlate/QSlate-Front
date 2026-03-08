"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const SimpleCodeEditor = dynamic(
    () => import("@/components/widgets/SimpleCodeEditor"),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center w-full h-full text-gray-400 bg-[#0D0F14]">
                Loading editor...
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

const DEFAULT_CODE = `def custom_strategy(history, open_trades, remaining_capital):
    instructions = []
    current_price = history["Close"].iloc[-1]
    if len(open_trades) == 0 and remaining_capital >= 1000:
        instructions.append({
            "action": "OPEN",
            "type": "long",
            "size_usd": 1000,
            "sl": current_price * 0.98,
            "tp": current_price * 1.05
        })
    return instructions`;

export default function ScriptPage() {
    const router = useRouter();

    const [assets, setAssets] = useState<SearchSymbol[]>([]);
    const [selectedTicker, setSelectedTicker] = useState("");
    const [capital, setCapital] = useState("10000.0");
    const [windowLimit, setWindowLimit] = useState("10");
    const [editorContent, setEditorContent] = useState(DEFAULT_CODE);

    const [isRunning, setIsRunning] = useState(false);
    const [isLoadingAssets, setIsLoadingAssets] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        let isMounted = true;

        const fetchAssets = async () => {
            try {
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
                        setSelectedTicker(normalized[0].symbol);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch symbols:", error);
                if (isMounted) setErrorMsg("Could not load asset list. Please try again.");
            } finally {
                if (isMounted) setIsLoadingAssets(false);
            }
        };

        fetchAssets();

        return () => { isMounted = false; };
    }, []);

    const handleRunBacktest = async () => {
        if (!selectedTicker) return;

        setIsRunning(true);
        setErrorMsg("");

        try {
            const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

            const payload = {
                ticker: selectedTicker,
                initial_capital: parseFloat(capital) || 10000.0,
                window: parseInt(windowLimit, 10) || 10,
                indicators: ["SMA_20", "RSI_14"],
                strategy_code: editorContent,
                strategy_function_name: "custom_strategy",
            };

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
            sessionStorage.setItem("latest_backtest", JSON.stringify(data));

            router.push(`/lab?symbol=${encodeURIComponent(selectedTicker)}`);
        } catch (error: any) {
            console.error("Backtest execution error:", error);
            setErrorMsg(error.message || "An unexpected error occurred during execution.");
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-80px)] w-full">
            {/* Settings Panel */}
            <div className="col-span-1 bg-[#0D0F14] border border-white/5 rounded-xl p-5 flex flex-col gap-5 shadow-sm">
                <div className="border-b border-gray-800 pb-3">
                    <h2 className="text-xl font-semibold text-white">Strategy Parameters</h2>
                    <p className="text-sm text-gray-400 mt-1">Configure your backtest settings</p>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-300">Target Asset</label>
                    <div className="relative">
                        <select
                            value={selectedTicker}
                            onChange={(e) => setSelectedTicker(e.target.value)}
                            disabled={isLoadingAssets}
                            className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-2.5 text-white outline-none focus:border-[#00FFB2] focus:ring-1 focus:ring-[#00FFB2]/30 transition-all appearance-none disabled:opacity-50"
                        >
                            {isLoadingAssets && <option value="">Loading assets...</option>}
                            {!isLoadingAssets && assets.length === 0 && <option value="">No assets available</option>}
                            {assets.map((asset, idx) => {
                                const symbolValue = typeof asset === "string" ? asset : asset.symbol;
                                return (
                                    <option key={idx} value={symbolValue}>
                                        {symbolValue}
                                    </option>
                                );
                            })}
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-300">Initial Capital (USD)</label>
                    <input
                        type="number"
                        value={capital}
                        onChange={(e) => setCapital(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-2.5 text-white outline-none focus:border-[#00FFB2] focus:ring-1 focus:ring-[#00FFB2]/30 transition-all"
                        step="100"
                        min="1"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-300">Window Limit</label>
                    <input
                        type="number"
                        value={windowLimit}
                        onChange={(e) => setWindowLimit(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700/80 rounded-lg px-3 py-2.5 text-white outline-none focus:border-[#00FFB2] focus:ring-1 focus:ring-[#00FFB2]/30 transition-all"
                        min="1"
                    />
                </div>

                <div className="mt-auto pt-6 flex flex-col gap-3">
                    {errorMsg && (
                        <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-lg border border-red-500/20 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                            {errorMsg}
                        </div>
                    )}
                    <button
                        onClick={handleRunBacktest}
                        disabled={isRunning || !selectedTicker || isLoadingAssets}
                        className="w-full bg-[#00FFB2] hover:bg-[#00e6a0] disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-[#100F13] font-bold py-3.5 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,178,0.2)] disabled:shadow-none"
                    >
                        {isRunning ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Running Backtest...
                            </>
                        ) : (
                            "Execute Strategy"
                        )}
                    </button>
                </div>
            </div>

            {/* Editor Panel */}
            <div className="col-span-1 lg:col-span-2 bg-[#0D0F14] rounded-xl flex flex-col overflow-hidden border border-white/5 shadow-sm">
                <div className="bg-white/5 px-5 py-3 border-b border-white/5 font-mono flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[#00FFB2] font-bold">{'</>'}</span>
                        <span className="text-gray-300 text-sm font-medium">strategy.py</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                        <span className="bg-gray-900 text-gray-400 px-2 py-1 rounded">Python 3</span>
                    </div>
                </div>
                <div className="flex-grow relative">
                    <SimpleCodeEditor
                        code={editorContent}
                        onChange={(value) => setEditorContent(value)}
                    />
                </div>
            </div>
        </div>
    );
}
