import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BookSummaryService } from '../services/book-summary-service';
import { ClaudeService } from '../services/claude-service';

// ClaudeServiceのモック
vi.mock('../services/claude-service', () => ({
  ClaudeService: {
    generateText: vi.fn(),
  },
}));

describe('BookSummaryService', () => {
  const mockBookInfo = {
    title: 'テスト書籍',
    author: 'テスト著者',
    publisher: 'テスト出版社',
    genre: 'テストジャンル',
  };

  const expectedPrompt = `
      次の書籍の概要と特徴を3〜5文で簡潔にまとめてください。専門的で客観的な文体を使用してください。
      
      タイトル: テスト書籍
      著者: テスト著者
      出版社: テスト出版社
      ジャンル: テストジャンル
    `;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('正常に要約を生成できること', async () => {
    // モックの戻り値を設定
    const mockSummary = 'これはテスト書籍の要約です。';
    vi.mocked(ClaudeService.generateText).mockResolvedValue(mockSummary);

    // テスト実行
    const result = await BookSummaryService.generateSummary(mockBookInfo);

    // 検証
    expect(ClaudeService.generateText).toHaveBeenCalledWith(expectedPrompt);
    expect(result).toBe(mockSummary);
  });

  it('エラーが発生した場合に空文字列を返すこと', async () => {
    // エラーをスローするようにモック設定
    vi.mocked(ClaudeService.generateText).mockRejectedValue(new Error('テストエラー'));

    // テスト実行
    const result = await BookSummaryService.generateSummary(mockBookInfo);

    // 検証
    expect(ClaudeService.generateText).toHaveBeenCalledWith(expectedPrompt);
    expect(result).toBe('');
  });

  it('ジャンルが未指定の場合も正しくプロンプトを生成すること', async () => {
    // ジャンルなしの書籍情報
    const bookInfoWithoutGenre = {
      title: 'テスト書籍',
      author: 'テスト著者',
      publisher: 'テスト出版社',
    };

    const expectedPromptWithoutGenre = `
      次の書籍の概要と特徴を3〜5文で簡潔にまとめてください。専門的で客観的な文体を使用してください。
      
      タイトル: テスト書籍
      著者: テスト著者
      出版社: テスト出版社
      
    `;

    // モックの戻り値を設定
    const mockSummary = 'これはジャンルなしのテスト書籍の要約です。';
    vi.mocked(ClaudeService.generateText).mockResolvedValue(mockSummary);

    // テスト実行
    const result = await BookSummaryService.generateSummary(bookInfoWithoutGenre);

    // 検証
    expect(ClaudeService.generateText).toHaveBeenCalledWith(expectedPromptWithoutGenre);
    expect(result).toBe(mockSummary);
  });
});
