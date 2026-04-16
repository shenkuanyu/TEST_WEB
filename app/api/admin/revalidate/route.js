import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * POST /api/admin/revalidate
 * 後台儲存後呼叫此 API，立刻清除前台快取，讓新內容馬上生效。
 * Body: { paths: ['/products', '/products/36', '/'] }
 *   或不帶 body → 清除所有頁面快取
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const paths = body.paths;

    if (Array.isArray(paths) && paths.length > 0) {
      for (const p of paths) {
        revalidatePath(p);
      }
    } else {
      // 清除所有前台頁面快取
      revalidatePath('/', 'layout');
    }

    return NextResponse.json({ ok: true, revalidated: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
