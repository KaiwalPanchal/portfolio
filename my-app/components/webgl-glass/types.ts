// TypeScript types for WebGL Liquid Glass component

export interface GlassCard {
    x: number;
    y: number;
    width: number;
    height: number;
    cornerRadius: number;
}

export interface ColorRGB {
    r: number;
    g: number;
    b: number;
}

export interface WebGLConfig {
    // Fluid simulation settings
    SIM_RESOLUTION: number;
    DYE_RESOLUTION: number;
    CAPTURE_RESOLUTION: number;
    DENSITY_DISSIPATION: number;
    VELOCITY_DISSIPATION: number;
    PRESSURE: number;
    PRESSURE_ITERATIONS: number;
    CURL: number;
    SPLAT_RADIUS: number;
    SPLAT_FORCE: number;
    SHADING: boolean;
    COLORFUL: boolean;
    COLOR_UPDATE_SPEED: number;
    PAUSED: boolean;
    BACK_COLOR: ColorRGB;
    TRANSPARENT: boolean;
    BLOOM: boolean;
    BLOOM_ITERATIONS: number;
    BLOOM_RESOLUTION: number;
    BLOOM_INTENSITY: number;
    BLOOM_THRESHOLD: number;
    BLOOM_SOFT_KNEE: number;
    SUNRAYS: boolean;
    SUNRAYS_RESOLUTION: number;
    SUNRAYS_WEIGHT: number;

    // Glass effect settings
    GLASS_ENABLED: boolean;
    GLASS_BLUR_RADIUS: number;
    DISPLACEMENT_SCALE: number;
    NOISE_SCALE: number;
    NOISE_OCTAVES: number;
    CHROMATIC_ABERRATION: number;
    FRESNEL_STRENGTH: number;
    EDGE_LIGHT_INTENSITY: number;
    SPECULAR_INTENSITY: number;
    SPECULAR_SIZE: number;
    BRIGHTNESS: number;
    CONTRAST: number;
    SATURATION: number;
    COLOR_TINT: ColorRGB;
    NOISE_RESOLUTION: number;
    ANIMATE_NOISE: boolean;
    NOISE_SPEED: number;
}

export interface Pointer {
    id: number;
    texcoordX: number;
    texcoordY: number;
    prevTexcoordX: number;
    prevTexcoordY: number;
    deltaX: number;
    deltaY: number;
    down: boolean;
    moved: boolean;
    color: ColorRGB;
}

export interface FBO {
    texture: WebGLTexture;
    fbo: WebGLFramebuffer;
    width: number;
    height: number;
    texelSizeX: number;
    texelSizeY: number;
    attach: (id: number) => number;
}

export interface DoubleFBO {
    width: number;
    height: number;
    texelSizeX: number;
    texelSizeY: number;
    read: FBO;
    write: FBO;
    swap: () => void;
}

export interface WebGLExtensions {
    formatRGBA: { internalFormat: number; format: number } | null;
    formatRG: { internalFormat: number; format: number } | null;
    formatR: { internalFormat: number; format: number } | null;
    halfFloatTexType: number;
    supportLinearFiltering: boolean;
}

export interface LiquidGlassInstance {
    destroy: () => void;
    handlers: {
        onMouseDown: (e: MouseEvent) => void;
        onMouseMove: (e: MouseEvent) => void;
        onMouseUp: () => void;
        onTouchStart: (e: TouchEvent) => void;
        onTouchMove: (e: TouchEvent) => void;
        onTouchEnd: (e: TouchEvent) => void;
    };
    handleResize: () => void;
    addCard: (options: Partial<GlassCard>) => number;
    removeCard: (index: number) => void;
    updateCard: (index: number, updates: Partial<GlassCard>) => void;
    clearCards: () => void;
    config: WebGLConfig;
    glassCards: GlassCard[];
}

export interface LiquidGlassProps {
    className?: string;
    style?: React.CSSProperties;
    config?: Partial<WebGLConfig>;
}

export interface LiquidGlassRef {
    addCard: (options: Partial<GlassCard>) => number;
    removeCard: (index: number) => void;
    updateCard: (index: number, updates: Partial<GlassCard>) => void;
    clearCards: () => void;
    getConfig: () => WebGLConfig;
    getCards: () => GlassCard[];
}
