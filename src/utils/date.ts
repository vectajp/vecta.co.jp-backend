import moment from 'moment-timezone'

// タイムゾーンを東京に設定
const TOKYO_TIMEZONE = 'Asia/Tokyo'

/**
 * 現在の日時を東京時間で取得
 * @returns ISO 8601形式の日付文字列
 */
export function now(): string {
  return moment().tz(TOKYO_TIMEZONE).toISOString()
}

/**
 * 日付を東京時間でフォーマット
 * @param date - フォーマットする日付（string, Date, number）
 * @param format - 出力フォーマット（デフォルト: 'YYYY/MM/DD HH:mm'）
 * @returns フォーマットされた日付文字列
 */
export function formatDate(
  date?: string | Date | number,
  format = 'YYYY/MM/DD HH:mm',
): string {
  const m = date ? moment(date) : moment()
  return m.tz(TOKYO_TIMEZONE).format(format)
}

/**
 * 日付を日本語形式でフォーマット
 * @param date - フォーマットする日付
 * @returns 日本語形式の日付文字列（例: 2024年12月25日 15時30分）
 */
export function formatDateJapanese(date?: string | Date | number): string {
  return formatDate(date, 'YYYY年MM月DD日 HH時mm分')
}

/**
 * ISO 8601形式の日付を東京時間に変換
 * @param isoString - ISO 8601形式の日付文字列
 * @returns 東京時間のISO 8601形式の日付文字列
 */
export function toTokyoTime(isoString: string): string {
  return moment(isoString).tz(TOKYO_TIMEZONE).toISOString()
}

/**
 * Dateオブジェクトを東京時間で作成
 * @param date - 日付（省略時は現在時刻）
 * @returns Dateオブジェクト
 */
export function tokyoDate(date?: string | Date | number): Date {
  const m = date ? moment(date) : moment()
  return m.tz(TOKYO_TIMEZONE).toDate()
}
