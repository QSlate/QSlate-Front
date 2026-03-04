import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
    return (
        <nav className="h-16 bg-[#111418] text-white border-b border-gray-800 flex items-center justify-between px-15 sticky top-0 z-50">
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
                    <span className="font-bold text-xl tracking-tight">QSlate</span>
                </Link>

                {/* Center links next to logo */}
                <div className="flex items-center gap-4 sm:gap-10">
                    <Link href="/lab" className="text-gray-300 hover:text-white transition-colors text-base font-semibold">
                        Lab
                    </Link>
                    <Link href="/script" className="text-gray-300 hover:text-white transition-colors text-base font-semibold">
                        Script
                    </Link>
                </div>
            </div>

            {/* Right section: Auth */}
            <div className="flex items-center gap-4">
                <Link
                    href="/login"
                    className="bg-[#1E2229] hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
                >
                    Log in
                </Link>
                <Link
                    href="/register"
                    className="bg-[#00E676] hover:bg-[#00d069] text-[#111418] text-sm font-semibold px-4 py-2 rounded-md transition-colors"
                >
                    Sign up
                </Link>
            </div>
        </nav>
    );
}
