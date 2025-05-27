import { neon, neonConfig } from '@neondatabase/serverless';

// Neon設定
neonConfig.fetchConnectionCache = true;

// 環境変数から接続情報を取得
const connectionString = process.env.DATABASE_URL;

// Neonサーバーレス接続（デモモードでない場合のみ）
const sql = connectionString && connectionString.trim() !== '' ? neon(connectionString) : null;

/**
 * DBクエリを実行するための関数
 * @param text SQLクエリ文字列
 * @param params クエリパラメータ（オプション）
 * @returns クエリ結果の配列
 */
export async function query<T = any>(query: string, params?: any[]): Promise<T[]> {
  // 接続情報が設定されていない場合
  if (!sql) {
    console.log('データベース接続情報がありません', query);
    return [];
  }

  // SQLクエリの改行を空白に置き換え、連続する空白を1つに圧縮し、前後の空白を削除
  const sanitizedQuery = query.replace(/\s+/g, ' ').trim();

  try {
    let result;

    // パラメータ化クエリを使用して安全にクエリを実行
    if (!params || params.length === 0) {
      result = await sql.query(sanitizedQuery);
    } else {
      // Neonのパラメータ化クエリを使用（$1, $2などのプレースホルダーをそのまま使用）
      result = await sql.query(sanitizedQuery, params);
    }

    // TypeScriptコンパイラのエラーを回避するため、一旦unknownにキャストしてから目的の型にキャスト
    return result as T[];
  } catch (error) {
    console.error(`クエリエラー: ${sanitizedQuery}`, error);
    throw error;
  }
}

/**
 * サーバーレス環境のため実際には何も行いませんが、
 * APIの一貫性のために残しています
 */
export async function end(): Promise<void> {
  return;
}
