/**
 * 図書の型定義
 * DDLに対応するデータモデル
 */
export interface Book {
    id: number;
    title: string;
    author: string;
    publisher: string;
    publication_date?: string;
    isbn?: string;
    genre?: string;
    page_count?: number;
    language?: string;
    owner?: string;
    created_at?: string;
    updated_at?: string;
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
