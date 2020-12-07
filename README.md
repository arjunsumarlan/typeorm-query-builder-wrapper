<p align="center">
  Easy Wrapper for TypeORM Query Builder
  <br>
  <br>
  <img src="https://badgen.net/npm/v/yarn">
  <img src="https://badgen.net/npm/node/next">
  <img src="https://badgen.net/badge/icon/typescript?icon=typescript&label">
  <img src="https://img.shields.io/badge/license-MIT-green.svg">
  <br>
  <br>
</p>

# TypeORM Query Builder Wrapper
[TypeORM](https://github.com/typeorm/typeorm) is one of ORM that can run in NodeJS, Browser, Cordova, PhoneGap, Ionic, React Native, NativeScript, Expo, and Electron platforms and can be used with TypeScript and JavaScript. To use TypeORM to create connection, entities, etc, please visit this [link](https://github.com/typeorm/typeorm/blob/master/README.md). One of the great feature in TypeORM is Query Builder, that you can build query with builder pattern so you can write query with flexible and elegant syntax without to know more about SQL knowledge, to use Query Builder please visit this [link](https://github.com/typeorm/typeorm/blob/master/docs/select-query-builder.md). But, its Query Builder have a weakness that you have to write query with RAW that allow you to make a mistakes, typos, and of course reduce the elegancy of it. So, this library allows you to use TypeORM Query Builder in very easy, safe way, and of course more elegant. This library was inspired by [TypeORM LINQ Repository](https://github.com/IRCraziestTaxi/typeorm-linq-repository)

## Features

* Currently it supports for SQL Database, especially PostgreSQL
* TypeScript and JavaScript support
* Produced code is performant, flexible, clean and maintainable


## Installation


1. Install the yarn package:

    `yarn add typeorm typeorm-query-builder-wrapper --save`

2. You need to install `reflect-metadata` shim:

    `npm install reflect-metadata --save`

    and import it somewhere in the global place of your app (for example in `app.ts`):

    `import "reflect-metadata";`

3. You may need to install node typings:

    `npm install @types/node --save-dev`

4. Install a database driver:

    * for **PostgreSQL** or **CockroachDB**

        `npm install pg --save`


### TypeScript configuration


Also, make sure you are using TypeScript version **3.3** or higher,
and you have enabled the following settings in `tsconfig.json`:

```json
"emitDecoratorMetadata": true,
"experimentalDecorators": true,
```

You may also need to enable `es6` in the `lib` section of compiler options, or install `es6-shim` from `@types`.

### TypeORM


Please visit [this](https://github.com/typeorm/typeorm#quick-start) to setup what needs and how to use TypeORM.

## Usage


* [QueryBuilder](#querybuilder)
* [Instantiate a QueryBuilder](#instantiate-a-querybuilder)
* [Adding `Filter` and `Pagination`](#adding-filter-and-pagination)
* [Adding `SELECT` expression](#adding-select-expression)
* [Adding `WHERE` expression](#adding-where-expression)
* [Adding `HAVING` expression](#adding-having-expression)
* [Adding `DISTINCT ON` expression](#adding-distinct-on-expression)
* [Adding `GROUP BY` expression](#adding-group-by-expression)
* [Joining relations](#joining-relations)
* [Inner and left joins](#inner-and-left-joins)
* [Getting the generated query](#getting-the-generated-query)
* [Getting raw results](#getting-raw-results)
* [Streaming result data](#streaming-result-data)
* [Set locking](#set-locking)
* [Using subqueries](#using-subqueries)

## `QueryBuilder`

`QueryBuilder` is one of the most powerful features of TypeORM -
it allows you to build SQL queries using elegant and convenient syntax,
execute them and get automatically transformed entities.

Assume that you have `User Entity` like this:

```typescript
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, } from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'boolean',
        name: 'is_deleted',
        default: false
    })
    isDeleted: boolean;

    @CreateDateColumn({
        type: 'timestamp',
        name: 'create_date_time',
        default: () => 'CURRENT_TIMESTAMP',
    })
    createDateTime: Date;

    @Column({ type: 'uuid', name: 'create_user_id' })
    createUserId: string;

    @Column('character varying', {
        nullable: false,
        length: 255,
        name: 'name',
    })
    name: string;

    @Column('character varying', {
        nullable: false,
        length: 255,
        name: 'username',
    })
    username: string;

    @Column('character varying', {
        nullable: false,
        length: 500,
        name: 'password',
        select: false,
    })
    password: string;
}
```

Simple example of `QueryBuilder`:

```typescript
// Instantiate QueryBuilder
const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
      order: '^name',
      name_contains: 'Roy',
      username: 'roygrindelwald',
      createDateTime__gte: '2020-11-15T00:00:00.000Z',
      createDateTime__lt: '2020-11-25T00:00:00.000Z',
    }, 't1');

// Mapping filter field (Whitelist).
qb.fieldResolverMap['name_contains'] = 't1.name';
qb.fieldResolverMap['username'] = 't1.username';
qb.fieldResolverMap['createDateTime__gte'] = 't1.create_date_time';
qb.fieldResolverMap['createDateTime__lt'] = 't1.create_date_time';

// Have to be after mapping.
qb.applyFilterPagination();

// Select fields.
qb.selectRaw(
    ['t1.id', 'id'],
    ['t1.name', 'fullName'],
    ['t1.username', 'username'],
    ['t1.email', 'email'],
);

qb.andWhere(
    e => e.isDeleted,
    w => w.isFalse(),
);

// Execute the query
const data = await qb.exec();
```

It builds the following SQL query:

```sql
SELECT 
    t1.id AS id,
    t1.name AS fullName,
    t1.username AS username,
    t1.email AS email
FROM users t1 
WHERE 
    t1.name = 'Roy'
    AND t1.username = 'roygrindelwald'
    AND t1.create_date_time >= '2020-11-15T00:00:00.000Z'
    AND t1.create_date_time < '2020-11-25T00:00:00.000Z'
    AND t1.is_deleted = 'false'
ORDER BY t1.name ASC 
LIMIT 10
```

and returns you a list instance of `User`:

```
[
    User {
        id: "8cca9676-32a4-11eb-adc1-0242ac120002",
        fullName: "Roy Grindelwald",
        username: "roygrindelwald",
        email: "roygrindelwald@gmail.com"
    }
]
```

## Instantiate a QueryBuilder


```typescript
import { QueryBuilder } from 'typeorm-query-builder-wrapper';
import { User } from './model/user.entity';

const qb = new QueryBuilder(User, {
      page: 1,
      limit: 10,
      order: '^name',
      name_contains: 'Roy',
      username: 'roygrindelwald',
      createDateTime__gte: '2020-11-15T00:00:00.000Z',
      createDateTime__lt: '2020-11-25T00:00:00.000Z',
    }, 't1');
```

There are 3 arguments of `QueryBuilder` constructor:

* `Entity` - used to apply entity to `QueryBuilder`.
* `QueryObject` - used to construct filter and pagination in `QueryBuilder`. Example:

    ```typescript
    {
      page: 1,
      limit: 10,
      order: '^name',
      name_contains: 'Roy',
      username: 'roygrindelwald',
      createDateTime__gte: '2020-11-15T00:00:00.000Z',
      createDateTime__lt: '2020-11-25T00:00:00.000Z',
    }
    ```

    It is contains these options:

    | Option | Default | Behaviour | Example |
    | --- | :---: | --- | --- |
    page | __1__ | Return entries for page `page` | `page: 2`
    limit | __10__ | Return entries for page `page` paginated by size `limit` | `limit: 25`
    order | - | Order for fields:<br>`^`: Ascendant <br> `-`: Descendant | `order: '^foo,-name,^surname'`

    And for the field of entity, it follows these rules:

    | Lookup | Behaviour | Example |
    | --- | --- | --- |
    __matches__ | Return entries that match with value | `foo: 'raul'`
    __contains__ | Return entries that contains value | `foo__contains: 'ryo'`
    __startswith__ | Return entries that starts with value | `foo__startswith: 'r'`
    __endswith__ | Return entries that ends with value | `foo__endswith: 'dev'`
    __isnull__ | Return entries with null value | `foo__isnull`
    __lt__ | Return entries with value less than or equal to provided | `foo__lt: 18`
    __lte__ | Return entries with value less than provided | `foo__lte: 18`
    __gt__ | Returns entries with value greater than provided | `foo__gt: 18`
    __gte__ | Return entries with value greater than or equal to provided | `foo__gte: 18`
    __in__ | Return entries that match with values in list | `foo__in: 'admin,common'`
    __between__ | Return entries in range | `foo__between: [1, 27]`

* `Alias` - used to define alias for main table.


## Adding `Filter` and `Pagination`

Most of the time when you develop an application, you need pagination functionality. This is used if you have pagination, page slider, or infinite scroll components in your application.

To do this, it is very simple, you only need define `page` and `limit` in `QueryObject` when you instantiate `QueryBuilder`, for example:

```typescript
qb.applyFilterPagination();
```

it will add ORDER and LIMIT query into SQL raw query like this:

```sql
ORDER BY t1.name ASC 
LIMIT 10
```

If you have `filters` for your list, you have to mapping the fields to make a whitelist for the filter and also to map field of `entity` to field of `QueryObject`, for example:

```typescript
qb.fieldResolverMap['name_contains'] = 't1.name';
qb.fieldResolverMap['username'] = 't1.username';
qb.fieldResolverMap['createDateTime__gte'] = 't1.create_date_time';
qb.fieldResolverMap['createDateTime__lt'] = 't1.create_date_time';
```

it will add WHERE query into SQL raw query like this:

```sql
WHERE 
    t1.name = 'Roy'
    AND t1.username = 'roygrindelwald'
    AND t1.create_date_time >= '2020-11-15T00:00:00.000Z'
    AND t1.create_date_time < '2020-11-25T00:00:00.000Z'
```

`WARNING !!` YOU HAVE TO MAPPING BEFORE APPLY TO FILTER PAGINATION

Then the complete of filter and pagination is:

```typescript
qb.fieldResolverMap['name_contains'] = 't1.name';
qb.fieldResolverMap['username'] = 't1.username';
qb.fieldResolverMap['createDateTime__gte'] = 't1.create_date_time';
qb.fieldResolverMap['createDateTime__lt'] = 't1.create_date_time';

qb.applyFilterPagination();
```
And the complete result:

```sql
WHERE 
    t1.name = 'Roy'
    AND t1.username = 'roygrindelwald'
    AND t1.create_date_time >= '2020-11-15T00:00:00.000Z'
    AND t1.create_date_time < '2020-11-25T00:00:00.000Z'
ORDER BY t1.name ASC 
LIMIT 10
```


## Adding `SELECT` expression

To select fields in table, you can use SELECT query. In `QueryBuilder`, you can use `selectRaw` method.
It has one argument is a list of fields with its alias. Example:

```typescript
qb.selectRaw(
    ['t1.id', 'id'],
    ['t1.name', 'name'],
    ['t1.username', 'username'],
    ['t1.email', 'email'],
);
```

Which will result in the following sql query:

```sql
SELECT
    t1.id AS id,
    t1.name AS fullName,
    t1.username AS username,
    t1.email AS email
FROM users t1
```

In this SQL query, `users` is the table name, and `t1` is an alias we assign to this table.

## Adding `WHERE` expression

Adding a `WHERE` expression is as easy as:

```typescript
qb.andWhere(
    e => e.isDeleted,
    w => w.isFalse(),
);
```

Which will produce:

```sql
WHERE t1.is_deleted = 'false'
```

If `WHERE` expression it reach for the first time, then `AND` or `OR` will be removed to avoid error. So the result will not be like this:

```sql
WHERE AND t1.is_deleted = 'false'
```

You can add `AND` into an existing `WHERE` expression:

```typescript
qb.andWhere(
    e => e.isDeleted,
    w => w.isFalse(),
);
qb.andWhere(
    e => e.name,
    w => w.equals('Roy Grindelwald'),
);
```

Which will produce the following SQL query:

```sql
WHERE 
    t1.is_deleted = 'false'
    AND t1.name = 'Roy Grindelwald'
```

You can add `OR` into an existing `WHERE` expression:

```typescript
qb.andWhere(
    e => e.isDeleted,
    w => w.isFalse(),
);
qb.orWhere(
    e => e.username,
    w => w.equals('roygrindelwald'),
);
```

Which will produce the following SQL query:

```sql
WHERE 
    t1.is_deleted = 'false'
    OR t1.username = 'roygrindelwald'
```

They have 2 arguments.

First argument is called `Property Selector`, which return the selected property or field, example `e.username`, `e` is entity of main table which is `User`, user has `username` field, then `e.username` will give you an output of field `username` from `User` entity. it also can select from `User` relation, assume `User` has relation to `Product` with entity name `product`. `NOTE!` you have to mapping `Product` entity first in `User` entity class, or vice versa, depends on your need. So, if you want select one of field of `Product` entity, you can do like this:

```typescript
qb.andWhere(
    e => e.product.productCode,
    w => w.equals('2ABC5'),
);
```

Second argument is called `Operator`, which return the operator used in `WHERE` expression like `=`, `!=`, `IN`, `IS NULL`, etc.

The list of oprator:

| Operator | Behaviour | Example |
| --- | --- | --- |
__equals__ | Return entries that match with value | `w.equals('foo')`
__notEquals__ | Return entries that not match with value | `w.notEquals('foo')`
__contains__ | Return entries that contains value | `w.contains('foo')`
__beginsWith__ | Return entries that starts with value | `w.beginsWith('foo')`
__endsWith__ | Return entries that ends with value | `w.endsWith('foo')`
__isNotNull__ | Return entries with not null value | `w.isNotNull()`
__isNull__ | Return entries with null value | `w.isNull()`
__greaterThan__ | Returns entries with value greater than provided | `w.greaterThan(100)`
__greaterThanOrEqual__ | Return entries with value greater than or equal to provided | `w.greaterThanOrEqual(100)`
__lessThan__ | Return entries with value less than or equal to provided | `w.lessThan(100)`
__lessThanOrEqual__ | Return entries with value less than provided | `w.lessThanOrEqual(100)`
__in__ | Return entries that match with values in list | `w.in(['foo', 'bar'])`
__notIn__ | Return entries that not match with values in list | `w.notIn(['foo', 'bar'])`


You can add a complex `WHERE` expression into an existing `WHERE` like `Brackets` in `TypeORM`

```typescript
qb.andWhere(
    e => e.isDeleted,
    w => w.isFalse(),
);
qb.andWhereIsolated(q =>
    q.andWhere(
        e => e.product.productCode,
        w => w.isNotNull(),
    ).orWhere(
        e => e.name,
        w => w.equals('Roy'),
    ),
);
```

It has 1 argument that has type of `QueryBuilder` like `Sub Query`.

Which will produce the following SQL query:

```sql
WHERE 
    t1.is_deleted = 'false'
    AND (
        t2.product_code = '2ABC'
        OR t1.name = 'Roy Grindelwald'
    )
```

You can combine as many `AND` and `OR` expressions as you need.

Note: be careful with `orWhere` - if you use complex expressions with both `AND` and `OR` expressions,
keep in mind that they are stacked without any pretences.
Sometimes you'll need to create a where string instead, and avoid using `orWhere`.

## Adding `HAVING` expression

Adding a `HAVING` expression is easy as:

```typescript
qb.andHaving(
    e => e.isDeleted,
    w => w.isTrue(),
);
```

Which will produce following SQL query:

```sql
HAVING t1.is_deleted = 'true'
```

The rules of play is same as `WHERE` expression.
But it is not support yet for complex having.

## Adding `DISTINCT ON` expression
When using both distinct-on with an order-by expression, the distinct-on expression must match the leftmost order-by.
The distinct-on expressions are interpreted using the same rules as order-by. Please note that, using distinct-on without an order-by expression means that the first row of each set is unpredictable.

Adding a `DISTINCT ON` expression is easy as:

```typescript
qb.setDistinctOn(
    e => e.id,
    e => e.name,
);
```

Which will produce:

```sql
SELECT DISTINCT ON (t1.id, t1.name) ... FROM users t1 ORDER BY t1.id
```

## Adding `GROUP BY` expression

Adding a `GROUP BY` expression is easy as:

```typescript
qb.groupBy(
    e => e.id,
    e => e.name,
);
```

Which will produce the following SQL query:

```sql
GROUP BY t1.id, t1.name
```

If you use `.groupBy` more than once you'll override all previous `GROUP BY` expressions.

## Joining relations

Let's say you have the following entities:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import {Photo} from "./Photo";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Photo, photo => photo.user)
    photos: Photo[];
}
```

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import {User} from "./User";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @ManyToOne(type => User, user => user.photos)
    user: User;
}
```

Now let's say you want to load user "Timber" with all of his photos:

```typescript
const qb = new QueryBuilder(User, {}, 't1');
qb.selectRaw(
    ['t1.id', 'id'],
    ['t1.name', 'name'],
    ['t2.url', 'url'],
);
qb.leftJoin(
    e => e.photos,
    't2',
    j =>
        j.andWhere(
            e => e.isDeleted,
            w => w.isFalse(),
        ),
);
qb.andWhere(
      e => e.name,
      w => w.equals('Timber'),
);
```

This will generate following sql query:

```sql
SELECT 
    t1.id AS id
    t1.name AS name
    t2.url AS url
FROM users t1
LEFT JOIN photos t2 ON t2.user = t1.id AND t2.is_deleted = 'false'
WHERE t1.name = 'Timber'
```

You'll get the following result:

```typescript
[
    {
        id: 1,
        name: "Timber",
        url: "me-with-chakram.jpg",
    },
    {
        id: 1,
        name: "Timber",
        url: "me-with-trees.jpg",
    }
]
```

## Inner and left joins

If you want to use `INNER JOIN` instead of `LEFT JOIN` just use `.innerJoin` instead:

```typescript
qb.innerJoin(
    e => e.photos,
    't2',
    j =>
        j.andWhere(
            e => e.isDeleted,
            w => w.isFalse(),
        ),
);
```

This will generate:

```sql
SELECT 
    t1.id AS id
    t1.name AS name
    t2.url AS url
FROM users t1
INNER JOIN photos t2 ON t2.user = t1.id AND t2.is_deleted = 'false'
WHERE t1.name = 'Timber'
```

The difference between `LEFT JOIN` and `INNER JOIN` is that `INNER JOIN` won't return a user if it does not have any photos.
`LEFT JOIN` will return you the user even if it doesn't have photos.
To learn more about different join types, refer to the [SQL documentation](https://msdn.microsoft.com/en-us/library/zt8wzxy4.aspx).


## Getting the generated query

Sometimes you may want to get the SQL query generated by `QueryBuilder`.
To do so, use `getQuery` or `getSql`:

```typescript
const sql = qb.selectRaw(
    ['t1.id', 'id'],
    ['t1.name', 'name'],
    ['t1.username', 'username'],
    ['t1.email', 'email'],
).andWhere(
    e => e.isDeleted,
    w => w.isFalse(),
).getQuery();
```

## Getting raw results

To get raw data, you use `exec`.
Examples:

```typescript
const data = await qb.selectRaw(
    ['t1.id', 'id'],
    ['t1.name', 'name'],
    ['t1.username', 'username'],
    ['t1.email', 'email'],
).andWhere(
    e => e.isDeleted,
    w => w.isFalse(),
).exec();
```

## Streaming result data

You can use `stream` which returns you a stream.
Streaming returns you raw data and you must handle entity transformation manually:

```typescript
const fileName = `User_${new Date().getTime()}.csv`;

// response is writeable output
response.setHeader(
    'Content-disposition',
    `attachment; filename=${fileName}`,
);
response.writeHead(200, { 'Content-Type': 'text/csv' });
response.flushHeaders();

// To set header of CSV
response.write(`User ID, Name, URL\n`);

const qb = new QueryBuilder(User, {}, 't1');

qb.selectRaw(
    ['t1.id', 'id'],
    ['t1.name', 'name'],
    ['t2.url', 'url'],
);
qb.leftJoin(
    e => e.photos,
    't2',
    j =>
        j.andWhere(
            e => e.isDeleted,
            w => w.isFalse(),
        ),
);
qb.andWhere(
      e => e.name,
      w => w.equals('Timber'),
);

await qb.stream(response, this.transformer);
```

The transformer looks like this:

```typescript
transformer(doc) {
    const values = [
        doc.id,
        doc.name,
        doc.url,
    ];

    return `${values.join(',')} \n`;
}
```

It will stream raw results into csv format (for this example) in your user's browser.


## Set locking

QueryBuilder supports both optimistic and pessimistic locking.
To use pessimistic read locking use the following method:

```typescript
qb.setLock("pessimistic_read");
```

To use pessimistic write locking use the following method:

```typescript
qb.setLock("pessimistic_write");
```

To use dirty read locking use the following method:

```typescript
qb.setLock("dirty_read");
```

To use optimistic locking use the following method:

```typescript
qb.setLock("optimistic", version);
```

Optimistic locking works in conjunction with both `@Version` and `@UpdatedDate` decorators from `TypeORM`.

## Using subqueries

You can easily create subqueries. Subqueries are supported in `SELECT` and `FROM` expressions. Next will be supported in `WHERE` and `JOIN` expressions.
Example:

```typescript
qb.selectSubQuery(User, 'user', subQuery =>
    subQuery.selectRaw(
        ['user.name', 'name'],
        ['user.username', 'username'],
    )
    .andWhere(
        'user.is_deleted',
        w => w.isFalse()
    )
);
```

example for `FROM`:

```typescript
qb.from(User, 'user', subQuery => {
    return subQuery.selectRaw(
        ['user.name', 'name'],
        ['user.username', 'username'],
    )
    .andWhere(
        'user.is_deleted',
        w => w.isFalse()
    );
});
```

example for `WHERE`:

```typescript
qb.from(User, 'user', subQuery => {
    return subQuery.selectRaw(
      ['t1.id', 'id'],
      ['t1.username', 'username'],
    ).andWhere(
      e => e.username,
      (w, subQuery) => {
        w.in(
          subQuery
            .selectRaw(['user.username', 'username'])
            .from(User, 'user')
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
            .selectRaw(['user.username', 'username'])
            .from(User, 'user')
            .andWhere(
              e => e.isDeleted,
              w => w.isFalse(),
            )
            .getQuery()
        )
      },
    );
});
```

example for `JOIN`:

```typescript
qb.from(User, 'user', subQuery => {
    return subQuery.selectRaw(
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
});
```

## TODOS:

* Support for MongoDB and other DB
* Support for GraphQL
* 

## Samples

Take a look at the samples in [sample](https://github.com/arjunsumarlan/typeorm-query-builder-wrapper/tree/master/sample) for examples of usage.


## Contributing

Learn about contribution [here](https://github.com/arjunsumarlan/typeorm-query-builder-wrapper/blob/master/CONTRIBUTING.md) and how to setup your development environment [here](https://github.com/arjunsumarlan/typeorm-query-builder-wrapper/blob/master/DEVELOPER.md).

