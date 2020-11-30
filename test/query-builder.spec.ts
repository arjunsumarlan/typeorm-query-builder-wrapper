import { QueryBuilder } from '../src/query-builder';
import { User } from './model/user.entity';

describe('Test Query Builder', () => {
  it('should get a query with an pagination & filters', () => {
    // Create Query Builder
    const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
      order: '^name',
      name_contains: 'arju',
      username: 'arjunsumarlan',
      createDateTime__gte: '2020-11-15T00:00:00.000Z',
      createDateTime__lt: '2020-11-25T00:00:00.000Z',
    }, 't1');

    // Mapping filter field (Whitelist) (REQUIRED for filters).
    qb.fieldResolverMap['name_contains'] = 't1.name';
    qb.fieldResolverMap['username'] = 't1.username';
    qb.fieldResolverMap['createDateTime__gte'] = 't1.create_date_time';
    qb.fieldResolverMap['createDateTime__lt'] = 't1.create_date_time';

    // Have to be after mapping.
    qb.applyFilterPagination();

    qb.selectRaw(
      ['t1.id', 'id'],
      ['t1.name', 'name'],
      ['t1.username', 'username'],
      ['t1.email', 'email'],
    );

    qb.andWhere(
      e => e.isDeleted,
      w => w.isFalse(),
    );
    
    const query = qb.getQuery();
    expect(query).toEqual(`SELECT "t1"."id" AS "id", "t1"."name" AS "name", "t1"."username" AS "username", "t1"."email" AS "email" FROM "public"."ptc_users" "t1" WHERE "t1"."name" = 'arju' AND "t1"."username" = 'arjunsumarlan' AND "t1"."create_date_time" >= '2020-11-15T00:00:00.000Z' AND "t1"."create_date_time" < '2020-11-25T00:00:00.000Z' AND "t1"."is_deleted" = 'false' ORDER BY "t1"."name" ASC LIMIT 10`);
  });
  it('should get a query with WHERE to deep relation', () => {
    // TODO: Test
  });
  it('should get a query with Isolated WHERE', () => {
    // TODO: Test
  });
  it('should get a query with JOIN', () => {
    // TODO: Test
  });
  it('should get a query with JOIN and multiple condition', () => {
    // TODO: Test
  });
  it('should get a query with JOIN to deep relation which not related to parent table', () => {
    // TODO: Test
  });
  it('should get a query with GROUP BY', () => {
    // TODO: Test
  });
  it('should get a query with sub query in SELECT', () => {
    // TODO: Test
  });
  it('should get a query with sub query in FROM', () => {
    // TODO: Test
  });
  it('should get a query with sub query in WHERE', () => {
    // TODO: Test
  });
  it('should get a query with sub query in JOIN', () => {
    // TODO: Test
  });
  it('should get a query with Aggregate Function (COUNT, MAX, MIN, AVG, and SUM)', () => {
    // TODO: Test
  });
});
