<div align="center">
<img width="1200" height="475" alt="ZAVIO Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# ZAVIO - Intelligent Operating Assistant

**Your AI-Powered Business Companion for Financial Independence**

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite)](https://vitejs.dev/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-API-FF6B6B)](https://openrouter.ai/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 🎯 Overview

ZAVIO is a comprehensive AI assistant designed for entrepreneurs, freelancers, and developers. It combines multiple AI models, voice interaction, and a sci-fi inspired interface to help users with coding, business strategies, market research, and money-making opportunities.

---

## ✨ Features

### 🤖 AI Capabilities
| Feature | Status | Description |
|---------|--------|-------------|
| **Multi-Model AI** | ✅ Complete | Routes tasks to specialized models (Gemini, Gemma, Qwen) |
| **Smart Task Routing** | ✅ Complete | Automatically detects code, search, or general queries |
| **Natural Language Chat** | ✅ Complete | Conversational interface with markdown support |
| **Code Generation** | ✅ Complete | Python, JavaScript, TypeScript, SQL, and more |

### 🎙️ Voice Interaction
| Feature | Status | Description |
|---------|--------|-------------|
| **Voice Input (STT)** | ✅ Complete | Web Speech API for voice commands |
| **Voice Output (TTS)** | ✅ Complete | Natural AI voice with stop button |
| **Voice Shortcuts** | ✅ Complete | Custom triggers for quick commands |

### 🎨 UI/UX
| Feature | Status | Description |
|---------|--------|-------------|
| **Sci-Fi Interface** | ✅ Complete | Cyberpunk-inspired dark theme |
| **Animated Logo** | ✅ Complete | JARVIS-style rotating reactor core |
| **Transparent Chat** | ✅ Complete | Glassmorphism effects |
| **Mobile Responsive** | ✅ Complete | Chat-only view on mobile |
| **Text Selection** | ✅ Complete | Selectable & copyable output |

### 🛠️ Developer Tools
| Feature | Status | Description |
|---------|--------|-------------|
| **Markdown Rendering** | ✅ Complete | Code blocks, headers, lists |
| **Image Canvas** | ✅ Complete | Zoom, download, expand images |
| **System Monitor** | ✅ Complete | CPU, GPU, Memory gauges |
| **Activity Logs** | ✅ Complete | Real-time decision history |

### 🌐 Deployment
| Feature | Status | Description |
|---------|--------|-------------|
| **Cloudflare Tunnel** | ✅ Complete | Public HTTPS access without exposing IP |
| **Multi-Device Access** | ✅ Complete | Works on phone, tablet, desktop |

---

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite 6** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express.js** - API server
- **tsx** - TypeScript execution

### AI Services
- **OpenRouter API** - Multi-model access
  - `google/gemini-2.0-flash-exp:free` - Voice & documents
  - `google/gemma-3-27b-it:free` - General chat
  - `qwen/qwen3-next-80b-a3b-instruct:free` - Coding tasks

### Browser APIs
- **Web Speech API** - Voice input (STT)
- **SpeechSynthesis API** - Voice output (TTS)
- **MediaDevices API** - Microphone access

---

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenRouter API Key (free tier available)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-repo/zavio-intelligent-operating-assistant.git
cd zavio-intelligent-operating-assistant

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY

# Start development servers
npm run dev:server   # Backend (port 3001)
npm run dev          # Frontend (port 3000)
```

### Environment Variables

```env
# Required
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Optional
GEMINI_API_KEY=           # If using Gemini directly
AI_PROVIDER=openrouter    # 'openrouter' or 'gemini'
PORT=3001                 # Backend port
```

---

## 🚀 Usage

### Running Locally
```bash
# Terminal 1: Start backend
npm run dev:server

# Terminal 2: Start frontend
npm run dev

# Open http://localhost:3000
```

### Remote Access (Cloudflare Tunnel)
```bash
# Install cloudflared (one-time)
winget install Cloudflare.cloudflared

# Start tunnel
cloudflared tunnel --url http://localhost:3000

# Use the generated URL on any device
```

### Voice Commands
1. Click the **MIC** button
2. Allow microphone permission
3. Speak your command
4. ZAVIO will process and respond

### Text-to-Speech
1. Get a response from ZAVIO
2. Click **🔊 SPEAK** to hear it
3. Click **⬛ STOP VOICE** to interrupt

---

## 📁 Project Structure

```
zavio---intelligent-operating-assistant/
├── components/           # React components
│   ├── CommandCenter.tsx # Main chat interface
│   ├── ZavioLogo.tsx     # Animated logo
│   ├── MarkdownRenderer.tsx
│   ├── ImageCanvas.tsx
│   └── ...
├── server/               # Backend
│   ├── index.ts          # Express server
│   ├── routes/           # API routes
│   └── services/         # AI services
│       ├── openrouterService.ts
│       ├── orchestrator.ts
│       ├── imageService.ts
│       └── mlAnalytics.ts
├── services/             # Frontend services
│   └── geminiService.ts  # API client
├── App.tsx               # Main app
├── vite.config.ts        # Vite configuration
└── .env                  # Environment variables
```

---

## 🔧 Configuration

### AI Model Routing

| Task Type | Model | Trigger Keywords |
|-----------|-------|------------------|
| General | Gemma 3 27B | Default |
| Coding | Qwen Coder | code, function, debug, python... |
| Voice/Docs | Gemini Flash | voice, document, analyze... |
| Web Search | Perplexity | search, latest, news... |

### Vite Config (External Access)
```typescript
// vite.config.ts
server: {
  host: '0.0.0.0',
  allowedHosts: ['.trycloudflare.com', '.ngrok.io']
}
```

---

## 📋 Current Status

### ✅ Completed Features
- [x] Multi-model AI integration via OpenRouter
- [x] Voice input with Web Speech API
- [x] Natural TTS with stop button
- [x] Sci-fi UI with animated logo
- [x] Transparent chat interface
- [x] Mobile-responsive layout
- [x] Cloudflare Tunnel support
- [x] Markdown rendering with code blocks
- [x] Image viewing canvas
- [x] Error handling with retries
- [x] Session persistence

### 🚧 Pending / In Progress
- [ ] Image generation (requires OpenRouter credits)
- [ ] ML Analytics persistence (data resets on server restart)
- [ ] Full Perplexity integration for research
- [ ] Authentication system
- [ ] User preferences storage

### 🔮 Future Roadmap
- [ ] NotebookLLM integration for document analysis
- [ ] Real-time streaming responses
- [ ] Custom voice model integration
- [ ] Plugin/extension system
- [ ] Multi-language support

---

## 🐛 Known Issues

| Issue | Workaround |
|-------|------------|
| Microphone blocked | Allow permission in browser settings |
| "Provider returned error" | Check OpenRouter credits/API key |
| Tunnel disconnects | Restart `cloudflared` command |
| Voices not loading | Wait for page to fully load |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) - Multi-model API access
- [Google Gemini](https://ai.google.dev/) - AI models
- [Cloudflare](https://www.cloudflare.com/) - Tunnel service
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

---

<div align="center">

**Built with ❤️ for entrepreneurs and developers**

[Report Bug](https://github.com/your-repo/issues) · [Request Feature](https://github.com/your-repo/issues)

</div>
