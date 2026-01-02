'use client';

import React from 'react';
import WebGLGlassBackground from '../../components/webgl-glass/WebGLGlassBackground';
import GlassCard from '../../components/webgl-glass/GlassCard';
import { GlassProvider } from '../../components/webgl-glass/GlassContext';
import glassConfig from '../../components/webgl-glass/glass-layout-config.json';

export default function TestGlassPage() {
    return (
        <GlassProvider>
            <main className="relative w-full h-screen overflow-hidden">
                {/* Background Fluid Simulation */}
                <WebGLGlassBackground className="absolute inset-0 z-0" />

                {/* Content Overlay */}
                <div className="relative z-10 w-full h-full pointer-events-none">
                    <h1 className="absolute top-8 left-8 text-4xl font-bold text-white drop-shadow-lg z-50">
                        Liquid Glass Config Test
                    </h1>

                    {/* Dynamically render cards from config */}
                    {glassConfig.glassCards.map((card, index) => {
                        // Convert WebGL Center coordinates (0-1, Y-up) to CSS Top/Left (%, Y-down)
                        // WebGL Y=0 is bottom, Y=1 is top. CSS Top=0 is top.
                        // Y_css_center = 1.0 - card.y
                        // Top = Y_css_center - height/2
                        const cssTop = (1.0 - card.y) - (card.height / 2);
                        const cssLeft = card.x - (card.width / 2);

                        return (
                            <div
                                key={index}
                                className="absolute pointer-events-auto"
                                style={{
                                    top: `${cssTop * 100}%`,
                                    left: `${cssLeft * 100}%`,
                                    width: `${card.width * 100}%`,
                                    height: `${card.height * 100}%`,
                                }}
                            >
                                <GlassCard className="w-full h-full p-6 flex flex-col justify-center items-center">
                                    <h2 className="text-xl font-semibold text-white/90">Config Card {index + 1}</h2>
                                    <p className="text-white/70 text-sm text-center mt-2">
                                        x: {card.x}, y: {card.y}
                                    </p>
                                </GlassCard>
                            </div>
                        );
                    })}
                </div>
            </main>
        </GlassProvider>
    );
}
