'use client';

import { useState, useCallback, useRef } from 'react';
import { Message, ThinkingStep, StreamEvent } from '../types/chat';
import { useSession } from '../hooks/useSession';
import SessionSidebar from './SessionSidebar';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

let stepCounter = 0;
function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}
function generateStepId(): string {
  return `step-${++stepCounter}`;
}

export default function ChatPage() {
  const {
    sessions,
    activeSessionId,
    loading,
    createSession,
    switchSession,
    deleteSession,
  } = useSession();

  // Per-session messages stored client-side: { [sessionId]: Message[] }
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Ref to hold the latest activeSessionId for use inside async callbacks
  const activeSessionRef = useRef(activeSessionId);
  activeSessionRef.current = activeSessionId;

  const messages = activeSessionId ? messagesMap[activeSessionId] ?? [] : [];

  const updateMessages = useCallback(
    (sessionId: string, updater: (prev: Message[]) => Message[]) => {
      setMessagesMap((prev) => ({
        ...prev,
        [sessionId]: updater(prev[sessionId] ?? []),
      }));
    },
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming) return;

      // If there is no active session, create one first (ChatGPT-style)
      let sessionId = activeSessionRef.current;
      if (!sessionId) {
        const newSession = await createSession();
        sessionId = newSession.id;
      }

      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content: text,
      };
      const assistantId = generateId();
      const assistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        isStreaming: true,
        thinkingSteps: [],
      };

      updateMessages(sessionId, (prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      // Capture the sessionId for the rest of this async flow
      const currentSessionId = sessionId;

      const controller = new AbortController();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, sessionId: currentSessionId }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let ndjsonBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          ndjsonBuffer += decoder.decode(value, { stream: true });

          // Split NDJSON lines
          const lines = ndjsonBuffer.split('\n');
          ndjsonBuffer = lines.pop() ?? ''; // keep incomplete line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // [DONE] sentinel
            if (trimmed === '[DONE]') continue;

            let event: StreamEvent;
            try {
              event = JSON.parse(trimmed) as StreamEvent;
            } catch {
              continue; // malformed line, skip
            }

            // Dispatch based on event type
            switch (event.type) {
              case 'reasoning': {
                const step: ThinkingStep = {
                  id: generateStepId(),
                  kind: 'reasoning',
                  content: event.content,
                };
                updateMessages(currentSessionId, (prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          thinkingSteps: [...(m.thinkingSteps ?? []), step],
                        }
                      : m
                  )
                );
                break;
              }

              case 'tool_start': {
                const step: ThinkingStep = {
                  id: generateStepId(),
                  kind: 'tool',
                  content: `Using ${event.tool}`,
                  toolName: event.tool,
                  toolInput: event.input,
                };
                updateMessages(currentSessionId, (prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          thinkingSteps: [...(m.thinkingSteps ?? []), step],
                        }
                      : m
                  )
                );
                break;
              }

              case 'text': {
                updateMessages(currentSessionId, (prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + event.content }
                      : m
                  )
                );
                break;
              }
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          updateMessages(currentSessionId, (prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: 'Error: failed to get a response.',
                    isStreaming: false,
                  }
                : m
            )
          );
        }
      } finally {
        updateMessages(currentSessionId, (prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        );
        setIsStreaming(false);
      }
    },
    [isStreaming, createSession, updateMessages]
  );

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await deleteSession(id);
      // Also clear local messages for that session
      setMessagesMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [deleteSession]
  );

  const handleNewChat = useCallback(async () => {
    await createSession();
  }, [createSession]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Session sidebar */}
      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelect={switchSession}
        onNew={handleNewChat}
        onDelete={handleDeleteSession}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="shrink-0 bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
            aria-label="Toggle sidebar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            My Stock Planner Agent
          </h1>
          {activeSessionId && sessions.length > 0 && (
            <span className="text-sm text-gray-400">
              &mdash;{' '}
              {sessions.find((s) => s.id === activeSessionId)?.name ?? ''}
            </span>
          )}
        </header>
        <div className="flex flex-col flex-1 max-w-3xl w-full mx-auto overflow-hidden">
          <MessageList messages={messages} />
          <ChatInput onSend={sendMessage} disabled={isStreaming} />
        </div>
      </div>
    </div>
  );
}
