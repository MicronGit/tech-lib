import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { BedrockClientService } from './bedrock-client';

// Claude 3.5 Sonnetモデルの設定情報
const CLAUDE_MODEL_ID = 'anthropic.claude-3-5-sonnet-20240620-v1:0';
const ANTHROPIC_VERSION = 'bedrock-2023-05-31';

/**
 * Claude AIモデルのリクエスト設定インターフェース
 */
interface ClaudeRequestOptions {
  max_tokens?: number;
  temperature?: number;
  top_k?: number;
  top_p?: number;
  stop_sequences?: string[];
}

/**
 * Claude AIモデルとの通信を行うサービス
 */
export class ClaudeService {
  /**
   * Claude AIモデルにプロンプトを送信し、レスポンスを取得する
   *
   * @param prompt テキストプロンプト
   * @param options リクエスト設定オプション
   * @returns 生成されたテキスト
   */
  public static async generateText(
    prompt: string,
    options: ClaudeRequestOptions = {}
  ): Promise<string> {
    try {
      const client = BedrockClientService.getClient();

      // デフォルト設定とマージ
      const requestOptions: ClaudeRequestOptions = {
        max_tokens: 300,
        temperature: 0.7,
        top_k: 250,
        top_p: 0.999,
        stop_sequences: ['\n\nHuman:'],
        ...options,
      };

      // リクエストペイロードの構築
      const payload = {
        anthropic_version: ANTHROPIC_VERSION,
        ...requestOptions,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      };

      // モデル呼び出しコマンドの作成と実行
      const command = new InvokeModelCommand({
        modelId: CLAUDE_MODEL_ID,
        body: JSON.stringify(payload),
      });

      const response = await client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      return this.parseClaudeResponse(responseBody);
    } catch (error) {
      this.logError('Error generating text with Claude service', error);
      throw error;
    }
  }

  /**
   * Claude AIモデルのレスポンスを解析してテキストを抽出する
   *
   * @param responseBody レスポンスボディ
   * @returns 抽出されたテキスト
   */
  private static parseClaudeResponse(responseBody: any): string {
    // content配列からテキスト部分を抽出
    if (responseBody.content && Array.isArray(responseBody.content)) {
      return responseBody.content
        .filter((item: any) => item.type === 'text')
        .map((item: any) => item.text)
        .join(' ')
        .trim();
    }

    // 古い形式の場合
    if (responseBody.completion) {
      return responseBody.completion.trim();
    }

    // 別の形式の場合
    if (responseBody.content?.[0]?.text) {
      return responseBody.content[0].text.trim();
    }

    // 対応するフォーマットがない場合は空文字を返す
    return '';
  }

  /**
   * エラーを詳細にログに記録する
   *
   * @param message エラーメッセージ
   * @param error エラーオブジェクト
   */
  private static logError(message: string, error: unknown): void {
    console.error(message, error);

    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
    }
  }
}
