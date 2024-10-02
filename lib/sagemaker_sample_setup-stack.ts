import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sagemaker from '@aws-cdk/aws-sagemaker-alpha';

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

    const destBucket = new s3.Bucket(this, 'dest_bucket', {
      bucketName: 'sagemaker-sample-workshop-dest-bucket',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
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

    const image = sagemaker.ContainerImage.fromAsset(path.join('docker', 'model'));
    const modelData = sagemaker.ModelData.fromAsset(path.join('data', 'model', 'sample_data.tar.gz'));

    const model = new sagemaker.Model(this, 'model', {
      vpc: vpc,
      vpcSubnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }),
      modelName: 'sagemaker-sample-workshop-model',
      containers: [
        {
          image: image,
          modelData: modelData,
        }
      ]
    });
  }
}







