'use client';

import { loader } from '@monaco-editor/react';
import { AlertTriangle, LoaderCircle, RotateCcw } from 'lucide-react';
import dynamic from 'next/dynamic';
import React, {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useState,
} from 'react';

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
}

function EditorSkeleton() {
  return (
    <div className="flex flex-col h-full w-full bg-[#07080a] p-4 font-mono text-xs text-zinc-500 animate-pulse">
      <div className="flex items-center gap-2 mb-4 text-zinc-400">
        <LoaderCircle size={14} className="animate-spin text-blue-400" />
        <span>Initializing Monaco Runtime…</span>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-48 bg-white/[0.05] rounded" />
        <div className="h-3 w-72 bg-white/[0.05] rounded" />
        <div className="h-3 w-64 bg-white/[0.05] rounded" />
        <div className="h-3 w-80 bg-white/[0.05] rounded" />
        <div className="h-3 w-56 bg-white/[0.05] rounded" />
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
}: MonacoEditorProps & { onRetry?: () => void }) {
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
    <div className="flex flex-col h-full w-full bg-[#07080a] text-zinc-200 font-mono text-xs overflow-hidden select-text">
      {/* Notice bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e1014] border-b border-[#242528] text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5 text-amber-400">
          <AlertTriangle size={12} />
          <span>Lightweight Sandbox Editor ({language})</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors"
          >
            <RotateCcw size={10} />
            <span>Retry Monaco</span>
          </button>
        )}
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers Gutter */}
        <div className="w-12 py-3 bg-[#07080a] text-zinc-600 text-right pr-3 select-none font-mono text-xs border-r border-white/[0.04] leading-5 shrink-0 overflow-hidden">
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
          className="flex-1 h-full w-full bg-transparent p-3 text-zinc-200 font-mono text-xs leading-5 resize-none focus:outline-hidden whitespace-pre overflow-auto"
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
        onErrorFallback,
      }: MonacoEditorProps & { onErrorFallback: () => void }) {
        useEffect(() => {
          loader.init().catch(() => {
            onErrorFallback();
          });
        }, [onErrorFallback]);

        return (
          <EditorComponent
            height={height}
            language={language}
            value={value}
            theme="vs-dark"
            loading={<EditorSkeleton />}
            beforeMount={(monaco) => {
              try {
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
              } catch {
                // Catch any theme definition error
              }
            }}
            onMount={(_, monaco) => {
              try {
                monaco.editor.setTheme('qslate-dark');
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
  const [forceFallback, setForceFallback] = useState(false);

  if (forceFallback) {
    return (
      <FallbackCodeEditor {...props} onRetry={() => setForceFallback(false)} />
    );
  }

  return (
    <MonacoErrorBoundary
      fallback={() => (
        <FallbackCodeEditor
          {...props}
          onRetry={() => setForceFallback(false)}
        />
      )}
    >
      <DynamicEditor
        {...props}
        onErrorFallback={() => setForceFallback(true)}
      />
    </MonacoErrorBoundary>
  );
}
