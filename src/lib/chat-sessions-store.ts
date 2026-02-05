import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

export type SessionStatus = 'success' | 'warning' | 'error';

export interface ChatSession {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    status: SessionStatus;
    // messages: any[]; // Todo: If we need to perform deep persistence manually
}

interface ChatSessionsState {
    sessions: ChatSession[];
    activeSessionId: string | null;

    // Actions
    createSession: () => string; // returns new ID
    setActiveSession: (id: string) => void;
    updateSessionTitle: (id: string, newTitle: string) => void;
    updateSessionStatus: (id: string, status: SessionStatus) => void;
    deleteSession: (id: string) => void;
}

export const useChatSessionsStore = create<ChatSessionsState>()(
    persist(
        (set, get) => ({
            sessions: [],
            activeSessionId: null,

            createSession: () => {
                const now = Date.now();
                const existingUntitled = get().sessions.filter(s => s.title.startsWith("Untitled Adaptive CRM"));
                const nextNum = existingUntitled.length + 1;

                const newSession: ChatSession = {
                    id: nanoid(),
                    title: `Untitled Adaptive CRM ${nextNum}`,
                    createdAt: now,
                    updatedAt: now,
                    status: 'success', // Default to success as per request
                };

                set(state => ({
                    sessions: [newSession, ...state.sessions],
                    activeSessionId: newSession.id
                }));

                return newSession.id;
            },

            setActiveSession: (id) => set({ activeSessionId: id }),

            updateSessionTitle: (id, newTitle) => set(state => ({
                sessions: state.sessions.map(s =>
                    s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s
                )
            })),

            updateSessionStatus: (id, status) => set(state => ({
                sessions: state.sessions.map(s =>
                    s.id === id ? { ...s, status, updatedAt: Date.now() } : s
                )
            })),

            deleteSession: (id) => set(state => ({
                sessions: state.sessions.filter(s => s.id !== id),
                activeSessionId: state.activeSessionId === id
                    ? (state.sessions.length > 1 ? state.sessions.find(s => s.id !== id)?.id || null : null)
                    : state.activeSessionId
            })),
        }),
        {
            name: 'chat-sessions-storage',
        }
    )
);
