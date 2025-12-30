'use client';

import React, { useEffect, useRef } from 'react';
import FluidAnimation, { defaultConfig } from './fluid-animation';

interface FluidBackgroundProps {
    config?: typeof defaultConfig;
    style?: React.CSSProperties;
    className?: string;
}

const FluidBackground: React.FC<FluidBackgroundProps> = ({ config = defaultConfig, style, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<FluidAnimation | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Initialize the animation
        const animation = new FluidAnimation({
            canvas,
            config: config
        });
        animationRef.current = animation;

        // Random splats to start
        animation.addRandomSplats(parseInt((Math.random() * 20).toString()) + 5);

        // Animation Loop
        let animationFrameId: number;
        const tick = () => {
            animation.update();
            animationFrameId = requestAnimationFrame(tick);
        };
        animationFrameId = requestAnimationFrame(tick);

        // Event Handlers
        const onResize = () => {
            if (canvasRef.current && canvasRef.current.parentElement) {
                canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
                canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
                animation.resize();
            }
        };

        // We attach these to window to ensure we catch movements even if not on the canvas directly
        const onMouseMove = (e: MouseEvent) => {
            // e.preventDefault(); // Don't prevent default on global window, might block selection

            // We need to calculate offsetX/Y relative to the canvas manually since the event is on window
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                // Mock event-like object with calculated offsets
                const mockEvent: any = {
                    offsetX: e.clientX - rect.left,
                    offsetY: e.clientY - rect.top,
                    // Pass through original event properties if needed
                    preventDefault: () => { }
                };
                animation.onMouseMove(mockEvent);
            }
        };

        const onMouseDown = (e: MouseEvent) => {
            // Here we might want to check if we are clicking on interactive elements
            // For now, let's just trigger it.
            animation.onMouseDown(e);
        };

        const onMouseUp = (e: MouseEvent) => {
            animation.onMouseUp(e);
        };

        // Touch events (usually dedicated to specific interaction, so we keep them on window too for broad strokes)
        const onTouchStart = (e: TouchEvent) => {
            animation.onTouchStart(e);
        };

        const onTouchMove = (e: TouchEvent) => {
            animation.onTouchMove(e);
        };

        const onTouchEnd = (e: TouchEvent) => {
            animation.onTouchEnd(e);
        };

        window.addEventListener('resize', onResize);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);

        // For mobile it's often better to keep touch on the element or a container, 
        // but window works for full screen background effects.
        window.addEventListener('touchstart', onTouchStart);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('touchend', onTouchEnd);

        // Initial Resize
        onResize();

        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            cancelAnimationFrame(animationFrameId);
        };
    }, [config]);

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 0, // Behind content (which should be z-10 or similar), but above body background
                pointerEvents: 'none', // Let clicks pass through
                ...style
            }}
            className={className}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block'
                }}
            />
        </div>
    );
};

export default FluidBackground;
