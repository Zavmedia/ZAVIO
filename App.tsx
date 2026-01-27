import React, { useState, useRef, useEffect } from 'react';
import { ZavioDomain, AnalysisResult, DecisionClassification, RiskLevel, SystemState, VoiceShortcut } from './types';
import * as GeminiService from './services/geminiService';
import * as SessionService from './services/sessionService';
import * as StreamingService from './services/streamingService';

// Components
import DashboardLayout from './components/DashboardLayout';
import Header from './components/Header';
import ActivityLog from './components/ActivityLog';
import QuickTasks from './components/QuickTasks';
import SystemDiagnostics from './components/SystemDiagnostics';
import CommandCenter from './components/CommandCenter';
import ChatHistory from './components/ChatHistory';
import ZavioStatus from './components/ZavioStatus';
import ModeInfo from './components/ModeInfo';
import Gauges from './components/Gauges';
import LiveGuardian from './components/LiveGuardian';
import ShortcutModal from './components/ShortcutModal';

// Sci-Fi Components
import GlitchBackground from './components/GlitchBackground';
import SystemMonitor from './components/SystemMonitor';
import NotebookPanel from './components/NotebookPanel';
import ZavioLogo from './components/ZavioLogo';

export default function App() {
  const [input, setInput] = useState('');
  const [systemState, setSystemState] = useState<SystemState>({
    status: 'STANDBY',
    activeDomain: ZavioDomain.GENERAL,
    thinking: false,
    liveMode: false
  });
  const [feed, setFeed] = useState<AnalysisResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastClassification, setLastClassification] = useState<DecisionClassification>(DecisionClassification.NO_ACTION);

  // Voice Input State
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false); // Track if last input was voice
  const [isSpeaking, setIsSpeaking] = useState(false); // Track if AI is speaking
  const recognitionRef = useRef<any>(null);

  // Macros
  const [shortcuts, setShortcuts] = useState<VoiceShortcut[]>([]);
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);

  // Session State
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [useStreaming, setUseStreaming] = useState(true);

  // Load session and shortcuts on mount
  useEffect(() => {
    const loadData = async () => {
      // Load shortcuts from localStorage
      const saved = localStorage.getItem('zavio_shortcuts');
      if (saved) {
        try {
          setShortcuts(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to load shortcuts", e);
        }
      }

      // Load session from backend
      try {
        const session = await SessionService.loadSession();
        if (session.decisions.length > 0) {
          setFeed(session.decisions);
          console.log(`[SESSION] Loaded ${session.decisions.length} decisions from history`);
        }
        if (session.preferences.defaultDomain) {
          setSystemState(prev => ({ ...prev, activeDomain: session.preferences.defaultDomain as ZavioDomain }));
        }
        setSessionLoaded(true);
      } catch (e) {
        console.error("Failed to load session", e);
        setSessionLoaded(true); // Continue anyway
      }
    };

    loadData();
  }, []);

  const saveShortcuts = (newShortcuts: VoiceShortcut[]) => {
    setShortcuts(newShortcuts);
    localStorage.setItem('zavio_shortcuts', JSON.stringify(newShortcuts));
  };

  // Voice Input Logic using Web Speech API (native browser STT)
  const lastTranscriptRef = useRef<string>('');
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleVoiceToggle = async () => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("Web Speech API not supported in this browser");
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      setSystemState(prev => ({ ...prev, status: 'ERROR' }));
      setTimeout(() => setSystemState(prev => ({ ...prev, status: 'STANDBY' })), 2000);
      return;
    }

    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("MediaDevices API not available, proceeding with Speech Recognition only");
    }

    if (isRecording) {
      // Manual stop - submit immediately
      recognitionRef.current?.stop();
    } else {
      // Clear previous input and start fresh
      setInput('');
      lastTranscriptRef.current = '';

      // Start recording
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening until user clicks stop
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setSystemState(prev => ({ ...prev, status: 'LISTENING' }));
        // Play start beep
        const beep = new AudioContext();
        const osc = beep.createOscillator();
        const gain = beep.createGain();
        osc.connect(gain);
        gain.connect(beep.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.1;
        osc.start();
        osc.stop(beep.currentTime + 0.15);
      };

      recognition.onresult = (event: any) => {
        // Build transcript from ALL results (both final and interim)
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          fullTranscript += result[0].transcript;
        }

        console.log("[VOICE] Transcript:", fullTranscript);
        setInput(fullTranscript);
        lastTranscriptRef.current = fullTranscript;

        // Check for shortcut trigger on final result
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const cleanText = fullTranscript.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
          const shortcut = shortcuts.find(s => s.trigger.toLowerCase() === cleanText);
          if (shortcut) {
            setInput(shortcut.command);
            lastTranscriptRef.current = shortcut.command;
          }
        }

        // Reset silence timeout - auto-confirm after 2 seconds of no speech
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = setTimeout(() => {
          console.log("[VOICE] 2 seconds of silence detected, auto-confirming...");
          recognitionRef.current?.stop(); // This will trigger onend and auto-submit
        }, 2000);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);

        // Provide helpful error messages
        let errorMessage = "Voice input error. Please try again.";
        if (event.error === 'not-allowed') {
          errorMessage = "Microphone blocked. Click the lock icon in the address bar and allow microphone access, then refresh.";
        } else if (event.error === 'no-speech') {
          errorMessage = "No speech detected. Please speak louder or closer to the microphone.";
        } else if (event.error === 'network') {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (event.error === 'aborted') {
          errorMessage = "Voice input cancelled.";
        }

        alert(errorMessage);
        setSystemState(prev => ({ ...prev, status: 'ERROR' }));
        setTimeout(() => setSystemState(prev => ({ ...prev, status: 'STANDBY' })), 2000);
      };

      recognition.onend = () => {
        setIsRecording(false);

        // Clear silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        // Play stop beep (lower tone)
        const beep = new AudioContext();
        const osc = beep.createOscillator();
        const gain = beep.createGain();
        osc.connect(gain);
        gain.connect(beep.destination);
        osc.frequency.value = 440;
        gain.gain.value = 0.1;
        osc.start();
        osc.stop(beep.currentTime + 0.15);

        // Auto-submit immediately if there's input
        const textToSubmit = lastTranscriptRef.current;
        if (textToSubmit.trim()) {
          setVoiceMode(true); // Enable auto-speak for response
          processInput(textToSubmit, null);
          setInput(''); // Clear for next voice command
          lastTranscriptRef.current = '';
        } else {
          setSystemState(prev => ({ ...prev, status: 'STANDBY' }));
        }
      };

      recognitionRef.current = recognition;

      // Start recognition with error handling
      try {
        console.log("[VOICE] Starting speech recognition...");
        recognition.start();
        console.log("[VOICE] Speech recognition started successfully");
      } catch (error: any) {
        console.error("[VOICE] Failed to start speech recognition:", error);
        alert("Failed to start voice input: " + (error.message || "Unknown error. Make sure microphone is not in use by another app."));
        setIsRecording(false);
        setSystemState(prev => ({ ...prev, status: 'ERROR' }));
        setTimeout(() => setSystemState(prev => ({ ...prev, status: 'STANDBY' })), 2000);
      }
    }
  };

  const processInput = async (textInput: string, file?: File | null) => {
    setSystemState(prev => ({ ...prev, thinking: true, status: 'THINKING' }));

    try {
      let imageBase64 = undefined;
      let mimeType = undefined;

      if (file) {
        const convertFileToBase64 = (f: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(f);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
          });
        };
        imageBase64 = await convertFileToBase64(file);
        mimeType = file.type;
      }

      const analysis = await GeminiService.analyzeInput(
        textInput || (file ? "Analyze this context." : ""),
        systemState.activeDomain,
        imageBase64,
        mimeType
      );

      if (analysis.classification === DecisionClassification.MONITOR || textInput.toLowerCase().includes('verify')) {
        const searchResult = await GeminiService.verifyIntel(analysis.inputSummary);
        if (searchResult.sources && searchResult.sources.length > 0) {
          analysis.reasoning += `\n\n[INTEL VERIFIED]: ${searchResult.text}`;
          analysis.groundingUrls = searchResult.sources;
        }
      }

      setFeed(prev => [analysis, ...prev]); // Prepend new items
      setLastClassification(analysis.classification);
      setInput('');
      setSelectedFile(null);

      // Save decision to session
      try {
        await SessionService.saveDecision(analysis);
      } catch (e) {
        console.error("Failed to save decision to session", e);
      }

      // Auto-add detected task to NotebookPanel task list
      if (analysis.detectedTask) {
        try {
          const existingTasks = JSON.parse(localStorage.getItem('zavio_tasks') || '[]');
          const newTask = {
            id: crypto.randomUUID(),
            text: analysis.detectedTask,
            completed: false
          };
          localStorage.setItem('zavio_tasks', JSON.stringify([newTask, ...existingTasks]));
          console.log('[ZAVIO] Task auto-added:', analysis.detectedTask);

          // Dispatch storage event to notify NotebookPanel
          window.dispatchEvent(new Event('storage'));
        } catch (e) {
          console.error("Failed to auto-add task:", e);
        }
      }

      // Auto-speak if voice mode was used
      if (voiceMode && analysis.response) {
        setVoiceMode(false); // Reset voice mode
        const text = analysis.response;

        if ('speechSynthesis' in window) {
          // Clean text for smoother speech
          const cleanText = text
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/`[^`]+`/g, '') // Remove inline code
            .replace(/\*\*/g, '').replace(/\*/g, '') // Remove markdown
            .replace(/#+ /g, '') // Remove headers
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links to text
            .replace(/\n\n+/g, '. ').replace(/\n/g, ', ')
            .trim();

          speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.rate = 0.95;
          utterance.pitch = 1.05;
          utterance.volume = 1.0;

          const voices = speechSynthesis.getVoices();
          const voice = voices.find(v => v.name === 'Google US English') ||
            voices.find(v => v.name.includes('Zira')) ||
            voices.find(v => v.lang === 'en-US') ||
            voices[0];
          if (voice) utterance.voice = voice;

          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);

          // Update status to speaking
          setSystemState(prev => ({ ...prev, status: 'SPEAKING' }));
          speechSynthesis.speak(utterance);
        }
      } else {
        setSystemState(prev => ({ ...prev, status: 'STANDBY' }));
      }

    } catch (error: any) {
      console.error(error);
      setSystemState(prev => ({ ...prev, status: 'ERROR' }));
      setTimeout(() => setSystemState(prev => ({ ...prev, status: 'STANDBY' })), 3000);
    } finally {
      setSystemState(prev => ({ ...prev, thinking: false }));
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !selectedFile) || systemState.thinking) return;
    await processInput(input, selectedFile);
  };

  return (
    <div className="flex h-screen bg-[#0A0F14] text-[#E0E0E0] overflow-hidden font-sans relative">
      {/* Background Effect */}
      <GlitchBackground />

      {/* Main Content Overlay */}
      <div className="flex w-full h-full relative z-10 p-4 gap-4">

        {/* --- LEFT PANEL (Split) --- */}
        <div className="hidden xl:flex w-[350px] flex flex-col gap-4 flex-shrink-0 animate-[slide-in-left_0.5s_ease-out]">

          {/* Top Half: Monitor & Activity */}
          <div className="flex-[1.2] flex flex-col gap-2 min-h-0 bg-[#0A0F14]/60 border border-[#00E5FF]/20 rounded-lg overflow-hidden backdrop-blur-md">
            <SystemMonitor />
            <div className="flex-1 min-h-0 overflow-hidden p-2">
              <ActivityLog logs={feed.map(f => ({ id: f.id, timestamp: f.timestamp, type: 'system', content: f }))} />
            </div>
            <SystemDiagnostics />
          </div>

          {/* Bottom Half: Notebook */}
          <div className="flex-1 min-h-0">
            <NotebookPanel />
          </div>
        </div>

        {/* --- CENTER PANEL (Chat) --- */}
        <div className="flex-1 min-w-0 flex flex-col bg-transparent border border-[#00E5FF]/20 rounded-lg animate-[fade-in_0.8s_ease-out] shadow-[0_0_50px_rgba(0,229,255,0.05)] relative overflow-hidden">
          {/* ZAVIO Logo Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <ZavioLogo />
          </div>

          <Header />
          <main className="flex-1 min-h-0 relative z-10">
            {/* Main Chat Interface */}
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                <CommandCenter
                  activeAnalysis={feed[0]}
                  onProcessComplete={() => console.log('Process complete')}
                  input={input}
                  setInput={setInput}
                  selectedFile={selectedFile}
                  onFileSelect={setSelectedFile}
                  onSubmit={handleSubmit}
                  isRecording={isRecording}
                  onMicToggle={handleVoiceToggle}
                  status={systemState.status}
                  thinking={systemState.thinking}
                  latestAnalysis={feed[0]}
                  isSpeaking={isSpeaking}
                  onStopSpeaking={() => {
                    speechSynthesis.cancel();
                    setIsSpeaking(false);
                    setSystemState(prev => ({ ...prev, status: 'STANDBY' }));
                  }}
                />
              </div>
            </div>
          </main>
        </div>

        {/* --- RIGHT PANEL (Chat History) --- */}
        <div className="hidden xl:flex w-[300px] flex flex-col gap-4 flex-shrink-0 animate-[slide-in-right_0.5s_ease-out]">
          {/* Mode Info Area */}
          <div className="h-48 flex-shrink-0 bg-[#0A0F14]/60 border border-[#00E5FF]/20 rounded-lg backdrop-blur-md overflow-hidden relative">
            <ModeInfo state={systemState} />
            <div className="absolute top-2 right-2">
              <ZavioStatus status={systemState.status} />
            </div>
          </div>

          <div className="flex-1 min-h-0 bg-[#0A0F14]/60 border border-[#00E5FF]/20 rounded-lg backdrop-blur-md overflow-hidden relative">
            {/* Chat History Component */}
            <div className="absolute inset-0 p-2">
              <ChatHistory messages={feed.flatMap(f => [
                { id: `${f.id}-user`, role: 'user' as const, content: f.inputSummary, timestamp: f.timestamp },
                { id: f.id, role: 'assistant' as const, content: f.response || f.reasoning || f.actionableStep || 'Processed', timestamp: f.timestamp, modelUsed: f.modelUsed }
              ])} />
            </div>
          </div>
        </div>

      </div>

      {/* Global Overlay Effects */}
      <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay"></div>
      <div className="absolute pointer-events-none inset-0 border-[1px] border-[#00E5FF]/10 rounded-lg m-1 z-50"></div>

      {/* Modals */}
      <LiveGuardian
        isOpen={systemState.liveMode}
        onClose={() => setSystemState(prev => ({ ...prev, liveMode: false }))}
      />
      <ShortcutModal
        isOpen={isShortcutModalOpen}
        onClose={() => setIsShortcutModalOpen(false)}
        shortcuts={shortcuts}
        onSave={saveShortcuts}
      />
    </div>
  );
}