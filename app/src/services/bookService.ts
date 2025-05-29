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
    descriptionByAi: book.description_by_ai || '',
    coverImageUrl: '',
  }));
}

// 図書登録用のAPIメソッド
export async function addBook(book: Omit<Book, 'id'>): Promise<Book> {
  try {
    // APIにポストするためのデータ形式に変換
    const apiBook = {
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      publication_date: book.publicationDate,
      genre: book.genre,
      page_count: book.pageCount,
      language: book.language,
      owner: book.owner,
      status: book.status,
    };

    const response = await axios.post(API_URL, apiBook);
    // レスポンスから登録された図書データを取得
    return {
      id: String(response.data.id),
      ...book,
    };
  } catch (error) {
    console.error('Error adding book:', error);
    throw error;
  }
}

// 図書削除用のAPIメソッド
export async function deleteBook(id: string): Promise<boolean> {
  try {
    await axios.delete(`${API_URL}/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
}
