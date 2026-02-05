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

export const MorphingChat = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    // const [showHistory, setShowHistory] = React.useState(false); // Unused for now
    // const [inputValue, setInputValue] = React.useState(""); // Managed by MessageInput

    const { thread } = useTambo();
    const messages = thread?.messages;

    // Auto-open if there are messages (except initial empty state)
    React.useEffect(() => {
        if (messages && messages.length > 0 && !isOpen) {
            setIsOpen(true);
        }
    }, [messages]);

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <>
            <AnimatePresence>
                {/* --- PILL STATE (Collapsed) --- */}
                {!isOpen && (
                    <motion.div
                        layoutId="chat-container"
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    >
                        <div className="bg-zinc-900 text-white rounded-full p-2 shadow-2xl flex items-center gap-2 border border-zinc-800 backdrop-blur-md bg-opacity-90 cursor-pointer"
                            onClick={() => setIsOpen(true)}>

                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                <img src="https://avatar.vercel.sh/user" alt="User" className="w-8 h-8 rounded-full" />
                            </div>

                            <div className="flex-1 text-sm text-zinc-400 px-2 font-medium">
                                Lets Make your intelligent CRM
                            </div>

                            <div className="flex items-center gap-1 pr-2">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                                    onClick={(e) => { e.stopPropagation(); /* TODO: History logic */ }}>
                                    <History size={16} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* --- WINDOW STATE (Expanded) --- */}
                {isOpen && (
                    <motion.div
                        layoutId="chat-container"
                        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] md:w-[600px] h-[600px] max-h-[85vh] flex flex-col shadow-2xl rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <h2 className="font-semibold text-sm">Yoga SAAS CRM Simplified</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                    <Minimize2 size={16} />
                                </button>
                                <button onClick={() => { /* Close/Clear? */ setIsOpen(false); }} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-red-500">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 relative overflow-hidden bg-zinc-50/30 dark:bg-zinc-900/10">
                            <ScrollableMessageContainer className="h-full p-4">
                                <ThreadContent>
                                    <ThreadContentMessages />
                                </ThreadContent>
                            </ScrollableMessageContainer>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
                            <MessageInput>
                                <div className="flex items-end gap-2 bg-zinc-100 dark:bg-zinc-900 p-2 rounded-3xl border border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 mb-1">
                                        <Plus size={16} className="text-zinc-500" />
                                    </div>
                                    <MessageInputTextarea
                                        className="min-h-[44px] max-h-[120px] py-3 bg-transparent border-0 focus-visible:ring-0 px-2"
                                        placeholder="Ask anything..."
                                    />
                                    <MessageInputSubmitButton className="mb-1" />
                                </div>
                            </MessageInput>
                            <div className="flex justify-between items-center mt-2 px-2 text-xs text-zinc-400">
                                <span>AI can make mistakes. Check important info.</span>
                                <div className="flex items-center gap-2">
                                    <History size={14} className="cursor-pointer hover:text-zinc-600" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
