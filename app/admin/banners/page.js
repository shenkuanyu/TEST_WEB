'use client';
import { useEffect, useState } from 'react';

export default function AdminBanners() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const r = await fetch('/api/admin/banners').then(r => r.json());
    setList(r.items || []);
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const url = editing?.id ? `/api/admin/banners/${editing.id}` : '/api/admin/banners';
    const method = editing?.id ? 'PUT' : 'POST';
    const r = await fetch(url, { method, body: fd });
    setLoading(false);
    if (r.ok) { setEditing(null); load(); } else alert('儲存失敗');
  }

  async function remove(id) {
    if (!confirm('確定要刪除？')) return;
    await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">輪播圖管理</h1>
        <button onClick={() => setEditing({})} className="btn-primary">+ 新增輪播圖</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {list.map(b => (
          <div key={b.id} className="bg-white rounded-lg overflow-hidden shadow-sm">
            <img src={b.image} alt={b.title || ''} className="w-full h-auto" />
            <div className="p-4">
              <div className="font-medium">{b.title || '(無標題)'}</div>
              <div className="text-sm text-gray-500">{b.subtitle}</div>
              <div className="mt-2 text-xs text-gray-400">排序：{b.sort_order} · {b.active ? '啟用' : '停用'}</div>
              <div className="mt-3 space-x-3 text-sm">
                <button onClick={() => setEditing(b)} className="text-blue-600 hover:underline">編輯</button>
                <button onClick={() => remove(b.id)} className="text-red-600 hover:underline">刪除</button>
              </div>
            </div>
          </div>
        ))}
        {!list.length && <div className="col-span-full bg-white rounded-lg p-8 text-center text-gray-400">尚無輪播圖</div>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={save} className="p-6 space-y-4" encType="multipart/form-data">
              <h2 className="text-xl font-semibold">{editing.id ? '編輯輪播圖' : '新增輪播圖'}</h2>
              <div><label className="label">主標題</label><input name="title" defaultValue={editing.title || ''} className="input" /></div>
              <div><label className="label">副標題</label><input name="subtitle" defaultValue={editing.subtitle || ''} className="input" /></div>
              <div><label className="label">連結網址</label><input name="link_url" defaultValue={editing.link_url || ''} placeholder="/products" className="input" /></div>
              <div>
                <label className="label">圖片{!editing.id && ' *'}</label>
                <input type="file" name="image" accept="image/*" className="input" required={!editing.id} />
                <p className="mt-1 text-xs text-gray-400">建議尺寸：1920 × 800 px（比例約 16:7），橫幅寬圖效果最佳</p>
                {editing.image && <img src={editing.image} className="w-full h-auto mt-2 rounded" alt="" />}
              </div>
              <div className="flex gap-4 items-center">
                <div><label className="label inline">排序</label><input type="number" name="sort_order" defaultValue={editing.sort_order || 0} className="input w-24 inline" /></div>
                <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={editing.active !== 0} value="1" /> 啟用</label>
              </div>
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
