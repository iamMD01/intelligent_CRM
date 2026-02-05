"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTambo } from "@tambo-ai/react";
import { Maximize2, Minimize2, Plus, History, X } from "lucide-react";
import {
    MessageInput,
    MessageInputTextarea,
    MessageInputSubmitButton,
} from "@/components/tambo/message-input";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import { ThreadContent, ThreadContentMessages } from "@/components/tambo/thread-content";
import { useCRMStore } from "@/lib/crm-store";
import { PromptInput, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { useTamboThreadInput } from "@tambo-ai/react";

export const MorphingChat = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    // const [showHistory, setShowHistory] = React.useState(false); // Unused for now
    // const [inputValue, setInputValue] = React.useState(""); // Managed by MessageInput

    const { thread } = useTambo();
    const { submit, setValue, value } = useTamboThreadInput();
    const messages = thread?.messages;
    const [hasMounted, setHasMounted] = React.useState(false);

    React.useEffect(() => {
        setHasMounted(true);
    }, []);

    const toggleOpen = () => setIsOpen(!isOpen);

    if (!hasMounted) return null;

    return (
        <>
            <AnimatePresence>
                {/* --- PILL STATE (Collapsed) --- */}
                {!isOpen && (
                    <motion.div
                        layoutId="chat-container"
                        initial={{ opacity: 0, borderRadius: "50px" }}
                        animate={{ opacity: 1, borderRadius: "50px" }}
                        exit={{ opacity: 0, borderRadius: "50px" }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black p-1.5 rounded-full border border-zinc-800 shadow-2xl"
                    >
                        {/* 1. Main Trigger (Input Area) */}
                        <div
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-full h-12 w-72 flex items-center px-4 cursor-text transition-colors text-left"
                            onClick={() => setIsOpen(true)}
                        >
                            <span className="text-zinc-400 font-medium truncate">Lets Make your intelligent CRM</span>
                        </div>

                        {/* 2. History/Previous Chats Button */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-12 h-12 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center transition-colors text-white font-bold text-xs tracking-tighter"
                            onClick={() => { /* TODO: Toggle History */ }}
                        >
                            CCO
                        </motion.button>

                        {/* 3. User Profile Button */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-12 h-12 rounded-full bg-white border-2 border-zinc-200 overflow-hidden flex items-center justify-center p-0.5"
                        >
                            <img
                                src="https://avatar.vercel.sh/user"
                                alt="User"
                                className="w-full h-full rounded-full object-cover"
                            />
                        </motion.button>
                    </motion.div>
                )}

                {/* --- WINDOW STATE (Expanded) --- */}
                {isOpen && (
                    <motion.div
                        layoutId="chat-container"
                        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] md:w-[600px] h-[600px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-zinc-800 bg-zinc-950 dark"
                        initial={{ borderRadius: "24px" }}
                        animate={{ borderRadius: "24px" }}
                        exit={{ borderRadius: "50px" }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    >
                        {/* Inner Content Wrapper for smoother exit */}
                        <motion.div className="flex flex-col h-full w-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.05 } }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6">
                                <h2 className="font-bold text-lg text-white tracking-tight">Yoga SAAS CRM Simplified</h2>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-white">
                                    <Maximize2 size={20} className="rotate-180" /> {/* Using rotate for shrink effect */}
                                </button>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 relative overflow-hidden">
                                <ScrollableMessageContainer className="h-full p-4">
                                    <ThreadContent>
                                        <ThreadContentMessages />
                                    </ThreadContent>
                                </ScrollableMessageContainer>
                            </div>

                            {/* Input Area (Separated Design) */}
                            <div className="p-6 pt-2">
                                <div className="flex items-center gap-3">
                                    {/* Input Pill */}
                                    <div className="flex-1 min-w-0">
                                        <PromptInput
                                            className="min-h-[56px] flex items-center bg-zinc-900 border border-zinc-800 rounded-full px-4 text-white transition-colors shadow-none [&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:shadow-none [&_[data-slot=input-group]]:bg-transparent [&_[data-slot=input-group]]:focus-within:ring-0 [&_[data-slot=input-group]]:focus-within:border-0"
                                            onSubmit={async () => {
                                                if (!value.trim()) return;
                                                await submit({ streamResponse: true });
                                                setValue("");
                                            }}
                                        >
                                            <PromptInputTextarea
                                                value={value}
                                                onChange={(e) => setValue(e.target.value)}
                                                className="text-lg font-bold placeholder:font-bold min-h-[24px] bg-transparent border-0 focus:ring-0 resize-none text-white placeholder:text-zinc-500 py-1"
                                                placeholder="Lets Make your intelligent CRM"
                                            />
                                        </PromptInput>
                                    </div>

                                    {/* History Button */}
                                    <button
                                        className="w-14 h-14 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center transition-colors text-white font-bold text-xs tracking-tighter shrink-0"
                                        onClick={() => { /* TODO: Toggle History */ }}
                                    >
                                        CCO
                                    </button>

                                    {/* Profile Button */}
                                    <button className="w-14 h-14 rounded-full bg-white border-2 border-zinc-200 overflow-hidden flex items-center justify-center p-0.5 shrink-0">
                                        <img
                                            src="https://avatar.vercel.sh/user"
                                            alt="User"
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </button>
                                </div>
                                <div className="flex justify-between items-center mt-3 px-4 text-xs text-zinc-600 font-medium">
                                    <span>AI can make mistakes. Check important info.</span>
                                    <History size={14} className="cursor-pointer hover:text-zinc-400 transition-colors" />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
