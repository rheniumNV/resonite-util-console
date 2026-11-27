import axios from "axios";
import _ from "lodash";
import {
  createGetJsonHandler,
  getRecordsUrl,
} from "../../../../src/server/apiHandler";

export default createGetJsonHandler(async (req) => {
  const ownerId = req.query.ownerId as string;
  const recordId = req.query.recordId as string;
  const response = await axios.get(`${getRecordsUrl(ownerId)}/${recordId}`);
  const { name, path } = response.data;
  return { ownerId, path: _.join([path, name], "\\"), name };
});
