// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useUserStore } from '@/entities/user/model';
import { BacktestProvider } from '@/features/run-backtest/BacktestProvider';

import { ResultControlsProvider } from '../model/ResultControls';
import { EquityToolbar } from '../ui/EquityToolbar';
import { EquityWidget } from '../ui/EquityWidget';
import { TickerSelector } from '../ui/TickerSelector';

describe('TradingView Candlestick and Ticker Selection in Lab', () => {
  afterEach(() => {
    cleanup();
  });

  describe('TickerSelector', () => {
    it('renders selected ticker symbol and opens dropdown on click', () => {
      const handleSelect = vi.fn();
      render(
        <TickerSelector selectedTicker="ETH/USDT" onSelect={handleSelect} />
      );

      const triggerBtn = screen.getByTitle('Select instrument / ticker');
      expect(triggerBtn).toBeDefined();
      expect(screen.getByText('ETH/USDT')).toBeDefined();

      act(() => {
        fireEvent.click(triggerBtn);
      });

      // Search input should now be visible
      const searchInput = screen.getByPlaceholderText(
        'Search stocks, crypto, indices...'
      );
      expect(searchInput).toBeDefined();

      // Categories should be visible
      expect(screen.getByText('Crypto')).toBeDefined();
      expect(screen.getByText('Equity')).toBeDefined();

      // Selecting BTC/USDT
      const btcOption = screen.getByText('BTC/USDT');
      act(() => {
        fireEvent.click(btcOption);
      });

      expect(handleSelect).toHaveBeenCalledWith('BTC/USDT');
    });

    it('filters instruments when typing in search input', () => {
      render(<TickerSelector selectedTicker="ETH/USDT" onSelect={vi.fn()} />);

      const triggerBtn = screen.getByTitle('Select instrument / ticker');
      act(() => {
        fireEvent.click(triggerBtn);
      });

      const searchInput = screen.getByPlaceholderText(
        'Search stocks, crypto, indices...'
      );

      act(() => {
        fireEvent.change(searchInput, { target: { value: 'NVDA' } });
      });

      expect(screen.getByText('NVDA')).toBeDefined();
      expect(screen.getByText('NVIDIA Corporation')).toBeDefined();
      expect(screen.queryByText('Ethereum')).toBeNull();
    });

    it('finds SPCX and SPX indices when searching', () => {
      render(<TickerSelector selectedTicker="ETH/USDT" onSelect={vi.fn()} />);

      const triggerBtn = screen.getByTitle('Select instrument / ticker');
      act(() => {
        fireEvent.click(triggerBtn);
      });

      const searchInput = screen.getByPlaceholderText(
        'Search stocks, crypto, indices...'
      );

      act(() => {
        fireEvent.change(searchInput, { target: { value: 'SPCX' } });
      });

      expect(screen.getByText('SPCX')).toBeDefined();
      expect(screen.getByText('S&P/TSX Composite Index')).toBeDefined();
      expect(screen.getByText('TSX')).toBeDefined();
    });

    it('allows loading any custom ticker on TradingView live feed', () => {
      const handleSelect = vi.fn();
      render(
        <TickerSelector selectedTicker="ETH/USDT" onSelect={handleSelect} />
      );

      const triggerBtn = screen.getByTitle('Select instrument / ticker');
      act(() => {
        fireEvent.click(triggerBtn);
      });

      const searchInput = screen.getByPlaceholderText(
        'Search stocks, crypto, indices...'
      );

      act(() => {
        fireEvent.change(searchInput, { target: { value: 'BABA' } });
      });

      const customLoadBtn = screen.getByText(/Load/);
      expect(customLoadBtn).toBeDefined();

      act(() => {
        fireEvent.click(customLoadBtn);
      });

      expect(handleSelect).toHaveBeenCalledWith('BABA');
    });
  });

  describe('EquityToolbar & EquityWidget Integration', () => {
    it('switches between Candlesticks and Strategy NAV modes', () => {
      render(
        <BacktestProvider>
          <ResultControlsProvider>
            <EquityToolbar />
            <EquityWidget />
          </ResultControlsProvider>
        </BacktestProvider>
      );

      // By default in 'candles' mode, we see Candle interval pills and Ticker Selector
      expect(screen.getByText('Candles')).toBeDefined();
      expect(screen.getByText('Strategy NAV')).toBeDefined();
      expect(screen.getByText('15m')).toBeDefined();
      expect(screen.getByText('1D')).toBeDefined();

      // Quick ticker switch buttons should be present
      expect(screen.getByText('ETH')).toBeDefined();
      expect(screen.getByText('BTC')).toBeDefined();
      expect(screen.getByText('NVDA')).toBeDefined();

      // Switch to Strategy NAV mode
      const navBtn = screen.getByText('Strategy NAV');
      act(() => {
        fireEvent.click(navBtn);
      });

      // Now we should see range buttons like 1M, 1Y, ALL
      expect(screen.getByText('1M')).toBeDefined();
      expect(screen.getByText('ALL')).toBeDefined();
    });

    it('renders chart skeleton during dynamic loading in EquityWidget', () => {
      render(
        <BacktestProvider>
          <ResultControlsProvider>
            <EquityWidget />
          </ResultControlsProvider>
        </BacktestProvider>
      );

      const skeleton = screen.getByTestId('chart-skeleton');
      expect(skeleton).toBeDefined();
    });

    it('reacts to Daltonism colorblind mode', () => {
      useUserStore.setState({ colorblindMode: 'orange-blue' });

      render(
        <BacktestProvider>
          <ResultControlsProvider>
            <EquityWidget />
          </ResultControlsProvider>
        </BacktestProvider>
      );

      // Verify the widget mounts without errors in colorblind mode
      expect(screen.getByText('ETH/USDT')).toBeDefined();
    });
  });
});
