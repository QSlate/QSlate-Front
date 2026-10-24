'use client';

import {
  ChevronDown,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { MARKET_TICKERS } from '@/entities/market';
import { useAppearance } from '@/shared/theme';

interface TickerSelectorProps {
  selectedTicker: string;
  onSelect: (ticker: string) => void;
}

export function TickerSelector({
  selectedTicker,
  onSelect,
}: TickerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, colorblindMode } = useAppearance();
  const isLight = theme === 'light';
  const isColorblind = colorblindMode === 'orange-blue';

  const currentTicker = useMemo(
    () =>
      MARKET_TICKERS.find((t) => t.symbol === selectedTicker) ??
      MARKET_TICKERS[0],
    [selectedTicker]
  );

  const categories = ['All', 'Crypto', 'Equity', 'Index', 'Futures'];

  const filteredTickers = useMemo(() => {
    return MARKET_TICKERS.filter((ticker) => {
      const matchesCategory =
        activeCategory === 'All' || ticker.category === activeCategory;
      const matchesSearch =
        ticker.symbol.toLowerCase().includes(search.toLowerCase()) ||
        ticker.name.toLowerCase().includes(search.toLowerCase()) ||
        ticker.exchange.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getPositiveColor = () => (isColorblind ? '#38BDF8' : '#10B981');
  const getNegativeColor = () => (isColorblind ? '#F59E0B' : '#F43F5E');

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded border transition-all font-mono text-xs shadow-xs group ${
          isLight
            ? 'bg-white hover:bg-zinc-50 border-zinc-300 text-zinc-900'
            : 'bg-[#121417] hover:bg-[#181b20] border-white/10 text-white'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Select instrument / ticker"
      >
        <span
          className={`font-semibold transition-colors ${
            isLight
              ? 'text-blue-600 group-hover:text-blue-700'
              : 'text-blue-400 group-hover:text-blue-300'
          }`}
        >
          {currentTicker.symbol}
        </span>
        <span className="text-zinc-400 text-[10px]">·</span>
        <span
          className={`font-medium ${isLight ? 'text-zinc-800' : 'text-zinc-300'}`}
        >
          $
          {currentTicker.basePrice.toLocaleString('en-US', {
            minimumFractionDigits: currentTicker.decimals,
            maximumFractionDigits: currentTicker.decimals,
          })}
        </span>
        <span
          className="text-[10px] font-semibold flex items-center gap-0.5"
          style={{
            color:
              currentTicker.change24hPercent >= 0
                ? getPositiveColor()
                : getNegativeColor(),
          }}
        >
          {currentTicker.change24hPercent >= 0 ? '+' : ''}
          {currentTicker.change24hPercent.toFixed(2)}%
        </span>
        <ChevronDown
          size={12}
          className={`text-zinc-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Modal/Popout */}
      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-1.5 w-76 sm:w-84 border rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col font-sans animate-in fade-in zoom-in-95 duration-150 ${
            isLight
              ? 'bg-white border-zinc-200 text-zinc-900'
              : 'bg-[#0a0c0e] border-[#242528] text-white'
          }`}
        >
          {/* Search Header */}
          <div
            className={`p-2.5 border-b ${
              isLight
                ? 'border-zinc-100 bg-zinc-50'
                : 'border-white/[0.06] bg-white/[0.01]'
            }`}
          >
            <div className="relative flex items-center">
              <Search
                size={13}
                className="absolute left-2.5 text-zinc-400 pointer-events-none"
              />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stocks, crypto, indices..."
                className={`w-full border rounded pl-8 pr-7 py-1.5 text-xs placeholder-zinc-400 focus:outline-hidden font-mono ${
                  isLight
                    ? 'bg-white border-zinc-300 text-zinc-900 focus:border-blue-500'
                    : 'bg-[#14161a] border-white/10 text-white placeholder-zinc-500 focus:border-blue-500'
                }`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 mt-2 overflow-x-auto scrollbar-none text-[10px] font-mono">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-blue-600 text-white font-medium'
                      : isLight
                        ? 'bg-zinc-200/70 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900'
                        : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Instruments List */}
          <div
            className={`max-h-64 overflow-y-auto divide-y p-1 ${
              isLight ? 'divide-zinc-100' : 'divide-white/[0.03]'
            }`}
            role="listbox"
          >
            {filteredTickers.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500 font-mono">
                No matching instruments found.
              </div>
            ) : (
              filteredTickers.map((ticker) => {
                const isSelected = ticker.symbol === selectedTicker;
                const isPositive = ticker.change24hPercent >= 0;
                return (
                  <button
                    key={ticker.symbol}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelect(ticker.symbol);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors font-mono ${
                      isSelected
                        ? isLight
                          ? 'bg-blue-50 border border-blue-200 text-blue-900'
                          : 'bg-blue-600/15 border border-blue-500/30 text-white'
                        : isLight
                          ? 'hover:bg-zinc-50 text-zinc-700'
                          : 'hover:bg-white/[0.04] text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold text-xs ${
                              isLight ? 'text-zinc-900' : 'text-white'
                            }`}
                          >
                            {ticker.symbol}
                          </span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded ${
                              isLight
                                ? 'bg-zinc-100 text-zinc-600'
                                : 'bg-white/[0.05] text-zinc-400'
                            }`}
                          >
                            {ticker.exchange}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] truncate font-sans ${
                            isLight ? 'text-zinc-500' : 'text-zinc-400'
                          }`}
                        >
                          {ticker.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 pl-2">
                      <span
                        className={`text-xs font-medium ${
                          isLight ? 'text-zinc-900' : 'text-white'
                        }`}
                      >
                        $
                        {ticker.basePrice.toLocaleString('en-US', {
                          minimumFractionDigits: ticker.decimals,
                          maximumFractionDigits: ticker.decimals,
                        })}
                      </span>
                      <span
                        className="text-[10px] flex items-center gap-0.5 font-semibold"
                        style={{
                          color: isPositive
                            ? getPositiveColor()
                            : getNegativeColor(),
                        }}
                      >
                        {isPositive ? (
                          <TrendingUp size={10} />
                        ) : (
                          <TrendingDown size={10} />
                        )}
                        {isPositive ? '+' : ''}
                        {ticker.change24hPercent.toFixed(2)}%
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Stats Footer */}
          <div
            className={`px-3 py-1.5 border-t flex items-center justify-between text-[9px] font-mono text-zinc-500 ${
              isLight
                ? 'bg-zinc-50 border-zinc-200'
                : 'bg-[#060708] border-white/[0.04]'
            }`}
          >
            <span className="flex items-center gap-1">
              <Sparkles size={10} className="text-blue-500" />
              <span>Deterministic Feed</span>
            </span>
            <span>Real-time L1 quotes</span>
          </div>
        </div>
      )}
    </div>
  );
}
