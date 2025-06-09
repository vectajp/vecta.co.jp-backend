import { MailService } from './mail-service'

export interface EmailData {
  name: string
  email: string
  subject: string
  message: string
  submittedAt: string
}

export async function sendContactEmail(
  data: EmailData,
  env: Env,
): Promise<void> {
  // MailServiceのインスタンスを作成
  const mailer = new MailService(env.SENDGRID_API_KEY)

  const textContent = `
新しいお問い合わせがありました。

■お名前
${data.name}

■メールアドレス
${data.email}

■件名
${data.subject}

■お問い合わせ内容
${data.message}

■受信日時
${data.submittedAt}
  `.trim()

  const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>お問い合わせ</title>
</head>
<body style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c3e50;">新しいお問い合わせがありました</h2>

    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; width: 30%;">お名前</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.name}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">メールアドレス</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
          <a href="mailto:${data.email}">${data.email}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">件名</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.subject}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; vertical-align: top;">お問い合わせ内容</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; white-space: pre-wrap;">${data.message}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold;">受信日時</td>
        <td style="padding: 10px;">${data.submittedAt}</td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim()

  // メールメッセージを構築
  const msg = {
    to: env.MAIL_TO,
    from: { email: env.MAIL_FROM, name: 'Vectaお知らせ' },
    replyTo: data.email,
    subject: `【お問い合わせ】${data.subject}`,
    text: textContent,
    html: htmlContent,
  }

  // メールを送信
  try {
    await mailer.send(msg)
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}
