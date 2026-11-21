'use client';

import {
  AlertTriangle,
  Check,
  Copy,
  Cpu,
  Eye,
  Key,
  Loader2,
  Moon,
  Plus,
  RefreshCw,
  Save,
  Scale,
  Settings2,
  Shield,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useAuthStore, useUserStore } from '@/entities/user/model';
import { useLabStore } from '@/features/lab-state';
import { apiClient, type APIKeyDto } from '@/shared/api';
import { useAppearance } from '@/shared/theme';

export function SettingsView() {
  const showToast = useLabStore((state) => state.showToast);
  const { theme, colorblindMode } = useAppearance();
  const isLight = theme === 'light';

  const soundAlerts = useUserStore((state) => state.soundAlerts);
  const setTheme = useUserStore((state) => state.setTheme);
  const setColorblindMode = useUserStore((state) => state.setColorblindMode);
  const toggleSoundAlerts = useUserStore((state) => state.toggleSoundAlerts);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);

  // Engine sandbox & execution states
  const [sandboxMemory, setSandboxMemory] = useState('2048 MB');
  const [maxCpuCores, setMaxCpuCores] = useState('4 Cores (SIMD)');
  const [slippageBps, setSlippageBps] = useState('1.5');
  const [latencyMs, setLatencyMs] = useState('12');

  // Runner API Keys states
  const [apiKeys, setApiKeys] = useState<APIKeyDto[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiryDays, setNewKeyExpiryDays] = useState(90);
  const [isSubmittingKey, setIsSubmittingKey] = useState(false);
  const [createdSecretData, setCreatedSecretData] = useState<{
    key: APIKeyDto;
    secret: string;
  } | null>(null);
  const [hasCopiedSecret, setHasCopiedSecret] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingKeys(true);
    try {
      const res = await apiClient.getApiKeys(accessToken ?? undefined);
      setApiKeys(res.items || []);
    } catch {
      showToast('Failed to load runner API keys', 'warning');
    } finally {
      setIsLoadingKeys(false);
    }
  }, [isAuthenticated, accessToken, showToast]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleSavePlatform = () => {
    showToast('Platform parameters successfully updated', 'success');
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      showToast('Key name is required', 'warning');
      return;
    }
    setIsSubmittingKey(true);
    try {
      const res = await apiClient.createApiKey(
        {
          name: newKeyName.trim(),
          expires_in_days: newKeyExpiryDays,
        },
        accessToken ?? undefined
      );

      setCreatedSecretData(res);
      setIsCreateModalOpen(false);
      setNewKeyName('');
      setNewKeyExpiryDays(90);
      setHasCopiedSecret(false);
      showToast('Runner API key generated successfully', 'success');
      fetchApiKeys();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate key';
      showToast(message, 'warning');
    } finally {
      setIsSubmittingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    setRevokingKeyId(keyId);
    try {
      await apiClient.revokeApiKey(keyId, accessToken ?? undefined);
      showToast('Runner API key revoked', 'info');
      setApiKeys((prev) =>
        prev.map((k) =>
          k.id === keyId ? { ...k, revoked_at: new Date().toISOString() } : k
        )
      );
    } catch {
      showToast('Failed to revoke API key', 'warning');
    } finally {
      setRevokingKeyId(null);
    }
  };

  const handleCopySecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      setHasCopiedSecret(true);
      showToast('API Key Secret copied to clipboard', 'success');
      setTimeout(() => setHasCopiedSecret(false), 3000);
    } catch {
      showToast('Failed to copy to clipboard', 'warning');
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col p-4 max-w-4xl overflow-y-auto select-none transition-colors duration-200">
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-3 mb-4 border-b text-xs font-mono transition-colors ${
          isLight ? 'border-zinc-200' : 'border-[#242528]'
        }`}
      >
        <div className="flex items-center gap-3">
          <Settings2 size={16} className="text-blue-500" />
          <h1
            className={`font-sans font-semibold text-sm ${
              isLight ? 'text-zinc-900' : 'text-white'
            }`}
          >
            Simulation & Engine Settings
          </h1>
          <span className="text-zinc-500">· gVisor v2.8 / Polars 1.18</span>
        </div>

        <button
          type="button"
          onClick={handleSavePlatform}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-medium shadow-xs transition-colors"
        >
          <Save size={12} />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="space-y-5 text-xs font-mono">
        {/* Section 1: Display & Accessibility Preferences */}
        <div
          className={`rounded-xl border p-4 transition-colors ${
            isLight
              ? 'border-zinc-200 bg-white shadow-sm'
              : 'border-[#242528] bg-[#0c0d0e] shadow-lg'
          } space-y-4`}
        >
          <div
            className={`flex items-center justify-between border-b pb-2 ${
              isLight
                ? 'text-zinc-900 border-zinc-100'
                : 'text-white border-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2 font-sans font-semibold text-sm">
              <Eye size={15} className="text-indigo-500" />
              <span>Display & Accessibility Preferences</span>
            </div>
            <span className="text-[10px] text-zinc-500">
              Synced with Go Auth Service
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Theme Mode Selector */}
            <div>
              <label
                className={`block mb-1.5 ${
                  isLight ? 'text-zinc-600' : 'text-zinc-400'
                }`}
              >
                Interface Theme
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md border text-xs transition-all ${
                    theme === 'dark'
                      ? 'bg-blue-600 text-white border-blue-500 font-medium'
                      : isLight
                        ? 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                        : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  <Moon size={13} />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md border text-xs transition-all ${
                    theme === 'light'
                      ? 'bg-blue-600 text-white border-blue-500 font-medium'
                      : isLight
                        ? 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                        : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  <Sun size={13} />
                  <span>Light</span>
                </button>
              </div>
            </div>

            {/* Daltonism High-Contrast Mode */}
            <div>
              <label
                className={`block mb-1.5 ${
                  isLight ? 'text-zinc-600' : 'text-zinc-400'
                }`}
              >
                Colorblind Mode
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setColorblindMode('none')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md border text-xs transition-all ${
                    colorblindMode === 'none'
                      ? 'bg-blue-600 text-white border-blue-500 font-medium'
                      : isLight
                        ? 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                        : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  <span>Standard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setColorblindMode('orange-blue')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md border text-xs transition-all ${
                    colorblindMode === 'orange-blue'
                      ? 'bg-blue-600 text-white border-blue-500 font-medium'
                      : isLight
                        ? 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                        : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  <span>Orange-Blue</span>
                </button>
              </div>
            </div>

            {/* Sound & Audio Alerts */}
            <div>
              <label
                className={`block mb-1.5 ${
                  isLight ? 'text-zinc-600' : 'text-zinc-400'
                }`}
              >
                Sound & Audio Alerts
              </label>
              <button
                type="button"
                onClick={toggleSoundAlerts}
                className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-md border text-xs transition-all ${
                  soundAlerts
                    ? isLight
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : isLight
                      ? 'bg-zinc-100 text-zinc-500 border-zinc-200'
                      : 'bg-white/[0.03] text-zinc-500 border-white/[0.06]'
                }`}
              >
                {soundAlerts ? <Volume2 size={13} /> : <VolumeX size={13} />}
                <span>{soundAlerts ? 'Alerts Enabled' : 'Muted'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Runner API Keys Management */}
        <div
          className={`rounded-xl border p-4 transition-colors ${
            isLight
              ? 'border-zinc-200 bg-white shadow-sm'
              : 'border-[#242528] bg-[#0c0d0e] shadow-lg'
          } space-y-3`}
        >
          <div
            className={`flex items-center justify-between border-b pb-2 ${
              isLight
                ? 'text-zinc-900 border-zinc-100'
                : 'text-white border-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2 font-sans font-semibold text-sm">
              <Key size={15} className="text-amber-500" />
              <span>Distributed Runner API Keys</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchApiKeys}
                disabled={isLoadingKeys}
                className={`p-1 rounded text-zinc-400 hover:text-white transition-colors ${
                  isLoadingKeys ? 'animate-spin' : ''
                }`}
                title="Refresh keys"
              >
                <RefreshCw size={13} />
              </button>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-medium shadow-xs transition-all"
              >
                <Plus size={12} />
                <span>Generate Key</span>
              </button>
            </div>
          </div>

          <p
            className={`text-[11px] leading-relaxed ${
              isLight ? 'text-zinc-600' : 'text-zinc-400'
            }`}
          >
            Scoped authentication keys used by local cluster nodes and remote
            runners to stream telemetry and execute backtest jobs.
          </p>

          {/* Keys List */}
          {isLoadingKeys ? (
            <div className="flex items-center justify-center py-6 text-zinc-500 gap-2">
              <Loader2 size={16} className="animate-spin text-blue-500" />
              <span>Loading runner API keys...</span>
            </div>
          ) : apiKeys.length === 0 ? (
            <div
              className={`rounded-lg border border-dashed p-6 text-center ${
                isLight
                  ? 'border-zinc-200 bg-zinc-50/50'
                  : 'border-[#242528] bg-white/[0.01]'
              }`}
            >
              <Key size={20} className="mx-auto text-zinc-500 mb-2" />
              <p className="text-zinc-400 font-sans font-medium text-xs mb-1">
                No Runner API Keys
              </p>
              <p className="text-zinc-500 text-[11px] mb-3">
                Generate a scoped key to link remote workers with the execution
                engine.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-medium shadow-xs"
              >
                <Plus size={12} />
                <span>Create First Key</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              {apiKeys.map((key) => {
                const isRevoked = Boolean(key.revoked_at);
                const isExpired = new Date(key.expires_at) < new Date();
                const isRevoking = revokingKeyId === key.id;

                return (
                  <div
                    key={key.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                      isLight
                        ? 'border-zinc-200 bg-zinc-50/70 hover:border-zinc-300'
                        : 'border-[#242528] bg-white/[0.02] hover:border-white/[0.08]'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-sans font-semibold text-xs ${
                            isLight ? 'text-zinc-900' : 'text-white'
                          }`}
                        >
                          {key.name}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-500/10">
                          {key.id.slice(0, 12)}...
                        </span>
                        {isRevoked ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            REVOKED
                          </span>
                        ) : isExpired ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 flex-wrap">
                        <span>
                          Created:{' '}
                          {new Date(key.created_at).toLocaleDateString()}
                        </span>
                        <span>·</span>
                        <span>
                          Expires:{' '}
                          {new Date(key.expires_at).toLocaleDateString()}
                        </span>
                      </div>

                      {key.scopes && key.scopes.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {key.scopes.map((scope) => (
                            <span
                              key={scope}
                              className="text-[9px] font-mono px-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            >
                              {scope}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {!isRevoked && (
                        <button
                          type="button"
                          onClick={() => handleRevokeKey(key.id)}
                          disabled={isRevoking}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all ${
                            isLight
                              ? 'bg-zinc-100 text-rose-600 hover:bg-rose-50 border border-zinc-200 hover:border-rose-300'
                              : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                          }`}
                          title="Revoke key"
                        >
                          {isRevoking ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          <span>Revoke</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: gVisor Execution Sandbox */}
        <div
          className={`rounded-xl border p-4 transition-colors ${
            isLight
              ? 'border-zinc-200 bg-white shadow-sm'
              : 'border-[#242528] bg-[#0c0d0e] shadow-lg'
          } space-y-3`}
        >
          <div
            className={`flex items-center gap-2 font-sans font-semibold text-sm border-b pb-2 ${
              isLight
                ? 'text-zinc-900 border-zinc-100'
                : 'text-white border-white/[0.04]'
            }`}
          >
            <Shield size={15} className="text-blue-500" />
            <span>gVisor Isolated Kernel Runtime</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label
                className={`block mb-1 ${
                  isLight ? 'text-zinc-600' : 'text-zinc-400'
                }`}
              >
                Sandbox Memory Limit
              </label>
              <select
                value={sandboxMemory}
                onChange={(e) => setSandboxMemory(e.target.value)}
                className={`w-full rounded-md px-3 py-1.5 ${
                  isLight
                    ? 'bg-zinc-50 border border-zinc-300 text-zinc-900'
                    : 'bg-[#111215] border border-[#242528] text-white'
                }`}
              >
                <option value="1024 MB">1024 MB (Light)</option>
                <option value="2048 MB">2048 MB (Default Institutional)</option>
                <option value="4096 MB">
                  4096 MB (Heavy Tick Monte Carlo)
                </option>
              </select>
            </div>

            <div>
              <label
                className={`block mb-1 ${
                  isLight ? 'text-zinc-600' : 'text-zinc-400'
                }`}
              >
                Polars Vectorized Thread Cores
              </label>
              <select
                value={maxCpuCores}
                onChange={(e) => setMaxCpuCores(e.target.value)}
                className={`w-full rounded-md px-3 py-1.5 ${
                  isLight
                    ? 'bg-zinc-50 border border-zinc-300 text-zinc-900'
                    : 'bg-[#111215] border border-[#242528] text-white'
                }`}
              >
                <option value="2 Cores">2 Cores (AVX-2)</option>
                <option value="4 Cores (SIMD)">4 Cores (AVX-512 SIMD)</option>
                <option value="8 Cores (Cluster)">
                  8 Cores (High Throughput)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Execution & Slippage Modeling */}
        <div
          className={`rounded-xl border p-4 transition-colors ${
            isLight
              ? 'border-zinc-200 bg-white shadow-sm'
              : 'border-[#242528] bg-[#0c0d0e] shadow-lg'
          } space-y-3`}
        >
          <div
            className={`flex items-center gap-2 font-sans font-semibold text-sm border-b pb-2 ${
              isLight
                ? 'text-zinc-900 border-zinc-100'
                : 'text-white border-white/[0.04]'
            }`}
          >
            <Cpu size={15} className="text-emerald-500" />
            <span>Microstructure & Friction Parameters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label
                className={`block mb-1 ${
                  isLight ? 'text-zinc-600' : 'text-zinc-400'
                }`}
              >
                Fixed Slippage (Basis Points)
              </label>
              <input
                type="number"
                step="0.1"
                value={slippageBps}
                onChange={(e) => setSlippageBps(e.target.value)}
                className={`w-full rounded-md px-3 py-1.5 ${
                  isLight
                    ? 'bg-zinc-50 border border-zinc-300 text-zinc-900'
                    : 'bg-[#111215] border border-[#242528] text-white'
                }`}
              />
            </div>

            <div>
              <label
                className={`block mb-1 ${
                  isLight ? 'text-zinc-600' : 'text-zinc-400'
                }`}
              >
                Execution Latency Delay (ms)
              </label>
              <input
                type="number"
                step="1"
                value={latencyMs}
                onChange={(e) => setLatencyMs(e.target.value)}
                className={`w-full rounded-md px-3 py-1.5 ${
                  isLight
                    ? 'bg-zinc-50 border border-zinc-300 text-zinc-900'
                    : 'bg-[#111215] border border-[#242528] text-white'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Section 5: Regulatory Compliance (AMF France) */}
        <div
          className={`rounded-xl border p-4 transition-colors ${
            isLight
              ? 'border-zinc-200 bg-white shadow-sm'
              : 'border-[#242528] bg-[#0c0d0e] shadow-lg'
          } space-y-2`}
        >
          <div
            className={`flex items-center gap-2 font-sans font-semibold text-sm border-b pb-2 ${
              isLight
                ? 'text-zinc-900 border-zinc-100'
                : 'text-white border-white/[0.04]'
            }`}
          >
            <Scale size={15} className="text-amber-500" />
            <span>Regulatory & Compliance Notice (AMF / RGAA)</span>
          </div>
          <p
            className={`text-[11px] leading-relaxed pt-1 ${
              isLight ? 'text-zinc-600' : 'text-zinc-400'
            }`}
          >
            QSLate acts exclusively as a Technical Tool Provider and simulation
            environment. It does not provide investment advice (Conseiller en
            Investissements Financiers - CIF) or discretionary management.
            Simulations are hypothetical and do not guarantee future returns.
          </p>
        </div>
      </div>

      {/* Modal: Generate API Key */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-xl border p-5 shadow-2xl space-y-4 ${
              isLight
                ? 'bg-white border-zinc-200'
                : 'bg-[#0f1012] border-[#242528]'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Key size={16} className="text-blue-500" />
                <h3
                  className={`font-sans font-semibold text-sm ${
                    isLight ? 'text-zinc-900' : 'text-white'
                  }`}
                >
                  Generate Runner API Key
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleCreateKey}
              className="space-y-4 text-xs font-mono"
            >
              <div>
                <label
                  htmlFor="key-name"
                  className={`block mb-1 font-medium ${
                    isLight ? 'text-zinc-700' : 'text-zinc-300'
                  }`}
                >
                  Key Name / Purpose
                </label>
                <input
                  id="key-name"
                  type="text"
                  placeholder="e.g. Cluster Worker EU-01"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  maxLength={100}
                  className={`w-full rounded-md px-3 py-2 ${
                    isLight
                      ? 'bg-zinc-50 border border-zinc-300 text-zinc-900 focus:border-blue-500'
                      : 'bg-[#18191c] border border-[#242528] text-white focus:border-blue-500'
                  } outline-hidden`}
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="key-expiry"
                  className={`block mb-1 font-medium ${
                    isLight ? 'text-zinc-700' : 'text-zinc-300'
                  }`}
                >
                  Expiration Period
                </label>
                <select
                  id="key-expiry"
                  value={newKeyExpiryDays}
                  onChange={(e) => setNewKeyExpiryDays(Number(e.target.value))}
                  className={`w-full rounded-md px-3 py-2 ${
                    isLight
                      ? 'bg-zinc-50 border border-zinc-300 text-zinc-900'
                      : 'bg-[#18191c] border border-[#242528] text-white'
                  }`}
                >
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days (Recommended)</option>
                  <option value={180}>180 Days</option>
                  <option value={365}>365 Days (1 Year)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={`px-3 py-1.5 rounded text-xs transition-colors ${
                    isLight
                      ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      : 'bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingKey || !newKeyName.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium shadow-xs transition-colors"
                >
                  {isSubmittingKey ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Plus size={13} />
                  )}
                  <span>Generate Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Display Secret Once */}
      {createdSecretData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg rounded-xl border p-5 shadow-2xl space-y-4 ${
              isLight
                ? 'bg-white border-zinc-200'
                : 'bg-[#0f1012] border-[#242528]'
            }`}
          >
            <div className="flex items-center gap-2 text-emerald-500 font-sans font-semibold text-sm border-b pb-3">
              <Check size={16} />
              <span>Runner API Key Created Successfully</span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div
                className={`flex items-start gap-2 p-3 rounded-lg border ${
                  isLight
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                }`}
              >
                <AlertTriangle
                  size={16}
                  className="shrink-0 mt-0.5 text-amber-500"
                />
                <p className="text-[11px] leading-relaxed">
                  Make sure to copy your API key secret now. For security
                  reasons, it will never be displayed again.
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Key Name
                </label>
                <p
                  className={`font-semibold ${isLight ? 'text-zinc-900' : 'text-white'}`}
                >
                  {createdSecretData.key.name}
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Secret Key
                </label>
                <div
                  className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border font-mono text-[11px] break-all ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-900'
                      : 'bg-black/50 border-[#242528] text-emerald-400'
                  }`}
                >
                  <span className="select-all font-mono">
                    {createdSecretData.secret}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopySecret(createdSecretData.secret)}
                    className="shrink-0 p-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                    title="Copy Secret"
                  >
                    {hasCopiedSecret ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end border-t">
              <button
                type="button"
                onClick={() => setCreatedSecretData(null)}
                className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-medium transition-colors"
              >
                I Have Saved My Secret
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
