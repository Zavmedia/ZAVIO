import React, { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, Maximize2, Copy, ExternalLink } from 'lucide-react';

interface ImageCanvasProps {
    imageUrl: string;
    prompt?: string;
    onClose: () => void;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ imageUrl, prompt, onClose }) => {
    const [zoom, setZoom] = useState(100);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Preload image
        const img = new Image();
        img.onload = () => setLoading(false);
        img.onerror = () => {
            setLoading(false);
            setError(true);
        };
        img.src = imageUrl;
    }, [imageUrl]);

    const handleDownload = async () => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zavio-generated-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            // Fallback: open in new tab
            window.open(imageUrl, '_blank');
        }
    };

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(imageUrl);
    };

    const handleOpenExternal = () => {
        window.open(imageUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Canvas Container */}
            <div className="relative z-10 w-[90vw] h-[90vh] max-w-6xl bg-[#0A0F14] border border-[#00E5FF]/30 rounded-lg overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,229,255,0.2)]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#0A0F14] border-b border-[#00E5FF]/20">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#00E5FF] animate-pulse" />
                        <span className="text-[#00E5FF] font-mono text-sm uppercase tracking-wider">
                            Image Viewer
                        </span>
                        <span className="text-[#546E7A] text-xs">
                            {zoom}% zoom
                        </span>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setZoom(z => Math.max(25, z - 25))}
                            className="p-2 rounded border border-[#00E5FF]/20 hover:bg-[#00E5FF]/10 transition-colors"
                            title="Zoom Out"
                        >
                            <ZoomOut size={16} className="text-[#00E5FF]" />
                        </button>
                        <button
                            onClick={() => setZoom(100)}
                            className="p-2 rounded border border-[#00E5FF]/20 hover:bg-[#00E5FF]/10 transition-colors"
                            title="Reset Zoom"
                        >
                            <Maximize2 size={16} className="text-[#00E5FF]" />
                        </button>
                        <button
                            onClick={() => setZoom(z => Math.min(300, z + 25))}
                            className="p-2 rounded border border-[#00E5FF]/20 hover:bg-[#00E5FF]/10 transition-colors"
                            title="Zoom In"
                        >
                            <ZoomIn size={16} className="text-[#00E5FF]" />
                        </button>
                        <div className="w-px h-6 bg-[#00E5FF]/20 mx-2" />
                        <button
                            onClick={handleCopyUrl}
                            className="p-2 rounded border border-[#00E5FF]/20 hover:bg-[#00E5FF]/10 transition-colors"
                            title="Copy URL"
                        >
                            <Copy size={16} className="text-[#00E5FF]" />
                        </button>
                        <button
                            onClick={handleOpenExternal}
                            className="p-2 rounded border border-[#00E5FF]/20 hover:bg-[#00E5FF]/10 transition-colors"
                            title="Open in New Tab"
                        >
                            <ExternalLink size={16} className="text-[#00E5FF]" />
                        </button>
                        <button
                            onClick={handleDownload}
                            className="p-2 rounded border border-[#00E5FF]/20 hover:bg-[#00E5FF]/10 transition-colors"
                            title="Download"
                        >
                            <Download size={16} className="text-[#00E5FF]" />
                        </button>
                        <div className="w-px h-6 bg-[#00E5FF]/20 mx-2" />
                        <button
                            onClick={onClose}
                            className="p-2 rounded border border-[#FF5252]/30 hover:bg-[#FF5252]/10 transition-colors"
                            title="Close"
                        >
                            <X size={16} className="text-[#FF5252]" />
                        </button>
                    </div>
                </div>

                {/* Image Area */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[#050810]">
                    {loading ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin" />
                            <span className="text-[#00E5FF] font-mono text-sm">Loading image...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-[#FF5252]/20 flex items-center justify-center">
                                <X size={32} className="text-[#FF5252]" />
                            </div>
                            <span className="text-[#FF5252] font-mono text-sm">Failed to load image</span>
                            <a
                                href={imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#00E5FF] text-xs underline"
                            >
                                Try opening directly
                            </a>
                        </div>
                    ) : (
                        <img
                            src={imageUrl}
                            alt="Generated"
                            className="max-w-full max-h-full object-contain rounded shadow-lg transition-transform duration-200"
                            style={{ transform: `scale(${zoom / 100})` }}
                        />
                    )}
                </div>

                {/* Footer with prompt */}
                {prompt && (
                    <div className="px-4 py-3 bg-[#0A0F14] border-t border-[#00E5FF]/20">
                        <div className="flex items-start gap-2">
                            <span className="text-[#546E7A] text-xs font-mono flex-shrink-0">PROMPT:</span>
                            <p className="text-[#E0E0E0] text-xs font-mono select-all">{prompt}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageCanvas;
