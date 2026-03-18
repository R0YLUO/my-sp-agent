'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types/chat';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm whitespace-pre-wrap'
            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <div className="prose prose-sm prose-gray max-w-none prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-code:before:content-none prose-code:after:content-none prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        {message.isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-current align-middle animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  );
}
