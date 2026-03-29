'use client';

import { useCallback, useEffect, useState } from 'react';
import { Session } from '../types/chat';

export interface UseSessionReturn {
  /** All known sessions (fetched from backend). */
  sessions: Session[];
  /** Currently active session id (null = no session yet). */
  activeSessionId: string | null;
  /** True while the initial session list is loading. */
  loading: boolean;
  /** Create a new session on the backend, add it to the list, and make it active. */
  createSession: () => Promise<Session>;
  /** Switch to an existing session. */
  switchSession: (id: string) => void;
  /** Delete a session on the backend and remove it from the list. */
  deleteSession: (id: string) => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch existing sessions from the backend on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) {
          const data: Session[] = await res.json();
          if (!cancelled) {
            setSessions(data);
            // Auto-select the first session if any exist
            if (data.length > 0) {
              setActiveSessionId(data[0].id);
            }
          }
        }
      } catch {
        // Backend may not be reachable yet — not fatal
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const createSession = useCallback(async (): Promise<Session> => {
    const res = await fetch('/api/sessions', { method: 'POST' });
    const session: Session = await res.json();
    setSessions((prev) => [...prev, session]);
    setActiveSessionId(session.id);
    return session;
  }, []);

  const switchSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const deleteSession = useCallback(
    async (id: string) => {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        // If the deleted session was active, switch to the first remaining (or null)
        if (activeSessionId === id) {
          setActiveSessionId(next.length > 0 ? next[0].id : null);
        }
        return next;
      });
    },
    [activeSessionId]
  );

  return {
    sessions,
    activeSessionId,
    loading,
    createSession,
    switchSession,
    deleteSession,
  };
}
