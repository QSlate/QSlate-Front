"use client";

import { useState, useEffect } from "react";
import { BacktestResult } from "../../types/backtest";

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
        <pre className="p-4 text-white">{JSON.stringify(backtestData, null, 2)}</pre>
    );
}
