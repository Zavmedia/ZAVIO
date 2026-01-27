import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, X, Activity, Cpu } from 'lucide-react';

interface LiveGuardianProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helpers for Audio
function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
}

const LiveGuardian: React.FC<LiveGuardianProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'CONNECTING' | 'ACTIVE' | 'ERROR' | 'CLOSED'>('CONNECTING');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0); 

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null); 
  
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }
    startSession();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const cleanup = () => {
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    if (outputContextRef.current) { outputContextRef.current.close(); outputContextRef.current = null; }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    setStatus('CLOSED');
  };

  const startSession = async () => {
    setStatus('CONNECTING');
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
        outputContextRef.current = new AudioContextClass({ sampleRate: 24000 });
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                systemInstruction: `You are ZAVIO in Live Mode. Be calm, precise, and understated. Respond like an intelligent onboard operating system.`,
            },
            callbacks: {
                onopen: () => {
                    setStatus('ACTIVE');
                    if (!audioContextRef.current || !streamRef.current) return;
                    const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
                    const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                    processorRef.current = scriptProcessor;
                    scriptProcessor.onaudioprocess = (e) => {
                        if (isMuted) return;
                        const inputData = e.inputBuffer.getChannelData(0);
                        let sum = 0;
                        for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                        setVolume(Math.sqrt(sum / inputData.length));
                        const pcmBlob = createBlob(inputData);
                        sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(audioContextRef.current.destination);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio && outputContextRef.current) {
                        const ctx = outputContextRef.current;
                        const binaryString = atob(base64Audio);
                        const len = binaryString.length;
                        const bytes = new Uint8Array(len);
                        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
                        const dataInt16 = new Int16Array(bytes.buffer);
                        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
                        const channelData = buffer.getChannelData(0);
                        for(let i=0; i<dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

                        const source = ctx.createBufferSource();
                        source.buffer = buffer;
                        source.connect(ctx.destination);
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += buffer.duration;
                        sourcesRef.current.add(source);
                        source.onended = () => sourcesRef.current.delete(source);
                    }
                    if (msg.serverContent?.interrupted) {
                        sourcesRef.current.forEach(s => s.stop());
                        sourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                    }
                },
                onclose: () => setStatus('CLOSED'),
                onerror: (e) => { console.error("Live Error", e); setStatus('ERROR'); }
            }
        });
        sessionRef.current = sessionPromise;
    } catch (e) {
        console.error("Failed to start live session", e);
        setStatus('ERROR');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0C10]/95">
      <div className="bg-[#0A0C10] border border-[#78909C] p-8 w-full max-w-md flex flex-col items-center relative shadow-[0_0_50px_rgba(0,229,255,0.1)]">
        {/* Corners */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00E5FF]"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00E5FF]"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00E5FF]"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00E5FF]"></div>

        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-[#78909C] hover:text-[#FF5252]"
        >
            <X size={20} />
        </button>

        <div className="mb-8 text-center w-full">
            <div className="flex items-center justify-center gap-2 mb-2 text-[#00E5FF]">
                 <Cpu size={20} />
                 <h2 className="text-xl tracking-[0.2em] font-bold">ZAVIO.LIVE</h2>
            </div>
            <div className={`text-[10px] uppercase tracking-widest border-t border-b py-1 border-[#78909C]/30 ${status === 'ACTIVE' ? 'text-[#00C853]' : 'text-[#FF5252]'}`}>
                STATUS: {status}
            </div>
        </div>

        {/* Visualizer */}
        <div className="relative w-40 h-40 mb-8 flex items-center justify-center border border-[#78909C]/20">
            {/* Grid background */}
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'linear-gradient(#00E5FF 1px, transparent 1px), linear-gradient(90deg, #00E5FF 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>
            
            <div className={`absolute inset-4 border border-[#00E5FF] opacity-50 transition-all duration-75`}
                 style={{ transform: `scale(${1 + volume * 2})` }}
            ></div>
            <div className={`absolute inset-8 border border-[#00E5FF] opacity-80 transition-all duration-75`}
                 style={{ transform: `scale(${1 + volume})` }}
            ></div>
            
            <Activity size={32} className="text-[#00E5FF] relative z-10" />
        </div>

        <div className="flex gap-4">
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-4 border transition-colors ${isMuted ? 'border-[#FF5252] text-[#FF5252] bg-[#FF5252]/10' : 'border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF]/10'}`}
            >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
        </div>

        <div className="mt-8 text-center">
            <p className="text-[10px] text-[#78909C] uppercase tracking-wider mb-1">
                Voice Channel: Encrypted
            </p>
            <p className="text-[10px] text-[#78909C] uppercase tracking-wider">
                Latency: Optimal
            </p>
        </div>
      </div>
    </div>
  );
};

export default LiveGuardian;