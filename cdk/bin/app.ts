#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BedrockAgentAppStack } from '../lib/stack';

const app = new cdk.App();

new BedrockAgentAppStack(app, 'BedrockAgentAppStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'ap-southeast-2',
  },
});
