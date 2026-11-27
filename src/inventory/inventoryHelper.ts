import _ from "lodash";
import useSWR from "swr";
import { useEffect } from "react";
import { useRouter } from "next/router";
import {
  download,
  fetcher,
  parseJson,
  toWebAssetUrl,
  useLocalStorage,
} from "../helper";

const RECORD_URI_PREFIX = "resrec:///";

// "resrec:///U-xxxx/R-xxxx" を分解し、形式が正しいかどうかも返す
export function parseRecordUri(recordUri: string) {
  const strList = _.split(recordUri, "/");
  const recordId = _.last(strList);
  const ownerId = _.get(strList, _.size(strList) - 2);
  const isValid =
    _.startsWith(recordUri, RECORD_URI_PREFIX) &&
    (_.startsWith(ownerId, "U-") || _.startsWith(ownerId, "G-")) &&
    _.startsWith(recordId, "R-");
  return { ownerId, recordId, isValid };
}

// "Inventory\\Foo" -> "Inventory / Foo"
export function formatInventoryPath(path: string): string {
  return _.replace(path, /\\/g, " / ");
}

// "Inventory\\A&B" や "Inventory/A&B" から viewer ページの URL を作る。
// "&" "#" "?" などを含むフォルダ名でも壊れないよう、セグメントごとにエンコードする
export function toViewerUrl(ownerId: string, path: string): string {
  const encodedPath = _(_.split(path, /\\|\//))
    .compact()
    .map(encodeURIComponent)
    .join("/");
  return `/inventory/v1/viewer/${encodeURIComponent(ownerId)}/${encodedPath}`;
}

export function toLinkUrl(ownerId: string, recordId: string): string {
  return `/inventory/v1/link/${encodeURIComponent(
    ownerId
  )}/${encodeURIComponent(recordId)}`;
}

export function getLinkApiUrl(ownerId: string, recordId: string): string {
  return `/api/inventory/v1/link?ownerId=${encodeURIComponent(
    ownerId
  )}&recordId=${encodeURIComponent(recordId)}`;
}
function getAssetOwnerId({ ownerId, recordType, assetUri }: RecordInterface) {
  return recordType === "link"
    ? _.get(_.split(assetUri, "/"), 3, assetUri)
    : ownerId;
}

function getWebThumbnailUri({ thumbnailUri }: RecordInterface) {
  return toWebAssetUrl(thumbnailUri);
}

function getRecordUri({ ownerId, id }: RecordInterface) {
  return `resrec:///${ownerId}/${id}`;
}

function getAssetId({ assetUri }: RecordInterface) {
  return _.first(_.split(_.last(_.split(assetUri, "/")), "."));
}

function getViewerLink(record: RecordInterface) {
  const { name, recordType, ownerId, path } = record;
  switch (recordType) {
    case "link":
      return toLinkUrl(getAssetOwnerId(record), getAssetId(record));
    case "directory":
      return toViewerUrl(ownerId, `${path}\\${name}`);
    default:
      return undefined;
  }
}

function getLink(record: RecordInterface): LinkInterface {
  const { recordType, name, ownerId, id: recordId, path, assetUri } = record;
  const assetOwnerId = getAssetOwnerId(record);
  const assetId = getAssetId(record);

  switch (recordType) {
    case "link":
      return {
        name,
        link: assetUri,
        ownerId: assetOwnerId,
        recordId: assetId,
        path,
      };
    case "directory":
      return {
        name,
        link: getRecordUri(record),
        ownerId,
        path,
        recordId,
      };
    default:
      return undefined;
  }
}

const recordKeys: (keyof RecordInterface)[] = [
  "id",
  "recordType",
  "name",
  "assetUri",
  "thumbnailUri",
  "creationTime",
  "ownerId",
  "ownerName",
  "lastModificationTime",
  "lastModifyingUserId",
  "path",
];

interface RecordInterface {
  id: string;
  recordType: string;
  name: string;
  thumbnailUri: string;
  creationTime: string;
  ownerId: string;
  ownerName: string;
  lastModificationTime: string;
  lastModifyingUserId: string;
  path: string;
  assetUri?: string;
}

function toInventoryRecord(record: RecordInterface) {
  return {
    ...record,
    assetOwnerId: getAssetOwnerId(record),
    webThumbnailUri: getWebThumbnailUri(record),
    recordUri: getRecordUri(record),
    assetId: getAssetId(record),
    viewerLink: getViewerLink(record),
    link: getLink(record),
  };
}

export type InventoryRecord = ReturnType<typeof toInventoryRecord>;

// path はエンコード前のもの ("Inventory/A&B" など)
export function useInventory(ownerId: string, path: string) {
  const result = useSWR<RecordInterface[]>(
    ownerId && path
      ? `/api/inventory/v1/viewer?ownerId=${encodeURIComponent(
          ownerId
        )}&path=${encodeURIComponent(path)}&keys=${recordKeys}&useSort=true`
      : null,
    fetcher
  );
  return { ...result, data: _.map(result.data, toInventoryRecord) };
}

export function useLinkRedirect(ownerId: string, recordId: string) {
  const { data, error } = useSWR<{ ownerId: string; path: string }>(
    ownerId && recordId ? getLinkApiUrl(ownerId, recordId) : null,
    fetcher
  );
  const router = useRouter();
  useEffect(() => {
    const { ownerId, path } = data ?? {};
    if (ownerId && path) {
      router.replace(toViewerUrl(ownerId, path));
    }
  }, [data]);
  return { error };
}

export async function downloadAssetAsBrson(
  assetId: string,
  name: string,
  assetUri: string
) {
  await download(
    `/resonite/assets/${assetId}`,
    `${name}.${assetUri.endsWith("7zbson") ? "7zbson" : "brson"}`
  );
}

export interface LinkInterface {
  name: string;
  link: string;
  ownerId: string;
  recordId: string;
  path: string;
}

export function useLocalLinks() {
  const [state, setState] = useLocalStorage("Inventory.LocalLinks");
  const links: LinkInterface[] = parseJson(state ?? "[]", []);
  const setLinks = (newLinks: LinkInterface[]) => {
    setState(JSON.stringify(newLinks));
  };
  const getLink = (link: string): LinkInterface =>
    _.find(links, ({ link: linkOfList }) => link == linkOfList);

  const pushLink = (newLink: LinkInterface): void => {
    if (!getLink(newLink.link)) {
      setLinks([...links, newLink]);
    }
  };
  const removeLink = (link: string): void => {
    setLinks(_.reject(links, ({ link: linkOfList }) => link == linkOfList));
  };
  return { links, getLink, setLinks, pushLink, removeLink };
}
