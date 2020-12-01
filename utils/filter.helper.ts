import { SelectQueryBuilder } from 'typeorm';
import { castArray } from 'lodash';
import {
  QueryConditionOptionsInternal,
  QueryBuilderPart,
  QueryComparableProp,
} from '../model/repository.model';
import {
  LookupFilter,
  LookupFilterSymbol,
  OPERATOR,
} from '../constants/filter.constant';
import { isArray } from 'class-validator';

export class FilterHelper {
  public static getOperator(key: string) {
    const opt = key.split('__')[1];

    switch (opt) {
      case LookupFilterSymbol.CONTAINS:
        return LookupFilter.CONTAINS;
      case LookupFilterSymbol.I_CONTAINS:
        return LookupFilter.I_CONTAINS;
      case LookupFilterSymbol.STARTS_WITH:
        return LookupFilter.STARTS_WITH;
      case LookupFilterSymbol.I_STARTS_WITH:
        return LookupFilter.I_STARTS_WITH;
      case LookupFilterSymbol.ENDS_WITH:
        return LookupFilter.ENDS_WITH;
      case LookupFilterSymbol.I_ENDS_WITH:
        return LookupFilter.I_ENDS_WITH;
      case LookupFilterSymbol.IS_NULL:
        return LookupFilter.IS_NULL;
      case LookupFilterSymbol.LT:
        return LookupFilter.LT;
      case LookupFilterSymbol.LTE:
        return LookupFilter.LTE;
      case LookupFilterSymbol.GT:
        return LookupFilter.GT;
      case LookupFilterSymbol.GTE:
        return LookupFilter.GTE;
      case LookupFilterSymbol.IN:
        return LookupFilter.IN;
      case LookupFilterSymbol.BETWEEN:
        return LookupFilter.BETWEEN;
      case LookupFilterSymbol.NOT_EQUAL:
        return LookupFilter.NOT_EQUAL;
    }

    return LookupFilter.MATCHES;
  }
}

export class QueryConditionService<T> {
  constructor(
    public prop: QueryComparableProp,
    public queryBuilder: SelectQueryBuilder<T>,
    public queryBuilderParts: Array<QueryBuilderPart<T>>,
    private whereQueryBuilderFn?: '' | 'AND' | 'OR',
  ) {}

  public beginsWith(value: string, insensitive: boolean = false) {
    return this.completeWhere(OPERATOR.SQL.OPERATOR_LIKE, value, {
      beginsWith: true,
    });
  }

  public contains(value: string, insensitive: boolean = false) {
    return this.completeWhere(OPERATOR.SQL.OPERATOR_LIKE, value, {
      beginsWith: true,
      endsWith: true,
      insensitive,
    });
  }

  public endsWith(value: string, insensitive: boolean = false) {
    return this.completeWhere(OPERATOR.SQL.OPERATOR_LIKE, value, {
      endsWith: true,
      insensitive,
    });
  }

  public equalsWithField(value: string) {
    const selectors = value.split('.');
    if (selectors.length > 2) {
      throw new Error('Argument is not a field in equalsWithField method.');
    }

    return this.completeWhere(OPERATOR.SQL.OPERATOR_EQUAL, value, { quoteString: false });
  }

  public equals(value: string | number | boolean | Date) {
    return this.completeWhere(OPERATOR.SQL.OPERATOR_EQUAL, value, null);
  }

  public greaterThan(value: number | Date) {
    return this.completeWhere(OPERATOR.SQL.OPERATOR_GREATER, value);
  }

  public greaterThanOrEqual(value: number | Date) {
    return this.completeWhere(
      OPERATOR.SQL.OPERATOR_GREATER_EQUAL,
      value,
    );
  }

