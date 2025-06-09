/**
 * SendGrid互換のMailServiceクラス
 * Cloudflare Workersで動作するよう、REST APIを直接使用
 */

export interface MailDataRequired {
  to: string
  from: string
  subject: string
  text?: string
  html?: string
  replyTo?: string
}

export class MailService {
  private readonly apiKey: string
  private readonly baseUrl = 'https://api.sendgrid.com/v3/mail/send'

  /**
   * コンストラクタ
   * @param apiKey SendGrid APIキー
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('SendGrid API key is required')
    }
    this.apiKey = apiKey
  }

  /**
   * SendGrid APIキーを設定（互換性のため残す）
   * @deprecated Use constructor with API key instead
   */
  setApiKey(apiKey: string): void {
    // 互換性のため残すが、実際には何もしない
    console.warn(
      'setApiKey is deprecated. Pass API key to constructor instead.',
    )
  }

  /**
   * メールを送信
   */
  async send(msg: MailDataRequired): Promise<void> {
    // SendGrid API用のペイロードを構築
    const payload: {
      personalizations: Array<{ to: Array<{ email: string }> }>
      from: { email: string }
      subject: string
      content: Array<{ type: string; value: string }>
      reply_to?: { email: string }
    } = {
      personalizations: [
        {
          to: [{ email: msg.to }],
        },
      ],
      from: { email: msg.from },
      subject: msg.subject,
      content: [],
    }

    // テキストコンテンツを追加
    if (msg.text) {
      payload.content.push({
        type: 'text/plain',
        value: msg.text,
      })
    }

    // HTMLコンテンツを追加
    if (msg.html) {
      payload.content.push({
        type: 'text/html',
        value: msg.html,
      })
    }

    // 返信先を追加
    if (msg.replyTo) {
      payload.reply_to = { email: msg.replyTo }
    }

    // APIリクエストを送信
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    // エラーハンドリング
    if (!response.ok && response.status !== 202) {
      let errorMessage = `SendGrid API error: ${response.status}`
      try {
        const errorBody = await response.text()
        errorMessage += ` - ${errorBody}`
      } catch {
        // エラーボディの取得に失敗した場合は無視
      }
      throw new Error(errorMessage)
    }
  }

  /**
   * 複数のメールを送信（sendと同じ）
   * @sendgrid/mailとの互換性のため
   */
  async sendMultiple(msg: MailDataRequired): Promise<void> {
    return this.send(msg)
  }
}
