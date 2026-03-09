import React, { useState } from 'react';
import { Trade } from '../../types/backtest';
import { ArrowRight, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { TradeDetailPanel } from './TradeDetailPanel';

interface TradeHistoryWidgetProps {
    trades?: Trade[];
    longCount?: number;
    shortCount?: number;
}

export const TradeHistoryWidget: React.FC<TradeHistoryWidgetProps> = ({ trades = [], longCount = 0, shortCount = 0 }) => {
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    };

    const total = longCount + shortCount;
    const longPct = total > 0 ? Math.round((longCount / total) * 100) : 0;
    const shortPct = total > 0 ? 100 - longPct : 0;
    const showBreakdown = total > 0;

    return (
        <>
            <div className="bg-[#0D0F14] border border-white/5 rounded-xl p-5 w-full h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm text-gray-400">Execution History</h3>
                    {showBreakdown && (
                        <div className="flex items-center gap-2">
                            {/* Long pill */}
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00E676]/10 border border-[#00E676]/20">
                                <TrendingUp className="w-3 h-3 text-[#00E676]" />
                                <span className="text-[11px] font-semibold text-[#00E676]">{longCount}</span>
                                <span className="text-[10px] text-[#00E676]/60">L</span>
                            </div>
                            {/* Short pill */}
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/20">
                                <TrendingDown className="w-3 h-3 text-[#EF4444]" />
                                <span className="text-[11px] font-semibold text-[#EF4444]">{shortCount}</span>
                                <span className="text-[10px] text-[#EF4444]/60">S</span>
                            </div>
                        </div>
                    )}
                </div>
                {/* Long/Short split bar */}
                {showBreakdown && (
                    <div className="mb-4">
                        <div className="flex rounded-full overflow-hidden h-1.5 bg-white/5">
                            <div
                                className="h-full bg-gradient-to-r from-[#00E676]/80 to-[#00E676] transition-all duration-500"
                                style={{ width: `${longPct}%` }}
                            />
                            <div
                                className="h-full bg-gradient-to-r from-[#EF4444] to-[#EF4444]/80 transition-all duration-500"
                                style={{ width: `${shortPct}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-gray-500">{longPct}% long</span>
                            <span className="text-[10px] text-gray-500">{shortPct}% short</span>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#2A2D35] hover:[&::-webkit-scrollbar-thumb]:bg-[#3A3D45] [&::-webkit-scrollbar-thumb]:rounded-full">
                    {!trades || trades.length === 0 ? (
                        <div className="text-gray-500 text-center py-4 flex items-center justify-center h-full">
                            No trades executed yet.
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {trades.map((trade, index) => {
                                const isPositive = (trade.pnl_usd || 0) >= 0;
                                const pnlSign = isPositive ? '+' : '-';
                                const pnlValue = Math.abs(trade.pnl_usd || 0).toFixed(2);
                                const pnlColor = isPositive ? 'text-[#00E676]' : 'text-[#EF4444]';
                                const isLong = trade.type === 'LONG' || trade.type === 'long';

                                return (
                                    <div
                                        key={trade.id ?? index}
                                        className="border-b border-gray-800/50 py-3 flex justify-between items-center last:border-0 cursor-pointer hover:bg-white/[0.03] rounded-lg px-2 -mx-2 transition-colors group/row"
                                        onClick={() => setSelectedTrade(trade)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && setSelectedTrade(trade)}
                                        aria-label={`View details for ${trade.type} trade`}
                                    >
                                        {/* Left */}
                                        <div className="flex flex-col items-start gap-1 min-w-max">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isLong
                                                ? 'bg-[#00E676]/10 text-[#00E676]'
                                                : 'bg-[#EF4444]/10 text-[#EF4444]'
                                                }`}>
                                                {trade.type?.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                {formatDate(trade.exit_date || trade.entry_date)}
                                            </span>
                                        </div>

                                        {/* Center */}
                                        <div className="flex-1 flex justify-center items-center gap-1.5 min-w-0 px-2 overflow-hidden">
                                            <span className="text-sm text-white truncate">${trade.entry_price?.toFixed(2)}</span>
                                            <ArrowRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                            <span className="text-sm text-white truncate">
                                                {trade.exit_price != null ? `$${trade.exit_price.toFixed(2)}` : '—'}
                                            </span>
                                        </div>

                                        {/* Right */}
                                        <div className="flex items-center gap-2 min-w-max">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`text-sm font-bold ${pnlColor} whitespace-nowrap`}>
                                                    {pnlSign} ${pnlValue}
                                                </span>
                                                {trade.exit_reason && (
                                                    <span className="text-[10px] text-gray-500 truncate max-w-[80px]" title={trade.exit_reason}>
                                                        {trade.exit_reason}
                                                    </span>
                                                )}
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <TradeDetailPanel
                trade={selectedTrade}
                onClose={() => setSelectedTrade(null)}
            />
        </>
    );
};
