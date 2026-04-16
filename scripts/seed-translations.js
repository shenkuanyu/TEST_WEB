/**
 * 替 machines.db 與 components.db 的既有資料填入英文翻譯。
 * 機台產品名稱會自動加上 POSHTECH 品牌前綴。
 *
 * 執行：npm run seed-translations
 *
 * 說明：本腳本是「初始化 AI 翻譯」用。上線後，後台編輯器可手動修正英文文案。
 */
require('dotenv').config({ path: '.env.local' });
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');

// ============================================================
//  分類翻譯字典
// ============================================================
const CATEGORY_EN = {
  '立式加工中心':        'Vertical Machining Center',
  '臥式加工中心':        'Horizontal Machining Center',
  '動柱式加工中心':      'Moving Column Machining Center',
  '立式龍門加工中心':    'Vertical Gantry Machining Center',
  '小型雕銑機':          'Small Engraving & Milling Machine',
  '二手中古機專區':      'Used & Pre-owned Machines',
  '加工中心空機':        'Machining Center (Base Unit)',
  '斜楔':                'Linear Guide Wedge',
  '聯軸器':              'Coupling',
  '軸承座':              'Bearing Housing',
  '操作箱旋轉座':        'Operation Box Rotating Base',
  '碰塊':                'Stopper Block',
  '拉刀爪':              'Tool Retention Pawl',
  '傳動座':              'Drive Housing',
  '尾端軸承座':          'End Bearing Housing',
  '主軸馬達調整版':      'Spindle Motor Adjustment Plate',
  '標準地基螺栓組':      'Foundation Bolt Set',
};

// ============================================================
//  產品翻譯字典（依 model_code 查）
// ============================================================
const PRODUCT_EN = {
  // Machines ─────────────────────────────────
  H5080: {
    name: 'POSHTECH H5080 Series Horizontal Machining Center',
    summary: 'High-rigidity horizontal machining center for heavy-duty cutting.',
  },
  HS500: {
    name: 'POSHTECH HS500N Horizontal Machining Center',
    summary: 'Precision horizontal machining center of the HS500 series.',
  },
  JC400: {
    name: 'POSHTECH JC400 Small Engraving & Milling Machine',
    summary: 'Compact vertical machine for precision engraving and milling.',
  },
  JC400K: {
    name: 'POSHTECH JC400 Hilik Engraving & Milling Machine',
    summary: 'JC400 model equipped with Hilik control system.',
  },
  JM200: {
    name: 'POSHTECH JM200 Series Vertical Machining Center',
    summary: 'All-purpose vertical machining center series.',
  },
  JH450: {
    name: 'POSHTECH JH450 Vertical Machining Center',
    summary: 'Vertical machining center — JH450 model.',
  },
  JL400: {
    name: 'POSHTECH JL400 Vertical Machining Center',
    summary: 'JL400 vertical machining center — high-precision choice.',
  },
  JM450: {
    name: 'POSHTECH JM450 Vertical Machining Center',
    summary: 'Large-travel vertical machining center.',
  },
  JT450: {
    name: 'POSHTECH JT450 Vertical Machining Center',
    summary: 'JT450 vertical machining center series.',
  },
  KENTUSA: {
    name: 'KENT USA Series (OEM)',
    summary: 'KENT USA OEM machine series.',
  },
  KMC760: {
    name: 'POSHTECH KMC760 Horizontal Machining Center',
    summary: 'KMC760 horizontal machining center.',
  },
  KMC2000: {
    name: 'POSHTECH KMC2000 Large Machining Center',
    summary: 'KMC2000 large-scale machining center.',
  },
  NB600: {
    name: 'POSHTECH NB600 Vertical Machining Center',
    summary: 'NB600 vertical machining center.',
  },
  AMI24F: {
    name: 'POSHTECH Ami-24F Vertical Machining Center',
    summary: 'Ami-24F machining model.',
  },
  NV1010: {
    name: 'POSHTECH NV1010 Vertical Machining Center',
    summary: 'NV1010 vertical machining center.',
  },
  NV1512: {
    name: 'POSHTECH NV1512 Large-travel Vertical Machining Center',
    summary: 'NV1512 large-travel vertical machining center.',
  },
  // Components ───────────────────────────────
  COMP_XQ: {
    name: 'Linear Guide Standard Wedge',
    summary: 'Precision positioning component for machine tools using linear guides.',
  },
  COMP_CPL: {
    name: 'Coupling Series (CP / CR / CS / CT / LT)',
    summary: 'Full range of couplings: CP flexible disc, CR rigid, CS high-speed spindle, CT 3-axis servo, LT rigid shaft.',
  },
  COMP_PK: {
    name: 'Stopper Block',
    summary: 'Precision stopper blocks for machine tools.',
  },
  COMP_RS: {
    name: 'Operation Box Rotating Base',
    summary: 'Rotating mechanism for machine tool operation boxes.',
  },
  COMP_BF: {
    name: 'Shock Absorber Pad',
    summary: 'Dedicated shock absorber pads for machine tools.',
  },
  COMP_TC: {
    name: 'Tool Retention Pawl (BT / CAT / DIN)',
    summary: 'Standard German-spec tool retention pawls for machining center spindles.',
  },
  COMP_RT: {
    name: 'Rotary Table — Horizontal & Vertical',
    summary: 'Precision rotary tables, horizontal and vertical configurations.',
  },
  COMP_SP: {
    name: 'Spindle',
    summary: 'Machine tool spindle series.',
  },
  COMP_BS: {
    name: 'Bearing Housing (JS / SE / SF Series)',
    summary: 'Standard bearing housings in JS, SE, and SF series.',
  },
  COMP_DR: {
    name: 'Drive Housing / End Housing',
    summary: 'Drive housings and end housings of various types.',
  },
  COMP_MP: {
    name: 'Spindle Motor Adjustment Plate',
    summary: 'Spindle motor adjustment plate.',
  },
  COMP_TM: {
    name: 'Umbrella-type Tool Magazine',
    summary: 'Umbrella-type automatic tool changer magazine.',
  },
  COMP_NZ: {
    name: 'Coolant Nozzle',
    summary: 'Precision coolant nozzles.',
  },
  COMP_HD: {
    name: 'Operation Handle',
    summary: 'Dedicated operation handles for machine tools.',
  },
  COMP_DD45: {
    name: 'DD Motor 4/5-Axis Rotary Table',
    summary: 'Direct-drive motor driven 4/5-axis rotary table.',
  },
  COMP_45: {
    name: '4-Axis / 5-Axis Rotary Table',
    summary: '4-axis and 5-axis machining rotary tables.',
  },
};

