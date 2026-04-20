import { NextResponse } from 'next/server';
import { handleLineWebhook } from '@/lib/line-notify';
import crypto from 'crypto';
import { getAllSettings } from '@/lib/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * LINE Messaging API Webhook
 * LINE 伺服器會 POST 事件到這裡（加好友、封鎖等）
 */
export async function POST(req) {
  try {
    const body = await req.text();
    const st = getAllSettings();
    const channelSecret = st.line_channel_secret;

    // 驗證簽名（如果有設定 Channel Secret）
    if (channelSecret) {
      const signature = req.headers.get('x-line-signature');
      const hash = crypto
        .createHmac('SHA256', channelSecret)
        .update(body)
        .digest('base64');

      if (signature !== hash) {
        console.warn('[LINE Webhook] 簽名驗證失敗');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    const data = JSON.parse(body);
    const events = data.events || [];

    if (events.length > 0) {
      // 非同步處理，不阻塞回應
      handleLineWebhook(events).catch(err => {
        console.error('[LINE Webhook] 處理事件失敗:', err?.message);
      });
    }

    // LINE 要求 Webhook 回傳 200
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[LINE Webhook] Error:', err?.message);
    return NextResponse.json({ ok: true }); // 即使出錯也回 200，避免 LINE 重試
  }
}

/**
 * LINE 設定 Webhook URL 時會先 GET 驗證
 */
export async function GET() {
  return NextResponse.json({ ok: true, message: 'LINE Webhook is active' });
}
