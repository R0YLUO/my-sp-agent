import { NextRequest } from 'next/server';

const AGENT_URL = process.env.AGENT_URL ?? 'http://localhost:8080';

/** GET /api/sessions — list all sessions from the backend */
export async function GET() {
  const res = await fetch(`${AGENT_URL}/sessions`);
  const data = await res.json();
  return Response.json(data);
}

/** POST /api/sessions — create a new session on the backend */
export async function POST(_req: NextRequest) {
  const res = await fetch(`${AGENT_URL}/sessions`, { method: 'POST' });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
