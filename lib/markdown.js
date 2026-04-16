/**
 * 輕量 Markdown → HTML 轉換（支援：標題、粗體、斜體、表格、清單、程式碼、連結、換行）
 * 不用外部套件，減少打包體積。
 */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function mdToHtml(md) {
  if (!md) return '';

  // 若內容已是 HTML（由富文本編輯器產生），直接回傳，不做 Markdown 轉換
  const trimmed = md.trim();
  if (trimmed.startsWith('<') && (trimmed.startsWith('<p') || trimmed.startsWith('<h') || trimmed.startsWith('<table') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol') || trimmed.startsWith('<div') || trimmed.startsWith('<blockquote'))) {
    return md;
  }

  let html = escapeHtml(md);

  // 表格（必須在 lines 處理之前先處理）
  html = html.replace(/(^\|.*\|\s*$\n^\|[-:\s|]+\|\s*$\n(?:^\|.*\|\s*$\n?)+)/gm, (block) => {
    const lines = block.trim().split('\n');
    const headers = lines[0].slice(1, -1).split('|').map(s => s.trim());
    const rows = lines.slice(2).map(l => l.slice(1, -1).split('|').map(s => s.trim()));
    const thead = '<thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead>';
    const tbody = '<tbody>' + rows.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody>';
    return `<table class="md-table">${thead}${tbody}</table>`;
  });

  // 標題
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');

  // 粗體 / 斜體 / 行內 code
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 連結
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

  // 條列清單
  html = html.replace(/(^[-*] .+(?:\n[-*] .+)*)/gm, (block) => {
    const items = block.split('\n').map(l => l.replace(/^[-*] /, '').trim());
    return '<ul>' + items.map(i => `<li>${i}</li>`).join('') + '</ul>';
  });

  // 換行（保留段落）
  html = html.split(/\n{2,}/).map(p => {
    if (/^<(h\d|ul|table)/.test(p.trim())) return p;
    return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  return html;
}
