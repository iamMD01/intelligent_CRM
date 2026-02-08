"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import { useCRMStore } from "@/lib/crm-store";
import { useThemeStore } from "@/lib/theme-store";
import { useTambo } from "@tambo-ai/react";
import { cn } from "@/lib/utils";
import { Trash2, MessageSquarePlus, Sparkles, GripVertical } from "lucide-react";
import { sounds } from "@/lib/sounds";

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

// TWEAK WIDGET CORNER RADIUS HERE
// Use a larger value (e.g., 32px or 40px) to achieve a more "squircle" look.
const WIDGET_CORNER_RADIUS = "32px";

// Widget renderer - Apple Keynote style
const WidgetRenderer = ({
    widget,
    layout,
    onLayoutChange,
    onContextMenu,
    isSelected,
    onRemove,
    onMeasure,
    isNewlyCreated = false
}: {
    widget: CanvasWidgetData;
    layout: WidgetLayout;
    onLayoutChange: (newLayout: WidgetLayout) => void;
    onContextMenu: (e: React.MouseEvent, widget: CanvasWidgetData) => void;
    isSelected: boolean;
    onRemove: () => void;
    onMeasure?: (id: string, width: number, height: number) => void;
    isNewlyCreated?: boolean;
}) => {
    const { theme } = useThemeStore();
    const widgetRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const hasMeasured = useRef(false);

    // Auto-measure content size when widget is newly created
    useEffect(() => {
        if (!isNewlyCreated || hasMeasured.current || !contentRef.current || !onMeasure) return;

        // Use ResizeObserver to wait for content to render properly
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry && !hasMeasured.current) {
                const { scrollWidth, scrollHeight } = entry.target;
                // Add padding (16px * 2 = 32px) and some extra buffer
                const measuredWidth = Math.max(200, Math.min(600, scrollWidth + 48));
                const measuredHeight = Math.max(120, Math.min(500, scrollHeight + 48));

                // Only update if content is larger than current layout
                if (measuredWidth > layout.width || measuredHeight > layout.height) {
                    onMeasure(widget.id, measuredWidth, measuredHeight);
                }
                hasMeasured.current = true;
                observer.disconnect();
            }
        });

        observer.observe(contentRef.current);
        return () => observer.disconnect();
    }, [isNewlyCreated, onMeasure, widget.id, layout.width, layout.height]);

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
                <div
                    style={{ borderRadius: `calc(${WIDGET_CORNER_RADIUS} + 4px)` }}
                    className="absolute -inset-1 ring-2 ring-emerald-500 ring-offset-2 pointer-events-none"
                />
            )}

            {/* Newly created animation - green pulsing border for 3 seconds */}
            {isNewlyCreated && !isSelected && (
                <motion.div
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: [1, 0.5, 1], scale: [1, 1.02, 1] }}
                    transition={{ duration: 0.8, repeat: 3, ease: "easeInOut" }}
                    style={{ borderRadius: `calc(${WIDGET_CORNER_RADIUS} + 4px)` }}
                    className="absolute -inset-1 ring-2 ring-emerald-400 ring-offset-2 pointer-events-none"
                />
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
                ref={contentRef}
                style={{ borderRadius: WIDGET_CORNER_RADIUS }}
                className={cn(
                    "w-full h-full overflow-auto p-4",
                    theme === 'dark' ? "bg-black" : "bg-white"
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
    const { selectedWidgetId, canvasOffset, setCanvasOffset, resetCanvasCenter, selectWidgetForChat, widgetBeingReplaced, setWidgetBeingReplaced } = useCRMStore();

    const canvasRef = useRef<HTMLDivElement>(null);
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; widget: CanvasWidgetData } | null>(null);
    const [isAnimatingCenter, setIsAnimatingCenter] = useState(false);
    const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set());
    const [widgetLayouts, setWidgetLayouts] = useState<Record<string, WidgetLayout>>({});
    const [isMounted, setIsMounted] = useState(false);
    const [newlyCreatedWidgetIds, setNewlyCreatedWidgetIds] = useState<Set<string>>(new Set());

    // Undo history stack (stores previous states)
    const undoHistory = useRef<Array<{
        layouts: Record<string, WidgetLayout>;
        hidden: Set<string>;
    }>>([]);
    const MAX_UNDO_HISTORY = 50;

    // Save state to undo history before making changes
    const saveToUndoHistory = useCallback(() => {
        undoHistory.current.push({
            layouts: { ...widgetLayouts },
            hidden: new Set(hiddenMessageIds)
        });
        // Limit history size
        if (undoHistory.current.length > MAX_UNDO_HISTORY) {
            undoHistory.current.shift();
        }
    }, [widgetLayouts, hiddenMessageIds]);

    // Undo function
    const undo = useCallback(() => {
        if (undoHistory.current.length === 0) return;

        const previousState = undoHistory.current.pop();
        if (previousState) {
            setWidgetLayouts(previousState.layouts);
            setHiddenMessageIds(previousState.hidden);
            sounds.select(); // Play a subtle sound for undo
        }
    }, []);

    // Storage key based on thread ID for persistence
    const storageKey = thread?.id ? `crm-layouts-${thread.id}` : null;
    const hiddenStorageKey = thread?.id ? `crm-hidden-${thread.id}` : null;

    // Load layouts from localStorage on mount
    useEffect(() => {
        if (!storageKey || !hiddenStorageKey) return;

        try {
            const savedLayouts = localStorage.getItem(storageKey);
            if (savedLayouts) {
                setWidgetLayouts(JSON.parse(savedLayouts));
            }

            const savedHidden = localStorage.getItem(hiddenStorageKey);
            if (savedHidden) {
                setHiddenMessageIds(new Set(JSON.parse(savedHidden)));
            }
        } catch (e) {
            console.warn('Failed to load widget layouts from localStorage:', e);
        }
    }, [storageKey, hiddenStorageKey]);

    // Save layouts to localStorage whenever they change
    useEffect(() => {
        if (!storageKey || !isMounted || Object.keys(widgetLayouts).length === 0) return;

        try {
            localStorage.setItem(storageKey, JSON.stringify(widgetLayouts));
        } catch (e) {
            console.warn('Failed to save widget layouts to localStorage:', e);
        }
    }, [widgetLayouts, storageKey, isMounted]);

    // Save hidden message IDs to localStorage whenever they change
    useEffect(() => {
        if (!hiddenStorageKey || !isMounted || hiddenMessageIds.size === 0) return;

        try {
            localStorage.setItem(hiddenStorageKey, JSON.stringify([...hiddenMessageIds]));
        } catch (e) {
            console.warn('Failed to save hidden IDs to localStorage:', e);
        }
    }, [hiddenMessageIds, hiddenStorageKey, isMounted]);

    // Prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Extract widgets from thread
    const widgets: CanvasWidgetData[] = React.useMemo(() => {
        if (!thread?.messages) return [];
        return thread.messages
            .filter(msg => msg.role === 'assistant' && msg.renderedComponent && !msg.isCancelled && !hiddenMessageIds.has(msg.id))
            .map(msg => ({ id: msg.id, messageId: msg.id, renderedComponent: msg.renderedComponent, title: `Widget ${msg.id.substring(0, 6)}` }));
    }, [thread?.messages, hiddenMessageIds]);

    // Init layouts with smart sizing based on content type
    useEffect(() => {
        let hasNew = false;
        const newWidgetIds: string[] = [];
        const newLayouts = { ...widgetLayouts };
        const gap = 20;

        // Size categories based on content complexity
        const getWidgetSize = (widget: CanvasWidgetData, index: number): { width: number; height: number } => {
            // Pattern matching for widget types (heuristic sizing)
            const widgetNum = index % 6;

            // Create variety: some small, some medium, some large
            switch (widgetNum) {
                case 0: return { width: 200, height: 140 };
                case 1: return { width: 280, height: 180 };
                case 2: return { width: 400, height: 220 };
                case 3: return { width: 220, height: 300 };
                case 4: return { width: 360, height: 280 };
                default: return { width: 300, height: 200 };
            }
        };

        // Calculate starting position from existing widgets' bounds
        let maxY = gap;
        let lastRowY = gap;
        let lastRowMaxHeight = 0;
        let lastRowX = gap;
        const canvasWidth = 1100;

        // Find the bottom-most position and the last row's state from existing layouts
        Object.values(newLayouts).forEach(layout => {
            const bottomY = layout.y + layout.height;
            if (layout.y === lastRowY || layout.y > lastRowY) {
                // Same row or new row
                if (layout.y > lastRowY) {
                    lastRowY = layout.y;
                    lastRowX = layout.x + layout.width + gap;
                    lastRowMaxHeight = layout.height;
                } else {
                    lastRowX = Math.max(lastRowX, layout.x + layout.width + gap);
                    lastRowMaxHeight = Math.max(lastRowMaxHeight, layout.height);
                }
            }
            maxY = Math.max(maxY, bottomY + gap);
        });

        // Position tracking for new widgets
        let currentX = lastRowX;
        let currentY = Object.keys(newLayouts).length > 0 ? lastRowY : gap;
        let rowMaxHeight = Object.keys(newLayouts).length > 0 ? lastRowMaxHeight : 0;

        // Check if we're replacing a widget
        const replacingId = widgetBeingReplaced;
        const oldLayout = replacingId ? widgetLayouts[replacingId] : null;

        widgets.forEach((w, i) => {
            if (!newLayouts[w.id]) {
                // Check if this new widget should inherit position from replaced widget
                if (replacingId && oldLayout && !hiddenMessageIds.has(w.id)) {
                    // This is the replacement widget - use old widget's position and size
                    newLayouts[w.id] = { ...oldLayout };

                    // Hide the old widget
                    setHiddenMessageIds(prev => new Set([...prev, replacingId]));

                    // Clear the replacement state
                    setWidgetBeingReplaced(null);
                    hasNew = true;
                    newWidgetIds.push(w.id);
                    return;
                }

                const size = getWidgetSize(w, i);

                // Check if widget fits in current row
                if (currentX + size.width + gap > canvasWidth) {
                    currentX = gap;
                    currentY += rowMaxHeight + gap;
                    rowMaxHeight = 0;
                }

                newLayouts[w.id] = {
                    x: currentX,
                    y: currentY,
                    width: size.width,
                    height: size.height
                };

                currentX += size.width + gap;
                rowMaxHeight = Math.max(rowMaxHeight, size.height);
                hasNew = true;
                newWidgetIds.push(w.id);
            }
        });
        if (hasNew) {
            // Play sound: update if replacing, create if new
            if (widgetBeingReplaced) {
                sounds.update();
            } else {
                sounds.create();
            }
            setWidgetLayouts(newLayouts);

            // Track newly created widgets for green animation
            setNewlyCreatedWidgetIds(prev => new Set([...prev, ...newWidgetIds]));

            // Auto-center canvas on the last newly created widget
            if (newWidgetIds.length > 0) {
                const lastNewWidgetId = newWidgetIds[newWidgetIds.length - 1];
                const widgetLayout = newLayouts[lastNewWidgetId];
                if (widgetLayout) {
                    // Calculate offset to center the widget on screen
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    const widgetCenterX = widgetLayout.x + widgetLayout.width / 2;
                    const widgetCenterY = widgetLayout.y + widgetLayout.height / 2;

                    // Calculate new canvas offset to center this widget
                    const newOffsetX = viewportWidth / 2 - widgetCenterX;
                    const newOffsetY = viewportHeight / 2 - widgetCenterY - 50; // -50 to account for chat island

                    // Animate to new position
                    setIsAnimatingCenter(true);
                    setCanvasOffset({ x: newOffsetX, y: newOffsetY });
                    setTimeout(() => setIsAnimatingCenter(false), 400);
                }
            }

            // Remove from newly created after 3 seconds
            setTimeout(() => {
                setNewlyCreatedWidgetIds(prev => {
                    const next = new Set(prev);
                    newWidgetIds.forEach(id => next.delete(id));
                    return next;
                });
            }, 3000);
        }
    }, [widgets, widgetBeingReplaced]);

    // Ctrl+F to center, Ctrl+Z to undo
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setIsAnimatingCenter(true);
                resetCanvasCenter();
                setTimeout(() => setIsAnimatingCenter(false), 500);
            }
            // Ctrl+Z to undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [resetCanvasCenter, undo]);

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

    // Show loading state during SSR to prevent hydration mismatch
    if (!isMounted) {
        return (
            <div
                data-canvas-space="true"
                className="min-h-screen bg-[#ECECEC] dark:bg-[#1A1A1A]"
            />
        );
    }

    // Empty state
    if (widgets.length === 0) {
        return (
            <div
                data-canvas-space="true"
                className={cn(
                    "min-h-screen flex flex-col items-center justify-center p-8",
                    theme === 'dark' ? "bg-[#1A1A1A]" : "bg-[#ECECEC]"
                )}
            >
                {/* HERO SECTION - Same as landing page */}
                <section className="relative w-full max-w-6xl mx-auto rounded-[40px] overflow-hidden">

                    {/* BACKGROUND GIF BAND */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1200px] w-full rounded-[100px] overflow-hidden">
                        <img
                            src="/images/hero.gif"
                            alt=""
                            className="w-full h-full object-contain rotate-90"
                        />
                    </div>

                    {/* HERO CONTENT */}
                    <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-40">
                        <img
                            src="/images/hero-text.svg"
                            alt="Generative CRM - A prompt-driven, AI-generated CRM for SaaS founders."
                            className="w-full max-w-6xl h-auto"
                        />
                    </div>

                </section>

                {/* INSTRUCTION MESSAGE */}
                <div className={cn(
                    "mt-8 text-center max-w-lg mx-auto",
                    theme === 'dark' ? "text-zinc-400" : "text-zinc-600"
                )}>
                    <p className="text-lg font-bold mb-2">
                        👋 Start by chatting with AI
                    </p>
                    <p className={cn(
                        "text-bold",
                        theme === 'dark' ? "text-zinc-500" : "text-zinc-500"
                    )}>
                        Use the chat island below to create charts, stats, lists, and more.
                        <br />
                        Try: <span className="font-bold">"Create a revenue chart"</span> or <span className="font-bold">"Show me customer stats"</span>
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
                    theme === 'dark' ? "bg-[#1A1A1A]" : "bg-[#ECECEC]"
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
                                onLayoutChange={(l) => {
                                    saveToUndoHistory();
                                    setWidgetLayouts(prev => ({ ...prev, [widget.id]: l }));
                                }}
                                isSelected={selectedWidgetId === widget.id}
                                isNewlyCreated={newlyCreatedWidgetIds.has(widget.id)}
                                onMeasure={(id, width, height) => {
                                    setWidgetLayouts(prev => {
                                        const current = prev[id];
                                        if (current) {
                                            return { ...prev, [id]: { ...current, width, height } };
                                        }
                                        return prev;
                                    });
                                }}
                                onContextMenu={(e, w) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, widget: w }); }}
                                onRemove={() => {
                                    saveToUndoHistory();
                                    sounds.delete();
                                    setHiddenMessageIds(prev => new Set([...prev, widget.messageId]));
                                    if (selectedWidgetId === widget.messageId) selectWidgetForChat(null);
                                }}
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
                    <ContextMenu x={contextMenu.x} y={contextMenu.y} widget={contextMenu.widget} onClose={() => setContextMenu(null)} onAddToChat={() => { sounds.addToChat(); selectWidgetForChat(contextMenu.widget.id); setContextMenu(null); }} />
                )}
            </AnimatePresence>
        </>
    );
};
