export interface BacktestMetrics {
    sharpe: number;
    fitness: number;
    turnover: number;
    drawdown: number;
    returns: number;
    margin: number;
    winRate: number;
    netProfit: number;
}

export interface Trade {
    type: "LONG" | "SHORT";
    entry_date: string;
    exit_date?: string;
    entry_price: number;
    exit_price: number;
    pnl_usd: number;
    exit_reason?: string;
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
    trades?: Trade[];
}
