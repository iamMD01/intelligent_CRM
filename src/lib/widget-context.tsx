"use client";
import { createContext, useContext } from 'react';

export const WidgetContext = createContext<{ messageId: string | null }>({ messageId: null });

export const useWidgetContext = () => useContext(WidgetContext);
