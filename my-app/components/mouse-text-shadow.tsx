'use client'

import * as React from "react"
import { UnifrakturMaguntia } from "next/font/google"
import { cn } from "@/lib/utils"

const unifraktur = UnifrakturMaguntia({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-unifraktur",
})

interface MouseTextShadowProps {
    text?: string
    copies?: number
    textColor?: string
    backgroundColor?: string
    fontSize?: number
    shadowColor?: string
    useGradientGlow?: boolean
    glowStartColor?: string
    glowEndColor?: string
    shadowScaleFactor?: number
    animateGlow?: boolean
    glowBlur?: number
    glowOpacity?: number
    className?: string
}

export function MouseTextShadow({
    text = "Light",
    copies = 100,
    textColor = "#FFFFFF",
    backgroundColor = "#111111",
    fontSize = 160,
    shadowColor = "#FFFFFF",
    useGradientGlow = false,
    glowStartColor = "#FFFFFF",
    glowEndColor = "#BB1111",
    shadowScaleFactor = 0.01,
    animateGlow = false,
    glowBlur = 32,
    glowOpacity = 1,
    className,
}: MouseTextShadowProps) {
    // Mouse state
    const [direction, setDirection] = React.useState({
        horizontal: 1,
        vertical: 1,
    })
    const [pulse, setPulse] = React.useState(1)
    const [isHovering, setIsHovering] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Throttle updates with requestAnimationFrame
    const rafRef = React.useRef<number>(undefined)
    const centerAnimRef = React.useRef<number>(undefined)
    const pulseRef = React.useRef<number>(undefined)

    // Animate pulse if enabled
    React.useEffect(() => {
        if (!animateGlow) {
            setPulse(1)
            return
        }

        let start: number | undefined
        function animate(ts: number) {
            if (!start) start = ts
            const t = (ts - start) / 1000
            // Pulsate between 0.95 and 1.05
            setPulse(0.95 + 0.1 * (0.5 + 0.5 * Math.sin(t * 2)))
            pulseRef.current = requestAnimationFrame(animate)
        }
        pulseRef.current = requestAnimationFrame(animate)

        return () => {
            if (pulseRef.current) cancelAnimationFrame(pulseRef.current)
        }
    }, [animateGlow])

    // Mouse/touch handler
    const handlePointer = React.useCallback(
        (e: MouseEvent | TouchEvent) => {
            setIsHovering(true)
            if (centerAnimRef.current)
                cancelAnimationFrame(centerAnimRef.current)

            if (!containerRef.current) return

            const rect = containerRef.current.getBoundingClientRect()
            let clientX, clientY

            if ('touches' in e && e.touches.length > 0) {
                clientX = e.touches[0].clientX
                clientY = e.touches[0].clientY
            } else if ('clientX' in e) {
                clientX = (e as MouseEvent).clientX
                clientY = (e as MouseEvent).clientY
            } else {
                return
            }

            const x = clientX - rect.left
            const y = clientY - rect.top
            let horizontal, vertical
            if (x > rect.width / 2) {
                horizontal = ((x - rect.width / 2) / (rect.width / 2)) * -1
            } else {
                horizontal = (rect.width / 2 - x) / (rect.width / 2)
            }
            if (y > rect.height / 2) {
                vertical = ((y - rect.height / 2) / (rect.height / 2)) * -1
            } else {
                vertical = (rect.height / 2 - y) / (rect.height / 2)
            }
            // Clamp to [-1, 1]
            horizontal = Math.max(-1, Math.min(1, horizontal))
            vertical = Math.max(-1, Math.min(1, vertical))

            // Throttle with RAF
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = requestAnimationFrame(() => {
                setDirection({ horizontal, vertical })
            })
        },
        []
    )

    // Mouse leave handler: animate back to center
    const handlePointerLeave = React.useCallback(() => {
        setIsHovering(false)
        if (centerAnimRef.current) cancelAnimationFrame(centerAnimRef.current)

        function animateBack() {
            setDirection((prev) => {
                const speed = 0.18
                const h = prev.horizontal + (1 - prev.horizontal) * speed
                const v = prev.vertical + (1 - prev.vertical) * speed

                if (Math.abs(h - 1) < 0.01 && Math.abs(v - 1) < 0.01) {
                    // Snap exactly to center and stop animating
                    if (centerAnimRef.current)
                        cancelAnimationFrame(centerAnimRef.current)
                    return { horizontal: 1, vertical: 1 }
                } else {
                    centerAnimRef.current = requestAnimationFrame(animateBack)
                    return { horizontal: h, vertical: v }
                }
            })
        }
        centerAnimRef.current = requestAnimationFrame(animateBack)
    }, [])

    // Attach listeners
    React.useEffect(() => {
        if (!containerRef.current) return
        const el = containerRef.current

        // Explicitly casting event types for compatibility
        el.addEventListener("mousemove", handlePointer as any)
        el.addEventListener("touchmove", handlePointer as any)
        el.addEventListener("mouseleave", handlePointerLeave)
        el.addEventListener("touchend", handlePointerLeave)

        return () => {
            el.removeEventListener("mousemove", handlePointer as any)
            el.removeEventListener("touchmove", handlePointer as any)
            el.removeEventListener("mouseleave", handlePointerLeave)
            el.removeEventListener("touchend", handlePointerLeave)
        }
    }, [handlePointer, handlePointerLeave])

    // Helper: robust color parser (hex, rgb, rgba)
    function parseColor(input: string) {
        if (!input) return { r: 255, g: 255, b: 255 }
        if (input.startsWith("rgb")) {
            // rgb or rgba
            const match = input.match(/rgba?\(([^)]+)\)/)
            if (match) {
                const parts = match[1].split(",").map(Number)
                return {
                    r: parts[0] || 255,
                    g: parts[1] || 255,
                    b: parts[2] || 255,
                }
            }
        } else if (input.startsWith("#")) {
            let c = input.replace("#", "")
            if (c.length === 3) {
                c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]
            }
            if (c.length === 6) {
                // Pad with zeros if needed
                c = c.padStart(6, "0")
                const r = parseInt(c.slice(0, 2), 16)
                const g = parseInt(c.slice(2, 4), 16)
                const b = parseInt(c.slice(4, 6), 16)
                return { r, g, b }
            }
            // 8-digit hex (with alpha)
            if (c.length === 8) {
                c = c.padStart(8, "0")
                const r = parseInt(c.slice(0, 2), 16)
                const g = parseInt(c.slice(2, 4), 16)
                const b = parseInt(c.slice(4, 6), 16)
                // ignore alpha for now
                return { r, g, b }
            }
        }
        // fallback: white
        return { r: 255, g: 255, b: 255 }
    }

    // Helper: interpolate between two colors
    function lerpColor(a: { r: number, g: number, b: number }, b: { r: number, g: number, b: number }, t: number) {
        return {
            r: Math.round(a.r + (b.r - a.r) * t),
            g: Math.round(a.g + (b.g - a.g) * t),
            b: Math.round(a.b + (b.b - a.b) * t),
        }
    }

    const shadowRGB = parseColor(shadowColor)
    const startRGB = parseColor(glowStartColor)
    const endRGB = parseColor(glowEndColor)

    // Precompute shadow color strings for all copies (memoized)
    const shadowColorStrings = React.useMemo(() => {
        const arr = []
        for (let i = 1; i <= copies; i++) {
            let rgb
            if (useGradientGlow) {
                const t = (i - 1) / (copies - 1)
                rgb = lerpColor(startRGB, endRGB, t)
            } else {
                rgb = shadowRGB
            }
            arr.push(`rgba(${rgb.r},${rgb.g},${rgb.b},${1 / i})`)
        }
        return arr
    }, [copies, useGradientGlow, startRGB, endRGB, shadowRGB])

    // Generate shadow copies (static, only update CSS vars for transform)
    const shadowCopies = React.useMemo(() => {
        const arr = []
        for (let i = 1; i <= copies; i++) {
            // We set custom properties on the style object. 
            // This requires casting to React.CSSProperties or similar if strict typing is enforced,
            // or just using a plain object and ignoring TS complaints locally.
            const style = {
                "--index": i,
                "--shadow-color": shadowColorStrings[i - 1],
                pointerEvents: "none",
                zIndex: 0,
            } as React.CSSProperties

            arr.push(
                <div
                    key={i}
                    aria-hidden="true"
                    className="mouse-text-shadow-copy"
                    style={style}
                >
                    {text}
                </div>
            )
        }
        return arr
    }, [copies, text, shadowColorStrings])

    // Main text style
    // Compute glow color for text-shadow
    let glowColor = shadowColor
    if (useGradientGlow) {
        glowColor = glowStartColor
    }
    // Parse glow color for alpha
    const glowRGB = parseColor(glowColor)
    const glowColorWithAlpha = `rgba(${glowRGB.r},${glowRGB.g},${glowRGB.b},${glowOpacity})`

    // Move the glow slightly with mouse direction
    const glowOffset = (0.7 * fontSize) / 160 // scale with font size
    const x1 = (direction.horizontal || 0) * glowOffset
    const y1 = (direction.vertical || 0) * glowOffset
    const x2 = (direction.horizontal || 0) * glowOffset * 2
    const y2 = (direction.vertical || 0) * glowOffset * 2
    const x3 = (direction.horizontal || 0) * glowOffset * 0.5
    const y3 = (direction.vertical || 0) * glowOffset * 0.5

    const mainTextStyle: React.CSSProperties = {
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: fontSize,
        color: textColor,
        letterSpacing: 0,
        lineHeight: 1.1,
        zIndex: 1,
        userSelect: "none",
        whiteSpace: "pre",
        textAlign: "center",
        pointerEvents: "auto",
        textShadow: `
      ${x1}px ${y1}px ${glowBlur}px ${glowColorWithAlpha},
      ${x2}px ${y2}px ${glowBlur * 2}px ${glowColorWithAlpha},
      ${x3}px ${y3}px ${Math.round(glowBlur / 4)}px ${glowColorWithAlpha}
    `,
    }

    return (
        <div
            ref={containerRef}
            className={cn("relative w-full h-full min-h-[500px] overflow-hidden flex items-center justify-center bg-zinc-950", className, unifraktur.className)}
            style={{
                // @ts-ignore
                "--horizontal": direction.horizontal,
                "--vertical": direction.vertical,
                "--shadow-scale": shadowScaleFactor * pulse,
            } as React.CSSProperties}
        >
            <style jsx global>{`
        .mouse-text-shadow-copy {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) translate(calc(var(--index, 1) * var(--horizontal, 1) * 0.1rem), calc(var(--index, 1) * var(--vertical, 1) * 0.1rem)) scale(calc(1 + var(--index, 1) * var(--shadow-scale, 0.01)));
            color: var(--shadow-color, #fff);
            filter: blur(0.1rem);
            user-select: none;
            white-space: pre;
            text-align: center;
            font-family: inherit;
            font-size: ${fontSize}px;
            font-weight: inherit;
            font-style: inherit;
            letter-spacing: inherit;
            line-height: inherit;
            will-change: transform;
        }
        `}</style>

            {/* Shadow copies (always behind main text) */}
            {shadowCopies}

            {/* Main text */}
            <div role="heading" aria-level={1} style={mainTextStyle}>
                {text}
            </div>
        </div>
    )
}
