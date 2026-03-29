'use client';

import { Session } from '../types/chat';

interface Props {
  sessions: Session[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function SessionSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onNew,
  onDelete,
  collapsed,
  onToggle,
}: Props) {
  return (
    <>
      {/* Mobile toggle button — visible only when sidebar is collapsed on small screens */}
      <button
        onClick={onToggle}
        className="fixed top-3 left-3 z-30 rounded-lg bg-white border border-gray-200 p-2 shadow-sm md:hidden"
        aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
      >
        <svg
          className="h-5 w-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {collapsed ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? '-translate-x-full' : 'translate-x-0'
        } fixed inset-y-0 left-0 z-20 w-64 transform bg-gray-900 text-gray-100 transition-transform duration-200 md:relative md:translate-x-0 flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
          <span className="text-sm font-semibold tracking-wide uppercase text-gray-400">
            Sessions
          </span>
          <button
            onClick={onToggle}
            className="rounded p-1 text-gray-400 hover:text-gray-100 md:hidden"
            aria-label="Close sidebar"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* New Chat button */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={onNew}
            className="w-full flex items-center gap-2 rounded-lg border border-gray-600 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Chat
          </button>
        </div>

        {/* Session list */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {sessions.length === 0 && (
            <p className="px-3 py-4 text-xs text-gray-500 text-center">
              No sessions yet.
              <br />
              Send a message to start.
            </p>
          )}
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                session.id === activeSessionId
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              onClick={() => onSelect(session.id)}
            >
              <span className="truncate">{session.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
                className="shrink-0 ml-2 rounded p-0.5 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                aria-label={`Delete ${session.name}`}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </nav>
      </aside>

      {/* Backdrop overlay for mobile when sidebar is open */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-10 bg-black/30 md:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
