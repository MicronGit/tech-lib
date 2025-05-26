import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { execSync } from 'child_process';
import { Construct } from 'constructs';
import * as fs from 'fs-extra';
import * as path from 'path';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    // ap-northeast-1 (Tokyo) リージョンを指定
    super(scope, id, {
      ...props,
      env: { region: 'ap-northeast-1' },
    });

    // フロントエンドのビルド（GitHub ActionsとローカルCDKデプロイの両方で一元化）
    this.buildFrontend();

    // GitHub ActionsのデプロイロールをCDKで作成
    const githubOidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOidcProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
      thumbprints: ['6938fd4d98bab03faadb97b34396831e3780aea1'], // GitHub OIDCプロバイダーのサムプリント（2025年5月時点）
    });

    // デプロイ用のIAMロールを作成
    const deploymentRole = new iam.Role(this, 'GitHubActionsDeploymentRole', {
      assumedBy: new iam.WebIdentityPrincipal(githubOidcProvider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          // GitHub組織またはユーザー名とリポジトリ名を指定（例：MicronGit/tech-lib）
          'token.actions.githubusercontent.com:sub': 'repo:MicronGit/tech-lib:*',
        },
      }),
      description: 'Role assumed by GitHub Actions for deploying tech-lib application',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudFrontFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonAPIGatewayAdministrator'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess'), // CDKブートストラップバージョン確認用のSSMパラメータアクセス権限
        iam.ManagedPolicy.fromAwsManagedPolicyName('IAMFullAccess'), // IAMのフルアクセス権限
      ],
    });

    // ARNをCloudFormationの出力値として定義（GitHubのシークレットに設定しやすくするため）
    new cdk.CfnOutput(this, 'GitHubActionsRoleArn', {
      value: deploymentRole.roleArn,
      description: 'ARN of the IAM role for GitHub Actions deployment',
      exportName: 'GitHubActionsRoleArn',
    });

    // ウェブアプリケーションのホスティング用S3バケットを作成
    const websiteBucket = new s3.Bucket(this, 'TechLibWebsiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発用設定: スタック削除時にバケットも削除
      autoDeleteObjects: true, // 開発用設定: バケット削除時にオブジェクトも削除
    });

    // CloudFrontディストリビューションを作成
    const distribution = new cloudfront.Distribution(this, 'TechLibDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        // S3BucketOrigin.withOriginAccessControlを使用して簡潔に OAC を設定
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
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

    // バケットポリシーは自動的に設定されるため、明示的な設定は不要

    // Lambda Layer の作成
    const apiLayer = new lambda.LayerVersion(this, 'TechLibApiLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../api/layer')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_22_X],
      description: 'Layer containing node modules for Tech Lib API',
    });

    // バックエンドAPIのLambda関数を作成（NodejsFunctionを使用）
    const apiFunction = new NodejsFunction(this, 'TechLibApiFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler', // index.ts内のexport const handler関数を指定
      entry: path.join(__dirname, '../../api/src/getBooks/index.ts'),
      // Lambda Layer を追加
      layers: [apiLayer],
      // ローカルのesbuildを使用するための設定を追加
      bundling: {
        target: 'node22',
        externalModules: [
          'aws-sdk',
          '@aws-sdk/*',
          // Lambda Layer で提供される依存関係も外部モジュールとして指定
          '@aws-sdk/client-secrets-manager',
        ],
        nodeModules: [], // 必要なモジュールがあれば追加
        forceDockerBundling: false, // Dockerを使用せずにビルド
      },
      environment: {
        // 必要な環境変数を定義
        STAGE: 'dev',
        // データベースURLを設定
        DATABASE_URL: process.env.DATABASE_URL || '',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
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

    // GET /books - 図書一覧を取得する
    booksResource.addMethod('GET', new apigateway.LambdaIntegration(apiFunction));

    // POST /books - 図書を登録する
    booksResource.addMethod('POST', new apigateway.LambdaIntegration(apiFunction));

    // 以下のAPIエンドポイントは現時点では不要なためコメントアウト
    // // GET /books/{id}
    // const bookResource = booksResource.addResource('{id}');
    // bookResource.addMethod('GET', new apigateway.LambdaIntegration(apiFunction));
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

    // バケット名を出力値として追加（トラブルシューティングやローカルツール用）
    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      description: 'The name of the S3 bucket hosting the website',
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

  /**
   * フロントエンドアプリケーションをビルドする
   * ローカルとCI/CD環境の両方でシームレスに動作するように設計
   */
  private buildFrontend(): void {
    const appDir = path.join(__dirname, '../../app');
    const distDir = path.join(appDir, 'dist');
    const packageLockFile = path.join(appDir, 'package-lock.json');

    console.log('📦 フロントエンドアプリケーションを準備しています...');

    // distディレクトリが存在するか確認
    const distExists = fs.existsSync(distDir);

    try {
      // distディレクトリが存在しない場合はビルドを実行
      if (!distExists) {
        console.log('🔨 フロントエンドビルドを開始します...');

        // package-lock.jsonが存在する場合はci、なければinstallを使用
        const installCmd = fs.existsSync(packageLockFile) ? 'ci' : 'install';

        // 依存関係のインストール
        console.log(`📥 依存関係をインストール中... (npm ${installCmd})`);
        execSync(`npm ${installCmd}`, {
          cwd: appDir,
          stdio: 'inherit',
        });

        // ビルド実行
        console.log('🏗️ フロントエンドをビルド中... (npm run build)');
        execSync('npm run build', {
          cwd: appDir,
          stdio: 'inherit',
        });

        console.log('✅ フロントエンドのビルドが完了しました');
      } else {
        console.log('ℹ️ フロントエンドのビルドは既に存在します。ビルドをスキップします。');
      }

      // ビルド結果の確認
      if (!fs.existsSync(distDir) || fs.readdirSync(distDir).length === 0) {
        throw new Error(
          'ビルドディレクトリが空か存在しません。フロントエンドのビルドに問題がある可能性があります。'
        );
      }
    } catch (error) {
      console.error('❌ フロントエンドのビルド中にエラーが発生しました:', error);
      throw new Error('フロントエンドのビルドに失敗しました。インフラデプロイを中止します。');
    }
  }
}
