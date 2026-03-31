import { NextRequest } from 'next/server';

const AGENT_URL = process.env.AGENT_URL ?? 'http://localhost:8080';

/** GET /api/farm-details — fetch current farm details from backend */
export async function GET() {
  const res = await fetch(`${AGENT_URL}/farm-details`);
  const data = await res.json();
  return Response.json(data);
}

/** PUT /api/farm-details — update farm details on the backend */
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${AGENT_URL}/farm-details`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
