'use client';

import { ThinkingStep } from '../types/chat';

interface Props {
  steps: ThinkingStep[];
  isStreaming: boolean;
}

export default function ThinkingSteps({ steps, isStreaming }: Props) {
  if (steps.length === 0) return null;

  return (
    <div
      className={`mb-3 space-y-1.5 border-l-2 pl-3 ${
        isStreaming ? 'border-blue-300' : 'border-gray-200'
      }`}
    >
      {steps.map((step) => (
        <div
          key={step.id}
          className="animate-fade-in-up flex items-start gap-1.5 text-xs leading-relaxed text-gray-400"
        >
          {/* Icon */}
          <span className="mt-0.5 shrink-0 select-none" aria-hidden="true">
            {step.kind === 'tool' ? '\uD83D\uDD27' : '\uD83E\uDDE0'}
          </span>

          {/* Content */}
          <span className="min-w-0 break-words">
            {step.kind === 'tool' ? (
              <>
                Using{' '}
                <span className="font-medium text-gray-500">
                  {step.toolName}
                </span>
                {step.toolInput &&
                  Object.keys(step.toolInput).length > 0 && (
                    <span className="text-gray-300">
                      {' '}
                      &mdash; {summariseInput(step.toolInput)}
                    </span>
                  )}
              </>
            ) : (
              step.content
            )}
          </span>
        </div>
      ))}

      {/* Streaming indicator: pulsing dots while thinking */}
      {isStreaming && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="mt-0.5 shrink-0 select-none" aria-hidden="true">
            {'\uD83D\uDCAD'}
          </span>
          <span className="flex items-center gap-1">
            Thinking
            <span className="flex gap-0.5">
              <span className="h-1 w-1 rounded-full bg-gray-300 animate-pulse" />
              <span className="h-1 w-1 rounded-full bg-gray-300 animate-pulse [animation-delay:150ms]" />
              <span className="h-1 w-1 rounded-full bg-gray-300 animate-pulse [animation-delay:300ms]" />
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Produce a short human-readable summary of tool input.
 * e.g. { symbol: "AAPL", period: "1y" } -> 'symbol: "AAPL", period: "1y"'
 * Truncated to 80 chars.
 */
function summariseInput(input: Record<string, unknown>): string {
  const parts = Object.entries(input).map(
    ([k, v]) => `${k}: ${JSON.stringify(v)}`
  );
  const full = parts.join(', ');
  return full.length > 80 ? full.slice(0, 77) + '\u2026' : full;
}
