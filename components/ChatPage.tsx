'use client';

import { useState, useCallback, useRef } from 'react';
import { Message, StreamEvent, ToolIndicator } from '../types/chat';
import { useSession } from '../hooks/useSession';
import { useFarmDetails } from '../hooks/useFarmDetails';
import SessionSidebar from './SessionSidebar';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import FarmDetailsDrawer from './FarmDetailsDrawer';

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
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
  const [farmDrawerOpen, setFarmDrawerOpen] = useState(false);

  const {
    farmDetails,
    loading: farmLoading,
    saving: farmSaving,
    error: farmError,
    updateFarmDetails,
  } = useFarmDetails();

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
        isWorking: false,
        activeTools: [],
      };

      updateMessages(sessionId, (prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      // Capture the sessionId for the rest of this async flow
      const currentSessionId = sessionId;

      // --- LOCAL cycle tracking state (not React state) ---
      let currentContent = '';
      let currentTools: ToolIndicator[] = [];
      let cycleEnded = false;
      let cycleCount = 0;
      let pendingClear = false; // true = defer clearing old content until new text/tool arrives

      // Helper: push current local state → React state
      const flushToReact = (overrides: Partial<Message> = {}) => {
        updateMessages(currentSessionId, (prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: currentContent,
                  activeTools: [...currentTools],
                  ...overrides,
                }
              : m
          )
        );
      };

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
              case 'cycle_start': {
                cycleCount++;

                if (cycleEnded) {
                  // Defer clearing until the new cycle actually produces content,
                  // so the previous cycle's text stays visible as long as possible.
                  pendingClear = true;
                  cycleEnded = false;
                }
                // else: first cycle, nothing to clear

                // Only show working indicator for multi-cycle responses (cycleCount > 1)
                flushToReact({ isWorking: cycleCount > 1 });
                break;
              }

              case 'text': {
                if (pendingClear) {
                  currentContent = '';
                  currentTools = [];
                  pendingClear = false;
                }
                currentContent += event.content;
                // Flush on every text chunk so the user sees streaming
                flushToReact({ isWorking: cycleCount > 1 });
                break;
              }

              case 'tool_start': {
                if (pendingClear) {
                  currentContent = '';
                  currentTools = [];
                  pendingClear = false;
                }
                currentTools.push({ tool: event.tool });
                // Tools always imply working state
                flushToReact({ isWorking: true });
                break;
              }

              case 'cycle_end': {
                cycleEnded = true;
                // Don't clear content yet — wait for next cycle_start or stream close
                flushToReact();
                break;
              }
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          if (!currentContent) {
            currentContent = 'Error: failed to get a response.';
          }
        }
      } finally {
        // --- Stream closed: commit final message ---
        // currentContent was never cleared because no cycle_start followed
        // the last cycle_end. This IS the final answer — persist it.
        updateMessages(currentSessionId, (prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: currentContent,
                  isStreaming: false,
                  isWorking: false,
                  activeTools: [],
                }
              : m
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
          {/* My Farm Details button — pushed to the right */}
          <button
            onClick={() => setFarmDrawerOpen(true)}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"
              />
            </svg>
            <span className="hidden sm:inline">My Farm Details</span>
          </button>
        </header>
        <div className="flex flex-col flex-1 max-w-3xl w-full mx-auto overflow-hidden">
          <MessageList messages={messages} />
          <ChatInput onSend={sendMessage} disabled={isStreaming} />
        </div>
      </div>
      {/* Farm details drawer */}
      <FarmDetailsDrawer
        open={farmDrawerOpen}
        onClose={() => setFarmDrawerOpen(false)}
        farmDetails={farmDetails}
        loading={farmLoading}
        saving={farmSaving}
        error={farmError}
        onSave={updateFarmDetails}
      />
    </div>
  );
}
