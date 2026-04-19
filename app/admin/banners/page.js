'use client';
import { useEffect, useState, useRef, useCallback } from 'react';

export default function AdminBanners() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imgPos, setImgPos] = useState({ x: 50, y: 50 });
  const [imgScale, setImgScale] = useState(1);

  const dragging = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  async function load() {
    const r = await fetch('/api/admin/banners').then(r => r.json());
    setList(r.items || []);
  }
  useEffect(() => { load(); }, []);

  /** 解析 "50% 30% 1.2" → { x, y, scale } */
  function parsePos(str) {
    if (!str) return { x: 50, y: 50, scale: 1 };
    const parts = str.replace(/%/g, '').trim().split(/\s+/);
    return {
      x: Number(parts[0]) || 50,
      y: Number(parts[1] ?? parts[0]) || 50,
      scale: Number(parts[2]) || 1,
    };
  }

  function openEdit(banner) {
    setEditing(banner);
    setPreviewUrl(banner.image || null);
    const p = parsePos(banner.image_position);
    setImgPos({ x: p.x, y: p.y });
    setImgScale(p.scale);
  }

  function openNew() {
    setEditing({});
    setPreviewUrl(null);
    setImgPos({ x: 50, y: 50 });
    setImgScale(1);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setImgPos({ x: 50, y: 50 });
      setImgScale(1);
    }
  }

  /* ── 拖拉邏輯（差值移動，不受方向限制） ── */
  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    containerRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // 差值移動：滑鼠移動多少 px → 換算成百分比
    const dx = ((e.clientX - lastPoint.current.x) / rect.width) * 100;
    const dy = ((e.clientY - lastPoint.current.y) / rect.height) * 100;
    lastPoint.current = { x: e.clientX, y: e.clientY };

    // 反向：滑鼠往右拖 → 圖片焦點往左移
    setImgPos(prev => ({
      x: Math.max(0, Math.min(100, prev.x - dx)),
      y: Math.max(0, Math.min(100, prev.y - dy)),
    }));
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  /* ── 滾輪縮放 ── */
  const onWheel = useCallback((e) => {
    e.preventDefault();
    setImgScale(prev => {
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      return Math.round(Math.max(1, Math.min(3, prev + delta)) * 100) / 100;
    });
  }, []);

  // 儲存格式："50% 30% 1.2"
  const posStr = `${Math.round(imgPos.x)}% ${Math.round(imgPos.y)}%${imgScale !== 1 ? ' ' + imgScale : ''}`;

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

  /** 共用的圖片樣式（預覽 + 列表通用） */
  function imgStyle(positionStr) {
    const p = parsePos(positionStr);
    return {
      objectPosition: `${p.x}% ${p.y}%`,
      transform: p.scale !== 1 ? `scale(${p.scale})` : undefined,
    };
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">輪播圖管理</h1>
        <button onClick={openNew} className="btn-primary">+ 新增輪播圖</button>
      </div>

      {/* 列表 */}
      <div className="grid md:grid-cols-2 gap-4">
        {list.map(b => (
          <div key={b.id} className="bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="relative aspect-[16/7] bg-gray-100 overflow-hidden">
              <img
                src={b.image}
                alt={b.title || ''}
                className="absolute inset-0 w-full h-full object-cover"
                style={imgStyle(b.image_position)}
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

                {/* 可拖拉 + 縮放的前台預覽 */}
                {previewUrl && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">
                      前台顯示預覽 — <span className="text-blue-600">拖拉移動圖片，滾輪縮放</span>
                    </p>
                    <div
                      ref={containerRef}
                      className="relative aspect-[16/7] bg-gray-100 rounded overflow-hidden select-none"
                      style={{ cursor: dragging.current ? 'grabbing' : 'grab', touchAction: 'none' }}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerLeave={onPointerUp}
                      onWheel={onWheel}
                    >
                      <img
                        src={previewUrl}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        style={{
                          objectPosition: `${imgPos.x}% ${imgPos.y}%`,
                          transform: imgScale !== 1 ? `scale(${imgScale})` : undefined,
                        }}
                        alt="預覽"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none" />
                      {/* 焦點指示圓 */}
                      <div
                        className="absolute w-5 h-5 border-2 border-white rounded-full pointer-events-none"
                        style={{
                          left: `${imgPos.x}%`, top: `${imgPos.y}%`,
                          transform: 'translate(-50%, -50%)',
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
                        }}
                      >
                        <div className="absolute inset-[3px] bg-white rounded-full opacity-80" />
                      </div>
                    </div>

                    {/* 縮放滑桿 */}
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-xs text-gray-500 shrink-0">縮放</span>
                      <input
                        type="range"
                        min="1" max="3" step="0.05"
                        value={imgScale}
                        onChange={e => setImgScale(Number(e.target.value))}
                        className="flex-1 h-1.5 accent-blue-600"
                      />
                      <span className="text-xs text-gray-500 w-12 text-right">{imgScale.toFixed(1)}x</span>
                    </div>

                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-gray-400">焦點：{Math.round(imgPos.x)}% {Math.round(imgPos.y)}%</span>
                      <button
                        type="button"
                        onClick={() => { setImgPos({ x: 50, y: 50 }); setImgScale(1); }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        重置
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
