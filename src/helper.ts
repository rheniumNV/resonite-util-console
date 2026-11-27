import { useCallback, useSyncExternalStore } from "react";

export async function download(targetUrl: string, fileName: string) {
  const response = await fetch(targetUrl);
  const data = await response.text();
  const blob = new Blob([data]);
  const element = document.createElement("a");
  element.href = window.URL.createObjectURL(blob);
  element.setAttribute("download", fileName);
  document.body.appendChild(element);
  element.click();
  element.remove();
}

export async function downloadBinary(targetUrl: string, fileName: string) {
  const response = await fetch(targetUrl);
  const blob = await response.blob();
  const element = document.createElement("a");
  element.href = window.URL.createObjectURL(blob);
  element.setAttribute("download", fileName);
  document.body.appendChild(element);
  element.click();
  element.remove();
}

export function copy(text: string): void {
  navigator.clipboard.writeText(text);
}

export async function fetcher(url: string): Promise<any> {
  const response = await fetch(url);
  return response.json();
}

const localStorageListeners = new Set<() => void>();

function subscribeLocalStorage(listener: () => void) {
  localStorageListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    localStorageListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// 同じキーを使う全コンポーネントが同じ値を参照するよう、
// localStorage を外部ストアとして購読する。
export function useLocalStorage(key: string) {
  const state = useSyncExternalStore(
    subscribeLocalStorage,
    () => localStorage.getItem(key),
    () => null
  );
  const setStorage = useCallback(
    (newData: string) => {
      localStorage.setItem(key, newData);
      localStorageListeners.forEach((listener) => listener());
    },
    [key]
  );
  return [state, setStorage];
}

export function parseJson(str: string, fallbackValue: any = {}) {
  try {
    return JSON.parse(str);
  } catch {
    return fallbackValue;
  }
}

export function eraseResoniteRichTextTag(text: string): string {
  return text.replace(
    /<align=(left|center|right)>|<\/align>|<color=[^<>]*>|<\/color>|<b>|<\/b>|<i>|<\/i>|<lowercase>|<\/lowercase>|<uppercase>|<\/uppercase>|<smallcaps>|<\/smallcaps>|<mark=[^<>]*>|<\/mark>|<noparse>|<\/noparse>|<nobr>|<\/nobr>|<size=[^<>]*>|<\/size>|<s>|<\/s>|<u>|<\/u>|<sub>|<\/sub>|<sup>|<\/sup>/g,
    ""
  );
}

// resdb:///<hash>.<ext> 形式をブラウザで表示可能な URL に変換する
export function toWebAssetUrl(resdbUri?: string | null): string | undefined {
  if (!resdbUri) return undefined;
  const fileName = resdbUri.split("/").pop() ?? "";
  return `https://assets.resonite.com/${fileName.split(".")[0]}`;
}
