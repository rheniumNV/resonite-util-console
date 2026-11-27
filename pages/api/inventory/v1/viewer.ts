import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import _ from "lodash";
import json2emap from "json2emap";

function filterItem(list, keys) {
  return keys
    ? _.map(list, (map) =>
        _.reduce(
          map,
          (prev, curr, key) =>
            _.includes(keys, key) ? { ...prev, ...{ [key]: curr } } : prev,
          {}
        )
      )
    : list;
}

function sortItem(list, useSort) {
  return useSort
    ? _.sortBy(list, ({ recordType, name, creationTime }) => [
        _.get(
          {
            object: 1,
            directory: 0,
            link: 0,
          },
          recordType,
          -1
        ),
        recordType === "object" ? creationTime : _.toLower(name),
      ])
    : list;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "GET") {
    try {
      const { ownerId, path, useEmap, keys, useSort } = req.query;
      const ownerType = _.startsWith(ownerId as string, "U-")
        ? "users"
        : "groups";

      const fixedPath = encodeURI(
        _.replace(path as string, new RegExp("/", "g"), "\\")
      );
      const response = await axios.get(
        `https://api.resonite.com/${ownerType}/${ownerId}/records?path=${fixedPath}`
      );
      const result = filterItem(sortItem(response.data, useSort), keys);
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
