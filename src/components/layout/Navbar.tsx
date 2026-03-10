"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";

function SunIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isLandingPage = pathname === "/";
    const showBorder = !isLandingPage || isScrolled;
    const isDark = theme === "dark";

    return (
        <nav
            style={{
                background: isScrolled
                    ? "var(--bg-navbar-scrolled)"
                    : "var(--bg-navbar)",
                borderBottomColor: showBorder
                    ? "var(--border-default)"
                    : "transparent",
            }}
            className="h-16 flex items-center justify-between px-[50px] sticky top-0 z-50 transition-all duration-300 backdrop-blur-md border-b"
        >
            {/* Left section: Logo, Title, and main links */}
            <div className="flex items-center gap-25">
                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/logo.png"
                        alt="QSlate Logo"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-lg object-contain"
                    />
                    <span
                        className="font-bold text-xl tracking-tight"
                        style={{ color: "var(--text-primary)" }}
                    >
                        QSlate
                    </span>
                </Link>

                {/* Center links next to logo */}
                <div className="flex items-center gap-4 sm:gap-10">
                    <Link
                        href="/lab"
                        className="text-base font-semibold transition-colors"
                        style={{ color: "var(--text-secondary)" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
                    >
                        Lab
                    </Link>
                    <Link
                        href="/script"
                        className="text-base font-semibold transition-colors"
                        style={{ color: "var(--text-secondary)" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
                    >
                        Script
                    </Link>
                </div>
            </div>

            {/* Right section: Theme toggle + Auth */}
            <div className="flex items-center gap-3">
                {/* Theme toggle button */}
                <button
                    onClick={toggleTheme}
                    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                    title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                    className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                    style={{
                        background: "var(--interactive-hover-bg)",
                        border: "1px solid var(--border-default)",
                        color: "var(--text-secondary)",
                    }}
                >
                    <span
                        className="absolute flex items-center justify-center transition-all duration-500"
                        style={{
                            opacity: isDark ? 1 : 0,
                            transform: isDark ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0.5)",
                        }}
                    >
                        <MoonIcon />
                    </span>
                    <span
                        className="absolute flex items-center justify-center transition-all duration-500"
                        style={{
                            opacity: isDark ? 0 : 1,
                            transform: isDark ? "rotate(-90deg) scale(0.5)" : "rotate(0deg) scale(1)",
                            color: "#F59E0B",
                        }}
                    >
                        <SunIcon />
                    </span>
                </button>

                <Link
                    href="/login"
                    className="text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                    style={{
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-default)",
                    }}
                >
                    Log in
                </Link>
                <Link
                    href="/register"
                    className="bg-[#00FFB2] hover:bg-[#00e6a0] text-[#100F13] text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                >
                    Sign up
                </Link>
            </div>
        </nav>
    );
}
