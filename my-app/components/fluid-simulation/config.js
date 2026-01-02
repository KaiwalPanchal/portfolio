export const config = {
    // Liquid Simulation
    SIM_RESOLUTION: 128, // Lower = faster, pixelated liquid. Higher = smoother.
    DYE_RESOLUTION: 1024, // Resolution of the colored fluid.
    CAPTURE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 1.0, // How fast dye fades.
    VELOCITY_DISSIPATION: 0.2, // How fast motion stops.
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: 30, // How much the fluid swirls.
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

    // Glass Effect
    GLASS_ENABLED: true,
    GLASS_BLUR_RADIUS: 4,     // Blur amount behind the glass
    DISPLACEMENT_SCALE: 0.5,  // Strength of the refraction/distortion
    NOISE_SCALE: 5.0,         // Scale of the noise pattern (higher = finer details)
    NOISE_OCTAVES: 4,         // Detail level of noise
    NOISE_SPEED: 0.24,        // Speed of noise animation
    ANIMATE_NOISE: false,     // Whether the distortion pattern moves over time
    NOISE_RESOLUTION: 512,    // Resolution of the noise texture

    // Glass Visuals
    CHROMATIC_ABERRATION: 0.05, // RGB shift amount
    FRESNEL_STRENGTH: 0.0,      // Rim light strength
    EDGE_LIGHT_INTENSITY: 0.0,  // Brightness of edges
    SPECULAR_INTENSITY: 0.3,    // Shiny reflection strength
    SPECULAR_SIZE: 0.2,         // Size of the reflection
    BRIGHTNESS: -0.15,          // Brightness adjustment
    CONTRAST: 1.1,              // Contrast adjustment
    SATURATION: 0.8,            // Color saturation adjustment
    COLOR_TINT: { r: 1.0, g: 1.0, b: 1.05 } // Color filter
};
