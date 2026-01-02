// WebGL Shader code for Liquid Glass effect
// Ported from webgl-liquid-glass.js

// ============ BASE VERTEX SHADERS ============

export const baseVertexShader = `
precision highp float;
attribute vec2 aPosition;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 texelSize;

void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const blurVertexShader = `
precision highp float;
attribute vec2 aPosition;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
uniform vec2 texelSize;

void main () {
    vUv = aPosition * 0.5 + 0.5;
    float offset = 1.33333333;
    vL = vUv - texelSize * offset;
    vR = vUv + texelSize * offset;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// ============ FLUID SIMULATION SHADERS ============

export const blurShader = `
precision mediump float;
precision mediump sampler2D;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
uniform sampler2D uTexture;

void main () {
    vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
    sum += texture2D(uTexture, vL) * 0.35294117;
    sum += texture2D(uTexture, vR) * 0.35294117;
    gl_FragColor = sum;
}
`;

export const copyShader = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
uniform sampler2D uTexture;

void main () {
    gl_FragColor = texture2D(uTexture, vUv);
}
`;

export const clearShader = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
uniform sampler2D uTexture;
uniform float value;

void main () {
    gl_FragColor = value * texture2D(uTexture, vUv);
}
`;

export const colorShader = `
precision mediump float;
uniform vec4 color;

void main () {
    gl_FragColor = color;
}
`;

export const splatShader = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;

void main () {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
}
`;

export const advectionShaderSource = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform vec2 dyeTexelSize;
uniform float dt;
uniform float dissipation;

vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main () {
#ifdef MANUAL_FILTERING
    vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
    vec4 result = bilerp(uSource, coord, dyeTexelSize);
#else
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    vec4 result = texture2D(uSource, coord);
#endif
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
}
`;

export const divergenceShader = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;

void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
`;

export const curlShader = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uVelocity;

void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
`;

export const vorticityShader = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;

void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    velocity = min(max(velocity, -1000.0), 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

export const pressureShader = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;

void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float C = texture2D(uPressure, vUv).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
`;

export const gradientSubtractShader = `
precision mediump float;
precision mediump sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;

void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

// ============ GLASS EFFECT SHADERS ============

export const noiseShader = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uScale;
uniform int uOctaves;
uniform float uNoiseSpeed;

vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453123) * 2.0 - 1.0;
}

float perlin(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(dot(hash(i), f),
                   dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
               mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                   dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        value += amplitude * perlin(p * frequency + uTime * uNoiseSpeed);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return value;
}

void main() {
    vec2 p = vUv * uScale;
    float nx = fbm(p, uOctaves);
    float ny = fbm(p + vec2(100.0, 100.0), uOctaves);
    gl_FragColor = vec4(nx * 0.5 + 0.5, ny * 0.5 + 0.5, 0.5, 1.0);
}
`;

export const glassCompositeShader = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uBackground;
uniform sampler2D uBlurred;
uniform sampler2D uNoise;
uniform vec2 uResolution;
uniform float uDisplacementScale;
uniform float uChromaticAberration;
uniform float uFresnelStrength;
uniform float uEdgeLightIntensity;
uniform float uSpecularIntensity;
uniform float uSpecularSize;
uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;
uniform vec3 uColorTint;
uniform vec4 uGlassRect;
uniform float uCornerRadius;
uniform float uTime;

float roundedRectSDF(vec2 p, vec2 size, float radius) {
    vec2 d = abs(p) - size + radius;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - radius;
}

void main() {
    vec2 uv = vUv;
    vec2 center = uGlassRect.xy;
    vec2 size = uGlassRect.zw * 0.5;
    vec2 p = uv - center;
    float aspect = uResolution.x / uResolution.y;
    p.x *= aspect;
    size.x *= aspect;
    
    float d = roundedRectSDF(p, size, uCornerRadius * aspect);
    float glassMask = 1.0 - smoothstep(-0.005, 0.005, d);
    
    if (glassMask < 0.01) {
        gl_FragColor = texture2D(uBackground, uv);
        return;
    }
    
    vec2 noise = texture2D(uNoise, uv * 2.0).rg - 0.5;
    vec2 displacement = noise * uDisplacementScale;
    
    float edgeFactor = smoothstep(0.0, 0.05, -d);
    float fresnel = pow(1.0 - edgeFactor, 3.0) * uFresnelStrength;
    
    vec3 colorR = texture2D(uBlurred, uv + displacement * (1.0 + uChromaticAberration)).rgb;
    vec3 colorG = texture2D(uBlurred, uv + displacement).rgb;
    vec3 colorB = texture2D(uBlurred, uv + displacement * (1.0 - uChromaticAberration)).rgb;
    vec3 color = vec3(colorR.r, colorG.g, colorB.b);
    
    color = (color - 0.5) * uContrast + 0.5 + uBrightness;
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luminance), color, uSaturation);
    color *= uColorTint;
    
    float edgeLight = (1.0 - edgeFactor) * uEdgeLightIntensity;
    color += edgeLight * vec3(0.8, 0.85, 1.0);
    
    vec2 lightPos = vec2(0.3 + sin(uTime * 0.5) * 0.2, 0.3 + cos(uTime * 0.7) * 0.1);
    float specDist = length((uv - center) - lightPos * size);
    float specular = exp(-specDist * specDist / (uSpecularSize * uSpecularSize)) * uSpecularIntensity;
    color += specular * vec3(1.0, 0.98, 0.95);
    
    color += fresnel * vec3(0.15, 0.15, 0.2);
    
    vec3 bgColor = texture2D(uBackground, uv).rgb;
    gl_FragColor = vec4(mix(bgColor, color, glassMask), 1.0);
}
`;

export const gaussianBlurShader = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uDirection;
uniform vec2 uResolution;
uniform float uRadius;

void main() {
    vec2 texelSize = 1.0 / uResolution;
    vec3 result = vec3(0.0);
    float total = 0.0;
    
    for (float i = -12.0; i <= 12.0; i += 1.0) {
        float weight = exp(-i * i / (2.0 * uRadius * uRadius));
        vec2 offset = uDirection * texelSize * i;
        result += texture2D(uTexture, vUv + offset).rgb * weight;
        total += weight;
    }
    
    gl_FragColor = vec4(result / total, 1.0);
}
`;

// Display shader source (with conditional compilation)
export const displayShaderSource = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform sampler2D uTexture;
uniform vec2 texelSize;

vec3 linearToGamma(vec3 color) {
    color = max(color, vec3(0));
    return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
}

void main () {
    vec3 c = texture2D(uTexture, vUv).rgb;
#ifdef SHADING
    vec3 lc = texture2D(uTexture, vL).rgb;
    vec3 rc = texture2D(uTexture, vR).rgb;
    vec3 tc = texture2D(uTexture, vT).rgb;
    vec3 bc = texture2D(uTexture, vB).rgb;
    float dx = length(rc) - length(lc);
    float dy = length(tc) - length(bc);
    vec3 n = normalize(vec3(dx, dy, length(texelSize)));
    vec3 l = vec3(0.0, 0.0, 1.0);
    float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
    c *= diffuse;
#endif
    float a = max(c.r, max(c.g, c.b));
    gl_FragColor = vec4(c, a);
}
`;
