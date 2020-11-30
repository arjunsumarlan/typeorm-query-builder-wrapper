export type QueryPropType = string | number | boolean | Object;
export type QueryComparableProp = string | number | boolean | Date;

export type QueryPropsDef<T> = Partial<
  {
    [K in keyof T]: QueryPropsDef<ExtractObjectType<T[K]>> & T[K];
  }
>;

export class QueryConditionOptionsInternal {
  beginsWith?: boolean;
  endsWith?: boolean;
  quoteString?: boolean;
  insensitive?: boolean;
}

export class QueryBuilderPart<T> {
  public constructor(public partAction: any[] | any, public partParams: any[]) {}
}
