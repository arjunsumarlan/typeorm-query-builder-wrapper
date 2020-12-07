import { mapKeys, snakeCase } from 'lodash';
import { createQueryBuilder, EntityTarget, SelectQueryBuilder } from 'typeorm';
import { FilterHelper, QueryConditionService } from './utils/filter.helper';
import { isNum, isUniqueFields } from './utils/common.helper';
import { isArray, isString } from 'class-validator';
import {
  QueryBuilderPart,
  QueryComparableProp,
  QueryPropsDef,
} from './model/repository.model';
import { ReadStream } from 'typeorm/platform/PlatformTools';
import { LookupFilter } from './constants/filter.constant';

const UNDEFINED_CONST = undefined;

// QueryBuilder helpers
export class QueryBuilder<
  T,
  R = T | T[],
  P = QueryPropsDef<T>
> {
  constructor(
    private entityType: Constructor<T> | string | Function,
    private queryObject,
    entityAlias: string,
  ) {
    if (!queryObject.isDeleted) {
      queryObject.isDeleted = 'false';
    }
    if (queryObject.page && isNum(queryObject.page)) {
      this.page = Number(queryObject.page);
    }
    if (queryObject.limit && isNum(queryObject.limit)) {
      this.limit = Number(queryObject.limit);
    }

    if (entityAlias) {
      this.qb = createQueryBuilder(entityType, entityAlias);
    }
  }

  public queryBuilderParts = new Array<QueryBuilderPart<T>>();

  public havingQueryBuilderParts = new Array<QueryBuilderPart<T>>();

  private page: number = 1;

  private limit: number = 10;

  public fieldResolverMap: { [key: string]: string } = {};

  public qb: SelectQueryBuilder<any>;

  public joinHistory: { [key: string]: string } = {};

  /**
   * Transform key to snake_case and optionally with alias.
   *
   * @param {string} key Field key from query params.
   * @param {string} alias Alias, ex. t1, optional.
   * @return {*}  {string}
   */
  private transformKey(key: string, alias?: string): string {
    let tKey = snakeCase(key);
    if (alias || this.qb.alias) {
      tKey = `${alias ? alias : this.qb.alias}.${tKey}`;
    }

    return tKey;
  }
  /**
   * Transform Property Selector
   *
   * @param propertySelector Property Selector.
   */
  private transformProperty<JR extends Object>(
    propertySelector: ((obj: P) => QueryComparableProp | JR) | string,
  ) {
    if (!propertySelector) {
      throw new Error('Property Selector not provided.');
    }

    let property = '';
    if (typeof propertySelector !== 'string') {
      const mainAlias = this.qb.alias;
      const selectors = propertySelector.toString().split('.');
      property = `${selectors[selectors.length - 1]}`;
      if (selectors.length > 2) {
        const selector = selectors[selectors.length - 2];
        const history = Object.keys(this.joinHistory);
        const historyKey = history.find((h) => h.includes(selector));
        const relationAlias = this.joinHistory[historyKey];
        if (relationAlias) {
          property = `${relationAlias}.${selectors[selectors.length - 1]}`;
        }
      } else if (mainAlias) {
        property = `${mainAlias}.${selectors[selectors.length - 1]}`;
      }
    } else {
      property = propertySelector;
    }

    return property;
  }
  /**
   * Transform Property Selector and Relation
   *
   * @param propertySelector Property Selector.
   */
  private transformPropertyAndRelation<JR extends Object>(
    propertySelector: ((obj: P) => JR) | string,
  ) {
    let property = '';
    let relation = '';
    let relationEntityType = '';
    if (typeof propertySelector !== 'string') {
      const mainAlias = this.qb.alias;
      const selectors = propertySelector.toString().split('.');
      relation = selectors[selectors.length - 1];
      property = `ptc_${selectors[selectors.length - 1]}`;
      if (selectors.length > 2) {
        const selector = selectors[selectors.length - 2];
        const history = Object.keys(this.joinHistory);
        const historyKey = history.find((h) => h.includes(selector));
        const relationAlias = this.joinHistory[historyKey];
        if (relationAlias) {
          property = `${relationAlias}.${selectors[selectors.length - 1]}`;
        }
        relationEntityType = selector;
      } else if (mainAlias) {
        property = `${mainAlias}.${selectors[selectors.length - 1]}`;
      }
    } else {
      property = propertySelector;
      relation = propertySelector.split('.')[1];
    }
    if (!property || !relation) {
      throw new Error('Property Selector not defined.');
    }
    if (!relationEntityType && !this.qb.hasRelation(this.entityType, relation)) {
      const entityTypeClass = this.entityType as Constructor<T>;
      throw new Error(
        `${entityTypeClass.name} does not have relation with ${relation}`,
      );
    }

    return { property, relation };
  }
  /**
   * Transform Aggregate Property Selector
   *
   * @param propertySelector Property Selector
   * @param type AVG | SUM | MIN | MAX
   */
  private transformAggregateProp(
    propertySelector: ((obj: P) => number) | string,
    type,
  ) {
    if (!propertySelector) {
      throw new Error('Property Selector not provided.');
    }

    let transformedProp = '';
    if (typeof propertySelector !== 'string') {
      const mainAlias = this.qb.alias;
      const selectors = propertySelector.toString().split('.');
      if (selectors.length > 2) {
        const history = Object.keys(this.joinHistory);
        const historyKey = history.find((h) => h.includes(selectors[selectors.length - 2]));
        const relationAlias = this.joinHistory[historyKey];
        transformedProp = `${relationAlias}.${selectors[selectors.length - 1]}`;
      } else {
        transformedProp = `${mainAlias}.${selectors[selectors.length - 1]}`;
      }
    } else {
      transformedProp = propertySelector;
    }

    const prop =
      transformedProp.split('.').length > 1
        ? transformedProp.split('.')[1]
        : transformedProp;
    const entityMetadata = this.qb.connection.getMetadata(this.entityType);
    const property = entityMetadata.findColumnWithPropertyName(prop);
    if (property && property.type != 'numeric') {
      throw new Error(
        `Type of ${property.propertyName} field is ${property.type} not assignable to type number in ${type} method. Please provide only numeric type field.`,
      );
    }

    return {
      prop,
      transformedProp,
    };
  }
  /**
   * Get Query.
   */
  public getQuery(): string {
    this.compileQueryBuilderParts();
    return this.qb.getQuery();
  }
  /**
   * Select one or multiple fields with each Alias field
   *
   * @param args Array of Array of field with alias, e.g: ['t1.id', 'id'], ...
   */
  public selectRaw(...args: Array<string | string[]>) {
    const expressionArgs = args.filter(
      arg => isString(arg) || (isArray(arg) && arg.length <= 2),
    );
    if (!expressionArgs.length) {
      throw new Error(`String expression is required for the selectRaw method`);
    }

    for (const arg of args) {
      if (args.indexOf(arg) === 0) {
        if (arg[1]) {
          this.qb.select(arg[0], arg[1]);
        } else {
          this.qb.select(arg[0]);
        }
      } else {
        if (arg[1]) {
          this.qb.addSelect(arg[0], arg[1]);
        } else {
          this.qb.addSelect(arg[0]);
        }
      }
    }

    return this;
  }
  /**
   * SELECT Sub Query
   *
   * @param entity Entity Target used in Sub Query.
   * @param selection Selection Sub Query.
   * @param selectionAlias Alias for Sub Query.
   */
  public selectSubQuery<JR extends Object>(
    entity: Constructor<P> | Function,
    selectionAlias: string,
    selection: (qb: QueryBuilder<JR, P>) => QueryBuilder<any>,
  ) {
    const initQueryBuilder = new QueryBuilder<JR, P>(
      entity,
      {},
      selectionAlias,
    );
    const queryBuilder = selection(initQueryBuilder);
    this.qb.addSelect(`(${queryBuilder.qb.getQuery()})`, selectionAlias);

    return this;
  }
  /**
   * FROM query
   *
   * @param entity Entity Target
   * @param aliasName Alias
   * @param subQuery Query Builder
   */
  public from<JR extends Object>(
    entity: Constructor<P> | Function,
    aliasName: string,
    subQuery?: (qb: QueryBuilder<JR, P>) => QueryBuilder<any>,
  ) {
    const initQueryBuilder = new QueryBuilder<JR, P>(
      entity,
      {},
      aliasName,
    );
    if (subQuery) {
      const queryBuilder = subQuery(initQueryBuilder);
      this.qb.from(`(${queryBuilder.getQuery()})`, aliasName);
    } else {
      this.qb.from(entity, aliasName);
    }

    return this;
  }
  /**
   * Create Sub Query.
   */
  private createSubQuery(isMain: boolean = false) {
    const queryBuilder: SelectQueryBuilder<T> = this.qb
      .createQueryBuilder()
      .subQuery()
    
    if (isMain) {
      queryBuilder.from(this.entityType, this.qb.alias);
    }

    const query = new QueryBuilder<T, T>(
      this.entityType,
      this.queryObject,
      this.qb.alias,
    );

    query.qb = queryBuilder;

    return query;
  }
  /**
   * Sets whether the selection is DISTINCT.
   * Remember set distinct after joining your relation.
   *
   * @param {boolean} distinct Is Distinct argument.
   */
  public setDistinct(distinct?: boolean) {
    this.qb.distinct(distinct ? distinct : true);
    return this;
  }
  /**
   * Sets the distinct on clause for Postgres.
   * Remember set distinct after joining your relation.
   *
   * @param args Array of field to set distinct on them.
   */
  public setDistinctOn(
    ...args: Array<((obj: P) => any) | string>
  ) {
    if (!args.length) {
      throw new Error(
        `Property selector is required in ${this.setDistinctOn.name}`,
      );
    }

    if (!isUniqueFields(args)) {
      throw new Error(
        `Fields have to be unique in ${this.setDistinctOn.name}`,
      );
    }

    const props = [];
    for (const propertySelector of args) {
      const property = this.transformProperty(
        propertySelector,
      );
      props.push(property);
    }

    this.qb.distinctOn(props);

    return this;
  }
  /**
   * Group By Query.
   *
   * @param args Array of field to set distinct on them.
   */
  public groupBy(
    ...args: Array<((obj: P) => any) | string>
  ) {
    if (!args.length) {
      throw new Error(
        `Property selector is required in ${this.groupBy.name}`,
      );
    }

    if (!isUniqueFields(args)) {
      throw new Error(
        `Fields have to be unique in ${this.groupBy.name}`,
      );
    }

    for (const propertySelector of args) {
      const property = this.transformProperty(
        propertySelector,
      );
      if (args.indexOf(propertySelector) === 0) {
        this.qb.groupBy(property);
      } else {
        this.qb.addGroupBy(property);
      }
    }

    return this;
  }
  /**
   * Apply Where Condition
   *
   * @param whereQueryBuilderFn Condition Type.
   * @param condition Condition value from exec method (optional).
   */
  private applyWhere(whereQueryBuilderFn: 'AND' | 'OR', condition: any) {
    if (whereQueryBuilderFn === 'AND') {
      this.qb.andWhere(condition);
    } else {
      this.qb.orWhere(condition);
    }

    return this;
  }
  /**
   * Compile Isolated Where Query.
   *
   * @param conditions Isolated Conditions.
   * @param conditionFn Condition Type : AND | OR.
   */
  private isolatedConditions(
    conditions: (query: QueryBuilder<T, P>) => QueryBuilder<T, P>,
    conditionFn: '' | 'AND' | 'OR',
  ) {
    const query = this.createSubQuery(true);
    query.joinHistory = this.joinHistory;
    const queryBuilder = conditions(query);
    const whereConditionParts = queryBuilder.queryBuilderParts;

    let condition = '';
    if (whereConditionParts.length) {
      for (const queryPart of whereConditionParts) {
        if (queryPart && queryPart.partAction[0]) {
          const whereQueryBuilderFn = queryPart.partAction[0];
          const whereCondition = queryPart.partParams[0];
          if (whereConditionParts.indexOf(queryPart) === 0) {
            condition += `${whereCondition}`;
          } else {
            condition += ` ${whereQueryBuilderFn} ${whereCondition}`;
          }
        }
      }
    }

    this.queryBuilderParts.push(
      new QueryBuilderPart([conditionFn], [
        `(${condition})`,
      ]),
    );

    return this;
  }
  /**
   * AND Where
   *
   * @param propertySelector Property Selector.
   * @param whereFn Where Base to define its operator, condition type, etc into Query Builder Parts.
   */
  public andWhere(
    propertySelector: ((obj: P) => QueryComparableProp) | string,
    whereFn: (queryCondition: QueryConditionService<T>, subQuery?: QueryBuilder<T, P>) => void,
  ) {
    whereFn(
      new QueryConditionService<T>(
        this.transformProperty(propertySelector),
        this.qb,
        this.queryBuilderParts,
        'AND',
      ),
      this.createSubQuery(),
    );

    return this;
  }
  /**
   * AND Isolated Where.
   *
   * @param and Isolated condition.
   */
  public andWhereIsolated(and: (query: QueryBuilder<T, P>) => QueryBuilder<T, P>) {
    return this.isolatedConditions(and, 'AND');
  }
  /**
   * OR Where
   *
   * @param propertySelector Property Selector.
   * @param whereFn Where Base to define its operator, condition type, etc into Query Builder Parts.
   */
  public orWhere(
    propertySelector: ((obj: P) => QueryComparableProp) | string,
    whereFn: (queryCondition: QueryConditionService<T>, subQuery?: QueryBuilder<T, P>) => void,
  ) {
    whereFn(
      new QueryConditionService<T>(
        this.transformProperty(propertySelector),
        this.qb,
        this.queryBuilderParts,
        'OR',
      ),
      this.createSubQuery(),
    );

    return this;
  }
  /**
   * OR Isolated Where.
   *
   * @param or Isolated condition.
   */
  public orWhereIsolated(or: (query: QueryBuilder<T, P>) => QueryBuilder<T, P>) {
    return this.isolatedConditions(or, 'OR');
  }
  /**
   * Apply Having
   *
   * @param havingQueryBuilderFn Condition Type.
   * @param params Condition value from exec method (optional).
   */
  private applyHaving(havingQueryBuilderFn: 'AND' | 'OR', condition: any) {
    if (havingQueryBuilderFn === 'AND') {
      this.qb.andHaving(condition);
    } else {
      this.qb.orHaving(condition);
    }

    return this;
  }
  /**
   * AND Having
   *
   * @param propertySelector Property Selector.
   * @param havingFn Where Base to define its operator, condition type, etc into Having Query Builder Parts.
   */
  public andHaving(
    propertySelector: ((obj: P) => QueryComparableProp) | string,
    havingFn: (queryCondition: QueryConditionService<T>) => void,
  ) {
    havingFn(
      new QueryConditionService<T>(
        this.transformProperty(propertySelector),
        this.qb,
        this.havingQueryBuilderParts,
        'AND',
      ),
    );

    return this;
  }
  /**
   * OR Having
   *
   * @param propertySelector Property Selector.
   * @param havingFn Where Base to define its operator, condition type, etc into Having Query Builder Parts.
   */
  public orHaving(
    propertySelector: ((obj: P) => QueryComparableProp) | string,
    havingFn: (queryCondition: QueryConditionService<T>) => void,
  ) {
    havingFn(
      new QueryConditionService<T>(
        this.transformProperty(propertySelector),
        this.qb,
        this.havingQueryBuilderParts,
        'OR',
      ),
    );

    return this;
  }
  /**
   * Apply Join
   *
   * @param propertySelector Property Selector.
   * @param joinAlias Alias for relation table.
   * @param joinQueryBuilderFn Type of Join.
   * @param joinCondition Condition when join.
   */
  private applyJoin<JR extends Object>(
    propertySelector: ((obj: P) => JR) | string,
    joinAlias: string,
    joinQueryBuilderFn: 'INNER' | 'LEFT',
    joinCondition?: (qb: QueryBuilder<JR, P>) => QueryBuilder<JR, P>,
  ) {
    const { property, relation } = this.transformPropertyAndRelation(
      propertySelector,
    );

    this.joinHistory[property] = joinAlias;
    if (joinCondition && typeof joinCondition === 'function') {
      const entityMetadata = this.qb.connection.getMetadata(this.entityType);
      const relationMetadata = entityMetadata.findRelationWithPropertyPath(
        relation,
      );
      let etyMetadata = relationMetadata && relationMetadata.inverseEntityMetadata;
      if (!relationMetadata) {
        for (const etyMd of this.qb.connection.entityMetadatas) {
          if (etyMd.name.toLowerCase() === relation) {
            etyMetadata = etyMd;
          }
        }
      }
      const RelationEntityType = etyMetadata.target;
      const queryBuilder = new QueryBuilder<JR, P>(
        RelationEntityType,
        {},
        joinAlias,
      );
      queryBuilder.joinHistory = this.joinHistory;
      const qb = joinCondition(queryBuilder);
      let condition = '';
      if (qb.queryBuilderParts) {
        for (const part of qb.queryBuilderParts) {
          const condWhere = part.partParams[0];
          const whereQueryBuilderFn = part.partAction[0];
          if (qb.queryBuilderParts.indexOf(part) === 0) {
            condition += condWhere;
          } else {
            condition += ` ${whereQueryBuilderFn} ${condWhere}`;
          }
        }
      }
      if (condition) {
        if (joinQueryBuilderFn === 'INNER') {
          this.qb.innerJoin(property, joinAlias, condition);
        } else {
          this.qb.leftJoin(property, joinAlias, condition);
        }
      }
    } else {
      if (joinQueryBuilderFn === 'INNER') {
        this.qb.innerJoin(property, joinAlias);
      } else {
        this.qb.leftJoin(property, joinAlias);
      }
    }

    return this;
  }
  /**
   * Inner Join
   *
   * @param propertySelector Property Selector.
   * @param joinAlias Alias for relation table.
   * @param joinCondition Condition when join.
   */
  public innerJoin<JR extends Object>(
    propertySelector: ((obj: P) => JR) | string,
    joinAlias: string,
    joinCondition?: (qb: QueryBuilder<JR, P>) => QueryBuilder<JR, P>,
  ) {
    return this.applyJoin(propertySelector, joinAlias, 'INNER', joinCondition);
  }
  /**
   * Left Join
   *
   * @param propertySelector Property Selector.
   * @param joinAlias Alias for relation table.
   * @param joinCondition Condition when join.
   */
  public leftJoin<JR extends Object>(
    propertySelector: ((obj: P) => JR) | string,
    joinAlias: string,
    joinCondition?: (qb: QueryBuilder<JR, P>) => QueryBuilder<JR, P>,
  ) {
    return this.applyJoin(propertySelector, joinAlias, 'LEFT', joinCondition);
  }
  /**
   * Apply Join
   *
   * @param propertySelector Property Selector.
   * @param joinAlias Alias for relation table.
   * @param joinQueryBuilderFn Type of Join.
   * @param joinCondition Condition when join.
   */
  private applyJoinSubQuery(
    subQuery: SelectQueryBuilder<T>,
    joinAlias: string,
    joinQueryBuilderFn: 'INNER' | 'LEFT',
    joinCondition?: (qb: QueryBuilder<T, P>) => QueryBuilder<T, P>,
  ) {
    if (joinCondition && typeof joinCondition === 'function') {
      const query = this.createSubQuery(true);
      const qb = joinCondition(query);
      let condition = '';
      if (qb.queryBuilderParts) {
        for (const part of qb.queryBuilderParts) {
          const condWhere = part.partParams[0];
          const whereQueryBuilderFn = part.partAction[0];
          if (qb.queryBuilderParts.indexOf(part) === 0) {
            condition += condWhere;
          } else {
            condition += ` ${whereQueryBuilderFn} ${condWhere}`;
          }
        }
      }
      if (condition) {
        if (joinQueryBuilderFn === 'INNER') {
          this.qb.innerJoin(sb => subQuery, joinAlias, condition);
        } else {
          this.qb.leftJoin(sb => subQuery, joinAlias, condition);
        }
      }
    } else {
      if (joinQueryBuilderFn === 'INNER') {
        this.qb.innerJoin(sb => subQuery, joinAlias);
      } else {
        this.qb.leftJoin(sb => subQuery, joinAlias);
      }
    }

    return this;
  }
  /**
   * Inner Join Sub Query
   *
   * @param subQuery Property Selector.
   * @param joinAlias Alias for relation table.
   * @param joinCondition Condition when join.
   */
  public innerJoinSubQuery<JR extends Object>(
    subQuery: ((qb: QueryBuilder<T, P>) => QueryBuilder<T, P>),
    joinAlias: string,
    joinCondition?: (qb: QueryBuilder<JR, P>) => QueryBuilder<JR, P>,
  ) {
    return this.applyJoinSubQuery(subQuery(this.createSubQuery()).qb, joinAlias, 'INNER', joinCondition);
  }
  /**
   * Left Join Sub Query
   *
   * @param subQuery Property Selector.
   * @param joinAlias Alias for relation table.
   * @param joinCondition Condition when join.
   */
  public leftJoinSubQuery<JR extends Object>(
    subQuery: ((qb: QueryBuilder<T, P>) => QueryBuilder<T, P>),
    joinAlias: string,
    joinCondition?: (qb: QueryBuilder<JR, P>) => QueryBuilder<JR, P>,
  ) {
    return this.applyJoinSubQuery(subQuery(this.createSubQuery()).qb, joinAlias, 'LEFT', joinCondition);
  }
  /**
   * Apply Query Builder with Filter and Pagination.
   *
   * @param {any} query Query params.
   * @param {string} alias Alias, ex. t1, optional.
   * @return {*} {QueryBuilder}
   */
  public applyFilterPagination(alias?: string) {
    // pagination
    this.applyPagination(alias);
    // filter
    this.applyFilterQueries();

    return this;
  }
  /**
   * Apply Query Builder with Pagination.
   *
   * @param {any} query Query params.
   * @param {string} alias Alias, ex. t1, optional.
   * @return {*} {QueryBuilder}
   */
  private applyPagination(alias?: string) {
    // sort
    this.applyOrder(alias);
    // paginate
    this.applyPaginate();

    return this;
  }
  /**
   * Paginate method.
   *
   * @param {any} query Query params.
   * @return {*} {QueryBuilder}
   */
  private applyPaginate() {
    let { page } = this;
    if (page > 0) {
      page -= 1;
    }

    this.qb.offset(page * this.limit);
    this.qb.limit(this.limit);

    return this;
  }
  /**
   * Get Order Criteria.
   *
   * @param field Order field.
   */
  private getOrderCriteria(field) {
    if (field.startsWith('^')) {
      return 'ASC';
    } else if (field.startsWith('-')) {
      return 'DESC';
    } else {
      throw new Error(`No order set for <${field}>. Prefix with one of these: [^, -]`);
    }
}
  /**
   * Apply Query Builder with Order.
   *
   * @param {string} alias Alias, ex. t1, optional.
   * @return {*} {QueryBuilder}
   */
  private applyOrder(alias?: string) {
    if (!this.queryObject['order']) return this;

    const order = {};
    const orderFields = this.queryObject['order'].split(',');
    for (const field of orderFields) {
        const orderCriteria = this.getOrderCriteria(field);
        order[field.substr(1, field.length)] = orderCriteria;
    }
    if (order) {
      const orderObject = mapKeys(order, (value, key) => {
        return this.transformKey(key, alias);
      });
      const orders = Object.keys(orderObject);
      for (const orderKey of orders) {
        if (orders.indexOf(orderKey) === 0) {
          this.qb.orderBy(orderKey, orderObject[orderKey]);
        } else {
          this.qb.addOrderBy(orderKey, orderObject[orderKey]);
        }
      }
    }

    return this;
  }
  /**
   * Set Locking.
   *
   * @param type Type of Locking.
   */
  public setLocking(
    type: 
      "pessimistic_read" | "pessimistic_write"
      | "dirty_read" | "pessimistic_partial_write"
      | "pessimistic_write_or_fail" | "for_no_key_update"
      | "optimistic",
    version?: number,
  ) {
    if (type !== 'optimistic') {
      this.qb.setLock(type);
    } else {
      if (!version) {
        throw new Error("Version is not provided for optimistic locking");
      }
      this.qb.setLock(type, version);
    }

    return this;
  }
  /**
   * Apply Query Builder with Filter Query.
   *
   * @param {any} query Query params.
   * @return {*} {QueryBuilder}
   */
  public applyFilterQueries() {
    const { fieldResolverMap, queryObject } = this;
    if (fieldResolverMap) {
      mapKeys(fieldResolverMap, (field, key) => {
        if (queryObject[key]) {
          const operator = FilterHelper.getOperator(key);
          const value = queryObject[key];
          switch (operator) {
            case LookupFilter.CONTAINS:
              this.qb.andWhere(`${field} LIKE '%${value}%'`);
              break;
            case LookupFilter.I_CONTAINS:
              this.qb.andWhere(`${field} ILIKE '%${value}%'`);
              break;
            case LookupFilter.STARTS_WITH:
              this.qb.andWhere(`${field} LIKE '${value}%'`);
              break;
            case LookupFilter.I_STARTS_WITH:
              this.qb.andWhere(`${field} ILIKE '${value}%'`);
              break;
            case LookupFilter.ENDS_WITH:
              this.qb.andWhere(`${field} LIKE '%${value}'`);
              break;
            case LookupFilter.I_ENDS_WITH:
              this.qb.andWhere(`${field} ILIKE '%${value}'`);
              break;
            case LookupFilter.IS_NULL:
              this.qb.andWhere(`${field} IS NULL`);
              break;
            case LookupFilter.LT:
              this.qb.andWhere(`${field} < '${value}'`);
              break;
            case LookupFilter.LTE:
              this.qb.andWhere(`${field} <= '${value}'`);
              break;
            case LookupFilter.GT:
              this.qb.andWhere(`${field} > '${value}'`);
              break;
            case LookupFilter.GTE:
              this.qb.andWhere(`${field} >= '${value}'`);
              break;
            case LookupFilter.IN:
              this.qb.andWhere(`${field} IN ('${value}')`);
              break;
            case LookupFilter.BETWEEN:
              this.qb.andWhere(`${field} BETWEEN '${value[0]}' AND '${value[1]}'`);
              break;
            case LookupFilter.NOT_EQUAL:
              this.qb.andWhere(`${field} <> '${value}'`);
              break;
            default:
              this.qb.andWhere(`${field} = '${value}'`);
              break;
          }
        }
      });
    }

    return this;
  }
  /**
   * Compile Query Builder Parts
   *
   * @private
   * @memberof QueryBuilder
   */
  private compileQueryBuilderParts() {
    // Apply Where Condition
    for (const part of this.queryBuilderParts) {
      if (part && part.partAction[0]) {
        this.applyWhere(part.partAction[0], part.partParams[0]);
      }
    }

    // Apply Having Condition
    for (const part of this.havingQueryBuilderParts) {
      if (part && part.partAction[0]) {
        this.applyHaving(part.partAction[0], part.partParams[0]);
      }
    }
  }
  /**
   * Get Raw SQL from Compiled QueryBuilder.
   *
   * @returns string
   * @memberof QueryBuilder
   */
  public getSql() {
    this.compileQueryBuilderParts();
    return this.qb.getSql();
  }
  /**
   * Gets all raw results.
   *
   * @return {*} {Promise<any[]>}
   */
  public exec(): Promise<any[]> {
    this.compileQueryBuilderParts();
    return this.qb.getRawMany();
  }
  /**
   * Executes built SQL query and returns raw data stream.
   *
   * @param output Writeable data for output.
   * @param transformer Transform data before write to the output.
   */
  public async stream(output: any, transformer: (data: any) => string): Promise<ReadStream> {
    this.compileQueryBuilderParts();
    const stream = await this.qb.stream();
    stream
      .pipe(QueryBuilder.parser(transformer))
      .pipe(output);

    return stream;
  }
  /**
   * Parser for transform data
   *
   * @param transformer Transformer.
   */
  private static parser(transformer) {
    const through = require('through');
    const stream = through(
      function(data) {
        try {
          const json = transformer(data);
          stream.queue(json);
        } catch (err) {
          return stream.emit('error', err);
        }
      },
      function() {
        // reach the end.
        stream.queue(null);
      },
    );

    return stream;
  }
  /**
   * Apply Aggregate Method - SUM, MAX, MIN, and AVG.
   *
   * @return {*} {Promise<number>}
   */
  private async applyOneAggregate(
    propertySelector: ((obj: P) => number) | string,
    type: 'SUM' | 'AVG' | 'MAX' | 'MIN',
  ): Promise<number> {
    const { transformedProp } = this.transformAggregateProp(
      propertySelector,
      type,
    );
    const { result } = await this.qb
      .clone()
      .select(`${type}(${transformedProp})`, 'result')
      .groupBy()
      .orderBy()
      .limit(UNDEFINED_CONST)
      .offset(UNDEFINED_CONST)
      .getRawOne();

    return result;
  }
  /**
   * Apply Aggregate Method for many fields - SUM, MAX, MIN, and AVG.
   *
   * @return {*} {Promise<number>}
   */
  private async applyManyAggregate(
    args: any[],
    type: 'SUM' | 'AVG' | 'MAX' | 'MIN',
    label: 'Sum' | 'Avg' | 'Max' | 'Min',
  ): Promise<any> {
    const cloneQB = this.qb.clone();

    for (const propertySelector of args) {
      const { transformedProp, prop } = this.transformAggregateProp(
        propertySelector,
        type,
      );
      if (args.indexOf(propertySelector) === 0) {
        cloneQB.select(`${type}(${transformedProp})`, `${prop}${label}`);
      } else {
        cloneQB.addSelect(`${type}(${transformedProp})`, `${prop}${label}`);
      }
    }

    const result = {};
    const data = await cloneQB
      .groupBy()
      .orderBy()
      .limit(UNDEFINED_CONST)
      .offset(UNDEFINED_CONST)
      .getRawOne();

    if (data) {
      for (const key of Object.keys(data)) {
        result[key] = Number(data[key]);
      }
    }

    return result;
  }
  /**
   * Gets count - number of entities selected by sql generated by this query builder.
   * Count excludes all limitations.
   *
   * @return {*} {Promise<number>}
   */
  public getCount(): Promise<number> {
    return this.qb.getCount();
  }
  /**
   * Gets sum of field.
   *
   * @return {*} {Promise<number>}
   */
  public async getSum(
    propertySelector: ((obj: P) => number) | string,
  ): Promise<number> {
    return this.applyOneAggregate(propertySelector, 'SUM');
  }
  /**
   * Gets sum of many field.
   *
   * @return {*} {Promise<number[]>}
   */
  public async getManySum(
    ...args: Array<((obj: P) => number) | string>
  ): Promise<any> {
    if (!args.length) {
      throw new Error(
        `Property selector is required in ${this.getManySum.name}`,
      );
    }

    if (!isUniqueFields(args)) {
      throw new Error(
        `Fields have to be unique in ${this.getManySum.name}`,
      );
    }

    return this.applyManyAggregate(args, 'SUM', 'Sum');
  }
  /**
   * Gets average of field.
   *
   * @return {*} {Promise<number>}
   */
  public async getAverage(
    propertySelector: ((obj: P) => number) | string,
  ): Promise<number> {
    return this.applyOneAggregate(propertySelector, 'AVG');
  }
  /**
   * Gets average of many field.
   *
   * @return {*} {Promise<number[]>}
   */
  public async getManyAverage(
    ...args: Array<((obj: P) => number) | string>
  ): Promise<any> {
    if (!args.length) {
      throw new Error(
        `Property selector is required in ${this.getManyAverage.name}`,
      );
    }

    if (!isUniqueFields(args)) {
      throw new Error(
        `Fields have to be unique in ${this.getManyAverage.name}`,
      );
    }

    return this.applyManyAggregate(args, 'AVG', 'Avg');
  }
  /**
   * Gets max of field.
   *
   * @return {*} {Promise<number>}
   */
  public async getMax(
    propertySelector: ((obj: P) => number) | string,
  ): Promise<number> {
    return this.applyOneAggregate(propertySelector, 'MAX');
  }
  /**
   * Gets max of many field.
   *
   * @return {*} {Promise<number[]>}
   */
  public async getManyMax(
    ...args: Array<((obj: P) => number) | string>
  ): Promise<any> {
    if (!args.length) {
      throw new Error(
        `Property selector is required in ${this.getManyMax.name}`,
      );
    }

    if (!isUniqueFields(args)) {
      throw new Error(
        `Fields have to be unique in ${this.getManyMax.name}`,
      );
    }

    return this.applyManyAggregate(args, 'MAX', 'Max');
  }
  /**
   * Gets min of field.
   *
   * @return {*} {Promise<number>}
   */
  public async getMin(
    propertySelector: ((obj: P) => number) | string,
  ): Promise<number> {
    return this.applyOneAggregate(propertySelector, 'MIN');
  }
  /**
   * Gets min of many field.
   *
   * @return {*} {Promise<number[]>}
   */
  public async getManyMin(
    ...args: Array<((obj: P) => number) | string>
  ): Promise<any> {
    if (!args.length) {
      throw new Error(
        `Property selector is required in ${this.getManyMin.name}`,
      );
    }

    if (!isUniqueFields(args)) {
      throw new Error(
        `Fields have to be unique in ${this.getManyMin.name}`,
      );
    }

    return this.applyManyAggregate(args, 'MIN', 'Min');
  }
}
