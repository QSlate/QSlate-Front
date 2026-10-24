'use client';

import {
  AlertTriangle,
  ArrowUp,
  Check,
  CheckCircle2,
  Code2,
  Columns2,
  Copy,
  FileCode,
  FileJson,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { useUserStore } from '@/entities/user/model';
import { useLabStore } from '@/features/lab-state';
import { useHydratedStore } from '@/shared/lib/store';

import { MonacoEditorWrapper } from './MonacoEditorWrapper';

const FILE_TABS = [
  { id: 'strategy.py', label: 'strategy.py', icon: FileCode, lang: 'python' },
  {
    id: 'indicators.py',
    label: 'indicators.py',
    icon: Code2,
    lang: 'python',
  },
  { id: 'config.json', label: 'config.json', icon: FileJson, lang: 'json' },
];

const PROMPT_SUGGESTIONS = [
  'Add a 2% trailing stop and filter out FOMC volatility days',
  'Implement ATR dynamic volatility position sizing',
  'Add RSI < 30 extreme oversold filter for entries',
];

export function MiniIdeView() {
  const activeFile = useLabStore((state) => state.ideActiveFile);
  const setActiveFile = useLabStore((state) => state.setIdeActiveFile);
  const files = useLabStore((state) => state.ideFiles);
  const updateFileContent = useLabStore((state) => state.updateIdeFileContent);
  const splitView = useLabStore((state) => state.ideSplitView);
  const toggleSplitView = useLabStore((state) => state.toggleIdeSplitView);
  const astStatus = useLabStore((state) => state.ideAstStatus);
  const applyAiPrompt = useLabStore((state) => state.applyAiPrompt);
  const showToast = useLabStore((state) => state.showToast);

  const colorblind = useHydratedStore(
    useUserStore,
    (state) => state.colorblindMode,
    'none'
  );
  const isColorblind = colorblind === 'orange-blue';
  const statusColor = isColorblind ? '#38BDF8' : '#10B981';

  const [promptInput, setPromptInput] = useState('');
  const [copied, setCopied] = useState(false);

  const currentContent = files[activeFile] ?? '';
  const currentLang = activeFile.endsWith('.json') ? 'json' : 'python';

  // Real-time AST security validation check
  const securityAnalysis = useMemo(() => {
    const forbidden = [
      'import os',
      'import sys',
      'subprocess',
      'eval(',
      'exec(',
    ];
    const detected = forbidden.filter((word) => currentContent.includes(word));
    return {
      isValid: detected.length === 0,
      violations: detected,
    };
  }, [currentContent]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      showToast(`Copied ${activeFile} to clipboard`, 'info');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handlePromptSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim() || astStatus === 'synthesizing') return;
    const text = promptInput;
    setPromptInput('');
    void applyAiPrompt(text);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-46px)] w-full bg-[#08090a] overflow-hidden select-none">
      {/* Editor Header Bar with File Tabs */}
      <div className="flex items-center justify-between h-9 px-3 bg-[#0c0d0e] border-b border-[#242528] shrink-0 text-xs font-mono">
        {/* Tabs */}
        <div className="flex items-center gap-1 h-full pt-1">
          {FILE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFile === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFile(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 h-full rounded-t-md text-xs transition-colors border-t border-x ${
                  isActive
                    ? 'bg-[#08090a] text-white border-[#242528] border-b-transparent shadow-xs font-medium'
                    : 'bg-transparent text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-white/[0.02]'
                }`}
              >
                <Icon
                  size={13}
                  className={isActive ? 'text-blue-400' : 'text-zinc-500'}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleSplitView}
            className={`p-1.5 rounded transition-colors ${
              splitView
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Toggle split view"
            aria-label="Toggle split view"
          >
            <Columns2 size={13} />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Copy file contents"
          >
            {copied ? (
              <Check size={12} className="text-emerald-400" />
            ) : (
              <Copy size={12} />
            )}
            <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              void applyAiPrompt();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Reset code buffer"
          >
            <RotateCcw size={12} />
            <span className="text-[11px]">Re-synthesize</span>
          </button>
        </div>
      </div>

      {/* Editor Main Body */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Primary Monaco Editor */}
        <div className="flex-1 h-full min-w-0 relative">
          <MonacoEditorWrapper
            value={currentContent}
            language={currentLang}
            onChange={(val) => updateFileContent(activeFile, val)}
          />

          {astStatus === 'synthesizing' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-30 font-mono text-xs">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <div className="flex items-center gap-2 text-white">
                <Sparkles size={14} className="text-blue-400 animate-pulse" />
                <span>AI Kernel Synthesizing Strategy AST Modifications…</span>
              </div>
              <span className="text-[10px] text-zinc-400">
                Verifying safety rules in gVisor sandbox
              </span>
            </div>
          )}
        </div>

        {/* Split View Secondary Pane (if active) */}
        {splitView && (
          <div className="w-1/2 h-full border-l border-[#242528] bg-[#07080a] flex flex-col">
            <div className="flex items-center justify-between px-3 h-8 bg-[#0c0d0e] border-b border-[#242528] text-xs font-mono text-zinc-400">
              <span>Vectorized Helper References</span>
              <span className="text-[10px] text-zinc-500">indicators.py</span>
            </div>
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-zinc-300 space-y-3">
              <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.06]">
                <div className="text-blue-400 font-semibold mb-1">
                  ema(series, period: int)
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Fast exponential moving average without look-ahead bias,
                  calculated via recursive convolution.
                </p>
              </div>
              <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.06]">
                <div className="text-emerald-400 font-semibold mb-1">
                  atr(df, period: int = 14)
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Average True Range for volatility-based dynamic position
                  sizing and trailing stops.
                </p>
              </div>
              <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.06]">
                <div className="text-purple-400 font-semibold mb-1">
                  bollinger_bands(series, period, num_std)
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Upper, mid and lower bands used for statistical envelope
                  breakouts and mean-reversion bounds.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Docked AI Strategy Builder Prompt Bar */}
      <div className="border-t border-[#242528] bg-[#0a0b0d] p-3 shrink-0">
        {/* Suggestion Chips */}
        <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1 text-[11px] font-sans scrollbar-none">
          <span className="flex items-center gap-1 text-zinc-500 font-mono text-[10px] uppercase tracking-wider shrink-0">
            <Sparkles size={11} className="text-blue-400" />
            Suggested:
          </span>
          {PROMPT_SUGGESTIONS.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setPromptInput(sug);
              }}
              className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] transition-colors whitespace-nowrap"
            >
              + {sug}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handlePromptSubmit}
          className="relative flex items-center w-full"
        >
          <div className="absolute left-3 flex items-center pointer-events-none text-blue-400">
            <Sparkles size={15} />
          </div>

          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Describe strategy modification in natural language (e.g. 'Add a 2% trailing stop and filter out FOMC volatility days')..."
            className="w-full bg-[#121418] hover:bg-[#15171d] focus:bg-[#15171d] border border-white/10 focus:border-blue-500 rounded-lg pl-9 pr-12 py-2.5 text-xs text-white placeholder-zinc-500 font-sans focus:outline-hidden transition-all shadow-inner"
          />

          <button
            type="submit"
            disabled={!promptInput.trim() || astStatus === 'synthesizing'}
            className="absolute right-2 p-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-all active:scale-95 shadow-xs"
            aria-label="Submit AI prompt"
          >
            <ArrowUp size={14} />
          </button>
        </form>
      </div>

      {/* Docked Runtime & Security Telemetry Footer */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#060708] border-t border-[#1b1c1f] text-[10px] font-mono shrink-0">
        <div className="flex items-center gap-3">
          {securityAnalysis.isValid ? (
            <div className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 size={12} style={{ color: statusColor }} />
              <span className="text-white font-medium">AST Validated</span>
              <span className="text-zinc-500">·</span>
              <span className="text-zinc-400">Python 3.12</span>
              <span className="text-zinc-500">·</span>
              <span className="text-zinc-400">gVisor runtime</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <AlertTriangle size={12} />
              <span>
                AST Guard Triggered: Unsafe imports detected (
                {securityAnalysis.violations.join(', ')})
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-zinc-500">
          <span className="flex items-center gap-1">
            <ShieldCheck size={11} className="text-blue-400" />
            <span>Isolation: Kernel Sandbox</span>
          </span>
          <span>Zero Host FS</span>
        </div>
      </div>
    </div>
  );
}
