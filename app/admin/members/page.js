'use client';
import { useEffect, useState } from 'react';

export default function AdminMembers() {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(new Set());

  async function load() {
    const r = await fetch('/api/admin/members').then(r => r.json());
    setList(r.items || []);
    setSelected(new Set());
  }
  useEffect(() => { load(); }, []);

  function toggle(id) {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }
  function toggleAll() {
    setSelected(prev =>
      prev.size === list.length ? new Set() : new Set(list.map(m => m.id))
    );
  }

  async function remove(id) {
    if (!confirm('確定要刪除此會員？')) return;
    await fetch(`/api/admin/members?id=${id}`, { method: 'DELETE' });
    load();
  }

  async function bulkDelete() {
    if (!selected.size) return;
    if (!confirm(`確定要刪除勾選的 ${selected.size} 位會員？`)) return;
    await Promise.all(
      [...selected].map(id => fetch(`/api/admin/members?id=${id}`, { method: 'DELETE' }))
    );
    load();
  }

  const allChecked = list.length > 0 && selected.size === list.length;
  const someChecked = selected.size > 0 && !allChecked;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">會員管理</h1>
          <p className="text-gray-500 text-sm mt-1">
            共 {list.length} 筆{selected.size > 0 && ` · 已勾選 ${selected.size}`}
          </p>
        </div>
        {selected.size > 0 && (
          <button onClick={bulkDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            刪除勾選的 {selected.size} 筆
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={el => { if (el) el.indeterminate = someChecked; }}
                  onChange={toggleAll}
                  className="w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="p-3">ID</th>
              <th>姓名</th>
              <th>Email</th>
              <th>電話</th>
              <th>註冊時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map(m => (
              <tr key={m.id} className={`border-t hover:bg-gray-50 ${selected.has(m.id) ? 'bg-blue-50' : ''}`}>
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(m.id)}
                    onChange={() => toggle(m.id)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="p-3 text-gray-500">#{m.id}</td>
                <td>{m.name || '-'}</td>
                <td>{m.email}</td>
                <td>{m.phone || '-'}</td>
                <td className="text-gray-500">{m.created_at?.slice(0, 16)}</td>
                <td>
                  <button onClick={() => remove(m.id)} className="text-red-600 hover:underline">刪除</button>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={7} className="p-6 text-center text-gray-400">尚無會員</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
