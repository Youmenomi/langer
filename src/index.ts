import { defaults } from 'custom-defaults';
import { Dictionary, StringKeyof } from './helper';

type Says<TSays extends Dictionary> = TSays[keyof TSays];

export type Recorder = {
  get: () => Promise<string | null> | (string | null);
  set: (lang: string) => Promise<void> | void;
};

export type Preset =
  | string
  | ((
      availableLanguages: string[],
      navigatorLanguages: string[]
    ) => Promise<string> | string);

export type Options = {
  recorder?: Recorder;
  preset?: Preset;
};

export const LOCAL_STORAGE_KEY = 'langer-local-storage-key';
export const recorder: Recorder = {
  get: () => {
    return localStorage.getItem(LOCAL_STORAGE_KEY);
  },
  set: (lang: string) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, lang);
  },
};

export function presetLanguage(
  availableLanguages: string[],
  priorities: Readonly<string[]>
) {
  let found: string | undefined;
  priorities.some((lang) => {
    if (availableLanguages.includes(lang)) {
      found = lang;
      return true;
    }
    lang = lang.split('-')[0];
    if (availableLanguages.includes(lang)) {
      found = lang;
      return true;
    }
    return false;
  });
  if (!found)
    throw new Error(
      '[langer] The presetLanguage function cannot preset the current language.'
    );
  return found;
}

function getDefOptions() {
  return {
    preset: presetLanguage,
    recorder,
  };
}

export class Langer<TData = Dictionary> {
  protected _says?: Dictionary = undefined;
  protected _data?: any = undefined;
  protected _availableLanguages?: string[] = undefined;
  protected _currLanguage?: string = undefined;

  protected _recorder: Recorder;
  protected _preset: Preset;

  protected _initialized = false;
  get initialized() {
    return this._initialized;
  }

  protected _disposed = false;
  get disposed() {
    return this._disposed;
  }

  constructor(options?: Options) {
    const { recorder, preset } = defaults(options, getDefOptions());
    this._recorder = recorder;
    this._preset = preset;
  }

  protected setSays(value: Dictionary) {
    this._says = value;
  }
  protected setAvailableLanguages(value: string[]) {
    this._availableLanguages = value;
  }
  protected setCurrLanguage(value: string) {
    this._currLanguage = value;
  }

  protected setInitialized() {
    this._initialized = true;
  }

  async initialize<T extends Dictionary = Dictionary>(
    data: T,
    reset = false
  ): Promise<Langer<T>> {
    if (this._initialized) {
      throw new Error('[langer] Invalid operation. This has been initialized.');
    }
    await this.internalUpdate(data, reset);
    this.setInitialized();
    return (this as unknown) as Langer<T>;
  }

  protected async internalUpdate(data: Dictionary, reset: boolean) {
    this._data = data;
    const langs = Object.keys(this._data);
    if (!langs || langs.length === 0) {
      throw new Error(
        '[langer] Initialization failed. Unable to get the list of available languages.'
      );
    }
    this.setAvailableLanguages(langs);

    if (reset) {
      await this.resetLanguage();
      return;
    }

    const lang = this._currLanguage || (await this._recorder.get());
    if (lang) {
      await this.changeSays(lang);
    } else {
      await this.resetLanguage();
    }
  }

  async update<T extends Dictionary = Dictionary>(
    data: T,
    reset = false
  ): Promise<Langer<T>> {
    if (!this._initialized || this._disposed) {
      throw new Error(
        '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
      );
    }
    await this.internalUpdate(data, reset);
    return (this as unknown) as Langer<T>;
  }

  protected async changeSays(language: StringKeyof<keyof TData> | string) {
    this.setCurrLanguage(language);
    await this._recorder.set(language);
    this.setSays(this._data[language]);
  }

  get availableLanguages() {
    if (!this._availableLanguages) {
      throw new Error(
        '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
      );
    }
    return this._availableLanguages as StringKeyof<TData>[];
  }
  get speaking() {
    if (!this._currLanguage) {
      throw new Error(
        '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
      );
    }
    return this._currLanguage as StringKeyof<TData>;
  }
  get says() {
    if (!this._says) {
      throw new Error(
        '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
      );
    }
    return this._says as Says<TData>;
  }

  async speak(language: keyof TData & string) {
    if (!this._availableLanguages) {
      throw new Error(
        '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
      );
    }
    if (!this._availableLanguages.includes(language)) {
      throw new Error(
        `[langer] Cannot speak the "${language}" language that are not on the available languages(${this._availableLanguages}).`
      );
    }
    await this.changeSays(language);
  }

  async resetLanguage() {
    if (!this._availableLanguages) {
      throw new Error(
        '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
      );
    }

    let lang: string;
    if (typeof this._preset === 'string') {
      lang = this._preset;
    } else {
      lang = await this._preset(
        this._availableLanguages,
        navigator.languages as string[]
      );
    }

    if (!this._availableLanguages.includes(lang)) {
      throw new Error(
        `[langer] The preset language "${lang}" is not on the available languages(${this._availableLanguages}).`
      );
    }

    await this.changeSays(lang);
    return lang as StringKeyof<TData>;
  }

  dispose() {
    if (this._disposed) {
      throw new Error('[langer] Invalid operation. This has been disposed.');
    }

    //@ts-expect-error
    this._recorder = undefined;
    //@ts-expect-error
    this._preset = undefined;

    //@ts-expect-error
    this.setSays(undefined);
    this._data = undefined;
    //@ts-expect-error
    this.setAvailableLanguages(undefined);
    //@ts-expect-error
    this.setCurrLanguage(undefined);

    this._disposed = true;
  }
}
