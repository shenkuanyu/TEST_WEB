'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

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
      <h1 className="text-2xl font-light text-center mb-6">後台登入</h1>
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
    </div>
  );
}
