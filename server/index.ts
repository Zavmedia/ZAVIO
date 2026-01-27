import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import zavioRoutes from './routes/zavio.js';
import sessionRoutes from './routes/session.js';
import streamRoutes from './routes/stream.js';
import mlAnalyticsRoutes from './routes/mlAnalytics.js';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Large limit for audio/image base64

// --- Routes ---
app.use('/api', zavioRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/ml', mlAnalyticsRoutes);

// --- Health Check ---
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ZAVIO Core Online',
        timestamp: Date.now(),
        features: ['analysis', 'transcription', 'verification', 'tts', 'sessions', 'streaming', 'ml-analytics']
    });
});

// --- Error Handler ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[ZAVIO ERROR]', err.message);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`\n  ╔══════════════════════════════════════╗`);
    console.log(`  ║     ZAVIO BACKEND - CORE ONLINE      ║`);
    console.log(`  ╠══════════════════════════════════════╣`);
    console.log(`  ║  Port: ${PORT}                          ║`);
    console.log(`  ║  Status: STANDBY                     ║`);
    console.log(`  ║  Features: 6 Active                  ║`);
    console.log(`  ╚══════════════════════════════════════╝\n`);
});

export default app;

