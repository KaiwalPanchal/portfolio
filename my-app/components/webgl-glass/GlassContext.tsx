'use client';

import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import type { LiquidGlassRef } from './types';

interface GlassCard {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    cornerRadius: number;
}

interface GlassContextType {
    addCard: (card: Omit<GlassCard, 'id'>) => number;
    removeCard: (id: number) => void;
    updateCard: (id: number, updates: Partial<GlassCard>) => void;
    cards: GlassCard[];
    engineRef: React.MutableRefObject<LiquidGlassRef | null>;
    isReady: boolean;
    setReady: (ready: boolean) => void;
}

const GlassContext = createContext<GlassContextType | null>(null);

export const useGlass = () => {
    const ctx = useContext(GlassContext);
    if (!ctx) throw new Error('useGlass must be used within GlassProvider');
    return ctx;
};

export const GlassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cards, setCards] = useState<GlassCard[]>([]);
    const [isReady, setReady] = useState(false);
    const engineRef = useRef<LiquidGlassRef | null>(null);
    const idCounter = useRef(0);

    const addCard = useCallback((card: Omit<GlassCard, 'id'>) => {
        const id = idCounter.current++;
        const newCard = { ...card, id };
        setCards((prev) => [...prev, newCard]);

        // Add to WebGL engine
        if (engineRef.current) {
            engineRef.current.addCard({
                x: card.x,
                y: card.y,
                width: card.width,
                height: card.height,
                cornerRadius: card.cornerRadius,
            });
        }
        return id;
    }, []);

    const removeCard = useCallback((id: number) => {
        setCards((prev) => {
            const index = prev.findIndex((c) => c.id === id);
            if (index !== -1 && engineRef.current) {
                engineRef.current.removeCard(index);
            }
            return prev.filter((c) => c.id !== id);
        });
    }, []);

    const updateCard = useCallback((id: number, updates: Partial<GlassCard>) => {
        setCards((prev) => {
            const index = prev.findIndex((c) => c.id === id);
            if (index !== -1 && engineRef.current) {
                engineRef.current.updateCard(index, updates);
            }
            return prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
        });
    }, []);

    return (
        <GlassContext.Provider value={{ addCard, removeCard, updateCard, cards, engineRef, isReady, setReady }}>
            {children}
        </GlassContext.Provider>
    );
};
