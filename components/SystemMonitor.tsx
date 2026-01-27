import React, { useEffect, useState } from 'react';
import { Cpu, Activity, Database } from 'lucide-react';

const SystemMonitor: React.FC = () => {
    const [stats, setStats] = useState({ cpu: 12, gpu: 24, mem: 45 });

    useEffect(() => {
        const interval = setInterval(() => {
            setStats({
                cpu: Math.floor(Math.random() * 40) + 10,
                gpu: Math.floor(Math.random() * 30) + 20,
                mem: Math.floor(Math.random() * 20) + 40 // Memory usage stable around 40-60%
            });
        }, 1000); // Faster updates for "live" feel
        return () => clearInterval(interval);
    }, []);

    const CircleGauge: React.FC<{ value: number; label: string; icon: React.ReactNode; color: string }> = ({ value, label, icon, color }) => {
        const radius = 26;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (value / 100) * circumference;

        return (
            <div className="flex flex-col items-center gap-1 relative group">
                <div className="relative w-20 h-20 flex items-center justify-center">
                    {/* Rotating Outer Ring (Sci-Fi Animation) */}
                    <div className="absolute inset-0 border-2 border-dashed border-[#00E5FF]/20 rounded-full animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-1 border border-dotted border-[#00E5FF]/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

                    <svg className="transform -rotate-90 w-full h-full p-2 filter drop-shadow-[0_0_3px_rgba(0,229,255,0.3)]">
                        {/* Track */}
                        <circle
                            cx="50%"
                            cy="50%"
                            r={radius}
                            stroke={color}
                            strokeWidth="2"
                            fill="transparent"
                            className="opacity-10"
                        />
                        {/* Value Arc */}
                        <circle
                            cx="50%"
                            cy="50%"
                            r={radius}
                            stroke={color}
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-500 ease-out"
                        />
                    </svg>

                    {/* Inner Value */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <div style={{ color }} className="mb-0.5 opacity-90 drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]">{icon}</div>
                        <span className="text-xs font-mono font-bold text-white drop-shadow-[0_0_2px_black]">{value}%</span>
                    </div>
                </div>

                <span className="text-[9px] font-mono tracking-[0.2em] text-[#00E5FF]/70 uppercase">{label}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-2 p-3 bg-[#0A0F14]/40 border-b border-[#00E5FF]/20 relative overflow-hidden flex-shrink-0 z-10 w-full group">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-[#00E5FF] animate-pulse" />
                    <span className="text-[#00E5FF] font-mono text-[10px] tracking-[0.2em] group-hover:text-white transition-colors">SYS_STATUS</span>
                </div>
                {/* Active Indicator */}
                <div className="flex gap-1">
                    <div className="w-1 h-3 bg-[#00E5FF]/20 skew-x-12" />
                    <div className="w-1 h-3 bg-[#00E5FF]/40 skew-x-12" />
                    <div className="w-1 h-3 bg-[#00E5FF] skew-x-12 animate-pulse" />
                </div>
            </div>

            <div className="flex flex-row items-center justify-around w-full relative z-10">
                <CircleGauge value={stats.cpu} label="CPU" icon={<Cpu size={12} />} color="#00E5FF" />
                <CircleGauge value={stats.gpu} label="GPU" icon={<Activity size={12} />} color="#AB47BC" />
                <CircleGauge value={stats.mem} label="MEM" icon={<Database size={12} />} color="#00C853" />
            </div>

            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-transparent via-[#00E5FF]/5 to-transparent blur-sm pointer-events-none" />
        </div>
    );
};

export default SystemMonitor;
