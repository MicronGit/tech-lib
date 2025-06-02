import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BedrockClientService } from '../services/bedrock-client';
import { ClaudeService } from '../services/claude-service';

// BedrockClientServiceのモック
vi.mock('../services/bedrock-client', () => ({
  BedrockClientService: {
    getClient: vi.fn(),
  },
}));

// Buffer（レスポンス.bodyのエンコード用）のモック
const mockResponseBuffer = Buffer.from(
  JSON.stringify({
    content: [{ type: 'text', text: 'テスト応答テキスト' }],
  })
);

describe('ClaudeService', () => {
  const mockClient = {
    send: vi.fn().mockResolvedValue({
      body: mockResponseBuffer,
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(BedrockClientService.getClient).mockReturnValue(mockClient as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('正常にテキストを生成できること', async () => {
    // テスト実行
    const result = await ClaudeService.generateText('テストプロンプト');

    // 検証
    expect(BedrockClientService.getClient).toHaveBeenCalled();
    expect(mockClient.send).toHaveBeenCalled();

    // コマンドの検証
    const commandArg = mockClient.send.mock.calls[0][0];
    expect(commandArg).toBeInstanceOf(InvokeModelCommand);

    // レスポンスパース検証
    expect(result).toBe('テスト応答テキスト');
  });

  it('カスタムオプションが適切に適用されること', async () => {
    // カスタムオプションでテスト実行
    await ClaudeService.generateText('テストプロンプト', {
      max_tokens: 500,
      temperature: 0.5,
    });

    // コマンドの検証
    const commandArg = mockClient.send.mock.calls[0][0];
    const payload = JSON.parse(commandArg.input.body);

    expect(payload.max_tokens).toBe(500);
    expect(payload.temperature).toBe(0.5);
    expect(payload.top_k).toBe(250); // デフォルト値が維持されている
  });

  it('エラーが発生した場合に適切に処理されること', async () => {
    // エラーをスローするようにモック設定
    mockClient.send.mockRejectedValueOnce(new Error('テストエラー'));

    // テスト実行とエラー検証
    await expect(ClaudeService.generateText('テストプロンプト')).rejects.toThrow('テストエラー');
  });

  describe('レスポンスパース', () => {
    it('content配列形式のレスポンスを正しくパースすること', async () => {
      const mockResponse = {
        body: Buffer.from(
          JSON.stringify({
            content: [
              { type: 'text', text: '応答1' },
              { type: 'text', text: '応答2' },
            ],
          })
        ),
      };
      mockClient.send.mockResolvedValueOnce(mockResponse);

      const result = await ClaudeService.generateText('テスト');
      expect(result).toBe('応答1 応答2');
    });

    it('completion形式のレスポンスを正しくパースすること', async () => {
      const mockResponse = {
        body: Buffer.from(
          JSON.stringify({
            completion: '古い形式の応答',
          })
        ),
      };
      mockClient.send.mockResolvedValueOnce(mockResponse);

      const result = await ClaudeService.generateText('テスト');
      expect(result).toBe('古い形式の応答');
    });

    it('content[0].text形式のレスポンスを正しくパースすること', async () => {
      const mockResponse = {
        body: Buffer.from(
          JSON.stringify({
            content: [{ text: '別形式の応答' }],
          })
        ),
      };
      mockClient.send.mockResolvedValueOnce(mockResponse);

      const result = await ClaudeService.generateText('テスト');
      expect(result).toBe('別形式の応答');
    });
  });
});
