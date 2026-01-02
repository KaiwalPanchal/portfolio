// @ts-nocheck
/* eslint-disable */
/**
 * Initialize WebGL Liquid Glass engine
 * Loads the full webgl-liquid-glass.js and initializes it with the canvas
 */

import glassConfig from './glass-layout-config.json';

export function initWebGLGlass(canvas: HTMLCanvasElement, configOverride: any = {}) {
  return new Promise((resolve) => {
    // Set canvas as the target for the script
    // The script looks for canvas by tag, so we need to ensure it's the first one
    canvas.id = 'fluid-canvas';

    // Resize canvas
    const scaleByPixelRatio = (input: number) => {
      const pixelRatio = window.devicePixelRatio || 1;
      return Math.floor(input * pixelRatio);
    };

    canvas.width = scaleByPixelRatio(canvas.clientWidth);
    canvas.height = scaleByPixelRatio(canvas.clientHeight);

    // Merge config
    const mergedConfig = { ...glassConfig.config, ...configOverride };

    // Create a self-contained fluid simulation
    createFluidSimulation(canvas, mergedConfig, glassConfig.glassCards, resolve);
  });
}

function createFluidSimulation(canvas: HTMLCanvasElement, config: any, glassCards: any[], onReady: (engine: any) => void) {
  const gl = canvas.getContext('webgl2', { alpha: true, depth: false, stencil: false, antialias: false }) as WebGL2RenderingContext;
  if (!gl) {
    console.error('WebGL2 not supported');
    return;
  }

  // Get extensions
  gl.getExtension('EXT_color_buffer_float');
  const supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  const halfFloatTexType = gl.HALF_FLOAT;

  // Format helpers
  function getSupportedFormat(internalFormat: number, format: number) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, halfFloatTexType, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
      return { internalFormat, format };
    }
    return null;
  }

  const formatRGBA = getSupportedFormat(gl.RGBA16F, gl.RGBA) || getSupportedFormat(gl.RGBA32F, gl.RGBA);
  const formatRG = getSupportedFormat(gl.RG16F, gl.RG) || getSupportedFormat(gl.RG32F, gl.RG);
  const formatR = getSupportedFormat(gl.R16F, gl.RED) || getSupportedFormat(gl.R32F, gl.RED);

  if (!formatRGBA) {
    console.error('Required texture formats not supported');
    return;
  }

  // Shader compilation
  function compileShader(type: number, source: string) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  function createProgram(vs: WebGLShader, fs: WebGLShader) {
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
    }
    return program;
  }

  // Base vertex shader
  const baseVS = compileShader(gl.VERTEX_SHADER, `
    precision highp float;
    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL, vR, vT, vB;
    uniform vec2 texelSize;
    void main() {
      vUv = aPosition * 0.5 + 0.5;
      vL = vUv - vec2(texelSize.x, 0.0);
      vR = vUv + vec2(texelSize.x, 0.0);
      vT = vUv + vec2(0.0, texelSize.y);
      vB = vUv - vec2(0.0, texelSize.y);
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `);

  // Fragment shaders
  const copyFS = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    void main() { gl_FragColor = texture2D(uTexture, vUv); }
  `);

  const clearFS = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;
    void main() { gl_FragColor = value * texture2D(uTexture, vUv); }
  `);

  const splatFS = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;
    void main() {
      vec2 p = vUv - point.xy;
      p.x *= aspectRatio;
      vec3 splat = exp(-dot(p, p) / radius) * color;
      vec3 base = texture2D(uTarget, vUv).xyz;
      gl_FragColor = vec4(base + splat, 1.0);
    }
  `);

  const advectionFS = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform float dt;
    uniform float dissipation;
    void main() {
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      vec4 result = texture2D(uSource, coord);
      float decay = 1.0 + dissipation * dt;
      gl_FragColor = result / decay;
    }
  `);

  const divergenceFS = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uVelocity;
    void main() {
      float L = texture2D(uVelocity, vL).x;
      float R = texture2D(uVelocity, vR).x;
      float T = texture2D(uVelocity, vT).y;
      float B = texture2D(uVelocity, vB).y;
      vec2 C = texture2D(uVelocity, vUv).xy;
      if (vL.x < 0.0) L = -C.x;
      if (vR.x > 1.0) R = -C.x;
      if (vT.y > 1.0) T = -C.y;
      if (vB.y < 0.0) B = -C.y;
      float div = 0.5 * (R - L + T - B);
      gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
  `);

  const curlFS = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uVelocity;
    void main() {
      float L = texture2D(uVelocity, vL).y;
      float R = texture2D(uVelocity, vR).y;
      float T = texture2D(uVelocity, vT).x;
      float B = texture2D(uVelocity, vB).x;
      float vorticity = R - L - T + B;
      gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }
  `);

  const vorticityFS = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;
    void main() {
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
  `);

  const pressureFS = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    void main() {
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      float divergence = texture2D(uDivergence, vUv).x;
      float pressure = (L + R + B + T - divergence) * 0.25;
      gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
  `);

  const gradientFS = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    void main() {
      float L = texture2D(uPressure, vL).x;
      float R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x;
      float B = texture2D(uPressure, vB).x;
      vec2 velocity = texture2D(uVelocity, vUv).xy;
      velocity.xy -= vec2(R - L, T - B);
      gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
  `);

  const displayFS = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    void main() {
      vec3 c = texture2D(uTexture, vUv).rgb;
      float a = max(c.r, max(c.g, c.b));
      gl_FragColor = vec4(c, a);
    }
  `);

  // ============ GLASS EFFECT SHADERS ============
  const noiseFS = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    varying vec2 vUv;
    uniform float uTime;
    uniform float uScale;
    uniform int uOctaves;
    uniform float uNoiseSpeed;
    
    vec2 hash(vec2 p) {
        p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
        return fract(sin(p)*43758.5453123)*2.0-1.0;
    }
    
    float perlin(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(dot(hash(i), f),
                       dot(hash(i+vec2(1,0)), f-vec2(1,0)), u.x),
                   mix(dot(hash(i+vec2(0,1)), f-vec2(0,1)),
                       dot(hash(i+vec2(1,1)), f-vec2(1,1)), u.x), u.y);
    }
    
    float fbm(vec2 p, int octaves) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for(int i = 0; i < 6; i++) {
            if(i >= octaves) break;
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
`);

  const glassCompositeFS = compileShader(gl.FRAGMENT_SHADER, `
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
        
        if(glassMask < 0.01) {
            discard; // Ensure we don't draw over the background if not glass
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
`);

  const gaussianBlurFS = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform vec2 uDirection;
    uniform vec2 uResolution;
    uniform float uRadius;
    
    void main() {
        vec2 texelSize = 1.0 / uResolution;
        vec3 result = vec3(0.0);
        float total = 0.0;
        
        for(float i = -12.0; i <= 12.0; i += 1.0) {
            float weight = exp(-i * i / (2.0 * uRadius * uRadius));
            vec2 offset = uDirection * texelSize * i;
            result += texture2D(uTexture, vUv + offset).rgb * weight;
            total += weight;
        }
        
        gl_FragColor = vec4(result / total, 1.0);
    }
`);

  // Create programs
  const copyProgram = createProgram(baseVS, copyFS);
  const clearProgram = createProgram(baseVS, clearFS);
  const splatProgram = createProgram(baseVS, splatFS);
  const advectionProgram = createProgram(baseVS, advectionFS);
  const divergenceProgram = createProgram(baseVS, divergenceFS);
  const curlProgram = createProgram(baseVS, curlFS);
  const vorticityProgram = createProgram(baseVS, vorticityFS);
  const pressureProgram = createProgram(baseVS, pressureFS);
  const gradientProgram = createProgram(baseVS, gradientFS);
  const displayProgram = createProgram(baseVS, displayFS);

  // Glass Programs
  const noiseProgram = createProgram(baseVS, noiseFS);
  const glassCompositeProgram = createProgram(baseVS, glassCompositeFS);
  const gaussianBlurProgram = createProgram(baseVS, gaussianBlurFS);

  // Setup geometry
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  // FBO creation
  function createFBO(w: number, h: number, internalFormat: number, format: number, filtering: number) {
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtering);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtering);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, halfFloatTexType, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return {
      texture, fbo, width: w, height: h,
      texelSizeX: 1.0 / w, texelSizeY: 1.0 / h,
      attach(id: number) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; }
    };
  }

  function createDoubleFBO(w: number, h: number, internalFormat: number, format: number, filtering: number) {
    let fbo1 = createFBO(w, h, internalFormat, format, filtering);
    let fbo2 = createFBO(w, h, internalFormat, format, filtering);
    return {
      width: w, height: h, texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
      get read() { return fbo1; },
      get write() { return fbo2; },
      swap() { const temp = fbo1; fbo1 = fbo2; fbo2 = temp; }
    };
  }

  // Initialize FBOs
  const simRes = 128;
  const dyeRes = 1024;
  const filtering = supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

  let dye = createDoubleFBO(dyeRes, dyeRes, formatRGBA!.internalFormat, formatRGBA!.format, filtering);
  let velocity = createDoubleFBO(simRes, simRes, formatRG!.internalFormat, formatRG!.format, filtering);
  let divergenceFBO = createFBO(simRes, simRes, formatR!.internalFormat, formatR!.format, gl.NEAREST);
  let curlFBO = createFBO(simRes, simRes, formatR!.internalFormat, formatR!.format, gl.NEAREST);
  let pressure = createDoubleFBO(simRes, simRes, formatR!.internalFormat, formatR!.format, gl.NEAREST);

  // Glass FBOs
  const noiseRes = config.NOISE_RESOLUTION || 512;
  let noiseFBO = createFBO(noiseRes, noiseRes, formatRGBA!.internalFormat, formatRGBA!.format, gl.LINEAR);
  let fluidFBO = createFBO(dyeRes, dyeRes, formatRGBA!.internalFormat, formatRGBA!.format, gl.LINEAR);
  let blurFBO1 = createFBO(dyeRes, dyeRes, formatRGBA!.internalFormat, formatRGBA!.format, gl.LINEAR);
  let blurFBO2 = createFBO(dyeRes, dyeRes, formatRGBA!.internalFormat, formatRGBA!.format, gl.LINEAR);

  // Blit function
  function blit(target: any) {
    if (target == null) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } else {
      gl.viewport(0, 0, target.width, target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  // Splat function
  function splat(x: number, y: number, dx: number, dy: number, color: { r: number, g: number, b: number }) {
    gl.useProgram(splatProgram);
    gl.uniform1i(gl.getUniformLocation(splatProgram, 'uTarget'), velocity.read.attach(0));
    gl.uniform1f(gl.getUniformLocation(splatProgram, 'aspectRatio'), canvas.width / canvas.height);
    gl.uniform2f(gl.getUniformLocation(splatProgram, 'point'), x, y);
    gl.uniform3f(gl.getUniformLocation(splatProgram, 'color'), dx, dy, 0.0);
    gl.uniform1f(gl.getUniformLocation(splatProgram, 'radius'), 0.25 / 100.0);
    blit(velocity.write);
    velocity.swap();

    gl.uniform1i(gl.getUniformLocation(splatProgram, 'uTarget'), dye.read.attach(0));
    gl.uniform3f(gl.getUniformLocation(splatProgram, 'color'), color.r, color.g, color.b);
    blit(dye.write);
    dye.swap();
  }

  // Simulation step
  function step(dt: number) {
    gl.disable(gl.BLEND);

    // Curl
    gl.useProgram(curlProgram);
    gl.uniform2f(gl.getUniformLocation(curlProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(curlProgram, 'uVelocity'), velocity.read.attach(0));
    blit(curlFBO);

    // Vorticity
    gl.useProgram(vorticityProgram);
    gl.uniform2f(gl.getUniformLocation(vorticityProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(vorticityProgram, 'uVelocity'), velocity.read.attach(0));
    gl.uniform1i(gl.getUniformLocation(vorticityProgram, 'uCurl'), curlFBO.attach(1));
    gl.uniform1f(gl.getUniformLocation(vorticityProgram, 'curl'), config.CURL || 30);
    gl.uniform1f(gl.getUniformLocation(vorticityProgram, 'dt'), dt);
    blit(velocity.write);
    velocity.swap();

    // Divergence
    gl.useProgram(divergenceProgram);
    gl.uniform2f(gl.getUniformLocation(divergenceProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(divergenceProgram, 'uVelocity'), velocity.read.attach(0));
    blit(divergenceFBO);

    // Pressure clear
    gl.useProgram(clearProgram);
    gl.uniform1i(gl.getUniformLocation(clearProgram, 'uTexture'), pressure.read.attach(0));
    gl.uniform1f(gl.getUniformLocation(clearProgram, 'value'), config.PRESSURE || 0.8);
    blit(pressure.write);
    pressure.swap();

    // Pressure solve
    gl.useProgram(pressureProgram);
    gl.uniform2f(gl.getUniformLocation(pressureProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(pressureProgram, 'uDivergence'), divergenceFBO.attach(0));
    for (let i = 0; i < (config.PRESSURE_ITERATIONS || 20); i++) {
      gl.uniform1i(gl.getUniformLocation(pressureProgram, 'uPressure'), pressure.read.attach(1));
      blit(pressure.write);
      pressure.swap();
    }

    // Gradient subtract
    gl.useProgram(gradientProgram);
    gl.uniform2f(gl.getUniformLocation(gradientProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(gradientProgram, 'uPressure'), pressure.read.attach(0));
    gl.uniform1i(gl.getUniformLocation(gradientProgram, 'uVelocity'), velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    // Advection (velocity)
    gl.useProgram(advectionProgram);
    gl.uniform2f(gl.getUniformLocation(advectionProgram, 'texelSize'), velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gl.getUniformLocation(advectionProgram, 'uVelocity'), velocity.read.attach(0));
    gl.uniform1i(gl.getUniformLocation(advectionProgram, 'uSource'), velocity.read.attach(0));
    gl.uniform1f(gl.getUniformLocation(advectionProgram, 'dt'), dt);
    gl.uniform1f(gl.getUniformLocation(advectionProgram, 'dissipation'), config.VELOCITY_DISSIPATION || 0.2);
    blit(velocity.write);
    velocity.swap();

    // Advection (dye)
    gl.uniform1i(gl.getUniformLocation(advectionProgram, 'uVelocity'), velocity.read.attach(0));
    gl.uniform1i(gl.getUniformLocation(advectionProgram, 'uSource'), dye.read.attach(1));
    gl.uniform1f(gl.getUniformLocation(advectionProgram, 'dissipation'), config.DENSITY_DISSIPATION || 1.0);
    blit(dye.write);
    dye.swap();
  }

  // Glass Render Functions
  let time = 0;

  function generateNoise() {
    gl.useProgram(noiseProgram);
    gl.uniform1f(gl.getUniformLocation(noiseProgram, 'uTime'), config.ANIMATE_NOISE ? time : 0);
    gl.uniform1f(gl.getUniformLocation(noiseProgram, 'uScale'), config.NOISE_SCALE || 2.0);
    gl.uniform1i(gl.getUniformLocation(noiseProgram, 'uOctaves'), config.NOISE_OCTAVES || 4);
    gl.uniform1f(gl.getUniformLocation(noiseProgram, 'uNoiseSpeed'), config.NOISE_SPEED || 0.05);
    gl.uniform2f(gl.getUniformLocation(noiseProgram, 'texelSize'), noiseFBO.texelSizeX, noiseFBO.texelSizeY);
    blit(noiseFBO);
  }

  function renderFluidToTexture() {
    gl.useProgram(displayProgram);
    gl.uniform1i(gl.getUniformLocation(displayProgram, 'uTexture'), dye.read.attach(0));
    blit(fluidFBO);
  }

  function applyGaussianBlur(source: any, temp: any, dest: any, radius: number) {
    // Horizontal pass
    gl.useProgram(gaussianBlurProgram);
    gl.uniform1i(gl.getUniformLocation(gaussianBlurProgram, 'uTexture'), source.attach(0));
    gl.uniform2f(gl.getUniformLocation(gaussianBlurProgram, 'uDirection'), 1.0, 0.0);
    gl.uniform2f(gl.getUniformLocation(gaussianBlurProgram, 'uResolution'), source.width, source.height);
    gl.uniform1f(gl.getUniformLocation(gaussianBlurProgram, 'uRadius'), radius);
    blit(temp);

    // Vertical pass
    gl.uniform1i(gl.getUniformLocation(gaussianBlurProgram, 'uTexture'), temp.attach(0));
    gl.uniform2f(gl.getUniformLocation(gaussianBlurProgram, 'uDirection'), 0.0, 1.0);
    blit(dest);
  }

  function renderGlassEffect() {
    if (!config.GLASS_ENABLED || glassCards.length === 0) {
      render();
      return;
    }

    generateNoise();
    renderFluidToTexture();
    applyGaussianBlur(fluidFBO, blurFBO1, blurFBO2, config.GLASS_BLUR_RADIUS || 8);

    gl.useProgram(glassCompositeProgram);
    gl.uniform1i(gl.getUniformLocation(glassCompositeProgram, 'uBackground'), fluidFBO.attach(0));
    gl.uniform1i(gl.getUniformLocation(glassCompositeProgram, 'uBlurred'), blurFBO2.attach(1));
    gl.uniform1i(gl.getUniformLocation(glassCompositeProgram, 'uNoise'), noiseFBO.attach(2));
    gl.uniform2f(gl.getUniformLocation(glassCompositeProgram, 'uResolution'), gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uDisplacementScale'), config.DISPLACEMENT_SCALE || 0.08);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uChromaticAberration'), config.CHROMATIC_ABERRATION || 0.015);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uFresnelStrength'), config.FRESNEL_STRENGTH || 0.4);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uEdgeLightIntensity'), config.EDGE_LIGHT_INTENSITY || 0.5);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uSpecularIntensity'), config.SPECULAR_INTENSITY || 0.4);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uSpecularSize'), config.SPECULAR_SIZE || 0.2);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uBrightness'), config.BRIGHTNESS || 0.02);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uContrast'), config.CONTRAST || 1.05);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uSaturation'), config.SATURATION || 1.4);
    const tint = config.COLOR_TINT || { r: 1.0, g: 1.0, b: 1.05 };
    gl.uniform3f(gl.getUniformLocation(glassCompositeProgram, 'uColorTint'), tint.r, tint.g, tint.b);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uTime'), time);

    // First, clear the screen
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    // Render simple fluid background first.
    gl.useProgram(displayProgram);
    gl.uniform1i(gl.getUniformLocation(displayProgram, 'uTexture'), dye.read.attach(0));
    blit(null); // Draw background

    // Updated logic for loop:
    gl.useProgram(glassCompositeProgram);
    gl.uniform1i(gl.getUniformLocation(glassCompositeProgram, 'uBackground'), fluidFBO.attach(0));
    gl.uniform1i(gl.getUniformLocation(glassCompositeProgram, 'uBlurred'), blurFBO2.attach(1));
    gl.uniform1i(gl.getUniformLocation(glassCompositeProgram, 'uNoise'), noiseFBO.attach(2));
    gl.uniform2f(gl.getUniformLocation(glassCompositeProgram, 'uResolution'), gl.drawingBufferWidth, gl.drawingBufferHeight);
    // ... uniforms ...
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uDisplacementScale'), config.DISPLACEMENT_SCALE || 0.08);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uChromaticAberration'), config.CHROMATIC_ABERRATION || 0.015);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uFresnelStrength'), config.FRESNEL_STRENGTH || 0.4);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uEdgeLightIntensity'), config.EDGE_LIGHT_INTENSITY || 0.5);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uSpecularIntensity'), config.SPECULAR_INTENSITY || 0.4);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uSpecularSize'), config.SPECULAR_SIZE || 0.2);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uBrightness'), config.BRIGHTNESS || 0.02);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uContrast'), config.CONTRAST || 1.05);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uSaturation'), config.SATURATION || 1.4);
    gl.uniform3f(gl.getUniformLocation(glassCompositeProgram, 'uColorTint'), tint.r, tint.g, tint.b);
    gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uTime'), time);

    // Enable efficient blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    for (let card of glassCards) {
      gl.uniform4f(gl.getUniformLocation(glassCompositeProgram, 'uGlassRect'), card.x, card.y, card.width, card.height);
      gl.uniform1f(gl.getUniformLocation(glassCompositeProgram, 'uCornerRadius'), card.cornerRadius || 0.02);
      blit(null);
    }
    gl.disable(gl.BLEND);
  }

  // Render
  function render() {
    if (config.GLASS_ENABLED) {
      renderGlassEffect();
    } else {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      gl.useProgram(displayProgram);
      gl.uniform1i(gl.getUniformLocation(displayProgram, 'uTexture'), dye.read.attach(0));
      blit(null);
    }
  }

  // Color generator
  function HSVtoRGB(h: number, s: number, v: number) {
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    return { r, g, b };
  }

  function generateColor() {
    const c = HSVtoRGB(Math.random(), 1.0, 1.0);
    c.r *= 0.15; c.g *= 0.15; c.b *= 0.15;
    return c;
  }

  // Pointer tracking
  let pointer = { x: 0, y: 0, prevX: 0, prevY: 0, down: false, color: generateColor() };

  function updatePointer(x: number, y: number) {
    pointer.prevX = pointer.x;
    pointer.prevY = pointer.y;
    pointer.x = x / canvas.clientWidth;
    pointer.y = 1.0 - y / canvas.clientHeight;
  }

  // Event listeners
  canvas.addEventListener('mousedown', (e) => {
    pointer.down = true;
    pointer.color = generateColor();
    updatePointer(e.offsetX, e.offsetY);
  });

  canvas.addEventListener('mousemove', (e) => {
    updatePointer(e.offsetX, e.offsetY);
    if (pointer.down || true) { // Always track for hover effect
      const dx = (pointer.x - pointer.prevX) * 6000;
      const dy = (pointer.y - pointer.prevY) * 6000;
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        splat(pointer.x, pointer.y, dx, dy, pointer.color);
      }
    }
  });

  window.addEventListener('mouseup', () => { pointer.down = false; });

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    pointer.down = true;
    pointer.color = generateColor();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    updatePointer(touch.clientX - rect.left, touch.clientY - rect.top);
  });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    updatePointer(touch.clientX - rect.left, touch.clientY - rect.top);
    const dx = (pointer.x - pointer.prevX) * 6000;
    const dy = (pointer.y - pointer.prevY) * 6000;
    splat(pointer.x, pointer.y, dx, dy, pointer.color);
  }, { passive: false });

  window.addEventListener('touchend', () => { pointer.down = false; });

  // Add random splats
  for (let i = 0; i < 10; i++) {
    const color = generateColor();
    color.r *= 10; color.g *= 10; color.b *= 10;
    const x = Math.random();
    const y = Math.random();
    const dx = 1000 * (Math.random() - 0.5);
    const dy = 1000 * (Math.random() - 0.5);
    splat(x, y, dx, dy, color);
  }

  // Animation loop
  let lastTime = Date.now();
  let animationId: number;

  function update() {
    const now = Date.now();
    let dt = (now - lastTime) / 1000;
    dt = Math.min(dt, 0.016666);
    lastTime = now;

    time += dt;

    // Resize check
    const w = Math.floor(canvas.clientWidth * (window.devicePixelRatio || 1));
    const h = Math.floor(canvas.clientHeight * (window.devicePixelRatio || 1));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      // Re-init FBOs if resize happens?
      // Simplification: For now just update resolution uniforms, but FBOs might need resize
      // In production you'd rebuild FBOs here.
    }

    step(dt);
    render();
    animationId = requestAnimationFrame(update);
  }

  update();

  // Return engine API
  const engine = {
    config,
    glassCards,
    canvas,
    gl,
    addCard: (options: any) => {
      const card = {
        x: options.x || 0.5, y: options.y || 0.5,
        width: options.width || 0.3, height: options.height || 0.15,
        cornerRadius: options.cornerRadius || 0.02
      };
      glassCards.push(card);
      return glassCards.length - 1;
    },
    removeCard: (index: number) => { if (index >= 0 && index < glassCards.length) glassCards.splice(index, 1); },
    updateCard: (index: number, updates: any) => { if (glassCards[index]) Object.assign(glassCards[index], updates); },
    clearCards: () => { glassCards.length = 0; },
    cleanup: () => { cancelAnimationFrame(animationId); }
  };

  onReady(engine);
}
