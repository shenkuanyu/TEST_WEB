'use client';
import { useEffect, useState } from 'react';

const POSITION_OPTIONS = [
  { value: 'left top',     label: '↖' },
  { value: 'center top',   label: '↑' },
  { value: 'right top',    label: '↗' },
  { value: 'left center',  label: '←' },
  { value: 'center',       label: '●' },
  { value: 'right center', label: '→' },
  { value: 'left bottom',  label: '↙' },
  { value: 'center bottom',label: '↓' },
  { value: 'right bottom', label: '↘' },
];

export default function AdminBanners() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imgPos, setImgPos] = useState('center');

  async function load() {
    const r = await fetch('/api/admin/banners').then(r => r.json());
    setList(r.items || []);
  }
  useEffect(() => { load(); }, []);

  function openEdit(banner) {
    setEditing(banner);
    setPreviewUrl(banner.image || null);
    setImgPos(banner.image_position || 'center');
  }

  function openNew() {
    setEditing({});
    setPreviewUrl(null);
    setImgPos('center');
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }

  async function save(e) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set('image_position', imgPos);
    const url = editing?.id ? `/api/admin/banners/${editing.id}` : '/api/admin/banners';
    const method = editing?.id ? 'PUT' : 'POST';
    const r = await fetch(url, { method, body: fd });
    setLoading(false);
    if (r.ok) { setEditing(null); setPreviewUrl(null); load(); } else alert('儲存失敗');
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
        <button onClick={openNew} className="btn-primary">+ 新增輪播圖</button>
      </div>

      {/* 列表 — 模擬前台 16:7 顯示 */}
      <div className="grid md:grid-cols-2 gap-4">
        {list.map(b => (
          <div key={b.id} className="bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="relative aspect-[16/7] bg-gray-100 overflow-hidden">
              <img
                src={b.image}
                alt={b.title || ''}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: b.image_position || 'center' }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                {b.subtitle && <p className="text-[10px] tracking-[0.3em] text-brand font-semibold uppercase">{b.subtitle}</p>}
                <h3 className="text-white text-lg font-light drop-shadow">{b.title || '(無標題)'}</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="mt-1 text-xs text-gray-400">排序：{b.sort_order} · {b.active ? '啟用' : '停用'} · 位置：{b.image_position || 'center'}</div>
              <div className="mt-2 space-x-3 text-sm">
                <button onClick={() => openEdit(b)} className="text-blue-600 hover:underline">編輯</button>
                <button onClick={() => remove(b.id)} className="text-red-600 hover:underline">刪除</button>
              </div>
            </div>
          </div>
        ))}
        {!list.length && <div className="col-span-full bg-white rounded-lg p-8 text-center text-gray-400">尚無輪播圖</div>}
      </div>

      {/* 編輯 Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={save} className="p-6 space-y-4" encType="multipart/form-data">
              <h2 className="text-xl font-semibold">{editing.id ? '編輯輪播圖' : '新增輪播圖'}</h2>
              <div><label className="label">主標題</label><input name="title" defaultValue={editing.title || ''} className="input" /></div>
              <div><label className="label">副標題</label><input name="subtitle" defaultValue={editing.subtitle || ''} className="input" /></div>
              <div><label className="label">連結網址</label><input name="link_url" defaultValue={editing.link_url || ''} placeholder="/products" className="input" /></div>
              <div>
                <label className="label">圖片{!editing.id && ' *'}</label>
                <input type="file" name="image" accept="image/*" className="input" required={!editing.id} onChange={handleFileChange} />
                <p className="mt-1 text-xs text-gray-400">建議尺寸：1920 × 800 px（比例約 16:7），橫幅寬圖效果最佳</p>

                {/* 模擬前台實際顯示效果 */}
                {previewUrl && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">前台顯示預覽：</p>
                    <div className="relative aspect-[16/7] bg-gray-100 rounded overflow-hidden">
                      <img
                        src={previewUrl}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ objectPosition: imgPos }}
                        alt="預覽"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
                    </div>
                  </div>
                )}
              </div>

              {/* 圖片位置選擇器 */}
              {previewUrl && (
                <div>
                  <label className="label">圖片焦點位置</label>
                  <p className="text-xs text-gray-400 mb-2">當圖片比例與 16:7 不符時，選擇要顯示的重點區域</p>
                  <div className="inline-grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded">
                    {POSITION_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setImgPos(opt.value)}
                        className={`w-10 h-10 rounded text-sm font-bold flex items-center justify-center transition-all ${
                          imgPos === opt.value
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-white text-gray-500 hover:bg-gray-200'
                        }`}
                        title={opt.value}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">目前：{imgPos}</p>
                </div>
              )}

              <div className="flex gap-4 items-center">
                <div><label className="label inline">排序</label><input type="number" name="sort_order" defaultValue={editing.sort_order || 0} className="input w-24 inline" /></div>
                <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={editing.active !== 0} value="1" /> 啟用</label>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t">
                <button type="button" onClick={() => { setEditing(null); setPreviewUrl(null); }} className="btn-outline">取消</button>
                <button disabled={loading} className="btn-primary disabled:opacity-50">{loading ? '儲存中…' : '儲存'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
