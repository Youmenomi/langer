import { defaults } from 'custom-defaults';

export type DriverInterface<TSays = any, TLangs extends string[] = string[]> = {
  onAvailableLanguages: () => Promise<TLangs> | TLangs;
  onPresetLanguage: (
    availableLanguages: TLangs
  ) => Promise<TLangs[number]> | TLangs[number];
  onSpeakingChange: (Language: TLangs[number]) => Promise<TSays> | TSays;
};

export type Recorder = {
  get: () => Promise<string | null> | (string | null);
  set: (lang: string) => Promise<void> | void;
};

export type Options<
  TDriver,
  TSays = any,
  TLangs extends string[] = string[]
> = {
  driver?: TDriver & DriverInterface<TSays, TLangs>;
  recorder?: Recorder;
};

export const LOCAL_STORAGE_KEY = 'langer-local-storage-key';
export const defaultRecorder: Recorder = {
  get: () => {
    return localStorage.getItem(LOCAL_STORAGE_KEY);
  },
  set: (lang: string) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, lang);
  },
};

export class Langer<
  TSays = any,
  TLangs extends string[] = string[],
  TDriver = undefined
> {
  protected _driver: DriverInterface<TSays, TLangs> | undefined;
  protected get driver() {
    if (!this._driver) {
      throw new Error('[langer] Driver not detected.');
    }
    return this._driver;
  }

  protected _recorder: Recorder;
  protected async setRecord(Language: string) {
    await this._recorder.set(Language);
  }
  protected async getRecord() {
    return await this._recorder.get();
  }

  protected _availableLanguages?: TLangs = undefined;
  get availableLanguages() {
    if (!this._availableLanguages) {
      throw new Error(
        '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
      );
    }
    return this._availableLanguages;
  }
  protected setAvailableLanguages(value: TLangs) {
    this._availableLanguages = value;
  }

  protected _says?: TSays = undefined;
  get says() {
    if (!this._says) {
      throw new Error(
        '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
      );
    }
    return this._says;
  }
  protected setSays(value: TSays) {
    this._says = value;
  }

  protected _currLanguage?: TLangs[number] = undefined;
  get speaking() {
    if (!this._currLanguage) {
      throw new Error(
        '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
      );
    }
    return this._currLanguage;
  }
  protected setCurrLanguage(value: TLangs[number]) {
    this._currLanguage = value;
  }

  protected _initialized = false;
  get initialized() {
    return this._initialized;
  }
  protected setInitialized() {
    this._initialized = true;
  }

  protected _disposed = false;
  get disposed() {
    return this._disposed;
  }

  constructor(options?: Options<TDriver, TSays, TLangs>) {
    const { driver, recorder } = defaults(options, {
      recorder: defaultRecorder,
    });
    this._driver = driver;
    this._recorder = recorder;
  }

  async initialize<
    TSays = any,
    TLangs extends string[] = string[],
    TDriver = undefined
  >(restore = false, driver?: TDriver & DriverInterface<TSays, TLangs>) {
    if (!this._disposed && this._initialized) {
      throw new Error('[langer] Invalid operation. This has been initialized.');
    }

    if (driver) this._driver = driver as any;
    await this.boost(restore);
    this.setInitialized();
    return (this as any) as TDriver extends undefined
      ? this
      : Langer<TSays, TLangs>;
  }

  protected async boost(restore: boolean) {
    if (this._disposed) {
      throw new Error('[langer] Invalid operation. This has been disposed.');
    }

    const langs = await this.onAvailableLanguages();
    this.setAvailableLanguages(langs);

    let lang: string | null = null;
    if (!restore) {
      lang = await this.getRecord();
    }

    if (restore || !lang) {
      await this.restore();
    } else {
      await this.speak(lang);
    }
  }

  protected async onAvailableLanguages() {
    const langs = await this.driver.onAvailableLanguages();
    if (!Array.isArray(langs)) {
      throw new Error(
        `[langer] The "onAvailableLanguages" owned by the driver needs to return an array of available languages.`
      );
    }
    return langs;
  }

  async restore() {
    const currLanguage = this._currLanguage;
    const lang = await this.onPresetLanguage();
    if (lang !== currLanguage) {
      await this.speak(lang);
    }
    return lang;
  }

  protected async onPresetLanguage() {
    const langs = this.availableLanguages;
    const lang = await this.driver.onPresetLanguage(langs);
    if (!this.isAvailable(lang)) {
      throw new Error(
        `[langer] The preset language "${lang}" is not on the available languages(${langs}).`
      );
    }
    return lang;
  }

  isAvailable(Language: string) {
    return this.availableLanguages.includes(Language);
  }

  async speak(language: TLangs[number]) {
    const langs = this.availableLanguages;
    if (!langs.includes(language)) {
      throw new Error(
        `[langer] Can not find the "${language}" language among the available languages(${langs}).`
      );
    }
    this.setSays(await this.onSpeakingChange(language));
    await this.setRecord(language);
    this.setCurrLanguage(language);
  }

  protected async onSpeakingChange(lang: string) {
    const says = await this.driver.onSpeakingChange(lang);
    if (!says) {
      throw new Error(
        `[langer] The onSpeakingChange(${lang}) of the driver must return a value.`
      );
    }
    return says;
  }

  async reset<
    TSays = any,
    TLangs extends string[] = string[],
    TDriver = undefined
  >(driver?: TDriver & DriverInterface<TSays, TLangs>, restore = false) {
    if (!this._initialized) {
      throw new Error('[langer] Invalid operation. Not initialized yet.');
    }

    if (driver) this._driver = driver as any;
    await this.boost(restore);
    return (this as any) as TDriver extends undefined
      ? this
      : Langer<TSays, TLangs>;
  }

  dispose() {
    if (this._disposed) {
      throw new Error('[langer] Invalid operation. This has been disposed.');
    }
    this._driver = undefined;
    //@ts-expect-error
    this._recorder = undefined;
    this._says = undefined;
    this._availableLanguages = undefined;
    this._currLanguage = undefined;

    this._disposed = true;
  }
}

