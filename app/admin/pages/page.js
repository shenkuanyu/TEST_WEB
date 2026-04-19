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

/* ═══════ 語言切換元件 ═══════ */
function LangToggle({ lang, setLang }) {
  return (
    <div className="inline-flex rounded-md overflow-hidden border border-gray-300 shrink-0">
      <button onClick={() => setLang('zh')} className={`px-3 py-1 text-xs font-medium transition ${lang === 'zh' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>中文</button>
      <button onClick={() => setLang('en')} className={`px-3 py-1 text-xs font-medium transition ${lang === 'en' ? 'bg-gray-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>English</button>
    </div>
  );
}

/* ═══════ 圖片拖拉位置選擇器（共用元件） ═══════ */
function ImagePositionPicker({ src, position, onChange, aspectRatio = '3/5' }) {
  const containerRef = useRef(null);
  const dragging = useRef(false);
  const lastPt = useRef({ x: 0, y: 0 });

  function onPointerDown(e) {
    e.preventDefault();
    dragging.current = true;
    lastPt.current = { x: e.clientX, y: e.clientY };
    containerRef.current?.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e) {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - lastPt.current.x) / rect.width) * 100;
    const dy = ((e.clientY - lastPt.current.y) / rect.height) * 100;
    lastPt.current = { x: e.clientX, y: e.clientY };
    onChange(prev => ({
      x: Math.max(0, Math.min(100, prev.x - dx)),
      y: Math.max(0, Math.min(100, prev.y - dy)),
    }));
  }
  function onPointerUp() { dragging.current = false; }

  return (
    <div
      ref={containerRef}
      className="relative bg-gray-100 rounded overflow-hidden select-none"
      style={{ aspectRatio, cursor: 'grab', touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <img
        src={src}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ objectPosition: `${position.x}% ${position.y}%` }}
        alt=""
        draggable={false}
      />
      <div
        className="absolute w-4 h-4 border-2 border-white rounded-full pointer-events-none"
        style={{ left: `${position.x}%`, top: `${position.y}%`, transform: 'translate(-50%,-50%)', boxShadow: '0 0 0 1px rgba(0,0,0,0.5)' }}
      />
      <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
        拖拉調整
      </div>
    </div>
  );
}

