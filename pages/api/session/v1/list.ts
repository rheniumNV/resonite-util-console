import axios from "axios";
import _ from "lodash";
import {
  RESONITE_API_BASE,
  createGetJsonHandler,
  parseListQuery,
} from "../../../../src/server/apiHandler";

export default createGetJsonHandler(async (req) => {
  const rejectKeys = parseListQuery(req.query.rejectKeys);
  const response = await axios.get(
    `${RESONITE_API_BASE}/sessions?includeEmptyHeadless=false&minActiveUsers=1`
  );
  return _.map(response.data, (session) => _.omit(session, rejectKeys));
});
