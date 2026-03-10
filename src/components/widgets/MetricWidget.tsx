import React from 'react';

export interface MetricWidgetProps {
    title: string;
    value: string | number;
    subValue?: string;
    visualType?: 'none' | 'progress' | 'segmented';
    progressValue?: number;
    trend?: 'up' | 'down' | 'neutral';
    icon?: React.ReactNode;
}

export const MetricWidget: React.FC<MetricWidgetProps> = ({
    title,
    value,
    subValue,
    visualType = 'none',
    progressValue = 0,
    trend = 'neutral',
    icon,
}) => {
    const safeProgress = Number.isFinite(progressValue) ? progressValue : 0;
    const clampedProgress = Math.min(Math.max(safeProgress, 0), 100);

    const accentColor =
        trend === 'up' ? '#00FFB2' :
            trend === 'down' ? '#EF4444' :
                '#6366f1';

    const glowColor =
        trend === 'up' ? 'rgba(0,255,178,0.12)' :
            trend === 'down' ? 'rgba(239,68,68,0.12)' :
                'rgba(99,102,241,0.12)';

    const trendIcon =
        trend === 'up' ? (
            <svg className="w-3 h-3" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
        ) : trend === 'down' ? (
            <svg className="w-3 h-3" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
        ) : null;

    return (
        <div
            className="relative rounded-xl p-4 flex flex-col justify-between h-full w-full overflow-hidden group transition-all duration-200"
            style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                boxShadow: `inset 0 1px 0 var(--card-inset)`,
            }}
        >
            {/* Top accent line on hover */}
            <div
                className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }}
            />

            {/* Corner glow */}
            <div
                className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-40"
                style={{ background: glowColor }}
            />

            {/* Header */}
            <div className="flex items-start justify-between relative z-10">
                <div className="flex flex-col gap-0.5">
                    <span
                        className="text-[11px] font-medium uppercase tracking-widest leading-none"
                        style={{ color: "var(--text-tertiary)" }}
                    >
                        {title}
                    </span>
                </div>
                {icon && (
                    <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: glowColor, border: `1px solid ${accentColor}25` }}
                    >
                        <span style={{ color: accentColor }} className="opacity-80">
                            {icon}
                        </span>
                    </div>
                )}
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-1.5 mt-2 relative z-10">
                <span
                    className="text-2xl font-bold tracking-tight leading-none"
                    style={{ color: "var(--text-primary)" }}
                >
                    {value}
                </span>
                {subValue && (
                    <span
                        className="text-sm font-medium"
                        style={{ color: "var(--text-tertiary)" }}
                    >
                        {subValue}
                    </span>
                )}
                {trendIcon && (
                    <span className="ml-auto flex items-center">{trendIcon}</span>
                )}
            </div>

            {/* Visual bar */}
            {visualType !== 'none' && (
                <div className="mt-3 relative z-10">
                    {visualType === 'progress' && (
                        <div
                            className="relative w-full h-1 rounded-full overflow-hidden"
                            style={{ background: "var(--segment-bg)" }}
                        >
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                    width: `${clampedProgress}%`,
                                    background: `linear-gradient(90deg, ${accentColor}80, ${accentColor})`,
                                    boxShadow: `0 0 8px ${accentColor}60`,
                                }}
                            />
                        </div>
                    )}

                    {visualType === 'segmented' && (
                        <div
                            className="relative w-full h-1 rounded-full flex overflow-hidden"
                        >
                            <div className="h-full flex-1 bg-[#EF4444]/70" />
                            <div className="h-full flex-1 bg-[#F97316]/70" />
                            <div className="h-full flex-1 bg-[#EAB308]/70" />
                            <div className="h-full flex-1 bg-[#00FFB2]/70" />
                            {/* Glowing thumb */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-2 h-2.5 rounded-full shadow-lg transition-all duration-700"
                                style={{
                                    left: `clamp(0px, calc(${clampedProgress}% - 4px), calc(100% - 8px))`,
                                    background: 'white',
                                    boxShadow: '0 0 6px rgba(255,255,255,0.8)',
                                }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