/* ═══════ 首頁圖卡編輯器 ═══════ */
function HeroTilesEditor({ data, onSave, saving }) {
  const [lang, setLang] = useState('zh');

  // 預設值（從 site.js 搬過來）
  const defaultTiles = [
    { img: '/uploads/products/JC400/JC400-01.jpg', label_zh: '精密雕銑', label_en: 'Precision Engraving', img_position: '50% 50%' },
    { img: '/uploads/products/JM200/JM200-01.jpg', label_zh: '穩定性能', label_en: 'Proven Performance', img_position: '50% 50%' },
    { img: '/uploads/products/JH450/JH450-01.jpg', label_zh: '量產可靠', label_en: 'Production-ready', img_position: '50% 50%' },
  ];

  const [tiles, setTiles] = useState(defaultTiles);
  const [positions, setPositions] = useState(defaultTiles.map(() => ({ x: 50, y: 50 })));

  useEffect(() => {
    if (data.page_hero_tiles && Array.isArray(data.page_hero_tiles) && data.page_hero_tiles.length) {
      setTiles(data.page_hero_tiles);
      setPositions(data.page_hero_tiles.map(t => {
        const parts = (t.img_position || '50% 50%').replace(/%/g, '').split(/\s+/);
        return { x: Number(parts[0]) || 50, y: Number(parts[1]) || 50 };
      }));
    }
  }, [data]);

  function updateTile(idx, field, value) {
    setTiles(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  }

  function updatePosition(idx, fn) {
    setPositions(prev => prev.map((p, i) => i === idx ? fn(p) : p));
  }

  async function uploadImage(idx, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('key', 'page_hero_tiles');
    fd.append('image', file);
    const r = await fetch('/api/admin/pages', { method: 'PUT', body: fd });
    const result = await r.json();
    if (result.path) {
      updateTile(idx, 'img', result.path);
      updatePosition(idx, () => ({ x: 50, y: 50 }));
    }
  }

  function handleSave() {
    const tilesWithPos = tiles.map((t, i) => ({
      ...t,
      img_position: `${Math.round(positions[i].x)}% ${Math.round(positions[i].y)}%`,
    }));
    onSave({ page_hero_tiles: tilesWithPos });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">首頁「關於」區塊右側的 3 格圖卡</p>
        <LangToggle lang={lang} setLang={setLang} />
      </div>
      <div className="grid grid-cols-3 gap-4 max-w-2xl">
        {tiles.map((tile, idx) => (
          <div key={idx} className="bg-white rounded-lg border p-3 space-y-2">
            <div className="text-xs font-medium text-gray-500">圖卡 {idx + 1}</div>
            {/* 預覽 — 可拖拉 */}
            {tile.img ? (
              <ImagePositionPicker
                src={tile.img}
                position={positions[idx]}
                onChange={fn => updatePosition(idx, fn)}
                aspectRatio="3/5"
              />
            ) : (
              <div className="aspect-[3/5] bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">尚無圖片</div>
            )}
            <input type="file" accept="image/*" className="w-full text-xs" onChange={e => uploadImage(idx, e)} />
            <input
              className="input !text-sm !py-1"
              value={lang === 'zh' ? (tile.label_zh || '') : (tile.label_en || '')}
              onChange={e => updateTile(idx, lang === 'zh' ? 'label_zh' : 'label_en', e.target.value)}
              placeholder={lang === 'zh' ? '中文標籤' : 'English label'}
            />
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
        {saving ? '儲存中…' : '儲存圖卡設定'}
      </button>
    </div>
  );
}

/* ═══════ 公司介紹頁編輯器 ═══════ */
function AboutPageEditor({ data, onSave, saving }) {
  const [lang, setLang] = useState('zh');

  const defaults = {
    hero_subtitle: 'ABOUT JEOUYANG', hero_subtitle_en: 'ABOUT JEOUYANG',
    hero_title: '公司介紹', hero_title_en: 'About Us',
    hero_desc: '零組件標準化的專家 ｜ since 1994', hero_desc_en: 'Standardization Expert | since 1994',
    about_title: '用標準化思維', about_title_en: 'Standardized Thinking',
    about_highlight: '為台灣機械工業再盡一份力', about_highlight_en: 'Empowering Taiwan\'s Machinery Industry',
    about_p1: '久洋機械股份有限公司創立於 1994 年 7 月，公司成立的初衷，是為台灣機械工業再添一家民營的研究設計公司，協助中小企業解決因設計研發人才短缺，而減少新產品開發、錯失商機的困境。',
    about_p1_en: 'Jeouyang Machinery Co., Ltd. was founded in July 1994 with the mission of adding a privately-owned R&D company to Taiwan\'s machinery industry.',
    about_p2: '經過三十餘年的累積，久洋以「零組件標準化」為核心，持續投入工具機及自動化產業所需的機械零組件研發與製造。我們的目標很明確 —— 讓客戶不必為零件再傷腦筋：減少庫存量、縮短備料期、降低成本，讓久洋成為您穩定可靠的採購夥伴。',
    about_p2_en: 'Over 30 years, Jeouyang has focused on standardizing components for the machine tool industry, helping customers reduce inventory, shorten lead times, and lower costs.',
    philosophy: [
      { num: '01', title: '標準化設計', title_en: 'Standardized Design', desc: '以「可重複量產」為前提做設計。零件規格穩定、品質一致，客戶不必每次重新開規格、重新驗證。', desc_en: 'Design for mass reproduction. Stable specs and consistent quality.' },
      { num: '02', title: '縮短備料期', title_en: 'Shorter Lead Time', desc: '以常備庫存加上彈性製程，讓客戶從下單到交機的時間大幅縮短，真正掌握市場商機。', desc_en: 'Ready stock plus flexible processes dramatically reduce delivery time.' },
      { num: '03', title: '降低總成本', title_en: 'Lower Total Cost', desc: '透過標準化與規模化，讓客戶外購久洋零件比自行開發更經濟。把開發資源留給客戶的核心產品。', desc_en: 'Standardization at scale makes outsourcing more economical than in-house development.' },
    ],
    stats: [
      { number: '30+', title: '年的專業累積', title_en: 'Years of Expertise', desc: '自 1994 年至今，持續投入機械設計與製造。', desc_en: 'Continuous investment in machinery design since 1994.' },
      { number: '17', title: '大產品類別', title_en: 'Product Categories', desc: '從零件到整機，為客戶提供一站式採購方案。', desc_en: 'From components to complete machines, one-stop sourcing.' },
      { number: '100%', title: '客戶導向思維', title_en: 'Customer-Oriented', desc: '所有設計以「降低客戶總成本」為最終目標。', desc_en: 'Every design aims to minimize total customer cost.' },
    ],
    milestones: [
      { year: '1994', title: '公司成立', title_en: 'Founded', desc: '久洋機械股份有限公司於台中潭子創立，以「研究設計」為公司核心能力。', desc_en: 'Jeouyang Machinery was established in Tanzih, Taichung.' },
      { year: '創立初期', title: '投入零組件標準化', title_en: 'Component Standardization', desc: '鎖定台灣中小型機械廠需求，從斜楔、聯軸器、軸承座等精密零件切入，建立標準品線。', desc_en: 'Focused on wedges, couplings, and bearing housings for SME manufacturers.' },
      { year: '擴展期', title: '延伸至整機製造', title_en: 'Machine Manufacturing', desc: '陸續切入立式 / 臥式 / 龍門 / 動柱式加工中心，成為兼具零件與整機能力的綜合型供應商。', desc_en: 'Expanded into vertical, horizontal, and gantry machining centers.' },
      { year: '至今', title: '持續深耕', title_en: 'Continuous Growth', desc: '持續以「減少客戶庫存、縮短備料期、降低採購成本」為核心價值，服務台灣工具機與自動化產業。', desc_en: 'Serving Taiwan\'s machine tool industry with core values of reducing inventory and costs.' },
    ],
  };

  const [form, setForm] = useState(defaults);

  useEffect(() => {
    if (data.page_about) setForm(prev => ({ ...prev, ...data.page_about }));
  }, [data]);

  function update(key, value) { setForm(prev => ({ ...prev, [key]: value })); }

  function updateArrayItem(arrKey, idx, field, value) {
    setForm(prev => ({
      ...prev,
      [arrKey]: prev[arrKey].map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }));
  }

  /* 發展歷程：新增 / 刪除 / 排序 */
  function addMilestone() {
    setForm(prev => ({
      ...prev,
      milestones: [...prev.milestones, { year: '', title: '', title_en: '', desc: '', desc_en: '' }],
    }));
  }
  function removeMilestone(idx) {
    setForm(prev => ({ ...prev, milestones: prev.milestones.filter((_, i) => i !== idx) }));
  }
  function moveMilestone(idx, dir) {
    setForm(prev => {
      const arr = [...prev.milestones];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return prev;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...prev, milestones: arr };
    });
  }

  function handleSave() { onSave({ page_about: form }); }

  // 語言對應的 key 後綴
  const s = (key) => lang === 'en' ? `${key}_en` : key;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-end">
        <LangToggle lang={lang} setLang={setLang} />
      </div>

      {/* Hero */}
      <fieldset className="bg-white rounded-lg border p-5 space-y-3">
        <legend className="text-base font-semibold px-2">頂部 Hero</legend>
        <div><label className="label">副標題</label><input className="input" value={form[s('hero_subtitle')] || ''} onChange={e => update(s('hero_subtitle'), e.target.value)} /></div>
        <div><label className="label">主標題</label><input className="input" value={form[s('hero_title')] || ''} onChange={e => update(s('hero_title'), e.target.value)} /></div>
        <div><label className="label">描述</label><input className="input" value={form[s('hero_desc')] || ''} onChange={e => update(s('hero_desc'), e.target.value)} /></div>
      </fieldset>

      {/* 公司簡介 */}
      <fieldset className="bg-white rounded-lg border p-5 space-y-3">
        <legend className="text-base font-semibold px-2">公司簡介</legend>
        <div><label className="label">標題</label><input className="input" value={form[s('about_title')] || ''} onChange={e => update(s('about_title'), e.target.value)} /></div>
        <div><label className="label">品牌標語（紅字）</label><input className="input" value={form[s('about_highlight')] || ''} onChange={e => update(s('about_highlight'), e.target.value)} /></div>
        <div><label className="label">段落一</label><textarea className="input" rows={3} value={form[s('about_p1')] || ''} onChange={e => update(s('about_p1'), e.target.value)} /></div>
        <div><label className="label">段落二</label><textarea className="input" rows={3} value={form[s('about_p2')] || ''} onChange={e => update(s('about_p2'), e.target.value)} /></div>
      </fieldset>

      {/* 經營理念 */}
      <fieldset className="bg-white rounded-lg border p-5 space-y-3">
        <legend className="text-base font-semibold px-2">經營理念（3 項）</legend>
        {form.philosophy.map((p, i) => (
          <div key={i} className="grid grid-cols-[50px_1fr] gap-2 border-b pb-3 last:border-0">
            <div><label className="label text-xs">編號</label><input className="input !text-sm !py-1" value={p.num} onChange={e => updateArrayItem('philosophy', i, 'num', e.target.value)} /></div>
            <div className="space-y-1">
              <div><label className="label text-xs">標題</label><input className="input !text-sm !py-1" value={p[s('title')] || ''} onChange={e => updateArrayItem('philosophy', i, s('title'), e.target.value)} /></div>
              <div><label className="label text-xs">說明</label><textarea className="input !text-sm !py-1" rows={2} value={p[s('desc')] || ''} onChange={e => updateArrayItem('philosophy', i, s('desc'), e.target.value)} /></div>
            </div>
          </div>
        ))}
      </fieldset>

      {/* 數據亮點 */}
      <fieldset className="bg-white rounded-lg border p-5 space-y-3">
        <legend className="text-base font-semibold px-2">數據亮點（3 項）</legend>
        {form.stats.map((st, i) => (
          <div key={i} className="grid grid-cols-[70px_1fr] gap-2 border-b pb-3 last:border-0">
            <div><label className="label text-xs">數字</label><input className="input !text-sm !py-1" value={st.number} onChange={e => updateArrayItem('stats', i, 'number', e.target.value)} /></div>
            <div className="space-y-1">
              <div><label className="label text-xs">標題</label><input className="input !text-sm !py-1" value={st[s('title')] || ''} onChange={e => updateArrayItem('stats', i, s('title'), e.target.value)} /></div>
              <div><label className="label text-xs">說明</label><input className="input !text-sm !py-1" value={st[s('desc')] || ''} onChange={e => updateArrayItem('stats', i, s('desc'), e.target.value)} /></div>
            </div>
          </div>
        ))}
      </fieldset>

      {/* 發展歷程 */}
      <fieldset className="bg-white rounded-lg border p-5 space-y-3">
        <legend className="text-base font-semibold px-2">發展歷程</legend>
        {form.milestones.map((m, i) => (
          <div key={i} className="flex gap-2 items-start border-b pb-3 last:border-0">
            {/* 排序 + 刪除 */}
            <div className="flex flex-col items-center gap-0.5 pt-5 shrink-0">
              <button type="button" onClick={() => moveMilestone(i, -1)} disabled={i === 0} className="text-gray-400 hover:text-brand disabled:opacity-20 text-xs">▲</button>
              <span className="text-[10px] text-gray-400">{i + 1}</span>
              <button type="button" onClick={() => moveMilestone(i, 1)} disabled={i === form.milestones.length - 1} className="text-gray-400 hover:text-brand disabled:opacity-20 text-xs">▼</button>
            </div>
            <div className="w-20 shrink-0">
              <label className="label text-xs">年份</label>
              <input className="input !text-sm !py-1" value={m.year} onChange={e => updateArrayItem('milestones', i, 'year', e.target.value)} />
            </div>
            <div className="flex-1 space-y-1">
              <div><label className="label text-xs">標題</label><input className="input !text-sm !py-1" value={m[s('title')] || ''} onChange={e => updateArrayItem('milestones', i, s('title'), e.target.value)} /></div>
              <div><label className="label text-xs">說明</label><textarea className="input !text-sm !py-1" rows={2} value={m[s('desc')] || ''} onChange={e => updateArrayItem('milestones', i, s('desc'), e.target.value)} /></div>
            </div>
            <button type="button" onClick={() => removeMilestone(i)} className="text-red-400 hover:text-red-600 text-lg mt-5 shrink-0" title="刪除">×</button>
          </div>
        ))}
        <button type="button" onClick={addMilestone} className="btn-outline !text-sm">+ 新增歷程</button>
      </fieldset>

      <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
        {saving ? '儲存中…' : '儲存公司介紹'}
      </button>
    </div>
  );
}
