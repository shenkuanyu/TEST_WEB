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
    seo_title_zh: '久洋機械股份有限公司 POSHTECH | 立式/臥式加工中心',
    seo_title_en: 'POSHTECH | Jeouyang Machinery — CNC Machining Centers Taiwan',
    seo_description_zh: '久洋機械 POSHTECH 自 1994 年成立，專業製造立式、臥式、龍門加工中心，為台灣與全球客戶提供高精度工具機。',
    seo_description_en: 'POSHTECH / Jeouyang Machinery — Taiwan-based manufacturer of vertical, horizontal and gantry CNC machining centers since 1994.',
    seo_keywords: 'POSHTECH, Jeouyang Machinery, 久洋機械, CNC machining center, vertical machining center, horizontal machining center, VMC, HMC, 加工中心, 立式加工中心, 臥式加工中心, Taiwan machine tools',
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
      url: 'http://localhost:3002',
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
    seo_title_zh: '久洋機械零組件 | 斜楔、聯軸器、軸承座、加工中心零件',
    seo_title_en: 'Jeouyang Components | Wedges, Couplings, Bearing Housings for CNC Machines',
    seo_description_zh: '久洋零組件為工具機產業提供標準化零件：斜楔、聯軸器、軸承座、拉刀爪等，協助客戶減少庫存、縮短備料期、降低成本。',
    seo_description_en: 'Jeouyang Components supplies standardized machine tool parts: wedges, couplings, bearing housings, tool retention pawls. Reduce inventory, shorten lead times.',
    seo_keywords: '久洋零組件, 斜楔, 聯軸器, 軸承座, 拉刀爪, 操作箱旋轉座, linear guide wedge, coupling, bearing housing, tool retention pawl, machine tool components, Taiwan CNC parts',
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
      url: 'http://localhost:3001',
    },
  },
};

export function getSiteMeta(code = SITE_CODE) {
  return SITE_META[code] || SITE_META.machines;
}
