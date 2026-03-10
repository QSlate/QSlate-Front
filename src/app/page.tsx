"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Terminal, Star, LayoutDashboard, Activity, Shield } from "lucide-react";
import ScrollRevealText from "@/components/ui/ScrollRevealText";

export default function Home() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="min-h-[calc(100vh-4rem)] relative flex flex-col items-center pt-24 pb-20 overflow-x-hidden font-sans"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >

      {/* Background glow */}
      <div className="absolute top-[450px] left-1/2 -translate-x-1/2 w-[600px] md:w-[800px] h-[300px] bg-[#00FFB2]/20 blur-[130px] rounded-full pointer-events-none" />

      {/* Hero Content */}
      <div className="flex flex-col items-center justify-center text-center px-4 relative z-10 w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <div className="border border-[#00FFB2]/30 bg-[#00FFB2]/10 text-[#00FFB2] rounded-full px-5 py-2 text-xs font-semibold tracking-wider mb-8 flex items-center justify-center uppercase">
            Beta Available
          </div>

          {/* Main Title */}
          <h1
            className="text-[48px] md:text-[72px] font-semibold tracking-tighter leading-[1.05] mb-6"
            style={{ color: "var(--text-primary)" }}
          >
            Next-Generation <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[#00FFB2]/70">
              Algo Trading.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg max-w-2xl mx-auto mt-2 leading-relaxed font-light"
            style={{ color: "var(--text-secondary)" }}
          >
            Build, test, and deploy quantitative strategies in seconds. The ultimate hyper-modular dashboard for modern traders.
          </p>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/script"
                className="group flex items-center gap-2 bg-[#00FFB2] text-[#050505] font-semibold rounded-full px-8 py-3.5 transition-colors hover:bg-[#00e5a0]"
              >
                Start Building
                <Terminal className="w-4 h-4 ml-1 opacity-90" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/lab"
                className="group flex items-center gap-2 bg-transparent font-medium rounded-full px-8 py-3.5 transition-all"
                style={{
                  border: "1px solid var(--border-hover)",
                  color: "var(--text-primary)",
                }}
              >
                View Lab
                <ArrowRight className="w-4 h-4 ml-1 opacity-80 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-col items-center gap-2">
            <p
              className="text-xs tracking-wider uppercase font-semibold"
              style={{ color: "var(--text-tertiary)" }}
            >
              They trust us
            </p>
            <div className="flex items-center gap-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-[#00FFB2] fill-[#00FFB2]" />
                ))}
              </div>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                4.9 / 5
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dashboard Image */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        className="w-full max-w-6xl mx-auto mt-20 px-4 md:px-8 relative z-10"
      >
        <motion.div
          animate={shouldReduceMotion ? { y: 0 } : { y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative rounded-2xl md:rounded-[32px] overflow-hidden mx-auto before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-1/2 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#00FFB2]/50 before:to-transparent"
          style={{
            border: "1px solid var(--border-default)",
            boxShadow: "0 0 120px -20px rgba(0,255,178,0.25)",
          }}
        >
          <Image
            src="/lab_image.png"
            alt="QSlate Lab Dashboard"
            width={1400}
            height={800}
            priority
            className="w-full h-auto object-cover opacity-95"
          />
          {/* Fading bottom edge */}
          <div
            className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
            style={{ background: "linear-gradient(to top, var(--bg-base) 0%, transparent 100%)" }}
          />
        </motion.div>
      </motion.div>

      {/* Partners Marquee */}
      <div className="w-full mt-32 relative z-10 overflow-hidden">
        <p
          className="text-xs tracking-widest text-center mb-8 font-medium"
          style={{ color: "var(--text-tertiary)" }}
        >
          POWERED BY TOP EXCHANGES &amp; DATA PROVIDERS
        </p>
        <div className="flex whitespace-nowrap overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
          <motion.div
            animate={shouldReduceMotion ? { x: 0 } : { x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
            className="flex gap-16 items-center px-8"
          >
            {[...Array(2)].map((_, i) => (
              <div key={i} aria-hidden={i !== 0} className="flex gap-16 items-center min-w-max">
                {["BINANCE", "Interactive Brokers", "ALPACA", "yahoo! finance", "TradingView", "COINBASE", "KRAKEN"].map(name => (
                  <span
                    key={name}
                    className="text-xl font-bold tracking-tight"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll Reveal Section */}
      <section className="pt-40 pb-20 px-4">
        <ScrollRevealText text="The era of manual trading is fading. QSlate brings institutional-grade quantitative infrastructure directly to your browser. Code your edge in pure Python, backtest against years of data in milliseconds, and execute with absolute precision." />
      </section>

      {/* Why Choose Section (Bento Grid) */}
      <div className="w-full pt-16 pb-24 px-4 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="text-[11px] tracking-[0.2em] text-[#00E676] font-semibold uppercase mb-4">
            WHY CHOOSE QSLATE
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ color: "var(--text-primary)" }}
          >
            Built for the Modern Trader.
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto text-center"
            style={{ color: "var(--text-secondary)" }}
          >
            Everything you need to backtest, analyze, and execute your algorithms in one unified, hyper-modular workspace.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            {
              icon: <LayoutDashboard className="w-6 h-6 text-[#00E676]" />,
              title: "Hyper-Modular Workspace",
              desc: "Drag, drop, and resize widgets to create your perfect trading terminal. From charts to metrics, you control the layout.",
            },
            {
              icon: <Terminal className="w-6 h-6 text-[#00E676]" />,
              title: "Python-Native Engine",
              desc: "Write your strategies in pure Python. Our cloud infrastructure handles the heavy lifting, delivering lightning-fast backtest results directly to your browser.",
            },
            {
              icon: <Activity className="w-6 h-6 text-[#00E676]" />,
              title: "Live Market Data",
              desc: "Connect seamlessly to top exchanges. Watch your algorithms react to real-time tick data with embedded, interactive TradingView charts.",
            },
            {
              icon: <Shield className="w-6 h-6 text-[#00E676]" />,
              title: "Bank-Grade Execution",
              desc: "Execute trades with confidence. Our routing system ensures minimal slippage and maximum security for your API keys.",
            },
          ].map(({ icon, title, desc }) => (
            <motion.div
              key={title}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
              className="lg:col-span-2 rounded-3xl p-8 relative overflow-hidden group flex flex-col justify-between transition-all duration-500"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#00E676]/0 to-[#00E676]/0 group-hover:from-[#00E676]/5 transition-all duration-500 pointer-events-none" />
              <div
                className="p-3 rounded-lg inline-flex w-fit mb-6 relative z-10"
                style={{ background: "var(--interactive-hover-bg)" }}
              >
                {icon}
              </div>
              <div className="relative z-10">
                <h3
                  className="text-xl font-semibold mt-6 mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

    </div>
  );
}
