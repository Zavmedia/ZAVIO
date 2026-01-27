import React, { useEffect, useRef } from 'react';

const GlitchBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Load background image
        const img = new Image();
        img.src = '/shiv-tech.jpg';

        const draw = () => {
            time += 0.05;
            ctx.fillStyle = '#0A0F14';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw image with fit cover
            if (img.complete) {
                const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width / 2) - (img.width / 2) * scale;
                const y = (canvas.height / 2) - (img.height / 2) * scale;

                // Add jitter
                const jitterX = Math.random() > 0.98 ? (Math.random() - 0.5) * 5 : 0;

                ctx.globalAlpha = 0.7; // Brighter background (was 0.3)
                ctx.drawImage(img, x + jitterX, y, img.width * scale, img.height * scale);
                ctx.globalAlpha = 1.0;
            }

            // Draw Scanlines (SUBTLE)
            ctx.fillStyle = 'rgba(0, 229, 255, 0.02)';
            for (let i = 0; i < canvas.height; i += 3) {
                ctx.fillRect(0, i, canvas.width, 1);
            }

            // Draw Moving Grid
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
            ctx.lineWidth = 1;
            const gridSize = 50;
            const offset = (time * 10) % gridSize;

            ctx.beginPath();
            for (let x = 0; x < canvas.width; x += gridSize) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
            }
            // Horizontal moving lines
            for (let y = offset - gridSize; y < canvas.height; y += gridSize) {
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
            }
            ctx.stroke();

            // Random Glitch blocks
            if (Math.random() > 0.97) {
                const h = Math.random() * 100;
                const y = Math.random() * canvas.height;
                ctx.fillStyle = 'rgba(0, 229, 255, 0.1)';
                ctx.fillRect(0, y, canvas.width, h);
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        img.onload = draw;
        if (img.complete) draw(); // Handle cached image

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <canvas ref={canvasRef} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F14]/80 via-transparent to-[#0A0F14]/90" />

            {/* Circular Animation (HUD BG) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 animate-[spin_60s_linear_infinite]">
                <img src="/hud-bg.png" alt="HUD" className="w-full h-full object-contain filter hue-rotate-180 drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]" />
            </div>
        </div>
    );
};

export default GlitchBackground;
