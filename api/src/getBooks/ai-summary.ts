import { BookSummaryInput, BookSummaryService } from '../services/book-summary-service';

// 元のインターフェース名との互換性のため再エクスポート
export type SummaryInput = BookSummaryInput;

/**
 * 書籍情報をもとにAI要約を生成する関数（Amazon Bedrock使用）
 * @param bookInfo 書籍情報
 * @returns 生成された要約テキスト
 */
export async function generateBookSummary(bookInfo: SummaryInput): Promise<string> {
  return BookSummaryService.generateSummary(bookInfo);
}