// 通用英文描述（給所有產品）
const GENERIC_DESC_EN = [
  '### Product Features',
  '- Precision-grade machine components',
  '- Meets industrial standards',
  '- Technical support & after-sales service available',
  '',
  'Please download the catalog or contact our sales team for full specifications.',
].join('\n');

const GENERIC_SPECS_EN = (code, category) => [
  '### Main Specifications',
  '| Item | Detail |',
  '| --- | --- |',
  `| Model | ${code || 'N/A'} |`,
  `| Category | ${category || 'N/A'} |`,
  '| Application | Please refer to catalog |',
].join('\n');

const GENERIC_FEATURES_EN = JSON.stringify([
  'High rigidity & stability',
  'Consistent precision',
  'Proven in production',
]);

// ============================================================
//  新聞翻譯
// ============================================================
const NEWS_EN_BY_TITLE = {
  '久洋機械官方網站全新改版上線': {
    title: 'Jeouyang Machinery Launches New Official Website',
    summary: 'Thank you for your continued support. Our new website offers clearer product information and easier contact channels.',
    content: 'Jeouyang Machinery Co., Ltd. was founded in 1994. With our core values of professionalism, integrity and quality, we have been providing component-standardization design and manufacturing services to the Taiwan machinery industry.\n\nWith the new official website online, you can now find the product categories you need faster, leave inquiries, and our team will respond as soon as possible.',
  },
  '歡迎來廠參觀 — 台中潭子廠區': {
    title: 'Welcome to Visit Our Taichung Tanzi Factory',
    summary: 'For on-site visits or product discussions, please call to book an appointment.',
    content: 'Address: No. 197, Minsheng St., Tanzi Dist., Taichung City, Taiwan\nTel: 886-4-2537-0971\nFax: 886-4-2537-0984\nE-mail: poshtech@ms36.hinet.net',
  },
};

