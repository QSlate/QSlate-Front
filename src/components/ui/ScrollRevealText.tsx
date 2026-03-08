"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

interface ScrollRevealTextProps {
    text: string;
}

export default function ScrollRevealText({ text }: ScrollRevealTextProps) {
    const containerRef = useRef<HTMLParagraphElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 75%", "end 45%"],
    });

    const words = text.split(" ");

    return (
        <p
            ref={containerRef}
            className="text-2xl md:text-3xl lg:text-4xl font-medium tracking-tight text-white text-center leading-[1.5] max-w-4xl mx-auto"
        >
            {words.map((word, i) => {
                const step = 1 / words.length;
                const start = i * step;

                const end = Math.min(start + step * 1.5, 1);
                return (
                    <span key={i}>
                        <Word progress={scrollYProgress} range={[start, end]}>
                            {word}
                        </Word>
                        {i < words.length - 1 && " "}
                    </span>
                );
            })}
        </p>
    );
}

interface WordProps {
    children: string;
    progress: MotionValue<number>;
    range: [number, number];
}

const Word = ({ children, progress, range }: WordProps) => {
    const opacity = useTransform(progress, range, [0.1, 1]);
    const blur = useTransform(progress, range, ["blur(8px)", "blur(0px)"]);
    return <motion.span style={{ opacity, filter: blur }}>{children}</motion.span>;
}
