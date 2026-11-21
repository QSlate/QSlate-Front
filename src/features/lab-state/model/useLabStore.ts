'use client';

import { create } from 'zustand';

import { MOCK_STRATEGIES } from '@/entities/strategy';
import type {
  Diagnostic,
  MarketplaceItem,
  StrategyVersion,
} from '@/shared/api';

export type LabTab = 'workspace' | 'ide' | 'marketplace' | 'runs' | 'settings';

export interface ToastNotice {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export interface LabState {
  activeTab: LabTab;
  isAddWidgetDrawerOpen: boolean;
  ideActiveFile: string;
  ideFiles: Record<string, string>;
  ideAstStatus: 'valid' | 'synthesizing' | 'invalid';
  ideSplitView: boolean;
  marketplaceSearch: string;
  marketplaceCategory: string;
  installedMarketplaceIds: string[];
  reviewingItem: MarketplaceItem | null;
  toast: ToastNotice | null;

  // Live strategy state & versioning
  strategyId: string | null;
  versionId: string | null;
  strategyRevision: number;
  strategyName: string;
  strategyDiagnostics: Diagnostic[];
  isLinting: boolean;
  isVersionDrawerOpen: boolean;
  strategyVersions: StrategyVersion[];
  loadedBacktestId: string | null;
  isExecutionLogsOpen: boolean;
  isOptimizationModalOpen: boolean;
  activeStrategyParameters: Record<string, number>;

  setActiveTab: (tab: LabTab) => void;
  setAddWidgetDrawerOpen: (open: boolean) => void;
  toggleAddWidgetDrawer: () => void;
  setIdeActiveFile: (file: string) => void;
  updateIdeFileContent: (file: string, content: string) => void;
  toggleIdeSplitView: () => void;
  setMarketplaceSearch: (query: string) => void;
  setMarketplaceCategory: (category: string) => void;
  setInstalledMarketplaceIds: (ids: string[]) => void;
  addInstalledMarketplaceId: (id: string) => void;
  removeInstalledMarketplaceId: (id: string) => void;
  setReviewingItem: (item: MarketplaceItem | null) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  clearToast: () => void;
  applyAiPrompt: (promptText?: string) => Promise<void>;
  loadStrategyFiles: (strategyId: string) => void;

