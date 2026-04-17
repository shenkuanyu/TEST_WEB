'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ContactPage() {
  const searchParams = useSearchParams();
  const productName = searchParams.get('product') || '';
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 從產品頁點「產品詢價」過來時，自動帶入產品名稱
  useEffect(() => {
    if (productName) {
      setMessage(`您好，我想詢問關於「${productName}」的價格與規格資訊。\n\n`);
    }
  }, [productName]);

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
          {productName && (
            <div className="mb-4 p-4 bg-brand/5 border border-brand/20 rounded-lg flex items-center gap-3">
              <svg className="w-6 h-6 text-brand shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              <div>
                <p className="text-sm text-gray-600">您正在詢問的產品：</p>
                <p className="font-semibold text-gray-900">{productName}</p>
              </div>
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
              <textarea name="message" required rows={6} className="input" placeholder="請簡述您想詢問的產品或需求" value={message} onChange={e => setMessage(e.target.value)} />
            </div>
            <button disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? '送出中…' : '送出訊息'}
            </button>
          </form>
        </div>
      </section>

      {/* Google 地圖 */}
      <section className="bg-gray-50">
        <div className="container py-12">
          <p className="section-sub mb-2 text-center">LOCATION</p>
          <h2 className="section-title text-center mb-8">交通位置</h2>
          <div className="rounded-lg overflow-hidden shadow-sm" style={{ height: 400 }}>
            <iframe
              src="https://www.google.com/maps?q=%E5%8F%B0%E4%B8%AD%E5%B8%82%E6%BD%AD%E5%AD%90%E5%8D%80%E6%B0%91%E7%94%9F%E8%A1%97197%E8%99%9F&z=16&output=embed&hl=zh-TW"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="久洋機械位置"
            />
          </div>
          <p className="text-sm text-gray-500 mt-3 text-center">
            台中市潭子區栗林里民生街197號（近潭子交流道）
          </p>
        </div>
      </section>
    </div>
  );
}
