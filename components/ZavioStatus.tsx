import React from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';

const ZavioStatus: React.FC = () => {
    return (
        <div className="border-tech h-full bg-[#0D1117]/50 p-4 flex flex-col items-center justify-center relative">
            <div className="absolute top-0 right-0 p-2 flex gap-1">
                <div className="w-1 h-1 bg-[#00E5FF]"></div>
                <div className="w-1 h-1 bg-[#00E5FF]/50"></div>
            </div>

            {/* Avatar Circle */}
            <div className="w-24 h-24 rounded-full border-2 border-[#00E5FF]/30 p-1 mb-3 relative">
                <div className="w-full h-full rounded-full bg-[#00E5FF]/5 flex items-center justify-center relative overflow-hidden">
                    <Cpu size={48} className="text-[#00E5FF] animate-pulse" />
                    {/* Scanning Effect */}
                    <div className="animate-scan"></div>
                </div>

                {/* Orbital Rings */}
                <div className="absolute inset-[-4px] rounded-full border border-[#00E5FF]/20 border-t-transparent animate-spin" style={{ animationDuration: '3s' }}></div>
                <div className="absolute inset-[-8px] rounded-full border border-[#00E5FF]/10 border-b-transparent animate-spin" style={{ animationDuration: '5s', animationDirection: 'reverse' }}></div>
            </div>

            <h2 className="text-xl font-header font-bold tracking-[0.2em] text-[#E0E0E0] mb-1">ZAVIO</h2>
            <div className="flex items-center gap-2 text-[#00C853] text-[10px] uppercase tracking-widest border px-2 py-0.5 border-[#00C853]/30 bg-[#00C853]/5 rounded-sm">
                <ShieldCheck size={12} />
                <span>Secure</span>
            </div>

            <div className="tech-corner tr border-[#00E5FF]/50"></div>
        </div>
    );
};

export default ZavioStatus;
