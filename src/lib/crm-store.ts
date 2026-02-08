"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as React from 'react';

// Canvas widget with component metadata
export interface CanvasWidget {
    id: string;
    type: 'stat' | 'chart' | 'list' | 'progress' | 'datacard' | 'custom';
    componentName: string; // Original Tambo component name
    title: string;
    props: Record<string, any>; // Component props
    messageId?: string; // Associated Tambo message ID
    position: { x: number; y: number };
    size: { width: number; height: number };
}

// Separate in-memory store for React elements (can't be persisted)
const reactElementsMap = new Map<string, React.ReactNode>();

export const setWidgetElement = (id: string, element: React.ReactNode) => {
    reactElementsMap.set(id, element);
};

export const getWidgetElement = (id: string): React.ReactNode | undefined => {
    return reactElementsMap.get(id);
};

export const removeWidgetElement = (id: string) => {
    reactElementsMap.delete(id);
};

// Legacy interface for backward compatibility
export interface CRMWidget {
    id: string;
    type: 'stat' | 'chart' | 'list' | 'progress';
    title: string;
    data: any;
    position: number;
}

interface CanvasState {
    // Canvas widgets
    widgets: CanvasWidget[];

    // Selected widget for chat editing
    selectedWidgetId: string | null;

    // Widget being replaced (for in-place updates)
    widgetBeingReplaced: string | null;

    // Canvas pan & zoom
    canvasOffset: { x: number; y: number };
    zoomLevel: number;

    // Widget actions
    addWidget: (widget: Omit<CanvasWidget, 'id'>, element?: React.ReactNode) => string;
    updateWidget: (id: string, updates: Partial<CanvasWidget>) => void;
    removeWidget: (id: string) => void;
    syncWidgets: (widgets: CanvasWidget[]) => void;

    // Selection
    selectWidgetForChat: (id: string | null) => void;
    getSelectedWidget: () => CanvasWidget | null;

    // Widget replacement
    setWidgetBeingReplaced: (id: string | null) => void;

    // Canvas pan & zoom
    setCanvasOffset: (offset: { x: number; y: number }) => void;
    setZoomLevel: (zoom: number) => void;
    resetCanvasCenter: () => void;

    // Animation
    isFocusing: boolean;
    setFocusing: (isFocusing: boolean) => void;

    // Data Context for Local Tools
    dataContext: Record<string, any>;
    setDataContext: (data: Record<string, any>) => void;
}

export const useCRMStore = create<CanvasState>()(
    persist(
        (set, get) => ({
            widgets: [],
            selectedWidgetId: null,
            widgetBeingReplaced: null,
            canvasOffset: { x: 0, y: 0 },
            zoomLevel: 1,

            isFocusing: false,
            setFocusing: (isFocusing) => set({ isFocusing }),

            dataContext: {}, // Empty by default, falls back to mock-data.ts
            setDataContext: (data) => set((state) => ({
                dataContext: { ...state.dataContext, ...data }
            })),

            addWidget: (widget, element) => {
                const id = crypto.randomUUID();
                // Store the React element in memory
                if (element) {
                    setWidgetElement(id, element);
                }
                set((state) => ({
                    widgets: [
                        ...state.widgets,
                        { ...widget, id }
                    ]
                }));
                return id;
            },

            syncWidgets: (incomingWidgets) => set((state) => {
                const existingMap = new Map(state.widgets.map(w => [w.id, w]));

                const mergedWidgets = incomingWidgets.map(newW => {
                    const existing = existingMap.get(newW.id);
                    if (existing) {
                        // Preserve title and componentName if they are "better" (not default/unknown)
                        // If current title is "Widget ...", overwrite it? 
                        // Actually, if existing has a specific title (not starting with "Widget "), keep it.
                        // Or simply: merge props, but let incoming (position) win?
                        // Let's keep existing title if it doesn't look like a generated ID title, OR if incoming is just fallback.
                        // Safe bet: prefer existing known title over incoming fallback.

                        const hasRealTitle = existing.title && !existing.title.startsWith("Widget ");
                        const incomingIsFallback = newW.title.startsWith("Widget ");
                        const preservedTitle = (hasRealTitle && incomingIsFallback) ? existing.title : newW.title;

                        // DEBUG LOG
                        if (hasRealTitle && incomingIsFallback) {
                            console.log(`[Store] Preserving title for ${newW.id}: "${existing.title}" vs incoming "${newW.title}"`);
                        }

                        return {
                            ...newW,
                            // Verify if we should keep existing title
                            title: preservedTitle,
                            // Keep props if incoming is empty
                            props: Object.keys(newW.props).length > 0 ? newW.props : existing.props,
                            componentName: newW.componentName === 'Unknown' ? existing.componentName : newW.componentName
                        };
                    }
                    return newW;
                });
                return { widgets: mergedWidgets };
            }),

            updateWidget: (id, updates) => set((state) => {
                // DEBUG LOG
                if (updates.title) {
                    console.log(`[Store] Updating widget ${id} title to: "${updates.title}"`);
                }
                return {
                    widgets: state.widgets.map((w) =>
                        w.id === id ? { ...w, ...updates } : w
                    )
                };
            }),

            removeWidget: (id) => {
                removeWidgetElement(id);
                set((state) => ({
                    widgets: state.widgets.filter((w) => w.id !== id),
                    selectedWidgetId: state.selectedWidgetId === id ? null : state.selectedWidgetId
                }));
            },

            selectWidgetForChat: (id) => set({ selectedWidgetId: id }),

            getSelectedWidget: () => {
                const state = get();
                return state.widgets.find(w => w.id === state.selectedWidgetId) || null;
            },

            setWidgetBeingReplaced: (id) => set({ widgetBeingReplaced: id }),

            setCanvasOffset: (offset) => set({ canvasOffset: offset }),

            setZoomLevel: (zoom) => set({ zoomLevel: zoom }),

            resetCanvasCenter: () => set({ canvasOffset: { x: 0, y: 0 }, zoomLevel: 1 }),
        }),
        {
            name: 'intelligent-crm-canvas',
        }
    )
);
