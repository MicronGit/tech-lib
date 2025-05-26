import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApiResponse, Book } from '../../types';
import { end, query } from './db';

/**
 * GET /books - 図書一覧を取得するAPI
 * @returns 図書一覧データ
 */
const getBooks = async (): Promise<Book[]> => {
  const sql = `
    SELECT
      id,
      title,
      author,
      publisher,
      publication_date::text as publication_date,
      genre,
      page_count,
      language,
      owner,
      created_at::text as created_at,
      updated_at::text as updated_at
    FROM books
  `;

  const result = await query<Book>(sql);
  return result;
};

/**
 * POST /books - 新しい図書を登録するAPI
 * @param book 登録する図書データ
 * @returns 登録された図書データ
 */
const addBook = async (book: Partial<Book>): Promise<Book> => {
  const { title, author, publisher, publication_date, genre, page_count, language, owner } = book;

  // 必須項目のバリデーション
  if (!title || !author || !publisher) {
    throw new Error('必須項目（タイトル、著者、出版社）が入力されていません');
  }

  const sql = `
    INSERT INTO books (
      title,
      author,
      publisher,
      publication_date,
      genre,
      page_count,
      language,
      owner
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8
    )
    RETURNING
      id,
      title,
      author,
      publisher,
      publication_date::text as publication_date,
      genre,
      page_count,
      language,
      owner,
      created_at::text as created_at,
      updated_at::text as updated_at
  `;

  const params = [
    title,
    author,
    publisher,
    publication_date || null,
    genre || null,
    page_count || null,
    language || null,
    owner || null,
  ];

  const result = await query<Book>(sql, params);
  if (result.length === 0) {
    throw new Error('図書の登録に失敗しました');
  }

  return result[0];
};

/**
 * 標準的なCORSヘッダーを設定
 */
const getCorsHeaders = (): Record<string, string> => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
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

    // 図書登録APIの処理
    if (event.resource === '/books' && event.httpMethod === 'POST') {
      if (!event.body) {
        return formatResponse(400, { message: 'リクエストボディが必要です' });
      }

      try {
        const bookData = JSON.parse(event.body);
        const newBook = await addBook(bookData);
        return formatResponse(201, { message: '図書が正常に登録されました', id: newBook.id });
      } catch (parseError) {
        return formatResponse(400, {
          message: 'リクエストボディの解析に失敗しました',
          error: parseError instanceof Error ? parseError.message : String(parseError),
        });
      }
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
