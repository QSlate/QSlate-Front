"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BacktestResult, BacktestMetrics, ChartDataPoint } from "../../types/backtest";
import { MetricWidget } from "../../components/widgets/MetricWidget";
import { AssetWidget } from "../../components/widgets/AssetWidget";
import { SymbolSearchModal } from "../../components/widgets/SymbolSearchModal";
import { calculateProgress } from "../../utils/metrics";
import { TradingViewChart } from "../../components/widgets/TradingViewChart";


const getMetricsFromSession = (): BacktestMetrics => {
    const defaultMetrics: BacktestMetrics = {
        sharpe: 0,
        fitness: 0,
        turnover: 0,
        drawdown: 0,
        returns: 0,
        margin: 0,
    };

    try {
        const sessionData = sessionStorage.getItem("latest_backtest");
        if (!sessionData) return defaultMetrics;

        const parsed = JSON.parse(sessionData);
        if (!parsed?.report) return defaultMetrics;

        const r = parsed.report;
        return {
            sharpe: Number(r.sharpe ?? r["Sharpe Ratio"] ?? 0),
            fitness: Number(r.fitness ?? r["Fitness Score"] ?? 0),
            turnover: Number(r.turnover ?? r["Turnover"] ?? r["Total Trades"] ?? 0),
            drawdown: Number(r.drawdown ?? r["Max Drawdown (%)"] ?? 0),
            returns: Number(r.returns ?? r["Returns (%)"] ?? 0),
            margin: Number(r.margin ?? r["Margin Util. (%)"] ?? 0),
        };
    } catch (error) {
        console.error("Failed to parse backtest data from session storage:", error);
        return defaultMetrics;
    }
};

const fetchChartData = async (symbol: string) => {
    try {
        const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${url}/api/data/${symbol}?limit=5`);

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
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setIsLoading(true);

            const { chartData, currentPrice, changePercent } = await fetchChartData(currentSymbol);
            const metrics = getMetricsFromSession();

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
        <div className="p-6 flex flex-col gap-6 h-full w-full">
            <SymbolSearchModal
                isOpen={isSymbolModalOpen}
                onClose={() => setIsSymbolModalOpen(false)}
                onSelectSymbol={handleSymbolChange}
            />

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Left Column - Chart */}
                <div className="xl:col-span-3">
                    <div className="bg-[#1E2229] rounded-xl h-full min-h-[500px] w-full overflow-hidden border border-gray-800/50 shadow-sm relative">
                        <TradingViewChart symbol={`${currentExchange}:${currentSymbol}`} />
                    </div>
                </div>

                {/* Right Column - Top Metrics */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                    <AssetWidget
                        asset={asset}
                        chartData={chartData}
                        onClick={() => setIsSymbolModalOpen(true)}
                    />
                    <MetricWidget
                        title="Sharpe Ratio"
                        value={metrics.sharpe.toFixed(2)}
                        visualType="segmented"
                        progressValue={calculateProgress(metrics.sharpe, -2, 3)}
                    />
                    <MetricWidget
                        title="Fitness Score"
                        value={metrics.fitness.toFixed(1)}
                        subValue="/ 5.0"
                        visualType="segmented"
                        progressValue={calculateProgress(metrics.fitness, -2, 5)}
                    />
                    <MetricWidget
                        title="Turnover"
                        value={`${metrics.turnover.toFixed(1)}%`}
                        visualType="progress"
                        progressValue={calculateProgress(metrics.turnover, 0, 100)}
                    />
                </div>
            </div>

            {/* Bottom Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricWidget
                    title="Max Drawdown"
                    value={`${Math.abs(metrics.drawdown).toFixed(2)}%`}
                    visualType="segmented"
                    progressValue={calculateProgress(Math.abs(metrics.drawdown), 0, 100, true)}
                />
                <MetricWidget
                    title="Total Returns"
                    value={`${metrics.returns.toFixed(2)}%`}
                    visualType="progress"
                    progressValue={calculateProgress(metrics.returns, 0, 80)}
                />
                <MetricWidget
                    title="Margin Utilization"
                    value={`${metrics.margin.toFixed(2)}%`}
                    visualType="progress"
                    progressValue={calculateProgress(metrics.margin, 0, 80)}
                />
            </div>
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
