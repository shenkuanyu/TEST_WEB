import { getAllSettings } from './settings';
import { getDB } from './db';

const API_BASE = 'https://api.line.me/v2/bot';

/**
 * 取得所有已訂閱通知的 LINE 使用者 ID
 */
export function getLineSubscribers(db) {
  const d = db || getDB();
  try {
    const rows = d.prepare('SELECT user_id, display_name FROM line_subscribers WHERE active=1').all();
    return rows;
  } catch {
    return [];
  }
}

/**
 * 取得 LINE 使用者的顯示名稱
 */
async function getProfile(token, userId) {
  try {
    const res = await fetch(`${API_BASE}/profile/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

/**
 * 處理 LINE Webhook 事件
 * - follow: 使用者加好友 → 儲存 userId
 * - unfollow: 使用者封鎖 → 標記 inactive
 */
export async function handleLineWebhook(events) {
  const st = getAllSettings();
  const token = st.line_channel_token;
  if (!token) return;

  const db = getDB();

  // 確保資料表存在
  db.exec(`
    CREATE TABLE IF NOT EXISTS line_subscribers (
      user_id TEXT PRIMARY KEY,
      display_name TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const upsert = db.prepare(`
    INSERT INTO line_subscribers (user_id, display_name, active)
    VALUES (?, ?, 0)
    ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name
  `);
  const deactivate = db.prepare('UPDATE line_subscribers SET active=0 WHERE user_id=?');

  for (const event of events) {
    if (event.type === 'follow') {
      const profile = await getProfile(token, event.source.userId);
      upsert.run(event.source.userId, profile?.displayName || '未知');
    } else if (event.type === 'unfollow') {
      deactivate.run(event.source.userId);
    }
  }
}

/**
 * 廣播文字訊息給所有追蹤者（不需要讀取訂閱者資料表，兩站共用）
 */
export async function broadcastMessage(message, settingsOverride) {
  const st = settingsOverride || getAllSettings();
  if (st.line_notify_enabled !== '1') return;
  const token = st.line_channel_token;
  if (!token) return;

  const res = await fetch(`${API_BASE}/message/broadcast`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ type: 'text', text: message }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`LINE broadcast ${res.status}: ${body}`);
  }
  return res.json();
}

/**
 * 推送文字訊息給所有訂閱者（向後相容，fallback 到 broadcast）
 */
export async function pushMessageToAll(message, settingsOverride) {
  const st = settingsOverride || getAllSettings();
  if (st.line_notify_enabled !== '1') return;
  const token = st.line_channel_token;
  if (!token) return;

  const subscribers = getLineSubscribers();

  // 若無本地訂閱者紀錄，使用 broadcast（適用零組件站共用 LINE）
  if (!subscribers.length) {
    return broadcastMessage(message, st);
  }

  const results = await Promise.allSettled(
    subscribers.map(sub =>
      fetch(`${API_BASE}/message/push`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: sub.user_id,
          messages: [{
            type: 'text',
            text: message,
          }],
        }),
      }).then(async (res) => {
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`LINE API ${res.status}: ${body}`);
        }
      })
    )
  );

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[LINE] 推播給 ${subscribers[i].display_name} 失敗:`, r.reason?.message);
    }
  });

  return results;
}

/**
 * 當收到新詢價時，推送 LINE 通知給所有訂閱者
 */
export async function notifyNewOrderLine(order) {
  try {
    const st = getAllSettings();
    if (st.line_notify_enabled !== '1') return;

    const siteName = st.site_name || '網站';
    const lines = [
      `📩 ${siteName} — 新詢價通知`,
      `━━━━━━━━━━━━━━━`,
      `👤 姓名：${order.contact_name || '未具名'}`,
      `📧 Email：${order.contact_email || '-'}`,
    ];

    if (order.contact_phone) lines.push(`📞 電話：${order.contact_phone}`);
    if (order.address) lines.push(`📍 地址：${order.address}`);

    lines.push(`━━━━━━━━━━━━━━━`);
    lines.push(`💬 訊息內容：`);
    lines.push(order.note || '（無）');

    await broadcastMessage(lines.join('\n'), st);
  } catch (err) {
    console.error('[LINE] notifyNewOrderLine failed:', err?.message || err);
  }
}

/**
 * 發送測試訊息給指定使用者
 */
export async function testLinePush(token, userId) {
  const res = await fetch(`${API_BASE}/message/push`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: userId,
      messages: [{
        type: 'text',
        text: '✅ LINE 通知測試成功！\n此訊息來自網站後台 Messaging API。',
      }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`LINE API ${res.status}: ${body}`);
  }

  return res.json();
}
