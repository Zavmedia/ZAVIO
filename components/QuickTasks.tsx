import React from 'react';
import { CheckSquare, Square, ChevronsRight, Clock } from 'lucide-react';

const QuickTasks: React.FC = () => {
    const tasks = [
        { id: 1, text: "Set Reminders", completed: true },
        { id: 2, text: "Review Document", completed: true },
        { id: 3, text: "Start Timer", completed: false, icon: <Clock size={10} /> }
    ];

    return (
        <div className="border-tech h-full bg-[#0D1117]/50 flex flex-col relative">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#00E5FF]/20 bg-[#00E5FF]/5">
                <h3 className="text-[10px] font-header font-bold uppercase tracking-widest text-[#E0E0E0]">Quick Tasks</h3>
                <ChevronsRight size={12} className="text-[#00E5FF]" />
            </div>

            <div className="p-4 space-y-3">
                {tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 text-xs group cursor-pointer">
                        <div className={`transition-colors ${task.completed ? 'text-[#00E5FF]' : 'text-[#546E7A] group-hover:text-[#E0E0E0]'}`}>
                            {task.completed ? <CheckSquare size={14} /> : (task.icon || <Square size={14} />)}
                        </div>
                        <span className={`${task.completed ? 'text-[#78909C] line-through' : 'text-[#B0BEC5] group-hover:text-[#00E5FF] transition-colors'}`}>
                            {task.text}
                        </span>
                    </div>
                ))}
            </div>

            <div className="tech-corner bl border-[#00E5FF]/50"></div>
        </div>
    );
};

export default QuickTasks;
