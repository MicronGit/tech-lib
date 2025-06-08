// 図書データの型定義
export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publicationDate: string;
  genre: string;
  description?: string;
  pageCount: number;
  language: string;
  coverImageUrl?: string;
  status: 'available' | 'borrowed' | 'reserved';
  owner: string; // 図書を提供した人（オーナー）
}
