/**
 * DBクエリを実行するための関数
 * @param text SQLクエリ文字列
 * @param params クエリパラメータ（オプション）
 * @returns クエリ結果の配列
 */
export declare function query<T = any>(text: string, params?: any[]): Promise<T[]>;
/**
 * サーバーレス環境のため実際には何も行いませんが、
 * APIの一貫性のために残しています
 */
export declare function end(): Promise<void>;
