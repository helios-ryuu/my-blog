"use client";

import { useState, useRef } from "react";
import { Clipboard, Check } from "lucide-react";

interface CodeBlockProps {
    children: React.ReactNode;
    className?: string;
    "data-language"?: string;
}

export default function CodeBlock({ children, className, ...props }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const preRef = useRef<HTMLPreElement>(null);

    // Extract language from data attribute or className
    const language = props["data-language"] ||
        className?.match(/language-(\w+)/)?.[1] ||
        'code';

    const handleCopy = async () => {
        const text = preRef.current?.textContent || '';

        try {
            // Modern clipboard API (not available on all iOS browsers in non-HTTPS)
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback: create temporary textarea and copy
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                textarea.style.top = '-9999px';
                textarea.style.opacity = '0';
                textarea.style.pointerEvents = 'none';
                textarea.style.fontSize = '16px'; // Prevent iOS zoom
                textarea.setAttribute('readonly', ''); // Prevent keyboard on iOS
                document.body.appendChild(textarea);
                textarea.select();
                textarea.setSelectionRange(0, textarea.value.length); // For iOS
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="my-4 rounded-md border border-(--code-block-border) overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pl-4 pr-3 py-1 bg-(--code-block) border-b border-(--code-block-border)">
                <span className="mt-0.5 text-xs text-gray-400 font-mono">
                    {language}
                </span>
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 cursor-pointer"
                    title="Copy to clipboard"
                >
                    {copied ? (
                        <Check className="w-4 h-4 text-accent" />
                    ) : (
                        <Clipboard className="w-4 h-4" strokeWidth={2.5} />
                    )}
                </button>
            </div>
            {/* Code content */}
            <pre
                ref={preRef}
                className={`text-sm bg-(--code-block) text-gray-100 py-2 px-4 overflow-x-auto m-0 rounded-none border-0 [&>code]:p-0 [&>code]:bg-transparent ${className || ''}`}
                style={{ fontFamily: 'var(--font-fira-code), monospace' }}
            >
                {children}
            </pre>
        </div>
    );
}
