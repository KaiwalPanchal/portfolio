"use client";

import { useRef } from "react";
// @ts-ignore
import { motion, useScroll, useTransform } from "framer-motion";
import AnimatedGradientBackground from "../../components/liquid/AnimatedLiquidBackground";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";

export default function LandingPage() {
    const containerRef = useRef(null);
    const { scrollY } = useScroll();

    // Fade out the background as user scrolls down the first 100vh (viewport height)
    // Maps scroll range [0, window.innerHeight] to opacity [1, 0]
    // We use a safe estimate of 800px for 100vh for ssr safety, but hooks organize it on client
    const backgroundOpacity = useTransform(scrollY, [0, 800], [1, 0]);
    const heroContentY = useTransform(scrollY, [0, 800], [0, 200]);
    const heroContentOpacity = useTransform(scrollY, [0, 400], [1, 0]);

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">

            {/* Fixed Background Layer */}
            <motion.div
                className="fixed inset-0 z-0 pointer-events-none"
                style={{ opacity: backgroundOpacity }}
            >
                <AnimatedGradientBackground
                    preset="Plasma"
                    style={{ width: '100%', height: '100%' }}
                />
                {/* Soft overlay to ensure text readability if needed (optional) */}
                <div className="absolute inset-0 bg-black/10" />
            </motion.div>

            {/* Hero Section */}
            <section className="relative z-10 h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
                <motion.div
                    className="text-center max-w-4xl mx-auto space-y-8"
                    style={{ y: heroContentY, opacity: heroContentOpacity }}
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium"
                    >
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span>v2.0 Now Available</span>
                    </motion.div>

                    {/* Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
                    >
                        Fluid Intelligence.
                        <br />
                        <span className="text-white/40">Seamless Design.</span>
                    </motion.h1>

                    {/* Subheading */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
                    >
                        Experience the next generation of web interaction.
                        Smooth, responsive, and beautifully animated backgrounds that react to your presence.
                    </motion.p>

                    {/* Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <button className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:scale-105 transition-transform flex items-center gap-2">
                            Get Started
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button className="px-8 py-4 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors">
                            View Documentation
                        </button>
                    </motion.div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
                >
                    <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-white to-transparent" />
                    <span className="text-xs uppercase tracking-[0.2em]">Scroll</span>
                </motion.div>
            </section>

            {/* Content Section (To demonstrate scroll fade) */}
            <section className="relative z-10 bg-black py-32 px-6">
                <div className="max-w-6xl mx-auto space-y-32">

                    {/* Value Proposition */}
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <h2 className="text-4xl md:text-5xl font-bold">Why settle for static?</h2>
                            <p className="text-xl text-white/60 leading-relaxed">
                                Traditional backgrounds are boring. Engage your users with dynamic, GPU-accelerated shaders that bring your interface to life without compromising performance.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="aspect-square rounded-2xl bg-zinc-900 border border-white/10 p-6 flex flex-col justify-between hover:bg-zinc-800 transition-colors">
                                <Zap className="w-8 h-8 text-yellow-400" />
                                <span className="font-semibold">Fast Performance</span>
                            </div>
                            <div className="aspect-square rounded-2xl bg-zinc-900 border border-white/10 p-6 flex flex-col justify-between hover:bg-zinc-800 transition-colors translate-y-8">
                                <Sparkles className="w-8 h-8 text-purple-400" />
                                <span className="font-semibold">Visual Stunning</span>
                            </div>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: Shield, title: "Robust & Secure", desc: "Built with type-safety in mind using modern React patterns." },
                            { icon: Zap, title: "Lightning Fast", desc: "Optimized WebGL rendering ensures 60fps on all devices." },
                            { icon: Sparkles, title: "Fully Customizable", desc: "Tweak colors, speed, and distortion to match your brand." }
                        ].map((feature, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-zinc-950 border border-white/5 hover:border-white/10 transition-colors space-y-4">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold">{feature.title}</h3>
                                <p className="text-white/50">{feature.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Footer Area */}
                    <div className="py-24 text-center border-t border-white/10">
                        <h2 className="text-4xl font-bold mb-8">Ready to transform your site?</h2>
                        <button className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:scale-105 transition-transform">
                            Start Building Now
                        </button>
                    </div>

                </div>
            </section>

        </div>
    );
}
