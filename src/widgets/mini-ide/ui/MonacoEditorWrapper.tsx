'use client';

import { LoaderCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

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
        <span>Initializing gVisor Sandboxed Monaco Runtime…</span>
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

const DynamicEditor = dynamic(
  () =>
    import('@monaco-editor/react').then((mod) => {
      const EditorComponent = mod.default;

      return function ClientEditor({
        value,
        language,
        onChange,
        height = '100%',
      }: MonacoEditorProps) {
        return (
          <EditorComponent
            height={height}
            language={language}
            value={value}
            theme="vs-dark"
            beforeMount={(monaco) => {
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
            }}
            onMount={(_, monaco) => {
              monaco.editor.setTheme('qslate-dark');
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
  return <DynamicEditor {...props} />;
}
