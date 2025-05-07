import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { query, end } from './db';
import { Book, ApiResponse } from './types';

/**
 * GET /books - 図書一覧を取得するAPI
 * @returns 図書一覧データ
 */
const getBooks = async (): Promise<Book[]> => {
  // デモモードが有効な場合はモックデータを返す
  if (process.env.DEMO_MODE === 'true') {
    return getMockBooks();
  }
  
  // 実際のデータベースからデータを取得
  return query<Book>(`
    SELECT 
      id, 
      title, 
      author, 
      publisher, 
      TO_CHAR(publication_date, 'YYYY-MM-DD') as publication_date,
      isbn, 
      genre, 
      page_count, 
      language, 
      owner,
      TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
      TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
    FROM books
    ORDER BY id DESC
  `);
};

/**
 * モックデータを返す関数
 * データベース接続がない場合のフォールバック用
 */
const getMockBooks = (): Book[] => {
  return [
    {
      id: 1,
      title: 'TypeScriptプログラミング実践ガイド',
      author: '山田太郎',
      publisher: 'テック出版',
      publication_date: '2023-01-15',
      isbn: '978-4-1234-5678-9',
      genre: 'プログラミング',
      page_count: 320,
      language: '日本語',
      owner: '鈴木雄一',
      created_at: '2023-01-01T09:00:00Z',
      updated_at: '2023-01-01T09:00:00Z'
    },
    {
      id: 2,
      title: 'クラウドインフラ構築入門',
      author: '鈴木一郎',
      publisher: 'クラウド技術社',
      publication_date: '2022-11-05',
      isbn: '978-4-9876-5432-1',
      genre: 'インフラ',
      page_count: 250,
      language: '日本語',
      owner: '佐藤健太',
      created_at: '2022-11-01T10:30:00Z',
      updated_at: '2022-11-10T14:15:00Z'
    },
    {
      id: 3,
      title: 'Vue.js ベストプラクティス',
      author: '佐藤花子',
      publisher: 'フロントエンド出版',
      publication_date: '2023-03-20',
      isbn: '978-4-5555-6666-7',
      genre: 'プログラミング',
      page_count: 280,
      language: '日本語',
      owner: '田中美咲',
      created_at: '2023-03-15T08:45:00Z',
      updated_at: '2023-03-15T08:45:00Z'
    },
    {
      id: 4,
      title: 'Webアプリケーションセキュリティ',
      author: '高橋次郎',
      publisher: 'セキュリティ技術社',
      publication_date: '2022-08-10',
      isbn: '978-4-7777-8888-9',
      genre: 'セキュリティ',
      page_count: 400,
      language: '日本語',
      owner: '伊藤拓也',
      created_at: '2022-08-05T13:20:00Z',
      updated_at: '2022-08-05T13:20:00Z'
    },
    {
      id: 5,
      title: 'Pythonによるデータ分析入門',
      author: '伊藤三郎',
      publisher: 'データサイエンス出版',
      publication_date: '2023-02-28',
      isbn: '978-4-9999-0000-1',
      genre: 'データサイエンス',
      page_count: 350,
      language: '日本語',
      owner: '渡辺直樹',
      created_at: '2023-02-20T11:10:00Z',
      updated_at: '2023-02-25T15:30:00Z'
    }
  ];
};

/**
 * 標準的なCORSヘッダーを設定
 */
const getCorsHeaders = (): Record<string, string> => ({
  'Access-Control-Allow-Origin': '*', // 本番ではオリジンを限定
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET',
  'Content-Type': 'application/json'
});

/**
 * APIレスポンスを標準フォーマットで返す
 */
const formatResponse = (statusCode: number, data: unknown): ApiResponse => ({
  statusCode,
  headers: getCorsHeaders(),
  body: JSON.stringify(data)
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
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    try {
      await end();
    } catch (error) {
      console.error('DB接続の終了に失敗しました', error);
    }
  }
};