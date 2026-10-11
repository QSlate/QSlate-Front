'use client';

export function DrawdownWidget() {
  const bars = [
    { height: 35, neg: false, label: 'J' },
    { height: 25, neg: true, label: 'F' },
    { height: 50, neg: true, label: 'M' },
    { height: 60, neg: false, label: 'A' },
    { height: 75, neg: false, label: 'M' },
    { height: 40, neg: false, label: 'J' },
    { height: 20, neg: true, label: 'J' },
    { height: 65, neg: false, label: 'A' },
    { height: 35, neg: true, label: 'S' },
    { height: 85, neg: false, label: 'O' },
    { height: 95, neg: false, label: 'N' },
    { height: 45, neg: false, label: 'D' },
  ];

  return (
    <div className="flex h-full flex-col justify-between p-4 bg-[#0a0c12]">
      <div className="flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-xl font-bold font-sans text-loss">-3.2%</span>
          <span className="ml-2 text-[10px] text-zinc-500 uppercase tracking-wider">
            WORST MONTH
          </span>
        </div>
        <span className="text-xs font-semibold text-gain">YTD +9.3%</span>
      </div>

      {/* 12 Monthly Bars */}
      <div className="flex items-end justify-between h-44 pt-4 px-1 gap-1.5">
        {bars.map((bar, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end h-full"
          >
            <div
              style={{ height: `${bar.height}%` }}
              className={`w-full rounded-xs transition-transform ${
                bar.neg ? 'bg-loss/85' : 'bg-gain/85'
              }`}
            />
            <span className="text-[9px] text-zinc-600 mt-1 select-none font-mono">
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
