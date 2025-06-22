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
      description,
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
  const { title, author, publisher, publication_date, genre, page_count, language, owner, description } = book;

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
      owner,
      description
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9
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
      description,
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
    description || null,
  ];

  const result = await query<Book>(sql, params);
  if (result.length === 0) {
    throw new Error('図書の登録に失敗しました');
  }

  return result[0];
};

/**
 * GET /books/{id} - 指定したIDの図書詳細を取得するAPI
 * @param id 取得する図書のID
 * @returns 図書詳細データ
 */
const getBookById = async (id: string): Promise<Book> => {
  // IDのバリデーション
  const bookId = parseInt(id, 10);
  if (isNaN(bookId)) {
    throw new Error('無効な図書IDです');
  }

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
      description,
      created_at::text as created_at,
      updated_at::text as updated_at
    FROM books
    WHERE id = $1
  `;

  const result = await query<Book>(sql, [bookId]);
  
  if (result.length === 0) {
    throw new Error('指定された図書が見つかりません');
  }

  return result[0];
};

/**
 * DELETE /books/{id} - 指定したIDの図書を削除するAPI
 * @param id 削除する図書のID
 * @returns 削除結果
 */
const deleteBook = async (id: string): Promise<boolean> => {
  // IDのバリデーション
  const bookId = parseInt(id, 10);
  if (isNaN(bookId)) {
    throw new Error('無効な図書IDです');
  }

  // 図書の存在確認
  const checkSql = `
    SELECT id FROM books WHERE id = $1
  `;
  const checkResult = await query<{ id: number }>(checkSql, [bookId]);

  if (checkResult.length === 0) {
    throw new Error('指定された図書が見つかりません');
  }

  // 図書の削除
  const deleteSql = `
    DELETE FROM books WHERE id = $1
    RETURNING id
  `;

  const deleteResult = await query<{ id: number }>(deleteSql, [bookId]);
  return deleteResult.length > 0;
};

/**
 * 標準的なCORSヘッダーを設定
 */
const getCorsHeaders = (): Record<string, string> => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,DELETE',
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

    // 図書詳細取得APIの処理
    if (event.resource === '/books/{id}' && event.httpMethod === 'GET') {
      const bookId = event.pathParameters?.id;
      if (!bookId) {
        return formatResponse(400, { message: '図書IDが指定されていません' });
      }
      const book = await getBookById(bookId);
      return formatResponse(200, book);
    }

    // 図書削除APIの処理
    if (event.resource === '/books/{id}' && event.httpMethod === 'DELETE') {
      const bookId = event.pathParameters?.id;
      if (!bookId) {
        return formatResponse(400, { message: '図書IDが指定されていません' });
      }
      await deleteBook(bookId);
      return formatResponse(204, {});
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
