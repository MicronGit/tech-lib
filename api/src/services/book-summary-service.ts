import { ClaudeService } from './claude-service';

/**
 * 書籍情報の入力インターフェース
 */
export interface BookSummaryInput {
  title: string;
  author: string;
  publisher: string;
  genre?: string;
}

/**
 * 書籍要約に関するサービス
 */
export class BookSummaryService {
  /**
   * 書籍情報をもとにAI要約を生成する
   *
   * @param bookInfo 書籍情報
   * @returns 生成された要約テキスト
   */
  public static async generateSummary(bookInfo: BookSummaryInput): Promise<string> {
    try {
      const prompt = this.createSummaryPrompt(bookInfo);
      return await ClaudeService.generateText(prompt);
    } catch (error) {
      console.error('Error generating book summary:', error);
      return '';
    }
  }

  /**
   * 書籍情報からプロンプトを作成する
   *
   * @param bookInfo 書籍情報
   * @returns 生成されたプロンプト
   */
  private static createSummaryPrompt(bookInfo: BookSummaryInput): string {
    return `
      次の書籍の概要と特徴を3〜5文で簡潔にまとめてください。専門的で客観的な文体を使用してください。
      
      タイトル: ${bookInfo.title}
      著者: ${bookInfo.author}
      出版社: ${bookInfo.publisher}
      ${bookInfo.genre ? `ジャンル: ${bookInfo.genre}` : ''}
    `;
  }
}
