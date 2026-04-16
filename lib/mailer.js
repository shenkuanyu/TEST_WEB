import nodemailer from 'nodemailer';
import { getAllSettings } from './settings';

/**
 * 依據 site_settings 內的 SMTP 設定建立一個 transporter。
 * 若 smtp_enabled=0 或關鍵欄位缺漏，回傳 null。
 */
export function getTransporter(s = null) {
  const st = s || getAllSettings();
  if (st.smtp_enabled !== '1') return null;
  if (!st.smtp_host || !st.smtp_user) return null;

  const port = Number(st.smtp_port || 465);
  const secure = st.smtp_secure === 'ssl' ? true : false; // ssl = implicit, tls = STARTTLS
  const requireTLS = st.smtp_secure === 'tls';

  return nodemailer.createTransport({
    host: st.smtp_host,
    port,
    secure,
    requireTLS,
    auth: st.smtp_pass ? { user: st.smtp_user, pass: st.smtp_pass } : undefined,
  });
}

/**
 * 發送通用郵件。options 支援：
 *   to, subject, text, html, replyTo
 * 如果 SMTP 未設定會直接 throw。
 */
export async function sendMail(options, settingsOverride) {
  const st = settingsOverride || getAllSettings();
  const transporter = getTransporter(st);
  if (!transporter) throw new Error('SMTP 未啟用或設定不完整');

  const fromEmail = st.smtp_from_email || st.smtp_user;
  const fromName = st.smtp_from_name || st.site_name || 'Website';
  const from = `"${fromName}" <${fromEmail}>`;

  return transporter.sendMail({ from, ...options });
}

/**
 * 當收到新詢價時，寄兩封信：
 *   1. 給管理員的通知信
 *   2. 給客戶的自動回覆（若 smtp_auto_reply=1 且有客戶 email）
 *
 * order 物件包含：contact_name, contact_email, contact_phone, note, items...
 * 本函式不會 throw（失敗時只 log），避免影響主流程。
 */
export async function notifyNewOrder(order) {
  try {
    const st = getAllSettings();
    if (st.smtp_enabled !== '1') return;
    const transporter = getTransporter(st);
    if (!transporter) return;

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
      });
    }

    // 2. 給客戶的自動回覆
    if (st.smtp_auto_reply === '1' && order.contact_email) {
      const html = buildCustomerMail(order, siteName, st);
      await sendMail({
        to: order.contact_email,
        subject: `[${siteName}] 我們已收到您的訊息`,
        html,
      });
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
