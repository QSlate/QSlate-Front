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

export interface DiagnosticMarker {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface MonacoEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  height?: string;
  theme?: 'dark' | 'light';
  markers?: DiagnosticMarker[];
}

function EditorSkeleton() {
  return (
    <div
      className={`flex flex-col h-full w-full p-4 font-mono text-xs animate-pulse ${'bg-surface text-fg-3'}`}
    >
      <div className="flex items-center gap-2 mb-4 text-fg-2">
        <LoaderCircle size={14} className="animate-spin text-brand" />
        <span>Initializing Monaco Sandbox Runtime…</span>
      </div>
      <div className="space-y-2">
        <div className={`h-3 w-48 rounded ${'bg-[var(--line-2)]'}`} />
        <div className={`h-3 w-72 rounded ${'bg-[var(--line-2)]'}`} />
        <div className={`h-3 w-64 rounded ${'bg-[var(--line-2)]'}`} />
        <div className={`h-3 w-80 rounded ${'bg-[var(--line-2)]'}`} />
        <div className={`h-3 w-56 rounded ${'bg-[var(--line-2)]'}`} />
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
  markers = [],
}: MonacoEditorProps & { onRetry?: () => void }) {
  const lines = value.split('\n');
  const errorLines = new Set(markers.map((m) => m.line));

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
      className={`flex flex-col h-full w-full font-mono text-xs overflow-hidden select-text ${'bg-surface text-fg'}`}
    >
      {/* Notice bar */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 border-b text-[11px] ${'bg-surface border-line text-fg-2'}`}
      >
        <div className="flex items-center gap-1.5 text-warn">
          <AlertTriangle size={12} />
          <span>Lightweight Sandbox Editor ({language})</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${'bg-[var(--line-2)] hover:bg-[var(--line-2)] text-fg hover:text-fg'}`}
          >
            <RotateCcw size={10} />
            <span>Retry Monaco</span>
          </button>
        )}
      </div>

      {markers.length > 0 && (
        <div
          className={`px-3 py-1 border-b text-[11px] flex items-center gap-2 ${'bg-rose-950/40 border-rose-900/50 text-rose-300'}`}
        >
          <AlertTriangle size={12} className="shrink-0 text-loss" />
          <span className="truncate">
            Line {markers[0].line}: {markers[0].message}
          </span>
        </div>
      )}

      {/* Editor Body with Line Numbers */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers Gutter */}
        <div
          className={`w-12 py-3 text-right pr-3 select-none font-mono text-xs border-r leading-5 shrink-0 overflow-hidden ${'bg-surface text-fg-3 border-line'}`}
        >
          {lines.map((_, i) => {
            const hasErr = errorLines.has(i + 1);
            return (
              <div
                key={i}
                className={hasErr ? 'text-loss font-bold bg-loss-soft' : ''}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        {/* Text Area */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className={`flex-1 h-full w-full p-3 font-mono text-xs leading-5 resize-none focus:outline-hidden whitespace-pre overflow-auto ${'bg-transparent text-fg'}`}
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
        markers = [],
        onErrorFallback,
      }: MonacoEditorProps & { onErrorFallback: () => void }) {
        const monacoRef = useRef<typeof monacoType | null>(null);
        const editorRef =
          useRef<monacoType.editor.IStandaloneCodeEditor | null>(null);

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

        useEffect(() => {
          if (monacoRef.current && editorRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
              const monaco = monacoRef.current;
              const monacoMarkers: monacoType.editor.IMarkerData[] = (
                markers ?? []
              ).map((m) => ({
                startLineNumber: m.line,
                startColumn: m.column,
                endLineNumber: m.endLine ?? m.line,
                endColumn: m.endColumn ?? m.column + 1,
                message: m.message,
                severity:
                  m.severity === 'error'
                    ? monaco.MarkerSeverity.Error
                    : m.severity === 'warning'
                      ? monaco.MarkerSeverity.Warning
                      : monaco.MarkerSeverity.Info,
              }));
              monaco.editor.setModelMarkers(
                model,
                'qslate-strategy-linter',
                monacoMarkers
              );
            }
          }
        }, [markers]);

        return (
          <EditorComponent
            height={height}
            language={language}
            value={value}
            theme={theme === 'light' ? 'qslate-light' : 'qslate-dark'}
            loading={<EditorSkeleton />}
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
            onMount={(editor, monaco) => {
              try {
                editorRef.current =
                  editor as unknown as monacoType.editor.IStandaloneCodeEditor;
                monacoRef.current = monaco as unknown as typeof monacoType;
                monaco.editor.setTheme(
                  theme === 'light' ? 'qslate-light' : 'qslate-dark'
                );
                const model = editorRef.current.getModel();
                if (model) {
                  const monacoMarkers: monacoType.editor.IMarkerData[] = (
                    markers ?? []
                  ).map((m) => ({
                    startLineNumber: m.line,
                    startColumn: m.column,
                    endLineNumber: m.endLine ?? m.line,
                    endColumn: m.endColumn ?? m.column + 1,
                    message: m.message,
                    severity:
                      m.severity === 'error'
                        ? monaco.MarkerSeverity.Error
                        : m.severity === 'warning'
                          ? monaco.MarkerSeverity.Warning
                          : monaco.MarkerSeverity.Info,
                  }));
                  monaco.editor.setModelMarkers(
                    model,
                    'qslate-strategy-linter',
                    monacoMarkers
                  );
                }
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
