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
                        opacity: [1, 1, 1],
                        scale: [0.8, 1.2, 0.8],
                        backgroundColor: [
                            "#868686ff", // red-500
                            "#444444ff", // green-500
                            "#505050ff"  // red-500
                        ],
                        boxShadow: [
                            "0 0 0px rgba(239, 68, 68, 0)",
                            "0 0 12px rgba(187, 187, 187, 0.6)", // green glow
                            "0 0 0px rgba(239, 68, 68, 0)"
                        ],
                        borderRadius: ["1px", "50%", "1px"] // Morph: Rectangle -> Circle -> Rectangle
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.1,
                        repeatDelay: 0.2
                    }}
                />
            ))}
        </div>
    );
};
