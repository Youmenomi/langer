import {
  action,
  autorun,
  computed,
  configure,
  makeObservable,
  observable,
} from 'mobx';
import { Driver01, Driver02, Langer, presetLanguage } from '../src';
import {
  AsyncDriver,
  clearSaved,
  fetched,
  fetchedLangs,
  getFetched,
  getSaved,
  getUpdated,
  presetSaved,
  setSaved,
  updated,
  updatedLangs,
} from './helper';

const priorities = ['en-US', 'en', 'zh-TW', 'zh'];
const presetResult = 'en';

let driver01 = new Driver01(fetched);
let driver02 = new Driver02(
  fetchedLangs as (keyof typeof fetched)[],
  async (lang) => {
    return await getFetched(lang);
  }
);

describe('langer', () => {
  jest
    .spyOn(Object.getPrototypeOf(localStorage) as Storage, 'getItem')
    .mockImplementation((name: string) => {
      return getSaved(name) ? getSaved(name) : null;
    });
  jest
    .spyOn(Object.getPrototypeOf(localStorage) as Storage, 'setItem')
    .mockImplementation((name: string, value: string) => {
      setSaved(name, value);
    });

  jest
    .spyOn(navigator as NavigatorLanguage, 'languages', 'get')
    .mockImplementation(() => {
      return priorities;
    });

  beforeEach(() => {
    clearSaved();

    driver01 = new Driver01(fetched, priorities);
    driver02 = new Driver02(
      fetchedLangs as (keyof typeof fetched)[],
      (lang) => {
        return getFetched(lang);
      }
    );
  });

  it('presetLanguage', async () => {
    expect(presetLanguage(Object.keys(fetched), navigator.languages)).toBe(
      'en'
    );
    expect(presetLanguage(Object.keys(fetched), ['zh'])).toBe('zh');
    expect(() => presetLanguage(Object.keys(fetched), ['ja'])).toThrowError(
      '[langer] Cannot preset language.'
    );
  });

  it('driver01', async () => {
    const driver = new Driver01(fetched, ['ja', 'zh']);
    let availableLanguages = driver.onAvailableLanguages();
    expect(availableLanguages).toEqual(Object.keys(fetched));
    expect(driver.onPresetLanguage(availableLanguages)).toEqual('zh');
    expect(driver.onSpeakingChange('en')).toEqual(fetched.en);

    driver.update(updated);
    availableLanguages = driver.onAvailableLanguages();
    expect(availableLanguages).toEqual(Object.keys(updated));
    expect(driver.onPresetLanguage(availableLanguages)).toEqual('ja');
    expect(driver.onSpeakingChange('zh')).toEqual(updated.zh);

    expect(() => driver.dispose()).not.toThrow();
  });

  it('driver02', async () => {
    const driver = new Driver02(
      fetchedLangs as (keyof typeof fetched)[],
      async (lang) => {
        return await getFetched(lang);
      },
      ['ja', 'zh']
    );
    let availableLanguages = driver.onAvailableLanguages();
    expect(availableLanguages).toEqual(Object.keys(fetched));
    expect(driver.onPresetLanguage(availableLanguages)).toEqual('zh');
    expect(await driver.onSpeakingChange('en')).toEqual(fetched.en);

    driver.update(updatedLangs as (keyof typeof updated)[], async (lang) => {
      return await getUpdated(lang);
    });
    availableLanguages = driver.onAvailableLanguages();
    expect(availableLanguages).toEqual(Object.keys(updated));
    expect(driver.onPresetLanguage(availableLanguages)).toEqual('ja');
    expect(await driver.onSpeakingChange('zh')).toEqual(updated.zh);

    expect(() => driver.dispose()).not.toThrow();
  });

  it('before initialized', async () => {
    const langer = new Langer({ driver: driver01 });
    expect(langer.initialized).toBeFalsy();
    expect(langer.disposed).toBeFalsy();
    expect(() => langer.availableLanguages).toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    await expect(async () => await langer.restore()).rejects.toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    expect(() => langer.isAvailable('unknow')).toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    await expect(async () => await langer.reset()).rejects.toThrowError(
      '[langer] Invalid operation. Not initialized yet.'
    );
    expect(() => langer.says).toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    await expect(async () => await langer.speak('zh')).rejects.toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    expect(() => langer.speaking).toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    expect(() => langer.dispose()).not.toThrow();
    await expect(async () => await langer.initialize()).rejects.toThrowError(
      '[langer] Invalid operation. This has been disposed.'
    );
  });

  it('after disposed', async () => {
    const langer = new Langer({ driver: driver02 });
    await langer.initialize();
    langer.dispose();
    expect(langer.initialized).toBeTruthy();
    expect(langer.disposed).toBeTruthy();
    expect(() => langer.availableLanguages).toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    await expect(async () => await langer.restore()).rejects.toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    expect(() => langer.isAvailable('unknow')).toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    await expect(async () => await langer.reset()).rejects.toThrowError(
      '[langer] Invalid operation. This has been disposed.'
    );
    expect(() => langer.says).toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    await expect(async () => await langer.speak('zh')).rejects.toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    expect(() => langer.speaking).toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    await expect(async () => await langer.dispose()).rejects.toThrowError(
      '[langer] Invalid operation. This has been disposed.'
    );
    await expect(async () => await langer.initialize()).rejects.toThrowError(
      '[langer] Invalid operation. This has been disposed.'
    );
  });

  it('normal', async () => {
    presetSaved('zh');

    let langer = new Langer({ driver: driver01 });
    await langer.initialize();
    expect(langer.initialized).toBeTruthy();
    expect(langer.availableLanguages).toEqual(Object.keys(fetched));
    expect(langer.speaking).toBe('zh');
    expect(langer.says.cancel).toBe(fetched.zh.cancel);
    expect(langer.says.setting.language).toBe(fetched.zh.setting.language);

    expect(await langer.restore()).toBe(presetResult);
    expect(langer.speaking).toEqual(presetResult);
    expect(langer.says.cancel).toBe(fetched.en.cancel);
    expect(langer.says.setting.language).toBe(fetched.en.setting.language);

    await langer.speak('zh');
    expect(langer.speaking).toBe('zh');
    expect(langer.says.cancel).toBe(fetched.zh.cancel);
    expect(langer.says.setting.language).toBe(fetched.zh.setting.language);

    driver01.update(updated);
    await langer.reset();
    expect(langer.availableLanguages).toEqual(Object.keys(updated));
    expect(langer.speaking).toBe('zh');
    //@ts-expect-error
    expect(langer.says.enter).toBe(updated.zh.enter);
    //@ts-expect-error
    expect(langer.says.setting.quality).toBe(updated.zh.setting.quality);

    //@ts-expect-error
    await langer.speak('ja');
    expect(langer.speaking).toBe('ja');
    expect(langer.says.cancel).toBe(updated.ja.cancel);
    expect(langer.says.setting.language).toBe(updated.ja.setting.language);

    langer = await langer.reset(driver02, true);
    expect(langer.availableLanguages).toEqual(Object.keys(fetched));
    expect(langer.speaking).toBe('en');
    expect(langer.says.cancel).toBe(fetched.en.cancel);
    expect(langer.says.setting.language).toBe(fetched.en.setting.language);

    const updatedLanger = await langer.reset(
      driver02.update(
        updatedLangs as (keyof typeof updated)[],
        async (lang) => {
          return await getUpdated(lang);
        }
      )
    );
    expect(updatedLanger === langer).toBeTruthy();
    expect(updatedLanger.availableLanguages).toEqual(Object.keys(updated));
    expect(updatedLanger.speaking).toBe('en');
    expect(updatedLanger.says.enter).toBe(updated.en.enter);
    expect(updatedLanger.says.setting.quality).toBe(updated.en.setting.quality);

    await updatedLanger.speak('ja');
    expect(updatedLanger.speaking).toBe('ja');
    expect(updatedLanger.says.cancel).toBe(updated.ja.cancel);
    expect(updatedLanger.says.setting.language).toBe(
      updated.ja.setting.language
    );

    updatedLanger.dispose();
    expect(langer.disposed).toBeTruthy();
  });

  it('recorder', async () => {
    {
      const langer = await new Langer({ driver: driver01 }).initialize();
      expect(langer.speaking).toBe(presetResult);
      await langer.speak('zh');
    }

    {
      const langer = await new Langer({ driver: driver01 }).initialize();
      const otherLanger = await langer.reset(driver01.update(updated));
      expect(otherLanger.speaking).toBe('zh');
      expect(otherLanger.says.setting.quality).toBe(updated.zh.setting.quality);
    }

    {
      const langer = await new Langer({ driver: driver01 }).initialize();
      const otherLanger = await langer.reset(driver01.update(updated), true);
      expect(otherLanger.speaking).toBe('en');
      expect(otherLanger.says.enter).toBe(updated.en.enter);
    }
  });

  it('driver not detected', async () => {
    await expect(
      async () => await new Langer().initialize()
    ).rejects.toThrowError('[langer] Driver not detected.');
  });

  it('initialize', async () => {
    presetSaved('zh');

    const langer = await new Langer().initialize(true, driver01);
    expect(langer.speaking).toBe('en');

    await expect(async () => langer.initialize()).rejects.toThrowError(
      '[langer] Invalid operation. This has been initialized.'
    );
  });

  it('restore()', async () => {
    presetSaved('zh');

    const langer = await new Langer().initialize(true, driver01);
    langer.restore();
    expect(langer.speaking).toBe('en');
    langer.restore();
    expect(langer.speaking).toBe('en');
  });

  it('driver error', async () => {
    {
      const driver = { onAvailableLanguages: () => '' };
      await expect(
        //@ts-expect-error
        async () => await new Langer().initialize(true, driver)
      ).rejects.toThrowError(
        '[langer] The "onAvailableLanguages" owned by the driver needs to return an array of available languages.'
      );
    }
    {
      const driver = {
        onAvailableLanguages: () => ['ru'],
        onPresetLanguage: () => 'ko',
      };
      await expect(
        //@ts-expect-error
        async () => await new Langer().initialize(true, driver)
      ).rejects.toThrowError(
        '[langer] The preset language "ko" is not on the available languages(ru).'
      );
    }
    {
      const driver = {
        onAvailableLanguages: () => ['ru', 'ko'],
        onPresetLanguage: () => 'ko',
        onSpeakingChange: () => undefined,
      };
      await expect(
        async () => await new Langer().initialize(true, driver)
      ).rejects.toThrowError(
        '[langer] The onSpeakingChange(ko) of the driver must return a value.'
      );
    }
  });

  it('speak error', async () => {
    const langer = await new Langer({ driver: driver01 }).initialize();
    await expect(
      //@ts-expect-error
      async () => await langer.speak('ja')
    ).rejects.toThrowError(
      '[langer] Can not find the "ja" language among the available languages(en,zh).'
    );
  });

  it('async recorder', async () => {
    {
      const langer = await new Langer({
        driver: driver02,
        recorder: new AsyncDriver(),
      }).initialize();
      expect(langer.speaking).toBe(presetResult);
      await langer.speak('zh');
    }

    {
      const langer = await new Langer({
        driver: driver02,
        recorder: new AsyncDriver(),
      }).initialize();
      const otherLanger = await langer.reset(driver01.update(updated));
      expect(otherLanger.speaking).toBe('zh');
      expect(otherLanger.says.setting.quality).toBe(updated.zh.setting.quality);
    }

    {
      const langer = await new Langer({
        driver: driver02,
        recorder: new AsyncDriver(),
      }).initialize();
      const otherLanger = await langer.reset(driver01.update(updated), true);
      expect(otherLanger.speaking).toBe('en');
      expect(otherLanger.says.enter).toBe(updated.en.enter);
    }
  });

  it('mobx', async () => {
    configure({
      enforceActions: 'always',
      computedRequiresReaction: true,
      reactionRequiresObservable: true,
      observableRequiresReaction: true,
      // disableErrorBoundaries: true,
    });

    const langer = new Langer();

    makeObservable(langer, {
      //@ts-expect-error
      _says: observable,
      _availableLanguages: observable,
      _currLanguage: observable,
      _initialized: observable,
      _disposed: observable,
      setSays: action,
      setAvailableLanguages: action,
      setCurrLanguage: action,
      setInitialized: action,
      dispose: action,
      availableLanguages: computed,
      initialize: action,
      restore: action,
      isAvailable: action,
      speak: action,
      reset: action,
      boost: action,
    });

    await langer.initialize(false, driver01.update(updated));

    const view1 = jest.fn(() => {
      try {
        return `btn:${langer.says.cancel},btn:${langer.says.confirm}`;
      } catch (error) {
        return error;
      }
    });
    const view2 = jest.fn(() => {
      try {
        return `btn:${langer.says.enter},btn:${langer.says.setting.language},btn:${langer.says.setting.quality},btn:${langer.says.setting.volume}`;
      } catch (error) {
        return error;
      }
    });
    const view3 = jest.fn(() => {
      try {
        return `The supported languages are ${langer.availableLanguages}. The current language is ${langer.speaking}`;
      } catch (error) {
        return error;
      }
    });

    autorun(view1);
    autorun(view2);
    autorun(view3);

    expect(view1).toBeCalledTimes(1);
    expect(view1).lastReturnedWith(
      `btn:${updated.en.cancel},btn:${updated.en.confirm}`
    );
    expect(view2).toBeCalledTimes(1);
    expect(view2).lastReturnedWith(
      `btn:${updated.en.enter},btn:${updated.en.setting.language},btn:${updated.en.setting.quality},btn:${updated.en.setting.volume}`
    );
    expect(view3).toBeCalledTimes(1);
    expect(view3).lastReturnedWith(
      `The supported languages are ${'en,zh,ja'}. The current language is ${presetResult}`
    );

    await langer.speak('zh');
    expect(view1).toBeCalledTimes(2);
    expect(view1).lastReturnedWith(
      `btn:${updated.zh.cancel},btn:${updated.zh.confirm}`
    );
    expect(view2).toBeCalledTimes(2);
    expect(view2).lastReturnedWith(
      `btn:${updated.zh.enter},btn:${updated.zh.setting.language},btn:${updated.zh.setting.quality},btn:${updated.zh.setting.volume}`
    );
    expect(view3).toBeCalledTimes(2);
    expect(view3).lastReturnedWith(
      `The supported languages are ${'en,zh,ja'}. The current language is ${'zh'}`
    );

    await langer.restore();
    expect(view1).toBeCalledTimes(3);
    expect(view1).lastReturnedWith(
      `btn:${updated.en.cancel},btn:${updated.en.confirm}`
    );
    expect(view2).toBeCalledTimes(3);
    expect(view2).lastReturnedWith(
      `btn:${updated.en.enter},btn:${updated.en.setting.language},btn:${updated.en.setting.quality},btn:${updated.en.setting.volume}`
    );
    expect(view3).toBeCalledTimes(3);
    expect(view3).lastReturnedWith(
      `The supported languages are ${'en,zh,ja'}. The current language is ${'en'}`
    );

    await langer.reset(driver01.update(fetched));
    expect(view1).toBeCalledTimes(4);
    expect(view1).lastReturnedWith(
      `btn:${fetched.en.cancel},btn:${fetched.en.confirm}`
    );
    expect(view2).toBeCalledTimes(4);
    expect(view2).lastReturnedWith(
      //@ts-expect-error
      `btn:${fetched.en.enter},btn:${fetched.en.setting.language},btn:${fetched.en.setting.quality},btn:${fetched.en.setting.volume}`
    );
    expect(view3).toBeCalledTimes(4);
    expect(view3).lastReturnedWith(
      `The supported languages are ${'en,zh'}. The current language is ${'en'}`
    );

    await langer.dispose();
    expect(view3).toBeCalledTimes(5);
    expect(view1).lastReturnedWith(
      new Error(
        '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
      )
    );
    expect(view3).toBeCalledTimes(5);
    expect(view2).lastReturnedWith(
      new Error(
        '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
      )
    );
    expect(view3).toBeCalledTimes(5);
    expect(view3).lastReturnedWith(
      new Error(
        '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
      )
    );
  });
});
