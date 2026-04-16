/**
 * 從 data/pdftext/{MODEL_CODE}.txt 讀取預先抽取的 PDF 文字，
 * 解析後完整填入產品介紹的各欄位：
 *   description / description_en                — 產品概述（Markdown）
 *   specs_md   / specs_md_en                    — 規格表
 *   features   / features_en                    — 產品特色標籤（JSON array）
 *   applications / applications_en              — 適用產業（JSON array）
 *   standard_accessories / standard_accessories_en  — 標準配備（JSON array）
 *   optional_accessories / optional_accessories_en  — 選購配備（JSON array）
 *
 * 腳本會自動偵測 DB 是否已有這些欄位，缺的話自動新增（冪等）。
 * 執行：npm run migrate-details
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const PROJECT_ROOT = path.join(__dirname, '..');
const TEXT_DIR = path.join(PROJECT_ROOT, 'data', 'pdftext');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');

// 新增欄位清單（若 DB 中缺少則自動建立）
const NEW_COLUMNS = [
  'applications TEXT',
  'applications_en TEXT',
  'standard_accessories TEXT',
  'standard_accessories_en TEXT',
  'optional_accessories TEXT',
  'optional_accessories_en TEXT',
];

// 產品對應語言：en、zh、both、skip
const LANG = {
  H5080: 'en', HS500: 'en', JC400: 'en', JC400K: 'en',
  JM200: 'both', JH450: 'en', JL400: 'en', JM450: 'en', JT450: 'en',
  KMC760: 'skip', KMC2000: 'en', NB600: 'en', AMI24F: 'skip', KENTUSA: 'skip',
  NV1010: 'en', NV1512: 'en',
  COMP_XQ: 'zh', COMP_CPL: 'zh', COMP_PK: 'zh',
  COMP_RS: 'zh', COMP_BF: 'zh', COMP_TC: 'zh',
};

// 分類中英文對照（給自動產生描述用）
const CATEGORY_ZH_TO_EN = {
  '立式加工中心': 'Vertical Machining Center',
  '臥式加工中心': 'Horizontal Machining Center',
  '動柱式加工中心': 'Moving Column Machining Center',
  '立式龍門加工中心': 'Vertical Gantry Machining Center',
  '小型雕銑機': 'Small Engraving & Milling Machine',
  '二手中古機專區': 'Used & Pre-owned Machine',
  '加工中心空機': 'Machining Center Base Unit',
};

// ============================================================
//  工具
// ============================================================
const readText   = code => {
  const p = path.join(TEXT_DIR, `${code}.txt`);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
};
const readTextZH = code => {
  const p = path.join(TEXT_DIR, `${code}_ZH.txt`);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
};

function cleanText(txt) {
  return txt
    .split('\n')
    .filter(l => !/JEOU\s*YANG\s*MACHINERY|MIN-SHENG|TAICHUNG,\s*TAIWAN|TEL[：:]\s*[+＋]?886|FAX[：:]\s*[+＋]?886|poshtech@ms36|www\.poshtech|Specification is subject/i.test(l))
    .filter(l => !/公司名稱|業務負責人|連絡電話|傳真電話|公司地址|公司網址|E-?mail|建議售價|請填寫|煩請影印|因篇幅有限|請慎選/.test(l))
    .join('\n');
}

// ============================================================
//  英文規格解析（標準版型）
// ============================================================
const EN_SECTIONS = ['Table', 'Travel', 'Spindle', 'Feed', 'ATC', 'Motor', 'Machine weight and space'];

function parseSectionedEn(raw) {
  const lines = cleanText(raw).split('\n');
  const sections = Object.fromEntries(EN_SECTIONS.map(s => [s, []]));
  let current = null;
  for (const l of lines) {
    const t = l.trim();
    if (!t) continue;
    const hit = EN_SECTIONS.find(s => t.toLowerCase() === s.toLowerCase());
    if (hit) { current = hit; continue; }
    if (!current) continue;
    const parts = t.split(/\s{2,}|\t+/);
    if (parts.length >= 2) {
      const k = parts[0].replace(/[：:]$/, '').trim();
      const v = parts.slice(1).join(' ').trim();
      if (v && k.length > 1 && k.length < 60) sections[current].push({ k, v });
    }
  }
  return sections;
}

function buildEnSpecs(sections, modelCode) {
  let has = false;
  const chunks = [];
  for (const [name, items] of Object.entries(sections)) {
    if (!items.length) continue;
    has = true;
    chunks.push(`\n### ${name}\n`);
    chunks.push('| Item | Value |');
    chunks.push('| --- | --- |');
    for (const { k, v } of items) {
      chunks.push(`| ${k.replace(/\|/g, '\\|')} | ${v.replace(/\|/g, '\\|')} |`);
    }
  }
  if (!has) return null;
  return `## Specifications — POSHTECH ${modelCode}\n${chunks.join('\n')}\n\n> *Specifications are subject to change without notice.*`;
}

function buildEnSpecsFallback(raw, modelCode) {
  const body = cleanText(raw).split('\n').map(l => l.replace(/\s+$/, '')).filter(l => l.trim().length > 0).join('\n');
  if (!body) return null;
  return [`## Specifications — POSHTECH ${modelCode}`, '', '```', body, '```', '', '> *Specifications are subject to change without notice.*'].join('\n');
}

// 擷取 ＊ 條列 → 分 standard / optional
function extractAccessoriesEn(raw) {
  const lines = cleanText(raw).split('\n');
  const std = [], opt = [];
  let mode = null;
  for (const l of lines) {
    const t = l.trim();
    if (/standard\s*accessor/i.test(t)) { mode = 'std'; continue; }
    if (/optional\s*accessor/i.test(t)) { mode = 'opt'; continue; }
    // 遇到主要規格區塊就停止收集配件（避免誤收）
    if (/^(Specifications|Model\s+|Table\s*$|Travel\s*$|Spindle\s*$)/i.test(t)) {
      // continue, 配件條列跟規格區塊在 PDF 中是並排顯示
    }
    const m = t.match(/^[＊*]\s*(.+)$/);
    if (m && mode) {
      let item = m[1].replace(/[＊*]/g, '').trim();
      if (item.length > 2 && item.length < 80) {
        (mode === 'std' ? std : opt).push(item);
      }
    }
  }
  return { std, opt };
}

// ============================================================
//  中文內容解析
// ============================================================
function extractZhFeatures(raw) {
  const lines = cleanText(raw).split('\n').map(l => l.trim()).filter(Boolean);
  const out = [];
  let inFeatures = false;
  for (const l of lines) {
    if (/功能特色/.test(l)) { inFeatures = true; continue; }
    if (/^[三四五六]、|適用產業|配備|建議售價/.test(l)) { inFeatures = false; continue; }
    if (!inFeatures) continue;
    const m = l.match(/^[0-9]{1,2}[.、\s]\s*(.+?)[。\s]*$/);
    if (m && m[1]) {
      const text = m[1].replace(/^[、.\s]+/, '').trim();
      if (text.length > 2 && text.length < 80) out.push(text);
    }
  }
  return out;
}

function extractZhApplications(raw) {
  const txt = cleanText(raw);
  const m = txt.match(/四、適用產業[:：]?\s*([\s\S]*?)(?=\n\s*[五六七八九十]|$)/);
  if (!m) return [];
  const segment = m[1];
  const items = segment
    .split(/[,，。\n]/)
    .map(s => s.trim().replace(/[、]/g, '').replace(/[.]+$/, ''))
    .filter(s => s.length > 1 && s.length < 20);
  return [...new Set(items)];
}

// 零組件中文 PDF：取全文前 30 行作為描述（去頁首頁尾）
function buildZhDescription(raw) {
  const txt = cleanText(raw).split('\n').map(l => l.trim()).filter(l => l.length > 2).slice(0, 30).join('\n');
  return `### 產品說明\n\n${txt}`;
}

// ============================================================
//  通用：依分類中文名產生通用中文描述
// ============================================================
function buildZhDescriptionForMachine(modelCode, productName, categoryZh, specsEn) {
  // 從英文規格中挑出關鍵欄位做簡短描述
  const table = specsEn?.Table || [];
  const spindle = specsEn?.Spindle || [];
  const travel = specsEn?.Travel || [];

  const pick = (arr, keyword) => arr.find(x => new RegExp(keyword, 'i').test(x.k))?.v;
  const tableSize = pick(table, 'size');
  const spindleSpeed = pick(spindle, 'speed');
  const xTravel = pick(travel, 'longitudinal|^x\\b');
  const yTravel = pick(travel, 'cross|^y\\b');
  const zTravel = pick(travel, 'headstock|^z\\b');

  const parts = [
    `### 產品概述`,
    ``,
    `**${productName}** 為久洋機械（POSHTECH）所研發生產之${categoryZh || '精密加工機'}，採高剛性鑄件結構、精密滾珠螺桿與直結式主軸設計，適用於工業加工、模具製造、零件量產等應用。`,
    ``,
    `### 主要規格亮點`,
  ];
  const bullets = [];
  if (tableSize) bullets.push(`- **工作台尺寸**：${tableSize}`);
  if (xTravel || yTravel || zTravel) {
    const t = [xTravel && `X 軸 ${xTravel}`, yTravel && `Y 軸 ${yTravel}`, zTravel && `Z 軸 ${zTravel}`].filter(Boolean).join('、');
    bullets.push(`- **三軸行程**：${t}`);
  }
  if (spindleSpeed) bullets.push(`- **主軸轉速**：${spindleSpeed} rpm`);
  bullets.push('- **控制系統**：Fanuc / Mitsubishi / Syntec 可選配');
  bullets.push('- **精度保證**：全機整合設計、通過出廠精度驗證');
  parts.push(bullets.join('\n'));

  parts.push('');
  parts.push('### 適用領域');
  parts.push('廣泛應用於工業模具、精密機械零件、3C 電子、汽機車零件、醫療器材等加工領域。');
  parts.push('');
  parts.push('完整規格、選配項目、機台外觀尺寸圖請下載下方型錄 PDF 或聯絡業務窗口。');

  return parts.join('\n');
}

function buildEnDescriptionForMachine(modelCode, productName, specsEn) {
  const table = specsEn?.Table || [];
  const spindle = specsEn?.Spindle || [];
  const travel = specsEn?.Travel || [];
  const pick = (arr, keyword) => arr.find(x => new RegExp(keyword, 'i').test(x.k))?.v;
  const tableSize = pick(table, 'size');
  const spindleSpeed = pick(spindle, 'speed');
  const xTravel = pick(travel, 'longitudinal|^x\\b');
  const yTravel = pick(travel, 'cross|^y\\b');
  const zTravel = pick(travel, 'headstock|^z\\b');

  const parts = [
    `### Overview`,
    ``,
    `**POSHTECH ${modelCode}** is a precision machining center manufactured by Jeouyang Machinery, Taiwan. Built on a massive cast-iron structure with direct-coupled servo drives and high-rigidity ball-screw systems, it delivers stable long-term accuracy for production machining, mold-making, and precision part manufacturing.`,
    ``,
    `### Key Specifications`,
  ];
  const bullets = [];
  if (tableSize) bullets.push(`- **Table size:** ${tableSize}`);
  if (xTravel || yTravel || zTravel) {
    const t = [xTravel && `X ${xTravel}`, yTravel && `Y ${yTravel}`, zTravel && `Z ${zTravel}`].filter(Boolean).join(' · ');
    bullets.push(`- **Travel (X / Y / Z):** ${t}`);
  }
  if (spindleSpeed) bullets.push(`- **Spindle speed:** ${spindleSpeed} rpm`);
  bullets.push('- **Controller:** Fanuc / Mitsubishi / Syntec (optional)');
  bullets.push('- **Accuracy:** Factory-tested to POSHTECH quality standards');
  parts.push(bullets.join('\n'));

  parts.push('');
  parts.push('### Typical Applications');
  parts.push('Mould & die, automotive components, electronic precision parts, aerospace, medical devices, and general production machining.');
  parts.push('');
  parts.push('Download the catalog below or contact our sales team for full specifications and optional accessories.');

  return parts.join('\n');
}

// ============================================================
//  主處理
// ============================================================
function ensureColumns(db) {
  const existing = db.prepare('PRAGMA table_info(products)').all().map(r => r.name);
  for (const colDef of NEW_COLUMNS) {
    const name = colDef.split(/\s+/)[0];
    if (!existing.includes(name)) {
      db.exec(`ALTER TABLE products ADD COLUMN ${colDef}`);
      console.log(`   + 新增欄位 products.${name}`);
    }
  }
}

function processDB(dbPath, siteCode) {
  if (!fs.existsSync(dbPath)) return;
  const db = new Database(dbPath);
  console.log(`\n──── [${siteCode}] ${path.basename(dbPath)} ────`);

  ensureColumns(db);

  const prods = db.prepare(`
    SELECT p.id, p.name, p.model_code, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
  `).all();

  const upd = db.prepare(`
    UPDATE products SET
      specs_md_en              = COALESCE(?, specs_md_en),
      description_en           = COALESCE(?, description_en),
      features_en              = COALESCE(?, features_en),
      specs_md                 = COALESCE(?, specs_md),
      description              = COALESCE(?, description),
      features                 = COALESCE(?, features),
      applications             = COALESCE(?, applications),
      applications_en          = COALESCE(?, applications_en),
      standard_accessories     = COALESCE(?, standard_accessories),
      standard_accessories_en  = COALESCE(?, standard_accessories_en),
      optional_accessories     = COALESCE(?, optional_accessories),
      optional_accessories_en  = COALESCE(?, optional_accessories_en)
    WHERE id=?
  `);

  let n = 0;
  for (const p of prods) {
    if (!p.model_code) continue;
    const lang = LANG[p.model_code];
    if (!lang || lang === 'skip') {
      console.log(`· ${p.model_code.padEnd(10)} ${p.name} — 跳過`);
      continue;
    }

    const raw = readText(p.model_code);
    if (!raw) { console.log(`· ${p.model_code.padEnd(10)} ${p.name} — 無文字檔`); continue; }

    let specsMdEn = null, descEn = null, featEn = null;
    let specsMd = null, desc = null, feat = null;
    let applicationsZh = null, applicationsEn = null;
    let stdEn = null, optEn = null, stdZh = null, optZh = null;

    // ── 英文處理 ──
    if (lang === 'en' || lang === 'both') {
      const sections = parseSectionedEn(raw);
      specsMdEn = buildEnSpecs(sections, p.model_code) || buildEnSpecsFallback(raw, p.model_code);

      const { std, opt } = extractAccessoriesEn(raw);
      if (std.length) stdEn = JSON.stringify(std.slice(0, 15));
      if (opt.length) optEn = JSON.stringify(opt.slice(0, 15));

      // 合併標配前 6 個作為 features
      const featList = [...std.slice(0, 4), ...opt.slice(0, 2)];
      if (featList.length) featEn = JSON.stringify(featList);

      descEn = buildEnDescriptionForMachine(p.model_code, p.name, sections);
    }

    // ── 中文處理 ──
    if (lang === 'zh' || lang === 'both') {
      const zhRaw = lang === 'both' ? readTextZH(p.model_code) : raw;
      if (zhRaw) {
        // 特色
        const zhFeats = extractZhFeatures(zhRaw);
        if (zhFeats.length) feat = JSON.stringify(zhFeats.slice(0, 10));

        // 適用產業
        const apps = extractZhApplications(zhRaw);
        if (apps.length) applicationsZh = JSON.stringify(apps);

        // 描述：零組件直接用原文，機台（JM200 both 模式）用結構化描述
        if (lang === 'zh') {
          desc = buildZhDescription(zhRaw);
        } else {
          const sections = parseSectionedEn(raw);
          desc = buildZhDescriptionForMachine(p.model_code, p.name, p.category_name, sections);
        }
      }
    }

    // 機台若沒有中文 feature/description → 自動補
    if (lang === 'en') {
      const sections = parseSectionedEn(raw);
      desc = buildZhDescriptionForMachine(p.model_code, p.name, p.category_name, sections);

      // 自動翻譯機台英文 std/opt 為中文（簡單模板）
      if (stdEn) {
        const enList = JSON.parse(stdEn);
        stdZh = JSON.stringify(enList.map(t => translateAccessoryToZh(t)));
      }
      if (optEn) {
        const enList = JSON.parse(optEn);
        optZh = JSON.stringify(enList.map(t => translateAccessoryToZh(t)));
      }

      // 適用產業英文 → 通用列表
      applicationsEn = JSON.stringify([
        'Mould & die', 'Automotive parts', 'Electronic precision parts',
        'Aerospace components', 'Medical devices', 'General production machining'
      ]);
      applicationsZh = JSON.stringify([
        '模具製造', '汽機車零件', '3C 電子精密加工',
        '航太零件', '醫療器材', '一般生產加工'
      ]);
    }

    upd.run(
      specsMdEn, descEn, featEn,
      null /* specs_md zh 留空讓使用者自行填 */, desc, feat,
      applicationsZh, applicationsEn,
      stdZh, stdEn, optZh, optEn,
      p.id
    );
    n++;
    console.log(`✔ ${p.model_code.padEnd(10)} ${p.name}`);
  }
  console.log(`共更新 ${n} 筆`);
  db.close();
}

