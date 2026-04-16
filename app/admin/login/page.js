'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    // 根據網域顯示站別
    const host = window.location.hostname;
    if (host.includes('parts')) {
      setSiteName('零組件站');
    } else if (host.includes('poshtech')) {
      setSiteName('機台站');
    } else {
      setSiteName('後台');
    }
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const r = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    setLoading(false);
    if (r.ok) { router.push('/admin'); router.refresh(); }
    else { const j = await r.json().catch(() => ({})); setErr(j.error || '登入失敗'); }
  }

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm">
      <h1 className="text-2xl font-light text-center mb-2">後台登入</h1>
      {siteName && (
        <p className="text-center text-sm text-gray-500 mb-6">
          登入到 <span className="font-semibold text-brand">{siteName}</span> 管理
        </p>
      )}
      <form onSubmit={submit} className="space-y-4">
        {err && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{err}</div>}
        <div>
          <label className="label">帳號</label>
          <input type="text" name="email" required className="input" placeholder="請輸入管理員帳號" autoComplete="username" />
        </div>
        <div>
          <label className="label">密碼</label>
          <input type="password" name="password" required className="input" />
        </div>
        <button disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? '登入中…' : '登入後台'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t text-center text-sm text-gray-400">
        <a href="https://poshtech.com.tw/admin/login" className="hover:text-brand transition">機台後台</a>
        <span className="mx-2">|</span>
        <a href="https://parts.poshtech.com.tw/admin/login" className="hover:text-brand transition">零組件後台</a>
      </div>
    </div>
  );
}
