import { Recorder } from '../src';

const LOCAL_STORAGE_KEY = 'langer-local-storage-key';

let saved: { [name: string]: any } = {};
export function presetSaved(lang: string) {
  saved = {
    [LOCAL_STORAGE_KEY]: lang,
  };
}
export function clearSaved() {
  saved = {};
}
export function getSaved(name: string) {
  return saved[name];
}
export function setSaved(name: string, value: any) {
  saved[name] = value;
}

export class AsyncDriver implements Recorder {
  async get() {
    await delay(100);
    return getSaved(LOCAL_STORAGE_KEY) ? getSaved(LOCAL_STORAGE_KEY) : null;
  }

  async set(value: string) {
    await delay(100);
    setSaved(LOCAL_STORAGE_KEY, value);
  }
}

function delay(t: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, t);
  });
}
