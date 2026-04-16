'use client';
import { useEffect, useState } from 'react';

export default function AdminOrders() {
  const [list, setList] = useState([]);
  const [view, setView] = useState(null);

  async function load() {
    const r = await fetch('/api/admin/orders').then(r => r.json());
    setList(r.items || []);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id, status) {
    await fetch(`/api/admin/orders?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }
  async function remove(id) {
    if (!confirm('確定要刪除？')) return;
    await fetch(`/api/admin/orders?id=${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">訂單 / 詢問</h1>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">ID</th><th>姓名</th><th>Email</th><th>電話</th><th>狀態</th><th>金額</th><th>時間</th><th>操作</th></tr>
          </thead>
          <tbody>
            {list.map(o => (
              <tr key={o.id} className="border-t">
                <td className="p-3 text-gray-500">#{o.id}</td>
                <td>{o.contact_name}</td>
                <td>{o.contact_email}</td>
                <td>{o.contact_phone || '-'}</td>
                <td>
                  <select value={o.status} onChange={e => setStatus(o.id, e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-xs">
                    <option value="pending">待處理</option>
                    <option value="processing">處理中</option>
                    <option value="done">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </td>
                <td>{o.total ? `NT$ ${o.total}` : '-'}</td>
                <td className="text-gray-500">{o.created_at?.slice(0, 16)}</td>
                <td className="space-x-2">
                  <button onClick={() => setView(o)} className="text-blue-600 hover:underline">查看</button>
                  <button onClick={() => remove(o.id)} className="text-red-600 hover:underline">刪除</button>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={8} className="p-6 text-center text-gray-400">尚無資料</td></tr>}
          </tbody>
        </table>
      </div>

      {view && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4">訂單 / 詢問詳情</h2>
            <dl className="text-sm space-y-2">
              <Row k="姓名" v={view.contact_name} />
              <Row k="Email" v={view.contact_email} />
              <Row k="電話" v={view.contact_phone} />
              <Row k="地址" v={view.address} />
              <Row k="留言" v={view.note} />
              <Row k="狀態" v={view.status} />
              <Row k="時間" v={view.created_at} />
            </dl>
            <div className="text-right mt-6">
              <button onClick={() => setView(null)} className="btn-outline">關閉</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex border-b py-1.5">
      <dt className="w-20 text-gray-500">{k}</dt>
      <dd className="flex-1 whitespace-pre-wrap">{v || '-'}</dd>
    </div>
  );
}
