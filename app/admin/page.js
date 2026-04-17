import { getDB } from '@/lib/admin-db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const db = getDB();

  // 基本統計
  const s = {
    products: db.prepare('SELECT COUNT(*) c FROM products').get().c,
    published: db.prepare('SELECT COUNT(*) c FROM products WHERE published=1').get().c,
    news: db.prepare('SELECT COUNT(*) c FROM news').get().c,
    members: db.prepare('SELECT COUNT(*) c FROM members').get().c,
    orders: db.prepare('SELECT COUNT(*) c FROM orders').get().c,
  };

  // 最近 7 天的詢價數
  let recentOrders = 0;
  try {
    recentOrders = db.prepare("SELECT COUNT(*) c FROM orders WHERE created_at >= datetime('now', '-7 days')").get().c;
  } catch {}

  // 最近 5 筆詢價
  const recent = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 5').all();

  // 最近新增/更新的產品
  let recentProducts = [];
  try {
    recentProducts = db.prepare('SELECT id, name, model_code, image, updated_at, published FROM products ORDER BY updated_at DESC LIMIT 5').all();
  } catch {}

  // 各分類的產品數量
  let categoryStats = [];
  try {
    categoryStats = db.prepare(`
      SELECT c.name, COUNT(p.id) as count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.published = 1
      GROUP BY c.id
      ORDER BY count DESC
    `).all();
  } catch {}

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">儀表板</h1>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="產品總數" value={s.products} sub={`${s.published} 已上架`} color="bg-blue-500" icon="📦" />
        <StatCard label="最新消息" value={s.news} color="bg-green-500" icon="📰" />
        <StatCard label="會員總數" value={s.members} color="bg-purple-500" icon="👥" />
        <StatCard label="總詢價數" value={s.orders} color="bg-orange-500" icon="📩" />
        <StatCard label="近 7 天詢價" value={recentOrders} color={recentOrders > 0 ? 'bg-brand' : 'bg-gray-400'} icon="🔥" highlight={recentOrders > 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* 最近詢價 */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">最近詢價 / 聯絡</h2>
            <Link href="/admin/orders" className="text-sm text-brand hover:underline">查看全部 →</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">尚無詢價</p>
          ) : (
            <div className="space-y-3">
              {recent.map(o => (
                <div key={o.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-semibold text-sm shrink-0">
                    {(o.contact_name || '?').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">{o.contact_name}</div>
                    <div className="text-xs text-gray-500 truncate">{o.contact_email}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      o.status === 'replied' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {o.status === 'pending' ? '待回覆' : o.status === 'replied' ? '已回覆' : o.status}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">{o.created_at?.slice(0, 10)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 最近更新的產品 */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">最近更新產品</h2>
            <Link href="/admin/products" className="text-sm text-brand hover:underline">管理產品 →</Link>
          </div>
          {recentProducts.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">尚無產品</p>
          ) : (
            <div className="space-y-3">
              {recentProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                  {p.image ? (
                    <img src={p.image} alt="" className="w-10 h-10 rounded object-contain bg-gray-100 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-100 shrink-0 flex items-center justify-center text-gray-400 text-xs">N/A</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">{p.name}</div>
                    {p.model_code && <div className="text-xs text-brand font-mono">{p.model_code}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      p.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {p.published ? '上架' : '下架'}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">{p.updated_at?.slice(0, 10) || ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 分類統計 */}
      {categoryStats.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">各分類產品數</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categoryStats.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700 truncate">{c.name}</span>
                <span className="text-lg font-semibold text-gray-900 ml-2">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 快捷操作提示 */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <strong>提示：</strong>如需查看網站流量統計，請到
        <Link href="/admin/settings" className="text-brand underline mx-1">網站設定 → 統計代碼</Link>
        填入 Google Analytics 的 GA4 ID，即可在
        <a href="https://analytics.google.com" target="_blank" rel="noreferrer" className="text-brand underline mx-1">Google Analytics</a>
        查看完整的訪客數據。
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon, highlight }) {
  return (
    <div className={`bg-white rounded-lg p-5 shadow-sm ${highlight ? 'ring-2 ring-brand/30' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${color} rounded-md flex items-center justify-center text-white text-lg`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}
