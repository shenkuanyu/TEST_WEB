/**
 * 簡易的 UI 文案多語字典
 * 取 cookie `locale` 判斷語系，用法：
 *   import { getLocale, t } from '@/lib/i18n';
 *   const lang = getLocale();
 *   t('nav.home', lang)
 */
import { cookies } from 'next/headers';

export function getLocale() {
  const c = cookies().get('locale');
  return c?.value === 'en' ? 'en' : 'zh';
}

const dict = {
  zh: {
    'nav.home': '首頁',
    'nav.about': '公司介紹',
    'nav.products': '產品資訊',
    'nav.news': '最新消息',
    'nav.contact': '聯絡我們',
    'nav.login': '登入',
    'nav.register': '註冊',
    'nav.logout': '登出',
    'nav.admin': '後台',
  },
  en: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.products': 'Products',
    'nav.news': 'News',
    'nav.contact': 'Contact',
    'nav.login': 'Sign In',
    'nav.register': 'Sign Up',
    'nav.logout': 'Sign Out',
    'nav.admin': 'Admin',
  },
};

export function t(key, locale) {
  const lang = locale || getLocale();
  return dict[lang]?.[key] || dict.zh[key] || key;
}

/**
 * 從一筆物件中挑出對應語系的欄位值。
 * 若 locale=en 且 `${field}_en` 有值 → 回傳英文；否則回傳原欄位（中文）。
 *   pickI18n(product, 'name',    'en') → product.name_en || product.name
 *   pickI18n(product, 'summary', 'zh') → product.summary
 */
export function pickI18n(obj, field, locale) {
  if (!obj) return '';
  const lang = locale || getLocale();
  if (lang === 'en') {
    const enVal = obj[`${field}_en`];
    if (enVal !== null && enVal !== undefined && enVal !== '') return enVal;
  }
  return obj[field] || '';
}
