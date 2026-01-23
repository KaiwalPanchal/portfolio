"use client";
import FloatingParticlesBackground from "@/components/FloatingParticlesBackground";

export default function MyPage() {
    return (
        <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}>
                <FloatingParticlesBackground />
            </div>
            <div style={{ position: "relative", zIndex: 1, padding: "20px", color: "white" }}>
                <h1 className="text-4xl font-bold">Welcome to my Site</h1>
                <p className="mt-4">This is a test of the FloatingParticlesBackground component.</p>
            </div>
        </div>
    );
}
