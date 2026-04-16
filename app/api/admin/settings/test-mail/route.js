import { NextResponse } from 'next/server';
import { getAllSettings } from '@/lib/settings';
import { sendMail } from '@/lib/mailer';
import { getDB } from '@/lib/admin-db';

export const runtime = 'nodejs';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const to = body.to;
  if (!to) return NextResponse.json({ error: '請輸入測試收件人' }, { status: 400 });

  const db = getDB();
  const st = getAllSettings(db);
  if (st.smtp_enabled !== '1') {
    return NextResponse.json({ error: 'SMTP 尚未啟用，請先在設定中勾選「啟用 SMTP」' }, { status: 400 });
  }

  try {
    const info = await sendMail({
      to,
      subject: `[${st.site_name || 'Website'}] SMTP 測試信`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
          <h2 style="color:#a50104;">SMTP 設定測試成功 ✅</h2>
          <p>您的網站 SMTP 寄信功能已正確設定，可以正常發送信件。</p>
          <hr/>
          <p style="color:#999;font-size:12px;">此信由 ${new Date().toLocaleString('zh-TW')} 發送。</p>
        </div>
      `,
    }, st);  // 傳入 admin DB 讀出的 settings
    return NextResponse.json({ ok: true, messageId: info?.messageId || null });
  } catch (err) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
