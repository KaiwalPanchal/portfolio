'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { initLiquidGlass } from './webgl-core';
import type { WebGLConfig, GlassCard, LiquidGlassRef, LiquidGlassInstance } from './types';

export interface LiquidGlassProps {
    className?: string;
    style?: React.CSSProperties;
    config?: Partial<WebGLConfig>;
}

const LiquidGlass = forwardRef<LiquidGlassRef, LiquidGlassProps>(
    ({ className = '', style, config = {} }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const instanceRef = useRef<LiquidGlassInstance | null>(null);

        // Expose methods to parent via ref
        useImperativeHandle(ref, () => ({
            addCard: (options: Partial<GlassCard>) => {
                if (instanceRef.current) {
                    return instanceRef.current.addCard(options);
                }
                return -1;
            },
            removeCard: (index: number) => {
                if (instanceRef.current) {
                    instanceRef.current.removeCard(index);
                }
            },
            updateCard: (index: number, updates: Partial<GlassCard>) => {
                if (instanceRef.current) {
                    instanceRef.current.updateCard(index, updates);
                }
            },
            clearCards: () => {
                if (instanceRef.current) {
                    instanceRef.current.clearCards();
                }
            },
            getConfig: () => {
                return instanceRef.current?.config || ({} as WebGLConfig);
            },
            getCards: () => {
                return instanceRef.current?.glassCards || [];
            },
        }));

        useEffect(() => {
            // Client-side only check for Next.js SSR
            if (typeof window === 'undefined') return;

            const canvas = canvasRef.current;
            if (!canvas) return;

            // Initialize the WebGL effect
            const instance = initLiquidGlass(canvas, config);
            instanceRef.current = instance;

            if (!instance) {
                console.error('Failed to initialize LiquidGlass');
                return;
            }

            // Add event listeners
            canvas.addEventListener('mousedown', instance.handlers.onMouseDown);
            canvas.addEventListener('mousemove', instance.handlers.onMouseMove);
            window.addEventListener('mouseup', instance.handlers.onMouseUp);
            canvas.addEventListener('touchstart', instance.handlers.onTouchStart, { passive: false });
            canvas.addEventListener('touchmove', instance.handlers.onTouchMove, { passive: false });
            window.addEventListener('touchend', instance.handlers.onTouchEnd);

            // Handle window resize
            const handleResize = () => {
                if (instanceRef.current) {
                    instanceRef.current.handleResize();
                }
            };
            window.addEventListener('resize', handleResize);

            // Cleanup
            return () => {
                canvas.removeEventListener('mousedown', instance.handlers.onMouseDown);
                canvas.removeEventListener('mousemove', instance.handlers.onMouseMove);
                window.removeEventListener('mouseup', instance.handlers.onMouseUp);
                canvas.removeEventListener('touchstart', instance.handlers.onTouchStart);
                canvas.removeEventListener('touchmove', instance.handlers.onTouchMove);
                window.removeEventListener('touchend', instance.handlers.onTouchEnd);
                window.removeEventListener('resize', handleResize);

                if (instanceRef.current) {
                    instanceRef.current.destroy();
                    instanceRef.current = null;
                }
            };
        }, []); // Empty dependency array - only run once on mount

        return (
            <canvas
                ref={canvasRef}
                className={className}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    touchAction: 'none', // Prevent default touch behaviors
                    ...style,
                }}
            />
        );
    }
);

LiquidGlass.displayName = 'LiquidGlass';

export default LiquidGlass;
