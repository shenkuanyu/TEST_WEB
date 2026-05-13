/**
 * 多站設定：由 SITE_CODE 環境變數決定當前是機台站還是零組件站。
 * 兩站共用同一份 LOGO 與公司識別；僅內容（產品、首頁圖、SEO）不同。
 */

export const SITE_CODE = process.env.SITE_CODE || 'machines';

export const SITE_META = {
  machines: {
    code: 'machines',
    // 海外主打 POSHTECH 品牌
    brand_en: 'POSHTECH',
    brand_zh: '久洋機械',
    label_zh: '機台',
    label_en: 'Machinery',
    // 機台以國外市場為主，預設英文
    default_locale: 'en',
    // SEO
    seo_title_zh: '久洋機械 POSHTECH | CNC立式・臥式・龍門加工中心製造商｜久洋機械股份有限公司',
    seo_title_en: 'POSHTECH — CNC Machining Centers | Vertical, Horizontal & Gantry | Taiwan Manufacturer',
    seo_description_zh: 'POSHTECH（久洋機械）自 1994 年成立於台中，專業製造 CNC 立式加工中心、臥式加工中心、龍門加工中心，產品外銷全球超過 30 國，提供高精度、高剛性工具機解決方案。',
    seo_description_en: 'POSHTECH — Taiwan CNC machining center manufacturer since 1994. Vertical, horizontal and gantry machining centers exported to 30+ countries worldwide. Precision engineering excellence by Jeouyang Machinery.',
    seo_keywords: 'POSHTECH, Jeouyang Machinery, 久洋機械, 久洋機械股份有限公司, Jeou Yang, CNC machining center, vertical machining center, horizontal machining center, gantry machining center, VMC, HMC, 加工中心, 立式加工中心, 臥式加工中心, 龍門加工中心, CNC車床, CNC銑床, 台灣工具機, 台灣CNC, 工具機製造商, Taiwan machine tools, Taiwan CNC manufacturer, precision machining, 高精度加工, 五軸加工機, 工具機推薦, 台中工具機',
    // 首頁圖片（會覆蓋原本的元件圖）
    hero_tiles: [
      { img: '/uploads/products/JC400/JC400-01.jpg', label_zh: '精密雕銑',    label_en: 'Precision Engraving' },
      { img: '/uploads/products/JM200/JM200-01.jpg', label_zh: '穩定性能',    label_en: 'Proven Performance' },
      { img: '/uploads/products/JH450/JH450-01.jpg', label_zh: '量產可靠',    label_en: 'Production-ready' },
    ],
    other_site: {
      name_zh: '零組件採購',
      name_en: 'Components Sourcing',
      desc_zh: '需要機械零組件（斜楔、聯軸器、軸承座）？請前往久洋零組件網站',
      desc_en: 'Looking for linear guide wedges, couplings, or bearing housings? Visit our components site.',
      url: 'https://parts.poshtech.com.tw',
    },
  },
  components: {
    code: 'components',
    brand_en: 'Jeouyang Components',
    brand_zh: '久洋零組件',
    label_zh: '零組件',
    label_en: 'Components',
    // 零組件以台灣市場為主，預設中文
    default_locale: 'zh',
    seo_title_zh: '久洋機械零組件 | 斜楔・聯軸器・軸承座・拉刀爪 — 久洋機械股份有限公司',
    seo_title_en: 'Jeouyang Machine Components | Wedges, Couplings, Bearing Housings | Taiwan CNC Parts',
    seo_description_zh: '久洋機械零組件事業部，為工具機產業提供高品質標準化零件：斜楔、聯軸器、軸承座、拉刀爪、操作箱旋轉座等，台中在地庫存供應，協助客戶縮短備料期、降低採購成本。',
    seo_description_en: 'Jeouyang Machine Components — Taiwan supplier of standardized CNC machine tool parts: linear guide wedges, couplings, bearing housings, tool retention pawls. In-stock delivery from Taichung.',
    seo_keywords: '久洋零組件, 久洋機械零組件, POSHTECH components, Jeouyang Components, 斜楔, 聯軸器, 軸承座, 拉刀爪, 操作箱旋轉座, 機械零件, 工具機零件, 工具機零組件, CNC零件, 加工中心零件, linear guide wedge, coupling, bearing housing, tool retention pawl, machine tool components, Taiwan CNC parts, CNC machine parts, machining center parts, 工具機配件, 主軸零件, 台灣機械零件',
    hero_tiles: [
      { img: '/uploads/cat-xieqie.jpg',    label_zh: '標準化設計', label_en: 'Standardized Design' },
      { img: '/uploads/cat-coupling.jpg',  label_zh: '穩定交期',   label_en: 'Reliable Lead Time' },
      { img: '/uploads/cat-bearing.jpg',   label_zh: '降低成本',   label_en: 'Lower Total Cost' },
    ],
    other_site: {
      name_zh: 'POSHTECH 機台',
      name_en: 'POSHTECH Machines',
      desc_zh: '想了解立式、臥式、龍門等 CNC 加工中心？請前往 POSHTECH 機台網站',
      desc_en: 'Looking for vertical, horizontal, or gantry CNC machining centers? Visit our POSHTECH machines site.',
      url: 'https://poshtech.com.tw',  // machines 主站
    },
  },
};

/**
 * 取得站點設定。若資料庫有後台 SEO 設定，優先使用後台的值。
 */
export function getSiteMeta(code = SITE_CODE) {
  const base = SITE_META[code] || SITE_META.machines;

  // 嘗試從資料庫讀取後台 SEO 設定（優先度高於程式碼預設值）
  try {
    const { getAllSettings } = require('./settings');
    const s = getAllSettings();

    return {
      ...base,
      seo_title_zh:       s.seo_title_zh       || base.seo_title_zh,
      seo_title_en:       s.seo_title_en       || base.seo_title_en,
      seo_description_zh: s.seo_description_zh || base.seo_description_zh,
      seo_description_en: s.seo_description_en || base.seo_description_en,
      seo_keywords:       mergeKeywords(base.seo_keywords, s.seo_keywords_zh, s.seo_keywords_en),
      seo_google_verification: s.seo_google_verification || '',
    };
  } catch {
    // DB 未建立或尚無資料時，使用程式碼預設值
    return base;
  }
}

/**
 * 合併程式碼預設關鍵字與後台自訂關鍵字（去重）
 */
function mergeKeywords(base, zhExtra, enExtra) {
  const parts = [base];
  if (zhExtra) parts.push(zhExtra);
  if (enExtra) parts.push(enExtra);
  // 去除重複關鍵字
  const all = parts.join(', ').split(',').map(s => s.trim()).filter(Boolean);
  return [...new Set(all)].join(', ');
}
