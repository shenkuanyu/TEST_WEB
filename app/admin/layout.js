import Link from 'next/link';
import { getAdminSession } from '@/lib/auth';
import { getCurrentAdminSite } from '@/lib/admin-db';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const admin = await getAdminSession();
  const currentSite = getCurrentAdminSite();
  const isMachines = currentSite === 'machines';
  const targetSite = isMachines ? 'components' : 'machines';

  const fontStyle = { fontSize: '110%' };

  if (!admin) {
    return (
      <div style={fontStyle} className="min-h-screen bg-gray-100 flex items-center justify-center">
        {children}
      </div>
    );
  }

  return (
    <div style={fontStyle} className="min-h-screen flex bg-gray-100">
      <aside className="w-72 bg-gray-900 text-gray-100 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="text-xl font-semibold">
            後台管理
            <span className={`ml-2 inline-block align-middle px-2 py-0.5 text-xs rounded ${isMachines ? 'bg-brand' : 'bg-blue-700'}`}>
              {isMachines ? '機台' : '零組件'}
            </span>
          </div>
          <div className="text-sm text-gray-400 mt-1">{admin.email}</div>
        </div>

        {/* 同站切換器：form POST → 設 cookie → 重新載入 */}
        <form action="/api/admin/switch-site" method="POST" className="mx-3 mt-3 mb-1">
          <input type="hidden" name="site" value={targetSite} />
          <input type="hidden" name="next" value="/admin" />
          <button
            type="submit"
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded border-2 border-dashed text-sm transition ${
              isMachines
                ? 'border-blue-600 text-blue-300 hover:bg-blue-900/30'
                : 'border-brand text-red-300 hover:bg-red-900/30'
            }`}
          >
            <span>切換到{isMachines ? '零組件' : '機台'}後台</span>
            <span>⇄</span>
          </button>
        </form>
        <p className="px-4 text-[11px] text-gray-500 mb-2 leading-relaxed">
          在同一分頁切換；URL 不變
        </p>

        <nav className="flex-1 px-2 py-4 space-y-1 text-[24px]">
          <NavLink href="/admin">主頁</NavLink>
          <NavLink href="/admin/banners">主頁輪播</NavLink>
          <NavLink href="/admin/products">產品管理</NavLink>
          <NavLink href="/admin/news">最新消息</NavLink>
          <NavLink href="/admin/contacts">聯絡人</NavLink>
          <NavLink href="/admin/orders">訂單 / 詢問</NavLink>
          <NavLink href="/admin/settings">網站設定</NavLink>
        </nav>

        <form action="/api/auth/admin-logout" method="POST" className="p-4 border-t border-gray-800">
          <button className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-base">登出</button>
        </form>
        <Link href="/" className="px-4 py-3 text-sm text-gray-400 hover:text-white border-t border-gray-800">
          ← 回到前台
        </Link>
      </aside>
      <main className="flex-1 p-8 overflow-x-auto text-base [&_*]:!text-base">{children}</main>
    </div>
  );
}

function NavLink({ href, children }) {
  return (
    <Link href={href} className="block px-4 py-2 rounded hover:bg-gray-800 transition">
      {children}
    </Link>
  );
}
