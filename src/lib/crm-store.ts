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

    // Canvas pan offset
    canvasOffset: { x: number; y: number };

    // Widget actions
    addWidget: (widget: Omit<CanvasWidget, 'id'>, element?: React.ReactNode) => string;
    updateWidget: (id: string, updates: Partial<CanvasWidget>) => void;
    removeWidget: (id: string) => void;

    // Selection
    selectWidgetForChat: (id: string | null) => void;
    getSelectedWidget: () => CanvasWidget | null;

    // Canvas pan
    setCanvasOffset: (offset: { x: number; y: number }) => void;
    resetCanvasCenter: () => void;
}

export const useCRMStore = create<CanvasState>()(
    persist(
        (set, get) => ({
            widgets: [],
            selectedWidgetId: null,
            canvasOffset: { x: 0, y: 0 },

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

            updateWidget: (id, updates) => set((state) => ({
                widgets: state.widgets.map((w) =>
                    w.id === id ? { ...w, ...updates } : w
                )
            })),

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

            setCanvasOffset: (offset) => set({ canvasOffset: offset }),

            resetCanvasCenter: () => set({ canvasOffset: { x: 0, y: 0 } }),
        }),
        {
            name: 'intelligent-crm-canvas',
        }
    )
);