  public in(include: string[] | number[] | string) {
    if (typeof include === 'string') {
      return this.completeWhere(
        OPERATOR.SQL.OPERATOR_IN,
        include,
        { quoteString: false },
      );
    }

    if (isArray(include) && include.length === 0) {
      throw new Error('Argument of IN have to be non-empty array.')
    }

    // If comparing strings, must escape them as strings in the query.
    this.escapeStringArray(castArray(include as string[]));

    return this.completeWhere(
      OPERATOR.SQL.OPERATOR_IN,
      `(${include.join(', ')})`,
      { quoteString: false },
    );
  }

  public isFalse() {
    return this.equals(false);
  }

  public isNotNull() {
    return this.completeWhere(
      OPERATOR.SQL.OPERATOR_IS,
      OPERATOR.SQL.OPERATOR_NOT_NULL,
      { quoteString: false },
    );
  }

  public isNull() {
    return this.completeWhere(
      OPERATOR.SQL.OPERATOR_IS,
      OPERATOR.SQL.OPERATOR_NULL,
      { quoteString: false },
    );
  }

  public isTrue() {
    this.equals(true);

    return this;
  }

  public lessThan(value: number | Date) {
    return this.completeWhere(OPERATOR.SQL.OPERATOR_LESS, value);
  }

  public lessThanOrEqual(value: number | Date) {
    return this.completeWhere(OPERATOR.SQL.OPERATOR_LESS_EQUAL, value);
  }

  public notEquals(value: string | number | boolean | Date) {
    return this.completeWhere(
      OPERATOR.SQL.OPERATOR_NOT_EQUAL,
      value,
      null,
    );
  }

  public notIn(exclude: string[] | number[] | string) {
    if (typeof exclude === 'string') {
      return this.completeWhere(
        OPERATOR.SQL.OPERATOR_NOT_IN,
        exclude,
        { quoteString: false },
      );
    }

    if (isArray(exclude) && exclude.length === 0) {
      throw new Error('Argument of NOT IN have to be non-empty array.')
    }

    // If comparing strings, must escape them as strings in the query.
    this.escapeStringArray(castArray(exclude as string[]));

    return this.completeWhere(
      OPERATOR.SQL.OPERATOR_NOT_IN,
      `(${exclude.join(', ')})`,
      { quoteString: false },
    );
  }

  private completeWhere(
    operator: string,
    value: string | number | boolean | Date,
    optionsInternal?: QueryConditionOptionsInternal,
  ) {
    let beginsWith: boolean = false;
    let endsWith: boolean = false;
    let quoteString: boolean = true;
    let insensitive: boolean = false;

    if (optionsInternal) {
      if (typeof optionsInternal.beginsWith === 'boolean') {
        beginsWith = optionsInternal.beginsWith;
      }

      if (typeof optionsInternal.endsWith === 'boolean') {
        endsWith = optionsInternal.endsWith;
      }

      if (typeof optionsInternal.quoteString === 'boolean') {
        quoteString = optionsInternal.quoteString;
      }

      if (typeof optionsInternal.insensitive === 'boolean') {
        insensitive = optionsInternal.insensitive;
      }
    }

    let parsedValue = value;

    if (typeof value === 'string' && quoteString) {
      parsedValue = `${value.replace(/'/g, '\'\'')}`;
    } else if (value instanceof Date) {
      parsedValue = `${value.toISOString()}`;
    }

    if (endsWith) {
      parsedValue = `%${parsedValue}`;
    }

    if (beginsWith) {
      parsedValue = `${parsedValue}%`;
    }

    if (quoteString) {
      parsedValue = `'${parsedValue}'`;
    }

    let prop = this.prop;
    if (insensitive) {
      prop = `LOWER(${this.prop})`;
      parsedValue = `${parsedValue}`.toLowerCase();
    }

    const whereExpression = `${prop} ${operator} ${parsedValue}`;

    this.queryBuilderParts.push(
      new QueryBuilderPart([this.whereQueryBuilderFn], [whereExpression]),
    );

    return this;
  }

  private escapeStringArray(array: string[]): void {
    array.forEach((value, i) => {
      if (typeof value === 'string') {
        array[i] = `'${value}'`;
      }
    });
  }
}
