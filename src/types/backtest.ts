export interface BacktestMetrics {
    sharpe: number;
    fitness: number;
    turnover: number;
    drawdown: number;
    returns: number;
    margin: number;
}

export interface AssetInfo {
    symbol: string;
    name: string;
    currentPrice: number;
    changePercent: number;
}

export interface ChartDataPoint {
    time: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
}

export interface BacktestResult {
    asset: AssetInfo;
    metrics: BacktestMetrics;
    chartData: ChartDataPoint[];
}
