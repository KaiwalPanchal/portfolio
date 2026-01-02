'use client';

import { useEffect, useRef, createContext, useContext, useState } from 'react';
import { startFluidSimulation } from './fluid-engine';

interface FluidContextType {
    addCard: (options: any) => string;
    removeCard: (id: string) => void;
    updateCard: (id: string, options: any) => void;
}

const FluidContext = createContext<FluidContextType | null>(null);

export function useFluidSimulation() {
    return useContext(FluidContext);
}

export default function FluidSimulation({ children }: { children?: React.ReactNode }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fluidApi, setFluidApi] = useState<FluidContextType | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const engine = startFluidSimulation(canvas);

        setFluidApi({
            addCard: engine.addCard,
            removeCard: engine.removeCard,
            updateCard: engine.updateCard
        });

        return () => {
            engine.cleanup();
        };
    }, []);

    return (
        <FluidContext.Provider value={fluidApi}>
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block', // prevent scrollbar issues
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 0
                }}
            />
            {children}
        </FluidContext.Provider>
    );
}
