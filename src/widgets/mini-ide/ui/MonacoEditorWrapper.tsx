'use client';

import { loader } from '@monaco-editor/react';
import { AlertTriangle, LoaderCircle, RotateCcw } from 'lucide-react';
import type * as monacoType from 'monaco-editor';
import dynamic from 'next/dynamic';
import React, {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useAppearance } from '@/shared/theme';

// Configure CDN path explicitly for the Monaco Loader
if (typeof window !== 'undefined') {
  loader.config({
    paths: {
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs',
    },
  });
}

interface MonacoEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  height?: string;
  theme?: 'dark' | 'light';
}

function EditorSkeleton({ isLight }: { isLight?: boolean }) {
  return (
    <div
      className={`flex flex-col h-full w-full p-4 font-mono text-xs animate-pulse ${
        isLight ? 'bg-white text-zinc-500' : 'bg-[#07080a] text-zinc-500'
      }`}
    >
      <div className="flex items-center gap-2 mb-4 text-zinc-400">
        <LoaderCircle size={14} className="animate-spin text-blue-500" />
        <span>Initializing Monaco Sandbox Runtime…</span>
      </div>
      <div className="space-y-2">
        <div
          className={`h-3 w-48 rounded ${isLight ? 'bg-zinc-200' : 'bg-white/[0.05]'}`}
        />
        <div
          className={`h-3 w-72 rounded ${isLight ? 'bg-zinc-200' : 'bg-white/[0.05]'}`}
        />
        <div
          className={`h-3 w-64 rounded ${isLight ? 'bg-zinc-200' : 'bg-white/[0.05]'}`}
        />
        <div
          className={`h-3 w-80 rounded ${isLight ? 'bg-zinc-200' : 'bg-white/[0.05]'}`}
        />
        <div
          className={`h-3 w-56 rounded ${isLight ? 'bg-zinc-200' : 'bg-white/[0.05]'}`}
        />
      </div>
    </div>
  );
}

/**
 * High-craft fallback code editor with line numbers and 4-space tab indentation.
 * Activates seamlessly if Monaco fails to initialize due to network/CSP restrictions.
 */
function FallbackCodeEditor({
  value,
  language,
  onChange,
  onRetry,
  theme = 'dark',
}: MonacoEditorProps & { onRetry?: () => void }) {
  const isLight = theme === 'light';
  const lines = value.split('\n');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue =
        value.substring(0, start) + '    ' + value.substring(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      });
    }
  };

  return (
    <div
      className={`flex flex-col h-full w-full font-mono text-xs overflow-hidden select-text ${
        isLight ? 'bg-white text-zinc-900' : 'bg-[#07080a] text-zinc-200'
      }`}
    >
      {/* Notice bar */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 border-b text-[11px] ${
          isLight
            ? 'bg-zinc-100 border-zinc-200 text-zinc-700'
            : 'bg-[#0e1014] border-[#242528] text-zinc-400'
        }`}
      >
        <div className="flex items-center gap-1.5 text-amber-500">
          <AlertTriangle size={12} />
          <span>Lightweight Sandbox Editor ({language})</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
              isLight
                ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white'
            }`}
          >
            <RotateCcw size={10} />
            <span>Retry Monaco</span>
          </button>
        )}
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers Gutter */}
        <div
          className={`w-12 py-3 text-right pr-3 select-none font-mono text-xs border-r leading-5 shrink-0 overflow-hidden ${
            isLight
              ? 'bg-zinc-50 text-zinc-400 border-zinc-200'
              : 'bg-[#07080a] text-zinc-600 border-white/[0.04]'
          }`}
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className={`flex-1 h-full w-full p-3 font-mono text-xs leading-5 resize-none focus:outline-hidden whitespace-pre overflow-auto ${
            isLight ? 'bg-white text-zinc-900' : 'bg-transparent text-zinc-200'
          }`}
        />
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: (error: Error, retry: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MonacoErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn(
      'Monaco mount caught error, switching to resilient fallback:',
      error,
      errorInfo
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      return this.props.fallback(
        this.state.error ?? new Error('Monaco initialization failed'),
        this.handleRetry
      );
    }
    return this.props.children;
  }
}

