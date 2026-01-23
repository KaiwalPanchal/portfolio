import { MouseTextShadow } from "@/components/mouse-text-shadow"

export default function MouseTextTestPage() {
    return (
        <div className="w-full h-screen bg-black">
            <MouseTextShadow
                text="Shadows"
                copies={80}
                shadowScaleFactor={0.005} // adjusted for better effect
                useGradientGlow={true}
                animateGlow={true}
            />
        </div>
    )
}
