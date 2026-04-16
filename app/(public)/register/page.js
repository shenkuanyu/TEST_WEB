'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const r = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    setLoading(false);
    if (r.ok) { router.push('/'); router.refresh(); }
    else { const j = await r.json().catch(() => ({})); setErr(j.error || '註冊失敗'); }
  }

  return (
    <div className="container py-20 max-w-md">
      <h1 className="text-3xl font-light mb-8 text-center">加入會員</h1>
      <form onSubmit={submit} className="space-y-4">
        {err && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{err}</div>}
        <div>
          <label className="label">姓名</label>
          <input name="name" className="input" />
        </div>
        <div>
          <label className="label">Email *</label>
          <input type="email" name="email" required className="input" />
        </div>
        <div>
          <label className="label">密碼 * (至少 6 碼)</label>
          <input type="password" name="password" required minLength={6} className="input" />
        </div>
        <div>
          <label className="label">電話</label>
          <input name="phone" className="input" />
        </div>
        <button disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? '註冊中…' : '註冊'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        已有帳號？<Link href="/login" className="text-gray-900 hover:underline ml-1">立即登入</Link>
      </p>
    </div>
  );
}
