"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "@uiw/react-textarea-code-editor/dist.css";

const CodeEditor = dynamic(
    () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
    { ssr: false }
);

interface EditorProps {
    code: string;
    onChange: (value: string) => void;
}

export default function SimpleCodeEditor({ code, onChange }: EditorProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex items-center justify-center w-full h-full text-gray-500 bg-[#0D0F14]">
                <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin w-5 h-5 text-[#00FFB2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-gray-500">Loading editor...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-auto" data-color-mode="dark">
            <CodeEditor
                value={code}
                language="python"
                placeholder="Write your Python strategy here..."
                onChange={(evn) => onChange(evn.target.value)}
                padding={20}
                style={{
                    backgroundColor: "#050505",
                    fontFamily: "\"JetBrains Mono\", \"Fira Code\", ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace",
                    fontSize: "13.5px",
                    lineHeight: "1.7",
                    minHeight: "100%",
                    color: "#d4d4d4",
                }}
            />
        </div>
    );
}
