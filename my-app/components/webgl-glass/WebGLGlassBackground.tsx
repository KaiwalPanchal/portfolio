'use client';

import React, { useEffect, useRef } from 'react';
import { useGlass } from './GlassContext';
import LiquidGlass from './LiquidGlass';
import type { LiquidGlassRef } from './types';

interface WebGLGlassBackgroundProps {
    className?: string;
    style?: React.CSSProperties;
}

const WebGLGlassBackground: React.FC<WebGLGlassBackgroundProps> = ({ className, style }) => {
    const liquidGlassRef = useRef<LiquidGlassRef>(null);
    const { engineRef, setReady } = useGlass();

    useEffect(() => {
        if (liquidGlassRef.current) {
            // Store a reference to the API for the context to use
            engineRef.current = liquidGlassRef.current;
            setReady(true);
            console.log('WebGL Liquid Glass loaded successfully');
        }

        return () => {
            engineRef.current = null;
            setReady(false);
        };
    }, [engineRef, setReady]);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0,
                ...style,
            }}
            className={className}
        >
            <LiquidGlass
                ref={liquidGlassRef}
                config={{
                    GLASS_ENABLED: true,
                    GLASS_BLUR_RADIUS: 8,
                    DYE_RESOLUTION: 1024,
                }}
            />
        </div>
    );
};

export default WebGLGlassBackground;
