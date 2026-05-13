'use client';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useToast } from '@/components/admin/Toast';
const RichTextEditor = lazy(() => import('@/components/RichTextEditor'));

export default function AdminProducts() {
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null);
  const toast = useToast();

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

  async function moveProduct(idx, direction) {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= list.length) return;
    const arr = [...list];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setList(arr);
    // 只更新 sort_order，不動其他欄位
    const orders = arr.map((p, i) => ({ id: p.id, sort_order: i }));
    await fetch('/api/admin/products/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders }),
    });
  }

  const [showCats, setShowCats] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [editingCat, setEditingCat] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatNameEn, setEditCatNameEn] = useState('');

  async function addCat() {
    if (!newCatName.trim()) return;
    await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCatName.trim(), name_en: newCatNameEn.trim() }),
    });
    setNewCatName('');
    setNewCatNameEn('');
    load();
  }
  function startEditCat(c) {
    setEditingCat(c.id);
    setEditCatName(c.name || '');
    setEditCatNameEn(c.name_en || '');
  }
  async function updateCat(id) {
    await fetch(`/api/admin/categories?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editCatName, name_en: editCatNameEn }),
    });
    setEditingCat(null);
    load();
  }
  async function removeCat(id) {
    const used = list.some(p => p.category_id === id);
    if (used && !confirm('此分類下還有產品，確定刪除？（產品不會被刪除，只會變成無分類）')) return;
    if (!used && !confirm('確定刪除此分類？')) return;
    await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">產品管理</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowCats(!showCats)} className="btn-outline">
            {showCats ? '收起分類' : '管理分類'}
          </button>
          <button onClick={() => setEditing({})} className="btn-primary">+ 新增產品</button>
        </div>
      </div>

      {showCats && (
        <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">分類管理</h2>
          <div className="space-y-2 mb-4">
            {cats.map(c => (
              <div key={c.id} className="p-3 border rounded hover:bg-gray-50">
                {editingCat === c.id ? (
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="shrink-0 inline-flex items-center justify-center w-12 bg-brand text-white text-sm rounded-l">中文</span>
                      <input value={editCatName} onChange={e => setEditCatName(e.target.value)} className="input !rounded-l-none" autoFocus />
                    </div>
                    <div className="flex">
                      <span className="shrink-0 inline-flex items-center justify-center w-12 bg-gray-700 text-white text-sm rounded-l">EN</span>
                      <input value={editCatNameEn} onChange={e => setEditCatNameEn(e.target.value)} className="input !rounded-l-none" placeholder="English name" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateCat(c.id)} className="text-green-600 hover:underline text-sm">儲存</button>
                      <button onClick={() => setEditingCat(null)} className="text-gray-500 hover:underline text-sm">取消</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <span className="font-medium">{c.name}</span>
                      {c.name_en && <span className="text-gray-400 text-sm ml-2">/ {c.name_en}</span>}
                    </div>
                    <span className="text-xs text-gray-400">{list.filter(p => p.category_id === c.id).length} 個產品</span>
                    <button onClick={() => startEditCat(c)} className="text-blue-600 hover:underline text-sm">編輯</button>
                    <button onClick={() => removeCat(c.id)} className="text-red-600 hover:underline text-sm">刪除</button>
                  </div>
                )}
              </div>
            ))}
            {!cats.length && <p className="text-gray-400 text-sm">尚無分類</p>}
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex flex-1">
                <span className="shrink-0 inline-flex items-center justify-center w-12 bg-brand text-white text-sm rounded-l">中文</span>
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addCat(); }} className="input !rounded-l-none" placeholder="新分類名稱，例：立式加工中心" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex flex-1">
                <span className="shrink-0 inline-flex items-center justify-center w-12 bg-gray-700 text-white text-sm rounded-l">EN</span>
                <input value={newCatNameEn} onChange={e => setNewCatNameEn(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addCat(); }} className="input !rounded-l-none" placeholder="English name, e.g. Vertical Machining Center" />
              </div>
              <button onClick={addCat} className="btn-primary shrink-0">新增分類</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3">排序</th><th>圖片</th><th>型號</th><th>名稱</th><th>分類</th><th>狀態</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p, idx) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 w-6 text-center">{idx + 1}</span>
                    <div className="flex flex-col">
                      <button onClick={() => moveProduct(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-brand disabled:opacity-20 text-xs leading-none">▲</button>
                      <button onClick={() => moveProduct(idx, 1)} disabled={idx === list.length - 1} className="text-gray-400 hover:text-brand disabled:opacity-20 text-xs leading-none">▼</button>
                    </div>
                  </div>
                </td>
                <td><img src={p.image || '/uploads/placeholder.svg'} className="w-12 h-12 object-cover rounded" alt="" loading="lazy" /></td>
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
  const [mainImgPreview, setMainImgPreview] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [lang, setLang] = useState('zh'); // zh/en 語言切換
  const toast = useToast();

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
    if (!r.ok) {
      toast.error('儲存失敗');
      return;
    }
    toast.success(product.id ? '已更新' : '已新增');
    const result = await r.json().catch(() => ({}));
    if (!product.id && result.id) product.id = result.id;
    // 更新主圖路徑（從伺服器回傳）
    if (result.product?.image) {
      setData(d => ({ ...d, image: result.product.image }));
      setMainImgPreview(null);
    }
    // 清除前台快取，讓修改立刻生效
    fetch('/api/admin/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: ['/', '/products', `/products/${product.id}`] }),
    }).catch(() => {});
    onSaved();
  }

  async function addImages(e) {
    const files = [...e.target.files];
    if (!files.length || !product.id) {
      toast.warning('請先儲存產品基本資料再上傳圖片');
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

  // 拖拽排序圖片
  async function reorderImages(fromIdx, toIdx) {
    if (fromIdx === toIdx) return;
    const arr = [...images];
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    setImages(arr);
    // 批次更新 sort_order
    for (let i = 0; i < arr.length; i++) {
      await fetch(`/api/admin/products/${product.id}/images?id=${arr[i].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: arr[i].caption, sort_order: i }),
      });
    }
  }

  function moveImage(idx, direction) {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= images.length) return;
    reorderImages(idx, newIdx);
  }

  async function addDownloads(e) {
    const files = [...e.target.files];
    if (!files.length || !product.id) {
      toast.warning('請先儲存產品基本資料再上傳檔案');
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
      <div className="bg-white rounded-lg max-w-5xl w-full my-4">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">{product.id ? '編輯產品' : '新增產品'}</h2>
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

        <div className="p-6 max-h-[75vh] overflow-y-auto">
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
                  <div className="flex"><span className="shrink-0 inline-flex items-center justify-center w-12 bg-brand text-white text-sm rounded-l">中文</span>
                    <input value={data.name || ''} onChange={e => update('name', e.target.value)} className="input !rounded-l-none" />
                  </div>
                  <div className="flex mt-1"><span className="shrink-0 inline-flex items-center justify-center w-12 bg-gray-700 text-white text-sm rounded-l">EN</span>
                    <input value={data.name_en || ''} onChange={e => update('name_en', e.target.value)} className="input !rounded-l-none" placeholder="English product name (機台站會自動加 POSHTECH 前綴)" />
                  </div>
                </div>
                <div><label className="label">價格</label><input type="number" step="0.01" value={data.price || 0} onChange={e => update('price', e.target.value)} className="input" /></div>
                <div><label className="label">庫存</label><input type="number" value={data.stock || 0} onChange={e => update('stock', e.target.value)} className="input" /></div>
              </div>

              <div>
                <label className="label">簡介</label>
                <div className="flex"><span className="shrink-0 inline-flex items-center justify-center w-12 bg-brand text-white text-sm rounded-l">中文</span>
                  <input value={data.summary || ''} onChange={e => update('summary', e.target.value)} className="input !rounded-l-none" />
                </div>
                <div className="flex mt-1"><span className="shrink-0 inline-flex items-center justify-center w-12 bg-gray-700 text-white text-sm rounded-l">EN</span>
                  <input value={data.summary_en || ''} onChange={e => update('summary_en', e.target.value)} className="input !rounded-l-none" placeholder="English summary" />
                </div>
              </div>

              <div>
                <label className="label">主圖（用於列表縮圖）</label>
                <input id="mainImgInput" type="file" accept="image/*" className="input" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setMainImgPreview(URL.createObjectURL(file));
                  } else {
                    setMainImgPreview(null);
                  }
                }} />
                <p className="mt-1 text-xs text-gray-400">圖片會自適應縮放，建議寬度至少 800 px，用於產品列表卡片縮圖</p>
                {(mainImgPreview || data.image) && (
                  <div className="mt-2 w-48">
                    <p className="text-xs text-gray-500 mb-1">前台顯示預覽</p>
                    <div className="relative aspect-[4/3] bg-gray-100 rounded overflow-hidden">
                      <img
                        src={mainImgPreview || data.image}
                        className="absolute inset-0 w-full h-full object-contain"
                        alt=""
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={data.published !== 0} onChange={e => update('published', e.target.checked ? 1 : 0)} /> 上架</label>
              </div>
            </div>
          )}

          {tab === 'intro' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 flex-1 mr-4">
                  管理前台「產品內頁」的介紹內容。可直接從 Word 複製貼上，格式會自動保留。
                </div>
                <LangToggle lang={lang} setLang={setLang} />
              </div>

              {/* 詳細描述 */}
              <div>
                <label className="label font-semibold">詳細描述</label>
                <p className="text-xs text-gray-500 mb-2">產品整段介紹文字。支援粗體、標題、清單、表格等格式。</p>
                <Suspense fallback={<div className="border rounded p-4 text-gray-400">{lang === 'zh' ? '載入編輯器...' : 'Loading editor...'}</div>}>
                  <RichTextEditor
                    key={`desc-${lang}`}
                    value={lang === 'zh' ? (data.description || '') : (data.description_en || '')}
                    onChange={v => update(lang === 'zh' ? 'description' : 'description_en', v)}
                    rows={20}
                  />
                </Suspense>
              </div>

              {/* 適用產業 */}
              <div>
                <label className="label font-semibold">適用產業 / 領域</label>
                <p className="text-xs text-gray-500 mb-2">每行一項（例：模具製造、3C 電子、汽機車零件）。會以標籤顯示在前台。</p>
                <textarea
                  rows={6}
                  value={parseFeatures(lang === 'zh' ? data.applications : data.applications_en).join('\n')}
                  onChange={e => update(
                    lang === 'zh' ? 'applications' : 'applications_en',
                    JSON.stringify(e.target.value.split('\n'))
                  )}
                  className="input"
                  placeholder={lang === 'zh' ? '模具製造\n汽機車零件\n3C 電子精密加工' : 'Mould & die\nAutomotive parts\nPrecision electronics'}
                />
              </div>

              {/* 標配 */}
              <div>
                <label className="label font-semibold">標準配備</label>
                <p className="text-xs text-gray-500 mb-2">隨機出貨的標準配件 / 功能。每行一項。</p>
                <textarea
                  rows={8}
                  value={parseFeatures(lang === 'zh' ? data.standard_accessories : data.standard_accessories_en).join('\n')}
                  onChange={e => update(
                    lang === 'zh' ? 'standard_accessories' : 'standard_accessories_en',
                    JSON.stringify(e.target.value.split('\n'))
                  )}
                  className="input"
                  placeholder={lang === 'zh' ? '高剛性鑄鐵結構\n直結式伺服馬達\n全封閉安全防護罩' : 'Massive iron construction\nDirect-coupled servo motors\nFull splash safety guard'}
                />
              </div>

              {/* 選配 */}
              <div>
                <label className="label font-semibold">選購配備</label>
                <p className="text-xs text-gray-500 mb-2">客戶可加購的升級或擴充功能。每行一項。</p>
                <textarea
                  rows={8}
                  value={parseFeatures(lang === 'zh' ? data.optional_accessories : data.optional_accessories_en).join('\n')}
                  onChange={e => update(
                    lang === 'zh' ? 'optional_accessories' : 'optional_accessories_en',
                    JSON.stringify(e.target.value.split('\n'))
                  )}
                  className="input"
                  placeholder={lang === 'zh' ? '主軸中心出水 (CTS)\n主軸油冷機\n排屑機' : 'Coolant Through Spindle\nOil cooler for spindle\nChip conveyor'}
                />
              </div>
            </div>
          )}

          {tab === 'specs' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="label mb-0">產品規格</label>
                  <p className="text-xs text-gray-500">可使用工具列插入表格、標題、粗體等格式。支援直接從 Word 複製貼上。</p>
                </div>
                <LangToggle lang={lang} setLang={setLang} />
              </div>
              <Suspense fallback={<div className="border rounded p-4 text-gray-400">{lang === 'zh' ? '載入編輯器...' : 'Loading editor...'}</div>}>
                <RichTextEditor
                  key={`specs-${lang}`}
                  value={lang === 'zh' ? (data.specs_md || '') : (data.specs_md_en || '')}
                  onChange={v => update(lang === 'zh' ? 'specs_md' : 'specs_md_en', v)}
                  rows={24}
                />
              </Suspense>
              <div>
                <label className="label">產品特色（每行一項）</label>
                <textarea
                  rows={6}
                  value={parseFeatures(lang === 'zh' ? data.features : data.features_en).join('\n')}
                  onChange={e => update(
                    lang === 'zh' ? 'features' : 'features_en',
                    JSON.stringify(e.target.value.split('\n'))
                  )}
                  className="input"
                  placeholder={lang === 'zh' ? '高剛性結構\n精度穩定' : 'High rigidity\nConsistent precision'}
                />
              </div>
            </div>
          )}

          {tab === 'images' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                這裡管理「產品相簿」（顯示在產品內頁的圖片牆）。主圖（列表縮圖）請至「基本資料」分頁設定。
                <br /><span className="text-blue-600">圖片會自適應縮放，建議寬度至少 800 px</span>
              </div>
              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer btn-outline">
                  📷 上傳多張圖片
                  <input type="file" accept="image/*" multiple onChange={addImages} className="hidden" />
                </label>
                {!product.id && <span className="ml-3 text-sm text-gray-500">（請先儲存基本資料後再上傳）</span>}
              </div>
              <p className="text-xs text-gray-500 mt-2 mb-1">拖拽圖片可調整順序，或使用 ← → 按鈕移動</p>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className={`relative group rounded border-2 transition ${dragIdx === idx ? 'border-brand opacity-50' : 'border-transparent'}`}
                    draggable
                    onDragStart={e => { setDragIdx(idx); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                    onDrop={e => { e.preventDefault(); if (dragIdx !== null) reorderImages(dragIdx, idx); setDragIdx(null); }}
                    onDragEnd={() => setDragIdx(null)}
                  >
                    <img src={img.image} className="w-full aspect-square object-cover rounded cursor-grab active:cursor-grabbing" alt={img.caption || ''} />
                    <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 p-1 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-b">
                      <button onClick={() => moveImage(idx, -1)} disabled={idx === 0} className="w-6 h-6 bg-white/90 rounded text-xs disabled:opacity-30" title="往前">←</button>
                      <button onClick={() => moveImage(idx, 1)} disabled={idx === images.length - 1} className="w-6 h-6 bg-white/90 rounded text-xs disabled:opacity-30" title="往後">→</button>
                      <button onClick={() => removeImage(img.id)} className="w-6 h-6 bg-red-600 text-white rounded text-xs" title="刪除">×</button>
                    </div>
                    <span className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">{idx + 1}</span>
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

function LangToggle({ lang, setLang }) {
  return (
    <div className="inline-flex rounded-md overflow-hidden border border-gray-300 shrink-0">
      <button
        onClick={() => setLang('zh')}
        className={`px-4 py-1.5 text-sm font-medium transition ${
          lang === 'zh' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        中文
      </button>
      <button
        onClick={() => setLang('en')}
        className={`px-4 py-1.5 text-sm font-medium transition ${
          lang === 'en' ? 'bg-gray-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        English
      </button>
    </div>
  );
}

function extractYouTubeId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

