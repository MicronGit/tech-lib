"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.end = end;
const serverless_1 = require("@neondatabase/serverless");
// Neon設定
serverless_1.neonConfig.fetchConnectionCache = true;
// 環境変数から接続情報を取得
const connectionString = process.env.DATABASE_URL;
// Neonサーバーレス接続
const sql = connectionString
    ? (0, serverless_1.neon)(connectionString)
    : null;
/**
 * DBクエリを実行するための関数
 * @param text SQLクエリ文字列
 * @param params クエリパラメータ（オプション）
 * @returns クエリ結果の配列
 */
async function query(text, params) {
    if (!sql) {
        throw new Error('データベース接続情報が設定されていません');
    }
    try {
        let result;
        if (!params || params.length === 0) {
            // パラメータなしのクエリ
            result = await sql.unsafe(text);
        }
        else {
            // パラメータ付きクエリを構築する
            // クエリ文字列とパラメータを結合して実行するためのSQL文を生成
            const query = buildQueryWithParams(text, params);
            result = await sql.unsafe(query);
        }
        // TypeScriptコンパイラのエラーを回避するため、一旦unknownにキャストしてから目的の型にキャスト
        return result;
    }
    catch (error) {
        console.error(`クエリエラー: ${text}`, error);
        throw error;
    }
}
/**
 * パラメータ付きのクエリ文字列を構築するヘルパー関数
 *
 * @param text SQLクエリ文字列（$1, $2などのプレースホルダーを含む）
 * @param params バインドするパラメータの配列
 * @returns パラメータが埋め込まれたSQL文
 */
function buildQueryWithParams(text, params) {
    let query = text;
    // 各パラメータをエスケープして埋め込む
    params.forEach((param, index) => {
        const placeholder = `$${index + 1}`;
        let replacement;
        // パラメータの型に応じた適切なフォーマット
        if (param === null) {
            replacement = 'NULL';
        }
        else if (typeof param === 'string') {
            // 文字列の場合はエスケープして引用符で囲む
            replacement = `'${param.replace(/'/g, "''")}'`;
        }
        else if (param instanceof Date) {
            // 日付型はISO文字列に変換
            replacement = `'${param.toISOString()}'`;
        }
        else {
            // その他の型はそのまま文字列化
            replacement = String(param);
        }
        // プレースホルダーを実際の値で置き換え
        query = query.replace(placeholder, replacement);
    });
    return query;
}
/**
 * サーバーレス環境のため実際には何も行いませんが、
 * APIの一貫性のために残しています
 */
