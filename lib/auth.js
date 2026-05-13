import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// 取得 JWT secret:production 必須設環境變數,否則拒絕啟動
function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[auth] JWT_SECRET environment variable is required in production');
    }
    // 開發環境警告但允許 fallback
    if (!global.__jwtWarnLogged) {
      console.warn('[auth] WARNING: JWT_SECRET not set, using insecure dev fallback');
      global.__jwtWarnLogged = true;
    }
    return 'dev-secret-change-me';
  }
  return secret;
}

const ADMIN_COOKIE = 'admin_token';
const MEMBER_COOKIE = 'member_token';

// Production 走 HTTPS 時 cookie 加 secure flag,避免 token 在 HTTP 環境被竊聽
const IS_PROD = process.env.NODE_ENV === 'production';

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}
export function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

export function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, getSecret(), { expiresIn });
}
export function verifyToken(token) {
  try { return jwt.verify(token, getSecret()); } catch { return null; }
}

/* --------- Session helpers (Server components / Route handlers) --------- */

export async function setAdminSession(admin) {
  const token = signToken({ id: admin.id, email: admin.email, role: 'admin' });
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true, secure: IS_PROD, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
  });
}
export async function clearAdminSession() {
  cookies().delete(ADMIN_COOKIE);
}
export async function getAdminSession() {
  const c = cookies().get(ADMIN_COOKIE);
  if (!c) return null;
  return verifyToken(c.value);
}
export function getAdminToken() {
  const c = cookies().get(ADMIN_COOKIE);
  return c?.value || null;
}

export async function setMemberSession(member) {
  const token = signToken({ id: member.id, email: member.email, role: 'member' });
  cookies().set(MEMBER_COOKIE, token, {
    httpOnly: true, secure: IS_PROD, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
  });
}
export async function clearMemberSession() {
  cookies().delete(MEMBER_COOKIE);
}
export async function getMemberSession() {
  const c = cookies().get(MEMBER_COOKIE);
  if (!c) return null;
  return verifyToken(c.value);
}
