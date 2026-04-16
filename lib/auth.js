import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ADMIN_COOKIE = 'admin_token';
const MEMBER_COOKIE = 'member_token';

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}
export function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

export function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, SECRET, { expiresIn });
}
export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

/* --------- Session helpers (Server components / Route handlers) --------- */

export async function setAdminSession(admin) {
  const token = signToken({ id: admin.id, email: admin.email, role: 'admin' });
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
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

export async function setMemberSession(member) {
  const token = signToken({ id: member.id, email: member.email, role: 'member' });
  cookies().set(MEMBER_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
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
