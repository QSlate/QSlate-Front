// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLabStore } from '@/features/lab-state';
import { apiClient, type CustomDataset } from '@/shared/api';

import { ColumnMappingModal } from '../ui/ColumnMappingModal';
import { CustomDatasetsDrawer } from '../ui/CustomDatasetsDrawer';

afterEach(cleanup);

const MOCK_DATASET: CustomDataset = {
  id: 'ds-test-1',
  version_id: 'ver-test-1',
  name: 'ETH/USDT 1m Binance',
  status: 'uploaded',
  format: 'csv',
  columns: ['timestamp', 'open', 'high', 'low', 'close', 'volume'],
  preview: [
    ['1704067200', '2200.5', '2210.0', '2195.0', '2205.0', '150'],
    ['1704067260', '2205.0', '2215.0', '2202.0', '2212.0', '180'],
  ],
  row_count: 2,
  symbol: 'custom:ds-test-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('CustomDatasetsDrawer & ColumnMappingModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useLabStore.setState({
      isCustomDatasetsDrawerOpen: true,
      customDatasets: [MOCK_DATASET],
      selectedCustomDataset: null,
    });
  });

  it('renders custom datasets drawer with existing datasets and status badges', async () => {
    vi.spyOn(apiClient, 'getCustomDatasets').mockResolvedValueOnce({
      items: [MOCK_DATASET],
    });

    render(<CustomDatasetsDrawer />);

    expect(screen.getByText('Custom Datasets')).toBeDefined();
    expect(screen.getByText('ETH/USDT 1m Binance')).toBeDefined();
    expect(screen.getByText('uploaded')).toBeDefined();
    expect(screen.getByText(/Symbol: custom:ds-test-1/)).toBeDefined();
  });

  it('handles dataset selection for Lab backtest', async () => {
    vi.spyOn(apiClient, 'getCustomDatasets').mockResolvedValueOnce({
      items: [MOCK_DATASET],
    });

    render(<CustomDatasetsDrawer />);

    const selectButton = screen.getByText('Select for Lab');
    fireEvent.click(selectButton);

    expect(useLabStore.getState().selectedCustomDataset?.id).toBe('ds-test-1');
  });

  it('handles dataset deletion', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteSpy = vi
      .spyOn(apiClient, 'deleteCustomDataset')
      .mockResolvedValueOnce();
    vi.spyOn(apiClient, 'getCustomDatasets')
      .mockResolvedValueOnce({ items: [MOCK_DATASET] })
      .mockResolvedValueOnce({ items: [] });

    render(<CustomDatasetsDrawer />);

    const deleteBtn = screen.getByLabelText('Delete ETH/USDT 1m Binance');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('ds-test-1', null);
    });
  });

  it('handles validate action dispatch', async () => {
    const valSpy = vi
      .spyOn(apiClient, 'validateDataset')
      .mockResolvedValueOnce({
        job_id: 'job-v-1',
        dataset_id: 'ds-test-1',
        version_id: 'ver-test-1',
        status: 'queued',
      });
    vi.spyOn(apiClient, 'getCustomDatasets').mockResolvedValueOnce({
      items: [MOCK_DATASET],
    });

    render(<CustomDatasetsDrawer />);

    const validateBtn = screen.getByText('Validate');
    fireEvent.click(validateBtn);

    await waitFor(() => {
      expect(valSpy).toHaveBeenCalledWith('ds-test-1', undefined, null);
    });
  });

  it('renders ColumnMappingModal and submits mapping successfully', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const mapSpy = vi
      .spyOn(apiClient, 'mapDatasetColumns')
      .mockResolvedValueOnce({
        ...MOCK_DATASET,
        status: 'mapped',
      });

    render(
      <ColumnMappingModal
        dataset={MOCK_DATASET}
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(
      screen.getByText('Column Schema Mapping · ETH/USDT 1m Binance')
    ).toBeDefined();
    expect(screen.getByText('Preview Data (2 rows)')).toBeDefined();

    const saveButton = screen.getByText('Save & Apply Mapping');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mapSpy).toHaveBeenCalledWith(
        'ds-test-1',
        expect.objectContaining({
          base_version_id: 'ver-test-1',
          timestamp_column: 'timestamp',
          columns: expect.objectContaining({
            open: 'open',
            high: 'high',
            low: 'low',
            close: 'close',
          }),
        }),
        null
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
