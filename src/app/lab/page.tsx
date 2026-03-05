"use client";

import { useState, useEffect } from "react";
import { BacktestResult } from "../../types/backtest";
import { MetricWidget } from "../../components/widgets/MetricWidget";
import { AssetWidget } from "../../components/widgets/AssetWidget";
import { calculateProgress } from "../../utils/metrics";
import { TradingViewChart } from "../../components/widgets/TradingViewChart";

const fetchMockBacktestData = async (): Promise<BacktestResult> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                asset: {
                    symbol: "AAPL",
                    name: "Apple Inc.",
                    currentPrice: 196.26,
                    changePercent: 2.69,
                },
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
                    { time: "2024-01-22", open: 191, high: 198, low: 190, close: 196.26 },
                ],
            });
        }, 500);
    });
};

export default function LabPage() {
    const [backtestData, setBacktestData] = useState<BacktestResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchMockBacktestData();
                setBacktestData(data);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    if (isLoading) {
        return <div className="p-4 text-white">Loading data...</div>;
    }

    if (!backtestData) {
        return <div className="p-4 text-white">No data available.</div>;
    }
    return (
        <div className="p-6 flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column (3 cols) */}
                <div className="lg:col-span-3">
                    <div className="bg-[#1E2229] rounded-xl h-full min-h-[500px] w-full overflow-hidden border border-gray-800">
                        <TradingViewChart symbol="NASDAQ:AAPL" />
                    </div>
                </div>

                {/* Right Column (1 col) */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <AssetWidget asset={backtestData.asset} chartData={backtestData.chartData} />
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
