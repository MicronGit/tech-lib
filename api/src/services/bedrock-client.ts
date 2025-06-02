import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

/**
 * AWS Bedrock クライアントのシングルトンインスタンスを提供するクラス
 */
export class BedrockClientService {
  private static instance: BedrockRuntimeClient;

  /**
   * BedrockRuntimeClient のインスタンスを取得する
   * @returns BedrockRuntimeClient インスタンス
   */
  public static getClient(): BedrockRuntimeClient {
    if (!this.instance) {
      this.instance = new BedrockRuntimeClient({
        region: process.env.AWS_REGION || 'ap-northeast-1',
      });
    }
    return this.instance;
  }
}
