import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink, Download, ZoomIn } from 'lucide-react';

interface MarkdownRendererProps {
    content: string;
    onImageClick?: (imageUrl: string, prompt?: string) => void;
}

// Parse markdown and render with code blocks
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onImageClick }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // Parse content into segments (text, code blocks, images)
    const parseContent = (text: string) => {
        const segments: { type: 'text' | 'code' | 'image'; content: string; language?: string; alt?: string; url?: string }[] = [];

        // Split by code blocks first
        const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(text)) !== null) {
            // Process text before code block for images
            if (match.index > lastIndex) {
                const textPart = text.slice(lastIndex, match.index);
                segments.push(...parseTextAndImages(textPart));
            }

            // Add code block
            segments.push({
                type: 'code',
                language: match[1] || 'code',
                content: match[2].trim()
            });

            lastIndex = match.index + match[0].length;
        }

        // Process remaining text
        if (lastIndex < text.length) {
            segments.push(...parseTextAndImages(text.slice(lastIndex)));
        }

        return segments.length > 0 ? segments : [{ type: 'text' as const, content: text }];
    };

    const parseTextAndImages = (text: string) => {
        const subSegments: { type: 'text' | 'image'; content: string; alt?: string; url?: string }[] = [];
        const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
        let lastIndex = 0;
        let match;

        while ((match = imageRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                subSegments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
            }
            subSegments.push({
                type: 'image',
                content: match[0],
                alt: match[1],
                url: match[2]
            });
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
            subSegments.push({ type: 'text', content: text.slice(lastIndex) });
        }
        return subSegments;
    };

    // Format text with bold, italic, etc.
    const formatText = (text: string) => {
        // Bold
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#00E5FF] font-semibold">$1</strong>');
        // Bullet points
        text = text.replace(/^- /gm, '• ');
        // Numbered lists
        text = text.replace(/^(\d+)\. /gm, '<span class="text-[#00E5FF]">$1.</span> ');
        return text;
    };

    const segments = parseContent(content || '');

    return (
        <div className="space-y-3 select-text">
            {segments.map((segment, index) => {
                if (segment.type === 'image') {
                    return (
                        <div key={index} className="rounded-lg overflow-hidden border border-[#00E5FF]/30 mt-2 mb-2 bg-[#0A0F14]/50 group relative">
                            {/* Image Container */}
                            <div className="relative">
                                <img
                                    src={segment.url}
                                    alt={segment.alt || 'Generated Image'}
                                    className="w-full h-auto object-contain max-h-[400px] cursor-pointer transition-opacity hover:opacity-90"
                                    onClick={() => {
                                        if (onImageClick) {
                                            onImageClick(segment.url!, segment.alt);
                                        } else {
                                            setExpandedImage(segment.url!);
                                        }
                                    }}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMxQTFGMjYiLz48cGF0aCBkPSJNMjAwIDE1MEwxNzAgMTgwTDIzMCAxODBMMjAwIDE1MFoiIGZpbGw9IiMzMzMiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxMjAiIHI9IjIwIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iMjAwIiB5PSIyNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCI+SW1hZ2UgY291bGQgbm90IGJlIGxvYWRlZDwvdGV4dD48L3N2Zz4=';
                                    }}
                                />

                                {/* Overlay Controls */}
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => window.open(segment.url, '_blank')}
                                        className="p-2 bg-[#0A0F14]/80 rounded border border-[#00E5FF]/30 hover:bg-[#00E5FF]/20 transition-colors"
                                        title="Open in new tab"
                                    >
                                        <ExternalLink size={14} className="text-[#00E5FF]" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const a = document.createElement('a');
                                            a.href = segment.url!;
                                            a.download = 'zavio-image.png';
                                            a.click();
                                        }}
                                        className="p-2 bg-[#0A0F14]/80 rounded border border-[#00E5FF]/30 hover:bg-[#00E5FF]/20 transition-colors"
                                        title="Download"
                                    >
                                        <Download size={14} className="text-[#00E5FF]" />
                                    </button>
                                    <button
                                        onClick={() => setExpandedImage(segment.url!)}
                                        className="p-2 bg-[#0A0F14]/80 rounded border border-[#00E5FF]/30 hover:bg-[#00E5FF]/20 transition-colors"
                                        title="Expand"
                                    >
                                        <ZoomIn size={14} className="text-[#00E5FF]" />
                                    </button>
                                </div>
                            </div>

                            {/* Caption */}
                            {segment.alt && (
                                <div className="p-2 bg-[#0D1117] border-t border-[#00E5FF]/20">
                                    <p className="text-[10px] text-[#78909C] text-center">{segment.alt}</p>
                                </div>
                            )}
                        </div>
                    );
                } else if (segment.type === 'code') {
                    return (
                        <div key={index} className="rounded-lg overflow-hidden border border-[#00E5FF]/30 bg-[#0A0F14]">
                            {/* Terminal Header */}
                            <div className="flex items-center justify-between px-4 py-2 bg-[#1A1F26] border-b border-[#00E5FF]/20">
                                <div className="flex items-center gap-2">
                                    <Terminal size={14} className="text-[#00E5FF]" />
                                    <span className="text-xs text-[#00E5FF] uppercase tracking-wider font-mono">
                                        {segment.language}
                                    </span>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(segment.content, index)}
                                    className="flex items-center gap-1 text-xs text-[#546E7A] hover:text-[#00E5FF] transition-colors"
                                >
                                    {copiedIndex === index ? (
                                        <>
                                            <Check size={14} className="text-[#4CAF50]" />
                                            <span className="text-[#4CAF50]">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            {/* Code Content */}
                            <div className="p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
                                <pre className="text-sm font-mono text-[#E0E0E0] whitespace-pre-wrap select-text">
                                    <code>{segment.content}</code>
                                </pre>
                            </div>
                        </div>
                    );
                } else {
                    // Render text with basic formatting
                    return (
                        <div key={index} className="text-[#E0E0E0] leading-relaxed select-text">
                            {segment.content.split('\n').map((line, lineIndex) => {
                                // Handle inline code
                                const parts = line.split(/`([^`]+)`/g);

                                // Check for headers
                                if (line.startsWith('### ')) {
                                    return <h3 key={lineIndex} className="text-lg font-bold text-[#00E5FF] mt-3 mb-2">{line.slice(4)}</h3>;
                                }
                                if (line.startsWith('## ')) {
                                    return <h2 key={lineIndex} className="text-xl font-bold text-[#00E5FF] mt-4 mb-2">{line.slice(3)}</h2>;
                                }
                                if (line.startsWith('# ')) {
                                    return <h1 key={lineIndex} className="text-2xl font-bold text-[#00E5FF] mt-4 mb-3">{line.slice(2)}</h1>;
                                }

                                // Check for bullet points
                                if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                                    return (
                                        <p key={lineIndex} className="mb-1 pl-4 flex">
                                            <span className="text-[#00E5FF] mr-2">•</span>
                                            <span dangerouslySetInnerHTML={{ __html: formatText(line.trim().slice(2)) }} />
                                        </p>
                                    );
                                }

                                // Check for numbered lists
                                const numberedMatch = line.trim().match(/^(\d+)\.\s/);
                                if (numberedMatch) {
                                    return (
                                        <p key={lineIndex} className="mb-1 pl-4 flex">
                                            <span className="text-[#FF9100] mr-2 font-bold">{numberedMatch[1]}.</span>
                                            <span dangerouslySetInnerHTML={{ __html: formatText(line.trim().slice(numberedMatch[0].length)) }} />
                                        </p>
                                    );
                                }

                                return (
                                    <p key={lineIndex} className={line.trim() === '' ? 'h-2' : 'mb-2'}>
                                        {parts.map((part, partIndex) => {
                                            if (partIndex % 2 === 1) {
                                                // Inline code
                                                return (
                                                    <code
                                                        key={partIndex}
                                                        className="px-1.5 py-0.5 bg-[#00E5FF]/10 text-[#00E5FF] rounded text-sm font-mono select-all cursor-pointer"
                                                        onClick={() => copyToClipboard(part, index * 1000 + partIndex)}
                                                    >
                                                        {part}
                                                    </code>
                                                );
                                            }
                                            // Handle bold text
                                            return <span key={partIndex} dangerouslySetInnerHTML={{ __html: formatText(part) }} />;
                                        })}
                                    </p>
                                );
                            })}
                        </div>
                    );
                }
            })}

            {/* Expanded Image Modal */}
            {expandedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
                    onClick={() => setExpandedImage(null)}
                >
                    <img
                        src={expandedImage}
                        alt="Expanded view"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                    <button
                        onClick={() => setExpandedImage(null)}
                        className="absolute top-4 right-4 p-2 bg-[#FF5252] rounded-full text-white hover:bg-[#FF7070]"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
};

export default MarkdownRenderer;
