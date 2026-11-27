import { NextApiRequest, NextApiResponse } from "next";
import _ from "lodash";
import json2emap from "json2emap";

export const RESONITE_API_BASE = "https://api.resonite.com";

function getOwnerType(ownerId: string): "users" | "groups" {
  return _.startsWith(ownerId, "U-") ? "users" : "groups";
}

export function getRecordsUrl(ownerId: string): string {
  return `${RESONITE_API_BASE}/${getOwnerType(ownerId)}/${ownerId}/records`;
}

// "a,b" / "[a,b]" / 複数指定 (?key=a&key=b) のいずれも配列として受け付ける
export function parseListQuery(value: string | string[] | undefined): string[] {
  return _(_.castArray(value ?? []))
    .flatMap((item) => _.split(_.trim(item, "[] "), ","))
    .map((item) => _.trim(item))
    .compact()
    .value();
}

// GET 以外は 404、例外は 500 を返す共通ラッパー
export function createGetHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "GET") {
      res.status(404).send("error");
      return;
    }
    try {
      await handler(req, res);
    } catch (error) {
      console.error(error);
      res.status(500).send("error");
    }
  };
}

// 戻り値を JSON で返す。?useEmap が指定されたら json2emap で変換する
export function createGetJsonHandler(
  handler: (req: NextApiRequest) => Promise<unknown>
) {
  return createGetHandler(async (req, res) => {
    const result = await handler(req);
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(req.query.useEmap ? json2emap(result) : result);
  });
}
