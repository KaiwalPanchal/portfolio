'use client';

import React from 'react';
import FluidBackground from '@/components/fluid-background/FluidBackground';

export default function FluidTestPage() {
    return (
        <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
            <FluidBackground />
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                zIndex: 10,
                pointerEvents: 'none',
                textAlign: 'center'
            }}>
                <h1 className="text-4xl font-bold mb-4">Fluid Animation Test</h1>
                <p>Move your mouse or touch the screen.</p>
            </div>
        </div>
    );
}
