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
                let hasChanges = false;

                const mergedWidgets = incomingWidgets.map(newW => {
                    const existing = existingMap.get(newW.id);
                    if (existing) {
                        const hasRealTitle = existing.title && !existing.title.startsWith("Widget ");
                        const incomingIsFallback = newW.title.startsWith("Widget ");
                        const preservedTitle = (hasRealTitle && incomingIsFallback) ? existing.title : newW.title;

                        // Check if this specific widget actually changed
                        const newProps = Object.keys(newW.props).length > 0 ? newW.props : existing.props;
                        const newComponentName = newW.componentName === 'Unknown' ? existing.componentName : newW.componentName;

                        const changed =
                            preservedTitle !== existing.title ||
                            newComponentName !== existing.componentName ||
                            newProps !== existing.props || // Reference check usually enough here for props
                            newW.position.x !== existing.position.x ||
                            newW.position.y !== existing.position.y ||
                            newW.size.width !== existing.size.width ||
                            newW.size.height !== existing.size.height;

                        if (changed) hasChanges = true;

                        return {
                            ...newW,
                            title: preservedTitle,
                            props: newProps,
                            componentName: newComponentName
                        };
                    }
                    hasChanges = true; // New widget added
                    return newW;
                });

                // Also check if any widgets were removed
                if (!hasChanges && mergedWidgets.length !== state.widgets.length) {
                    hasChanges = true;
                }

                if (!hasChanges) return state;

                return { widgets: mergedWidgets };
            }),

            updateWidget: (id, updates) => set((state) => {
                const widget = state.widgets.find(w => w.id === id);
                if (!widget) return state;

                // Check if anything actually changed to prevent infinite loops
                let hasChanged = false;
                for (const key in updates) {
                    if (key === 'props' && updates.props) {
                        // Shallow check for props
                        const existingProps = widget.props || {};
                        const newProps = updates.props;
                        const keys = Object.keys(newProps);
                        const existingKeys = Object.keys(existingProps);

                        if (keys.length !== existingKeys.length) {
                            hasChanged = true;
                        } else {
                            for (const pKey of keys) {
                                if (newProps[pKey] !== existingProps[pKey]) {
                                    hasChanged = true;
                                    break;
                                }
                            }
                        }
                    } else if ((updates as any)[key] !== (widget as any)[key]) {
                        hasChanged = true;
                    }
                    if (hasChanged) break;
                }

                if (!hasChanged) return state;

                return {
                    widgets: state.widgets.map((w) => {
                        if (w.id === id) {
                            const newWidget = { ...w, ...updates };
                            // If updates contains props, merge them
                            if (updates.props) {
                                newWidget.props = { ...w.props, ...updates.props };
                            }
                            return newWidget;
                        }
                        return w;
                    })
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
