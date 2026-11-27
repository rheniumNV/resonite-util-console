import _ from "lodash";
import {
  RESONITE_API_BASE,
  createGetJsonHandler,
  parseListQuery,
} from "../../../../src/server/apiHandler";
import { TTL, cachedGet } from "../../../../src/server/cache";

const DEFAULT_MIN_ACTIVE_USERS = 1;

function parseMinActiveUsers(value: string | string[] | undefined): number {
  const parsed = parseInt(_.head(_.castArray(value ?? [])), 10);
  return Number.isNaN(parsed) ? DEFAULT_MIN_ACTIVE_USERS : parsed;
}

export default createGetJsonHandler(async (req) => {
  const rejectKeys = parseListQuery(req.query.rejectKeys);
  const minActiveUsers = parseMinActiveUsers(req.query.minActiveUsers);
  // Resonite API は現在 minActiveUsers / includeEmptyHeadless を無視して
  // 0 人のセッションも返すため、絞り込みはこちらで行う。
  // 上流の URL を固定して、minActiveUsers が違ってもキャッシュを共有する。
  const sessions = await cachedGet(
    `${RESONITE_API_BASE}/sessions`,
    TTL.sessions
  );
  return _(sessions)
    .filter(({ totalActiveUsers }) => (totalActiveUsers ?? 0) >= minActiveUsers)
    .map((session) => _.omit(session, rejectKeys))
    .value();
});
