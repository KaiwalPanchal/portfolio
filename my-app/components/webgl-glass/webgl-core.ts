// @ts-nocheck
/* eslint-disable */
/**
 * WebGL Liquid Glass Core Logic
 * Ported from webgl-liquid-glass.js to TypeScript
 */

import * as Shaders from './shaders';
import type {
    WebGLConfig,
    GlassCard,
    Pointer,
    FBO,
    DoubleFBO,
    WebGLExtensions,
    LiquidGlassInstance,
    ColorRGB,
} from './types';

// Default configuration
const defaultConfig: WebGLConfig = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    CAPTURE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 1,
    VELOCITY_DISSIPATION: 0.2,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: 30,
    SPLAT_RADIUS: 0.25,
    SPLAT_FORCE: 6000,
    SHADING: true,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 10,
    PAUSED: false,
    BACK_COLOR: { r: 0, g: 0, b: 0 },
    TRANSPARENT: false,
    BLOOM: true,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.8,
    BLOOM_THRESHOLD: 0.6,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: true,
    SUNRAYS_RESOLUTION: 196,
    SUNRAYS_WEIGHT: 1.0,
    GLASS_ENABLED: true,
    GLASS_BLUR_RADIUS: 8,
    DISPLACEMENT_SCALE: 0.08,
    NOISE_SCALE: 2.0,
    NOISE_OCTAVES: 4,
    CHROMATIC_ABERRATION: 0.015,
    FRESNEL_STRENGTH: 0.4,
    EDGE_LIGHT_INTENSITY: 0.5,
    SPECULAR_INTENSITY: 0.4,
    SPECULAR_SIZE: 0.2,
    BRIGHTNESS: 0.02,
    CONTRAST: 1.05,
    SATURATION: 1.4,
    COLOR_TINT: { r: 1.0, g: 1.0, b: 1.05 },
    NOISE_RESOLUTION: 512,
    ANIMATE_NOISE: true,
    NOISE_SPEED: 0.05,
};