// 常見英文配件 → 中文對照
function translateAccessoryToZh(s) {
  const lower = s.toLowerCase();
  const map = [
    [/massive (iron|cast-iron) construction/i, '高剛性鑄鐵結構'],
    [/direct[\-\s]*coupled servo motors?/i, '直結式伺服馬達'],
    [/full splash safety guard/i, '全封閉安全防護罩'],
    [/air cooling system/i, '主軸風冷系統'],
    [/spindle air blast/i, '主軸錐孔清潔吹氣'],
    [/spindle air blower/i, '主軸吹氣'],
    [/auto lubrication system/i, '自動潤滑系統'],
    [/cycle end alarm light/i, '加工完成警示燈'],
    [/halogen work lamp/i, '鹵素工作燈'],
    [/leveling bolts? and pads?/i, '水平螺絲 + 墊片'],
    [/toolkit box/i, '工具箱'],
    [/operation\s*[＆&]\s*maintenance manual/i, '操作 / 維修手冊'],
    [/(\d+)\s*rpm spindle speed/i, '主軸轉速 $1 rpm'],
    [/coolant through spindle|CTS/i, '主軸中心出水 (CTS)'],
    [/oil cooler for spindle/i, '主軸油冷機'],
    [/chip conveyor/i, '排屑機'],
    [/cnc rotary table/i, 'CNC 旋轉工作台'],
    [/auto tool length measurement/i, '自動刀長量測'],
    [/arm\s*type magazine/i, '機械手刀庫'],
    [/chip screw on base/i, '底座螺旋排屑'],
    [/spindle coolant/i, '主軸冷卻系統'],
    [/(\d+)\s*pcs?\s*arm(\-|\s)*type atc/i, '$1 刀位機械手刀庫 (ATC)'],
  ];
  for (const [re, zh] of map) {
    const m = s.match(re);
    if (m) return zh.replace('$1', m[1] || '');
  }
  return s; // fallback：留原文
}

processDB(path.join(DATA_DIR, 'machines.db'),   'machines');
processDB(path.join(DATA_DIR, 'components.db'), 'components');

console.log('\n✅ 產品介紹內容匯入完成');
console.log('   已填入：description / description_en / specs_md_en / features / applications / standard_accessories / optional_accessories 等欄位');
console.log('   若要修正文字，請進後台「產品介紹」分頁編輯');
