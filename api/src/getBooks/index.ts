import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApiResponse, Book } from '../../types';
import { end, query } from './db';

/**
 * GET /books - 図書一覧を取得するAPI
 * @returns 図書一覧データ
 */
const getBooks = async (): Promise<Book[]> => {
  // Neon serverlessの形式に合わせてクエリを実行
  return query<Book>(`
    SELECT 
      id, 
      title, 
      author, 
      publisher, 
      publication_date::text as publication_date,
      isbn, 
      genre, 
      page_count, 
      language, 
      owner,
      created_at::text as created_at,
      updated_at::text as updated_at
    FROM books
    ORDER BY id DESC
  `);
};

/**
 * 標準的なCORSヘッダーを設定
 */
const getCorsHeaders = (): Record<string, string> => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET',
  'Content-Type': 'application/json',
});

/**
 * APIレスポンスを標準フォーマットで返す
 */
const formatResponse = (statusCode: number, data: unknown): ApiResponse => ({
  statusCode,
  headers: getCorsHeaders(),
  body: JSON.stringify(data),
});

/**
 * Lambdaハンドラー関数
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // PREFLIGHTリクエスト（OPTIONS）への対応
  if (event.httpMethod === 'OPTIONS') {
    return formatResponse(200, {});
  }

  try {
    // パスとHTTPメソッドに基づいて処理を分岐
    if (event.resource === '/books' && event.httpMethod === 'GET') {
      const books = await getBooks();
      return formatResponse(200, { books });
    }

    // 対応していないエンドポイントの場合
    return formatResponse(404, { message: 'Not Found' });
  } catch (error) {
    console.error('APIリクエストの処理中にエラーが発生しました', error);
    return formatResponse(500, {
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    try {
      await end();
    } catch (error) {
      console.error('DB接続の終了に失敗しました', error);
    }
  }
};
