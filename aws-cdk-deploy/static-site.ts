#!/usr/bin/env node
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as iam from "@aws-cdk/aws-iam";
import { Construct, Stack } from "@aws-cdk/core";

export class StaticSite extends Construct {
  constructor(parent: Stack, name: string) {
    super(parent, name);

    const destinationBucket = new s3.Bucket(this, "JSCCStaticBucket", {
      bucketName: "task2-autodeploy-with-cdk-osob",
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, "JSCC-OAI");

    destinationBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["S3:GetObject"],
        resources: [destinationBucket.arnForObjects("/*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "JSCC-Distribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: destinationBucket,
              originAccessIdentity: cloudfrontOAI,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
              },
            ],
          },
        ],
      }
    );

    new s3deploy.BucketDeployment(this, "JSCC-Bucket-Deployment", {
      sources: [s3deploy.Source.asset("../dist")],
      destinationBucket,
      distribution,
      distributionPaths: ["/*"],
    });
  }
}
