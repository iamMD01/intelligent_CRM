"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTambo, useTamboThread, useTamboThreadList, useTamboClient } from "@tambo-ai/react";
import { Maximize2, Minimize2, Plus, History, X, Sun, Moon } from "lucide-react";
import {
    MessageInput,
    MessageInputTextarea,
    MessageInputSubmitButton,
} from "@/components/tambo/message-input";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import { ThreadContent, ThreadContentMessages } from "@/components/tambo/thread-content";
import { useCRMStore } from "@/lib/crm-store";
import { useThemeStore } from "@/lib/theme-store";
import { PromptInput, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { useTamboThreadInput } from "@tambo-ai/react";


import { TamboProvider } from "@tambo-ai/react";

interface MorphingChatProps {
    apiKey: string;
    components?: any[];
    tools?: any[];
}

// Legacy wrapper with its own provider (for backwards compatibility)
export const MorphingChat = ({ apiKey, components, tools }: MorphingChatProps) => {
    return (
        <TamboProvider
            apiKey={apiKey}
            components={components}
            tools={tools}
        >
            <MorphingChatContent />
        </TamboProvider>
    );
};

// Exported content component that can be used with external TamboProvider
export const MorphingChatContent = () => {
    const [viewState, setViewState] = React.useState<"pill" | "chat" | "history">("pill");

    return <MorphingChatInner viewState={viewState} setViewState={setViewState} />;
};

// Internal component that actually uses the Tambo hooks
const MorphingChatInner = ({
    viewState, setViewState
}: {
    viewState: "pill" | "chat" | "history";
    setViewState: React.Dispatch<React.SetStateAction<"pill" | "chat" | "history">>;
}) => {
    const { thread } = useTambo();
    const { submit, setValue, value } = useTamboThreadInput();

    // Use Tambo's native thread management for persistence
    const {
        switchCurrentThread,
        startNewThread,
        updateThreadName,
        generateThreadName
    } = useTamboThread();
    const { data: threadList, isLoading: isLoadingThreads, refetch: refetchThreads } = useTamboThreadList();

    const threads = threadList?.items ?? [];
    const currentThreadId = thread?.id;
    const messages = thread?.messages;
    const [hasMounted, setHasMounted] = React.useState(false);

    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editValue, setEditValue] = React.useState("");
    const [hoveredThreadId, setHoveredThreadId] = React.useState<string | null>(null);

    // Get Tambo client for delete operations
    const client = useTamboClient();

    // Get theme for styling
    const { theme, toggleTheme } = useThemeStore();

    // Get selected widget ID from store
    const { selectedWidgetId, selectWidgetForChat } = useCRMStore();

    // Find the selected widget from thread messages (not the store)
    const selectedMessage = React.useMemo(() => {
        if (!selectedWidgetId || !thread?.messages) return null;
        return thread.messages.find(m => m.id === selectedWidgetId);
    }, [selectedWidgetId, thread?.messages]);

    // Dynamic placeholder based on selected widget
    const inputPlaceholder = selectedMessage
        ? `Edit this widget...`
        : "Lets Make your intelligent CRM";

    React.useEffect(() => {
        setHasMounted(true);
    }, []);

    // Handle Delete key press when hovering over a thread
    React.useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (e.key === 'Delete' && hoveredThreadId && viewState === 'history') {
                e.preventDefault();
                await handleDeleteThread(hoveredThreadId);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hoveredThreadId, viewState]);

    const handleDeleteThread = async (threadId: string) => {
        try {
            await client.beta.threads.delete(threadId);
            await refetchThreads();
            // If we deleted the current thread, start a new one
            if (threadId === currentThreadId) {
                await startNewThread();
            }
        } catch (error) {
            console.error("Failed to delete thread:", error);
        }
    };

    const handleCreateSession = async () => {
        try {
            await startNewThread();
            await refetchThreads();
            setViewState("chat");
        } catch (error) {
            console.error("Failed to create new thread:", error);
        }
    };

    const handleSelectSession = async (id: string) => {
        try {
            switchCurrentThread(id);
            setViewState("chat");
        } catch (error) {
            console.error("Failed to switch thread:", error);
        }
    };

    const startEditing = (e: React.MouseEvent, threadItem: { id: string; name?: string | null }) => {
        e.stopPropagation(); // Prevent navigation
        setEditingId(threadItem.id);
        setEditValue(threadItem.name ?? `Thread ${threadItem.id.substring(0, 8)}`);
    };

    const saveTitle = async () => {
        if (editingId && editValue.trim()) {
            try {
                await updateThreadName(editValue.trim(), editingId);
                await refetchThreads();
            } catch (error) {
                console.error("Failed to update thread name:", error);
            }
        }
        setEditingId(null);
    };

    if (!hasMounted) return null;

    return (
        <>
            <AnimatePresence mode="wait">
                {/* ... PILL STATE ... */}
                {viewState === "pill" && (
                    /* ... (Keep existing pill content) ... */
                    <motion.div
                        layoutId="chat-container"
                        initial={{ opacity: 0, scale: 0.9, borderRadius: "50px" }}
                        animate={{ opacity: 1, scale: 1, borderRadius: "50px" }}
                        exit={{ opacity: 0, scale: 0.9, borderRadius: "50px" }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white p-1.5 rounded-full border border-zinc-200 shadow-2xl"
                    >
                        <motion.div
                            key="pill-content"
                            layout
                            className="flex items-center gap-2"
                            initial={{ opacity: 0, filter: "blur(10px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, filter: "blur(10px)" }}
                            transition={{ duration: 0.2 }}
                        >
                            <div
                                className="bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-900 rounded-full h-12 w-72 flex items-center px-4 cursor-text transition-colors text-left"
                                onClick={() => setViewState("chat")}
                            >
                                <span className="text-zinc-500 font-medium truncate">Lets Make your intelligent CRM</span>
                            </div>

                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center transition-colors border",
                                    theme === 'dark'
                                        ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-yellow-400"
                                        : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-900"
                                )}
                                onClick={() => setViewState("history")}
                            >
                                CCO
                            </motion.button>

                            {/* Theme Toggle Button */}
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={toggleTheme}
                                className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center transition-colors border-2",
                                    theme === 'dark'
                                        ? "bg-zinc-800 border-zinc-600 hover:bg-zinc-700"
                                        : "bg-white border-zinc-200 hover:bg-zinc-50"
                                )}
                            >
                                {theme === 'dark' ? (
                                    <Sun size={20} className="text-yellow-400" />
                                ) : (
                                    <Moon size={20} className="text-zinc-600" />
                                )}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}

                {/* --- HISTORY STATE --- */}
                {viewState === "history" && (
                    <motion.div
                        layoutId="chat-container"
                        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] md:w-[500px] h-auto flex flex-col shadow-2xl overflow-hidden border border-zinc-200 bg-white"
                        initial={{ opacity: 0, scale: 0.95, borderRadius: "24px" }}
                        animate={{ opacity: 1, scale: 1, borderRadius: "24px" }}
                        exit={{ opacity: 0, scale: 0.95, borderRadius: "50px" }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    >
                        <motion.div
                            key="history-content"
                            layout
                            className="flex flex-col h-full w-full p-6 pb-4"
                            initial={{ opacity: 0, filter: "blur(10px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, filter: "blur(10px)", transition: { duration: 0.1 } }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-bold text-xl text-zinc-900 tracking-tight">Previous CRM&apos;s</h2>
                                <button
                                    onClick={handleCreateSession}
                                    className="p-1 hover:bg-zinc-100 rounded-full transition-colors text-zinc-900"
                                >
                                    <Plus size={24} className="stroke-[2.5]" />
                                </button>
                            </div>

                            {/* List */}
                            <div className="flex flex-col gap-3 mb-8 max-h-[400px] overflow-y-auto">
                                {isLoadingThreads ? (
                                    <div className="text-zinc-500 text-center py-4">Loading threads...</div>
                                ) : threads.length === 0 ? (
                                    <div className="text-zinc-500 text-center py-4">No previous chats</div>
                                ) : threads.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleSelectSession(item.id)}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            startEditing(e, item);
                                        }}
                                        onMouseEnter={() => setHoveredThreadId(item.id)}
                                        onMouseLeave={() => setHoveredThreadId(null)}
                                        className={cn(
                                            "flex items-center justify-between group p-2 -mx-2 rounded-xl transition-colors text-left cursor-pointer",
                                            currentThreadId === item.id ? "bg-zinc-100" : "hover:bg-zinc-50",
                                            hoveredThreadId === item.id && "ring-1 ring-red-200"
                                        )}
                                    >
                                        <div className="flex-1 mr-4">
                                            {editingId === item.id ? (
                                                <input
                                                    className="w-full bg-transparent font-bold text-lg text-zinc-900 focus:outline-none border-b border-zinc-300"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={saveTitle}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveTitle();
                                                        if (e.key === 'Escape') setEditingId(null);
                                                    }}
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span className="font-bold text-lg text-zinc-900 block truncate">
                                                    {item.name ?? `Thread ${item.id.substring(0, 8)}`}
                                                </span>
                                            )}
                                        </div>

                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Bottom Bar */}
                            <div className="flex items-center gap-3 mt-auto">
                                <button
                                    className="w-14 h-14 rounded-2xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors text-zinc-900"
                                    onClick={() => setViewState("chat")} // Back to chat? Or close?
                                >
                                    <div className="w-6 h-6 border-2 border-zinc-900 rounded-md flex items-center justify-center">
                                        <div className="w-3 h-0.5 bg-zinc-900"></div>
                                    </div>
                                </button>

                                <div className="flex-1 bg-black text-white h-14 rounded-full flex items-center px-6 gap-3">
                                    <span className="font-bold text-lg tracking-tight">CCO</span>
                                    <span className="font-medium text-zinc-300">New and Previous CRM's</span>
                                </div>

                                {/* Theme Toggle Button */}
                                <button
                                    onClick={toggleTheme}
                                    className={cn(
                                        "w-14 h-14 rounded-full flex items-center justify-center transition-colors border-2 shrink-0",
                                        theme === 'dark'
                                            ? "bg-zinc-800 border-zinc-600 hover:bg-zinc-700"
                                            : "bg-white border-zinc-100 hover:bg-zinc-50"
                                    )}
                                >
                                    {theme === 'dark' ? (
                                        <Sun size={22} className="text-yellow-400" />
                                    ) : (
                                        <Moon size={22} className="text-zinc-600" />
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* --- WINDOW STATE (Expanded) --- */}
                {viewState === "chat" && (
                    <motion.div
                        layoutId="chat-container"
                        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] md:w-[600px] h-[600px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-zinc-200 bg-white"
                        initial={{ opacity: 0, scale: 0.95, borderRadius: "24px" }}
                        animate={{ opacity: 1, scale: 1, borderRadius: "24px" }}
                        exit={{ opacity: 0, scale: 0.95, borderRadius: "50px" }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    >
                        {/* Inner Content Wrapper for smoother exit */}
                        <motion.div
                            key="window-content"
                            layout
                            className="flex flex-col h-full w-full"
                            initial={{ opacity: 0, filter: "blur(10px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, filter: "blur(10px)", transition: { duration: 0.1 } }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6">
                                <div
                                    className="flex-1 mr-4"
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        if (thread) startEditing(e, thread);
                                    }}
                                >
                                    {editingId === currentThreadId && currentThreadId ? (
                                        <input
                                            className="w-full bg-transparent font-bold text-lg text-zinc-900 focus:outline-none border-b border-zinc-300"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={saveTitle}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveTitle();
                                                if (e.key === 'Escape') setEditingId(null);
                                            }}
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <h2 className="font-bold text-lg text-zinc-900 tracking-tight cursor-text hover:bg-zinc-50 rounded px-1 -ml-1 transition-colors truncate">
                                            {thread?.name ?? "Untitled Adaptive CRM"}
                                        </h2>
                                    )}
                                </div>
                                <button onClick={() => setViewState("pill")} className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500 hover:text-zinc-900">
                                    <Minimize2 size={20} />
                                </button>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 relative overflow-hidden">
                                <ScrollableMessageContainer key={currentThreadId} className="h-full p-4">
                                    <ThreadContent>
                                        <ThreadContentMessages />
                                    </ThreadContent>
                                </ScrollableMessageContainer>
                            </div>

                            {/* Input Area (Separated Design) */}
                            <div className="p-6 pt-2">
                                {/* Widget Selection Chip - Shows when a widget is selected for editing */}
                                <AnimatePresence>
                                    {selectedMessage && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="mb-3 flex items-center gap-2"
                                        >
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-sm">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="font-medium text-emerald-700">
                                                    Editing widget
                                                </span>
                                                <button
                                                    onClick={() => selectWidgetForChat(null)}
                                                    className="ml-1 p-0.5 hover:bg-emerald-100 rounded-full transition-colors"
                                                    title="Deselect widget"
                                                >
                                                    <X size={14} className="text-emerald-600" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex items-center gap-3">
                                    {/* Input Pill */}
                                    <div className="flex-1 min-w-0">
                                        <PromptInput
                                            className="min-h-[56px] flex items-center bg-zinc-50 border border-zinc-200 rounded-full px-4 text-zinc-900 transition-colors shadow-none [&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:shadow-none [&_[data-slot=input-group]]:bg-transparent [&_[data-slot=input-group]]:focus-within:ring-0 [&_[data-slot=input-group]]:focus-within:border-0"
                                            onSubmit={async () => {
                                                if (!value.trim()) return;
                                                // For now, just submit the message - Tambo will handle the component update
                                                await submit({ streamResponse: true });
                                                setValue("");
                                                // Clear widget selection after submission
                                                selectWidgetForChat(null);
                                            }}
                                        >
                                            <PromptInputTextarea
                                                value={value}
                                                onChange={(e) => setValue(e.target.value)}
                                                className="text-[15px] font-medium leading-relaxed placeholder:font-medium min-h-[40px] bg-transparent border-0 focus:ring-0 resize-none text-zinc-900 placeholder:text-zinc-400 pt-3"
                                                placeholder={inputPlaceholder}
                                            />
                                        </PromptInput>
                                    </div>

                                    {/* History Button */}
                                    <button
                                        className="w-14 h-14 rounded-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 flex items-center justify-center transition-colors text-zinc-900 font-bold text-xs tracking-tighter shrink-0"
                                        onClick={() => setViewState("history")}
                                    >
                                        CCO
                                    </button>

                                    {/* Theme Toggle Button */}
                                    <button
                                        onClick={toggleTheme}
                                        className={cn(
                                            "w-14 h-14 rounded-full flex items-center justify-center transition-colors border-2 shrink-0",
                                            theme === 'dark'
                                                ? "bg-zinc-800 border-zinc-600 hover:bg-zinc-700"
                                                : "bg-white border-zinc-200 hover:bg-zinc-50"
                                        )}
                                    >
                                        {theme === 'dark' ? (
                                            <Sun size={22} className="text-yellow-400" />
                                        ) : (
                                            <Moon size={22} className="text-zinc-600" />
                                        )}
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
