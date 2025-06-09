import moment from 'moment-timezone'

// タイムゾーンを東京に設定
const TOKYO_TIMEZONE = 'Asia/Tokyo'

/**
 * 現在の日時を東京時間で取得
 * @returns ISO 8601形式の日付文字列（東京時間として保存）
 */
export function now(): string {
  // 東京時間で現在時刻を取得し、ISO形式で返す
  // D1データベースはUTCで保存されるため、東京時間として扱いたい場合は
  // 東京時間の値をそのままUTCとして保存する
  return moment().tz(TOKYO_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 現在の日時をUTCで取得（比較用）
 * @returns ISO 8601形式の日付文字列（UTC）
 */
export function nowUTC(): string {
  return moment().utc().toISOString()
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
  if (!date) {
    return moment().tz(TOKYO_TIMEZONE).format(format)
  }

  // データベースから取得した日付文字列の場合（YYYY-MM-DD HH:mm:ss形式）
  if (
    typeof date === 'string' &&
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(date)
  ) {
    return moment.tz(date, 'YYYY-MM-DD HH:mm:ss', TOKYO_TIMEZONE).format(format)
  }

  // その他の形式の場合は通常通り処理
  return moment(date).tz(TOKYO_TIMEZONE).format(format)
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
 * @returns 東京時間の日付文字列（YYYY-MM-DD HH:mm:ss形式）
 */
export function toTokyoTime(isoString: string): string {
  return moment(isoString).tz(TOKYO_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * データベースから取得した日付文字列を東京時間のmomentオブジェクトとして扱う
 * @param dateString - データベースから取得した日付文字列
 * @returns 東京時間のmomentオブジェクト
 */
export function parseAsTokyoTime(dateString: string): moment.Moment {
  // データベースに保存された値を東京時間として解釈
  return moment.tz(dateString, 'YYYY-MM-DD HH:mm:ss', TOKYO_TIMEZONE)
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
