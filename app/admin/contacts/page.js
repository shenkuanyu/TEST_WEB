'use client';
import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/components/admin/Toast';

export default function AdminContacts() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const fileRef = useRef(null);
  const toast = useToast();

  async function load() {
    const r = await fetch('/api/admin/contacts').then(r => r.json());
    setList(r.items || []);
    setSelected(new Set());
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const url = editing?.id ? `/api/admin/contacts/${editing.id}` : '/api/admin/contacts';
    const method = editing?.id ? 'PUT' : 'POST';
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (r.ok) {
      setEditing(null);
      load();
      toast.success(editing?.id ? '已更新' : '已新增');
    } else {
      toast.error('儲存失敗');
    }
  }

  async function remove(id) {
    if (!confirm('確定要刪除此聯絡人？')) return;
    await fetch(`/api/admin/contacts/${id}`, { method: 'DELETE' });
    load();
  }

  async function bulkDelete() {
    if (!selected.size) return;
    if (!confirm(`確定要刪除勾選的 ${selected.size} 筆聯絡人？`)) return;
    await Promise.all(
      [...selected].map(id => fetch(`/api/admin/contacts/${id}`, { method: 'DELETE' }))
    );
    load();
  }

  async function doImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/admin/contacts/import', { method: 'POST', body: fd });
    setImporting(false);
    e.target.value = '';
    if (r.ok) {
      const j = await r.json();
      toast.success(`匯入成功!共 ${j.imported} 筆`);
      load();
    } else {
      const j = await r.json().catch(() => ({}));
      toast.error('匯入失敗:' + (j.error || '未知錯誤'));
    }
  }

  function doExport() {
    // 若有勾選，僅匯出勾選的；否則匯出全部
    if (selected.size > 0) {
      const ids = [...selected].join(',');
      window.open(`/api/admin/contacts/export?ids=${ids}`, '_blank');
    } else {
      window.open('/api/admin/contacts/export', '_blank');
    }
  }

  const filtered = q
    ? list.filter(c =>
        [c.name, c.company, c.email, c.phone, c.country, c.city, c.comment]
          .some(v => v && String(v).toLowerCase().includes(q.toLowerCase()))
      )
    : list;

  function toggle(id) {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }
  function toggleAll() {
    const filteredIds = filtered.map(c => c.id);
    const allFilteredSelected = filteredIds.every(id => selected.has(id));
    setSelected(prev => {
      const s = new Set(prev);
      if (allFilteredSelected) {
        filteredIds.forEach(id => s.delete(id));
      } else {
        filteredIds.forEach(id => s.add(id));
      }
      return s;
    });
  }

  const filteredIds = filtered.map(c => c.id);
  const allChecked = filtered.length > 0 && filteredIds.every(id => selected.has(id));
  const someChecked = filteredIds.some(id => selected.has(id)) && !allChecked;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">聯絡人</h1>
          <p className="text-gray-500 text-sm mt-1">
            共 {list.length} 筆
            {q && `，符合搜尋 ${filtered.length} 筆`}
            {selected.size > 0 && ` · 已勾選 ${selected.size}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="搜尋姓名 / 公司 / Email…"
            className="input !py-2 !w-60"
          />
          <button onClick={() => setEditing({})} className="btn-primary">+ 新增</button>
          <button onClick={() => fileRef.current.click()} disabled={importing} className="btn-outline disabled:opacity-50">
            {importing ? '匯入中…' : '📥 匯入 Excel'}
          </button>
          <button onClick={doExport} className="btn-outline">
            📤 匯出 Excel{selected.size > 0 && `（${selected.size}）`}
          </button>
          {selected.size > 0 && (
            <button onClick={bulkDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              刪除 {selected.size} 筆
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={doImport}
            className="hidden"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
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
                <th className="p-3">#</th>
                <th>姓名</th>
                <th>公司</th>
                <th>Email</th>
                <th>電話</th>
                <th>國家 / 城市</th>
                <th>留言摘要</th>
                <th>建立時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className={`border-t hover:bg-gray-50 ${selected.has(c.id) ? 'bg-blue-50' : ''}`}>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggle(c.id)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="p-3 text-gray-500">{i + 1}</td>
                  <td className="font-medium">{c.name || '-'}</td>
                  <td className="text-gray-700">{c.company || '-'}</td>
                  <td className="text-gray-700">{c.email || '-'}</td>
                  <td className="text-gray-700 whitespace-nowrap">{c.phone || '-'}</td>
                  <td className="text-gray-500 text-xs">
                    {[c.country, c.city].filter(Boolean).join(' / ') || '-'}
                  </td>
                  <td className="text-gray-500 max-w-xs truncate" title={c.comment || ''}>{c.comment || '-'}</td>
                  <td className="text-gray-400 text-xs whitespace-nowrap">{c.created_at?.slice(0, 10)}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button onClick={() => setEditing(c)} className="text-blue-600 hover:underline">編輯</button>
                    <button onClick={() => remove(c.id)} className="text-red-600 hover:underline">刪除</button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-400">
                    {list.length ? '沒有符合搜尋的聯絡人' : '尚無聯絡人資料，可點「匯入 Excel」或「新增」'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={save} className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">{editing.id ? '編輯聯絡人' : '新增聯絡人'}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="label">姓名</label><input name="name" defaultValue={editing.name || ''} className="input" /></div>
                <div><label className="label">公司</label><input name="company" defaultValue={editing.company || ''} className="input" /></div>
                <div><label className="label">Email</label><input name="email" type="email" defaultValue={editing.email || ''} className="input" /></div>
                <div><label className="label">電話</label><input name="phone" defaultValue={editing.phone || ''} className="input" /></div>
                <div><label className="label">傳真</label><input name="fax" defaultValue={editing.fax || ''} className="input" /></div>
                <div><label className="label">國家</label><input name="country" defaultValue={editing.country || ''} className="input" /></div>
                <div className="md:col-span-2"><label className="label">城市</label><input name="city" defaultValue={editing.city || ''} className="input" /></div>
                <div className="md:col-span-2"><label className="label">地址</label><input name="address" defaultValue={editing.address || ''} className="input" /></div>
                <div className="md:col-span-2"><label className="label">留言 / 備註</label><textarea name="comment" rows={5} defaultValue={editing.comment || ''} className="input" /></div>
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
