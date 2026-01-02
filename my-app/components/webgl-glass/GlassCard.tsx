'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useGlass } from './GlassContext';
import styles from './GlassCard.module.css';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', style }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const { addCard, removeCard, updateCard, isReady } = useGlass();
    const cardIdRef = useRef<number>(-1);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!isReady || !cardRef.current) return;

        const updatePosition = () => {
            if (!cardRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            const width = rect.width / vw;
            const height = rect.height / vh;
            const x = (rect.left + rect.width / 2) / vw;
            const y = 1.0 - ((rect.top + rect.height / 2) / vh); // Flip Y for WebGL

            if (cardIdRef.current === -1) {
                cardIdRef.current = addCard({
                    x, y, width, height,
                    cornerRadius: 0.015
                });
            } else {
                updateCard(cardIdRef.current, { x, y, width, height });
            }
        };

        updatePosition();
        window.addEventListener('scroll', updatePosition);
        window.addEventListener('resize', updatePosition);

        const observer = new ResizeObserver(updatePosition);
        observer.observe(cardRef.current);

        return () => {
            if (cardIdRef.current !== -1) {
                removeCard(cardIdRef.current);
                cardIdRef.current = -1;
            }
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
            observer.disconnect();
        };
    }, [isReady, addCard, removeCard, updateCard]);

    return (
        <div
            ref={cardRef}
            className={`${styles.glassCard} ${className}`}
            style={style}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}
        </div>
    );
};

export default GlassCard;