export function initLiquidGlass(
    canvas: HTMLCanvasElement,
    userConfig: Partial<WebGLConfig> = {}
): LiquidGlassInstance | null {
    // Merge configs
    const config: WebGLConfig = { ...defaultConfig, ...userConfig };
    const glassCards: GlassCard[] = [];

    // ============ WEBGL SETUP ============
    function getWebGLContext(canvas: HTMLCanvasElement) {
        const params = {
            alpha: true,
            depth: false,
            stencil: false,
            antialias: false,
            preserveDrawingBuffer: false,
        };
        let gl = canvas.getContext('webgl2', params) as WebGL2RenderingContext | null;
        const isWebGL2 = !!gl;
        if (!isWebGL2) {
            gl = (canvas.getContext('webgl', params) ||
                canvas.getContext('experimental-webgl', params)) as WebGL2RenderingContext | null;
        }

        if (!gl) return null;

        let halfFloat: any;
        let supportLinearFiltering: any;
        if (isWebGL2) {
            gl.getExtension('EXT_color_buffer_float');
            supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
        } else {
            halfFloat = gl.getExtension('OES_texture_half_float');
            supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
        }
        gl.clearColor(0.0, 0.0, 0.0, 1.0);

        const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat?.HALF_FLOAT_OES;

        function getSupportedFormat(
            gl: WebGL2RenderingContext,
            internalFormat: number,
            format: number,
            type: number
        ) {
            if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
                switch (internalFormat) {
                    case gl.R16F:
                        return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
                    case gl.RG16F:
                        return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
                    default:
                        return null;
                }
            }
            return { internalFormat, format };
        }

        function supportRenderTextureFormat(
            gl: WebGL2RenderingContext,
            internalFormat: number,
            format: number,
            type: number
        ) {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

            const fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

            const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            return status === gl.FRAMEBUFFER_COMPLETE;
        }

        let formatRGBA, formatRG, formatR;
        if (isWebGL2) {
            formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
            formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
            formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
        } else {
            formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        }

        return {
            gl,
            ext: {
                formatRGBA,
                formatRG,
                formatR,
                halfFloatTexType,
                supportLinearFiltering: !!supportLinearFiltering,
            } as WebGLExtensions,
        };
    }

    const context = getWebGLContext(canvas);
    if (!context) {
        console.error('WebGL not supported');
        return null;
    }

    const { gl, ext } = context;

    // Mobile detection
    function isMobile() {
        return /Mobi|Android/i.test(navigator.userAgent);
    }
    if (isMobile()) {
        config.DYE_RESOLUTION = 512;
    }
    if (!ext.supportLinearFiltering) {
        config.DYE_RESOLUTION = 512;
        config.SHADING = false;
        config.BLOOM = false;
        config.SUNRAYS = false;
    }

    // ============ SHADER CLASSES ============
    class Material {
        vertexShader: WebGLShader;
        fragmentShaderSource: string;
        programs: { [key: number]: WebGLProgram } = {};
        activeProgram: WebGLProgram | null = null;
        uniforms: { [key: string]: WebGLUniformLocation } = {};

        constructor(vertexShader: WebGLShader, fragmentShaderSource: string) {
            this.vertexShader = vertexShader;
            this.fragmentShaderSource = fragmentShaderSource;
        }

        setKeywords(keywords: string[]) {
            let hash = 0;
            for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i]);
            let program = this.programs[hash];
            if (!program) {
                const fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
                program = createProgram(this.vertexShader, fragmentShader);
                this.programs[hash] = program;
            }
            if (program === this.activeProgram) return;
            this.uniforms = getUniforms(program);
            this.activeProgram = program;
        }

        bind() {
            gl.useProgram(this.activeProgram);
        }
    }

    class Program {
        program: WebGLProgram;
        uniforms: { [key: string]: WebGLUniformLocation } = {};

        constructor(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
            this.program = createProgram(vertexShader, fragmentShader);
            this.uniforms = getUniforms(this.program);
        }

        bind() {
            gl.useProgram(this.program);
        }
    }

    function createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
        const program = gl.createProgram()!;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
        }
        return program;
    }

    function getUniforms(program: WebGLProgram): { [key: string]: WebGLUniformLocation } {
        const uniforms: { [key: string]: WebGLUniformLocation } = {};
        const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            const uniformName = gl.getActiveUniform(program, i)!.name;
            uniforms[uniformName] = gl.getUniformLocation(program, uniformName)!;
        }
        return uniforms;
    }

    function compileShader(type: number, source: string, keywords?: string[]): WebGLShader {
        source = addKeywords(source, keywords);
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
        }
        return shader;
    }

    function addKeywords(source: string, keywords?: string[]): string {
        if (!keywords) return source;
        let keywordsString = '';
        keywords.forEach((keyword) => {
            keywordsString += '#define ' + keyword + '\n';
        });
        return keywordsString + source;
    }

    function hashCode(s: string): number {
        if (s.length === 0) return 0;
        let hash = 0;
        for (let i = 0; i < s.length; i++) {
            hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
        }
        return hash;
    }

    // ============ COMPILE SHADERS ============
    const baseVertexShader = compileShader(gl.VERTEX_SHADER, Shaders.baseVertexShader);
    const blurVertexShader = compileShader(gl.VERTEX_SHADER, Shaders.blurVertexShader);

    const blurShader = compileShader(gl.FRAGMENT_SHADER, Shaders.blurShader);
    const copyShader = compileShader(gl.FRAGMENT_SHADER, Shaders.copyShader);
    const clearShader = compileShader(gl.FRAGMENT_SHADER, Shaders.clearShader);
    const colorShader = compileShader(gl.FRAGMENT_SHADER, Shaders.colorShader);
    const splatShader = compileShader(gl.FRAGMENT_SHADER, Shaders.splatShader);
    const advectionShader = compileShader(
        gl.FRAGMENT_SHADER,
        Shaders.advectionShaderSource,
        ext.supportLinearFiltering ? undefined : ['MANUAL_FILTERING']
    );
    const divergenceShader = compileShader(gl.FRAGMENT_SHADER, Shaders.divergenceShader);
    const curlShader = compileShader(gl.FRAGMENT_SHADER, Shaders.curlShader);
    const vorticityShader = compileShader(gl.FRAGMENT_SHADER, Shaders.vorticityShader);
    const pressureShader = compileShader(gl.FRAGMENT_SHADER, Shaders.pressureShader);
    const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, Shaders.gradientSubtractShader);
    const noiseShader = compileShader(gl.FRAGMENT_SHADER, Shaders.noiseShader);
    const glassCompositeShader = compileShader(gl.FRAGMENT_SHADER, Shaders.glassCompositeShader);
    const gaussianBlurShader = compileShader(gl.FRAGMENT_SHADER, Shaders.gaussianBlurShader);

    // ============ PROGRAMS ============
    const blurProgram = new Program(blurVertexShader, blurShader);
    const copyProgram = new Program(baseVertexShader, copyShader);
    const clearProgram = new Program(baseVertexShader, clearShader);
    const colorProgram = new Program(baseVertexShader, colorShader);
    const splatProgram = new Program(baseVertexShader, splatShader);
    const advectionProgram = new Program(baseVertexShader, advectionShader);
    const divergenceProgram = new Program(baseVertexShader, divergenceShader);
    const curlProgram = new Program(baseVertexShader, curlShader);
    const vorticityProgram = new Program(baseVertexShader, vorticityShader);
    const pressureProgram = new Program(baseVertexShader, pressureShader);
    const gradientSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);
    const noiseProgram = new Program(baseVertexShader, noiseShader);
    const glassCompositeProgram = new Program(baseVertexShader, glassCompositeShader);
    const gaussianBlurProgram = new Program(baseVertexShader, gaussianBlurShader);
    const displayMaterial = new Material(baseVertexShader, Shaders.displayShaderSource);

    // ============ FRAMEBUFFERS ============
    let dye: DoubleFBO;
    let velocity: DoubleFBO;
    let divergence: FBO;
    let curl: FBO;
    let pressure: DoubleFBO;
    let noiseFBO: FBO;
    let blurFBO1: FBO;
    let blurFBO2: FBO;
    let fluidFBO: FBO;

    // ============ BLIT FUNCTION ============
    const blit = (() => {
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        return (target: FBO | null, clear = false) => {
            if (target == null) {
                gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            } else {
                gl.viewport(0, 0, target.width, target.height);
                gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
            }
            if (clear) {
                gl.clearColor(0.0, 0.0, 0.0, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        };
    })();

    // ============ FBO CREATION ============
    function createFBO(
        w: number,
        h: number,
        internalFormat: number,
        format: number,
        type: number,
        param: number
    ): FBO {
        gl.activeTexture(gl.TEXTURE0);
        const texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

        const fbo = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.viewport(0, 0, w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const texelSizeX = 1.0 / w;
        const texelSizeY = 1.0 / h;

        return {
            texture,
            fbo,
            width: w,
            height: h,
            texelSizeX,
            texelSizeY,
            attach(id: number) {
                gl.activeTexture(gl.TEXTURE0 + id);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                return id;
            },
        };
    }

    function createDoubleFBO(
        w: number,
        h: number,
        internalFormat: number,
        format: number,
        type: number,
        param: number
    ): DoubleFBO {
        let fbo1 = createFBO(w, h, internalFormat, format, type, param);
        let fbo2 = createFBO(w, h, internalFormat, format, type, param);
        return {
            width: w,
            height: h,
            texelSizeX: fbo1.texelSizeX,
            texelSizeY: fbo1.texelSizeY,
            get read() {
                return fbo1;
            },
            set read(value) {
                fbo1 = value;
            },
            get write() {
                return fbo2;
            },
            set write(value) {
                fbo2 = value;
            },
            swap() {
                const temp = fbo1;
                fbo1 = fbo2;
                fbo2 = temp;
            },
        };
    }

    function getResolution(resolution: number) {
        let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
        if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
        const min = Math.round(resolution);
        const max = Math.round(resolution * aspectRatio);
        if (gl.drawingBufferWidth > gl.drawingBufferHeight) return { width: max, height: min };
        else return { width: min, height: max };
    }

    // ============ INITIALIZATION ============
    function initFramebuffers() {
        const simRes = getResolution(config.SIM_RESOLUTION);
        const dyeRes = getResolution(config.DYE_RESOLUTION);
        const texType = ext.halfFloatTexType;
        const rgba = ext.formatRGBA!;
        const rg = ext.formatRG!;
        const r = ext.formatR!;
        const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

        gl.disable(gl.BLEND);

        dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
        pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);

        // Glass effect FBOs
        const noiseRes = config.NOISE_RESOLUTION;
        noiseFBO = createFBO(noiseRes, noiseRes, rgba.internalFormat, rgba.format, texType, gl.LINEAR);
        fluidFBO = createFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, gl.LINEAR);
        blurFBO1 = createFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, gl.LINEAR);
        blurFBO2 = createFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, gl.LINEAR);
    }

    function updateKeywords() {
        const displayKeywords: string[] = [];
        if (config.SHADING) displayKeywords.push('SHADING');
        displayMaterial.setKeywords(displayKeywords);
    }

    // ============ POINTER HANDLING ============
    function createPointer(): Pointer {
        return {
            id: -1,
            texcoordX: 0,
            texcoordY: 0,
            prevTexcoordX: 0,
            prevTexcoordY: 0,
            deltaX: 0,
            deltaY: 0,
            down: false,
            moved: false,
            color: { r: 0.3, g: 0.5, b: 0.8 },
        };
    }

    const pointers: Pointer[] = [createPointer()];
    const splatStack: number[] = [];

    function updatePointerDownData(pointer: Pointer, id: number, posX: number, posY: number) {
        pointer.id = id;
        pointer.down = true;
        pointer.moved = false;
        pointer.texcoordX = posX / canvas.width;
        pointer.texcoordY = 1.0 - posY / canvas.height;
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.deltaX = 0;
        pointer.deltaY = 0;
        pointer.color = generateColor();
    }

    function updatePointerMoveData(pointer: Pointer, posX: number, posY: number) {
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.texcoordX = posX / canvas.width;
        pointer.texcoordY = 1.0 - posY / canvas.height;
        pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
        pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
        pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
    }

    function updatePointerUpData(pointer: Pointer) {
        pointer.down = false;
    }

    function correctDeltaX(delta: number): number {
        const aspectRatio = canvas.width / canvas.height;
        if (aspectRatio < 1) delta *= aspectRatio;
        return delta;
    }

    function correctDeltaY(delta: number): number {
        const aspectRatio = canvas.width / canvas.height;
        if (aspectRatio > 1) delta /= aspectRatio;
        return delta;
    }

    function generateColor(): ColorRGB {
        const c = HSVtoRGB(Math.random(), 1.0, 1.0);
        c.r *= 0.15;
        c.g *= 0.15;
        c.b *= 0.15;
        return c;
    }

    function HSVtoRGB(h: number, s: number, v: number): ColorRGB {
        let r = 0,
            g = 0,
            b = 0;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0:
                r = v;
                g = t;
                b = p;
                break;
            case 1:
                r = q;
                g = v;
                b = p;
                break;
            case 2:
                r = p;
                g = v;
                b = t;
                break;
            case 3:
                r = p;
                g = q;
                b = v;
                break;
            case 4:
                r = t;
                g = p;
                b = v;
                break;
            case 5:
                r = v;
                g = p;
                b = q;
                break;
        }
        return { r, g, b };
    }

    function normalizeColor(input: ColorRGB): ColorRGB {
        return { r: input.r / 255, g: input.g / 255, b: input.b / 255 };
    }

    function scaleByPixelRatio(input: number): number {
        const pixelRatio = window.devicePixelRatio || 1;
        return Math.floor(input * pixelRatio);
    }

    function correctRadius(radius: number): number {
        const aspectRatio = canvas.width / canvas.height;
        if (aspectRatio > 1) radius *= aspectRatio;
        return radius;
    }

    // ============ SIMULATION ============
    function splat(x: number, y: number, dx: number, dy: number, color: ColorRGB) {
        splatProgram.bind();
        gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
        gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
        gl.uniform2f(splatProgram.uniforms.point, x, y);
        gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
        gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
        blit(velocity.write);
        velocity.swap();

        gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
        gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
        blit(dye.write);
        dye.swap();
    }

    function splatPointer(pointer: Pointer) {
        const dx = pointer.deltaX * config.SPLAT_FORCE;
        const dy = pointer.deltaY * config.SPLAT_FORCE;
        splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    }

    function multipleSplats(amount: number) {
        for (let i = 0; i < amount; i++) {
            const color = generateColor();
            color.r *= 10.0;
            color.g *= 10.0;
            color.b *= 10.0;
            const x = Math.random();
            const y = Math.random();
            const dx = 1000 * (Math.random() - 0.5);
            const dy = 1000 * (Math.random() - 0.5);
            splat(x, y, dx, dy, color);
        }
    }

    function step(dt: number) {
        gl.disable(gl.BLEND);

        curlProgram.bind();
        gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
        blit(curl);

        vorticityProgram.bind();
        gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
        gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
        gl.uniform1f(vorticityProgram.uniforms.dt, dt);
        blit(velocity.write);
        velocity.swap();

        divergenceProgram.bind();
        gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
        blit(divergence);

        clearProgram.bind();
        gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
        gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
        blit(pressure.write);
        pressure.swap();

        pressureProgram.bind();
        gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
        for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
            gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
            blit(pressure.write);
            pressure.swap();
        }

        gradientSubtractProgram.bind();
        gl.uniform2f(gradientSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        gl.uniform1i(gradientSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
        gl.uniform1i(gradientSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
        blit(velocity.write);
        velocity.swap();

        advectionProgram.bind();
        gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
        if (!ext.supportLinearFiltering)
            gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
        const velocityId = velocity.read.attach(0);
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
        gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
        gl.uniform1f(advectionProgram.uniforms.dt, dt);
        gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
        blit(velocity.write);
        velocity.swap();

        if (!ext.supportLinearFiltering)
            gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
        gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
        gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
        blit(dye.write);
        dye.swap();
    }

    // ============ GLASS RENDERING ============
    let time = 0;

    function generateNoise() {
        noiseProgram.bind();
        gl.uniform1f(noiseProgram.uniforms.uTime, config.ANIMATE_NOISE ? time : 0);
        gl.uniform1f(noiseProgram.uniforms.uScale, config.NOISE_SCALE);
        gl.uniform1i(noiseProgram.uniforms.uOctaves, config.NOISE_OCTAVES);
        gl.uniform1f(noiseProgram.uniforms.uNoiseSpeed, config.NOISE_SPEED);
        gl.uniform2f(noiseProgram.uniforms.texelSize, noiseFBO.texelSizeX, noiseFBO.texelSizeY);
        blit(noiseFBO);
    }

    function renderFluidToTexture() {
        displayMaterial.bind();
        gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / fluidFBO.width, 1.0 / fluidFBO.height);
        gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
        blit(fluidFBO);
    }

    function applyGaussianBlur(source: FBO, temp: FBO, dest: FBO, radius: number) {
        // Horizontal pass
        gaussianBlurProgram.bind();
        gl.uniform1i(gaussianBlurProgram.uniforms.uTexture, source.attach(0));
        gl.uniform2f(gaussianBlurProgram.uniforms.uDirection, 1.0, 0.0);
        gl.uniform2f(gaussianBlurProgram.uniforms.uResolution, source.width, source.height);
        gl.uniform1f(gaussianBlurProgram.uniforms.uRadius, radius);
        blit(temp);

        // Vertical pass
        gl.uniform1i(gaussianBlurProgram.uniforms.uTexture, temp.attach(0));
        gl.uniform2f(gaussianBlurProgram.uniforms.uDirection, 0.0, 1.0);
        blit(dest);
    }

    function renderGlassEffect() {
        if (!config.GLASS_ENABLED || glassCards.length === 0) return;

        generateNoise();
        renderFluidToTexture();
        applyGaussianBlur(fluidFBO, blurFBO1, blurFBO2, config.GLASS_BLUR_RADIUS);

        glassCompositeProgram.bind();
        gl.uniform1i(glassCompositeProgram.uniforms.uBackground, fluidFBO.attach(0));
        gl.uniform1i(glassCompositeProgram.uniforms.uBlurred, blurFBO2.attach(1));
        gl.uniform1i(glassCompositeProgram.uniforms.uNoise, noiseFBO.attach(2));
        gl.uniform2f(glassCompositeProgram.uniforms.uResolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.uniform1f(glassCompositeProgram.uniforms.uDisplacementScale, config.DISPLACEMENT_SCALE);
        gl.uniform1f(glassCompositeProgram.uniforms.uChromaticAberration, config.CHROMATIC_ABERRATION);
        gl.uniform1f(glassCompositeProgram.uniforms.uFresnelStrength, config.FRESNEL_STRENGTH);
        gl.uniform1f(glassCompositeProgram.uniforms.uEdgeLightIntensity, config.EDGE_LIGHT_INTENSITY);
        gl.uniform1f(glassCompositeProgram.uniforms.uSpecularIntensity, config.SPECULAR_INTENSITY);
        gl.uniform1f(glassCompositeProgram.uniforms.uSpecularSize, config.SPECULAR_SIZE);
        gl.uniform1f(glassCompositeProgram.uniforms.uBrightness, config.BRIGHTNESS);
        gl.uniform1f(glassCompositeProgram.uniforms.uContrast, config.CONTRAST);
        gl.uniform1f(glassCompositeProgram.uniforms.uSaturation, config.SATURATION);
        gl.uniform3f(
            glassCompositeProgram.uniforms.uColorTint,
            config.COLOR_TINT.r,
            config.COLOR_TINT.g,
            config.COLOR_TINT.b
        );
        gl.uniform1f(glassCompositeProgram.uniforms.uTime, time);

        // Render each glass card
        for (const card of glassCards) {
            gl.uniform4f(glassCompositeProgram.uniforms.uGlassRect, card.x, card.y, card.width, card.height);
            gl.uniform1f(glassCompositeProgram.uniforms.uCornerRadius, card.cornerRadius);
            blit(null);
        }
    }

    // ============ MAIN RENDER ============
    function render() {
        if (!config.GLASS_ENABLED) {
            // Just render fluid directly
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);
            if (!config.TRANSPARENT) {
                colorProgram.bind();
                const c = normalizeColor(config.BACK_COLOR);
                gl.uniform4f(colorProgram.uniforms.color, c.r, c.g, c.b, 1);
                blit(null);
            }
            displayMaterial.bind();
            gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / gl.drawingBufferWidth, 1.0 / gl.drawingBufferHeight);
            gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
            blit(null);
        } else {
            renderGlassEffect();
        }
    }

    // ============ MAIN LOOP ============
    let lastUpdateTime = Date.now();
    let animationId: number;

    function resizeCanvas(): boolean {
        const width = scaleByPixelRatio(canvas.clientWidth);
        const height = scaleByPixelRatio(canvas.clientHeight);
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            return true;
        }
        return false;
    }

    function applyInputs() {
        if (splatStack.length > 0) multipleSplats(splatStack.pop()!);
        pointers.forEach((p) => {
            if (p.moved) {
                p.moved = false;
                splatPointer(p);
            }
        });
    }

    function calcDeltaTime(): number {
        const now = Date.now();
        let dt = (now - lastUpdateTime) / 1000;
        dt = Math.min(dt, 0.016666);
        lastUpdateTime = now;
        return dt;
    }

    function update() {
        const dt = calcDeltaTime();
        time += dt;
        if (resizeCanvas()) initFramebuffers();
        applyInputs();
        if (!config.PAUSED) step(dt);
        render();
        animationId = requestAnimationFrame(update);
    }

    // ============ EVENT HANDLERS ============
    function createMouseDownHandler() {
        return (e: MouseEvent) => {
            const posX = scaleByPixelRatio(e.offsetX);
            const posY = scaleByPixelRatio(e.offsetY);
            updatePointerDownData(pointers[0], -1, posX, posY);
        };
    }

    function createMouseMoveHandler() {
        return (e: MouseEvent) => {
            if (!pointers[0].down) return;
            const posX = scaleByPixelRatio(e.offsetX);
            const posY = scaleByPixelRatio(e.offsetY);
            updatePointerMoveData(pointers[0], posX, posY);
        };
    }

    function createMouseUpHandler() {
        return () => {
            updatePointerUpData(pointers[0]);
        };
    }

    function createTouchStartHandler() {
        return (e: TouchEvent) => {
            e.preventDefault();
            const touches = e.targetTouches;
            while (touches.length >= pointers.length) pointers.push(createPointer());
            for (let i = 0; i < touches.length; i++) {
                const rect = canvas.getBoundingClientRect();
                const posX = scaleByPixelRatio(touches[i].clientX - rect.left);
                const posY = scaleByPixelRatio(touches[i].clientY - rect.top);
                updatePointerDownData(pointers[i + 1], touches[i].identifier, posX, posY);
            }
        };
    }

    function createTouchMoveHandler() {
        return (e: TouchEvent) => {
            e.preventDefault();
            const touches = e.targetTouches;
            for (let i = 0; i < touches.length; i++) {
                const pointer = pointers[i + 1];
                if (!pointer?.down) continue;
                const rect = canvas.getBoundingClientRect();
                const posX = scaleByPixelRatio(touches[i].clientX - rect.left);
                const posY = scaleByPixelRatio(touches[i].clientY - rect.top);
                updatePointerMoveData(pointer, posX, posY);
            }
        };
    }

    function createTouchEndHandler() {
        return (e: TouchEvent) => {
            const touches = e.changedTouches;
            for (let i = 0; i < touches.length; i++) {
                const pointer = pointers.find((p) => p.id === touches[i].identifier);
                if (pointer) updatePointerUpData(pointer);
            }
        };
    }

    // ============ START ============
    updateKeywords();
    initFramebuffers();
    multipleSplats(Math.floor(Math.random() * 20) + 5);
    update();

    // ============ RETURN API ============
    return {
        destroy: () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        },
        handlers: {
            onMouseDown: createMouseDownHandler(),
            onMouseMove: createMouseMoveHandler(),
            onMouseUp: createMouseUpHandler(),
            onTouchStart: createTouchStartHandler(),
            onTouchMove: createTouchMoveHandler(),
            onTouchEnd: createTouchEndHandler(),
        },
        handleResize: () => {
            if (resizeCanvas()) initFramebuffers();
        },
        addCard: (options: Partial<GlassCard>) => {
            const card: GlassCard = {
                x: options.x ?? 0.5,
                y: options.y ?? 0.5,
                width: options.width ?? 0.3,
                height: options.height ?? 0.15,
                cornerRadius: options.cornerRadius ?? 0.02,
            };
            glassCards.push(card);
            return glassCards.length - 1;
        },
        removeCard: (index: number) => {
            if (index >= 0 && index < glassCards.length) {
                glassCards.splice(index, 1);
            }
        },
        updateCard: (index: number, updates: Partial<GlassCard>) => {
            if (glassCards[index]) {
                Object.assign(glassCards[index], updates);
            }
        },
        clearCards: () => {
            glassCards.length = 0;
        },
        config,
        glassCards,
    };
}
