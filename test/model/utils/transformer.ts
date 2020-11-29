import { ValueTransformer } from 'typeorm';

function isNullOrUndefined<T>(
  obj: T | null | undefined,
): obj is null | undefined {
  return typeof obj === 'undefined' || obj === null;
}

// Ref: https://github.com/typeorm/typeorm/issues/873#issuecomment-502294597
export class ColumnNumericTransformer implements ValueTransformer {
  /**
   * Convert string of number to real number.
   *
   * @param {(number | null)} [data]
   * @return {*}  {(number | null)}
   * @memberof ColumnNumericTransformer
   */
  to(data?: number | null): number | null {
    if (!isNullOrUndefined(data)) {
      return data;
    }
    return null;
  }

  from(data?: string | null): number | null {
    if (!isNullOrUndefined(data)) {
      const res = parseFloat(data);
      if (isNaN(res)) {
        return null;
      } else {
        return res;
      }
    }
    return null;
  }
}
