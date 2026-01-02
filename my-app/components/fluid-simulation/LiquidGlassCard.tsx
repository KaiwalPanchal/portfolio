'use client';

import { useFluidSimulation } from './FluidSimulation';
import { useEffect, useRef, useState } from 'react';

interface LiquidGlassCardProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    // Add other props as needed for the glass effect customization, e.g., cornerRadius
}

export default function LiquidGlassCard({ children, className, style, ...props }: LiquidGlassCardProps) {
    const { addCard, removeCard, updateCard } = useFluidSimulation() || {};
    const cardRef = useRef<HTMLDivElement>(null);
    const cardIdRef = useRef<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!addCard || !cardRef.current) return;

        // Initial measurement
        const rect = cardRef.current.getBoundingClientRect();
        const id = addCard({
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: 1.0 - (rect.top + rect.height / 2) / window.innerHeight, // WebGL Y is inverted
            width: rect.width / window.innerWidth,
            height: rect.height / window.innerHeight,
            cornerRadius: 0.02 // default
        });
        cardIdRef.current = id;
        setIsVisible(true);

        return () => {
            if (removeCard && id) {
                removeCard(id);
            }
        };
    }, [addCard, removeCard]);

    useEffect(() => {
        if (!updateCard || !cardIdRef.current || !cardRef.current) return;

        let animationFrameId: number;

        const updatePosition = () => {
            const rect = cardRef.current!.getBoundingClientRect();
            // Check if still on screen (optional optimization, but we update anyway)

            updateCard(cardIdRef.current!, {
                x: (rect.left + rect.width / 2) / window.innerWidth,
                y: 1.0 - (rect.top + rect.height / 2) / window.innerHeight,
                width: rect.width / window.innerWidth,
                height: rect.height / window.innerHeight,
            });

            animationFrameId = requestAnimationFrame(updatePosition);
        };

        updatePosition();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [updateCard]);

    return (
        <div
            ref={cardRef}
            className={`${className} relative`}
            style={{
                ...style,
                // Ensure the background is transparent so the glass shows through
                backgroundColor: 'rgba(255, 255, 255, 0.05)', // slight tint for fallback? Or pure transparent?
                // backdropFilter: 'blur(0px)', // No CSS blur, WebGL does it
                border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            {...props}
        >
            {children}
        </div>
    );
}
