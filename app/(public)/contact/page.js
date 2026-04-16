'use client';
import { useState } from 'react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const r = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_name: body.name,
        contact_email: body.email,
        contact_phone: body.phone,
        note: body.message,
        items: [],
      }),
    });
    setLoading(false);
    if (r.ok) { setSent(true); e.currentTarget.reset(); }
    else alert('送出失敗，請稍後再試');
  }

  return (
    <div>
      <section className="bg-gray-50 py-16">
        <div className="container text-center">
          <p className="section-sub mb-3">CONTACT</p>
          <h1 className="section-title">聯絡我們</h1>
        </div>
      </section>

      <section className="container py-16 grid md:grid-cols-3 gap-10">
        {/* 公司資訊（左側） */}
        <aside className="md:col-span-1">
          <div className="bg-gray-900 text-white p-8 rounded-lg h-full">
            <h2 className="text-xl font-semibold mb-1">久洋機械股份有限公司</h2>
            <p className="text-xs tracking-widest text-brand mb-6">since 1994</p>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-gray-400 text-xs mb-1">地址</dt>
                <dd>台中市潭子區栗林里民生街197號</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs mb-1">電話</dt>
                <dd><a href="tel:886-4-2537-0971" className="hover:text-brand">886-4-2537-0971</a></dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs mb-1">傳真</dt>
                <dd>886-4-2537-0984</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs mb-1">Email</dt>
                <dd><a href="mailto:poshtech@ms36.hinet.net" className="hover:text-brand break-all">poshtech@ms36.hinet.net</a></dd>
              </div>
            </dl>
          </div>
        </aside>

        {/* 詢價表單（右側） */}
        <div className="md:col-span-2">
          {sent && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
              ✅ 您的訊息已送出，我們將盡快與您聯絡。
            </div>
          )}
          <h2 className="text-2xl font-light mb-6">線上詢價 / 留言</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">姓名 *</label>
              <input name="name" required className="input" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">電子郵件 *</label>
                <input type="email" name="email" required className="input" />
              </div>
              <div>
                <label className="label">聯絡電話</label>
                <input name="phone" className="input" />
              </div>
            </div>
            <div>
              <label className="label">訊息內容 *</label>
              <textarea name="message" required rows={6} className="input" placeholder="請簡述您想詢問的產品或需求" />
            </div>
            <button disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? '送出中…' : '送出訊息'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
