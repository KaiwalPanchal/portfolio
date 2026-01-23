"use client";

import { useState } from "react";
import AnimatedGradientBackground, { templates } from "../../components/liquid/AnimatedLiquidBackground";

export default function LiquidBackgroundPage() {
    const [currentPreset, setCurrentPreset] = useState("Lava");

    return (
        <div className="relative w-full h-screen bg-black">
            {/* Background Component */}
            <div className="absolute inset-0 z-0">
                <AnimatedGradientBackground
                    preset={currentPreset}
                />
            </div>

            {/* Floating Menu */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex gap-3 flex-wrap justify-center max-w-[90%] shadow-xl">
                {Object.keys(templates).map((preset) => (
                    <button
                        key={preset}
                        onClick={() => setCurrentPreset(preset)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${currentPreset === preset
                            ? "bg-white text-black shadow-lg scale-105"
                            : "bg-black/20 text-white hover:bg-white/20"
                            }`}
                    >
                        {preset}
                    </button>
                ))}
            </div>

            {/* Title */}
            <div className="absolute bottom-12 left-0 w-full text-center z-10 pointer-events-none">
                <h1 className="text-white text-4xl md:text-6xl font-bold tracking-tighter opacity-80 mix-blend-overlay">
                    {currentPreset}
                </h1>
                <p className="text-white/50 mt-2 text-sm uppercase tracking-widest">Liquid Shader Preset</p>
            </div>
        </div>
    );
}
