import axios from "axios";

// 外部 API への負荷を抑えるための、プロセス内のシンプルな TTL キャッシュ。
// Promise ごと保持するので、同時に来た同じリクエストは 1 回の取得にまとまる。
// 失敗した取得はキャッシュしない。

export const TTL = {
  sessions: 30 * 1000,
  records: 60 * 1000,
  record: 5 * 60 * 1000,
  // アセットはハッシュで識別され内容が変わらない
  asset: 60 * 60 * 1000,
};

const MAX_ENTRIES = 500;

interface Entry {
  expiresAt: number;
  promise: Promise<unknown>;
}

const cache = new Map<string, Entry>();

function prune(now: number) {
  if (cache.size <= MAX_ENTRIES) return;
  cache.forEach((entry, key) => {
    if (entry.expiresAt <= now) cache.delete(key);
  });
  // それでも多ければ古いものから捨てる (Map は挿入順)
  const keys = cache.keys();
  while (cache.size > MAX_ENTRIES) {
    cache.delete(keys.next().value);
  }
}

export function cachedGet<T = any>(url: string, ttlMs: number): Promise<T> {
  const now = Date.now();
  const hit = cache.get(url);
  if (hit && hit.expiresAt > now) {
    return hit.promise as Promise<T>;
  }

  const promise = axios.get<T>(url).then((response) => response.data);
  cache.set(url, { expiresAt: now + ttlMs, promise });
  promise.catch(() => {
    if (cache.get(url)?.promise === promise) {
      cache.delete(url);
    }
  });
  prune(now);
  return promise;
}
