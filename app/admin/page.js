import { getDB } from '@/lib/admin-db';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const db = getDB();
  const s = {
    products: db.prepare('SELECT COUNT(*) c FROM products').get().c,
    news: db.prepare('SELECT COUNT(*) c FROM news').get().c,
    members: db.prepare('SELECT COUNT(*) c FROM members').get().c,
    orders: db.prepare('SELECT COUNT(*) c FROM orders').get().c,
  };
  const recent = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 5').all();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">主頁</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="產品總數" value={s.products} color="bg-blue-500" />
        <Stat label="最新消息" value={s.news} color="bg-green-500" />
        <Stat label="會員總數" value={s.members} color="bg-purple-500" />
        <Stat label="訂單/詢問" value={s.orders} color="bg-orange-500" />
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">最近訂單 / 詢問</h2>
        {recent.length === 0 ? (
          <p className="text-gray-400 text-sm">尚無資料</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500 text-left">
                <th className="py-2">#</th>
                <th>姓名</th>
                <th>Email</th>
                <th>狀態</th>
                <th>時間</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(o => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-2">{o.id}</td>
                  <td>{o.contact_name}</td>
                  <td>{o.contact_email}</td>
                  <td><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{o.status}</span></td>
                  <td className="text-gray-500">{o.created_at?.slice(0, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-white rounded-lg p-5 shadow-sm">
      <div className={`w-10 h-10 ${color} rounded-md mb-3`} />
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
