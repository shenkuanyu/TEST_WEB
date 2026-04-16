'use client';
import { useEffect, useState } from 'react';

export default function AdminNews() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const r = await fetch('/api/admin/news').then(r => r.json());
    setList(r.items || []);
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const url = editing?.id ? `/api/admin/news/${editing.id}` : '/api/admin/news';
    const method = editing?.id ? 'PUT' : 'POST';
    const r = await fetch(url, { method, body: fd });
    setLoading(false);
    if (r.ok) { setEditing(null); load(); } else alert('儲存失敗');
  }

  async function remove(id) {
    if (!confirm('確定要刪除？')) return;
    await fetch(`/api/admin/news/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">最新消息</h1>
        <button onClick={() => setEditing({})} className="btn-primary">+ 新增消息</button>
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="p-3">ID</th><th>標題</th><th>狀態</th><th>建立時間</th><th>操作</th></tr>
          </thead>
          <tbody>
            {list.map(n => (
              <tr key={n.id} className="border-t">
                <td className="p-3 text-gray-500">#{n.id}</td>
                <td className="font-medium">{n.title}</td>
                <td>{n.published ? <span className="text-green-600">已發布</span> : <span className="text-gray-400">草稿</span>}</td>
                <td className="text-gray-500">{n.created_at?.slice(0, 16)}</td>
                <td className="space-x-2">
                  <button onClick={() => setEditing(n)} className="text-blue-600 hover:underline">編輯</button>
                  <button onClick={() => remove(n.id)} className="text-red-600 hover:underline">刪除</button>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={5} className="p-6 text-center text-gray-400">尚無消息</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={save} className="p-6 space-y-4" encType="multipart/form-data">
              <h2 className="text-xl font-semibold">{editing.id ? '編輯消息' : '新增消息'}</h2>
              <div><label className="label">標題 *</label><input name="title" required defaultValue={editing.title || ''} className="input" /></div>
              <div><label className="label">摘要</label><input name="summary" defaultValue={editing.summary || ''} className="input" /></div>
              <div><label className="label">內容</label><textarea name="content" rows={10} defaultValue={editing.content || ''} className="input" /></div>
              <div>
                <label className="label">封面圖</label>
                <input type="file" name="cover_image" accept="image/*" className="input" />
                <p className="mt-1 text-xs text-gray-400">建議尺寸：960 × 540 px（16:9 比例），用於消息列表及內頁封面</p>
                {editing.cover_image && <img src={editing.cover_image} className="w-32 h-20 mt-2 rounded object-cover" alt="" />}
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={editing.published !== 0} value="1" /> 發布</label>
              <div className="flex gap-2 justify-end pt-4 border-t">
                <button type="button" onClick={() => setEditing(null)} className="btn-outline">取消</button>
                <button disabled={loading} className="btn-primary disabled:opacity-50">{loading ? '儲存中…' : '儲存'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
