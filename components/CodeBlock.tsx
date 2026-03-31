'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
}

export default function CodeBlock({ className, children, ...rest }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // Detect language from className (react-markdown sets "language-xxx" for fenced blocks)
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  // Get raw text content
  const codeString = String(children).replace(/\n$/, '');

  // Determine if this is a fenced code block vs inline code
  const isBlock = !!language || codeString.includes('\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Inline code: simple styled <code> element
  if (!isBlock) {
    return (
      <code
        className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono break-all"
        {...rest}
      >
        {children}
      </code>
    );
  }

  // Fenced code block: header bar + syntax highlighter
  return (
    <div className="not-prose">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 text-xs text-gray-300">
        <span className="font-mono">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition-colors"
        >
          {copied ? (
            <>
              {/* Checkmark icon */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              {/* Clipboard icon */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.8125rem',
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}
