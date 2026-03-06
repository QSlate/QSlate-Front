import React, { useState, useEffect, useRef } from "react";

interface SearchSymbol {
    symbol: string;
    name: string;
    exchange: string;
    type: string;
}

const mockSymbols: SearchSymbol[] = [
    { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "stock" },
    { symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ", type: "stock" },
    { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", type: "stock" },
    { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", type: "stock" },
    { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", type: "stock" },
    { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", type: "stock" },
    { symbol: "META", name: "Meta Platforms, Inc.", exchange: "NASDAQ", type: "stock" },
    { symbol: "BTCUSD", name: "Bitcoin / Dollar", exchange: "BINANCE", type: "crypto" },
    { symbol: "ETHUSD", name: "Ethereum / Dollar", exchange: "BINANCE", type: "crypto" },
    { symbol: "SOLUSD", name: "Solana / Dollar", exchange: "CBSE", type: "crypto" },
];

interface SymbolSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSymbol: (symbol: string) => void;
}

export const SymbolSearchModal: React.FC<SymbolSearchModalProps> = ({ isOpen, onClose, onSelectSymbol }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setSearchQuery("");
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const filteredSymbols = mockSymbols.filter(s =>
        s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
                className="bg-[#1E2229] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col border border-gray-800"
                style={{ height: '80vh', maxHeight: '700px' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header / Search Input */}
                <div className="flex items-center p-4 border-b border-gray-800">
                    <svg className="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Recherche de symbole"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent text-white text-xl outline-none placeholder-gray-500 font-medium"
                    />
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors ml-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs Faux */}
                <div className="flex px-4 py-2 border-b border-gray-800 overflow-x-auto space-x-6 text-sm font-medium">
                    <button className="text-white border-b-2 border-blue-500 pb-2 whitespace-nowrap">Tous</button>
                    <button className="text-gray-400 hover:text-gray-300 pb-2 whitespace-nowrap">Actions</button>
                    <button className="text-gray-400 hover:text-gray-300 pb-2 whitespace-nowrap">Fonds</button>
                    <button className="text-gray-400 hover:text-gray-300 pb-2 whitespace-nowrap">Crypto</button>
                    <button className="text-gray-400 hover:text-gray-300 pb-2 whitespace-nowrap">Indices</button>
                </div>

                {/* Symbols List */}
                <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                    {filteredSymbols.length > 0 ? (
                        filteredSymbols.map((item, idx) => (
                            <div
                                key={`${item.symbol}-${idx}`}
                                onClick={() => onSelectSymbol(item.symbol)}
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
                            Aucun symbole ne correspond à vos critères
                        </div>
                    )}
                </div>
            </div>

            {/* Click outside to close trigger */}
            <div className="absolute inset-0 z-[-1]" onClick={onClose}></div>
        </div>
    );
};
