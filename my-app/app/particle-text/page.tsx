"use client"

import React, { useState } from "react"
import TextFlow from "@/components/text-flow"

export default function ParticleTextPage() {
    // State for controls
    const [text, setText] = useState("Pola")
    const [particleColor, setParticleColor] = useState("#FFFFFF")
    const [backgroundColor, setBackgroundColor] = useState("#000000")
    const [particleSize, setParticleSize] = useState(2)
    const [particleDensity, setParticleDensity] = useState(4)
    const [mouseRadius, setMouseRadius] = useState(100)
    const [returnSpeed, setReturnSpeed] = useState(0.05)

    // Font state
    const [fontSize, setFontSize] = useState(80)
    const [fontWeight, setFontWeight] = useState("400")

    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-black overflow-hidden font-sans">
            {/* Control Panel */}
            <div className="w-full lg:w-80 bg-gray-900 text-white p-6 overflow-y-auto border-r border-gray-800 z-10 shadow-xl">
                <h1 className="text-xl font-bold mb-6 text-blue-400">Particle Controls</h1>

                <div className="space-y-6">
                    {/* Text Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400">Text Content</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                        />
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-1">Colors</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-xs text-gray-500">Particle</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={particleColor}
                                        onChange={(e) => setParticleColor(e.target.value)}
                                        className="h-8 w-8 bg-transparent cursor-pointer rounded overflow-hidden"
                                    />
                                    <span className="text-xs font-mono">{particleColor}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs text-gray-500">Background</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="color"
                                        value={backgroundColor}
                                        onChange={(e) => setBackgroundColor(e.target.value)}
                                        className="h-8 w-8 bg-transparent cursor-pointer rounded overflow-hidden"
                                    />
                                    <span className="text-xs font-mono">{backgroundColor}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-1">Physics</h2>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <label className="text-xs text-gray-400">Mouse Radius</label>
                                    <span className="text-xs text-blue-400">{mouseRadius}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="20"
                                    max="300"
                                    value={mouseRadius}
                                    onChange={(e) => setMouseRadius(Number(e.target.value))}
                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <label className="text-xs text-gray-400">Return Speed</label>
                                    <span className="text-xs text-blue-400">{returnSpeed}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.01"
                                    max="0.2"
                                    step="0.01"
                                    value={returnSpeed}
                                    onChange={(e) => setReturnSpeed(Number(e.target.value))}
                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-1">Appearance</h2>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <label className="text-xs text-gray-400">Particle Size</label>
                                    <span className="text-xs text-blue-400">{particleSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    step="0.5"
                                    value={particleSize}
                                    onChange={(e) => setParticleSize(Number(e.target.value))}
                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <label className="text-xs text-gray-400">Density (Gap)</label>
                                    <span className="text-xs text-blue-400">{particleDensity}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    step="1"
                                    value={particleDensity}
                                    onChange={(e) => setParticleDensity(Number(e.target.value))}
                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <p className="text-[10px] text-gray-500">Lower is denser (more CPU intensive)</p>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <label className="text-xs text-gray-400">Font Size</label>
                                    <span className="text-xs text-blue-400">{fontSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="20"
                                    max="300"
                                    step="5"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 relative h-full w-full">
                <TextFlow
                    text={text}
                    particleColor={particleColor}
                    backgroundColor={backgroundColor}
                    particleSize={particleSize}
                    particleDensity={particleDensity}
                    mouseRadius={mouseRadius}
                    returnSpeed={returnSpeed}
                    font={{
                        fontSize: `${fontSize}px`,
                        fontWeight: fontWeight,
                        fontFamily: "Inter, sans-serif"
                    }}
                />
            </div>
        </div>
    )
}
