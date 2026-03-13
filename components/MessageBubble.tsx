'use client';

import { Message } from '../types/chat';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
        }`}
      >
        {message.content}
        {message.isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-current align-middle animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  );
}
