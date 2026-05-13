/**
 * 輕量的記憶體型 rate limiter,用來擋登入暴力破解。
 *
 * 限制:
 *   - 重啟 server 後計數歸零(對單機部署足夠)
 *   - 多 instance 部署時各自獨立計數(本專案是單 instance,所以 OK)
 *   - 不防範分散式 IP 攻擊(同一攻擊者用多 IP 仍能繞過)
 *     若未來需要更強,改用 Redis 並依「帳號 + IP」雙鍵管制。
 */

const buckets = new Map();

/**
 * 檢查並消耗一次配額。回傳 { ok: true } 表示允許繼續,
 * { ok: false, retryAfter } 表示已超限,retryAfter 為剩餘秒數。
 *
 * @param {string} key - 識別字串(常用 `route:ip` 或 `route:email`)
 * @param {number} limit - 視窗內允許次數
 * @param {number} windowMs - 視窗大小(毫秒)
 */
export function checkRateLimit(key, limit = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count };
}

/** 取得呼叫端 IP(經過 reverse proxy 時看 X-Forwarded-For) */
export function getClientIp(req) {
  const xff = req.headers.get?.('x-forwarded-for') || req.headers?.['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.ip || 'unknown';
}

// 定期清理過期 bucket,避免記憶體無限增長
if (!global.__rateLimitCleanup) {
  global.__rateLimitCleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(key);
    }
  }, 60 * 1000);
  if (global.__rateLimitCleanup.unref) global.__rateLimitCleanup.unref();
}
