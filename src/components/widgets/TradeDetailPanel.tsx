"use client";

import React, { useEffect } from "react";
import { Trade } from "../../types/backtest";
import {
    X,
    TrendingUp,
    TrendingDown,
    Calendar,
    DollarSign,
    Target,
    ShieldAlert,
    Activity,
    BarChart2,
    Layers,
    ArrowRight,
    Clock,
} from "lucide-react";

interface TradeDetailPanelProps {
    trade: Trade | null;
    onClose: () => void;
}

const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
    });
};

const formatDuration = (entry?: string, exit?: string): string => {
    if (!entry || !exit) return "—";
    const ms = new Date(exit).getTime() - new Date(entry).getTime();
    if (ms <= 0) return "—";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
};

const getExitReasonColor = (reason?: string) => {
    if (!reason) return { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20" };
    const lower = reason.toLowerCase();
    if (lower.includes("stop") || lower.includes("sl")) return { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" };
    if (lower.includes("take") || lower.includes("tp") || lower.includes("profit")) return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" };
    if (lower.includes("timeout") || lower.includes("time")) return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" };
    return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" };
};

interface InfoRowProps {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    valueClass?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, valueClass }) => (
    <div className="flex items-center justify-between py-3.5 border-b border-white/5 last:border-0 group">
        <div className="flex items-center gap-3 text-gray-500">
            <span className="w-4 h-4 flex items-center justify-center opacity-70">{icon}</span>
            <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
        </div>
        <span className={`text-sm font-semibold ${valueClass ?? "text-white"}`}>{value}</span>
    </div>
);

export const TradeDetailPanel: React.FC<TradeDetailPanelProps> = ({ trade, onClose }) => {
    const isOpen = trade !== null;

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKey);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleKey);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!trade) return null;

    const isLong = trade.type === "long" || trade.type === "LONG";
    const isPositive = (trade.pnl_usd ?? 0) >= 0;
    const pnlColor = isPositive ? "text-emerald-400" : "text-red-400";
    const pnlBg = isPositive ? "bg-emerald-400/10" : "bg-red-400/10";
    const typeColor = isLong ? "text-emerald-400" : "text-red-400";
    const typeBg = isLong ? "bg-emerald-400/10" : "bg-red-400/10";
    const typeBorder = isLong ? "border-emerald-500/20" : "border-red-500/20";
    const exitReasonStyle = getExitReasonColor(trade.exit_reason);

    const pnlPercent =
        trade.entry_price
            ? ((((trade.exit_price ?? trade.entry_price) - trade.entry_price) / trade.entry_price) *
                (isLong ? 1 : -1) *
                (trade.leverage ?? 1) *
                100).toFixed(2)
            : null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                style={{ animation: "fadeIn 0.2s ease" }}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-md bg-[#0D0F14] border-l border-white/5 shadow-2xl"
                style={{ animation: "slideInRight 0.25s cubic-bezier(0.22, 1, 0.36, 1)" }}
                role="dialog"
                aria-modal="true"
                aria-label="Trade Details"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${typeBg} border ${typeBorder} flex items-center justify-center`}>
                            {isLong
                                ? <TrendingUp className={`w-4 h-4 ${typeColor}`} />
                                : <TrendingDown className={`w-4 h-4 ${typeColor}`} />
                            }
                        </div>
                        <div>
                            <p className="text-white font-bold text-base tracking-tight">Trade Details</p>
                            <p className="text-xs text-gray-500 mt-0.5 font-mono">{trade.id ?? "—"}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                        aria-label="Close panel"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* PnL Hero */}
                <div className={`mx-6 mt-6 mb-2 rounded-2xl ${pnlBg} border ${isPositive ? "border-emerald-500/15" : "border-red-500/15"} px-6 py-5`}>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Realized P&amp;L</p>
                    <div className="flex items-end gap-3">
                        <span className={`text-4xl font-bold tabular-nums ${pnlColor}`}>
                            {isPositive ? "+" : ""}
                            {(trade.pnl_usd ?? 0) >= 0 ? "" : "-"}$
                            {Math.abs(trade.pnl_usd ?? 0).toFixed(2)}
                        </span>
                        {pnlPercent && (
                            <span className={`text-sm font-semibold mb-1 ${pnlColor} opacity-80`}>
                                {isPositive ? "+" : ""}{pnlPercent}%
                            </span>
                        )}
                    </div>
                    <div className="flex gap-4 mt-3">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${typeBg} ${typeColor} ${typeBorder} uppercase tracking-wider`}>
                            {trade.type?.toUpperCase() ?? "—"}
                        </span>
                        {trade.status && (
                            <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg border bg-white/5 border-white/10 text-gray-400 uppercase tracking-wider">
                                {trade.status}
                            </span>
                        )}
                        {trade.exit_reason && (
                            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border ${exitReasonStyle.bg} ${exitReasonStyle.text} ${exitReasonStyle.border} uppercase tracking-wider`}>
                                {trade.exit_reason}
                            </span>
                        )}
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#2A2D35] hover:[&::-webkit-scrollbar-thumb]:bg-[#3A3D45] [&::-webkit-scrollbar-thumb]:rounded-full">

                    {/* Price Section */}
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1 mt-2">Price</p>
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl px-4 mb-5">
                        <div className="flex items-center justify-between py-4 border-b border-white/5">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Entry</span>
                                <span className="text-lg font-bold text-white tabular-nums">
                                    ${trade.entry_price?.toFixed(2) ?? "—"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3">
                                <div className="w-10 h-px bg-white/10" />
                                <ArrowRight className="w-4 h-4 text-gray-600" />
                                <div className="w-10 h-px bg-white/10" />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Exit</span>
                                <span className="text-lg font-bold text-white tabular-nums">
                                    ${trade.exit_price?.toFixed(2) ?? "—"}
                                </span>
                            </div>
                        </div>
                        {(trade.sl != null || trade.tp != null) && (
                            <div className="flex gap-0 divide-x divide-white/5 py-1">
                                {trade.sl != null && (
                                    <div className="flex-1 flex items-center gap-2 pr-4 py-2.5">
                                        <ShieldAlert className="w-3.5 h-3.5 text-red-400 opacity-70 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-gray-600">Stop Loss</p>
                                            <p className="text-sm font-semibold text-red-400 tabular-nums">${trade.sl.toFixed(2)}</p>
                                        </div>
                                    </div>
                                )}
                                {trade.tp != null && (
                                    <div className="flex-1 flex items-center gap-2 pl-4 py-2.5">
                                        <Target className="w-3.5 h-3.5 text-emerald-400 opacity-70 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-gray-600">Take Profit</p>
                                            <p className="text-sm font-semibold text-emerald-400 tabular-nums">${trade.tp.toFixed(2)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Execution Section */}
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1">Execution</p>
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl px-4 mb-5">
                        <InfoRow
                            icon={<Calendar className="w-3.5 h-3.5" />}
                            label="Entry Date"
                            value={<span className="font-mono text-xs">{formatDate(trade.entry_date)}</span>}
                        />
                        <InfoRow
                            icon={<Calendar className="w-3.5 h-3.5" />}
                            label="Exit Date"
                            value={<span className="font-mono text-xs">{formatDate(trade.exit_date)}</span>}
                        />
                        <InfoRow
                            icon={<Clock className="w-3.5 h-3.5" />}
                            label="Duration"
                            value={formatDuration(trade.entry_date, trade.exit_date)}
                        />
                    </div>

                    {/* Position Section */}
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1">Position</p>
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl px-4 mb-5">
                        {trade.size_usd != null && (
                            <InfoRow
                                icon={<DollarSign className="w-3.5 h-3.5" />}
                                label="Size (USD)"
                                value={`$${trade.size_usd.toLocaleString()}`}
                            />
                        )}
                        {trade.leverage != null && (
                            <InfoRow
                                icon={<Layers className="w-3.5 h-3.5" />}
                                label="Leverage"
                                value={`${trade.leverage}×`}
                            />
                        )}
                        {trade.timeout != null && (
                            <InfoRow
                                icon={<Activity className="w-3.5 h-3.5" />}
                                label="Timeout"
                                value={String(trade.timeout)}
                            />
                        )}
                    </div>

                    {/* Performance Section */}
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-1">Performance</p>
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl px-4 mb-2">
                        <InfoRow
                            icon={<BarChart2 className="w-3.5 h-3.5" />}
                            label="P&L (USD)"
                            value={
                                <span>
                                    {isPositive ? "+" : ""}${(trade.pnl_usd ?? 0).toFixed(2)}
                                </span>
                            }
                            valueClass={pnlColor}
                        />
                        {pnlPercent && (
                            <InfoRow
                                icon={<TrendingUp className="w-3.5 h-3.5" />}
                                label="Return"
                                value={`${isPositive ? "+" : ""}${pnlPercent}%`}
                                valueClass={pnlColor}
                            />
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-medium transition-all border border-white/5"
                    >
                        Close
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </>
    );
};
