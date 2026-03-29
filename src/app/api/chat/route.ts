import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const AGENT_URL = process.env.AGENT_URL ?? 'http://localhost:8080';

export async function POST(req: NextRequest) {
  const { message, sessionId } = await req.json();

  if (!message || !sessionId) {
    return new Response('message and sessionId are required', { status: 400 });
  }

  // Call the local Strands agent
  const agentRes = await fetch(`${AGENT_URL}/invocations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Amzn-Bedrock-AgentCore-Runtime-Session-Id': sessionId,
    },
    body: JSON.stringify({ prompt: message }),
  });

  if (!agentRes.ok || !agentRes.body) {
    return new Response(`Agent error: ${agentRes.status}`, { status: 502 });
  }

  // The agent returns SSE (data: "..."\n\n). Parse it and forward as NDJSON.
  const reader = agentRes.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events from the buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? ''; // keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            const payload = line.slice(6).trim();
            if (!payload) continue;

            // [DONE] sentinel — pass through
            if (payload === '[DONE]') {
              controller.enqueue(encoder.encode('[DONE]\n'));
              continue;
            }

            try {
              const parsed = JSON.parse(payload);

              // Typed JSON events from the updated Python server
              if (parsed && typeof parsed === 'object' && parsed.type) {
                controller.enqueue(
                  encoder.encode(JSON.stringify(parsed) + '\n')
                );
              }
              // Legacy fallback: bare string (old server format)
              else if (typeof parsed === 'string') {
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({ type: 'text', content: parsed }) + '\n'
                  )
                );
              }
              // Error from agent
              else if (parsed.error) {
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      type: 'text',
                      content: `\n[Error: ${parsed.error}]`,
                    }) + '\n'
                  )
                );
              }
            } catch {
              // Not valid JSON, skip
            }
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
  });
}
