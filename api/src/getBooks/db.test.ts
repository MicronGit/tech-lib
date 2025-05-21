import { beforeEach, describe, expect, it, vi } from 'vitest';

// @neondatabase/serverless のモック
vi.mock('@neondatabase/serverless', () => {
  const mockQuery = vi.fn();
  const mockNeon = vi.fn().mockImplementation(() => ({
    query: mockQuery,
  }));

  return {
    neon: mockNeon,
    neonConfig: { fetchConnectionCache: false },
  };
});

describe('db module', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // 環境変数をテスト前にリセット
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

    // モックのリセット
    vi.clearAllMocks();
  });

  it('should return empty array when no connection string', async () => {
    // DATABASE_URLを未設定にする
    process.env.DATABASE_URL = '';

    // モジュールを再インポート
    const { query } = await import('./db');

    const result = await query('SELECT * FROM books');
    expect(result).toEqual([]);
  });

  it('should execute query without params', async () => {
    const mockQueryResult = [{ id: 1, title: 'テスト本' }];

    // モックの設定
    const neonModule = await import('@neondatabase/serverless');
    const mockQueryFn = vi.fn().mockResolvedValue(mockQueryResult);
    const mockSql = { query: mockQueryFn };

    vi.mocked(neonModule.neon).mockReturnValue(mockSql);

    // モジュールを再インポート
    const { query } = await import('./db');

    const result = await query('SELECT * FROM books');

    // 検証
    expect(neonModule.neon).toHaveBeenCalledWith(process.env.DATABASE_URL);
    expect(mockQueryFn).toHaveBeenCalledWith('SELECT * FROM books');
    expect(result).toEqual(mockQueryResult);
  });

  it('should execute query with params', async () => {
    const mockQueryResult = [{ id: 1, title: '特定の本' }];

    // モックの設定
    const neonModule = await import('@neondatabase/serverless');
    const mockQueryFn = vi.fn().mockResolvedValue(mockQueryResult);
    const mockSql = { query: mockQueryFn };

    vi.mocked(neonModule.neon).mockReturnValue(mockSql);

    // モジュールを再インポート
    const { query } = await import('./db');

    const result = await query('SELECT * FROM books WHERE id = $1', [1]);

    // パラメータ付きクエリの検証
    expect(mockQueryFn).toHaveBeenCalled();
    expect(result).toEqual(mockQueryResult);
  });

  it('should handle query error', async () => {
    const mockError = new Error('Database error');

    // モックの設定
    const neonModule = await import('@neondatabase/serverless');
    const mockQueryFn = vi.fn().mockRejectedValue(mockError);
    const mockSql = { query: mockQueryFn };

    vi.mocked(neonModule.neon).mockReturnValue(mockSql);

    // モジュールを再インポート
    const { query } = await import('./db');

    // エラーがスローされることを検証
    await expect(query('SELECT * FROM invalid_table')).rejects.toThrow('Database error');
  });
});
