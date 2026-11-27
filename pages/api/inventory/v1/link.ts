import _ from "lodash";
import {
  createGetJsonHandler,
  getRecordsUrl,
} from "../../../../src/server/apiHandler";
import { TTL, cachedGet } from "../../../../src/server/cache";

export default createGetJsonHandler(async (req) => {
  const ownerId = req.query.ownerId as string;
  const recordId = req.query.recordId as string;
  const { name, path } = await cachedGet(
    `${getRecordsUrl(ownerId)}/${recordId}`,
    TTL.record
  );
  return { ownerId, path: _.join([path, name], "\\"), name };
});
