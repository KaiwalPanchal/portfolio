'use client';

import ShaderFlow from '@/components/ShaderFlow';

export default function ShaderFlowPage() {
    return (
        <div className="w-full h-screen relative bg-black">
            <ShaderFlow
                xScale={1.0}
                yScale={0.5}
                distortion={0.05}
                speed={0.01}
            />
        </div>
    );
}