// ============================================================
//  Site settings 英文值
// ============================================================
const SETTINGS_EN = {
  machines: {
    site_name_en:     'Jeouyang Machinery / POSHTECH',
    site_slogan_en:   'POSHTECH — Professional CNC Machining Centers',
    site_subtitle_en: 'Taiwan-based manufacturer of vertical / horizontal / gantry machining centers. Trusted by global customers since 1994.',
  },
  components: {
    site_name_en:     'Jeouyang Components',
    site_slogan_en:   'The Expert of Component Standardization',
    site_subtitle_en: 'Reduce inventory, shorten lead time, and lower your cost — make Jeouyang your trusted sourcing partner.',
  },
  shared: {
    contact_address_en: 'No. 197, Minsheng St., Lilin Village, Tanzi Dist., Taichung City, Taiwan',
    contact_hours_en:   'Mon – Fri  08:00 – 17:30',
  },
};

// ============================================================
//  處理單一 DB
// ============================================================
function processDb(dbPath, siteCode) {
  if (!fs.existsSync(dbPath)) {
    console.log(`· 跳過 ${dbPath}（不存在）`);
    return;
  }
  const db = new Database(dbPath);
  console.log(`\n──── [${siteCode}] ${path.basename(dbPath)} ────`);

  // 1) 分類
  const cats = db.prepare('SELECT id, name FROM categories').all();
  const updCat = db.prepare('UPDATE categories SET name_en=? WHERE id=?');
  let cnt = 0;
  for (const c of cats) {
    const en = CATEGORY_EN[c.name];
    if (en) { updCat.run(en, c.id); cnt++; }
  }
  console.log(`✔ 分類 ${cnt}/${cats.length} 筆已填入英文`);

  // 2) 產品
  const prods = db.prepare('SELECT id, name, model_code, category_id FROM products').all();
  const updProd = db.prepare(`
    UPDATE products
       SET name_en=?, summary_en=?, description_en=?, specs_md_en=?, features_en=?
     WHERE id=?
  `);
  cnt = 0;
  for (const p of prods) {
    let en = null;

    // 優先順序 1：依 model_code 查（import-product-assets.js 建的產品）
    if (p.model_code && PRODUCT_EN[p.model_code]) {
      en = PRODUCT_EN[p.model_code];
    }

    // 優先順序 2：產品名稱直接等於某個分類英文（migrate-jeouyang.js 建的示範產品）
    if (!en && CATEGORY_EN[p.name]) {
      const enName = CATEGORY_EN[p.name];
      // 機台站自動加上 POSHTECH 品牌前綴
      en = {
        name: siteCode === 'machines' ? `POSHTECH ${enName}` : enName,
        summary: siteCode === 'machines'
          ? `POSHTECH ${enName} — Taiwan-made, trusted by global customers since 1994.`
          : `Standardized ${enName.toLowerCase()} for machine tool applications.`,
      };
    }

    if (!en) continue;

    const cat = db.prepare('SELECT name_en FROM categories WHERE id=?').get(p.category_id);
    updProd.run(
      en.name,
      en.summary,
      GENERIC_DESC_EN,
      GENERIC_SPECS_EN(p.model_code || p.name, cat?.name_en),
      GENERIC_FEATURES_EN,
      p.id
    );
    cnt++;
  }
  console.log(`✔ 產品 ${cnt}/${prods.length} 筆已填入英文`);

  // 3) 新聞
  const newsRows = db.prepare('SELECT id, title FROM news').all();
  const updNews = db.prepare('UPDATE news SET title_en=?, summary_en=?, content_en=? WHERE id=?');
  cnt = 0;
  for (const n of newsRows) {
    const en = NEWS_EN_BY_TITLE[n.title];
    if (en) {
      updNews.run(en.title, en.summary, en.content, n.id);
      cnt++;
    }
  }
  console.log(`✔ 最新消息 ${cnt}/${newsRows.length} 筆已填入英文`);

  // 4) site_settings 英文值
  const setSetting = db.prepare(
    'INSERT INTO site_settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'
  );
  const perSite = SETTINGS_EN[siteCode] || {};
  Object.entries({ ...perSite, ...SETTINGS_EN.shared }).forEach(([k, v]) => setSetting.run(k, v));
  console.log(`✔ site_settings 英文值已更新`);

  db.close();
}

processDb(path.join(DATA_DIR, 'machines.db'),   'machines');
processDb(path.join(DATA_DIR, 'components.db'), 'components');

console.log('\n✅ 全部翻譯匯入完成');
