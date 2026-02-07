"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import { useCRMStore } from "@/lib/crm-store";
import { useThemeStore } from "@/lib/theme-store";
import { useTambo } from "@tambo-ai/react";
import { cn } from "@/lib/utils";
import { Trash2, MessageSquarePlus, Sparkles, GripVertical } from "lucide-react";

// Widget position and size state
interface WidgetLayout {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Widget data
interface CanvasWidgetData {
    id: string;
    messageId: string;
    renderedComponent: React.ReactNode;
    title: string;
}

// Jelly spring config
const jellySpring = { stiffness: 400, damping: 25, mass: 0.8 };

// Widget renderer - Apple Keynote style
const WidgetRenderer = ({
    widget,
    layout,
    onLayoutChange,
    onContextMenu,
    isSelected,
    onRemove
}: {
    widget: CanvasWidgetData;
    layout: WidgetLayout;
    onLayoutChange: (newLayout: WidgetLayout) => void;
    onContextMenu: (e: React.MouseEvent, widget: CanvasWidgetData) => void;
    isSelected: boolean;
    onRemove: () => void;
}) => {
    const { theme } = useThemeStore();
    const widgetRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Use refs for drag state to avoid re-renders during drag
    const isDragging = useRef(false);
    const isResizing = useRef(false);
    const resizeDir = useRef<string | null>(null);
    const startPos = useRef({ x: 0, y: 0 });
    const startLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });

    // Spring values for jelly effect
    const scaleX = useSpring(1, jellySpring);
    const scaleY = useSpring(1, jellySpring);

    const triggerJelly = useCallback(() => {
        scaleX.set(1.02);
        scaleY.set(0.98);
        setTimeout(() => {
            scaleX.set(0.99);
            scaleY.set(1.01);
        }, 80);
        setTimeout(() => {
            scaleX.set(1);
            scaleY.set(1);
        }, 160);
    }, [scaleX, scaleY]);

    // Optimized drag using RAF
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging.current) {
            const dx = e.clientX - startPos.current.x;
            const dy = e.clientY - startPos.current.y;

            if (widgetRef.current) {
                widgetRef.current.style.transform = `translate(${startLayout.current.x + dx}px, ${startLayout.current.y + dy}px)`;
            }
        } else if (isResizing.current && resizeDir.current) {
            const dx = e.clientX - startPos.current.x;
            const dy = e.clientY - startPos.current.y;
            const dir = resizeDir.current;
            const minSize = 120;

            let newWidth = startLayout.current.width;
            let newHeight = startLayout.current.height;
            let newX = startLayout.current.x;
            let newY = startLayout.current.y;

            if (dir.includes('e')) newWidth = Math.max(minSize, startLayout.current.width + dx);
            if (dir.includes('w')) {
                newWidth = Math.max(minSize, startLayout.current.width - dx);
                newX = startLayout.current.x + (startLayout.current.width - newWidth);
            }
            if (dir.includes('s')) newHeight = Math.max(minSize, startLayout.current.height + dy);
            if (dir.includes('n')) {
                newHeight = Math.max(minSize, startLayout.current.height - dy);
                newY = startLayout.current.y + (startLayout.current.height - newHeight);
            }

            if (widgetRef.current) {
                widgetRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
                widgetRef.current.style.width = `${newWidth}px`;
                widgetRef.current.style.height = `${newHeight}px`;
            }
        }
    }, []);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (isDragging.current) {
            const dx = e.clientX - startPos.current.x;
            const dy = e.clientY - startPos.current.y;
            isDragging.current = false;
            onLayoutChange({
                ...layout,
                x: startLayout.current.x + dx,
                y: startLayout.current.y + dy
            });
            triggerJelly();
        } else if (isResizing.current && resizeDir.current) {
            const dx = e.clientX - startPos.current.x;
            const dy = e.clientY - startPos.current.y;
            const dir = resizeDir.current;
            const minSize = 120;

            let newLayout = { ...layout };

            if (dir.includes('e')) newLayout.width = Math.max(minSize, startLayout.current.width + dx);
            if (dir.includes('w')) {
                newLayout.width = Math.max(minSize, startLayout.current.width - dx);
                newLayout.x = startLayout.current.x + (startLayout.current.width - newLayout.width);
            }
            if (dir.includes('s')) newLayout.height = Math.max(minSize, startLayout.current.height + dy);
            if (dir.includes('n')) {
                newLayout.height = Math.max(minSize, startLayout.current.height - dy);
                newLayout.y = startLayout.current.y + (startLayout.current.height - newLayout.height);
            }

            isResizing.current = false;
            resizeDir.current = null;
            onLayoutChange(newLayout);
            triggerJelly();
        }

        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, [layout, onLayoutChange, triggerJelly]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const handleDragStart = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('[data-resize]')) return;
        e.stopPropagation();
        isDragging.current = true;
        startPos.current = { x: e.clientX, y: e.clientY };
        startLayout.current = { ...layout };
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
    };

    const handleResizeStart = (e: React.MouseEvent, dir: string) => {
        e.stopPropagation();
        isResizing.current = true;
        resizeDir.current = dir;
        startPos.current = { x: e.clientX, y: e.clientY };
        startLayout.current = { ...layout };
        document.body.style.userSelect = 'none';
    };

    // Resize handle - small dots at corners
    const ResizeHandle = ({ dir, className }: { dir: string; className: string }) => (
        <div
            data-resize
            onMouseDown={(e) => handleResizeStart(e, dir)}
            className={cn(
                "absolute w-3 h-3 rounded-full transition-colors opacity-0 group-hover:opacity-100 z-20 cursor-pointer",
                theme === 'dark' ? "bg-zinc-600 hover:bg-emerald-400" : "bg-zinc-400 hover:bg-emerald-500",
                className
            )}
            style={{
                cursor: dir === 'se' || dir === 'nw' ? 'nwse-resize' :
                    dir === 'sw' || dir === 'ne' ? 'nesw-resize' :
                        dir === 'n' || dir === 's' ? 'ns-resize' : 'ew-resize'
            }}
        />
    );

    return (
        <div
            ref={widgetRef}
            onMouseDown={handleDragStart}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onContextMenu={(e) => onContextMenu(e, widget)}
            data-widget="true"
            className="group absolute cursor-grab active:cursor-grabbing"
            style={{
                transform: `translate(${layout.x}px, ${layout.y}px)`,
                width: layout.width,
                height: layout.height,
            }}
        >
            {/* Selection ring */}
            {isSelected && (
                <div className="absolute -inset-1 rounded-2xl ring-2 ring-emerald-500 ring-offset-2 pointer-events-none" />
            )}

            {/* Floating action buttons */}
            <div className={cn(
                "absolute -top-2 -right-2 flex gap-1 transition-opacity z-30",
                isHovered ? "opacity-100" : "opacity-0"
            )}>
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className={cn(
                        "p-1.5 rounded-full shadow-lg border transition-colors",
                        theme === 'dark'
                            ? "bg-zinc-800 border-zinc-700 hover:bg-red-900/50 hover:border-red-700"
                            : "bg-white border-zinc-200 hover:bg-red-50 hover:border-red-200"
                    )}
                >
                    <Trash2 size={12} className="text-red-500" />
                </button>
            </div>

            {/* Drag handle indicator */}
            <div className={cn(
                "absolute -top-2 -left-2 p-1 rounded-full shadow-lg border transition-opacity z-30",
                isHovered ? "opacity-100" : "opacity-0",
                theme === 'dark' ? "bg-zinc-800 border-zinc-700" : "bg-white border-zinc-200"
            )}>
                <GripVertical size={10} className={theme === 'dark' ? "text-zinc-400" : "text-zinc-500"} />
            </div>

            {/* Widget card with Apple Keynote style - rounded corners, theme colors */}
            <div
                className={cn(
                    "w-full h-full rounded-2xl overflow-hidden p-4",
                    theme === 'dark' ? "bg-black" : "bg-[#ECECEC]"
                )}
            >
                {widget.renderedComponent}
            </div>

            {/* Corner resize handles */}
            <ResizeHandle dir="nw" className="-top-1.5 -left-1.5" />
            <ResizeHandle dir="ne" className="-top-1.5 -right-1.5" />
            <ResizeHandle dir="sw" className="-bottom-1.5 -left-1.5" />
            <ResizeHandle dir="se" className="-bottom-1.5 -right-1.5" />
        </div>
    );
};

