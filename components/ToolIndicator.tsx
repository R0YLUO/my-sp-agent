'use client';

interface ToolIndicatorProps {
  tool: string;
}

/** Converts snake_case tool names to Title Case for display. */
function formatToolName(tool: string): string {
  return tool
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ToolIndicator({ tool }: ToolIndicatorProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
      <span aria-hidden="true">&#128295;</span>
      <span>{formatToolName(tool)}</span>
    </span>
  );
}
