import _ from "lodash";
import {
  ID_PATTERNS,
  createGetJsonHandler,
  getQueryString,
  getRecordsUrl,
} from "../../../../src/server/apiHandler";
import { TTL, cachedGet } from "../../../../src/server/cache";

export default createGetJsonHandler(async (req) => {
  const ownerId = getQueryString(req, "ownerId", ID_PATTERNS.ownerId);
  const recordId = getQueryString(req, "recordId", ID_PATTERNS.recordId);
  const { name, path } = await cachedGet(
    `${getRecordsUrl(ownerId)}/${encodeURIComponent(recordId)}`,
    TTL.record
  );
  return { ownerId, path: _.join([path, name], "\\"), name };
});