// Context menu
const ContextMenu = ({ x, y, widget, onClose, onAddToChat }: {
    x: number; y: number; widget: CanvasWidgetData; onClose: () => void; onAddToChat: () => void;
}) => {
    const { theme } = useThemeStore();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
        };
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    return (
        <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ left: x, top: y }}
            className={cn(
                "fixed z-[9999] backdrop-blur-xl rounded-xl shadow-2xl py-1.5 min-w-[160px]",
                theme === 'dark'
                    ? "bg-zinc-900/95 border border-zinc-700/50"
                    : "bg-white/95 border border-zinc-200/50"
            )}
        >
            <button
                onClick={() => { onAddToChat(); onClose(); }}
                className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-left text-sm",
                    theme === 'dark' ? "hover:bg-emerald-900/30" : "hover:bg-emerald-50"
                )}
            >
                <MessageSquarePlus size={14} className="text-emerald-500" />
                <span className={cn("font-medium", theme === 'dark' ? "text-zinc-100" : "text-zinc-900")}>Add to Chat</span>
            </button>
        </motion.div>
    );
};

// Main Canvas - Apple Keynote style
export const BentoGrid = () => {
    const { thread } = useTambo();
    const { theme } = useThemeStore();
    const { selectedWidgetId, canvasOffset, setCanvasOffset, resetCanvasCenter, selectWidgetForChat } = useCRMStore();

    const canvasRef = useRef<HTMLDivElement>(null);
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; widget: CanvasWidgetData } | null>(null);
    const [isAnimatingCenter, setIsAnimatingCenter] = useState(false);
    const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set());
    const [widgetLayouts, setWidgetLayouts] = useState<Record<string, WidgetLayout>>({});

    // Extract widgets from thread
    const widgets: CanvasWidgetData[] = React.useMemo(() => {
        if (!thread?.messages) return [];
        return thread.messages
            .filter(msg => msg.role === 'assistant' && msg.renderedComponent && !msg.isCancelled && !hiddenMessageIds.has(msg.id))
            .map(msg => ({ id: msg.id, messageId: msg.id, renderedComponent: msg.renderedComponent, title: `Widget ${msg.id.substring(0, 6)}` }));
    }, [thread?.messages, hiddenMessageIds]);

    // Init layouts with 10px gap
    useEffect(() => {
        let hasNew = false;
        const newLayouts = { ...widgetLayouts };
        const gap = 10;
        const widgetWidth = 340;
        const widgetHeight = 260;

        widgets.forEach((w, i) => {
            if (!newLayouts[w.id]) {
                const col = i % 3;
                const row = Math.floor(i / 3);
                newLayouts[w.id] = {
                    x: gap + col * (widgetWidth + gap),
                    y: gap + row * (widgetHeight + gap),
                    width: widgetWidth,
                    height: widgetHeight
                };
                hasNew = true;
            }
        });
        if (hasNew) setWidgetLayouts(newLayouts);
    }, [widgets]);

    // Ctrl+F to center
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setIsAnimatingCenter(true);
                resetCanvasCenter();
                setTimeout(() => setIsAnimatingCenter(false), 500);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [resetCanvasCenter]);

    // Canvas pan - optimized with direct DOM
    const handlePanMove = useCallback((e: MouseEvent) => {
        if (!isPanning.current || !canvasRef.current) return;
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        canvasRef.current.style.transform = `translate(${canvasOffset.x + dx}px, ${canvasOffset.y + dy}px)`;
    }, [canvasOffset]);

    const handlePanEnd = useCallback((e: MouseEvent) => {
        if (!isPanning.current) return;
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        isPanning.current = false;
        setCanvasOffset({ x: canvasOffset.x + dx, y: canvasOffset.y + dy });
        document.body.style.cursor = '';
    }, [canvasOffset, setCanvasOffset]);

    useEffect(() => {
        window.addEventListener('mousemove', handlePanMove);
        window.addEventListener('mouseup', handlePanEnd);
        return () => {
            window.removeEventListener('mousemove', handlePanMove);
            window.removeEventListener('mouseup', handlePanEnd);
        };
    }, [handlePanMove, handlePanEnd]);

    const handlePanStart = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('[data-widget]')) return;
        if (e.button !== 0) return;
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = 'grabbing';
    };

    // Empty state
    if (widgets.length === 0) {
        return (
            <div
                data-canvas-space="true"
                className={cn(
                    "flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]",
                    theme === 'dark' ? "bg-[#1A1A1A]" : "bg-white"
                )}
            >
                <div className="max-w-md space-y-4">
                    <div className={cn(
                        "w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 shadow-lg",
                        theme === 'dark' ? "bg-zinc-800" : "bg-gradient-to-br from-emerald-50 to-teal-100"
                    )}>
                        <Sparkles size={32} className="text-emerald-500" />
                    </div>
                    <div className={cn("text-xl font-semibold", theme === 'dark' ? "text-zinc-400" : "text-zinc-500")}>
                        Your canvas is empty
                    </div>
                    <p className={cn("text-sm", theme === 'dark' ? "text-zinc-600" : "text-zinc-400")}>
                        Ask the AI to create a chart, list, or stat card.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Canvas with Apple Keynote style background */}
            <div
                data-canvas-space="true"
                className={cn(
                    "relative min-h-screen overflow-hidden pb-32 cursor-grab active:cursor-grabbing",
                    theme === 'dark' ? "bg-[#1A1A1A]" : "bg-white"
                )}
                onMouseDown={handlePanStart}
            >
                <div
                    ref={canvasRef}
                    className="relative w-full h-full"
                    style={{
                        transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
                        minHeight: '100vh',
                        transition: isAnimatingCenter ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
                    }}
                >
                    <AnimatePresence>
                        {widgets.map((widget) => (
                            <WidgetRenderer
                                key={widget.id}
                                widget={widget}
                                layout={widgetLayouts[widget.id] || { x: 10, y: 10, width: 340, height: 260 }}
                                onLayoutChange={(l) => setWidgetLayouts(prev => ({ ...prev, [widget.id]: l }))}
                                isSelected={selectedWidgetId === widget.id}
                                onContextMenu={(e, w) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, widget: w }); }}
                                onRemove={() => { setHiddenMessageIds(prev => new Set([...prev, widget.messageId])); if (selectedWidgetId === widget.messageId) selectWidgetForChat(null); }}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {isAnimatingCenter && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                                "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-full text-sm shadow-lg pointer-events-none z-50",
                                theme === 'dark' ? "bg-white text-black" : "bg-zinc-900 text-white"
                            )}
                        >
                            Centered
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {contextMenu && (
                    <ContextMenu x={contextMenu.x} y={contextMenu.y} widget={contextMenu.widget} onClose={() => setContextMenu(null)} onAddToChat={() => { selectWidgetForChat(contextMenu.widget.id); setContextMenu(null); }} />
                )}
            </AnimatePresence>
        </>
    );
};
