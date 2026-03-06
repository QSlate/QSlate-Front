"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BacktestResult } from "../../types/backtest";
import { MetricWidget } from "../../components/widgets/MetricWidget";
import { AssetWidget } from "../../components/widgets/AssetWidget";
import { SymbolSearchModal } from "../../components/widgets/SymbolSearchModal";
import { calculateProgress } from "../../utils/metrics";
import { TradingViewChart } from "../../components/widgets/TradingViewChart";

const fetchMockBacktestData = async (symbol: string): Promise<BacktestResult> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const getAssetInfo = (sym: string) => {
                switch (sym) {
                    case "AAPL": return { name: "Apple Inc.", price: 196.26, change: 2.69 };
                    case "AMZN": return { name: "Amazon.com, Inc.", price: 178.50, change: 1.45 };
                    case "GOOGL": return { name: "Alphabet Inc.", price: 145.20, change: -0.32 };
                    case "MSFT": return { name: "Microsoft Corporation", price: 415.50, change: 1.25 };
                    case "TSLA": return { name: "Tesla, Inc.", price: 202.64, change: -1.75 };
                    case "NVDA": return { name: "NVIDIA Corporation", price: 822.79, change: 3.54 };
                    case "META": return { name: "Meta Platforms, Inc.", price: 485.58, change: 0.82 };
                    case "BTCUSD": return { name: "Bitcoin / Dollar", price: 65432.10, change: 5.4 };
                    case "ETHUSD": return { name: "Ethereum / Dollar", price: 3456.78, change: 4.2 };
                    case "SOLUSD": return { name: "Solana / Dollar", price: 145.67, change: 8.9 };
                    default: return { name: `${sym} Asset`, price: 100.00, change: 0.00 };
                }
            };

            const info = getAssetInfo(symbol);

            let assetData = {
                symbol: symbol,
                name: info.name,
                currentPrice: info.price,
                changePercent: info.change,
            };

            resolve({
                asset: assetData,
                metrics: {
                    sharpe: 1.11,
                    fitness: 0.88,
                    turnover: 25.66,
                    drawdown: 9.64,
                    returns: 16.57,
                    margin: 8.70,
                },
                chartData: [
                    { time: "2023-12-18", open: 175, high: 182, low: 174, close: 181 },
                    { time: "2023-12-25", open: 181, high: 183, low: 178, close: 180 },
                    { time: "2024-01-01", open: 180, high: 185, low: 178, close: 184 },
                    { time: "2024-01-08", open: 184, high: 190, low: 182, close: 189 },
                    { time: "2024-01-15", open: 188, high: 195, low: 187, close: 192 },
                    { time: "2024-01-22", open: 191, high: 198, low: 186, close: 186.26 },
                ],
            });
        }, 500);
    });
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
        const loadData = async () => {
            setIsLoading(true);
            setBacktestData(null);
            try {
                const data = await fetchMockBacktestData(currentSymbol);
                setBacktestData(data);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [currentSymbol]);

    const handleSymbolChange = (symbol: string, exchange: string) => {
        setIsSymbolModalOpen(false);
        router.push("/lab?symbol=" + encodeURIComponent(symbol) + "&exchange=" + encodeURIComponent(exchange));
    };

    if (isLoading && !backtestData) {
        return <div className="p-4 text-white">Loading data...</div>;
    }

    if (!backtestData) {
        return <div className="p-4 text-white">No data available.</div>;
    }

    return (
        <div className="p-6 flex flex-col gap-6">
            <SymbolSearchModal
                isOpen={isSymbolModalOpen}
                onClose={() => setIsSymbolModalOpen(false)}
                onSelectSymbol={handleSymbolChange}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column (3 cols) */}
                <div className="lg:col-span-3">
                    <div className="bg-[#1E2229] rounded-xl h-full min-h-[500px] w-full overflow-hidden border border-gray-800">
                        <TradingViewChart symbol={`${currentExchange}:${currentSymbol}`} />
                    </div>
                </div>

                {/* Right Column (1 col) */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <AssetWidget asset={backtestData.asset} chartData={backtestData.chartData} onClick={() => setIsSymbolModalOpen(true)} />
                    <MetricWidget title="Sharpe" value={backtestData.metrics.sharpe} visualType="segmented" progressValue={calculateProgress(backtestData.metrics.sharpe, -2, 3)} />
                    <MetricWidget title="Fitness" value={backtestData.metrics.fitness} subValue="/ 3" visualType="segmented" progressValue={calculateProgress(backtestData.metrics.fitness, -2, 3)} />
                    <MetricWidget title="Turnover" value={`${backtestData.metrics.turnover} %`} visualType="progress" progressValue={calculateProgress(backtestData.metrics.turnover, 0, 100)} />
                </div>
            </div>

            {/* Bottom Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricWidget title="Drawdown" value={`${backtestData.metrics.drawdown} %`} visualType="segmented" progressValue={calculateProgress(backtestData.metrics.drawdown, 0, 100, true)} />
                <MetricWidget title="Returns" value={`${backtestData.metrics.returns} %`} visualType="progress" progressValue={calculateProgress(backtestData.metrics.returns, 0, 100)} />
                <MetricWidget title="Margin" value={`${backtestData.metrics.margin} %`} visualType="progress" progressValue={calculateProgress(backtestData.metrics.margin, 0, 100)} />
            </div>
        </div>
    );
}

export default function LabPage() {
    return (
        <Suspense fallback={<div className="p-6 text-white">Loading dashboard...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
