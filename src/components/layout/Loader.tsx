"use client";

import { motion } from "framer-motion";

export const Loader = () => {
    return (
        <div className="grid grid-cols-3 gap-1.5 p-1">
            {Array.from({ length: 9 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="w-2.5 h-2.5 bg-zinc-400 dark:bg-zinc-500 rounded-[1px]"
                    animate={{
                        opacity: [0.2, 1, 0.2],
                        scale: [0.8, 1.1, 0.8],
                        boxShadow: [
                            "0 0 0px rgba(161, 161, 170, 0)",
                            "0 0 8px rgba(161, 161, 170, 0.6)",
                            "0 0 0px rgba(161, 161, 170, 0)"
                        ]
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.1, // Staggered delay
                        repeatDelay: 0.2
                    }}
                />
            ))}
        </div>
    );
};
