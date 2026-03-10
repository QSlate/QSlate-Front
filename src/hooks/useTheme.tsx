"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "dark",
    toggleTheme: () => { },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");

    useEffect(() => {
        try {
            const stored = localStorage.getItem("qslate_theme") as Theme | null;
            if (stored === "light" || stored === "dark") {
                setTheme(stored);
                document.documentElement.setAttribute("data-theme", stored);
            }
        } catch {

        }
    }, []);

    const toggleTheme = () => {
        setTheme(prev => {
            const next: Theme = prev === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", next);
            try { localStorage.setItem("qslate_theme", next); } catch { /* ignore */ }
            return next;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    return useContext(ThemeContext);
}
