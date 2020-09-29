export type Dictionary<T = any> = {
  [key: string]: T;
};

export type StringKeyof<T> = Exclude<keyof T, number | symbol>;
