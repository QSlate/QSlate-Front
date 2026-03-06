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
            <div className="flex items-center justify-center w-full h-full text-gray-400">
                Loading editor...
            </div>
        );
    }

    return (
        <div className="w-full h-full text-base overflow-auto" data-color-mode="dark">
            <CodeEditor
                value={code}
                language="python"
                placeholder="Please enter Python code."
                onChange={(evn) => onChange(evn.target.value)}
                padding={15}
                style={{
                    fontSize: 14,
                    backgroundColor: "#1E1E1E",
                    fontFamily:
                        "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
                    minHeight: "100%",
                }}
            />
        </div>
    );
}
