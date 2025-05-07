import { neon, neonConfig } from '@neondatabase/serverless';

// Neon設定
neonConfig.fetchConnectionCache = true;

// 環境変数から接続情報を取得
const connectionString = process.env.DATABASE_URL;

// デモモードのチェック
const isDemoMode = process.env.DEMO_MODE === 'true';

// Neonサーバーレス接続（デモモードでない場合のみ）
const sql = connectionString && !isDemoMode && connectionString.trim() !== '' 
  ? neon(connectionString)
  : null;

/**
 * DBクエリを実行するための関数
 * @param text SQLクエリ文字列
 * @param params クエリパラメータ（オプション）
 * @returns クエリ結果の配列
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  // デモモードまたは接続情報が設定されていない場合
  if (isDemoMode || !sql) {
    console.log('データベース接続がないか、デモモードが有効です。クエリ実行をスキップ:', text);
    return [];
  }

  try {
    let result;
    
    if (!params || params.length === 0) {
      // パラメータなしのクエリ
      result = await sql.unsafe(text);
    } else {
      // パラメータ付きクエリを構築する
      // クエリ文字列とパラメータを結合して実行するためのSQL文を生成
      const query = buildQueryWithParams(text, params);
      result = await sql.unsafe(query);
    }
    
    // TypeScriptコンパイラのエラーを回避するため、一旦unknownにキャストしてから目的の型にキャスト
    return (result as unknown) as T[];
  } catch (error) {
    console.error(`クエリエラー: ${text}`, error);
    throw error;
  }
}

/**
 * パラメータ付きのクエリ文字列を構築するヘルパー関数
 * 
 * @param text SQLクエリ文字列（$1, $2などのプレースホルダーを含む）
 * @param params バインドするパラメータの配列
 * @returns パラメータが埋め込まれたSQL文
 */
function buildQueryWithParams(text: string, params: any[]): string {
  let query = text;
  
  // 各パラメータをエスケープして埋め込む
  params.forEach((param, index) => {
    const placeholder = `$${index + 1}`;
    let replacement: string;
    
    // パラメータの型に応じた適切なフォーマット
    if (param === null) {
      replacement = 'NULL';
    } else if (typeof param === 'string') {
      // 文字列の場合はエスケープして引用符で囲む
      replacement = `'${param.replace(/'/g, "''")}'`;
    } else if (param instanceof Date) {
      // 日付型はISO文字列に変換
      replacement = `'${param.toISOString()}'`;
    } else {
      // その他の型はそのまま文字列化
      replacement = String(param);
    }
    
    // プレースホルダーを実際の値で置き換え
    query = query.replace(placeholder, replacement);
  });
  
  return query;
}

/**
 * サーバーレス環境のため実際には何も行いませんが、
 * APIの一貫性のために残しています
 */
export async function end(): Promise<void> {
  return;
}