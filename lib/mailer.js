import { getAllSettings } from './settings';

/**
 * 寄信核心：優先使用 Resend API（不受 SMTP port 封鎖影響），
 * 若未設定 Resend 則 fallback 到傳統 SMTP（nodemailer）。
 */

/**
 * 透過 Resend API 寄信
 */
async function sendViaResend(apiKey, from, options) {
  const body = {
    from,
    to: [options.to],
    subject: options.subject,
  };
  if (options.html) body.html = options.html;
  if (options.text) body.text = options.text;
  if (options.replyTo) body.reply_to = options.replyTo;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Resend API ${res.status}: ${errBody}`);
  }
  return res.json();
}

/**
 * 透過 SMTP (nodemailer) 寄信
 */
async function sendViaSMTP(st, from, options) {
  const nodemailer = (await import('nodemailer')).default;

  const port = Number(st.smtp_port || 465);
  const secure = st.smtp_secure === 'ssl' ? true : false;
  const requireTLS = st.smtp_secure === 'tls';

  const transporter = nodemailer.createTransport({
    host: st.smtp_host,
    port,
    secure,
    requireTLS,
    auth: st.smtp_pass ? { user: st.smtp_user, pass: st.smtp_pass } : undefined,
  });

  return transporter.sendMail({ from, ...options });
}

/**
 * 發送通用郵件。options 支援：
 *   to, subject, text, html, replyTo
 */
export async function sendMail(options, settingsOverride) {
  const st = settingsOverride || getAllSettings();
  if (st.smtp_enabled !== '1') throw new Error('寄信功能未啟用');

  const fromEmail = st.smtp_from_email || st.smtp_user || 'noreply@poshtech.com.tw';
  const fromName = st.smtp_from_name || st.site_name || 'Website';
  const from = `${fromName} <${fromEmail}>`;

  // 優先使用 Resend API
  if (st.resend_api_key) {
    return sendViaResend(st.resend_api_key, from, options);
  }

  // Fallback: 傳統 SMTP
  if (!st.smtp_host || !st.smtp_user) {
    throw new Error('寄信設定不完整：請設定 Resend API Key 或 SMTP');
  }
  return sendViaSMTP(st, from, options);
}

// 向後相容：部分程式碼可能用到 getTransporter
export function getTransporter(s = null) {
  const st = s || getAllSettings();
  if (st.smtp_enabled !== '1') return null;
  if (st.resend_api_key) return { _resend: true }; // 標記為 Resend 模式
  if (!st.smtp_host || !st.smtp_user) return null;
  return { _smtp: true };
}

/**
 * 當收到新詢價時，寄兩封信：
 *   1. 給管理員的通知信
 *   2. 給客戶的自動回覆（若 smtp_auto_reply=1 且有客戶 email）
 */
export async function notifyNewOrder(order) {
  try {
    const st = getAllSettings();
    if (st.smtp_enabled !== '1') return;
    if (!st.resend_api_key && (!st.smtp_host || !st.smtp_user)) return;

    const toAdmin = st.smtp_notify_to || st.contact_email;
    const siteName = st.site_name || 'Website';

    // 1. 給管理員
    if (toAdmin) {
      const html = buildAdminMail(order, siteName);
      await sendMail({
        to: toAdmin,
        subject: `[${siteName}] 新的詢價 / 聯絡訊息 — ${order.contact_name || '未具名'}`,
        html,
        replyTo: order.contact_email || undefined,
      }, st);
    }

    // 2. 給客戶的自動回覆
    if (st.smtp_auto_reply === '1' && order.contact_email) {
      const html = buildCustomerMail(order, siteName, st);
      await sendMail({
        to: order.contact_email,
        subject: `[${siteName}] 我們已收到您的訊息`,
        html,
      }, st);
    }
  } catch (err) {
    console.error('[mailer] notifyNewOrder failed:', err?.message || err);
  }
}

function escape(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function buildAdminMail(o, siteName) {
  return `
    <div style="font-family: Arial, 'Noto Sans TC', sans-serif; line-height:1.6; color:#333;">
      <h2 style="color:#a50104;">${escape(siteName)} — 新的詢價 / 聯絡訊息</h2>
      <table cellpadding="8" style="border-collapse:collapse;">
        <tr><td style="color:#666;">姓名</td><td>${escape(o.contact_name)}</td></tr>
        <tr><td style="color:#666;">Email</td><td>${escape(o.contact_email)}</td></tr>
        <tr><td style="color:#666;">電話</td><td>${escape(o.contact_phone) || '-'}</td></tr>
        <tr><td style="color:#666;">地址</td><td>${escape(o.address) || '-'}</td></tr>
      </table>
      <h3 style="margin-top:24px;">訊息內容</h3>
      <div style="padding:12px;background:#f8f8f8;border-left:4px solid #a50104;white-space:pre-wrap;">${escape(o.note)}</div>
      <p style="margin-top:24px;color:#999;font-size:12px;">此信由後台自動寄出，可直接按「回覆」聯絡客戶。</p>
    </div>
  `;
}

function buildCustomerMail(o, siteName, st) {
  const phone = st.contact_phone || '';
  const email = st.contact_email || '';
  return `
    <div style="font-family: Arial, 'Noto Sans TC', sans-serif; line-height:1.8; color:#333;">
      <h2 style="color:#a50104;">${escape(siteName)}</h2>
      <p>${escape(o.contact_name)} 您好，</p>
      <p>我們已收到您的訊息，將於工作時間內儘速與您聯絡，感謝您的來信。</p>
      <h3 style="color:#a50104;margin-top:24px;">您提供的資料</h3>
      <table cellpadding="6" style="border-collapse:collapse;background:#f8f8f8;">
        <tr><td style="color:#666;">姓名</td><td>${escape(o.contact_name)}</td></tr>
        <tr><td style="color:#666;">Email</td><td>${escape(o.contact_email)}</td></tr>
        <tr><td style="color:#666;">電話</td><td>${escape(o.contact_phone) || '-'}</td></tr>
      </table>
      <p style="margin-top:20px;"><strong>訊息內容：</strong></p>
      <div style="padding:12px;background:#f8f8f8;border-left:4px solid #a50104;white-space:pre-wrap;">${escape(o.note)}</div>
      <hr style="margin:28px 0;border:none;border-top:1px solid #eee;"/>
      <p style="color:#666;font-size:14px;">
        ${escape(siteName)}<br/>
        TEL：${escape(phone)}<br/>
        E-mail：${escape(email)}
      </p>
      <p style="color:#aaa;font-size:12px;">此為系統自動發送之回覆信件，請勿直接回覆。</p>
    </div>
  `;
}
