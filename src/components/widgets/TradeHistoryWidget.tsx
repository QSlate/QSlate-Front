import React from 'react';
import { Trade } from '../../types/backtest';
import { ArrowRight } from 'lucide-react';

interface TradeHistoryWidgetProps {
    trades?: Trade[];
}

export const TradeHistoryWidget: React.FC<TradeHistoryWidgetProps> = ({ trades = [] }) => {
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-[#0D0F14] border border-white/5 rounded-xl p-5 w-full h-full flex flex-col">
            <h3 className="text-sm text-gray-400 mb-4">Execution History</h3>

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

                            return (
                                <div key={index} className="border-b border-gray-800/50 py-3 flex justify-between items-center last:border-0">
                                    {/* Left */}
                                    <div className="flex flex-col items-start gap-1 min-w-max">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trade.type === 'LONG'
                                            ? 'bg-[#00E676]/10 text-[#00E676]'
                                            : 'bg-[#EF4444]/10 text-[#EF4444]'
                                            }`}>
                                            {trade.type}
                                        </span>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                            {formatDate(trade.exit_date || trade.entry_date)}
                                        </span>
                                    </div>

                                    {/* Center */}
                                    <div className="flex-1 flex justify-center items-center gap-1.5 min-w-0 px-2 overflow-hidden">
                                        <span className="text-sm text-white truncate">${trade.entry_price?.toFixed(2)}</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                        <span className="text-sm text-white truncate">${trade.exit_price?.toFixed(2)}</span>
                                    </div>

                                    {/* Right */}
                                    <div className="flex flex-col items-end gap-1 min-w-max">
                                        <span className={`text-sm font-bold ${pnlColor} whitespace-nowrap`}>
                                            {pnlSign} ${pnlValue}
                                        </span>
                                        {trade.exit_reason && (
                                            <span className="text-[10px] text-gray-500 truncate max-w-[80px]" title={trade.exit_reason}>
                                                {trade.exit_reason}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
