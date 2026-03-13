import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import * as path from 'path';

export class BedrockAgentAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const agentId =
      this.node.tryGetContext('agentId') ?? process.env.BEDROCK_AGENT_ID ?? '';
    const agentAliasId =
      this.node.tryGetContext('agentAliasId') ?? process.env.BEDROCK_AGENT_ALIAS_ID ?? '';

    // Build Docker image from project root and push to ECR
    const image = new DockerImageAsset(this, 'AppImage', {
      directory: path.join(__dirname, '../../'),
      platform: Platform.LINUX_AMD64,
    });

    // Role: allows App Runner to pull the image from ECR
    const accessRole = new iam.Role(this, 'AppRunnerECRAccessRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSAppRunnerServicePolicyForECRAccess'
        ),
      ],
    });

    // Role: allows App Runner instances to call Bedrock
    const instanceRole = new iam.Role(this, 'AppRunnerInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess'),
      ],
    });

    const service = new apprunner.CfnService(this, 'Service', {
      serviceName: 'bedrock-agent-app',
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: accessRole.roleArn,
        },
        imageRepository: {
          imageIdentifier: image.imageUri,
          imageRepositoryType: 'ECR',
          imageConfiguration: {
            port: '3000',
            runtimeEnvironmentVariables: [
              { name: 'BEDROCK_AGENT_ID', value: agentId },
              { name: 'BEDROCK_AGENT_ALIAS_ID', value: agentAliasId },
              { name: 'AWS_REGION', value: this.region },
            ],
          },
        },
      },
      instanceConfiguration: {
        cpu: '1024',
        memory: '2048',
        instanceRoleArn: instanceRole.roleArn,
      },
    });

    new cdk.CfnOutput(this, 'ServiceUrl', {
      value: `https://${service.attrServiceUrl}`,
      description: 'App Runner service URL',
    });
  }
}
