import _ from "lodash";
import {
  createGetJsonHandler,
  getRecordsUrl,
  parseListQuery,
} from "../../../../src/server/apiHandler";
import { TTL, cachedGet } from "../../../../src/server/cache";

const recordTypeOrder = { directory: 0, link: 0, object: 1 };

function sortRecords(records) {
  return _.sortBy(records, ({ recordType, name, creationTime }) => [
    _.get(recordTypeOrder, recordType, -1),
    recordType === "object" ? creationTime : _.toLower(name),
  ]);
}

export default createGetJsonHandler(async (req) => {
  const { useSort } = req.query;
  const ownerId = req.query.ownerId as string;
  const path = req.query.path as string;
  const keys = parseListQuery(req.query.keys);

  const fixedPath = encodeURI(_.replace(path, /\//g, "\\"));
  const fetched = await cachedGet(
    `${getRecordsUrl(ownerId)}?path=${fixedPath}`,
    TTL.records
  );
  const records = useSort ? sortRecords(fetched) : fetched;
  return _.isEmpty(keys)
    ? records
    : _.map(records, (record) =>
        // 元のキー順を保つ (emap 出力の順序が変わらないように)
        _.pickBy(record, (_value, key) => _.includes(keys, key))
      );
});
