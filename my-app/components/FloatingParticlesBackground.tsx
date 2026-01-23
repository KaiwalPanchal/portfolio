"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface FloatingParticlesBackgroundProps {
    particleCount?: number;
    particleSize?: number;
    particleOpacity?: number;
    glowIntensity?: number;
    movementSpeed?: number;
    mouseInfluence?: number;
    backgroundColor?: string;
    particleColor?: string;
}

export default function FloatingParticlesBackground(props: FloatingParticlesBackgroundProps) {
    const {
        particleCount = 50,
        particleSize = 2,
        particleOpacity = 0.6,
        glowIntensity = 10,
        movementSpeed = 0.5,
        mouseInfluence = 150,
        backgroundColor = "#000000",
        particleColor = "#FFFFFF",
    } = props;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const mouseRef = useRef({ x: -1000, y: -1000, vx: 0, vy: 0, lastX: 0, lastY: 0 }); // Init off-screen
    const particlesRef = useRef<any[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
    const [showGui, setShowGui] = useState(true);

    // GUI State
    const [controls, setControls] = useState({
        gravityStrength: 0.05,
        orbitStrength: 0.5,
        tinkleSpeed: 0.05,
        regenerationRate: 0.01,
        mouseInfluenceRadius: mouseInfluence,
    });

    // Refs for animation loop performance
    const controlsRef = useRef(controls);
    useEffect(() => {
        controlsRef.current = controls;
    }, [controls]);

    // Initialize a single particle
    const createParticle = (width: number, height: number, id: number) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * movementSpeed,
        vy: (Math.random() - 0.5) * movementSpeed,
        size: Math.random() * particleSize + 1,
        opacity: 0, // Start invisible for fade-in
        targetOpacity: particleOpacity,
        baseOpacity: particleOpacity,
        mass: Math.random() * 0.5 + 0.5,
        id: id,
        glowMultiplier: 1,
        tinkleOffset: Math.random() * Math.PI * 2,
        life: 0, // Age of particle
        maxLife: 100 + Math.random() * 200, // Random lifespan if we want them to die naturally (optional)
    });

    const initializeParticles = useCallback(
        (width: number, height: number) => {
            return Array.from({ length: particleCount }, (_, index) => createParticle(width, height, index));
        },
        [particleCount, particleSize, particleOpacity, movementSpeed]
    );

    const updateParticles = useCallback(
        (canvas: HTMLCanvasElement) => {
            const rect = canvas.getBoundingClientRect();
            const mouse = mouseRef.current;
            const { gravityStrength, orbitStrength, tinkleSpeed, regenerationRate, mouseInfluenceRadius } = controlsRef.current;

            const currentParticles = particlesRef.current;

            currentParticles.forEach((particle) => {
                // --- 1. Physics & Movement ---

                // Calculate distance to mouse
                const dx = mouse.x - particle.x;
                const dy = mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Orbital Star Interaction
                if (distance < mouseInfluenceRadius && distance > 0) {
                    const force = (mouseInfluenceRadius - distance) / mouseInfluenceRadius;

                    const attractionFunc = gravityStrength * force;
                    const orbitFunc = orbitStrength * force;

                    const normalizedDx = dx / distance;
                    const normalizedDy = dy / distance;

                    // Attraction (Gravity)
                    particle.vx += normalizedDx * attractionFunc;
                    particle.vy += normalizedDy * attractionFunc;

                    // Orbit (Tangential)
                    particle.vx += -normalizedDy * orbitFunc;
                    particle.vy += normalizedDx * orbitFunc;

                    // Boost glow near cursor
                    particle.glowMultiplier = 1 + force * 2;
                } else {
                    particle.glowMultiplier = 1;
                }

                // Standard movement
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Self-propulsion (brownian-ish)
                particle.vx += (Math.random() - 0.5) * 0.01;
                particle.vy += (Math.random() - 0.5) * 0.01;

                // Friction/Damping
                particle.vx *= 0.96; // slightly higher friction to keep them controllable
                particle.vy *= 0.96;

                // --- 2. Tinkle Effect ---
                particle.tinkleOffset += tinkleSpeed;
                const tinkle = Math.sin(particle.tinkleOffset) * 0.3; // oscillate opacity

                // --- 3. Life Cycle & Regeneration ---

                // Fade in
                if (particle.opacity < particle.targetOpacity) {
                    particle.opacity += 0.01;
                }

                // Apply tinkle to current opacity
                let renderOpacity = particle.opacity + tinkle;
                renderOpacity = Math.max(0, Math.min(1, renderOpacity));
                particle.renderOpacity = renderOpacity; // Store for drawing

                // Boundary Check / Respawn logic
                const isOutOfBounds = particle.x < -50 || particle.x > rect.width + 50 || particle.y < -50 || particle.y > rect.height + 50;

                // Random chance to die and respawn elsewhere to mimic "new stars popping up"
                const shouldRespawn = isOutOfBounds || (Math.random() < regenerationRate * 0.1); // Small chance every frame

                if (shouldRespawn) {
                    // Reset particle
                    const newP = createParticle(rect.width, rect.height, particle.id);
                    Object.assign(particle, newP);
                }
            });
        },
        [mouseInfluence]
    );

    const drawParticles = useCallback(
        (ctx: CanvasRenderingContext2D) => {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            const { glowIntensity } = props; // Props are stable enough or we use ref if needed, but props fine here

            particlesRef.current.forEach((particle) => {
                if (particle.renderOpacity <= 0) return;

                ctx.save();
                const currentGlowMultiplier = particle.glowMultiplier || 1;

                ctx.shadowColor = particleColor;
                ctx.shadowBlur = (glowIntensity || 10) * currentGlowMultiplier;
                ctx.globalAlpha = particle.renderOpacity;
                ctx.fillStyle = particleColor;

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        },
        [particleColor, props]
    );

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        updateParticles(canvas);
        drawParticles(ctx);

        animationRef.current = requestAnimationFrame(animate);
    }, [updateParticles, drawParticles]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate mouse velocity
        const vx = x - mouseRef.current.lastX;
        const vy = y - mouseRef.current.lastY;

        mouseRef.current = {
            x,
            y,
            vx,
            vy,
            lastX: x,
            lastY: y
        };
    }, []);

    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        setCanvasSize({ width: rect.width, height: rect.height });
    }, []);

    // Initial setup
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        particlesRef.current = initializeParticles(canvas.width, canvas.height);
    }, [particleCount, initializeParticles]);

    // Event Listeners
    useEffect(() => {
        window.addEventListener("resize", resizeCanvas);
        resizeCanvas(); // Initial resize

        // Attach mouse move to window or container? Window is smoother for "drag off"
        // But we need coordinate relative to canvas.
        // Let's attach to container for simplicity or window and map coordinates.
        // Ideally user interacts with the background so window is safer.

        const onMove = (e: MouseEvent) => handleMouseMove(e);
        window.addEventListener("mousemove", onMove);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("mousemove", onMove);
        };
    }, [handleMouseMove, resizeCanvas]);

    // Animation Loop
    useEffect(() => {
        animate();
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [animate]);


    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
            />

            {/* GUI Overlay */}
            {showGui && (
                <div style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    padding: "15px",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "12px",
                    zIndex: 100,
                    border: "1px solid rgba(255,255,255,0.2)",
                    backdropFilter: "blur(5px)",
                    width: "250px"
                }}>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "bold" }}>Physics Controls</h3>

                    <div style={{ marginBottom: "8px" }}>
                        <label>Gravity Strength: {controls.gravityStrength.toFixed(3)}</label>
                        <input
                            type="range" min="0" max="0.2" step="0.001"
                            value={controls.gravityStrength}
                            onChange={(e) => setControls(c => ({ ...c, gravityStrength: parseFloat(e.target.value) }))}
                            style={{ width: "100%" }}
                        />
                    </div>

                    <div style={{ marginBottom: "8px" }}>
                        <label>Orbit Strength: {controls.orbitStrength.toFixed(2)}</label>
                        <input
                            type="range" min="0" max="2" step="0.05"
                            value={controls.orbitStrength}
                            onChange={(e) => setControls(c => ({ ...c, orbitStrength: parseFloat(e.target.value) }))}
                            style={{ width: "100%" }}
                        />
                    </div>

                    <div style={{ marginBottom: "8px" }}>
                        <label>Mouse Radius: {controls.mouseInfluenceRadius}px</label>
                        <input
                            type="range" min="50" max="500" step="10"
                            value={controls.mouseInfluenceRadius}
                            onChange={(e) => setControls(c => ({ ...c, mouseInfluenceRadius: parseInt(e.target.value) }))}
                            style={{ width: "100%" }}
                        />
                    </div>

                    <div style={{ marginBottom: "8px" }}>
                        <label>Tinkle Speed: {controls.tinkleSpeed.toFixed(2)}</label>
                        <input
                            type="range" min="0" max="0.2" step="0.01"
                            value={controls.tinkleSpeed}
                            onChange={(e) => setControls(c => ({ ...c, tinkleSpeed: parseFloat(e.target.value) }))}
                            style={{ width: "100%" }}
                        />
                    </div>

                    <div style={{ marginBottom: "8px" }}>
                        <label>Regeneration Rate: {controls.regenerationRate.toFixed(2)}</label>
                        <input
                            type="range" min="0" max="0.1" step="0.001"
                            value={controls.regenerationRate}
                            onChange={(e) => setControls(c => ({ ...c, regenerationRate: parseFloat(e.target.value) }))}
                            style={{ width: "100%" }}
                        />
                    </div>

                    <button
                        onClick={() => setShowGui(false)}
                        style={{ marginTop: "10px", background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "10px", textDecoration: "underline" }}
                    >
                        Hide GUI
                    </button>
                </div>
            )}
            {!showGui && (
                <button
                    onClick={() => setShowGui(true)}
                    style={{
                        position: "absolute",
                        top: 20,
                        right: 20,
                        background: "rgba(0,0,0,0.5)",
                        border: "1px solid white",
                        color: "white",
                        padding: "5px 10px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        zIndex: 100
                    }}
                >
                    Show Controls
                </button>
            )}
        </div>
    );
}
