import React, { useEffect, useState } from 'react';
import { Wifi, Radio, Activity } from 'lucide-react';

const Header: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="grid grid-cols-12 gap-4 h-16 shrink-0">
            {/* Left: Data Feed Label */}
            <div className="col-span-3 border-tech relative flex items-center px-4 bg-[#0D1117]/50 clip-corner-br">
                <div className="absolute top-0 left-0 w-16 h-[1px] bg-[#00E5FF]"></div>
                <div className="flex items-center gap-2 text-xs tracking-widest text-[#00E5FF]">
                    <Activity size={14} className="animate-pulse" />
                    <span className="font-header uppercase">Data Feed</span>
                </div>
                <div className="ml-auto w-12 h-[2px] bg-[#00E5FF]/20"></div>
            </div>

            {/* Center: Overview & System Clock */}
            <div className="col-span-6 border-tech relative flex flex-col justify-center items-center bg-[#0D1117]/80 clip-corner-tl clip-corner-br">
                {/* Top Decoration */}
                <div className="absolute top-0 w-32 h-[2px] bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]"></div>

                <h1 className="text-xs uppercase tracking-[0.3em] font-header text-[#E0E0E0] mb-1">Overview</h1>
                <div className="flex items-center gap-3 text-[10px] text-[#00E5FF] tracking-widest bg-[#00E5FF]/5 px-4 py-1 rounded-sm border border-[#00E5FF]/20">
                    <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full animate-pulse"></span>
                    <span>SYSTEM ONLINE</span>
                    <span className="w-[1px] h-3 bg-[#00E5FF]/30 mx-1"></span>
                    <span>{time.toLocaleTimeString([], { hour12: false })}</span>
                </div>

                {/* Bottom Decoration - V Shape */}
                <div className="absolute bottom-0 w-full flex justify-center">
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#00E5FF]"></div>
                </div>
            </div>

            {/* Right: Network Status */}
            <div className="col-span-3 border-tech relative flex items-center justify-between px-4 bg-[#0D1117]/50 clip-corner-tl">
                <div className="absolute top-0 right-0 w-16 h-[1px] bg-[#00E5FF]"></div>

                <div className="flex flex-col items-end">
                    <span className="text-[9px] uppercase tracking-widest text-[#78909C]">Network Status</span>
                    <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`w-1 h-3 ${i <= 3 ? 'bg-[#00E5FF]' : 'bg-[#1F2937]'}`}></div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3 text-[#00E5FF]">
                    <Wifi size={16} />
                    <Radio size={16} />
                </div>
            </div>
        </header>
    );
};

export default Header;
