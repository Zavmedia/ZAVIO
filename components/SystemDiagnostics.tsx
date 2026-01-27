import React from 'react';
import { Globe } from 'lucide-react';

const SystemDiagnostics: React.FC = () => {
    return (
        <div className="border-tech h-full bg-[#0D1117]/50 relative overflow-hidden flex flex-col">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-tech-grid opacity-30"></div>

            {/* Content */}
            <div className="relative z-10 flex-1 flex items-center justify-center">
                <div className="relative w-24 h-24 rounded-full border border-[#00E5FF]/20 flex items-center justify-center animate-spin-slow">
                    <div className="absolute inset-0 rounded-full border-t border-[#00E5FF] opacity-50 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-b border-[#00E5FF] opacity-30 animate-spin" style={{ animationDirection: 'reverse' }}></div>
                    <Globe size={48} className="text-[#00E5FF]/20" />
                </div>

                {/* Overlay Data */}
                <div className="absolute bottom-2 left-2 text-[8px] text-[#00E5FF]/70 font-mono space-y-1">
                    <div className="flex gap-2"><span>LAT:</span><span>40.7128 N</span></div>
                    <div className="flex gap-2"><span>LNG:</span><span>74.0060 W</span></div>
                </div>
            </div>

            {/* Footer Label */}
            <div className="border-t border-[#00E5FF]/20 px-3 py-1 bg-[#00E5FF]/5">
                <span className="text-[9px] uppercase tracking-widest text-[#546E7A]">System Diagnostics</span>
            </div>

            <div className="tech-corner bl border-[#00E5FF]/50"></div>
        </div>
    );
};

export default SystemDiagnostics;
