import FluidSimulation from '../../components/fluid-simulation/FluidSimulation';

export default function TestFluidSim() {
    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            <FluidSimulation />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', zIndex: 10, pointerEvents: 'none' }}>
                <h1 className="text-4xl font-bold">Fluid Simulation Replicated</h1>
                <p className="text-xl">Move your mouse or touch to interact</p>
            </div>
        </div>
    );
}
