export type Role = 'user' | 'assistant';

// --- Session ---

export interface Session {
  id: string;
  name: string;
}

// --- Streaming event types (from API route to client) ---

export interface TextEvent {
  type: 'text';
  content: string;
}

export interface ToolStartEvent {
  type: 'tool_start';
  tool: string;
  input: Record<string, unknown>;
}

export interface CycleStartEvent {
  type: 'cycle_start';
}

export interface CycleEndEvent {
  type: 'cycle_end';
}

export type StreamEvent =
  | TextEvent
  | ToolStartEvent
  | CycleStartEvent
  | CycleEndEvent;

// --- Tool indicator (for display in working block) ---

export interface ToolIndicator {
  tool: string;
}

// --- Message ---

export interface Message {
  id: string;
  role: Role;
  content: string;
  isStreaming?: boolean;
  activeTools?: ToolIndicator[];
  isWorking?: boolean;
}

// --- Farm details ---

export interface FarmDetails {
  location: string;
  pasture_type: string;
  grazing_area_hectares: number;
  livestock_head_count: number;
  livestock_breed: string;
  livestock_class: string;
  livestock_avg_weight_kg: number;
  seasonal_condition_decile: number;
  month: string;
}
