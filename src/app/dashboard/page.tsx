"use client";

import { components, tools } from "@/lib/tambo";
import { BentoGrid } from "@/components/layout/BentoGrid";
import { MorphingChatContent } from "@/components/layout/MorphingChat";
import { TamboProvider } from "@tambo-ai/react";

export default function DashboardPage() {
    const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

    if (!apiKey) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-zinc-50 text-zinc-900">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">API Key Missing</h2>
                    <p className="text-zinc-600 mb-4">
                        Please add your <code>NEXT_PUBLIC_TAMBO_API_KEY</code> to <code>.env.local</code>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <TamboProvider
            apiKey={apiKey}
            components={components}
            tools={tools}
        >
            <main className="min-h-screen bg-white dark:bg-[#1A1A1A] text-foreground relative selection:bg-black selection:text-white">

                {/* Main Grid Canvas */}
                <div className="min-h-screen">
                    <BentoGrid />
                </div>

                {/* Morphing Chat Interface - Uses shared TamboProvider context */}
                <MorphingChatContent />

            </main>
        </TamboProvider>
    );
}
