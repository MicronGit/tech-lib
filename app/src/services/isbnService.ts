import axios from 'axios';

export interface BookISBNData {
  title?: string;
  author?: string;
  publisher?: string;
  publicationDate?: string;
  pageCount?: number;
  language?: string;
  description?: string;
  coverImageUrl?: string;
}

interface GoogleBooksApiResponse {
  totalItems: number;
  items?: GoogleBooksItem[];
}

interface GoogleBooksItem {
  volumeInfo: {
    title?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    pageCount?: number;
    language?: string;
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
  };
}

export async function fetchBookDataFromISBN(isbn: string): Promise<BookISBNData | null> {
  try {
    // ISBNの正規化（ハイフンなどを除去）
    const cleanISBN = isbn.replace(/[-\s]/g, '');

    // ISBN-10またはISBN-13の形式チェック
    if (!/^\d{10}$/.test(cleanISBN) && !/^\d{13}$/.test(cleanISBN)) {
      throw new Error('無効なISBNです。10桁または13桁の数字を入力してください。');
    }

    // Google Books APIでISBN検索
    const response = await axios.get<GoogleBooksApiResponse>(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`,
      {
        timeout: 10000, // 10秒のタイムアウト
      }
    );

    if (response.data.totalItems === 0 || !response.data.items) {
      throw new Error('指定されたISBNの書籍情報が見つかりませんでした。');
    }

    const bookInfo = response.data.items[0].volumeInfo;

    // 出版日の形式を変換（YYYY-MM-DD形式に統一）
    const formatPublishedDate = (dateStr?: string): string => {
      if (!dateStr) return '';

      // 完全な日付（YYYY-MM-DD）の場合はそのまま
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }

      // 年月のみ（YYYY-MM）の場合は01日を追加
      if (/^\d{4}-\d{2}$/.test(dateStr)) {
        return `${dateStr}-01`;
      }

      // 年のみ（YYYY）の場合は01月01日を追加
      if (/^\d{4}$/.test(dateStr)) {
        return `${dateStr}-01-01`;
      }

      // その他の形式の場合は空文字を返す
      return '';
    };

    // 言語コードを日本語表記に変換
    const formatLanguage = (langCode?: string): string => {
      if (!langCode) return '';

      const languageMap: Record<string, string> = {
        ja: '日本語',
        en: '英語',
        zh: '中国語',
        ko: '韓国語',
        fr: 'フランス語',
        de: 'ドイツ語',
        es: 'スペイン語',
        it: 'イタリア語',
        pt: 'ポルトガル語',
        ru: 'ロシア語',
      };

      return languageMap[langCode.toLowerCase()] || langCode;
    };

    return {
      title: bookInfo.title || '',
      author: bookInfo.authors ? bookInfo.authors.join(', ') : '',
      publisher: bookInfo.publisher || '',
      publicationDate: formatPublishedDate(bookInfo.publishedDate),
      pageCount: bookInfo.pageCount || 0,
      language: formatLanguage(bookInfo.language),
      description: bookInfo.description || '',
      coverImageUrl: bookInfo.imageLinks?.thumbnail || bookInfo.imageLinks?.smallThumbnail || '',
    };
  } catch (error) {
    console.error('Error fetching book data from ISBN:', error);

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('リクエストがタイムアウトしました。ネットワーク接続を確認してください。');
      } else if (error.response && error.response.status === 429) {
        throw new Error('リクエスト制限に達しました。しばらく時間をおいてから再試行してください。');
      } else if (error.response && error.response.status >= 500) {
        throw new Error(
          'サーバーエラーが発生しました。しばらく時間をおいてから再試行してください。'
        );
      }
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('書籍情報の取得中に予期しないエラーが発生しました。');
  }
}

// ISBNバリデーション関数
export function validateISBN(isbn: string): boolean {
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  return /^\d{10}$/.test(cleanISBN) || /^\d{13}$/.test(cleanISBN);
}

// ISBN-10をISBN-13に変換する関数
export function convertISBN10to13(isbn10: string): string {
  const cleanISBN = isbn10.replace(/[-\s]/g, '');

  if (!/^\d{10}$/.test(cleanISBN)) {
    throw new Error('無効なISBN-10です');
  }

  const prefix = '978' + cleanISBN.slice(0, 9);
  let checksum = 0;

  for (let i = 0; i < 12; i++) {
    const digit = parseInt(prefix[i]);
    checksum += i % 2 === 0 ? digit : digit * 3;
  }

  const checkDigit = (10 - (checksum % 10)) % 10;
  return prefix + checkDigit.toString();
}
