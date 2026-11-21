'use client';

import { Check, Columns3, Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useAuthStore } from '@/entities/user/model';
import {
  apiClient,
  type CustomDataset,
  type CustomDatasetMappingPayload,
} from '@/shared/api';
import { useAppearance } from '@/shared/theme';

interface ColumnMappingModalProps {
  dataset: CustomDataset | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: CustomDataset) => void;
}

export function ColumnMappingModal({
  dataset,
  isOpen,
  onClose,
  onSuccess,
}: ColumnMappingModalProps) {
  const { theme } = useAppearance();
  const isLight = theme === 'light';
  const token = useAuthStore((state) => state.accessToken);

  const columns = useMemo(() => dataset?.columns ?? [], [dataset?.columns]);
  const preview = useMemo(() => dataset?.preview ?? [], [dataset?.preview]);

  // Detect initial column guesses
  const [timestampCol, setTimestampCol] = useState('');
  const [openCol, setOpenCol] = useState('');
  const [highCol, setHighCol] = useState('');
  const [lowCol, setLowCol] = useState('');
  const [closeCol, setCloseCol] = useState('');
  const [volumeCol, setVolumeCol] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [timestampUnit, setTimestampUnit] = useState('s');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataset || !columns.length) return;

    const findMatch = (pattern: RegExp) =>
      columns.find((c) => pattern.test(c.toLowerCase())) || '';

    setTimestampCol(
      dataset.mapping?.timestamp_column ||
        findMatch(/time|date|timestamp/) ||
        columns[0] ||
        ''
    );
    setOpenCol(
      dataset.mapping?.columns.open ||
        findMatch(/^open/) ||
        columns[1] ||
        columns[0] ||
        ''
    );
    setHighCol(
      dataset.mapping?.columns.high ||
        findMatch(/^high/) ||
        columns[2] ||
        columns[0] ||
        ''
    );
    setLowCol(
      dataset.mapping?.columns.low ||
        findMatch(/^low/) ||
        columns[3] ||
        columns[0] ||
        ''
    );
    setCloseCol(
      dataset.mapping?.columns.close ||
        findMatch(/^close|price/) ||
        columns[4] ||
        columns[0] ||
        ''
    );
    setVolumeCol(dataset.mapping?.columns.volume || findMatch(/^vol/) || '');
    setTimezone(dataset.mapping?.timezone || 'UTC');
    setTimestampUnit(dataset.mapping?.timestamp_unit || 's');
    setError(null);
  }, [dataset, columns]);

  if (!isOpen || !dataset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timestampCol || !openCol || !highCol || !lowCol || !closeCol) {
      setError('Please map all mandatory OHLC and timestamp columns.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: CustomDatasetMappingPayload = {
      base_version_id: dataset.version_id,
      timestamp_column: timestampCol,
      timezone,
      timestamp_unit: timestampUnit,
      columns: {
        open: openCol,
        high: highCol,
        low: lowCol,
        close: closeCol,
        ...(volumeCol ? { volume: volumeCol } : {}),
      },
    };

    try {
      const updated = await apiClient.mapDatasetColumns(
        dataset.id,
        payload,
        token
      );
      onSuccess(updated);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save column mapping'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mapping-modal-title"
    >
      <div
        className={`relative w-full max-w-3xl rounded-xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
          isLight
            ? 'bg-white border-zinc-200 text-zinc-900'
            : 'bg-[#121316] border-white/10 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight
              ? 'border-zinc-200 bg-zinc-50'
              : 'border-white/10 bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Columns3 size={18} className="text-blue-500" />
            <div>
              <h2 id="mapping-modal-title" className="text-sm font-semibold">
                Column Schema Mapping · {dataset.name}
              </h2>
              <p className="text-xs text-zinc-500 font-mono">
                Map raw dataset columns to standard financial OHLCV format
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight
                ? 'hover:bg-zinc-200 text-zinc-500'
                : 'hover:bg-white/10 text-zinc-400'
            }`}
            aria-label="Close mapping modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {error && (
            <div className="p-3 text-xs rounded-lg border border-red-500/30 bg-red-500/10 text-red-400">
              {error}
            </div>
          )}

          {/* Preview Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-mono">
                Preview Data ({preview.length} rows)
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                Format: {dataset.format.toUpperCase()} · Total cols:{' '}
                {columns.length}
              </span>
            </div>
            <div
              className={`overflow-x-auto rounded-lg border text-xs font-mono max-h-44 ${
                isLight
                  ? 'border-zinc-200 bg-zinc-50'
                  : 'border-white/10 bg-black/30'
              }`}
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={isLight ? 'bg-zinc-100' : 'bg-white/[0.04]'}>
                    {columns.map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 border-b border-white/5 font-semibold text-zinc-400"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={
                        rIdx % 2 === 0
                          ? 'opacity-90'
                          : isLight
                            ? 'bg-zinc-100/50'
                            : 'bg-white/[0.01]'
                      }
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-3 py-1.5 border-b border-white/5 truncate max-w-[140px]"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mapping Grid */}
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-mono">
              OHLCV Target Mapping
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Timestamp Column */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-zinc-400">
                  Timestamp Column <span className="text-red-500">*</span>
                </label>
                <select
                  value={timestampCol}
                  onChange={(e) => setTimestampCol(e.target.value)}
                  className={`w-full text-xs font-mono rounded-lg px-3 py-2 border ${
                    isLight
                      ? 'bg-white border-zinc-200 text-zinc-900'
                      : 'bg-[#1a1b20] border-white/10 text-white'
                  }`}
                  required
                >
                  <option value="" disabled>
                    Select column...
                  </option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timestamp Unit */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-zinc-400">
                  Timestamp Unit / Precision
                </label>
                <select
                  value={timestampUnit}
                  onChange={(e) => setTimestampUnit(e.target.value)}
                  className={`w-full text-xs font-mono rounded-lg px-3 py-2 border ${
                    isLight
                      ? 'bg-white border-zinc-200 text-zinc-900'
                      : 'bg-[#1a1b20] border-white/10 text-white'
                  }`}
                >
                  <option value="s">Seconds (Epoch / Unix s)</option>
                  <option value="ms">Milliseconds (Epoch ms)</option>
                  <option value="iso">ISO 8601 String / UTC</option>
                </select>
              </div>

              {/* Open */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-zinc-400">
                  Open Price <span className="text-red-500">*</span>
                </label>
                <select
                  value={openCol}
                  onChange={(e) => setOpenCol(e.target.value)}
                  className={`w-full text-xs font-mono rounded-lg px-3 py-2 border ${
                    isLight
                      ? 'bg-white border-zinc-200 text-zinc-900'
                      : 'bg-[#1a1b20] border-white/10 text-white'
                  }`}
                  required
                >
                  <option value="" disabled>
                    Select column...
                  </option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* High */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-zinc-400">
                  High Price <span className="text-red-500">*</span>
                </label>
                <select
                  value={highCol}
                  onChange={(e) => setHighCol(e.target.value)}
                  className={`w-full text-xs font-mono rounded-lg px-3 py-2 border ${
                    isLight
                      ? 'bg-white border-zinc-200 text-zinc-900'
                      : 'bg-[#1a1b20] border-white/10 text-white'
                  }`}
                  required
                >
                  <option value="" disabled>
                    Select column...
                  </option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Low */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-zinc-400">
                  Low Price <span className="text-red-500">*</span>
                </label>
                <select
                  value={lowCol}
                  onChange={(e) => setLowCol(e.target.value)}
                  className={`w-full text-xs font-mono rounded-lg px-3 py-2 border ${
                    isLight
                      ? 'bg-white border-zinc-200 text-zinc-900'
                      : 'bg-[#1a1b20] border-white/10 text-white'
                  }`}
                  required
                >
                  <option value="" disabled>
                    Select column...
                  </option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Close */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-zinc-400">
                  Close Price <span className="text-red-500">*</span>
                </label>
                <select
                  value={closeCol}
                  onChange={(e) => setCloseCol(e.target.value)}
                  className={`w-full text-xs font-mono rounded-lg px-3 py-2 border ${
                    isLight
                      ? 'bg-white border-zinc-200 text-zinc-900'
                      : 'bg-[#1a1b20] border-white/10 text-white'
                  }`}
                  required
                >
                  <option value="" disabled>
                    Select column...
                  </option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Volume (Optional) */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-zinc-400">
                  Volume (Optional)
                </label>
                <select
                  value={volumeCol}
                  onChange={(e) => setVolumeCol(e.target.value)}
                  className={`w-full text-xs font-mono rounded-lg px-3 py-2 border ${
                    isLight
                      ? 'bg-white border-zinc-200 text-zinc-900'
                      : 'bg-[#1a1b20] border-white/10 text-white'
                  }`}
                >
                  <option value="">(None / Zero Volume)</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-zinc-400">
                  Timezone
                </label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={`w-full text-xs font-mono rounded-lg px-3 py-2 border ${
                    isLight
                      ? 'bg-white border-zinc-200 text-zinc-900'
                      : 'bg-[#1a1b20] border-white/10 text-white'
                  }`}
                  placeholder="UTC"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className={`flex items-center justify-end gap-3 pt-4 border-t ${
              isLight ? 'border-zinc-200' : 'border-white/10'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
                isLight
                  ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-700'
                  : 'border-white/10 hover:bg-white/5 text-zinc-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Saving Schema...</span>
                </>
              ) : (
                <>
                  <Check size={13} />
                  <span>Save & Apply Mapping</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
