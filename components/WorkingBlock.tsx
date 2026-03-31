'use client';

import ToolIndicatorComponent from './ToolIndicator';
import type { ToolIndicator } from '../types/chat';

interface WorkingBlockProps {
  content: string;
  activeTools: ToolIndicator[];
  isWorking: boolean;
}

export default function WorkingBlock({
  content,
  activeTools,
  isWorking,
}: WorkingBlockProps) {
  if (!isWorking && !content && activeTools.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 animate-fade-in-up border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500">
        <span>Working</span>
        {isWorking && (
          <span className="flex gap-0.5 ml-0.5">
            <span className="h-1 w-1 rounded-full bg-gray-300 animate-pulse" />
            <span className="h-1 w-1 rounded-full bg-gray-300 animate-pulse [animation-delay:150ms]" />
            <span className="h-1 w-1 rounded-full bg-gray-300 animate-pulse [animation-delay:300ms]" />
          </span>
        )}
      </div>

      {/* Body — tool indicators + intermediate text */}
      <div className="px-3 py-2 space-y-2">
        {/* Tool pills */}
        {activeTools.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeTools.map((t, i) => (
              <ToolIndicatorComponent key={`${t.tool}-${i}`} tool={t.tool} />
            ))}
          </div>
        )}

        {/* Intermediate streaming text */}
        {content && (
          <div className="whitespace-pre-wrap text-xs leading-relaxed text-gray-400 italic">
            {content}
            {isWorking && (
              <span className="inline-block w-1 h-3.5 ml-0.5 bg-gray-400 align-middle animate-blink rounded-sm" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
