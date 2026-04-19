'use client';
import { useEffect, useState, useRef } from 'react';

const TABS = [
  { id: 'hero_tiles', label: '首頁圖卡' },
  { id: 'about',      label: '公司介紹' },
];

export default function AdminPages() {
  const [tab, setTab] = useState('hero_tiles');
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    const r = await fetch('/api/admin/pages').then(r => r.json());
    setData(r.data || {});
  }
  useEffect(() => { load(); }, []);

  async function saveData(payload) {
    setSaving(true); setMsg('');
    const r = await fetch('/api/admin/pages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (r.ok) { setMsg('✔ 已儲存'); load(); } else setMsg('儲存失敗');
    setTimeout(() => setMsg(''), 2000);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">頁面管理</h1>

      {/* 分頁 */}
      <div className="flex border-b mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition ${
              tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && <div className="mb-4 text-sm text-green-600">{msg}</div>}

      {tab === 'hero_tiles' && <HeroTilesEditor data={data} onSave={saveData} saving={saving} />}
      {tab === 'about' && <AboutPageEditor data={data} onSave={saveData} saving={saving} />}
    </div>
  );
}

/* ========== 首頁圖卡編輯器 ========== */
function HeroTilesEditor({ data, onSave, saving }) {
  const defaultTiles = [
    { img: '', label_zh: '', label_en: '' },
    { img: '', label_zh: '', label_en: '' },
    { img: '', label_zh: '', label_en: '' },
  ];
  const [tiles, setTiles] = useState(defaultTiles);
  const fileRefs = [useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    if (data.page_hero_tiles) {
      setTiles(data.page_hero_tiles);
    }
  }, [data]);

  function updateTile(idx, field, value) {
    setTiles(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  }

  async function uploadImage(idx) {
    const file = fileRefs[idx]?.current?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('key', 'page_hero_tiles');
    fd.append('image', file);
    const r = await fetch('/api/admin/pages', { method: 'PUT', body: fd });
    const result = await r.json();
    if (result.path) {
      updateTile(idx, 'img', result.path);
    }
  }

  function handleSave() {
    onSave({ page_hero_tiles: tiles });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">首頁「關於」區塊右側的 3 格圖卡，可自訂圖片和文字。</p>
      <div className="grid md:grid-cols-3 gap-6">
        {tiles.map((tile, idx) => (
          <div key={idx} className="bg-white rounded-lg border p-4 space-y-3">
            <div className="text-sm font-medium text-gray-700">圖卡 {idx + 1}</div>
            {/* 預覽 */}
            <div className="relative aspect-[3/5] bg-gray-100 rounded overflow-hidden">
              {tile.img ? (
                <img src={tile.img} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">尚無圖片</div>
              )}
            </div>
            {/* 上傳 */}
            <div>
              <input type="file" accept="image/*" ref={fileRefs[idx]} className="input text-sm" onChange={() => uploadImage(idx)} />
              <p className="text-xs text-gray-400 mt-1">建議比例 3:5（直式）</p>
            </div>
            {/* 文字 */}
            <div>
              <label className="label">中文標籤</label>
              <input className="input" value={tile.label_zh} onChange={e => updateTile(idx, 'label_zh', e.target.value)} placeholder="例：精密雕銑" />
            </div>
            <div>
              <label className="label">英文標籤</label>
              <input className="input" value={tile.label_en} onChange={e => updateTile(idx, 'label_en', e.target.value)} placeholder="e.g. Precision Engraving" />
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
        {saving ? '儲存中…' : '儲存圖卡設定'}
      </button>
    </div>
  );
}

/* ========== 公司介紹頁編輯器 ========== */
function AboutPageEditor({ data, onSave, saving }) {
  const defaults = {
    hero_subtitle: 'ABOUT JEOUYANG',
    hero_title: '公司介紹',
    hero_desc: '零組件標準化的專家 ｜ since 1994',
    about_title: '用標準化思維',
    about_highlight: '為台灣機械工業再盡一份力',
    about_p1: '久洋機械股份有限公司創立於 1994 年 7 月，公司成立的初衷，是為台灣機械工業再添一家民營的研究設計公司，協助中小企業解決因設計研發人才短缺，而減少新產品開發、錯失商機的困境。',
    about_p2: '經過三十餘年的累積，久洋以「零組件標準化」為核心，持續投入工具機及自動化產業所需的機械零組件研發與製造。我們的目標很明確 —— 讓客戶不必為零件再傷腦筋：減少庫存量、縮短備料期、降低成本，讓久洋成為您穩定可靠的採購夥伴。',
    philosophy: [
      { num: '01', title: '標準化設計', desc: '以「可重複量產」為前提做設計。零件規格穩定、品質一致，客戶不必每次重新開規格、重新驗證。' },
      { num: '02', title: '縮短備料期', desc: '以常備庫存加上彈性製程，讓客戶從下單到交機的時間大幅縮短，真正掌握市場商機。' },
      { num: '03', title: '降低總成本', desc: '透過標準化與規模化，讓客戶外購久洋零件比自行開發更經濟。把開發資源留給客戶的核心產品。' },
    ],
    stats: [
      { number: '30+', title: '年的專業累積', desc: '自 1994 年至今，持續投入機械設計與製造。' },
      { number: '17', title: '大產品類別', desc: '從零件到整機，為客戶提供一站式採購方案。' },
      { number: '100%', title: '客戶導向思維', desc: '所有設計以「降低客戶總成本」為最終目標。' },
    ],
    milestones: [
      { year: '1994', title: '公司成立', desc: '久洋機械股份有限公司於台中潭子創立，以「研究設計」為公司核心能力。' },
      { year: '創立初期', title: '投入零組件標準化', desc: '鎖定台灣中小型機械廠需求，從斜楔、聯軸器、軸承座等精密零件切入，建立標準品線。' },
      { year: '擴展期', title: '延伸至整機製造', desc: '陸續切入立式 / 臥式 / 龍門 / 動柱式加工中心，成為兼具零件與整機能力的綜合型供應商。' },
      { year: '至今', title: '持續深耕', desc: '持續以「減少客戶庫存、縮短備料期、降低採購成本」為核心價值，服務台灣工具機與自動化產業。' },
    ],
  };

  const [form, setForm] = useState(defaults);

  useEffect(() => {
    if (data.page_about) {
      setForm(prev => ({ ...prev, ...data.page_about }));
    }
  }, [data]);

  function update(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function updateArrayItem(arrKey, idx, field, value) {
    setForm(prev => ({
      ...prev,
      [arrKey]: prev[arrKey].map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }));
  }

  function handleSave() {
    onSave({ page_about: form });
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Hero 區塊 */}
      <fieldset className="bg-white rounded-lg border p-6 space-y-4">
        <legend className="text-lg font-semibold px-2">頂部 Hero 區塊</legend>
        <div><label className="label">副標題（英文）</label><input className="input" value={form.hero_subtitle} onChange={e => update('hero_subtitle', e.target.value)} /></div>
        <div><label className="label">主標題</label><input className="input" value={form.hero_title} onChange={e => update('hero_title', e.target.value)} /></div>
        <div><label className="label">描述文字</label><input className="input" value={form.hero_desc} onChange={e => update('hero_desc', e.target.value)} /></div>
      </fieldset>

      {/* 公司簡介 */}
      <fieldset className="bg-white rounded-lg border p-6 space-y-4">
        <legend className="text-lg font-semibold px-2">公司簡介</legend>
        <div><label className="label">標題</label><input className="input" value={form.about_title} onChange={e => update('about_title', e.target.value)} /></div>
        <div><label className="label">品牌標語（紅字）</label><input className="input" value={form.about_highlight} onChange={e => update('about_highlight', e.target.value)} /></div>
        <div><label className="label">段落一</label><textarea className="input" rows={4} value={form.about_p1} onChange={e => update('about_p1', e.target.value)} /></div>
        <div><label className="label">段落二</label><textarea className="input" rows={4} value={form.about_p2} onChange={e => update('about_p2', e.target.value)} /></div>
      </fieldset>

      {/* 經營理念 */}
      <fieldset className="bg-white rounded-lg border p-6 space-y-4">
        <legend className="text-lg font-semibold px-2">經營理念（3 項）</legend>
        {form.philosophy.map((p, i) => (
          <div key={i} className="grid grid-cols-[60px_1fr] gap-3 border-b pb-4 last:border-0">
            <div><label className="label">編號</label><input className="input" value={p.num} onChange={e => updateArrayItem('philosophy', i, 'num', e.target.value)} /></div>
            <div className="space-y-2">
              <div><label className="label">標題</label><input className="input" value={p.title} onChange={e => updateArrayItem('philosophy', i, 'title', e.target.value)} /></div>
              <div><label className="label">說明</label><textarea className="input" rows={2} value={p.desc} onChange={e => updateArrayItem('philosophy', i, 'desc', e.target.value)} /></div>
            </div>
          </div>
        ))}
      </fieldset>

      {/* 數據統計 */}
      <fieldset className="bg-white rounded-lg border p-6 space-y-4">
        <legend className="text-lg font-semibold px-2">數據亮點（3 項）</legend>
        {form.stats.map((s, i) => (
          <div key={i} className="grid grid-cols-[80px_1fr] gap-3 border-b pb-4 last:border-0">
            <div><label className="label">數字</label><input className="input" value={s.number} onChange={e => updateArrayItem('stats', i, 'number', e.target.value)} /></div>
            <div className="space-y-2">
              <div><label className="label">標題</label><input className="input" value={s.title} onChange={e => updateArrayItem('stats', i, 'title', e.target.value)} /></div>
              <div><label className="label">說明</label><input className="input" value={s.desc} onChange={e => updateArrayItem('stats', i, 'desc', e.target.value)} /></div>
            </div>
          </div>
        ))}
      </fieldset>

      {/* 發展歷程 */}
      <fieldset className="bg-white rounded-lg border p-6 space-y-4">
        <legend className="text-lg font-semibold px-2">發展歷程</legend>
        {form.milestones.map((m, i) => (
          <div key={i} className="grid grid-cols-[80px_1fr] gap-3 border-b pb-4 last:border-0">
            <div><label className="label">年份</label><input className="input" value={m.year} onChange={e => updateArrayItem('milestones', i, 'year', e.target.value)} /></div>
            <div className="space-y-2">
              <div><label className="label">標題</label><input className="input" value={m.title} onChange={e => updateArrayItem('milestones', i, 'title', e.target.value)} /></div>
              <div><label className="label">說明</label><textarea className="input" rows={2} value={m.desc} onChange={e => updateArrayItem('milestones', i, 'desc', e.target.value)} /></div>
            </div>
          </div>
        ))}
      </fieldset>

      <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
        {saving ? '儲存中…' : '儲存公司介紹'}
      </button>
    </div>
  );
}
