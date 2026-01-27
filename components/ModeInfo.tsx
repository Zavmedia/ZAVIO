import React from 'react';
import { SystemState } from '../types';

interface ModeInfoProps {
    state: SystemState;
}

const ModeInfo: React.FC<ModeInfoProps> = ({ state }) => {
    return (
        <div className="border-tech h-full bg-[#0D1117]/50 p-4 flex flex-col justify-center relative">

            <div className="mb-4">
                <span className="text-[10px] uppercase text-[#78909C] tracking-widest block mb-1">Current Mode</span>
                <div className="text-lg font-header text-[#00E5FF] tracking-wider font-bold">
                    {state.status || 'STANDBY'}
                </div>
            </div>

            <div className="space-y-2 text-[10px] font-mono">
                <div className="flex justify-between border-b border-[#78909C]/20 pb-1">
                    <span className="text-[#546E7A]">CONTEXT</span>
                    <span className="text-[#B0BEC5]">{state.activeDomain}</span>
                </div>
                <div className="flex justify-between border-b border-[#78909C]/20 pb-1">
                    <span className="text-[#546E7A]">SYSTEM</span>
                    <span className="text-[#00C853]">Stable</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#546E7A]">LAST ACTION</span>
                    <span className="text-[#FF9100]">ADVISE</span>
                </div>
            </div>

            {/* Side decoration */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00E5FF]/50"></div>
        </div>
    );
};

export default ModeInfo;
