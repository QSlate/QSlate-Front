const KEYS = {
    script: "qslate_last_script",
    backtest: "qslate_last_backtest",
} as const;


export interface PersistedScriptState {
    code: string;
    ticker: string;
    capital: string;
    windowLimit: string;
    savedAt: string;
}

export type PersistedBacktestResult = Record<string, any>;


function safeRead<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

function safeWrite(key: string, value: unknown): boolean {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        console.warn(`[QSlate] Could not persist "${key}" to localStorage.`);
        return false;
    }
}

function safeRemove(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch {
    }
}

export function saveScriptState(state: Omit<PersistedScriptState, "savedAt">): boolean {
    return safeWrite(KEYS.script, {
        ...state,
        savedAt: new Date().toISOString(),
    });
}

export function loadScriptState(): PersistedScriptState | null {
    return safeRead<PersistedScriptState>(KEYS.script);
}

export function clearScriptState(): void {
    safeRemove(KEYS.script);
}

export function saveBacktestResult(result: PersistedBacktestResult): boolean {
    return safeWrite(KEYS.backtest, result);
}

export function loadBacktestResult(): PersistedBacktestResult | null {
    return safeRead<PersistedBacktestResult>(KEYS.backtest);
}

export function clearBacktestResult(): void {
    safeRemove(KEYS.backtest);
}
