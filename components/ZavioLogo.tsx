import React from 'react';

const ZavioLogo: React.FC = () => {
    return (
        <div className="relative flex items-center justify-center w-full h-full pointer-events-none select-none opacity-100 filter drop-shadow-[0_0_30px_rgba(0,229,255,0.5)]">
            {/* Main Container with Pulse/Glitch */}
            <div className="relative w-[500px] h-[500px] flex items-center justify-center animate-[pulse-slow_4s_infinite]">

                {/* Outer Ring - Rotating Clockwise */}
                <div className="absolute inset-0 rounded-full border-2 border-[#00E5FF]/40 bg-[#00E5FF]/5 animate-[spin_10s_linear_infinite] shadow-[0_0_20px_rgba(0,229,255,0.1)]"></div>
                <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-[#00E5FF]/80 animate-[spin_15s_linear_infinite]" style={{ padding: '4px' }}></div>

                {/* Tech Segments Ring - Counter-Rotating */}
                <div className="absolute w-[400px] h-[400px] rounded-full border-2 border-dashed border-[#00E5FF]/60 animate-[spin_20s_linear_infinite_reverse]"></div>

                {/* Inner Core Rings */}
                <div className="absolute w-[300px] h-[300px] rounded-full border-4 border-[#00E5FF]/30 animate-[pulse_2s_infinite]"></div>
                <div className="absolute w-[280px] h-[280px] rounded-full border-l-4 border-r-4 border-[#00E5FF] animate-[spin_5s_linear_infinite] shadow-[0_0_15px_#00E5FF]"></div>

                {/* Central Hexagon / Reactor Core */}
                <div className="absolute w-[150px] h-[150px] bg-[#00E5FF]/10 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-[#00E5FF] shadow-[0_0_50px_rgba(0,229,255,0.6)] group">
                    {/* The Z Symbol */}
                    <div className="relative z-10 text-7xl font-black italic tracking-tighter text-[#E0FFFF] drop-shadow-[0_0_10px_#00E5FF] animate-[glitch_3s_infinite]">
                        Z
                        <span className="absolute top-0 left-0 -translate-x-[2px] text-[#FF0000] opacity-50 mix-blend-screen animate-[glitch_3s_infinite]" style={{ animationDelay: '0.1s' }}>Z</span>
                        <span className="absolute top-0 left-0 translate-x-[2px] text-[#00FF00] opacity-50 mix-blend-screen animate-[glitch_3s_infinite]" style={{ animationDelay: '0.2s' }}>Z</span>
                    </div>

                    {/* Scanning Line Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00E5FF]/10 to-transparent animate-[scan_2s_linear_infinite] rounded-full overflow-hidden"></div>
                </div>

                {/* Particle Orbitals */}
                <div className="absolute w-[450px] h-[450px] animate-[spin_8s_linear_infinite]">
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-[#00E5FF] rounded-full shadow-[0_0_10px_#00E5FF]"></div>
                    <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-[#00E5FF] rounded-full shadow-[0_0_10px_#00E5FF]"></div>
                </div>
                <div className="absolute w-[350px] h-[350px] animate-[spin_12s_linear_infinite_reverse]">
                    <div className="absolute left-0 top-1/2 w-1.5 h-1.5 bg-[#FF9100] rounded-full shadow-[0_0_10px_#FF9100]"></div>
                    <div className="absolute right-0 top-1/2 w-1.5 h-1.5 bg-[#FF9100] rounded-full shadow-[0_0_10px_#FF9100]"></div>
                </div>

                {/* Decorative Text */}
                <div className="absolute bottom-10 font-mono text-[10px] text-[#00E5FF]/60 tracking-[0.5em] animate-pulse">
                    SYSTEM ONLINE
                </div>
            </div>
        </div>
    );
};

export default ZavioLogo;
