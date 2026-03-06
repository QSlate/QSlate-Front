"use client";

import React from "react";

interface SimpleEditorProps {
    code: string;
    onChange: (value: string) => void;
}

export default function MonacoEditorWrapper({
    code,
    onChange,
}: SimpleEditorProps) {
    return (
        <textarea
            value={code}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full bg-[#1E1E1E] text-[#D4D4D4] p-4 font-mono text-sm outline-none resize-none"
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
        />
    );
}
