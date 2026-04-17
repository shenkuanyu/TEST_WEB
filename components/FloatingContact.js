'use client';
import { useState } from 'react';

export default function FloatingContact({ line, whatsapp, phone }) {
  const [open, setOpen] = useState(false);

  // 至少有一個聯絡方式才顯示
  const hasLine = !!line;
  const hasWhatsapp = !!whatsapp;
  const hasPhone = !!phone;
  if (!hasLine && !hasWhatsapp && !hasPhone) return null;

  // WhatsApp 號碼格式化（移除 + - 空格）
  const waLink = whatsapp ? `https://wa.me/${whatsapp.replace(/[\s\-+]/g, '')}` : '';
  // LINE 連結（支援 @ 官方帳號或完整 URL）
  const lineLink = line?.startsWith('http') ? line : `https://line.me/R/ti/p/${line}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* 展開的聯絡選項 */}
      {open && (
        <div className="flex flex-col gap-2 mb-1 animate-fade-in">
          {hasLine && (
            <a
              href={lineLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 bg-white rounded-full shadow-lg px-4 py-3 hover:shadow-xl transition group"
              title="LINE 聯繫"
            >
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#06C755] transition">LINE</span>
              <span className="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.271.173-.508.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
              </span>
            </a>
          )}

          {hasWhatsapp && (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 bg-white rounded-full shadow-lg px-4 py-3 hover:shadow-xl transition group"
              title="WhatsApp 聯繫"
            >
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#25D366] transition">WhatsApp</span>
              <span className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </span>
            </a>
          )}

          {hasPhone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-3 bg-white rounded-full shadow-lg px-4 py-3 hover:shadow-xl transition group"
              title="電話聯繫"
            >
              <span className="text-sm font-medium text-gray-700 group-hover:text-brand transition">{phone}</span>
              <span className="w-10 h-10 rounded-full bg-brand flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                </svg>
              </span>
            </a>
          )}
        </div>
      )}

      {/* 主按鈕 */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          open ? 'bg-gray-700 rotate-45' : 'bg-brand hover:bg-brand/90'
        }`}
        aria-label="聯絡我們"
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
