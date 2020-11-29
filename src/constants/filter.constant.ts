export const DEFAULT_FILTER_KEYS = [
    'pagination',
    'page',
    'limit',
    'order',
    'join',
    'select',
  ];
  
  export enum LookupFilter {
    MATCHES = 'matches',
    CONTAINS = 'like',
    I_CONTAINS = 'ilike',
    IS_NULL = 'isNull',
    GT = 'moreThan',
    GTE = 'moreThanOrEqual',
    LT = 'lessThan',
    LTE = 'lessThanOrEqual',
    STARTS_WITH = 'startswith',
    I_STARTS_WITH = 'istartswith',
    ENDS_WITH = 'endswith',
    I_ENDS_WITH = 'iendswith',
    IN = 'in',
    BETWEEN = 'between',
    NOT = 'not',
    NOT_EQUAL = 'notEqual',
  }
  
  export enum LookupFilterSymbol {
    MATCHES = 'matches',
    CONTAINS = 'contains',
    I_CONTAINS = 'icontains',
    IS_NULL = 'isnull',
    GT = 'gt',
    GTE = 'gte',
    LT = 'lt',
    LTE = 'lte',
    STARTS_WITH = 'startswith',
    I_STARTS_WITH = 'istartswith',
    ENDS_WITH = 'endswith',
    I_ENDS_WITH = 'iendswith',
    IN = 'in',
    BETWEEN = 'between',
    NOT = 'not',
    NOT_EQUAL = 'notequal',
  }
  
  export const OPERATOR = {
    SQL: {
      OPERATOR_AND: 'AND',
      OPERATOR_EQUAL: '=',
      OPERATOR_GREATER: '>',
      OPERATOR_GREATER_EQUAL: '>=',
      OPERATOR_IN: 'IN',
      OPERATOR_IS: 'IS',
      OPERATOR_LESS: '<',
      OPERATOR_LESS_EQUAL: '<=',
      OPERATOR_LIKE: 'LIKE',
      OPERATOR_NOT_EQUAL: '!=',
      OPERATOR_NOT_IN: 'NOT IN',
      OPERATOR_NOT_NULL: 'NOT NULL',
      OPERATOR_NULL: 'NULL',
      OPERATOR_OR: 'OR',
    },
  };
  