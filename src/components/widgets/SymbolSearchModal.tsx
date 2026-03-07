import React, { useState, useEffect, useRef } from "react";

interface SearchSymbol {
    symbol: string;
    name: string;
    exchange: string;
    type: string;
}



interface SymbolSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSymbol: (symbol: string, exchange: string) => void;
}

export const SymbolSearchModal: React.FC<SymbolSearchModalProps> = ({ isOpen, onClose, onSelectSymbol }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [symbols, setSymbols] = useState<SearchSymbol[]>([]);

    useEffect(() => {
        const fetchSymbols = async () => {
            try {
                const url = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
                const response = await fetch(`${url}/api/assets`);
                if (!response.ok) throw new Error("Network response was not ok");
                const data = await response.json();
                if (Array.isArray(data)) {
                    const normalized = data.map(item => {
                        if (typeof item === 'string') {
                            return { symbol: item, name: item, exchange: "UNKNOWN", type: "UNKNOWN" };
                        }
                        return {
                            symbol: item.symbol || "",
                            name: item.name || item.symbol || "",
                            exchange: item.exchange || "UNKNOWN",
                            type: item.type || "UNKNOWN"
                        };
                    });
                    setSymbols(normalized);
                }
            } catch (error) {
                console.error("Failed to fetch symbols:", error);
            }
        };
        fetchSymbols();
    }, []);

    useEffect(() => {
        let timeoutId: number;
        if (isOpen) {
            timeoutId = window.setTimeout(() => inputRef.current?.focus(), 100);
            setSearchQuery("");
        }
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        let originalOverflow = '';
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (isOpen) {
                document.body.style.overflow = originalOverflow;
            }
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const filteredSymbols = symbols.filter(s => {
        const symbol = (s.symbol || "").toLowerCase();
        const name = (s.name || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        return symbol.includes(query) || name.includes(query);
    });

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-[#18171E] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col border border-[#211F28]"
                style={{ height: '80vh', maxHeight: '700px' }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Search for a symbol"
            >
                {/* Header / Search Input */}
                <div className="flex items-center p-4 border-b border-[#211F28]">
                    <svg className="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search for a symbol"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent text-white text-xl outline-none placeholder-gray-500 font-medium"
                    />
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors ml-2"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs Faux */}
                <div className="flex px-4 py-2 border-b border-[#211F28] overflow-x-auto space-x-6 text-sm font-medium">
                    <button className="text-white border-b-2 border-blue-500 pb-2 whitespace-nowrap">All</button>
                    <button className="text-gray-400 hover:text-gray-300 pb-2 whitespace-nowrap">Stocks</button>
                    <button className="text-gray-400 hover:text-gray-300 pb-2 whitespace-nowrap">Funds</button>
                    <button className="text-gray-400 hover:text-gray-300 pb-2 whitespace-nowrap">Crypto</button>
                    <button className="text-gray-400 hover:text-gray-300 pb-2 whitespace-nowrap">Indices</button>
                </div>

                {/* Symbols List */}
                <div className="flex-1 overflow-y-auto py-2">
                    {filteredSymbols.length > 0 ? (
                        filteredSymbols.map((item) => (
                            <div
                                key={item.symbol}
                                onClick={() => onSelectSymbol(item.symbol, item.exchange)}
                                className="flex items-center justify-between px-6 py-3 hover:bg-[#2A2E35] cursor-pointer transition-colors group"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-300">
                                        {item.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold group-hover:text-blue-400 transition-colors">
                                            {item.symbol}
                                        </span>
                                        <span className="text-gray-400 text-sm">
                                            {item.name}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 text-xs text-gray-500">
                                    <span className="uppercase">{item.type}</span>
                                    <span className="px-2 py-1 rounded bg-gray-800 font-medium">
                                        {item.exchange}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            No symbols match your criteria
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
