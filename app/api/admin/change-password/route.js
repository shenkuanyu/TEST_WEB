import { NextResponse } from 'next/server';
import { getDB } from '@/lib/admin-db';
import { getAllSettings } from '@/lib/settings';
import { getAdminSession, hashPassword, verifyPassword } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 記憶體中的驗證碼存放（key = adminId, value = { code, expiresAt }）
const verificationCodes = new Map();

/**
 * POST: 發送驗證碼 / 驗證並修改密碼
 * body.action = 'send-code' → 發送驗證碼到 smtp_notify_to
 * body.action = 'change'    → 驗證碼正確後修改密碼
 */
export async function POST(req) {
  // 檢查登入狀態
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (action === 'send-code') {
    return handleSendCode(session);
  }
  if (action === 'change') {
    return handleChange(session, body);
  }

  return NextResponse.json({ error: '無效的操作' }, { status: 400 });
}

/** 發送驗證碼 */
async function handleSendCode(session) {
  const db = getDB();
  const st = getAllSettings(db);

  // 取得收件信箱：smtp_notify_to → contact_email fallback
  const toEmail = st.smtp_notify_to || st.contact_email;
  if (!toEmail) {
    return NextResponse.json({ error: '尚未設定通知收件信箱，請先至 SMTP 設定填寫' }, { status: 400 });
  }

  // 產生 6 位數驗證碼，5 分鐘內有效
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 5 * 60 * 1000;
  verificationCodes.set(session.id, { code, expiresAt, attempts: 0 });

  try {
    const siteName = st.site_name || '網站';
    await sendMail({
      to: toEmail,
      subject: `[${siteName}] 後台密碼修改驗證碼`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333; max-width:480px;">
          <h2 style="color:#a50104; margin-bottom:8px;">密碼修改驗證碼</h2>
          <p>您正在修改後台管理員密碼，請使用以下驗證碼：</p>
          <div style="background:#f3f4f6; border-radius:8px; padding:20px; text-align:center; margin:16px 0;">
            <span style="font-size:32px; font-weight:bold; letter-spacing:8px; color:#111;">${code}</span>
          </div>
          <p style="color:#666; font-size:13px;">此驗證碼將於 <strong>5 分鐘</strong>後失效。若非本人操作，請忽略此信。</p>
          <hr style="border:none; border-top:1px solid #e5e7eb; margin:16px 0;"/>
          <p style="color:#999; font-size:12px;">此信由 ${siteName} 後台系統自動發送，請勿回覆。</p>
        </div>
      `,
    }, st);

    // 遮蔽信箱顯示
    const masked = maskEmail(toEmail);
    return NextResponse.json({ ok: true, email: masked });
  } catch (err) {
    return NextResponse.json({ error: `寄信失敗：${err?.message || err}` }, { status: 500 });
  }
}

/** 驗證碼正確後修改密碼 */
async function handleChange(session, body) {
  const { code, currentPassword, newPassword } = body;

  if (!code || !currentPassword || !newPassword) {
    return NextResponse.json({ error: '請填寫所有欄位' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: '新密碼至少需要 6 個字元' }, { status: 400 });
  }

  // 驗證碼檢查
  const stored = verificationCodes.get(session.id);
  if (!stored) {
    return NextResponse.json({ error: '請先發送驗證碼' }, { status: 400 });
  }
  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(session.id);
    return NextResponse.json({ error: '驗證碼已過期，請重新發送' }, { status: 400 });
  }
  // 防暴力嘗試
  stored.attempts = (stored.attempts || 0) + 1;
  if (stored.attempts > 5) {
    verificationCodes.delete(session.id);
    return NextResponse.json({ error: '驗證碼嘗試次數過多，請重新發送' }, { status: 400 });
  }
  if (stored.code !== code.trim()) {
    return NextResponse.json({ error: `驗證碼錯誤（剩餘 ${5 - stored.attempts} 次嘗試）` }, { status: 400 });
  }

  // 驗證舊密碼
  const db = getDB();
  const admin = db.prepare('SELECT * FROM admins WHERE id=?').get(session.id);
  if (!admin) {
    return NextResponse.json({ error: '管理員帳號不存在' }, { status: 404 });
  }
  if (!verifyPassword(currentPassword, admin.password_hash)) {
    return NextResponse.json({ error: '目前密碼不正確' }, { status: 400 });
  }

  // 更新密碼
  const newHash = hashPassword(newPassword);
  db.prepare('UPDATE admins SET password_hash=? WHERE id=?').run(newHash, session.id);

  // 清除已使用的驗證碼
  verificationCodes.delete(session.id);

  return NextResponse.json({ ok: true });
}

/** 遮蔽 email 中間部分 */
function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (local.length <= 3) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}
