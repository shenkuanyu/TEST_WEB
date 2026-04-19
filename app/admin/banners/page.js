'use client';
import { useEffect, useState, useRef, useCallback } from 'react';

export default function AdminBanners() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imgPos, setImgPos] = useState({ x: 50, y: 50 });

  // 拖拉相關
  const dragging = useRef(false);
  const containerRef = useRef(null);
  const naturalSize = useRef({ w: 0, h: 0 });

  async function load() {
    const r = await fetch('/api/admin/banners').then(r => r.json());
    setList(r.items || []);
  }
  useEffect(() => { load(); }, []);

  /** 把 "30% 70%" 格式解析成 {x, y} */
  function parsePos(str) {
    if (!str) return { x: 50, y: 50 };
    const parts = str.replace(/%/g, '').trim().split(/\s+/);
    return { x: Number(parts[0]) || 50, y: Number(parts[1] ?? parts[0]) || 50 };
  }

  function openEdit(banner) {
    setEditing(banner);
    setPreviewUrl(banner.image || null);
    setImgPos(parsePos(banner.image_position));
  }

  function openNew() {
    setEditing({});
    setPreviewUrl(null);
    setImgPos({ x: 50, y: 50 });
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setImgPos({ x: 50, y: 50 });
    }
  }

  /** 圖片載入後記錄原始尺寸，用於判斷可拖拉方向 */
  function handleImgLoad(e) {
    naturalSize.current = { w: e.target.naturalWidth, h: e.target.naturalHeight };
  }

  /** 拖拉開始 */
  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    containerRef.current?.setPointerCapture(e.pointerId);
  }, []);

  /** 拖拉中 — 計算位置百分比 */
  const onPointerMove = useCallback((e) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nat = naturalSize.current;
    if (!nat.w || !nat.h) return;

    // 容器比例 vs 圖片比例，判斷哪個方向可移動
    const containerRatio = rect.width / rect.height;
    const imgRatio = nat.w / nat.h;

    // 游標在容器內的相對位置 (0~100)
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;

    setImgPos(prev => ({
      // 圖片比容器寬 → 可左右移動；比容器高 → 可上下移動
      x: imgRatio > containerRatio ? Math.max(0, Math.min(100, px)) : prev.x,
      y: imgRatio <= containerRatio ? Math.max(0, Math.min(100, py)) : prev.y,
    }));
  }, []);

  /** 拖拉結束 */
  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const posStr = `${Math.round(imgPos.x)}% ${Math.round(imgPos.y)}%`;

  async function save(e) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set('image_position', posStr);
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
                style={{ objectPosition: b.image_position || '50% 50%' }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                {b.subtitle && <p className="text-[10px] tracking-[0.3em] text-brand font-semibold uppercase">{b.subtitle}</p>}
                <h3 className="text-white text-lg font-light drop-shadow">{b.title || '(無標題)'}</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="mt-1 text-xs text-gray-400">排序：{b.sort_order} · {b.active ? '啟用' : '停用'}</div>
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

                {/* 可拖拉的前台預覽 */}
                {previewUrl && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">
                      前台顯示預覽 — <span className="text-blue-600">拖拉圖片調整顯示位置</span>
                    </p>
                    <div
                      ref={containerRef}
                      className="relative aspect-[16/7] bg-gray-100 rounded overflow-hidden select-none"
                      style={{ cursor: 'grab', touchAction: 'none' }}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerLeave={onPointerUp}
                    >
                      <img
                        src={previewUrl}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        style={{ objectPosition: posStr }}
                        alt="預覽"
                        draggable={false}
                        onLoad={handleImgLoad}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none" />
                      {/* 十字準心指示目前焦點 */}
                      <div
                        className="absolute w-5 h-5 border-2 border-white rounded-full shadow-lg pointer-events-none"
                        style={{
                          left: `${imgPos.x}%`,
                          top: `${imgPos.y}%`,
                          transform: 'translate(-50%, -50%)',
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
                        }}
                      >
                        <div className="absolute inset-[3px] bg-white rounded-full opacity-80" />
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-gray-400">焦點位置：{posStr}</span>
                      <button
                        type="button"
                        onClick={() => setImgPos({ x: 50, y: 50 })}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        重置為置中
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
