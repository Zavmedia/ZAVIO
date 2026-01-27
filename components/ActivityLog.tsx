import React from 'react';
import { ChevronsRight } from 'lucide-react';
import { LogEntry, DecisionClassification } from '../types';

interface ActivityLogProps {
    logs: LogEntry[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
    // Mock data if empty
    const displayLogs = logs.length > 0 ? logs : [
        { id: '1', timestamp: Date.now(), type: 'system', content: { classification: DecisionClassification.ADVISE, inputSummary: 'Schedule Optimization' } },
        { id: '2', timestamp: Date.now() - 100000, type: 'system', content: { classification: DecisionClassification.MONITOR, inputSummary: 'System Diagnostics' } },
        { id: '3', timestamp: Date.now() - 200000, type: 'system', content: { classification: DecisionClassification.ACTION_READY, inputSummary: 'Prepare Presentation' } },
        { id: '4', timestamp: Date.now() - 300000, type: 'system', content: { classification: DecisionClassification.NO_ACTION, inputSummary: 'Routine Check Complete' } },
    ];

    const getClassColor = (cls: string) => {
        switch (cls) {
            case 'ADVISE': return 'text-[#00E5FF]'; // Cyan
            case 'MONITOR': return 'text-[#78909C]'; // Grey
            case 'ACTION_READY': return 'text-[#FF9100]'; // Amber
            case 'ALERT': return 'text-[#FF5252]'; // Red
            default: return 'text-[#78909C]';
        }
    };

    return (
        <div className="border-tech h-full bg-[#0D1117]/50 flex flex-col overflow-hidden relative">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#00E5FF]/20 bg-[#00E5FF]/5">
                <h3 className="text-[10px] font-header font-bold uppercase tracking-widest text-[#E0E0E0]">Activity Log</h3>
                <ChevronsRight size={12} className="text-[#00E5FF]" />
            </div>

            {/* Log List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-[10px] scrollbar-hide">
                {displayLogs.map((log: any) => (
                    <div key={log.id} className="flex gap-2 opacity-80 hover:opacity-100 transition-opacity">
                        <span className="text-[#546E7A] shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex-1 truncate">
                            <span className={`font-bold mr-1 ${getClassColor(log.content.classification)}`}>
                                {log.content.classification}:
                            </span>
                            <span className="text-[#B0BEC5]">{log.content.inputSummary}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="tech-corner bl border-[#00E5FF]/50"></div>
        </div>
    );
};

export default ActivityLog;
