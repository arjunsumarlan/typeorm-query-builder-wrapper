type ExtractObjectType<T> = T extends Array<any> ? T[0] : T;
type Constructor<T> = { new (...props): T };
type ValueOf<T> = T[keyof T];
