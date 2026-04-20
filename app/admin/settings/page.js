'use client';
import { useEffect, useState } from 'react';

const TABS = [
  { id: 'basic',     label: '基本資料' },
  { id: 'contact',   label: '聯絡資訊' },
  { id: 'analytics', label: '統計代碼' },
  { id: 'social',    label: '社群連結' },
  { id: 'seo',       label: 'SEO' },
  { id: 'smtp',      label: 'SMTP 寄信' },
  { id: 'line',      label: 'LINE 通知' },
  { id: 'security',  label: '安全設定' },
];

export default function AdminSettings() {
  const [tab, setTab] = useState('basic');
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [lineSubs, setLineSubs] = useState([]);
  const [lineSearch, setLineSearch] = useState('');

  useEffect(() => { load(); loadLineSubs(); }, []);

  async function load() {
    const r = await fetch('/api/admin/settings').then(r => r.json());
    setData(r.settings || {});
  }

  function update(k, v) {
    setData(d => ({ ...d, [k]: v }));
  }

  async function save(e) {
    e?.preventDefault();
    setSaving(true); setMsg('');
    const r = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (r.ok) {
      setMsg('✅ 已儲存');
      setTimeout(() => setMsg(''), 2500);
    } else {
      setMsg('❌ 儲存失敗');
    }
  }

  async function loadLineSubs() {
    try {
      const r = await fetch('/api/admin/line-subscribers').then(r => r.json());
      setLineSubs(r.subscribers || []);
    } catch {}
  }

  async function testLine() {
    // 先存檔
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const r = await fetch('/api/admin/settings/test-line', { method: 'POST' });
    const j = await r.json().catch(() => ({}));
    if (r.ok) alert(`✅ ${j.message}`);
    else alert(`❌ ${j.error || '發送失敗'}`);
  }

  async function toggleSub(userId, active) {
    await fetch('/api/admin/line-subscribers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, active }),
    });
    loadLineSubs();
  }

  async function removeSub(userId) {
    if (!confirm('確定要永久刪除此人？')) return;
    await fetch('/api/admin/line-subscribers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    loadLineSubs();
  }

  async function testMail() {
    const to = prompt('輸入測試收件 Email（會寄一封測試信）', data.smtp_user || '');
    if (!to) return;
    // 先存檔再測試（確保用最新設定）
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const r = await fetch('/api/admin/settings/test-mail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) alert(`✅ 測試信已發送到 ${to}，請檢查收件匣（也看看垃圾郵件）`);
    else alert(`❌ 發送失敗：${j.error || '未知錯誤'}`);
  }

  if (!data) return <div className="text-gray-400">載入中…</div>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold">網站設定</h1>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-green-700">{msg}</span>}
          <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? '儲存中…' : '儲存全部設定'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.id ? 'border-brand text-brand' : 'border-transparent text-gray-600 hover:text-brand'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={save} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {tab === 'basic' && (
          <>
            <Bilingual label="網站名稱" zhKey="site_name" enKey="site_name_en" data={data} onChange={update} />
            <Bilingual label="網站標語" zhKey="site_slogan" enKey="site_slogan_en" data={data} onChange={update} />
            <Bilingual label="網站副標 / 說明" zhKey="site_subtitle" enKey="site_subtitle_en" data={data} onChange={update} type="textarea" />
            <Field label="成立年份" k="founded_year" data={data} onChange={update} hint="例如 1994" />
          </>
        )}

        {tab === 'contact' && (
          <>
            <Field label="聯絡電話" k="contact_phone" data={data} onChange={update} />
            <Field label="傳真" k="contact_fax" data={data} onChange={update} />
            <Field label="聯絡 Email" k="contact_email" data={data} onChange={update} />
            <Bilingual label="公司地址" zhKey="contact_address" enKey="contact_address_en" data={data} onChange={update} />
            <Bilingual label="營業時間" zhKey="contact_hours" enKey="contact_hours_en" data={data} onChange={update} />
          </>
        )}

        {tab === 'analytics' && (
          <>
            <Field
              label="Google Analytics 4 — 測量 ID"
              k="ga4_id" data={data} onChange={update}
              hint="例如 G-PD12PTNLRF — 留空則不啟用 GA4"
            />
            <Field
              label="Google Tag Manager ID"
              k="gtm_id" data={data} onChange={update}
              hint="例如 GTM-XXXXXXX — 留空則不啟用 GTM"
            />
            <Field
              label="自訂 HEAD 區 HTML"
              k="stat_code_head" data={data} onChange={update} type="textarea"
              hint="會插在 <head> 內，用於貼第三方追蹤碼（Hotjar、Meta Pixel 等）"
            />
            <Field
              label="自訂 BODY 區 HTML"
              k="stat_code_body" data={data} onChange={update} type="textarea"
              hint="會插在 </body> 前，用於 chat 小工具、客服元件等"
            />
          </>
        )}

        {tab === 'social' && (
          <>
            <Field label="Facebook 粉絲專頁網址" k="social_facebook" data={data} onChange={update} hint="例：https://www.facebook.com/..." />
            <Field label="LINE 官方帳號 / 加入好友連結" k="social_line" data={data} onChange={update} hint="例：https://line.me/R/ti/p/@YOUR_ID" />
            <Field label="Instagram 網址" k="social_instagram" data={data} onChange={update} />
            <Field label="YouTube 頻道網址" k="social_youtube" data={data} onChange={update} />
            <Field label="WhatsApp 號碼" k="social_whatsapp" data={data} onChange={update} hint="例：+886912345678（會自動產生 https://wa.me/... 連結）" />
          </>
        )}

        {tab === 'seo' && (
          <>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 mb-2">
              <strong>SEO 設定說明：</strong>這裡的設定會影響 Google 搜尋結果中顯示的標題、描述和關鍵字。
              修改後需要重新部署才會生效。若留空，系統會使用程式碼中的預設值。
            </div>

            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">網站標題（顯示在 Google 搜尋結果）</h3>
            <Bilingual label="Meta Title" zhKey="seo_title_zh" enKey="seo_title_en" data={data} onChange={update} />
            <p className="text-xs text-gray-500 -mt-4">建議 30～60 字元，包含品牌名和主要產品關鍵字</p>

            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-6">網站描述（Google 搜尋結果的說明文字）</h3>
            <Bilingual label="Meta Description" zhKey="seo_description_zh" enKey="seo_description_en" data={data} onChange={update} type="textarea" />
            <p className="text-xs text-gray-500 -mt-4">建議 70～160 字元，概述公司特色、產品優勢</p>

            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-6">關鍵字</h3>
            <Bilingual label="Meta Keywords" zhKey="seo_keywords_zh" enKey="seo_keywords_en" data={data} onChange={update} type="textarea" />
            <p className="text-xs text-gray-500 -mt-4">
              以逗號分隔。中文範例：久洋機械, CNC加工中心, 立式加工中心, 工具機<br />
              英文範例：POSHTECH, CNC machining center, vertical machining center, Taiwan
            </p>

            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-6">社群分享</h3>
            <Field label="OG 分享圖（社群分享時顯示的縮圖）" k="seo_og_image" data={data} onChange={update} hint="例：/uploads/about.jpg，建議 1200×630 px" />

            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-6">Google 驗證</h3>
            <Field label="Google Search Console 驗證碼" k="seo_google_verification" data={data} onChange={update} hint="從 Google Search Console 取得的 HTML 標籤驗證碼，只需貼 content 的值。例如：abc123xyz" />
          </>
        )}

        {tab === 'smtp' && (
          <>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.smtp_enabled === '1'}
                  onChange={e => update('smtp_enabled', e.target.checked ? '1' : '0')}
                  className="w-5 h-5"
                />
                <span className="font-medium">啟用 SMTP 寄信</span>
              </label>
              <span className="text-sm text-gray-500">停用時，聯絡表單仍會寫入後台，但不會寄通知信</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">快速套用</label>
                <select
                  className="input"
                  onChange={e => applyPreset(e.target.value, update)}
                  defaultValue=""
                >
                  <option value="">— 選擇服務商預設 —</option>
                  <option value="gmail">Gmail（需先到 Google 帳戶產生「應用程式密碼」）</option>
                  <option value="outlook">Outlook / Hotmail</option>
                  <option value="hinet">HiNet（中華電信）</option>
                </select>
              </div>
              <div></div>

              <Field label="SMTP Server" k="smtp_host" data={data} onChange={update} hint="例：smtp.gmail.com" />
              <Field label="Port" k="smtp_port" data={data} onChange={update} hint="465（SSL）或 587（TLS）" />
              <div>
                <label className="label">加密方式</label>
                <select
                  className="input"
                  value={data.smtp_secure || 'ssl'}
                  onChange={e => update('smtp_secure', e.target.value)}
                >
                  <option value="ssl">SSL（Port 465）</option>
                  <option value="tls">TLS / STARTTLS（Port 587）</option>
                  <option value="none">不使用加密</option>
                </select>
              </div>
              <div></div>
              <Field label="帳號 (Email)" k="smtp_user" data={data} onChange={update} hint="登入 SMTP 的帳號" />
              <div>
                <label className="label">密碼</label>
                <input
                  type="password"
                  className="input"
                  value={data.smtp_pass || ''}
                  onChange={e => update('smtp_pass', e.target.value)}
                  placeholder="若顯示 ******** 代表已存過密碼，留著不動即可"
                />
              </div>
              <Field label="寄件人姓名" k="smtp_from_name" data={data} onChange={update} />
              <Field label="寄件人 Email（通常同帳號）" k="smtp_from_email" data={data} onChange={update} />
              <Field
                label="通知收件人"
                k="smtp_notify_to" data={data} onChange={update}
                hint="收到新詢價時系統寄通知信給誰。留空預設為「聯絡 Email」"
              />
              <div className="flex items-center pt-7">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.smtp_auto_reply === '1'}
                    onChange={e => update('smtp_auto_reply', e.target.checked ? '1' : '0')}
                    className="w-5 h-5"
                  />
                  <span>自動回覆客戶（收到表單後自動發確認信給對方）</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t flex items-center gap-3">
              <button type="button" onClick={testMail} className="btn-outline">寄測試信</button>
              <span className="text-sm text-gray-500">會先存檔，再用當前設定寄一封測試信</span>
            </div>
          </>
        )}

        {tab === 'line' && (
          <>
            <div className="p-4 bg-green-50 border border-green-200 rounded text-sm text-green-800 mb-2">
              <strong>LINE Messaging API 通知</strong><br/>
              當有人透過網站詢價時，系統會自動推播 LINE 訊息通知所有已加好友的人。
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.line_notify_enabled === '1'}
                  onChange={e => update('line_notify_enabled', e.target.checked ? '1' : '0')}
                  className="w-5 h-5"
                />
                <span className="font-medium">啟用 LINE 詢價通知</span>
              </label>
            </div>

            <div className="space-y-4">
              <Field
                label="Channel Access Token（長期）"
                k="line_channel_token" data={data} onChange={update}
                hint="從 LINE Developers Console → Messaging API → Channel access token 取得"
              />
              <Field
                label="Channel Secret"
                k="line_channel_secret" data={data} onChange={update}
                hint="用於驗證 Webhook 簽名（選填但建議填寫），在 Channel 基本設定頁取得"
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded text-sm space-y-2">
              <strong>設定步驟：</strong>
              <ol className="list-decimal ml-5 space-y-1">
                <li>到 <a href="https://developers.line.biz/console/" target="_blank" className="text-blue-600 underline">LINE Developers Console</a> 建立 Messaging API Channel</li>
                <li>在 Channel 設定頁取得 <strong>Channel Access Token</strong> 和 <strong>Channel Secret</strong>，填入上方</li>
                <li>在 Messaging API 設定頁填入 Webhook URL：<br/>
                  <code className="bg-white px-2 py-1 rounded text-xs">https://poshtech.com.tw/api/webhook/line</code>
                </li>
                <li>開啟「Use webhook」開關</li>
                <li>用手機掃描 Channel 的 QR Code 加好友（所有要收通知的人都要加）</li>
                <li>按下方「發送測試」驗證</li>
              </ol>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">LINE 好友名單</h3>
              <p className="text-sm text-gray-500 mb-3">加好友的人會自動出現在這裡。只有開啟「接收通知」的人才會收到詢價推播，其他人不會收到。</p>
              {lineSubs.length === 0 ? (
                <p className="text-gray-400 text-sm">尚無人加入好友。請先完成上方設定並設定 Webhook，再用 LINE 掃描 QR Code 加好友。</p>
              ) : (
                <div className="space-y-2">
                  {lineSubs.length >= 5 && (
                    <input
                      type="text"
                      placeholder="搜尋名稱..."
                      value={lineSearch}
                      onChange={e => setLineSearch(e.target.value)}
                      className="input mb-2"
                    />
                  )}
                  <div className="text-xs text-gray-400 mb-1">共 {lineSubs.length} 人，{lineSubs.filter(s => s.active).length} 人接收通知</div>
                  {lineSubs.filter(sub => !lineSearch || sub.display_name?.toLowerCase().includes(lineSearch.toLowerCase())).map(sub => (
                    <div key={sub.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!sub.active}
                            onChange={e => toggleSub(sub.user_id, e.target.checked)}
                            className="w-5 h-5"
                          />
                          <span className="font-medium">{sub.display_name}</span>
                        </label>
                        <span className={`text-xs px-2 py-0.5 rounded ${sub.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                          {sub.active ? '接收通知' : '不接收'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSub(sub.user_id)}
                        className="text-red-400 text-xs hover:text-red-600 hover:underline"
                      >
                        刪除
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                <button type="button" onClick={testLine} className="btn-outline">發送測試通知</button>
                <button type="button" onClick={loadLineSubs} className="text-sm text-blue-600 hover:underline">重新整理名單</button>
                <span className="text-xs text-gray-400">測試只會發給已勾選「接收通知」的人</span>
              </div>
            </div>
          </>
        )}

        {tab === 'security' && (
          <>
            <Field
              label="後台登入 IP 白名單"
              k="admin_allow_ips" data={data} onChange={update} type="textarea"
              hint={'每行一組，支援 * 通配。# 開頭為註解。\n範例：\n*  （代表全部允許）\n123.45.67.*  （指定 C 段）\n123.45.67.89  （單一 IP）'}
            />
            <Field
              label="前台是否顯示產品價格"
              k="show_prices" data={data} onChange={update}
              hint="填 1 = 顯示、0 = 不顯示（B2B 常用不顯示價格，留給客戶詢價）"
            />
          </>
        )}
      </form>
    </div>
  );
}

// ===== 子元件 =====

function Field({ label, k, data, onChange, type = 'text', hint }) {
  const val = data[k] ?? '';
  return (
    <div>
      <label className="label">{label}</label>
      {type === 'textarea' ? (
        <textarea
          className="input font-mono text-sm"
          rows={6}
          value={val}
          onChange={e => onChange(k, e.target.value)}
        />
      ) : (
        <input
          type={type}
          className="input"
          value={val}
          onChange={e => onChange(k, e.target.value)}
        />
      )}
      {hint && <p className="mt-1 text-xs text-gray-500 whitespace-pre-line">{hint}</p>}
    </div>
  );
}

function Bilingual({ label, zhKey, enKey, data, onChange, type = 'text' }) {
  const Input = type === 'textarea' ? 'textarea' : 'input';
  return (
    <div>
      <label className="label">{label}</label>
      <div className="space-y-2">
        <div className="flex">
          <span className="shrink-0 inline-flex items-center justify-center w-12 bg-brand text-white text-sm rounded-l">中文</span>
          <Input
            className="input !rounded-l-none"
            rows={type === 'textarea' ? 3 : undefined}
            value={data[zhKey] ?? ''}
            onChange={e => onChange(zhKey, e.target.value)}
          />
        </div>
        <div className="flex">
          <span className="shrink-0 inline-flex items-center justify-center w-12 bg-gray-700 text-white text-sm rounded-l">EN</span>
          <Input
            className="input !rounded-l-none"
            rows={type === 'textarea' ? 3 : undefined}
            value={data[enKey] ?? ''}
            onChange={e => onChange(enKey, e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function applyPreset(preset, update) {
  const presets = {
    gmail:   { smtp_host: 'smtp.gmail.com',       smtp_port: '465', smtp_secure: 'ssl' },
    outlook: { smtp_host: 'smtp.office365.com',   smtp_port: '587', smtp_secure: 'tls' },
    hinet:   { smtp_host: 'ms1.hinet.net',        smtp_port: '25',  smtp_secure: 'none' },
  };
  const p = presets[preset];
  if (!p) return;
  Object.entries(p).forEach(([k, v]) => update(k, v));
}
