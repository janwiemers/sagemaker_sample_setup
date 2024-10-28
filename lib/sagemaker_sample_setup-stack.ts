import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';

import * as path from 'path';

export class SagemakerSampleSetupStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceBucket = new s3.Bucket(this, 'source_bucket', {
      bucketName: 'sagemaker-sample-workshop-source-bucket',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    new s3deployment.BucketDeployment(this, 'data_deployment', {
      sources: [s3deployment.Source.asset(path.join('notebooks'))],
      destinationBucket: sourceBucket,
      destinationKeyPrefix: ''
    });

    const notebookRole = new iam.Role(this, 'notebook_role', {
      roleName: 'sagemaker-sample-workshop-notebook-role',
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
      ]
    });

    const vpc = new ec2.Vpc(this, 'vpc', {
      vpcName: 'sagemaker-sample-workshop-vpc',
      subnetConfiguration: [{ subnetType: ec2.SubnetType.PUBLIC,
                              name: 'Public', },
                            { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                              name: 'Private', }],
      natGateways: 0,
      gatewayEndpoints: {
        S3: {
          service: ec2.GatewayVpcEndpointAwsService.S3,
        },
      },
      maxAzs: 1
    });

    const noteboook = new sagemaker.CfnNotebookInstance(this, 'notebook', {
      notebookInstanceName: 'sagemaker-sample-workshop-notebook',
      instanceType: 'ml.g4dn.12xlarge',
      roleArn: notebookRole.roleArn,
      securityGroupIds: [vpc.vpcDefaultSecurityGroup],
      subnetId: vpc.privateSubnets[0].subnetId,
      directInternetAccess: 'Enabled',
      rootAccess: 'Enabled',
      volumeSizeInGb: 100
    });

    

    // const model = new sagemaker.Model(this, 'model', {
    //   vpc: vpc,
    //   vpcSubnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }),
    //   modelName: 'sagemaker-sample-workshop-model',
    //   containers: [
    //     {
    //       image: image,
    //       modelData: modelData,
    //     }
    //   ]
    // });
  }
}







