import { SITE_CODE } from '@/lib/site';

export default function sitemap() {
  const domain = SITE_CODE === 'machines'
    ? 'https://poshtech.com.tw'
    : 'https://parts.poshtech.com.tw';

  // 只索引首頁
  return [
    { url: `${domain}/`, changeFrequency: 'weekly', priority: 1.0 },
  ];
}
