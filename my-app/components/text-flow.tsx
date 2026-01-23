"use client"

import {
    useEffect,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"

interface Particle {
    x: number
    y: number
    baseX: number
    baseY: number
    vx: number
    vy: number
}

interface ParticleTextProps {
    text?: string
    particleColor?: string
    backgroundColor?: string
    particleSize?: number
    particleDensity?: number
    mouseRadius?: number
    returnSpeed?: number
    font?: CSSProperties
    verticalAlign?: "top" | "center" | "bottom"
    horizontalAlign?: "left" | "center" | "right"
    style?: CSSProperties
}

export default function TextFlow(props: ParticleTextProps) {
    const {
        text = "Pola",
        particleColor = "#FFFFFF",
        backgroundColor = "#000000",
        particleSize = 2,
        particleDensity = 3,
        mouseRadius = 100,
        returnSpeed = 0.05,
        font = {
            fontSize: "80px",
            fontWeight: "400",
            fontStyle: "normal",
            fontFamily: "Inter, sans-serif"
        },
        verticalAlign = "center",
        horizontalAlign = "center",
        style,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const mouseRef = useRef({ x: -1000, y: -1000 })
    const animationFrameRef = useRef<number>()
    const isStatic = false // Always dynamic in this context
    const [isInitialized, setIsInitialized] = useState(false)

    // Initialize particles
    useEffect(() => {
        if (isStatic) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        // Use a timeout to prevent blocking
        const timeoutId = setTimeout(() => {
            const dpr =
                typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
            const rect = canvas.getBoundingClientRect()

            // Handle 0 width/height gracefuly
            if (rect.width === 0 || rect.height === 0) return

            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr
            ctx.scale(dpr, dpr)

            const width = rect.width
            const height = rect.height

            // Clear canvas before drawing new text
            ctx.clearRect(0, 0, width, height)

            // Draw text to get particle positions
            ctx.fillStyle = particleColor

            // Set horizontal alignment
            if (horizontalAlign === "left") {
                ctx.textAlign = "left"
            } else if (horizontalAlign === "right") {
                ctx.textAlign = "right"
            } else {
                ctx.textAlign = "center"
            }

            // Set vertical baseline
            ctx.textBaseline = "middle"

            const fontSize = parseInt(font.fontSize as string) || 80
            const fontWeight = font.fontWeight || "400"
            const fontStyle = font.fontStyle || "normal"
            const fontFamily = font.fontFamily || "Inter, sans-serif"
            ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`

            // Add padding to prevent text cutoff
            const padding = fontSize * 0.3

            // Calculate maximum text width based on container size
            const maxTextWidth = width - padding * 2

            // Function to wrap text to fit within container width
            const wrapText = (inputText: string): string[] => {
                const inputLines = inputText.split("\n")
                const wrappedLines: string[] = []

                for (const line of inputLines) {
                    // If line is empty or fits, keep it as is
                    if (!line.trim()) {
                        wrappedLines.push("")
                        continue
                    }

                    // Check if line fits in container
                    const metrics = ctx.measureText(line)
                    if (metrics.width <= maxTextWidth) {
                        wrappedLines.push(line)
                        continue
                    }

                    // Split line into words
                    const words = line.split(" ")
                    let currentLine = ""

                    for (const word of words) {
                        const testLine = currentLine
                            ? `${currentLine} ${word}`
                            : word
                        const testMetrics = ctx.measureText(testLine)

                        if (testMetrics.width <= maxTextWidth) {
                            currentLine = testLine
                        } else {
                            if (currentLine) {
                                wrappedLines.push(currentLine)
                                currentLine = word
                            } else {
                                // Single word too long, add it anyway
                                wrappedLines.push(word)
                            }
                        }
                    }

                    if (currentLine) {
                        wrappedLines.push(currentLine)
                    }
                }

                return wrappedLines
            }

            const lines = wrapText(text)
            const lineHeight = fontSize * 1.2
            const totalHeight = lines.length * lineHeight

            // Calculate vertical position
            let startY: number
            if (verticalAlign === "top") {
                startY = lineHeight / 2 + padding
            } else if (verticalAlign === "bottom") {
                startY = height - totalHeight + lineHeight / 2 - padding
            } else {
                startY = (height - totalHeight) / 2 + lineHeight / 2
            }

            // Calculate horizontal position
            let textX: number
            if (horizontalAlign === "left") {
                textX = padding
            } else if (horizontalAlign === "right") {
                textX = width - padding
            } else {
                textX = width / 2
            }

            lines.forEach((line, index) => {
                ctx.fillText(line, textX, startY + index * lineHeight)
            })

            // Get pixel data
            const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            )
            const pixels = imageData.data

            // Create particles from text pixels
            const particles: Particle[] = []
            const gap = Math.max(2, particleDensity)

            for (let y = 0; y < canvas.height; y += gap) {
                for (let x = 0; x < canvas.width; x += gap) {
                    const index = (y * canvas.width + x) * 4
                    const alpha = pixels[index + 3]

                    if (alpha > 128) {
                        const px = x / dpr
                        const py = y / dpr
                        particles.push({
                            x: px,
                            y: py,
                            baseX: px,
                            baseY: py,
                            vx: 0,
                            vy: 0,
                        })
                    }
                }
            }

            particlesRef.current = particles
            startTransition(() => setIsInitialized(true))
        }, 100) // Small delay to ensure layout is ready

        return () => {
            clearTimeout(timeoutId)
        }
    }, [
        text,
        particleColor,
        particleDensity,
        font,
        isStatic,
        horizontalAlign,
        verticalAlign,
        backgroundColor // Re-run if bg changes (though strictly not affecting particle generation, it might affect canvas setup)
    ])

    // Animation loop
    useEffect(() => {
        if (isStatic || !isInitialized) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const animate = () => {
            // Check if component is still mounted
            if (!canvasRef.current) return

            const rect = canvas.getBoundingClientRect()
            const width = rect.width
            const height = rect.height

            // Handle resizing or zero-size
            if (width === 0 || height === 0) {
                animationFrameRef.current = requestAnimationFrame(animate)
                return
            }

            // Only resize if physical dimensions match but internal resolution doesn't match window dpr logic
            // But we already set canvas.width/height in the other effect. 
            // We just need to clear it.
            ctx.clearRect(0, 0, width, height)

            const mouse = mouseRef.current
            const particles = particlesRef.current

            for (let i = 0; i < particles.length; i++) {
                const particle = particles[i]
                const dx = mouse.x - particle.x
                const dy = mouse.y - particle.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                // Push particles away from mouse
                if (distance < mouseRadius) {
                    const force = (mouseRadius - distance) / mouseRadius
                    const angle = Math.atan2(dy, dx)
                    particle.vx -= Math.cos(angle) * force * 2
                    particle.vy -= Math.sin(angle) * force * 2
                }

                // Return to base position
                particle.vx += (particle.baseX - particle.x) * returnSpeed
                particle.vy += (particle.baseY - particle.y) * returnSpeed

                // Apply velocity with damping
                particle.vx *= 0.95
                particle.vy *= 0.95

                particle.x += particle.vx
                particle.y += particle.vy

                // Draw particle
                ctx.fillStyle = particleColor
                ctx.beginPath()
                ctx.fillRect(particle.x, particle.y, particleSize, particleSize)
                // Optimized: fillRect is faster than arc usually for small particles
            }

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [
        isInitialized,
        particleColor,
        particleSize,
        mouseRadius,
        returnSpeed,
        isStatic,
        // Removed rect/width/height dependencies as they are read in the loop
    ])

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isStatic) return

        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        mouseRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        }
    }

    const handleMouseLeave = () => {
        mouseRef.current = { x: -1000, y: -1000 }
    }

    return (
        <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                backgroundColor,
                cursor: "crosshair",
                touchAction: "none"
            }}
        />
    )
}
