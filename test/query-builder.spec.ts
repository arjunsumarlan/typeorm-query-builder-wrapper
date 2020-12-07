import { QueryBuilder } from '..';
import { QueryBuilderPart } from '../model/repository.model';
import { isNum, isUniqueFields } from '../utils/common.helper';
import { FilterHelper, QueryConditionService } from '../utils/filter.helper';
import { User } from './model/user.entity';
import { Branch } from './model/branch.entity';
import { QueryList } from './query-list';
import { Photos } from './model/photos.entity';
import { isArray } from 'class-validator';

function getMockQueryCondition(prop) {
  return new QueryConditionService(
    prop,
    null,
    new Array<QueryBuilderPart<any>>(),
  );
}

describe('Test Helper', () => {
  it('should get a false, is an array unique', () => {
    const arr = [0, 1, 1, 2];
    expect(isUniqueFields(arr)).toBeFalsy();
  });
  it('should get a true, is an array unique', () => {
    const arr = [0, 1, 2, 3];
    expect(isUniqueFields(arr)).toBeTruthy();
  });
  it('should get an operator "like" with "__contains" end', () => {
    const operator = FilterHelper.getOperator("name__contains");
    expect(operator).toEqual('like');
  });
  it('should get an operator "isNull" with "__isnull" end', () => {
    const operator = FilterHelper.getOperator("name__isnull");
    expect(operator).toEqual('isNull');
  });
  it('should get an operator "ilike" with "__icontains" end', () => {
    const operator = FilterHelper.getOperator("name__icontains");
    expect(operator).toEqual('ilike');
  });
  it('should get an operator "startswith" with "__startswith" end', () => {
    const operator = FilterHelper.getOperator("name__startswith");
    expect(operator).toEqual('startswith');
  });
  it('should get an operator "istartswith" with "__istartswith" end', () => {
    const operator = FilterHelper.getOperator("name__istartswith");
    expect(operator).toEqual('istartswith');
  });
  it('should get an operator "endswith" with "__endswith" end', () => {
    const operator = FilterHelper.getOperator("name__endswith");
    expect(operator).toEqual('endswith');
  });
  it('should get an operator "iendswith" with "__iendswith" end', () => {
    const operator = FilterHelper.getOperator("name__iendswith");
    expect(operator).toEqual('iendswith');
  });
  it('should get an operator "moreThan" with "__gt" end', () => {
    const operator = FilterHelper.getOperator("date__gt");
    expect(operator).toEqual('moreThan');
  });
  it('should get an operator "lessThan" with "__lt" end', () => {
    const operator = FilterHelper.getOperator("date__lt");
    expect(operator).toEqual('lessThan');
  });
  it('should get an operator "lessThanOrEqual" with "__lte" end', () => {
    const operator = FilterHelper.getOperator("date__lte");
    expect(operator).toEqual('lessThanOrEqual');
  });
  it('should get an operator "in" with "__in" end', () => {
    const operator = FilterHelper.getOperator("id__in");
    expect(operator).toEqual('in');
  });
  it('should get an operator "between" with "__between" end', () => {
    const operator = FilterHelper.getOperator("amount__between");
    expect(operator).toEqual('between');
  });
  it('should get an operator "notEqual" with "__notequal" end', () => {
    const operator = FilterHelper.getOperator("amount__notequal");
    expect(operator).toEqual('notEqual');
  });
  it('should get an operator "matches" with "__matches" end', () => {
    const operator = FilterHelper.getOperator("amount__matches");
    expect(operator).toEqual('matches');
  });
  it('should get a LIKE %roy% expression from a Query Condition Service', () => {
    const queryCondition = getMockQueryCondition('t1.name');
    const condition = queryCondition.contains('roy');
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.name LIKE '%roy%'`);
  });
  it('should get an insensitive LIKE %roy% expression from a Query Condition Service', () => {
    const queryCondition = getMockQueryCondition('t1.name');
    const condition = queryCondition.contains('roy', true);
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`LOWER(t1.name) LIKE '%roy%'`);
  });
  it('should get a LIKE roy% expression from a Query Condition Service', () => {
    const queryCondition = getMockQueryCondition('t1.name');
    const condition = queryCondition.beginsWith('roy');
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.name LIKE 'roy%'`);
  });
  it('should get a LIKE %roy expression from a Query Condition Service', () => {
    const queryCondition = getMockQueryCondition('t1.name');
    const condition = queryCondition.endsWith('roy');
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.name LIKE '%roy'`);
  });
  it('should get a = expression from a Query Condition Service', () => {
    const queryCondition = getMockQueryCondition('t1.name');
    const condition = queryCondition.equals('roy');
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.name = 'roy'`);
  });
  it('should get an error of Equals Field expression from a Query Condition Service', () => {
    try {
      const queryCondition = getMockQueryCondition('t1.name');
      queryCondition.equalsWithField('t2.source.name');
    } catch (error) {
      expect(error.message).toEqual(`Argument is not a field in equalsWithField method.`);
    }
  });
  it('should get a != expression from a Query Condition Service', () => {
    const queryCondition = getMockQueryCondition('t1.name');
    const condition = queryCondition.notEquals('roy');
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.name != 'roy'`);
  });
  it(`should get a = 'true' expression from a Query Condition Service`, () => {
    const queryCondition = getMockQueryCondition('t1.is_deleted');
    const condition = queryCondition.isTrue();
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.is_deleted = 'true'`);
  });
  it(`should get a = 'false' expression from a Query Condition Service`, () => {
    const queryCondition = getMockQueryCondition('t1.is_deleted');
    const condition = queryCondition.isFalse();
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.is_deleted = 'false'`);
  });
  it(`should get a IS NULL expression from a Query Condition Service`, () => {
    const queryCondition = getMockQueryCondition('t1.code');
    const condition = queryCondition.isNull();
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.code IS NULL`);
  });
  it(`should get a IS NOT NULL expression from a Query Condition Service`, () => {
    const queryCondition = getMockQueryCondition('t1.code');
    const condition = queryCondition.isNotNull();
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.code IS NOT NULL`);
  });
  it('should get a > expression from a Query Condition Service', () => {
    const queryCondition = getMockQueryCondition('t1.amount');
    const condition = queryCondition.greaterThan(10);
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.amount > '10'`);
  });
  it('should get a > expression for Date from a Query Condition Service', () => {
    const date = new Date();
    const queryCondition = getMockQueryCondition('t1.date');
    const condition = queryCondition.greaterThan(date);
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.date > '${date.toISOString()}'`);
  });
  it('should get a >= expression from a Query Condition Service', () => {
    const queryCondition = getMockQueryCondition('t1.amount');
    const condition = queryCondition.greaterThanOrEqual(10);
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.amount >= '10'`);
  });
  it('should get a < expression from a Query Condition Service', () => {
    const queryCondition = getMockQueryCondition('t1.amount');
    const condition = queryCondition.lessThan(10);
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.amount < '10'`);
  });
  it('should get a <= expression from a Query Condition Service', () => {
    const queryCondition = getMockQueryCondition('t1.amount');
    const condition = queryCondition.lessThanOrEqual(10);
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.amount <= '10'`);
  });
  it('should get a IN expression from a Query Condition Service', () => {
    const queryCondition = getMockQueryCondition('t1.amount');
    const condition = queryCondition.in([1, 2]);
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.amount IN (1, 2)`);
  });
  it('should get a IN expression for string type from a Query Condition Service', () => {
    const queryCondition = getMockQueryCondition('t1.code');
    const condition = queryCondition.in(['ABC', 'DEF']);
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.code IN ('ABC', 'DEF')`);
  });
  it('should get an error when give empty args in IN expression from a Query Condition Service', async () => {
    try {
      const queryCondition = getMockQueryCondition('t1.amount');
      queryCondition.in([]);
    } catch (error) {
      expect(error.message).toEqual(`Argument of IN have to be non-empty array.`);
    }
  });
  it('should get a NOT IN expression from a Query Condition Service', () => {
    const queryCondition = getMockQueryCondition('t1.amount');
    const condition = queryCondition.notIn([1, 2]);
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.amount NOT IN (1, 2)`);
  });
  it('should get a NOT IN expression from a Query Condition Service', () => {
    const queryCondition = getMockQueryCondition('t1.amount');
    const condition = queryCondition.notIn(['1', '2']);
    const part = condition.queryBuilderParts[0];
    const expression = part.partParams[0];
    expect(expression).toEqual(`t1.amount NOT IN ('1', '2')`);
  });
  it('should get an error when give empty args in NOT IN expression from a Query Condition Service', async () => {
    try {
      const queryCondition = getMockQueryCondition('t1.amount');
      queryCondition.notIn([]);
    } catch (error) {
      expect(error.message).toEqual(`Argument of NOT IN have to be non-empty array.`);
    }
  });
});
describe('Test Query Builder', () => {
  it('should get a query with an pagination & filters', () => {
    // Create Query Builder
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
      order: '^name,-email',
      name__matches: 'roy',
      name__contains: 'roy',
      name__endswith: 'roy',
      name__startswith: 'roy',
      name__icontains: 'roy',
      name__iendswith: 'roy',
      name__istartswith: 'roy',
      username__isnull: 'true',
      name__in: 'roy,martin',
      point__between: [1, 2],
      name__notequal: 'yor',
      createDateTime__gte: '2020-11-15T00:00:00.000Z',
      createDateTime__lt: '2020-11-25T00:00:00.000Z',
      createDateTime__gt: '2020-11-15T00:00:00.000Z',
      createDateTime__lte: '2020-11-25T00:00:00.000Z',
    }, 't1');

    // Mapping filter field (Whitelist) (REQUIRED for filters).
    qb.fieldResolverMap['name__matches'] = 't1.name';
    qb.fieldResolverMap['name__contains'] = 't1.name';
    qb.fieldResolverMap['name__endswith'] = 't1.name';
    qb.fieldResolverMap['name__startswith'] = 't1.name';
    qb.fieldResolverMap['name__icontains'] = 't1.name';
    qb.fieldResolverMap['name__iendswith'] = 't1.name';
    qb.fieldResolverMap['name__istartswith'] = 't1.name';
    qb.fieldResolverMap['username__isnull'] = 't1.username';
    qb.fieldResolverMap['name__in'] = 't1.name';
    qb.fieldResolverMap['name__notequal'] = 't1.name';
    qb.fieldResolverMap['point__between'] = 't1.point';
    qb.fieldResolverMap['createDateTime__gte'] = 't1.create_date_time';
    qb.fieldResolverMap['createDateTime__lt'] = 't1.create_date_time';
    qb.fieldResolverMap['createDateTime__gt'] = 't1.create_date_time';
    qb.fieldResolverMap['createDateTime__lte'] = 't1.create_date_time';

    // Have to be after mapping.
    qb.applyFilterPagination();

    qb.selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t1.point', 'point'],
      ['t1.username', 'username'],
      ['t1.email', 'email'],
    );

    qb.andWhere(
      e => e.isDeleted,
      w => w.isFalse(),
    );
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.FILTER_PAGINATION);
  });
  it('should get an error when give empty string for property selector in LEFT expression', async () => {
    try {
      const qb = new QueryBuilder(User, {}, 't1')
      .selectRaw(['t1.id', 'id'], ['t2.url', 'url'])
      .leftJoin(
        '',
        't2',
      );
    } catch (error) {
      expect(error.message).toEqual(`Property Selector not defined.`);
    }
  });
  it('should get an error when give empty string for property selector in WHERE expression', async () => {
    try {
      const qb = new QueryBuilder(User, {}, 't1')
      .selectRaw(['t1.id', 'id'], ['t2.url', 'url'])
      .leftJoin(
        e => e.photos,
        't2',
        j => j.andWhere(
          '',
          w => w.isNotNull(),
        ),
      );
    } catch (error) {
      expect(error.message).toEqual(`Property Selector not provided.`);
    }
  });
  it('should get an error when JOIN unrelated table with main table', async () => {
    try {
      const qb = new QueryBuilder(User, {}, 't1')
      .selectRaw(['t1.id', 'id'], ['t2.url', 'url'])
      .leftJoin(
        't1.branch',
        't2',
        j => j.andWhere(
          't2.is_delete',
          w => w.isFalse(),
        ),
      );

    } catch (error) {
      expect(error.message).toEqual(`User does not have relation with branch`);
    }
  });
  it('should get an error when prefix in order does not provided', async () => {
    try {
      // Create Query Builder
      const qb = new QueryBuilder(User, {
        page: 1,
        limit: 10,
        order: 'name',
      }, 't1');

      // Have to be after mapping.
      qb.applyFilterPagination();

      qb.selectRaw(
        ['t1.id', 'id'],
        ['t1.name', 'name'],
      ); 
    } catch (error) {
      expect(error.message).toEqual('No order set for <name>. Prefix with one of these: [^, -]');
    }
  });
  it('should get a query with Isolated WHERE', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
    ).andWhere(
      e => e.photos.url,
      w => w.isNotNull(),
    ).andWhereIsolated(q => {
      return q.andWhere(
        e => e.name,
        w => w.equals('roy'),
      ).orWhere(
        e => e.username,
        w => w.equals('roygrindelwald'),
      );
    }).orWhereIsolated(q => {
      return q.andWhere(
        e => e.email,
        w => w.equals('roygrindelwald@gmail.com'),
      ).andWhere(
        e => e.password,
        w => w.isNotNull(),
      );
    });
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.ISOLATED_WHERE);
  });
  it('should get an error when args does not provided in Select', () => {
    try {
      const qb = new QueryBuilder(User, {
        page: 1,
        limit: 10,
      }, 't1')
      .selectRaw();
    } catch (error) {
      expect(error.message).toEqual('String expression is required for the selectRaw method');
    }
  });
  it('should get a query when args provided in string type in Select', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id'],
      ['t1.name'],
    );
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.ERROR_SELECT);
  });
  it('should get a query with adding a FROM query', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t2.url', 'url'],
    )
    .from(Photos, 't2');
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.ADD_FROM);
  });
  it('should set distinct on query', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t2.url', 'url'],
    )
    .from(Photos, 't2')
    .setDistinct();
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.DISTINCT);
  });
  it('should set distinct on field(s) in query', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t2.url', 'url'],
    )
    .from(Photos, 't2')
    .setDistinctOn(e => e.id, e => e.name);
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.DISTINCT_ON);
  });
  it('should set distinct on field(s) will error if properties does not provided', async () => {
    try {
      new QueryBuilder(User, {
        page: 1,
        limit: 10,
      }, 't1')
      .selectRaw(
        ['t1.id', 'id'],
        ['t1.name', 'name'],
        ['t2.url', 'url'],
      )
      .from(Photos, 't2')
      .setDistinctOn();
    } catch (error) {
      expect(error.message).toEqual('Property selector is required in setDistinctOn');
    }
  });
  it('should set distinct on field(s) will error if properties are duplicated', async () => {
    try {
      const qb = new QueryBuilder(User, {}, 't1')
      .selectRaw(
        ['t1.id', 'id'],
        ['t1.name', 'name'],
      )
      .setDistinctOn(
        e => e.name,
        e => e.name,
      );
    } catch (error) {
      expect(error.message).toEqual('Fields have to be unique in setDistinctOn');
    }
  });
  it('should set distinct on field(s) will error if properties are duplicated with string props', async () => {
    try {
      const qb = new QueryBuilder(User, {}, 't1')
      .selectRaw(
        ['t1.id', 'id'],
        ['t1.name', 'name'],
      )
      .setDistinctOn(
        't1.name',
        't1.name',
      );
    } catch (error) {
      expect(error.message).toEqual('Fields have to be unique in setDistinctOn');
    }
  });
  it('should get a query with HAVING', () => {
    const qb = new QueryBuilder(Photos, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.filename', 'name'],
      ['t1.url', 'url'],
    ).andHaving(
      e => e.fileName,
      w => w.equals('typeorm'),
    ).orHaving(
      e => e.url,
      w => w.equals('https://image.com/typeorm.jpg'),
    );
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.HAVING);
  });
  it('should get a query by getSql', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t2.url', 'url'],
    ).leftJoin(
      e => e.photos,
      't2',
      j => j.andWhere(
        e => e.isDeleted,
        w => w.isFalse(),
      ),
    );
    
    const query = qb.getSql();
    expect(query).toEqual(QueryList.LEFT_JOIN);
  });
  it('should get data by exec', async () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.username', 'username'],
    )
    .setLocking('pessimistic_read');
    
    const data = await qb.exec();
    expect(isArray(data)).toBeTruthy();
  });
  it('should get data by exec with optimistic locking', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.username', 'username'],
    )
    .setLocking('optimistic', 12);
    
    const query = qb.getQuery();
    expect(query).toEqual(`SELECT "t1"."id" AS "id", "t1"."username" AS "username" FROM "public"."ptc_users" "t1"`);
  });
  it('should get an error when version number does not provided when optimistic locking', async () => {
    try {
      const qb = new QueryBuilder(User, {
        page: 1,
        limit: 10,
      }, 't1')
      .selectRaw(
        ['t1.id', 'id'],
        ['t1.username', 'username'],
      )
      .setLocking('optimistic');
    } catch (error) {
      expect(error.message).toEqual(`Version is not provided for optimistic locking`);
    }
  });
  it('should get a query with LEFT JOIN', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t2.url', 'url'],
    ).leftJoin(
      e => e.photos,
      't2',
      j => j.andWhere(
        e => e.isDeleted,
        w => w.isFalse(),
      ),
    );
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.LEFT_JOIN);
  });
  it('should get a query with LEFT JOIN using Raw', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t2.url', 'url'],
    ).leftJoin('t1.photos', 't2');
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.LEFT_JOIN_RAW);
  });
  it('should get a query with INNER JOIN', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t2.url', 'url'],
    ).innerJoin(
      e => e.photos,
      't2',
      j => j.andWhere(
        e => e.isDeleted,
        w => w.isFalse(),
      ),
    );
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.INNER_JOIN);
  });
  it('should get a query with INNER JOIN using Raw', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t2.url', 'url'],
    ).innerJoin('t1.photos', 't2');
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.INNER_JOIN_RAW);
  });
  it('should get a query with WHERE to deep relation', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t2.url', 'url'],
    ).leftJoin(
      e => e.photos,
      't2',
      j => j.andWhere(
        e => e.isDeleted,
        w => w.isFalse(),
      ),
    ).andWhere(
      e => e.photos.url,
      w => w.isNotNull(),
    );
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.DEEP_RELATION_WHERE);
  });
  it('should get a query with JOIN and multiple condition', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t2.url', 'url'],
    ).innerJoin(
      e => e.photos,
      't2',
      j => j.andWhere(
        e => e.isDeleted,
        w => w.isFalse(),
      ).andWhere(
        e => e.url,
        w => w.isNotNull(),
      ),
    );
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.MULTI_CONDITION_JOIN);
  });
  it('should get a query with JOIN to deep relation which not related to parent table', () => {
    const qb = new QueryBuilder(Branch, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.branch_name', 'branchName'],
      ['t2.name', 'pic'],
      ['t3.url', 'photo'],
    ).innerJoin(
      e => e.user,
      't2',
      j => j.andWhere(
        e => e.isDeleted,
        w => w.isFalse(),
      ),
    ).innerJoin(
      e => e.user.photos,
      't3',
      j => j.andWhere(
        e => e.isDeleted,
        w => w.isFalse(),
      ).andWhere(
        e => e.url,
        w => w.isNotNull(),
      ),
    );
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.DEEP_RELATION_JOIN);
  });
  it('should get a query with GROUP BY', () => {
    const qb = new QueryBuilder(User, {}, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
    ).groupBy(
      e => e.name,
    );
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.GROUP_BY);
  });
  it('should get an error when query with GROUP BY but property selector does not provided', () => {
    try {
      const qb = new QueryBuilder(User, {}, 't1')
      .selectRaw(
        ['t1.id', 'id'],
        ['t1.name', 'name'],
      ).groupBy();
      
      const query = qb.getQuery();
    } catch (error) {
      expect(error.message).toEqual(`Property selector is required in groupBy`);
    }
  });
  it('should get a query with Multiple GROUP BY', () => {
    const qb = new QueryBuilder(User, {}, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
    ).groupBy(
      e => e.id,
      e => e.name,
    );
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.MULTI_GROUP_BY);
  });
  it('should get an error when query with GROUP BY but property selector are duplicated', () => {
    try {
      const qb = new QueryBuilder(User, {}, 't1')
      .selectRaw(
        ['t1.id', 'id'],
        ['t1.name', 'name'],
      ).groupBy(
        e => e.name,
        e => e.name,
      );
      
      const query = qb.getQuery();
    } catch (error) {
      expect(error.message).toEqual(`Fields have to be unique in groupBy`);
    }
  });
  it('should get an error when query with GROUP BY but property selector are duplicated with string props', () => {
    try {
      const qb = new QueryBuilder(User, {}, 't1')
      .selectRaw(
        ['t1.id', 'id'],
        ['t1.name', 'name'],
      ).groupBy(
        't1.name',
        't1.name',
      );
      
      const query = qb.getQuery();
    } catch (error) {
      expect(error.message).toEqual(`Fields have to be unique in groupBy`);
    }
  });
  it('should get a query with sub query in SELECT', () => {
    const qb = new QueryBuilder(User, {}, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
    ).selectSubQuery(Photos, 'photo', subQuery => {
      return subQuery.selectRaw(
        ['photo.filename', 'fileName'],
      )
      .andWhere('photo.filename', w => w.equals('typeorm.jpg'));
    });
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.SELECT_SUB_QUERY);
  });
  it('should get a query with sub query in FROM', () => {
    const qb = new QueryBuilder(User, {}, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['photo.fileName', 'name'],
    ).from(Photos, 'photo', subQuery => {
      return subQuery.selectRaw(
        ['photo.filename', 'fileName'],
      )
      .andWhere('photo.filename', w => w.equals('typeorm.jpg'));
    });
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.FROM_SUB_QUERY);
  });
  it('should get a query with sub query in WHERE', () => {
    const qb = new QueryBuilder(User, {}, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t2.url', 'url'],
    ).innerJoin(
      e => e.photos,
      't2',
    ).andWhere(
      e => e.username,
      (w, subQuery) => {
        w.in(
          subQuery
            .selectRaw(['t1.username', 'username'])
            .from(User, 't1')
            .andWhere(
              e => e.isDeleted,
              w => w.isFalse(),
            )
            .getQuery()
        )
      },
    ).orWhere(
      e => e.username,
      (w, subQuery) => {
        w.notIn(
          subQuery
            .selectRaw(['t1.username', 'username'])
            .from(User, 't1')
            .andWhere(
              e => e.isDeleted,
              w => w.isFalse(),
            )
            .getQuery()
        )
      },
    );
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.WHERE_SUB_QUERY);
  });
  it('should get a query with sub query in INNER JOIN with condition', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t2.branchName', 'branch'],
    )
    .innerJoinSubQuery(
      subQuery => {
        return subQuery
          .selectRaw(
            ['branch.user_id', 'userId'],
            ['branch.branch_name', 'branchName'],
          )
          .from(Branch, 'branch')
          .andWhere(
            e => e.isDeleted,
            w => w.isFalse(),
          )
      },
      't2',
      j => j.andWhere(
        't2.userId',
        w => w.equalsWithField('t1.id'),
      )
    );
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.INNER_JOIN_SUB_QUERY_WITH_CONDITION);
  });
  it('should get a query with sub query in INNER JOIN without condition', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t2.branchName', 'branch'],
    )
    .innerJoinSubQuery(
      subQuery => {
        return subQuery
          .selectRaw(
            ['branch.user_id', 'userId'],
            ['branch.branch_name', 'branchName'],
          )
          .from(Branch, 'branch')
          .andWhere(
            e => e.isDeleted,
            w => w.isFalse(),
          )
      },
      't2',
    );
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.INNER_JOIN_SUB_QUERY);
  });
  it('should get a query with sub query in LEFT JOIN without condition', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t2.branchName', 'branch'],
    )
    .leftJoinSubQuery(
      subQuery => {
        return subQuery
          .selectRaw(
            ['branch.user_id', 'userId'],
            ['branch.branch_name', 'branchName'],
          )
          .from(Branch, 'branch')
          .andWhere(
            e => e.isDeleted,
            w => w.isFalse(),
          )
      },
      't2',
    );
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.LEFT_JOIN_SUB_QUERY_WITHOUT_CONDITION);
  });
  it('should get a query with sub query in LEFT JOIN', () => {
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
    }, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t2.branchName', 'branch'],
    )
    .leftJoinSubQuery(
      subQuery => {
        return subQuery
          .selectRaw(
            ['branch.user_id', 'userId'],
            ['branch.is_deleted', 'isDeleted'],
            ['branch.branch_name', 'branchName'],
          )
          .from(Branch, 'branch')
          .andWhere(
            e => e.isDeleted,
            w => w.isFalse(),
          )
      },
      't2',
      j => j.andWhere(
        't2.userId',
        w => w.equalsWithField('t1.id'),
      ).andWhere(
        't2.isDeleted',
        w => w.isFalse(),
      )
    );
    
    const query = qb.getQuery();
    expect(query).toEqual(QueryList.LEFT_JOIN_SUB_QUERY);
  });
  it('should get a type of number for Aggregate Function (COUNT, MAX, MIN, AVG, and SUM)', async () => {
    const qb = new QueryBuilder(User, {}, 't1')
    .selectRaw(
      ['t1.id', 'id'],
      ['t1.username', 'username'],
    );
    
    const count = await qb.getCount();
    expect(isNum(count)).toBeTruthy();

    const max = await qb.getMax(e => e.point);
    expect(isNum(max)).toBeTruthy();

    const maxString = await qb.getMax('t1.point');
    expect(isNum(maxString)).toBeTruthy();

    try {
      await qb.getMax('t1.id');
    } catch (error) {
      expect(error.message).toEqual(`Type of id field is uuid not assignable to type number in MAX method. Please provide only numeric type field.`);
    }

    try {
      await qb.getMax('');
    } catch (error) {
      expect(error.message).toEqual(`Property Selector not provided.`);
    }

    try {
      await qb.getManyMax();
    } catch (error) {
      expect(error.message).toEqual(`Property selector is required in getManyMax`);
    }

    try {
      await qb.getManyMax('t1.point', 't1.point');
    } catch (error) {
      expect(error.message).toEqual(`Fields have to be unique in getManyMax`);
    }

    const manyMax = await qb.getManyMax(e => e.point, e => e.follower, e => e.following);
    expect(
      isNum(manyMax && manyMax.pointMax)
      && isNum(manyMax && manyMax.followerMax)
      && isNum(manyMax && manyMax.followingMax)
    ).toBeTruthy();

    const min = await qb.getMin(e => e.point);
    expect(isNum(min)).toBeTruthy();

    try {
      await qb.getManyMin();
    } catch (error) {
      expect(error.message).toEqual(`Property selector is required in getManyMin`);
    }

    try {
      await qb.getManyMin('t1.point', 't1.point');
    } catch (error) {
      expect(error.message).toEqual(`Fields have to be unique in getManyMin`);
    }

    const manyMin = await qb.getManyMin(e => e.point, e => e.follower);
    expect(isNum(manyMin && manyMin.pointMin) && isNum(manyMin && manyMin.followerMin)).toBeTruthy();

    const avg = await qb.getAverage(e => e.point);
    expect(isNum(avg)).toBeTruthy();

    try {
      await qb.getManyAverage();
    } catch (error) {
      expect(error.message).toEqual(`Property selector is required in getManyAverage`);
    }

    try {
      await qb.getManyAverage('t1.point', 't1.point');
    } catch (error) {
      expect(error.message).toEqual(`Fields have to be unique in getManyAverage`);
    }

    const manyAvg = await qb.getManyAverage(e => e.point, e => e.follower);
    expect(isNum(manyAvg && manyAvg.pointAvg) && isNum(manyAvg && manyAvg.followerAvg)).toBeTruthy();

    const sum = await qb.getSum(e => e.point);
    expect(isNum(sum)).toBeTruthy();

    try {
      await qb.getManySum();
    } catch (error) {
      expect(error.message).toEqual(`Property selector is required in getManySum`);
    }

    try {
      await qb.getManySum('t1.point', 't1.point');
    } catch (error) {
      expect(error.message).toEqual(`Fields have to be unique in getManySum`);
    }

    const manySum = await qb.getManySum(e => e.point, e => e.follower);
    expect(isNum(manySum && manySum.pointSum) && isNum(manySum && manySum.followerSum)).toBeTruthy();
  });
  it('should get a type of number for Aggregate Function with deep relation', async () => {
    const qb = new QueryBuilder(Branch, {}, 't1')
    .selectRaw(
      ['t1.id', 'id'],
    ).leftJoin(
      e => e.user,
      't2',
    );

    const manySum = await qb.getManySum(e => e.user.point);
    expect(isNum(manySum && manySum.pointSum)).toBeTruthy();
  });
});