  setStrategyDiagnostics: (diagnostics: Diagnostic[]) => void;
  setIsLinting: (isLinting: boolean) => void;
  setStrategyMeta: (meta: {
    id?: string | null;
    version_id?: string | null;
    revision?: number;
    name?: string;
  }) => void;
  setVersionDrawerOpen: (open: boolean) => void;
  toggleVersionDrawer: () => void;
  setStrategyVersions: (versions: StrategyVersion[]) => void;
  setLoadedBacktestId: (id: string | null) => void;
  setExecutionLogsOpen: (open: boolean) => void;
  toggleExecutionLogs: () => void;
  setOptimizationModalOpen: (open: boolean) => void;
  toggleOptimizationModal: () => void;
  setActiveStrategyParameters: (params: Record<string, number>) => void;
}

const DEFAULT_STRATEGY_ID = 'momentum-eth';
const INITIAL_FILES = Object.fromEntries(
  Object.entries(MOCK_STRATEGIES[DEFAULT_STRATEGY_ID]?.files ?? {}).map(
    ([k, v]) => [k, v.content]
  )
);

export const useLabStore = create<LabState>((set, get) => ({
  activeTab: 'workspace',
  isAddWidgetDrawerOpen: false,
  ideActiveFile: 'strategy.py',
  ideFiles: INITIAL_FILES,
  ideAstStatus: 'valid',
  ideSplitView: false,
  marketplaceSearch: '',
  marketplaceCategory: 'All',
  installedMarketplaceIds: [],
  reviewingItem: null,
  toast: null,

  strategyId: null,
  versionId: null,
  strategyRevision: 1,
  strategyName: 'Momentum_ETH_4h',
  strategyDiagnostics: [],
  isLinting: false,
  isVersionDrawerOpen: false,
  strategyVersions: [],
  loadedBacktestId: null,
  isExecutionLogsOpen: false,
  isOptimizationModalOpen: false,
  activeStrategyParameters: {
    fast_period: 12,
    slow_period: 26,
    signal_period: 9,
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setAddWidgetDrawerOpen: (open) => set({ isAddWidgetDrawerOpen: open }),

  toggleAddWidgetDrawer: () =>
    set((state) => ({ isAddWidgetDrawerOpen: !state.isAddWidgetDrawerOpen })),

  setIdeActiveFile: (file) => set({ ideActiveFile: file }),

  updateIdeFileContent: (file, content) =>
    set((state) => ({
      ideFiles: { ...state.ideFiles, [file]: content },
    })),

  toggleIdeSplitView: () =>
    set((state) => ({ ideSplitView: !state.ideSplitView })),

  setMarketplaceSearch: (query) => set({ marketplaceSearch: query }),

  setMarketplaceCategory: (category) => set({ marketplaceCategory: category }),

  setInstalledMarketplaceIds: (ids) => set({ installedMarketplaceIds: ids }),

  addInstalledMarketplaceId: (id) =>
    set((state) => ({
      installedMarketplaceIds: state.installedMarketplaceIds.includes(id)
        ? state.installedMarketplaceIds
        : [...state.installedMarketplaceIds, id],
    })),

  removeInstalledMarketplaceId: (id) =>
    set((state) => ({
      installedMarketplaceIds: state.installedMarketplaceIds.filter(
        (existingId) => existingId !== id
      ),
    })),

  setReviewingItem: (item) => set({ reviewingItem: item }),

  setStrategyDiagnostics: (diagnostics) =>
    set({
      strategyDiagnostics: diagnostics,
      ideAstStatus: diagnostics.some((d) => d.severity === 'error')
        ? 'invalid'
        : 'valid',
    }),

  setIsLinting: (isLinting) => set({ isLinting }),

  setStrategyMeta: (meta) =>
    set((state) => ({
      strategyId: meta.id !== undefined ? meta.id : state.strategyId,
      versionId:
        meta.version_id !== undefined ? meta.version_id : state.versionId,
      strategyRevision:
        meta.revision !== undefined ? meta.revision : state.strategyRevision,
      strategyName: meta.name !== undefined ? meta.name : state.strategyName,
    })),

  setVersionDrawerOpen: (open) => set({ isVersionDrawerOpen: open }),

  toggleVersionDrawer: () =>
    set((state) => ({ isVersionDrawerOpen: !state.isVersionDrawerOpen })),

  setStrategyVersions: (versions) => set({ strategyVersions: versions }),

  setLoadedBacktestId: (id) => set({ loadedBacktestId: id }),

  setExecutionLogsOpen: (open) => set({ isExecutionLogsOpen: open }),

  toggleExecutionLogs: () =>
    set((state) => ({ isExecutionLogsOpen: !state.isExecutionLogsOpen })),

  setOptimizationModalOpen: (open) => set({ isOptimizationModalOpen: open }),

  toggleOptimizationModal: () =>
    set((state) => ({
      isOptimizationModalOpen: !state.isOptimizationModalOpen,
    })),

  setActiveStrategyParameters: (params) =>
    set((state) => ({
      activeStrategyParameters: {
        ...state.activeStrategyParameters,
        ...params,
      },
    })),

  showToast: (message, type = 'success') => {
    const id = Math.random().toString(36).slice(2, 9);
    set({ toast: { id, message, type } });
    setTimeout(() => {
      if (get().toast?.id === id) {
        set({ toast: null });
      }
    }, 3500);
  },

  clearToast: () => set({ toast: null }),

  loadStrategyFiles: (strategyId) => {
    const found = MOCK_STRATEGIES[strategyId];
    if (found) {
      set({
        ideFiles: Object.fromEntries(
          Object.entries(found.files).map(([k, v]) => [k, v.content])
        ),
        ideActiveFile: 'strategy.py',
        ideAstStatus: 'valid',
      });
    }
  },

  applyAiPrompt: async (promptText) => {
    set({ ideAstStatus: 'synthesizing' });

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const modifiedStrategy = `# Momentum_ETH_4h • v3.2 (AI Synthesized: trailing stop + FOMC guard)
from qslate import Strategy, Order
from indicators import ema, atr

class MomentumETH(Strategy):
    symbol = "ETH"
    timeframe = "4h"
    risk_per_trade = 0.01
    trailing_stop_pct = 0.02

    def on_bar(self, bar):
        # FOMC volatility exclusion filter
        if self.is_macro_news_event(event="FOMC", blackout_hours=4):
            if self.position:
                self.close_position(reason="fomc_risk_mitigation")
            return

        fast = ema(self.close, 21)
        slow = ema(self.close, 55)
        vol = atr(self.data, 14)

        if fast[-1] > slow[-1] and not self.position:
            size = self.equity * self.risk_per_trade / vol[-1]
            self.submit(Order.market("BUY", size))

        elif self.position:
            # Trailing stop protection
            peak = self.position.highest_price
            if self.close[-1] < peak * (1 - self.trailing_stop_pct):
                self.close_position(reason="trailing_stop_hit")
            elif fast[-1] < slow[-1]:
                self.close_position(reason="cross_down")
`;

    set((state) => ({
      ideFiles: {
        ...state.ideFiles,
        'strategy.py': modifiedStrategy,
      },
      ideActiveFile: 'strategy.py',
      ideAstStatus: 'valid',
    }));

    const detail = promptText
      ? `Applied: "${promptText.slice(0, 45)}${promptText.length > 45 ? '…' : ''}"`
      : 'Added 2% trailing stop and FOMC risk filter.';

    get().showToast(`AI Synthesis Complete: ${detail}`, 'success');
  },
}));
