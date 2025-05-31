import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export interface SummaryInput {
  title: string;
  author: string;
  publisher: string;
  genre?: string;
}

/**
 * 書籍情報をもとにAI要約を生成する関数（Amazon Bedrock使用）
 */
export async function generateBookSummary(bookInfo: SummaryInput): Promise<string> {
  try {
    // Bedrockクライアントを初期化
    const bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'ap-northeast-1',
    });

    // 書籍情報からプロンプトを作成
    const prompt = `
      次の書籍の概要と特徴を3〜5文で簡潔にまとめてください。専門的で客観的な文体を使用してください。
      
      タイトル: ${bookInfo.title}
      著者: ${bookInfo.author}
      出版社: ${bookInfo.publisher}
      ${bookInfo.genre ? `ジャンル: ${bookInfo.genre}` : ''}
    `; // Anthropic Claude 3.5 Sonnetモデルを使用する場合のリクエスト形式
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 300,
      temperature: 0.7,
      top_k: 250,
      top_p: 0.999,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      stop_sequences: ['\n\nHuman:'],
    }; // Bedrock APIにリクエストを送信
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command); // レスポンスを解析
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Claude 3.5モデルのレスポンス形式に応じて適切にパースする
    let summary = '';

    if (responseBody.content && Array.isArray(responseBody.content)) {
      // content配列からテキスト部分を抽出
      summary = responseBody.content
        .filter((item: any) => item.type === 'text')
        .map((item: any) => item.text)
        .join(' ')
        .trim();
    } else if (responseBody.completion) {
      // 古い形式の場合
      summary = responseBody.completion.trim();
    } else if (responseBody.content?.[0]?.text) {
      // 別の形式の場合
      summary = responseBody.content[0].text.trim();
    }

    return summary;
  } catch (error) {
    console.error('Error generating AI summary with Bedrock:', error);
    // エラーメッセージを詳細に記録
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
    }
    return '';
  }
}
