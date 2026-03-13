import { BedrockAgentRuntimeClient } from '@aws-sdk/client-bedrock-agent-runtime';

let client: BedrockAgentRuntimeClient | null = null;

export function getBedrockClient(): BedrockAgentRuntimeClient {
  if (!client) {
    client = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
    });
  }
  return client;
}
