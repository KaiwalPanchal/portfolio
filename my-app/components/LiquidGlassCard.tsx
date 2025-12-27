'use client';

import React, { useRef, useState, useEffect, ReactNode } from 'react';

interface LiquidGlassCardProps {
    children: ReactNode;
    className?: string;
    /** Blur intensity in pixels (default: 12) */
    blur?: number;
    /** Background opacity 0-1 (default: 0.08) */
    backgroundOpacity?: number;
    /** Border opacity 0-1 (default: 0.15) */
    borderOpacity?: number;
    /** Border radius in pixels (default: 12) */
    borderRadius?: number;
    /** Enable glow effect on hover (default: true) */
    glowOnHover?: boolean;
    /** Custom inline styles */
    style?: React.CSSProperties;
    /** HTML element type to render (default: 'div') */
    as?: React.ElementType;
}

const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
    children,
    className = '',
    blur = 12,
    backgroundOpacity = 0.08,
    borderOpacity = 0.15,
    borderRadius = 12,
    glowOnHover = true,
    style,
    as: Component = 'div',
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    // Track mouse position for gradient glow effect
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current || !glowOnHover) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
    };

    const glassStyles: React.CSSProperties = {
        position: 'relative',
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        background: `color-mix(in srgb, var(--foreground) ${backgroundOpacity * 100}%, transparent)`,
        border: `1px solid color-mix(in srgb, var(--foreground) ${borderOpacity * 100}%, transparent)`,
        borderRadius: `${borderRadius}px`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        ...style,
    };

    const glowOverlayStyles: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        borderRadius: `${borderRadius}px`,
        background: isHovered && glowOnHover
            ? `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, color-mix(in srgb, var(--foreground) 15%, transparent) 0%, transparent 50%)`
            : 'transparent',
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
    };

    const shimmerStyles: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        borderRadius: `${borderRadius}px`,
        background: `linear-gradient(
            135deg,
            transparent 0%,
            color-mix(in srgb, var(--foreground) 3%, transparent) 50%,
            transparent 100%
        )`,
        pointerEvents: 'none',
    };

    return (
        <div
            ref={cardRef}
            className={`liquid-glass-card ${className}`}
            style={glassStyles}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Shimmer layer */}
            <div style={shimmerStyles} />

            {/* Dynamic glow overlay */}
            <div style={glowOverlayStyles} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>
        </div>
    );
};

export default LiquidGlassCard;
