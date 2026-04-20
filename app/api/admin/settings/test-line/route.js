import { NextResponse } from 'next/server';
import { testLinePush, getLineSubscribers } from '@/lib/line-notify';
import { getAllSettings } from '@/lib/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const st = getAllSettings();
    const token = st.line_channel_token;
    if (!token) {
      return NextResponse.json({ error: 'Channel Access Token 尚未設定' }, { status: 400 });
    }

    const subscribers = getLineSubscribers();
    if (!subscribers.length) {
      return NextResponse.json({ error: '目前沒有人加入好友，請先掃描 QR Code 加入 LINE 官方帳號' }, { status: 400 });
    }

    // 發送測試訊息給所有訂閱者
    const results = [];
    for (const sub of subscribers) {
      try {
        await testLinePush(token, sub.user_id);
        results.push({ name: sub.display_name, ok: true });
      } catch (err) {
        results.push({ name: sub.display_name, ok: false, error: err.message });
      }
    }

    const success = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok).length;

    return NextResponse.json({
      ok: true,
      message: `已發送測試訊息：${success} 成功${failed ? `，${failed} 失敗` : ''}`,
      results,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || '發送失敗' }, { status: 500 });
  }
}
