'use client';

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FileUp,
  Loader2,
  Play,
  RefreshCw,
  Sliders,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthStore } from '@/entities/user/model';
import { useLabStore } from '@/features/lab-state';
import { apiClient, type CustomDataset } from '@/shared/api';
import { useAppearance } from '@/shared/theme';

import { ColumnMappingModal } from './ColumnMappingModal';

export function CustomDatasetsDrawer() {
  const isOpen = useLabStore((state) => state.isCustomDatasetsDrawerOpen);
  const setIsOpen = useLabStore((state) => state.setCustomDatasetsDrawerOpen);
  const customDatasets = useLabStore((state) => state.customDatasets);
  const setCustomDatasets = useLabStore((state) => state.setCustomDatasets);
  const selectedCustomDataset = useLabStore(
    (state) => state.selectedCustomDataset
  );
  const setSelectedCustomDataset = useLabStore(
    (state) => state.setSelectedCustomDataset
  );
  const showToast = useLabStore((state) => state.showToast);

  const { theme } = useAppearance();
  const isLight = theme === 'light';
  const token = useAuthStore((state) => state.accessToken);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mappingDataset, setMappingDataset] = useState<CustomDataset | null>(
    null
  );
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDatasets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getCustomDatasets({ limit: 50 }, token);
      setCustomDatasets(res.items || []);
    } catch {
      // Fallback empty or ignore if offline
    } finally {
      setIsLoading(false);
    }
  }, [token, setCustomDatasets]);

  useEffect(() => {
    if (isOpen) {
      void fetchDatasets();
    }
  }, [isOpen, fetchDatasets]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!datasetName) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ');
      setDatasetName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !datasetName.trim()) {
      setError('Please select a file and provide a dataset name.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const created = await apiClient.uploadCustomDataset(
        selectedFile,
        datasetName.trim(),
        token
      );
      showToast(`Dataset "${created.name}" uploaded successfully!`, 'success');
      setSelectedFile(null);
      setDatasetName('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      await fetchDatasets();

      // Automatically open column mapping modal for the new dataset
      setMappingDataset(created);
      setIsMappingOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleValidate = async (dataset: CustomDataset) => {
    setValidatingId(dataset.id);
    try {
      await apiClient.validateDataset(dataset.id, undefined, token);
      showToast(`Validation queued for "${dataset.name}".`, 'info');
      // Poll or refresh after short delay
      setTimeout(() => {
        void fetchDatasets();
        setValidatingId(null);
      }, 1500);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Validation dispatch failed',
        'warning'
      );
      setValidatingId(null);
    }
  };

  const handleDelete = async (dataset: CustomDataset) => {
    if (!confirm(`Delete dataset "${dataset.name}"?`)) return;
    try {
      await apiClient.deleteCustomDataset(dataset.id, token);
      showToast(`Dataset "${dataset.name}" deleted.`, 'info');
      if (selectedCustomDataset?.id === dataset.id) {
        setSelectedCustomDataset(null);
      }
      await fetchDatasets();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Delete failed',
        'warning'
      );
    }
  };

  const handleSelectForBacktest = (dataset: CustomDataset) => {
    setSelectedCustomDataset(dataset);
    showToast(`Active backtest dataset set to "${dataset.name}".`, 'success');
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] border-l shadow-2xl flex flex-col transition-transform ${
          isLight
            ? 'bg-white border-zinc-200 text-zinc-900'
            : 'bg-[#121316] border-white/10 text-white'
        }`}
        aria-label="Custom Market Datasets Manager"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight
              ? 'border-zinc-200 bg-zinc-50'
              : 'border-white/10 bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Database size={18} className="text-blue-500" />
            <div>
              <h2 className="text-sm font-semibold">Custom Datasets</h2>
              <p className="text-xs text-zinc-500 font-mono">
                Upload CSV/Parquet time-series for Lab backtesting
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchDatasets()}
              className={`p-1.5 rounded-lg transition-colors ${
                isLight
                  ? 'hover:bg-zinc-200 text-zinc-500'
                  : 'hover:bg-white/10 text-zinc-400'
              }`}
              title="Refresh datasets"
              aria-label="Refresh datasets"
            >
              <RefreshCw
                size={14}
                className={isLoading ? 'animate-spin' : ''}
              />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`p-1.5 rounded-lg transition-colors ${
                isLight
                  ? 'hover:bg-zinc-200 text-zinc-500'
                  : 'hover:bg-white/10 text-zinc-400'
              }`}
              aria-label="Close drawer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-2 p-3 text-xs rounded-lg border border-red-500/30 bg-red-500/10 text-red-400">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Dropzone Form */}
          <form onSubmit={handleUpload} className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-mono block">
              Upload New Dataset
            </span>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/5'
                  : isLight
                    ? 'border-zinc-300 hover:border-zinc-400 bg-zinc-50'
                    : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.parquet"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                }}
              />
              <FileUp
                size={28}
                className="mx-auto mb-2 text-zinc-400 stroke-1"
              />
              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-500 truncate max-w-xs mx-auto">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB · Ready to upload
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-300">
                    Drop CSV or Parquet file here, or click to browse
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Max size: 50MB · Supports ISO-8601 & Unix timestamps
                  </p>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-medium text-zinc-400">
                  Dataset Name
                </label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="e.g. BTC-USDT 1m Binance 2024"
                  className={`w-full text-xs font-mono rounded-lg px-3 py-2 border ${
                    isLight
                      ? 'bg-white border-zinc-200 text-zinc-900'
                      : 'bg-[#1a1b20] border-white/10 text-white'
                  }`}
                  required
                />
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Uploading & Inspecting...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={13} />
                      <span>Ingest Dataset</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>

          {/* Dataset Catalogue List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 font-mono">
                My Datasets ({customDatasets.length})
              </span>
              {selectedCustomDataset && (
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  Active: {selectedCustomDataset.name}
                </span>
              )}
            </div>

            {customDatasets.length === 0 ? (
              <div
                className={`p-6 text-center rounded-xl border ${
                  isLight
                    ? 'border-zinc-200 bg-zinc-50 text-zinc-500'
                    : 'border-white/5 bg-white/[0.01] text-zinc-400'
                }`}
              >
                <FileSpreadsheet
                  size={24}
                  className="mx-auto mb-2 opacity-50"
                />
                <p className="text-xs">No custom datasets uploaded yet.</p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Upload a CSV or Parquet historical feed above to start
                  backtesting with custom symbols.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {customDatasets.map((ds) => {
                  const isSelected = selectedCustomDataset?.id === ds.id;
                  const isValidating = validatingId === ds.id;

                  const statusColor =
                    {
                      uploaded:
                        'bg-amber-500/10 text-amber-400 border-amber-500/20',
                      mapped: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                      validating:
                        'bg-purple-500/10 text-purple-400 border-purple-500/20',
                      ready:
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      failed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                    }[ds.status] ||
                    'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

                  return (
                    <div
                      key={ds.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-blue-500/50 bg-blue-500/5'
                          : isLight
                            ? 'border-zinc-200 bg-zinc-50 hover:border-zinc-300'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-semibold">{ds.name}</h3>
                            <span
                              className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-full border ${statusColor}`}
                            >
                              {ds.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                            Symbol: {ds.symbol} · {ds.format.toUpperCase()} ·{' '}
                            {ds.row_count > 0
                              ? `${ds.row_count} rows`
                              : `${ds.columns.length} columns`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDelete(ds)}
                          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete dataset"
                          aria-label={`Delete ${ds.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            setMappingDataset(ds);
                            setIsMappingOpen(true);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${
                            isLight
                              ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-700'
                              : 'border-white/10 hover:bg-white/5 text-zinc-300'
                          }`}
                        >
                          <Sliders size={11} />
                          <span>Map Schema</span>
                        </button>

                        {(ds.status === 'mapped' ||
                          ds.status === 'uploaded') && (
                          <button
                            type="button"
                            onClick={() => void handleValidate(ds)}
                            disabled={isValidating}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-colors disabled:opacity-50"
                          >
                            {isValidating ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={11} />
                            )}
                            <span>Validate</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSelectForBacktest(ds)}
                          className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check size={11} />
                              <span>Selected</span>
                            </>
                          ) : (
                            <>
                              <Play size={11} />
                              <span>Select for Lab</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Column Mapping Modal */}
      <ColumnMappingModal
        dataset={mappingDataset}
        isOpen={isMappingOpen}
        onClose={() => setIsMappingOpen(false)}
        onSuccess={(updated) => {
          showToast(`Mapping saved for "${updated.name}"!`, 'success');
          void fetchDatasets();
        }}
      />
    </>
  );
}
