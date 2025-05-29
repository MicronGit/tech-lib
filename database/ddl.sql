-- ddl.sql
-- 図書管理アプリケーションのデータベーススキーマ定義

-- テーブルが存在する場合は一旦削除して再作成
DROP TABLE IF EXISTS books;

-- booksテーブル: 図書情報を格納するテーブル
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  publisher VARCHAR(255) NOT NULL,
  publication_date DATE,
  genre VARCHAR(100),
  page_count INTEGER,
  language VARCHAR(50),
  owner VARCHAR(100),
  description_by_ai TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスの作成
CREATE INDEX idx_books_title ON books (title);
CREATE INDEX idx_books_author ON books (author);
CREATE INDEX idx_books_genre ON books (genre);