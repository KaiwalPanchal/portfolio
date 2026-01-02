'use client';

import { useState, useCallback } from 'react';
import FluidSimulation from '@/components/fluid-simulation/FluidSimulation';
import LiquidGlassCard from '@/components/fluid-simulation/LiquidGlassCard';
import { config } from '@/components/fluid-simulation/config';

// Slider component for controlling config values
function ConfigSlider({
    label,
    value,
    min,
    max,
    step = 0.01,
    onChange,
    description
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    description?: string;
}) {
    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-white">{label}</label>
                <span className="text-xs text-blue-300 font-mono">{value.toFixed(3)}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            {description && (
                <p className="text-xs text-gray-400 mt-1">{description}</p>
            )}
        </div>
    );
}

// Toggle component for boolean values
function ConfigToggle({
    label,
    value,
    onChange,
    description
}: {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    description?: string;
}) {
    return (
        <div className="mb-4 flex items-center justify-between">
            <div>
                <label className="text-sm font-medium text-white">{label}</label>
                {description && (
                    <p className="text-xs text-gray-400">{description}</p>
                )}
            </div>
            <button
                onClick={() => onChange(!value)}
                className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
            >
                <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}

// Color Picker Component
function ConfigColorPicker({
    label,
    value, // {r, g, b}
    onChange,
    description
}: {
    label: string;
    value: { r: number, g: number, b: number };
    onChange: (value: { r: number, g: number, b: number }) => void;
    description?: string;
}) {
    // Convert RGB object to Hex for input
    const toHex = (c: number) => {
        const hex = Math.floor(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    const hexColor = `#${toHex(value.r)}${toHex(value.g)}${toHex(value.b)}`;

    const handleChange = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        onChange({ r, g, b });
    };

    return (
        <div className="mb-4 flex items-center justify-between">
            <div>
                <label className="text-sm font-medium text-white">{label}</label>
                {description && (
                    <p className="text-xs text-gray-400">{description}</p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={hexColor}
                    onChange={(e) => handleChange(e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer"
                />
                <span className="text-xs text-blue-300 font-mono">{hexColor}</span>
            </div>
        </div>
    );
}

export default function GlassConfigPage() {
    // Glass effect parameters
    const [glassConfig, setGlassConfig] = useState({
        GLASS_BLUR_RADIUS: config.GLASS_BLUR_RADIUS,
        DISPLACEMENT_SCALE: config.DISPLACEMENT_SCALE,
        NOISE_SCALE: config.NOISE_SCALE,
        NOISE_OCTAVES: config.NOISE_OCTAVES,
        NOISE_SPEED: config.NOISE_SPEED,
        ANIMATE_NOISE: config.ANIMATE_NOISE,
        CHROMATIC_ABERRATION: config.CHROMATIC_ABERRATION,
        FRESNEL_STRENGTH: config.FRESNEL_STRENGTH,
        EDGE_LIGHT_INTENSITY: config.EDGE_LIGHT_INTENSITY,
        SPECULAR_INTENSITY: config.SPECULAR_INTENSITY,
        SPECULAR_SIZE: config.SPECULAR_SIZE,
        BRIGHTNESS: config.BRIGHTNESS,
        CONTRAST: config.CONTRAST,
        SATURATION: config.SATURATION,
    });

    // Expanded Fluid simulation parameters
    const [fluidConfig, setFluidConfig] = useState({
        // Physics
        DENSITY_DISSIPATION: config.DENSITY_DISSIPATION,
        VELOCITY_DISSIPATION: config.VELOCITY_DISSIPATION,
        PRESSURE: config.PRESSURE,
        PRESSURE_ITERATIONS: config.PRESSURE_ITERATIONS,
        CURL: config.CURL,
        SPLAT_RADIUS: config.SPLAT_RADIUS,
        SPLAT_FORCE: config.SPLAT_FORCE,

        // Visuals
        SHADING: config.SHADING,
        COLORFUL: config.COLORFUL,
        COLOR_UPDATE_SPEED: config.COLOR_UPDATE_SPEED,
        PAUSED: config.PAUSED,
        BACK_COLOR: config.BACK_COLOR,
        TRANSPARENT: config.TRANSPARENT,

        // Bloom / Effects
        BLOOM: config.BLOOM,
        BLOOM_INTENSITY: config.BLOOM_INTENSITY,
        BLOOM_THRESHOLD: config.BLOOM_THRESHOLD,
        BLOOM_SOFT_KNEE: config.BLOOM_SOFT_KNEE,
        SUNRAYS: config.SUNRAYS,
        SUNRAYS_WEIGHT: config.SUNRAYS_WEIGHT,
    });

    const updateGlassConfig = useCallback((key: string, value: any) => {
        setGlassConfig(prev => ({ ...prev, [key]: value }));
        (config as Record<string, any>)[key] = value;
    }, []);

    const updateFluidConfig = useCallback((key: string, value: any) => {
        setFluidConfig(prev => ({ ...prev, [key]: value }));
        (config as Record<string, any>)[key] = value;
    }, []);

    const exportConfig = useCallback(() => {
        const configString = JSON.stringify(config, null, 4);
        const blob = new Blob([configString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'fluid_glass_config.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const [showPanel, setShowPanel] = useState(true);
    const [activeTab, setActiveTab] = useState<'glass' | 'fluid'>('fluid');

    return (
        <div className="relative min-h-screen bg-black overflow-hidden">
            <FluidSimulation>
                <div className="relative z-10 p-8">
                    <h1 className="text-4xl font-bold text-white mb-2 text-center pointer-events-none">
                        Configuration Studio
                    </h1>
                    <p className="text-gray-400 text-center mb-8 pointer-events-none">
                        Fine-tune every aspect of the simulation and glass effect.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mt-12">
                        <LiquidGlassCard className="p-6 rounded-2xl">
                            <h3 className="text-xl font-semibold text-white mb-2">Glass Preview</h3>
                            <p className="text-gray-300 text-sm">
                                Observe how the fluid distorts behind this card as you adjust the settings.
                            </p>
                        </LiquidGlassCard>
                    </div>
                </div>

                <div className={`fixed right-4 top-4 bottom-4 w-96 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-40 transition-transform duration-300 flex flex-col ${showPanel ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'}`}>

                    {/* Panel Header */}
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                        <h2 className="text-white font-bold">Settings</h2>
                        <button
                            onClick={exportConfig}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                        >
                            Export JSON
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-700">
                        <button
                            onClick={() => setActiveTab('fluid')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'fluid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Fluid Sim
                        </button>
                        <button
                            onClick={() => setActiveTab('glass')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'glass' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Glass Effect
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                        {activeTab === 'glass' ? (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Distortion</h3>
                                    <ConfigSlider label="Displacement" value={glassConfig.DISPLACEMENT_SCALE} min={0} max={1} onChange={(v) => updateGlassConfig('DISPLACEMENT_SCALE', v)} />
                                    <ConfigSlider label="Blur Radius" value={glassConfig.GLASS_BLUR_RADIUS} min={0} max={20} step={0.5} onChange={(v) => updateGlassConfig('GLASS_BLUR_RADIUS', v)} />
                                    <ConfigSlider label="Noise Scale" value={glassConfig.NOISE_SCALE} min={1} max={20} step={0.5} onChange={(v) => updateGlassConfig('NOISE_SCALE', v)} />
                                    <ConfigSlider label="Noise Speed" value={glassConfig.NOISE_SPEED} min={0} max={1} onChange={(v) => updateGlassConfig('NOISE_SPEED', v)} />
                                    <ConfigToggle label="Animate Noise" value={glassConfig.ANIMATE_NOISE} onChange={(v) => updateGlassConfig('ANIMATE_NOISE', v)} />
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Optical Effects</h3>
                                    <ConfigSlider label="Chromatic Aberration" value={glassConfig.CHROMATIC_ABERRATION} min={0} max={0.3} step={0.005} onChange={(v) => updateGlassConfig('CHROMATIC_ABERRATION', v)} />
                                    <ConfigSlider label="Fresnel Strength" value={glassConfig.FRESNEL_STRENGTH} min={0} max={1} onChange={(v) => updateGlassConfig('FRESNEL_STRENGTH', v)} />
                                    <ConfigSlider label="Specular Intensity" value={glassConfig.SPECULAR_INTENSITY} min={0} max={1} onChange={(v) => updateGlassConfig('SPECULAR_INTENSITY', v)} />
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Color Grading</h3>
                                    <ConfigSlider label="Brightness" value={glassConfig.BRIGHTNESS} min={-1} max={1} onChange={(v) => updateGlassConfig('BRIGHTNESS', v)} />
                                    <ConfigSlider label="Contrast" value={glassConfig.CONTRAST} min={0} max={2} onChange={(v) => updateGlassConfig('CONTRAST', v)} />
                                    <ConfigSlider label="Saturation" value={glassConfig.SATURATION} min={0} max={2} onChange={(v) => updateGlassConfig('SATURATION', v)} />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Physics</h3>
                                    <ConfigToggle label="Paused" value={fluidConfig.PAUSED} onChange={(v) => updateFluidConfig('PAUSED', v)} />
                                    <ConfigSlider label="Curl (Vorticity)" value={fluidConfig.CURL} min={0} max={100} step={1} onChange={(v) => updateFluidConfig('CURL', v)} />
                                    <ConfigSlider label="Density Dissipation" value={fluidConfig.DENSITY_DISSIPATION} min={0} max={5} onChange={(v) => updateFluidConfig('DENSITY_DISSIPATION', v)} description="Fade speed" />
                                    <ConfigSlider label="Velocity Dissipation" value={fluidConfig.VELOCITY_DISSIPATION} min={0} max={5} onChange={(v) => updateFluidConfig('VELOCITY_DISSIPATION', v)} description="Slow down speed" />
                                    <ConfigSlider label="Pressure" value={fluidConfig.PRESSURE} min={0} max={1} onChange={(v) => updateFluidConfig('PRESSURE', v)} />

                                    <ConfigSlider label="Splat Radius" value={fluidConfig.SPLAT_RADIUS} min={0.01} max={1} onChange={(v) => updateFluidConfig('SPLAT_RADIUS', v)} />
                                    <ConfigSlider label="Splat Force" value={fluidConfig.SPLAT_FORCE} min={0} max={10000} step={100} onChange={(v) => updateFluidConfig('SPLAT_FORCE', v)} />
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Visuals</h3>
                                    <ConfigToggle label="Shading (Shadows)" value={fluidConfig.SHADING} onChange={(v) => updateFluidConfig('SHADING', v)} />
                                    <ConfigToggle label="Colorful" value={fluidConfig.COLORFUL} onChange={(v) => updateFluidConfig('COLORFUL', v)} />
                                    <ConfigSlider label="Color Speed" value={fluidConfig.COLOR_UPDATE_SPEED} min={0} max={50} onChange={(v) => updateFluidConfig('COLOR_UPDATE_SPEED', v)} />
                                    <ConfigColorPicker label="Background Color" value={fluidConfig.BACK_COLOR} onChange={(v) => updateFluidConfig('BACK_COLOR', v)} />
                                    <ConfigToggle label="Transparent Background" value={fluidConfig.TRANSPARENT} onChange={(v) => updateFluidConfig('TRANSPARENT', v)} />
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Post Processing</h3>
                                    <ConfigToggle label="Bloom" value={fluidConfig.BLOOM} onChange={(v) => updateFluidConfig('BLOOM', v)} />
                                    <ConfigSlider label="Bloom Intensity" value={fluidConfig.BLOOM_INTENSITY} min={0} max={2} onChange={(v) => updateFluidConfig('BLOOM_INTENSITY', v)} />
                                    <ConfigSlider label="Bloom Threshold" value={fluidConfig.BLOOM_THRESHOLD} min={0} max={1} onChange={(v) => updateFluidConfig('BLOOM_THRESHOLD', v)} />

                                    <ConfigToggle label="Sunrays" value={fluidConfig.SUNRAYS} onChange={(v) => updateFluidConfig('SUNRAYS', v)} />
                                    <ConfigSlider label="Sunrays Weight" value={fluidConfig.SUNRAYS_WEIGHT} min={0} max={1} onChange={(v) => updateFluidConfig('SUNRAYS_WEIGHT', v)} />
                                </div>
                            </div>
                        )}

                        <div className="mt-8 pt-4 border-t border-gray-700">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 py-2 rounded-lg transition-colors text-sm"
                            >
                                Reset Defaults
                            </button>
                        </div>
                    </div>
                </div>

                {/* Panel Toggle Button (Floating) */}
                <button
                    onClick={() => setShowPanel(!showPanel)}
                    className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
                    title="Toggle Controls"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </FluidSimulation>
        </div>
    );
}
