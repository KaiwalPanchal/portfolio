/**
 * ============================================
 * FLUID ANIMATION CONFIGURATION
 * ============================================
 * Edit these values to customize the animation.
 * Save the file and refresh your browser to see changes.
 */

// ──────────────────────────────────────────────
// FLUID PHYSICS PARAMETERS
// ──────────────────────────────────────────────
export const fluidConfig = {
    /** Resolution downscaling (1 = full, 2 = half, etc.). Lower = faster but less detailed. */
    textureDownsample: 1,

    /** How quickly the "ink" fades (0.9 = fast fade, 0.99 = slow fade, 1.0 = no fade) */
    densityDissipation: 0.98,

    /** How quickly movement decays (0.9 = fast stop, 0.99 = flows longer) */
    velocityDissipation: 0.99,

    /** Pressure field decay rate */
    pressureDissipation: 0.8,

    /** Pressure solver iterations (higher = more accurate but slower) */
    pressureIterations: 25,

    /** Vorticity/swirl intensity (0 = no swirl, 50 = heavy swirl) */
    curl: 30,

    /** Size of each splat (0.001 = tiny dots, 0.01 = large blobs) */
    splatRadius: 0.005,
};

// ──────────────────────────────────────────────
// INTERACTION SETTINGS
// ──────────────────────────────────────────────
export const interactionConfig = {
    /** If true, animation triggers on mouse move (no click needed) */
    hoverEnabled: true,

    /** Splat color intensity multiplier (0.1 = faint, 1.0 = bright) */
    colorIntensity: 0.3,

    /** Maximum brightness cap (0.5 = dim, 1.0 = full white). Prevents saturation to white. */
    maxBrightness: 0.8,
};

// ──────────────────────────────────────────────
// UI / OVERLAY SETTINGS
// ──────────────────────────────────────────────
export const uiConfig = {
    /** 
     * Page overlay opacity (0 = fully transparent, 100 = fully opaque)
     * This controls how much the fluid animation shows through your page content.
     * Recommended: 60-90 for readability with visible animation.
     */
    overlayOpacity: 80,

    /** Enable backdrop blur on the overlay (softens the animation behind text) */
    backdropBlur: true,
};
