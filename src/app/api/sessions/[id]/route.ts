import { NextRequest } from 'next/server';

const AGENT_URL = process.env.AGENT_URL ?? 'http://localhost:8080';

/** DELETE /api/sessions/:id — delete a session on the backend */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const res = await fetch(`${AGENT_URL}/sessions/${params.id}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
