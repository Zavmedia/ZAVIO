import React, { ReactNode } from 'react';

interface DashboardLayoutProps {
    children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#050505] text-[#a0a0a0] font-mono relative overflow-hidden selection:bg-[#00E5FF] selection:text-[#000]">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none"></div>
            <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#00E5FF]/5 to-transparent pointer-events-none"></div>

            {/* Main Container */}
            <div className="relative z-10 w-full h-screen p-4 flex flex-col gap-4">
                {children}
            </div>
        </div>
    );
};

export default DashboardLayout;
