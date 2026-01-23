// Animated WebGL Shader effect with chromatic aberration wave distortion
"use client";

import { useEffect, useRef, type CSSProperties } from "react"

interface WebGLShaderEffectProps {
    xScale: number
    yScale: number
    distortion: number
    speed: number
    style?: CSSProperties
}

export default function ShaderFlow(props: WebGLShaderEffectProps) {
    const {
        xScale = 1.0,
        yScale = 0.5,
        distortion = 0.05,
        speed = 0.01,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const propsRef = useRef({ xScale, yScale, distortion, speed })

    // Update props ref whenever props change
    useEffect(() => {
        propsRef.current = { xScale, yScale, distortion, speed }
    }, [xScale, yScale, distortion, speed])

    const sceneRef = useRef<{
        gl: WebGLRenderingContext | null
        program: WebGLProgram | null
        uniforms: {
            resolution: WebGLUniformLocation | null
            time: WebGLUniformLocation | null
            xScale: WebGLUniformLocation | null
            yScale: WebGLUniformLocation | null
            distortion: WebGLUniformLocation | null
        }
        animationId: number | null
        timeValue: number
    }>({
        gl: null,
        program: null,
        uniforms: {
            resolution: null,
            time: null,
            xScale: null,
            yScale: null,
            distortion: null,
        },
        animationId: null,
        timeValue: 0,
    })

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!canvasRef.current) return

        const canvas = canvasRef.current
        const { current: refs } = sceneRef

        const gl = canvas.getContext("webgl", {
            alpha: true,
            antialias: false,
            preserveDrawingBuffer: false,
        })
        if (!gl) return

        refs.gl = gl

        const vertexShaderSource = `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `

        const fragmentShaderSource = `
            precision highp float;
            uniform vec2 resolution;
            uniform float time;
            uniform float xScale;
            uniform float yScale;
            uniform float distortion;

            void main() {
                vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
                
                float d = length(p) * distortion;
                
                float rx = p.x * (1.0 + d);
                float gx = p.x;
                float bx = p.x * (1.0 - d);

                float r = 0.05 / abs(p.y + sin((rx + time) * xScale) * yScale);
                float g = 0.05 / abs(p.y + sin((gx + time) * xScale) * yScale);
                float b = 0.05 / abs(p.y + sin((bx + time) * xScale) * yScale);
                
                gl_FragColor = vec4(r, g, b, 1.0);
            }
        `

        const createShader = (type: number, source: string) => {
            const shader = gl.createShader(type)
            if (!shader) return null
            gl.shaderSource(shader, source)
            gl.compileShader(shader)
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader))
                gl.deleteShader(shader)
                return null
            }
            return shader
        }

        const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource)
        const fragmentShader = createShader(
            gl.FRAGMENT_SHADER,
            fragmentShaderSource
        )

        if (!vertexShader || !fragmentShader) return

        const program = gl.createProgram()
        if (!program) return

        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program))
            return
        }

        refs.program = program
        gl.useProgram(program)

        const positions = new Float32Array([
            -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0,
        ])

        const positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

        const positionLocation = gl.getAttribLocation(program, "position")
        gl.enableVertexAttribArray(positionLocation)
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

        refs.uniforms.resolution = gl.getUniformLocation(program, "resolution")
        refs.uniforms.time = gl.getUniformLocation(program, "time")
        refs.uniforms.xScale = gl.getUniformLocation(program, "xScale")
        refs.uniforms.yScale = gl.getUniformLocation(program, "yScale")
        refs.uniforms.distortion = gl.getUniformLocation(program, "distortion")

        const handleResize = () => {
            if (!canvas || !gl || !refs.uniforms.resolution) return
            const width = canvas.clientWidth
            const height = canvas.clientHeight
            canvas.width = width * window.devicePixelRatio
            canvas.height = height * window.devicePixelRatio
            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.uniform2f(refs.uniforms.resolution, canvas.width, canvas.height)
        }

        const animate = () => {
            if (!gl || !refs.program || !refs.uniforms.time) return

            refs.timeValue += propsRef.current.speed

            gl.uniform1f(refs.uniforms.time, refs.timeValue)
            gl.uniform1f(refs.uniforms.xScale, propsRef.current.xScale)
            gl.uniform1f(refs.uniforms.yScale, propsRef.current.yScale)
            gl.uniform1f(refs.uniforms.distortion, propsRef.current.distortion)

            gl.drawArrays(gl.TRIANGLES, 0, 6)

            refs.animationId = requestAnimationFrame(animate)
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        animate()

        return () => {
            if (refs.animationId) cancelAnimationFrame(refs.animationId)
            window.removeEventListener("resize", handleResize)
            if (gl && refs.program) {
                gl.deleteProgram(refs.program)
            }
            if (gl && vertexShader) gl.deleteShader(vertexShader)
            if (gl && fragmentShader) gl.deleteShader(fragmentShader)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
                backgroundColor: "#000000",
                ...props.style
            }}
        />
    )
}
