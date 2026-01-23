import { useEffect, useRef, useMemo } from "react";
// @ts-ignore
import { cubicBezier, useInView } from "framer-motion";
import { useColors, getShaderColorFromString } from "./utils";
import { warpFragmentShader, PatternShapes } from "./warp";
import { ShaderMount } from "./ShaderMount";

const speedEase = cubicBezier(0.65, 0, 0.88, 0.77);

const templates = {
    Prism: {
        color1: "#0b0b0bff",
        color2: "#c0c0c07c",
        color3: "#f0f0f0",
        rotation: -50,
        proportion: 1,
        scale: 0.01,
        speed: 30,
        distortion: 0,
        swirl: 50,
        swirlIterations: 16,
        softness: 47,
        offset: -299,
        shape: "Checks",
        shapeSize: 45,
    },
    Lava: {
        color1: "#FF9F21",
        color2: "#FF0303",
        color3: "#000000",
        rotation: 114,
        proportion: 100,
        scale: 0.52,
        speed: 30,
        distortion: 7,
        swirl: 18,
        swirlIterations: 20,
        softness: 100,
        offset: 717,
        shape: "Edge",
        shapeSize: 12,
    },
    Plasma: {
        color1: "#B566FF",
        color2: "#000000",
        color3: "#000000",
        rotation: 0,
        proportion: 63,
        scale: 0.75,
        speed: 30,
        distortion: 5,
        swirl: 61,
        swirlIterations: 5,
        softness: 100,
        offset: -168,
        shape: "Checks",
        shapeSize: 28,
    },
    Pulse: {
        color1: "#66FF85",
        color2: "#000000",
        color3: "#000000",
        rotation: -167,
        proportion: 92,
        scale: 0,
        speed: 20,
        distortion: 54,
        swirl: 75,
        swirlIterations: 3,
        softness: 28,
        offset: -813,
        shape: "Checks",
        shapeSize: 79,
    },
    Vortex: {
        color1: "#000000",
        color2: "#FFFFFF",
        color3: "#000000",
        rotation: 50,
        proportion: 41,
        scale: 0.4,
        speed: 20,
        distortion: 0,
        swirl: 100,
        swirlIterations: 3,
        softness: 5,
        offset: -744,
        shape: "Stripes",
        shapeSize: 80,
    },
    Mist: {
        color1: "#050505",
        color2: "#FF66B8",
        color3: "#050505",
        rotation: 0,
        proportion: 33,
        scale: 0.48,
        speed: 39,
        distortion: 4,
        swirl: 65,
        swirlIterations: 5,
        softness: 100,
        offset: -235,
        shape: "Edge",
        shapeSize: 48,
    },
};

const defaultPreset = {
    name: "Default",
    params: {
        scale: 1,
        rotation: 0,
        speed: 20,
        seed: 0,
        color1: "hsla(0, 0%, 15%, 1)",
        color2: "hsla(203, 80%, 70%, 1)",
        color3: "hsla(0, 0%, 100%, 1)",
        proportion: 0.35,
        softness: 1,
        distortion: 0.25,
        swirl: 0.8,
        swirlIterations: 10,
        shapeScale: 0.1,
        shape: PatternShapes.Checks,
    },
};

const ShaderMountComponent = ({
    fragmentShader,
    style,
    uniforms = {},
    speed = 1,
    seed = 0,
}: any) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const shaderMountRef = useRef<ShaderMount | null>(null);

    useEffect(() => {
        if (canvasRef.current) {
            shaderMountRef.current = new ShaderMount(
                canvasRef.current,
                fragmentShader,
                uniforms,
                undefined, // context attributes
                speed,
                seed
            );
        }
        return () => {
            shaderMountRef.current?.dispose();
        };
    }, [fragmentShader]);

    useEffect(() => {
        shaderMountRef.current?.setUniforms(uniforms);
    }, [uniforms]);

    useEffect(() => {
        shaderMountRef.current?.setSpeed(speed);
    }, [speed]);

    useEffect(() => {
        shaderMountRef.current?.setSeed(seed);
    }, [seed]);

    return <canvas ref={canvasRef} style={style} />;
};

const Warp = (props: any) => {
    const uniforms = useMemo(() => {
        return {
            u_scale: props.scale ?? defaultPreset.params.scale,
            u_rotation: props.rotation ?? defaultPreset.params.rotation,
            u_color1: getShaderColorFromString(props.color1, defaultPreset.params.color1 as any),
            u_color2: getShaderColorFromString(props.color2, defaultPreset.params.color2 as any),
            u_color3: getShaderColorFromString(props.color3, defaultPreset.params.color3 as any),
            u_proportion: props.proportion ?? defaultPreset.params.proportion,
            u_softness: props.softness ?? defaultPreset.params.softness,
            u_distortion: props.distortion ?? defaultPreset.params.distortion,
            u_swirl: props.swirl ?? defaultPreset.params.swirl,
            u_swirlIterations: props.swirlIterations ?? defaultPreset.params.swirlIterations,
            u_shapeScale: props.shapeScale ?? defaultPreset.params.shapeScale,
            u_shape: props.shape ?? defaultPreset.params.shape,
        };
    }, [
        props.scale,
        props.rotation,
        props.color1,
        props.color2,
        props.color3,
        props.proportion,
        props.softness,
        props.distortion,
        props.swirl,
        props.swirlIterations,
        props.shapeScale,
        props.shape,
        props.speed,
    ]);

    return (
        <ShaderMountComponent
            {...props}
            fragmentShader={warpFragmentShader}
            uniforms={uniforms}
        />
    );
};

export default function AnimatedGradientBackground(props: any) {
    const useCustomColors = props.preset === "custom" || props.colorMode === "custom";
    const values =
        props.preset === "custom" ? props : templates[props.preset as keyof typeof templates] || Object.values(templates)[0];
    const [color1, color2, color3] = useColors(props.color1, props.color2, props.color3);

    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, amount: 0.1 });

    //   const currentSpeed = useMemo(() => {
    //     if (isInView) return speedEase(props.speed / 100) * 5;
    //     return 0;
    //   }, [isInView, props.speed]);

    const currentSpeed = speedEase(values.speed / 100) * 5;


    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                position: "relative",
                ...props.style,
            }}
        >
            <Warp
                color1={useCustomColors ? color1 : values.color1}
                color2={useCustomColors ? color2 : values.color2}
                color3={useCustomColors ? color3 : values.color3}
                scale={values.scale}
                proportion={values.proportion / 100}
                distortion={values.distortion / 50}
                swirl={values.swirl / 100}
                swirlIterations={values.swirl === 0 ? 0 : values.swirlIterations}
                rotation={(values.rotation * Math.PI) / 180}
                speed={currentSpeed}
                seed={values.offset * 10}
                shape={PatternShapes[values.shape as keyof typeof PatternShapes]}
                shapeScale={values.shapeSize / 100}
                softness={values.softness / 100}
                style={{ width: "100%", height: "100%", ...props.style }}
            />
            {/* Noise Overlay */}
            {/* You can re-enable this if you download the noise image or host it */}
            {/*<div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png")`,
          backgroundSize: (props.noise?.scale ?? 1) * 200,
          backgroundRepeat: "repeat",
          opacity: (props.noise?.opacity ?? 0.5) / 2,
          pointerEvents: 'none'
        }}
      />*/}
        </div>
    );
}

export { templates };
