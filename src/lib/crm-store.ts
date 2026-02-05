import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CRMWidget {
    id: string;
    type: 'stat' | 'chart' | 'list' | 'progress';
    title: string;
    data: any;
    position: number; // For sorting
}

interface CRMState {
    widgets: CRMWidget[];
    addWidget: (widget: Omit<CRMWidget, 'id' | 'position'>) => void;
    updateWidget: (id: string, updates: Partial<CRMWidget>) => void;
    removeWidget: (id: string) => void;
    reorderWidgets: (widgets: CRMWidget[]) => void;
}

export const useCRMStore = create<CRMState>()(
    persist(
        (set) => ({
            widgets: [],

            addWidget: (widget) => set((state) => ({
                widgets: [
                    ...state.widgets,
                    {
                        ...widget,
                        id: crypto.randomUUID(),
                        position: state.widgets.length,
                    }
                ]
            })),

            updateWidget: (id, updates) => set((state) => ({
                widgets: state.widgets.map((w) =>
                    w.id === id ? { ...w, ...updates } : w
                )
            })),

            removeWidget: (id) => set((state) => ({
                widgets: state.widgets.filter((w) => w.id !== id)
            })),

            reorderWidgets: (widgets) => set({ widgets }),
        }),
        {
            name: 'intelligent-crm-storage',
        }
    )
);
