'use client';

import { useState, useCallback } from 'react';
import { Message } from '../types/chat';
import { useSession } from '../hooks/useSession';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export default function ChatPage() {
  const sessionId = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId || isStreaming) return;

      const userMsg: Message = { id: generateId(), role: 'user', content: text };
      const assistantId = generateId();
      const assistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, sessionId }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            )
          );
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: 'Error: failed to get a response.', isStreaming: false }
                : m
            )
          );
        }
      } finally {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        );
        setIsStreaming(false);
      }
    },
    [sessionId, isStreaming]
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="shrink-0 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-800">My Stock Planner Agent</h1>
      </header>
      <div className="flex flex-col flex-1 max-w-3xl w-full mx-auto overflow-hidden">
        <MessageList messages={messages} />
        <ChatInput onSend={sendMessage} disabled={isStreaming || !sessionId} />
      </div>
    </div>
  );
}
