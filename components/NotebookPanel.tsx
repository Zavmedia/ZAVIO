import React, { useState, useEffect } from 'react';
import { Book, CheckSquare, List, Send, Plus, Trash2 } from 'lucide-react';

interface Task {
    id: string;
    text: string;
    completed: boolean;
}

const NotebookPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'tasks' | 'daily' | 'notes'>('tasks');
    const [tasks, setTasks] = useState<Task[]>(() => {
        try {
            const saved = localStorage.getItem('zavio_tasks');
            return saved ? JSON.parse(saved) : [
                { id: '1', text: 'Review system diagnostics', completed: false },
                { id: '2', text: 'Optimize neural pathways', completed: true }
            ];
        } catch {
            return [];
        }
    });

    const [dailyRoutine, setDailyRoutine] = useState(() => localStorage.getItem('zavio_routine') || "08:00 - System Boot\n09:00 - Data Sync\n12:00 - Core Analysis");
    const [newTask, setNewTask] = useState('');
    const [noteInput, setNoteInput] = useState('');
    const [noteHistory, setNoteHistory] = useState<{ role: 'user' | 'sys', content: string }[]>([
        { role: 'sys', content: 'NotebookLLM Active. Secure channel established.' }
    ]);

    useEffect(() => {
        localStorage.setItem('zavio_tasks', JSON.stringify(tasks));
    }, [tasks]);

    // Listen for storage events (when tasks added from AI detection in App.tsx)
    useEffect(() => {
        const handleStorageChange = () => {
            try {
                const saved = localStorage.getItem('zavio_tasks');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    // Only update if different to avoid infinite loop
                    if (JSON.stringify(parsed) !== JSON.stringify(tasks)) {
                        setTasks(parsed);
                    }
                }
            } catch (e) {
                console.error('Failed to sync tasks from storage:', e);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [tasks]);

    useEffect(() => {
        localStorage.setItem('zavio_routine', dailyRoutine);
    }, [dailyRoutine]);

    const addTask = () => {
        if (!newTask.trim()) return;
        setTasks([...tasks, { id: crypto.randomUUID(), text: newTask, completed: false }]);
        setNewTask('');
    };

    const toggleTask = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id: string) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const sendNote = async () => {
        if (!noteInput.trim()) return;
        const msg = noteInput;
        setNoteInput('');
        setNoteHistory(prev => [...prev, { role: 'user', content: msg }]);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: `[NotebookLM Query] ${msg}`,
                    domain: 'Notebook',
                    sessionId: 'notebook-session'
                })
            });

            const data = await response.json();

            setNoteHistory(prev => [...prev, {
                role: 'sys',
                content: data.response || data.reasoning || 'Analysis complete.'
            }]);
        } catch (error) {
            console.error('NotebookLM query failed:', error);
            setNoteHistory(prev => [...prev, {
                role: 'sys',
                content: '❌ Connection error. Please check backend service.'
            }]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0A0F14]/90 border border-[#00E5FF]/20 rounded-lg overflow-hidden backdrop-blur-md">
            {/* Header Tabs */}
            <div className="flex border-b border-[#00E5FF]/20 bg-[#1A1F26]">
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`flex-1 py-2 text-xs font-mono uppercase transition-colors ${activeTab === 'tasks' ? 'text-[#00E5FF] bg-[#00E5FF]/10' : 'text-[#546E7A] hover:text-[#00E5FF]'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <CheckSquare size={14} /> Tasks
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('daily')}
                    className={`flex-1 py-2 text-xs font-mono uppercase transition-colors ${activeTab === 'daily' ? 'text-[#00E5FF] bg-[#00E5FF]/10' : 'text-[#546E7A] hover:text-[#00E5FF]'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <List size={14} /> Daily
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex-1 py-2 text-xs font-mono uppercase transition-colors ${activeTab === 'notes' ? 'text-[#00E5FF] bg-[#00E5FF]/10' : 'text-[#546E7A] hover:text-[#00E5FF]'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Book size={14} /> Notes
                    </div>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                {/* --- TASKS --- */}
                {activeTab === 'tasks' && (
                    <div className="space-y-3">
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                                placeholder="Add new task protocol..."
                                className="flex-1 bg-[#0A0F14] border border-[#00E5FF]/30 rounded px-2 py-1 text-sm text-[#E0E0E0] focus:outline-none focus:border-[#00E5FF]"
                            />
                            <button onClick={addTask} className="p-1 bg-[#00E5FF]/20 text-[#00E5FF] rounded hover:bg-[#00E5FF]/30">
                                <Plus size={18} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {tasks.map(task => (
                                <div key={task.id} className="flex items-center gap-2 group animate-[fade-in_0.3s]">
                                    <button
                                        onClick={() => toggleTask(task.id)}
                                        className={`w-4 h-4 rounded border flex items-center justify-center ${task.completed ? 'bg-[#00E5FF]/20 border-[#00E5FF]' : 'border-[#546E7A]'}`}
                                    >
                                        {task.completed && <div className="w-2 h-2 bg-[#00E5FF] rounded-sm" />}
                                    </button>
                                    <span className={`flex-1 text-sm font-mono transition-colors ${task.completed ? 'text-[#546E7A] line-through' : 'text-[#E0E0E0]'}`}>
                                        {task.text}
                                    </span>
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="opacity-0 group-hover:opacity-100 text-[#FF5252] hover:bg-[#FF5252]/10 p-1 rounded transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- DAILY --- */}
                {activeTab === 'daily' && (
                    <div className="h-full flex flex-col">
                        <textarea
                            value={dailyRoutine}
                            onChange={(e) => setDailyRoutine(e.target.value)}
                            className="flex-1 bg-[#0A0F14] border border-[#00E5FF]/20 rounded p-3 text-sm font-mono text-[#E0E0E0] focus:outline-none focus:border-[#00E5FF]/50 resize-none leading-relaxed"
                            placeholder="Define daily protocols..."
                        />
                    </div>
                )}

                {/* --- NOTES (LLM) --- */}
                {activeTab === 'notes' && (
                    <div className="h-full flex flex-col">
                        <div className="flex-1 space-y-3 mb-3 overflow-y-auto">
                            {noteHistory.map((n, i) => (
                                <div key={i} className={`text-xs font-mono p-2 rounded ${n.role === 'sys' ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20' : 'bg-[#1A1F26] text-[#E0E0E0] text-right'}`}>
                                    {n.content}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={noteInput}
                                onChange={(e) => setNoteInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendNote()}
                                placeholder="Query NotebookLM..."
                                className="flex-1 bg-[#0A0F14] border border-[#00E5FF]/30 rounded px-2 py-1 text-xs text-[#E0E0E0] focus:outline-none focus:border-[#00E5FF]"
                            />
                            <button onClick={sendNote} className="text-[#00E5FF] hover:text-white transition-colors">
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotebookPanel;