export function presetLanguage<TLangs extends string[]>(
  availableLanguages: TLangs,
  priorities: readonly string[]
) {
  let found: TLangs[number] | undefined;
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
  if (!found) throw new Error('[langer] Cannot preset language.');
  return found;
}

export class Driver01<
  TData extends { [lang in string]: TSays },
  TLang extends string = Exclude<keyof TData, number | symbol>,
  TSays = TData[TLang],
  TLangs extends string[] = TLang[]
> implements DriverInterface<TSays, TLangs> {
  constructor(
    private _data: TData,
    private _priorities = navigator.languages
  ) {}
  update<
    TData extends { [lang in string]: TSays },
    TLang extends string = Exclude<keyof TData, number | symbol>,
    TSays = TData[TLang],
    TLangs extends string[] = TLang[]
  >(data: TData) {
    this._data = data as any;
    return (this as any) as Driver01<TData, TLang, TSays, TLangs>;
  }
  onAvailableLanguages() {
    return Object.keys(this._data) as TLangs;
  }
  onPresetLanguage(availableLanguages: TLangs) {
    return presetLanguage(availableLanguages, this._priorities);
  }
  onSpeakingChange(Language: keyof TData) {
    return this._data[Language];
  }
  dispose() {
    //@ts-expect-error
    this._data = undefined;
    //@ts-expect-error
    this._priorities = undefined;
  }
}

export class Driver02<TSays, TLangs extends string[]>
  implements DriverInterface<TSays, TLangs> {
  constructor(
    private _availableLanguages: TLangs,
    private _onSpeakingChange: (Language: TLangs[number]) => TSays,
    private _priorities = navigator.languages
  ) {}
  update<TSays, TLangs extends string[]>(
    availableLanguages: TLangs,
    onSpeakingChange: (Language: TLangs[number]) => TSays
  ) {
    this._availableLanguages = availableLanguages as any;
    this._onSpeakingChange = onSpeakingChange as any;
    return (this as any) as Driver02<TSays, TLangs>;
  }
  onAvailableLanguages() {
    return this._availableLanguages;
  }
  onPresetLanguage(availableLanguages: TLangs) {
    return presetLanguage(availableLanguages, this._priorities);
  }
  onSpeakingChange(Language: TLangs[number]) {
    return this._onSpeakingChange(Language);
  }
  dispose() {
    //@ts-expect-error
    this._availableLanguages = undefined;
    //@ts-expect-error
    this._onSpeakingChange = undefined;
    //@ts-expect-error
    this._priorities = undefined;
  }
}