async function end() {
    return;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9kYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQW1CQSxzQkF3QkM7QUEwQ0Qsa0JBRUM7QUF2RkQseURBQTREO0FBRTVELFNBQVM7QUFDVCx1QkFBVSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQztBQUV2QyxnQkFBZ0I7QUFDaEIsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQztBQUVsRCxlQUFlO0FBQ2YsTUFBTSxHQUFHLEdBQUcsZ0JBQWdCO0lBQzFCLENBQUMsQ0FBQyxJQUFBLGlCQUFJLEVBQUMsZ0JBQWdCLENBQUM7SUFDeEIsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUVUOzs7OztHQUtHO0FBQ0ksS0FBSyxVQUFVLEtBQUssQ0FBVSxJQUFZLEVBQUUsTUFBYztJQUMvRCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDVCxNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVELElBQUksQ0FBQztRQUNILElBQUksTUFBTSxDQUFDO1FBRVgsSUFBSSxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ25DLGNBQWM7WUFDZCxNQUFNLEdBQUcsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLENBQUM7YUFBTSxDQUFDO1lBQ04sa0JBQWtCO1lBQ2xCLGtDQUFrQztZQUNsQyxNQUFNLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDakQsTUFBTSxHQUFHLE1BQU0sR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQseURBQXlEO1FBQ3pELE9BQVEsTUFBeUIsQ0FBQztJQUNwQyxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxJQUFJLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN4QyxNQUFNLEtBQUssQ0FBQztJQUNkLENBQUM7QUFDSCxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBUyxvQkFBb0IsQ0FBQyxJQUFZLEVBQUUsTUFBYTtJQUN2RCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7SUFFakIscUJBQXFCO0lBQ3JCLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUU7UUFDOUIsTUFBTSxXQUFXLEdBQUcsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDcEMsSUFBSSxXQUFtQixDQUFDO1FBRXhCLHVCQUF1QjtRQUN2QixJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUNuQixXQUFXLEdBQUcsTUFBTSxDQUFDO1FBQ3ZCLENBQUM7YUFBTSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ3JDLHVCQUF1QjtZQUN2QixXQUFXLEdBQUcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ2pELENBQUM7YUFBTSxJQUFJLEtBQUssWUFBWSxJQUFJLEVBQUUsQ0FBQztZQUNqQyxnQkFBZ0I7WUFDaEIsV0FBVyxHQUFHLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUM7UUFDM0MsQ0FBQzthQUFNLENBQUM7WUFDTixpQkFBaUI7WUFDakIsV0FBVyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRUQscUJBQXFCO1FBQ3JCLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNsRCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVEOzs7R0FHRztBQUNJLEtBQUssVUFBVSxHQUFHO0lBQ3ZCLE9BQU87QUFDVCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbmVvbiwgbmVvbkNvbmZpZyB9IGZyb20gJ0BuZW9uZGF0YWJhc2Uvc2VydmVybGVzcyc7XG5cbi8vIE5lb27oqK3lrppcbm5lb25Db25maWcuZmV0Y2hDb25uZWN0aW9uQ2FjaGUgPSB0cnVlO1xuXG4vLyDnkrDlooPlpInmlbDjgYvjgonmjqXntprmg4XloLHjgpLlj5blvpdcbmNvbnN0IGNvbm5lY3Rpb25TdHJpbmcgPSBwcm9jZXNzLmVudi5EQVRBQkFTRV9VUkw7XG5cbi8vIE5lb27jgrXjg7zjg5Djg7zjg6zjgrnmjqXntppcbmNvbnN0IHNxbCA9IGNvbm5lY3Rpb25TdHJpbmcgXG4gID8gbmVvbihjb25uZWN0aW9uU3RyaW5nKVxuICA6IG51bGw7XG5cbi8qKlxuICogRELjgq/jgqjjg6rjgpLlrp/ooYzjgZnjgovjgZ/jgoHjga7plqLmlbBcbiAqIEBwYXJhbSB0ZXh0IFNRTOOCr+OCqOODquaWh+Wtl+WIl1xuICogQHBhcmFtIHBhcmFtcyDjgq/jgqjjg6rjg5Hjg6njg6Hjg7zjgr/vvIjjgqrjg5fjgrfjg6fjg7PvvIlcbiAqIEByZXR1cm5zIOOCr+OCqOODque1kOaenOOBrumFjeWIl1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcXVlcnk8VCA9IGFueT4odGV4dDogc3RyaW5nLCBwYXJhbXM/OiBhbnlbXSk6IFByb21pc2U8VFtdPiB7XG4gIGlmICghc3FsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCfjg4fjg7zjgr/jg5njg7zjgrnmjqXntprmg4XloLHjgYzoqK3lrprjgZXjgozjgabjgYTjgb7jgZvjgpMnKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgbGV0IHJlc3VsdDtcbiAgICBcbiAgICBpZiAoIXBhcmFtcyB8fCBwYXJhbXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAvLyDjg5Hjg6njg6Hjg7zjgr/jgarjgZfjga7jgq/jgqjjg6pcbiAgICAgIHJlc3VsdCA9IGF3YWl0IHNxbC51bnNhZmUodGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIOODkeODqeODoeODvOOCv+S7mOOBjeOCr+OCqOODquOCkuani+evieOBmeOCi1xuICAgICAgLy8g44Kv44Ko44Oq5paH5a2X5YiX44Go44OR44Op44Oh44O844K/44KS57WQ5ZCI44GX44Gm5a6f6KGM44GZ44KL44Gf44KB44GuU1FM5paH44KS55Sf5oiQXG4gICAgICBjb25zdCBxdWVyeSA9IGJ1aWxkUXVlcnlXaXRoUGFyYW1zKHRleHQsIHBhcmFtcyk7XG4gICAgICByZXN1bHQgPSBhd2FpdCBzcWwudW5zYWZlKHF1ZXJ5KTtcbiAgICB9XG4gICAgXG4gICAgLy8gVHlwZVNjcmlwdOOCs+ODs+ODkeOCpOODqeOBruOCqOODqeODvOOCkuWbnumBv+OBmeOCi+OBn+OCgeOAgeS4gOaXpnVua25vd27jgavjgq3jg6Pjgrnjg4jjgZfjgabjgYvjgonnm67nmoTjga7lnovjgavjgq3jg6Pjgrnjg4hcbiAgICByZXR1cm4gKHJlc3VsdCBhcyB1bmtub3duKSBhcyBUW107XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihg44Kv44Ko44Oq44Ko44Op44O8OiAke3RleHR9YCwgZXJyb3IpO1xuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbi8qKlxuICog44OR44Op44Oh44O844K/5LuY44GN44Gu44Kv44Ko44Oq5paH5a2X5YiX44KS5qeL56+J44GZ44KL44OY44Or44OR44O86Zai5pWwXG4gKiBcbiAqIEBwYXJhbSB0ZXh0IFNRTOOCr+OCqOODquaWh+Wtl+WIl++8iCQxLCAkMuOBquOBqeOBruODl+ODrOODvOOCueODm+ODq+ODgOODvOOCkuWQq+OCgO+8iVxuICogQHBhcmFtIHBhcmFtcyDjg5DjgqTjg7Pjg4njgZnjgovjg5Hjg6njg6Hjg7zjgr/jga7phY3liJdcbiAqIEByZXR1cm5zIOODkeODqeODoeODvOOCv+OBjOWfi+OCgei+vOOBvuOCjOOBn1NRTOaWh1xuICovXG5mdW5jdGlvbiBidWlsZFF1ZXJ5V2l0aFBhcmFtcyh0ZXh0OiBzdHJpbmcsIHBhcmFtczogYW55W10pOiBzdHJpbmcge1xuICBsZXQgcXVlcnkgPSB0ZXh0O1xuICBcbiAgLy8g5ZCE44OR44Op44Oh44O844K/44KS44Ko44K544Kx44O844OX44GX44Gm5Z+L44KB6L6844KAXG4gIHBhcmFtcy5mb3JFYWNoKChwYXJhbSwgaW5kZXgpID0+IHtcbiAgICBjb25zdCBwbGFjZWhvbGRlciA9IGAkJHtpbmRleCArIDF9YDtcbiAgICBsZXQgcmVwbGFjZW1lbnQ6IHN0cmluZztcbiAgICBcbiAgICAvLyDjg5Hjg6njg6Hjg7zjgr/jga7lnovjgavlv5zjgZjjgZ/pganliIfjgarjg5Xjgqnjg7zjg57jg4Pjg4hcbiAgICBpZiAocGFyYW0gPT09IG51bGwpIHtcbiAgICAgIHJlcGxhY2VtZW50ID0gJ05VTEwnO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHBhcmFtID09PSAnc3RyaW5nJykge1xuICAgICAgLy8g5paH5a2X5YiX44Gu5aC05ZCI44Gv44Ko44K544Kx44O844OX44GX44Gm5byV55So56ym44Gn5Zuy44KAXG4gICAgICByZXBsYWNlbWVudCA9IGAnJHtwYXJhbS5yZXBsYWNlKC8nL2csIFwiJydcIil9J2A7XG4gICAgfSBlbHNlIGlmIChwYXJhbSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgIC8vIOaXpeS7mOWei+OBr0lTT+aWh+Wtl+WIl+OBq+WkieaPm1xuICAgICAgcmVwbGFjZW1lbnQgPSBgJyR7cGFyYW0udG9JU09TdHJpbmcoKX0nYDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8g44Gd44Gu5LuW44Gu5Z6L44Gv44Gd44Gu44G+44G+5paH5a2X5YiX5YyWXG4gICAgICByZXBsYWNlbWVudCA9IFN0cmluZyhwYXJhbSk7XG4gICAgfVxuICAgIFxuICAgIC8vIOODl+ODrOODvOOCueODm+ODq+ODgOODvOOCkuWun+mam+OBruWApOOBp+e9ruOBjeaPm+OBiFxuICAgIHF1ZXJ5ID0gcXVlcnkucmVwbGFjZShwbGFjZWhvbGRlciwgcmVwbGFjZW1lbnQpO1xuICB9KTtcbiAgXG4gIHJldHVybiBxdWVyeTtcbn1cblxuLyoqXG4gKiDjgrXjg7zjg5Djg7zjg6zjgrnnkrDlooPjga7jgZ/jgoHlrp/pmpvjgavjga/kvZXjgoLooYzjgYTjgb7jgZvjgpPjgYzjgIFcbiAqIEFQSeOBruS4gOiyq+aAp+OBruOBn+OCgeOBq+aui+OBl+OBpuOBhOOBvuOBmVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5kKCk6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm47XG59Il19