/**
 * StreamingText Component
 * 
 * Displays text with a typewriter effect for streaming responses.
 * Includes cursor animation and progressive reveal.
 */

import React, { useState, useEffect, useRef } from 'react';

interface StreamingTextProps {
    text: string;
    speed?: number; // ms per character
    className?: string;
    onComplete?: () => void;
    showCursor?: boolean;
}

const StreamingText: React.FC<StreamingTextProps> = ({
    text,
    speed = 20,
    className = '',
    onComplete,
    showCursor = true
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const indexRef = useRef(0);
    const previousTextRef = useRef('');

    useEffect(() => {
        // If new text is an extension of previous, continue from where we left off
        if (text.startsWith(previousTextRef.current)) {
            indexRef.current = previousTextRef.current.length;
        } else {
            // New text entirely, reset
            indexRef.current = 0;
            setDisplayedText('');
        }

        previousTextRef.current = text;
        setIsComplete(false);

        const interval = setInterval(() => {
            if (indexRef.current < text.length) {
                setDisplayedText(text.substring(0, indexRef.current + 1));
                indexRef.current++;
            } else {
                clearInterval(interval);
                setIsComplete(true);
                onComplete?.();
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed, onComplete]);

    return (
        <span className={className}>
            {displayedText}
            {showCursor && !isComplete && (
                <span className="inline-block w-2 h-4 bg-[#00E5FF] ml-0.5 animate-pulse" />
            )}
        </span>
    );
};

export default StreamingText;
