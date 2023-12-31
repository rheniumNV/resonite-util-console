import { useState } from "react";

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

export function useLocalStorage(key: string) {
  const [state, setState] = useState(localStorage.getItem(key));
  const setStorage = (newData) => {
    localStorage.setItem(key, newData);
    setState(newData);
  };
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
    /<align=(left|center|right)>|<\/align>|<color=[^<>]*>|<\/color>|<b>|<\/b>|<i>|<\/i>|<lowercase>|<\/lowercase>|<uppercase>|<\/uppercase>|<smallcaps>|<\/smallcaps>|<mark=[^<>]>|<\/mark>|<noparse>|<\/noparse>|<nobr>|<\/nobr>|<size=[^<>]*>|<\/size>|<s>|<\/s>|<u>|<\/u>|<sub>|<\/sub>|<sup>|<\/sup>/g,
    ""
  );
}
