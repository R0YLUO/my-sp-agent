# Bedrock Agent Chat

A ChatGPT-style web UI for an AWS Bedrock Agent. Built with Next.js 14, Tailwind CSS, and the AWS SDK. Deployable to AWS App Runner via Docker.

## Features

- Streaming responses from Bedrock Agent (token-by-token)
- Session persistence via `localStorage` (Bedrock native session IDs)
- No database required
- Docker + App Runner ready

## Quick Start (Local Dev)

```bash
cp .env.example .env.local
# Fill in BEDROCK_AGENT_ID, BEDROCK_AGENT_ALIAS_ID, AWS_REGION, and temporary AWS credentials
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker

```bash
docker build -t bedrock-agent-app .
docker run -p 3000:3000 \
  -e BEDROCK_AGENT_ID=<your-agent-id> \
  -e BEDROCK_AGENT_ALIAS_ID=<your-alias-id> \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=<key> \
  -e AWS_SECRET_ACCESS_KEY=<secret> \
  bedrock-agent-app
```

## AWS App Runner Deployment

1. **ECR**: Push Docker image to an ECR repository.
2. **IAM – ECR Access Role**: Trust `build.apprunner.amazonaws.com`, attach `AWSAppRunnerServicePolicyForECRAccess`.
3. **IAM – Instance Role**: Trust `tasks.apprunner.amazonaws.com`, allow `bedrock:InvokeAgent` on your agent alias ARN.
4. **App Runner**: Create service from ECR image, set env vars (`BEDROCK_AGENT_ID`, `BEDROCK_AGENT_ALIAS_ID`, `AWS_REGION`), attach both IAM roles.

App Runner handles TLS, health checks, and auto-scaling automatically. No AWS credentials needed in env — the instance role provides them.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `BEDROCK_AGENT_ID` | Yes | Bedrock Agent ID |
| `BEDROCK_AGENT_ALIAS_ID` | Yes | Bedrock Agent Alias ID |
| `AWS_REGION` | Yes | AWS region (e.g. `us-east-1`) |
| `AWS_ACCESS_KEY_ID` | Local dev only | AWS credentials (use IAM role on App Runner) |
| `AWS_SECRET_ACCESS_KEY` | Local dev only | AWS credentials (use IAM role on App Runner) |
