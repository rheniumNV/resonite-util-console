import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import _ from "lodash";
import json2emap from "json2emap";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "GET") {
    try {
      const { useEmap, rejectKeys = [] } = req.query;
      // "a,b" / "[a,b]" / 複数指定 (?rejectKeys=a&rejectKeys=b) のいずれも受け付ける
      const rejectKeyList = _(_.castArray(rejectKeys))
        .flatMap((value) => _.split(_.trim(value, "[] "), ","))
        .map((value) => _.trim(value))
        .compact()
        .value();
      const response = await axios.get(
        `https://api.resonite.com/sessions?includeEmptyHeadless=false&minActiveUsers=1`
      );
      const result = _.map(response.data, (session) =>
        _(session)
          .map((value, key) => ({ key, value }))
          .reject(({ key }) => _.includes(rejectKeyList, `${key}`))
          .reduce((prev, { key, value }) => ({ ...prev, [key]: value }), {})
      );
      res.setHeader("Content-Type", "application/json");
      res.status(200).json(useEmap ? json2emap(result) : result);
    } catch (error) {
      console.error(error);
      res.status(500).send("error");
    }
  } else {
    res.status(404).send("error");
  }
};
