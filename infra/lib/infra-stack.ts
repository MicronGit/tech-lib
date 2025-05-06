import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ウェブアプリケーションのホスティング用S3バケットを作成
    const websiteBucket = new s3.Bucket(this, 'TechLibWebsiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発用設定: スタック削除時にバケットも削除
      autoDeleteObjects: true,                 // 開発用設定: バケット削除時にオブジェクトも削除
    });
    
    // CloudFront Originアクセスアイデンティティを作成
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'TechLibOriginAccessIdentity', {
      comment: 'Access to tech-lib website bucket',
    });
    
    // S3バケットに対するCloudFrontのアクセス権限を付与
    websiteBucket.grantRead(originAccessIdentity);
    
    // CloudFrontディストリビューションを作成
    const distribution = new cloudfront.Distribution(this, 'TechLibDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, { originAccessIdentity }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      // SPAのルーティング対応 - 404エラーの場合index.htmlにリダイレクト
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });
    
    // バックエンドAPIのLambda関数を作成
    const apiFunction = new lambda.Function(this, 'TechLibApiFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../api')), // apiフォルダはあとで作成
      environment: {
        // 必要な環境変数を定義
        STAGE: 'dev',
      },
    });
    
    // API Gatewayを作成してLambda関数と統合
    const api = new apigateway.RestApi(this, 'TechLibApi', {
      restApiName: 'Tech Lib API',
      description: 'This API serves the Tech Library application',
      deployOptions: {
        stageName: 'dev',
      },
      // CORS設定
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: true,
      },
    });
    
    // API Gatewayのルートリソースとメソッドを設定
    const booksResource = api.root.addResource('books');
    
    // GET /books - 図書一覧を取得するAPIのみを実装
    booksResource.addMethod('GET', new apigateway.LambdaIntegration(apiFunction));
    
    // 以下のAPIエンドポイントは現時点では不要なためコメントアウト
    // // GET /books/{id}
    // const bookResource = booksResource.addResource('{id}');
    // bookResource.addMethod('GET', new apigateway.LambdaIntegration(apiFunction));
    // 
    // // POST /books
    // booksResource.addMethod('POST', new apigateway.LambdaIntegration(apiFunction));
    // 
    // // PUT /books/{id}
    // bookResource.addMethod('PUT', new apigateway.LambdaIntegration(apiFunction));
    // 
    // // DELETE /books/{id}
    // bookResource.addMethod('DELETE', new apigateway.LambdaIntegration(apiFunction));
    
    // S3にウェブサイトのコンテンツをデプロイ
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../app/dist'))], // ビルドされたアプリのパス
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });
    
    // 出力を表示
    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'The URL of the CloudFront distribution',
    });
    
    new cdk.CfnOutput(this, 'ApiGatewayURL', {
      value: api.url,
      description: 'The URL of the API Gateway',
    });
  }
}
