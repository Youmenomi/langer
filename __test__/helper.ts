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

export const fetched = {
  en: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    setting: {
      language: 'Language',
    },
  },
  zh: {
    confirm: '確認',
    cancel: '取消',
    setting: {
      language: '語言',
    },
  },
} as const;

export const updated = {
  en: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    enter: 'Enter',
    setting: {
      language: 'Language',
      volume: 'Volume',
      quality: 'Quality',
    },
  },
  zh: {
    confirm: '確認',
    cancel: '取消',
    enter: '進入',
    setting: {
      language: '語言',
      volume: '音量',
      quality: '畫質',
    },
  },
  ja: {
    confirm: '確認',
    cancel: 'キャンセル',
    enter: '入力',
    setting: {
      language: '言語',
      volume: 'ボリューム',
      quality: '画質',
    },
  },
} as const;

export const fetchedLangs = Object.keys(fetched);
export async function getFetched(lang: keyof typeof fetched) {
  await delay(100);
  return fetched[lang];
}

export const updatedLangs = Object.keys(updated);
export async function getUpdated(lang: keyof typeof updated) {
  await delay(100);
  return updated[lang];
}
