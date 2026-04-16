import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  // 已登入 → 直接跳到後台首頁，不顯示登入表單
  const admin = await getAdminSession();
  if (admin) redirect('/admin');

  return <LoginForm />;
}
