'use client';
import { useEffect, useState } from 'react';

export default function AdminProducts() {
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null);

  async function load() {
    const [p, c] = await Promise.all([
      fetch('/api/admin/products').then(r => r.json()),
      fetch('/api/admin/categories').then(r => r.json()),
    ]);
    setList(p.items || []); setCats(c.items || []);
  }
  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!confirm('確定要刪除？相關圖片與型錄檔也會一併移除。')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">產品管理</h1>
        <button onClick={() => setEditing({})} className="btn-primary">+ 新增產品</button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">ID</th><th>圖片</th><th>型號</th><th>名稱</th><th>分類</th><th>狀態</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id} className="border-t">
                <td className="p-3 text-gray-500">#{p.id}</td>
                <td><img src={p.image || '/uploads/placeholder.svg'} className="w-12 h-12 object-cover rounded" alt="" /></td>
                <td className="font-mono text-gray-600">{p.model_code || '-'}</td>
                <td className="font-medium">{p.name}</td>
                <td className="text-gray-500">{cats.find(c => c.id === p.category_id)?.name || '-'}</td>
                <td>{p.published ? <span className="text-green-600">上架</span> : <span className="text-gray-400">下架</span>}</td>
                <td className="space-x-2">
                  <button onClick={() => setEditing(p)} className="text-blue-600 hover:underline">編輯</button>
                  <button onClick={() => remove(p.id)} className="text-red-600 hover:underline">刪除</button>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={7} className="p-6 text-center text-gray-400">尚無產品</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductEditor
          product={editing}
          categories={cats}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function ProductEditor({ product, categories, onClose, onSaved }) {
  const [tab, setTab] = useState('basic');
  const [data, setData] = useState({ ...product });
  const [images, setImages] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product.id) return;
    fetch(`/api/admin/products/${product.id}/images`).then(r => r.json()).then(r => setImages(r.items || []));
    fetch(`/api/admin/products/${product.id}/downloads`).then(r => r.json()).then(r => setDownloads(r.items || []));
  }, [product.id]);

  function update(k, v) { setData(d => ({ ...d, [k]: v })); }

  async function saveBasic() {
    setSaving(true);
    const fd = new FormData();
    for (const k of [
      'name', 'model_code', 'category_id', 'price', 'stock', 'summary', 'description',
      'video_url', 'specs_md', 'features', 'catalog_pdf',
      // 英文欄位
      'name_en', 'summary_en', 'description_en', 'specs_md_en', 'features_en',
      // 產品介紹新欄位
      'applications', 'applications_en',
      'standard_accessories', 'standard_accessories_en',
      'optional_accessories', 'optional_accessories_en',
    ]) {
      if (data[k] !== undefined && data[k] !== null) fd.append(k, data[k]);
    }
    fd.append('published', data.published === 0 ? '' : '1');
    fd.append('sort_order', data.sort_order || 0);
    const fileEl = document.getElementById('mainImgInput');
    if (fileEl?.files?.[0]) fd.append('image', fileEl.files[0]);

    const url = product.id ? `/api/admin/products/${product.id}` : '/api/admin/products';
    const method = product.id ? 'PUT' : 'POST';
    const r = await fetch(url, { method, body: fd });
    setSaving(false);
    if (!r.ok) return alert('儲存失敗');
    const result = await r.json().catch(() => ({}));
    if (!product.id && result.id) product.id = result.id;
    onSaved();
  }

  async function addImages(e) {
    const files = [...e.target.files];
    if (!files.length || !product.id) {
      alert('請先儲存產品基本資料再上傳圖片');
      e.target.value = '';
      return;
    }
    const fd = new FormData();
    files.forEach(f => fd.append('images', f));
    const r = await fetch(`/api/admin/products/${product.id}/images`, { method: 'POST', body: fd });
    e.target.value = '';
    if (r.ok) {
      const list = await fetch(`/api/admin/products/${product.id}/images`).then(r => r.json());
      setImages(list.items || []);
    }
  }
  async function removeImage(id) {
    if (!confirm('刪除這張圖？')) return;
    await fetch(`/api/admin/products/${product.id}/images?id=${id}`, { method: 'DELETE' });
    setImages(images.filter(i => i.id !== id));
  }

  async function addDownloads(e) {
    const files = [...e.target.files];
    if (!files.length || !product.id) {
      alert('請先儲存產品基本資料再上傳檔案');
      e.target.value = '';
      return;
    }
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    const r = await fetch(`/api/admin/products/${product.id}/downloads`, { method: 'POST', body: fd });
    e.target.value = '';
    if (r.ok) {
      const list = await fetch(`/api/admin/products/${product.id}/downloads`).then(r => r.json());
      setDownloads(list.items || []);
    }
  }
  async function removeDownload(id) {
    if (!confirm('刪除此下載檔？')) return;
    await fetch(`/api/admin/products/${product.id}/downloads?id=${id}`, { method: 'DELETE' });
    setDownloads(downloads.filter(d => d.id !== id));
  }

  const videoId = extractYouTubeId(data.video_url || '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-4">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">{product.id ? `編輯產品 #${product.id}` : '新增產品'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="flex border-b overflow-x-auto">
          {[
            ['basic',    '基本資料'],
            ['intro',    '產品介紹'],
            ['specs',    '規格 / 特色'],
            ['images',   '圖片相簿'],
            ['downloads','型錄下載'],
            ['video',    '影片'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
                tab === id ? 'border-brand text-brand' : 'border-transparent text-gray-600 hover:text-brand'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {tab === 'basic' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="label">型號代碼</label><input value={data.model_code || ''} onChange={e => update('model_code', e.target.value)} className="input" placeholder="例：JC400" /></div>
                <div>
                  <label className="label">分類</label>
                  <select value={data.category_id || ''} onChange={e => update('category_id', e.target.value)} className="input">
                    <option value="">—</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label">產品名稱 *</label>
                  <div className="flex"><span className="shrink-0 inline-flex items-center px-3 bg-brand text-white text-xs rounded-l">中</span>
                    <input value={data.name || ''} onChange={e => update('name', e.target.value)} className="input !rounded-l-none" />
                  </div>
                  <div className="flex mt-1"><span className="shrink-0 inline-flex items-center px-3 bg-gray-700 text-white text-xs rounded-l">EN</span>
                    <input value={data.name_en || ''} onChange={e => update('name_en', e.target.value)} className="input !rounded-l-none" placeholder="English product name (機台站會自動加 POSHTECH 前綴)" />
                  </div>
                </div>
                <div><label className="label">價格</label><input type="number" step="0.01" value={data.price || 0} onChange={e => update('price', e.target.value)} className="input" /></div>
                <div><label className="label">庫存</label><input type="number" value={data.stock || 0} onChange={e => update('stock', e.target.value)} className="input" /></div>
              </div>

              <div>
                <label className="label">簡介</label>
                <div className="flex"><span className="shrink-0 inline-flex items-center px-3 bg-brand text-white text-xs rounded-l">中</span>
                  <input value={data.summary || ''} onChange={e => update('summary', e.target.value)} className="input !rounded-l-none" />
                </div>
                <div className="flex mt-1"><span className="shrink-0 inline-flex items-center px-3 bg-gray-700 text-white text-xs rounded-l">EN</span>
                  <input value={data.summary_en || ''} onChange={e => update('summary_en', e.target.value)} className="input !rounded-l-none" placeholder="English summary" />
                </div>
              </div>

              <div>
                <label className="label">主圖（用於列表縮圖）</label>
                <input id="mainImgInput" type="file" accept="image/*" className="input" />
                {data.image && <img src={data.image} className="w-24 h-24 mt-2 rounded object-cover" alt="" />}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={data.published !== 0} onChange={e => update('published', e.target.checked ? 1 : 0)} /> 上架</label>
                <div><label className="label inline">排序</label><input type="number" value={data.sort_order || 0} onChange={e => update('sort_order', e.target.value)} className="input w-24 inline" /></div>
              </div>
            </div>
          )}

          {tab === 'intro' && (
            <div className="space-y-6">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                此分頁完整管理前台「產品內頁」上顯示的介紹內容。支援 Markdown 語法，左邊欄位顯示在中文版網站、右邊顯示在英文版。
              </div>

              {/* 詳細描述 */}
              <div>
                <label className="label font-semibold">📝 詳細描述（Markdown）</label>
                <p className="text-xs text-gray-500 mb-2">產品整段介紹文字。支援 #標題、**粗體**、- 清單、| 表格 |、換行等。</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-brand font-medium mb-1">中文</div>
                    <textarea rows={12} value={data.description || ''} onChange={e => update('description', e.target.value)} className="input font-mono text-sm" placeholder={'### 產品概述\n\n本機為...'} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-700 font-medium mb-1">English</div>
                    <textarea rows={12} value={data.description_en || ''} onChange={e => update('description_en', e.target.value)} className="input font-mono text-sm" placeholder={'### Overview\n\nThis machine...'} />
                  </div>
                </div>
              </div>

              {/* 適用產業 */}
              <div>
                <label className="label font-semibold">🎯 適用產業 / 領域</label>
                <p className="text-xs text-gray-500 mb-2">每行一項（例：模具製造、3C 電子、汽機車零件）。會以標籤顯示在前台。</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-brand font-medium mb-1">中文</div>
                    <textarea
                      rows={6}
                      value={parseFeatures(data.applications).join('\n')}
                      onChange={e => update('applications', JSON.stringify(e.target.value.split('\n').map(s => s.trim()).filter(Boolean)))}
                      className="input"
                      placeholder={'模具製造\n汽機車零件\n3C 電子精密加工'}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-gray-700 font-medium mb-1">English</div>
                    <textarea
                      rows={6}
                      value={parseFeatures(data.applications_en).join('\n')}
                      onChange={e => update('applications_en', JSON.stringify(e.target.value.split('\n').map(s => s.trim()).filter(Boolean)))}
                      className="input"
                      placeholder={'Mould & die\nAutomotive parts\nPrecision electronics'}
                    />
                  </div>
                </div>
              </div>

              {/* 標配 */}
              <div>
                <label className="label font-semibold">✅ 標準配備</label>
                <p className="text-xs text-gray-500 mb-2">隨機出貨的標準配件 / 功能。每行一項。</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-brand font-medium mb-1">中文</div>
                    <textarea
                      rows={8}
                      value={parseFeatures(data.standard_accessories).join('\n')}
                      onChange={e => update('standard_accessories', JSON.stringify(e.target.value.split('\n').map(s => s.trim()).filter(Boolean)))}
                      className="input"
                      placeholder={'高剛性鑄鐵結構\n直結式伺服馬達\n全封閉安全防護罩'}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-gray-700 font-medium mb-1">English</div>
                    <textarea
                      rows={8}
                      value={parseFeatures(data.standard_accessories_en).join('\n')}
                      onChange={e => update('standard_accessories_en', JSON.stringify(e.target.value.split('\n').map(s => s.trim()).filter(Boolean)))}
                      className="input"
                      placeholder={'Massive iron construction\nDirect-coupled servo motors\nFull splash safety guard'}
                    />
                  </div>
                </div>
              </div>

              {/* 選配 */}
              <div>
                <label className="label font-semibold">⚙️ 選購配備</label>
                <p className="text-xs text-gray-500 mb-2">客戶可加購的升級或擴充功能。每行一項。</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-brand font-medium mb-1">中文</div>
                    <textarea
                      rows={8}
                      value={parseFeatures(data.optional_accessories).join('\n')}
                      onChange={e => update('optional_accessories', JSON.stringify(e.target.value.split('\n').map(s => s.trim()).filter(Boolean)))}
                      className="input"
                      placeholder={'主軸中心出水 (CTS)\n主軸油冷機\n排屑機'}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-gray-700 font-medium mb-1">English</div>
                    <textarea
                      rows={8}
                      value={parseFeatures(data.optional_accessories_en).join('\n')}
                      onChange={e => update('optional_accessories_en', JSON.stringify(e.target.value.split('\n').map(s => s.trim()).filter(Boolean)))}
                      className="input"
                      placeholder={'Coolant Through Spindle\nOil cooler for spindle\nChip conveyor'}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'specs' && (
            <div className="space-y-5">
              <div>
                <label className="label">規格（Markdown 格式）</label>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-brand font-medium mb-1">中文</div>
                    <textarea
                      rows={12}
                      value={data.specs_md || ''}
                      onChange={e => update('specs_md', e.target.value)}
                      className="input font-mono text-sm"
                      placeholder={'### 主要規格\n| 項目 | 內容 |'}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-gray-700 font-medium mb-1">English</div>
                    <textarea
                      rows={12}
                      value={data.specs_md_en || ''}
                      onChange={e => update('specs_md_en', e.target.value)}
                      className="input font-mono text-sm"
                      placeholder={'### Main Specifications\n| Item | Detail |'}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">可使用 Markdown（標題 #、表格 | ---、粗體 **、條列 -）</p>
              </div>
              <div>
                <label className="label">產品特色（每行一項）</label>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-brand font-medium mb-1">中文</div>
                    <textarea
                      rows={6}
                      value={parseFeatures(data.features).join('\n')}
                      onChange={e => update('features', JSON.stringify(e.target.value.split('\n').map(s => s.trim()).filter(Boolean)))}
                      className="input"
                      placeholder={'高剛性結構\n精度穩定'}
                    />
                  </div>
                  <div>
                    <div className="text-xs text-gray-700 font-medium mb-1">English</div>
                    <textarea
                      rows={6}
                      value={parseFeatures(data.features_en).join('\n')}
                      onChange={e => update('features_en', JSON.stringify(e.target.value.split('\n').map(s => s.trim()).filter(Boolean)))}
                      className="input"
                      placeholder={'High rigidity\nConsistent precision'}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'images' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                這裡管理「產品相簿」（顯示在產品內頁的圖片牆）。主圖（列表縮圖）請至「基本資料」分頁設定。
              </div>
              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer btn-outline">
                  📷 上傳多張圖片
                  <input type="file" accept="image/*" multiple onChange={addImages} className="hidden" />
                </label>
                {!product.id && <span className="ml-3 text-sm text-gray-500">（請先儲存基本資料後再上傳）</span>}
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {images.map(img => (
                  <div key={img.id} className="relative group">
                    <img src={img.image} className="w-full aspect-square object-cover rounded border" alt={img.caption || ''} />
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition text-xs"
                    >×</button>
                  </div>
                ))}
                {!images.length && <p className="col-span-full text-center text-gray-400 py-8">尚無圖片</p>}
              </div>
            </div>
          )}

          {tab === 'downloads' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                可上傳 PDF、DOC、Excel 等型錄 / 規格書檔案，前台會顯示下載按鈕。
              </div>
              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer btn-outline">
                  📎 上傳檔案
                  <input type="file" accept=".pdf,.doc,.docx,.xlsx,.xls,.zip" multiple onChange={addDownloads} className="hidden" />
                </label>
                {!product.id && <span className="ml-3 text-sm text-gray-500">（請先儲存基本資料後再上傳）</span>}
              </div>
              <div className="space-y-2">
                {downloads.map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50">
                    <span className="text-2xl">📄</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{d.label}</div>
                      <div className="text-xs text-gray-500">{formatSize(d.file_size)}</div>
                    </div>
                    <a href={d.file_path} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">預覽</a>
                    <button onClick={() => removeDownload(d.id)} className="text-red-600 hover:underline text-sm">刪除</button>
                  </div>
                ))}
                {!downloads.length && <p className="text-center text-gray-400 py-8">尚無下載檔</p>}
              </div>
            </div>
          )}

          {tab === 'video' && (
            <div className="space-y-5">
              <div>
                <label className="label">YouTube 影片網址</label>
                <input
                  value={data.video_url || ''}
                  onChange={e => update('video_url', e.target.value)}
                  className="input"
                  placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX 或 https://youtu.be/XXXXXXXXXXX"
                />
                <p className="text-xs text-gray-500 mt-1">
                  將 YouTube 影片網址貼進來，前台產品頁會自動嵌入可播放的影片（支援普通 / 分享 / Shorts 格式）
                </p>
              </div>
              {videoId && (
                <div>
                  <p className="label">預覽</p>
                  <div className="aspect-video w-full max-w-xl bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">關閉</button>
          <button onClick={saveBasic} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? '儲存中…' : (product.id ? '儲存變更' : '建立產品')}
          </button>
        </div>
      </div>
    </div>
  );
}

function parseFeatures(raw) {
  if (!raw) return [];
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return String(raw).split('\n').map(s => s.trim()).filter(Boolean);
  }
}

function formatSize(n) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function extractYouTubeId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
