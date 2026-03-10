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
    theme?: "dark" | "light";
}

export default function SimpleCodeEditor({ code, onChange, theme = "dark" }: EditorProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = theme === "dark";

    if (!mounted) {
        return (
            <div
                className="flex items-center justify-center w-full h-full"
                style={{ background: isDark ? "#0D0F14" : "#F8F9FC" }}
            >
                <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin w-5 h-5 text-[#00FFB2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm" style={{ color: isDark ? "#6B7280" : "#9CA3AF" }}>
                        Loading editor...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div
            className="w-full h-full overflow-auto"
            data-color-mode={isDark ? "dark" : "light"}
        >
            <CodeEditor
                value={code}
                language="python"
                placeholder="Write your Python strategy here..."
                onChange={(evn) => onChange(evn.target.value)}
                padding={20}
                style={{
                    backgroundColor: isDark ? "#050505" : "#FFFFFF",
                    fontFamily: "\"JetBrains Mono\", \"Fira Code\", ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace",
                    fontSize: "13.5px",
                    lineHeight: "1.7",
                    minHeight: "100%",
                    color: isDark ? "#d4d4d4" : "#1e293b",
                }}
            />
        </div>
    );
}
