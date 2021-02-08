export type ExtractObjectType<T> = T extends Array<any> ? T[0] : T;
export type Constructor<T> = { new (...props): T };
export type ValueOf<T> = T[keyof T];
