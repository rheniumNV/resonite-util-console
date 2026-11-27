import axios from "axios";
import _ from "lodash";
import {
  RESONITE_API_BASE,
  createGetJsonHandler,
  parseListQuery,
} from "../../../../src/server/apiHandler";

const DEFAULT_MIN_ACTIVE_USERS = 1;

function parseMinActiveUsers(value: string | string[] | undefined): number {
  const parsed = parseInt(_.head(_.castArray(value ?? [])), 10);
  return Number.isNaN(parsed) ? DEFAULT_MIN_ACTIVE_USERS : parsed;
}

export default createGetJsonHandler(async (req) => {
  const rejectKeys = parseListQuery(req.query.rejectKeys);
  const minActiveUsers = parseMinActiveUsers(req.query.minActiveUsers);
  const response = await axios.get(
    `${RESONITE_API_BASE}/sessions?includeEmptyHeadless=false&minActiveUsers=${minActiveUsers}`
  );
  // Resonite API は現在 minActiveUsers / includeEmptyHeadless を無視して
  // 0 人のセッションも返すため、こちらでも絞り込む
  return _(response.data)
    .filter(({ totalActiveUsers }) => (totalActiveUsers ?? 0) >= minActiveUsers)
    .map((session) => _.omit(session, rejectKeys))
    .value();
});
