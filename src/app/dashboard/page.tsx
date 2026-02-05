"use client";

import { TamboProvider } from "@tambo-ai/react";
import { components, tools } from "@/lib/tambo";
import { BentoGrid } from "@/components/layout/BentoGrid";
import { MorphingChat } from "@/components/layout/MorphingChat";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";

export default function DashboardPage() {
    const mcpServers = useMcpServers();
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
            <TamboMcpProvider>
                <main className="min-h-screen bg-zinc-50 dark:bg-black text-foreground relative selection:bg-black selection:text-white">

                    {/* Dashboard Header */}
                    <div className="absolute top-0 left-0 w-full p-8 flex justify-center pointer-events-none">
                        <div className="flex flex-col items-center">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-center text-zinc-900 dark:text-zinc-50 mix-blend-difference">
                                Adaptable, Intelligent and Ever Evolving CRM
                                <br />
                                <span className="text-3xl md:text-4xl block mt-2 opacity-80">for your any Kind of Business</span>
                            </h1>
                            <p className="text-xs font-medium text-zinc-400 mt-4 uppercase tracking-widest">Apple studio style intro</p>
                        </div>
                    </div>

                    {/* Main Grid Canvas */}
                    <div className="pt-48 min-h-screen">
                        <BentoGrid />
                    </div>

                    {/* Morphing Chat Interface */}
                    <MorphingChat />

                </main>
            </TamboMcpProvider>
        </TamboProvider>
    );
}
