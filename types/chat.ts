export type Role = 'user' | 'assistant';

// --- Session ---

export interface Session {
  id: string;
  name: string;
}

// --- Streaming event types (from API route to client) ---

export interface ReasoningEvent {
  type: 'reasoning';
  content: string;
}

export interface TextEvent {
  type: 'text';
  content: string;
}

export interface ToolStartEvent {
  type: 'tool_start';
  tool: string;
  input: Record<string, unknown>;
}

export type StreamEvent = ReasoningEvent | TextEvent | ToolStartEvent;

// --- Thinking step (accumulated in the UI) ---

export type ThinkingStepKind = 'reasoning' | 'tool';

export interface ThinkingStep {
  id: string;
  kind: ThinkingStepKind;
  content: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
}

// --- Message ---

export interface Message {
  id: string;
  role: Role;
  content: string;
  isStreaming?: boolean;
  thinkingSteps?: ThinkingStep[];
}
