import React, { useRef, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Paperclip, X, File } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface CommandCenterProps {
    input: string;
    setInput: (val: string) => void;
    onSubmit: (e?: React.FormEvent) => void;
    isRecording: boolean;
    onMicToggle: () => void;
    status: string;
    thinking: boolean;
    latestAnalysis?: any;
    selectedFile?: File | null;
    onFileSelect?: (file: File | null) => void;
    isSpeaking?: boolean;
    onStopSpeaking?: () => void;
}

const CommandCenter: React.FC<CommandCenterProps> = ({
    input,
    setInput,
    onSubmit,
    isRecording,
    onMicToggle,
    status,
    thinking,
    latestAnalysis,
    selectedFile,
    onFileSelect,
    isSpeaking = false,
    onStopSpeaking
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showInputBar, setShowInputBar] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        if (!thinking && inputRef.current) {
            inputRef.current.focus();
        }
    }, [thinking]);

    // Scroll detection for mobile - hide input bar when scrolling down
    useEffect(() => {
        const handleScroll = () => {
            const container = scrollContainerRef.current;
            if (!container) return;

            const currentScrollY = container.scrollTop;
            const isScrollingDown = currentScrollY > lastScrollY.current;
            const isScrollingUp = currentScrollY < lastScrollY.current;

            // Only hide on mobile (detect via width) and if scrolled enough
            if (window.innerWidth < 1280) {
                if (isScrollingDown && currentScrollY > 50) {
                    setShowInputBar(false);
                } else if (isScrollingUp || currentScrollY < 20) {
                    setShowInputBar(true);
                }
            } else {
                setShowInputBar(true); // Always show on desktop
            }

            lastScrollY.current = currentScrollY;
        };

        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
        }

        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && onFileSelect) {
            onFileSelect(e.target.files[0]);
        }
    };

    const getClassificationColor = (classification: string) => {
        switch (classification) {
            case 'ALERT': return 'text-[#FF5252] border-[#FF5252]';
            case 'ACTION_READY': return 'text-[#FF9100] border-[#FF9100]';
            case 'EXECUTING': return 'text-[#FF9100] border-[#FF9100]';
            case 'ADVISE': return 'text-[#00E5FF] border-[#00E5FF]';
            case 'MONITOR': return 'text-[#4CAF50] border-[#4CAF50]';
            default: return 'text-[#546E7A] border-[#546E7A]';
        }
    };

    return (
        <div className="border-tech h-full bg-transparent flex flex-col p-4 relative clip-corner-tl clip-corner-br overflow-hidden z-10">
            {/* Top Status Bar */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/50 to-transparent"></div>
            <div className="text-center text-[10px] uppercase tracking-[0.3em] font-header text-[#00E5FF] text-glow pt-2 pb-4 hover:animate-[glitch_0.3s_linear_infinite] cursor-default transition-all">
                ZAVIO CORE
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden animate-[fade-in_0.5s_ease-out]">

                {/* Status Header */}
                <div className="text-center mb-4 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-header font-bold text-[#E0E0E0] tracking-wide animate-[slide-in-down_0.5s_ease-out]">
                        {thinking ? 'Thinking...' :
                            status === 'SPEAKING' ? 'Speaking...' :
                                status === 'LISTENING' ? 'Listening...' :
                                    status === 'STANDBY' ? 'Ready to Help' : status}
                    </h2>

                    {/* Thinking Indicator */}
                    {thinking && (
                        <span className="flex items-center justify-center gap-2 text-[#00E5FF] font-mono text-xs mt-2 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full"></span>
                            Processing your request...
                        </span>
                    )}

                    {/* Listening Indicator */}
                    {status === 'LISTENING' && (
                        <div className="flex items-center justify-center gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div
                                    key={i}
                                    className="w-1 bg-[#FF5252] rounded-full animate-pulse"
                                    style={{
                                        height: `${8 + Math.random() * 16}px`,
                                        animationDelay: `${i * 0.1}s`
                                    }}
                                ></div>
                            ))}
                            <span className="ml-2 text-[#FF5252] text-xs font-mono">REC</span>
                        </div>
                    )}

                    {/* Speaking Indicator with Stop Button */}
                    {status === 'SPEAKING' && (
                        <div className="flex items-center justify-center gap-3 mt-2">
                            <span className="flex items-center gap-2 text-[#4CAF50] font-mono text-xs animate-pulse">
                                <span className="w-2 h-2 bg-[#4CAF50] rounded-full"></span>
                                ZAVIO is speaking...
                            </span>
                            <button
                                onClick={() => window.speechSynthesis.cancel()}
                                className="px-2 py-1 text-[8px] border border-[#FF5252]/50 text-[#FF5252] hover:bg-[#FF5252] hover:text-white transition-all rounded"
                            >
                                STOP
                            </button>
                        </div>
                    )}
                </div>

                {/* Conversational Response Display - with max height to keep input visible */}
                {!thinking && latestAnalysis && (
                    <div ref={scrollContainerRef} className="flex-1 min-h-0 max-h-[60vh] overflow-y-auto border border-[#00E5FF]/20 bg-[#0A0F14]/40 backdrop-blur-sm p-4 mb-4 rounded scrollbar-thin scrollbar-thumb-[#00E5FF]/30 scrollbar-track-transparent animate-[slide-in-up_0.4s_ease-out]">
                        {/* Main Conversational Response with Markdown/Code Rendering */}
                        <MarkdownRenderer content={latestAnalysis.response || latestAnalysis.reasoning || "I've processed your request."} />

                        {/* Actionable Step (if exists) - shown prominently */}
                        {latestAnalysis.actionableStep && (
                            <div className="mb-4 p-3 border-l-2 border-[#FF9100] bg-[#FF9100]/10 rounded-r animate-[pulse-slow_3s_infinite]">
                                <span className="text-[#FF9100] text-xs uppercase font-bold">Suggested Action:</span>
                                <p className="text-[#E0E0E0] mt-1">{latestAnalysis.actionableStep}</p>
                            </div>
                        )}

                        {/* Collapsible Details Dropdown */}
                        <div className="border-t border-[#00E5FF]/10 pt-3 mt-3">
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="flex items-center gap-2 text-[#546E7A] hover:text-[#00E5FF] text-xs uppercase tracking-wider transition-all duration-300 transform hover:translate-x-1"
                            >
                                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                System Details
                            </button>

                            {showDetails && (
                                <div className="mt-3 p-3 bg-[#0D1117]/60 border border-[#00E5FF]/10 rounded font-mono text-xs space-y-2 animate-[slide-in-down_0.3s_ease-out]">
                                    {/* Classification & Model Badges */}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className={`px-2 py-0.5 uppercase tracking-wider font-bold border ${getClassificationColor(latestAnalysis.classification)} shadow-[0_0_10px_rgba(0,229,255,0.1)]`}>
                                            {latestAnalysis.classification}
                                        </span>
                                        {/* Model Indicator */}
                                        <span className="px-2 py-0.5 border border-[#AB47BC] text-[#AB47BC] uppercase tracking-wider font-bold shadow-[0_0_10px_rgba(171,71,188,0.1)]">
                                            {latestAnalysis.modelUsed || 'GEMINI'}
                                        </span>
                                        <span className="text-[#00E5FF]">
                                            Confidence: {latestAnalysis.confidence}%
                                        </span>
                                        <span className={`${latestAnalysis.riskLevel === 'HIGH' ? 'text-[#FF5252]' : latestAnalysis.riskLevel === 'MEDIUM' ? 'text-[#FF9100]' : 'text-[#4CAF50]'}`}>
                                            Risk: {latestAnalysis.riskLevel}
                                        </span>
                                    </div>

                                    {/* Summary */}
                                    <div className="text-[#78909C]">
                                        <span className="text-[#546E7A]">Topic:</span> {latestAnalysis.inputSummary}
                                    </div>

                                    {/* Timestamp */}
                                    <div className="text-[#546E7A]">
                                        Processed: {new Date(latestAnalysis.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Welcome message when no analysis */}
                {!thinking && !latestAnalysis && (
                    <div className="flex-1 flex items-center justify-center animate-[fade-in_0.8s_ease-out]">
                        <p className="text-[#546E7A] text-center font-sans">
                            Hello! I'm ZAVIO, your intelligent assistant.<br />
                            <span className="text-[#78909C]">How can I help you today?</span>
                        </p>
                    </div>
                )}

                {/* Input Field - Original Layout - Hides on mobile scroll */}
                <form onSubmit={onSubmit} className={`w-full max-w-lg mx-auto relative group transition-all duration-300 ${showInputBar ? 'opacity-100 translate-y-0' : 'xl:opacity-100 xl:translate-y-0 opacity-0 translate-y-4 pointer-events-none xl:pointer-events-auto'}`}>
                    <div className="absolute inset-0 border border-[#00E5FF]/20 skew-x-[-10deg] bg-[#00E5FF]/5 group-focus-within:border-[#00E5FF] transition-all duration-500 group-focus-within:shadow-[0_0_20px_rgba(0,229,255,0.2)]"></div>

                    {/* Hidden File Input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    {/* File Attachment Button */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 text-[#546E7A] hover:text-[#00E5FF] transition-colors ${selectedFile ? 'text-[#00E5FF]' : ''}`}
                        title="Attach File"
                    >
                        <Paperclip size={18} />
                    </button>

                    {/* Selected File Chip */}
                    {selectedFile && (
                        <div className="absolute -top-8 left-0 flex items-center gap-2 bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-3 py-1 rounded text-xs text-[#00E5FF] animate-[fade-in_0.3s_ease-out]">
                            <File size={12} />
                            <span className="max-w-[150px] truncate">{selectedFile.name}</span>
                            <button
                                type="button"
                                onClick={() => onFileSelect && onFileSelect(null)}
                                className="hover:text-white"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    <textarea
                        ref={inputRef as any}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isRecording ? "LISTENING..." : "ENTER COMMAND"}
                        className="w-full bg-transparent border-none outline-none py-4 px-8 text-center text-[#E0E0E0] font-mono tracking-widest uppercase relative z-10 placeholder:text-[#546E7A] transition-all resize-none min-h-[52px] max-h-[120px] overflow-y-auto"
                        disabled={isRecording}
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                onSubmit();
                            }
                        }}
                    />

                    {/* Visual Cursors */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00E5FF] -translate-x-1 -translate-y-1"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00E5FF] translate-x-1 translate-y-1"></div>
                </form>

                {/* Action Buttons - Hides on mobile scroll */}
                <div className={`flex justify-center gap-3 mt-8 flex-wrap transition-all duration-300 ${showInputBar ? 'opacity-100 translate-y-0' : 'xl:opacity-100 xl:translate-y-0 opacity-0 translate-y-4 pointer-events-none xl:pointer-events-auto'}`}>
                    {/* Mic Button */}
                    <button
                        type="button"
                        onClick={onMicToggle}
                        className={`px-5 py-2 border text-[10px] uppercase tracking-widest transition-all skew-x-[-10deg] ${isRecording
                            ? 'border-[#FF5252] bg-[#FF5252] text-white animate-pulse'
                            : 'border-[#FF9100]/50 text-[#FF9100] hover:bg-[#FF9100] hover:text-[#050505]'
                            }`}
                    >
                        {isRecording ? '● STOP' : '🎤 MIC'}
                    </button>

                    {/* SPEAK Button - reads response aloud with robotic voice */}
                    {latestAnalysis && !thinking && (
                        <>
                            {!isSpeaking ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const text = latestAnalysis.response || latestAnalysis.inputSummary;
                                        if (text && 'speechSynthesis' in window) {
                                            speechSynthesis.cancel();

                                            // Clean text for smoother speech
                                            const cleanText = text
                                                .replace(/```[\s\S]*?```/g, '') // Remove code blocks
                                                .replace(/`[^`]+`/g, '') // Remove inline code
                                                .replace(/\*\*/g, '') // Remove bold
                                                .replace(/\*/g, '') // Remove italic
                                                .replace(/#+ /g, '') // Remove headers
                                                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links to text
                                                .replace(/\n\n+/g, '. ') // Paragraphs to pauses
                                                .replace(/\n/g, ', ') // Newlines to short pauses
                                                .trim();

                                            const utterance = new SpeechSynthesisUtterance(cleanText);

                                            // Natural, smooth AI voice
                                            utterance.rate = 0.95;  // Slightly slower for clarity
                                            utterance.pitch = 1.05; // Pleasant AI tone
                                            utterance.volume = 1.0;

                                            // Find most natural voice
                                            const voices = speechSynthesis.getVoices();
                                            const naturalVoice =
                                                voices.find(v => v.name === 'Google US English') ||
                                                voices.find(v => v.name.includes('Zira')) ||
                                                voices.find(v => v.name.includes('Samantha')) ||
                                                voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
                                                voices.find(v => v.lang === 'en-US') ||
                                                voices[0];
                                            if (naturalVoice) utterance.voice = naturalVoice;

                                            // Note: Parent handles isSpeaking state via onStopSpeaking
                                            speechSynthesis.speak(utterance);
                                        }
                                    }}
                                    className="px-5 py-2 border border-[#4CAF50]/50 text-[#4CAF50] text-[10px] uppercase tracking-widest hover:bg-[#4CAF50] hover:text-[#050505] transition-all skew-x-[-10deg]"
                                >
                                    🔊 SPEAK
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        speechSynthesis.cancel();
                                        if (onStopSpeaking) onStopSpeaking();
                                    }}
                                    className="px-5 py-2 border border-[#FF5252] bg-[#FF5252] text-white text-[10px] uppercase tracking-widest hover:bg-[#FF5252]/80 transition-all skew-x-[-10deg] animate-pulse"
                                >
                                    ⬛ STOP VOICE
                                </button>
                            )}
                        </>
                    )}

                    {/* STOP Generating Button - shows when thinking */}
                    {thinking && (
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="px-5 py-2 border border-[#FF5252] text-[#FF5252] text-[10px] uppercase tracking-widest hover:bg-[#FF5252] hover:text-white transition-all skew-x-[-10deg] animate-pulse"
                        >
                            ⬛ STOP
                        </button>
                    )}

                    {/* CONFIRM Button */}
                    <button
                        type="submit"
                        onClick={() => onSubmit()}
                        className="px-5 py-2 border border-[#00E5FF]/50 text-[#00E5FF] text-[10px] uppercase tracking-widest hover:bg-[#00E5FF] hover:text-[#050505] transition-all skew-x-[-10deg]"
                    >
                        ✓ CONFIRM
                    </button>

                    {/* DISMISS Button */}
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="px-5 py-2 border border-[#546E7A]/50 text-[#546E7A] text-[10px] uppercase tracking-widest hover:bg-[#546E7A] hover:text-white transition-all skew-x-[-10deg]"
                    >
                        ✕ CLEAR
                    </button>
                </div>
            </div>

            {/* Bottom Decoration */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-[#FF9100]/20"></div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-1/3 h-[4px] bg-[#FF9100]/40"></div>
        </div>
    );
};

export default CommandCenter;
