import React from 'react';

export interface MetricWidgetProps {
    title: string;
    value: string | number;
    subValue?: string;
    visualType?: 'none' | 'progress' | 'segmented';
    progressValue?: number;
    trend?: 'up' | 'down' | 'neutral';
}

export const MetricWidget: React.FC<MetricWidgetProps> = ({
    title,
    value,
    subValue,
    visualType = 'none',
    progressValue = 0,
    trend = 'neutral',
}) => {
    return (
        <div className="bg-[#18171E] border border-[#211F28] rounded-xl p-5 flex flex-col justify-between h-full w-full">
            <div>
                <h3 className="text-sm text-gray-400 mb-1">{title}</h3>
                <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-white">{value}</span>
                    {trend === 'up' && <span className="text-[#00FFB2] text-sm font-bold">▲</span>}
                    {trend === 'down' && <span className="text-red-500 text-sm font-bold">▼</span>}
                    {trend === 'neutral' && <span className="text-gray-500 text-sm font-bold">-</span>}
                    {subValue && <span className="text-lg text-gray-500">{subValue}</span>}
                </div>
            </div>

            {visualType !== 'none' && (
                <div className="mt-4">
                    {visualType === 'progress' && (
                        <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div
                                className="bg-blue-500 h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${Math.min(Math.max(progressValue, 0), 100)}%` }}
                            />
                        </div>
                    )}

                    {visualType === 'segmented' && (
                        <div className="relative w-full h-1.5 rounded-full flex overflow-hidden">
                            <div className="bg-red-500 h-full flex-1" />
                            <div className="bg-orange-500 h-full flex-1" />
                            <div className="bg-yellow-500 h-full flex-1" />
                            <div className="bg-green-500 h-full flex-1" />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3.5 bg-white rounded-full shadow-sm"
                                style={{ left: `clamp(0px, calc(${Math.min(Math.max(progressValue, 0), 100)}% - 3px), calc(100% - 6px))` }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
