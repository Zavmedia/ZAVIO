import React, { useRef, useEffect } from 'react';
import { MessageSquare, Bot, User } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    modelUsed?: string;
}

interface ChatHistoryProps {
    messages: ChatMessage[];
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages }) => {
    const historyRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [messages]);

    if (messages.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-[#546E7A] font-mono text-xs bg-[#0A0F14]/20 border border-[#00E5FF]/10 rounded">
                <div className="text-center">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No conversation history</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#0A0F14]/40 border border-[#00E5FF]/10 rounded overflow-hidden">
            {/* Header */}
            <div className="px-3 py-2 border-b border-[#00E5FF]/10 flex items-center gap-2 flex-shrink-0">
                <MessageSquare size={14} className="text-[#00E5FF]" />
                <span className="text-[#00E5FF] text-xs font-mono uppercase tracking-wider">Chat History</span>
            </div>

            {/* Messages */}
            <div
                ref={historyRef}
                className="flex-1 overflow-y-auto p-3 space-y-2"
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-2 animate-[fade-in_0.3s_ease-out] ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                    >
                        {/* Assistant Icon */}
                        {msg.role === 'assistant' && (
                            <div className="flex-shrink-0">
                                <div className="w-6 h-6 rounded-full border border-[#00E5FF] bg-[#00E5FF]/10 flex items-center justify-center">
                                    <Bot size={12} className="text-[#00E5FF]" />
                                </div>
                            </div>
                        )}

                        {/* Message Bubble */}
                        <div
                            className={`max-w-[85%] rounded px-3 py-2 ${msg.role === 'user'
                                ? 'bg-[#00E5FF]/20 border border-[#00E5FF]/30'
                                : 'bg-[#0A0F14]/80 border border-[#00E5FF]/10'
                                }`}
                        >
                            <div className="text-[#E0E0E0] text-xs font-mono leading-relaxed">
                                <MarkdownRenderer content={String(msg.content || '')} />
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-[9px] text-[#546E7A]">
                                <span>{new Date(msg.timestamp || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                {msg.modelUsed && msg.role === 'assistant' && (
                                    <>
                                        <span>•</span>
                                        <span className="text-[#AB47BC]">{msg.modelUsed}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* User Icon */}
                        {msg.role === 'user' && (
                            <div className="flex-shrink-0">
                                <div className="w-6 h-6 rounded-full border border-[#FF9100] bg-[#FF9100]/10 flex items-center justify-center">
                                    <User size={12} className="text-[#FF9100]" />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatHistory;
