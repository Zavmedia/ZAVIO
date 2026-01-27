import React from 'react';

interface GaugeProps {
    value: number;
    label: string;
    color: string;
}

const CircularGauge: React.FC<GaugeProps> = ({ value, label, color }) => {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-[#1F2937]"
                />
                <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke={color}
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold" style={{ color }}>{value}%</span>
                <span className="text-[8px] uppercase text-[#546E7A] tracking-tighter">{label}</span>
            </div>
        </div>
    );
}

const Gauges: React.FC = () => {
    return (
        <div className="border-tech h-full bg-[#0D1117]/50 p-2 flex items-center justify-around relative">
            <CircularGauge value={82} label="Confidence" color="#00E5FF" />
            <CircularGauge value={15} label="Risk Level" color="#FF9100" />

            <div className="absolute bottom-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF]/30 to-transparent"></div>
        </div>
    );
};

export default Gauges;
