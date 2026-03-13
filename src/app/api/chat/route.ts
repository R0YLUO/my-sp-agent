import { NextRequest } from 'next/server';
import { InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { getBedrockClient } from '@/lib/bedrock';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { message, sessionId } = await req.json();

  const agentId = process.env.BEDROCK_AGENT_ID;
  const agentAliasId = process.env.BEDROCK_AGENT_ALIAS_ID;

  if (!agentId || !agentAliasId) {
    return new Response('BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID must be set', {
      status: 500,
    });
  }

  if (!message || !sessionId) {
    return new Response('message and sessionId are required', { status: 400 });
  }

  const client = getBedrockClient();

  const command = new InvokeAgentCommand({
    agentId,
    agentAliasId,
    sessionId,
    inputText: message,
  });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.send(command);
        if (!response.completion) {
          controller.close();
          return;
        }
        for await (const event of response.completion) {
          const bytes = event.chunk?.bytes;
          if (bytes) {
            controller.enqueue(bytes);
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
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
