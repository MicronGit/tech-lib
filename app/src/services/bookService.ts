import axios from 'axios';
import type { Book } from '../types/Book';

const API_URL = 'https://ba08thaw76.execute-api.ap-northeast-1.amazonaws.com/dev/books';

export async function fetchBooks(): Promise<Book[]> {
  try {
    const response = await axios.get(API_URL);
    return convertToBookFormat(response.data.books);
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
}

// APIレスポンスデータをフロントエンドの型に変換する関数
export function convertToBookFormat(apiBooks: any[]): Book[] {
  return apiBooks.map((book) => ({
    id: String(book.id),
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    publicationDate: book.publication_date || '',
    genre: book.genre || '',
    pageCount: book.page_count || 0,
    language: book.language || '',
    owner: book.owner || '',
    status: 'available',
    description: '',
    coverImageUrl: '',
  }));
}
