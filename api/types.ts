/**
 * 図書の型定義
 * DDLに対応するデータモデル
 */
export interface Book {
  id: number;
  title: string;
  author: string;
  publisher: string;
  publication_date?: string;  // YYYY-MM-DD形式
  genre?: string;             // 本のジャンル
  page_count?: number;        // ページ数
  language?: string;          // 言語
  owner?: string;             // 所有者
  created_at?: string;        // ISO形式の日時文字列
  updated_at?: string;        // ISO形式の日時文字列
}

/**
 * API Gateway レスポンスの型定義
 * Lambda関数の戻り値として使用
 */
export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}