const DynamicEditor = dynamic(
  () =>
    import('@monaco-editor/react').then((mod) => {
      const EditorComponent = mod.default;

      return function ClientEditor({
        value,
        language,
        onChange,
        height = '100%',
        theme = 'dark',
        onErrorFallback,
      }: MonacoEditorProps & { onErrorFallback: () => void }) {
        const monacoRef = useRef<typeof monacoType | null>(null);

        useEffect(() => {
          loader.init().catch(() => {
            onErrorFallback();
          });
        }, [onErrorFallback]);

        useEffect(() => {
          if (monacoRef.current) {
            monacoRef.current.editor.setTheme(
              theme === 'light' ? 'qslate-light' : 'qslate-dark'
            );
          }
        }, [theme]);

        return (
          <EditorComponent
            height={height}
            language={language}
            value={value}
            theme={theme === 'light' ? 'qslate-light' : 'qslate-dark'}
            loading={<EditorSkeleton isLight={theme === 'light'} />}
            beforeMount={(monaco) => {
              try {
                // Dark theme
                monaco.editor.defineTheme('qslate-dark', {
                  base: 'vs-dark',
                  inherit: true,
                  rules: [
                    { token: 'keyword', foreground: 'C084FC' },
                    { token: 'string', foreground: '34D399' },
                    { token: 'number', foreground: '38BDF8' },
                    {
                      token: 'comment',
                      foreground: '71717A',
                      fontStyle: 'italic',
                    },
                    { token: 'type', foreground: 'FCD34D' },
                    { token: 'function', foreground: '60A5FA' },
                  ],
                  colors: {
                    'editor.background': '#07080a',
                    'editor.foreground': '#EDEDF0',
                    'editorLineNumber.foreground': '#52525B',
                    'editorLineNumber.activeForeground': '#A1A1AA',
                    'editor.lineHighlightBackground': '#0f1115',
                    'editorCursor.foreground': '#527DFF',
                    'editorIndentGuide.background': '#1b1c20',
                  },
                });

                // Light theme
                monaco.editor.defineTheme('qslate-light', {
                  base: 'vs',
                  inherit: true,
                  rules: [
                    { token: 'keyword', foreground: '7C3AED' },
                    { token: 'string', foreground: '059669' },
                    { token: 'number', foreground: '0284C7' },
                    {
                      token: 'comment',
                      foreground: '64748B',
                      fontStyle: 'italic',
                    },
                    { token: 'type', foreground: 'D97706' },
                    { token: 'function', foreground: '2563EB' },
                  ],
                  colors: {
                    'editor.background': '#ffffff',
                    'editor.foreground': '#0f172a',
                    'editorLineNumber.foreground': '#94a3b8',
                    'editorLineNumber.activeForeground': '#1e293b',
                    'editor.lineHighlightBackground': '#f8fafc',
                    'editorCursor.foreground': '#2563eb',
                    'editorIndentGuide.background': '#e2e8f0',
                    'editor.selectionBackground': '#bfdbfe',
                  },
                });
              } catch {
                // Catch any theme definition error
              }
            }}
            onMount={(_, monaco) => {
              try {
                monacoRef.current = monaco as unknown as typeof monacoType;
                monaco.editor.setTheme(
                  theme === 'light' ? 'qslate-light' : 'qslate-dark'
                );
              } catch {
                // Ignore
              }
            }}
            onChange={(val) => onChange(val ?? '')}
            options={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 12,
              lineHeight: 20,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              tabSize: 4,
              renderLineHighlight: 'all',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
            }}
          />
        );
      };
    }),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);

export function MonacoEditorWrapper(props: MonacoEditorProps) {
  const { theme } = useAppearance();
  const [forceFallback, setForceFallback] = useState(false);
  const activeTheme = props.theme ?? theme;

  if (forceFallback) {
    return (
      <FallbackCodeEditor
        {...props}
        theme={activeTheme}
        onRetry={() => setForceFallback(false)}
      />
    );
  }

  return (
    <MonacoErrorBoundary
      fallback={() => (
        <FallbackCodeEditor
          {...props}
          theme={activeTheme}
          onRetry={() => setForceFallback(false)}
        />
      )}
    >
      <DynamicEditor
        {...props}
        theme={activeTheme}
        onErrorFallback={() => setForceFallback(true)}
      />
    </MonacoErrorBoundary>
  );
}
